import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
import {chromium} from '@playwright/test';

const repo=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(import.meta.url);
const sourcePath=path.join(repo,'docs/design-studies/code-components/SourceBleibtMark.tsx');
const source=fs.readFileSync(sourcePath,'utf8');
const asset=fs.readFileSync(path.join(repo,'docs/design-studies/hero-behavior/assets/HERO-017-mark.svg'),'utf8');
const sourceD=asset.match(/<path[^>]* d="([^"]+)"/)[1];
const evidence=process.env.MONARCHIC_BLEIBT_MARK_EVIDENCE_DIR??'/tmp/monarchic-source-bleibt-mark';
fs.mkdirSync(evidence,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.ok(source.includes(JSON.stringify(sourceD)),'Actor contains actual public source contour verbatim');
assert.ok(!/getContext\(|fetch\(|querySelector|@ts-ignore|@ts-expect-error|\bany\b/.test(source.replace(/\/\*[\s\S]*?\*\//g,'')),'No GPU, network or private layer lookup');

const declarations=new Map([
 [path.join(repo,'__bleibt-react.d.ts'),`export interface CSSProperties{[key:string]:string|number|undefined};export function useRef<T>(value:T):{current:T};export function useState<T>(value:T):[T,(value:T|((prior:T)=>T))=>void];export function useEffect(effect:()=>void|(()=>void),deps:unknown[]):void;export function createElement(...args:unknown[]):unknown;declare global{namespace JSX{interface IntrinsicElements{[key:string]:unknown}}}`],
 [path.join(repo,'__bleibt-framer.d.ts'),`export const RenderTarget:{canvas:string;current():string};export function useIsStaticRenderer():boolean;export const ControlType:{Boolean:string;Color:string;Number:string};export function addPropertyControls(component:unknown,controls:unknown):void;`],
]);
const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Node10,jsx:ts.JsxEmit.React,baseUrl:repo,paths:{react:['__bleibt-react.d.ts'],framer:['__bleibt-framer.d.ts']}};
const host=ts.createCompilerHost(options),read=host.readFile.bind(host),exists=host.fileExists.bind(host);
host.readFile=p=>declarations.get(p)??read(p);host.fileExists=p=>declarations.has(p)||exists(p);
host.getSourceFile=(p,v)=>{const s=host.readFile(p);return s===undefined?undefined:ts.createSourceFile(p,s,v,true)};
const diagnostics=ts.getPreEmitDiagnostics(ts.createProgram([sourcePath],options,host));
assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics.slice(0,12),{getCurrentDirectory:()=>repo,getCanonicalFileName:x=>x,getNewLine:()=> '\n'}));
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
const React=require('react'),module={exports:{}};
vm.runInNewContext(`(function(require,exports){${js}\n})(require,module.exports)`,{module,require:name=>name==='react'?React:{RenderTarget:{canvas:'canvas',current:()=> 'preview'},useIsStaticRenderer:()=>false,ControlType:{},addPropertyControls(){}}});
assert.ok(require('react-dom/server').renderToString(React.createElement(module.exports.default)).includes('Bleibtgleich source mark'));
const react=fs.readFileSync(path.join(path.dirname(require.resolve('react/package.json')),'umd/react.development.js'),'utf8');
const reactDOM=fs.readFileSync(path.join(path.dirname(require.resolve('react-dom/package.json')),'umd/react-dom.development.js'),'utf8');
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
const errors=[],reports=[];
try{
 const page=await browser.newPage({viewport:{width:400,height:400}});page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<!doctype html><style>body{margin:0}#app{width:190px;height:320px}</style><div id="app"></div>');
 await page.addScriptTag({content:react});await page.addScriptTag({content:reactDOM});
 await page.addScriptTag({content:`window.target='preview';window.staticRenderer=false;window.trackedFrames=new Set();const raf=requestAnimationFrame.bind(window),caf=cancelAnimationFrame.bind(window);window.requestAnimationFrame=f=>{let id=raf(t=>{trackedFrames.delete(id);f(t)});trackedFrames.add(id);return id};window.cancelAnimationFrame=id=>{trackedFrames.delete(id);caf(id)};window.actor={};(function(require,exports){${js}\n})(name=>name==='react'?React:{RenderTarget:{canvas:'canvas',current:()=>target},useIsStaticRenderer:()=>staticRenderer,ControlType:{},addPropertyControls(){}},actor);window.root=ReactDOM.createRoot(document.getElementById('app'));window.replay=0;window.render=props=>root.render(React.createElement(actor.default,{duration:4,showPlayback:true,replay,...props}));render();`});
 await page.waitForSelector('[data-source-bleibt-phase="reveal"]');
 await page.screenshot({path:path.join(evidence,'01-rectangle-reveal.png')});
 await page.waitForSelector('[data-source-bleibt-phase="morph"]');
 await page.getByRole('button',{name:'PAUSE',exact:true}).click();
 const pausedA=await page.locator('[data-source-bleibt-time]').getAttribute('data-source-bleibt-time');
 const midPath=await page.locator('svg path').getAttribute('d');assert.notEqual(midPath,sourceD);
 await page.waitForTimeout(120);
 assert.equal(await page.locator('[data-source-bleibt-time]').getAttribute('data-source-bleibt-time'),pausedA);
 await page.screenshot({path:path.join(evidence,'02-fitted-morph-paused.png')});
 await page.getByRole('button',{name:'PLAY',exact:true}).click();
 await page.waitForSelector('[data-source-bleibt-phase="complete"]',{timeout:5000});
 assert.equal(await page.locator('svg path').getAttribute('d'),sourceD);
 assert.equal(await page.evaluate(()=>trackedFrames.size),0,'Terminal entrance stops RAF');
 await page.screenshot({path:path.join(evidence,'03-exact-source-contour.png')});
 // Compare final rendered SVG and original asset in separate real canvas copies.
 const comparison=await page.evaluate(async original=>{
   const candidate=document.querySelector('svg').cloneNode(true);candidate.setAttribute('xmlns','http://www.w3.org/2000/svg');candidate.setAttribute('width','190');candidate.setAttribute('height','320');candidate.removeAttribute('style');
   const draw=async svg=>{const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})),img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url});const c=document.createElement('canvas');c.width=190;c.height=320;const ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,190,320);ctx.drawImage(img,0,0,190,320);URL.revokeObjectURL(url);return ctx.getImageData(0,0,190,320).data};
   const a=await draw(new XMLSerializer().serializeToString(candidate)),b=await draw(original.replace('width="100%"','width="190"').replace('fill="currentColor"','fill="#000000"'));
   let changed=0,max=0;for(let i=0;i<a.length;i++){if(a[i]!==b[i])changed++;max=Math.max(max,Math.abs(a[i]-b[i]))}return{changed,max,pixels:a.length/4};
 },asset);
 assert.equal(comparison.changed,0,'Final source vector raster agrees pixel-for-pixel');reports.push({case:'real entrance, fitted intermediate, pause/resume, exact terminal source raster',comparison});
 await page.getByRole('button',{name:'REPLAY',exact:true}).click();await page.waitForSelector('[data-source-bleibt-phase="reveal"]');
 await page.evaluate(()=>{target='canvas';render()});await page.waitForSelector('[data-source-bleibt-phase="complete"]');assert.equal(await page.evaluate(()=>trackedFrames.size),0);
 await page.evaluate(()=>render({canvasMotion:true,duration:4}));await page.waitForSelector('[data-source-bleibt-state="live"]');
 const samples=[];for(let i=0;i<9;i++){samples.push(await page.locator('[data-source-bleibt-time]').getAttribute('data-source-bleibt-time'));await page.waitForTimeout(15)}assert.ok(new Set(samples).size<=4,'Canvas publishes at bounded12fps');
 await page.evaluate(()=>{target='export';staticRenderer=true;render({canvasMotion:true})});await page.waitForSelector('[data-source-bleibt-phase="complete"]');assert.equal(await page.evaluate(()=>trackedFrames.size),0);
 await page.evaluate(()=>{target='preview';staticRenderer=false;render({showPlayback:false})});await page.emulateMedia({reducedMotion:'reduce'});await page.waitForSelector('[data-source-bleibt-phase="complete"]');assert.equal(await page.evaluate(()=>trackedFrames.size),0);
 await page.evaluate(()=>root.unmount());assert.equal(await page.evaluate(()=>trackedFrames.size),0);reports.push({case:'Replay, Canvas opt-in12fps, export/reduced freeze and RAF cleanup',passed:true});
 await page.close();
}finally{await browser.close()}
assert.deepEqual(errors,[]);
const result={passed:true,sourceSHA256:hash(source),assetSHA256:hash(asset),testSHA256:hash(fs.readFileSync(import.meta.filename)),reports,errors,scope:'ActualReact18 SVG entrance and final source-vector pixel parity. Intermediate correspondence is fitted. Separate fluid/gallery behaviors and Framer persistence are not established by this check.'};
fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:true,sourceSHA256:result.sourceSHA256,reports:reports.length,evidence},null,2));
