import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
const require = createRequire(import.meta.url), ts = require('typescript'), repo = fileURLToPath(new URL('../', import.meta.url));
const file = process.env.MONARCHIC_AJEDREZ_SOURCE_PATH ?? path.join(repo, 'docs/design-studies/code-components/SourceAjedrezSequence.tsx'), source = fs.readFileSync(file, 'utf8');
const out = process.env.MONARCHIC_AJEDREZ_COMPOSITION_EVIDENCE_DIR ?? '/tmp/monarchic-ajedrez-photo-composition';
fs.mkdirSync(out, { recursive: true });
const constant = name => { const line = source.match(new RegExp('^const ' + name + ':.*$', 'm'))?.[0]; assert(line, 'one owned source data table ' + name); return JSON.parse(line.slice(line.indexOf(' = ') + 3)); };
const declaredTiles = constant('AJEDREZ_PHOTO_TILES'), declaredURLs = constant('AJEDREZ_PHOTO_ATLAS_URLS');
const genuine = process.env.MONARCHIC_AJEDREZ_ATLAS_DIR;
const map = genuine ? JSON.parse(fs.readFileSync(path.join(genuine, 'material-map.json'))) : { tiles: Object.entries(declaredTiles).map(([key, tile]) => ({ key, ...tile })), atlases: declaredURLs.map((_, index) => { const tiles = Object.values(declaredTiles).filter(tile => tile.atlas === index); return { width: Math.max(1, ...tiles.map(tile => tile.rect[0] + tile.rect[2] + 2)), height: Math.max(1, ...tiles.map(tile => tile.rect[1] + tile.rect[3] + 2)), ownedFixture: true }; }) };
function ownedAtlas(index) {
    const item = map.atlases[index], tiles = Object.entries(declaredTiles).filter(([, tile]) => tile.atlas === index);
    const parts = tiles.map(([key, tile], j) => { const [x, y, w, h] = tile.rect, seed = parseInt(crypto.createHash('sha256').update(key).digest('hex').slice(0, 6), 16), color = [60 + seed % 150, 50 + (seed >>> 8) % 150, 40 + (seed >>> 16) % 150]; return '<g><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="rgb(' + color.join(',') + ')"/><path d="M' + x + ' ' + y + 'L' + (x + w) + ' ' + (y + h) + 'M' + (x + w) + ' ' + y + 'L' + x + ' ' + (y + h) + '" stroke="#eee" stroke-width="3"/><rect x="' + (x + 5) + '" y="' + (y + 5) + '" width="' + Math.max(1, w - 10) + '" height="' + Math.max(1, h - 10) + '" fill="url(#owned-grid)" opacity=".8"/></g>'; }).join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + item.width + '" height="' + item.height + '"><defs><pattern id="owned-grid" width="13" height="13" patternUnits="userSpaceOnUse"><path d="M0 0H13V13" fill="none" stroke="#171717" stroke-width="2"/></pattern></defs>' + parts + '</svg>';
}
const checks = [], requests = [], errors = [], check = (name, ok) => { assert.ok(ok, name); checks.push(name); };
const server = http.createServer((req, res) => { const i = Number(new URL(req.url, 'http://127.0.0.1').pathname.split('/').at(-1)); if (!Number.isInteger(i) || !map.atlases[i]) {
    res.writeHead(404);
    res.end();
    return;
} requests.push(i); const send = () => { res.writeHead(200, { 'Content-Type': genuine ? 'image/webp' : 'image/svg+xml', 'Access-Control-Allow-Origin': '*' }); if (genuine) fs.createReadStream(map.atlases[i].path).pipe(res); else res.end(ownedAtlas(i)); }; if (new URL(req.url, 'http://127.0.0.1').searchParams.has('cold')) setTimeout(send, 160); else send(); });
(async () => {
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const urls = map.atlases.map((_, i) => 'http://127.0.0.1:' + server.address().port + '/' + i), bound = source.replace(/^const AJEDREZ_PHOTO_ATLAS_URLS:.*$/m, 'const AJEDREZ_PHOTO_ATLAS_URLS: readonly (string | null)[] = ' + JSON.stringify(urls)), js = ts.transpileModule(bound, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText + '\nwindow.__useComposition=useAjedrezPhotographicComposition;window.__photoPose=ajedrezPhotoPose;', react = fs.readFileSync(repo + '/node_modules/react/umd/react.development.js', 'utf8'), dom = fs.readFileSync(repo + '/node_modules/react-dom/umd/react-dom.development.js', 'utf8');
    const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] });
    try {
        const page = await browser.newPage({ viewport: { width: 1200, height: 950 }, deviceScaleFactor: 1 });
        page.on('pageerror', e => errors.push(e.message));
        await page.setContent('<style>*{box-sizing:border-box}body{margin:0;background:#fff}p{margin:0}#zoom{transform-origin:top left}</style><div id="zoom"><div id="root"></div></div>');
        await page.addScriptTag({ content: react });
        await page.addScriptTag({ content: dom });
        await page.evaluate(() => { window.__target = 'preview'; window.exports = {}; window.require = n => n === 'react' ? window.React : { RenderTarget: { canvas: 'canvas', export: 'export', thumbnail: 'thumbnail', current: () => __target }, useIsStaticRenderer: () => __target !== 'preview' }; window.__raf = 0; window.__video = 0; window.__webgl = 0; window.__observers = new Set(); const raf = window.requestAnimationFrame; window.requestAnimationFrame = function (f) { __raf++; return raf.call(this, f); }; const create = document.createElement.bind(document); document.createElement = function (name, ...rest) { if (name === 'video')
            __video++; return create(name, ...rest); }; const get = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (name, ...rest) { if (name.includes('webgl'))
            __webgl++; return get.call(this, name, ...rest); }; for (const name of ['ResizeObserver', 'MutationObserver']) {
            const Original = window[name];
            window[name] = class extends Original {
                constructor(fn) { super(fn); __observers.add(this); }
                disconnect() { super.disconnect(); __observers.delete(this); }
            };
        } });
        await page.addScriptTag({ content: js });
        await page.evaluate(() => {
            const E = React.createElement;
            window.__tag = 'section';
            window.__width = 480;
            window.__caller = { current: null };
            window.__state = { time: 985 / 24, index: 30, frozen: false, reduced: false, playing: true, active: true, complete: false, toggle() { }, replay() { } };
            function Preview() {
                const [host, setHost] = React.useState(null);
                const bind = React.useCallback(n => { __caller.current = n; setHost(n); }, []);
                __useComposition(host, __state);
                const E = React.createElement, sx = __width / 480, sy = (__width * 852 / 480) / 852;
                function text(name, content, left, top, width, opacity = 1, font = 5) { return E('div', { 'data-framer-name': name, key: name, style: { position: 'absolute', left: left * sx, top: top * sy, width: width * sx, height: 'auto', fontSize: font, lineHeight: font + 2, color: '#202724', opacity } }, E('p', null, content)); }
                const groups = Array.from({ length: 37 }, (_, i) => { const n = String(i + 1).padStart(2, '0'), prefix = 'HERO-002 / film-phase-' + n; const bodyKey = i === 29 ? 'sentence' : 'opening'; const fields = [E('div', { 'data-framer-name': prefix + '-' + (i === 26 ? 'hall-0' : i === 30 ? 'hand-0' : i === 34 ? 'globe' : 'photo-0'), 'data-backing': true, key: 'photo', style: { position: 'absolute', left: 0, top: 275, width: 233, height: 164, background: '#ff00ff', opacity: .9 } }), text(prefix + '-credit', 'Independent native credit', 12, 12, 240), text(prefix + '-index', 'NATIVE INDEX', 406, 12, 62), text(prefix + '-record', 'Independent native footer', 12, 831, 370), ...([2, 3, 29, 33].includes(i) ? [text(prefix + '-' + bodyKey, 'Independent chapter copy remains editable.', i === 29 ? 18 : 74, i === 29 ? 393 : 356, i === 29 ? 650 : 230, .75, i === 29 ? 24 : 11)] : [])]; const captions = []; if (i === 29 || i === 30)
                    captions.push(text(prefix + '-photo-hand-catalog', 'EADWEARD MUYBRIDGE / Animal Locomotion,1887', 342, 205, 130, 0)); if (i === 30)
                    captions.push(text(prefix + '-photo-hand-line', 'Independent chapter copy remains editable.', 34, 615, 420, 0)); if (i === 33)
                    captions.push(text(prefix + '-photo-earth-caption', '47 / ARCHIVAL FILM MATERIAL', 114, 558, 320, 0)); if (i === 34)
                    fields.push(text(prefix + '-caption', '47 / ARCHIVAL FILM MATERIAL', 114, 558, 320)); const contents = i === 33 ? [E('div', { 'data-framer-name': 'HERO-002 / film-phase-34', key: 'opaque-inner', style: { position: 'absolute', inset: 0, background: '#bbc4c1' } }, ...fields)] : fields; return E('div', { 'data-source-ajedrez-group': i + 1, 'aria-hidden': i !== __state.index, key: i, style: { position: 'absolute', inset: 0, width: '100%', height: '100%', background: i === 34 ? '#1f2120' : '#bbc4c1', opacity: i === __state.index ? 1 : 0, visibility: i === __state.index ? 'visible' : 'hidden' } }, ...contents, ...captions); });
                return E(__tag, { ref: bind, id: 'film', style: { position: 'relative', width: __width, height: __width * 852 / 480, background: '#bbc4c1' } }, ...groups);
            }
            window.__root = ReactDOM.createRoot(document.getElementById('root'));
            window.render = () => ReactDOM.flushSync(() => __root.render(E(Preview)));
            window.setState = patch => { __state = { ...__state, ...patch }; render(); };
            window.snap = () => { const film = document.getElementById('film'), s = film.querySelector('canvas'), clockGroup = film.querySelector('[data-source-ajedrez-group="' + (__state.index + 1) + '"]'), group = s?.style.visibility === 'visible' ? s.parentElement : clockGroup, native = group.querySelector('[data-backing]'), nativeText = group.querySelector('[data-framer-name$="credit"]'); return { groups: film.querySelectorAll('[data-source-ajedrez-group]').length, ref: __caller.current === film, tag: film.tagName, width: s?.width, height: s?.height, visible: s?.style.visibility, pose: s?.dataset.sourceAjedrezPhotoPose, sourceFrame: Number(s?.dataset.sourceAjedrezPhotoSourceFrame), parts: Number(s?.dataset.sourceAjedrezPhotoCount), pixels: s?.toDataURL(), backing: native.style.opacity, credit: nativeText.textContent, creditZ: nativeText.style.zIndex, visualGroup: Number(group.dataset.sourceAjedrezGroup), visualAria: group.getAttribute('aria-hidden'), clockAria: clockGroup.getAttribute('aria-hidden'), clockOpacity: clockGroup.style.opacity, bodyOpacity: group.querySelector('[data-framer-name$="-sentence"],[data-framer-name$="-opening"]')?.style.opacity, bodyLeft: group.querySelector('[data-framer-name$="-sentence"],[data-framer-name$="-opening"]')?.style.left, bodyTop: group.querySelector('[data-framer-name$="-sentence"],[data-framer-name$="-opening"]')?.style.top, bodyFont: group.querySelector('[data-framer-name$="-sentence"],[data-framer-name$="-opening"]')?.style.fontSize, captionOpacity: group.querySelector('[data-framer-name*="photo-hand-catalog"],[data-framer-name*="photo-earth-caption"]')?.style.opacity, background: getComputedStyle(group).backgroundColor, nestedBackground: group.querySelector('[data-framer-name$="film-phase-34"]') && getComputedStyle(group.querySelector('[data-framer-name$="film-phase-34"]')).backgroundColor, creditColor: getComputedStyle(nativeText.querySelector('p')).color, edgeTop: s && s.getContext('2d').getImageData(Math.floor(s.width * 20 / 480), Math.floor(s.height * 5 / 852), 1, 1).data[3], edgeBottom: s && s.getContext('2d').getImageData(Math.floor(s.width * 20 / 480), Math.floor(s.height * 845 / 852), 1, 1).data[3], observers: __observers.size, raf: __raf, video: __video, webgl: __webgl }; };
            render();
        });
        await page.waitForFunction(() => snap().pose === 'hand-reveal-four' && snap().visible === 'visible');
        let first = await page.evaluate(() => snap());
        check('genuine photographic tiles render via one2D surface while37 native groups, independent copy and caller ref remain', first.groups === 37 && first.parts === 12 && first.ref && first.credit === 'Independent native credit' && first.backing === '0' && first.creditZ === '2');
        check('photo composition creates no ownRAF, video decoder or WebGL context', first.raf === 0 && first.video === 0 && first.webgl === 0);
        const imagesSeen = requests.length;
        await page.evaluate(() => setState({ time: 984 / 24 }));
        await page.waitForFunction(() => snap().pose === 'hand-reveal-three');
        const beforeCut = await page.evaluate(() => snap());
        await page.evaluate(() => setState({ time: 985 / 24 }));
        await page.waitForFunction(() => snap().pose === 'hand-reveal-four');
        const afterCut = await page.evaluate(() => snap());
        check('exact source985 hard cut reveals fourth hand photograph instead of a globalfade orinterpolatedcamera', beforeCut.parts === 9 && afterCut.parts === 12 && beforeCut.pixels !== afterCut.pixels && afterCut.sourceFrame === 985);
        check('full sourcephotographic repeats reach topandbottom edges while nativecredits remain above material', afterCut.edgeTop === 255 && afterCut.edgeBottom === 255 && afterCut.creditZ === '2' && afterCut.captionOpacity === '1');
        await page.evaluate(() => setState({ time: 986 / 24 }));
        let held = await page.evaluate(() => snap());
        check('held source photograph pose keeps exact pixels without anotherimage request', held.pixels === afterCut.pixels && requests.length === imagesSeen);
        await page.evaluate(() => setState({ active: false, playing: false }));
        await page.evaluate(() => document.getElementById('zoom').style.transform = 'scale(2)');
        await page.waitForFunction(() => snap().width === 960 && snap().height === 1704);
        let sharp = await page.evaluate(() => snap());
        check('paused zoom re-renders source-resolution photographs from cached images without Play orRAF', sharp.width * sharp.height <= 2000000 && sharp.pose === 'hand-reveal-four' && sharp.raf === 0 && sharp.video === 0);
        await page.evaluate(() => document.getElementById('zoom').style.transform = 'scale(.5)');
        await page.waitForFunction(() => snap().width === 240);
        await page.evaluate(() => document.getElementById('zoom').style.transform = 'scale(1)');
        await page.waitForFunction(() => snap().width === 480);
        const restored = await page.evaluate(() => snap());
        check('down/up zoom restores original sharp photographic pixels without resampling the displaybitmap', restored.pixels === afterCut.pixels);
        await page.evaluate(() => { __tag = 'article'; __width = 375; setState({ time: 985 / 24, active: true, playing: true }); });
        await page.waitForFunction(() => snap().tag === 'ARTICLE' && snap().visible === 'visible');
        let phone = await page.evaluate(() => snap());
        check('real nativeDOM host replacement fits currentPhone geometry and retains the callerref', phone.width === 375 && phone.height === 666 && phone.ref && phone.groups === 37);
        await page.evaluate(() => setState({ time: 1001 / 24 }));
        let exited = await page.evaluate(() => snap());
        check('source1001 cut hides photographic layer and oldheldnative image for the remainingapproximatephase', exited.visible === 'hidden' && exited.backing === '0');
        await page.evaluate(() => setState({ time: 42, index: 31 }));
        let next = await page.evaluate(() => snap());
        check('moving to anothernativephase leaves its authoredimage andcopy unchanged', next.backing === '0.9' && next.credit === 'Independent native credit');
        await page.evaluate(() => setState({ time: 792 / 24, index: 26 }));
        await page.waitForFunction(() => snap().pose === 'tournament-hall-a');
        let hallA = await page.evaluate(() => snap());
        await page.evaluate(() => setState({ time: 800 / 24 }));
        await page.waitForFunction(() => snap().pose === 'tournament-hall-b');
        let hallB = await page.evaluate(() => snap());
        check('source800 tournament photo cut changes genuinephotographic pixels with same mastertime', hallA.pixels !== hallB.pixels && hallB.sourceFrame === 800);
        await page.evaluate(() => setState({ time: 82 / 24, index: 2 }));
        await page.waitForFunction(() => snap().pose === 'room');
        check('earlierroomstrip is availablefromsourceframe82 withoutchangingthe37-phase clock', (await page.evaluate(() => snap())).sourceFrame === 82);
        check('roomcut hides only mismatchedtype payload whileindependentnative metadata stayspresent', await page.evaluate(() => snap().visualGroup === 5 && snap().visualAria === 'false' && snap().clockAria === 'true' && snap().clockOpacity === '0' && snap().credit === 'Independent native credit' && snap().creditZ === '2'));
        await page.evaluate(() => setState({ time: 973 / 24, index: 29 }));
        await page.waitForFunction(() => snap().pose === 'hand-reveal-two');
        const prefix = await page.evaluate(() => snap());
        check('handprefix retains independenteditable sentence in its actualsmallsource615line andshowsnativecatalog', prefix.visualGroup === 31 && prefix.visualAria === 'false' && prefix.clockAria === 'true' && prefix.captionOpacity === '1' && await page.evaluate(() => { const line = document.querySelector('[data-source-ajedrez-group="31"] [data-framer-name$="photo-hand-line"]'); return line.style.opacity === '1' && line.textContent === 'Independent chapter copy remains editable.'; }));
        await page.screenshot({ path: out + '/hand-prefix-full-composition.png' });
        await page.evaluate(() => { const n = document.querySelector('[data-source-ajedrez-group="31"] [data-framer-name$="photo-hand-line"]'); n.style.setProperty('opacity', '.4'); n.style.setProperty('left', '29px'); setState({ time: 974 / 24 }); });
        await page.evaluate(() => setState({ time: 966 / 24 }));
        const restoredCopy = await page.evaluate(() => snap());
        check('reversebeforephotocut restoreslatestnativecopyopacity/position andoriginallargefont', restoredCopy.bodyOpacity === '0.75' && restoredCopy.bodyLeft === '14.0625px' && restoredCopy.bodyFont === '24px' && await page.evaluate(() => { const line = document.querySelector('[data-source-ajedrez-group="31"] [data-framer-name$="photo-hand-line"]'); return line.style.opacity === '0.4' && line.style.left === '29px' && line.closest('[data-source-ajedrez-group]').style.opacity === '0' && line.closest('[data-source-ajedrez-group]').getAttribute('aria-hidden') === 'true'; }));
        await page.evaluate(() => setState({ time: 1116 / 24, index: 33 }));
        await page.waitForFunction(() => snap().pose === 'earth');
        const earth = await page.evaluate(() => snap());
        check('Earthprefix usesoriginaldarkfield throughopaquenativevariant andhidesscatteredpayload withoutlosingmetadata/caption', earth.background === 'rgb(31, 33, 32)' && earth.visualGroup === 35 && earth.visualAria === 'false' && earth.clockAria === 'true' && earth.clockOpacity === '0' && earth.creditColor === 'rgb(193, 202, 198)');
        await page.screenshot({ path: out + '/earth-prefix-full-composition.png' });
        await page.evaluate(() => setState({ time: 1115 / 24 }));
        const beforeEarth = await page.evaluate(() => snap());
        check('reverseEarthcut restoresnativevariantbackground, scatteredcopyandmetadata ink', beforeEarth.background === 'rgb(187, 196, 193)' && beforeEarth.nestedBackground === 'rgb(187, 196, 193)' && beforeEarth.bodyOpacity === '0.75' && beforeEarth.creditColor === 'rgb(32, 39, 36)' && beforeEarth.clockAria === 'false' && beforeEarth.clockOpacity === '1' && await page.evaluate(() => { const scene = document.querySelector('[data-source-ajedrez-group="35"]'); return scene.getAttribute('aria-hidden') === 'true' && scene.style.opacity === '0' && scene.style.visibility === 'hidden'; }));
        await page.screenshot({ path: out + '/room-source-material.png' });
        await page.evaluate(() => setState({ time: 985 / 24, index: 30, active: true, playing: true }));
        await page.waitForFunction(() => snap().pose === 'hand-reveal-four' && snap().visible === 'visible');
        const poseLine = bound.match(/^const AJEDREZ_PHOTO_POSES:.*$/m)[0], poseData = JSON.parse(poseLine.slice(poseLine.indexOf(' = ') + 3)), swapData = JSON.parse(JSON.stringify(poseData));
        for (const part of swapData.find(x => x.name === 'hand-reveal-four').rects) {
            if (part.tile === 'hand-1')
                part.tile = 'hand-2';
            else if (part.tile === 'hand-2')
                part.tile = 'hand-1';
        }
        const swapped = bound.replace(poseLine, poseLine.slice(0, poseLine.indexOf(' = ') + 3) + JSON.stringify(swapData));
        const moduleCode = code => '(()=>{' + ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText + '\nwindow.__useComposition=useAjedrezPhotographicComposition;})()';
        const scalar = code => code.replace(/^const AJEDREZ_PHOTO_COMPOSITION_REVISION = .*$/m, "const AJEDREZ_PHOTO_COMPOSITION_REVISION = 'fixed-old-revision'");
        await page.addScriptTag({ content: moduleCode(scalar(bound)) });
        await page.evaluate(() => render());
        await page.waitForFunction(() => snap().pose === 'hand-reveal-four');
        const negativeStart = await page.evaluate(() => { window.__oldSurface = document.querySelector('canvas'); return snap().pixels; });
        await page.addScriptTag({ content: moduleCode(scalar(swapped)) });
        await page.evaluate(() => render());
        await page.waitForTimeout(60);
        check('negativecontrol reproduces stalephotographicowner aftersame-schema datachange withscalarrevision', await page.evaluate(old => document.querySelector('canvas') === __oldSurface && snap().pixels === old, negativeStart));
        await page.addScriptTag({ content: moduleCode(swapped) });
        await page.evaluate(() => render());
        await page.waitForFunction(old => snap().pixels !== old, negativeStart);
        check('private moduleidentity replacesstaleowner andrerenders currentphotographicdata whilecachedimagesremainvalid', await page.evaluate(() => document.querySelector('canvas') !== __oldSurface && !__oldSurface.isConnected && snap().ref && snap().groups === 37 && snap().raf === 0 && snap().video === 0));
        await page.addScriptTag({ content: moduleCode(bound) });
        await page.evaluate(() => render());
        await page.waitForFunction(old => snap().pixels === old, negativeStart);
        check('same-schema factoryhandoff restoresgenuinephoto pixels withoutPlay, hover, anotherdecoder orRAF', await page.evaluate(() => snap().raf === 0 && snap().video === 0 && snap().webgl === 0));
        const rawTiles = JSON.parse(bound.match(/^const AJEDREZ_PHOTO_TILES:.*$/m)[0].split(' = ')[1]), tile0 = Object.values(rawTiles).find(tile => tile.atlas === 0), releaseLine = '                for (const [index, watch] of watches) if (!desired.has(index)) { watch.release(); watches.delete(index) }';
        for (const mode of ['negative-retained', 'released']) {
            const longUrls = Array.from({ length: 12 }, (_, i) => urls[0] + '?lease-case=' + mode + '-' + i), longTiles = Object.fromEntries(longUrls.map((_, i) => ['cache-' + i, { ...tile0, atlas: i }])), longPoses = longUrls.map((_, i) => ({ name: 'hand-cache-' + i, first: (10 + i * 2) * 24, last: (11 + i * 2) * 24, rects: [{ tile: 'cache-' + i, rect: [0, 275, 233, 164] }] }));
            let longCode = bound.replace(/^const AJEDREZ_PHOTO_ATLAS_URLS:.*$/m, 'const AJEDREZ_PHOTO_ATLAS_URLS: readonly (string | null)[] = ' + JSON.stringify(longUrls)).replace(/^const AJEDREZ_PHOTO_TILES:.*$/m, 'const AJEDREZ_PHOTO_TILES: Readonly<Record<string, AjedrezPhotoTile>> = ' + JSON.stringify(longTiles)).replace(/^const AJEDREZ_PHOTO_POSES:.*$/m, 'const AJEDREZ_PHOTO_POSES: readonly AjedrezPhotoPose[] = ' + JSON.stringify(longPoses));
            if (mode === 'negative-retained') {
                assert(longCode.includes(releaseLine));
                longCode = longCode.replace(releaseLine, '                // Negativefixture deliberately keeps pastscene subscriptions.');
            }
            const boot = moduleCode(longCode).replace('window.__useComposition=useAjedrezPhotographicComposition;', 'window.__useComposition=useAjedrezPhotographicComposition;window.__photoCache=ajedrezPhotographicImages;');
            await page.addScriptTag({ content: boot });
            await page.evaluate(() => setState({ time: 10, index: 30, active: true, reduced: false, frozen: false }));
            const snapshots = [];
            for (let i = 0; i < 12; i++) {
                await page.evaluate(time => setState({ time, index: 30, active: true }), 10 + i * 2);
                await page.waitForFunction(name => snap().pose === name && snap().visible === 'visible', 'hand-cache-' + i);
                const lease = await page.evaluate(all => { const records = all.map(url => __photoCache().peek(url)).filter(Boolean); return { records: records.length, listeners: records.reduce((n, r) => n + r.listeners.size, 0), idle: records.filter(r => r.state === 'ready' && !r.listeners.size).length, loading: records.filter(r => r.state === 'loading').length, raf: __raf, video: __video, webgl: __webgl }; }, [...urls, ...longUrls]);
                snapshots.push(lease);
            }
            if (mode === 'negative-retained')
                check('negativecontrol proves oldwatches canpinmorethan6 atlases withoutpast-pose releases', snapshots.at(-1).listeners >= 12);
            else
                check('longseek across12atlasURLs retainscurrentleaseonly, boundsiidlecache andone serialwarmwithoutmediaorRAF', snapshots.every(r => r.listeners === 1 && r.idle <= 6 && r.loading <= 1 && r.raf === 0 && r.video === 0 && r.webgl === 0));
            fs.writeFileSync(out + '/cache-' + mode + '.json', JSON.stringify(snapshots, null, 2) + '\n');
        }
        const firstPose = [...poseData].sort((a, b) => a.first - b.first)[0], firstNeeded = [...new Set(firstPose.rects.map(part => rawTiles[part.tile].atlas))];
        const coldURLs = urls.map((url, i) => url + '?cold=' + i), coldCode = bound.replace(/^const AJEDREZ_PHOTO_ATLAS_URLS:.*$/m, 'const AJEDREZ_PHOTO_ATLAS_URLS: readonly (string | null)[] = ' + JSON.stringify(coldURLs));
        await page.evaluate(() => setState({ time: 0, index: 1, active: true, playing: true }));
        const coldStart = requests.length;
        await page.addScriptTag({ content: moduleCode(coldCode) });
        await page.evaluate(() => render());
        await page.waitForTimeout(40);
        check('cold intro prewarms exactly one atlas at a time while the complete native introductory scene stays visible', requests.length === coldStart + 1 && await page.evaluate(() => !document.querySelector('canvas') && snap().clockOpacity === '1' && snap().clockAria === 'false' && snap().credit === 'Independent native credit'));
        await page.evaluate(time => setState({ time, index: 2 }), firstPose.first / 24);
        check('first photo cut keeps its native fallback visible until every required source material is ready', await page.evaluate(() => (!document.querySelector('canvas') || snap().visible === 'hidden') && snap().clockOpacity === '1' && snap().backing === '0.9'));
        await page.waitForFunction(name => snap().pose === name && snap().visible === 'visible', firstPose.name);
        check('cold first photo replaces fallback only with a complete sharp composition without eagerly warming the full film', requests.length === coldStart + firstNeeded.length && await page.evaluate(() => snap().parts > 0 && snap().width >= 375 && snap().height >= 665 && snap().video === 0 && snap().webgl === 0));
        await page.evaluate(() => { __tag = 'article'; setState({ active: false, playing: false }); });
        await page.waitForFunction(name => snap().tag === 'ARTICLE' && snap().pose === name && snap().visible === 'visible', firstPose.name);
        check('paused host replacement acquires ready cache pixels without loading, Play or hover', requests.length === coldStart + firstNeeded.length && await page.evaluate(() => snap().ref && snap().parts > 0 && snap().raf === 0));
        await page.addScriptTag({ content: moduleCode(bound) });
        await page.evaluate(() => setState({ time: 985 / 24, index: 30, active: true }));
        await page.waitForFunction(() => snap().pose === 'hand-reveal-four');
        for (const [name, state] of [['Canvas', { frozen: true }], ['export', { frozen: true }], ['thumbnail', { frozen: true }], ['reduced', { frozen: false, reduced: true }]]) {
            await page.evaluate(({ name, state }) => { __target = name === 'reduced' ? 'preview' : name.toLowerCase(); setState(state); }, { name, state });
            await page.waitForTimeout(20);
            check(name + ' retainsnativeposter/copy andremovesphotographiccanvaswithoutnewrequests', await page.evaluate(() => !document.querySelector('canvas') && snap().groups === 37 && snap().backing === '0.9' && snap().video === 0 && snap().webgl === 0));
        }
        const unboundJS = ts.transpileModule(source.replace(/^const AJEDREZ_PHOTO_ATLAS_URLS:.*$/m, 'const AJEDREZ_PHOTO_ATLAS_URLS: readonly (string | null)[] = [null,null,null,null]'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText + '\nwindow.__useComposition=useAjedrezPhotographicComposition;';
        const beforeUnbound = requests.length;
        await page.addScriptTag({ content: '(()=>{' + unboundJS + '})()' });
        await page.evaluate(() => { __target = 'preview'; setState({ frozen: false, reduced: false, time: 985 / 24, index: 30, active: true }); });
        await page.waitForTimeout(80);
        check('unboundatlasURLs retainexactnativeimagefallback andmake no image requests', await page.evaluate(() => !document.querySelector('canvas') && snap().backing === '0.9') && requests.length === beforeUnbound);
        await page.evaluate(() => ReactDOM.flushSync(() => __root.unmount()));
        check('unmount releases observers, imperativesurfaces, native mutations and callerref', await page.evaluate(() => __observers.size === 0 && !document.querySelector('canvas') && __caller.current === null));
        check('noactualReact/browsererrors', errors.length === 0);
        const result = { passed: true, sourceSHA256: crypto.createHash('sha256').update(source).digest('hex'), checks, requests, errors, first: { ...first, pixels: undefined }, sourceAtlasFiles: map.atlases.map(x => ({ sha256: x.sha256, bytes: x.bytes, pixels: x.pixels ?? x.width * x.height, ownedFixture: !!x.ownedFixture })), genuineSourceMaterial: !!genuine, fixtureScope: genuine ? 'Retained original photo materials' : 'Independently generated SVG tile fixtures for reproducible lifecycle/geometry/pixel checks', framerPreviewVerified: false };
        fs.writeFileSync(out + '/result.json', JSON.stringify(result, null, 2) + '\n');
        console.log(JSON.stringify({ passed: true, checks: checks.length, requests: requests.length, source: result.sourceSHA256 }));
        await page.close();
    }
    catch (error) {
        fs.writeFileSync(out + '/failure.json', JSON.stringify({ message: String(error), checks, requests, errors }, null, 2));
        throw error;
    }
    finally {
        await browser.close();
        await new Promise(r => server.close(r));
    }
})().catch(e => { console.error(e); process.exitCode = 1; });
