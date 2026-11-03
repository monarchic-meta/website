import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url), ts = require('typescript')
const repo = path.resolve(import.meta.dirname, '..'), sourcePath = path.join(repo, 'docs/design-studies/code-components/SourceMezmoHeaderNavigation.tsx')
const source = fs.readFileSync(sourcePath, 'utf8'), hash = data => crypto.createHash('sha256').update(data).digest('hex')
const out = process.env.MONARCHIC_MEZMO_HEADER_EVIDENCE_DIR ?? '/tmp/monarchic-mezmo-header-navigation'
fs.mkdirSync(out, { recursive: true })
const checks = [], errors = [], verify = (name, passed) => { assert.ok(passed, name); checks.push(name) }
const stub = `export interface CSSProperties{[key:string]:string|number|undefined};export type ForwardedRef<T>=((v:T|null)=>void)|{current:T|null}|null;export type ComponentType<P={}>=((p:P)=>unknown);export interface Context<T>{Provider:ComponentType<{value:T;children?:unknown}>;__type?:T};export function createContext<T>(v:T):Context<T>;export function useContext<T>(c:Context<T>):T;export function forwardRef<T,P>(f:(p:P,r:ForwardedRef<T>)=>unknown):ComponentType<P>;export function useRef<T>(v:T):{current:T};export function useState<T>(v:T|(()=>T)):[T,(v:T|((p:T)=>T))=>void];export function useCallback<T extends Function>(f:T,d:unknown[]):T;export function useEffect(f:()=>void|(()=>void),d:unknown[]):void;export function useLayoutEffect(f:()=>void|(()=>void),d:unknown[]):void;export function createElement(...a:unknown[]):unknown;declare global{namespace JSX{interface IntrinsicAttributes{key?:string|number};interface IntrinsicElements{[key:string]:{style?:CSSProperties;[key:string]:unknown}}}}`
const defs = new Map([[repo + '/__mezmo-nav-react.d.ts', stub], [repo + '/__mezmo-nav-framer.d.ts', 'export const RenderTarget:{canvas:string;export:string;thumbnail:string;current():string};export function useIsStaticRenderer():boolean;']])
const options = { strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React, moduleResolution: ts.ModuleResolutionKind.Node10, baseUrl: repo, paths: { react: ['__mezmo-nav-react.d.ts'], framer: ['__mezmo-nav-framer.d.ts'] } }
const compiler = ts.createCompilerHost(options), read = compiler.readFile.bind(compiler), exists = compiler.fileExists.bind(compiler)
compiler.readFile = p => defs.get(p) ?? read(p); compiler.fileExists = p => defs.has(p) || exists(p)
compiler.getSourceFile = (p, v) => { const s = compiler.readFile(p); return s === undefined ? undefined : ts.createSourceFile(p, s, v, true) }
const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([sourcePath], options, compiler))
assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics.slice(0, 10), { getCurrentDirectory: () => repo, getCanonicalFileName: p => p, getNewLine: () => '\n' }))
checks.push('Strict semantic TypeScript against actual DOM and explicit React/Framer public contracts')
const exportedNames = [...source.matchAll(/^export function (\w+)\(Component: ComponentType<LayerProps>\): ComponentType<LayerProps>/gm)].map(m => m[1])
verify('Every public native override uses the actual ComponentType signature', exportedNames.length === [...source.matchAll(/^export function /gm)].length && exportedNames.length > 20)
verify('No code component, controls, media, source-script import or data/network executor is introduced', !/addPropertyControls|\bfetch\s*\(|XMLHttpRequest|WebSocket|new Function|\beval\s*\(|<canvas|<video|setInterval\(|requestAnimationFrame\(/.test(source))
verify('No body lock or overscroll containment is authored', !/document\.body\.style|overflow\s*:\s*["']hidden["']|overscrollBehavior\s*:|addEventListener\(\s*["'](?:touchmove|wheel)["']/.test(source))
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText
const React = require('react'), ReactServer = require('react-dom/server'), exports = {}, mode = { target: 'preview', static: false }
new Function('require', 'exports', compiled)(name => name === 'react' ? React : { RenderTarget: { canvas: 'canvas', export: 'export', thumbnail: 'thumbnail', current: () => mode.target }, useIsStaticRenderer: () => mode.static }, exports)
const ServerNative = React.forwardRef((props, ref) => React.createElement('div', { ...props, ref }))
for (const [target, isStatic] of [['canvas', false], ['export', false], ['thumbnail', false], ['preview', true]]) {
    mode.target = target; mode.static = isStatic
    const Root = exports.withMezmoHeaderNavigation(ServerNative), Menu = exports.withMezmoMenuCollection(ServerNative)
    const html = ReactServer.renderToString(React.createElement(Root, { 'data-caller': 'kept', style: { height: 60 } }, React.createElement(Menu, null, 'Native editable contents')))
    verify(target + '/' + isStatic + ' SSR preserves caller/native children and freezes collection', html.includes('data-caller="kept"') && html.includes('native-still') && html.includes('display:none') && html.includes('Native editable contents'))
}
if (process.argv.includes('--static-only')) { fs.writeFileSync(path.join(out, 'static-result.json'), JSON.stringify({ passed: true, checks, sourceSHA256: hash(source) }, null, 2)); console.log(JSON.stringify({ passed: true, staticChecks: checks.length })); process.exit(0) }
const { chromium } = require('@playwright/test')
const react = fs.readFileSync(path.join(path.dirname(require.resolve('react/package.json')), 'umd/react.development.js'), 'utf8')
const reactDOM = fs.readFileSync(path.join(path.dirname(require.resolve('react-dom/package.json')), 'umd/react-dom.development.js'), 'utf8')
const context = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'mezmo-header-fixture-')), { headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, viewport: { width: 1440, height: 900 }, hasTouch: true })
const page = context.pages()[0], external = []
page.on('pageerror', error => errors.push(String(error))); page.setDefaultTimeout(5000)
await context.route('**/*', route => { external.push(route.request().url()); return route.abort() })
try {
    await page.setContent('<!doctype html><style>*{box-sizing:border-box}html,body{margin:0}p{margin:0}#owner{height:2300px;background:#eee}#header{position:fixed;left:0;top:34px;width:100%;height:60px;z-index:20;background:white}@media(max-width:991px){#header{top:0!important;height:78px!important}.old-trigger{display:none!important}#toggle,#artwork{display:block!important}}</style><div id="owner"><div id="mount"></div></div>')
    await page.addScriptTag({ content: react }); await page.addScriptTag({ content: reactDOM })
    await page.evaluate(() => {
        window.__target = 'preview'; window.__static = false; window.__hidden = false; window.__observers = new Set(); window.__calls = { click: 0, tap: 0, key: 0 }; window.__cancel = ''
        window.__ownedListeners = []
        const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener
        EventTarget.prototype.addEventListener = function(type, callback, options) { if (/SourceMezmoHeaderNavigation\.js/.test(new Error().stack ?? '')) __ownedListeners.push({ target: this, type, callback }); return add.call(this, type, callback, options) }
        EventTarget.prototype.removeEventListener = function(type, callback, options) { const index = __ownedListeners.findIndex(item => item.target === this && item.type === type && item.callback === callback); if (index >= 0) __ownedListeners.splice(index, 1); return remove.call(this, type, callback, options) }
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => __hidden })
        window.setHidden = value => { __hidden = value; document.dispatchEvent(new Event('visibilitychange')) }
        for (const name of ['IntersectionObserver', 'ResizeObserver', 'MutationObserver']) {
            const Original = window[name]
            window[name] = class extends Original { constructor(callback, options) { super(callback, options); __observers.add(this); this.targets = new Set() }; observe(node, options) { this.targets.add(node); return super.observe(node, options) }; unobserve(node) { this.targets.delete(node); return super.unobserve?.(node) }; disconnect() { this.targets.clear(); __observers.delete(this); return super.disconnect() } }
        }
        window.__module = {}; window.__objectRef = { current: null }; window.__refs = []
    })
    await page.addScriptTag({ content: '(function(){const exports=__module;const require=n=>n==="react"?window.React:{RenderTarget:{canvas:"canvas",export:"export",thumbnail:"thumbnail",current:()=>__target},useIsStaticRenderer:()=>__static};' + compiled + '\n})();\n//# sourceURL=SourceMezmoHeaderNavigation.js' })
    await page.evaluate(() => {
        const E = React.createElement, m = __module
        window.__nativeProps = {}
        const Native = React.forwardRef((props, ref) => {
            const { onTap, kind, href, children, ...rest } = props
            if (props.id) __nativeProps[props.id] = props
            return E(href ? 'a' : 'div', { ...rest, href, ref, onPointerUp: event => onTap?.(event, { source: 'native-like fixture' }) }, kind === 'text' ? E('p', { style: { fontSize: 14, lineHeight: '21px' } }, E('span', { style: { fontSize: 14, lineHeight: '21px' } }, children)) : children)
        })
        window.C = Object.fromEntries(Object.entries(m).map(([name, fn]) => [name, fn(Native)]))
        const labels = ['Platform', 'Solutions', 'Resources', 'About'], labelsData = [['Agentic SRE', 'Governance', 'Integrations'], ['SRE agent for root cause', 'AI-ready context engineering', 'OTel Migrations', 'Site reliability engineers', 'Platform engineers', 'Developers'], ['Mezmo Docs', 'AURA Docs', 'Support', 'Blog', 'Recipes', 'Learn', 'Demos', 'Events', 'Resource Library'], ['Pricing', 'Company', 'Events', 'News', 'Customers', 'Culture', 'Partners']]
        const callbacks = { onClick(event) { __calls.click++; if (__cancel === 'click') event.preventDefault() }, onTap(event) { __calls.tap++; if (__cancel === 'tap') event.preventDefault() }, onKeyDown(event) { __calls.key++; if (__cancel === 'key') event.preventDefault() } }
        const link = (label, index, i) => E(label === 'Customers' ? C.withMezmoCustomersVisibility : C.withMezmoMenuLink, { id: 'link-' + index + '-' + i, key: label, kind: 'text', href: '#source-' + index + '-' + i }, label)
        const group = (name, index) => E(C['withMezmo' + name + 'Group'], { key: name }, E(C['withMezmoPhone' + name], { id: 'phone-trigger-' + index, kind: 'text', ...callbacks }, name), E(C['withMezmo' + name + 'Panel'], { id: 'panel-' + index }, ...(index === 1 ? [0, 1].map(column => E('div', { key: column, style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' } }, E(C.withMezmoMenuHeading, { kind: 'text' }, column ? 'By role' : 'By use case'), labelsData[index].slice(column * 3, column * 3 + 3).map((label, i) => link(label, index, column * 3 + i)))) : [E('div', { key: 'column', style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' } }, labelsData[index].map((label, i) => link(label, index, i)))])))
        window.root = ReactDOM.createRoot(document.getElementById('mount'))
        window.hostTag = 'div'; window.objectRef = false
        window.render = () => ReactDOM.flushSync(() => root.render(E(C.withMezmoHeaderNavigation, { id: 'header', ref: objectRef ? __objectRef : node => { __refs.push(node); window.__callerRef = node }, title: 'Preserved caller title', style: { position: 'fixed', top: 34, height: 60, color: '#123456' } },
            labels.map((name, index) => E(C['withMezmo' + name + 'Trigger'], { key: name, id: 'trigger-' + index, className: 'old-trigger', kind: 'text', ...callbacks, style: { position: 'absolute', left: [442, 612, 791, 976][index], top: 20, width: 110, height: 22, color: '#123456' } }, name)),
            E(C.withMezmoPhoneMenuArtwork, { id: 'artwork', style: { display: 'none', position: 'absolute', left: 352, top: 32, width: 18, height: 14 } }, '☰'),
            E(C.withMezmoPhoneMenuToggle, { id: 'toggle', ...callbacks, style: { display: 'none', position: 'absolute', right: 4, top: 5, width: 50, height: 68 } }),
            E(C.withMezmoMenuCollection, { id: 'collection' }, E(C.withMezmoMenuBody, { id: 'menu-body' }, E(C.withMezmoPhoneAura, { id: 'aura' }, 'AURA'), labels.map(group), E(C.withMezmoPhoneSignin, { id: 'signin', href: '#signin', kind: 'text' }, 'Sign in'), E(C.withMezmoPhoneCTA, { id: 'start', href: '#start', style: { background: '#95c1cf' } }, 'Get started'))))))
        document.addEventListener('click', event => { if (event.target.closest('a')) event.preventDefault() })
        render()
    })
    const panel = i => page.locator('#panel-' + i), opened = async i => page.waitForFunction(i => document.getElementById('panel-' + i).getBoundingClientRect().height > 0, i)
    await page.waitForFunction(() => document.getElementById('header')?.dataset.mezmoHeaderNavigation === 'managed')
    await page.waitForTimeout(60)
    verify('Header caller style/title/ref are preserved on Desktop', await page.evaluate(() => __callerRef === document.getElementById('header') && __callerRef.style.color === 'rgb(18, 52, 86)' && __callerRef.style.height === '60px' && __callerRef.title === 'Preserved caller title'))
    await page.locator('#trigger-0').hover(); await opened(0)
    await page.locator('#link-0-0').hover(); verify('Actual Desktop hover retains the same open menu while crossing into its native links', await panel(0).isVisible())
    await page.locator('#trigger-0').hover(); verify('Re-entering an already selected native trigger does not toggle it closed', await panel(0).isVisible())
    await page.mouse.move(4, 500); await page.waitForTimeout(30); verify('Pointer leaving both native trigger and group closes the Desktop menu', !await panel(0).isVisible())
    await page.locator('#trigger-1').focus(); verify('Focus alone does not open a Desktop category', !await panel(1).isVisible())
    await page.keyboard.press('Enter'); await opened(1); await page.keyboard.press('ArrowDown')
    verify('Genuine Enter opens and ArrowDown focuses the first native source link', await page.locator('#link-1-0').evaluate(n => document.activeElement === n))
    await page.keyboard.press('Escape'); verify('Escape closes the group and returns its native trigger', !await panel(1).isVisible() && await page.locator('#trigger-1').evaluate(n => document.activeElement === n))
    await page.evaluate(() => { const owner = document.getElementById('owner'); owner.style.transformOrigin = '0 0'; owner.style.transform = 'translate(20px,30px) scale(.8)' }); await page.waitForTimeout(40)
    await page.locator('#trigger-0').hover(); await opened(0)
    verify('A translated/scaled native owner keeps dropdown geometry in logical header coordinates', await page.evaluate(() => { const trigger = document.getElementById('trigger-0').getBoundingClientRect(), panel = document.getElementById('panel-0').getBoundingClientRect(); return Math.abs(panel.left - trigger.left) < .1 && Math.abs(panel.top - trigger.top - 49 * .8) < .2 }))
    await page.evaluate(() => { document.getElementById('owner').style.transform = '' }); await page.keyboard.press('Escape'); await page.waitForTimeout(40)
    await page.locator('#trigger-3').hover(); await opened(3)
    verify('Customers is hidden at source1440 Desktop width', !await page.locator('#link-3-4').isVisible())
    await page.setViewportSize({ width: 992, height: 900 }); await page.waitForTimeout(60)
    await page.locator('#trigger-3').hover(); await opened(3)
    verify('Customers is visible at source992 Compact width and inner native inline14 text is overridden to12/18', await page.locator('#link-3-4').isVisible() && await page.locator('#link-3-0 span').evaluate(n => getComputedStyle(n).fontSize === '12px' && getComputedStyle(n).lineHeight === '18px'))
    await page.keyboard.press('Escape'); await page.waitForTimeout(370)
    await page.evaluate(() => { __cancel = 'tap'; const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true } }; __nativeProps['trigger-0'].onTap(event); document.getElementById('trigger-0').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); __cancel = '' })
    verify('Caller-canceled tap suppresses its following native DOM click', !await panel(0).isVisible())
    await page.waitForTimeout(370)
    await page.evaluate(() => { const event = { key: 'Enter', defaultPrevented: false, preventDefault() { this.defaultPrevented = true } }; __nativeProps['trigger-0'].onKeyDown(event); document.getElementById('trigger-0').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })) })
    await opened(0); verify('Native keyboard activation plus following DOM click activate one time', await panel(0).isVisible())
    await page.setViewportSize({ width: 390, height: 520 }); await page.waitForTimeout(80)
    verify('Responsive breakpoint closes Desktop state before the Phone menu', !await panel(0).isVisible() && !await page.locator('#collection').isVisible())
    verify('Phone uses a separate50×68 native hit Frame and preserves the18×14 source artwork', await page.evaluate(() => { const hit = document.getElementById('toggle').getBoundingClientRect(), art = document.getElementById('artwork').getBoundingClientRect(); return hit.width === 50 && hit.height === 68 && hit.x === 336 && art.width === 18 && art.height === 14 && art.x === 352 }))
    await page.touchscreen.tap(341, 10); await page.waitForTimeout(350)
    verify('Phone opens one finite native vertical menu below the78px header', await page.locator('#collection').isVisible() && await page.locator('#collection').evaluate(n => Math.abs(n.getBoundingClientRect().top - 78) < .1 && n.getAnimations().length === 0))
    await page.locator('#phone-trigger-2').click(); await opened(2)
    verify('Phone Resources uses a70vh scroller with natural body overscroll policy', await page.locator('#menu-body').evaluate(n => getComputedStyle(n).maxHeight === '364px' && getComputedStyle(n).overflowY === 'auto' && getComputedStyle(n).overscrollBehaviorY === 'auto') && await page.evaluate(() => document.body.style.overflow === ''))
    await page.locator('#phone-trigger-1').click(); await opened(1)
    verify('Phone choosing a category closes the preceding group', !await panel(2).isVisible() && await panel(1).isVisible())
    await page.keyboard.press('Escape'); verify('First Phone Escape closes only the category and restores its trigger', !await panel(1).isVisible() && await page.locator('#collection').isVisible() && await page.locator('#phone-trigger-1').evaluate(n => document.activeElement === n))
    await page.keyboard.press('Escape'); await page.waitForTimeout(350)
    verify('Second Phone Escape closes the main menu and focuses the existing hamburger', !await page.locator('#collection').isVisible() && await page.locator('#toggle').evaluate(n => document.activeElement === n))
    await page.locator('#toggle').click(); await page.waitForTimeout(350); await page.mouse.click(3, 500); await page.waitForTimeout(350)
    verify('A real neutral outside click closes Phone main menu without body lock', !await page.locator('#collection').isVisible() && await page.evaluate(() => document.body.style.overflow === ''))
    await page.locator('#toggle').click(); await page.waitForTimeout(30); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(60)
    verify('Reduced motion cannot leave a half-open or exiting owned animation', await page.locator('#collection').evaluate(n => n.getAnimations().length === 0))
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(50)
    await page.locator('#toggle').click(); await page.waitForTimeout(350); await page.evaluate(() => setHidden(true)); await page.waitForTimeout(40)
    verify('Document hidden closes the admitted menu and releases all native animation effects', !await page.locator('#collection').isVisible() && await page.locator('#collection').evaluate(n => n.getAnimations().length === 0))
    await page.evaluate(() => setHidden(false)); await page.waitForTimeout(50)
    for (const target of ['canvas', 'export', 'thumbnail']) {
        await page.evaluate(target => { __target = target; render() }, target); await page.waitForTimeout(30)
        verify(target + ' freezes native menu and removes live observers', !await page.locator('#collection').isVisible() && await page.evaluate(() => __observers.size === 0))
    }
    await page.evaluate(() => { __target = 'preview'; objectRef = true; render() }); await page.waitForTimeout(50)
    verify('A genuine caller object ref receives the live native header', await page.evaluate(() => __objectRef.current === document.getElementById('header')))
    await page.evaluate(() => ReactDOM.flushSync(() => root.unmount())); await page.waitForTimeout(30)
    verify('Unmount cleans observers, source listeners, native refs and owned animation work', await page.evaluate(() => __observers.size === 0 && __ownedListeners.length === 0 && __objectRef.current === null && !document.querySelector('[data-mezmo-nav-collection]')))
    verify('Only owned DOM assets were used with no browser runtime errors', errors.length === 0 && external.length === 0)
    const result = { passed: true, source: { path: sourcePath, bytes: Buffer.byteLength(source), sha256: hash(source) }, testSHA256: hash(fs.readFileSync(import.meta.filename)), checks, errors, external, scope: 'Strict TypeScript/SSR and fresh anonymous React/native-like DOM, including explicit inline RTE14px styles. This is not actual Framer paint/ref/context/saved-state proof or source-pixel equivalence.' }
    fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify({ passed: true, checks: checks.length, evidence: out }))
} catch (error) { fs.writeFileSync(path.join(out, 'failure.json'), JSON.stringify({ error: String(error), checks, errors, html: await page.content() }, null, 2) + '\n'); throw error }
finally { await context.close() }
