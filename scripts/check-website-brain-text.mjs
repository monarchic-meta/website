import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
// Exercise the real manual port with Canvas 2D doubles. These checks establish
// geometry fidelity, image-derived glyph selection, lifecycle and buffer bounds.
// Font masks are deterministic doubles, not proof of actual browser font quality.
// CPU benchmarks include aggregation/stamping, not Canvas readback or full frames.
// Run with pnpm check:website-brain-text; actual Framer Preview is reviewed separately.
const repo=fileURLToPath(new URL('../', import.meta.url)).replace(/\/$/, '');
const require=createRequire(repo+'/package.json');
const ts=require('typescript');
const file=repo+'/docs/design-studies/code-components/WebsiteBrainText.tsx';
const wb01=fs.readFileSync(repo+'/docs/design-studies/code-components/WebsiteBrain.tsx');
const wb02=fs.readFileSync(repo+'/docs/design-studies/code-components/WebsiteBrainDither.tsx');
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
const core=ts.transpileModule(prefix+'\nglobalThis.testBrain={prepareGeometry,createRenderer,getFibers:()=>preparedFibers,normalizeGlyphRamp,createGlyphAtlas,makeGlyphTones,renderGlyphFrame,DEFAULT_GLYPH_RAMP,TEXT_BLACK};',{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const contextNames=['save','restore','setTransform','clearRect','fillRect','stroke','fill','beginPath','moveTo','lineTo','arc','drawImage','quadraticCurveTo','bezierCurveTo','closePath','translate','rotate','scale','ellipse'];
let maxWidthProduct=0,bitmapCount=0,bitmapClosed=0;
const bitmapSizes=[];
class Path2D { constructor(){this.commands=[]} moveTo(...x){this.commands.push(['moveTo',...x])} lineTo(...x){this.commands.push(['lineTo',...x])} arc(...x){this.commands.push(['arc',...x])} closePath(...x){this.commands.push(['closePath',...x])} }
const canvases=[];
const makeGrayRaster=(width,height,value=38)=>{const data=new Uint8ClampedArray(width*height*4);for(let i=0;i<data.length;i+=4){data[i]=data[i+1]=data[i+2]=value;data[i+3]=255}return data};
class Canvas {
  _width=1;_height=1;attrs={};clientWidth=704;clientHeight=580;parentElement;
  constructor(){canvases.push(this);this.commands=[];this.letters=[];this.context={imageSmoothingEnabled:true,createRadialGradient:()=>({addColorStop(){}}),createImageData:(width,height)=>({width,height,data:new Uint8ClampedArray(width*height*4)}),fillText:(character,x,y)=>{this.commands.push(['fillText',character,x,y]);this.letters.push({character,x,y,cell:Number(this.context.font.match(/(\d+)px/)[1])})},getImageData:(x,y,width,height)=>{this.commands.push(['getImageData']);const data=this.letters.length?new Uint8ClampedArray(width*height*4):makeGrayRaster(width,height);for(const letter of this.letters){const left=Math.floor(letter.x-letter.cell/2);for(let gy=1;gy<letter.cell-1;gy++)for(let gx=1;gx<letter.cell-1;gx++){if(gx===1||gy===letter.cell-2||((gx+gy+letter.character.charCodeAt(0))%3===0)){const px=left+gx;if(px<width)data[(gy*width+px)*4+3]=(gx+gy)%2?255:128}}}return{width,height,data}},putImageData:image=>{this.commands.push(['putImageData']);this.lastImage=new Uint8ClampedArray(image.data)}};for(const name of contextNames)this.context[name]=(...args)=>{this.commands.push([name,...args.map(x=>x instanceof Canvas?'canvas':x instanceof Path2D?x.commands:x)])}}
  set width(x){this._width=x;this.context.imageSmoothingEnabled=true;maxWidthProduct=Math.max(maxWidthProduct,x*this._height)}get width(){return this._width}
  set height(x){this._height=x;this.context.imageSmoothingEnabled=true;maxWidthProduct=Math.max(maxWidthProduct,x*this._width)}get height(){return this._height}
  getContext(name){assert.equal(name,'2d');return this.context}
  setAttribute(k,v){this.attrs[k]=v}
}
let failNextAtlasRead=false;
const document={createElement:()=>{const canvas=new Canvas(),read=canvas.context.getImageData;canvas.context.getImageData=(...args)=>{if(failNextAtlasRead&&canvas.letters.length){failNextAtlasRead=false;throw new Error('fixture atlas readback failure')}return read(...args)};return canvas}};
const window={setTimeout,devicePixelRatio:1,matchMedia:()=>({matches:false})};
const sandbox={console,window,document,performance,Path2D,createImageBitmap:async canvas=>{bitmapCount++;bitmapSizes.push([canvas.width,canvas.height]);return{width:canvas.width,height:canvas.height,close(){bitmapClosed++}}},Float32Array,Uint8Array,Int8Array,Uint32Array,Math,Promise,setTimeout,clearTimeout};
vm.createContext(sandbox);vm.runInContext(core,sandbox);
const {prepareGeometry,createRenderer,getFibers,normalizeGlyphRamp,createGlyphAtlas,makeGlyphTones,renderGlyphFrame,DEFAULT_GLYPH_RAMP,TEXT_BLACK}=sandbox.testBrain;
assert.equal(normalizeGlyphRamp(''),DEFAULT_GLYPH_RAMP,'Empty ramp has a useful fallback');
assert.equal(normalizeGlyphRamp('\n\t🎨'),DEFAULT_GLYPH_RAMP,'Unsupported/control-only ramp falls back');
assert.equal(normalizeGlyphRamp('.:-'), ' .:-','Zero-tone blank is always present');
assert.ok(normalizeGlyphRamp('X'.repeat(10000)).length<=32,'Untrusted control input cannot create an unbounded atlas');
const atlas=createGlyphAtlas(8,DEFAULT_GLYPH_RAMP);
assert.equal(atlas.cell,8);assert.equal(atlas.glyphs[0].length,0,'Space mask is empty');
assert.ok(atlas.glyphs.slice(1).every(mask=>mask.length>0),'Real Canvas font calls are sampled into nonempty packed masks in this font double');
const atlasCanvas=canvases.at(-1);
assert.equal(atlasCanvas.width,1);assert.equal(atlasCanvas.height,1,'Atlas working canvas released after extraction');
assert.deepEqual(atlasCanvas.commands.filter(([name])=>name==='fillText').map(([,character])=>character),Array.from(DEFAULT_GLYPH_RAMP.slice(1)),'Characters are actually requested from Canvas font rasterization');
assert.equal(createGlyphAtlas(100,' .#').cell,20,'Glyph atlas caps its cell dimensions');
for(const density of [.5,1.25,2.5])for(const contrast of [.5,1,2]){
  const tones=makeGlyphTones(atlas.ramp.length,density,contrast);
  assert.equal(tones.indices[0],0,'Exact black never receives a glyph at any control boundary');
  let previous=0;for(const index of tones.indices){assert.ok(index>=previous&&index<atlas.ramp.length,'Tonal glyph selection is monotone and bounded');previous=index}
  const black=makeGrayRaster(19,11,0),target=new Uint8ClampedArray(black.length);target.fill(255);
  assert.equal(renderGlyphFrame(black,target,19,11,atlas,tones),0,'Empty source field remains empty');
  assert.ok(new Uint32Array(target.buffer).every(word=>word===TEXT_BLACK),'Fresh output overwrites previous frame everywhere with opaque black');
}
const tones=makeGlyphTones(atlas.ramp.length,1.25,1);
const source=makeGrayRaster(19,11,110),sourceBefore=new Uint8ClampedArray(source),a=new Uint8ClampedArray(source.length),b=new Uint8ClampedArray(source.length);
const glyphCount=renderGlyphFrame(source,a,19,11,atlas,tones);renderGlyphFrame(source,b,19,11,atlas,tones);
assert.equal(glyphCount,6,'Clipped last row/column are rendered as actual source cells');
assert.deepEqual(source,sourceBefore,'Glyph stamping never mutates its anatomical source readback');
assert.deepEqual(a,b,'Glyph aggregation/stamping is deterministic');
assert.ok(a.some((value,index)=>index%4!==3&&value>0),'Cell tones stamp visible glyph ink');
assert.ok(a.every((value,index)=>index%4!==3||value===255),'Result stays fully opaque');
const fine=makeGrayRaster(8,8,0),fineTarget=new Uint8ClampedArray(fine.length);fine[0]=fine[1]=fine[2]=255;
assert.equal(renderGlyphFrame(fine,fineTarget,8,8,atlas,tones),1,'Peak contribution preserves a fine bright fiber within a dark cell');
const benchmark=[];
for(const [width,height] of [[768,634],[384,350],[1600,1250]]){
  const pixels=makeGrayRaster(width,height),target=new Uint8ClampedArray(pixels.length);
  for(let i=0;i<pixels.length;i+=4)pixels[i]=pixels[i+1]=pixels[i+2]=(i/4*13)%256;
  const times=[];for(let iteration=0;iteration<5;iteration++){const started=performance.now();renderGlyphFrame(pixels,target,width,height,atlas,tones);times.push(performance.now()-started)}
  times.sort((a,b)=>a-b);benchmark.push({width,height,pixels:width*height,glyphSize:8,medianMs:Number(times[2].toFixed(3)),maxMs:Number(times.at(-1).toFixed(3))});
}

const start=performance.now();
const [first,second]=await Promise.all([prepareGeometry(),prepareGeometry()]);
assert.equal(first,second,'Concurrent mounts share immutable preparation');
assert.ok(first.length>1000,'Actual dense anatomical field generated');
const geometryHash=()=>{const hash=crypto.createHash('sha256');for(const fiber of getFibers()) {hash.update(Buffer.from(fiber.points.buffer));hash.update(Buffer.from(fiber.projected.buffer));hash.update(Buffer.from(fiber.pointFade.buffer));}return hash.digest('hex')};
const before=geometryHash();
const host={dataset:{},querySelector:()=>({textContent:''})};
const display=new Canvas();display.parentElement=host;
const settings={mode:'website-brain-text',glyphSize:8,glyphDensity:1.25,glyphContrast:1,glyphRamp:DEFAULT_GLYPH_RAMP,animate:true,static:false,canvasPreview:false,speed:1,stillTime:8,interactive:true,primary:'#ffd21a',secondary:'#fff',ink:'#000',renderWidth:704,renderHeight:580,managedBufferWidth:768,managedBufferHeight:632,pixelBudget:1000000,colorHost:display};
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
const firstPixels=new Uint8ClampedArray(output.lastImage),firstAtlasCount=canvases.filter(canvas=>canvas.letters.length).length;
assert.equal(display.context.imageSmoothingEnabled,false,'Retained display handoff uses nearest glyph sampling');
display.context.imageSmoothingEnabled=true;
render.renderAt(8.05);
assert.equal(canvases.filter(canvas=>canvas.letters.length).length,firstAtlasCount,'Atlas masks are reused between frames');
assert.equal(display.context.imageSmoothingEnabled,false,'Nearest sampling is reasserted each frame');
assert.deepEqual(output.lastImage,firstPixels,'Deterministic fake readback tests glyph repeatability, not actual framebuffer feedback');
const reads=output.commands.map(([name],index)=>name==='getImageData'?index:-1).filter(index=>index>=0);let previousRead=-1;
for(const index of reads){assert.ok(output.commands.slice(previousRead+1,index).some(([name,x,y,width,height])=>name==='clearRect'&&x===0&&y===0&&width===output.width&&height===output.height),'Every read follows a new full-backing clear');previousRead=index}
assert.equal(display.attrs['data-brain-text-source'],'WebsiteBrainText.tsx / WB-03');
assert.equal(display.attrs['data-brain-text-cell'],'8');assert.equal(display.attrs['data-brain-text-ramp'],DEFAULT_GLYPH_RAMP);
assert.ok(Number(display.attrs['data-brain-text-glyphs'])>0,'Public display reports rendered glyph count');
assert.ok(Number(display.attrs['data-brain-text-ms'])>=0,'Public display reports image-to-glyph duration');
assert.equal(geometryHash(),before,'Drawing never mutates cached anatomical/projection seed data');
assert.ok(output.commands.filter(([name])=>name==='stroke').length>10,'Static and live drawing paths rendered');
assert.equal(output.attrs['data-brain-fiber-count'],String(first.length));
assert.equal(output.attrs['data-brain-phase'],'8.05');
render.update({...settings,trace:{id:1,x:.46,y:.47}});render.renderAt(8.1);
assert.equal(output.attrs['data-brain-live-pulses'],'1','First trace targets projected source fibers');
render.renderAt(10.4);
assert.equal(output.attrs['data-brain-live-pulses'],'0','Pulse expires in correct second/millisecond time domain');
const oldAtlasCount=canvases.filter(canvas=>canvas.letters.length).length;
render.update({...settings,glyphSize:9,glyphRamp:' .+#'});render.renderAt(10.5);
assert.equal(canvases.filter(canvas=>canvas.letters.length).length,oldAtlasCount+1,'Changing glyph size/ramp builds one new bounded atlas');
failNextAtlasRead=true;render.update({...settings,glyphSize:10,glyphRamp:' .#@'});
assert.throws(()=>render.renderAt(10.6),/fixture atlas readback failure/,'Atlas readback failures are surfaced');
assert.equal(canvases.at(-1).width,1);assert.equal(canvases.at(-1).height,1,'Failed atlas working canvas is released');
render.renderAt(10.7);
assert.equal(display.attrs['data-brain-text-cell'],'10');assert.equal(display.attrs['data-brain-text-ramp'],' .#@','Failed atlas construction cannot commit a cache key over stale masks');
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
console.log(JSON.stringify({pass:true,wb01SHA256:crypto.createHash('sha256').update(wb01).digest('hex'),wb02SHA256:crypto.createHash('sha256').update(wb02).digest('hex'),benchmark,fibers:first.length,geometrySHA256:before,preparationAndRendersMs:Math.round(performance.now()-start),maxWorkingSurfacePixels:maxWidthProduct,createdBitmaps:bitmapCount,closedBitmaps:bitmapClosed,portSHA256:crypto.createHash('sha256').update(input).digest('hex'),portBytes:Buffer.byteLength(input)},null,2));
