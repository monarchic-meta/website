import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Offline, manual source-asset preparation. Output contains vector coordinates,
// not GIF frames/pixel masks. No source animation/website JavaScript is copied.
const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2),arg=name=>{const index=args.indexOf(name);if(index<0)return undefined;const value=args[index+1];if(!value||value.startsWith('--'))throw Error('Missing value for '+name);return value};
const gif=arg('--mac-gif'),glb=arg('--mecha-glb'),output=arg('--output');
if(!gif||!glb||!output)throw Error('Use --mac-gif <original> --mecha-glb <original> --output <artifact directory> [--write]');
fs.mkdirSync(output,{recursive:true});
const sha=value=>crypto.createHash('sha256').update(value).digest('hex'),gifBytes=fs.readFileSync(gif),glbBytes=fs.readFileSync(glb);
if(sha(gifBytes)!=='620afc5173c1db2d5b6ccf924536d0b766cf5ff2d209e542e40624feabb5e656'||sha(glbBytes)!=='0d484646983d0a7da6d0b3360c7dfb2cbcbfd0837c2452649a044b70978cdab7')throw Error('Unexpected source revision; reinspect before updating these pins');
const symbols=[{key:'heel-strike-zone',label:'HEEL STRIKE ZONE',column:2,row:0,y:0},{key:'abrasion-resistant-upper',label:'ABRASION RESISTANT UPPER',column:3,row:0,y:0},{key:'long-lasting-traction',label:'LONG LASTING TRACTION',column:2,row:1,y:315},{key:'eco-responsible-upper',label:'ECO RESPONSIBLE UPPER',column:3,row:1,y:315}],thresholds=[70,150],width=130,height=110,fps=12;
const allLabels=['ROOMY TOEBOX','HIGH ENERGY CUSHIONING','HEEL STRIKE ZONE','ABRASION RESISTANT UPPER','ENERGETIC MIDSOLE','LACE GARAGE','LONG LASTING TRACTION','ECO RESPONSIBLE UPPER','925 MILE DURABILITY','ADAPTIVE CUSHIONING','MULTISURFACE VERSATILITY','PERFORMANCE FIT','REFLECTIVE LACES','ABRASION RESISTANT','NATURAL STABILITY','ROCK PLATE','CONNECTED RIDE','ODOR CONTROL','BREATHABLE UPPER','STRETCH KNIT COLLAR'];
function simplify(points,tolerance=.65){
  if(points.length<=3)return points;const a=points[0],b=points.at(-1),dx=b[0]-a[0],dy=b[1]-a[1],len=dx*dx+dy*dy;let far=0,index=0;
  for(let i=1;i<points.length-1;i++){const p=points[i],t=len?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/len)):0,d=Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dy*t);if(d>far){far=d;index=i}}
  return far>tolerance?[...simplify(points.slice(0,index+1),tolerance).slice(0,-1),...simplify(points.slice(index),tolerance)]:[a,b];
}
function contours(bytes,threshold){
  const mask=new Uint8Array(width*height);for(let i=0;i<mask.length;i++){const r=bytes[i*3],g=bytes[i*3+1],b=bytes[i*3+2];mask[i]=g>=threshold&&g-r>3&&g-b>3?1:0}
  const edges=new Map(),add=(x,y,nx,ny)=>{const key=y*(width+1)+x;if(!edges.has(key))edges.set(key,[]);edges.get(key).push(ny*(width+1)+nx)},inside=(x,y)=>x>=0&&y>=0&&x<width&&y<height&&mask[y*width+x];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(inside(x,y)){if(!inside(x,y-1))add(x,y,x+1,y);if(!inside(x+1,y))add(x+1,y,x+1,y+1);if(!inside(x,y+1))add(x+1,y+1,x,y+1);if(!inside(x-1,y))add(x,y+1,x,y)}
  const loops=[];while(edges.size){const start=edges.keys().next().value;let key=start,points=[],steps=0;do{points.push([key%(width+1),Math.floor(key/(width+1))]);const next=edges.get(key);if(!next?.length)throw Error('Open source contour');const dest=next.pop();if(!next.length)edges.delete(key);key=dest;if(++steps>width*height*4)throw Error('Unbounded source contour')}while(key!==start);let area=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];area+=a[0]*b[1]-b[0]*a[1]}if(Math.abs(area)<8)continue;points=simplify(points);if(points.length<3)continue;loops.push(points.map(([x,y])=>[Math.round((x*2+20)/300*1000),Math.round((y*2+45)/300*1000)]))}return loops;
}
const framesBySymbol=symbols.map(symbol=>{const r=spawnSync(process.env.FFMPEG_BINARY??'ffmpeg',['-v','error','-i',gif,'-vf',`fps=${fps},crop=260:220:${symbol.column*300+20}:${symbol.y+45},scale=${width}:${height}:flags=area`,'-pix_fmt','rgb24','-f','rawvideo','pipe:1'],{maxBuffer:64*1024*1024});if(r.status!==0)throw Error(r.stderr.toString());const count=r.stdout.length/(width*height*3);if(!Number.isInteger(count)||count<100||count>150)throw Error('Unexpected symbol frame count');return Array.from({length:count},(_,i)=>thresholds.map(t=>contours(r.stdout.subarray(i*width*height*3,(i+1)*width*height*3),t)))});
const frameCount=framesBySymbol[0].length;if(framesBySymbol.some(f=>f.length!==frameCount))throw Error('Source frame mismatch');const values=[];let pathCount=0,pointCount=0;
for(let frame=0;frame<frameCount;frame++)for(let s=0;s<4;s++)for(let level=0;level<2;level++){const loops=framesBySymbol[s][frame][level];values.push(loops.length);for(const loop of loops){values.push(loop.length);pathCount++;pointCount+=loop.length;for(const[x,y]of loop){if(x<0||x>1000||y<0||y>1000)throw Error('Invalid contour coordinate');values.push(x,y)}}}
const chunks=[];function word(value){const b=Buffer.alloc(2);b.writeUInt16LE(value);chunks.push(b)}
for(let frame=0;frame<frameCount;frame++)for(let s=0;s<4;s++)for(let level=0;level<2;level++){const loops=framesBySymbol[s][frame][level];word(loops.length);for(const loop of loops){word(loop.length);chunks.push(Buffer.from(loop.flatMap(([x,y])=>[Math.round(x/1000*255),Math.round(y/1000*255)])))}}
const raw=Buffer.concat([Buffer.from('MMV2'),Buffer.from([frameCount&255,frameCount>>8,fps,0]),...chunks]);
function lz4(bytes){const result=[],dictionary=new Map();let cursor=0,anchor=0;const extension=n=>{while(n>=255){result.push(255);n-=255}result.push(n)};while(cursor+4<bytes.length){const key=bytes.readUInt32LE(cursor),old=dictionary.get(key);dictionary.set(key,cursor);if(old===undefined||cursor-old>65535){cursor++;continue}let length=4;while(cursor+length<bytes.length&&bytes[old+length]===bytes[cursor+length])length++;const literal=cursor-anchor,token=Math.min(15,literal)*16+Math.min(15,length-4);result.push(token);if(literal>=15)extension(literal-15);for(let i=anchor;i<cursor;i++)result.push(bytes[i]);result.push((cursor-old)&255,(cursor-old)>>8);if(length-4>=15)extension(length-19);const end=cursor+length;for(let i=cursor+1;i+4<end;i++)dictionary.set(bytes.readUInt32LE(i),i);cursor=end;anchor=cursor}const tail=bytes.length-anchor;result.push(Math.min(15,tail)*16);if(tail>=15)extension(tail-15);for(let i=anchor;i<bytes.length;i++)result.push(bytes[i]);return Buffer.from(result)}
const packed=lz4(raw);
for(let s=0;s<4;s++){const groups=framesBySymbol[s][12].map((loops,level)=>`<g fill="#c4e5ca" opacity="${level?1:.28}" fill-rule="evenodd"><path d="${loops.map(loop=>'M'+loop.map(p=>p.map(n=>(n*.3).toFixed(1)).join(',')).join('L')+'Z').join('')}"/></g>`).join('');fs.writeFileSync(path.join(output,symbols[s].key+'.svg'),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><title>Mac Moss / ${symbols[s].label} / credited source contour reconstruction, 1s</title><rect width="300" height="300" fill="#10110f"/>${groups}</svg>`)}

// Derive the actual beveled mark's crease edges. The public source asset's
// reuse license is unverified; this is a credited design-study reconstruction,
// not a claim that its mesh or identity is independently authored/licensed.
const n=glbBytes.readUInt32LE(12),json=JSON.parse(glbBytes.subarray(20,20+n).toString()),binary=glbBytes.subarray(28+n),p=json.meshes[0].primitives[0];
function accessor(index){const a=json.accessors[index],v=json.bufferViews[a.bufferView],offset=(v.byteOffset??0)+(a.byteOffset??0),length=a.count*(a.type==='VEC3'?3:1);return a.componentType===5126?new Float32Array(binary.buffer,binary.byteOffset+offset,length):new Uint16Array(binary.buffer,binary.byteOffset+offset,length)}
const pos=accessor(p.attributes.POSITION),idx=accessor(p.indices),q=json.nodes[0].rotation,sc=json.nodes[0].scale,world=[];
for(let i=0;i<pos.length;i+=3){const x=pos[i]*sc[0],y=pos[i+1]*sc[1],z=pos[i+2]*sc[2],tx=2*(q[1]*z-q[2]*y),ty=2*(q[2]*x-q[0]*z),tz=2*(q[0]*y-q[1]*x);world.push([x+q[3]*tx+q[1]*tz-q[2]*ty,y+q[3]*ty+q[2]*tx-q[0]*tz,z+q[3]*tz+q[0]*ty-q[1]*tx])}
const min=[0,1,2].map(k=>Math.min(...world.map(p=>p[k]))),max=[0,1,2].map(k=>Math.max(...world.map(p=>p[k]))),center=min.map((v,k)=>(v+max[k])*.5),span=Math.max(...max.map((v,k)=>v-min[k])),vertices=[],weld=new Map(),mapping=[];
for(const p of world){const normalized=p.map((v,k)=>Math.round((v-center[k])/span*2e6)/1e6),key=normalized.join('/');if(!weld.has(key)){weld.set(key,vertices.length);vertices.push(normalized)}mapping.push(weld.get(key))}
const faces=[],normals=[],adjacency=new Map();for(let i=0;i<idx.length;i+=3){const face=[mapping[idx[i]],mapping[idx[i+1]],mapping[idx[i+2]]],a=vertices[face[0]],b=vertices[face[1]],c=vertices[face[2]],u=b.map((v,k)=>v-a[k]),v=c.map((v,k)=>v-a[k]),normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...normal);if(length<1e-10)continue;const f=faces.length;faces.push(face);normals.push(normal.map(x=>x/length));for(let k=0;k<3;k++){const x=face[k],y=face[(k+1)%3],key=[Math.min(x,y),Math.max(x,y)].join('/');if(!adjacency.has(key))adjacency.set(key,{a:x,b:y,faces:[]});adjacency.get(key).faces.push(f)}}
const edges=[...adjacency.values()].filter(edge=>edge.faces.length!==2||normals[edge.faces[0]].reduce((sum,v,k)=>sum+v*normals[edge.faces[1]][k],0)<Math.cos(.10)).map(e=>[e.a,e.b,...e.faces]);
const mecha={vertices,faces,edges};fs.writeFileSync(path.join(output,'mecha-derived-geometry.json'),JSON.stringify(mecha));
const block=`// BEGIN HERO MECHANISM DATA — generated by scripts/build-framer-hero-mechanisms.mjs
// Mac Moss / KEEN 2 & KEEN 3, Comp_3.gif: vector contour reconstruction at 12fps.
// Four exact source cells: ${symbols.map(s=>s.label).join('; ')}.
// Two tonal contours (70/150), source 1200×1500, clipped labels/frame rebuilt natively.
// LZ4-packed vector coordinates quantized to255steps/cell (max0.59sourcepx).
// No GIF, pixel-mask or screenshot data is embedded. Micrograin is independently drawn.
// Source SHA256 ${sha(gifBytes)}; contour SHA256 ${sha(packed)}.
const MAC_SYMBOLS=${JSON.stringify(symbols.map(({key,label,column,row})=>({key,label,column,row})))}
const MAC_VECTOR_BASE64="${packed.toString('base64')}"
const MAC_VECTOR_RAW_BYTES=${raw.length}
// MECHA actual primary mark: normalized/welded source primitive0, bevel creases.
// Source asset SHA256 ${sha(glbBytes)}; original JavaScript is not reused.
// Identity/asset reuse license is unverified. Credits Widelab / Grzegorz Leśniewicz.
const MECHA_GEOMETRY=${JSON.stringify(mecha)}
// END HERO MECHANISM DATA`;
fs.writeFileSync(path.join(output,'hero-mechanism-data.ts.part'),block);
if(args.includes('--write')){const file=path.join(root,'docs/design-studies/code-components/HeroMechanismStudy.tsx'),source=fs.readFileSync(file,'utf8'),start=source.indexOf('// BEGIN HERO MECHANISM DATA'),end=source.indexOf('// END HERO MECHANISM DATA');if(start<0||end<0)throw Error('Missing data markers');fs.writeFileSync(file,source.slice(0,start)+block+source.slice(end+'// END HERO MECHANISM DATA'.length))}
const report={sourceGIFSHA256:sha(gifBytes),sourceMarkSHA256:sha(glbBytes),vectorSHA256:sha(packed),vectorBytes:packed.length,vectorRawBytes:raw.length,frameCount,fps,pathCount,pointCount,selected:symbols,omitted:allLabels.filter(x=>!symbols.some(s=>s.label===x)),mecha:{vertices:vertices.length,faces:faces.length,edges:edges.length,removedDegenerateFaces:idx.length/3-faces.length},changes:'Mac: four cells only, two tonal vector contours at12fps,0.59sourcepx coordinate quantization, simplified micrograin; source timeline sampled at12fps. MECHA: primitive0 crease edges, degenerate faces removed, own projection/hidden-line approximation; no proprietary JS copied.'};fs.writeFileSync(path.join(output,'asset-preparation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
