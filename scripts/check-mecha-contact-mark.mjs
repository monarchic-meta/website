import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {createMechanismHost} from './hero-mechanism-test-host.mjs';

// One bounded native-like React bridge. Actual Framer catalog registration,
// native clipping, Preview playback and a saved reload remain separate gates.
const repo = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const ts = require('typescript');
const sourcePath = path.join(repo, 'docs/design-studies/code-components/MechaScrollMark.tsx');
const source = fs.readFileSync(sourcePath, 'utf8');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const evidence = process.env.MONARCHIC_MECHA_CONTACT_EVIDENCE_DIR ?? '/tmp/monarchic-mecha-contact';
fs.mkdirSync(evidence, {recursive: true});
const checks = [];
const browserOnly = process.argv.includes('--browser-only');
const check = (name, body) => {if (!browserOnly) {body(); checks.push(name);}};
const compilerOptions = {target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React};

check('All prior renderer, coordinator, default component and eight controls are byte-exact', () => {
    assert.equal(hash(Buffer.from(source).subarray(0, 323818)), 'bd460fe3b64e7ca83a476c0df774a46054368e5375c66294f1e93f52b411b24a');
    assert.equal(source.match(/export default function MechaScrollMark/g)?.length, 1);
    assert.equal(source.match(/export function MechaContactMark/g)?.length, 1);
});

check('Strict ES2020 DOM and React signatures for the complete standalone module', () => {
    const virtual = new Map([
        [path.join(repo, '__contact-react.d.ts'), `export interface CSSProperties {[key:string]:string|number|undefined}; export interface RefObject<T>{current:T|null}; export function useRef<T>(v:T):{current:T}; export function useRef<T>(v:T|null):RefObject<T>; export function useState<T>(v:T):[T,(v:T|((p:T)=>T))=>void]; export function useEffect(f:()=>void|(()=>void),d:unknown[]):void; export function useLayoutEffect(f:()=>void|(()=>void),d:unknown[]):void; export function createElement(...a:any[]):any; declare global {namespace JSX {interface IntrinsicAttributes {key?:string|number}; interface IntrinsicElements {[tag:string]:{[key:string]:unknown}}}}`],
        [path.join(repo, '__contact-framer.d.ts'), `export const RenderTarget:{canvas:string;export:string;thumbnail:string;current():string};export const ControlType:Record<string,string>;export function useIsStaticRenderer():boolean;export function addPropertyControls(c:unknown,s:unknown):void;`],
    ]);
    const options = {...compilerOptions, strict: true, noEmit: true, skipLibCheck: true, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Node10, baseUrl: repo, paths: {react: ['__contact-react.d.ts'], framer: ['__contact-framer.d.ts']}};
    const host = ts.createCompilerHost(options), read = host.readFile.bind(host), exists = host.fileExists.bind(host);
    host.readFile = file => virtual.get(file) ?? read(file);
    host.fileExists = file => virtual.has(file) || exists(file);
    host.getSourceFile = (file, version) => {const text = host.readFile(file); return text === undefined ? undefined : ts.createSourceFile(file, text, version, true);};
    const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([sourcePath], options, host));
    assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics.slice(0, 10), {getCurrentDirectory: () => repo, getCanonicalFileName: x => x, getNewLine: () => '\n'}));
});

const compiled = ts.transpileModule(source, {compilerOptions}).outputText;
const captureAPI = '\n;return {exports,getMechaMeshes,mechaContactYaw,createMechaContactRenderer,getStudyPool,mechaContactAlphaLedger,mechaContactAlphaRevision,mechaContactAlphaRefresh,mechaContactAlphaDebug,publishMechaContactFrame};';
const declarations = [];
const fakeReact = {createElement: (type, props, ...children) => ({type, props: {...props, children}})};
const api = vm.runInNewContext('(function(require,exports){' + compiled + captureAPI + '})', {atob})(name => name === 'react' ? fakeReact : {addPropertyControls: (component, controls) => declarations.push({component, controls}), ControlType: {}, RenderTarget: {}, useIsStaticRenderer: () => false}, {});

check('Genuine packed geometry retains both primitives and the measured 2 to 1.8 world-size normalization', () => {
    const meshes = api.getMechaMeshes();
    assert.deepEqual(Array.from(meshes, mesh => [mesh.vertices.length, mesh.faces.length, mesh.black]), [[696, 1388, false], [8612, 16968, true]]);
    const bounds = [0, 1, 2].map(axis => {
        const values = meshes.flatMap(mesh => mesh.vertices.map(vertex => vertex[axis]));
        return [Math.min(...values), Math.max(...values)];
    });
    assert.equal(bounds[0][0], -1); assert.equal(bounds[0][1], 1);
    assert.equal(Math.max(...bounds.map(([lo, hi]) => hi - lo)), 2);
    assert.equal(2 * .9, 1.8);
    assert.ok(source.slice(323818).includes('fit=height/4*.9*settings.artworkScale'));
});

check('Entry follows source quartic power3.out and a declared frame-rate-normalized continuation', () => {
    assert.equal(api.mechaContactYaw(0), -Math.PI / 3);
    assert.ok(Math.abs(api.mechaContactYaw(1.2) + Math.PI / 48) < 1e-12);
    assert.equal(api.mechaContactYaw(2.4), 0);
    assert.ok(Math.abs(api.mechaContactYaw(3.4) - .27) < 1e-12);
});

check('The named component has its own control schema without changing the legacy eight controls', () => {
    assert.equal(declarations.length, 2);
    assert.equal(Object.keys(declarations[0].controls).length, 8);
    assert.equal(declarations[1].component, api.exports.MechaContactMark);
    assert.equal(declarations[1].controls.canvasMotion.defaultValue, false);
    assert.equal(declarations[1].controls.stillTime.defaultValue, 2.4);
});
check('Named component SSR retains a transparent actor and one accessible graphic', () => {
    const React = require('react'), {renderToString} = require('react-dom/server');
    const server = vm.runInNewContext('(function(require,exports){' + compiled + captureAPI + '})', {atob})(name => name === 'react' ? React : {addPropertyControls() {}, ControlType: {}, RenderTarget: {canvas: 'canvas', export: 'export', thumbnail: 'thumbnail', current: () => 'export'}, useIsStaticRenderer: () => true}, {});
    const html = renderToString(React.createElement(server.exports.MechaContactMark, {}));
    assert.equal((html.match(/<canvas/g) ?? []).length, 2);
    assert.equal((html.match(/role="img"/g) ?? []).length, 1);
    assert.ok(html.includes('background:transparent'));
});

// Actual five legacy shader factories and the unchanged shared coordinator.
// This host records submitted render state; it does not execute GLSL. Contact
// alpha pixels are exercised independently below in the real browser.
let mixedReport;
if (!browserOnly) {
const mixed = createMechanismHost();
mixed.context.getComputedStyle = () => ({display: 'block', visibility: 'visible', opacity: '1', getPropertyValue: () => ''});
mixed.Canvas.prototype.getAttribute = function(name) {return this.attributes?.[name] ?? null;};
const loadHost = (text, suffix) => vm.runInContext('(function(require,exports){' + ts.transpileModule(text, {compilerOptions}).outputText + suffix + '})(()=>({addPropertyControls(){},ControlType:{}}),{})', mixed.context);
const contact = loadHost(source, captureAPI);
const shared = contact.getStudyPool();
const manifest = JSON.parse(fs.readFileSync(path.join(repo, 'docs/design-studies/code-components/manifest.json')));
const modules = new Map();
for (const name of new Set(manifest.studies.map(study => study.componentSource))) {
    const text = fs.readFileSync(path.join(repo, 'docs/design-studies/code-components', name), 'utf8');
    modules.set(name, loadHost(text.slice(0, text.indexOf('/**\n * @framerSupportedLayoutWidth', text.indexOf('function createRenderer'))), ';return {getStudyPool,createRenderer};'));
    assert.equal(modules.get(name).getStudyPool(), shared, 'Legacy factory shares the existing v2 leader');
}
const entries = [];
for (const [index, study] of manifest.studies.entries()) for (let replica = 0; replica < 3; replica++) {
    const root = new mixed.Root(entries.length), display = new mixed.Canvas();
    root.clientWidth = display.clientWidth = 620; root.clientHeight = display.clientHeight = 360;
    root.setRect(20 + replica * 700, 20 + index * 440, 620, 360); display.root = root; display.isConnected = true;
    const settings = {primary: '#efc8c8', secondary: '#d6b442', ink: '#424855', ...study.studyProps, mode: study.mode, animate: false, static: true, canvasPreview: false, speed: 1, stillTime: study.studyProps.stillTime ?? 8, interactive: false};
    entries.push(shared.add({source: study.componentSource, root, display, settings, factory: modules.get(study.componentSource).createRenderer, target: 'canvas', notify() {}}));
}
const root = new mixed.Root(60), proxy = new mixed.Canvas(), alpha = new mixed.Canvas();
root.clientWidth = proxy.clientWidth = alpha.clientWidth = 420; root.clientHeight = proxy.clientHeight = alpha.clientHeight = 630;
root.setRect(1000, 20, 420, 630); proxy.root = alpha.root = root; proxy.isConnected = alpha.isConnected = true;
const ledger = contact.mechaContactAlphaLedger();
const settings = {mode: 'mechaScroll', animate: false, static: true, canvasPreview: false, speed: 1, stillTime: 2.4, interactive: false, primary: '#911a46', secondary: '#911a46', ink: '#c5f0f7', sceneState: {progress: 0}, artworkScale: 1, contactPaused: false, contactEntryOffset: 0};
const row = {id: ++ledger.serial, epoch: 0, root, proxy, display: alpha, entry: null, pool: shared, settings, valid: false, pending: false, frameKey: '', framePhase: 0, lastPaint: 0, disposed: false};
ledger.records.add(row); ledger.byProxy.set(proxy, row); row.settings = {...settings, artworkRevision: contact.mechaContactAlphaRevision(row)};
row.entry = shared.add({source: 'MechaScrollMark.tsx:MechaContactMark', root, display: proxy, settings: row.settings, factory: contact.createMechaContactRenderer, target: 'canvas', notify() {}});
for (let tick = 0; tick < 500; tick++) {
    await mixed.tick(); contact.publishMechaContactFrame(row);
    if ([...entries, row.entry].every(entry => entry.hasFrame && !entry.needsStill) && row.valid) break;
}
check('Sixty legacy mixed placements plus Contact retain adequate genuine render state and shared budgets', () => {
    assert.equal(entries.length, 60);
    for (const entry of [...entries, row.entry]) {assert.ok(entry.hasFrame); assert.ok(!entry.needsStill); assert.ok(entry.frameWidth > 0 && entry.frameHeight > 0);}
    assert.ok(row.valid && alpha.frame?.paintHash);
    const report = shared.debug(), extra = contact.mechaContactAlphaDebug();
    assert.ok(report.peakContexts <= 2); assert.ok(extra.alphaPixels <= 8000000); assert.ok(extra.combinedDisplayPixels <= 32000000);
});
mixedReport = {placements: 61, shared: shared.debug(), alpha: contact.mechaContactAlphaDebug(), scope: 'Actual five legacy factories/coordinator and genuine Contact Canvas paths under the retained deterministic resource host; no GLSL raster or actual Framer proof.'};
for (const entry of [...entries, row.entry]) shared.remove(entry);
ledger.records.delete(row); ledger.byProxy.delete(proxy);
await mixed.tick(3);
check('The mixed resource extension releases every shared lease and scheduling task', () => {assert.equal(shared.debug().entryCount, 0); assert.equal(shared.debug().activeContexts, 0); assert.equal(mixed.timers.size, 0);});
}

let priorStaticProof = null;
if (browserOnly) {
    const proofPath = process.env.MONARCHIC_MECHA_CONTACT_PRIOR_STATIC_RESULT ?? path.join(evidence, '../frozen-first-proof/failure.json');
    const bytes = fs.readFileSync(proofPath), proof = JSON.parse(bytes);
    assert.equal(proof.sourceSHA256, hash(source), 'A browser-only run needs prior strict/coordinator proof for these exact source bytes');
    assert.ok(proof.checks?.length >= 8, 'Eight prior strict/coordinator groups must have passed');
    priorStaticProof = {path: proofPath, sha256: hash(bytes), checks: proof.checks};
}
const receipt = {sourceSHA256: hash(source), sourceBytes: Buffer.byteLength(source), testSHA256: hash(fs.readFileSync(import.meta.filename)), browserOnly, priorStaticProof, checks, mixed: mixedReport, browser: null};
if (process.argv.includes('--static-only')) {
    fs.writeFileSync(path.join(evidence, 'static-result.json'), JSON.stringify({...receipt, passed: true}, null, 2) + '\n');
    console.log(JSON.stringify({...receipt, passed: true}, null, 2));
    process.exit(0);
}

const react = fs.readFileSync(path.join(path.dirname(require.resolve('react/package.json')), 'umd/react.development.js'), 'utf8');
const reactDOM = fs.readFileSync(path.join(path.dirname(require.resolve('react-dom/package.json')), 'umd/react-dom.development.js'), 'utf8');
const browserChecks = [], errors = [];
const browserCheck = (name, condition) => {assert.ok(condition, name); browserChecks.push(name);};
let browser, context, page;
try {
    browser = await chromium.launch({executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-accelerated-2d-canvas']});
    context = await browser.newContext({viewport: {width: 1440, height: 900}, deviceScaleFactor: 1});
    await context.route('**/*', route => route.abort());
    page = await context.newPage(); page.setDefaultTimeout(12000); page.on('pageerror', error => errors.push(error.message));
    await page.setContent('<!doctype html><style>html,body{margin:0}body{background:white;min-height:5000px}#clip{position:absolute;left:40px;top:40px;width:420px;height:630px;overflow:hidden}#mount{width:420px;height:630px;transform-origin:0 0}</style><div id="clip"><div id="mount"></div></div>');
    await page.addScriptTag({content: react}); await page.addScriptTag({content: reactDOM});
    await page.evaluate(() => {
        window.__target = 'preview'; window.__props = {paused: true}; window.__gl = 0; window.__rafRequests = 0;
        const raf = requestAnimationFrame, caf = cancelAnimationFrame, nativeTimeout = setTimeout, nativeClear = clearTimeout;
        window.__rafs = new Set(); window.__timers = new Set();
        window.requestAnimationFrame = callback => {window.__rafRequests++; const id = raf(time => {__rafs.delete(id); callback(time);}); __rafs.add(id); return id;};
        window.cancelAnimationFrame = id => {__rafs.delete(id); caf(id);};
        window.setTimeout = (callback, delay, ...args) => {const id = nativeTimeout(() => {__timers.delete(id); callback(...args);}, delay); __timers.add(id); return id;};
        window.clearTimeout = id => {__timers.delete(id); nativeClear(id);};
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(kind, ...args) {if (kind.includes('webgl')) window.__gl++; return Reflect.apply(getContext, this, [kind, ...args]);};
        window.__observers = {MutationObserver: new Set(), ResizeObserver: new Set(), IntersectionObserver: new Set()};
        for (const kind of Object.keys(__observers)) {const Original = window[kind]; window[kind] = class extends Original {constructor(callback, ...args) {super(callback, ...args); this.__kind = kind;} observe(...args) {__observers[kind].add(this); return super.observe(...args);} disconnect() {__observers[kind].delete(this); return super.disconnect();}};}
        window.__schemas = [];
        window.__framer = {RenderTarget: {canvas: 'canvas', preview: 'preview', export: 'export', thumbnail: 'thumbnail', current: () => __target}, ControlType: {}, useIsStaticRenderer: () => __target === 'export' || __target === 'thumbnail', addPropertyControls: (component, controls) => __schemas.push({name: component.name, controls})};
    });
    await page.addScriptTag({content: '(function(){const exports={};const require=name=>name===\'react\'?window.React:window.__framer;' + compiled + '\nwindow.contactAPI={...exports,getStudyPool,getMechaMeshes,createMechaContactRenderer,mechaContactAlphaLedger,mechaContactAlphaRefresh,mechaContactAlphaDebug};})();'});
    await page.evaluate(() => {
        window.__root = ReactDOM.createRoot(document.getElementById('mount'));
        window.setContact = props => {__props = {...__props, ...props}; __root.render(React.createElement(contactAPI.MechaContactMark, __props));};
        window.alphaCanvas = () => document.querySelector('canvas[role="img"]');
        window.alphaCapture = () => {
            const canvas = alphaCanvas(), pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
            let digest = 2166136261, transparent = 0, partial = 0, opaque = 0, maroon = 0, sky = 0, left = canvas.width, top = canvas.height, right = 0, bottom = 0;
            for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {const i = (y * canvas.width + x) * 4; for (let k = 0; k < 4; k++) digest = Math.imul(digest ^ pixels[i + k], 16777619); const a = pixels[i + 3]; if (!a) transparent++; else {if (a < 255) partial++; else opaque++; if (Math.abs(pixels[i] - 145) < 3 && Math.abs(pixels[i + 1] - 26) < 3 && Math.abs(pixels[i + 2] - 70) < 3 && Math.abs(a - 191) < 2) maroon++; if (pixels[i] === 197 && pixels[i + 1] === 240 && pixels[i + 2] === 247 && a === 255) sky++; left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);}}
            return {digest: digest >>> 0, transparent, partial, opaque, maroon, sky, width: canvas.width, height: canvas.height, bounds: {left, top, right, bottom}, valid: canvas.getAttribute('data-mecha-contact-alpha-valid'), state: canvas.getAttribute('data-study-state'), time: Number(canvas.getAttribute('data-mecha-contact-time')), yaw: Number(canvas.getAttribute('data-mecha-contact-yaw')), worldSpan: Number(canvas.getAttribute('data-mecha-contact-world-span')), cornerAlpha: [pixels[3], pixels[(canvas.width - 1) * 4 + 3], pixels[(canvas.height - 1) * canvas.width * 4 + 3]], alphaBudget: contactAPI.mechaContactAlphaDebug(), pool: contactAPI.getStudyPool().debug()};
        };
        window.freshContactDigest = () => {const actual = alphaCanvas(), entry = contactAPI.getStudyPool().debug().entries[0], canvas = document.createElement('canvas'), settings = {mode: 'mechaScroll', animate: false, static: true, canvasPreview: false, speed: 1, stillTime: 2.4, interactive: false, primary: '#911a46', secondary: '#911a46', ink: '#c5f0f7', sceneState: {progress: 0}, artworkScale: __props.artworkScale ?? 1, contactEntryOffset: __props.entryOffset ?? 0, contactPaused: true, managed: true, renderWidth: entry.logicalWidth, renderHeight: entry.logicalHeight, managedBufferWidth: actual.width, managedBufferHeight: actual.height, pixelBudget: 2000000}, renderer = contactAPI.createMechaContactRenderer(canvas, settings, () => {}); renderer.renderAt(Number(actual.getAttribute('data-mecha-contact-time'))); const rgba = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data; let digest = 2166136261; for (let i = 0; i < rgba.length; i++) digest = Math.imul(digest ^ rgba[i], 16777619); renderer.dispose(); return digest >>> 0;};
        setContact({});
    });
    const ready = () => page.waitForFunction(() => {const canvas = alphaCanvas(), row = [...contactAPI.mechaContactAlphaLedger().records].find(row => row.display === canvas), entry = row?.entry; return row?.valid && !row.pending && (!entry || (entry.hasFrame && !entry.needsStill && row.frameKey === entry.contentKey && Math.abs(row.framePhase - entry.framePhase) < .000001)) && canvas.getAttribute('data-study-state') === 'ready' && canvas.getAttribute('data-mecha-contact-alpha-valid') === 'true';}, null, {polling: 60});
    await ready(); const settled = await page.evaluate(() => alphaCapture());
    browserCheck('Actual Contact raster contains transparent exterior, source translucent maroon and opaque sky-blue materials', settled.transparent > 10000 && settled.maroon > 100 && settled.sky > 100 && settled.cornerAlpha.every(alpha => alpha === 0));
    browserCheck('Source world size is 1.8 and settled quartic yaw is zero', settled.worldSpan === 1.8 && settled.yaw === 0 && settled.time === 2.4);
    browserCheck('The actual visible output is at least the shared resolution demand on both axes', settled.width >= settled.pool.entries[0].desiredWidth && settled.height >= settled.pool.entries[0].desiredHeight);
    const projected = await page.evaluate(() => {const points = contactAPI.getMechaMeshes().flatMap(mesh => mesh.vertices).map(([x, y, z]) => [210 + (x - z) / Math.sqrt(2) * (630 / 4 * .9), 315 - (-x + 2 * y - z) / Math.sqrt(6) * (630 / 4 * .9)]); return {left: Math.min(...points.map(p => p[0])), right: Math.max(...points.map(p => p[0])), top: Math.min(...points.map(p => p[1])), bottom: Math.max(...points.map(p => p[1]))};});
    browserCheck('Actual alpha silhouette matches the independent original-camera and 1.8-world-size projection', Object.entries(projected).every(([edge, expected]) => Math.abs(settled.bounds[edge] / (edge === 'left' || edge === 'right' ? settled.width / 420 : settled.height / 630) - expected) < 2));
    browserCheck('The displayed transparent raster matches a fresh same-pose genuine renderer, beyond nonempty-image checks', (await page.evaluate(() => freshContactDigest())) === settled.digest);
    await page.screenshot({path: path.join(evidence, 'desktop-transparent-on-white.png')});
    await page.evaluate(() => document.body.style.background = '#111111');
    await page.screenshot({path: path.join(evidence, 'desktop-transparent-on-dark.png')});
    browserCheck('Changing the native backdrop leaves the actor RGBA unchanged and its corners transparent', (await page.evaluate(() => alphaCapture())).digest === settled.digest);

    // The original Phone canvas is 422px high inside its shorter 293px clip.
    await page.evaluate(() => {const clip = document.getElementById('clip'), mount = document.getElementById('mount'); clip.style.cssText = 'position:absolute;left:33.90625px;top:64.296875px;width:322.1875px;height:293.390625px;overflow:hidden'; mount.style.cssText = 'position:relative;top:-64.296875px;width:322.1875px;height:422px;transform-origin:0 0';});
    await page.setViewportSize({width: 390, height: 844}); await ready();
    await page.waitForFunction(() => contactAPI.getStudyPool().debug().entries[0].logicalHeight === 422, null, {polling: 60});
    const phone = await page.evaluate(() => alphaCapture());
    const phoneClip = await page.evaluate(() => document.getElementById('clip').getBoundingClientRect().toJSON());
    browserCheck('Source Phone retains its 422px logical camera and exact native clip with inherited subpixel clientWidth rounding', phone.pool.entries[0].logicalHeight === 422 && Math.abs(phone.pool.entries[0].logicalWidth - 322.1875) < 1 && phoneClip.width === 322.1875 && Math.abs(phoneClip.height - 293.390625) < .02);
    await page.screenshot({path: path.join(evidence, 'phone-original-clip.png')});
    await page.setViewportSize({width: 1440, height: 900});
    await page.evaluate(() => {document.getElementById('clip').style.cssText = 'position:absolute;left:40px;top:40px;width:840px;height:1260px;overflow:hidden'; document.getElementById('mount').style.cssText = 'width:420px;height:630px;transform:scale(2);transform-origin:0 0';});
    await page.waitForFunction(() => {const e = contactAPI.getStudyPool().debug().entries[0], c = alphaCanvas(); return e?.logicalHeight === 630 && c.width >= e.desiredWidth && c.height >= e.desiredHeight && c.getAttribute('data-study-state') === 'ready';}, null, {polling: 60});
    const zoomed = await page.evaluate(() => alphaCapture());
    browserCheck('A zoom refresh upgrades the alpha output without hover or Play and preserves transparency', zoomed.width > settled.width && zoomed.transparent > 10000 && zoomed.cornerAlpha.every(alpha => alpha === 0));

    // Returning to a previous canonical key must never expose opaque v2 cache
    // pixels. The local epoch requests a genuine serial paint instead.
    await page.evaluate(() => setContact({stillTime: 3})); await ready();
    await page.waitForFunction(() => Number(alphaCanvas().getAttribute('data-mecha-contact-time')) === 3, null, {polling: 60});
    await page.evaluate(() => setContact({stillTime: 2.4})); await ready();
    await page.waitForFunction(() => Number(alphaCanvas().getAttribute('data-mecha-contact-time')) === 2.4, null, {polling: 60});
    browserCheck('Canonical cache return contains real transparent source pixels', (await page.evaluate(() => alphaCapture())).cornerAlpha.every(alpha => alpha === 0));
    browserCheck('Cache return and zoom refinement equal a fresh same-resolution alpha render', (await page.evaluate(() => freshContactDigest())) === (await page.evaluate(() => alphaCapture())).digest);

    await page.evaluate(() => {document.getElementById('mount').style.transform = 'none'; document.getElementById('clip').style.height = '630px'; setContact({paused: false});});
    await page.waitForFunction(() => Number(alphaCanvas().getAttribute('data-mecha-contact-time')) > 2.65, null, {polling: 60});
    const moving = await page.evaluate(() => alphaCapture()); await page.waitForTimeout(220);
    browserCheck('Real entry/continuation animation changes genuine geometry pixels on the existing pool clock', (await page.evaluate(() => alphaCapture())).digest !== moving.digest);
    await page.evaluate(() => setContact({paused: true})); await page.waitForTimeout(180); const paused = await page.evaluate(() => alphaCapture()); await page.waitForTimeout(220);
    browserCheck('Local Pause holds the actual alpha frame and releases its live lease', (await page.evaluate(() => alphaCapture())).digest === paused.digest && paused.pool.activeContexts === 0);
    await page.evaluate(() => {setContact({paused: false}); document.getElementById('clip').style.opacity = '0';}); await page.waitForTimeout(180); const hidden = await page.evaluate(() => alphaCapture()); await page.waitForTimeout(180);
    browserCheck('Transparent native ancestry suspends animation while retaining genuine alpha art', (await page.evaluate(() => alphaCapture())).digest === hidden.digest && hidden.pool.activeContexts === 0);
    await page.evaluate(() => {const host = document.getElementById('clip'); host.style.opacity = '1'; host.animate([{opacity: 0}, {opacity: 1}], {duration: 150, fill: 'backwards'});});
    await page.waitForFunction(time => Number(alphaCanvas().getAttribute('data-mecha-contact-time')) > time + .1, hidden.time, {polling: 60});
    browserCheck('Actual ancestor WAAPI completion readmits the actor without a CSS completion event or an extra clock', (await page.evaluate(() => alphaCapture())).time > hidden.time + .1);
    await page.emulateMedia({reducedMotion: 'reduce'}); await ready(); const reduced = await page.evaluate(() => alphaCapture()); await page.waitForTimeout(180);
    browserCheck('Reduced motion returns the declared still, freezes actual pixels and releases the lease', reduced.time === 2.4 && (await page.evaluate(() => alphaCapture())).digest === reduced.digest && reduced.pool.activeContexts === 0);
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.evaluate(() => {window.__target = 'canvas'; setContact({canvasMotion: false});}); await ready(); const canvasStill = await page.evaluate(() => alphaCapture()); await page.waitForTimeout(180);
    browserCheck('Canvas motion defaults off and retains a transparent still', (await page.evaluate(() => alphaCapture())).digest === canvasStill.digest && canvasStill.pool.activeContexts === 0);
    await page.evaluate(() => setContact({canvasMotion: true})); await page.waitForFunction(time => Number(alphaCanvas().getAttribute('data-mecha-contact-time')) !== time, canvasStill.time, {polling: 60});
    const canvasMotion = await page.evaluate(() => alphaCapture());
    browserCheck('Canvas opt-in uses its existing 12fps at-most-1MP lease', canvasMotion.pool.live.length === 1 && canvasMotion.pool.live[0].target === 'canvas' && canvasMotion.pool.live[0].pixels <= 1000000);
    await page.evaluate(() => {window.__target = 'export'; setContact({canvasMotion: true});}); await page.waitForFunction(() => alphaCanvas()?.getAttribute('data-study-state') === 'ready', null, {polling: 60});
    const exported = await page.evaluate(() => alphaCapture()); await page.waitForTimeout(150);
    browserCheck('Static export stays transparent, frozen, serial and at-most-2MP despite the Canvas opt-in', exported.width * exported.height <= 2000000 && exported.pool.activeContexts === 0 && exported.cornerAlpha.every(alpha => alpha === 0) && (await page.evaluate(() => alphaCapture())).digest === exported.digest);

    await page.evaluate(() => {window.__target = 'preview'; setContact({paused: true});}); await ready();
    // Copy failure is local: no readback/matting and no opaque fallback. The
    // pending refresh flag must clear so later native re-entry can retry.
    await page.evaluate(() => {const row = [...contactAPI.mechaContactAlphaLedger().records][0], ctx = row.display.getContext('2d'), original = ctx.drawImage; row.valid = false; window.__failAlpha = true; ctx.drawImage = function(...args) {if (__failAlpha) {__failAlpha = false; throw Error('owned alpha-copy failure');} return Reflect.apply(original, this, args);}; contactAPI.mechaContactAlphaRefresh(row);});
    await page.waitForFunction(() => contactAPI.mechaContactAlphaDebug().copyErrors > 0, null, {polling: 60});
    browserCheck('Failed owned alpha paint releases its pending gate and retains transparent pixels', await page.evaluate(() => {const row = [...contactAPI.mechaContactAlphaLedger().records][0]; return !row.pending && alphaCapture().cornerAlpha.every(alpha => alpha === 0);}));
    await page.evaluate(() => {const row = [...contactAPI.mechaContactAlphaLedger().records][0]; row.entry.retryAt = 0; contactAPI.mechaContactAlphaRefresh(row);}); await ready();
    browserCheck('Restored alpha copy and visible re-entry produce a genuine new serial paint', await page.evaluate(() => [...contactAPI.mechaContactAlphaLedger().records][0].valid));

    // The private alpha ledger holds <=8MP, and only offscreen outputs may be
    // evicted. Re-entry refreshes the real component without pointer/Play.
    await page.evaluate(() => {
        document.getElementById('clip').style.top = '4000px';
        const ledger = contactAPI.mechaContactAlphaLedger(); window.__stressRows = [];
        for (let i = 0; i < 5; i++) {
            const root = document.createElement('div'); root.style.cssText = 'position:absolute;top:4500px;width:1000px;height:2000px'; document.body.append(root);
            const proxy = document.createElement('canvas'), display = document.createElement('canvas'); display.width = display.height = 1; root.append(proxy, display);
            const settings = {mode: 'mechaScroll', static: true, animate: false, canvasPreview: false, speed: 1, stillTime: 2.4, interactive: false, primary: '#911a46', secondary: '#911a46', ink: '#c5f0f7', sceneState: {progress: 0}, artworkScale: 1, contactEntryOffset: 0, contactPaused: true, managed: true, renderWidth: 1000, renderHeight: 2000, managedBufferWidth: 1000, managedBufferHeight: 2000, pixelBudget: 2000000, colorHost: proxy};
            const row = {id: ++ledger.serial, epoch: 0, root, proxy, display, entry: null, pool: null, settings, valid: false, pending: false, frameKey: '', framePhase: 0, lastPaint: 0, disposed: false}; ledger.records.add(row); ledger.byProxy.set(proxy, row);
            const renderer = contactAPI.createMechaContactRenderer(document.createElement('canvas'), settings, () => {}); renderer.renderAt(2.4); renderer.dispose(); __stressRows.push(row);
        }
    });
    const trimmed = await page.evaluate(() => ({capture: alphaCapture(), alpha: contactAPI.mechaContactAlphaDebug()}));
    browserCheck('The private output ledger evicts only offscreen frames and remains below 8MP', trimmed.alpha.evictions > 0 && trimmed.alpha.alphaPixels <= 8000000 && trimmed.capture.valid === 'false');
    await page.evaluate(() => {const ledger = contactAPI.mechaContactAlphaLedger(); for (const row of __stressRows) {row.disposed = true; ledger.records.delete(row); ledger.byProxy.delete(row.proxy); row.root.remove(); row.display.width = row.display.height = 1;} const host = document.getElementById('clip'); host.style.opacity = '0'; host.style.top = '40px';});
    await page.waitForTimeout(100);
    await page.evaluate(() => {const host = document.getElementById('clip'); host.style.opacity = '1'; host.animate([{opacity: 0}, {opacity: 1}], {duration: 150, fill: 'backwards'});});
    await ready();
    browserCheck('A paused evicted alpha frame rewarms after ancestor WAAPI visibility without hover, Play or a new intersection boundary', (await page.evaluate(() => alphaCapture())).cornerAlpha.every(alpha => alpha === 0) && (await page.evaluate(() => alphaCapture())).valid === 'true' && (await page.evaluate(() => alphaCapture())).pool.activeContexts === 0);

    await page.evaluate(() => {
        setContact({paused: false}); window.__peerRoots = [];
        for (let i = 0; i < 2; i++) {const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:' + (520 + i * 440) + 'px;top:40px;width:360px;height:450px'; document.body.append(host); const root = ReactDOM.createRoot(host); root.render(React.createElement(contactAPI.MechaContactMark, {paused: false})); __peerRoots.push({root, host});}
    });
    await page.waitForFunction(() => contactAPI.getStudyPool().debug().entryCount === 3 && [...contactAPI.mechaContactAlphaLedger().records].every(row => row.valid), null, {polling: 60});
    await page.evaluate(() => {const row = [...contactAPI.mechaContactAlphaLedger().records].find(row => document.getElementById('mount').contains(row.root)); row.root.tabIndex = 0; row.root.focus();});
    await page.waitForFunction(() => {const row = [...contactAPI.mechaContactAlphaLedger().records].find(row => document.getElementById('mount').contains(row.root)); return Boolean(row.entry.lease);}, null, {polling: 60});
    const beforeHandoff = await page.evaluate(() => alphaCapture());
    await page.evaluate(() => {const row = [...contactAPI.mechaContactAlphaLedger().records].find(row => __peerRoots[1].host.contains(row.root)); row.root.tabIndex = 0; row.root.focus();});
    await page.waitForFunction(() => {const row = [...contactAPI.mechaContactAlphaLedger().records].find(row => document.getElementById('mount').contains(row.root)); return !row.entry.lease;}, null, {polling: 60});
    await page.waitForTimeout(180); const handoff = await page.evaluate(() => alphaCapture());
    browserCheck('Focus handoff keeps a genuine sharp alpha frame while the shared pool admits only two Preview actors', handoff.valid === 'true' && handoff.cornerAlpha.every(alpha => alpha === 0) && handoff.width >= beforeHandoff.width && handoff.height >= beforeHandoff.height && handoff.pool.activeContexts <= 2 && handoff.pool.live.length <= 2);
    await page.evaluate(() => {for (const peer of __peerRoots) {peer.root.unmount(); peer.host.remove();} setContact({paused: true});});
    await ready();
    const final = await page.evaluate(() => alphaCapture());
    browserCheck('The new actor requests zero WebGL/RAF and shares the existing two-context budget', await page.evaluate(() => __gl === 0 && __rafRequests === 0) && final.pool.peakContexts <= 2 && final.pool.peakPixels <= 3000000 && final.pool.live.every(lease => lease.pixels <= 1000000));
    browserCheck('Combined retained output is explicitly measured against the 32MP policy', final.alphaBudget.combinedDisplayPixels <= 32000000 && final.alphaBudget.alphaPixelBudget === 8000000 && final.alphaBudget.combinedRetainedPolicy === 32000000);
    await page.evaluate(() => __root.unmount()); await page.waitForTimeout(80);
    const cleanup = await page.evaluate(() => ({pool: contactAPI.getStudyPool().debug(), alpha: contactAPI.mechaContactAlphaDebug(), rafs: __rafs.size, timers: __timers.size, observers: Object.fromEntries(Object.entries(__observers).map(([key, values]) => [key, values.size]))}));
    browserCheck('Unmount clears all owned outputs, leases, observers, timers and animation frames', cleanup.pool.entryCount === 0 && cleanup.pool.activeContexts === 0 && cleanup.alpha.outputs === 0 && cleanup.alpha.alphaPixels === 0 && cleanup.rafs === 0 && cleanup.timers === 0 && Object.values(cleanup.observers).every(value => value === 0));
    browserCheck('The focused native-like bridge has no browser exceptions', errors.length === 0);
    receipt.browser = {checks: browserChecks, settled, projected, phone, zoomed, moving, paused, hidden, reduced, canvasStill, canvasMotion, exported, trimmed, beforeHandoff, handoff, final, cleanup, errors};
    fs.writeFileSync(path.join(evidence, 'result.json'), JSON.stringify({...receipt, passed: true}, null, 2) + '\n');
    console.log(JSON.stringify({passed: true, sourceSHA256: receipt.sourceSHA256, testSHA256: receipt.testSHA256, staticChecks: checks.length, browserChecks: browserChecks.length, evidence}, null, 2));
} catch (error) {
    let liveFailure;
    if (page && !page.isClosed()) {try {await page.screenshot({path: path.join(evidence, 'failure.png')}); liveFailure = await page.evaluate(() => ({capture: typeof alphaCapture === 'function' ? alphaCapture() : null, markup: document.getElementById('mount')?.outerHTML}));} catch {}}
    fs.writeFileSync(path.join(evidence, 'failure.json'), JSON.stringify({...receipt, passed: false, browserChecks, errors, error: String(error), stack: error.stack, liveFailure}, null, 2) + '\n');
    throw error;
} finally {await context?.close(); await browser?.close();}
