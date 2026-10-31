import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

// New mixed-mode adapter: preserve the pinned legacy source.
// Reuse the legacy resource suite's deterministic DOM/clock/context host rather
// than introducing a second simulated coordinator. Actual shader pixels are
// verified by check-hero-recreation-browser.mjs; here quality additionally means
// adequate source resolution and exact fresh-render shader/geometry/control
// state, including after cache handoff. No renderer source is modified.
const repo=fileURLToPath(new URL('../',import.meta.url));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const hostSource=fs.readFileSync(path.join(repo,'scripts/check-framer-study-resources.mjs'),'utf8');
assert.equal(hash(hostSource),'fe0ba1c7fe081f457332a1ab8a0e9ad052090e7cddd2ef04b3b797d74a6e7a6b','Review fixture adapter when the retained legacy harness changes');
let host=hostSource.slice(hostSource.indexOf('    const repo ='),hostSource.indexOf('    const modules = new Map()'));
function replace(from,to){assert.ok(host.includes(from),'Retained host adapter anchor: '+from.slice(0,60));host=host.replace(from,to)}
replace('const repo = fileURLToPath(new URL("../", import.meta.url));','const repo = repoPath;');
replace('let pointer = [0, 0], resolution = null, cssResolution = null;','let pointer = [0, 0], resolution = null, cssResolution = null; const uniforms = {};');
replace('class Canvas extends Target {','class Canvas extends Target { setAttribute(name,value) { (this.attributes ??= {})[name]=String(value); }');
replace('uniform1f(location, value) {','uniform1f(location, value) { uniforms[location.name] = value;');
replace('uniform2f(location, x, y) {','uniform2f(location, x, y) { uniforms[location.name] = [x,y];');
replace('drawArrays() {','uniform3f(location, ...values) { uniforms[location.name] = values; }, uniformMatrix3fv(location, transpose, values) { uniforms[location.name] = Array.from(values); }, clear() { canvas.pendingPasses=[]; }, drawElements(primitive, count) { api.drawArrays(primitive, 0, count); }, drawArrays(primitive, first, count) {');
replace('canvas.frame = { phase, mode, intensity, pointer: [...pointer], resolution, cssResolution, effectiveW: canvas.width, effectiveH: canvas.height, shader: hash((program?.shaders ?? []).map(s => s.source).join(\'\\n\')) };',`const shader = hash((program?.shaders ?? []).map(s => s.source).join('\\n')); (canvas.pendingPasses ??= []).push({shader, primitive:[...constants].find(([,value])=>value===primitive)?.[0]??String(primitive), count}); canvas.pendingPasses=canvas.pendingPasses.slice(-3); canvas.frame = { phase, mode, intensity, pointer: [...pointer], resolution, cssResolution, effectiveW: canvas.width, effectiveH: canvas.height, shader, uniforms: structuredClone(uniforms), passes: structuredClone(canvas.pendingPasses) };`);
const makeHost=Function('fs','path','vm','crypto','assert','createRequire','fileURLToPath','repoPath','includeOriginals','includeLogos','include3DLogos',host+`
    context.atob=globalThis.atob;
    return {repo,ts,manifest,studies,files,context,Canvas,Root,window,document,motion,active,owned,timers,sample,
        async tick(count=1){for(let i=0;i<count;i++){time+=40;for(const[id,task]of [...timers].filter(([,task])=>task.due<=time)){timers.delete(id);task.callback()}await Promise.resolve();sample()}},
        stats:()=>({peakContexts,peakPixels,created,draws,copies})};`);

export const LEGACY_HOST_SHA256=hash(hostSource);

// Record actual submitted Canvas2D paths/materials/transforms. This host does
// not rasterize pixels; the independent browser suite establishes real output.
// Cached copies preserve their source fingerprint, never destination upsampling.
export function createMechanismHost(){
    const h=makeHost(fs,path,vm,crypto,assert,createRequire,fileURLToPath,repo,false,false,false);
    const recording={paintCalls:0,pathFills:0,gradients:0,copies:0,invalidAlpha:0,kindConflicts:0,canvases:0};
    const canvasIDs=new WeakMap(),context2D=new WeakMap(),original=h.Canvas.prototype.getContext;
    const identity=[1,0,0,1,0,0];
    const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
    const pathID=p=>{if(!p._fingerprint)p._fingerprint=hash(JSON.stringify(p.commands??p.source??[]));return p._fingerprint;};
    for(const method of ['moveTo','lineTo','closePath','rect','roundRect','arc','arcTo','ellipse','quadraticCurveTo','bezierCurveTo'])h.context.Path2D.prototype[method]=function(...args){(this.commands??=[]).push([method,...args]);this._fingerprint=null;};
    function create2D(canvas){
        let state,stack,currentPath,clips,digest,ops,pathFills,gradientCount;
        const reset=()=>{state={transform:[...identity],fillStyle:'#ffffff',strokeStyle:'#000000',font:'10px sans-serif',globalAlpha:1,globalCompositeOperation:'source-over',lineWidth:1,shadowBlur:0,shadowColor:'rgba(0,0,0,0)',shadowOffsetX:0,shadowOffsetY:0,lineDash:[]};stack=[];currentPath=[];clips=[];digest=crypto.createHash('sha256');ops=0;pathFills=0;gradientCount=0;};
        reset();
        const material=v=>v&&typeof v==='object'&&v.gradient?{gradient:v.gradient,coordinates:v.coordinates,stops:v.stops}:v;
        const paint=(method,args,path)=>{
            const fields=['globalAlpha','globalCompositeOperation','shadowBlur','shadowColor','shadowOffsetX','shadowOffsetY'];
            if(method.startsWith('fill'))fields.push('fillStyle');
            if(method.startsWith('stroke'))fields.push('strokeStyle','lineWidth','lineDash','lineCap','lineJoin','miterLimit');
            if(method.endsWith('Text'))fields.push('font','textAlign','textBaseline','direction','letterSpacing','wordSpacing','fontKerning','fontStretch','textRendering');
            const value={method,args,transform:state.transform,clips,style:Object.fromEntries(fields.filter(k=>state[k]!==undefined).map(k=>[k,material(state[k])])),path};
            digest.update(JSON.stringify(value));ops++;recording.paintCalls++;
            canvas.frame={kind:'2d',paintOwner:canvasIDs.get(canvas),paintHash:digest.copy().digest('hex'),paintOps:ops,pathFills,gradients:gradientCount,effectiveW:canvas.width,effectiveH:canvas.height};
        };
        const gradient=(kind,args)=>{gradientCount++;recording.gradients++;return{gradient:kind,coordinates:args,stops:[],addColorStop(at,color){this.stops.push([at,color]);}};};
        const copy=source=>{recording.copies++;if(canvas.copyFailures>0){canvas.copyFailures--;throw new Error('injected display copy failure');}canvas.frame=source.frame?{...structuredClone(source.frame),effectiveW:Math.min(source.frame.effectiveW,canvas.width),effectiveH:Math.min(source.frame.effectiveH,canvas.height)}:null;};
        const api={canvas,reset,
            save(){stack.push({state:{...state,transform:[...state.transform],lineDash:[...state.lineDash]},clips:[...clips]});},
            restore(){const s=stack.pop();if(s){state=s.state;clips=s.clips;}},
            setTransform(...args){state.transform=args.length===1?args[0]:args;},
            resetTransform(){state.transform=[...identity];},
            translate(x,y){state.transform=mul(state.transform,[1,0,0,1,x,y]);},
            scale(x,y){state.transform=mul(state.transform,[x,0,0,y,0,0]);},
            rotate(a){state.transform=mul(state.transform,[Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0]);},
            transform(...args){state.transform=mul(state.transform,args);},
            beginPath(){currentPath=[];},
            clip(...args){clips.push(hash(JSON.stringify({path:currentPath,args,transform:state.transform})));},
            clearRect(...args){digest=crypto.createHash('sha256');digest.update(JSON.stringify(['clearRect',args,state.transform]));ops=0;pathFills=0;gradientCount=0;canvas.frame=null;},
            fillRect(...args){paint('fillRect',args);},strokeRect(...args){paint('strokeRect',args);},
            fillText(...args){paint('fillText',args);},strokeText(...args){paint('strokeText',args);},
            fill(shape,rule){if(shape instanceof h.context.Path2D){pathFills++;recording.pathFills++;paint('fill',[rule],pathID(shape));}else paint('fill',[shape,rule],hash(JSON.stringify(currentPath)));},
            stroke(shape){paint('stroke',[],shape instanceof h.context.Path2D?pathID(shape):hash(JSON.stringify(currentPath)));},
            createRadialGradient(...args){return gradient('radial',args);},createLinearGradient(...args){return gradient('linear',args);},
            setLineDash(dash){state.lineDash=[...dash];},getLineDash(){return [...state.lineDash];},
            measureText(text){return{width:String(text).length*(parseFloat(state.font)||10)*.58};},
            drawImage(source){copy(source);},
            getImageData(){return{data:new Uint8ClampedArray([255,255,255,255]),width:canvas.width,height:canvas.height,frame:canvas.frame?structuredClone(canvas.frame):null};},
            putImageData(image){canvas.frame=image.frame?structuredClone(image.frame):null;},
            createImageData(width,height){return{data:new Uint8ClampedArray(width*height*4),width,height};}
        };
        for(const method of ['moveTo','lineTo','closePath','rect','roundRect','arc','arcTo','ellipse','quadraticCurveTo','bezierCurveTo'])api[method]=(...args)=>currentPath.push([method,...args]);
        return new Proxy(api,{get:(o,k)=>k in o?o[k]:state[k],set:(o,k,value)=>{if(k==='globalAlpha'&&(!Number.isFinite(value)||value<0||value>1)){recording.invalidAlpha++;return true;}state[k]=value;return true;}});
    }
    for(const dimension of ['width','height']){
        const descriptor=Object.getOwnPropertyDescriptor(h.Canvas.prototype,dimension);
        Object.defineProperty(h.Canvas.prototype,dimension,{get:descriptor.get,set(value){descriptor.set.call(this,value);context2D.get(this)?.reset();},configurable:true});
    }
    h.Canvas.prototype.getContext=function(kind,...args){
        if(!canvasIDs.has(this))canvasIDs.set(this,++recording.canvases);
        if(this.contextKind&&this.contextKind!==kind){recording.kindConflicts++;return null;}
        if(kind==='2d'){this.contextKind=kind;if(!context2D.has(this))context2D.set(this,create2D(this));return context2D.get(this);}
        if(kind==='webgl'){this.contextKind=kind;return original.call(this,kind,...args);}
        return null;
    };
    const set=h.Canvas.prototype.setAttribute;
    h.Canvas.prototype.setAttribute=function(name,value){set.call(this,name,value);if(name==='data-hero-mechanism'&&this.frame&&(this.contextKind==='webgl'||this.frame.paintOwner===canvasIDs.get(this))){this.frame.mechanism=String(value);this.frame.phase=Number(this.attributes['data-hero-phase']);this.frame.mode=this.attributes['data-hero-mode'];}};
    h.context.atob=globalThis.atob;
    const baseStats=h.stats;
    return{...h,stats:()=>({...baseStats(),copies:recording.copies}),recording,canvasID:canvas=>canvasIDs.get(canvas)};
}

