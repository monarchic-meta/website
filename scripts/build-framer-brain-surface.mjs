import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';

// Manual, deterministic asset preparation. This script never contacts Framer.
const repo=fileURLToPath(new URL('../',import.meta.url));
const asset=path.join(repo,'docs/design-studies/code-components/assets/mni152_2009mini.mz3');
const target=path.join(repo,'docs/design-studies/code-components/SolidBrainStudy.tsx');
const sourceSHA='05f9c228c4608c47f2d11542fa2bb8b8d75d9f8c5bf2d3ed4930d303a72f95a7';
const source=fs.readFileSync(asset);
if(crypto.createHash('sha256').update(source).digest('hex')!==sourceSHA)throw Error('Unreviewed MNI152 source');
const raw=zlib.gunzipSync(source),faces=raw.readUInt32LE(4),vertices=raw.readUInt32LE(8);
if(raw.readUInt16LE(0)!==23117||raw.readUInt16LE(2)!==3||raw.readUInt32LE(12)!==0||vertices!==28929||faces!==58038||raw.length!==16+faces*12+vertices*12)throw Error('Unexpected MZ3 structure');
const originalIndices=Uint32Array.from({length:faces*3},(_,i)=>raw.readUInt32LE(16+i*4));
const originalPositions=Float32Array.from({length:vertices*3},(_,i)=>raw.readFloatLE(16+faces*12+i*4));
const minimum=[Infinity,Infinity,Infinity],maximum=[-Infinity,-Infinity,-Infinity];
for(let i=0;i<originalPositions.length;i++){if(!Number.isFinite(originalPositions[i]))throw Error('Invalid anatomical position');minimum[i%3]=Math.min(minimum[i%3],originalPositions[i]);maximum[i%3]=Math.max(maximum[i%3],originalPositions[i]);}
const center=minimum.map((x,i)=>(x+maximum[i])/2),scale=2/Math.max(...maximum.map((x,i)=>x-minimum[i]));
// MNI coordinates: X left/right, Y anterior/posterior, Z inferior/superior.
// Present a familiar lateral brain: frontal on the left, cerebellum below/right.
const transformed=new Float32Array(originalPositions.length);
for(let i=0;i<vertices;i++){const x=originalPositions[i*3]-center[0],y=originalPositions[i*3+1]-center[1],z=originalPositions[i*3+2]-center[2];transformed.set([-y*scale,z*scale,-x*scale],i*3);}
let volume=0;
for(let i=0;i<originalIndices.length;i+=3){const a=originalIndices[i]*3,b=originalIndices[i+1]*3,c=originalIndices[i+2]*3;if(Math.max(a,b,c)>=transformed.length)throw Error('Out of bounds topology');volume+=transformed[a]*(transformed[b+1]*transformed[c+2]-transformed[b+2]*transformed[c+1])+transformed[a+1]*(transformed[b+2]*transformed[c]-transformed[b]*transformed[c+2])+transformed[a+2]*(transformed[b]*transformed[c+1]-transformed[b+1]*transformed[c]);}
if(volume<0)for(let i=0;i<originalIndices.length;i+=3)[originalIndices[i+1],originalIndices[i+2]]=[originalIndices[i+2],originalIndices[i+1]];
// Reindex by first appearance to shorten index deltas; retain every triangle.
const mapping=new Int32Array(vertices).fill(-1),inverse=[],indices=new Uint16Array(originalIndices.length),positions=new Float32Array(transformed.length);
for(let i=0;i<originalIndices.length;i++){const old=originalIndices[i];if(mapping[old]<0){mapping[old]=inverse.length;inverse.push(old);positions.set(transformed.subarray(old*3,old*3+3),mapping[old]*3);}indices[i]=mapping[old];}
if(inverse.length!==vertices)throw Error('Unexpected unreferenced anatomical vertex');
const normals=new Float32Array(positions.length),strongestNormals=new Float32Array(positions.length),strongestArea=new Float64Array(vertices),neighbors=Array.from({length:vertices},()=>new Set());
for(let i=0;i<indices.length;i+=3){const a=indices[i],b=indices[i+1],c=indices[i+2];for(const v of [a,b,c])for(const other of [a,b,c])if(v!==other)neighbors[v].add(other);}
for(let i=0;i<indices.length;i+=3){const a=indices[i],b=indices[i+1],c=indices[i+2],ai=a*3,bi=b*3,ci=c*3;const ux=positions[bi]-positions[ai],uy=positions[bi+1]-positions[ai+1],uz=positions[bi+2]-positions[ai+2],vx=positions[ci]-positions[ai],vy=positions[ci+1]-positions[ai+1],vz=positions[ci+2]-positions[ai+2];const n=[uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx],area=Math.hypot(...n);for(const v of [a,b,c]){for(let k=0;k<3;k++)normals[v*3+k]+=n[k];if(area>strongestArea[v]){strongestArea[v]=area;strongestNormals.set(n,v*3);}}}
const occlusion=new Float32Array(vertices);
let fallbackNormals=0;
for(let i=0;i<vertices;i++){const p=i*3;let norm=Math.hypot(normals[p],normals[p+1],normals[p+2]);
 // A few source vertices have opposite-wound incident faces with cancelling
 // normals. Use the first strongest face deterministically, not float residue.
 if(norm<=strongestArea[i]*1e-5){normals.set(strongestNormals.subarray(p,p+3),p);norm=Math.hypot(normals[p],normals[p+1],normals[p+2]);fallbackNormals++;}
 if(norm<1e-20)throw Error('Degenerate anatomical normal');for(let k=0;k<3;k++)normals[p+k]/=norm;let cx=0,cy=0,cz=0,distance=0;for(const j of neighbors[i]){const x=positions[j*3]-positions[p],y=positions[j*3+1]-positions[p+1],z=positions[j*3+2]-positions[p+2];cx+=x;cy+=y;cz+=z;distance+=Math.hypot(x,y,z);}const cavity=Math.max(0,(cx*normals[p]+cy*normals[p+1]+cz*normals[p+2])/Math.max(1e-8,distance)),t=Math.min(1,cavity/.34);occlusion[i]=1-.56*t*t*(3-2*t);}
const indexBytes=[];let lastIndex=0;
for(const index of indices){const delta=index-lastIndex;lastIndex=index;let value=(delta<<1)^(delta>>31);while(value>=128){indexBytes.push((value&127)|128);value>>>=7;}indexBytes.push(value);}
const packed=Buffer.alloc(16+vertices*8+indexBytes.length);packed.write('SBR1',0);packed.writeUInt32LE(vertices,4);packed.writeUInt32LE(faces,8);packed.writeUInt32LE(indexBytes.length,12);
let maxPositionError=0,maxNormalAngle=0;
for(let i=0;i<vertices;i++){const at=16+i*8,p=i*3,q=[0,1,2].map(k=>Math.round(Math.max(0,Math.min(1,(positions[p+k]+1)/2))*4095));packed[at]=q[0]&255;packed[at+1]=(q[0]>>8)|((q[1]&15)<<4);packed[at+2]=q[1]>>4;packed[at+3]=q[2]&255;packed[at+4]=q[2]>>8;
 const l1=Math.abs(normals[p])+Math.abs(normals[p+1])+Math.abs(normals[p+2]);let ox=normals[p]/l1,oy=normals[p+1]/l1;if(normals[p+2]<0){const oldX=ox;ox=(1-Math.abs(oy))*Math.sign(oldX||1);oy=(1-Math.abs(oldX))*Math.sign(oy||1);}packed[at+5]=Math.round((ox*.5+.5)*255);packed[at+6]=Math.round((oy*.5+.5)*255);packed[at+7]=Math.round(occlusion[i]*255);
 for(let k=0;k<3;k++)maxPositionError=Math.max(maxPositionError,Math.abs((q[k]/4095*2-1)-positions[p+k]));
 let nx=packed[at+5]/255*2-1,ny=packed[at+6]/255*2-1,nz=1-Math.abs(nx)-Math.abs(ny);if(nz<0){const oldX=nx;nx=(1-Math.abs(ny))*Math.sign(oldX||1);ny=(1-Math.abs(oldX))*Math.sign(ny||1);}const nl=Math.hypot(nx,ny,nz);maxNormalAngle=Math.max(maxNormalAngle,Math.acos(Math.max(-1,Math.min(1,(nx*normals[p]+ny*normals[p+1]+nz*normals[p+2])/nl))));
}
packed.set(indexBytes,16+vertices*8);
const packedSHA=crypto.createHash('sha256').update(packed).digest('hex');
const section=`// BEGIN EMBEDDED MNI152 SURFACE — generated by scripts/build-framer-brain-surface.mjs
/** MRI-template isosurface, not streamline artwork. Source: Surf Ice/Rorden,
 * sample/mni152_2009mini.mz3 at 69f80b6e676ce56d1d99825c3579e59fc1e7e419.
 * Source SHA-256 ${sourceSHA}; packed SHA-256 ${packedSHA}.
 * Copyright (C) 1993–2004 Louis Collins, McConnell Brain Imaging Centre,
 * Montreal Neurological Institute, McGill University. Permission to use, copy,
 * modify, and distribute this software and its documentation for any purpose
 * and without fee is hereby granted, provided that the above copyright notice
 * appear in all copies. The authors and McGill University make no representations
 * about the suitability of this software for any purpose. It is provided "as is"
 * without express or implied warranty. The authors are not responsible for any
 * data loss, equipment damage, property loss, or injury to subjects or patients
 * resulting from the use or misuse of this software package.
 * Rendering/quantization are manual prototype adaptations; no scientific claim.
 */
const SOLID_BRAIN_MESH_BASE64 = "${packed.toString('base64')}"
interface SolidBrainMesh { positions:Float32Array; normals:Float32Array; occlusion:Float32Array; indices:Uint16Array }
let solidBrainMesh:SolidBrainMesh|undefined
function getSolidBrainMesh():SolidBrainMesh {
    if(solidBrainMesh)return solidBrainMesh
    const text=atob(SOLID_BRAIN_MESH_BASE64),bytes=new Uint8Array(text.length)
    for(let i=0;i<text.length;i++)bytes[i]=text.charCodeAt(i)
    const view=new DataView(bytes.buffer)
    if(view.getUint32(0,true)!==0x31524253||view.getUint32(4,true)!==28929||view.getUint32(8,true)!==58038||bytes.length!==16+28929*8+view.getUint32(12,true))throw new Error("Invalid embedded anatomical surface")
    const positions=new Float32Array(28929*3),normals=new Float32Array(28929*3),occlusion=new Float32Array(28929),indices=new Uint16Array(58038*3)
    for(let i=0;i<28929;i++){
        const a=16+i*8,p=i*3
        positions[p]=((bytes[a]|((bytes[a+1]&15)<<8))/4095)*2-1
        positions[p+1]=(((bytes[a+1]>>4)|(bytes[a+2]<<4))/4095)*2-1
        positions[p+2]=((bytes[a+3]|(bytes[a+4]<<8))/4095)*2-1
        let x=bytes[a+5]/255*2-1,y=bytes[a+6]/255*2-1,z=1-Math.abs(x)-Math.abs(y)
        if(z<0){const oldX=x;x=(1-Math.abs(y))*Math.sign(oldX||1);y=(1-Math.abs(oldX))*Math.sign(y||1)}
        const length=Math.hypot(x,y,z);normals[p]=x/length;normals[p+1]=y/length;normals[p+2]=z/length;occlusion[i]=bytes[a+7]/255
    }
    let cursor=16+28929*8,last=0
    for(let i=0;i<indices.length;i++){
        let value=0,shift=0,part=0
        do{if(cursor>=bytes.length||shift>14)throw new Error("Invalid anatomical topology");part=bytes[cursor++];value|=(part&127)<<shift;shift+=7}while(part&128)
        last+=(value>>>1)^-(value&1);if(last<0||last>=28929)throw new Error("Invalid anatomical index");indices[i]=last
    }
    if(cursor!==bytes.length)throw new Error("Unexpected anatomical bytes")
    return solidBrainMesh={positions,normals,occlusion,indices}
}
// END EMBEDDED MNI152 SURFACE
`;
const report={schemaVersion:1,source:{url:'https://github.com/neurolabusc/surf-ice/blob/69f80b6e676ce56d1d99825c3579e59fc1e7e419/sample/mni152_2009mini.mz3',sha256:sourceSHA,bytes:source.length},vertices,triangles:faces,allTrianglesRetained:true,sourceBoundsMm:{minimum,maximum},displayTransform:'[-Y, Z, -X], center at source bounds midpoint, normalize largest dimension to 2',fallbackNormals,windingReversed:volume<0,packedBytes:packed.length,embeddedCharacters:packed.toString('base64').length,packedSHA256:packedSHA,maxPositionError,maxNormalErrorDegrees:maxNormalAngle*180/Math.PI,localCavityShadingRange:[Math.min(...occlusion),Math.max(...occlusion)]};
const output=process.argv.find(x=>x.startsWith('--output='))?.slice(9);
if(output){fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'solid-brain-mesh.ts.part'),section);fs.writeFileSync(path.join(output,'solid-brain-packed.bin'),packed);fs.writeFileSync(path.join(output,'mesh-preparation.json'),JSON.stringify(report,null,2)+'\n');}
if(process.argv.includes('--write')){const text=fs.readFileSync(target,'utf8'),start=text.indexOf('// BEGIN EMBEDDED MNI152 SURFACE'),end=text.indexOf('// END EMBEDDED MNI152 SURFACE');if(start<0||end<0)throw Error('Missing embedded surface markers');fs.writeFileSync(target,text.slice(0,start)+section+text.slice(end+'// END EMBEDDED MNI152 SURFACE'.length).replace(/^\n/,''));}
console.log(JSON.stringify(report,null,2));
