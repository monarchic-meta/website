import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const repo=process.env.MONARCHIC_REPO_ROOT??fileURLToPath(new URL('../',import.meta.url)),require=createRequire(path.join(repo,'package.json'));
const ts=require('typescript'),{chromium}=require('@playwright/test');
const file=process.env.MONARCHIC_BLEIBT_FIELD_SOURCE_PATH??path.join(repo,'docs/design-studies/code-components/SourceBleibtProjectField.tsx'),source=fs.readFileSync(file,'utf8');
const evidence=process.env.MONARCHIC_BLEIBT_FIELD_EVIDENCE_DIR??'/tmp/monarchic-source-bleibt-project-field';fs.mkdirSync(evidence,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const declarations=new Map([
 [path.join(repo,'__field-react.d.ts'),`export interface CSSProperties{[key:string]:string|number|undefined};export type ComponentType<P={}>=(props:P)=>unknown;export type ForwardedRef<T>=((value:T|null)=>void)|{current:T|null}|null;export interface MutableRefObject<T>{current:T};export function forwardRef<T,P>(render:(props:P,ref:ForwardedRef<T>)=>unknown):ComponentType<P>;export function useRef<T>(value:T):MutableRefObject<T>;export function useState<T>(value:T):[T,(value:T|((prior:T)=>T))=>void];export function useEffect(effect:()=>void|(()=>void),deps:unknown[]):void;export const useLayoutEffect:typeof useEffect;export interface Context<T>{Provider:ComponentType<{value:T;children?:unknown}>};export function createContext<T>(value:T):Context<T>;export function useContext<T>(context:Context<T>):T;export function createElement(...args:unknown[]):unknown;export interface MouseEvent<T>{currentTarget:T;target:EventTarget;defaultPrevented:boolean};export interface PointerEvent<T> extends MouseEvent<T>{button:number;clientX:number;clientY:number;pointerId:number;pointerType:string};export type MouseEventHandler<T>=(event:MouseEvent<T>)=>void;export type PointerEventHandler<T>=(event:PointerEvent<T>)=>void;declare global{namespace JSX{interface IntrinsicElements{[key:string]:unknown}}}`],
 [path.join(repo,'__field-framer.d.ts'),`export const RenderTarget:{canvas:string;current():string};export function useIsStaticRenderer():boolean;`],
]);
const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Node10,jsx:ts.JsxEmit.React,baseUrl:repo,paths:{react:['__field-react.d.ts'],framer:['__field-framer.d.ts']}};
const host=ts.createCompilerHost(options),read=host.readFile.bind(host),exists=host.fileExists.bind(host);host.readFile=p=>declarations.get(p)??read(p);host.fileExists=p=>declarations.has(p)||exists(p);host.getSourceFile=(p,v)=>{const s=host.readFile(p);return s===undefined?undefined:ts.createSourceFile(p,s,v,true)};
const diagnostics=ts.getPreEmitDiagnostics(ts.createProgram([file],options,host));assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics.slice(0,12),{getCurrentDirectory:()=>repo,getCanonicalFileName:x=>x,getNewLine:()=> '\n'}));
assert.ok(!/getContext\(|fetch\(|querySelector|innerHTML|@ts-ignore/.test(source));
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
const React=require('react'),module={exports:{}};vm.runInNewContext(`(function(require,exports){${js}\n})(require,module.exports)`,{module,require:name=>name==='react'?React:{RenderTarget:{canvas:'canvas',current:()=> 'preview'},useIsStaticRenderer:()=>false}});
const Layer=React.forwardRef((props,ref)=>React.createElement('div',{...props,ref}));const ssr=require('react-dom/server').renderToString(React.createElement(module.exports.withBleibtProjectField(Layer),{'data-native':'retained'},React.createElement(module.exports.withBleibtProject01(Layer),{'data-picture':'actual-native-fill'})));
assert.ok(ssr.includes('data-picture="actual-native-fill"')&&ssr.includes('data-native="retained"')&&!ssr.includes('NaN'));
const react=fs.readFileSync(path.join(path.dirname(require.resolve('react/package.json')),'umd/react.development.js'),'utf8'),reactDOM=fs.readFileSync(path.join(path.dirname(require.resolve('react-dom/package.json')),'umd/react-dom.development.js'),'utf8');
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}),errors=[],reports=[];
try{
 const page=await browser.newPage({viewport:{width:800,height:800}});page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<!doctype html><style>body{margin:0;background:white}#app{padding:20px}</style><div id="app"></div>');await page.addScriptTag({content:react});await page.addScriptTag({content:reactDOM});
 await page.addScriptTag({content:`window.target='canvas';window.staticRenderer=false;window.fieldSize=647;window.refs={};window.calls=0;window.tapCalls=0;window.tapOnly=false;window.dualTap=false;window.cancelTap=false;window.frames=new Set();const raf=requestAnimationFrame.bind(window),caf=cancelAnimationFrame.bind(window);window.requestAnimationFrame=f=>{const id=raf(t=>{frames.delete(id);f(t)});frames.add(id);return id};window.cancelAnimationFrame=id=>{frames.delete(id);caf(id)};window.actor={};(function(require,exports){${js}\n})(name=>name==='react'?React:{RenderTarget:{canvas:'canvas',current:()=>target},useIsStaticRenderer:()=>staticRenderer},actor);const Layer=React.forwardRef((props,ref)=>{const {onTap,onClick,onPointerUp,...rest}=props;return React.createElement('div',{...rest,ref,onClick:tapOnly?undefined:onClick,onPointerUp:e=>{onPointerUp?.(e);if(tapOnly||dualTap)onTap?.(e.nativeEvent,{point:{x:e.clientX,y:e.clientY}})}})});window.Field=actor.withBleibtProjectField(Layer);window.Planes=Array.from({length:16},(_,i)=>actor['withBleibtProject'+String(i+1).padStart(2,'0')](Layer));window.root=ReactDOM.createRoot(document.getElementById('app'));window.render=()=>root.render(React.createElement(Field,{ref:n=>refs.field=n,style:{width:fieldSize,height:fieldSize},'data-retained':'native-parent'},...Planes.map((P,i)=>React.createElement(P,{key:i,id:'picture-'+i,ref:n=>refs[i]=n,onClick:()=>calls++,onTap:e=>{tapCalls++;if(cancelTap)e.preventDefault()},'data-retained':'native-picture',style:{width:40,height:30,background:'hsl('+i*22+',80%,50%)',transform:'translateZ(0)' }},'SOURCE '+(i+1)))));render();`});
 await page.waitForSelector('[data-source-bleibt-plane="15"]');
 const still=await page.locator('[data-source-bleibt-plane]').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{index:e.dataset.sourceBleibtPlane,rect:{x:r.x,y:r.y,w:r.width,h:r.height},style:e.getAttribute('style'),retained:e.dataset.retained,reveal:e.dataset.sourcePlaneReveal}}));
 fs.writeFileSync(path.join(evidence,'first-native-bounds.json'),JSON.stringify(still,null,2));
 assert.equal(still.length,16);
 const validStill=still.every(x=>Object.values(x.rect).every(Number.isFinite)&&x.rect.w>0&&x.rect.h>0&&x.reveal==='1'&&x.retained==='native-picture'&&/translateZ\(0(?:px)?\)/.test(x.style));
 assert.ok(validStill,JSON.stringify(still));assert.equal(await page.evaluate(()=>frames.size),0);
 const aspects=await page.locator('[data-source-bleibt-plane]').evaluateAll(es=>es.map(e=>e.offsetWidth/e.offsetHeight));assert.ok(Math.abs(aspects[2]-1)<.05&&aspects[13]<.8&&aspects[0]>1.4);
 await page.screenshot({path:path.join(evidence,'01-native-source-belt-still.png')});reports.push({case:'Sixteen native editable planes, actual source aspects, stable still, preserved refs/props/transforms',still});
 await page.evaluate(()=>{target='preview';render()});await page.waitForFunction(()=>Number(refs.field.dataset.sourceFieldTime)>1.8);
 const angleA=await page.evaluate(()=>Number(refs.field.dataset.sourceFieldAngle));await page.waitForTimeout(150);const angleB=await page.evaluate(()=>Number(refs.field.dataset.sourceFieldAngle));assert.ok(angleB>angleA,'Actual auto rotation advances');
 const front=await page.evaluate(()=>Array.from({length:16},(_,i)=>i).filter(i=>Number(refs[i].dataset.sourcePlaneFacing)>.3));assert.ok(front.length>=4);
 const chosen=front[0];await page.locator('#picture-'+chosen).hover({force:true});
 // The parent captures the actual clicked image, so selection must survive a
 // real mouse down/up rather than a synthetic call to its React callback.
 await page.locator('#picture-'+chosen).click({force:true});await page.waitForFunction(i=>Number(refs.field.dataset.sourceFieldPinned)===i,chosen);assert.equal(await page.evaluate(()=>calls),1);reports.push({case:'Real fine-pointer hover and click pin preserve native callbacks',chosen});
 await page.screenshot({path:path.join(evidence,'02-native-source-picture-pinned.png')});
 await page.evaluate(()=>{document.body.style.minHeight='2400px';scrollTo(0,50)});await page.waitForFunction(()=>Number(refs.field.dataset.sourceFieldPinned)===-1);
 await page.evaluate(()=>{scrollTo(0,0);tapOnly=true;render()});await page.waitForTimeout(370);
 const tapChosen=await page.evaluate(()=>Array.from({length:16},(_,i)=>i).find(i=>Number(refs[i].dataset.sourcePlaneFacing)>.3));
 const beforeTap=await page.evaluate(()=>({click:calls,tap:tapCalls}));
 await page.locator('#picture-'+tapChosen).click({force:true});await page.waitForFunction(i=>Number(refs.field.dataset.sourceFieldPinned)===i,tapChosen);
 assert.deepEqual(await page.evaluate(()=>({click:calls,tap:tapCalls})),{click:beforeTap.click,tap:beforeTap.tap+1});
 await page.locator('#picture-'+tapChosen).click({force:true});await page.waitForFunction(()=>Number(refs.field.dataset.sourceFieldPinned)===-1);
 await page.evaluate(()=>{tapOnly=false;dualTap=true;render()});await page.waitForTimeout(370);
 await page.locator('#picture-'+tapChosen).click({force:true});await page.waitForFunction(i=>Number(refs.field.dataset.sourceFieldPinned)===i,tapChosen);
 await page.locator('#picture-'+tapChosen).click({force:true});await page.waitForFunction(()=>Number(refs.field.dataset.sourceFieldPinned)===-1);
 await page.evaluate(()=>cancelTap=true);await page.locator('#picture-'+tapChosen).click({force:true});await page.waitForTimeout(60);assert.equal(await page.evaluate(()=>Number(refs.field.dataset.sourceFieldPinned)),-1);
 await page.evaluate(()=>{cancelTap=false;dualTap=false;render()});await page.waitForTimeout(370);
 reports.push({case:'Native adapter drops onClick: tap-only pin/unpin, repeated gestures, dual-channel once and canceled tap suppresses fallback click',tapChosen});
 const beforeDrag=await page.evaluate(()=>Number(refs.field.dataset.sourceFieldAngle));await page.mouse.move(400,400);await page.mouse.down();await page.mouse.move(480,400,{steps:8});await page.mouse.up();await page.waitForTimeout(120);const afterDrag=await page.evaluate(()=>Number(refs.field.dataset.sourceFieldAngle));assert.ok(Math.abs(afterDrag-beforeDrag)>.05);assert.equal(await page.evaluate(()=>Number(refs.field.dataset.sourceFieldPinned)),-1);
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>frames.size===0);const reducedA=await page.evaluate(()=>refs.field.dataset.sourceFieldTime);await page.waitForTimeout(90);assert.equal(await page.evaluate(()=>refs.field.dataset.sourceFieldTime),reducedA);
 await page.evaluate(()=>{target='export';staticRenderer=true;fieldSize=350;render()});await page.waitForFunction(()=>refs.field.clientWidth===350&&parseFloat(refs[0].style.width)<40);assert.equal(await page.evaluate(()=>frames.size),0);const staticPhone=await page.evaluate(()=>({field:refs.field.clientWidth,plane:parseFloat(refs[0].style.width),perspective:parseFloat(refs.field.style.perspective)}));assert.ok(Math.abs(staticPhone.plane/(parseFloat(still[0].style.match(/width: ([\d.]+)px/)[1]))-350/647)<.002);reports.push({case:'Static Phone field measures real assigned bounds without motion',staticPhone});await page.evaluate(()=>root.unmount());assert.equal(await page.evaluate(()=>frames.size),0);assert.equal(await page.evaluate(()=>document.querySelectorAll('canvas').length),0);reports.push({case:'Scroll unpin, real drag, reduced/export freeze, noCanvas/WebGL and cleanup',beforeDrag,afterDrag});
 await page.setViewportSize({width:1280,height:720});await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>{document.body.style.minHeight='0';document.getElementById('app').style.padding='0';target='preview';staticRenderer=false;scrollTo(0,0);root=ReactDOM.createRoot(document.getElementById('app'));const Layer=React.forwardRef((props,ref)=>React.createElement('div',{...props,ref}));const Heading=actor.withBleibtWorkHeading(Layer),Label=actor.withBleibtWorkLabel(Layer),All=actor.withBleibtAllWorks(Layer);root.render(React.createElement(React.Fragment,null,React.createElement('div',{style:{height:1913.515625}}),React.createElement('div',{style:{position:'relative',width:1280,height:1531.546875}},React.createElement(Heading,{ref:n=>refs.heading=n,style:{width:375,height:70.40625,display:'flex',justifyContent:'space-between'}},React.createElement(Label,{ref:n=>refs.work=n},'Work'),React.createElement(Label,{},'24–26'),React.createElement(All,{ref:n=>refs.all=n,style:{position:'absolute',left:0,top:0,width:'100%',opacity:0}},'All Works'))),React.createElement('div',{style:{height:220}})))});
 await page.waitForFunction(()=>refs.heading?.dataset.sourceWorkHeadingWidth);await page.evaluate(()=>scrollTo(0,2160));await page.waitForFunction(()=>Math.abs(parseFloat(refs.heading.style.width)-785)<1);const headingMid=await page.evaluate(()=>({width:parseFloat(refs.heading.style.width),top:refs.heading.getBoundingClientRect().top}));assert.ok(Math.abs(headingMid.top-324.796875)<1);
 await page.evaluate(()=>scrollTo(0,2940));await page.waitForFunction(()=>refs.heading.dataset.sourceWorkTerminal==='true');assert.equal(await page.evaluate(()=>getComputedStyle(refs.work).opacity),'0');assert.equal(await page.evaluate(()=>getComputedStyle(refs.all).opacity),'1');
 await page.evaluate(()=>scrollTo(0,2160));await page.waitForFunction(()=>refs.heading.dataset.sourceWorkTerminal==='false');assert.equal(await page.evaluate(()=>getComputedStyle(refs.work).opacity),'1');await page.evaluate(()=>root.unmount());assert.equal(await page.evaluate(()=>frames.size),0);reports.push({case:'Source-observed785px sticky width/top, terminal AllWorks switch and reverse',headingMid});
 // A native Frame may expose tap while dropping click, and an image fill may
 // put a nested IMG under the pointer. Exercise real browser hit-testing at
 // the source overlap: an opaque-to-input sticky header used to block a
 // visibly front-facing picture even when a locator forced the click.
 await page.evaluate(()=>{
  scrollTo(0,0);document.body.style.minHeight='0';window.nativeTapCount=0;window.nativeAllWorksCount=0;
  const E=React.createElement;
  const Native=React.forwardRef((props,ref)=>{const {onTap,onClick,onPointerUp,children,nativeTag='div',...rest}=props;const picture=props['data-source-bleibt-plane']!==undefined;return E(nativeTag,{...rest,ref,onClick:nativeTag==='a'?onClick:undefined,onPointerUp:e=>{onPointerUp?.(e);onTap?.(e.nativeEvent,{point:{x:e.clientX,y:e.clientY}})}},picture?E('div',{'data-native-background-image-wrapper':true,style:{position:'absolute',inset:0}},E('img',{alt:'Native source picture fixture',draggable:false,src:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="70"><rect width="100" height="70" fill="hsl('+props['data-source-bleibt-plane']*22+',80%,50%)"/></svg>'),style:{width:'100%',height:'100%',display:'block'}})):children)});
  const NativeField=actor.withBleibtProjectField(Native),NativePlanes=Array.from({length:16},(_,i)=>actor['withBleibtProject'+String(i+1).padStart(2,'0')](Native)),Heading=actor.withBleibtWorkHeading(Native),Label=actor.withBleibtWorkLabel(Native),All=actor.withBleibtAllWorks(Native);
  root=ReactDOM.createRoot(document.getElementById('app'));
  window.renderHeaderFixture=()=>root.render(E(React.Fragment,null,E('div',{style:{height:1913.515625}}),E('div',{style:{position:'relative',width:1280,height:1531.546875}},E(Heading,{id:'native-work-heading',ref:n=>refs.heading=n,style:{width:375,height:70.40625,display:'flex',justifyContent:'space-between',pointerEvents:'auto'}},E(Label,{id:'native-work-label',ref:n=>refs.work=n,style:{fontSize:80,pointerEvents:'auto'}},'Work'),E(Label,{id:'native-year-label',style:{fontSize:80,pointerEvents:'auto'}},'24–26'),E(All,{id:'native-terminal-link',nativeTag:'a',href:'#native-all-works-target',ref:n=>refs.all=n,onClick:()=>nativeAllWorksCount++,style:{position:'absolute',left:0,top:0,width:'100%',height:70.40625,opacity:0,pointerEvents:'none'}},'All Works')),E('div',{style:{position:'absolute',left:316.4375,top:558.40625,width:647.109375,height:647.109375}},E(NativeField,{id:'native-picture-field',ref:n=>refs.field=n,style:{width:647.109375,height:647.109375}},...NativePlanes.map((P,i)=>E(P,{key:i,id:'native-picture-'+i,ref:n=>refs[i]=n,onTap:()=>nativeTapCount++,style:{left:0,top:0,width:40,height:30,transform:'translateZ(0)'}}))))),E('div',{id:'native-all-works-target',style:{height:300}},'Following native review content')));
  renderHeaderFixture();
 });
 await page.waitForSelector('#native-picture-field');
 await page.evaluate(()=>scrollTo(0,2440));await page.waitForFunction(()=>Number(refs[15]?.dataset.sourcePlaneReveal)>.999);
 const through=await page.evaluate(()=>{const h=refs.heading.getBoundingClientRect();return Array.from({length:16},(_,i)=>{const r=refs[i].getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);return{i,x,y,facing:Number(refs[i].dataset.sourcePlaneFacing),inHeader:x>=h.left&&x<=h.right&&y>=h.top&&y<=h.bottom,hitPlane:hit?.closest('[data-source-bleibt-plane]')?.id,targetTag:hit?.tagName}}).filter(r=>r.facing>.3&&r.inHeader&&r.hitPlane==='native-picture-'+r.i).sort((a,b)=>b.facing-a.facing)[0]});
 assert.ok(through,'A front native picture inside the sticky header bounds must receive the real hit');
 assert.deepEqual(await page.evaluate(()=>({heading:getComputedStyle(refs.heading).pointerEvents,label:getComputedStyle(refs.work).pointerEvents,hiddenLink:getComputedStyle(refs.all).pointerEvents,z:getComputedStyle(refs.heading).zIndex})),{heading:'none',label:'none',hiddenLink:'none',z:'2'});
 await page.locator('#native-picture-'+through.i).click({force:true});await page.waitForFunction(i=>Number(refs.field.dataset.sourceFieldPinned)===i,through.i);assert.equal(await page.evaluate(()=>nativeTapCount),1);
 await page.screenshot({path:path.join(evidence,'03-native-picture-pinned-through-header.png')});reports.push({case:'Real nested IMG/native tap pins through source pointer-pass-through Work heading and labels',through});
 await page.evaluate(()=>scrollTo(0,3025));await page.waitForFunction(()=>refs.heading.dataset.sourceWorkTerminal==='true');assert.equal(await page.evaluate(()=>getComputedStyle(refs.all).pointerEvents),'auto');
 const terminalHit=await page.locator('#native-terminal-link').evaluate(e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('a')?.id});assert.equal(terminalHit,'native-terminal-link');await page.locator('#native-terminal-link').click();assert.equal(await page.evaluate(()=>nativeAllWorksCount),1);assert.equal(await page.evaluate(()=>location.hash),'#native-all-works-target');
 await page.evaluate(()=>{target='canvas';renderHeaderFixture()});await page.waitForFunction(()=>getComputedStyle(refs.all).pointerEvents==='none');assert.equal(await page.evaluate(()=>getComputedStyle(refs.heading).pointerEvents),'none');assert.equal(await page.evaluate(()=>frames.size),0);await page.evaluate(()=>root.unmount());assert.equal(await page.evaluate(()=>frames.size),0);reports.push({case:'Terminal AllWorks retains real native anchor activation; Canvas freezes pass-through header/link and cleans all RAF',terminalHit});

 // Focused extension: drive the actual mounted actor with a controlled RAF.
 // The numeric oracle uses closed-form geometric sums rather than a copied
 // frame loop. Source code is evidence only and is never evaluated here.
 await page.setViewportSize({width:1280,height:720});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>{
  document.body.style.minHeight='0';document.getElementById('app').style.padding='20px';scrollTo(0,0);
  window.savedFocusedRAF=requestAnimationFrame;window.savedFocusedCAF=cancelAnimationFrame;
  window.manualFrames=new Map();window.manualID=100000000;window.manualNow=1024;
  window.requestAnimationFrame=callback=>{const id=++manualID;manualFrames.set(id,callback);frames.add(id);return id};
  window.cancelAnimationFrame=id=>{manualFrames.delete(id);frames.delete(id)};
  window.manualAdvance=milliseconds=>ReactDOM.flushSync(()=>{
   manualNow+=milliseconds;
   for(const [id,callback] of [...manualFrames]){manualFrames.delete(id);frames.delete(id);callback(manualNow)}
  });
  window.focusCounts={enter:0,move:0,leave:0,down:0,up:0,cancel:0};window.focusCancelDown=false;window.focusOffscreen=false;
  window.focusedRender=()=>root.render(React.createElement(Field,{id:'focused-field',ref:node=>refs.field=node,style:{width:647,height:647,marginTop:focusOffscreen?2000:0},
   onPointerEnter:()=>focusCounts.enter++,onPointerMove:()=>focusCounts.move++,onPointerLeave:()=>focusCounts.leave++,
   onPointerDown:event=>{focusCounts.down++;if(focusCancelDown)event.preventDefault()},onPointerUp:()=>focusCounts.up++,onPointerCancel:()=>focusCounts.cancel++},
   ...Planes.map((Plane,index)=>React.createElement(Plane,{key:index,id:'focused-picture-'+index,ref:node=>refs[index]=node,style:{background:'hsl('+index*22+',80%,50%)'}})),
   React.createElement('div',{id:'focused-overflow',style:{position:'absolute',left:700,top:0,width:40,height:40,background:'#dd00aa'}},'Overflow')));
  window.focusDispatch=(kind,options={},targetID='focused-field')=>{
   const node=document.getElementById(targetID),r=refs.field.getBoundingClientRect();
   const nativeType=kind==='enter'?'pointerover':kind==='leave'?'pointerout':'pointer'+kind;
   node.dispatchEvent(new PointerEvent(nativeType,{bubbles:true,cancelable:true,pointerType:'mouse',pointerId:1,button:0,clientX:r.left+5,clientY:r.top+5,relatedTarget:kind==='enter'||kind==='leave'?document.body:null,...options}));
  };
 });
 const focusedTrace=[];
 let expected={angle:0,drift:.003,velocity:0};
 const resetFocused=async()=>{
  await page.mouse.move(1,1);
  await page.evaluate(()=>{ReactDOM.flushSync(()=>root.unmount());if(manualFrames.size)throw Error('Old focused frame leak');refs={};focusCounts={enter:0,move:0,leave:0,down:0,up:0,cancel:0};focusCancelDown=false;focusOffscreen=false;target='preview';staticRenderer=false;root=ReactDOM.createRoot(document.getElementById('app'));ReactDOM.flushSync(()=>focusedRender())});
  await page.waitForFunction(()=>manualFrames.size===1&&refs.field?.clientWidth===647);
  await page.evaluate(()=>manualAdvance(0));
  assert.equal(await page.evaluate(()=>Number(refs.field.dataset.sourceFieldAngle)),0);
  expected={angle:0,drift:.003,velocity:0};
 };
 const block=async(label,{count,ms=50,target=0,rate=.03,velocityDecay=.94,flushMs=0})=>{
  const normalized=Math.min(1,Math.min(ms/1000,.05)*60),r=1-rate*normalized,v=Math.pow(velocityDecay,normalized);
  const sum=(factor,number)=>factor===1?number:factor*(1-factor**number)/(1-factor);
  const before={...expected};
  expected.angle+=normalized*(target*count+(expected.drift-target)*sum(r,count)+expected.velocity*sum(v,count));
  expected.drift=target+(expected.drift-target)*r**count;expected.velocity*=v**count;
  if(flushMs){const n=Math.min(1,Math.min(flushMs/1000,.05)*60);expected.drift=target+(expected.drift-target)*(1-rate*n);expected.velocity*=velocityDecay**n;expected.angle+=(expected.drift+expected.velocity)*n}
  await page.evaluate(({count,ms,flushMs})=>{for(let i=0;i<count;i++)manualAdvance(ms);if(flushMs)manualAdvance(flushMs)},{count,ms,flushMs});
  const actual=await page.evaluate(()=>({angle:Number(refs.field.dataset.sourceFieldAngle),time:Number(refs.field.dataset.sourceFieldTime),frames:manualFrames.size}));
  assert.ok(Math.abs(actual.angle-expected.angle)<1e-9,`${label}: actual ${actual.angle}, closed-form ${expected.angle}`);
  assert.equal(actual.frames,1,label+': one live RAF');
  focusedTrace.push({label,input:{count,ms,target,rate,velocityDecay,normalized,flushMs},before,expected:{...expected},actual});
  fs.writeFileSync(path.join(evidence,'focused-numeric-trace.json'),JSON.stringify(focusedTrace,null,2)+'\n');
 };
 const gapEnter=async()=>{
  const gap=await page.evaluate(()=>{const r=refs.field.getBoundingClientRect(),x=r.left+5,y=r.top+5,hit=document.elementFromPoint(x,y);return{x,y,hit:hit?.id,plane:hit?.closest('[data-source-bleibt-plane]')?.id}});
  assert.equal(gap.hit,'focused-field','Chosen empty gap must hit the field');assert.equal(gap.plane,undefined);
  await page.mouse.move(gap.x,gap.y);
  return gap;
 };

 await resetFocused();
 await block('Initial free drift uses .003',{count:1,target:.003});
 const gap=await gapEnter();
 await block('Empty gap pauses target but linearly relaxes drift',{count:1});
 assert.ok(Math.abs(expected.drift-.00291)<1e-12);
 await block('A50ms callback consumes one capped normalized step',{count:1});
 assert.ok(Math.abs(expected.drift-.0028227)<1e-12);
 const fractionalStart={...expected};
 // A final50ms step guarantees the existing30Hz public pose publisher
 // exposes all eight fractional steps. Its contribution is in the oracle.
 await block('120Hz uses exact linear .985 half-step factor',{count:8,ms:1000/120,flushMs:50});
 const expR=Math.sqrt(.97),linearR=.985;
 const alternative=fractionalStart.angle+.5*fractionalStart.drift*expR*(1-expR**8)/(1-expR)+fractionalStart.drift*expR**8*.97;
 assert.ok(Math.abs(expected.angle-alternative)>1e-7,'Linear and exponential alternatives must be numerically distinguishable');
 assert.equal(linearR,1-.03*.5);
 reports.push({case:'Focused source numeric oracle: initial drift, real empty-gap entry, capped50ms and exact120Hz linear factor',gap,exponentialAlternative:alternative,actualExpected:expected.angle});

 // 31.25ms is exactly representable as1/32s. This makes the strict1s
 // boundary independent of accumulated decimal-third rounding.
 await resetFocused();await gapEnter();await block('Set zero drift target before leaving',{count:1});
 await page.mouse.move(1,1);
 await block('At exactly1s after leaving, target remains zero',{count:32,ms:31.25});
 await block('After strictly more than1s, target resumes toward .003',{count:2,ms:31.25,target:.003});
 reports.push({case:'Focused empty-gap leave honors exact strict >1s wall-clock idle boundary'});

 await resetFocused();await gapEnter();
 await page.mouse.down();
 await block('Mouse down uses .18 linear relaxation with no displacement',{count:1,rate:.18,velocityDecay:.9});
 await page.mouse.move(gap.x+10,gap.y);
 expected.velocity=.11;
 await block('Drag caps velocity then decays before the50ms capped advance',{count:1,rate:.18,velocityDecay:.9});
 await page.evaluate(()=>focusDispatch('cancel'));
 await block('Pointer cancel preserves prior drag cancellation and switches decay',{count:1,rate:.03,velocityDecay:.94});
 await page.mouse.up();
 assert.deepEqual(await page.evaluate(()=>({down:focusCounts.down,cancel:focusCounts.cancel,up:focusCounts.up})),{down:1,cancel:1,up:1});
 assert.equal(await page.evaluate(()=>Number(refs.field.dataset.sourceFieldPinned)),-1);
 reports.push({case:'Focused mouse drag uses .18, velocity cap/decay order and preserves native cancel/up callbacks'});

 await resetFocused();await gapEnter();
 await page.evaluate(()=>{focusCounts={enter:0,move:0,leave:0,down:0,up:0,cancel:0};focusCancelDown=true;focusDispatch('down');focusDispatch('move',{clientX:refs.field.getBoundingClientRect().left+25});focusDispatch('up');focusDispatch('enter',{pointerType:'pen'});focusDispatch('leave',{pointerType:'pen'});focusDispatch('move',{pointerType:'touch'});focusCancelDown=false;focusDispatch('down',{button:2});focusDispatch('cancel')});
 await block('Prevented and nonprimary downs cannot acquire drag or velocity',{count:2});
 assert.deepEqual(await page.evaluate(()=>focusCounts),{enter:1,move:2,leave:1,down:2,up:1,cancel:1});
 reports.push({case:'Focused callbacks fire once; prevented/nonprimary down and existing cancellation guards remain intact'});

 await resetFocused();
 await page.evaluate(()=>{focusDispatch('enter',{pointerType:'pen'});focusDispatch('move',{pointerType:'pen'});focusDispatch('leave',{pointerType:'pen'});focusDispatch('enter',{pointerType:'touch'});focusDispatch('move',{pointerType:'touch'});focusDispatch('leave',{pointerType:'touch'})});
 await block('Pen and touch occupancy cannot acquire a mouse hold',{count:40,ms:31.25,target:.003});
 await gapEnter();
 await page.evaluate(()=>{const r=refs.field.getBoundingClientRect();focusDispatch('move',{pointerType:'pen',clientX:r.right+30});focusDispatch('leave',{pointerType:'pen'});focusDispatch('move',{pointerType:'touch',clientX:r.right+30});focusDispatch('leave',{pointerType:'touch'})});
 await block('Pen and touch events cannot clear an existing mouse hold',{count:40,ms:31.25});
 reports.push({case:'Focused nonmouse movement/entry/leave neither acquires nor clears mouse occupancy'});

 await resetFocused();await gapEnter();
 await page.evaluate(()=>{const r=refs.field.getBoundingClientRect();focusDispatch('move',{clientX:r.right+25,clientY:r.top+5},'focused-overflow')});
 await block('Bubbled move outside square through overflow child preserves free startup drift',{count:34,ms:31.25,target:.003});
 // No held frame preceded the move: target retains its source startup.003.
 // Repeat after establishing target zero to test delayed recovery explicitly.
 reports.push({case:'Focused overflow bounds delivery exercised'});

 await resetFocused();await gapEnter();await block('Establish zero target for overflow bounds',{count:1});
 await page.evaluate(()=>{const r=refs.field.getBoundingClientRect();focusDispatch('move',{clientX:r.right+25,clientY:r.top+5},'focused-overflow')});
 await block('Overflow square exclusion retains zero through exact1s',{count:32,ms:31.25});
 await block('Overflow square exclusion allows drift after1s',{count:2,ms:31.25,target:.003});
 await page.evaluate(()=>{const r=refs.field.getBoundingClientRect();focusDispatch('move',{clientX:r.left,clientY:r.top})});
 await block('Inclusive left/top rectangle edges count inside',{count:1});
 await page.evaluate(()=>{const r=refs.field.getBoundingClientRect();focusDispatch('move',{clientX:r.right,clientY:r.bottom})});
 await block('Inclusive right/bottom rectangle edges count inside',{count:1});
 reports.push({case:'Focused overflow exclusion and inclusive rectangle edges match retained pointer bounds'});

 await resetFocused();await gapEnter();await page.mouse.down();
 await block('Captured pointer begins inside with zero target',{count:1,rate:.18,velocityDecay:.9});
 await page.mouse.move(735,gap.y);expected.velocity=.11;
 await block('Captured pointer outside remains held only by drag',{count:1,rate:.18,velocityDecay:.9});
 await page.mouse.up();
 await block('Captured release outside retains zero target through exact1s',{count:32,ms:31.25});
 await block('Captured release outside resumes after1s without reentry',{count:2,ms:31.25,target:.003});
 assert.equal(await page.evaluate(()=>Number(refs.field.dataset.sourceFieldPinned)),-1);
 reports.push({case:'Focused real captured mouse leaves square and releases outside without a stale occupancy hold'});

 await resetFocused();
 await block('Reveal all native planes before the independent pin hold test',{count:40,target:.003});
 const outsidePin=await page.evaluate(()=>Array.from({length:16},(_,index)=>{const node=refs[index],r=node.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return{index,facing:Number(node.dataset.sourcePlaneFacing),hit:hit?.closest('[data-source-bleibt-plane]')?.id}}).filter(value=>value.facing>.3&&value.hit==='focused-picture-'+value.index).sort((a,b)=>b.facing-a.facing)[0]);
 assert.ok(outsidePin,'A visible front native picture must receive a real hit');
 await page.locator('#focused-picture-'+outsidePin.index).click();
 await page.waitForFunction(index=>Number(refs.field.dataset.sourceFieldPinned)===index,outsidePin.index);
 await page.mouse.move(1,1);
 await block('Pin alone keeps the drift target zero with mouse outside',{count:40,ms:31.25});
 await page.evaluate(()=>{document.body.style.minHeight='2400px';scrollTo(0,50)});
 await page.waitForFunction(()=>Number(refs.field.dataset.sourceFieldPinned)===-1);
 await block('Scroll-unpin preserves zero target through exact1s idle',{count:32,ms:31.25});
 await block('Scroll-unpin permits automatic recovery strictly after1s',{count:2,ms:31.25,target:.003});
 await page.evaluate(()=>{scrollTo(0,0);document.body.style.minHeight='0'});
 reports.push({case:'Focused real native pin alone pauses target outside field and scroll release preserves idle recovery',outsidePin});

 await resetFocused();await gapEnter();await block('Lifecycle precondition has active decaying drift',{count:1});
 const lifecycle=[];
 for(const mode of ['reduced','canvas','export','offscreen']){
  await page.mouse.move(1,1);
  if(mode==='reduced')await page.emulateMedia({reducedMotion:'reduce'});
  else await page.evaluate(mode=>{if(mode==='canvas'){target='canvas';staticRenderer=false}else if(mode==='export'){target='export';staticRenderer=true}else focusOffscreen=true;ReactDOM.flushSync(()=>focusedRender())},mode);
  await page.waitForFunction(()=>manualFrames.size===0);
  const disabled=await page.evaluate(()=>({angle:refs.field.dataset.sourceFieldAngle,time:refs.field.dataset.sourceFieldTime}));
  await page.evaluate(()=>{const r=refs.field.getBoundingClientRect();focusDispatch('enter',{clientX:r.left+5,clientY:r.top+5});focusDispatch('move',{clientX:r.left+5,clientY:r.top+5});manualAdvance(500)});
  assert.deepEqual(await page.evaluate(()=>({angle:refs.field.dataset.sourceFieldAngle,time:refs.field.dataset.sourceFieldTime})),disabled);
  if(mode==='reduced')await page.emulateMedia({reducedMotion:'no-preference'});
  else await page.evaluate(()=>{target='preview';staticRenderer=false;focusOffscreen=false;ReactDOM.flushSync(()=>focusedRender())});
  await page.waitForFunction(()=>manualFrames.size===1);
  // First resumed callback has zero delta. Then enough wall-clock time
  // passes to expose any stale occupancy acquired while disabled.
  await page.evaluate(()=>{manualAdvance(0);for(let i=0;i<34;i++)manualAdvance(31.25)});
  const resumed=await page.evaluate(()=>({angle:Number(refs.field.dataset.sourceFieldAngle),time:Number(refs.field.dataset.sourceFieldTime),frames:manualFrames.size}));
  assert.ok(resumed.angle>Number(disabled.angle),mode+': motion resumes');
  // Last target must have returned to .003: with a stale mouse hold its
  // final two increments would keep decaying instead. Read only public
  // angle deltas to distinguish those paths.
  await page.evaluate(()=>{window.lifecycleAngle=Number(refs.field.dataset.sourceFieldAngle);for(let i=0;i<20;i++)manualAdvance(50)});
  const advance=await page.evaluate(()=>Number(refs.field.dataset.sourceFieldAngle)-lifecycleAngle);
  assert.ok(advance>.01,mode+': cleared occupancy allows automatic drift recovery');
  const point=await gapEnter();
  lifecycle.push({mode,disabled,resumed,recoveredAdvance:advance,point});
 }
 reports.push({case:'Focused reduced/Canvas/export/offscreen disable cleanup and ordinary reentry',lifecycle});
 await page.evaluate(()=>{ReactDOM.flushSync(()=>root.unmount());if(manualFrames.size||frames.size)throw Error('Focused cleanup leaked RAF');window.requestAnimationFrame=savedFocusedRAF;window.cancelAnimationFrame=savedFocusedCAF});
 assert.equal(await page.evaluate(()=>frames.size),0);assert.equal(await page.evaluate(()=>document.querySelectorAll('canvas').length),0);
 fs.writeFileSync(path.join(evidence,'focused-numeric-trace.json'),JSON.stringify(focusedTrace,null,2)+'\n');
 reports.push({case:'Focused actor cleanup leaves no RAF or graphics resources',numericCases:focusedTrace.length});

 await page.close();
}catch(error){
 const failurePage=browser.contexts().flatMap(context=>context.pages()).at(-1);
 const failure={passed:false,error:error.stack??String(error),sourceSHA256:hash(source),testSHA256:hash(fs.readFileSync(import.meta.filename)),reports,errors};
 if(failurePage){await failurePage.screenshot({path:path.join(evidence,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(evidence,'failure.html'),await failurePage.content().catch(()=>''));failure.lastDOM=await failurePage.evaluate(()=>({focused:document.querySelector('#focused-field')?.outerHTML,frames:window.frames?.size,manualFrames:window.manualFrames?.size,counts:window.focusCounts,manualNow:window.manualNow})).catch(()=>null)}
 fs.writeFileSync(path.join(evidence,'failure.json'),JSON.stringify(failure,null,2)+'\n');throw error;
}finally{await browser.close()}
assert.deepEqual(errors,[]);const result={passed:true,sourceSHA256:hash(source),testSHA256:hash(fs.readFileSync(import.meta.filename)),reports,errors,scope:'Actual React18 native DOM projection, pointer drag/hover/click, scrolling and lifecycle. Source parameter geometry and original effect fidelity are distinct; CSS3D hover/pin easing is a declared fit. This candidate has no new Framer binding/persistence verification; the earlier bounded saved Preview evidence remains separate.'};fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:true,sourceSHA256:result.sourceSHA256,reports:reports.length,evidence},null,2));
