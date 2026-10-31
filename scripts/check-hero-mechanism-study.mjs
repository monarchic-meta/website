import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createMechanismHost} from './hero-mechanism-test-host.mjs';

// Exact source assets/codec, strict DOM typing, actual geometry and submitted
// paths/materials in a bounded host. Pixel/artwork and pool regressions have
// separate browser and mixed-placement suites; no simulated pixels are claimed.
const repo=fileURLToPath(new URL('../',import.meta.url)),ts=createRequire(import.meta.url)('typescript');
const file=path.join(repo,'docs/design-studies/code-components/HeroMechanismStudy.tsx'),source=fs.readFileSync(file,'utf8');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex'),checks=[],check=(name,fn)=>{fn();checks.push(name);};
const logo=fs.readFileSync(path.join(repo,'docs/design-studies/code-components/LogoStudy.tsx'),'utf8');
check('Byte-exact common color resolver, v2 coordinator and lifecycle hook',()=>{
  for(const[start,end]of [['const colorCache=new Map','function createRenderer('],['// Embedded identically in the five standalone Framer files.','function useStudySurface('],['function useStudySurface(','/**\n * @framerSupportedLayoutWidth']])assert.ok(source.includes(logo.slice(logo.indexOf(start),logo.indexOf(end,logo.indexOf(start)))));
  const art=source.slice(source.indexOf('type Mode='),source.indexOf('const colorCache=new Map'));assert.ok(!/requestAnimationFrame|setTimeout|setInterval|getImageData|readPixels|createFiberField|prepareGeometry/.test(art),'Graphics own no clocks/readback/streamline preprocessing');
});
const declarations=new Map([
  [path.join(repo,'__mechanism-react.d.ts'),`export interface CSSProperties{[key:string]:string|number|undefined};export interface RefObject<T>{current:T|null};export function useRef<T>(value:T):{current:T};export function useRef<T>(value:T|null):RefObject<T>;export function useState<T>(value:T):[T,(value:T|((prior:T)=>T))=>void];export function useEffect(fn:()=>void|(()=>void),deps:unknown[]):void;export function useLayoutEffect(fn:()=>void|(()=>void),deps:unknown[]):void;export function createElement(...args:any[]):any;interface HostEvent{currentTarget:HTMLElement;target:EventTarget;pointerType:string;clientX:number;clientY:number;stopPropagation():void}declare global{namespace JSX{interface IntrinsicElements{[tag:string]:{[key:string]:unknown;onPointerMoveCapture?:(e:HostEvent)=>void;onPointerMove?:(e:HostEvent)=>void;onPointerDown?:(e:HostEvent)=>void;onPointerUp?:(e:HostEvent)=>void;onClick?:(e:HostEvent)=>void}}}}`],
  [path.join(repo,'__mechanism-framer.d.ts'),`export const RenderTarget:{canvas:string;export:string;thumbnail:string;current():string};export const ControlType:Record<string,string>;export function useIsStaticRenderer():boolean;export function addPropertyControls(component:unknown,controls:unknown):void;`],
]);
check('Strict semantic TypeScript against real DOM libraries',()=>{
  const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Node10,jsx:ts.JsxEmit.React,baseUrl:repo,paths:{react:['__mechanism-react.d.ts'],framer:['__mechanism-framer.d.ts']}};
  const host=ts.createCompilerHost(options),read=host.readFile.bind(host),exists=host.fileExists.bind(host);host.readFile=p=>declarations.get(p)??read(p);host.fileExists=p=>declarations.has(p)||exists(p);host.getSourceFile=(p,v)=>{const text=host.readFile(p);return text===undefined?undefined:ts.createSourceFile(p,text,v,true);};
  const diagnostics=ts.getPreEmitDiagnostics(ts.createProgram([file],options,host));assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics.slice(0,8),{getCurrentDirectory:()=>repo,getCanonicalFileName:x=>x,getNewLine:()=> '\n'}));
});
const h=createMechanismHost(),core=ts.transpileModule(source.slice(source.indexOf('type Mode='),source.indexOf('// Embedded identically in the five standalone Framer files.')),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const api=vm.runInContext('(function(){'+core+';return{getMacFrames,getMacPaths,unpackVectorBlock,MAC_VECTOR_BASE64,MAC_VECTOR_RAW_BYTES,MAC_SYMBOLS,MECHA_GEOMETRY,getMechaNormals,getHeroHead,mechanismRotation,mechanismRaster,createRenderer};})()',h.context);
const packed=Buffer.from(api.MAC_VECTOR_BASE64,'base64'),raw=api.unpackVectorBlock(packed,api.MAC_VECTOR_RAW_BYTES);
check('Pinned GIF-derived vector payload decompresses exactly and rejects malformed input',()=>{
  assert.equal(packed.length,295422);assert.equal(hash(packed),'713dfacd1537844e3ced2911947472a51fec5f62dbb9b494082685868570b66e');assert.equal(raw.length,526986);assert.equal(hash(raw),'2b9b78c5b3d1a80c508364b5da8428bae79e4f1f519eb07db636bef50e10835e');
  assert.equal(hash(api.unpackVectorBlock(Uint8Array.from(packed),raw.length)),hash(raw),'Node Buffer and Uint8Array codec inputs agree');
  for(const bytes of [[],[0x10],[0x00,0,0],[0x0f,1],[0xf0,255]])assert.throws(()=>api.unpackVectorBlock(Uint8Array.from(bytes),16));assert.throws(()=>api.unpackVectorBlock(packed,raw.length-1));assert.throws(()=>api.unpackVectorBlock(packed.subarray(0,packed.length-64),raw.length));
});
let pathCount=0,pointCount=0;
check('Four named source glyphs retain all 125 vector frames and two tonal layers',()=>{
  const frames=api.getMacFrames();assert.equal(api.getMacFrames(),frames);assert.equal(frames.length,125);assert.deepEqual(Array.from(api.MAC_SYMBOLS,x=>x.label),['HEEL STRIKE ZONE','ABRASION RESISTANT UPPER','LONG LASTING TRACTION','ECO RESPONSIBLE UPPER']);
  for(const frame of frames){assert.equal(frame.length,4);for(const symbol of frame){assert.equal(symbol.length,2);for(const layer of symbol)for(const loop of layer){assert.ok(loop.length>=6&&loop.length%2===0);pathCount++;pointCount+=loop.length/2;}}}
  assert.equal(pathCount,6513);assert.equal(pointCount,255976);assert.equal(api.getMacPaths(12),api.getMacPaths(12));assert.equal(api.getMacPaths(-1),api.getMacPaths(0));assert.equal(api.getMacPaths(10000),api.getMacPaths(124));assert.notEqual(hash(Buffer.concat(frames[12].flat(2).map(x=>Buffer.from(x)))),hash(Buffer.concat(frames[36].flat(2).map(x=>Buffer.from(x)))));
});
const mesh=api.getHeroHead(),meshHash=()=>hash(Buffer.concat([mesh.positions,mesh.normals,mesh.indices].map(x=>Buffer.from(x.buffer,x.byteOffset,x.byteLength)))),originalMesh=meshHash();
check('Licensed portrait geometry retains complete finite normalized source topology',()=>{
  const packedHead=Buffer.from(source.match(/const HERO_HEAD_BASE64="([^"]+)"/)[1],'base64');assert.equal(hash(packedHead),'f1edefb08f58862a763832bff1905820bb8b93181958629290df2707c16eca05');assert.equal(mesh.positions.length,9279*3);assert.equal(mesh.indices.length,17684*3);assert.equal(api.getHeroHead(),mesh);assert.ok(mesh.indices.every(i=>i<9279));for(let i=0;i<9279;i++){assert.ok(mesh.positions.subarray(i*3,i*3+3).every(Number.isFinite));assert.ok(Math.abs(Math.hypot(...mesh.normals.subarray(i*3,i*3+3))-1)<2e-7);}
});
check('MECHA uses actual source topology and bounded crease adjacency',()=>{
  const m=api.MECHA_GEOMETRY;assert.equal(m.vertices.length,696);assert.equal(m.faces.length,1364);assert.equal(m.edges.length,905);assert.ok(m.vertices.flat().every(Number.isFinite));assert.ok(m.vertices.every(p=>Math.hypot(...p)<2));for(const f of m.faces){assert.equal(f.length,3);assert.ok(f.every(i=>i>=0&&i<696));}for(const[a,b,...faces]of m.edges){assert.ok(a>=0&&a<696&&b>=0&&b<696);assert.ok(faces.length>0&&faces.every(i=>i>=0&&i<1364));}for(const n of api.getMechaNormals())assert.ok(Math.abs(Math.hypot(...n)-1)<1e-8);
});
check('Camera rotation is orthonormal and exact coordinator demand is never underfloored',()=>{
  for(const yaw of [-3,-.62,0,1.7]){const r=api.mechanismRotation(yaw,.13);for(let i=0;i<3;i++)for(let j=0;j<3;j++){let n=0;for(let k=0;k<3;k++)n+=r[i*3+k]*r[j*3+k];assert.ok(Math.abs(n-(i===j?1:0))<2e-7);}}
  for(const[w,hh]of [[384,317],[384,335],[1024,640],[384,481],[768,634]])assert.deepEqual(Array.from(api.mechanismRaster(960,600,{managedBufferWidth:w,managedBufferHeight:hh,pixelBudget:1000000})),[w,hh]);
  const[w,hh]=api.mechanismRaster(10000,10000,{managedBufferWidth:10000,managedBufferHeight:10000,pixelBudget:2000000});assert.ok(w*hh<=2000000);
});
const defaults={animate:true,static:false,canvasPreview:false,speed:1,stillTime:1,artworkScale:1,density:1,intensity:1,motionSpan:1,scanPitch:2.5,blur:.65,interactive:true,primary:'#c4e5ca',light:'#fff',secondary:'#f3f3f1',accent:'#f00',ink:'#11120f',managed:true,renderWidth:960,renderHeight:600,managedBufferWidth:1024,managedBufferHeight:640,pixelBudget:1000000};
const fingerprint=c=>JSON.stringify(c.frame),states=[];
for(const mode of ['macmoss','vercel','raster','mecha','origin']){
  check(mode+' real renderer submits fresh bounded geometry/material and exact managed sizes',()=>{
    const canvas=new h.Canvas(),settings={...defaults,mode},dimensions=[];let peak=0;
    for(const name of ['width','height']){const d=Object.getOwnPropertyDescriptor(h.Canvas.prototype,name);Object.defineProperty(canvas,name,{get:d.get,set(value){d.set.call(this,value);dimensions.push([name,value]);peak=Math.max(peak,this.width*this.height);}});}
    const renderer=api.createRenderer(canvas,settings,()=>{});renderer.renderAt(1);assert.ok(canvas.frame);assert.equal(canvas.width,1024);assert.equal(canvas.height,640);
    if(mode==='macmoss'){assert.equal(canvas.frame.pathFills,8);assert.equal(canvas.attributes['data-hero-vector-frame'],'12');}if(mode==='origin')assert.equal(canvas.frame.gradients,3);if(mode==='mecha')assert.ok(Number(canvas.attributes['data-hero-visible-edges'])>200);
    const initial=fingerprint(canvas);renderer.renderAt(1);assert.equal(fingerprint(canvas),initial,'Same phase draws a fresh deterministic frame');renderer.renderAt(3);assert.notEqual(fingerprint(canvas),initial,'Source mechanism responds to phase');
    renderer.update({...settings,motionSpan:0});renderer.renderAt(1);const frozen=JSON.parse(fingerprint(canvas));renderer.renderAt(3);const other=JSON.parse(fingerprint(canvas));delete frozen.phase;delete other.phase;assert.deepEqual(other,frozen,'Motion span zero freezes all submitted geometry/material');
    renderer.update({...settings,intensity:1.5});renderer.renderAt(1);assert.equal(h.recording.invalidAlpha,0,'Allowed maximum intensity never submits invalid alpha');
    for(const[w,hh]of [[384,317],[384,335],[500,2000],[1000,1000],[768,634]]){dimensions.length=0;renderer.update({...settings,managedBufferWidth:w,managedBufferHeight:hh});assert.equal(canvas.width,w);assert.equal(canvas.height,hh);assert.deepEqual(dimensions.slice(0,2),[['width',1],['height',1]],'Resize resets 1×1 before changing aspect');}assert.ok(peak<=1000000);
    renderer.dispose();const before=fingerprint(canvas);renderer.renderAt(9);assert.equal(fingerprint(canvas),before,'Disposed renderer cannot submit new artwork');states.push({mode,peak,canvasKind:canvas.contextKind});
  });
}
check('Every source-led study and subject stand-in retain visible default credits and useful controls',()=>{
  const effects=[],captured=[],listeners=new Map();let now=1000,target='canvas',staticRenderer=false,schema;
  const React={Fragment:Symbol('fragment'),useRef:value=>({current:value}),useState:value=>[value,()=>{}],useEffect:callback=>effects.push(callback),useLayoutEffect(){},createElement:(type,props,...children)=>({type,props,children})};
  const framer={RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail',current:()=>target},ControlType:{},useIsStaticRenderer:()=>staticRenderer,addPropertyControls(component,controls){schema=controls;}};
  const start=source.indexOf('// Embedded identically in the five standalone Framer files.'),end=source.indexOf('/**\n * @framerSupportedLayoutWidth',start),fixture=source.slice(0,start)+'function useStudySurface(...args:any[]){capture(args[2]);return()=>{}}\n'+source.slice(end),module=ts.transpileModule(fixture,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,exports={};
  Function('require','exports','window','document','performance','atob','capture',module)(name=>name==='react'?React:framer,exports,{addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)},h.document,{now:()=>now},atob,value=>captured.push(value));
  assert.equal(Object.keys(schema).length,18);assert.ok(!schema.scale&&schema.artworkScale);assert.equal(schema.canvasMotion.defaultValue,false);
  const tree=exports.default({});assert.equal(captured.at(-1).static,true,'Canvas remains off even if static-renderer hook is false');assert.equal(captured.at(-1).artworkScale,1);exports.default({canvasMotion:true});assert.equal(captured.at(-1).static,false);assert.equal(captured.at(-1).canvasPreview,true);
  for(target of ['export','thumbnail']){exports.default({canvasMotion:true});assert.equal(captured.at(-1).static,true);assert.equal(captured.at(-1).canvasPreview,false);}target='preview';
  for(const[mode,id,credit]of [['macmoss','006','Mac Moss'],['vercel','009','Vercel'],['raster','014','Liubomyr Ulytskyi'],['mecha','015','Grzegorz Leśniewicz'],['origin','016','Origin Studio']]){const t=exports.default({study:mode}),text=JSON.stringify(t);assert.ok(text.includes('HERO-'+id)&&text.includes(credit));if(mode==='raster'){for(const value of ['Head/bust stand-in','Lee Perry-Smith','CC BY 3.0','https://creativecommons.org/licenses/by/3.0/'])assert.ok(text.includes(value));const button=t.children.flat().find(c=>c?.type==='button');assert.equal(button.props.style.top,'13%');}}
  assert.equal(schema.primary.hidden({study:'origin'}),true);assert.equal(schema.accent.hidden({study:'macmoss'}),true);assert.equal(schema.density.hidden({study:'mecha'}),true);assert.equal(schema.interactive.hidden({study:'macmoss'}),true);
  const cleanup=effects[0](),capture=tree.props.onPointerMoveCapture;let stopped=0;const move=(type,x,y)=>capture({pointerType:type,clientX:x,clientY:y,stopPropagation(){stopped++;}});move('mouse',20,30);assert.equal(stopped,0);move('mouse',20,30);assert.equal(stopped,1);listeners.get('scroll')();now=1100;move('mouse',21,30);assert.equal(stopped,2);now=1300;move('mouse',22,30);assert.equal(stopped,2);move('touch',23,30);assert.equal(stopped,3);cleanup();assert.equal(listeners.size,0);
});
check('Offline asset builder rejects missing and flag-shaped argument values',()=>{
  for(const args of [['--output','--write'],['--mac-gif','--write'],['--mecha-glb']]){const result=spawnSync(process.execPath,['scripts/build-framer-hero-mechanisms.mjs',...args],{cwd:repo,encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,/Missing value|Usage/);}
});
check('Source data stays immutable and disposal returns every admitted GL context',()=>{assert.equal(meshHash(),originalMesh);assert.equal(h.active.size,0);assert.equal(h.recording.kindConflicts,0);assert.equal(h.recording.invalidAlpha,0);assert.equal(hash(fs.readFileSync(path.join(repo,'docs/design-studies/code-components/HeroRecreationStudy.tsx'))),'cd2887061f8be4cc77ce45a14bfdf205a6cf3a2e147a9ac48baad3dfaf0bbb20');});
console.log(JSON.stringify({passed:true,sourceSHA256:hash(source),testSHA256:hash(fs.readFileSync(import.meta.filename)),checks,codec:{packedSHA256:hash(packed),rawSHA256:hash(raw),pathCount,pointCount},portraitMeshSHA256:originalMesh,states,recording:h.recording,scope:'Strict TypeScript, actual pinned geometry and decompressed vector contours, submitted renderer state in a bounded DOM/context host. Real pixels and 81 mixed placements are independently checked.'},null,2));
