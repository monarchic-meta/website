import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(process.env.MONARCHIC_REPO_ROOT ?? fileURLToPath(new URL('../', import.meta.url))), require = createRequire(path.join(repo, 'package.json')), ts = require('typescript')
const folder = path.join(repo, 'docs/design-studies/code-components'), file = process.env.MONARCHIC_MECHA_CONTACT_BUNDLE_PATH ?? path.join(folder, 'SourceMechaTomorrowContact.tsx'), oldFile = path.join(folder, 'SourceMechaTomorrowDetail.tsx')
const source = fs.readFileSync(file, 'utf8'), old = fs.readFileSync(oldFile, 'utf8'), geometryFile = path.join(repo, 'scripts/fixtures/source-mecha-contact-geometry.json'), geometry = JSON.parse(fs.readFileSync(geometryFile))
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex'), out = process.env.MONARCHIC_MECHA_CONTACT_EVIDENCE_DIR ?? '/tmp/monarchic-mecha-tomorrow-contact', checks = [], samples = [], errors = [], innerLeafRecords = []
fs.mkdirSync(out, { recursive: true })
for (const p of [file, oldFile, geometryFile, import.meta.filename]) fs.copyFileSync(p, path.join(out, path.basename(p)))
const check = (name, value) => { assert.ok(value, name); checks.push(name) }
const stub = `export type ReactNode=unknown;export interface CSSProperties{[key:string]:string|number|undefined};export type ForwardedRef<T>=((v:T|null)=>void)|{current:T|null}|null;export type ComponentType<P={}>=((p:P)=>unknown);export type MouseEvent<T>={currentTarget:T;defaultPrevented:boolean;preventDefault():void;stopPropagation():void};export type KeyboardEvent<T>=MouseEvent<T>&{key:string;repeat:boolean};export type MouseEventHandler<T>=(e:MouseEvent<T>)=>void;export type KeyboardEventHandler<T>=(e:KeyboardEvent<T>)=>void;export interface Context<T>{Provider:ComponentType<{value:T;children?:unknown}>;__type?:T};export function createContext<T>(v:T):Context<T>;export function useContext<T>(c:Context<T>):T;export function forwardRef<T,P>(f:(p:P,r:ForwardedRef<T>)=>unknown):ComponentType<P>;export function useRef<T>(v:T):{current:T};export function useState<T>(v:T|(()=>T)):[T,(v:T|((p:T)=>T))=>void];export function useCallback<T extends Function>(f:T,d:unknown[]):T;export function useEffect(f:()=>void|(()=>void),d:unknown[]):void;export function useLayoutEffect(f:()=>void|(()=>void),d:unknown[]):void;export function useId():string;export function createElement(...a:unknown[]):unknown;declare global{namespace JSX{interface IntrinsicAttributes{key?:string|number};interface IntrinsicElements{[key:string]:{style?:CSSProperties;[key:string]:unknown}}}}`
const defs = new Map([[repo + '/__mecha-contact-react.d.ts', stub], [repo + '/__mecha-contact-framer.d.ts', 'export const RenderTarget:{canvas:string;export:string;thumbnail:string;current():string};export function useIsStaticRenderer():boolean;']])
const options = { strict: true, noEmit: true, skipLibCheck: true, allowImportingTsExtensions: true, target: ts.ScriptTarget.ES2020, lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'], module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React, moduleResolution: ts.ModuleResolutionKind.Node10, baseUrl: repo, paths: { react: ['__mecha-contact-react.d.ts'], framer: ['__mecha-contact-framer.d.ts'] } }
const host = ts.createCompilerHost(options), read = host.readFile.bind(host), exists = host.fileExists.bind(host)
host.readFile = p => defs.get(p) ?? read(p); host.fileExists = p => defs.has(p) || exists(p)
host.getSourceFile = (p, v) => { const text = host.readFile(p); return text === undefined ? undefined : ts.createSourceFile(p, text, v, true) }
const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([file], options, host))
assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics.slice(0, 10), { getCurrentDirectory: () => repo, getCanonicalFileName: p => p, getNewLine: () => '\n' }))
checks.push('Strict ES2020/DOM compilation uses one self-contained Tomorrow/Contact module without a relative import')
check('The old Tomorrow implementation is unchanged', hash(old) === 'fccf92d790ae5ecb5aee489fff9c7cf63ce1b5a0fe4f01fc4494829b1f57ce6b')
const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX), allNames = ast.statements.filter(n => ts.isFunctionDeclaration(n) && n.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)).map(n => n.name.text), names = allNames.filter(name => name.startsWith('withMechaContact'))
check('The complete retained Tomorrow prefix is byte-exact and all47 public declarations are genuine', source.startsWith(old) && allNames.length === 47 && allNames.filter(name => name.startsWith('withMechaTomorrow')).length === 7)
check('Only the retained React and Framer imports remain; no sibling module is constructed', ast.statements.filter(ts.isImportDeclaration).map(n => n.moduleSpecifier.text).join('|') === 'react|react|framer')
check('Every public native override has the direct Framer HOC signature', names.length === 40 && names.every(name => source.includes(`export function ${name}(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props>`)))
check('Contact UI adds no renderer, frame clock, media, provider, network or submission path', !/requestAnimationFrame|setInterval|\bfetch\(|getContext\(|<canvas|<video|innerHTML|\.submit\(|@ts-ignore|\bas any\b/.test(source))
const compile = text => ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText
const js = compile(source), React = require('react'), server = require('react-dom/server'), API = {}, Old = {}, Bundle = {}, mode = { target: 'canvas', static: false }
const framer = { RenderTarget: { canvas: 'canvas', export: 'export', thumbnail: 'thumbnail', current: () => mode.target }, useIsStaticRenderer: () => mode.static }
new Function('require', 'exports', js)(name => { if (name === 'react') return React; if (name === 'framer') return framer; throw new Error('Unexpected bundle dependency: ' + name) }, Bundle)
for (const [name, hoc] of Object.entries(Bundle)) (name.startsWith('withMechaContact') ? API : Old)[name] = hoc
check('Contact and Tomorrow exports are views of one evaluated bundle and one retained Tomorrow context', Object.keys(Bundle).length === 47 && Object.keys(API).length === 40 && Object.keys(Old).length === 7 && Object.entries(API).every(([name, value]) => value === Bundle[name]) && Object.entries(Old).every(([name, value]) => value === Bundle[name]))
const Native = React.forwardRef((props, ref) => React.createElement('div', { ...props, ref })), quiet = console.error
try {
    console.error = (...args) => { if (!String(args[0]).includes('useLayoutEffect does nothing on the server')) quiet(...args) }
    for (const [target, staticFlag] of [['canvas', false], ['export', false], ['thumbnail', false], ['preview', true]]) {
        mode.target = target; mode.static = staticFlag
        for (const name of names) {
            const html = server.renderToStaticMarkup(React.createElement(API[name](Native), { title: 'caller-value', style: { transform: 'translateX(7px)', width: 143 } }, 'Editable native child'))
            assert.ok(html.includes('caller-value') && html.includes('Editable native child') && html.includes('translateX(7px)'), name)
        }
        checks.push(target + '/' + staticFlag + ' preserves every public role’s native children and caller styles in SSR')
    }
} finally { console.error = quiet }
const result = () => ({ passed: true, sourceSHA256: hash(source), sourceBytes: Buffer.byteLength(source), retainedTomorrowSHA256: hash(old), checkerSHA256: hash(fs.readFileSync(import.meta.filename)), geometrySHA256: hash(fs.readFileSync(geometryFile)), overrides: names.length, checks, samples, innerLeafRecords, errors, actualFramerPreviewVerified: false, afterEditorReload: false, limits: ['Native-like DOM is not actual Framer input/font/WAAPI forwarding.', 'Source GLB alpha and resource-budget proofs belong to the separate Contact actor checker.', 'Native copy is editable; subtitle is independently paraphrased and no form request/success is implemented.', 'Desktop1440 and Phone390 source correspondence is tested; intermediate tablet line breaking remains unobserved.', 'New inner details use cached original CSS plus measured source parent bounds; local leaf recordings do not claim a fresh original hover observation.', 'The anchor regression proves ordinary native DOM event defaults; actual Framer routing before callback remains unverified.'] })
if (process.argv.includes('--static-only')) { fs.writeFileSync(out + '/static-result.json', JSON.stringify(result(), null, 2) + '\n'); console.log(JSON.stringify({ passed: true, checks: checks.length })); process.exit(0) }
const fontDir = process.env.MONARCHIC_MECHA_CONTACT_SOURCE_FONT_DIR
assert.ok(fontDir, 'Set the fixed external source-comparison font directory')
const fonts = [['NeueHaasGroteskText-55Roman-Web.woff2', 'Neue Haas Grotesk', '3738d62007637dd68cbf813f441c94694197bdd938a6f953b178e87b35ec08f4'], ['FlechaM-Regular.woff2', 'Flecha M', 'e3f22b500a2a5072197d0e0184f7821461f30cae0bd65af3b92f8e40d60f51ce']].map(([file, family, sha]) => { const data = fs.readFileSync(path.join(fontDir, file)); assert.equal(hash(data), sha); return { family, data: data.toString('base64') } })
const { chromium } = require('@playwright/test'), browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] }), context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }), page = await context.newPage()
page.on('pageerror', e => errors.push(e.message)); page.setDefaultTimeout(5000)
await context.route('**/*', route => { errors.push('Unexpected request: ' + route.request().url()); return route.abort() })
const wait = fn => page.waitForFunction(fn, undefined, { polling: 25 }), pause = ms => new Promise(resolve => setTimeout(resolve, ms))
try {
    await page.setContent('<!doctype html><style>*{box-sizing:border-box}body{margin:0}html{overflow-y:scroll;scrollbar-gutter:stable}input,textarea{font:inherit}p{margin:0}#mount{min-height:4000px}button{font:inherit}</style><div id="mount"></div>')
    await page.addStyleTag({ content: fonts.map(f => `@font-face{font-family:"${f.family}";src:url(data:font/woff2;base64,${f.data});font-style:normal;font-weight:400}`).join('') })
    for (const name of ['react', 'react-dom']) await page.addScriptTag({ content: fs.readFileSync(path.join(path.dirname(require.resolve(name + '/package.json')), 'umd/' + name + '.development.js'), 'utf8') })
    await page.evaluate(() => {
        window.__target = 'preview'; window.__static = false; window.__epoch = 0; window.__cancel = false; window.__cancelTap = false; window.__cancelKey = false; window.__clicks = 0; window.__timers = new Map(); window.__refs = {}; window.__motions = []; window.__entryURL = location.href
        const timeout = setTimeout, clear = clearTimeout
        window.setTimeout = (fn, delay, ...args) => { let id; id = timeout(() => { __timers.delete(id); fn(...args) }, delay); if (delay === 1950 || delay === 1120) __timers.set(id, delay); return id }
        window.clearTimeout = id => { __timers.delete(id); return clear(id) }
        const animate = Element.prototype.animate
        Element.prototype.animate = function (frames, options) { const animation = animate.call(this, frames, options); if (this.dataset.mechaContactRole) __motions.push({ role: this.dataset.mechaContactRole, frames, options, animation }); return animation }
        window.__framer = { RenderTarget: { canvas: 'canvas', export: 'export', thumbnail: 'thumbnail', current: () => __target }, useIsStaticRenderer: () => __static }; window.__Old = {}; window.__API = {}; window.__Bundle = {}; window.__bundleEvaluations = 0
    })
    await page.addScriptTag({ content: `(function(){window.__bundleEvaluations++;new Function('require','exports',${JSON.stringify(js)})(name=>{if(name==='react')return window.React;if(name==='framer')return window.__framer;throw new Error('Unexpected bundle dependency:'+name)},window.__Bundle);for(const [name,hoc] of Object.entries(window.__Bundle))(name.startsWith('withMechaContact')?window.__API:window.__Old)[name]=hoc})()` })
    await page.evaluate(() => {
        const E = React.createElement, N = React.forwardRef(({ asTag, onTap, children, ...props }, ref) => E(asTag ?? 'div', { ...props, ref: node => { if (node) node.__tap = onTap; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node } }, children))
        const C = Object.fromEntries(Object.entries(__API).map(([key, hoc]) => [key.replace('withMechaContact', ''), hoc(N)]))
        const n = (role, key, children, props = {}) => E(C[role], { id: key, key, 'data-fixture-key': key, ...props }, children)
        const text = (role, key, value) => n(role, key, E('p', { style: { fontSize: 12, fontFamily: 'Arial', lineHeight: '12px' } }, E('span', null, value)))
        const icon = (role, key) => n(role, key, [n('ActionLineHorizontal', key + '-h'), n('ActionLineVertical', key + '-v')])
        const field = (role, key, label, tag = 'input') => n(key === 'message' ? 'WideFieldMask' : 'FieldMask', key + '-mask', n(role, key + '-group', [text('FieldLabel', key + '-label', label), n(tag === 'textarea' ? 'MessageInput' : 'Input', key, null, { asTag: tag, type: key === 'email' ? 'email' : 'text', name: key, placeholder: key === 'message' ? 'Tell us about it' : 'Enter ' + key, required: key !== 'message', 'aria-label': label }), n('Rule', key + '-rule')]))
        window.render = (target = 'preview', staticFlag = false, remount = false) => {
            __target = target; __static = staticFlag; if (remount) __epoch++
            const phone = innerWidth <= 991
            window.app.render(E(C.Root, { key: __epoch, id: 'root', ref: node => __refs.root = node, style: { position: 'relative', minHeight: 4000 } },
                n('Page', 'story', 'Existing native source story', { style: { position: 'relative', height: 4000, background: '#eee', transform: 'translateX(3px)' } }),
                n('Trigger', 'trigger', 'Contact', { asTag: 'a', href: '#unintended', ref: node => __refs.trigger = node, onClick: e => { __clicks++; if (__cancel) e.preventDefault() }, onTap: e => { if (__cancelTap) e.preventDefault() }, onKeyDown: e => { if (__cancelKey) e.preventDefault() }, style: { position: 'fixed', top: 20, left: 20, padding: 10, background: '#c5f0f7' } }),
                n('Overlay', 'overlay', [n('Fader', 'fader'), n('Background', 'background'), n('Wrap', 'wrap', [
                    n('FormPane', 'form-pane', [n('Form', 'form', [
                        n('Title', 'title', [n('Badge', 'badge', n('BadgeArt', 'badge-art', 'M / Contact us', { style: { border: '1px solid #c5f0f7', borderRadius: 14, color: '#c5f0f7', fontSize: 10, textAlign: 'center' } })),
                            n('Headlines', 'headlines', [n('TitleMask', 'title-first-mask', text('TitleFirst', 'title-first', phone ? 'Future of robotics begins' : 'Future of robotics')), n('TitleMask', 'title-second-mask', text('TitleSecond', 'title-second', phone ? 'here' : 'begins here')), n('SubtitleMask', 'subtitle-mask', text('Subtitle', 'subtitle', 'Back a team or share an opportunity'))])]),
                        n('Fields', 'fields', [field('Name', 'name', 'Name*'), field('Email', 'email', 'Email*'), field('Message', 'message', 'Message', 'textarea'), n('WideFieldMask', 'send-mask', n('Send', 'send', [icon('SendIcon', 'send-icon'), text('SendLabel', 'send-label', 'Send message')]))])
                    ]), n('Divider', 'divider')]),
                    n('Close', 'close', [text('CloseLabel', 'close-label', 'Close'), icon('CloseIcon', 'close-icon')]),
                    n('ModelPane', 'model-pane', n('ModelClip', 'model-clip', n('Graphic', 'graphic', null, { style: { outline: '1px dashed rgba(197,240,247,.4)' } })))
                ])], { style: { position: 'absolute', top: 0, left: 0, width: phone ? 390 : 1440, height: phone ? 844 : 900, opacity: 0, pointerEvents: 'none', scale: String(1280 / 1425), transform: 'scale(.91)', transformOrigin: '0 0' } }),
                E('div', { id: 'wrapped-native-probe', style: { position: 'absolute', top: 3600, width: 250 } }, n('Input', 'wrapped-native-field', E('input', { id: 'wrapped-native-input', style: { fontFamily: 'Arial', fontSize: 10, lineHeight: '10px', width: '70%', height: 5, padding: 8, border: '6px solid red', color: 'red', background: 'white' } })))
            ))
        }
        window.app = ReactDOM.createRoot(document.getElementById('mount')); window.tap = id => { const node = document.getElementById(id); node.__tap({ currentTarget: node, defaultPrevented: false, preventDefault() { this.defaultPrevented = true } }) }
        window.read = () => { const ids = ['overlay', 'background', 'fader', 'wrap', 'form-pane', 'form', 'title', 'headlines', 'fields', 'model-pane', 'model-clip', 'graphic', 'close', 'name', 'email', 'message', 'divider', 'name-rule', 'email-rule', 'message-rule', 'send', 'send-label', 'send-icon', 'send-icon-h', 'send-icon-v', 'close-label', 'close-icon', 'close-icon-h', 'close-icon-v']; return { state: document.getElementById('root').dataset.mechaContactState, width: innerWidth, clientWidth: document.documentElement.clientWidth, y: scrollY, focus: document.activeElement.id, timers: [...__timers.values()], overflow: document.documentElement.style.overflowY, wrapScroll: document.getElementById('wrap').scrollTop, wrapExtent: document.getElementById('wrap').scrollHeight, parts: Object.fromEntries(ids.map(id => { const node = document.querySelector('[data-fixture-key="' + id + '"]'), s = getComputedStyle(node); return [id, { bounds: node.getBoundingClientRect().toJSON(), transform: s.transform, scale: s.scale, transformOrigin: s.transformOrigin, opacity: s.opacity, fontSize: s.fontSize, lineHeight: s.lineHeight, overflow: s.overflowY, display: s.display, color: s.color, backgroundColor: s.backgroundColor }] })) } }
        render()
    })
    await wait(() => __refs.trigger && document.getElementById('root').dataset.mechaContactState === 'closed'); await page.evaluate(() => document.fonts.ready)
    check('Preview starts closed without a phase timer and forwards the native refs', await page.evaluate(() => __refs.root.id === 'root' && __refs.trigger.id === 'trigger' && __timers.size === 0 && getComputedStyle(document.querySelector('[data-fixture-key=overlay]')).display === 'none'))
    await page.evaluate(() => { __cancel = true; document.getElementById('trigger').click(); tap('trigger') }); check('Caller-cancelled click consumes its following synthetic tap', await page.evaluate(() => read().state === 'closed' && __clicks === 1))
    check('Cancelled anchor click followed by tap preserves its URL', await page.evaluate(() => location.href === __entryURL))
    await pause(360); await page.evaluate(() => { __cancel = false; __cancelTap = true; tap('trigger'); document.getElementById('trigger').click() }); check('Caller-cancelled tap consumes its following synthetic click', await page.evaluate(() => read().state === 'closed'))
    check('Cancelled anchor tap also cancels the duplicate click default', await page.evaluate(() => location.href === __entryURL))
    await pause(360); await page.evaluate(() => { __cancelTap = false; scrollTo(0, 585); tap('trigger'); document.getElementById('trigger').click() }); await wait(() => read().state === 'opening')
    let s = await page.evaluate(() => read()); samples.push({ phase: 'desktop-opening', ...s })
    check('Normal anchor tap followed by click opens without fragment navigation', await page.evaluate(() => location.href === __entryURL))
    check('Contact resets background to source zero, locks scroll, focuses Close and has one finite1950ms phase', s.y === 0 && s.overflow === 'hidden' && s.focus === 'close' && s.timers.length === 1 && s.timers[0] === 1950)
    const motions = await page.evaluate(() => __motions.map(({ role, frames, options }) => ({ role, frames, options }))); samples.push({ phase: 'opening-motions', motions })
    for (const [role, delay, duration] of [['background', 150, 900], ['model-clip', 250, 900], ['title-first', 610, 1000], ['title-second', 690, 1000], ['subtitle', 770, 1000], ['name', 950, 1000], ['close', 950, 1000], ['fader', 0, 400]]) check('Source opening timeline ' + role, motions.some(m => m.role === role && m.options.delay === delay && m.options.duration === duration && JSON.stringify(m.frames[0]) !== JSON.stringify(m.frames[1])))
    await wait(() => read().state === 'open'); await pause(70); s = await page.evaluate(() => read()); samples.push({ phase: 'desktop-settled', ...s })
    const compare = (variant, state) => {
        const expected = geometry.states[variant], differences = []
        for (const [key, original] of Object.entries(expected.parts)) for (const prop of ['x', 'y', 'width', 'height']) {
            if (key === 'headlines' && prop === 'width') continue // Source intrinsic max line width; native selectable wrapper spans the form.
            const delta = state.parts[key].bounds[prop] - original.bounds[prop]; if (Math.abs(delta) > .16) differences.push({ key, prop, delta, actual: state.parts[key].bounds[prop], expected: original.bounds[prop] })
        }
        for (const [i, key] of ['name', 'email', 'message'].entries()) for (const prop of ['x', 'y', 'width', 'height']) { const delta = state.parts[key].bounds[prop] - expected.inputs[i].bounds[prop]; if (Math.abs(delta) > .16) differences.push({ key, prop, delta }) }
        samples.push({ phase: variant + '-source-geometry', differences }); return differences
    }
    const compareInner = async (variant, state) => {
        check(variant + ' live overlay resets the authored Canvas fit and transform before source viewport geometry', state.parts.overlay.transform === 'none' && state.parts.overlay.scale === '1' && state.parts.overlay.transformOrigin === '0px 0px')
        const differences = []
        for (const [key, original] of Object.entries(geometry.states[variant].derivedDetails)) {
            if (original.display) { if (state.parts[key].display !== original.display) differences.push({ key, display: state.parts[key].display }); continue }
            for (const [prop, value] of Object.entries(original.bounds)) {
                const delta = state.parts[key].bounds[prop] - value
                if (Math.abs(delta) > .16) differences.push({ key, prop, delta, expected: value, actual: state.parts[key].bounds[prop] })
            }
        }
        samples.push({ phase: variant + '-source-css-inner-geometry', differences })
        check(variant + ' source divider and Send/Close leaf bounds follow retained source CSS', differences.length === 0)
        const colors = Object.fromEntries(geometry.sourceColors.keys.map(key => [key, { backgroundColor: state.parts[key].backgroundColor, opacity: state.parts[key].opacity }]))
        const colorsMatch = values => Object.values(values).every(value => value.backgroundColor === geometry.sourceColors.expected.backgroundColor && value.opacity === geometry.sourceColors.expected.opacity)
        samples.push({ phase: variant + '-source-css-stroke-colors', expected: geometry.sourceColors.expected, colors })
        check(variant + ' source white-at20percent divider and field-rule colors match cached original CSS', colorsMatch(colors))
        if (variant === 'desktop') {
            const scaleNegative = await page.evaluate(() => {
                const node = document.querySelector('[data-fixture-key=overlay]'), before = node.getBoundingClientRect(), properties = ['scale', 'transform'].map(property => ({ property, value: node.style.getPropertyValue(property), priority: node.style.getPropertyPriority(property) }))
                node.style.scale = String(1280 / 1425); node.style.transform = 'scale(.91)'
                const fitted = node.getBoundingClientRect()
                for (const { property, value, priority } of properties) if (value) node.style.setProperty(property, value, priority); else node.style.removeProperty(property)
                const restored = node.getBoundingClientRect()
                return { source: [before.width, before.height], fitted: [fitted.width, fitted.height], restored: [restored.width, restored.height] }
            })
            samples.push({ phase: 'authored-overlay-fit-negative', ...scaleNegative })
            check('Retaining the authored Canvas scale fails the independent live viewport bounds gate', scaleNegative.source.every((value, i) => Math.abs(value - scaleNegative.restored[i]) < .01) && scaleNegative.source[0] - scaleNegative.fitted[0] > 100)
            const negative = await page.evaluate(() => {
                const node = document.getElementById('name-rule'), old = ['background', 'opacity'].map(property => ({ property, value: node.style.getPropertyValue(property), priority: node.style.getPropertyPriority(property) }))
                node.style.background = 'rgba(197,240,247,.3)'; node.style.opacity = '1'
                const css = getComputedStyle(node), wrong = { backgroundColor: css.backgroundColor, opacity: css.opacity }
                for (const { property, value, priority } of old) if (value) node.style.setProperty(property, value, priority); else node.style.removeProperty(property)
                const restored = getComputedStyle(node)
                return { wrong, restored: { backgroundColor: restored.backgroundColor, opacity: restored.opacity } }
            })
            samples.push({ phase: 'prior-cyan-stroke-negative', ...negative })
            check('The old cyan-at30percent stroke fails the independent source-color gate and restores exact current styles', !colorsMatch({ wrong: negative.wrong }) && colorsMatch({ restored: negative.restored }))
        }
        check(variant + ' action icons remain editable two-stroke Frames with one-CSS-pixel lines and the correct divider parent', await page.evaluate(() =>
            document.getElementById('divider').parentElement.id === 'form-pane' && ['send-icon', 'close-icon'].every(id => {
                const icon = document.getElementById(id), h = document.getElementById(id + '-h'), v = document.getElementById(id + '-v')
                const hs = getComputedStyle(h), vs = getComputedStyle(v), matrix = new DOMMatrixReadOnly(hs.transform)
                return icon.tagName === 'DIV' && icon.children.length === 2 && h.tagName === 'DIV' && v.tagName === 'DIV' &&
                    h.getBoundingClientRect().height === 1 && v.getBoundingClientRect().width === 1 &&
                    matrix.a === 1 && matrix.d === 1 && matrix.b === 0 && matrix.c === 0 &&
                    hs.backgroundColor === (id === 'send-icon' ? 'rgb(38, 41, 51)' : 'rgb(197, 240, 247)') && hs.backgroundColor === vs.backgroundColor
            })
        ))
        innerLeafRecords.push(await page.evaluate(variant => ({ variant, kind: 'Measured local native-like leaf geometry, not actual Framer or a new original-source observation', viewport: [innerWidth, innerHeight], parts: Object.fromEntries(['send-label', 'send-icon', 'send-icon-h', 'send-icon-v', 'close-label', 'close-icon-h', 'close-icon-v'].map(key => {
            const node = document.getElementById(key), parent = node.parentElement, b = node.getBoundingClientRect(), p = parent.getBoundingClientRect(), css = getComputedStyle(node)
            return [key, { parent: parent.id, bounds: b.toJSON(), relativeBounds: { x: b.x - p.x, y: b.y - p.y, width: b.width, height: b.height }, font: { family: css.fontFamily, size: css.fontSize, lineHeight: css.lineHeight }, transform: css.transform }]
        })) }), variant))
        await page.screenshot({ path: out + '/' + variant + '-inner-details.png' })
    }
    check('Desktop opening matches retained source panel, form, model, clipping and genuine input bounds', compare('desktop', s).length === 0)
    await compareInner('desktop', s)
    check('Source page push completes and native story identity remains', await page.evaluate(() => document.getElementById('story').style.transform === 'translateX(3px) translateY(-200px)' && __timers.size === 0))
    await page.fill('#name', 'Prototype'); await page.fill('#email', 'preview@example.test'); await page.fill('#message', 'Editable native fields')
    check('All three genuine form controls accept typing and remain separate editable DOM nodes', await page.evaluate(() => document.getElementById('name').value === 'Prototype' && document.getElementById('email').value === 'preview@example.test' && document.getElementById('message').value === 'Editable native fields'))
    await page.click('#send'); check('Send leaves the draft visible without a request or invented success', await page.evaluate(() => read().state === 'open' && document.getElementById('message').value === 'Editable native fields') && errors.length === 0)
    check('Native input wrapper forwards source typography and geometry to its separately styled inner control', await page.evaluate(() => { const n = document.getElementById('wrapped-native-input'), s = getComputedStyle(n), r = n.getBoundingClientRect(); return r.width === 250 && r.height === 20 && s.fontFamily.includes('Neue Haas Grotesk') && s.fontSize === '16px' && s.borderTopWidth === '0px' && s.paddingTop === '0px' && s.color === 'rgb(197, 240, 247)' && s.backgroundColor === 'rgba(0, 0, 0, 0)' }))
    await page.keyboard.press('Escape'); await wait(() => read().state === 'closing'); check('Escape uses source1120ms close and delayed400ms fader', await page.evaluate(() => [...__timers.values()].includes(1120) && __motions.some(m => m.role === 'fader' && m.options.delay === 720 && m.options.duration === 400)))
    await wait(() => read().state === 'closed'); check('Closing restores source zero, caller focus and scroll style', await page.evaluate(() => scrollY === 0 && document.activeElement.id === 'trigger' && document.documentElement.style.overflowY === '' && __timers.size === 0))
    await page.setViewportSize({ width: 390, height: 844 }); await page.addStyleTag({ content: 'html{scrollbar-gutter:auto}' }); await page.evaluate(() => render()); await pause(80)
    await page.click('#trigger'); await wait(() => read().state === 'open'); s = await page.evaluate(() => read()); samples.push({ phase: 'phone-settled', ...s })
    check('Phone matches source reversed model/form order and source input bounds', compare('phone', s).length === 0)
    await compareInner('phone', s)
    check('Phone clip is293px high while its logical graphic retains422px source camera height', Math.abs(s.parts['model-clip'].bounds.height - 293.390625) < .1 && s.parts.graphic.bounds.height === 422 && s.wrapExtent > 1000)
    await page.locator('#wrap').evaluate(node => { node.scrollTop = 171 }); await pause(60); s = await page.evaluate(() => read()); samples.push({ phase: 'phone-wrap-scroll', ...s })
    check('Actual Phone wrap scrolls independently; source Close moves with that scroll content', s.wrapScroll > 150 && s.y === 0 && Math.abs(s.parts.close.bounds.y - (20 - s.wrapScroll)) < .1)
    await page.keyboard.press('Escape'); await wait(() => read().state === 'closed'); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.click('#trigger'); await wait(() => read().state === 'open')
    check('Reduced motion opens immediately and preserves source independent-scroll position without timers', await page.evaluate(() => __timers.size === 0 && document.getElementById('wrap').scrollTop === 171 && document.querySelector('[data-fixture-key=overlay]').getAnimations({ subtree: true }).length === 0))
    await page.evaluate(() => document.documentElement.style.setProperty('overflow-y', 'clip', 'important')); await page.click('#close'); await wait(() => read().state === 'closed'); check('Cleanup preserves a later caller-owned scroll style', await page.evaluate(() => document.documentElement.style.overflowY === 'clip' && document.documentElement.style.getPropertyPriority('overflow-y') === 'important'))
    await page.evaluate(() => document.documentElement.style.removeProperty('overflow-y'))
    for (const path of ['click', 'tap-click', 'Enter-click', 'Space-click', 'cancelled-Enter-click', 'cancelled-Space-click']) {
        await pause(360)
        await page.evaluate(path => { __cancelKey = path.startsWith('cancelled-'); if (path === 'click') document.getElementById('trigger').click(); else if (path === 'tap-click') { tap('trigger'); document.getElementById('trigger').click() } }, path)
        if (path.includes('Enter') || path.includes('Space')) {
            await page.focus('#trigger'); await page.keyboard.press(path.includes('Enter') ? 'Enter' : 'Space')
            await page.evaluate(() => document.getElementById('trigger').click())
        }
        const cancelled = path.startsWith('cancelled-')
        await wait(cancelled ? () => read().state === 'closed' : () => read().state === 'open')
        check('Anchor ' + path + ' retains caller cancellation, modal state and its original URL', await page.evaluate(cancelled => read().state === (cancelled ? 'closed' : 'open') && location.href === __entryURL, cancelled))
        await page.evaluate(() => { __cancelKey = false })
        if (!cancelled) { await page.click('#close'); await wait(() => read().state === 'closed') }
    }
    for (const [target, isStatic] of [['canvas', false], ['export', false], ['thumbnail', false], ['preview', true]]) { await page.evaluate(([t, s]) => render(t, s, true), [target, isStatic]); await pause(50); check(target + '/' + isStatic + ' freezes native authoring and starts no phase timer', await page.evaluate(() => __timers.size === 0 && read().state === 'closed' && getComputedStyle(document.querySelector('[data-fixture-key=overlay]')).opacity === '0')) }
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.evaluate(() => { document.documentElement.style.removeProperty('overflow-y'); render('preview', false, true) }); await pause(70); await page.click('#trigger'); await wait(() => read().state === 'opening'); await page.evaluate(() => app.unmount());
    check('Unmount during opening cancels the finite timer and restores leased styles', await page.evaluate(() => __timers.size === 0 && document.documentElement.style.overflowY === ''))
    check('No page errors or network submissions occurred', errors.length === 0)
    const originalContactCheckCount = checks.length
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.evaluate(() => {
        document.documentElement.style.removeProperty('overflow-y')
        const E = React.createElement, N = React.forwardRef(({ onTap, children, ...props }, ref) => E('div', { ...props, ref: node => { if (node) node.__tap = onTap; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node } }, children))
        const hoc = name => __Bundle[name](N), Root = hoc('withMechaContactRoot'), Page = hoc('withMechaContactPage'), More = hoc('withMechaTomorrowMore'), MoreOverlay = hoc('withMechaTomorrowDetailOverlay'), MoreSheet = hoc('withMechaTomorrowDetailSheet'), MoreClose = hoc('withMechaTomorrowDetailClose'), ContactTrigger = hoc('withMechaContactTrigger'), ContactOverlay = hoc('withMechaContactOverlay'), ContactClose = hoc('withMechaContactClose')
        window.app = ReactDOM.createRoot(document.getElementById('mount'))
        app.render(E(Root, { id: 'bundle-root', style: { position: 'relative', height: 4000 } },
            E(Page, { id: 'bundle-page', style: { position: 'relative', height: 4000 } }, 'Existing source story'),
            E(More, { id: 'bundle-more', style: { position: 'fixed', top: 0, width: 80, height: 30 } }, 'MORE'),
            E(MoreOverlay, { id: 'bundle-more-overlay', 'data-bundle-part': 'more-overlay', style: { position: 'fixed', inset: 0, opacity: 0 } }, E(MoreSheet, { id: 'bundle-more-sheet' }, E(MoreClose, { id: 'bundle-more-close', style: { width: 80, height: 30 } }, 'Close MORE'))),
            E(ContactTrigger, { id: 'bundle-contact', style: { position: 'fixed', top: 40, width: 90, height: 30 } }, 'Contact'),
            E(ContactOverlay, { id: 'bundle-contact-overlay', style: { opacity: 0 } }, E(ContactClose, { id: 'bundle-contact-close' }, 'Close Contact'))))
    })
    await wait(() => document.getElementById('bundle-root')?.dataset.mechaDetailState === 'closed' && document.getElementById('bundle-root')?.dataset.mechaContactState === 'closed' && getComputedStyle(document.getElementById('bundle-more')).display !== 'none')
    check('Native-like integration evaluates the47-role bundle exactly once', await page.evaluate(() => __bundleEvaluations === 1 && __Old.withMechaTomorrowDetailRoot === __Bundle.withMechaTomorrowDetailRoot && __API.withMechaContactRoot === __Bundle.withMechaContactRoot))
    await page.locator('#bundle-more').click()
    await wait(() => document.getElementById('bundle-root').dataset.mechaDetailState === 'open')
    check('An old MORE child receives the retained Tomorrow context inside the new Contact root', await page.evaluate(() => document.getElementById('bundle-root').dataset.mechaContactState === 'closed' && getComputedStyle(document.querySelector('[data-bundle-part=more-overlay]')).visibility === 'visible'))
    await page.locator('#bundle-more-close').click()
    await wait(() => document.getElementById('bundle-root').dataset.mechaDetailState === 'closed')
    await page.locator('#bundle-contact').click()
    await wait(() => document.getElementById('bundle-root').dataset.mechaContactState === 'open')
    check('Contact opens independently after old MORE closes in the same provider instance', await page.evaluate(() => document.getElementById('bundle-root').dataset.mechaDetailState === 'closed' && getComputedStyle(document.querySelector('[data-bundle-part=more-overlay]')).visibility === 'hidden'))
    await page.locator('#bundle-contact-close').click()
    await wait(() => document.getElementById('bundle-root').dataset.mechaContactState === 'closed')
    await page.evaluate(() => app.unmount())
    check('Same-bundle composition releases both controllers without timers or scroll leases', await page.evaluate(() => __timers.size === 0 && document.documentElement.style.overflowY === ''))
    samples.push({ phase: 'bundle-preservation', originalContactChecks: originalContactCheckCount, originalContactExpectedChecks: 57, addedSourceChecks: 3, original57Retained: originalContactCheckCount === 60 })
    fs.writeFileSync(out + '/inner-leaf-rectangles.json', JSON.stringify({ sourceSHA256: hash(source), checkerSHA256: hash(fs.readFileSync(import.meta.filename)), actualFramerVerified: false, records: innerLeafRecords }, null, 2) + '\n')
    fs.writeFileSync(out + '/result.json', JSON.stringify(result(), null, 2) + '\n'); console.log(JSON.stringify({ passed: true, checks: checks.length, out }))
} catch (error) {
    const actual = await page.evaluate(() => typeof read === 'function' ? read() : null).catch(error => ({ snapshotError: String(error) }))
    fs.writeFileSync(out + '/failure.json', JSON.stringify({ ...result(), passed: false, error: String(error), actual }, null, 2) + '\n')
    try { await page.screenshot({ path: out + '/failure.png' }) } catch {}
    throw error
} finally { await context.close(); await browser.close() }
