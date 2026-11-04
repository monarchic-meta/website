import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import vm from 'node:vm'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url), ts = require('typescript')
const repo = fileURLToPath(new URL('../', import.meta.url))
const sourcePath = process.env.MONARCHIC_AJEDREZ_SOURCE_PATH ?? path.join(repo, 'docs/design-studies/code-components/SourceAjedrezSequence.tsx')
const fixturePath = path.join(repo, 'scripts/fixtures/source-ajedrez-measured-word-fits.json')
const source = fs.readFileSync(sourcePath, 'utf8'), fixture = JSON.parse(fs.readFileSync(fixturePath))
// Keep the historical five-frame assertions available for explicit E1 inputs.
// The current source is validated by the stronger 74-frame continuation suite.
if (source.includes('AJEDREZ_TYPE_ACTOR43_FITS')) {
    process.env.MONARCHIC_AJEDREZ_ACTOR43_EVIDENCE_DIR ??= process.env.MONARCHIC_AJEDREZ_WORD_FITS_EVIDENCE_DIR ?? '/tmp/monarchic-ajedrez-measured-word-fits'
    console.log(JSON.stringify({compatibility:'source-ajedrez-measured-word-fits',scope:'actor43-additive-60'}))
    await import('./check-source-ajedrez-actor43-additive.mjs')
    process.exit(0)
}
if (source.includes('AJEDREZ_TYPE_ACTOR3_FITS')) {
    process.env.MONARCHIC_AJEDREZ_ACTOR3_EVIDENCE_DIR ??= process.env.MONARCHIC_AJEDREZ_WORD_FITS_EVIDENCE_DIR ?? '/tmp/monarchic-ajedrez-measured-word-fits'
    console.log(JSON.stringify({compatibility:'source-ajedrez-measured-word-fits',scope:'actor3-additive-51'}))
    await import('./check-source-ajedrez-actor3-additive.mjs')
    process.exit(0)
}
if (source.includes('function ajedrezTypeTrackedActor(')) {
    process.env.MONARCHIC_AJEDREZ_WORD_EXTENSION_EVIDENCE_DIR ??= process.env.MONARCHIC_AJEDREZ_WORD_FITS_EVIDENCE_DIR ?? '/tmp/monarchic-ajedrez-measured-word-fits'
    await import('./check-source-ajedrez-two-track-extension.mjs')
    process.exit(0)
}
const oldFixture = JSON.parse(fs.readFileSync(path.join(repo, 'docs/design-studies/code-components/assets/source-ajedrez-type-grid-provenance.json')))
const output = process.env.MONARCHIC_AJEDREZ_WORD_FITS_EVIDENCE_DIR ?? '/tmp/monarchic-ajedrez-measured-word-fits'
fs.mkdirSync(output, { recursive: true })
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const pins = { sourceSHA256: hash(source), sourceBytes: Buffer.byteLength(source), checkerSHA256: hash(fs.readFileSync(import.meta.filename)), fixtureSHA256: hash(fs.readFileSync(fixturePath)) }
const checks = [], reports = [], errors = [], requests = []
const check = (name, value) => { assert.ok(value, name); checks.push(name) }
const compilerOptions = { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React }
let browser, server
try {
    let previous = source
    for (const patch of fixture.inversePatches) {
        assert.equal(previous.split(patch.after).length - 1, 1, patch.name + ': exact inverse occurrence')
        previous = previous.replace(patch.after, patch.before)
    }
    check('Only the declared sparse-fit/cache edits differ from the immutable a804 source', hash(previous) === fixture.parent.sha256 && Buffer.byteLength(previous) === fixture.parent.bytes)
    const ast = text => ts.createSourceFile('source.tsx', text, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX)
    const publicBodies = text => ast(text).statements.filter(node => ts.isFunctionDeclaration(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)).map(node => [node.name.text, node.getText()])
    const oldBodies = publicBodies(previous), bodies = publicBodies(source)
    check('All46 public override names/types remain; the45 unrelated public bodies are byte-exact', bodies.length === 46 && JSON.stringify(bodies.map(([name]) => name)) === JSON.stringify(oldBodies.map(([name]) => name)) && bodies.every(([name, body], index) => name === 'withAjedrezTypeGridMotion' || body === oldBodies[index][1]))
    const photoMarker = '\n// Source-cut photographic compositions.'
    check('All166 photo poses/material/controller bytes and the master clock stay unchanged', source.slice(source.indexOf(photoMarker)) === previous.slice(previous.indexOf(photoMarker)) && source.slice(0, source.indexOf('// Source-sampled HERO-002 type-grid')) === previous.slice(0, previous.indexOf('// Source-sampled HERO-002 type-grid')))
    const tableOf = text => text.slice(text.indexOf('const AJEDREZ_TYPE_WORDS'), text.indexOf('/** Attach only to the existing phase36'))
    const pureJS = ts.transpileModule(tableOf(source), { compilerOptions: { ...compilerOptions, module: ts.ModuleKind.None } }).outputText
    const pure = vm.runInNewContext(pureJS + ';({AJEDREZ_TYPE_WORDS,AJEDREZ_TYPE_RULES,AJEDREZ_TYPE_SAMPLES,AJEDREZ_TYPE_MEASURED_FITS,ajedrezTypeSample,ajedrezTypeMeasuredOwner,ajedrezTypeMeasuredFrame,ajedrezTypeMeasuredFit,ajedrezInsetScoreVisible})')
    const oldPure = vm.runInNewContext(ts.transpileModule(tableOf(previous), { compilerOptions: { ...compilerOptions, module: ts.ModuleKind.None } }).outputText + ';({AJEDREZ_TYPE_WORDS,AJEDREZ_TYPE_RULES,AJEDREZ_TYPE_SAMPLES})')
    for (const key of ['AJEDREZ_TYPE_WORDS', 'AJEDREZ_TYPE_RULES', 'AJEDREZ_TYPE_SAMPLES']) assert.deepEqual(JSON.parse(JSON.stringify(pure[key])), JSON.parse(JSON.stringify(oldPure[key])))
    check('All84 independent identities,24 rules and12 representative samples remain exact', pure.AJEDREZ_TYPE_WORDS.length === 84 && oldFixture.words.length === 84 && pure.AJEDREZ_TYPE_RULES.length === 24 && pure.AJEDREZ_TYPE_SAMPLES.length === 12)
    for (const row of fixture.rows) for (let index = 0; index < 84; index++) {
        const expected = row.positions.find(position => position[0] === index)
        const got = pure.ajedrezTypeMeasuredFit(row.frame, index)
        assert.deepEqual(got ? JSON.parse(JSON.stringify(got)) : null, expected ? { left: expected[1], top: expected[2], width: expected[3] } : null)
    }
    for (const time of [0, 1168 / 24, 1169 / 24 - 1e-5, 1174 / 24, 1226 / 24, NaN, Infinity, -1]) assert.equal(pure.ajedrezTypeMeasuredFrame(time), -1)
    for (const n of [1169, 1170, 1171, 1172, 1173]) {
        assert.equal(pure.ajedrezTypeMeasuredFrame(n / 24), n)
        assert.equal(pure.ajedrezTypeMeasuredFrame((n + .99) / 24), n)
    }
    check('The private table supplies only actors60/25 for literal frames1169..1173, with exact exclusive boundaries and no interpolation', pure.AJEDREZ_TYPE_MEASURED_FITS.length === 5)
    const hostA = {}, hostB = {}
    check('One weak module-local dependency token is stable per host, distinct for replacement hosts, and null for no host', pure.ajedrezTypeMeasuredOwner(hostA) === pure.ajedrezTypeMeasuredOwner(hostA) && pure.ajedrezTypeMeasuredOwner(hostA) !== pure.ajedrezTypeMeasuredOwner(hostB) && pure.ajedrezTypeMeasuredOwner(null) === null)
    const held = pure.ajedrezTypeSample(1169 / 24)
    assert.equal(held.sourceFrame, 1172)
    for (const actor of fixture.actors) {
        const index = actor.nativeActor.wordIndex, anchor = actor.poses.find(pose => pose.frame === 1172).logical480
        assert.deepEqual(anchor, { left: held.xy[index * 2], top: held.xy[index * 2 + 1], sourceWidth: held.widths[index] })
        assert.equal(actor.retainedAnchorEvidence.reviewNeeded, false)
        const first = actor.poses[0].logical480
        assert.ok(Math.hypot(first.left - anchor.left, first.top - anchor.top) > 150)
    }
    check('The1172 anchors remain exact and the old held1172 baseline fails both measured1169 positions by>150logicalpx', true)
    for (const frame of [1192, 1193, 1194, 1195, 1196]) assert.equal(pure.ajedrezInsetScoreVisible(frame / 24), frame >= 1193 && frame < 1196)
    const owned = source.slice(source.indexOf('// Two existing independent-word actors'), source.indexOf(photoMarker))
    check('The sparse fit adds no timer/RAF/media/GPU/import or DOM search beyond the existing host-scoped controller', !/requestAnimationFrame|setTimeout|setInterval|fetch\(|getContext\(|new Image|import\s/.test(owned) && (owned.match(/new ResizeObserver/g) ?? []).length === 1 && (owned.match(/new MutationObserver/g) ?? []).length === 1)
    const reactTypes = `export type ReactNode=unknown;export interface CSSProperties{opacity?:number;visibility?:string;pointerEvents?:string;transition?:string;zoom?:number|string};export type ComponentType<P>=(p:P)=>unknown;export type ForwardedRef<T>=((n:T|null)=>void)|{current:T|null}|null;export interface MouseEvent<T>{defaultPrevented:boolean;currentTarget:T;preventDefault():void};export interface KeyboardEvent<T>extends MouseEvent<T>{key:string};export type MouseEventHandler<T>=(e:MouseEvent<T>)=>void;export type KeyboardEventHandler<T>=(e:KeyboardEvent<T>)=>void;export interface Context<T>{Provider:ComponentType<{value:T;children?:unknown}>;__type?:T};export function createContext<T>(v:T):Context<T>;export function useContext<T>(v:Context<T>):T;export function useRef<T>(v:T):{current:T};export function useRef<T>(v:T|null):{readonly current:T|null};export function useState<T>(v:T):[T,(v:T|((p:T)=>T))=>void];export function useEffect(f:()=>void|(()=>void),d:unknown[]):void;export function useLayoutEffect(f:()=>void|(()=>void),d:unknown[]):void;export function useCallback<T extends Function>(f:T,d:unknown[]):T;export function forwardRef<T,P>(f:(p:P,r:ForwardedRef<T>)=>unknown):ComponentType<P>;export function createElement(...a:unknown[]):unknown;declare global{namespace JSX{interface IntrinsicElements{[tag:string]:{[name:string]:unknown}}}}`
    const declarations = new Map([[path.join(repo, '__measured-react.d.ts'), reactTypes], [path.join(repo, '__measured-framer.d.ts'), 'export const RenderTarget:{canvas:string;export:string;thumbnail:string;current():string};export function useIsStaticRenderer():boolean;']])
    const strictOptions = { strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2020, lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'], module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Node10, jsx: ts.JsxEmit.React, baseUrl: repo, paths: { react: ['__measured-react.d.ts'], framer: ['__measured-framer.d.ts'] } }
    const host = ts.createCompilerHost(strictOptions), readFile = host.readFile.bind(host), exists = host.fileExists.bind(host)
    host.readFile = file => file === sourcePath ? source : declarations.get(file) ?? readFile(file)
    host.fileExists = file => declarations.has(file) || exists(file)
    host.getSourceFile = (file, languageVersion) => { const text = host.readFile(file); return text === undefined ? undefined : ts.createSourceFile(file, text, languageVersion, true) }
    const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([sourcePath], strictOptions, host))
    assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory: () => repo, getCanonicalFileName: value => value, getNewLine: () => '\n' }))
    check('The complete candidate passes strict ES2020/DOM semantic types with nullable/readonly React18 ref overloads', true)
    const js = ts.transpileModule(source, { compilerOptions }).outputText, previousJS = ts.transpileModule(previous, { compilerOptions }).outputText
    const React = require('react'), renderer = require('react-dom/server')
    for (const target of ['canvas', 'export', 'thumbnail']) {
        const sandbox = { exports: {}, require: name => name === 'react' ? React : { RenderTarget: { canvas: 'canvas', export: 'export', thumbnail: 'thumbnail', current: () => target }, useIsStaticRenderer: () => true } }
        vm.runInNewContext(js, sandbox)
        const Native = React.forwardRef((props, ref) => React.createElement('section', { ...props, ref }))
        const Grid = sandbox.exports.withAjedrezTypeGridMotion(Native)
        const html = renderer.renderToStaticMarkup(React.createElement(Grid, { title: 'caller preserved', style: { left: 7, transform: 'scale(.8)' }, 'data-caller': 'preserved' }, React.createElement('b', null, 'editable native content')))
        assert.ok(html.includes('caller preserved') && html.includes('editable native content') && html.includes('left:7px') && html.includes('scale(.8)') && html.includes('data-caller="preserved"'))
        assert.equal(Object.keys(sandbox.exports).length, 46)
    }
    check('Actual React18 SSR preserves caller style/attrs/editable content and all46 exports for every static target', true)
    const staticResult = { passed: true, ...pins, checks: [...checks], scope: 'Narrow two-actor numeric/lineage/type/SSR proof only; no browser/native/actualPreview claim.' }
    fs.writeFileSync(path.join(output, 'static-result.json'), JSON.stringify(staticResult, null, 2) + '\n')
    if (process.argv.includes('--static-only')) { console.log(JSON.stringify(staticResult, null, 2)); process.exit(0) }

    const mediaRoot = process.env.MONARCHIC_AJEDREZ_WORD_MEDIA_ROOT ?? path.join(repo, 'scripts/fixtures/source-ajedrez-word-frames')
    const media = new Map(fixture.sourceFrames.map(frame => {
        const file = path.join(mediaRoot, frame.relativePath), bytes = fs.readFileSync(file)
        assert.equal(hash(bytes), frame.sha256, frame.relativePath + ' exact cached source bytes')
        assert.equal(bytes.length, frame.bytes)
        assert.equal(bytes.readUInt32BE(16), 480); assert.equal(bytes.readUInt32BE(20), 852)
        return [frame.frame, bytes]
    }))
    check('All five corresponding retained source PNGs have exact pinned bytes and480×852 dimensions', media.size === 5)
    server = http.createServer((request, response) => {
        if (request.url === '/' || request.url === '/fixture.html') { response.writeHead(200, { 'Content-Type': 'text/html' }); response.end('<!doctype html><div id="app"></div>'); return }
        if (request.url === '/favicon.ico') { response.writeHead(204); response.end(); return }
        const match = /^\/frame-(\d+)\.png$/.exec(request.url)
        if (match && media.has(Number(match[1]))) { requests.push(request.url); response.writeHead(200, { 'Content-Type': 'image/png' }); response.end(media.get(Number(match[1]))); return }
        response.writeHead(404); response.end('Not in the bounded fixture')
    })
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    const base = 'http://127.0.0.1:' + server.address().port
    const { chromium } = await import('@playwright/test')
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] })
    const context = await browser.newContext({ viewport: { width: 1100, height: 980 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    page.setDefaultTimeout(5000); page.on('pageerror', error => errors.push(error.message))
    await page.goto(base)
    await page.addStyleTag({ content: 'html,body{margin:0;background:#eee;font:12px Arial}#comparison{display:flex;gap:20px;margin:10px;width:max-content}header{height:25px}#source-field{position:relative;width:480px;height:852px}#source-frame{display:block;width:100%;height:100%}.source-box{position:absolute;border:1px solid #c25;pointer-events:none;box-sizing:border-box}.word{position:absolute;white-space:pre;width:54px;font:8px/10px monospace;color:#202724}.word p{margin:0}.rule{position:absolute;background:#999;opacity:.5}#outside{position:absolute;left:1030px;top:20px}' })
    const react = fs.readFileSync(path.join(path.dirname(require.resolve('react/package.json')), 'umd/react.development.js'), 'utf8')
    const reactDOM = fs.readFileSync(path.join(path.dirname(require.resolve('react-dom/package.json')), 'umd/react-dom.development.js'), 'utf8')
    await page.addScriptTag({ content: react }); await page.addScriptTag({ content: reactDOM })
    await page.evaluate(() => {
        document.getElementById('app').innerHTML = '<div id="comparison"><div><header id="source-label">Retained source frame</header><div id="source-field"><img id="source-frame" alt="Retained source film comparison"><div id="source-boxes"></div></div></div><div><header>Independent native strings:2 measured fits /82 held actors</header><div id="native-mount"></div></div></div><div id="baseline-mount" style="position:absolute;left:2000px;top:0"></div><div id="outside"></div>'
        window.__target = 'preview'; window.__frames = new Set(); window.__observers = new Set(); window.__observerCreates = 0; window.__reads = 0; window.__clicks = 0; window.__refCalls = []
        window.__originalRange = document.createRange.bind(document)
        document.createRange = () => { __reads++; return __originalRange() }
        const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window)
        window.requestAnimationFrame = callback => { const id = request(time => { __frames.delete(id); callback(time) }); __frames.add(id); return id }
        window.cancelAnimationFrame = id => { __frames.delete(id); cancel(id) }
        for (const name of ['ResizeObserver', 'MutationObserver']) { const Original = window[name]; window[name] = class extends Original { constructor(...args) { super(...args); __observerCreates++; __observers.add(this) } disconnect() { __observers.delete(this); super.disconnect() } } }
        window.require = name => name === 'react' ? React : { RenderTarget: { canvas: 'canvas', export: 'export', thumbnail: 'thumbnail', current: () => __target }, useIsStaticRenderer: () => __target !== 'preview' }
    })
    const module = (code, name) => '(()=>{const exports={};const require=window.require;' + code + ';window.' + name + '={exports,Context};})()'
    await page.addScriptTag({ content: module(js, '__current') })
    await page.evaluate(({ data, evidence }) => {
        window.__data = data; window.__evidence = evidence; window.__width = 480; window.__sceneTag = 'section'; window.__revision = 0; window.__callbackRef = false; window.__ref = { current: null }; window.__controlledFrame = 1172
        window.__state = { time: 1172 / 24, index: 35, frozen: false, reduced: false, playing: false, active: false, complete: false, toggle() {}, replay() {} }
        const E = React.createElement
        window.NativeScene = React.forwardRef((props, ref) => {
            const u = __width / 480
            return E(__sceneTag, { ...props, ref, style: { ...props.style, position: 'relative', width: __width, height: 852 * u, background: '#b7c0bb' } },
                ...data.words.map((word, index) => E('div', { key: word.name + (index === 60 ? ':' + __revision : ''), 'data-framer-name': word.name, 'data-native-word': index, 'data-native-id': u === 1 ? word.desktopID : word.phoneID, className: 'word', style: { left: Math.round(word.staticLeft * u * 100) / 100, top: Math.round(word.staticTop * u * 100) / 100, width: 54 * u, fontSize: 8 * u, lineHeight: 10 * u + 'px', transition: 'opacity 2s', transform: index === 60 ? 'translateZ(0)' : undefined, transformOrigin: index === 60 ? '25% 50%' : undefined } }, E('p', null, E('span', null, word.independentText)))),
                ...data.ruleNames.map((name, index) => E('i', { key: name, 'data-framer-name': name, 'data-native-rule': index, className: 'rule', style: { left: index % 8 * 55 * u, top: 38 * u, width: 1, height: 777 * u } })),
                E('div', { 'data-framer-name': 'film-phase-36-inset-score-grid', 'data-inset': true, style: { position: 'absolute', opacity: 0, left: 267 * u, top: 621 * u, width: 200 * u, height: 215 * u } }, ...Array.from({ length: 18 }, (_, index) => E('i', { key: index, 'data-inset-part': index, style: { position: 'absolute', left: index * u, top: index * u, width: 1, height: 30 * u } }))),
                props.children)
        })
        window.Grid = __current.exports.withAjedrezTypeGridMotion(NativeScene)
        window.__root = ReactDOM.createRoot(document.getElementById('native-mount'))
        window.__render = () => ReactDOM.flushSync(() => __root.render(E(__current.Context.Provider, { value: { ...__state } }, E(Grid, { id: 'native-scene', ref: __callbackRef ? node => { __ref.current = node; __refCalls.push(node ? node.tagName : null) } : __ref, title: 'caller preserved', 'data-caller': 'preserved', onClick: () => __clicks++, style: { transform: 'translateZ(0)', outline: '1px solid #557' } }, E('strong', { 'data-caller-child': true, style: { position: 'absolute', top: 830 * (__width / 480) } }, 'editable caller child')))))
        window.__set = (frame, changes = {}) => { __controlledFrame = frame; __state = { ...__state, time: frame / 24, ...changes }; __render() }
        window.__snapshot = () => {
            const host = document.getElementById('native-scene'), hostRect = host.getBoundingClientRect(), scale = hostRect.width / host.offsetWidth
            return { width: host.offsetWidth, scale, ref: __ref.current === host, tag: host.tagName, title: host.title, caller: host.dataset.caller, transform: host.style.transform, count: Number(host.dataset.sourceAjedrezGridCount), status: host.dataset.sourceAjedrezGridStatus, sample: Number(host.dataset.sourceAjedrezGridSample), inset: host.querySelector('[data-inset]').style.opacity, insetParts: host.querySelectorAll('[data-inset-part]').length + 1, rules: [...host.querySelectorAll('[data-native-rule]')].map(node => node.getAttribute('style')), frames: __frames.size, observers: __observers.size, reads: __reads,
                words: [...host.querySelectorAll('[data-native-word]')].map(node => { const r = node.getBoundingClientRect(), range = __originalRange(); range.selectNodeContents(node.querySelector('span')); return { index: Number(node.dataset.nativeWord), id: node.dataset.nativeId, text: node.textContent, left: parseFloat(node.style.left), top: parseFloat(node.style.top), domLeft: (r.left - hostRect.left) / scale, domTop: (r.top - hostRect.top) / scale, glyphWidth: range.getBoundingClientRect().width / scale, style: node.getAttribute('style') } }) }
        }
        document.getElementById('outside').dataset.framerName = data.words[60].name
        __render()
    }, { data: oldFixture, evidence: fixture })
    const settle = async () => { await page.waitForTimeout(30); await page.evaluate(() => ReactDOM.flushSync(() => {})) }
    const snapshot = () => page.evaluate(() => __snapshot())
    const baselineSample = n => pure.ajedrezTypeSample(n / 24)
    const expected = (frame, index, width = 480) => {
        const sample = baselineSample(frame), measured = fixture.rows.find(row => row.frame === frame)?.positions.find(row => row[0] === index)
        const u = width / 480
        return { left: Math.round((measured ? measured[1] : sample.xy[index * 2]) * u * 100) / 100, top: Math.round((measured ? measured[2] : sample.xy[index * 2 + 1]) * u * 100) / 100, width: (measured ? measured[3] : sample.widths[index]) * u }
    }
    const assertPose = (read, n) => {
        assert.equal(read.count, 84); assert.equal(read.words.length, 84)
        for (const word of read.words) {
            const value = expected(n, word.index, read.width)
            assert.equal(word.left, value.left, `frame${n}/actor${word.index} left`); assert.equal(word.top, value.top, `frame${n}/actor${word.index} top`)
            assert.ok(Math.abs(word.domLeft - value.left) < .025 && Math.abs(word.domTop - value.top) < .025, `frame${n}/actor${word.index} actual DOM bounds`)
            if (n >= 1169 && n < 1174 && fixture.actorIndices.includes(word.index)) assert.ok(word.glyphWidth <= value.width + .1, 'native glyph fits the observed source span without enlarging font height')
        }
    }
    await settle()
    const initial = await snapshot(); assertPose(initial, 1172)
    check('The actual84-word native-like DOM retains identities,caller props,children and object ref at the unchanged1172 anchor', initial.ref && initial.title === 'caller preserved' && initial.caller === 'preserved' && initial.insetParts === 19 && initial.words.every((word, index) => word.id === oldFixture.words[index].desktopID && word.text === oldFixture.words[index].independentText) && await page.locator('[data-caller-child]').textContent() === 'editable caller child')
    await page.locator('[data-caller-child]').click(); check('Caller event handling survives the existing word-grid HOC', await page.evaluate(() => __clicks === 1))
    const forward = []
    for (const frame of [1169, 1170, 1171, 1172, 1173]) {
        await page.evaluate(frame => { __set(frame); const img = document.getElementById('source-frame'); img.src = '/frame-' + frame + '.png'; document.getElementById('source-label').textContent = 'Retained source frame ' + frame; document.getElementById('source-boxes').innerHTML = __evidence.actors.map(actor => { const b = actor.poses.find(pose => pose.frame === frame).sourceInkBounds; return '<i class="source-box" style="left:' + b.left + 'px;top:' + b.top + 'px;width:' + b.width + 'px;height:' + b.height + 'px"></i>' }).join('') }, frame)
        await page.waitForFunction(() => document.getElementById('source-frame').complete && document.getElementById('source-frame').naturalWidth === 480)
        await settle(); const read = await snapshot(); assertPose(read, frame); forward.push({ frame, read })
        await page.screenshot({ path: path.join(output, 'source-and-native-' + frame + '.png'), clip: { x: 9, y: 9, width: 982, height: 880 } })
    }
    check('All five corresponding source frames drive exact two-actor positions/width fits in the actual DOM; all82 other actors retain their baseline', forward.length === 5 && forward.every(({ read }) => read.frames === 0 && read.words.every(word => word.style.includes('transition: none'))))
    const unchanged = forward[0].read.words.filter(word => !fixture.actorIndices.includes(word.index))
    check('The82 unmeasured native style strings remain byte-exact across this slice', forward.every(({ read }) => unchanged.every(word => read.words[word.index].style === word.style)))
    for (const frame of [1172, 1171, 1170, 1169]) { await page.evaluate(n => __set(n), frame); await settle(); assertPose(await snapshot(), frame) }
    check('Reverse seek deterministically restores each literal recorded pose without tweening', true)
    await page.evaluate(() => __set(1170)); await settle(); const readsBefore = (await snapshot()).reads
    await page.evaluate(() => __set(1171)); await settle(); const readsAfter = (await snapshot()).reads
    check('A measured-frame edge performs only two native text-range reads, rather than remeasuring the82 held actors', readsAfter - readsBefore === 2)
    await page.evaluate(() => __set(1171.5)); await settle()
    check('Subframe updates in the same24fps row perform zero additional native text measurements', (await snapshot()).reads === readsAfter)
    for (const n of [1168, 1174]) { await page.evaluate(n => __set(n), n); await settle(); assertPose(await snapshot(), n) }
    check('Both external slice boundaries return to the original untouched representative samples', true)
    await page.addScriptTag({ content: module(previousJS, '__baseline') })
    await page.evaluate(() => {
        const E = React.createElement, Base = __baseline.exports.withAjedrezTypeGridMotion(NativeScene)
        window.__baseRoot = ReactDOM.createRoot(document.getElementById('baseline-mount'))
        ReactDOM.flushSync(() => __baseRoot.render(E(__baseline.Context.Provider, { value: { ...__state, time: 1169 / 24 } }, E(Base, { id: 'negative-baseline' }))))
        __set(1169)
    }); await settle()
    const negative = await page.evaluate(() => [60, 25].map(index => { const node = document.querySelector('#negative-baseline [data-native-word="' + index + '"]'); return { index, left: parseFloat(node.style.left), top: parseFloat(node.style.top) } }))
    check('The genuine preimage HOC reproduces the held1172 error at1169 and fails both measured actor bounds', negative.every(word => { const wanted = expected(1169, word.index); return Math.hypot(word.left - wanted.left, word.top - wanted.top) > 150 }))
    reports.push({ negativePreimageRead: negative })
    await page.evaluate(() => ReactDOM.flushSync(() => __baseRoot.unmount())); await settle()
    // Keep one actual React hook owner, host, ref and paused clock value while
    // replacing only its implementation. This deliberately avoids React Refresh
    // remount/force-effect machinery, so stale ordinary dependency closures fail.
    const staleNeedle = '}, [ajedrezTypeMeasuredOwner(host)])'
    assert.equal(source.split(staleNeedle).length - 1, 1)
    const staleJS = ts.transpileModule(source.replace(staleNeedle, '}, [host])'), { compilerOptions }).outputText
    await page.addScriptTag({ content: module(staleJS, '__staleDependency') })
    await page.addScriptTag({ content: module(js, '__laterModule') })
    await page.evaluate(() => {
        const E = React.createElement
        window.__hmrRef = { current: null }
        window.__hmrValue = { ...__state, time: 1169 / 24 }
        window.__hmrImpl = null
        window.Retained = React.forwardRef((props, ref) => __hmrImpl(props, ref))
        window.__renderHMR = () => ReactDOM.flushSync(() => __hmrRoot.render(E(__baseline.Context.Provider, { value: __hmrValue }, E(__current.Context.Provider, { value: __hmrValue }, E(__staleDependency.Context.Provider, { value: __hmrValue }, E(__laterModule.Context.Provider, { value: __hmrValue }, E(Retained, { id: 'retained-pause', ref: __hmrRef })))))))
        window.__mountHMR = () => { window.__hmrRoot = ReactDOM.createRoot(document.getElementById('baseline-mount')); __hmrImpl = __baseline.exports.withAjedrezTypeGridMotion(NativeScene).render; __renderHMR() }
        window.__readHMR = () => { const host = document.getElementById('retained-pause'); return { width: host.offsetWidth, ref: __hmrRef.current === host, reads: __reads, creates: __observerCreates, observers: __observers.size, words: [60, 25].map(index => { const node = host.querySelector('[data-native-word="' + index + '"]'); return { index, left: parseFloat(node.style.left), top: parseFloat(node.style.top) } }) } }
        __mountHMR()
    }); await settle()
    const staleBefore = await page.evaluate(() => { window.__sameHMRHost = __hmrRef.current; return __readHMR() })
    await page.evaluate(() => { __hmrImpl = __staleDependency.exports.withAjedrezTypeGridMotion(NativeScene).render; __renderHMR() }); await settle()
    const staleAfter = await page.evaluate(() => ({ ...__readHMR(), sameHost: __sameHMRHost === __hmrRef.current }))
    check('Negative retained-hook refresh with unchanged[host] keeps stale held1172 positions while paused at1169', staleAfter.sameHost && JSON.stringify(staleAfter.words) === JSON.stringify(staleBefore.words) && staleAfter.words.every(word => { const wanted = expected(1169, word.index); return Math.hypot(word.left - wanted.left, word.top - wanted.top) > 150 }))
    await page.evaluate(() => ReactDOM.flushSync(() => __hmrRoot.unmount())); await settle()
    await page.evaluate(() => __mountHMR()); await settle()
    await page.evaluate(() => { window.__sameHMRHost = __hmrRef.current; __hmrImpl = __current.exports.withAjedrezTypeGridMotion(NativeScene).render; __renderHMR() }); await settle()
    const hmrCurrent = await page.evaluate(() => ({ ...__readHMR(), sameHost: __sameHMRHost === __hmrRef.current }))
    check('Olda804[host]→new[token] refresh preserves the paused hook owner/DOM/ref while applying both measured1169 fits without input', hmrCurrent.sameHost && hmrCurrent.ref && hmrCurrent.words.every(word => { const wanted = expected(1169, word.index); return word.left === wanted.left && word.top === wanted.top }))
    await page.evaluate(() => { __hmrImpl = __laterModule.exports.withAjedrezTypeGridMotion(NativeScene).render; __renderHMR() }); await settle()
    const hmrLater = await page.evaluate(() => ({ ...__readHMR(), sameHost: __sameHMRHost === __hmrRef.current }))
    check('Newmodule[token]→latermodule[token] renews the existing two-observer lease without remount/input or a stale closure', hmrLater.sameHost && hmrLater.creates === hmrCurrent.creates + 2 && hmrLater.observers === hmrCurrent.observers && JSON.stringify(hmrLater.words) === JSON.stringify(hmrCurrent.words))
    await page.evaluate(() => { __sceneTag = 'article'; __renderHMR() }); await settle()
    const hmrReplacement = await page.evaluate(() => ({ ...__readHMR(), replaced: __sameHMRHost !== __hmrRef.current, tag: __hmrRef.current.tagName }))
    check('The same one-slot token also rebinds a replacement native host after a module refresh', hmrReplacement.replaced && hmrReplacement.tag === 'ARTICLE' && hmrReplacement.ref && hmrReplacement.words.every(word => { const wanted = expected(1169, word.index); return word.left === wanted.left && word.top === wanted.top }))
    await page.evaluate(() => { ReactDOM.flushSync(() => __hmrRoot.unmount()); __sceneTag = 'section' }); await settle()
    reports.push({ retainedHookRefresh: { staleBefore, staleAfter, hmrCurrent, hmrLater, hmrReplacement }, boundary: 'Actual retained React18 hook owner; demonstrates dependency refresh semantics, not actual Framer HMR/Preview paint.' })
    const heldA = await snapshot(); await page.waitForTimeout(120); const heldB = await snapshot()
    check('A paused measured row holds all DOM geometry with zero ownedRAF and only the existing two observers', JSON.stringify(heldA.words) === JSON.stringify(heldB.words) && heldB.frames === 0 && heldB.observers === 2)
    await page.evaluate(() => { __width = 375; __sceneTag = 'article'; __callbackRef = true; __set(1169) }); await settle()
    const phone = await snapshot(); assertPose(phone, 1169)
    check('A real375px Phone host replacement preserves unit scaling, native IDs and callback ref', phone.tag === 'ARTICLE' && phone.width === 375 && phone.ref && phone.words.every((word, index) => word.id === oldFixture.words[index].phoneID) && await page.evaluate(() => __refCalls.includes('ARTICLE')))
    await page.evaluate(() => { document.getElementById('comparison').style.transformOrigin = '0 0'; document.getElementById('comparison').style.transform = 'translate(13px,7px) scale(.8)'; __set(1170) }); await settle()
    const affine = await snapshot(); assertPose(affine, 1170)
    check('Public affine parent scaling preserves CSS/native logical coordinates and source-width fitting', Math.abs(affine.scale - .8) < .001)
    await page.evaluate(() => { window.__detachedWord = document.querySelector('[data-native-word="60"]'); __revision++; __render() }); await settle()
    assertPose(await snapshot(), 1170)
    check('A same-frame native word replacement receives its fit and restores the detached old word', await page.evaluate(() => !__detachedWord.isConnected && __detachedWord.style.left === Math.round(__data.words[60].staticLeft * 375 / 480 * 100) / 100 + 'px' && __observers.size === 2))
    await page.evaluate(() => { document.getElementById('comparison').style.transform = ''; __set(1170, { frozen: true }) }); await settle()
    const poster = await snapshot()
    for (const mode of ['canvas', 'export', 'thumbnail', 'reduced']) {
        await page.evaluate(mode => { __target = mode === 'reduced' ? 'preview' : mode; __set(1169, { frozen: mode !== 'reduced', reduced: mode === 'reduced' }) }, mode)
        await settle(); const read = await snapshot()
        assert.equal(read.status, 'native-poster'); assert.equal(read.frames, 0)
        assert.deepEqual(read.words.map(word => word.style), poster.words.map(word => word.style))
        assert.deepEqual(read.rules, poster.rules); assert.equal(read.inset, '0')
    }
    check('Canvas/export/thumbnail/reduced restores every authored Phone poster style and preserves the19-part inset', poster.insetParts === 19)
    await page.evaluate(() => { __target = 'preview'; __set(1192, { frozen: false, reduced: false }) }); await settle()
    let insetReads = (await snapshot()).reads, insetSample = baselineSample(1192).sourceFrame
    const insetEdges = []
    for (const n of [1193, 1194, 1195, 1196, 1195, 1193, 1192]) {
        await page.evaluate(n => __set(n), n); await settle(); const read = await snapshot()
        assert.equal(read.inset, n >= 1193 && n < 1196 ? '1' : '0'); assert.equal(read.insetParts, 19)
        const sample = baselineSample(n).sourceFrame, expectedReads = sample === insetSample ? 0 : 84
        assert.equal(read.sample, sample)
        assert.equal(read.reads - insetReads, expectedReads, 'Only an existing representative-word-sample change remeasures84 words')
        insetEdges.push({ frame: n, sample, inset: read.inset, readDelta: read.reads - insetReads, expectedReads })
        insetReads = read.reads; insetSample = sample
    }
    reports.push({ insetEdges })
    check('All19 inset parts retain exact1193..1195 visibility; inset-only edges perform0reads and existing representative-sample changes perform84reads', true)
    await page.evaluate(() => { __set(1169); document.querySelector('[data-native-word="60"]').style.setProperty('left', '17px', 'important'); __set(1170); __set(1.2, { index: 1 }) }); await settle()
    check('Scene exit restores a newer caller declaration and priority while leaving matching outside layers untouched', await page.evaluate(() => { const node = document.querySelector('[data-native-word="60"]'); return node.style.left === '17px' && node.style.getPropertyPriority('left') === 'important' && document.getElementById('outside').style.left === '' }))
    await page.evaluate(() => ReactDOM.flushSync(() => __root.unmount())); await settle()
    check('All existing owned observers and forwarded refs clean up with zero pendingRAF', await page.evaluate(() => __observers.size === 0 && __frames.size === 0 && __ref.current === null))
    check('No browser exceptions or unplanned network/material requests occurred', errors.length === 0 && requests.every(url => /^\/frame-117[0-3]\.png$|^\/frame-1169\.png$/.test(url)))
    reports.push({ initial, forward, phone, affine, scope: 'Native-like editable DOM supplied by fixture; source screenshots are retained comparison evidence, independent strings intentionally differ. No actual Framer DOM/paint/reload assertion.' })
    const result = { passed: true, ...pins, checks, reports, errors, requests, nodeVersion: process.version, chromiumVersion: browser.version(), sourceCorrespondence: 'Only2 measured glyph-geometry fits over1169..1173; unchanged82 actors remain sampled holds. Source easing/poem identities/full trajectory not claimed.', actualFramerPreviewVerified: false, afterEditorReload: false }
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2) + '\n')
    console.log(JSON.stringify({ passed: true, checks: checks.length, ...pins, evidence: output }, null, 2))
} catch (error) {
    fs.writeFileSync(path.join(output, 'failure.json'), JSON.stringify({ error: String(error), stack: error.stack, ...pins, checks, reports, errors, requests }, null, 2) + '\n')
    throw error
} finally {
    if (browser) await browser.close()
    if (server) await new Promise(resolve => server.close(resolve))
}
