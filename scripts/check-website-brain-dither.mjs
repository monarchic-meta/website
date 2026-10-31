import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
// Exercise the real manual port with Canvas 2D doubles. These checks establish
// geometry fidelity, real ordered tonal quantization, lifecycle and buffer bounds.
// Benchmarks isolate CPU quantization; actual browser readback and visual QA are separate.
// Run with pnpm check:website-brain-dither; actual Framer Preview is reviewed separately.
const repo=fileURLToPath(new URL('../', import.meta.url)).replace(/\/$/, '');
const require=createRequire(repo+'/package.json');
const ts=require('typescript');
const file=repo+'/docs/design-studies/code-components/WebsiteBrainDither.tsx';
const wb01=fs.readFileSync(repo+'/docs/design-studies/code-components/WebsiteBrain.tsx');
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
const core=ts.transpileModule(prefix+'\nglobalThis.testBrain={prepareGeometry,createRenderer,getFibers:()=>preparedFibers,makeDitherTable,makeBayer,orderedDither,DITHER_PALETTE,DITHER_WORDS};',{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const contextNames=['save','restore','setTransform','clearRect','fillRect','stroke','fill','beginPath','moveTo','lineTo','arc','drawImage','quadraticCurveTo','bezierCurveTo','closePath','translate','rotate','scale','ellipse'];
let maxWidthProduct=0,bitmapCount=0,bitmapClosed=0;
const bitmapSizes=[];
class Path2D { constructor(){this.commands=[]} moveTo(...x){this.commands.push(['moveTo',...x])} lineTo(...x){this.commands.push(['lineTo',...x])} arc(...x){this.commands.push(['arc',...x])} closePath(...x){this.commands.push(['closePath',...x])} }
const makeGrayRaster=(width,height,value=38)=>{const data=new Uint8ClampedArray(width*height*4);for(let i=0;i<data.length;i+=4){data[i]=data[i+1]=data[i+2]=value;data[i+3]=255}return data};
class Canvas {
  _width=1;_height=1;attrs={};clientWidth=704;clientHeight=580;parentElement;
  constructor(){this.commands=[];this.context={imageSmoothingEnabled:true,createRadialGradient:()=>({addColorStop(){}}),getImageData:(x,y,width,height)=>{this.commands.push(['getImageData']);return{width,height,data:makeGrayRaster(width,height)}},putImageData:image=>{this.commands.push(['putImageData']);this.lastImage=image.data}};for(const name of contextNames)this.context[name]=(...args)=>{this.commands.push([name,...args.map(x=>x instanceof Canvas?'canvas':x instanceof Path2D?x.commands:x)])}}
  set width(x){this._width=x;this.context.imageSmoothingEnabled=true;maxWidthProduct=Math.max(maxWidthProduct,x*this._height)}get width(){return this._width}
  set height(x){this._height=x;this.context.imageSmoothingEnabled=true;maxWidthProduct=Math.max(maxWidthProduct,x*this._width)}get height(){return this._height}
  getContext(name){assert.equal(name,'2d');return this.context}
  setAttribute(k,v){this.attrs[k]=v}
}
const document={createElement:()=>new Canvas()};
const window={setTimeout,devicePixelRatio:1,matchMedia:()=>({matches:false})};
const sandbox={console,window,document,performance,Path2D,createImageBitmap:async canvas=>{bitmapCount++;bitmapSizes.push([canvas.width,canvas.height]);return{width:canvas.width,height:canvas.height,close(){bitmapClosed++}}},Float32Array,Uint8Array,Int8Array,Uint32Array,Math,Promise,setTimeout,clearTimeout};
vm.createContext(sandbox);vm.runInContext(core,sandbox);
const {prepareGeometry,createRenderer,getFibers,makeDitherTable,makeBayer,orderedDither,DITHER_PALETTE,DITHER_WORDS}=sandbox.testBrain;
const paletteKeys=new Map(Array.from(DITHER_WORDS,(word,index)=>[word,Array.from(DITHER_PALETTE[index]).join(',')]));
const matrix4=Array.from(makeBayer(4));
assert.deepEqual(matrix4,[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5],'Actual Bayer4 matrix, not an arbitrary overlay');
const histogram=data=>{const packed=new Map(),words=new Uint32Array(data.buffer,data.byteOffset,data.length/4);for(const word of words){assert.ok(paletteKeys.has(word),'All artwork colors must be opaque and palette-quantized');packed.set(word,(packed.get(word)??0)+1)}return new Map([...packed].map(([word,count])=>[paletteKeys.get(word),count]))};
for(const size of [4,8]) {
  assert.deepEqual([...makeBayer(size)].sort((a,b)=>a-b),Array.from({length:size*size},(_,i)=>i),'Every Bayer rank occurs exactly once');
  const table=makeDitherTable(String(size),1,1),gray=makeGrayRaster(size,size);
  orderedDither(gray,size,size,1,table);
  const counts=histogram(gray);
  assert.equal(counts.get('0,0,0'),size*size/2,'Half-tone field has the correct ordered black coverage');
  assert.equal(counts.get('94,76,22'),size*size/2,'Half-tone field has the correct adjacent dark-gold coverage');
  let previous=-1;
  for(let value=0;value<=255;value+=5) {
    const ramp=makeGrayRaster(size,size,value);orderedDither(ramp,size,size,1,table);histogram(ramp);
    let luminance=0;for(let i=0;i<ramp.length;i+=4)luminance+=54*ramp[i]+183*ramp[i+1]+19*ramp[i+2];
    assert.ok(luminance>=previous,'Ordered average luminance increases monotonically with source tone');previous=luminance;
  }
  for(const exposure of [.4,1.15,2.5])for(const contrast of [.5,1,2]) {
    const black=makeGrayRaster(size,size,0);orderedDither(black,size,size,1,makeDitherTable(String(size),exposure,contrast));
    assert.equal(histogram(black).get('0,0,0'),size*size,'Empty black background never acquires an unrelated lattice');
  }
  const a=makeGrayRaster(7,5),b=new Uint8ClampedArray(a);
  orderedDither(a,7,5,2,table);orderedDither(b,7,5,2,table);
  assert.deepEqual(a,b,'Frozen output is deterministic for identical source pixels and controls');histogram(a);
  for(let y=0;y<5;y+=2)for(let x=0;x<7;x+=2){const sample=Array.from(a.subarray((y*7+x)*4,(y*7+x)*4+4));for(let py=y;py<Math.min(5,y+2);py++)for(let px=x;px<Math.min(7,x+2);px++)assert.deepEqual(Array.from(a.subarray((py*7+px)*4,(py*7+px)*4+4)),sample,'Larger pitch fills exact clipped screen-space cells')}
}
const benchmark=[];
for(const [width,height] of [[768,634],[384,350],[1600,1250]])for(const pitch of [1,2]) {
  const table=makeDitherTable('4',1.05,1),source=makeGrayRaster(width,height);
  for(let i=0;i<source.length;i+=4)source[i]=source[i+1]=source[i+2]=(i/4*13)%256;
  const times=[];for(let iteration=0;iteration<5;iteration++){const frame=new Uint8ClampedArray(source),started=performance.now();orderedDither(frame,width,height,pitch,table);times.push(performance.now()-started);histogram(frame)}
  times.sort((a,b)=>a-b);benchmark.push({width,height,pixels:width*height,pitch,medianMs:Number(times[2].toFixed(3)),maxMs:Number(times.at(-1).toFixed(3))});
}

const start=performance.now();
const [first,second]=await Promise.all([prepareGeometry(),prepareGeometry()]);
assert.equal(first,second,'Concurrent mounts share immutable preparation');
assert.ok(first.length>1000,'Actual dense anatomical field generated');
const geometryHash=()=>{const hash=crypto.createHash('sha256');for(const fiber of getFibers()) {hash.update(Buffer.from(fiber.points.buffer));hash.update(Buffer.from(fiber.projected.buffer));hash.update(Buffer.from(fiber.pointFade.buffer));}return hash.digest('hex')};
const before=geometryHash();
const host={dataset:{},querySelector:()=>({textContent:''})};
const display=new Canvas();display.parentElement=host;
const settings={mode:'website-brain-dither',ditherPitch:1,ditherExposure:1.05,ditherContrast:1,ditherMatrix:'4',animate:true,static:false,canvasPreview:false,speed:1,stillTime:8,interactive:true,primary:'#ffd21a',secondary:'#fff',ink:'#000',renderWidth:704,renderHeight:580,managedBufferWidth:768,managedBufferHeight:632,pixelBudget:1000000,colorHost:display};
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
render.renderAt(8);
const firstPixels=new Uint8ClampedArray(output.lastImage);
assert.equal(display.context.imageSmoothingEnabled,false,'Retained larger display copies use nearest sampling');
display.context.imageSmoothingEnabled=true;
render.renderAt(8.05);
assert.equal(display.context.imageSmoothingEnabled,false,'Nearest sampling is reasserted before each coordinator commit');
assert.deepEqual(output.lastImage,firstPixels,'Deterministic fake readback establishes quantizer repeatability, not actual framebuffer feedback behavior');
const reads=output.commands.map(([name],i)=>name==='getImageData'?i:-1).filter(i=>i>=0);
let previousRead=-1;
for(const index of reads){assert.ok(output.commands.slice(previousRead+1,index).some(([name,x,y,width,height])=>name==='clearRect'&&x===0&&y===0&&width===output.width&&height===output.height),'Every postprocess read has a new full-backing clear since the preceding read, including surplus integer edge pixels');previousRead=index}
assert.equal(display.attrs['data-brain-dither'],'bayer-4');
assert.equal(display.attrs['data-brain-dither-source'],'WebsiteBrainDither.tsx / WB-02');
assert.equal(display.attrs['data-brain-dither-palette'],'#000000 #5e4c16 #ffd21a #f2efda');
assert.ok(Number(display.attrs['data-brain-dither-ms'])>=0,'Public display exposes the actual readback/quantization duration');
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
console.log(JSON.stringify({pass:true,wb01SHA256:crypto.createHash('sha256').update(wb01).digest('hex'),benchmark,fibers:first.length,geometrySHA256:before,preparationAndRendersMs:Math.round(performance.now()-start),maxWorkingSurfacePixels:maxWidthProduct,createdBitmaps:bitmapCount,closedBitmaps:bitmapClosed,portSHA256:crypto.createHash('sha256').update(input).digest('hex'),portBytes:Buffer.byteLength(input)},null,2));
