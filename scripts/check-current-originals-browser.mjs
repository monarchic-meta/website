import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { chromium } from '@playwright/test'
const require = createRequire(import.meta.url), ts = require('typescript')
const repo = path.resolve(import.meta.dirname, '..'), root = path.join(repo, 'docs/design-studies/code-components')
const out = process.env.MONARCHIC_CURRENT_ORIGINALS_EVIDENCE_DIR ?? '/tmp/monarchic-current-originals-browser'
const sourceRoot = process.env.MONARCHIC_ORIGINAL_SITES_DIR
const hash = value => crypto.createHash('sha256').update(value).digest('hex')
const names = ['SourceJonWayAccordion', 'SourceMezmoTerminal']
const sources = Object.fromEntries(names.map(name => [name, fs.readFileSync(path.join(root, name + '.tsx'), 'utf8')]))
const checks = [], errors = [], verify = (name, condition) => { assert.ok(condition, name); checks.push(name) }
fs.mkdirSync(out, { recursive: true })
const React = fs.readFileSync(path.join(path.dirname(require.resolve('react/package.json')), 'umd/react.development.js'), 'utf8')
const ReactDOM = fs.readFileSync(path.join(path.dirname(require.resolve('react-dom/package.json')), 'umd/react-dom.development.js'), 'utf8')
const codes = Object.fromEntries(names.map(name => [name, ts.transpileModule(sources[name], { reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } })]))
for (const name of names) verify(name + ' transpiles without syntax errors', codes[name].diagnostics.length === 0)
const font = 'export type CSSProperties=Partial<Record<"alignItems"|"background"|"backgroundImage"|"backgroundPosition"|"backgroundRepeat"|"backgroundSize"|"border"|"borderLeft"|"borderRadius"|"bottom"|"boxShadow"|"caretColor"|"color"|"display"|"float"|"font"|"fontSize"|"gap"|"height"|"imageRendering"|"inset"|"justifyContent"|"left"|"letterSpacing"|"lineHeight"|"margin"|"marginBottom"|"marginTop"|"minWidth"|"objectFit"|"opacity"|"outline"|"outlineOffset"|"overflow"|"overflowWrap"|"padding"|"paddingLeft"|"pointerEvents"|"position"|"right"|"scrollbarWidth"|"top"|"touchAction"|"transform"|"transformOrigin"|"transition"|"whiteSpace"|"width"|"zIndex",string|number>>;export type ComponentType<P={}>=((p:P)=>unknown);export interface Context<T>{Provider:ComponentType<{value:T;children?:unknown}>;__type?:T};export function createContext<T>(v:T):Context<T>;export function useContext<T>(c:Context<T>):T;export function forwardRef<T,P>(f:(p:P,r:unknown)=>unknown):ComponentType<P>;export interface SyntheticEvent<T>{defaultPrevented:boolean;currentTarget:T;target:T;preventDefault():void};export interface KeyboardEvent<T>extends SyntheticEvent<T>{key:string;ctrlKey:boolean};export interface ChangeEvent<T>extends SyntheticEvent<T>{};export interface PointerEvent<T>extends SyntheticEvent<T>{clientX:number;clientY:number;pointerType:string};export interface MouseEvent<T>extends SyntheticEvent<T>{};export interface FormEvent extends SyntheticEvent<HTMLFormElement>{};export function useState<T>(v:T|(()=>T)):[T,(v:T|((p:T)=>T))=>void];export function useRef<T>(v:T):{current:T};export function useId():string;export function useLayoutEffect(f:()=>void|(()=>void),d:unknown[]):void;export function useEffect(f:()=>void|(()=>void),d:unknown[]):void;export function createElement(...a:unknown[]):unknown;declare global{namespace JSX{interface IntrinsicElements{[tag:string]:{style?:CSSProperties;[key:string]:unknown}}}}'
const defs = new Map([[repo + '/__current-react.d.ts', font], [repo + '/__current-framer.d.ts', 'export const RenderTarget:{canvas:string;export:string;thumbnail:string;current():string};export function useIsStaticRenderer():boolean;export const ControlType:Record<string,string>;export function addPropertyControls(c:unknown,p:unknown):void;']])
const options = { strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React, moduleResolution: ts.ModuleResolutionKind.Node10, baseUrl: repo, paths: { react: ['__current-react.d.ts'], framer: ['__current-framer.d.ts'] } }
function typeDiagnostics(jonWayOverride, mezmoOverride) {
    const host = ts.createCompilerHost(options), originalRead = host.readFile.bind(host), originalExists = host.fileExists.bind(host)
    host.readFile = p => p === path.join(root, 'SourceJonWayAccordion.tsx') && jonWayOverride !== undefined ? jonWayOverride : p === path.join(root, 'SourceMezmoTerminal.tsx') && mezmoOverride !== undefined ? mezmoOverride : defs.get(p) ?? originalRead(p)
    host.fileExists = p => defs.has(p) || originalExists(p)
    host.getSourceFile = (p, v) => { const text = host.readFile(p); return text === undefined ? undefined : ts.createSourceFile(p, text, v, true) }
    return ts.getPreEmitDiagnostics(ts.createProgram(names.map(n => path.join(root, n + '.tsx')), options, host))
}
const layerDeclaration = 'type LayerProps = { onClick?: (event: React.MouseEvent<HTMLElement>) => void; onTap?: (event: { defaultPrevented?: boolean }, info?: unknown) => void; onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void; [key: string]: unknown }\n'
const previousJonWay = sources.SourceJonWayAccordion.replace(layerDeclaration, '').replaceAll('Component: ComponentType<LayerProps>): ComponentType<LayerProps> {', 'Component: ComponentType): ComponentType {').replace('React.forwardRef<HTMLElement, LayerProps>', 'React.forwardRef<HTMLElement, Record<string, unknown>>').replace('React.forwardRef<HTMLElement, LayerProps>', 'React.forwardRef<HTMLElement, { onClick?: (event: React.MouseEvent<HTMLElement>) => void; onTap?: (event: { defaultPrevented?: boolean }, info?: unknown) => void; onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void; [key: string]: unknown }>')
assert.equal(hash(previousJonWay), '6d2b267aa8dea9684aea72a1195cbfe7c47605bf49a9bb0e5dd9e51ef121fe54')
const previousMezmo = sources.SourceMezmoTerminal.replace('type ContainerStyle = React.CSSProperties & { containerType?: "inline-size"; containerName?: string }\n', '').replace('containerName: "source-mezmo" } as ContainerStyle}>', 'containerName: "source-mezmo" }}>')
assert.equal(hash(previousMezmo), '5fde3fcbec56312d9a78f388d12abce2a01def9ea282bd6e52ca7be2dfe56155')
const mezmoNegativeDiagnostics = typeDiagnostics(undefined, previousMezmo)
assert.ok(mezmoNegativeDiagnostics.some(d => ts.flattenDiagnosticMessageText(d.messageText, ' ').includes('containerType')), 'Old Framer CSS counterfactual rejects unsupported container fields')
const mezmoPreviousJavaScript = ts.transpileModule(previousMezmo, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText
assert.equal(mezmoPreviousJavaScript, codes.SourceMezmoTerminal.outputText, 'Container annotation must leave runtime JavaScript identical')
const negativeDiagnostics = typeDiagnostics(previousJonWay), diagnostics = typeDiagnostics()
assert.ok(negativeDiagnostics.some(d => ts.flattenDiagnosticMessageText(d.messageText, ' ').includes('ref')), 'Bare ComponentType counterfactual must reject Framer ref props')
assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory: () => repo, getCanonicalFileName: x => x, getNewLine: () => '\n' }))
const previousJavaScript = ts.transpileModule(previousJonWay, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText
assert.equal(previousJavaScript, codes.SourceJonWayAccordion.outputText, 'Type-only correction must emit identical JavaScript')
const typeRegression = { previousSourceSHA256: hash(previousJonWay), previousDiagnosticCount: negativeDiagnostics.length, correctedDiagnosticCount: diagnostics.length, emittedJavaScriptIdentical: true, emittedJavaScriptSHA256: hash(previousJavaScript), mezmo: { previousSourceSHA256: hash(previousMezmo), previousDiagnosticCount: mezmoNegativeDiagnostics.length, correctedDiagnosticCount: diagnostics.length, emittedJavaScriptIdentical: true, emittedJavaScriptSHA256: hash(mezmoPreviousJavaScript) } }
checks.push('Both modules pass strict generic React props; original bare-HOC counterfactual fails and emitted JavaScript is identical')
for (const name of names) verify(name + ' contains no source-script import or network command executor', !/fetch\(|XMLHttpRequest|eval\(|new Function|WebGL|setInterval\(/.test(sources[name].replace(/\/\/[^\n]*/g, '')))
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'isolated-original-fixture-'))
const context = await chromium.launchPersistentContext(profile, { headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, viewport: { width: 1440, height: 900 }, hasTouch: true })
verify('Fresh isolated test profile starts without cookies', (await context.cookies()).length === 0)
const page = context.pages()[0]; page.on('pageerror', error => errors.push(String(error)))
const requested = [], missingAssets = [], actualRows = sourceRoot ? [...JSON.parse(fs.readFileSync(path.join(sourceRoot, 'HERO011/gallery-200-assets.json'))).rows, ...JSON.parse(fs.readFileSync(path.join(sourceRoot, 'HERO011/selected-photo-quality-assets.json'))).rows] : []
await page.route('https://www.jonway.studio/assets/**', async route => {
    requested.push(route.request().url())
    const match = actualRows.find(row => row.url === route.request().url())
    if (match) return route.fulfill({ body: fs.readFileSync(match.path), contentType: 'image/jpeg' })
    if (sourceRoot) { missingAssets.push(route.request().url()); return route.abort() }
    const width = Number(route.request().url().match(/-(\d+)\.jpg/)?.[1] ?? 768)
    // Owned deterministic sharp image for the reproducible no-network fixture.
    // Optional retained-source run uses genuine source bytes for matching URLs.
    return route.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.round(width * .75)}"><defs><pattern id="p" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M0 0H8V8H0Z M8 8H16V16H8Z" fill="#f30"/><path d="M8 0H16V8H8Z M0 8H8V16H0Z" fill="#0bd"/></pattern></defs><path fill="url(#p)" d="M0 0H${width}V${width}H0Z"/><text x="40" y="120" fill="#fff" font-size="72">SHARP PHOTO FIXTURE</text></svg>` })
})
try {
    await page.setContent('<!doctype html><style>*{box-sizing:border-box}html,body{margin:0;background:#000}button,input{font:inherit}</style><div id="mount"></div>')
    await page.addScriptTag({ content: React }); await page.addScriptTag({ content: ReactDOM })
    await page.evaluate(() => { window.__target = 'preview'; window.__reducedStatic = false; window.__exports = {}; window.exports = __exports; window.require = name => name === 'react' ? window.React : { addPropertyControls() {}, ControlType: {}, RenderTarget: { canvas: 'canvas', export: 'export', thumbnail: 'thumbnail', current: () => __target }, useIsStaticRenderer: () => __reducedStatic }; window.__raf = new Set(); const request = requestAnimationFrame.bind(window), cancel = cancelAnimationFrame.bind(window); window.requestAnimationFrame = callback => { const id = request(time => { __raf.delete(id); callback(time) }); __raf.add(id); return id }; window.cancelAnimationFrame = id => { __raf.delete(id); cancel(id) }; window.root = window.ReactDOM.createRoot(document.getElementById('mount')) })
    for (const name of names) { await page.evaluate(() => { window.exports = {} }); await page.addScriptTag({ content: "(function(){" + codes[name].outputText + "\n})();" }); await page.evaluate(name => { window[name] = exports.default; window[name + "Exports"] = { ...exports } }, name) }
    const atlasBytes = sourceRoot ? fs.readFileSync(path.join(sourceRoot, 'HERO011/collapsed-cover-entry-atlas-2000x900.webp')) : ('<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="900"><defs><linearGradient id="g"><stop stop-color="#e54"/><stop offset=".5" stop-color="#bcf"/><stop offset="1" stop-color="#2ac"/></linearGradient><pattern id="p" width="9" height="44" patternUnits="userSpaceOnUse"><path d="M0 0H9V22H0Z" fill="url(#g)"/><path d="M0 22H9V44H0Z" fill="#567"/></pattern></defs><path fill="url(#p)" d="M0 0H2000V900H0Z"/></svg>')
    const atlas = 'https://fixture.invalid/jws-atlas.webp'
    await page.route(atlas, route => route.fulfill({ body: atlasBytes, contentType: sourceRoot ? 'image/webp' : 'image/svg+xml' }))
    await page.clock.install()
    await page.evaluate(atlas => { window.jwsProps = { artwork: atlas, showPlayback: true }; window.drawJWS = () => window.ReactDOM.flushSync(() => root.render(window.React.createElement('div', { id: 'zoom', style: { width: 1440, height: 740, marginTop: 80, transformOrigin: 'top left' } }, window.React.createElement(SourceJonWayAccordion, { ...jwsProps, style: { width: '100%', height: '100%' } })))); drawJWS() }, atlas)
    await page.waitForFunction(() => document.querySelector('[data-jws-visible]')?.dataset.jwsVisible === 'true')
    verify('JW.S exactly200 distinct native strip slots; no effect canvases before selection', await page.evaluate(() => new Set([...document.querySelectorAll('[data-jws-source]')].map(n => n.dataset.jwsSource)).size === 200 && document.querySelectorAll('[data-jws-strip]').length === 200 && !document.querySelector('canvas')))
    await page.waitForFunction(() => document.querySelector('[data-jws-material-ready]')?.dataset.jwsMaterialReady === 'true')
    await page.clock.runFor(3000)
    verify('Source200-child entry has a travelling0.04s stagger and visible4→1 scale sweep', await page.evaluate(() => { const a = document.querySelector('[data-jws-strip="10"]'), b = document.querySelector('[data-jws-strip="190"]'); return a.style.opacity === '1' && b.style.opacity === '0' && b.style.transform.includes('4') }))
    await page.screenshot({ path: path.join(out, 'jws-entry-three-seconds.png') })
    await page.getByRole('button', { name: 'Pause accordion study' }).click(); const entryHold = await page.locator('[data-jws-entry]').getAttribute('data-jws-entry'); await page.clock.runFor(1000)
    verify('Entry pause preserves logical frame time rather than catching up wall time', await page.locator('[data-jws-entry]').getAttribute('data-jws-entry') === entryHold)
    await page.getByRole('button', { name: 'Resume accordion study' }).click(); await page.clock.runFor(5400)
    verify('Entry resumes to all200 revealed native slots at8.06s then stops its RAF', +(await page.locator('[data-jws-entry]').getAttribute('data-jws-entry')) >= 8.06 && await page.evaluate(() => __raf.size === 0))
    await page.mouse.move(20, 20); await page.waitForTimeout(150); await page.screenshot({ path: path.join(out, 'jws-desktop-collapsed.png') })
    const sharp = createRequire(require.resolve('astro/package.json'))('sharp'), pixels = await sharp(await page.screenshot()).raw().toBuffer({ resolveWithObject: true }); let saturated = 0, transitions = 0
    for (const x of [140, 324, 516, 716, 996, 1292]) for (let y = 120; y < 760; y += 2) { const index = (y * pixels.info.width + x) * pixels.info.channels, r = pixels.data[index], g = pixels.data[index + 1], b = pixels.data[index + 2]; if (Math.max(r, g, b) - Math.min(r, g, b) > 25) saturated++; if (y > 120) { const prior = index - pixels.info.width * pixels.info.channels * 2; if (Math.abs(r - pixels.data[prior]) + Math.abs(g - pixels.data[prior + 1]) + Math.abs(b - pixels.data[prior + 2]) > 18) transitions++ } }
    verify('Collapsed material has visible source-colored vertical detail, not merely a nonempty bitmap', saturated > 100 && transitions > 30)
    await page.mouse.move(720, 430); await page.waitForFunction(() => !!document.querySelector('[data-jws-expanded-image]')); const coarse = await page.evaluate(() => { const c = document.querySelector('[data-jws-pixelated]'); return c?.width ?? 0 }); await page.clock.runFor(700)
    verify('Hovered contain artwork de-pixelates through one bounded2D surface to sharp source media', coarse > 0 && coarse < 496 && await page.evaluate(() => +document.querySelector('[data-jws-pixel-progress]').dataset.jwsPixelProgress === 1 && [...document.querySelectorAll('canvas')].every(c => c.width * c.height <= 1000000)))
    let metrics = await page.evaluate(() => { const field = document.querySelector('[data-jws-selected]'), image = field.querySelector('img'), strip = image.parentElement; return { selected: +field.dataset.jwsSelected, width: strip.getBoundingClientRect().width, inset: image.getBoundingClientRect().left - strip.getBoundingClientRect().left, imageW: image.getBoundingClientRect().width, natural: image.naturalWidth } })
    verify('Real Desktop hover opens genuine selected media in576px card/40px inset', metrics.width === 576 && metrics.inset === 40 && metrics.imageW === 496 && metrics.natural >= metrics.imageW)
    await page.screenshot({ path: path.join(out, 'jws-desktop-selected.png') })
    await page.getByRole('button', { name: 'Pause accordion study' }).click(); const before = await page.locator('[data-jws-selected]').getAttribute('data-jws-selected'); await page.mouse.move(100, 300); verify('Pause preserves selected photo under real pointer movement', await page.locator('[data-jws-selected]').getAttribute('data-jws-selected') === before)
    await page.evaluate(() => { document.getElementById('zoom').style.transform = 'scale(2)' })
    await page.waitForFunction(() => { const image = document.querySelector('[data-jws-expanded-image]'); return image && image.naturalWidth >= Math.min(1280, image.getBoundingClientRect().width) })
    verify('Paused visible photo upgrades resolution after ancestor zoom without hover or Play', requested.some(url => /-(1024|1280)\.jpg$/.test(url)))
    await page.evaluate(() => { document.getElementById('zoom').style.transform = ''; jwsProps = { ...jwsProps, paused: false }; drawJWS() }); await page.getByRole('button', { name: 'Resume accordion study' }).click()
    await page.mouse.move(20, 20); await page.waitForFunction(() => document.querySelector('[data-jws-selected]').dataset.jwsSelected === '-1')
    verify('Pointer leave reverses the accordion to2008px strips', await page.evaluate(() => [...document.querySelectorAll('[data-jws-strip]')].every(n => n.style.width === '8px')))
    await page.locator('[data-jws-selected]').focus(); for (let i = 0; i < 9; i++) await page.keyboard.press('ArrowRight')
    verify('Decoded selected-photo cache stays bounded at six after keyboard changes', +(await page.locator('[data-jws-selected]').getAttribute('data-jws-cache')) <= 6)
    await page.setViewportSize({ width: 390, height: 844 }); await page.evaluate(() => { document.getElementById('zoom').style.width = '390px'; document.getElementById('zoom').style.height = '684px' }); await page.waitForTimeout(60)
    await page.touchscreen.tap(260, 410); await page.clock.runFor(700)
    metrics = await page.evaluate(() => { const field = document.querySelector('[data-jws-selected]'), active = field.querySelector('[data-jws-expanded-image]'); return { width: active?.parentElement.getBoundingClientRect().width, inset: active ? active.getBoundingClientRect().left - active.parentElement.getBoundingClientRect().left : null, overflow: document.documentElement.scrollWidth > innerWidth } })
    verify('Phone real tap retains60vw card/20px inset and no horizontal page overflow', Math.abs(metrics.width - 234) < .01 && metrics.inset === 20 && !metrics.overflow)
    await page.screenshot({ path: path.join(out, 'jws-phone-selected.png') })
    await page.evaluate(() => { __target = 'canvas'; jwsProps = { ...jwsProps, stillIndex: 87 }; drawJWS() }); const staticIndex = await page.locator('[data-jws-selected]').getAttribute('data-jws-selected'); await page.touchscreen.tap(20, 400)
    verify('Default Canvas freezes declared poster and ignores input with no RAF', await page.locator('[data-jws-selected]').getAttribute('data-jws-selected') === staticIndex && await page.evaluate(() => __raf.size === 0))
    await page.evaluate(() => {
        __target = 'preview'; window.markProps = {}; window.markCalls = 0; window.markTapCalls = 0; window.nativeDropClick = false
        const Native = window.React.forwardRef((props, ref) => { const { onTap, onClick, ...rest } = props; return window.React.createElement('div', { ...rest, ref, onClick: window.nativeDropClick ? undefined : onClick, onPointerUp: event => onTap?.(event, { fixture: true }) }) }), module = SourceJonWayAccordionExports
        window.Experience = module.withJonWayExperience(Native); window.Pause = module.withJonWayPause(Native)
        window.drawMark = () => window.ReactDOM.flushSync(() => root.render(window.React.createElement(Experience, { style: { width: 390, height: 200 } }, window.React.createElement(module.SourceJonWayProjectMark, { ...markProps, style: { width: 60, height: 75 } }), window.React.createElement(Pause, { onClick: () => markCalls++, onTap: event => { markTapCalls++; if (window.cancelNativeTap) event.preventDefault() }, style: { color: '#fff', padding: 20 } }, 'Native pause')))); drawMark()
    })
    await page.waitForFunction(() => document.querySelector('[data-jws-mark-visible]')?.dataset.jwsMarkVisible === 'true')
    const markBefore = await page.locator('[data-jws-mark-frame]').screenshot(); await page.clock.runFor(1100)
    const markFrame = +(await page.locator('[data-jws-mark-frame]').getAttribute('data-jws-mark-frame')), markAfter = await page.locator('[data-jws-mark-frame]').screenshot()
    verify('Genuine200-frame source mark changes actual pixels at its50ms material timeline', markFrame >= 18 && markFrame <= 25 && !markBefore.equals(markAfter))
    await page.getByRole('button', { name: 'Pause Jon Way study' }).click(); const stoppedMark = await page.locator('[data-jws-mark-frame]').getAttribute('data-jws-mark-frame'); await page.clock.runFor(1000)
    verify('Native shared playback HOC preserves caller and freezes genuine mark', await page.evaluate(() => markCalls === 1) && await page.locator('[data-jws-mark-frame]').getAttribute('data-jws-mark-frame') === stoppedMark && await page.evaluate(() => __raf.size === 0))
    await page.clock.runFor(400); await page.evaluate(() => { nativeDropClick = true; drawMark() }); await page.getByRole('button', { name: 'Resume Jon Way study' }).click(); await page.clock.runFor(100)
    verify('Framer-style native adapter dropping onClick still activates onTap once', await page.getByRole('button', { name: 'Pause Jon Way study' }).count() === 1 && await page.evaluate(() => markCalls === 1 && markTapCalls === 2))
    await page.getByRole('button', { name: 'Pause Jon Way study' }).click()
    verify('Repeated same-channel onTap is not swallowed by cross-channel dedupe', await page.getByRole('button', { name: 'Resume Jon Way study' }).count() === 1)
    await page.clock.runFor(400); await page.evaluate(() => { cancelNativeTap = true; nativeDropClick = false; drawMark() }); await page.getByRole('button', { name: 'Resume Jon Way study' }).click()
    verify('Caller cancellation blocks native tap and its paired click', await page.getByRole('button', { name: 'Resume Jon Way study' }).count() === 1)
    await page.evaluate(() => { __target = 'export'; markProps = { stillFrame: 67 }; drawMark() })
    verify('Static export selects exact declared source mark frame without RAF', await page.locator('[data-jws-mark-frame]').getAttribute('data-jws-mark-frame') === '67' && await page.evaluate(() => __raf.size === 0))
    await page.screenshot({ path: path.join(out, 'jws-source-mark-static.png') })
    await page.evaluate(() => { __target = 'preview'; window.terminalProps = { showPlayback: true }; window.drawTerminal = () => window.ReactDOM.flushSync(() => root.render(window.React.createElement(SourceMezmoTerminal, { ...terminalProps, style: { width: '100%', height: 522 } }))); drawTerminal() })
    await page.waitForFunction(() => document.querySelector('[data-mezmo-visible]')?.dataset.mezmoVisible === 'true')
    await page.clock.runFor(1700); const initialStage = await page.locator('[data-mezmo-stage]').getAttribute('data-mezmo-stage')
    verify('Phone responsive source hides the ASCII wordmark without losing semantic terminal input', !(await page.locator('[data-mezmo-aura-logo]').isVisible()))
    verify('Mezmo pretypes prompt but waits for real Enter before investigation', initialStage === '0' && (await page.getByRole('textbox', { name: 'Terminal command' }).inputValue()).length > 20)
    const input = page.getByRole('textbox', { name: 'Terminal command' }); await page.getByRole('log').click({ position: { x: 40, y: 100 } }); await page.keyboard.press('Enter'); await page.clock.runFor(2500)
    verify('Real Enter begins visible colored streamed investigation rows', await page.locator('[data-mezmo-stage]').getAttribute('data-mezmo-stage') === '1' && await page.locator('[data-mezmo-row]').count() >= 2)
    await page.getByRole('button', { name: 'PAUSE', exact: true }).click(); const heldTime = await page.locator('[data-mezmo-time]').getAttribute('data-mezmo-time'); await page.clock.runFor(1500)
    verify('Pause freezes terminal clock and streamed content', await page.locator('[data-mezmo-time]').getAttribute('data-mezmo-time') === heldTime)
    await page.getByRole('button', { name: 'RESUME', exact: true }).click(); await page.clock.runFor(15000); await input.press('Enter'); await page.clock.runFor(8500); await input.press('Enter'); await page.clock.runFor(9000)
    verify('Three real Enters reach finite complete state while retaining previous output', await page.locator('[data-mezmo-stage]').getAttribute('data-mezmo-stage') === '3' && await page.locator('[data-mezmo-phase]').count() === 3 && (await page.getByRole('log').innerText()).includes('This simulation is complete'))
    await page.screenshot({ path: path.join(out, 'mezmo-phone-complete.png') })
    await page.getByRole('button', { name: /config.toml/ }).click(); verify('Config button opens actual accessible read-only modal', await page.getByRole('dialog').isVisible()); await page.keyboard.press('Escape'); verify('Escape closes config and restores terminal focus', await page.getByRole('dialog').count() === 0 && await input.evaluate(n => document.activeElement === n))
    await input.fill('/stream'); await input.press('Enter'); verify('Real terminal command toggles recorded-event sidebar', await page.getByRole('complementary', { name: 'Simulated event stream' }).isVisible())
    await input.fill('/reset'); await input.press('Enter'); await page.clock.runFor(500); await input.press('Enter'); await page.clock.runFor(500)
    await page.evaluate(() => { document.getElementById('mount').style.transform = 'translateY(2000px)' }); await page.waitForTimeout(100); const off = await page.locator('[data-mezmo-time]').getAttribute('data-mezmo-time'); await page.clock.runFor(1500)
    verify('Offscreen terminal releases pending animation and holds current time', await page.locator('[data-mezmo-visible]').getAttribute('data-mezmo-visible') === 'false' && await page.locator('[data-mezmo-time]').getAttribute('data-mezmo-time') === off && await page.evaluate(() => __raf.size === 0))
    await page.evaluate(() => { document.getElementById('mount').style.transform = '' }); await page.waitForTimeout(100); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(50)
    verify('Reduced motion shows complete current stage without animation RAF', await page.evaluate(() => __raf.size === 0) && +(await page.locator('[data-mezmo-time]').getAttribute('data-mezmo-time')) === 13.5)
    for (const target of ['canvas', 'export', 'thumbnail']) { await page.evaluate(target => { __target = target; terminalProps = { stillStage: 2 }; drawTerminal() }, target); verify(target + ' produces stable terminal poster without live input or timers', await input.getAttribute('readonly') !== null && await page.evaluate(() => __raf.size === 0)) }
    await page.evaluate(() => window.ReactDOM.flushSync(() => root.unmount())); verify('Unmount leaves no scheduled animation work', await page.evaluate(() => __raf.size === 0))
    verify('No substituted or missing genuine assets in the retained-source run', missingAssets.length === 0)
    verify('No actual browser runtime errors', errors.length === 0)
    const result = { passed: true, checks, sources: Object.fromEntries(names.map(name => [name, { sha256: hash(sources[name]), bytes: Buffer.byteLength(sources[name]) }])), testSHA256: hash(fs.readFileSync(import.meta.filename)), typeRegression, errors, requestedImages: requested, retainedSourceAssetsUsed: !!sourceRoot, scope: 'Independent current-original recreation fixtures in fresh local Chromium. Real input/DOM/pixels, responsive image demand, pause/reduced/static/offscreen/cleanup. Original input evidence and actual Framer saved/Preview fidelity are separate gates.' }
    fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify({ passed: true, checks: checks.length, evidence: out }))
} catch (error) { fs.writeFileSync(path.join(out, 'failure.json'), JSON.stringify({ message: String(error), checks, errors, missingAssets, debug: await page.evaluate(() => ({html:document.querySelector('[data-jws-strip]')?.outerHTML.slice(0,1000),background:getComputedStyle(document.querySelector('[data-jws-strip]')?.firstChild??document.body).backgroundImage,react:typeof window.React, terminal:document.querySelector("[data-mezmo-stage]")?.outerHTML.slice(0,500), active:document.activeElement?.outerHTML.slice(0,250)})) }, null, 2) + '\n'); throw error } finally { await context.close() }
