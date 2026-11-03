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
const expandPoses = rows => rows.map(({placementIndices,...pose})=>({...pose,rects:placementIndices ? placementIndices.map(i=>constant('AJEDREZ_PHOTO_PLACEMENTS')[i]) : pose.rects}));
const declaredPoses = expandPoses(constant('AJEDREZ_PHOTO_POSES')), metadataAware = declaredPoses.some(pose=>Array.isArray(pose.observedFields)), cssColor = hex => 'rgb(' + [1,3,5].map(offset=>Number.parseInt(hex.slice(offset,offset+2),16)).join(', ') + ')';
const nativeRecipePath=process.env.MONARCHIC_AJEDREZ_NATIVE_RECIPE_PATH ?? path.join(repo,'docs/design-studies/code-components/assets/source-ajedrez-native-photo-coupling.json');
const nativeRecipe=fs.existsSync(nativeRecipePath)?JSON.parse(fs.readFileSync(nativeRecipePath)):{rows:[]};
const genuine = process.env.MONARCHIC_AJEDREZ_ATLAS_DIR;
const map = genuine ? JSON.parse(fs.readFileSync(process.env.MONARCHIC_AJEDREZ_MATERIAL_MAP_PATH ?? path.join(genuine, 'material-map.json'))) : { tiles: Object.entries(declaredTiles).map(([key, tile]) => ({ key, ...tile })), atlases: declaredURLs.map((_, index) => { const tiles = Object.values(declaredTiles).filter(tile => tile.atlas === index); return { width: Math.max(1, ...tiles.map(tile => tile.rect[0] + tile.rect[2] + 2)), height: Math.max(1, ...tiles.map(tile => tile.rect[1] + tile.rect[3] + 2)), ownedFixture: true }; }) };
function ownedAtlas(index) {
    const item = map.atlases[index], tiles = Object.entries(declaredTiles).filter(([, tile]) => tile.atlas === index);
    const parts = tiles.map(([key, tile], j) => { const [x, y, w, h] = tile.rect, seed = parseInt(crypto.createHash('sha256').update(key).digest('hex').slice(0, 6), 16), color = [60 + seed % 150, 50 + (seed >>> 8) % 150, 40 + (seed >>> 16) % 150]; return '<g><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="rgb(' + color.join(',') + ')"/><path d="M' + x + ' ' + y + 'L' + (x + w) + ' ' + (y + h) + 'M' + (x + w) + ' ' + y + 'L' + x + ' ' + (y + h) + '" stroke="#eee" stroke-width="3"/><rect x="' + (x + 5) + '" y="' + (y + 5) + '" width="' + Math.max(1, w - 10) + '" height="' + Math.max(1, h - 10) + '" fill="url(#owned-grid)" opacity=".8"/></g>'; }).join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + item.width + '" height="' + item.height + '"><defs><pattern id="owned-grid" width="13" height="13" patternUnits="userSpaceOnUse"><path d="M0 0H13V13" fill="none" stroke="#171717" stroke-width="2"/></pattern></defs>' + parts + '</svg>';
}
const checks = [], requests = [], errors = [], failedOnce = new Set(), requestLog = [], heldResponses = [], check = (name, ok) => { assert.ok(ok, name); checks.push(name); };
let activeRequests = 0;
const atlasFor=Object.fromEntries(map.tiles.map(tile=>[tile.key,tile.atlas]));
const cutProbeFrames=declaredPoses.flatMap(pose=>[pose.first,pose.last,pose.first-19.2].flatMap(frame=>[frame-1e-5,frame,frame+1e-5])).filter(frame=>frame>=0);
const earliestPose=declaredPoses.reduce((a,b)=>a.first<b.first?a:b,declaredPoses[0]);
let maxWarmAtlases=0;for(const frame of cutProbeFrames){const wanted=declaredPoses.filter(pose=>frame>=pose.first&&frame<pose.last||pose.first>frame&&pose.first-frame<=19.2);if(frame<earliestPose.first)wanted.push(earliestPose);maxWarmAtlases=Math.max(maxWarmAtlases,new Set(wanted.flatMap(pose=>pose.rects.map(part=>atlasFor[part.tile]))).size)}
check('complete cut-boundary and fractional imminent-pose atlas union fits the six-resident cache, including first-intro prewarm',maxWarmAtlases<=6&&declaredPoses.every(pose=>new Set(pose.rects.map(part=>atlasFor[part.tile])).size<=3));
if(metadataAware){check('finite native plan has unique editable IDs, observed source captions, no invented catalog footer and known in-place caption updates',nativeRecipe.rows.length===238&&nativeRecipe.rows.filter(row=>row.type==='RichTextNode').length===128&&new Set(nativeRecipe.rows.map(row=>row.layout+':'+row.key)).size===238&&nativeRecipe.rows.every(row=>!row.key.endsWith('-source-museum-catalog-footer'))&&nativeRecipe.updates.length===2)}

const heldWaiters = new Map();
const waitForHeld = url => new Promise((resolve, reject) => {
    const present = heldResponses.find(item => item.url === url); if (present) { resolve(present); return; }
    const timer = setTimeout(() => { heldWaiters.delete(url); reject(new Error('No held source request: ' + url)); }, 5000);
    heldWaiters.set(url, item => { clearTimeout(timer); resolve(item); });
});
const server = http.createServer((req, res) => { const i = Number(new URL(req.url, 'http://127.0.0.1').pathname.split('/').at(-1)); if (!Number.isInteger(i) || !map.atlases[i]) {
    res.writeHead(404);
    res.end();
    return;
} requests.push(i); const log = { url: req.url, activeAtStart: ++activeRequests }; requestLog.push(log); let ended = false; const end = () => { if (!ended) { ended = true; activeRequests--; } }; res.once('finish', end); res.once('close', end); const requestURL = new URL(req.url, 'http://127.0.0.1'); if (requestURL.searchParams.has('fail-once') && !failedOnce.has(req.url)) { failedOnce.add(req.url); res.writeHead(503); res.end(); return; } const send = () => { if (res.destroyed) return; res.writeHead(200, { 'Content-Type': genuine ? 'image/webp' : 'image/svg+xml', 'Access-Control-Allow-Origin': '*' }); if (genuine) fs.createReadStream(map.atlases[i].path).pipe(res); else res.end(ownedAtlas(i)); }; if (requestURL.searchParams.has('hold')) { const item = { url: req.url, send }; heldResponses.push(item); heldWaiters.get(req.url)?.(item); heldWaiters.delete(req.url); } else if (requestURL.searchParams.has('cold')) setTimeout(send, 160); else send(); });
(async () => {
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const urls = map.atlases.map((_, i) => 'http://127.0.0.1:' + server.address().port + '/' + i), bound = source.replace(/^const AJEDREZ_PHOTO_ATLAS_URLS:.*$/m, 'const AJEDREZ_PHOTO_ATLAS_URLS: readonly (string | null)[] = ' + JSON.stringify(urls)), js = ts.transpileModule(bound, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText + '\nwindow.__useComposition=useAjedrezPhotographicComposition;window.__photoPose=ajedrezPhotoPose;window.__photoIndex=indexAt;', react = fs.readFileSync(repo + '/node_modules/react/umd/react.development.js', 'utf8'), dom = fs.readFileSync(repo + '/node_modules/react-dom/umd/react-dom.development.js', 'utf8');
    const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] });
    try {
        const page = await browser.newPage({ viewport: { width: 1200, height: 950 }, deviceScaleFactor: 1 });
        page.on('pageerror', e => errors.push(e.message));
        await page.setContent('<style>*{box-sizing:border-box}body{margin:0;background:#fff;font-family:monospace}p{margin:0}#zoom{transform-origin:top left}</style><div id="zoom"><div id="root"></div></div>');
        await page.addScriptTag({ content: react });
        await page.addScriptTag({ content: dom });
        await page.evaluate(() => { window.__target = 'preview'; window.exports = {}; window.require = n => n === 'react' ? window.React : { RenderTarget: { canvas: 'canvas', export: 'export', thumbnail: 'thumbnail', current: () => __target }, useIsStaticRenderer: () => __target !== 'preview' }; window.__rasterCrops=0;window.__unrasteredCrops=0;const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(args.length===8){if(image instanceof HTMLCanvasElement&&image.dataset.sourceAjedrezAtlasRaster==='true')__rasterCrops++;else __unrasteredCrops++}return draw.call(this,image,...args)};window.__raf = 0; window.__video = 0; window.__webgl = 0; window.__observers = new Set(); const raf = window.requestAnimationFrame; window.requestAnimationFrame = function (f) { __raf++; return raf.call(this, f); }; const create = document.createElement.bind(document); document.createElement = function (name, ...rest) { if (name === 'video')
            __video++; return create(name, ...rest); }; const get = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (name, ...rest) { if (name.includes('webgl'))
            __webgl++; return get.call(this, name, ...rest); }; for (const name of ['ResizeObserver', 'MutationObserver']) {
            const Original = window[name];
            window[name] = class extends Original {
                constructor(fn) { super(fn); __observers.add(this); }
                disconnect() { super.disconnect(); __observers.delete(this); }
            };
        } });
        await page.evaluate(({rows,aware})=>{window.__nativeRows=rows;window.__metadataAware=aware},{rows:nativeRecipe.rows,aware:metadataAware});
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
                function text(name, content, left, top, width, opacity = 1, font = 5) { return E('div', { 'data-framer-name': name, key: name, style: { position: 'absolute', left: left * sx, top: top * sy, width: width * sx, height: 'auto', fontSize: font, lineHeight: (font + 2) + 'px', whiteSpace: 'pre-wrap', color: '#202724', opacity } }, E('p', null, content)); }
                const rows=window.__nativeRows.filter(row=>row.layout===(__width===375?'phone':'desktop')&&(/source-museum-catalog|source-guides|^source-meta-|film-source-observed-annotations/.test(row.key)));
                function nativeChildren(parentKey) { return rows.filter(row=>row.parentKey===parentKey).map(row=>{
                    const a=row.attrs,style={position:a.position,left:a.left,top:a.top,width:a.width,height:a.height,opacity:a.opacity,overflow:a.overflow,background:a.fill,color:a.textColor,fontSize:a.fontSize,lineHeight:a.lineHeight,fontWeight:a.fontWeight,textAlign:a.textAlignment};
                    return E('div',{'data-framer-name':row.key,key:row.key,style},a.text!==undefined?E('p',null,a.text):null,...nativeChildren(row.key));
                }) }
                const groups = Array.from({ length: 37 }, (_, i) => { const n = String(i + 1).padStart(2, '0'), prefix = 'HERO-002 / film-phase-' + n; const bodyKey = i === 29 ? 'sentence' : 'opening'; const fields = [E('div', { 'data-framer-name': prefix + '-' + (({18:'object',19:'horse-0',20:'clean-detail',21:'sheet',23:'object',24:'figure-0',26:'hall-0',30:'hand-0',34:'globe'})[i] ?? 'photo-0'), 'data-backing': true, key: 'photo', style: { position: 'absolute', left: 0, top: 275, width: 233, height: 164, background: i === 15 ? 'transparent' : '#ff00ff', opacity: .9 } }), text(prefix + '-credit', 'Independent native credit', 12, 12, 240), text(prefix + '-index', 'NATIVE INDEX', 406, 12, 62), text(prefix + '-record', 'Independent native footer', 12, 831, 370), ...([2, 3, 29, 33].includes(i) ? [text(prefix + '-' + bodyKey, 'Independent chapter copy remains editable.', i === 29 ? 18 : 74, i === 29 ? 393 : 356, i === 29 ? 650 : 230, .75, i === 29 ? 24 : 11)] : [])]; const captions = []; if ([18,23].includes(i)) { fields.push(...Array.from({length:18},(_,n)=>E('div',{'data-framer-name':prefix+'-index-rule-'+n,key:'old-rule-'+n,style:{position:'absolute',left:18*sx,top:(30+n*11)*sy,width:444*sx,height:.4,background:'#202724'}}))); for(const col of ['no','kind','record','series']) fields.push(text(prefix+'-index-'+col+'-0','OLD GENERIC '+col,18,31,50)); } fields.push(...nativeChildren('film-phase-'+n)); if (i === 15) fields.push(text(prefix + '-title', 'Independent native title', 185, 348, 220, 1, 7), text(prefix + '-poem', 'Independent native study paragraph.', 185, 357, 250, 1, 7)); if (i === 20) fields.push(...Array.from({length:15}, (_, n) => text(prefix + '-word-' + n, ['tablero','pieza','casilla','turno','borde','centro','sombra','línea','ritmo','memoria','posición','paso','tiempo','forma','orden'][n], 18 + n % 4 * 116, 218 + Math.floor(n / 4) * 74, 110, 1, 7))); if (i === 21) captions.push(text(prefix + '-source-contact-credit', 'TIPOLOGÍA · 112 PIEZAS · MUSEOS EN ACCESO ABIERTO', 18, 826, 400, 0, 4)); if (i === 24) captions.push(text(prefix + '-source-figure-label', 'ARCHIVAL FIGURE', 182, 400, 60, 0), text(prefix + '-source-figure-body', 'Independent figure-study copy.', 196, 320, 110, 0)); if (i === 32) { fields.push(...Array.from({length:8},(_,n)=>text(prefix + '-caption-' + n, 'Independent photo label ' + n, 46 + n % 2 * 193, 163 + Math.floor(n / 2) * 210, 180))); captions.push(E('div', {'data-framer-name':prefix+'-source-index-chart',key:'source-index-chart',style:{position:'absolute',left:350*sx,top:5*sy,width:125*sx,height:130*sy,opacity:0}}, text(prefix+'-source-index-chart-heading','ARCHIVE CATALOGUE',76,32,33,1,3.25))); } if (i === 29 || i === 30)
                    captions.push(text(prefix + '-photo-hand-catalog', 'EADWEARD MUYBRIDGE / Animal Locomotion,1887', 342, 205, 130, 0)); if (i === 30)
                    captions.push(text(prefix + '-photo-hand-line', 'Independent chapter copy remains editable.', 34, 615, 420, 0)); if (i === 33)
                    captions.push(text(prefix + '-photo-earth-caption', '47 / ARCHIVAL FILM MATERIAL', 114, 558, 320, 0)); if (i === 34)
                    fields.push(text(prefix + '-caption', '47 / ARCHIVAL FILM MATERIAL', 114, 558, 320)); const contents = [18,23,33].includes(i) ? [E('div', { 'data-framer-name': prefix, key: 'opaque-inner', style: { position: 'absolute', inset: 0, background: '#bbc4c1', opacity: [18,23].includes(i) ? 0 : 1, transform: 'translateX(0)' } }, ...fields)] : fields; return E('div', { 'data-source-ajedrez-group': i + 1, 'aria-hidden': i !== __state.index, key: i, style: { position: 'absolute', inset: 0, width: '100%', height: '100%', background: i === 34 ? '#1f2120' : '#bbc4c1', opacity: i === __state.index ? 1 : 0, visibility: i === __state.index ? 'visible' : 'hidden' } }, ...contents, ...captions); });
                return E(__tag, { ref: bind, id: 'film', style: { position: 'relative', width: __width, height: __width * 852 / 480, background: '#bbc4c1' } }, ...groups,...nativeChildren('film-view'));
            }
            window.__root = ReactDOM.createRoot(document.getElementById('root'));
            window.render = () => ReactDOM.flushSync(() => __root.render(E(Preview)));
            window.setState = patch => { __state = { ...__state, ...patch }; render(); };
            window.snap = () => { const film = document.getElementById('film'), s = film.querySelector('canvas'), clockGroup = film.querySelector('[data-source-ajedrez-group="' + (__state.index + 1) + '"]'), group = s?.style.visibility === 'visible' ? s.parentElement : clockGroup, native = group.querySelector('[data-backing]'), nativeText = group.querySelector('[data-framer-name$="credit"]'); return { groups: film.querySelectorAll('[data-source-ajedrez-group]').length, ref: __caller.current === film, tag: film.tagName, width: s?.width, height: s?.height, visible: s?.style.visibility, pose: s?.dataset.sourceAjedrezPhotoPose, sourceFrame: Number(s?.dataset.sourceAjedrezPhotoSourceFrame), parts: Number(s?.dataset.sourceAjedrezPhotoCount), pixels: s?.toDataURL(), backing: native.style.opacity, credit: nativeText.textContent, creditZ: nativeText.style.zIndex, visualGroup: Number(group.closest('[data-source-ajedrez-group]').dataset.sourceAjedrezGroup), visualAria: group.closest('[data-source-ajedrez-group]').getAttribute('aria-hidden'), clockAria: clockGroup.getAttribute('aria-hidden'), clockOpacity: clockGroup.style.opacity, bodyOpacity: group.querySelector('[data-framer-name$="-sentence"],[data-framer-name$="-opening"]')?.style.opacity, bodyLeft: group.querySelector('[data-framer-name$="-sentence"],[data-framer-name$="-opening"]')?.style.left, bodyTop: group.querySelector('[data-framer-name$="-sentence"],[data-framer-name$="-opening"]')?.style.top, bodyFont: group.querySelector('[data-framer-name$="-sentence"],[data-framer-name$="-opening"]')?.style.fontSize, captionOpacity: group.querySelector('[data-framer-name*="photo-hand-catalog"],[data-framer-name*="photo-earth-caption"]')?.style.opacity, background: getComputedStyle(group).backgroundColor, nestedBackground: group.querySelector('[data-framer-name$="film-phase-34"]') && getComputedStyle(group.querySelector('[data-framer-name$="film-phase-34"]')).backgroundColor, creditColor: getComputedStyle(nativeText.querySelector('p')).color, edgeTop: s && s.getContext('2d').getImageData(Math.floor(s.width * 20 / 480), Math.floor(s.height * 5 / 852), 1, 1).data[3], edgeBottom: s && s.getContext('2d').getImageData(Math.floor(s.width * 20 / 480), Math.floor(s.height * 845 / 852), 1, 1).data[3], observers: __observers.size, raf: __raf, video: __video, webgl: __webgl }; };
            render();
        });
        await page.waitForFunction(() => snap().pose === 'hand-reveal-four' && snap().visible === 'visible');
        let first = await page.evaluate(() => snap());
        check('genuine photographic tiles render via one2D surface while37 native groups, independent copy and caller ref remain', first.groups === 37 && first.parts === 12 && first.ref && first.credit === 'Independent native credit' && first.backing === '0' && (metadataAware?first.creditZ==='':first.creditZ==='2'));
        check('photo composition creates no ownRAF, video decoder or WebGL context', first.raf === 0 && first.video === 0 && first.webgl === 0);
        check('production photo crops use admitted intrinsic raster sources rather than direct fractional SVG images',await page.evaluate(()=>__rasterCrops>0&&__unrasteredCrops===0));
        const imagesSeen = requests.length;
        await page.evaluate(() => setState({ time: 984 / 24 }));
        await page.waitForFunction(() => snap().pose === 'hand-reveal-three');
        const beforeCut = await page.evaluate(() => snap());
        await page.evaluate(() => setState({ time: 985 / 24 }));
        await page.waitForFunction(() => snap().pose === 'hand-reveal-four');
        const afterCut = await page.evaluate(() => snap());
        check('exact source985 hard cut reveals fourth hand photograph instead of a globalfade orinterpolatedcamera', beforeCut.parts === 9 && afterCut.parts === 12 && beforeCut.pixels !== afterCut.pixels && afterCut.sourceFrame === 985);
        check('full sourcephotographic repeats reach topandbottom edges while nativecredits remain above material', afterCut.edgeTop === 255 && afterCut.edgeBottom === 255 && (metadataAware?afterCut.creditZ==='':afterCut.creditZ==='2') && afterCut.captionOpacity === '1');
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
        check('roomcut preserves original inline labels as editable nodes and applies source annotation visibility', await page.evaluate(() => snap().visualGroup === 5 && snap().visualAria === 'false' && snap().clockAria === 'true' && snap().clockOpacity === '0' && snap().credit === 'Independent native credit' && (__metadataAware?snap().creditZ==='':snap().creditZ==='2')));
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
        const earthData=declaredPoses.find(pose=>pose.name==='earth');
        check('Earthprefix uses sampled source field, original scene routing and source-observed annotations',earth.background===cssColor(earthData.sourceBackgroundColor??'#1f2120')&&earth.visualGroup===35&&earth.visualAria==='false'&&earth.clockAria==='true'&&earth.clockOpacity==='0'&&(metadataAware||earth.creditColor==='rgb(193, 202, 198)'));
        await page.screenshot({ path: out + '/earth-prefix-full-composition.png' });
        await page.evaluate(() => setState({ time: 1115 / 24 }));
        const beforeEarth = await page.evaluate(() => snap());
        check('reverseEarthcut restoresnativevariantbackground, scatteredcopyandmetadata ink', beforeEarth.background === 'rgb(187, 196, 193)' && beforeEarth.nestedBackground === 'rgb(187, 196, 193)' && beforeEarth.bodyOpacity === '0.75' && beforeEarth.creditColor === 'rgb(32, 39, 36)' && beforeEarth.clockAria === 'false' && beforeEarth.clockOpacity === '1' && await page.evaluate(() => { const scene = document.querySelector('[data-source-ajedrez-group="35"]'); return scene.getAttribute('aria-hidden') === 'true' && scene.style.opacity === '0' && scene.style.visibility === 'hidden'; }));
        await page.screenshot({ path: out + '/room-source-material.png' });
        await page.evaluate(() => setState({ time: 985 / 24, index: 30, active: true, playing: true }));
        await page.waitForFunction(() => snap().pose === 'hand-reveal-four' && snap().visible === 'visible');
        const poseLine = bound.match(/^const AJEDREZ_PHOTO_POSES:.*$/m)[0], poseData = expandPoses(JSON.parse(poseLine.slice(poseLine.indexOf(' = ') + 3))), swapData = JSON.parse(JSON.stringify(poseData));
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
            for (let i = 0; i < (mode === 'negative-retained' ? 6 : 12); i++) {
                await page.evaluate(time => setState({ time, index: 30, active: true }), 10 + i * 2);
                await page.waitForFunction(name => snap().pose === name && snap().visible === 'visible', 'hand-cache-' + i);
                const lease = await page.evaluate(all => { const records = all.map(url => __photoCache().peek(url)).filter(Boolean); return { records: records.length, listeners: records.reduce((n, r) => n + r.listeners.size, 0), idle: records.filter(r => r.state === 'ready' && !r.listeners.size).length, loading: records.filter(r => r.state === 'loading').length, raf: __raf, video: __video, webgl: __webgl }; }, [...urls, ...longUrls]);
                snapshots.push(lease);
            }
            if (mode === 'negative-retained') {
                await page.evaluate(() => setState({time:22,index:30,active:true}));
                await page.waitForFunction(url => __photoCache().peek(url)?.state === 'queued',longUrls[6]);
                check('negativecontrol shows retained past-pose watches stall later source admission at the six-resident limit',await page.evaluate(all=>{const records=all.map(url=>__photoCache().peek(url)).filter(Boolean);return records.reduce((n,r)=>n+r.listeners.size,0)>=7&&records.filter(r=>r.raster?.width>1).length<=6},longUrls));
            }
            else
                check('longseek across12atlasURLs retainscurrentleaseonly, boundsiidlecache andone serialwarmwithoutmediaorRAF', snapshots.every(r => r.listeners === 1 && r.idle <= 6 && r.loading <= 1 && r.raf === 0 && r.video === 0 && r.webgl === 0));
            fs.writeFileSync(out + '/cache-' + mode + '.json', JSON.stringify(snapshots, null, 2) + '\n');
        }
        const firstPose = [...poseData].sort((a, b) => a.first - b.first)[0], firstNeeded = [...new Set(poseData.filter(p => p === firstPose || p.first / 24 > firstPose.first / 24 && (p.first - firstPose.first) / 24 <= .8).flatMap(p => p.rects.map(part => rawTiles[part.tile].atlas)))];
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
        check('cold first photo replaces fallback only with a complete sharp composition without eagerly warming the full film', requests.length <= coldStart + firstNeeded.length && await page.evaluate(() => snap().parts > 0 && snap().width >= 375 && snap().height >= 665 && snap().video === 0 && snap().webgl === 0));
        const beforePausedHost = requests.length;
        await page.evaluate(() => { __tag = 'article'; setState({ active: false, playing: false }); });
        await page.waitForFunction(name => snap().tag === 'ARTICLE' && snap().pose === name && snap().visible === 'visible', firstPose.name);
        check('paused host replacement acquires ready cache pixels without loading, Play or hover', requests.length === beforePausedHost && await page.evaluate(() => snap().ref && snap().parts > 0 && snap().raf === 0));
        await page.addScriptTag({ content: moduleCode(bound) });
        const traversal = [];
        for (const pose of poseData) {
            await page.evaluate(time => setState({ time, index: __photoIndex(time), active: true, playing: true }), pose.first / 24);
            await page.waitForFunction(name => snap().pose === name && snap().visible === 'visible', pose.name);
            const row = await page.evaluate(() => {
                const canvas = document.querySelector('canvas'), group = canvas.closest('[data-source-ajedrez-group]'), root = canvas.parentElement;
                const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
                let opaqueSamples = 0, variation = 0, prior = 0;
                for (let i = 0; i < pixels.length; i += 4 * 43) { opaqueSamples += pixels[i + 3] > 0 ? 1 : 0; variation += Math.abs(pixels[i] - prior); prior = pixels[i]; }
                return { name: canvas.dataset.sourceAjedrezPhotoPose, frame: Number(canvas.dataset.sourceAjedrezPhotoSourceFrame), group: Number(group.dataset.sourceAjedrezGroup) - 1, aria: group.getAttribute('aria-hidden'), rootOpacity: getComputedStyle(root).opacity, background: getComputedStyle(root).backgroundColor, width: canvas.width, height: canvas.height, opaqueSamples, variation, canvases: document.querySelectorAll('canvas').length, raf: __raf, video: __video, webgl: __webgl };
            });
            assert.equal(row.frame, pose.first, 'exact source frame ' + pose.name);
            assert.equal(row.group, pose.renderNativePhaseIndex ?? pose.nativePhaseIndex ?? (pose.name.startsWith('hand-') ? 30 : pose.name.startsWith('tournament-') ? 26 : pose.name === 'earth' ? 34 : 4), 'source-corresponding native group ' + pose.name);
            if(pose.sourceBackgroundColor) assert.equal(row.background,cssColor(pose.sourceBackgroundColor),'sampled original margin color '+pose.name);
            assert(row.opaqueSamples > 0 && row.variation > 0 && row.width >= 375 && row.width * row.height <= 2000000 && row.rootOpacity === '1' && row.aria === 'false' && row.canvases === 1 && row.raf === 0 && row.video === 0 && row.webgl === 0, 'sharp complete source pose ' + pose.name);
            traversal.push(row);
        }
        check('every mapped photographic cut renders sharp source material in its own native scene without an extra decoder or clock', traversal.length === poseData.length);
        fs.writeFileSync(out + '/all-pose-traversal.json', JSON.stringify(traversal, null, 2) + '\n');
        const horsePoses = poseData.filter(pose => pose.sceneKey === 'horse-build');
        if (horsePoses.length > 1) {
            const firstHorse = horsePoses[0], lastHorse = horsePoses.at(-1), pixelsAt = async pose => {
                await page.evaluate(time => setState({ time, index: __photoIndex(time), active: true, playing: true }), pose.first / 24);
                await page.waitForFunction(name => snap().pose === name && snap().visible === 'visible', pose.name);
                return page.evaluate(() => snap().pixels);
            };
            const firstPixels = await pixelsAt(firstHorse), lastPixels = await pixelsAt(lastHorse);
            check('observed source horse construction develops across its full sequence rather than holding its first photograph', firstPixels !== lastPixels);
            const heldHorse = poseData.map(pose => pose.sceneKey === 'horse-build' ? { ...pose, rects: firstHorse.rects } : pose);
            await page.addScriptTag({ content: moduleCode(bound.replace(poseLine, poseLine.slice(0, poseLine.indexOf(' = ') + 3) + JSON.stringify(heldHorse))) });
            await page.evaluate(() => render());
            const negativeFirst = await pixelsAt(firstHorse), negativeLast = await pixelsAt(lastHorse);
            check('negative source-motion fixture reproduces the missing build when successive horse compositions are frozen', negativeFirst === negativeLast && negativeLast !== lastPixels);
            await page.addScriptTag({ content: moduleCode(bound) });
            await page.evaluate(() => render());
            check('restoring the observed cut map restores the full horse build without Play or hover', await pixelsAt(lastHorse) === lastPixels);
            await page.evaluate(() => setState({ time: 573 / 24, index: __photoIndex(573 / 24), active: true, playing: true }));
            await page.waitForFunction(() => snap().pose === 'sculpture-unoccluded' && snap().visible === 'visible');
            check('sculpture retains independently editable native words in the source occlusion areas above genuine photo pixels', await page.evaluate(() => {
                const group = document.querySelector('[data-source-ajedrez-group="21"]'), words = [...group.querySelectorAll('[data-framer-name]')].filter(node => /film-phase-21-word-\d+$/.test(node.dataset.framerName));
                return words.filter(node => node.style.opacity === '1').length === 12 && words.filter(node => node.style.opacity === '0').length === 3 && words[0].textContent === 'tablero' && Math.abs(parseFloat(words[0].style.left) * 480 / 100 - 127) < .01 && Math.abs(parseFloat(words[0].style.top) * 852 / 100 - 208) < .01 && getComputedStyle(group).backgroundImage.includes('linear-gradient');
            }));
            await page.evaluate(() => setState({ time: 572 / 24, index: __photoIndex(572 / 24) }));
            await page.waitForFunction(() => snap().pose !== 'sculpture-unoccluded');
            fs.writeFileSync(out + '/sculpture-reverse-state.json', JSON.stringify(await page.evaluate(() => { const group = document.querySelector('[data-source-ajedrez-group="21"]'), word = group.querySelector('[data-framer-name$="word-0"]'); return { group: group.style.cssText, word: word.style.cssText, copy: word.textContent }; }), null, 2) + '\n');
            check('reverse sculpture cut restores every old word position and original native background without replacing its copy', await page.evaluate(() => {
                const group = document.querySelector('[data-source-ajedrez-group="21"]'), word = group.querySelector('[data-framer-name$="word-0"]');
                return Math.abs(parseFloat(word.style.left) - 14.0625) < .01 && Math.abs(parseFloat(word.style.top) - 170.3125) < .01 && word.style.opacity === '1' && word.textContent === 'tablero' && getComputedStyle(group).backgroundImage === 'none' && getComputedStyle(group).backgroundColor === 'rgb(187, 196, 193)';
            }));
            await page.evaluate(() => setState({ time: 1017 / 24, index: __photoIndex(1017 / 24) }));
            await page.waitForFunction(() => snap().pose === 'editorial-montage-0-1017');
            check('a partial editorial build shows only the native label for the revealed photograph', await page.evaluate(() => {
                const group = document.querySelector('[data-source-ajedrez-group="33"]'), labels = [...group.querySelectorAll('[data-framer-name]')].filter(node => /film-phase-33-caption-\d+$/.test(node.dataset.framerName));
                return __metadataAware ? labels.every(node=>node.style.opacity==='0') && document.querySelector('[data-framer-name="source-meta-label-montage-0-portrait"]').textContent==='IMG. 24' && document.querySelector('[data-framer-name="source-meta-label-montage-0-portrait"]').style.opacity==='1' : labels.filter(node => node.style.opacity === '1').length === 1 && labels.filter(node => node.style.opacity === '0').length === 7 && labels[0].textContent === 'Independent photo label 0' && labels[0].style.left === '5%';
            }));
            await page.evaluate(() => setState({ time: 1047 / 24, index: __photoIndex(1047 / 24) }));
            await page.waitForFunction(() => snap().pose === 'editorial-montage-1-1047');
            check('the source index-chart interval activates native geometry behind photo material in its own stacking context', await page.evaluate(() => { const chart = document.querySelector('[data-framer-name$="film-phase-33-source-index-chart"]'); return chart.style.opacity === '1' && chart.style.zIndex === '0' && chart.querySelector('p').textContent === 'ARCHIVE CATALOGUE' && document.querySelector('canvas').style.zIndex === '1'; }));
            await page.evaluate(() => setState({ time: 1062 / 24, index: __photoIndex(1062 / 24) }));
            check('leaving the source chart interval restores the authored hidden chart and original caption styles', await page.evaluate(() => { const chart = document.querySelector('[data-framer-name$="film-phase-33-source-index-chart"]'), label = document.querySelector('[data-framer-name$="film-phase-33-caption-0"]'); return chart.style.opacity === '0' && !chart.style.zIndex && label.style.left === '35.9375px' && label.style.opacity === '1'; }));
            check('the observed photo-to-column cut routes existing editable paragraph copy instead of leaving the old gallery payload visible', await page.evaluate(() => { const group = document.querySelector('[data-source-ajedrez-group="16"]'), poem = group.querySelector('[data-framer-name$="film-phase-16-poem"]'), old = document.querySelector('[data-source-ajedrez-group="33"]'); return group.style.opacity === '1' && group.getAttribute('aria-hidden') === 'false' && old.style.opacity === '0' && poem.textContent === 'Independent native study paragraph.' && Math.abs(parseFloat(poem.style.left) * 480 / 100 - 352) < .01 && Math.abs(parseFloat(poem.style.width) * 480 / 100 - 110) < .01 && getComputedStyle(group).backgroundColor === 'rgb(179, 186, 183)'; }));
            await page.evaluate(() => setState({ time: 1069 / 24, index: __photoIndex(1069 / 24) }));
            await page.waitForFunction(() => snap().pose === 'editorial-montage-2-1069' && snap().visible === 'visible');
            check('the next observed photo cut restores the previous paragraph geometry and native aria state', await page.evaluate(() => { const group = document.querySelector('[data-source-ajedrez-group="16"]'), poem = group.querySelector('[data-framer-name$="film-phase-16-poem"]'); return group.style.opacity === '0' && group.getAttribute('aria-hidden') === 'true' && Math.abs(parseFloat(poem.style.left) - 144.53125) < .01 && Math.abs(parseFloat(poem.style.top) - 278.90625) < .01 && Math.abs(parseFloat(poem.style.width) - 195.3125) < .01; }));
            await page.evaluate(() => setState({ time: 1143 / 24, index: __photoIndex(1143 / 24) }));
            check('the final Earth-to-column cut uses the second observed paper tone and retains native independent copy', await page.evaluate(() => { const group = document.querySelector('[data-source-ajedrez-group="16"]'), earth = document.querySelector('[data-source-ajedrez-group="35"]'); return group.style.opacity === '1' && earth.style.opacity === '0' && getComputedStyle(group).backgroundColor === 'rgb(178, 185, 182)' && group.querySelector('[data-framer-name$="film-phase-16-poem"]').textContent === 'Independent native study paragraph.'; }));
        }
        if(metadataAware) {
            const visibleSourceFields=()=>page.evaluate(()=>{const root=document.querySelector('[data-framer-name="film-source-observed-annotations"]');return root?.style.opacity==='1'?[...root.querySelectorAll('[data-framer-name]')].filter(node=>node.style.opacity==='1').map(node=>node.textContent):[]});
            for(const [frame,war,game] of [[1031,true,false],[1041,true,false],[1042,true,true],[1062,false,false]]) {await page.evaluate(frame=>setState({time:frame/24,index:__photoIndex(frame/24),active:true}),frame);if(frame!==1062)await page.waitForFunction(()=>snap().visible==='visible');const facts=await visibleSourceFields();assert.equal(facts.some(t=>t.includes('Roger Fenton')),war,'source war-credit onset '+frame);assert.equal(facts.some(t=>t.includes('George Eastman Museum')),game,'source game-credit onset '+frame)}
            check('observed provenance paragraphs appear at1031 and1042 and leave at1062 with the source montage, not an arbitrary late row',true);
            const handFields=[];
            for(const [frame,count] of [[967,4],[973,3],[979,2],[985,1]]) {
                await page.evaluate(frame=>setState({time:frame/24,index:__photoIndex(frame/24),active:true}),frame);
                await page.waitForFunction(()=>snap().visible==='visible');
                const fields=(await visibleSourceFields()).filter(Boolean);assert.equal(fields.length,count,'source progressive hand metadata at '+frame);assert(fields.includes('AJEDREZ'));handFields.push({frame,fields});
                assert(await page.evaluate(()=>[...document.querySelector('[data-source-ajedrez-group="31"]').querySelectorAll('[data-framer-name]')].filter(n=>/-(credit|index|record|bottom-rule)$/.test(n.dataset.framerName)).every(n=>n.style.opacity==='0')));
            }
            check('source hand photographs progressively cover chapter, bibliography and word counter while editable original study labels remain hidden',handFields[0].fields.some(t=>t==='PALABRA 64 DE 85')&&handFields[0].fields.some(t=>t.includes('EMECÉ'))&&handFields[3].fields[0]==='AJEDREZ');
            await page.evaluate(()=>setState({time:1116/24,index:__photoIndex(1116/24),active:true}));await page.waitForFunction(()=>snap().pose==='earth'&&snap().visible==='visible');
            const earthFields=await visibleSourceFields();
            check('Earth displays its observed factual ATS/Apolo credit without generic AJEDREZ header or archival placeholder',earthFields.length===1&&earthFields[0].includes('ATS-3')&&earthFields[0].includes('AS17-148-22727')&&await page.evaluate(()=>document.querySelector('[data-framer-name$="film-phase-35-caption"]').style.opacity==='0'));
            for(const [frame,phase,row] of [[525,19,0],[526,19,0],[527,19,1],[547,19,11],[632,24,0],[647,24,7],[662,24,18],[679,24,26]]) {
                await page.evaluate(frame=>setState({time:frame/24,index:__photoIndex(frame/24),active:true}),frame);await page.waitForFunction(()=>snap().visible==='visible');
                const result=await page.evaluate(({phase})=>{const group=document.querySelector('[data-source-ajedrez-group="'+phase+'"]'),root=group.querySelector('[data-framer-name$="source-museum-catalog"]'),body=root.querySelector('[data-framer-name$="-body-0"]'),clip=root.querySelector('[data-framer-name$="-body-clip"]');return{opacity:root.style.opacity,top:parseFloat(body.style.top),scale:group.clientHeight/852,clipOverflow:clip.style.overflow,old:[...group.querySelectorAll('[data-framer-name]')].filter(n=>/index-(no|kind|record|series)-\d+$/.test(n.dataset.framerName)).every(n=>n.style.opacity==='0'),rule:parseFloat(group.querySelector('[data-framer-name$="index-rule-0"]').style.top),text:body.textContent}}, {phase});
                assert(result.opacity==='1'&&Math.abs(result.top-(4-row*7.1)*result.scale)<.02&&result.old&&result.clipOverflow==='hidden','fixed-grid integer catalog window at '+frame);
            }
            check('source museum catalogs advance whole factual rows once per two frames through the shared list and preserve editable columns/rules',true);
            await page.evaluate(()=>setState({time:631/24,index:__photoIndex(631/24),active:true}));await page.waitForFunction(()=>snap().visible==='visible');
            check('the observed contact typology footer stays visible as editable source credit while generic study metadata hides',await page.evaluate(()=>{const footer=document.querySelector('[data-framer-name$="film-phase-22-source-contact-credit"]');return footer.style.opacity==='1'&&footer.textContent==='TIPOLOGÍA · 112 PIEZAS · MUSEOS EN ACCESO ABIERTO'&&document.querySelector('[data-source-ajedrez-group="22"] [data-framer-name$="film-phase-22-credit"]').style.opacity==='0'}));
            const guideStates=[];
            for(const frame of [639,640,641,642,643,644]) {
                await page.evaluate(frame=>setState({time:frame/24,index:__photoIndex(frame/24),active:true}),frame);await page.waitForFunction(()=>snap().visible==='visible');
                const guide=await page.evaluate(()=>{const root=document.querySelector('[data-framer-name="film-phase-24-source-guides"]');return{opacity:root.style.opacity,children:root.children.length,pixels:snap().pixels,pose:snap().pose}});guideStates.push({frame,...guide});assert.equal(guide.opacity,frame>=640&&frame<643?'1':'0','source guides exact frame '+frame);assert.equal(guide.children,11);
            }
            check('editable source guides turn off at643 while the fully observed clean643 photograph remains, without a second decoder',guideStates[3].pixels===guideStates[4].pixels&&guideStates[3].pose==='indexed-king-642'&&guideStates[4].pose==='indexed-king-642');
            await page.evaluate(()=>setState({time:572/24,index:__photoIndex(572/24),active:true}));await page.waitForFunction(()=>snap().visible==='visible');
            check('reverse source cut restores the generic index table and hides additional catalog/guide roots',await page.evaluate(()=>{const group=document.querySelector('[data-source-ajedrez-group="24"]');return group.querySelector('[data-framer-name$="source-museum-catalog"]').style.opacity==='0'&&group.querySelector('[data-framer-name$="source-guides"]').style.opacity==='0'&&group.querySelector('[data-framer-name$="index-kind-0"]').style.opacity==='1'}));
            fs.writeFileSync(out+'/source-native-annotation-guide-states.json',JSON.stringify({handFields,earthFields,guideStates:guideStates.map(({pixels,...value})=>value)},null,2)+'\n');
        }
        const retryURL = urls[0] + '?fail-once=source-material', retryPose = [{ name: 'hand-retry', first: 240, last: 264, rects: [{ tile: 'retry', rect: [0, 275, 233, 164] }] }];
        const retryCode = bound.replace(/^const AJEDREZ_PHOTO_ATLAS_URLS:.*$/m, 'const AJEDREZ_PHOTO_ATLAS_URLS: readonly (string | null)[] = ' + JSON.stringify([retryURL])).replace(/^const AJEDREZ_PHOTO_TILES:.*$/m, 'const AJEDREZ_PHOTO_TILES: Readonly<Record<string, AjedrezPhotoTile>> = ' + JSON.stringify({ retry: tile0 })).replace(poseLine, poseLine.slice(0, poseLine.indexOf(' = ') + 3) + JSON.stringify(retryPose));
        const beforeRetry = requests.length;
        await page.addScriptTag({ content: moduleCode(retryCode) });
        await page.evaluate(() => setState({ time: 10, index: 30, active: true, playing: true }));
        await page.waitForFunction(url => __photoCache().peek(url)?.state === 'failed', retryURL);
        check('transient source-image failure keeps the complete native fallback without an automatic retry loop', requests.length === beforeRetry + 1 && await page.evaluate(() => (!document.querySelector('canvas') || snap().visible === 'hidden') && snap().backing === '0.9'));
        await page.evaluate(() => setState({ time: 12 }));
        check('leaving the failed source pose releases its failed cache entry rather than poisoning replay', await page.evaluate(url => !__photoCache().peek(url), retryURL));
        await page.evaluate(() => setState({ time: 10 }));
        await page.waitForFunction(() => snap().pose === 'hand-retry' && snap().visible === 'visible');
        check('source re-entry retries a previously failed URL and restores real image pixels with one serial request', requests.length === beforeRetry + 2 && await page.evaluate(() => snap().parts === 1 && snap().video === 0 && snap().raf === 0 && snap().webgl === 0));
        const retainedFailureURL = urls[0] + '?fail-once=retained-owner', retainedCode = retryCode.replace(retryURL, retainedFailureURL), beforeRetained = requests.length;
        await page.addScriptTag({ content: moduleCode(retainedCode) });
        await page.evaluate(() => setState({ time: 10, index: 30, active: true, playing: true }));
        await page.waitForFunction(url => __photoCache().peek(url)?.state === 'failed', retainedFailureURL);
        await page.evaluate(() => { for (let i = 0; i < 5; i++) setState({ time: 10 + i / 100, active: false, playing: false }); });
        check('a paused failed owner retains its listener without issuing repeated source-image requests', requests.length === beforeRetained + 1 && await page.evaluate(url => __photoCache().peek(url).listeners.size === 1 && __photoCache().peek(url).state === 'failed', retainedFailureURL));
        await page.evaluate(() => {
            const host = document.getElementById('film').cloneNode(true); host.id = 'secondary-film'; host.style.position = 'absolute'; host.style.left = '500px'; host.querySelectorAll('canvas').forEach(node => node.remove()); document.body.appendChild(host);
            const control = document.createElement('div'); document.body.appendChild(control);
            const state = { ...__state, time: 10, active: true, playing: true };
            function Secondary() { __useComposition(host, state); return null; }
            window.__secondaryHost = host; window.__secondaryControl = control; window.__secondaryRoot = ReactDOM.createRoot(control);
            ReactDOM.flushSync(() => __secondaryRoot.render(React.createElement(Secondary)));
        });
        await page.waitForFunction(() => document.querySelector('#secondary-film canvas')?.style.visibility === 'visible' && snap().visible === 'visible');
        check('a new owner retries the retained failure once and restores both paused and active source compositions', requests.length === beforeRetained + 2 && await page.evaluate(url => __photoCache().peek(url).listeners.size === 2 && __photoCache().peek(url).state === 'ready' && __state.playing === false && __state.active === false && snap().pixels === document.querySelector('#secondary-film canvas').toDataURL() && __video === 0 && __webgl === 0 && __raf === 0, retainedFailureURL));
        await page.evaluate(() => { ReactDOM.flushSync(() => __secondaryRoot.unmount()); __secondaryHost.remove(); __secondaryControl.remove(); });
        check('removing the second owner releases its watch while the paused first composition retains its sharp image', await page.evaluate(url => __photoCache().peek(url).listeners.size === 1 && snap().visible === 'visible', retainedFailureURL));
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
        const provenance = JSON.parse(fs.readFileSync(path.join(repo, 'docs/design-studies/code-components/assets/source-ajedrez-photographic-composition-provenance.json'))), legacy = provenance.legacyCacheV2Regression;
        assert.equal(crypto.createHash('sha256').update(legacy.code).digest('hex'), legacy.functionSHA256);
        const legacyFailureURL = urls[0] + '?fail-once=legacy-v2', legacyBusyURL = urls[0] + '?hold=legacy-busy', beforeLegacy = requests.length, legacyLogStart = requestLog.length;
        await page.evaluate(() => { delete window[Symbol.for('monarchic.source-ajedrez-photographic-images.v2')]; });
        const legacyJS = ts.transpileModule(legacy.code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
        await page.addScriptTag({ content: '(()=>{' + legacyJS + ';window.__legacyImageCache=ajedrezPhotographicImages;})()' });
        await page.evaluate(url => { window.__legacyCache = __legacyImageCache(); window.__legacyReadyA = 0; window.__legacyReadyB = 0; window.__legacyLeaseA = __legacyCache.watch(url, () => { if (__legacyCache.peek(url)?.state === 'ready') __legacyReadyA++; }); }, legacyFailureURL);
        await page.waitForFunction(url => __legacyCache.peek(url)?.state === 'failed', legacyFailureURL);
        await page.evaluate(url => { window.__legacyNegativeLease = __legacyCache.watch(url, () => { __legacyReadyB++; }); }, legacyFailureURL);
        await page.waitForTimeout(40);
        check('exact legacy-v2 negative fixture reproduces a retained failure poisoning a second owner', requests.length === beforeLegacy + 1 && await page.evaluate(url => __legacyCache.peek(url).state === 'failed' && __legacyReadyA === 0 && __legacyReadyB === 0 && __legacyCache.peek(url).listeners.size === 2, legacyFailureURL));
        await page.evaluate(url => { __legacyNegativeLease.release(); window.__legacyBusyLease = __legacyCache.watch(url, () => {}); }, legacyBusyURL);
        const upgradeCode = bound.replace(/^const AJEDREZ_PHOTO_ATLAS_URLS:.*$/m, 'const AJEDREZ_PHOTO_ATLAS_URLS: readonly (string | null)[] = ' + JSON.stringify([legacyFailureURL, legacyBusyURL]));
        const exposeCache = code => moduleCode(code).replace('window.__useComposition=useAjedrezPhotographicComposition;', 'window.__useComposition=useAjedrezPhotographicComposition;window.__currentImageCache=ajedrezPhotographicImages;');
        await page.addScriptTag({ content: exposeCache(upgradeCode) });
        await page.evaluate(url => { window.__upgradedCache = __currentImageCache(); window.__legacyLeaseB = __upgradedCache.watch(url, () => { if (__upgradedCache.peek(url)?.state === 'ready') __legacyReadyB++; }); }, legacyFailureURL);
        check('the legacy upgrade bridge waits while the retained predecessor actually has an in-flight image', await page.evaluate(url => !!__upgradedCache.bridge && !__upgradedCache.backend && __upgradedCache.peek(url).state === 'loading', legacyBusyURL));
        for (const item of heldResponses.splice(0)) item.send();
        await page.waitForFunction(url => __upgradedCache.peek(url)?.state === 'ready' && __legacyReadyA === 1 && __legacyReadyB === 1, legacyFailureURL);
        check('in-place cache upgrade preserves legacy listeners and waits for the existing serial load before one shared retry', requests.length === beforeLegacy + 3 && requestLog.slice(legacyLogStart).every(row => row.activeAtStart === 1) && await page.evaluate(() => __upgradedCache === __legacyCache && !!__upgradedCache.backend && !__upgradedCache.bridge && __observers.size === 0 && __raf === 0 && __video === 0 && __webgl === 0));
        await page.evaluate(() => { window.__olderImageFactory = __currentImageCache; window.__retainedBackend = __upgradedCache.backend; window.__retainedRecords = __retainedBackend.records; });
        await page.addScriptTag({ content: exposeCache(upgradeCode) });
        await page.evaluate(() => { window.__newestCache = __currentImageCache(); window.__newestImplementation = __newestCache.backend.implementation; __olderImageFactory(); __legacyImageCache(); });
        check('same-schema module upgrade retains the shared backend and older factories cannot reinstall an obsolete implementation', requests.length === beforeLegacy + 3 && await page.evaluate(() => __newestCache === __legacyCache && __newestCache.backend === __retainedBackend && __newestCache.backend.records === __retainedRecords && __newestCache.backend.implementation === __newestImplementation));
        await page.evaluate(() => { __legacyLeaseA.release(); __legacyLeaseB.release(); __legacyBusyLease.release(); });
        check('legacy and upgraded leases release cleanly with no retained listeners or upgrade observers', await page.evaluate(() => [...__newestCache.backend.records.values()].every(record => record.listeners.size === 0) && __newestCache.backend.records.size <= 6 && __observers.size === 0));
        const orphanFailure = urls[0] + '?fail-once=legacy-orphan&hold=legacy-retry', orphanBusy = urls[0] + '?hold=legacy-orphan-busy', nextRaw = urls[0] + '?hold=new-raw-material';
        await page.evaluate(url => { delete window[Symbol.for('monarchic.source-ajedrez-photographic-images.v2')]; window.__orphanLegacy = __legacyImageCache(); window.__orphanA = __orphanLegacy.watch(url, () => {}); }, orphanFailure);
        await page.waitForFunction(url => __orphanLegacy.peek(url)?.state === 'failed', orphanFailure);
        await page.evaluate(url => { window.__orphanBusy = __orphanLegacy.watch(url, () => {}); }, orphanBusy);
        await waitForHeld(new URL(orphanBusy).pathname + new URL(orphanBusy).search);
        const changedDelivery = bound.replace(/^const AJEDREZ_PHOTO_ATLAS_URLS:.*$/m, 'const AJEDREZ_PHOTO_ATLAS_URLS: readonly (string | null)[] = ' + JSON.stringify([nextRaw])).replace(/^const AJEDREZ_PHOTO_LEGACY_V2_URLS:.*$/m, 'const AJEDREZ_PHOTO_LEGACY_V2_URLS: readonly string[] = ' + JSON.stringify([orphanFailure, orphanBusy]));
        await page.addScriptTag({ content: exposeCache(changedDelivery) });
        await page.evaluate(url => { window.__orphanCache = __currentImageCache(); window.__orphanB = __orphanCache.watch(url, () => {}); }, orphanFailure);
        check('changing all current material URLs still observes the retained legacy URL queue through the explicit compatibility set', await page.evaluate(url => !!__orphanCache.bridge && !__orphanCache.backend && __orphanCache.peek(url).state === 'loading', orphanBusy));
        heldResponses.find(item => item.url === new URL(orphanBusy).pathname + new URL(orphanBusy).search).send();
        await waitForHeld(new URL(orphanFailure).pathname + new URL(orphanFailure).search);
        await page.waitForFunction(url => !!__orphanCache.backend && __orphanCache.peek(url)?.state === 'loading', orphanFailure);
        await page.evaluate(() => { __orphanB.release(); __orphanA.release(); });
        check('bridged and original legacy leases cancel a newly migrated retry when the last retained listener leaves', await page.evaluate(url => !__orphanCache.peek(url) && __orphanCache.backend.loading === null && __orphanCache.backend.queue.length === 0 && __orphanA.record.state === 'failed' && __orphanA.record.listeners.size === 0, orphanFailure));
        await page.evaluate(url => { window.__nextRawLease = __orphanCache.watch(url, () => {}); }, nextRaw);
        await waitForHeld(new URL(nextRaw).pathname + new URL(nextRaw).search);
        check('the next current material URL is admitted immediately after cancellation instead of waiting on an orphan image', await page.evaluate(url => __orphanCache.backend.loading === __nextRawLease.record && __orphanCache.peek(url).state === 'loading' && __orphanCache.backend.queue.length === 0, nextRaw));
        await page.evaluate(() => { __nextRawLease.release(); __orphanBusy.release(); });
        for (const item of heldResponses.splice(0)) item.send();
        check('repeated legacy and current cancellation leaves no active load, retained listener or upgrade observer', await page.evaluate(() => __orphanCache.backend.loading === null && __orphanCache.backend.queue.length === 0 && [...__orphanCache.backend.records.values()].every(record => record.listeners.size === 0) && __observers.size === 0));
        check('noactualReact/browsererrors', errors.length === 0);
        const result = { passed: true, sourceSHA256: crypto.createHash('sha256').update(source).digest('hex'), checks, requests, errors, first: { ...first, pixels: undefined }, sourceAtlasFiles: map.atlases.map(x => ({ sha256: x.sha256, bytes: x.bytes, pixels: x.pixels ?? x.width * x.height, ownedFixture: !!x.ownedFixture })), genuineSourceMaterial: !!genuine, fixtureScope: genuine ? 'Retained original photo materials' : 'Independently generated SVG tile fixtures for reproducible lifecycle/geometry/pixel checks', framerPreviewVerified: false };
        fs.writeFileSync(out + '/result.json', JSON.stringify({ ...result, requestLog }, null, 2) + '\n');
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
