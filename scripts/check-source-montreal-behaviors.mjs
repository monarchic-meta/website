import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {chromium} from '@playwright/test'
const repo=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url),ts=require('typescript')
const file=path.resolve(process.env.MONARCHIC_MONTREAL_SOURCE_PATH??path.join(repo,'docs/design-studies/code-components/SourceMontrealBehaviors.tsx')),source=fs.readFileSync(file,'utf8'),hash=x=>crypto.createHash('sha256').update(x).digest('hex')
const dir=process.env.MONARCHIC_MONTREAL_BEHAVIORS_EVIDENCE_DIR??'/tmp/monarchic-source-montreal-behaviors';fs.mkdirSync(dir,{recursive:true})
const reactTypes=`export interface CSSProperties{[key:string]:string|number|undefined};export type ReactNode=unknown;export type ComponentType<P>=(props:P)=>unknown;export type ForwardedRef<T>=((value:T|null)=>void)|{current:T|null}|null;export interface RefObject<T>{readonly current:T|null};export function forwardRef<T,P>(render:(props:P,ref:ForwardedRef<T>)=>unknown):ComponentType<P>;export function useRef<T>(value:T):{current:T};export function useRef<T>(value:T|null):RefObject<T>;export function useState<T>(value:T):[T,(value:T|((previous:T)=>T))=>void];export function useEffect(effect:()=>void|(()=>void),deps:unknown[]):void;export const useLayoutEffect:typeof useEffect;export interface Context<T>{Provider:ComponentType<{value:T;children?:unknown}>};export function createContext<T>(value:T):Context<T>;export function useContext<T>(context:Context<T>):T;export function useSyncExternalStore<T>(subscribe:(notify:()=>void)=>()=>void,snapshot:()=>T,server:()=>T):T;export function useId():string;export function createElement(...args:unknown[]):unknown;export const Fragment:ComponentType<{children?:unknown}>;export interface MouseEvent<T>{currentTarget:T;defaultPrevented:boolean;preventDefault():void};export interface KeyboardEvent<T>extends MouseEvent<T>{key:string};export type MouseEventHandler<T>=(event:MouseEvent<T>)=>void;export type KeyboardEventHandler<T>=(event:KeyboardEvent<T>)=>void;declare global{namespace JSX{interface IntrinsicElements{[key:string]:unknown}}}`
const defs=new Map([[path.join(repo,'__montreal-react.d.ts'),reactTypes],[path.join(repo,'__montreal-framer.d.ts'),'export const RenderTarget:{canvas:string;export:string;thumbnail:string;current():string};export function useIsStaticRenderer():boolean;']])
const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Node10,jsx:ts.JsxEmit.React,baseUrl:repo,paths:{react:['__montreal-react.d.ts'],framer:['__montreal-framer.d.ts']}}
const host=ts.createCompilerHost(options),read=host.readFile.bind(host),exists=host.fileExists.bind(host);host.readFile=p=>defs.get(p)??read(p);host.fileExists=p=>defs.has(p)||exists(p);host.getSourceFile=(p,v)=>{const s=host.readFile(p);return s===undefined?undefined:ts.createSourceFile(p,s,v,true)}
const diagnostics=ts.getPreEmitDiagnostics(ts.createProgram([file],options,host));assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>repo,getCanonicalFileName:x=>x,getNewLine:()=> '\n'}))
assert.doesNotMatch(source,/\bfetch\(|getContext\(|querySelector|getElementById|@ts-ignore|\bas any\b/)
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,dts=ts.transpileDeclaration(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;assert.ok(Buffer.byteLength(js)+Buffer.byteLength(dts)<1048576)
const react=fs.readFileSync(path.join(path.dirname(require.resolve('react/package.json')),'umd/react.development.js'),'utf8'),dom=fs.readFileSync(path.join(path.dirname(require.resolve('react-dom/package.json')),'umd/react-dom.development.js'),'utf8'),checks=[],errors=[],check=(name,value)=>{assert.ok(value,name);checks.push(name)}
const insetReport={desktop:[],phone:[],crossovers:[],lastAssertion:null};
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH})
try {
 const page=await browser.newPage({viewport:{width:1550,height:1000}});page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(5000)
 await page.clock.install({time:new Date('2026-11-01T12:00:00Z')});await page.clock.pauseAt(new Date('2026-11-01T12:00:01Z'))
 await page.setContent('<!doctype html><style>*{box-sizing:border-box}html,body{margin:0;font:16px Arial}#mount{padding:10px}</style><div id="mount"></div>');await page.addScriptTag({content:react});await page.addScriptTag({content:dom})
 await page.evaluate(()=>{window.exports={};window.__target='preview';window.__width=1440;window.__mode='tap';window.__cancel=false;window.__calls={tap:0,click:0};window.__refs={};window.__timers=new Set();const set=setTimeout.bind(window),clear=clearTimeout.bind(window);window.setTimeout=(fn,ms)=>{const id=set(()=>{__timers.delete(id);fn()},ms);__timers.add(id);return id};window.clearTimeout=id=>{__timers.delete(id);clear(id)};window.require=n=>n==='react'?window.React:{RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail',current:()=>__target},useIsStaticRenderer:()=>__target==='export'||__target==='thumbnail'}})
 await page.addScriptTag({content:'(function(require,exports){'+js+'})(window.require,window.exports)'})
 await page.evaluate(()=>{
  const E=React.createElement,Native=React.forwardRef((props,ref)=>{const{onTap,onClick,onPointerUp,onHoverStart,onHoverEnd,onKeyDown,text,...rest}=props;return E('div',{...rest,ref,onClick:__mode==='tap'?undefined:onClick,onKeyDown:e=>{onKeyDown?.(e);window.__lastKeyPrevented=e.defaultPrevented},onPointerUp:e=>{onPointerUp?.(e);if(__mode!=='click')onTap?.(e.nativeEvent,{point:{x:e.clientX,y:e.clientY}})},onPointerEnter:e=>onHoverStart?.(e.nativeEvent),onPointerLeave:e=>onHoverEnd?.(e.nativeEvent)},text??props.children)})
  window.H={Cards:exports.withMontrealPostcards(Native),Front:exports.withMontrealPostcardFront(Native),Back:exports.withMontrealPostcardBack(Native),Playback:exports.withMontrealPlayback(Native),Label:exports.withMontrealPlaybackLabel(Native),Attractions:exports.withMontrealAttractions(Native),Heading:exports.withMontrealAttractionHeading(Native),Body:exports.withMontrealAttractionBody(Native),Panes:Array.from({length:11},(_,i)=>exports['withMontrealAttraction'+String(i+1).padStart(2,'0')](Native)),Chart:exports.withMontrealChart(Native),Display:exports.withMontrealDisplayMode(Native),Text:exports.withMontrealTextMode(Native),Weights:Array.from({length:11},(_,i)=>exports['withMontrealWeight'+String(i+1).padStart(2,'0')](Native)),DisplaySpecimen:exports.withMontrealDisplaySpecimen(Native),TextSpecimen:exports.withMontrealTextSpecimen(Native)}
  window.__root=ReactDOM.createRoot(document.getElementById('mount'))
  const handlers={onTap:e=>{__calls.tap++;if(__cancel)e.preventDefault()},onClick:()=>__calls.click++}
  window.render=()=>ReactDOM.flushSync(()=>__root.render(E(React.Fragment,null,
   E(H.Cards,{id:'cards',ref:n=>__refs.cards=n,style:{position:'relative',width:380,height:130}},E(H.Front,{id:'front',style:{position:'absolute',width:180,height:100,background:'#e6332b'},'data-source-asset':'front'},'Native front'),E(H.Back,{id:'back',style:{position:'absolute',width:180,height:100,background:'#17395b'},'data-source-asset':'back'},'Native back')),
   E(H.Playback,{id:'playback',...handlers,style:{height:40,width:150}},E(H.Label,{})),
   E(H.Attractions,{id:'attractions',ref:n=>__refs.attractions=n,style:{position:'relative',width:__width,height:750}},...H.Panes.map((P,i)=>E(P,{id:'pane-'+i,key:i,...handlers,style:{background:'hsl('+i*30+',70%,60%)'}},E(H.Heading,{id:'heading-'+i,style:{position:'absolute',width:300,height:50}},'Attraction '+i),E(H.Body,{id:'body-'+i,style:{position:'absolute',height:80}},'Editable native description')))),
   E(H.Chart,{id:'chart',style:{position:'relative',width:700,height:500,marginTop:30}},E(H.Display,{id:'display',...handlers,style:{position:'absolute',left:10,top:10,width:120,height:40}},'Display'),E(H.Text,{id:'text',...handlers,style:{position:'absolute',left:150,top:10,width:120,height:40}},'Text'),...H.Weights.map((W,i)=>E(W,{id:'weight-'+i,key:i,...handlers,style:{position:'absolute',left:10,top:60+i*30,width:160,height:28}})),E(H.DisplaySpecimen,{id:'specimen-display',style:{position:'absolute',left:240,top:80,width:450,fontFamily:'Arial'}},E('p',{style:{fontVariationSettings:'"wght" 400'}},'Editable native Display')),E(H.TextSpecimen,{id:'specimen-text',style:{position:'absolute',left:240,top:80,width:450,fontFamily:'Georgia'}},E('p',{style:{fontVariationSettings:'"wght" 400'}},'Editable native Text'))))));render()
 })
 await page.waitForFunction(()=>document.getElementById('attractions').dataset.montrealAttractionsPhone==='false')
 check('Native roots preserve exact refs and no renderer allocation',await page.evaluate(()=>__refs.cards===document.getElementById('cards')&&__refs.attractions===document.getElementById('attractions')&&!document.querySelector('canvas')))
 await page.clock.runFor(2190);check('Postcard native front remains before initial source threshold',await page.locator('#front').evaluate(e=>getComputedStyle(e).opacity==='1'))
 await page.clock.runFor(40);await page.waitForTimeout(10);check('Genuine native face bindings switch after2.2s',await page.locator('#back').evaluate(e=>getComputedStyle(e).opacity==='1'&&e.dataset.sourceAsset==='back'))
 await page.locator('#playback').click();await page.clock.runFor(4000);check('Actual native-tap playback holds postcard face',await page.locator('#back').evaluate(e=>getComputedStyle(e).opacity==='1'))
 await page.locator('#playback').click();await page.clock.runFor(1810);await page.waitForTimeout(10);check('Repeated tap resumes timed face cycle',await page.locator('#front').evaluate(e=>getComputedStyle(e).opacity==='1'))
 await page.locator('#pane-3').hover({force:true});await page.clock.runFor(800);await page.waitForTimeout(800)
 let geometry=await page.locator('[data-montreal-attraction]').evaluateAll(es=>es.map(e=>({left:parseFloat(e.style.left),width:parseFloat(e.style.width),expanded:e.getAttribute('aria-expanded')})))
 fs.writeFileSync(path.join(dir,'desktop-pane-geometry.json'),JSON.stringify(geometry,null,2)+'\n')
 check('Desktop hover opens correct pane with exact4.8:1 ratio and complete width',geometry[3].expanded==='true'&&Math.abs(geometry[3].width/geometry[2].width-4.8)<1e-4&&Math.abs(geometry.reduce((n,g)=>n+g.width,0)-1440)<.01&&Math.abs(geometry[10].left+geometry[10].width-1440)<.01)
 await page.mouse.move(1540,5);check('Leaving desktop accordion returns first pane',await page.locator('#attractions').evaluate(e=>e.dataset.montrealAttractions==='0'))
 await page.locator('#text').click();check('Native text family tab clamps900 to supported700',await page.locator('#chart').evaluate(e=>e.dataset.montrealChartFamily==='text'&&e.dataset.montrealChartWeight==='700'))
 check('Actual native Text specimen switches while Display is hidden',await page.evaluate(()=>getComputedStyle(document.getElementById('specimen-text')).opacity==='1'&&getComputedStyle(document.getElementById('specimen-display')).opacity==='0'))
 check('Seven source Text names replace labels and unused labels cannot receive focus',await page.evaluate(()=>document.getElementById('weight-0').textContent==='Thin'&&document.getElementById('weight-6').textContent==='Bold'&&document.getElementById('weight-7').tabIndex===-1))
 await page.locator('#weight-1').press('Enter');check('Keyboard selects Text Light300 on nested native text',await page.evaluate(()=>document.getElementById('chart').dataset.montrealChartWeight==='300'&&getComputedStyle(document.querySelector('#specimen-text p')).fontVariationSettings==='"wght" 300'))
 await page.evaluate(()=>{__mode='dual';render()});await page.clock.runFor(400);await page.locator('#display').click();check('Dual tap/click returns Display without a second action',await page.locator('#chart').evaluate(e=>e.dataset.montrealChartFamily==='display'&&e.dataset.montrealChartWeight==='300'))
 for(const [family,weights,mode,specimen] of [['display',[100,150,250,300,350,400,500,600,700,800,900],'display','specimen-display'],['text',[250,300,350,400,500,600,700],'text','specimen-text']]){await page.locator('#'+mode).click();for(let i=0;i<weights.length;i++){await page.locator('#weight-'+i).press('Enter');check(family+' actual native selection '+weights[i],await page.evaluate(({family,weight,specimen})=>document.getElementById('chart').dataset.montrealChartFamily===family&&Number(document.getElementById('chart').dataset.montrealChartWeight)===weight&&getComputedStyle(document.querySelector('#'+specimen+' p')).fontVariationSettings==='"wght" '+weight,{family,weight:weights[i],specimen}))}}
 await page.evaluate(()=>{__width=390;__mode='tap';render()});await page.waitForFunction(()=>document.getElementById('attractions').dataset.montrealAttractionsPhone==='true'&&document.getElementById('attractions').dataset.montrealAttractions==='-1')
 await page.clock.runFor(400);await page.locator('#pane-4').click({force:true});check('Native Phone tap opens authored74px header plus260px body',await page.evaluate(()=>document.getElementById('attractions').dataset.montrealAttractions==='4'&&parseFloat(document.getElementById('pane-4').style.height)===334&&parseFloat(document.getElementById('pane-5').style.top)===790&&parseFloat(document.getElementById('attractions').style.height)===1280))
 await page.locator('#pane-4').click({force:true});check('Second same-channel Phone tap closes its panel',await page.locator('#attractions').evaluate(e=>e.dataset.montrealAttractions==='-1'))
 await page.evaluate(()=>{__cancel=true;render()});await page.locator('#pane-4').click({force:true});check('Canceled native tap leaves Phone pane closed',await page.locator('#attractions').evaluate(e=>e.dataset.montrealAttractions==='-1'));await page.evaluate(()=>{__cancel=false;render()})
 // External focused extension: actual direct-child DOM edges, not source-string assertions.
 const nearInset=(actual,expected)=>Math.abs(actual-expected)<.12
 const settleInset=async()=>{await page.clock.runFor(900);await page.waitForTimeout(820)}
 const readInset=async index=>page.evaluate(index=>{
  const owner=document.getElementById('attractions'),panel=document.getElementById('pane-'+index),body=document.getElementById('body-'+index)
  const o=owner.getBoundingClientRect(),p=panel.getBoundingClientRect(),b=body.getBoundingClientRect(),style=getComputedStyle(body)
  const panels=Array.from(owner.querySelectorAll('[data-montreal-attraction]')).map(node=>{const r=node.getBoundingClientRect();return{left:r.left-o.left,right:r.right-o.left,width:r.width,expanded:node.getAttribute('aria-expanded')}})
  return{index,ownerWidth:owner.clientWidth,active:Number(owner.dataset.montrealAttractions),phone:owner.dataset.montrealAttractionsPhone==='true',directChild:body.parentElement===panel,bodyLeft:b.left-p.left,bodyTop:b.top-p.top,bodyWidth:b.width,rightInset:p.right-b.right,panelLeft:p.left-o.left,panelWidth:p.width,panelHeight:p.height,ownerHeight:o.height,bodyOpacity:Number(style.opacity),paddingLeft:parseFloat(style.paddingLeft),paddingRight:parseFloat(style.paddingRight),panels,calls:{...__calls}}
 },index)
 const resizeInset=async(width,phone)=>{
  await page.setViewportSize({width:Math.max(1200,width+180),height:1000})
  await page.mouse.move(Math.max(1100,width+100),5)
  await page.evaluate(width=>{__width=width;__target='preview';__mode='tap';__cancel=false;render()},width)
  await page.waitForFunction(({width,phone})=>{const n=document.getElementById('attractions');return n.clientWidth===width&&(n.dataset.montrealAttractionsPhone==='true')===phone},{width,phone})
  await settleInset()
 }
 const desktopInsetMatches=row=>{
  const openWidth=row.ownerWidth*4.8/14.8
  return !row.phone&&row.active===row.index&&row.directChild&&nearInset(row.panelWidth,openWidth)&&nearInset(row.bodyLeft,125)&&nearInset(row.bodyWidth,openWidth-149)&&nearInset(row.rightInset,24)&&row.paddingLeft===0&&row.paddingRight===0&&row.bodyOpacity===1
 }
 for(const width of [1024,1280,1440,1920]){
  await resizeInset(width,false)
  for(const index of [0,3,10]){
   await page.locator('#pane-'+index).hover({force:true});await settleInset()
   const row=await readInset(index);insetReport.desktop.push(row)
   insetReport.lastAssertion='INSET/Desktop body edge '+width+' panel'+index
   check(insetReport.lastAssertion,desktopInsetMatches(row))
   // Chromium rounds each independent box to1/64px. Summing eleven rounded
   // widths discards the separately rounded positions; assert every edge and
   // width against that concrete layout quantum instead of an aggregate sum.
   const layoutQuantum=1/64+1e-8,atLayoutEdge=(actual,expected)=>Math.abs(actual-expected)<=layoutQuantum
   check('INSET/Desktop siblings retain source ratio and continuous layout edges '+width+' panel'+index,row.panels.length===11&&atLayoutEdge(row.panels[0].left,0)&&atLayoutEdge(row.panels[10].right,width)&&row.panels.every((p,i)=>atLayoutEdge(p.width,width/14.8*(i===index?4.8:1))&&(i===0||atLayoutEdge(p.left,row.panels[i-1].right))))
  }
  await page.mouse.move(width+100,5);await settleInset()
  check('INSET/Desktop leave retains first-panel reset '+width,await page.locator('#attractions').evaluate(n=>n.dataset.montrealAttractions==='0'))
 }
 for(const width of [390,1023]){
  await resizeInset(width,true)
  await page.waitForFunction(()=>document.getElementById('attractions').dataset.montrealAttractions==='-1')
  const before=await readInset(4);insetReport.phone.push({stage:'closed',...before})
  check('INSET/Phone initial geometry '+width,before.phone&&before.active===-1&&before.directChild&&nearInset(before.bodyLeft,58)&&nearInset(before.bodyWidth,width-82)&&nearInset(before.bodyTop,82)&&nearInset(before.rightInset,24)&&nearInset(before.panelHeight,74)&&before.bodyOpacity===0)
  await page.clock.runFor(400);await page.locator('#pane-4').click({force:true});await settleInset()
  const opened=await readInset(4);insetReport.phone.push({stage:'opened',...opened})
  check('INSET/Phone open body retains source-separated adaptation '+width,opened.phone&&opened.active===4&&opened.directChild&&nearInset(opened.bodyLeft,58)&&nearInset(opened.bodyWidth,width-82)&&nearInset(opened.bodyTop,82)&&nearInset(opened.rightInset,24)&&nearInset(opened.panelHeight,334)&&nearInset(opened.ownerHeight,1280)&&opened.bodyOpacity===1&&opened.paddingLeft===0&&opened.paddingRight===0)
  check('INSET/Phone native tap callback forwarded once without click '+width,opened.calls.tap===before.calls.tap+1&&opened.calls.click===before.calls.click)
  check('INSET/Phone following pane shifts once '+width,nearInset(opened.panels[5].left,0)&&await page.locator('#pane-5').evaluate(n=>Math.abs(parseFloat(n.style.top)-790)<.12))
  await page.clock.runFor(400);await page.locator('#pane-4').click({force:true});await settleInset()
  const closed=await readInset(4);insetReport.phone.push({stage:'collapsed',...closed})
  check('INSET/Phone same-item collapse and callback '+width,closed.active===-1&&nearInset(closed.panelHeight,74)&&nearInset(closed.ownerHeight,1020)&&closed.bodyOpacity===0&&nearInset(closed.bodyLeft,58)&&nearInset(closed.bodyWidth,width-82)&&closed.calls.tap===opened.calls.tap+1&&closed.calls.click===opened.calls.click)
  await page.evaluate(()=>{__cancel=true;render()});await page.clock.runFor(400);await page.locator('#pane-4').click({force:true});await settleInset()
  const canceled=await readInset(4);insetReport.phone.push({stage:'canceled',...canceled})
  check('INSET/Phone canceled callback prevents expansion '+width,canceled.active===-1&&nearInset(canceled.panelHeight,74)&&canceled.bodyOpacity===0&&canceled.calls.tap===closed.calls.tap+1&&canceled.calls.click===closed.calls.click)
  await page.evaluate(()=>{__cancel=false;render()})
 }
 // Open at1023, cross to Desktop1024, then reverse: all reuse the same mounted owners.
 await page.clock.runFor(400);await page.locator('#pane-4').click({force:true});await settleInset()
 const beforeCross=await readInset(4);insetReport.crossovers.push({stage:'Phone1023-open',...beforeCross})
 check('INSET/Crossover starts with open Phone owner',beforeCross.ownerWidth===1023&&beforeCross.phone&&beforeCross.active===4&&nearInset(beforeCross.bodyLeft,58))
 await resizeInset(1024,false);await page.waitForFunction(()=>document.getElementById('attractions').dataset.montrealAttractions==='0');await settleInset()
 const desktopCross=await readInset(0);insetReport.crossovers.push({stage:'Desktop1024-reset',...desktopCross})
 check('INSET/Crossover1023 to1024 applies single Desktop inset and reset',desktopInsetMatches(desktopCross))
 await resizeInset(1023,true);await page.waitForFunction(()=>document.getElementById('attractions').dataset.montrealAttractions==='-1');await settleInset()
 const phoneCross=await readInset(4);insetReport.crossovers.push({stage:'Phone1023-reset',...phoneCross})
 check('INSET/Crossover1024 to1023 restores Phone closed geometry',phoneCross.phone&&phoneCross.active===-1&&nearInset(phoneCross.bodyLeft,58)&&nearInset(phoneCross.bodyWidth,941)&&nearInset(phoneCross.panelHeight,74))
 // Restore the original harness precondition before its retained reduced/static/cleanup checks.
 await resizeInset(390,true);await page.waitForFunction(()=>document.getElementById('attractions').dataset.montrealAttractions==='-1');await page.setViewportSize({width:1550,height:1000})
 fs.writeFileSync(path.join(dir,'attraction-inset-dom-geometry.json'),JSON.stringify(insetReport,null,2)+'\n')

 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(10);await page.locator('#pane-2').click({force:true});check('Reduced motion keeps interactive selection but disables transition',await page.locator('#pane-2').evaluate(e=>e.getAttribute('aria-expanded')==='true'&&e.style.transition==='none'))
 for(const target of ['canvas','export','thumbnail']){await page.evaluate(target=>{__target=target;render()},target);await page.clock.runFor(400);await page.locator('#pane-2').click({force:true});await page.locator('#pane-2').press('Space');check(target+' preserves native editor key default',await page.evaluate(()=>__lastKeyPrevented===false));check(target+' freezes source states and uses measured Phone width',await page.evaluate(()=>document.getElementById('attractions').dataset.montrealAttractions==='-1'&&parseFloat(document.getElementById('pane-2').style.width)===390&&getComputedStyle(document.getElementById('front')).opacity==='1'&&document.getElementById('chart').dataset.montrealChartWeight==='900'))}
 await page.screenshot({path:path.join(dir,'phone-native-controls.png')});await page.evaluate(()=>ReactDOM.flushSync(()=>__root.unmount()));check('Shared motion playback subscriptions release on unmount',await page.evaluate(()=>window[Symbol.for('monarchic.sourceMontreal.playback.v1')].listeners.size===0));check('Postcard timeout releases on unmount',await page.evaluate(()=>__timers.size===0));check('Actual native refs clear on unmount',await page.evaluate(()=>Object.values(__refs).every(x=>x===null)));check('No actual React browser errors',errors.length===0)
 const result={passed:true,insetReport,sourceSHA256:hash(source),sourceBytes:Buffer.byteLength(source),testSHA256:hash(fs.readFileSync(import.meta.filename)),checks,errors,scope:'Strict semantic types and actual React18/Chromium native adapter droppingonClick; timing, pause, source width ratio, hover reset, Phone flow height,18weight states, real nested CSS, refs/cancellation/static/reduced. Fixture colors and Arial/Georgia are owned test material, not original source appearance or actual Framer font proof.'};fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:true,checks:checks.length,sourceSHA256:result.sourceSHA256,evidence:dir},null,2))
}catch(error){fs.writeFileSync(path.join(dir,'failure.json'),JSON.stringify({error:String(error),checks,errors,insetReport},null,2)+'\n');throw error}finally{await browser.close()}
