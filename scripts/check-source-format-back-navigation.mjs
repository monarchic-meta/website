import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import vm from 'node:vm'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(process.env.MONARCHIC_REPO_ROOT ?? fileURLToPath(new URL('../', import.meta.url)))
const require = createRequire(path.join(repo, 'package.json'))
const ts = require('typescript')
const sourcePath = process.env.MONARCHIC_FORMAT_BACK_SOURCE_PATH ?? path.join(repo, 'docs/design-studies/code-components/SourceHeroNativeBehaviors.tsx')
const fixtureRoot = process.env.MONARCHIC_FORMAT_BACK_FIXTURE_ROOT ?? path.join(repo, 'scripts/fixtures/source-format-back-navigation')
const oracleInputs = JSON.parse(fs.readFileSync(path.join(fixtureRoot, 'oracle-inputs.json')))
const dto = JSON.parse(fs.readFileSync(path.join(fixtureRoot, 'native-topology19.json')))
const bytes = fs.readFileSync(sourcePath), source = bytes.toString(), chapter = bytes.subarray(73172).toString()
const hash = value => crypto.createHash('sha256').update(value).digest('hex')
const out = process.env.MONARCHIC_FORMAT_BACK_EVIDENCE_DIR ?? '/tmp/monarchic-format-back-navigation'
const checks = [], samples = [], errors = []
const check = (name, value) => { assert.ok(value, name); checks.push(name) }
fs.mkdirSync(out, { recursive: true })
fs.copyFileSync(sourcePath, path.join(out, 'SourceHeroNativeBehaviors.tsx'))
fs.copyFileSync(fileURLToPath(import.meta.url), path.join(out, 'checker.mjs'))
const result = passed => ({ passed, sourceSHA256: hash(bytes), checkerSHA256: hash(fs.readFileSync(fileURLToPath(import.meta.url))), checks, samples, errors, actualFramerAuthored: false, actualPreview: false, afterEditorReload: false, limits: ['Source code/CSS oracle and native-like ReactDOM are separate from actual Framer forwarding and paint.', 'Existing viewport invalidations replace the original GSAP ticker; no new ambient task is added.', 'Missing/ambiguous public root or footer forwarding fails closed. Unsignalled same-node reparenting and actual responsive duplicate mounts remain explicit bridge gates.', 'Original source hides this back-nav under its desktop-only Phone/coarse splash. Existing body adaptation below1280 remains separate.'] })

check('All 73,172 bytes and 50 prior public roles remain exact', hash(bytes.subarray(0, 73172)) === 'aeb727d3dd158135de6f8c67abe44e4bcee2dc00e91624cc5a9bd237fb1389ce')
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX)
const exports = ast.statements.filter(node => ts.isFunctionDeclaration(node) && node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)).map(node => node.name.text)
check('Exactly six directly typed roles append; old FooterFlow, handlers and scheduler remain authoritative', exports.length === 56 && exports.slice(-6).join(',') === 'withFormatBackNavigation,withFormatBackNavigationFooterProbe,withFormatBackNavigationNotes,withFormatBackNavigationDaughter,withFormatBackNavigationText,withFormatBackNavigationRule' && (chapter.match(/export function \w+\(Component: ComponentType<LayerProps>\): ComponentType<LayerProps>/g) ?? []).length === 6 && !/^import/m.test(chapter) && !/requestAnimationFrame\(|setTimeout\(|setInterval\(|querySelector\(|getElementById\(|let toggles|withFormatFooterFlow/.test(chapter))
check('The native proposal is19 new families only, with no new counter/bracket RTEs or old moves', dto.logicalFamilies === 19 && dto.counts.frames === 12 && dto.counts.richText === 7 && dto.counts.numericRTEs === 0 && dto.counts.bracketRTEs === 0 && dto.topologicalParts.find(part => part.key === 'footer-witness').parent === 'ehCNq_V0B')
for (const key of ['fragment', 'css', 'html']) assert.equal(hash(fs.readFileSync(path.join(fixtureRoot, path.basename(oracleInputs[key].path)))), oracleInputs[key].sha256)
check('Original ed/CSS/HTML oracle inputs are pinned, including literal delayed visibility', oracleInputs.fragment.sha256 === '01b433fecd5be38490328a321944fe9accad113dc4f551dbf861f7f79f329dfe' && oracleInputs.sourceCSSVisibilityClause.text.includes('visibility 0s linear .45s'))

const reactStub = `export interface CSSProperties{[key:string]:string|number|undefined};export type ForwardedRef<T>=((v:T|null)=>void)|{current:T|null}|null;export type ComponentType<P={}>=(p:P)=>unknown;export function forwardRef<T,P>(f:(p:P,r:ForwardedRef<T>)=>unknown):ComponentType<P>;export function useSyncExternalStore<T>(s:(n:()=>void)=>()=>void,g:()=>T,ss:()=>T):T;export interface MouseEvent<T>{currentTarget:T;defaultPrevented:boolean;preventDefault():void;clientX:number;clientY:number};export interface KeyboardEvent<T>{currentTarget:T;defaultPrevented:boolean;key:string;preventDefault():void};export interface FocusEvent<T>{currentTarget:T;defaultPrevented:boolean;preventDefault():void};export type MouseEventHandler<T>=(e:MouseEvent<T>)=>void;export type KeyboardEventHandler<T>=(e:KeyboardEvent<T>)=>void;export function useRef<T>(v:T):{current:T};export function useRef<T>(v:T|null):{readonly current:T|null};export function useState<T>(v:T|(()=>T)):[T,(v:T|((p:T)=>T))=>void];export function useCallback<T extends (...args:never[])=>unknown>(v:T,d:unknown[]):T;export function useEffect(f:()=>void|(()=>void),d:unknown[]):void;export function useLayoutEffect(f:()=>void|(()=>void),d:unknown[]):void;export function createElement(...a:unknown[]):unknown;export interface Context<T>{Provider:ComponentType<{value:T;children?:unknown}>;__type?:T};export function createContext<T>(v:T):Context<T>;export function useContext<T>(c:Context<T>):T;export function useId():string;declare global{namespace JSX{interface IntrinsicElements{style:{children?:string}}}}`
const defs = new Map([[repo + '/__back-react.d.ts', reactStub], [repo + '/__back-framer.d.ts', 'export const RenderTarget:{canvas:string;export:string;thumbnail:string;current():string};export function useIsStaticRenderer():boolean;']])
const options = { strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2020, lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'], module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Node10, jsx: ts.JsxEmit.React, baseUrl: repo, paths: { react: ['__back-react.d.ts'], framer: ['__back-framer.d.ts'] } }
const host = ts.createCompilerHost(options), read = host.readFile.bind(host), exists = host.fileExists.bind(host)
host.readFile = file => defs.get(file) ?? read(file); host.fileExists = file => defs.has(file) || exists(file)
host.getSourceFile = (file, version) => { const text = host.readFile(file); return text === undefined ? undefined : ts.createSourceFile(file, text, version, true) }
const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([sourcePath], options, host))
assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory: () => repo, getCanonicalFileName: file => file, getNewLine: () => '\n' }))
checks.push('Strict ES2020/DOM and React18 nullable-ref/context compilation passes')
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText
const React = require('react'), API = {}, mode = { target: 'canvas', static: false }
const helpers = new Function('require', 'exports', js + ';return {formatBackDecision};')(name => name === 'react' ? React : { RenderTarget: { canvas: 'canvas', export: 'export', thumbnail: 'thumbnail', current: () => mode.target }, useIsStaticRenderer: () => mode.static }, API)
const Native = React.forwardRef((props, ref) => React.createElement('div', { ...props, ref }))
const Nav = API.withFormatBackNavigation(Native), quiet = console.error
try {
    console.error = (...args) => { if (!String(args[0]).includes('useLayoutEffect does nothing')) quiet(...args) }
    for (const [target, staticFlag] of [['canvas', false], ['export', false], ['thumbnail', false], ['preview', true]]) {
        mode.target = target; mode.static = staticFlag
        const html = require('react-dom/server').renderToString(React.createElement(Nav, { title: 'caller', style: { width: 1400, height: 16, transform: 'rotate(2deg)' } }, 'Editable source text'))
        check(target + '/' + staticFlag + ' freezes initial hidden nav and preserves native caller geometry/content', html.includes('Editable source text') && html.includes('rotate(2deg)') && html.includes('width:1400px') && html.includes('aria-hidden="true"') && html.includes('visibility:hidden'))
    }
} finally { console.error = quiet }

const handlers = new Map(), oracleState = { shown: false, footerTop: 18000 }, fakeWindow = { scrollY: 0, innerHeight: 900 }
let ticker
const fakeNav = { addEventListener: (name, callback) => handlers.set(name, callback), classList: { toggle: (_name, value) => { oracleState.shown = value } }, setAttribute: () => {} }
vm.runInNewContext(fs.readFileSync(path.join(fixtureRoot, 'original-back-nav.inspection.js'), 'utf8'), { window: fakeWindow, document: { querySelector: selector => selector === '.back-nav' ? fakeNav : { getBoundingClientRect: () => ({ top: oracleState.footerTop }) } }, J: { ticker: { add: callback => { ticker = callback } } } })
let ownShown = false, previousY = 0, ownHold = false
const trace = [
    { y: 1800 }, { y: 1803 }, { y: 1800 }, { y: 1802 }, { y: 1805 }, { y: 1802 },
    { event: 'pointerenter', y: 1810 }, { event: 'focusout', y: 1813 }, { event: 'focusin', y: 1810 }, { event: 'pointerleave', y: 1813 },
    { event: 'pointerenter', footer: 899, y: 1810 }, { footer: 900, y: 1807 }, { y: 1799 }, { y: 1800 }, { y: 1803 }, { y: 1800 },
]
for (const step of trace) {
    if (step.event) { handlers.get(step.event)(); ownHold = step.event === 'pointerenter' || step.event === 'focusin' }
    if (step.footer !== undefined) oracleState.footerTop = step.footer
    fakeWindow.scrollY = step.y; ticker()
    ownShown = helpers.formatBackDecision(ownShown, step.y, previousY, 900, oracleState.footerTop, ownHold); previousY = step.y
    assert.equal(ownShown, oracleState.shown, JSON.stringify(step)); samples.push({ oracleStep: step, shown: ownShown })
}
check('Independent original ed trace agrees at exact±2/2vh/footer boundaries and single-flag pointer/focus quirks', true)
check('The source hold flag is not an invented pointer OR focus lock', ownHold === true && samples.find(sample => sample.oracleStep.event === 'pointerleave').shown === false)
if (process.argv.includes('--static-only')) { fs.writeFileSync(path.join(out, 'static-result.json'), JSON.stringify(result(true), null, 2) + '\n'); console.log(JSON.stringify({ passed: true, checks: checks.length, out })); process.exit(0) }

const fontPath = process.env.MONARCHIC_FORMAT_BACK_FONT_PATH
assert.ok(fontPath, 'Set MONARCHIC_FORMAT_BACK_FONT_PATH to the genuine source Obys comparison font (external/Nix-only; never a repo/runtime asset). No font fallback is allowed.')
const font = fs.readFileSync(fontPath); assert.equal(hash(font), oracleInputs.comparisonFont.sha256)
const originalHTML = fs.readFileSync(path.join(fixtureRoot, 'original-back-nav.html'), 'utf8'), originalCSS = fs.readFileSync(path.join(fixtureRoot, 'original-back-nav.css'), 'utf8')
const server = http.createServer((req, res) => { if (req.url === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end('<!doctype html><style>html,body{margin:0;overflow-x:hidden}*{box-sizing:border-box}body{height:24000px}</style><div id="mount"></div><div id="original">' + originalHTML + '</div>'); return }; res.writeHead(404); res.end() })
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const origin = 'http://127.0.0.1:' + server.address().port, { chromium } = require('@playwright/test')
let browser, context, page
try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] })
    context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
    page = await context.newPage(); page.on('pageerror', error => errors.push(error.message))
    await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort())
    await page.goto(origin)
    check('Original HTML oracle preserves UTF8 em dash and Daughter curly apostrophe before any geometry comparison', await page.evaluate(() => document.characterSet.toUpperCase() === 'UTF-8' && document.querySelector('.back-nav__credits').textContent.includes('Format — ') && document.querySelector('.back-nav__toggle--daughter').textContent.includes('Daughter’s')))
    for (const name of ['react', 'react-dom']) await page.addScriptTag({ content: fs.readFileSync(path.join(path.dirname(require.resolve(name + '/package.json')), 'umd/' + name + '.development.js'), 'utf8') })
    await page.addStyleTag({ content: '@font-face{font-family:FixtureObys;src:url(data:font/woff2;base64,' + font.toString('base64') + ')}body{font-family:FixtureObys}' + originalCSS + '#original,#original *{pointer-events:none!important}' })
    await page.evaluate(() => {
        window.__target = 'preview'; window.__static = false; window.__hidden = false; window.__coarse = false; window.__reduced = false; window.__cancel = false; window.__callerCount = 0
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => __hidden })
        const queries = new Map()
        window.matchMedia = query => { if (!queries.has(query)) { const item = new EventTarget(); Object.defineProperty(item, 'matches', { get: () => query.includes('prefers-reduced') ? __reduced : query.includes('pointer: coarse') ? __coarse || innerWidth <= 767 : false }); queries.set(query, item) }; return queries.get(query) }
        window.setCoarse = value => { __coarse = value; for (const item of queries.values()) item.dispatchEvent(new Event('change')) }
        window.setReduced = value => { __reduced = value; for (const item of queries.values()) item.dispatchEvent(new Event('change')) }
        window.setHidden = value => { __hidden = value; document.dispatchEvent(new Event('visibilitychange')) }
        window.__observers = new Map(); window.__frames = new Set()
        for (const kind of ['ResizeObserver', 'MutationObserver', 'IntersectionObserver']) { const Original = window[kind]; window[kind] = class extends Original { constructor(callback) { super(callback); __observers.set(this, { kind, targets: new Set() }) } observe(node, ...args) { __observers.get(this).targets.add(node); return super.observe(node, ...args) } unobserve(node) { __observers.get(this).targets.delete(node); return super.unobserve(node) } disconnect() { __observers.get(this).targets.clear(); return super.disconnect() } } }
        const raf = requestAnimationFrame, cancel = cancelAnimationFrame
        window.requestAnimationFrame = callback => { const id = raf(time => { __frames.delete(id); callback(time) }); __frames.add(id); return id }; window.cancelAnimationFrame = id => { __frames.delete(id); cancel(id) }
    })
    const install = async () => page.addScriptTag({ content: '(()=>{const exports={};const require=name=>name==="react"?window.React:{RenderTarget:{canvas:"canvas",export:"export",thumbnail:"thumbnail",current:()=>__target},useIsStaticRenderer:()=>__static};' + js + ';window.API=exports;window.installBackRoles();window.backWorld=root=>{const w=formatBackWorlds.get(root);return w?{navs:w.navs.size,probes:w.probes.size}:null};window.backToggle=(name,value)=>{if(toggles[name]!==value)toggle(name)};for(const item of FORMAT_SPARK_MATERIALS)item.url=null;})()' })
    await page.evaluate(rteStyles => {
        const E = React.createElement
        window.rteStyles = rteStyles
        window.NativeFrame = React.forwardRef(({ tag = 'div', onTap, children, ...props }, ref) => E(tag, { ...props, ref: node => { if (node) node.__tap = onTap; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node } }, children))
        window.NativeText = React.forwardRef(({ tag = 'div', text, children, style, ...props }, ref) => E(tag, { ...props, style: { position: 'relative', left: 30, top: 242.5, fontFamily: 'FixtureObys', fontSize: 12, lineHeight: '12px', color: '#000', whiteSpace: 'normal', width: 'max-content', ...style }, ref }, E('p', { style: { fontFamily: 'FixtureObys', fontSize: '12px', lineHeight: 'inherit', color: '#000', whiteSpace: 'normal', textDecoration: 'underline', margin: 0 } }, E('span', { style: { color: '#000', fontSize: '12px' } }, text ?? children))))
        window.roles = {}; window.installBackRoles = () => {
            roles.Nav = API.withFormatBackNavigation(NativeFrame); roles.Probe = API.withFormatBackNavigationFooterProbe(NativeFrame)
            roles.Notes = API.withFormatBackNavigationNotes(NativeFrame); roles.Daughter = API.withFormatBackNavigationDaughter(NativeFrame)
            roles.Text = API.withFormatBackNavigationText(NativeText); roles.Rule = API.withFormatBackNavigationRule(NativeFrame)
            roles.OldNotes = API.withFormatNotesButton(NativeFrame); roles.OldDaughter = API.withFormatDaughterButton(NativeFrame)
            roles.OldNotesValue = API.withFormatNotesValue(NativeText); roles.OldDaughterValue = API.withFormatDaughterValue(NativeText)
        }
        const proxy = name => React.forwardRef((props, ref) => roles[name].render(props, ref))
        window.P = Object.fromEntries(['Nav', 'Probe', 'Notes', 'Daughter', 'Text', 'Rule', 'OldNotes', 'OldDaughter', 'OldNotesValue', 'OldDaughterValue'].map(name => [name, proxy(name)]))
        window.config = { tag: 'nav', probe: false, probeTag: 'div', duplicateProbe: false, rootTag: 'div', refMode: 'A' }; window.rootRefs = []; window.navRefs = []; window.probeRefs = []; window.refA = null; window.refB = null; window.captureNavA = node => { refA = node; navRefs.push(node) }; window.captureNavB = node => { refB = node; navRefs.push(node) }
        window.caller = event => { __callerCount++; if (__cancel) event.preventDefault() }
        window.App = () => {
            const link = (key, href, label) => E('div', { key, style: { position: 'relative', height: 12, width: 'max-content' } }, E(P.Text, { tag: 'a', href, target: '_blank', rel: 'noopener', id: key, style: rteStyles[key + '-text'] }, label), E(P.Rule, { id: key + '-rule', style: { position: 'absolute', left: 0, top: '100%', width: '100%' } }))
            const button = (Kind, key, right, label) => E(Kind, { key, tag: 'button', id: key, onClick: caller, onTap: caller, onKeyDown: caller, style: { position: 'absolute', top: -1.5, right, height: 18, display: 'flex', alignItems: 'center', width: 'max-content', padding: 0, border: 0, background: 'transparent', fontFamily: 'FixtureObys', fontSize: 12, lineHeight: '18px' } }, E(P.Text, { id: key + '-text', style: rteStyles[key + '-label'] }, label), E(P.Rule, { id: key + '-rule', style: { position: 'absolute', left: 0, top: 15, width: '100%' } }))
            return E(config.rootTag, { 'data-format-source-height': '24000', id: 'scope', ref: node => { if (node) rootRefs.push(node) }, style: { position: 'relative', width: '100%', height: 24000 } },
                E(P.Nav, { tag: config.tag, id: 'native-nav', ref: config.refMode === 'A' ? captureNavA : captureNavB, title: 'caller-nav', style: { position: 'fixed', left: 20, top: 10, width: 1400, height: 16 } },
                    E('div', { style: { position: 'absolute', inset: 0, background: '#fff' } }),
                    E('div', { id: 'credits', style: { position: 'absolute', left: 10, top: -1.5, height: 18, display: 'flex', gap: 0, alignItems: 'center' } }, E(P.Text, { style: rteStyles['credits-prefix'] }, 'Format — '), link('obys', 'https://obys.agency/', 'Obys'), E(P.Text, { style: rteStyles['credits-and'] }, ' and '), link('des', 'https://des.obys.agency/', 'DES'), E(P.Text, { style: rteStyles['credits-suffix'] }, ' Special Project')),
                    button(P.Notes, 'notes', 191, 'Notes Mode'), button(P.Daughter, 'daughter', 9, 'My 6 y.o. Daughter’s Version')),
                E('div', { id: 'footer', style: { position: 'absolute', top: 20000, height: 273, width: 1400 } }, config.probe ? E(P.Probe, { tag: config.probeTag, id: 'probe', ref: node => probeRefs.push(node), style: { position: 'absolute', left: 0, top: 0 } }) : null, config.duplicateProbe ? E(P.Probe, { id: 'probe2', style: { position: 'absolute', left: 0, top: 0 } }) : null),
                E('div', { style: { position: 'absolute', top: 18000 } }, E(P.OldNotes, { tag: 'button', id: 'old-notes' }, 'Old notes'), E(P.OldDaughter, { tag: 'button', id: 'old-daughter' }, 'Old daughter'), E(P.OldNotesValue, { id: 'old-notes-value', text: '0' }), E(P.OldDaughterValue, { id: 'old-daughter-value', text: '0' })))
        }
        window.root = ReactDOM.createRoot(document.getElementById('mount')); window.render = () => root.render(E(App)); window.tap = id => { const node = document.getElementById(id); node.__tap({ currentTarget: node, clientX: 1300, clientY: 20, defaultPrevented: false, preventDefault() { this.defaultPrevented = true } }) }
    }, Object.fromEntries(dto.topologicalParts.filter(part => part.type === 'RichTextNode').map(part => [part.key, { position: part.attrs.position, left: parseFloat(part.attrs.left), top: parseFloat(part.attrs.top), height: parseFloat(part.attrs.height), width: part.attrs.width === 'auto' ? 'max-content' : part.attrs.width, lineHeight: part.attrs.lineHeight }])))
    await install(); await page.evaluate(() => render()); await page.evaluate(() => document.fonts.load('12px FixtureObys')); await page.evaluate(() => document.fonts.ready)
    check('Genuine source Obys font is loaded rather than silently falling back', await page.evaluate(() => document.fonts.check('12px FixtureObys')))
    const wait = predicate => page.waitForFunction(predicate, null, { polling: 20, timeout: 5000 })
    const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
    const scroll = async y => { await page.evaluate(y => window.scrollTo(0, y), y); await pause(60) }
    const shown = () => page.evaluate(() => document.getElementById('native-nav').dataset.formatBackShown === '1')
    await wait(() => document.getElementById('native-nav')?.dataset.formatBackBridge === 'awaiting-footer')
    await scroll(2100); await scroll(2090)
    check('Late footer forwarding fails closed instead of inventing source footer geometry', !await shown())
    await page.evaluate(() => { config.probe = true; render() }); await wait(() => document.getElementById('native-nav').dataset.formatBackBridge === 'ready')
    await scroll(2080); await pause(480)
    check('The separate back nav reveals on upward reading after2viewports with its own positive footer ref', await shown())
    await page.evaluate(() => { document.querySelector('.back-nav').classList.add('is-down') })
    await pause(480)
    for (const width of [1440, 1280, 1920]) {
        await page.setViewportSize({ width, height: 900 }); await pause(120)
        const geometry = await page.evaluate(() => { const a = document.getElementById('native-nav').getBoundingClientRect(), b = document.querySelector('.back-nav').getBoundingClientRect(); return { width: innerWidth, native: [a.left, a.top, a.width, a.height], source: [b.left, b.top, b.width, b.height], rules: [...document.querySelectorAll('[data-format-back-rule]')].map(node => node.getBoundingClientRect().height) } })
        samples.push({ geometry }); check('Native nav and physical1px rules match literal source CSS at width' + width, geometry.native.every((value, index) => Math.abs(value - geometry.source[index]) < .04) && geometry.rules.length === 4 && geometry.rules.every(value => Math.abs(value - 1) < .04))
    }
    await page.setViewportSize({ width: 1440, height: 900 }); await pause(100)
    await page.evaluate(() => { const node = document.createElement('div'); node.id = 'parent-color-only'; node.style.color = '#939393'; node.innerHTML = '<p style="color:#000"><span style="color:#000">Unrelated native color</span></p>'; document.body.appendChild(node) })
    check('A parent-color-only negative remains black and owned color CSS does not alter unrelated native text', await page.evaluate(() => getComputedStyle(document.querySelector('#parent-color-only span')).color === 'rgb(0, 0, 0)'))
    const credits = await page.evaluate(() => { const original = document.querySelector('.back-nav__credits'); const native = document.getElementById('credits'); const rect = node => { const r = node.getBoundingClientRect(); return [r.left, r.top, r.width, r.height] }; return { native: rect(native), source: rect(original), links: ['obys', 'des'].map(id => ({ native: rect(document.getElementById(id)), source: rect(original.querySelector('a[href="https://' + (id === 'obys' ? 'obys.agency' : 'des.obys.agency') + '/"]')) })) } })
    const creditDiagnostics = await page.evaluate(() => {
        const sourceP = document.querySelector('.back-nav__credits'), nativeRoot = document.querySelector('#credits >[data-format-back-text]'), nativeSpan = nativeRoot.querySelector('span'), sourceNode = sourceP.firstChild, nativeNode = nativeSpan.firstChild
        const rect = r => [r.left, r.top, r.width, r.height], range = (node, start, end) => { const r = document.createRange(); r.setStart(node, start); r.setEnd(node, end); return { bounds: rect(r.getBoundingClientRect()), rects: [...r.getClientRects()].map(rect) } }, styles = node => { const s = getComputedStyle(node); return Object.fromEntries(['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','wordSpacing','whiteSpace','fontKerning','fontFeatureSettings','fontVariationSettings','textRendering','textDecorationLine'].map(key => [key,s[key]])) }, detail = node => { const start = node.textContent.indexOf('Format'), visible = node.textContent.slice(start,start+9); return { raw: node.textContent, codePoints: [...node.textContent].map(c=>c.codePointAt(0)), all: range(node,0,node.length), visible: range(node,start,start+9), pieces: [range(node,start,start+6),range(node,start+6,start+7),range(node,start+7,start+8),range(node,start+8,start+9)], visibleText:visible } }
        const marker = nativeRoot.getAttribute('data-format-back-text'), ownRules = [...document.styleSheets].flatMap(sheet=>[...sheet.cssRules]).filter(rule=>String(rule.selectorText).includes(marker)).map(rule=>rule.cssText)
        return { sourceText: detail(sourceNode), nativeText: detail(nativeNode), sourceStyles: styles(sourceP), nativeStyles: styles(nativeRoot), nativePStyles: styles(nativeRoot.querySelector('p')), nativeSpanStyles: styles(nativeSpan), sourceHTML: sourceP.innerHTML, nativeHTML: nativeRoot.outerHTML, ownRules }
    })
    samples.push({ credits, creditDiagnostics }); check('Split editable credits retain actual source spaces and link rectangles despite native normal whitespace', credits.native.every((value, index) => Math.abs(value - credits.source[index]) < .1) && credits.links.every(link => link.native.every((value, index) => Math.abs(value - link.source[index]) < .1)))
    const sourceLabel = await page.evaluate(() => ['notes', 'daughter'].map(id => { const actual = document.getElementById(id + '-text').getBoundingClientRect(), original = document.querySelector('.back-nav__toggle--' + id + ' .u').getBoundingClientRect(); return { id, native: [actual.left, actual.top, actual.width, actual.height], source: [original.left, original.top, original.width, original.height] } }))
    samples.push({ sourceLabel }); check('Genuine Obys native-like editable label rectangles match corresponding source inline boxes', sourceLabel.every(row => row.native.every((value, index) => Math.abs(value - row.source[index]) < .1)))
    await page.evaluate(() => { config.refMode = 'B'; render() }); await pause(60)
    check('Changing the forwarded caller ref relays old null/new host without resetting shown state', await shown() && await page.evaluate(() => refA === null && refB === document.getElementById('native-nav')))
    await page.evaluate(() => { __cancel = true; tap('notes'); document.getElementById('notes').click() }); await pause(100)
    check('Cancelled tap→click preserves old mode state and old opening0value', await page.evaluate(() => document.getElementById('notes').getAttribute('aria-pressed') === 'false' && document.getElementById('old-notes-value').textContent === '0'))
    await pause(360); await page.evaluate(() => { __cancel = false; tap('notes'); document.getElementById('notes').click() }); await pause(390)
    check('Accepted back-nav gesture updates both old opening controls and their untouched live0/1value bindings once', await page.evaluate(() => document.getElementById('notes').getAttribute('aria-pressed') === 'true' && document.getElementById('old-notes').getAttribute('aria-pressed') === 'true' && document.getElementById('old-notes-value').textContent === '1'))
    check('Explicit native inner p/span colors become active-only#939393 through owned public markers', await page.evaluate(() => [document.getElementById('notes-text'), ...document.querySelectorAll('#notes-text p,#notes-text span')].every(node => getComputedStyle(node).color === 'rgb(147, 147, 147)') && getComputedStyle(document.getElementById('notes-rule')).backgroundColor === 'rgb(147, 147, 147)' && getComputedStyle(document.querySelector('#daughter-text span')).color === 'rgb(0, 0, 0)'))
    check('Owned source text decoration suppresses native/default underlines while keeping four explicit rule Frames', await page.evaluate(() => ['obys', 'des', 'notes-text', 'daughter-text'].every(id => [document.getElementById(id), ...document.querySelectorAll('#' + id + ' p,#' + id + ' span')].every(node => getComputedStyle(node).textDecorationLine === 'none')) && document.querySelectorAll('[data-format-back-rule]').length === 4))
    await page.hover('#obys'); await pause(390)
    check('Source credit link hover does not invent muted color or lose exact URL/new-tab semantics', await page.evaluate(() => getComputedStyle(document.querySelector('#obys span')).color === 'rgb(0, 0, 0)' && document.querySelector('#obys').tagName === 'A' && document.querySelector('#obys').getAttribute('href') === 'https://obys.agency/' && document.querySelector('#obys').getAttribute('target') === '_blank' && document.querySelector('#obys').getAttribute('rel') === 'noopener'))
    await pause(360); await page.evaluate(() => { tap('daughter'); document.getElementById('daughter').click() }); await pause(390)
    check('New Daughter composition uses Source50 once and synchronizes old live value, preserving caller handlers', await page.evaluate(() => document.getElementById('daughter').getAttribute('aria-pressed') === 'true' && document.getElementById('old-daughter-value').textContent === '1' && __callerCount === 6))
    await page.focus('#notes'); await page.keyboard.press('Enter'); await pause(390)
    check('Native button Enter toggles the existing Notes state and retained opening value once', await page.evaluate(() => document.getElementById('old-notes-value').textContent === '0' && document.getElementById('notes').getAttribute('aria-pressed') === 'false'))
    await page.evaluate(() => { __cancel = true }); await page.keyboard.press('Space'); await pause(80)
    check('Caller-cancelled native Space prevents the default click and mode toggle', await page.evaluate(() => document.getElementById('old-notes-value').textContent === '0'))
    await page.evaluate(() => { __cancel = false }); await page.keyboard.press('Space'); await pause(390)
    check('Accepted native Space preserves default activation and active RTE color', await page.evaluate(() => document.getElementById('old-notes-value').textContent === '1' && getComputedStyle(document.querySelector('#notes-text span')).color === 'rgb(147, 147, 147)'))
    await page.mouse.move(700, 500); await scroll(2090)
    check('Source hide disables pointer/aria immediately while retaining visibility through its450ms CSS slide', !await shown() && await page.evaluate(() => { const node = document.getElementById('native-nav'), css = getComputedStyle(node); return css.visibility === 'visible' && css.pointerEvents === 'none' && node.getAttribute('aria-hidden') === 'true' && css.transitionDelay.split(',').some(value => Math.abs(parseFloat(value) - .45) < .001) }))
    await pause(480)
    check('Downward reading finishes hidden after the literal source visibility delay', !await shown() && await page.evaluate(() => getComputedStyle(document.getElementById('native-nav')).visibility === 'hidden'))
    await scroll(2080); await pause(480); await page.hover('#notes'); await scroll(2090)
    check('Pointer hold preserves shown state on a downward delta', await shown())
    await page.focus('#notes'); await page.mouse.move(700, 500); await scroll(2100); await pause(480)
    check('Source single hold flag lets pointerleave release a still-focused nav', !await shown())
    await scroll(2090); await pause(480); await page.evaluate(() => document.getElementById('notes').dispatchEvent(new FocusEvent('focusin', { bubbles: true }))); await scroll(2100)
    check('Focusin holds a shown bar during downward reading', await shown())
    await page.evaluate(() => { document.getElementById('footer').style.top = String(window.scrollY + innerHeight - 1) + 'px' }); await pause(50)
    check('Observed footer-entry gate overrides hover/focus hold without another scroll or ambient ticker', !await shown())
    await page.evaluate(() => { document.getElementById('footer').style.top = '20000px' }); await scroll(1780); await pause(480)
    check('The near-top2vh gate overrides all hold state', !await shown())
    await scroll(2100); await scroll(2090); await pause(480); await page.evaluate(() => { config.tag = 'section'; render() }); await pause(100)
    check('Real forwarded host replacement releases old ref and resets source state', !await shown() && await page.evaluate(() => document.getElementById('native-nav').tagName === 'SECTION' && navRefs.some(node => node === null) && backWorld(document.getElementById('scope')).navs === 1))
    await scroll(2080); await pause(480); await page.evaluate(() => { window.oldProbe = document.getElementById('probe'); config.probeTag = 'section'; render() }); await pause(80)
    check('Probe host replacement releases the exact old observation paths and keeps one valid scope', await page.evaluate(() => document.getElementById('probe').tagName === 'SECTION' && ![...__observers.values()].some(row => row.targets.has(oldProbe)) && backWorld(document.getElementById('scope')).probes === 1))
    await page.evaluate(() => { config.duplicateProbe = true; render() }); await pause(80)
    check('Two probes in one source scope fail closed instead of guessing a responsive footer', !await shown())
    await page.evaluate(() => { config.duplicateProbe = false; render() }); await scroll(2070); await pause(480)
    await page.evaluate(() => setReduced(true)); await pause(30)
    check('Reduced motion keeps functional direction state but removes CSS interpolation', await shown() && await page.evaluate(() => getComputedStyle(document.getElementById('native-nav')).transitionDuration.split(',').every(value => parseFloat(value) === 0)))
    await page.evaluate(() => setCoarse(true)); await pause(30)
    check('Coarse-pointer source splash admission hides this desktop strip', !await shown())
    await page.evaluate(() => { setCoarse(false); setReduced(false) }); await scroll(2070); await pause(480)
    await page.setViewportSize({ width: 390, height: 844 }); await pause(80)
    check('Phone width is hidden by exact source splash query rather than a new mobile menu', !await shown())
    await page.setViewportSize({ width: 992, height: 900 }); await pause(80); await scroll(2060); await pause(480)
    check('Fine992 is not incorrectly gated by the historical1280 body adaptation', await shown())
    await page.evaluate(() => setHidden(true)); await pause(60)
    check('Document hidden cancels visible state and disconnects the owned footer observers', !await shown() && await page.evaluate(() => [...__observers.values()].filter(row => row.kind === 'ResizeObserver' || row.kind === 'MutationObserver').every(row => row.targets.size === 0)))
    await page.evaluate(() => setHidden(false)); await pause(80)
    check('Returning from hidden does not synthesize a direction jump', !await shown())
    await scroll(2050); await pause(480)
    const oldWorld = await page.evaluate(() => { window.oldWorld = backWorld; window.oldRoot = document.getElementById('scope'); return backWorld(oldRoot) })
    await install(); await page.evaluate(() => render()); await pause(100)
    check('Retained-hook module refresh releases old world and pairs fresh nav/probe ownership without Play', oldWorld.navs === 1 && await page.evaluate(() => oldWorld(oldRoot) === null && backWorld(document.getElementById('scope')).navs === 1 && backWorld(document.getElementById('scope')).probes === 1) && !await shown())
    for (const target of ['canvas', 'export', 'thumbnail']) {
        await page.evaluate(target => { __target = target; render() }, target); await pause(60)
        check(target + ' releases the new world/observers and preserves authored initial hidden nav', await page.evaluate(() => backWorld(document.getElementById('scope')) === null && document.getElementById('native-nav').getAttribute('aria-hidden') === 'true' && [...__observers.values()].filter(row => row.kind !== 'IntersectionObserver').every(row => row.targets.size === 0)))
    }
    await page.evaluate(() => { __target = 'preview'; render() }); await wait(() => document.getElementById('native-nav').dataset.formatBackBridge === 'ready'); await scroll(2040); await pause(480)
    check('Returning from frozen targets admits a fresh owned world on the next real upward input without Play', await shown() && await page.evaluate(() => backWorld(document.getElementById('scope')).navs === 1 && backWorld(document.getElementById('scope')).probes === 1))
    await page.evaluate(() => root.unmount()); await pause(80)
    check('Final unmount releases all forwarded refs, owned observers and shared pending RAF', await page.evaluate(() => navRefs.at(-1) === null && probeRefs.at(-1) === null && [...__observers.values()].every(row => row.targets.size === 0) && __frames.size === 0))
    check('No browser runtime errors occurred', errors.length === 0)
    fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify(result(true), null, 2) + '\n')
    console.log(JSON.stringify({ passed: true, checks: checks.length, out }))
} catch (error) {
    fs.writeFileSync(path.join(out, 'failure.json'), JSON.stringify({ ...result(false), error: String(error) }, null, 2) + '\n'); throw error
} finally {
    await context?.close(); await browser?.close(); await new Promise(resolve => server.close(resolve))
}
