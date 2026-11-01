import * as React from "react"
import {addPropertyControls,ControlType,RenderTarget,useIsStaticRenderer} from "framer"
import {SOURCE_HERO_JOURNEY_DATA_0} from "./SourceHeroJourneyData0.ts"
import {SOURCE_HERO_JOURNEY_DATA_1} from "./SourceHeroJourneyData1.ts"
const JOURNEY_PACKED_BASE64=[SOURCE_HERO_JOURNEY_DATA_0,SOURCE_HERO_JOURNEY_DATA_1].join("")
const JOURNEY_RAW_BYTES=819275

// SOURCE INSPIRATION / HERO-014 / Liubomyr Ulytskyi / unbelievablycrap.com.
// Actual public figure/head geometry; reuse license unverified. Unpublished, credited recreation.
// Body uses measured QEM source-mesh simplification; head source topology retained.
// Virtual-story phase order follows observed source; exact input sensitivity/pose curves remain approximations.
// No original renderer or interaction JavaScript is reused. Biography is brief independently authored paraphrase.
type Mode="unbelievablycrapJourney"
type Status="waiting"|"running"|"paused"|"static"|"reduced-motion"|"offscreen"|"recovering"
interface SceneState {progress:number;frozenTime:number|null;clockOffset:number}
interface Props {animate?:boolean;canvasMotion?:boolean;speed?:number;posterProgress?:number;startProgress?:number;inputEnabled?:boolean;inputTravel?:number;rasterPitch?:number;intensity?:number;pointerStrength?:number;biographyText?:string;showInterface?:boolean;showPlayback?:boolean;style?:React.CSSProperties}
interface Settings {mode:Mode;animate:boolean;static:boolean;canvasPreview:boolean;speed:number;stillTime:number;interactive:boolean;primary:string;secondary:string;ink:string;sceneState:SceneState;rasterPitch:number;intensity:number;pointerStrength:number;managed?:boolean;renderWidth?:number;renderHeight?:number;managedBufferWidth?:number;managedBufferHeight?:number;pixelBudget?:number;colorHost?:HTMLCanvasElement}

function inflateJourneyBlock(input:Uint8Array,length:number){
    // Synchronous RFC1951 raw-DEFLATE. The trusted embedded delta stream has an
    // exact declared output size; tables, input, backreferences and writes are bounded.
    if(!Number.isInteger(length)||length<0||length>JOURNEY_RAW_BYTES||input.length<2||input.length>JOURNEY_RAW_BYTES+65536)throw new Error("Invalid vector envelope size")
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

// Actual public source geometry is decoded independently; source behavior JS is not reused.
type JourneyMesh={positions:Float32Array;normals:Float32Array;indices:Uint32Array}
let journeyMeshes:JourneyMesh[]|undefined
function getJourneyMeshes():JourneyMesh[]{
    if(journeyMeshes)return journeyMeshes
    const text=atob(JOURNEY_PACKED_BASE64),packed=new Uint8Array(text.length);for(let i=0;i<text.length;i++)packed[i]=text.charCodeAt(i)
    const raw=inflateJourneyBlock(packed,JOURNEY_RAW_BYTES),v=new DataView(raw.buffer);if(v.getUint32(0,true)!==0x31594a48||raw[4]!==2)throw Error("Invalid journey geometry header")
    let cursor=5;const result:JourneyMesh[]=[]
    for(let mesh=0;mesh<2;mesh++){
        if(cursor+60>raw.length)throw Error("Truncated journey geometry")
        const count=v.getUint32(cursor,true),indexCount=v.getUint32(cursor+4,true),indexBytes=v.getUint32(cursor+8,true),min=[0,1,2].map(i=>v.getFloat64(cursor+12+i*8,true)),max=[0,1,2].map(i=>v.getFloat64(cursor+36+i*8,true));cursor+=60
        if(count<3||count>150000||indexCount<3||indexCount>900000||indexCount%3||min.some((n,i)=>!Number.isFinite(n)||!Number.isFinite(max[i])||max[i]<=n)||cursor+count*9+indexBytes>raw.length)throw Error("Invalid journey mesh bounds")
        const positions=new Float32Array(count*3),normals=new Float32Array(count*3),indices=new Uint32Array(indexCount),normalOffset=cursor+count*6
        for(let i=0;i<count*3;i++){const axis=i%3;positions[i]=min[axis]+v.getUint16(cursor+i*2,true)/65535*(max[axis]-min[axis]);normals[i]=Math.max(-1,v.getInt8(normalOffset+i)/127)}cursor+=count*9
        const end=cursor+indexBytes;let previous=0
        for(let i=0;i<indexCount;i++){let value=0,bits=0,byte=0;do{if(cursor>=end||bits>28)throw Error("Invalid journey index delta");byte=raw[cursor++];if(bits===28&&(byte&127)>15)throw Error("Excess journey index bits");value|=(byte&127)<<bits;bits+=7}while(byte&128);const delta=(value>>>1)^-(value&1),index=previous+delta;if(index<0||index>=count)throw Error("Journey index outside mesh");indices[i]=index;previous=index}
        if(cursor!==end)throw Error("Trailing journey index data");result.push({positions,normals,indices})
    }
    if(cursor!==raw.length)throw Error("Trailing journey geometry")
    journeyMeshes=result;return result
}
const clamp=(x:number,min=0,max=1)=>Number.isFinite(x)?Math.max(min,Math.min(max,x)):min,smooth=(a:number,b:number,x:number)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)},mix=(a:number,b:number,t:number)=>a+(b-a)*t
function journeyState(progress:number){const p=clamp(progress);return{progress:p,chapter:p<.10?"figure":p<.235?"biography":p<.34?"white-reveal":p<.65?"portrait":p<.76?"red-reveal":"terminal",bio:smooth(.045,.12,p)*(1-smooth(.20,.26,p)),white:smooth(.235,.34,p),red:smooth(.69,.80,p),bodyYaw:mix(.15,Math.PI,smooth(.04,.21,p)),headYaw:mix(-.08,.42,smooth(.35,.64,p)),terminal:smooth(.76,.84,p)}}
function virtualDelta(progress:number,delta:number,travel:number){return clamp(progress+clamp(delta,-1600,1600)/Math.max(800,travel))}
function virtualKey(progress:number,key:string,shift=false){if(key==="Home")return 0;if(key==="End")return 1;if(key==="ArrowDown"||key==="ArrowRight")return clamp(progress+.035);if(key==="ArrowUp"||key==="ArrowLeft")return clamp(progress-.035);if(key==="PageDown"||key===" ")return clamp(progress+(shift?-.11:.11));if(key==="PageUp")return clamp(progress-.11);return null}
const JOURNEY_VERTEX=`
attribute vec3 a_position;attribute vec3 a_normal;uniform mat3 u_rotation;uniform vec2 u_view;uniform vec2 u_center;varying vec3 v_normal;varying vec3 v_position;
void main(){vec3 p=a_position-vec3(0.,.5,0.);v_position=a_position;v_normal=u_rotation*a_normal;p=u_rotation*p;gl_Position=vec4(p.xy*u_view+u_center,-p.z*.3,1.);}`
const JOURNEY_FRAGMENT=`
precision highp float;varying vec3 v_normal;varying vec3 v_position;uniform vec2 u_resolution;uniform vec2 u_logical;uniform float u_progress;uniform float u_time;uniform float u_pitch;uniform float u_intensity;uniform float u_head;uniform float u_mini;uniform sampler2D u_words;
float hash(float x){return fract(sin(x*127.1)*43758.5453);}float tear(float x){return .022*sin(x*41.+sin(x*17.)*2.)+.009*sin(x*127.)+.004*(hash(floor(x*350.))-.5);}float mask(float a,vec2 uv){return step(uv.y, mix(-.10,1.10,a)+tear(uv.x));}
void main(){vec2 uv=gl_FragCoord.xy/u_resolution,css=uv*u_logical;float white=smoothstep(.235,.34,u_progress),red=smoothstep(.69,.80,u_progress);if(u_mini<.5){if(u_head<.5&&mask(white,uv)>.5)discard;if(u_head>.5&&(mask(white,uv)<.5||mask(red,uv)>.5))discard;}vec3 n=normalize(v_normal);if(u_mini>.5){gl_FragColor=vec4(1.);return;}float stripe=.48+.52*step(.45,fract(css.y/max(.7,u_pitch*.55)));if(u_head<.5){float light=.18+.55*max(0.,dot(n,normalize(vec3(-.3,.5,1.))));vec3 chroma=.70+.30*abs(n.yzx);vec3 color=chroma*light*stripe*u_intensity;float row=mod(floor(css.y/max(.7,u_pitch*.66)),3.);color*=vec3(row<.5?1.:.62,row>.5&&row<1.5?1.:.65,row>1.5?1.:.65);gl_FragColor=vec4(color,1.);}else{float contour=pow(1.-abs(n.z),7.)*.12,word=texture2D(u_words,vec2(v_position.x+.50,1.-v_position.y)).r;float dots=step(.78,fract(css.y/max(1.,u_pitch)))*.024;gl_FragColor=vec4(vec3(1.-contour-word*.90-dots),1.);}}`
const JOURNEY_BG_VERTEX=`attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`
const JOURNEY_BG_FRAGMENT=`
precision highp float;varying vec2 v_uv;uniform vec2 u_logical;uniform float u_progress;uniform float u_time;uniform float u_pitch;
float hash(float x){return fract(sin(x*127.1)*43758.5453);}float tear(float x){return .022*sin(x*41.+sin(x*17.)*2.)+.009*sin(x*127.)+.004*(hash(floor(x*350.))-.5);}float reveal(float a,vec2 uv){return step(uv.y,mix(-.10,1.10,a)+tear(uv.x));}float box(vec2 p,vec2 b){vec2 d=abs(p)-b;return max(d.x,d.y);}mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
void main(){vec2 uv=v_uv,css=uv*u_logical;float white=reveal(smoothstep(.235,.34,u_progress),uv),red=reveal(smoothstep(.69,.80,u_progress),uv);vec3 color=mix(vec3(.012),vec3(.955),white);color=mix(color,vec3(1.,0.,0.),red);float terrain=sin(uv.x*12.+sin(uv.x*21.)*.9)+sin(uv.x*28.-uv.y*17.)*.34;float map=1.-smoothstep(.03,.07,uv.y-(.12+terrain*.075));float dots=step(.76,fract(css.x/2.6))*step(.76,fract(css.y/2.6));color+=vec3(white>.5?-.20:.11)*map*dots;vec2 mini=vec2(uv.x,1.-uv.y);if(white<.5&&mini.x<.23&&mini.y<.21)color+=vec3(.15)*step(.84,fract(css.x/4.))*step(.84,fract(css.y/4.));float headStage=smoothstep(.32,.37,u_progress)*(1.-smoothstep(.62,.69,u_progress));vec2 p=(uv-vec2(.5,.60))*u_logical;float angle=mix(0.,-.42,smoothstep(.37,.57,u_progress));float bar=step(box(rot(angle)*p,vec2(u_logical.x*.31,u_logical.y*.075)),0.);vec2 q=(uv-vec2(.45,.72))*u_logical;bar=max(bar,step(box(rot(angle)*q,vec2(u_logical.x*.043,u_logical.y*.21)),0.));color=mix(color,vec3(1.,0.,0.),bar*headStage*white*(1.-red));float terminal=smoothstep(.76,.84,u_progress);vec2 panel=(uv-vec2(.5,.38))*u_logical;panel=rot(.025*sin(u_time*.12)-.02)*panel;float frame=step(box(panel,vec2(u_logical.x*.49,u_logical.y*.12)),0.);float ellipse=1.-step(1.,length(panel/vec2(u_logical.x*.475,u_logical.y*.075)));color=mix(color,vec3(.015),frame*terminal);color=mix(color,vec3(1.,0.,0.),ellipse*frame*terminal);gl_FragColor=vec4(clamp(color,0.,1.),1.);}`
function journeyRotation(yaw:number,pitch=0){const c=Math.cos(yaw),s=Math.sin(yaw),a=Math.cos(pitch),b=Math.sin(pitch);return new Float32Array([c,s*b,-s*a,0,a,b,s,-c*b,c*a])}
interface GPUChunk{position:WebGLBuffer;normal:WebGLBuffer;index:WebGLBuffer;count:number}
function meshChunks(mesh:JourneyMesh){const chunks:{positions:Float32Array;normals:Float32Array;indices:Uint16Array}[]=[],map=new Map<number,number>();let positions:number[]=[],normals:number[]=[],indices:number[]=[];const flush=()=>{if(!indices.length)return;chunks.push({positions:new Float32Array(positions),normals:new Float32Array(normals),indices:new Uint16Array(indices)});map.clear();positions=[];normals=[];indices=[]};for(let i=0;i<mesh.indices.length;i+=3){const tri=[mesh.indices[i],mesh.indices[i+1],mesh.indices[i+2]],extra=tri.filter(x=>!map.has(x)).length;if(map.size+extra>65535)flush();for(const source of tri){let local=map.get(source);if(local===undefined){local=map.size;map.set(source,local);positions.push(...mesh.positions.subarray(source*3,source*3+3));normals.push(...mesh.normals.subarray(source*3,source*3+3))}indices.push(local)}}flush();return chunks}
function createRenderer(canvas:HTMLCanvasElement,initial:Settings,notify:(status:Status,error?:string)=>void,resumeTime=initial.stillTime){
    const context=canvas.getContext("webgl",{alpha:false,antialias:false,powerPreference:"low-power"});if(!context)throw Error("WebGL is unavailable");const gl:WebGLRenderingContext=context
    let settings=initial,width=1,height=1,bw=1,bh=1,clock=resumeTime,lost=false,disposed=false,mouse:[number,number]=[0,0],body:GPUChunk[]=[],head:GPUChunk[]=[],background:WebGLProgram|undefined,surface:WebGLProgram|undefined,quad:WebGLBuffer|undefined,words:WebGLTexture|undefined
    const programs:WebGLProgram[]=[],buffers:WebGLBuffer[]=[],locations=new Map<WebGLProgram,Map<string,WebGLUniformLocation|null>>()
    function release(){programs.forEach(x=>gl.deleteProgram(x));buffers.forEach(x=>gl.deleteBuffer(x));if(words)gl.deleteTexture(words);programs.length=0;buffers.length=0;locations.clear();body=[];head=[];background=surface=undefined;quad=undefined;words=undefined}
    function compile(kind:number,source:string){const s=gl.createShader(kind);if(!s)throw Error("Shader unavailable");gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(error||"Journey shader error")}return s}
    function program(vertex:string,fragment:string){const v=compile(gl.VERTEX_SHADER,vertex);let f:WebGLShader|undefined,p:WebGLProgram|undefined;try{f=compile(gl.FRAGMENT_SHADER,fragment);p=gl.createProgram()??undefined;if(!p)throw Error("Program unavailable");gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p)||"Journey link error");programs.push(p);return p}catch(e){if(p)gl.deleteProgram(p);throw e}finally{gl.deleteShader(v);if(f)gl.deleteShader(f)}}
    function buffer(data:Float32Array|Uint16Array,target:number){const b=gl.createBuffer();if(!b)throw Error("Geometry buffer unavailable");buffers.push(b);gl.bindBuffer(target,b);gl.bufferData(target,data,gl.STATIC_DRAW);return b}
    function upload(mesh:JourneyMesh){return meshChunks(mesh).map(c=>({position:buffer(c.positions,gl.ARRAY_BUFFER),normal:buffer(c.normals,gl.ARRAY_BUFFER),index:buffer(c.indices,gl.ELEMENT_ARRAY_BUFFER),count:c.indices.length}))}
    function allocate(){try{background=program(JOURNEY_BG_VERTEX,JOURNEY_BG_FRAGMENT);surface=program(JOURNEY_VERTEX,JOURNEY_FRAGMENT);quad=buffer(new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.ARRAY_BUFFER);const meshes=getJourneyMeshes();body=upload(meshes[0]);head=upload(meshes[1]);words=gl.createTexture()??undefined;if(!words)throw Error("Writing texture unavailable");const atlas=document.createElement("canvas");atlas.width=1024;atlas.height=1024;const c=atlas.getContext("2d");if(!c)throw Error("Writing atlas unavailable");c.fillStyle="black";c.fillRect(0,0,1024,1024);c.fillStyle="white";c.font='12px "Arial Narrow",sans-serif';const terms=["BOLD","CHARACTERFUL","FUNCTIONAL","EXPERIMENTAL","DISTINCTIVE","CLEVER","SHARP","UNEXPECTED"];for(let y=55,i=0;y<650;y+=18,i++){if(i%11===5||i%11===6)continue;c.fillText(terms[i%terms.length],418+Math.sin(i*.17)*14,y)}for(let y=130,i=0;y<960;y+=18,i++){if(y>430&&y<660||i%13===8)continue;c.fillText(terms[(i*3+2)%terms.length],558+Math.cos(i*.14)*24,y)}gl.bindTexture(gl.TEXTURE_2D,words);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)}catch(e){release();throw e}}
    function uniform(p:WebGLProgram,name:string){let m=locations.get(p);if(!m){m=new Map();locations.set(p,m)}if(!m.has(name))m.set(name,gl.getUniformLocation(p,name));return m.get(name)??null}
    function one(p:WebGLProgram,name:string,v:number){const l=uniform(p,name);if(l!==null)gl.uniform1f(l,v)}function two(p:WebGLProgram,name:string,a:number,b:number){const l=uniform(p,name);if(l!==null)gl.uniform2f(l,a,b)}
    function attribute(p:WebGLProgram,name:string,b:WebGLBuffer,size:number){const l=gl.getAttribLocation(p,name);if(l<0)return;gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,0,0)}
    function resize(){width=Math.max(1,settings.renderWidth??canvas.clientWidth??960);height=Math.max(1,settings.renderHeight??canvas.clientHeight??720);let w=Math.max(1,Math.floor(settings.managedBufferWidth??width)),h=Math.max(1,Math.floor(settings.managedBufferHeight??height));const budget=Math.max(1,settings.pixelBudget??2000000);if(w*h>budget){const r=Math.sqrt(budget/(w*h));w=Math.max(1,Math.floor(w*r));h=Math.max(1,Math.min(Math.floor(budget/w),Math.floor(h*r)))}bw=w;bh=h;if(canvas.width!==w||canvas.height!==h){canvas.width=canvas.height=1;canvas.width=w;canvas.height=h}}
    function draw(){if(disposed||lost||!background||!surface||!quad||!words)return;const p=clamp(settings.sceneState.progress),s=journeyState(p),time=settings.sceneState.frozenTime??clock-settings.sceneState.clockOffset
        gl.viewport(0,0,bw,bh);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);gl.depthMask(true);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(background);attribute(background,"a_position",quad,2);two(background,"u_logical",width,height);one(background,"u_progress",p);one(background,"u_time",time);one(background,"u_pitch",settings.rasterPitch);gl.drawArrays(gl.TRIANGLE_STRIP,0,4)
        gl.useProgram(surface);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,words);const sampler=uniform(surface,"u_words");if(sampler!==null)gl.uniform1i(sampler,0);two(surface,"u_resolution",bw,bh);two(surface,"u_logical",width,height);one(surface,"u_progress",p);one(surface,"u_time",time);one(surface,"u_pitch",settings.rasterPitch);one(surface,"u_intensity",settings.intensity);one(surface,"u_mini",0)
        const meshProgram=surface
        const model=(chunks:GPUChunk[],isHead:boolean,yaw:number,fit:number,centerY:number)=>{one(meshProgram,"u_head",isHead?1:0);two(meshProgram,"u_view",fit*2/width,fit*2/height);two(meshProgram,"u_center",0,1-centerY*2);const rot=uniform(meshProgram,"u_rotation");if(rot!==null)gl.uniformMatrix3fv(rot,false,journeyRotation(yaw+mouse[0]*settings.pointerStrength,mouse[1]*settings.pointerStrength*.3));for(const c of chunks){attribute(meshProgram,"a_position",c.position,3);attribute(meshProgram,"a_normal",c.normal,3);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,c.index);gl.drawElements(gl.TRIANGLES,c.count,gl.UNSIGNED_SHORT,0)}}
        if(p<.34)model(body,false,s.bodyYaw+Math.sin(time*.17)*.025,height*.49,.50)
        if(p>.235&&p<.80){const fit=Math.min(height*.95,width*1.2);model(head,true,s.headYaw+Math.sin(time*.12)*.01,fit,.16+fit/(2*height))}
        if(p<.235){gl.disable(gl.DEPTH_TEST);gl.viewport(0,Math.floor(bh*.79),Math.floor(bw*.23),Math.floor(bh*.20));one(surface,"u_mini",1);model(body,false,s.bodyYaw,height*.30,.50)}
        gl.viewport(0,0,bw,bh);gl.flush();for(const n of[canvas,settings.colorHost])if(n){n.setAttribute("data-journey-progress",String(p));n.setAttribute("data-journey-chapter",s.chapter);n.setAttribute("data-journey-time",String(time));n.setAttribute("data-journey-clock",String(clock));n.setAttribute("data-journey-scene-key",JSON.stringify(settings.sceneState));n.setAttribute("data-journey-reference","HERO-014");n.setAttribute("data-journey-geometry","actual-source-qem25+actual-source-head")}
    }
    const onLost=(e:Event)=>{e.preventDefault();if(disposed||lost)return;lost=true;release();notify("recovering","Restoring journey graphics.")},onRestored=()=>{if(disposed||!lost)return;lost=false;try{allocate();resize();notify("waiting")}catch(e){lost=true;release();notify("recovering",String(e))}}
    canvas.addEventListener("webglcontextlost",onLost);canvas.addEventListener("webglcontextrestored",onRestored);try{allocate();resize()}catch(e){canvas.removeEventListener("webglcontextlost",onLost);canvas.removeEventListener("webglcontextrestored",onRestored);gl.getExtension("WEBGL_lose_context")?.loseContext();throw e}
    return{update(next:Settings){settings=next;resize()},setPointer(x:number,y:number){mouse=settings.interactive?[x,y]:[0,0]},renderAt(seconds:number){clock=seconds;draw()},getSnapshot(){return{mode:settings.mode,stillTime:settings.stillTime,time:clock,lost,sceneState:{...settings.sceneState}}},dispose(){if(disposed)return;disposed=true;canvas.removeEventListener("webglcontextlost",onLost);canvas.removeEventListener("webglcontextrestored",onRestored);release();gl.getExtension("WEBGL_lose_context")?.loseContext()}}
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






function publishJourneyFrame(e:StudyEntry|null){if(!e?.hasFrame||e.frameKey!==e.contentKey)return false;const state=e.settings.sceneState,time=state.frozenTime??e.framePhase-state.clockOffset;for(const[k,v]of Object.entries({"data-journey-progress":state.progress,"data-journey-chapter":journeyState(state.progress).chapter,"data-journey-time":time,"data-journey-clock":e.framePhase,"data-journey-scene-key":JSON.stringify(state),"data-journey-reference":"HERO-014","data-journey-geometry":"actual-source-qem25+actual-source-head"}))e.display.setAttribute(k,String(v));return true}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1280
 * @framerIntrinsicHeight 720
 */
export default function SourceHeroJourneyStudy(props:Props){
    const{animate=true,canvasMotion=false,speed=1,posterProgress=0,startProgress=0,inputEnabled=true,inputTravel=6400,rasterPitch=1.2,intensity=1,pointerStrength=0,biographyText=DEFAULT_BIOGRAPHY,showInterface=true,showPlayback=true,style}=props
    const target=RenderTarget.current(),staticRenderer=useIsStaticRenderer(),canvasPreview=canvasMotion&&target===RenderTarget.canvas,isStatic=target===RenderTarget.export||target===RenderTarget.thumbnail||(staticRenderer&&!canvasPreview)||(target===RenderTarget.canvas&&!canvasPreview)
    const root=React.useRef<HTMLDivElement>(null),canvas=React.useRef<HTMLCanvasElement>(null),value=React.useRef(clamp(startProgress)),pending=React.useRef<number|null>(null),settle=React.useRef<ReturnType<typeof setTimeout>|null>(null),touch=React.useRef<{id:number;y:number}|null>(null),lastCommit=React.useRef(0)
    const[progress,setProgress]=React.useState(value.current),[gesture,setGesture]=React.useState(false),[paused,setPaused]=React.useState(false),[frozen,setFrozen]=React.useState(0),[offset,setOffset]=React.useState(0),[status,setStatus]=React.useState<Status>("offscreen"),[error,setError]=React.useState(""),[reduced,setReduced]=React.useState(false)
    const readTime=()=>Number(canvas.current?.getAttribute("data-journey-time")??0),readClock=()=>Number(canvas.current?.getAttribute("data-journey-clock")??0)
    React.useEffect(()=>{value.current=clamp(startProgress);setProgress(value.current)},[startProgress])
    React.useEffect(()=>{const media=window.matchMedia("(prefers-reduced-motion: reduce)"),update=()=>setReduced(media.matches);update();media.addEventListener("change",update);return()=>media.removeEventListener("change",update)},[])
    const inputAllowed=inputEnabled&&!isStatic&&target!==RenderTarget.canvas
    const navigate=(next:number)=>{if(!inputAllowed)return;value.current=Math.round(clamp(next)*10000)/10000;setGesture(true);if(settle.current)clearTimeout(settle.current);settle.current=setTimeout(()=>{settle.current=null;setGesture(false)},220);if(pending.current===null){const commit=(now:number)=>{if(now-lastCommit.current<1000/30){pending.current=requestAnimationFrame(commit);return}pending.current=null;lastCommit.current=now;setProgress(value.current)};pending.current=requestAnimationFrame(commit)}}
    React.useEffect(()=>{const node=root.current;if(!node||!inputAllowed)return;const wheel=(e:WheelEvent)=>{if(e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)*1.5)return;if(e.cancelable)e.preventDefault();const unit=e.deltaMode===1?16:e.deltaMode===2?node.clientHeight:1;navigate(virtualDelta(value.current,e.deltaY*unit,inputTravel))};node.addEventListener("wheel",wheel,{passive:false});return()=>node.removeEventListener("wheel",wheel)},[inputAllowed,inputTravel])
    React.useEffect(()=>()=>{if(pending.current!==null)cancelAnimationFrame(pending.current);if(settle.current)clearTimeout(settle.current);pending.current=null;settle.current=null},[])
    const chosenProgress=isStatic||target===RenderTarget.canvas?clamp(posterProgress):progress,scene=journeyState(chosenProgress),ambientFrozen=isStatic||reduced?0:!animate||speed<=0?readTime():paused?frozen:null
    const sceneState:SceneState={progress:chosenProgress,frozenTime:ambientFrozen,clockOffset:offset}
    const settings:Settings={mode:"unbelievablycrapJourney",animate:(!paused&&animate&&speed>0)||gesture,static:isStatic,canvasPreview,speed:gesture?Math.max(.001,speed):Math.max(0,speed),stillTime:0,interactive:pointerStrength>0&&!reduced,primary:"#ffffff",secondary:"#000000",ink:"#000000",sceneState,rasterPitch:Math.max(.7,Math.min(4,rasterPitch)),intensity:Math.max(.35,Math.min(1.5,intensity)),pointerStrength:Math.max(0,Math.min(.7,pointerStrength))}
    const request=useStudySurface(root,canvas,settings,target,"SourceHeroJourneyStudy.tsx",(s,e)=>{setStatus(s);setError(e??"")})
    React.useLayoutEffect(()=>{const host=canvas.current;if(!host||typeof MutationObserver==="undefined")return;const sync=()=>publishJourneyFrame(request.getEntry()),observer=new MutationObserver(sync);observer.observe(host,{attributes:true,attributeFilter:["data-study-state","data-study-frame-width","data-study-frame-height"]});sync();return()=>observer.disconnect()},[target])
    const toggle=()=>{if(paused){setOffset(readClock()-frozen);setPaused(false);request()}else{setFrozen(readTime());setPaused(true)}}
    const color=scene.red>.5||scene.white>.5?"#111111":"#f0f0ed",mono:React.CSSProperties={fontFamily:'"IBM Plex Mono",ui-monospace,monospace',fontSize:"clamp(6px,1.15cqh,10px)",lineHeight:1.2,letterSpacing:"-.06em"},condensed:React.CSSProperties={fontFamily:'"Arial Narrow",Arial,sans-serif',fontStretch:"condensed",fontWeight:500,letterSpacing:"-.07em"},lines=biographyText.split(/\n+/).map(x=>x.trim()).filter(Boolean),headWindow=smooth(.32,.37,chosenProgress)*(1-smooth(.62,.69,chosenProgress))
    return <div ref={root} role="group" tabIndex={inputAllowed?0:undefined} aria-label="Unbelievably Crap / credited source journey" aria-description="Explore with wheel, touch or arrow keys. Home returns to entry; End reaches the terminal scene. Pause holds ambient motion while navigation remains available." onKeyDown={e=>{if(!inputAllowed||e.target!==e.currentTarget)return;const next=virtualKey(value.current,e.key,e.shiftKey);if(next!==null){e.preventDefault();navigate(next)}}} onPointerDown={e=>{if(!inputAllowed||(e.pointerType!=="touch"&&e.pointerType!=="pen")||(e.target as Element).closest?.("a,button,input,textarea,select,[contenteditable=true]"))return;touch.current={id:e.pointerId,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMoveCapture={e=>{if(!touch.current||touch.current.id!==e.pointerId)return;e.stopPropagation();const delta=touch.current.y-e.clientY;touch.current.y=e.clientY;navigate(virtualDelta(value.current,delta*2.4,inputTravel))}} onPointerUp={e=>{if(touch.current?.id===e.pointerId){touch.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}}} onPointerCancel={e=>{touch.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}} style={{width:"100%",height:"100%",...style,position:"relative",overflow:"hidden",background:"#030303",containerType:"size",touchAction:inputAllowed?"none":"pan-y",outlineOffset:-2,color} as React.CSSProperties & {containerType?:"size"}}>
        <canvas ref={canvas} role="img" aria-label="Actual source scan geometry, raster material and reversible story scenes" style={{display:"block",width:"100%",height:"100%"}}/>
        <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
            {showInterface&&<>
                <div style={{...mono,position:"absolute",left:".8%",top:"21.5%",width:"22%",opacity:1-scene.white}}><span>X {String(Math.floor(chosenProgress*999)).padStart(3,"0")}</span><span style={{float:"right"}}>Y {String(Math.floor(chosenProgress*739)).padStart(3,"0")}</span><div style={{marginTop:6,display:"flex",justifyContent:"space-between"}}><span>ENEMY DETECTED</span><span>I AM WATCHING YOU</span></div></div>
                <div style={{...mono,position:"absolute",left:".8%",top:"64%",opacity:1-scene.white}}>ENEMY DETECTED<br/>PROTOCOL 00039<br/>2026 / ETERNITY</div>
                <div style={{...mono,position:"absolute",right:".8%",top:"1.5%",width:"22%",padding:3,background:"rgba(150,150,150,.16)",textAlign:"right",opacity:1-scene.white}}>UI/UX DESIGNER / CONCEPTUALIST</div>
                <div data-journey-ui="awards" style={{...mono,position:"absolute",right:".8%",top:"7.4%",width:"max(15.1%, 120px)",fontSize:"clamp(5px,min(1cqh,1.5cqw),9px)",lineHeight:1.75,opacity:1-scene.white}}>{["AWWWARDS HONORABLE MENTION","AWWWARDS PRODUCT HONORS","CSS DESIGN AWARD","CSSDA INNOVATION","CSSDA UI","CSSDA UX","OPETRON SITE OF THE DAY","OPETRON SOTD","FWA SOTD","18 / IN TOTAL"].map((label,i)=><div key={label} style={{opacity:.72-i*.045,whiteSpace:"nowrap"}}>{label}</div>)}</div>
                <div style={{...mono,position:"absolute",left:".8%",top:"1%",opacity:scene.white}}>DIGITAL DESIGNER<br/>ART DIRECTION<br/>ANIMATION<br/>CREATIVE DEVELOPMENT</div>
                <div style={{...mono,position:"absolute",right:".8%",top:"1%",textAlign:"right",opacity:scene.white}}>ART DIRECTION<br/>ANIMATION<br/>CREATIVE DEVELOPMENT</div>
                <div data-journey-ui="scroll-hud" style={{...mono,position:"absolute",left:".8%",right:".8%",bottom:"6%",display:"flex",justifyContent:"space-between"}}><span>000</span><span>100 / {scene.chapter.toUpperCase()}</span><span>SCROLL</span></div>
            </>}
            <div style={{...condensed,fontSize:"clamp(6px,1.4cqh,12px)",lineHeight:1.7,position:"absolute",inset:"-2% 23% 0",display:"grid",gridTemplateColumns:"1fr 1fr",columnGap:"7%",opacity:scene.bio,transform:`translateY(${mix(10,-30,smooth(.08,.24,chosenProgress))}%)`}}>{[0,1].map(col=><div key={col} style={{textAlign:col===0?"right":"left"}}>{Array.from({length:42},(_,i)=><div key={i}>{lines[(i+col*7)%Math.max(1,lines.length)]}</div>)}</div>)}</div>
            <div style={{...condensed,position:"absolute",left:"29%",top:"26%",fontSize:"clamp(42px,14cqh,116px)",lineHeight:1,fontWeight:700,opacity:headWindow,transform:`rotate(${mix(-90,90,smooth(.36,.59,chosenProgress))}deg)`}}>0039</div>
            <div style={{...condensed,position:"absolute",top:"13%",left:"25%",right:"25%",textAlign:"center",color:"#d42020",fontSize:"clamp(25px,7cqh,64px)",lineHeight:.95,opacity:smooth(.60,.65,chosenProgress)*(1-smooth(.69,.73,chosenProgress))}}>A DIFFERENT<br/>WAY THROUGH.</div>
            <div style={{position:"absolute",inset:0,opacity:scene.terminal,color:"#080808"}}>
                <div style={{...condensed,fontSize:"clamp(44px,13.4cqh,118px)",fontWeight:700,lineHeight:.88,letterSpacing:"-.085em",textAlign:"center",position:"absolute",top:".6%",left:"18%",right:"18%"}}>FIND YOUR<br/>WAY OUT OF<br/>HERE</div>
                <div style={{...mono,position:"absolute",left:"3%",top:"69%"}}>0039 / EXIT / STILL HERE</div>
                <div style={{...mono,position:"absolute",left:".8%",top:"77%",right:".8%",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,borderTop:"2px solid #111",paddingTop:4}}><div>LINKEDIN / SOURCE CREATOR<br/><br/>A visual practice in motion.<br/>The image keeps changing.</div><div>DON'T CONTACT ME<br/><br/>FUNCTION BEFORE EXPECTATION<br/>A DIFFERENT POINT OF VIEW</div></div>
            </div>
        </div>
        {showInterface&&<nav aria-label="Original source navigation" style={{...mono,position:"absolute",bottom:0,left:0,right:0,height:"clamp(20px,3.8cqh,30px)",display:"flex",alignItems:"center",gap:"1.2%",padding:"0 .8%",background:"#383838",color:"#eeeeeb"}}><a href="https://www.unbelievablycrap.com/" target="_blank" rel="noreferrer" style={{color:"inherit"}}>INDEX+</a><a href="https://www.unbelievablycrap.com/work" target="_blank" rel="noreferrer" style={{color:"inherit"}}>WORK+</a><a href="https://www.unbelievablycrap.com/gallery" target="_blank" rel="noreferrer" style={{color:"inherit"}}>GALLERY+</a><a href="https://www.unbelievablycrap.com/404" target="_blank" rel="noreferrer" style={{color:"inherit"}}>ERROR+</a><span style={{marginLeft:"auto"}}>GMT+2</span></nav>}
        {showPlayback&&!isStatic&&<button data-journey-ui="playback" onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()} onClick={toggle} disabled={reduced||!animate||speed<=0} aria-pressed={paused} style={{...mono,position:"absolute",right:10,bottom:showInterface?"12%":10,border:"1px solid currentColor",background:"transparent",color,padding:"4px 7px",cursor:"pointer"}}>{reduced?"REDUCED MOTION":paused?"PLAY":"PAUSE"}</button>}
        {(error||status==="recovering")&&<div role="status" style={{...mono,position:"absolute",top:"45%",left:"10%",right:"10%",textAlign:"center"}}>Restoring source geometry…</div>}
    </div>
}
const DEFAULT_BIOGRAPHY="A VISUAL PRACTICE IN MOTION.\nAN IMAGE CAN CHANGE THE QUESTION.\nFORM, TYPE AND TIMING SHARE THE SAME SPACE.\nTHE DETAIL INVITES A CLOSER LOOK.\nA DIFFERENT POINT OF VIEW.\nTHE WORK CONTINUES BEYOND THE FIRST FRAME.\nRESEARCHING THE LIMITS OF THE IMAGE.\nWHAT REMAINS WHEN THE FRAME CHANGES?\nA THOUGHT BECOMES A MOVING FORM.\nLOOK AGAIN."
addPropertyControls(SourceHeroJourneyStudy,{
    animate:{type:ControlType.Boolean,title:"Animate",defaultValue:true},canvasMotion:{type:ControlType.Boolean,title:"Canvas motion",defaultValue:false},speed:{type:ControlType.Number,title:"Speed",min:0,max:2,step:.05,defaultValue:1},posterProgress:{type:ControlType.Number,title:"Poster scene",min:0,max:1,step:.01,defaultValue:0},startProgress:{type:ControlType.Number,title:"Start scene",min:0,max:1,step:.01,defaultValue:0},inputEnabled:{type:ControlType.Boolean,title:"Story input",defaultValue:true},inputTravel:{type:ControlType.Number,title:"Input travel",min:800,max:16000,step:100,defaultValue:6400},rasterPitch:{type:ControlType.Number,title:"Raster pitch",min:.7,max:4,step:.1,defaultValue:1.2},intensity:{type:ControlType.Number,title:"Intensity",min:.35,max:1.5,step:.05,defaultValue:1},pointerStrength:{type:ControlType.Number,title:"Pointer amount",min:0,max:.7,step:.01,defaultValue:0},biographyText:{type:ControlType.String,title:"Body text",displayTextArea:true,defaultValue:DEFAULT_BIOGRAPHY},showInterface:{type:ControlType.Boolean,title:"Source interface",defaultValue:true},showPlayback:{type:ControlType.Boolean,title:"Playback",defaultValue:true},
})
