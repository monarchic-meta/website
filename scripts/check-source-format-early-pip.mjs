import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const require = createRequire(import.meta.url), ts = require('typescript')
const repo = fileURLToPath(new URL('../', import.meta.url))
const file = path.join(repo, 'docs/design-studies/code-components/SourceFormatDetails.tsx')
const source = fs.readFileSync(file, 'utf8'), hash = value => crypto.createHash('sha256').update(value).digest('hex')
const output = process.env.MONARCHIC_FORMAT_EARLY_PIP_EVIDENCE_DIR ?? '/tmp/monarchic-format-early-pip'
const checks = [], samples = [], errors = [], check = (name, condition) => { assert.ok(condition, name); checks.push(name) }
fs.mkdirSync(output, { recursive: true })
const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const publicRows = ast.statements.filter(node => ts.isFunctionDeclaration(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)).map(node => [node.name.text, node.getText()])
check('All 141 prior public override bodies remain byte-identical', hash(JSON.stringify(publicRows.slice(0, 141))) === '8fc1624272d98e7114e907147ad6cdb4d9a560672940f69df06b5e7c8d0c02df')
check('The added composed provider remains alongside later separately checked roles', publicRows.length >= 142 && publicRows[141][0] === 'withFormatGaugeFlowAndField')
const marker = source.indexOf('\n/** Retained original bu():')
check('The approved private magnet/registry delta is finite and exact', marker > 0 && hash(source.slice(0, marker)) === 'e3311634a1d40c549eccef4ef48dde4cebd7575a6a1dfc7992a7e947b04f0fc4')
check('The previous entrance implementation is unchanged', hash(source.slice(source.indexOf('\n/** Source field words:'), marker)) === '5ed30f24b39c97c3e629fb3193d77ce1d332d35514ed25d95cde443c5aa86129')
check('The appended flight branch adds no scheduler, renderer, media, fetch or relative module', !/requestAnimationFrame|setTimeout|setInterval|new Image|\bfetch\(|getContext\(|querySelector|innerHTML|from\s+["']\./.test(source.slice(marker)))
check('The composed role uses direct public ES2020-compatible types', /export function withFormatGaugeFlowAndField\(Component: ComponentType<LayerProps>\): ComponentType<LayerProps>/.test(source) && !/\.at\(|useRef<HTMLElement>\(null\)/.test(source.slice(marker)))
check('Hot source replacement keys a fresh world rather than retaining the old registry', source.includes('const FORMAT_DOCUMENT_REVISION="native-poster-magnet-88-flight-keyed-v3"'))
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText
const React = require('react'), exports = {}
const helpers = vm.runInNewContext('(function(require,exports){' + compiled + ';return {formatEarlyPipPose,formatMagnetX,sourceLayout};})(require,exports)', { exports, require: name => name === 'react' ? React : { RenderTarget: { canvas: 'canvas', export: 'export', thumbnail: 'thumbnail', current: () => 'canvas' }, useIsStaticRenderer: () => true } })

// Independently evaluated original bu() equations. The poster path table is
// retained source data; this deliberately does not call the new pose helper.
const pathRows = [[-900,720],[-780,716],[-650,700],[-500,655],[-350,585],[-200,490],[-60,390],[60,322],[190,318],[340,400],[430,500],[520,640],[610,810],[700,920],[790,1030],[880,1105],[980,1160],[1100,1205],[1240,1238],[1429.12,1252.5]]
const reference = (scroll, height, unit, poster, left) => {
    const gauge = poster - 2056 * unit, vee = gauge - 960.664 * unit
    const G = [720 * unit, gauge + 1218.5 * unit], V = [698.5 * unit, vee + 808.25 * unit]
    const start = V[1] - height / 2, end = Math.max(start + 1, G[1] - height)
    const raw = Math.max(0, Math.min(1, (scroll - start) / (end - start))), t = raw < .5 ? 4 * raw ** 3 : 1 - (-2 * raw + 2) ** 3 / 2
    const y = Math.min(poster + 1429.12 * unit - G[1], scroll + height / 2 - G[1]), at = (G[1] + y - poster) / unit
    let x = pathRows[0][1]
    for (let i = 1; i < pathRows.length; i++) { const before = pathRows[i - 1], after = pathRows[i]; if (at > after[0]) { x = after[1]; continue }; x = before[1] + (after[1] - before[1]) * Math.max(0, (at - before[0]) / (after[0] - before[0])); break }
    return { x: left + G[0] + (V[0] - G[0]) * (1 - t) + x * unit - G[0], y: G[1] + (V[1] - G[1]) * (1 - t) + y * t, turn: 180 * (1 - t), scale: 1 + .65 * (1 - t), channel: Math.round(255 * Math.min(1, t / .2)), progress: t }
}
for (const [width, height, ownerScale, left] of [[1440,900,1,0], [1280,720,1,23], [1440,900,.5,37]]) {
    const layout = helpers.sourceLayout(width, height), u = width / 1440 * ownerScale, top = layout.poster * ownerScale
    const axis = top - 837.5 * u, start = axis - 1370.914 * u - height / 2, end = Math.max(start + 1, axis - height)
    for (const scroll of [0, start - 100, start, start + (end - start) * .25, (start + end) / 2, end, axis - height / 2, top - 100, top + 1429.12 * u]) {
        const actual = helpers.formatEarlyPipPose(scroll, height, u, top, left), expected = reference(scroll, height, u, top, left)
        check('Original bu() flight pose matches at ' + [width, height, ownerScale, scroll.toFixed(3)].join('/'), ['x','y','turn','scale','progress'].every(key => Math.abs(actual[key] - expected[key]) < 1e-7) && actual.color === `rgb(${expected.channel},${expected.channel},${expected.channel})`)
    }
    const first = helpers.formatEarlyPipPose(start, height, u, top, left)
    check('Vee starts with the source black 180-degree 67.65u field at ' + width + '/' + ownerScale, Math.abs(first.scale * 41 - 67.65) < 1e-9 && first.turn === 180 && first.color === 'rgb(0,0,0)' && Math.abs(first.y - (axis - 1370.914 * u)) < 1e-8)
    const complete = helpers.formatEarlyPipPose(axis - height / 2, height, u, top, left)
    check('Gauge and existing late poster path handoff is continuous at ' + width + '/' + ownerScale, complete.progress === 1 && complete.scale === 1 && complete.turn === 0 && complete.color === 'rgb(255,255,255)' && Math.abs(complete.x - (left + helpers.formatMagnetX((axis - top) / u) * u)) < 1e-8 && Math.abs(complete.y - axis) < 1e-8)
}
const Native = React.forwardRef((props, ref) => React.createElement('div', { ...props, ref }))
const html = require('react-dom/server').renderToString(React.createElement(exports.withFormatGaugeFlowAndField(Native), { 'data-caller': 'preserved', style: { width: 1440, height: 2050, overflow: 'visible', transform: 'translateZ(0)' } }, 'Editable native gauge content'))
check('Static composed provider preserves native contents, caller transform and unclipped outer group', html.includes('Editable native gauge content') && html.includes('data-caller="preserved"') && html.includes('overflow:visible') && html.includes('translateZ(0)'))
const result = () => ({ passed: true, node: process.version, sourceSHA256: hash(source), sourceBytes: Buffer.byteLength(source), testSHA256: hash(fs.readFileSync(fileURLToPath(import.meta.url))), checks, samples, errors, scope: 'Cached original bu()/CSS facts and isolated native-like gauge/pip/late-poster integration. No actual Framer paint, forwarding, source-input visit or reload proof.', actualFramerPreviewVerified: false, afterEditorReload: false })
if (process.argv.includes('--static-only')) { fs.writeFileSync(path.join(output, 'static-result.json'), JSON.stringify(result(), null, 2) + '\n'); console.log(JSON.stringify({ passed: true, checks: checks.length, output })); process.exit(0) }

// One serial browser placement; source-specific media and the rest of the site
// are deliberately absent. Native Frames and editable pane/glyph nodes remain.
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'format-early-pip-'))
const browser = await chromium.launchPersistentContext(profile, { headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, viewport: { width: 1440, height: 900 }, args: ['--disable-dev-shm-usage'] })
const page = browser.pages()[0]
page.on('pageerror', error => errors.push(error.message))
await page.route('**/*', route => route.abort())
try {
    await page.setContent('<style>body{margin:0;background:#fafafa}*{box-sizing:border-box}#mount{position:relative}p{margin:0}</style><div id="mount"></div>')
    for (const name of ['react','react-dom']) await page.addScriptTag({ content: fs.readFileSync(path.join(path.dirname(require.resolve(name + '/package.json')), 'umd/' + name + '.development.js'), 'utf8') })
    await page.evaluate(() => {
        window.__target = 'preview'; window.__static = false; window.__frames = new Set(); window.__intervals = new Set();window.__frameKinds=new Map();window.__maxContinuous=0;window.__frameAdmissions=[]
        const raf = requestAnimationFrame.bind(window), caf = cancelAnimationFrame.bind(window), interval = setInterval.bind(window), clear = clearInterval.bind(window)
        window.requestAnimationFrame = fn => { const owned=new Error().stack.includes('format-early-pip-module.js'),kind=owned?(fn.name==='tick'?'continuous':fn.name==='read'?'measurement':'other-owned'):'fixture';const id = raf(time => { __frames.delete(id);__frameKinds.delete(id);fn(time) });__frames.add(id);__frameKinds.set(id,kind);__maxContinuous=Math.max(__maxContinuous,[...__frameKinds.values()].filter(k=>k==='continuous').length);if(__frameAdmissions.length<50)__frameAdmissions.push({kind,name:fn.name});return id }
        window.cancelAnimationFrame = id => { __frames.delete(id);__frameKinds.delete(id);caf(id) }
        window.setInterval = (...args) => { const id = interval(...args); __intervals.add(id); return id }
        window.clearInterval = id => { __intervals.delete(id); clear(id) }
    })
    await page.addScriptTag({ content: '(function(){const exports={};const require=name=>name==="react"?window.React:{RenderTarget:{canvas:"canvas",export:"export",thumbnail:"thumbnail",current:()=>__target},useIsStaticRenderer:()=>__static};' + compiled + ';window.API=exports;window.layout=sourceLayout;window.pose=formatEarlyPipPose;})()\n//# sourceURL=format-early-pip-module.js' })
    await page.evaluate(() => {
        const E = React.createElement, N = React.forwardRef(({ children, ...props }, ref) => E('div', { ...props, ref }, children))
        const H = Object.fromEntries(['RefinedDocument','GaugeFlow','GaugeField','GaugeFlowAndField','GaugeShape','GaugePaneA','GaugePaneB','CarriedPoster','FieldFlow','ClosingField','PosterGlyph'].map(role => [role, API['withFormat' + role](N)]))
        window.mode = 'flight'; window.root = ReactDOM.createRoot(document.getElementById('mount'))
        window.render = () => {
            const phone = innerWidth < 1280, u = phone ? 780 / 1440 : 1, pos = (x,y,w,h) => ({ position: 'absolute', left:x,top:y,width:w,height:h })
            const ring = E(H.GaugeShape, { id:'pip', style:{...pos(699.5*u,1198*u,41*u,41*u),overflow:'visible'} }, E(H.GaugePaneA,{id:'pane-a',style:{...pos(0,0,41*u,41*u),background:'#fff'}}), E(H.GaugePaneB,{id:'pane-b',style:{...pos(0,0,41*u,41*u),background:'#fff'}}))
            const aperture = E(mode === 'flight' ? N : H.GaugeField, { id:'aperture',style:{...pos(0,0,1440*u,2050*u),overflow:'clip'} }, E('div',{id:'unrelated-gauge-content',style:{...pos(0,0,10,10),background:'#ffd000'}}), mode === 'flight' ? null : ring)
            const gauge = E(mode === 'flight' ? H.GaugeFlowAndField : H.GaugeFlow, { id:'gauge',style:{...pos(phone?-202.5:0,phone?5000:0,1440*u,phone?975:2050*u),overflow:'visible'} }, aperture, mode === 'flight' ? ring : null)
            const glyphs = Array.from({length:86},(_,i)=>E(H.PosterGlyph,{key:i,id:'format-poster-glyph-'+i,style:{...pos((i%12)*65*u,Math.floor(i/12)*60*u,25*u,35*u),background:'#fff',transform:'translateZ(0)'}},String(i)))
            const poster = E(H.CarriedPoster,{id:'poster',style:{...pos(0,phone?1800:0,1440*u,1617*u),background:'transparent'}},...glyphs,E(H.PosterGlyph,{id:'format-poster-pip-end',style:{...pos(1085*u,1261.62*u,335*u,335*u),background:'#fff',opacity:1}}))
            const field = E(H.FieldFlow,{id:'field-flow',style:pos(0,phone?4000:0,1440*u,900*u)},E(H.ClosingField,{id:'field',style:pos(20*u,0,1400*u,850*u)}))
            ReactDOM.flushSync(()=>root.render(E(H.RefinedDocument,{id:'document',style:{position:'relative',width:phone?390:1440,height:phone?6000:16000}},gauge,poster,field)))
        }
        window.state = () => { const pip=document.getElementById('pip'), b=pip.getBoundingClientRect(), p=document.getElementById('poster');return { x:b.x+b.width/2,y:b.y+b.height/2,width:b.width,height:b.height,localSize:parseFloat(pip.style.getPropertyValue('--source-format-pip-size')),turn:parseFloat(pip.style.getPropertyValue('--source-format-pip-turn')),color:pip.style.getPropertyValue('--source-format-pip-color'),visibility:getComputedStyle(pip).visibility,parent:pip.parentElement.id,apertureOverflow:getComputedStyle(document.getElementById('aperture')).overflow,posterPhase:Number(p.dataset.formatMagnetPhase),endpointOpacity:getComputedStyle(document.getElementById('format-poster-pip-end')).opacity,owned:pip.hasAttribute('data-format-pip-owned'),pending:__frames.size,continuous:[...__frameKinds.values()].filter(k=>k==='continuous').length,measurement:[...__frameKinds.values()].filter(k=>k==='measurement').length,maxContinuous:__maxContinuous,intervals:__intervals.size,rect:pip.getBoundingClientRect().toJSON(),glyphs:document.querySelectorAll('[id^="format-poster-glyph-"]').length} }
        render()
    })
    const metadata = () => page.evaluate(() => { const p=document.getElementById('poster'), d=document.getElementById('document'), r=d.getBoundingClientRect(), scale=r.width/d.offsetWidth; const top=Math.round(p.getBoundingClientRect().top+scrollY),u=innerWidth/1440*scale,axis=top-837.5*u;return {top,u,left:p.getBoundingClientRect().left,start:axis-1370.914*u-innerHeight/2,end:axis-innerHeight,axis,height:innerHeight} })
    const visit = async (name, scroll, meta) => {
        await page.evaluate(y => { scrollTo(0,y); dispatchEvent(new Event('scroll')) }, scroll)
        await page.waitForFunction(() => state().owned, null, { timeout: 5000 })
        await page.waitForTimeout(110)
        const actual = await page.evaluate(() => ({...state(),scroll:scrollY})), expected = reference(actual.scroll,meta.height,meta.u,meta.top,meta.left)
        const angle = expected.turn*Math.PI/180, late=Math.max(0,Math.min(1,(actual.scroll-(meta.axis-meta.height/2))/(meta.top+1429.12*meta.u-meta.axis))),diameter=20+315*(1-(1-late)**3),rectSize=diameter*41/20*meta.u*expected.scale*(Math.abs(Math.cos(angle))+Math.abs(Math.sin(angle)))
        samples.push({name,actual,expected,diameter})
        check(name+' follows the exact original source center, rotation, color and scaled field', Math.abs(actual.x-expected.x)<.15 && Math.abs(actual.y+actual.scroll-expected.y)<.15 && Math.abs(actual.turn-expected.turn)<1e-6 && actual.color===`rgb(${expected.channel},${expected.channel},${expected.channel})` && Math.abs(actual.width-rectSize)<.3)
        check(name+' keeps one existing continuous owner and all86 editable glyphs', actual.continuous<=1 && actual.maxContinuous<=1 && actual.measurement===0 && actual.intervals===0 && actual.glyphs===86 && actual.parent==='gauge' && actual.apertureOverflow==='clip')
        return actual
    }
    await page.waitForFunction(() => state().owned)
    const initial = await metadata()
    const first = await visit('Desktop Vee start',initial.start,initial)
    await page.waitForTimeout(150)
    check('Early visible pose paints on scroll while the offscreen poster owner sleeps',await page.evaluate(before=>state().pending===0&&Math.abs(state().x-before.x)<.01&&Math.abs(state().y-before.y)<.01&&state().color===before.color,first))
    check('Early ring paints outside the preserved gauge clipping aperture', first.rect.bottom < await page.locator('#aperture').evaluate(n=>n.getBoundingClientRect().top))
    const shot = await page.screenshot({path:path.join(output,'desktop-vee-start.png')})
    const sharp=createRequire(require.resolve('astro/package.json'))('sharp'), image=await sharp(shot).ensureAlpha().raw().toBuffer({resolveWithObject:true})
    let black=0;for(let y=Math.max(0,Math.floor(first.y-30));y<Math.min(image.info.height,Math.ceil(first.y+30));y++)for(let x=Math.max(0,Math.floor(first.x-30));x<Math.min(image.info.width,Math.ceil(first.x+30));x++){const k=(y*image.info.width+x)*4;if(image.data[k]<30&&image.data[k+1]<30&&image.data[k+2]<30)black++}
    check('Actual editable panes produce black pixels outside gauge bounds',black>100)
    await visit('Desktop quarter flight',initial.start+(initial.end-initial.start)*.25,initial)
    await visit('Desktop midpoint flight',(initial.start+initial.end)/2,initial)
    await visit('Desktop gauge arrival',initial.end,initial)
    await visit('Desktop gauge-to-poster continuity',initial.axis-initial.height/2,initial)
    await page.evaluate(y=>{scrollTo(0,y);dispatchEvent(new Event('scroll'))},initial.top-100)
    await page.waitForFunction(()=>state().posterPhase>0&&state().endpointOpacity==='0')
    samples.push({name:'late-poster-before-settle',actual:await page.evaluate(()=>state())})
    await page.waitForFunction(()=>state().measurement===0)
    const late=await page.evaluate(()=>state())
    samples.push({name:'late-poster-after-measurement',actual:late,admissions:await page.evaluate(()=>__frameAdmissions)})
    check('The existing late poster phase still owns the same native pip and hidden endpoint '+JSON.stringify(late),late.parent==='gauge'&&late.visibility==='visible'&&late.turn===0&&late.color==='rgb(255,255,255)'&&late.localSize>41&&late.continuous<=1&&late.maxContinuous<=1)
    await page.evaluate(y=>{scrollTo(0,y);dispatchEvent(new Event('scroll'))},initial.top+1100)
    await page.waitForFunction(()=>state().posterPhase===1&&state().visibility==='hidden'&&state().endpointOpacity==='1')
    check('Existing endpoint handoff remains exact after early flight',await page.evaluate(()=>state().glyphs===86&&state().continuous<=1&&state().maxContinuous<=1))
    const reverse=await visit('Reverse back to Vee start',initial.start,initial)
    check('Reverse restores the same two native pane IDs and original black starting pose',reverse.color==='rgb(0,0,0)'&&await page.locator('#pip > div').count()===2)

    await page.setViewportSize({width:1280,height:720})
    await page.evaluate(()=>{scrollTo(0,0);render()});await page.waitForTimeout(110)
    const compact=await metadata()
    await visit('Compact midpoint flight',(compact.start+compact.end)/2,compact)
    await page.setViewportSize({width:1440,height:900})
    await page.evaluate(()=>{scrollTo(0,0);document.getElementById('mount').style.transform='scale(.5)';document.getElementById('mount').style.transformOrigin='0 0';document.getElementById('mount').style.marginLeft='37px';render();document.getElementById('gauge').style.border='2px solid transparent';dispatchEvent(new Event('resize'))})
    await page.waitForTimeout(110)
    const transformed=await metadata()
    await visit('Half-scale translated-owner midpoint',(transformed.start+transformed.end)/2,transformed)
    await page.evaluate(()=>{scrollTo(0,0);document.getElementById('mount').style.transform='';document.getElementById('mount').style.marginLeft='';mode='legacy';render();dispatchEvent(new Event('resize'))})
    await page.waitForTimeout(110)
    const legacy=await metadata()
    await page.evaluate(y=>{scrollTo(0,y);dispatchEvent(new Event('scroll'))},legacy.start)
    await page.waitForTimeout(110)
    const old=await page.evaluate(()=>state())
    check('Unchanged legacy placements retain their previous white stationary-gauge pose',old.parent==='aperture'&&old.color==='#ffffff'&&old.turn===0&&Math.abs(old.localSize-41)<.001)

    await page.evaluate(()=>{scrollTo(0,0);mode='flight';render()});await page.waitForTimeout(110)
    for(const target of ['canvas','export','thumbnail']){
        await page.evaluate(t=>{__target=t;render()},target);await page.waitForTimeout(90)
        check(target+' releases owned pip styles without replacing pane content or clipping',await page.evaluate(()=>!state().owned&&state().pending===0&&state().intervals===0&&state().parent==='gauge'&&state().apertureOverflow==='clip'&&document.getElementById('pip').children.length===2))
    }
    await page.evaluate(()=>{__target='preview';render()});await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(90)
    check('Reduced motion bypasses flight and releases every owned frame',await page.evaluate(()=>!state().owned&&state().pending===0&&state().intervals===0))
    await page.emulateMedia({reducedMotion:'no-preference'})
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{scrollTo(0,0);render()});await page.waitForTimeout(110)
    const phone=await page.evaluate(()=>state())
    check('Phone historical native ring remains unowned with its original780px gauge field dimensions',!phone.owned&&phone.pending===0&&phone.intervals===0&&Math.abs(phone.width-41*780/1440)<.01&&phone.parent==='gauge')
    await page.evaluate(()=>ReactDOM.flushSync(()=>root.unmount()));await page.waitForTimeout(60)
    check('Unmount clears all owned frames/timers and native actor DOM',await page.evaluate(()=>__frames.size===0&&__intervals.size===0&&!document.getElementById('pip')))
    check('No React or Chromium errors occur',errors.length===0)
    fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(result(),null,2)+'\n')
    console.log(JSON.stringify({passed:true,checks:checks.length,output}))
} catch(error){fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify({message:String(error),checks,samples,errors},null,2)+'\n');throw error}
finally { await browser.close(); fs.rmSync(profile, { recursive: true, force: true }) }
