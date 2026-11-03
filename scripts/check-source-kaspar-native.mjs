import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const repo = fileURLToPath(new URL('../', import.meta.url)), require = createRequire(import.meta.url)
const ts = require('typescript'), { chromium } = require('@playwright/test')
const file = path.join(repo, 'docs/design-studies/code-components/SourceKasparNativeBehaviors.tsx')
const source = fs.readFileSync(file, 'utf8'), checks = [], errors = []
const verify = (name, value) => { assert.ok(value, name); checks.push(name) }
const declarations = new Map([
    [path.join(repo, '__kaspar-native-react.d.ts'), `
export interface CSSProperties {[key:string]:string|number|undefined}
export type ReactNode=unknown;
export type ForwardedRef<T>=((value:T|null)=>void)|{current:T|null}|null;
export type ComponentType<P={}>=(props:P)=>unknown;
export function forwardRef<T,P>(f:(props:P,ref:ForwardedRef<T>)=>unknown):ComponentType<P>;
export function useState<T>(v:T):[T,(v:T|((p:T)=>T))=>void];
export function useRef<T>(v:T):{current:T};
export function useCallback<T extends Function>(f:T,d:unknown[]):T;
export function useLayoutEffect(f:()=>void|(()=>void),d:unknown[]):void;
export function createElement(...args:unknown[]):unknown;
declare global {namespace JSX {interface IntrinsicAttributes {key?:string|number};interface IntrinsicElements {[tag:string]:{[k:string]:unknown}}}}
`],
    [path.join(repo, '__kaspar-native-framer.d.ts'), `export const RenderTarget:{canvas:string;export:string;thumbnail:string;current():string};export function useIsStaticRenderer():boolean;`],
])
const options = { strict:true, noEmit:true, skipLibCheck:true, target:ts.ScriptTarget.ES2022, module:ts.ModuleKind.ESNext, moduleResolution:ts.ModuleResolutionKind.Node10, jsx:ts.JsxEmit.React, baseUrl:repo, paths:{react:['__kaspar-native-react.d.ts'],framer:['__kaspar-native-framer.d.ts']} }
const host = ts.createCompilerHost(options), read = host.readFile.bind(host), exists = host.fileExists.bind(host)
host.readFile = p => declarations.get(p) ?? read(p)
host.fileExists = p => declarations.has(p) || exists(p)
host.getSourceFile = (p,v) => { const text=host.readFile(p); return text===undefined?undefined:ts.createSourceFile(p,text,v,true) }
const diagnostics=ts.getPreEmitDiagnostics(ts.createProgram([file],options,host))
assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics.slice(0,12),{getCurrentDirectory:()=>repo,getCanonicalFileName:p=>p,getNewLine:()=> '\n'}))
checks.push('Strict semantic TypeScript against actual DOM and explicit React/Framer public contracts')
const out=process.env.MONARCHIC_KASPAR_NATIVE_EVIDENCE_DIR??'/tmp/monarchic-kaspar-native'
fs.mkdirSync(out,{recursive:true})
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText
const code=compile(source), react=fs.readFileSync(path.join(path.dirname(require.resolve('react/package.json')),'umd/react.development.js'),'utf8'), reactDOM=fs.readFileSync(path.join(path.dirname(require.resolve('react-dom/package.json')),'umd/react-dom.development.js'),'utf8')
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-accelerated-2d-canvas']})
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1})
page.setDefaultTimeout(10000)
page.on('pageerror',e=>errors.push(String(e)))
try {
    await page.setContent('<!doctype html><style>html,body{margin:0}*{box-sizing:border-box}p{margin:0}#mount{width:100%}</style><div id="mount"></div>')
    await page.addScriptTag({content:react}); await page.addScriptTag({content:reactDOM})
    await page.addScriptTag({content:`
window.target='preview';window.staticRenderer=false;window.exports={};window.require=n=>n==='react'?window.React:{RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail',current:()=>target},useIsStaticRenderer:()=>staticRenderer};
(function(require,exports){${code}})(window.require,window.exports);
window.api=exports;window.nativeProps={};window.native=React.forwardRef((props,ref)=>{if(props.id)nativeProps[props.id]=props;const {onTap,...dom}=props;return React.createElement('div',{...dom,ref})});
window.C=Object.fromEntries(Object.entries(api).map(([k,f])=>[k,f(native)]));
window.root=ReactDOM.createRoot(document.querySelector('#mount'));window.block=false;window.blockTap=false;
window.card=(i)=>React.createElement(C.withKasparProjectCard,{id:'card'+i,key:i,style:{width:357.5,height:480}},React.createElement('div',{style:{aspectRatio:i%2?'1':'4/5',background:['#aca22e','#992e2c','#b6b8bf','#2c6d53'][i]}},React.createElement('a',{id:'link'+i,href:'#media'+i},'source link')),React.createElement('p',null,'li_00'+(i+1)+'.jpg'));
window.render=()=>root.render(React.createElement(C.withKasparCurrentPage,{id:'page',style:{width:'100%',height:2700}},
 React.createElement(C.withKasparHero,{id:'hero',style:{height:900,position:'relative'}},
  React.createElement(C.withKasparBotanicalField,{id:'field',style:{opacity:1}},'Existing bounded ASCII actor remains separate'),
  React.createElement(C.withKasparFineGrid,{id:'fine'}),React.createElement(C.withKasparColumns,{id:'columns'}),
  React.createElement(C.withKasparHeader,{id:'header',style:{height:47.5,background:'white'}},'maximilian kaspar · photos · about'),
  React.createElement(C.withKasparHeadline,{id:'headline',style:{position:'absolute',left:10,bottom:15,width:'calc(100% - 20px)'}},React.createElement('p',{style:{fontFamily:'monospace',fontSize:115}},'swiss based web and brand designer. currently working at stuiq.')),
  React.createElement(C.withKasparPointerCue,{id:'cue'},'scroll down')),
 React.createElement(C.withKasparProjects,{id:'projects',style:{position:'relative',width:'100%',height:1000}},
  React.createElement(C.withKasparProjectHeader,{id:'project-header',style:{height:48,background:'white'},onTap:e=>{if(blockTap)e.preventDefault()},onClick:e=>{if(block)e.preventDefault()}},'3 linden'),
  React.createElement(C.withKasparProjectBody,{id:'body'},React.createElement('div',{style:{height:100}},'Independent project summary and native agency links')),
  React.createElement(C.withKasparProjectGallery,{id:'gallery'},[0,1,2,3].map(card))),
 React.createElement('div',{style:{height:900}},'Following-page boundary')));
render();`})
    await page.waitForFunction(()=>document.querySelector('[data-kaspar-native-effects]'))
    verify('Thirteen public genuine override functions, without code components or controls',await page.evaluate(()=>Object.keys(api).length===13&&Object.values(api).every(x=>typeof x==='function')))
    verify('Native headline fits available source height and preserves editable text',await page.evaluate(()=>{const p=document.querySelector('#headline p');return +document.querySelector('#headline').dataset.kasparFontSize>80&&p.textContent.includes('currently working at stuiq')&&p.getBoundingClientRect().height<=360}))
    verify('No procedural raster, WebGL context or decoder is created',await page.locator('canvas,video,iframe').count()===0)
    verify('Fine grid remains while the optional primary layout grid is off',await page.evaluate(()=>getComputedStyle(document.querySelector('#fine')).backgroundImage.includes('repeating-linear-gradient')&&getComputedStyle(document.querySelector('#columns')).opacity==='0'))
    await page.keyboard.press('a')
    verify('Actual A key creates four word-range boxes and nearest-corner connectors',await page.locator('[data-kaspar-scan-box]').count()===4&&await page.locator('[data-kaspar-native-effects] line').count()===4)
    const nativeText=await page.locator('#headline').textContent()
    verify('Word scanning leaves native text nodes and authored copy intact',!await page.locator('#headline span').count()&&nativeText.includes('swiss based'))
    await page.keyboard.press('a');verify('A toggles scanning off and clears owned SVG',await page.locator('[data-kaspar-scan-box]').count()===0)
    await page.keyboard.press('Shift+G');verify('Shift+G enables the separate source layout grid',await page.evaluate(()=>getComputedStyle(document.querySelector('#columns')).opacity==='1'))
    await page.keyboard.press('Shift+G')
    await page.mouse.move(700,400);await page.waitForTimeout(150)
    verify('Native scroll cue follows real pointer input',await page.evaluate(()=>document.querySelector('#cue').style.transform.includes('715px')&&document.querySelector('#cue').style.opacity==='0.5'))
    await page.mouse.move(100,20);await page.waitForTimeout(200)
    verify('Cue hides over the fixed source navigation',await page.evaluate(()=>document.querySelector('#cue').style.opacity==='0'))
    await page.mouse.wheel(0,650);await page.waitForTimeout(180)
    verify('Source project header enters once and admits the native description',await page.locator('#body').getAttribute('data-kaspar-open')==='true')
    verify('Cue stays retired after the measured source scroll threshold',await page.evaluate(()=>document.querySelector('#cue').style.opacity==='0'))
    await page.waitForTimeout(1000)
    const before=await page.locator('#card0').boundingBox()
    const sampleGallery=async time=>page.evaluate(time=>{
        const gallery=document.querySelector('#gallery'),animation=gallery.getAnimations().find(a=>a.effect.getKeyframes().some(k=>'height' in k))
        if(!animation)return null
        animation.pause();animation.currentTime=time
        return {height:gallery.getBoundingClientRect().height,timing:animation.effect.getTiming(),frames:animation.effect.getKeyframes(),transitioning:gallery.dataset.kasparTransitioning}
    },time)
    const finishGallery=async()=>{await page.locator('#gallery').evaluate(gallery=>gallery.getAnimations().forEach(a=>a.finish()));await page.waitForFunction(()=>!document.querySelector('#gallery').hasAttribute('data-kaspar-transitioning'))}
    const galleryRest=(await page.locator('#gallery').boundingBox()).height
    await page.evaluate(()=>{window.headlineStyleChanges=0;window.headlineObserver=new MutationObserver(rows=>headlineStyleChanges+=rows.length);headlineObserver.observe(document.querySelector('#headline p'),{attributes:true,attributeFilter:['style']})})
    await page.locator('#card0').click({position:{x:50,y:50}})
    const expandStart=await sampleGallery(0),expandMiddle=await sampleGallery(325)
    await page.waitForTimeout(70)
    verify('Collection expansion retains its old height at0 and follows the source650ms concurrent timeline',expandStart?.timing.duration===650&&expandStart.timing.delay===0&&Math.abs(expandStart.height-galleryRest)<1&&expandMiddle.height>galleryRest+10&&expandStart.transitioning==='true')
    verify('Gallery height animation does not repeatedly refit the unchanged hero headline',await page.evaluate(()=>{headlineObserver.disconnect();return headlineStyleChanges===0}))
    await finishGallery();await page.waitForTimeout(700)
    const expanded=await page.locator('#card0').boundingBox()
    verify('Actual card click doubles one native card and reflows its sibling',Math.abs(expanded.width-before.width*2)<1&&await page.locator('#card0').getAttribute('aria-expanded')==='true'&&(await page.locator('#card1').boundingBox()).x>expanded.x+expanded.width-1)
    const galleryExpanded=(await page.locator('#gallery').boundingBox()).height
    await page.locator('#card0').focus();await page.keyboard.press('Enter')
    const collapseStart=await sampleGallery(0),collapseHeld=await sampleGallery(300),collapseMiddle=await sampleGallery(650)
    verify('Collection collapse holds450ms then shrinks over400ms rather than jumping below moving cards',collapseStart?.timing.duration===400&&collapseStart.timing.delay===450&&Math.abs(collapseStart.height-galleryExpanded)<1&&Math.abs(collapseHeld.height-galleryExpanded)<1&&collapseMiddle.height<galleryExpanded-10&&collapseMiddle.height>galleryRest+10)
    await finishGallery();await page.waitForTimeout(700)
    verify('Keyboard activation collapses the same native card',await page.locator('#card0').getAttribute('aria-expanded')==='false'&&Math.abs((await page.locator('#card0').boundingBox()).width-before.width)<1)
    verify('A finished gallery timeline clears only its temporary height and transition marker',await page.locator('#gallery').evaluate(gallery=>gallery.style.height==='auto'&&!gallery.hasAttribute('data-kaspar-transitioning')&&gallery.getAnimations().length===0))
    await page.locator('#link0').click();await page.waitForTimeout(50)
    verify('A real child link does not expand its containing media card',await page.locator('#card0').getAttribute('aria-expanded')==='false')
    await page.waitForTimeout(350)
    await page.locator('#card0').click({position:{x:50,y:50}});await sampleGallery(300)
    await page.locator('#card0').click({position:{x:50,y:50}});await page.waitForTimeout(30)
    const interrupted=await sampleGallery(300)
    verify('A rapid second card activation cancels the prior height owner without its late cancel clearing the new timeline',interrupted?.timing.delay===450&&interrupted.transitioning==='true'&&await page.locator('#card0').getAttribute('aria-expanded')==='false')
    await finishGallery();await page.waitForTimeout(700)
    await page.locator('#card0').click({position:{x:50,y:50}});await sampleGallery(300)
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(30)
    verify('Reduced motion settles a running gallery timeline into the selected natural layout immediately',await page.locator('#gallery').evaluate(gallery=>gallery.style.height==='auto'&&!gallery.hasAttribute('data-kaspar-transitioning')&&gallery.getAnimations().length===0)&&await page.locator('#card0').getAttribute('aria-expanded')==='true')
    await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#card0').click({position:{x:50,y:50}});await finishGallery();await page.waitForTimeout(700)
    await page.evaluate(()=>{block=true});await page.locator('#project-header').click();verify('Caller preventDefault suppresses the delegated project action',await page.locator('#body').getAttribute('data-kaspar-open')==='true')
    await page.evaluate(()=>{block=false});await page.locator('#project-header').click();verify('Source project header also supports explicit close',await page.locator('#body').getAttribute('data-kaspar-open')==='false')
    await page.waitForTimeout(370)
    await page.evaluate(()=>{const e={defaultPrevented:false};nativeProps['project-header'].onTap(e,{point:{x:1,y:1}});document.querySelector('#project-header').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}))})
    verify('A Framer onTap followed by its DOM click activates exactly once',await page.locator('#body').getAttribute('data-kaspar-open')==='true')
    await page.waitForTimeout(370)
    await page.evaluate(()=>{blockTap=true;const e={defaultPrevented:false,preventDefault(){this.defaultPrevented=true}};nativeProps['project-header'].onTap(e,{point:{x:1,y:1}});document.querySelector('#project-header').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));blockTap=false})
    verify('A caller-canceled native tap also suppresses its following DOM click',await page.locator('#body').getAttribute('data-kaspar-open')==='true')
    await page.waitForTimeout(370)
    await page.evaluate(()=>nativeProps.card0.onTap({defaultPrevented:false,target:document.querySelector('#link0')}))
    verify('A native tap retains its original child-link target exclusion',await page.locator('#card0').getAttribute('aria-expanded')==='false')
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(120)
    verify('Responsive headline is refitted after the real host resize',await page.evaluate(()=>+document.querySelector('#headline').dataset.kasparFontSize<70&&+document.querySelector('#headline').dataset.kasparFontSize>35))
    await page.locator('#card0').scrollIntoViewIfNeeded();await page.locator('#card0').click({position:{x:20,y:30}});await page.waitForTimeout(700)
    verify('Phone expands a two-column card to full native width',Math.abs((await page.locator('#card0').boundingBox()).width-380)<1)
    await page.emulateMedia({reducedMotion:'reduce'});await page.keyboard.press('a');await page.waitForTimeout(30)
    verify('Reduced motion suppresses procedural scanning',await page.locator('[data-kaspar-scan-box]').count()===0)
    await page.locator('#card0').focus();await page.keyboard.press('Enter')
    verify('Reduced motion retains immediate functional card toggles',await page.locator('#card0').getAttribute('aria-expanded')==='false'&&await page.evaluate(()=>document.querySelector('#card0').getAnimations().length===0))
    await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>scrollTo(0,0));await page.keyboard.press('a');await page.waitForTimeout(20)
    await page.evaluate(()=>scrollTo(0,950));await page.waitForTimeout(40)
    verify('The covered botanical field is hidden after the hero so its existing pool can release it',await page.evaluate(()=>document.querySelector('#field').style.opacity==='0'))
    for(const target of ['canvas','export','thumbnail']){
        await page.evaluate(t=>{window.target=t;render()},target);await page.waitForTimeout(40)
        verify(target+' keeps authored native geometry and mounts no effects',await page.locator('[data-kaspar-native-effects]').count()===0&&!await page.locator('#page').getAttribute('data-kaspar-current-page'))
        verify(target+' restores the authored botanical-field visibility',await page.evaluate(()=>document.querySelector('#field').style.opacity==='1'))
        verify(target+' releases gallery height ownership and restores its exact authored inline value',await page.locator('#gallery').evaluate(gallery=>gallery.style.height===''&&!gallery.hasAttribute('data-kaspar-transitioning')&&gallery.getAnimations().length===0))
        verify(target+' retains its deterministic fine-grid material',await page.evaluate(()=>getComputedStyle(document.querySelector('#fine')).backgroundImage.includes('repeating-linear-gradient')))
    }
    await page.evaluate(()=>{target='preview';staticRenderer=true;render()});await page.waitForTimeout(40)
    verify('Static renderer freezes independently of the nominal RenderTarget',await page.locator('[data-kaspar-native-effects]').count()===0)
    await page.evaluate(()=>{target='preview';staticRenderer=false;render()});await page.waitForTimeout(50)
    await page.evaluate(()=>{root.unmount()});await page.waitForTimeout(30);await page.keyboard.press('a');await page.keyboard.press('Shift+G')
    verify('Unmount releases all owned effects and key handling',await page.locator('[data-kaspar-native-effects],[data-kaspar-scan-box]').count()===0)
    verify('No uncaught browser errors',errors.length===0)
    const result={passed:true,source:{path:file,bytes:Buffer.byteLength(source),sha256:crypto.createHash('sha256').update(source).digest('hex')},checks,errors,scope:'Actual React/native DOM fixture with real pointer, keyboard, host resize and expansion. Test-owned color media/monospace text are not source visual-fidelity or Framer Preview evidence.'}
    fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n')
    console.log(JSON.stringify({passed:true,checks:checks.length,evidence:path.join(out,'result.json')}))
} catch (error) {
    fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:String(error),errors,checks,html:await page.content()},null,2)+'\n')
    console.error(JSON.stringify({error:String(error),errors,completedChecks:checks.length,evidence:path.join(out,'failure.json')}))
    throw error
} finally { await browser.close() }
