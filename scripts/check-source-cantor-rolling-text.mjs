import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url), ts = require('typescript'), repo = path.resolve(import.meta.dirname, '..')
const sourcePath = path.join(repo, 'docs/design-studies/code-components/SourceCantorRollingText.tsx')
const openingPath = path.join(repo, 'docs/design-studies/code-components/SourceCantorOpening.tsx')
const legacyPath = path.join(repo, 'docs/design-studies/code-components/SourceCantorNativeBehaviors.tsx')
const source = fs.readFileSync(sourcePath, 'utf8'), opening = fs.readFileSync(openingPath, 'utf8'), legacy = fs.readFileSync(legacyPath, 'utf8')
const hash = value => crypto.createHash('sha256').update(value).digest('hex')
const out = process.env.MONARCHIC_CANTOR_ROLLING_EVIDENCE_DIR ?? '/tmp/monarchic-cantor-rolling'
fs.mkdirSync(out, { recursive: true })
const checks = [], states = [], errors = [], requests = []
const check = (name, value) => { assert.ok(value, name); checks.push(name) }
const stub = `export type ReactNode=unknown;export interface CSSProperties{[key:string]:string|number|undefined};export type ForwardedRef<T>=((v:T|null)=>void)|{current:T|null}|null;export type ComponentType<P={}>=((p:P)=>unknown);export interface Context<T>{Provider:ComponentType<{value:T;children?:unknown}>;__type?:T};export function createContext<T>(v:T):Context<T>;export function useContext<T>(c:Context<T>):T;export function forwardRef<T,P>(f:(p:P,r:ForwardedRef<T>)=>unknown):ComponentType<P>;export function useRef<T>(v:T):{current:T};export function useState<T>(v:T|(()=>T)):[T,(v:T|((p:T)=>T))=>void];export function useCallback<T extends Function>(f:T,d:unknown[]):T;export function useEffect(f:()=>void|(()=>void),d:unknown[]):void;export function useLayoutEffect(f:()=>void|(()=>void),d:unknown[]):void;export function useId():string;export function createElement(...a:unknown[]):unknown;declare global{namespace JSX{interface IntrinsicAttributes{key?:string|number};interface IntrinsicElements{[key:string]:{style?:CSSProperties;[key:string]:unknown}}}}`
const defs = new Map([[repo + '/__cantor-rolling-react.d.ts', stub], [repo + '/__cantor-rolling-framer.d.ts', 'export const RenderTarget:{canvas:string;export:string;thumbnail:string;current():string};export function useIsStaticRenderer():boolean;']])
const options = { strict: true, noEmit: true, skipLibCheck: true, allowImportingTsExtensions: true, target: ts.ScriptTarget.ES2020, lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'], module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React, moduleResolution: ts.ModuleResolutionKind.Node10, baseUrl: repo, paths: { react: ['__cantor-rolling-react.d.ts'], framer: ['__cantor-rolling-framer.d.ts'] } }
const compiler = ts.createCompilerHost(options), read = compiler.readFile.bind(compiler), exists = compiler.fileExists.bind(compiler)
compiler.readFile = file => defs.get(file) ?? read(file)
compiler.fileExists = file => defs.has(file) || exists(file)
compiler.getSourceFile = (file, version) => { const text = compiler.readFile(file); return text === undefined ? undefined : ts.createSourceFile(file, text, version, true) }
const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([sourcePath], options, compiler))
assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics.slice(0, 10), { getCurrentDirectory: () => repo, getCanonicalFileName: file => file, getNewLine: () => '\n' }))
checks.push('Strict ES2020/DOM semantic TypeScript resolves the actual unchanged local opening module')
check('The frozen opening910 and five legacy HOCs remain byte exact', hash(opening) === '910767a75f23ea0398328245d86ec6cafc056afeb30770a84ae0ad48d8ede46a' && hash(legacy) === '3d984648e5cafe49e1f7cc525afd7f8f54dd3135a10d21616d62de8504545416')
check('Four public HOCs use directly typed native signatures', [...source.matchAll(/^export function \w+\(Component: ComponentType<RollingProps>\): ComponentType<RollingProps>/gm)].length === 4 && [...source.matchAll(/^export function /gm)].length === 4)
check('No new renderer, controls, frame clock, timer, RAF, media, network or destructive text mutation is added', !/addPropertyControls|<canvas|<video|requestAnimationFrame\s*\(|setTimeout\s*\(|setInterval\s*\(|\bfetch\s*\(|innerHTML|\.textContent\s*=|\.innerText\s*=/.test(source))
const compile = text => ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText
const compiled = compile(source), compiledOpening = compile(opening), compiledLegacy = compile(legacy)
const React = require('react'), server = require('react-dom/server'), mode = { target: 'preview', static: false }
const framer = { RenderTarget: { canvas: 'canvas', export: 'export', thumbnail: 'thumbnail', current: () => mode.target }, useIsStaticRenderer: () => mode.static }
const openingExports = {}, rollingExports = {}
new Function('require', 'exports', compiledOpening)(name => name === 'react' ? React : framer, openingExports)
new Function('require', 'exports', compiled)(name => name === 'react' ? React : name === 'framer' ? framer : name === './SourceCantorOpening.tsx' ? openingExports : (() => { throw Error('Unexpected local import ' + name) })(), rollingExports)
const NativeSSR = React.forwardRef((props, ref) => React.createElement('div', { ...props, ref }))
const quiet = console.error
try {
    console.error = (...args) => { if (!String(args[0]).includes('useLayoutEffect does nothing on the server')) quiet(...args) }
    for (const [target, isStatic] of [['canvas', false], ['export', false], ['thumbnail', false], ['preview', true]]) {
        mode.target = target; mode.static = isStatic
        const Root = rollingExports.withCantorRollingOpeningRoot(NativeSSR), Text = rollingExports.withCantorRollingCompanyLabel(NativeSSR)
        const OldRoot = openingExports.withCantorOpeningRoot(NativeSSR), OldText = openingExports.withCantorFoundationCompanyLabel(NativeSSR)
        const props = { title: 'Caller preserved', style: { width: 1440, height: 810 } }
        const textProps = { id: 'retained-native-ID', style: { width: 145, color: '#044ab3' } }
        const html = server.renderToString(React.createElement(Root, props, React.createElement(Text, textProps, 'Editable Company label')))
        const old = server.renderToString(React.createElement(OldRoot, props, React.createElement(OldText, textProps, 'Editable Company label')))
        const noStyles = value => value.replace(/<style>[\s\S]*?<\/style>/g, '')
        check(target + '/' + isStatic + ' SSR composition preserves exact native markup, old responsive styles and caller values', noStyles(html) === noStyles(old) && html.includes('retained-native-ID') && html.includes('Editable Company label'))
    }
} finally { console.error = quiet }
if (process.argv.includes('--static-only')) { fs.writeFileSync(path.join(out, 'static-result.json'), JSON.stringify({ passed: true, sourceSHA256: hash(source), checks }, null, 2)); console.log(JSON.stringify({ passed: true, checks: checks.length })); process.exit(0) }

const { chromium } = require('@playwright/test'), sharp = createRequire(require.resolve('astro/package.json'))('sharp')
const react = fs.readFileSync(path.join(path.dirname(require.resolve('react/package.json')), 'umd/react.development.js'), 'utf8')
const reactDOM = fs.readFileSync(path.join(path.dirname(require.resolve('react-dom/package.json')), 'umd/react-dom.development.js'), 'utf8')
const fontDir = process.env.MONARCHIC_CANTOR_SOURCE_FONT_DIR
const fonts = fontDir ? [{ file: 'PPNeueMontreal-regular.woff2', weight: 400, sha256: '1a020a0ccc2b29ad091b713864b135d9f7fb6d3114e69620f6d56eeb9abefbcc' }, { file: 'PPNeueMontreal-medium.woff2', weight: 500, sha256: '11a1b227a4f432bdc5587a529d34a46abbed7067b6e1fb913db0c489c7175828' }].map(font => { const data = fs.readFileSync(path.join(fontDir, font.file)); assert.equal(hash(data), font.sha256); return { ...font, data: data.toString('base64') } }) : []
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, hasTouch: false }), page = await context.newPage()
page.setDefaultTimeout(5000)
page.on('pageerror', error => errors.push(String(error)))
await context.route('**/*', route => { requests.push(route.request().url()); return route.abort() })
const readState = () => page.evaluate(() => read())
const wait = fn => page.waitForFunction(fn, undefined, { polling: 30 })
const save = async name => { const state = await readState(); states.push({ name, state }); fs.writeFileSync(path.join(out, name + '.json'), JSON.stringify(state, null, 2)); return state }
try {
    await page.setContent('<!doctype html><style>*{box-sizing:border-box}body{margin:0}p,h3{margin:0}a{color:inherit;text-decoration:none}.native-link{display:block;position:relative}.fade{transition:opacity 100ms linear}.fade.zero{opacity:0}</style><div id="mount"></div>')
    if (fonts.length) await page.addStyleTag({ content: fonts.map(font => `@font-face{font-family:"PP Neue Montreal Variable";src:url(data:font/woff2;base64,${font.data});font-style:normal;font-weight:${font.weight}}`).join('') })
    await page.addScriptTag({ content: react }); await page.addScriptTag({ content: reactDOM })
    await page.evaluate(() => {
        window.__target = 'preview'; window.__static = false; window.__hidden = false; window.__tag = 'div'; window.__blockTag = 'p'; window.__epoch = 0; window.__coarse = false
        window.__clicks = 0; window.__hoverCalls = 0; window.__refs = []; window.__objectRef = { current: null }; window.__ownerObservers = new Map(); window.__ownerListeners = []; window.__ownerFrames = new Set(); window.__ownerTimers = new Set()
        const owned = () => new Error().stack.includes('cantor-rolling-helper.js')
        const nativeAdd = EventTarget.prototype.addEventListener, nativeRemove = EventTarget.prototype.removeEventListener
        EventTarget.prototype.addEventListener = function (type, fn, options) { if (owned()) __ownerListeners.push({ target: this, type, fn }); return nativeAdd.call(this, type, fn, options) }
        EventTarget.prototype.removeEventListener = function (type, fn, options) { __ownerListeners = __ownerListeners.filter(row => row.target !== this || row.type !== type || row.fn !== fn); return nativeRemove.call(this, type, fn, options) }
        for (const name of ['MutationObserver', 'IntersectionObserver']) {
            const Constructor = window[name]
            window[name] = class extends Constructor {
                constructor(...args) { super(...args); this.owned = owned(); if (this.owned) __ownerObservers.set(this, { kind: name, targets: new Set() }) }
                observe(node, ...args) { if (this.owned) __ownerObservers.get(this).targets.add(node); return super.observe(node, ...args) }
                unobserve(node) { if (this.owned) __ownerObservers.get(this).targets.delete(node); return super.unobserve(node) }
                disconnect() { if (this.owned) __ownerObservers.get(this).targets.clear(); return super.disconnect() }
            }
        }
        const raf = requestAnimationFrame, caf = cancelAnimationFrame
        window.requestAnimationFrame = callback => { const owner = owned(); let id; id = raf(time => { __ownerFrames.delete(id); callback(time) }); if (owner) __ownerFrames.add(id); return id }
        window.cancelAnimationFrame = id => { __ownerFrames.delete(id); return caf(id) }
        const timeout = setTimeout, clear = clearTimeout
        window.setTimeout = (callback, ...args) => { const owner = owned(); let id; id = timeout(() => { __ownerTimers.delete(id); callback() }, ...args); if (owner) __ownerTimers.add(id); return id }
        window.clearTimeout = id => { __ownerTimers.delete(id); return clear(id) }
        const media = window.matchMedia.bind(window)
        window.matchMedia = query => __coarse && query.includes('pointer: fine') ? { ...media(query), matches: false, addEventListener() {}, removeEventListener() {} } : media(query)
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => __hidden })
        window.hide = value => { __hidden = value; document.dispatchEvent(new Event('visibilitychange')) }
        window.framer = { RenderTarget: { canvas: 'canvas', export: 'export', thumbnail: 'thumbnail', current: () => __target }, useIsStaticRenderer: () => __static }
        window.Opening = {}; window.Rolling = {}; window.Legacy = {}
    })
    await page.addScriptTag({ content: `(function(){new Function('require','exports',${JSON.stringify(compiledOpening + '\n//# sourceURL=cantor-opening-parent.js')})(name=>name==='react'?window.React:window.framer,window.Opening);new Function('require','exports',${JSON.stringify(compiledLegacy + '\n//# sourceURL=cantor-legacy-parent.js')})(name=>name==='react'?window.React:window.framer,window.Legacy);new Function('require','exports',${JSON.stringify(compiled + '\n//# sourceURL=cantor-rolling-helper.js')})(name=>name==='react'?window.React:name==='framer'?window.framer:name==='./SourceCantorOpening.tsx'?window.Opening:(()=>{throw Error(name)})(),window.Rolling)})()` })
    await page.evaluate(() => {
        const E = React.createElement
        const Frame = React.forwardRef((props, ref) => E(__tag, { ...props, ref }))
        const Text = React.forwardRef(({ text, ...props }, ref) => E(__tag, { ...props, ref }, E(__blockTag, { style: { fontFamily: 'inherit', fontSize: '20px', lineHeight: '20px', fontWeight: 500, letterSpacing: '0px' } }, E('span', { style: { fontFamily: 'inherit', fontSize: '20px' } }, text))))
        const Root = Rolling.withCantorRollingOpeningRoot(Frame), NavText = Rolling.withCantorRollingHeaderLinkText(Text), ButtonText = Rolling.withCantorRollingText(Text), CompanyText = Rolling.withCantorRollingCompanyLabel(Text)
        const Anchor = React.forwardRef((props, ref) => E('a', { ...props, ref, href: props.href ?? '#retained-link', onClick: event => { props.onClick?.(event); event.preventDefault(); __clicks++ } }))
        const ArrowButton = Legacy.withCantorCTAArrowButton(Anchor), Outgoing = Legacy.withCantorArrowOutgoing(Frame), Incoming = Legacy.withCantorArrowIncoming(Frame)
        const labels = ['Home', 'Products', 'Partners', 'News', 'Blog', 'Career', 'Company']
        window.__labels = labels
        window.__root = ReactDOM.createRoot(document.getElementById('mount'))
        window.render = () => {
            const nav = labels.map((text, index) => E(Anchor, { key: text, id: 'nav-' + text.toLowerCase(), className: 'native-link', href: '/source-' + text.toLowerCase(), style: { width: 110, height: 50, padding: '12px 6px', fontSize: 20 } }, E(NavText, { id: 'text-' + text.toLowerCase(), text: index === 0 && window.__edited ? 'Home updated' : text, title: 'Retained label ' + text, style: { width: 105, height: 'auto', fontSize: 20, color: '#fff' }, ref: index === 0 ? __objectRef : undefined })))
            const company = (key, top, text) => E(ArrowButton, { key, id: key, className: 'native-link', href: '/source-' + key, style: { position: 'absolute', top, left: 28, width: 250, height: 50, background: '#fff', color: '#044ab3', fontSize: 20 }, onMouseEnter: event => { __hoverCalls++; event.preventDefault() } }, E(CompanyText, { id: key + '-text', text, title: 'Retained Company role', ref: node => __refs.push(node), style: { width: 150, color: '#044ab3' } }), E(Outgoing, { id: key + '-outgoing', style: { position: 'absolute', left: 215, top: 15, width: 16, height: 16 } }, '↗'), E(Incoming, { id: key + '-incoming', style: { position: 'absolute', left: 215, top: 15, width: 16, height: 16 } }, '↗'))
            ReactDOM.flushSync(() => __root.render(E(Root, { key: __epoch, id: 'native-scope', title: 'Retained native root', style: { width: innerWidth, minHeight: 2600 } }, E('header', { id: 'header', style: { display: 'flex', fontSize: 20, height: 60 } }, ...nav, E(Anchor, { id: 'header-cta', className: 'native-link', href: '/source-contact', style: { width: 180, height: 50, padding: '12px 6px' } }, E(ButtonText, { id: 'header-cta-text', text: 'Get in Touch', style: { width: 160, fontSize: 20, color: '#fff' } }))), E('div', { id: 'body-area', className: 'fade', style: { position: 'relative', height: 700 } }, E('h1', { id: 'unchanged-headline' }, 'Enterprise-Grade Infrastructure'), company('hero-cta', 110, 'Get in Touch'), company('foundation-cta', 240, 'The Company')), E('div', { id: 'phone-menu-unmodified', style: { display: 'flex', flexWrap: 'wrap', gap: 10, color: '#fff' } }, ...Array.from({ length: 11 }, (_, index) => E('a', { key: index, href: '#menu-' + index, onClick: event => event.preventDefault() }, E(Text, { id: 'phone-menu-' + index, text: 'Phone menu ' + index, style: { fontSize: 20, width: 130 } })))))))
        }
        window.read = () => {
            const rows = [...document.querySelectorAll('[data-cantor-roll-admission]')].map(node => { const block = node.querySelector('p,h1,h2,h3,h4,h5,h6'), anchor = node.closest('a'), style = block && getComputedStyle(block), box = node.getBoundingClientRect(); return { id: node.id, admission: node.getAttribute('data-cantor-roll-admission'), text: node.textContent, hostTag: node.tagName, blockTag: block?.tagName, clipHeight: box.height, fontSize: getComputedStyle(node).fontSize, lineHeight: getComputedStyle(node).lineHeight, transform: style?.transform, transitionDuration: style?.transitionDuration, transitionTiming: style?.transitionTimingFunction, duplicate: block?.getAttribute('data-cantor-roll-copy'), pseudoContent: block && getComputedStyle(block, '::after').content, anchorID: anchor?.id, anchorOpacity: anchor && getComputedStyle(anchor).opacity, opacityDuration: anchor && getComputedStyle(anchor).transitionDuration, liveTextNodes: block?.querySelectorAll('span').length, nativeTitle: node.title, href: anchor?.getAttribute('href') } })
            return { rows, scopeCount: document.querySelectorAll('[data-cantor-roll-scope]').length, navCount: document.querySelectorAll('[data-cantor-roll-nav]').length, timers: __ownerTimers.size, frames: __ownerFrames.size, ownedObserverTargets: [...__ownerObservers.values()].map(row => ({ kind: row.kind, connected: [...row.targets].filter(node => node.isConnected).length, detached: [...row.targets].filter(node => !node.isConnected).length })), ownedListeners: __ownerListeners.length, clicks: __clicks, hoverCalls: __hoverCalls, phoneMenuHasRolling: !!document.querySelector('#phone-menu-unmodified [data-cantor-roll-text]'), rootTag: document.getElementById('native-scope')?.tagName, rootTitle: document.getElementById('native-scope')?.title, refMatches: __objectRef.current === document.getElementById('text-home') }
        }
        render()
    })
    await wait(() => read().rows.filter(row => row.admission === 'ready').length === 10)
    if (fonts.length) await page.evaluate(() => document.fonts.ready)
    const start = await save('desktop-rest')
    check('All ten original labels admit through their retained editable paragraph and semantic links', start.rows.length === 10 && start.rows.every(row => row.admission === 'ready' && row.liveTextNodes === 1 && row.text === row.duplicate) && start.navCount === 7)
    check('Only ten labels roll; headings and all eleven Phone-menu labels remain untouched', !start.phoneMenuHasRolling && await page.locator('#unchanged-headline [data-cantor-roll-block]').count() === 0)
    check('Source1.25em clip and exact950ms/.16,1,.3,1 transition are present', start.rows.every(row => Math.abs(row.clipHeight - parseFloat(row.fontSize) * 1.25) < .05 && row.transitionDuration === '0.95s' && row.transitionTiming === 'cubic-bezier(0.16, 1, 0.3, 1)'))
    check('The paint duplicate has empty alternative speech content in the supported Chromium bridge', start.rows.every(row => row.pseudoContent.includes(row.duplicate) && row.pseudoContent.includes('/ ""')))
    const cdp = await context.newCDPSession(page)
    const document = await cdp.send('DOM.getDocument'), node = await cdp.send('DOM.querySelector', { nodeId: document.root.nodeId, selector: '#nav-home' }), ax = await cdp.send('Accessibility.getPartialAXTree', { nodeId: node.nodeId, fetchRelatives: false })
    check('Generated text does not duplicate the spoken Home link name', ax.nodes.find(row => row.role?.value === 'link')?.name?.value === 'Home')
    check('Root composition preserves native title and forwarded object ref', start.rootTitle === 'Retained native root' && start.refMatches)
    const roi = await page.locator('#text-home').boundingBox(), clip = { x: Math.floor(roi.x), y: Math.floor(roi.y), width: Math.ceil(roi.width), height: Math.ceil(roi.height) }
    const restPNG = await page.screenshot({ clip })
    await page.locator('#nav-home').hover(); await page.waitForTimeout(120)
    const middle = await save('desktop-hover-middle'), home = middle.rows.find(row => row.id === 'text-home'), offset = Number(home.transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,\s*([^)]+)\)/)?.[1])
    const midPNG = await page.screenshot({ clip })
    const restPixels = await sharp(restPNG).raw().toBuffer(), midPixels = await sharp(midPNG).raw().toBuffer(); let changed = 0
    for (let index = 0; index < restPixels.length; index++) if (restPixels[index] !== midPixels[index]) changed++
    fs.writeFileSync(path.join(out, 'editable-label-rest.png'), restPNG); fs.writeFileSync(path.join(out, 'editable-label-moving.png'), midPNG)
    check('Real native label pixels move between CSS endpoints without replacing native text', offset < -1 && offset > -home.clipHeight && changed > 20)
    check('Hover dims six header siblings over320ms, excludes the header CTA and retains the hovered link', middle.rows.filter(row => row.id.startsWith('text-') && row.id !== 'text-home').every(row => Number(row.anchorOpacity) < 1 && row.opacityDuration === '0.32s') && home.anchorOpacity === '1' && middle.rows.find(row => row.id === 'header-cta-text').anchorOpacity === '1')
    await page.mouse.move(1350, 850); await page.waitForTimeout(35)
    const reversed = await save('desktop-reverse-middle'), reverseOffset = Number(reversed.rows.find(row => row.id === 'text-home').transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,\s*([^)]+)\)/)?.[1])
    check('Interrupted reverse continues from the painted intermediate value rather than jumping to the opposite endpoint', reverseOffset > offset && reverseOffset <= 0)
    await page.waitForTimeout(1000)
    await page.keyboard.press('Tab'); await page.locator('#nav-home').focus(); await page.waitForTimeout(1000)
    const focused = await save('keyboard-focus-only')
    check('Keyboard focus-visible rolls its label without hover-only sibling dimming', await page.locator('#nav-home').evaluate(node => node.matches(':focus-visible')) && focused.rows.find(row => row.id === 'text-home').transform.includes('-25') && focused.rows.every(row => row.anchorOpacity === '1'))
    await page.locator('#nav-products').hover(); await page.waitForTimeout(400)
    const mixed = await readState()
    check('Hovered and keyboard-focused header links both stay opaque while other participants dim', mixed.rows.filter(row => ['text-home', 'text-products'].includes(row.id)).every(row => row.anchorOpacity === '1') && mixed.rows.find(row => row.id === 'text-partners').anchorOpacity === '0.65')
    await page.mouse.move(1350, 850); await page.locator('#nav-home').evaluate(node => node.blur())
    await page.locator('#hero-cta').hover(); await page.waitForTimeout(120)
    const button = await readState()
    check('Actual composed CompanyLabel preserves its old positioned role and CSS rolling despite a canceled caller hover', button.hoverCalls > 0 && button.rows.find(row => row.id === 'hero-cta-text').transform !== 'matrix(1, 0, 0, 1, 0, 0)' && await page.locator('#hero-cta-text').evaluate(node => node.style.left === '1em' && node.style.top === '50%' && node.style.transform === 'translateY(-50%)'))
    check('Legacy620ms arrows retain their independent source transition', await page.locator('#hero-cta-outgoing').evaluate(node => getComputedStyle(node).transitionDuration.split(',').every(value => value.trim() === '0.62s')))
    await page.locator('#hero-cta').click()
    check('Caller link/click behavior remains intact without destination navigation', (await readState()).clicks === 1 && page.url() === 'about:blank')
    await page.evaluate(() => { window.__keepText = document.getElementById('text-home'); window.__keepBlock = __keepText.firstElementChild; window.__edited = true; render() })
    await wait(() => read().rows.find(row => row.id === 'text-home')?.duplicate === 'Home updated')
    check('A genuine editable text update refreshes only the generated copy and preserves actual text/paragraph IDs', await page.evaluate(() => document.getElementById('text-home') === __keepText && __keepText.firstElementChild === __keepBlock && __keepText.textContent === 'Home updated'))
    await page.evaluate(() => { window.__oldBlock = document.getElementById('text-home').firstElementChild; __blockTag = 'h3'; render() })
    await wait(() => read().rows.every(row => row.blockTag === 'H3' && row.admission === 'ready'))
    check('Inner paragraph replacement releases the detached old block and admits the new semantic block', await page.evaluate(() => !__oldBlock.hasAttribute('data-cantor-roll-block') && !__oldBlock.hasAttribute('data-cantor-roll-copy')))
    await page.evaluate(() => { window.__oldAnchor = document.getElementById('nav-home'); const replacement = document.createElement('a'); replacement.id = 'nav-home'; replacement.href = '/source-home'; replacement.className = __oldAnchor.className; replacement.style.cssText = __oldAnchor.style.cssText; while (__oldAnchor.firstChild) replacement.append(__oldAnchor.firstChild); __oldAnchor.replaceWith(replacement) })
    await wait(() => read().rows.find(row => row.id === 'text-home')?.admission === 'ready' && document.getElementById('nav-home').hasAttribute('data-cantor-roll-trigger'))
    check('Semantic link replacement restores the old anchor and follows the same retained native text', await page.evaluate(() => !__oldAnchor.hasAttribute('data-cantor-roll-trigger') && !__oldAnchor.hasAttribute('data-cantor-roll-nav')))
    await page.evaluate(() => { document.getElementById('body-area').style.display = 'none' })
    await wait(() => read().rows.filter(row => ['hero-cta-text', 'foundation-cta-text'].includes(row.id)).every(row => row.admission === 'suspended'))
    check('Hidden internal/ancestor wrappers remove finite rolling admission', (await readState()).rows.filter(row => ['hero-cta-text', 'foundation-cta-text'].includes(row.id)).every(row => row.pseudoContent === 'none'))
    await page.evaluate(() => { document.getElementById('body-area').style.display = ''; document.getElementById('body-area').classList.add('zero') })
    await page.waitForTimeout(130); await page.evaluate(() => document.getElementById('body-area').classList.remove('zero'))
    await wait(() => read().rows.find(row => row.id === 'hero-cta-text')?.admission === 'ready')
    check('Actual ancestor CSS-opacity completion wakes the previously suspended labels without scroll', (await readState()).rows.find(row => row.id === 'foundation-cta-text').admission === 'ready')
    await page.evaluate(() => hide(true)); await wait(() => read().rows.every(row => row.admission === 'suspended'))
    check('Document hiding suspends all ten labels and restores plain native paint', (await readState()).navCount === 0)
    await page.evaluate(() => hide(false)); await wait(() => read().rows.filter(row => row.admission === 'ready').length === 10)
    await page.evaluate(() => scrollTo(0, 1000)); await wait(() => read().rows.every(row => row.admission === 'suspended'))
    check('Offscreen labels relinquish all rolling/opacity markers', (await readState()).navCount === 0)
    await page.evaluate(() => scrollTo(0, 0)); await wait(() => read().rows.filter(row => row.admission === 'ready').length === 10)
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.locator('#nav-products').hover(); await page.waitForTimeout(40)
    const reduced = await readState()
    check('Project reduced-motion policy keeps native text still without pseudo copies or sibling dimming', reduced.rows.every(row => row.transform === 'none' && row.pseudoContent === 'none' && row.anchorOpacity === '1'))
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.mouse.move(1350, 850)
    await page.evaluate(() => { window.__tag = 'section'; render() })
    await wait(() => read().rootTag === 'SECTION' && read().rows.filter(row => row.admission === 'ready').length === 10)
    check('Root/native-host replacement preserves forwarding and drops all detached observer targets', (await readState()).refMatches && (await readState()).ownedObserverTargets.every(row => row.detached === 0))
    for (const target of ['canvas', 'export', 'thumbnail', 'static']) {
        await page.evaluate(target => { __target = target === 'static' ? 'preview' : target; __static = target === 'static'; render() }, target)
        await wait(() => read().scopeCount === 0)
        check(target + ' restores native text/attributes and releases all owned observer/listener targets', await page.evaluate(() => read().rows.length === 0 && read().navCount === 0 && read().ownedObserverTargets.every(row => row.connected === 0 && row.detached === 0) && read().ownedListeners === 0))
    }
    await page.evaluate(() => { __target = 'preview'; __static = false; __tag = 'div'; __blockTag = 'p'; __epoch++; __edited = false; render() })
    await wait(() => read().rows.filter(row => row.admission === 'ready').length === 10)
    await page.setViewportSize({ width: 991, height: 900 }); await page.locator('#nav-home').hover(); await page.waitForTimeout(50)
    check('Initial wide wrapping deactivates below source992 while keeping native text intact', (await readState()).rows.every(row => row.transform === 'none' && row.pseudoContent === 'none'))
    await page.setViewportSize({ width: 992, height: 900 }); await page.mouse.move(980, 880); await page.waitForTimeout(60)
    check('Initial wide wrapping reactivates at exact source992 through CSS', (await readState()).rows.some(row => row.transitionDuration === '0.95s'))
    await page.setViewportSize({ width: 390, height: 844 }); await page.evaluate(() => { __epoch++; render() })
    await wait(() => read().rows.length === 10 && read().rows.every(row => row.admission === 'initial-coarse-or-narrow'))
    const phone = await save('initial-phone')
    check('Fresh Phone creates no wrapping or owned observer work and preserves all eleven plain menu labels', phone.scopeCount === 0 && phone.navCount === 0 && phone.ownedObserverTargets.every(row => row.connected === 0) && !phone.phoneMenuHasRolling)
    await page.setViewportSize({ width: 1440, height: 900 }); await page.evaluate(() => render()); await page.locator('#nav-home').hover(); await page.waitForTimeout(50)
    check('Initial Phone does not invent a resize-time wrapping initialization absent from the original script', (await readState()).rows.every(row => row.admission === 'initial-coarse-or-narrow' && row.pseudoContent === 'none'))
    await page.evaluate(() => { __coarse = true; __epoch++; render() })
    await wait(() => read().rows.every(row => row.admission === 'initial-coarse-or-narrow'))
    check('The initial coarse-capability gate remains inert in the explicitly mocked capability branch', (await readState()).scopeCount === 0)
    await page.evaluate(() => { __coarse = false; __epoch++; render() }); await wait(() => read().rows.filter(row => row.admission === 'ready').length === 10)
    await page.evaluate(() => { const p = document.getElementById('text-home').firstElementChild; p.setAttribute('data-cantor-roll-copy', 'caller-took-ownership'); window.__callerBlock = p })
    await page.waitForTimeout(30)
    await page.evaluate(() => ReactDOM.flushSync(() => __root.unmount())); await page.waitForTimeout(40)
    check('Ownership-aware cleanup preserves a newer caller attribute value', await page.evaluate(() => __callerBlock.getAttribute('data-cantor-roll-copy') === 'caller-took-ownership' && !__callerBlock.hasAttribute('data-cantor-roll-block')))
    const final = await readState()
    check('Cleanup leaves no owned observers, completion listeners, timers or RAF work', final.ownedObserverTargets.every(row => row.connected === 0 && row.detached === 0) && final.ownedListeners === 0 && final.frames === 0 && final.timers === 0)
    check('No runtime errors or external requests occur', errors.length === 0 && requests.length === 0)
    const result = { passed: true, checks, sourceSHA256: hash(source), testSHA256: hash(fs.readFileSync(import.meta.filename)), openingSHA256: hash(opening), legacySHA256: hash(legacy), sourceFonts: fonts.map(({ data, ...font }) => font), errors, requests, states, limits: ['Native-like public semantic DOM bridge; actual Framer host/paragraph/anchor paint, Preview and reload are unverified.', 'No new original-site navigation or animation audit; timing/selectors derive from retained source CSS.', 'The narrow Phone case uses actual viewport390; the coarse-only admission case explicitly mocks the capability API.', 'Reduced motion and frozen rendering intentionally follow project policy rather than the original rolling CSS.'] }
    fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n')
    console.log(JSON.stringify({ passed: true, checks: checks.length, sourceSHA256: hash(source), evidence: path.join(out, 'result.json') }))
} catch (error) {
    try { states.push({ name: 'failure-current-native-state', state: await readState() }) } catch {}
    fs.writeFileSync(path.join(out, 'failure.json'), JSON.stringify({ passed: false, checks, error: String(error.stack ?? error), errors, requests, states, sourceSHA256: hash(source), testSHA256: hash(fs.readFileSync(import.meta.filename)) }, null, 2) + '\n')
    throw error
} finally {
    await context.close(); await browser.close()
}
