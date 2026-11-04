import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const repo=path.resolve(process.env.MONARCHIC_H4_REPO??fileURLToPath(new URL('../',import.meta.url)));
const out=path.resolve(process.env.MONARCHIC_H4_RELEASE_OUT??'/tmp/monarchic-source-portfolio-release-velocity');
const require=createRequire(path.join(repo,'package.json')),ts=require('typescript');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const pin=f=>{const b=fs.readFileSync(f);return{path:f,bytes:b.length,sha256:hash(b)}};
const file=path.resolve(process.env.MONARCHIC_H4_RELEASE_SOURCE??path.join(repo,'docs/design-studies/code-components/SourcePortfolioCarousel.tsx')),source=fs.readFileSync(file,'utf8');
const preimageFile=path.resolve(process.env.MONARCHIC_H4_SETTLE_PREIMAGE??path.join(repo,'scripts/fixtures/source-portfolio-carousel-pre-settling.tsx.txt')),before=fs.readFileSync(preimageFile,'utf8');
const factsFile=path.resolve(process.env.MONARCHIC_H4_RELEASE_FACTS??path.join(repo,'scripts/fixtures/source-portfolio-carousel-release-facts.json')),plan=JSON.parse(fs.readFileSync(factsFile,'utf8'));
const checks=[],samples=[],errors=[];
const check=(name,ok)=>{assert.ok(ok,name);checks.push(name)};
const emit=text=>ts.transpileModule(text,{fileName:'SourcePortfolioCarousel.tsx',compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React},reportDiagnostics:true});
const literalTarget=(offset,velocity)=>{const unit=4+.1,s=(8-1)/2;const momentum=(velocity*.01*3)/(1-.94),projected=Math.max(-(7-s)*unit,Math.min(s*unit,(-offset+s)*unit+momentum));return Math.max(0,Math.min(7,Math.round(-projected/unit+s)))};
const literalVelocity=(old,lastX,lastAt,x,at,scale=1)=>(at-lastAt)>0&&Number.isFinite(at-lastAt)?old*.85+((x-lastX)*scale/(at-lastAt))*.15:old;
const result=()=>({passed:true,source:pin(file),preimage:pin(preimageFile),checker:pin(fileURLToPath(import.meta.url)),checks,samples,errors,
  scope:'Source-code-supported velocity target only. Original inputs establish hold/drag/release mode causality; numeric velocity histories are synthetic tests. Current offset follows source default.1 per render callback; tiny terminal pixel cleanup and existing target caption/store coupling remain declared approximations. No actual Framer Preview/reload proof.',
  compilerVersion:ts.version,nodeVersion:process.version,actualFramerWrites:0,actualPreviewVerified:false,afterEditorReload:false});
fs.mkdirSync(out,{recursive:true});
try {
  assert.equal(hash(source),'1cb1898d4c283bb162095ea4e45889cbb7c880364d39d368e672e94298478a1b');assert.equal(hash(before),'60c0d0c6e4679fe73921cb710f669c039532f08d4878434c02292510243fa177');
  const releaseHelpers=text=>text.slice(text.indexOf('function carouselReleaseVelocity'),text.indexOf('/** Wrap the retained code component'));
  check('Pinned60c release velocity/projection helpers remain byte-exact',releaseHelpers(source)===releaseHelpers(before));
  const parse=text=>ts.createSourceFile('SourcePortfolioCarousel.tsx',text,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TSX);
  const publicBodies=text=>new Map(parse(text).statements.filter(n=>ts.isFunctionDeclaration(n)&&n.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)).map(n=>[n.name.text,n.getText(parse(text))]));
  const a=publicBodies(before),b=publicBodies(source);
  check('All six public roles remain and the five non-Surface bodies are byte-exact',a.size===6&&b.size===6&&[...a].every(([name,text])=>b.has(name)&&(name==='withPortfolioCarouselSurface'||b.get(name)===text)));
  const marker='// SOURCE INSPIRATION',film=fs.readFileSync(path.resolve(repo,plan.evidence.retainedFilm.path),'utf8');
  check('Exact shared film controller/media preserved;600ms second easing removed',source.slice(0,source.indexOf(marker))===before.slice(0,before.indexOf(marker))&&hash(film)===plan.evidence.retainedFilm.sha256&&!source.includes('600ms')&&source.includes('(targetOffset.current-currentOffset.current)*.1'));
  assert.equal(hash(fs.readFileSync(factsFile)),'b5090530f1fe1ed3387ff6259e6269c4c69fc89f79384ccde8ab74f01c49e08f');
  assert.deepEqual(plan.sourceDefaults,{projects:8,tileWidthWorld:4,tileGapWorld:.1,tileStepWorld:4.1,sourceScrollCenterCards:3.5,dragSensitivity:.012,velocityOldWeight:.85,velocityInstantWeight:.15,momentumNumerator:[.01,3],momentumFriction:.94});
  for(const row of plan.independentCases)assert.equal(literalTarget(row.offset,row.velocity),row.expected);
  check('Portable source facts preserve frozen correspondence pins, units and independent numeric targets',true);
  const retained=fs.readFileSync(path.join(repo,'scripts/check-source-portfolio-carousel.mjs'),'utf8');
  const line=retained.split('\n').find(l=>l.startsWith('const declarations=new Map('));assert(line);
  const declarations=vm.runInNewContext(line.slice('const declarations='.length).replace(/;$/,''),{path,repo},{timeout:1000});
  const reactPath=path.join(repo,'__vercel-react.d.ts'),publicReact=declarations.get(reactPath),oldPointer='clientY:number;stopPropagation():void',actualPointer='clientY:number;defaultPrevented:boolean;stopPropagation():void';
  assert(publicReact.includes(oldPointer)||publicReact.includes(actualPointer),'Retained React PointerEvent facade must have the known public shape');
  declarations.set(reactPath,publicReact.includes(actualPointer)?publicReact:publicReact.replace(oldPointer,actualPointer));
  const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Node10,jsx:ts.JsxEmit.React,baseUrl:repo,paths:{react:['__vercel-react.d.ts'],framer:['__vercel-framer.d.ts']}};
  const host=ts.createCompilerHost(options),read=host.readFile.bind(host),exists=host.fileExists.bind(host);
  host.readFile=p=>declarations.get(p)??read(p);host.fileExists=p=>declarations.has(p)||exists(p);host.getSourceFile=(p,v)=>{const s=host.readFile(p);return s===undefined?undefined:ts.createSourceFile(p,s,v,true)};
  const diagnostics=ts.getPreEmitDiagnostics(ts.createProgram([file],options,host));
  assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics.slice(0,12),{getCurrentDirectory:()=>repo,getCanonicalFileName:x=>x,getNewLine:()=> '\n'}));
  checks.push('The focused candidate passes strict actual-DOM/public React semantic TypeScript');
  const js=emit(source);assert.equal(js.diagnostics?.length??0,0);
  const React=require('react'),server=require('react-dom/server'),framer={RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail',current:()=> 'export'},useIsStaticRenderer:()=>true};
  const evaluate=(text,react=React,adapter=framer)=>new Function('require','exports',emit(text).outputText+';return{...exports,carouselReleaseVelocity:typeof carouselReleaseVelocity===\'function\'?carouselReleaseVelocity:null,carouselReleaseProject:typeof carouselReleaseProject===\'function\'?carouselReleaseProject:null};')(name=>name==='react'?react:adapter,{});
  const api=evaluate(source),oldAPI=evaluate(before),Actor=React.forwardRef((props,ref)=>React.createElement('div',{ref,style:props.style,'data-actor':'retained'},'retained actor'));
  const render=module=>server.renderToString(React.createElement(module.withPortfolioCarouselSurface(Actor),{style:{width:1280,height:720},autoAdvance:true}));
  check('Export SSR preserves exact old authored component pixels/markup without DOM/media owners',render(api)===render(oldAPI));
  const velocities=[-100,-2,-.2,-.021,-.02,0,.02,.021,.2,2,100],offsets=[0,.49,.51,3.49,3.5,3.51,6.49,6.51,7];
  for(const offset of offsets)for(const velocity of velocities)assert.equal(api.carouselReleaseProject(offset,velocity),literalTarget(offset,velocity));
  check('Positive/negative/zero release projection and edge clamps match independent literal source equations',true);
  check('The retained nearest-only baseline cannot reproduce momentum at the same endpoint',api.carouselReleaseProject(3.49,-.2)===4&&Math.round(3.49)===3&&api.carouselReleaseProject(3.51,.2)===3&&Math.round(3.51)===4);
  check('World-distance momentum is divided by4.1 before card-index thresholds',api.carouselReleaseProject(3.49,-.02)===3&&Math.round(3.49-(-.02*.01*3)/(1-.94))===4&&api.carouselReleaseProject(3.51,.021)===4&&Math.round(3.51-(.021*.01*3)/(1-.94))===3);
  for(const row of [[0,20,0,0,10,1],[-.2,0,10,20,20,1],[.3,10,10,5,10,1],[.3,10,10,5,5,1],[.3,10,10,5,Infinity,1],[0,10,0,0,10,1.25]])assert.equal(api.carouselReleaseVelocity(...row),literalVelocity(...row));
  check('Velocity signs/reversal, affine unit mapping and zero/nonmonotonic dt policies are explicit',true);
  fs.writeFileSync(path.join(out,'static-result.json'),JSON.stringify(result(),null,2)+'\n');
  if(process.argv.includes('--static-only')){console.log(JSON.stringify(result(),null,2));process.exit(0)}
  const {chromium}=require('@playwright/test');
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']}),context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(String(error)));
  try {
    await page.setContent('<!doctype html><meta charset="utf-8"><body style="margin:0;background:black"><div id="mount"></div></body>');
    for(const name of ['react','react-dom'])await page.addScriptTag({content:fs.readFileSync(path.join(path.dirname(require.resolve(name+'/package.json')),'umd/'+name+'.development.js'),'utf8')});
    await page.addScriptTag({content:`window.mode={target:'preview',static:false};window.module={};new Function('require','exports',${JSON.stringify(js.outputText+';window.H4={...exports,getFilmControls,getCarouselLayout};')})(n=>n==='react'?React:{RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail',current:()=>mode.target},useIsStaticRenderer:()=>mode.static},module);`});
    await page.evaluate(()=>{
      const E=React.createElement,clock=performance.now.bind(performance);window.__at=null;performance.now=()=>__at===null?clock():__at;
      window.__settleFrames=new Set();const nativeRAF=requestAnimationFrame.bind(window),nativeCAF=cancelAnimationFrame.bind(window);window.requestAnimationFrame=callback=>{const id=nativeRAF(now=>{__settleFrames.delete(id);callback(now)});__settleFrames.add(id);return id};window.cancelAnimationFrame=id=>{__settleFrames.delete(id);nativeCAF(id)};
      window.__scale=1;window.__epoch=0;window.__ref=[];window.__props=[];window.__pointerID=null;document.addEventListener('pointerdown',event=>{__pointerID=event.pointerId});
      window.__callerCancel=false;window.__captureCancel=false;window.__disable=null;window.__disabledApplied=false;window.__releaseSnapshots=[];window.__captureCount=0;
      window.__motionQueries=new Set();const originalMatch=window.matchMedia.bind(window);window.matchMedia=query=>{const m=originalMatch(query);if(query==='(prefers-reduced-motion: reduce)')__motionQueries.add(m);return m};
      window.__captureExitTimer=false;window.__pendingExit=null;const originalSetTimeout=window.setTimeout.bind(window),originalClearTimeout=window.clearTimeout.bind(window);window.setTimeout=(callback,delay,...args)=>{const id=originalSetTimeout(callback,delay,...args);if(__captureExitTimer&&delay===650){originalClearTimeout(id);__pendingExit=()=>callback(...args)}return id};
      window.__release=event=>{if(__callerCancel)event.preventDefault();if(__disable&&!__disabledApplied){__disabledApplied=true;if(__disable==='pause')H4.getFilmControls().togglePaused();else if(__disable==='reduced')for(const m of __motionQueries){Object.defineProperty(m,'matches',{configurable:true,value:true});m.dispatchEvent(new Event('change'))}else if(__disable==='immersive'){if(!__pendingExit)throw Error('Missing captured public650ms hold callback');const finish=__pendingExit;__pendingExit=null;finish()}}};
      const actor=React.forwardRef(({style,autoAdvance,...props},ref)=>{__props.push({autoAdvance});const store=H4.getFilmControls();const state=React.useSyncExternalStore(store.subscribe,store.get,store.get);return E('div',{...props,ref,style,'data-actor':'retained',onPointerUp:event=>{const rendered={...state};props.onPointerUp?.(event);__releaseSnapshots.push({rendered,live:{...store.get()},cancelled:event.defaultPrevented,disable:__disable})}},E('canvas',{'data-source-film-project':state.project,width:1,height:1}))});
      const Surface=H4.withPortfolioCarouselSurface(actor);window.app=ReactDOM.createRoot(document.getElementById('mount'));
      window.render=()=>app.render(E('div',{id:'affine',onPointerUpCapture:event=>{if(__captureCancel){__captureCount++;event.preventDefault()}},style:{width:1440,height:900,transform:`scale(${__scale})`,transformOrigin:'0 0'}},E(Surface,{key:__epoch,autoAdvance:true,posters:window.__settlePosters,onPointerUp:event=>__release(event),ref:n=>__ref.push(n?'host':null),style:{width:1440,height:900}})));
      window.surface=()=>document.querySelector('[data-portfolio-carousel-surface]');
      window.read=()=>({project:H4.getFilmControls().get().project,offset:H4.getCarouselLayout().get().offset,active:surface()?.dataset.portfolioCarouselActive,transform:document.querySelector('[data-portfolio-carousel-plane]')?.firstElementChild?.style.transform,transition:document.querySelector('[data-portfolio-carousel-plane]')?.firstElementChild?.style.transition,rect:surface()?.getBoundingClientRect().toJSON()});render();
    });
    const wait=fn=>page.waitForFunction(fn,undefined,{timeout:7000});
    await wait(()=>surface()?.clientWidth===1440);
    await page.evaluate(()=>H4.getFilmControls().beginHold(0,0));await wait(()=>H4.getFilmControls().get().immersive);await page.evaluate(()=>H4.getFilmControls().cancelHold());
    await wait(()=>surface().dataset.portfolioCarouselActive==='true'&&document.querySelector('[data-portfolio-carousel-plane]').getAnimations().every(a=>a.playState!=='running'));
    async function sequence(name,index,moves,{cancel=false,scale=1,pauseDuring=false,callerCancel=false,captureCancel=false,liveDisable=null}={}){
      await page.evaluate(({index,scale,callerCancel,captureCancel,liveDisable})=>{__at=null;__scale=scale;__callerCancel=callerCancel;__captureCancel=captureCancel;__disable=liveDisable;__disabledApplied=false;__releaseSnapshots=[];__captureCount=0;render();H4.getFilmControls().select(index)},{index,scale,callerCancel,captureCancel,liveDisable});
      await wait(()=>H4.getCarouselLayout().get().offset===H4.getFilmControls().get().project);
      const x0=720*scale,y=450*scale;await page.mouse.move(x0,y);await page.evaluate(()=>__at=1000);await page.mouse.down();
      let velocity=0,lastX=x0,lastAt=1000,endpoint=index;
      for(const move of moves){const x=(720+move.dx)*scale,at=1000+move.at;await page.evaluate(at=>__at=at,at);await page.mouse.move(x,y);velocity=literalVelocity(velocity,lastX,lastAt,x,at,1/scale);lastX=x;lastAt=at;endpoint=Math.max(0,Math.min(7,index-move.dx*.012/4.1));}
      const held=await page.evaluate(()=>read());
      if(pauseDuring){await page.evaluate(()=>H4.getFilmControls().togglePaused());await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)))}
      if(liveDisable==='immersive')await page.evaluate(()=>{__captureExitTimer=true;H4.getFilmControls().beginHold(0,0);__captureExitTimer=false});
      if(cancel){await page.evaluate(()=>surface().dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:__pointerID,pointerType:'mouse'})));await page.mouse.up()}
      else if(callerCancel||liveDisable){await page.evaluate(({x,y})=>document.querySelector('[data-actor]').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerId:__pointerID,pointerType:'mouse',clientX:x,clientY:y})),{x:lastX,y});await page.mouse.up()}
      else await page.mouse.up();
      const expected=cancel||pauseDuring||callerCancel||captureCancel||liveDisable?Math.round(endpoint):literalTarget(endpoint,velocity);
      await page.waitForFunction(({expected,heldOffset})=>H4.getFilmControls().get().project===expected&&(H4.getFilmControls().get().paused?Math.abs(H4.getCarouselLayout().get().offset-heldOffset)<1e-9:H4.getCarouselLayout().get().offset===expected),{expected,heldOffset:held.offset},{timeout:5000});
      const state=await page.evaluate(()=>read()),release=await page.evaluate(()=>({snapshots:__releaseSnapshots,captureCount:__captureCount}));samples.push({name,index,scale,moves,velocity,endpoint,oldNearest:Math.round(endpoint),expected,held,state,release});await page.evaluate(()=>{__callerCancel=false;__captureCancel=false;__disable=null});return samples[samples.length-1];
    }
    const endpointDx=-.49*4.1/.012;
    const fast=await sequence('same endpoint fast left',3,[{dx:endpointDx+100,at:10},{dx:endpointDx,at:20}]);
    const slow=await sequence('same endpoint slow left',3,[{dx:endpointDx+100,at:1000},{dx:endpointDx,at:2000}]);
    check('Actual pressed pointer sequences choose different literal-source targets at the same fractional endpoint',fast.expected===4&&slow.expected===3&&Math.abs(fast.endpoint-slow.endpoint)<1e-10&&fast.oldNearest===3);
    const rightDx=.49*4.1/.012;
    const right=await sequence('positive fast right',4,[{dx:rightDx-100,at:10},{dx:rightDx,at:20}]);
    check('Positive release velocity projects toward the previous source card',right.expected===3&&right.oldNearest===4);
    const reverse=await sequence('reversed final velocity',3,[{dx:endpointDx-100,at:1000},{dx:endpointDx,at:1010}]);
    check('Measured reversal changes the release projection rather than keeping stale velocity',reverse.velocity>0&&reverse.expected===3);
    const cancelled=await sequence('source-unobserved pointercancel cleanup',3,[{dx:endpointDx+100,at:10},{dx:endpointDx,at:20}],{cancel:true});
    check('Pointercancel retains nearest-offset cleanup and does not apply the new momentum target',cancelled.expected===3&&literalTarget(cancelled.endpoint,cancelled.velocity)===4);
    const reset=await sequence('new press resets velocity',3,[{dx:0,at:10}]);
    check('A new admitted pointerdown resets the prior gesture velocity',reset.velocity===0&&reset.expected===3);
    const pausedDrag=await sequence('Pause during existing velocity gesture',3,[{dx:endpointDx+100,at:10},{dx:endpointDx,at:20}],{pauseDuring:true});
    check('Mid-drag Pause preserves old nearest cleanup and admits no new momentum selection',pausedDrag.expected===3&&literalTarget(pausedDrag.endpoint,pausedDrag.velocity)===4);await page.evaluate(()=>H4.getFilmControls().togglePaused());
    const captureCancelled=await sequence('actual ancestor capture cancellation',3,[{dx:endpointDx+100,at:10},{dx:endpointDx,at:20}],{captureCancel:true});
    check('Actual capture preventDefault suppresses the new projected target and preserves nearest cleanup',captureCancelled.expected===3&&captureCancelled.release.captureCount>0&&literalTarget(captureCancelled.endpoint,captureCancelled.velocity)===4);
    const callerCancelled=await sequence('forwarded actor caller cancellation',3,[{dx:endpointDx+100,at:10},{dx:endpointDx,at:20}],{callerCancel:true});
    check('The wrapped actor forwards its caller event and cancellation reaches Surface release',callerCancelled.expected===3&&callerCancelled.release.snapshots.some(s=>s.cancelled)&&literalTarget(callerCancelled.endpoint,callerCancelled.velocity)===4);
    const sameTaskPause=await sequence('same-event live Pause before Surface release',3,[{dx:endpointDx+100,at:10},{dx:endpointDx,at:20}],{liveDisable:'pause'});
    check('Same-event live Pause beats the stale unpaused rendered snapshot',sameTaskPause.expected===3&&sameTaskPause.release.snapshots.some(s=>!s.rendered.paused&&s.live.paused));await page.evaluate(()=>H4.getFilmControls().togglePaused());
    const sameTaskReduced=await sequence('same-event public MQL reduce before Surface release',3,[{dx:endpointDx+100,at:10},{dx:endpointDx,at:20}],{liveDisable:'reduced'});
    check('Same-event live reduced motion beats the stale enabled rendered snapshot',sameTaskReduced.expected===3&&sameTaskReduced.release.snapshots.some(s=>!s.rendered.reduced&&s.live.reduced));await page.evaluate(()=>{for(const m of __motionQueries){delete m.matches;m.dispatchEvent(new Event('change'))}});
    const sameTaskExit=await sequence('same-event public hold completion before Surface release',3,[{dx:endpointDx+100,at:10},{dx:endpointDx,at:20}],{liveDisable:'immersive'});
    check('Same-event immersive-off beats the stale active rendered snapshot',sameTaskExit.expected===3&&sameTaskExit.release.snapshots.some(s=>s.rendered.immersive&&!s.live.immersive));
    await page.evaluate(()=>{__at=null;H4.getFilmControls().beginHold(0,0)});await wait(()=>H4.getFilmControls().get().immersive);await page.evaluate(()=>H4.getFilmControls().cancelHold());await wait(()=>surface().dataset.portfolioCarouselActive==='true'&&document.querySelector('[data-portfolio-carousel-plane]').getAnimations().every(a=>a.playState!=='running'));
    const affine=await sequence('affine0.8scale fit',3,[{dx:endpointDx+100,at:10},{dx:endpointDx,at:20}],{scale:.8});
    check('Existing public affine scale maps displacement and measured velocity to the same logical target',affine.expected===fast.expected&&Math.abs(affine.velocity-fast.velocity)<1e-10&&Math.abs(affine.state.rect.width-1152)<.01);
    check('Current-offset rendering carries no CSS second easing after target selection',affine.state.transition==='none');
    await page.evaluate(()=>{__scale=1;render();H4.getFilmControls().select(3)});await wait(()=>H4.getCarouselLayout().get().offset===3);await page.mouse.move(720,450);await page.evaluate(()=>__at=1000);await page.mouse.down();
    await page.evaluate(dx=>{const dispatch=(type,x,at)=>{__at=at;surface().dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:__pointerID,pointerType:'mouse',clientX:x,clientY:450}))};dispatch('pointermove',720+dx+100,1010);dispatch('pointermove',720+dx,1020);dispatch('pointerup',720+dx,1020)},endpointDx);await page.mouse.up();await wait(()=>H4.getFilmControls().get().project===4&&H4.getCarouselLayout().get().offset===4);
    check('Same-task final movement and release use the retained latest fractional endpoint',await page.evaluate(()=>read().project===4));
    await page.evaluate(()=>H4.getFilmControls().togglePaused());const paused=await page.evaluate(()=>read());await page.mouse.wheel(0,100);await page.mouse.move(600,450);await page.mouse.down();await page.mouse.move(300,450);await page.mouse.up();
    check('Pause rejects further drag/wheel and preserves the selected target',await page.evaluate(before=>read().project===before.project&&read().offset===before.offset,paused));await page.evaluate(()=>H4.getFilmControls().togglePaused());
    await page.emulateMedia({reducedMotion:'reduce'});await wait(()=>H4.getFilmControls().get().reduced);const reduced=await page.evaluate(()=>read());await page.mouse.move(720,450);await page.mouse.down();await page.mouse.move(250,450);await page.mouse.up();
    check('Reduced motion rejects velocity input and retains its static gallery selection',await page.evaluate(before=>read().project===before.project&&read().offset===before.offset,reduced));await page.emulateMedia({reducedMotion:'no-preference'});await wait(()=>!H4.getFilmControls().get().reduced);
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{__scale=1;render()});
    // Native Phone owns its real390px surface; preserve the authored threshold without changing global breakpoint metadata.
    await page.evaluate(()=>{surface().style.width='390px'});await wait(()=>read().active==='false');
    check('Phone stays outside the Desktop-only carousel/velocity branch',await page.evaluate(()=>read().active==='false'));
    for(const target of ['canvas','export','thumbnail']){await page.evaluate(t=>{mode.target=t;__epoch++;render()},target);await wait(()=>read().active==='false');check(target+' preserves the old frozen authored branch',await page.evaluate(()=>read().active==='false'))}
    check('Forwarded refs and child public props remain present through the retained actor wrapper',await page.evaluate(()=>__ref.includes('host')&&__props.some(p=>p.autoAdvance===false)&&__props.some(p=>p.autoAdvance===true)));
    await page.evaluate(()=>app.unmount());
    check('Unmount releases owned layout, forwarded host and all settling callbacks',await page.evaluate(()=>!document.querySelector('[data-portfolio-carousel-surface]')&&!H4.getCarouselLayout().get().active&&__ref[__ref.length-1]===null&&__settleFrames.size===0));
    check('No uncaught browser error occurred in the focused real-event proof',errors.length===0);
    // Reuse this browser/React/store/native host. Drive the actual Surface's
    // owned callbacks; source JavaScript is never evaluated or imported.
    await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'no-preference'});
    await page.evaluate(()=>{
      mode.target='preview';mode.static=false;__at=null;__scale=1;
      window.__manualCallbacks=new Map();window.__manualNow=1024;window.__manualID=100000000;
      window.__savedSettleRAF=requestAnimationFrame;window.__savedSettleCAF=cancelAnimationFrame;
      window.requestAnimationFrame=callback=>{const id=++__manualID;__manualCallbacks.set(id,callback);__settleFrames.add(id);return id};
      window.cancelAnimationFrame=id=>{__manualCallbacks.delete(id);__settleFrames.delete(id)};
      window.__manualRaw=milliseconds=>{__manualNow+=milliseconds;for(const[id,callback]of[...__manualCallbacks]){__manualCallbacks.delete(id);__settleFrames.delete(id);callback(__manualNow)}};
      window.__manualStep=milliseconds=>ReactDOM.flushSync(()=>__manualRaw(milliseconds));
      window.__advanceBeforePress=false;document.addEventListener('pointerdown',()=>{if(__advanceBeforePress){__advanceBeforePress=false;__manualRaw(16)}},{capture:true});
      window.__settlePosters=Array.from({length:13},(_,index)=>'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="hsl('+index*27+',70%,50%)"/></svg>'));
      app=ReactDOM.createRoot(document.getElementById('mount'));__epoch++;ReactDOM.flushSync(()=>render());
    });
    await wait(()=>surface()?.clientWidth===1440);
    await page.evaluate(()=>{__captureExitTimer=true;H4.getFilmControls().beginHold(0,0);__captureExitTimer=false;if(!__pendingExit)throw Error('Missing captured public hold callback');const complete=__pendingExit;__pendingExit=null;ReactDOM.flushSync(()=>complete())});
    await wait(()=>read().active==='true'&&document.querySelector('[data-portfolio-carousel-plane]').getAnimations().every(animation=>animation.playState!=='running'));
    assert.equal(await page.evaluate(()=>__manualCallbacks.size),0);
    const numeric=[];
    const target=async index=>{await page.evaluate(index=>ReactDOM.flushSync(()=>H4.getFilmControls().select(index)),index);await page.waitForFunction(index=>read().project===index&&(__manualCallbacks.size===1||read().offset===index),index)};
    const finish=async()=>{await page.evaluate(()=>{for(let i=0;i<1000&&__manualCallbacks.size;i++)__manualStep(16);if(__manualCallbacks.size)throw Error('Settling failed to terminate within1000 callbacks')});assert.equal(await page.evaluate(()=>read().offset),await page.evaluate(()=>read().project))};
    const numericBlock=async(label,goal,count,interval)=>{
      const start=await page.evaluate(()=>read().offset),expected=goal+(start-goal)*.9**count;
      assert.equal(await page.evaluate(()=>__manualCallbacks.size),1,label+': one pending owned callback');
      await page.evaluate(({count,interval})=>{for(let i=0;i<count;i++)__manualStep(interval)},{count,interval});
      const actual=await page.evaluate(()=>read().offset);assert.ok(Math.abs(actual-expected)<1e-10,label+': actual '+actual+' closed-form '+expected);
      assert.equal(await page.evaluate(()=>__manualCallbacks.size),1,label+': still exactly one owned callback');
      numeric.push({label,start,goal,count,interval,expected,actual});fs.writeFileSync(path.join(out,'settling-numeric-trace.json'),JSON.stringify(numeric,null,2)+'\n');
      return actual;
    };
    const samplesByInterval=[];
    await target(4);await target(0);assert.equal(await page.evaluate(()=>__manualCallbacks.size),0);
    check('Retargeting to the exact current offset cancels the previously pending callback immediately',true);
    for(const interval of[1,1000/60,100]){await target(4);const value=await numericBlock('Same7 callbacks at interval'+interval,4,7,interval);samplesByInterval.push(value);await finish();await target(0);await finish()}
    assert.ok(samplesByInterval.every(value=>Math.abs(value-samplesByInterval[0])<1e-12));
    check('Source .9^N recurrence is callback-count based at1ms/60Hz/100ms intervals without dt normalization',true);

    await target(4);await numericBlock('Five frames before a real midflight re-press',4,5,16);
    const prePress=await page.evaluate(()=>read().offset),expectedGrab=4+(prePress-4)*.9;
    await page.mouse.move(720,450);await page.evaluate(()=>__advanceBeforePress=true);await page.mouse.down();
    const grabbed=await page.evaluate(()=>read().offset);
    assert.ok(Math.abs(grabbed-expectedGrab)<1e-10,'A frame ran in ancestor capture before React commit; re-press must seed currentRef');
    assert.ok(Math.abs(grabbed-4)>.5,'Re-press must not jump to prior selected target');
    assert.equal(await page.evaluate(()=>__manualCallbacks.size),0,'Admitted press owns current and cancels pending settle');
    await page.mouse.move(740,450);const dragged=await page.evaluate(()=>read().offset);
    assert.ok(Math.abs(dragged-(grabbed-20*.012/4.1))<1e-10,'New drag displacement begins at captured currentRef');
    await page.mouse.up();await finish();
    check('Real midflight re-press takes the latest precommit currentRef without a target jump and keeps drag sensitivity',{prePress,grabbed,dragged});

    await target(7);await numericBlock('Before Pause',7,4,16);await page.evaluate(()=>ReactDOM.flushSync(()=>H4.getFilmControls().togglePaused()));
    const pausedCurrent=await page.evaluate(()=>read().offset);assert.equal(await page.evaluate(()=>__manualCallbacks.size),0);
    await page.evaluate(()=>__manualStep(1000));assert.equal(await page.evaluate(()=>read().offset),pausedCurrent);
    await page.evaluate(()=>ReactDOM.flushSync(()=>H4.getFilmControls().togglePaused()));await numericBlock('Pause resumes same remaining error',7,2,200);await finish();
    check('Pause cancels callback, preserves current/target and resumes exact recurrence',true);

    await target(0);await numericBlock('Before offscreen hiding',0,3,16);await page.evaluate(()=>surface().style.display='none');await wait(()=>__manualCallbacks.size===0);
    const hiddenCurrent=await page.evaluate(()=>read().offset);await page.evaluate(()=>__manualStep(1000));assert.equal(await page.evaluate(()=>read().offset),hiddenCurrent);
    await page.evaluate(()=>surface().style.display='');await wait(()=>__manualCallbacks.size===1);await numericBlock('Visibility resumes same remaining error',0,2,1);await finish();
    check('Visibility disable cancels callback and resumes retained offset without a new clock',true);

    await target(6);await numericBlock('Before responsive bounds change',6,3,16);
    const beforeResize=await page.evaluate(()=>read().offset);
    await page.evaluate(()=>{surface().style.width='1200px';surface().style.height='700px'});
    await wait(()=>H4.getCarouselLayout().get().width===1200&&H4.getCarouselLayout().get().height===700);
    assert.equal(await page.evaluate(()=>read().offset),beforeResize,'Resize must preserve logical current position');
    await numericBlock('Responsive geometry retains .1 update',6,2,100);
    const neighbors=await page.evaluate(()=>{const world=H4.getCarouselLayout().get(),unit=world.height/(2*Math.tan(25*Math.PI/180)*8),step=4.1*unit,left=(world.width-4*unit)/2;return[...surface().querySelectorAll('img[data-portfolio-carousel-project]')].map(node=>({project:Number(node.dataset.portfolioCarouselProject),actual:parseFloat(node.style.left),expected:left+(Number(node.dataset.portfolioCarouselProject)-world.offset)*step,src:node.src}))});
    assert.ok(neighbors.length>0);assert.ok(neighbors.every(row=>Math.abs(row.actual-row.expected)<.001&&row.src.startsWith('data:image/svg+xml,')));
    assert.equal(await page.evaluate(()=>__manualCallbacks.size),1);await finish();
    check('Pending recurrence survives width/height/geometry.step changes and genuine moving-neighbor roles',neighbors);

    const sameTaskStart=await page.evaluate(()=>read().offset);
    await page.evaluate(()=>ReactDOM.flushSync(()=>{H4.getFilmControls().select(2);H4.getFilmControls().togglePaused()}));
    assert.equal(await page.evaluate(()=>__manualCallbacks.size),0);assert.equal(await page.evaluate(()=>read().offset),sameTaskStart);assert.equal(await page.evaluate(()=>read().project),2);
    await page.evaluate(()=>ReactDOM.flushSync(()=>H4.getFilmControls().togglePaused()));await numericBlock('Same-task retarget plus Pause resumes toward new target',2,2,16);await finish();
    await page.evaluate(()=>ReactDOM.flushSync(()=>{H4.getFilmControls().select(5);for(const media of __motionQueries){Object.defineProperty(media,'matches',{configurable:true,value:true});media.dispatchEvent(new Event('change'))}}));
    assert.equal(await page.evaluate(()=>__manualCallbacks.size),0);assert.equal(await page.evaluate(()=>read().offset),5);assert.equal(await page.evaluate(()=>read().project),5);
    await page.evaluate(()=>ReactDOM.flushSync(()=>{for(const media of __motionQueries){delete media.matches;media.dispatchEvent(new Event('change'))}}));
    check('Same-task target+Pause/reduced controls read live store state; reduced motion resolves a still',true);

    for(const frozen of['canvas','export','thumbnail']){
      const goal=frozen==='export'?6:1;
      await target(goal);await numericBlock('Before '+frozen+' freeze',goal,2,16);
      await page.evaluate(frozen=>{mode.target=frozen;ReactDOM.flushSync(()=>render())},frozen);await wait(()=>read().active==='false');
      assert.equal(await page.evaluate(()=>__manualCallbacks.size),0);const still=await page.evaluate(()=>document.querySelector('[data-actor]').getAttribute('style'));
      await page.evaluate(()=>__manualStep(1000));assert.equal(await page.evaluate(()=>document.querySelector('[data-actor]').getAttribute('style')),still);
      await page.evaluate(()=>{mode.target='preview';ReactDOM.flushSync(()=>render())});await wait(()=>read().active==='true');
      assert.equal(await page.evaluate(()=>__manualCallbacks.size),0);assert.equal(await page.evaluate(()=>read().offset),await page.evaluate(()=>read().project));
    }
    check('Canvas/export/thumbnail freeze all pending callbacks and return to selected entry still',true);
    await target(7);await numericBlock('Unmount with pending settle',7,2,16);
    await page.evaluate(()=>{ReactDOM.flushSync(()=>app.unmount());if(__manualCallbacks.size||__settleFrames.size)throw Error('Owned RAF leaked');window.requestAnimationFrame=__savedSettleRAF;window.cancelAnimationFrame=__savedSettleCAF});
    assert.equal(await page.evaluate(()=>H4.getCarouselLayout().get().active),false);
    check('One owned RAF terminates at declared pixel threshold, freezes and cleans on unmount with no added GPU/media',true);
    check('No uncaught errors in focused recurrence/repress/lifecycle proof',errors.length===0);

    fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result(),null,2)+'\n');console.log(JSON.stringify(result(),null,2));
  } finally {await context.close();await browser.close()}
} catch(error) {fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({passed:false,source:pin(file),checks,samples,errors,error:String(error.stack??error)},null,2)+'\n');throw error}
