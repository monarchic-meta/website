import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

// Real geometry and drawing code, exercised with bounded Canvas 2D doubles.
// This verifies construction/lifecycle/controls; actual Framer pixels and cadence
// are separate evidence. No raster/image-quality claim is made by this script.
const repo=fileURLToPath(new URL('../',import.meta.url));
const ts=createRequire(import.meta.url)('typescript');
const file=path.join(repo,'docs/design-studies/code-components/WebsiteBrainFibers.tsx');
const source=fs.readFileSync(file,'utf8');
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const checks=[];
const check=(name,fn)=>{fn();checks.push({name,passed:true})};
const priorSources={
  'WebsiteBrain.tsx':'3b4daaef8469f119271233ab0b530851939234e3d06fb5092f01dd5b67dcf0d4',
  'WebsiteBrainDither.tsx':'785f81ad5548dc05b7cc96e4509ea168fe335faac205635780f6ec3f796b2da1',
};
check('WB-01 and WB-02 bytes preserved',()=>{
  for(const [name,expected]of Object.entries(priorSources))assert.equal(sha(fs.readFileSync(path.join(repo,'docs/design-studies/code-components',name))),expected);
});
const original=fs.readFileSync(path.join(repo,'src/scripts/interactive-brain.ts'),'utf8');
check('Exact original anatomy and existing shared coordinator',()=>{
  assert.ok(source.includes(original.slice(0,original.indexOf('const mountBrain = async'))));
  const base=fs.readFileSync(path.join(repo,'docs/design-studies/code-components/WebsiteBrain.tsx'),'utf8');
  const pool=base.slice(base.indexOf('// Embedded identically in the five standalone Framer files.'),base.indexOf('function useStudySurface('));
  assert.ok(pool.length>15000&&source.includes(pool));
  const factory=source.slice(source.indexOf('function createRenderer('),source.indexOf('const colorCache=new Map'));
  assert.ok(!/getImageData|putImageData|webgl/i.test(factory),'No per-frame pixel readback or WebGL');
});

// External host types only; all DOM, typed-array and algorithm types use the
// real TypeScript libraries. The application TS config deliberately excludes docs.
const reactDeclarations=`
export interface CSSProperties {[key:string]:string|number|undefined}
export interface RefObject<T>{current:T|null}
export function useRef<T>(value:T):{current:T};
export function useRef<T>(value:T|null):RefObject<T>;
export function useState<T=undefined>():[T|undefined,(value:T|undefined|((prior:T|undefined)=>T|undefined))=>void];
export function useState<T>(value:T):[T,(value:T|((prior:T)=>T))=>void];
export function useEffect(fn:()=>void|(()=>void),deps:unknown[]):void;
export function useLayoutEffect(fn:()=>void|(()=>void),deps:unknown[]):void;
export function createElement(...args:any[]):any;
interface HostEvent {currentTarget:HTMLElement;target:EventTarget;key:string;button:number;pointerId:number;pointerType:string;clientX:number;clientY:number;preventDefault():void;stopPropagation():void}
declare global {namespace JSX {interface IntrinsicElements {[tag:string]:{[key:string]:unknown;onPointerMove?:(event:HostEvent)=>void;onPointerLeave?:(event:HostEvent)=>void;onPointerDown?:(event:HostEvent)=>void;onPointerUp?:(event:HostEvent)=>void;onPointerCancel?:(event:HostEvent)=>void;onKeyDown?:(event:HostEvent)=>void;onClick?:(event:HostEvent)=>void}}}}
`;
const declarations=new Map([
  [path.join(repo,'__brain-fibers-react.d.ts'),reactDeclarations],
  [path.join(repo,'__brain-fibers-framer.d.ts'),`export const RenderTarget:{canvas:string;export:string;thumbnail:string;current():string};export const ControlType:Record<string,string>;export function useIsStaticRenderer():boolean;export function addPropertyControls(component:unknown,controls:unknown):void;`],
]);
check('Strict semantic TypeScript with real DOM libraries',()=>{
  const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Node10,jsx:ts.JsxEmit.React,baseUrl:repo,paths:{react:['__brain-fibers-react.d.ts'],framer:['__brain-fibers-framer.d.ts']}};
  const host=ts.createCompilerHost(options),read=host.readFile.bind(host),exists=host.fileExists.bind(host);
  host.readFile=file=>declarations.get(file)??read(file);host.fileExists=file=>declarations.has(file)||exists(file);
  host.getSourceFile=(file,version)=>{const text=host.readFile(file);return text===undefined?undefined:ts.createSourceFile(file,text,version,true)};
  const diagnostics=ts.getPreEmitDiagnostics(ts.createProgram([file],options,host));
  assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>repo,getCanonicalFileName:x=>x,getNewLine:()=> '\n'}));
});

const prefix=source.slice(source.indexOf('type Mode ='),source.indexOf('const colorCache=new Map'));
const core=ts.transpileModule(prefix+'\nglobalThis.testBrain={prepareGeometry,createRenderer,getFibers:()=>preparedFibers,makeFasciclePlans,createFiberRenderPlan,projectFascicle,fascicleLanePoint,smoothFasciclePath,buildRotationMatrix};',{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
let maxSurfacePixels=0,bitmapCount=0,bitmapClosed=0,readbacks=0;
const bitmapSizes=[];
class Path2D {
  constructor(){this.count=0;this.curves=0;this.sum=0;this.first=null;this.last=null}
  add(name,args){for(const value of args)assert.ok(Number.isFinite(value),'All drawn coordinates remain finite');this.count++;this.sum+=args.reduce((sum,n,i)=>sum+n*(i+1),0);if(!this.first)this.first=[name,...args];this.last=[name,...args]}
  moveTo(...x){this.add('moveTo',x)}lineTo(...x){this.add('lineTo',x)}arc(...x){this.add('arc',x)}closePath(){this.add('closePath',[])}
  quadraticCurveTo(...x){this.curves++;this.add('quadraticCurveTo',x)}
}
const canvases=[];
class Canvas {
  _width=1;_height=1;attrs={};clientWidth=704;clientHeight=580;parentElement;commands=[];
  constructor(){
    const state=[];this.context={
      createRadialGradient:()=>({addColorStop(){}}),
      getImageData(){readbacks++;throw Error('Fiber renderer must not read pixels')},
      putImageData(){throw Error('Fiber renderer must not postprocess pixels')},
      save:()=>state.push({strokeStyle:this.context.strokeStyle,lineWidth:this.context.lineWidth,globalAlpha:this.context.globalAlpha}),
      restore:()=>Object.assign(this.context,state.pop()),
    };
    for(const name of ['setTransform','clearRect','fillRect','stroke','fill','beginPath','moveTo','lineTo','arc','drawImage','quadraticCurveTo','bezierCurveTo','closePath','translate','rotate','scale','ellipse'])this.context[name]=(...args)=>{
      for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),name+' has finite arguments');
      this.commands.push([name,...args.map(arg=>arg instanceof Canvas?'canvas':arg instanceof Path2D?{count:arg.count,curves:arg.curves,sum:Math.round(arg.sum*1e4)/1e4}:arg),this.context.strokeStyle,this.context.lineWidth]);
    };canvases.push(this);
  }
  set width(value){this._width=value;maxSurfacePixels=Math.max(maxSurfacePixels,value*this._height)}get width(){return this._width}
  set height(value){this._height=value;maxSurfacePixels=Math.max(maxSurfacePixels,value*this._width)}get height(){return this._height}
  getContext(name){assert.equal(name,'2d');return this.context}
  setAttribute(key,value){this.attrs[key]=value}
}
const sandbox={console,document:{createElement:()=>new Canvas()},window:{setTimeout,devicePixelRatio:1,matchMedia:()=>({matches:false})},performance,Path2D,createImageBitmap:async canvas=>{bitmapCount++;bitmapSizes.push([canvas.width,canvas.height]);return{width:canvas.width,height:canvas.height,close(){bitmapClosed++}}},Float32Array,Uint8Array,Uint16Array,Int8Array,Uint32Array,Math,Promise,setTimeout,clearTimeout};
vm.createContext(sandbox);vm.runInContext(core,sandbox);
const {prepareGeometry,createRenderer,getFibers,makeFasciclePlans,createFiberRenderPlan,projectFascicle,fascicleLanePoint,smoothFasciclePath,buildRotationMatrix}=sandbox.testBrain;
const started=performance.now();
const [first,second]=await Promise.all([prepareGeometry(),prepareGeometry()]);
check('Dense exact anatomy prepared once for concurrent mounts',()=>{assert.equal(first,second);assert.equal(first.length,3816);assert.deepEqual([...new Set(first.map(f=>f.region))].sort(),['cerebellum','cerebrum','stem'])});
const geometryHash=()=>{const hash=crypto.createHash('sha256');for(const f of getFibers()){hash.update(Buffer.from(f.points.buffer));hash.update(Buffer.from(f.projected.buffer));hash.update(Buffer.from(f.pointFade.buffer))}return hash.digest('hex')};
const geometryBefore=geometryHash(),plans=makeFasciclePlans(first,first.map(createFiberRenderPlan));
check('Regional fascicles remain bounded original centerlines',()=>{
  assert.ok(plans.length>=60&&plans.length<=92,'Bounded selected anatomy, not unbounded added geometry');
  assert.equal(new Set(plans.map(p=>p.fiberIndex)).size,plans.length);
  assert.deepEqual([...new Set(plans.map(p=>first[p.fiberIndex].region))].sort(),['cerebellum','cerebrum','stem']);
  for(const p of plans){assert.ok(p.samples.length<=81);assert.equal(p.samples[0],0);assert.equal(p.samples.at(-1),first[p.fiberIndex].points.length/3-1);for(let i=1;i<p.samples.length;i++)assert.ok(p.samples[i]>p.samples[i-1])}
});
check('Smooth lanes follow projections, taper symmetrically and do not cross wraps',()=>{
  const matrix=buildRotationMatrix(-.34,-.055,-.018);
  for(const p of plans){const f=first[p.fiberIndex];projectFascicle(p,f,matrix,150,150,350,290,7.8);assert.ok([...p.projected].every(Number.isFinite));
    for(const i of [0,Math.floor(p.samples.length/2),p.samples.length-1]){const c=fascicleLanePoint(p,f,i,0,2),a=fascicleLanePoint(p,f,i,-1,2),b=fascicleLanePoint(p,f,i,1,2);assert.ok(Math.abs((a[0]+b[0])*.5-c[0])<1e-8);assert.ok(Math.abs((a[1]+b[1])*.5-c[1])<1e-8);if(i===0||i===p.samples.length-1)assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-7)}
    const full=smoothFasciclePath(p,f,0,1),tail=smoothFasciclePath(p,f,0,1,.9,1);assert.ok(full.curves>0);assert.ok(tail.count<full.count);assert.deepEqual(tail.last.slice(1),Array.from(fascicleLanePoint(p,f,p.samples.length-1,0,1)));
  }
});
const host={dataset:{},querySelector:()=>({textContent:''})},display=new Canvas();display.parentElement=host;
const settings={mode:'website-brain-fibers',strandWidth:.95,depthSeparation:.7,signalGain:1,animate:true,static:false,canvasPreview:false,speed:1,stillTime:8,interactive:true,primary:'#ffd21a',secondary:'#fff',ink:'#000',renderWidth:704,renderHeight:580,managedBufferWidth:768,managedBufferHeight:632,pixelBudget:1000000,colorHost:display};
const output=new Canvas(),renderer=createRenderer(output,settings,()=>{});
check('Managed integer axes, one-axis refresh and substrate sizing',()=>{
  for(const [width,height]of [[768,632],[384,317],[384,318],[384,335],[768,634]]){renderer.update({...settings,managedBufferWidth:width,managedBufferHeight:height});assert.equal(output.width,width);assert.equal(output.height,height);assert.deepEqual(bitmapSizes.at(-1),[width,height])}
});
renderer.update(settings);renderer.renderAt(8);renderer.renderAt(8.05);
check('Actual refined paths render without readback and keep source geometry immutable',()=>{
  assert.equal(readbacks,0);assert.equal(geometryHash(),geometryBefore);
  assert.equal(output.attrs['data-brain-fiber-count'],'3816');assert.equal(output.attrs['data-brain-fascicle-count'],String(plans.length));
  assert.ok(output.commands.some(row=>row[0]==='stroke'&&row[1]?.curves>0));
  assert.equal(output.attrs['data-brain-render-style'],'fine-anatomical-fascicles');
});
check('Visual controls independently change drawing commands',()=>{
  const renderHash=control=>{const target=new Canvas(),r=createRenderer(target,{...settings,...control},()=>{});r.renderAt(8);const hash=sha(JSON.stringify(target.commands));r.dispose();return hash};
  for(const [name,a,b]of [['strandWidth',.55,1.5],['depthSeparation',0,1],['signalGain',0,1.75]])assert.notEqual(renderHash({[name]:a}),renderHash({[name]:b}),name+' must affect actual drawing');
});
check('Trace starts on real projected fibers, expires and never replays on reacquisition',()=>{
  renderer.update({...settings,trace:{id:1,x:.46,y:.47}});renderer.renderAt(8.1);assert.equal(output.attrs['data-brain-live-pulses'],'1');
  renderer.renderAt(10.4);assert.equal(output.attrs['data-brain-live-pulses'],'0');renderer.dispose();
  const again=createRenderer(new Canvas(),{...settings,trace:{id:1,x:.46,y:.47}},()=>{});again.renderAt(10.4);assert.equal(display.attrs['data-brain-live-pulses'],'0');
  again.update({...settings,renderWidth:400,renderHeight:1000,managedBufferWidth:480,managedBufferHeight:1200});again.renderAt(11);again.dispose();assert.ok(maxSurfacePixels<=1000000);
});
await Promise.resolve();await Promise.resolve();
check('All stale/disposed substrate bitmaps closed and geometry remains isolated',()=>{assert.equal(bitmapClosed,bitmapCount);assert.equal(geometryHash(),geometryBefore)});
console.log(JSON.stringify({passed:true,sourceSHA256:sha(source),testSHA256:sha(fs.readFileSync(import.meta.filename)),checks,semanticTypeScript:{diagnostics:0,realDOMLibraries:true},scope:'Real geometry/Canvas2D drawing/lifecycle with host doubles; not actual pixel fidelity, browser cadence or Framer persistence.',fibers:first.length,fascicles:plans.length,geometrySHA256:geometryBefore,readbacks,maxWorkingSurfacePixels:maxSurfacePixels,createdBitmaps:bitmapCount,closedBitmaps:bitmapClosed,totalMs:Math.round(performance.now()-started),preservedSources:priorSources},null,2));
