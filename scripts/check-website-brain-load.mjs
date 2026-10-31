import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

// Real geometry/plan generation and renderer code with bounded host doubles.
// This checks preparation sharing, cache failure recovery and data isolation;
// browser IndexedDB, actual raster quality and Framer startup are separate QA.
const repo=fileURLToPath(new URL('../',import.meta.url));
const ts=createRequire(import.meta.url)('typescript');
const names=['WebsiteBrain','WebsiteBrainDither','WebsiteBrainText','WebsiteBrainFibers'];
const sources=Object.fromEntries(names.map(name=>[name,fs.readFileSync(path.join(repo,'docs/design-studies/code-components',name+'.tsx'),'utf8')]));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const expectedGeometry='094dd2137ef55511d3a5ed2abcffa0c990614fb425451ea3f381b86787f7fc99';
const original=fs.readFileSync(path.join(repo,'src/scripts/interactive-brain.ts'),'utf8');
const preamble=original.slice(0,original.indexOf('const mountBrain = async'));
const acceptedSource='c5024620207d5a801582a745f16dc1663500b3bb20a455e9d6bd9b35364ecc7e';
assert.equal(sha(original),acceptedSource,'Manual cache source version matches the accepted complete generator source');
assert.equal(sha(preamble),'8a30b9e5befcbd7e87571bb6c41c113ccd3981d605874a056c324b84665bf29b','Manual cache contract binds the complete anatomy and base-plan preamble');
const logo=fs.readFileSync(path.join(repo,'docs/design-studies/code-components/LogoStudy.tsx'),'utf8');
const pool=logo.slice(logo.indexOf('// Embedded identically in the five standalone Framer files.'),logo.indexOf('function useStudySurface('));
for(const [name,source]of Object.entries(sources)){
  assert.ok(source.includes(preamble),name+' retains every exact anatomy/plan helper');
  assert.ok(source.includes(pool),name+' retains the existing per-window rendering coordinator');
  assert.ok(source.includes('Symbol.for("monarchic.website-brain.anatomy.v1.'+sha(original)+'")'),name+' shared cache cannot outlive its actual generator version');
  assert.ok(source.includes('const BRAIN_DERIVED_CACHE_VERSION = "'+sha(original)+':packed-v2"'),name+' persistent version is tied to the actual original source');
  const inlineCodec=source.slice(source.indexOf('// Inline-only derived-data cache.'),source.indexOf('// Share exact immutable anatomy and base plans')).trimEnd();
  assert.equal(sha(inlineCodec),'d5fc1f2c7dc9ec88f92dbfcbee863f83fa639ee2c0e49c4dd76433da1b3745b4',name+' packed-v2 retains the reviewed codec/helper (full fixture SHA 2ea8bcf8…)');
  const isFibers=name==='WebsiteBrainFibers';
  const staticBody=source.slice(source.indexOf('  const drawStaticSubstrate = () => {'),source.indexOf('  const updateStatus = ('));
  const liveBody=source.slice(source.indexOf('  const draw = (time: number, elapsed: number) => {'),source.indexOf('  // The existing shared coordinator'));
  assert.equal(sha(staticBody),isFibers?'b35f6a6823f3683f42523361d7d36256c7e910419c1674def21bd2a472765dfd':'4cee98bd22f6b2338a11e448a0cd193d160eb89bac8fe1ca619ea8abe9a8c576',name+' static draw remains byte exact to accepted material');
  assert.equal(sha(liveBody),isFibers?'e806f76573928b5cc78461abe2dbf76e50d7662e7122a2962a272c6c6cab5156':'b226c403d4f50319104db8a2b5302a3fa5fd461e90b32b831fd534ff2354dad8',name+' live draw remains byte exact to accepted material');
}
const geometryHash=fibers=>{const hash=crypto.createHash('sha256');for(const fiber of fibers){hash.update(Buffer.from(fiber.points.buffer));hash.update(Buffer.from(fiber.projected.buffer));hash.update(Buffer.from(fiber.pointFade.buffer))}return hash.digest('hex')};
const payloadHash=(fibers,plans)=>{const hash=crypto.createHash('sha256');for(const item of [...fibers,...plans])for(const[key,value]of Object.entries(item).sort(([a],[b])=>a.localeCompare(b))){hash.update(key);hash.update(ArrayBuffer.isView(value)?Buffer.from(value.buffer,value.byteOffset,value.byteLength):JSON.stringify(value))}return hash.digest('hex')};
function makeEnvironment(){
  const state={yields:0,bitmaps:0,closed:0,canvasCount:0,listeners:new Map(),observers:[],rejectYield:false};
  const realm={scheduler:{yield:()=>{state.yields++;if(state.rejectYield){state.rejectYield=false;return Promise.reject(new Error('fixture geometry failure'))}return new Promise(resolve=>setImmediate(resolve))}}};
  const window={devicePixelRatio:1,setTimeout,matchMedia:()=>({matches:false}),addEventListener:(name,callback)=>state.listeners.set(name,callback),removeEventListener:(name,callback)=>{if(state.listeners.get(name)===callback)state.listeners.delete(name)}};
  class Path2D {moveTo(){}lineTo(){}arc(){}closePath(){}quadraticCurveTo(){}}
  class Canvas {
    width=1;height=1;clientWidth=704;clientHeight=582;attrs={};parentElement;
    constructor(){state.canvasCount++;this.context={createRadialGradient:()=>({addColorStop(){}}),createImageData:(width,height)=>({width,height,data:new Uint8ClampedArray(width*height*4)}),getImageData:(x,y,width,height)=>{const data=new Uint8ClampedArray(width*height*4);for(let i=0;i<data.length;i+=4){data[i]=data[i+1]=data[i+2]=38;data[i+3]=255}return{width,height,data}}};for(const name of ['save','restore','setTransform','clearRect','fillRect','stroke','fill','beginPath','moveTo','lineTo','arc','drawImage','quadraticCurveTo','bezierCurveTo','closePath','translate','rotate','scale','ellipse','fillText','putImageData'])this.context[name]=()=>{}}
    getContext(name){assert.equal(name,'2d');return this.context}setAttribute(name,value){this.attrs[name]=value}getAttribute(name){return this.attrs[name]??null}
  }
  class MutationObserver {constructor(callback){this.callback=callback;this.disconnected=false;state.observers.push(this)}observe(target){this.target=target}disconnect(){this.disconnected=true}}
  const document={createElement:()=>new Canvas()};
  const createImageBitmap=async canvas=>{state.bitmaps++;return{width:canvas.width,height:canvas.height,close(){state.closed++}}};
  return{state,realm,window,document,Path2D,Canvas,MutationObserver,createImageBitmap};
}
const coreCode=Object.fromEntries(names.map(name=>[name,ts.transpileModule(sources[name].slice(sources[name].indexOf('type Mode ='),sources[name].indexOf('const colorCache=new Map')),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText]));
function loadCore(name,env){return Function('window','document','performance','Path2D','createImageBitmap','globalThis',coreCode[name]+'\nreturn {prepareGeometry,getPreparedRenderPlans,getBrainLoadProfile,createRenderer,packBrainCache,unpackBrainCache,setPersistentCache:cache=>persistentBrainCache=cache,key:BRAIN_GEOMETRY_KEY};')(env.window,env.document,performance,env.Path2D,env.createImageBitmap,env.realm)}
const env=makeEnvironment(),apis=names.map(name=>loadCore(name,env));
const coldStarted=performance.now();
const prepared=await Promise.all(apis.map(api=>api.prepareGeometry()));
const sharedColdMs=performance.now()-coldStarted;
assert.ok(prepared.every(fibers=>fibers===prepared[0]),'All four standalone modules join one immutable geometry object');
assert.equal(env.state.yields,80,'Only one anatomical build yields, rather than four duplicate jobs');
assert.equal(prepared[0].length,3816);assert.equal(geometryHash(prepared[0]),expectedGeometry);
const plans=apis[0].getPreparedRenderPlans();
assert.ok(apis.every(api=>api.getPreparedRenderPlans()===plans),'All materials share the same base render-plan arrays');
assert.deepEqual(apis.map(api=>api.getBrainLoadProfile().cacheSource),['generated','shared-pending','shared-pending','shared-pending']);
const sharedReady=loadCore('WebsiteBrainDither',env),warmStarted=performance.now();
assert.equal(await sharedReady.prepareGeometry(),prepared[0]);
const sharedWarmMs=performance.now()-warmStarted;
assert.equal(sharedReady.getBrainLoadProfile().cacheSource,'shared-ready');assert.equal(env.state.yields,80,'Warm material import does not generate anatomy again');
const beforePayload=payloadHash(prepared[0],plans);
const settings={mode:'website-brain',animate:true,static:false,canvasPreview:false,speed:1,stillTime:8,interactive:true,primary:'#ffd21a',secondary:'#fff',ink:'#000',renderWidth:704,renderHeight:582,managedBufferWidth:768,managedBufferHeight:634,pixelBudget:1000000,ditherPitch:1,ditherExposure:1.05,ditherContrast:1,ditherMatrix:'4',glyphSize:8,glyphDensity:1.25,glyphContrast:1,glyphRamp:' .:-=+*#%@',strandWidth:.95,depthSeparation:.7,signalGain:1};
const rendererTimes=[];
for(let i=0;i<apis.length;i++){
  const api=apis[i],host={dataset:{},querySelector:()=>({textContent:''})},display=new env.Canvas();display.parentElement=host;
  const beforeBitmaps=env.state.bitmaps,still=api.createRenderer(new env.Canvas(),{...settings,static:true,colorHost:display},()=>{});
  still.renderAt(8);still.dispose();assert.equal(env.state.bitmaps,beforeBitmaps,'One-shot static preparation skips an unused async bitmap');
  const started=performance.now(),output=new env.Canvas(),live=api.createRenderer(output,{...settings,colorHost:display},()=>{});const factoryMs=performance.now()-started;
  live.renderAt(8);live.update({...settings,colorHost:display,trace:{id:1,x:.46,y:.47}});live.renderAt(8.1);assert.equal(output.attrs['data-brain-live-pulses'],'1');live.dispose();
  rendererTimes.push({name:names[i],factoryMs:Number(factoryMs.toFixed(3))});
  assert.equal(payloadHash(prepared[0],plans),beforePayload,'Private projections and WB-04 plan edits cannot mutate shared geometry or base plans');
}
await Promise.resolve();await Promise.resolve();assert.equal(env.state.closed,env.state.bitmaps,'Every live or stale substrate bitmap is closed');

// Storage read results are injected at the reviewed helper boundary. The data
// itself goes through the real packed-v2 codec, not a hand-built replacement.
const packed=apis[0].packBrainCache({fibers:prepared[0],plans}),restored=apis[0].unpackBrainCache(packed);
assert.ok(restored);assert.equal(payloadHash(restored.fibers,restored.plans),beforePayload,'Persistent payload restores every scalar and typed-array byte exactly');
const persistentEnv=makeEnvironment(),persistentApis=names.map(name=>loadCore(name,persistentEnv));let persistentReads=0;
persistentApis[0].setPersistentCache({read:async()=>{persistentReads++;return{data:restored,reason:'hit',readMs:12}},writeSoon:()=>{throw Error('Hit must not write again')}});
const fromStorage=await Promise.all(persistentApis.map(api=>api.prepareGeometry()));
assert.ok(fromStorage.every(fibers=>fibers===restored.fibers));assert.equal(persistentReads,1);assert.equal(persistentEnv.state.yields,0,'A persistent hit never regenerates anatomy');
assert.equal(persistentApis[0].getBrainLoadProfile().cacheSource,'persistent');assert.ok(persistentApis.every(api=>api.getBrainLoadProfile().origin==='persistent'));
for(const api of persistentApis){const host={dataset:{},querySelector:()=>({textContent:''})},display=new persistentEnv.Canvas();display.parentElement=host;const renderer=api.createRenderer(new persistentEnv.Canvas(),{...settings,static:true,colorHost:display},()=>{});renderer.renderAt(8);renderer.dispose()}
assert.equal(payloadHash(restored.fibers,restored.plans),beforePayload,'Frozen persistent payload is immutable through every material renderer');
const unavailableEnv=makeEnvironment(),unavailableApi=loadCore('WebsiteBrain',unavailableEnv);let unavailableWrites=0;
unavailableApi.setPersistentCache({read:async()=>{throw Error('fixture storage unavailable')},writeSoon:async()=>{unavailableWrites++;return false}});
assert.equal(geometryHash(await unavailableApi.prepareGeometry()),expectedGeometry);assert.equal(unavailableEnv.state.yields,80,'Storage failure falls back to exactly one faithful generation');
assert.equal(unavailableWrites,0,'Unavailable storage avoids a useless deferred packing job');assert.equal(unavailableApi.getBrainLoadProfile().persistentReadReason,'error');

const writePendingEnv=makeEnvironment(),writePendingApi=loadCore('WebsiteBrain',writePendingEnv);let queuedWrites=0;
writePendingApi.setPersistentCache({read:async()=>({reason:'miss',readMs:0}),writeSoon:()=>{queuedWrites++;return new Promise(()=>{})}});
let prepareDeadline;
try {
  const preparedWhileWritePending=await Promise.race([
    writePendingApi.prepareGeometry(),
    new Promise((resolve,reject)=>{prepareDeadline=setTimeout(()=>reject(new Error('Preparation incorrectly awaited the optional cache write')),10000)}),
  ]);
  assert.equal(geometryHash(preparedWhileWritePending),expectedGeometry,'Supported cache miss resolves faithful preparation while its optional write remains pending');
} finally {clearTimeout(prepareDeadline)}
assert.equal(writePendingEnv.state.yields,80,'Supported miss generates anatomy exactly once');
assert.equal(queuedWrites,1,'Supported miss queues one nonblocking cache write');

const failedEnv=makeEnvironment();failedEnv.state.rejectYield=true;
const failedApis=names.map(name=>loadCore(name,failedEnv));
const failed=await Promise.allSettled(failedApis.map(api=>api.prepareGeometry()));
assert.ok(failed.every(result=>result.status==='rejected'));
assert.equal(failedEnv.window[failedApis[0].key],undefined,'Rejected shared resource is evicted');
const retried=await Promise.all(failedApis.map(api=>api.prepareGeometry()));
assert.ok(retried.every(fibers=>fibers===retried[0]));assert.equal(geometryHash(retried[0]),expectedGeometry);
assert.equal(failedEnv.state.yields,81,'One failed yield plus one retry job, with no duplicate retry builds');

const staleEnv=makeEnvironment();let rejectStale;
staleEnv.realm.scheduler.yield=()=>new Promise((resolve,reject)=>{rejectStale=reject});
const staleApi=loadCore('WebsiteBrain',staleEnv),stalePromise=staleApi.prepareGeometry();
for(let i=0;i<8&&!rejectStale;i++)await Promise.resolve();assert.ok(rejectStale);
const value={fibers:prepared[0],plans,origin:'generated',geometryMs:0,plansMs:0,startedAt:0,readyAt:0};
const replacement={state:'ready',startedAt:0,promise:Promise.resolve(value)};
staleEnv.window[staleApi.key]=replacement;rejectStale(new Error('stale fixture failure'));
await assert.rejects(stalePromise,/stale fixture/);assert.equal(staleEnv.window[staleApi.key],replacement,'Stale rejection cannot delete a newer compatible resource');
assert.equal(await staleApi.prepareGeometry(),prepared[0]);

// Exercise the real React effect with hook doubles. Geometry work may finish
// after unmount, but it must not update state/DOM or leave observers/listeners.
function loadComponent(name,hostEnv){
  const refs=[],effects=[],updates=[];
  const React={useRef:value=>{const ref={current:value};refs.push(ref);return ref},useState:value=>[value,next=>updates.push(next)],useEffect:callback=>effects.push(callback),useLayoutEffect:()=>{},createElement:(type,props,...children)=>({type,props,children})};
  const framer={RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail',current:()=> 'canvas'},ControlType:{},useIsStaticRenderer:()=>true,addPropertyControls(){}};
  const exports={};const code=ts.transpileModule(sources[name],{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
  Function('require','exports','window','document','performance','Path2D','createImageBitmap','MutationObserver','globalThis',code)(name=>name==='react'?React:framer,exports,hostEnv.window,hostEnv.document,performance,hostEnv.Path2D,hostEnv.createImageBitmap,hostEnv.MutationObserver,hostEnv.realm);
  exports.default({});const host={dataset:{}},surface=new hostEnv.Canvas();refs[0].current=host;refs[1].current=surface;
  return{host,surface,effect:effects[0],updates};
}
const cancelledEnv=makeEnvironment();let finishCancelled;
cancelledEnv.window[apis[0].key]={state:'pending',startedAt:0,promise:new Promise(resolve=>{finishCancelled=resolve})};
const cancelled=loadComponent('WebsiteBrain',cancelledEnv),cleanup=cancelled.effect(),beforeCleanup=JSON.stringify(cancelled.host.dataset);
cleanup();finishCancelled(value);for(let i=0;i<8;i++)await Promise.resolve();
assert.equal(cancelled.updates.length,0,'No state update after stale mount cleanup');assert.equal(JSON.stringify(cancelled.host.dataset),beforeCleanup,'No stale DOM status/timing update');assert.equal(cancelledEnv.state.listeners.size,0);assert.ok(cancelledEnv.state.observers.every(observer=>observer.disconnected));
cancelledEnv.state.observers[0].callback();assert.equal(JSON.stringify(cancelled.host.dataset),beforeCleanup,'Even an already queued observer callback is inert after cleanup');
const activeEnv=makeEnvironment();activeEnv.window[apis[0].key]=replacement;
const active=loadComponent('WebsiteBrainText',activeEnv),activeCleanup=active.effect();for(let i=0;i<8;i++)await Promise.resolve();
assert.equal(active.host.dataset.brainCacheSource,'shared-ready');assert.ok(Number(active.host.dataset.brainPrepareMs)>=0);
active.surface.setAttribute('data-study-state','pending');activeEnv.state.observers[0].callback();assert.equal(active.host.dataset.brainFirstFrameMs,undefined,'Inadequate pending frame cannot report first usable paint');
active.surface.setAttribute('data-study-state','ready');activeEnv.state.observers[0].callback();assert.ok(Number(active.host.dataset.brainFirstFrameMs)>=0);assert.equal(active.host.dataset.brainLoadState,'painted');activeCleanup();
console.log(JSON.stringify({passed:true,sourceSHA256:Object.fromEntries(names.map(name=>[name,sha(sources[name])])),scope:'Same-realm actual geometry/helpers and renderer code with minimal Canvas/React/observer doubles. Persistent read outcomes are helper-boundary doubles using the real packed codec; actual browser IndexedDB, pixels and paint are separate evidence.',fibers:3816,geometrySHA256:expectedGeometry,sharedColdMs:Number(sharedColdMs.toFixed(3)),sharedWarmMs:Number(sharedWarmMs.toFixed(3)),generationYieldCount:env.state.yields,rendererTimes,liveBitmaps:env.state.bitmaps,closedBitmaps:env.state.closed,checks:['accepted source/preamble/codec version binding','exact anatomy/plans/drawing/pool','cross-module promise and base-plan coalescing','warm module reuse','immutable shared data across all materials','static bitmap suppression','live bitmap cleanup','persistent-hit integration skips generation','storage-failure integration generates once','supported miss does not await pending write','shared rejection and retry','stale rejection guard','async mount/observer cleanup','committed cached-frame timing metadata']},null,2));
