import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
// Exercise the real manual port with Canvas 2D doubles. These checks establish
// geometry fidelity, lifecycle, trace timing and buffer bounds, not visual quality.
// Run with pnpm check:website-brain; actual Framer Preview is reviewed separately.
const repo=fileURLToPath(new URL('../', import.meta.url)).replace(/\/$/, '');
const require=createRequire(repo+'/package.json');
const ts=require('typescript');
const file=repo+'/docs/design-studies/code-components/WebsiteBrain.tsx';
const input=fs.readFileSync(file,'utf8');
const original=fs.readFileSync(repo+'/src/scripts/interactive-brain.ts','utf8');
const preamble=original.slice(0,original.indexOf('const mountBrain = async'));
assert.ok(input.includes(preamble),'All anatomical geometry/helpers remain byte exact');
const staticPass=original.slice(original.indexOf('  const drawStaticSubstrate = () => {'),original.indexOf('  const updateStatus = ('));
const livePass=original.slice(original.indexOf('  const draw = (time: number, elapsed: number) => {'),original.indexOf('  const frame = (time: number) =>'));
assert.ok(input.includes(staticPass),'Original static-substrate drawing pass remains byte exact');
assert.ok(input.includes(livePass),'Original live fiber/wave/particle drawing pass remains byte exact');
const logo=fs.readFileSync(repo+'/docs/design-studies/code-components/LogoStudy.tsx','utf8');
const pool=logo.slice(logo.indexOf('// Embedded identically in the five standalone Framer files.'),logo.indexOf('function useStudySurface('));
assert.ok(input.includes(pool),'Existing per-window coordinator remains byte exact');
assert.equal((input.match(/getContext\("webgl/g)||[]).length,0,'No WebGL context creation');
const syntax=ts.transpileModule(input,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}});
assert.equal(syntax.diagnostics?.length,0,'TSX syntax compiles');
const prefix=input.slice(input.indexOf('type Mode ='),input.indexOf('const colorCache=new Map'));
const core=ts.transpileModule(prefix+'\nglobalThis.testBrain={prepareGeometry,createRenderer,getFibers:()=>preparedFibers};',{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const contextNames=['save','restore','setTransform','clearRect','fillRect','stroke','fill','beginPath','moveTo','lineTo','arc','drawImage','quadraticCurveTo','bezierCurveTo','closePath','translate','rotate','scale','ellipse'];
let maxWidthProduct=0,bitmapCount=0,bitmapClosed=0;
const bitmapSizes=[];
class Path2D { constructor(){this.commands=[]} moveTo(...x){this.commands.push(['moveTo',...x])} lineTo(...x){this.commands.push(['lineTo',...x])} arc(...x){this.commands.push(['arc',...x])} closePath(...x){this.commands.push(['closePath',...x])} }
class Canvas {
  _width=1;_height=1;attrs={};clientWidth=704;clientHeight=580;parentElement;
  constructor(){this.commands=[];this.context={createRadialGradient:()=>({addColorStop(){}})};for(const name of contextNames)this.context[name]=(...args)=>{this.commands.push([name,...args.map(x=>x instanceof Canvas?'canvas':x instanceof Path2D?x.commands:x)])}}
  set width(x){this._width=x;maxWidthProduct=Math.max(maxWidthProduct,x*this._height)}get width(){return this._width}
  set height(x){this._height=x;maxWidthProduct=Math.max(maxWidthProduct,x*this._width)}get height(){return this._height}
  getContext(name){assert.equal(name,'2d');return this.context}
  setAttribute(k,v){this.attrs[k]=v}
}
const document={createElement:()=>new Canvas()};
const window={setTimeout,devicePixelRatio:1,matchMedia:()=>({matches:false})};
const sandbox={console,window,document,performance,Path2D,createImageBitmap:async canvas=>{bitmapCount++;bitmapSizes.push([canvas.width,canvas.height]);return{width:canvas.width,height:canvas.height,close(){bitmapClosed++}}},Float32Array,Uint8Array,Int8Array,Uint32Array,Math,Promise,setTimeout,clearTimeout};
vm.createContext(sandbox);vm.runInContext(core,sandbox);
const {prepareGeometry,createRenderer,getFibers}=sandbox.testBrain;
const start=performance.now();
const [first,second]=await Promise.all([prepareGeometry(),prepareGeometry()]);
assert.equal(first,second,'Concurrent mounts share immutable preparation');
assert.ok(first.length>1000,'Actual dense anatomical field generated');
const geometryHash=()=>{const hash=crypto.createHash('sha256');for(const fiber of getFibers()) {hash.update(Buffer.from(fiber.points.buffer));hash.update(Buffer.from(fiber.projected.buffer));hash.update(Buffer.from(fiber.pointFade.buffer));}return hash.digest('hex')};
const before=geometryHash();
const host={dataset:{},querySelector:()=>({textContent:''})};
const display=new Canvas();display.parentElement=host;
const settings={mode:'website-brain',animate:true,static:false,canvasPreview:false,speed:1,stillTime:8,interactive:true,primary:'#ffd21a',secondary:'#fff',ink:'#000',renderWidth:704,renderHeight:580,managedBufferWidth:768,managedBufferHeight:632,pixelBudget:1000000,colorHost:display};
const output=new Canvas();
const render=createRenderer(output,settings,()=>{});
assert.equal(output.width,768,'Managed desktop width exactly meets coordinator demand');
assert.equal(output.height,632,'Managed desktop height exactly meets coordinator demand');
for (const demand of [
  {renderWidth:704,renderHeight:580,managedBufferWidth:384,managedBufferHeight:317},
  {renderWidth:704,renderHeight:580,managedBufferWidth:384,managedBufferHeight:318},
  {renderWidth:390,renderHeight:340,managedBufferWidth:384,managedBufferHeight:335},
  {renderWidth:704,renderHeight:580,managedBufferWidth:768,managedBufferHeight:634},
]) {
  render.update({...settings,...demand});
  assert.equal(output.width,demand.managedBufferWidth,'Asymmetric managed width must satisfy cache adequacy without re-flooring');
  assert.equal(output.height,demand.managedBufferHeight,'Asymmetric managed height must satisfy cache adequacy without re-flooring');
  assert.deepEqual(bitmapSizes.at(-1),[demand.managedBufferWidth,demand.managedBufferHeight],'Immutable substrate is rebuilt at both exact demand axes, including a one-axis change');
}
render.update(settings);
render.renderAt(8);render.renderAt(8.05);
assert.equal(geometryHash(),before,'Drawing never mutates cached anatomical/projection seed data');
assert.ok(output.commands.filter(([name])=>name==='stroke').length>10,'Static and live drawing paths rendered');
assert.equal(output.attrs['data-brain-fiber-count'],String(first.length));
assert.equal(output.attrs['data-brain-phase'],'8.05');
render.update({...settings,trace:{id:1,x:.46,y:.47}});render.renderAt(8.1);
assert.equal(output.attrs['data-brain-live-pulses'],'1','First trace targets projected source fibers');
render.renderAt(10.4);
assert.equal(output.attrs['data-brain-live-pulses'],'0','Pulse expires in correct second/millisecond time domain');
render.dispose();
const again=createRenderer(new Canvas(),{...settings,trace:{id:1,x:.46,y:.47}},()=>{});again.renderAt(10.4);
assert.equal(display.attrs['data-brain-live-pulses'],'0','Lease reacquisition does not replay a consumed trace');
again.update({...settings,renderWidth:400,renderHeight:1000,managedBufferWidth:480,managedBufferHeight:1200});
again.renderAt(11);
assert.ok(maxWidthProduct<=1000000,'Buffer resize never transiently exceeds per-output live pixel budget');
again.dispose();
await Promise.resolve();await Promise.resolve();
assert.equal(bitmapClosed,bitmapCount,'Every stale or disposed immutable substrate bitmap is closed');
assert.equal(geometryHash(),before,'Multiple sizes/renderers leave source geometry intact');
console.log(JSON.stringify({pass:true,fibers:first.length,geometrySHA256:before,preparationAndRendersMs:Math.round(performance.now()-start),maxWorkingSurfacePixels:maxWidthProduct,createdBitmaps:bitmapCount,closedBitmaps:bitmapClosed,portSHA256:crypto.createHash('sha256').update(input).digest('hex'),portBytes:Buffer.byteLength(input)},null,2));
