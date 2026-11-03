import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import vm from 'node:vm'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const require = createRequire(import.meta.url), ts = require('typescript')
const repo = fileURLToPath(new URL('../', import.meta.url))
const file = path.join(repo, 'docs/design-studies/code-components/SourceNativeVideoVisibility.tsx')
const source = fs.readFileSync(file, 'utf8')
const filmFile = path.join(repo, 'scripts/fixtures/portfolio-film/desktop.webm')
const posterFile = path.join(repo, 'scripts/fixtures/portfolio-film/desktop.png')
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const output = process.env.MONARCHIC_NATIVE_VIDEO_EVIDENCE_DIR ?? '/tmp/monarchic-native-video-visibility'
const checks = [], samples = [], errors = [], externalRequests = []
const check = (name, condition) => { assert.ok(condition, name); checks.push(name) }
fs.mkdirSync(output, { recursive: true })

// Real DOM library types, with the small public React/Framer surface used here.
const declarations = new Map([
    [path.join(repo, '__native-video-react.d.ts'), `
export interface CSSProperties { [key:string]:string|number|undefined }
export type ForwardedRef<T> = ((value:T|null)=>void)|{current:T|null}|null;
export type ComponentType<P={}> = (props:P)=>unknown;
export function forwardRef<T,P>(f:(props:P,ref:ForwardedRef<T>)=>unknown):ComponentType<P>;
export function useRef<T>(value:T):{current:T};
export function useState<T>(value:T|(()=>T)):[T,(value:T|((old:T)=>T))=>void];
export function useCallback<T extends (...args:any[])=>any>(fn:T,deps:unknown[]):T;
export function useEffect(fn:()=>void|(()=>void),deps:unknown[]):void;
export function createElement(...args:unknown[]):unknown;
declare global { namespace JSX { interface IntrinsicElements { [tag:string]:{[key:string]:unknown} } } }
`],
    [path.join(repo, '__native-video-framer.d.ts'), `
export const RenderTarget:{canvas:string;export:string;thumbnail:string;current():string};
export function useIsStaticRenderer():boolean;
`],
])
const options = {
    strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Node10,
    jsx: ts.JsxEmit.React, baseUrl: repo,
    paths: { react: ['__native-video-react.d.ts'], framer: ['__native-video-framer.d.ts'] },
}
const compilerHost = ts.createCompilerHost(options)
const read = compilerHost.readFile.bind(compilerHost), exists = compilerHost.fileExists.bind(compilerHost)
compilerHost.readFile = name => declarations.get(name) ?? read(name)
compilerHost.fileExists = name => declarations.has(name) || exists(name)
compilerHost.getSourceFile = (name, version) => {
    const text = compilerHost.readFile(name)
    return text === undefined ? undefined : ts.createSourceFile(name, text, version, true)
}
const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([file], options, compilerHost))
check('Strict TypeScript checks the actual DOM media/ref APIs', diagnostics.length === 0 ||
    assert.fail(ts.formatDiagnostics(diagnostics, { getCurrentDirectory: () => repo, getCanonicalFileName: x => x, getNewLine: () => '\n' })))
check('Lifecycle override creates no media/rendering/clock/network workload',
    !/\b(?:requestAnimationFrame|setInterval|setTimeout|fetch|XMLHttpRequest)\s*\(|\bnew\s+(?:Image|Audio|Worker)\s*\(|\bcreateElement\s*\(/.test(source.replace(/React\.createElement/g, '')) &&
    !/\bgetContext\s*\(|\bas any\b|@ts-ignore/.test(source))

const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
}).outputText
const React = require('react'), server = require('react-dom/server')
const exported = {}, mode = { target: 'preview', static: false }
vm.runInNewContext('(function(require,exports){' + compiled + '})(require,exports)', {
    exports: exported,
    require: name => name === 'react' ? React : {
        RenderTarget: { canvas: 'canvas', export: 'export', thumbnail: 'thumbnail', current: () => mode.target },
        useIsStaticRenderer: () => mode.static,
    },
})
check('Existing automatic override and one additive manual override are exported', Object.keys(exported).sort().join() === 'withVisibleManualNativeVideo,withVisibleNativeVideo')
const ServerNative = React.forwardRef(({ playing, ...props }, ref) => React.createElement('div', { ...props, ref, 'data-playing': String(playing) }))
const ServerVideo = exported.withVisibleNativeVideo(ServerNative)
for (const [target, staticFlag] of [['preview', false], ['canvas', false], ['export', false], ['thumbnail', false], ['preview', true]]) {
    mode.target = target; mode.static = staticFlag
    const html = server.renderToString(React.createElement(ServerVideo, {
        playing: true, title: 'Native caller', 'data-native-caller': 'preserved', style: { width: 240, opacity: .8 },
    }, 'Preserved native child'))
    const expectedPlaying = target === 'preview' && !staticFlag ? 'true' : 'false'
    check('SSR ' + target + '/' + staticFlag + ' preserves caller playback before host forwarding and freezes static targets',
        html.includes('data-playing="' + expectedPlaying + '"') && html.includes('data-native-caller="preserved"') &&
        html.includes('data-source-native-video-visibility="awaiting-host"') && html.includes('Preserved native child') && html.includes('opacity:0.8'))
}
const ServerManual = exported.withVisibleManualNativeVideo(ServerNative)
for (const [target, staticFlag] of [['preview', false], ['canvas', false], ['export', false], ['thumbnail', false], ['preview', true]]) {
    mode.target = target; mode.static = staticFlag
    const html = server.renderToString(React.createElement(ServerManual, { playing: true, 'data-native-caller': 'preserved' }, 'Manual native child'))
    check('Manual SSR ' + target + '/' + staticFlag + ' begins paused even before a native host forwards', html.includes('data-playing="false"') && html.includes('Manual native child') && html.includes('data-native-caller="preserved"'))
}
mode.target = 'preview'; mode.static = false
check('An unforwarded live host retains an explicitly paused caller', server.renderToString(
    React.createElement(ServerVideo, { playing: false })).includes('data-playing="false"'))

const result = () => ({
    passed: true, sourceSHA256: hash(source), sourceBytes: Buffer.byteLength(source),
    testSHA256: hash(fs.readFileSync(fileURLToPath(import.meta.url))),
    ownedFilm: { path: 'scripts/fixtures/portfolio-film/desktop.webm', sha256: hash(fs.readFileSync(filmFile)) },
    checks, samples, errors, externalRequests,
    scope: 'Strict TS/SSR and one fresh anonymous Chromium native-like Video host using an existing owned loopback film. Real media currentTime and lifecycle are tested; this is not actual Framer Preview, native component internals, source-art fidelity or editor-reload proof.',
    actualFramerPreviewVerified: false, afterEditorReload: false,
})
if (process.argv.includes('--strict-only')) {
    fs.writeFileSync(path.join(output, 'strict-result.json'), JSON.stringify(result(), null, 2) + '\n')
    console.log(JSON.stringify({ passed: true, checks: checks.length, strictOnly: true, evidence: output }))
    process.exit(0)
}

const assets = new Map([['/desktop.webm', { file: filmFile, type: 'video/webm' }], ['/desktop.png', { file: posterFile, type: 'image/png' }]])
const httpServer = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname
    if (pathname === '/') { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><style>body{margin:0}#owner{margin:30px;width:240px;height:135px}video{width:240px;height:135px;display:block}#sentinel{position:absolute;left:0;top:0}</style><div id="owner"><div id="mount"></div></div><div style="height:2200px"></div>'); return }
    const asset = assets.get(pathname)
    if (!asset) { response.writeHead(404); response.end(); return }
    const bytes = fs.readFileSync(asset.file), range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range ?? '')
    response.setHeader('Content-Type', asset.type); response.setHeader('Accept-Ranges', 'bytes')
    if (range) {
        const start = Number(range[1]), end = Math.min(bytes.length - 1, range[2] ? Number(range[2]) : bytes.length - 1)
        if (start >= bytes.length || end < start) { response.writeHead(416, { 'Content-Range': 'bytes */' + bytes.length }); response.end(); return }
        response.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${bytes.length}`, 'Content-Length': end - start + 1 })
        response.end(bytes.subarray(start, end + 1))
    } else { response.setHeader('Content-Length', bytes.length); response.end(bytes) }
})
await new Promise(resolve => httpServer.listen(0, '127.0.0.1', resolve))
const origin = 'http://127.0.0.1:' + httpServer.address().port
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'native-video-isolated-'))
let context
try {
    context = await chromium.launchPersistentContext(profile, {
        headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        viewport: { width: 640, height: 480 }, args: ['--disable-dev-shm-usage'],
    })
    await context.route('**/*', route => {
        if (route.request().url().startsWith(origin + '/')) return route.continue()
        externalRequests.push(route.request().url()); return route.abort()
    })
    const page = context.pages()[0]
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(origin)
    for (const name of ['react', 'react-dom']) await page.addScriptTag({ content: fs.readFileSync(path.join(path.dirname(require.resolve(name + '/package.json')), 'umd/' + name + '.development.js'), 'utf8') })
    await page.evaluate(() => {
        window.__target = 'preview'; window.__static = false; window.__hidden = false
        window.__refs = []; window.__objectRef = React.createRef(); window.__events = { pointer: 0, play: 0, pause: 0 }
        window.__work = { raf: 0, timeout: 0, interval: 0 }; window.__observers = new Set(); window.__listeners = []
        const ownedStack = () => new Error().stack?.includes('native-video-module.js')
        for (const [method, key] of [['requestAnimationFrame', 'raf'], ['setTimeout', 'timeout'], ['setInterval', 'interval']]) {
            const original = window[method].bind(window)
            window[method] = (...args) => { if (ownedStack()) __work[key]++; return original(...args) }
        }
        for (const name of ['IntersectionObserver', 'MutationObserver']) {
            const Original = window[name]
            const Tracked = class extends Original {
                constructor(...args) { super(...args); this.targets = new Set(); __observers.add(this) }
                observe(target, ...rest) { this.targets.add(target); __observers.add(this); return super.observe(target, ...rest) }
                disconnect() { this.targets.clear(); __observers.delete(this); return super.disconnect() }
            }
            if (name === 'IntersectionObserver') Tracked.prototype.unobserve = function (target) { this.targets.delete(target); return Original.prototype.unobserve.call(this, target) }
            window[name] = Tracked
        }
        const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener
        EventTarget.prototype.addEventListener = function (type, listener, options) {
            if (ownedStack()) __listeners.push({ target: this, type, listener })
            return add.call(this, type, listener, options)
        }
        EventTarget.prototype.removeEventListener = function (type, listener, options) {
            __listeners = __listeners.filter(entry => entry.target !== this || entry.type !== type || entry.listener !== listener)
            return remove.call(this, type, listener, options)
        }
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => __hidden })
        window.setHidden = value => { __hidden = value; document.dispatchEvent(new Event('visibilitychange')) }
        window.__originalPlay = HTMLMediaElement.prototype.play
        window.__delayPlay = false; window.__pendingPlays = new Map(); window.__playCalls = 0
        HTMLMediaElement.prototype.play = function () {
            __playCalls++
            if (!__delayPlay) return __originalPlay.call(this)
            if (!__pendingPlays.has(this)) {
                let resolve, reject
                const promise = new Promise((yes, no) => { resolve = yes; reject = no })
                __pendingPlays.set(this, { video: this, promise, resolve, reject })
            }
            return __pendingPlays.get(this).promise
        }
        window.releasePending = async () => {
            __delayPlay = false
            const pending = [...__pendingPlays.values()]; __pendingPlays.clear()
            await Promise.all(pending.map(async entry => {
                try { await __originalPlay.call(entry.video); entry.resolve() } catch (error) { entry.reject(error) }
            }))
            await Promise.resolve()
        }
    })
    await page.addScriptTag({ content: '(function(){const exports={};const require=name=>name==="react"?window.React:{RenderTarget:{canvas:"canvas",export:"export",thumbnail:"thumbnail",current:()=>__target},useIsStaticRenderer:()=>__static};' + compiled + ';window.VideoAPI=exports;})()\n//# sourceURL=native-video-module.js' })
    await page.evaluate(() => {
        const E = React.createElement
        const Native = React.forwardRef(({ playing, callerPlaying, lazy, empty, hostTag, videoKey, objectRef, manual, children, ...props }, ref) => {
            const [admitted, setAdmitted] = React.useState(!lazy), media = React.useRef(null)
            React.useEffect(() => { if (playing) setAdmitted(true) }, [playing])
            React.useEffect(() => {
                const video = media.current
                if (!video) return
                if (playing) video.play()?.catch(() => {})
                else video.pause()
                return () => video.pause()
            }, [playing, admitted, empty, videoKey])
            return E(hostTag, { ...props, ref, 'data-native-playing': String(playing) },
                !empty && admitted ? E('div', { id: 'native-player-inner' }, E('video', { key: videoKey, id: 'film', ref: media, src: '/desktop.webm', poster: '/desktop.png', muted: true, loop: true, controls: true, playsInline: true, preload: 'auto' })) : null,
                children)
        })
        const Managed = VideoAPI.withVisibleNativeVideo(Native), Manual = VideoAPI.withVisibleManualNativeVideo(Native)
        const callerRef = node => { __refs.push(node); window.__callerRef = node }
        window.app = ReactDOM.createRoot(document.getElementById('mount'))
        window.fixture = { key: 0, callerPlaying: true, lazy: false, empty: false, hostTag: 'div', videoKey: 0, objectRef: false }
        window.render = patch => {
            Object.assign(fixture, patch)
            ReactDOM.flushSync(() => app.render(E(fixture.manual ? Manual : Managed, {
                ...fixture, playing: fixture.callerPlaying, id: 'native-host', title: 'Caller native video', 'data-caller': 'preserved',
                ref: fixture.objectRef ? __objectRef : callerRef,
                style: { width: 240, height: 135, position: 'relative' },
                onPointerDown: () => __events.pointer++, onPlay: () => __events.play++, onPause: () => __events.pause++,
            }, E('span', { id: 'sentinel' }, 'Preserved child'))))
        }
        window.snapshot = () => {
            const host = document.getElementById('native-host'), video = host?.getElementsByTagName('video')[0]
            return { host: host?.tagName, playing: host?.dataset.nativePlaying, admitted: host?.dataset.sourceNativeVideoActive,
                media: video ? { time: video.currentTime, paused: video.paused, ready: video.readyState, width: video.videoWidth, height: video.videoHeight, source: video.getAttribute('src'), poster: video.getAttribute('poster'), loop: video.loop, muted: video.muted, controls: video.controls } : null,
                observers: __observers.size, listeners: __listeners.length, pending: __pendingPlays.size, work: { ...__work } }
        }
        render()
    })
    const wait = predicate => page.waitForFunction(predicate, null, { timeout: 5000, polling: 25 })
    const playing = async () => wait(() => { const s = snapshot(); return s.media?.ready >= 2 && !s.media.paused && s.playing === 'true' })
    const hold = async (name, expectedPlaying = 'false') => {
        await page.waitForFunction(expected => snapshot().media?.paused && snapshot().playing === expected,
            expectedPlaying, { timeout: 5000, polling: 25 })
        const before = await page.evaluate(() => snapshot())
        await page.waitForTimeout(220)
        const after = await page.evaluate(() => snapshot())
        check(name, after.media.paused && Math.abs(after.media.time - before.media.time) < .025)
        samples.push({ state: name, before, after })
    }
    await playing()
    const visible = await page.evaluate(() => snapshot())
    await page.waitForTimeout(350)
    const advanced = await page.evaluate(() => snapshot())
    check('Actual owned video decodes and currentTime advances while visibly admitted',
        visible.media.width > 0 && advanced.media.time > visible.media.time + .08)
    check('Native source/poster/loop/mute/controls, props, child and callback ref survive', await page.evaluate(() => {
        const host = document.getElementById('native-host'), v = document.getElementById('film')
        return __callerRef === host && host.dataset.caller === 'preserved' && host.title === 'Caller native video' &&
            document.getElementById('sentinel').textContent === 'Preserved child' && v.getAttribute('src') === '/desktop.webm' &&
            v.getAttribute('poster') === '/desktop.png' && v.loop && v.muted && v.controls
    }))
    await page.dispatchEvent('#native-host', 'pointerdown')
    check('Caller native pointer and media event handlers remain forwarded', await page.evaluate(() => __events.pointer === 1 && __events.play > 0))

    await page.evaluate(() => scrollTo(0, 1000)); await hold('Actual offscreen intersection pauses and holds the decoded frame')
    await page.evaluate(() => scrollTo(0, 0)); await playing()
    await page.evaluate(() => setHidden(true)); await hold('Emulated hidden document pauses and holds currentTime')
    await page.evaluate(() => setHidden(false)); await playing()
    await page.evaluate(() => document.getElementById('owner').style.opacity = '0'); await hold('Transparent ancestor suspends playback')
    await page.evaluate(() => document.getElementById('owner').style.opacity = '1'); await playing()
    await page.evaluate(() => document.getElementById('native-host').hidden = true); await hold('Hidden native host suspends playback')
    await page.evaluate(() => document.getElementById('native-host').hidden = false); await playing()
    await page.evaluate(() => document.getElementById('film').style.opacity = '0'); await hold('Transparent nested native video holds media while host permission permits lazy mounting', 'true')
    await page.evaluate(() => document.getElementById('film').style.opacity = '1'); await playing()
    await page.evaluate(() => document.getElementById('native-player-inner').style.opacity = '0'); await hold('A transparent internal native-player wrapper holds media without blocking lazy permission', 'true')
    await page.evaluate(() => document.getElementById('native-player-inner').style.opacity = '1'); await playing()
    await page.addStyleTag({ content: '@keyframes native-player-hide { from { opacity: 1 } to { opacity: 0 } } .native-player-hide { animation: native-player-hide 180ms linear forwards }' })
    await page.evaluate(() => {
        const node = document.getElementById('owner')
        node.style.transition = 'opacity 180ms linear'
        getComputedStyle(node).opacity
        node.style.opacity = '0'
    })
    await wait(() => getComputedStyle(document.getElementById('owner')).opacity === '0')
    await hold('A completed CSS opacity transition on an ancestor suspends playback')
    await page.evaluate(() => {
        const node = document.getElementById('owner')
        node.style.transition = 'none'; node.style.opacity = '1'
    }); await playing()
    await page.evaluate(() => document.getElementById('native-player-inner').classList.add('native-player-hide'))
    await wait(() => getComputedStyle(document.getElementById('native-player-inner')).opacity === '0')
    await hold('A completed CSS opacity animation on an internal wrapper suspends playback', 'true')
    await page.evaluate(() => document.getElementById('native-player-inner').classList.remove('native-player-hide')); await playing()
    await page.emulateMedia({ reducedMotion: 'reduce' }); await hold('Actual reduced-motion media query keeps the native video still')
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await playing()

    await page.evaluate(() => document.getElementById('film').pause()); await hold('Native manual Pause is respected while visible')
    await page.evaluate(() => scrollTo(0, 1000)); await page.waitForTimeout(80)
    await page.evaluate(() => scrollTo(0, 0)); await hold('A viewport return does not override native manual Pause')
    await page.evaluate(() => document.getElementById('film').play()); await playing()
    check('Native manual Play can resume after the retained Pause', await page.evaluate(() => __events.pause > 0 && snapshot().playing === 'true'))

    await page.evaluate(() => { window.oldVideo = document.getElementById('film'); render({ videoKey: 1 }) }); await playing()
    check('Video replacement pauses the detached video and admits its real successor', await page.evaluate(() => !oldVideo.isConnected && oldVideo.paused && document.getElementById('film') !== oldVideo))
    await page.evaluate(() => { document.getElementById('film').pause() }); await hold('Manual Pause remains an owned native state before replacement')
    await page.evaluate(() => render({ videoKey: 2 })); await hold('Replacing a native video does not discard manual Pause')
    await page.evaluate(() => { window.oldHost = document.getElementById('native-host'); render({ hostTag: 'section', objectRef: true }) })
    await wait(() => snapshot().admitted === 'true' && snapshot().media?.paused)
    await hold('Replacing a visible native host retains manual Pause')
    check('Host replacement moves observers and preserves an object ref', await page.evaluate(() => __objectRef.current === document.getElementById('native-host') && !oldHost.isConnected && [...__observers].every(observer => !observer.targets.has(oldHost))))
    await page.evaluate(() => document.getElementById('film').play()); await playing()

    for (const [target, staticFlag] of [['canvas', false], ['export', false], ['thumbnail', false], ['preview', true]]) {
        await page.evaluate(([target, value]) => { __target = target; __static = value; render() }, [target, staticFlag])
        await hold(target + '/' + staticFlag + ' freezes the actual native media and Playing prop')
    }
    await page.evaluate(() => { __target = 'preview'; __static = false; render({ key: 1, callerPlaying: false, lazy: true, videoKey: 2 }) }); await playing()
    check('Playing permission admits a lazily mounted native video without a circular wait', await page.evaluate(() => snapshot().media.ready >= 2 && snapshot().playing === 'true'))
    await page.evaluate(() => render({ key: 2, empty: true })); await wait(() => snapshot().playing === 'true' && !snapshot().media)
    await page.evaluate(() => {
        const video = document.createElement('video'); video.id = 'late-video'; video.src = '/desktop.webm'; video.muted = true; video.loop = true
        document.getElementById('native-host').prepend(video)
    }); await playing()
    check('A late DOM video is discovered and played through the existing native host', await page.evaluate(() => snapshot().media.ready >= 2 && document.querySelectorAll('video').length === 1))

    await page.evaluate(() => { __delayPlay = true; render({ key: 3, empty: false, lazy: false, videoKey: 3 }) })
    await wait(() => __pendingPlays.size === 1 && snapshot().admitted === 'true')
    await page.evaluate(() => document.getElementById('owner').style.opacity = '0')
    await wait(() => snapshot().playing === 'false')
    await page.evaluate(() => releasePending()); await hold('An asynchronous play completion cannot escape a visibility suspension')
    await page.evaluate(() => { document.getElementById('owner').style.opacity = '1' }); await playing()
    await page.evaluate(() => { __delayPlay = true; render({ key: 4, videoKey: 4 }) })
    await wait(() => __pendingPlays.size === 1 && snapshot().admitted === 'true')
    await page.evaluate(() => { window.retiredVideo = document.getElementById('film'); ReactDOM.flushSync(() => app.unmount()) })
    await page.evaluate(() => releasePending())
    await wait(() => retiredVideo.paused)
    const retiredTime = await page.evaluate(() => retiredVideo.currentTime)
    await page.waitForTimeout(220)
    check('A real delayed play after unmount is paused and cannot advance the detached film', await page.evaluate(time => retiredVideo.paused && Math.abs(retiredVideo.currentTime - time) < .025, retiredTime))
    check('Unmount releases source listeners, observers, refs and pending work', await page.evaluate(() => __observers.size === 0 && __listeners.length === 0 && __objectRef.current === null && __pendingPlays.size === 0 && Object.values(__work).every(value => value === 0)))
    const automaticChecks = checks.length
    await page.evaluate(() => {
        window.app = ReactDOM.createRoot(document.getElementById('mount'))
        __target = 'preview'; __static = false; __delayPlay = false
        window.manualCallsBefore = __playCalls
        render({ manual: true, key: 5, callerPlaying: true, lazy: false, empty: false, hostTag: 'div', videoKey: 5, objectRef: true })
    })
    await wait(() => snapshot().admitted === 'true' && snapshot().media?.ready >= 2 && snapshot().playing === 'false')
    await hold('Manual mode admits native controls without autoplay or a Playing-true bootstrap')
    check('Manual initial visible admission creates zero play calls despite caller Playing true', await page.evaluate(() => __playCalls === manualCallsBefore && snapshot().media.time === 0))
    await page.evaluate(() => scrollTo(0, 1000)); await wait(() => snapshot().admitted === 'false')
    await page.evaluate(() => document.getElementById('film').play()?.catch(() => {}))
    await hold('An unstarted hidden native Play is immediately held and does not mark manual mode started')
    await page.evaluate(() => scrollTo(0, 0)); await wait(() => snapshot().admitted === 'true')
    await hold('The first visible return remains paused after a rejected hidden Play')
    await page.evaluate(() => document.getElementById('film').play()); await playing()
    const manualStart = await page.evaluate(() => snapshot().media.time)
    await page.waitForTimeout(250)
    check('An actually admitted native Play starts the existing decoded film and Playing prop', await page.evaluate(time => snapshot().media.time > time + .08 && snapshot().playing === 'true', manualStart))
    await page.evaluate(() => scrollTo(0, 1000)); await hold('A previously started manual film suspends while offscreen')
    await page.evaluate(() => scrollTo(0, 0)); await playing()
    check('A visibility return resumes only the previously started unpaused manual film', await page.evaluate(() => !snapshot().media.paused))
    await page.evaluate(() => document.getElementById('film').pause()); await hold('Manual native Pause remains explicit after first start')
    await page.evaluate(() => scrollTo(0, 1000)); await wait(() => snapshot().admitted === 'false')
    await page.evaluate(() => scrollTo(0, 0)); await wait(() => snapshot().admitted === 'true')
    await hold('Manual native Pause survives the viewport round trip')
    await page.evaluate(() => { window.manualOldVideo = document.getElementById('film'); render({ videoKey: 6 }) })
    await wait(() => document.getElementById('film') !== manualOldVideo && snapshot().media?.ready >= 2)
    await hold('Replacing the manual native video preserves the user Pause')
    await page.evaluate(() => { window.manualOldHost = document.getElementById('native-host'); render({ hostTag: 'section' }) })
    await wait(() => snapshot().admitted === 'true' && snapshot().media?.ready >= 2)
    await hold('Replacing the manual native host also preserves user Pause')
    check('Manual replacements release detached host/video ownership and retain the genuine object ref', await page.evaluate(() => manualOldVideo.paused && !manualOldHost.isConnected && __objectRef.current === document.getElementById('native-host') && [...__observers].every(o => !o.targets.has(manualOldHost))))
    await page.evaluate(() => document.getElementById('film').play()); await playing()
    await page.evaluate(() => document.getElementById('owner').style.opacity = '0'); await hold('Closing a native-sheet ancestor suspends a started manual film')
    await page.evaluate(() => document.getElementById('owner').style.opacity = '1'); await playing()
    await page.evaluate(() => { __target = 'canvas'; render() }); await hold('Canvas freezes a previously started manual film')
    await page.evaluate(() => { __target = 'preview'; render() }); await playing()
    await page.evaluate(() => ReactDOM.flushSync(() => app.unmount()))
    check('Manual cleanup leaves no listeners, observers, native refs or added clock workload', await page.evaluate(() => __observers.size === 0 && __listeners.length === 0 && __objectRef.current === null && __pendingPlays.size === 0 && Object.values(__work).every(v => v === 0)))
    samples.push({ state: 'manual-cleanup', automaticChecks, resources: await page.evaluate(() => ({ observers: __observers.size, listeners: __listeners.length, work: __work })) })
    check('Only owned loopback assets were requested and no browser runtime errors occurred', externalRequests.length === 0 && errors.length === 0)
    samples.push({ state: 'visible', visible, advanced }, { state: 'cleanup', resources: await page.evaluate(() => ({ observers: __observers.size, listeners: __listeners.length, work: __work })) })
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result(), null, 2) + '\n')
    console.log(JSON.stringify({ passed: true, checks: checks.length, sourceSHA256: hash(source), evidence: output }))
} catch (error) {
    fs.writeFileSync(path.join(output, 'failure.json'), JSON.stringify({ message: String(error), checks, samples, errors, externalRequests }, null, 2) + '\n')
    throw error
} finally {
    await context?.close()
    await new Promise(resolve => httpServer.close(resolve))
    fs.rmSync(profile, { recursive: true, force: true })
}
