import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createMechanismHost,LEGACY_HOST_SHA256}from'./hero-mechanism-test-host.mjs';
export {LEGACY_HOST_SHA256};
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
// Additive host features only: no old host or renderer is rewritten. Synthetic
// readback is keyed by actual submitted paths/materials. It is not rasterized
// artwork; browser coverage/appearance and fresh-frame pixels are separate.
export function createRoundTwoHost(){
 const h=createMechanismHost(),BasePath=h.context.Path2D,readbacks={count:0,putCount:0,maxPixels:0,freshCompositionChecks:0},contexts=new WeakMap(),tonalCanvases=new WeakSet();
 h.context.DOMMatrix=class DOMMatrix{constructor(){this.a=this.d=1;this.b=this.c=this.e=this.f=0}translate(x,y){const m=new this.constructor();Object.assign(m,this);m.e+=x;m.f+=y;return m}};
 h.context.Path2D=class extends BasePath{constructor(source){super(source);if(source&&typeof source==='object')this.commands=structuredClone(source.commands??[['source',source.source]])}addPath(path,m={a:1,b:0,c:0,d:1,e:0,f:0}){(this.commands??=[]).push(['addPath',structuredClone(path.commands??path.source),[m.a,m.b,m.c,m.d,m.e,m.f]]);this._fingerprint=null}};
 const original=h.Canvas.prototype.getContext;
 h.Canvas.prototype.getContext=function(kind,...args){
  const ctx=original.call(this,kind,...args);if(kind!=='2d'||!ctx)return ctx;if(contexts.has(ctx))return contexts.get(ctx);
  let clearSerial=0,lastRead=-1;const canvas=this,overrides={
   clearRect(...a){clearSerial++;return ctx.clearRect(...a)},
   getImageData(x,y,w,hh){const image=ctx.getImageData(x,y,w,hh);if(!tonalCanvases.has(canvas)||!image.frame||w*hh<=1)return image;assert.ok(clearSerial>lastRead,'Every tonal readback follows a new clear/composition');lastRead=clearSerial;readbacks.freshCompositionChecks++;const seed=Buffer.from(image.frame.paintHash,'hex'),data=new Uint8ClampedArray(w*hh*4);for(let y=0;y<hh;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;data[i]=seed[(x+3*y)&31];data[i+1]=seed[(x+y+11)&31];data[i+2]=seed[(3*x+y+19)&31];data[i+3]=255}readbacks.count++;readbacks.maxPixels=Math.max(readbacks.maxPixels,w*hh);return{...image,data,width:w,height:hh}},
   putImageData(image){ctx.putImageData(image);if(tonalCanvases.has(canvas)&&image.frame&&canvas.frame){const tonalHash=hash(image.data);canvas.frame.tonalHash=tonalHash;canvas.frame.paintHash=hash(canvas.frame.paintHash+'/'+tonalHash);readbacks.putCount++}},
  },proxy=new Proxy(ctx,{get:(o,k)=>k in overrides?overrides[k]:o[k],set:(o,k,v)=>{o[k]=v;return true}});contexts.set(ctx,proxy);return proxy;
 };
 return{...h,readbacks,markTonal:canvas=>tonalCanvases.add(canvas)};
}
