import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import assert from 'node:assert/strict'
const repo=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url),ts=require('typescript'),{chromium}=require('@playwright/test')
const pin=p=>{const b=fs.readFileSync(p);return{path:p,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')}}
const sourceFile=path.join(repo,'docs/design-studies/code-components/SourceMacMossPortfolio.tsx'),source=fs.readFileSync(sourceFile,'utf8'),outBase=process.env.MONARCHIC_MACMOSS_INTERPOLATION_EVIDENCE_DIR??'/tmp/monarchic-source-macmoss-interpolation'
assert.equal(pin(sourceFile).sha256,'4d7ac453093751aecf0c356f6ea19dda694033062cd5e50c075826ac1f7796e1');fs.mkdirSync(outBase,{recursive:true});const out=fs.mkdtempSync(path.join(outBase,'run-'))
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText
const react=fs.readFileSync(path.join(path.dirname(require.resolve('react/package.json')),'umd/react.development.js'),'utf8'),dom=fs.readFileSync(path.join(path.dirname(require.resolve('react-dom/package.json')),'umd/react-dom.development.js'),'utf8')
let browser,context,page,failure=null;const cases=[],errors=[],closure={mouseReleased:false,contextClosed:false,browserClosed:false}
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message))
 await page.setContent('<!doctype html><style>body{margin:20px}button{font:14px sans-serif}</style><div id="mount"></div>');await page.addScriptTag({content:react});await page.addScriptTag({content:dom})
 await page.evaluate(()=>{window.exports={};window.require=n=>n==='react'?window.React:{RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail',current:()=> 'preview'},useIsStaticRenderer:()=>false}})
 await page.addScriptTag({content:'(function(exports){'+code+'})(window.exports);'})
 await page.evaluate(()=>{
  const E=React.createElement
  const Native=React.forwardRef((props,ref)=>{const{onTap,onClick,onPointerUp,text,...rest}=props;return E('div',{...rest,ref,onClick,onPointerUp:e=>{if(rest.id==='viewport'||rest.id==='next')window.__triggerAt=performance.now();onTap?.(e.nativeEvent,{point:{x:e.clientX,y:e.clientY}});onPointerUp?.(e)}},text??props.children)})
  window.H={Root:exports.withMacMossPortfolio(Native),View:exports.withMacMossIdahoViewport(Native),Photos:Array.from({length:4},(_,i)=>exports['withMacMossIdahoPhoto0'+(i+1)](Native)),Next:exports.withMacMossIdahoNext(Native)};window.__root=null;window.__triggerAt=null
  window.mount=()=>{if(__root)__root.unmount();__triggerAt=null;__root=ReactDOM.createRoot(document.getElementById('mount'));__root.render(E(H.Root,{id:'portfolio',style:{position:'relative',width:800,height:710}},E(H.View,{id:'viewport',style:{position:'relative',width:800,height:640}},...H.Photos.map((Photo,i)=>E(Photo,{key:i,id:'p'+i,style:{position:'absolute',left:0,top:0,width:800,height:640,backgroundColor:['#bbf','#bfb','#fbb','#ffb'][i]}},E('span',{style:{pointerEvents:'none'}},'Editable native photo '+i)))),E(H.Next,{id:'next',style:{position:'absolute',left:0,top:650,width:100,height:36}},'Next')))}
  window.sample=()=>({now:performance.now(),elapsed:performance.now()-__triggerAt,index:Number(document.getElementById('portfolio').dataset.sourceMacSlide),phase:document.getElementById('portfolio').dataset.sourceMacPhase,photos:[...document.querySelectorAll('[data-source-mac-photo]')].map(n=>{const s=getComputedStyle(n);return{id:n.id,selected:n.dataset.sourceMacSelected==='true',visible:s.opacity==='1'&&s.visibility==='visible',offset:new DOMMatrixReadOnly(s.transform).m41,duration:s.transitionDuration,timing:s.transitionTimingFunction,animations:n.getAnimations().map(a=>{const t=a.effect?.getComputedTiming();return{kind:a.constructor.name,property:a.transitionProperty,playState:a.playState,currentTime:a.currentTime,startTime:a.startTime,progress:t?.progress,duration:t?.duration,easing:t?.easing}})}})})
 })
 const between=(x,a,b)=>x>Math.min(a,b)&&x<Math.max(a,b)
 for(const kind of ['photo-click','arrow-next','drag-commit48','drag-return8']){
  await page.evaluate(()=>mount());await page.waitForFunction(()=>document.querySelectorAll('[data-source-mac-photo]').length===4);await page.waitForTimeout(160)
  // No fake clock, explicit React flush, getComputedStyle, getAnimations or
  // rectangle read occurs between the real input and the100ms sample.
  if(kind==='photo-click')await page.mouse.click(604,340)
  else if(kind==='arrow-next')await page.mouse.click(70,688)
  else{const distance=kind==='drag-commit48'?384:64;await page.mouse.move(604,340);await page.mouse.down();for(let i=1;i<=8;i++){await page.mouse.move(604-distance*i/8,340);await page.waitForTimeout(20)}await page.mouse.up()}
  const samples=[]
  for(const target of [100,250,550]){const wait=await page.evaluate(target=>Math.max(0,target-(performance.now()-__triggerAt)),target);if(wait)await page.waitForTimeout(wait);samples.push(await page.evaluate(()=>sample()))}
  const targetIndex=kind==='drag-return8'?1:2,first=samples[0],middle=samples[1],end=samples[2]
  const starts=kind==='drag-commit48'?[-384,416]:kind==='drag-return8'?[-64,736]:[0,800],ends=kind==='drag-return8'?[0,800]:[-800,0]
  const moving=samples.slice(0,2).every(s=>s.phase==='moving'&&s.photos.slice(0,2).every((p,i)=>p.visible&&between(p.offset,starts[i],ends[i])&&p.animations.some(a=>a.kind==='CSSTransition'&&a.property==='transform'&&a.progress>0&&a.progress<1&&a.currentTime>0&&a.currentTime<500)))
  const settled=end.phase==='settled'&&end.index===targetIndex&&end.photos.filter(p=>p.visible).length===1&&end.photos.find(p=>p.selected)?.offset===0
  cases.push({kind,expectedStarts:starts,expectedEnds:ends,expectedIndex:targetIndex,firstSampleAfter100ms:true,movingIntermediateAt100And250:moving,settledAt550:settled,samples})
  fs.writeFileSync(path.join(out,'in-progress.json'),JSON.stringify({source:pin(sourceFile),cases,errors},null,2)+'\n')
 }
 if(!cases.every(c=>c.movingIntermediateAt100And250&&c.settledAt550))failure={message:'At least one real unflushed CSS transition lacks moving native-photo intermediates; inspect case samples.'}
}catch(e){failure={message:e.message,stack:e.stack}}
finally{try{await page?.mouse.up();closure.mouseReleased=true}catch{};try{await context?.close();closure.contextClosed=true}catch{};try{await browser?.close();closure.browserClosed=true}catch{};const result={status:failure?'REAL_CSS_PROBE_FAILED':'REAL_CSS_PROBE_PASSED',source:pin(sourceFile),probe:pin(fileURLToPath(import.meta.url)),cases,errors,failure,closure,scope:'One bounded real-wallclock NativeDOM animationprobe; no fakeclock or after-input styleflush before100ms; no canonical/Framer changes.'};fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,cases:cases.map(c=>({kind:c.kind,moving:c.movingIntermediateAt100And250,settled:c.settledAt550})),errors,failure,closure,evidence:out},null,2))}
if(failure||errors.length)process.exitCode=1
