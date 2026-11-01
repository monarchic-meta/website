import * as React from "react"
import {addPropertyControls,ControlType,RenderTarget,useIsStaticRenderer} from "framer"
import {SOURCE_KASPAR_ASCII_DATA} from "./SourceKasparASCIIData.ts"
// SOURCE INSPIRATION / HERO-005 / Maximilian Kaspar.
// Actual public botanical STL; upstream scan creator and asset license unverified.
// New rasterizer and timeline; no source website behavior/renderer JS reused.
// Selected gallery copy is separate from the current live site's employment wording.
type Mode="kasparASCII"
type Status="waiting"|"running"|"paused"|"static"|"reduced-motion"|"offscreen"|"recovering"
interface Props{animate?:boolean;canvasMotion?:boolean;speed?:number;stillTime?:number;artworkScale?:number;glyphSize?:number;density?:number;revealDuration?:number;initialAngle?:number;background?:string;ink?:string;showPlayback?:boolean;style?:React.CSSProperties}
interface Settings{mode:Mode;animate:boolean;static:boolean;canvasPreview:boolean;speed:number;stillTime:number;interactive:boolean;primary:string;secondary:string;ink:string;artworkScale:number;glyphSize:number;density:number;revealDuration:number;initialAngle:number;managed?:boolean;renderWidth?:number;renderHeight?:number;managedBufferWidth?:number;managedBufferHeight?:number;pixelBudget?:number;colorHost?:HTMLCanvasElement}

const KASPAR_RAW_BYTES=1175515
function inflateKasparBlock(input:Uint8Array,length:number){
    // Synchronous RFC1951 raw-DEFLATE. The trusted embedded delta stream has an
    // exact declared output size; tables, input, backreferences and writes are bounded.
    if(!Number.isInteger(length)||length<0||length>KASPAR_RAW_BYTES||input.length<2||input.length>KASPAR_RAW_BYTES+65536)throw new Error("Invalid vector envelope size")
    const out=new Uint8Array(length);let cursor=0,destination=0,buffer=0,available=0
    const read=(count:number)=>{while(available<count){if(cursor>=input.length)throw new Error("Truncated vector bits");buffer|=input[cursor++]<<available;available+=8}const value=buffer&((1<<count)-1);buffer>>>=count;available-=count;return value}
    const table=(lengths:Uint8Array,kind:string)=>{
        const counts=new Uint16Array(16),next=new Uint16Array(16);let max=0,used=0,left=1
        for(const n of lengths){if(n>15)throw new Error("Invalid vector Huffman length");if(n){counts[n]++;max=Math.max(max,n);used++}}
        if(!used){if(kind!=="distance")throw new Error("Empty vector Huffman tree");return{bits:0,mask:0,codes:new Uint32Array(1)}}
        for(let n=1;n<=15;n++){left=(left<<1)-counts[n];if(left<0)throw new Error("Oversubscribed vector Huffman tree")}
        if(left>0&&(kind==="codes"||max!==1||used!==1))throw new Error("Incomplete vector Huffman tree")
        let code=0;for(let n=1;n<=max;n++){code=(code+counts[n-1])<<1;next[n]=code}
        const codes=new Uint32Array(1<<max)
        for(let symbol=0;symbol<lengths.length;symbol++){const n=lengths[symbol];if(!n)continue;let value=next[n]++,reverse=0;for(let i=0;i<n;i++){reverse=(reverse<<1)|(value&1);value>>>=1}const entry=(n<<16)|(symbol+1);for(let at=reverse;at<codes.length;at+=1<<n)codes[at]=entry}
        return{bits:max,mask:codes.length-1,codes}
    }
    const decode=(t:ReturnType<typeof table>)=>{while(available<t.bits&&cursor<input.length){buffer|=input[cursor++]<<available;available+=8}const entry=t.codes[buffer&t.mask],count=entry>>>16;if(!count||count>available)throw new Error("Invalid vector Huffman code");buffer>>>=count;available-=count;return(entry&65535)-1}
    const order=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],bases=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258],extra=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],distances=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577],distanceBits=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13]
    let final=0
    do{
        final=read(1);const kind=read(2)
        if(kind===0){const discard=available&7;buffer>>>=discard;available-=discard;const count=read(16),inverse=read(16);if((count^65535)!==inverse||destination+count>length)throw new Error("Invalid stored vector block");for(let i=0;i<count;i++)out[destination++]=read(8);continue}
        if(kind===3)throw new Error("Reserved vector block type")
        let literals:ReturnType<typeof table>,matches:ReturnType<typeof table>
        if(kind===1){const a=new Uint8Array(288),b=new Uint8Array(32);for(let i=0;i<288;i++)a[i]=i<144?8:i<256?9:i<280?7:8;b.fill(5);literals=table(a,"literal");matches=table(b,"distance")}
        else{const litCount=read(5)+257,distCount=read(5)+1,codeCount=read(4)+4;if(litCount>286)throw new Error("Invalid vector literal count");const codes=new Uint8Array(19);for(let i=0;i<codeCount;i++)codes[order[i]]=read(3);const lengths=new Uint8Array(litCount+distCount),codeTable=table(codes,"codes");let at=0
            while(at<lengths.length){const symbol=decode(codeTable);if(symbol<=15){lengths[at++]=symbol;continue}let repeat=0,value=0;if(symbol===16){if(at===0)throw new Error("Missing repeated vector length");repeat=read(2)+3;value=lengths[at-1]}else if(symbol===17)repeat=read(3)+3;else if(symbol===18)repeat=read(7)+11;else throw new Error("Invalid vector length symbol");if(at+repeat>lengths.length)throw new Error("Excess vector Huffman lengths");lengths.fill(value,at,at+repeat);at+=repeat}
            if(!lengths[256])throw new Error("Missing vector end marker");literals=table(lengths.subarray(0,litCount),"literal");matches=table(lengths.subarray(litCount),"distance")}
        for(;;){const symbol=decode(literals);if(symbol<256){if(destination>=length)throw new Error("Excess vector literals");out[destination++]=symbol;continue}if(symbol===256)break;if(symbol>285)throw new Error("Reserved vector length code");const n=symbol-257,count=bases[n]+read(extra[n]),distanceCode=decode(matches);if(distanceCode>29)throw new Error("Reserved vector distance code");const distance=distances[distanceCode]+read(distanceBits[distanceCode]);if(distance>destination||destination+count>length)throw new Error("Invalid vector backreference");for(let i=0;i<count;i++){out[destination]=out[destination-distance];destination++}}
    }while(!final)
    if(destination!==length||cursor!==input.length||available>7)throw new Error("Incomplete or trailing vector block")
    return out
}


type KasparMesh={positions:Float32Array;normals:Float32Array;indices:Uint32Array}
let kasparMesh:KasparMesh|undefined
function getKasparMesh():KasparMesh{
 if(kasparMesh)return kasparMesh
 const decoded=atob(SOURCE_KASPAR_ASCII_DATA),packed=new Uint8Array(decoded.length);for(let i=0;i<decoded.length;i++)packed[i]=decoded.charCodeAt(i)
 const raw=inflateKasparBlock(packed,KASPAR_RAW_BYTES),view=new DataView(raw.buffer)
 if(view.getUint32(0,true)!==0x3153414b)throw Error("Invalid botanical geometry header")
 const count=view.getUint32(4,true),indexCount=view.getUint32(8,true),indexBytes=view.getUint32(12,true),min=[0,1,2].map(i=>view.getFloat64(16+i*8,true)),max=[0,1,2].map(i=>view.getFloat64(40+i*8,true))
 if(count<3||count>200000||indexCount<3||indexCount>600000||indexCount%3||64+count*9+indexBytes!==raw.length||min.some((x,i)=>!Number.isFinite(x)||!Number.isFinite(max[i])||max[i]<=x))throw Error("Invalid botanical geometry bounds")
 const positions=new Float32Array(count*3),normals=new Float32Array(count*3),indices=new Uint32Array(indexCount)
 for(let i=0;i<count*3;i++){const axis=i%3;positions[i]=min[axis]+view.getUint16(64+i*2,true)/65535*(max[axis]-min[axis]);normals[i]=Math.max(-1,view.getInt8(64+count*6+i)/127)}
 let cursor=64+count*9,previous=0;for(let i=0;i<indexCount;i++){let value=0,bits=0,byte=0;do{if(cursor>=raw.length||bits>28)throw Error("Truncated botanical index");byte=raw[cursor++];if(bits===28&&(byte&127)>15)throw Error("Excess botanical index bits");value|=(byte&127)<<bits;bits+=7}while(byte&128);const index=previous+((value>>>1)^-(value&1));if(index<0||index>=count)throw Error("Botanical index outside mesh");indices[i]=index;previous=index}if(cursor!==raw.length)throw Error("Trailing botanical geometry")
 kasparMesh={positions,normals,indices};return kasparMesh
}
const KASPAR_VERTEX=`attribute vec3 a_position;attribute vec3 a_normal;uniform float u_angle;uniform float u_scale;uniform vec2 u_view;varying vec3 v_normal;varying float v_height;void main(){float c=cos(u_angle),s=sin(u_angle);vec3 p=vec3(c*a_position.x-s*a_position.y,s*a_position.x+c*a_position.y,a_position.z);v_normal=vec3(c*a_normal.x-s*a_normal.y,a_normal.z,s*a_normal.x+c*a_normal.y);v_height=a_position.z+.5882352941;gl_Position=vec4(p.x*u_view.x*u_scale,p.z*u_view.y*u_scale,-p.y*.5,1.);}`
const KASPAR_MATERIAL=`precision highp float;varying vec3 v_normal;varying float v_height;uniform float u_reveal;void main(){if(v_height>u_reveal)discard;vec3 n=normalize(v_normal);float luminance=dot(n*.5+.5,vec3(.30,.59,.11));gl_FragColor=vec4(vec3(luminance),1.);}`
const KASPAR_QUAD=`attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`
const KASPAR_ASCII=`precision highp float;varying vec2 v_uv;uniform sampler2D u_field;uniform sampler2D u_glyphs;uniform vec2 u_cells;uniform vec3 u_background;uniform vec3 u_ink;uniform float u_density;uniform float u_count;void main(){vec2 q=v_uv*u_cells,cell=floor(q);float light=texture2D(u_field,(cell+.5)/u_cells).r;float strength=clamp((1.-light)*u_density,0.,.99999);float bin=floor(strength*(u_count-1.));vec2 local=fract(q);float glyph=texture2D(u_glyphs,vec2((bin+local.x)/u_count,local.y)).r;gl_FragColor=vec4(mix(u_background,u_ink,glyph),1.);}`
function splitKasparMesh(mesh:KasparMesh){const out:{p:Float32Array;n:Float32Array;i:Uint16Array}[]=[],map=new Map<number,number>();let p:number[]=[],n:number[]=[],idx:number[]=[];const flush=()=>{if(!idx.length)return;out.push({p:new Float32Array(p),n:new Float32Array(n),i:new Uint16Array(idx)});map.clear();p=[];n=[];idx=[]};for(let j=0;j<mesh.indices.length;j+=3){const tri=[mesh.indices[j],mesh.indices[j+1],mesh.indices[j+2]];if(map.size+tri.filter(x=>!map.has(x)).length>65535)flush();for(const k of tri){let local=map.get(k);if(local===undefined){local=map.size;map.set(k,local);p.push(...mesh.positions.subarray(k*3,k*3+3));n.push(...mesh.normals.subarray(k*3,k*3+3))}idx.push(local)}}flush();return out}
function createRenderer(canvas:HTMLCanvasElement,initial:Settings,notify:(status:Status,error?:string)=>void,resumeTime=initial.stillTime){
 const context=canvas.getContext("webgl",{alpha:false,antialias:false,powerPreference:"low-power"});if(!context)throw Error("WebGL unavailable");const gl:WebGLRenderingContext=context
 let settings=initial,width=1,height=1,bw=1,bh=1,cols=1,rows=1,clock=resumeTime,lost=false,disposed=false,material:WebGLProgram|undefined,ascii:WebGLProgram|undefined,quad:WebGLBuffer|undefined,field:WebGLTexture|undefined,glyphs:WebGLTexture|undefined,framebuffer:WebGLFramebuffer|undefined,depth:WebGLRenderbuffer|undefined,chunks:{p:WebGLBuffer;n:WebGLBuffer;i:WebGLBuffer;count:number}[]=[]
 const programs:WebGLProgram[]=[],buffers:WebGLBuffer[]=[],textures:WebGLTexture[]=[],locations=new Map<WebGLProgram,Map<string,WebGLUniformLocation|null>>(),characters=" .:-=+*1#%@0$!*"
 function release(){programs.forEach(x=>gl.deleteProgram(x));buffers.forEach(x=>gl.deleteBuffer(x));textures.forEach(x=>gl.deleteTexture(x));if(framebuffer)gl.deleteFramebuffer(framebuffer);if(depth)gl.deleteRenderbuffer(depth);programs.length=buffers.length=textures.length=0;locations.clear();chunks=[];material=ascii=undefined;quad=undefined;field=glyphs=undefined;framebuffer=undefined;depth=undefined}
 function shader(kind:number,text:string){const s=gl.createShader(kind);if(!s)throw Error("Shader unavailable");gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(error||"ASCII shader error")}return s}
 function program(vs:string,fs:string){const v=shader(gl.VERTEX_SHADER,vs);let f:WebGLShader|undefined,p:WebGLProgram|undefined;try{f=shader(gl.FRAGMENT_SHADER,fs);p=gl.createProgram()??undefined;if(!p)throw Error("Program unavailable");gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p)||"ASCII link error");programs.push(p);return p}catch(e){if(p)gl.deleteProgram(p);throw e}finally{gl.deleteShader(v);if(f)gl.deleteShader(f)}}
 function buffer(data:Float32Array|Uint16Array,target:number){const b=gl.createBuffer();if(!b)throw Error("Buffer unavailable");buffers.push(b);gl.bindBuffer(target,b);gl.bufferData(target,data,gl.STATIC_DRAW);return b}
 function texture(){const t=gl.createTexture();if(!t)throw Error("Texture unavailable");textures.push(t);gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t}
 function allocate(){try{material=program(KASPAR_VERTEX,KASPAR_MATERIAL);ascii=program(KASPAR_QUAD,KASPAR_ASCII);quad=buffer(new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.ARRAY_BUFFER);chunks=splitKasparMesh(getKasparMesh()).map(c=>({p:buffer(c.p,gl.ARRAY_BUFFER),n:buffer(c.n,gl.ARRAY_BUFFER),i:buffer(c.i,gl.ELEMENT_ARRAY_BUFFER),count:c.i.length}));field=texture();glyphs=texture();cols=rows=0;const atlas=document.createElement("canvas");atlas.width=characters.length*32;atlas.height=48;const ctx=atlas.getContext("2d");if(!ctx)throw Error("Glyph atlas unavailable");ctx.fillStyle="#000";ctx.fillRect(0,0,atlas.width,48);ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font='36px "Courier New",monospace';for(let i=0;i<characters.length;i++)ctx.fillText(characters[i],i*32+16,24);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,0);framebuffer=gl.createFramebuffer()??undefined;depth=gl.createRenderbuffer()??undefined;if(!framebuffer||!depth)throw Error("Raster target unavailable")}catch(e){release();throw e}}
 function resize(){width=Math.max(1,settings.renderWidth??canvas.clientWidth??1280);height=Math.max(1,settings.renderHeight??canvas.clientHeight??720);let w=Math.max(1,Math.floor(settings.managedBufferWidth??width)),h=Math.max(1,Math.floor(settings.managedBufferHeight??height));const limit=Math.max(1,settings.pixelBudget??1000000);if(w*h>limit){const f=Math.sqrt(limit/(w*h));w=Math.max(1,Math.floor(w*f));h=Math.max(1,Math.min(Math.floor(limit/w),Math.floor(h*f)))}bw=w;bh=h;if(canvas.width!==w||canvas.height!==h){canvas.width=canvas.height=1;canvas.width=w;canvas.height=h}const pitch=(width<768?4:5)*Math.max(.6,settings.glyphSize),cw=Math.max(12,Math.min(512,Math.ceil(width/pitch))),rh=Math.max(12,Math.min(256,Math.ceil(height/(pitch*2))));if(field&&framebuffer&&depth&&(cols!==cw||rows!==rh)){cols=cw;rows=rh;gl.bindTexture(gl.TEXTURE_2D,field);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,cols,rows,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindRenderbuffer(gl.RENDERBUFFER,depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,cols,rows);gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,field,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error("Incomplete ASCII target");gl.bindFramebuffer(gl.FRAMEBUFFER,null)}}
 function location(p:WebGLProgram,name:string){let map=locations.get(p);if(!map){map=new Map();locations.set(p,map)}if(!map.has(name))map.set(name,gl.getUniformLocation(p,name));return map.get(name)??null}
 function one(p:WebGLProgram,name:string,n:number){const at=location(p,name);if(at!==null)gl.uniform1f(at,n)}function two(p:WebGLProgram,name:string,x:number,y:number){const at=location(p,name);if(at!==null)gl.uniform2f(at,x,y)}function three(p:WebGLProgram,name:string,color:[number,number,number]){const at=location(p,name);if(at!==null)gl.uniform3f(at,...color)}function attr(p:WebGLProgram,name:string,b:WebGLBuffer,size:number){const at=gl.getAttribLocation(p,name);if(at<0)return;gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,size,gl.FLOAT,false,0,0)}
 function draw(){if(disposed||lost||!material||!ascii||!quad||!field||!glyphs||!framebuffer)return;const time=Math.max(0,clock),reveal=Math.min(1,time/Math.max(.15,settings.revealDuration)),angle=settings.initialAngle+time*.12,viewHeight=.90962
  gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.viewport(0,0,cols,rows);gl.clearColor(1,1,1,1);gl.clearDepth(1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.useProgram(material);one(material,"u_angle",angle);one(material,"u_scale",settings.artworkScale);one(material,"u_reveal",reveal);two(material,"u_view",2.2/(viewHeight*width/height),2/viewHeight);for(const c of chunks){attr(material,"a_position",c.p,3);attr(material,"a_normal",c.n,3);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,c.i);gl.drawElements(gl.TRIANGLES,c.count,gl.UNSIGNED_SHORT,0)}
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,bw,bh);gl.disable(gl.DEPTH_TEST);gl.useProgram(ascii);attr(ascii,"a_position",quad,2);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,field);gl.uniform1i(location(ascii,"u_field"),0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,glyphs);gl.uniform1i(location(ascii,"u_glyphs"),1);two(ascii,"u_cells",cols,rows);three(ascii,"u_background",rgb(settings.primary,settings.colorHost??canvas));three(ascii,"u_ink",rgb(settings.ink,settings.colorHost??canvas));one(ascii,"u_density",settings.density);one(ascii,"u_count",characters.length);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);gl.activeTexture(gl.TEXTURE0);gl.flush();for(const n of[canvas,settings.colorHost])if(n){n.setAttribute("data-kaspar-time",String(time));n.setAttribute("data-kaspar-reveal",String(reveal));n.setAttribute("data-kaspar-angle",String(angle));n.setAttribute("data-kaspar-cells",cols+"x"+rows);n.setAttribute("data-kaspar-geometry","actual-source-model6-qem");n.setAttribute("data-kaspar-reference","HERO-005")}
 }
 const onLost=(e:Event)=>{e.preventDefault();if(disposed||lost)return;lost=true;release();notify("recovering","Restoring botanical ASCII.")},onRestored=()=>{if(disposed||!lost)return;lost=false;try{allocate();resize();notify("waiting")}catch(e){lost=true;release();notify("recovering",String(e))}}
 canvas.addEventListener("webglcontextlost",onLost);canvas.addEventListener("webglcontextrestored",onRestored);try{allocate();resize()}catch(e){canvas.removeEventListener("webglcontextlost",onLost);canvas.removeEventListener("webglcontextrestored",onRestored);gl.getExtension("WEBGL_lose_context")?.loseContext();throw e}
 return{update(next:Settings){settings=next;resize()},setPointer(_x:number,_y:number){},renderAt(seconds:number){clock=seconds;draw()},getSnapshot(){return{mode:settings.mode,stillTime:settings.stillTime,time:clock,lost}},dispose(){if(disposed)return;disposed=true;canvas.removeEventListener("webglcontextlost",onLost);canvas.removeEventListener("webglcontextrestored",onRestored);release();gl.getExtension("WEBGL_lose_context")?.loseContext()}}
}

const colorCache=new Map<string,[number,number,number]>()
let colorContext:CanvasRenderingContext2D|null|undefined
function rgb(value: string, canvas:HTMLCanvasElement): [number,number,number] {
    // Resolve inherited Framer design tokens within this component's own node.
    for(let depth=0;depth<4&&value.trim().startsWith("var(");depth++){
        const token=value.match(/^var\(\s*(--[^,\s)]+)\s*(?:,\s*(.*))?\)$/)
        if(!token)break
        value=getComputedStyle(canvas).getPropertyValue(token[1]).trim()||token[2]||"#ffffff"
    }
    const cached=colorCache.get(value)
    if(cached)return cached
    // Framer colors can be hex, rgb(), hsl(), named, or alpha-bearing CSS.
    // The artwork is opaque: palette alpha is deliberately ignored.
    if(colorContext===undefined){
        const pixel=document.createElement("canvas");pixel.width=1;pixel.height=1
        colorContext=pixel.getContext("2d",{colorSpace:"srgb",willReadFrequently:true})
    }
    let result:[number,number,number]=[1,1,1]
    if(colorContext){
        colorContext.fillStyle="#ffffff";colorContext.fillStyle=value
        const normalized=String(colorContext.fillStyle)
        const channels=normalized.match(/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)/i)
        if(channels)result=channels.slice(1,4).map(x=>Math.min(255,Number(x))/255) as [number,number,number]
        else if(/^#[\da-f]{6,8}$/i.test(normalized))result=[0,2,4].map(i=>parseInt(normalized.slice(i+1,i+3),16)/255) as [number,number,number]
        else {
            // Convert wide-gamut CSS colors to the renderer's sRGB framebuffer.
            // Force alpha to one before readback so transparent RGB is retained.
            colorContext.fillStyle=normalized.replace(/\/\s*[-+\d.e%]+\s*\)$/i,"/ 1)")
            colorContext.clearRect(0,0,1,1);colorContext.fillRect(0,0,1,1)
            const data=colorContext.getImageData(0,0,1,1).data
            result=[data[0]/255,data[1]/255,data[2]/255]
        }
    }
    if(colorCache.size>64)colorCache.clear()
    colorCache.set(value,result)
    return result
}

// Embedded identically in the five standalone Framer files. Versioned so HMR
// cannot retain an earlier coordinator with different quality/lifetime rules.
const STUDY_POOL_KEY=Symbol.for("monarchic.gpu-budget.v2")
type StudyRenderer=ReturnType<typeof createRenderer>
interface StudyLease {canvas:HTMLCanvasElement;renderer:StudyRenderer;signature:string}
interface StudyFrame {canvas:HTMLCanvasElement;width:number;height:number;pixels:number}
interface StudyEntry {
    id:number;source:string;target:"canvas"|"preview"
    root:HTMLDivElement;display:HTMLCanvasElement;settings:Settings
    factory:typeof createRenderer;notify:(status:Status,error?:string)=>void
    lease?:StudyLease;rect:DOMRect;visible:boolean;hover:boolean;focus:boolean;pinUntil:number
    logicalWidth:number;logicalHeight:number;desiredWidth:number;desiredHeight:number
    liveDesiredWidth:number;liveDesiredHeight:number;frameWidth:number;frameHeight:number
    framePhase:number;framePointer:[number,number];frameKey:string;contentKey:string;canonical:boolean
    phase:number;lastTick:number;lastDraw:number;lastVisibleAt:number;needsStill:boolean;hasFrame:boolean
    retryAt:number;pointer:[number,number];smoothPointer:[number,number];emitted:string;cleanup:()=>void
}
interface StudyPool {
    add:(entry:Pick<StudyEntry,"source"|"target"|"root"|"display"|"settings"|"factory"|"notify">)=>StudyEntry
    update:(entry:StudyEntry,next:Settings)=>void;remove:(entry:StudyEntry)=>void
    request:(entry:StudyEntry)=>void;runStatic:(work:()=>number|void)=>void;debug:()=>unknown
}
function getStudyPool():StudyPool {
    const realm=window as unknown as {[key:symbol]:StudyPool|undefined},shared=realm[STUDY_POOL_KEY]
    if(shared)return shared
    const entries=new Map<number,StudyEntry>(),cache=new Map<string,StudyFrame>(),completed=new Set<number>()
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)")
    let serial=0,timer=0,contexts=0,peakContexts=0,peakPixels=0,cachePixels=0,completedStillJobs=0
    let lastMeasure=0,lastWarm=0,dirty=true,listening=false,pumping=false,wasReduced=reduced.matches,lastPoolError=""
    const ignored=new Set(["animate","static","canvasPreview","speed","interactive","managed","renderWidth","renderHeight","managedBufferWidth","managedBufferHeight","pixelBudget","colorHost"])
    const now=()=>performance.now()
    const pixels=()=>[...entries.values()].reduce((n,e)=>n+(e.lease?e.lease.canvas.width*e.lease.canvas.height:0),0)
    const displayPixels=()=>[...entries.values()].reduce((n,e)=>n+(e.hasFrame?e.display.width*e.display.height:0),0)
    const emit=(e:StudyEntry,status:Status,error="")=>{const value=status+"/"+error;if(e.emitted!==value){e.emitted=value;e.notify(status,error||undefined)}}
    const data=(e:StudyEntry,name:string,value:string|number)=>e.display.setAttribute?.("data-study-"+name,String(value))
    const demandData=(e:StudyEntry,live=Boolean(e.lease))=>{
        data(e,"demand-width",live?e.liveDesiredWidth:e.desiredWidth);data(e,"demand-height",live?e.liveDesiredHeight:e.desiredHeight)
        data(e,"source",e.source);data(e,"mode",e.settings.mode)
    }
    const frameData=(e:StudyEntry)=>{data(e,"frame-width",e.frameWidth);data(e,"frame-height",e.frameHeight)}
    const zero=(p:[number,number])=>Math.abs(p[0])+Math.abs(p[1])<.000001
    const canonical=(e:StudyEntry,phase:number,p:[number,number])=>Math.abs(phase-e.settings.stillTime)<.000001&&zero(p)
    const wanted=(e:StudyEntry):{phase:number;pointer:[number,number]}=>e.settings.static||reduced.matches
        ?{phase:e.settings.stillTime,pointer:[0,0]}:{phase:e.phase,pointer:e.settings.interactive&&e.hasFrame?e.framePointer:[0,0]}
    const stateMatches=(e:StudyEntry)=>{const state=wanted(e);return e.hasFrame&&e.frameKey===e.contentKey&&Math.abs(e.framePhase-state.phase)<.000001&&Math.abs(e.framePointer[0]-state.pointer[0])+Math.abs(e.framePointer[1]-state.pointer[1])<.000001}
    const adequate=(w:number,h:number,dw:number,dh:number)=>w>=dw&&h>=dh
    const raster=(logicalW:number,logicalH:number,screenW:number,screenH:number,budget:number):[number,number]=>{
        const aspect=Math.max(.0001,logicalW/Math.max(.0001,logicalH)),dpr=Math.max(.1,Math.min(2,window.devicePixelRatio||1))
        const longEdge=Math.max(384,Math.ceil(Math.max(screenW,screenH)*dpr/128)*128)
        let w=aspect>=1?longEdge:longEdge*aspect,h=aspect>=1?longEdge/aspect:longEdge
        const ratio=Math.min(1,Math.sqrt(budget/Math.max(1,w*h)));w*=ratio;h*=ratio
        const width=Math.max(1,Math.min(Math.floor(budget),Math.floor(w)))
        return[width,Math.max(1,Math.min(Math.floor(budget/width),Math.floor(h)))]
    }
    const key=(e:StudyEntry)=>e.source+"/"+e.logicalWidth+"x"+e.logicalHeight+"/"+JSON.stringify({
        ...Object.fromEntries(Object.entries(e.settings).filter(([name])=>!ignored.has(name))),
        resolvedPalette:[rgb(e.settings.primary,e.display),rgb(e.settings.secondary,e.display),rgb(e.settings.ink,e.display)],
    })
    const context2D=(canvas:HTMLCanvasElement)=>{const c=canvas.getContext("2d",{alpha:false});if(!c)throw new Error("Could not create the study display.");return c}
    const capture=(source:HTMLCanvasElement,width=source.width,height=source.height)=>{
        const result=document.createElement("canvas");result.width=width;result.height=height
        context2D(result).drawImage(source,0,0,width,height);return result
    }
    const copy=(source:HTMLCanvasElement,target:HTMLCanvasElement,preserveLarger:boolean)=>{
        const keep=preserveLarger&&target.width>=source.width&&target.height>=source.height
        const width=keep?target.width:source.width,height=keep?target.height:source.height,c=context2D(target)
        if(target.width===width&&target.height===height){c.drawImage(source,0,0,width,height);return}
        // Stage before changing dimensions. Resizing clears canvas pixels; an
        // ImageData backup lets a failed final draw roll back independently of
        // the failing drawImage path. Metadata is committed only after success.
        const stage=capture(source,width,height),oldWidth=target.width,oldHeight=target.height
        const previous=c.getImageData(0,0,oldWidth,oldHeight)
        try{target.width=width;target.height=height;context2D(target).drawImage(stage,0,0)}
        catch(error){target.width=oldWidth;target.height=oldHeight;context2D(target).putImageData(previous,0,0);throw error}
    }
    const refreshNeed=(e:StudyEntry)=>{
        const required=e.visible?[e.desiredWidth,e.desiredHeight]:raster(e.logicalWidth,e.logicalHeight,0,0,2000000)
        e.needsStill=!stateMatches(e)||!adequate(e.frameWidth,e.frameHeight,required[0],required[1])
        demandData(e)
        data(e,"state",e.lease?"live":!e.hasFrame?"pending":e.needsStill?"pending":e.visible?"ready":"primed")
    }
    const commit=(e:StudyEntry,source:HTMLCanvasElement,phase:number,pointer:[number,number],preserve=true)=>{
        copy(source,e.display,preserve&&e.hasFrame&&(e.visible||e.frameKey===e.contentKey))
        e.frameWidth=source.width;e.frameHeight=source.height;e.framePhase=phase;e.framePointer=[...pointer]
        e.frameKey=e.contentKey;e.canonical=canonical(e,phase,pointer);e.hasFrame=true;completed.add(e.id)
        frameData(e);refreshNeed(e)
    }
    const dropCache=(cacheKey:string)=>{const old=cache.get(cacheKey);if(old){cachePixels-=old.pixels;cache.delete(cacheKey)}}
    const saveCache=(cacheKey:string,source:HTMLCanvasElement)=>{
        const old=cache.get(cacheKey)
        if(old&&adequate(old.width,old.height,source.width,source.height)){cache.delete(cacheKey);cache.set(cacheKey,old);return}
        const canvas=capture(source),frame={canvas,width:canvas.width,height:canvas.height,pixels:canvas.width*canvas.height}
        dropCache(cacheKey);cache.set(cacheKey,frame);cachePixels+=frame.pixels
        while(cache.size>64||cachePixels>8000000)dropCache(cache.keys().next().value as string)
    }
    const release=(e:StudyEntry)=>{
        const lease=e.lease;if(!lease)return
        e.lease=undefined;e.lastTick=0;e.lastDraw=0
        // A failed render/copy may be newer than the last displayed frame.
        // Continue from the frame the person actually saw, including pointer.
        try{
            e.phase=e.hasFrame?e.framePhase:lease.renderer.getSnapshot().time
            e.smoothPointer=[...e.framePointer]
        }finally{try{lease.renderer.dispose()}finally{contexts--}}
        demandData(e,false)
    }
    const fail=(e:StudyEntry,error:unknown,delay=1000)=>{
        try{release(e)}catch{}
        e.retryAt=now()+delay;e.needsStill=true;data(e,"state","error")
        try{emit(e,"recovering",error instanceof Error?error.message:String(error))}catch{}
    }
    const jobSize=(e:StudyEntry,still:boolean):[number,number]=>{
        if(!still)return[e.liveDesiredWidth,e.liveDesiredHeight]
        if(!e.visible)return raster(e.logicalWidth,e.logicalHeight,0,0,2000000)
        // A content change at a smaller zoom must retain the quality already
        // shown on a visible card. Demand itself still describes screen LOD.
        if(e.hasFrame&&(e.frameWidth>e.desiredWidth||e.frameHeight>e.desiredHeight)){
            const aspect=e.logicalWidth/e.logicalHeight,long=Math.max(e.desiredWidth,e.desiredHeight,e.frameWidth,e.frameHeight)
            let w=aspect>=1?long:long*aspect,h=aspect>=1?long/aspect:long
            const fit=Math.min(1,Math.sqrt(2000000/(w*h)));w*=fit;h*=fit
            const width=Math.max(1,Math.floor(w));return[width,Math.max(1,Math.min(Math.floor(2000000/width),Math.floor(h)))]
        }
        return[e.desiredWidth,e.desiredHeight]
    }
    const settingsFor=(e:StudyEntry,still:boolean):Settings=>{
        const [width,height]=jobSize(e,still)
        return{...e.settings,managed:true,static:still||e.settings.static,
            renderWidth:e.logicalWidth,renderHeight:e.logicalHeight,
            managedBufferWidth:width,managedBufferHeight:height,pixelBudget:still?2000000:1000000,colorHost:e.display}
    }
    const signature=(settings:Settings)=>JSON.stringify(Object.fromEntries(Object.entries(settings).filter(([name])=>name!=="colorHost")))
    const acquire=(e:StudyEntry,still:boolean):StudyLease|undefined=>{
        if(contexts>=2||e.retryAt>now())return
        const canvas=document.createElement("canvas"),settings=settingsFor(e,still);canvas.width=1;canvas.height=1
        contexts++;peakContexts=Math.max(peakContexts,contexts)
        try{
            const renderer=e.factory(canvas,settings,(status,error)=>{if(status==="recovering"){e.retryAt=now()+250;emit(e,"recovering",error)}},still?wanted(e).phase:e.phase)
            peakPixels=Math.max(peakPixels,pixels()+canvas.width*canvas.height)
            return{canvas,renderer,signature:signature(settings)}
        }catch(error){contexts--;fail(e,error);return}
    }
    const warm=(e:StudyEntry)=>{
        const lease=acquire(e,true);if(!lease)return
        const state=wanted(e)
        try{
            lease.renderer.setPointer(...state.pointer);lease.renderer.renderAt(state.phase)
            commit(e,lease.canvas,state.phase,state.pointer)
            if(e.canonical)saveCache(e.contentKey,lease.canvas)
            completedStillJobs++
        }catch(error){fail(e,error)}
        finally{try{lease.renderer.dispose()}catch{}finally{contexts--}}
    }
    const measure=(time:number)=>{
        for(const e of entries.values()){
            if(e.retryAt>time)continue
            try{
                e.rect=e.root.getBoundingClientRect()
                e.logicalWidth=e.display.clientWidth||e.root.clientWidth||0;e.logicalHeight=e.display.clientHeight||e.root.clientHeight||0
                const r=e.rect
                e.visible=!document.hidden&&r.width>0&&r.height>0&&r.right>0&&r.bottom>0&&r.left<window.innerWidth&&r.top<window.innerHeight
                if(e.visible)e.lastVisibleAt=time
                if(e.logicalWidth<=0||e.logicalHeight<=0){e.visible=false;continue}
                ;[e.desiredWidth,e.desiredHeight]=raster(e.logicalWidth,e.logicalHeight,r.width,r.height,2000000)
                ;[e.liveDesiredWidth,e.liveDesiredHeight]=raster(e.logicalWidth,e.logicalHeight,r.width,r.height,1000000)
                e.contentKey=key(e)
                refreshNeed(e)
                const state=wanted(e),cached=canonical(e,state.phase,state.pointer)?cache.get(e.contentKey):undefined
                // A smaller cache hit can prime a blank surface, but cannot
                // downgrade a good frame or claim a larger demand is ready.
                const improves=cached&&(!e.hasFrame||e.frameKey!==e.contentKey||cached.width>e.frameWidth||cached.height>e.frameHeight)
                if(cached&&improves&&(!e.hasFrame||adequate(cached.width,cached.height,e.frameWidth,e.frameHeight))){
                    try{commit(e,cached.canvas,state.phase,state.pointer)}catch(error){dropCache(e.contentKey);throw error}
                    cache.delete(e.contentKey);cache.set(e.contentKey,cached)
                }
            }catch(error){fail(e,error)}
        }
        dirty=false;lastMeasure=time
    }
    const visibleArea=(e:StudyEntry)=>{const r=e.rect;return Math.max(0,Math.min(window.innerWidth,r.right)-Math.max(0,r.left))*Math.max(0,Math.min(window.innerHeight,r.bottom)-Math.max(0,r.top))}
    const rank=(e:StudyEntry,time:number)=>{
        const r=e.rect,priority=e.focus?3:e.pinUntil>time?2:e.hover?1:0
        return priority*1000000-Math.hypot(r.left+r.width/2-window.innerWidth/2,r.top+r.height/2-window.innerHeight/2)
    }
    const eligible=(e:StudyEntry,time:number)=>{
        if(!e.visible||e.retryAt>time||e.settings.static||!e.settings.animate||e.settings.speed<=0||reduced.matches)return false
        if(e.target==="preview")return true
        if(!e.settings.canvasPreview)return false
        const keep=Boolean(e.lease),r=e.rect
        return e.pinUntil>time||(r.width>=(keep?120:160)&&r.height>=(keep?80:100)&&visibleArea(e)>=(keep?12000:24000))
    }
    const wake=(immediate=false)=>{
        dirty=true
        if(immediate&&timer){clearTimeout(timer);timer=0}
        if(!pumping&&!timer&&entries.size)timer=window.setTimeout(pump,0)
    }
    const onWake=()=>wake(),onVisibility=()=>wake(true)
    const trimDisplays=()=>{
        if(displayPixels()<=24000000)return
        const candidates=[...entries.values()].filter(e=>!e.visible&&!e.lease&&e.hasFrame).sort((a,b)=>a.lastVisibleAt-b.lastVisibleAt)
        for(const e of candidates){
            const [w,h]=raster(e.logicalWidth,e.logicalHeight,0,0,2000000)
            if(e.display.width*e.display.height<=w*h)continue
            try{
                const retained=capture(e.display,w,h);copy(retained,e.display,false)
                e.frameWidth=Math.min(e.frameWidth,w);e.frameHeight=Math.min(e.frameHeight,h);frameData(e);refreshNeed(e)
            }catch(error){fail(e,error)}
            break // One offscreen reduction per task; never degrade visible art.
        }
    }
    const pump=()=>{
        timer=0;pumping=true
        let previewActive=false,pending=false
        try{
            if(!entries.size)return
            const time=now()
            if(reduced.matches!==wasReduced){
                wasReduced=reduced.matches
                if(wasReduced)for(const e of entries.values()){release(e);e.phase=e.settings.stillTime;e.smoothPointer=[0,0];e.pointer=[0,0]}
                dirty=true
            }
            if(dirty||time-lastMeasure>=125)measure(time)
            const all=[...entries.values()]
            const cold=all.filter(e=>e.needsStill&&!e.lease&&e.logicalWidth>0&&e.logicalHeight>0&&e.retryAt<=time)
                .sort((a,b)=>(b.visible?1:0)-(a.visible?1:0)||(a.hasFrame?1:0)-(b.hasFrame?1:0)||rank(b,time)-rank(a,time))
            const candidates=all.filter(e=>eligible(e,time)).sort((a,b)=>rank(b,time)-rank(a,time)),selected:StudyEntry[]=[]
            if(!document.hidden)for(const e of candidates){
                if(selected.length>=(cold.length?1:2))break
                if(e.target==="canvas"&&selected.some(s=>s.target==="canvas"))continue
                selected.push(e)
            }
            for(const e of all)if(e.lease&&!selected.includes(e))try{release(e);refreshNeed(e)}catch(error){fail(e,error)}
            let created=false
            for(const e of selected){
                try{
                    if(!e.lease&&!created){e.lease=acquire(e,false);created=Boolean(e.lease)}
                    const lease=e.lease;if(!lease)continue
                    if(lease.renderer.getSnapshot().lost){fail(e,"Restoring graphics.",250);continue}
                    const settings=settingsFor(e,false),next=signature(settings)
                    if(lease.signature!==next){lease.renderer.update(settings);lease.signature=next}
                    const period=1000/(e.target==="canvas"?12:30)
                    if(!e.lastTick)e.lastTick=time
                    e.phase+=Math.min((time-e.lastTick)/1000,.1)*e.settings.speed;e.lastTick=time
                    if(time-e.lastDraw>=period||!e.hasFrame){
                        e.smoothPointer=e.smoothPointer.map((v,i)=>v+(e.pointer[i]-v)*.18) as [number,number]
                        const pointer:[number,number]=e.settings.interactive?e.smoothPointer:[0,0]
                        lease.renderer.setPointer(...pointer);lease.renderer.renderAt(e.phase)
                        commit(e,lease.canvas,e.phase,pointer);e.lastDraw=time
                    }
                    demandData(e,true);data(e,"state","live");emit(e,"running")
                }catch(error){fail(e,error)}
            }
            // Prime every mounted, sized card once even when viewport culling
            // excludes it. Visible upgrades take priority; one job yields each task.
            if(!document.hidden&&contexts<2&&(!created||time-lastWarm>=125)){
                const next=cold.find(e=>!selected.includes(e));if(next){warm(next);lastWarm=time}
            }
            for(const e of all)if(!e.lease&&e.retryAt<=time){
                const status:Status=e.settings.static?"static":reduced.matches?"reduced-motion":!e.settings.animate||e.settings.speed<=0?"paused":!e.visible?"offscreen":"waiting"
                try{emit(e,status)}catch(error){fail(e,error)}
            }
            trimDisplays();peakPixels=Math.max(peakPixels,pixels())
            previewActive=selected.some(e=>e.target==="preview");pending=cold.length>0
        }catch(error){lastPoolError=error instanceof Error?error.message:String(error)}
        finally{
            pumping=false
            // Even a failed measure/cache operation must leave peers a clock.
            if(entries.size&&!document.hidden&&!timer)timer=window.setTimeout(pump,previewActive?16:pending?40:125)
        }
    }
    const start=()=>{if(listening)return;listening=true;window.addEventListener("resize",onWake);window.addEventListener("scroll",onWake,true);document.addEventListener("visibilitychange",onVisibility);reduced.addEventListener("change",onVisibility)}
    const stop=()=>{if(timer)clearTimeout(timer);timer=0;if(!listening)return;listening=false;window.removeEventListener("resize",onWake);window.removeEventListener("scroll",onWake,true);document.removeEventListener("visibilitychange",onVisibility);reduced.removeEventListener("change",onVisibility)}
    const pool:StudyPool={
        add(input){
            const e:StudyEntry={...input,id:++serial,rect:input.root.getBoundingClientRect(),visible:false,hover:false,focus:false,pinUntil:0,
                logicalWidth:0,logicalHeight:0,desiredWidth:0,desiredHeight:0,liveDesiredWidth:0,liveDesiredHeight:0,frameWidth:0,frameHeight:0,
                framePhase:input.settings.stillTime,framePointer:[0,0],frameKey:"",contentKey:"",canonical:true,
                phase:input.settings.stillTime,lastTick:0,lastDraw:0,lastVisibleAt:0,needsStill:true,hasFrame:false,retryAt:0,pointer:[0,0],smoothPointer:[0,0],emitted:"",cleanup:()=>{}}
            const enter=()=>{e.hover=true;wake(true)},leave=()=>{e.hover=false;e.pointer=[0,0];wake(true)}
            const focus=()=>{e.focus=true;wake(true)},blur=()=>{e.focus=e.root.contains(document.activeElement);wake(true)}
            const pointer=(event:PointerEvent)=>{const r=e.root.getBoundingClientRect();e.pointer=[(event.clientX-r.left)/Math.max(1,r.width)-.5,.5-(event.clientY-r.top)/Math.max(1,r.height)]}
            input.root.addEventListener("pointerenter",enter);input.root.addEventListener("pointerleave",leave);input.root.addEventListener("focusin",focus);input.root.addEventListener("focusout",blur);input.root.addEventListener("pointermove",pointer)
            const observer=new ResizeObserver(onWake);observer.observe(input.root)
            e.cleanup=()=>{observer.disconnect();input.root.removeEventListener("pointerenter",enter);input.root.removeEventListener("pointerleave",leave);input.root.removeEventListener("focusin",focus);input.root.removeEventListener("focusout",blur);input.root.removeEventListener("pointermove",pointer)}
            entries.set(e.id,e);start();wake();return e
        },
        update(e,next){
            const reset=next.mode!==e.settings.mode||next.stillTime!==e.settings.stillTime||(next.static&&!e.settings.static)
            if(reset)release(e)
            e.settings=next
            if(reset){e.phase=next.stillTime;e.pointer=[0,0];e.smoothPointer=[0,0]}
            if(!next.interactive){e.pointer=[0,0];e.smoothPointer=[0,0]}
            wake()
        },
        remove(e){try{release(e)}finally{e.cleanup();entries.delete(e.id);completed.delete(e.id);if(!entries.size)stop();else wake()}},
        request(e){e.pinUntil=now()+4000;wake(true)},
        runStatic(work){for(const e of entries.values())try{release(e)}catch(error){fail(e,error)}contexts++;peakContexts=Math.max(peakContexts,contexts);try{const size=work();if(typeof size==="number")peakPixels=Math.max(peakPixels,size)}finally{contexts--;wake()}},
        debug(){return{version:2,activeContexts:contexts,peakContexts,peakPixels,entryCount:entries.size,cacheSize:cache.size,cachePixels,cachePixelBudget:8000000,displayPixels:displayPixels(),displayPixelBudget:24000000,completedStillJobs,completedIds:[...completed],lastPoolError,
            pendingStillIds:[...entries.values()].filter(e=>e.needsStill).map(e=>e.id),
            cache:[...cache].map(([key,f])=>({key,width:f.width,height:f.height,pixels:f.pixels})),
            live:[...entries.values()].filter(e=>e.lease).map(e=>({id:e.id,source:e.source,mode:e.settings.mode,target:e.target,pixels:e.lease!.canvas.width*e.lease!.canvas.height,phase:e.phase})),
            entries:[...entries.values()].map(e=>({id:e.id,source:e.source,mode:e.settings.mode,target:e.target,visible:e.visible,hasFrame:e.hasFrame,needsStill:e.needsStill,retryAt:e.retryAt,canonical:e.canonical,phase:e.phase,framePhase:e.framePhase,framePointer:e.framePointer,
                logicalWidth:e.logicalWidth,logicalHeight:e.logicalHeight,screenWidth:e.rect.width,screenHeight:e.rect.height,desiredWidth:e.desiredWidth,desiredHeight:e.desiredHeight,liveDesiredWidth:e.liveDesiredWidth,liveDesiredHeight:e.liveDesiredHeight,displayWidth:e.display.width,displayHeight:e.display.height,effectiveFrameWidth:e.frameWidth,effectiveFrameHeight:e.frameHeight,contentKey:e.contentKey}))}},
    }
    realm[STUDY_POOL_KEY]=pool;return pool
}
function useStudySurface(root:React.RefObject<HTMLDivElement>,display:React.RefObject<HTMLCanvasElement>,settings:Settings,target:ReturnType<typeof RenderTarget.current>,source:string,notify:(status:Status,error?:string)=>void){
    const entry=React.useRef<StudyEntry|null>(null),pool=React.useRef<StudyPool|null>(null),current=React.useRef(settings),callback=React.useRef(notify)
    const staticKey=React.useRef(""),snapshot=React.useRef<{mode:Mode,stillTime:number,time:number}|null>(null)
    current.current=settings;callback.current=notify
    const oneShot=()=>{
        if(!display.current)return
        const gpu=document.createElement("canvas"),host=display.current,next=current.current;gpu.width=1;gpu.height=1
        const width=host.clientWidth||root.current?.clientWidth||960,height=host.clientHeight||root.current?.clientHeight||600
        const dpr=Math.max(.1,Math.min(2,window.devicePixelRatio||1)),long=Math.max(384,Math.ceil(Math.max(width,height)*dpr/128)*128)
        let bw=width>=height?long:long*width/height,bh=width>=height?long*height/width:long
        const fit=Math.min(1,Math.sqrt(2000000/(bw*bh)));bw=Math.max(1,Math.floor(bw*fit));bh=Math.max(1,Math.min(Math.floor(2000000/bw),Math.floor(bh*fit)))
        let renderer:StudyRenderer|undefined
        try{
            renderer=createRenderer(gpu,{...next,managed:true,static:true,renderWidth:width,renderHeight:height,managedBufferWidth:bw,managedBufferHeight:bh,pixelBudget:2000000,colorHost:host},(s,e)=>callback.current(s,e),next.stillTime)
            renderer.renderAt(next.stillTime)
            const stage=document.createElement("canvas");stage.width=gpu.width;stage.height=gpu.height
            const c=stage.getContext("2d",{alpha:false});if(!c)throw new Error("Could not create the study display.");c.drawImage(gpu,0,0)
            const previous=host.getContext("2d",{alpha:false}),oldWidth=host.width,oldHeight=host.height,backup=previous?.getImageData(0,0,oldWidth,oldHeight)
            try{host.width=stage.width;host.height=stage.height;const out=host.getContext("2d",{alpha:false});if(!out)throw new Error("Could not create the study display.");out.drawImage(stage,0,0)}
            catch(error){host.width=oldWidth;host.height=oldHeight;if(backup)host.getContext("2d")?.putImageData(backup,0,0);throw error}
            host.setAttribute?.("data-study-frame-width",String(gpu.width));host.setAttribute?.("data-study-frame-height",String(gpu.height));host.setAttribute?.("data-study-demand-width",String(bw));host.setAttribute?.("data-study-demand-height",String(bh));host.setAttribute?.("data-study-state","ready")
            callback.current("static");return gpu.width*gpu.height
        }catch(error){callback.current("recovering",String(error))}finally{renderer?.dispose()}
    }
    React.useLayoutEffect(()=>{
        if(!root.current||!display.current)return
        if(target===RenderTarget.export||target===RenderTarget.thumbnail)return
        staticKey.current=""
        const shared=getStudyPool();pool.current=shared
        const added=shared.add({root:root.current,display:display.current,source,target:target===RenderTarget.canvas?"canvas":"preview",settings:current.current,factory:createRenderer,notify:(s,e)=>callback.current(s,e)})
        const saved=snapshot.current;if(saved?.mode===current.current.mode&&saved.stillTime===current.current.stillTime)added.phase=saved.time
        entry.current=added
        return()=>{snapshot.current={mode:added.settings.mode,stillTime:added.settings.stillTime,time:added.phase};shared.remove(added);entry.current=null;pool.current=null}
    },[target])
    React.useLayoutEffect(()=>{
        if(entry.current)pool.current?.update(entry.current,settings)
        else if(target===RenderTarget.export||target===RenderTarget.thumbnail){
            const key=String(target)+"/"+JSON.stringify(settings)+"/"+(display.current?.clientWidth??0)+"/"+(display.current?.clientHeight??0)+"/"+(window.devicePixelRatio||1)
            if(staticKey.current!==key){staticKey.current=key;getStudyPool().runStatic(oneShot)}
        }
    },[settings,target])
    return Object.assign(()=>{if(entry.current)pool.current?.request(entry.current)},{getEntry:()=>entry.current})
}






function publishKasparFrame(e:StudyEntry|null){if(!e?.hasFrame||e.frameKey!==e.contentKey)return false;const time=Math.max(0,e.framePhase);e.display.setAttribute("data-kaspar-time",String(time));e.display.setAttribute("data-kaspar-reveal",String(Math.min(1,time/Math.max(.15,e.settings.revealDuration))));e.display.setAttribute("data-kaspar-angle",String(e.settings.initialAngle+time*.12));e.display.setAttribute("data-kaspar-geometry","actual-source-model6-qem");e.display.setAttribute("data-kaspar-reference","HERO-005");return true}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1280
 * @framerIntrinsicHeight 720
 */
export default function SourceKasparASCIIStudy(props:Props){
 const{animate=true,canvasMotion=false,speed=1,stillTime=2,artworkScale=1,glyphSize=1,density=1,revealDuration=1,initialAngle=0,background="#ffffff",ink="#adadad",showPlayback=true,style}=props
 const target=RenderTarget.current(),staticRenderer=useIsStaticRenderer(),canvasPreview=canvasMotion&&target===RenderTarget.canvas,isStatic=target===RenderTarget.export||target===RenderTarget.thumbnail||(staticRenderer&&!canvasPreview)||(target===RenderTarget.canvas&&!canvasPreview),root=React.useRef<HTMLDivElement>(null),canvas=React.useRef<HTMLCanvasElement>(null),[paused,setPaused]=React.useState(false),[status,setStatus]=React.useState<Status>("offscreen"),[error,setError]=React.useState("")
 const settings:Settings={mode:"kasparASCII",animate:animate&&!paused&&speed>0,static:isStatic,canvasPreview,speed:Math.max(0,speed),stillTime:Math.max(0,stillTime),interactive:false,primary:background,secondary:ink,ink,artworkScale:Math.max(.3,Math.min(2,artworkScale)),glyphSize:Math.max(.6,Math.min(2,glyphSize)),density:Math.max(.35,Math.min(1.5,density)),revealDuration:Math.max(.15,Math.min(4,revealDuration)),initialAngle:Number.isFinite(initialAngle)?initialAngle:0}
 const request=useStudySurface(root,canvas,settings,target,"SourceKasparASCIIStudy.tsx",(s,e)=>{setStatus(s);setError(e??"")})
 React.useLayoutEffect(()=>{const host=canvas.current;if(!host||typeof MutationObserver==="undefined")return;const sync=()=>publishKasparFrame(request.getEntry()),observer=new MutationObserver(sync);observer.observe(host,{attributes:true,attributeFilter:["data-study-state","data-study-frame-width","data-study-frame-height"]});sync();return()=>observer.disconnect()},[target])
 React.useLayoutEffect(()=>{const e=request.getEntry();if(e&&target!==RenderTarget.canvas&&animate&&speed>0){e.phase=0;request()}},[target])
 const replay=()=>{const e=request.getEntry();if(e){e.phase=0;setPaused(false);request()}}
 return <div ref={root} role="group" aria-label="HERO-005 / Maximilian Kaspar / credited botanical ASCII recreation" style={{width:"100%",height:"100%",...style,position:"relative",overflow:"hidden",background}}>
  <canvas ref={canvas} role="img" aria-label="Actual source plant geometry rendered as pale Courier ASCII, revealing and rotating over time" style={{display:"block",width:"100%",height:"100%"}}/>
  {showPlayback&&!isStatic&&target!==RenderTarget.canvas&&<div style={{position:"absolute",right:12,top:12,display:"flex",gap:6,font:'10px "Courier New",monospace',color:ink}}><button onClick={()=>setPaused(p=>!p)} disabled={!animate||speed<=0||status==="reduced-motion"} aria-pressed={paused} style={{font:"inherit",color:"inherit",border:"1px solid currentColor",padding:"4px 7px",background:"#ffffffdd",cursor:"pointer"}}>{paused?"PLAY":"PAUSE"}</button><button onClick={replay} disabled={!animate||speed<=0||status==="reduced-motion"} style={{font:"inherit",color:"inherit",border:"1px solid currentColor",padding:"4px 7px",background:"#ffffffdd",cursor:"pointer"}}>REPLAY</button></div>}
  {(error||status==="recovering")&&<div role="status" style={{position:"absolute",left:20,right:20,top:"46%",textAlign:"center",font:'11px "Courier New",monospace',color:ink}}>Restoring botanical ASCII…</div>}
 </div>
}
addPropertyControls(SourceKasparASCIIStudy,{
 animate:{type:ControlType.Boolean,title:"Animate",defaultValue:true},canvasMotion:{type:ControlType.Boolean,title:"Canvas motion",defaultValue:false},speed:{type:ControlType.Number,title:"Speed",min:0,max:2,step:.05,defaultValue:1},stillTime:{type:ControlType.Number,title:"Poster time",min:0,max:60,step:.1,defaultValue:2},artworkScale:{type:ControlType.Number,title:"Artwork scale",min:.3,max:2,step:.01,defaultValue:1},glyphSize:{type:ControlType.Number,title:"Glyph size",min:.6,max:2,step:.05,defaultValue:1},density:{type:ControlType.Number,title:"Density",min:.35,max:1.5,step:.05,defaultValue:1},revealDuration:{type:ControlType.Number,title:"Reveal seconds",min:.15,max:4,step:.05,defaultValue:1},initialAngle:{type:ControlType.Number,title:"Initial angle",min:0,max:6.2832,step:.02,defaultValue:0},background:{type:ControlType.Color,title:"Background",defaultValue:"#ffffff"},ink:{type:ControlType.Color,title:"Ink",defaultValue:"#adadad"},showPlayback:{type:ControlType.Boolean,title:"Playback",defaultValue:true},
})
