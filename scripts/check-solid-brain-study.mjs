import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

// Real embedded anatomy and renderer, bounded Canvas/WebGL host doubles.
// These establish topology, lifecycle, dimensions and submitted render state;
// real shader pixels, font appearance and GPU cadence are separate browser QA.
const repo=fileURLToPath(new URL('../',import.meta.url)),ts=createRequire(import.meta.url)('typescript');
const file=path.join(repo,'docs/design-studies/code-components/SolidBrainStudy.tsx'),source=fs.readFileSync(file,'utf8');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex'),checks=[];
const check=(name,fn)=>{fn();checks.push(name)};
const logo=fs.readFileSync(path.join(repo,'docs/design-studies/code-components/LogoStudy.tsx'),'utf8');
check('Exact existing coordinator, hook and color resolver',()=>{
  for(const [start,end]of [['const colorCache=new Map','function createRenderer('],['// Embedded identically in the five standalone Framer files.','function useStudySurface('],['function useStudySurface(','/**\n * @framerSupportedLayoutWidth']])assert.ok(source.includes(logo.slice(logo.indexOf(start),logo.indexOf(end,logo.indexOf(start)))));
  assert.ok(!/createFiberField|prepareGeometry|getPersistentBrainCache/.test(source),'Filled surface must not initialize the streamline model');
  const factory=source.slice(source.indexOf('function createRenderer('),source.indexOf('const colorCache=new Map'));
  assert.ok(!/getImageData|readPixels/.test(factory),'No per-frame CPU raster readback');
});
const declarations=new Map([
  [path.join(repo,'__solid-react.d.ts'),`export interface CSSProperties {[key:string]:string|number|undefined};export interface RefObject<T>{current:T|null};export function useRef<T>(value:T):{current:T};export function useRef<T>(value:T|null):RefObject<T>;export function useState<T>(value:T):[T,(value:T|((prior:T)=>T))=>void];export function useEffect(fn:()=>void|(()=>void),deps:unknown[]):void;export function useLayoutEffect(fn:()=>void|(()=>void),deps:unknown[]):void;export function createElement(...args:any[]):any;interface HostEvent{currentTarget:HTMLElement;target:EventTarget;pointerType:string;clientX:number;clientY:number;stopPropagation():void}declare global{namespace JSX{interface IntrinsicElements{[tag:string]:{[key:string]:unknown;onPointerMoveCapture?:(e:HostEvent)=>void;onPointerMove?:(e:HostEvent)=>void;onPointerDown?:(e:HostEvent)=>void;onClick?:(e:HostEvent)=>void}}}}`],
  [path.join(repo,'__solid-framer.d.ts'),`export const RenderTarget:{canvas:string;export:string;thumbnail:string;current():string};export const ControlType:Record<string,string>;export function useIsStaticRenderer():boolean;export function addPropertyControls(component:unknown,controls:unknown):void;`],
]);
check('Strict semantic TypeScript with real DOM libraries',()=>{
  const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Node10,jsx:ts.JsxEmit.React,baseUrl:repo,paths:{react:['__solid-react.d.ts'],framer:['__solid-framer.d.ts']}};
  const host=ts.createCompilerHost(options),read=host.readFile.bind(host),exists=host.fileExists.bind(host);host.readFile=p=>declarations.get(p)??read(p);host.fileExists=p=>declarations.has(p)||exists(p);host.getSourceFile=(p,v)=>{const text=host.readFile(p);return text===undefined?undefined:ts.createSourceFile(p,text,v,true)};
  const diagnostics=ts.getPreEmitDiagnostics(ts.createProgram([file],options,host));assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics.slice(0,8),{getCurrentDirectory:()=>repo,getCanonicalFileName:x=>x,getNewLine:()=> '\n'}));
});
const packed=Buffer.from(source.match(/const SOLID_BRAIN_MESH_BASE64 = "([^"]+)"/)[1],'base64');
check('Pinned real MNI152 packed anatomy',()=>{assert.equal(packed.length,553861);assert.equal(sha(packed),'6da203c83dadcbd17084ac4dd3d35ef09765b05a21e8248d46ecd9e6caac382c');assert.equal(packed.readUInt32LE(4),28929);assert.equal(packed.readUInt32LE(8),58038);assert.ok(source.includes('Copyright (C) 1993–2004 Louis Collins'))});

let serial=0,maxSurfacePixels=0,readbacks=0,losses=0;
const contexts=[],canvases=[],resources=new Map();let fault='';
class GL {
  constructor(canvas){this.canvas=canvas;this.textureUnits=new Map();this.unit=0;this.program=null;this.framebuffer=null;this.calls=[];this.uniforms=new Map();this.boundBuffer=null;this.glyphUploads=0;this.meshUploads=0;this.lost=false;this.driverLost=false;this.generation=0;this.constants=new Map();contexts.push(this);return new Proxy(this,{get:(object,name)=>{if(typeof name==='string'&&/^[A-Z0-9_]+$/.test(name)){if(!object.constants.has(name))object.constants.set(name,object.constants.size+1);return object.constants.get(name)}return object[name]}})}
  make(kind){if(fault===kind){fault='';return null}const value={id:++serial,kind,generation:this.generation};resources.set(value,this);return value}
  erase(value){assert.ok(!value||this.driverLost||value.generation===this.generation,'Stale pre-loss handles cannot be deleted in a restored GL context');if(value)resources.delete(value)}
  createBuffer(){return this.make('buffer')}deleteBuffer(x){this.erase(x)}createTexture(){return this.make('texture')}deleteTexture(x){this.erase(x)}createShader(){return this.make('shader')}deleteShader(x){this.erase(x)}createProgram(){return this.make('program')}deleteProgram(x){this.erase(x)}createRenderbuffer(){return this.make('renderbuffer')}deleteRenderbuffer(x){this.erase(x)}createFramebuffer(){return this.make('framebuffer')}deleteFramebuffer(x){this.erase(x)}
  getShaderPrecisionFormat(){return{precision:23}}shaderSource(shader,text){shader.source=text}compileShader(){}getShaderParameter(){if(fault==='compile'){fault='';return false}return true}getShaderInfoLog(){return'fixture shader compile failure'}attachShader(){}linkProgram(){}getProgramParameter(){if(fault==='link'){fault='';return false}return true}getProgramInfoLog(){return''}
  bindBuffer(target,buffer){this.boundBuffer=buffer}bufferData(target,data){assert.ok(data.length>0);this.boundBuffer.length=data.length;this.meshUploads++}
  bindTexture(target,texture){this.textureUnits.set(this.unit,texture)}texParameteri(){}pixelStorei(){}
  texImage2D(...args){const texture=this.textureUnits.get(this.unit);assert.ok(texture);texture.width=args.length===9?args[3]:args[5].width;texture.height=args.length===9?args[4]:args[5].height;if(args.length===6)this.glyphUploads++;assert.ok(texture.width>0&&texture.height>0)}
  bindRenderbuffer(target,buffer){this.renderbuffer=buffer}renderbufferStorage(target,format,width,height){assert.ok(width*height<=2000000)}bindFramebuffer(target,framebuffer){this.framebuffer=framebuffer}framebufferTexture2D(){}framebufferRenderbuffer(){}checkFramebufferStatus(){if(fault==='incomplete'){fault='';return-1}return this.FRAMEBUFFER_COMPLETE}
  getUniformLocation(program,name){return{program,name}}uniform1f(location,value){assert.ok(Number.isFinite(value));this.uniforms.set(location.name,value)}uniform1i(location,value){this.uniforms.set(location.name,value)}uniform2f(location,x,y){assert.ok(Number.isFinite(x)&&Number.isFinite(y));this.uniforms.set(location.name,[x,y])}uniform3f(location,...values){assert.ok(values.every(Number.isFinite));this.uniforms.set(location.name,values)}uniformMatrix3fv(location,transpose,value){assert.equal(transpose,false);assert.equal(value.length,9);assert.ok([...value].every(Number.isFinite));this.uniforms.set(location.name,new Float32Array(value))}
  getAttribLocation(program,name){return name==='a_position'?0:name==='a_normal'?1:2}enableVertexAttribArray(){}vertexAttribPointer(){}viewport(x,y,w,h){assert.equal(x,0);assert.equal(y,0);assert.ok(w*h<=2000000)}disable(){}enable(){}depthFunc(){}depthMask(){}clearColor(){}clear(){}useProgram(program){this.program=program}activeTexture(unit){this.unit=unit===this.TEXTURE1?1:0}
  drawElements(mode,count,type,offset){assert.ok(this.framebuffer,'Filled mesh is rendered into its depth framebuffer');assert.equal(mode,this.TRIANGLES);assert.equal(count,58038*3);assert.equal(type,this.UNSIGNED_SHORT);assert.equal(offset,0);this.calls.push('surface')}
  drawArrays(mode,first,count){assert.equal(this.framebuffer,null);assert.equal(mode,this.TRIANGLE_STRIP);assert.equal(first,0);assert.equal(count,4);assert.ok(this.textureUnits.get(0)?.width>0,'Lit surface texture is complete');assert.ok(this.textureUnits.get(1)?.width>0,'Glyph sampler is complete even in dither mode');this.calls.push('post')}
  flush(){}readPixels(){readbacks++;throw Error('Forbidden per-frame readback')}
  getExtension(name){return name==='WEBGL_lose_context'?{loseContext:()=>{if(!this.lost){this.lost=true;losses++}}}:null}
}
class Canvas {
  _width=1;_height=1;clientWidth=704;clientHeight=582;attributes={};listeners=new Map();parentElement={dataset:{}};
  constructor(){this.context2d={fillStyle:'#ffffff',imageSmoothingEnabled:true,clearRect(){},fillText:(text)=>this.fontCharacters.push(text)};this.fontCharacters=[];canvases.push(this)}
  set width(x){this._width=x;maxSurfacePixels=Math.max(maxSurfacePixels,x*this._height)}get width(){return this._width}set height(x){this._height=x;maxSurfacePixels=Math.max(maxSurfacePixels,x*this._width)}get height(){return this._height}
  getContext(kind){if(kind==='webgl')return this.gl??=new GL(this);if(kind==='2d')return this.context2d;throw Error('Unexpected rendering context')}
  addEventListener(name,callback){this.listeners.set(name,callback)}removeEventListener(name,callback){if(this.listeners.get(name)===callback)this.listeners.delete(name)}dispatch(name){if(name==='webglcontextlost'){this.gl.driverLost=true;for(const[resource,owner]of resources)if(owner===this.gl)resources.delete(resource)}else if(name==='webglcontextrestored'&&this.gl.driverLost){this.gl.driverLost=false;this.gl.generation++}this.listeners.get(name)?.({preventDefault(){}})}setAttribute(name,value){this.attributes[name]=value}
}
const code=ts.transpileModule(source.slice(source.indexOf('type Mode ='),source.indexOf('// Embedded identically in the five standalone Framer files.')),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const api=Function('document','performance','atob',code+'\nreturn{getSolidBrainMesh,solidRamp,solidRotation,createRenderer};')({createElement:()=>new Canvas()},performance,atob);
const decodeStarted=performance.now(),mesh=api.getSolidBrainMesh(),decodeMs=performance.now()-decodeStarted;
const meshHash=()=>{const hash=crypto.createHash('sha256');for(const values of [mesh.positions,mesh.normals,mesh.occlusion,mesh.indices])hash.update(Buffer.from(values.buffer,values.byteOffset,values.byteLength));return hash.digest('hex')};
const initialMeshHash=meshHash();
check('Fast memoized filled mesh, finite unit normals and intact index topology',()=>{assert.equal(api.getSolidBrainMesh(),mesh);assert.equal(mesh.positions.length,28929*3);assert.equal(mesh.indices.length,58038*3);for(let i=0;i<28929;i++){assert.ok(Number.isFinite(mesh.positions[i*3])&&Number.isFinite(mesh.positions[i*3+1])&&Number.isFinite(mesh.positions[i*3+2]));assert.ok(Math.hypot(...mesh.positions.subarray(i*3,i*3+3))<=1.5);assert.ok(Math.abs(Math.hypot(...mesh.normals.subarray(i*3,i*3+3))-1)<2e-6);assert.ok(mesh.occlusion[i]>=.43&&mesh.occlusion[i]<=1)}assert.ok(mesh.indices.every(index=>index<28929))});
check('Bounded actual-font ramp and valid camera matrices',()=>{assert.equal(api.solidRamp(''), ' .:-=+*#%@');assert.equal(api.solidRamp('\n🎨'), ' .:-=+*#%@');assert.equal(api.solidRamp('.#'),' .#');assert.ok(api.solidRamp('X'.repeat(10000)).length<=32);for(const angle of [-75,-12,0,75])assert.ok([...api.solidRotation(angle*Math.PI/180,-.08)].every(Number.isFinite))});
const defaults={mode:'dither',animate:true,static:false,canvasPreview:false,speed:.65,stillTime:8,scale:1,exposure:1.05,contrast:1.1,pixelPitch:1.3,glyphSize:6,glyphRamp:' .:-=+*#%@',yaw:-12,relief:.85,interactive:true,primary:'#ffd21a',secondary:'#f2efda',ink:'#000000',managed:true,renderWidth:704,renderHeight:582,managedBufferWidth:768,managedBufferHeight:634,pixelBudget:1000000};
function instance(mode='dither',override={}){const canvas=new Canvas(),display=new Canvas(),settings={...defaults,mode,colorHost:display,...override};return{canvas,display,settings,renderer:api.createRenderer(canvas,settings,()=>{})}}
const dither=instance();dither.renderer.renderAt(8);
check('Dither submits filled triangles then tonal treatment with complete samplers',()=>{assert.deepEqual(dither.canvas.gl.calls,['surface','post']);assert.equal(dither.canvas.gl.uniforms.get('u_mode'),0);assert.equal(dither.canvas.gl.glyphUploads,0);assert.equal(dither.canvas.width,768);assert.equal(dither.canvas.height,634);assert.equal(dither.display.context2d.imageSmoothingEnabled,false);assert.equal(dither.display.attributes['data-solid-brain-triangles'],'58038');assert.equal(dither.display.attributes['data-solid-brain-mode'],'dither')});
dither.renderer.dispose();assert.equal(resources.size,0);
const text=instance('text');text.renderer.renderAt(8);
check('First text allocation uses CSS cell spacing, never atlas resolution',()=>{const expected=6*Math.min(768/704,634/582);assert.ok(Math.abs(text.canvas.gl.uniforms.get('u_glyphCell')-expected)<1e-8);assert.equal(text.canvas.gl.uniforms.get('u_mode'),1);assert.equal(text.canvas.gl.glyphUploads,1);assert.equal(text.display.attributes['data-solid-brain-glyph-size'],'6');assert.ok(Math.abs(Number(text.display.attributes['data-solid-brain-glyph-cell'])-expected)<1e-8);assert.ok(canvases.some(canvas=>canvas.fontCharacters.join('')===' .:-=+*#%@'.slice(1)))});
check('Atlas reuse, control updates and 50% resize preserve CSS dimensions',()=>{
  text.renderer.update({...text.settings,exposure:1.2});text.renderer.renderAt(8.1);assert.equal(text.canvas.gl.glyphUploads,1);assert.ok(text.canvas.gl.uniforms.get('u_glyphCell')<7);
  const next={...text.settings,managedBufferWidth:384,managedBufferHeight:317};text.renderer.update(next);text.renderer.renderAt(8.2);assert.equal(text.canvas.width,384);assert.equal(text.canvas.height,317);assert.equal(text.canvas.gl.glyphUploads,1);assert.ok(Math.abs(text.canvas.gl.uniforms.get('u_glyphCell')-6*Math.min(384/704,317/582))<1e-8);
  text.renderer.update({...next,glyphSize:9});text.renderer.renderAt(8.3);assert.equal(text.canvas.gl.glyphUploads,1);assert.ok(Math.abs(text.canvas.gl.uniforms.get('u_glyphCell')-9*Math.min(384/704,317/582))<1e-8);
  text.renderer.update({...next,glyphRamp:' .+#'});text.renderer.renderAt(8.4);assert.equal(text.canvas.gl.glyphUploads,2);assert.ok(Math.abs(text.canvas.gl.uniforms.get('u_glyphCell')-6*Math.min(384/704,317/582))<1e-8);
});
check('Exact managed raster, bounded resizing and no geometry reupload',()=>{const uploads=text.canvas.gl.meshUploads;for(const[width,height]of [[384,335],[1000,1000],[500,2000],[768,634]]){text.renderer.update({...text.settings,managedBufferWidth:width,managedBufferHeight:height});assert.equal(text.canvas.width,width);assert.equal(text.canvas.height,height)}assert.ok(maxSurfacePixels<=1000000);assert.equal(text.canvas.gl.meshUploads,uploads);assert.equal(readbacks,0);assert.equal(meshHash(),initialMeshHash)});
check('Context loss/restoration rebuilds resources without stale GL calls',()=>{const count=contexts.length,uploads=text.canvas.gl.meshUploads;text.canvas.dispatch('webglcontextrestored');assert.equal(text.canvas.gl.meshUploads,uploads,'Spurious restore must not replace live resources');text.canvas.dispatch('webglcontextlost');assert.equal(text.renderer.getSnapshot().lost,true);assert.equal(resources.size,0,'Lost context drops all driver resources and JS references before restoration');text.canvas.dispatch('webglcontextrestored');assert.equal(text.renderer.getSnapshot().lost,false);assert.equal(contexts.length,count);text.renderer.renderAt(8.5);assert.equal(text.canvas.gl.calls.at(-1),'post')});
text.renderer.dispose();
check('Disposal releases all GL resources and event handlers',()=>{assert.equal(resources.size,0);assert.equal(text.canvas.listeners.size,0);const calls=text.canvas.gl.calls.length;text.renderer.renderAt(10);assert.equal(text.canvas.gl.calls.length,calls)});
check('Paused resize replays the submitted pointer pose independently of DOM flags',()=>{
  const display=new Canvas();display.parentElement.dataset.solidPointerBlocked='true';
  const live=instance('dither',{colorHost:display});live.renderer.setPointer(0,0);live.renderer.renderAt(8);const neutral=Array.from(live.canvas.gl.uniforms.get('u_rotation'));live.renderer.setPointer(.23,-.18);live.renderer.renderAt(8);
  const liveMatrix=Array.from(live.canvas.gl.uniforms.get('u_rotation'));
  assert.notDeepEqual(liveMatrix,neutral,'Submitted pointer coordinates actually change the live camera');
  const warm=instance('dither',{colorHost:display,static:true,managedBufferWidth:384,managedBufferHeight:317});warm.renderer.setPointer(.23,-.18);warm.renderer.renderAt(8);
  assert.deepEqual(Array.from(warm.canvas.gl.uniforms.get('u_rotation')),liveMatrix,'Static refinement must replay the exact last submitted camera, even when an obsolete DOM flag is present');
  live.renderer.dispose();warm.renderer.dispose();assert.equal(resources.size,0);
});
check('Wrapper capture filters unwanted moves without cancelling page pan',()=>{
  const effects=[],listeners=new Map();let now=1000;
  const React={useRef:value=>({current:value}),useState:value=>[value,()=>{}],useEffect:callback=>effects.push(callback),useLayoutEffect(){},createElement:(type,props,...children)=>({type,props,children})};
  const framer={RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail',current:()=> 'canvas'},ControlType:{},useIsStaticRenderer:()=>true,addPropertyControls(){}};
  const exports={},module=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
  Function('require','exports','window','document','performance','atob',module)(name=>name==='react'?React:framer,exports,{addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:(name)=>listeners.delete(name)},{createElement:()=>new Canvas()},{now:()=>now},atob);
  const tree=exports.default({}),capture=tree.props.onPointerMoveCapture,cleanup=effects[0]();let prevented=0;
  const move=(pointerType,x,y)=>{let stopped=0;capture({pointerType,clientX:x,clientY:y,stopPropagation(){stopped++},preventDefault(){prevented++}});return stopped};
  assert.equal(move('mouse',20,30),0);assert.equal(move('mouse',20,30),1,'Layout-only move does not enter the pool');listeners.get('scroll')();now=1100;assert.equal(move('mouse',21,30),1,'Scroll guard preserves the submitted camera');now=1300;assert.equal(move('mouse',22,30),0);assert.equal(move('touch',30,40),1);assert.equal(prevented,0,'Touch scrolling retains its browser default');cleanup();assert.equal(listeners.size,0);
});
for(const failure of ['compile','link','buffer','texture','renderbuffer','framebuffer','incomplete'])check('Initialization cleanup on '+failure+' failure',()=>{fault=failure;assert.throws(()=>instance());assert.equal(resources.size,0);assert.ok(canvases.filter(canvas=>canvas.gl).every(canvas=>canvas.listeners.size===0))});
const still=instance('text',{static:true,pixelBudget:2000000,managedBufferWidth:1600,managedBufferHeight:1250});still.renderer.renderAt(8);still.renderer.dispose();
check('Static 2 MP target and immutable mesh survive repeated materials',()=>{assert.ok(maxSurfacePixels<=2000000);assert.equal(meshHash(),initialMeshHash);assert.equal(resources.size,0);assert.ok(contexts.every(context=>context.lost));assert.equal(readbacks,0)});
console.log(JSON.stringify({passed:true,sourceSHA256:sha(source),testSHA256:sha(fs.readFileSync(import.meta.filename)),packedSHA256:sha(packed),meshDecodedSHA256:initialMeshHash,vertices:28929,triangles:58038,decodeMs:Number(decodeMs.toFixed(3)),checks,contexts:contexts.length,lostContexts:losses,remainingResources:resources.size,maxSurfacePixels,readbacks,scope:'Actual decoded mesh and submitted GL state using driver/font doubles. Real pixels, GLSL compilation, Framer saves and browser frame rate are separate evidence.'},null,2));
