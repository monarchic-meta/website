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
interface JourneySpin {start:number;turns:number}
interface JourneyRamp {from:number;to:number;at:number}
interface JourneyTransition {white:JourneyRamp;red:JourneyRamp}
interface SceneState {progress:number;frozenTime:number|null;clockOffset:number;headSpin?:JourneySpin|null;transition?:JourneyTransition|null}
interface Props {animate?:boolean;canvasMotion?:boolean;speed?:number;posterProgress?:number;startProgress?:number;inputEnabled?:boolean;inputTravel?:number;rasterPitch?:number;intensity?:number;pointerStrength?:number;biographyText?:string;showInterface?:boolean;showPlayback?:boolean;style?:React.CSSProperties}
interface Settings {mode:Mode;artworkRevision?:string;animate:boolean;static:boolean;canvasPreview:boolean;speed:number;stillTime:number;interactive:boolean;primary:string;secondary:string;ink:string;sceneState:SceneState;rasterPitch:number;intensity:number;pointerStrength:number;managed?:boolean;renderWidth?:number;renderHeight?:number;managedBufferWidth?:number;managedBufferHeight?:number;pixelBudget?:number;colorHost?:HTMLCanvasElement}

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
const JOURNEY_ARTWORK_REVISION="current-source-travel-head-turn-settling-v1"
const JOURNEY_COPY_SPAN=2466,JOURNEY_MASK_SPAN=300,JOURNEY_REFERENCE_HEAD=6504,JOURNEY_REFERENCE_TOTAL=9270
function journeyState(progress:number,height=900){
    const p=clamp(progress),distance=p*JOURNEY_REFERENCE_TOTAL,copy=Math.min(JOURNEY_COPY_SPAN,distance),white=clamp((distance-JOURNEY_COPY_SPAN)/JOURNEY_MASK_SPAN)
    const headProgress=clamp((distance-JOURNEY_COPY_SPAN-JOURNEY_MASK_SPAN)/JOURNEY_REFERENCE_HEAD),headSpan=1644+5.4*Math.max(1,height),headTravel=headProgress*headSpan,red=clamp((headTravel-.59*headSpan)/300)
    return{progress:p,chapter:distance<Math.min(height,JOURNEY_COPY_SPAN*.4)?"figure":distance<JOURNEY_COPY_SPAN?"biography":white<1?"white-reveal":red<=0?"portrait":red<1?"red-reveal":"terminal",copyTravel:copy,headTravel,headSpan,headProgress,bio:1-white,white,red,bodyYaw:.15+copy*.22*Math.PI/180,headYaw:mix(-.08,.42,headProgress),terminal:red}
}
function journeyAdvance(progress:number,delta:number,inputTravel:number,height=900){
    const d=clamp(progress)*JOURNEY_REFERENCE_TOTAL,start=JOURNEY_COPY_SPAN+JOURNEY_MASK_SPAN,span=1644+5.4*Math.max(1,height)
    const physical=d<=start?d:start+(d-start)/JOURNEY_REFERENCE_HEAD*span,next=clamp(physical+delta*6400/Math.max(800,inputTravel),0,start+span)
    return(next<=start?next:start+(next-start)/span*JOURNEY_REFERENCE_HEAD)/JOURNEY_REFERENCE_TOTAL
}
function journeyRampAt(ramp:JourneyRamp|undefined,clock:number,fallback:number){
    if(!ramp)return fallback
    const value=ramp.to+(ramp.from-ramp.to)*Math.exp(-Math.max(0,clock-ramp.at)/.5)
    return Math.abs(value-ramp.to)<.0005?ramp.to:clamp(value)
}
function journeyRenderedState(state:SceneState,clock:number,height:number){
    const raw=journeyState(state.progress,height),white=journeyRampAt(state.transition?.white,clock,raw.white),red=journeyRampAt(state.transition?.red,clock,raw.red)
    return{...raw,white,red,bio:1-white,terminal:red,chapter:red>.001?(red<.999?"red-reveal":"terminal"):white>.001&&white<.999?"white-reveal":raw.chapter}
}
function journeySpinAt(plan:JourneySpin|null|undefined,clock:number){
    if(!plan||clock<plan.start)return{running:false,yaw:0,scale:1,queued:0,index:0}
    const elapsed=Math.max(0,(clock-plan.start)/1.1),index=Math.floor(elapsed+1e-9)
    if(index>=plan.turns)return{running:false,yaw:0,scale:1,queued:0,index:plan.turns}
    const t=clamp(elapsed-index);let low=0,high=1,u=t
    // Independent inversion of the source's documented cubic(1,0,.4,1.06).
    for(let i=0;i<22;i++){u=(low+high)/2;const x=3*(1-u)*(1-u)*u+1.2*(1-u)*u*u+u*u*u;if(x<t)low=u;else high=u}
    const eased=3.18*(1-u)*u*u+u*u*u
    return{running:true,yaw:eased*Math.PI*2,scale:1-.17*Math.sin(Math.PI*t),queued:Math.max(0,plan.turns-index-1),index}
}
function journeyQueueSpin(plan:JourneySpin|null,clock:number):JourneySpin{
    const state=journeySpinAt(plan,clock)
    return !state.running?{start:clock,turns:1}:state.queued>=4?plan!:{start:plan!.start,turns:plan!.turns+1}
}
function journeyFrameMetadata(state:SceneState,clock:number,height:number){
    const scene=journeyRenderedState(state,clock,height),spin=journeySpinAt(state.headSpin,clock)
    return{"data-journey-progress":state.progress,"data-journey-chapter":scene.chapter,"data-journey-time":state.frozenTime??clock-state.clockOffset,"data-journey-clock":clock,"data-journey-scene-key":JSON.stringify(state),"data-journey-reference":"HERO-014","data-journey-geometry":"actual-source-qem25+actual-source-head","data-journey-copy-travel":scene.copyTravel,"data-journey-mask-progress":scene.white,"data-journey-head-travel":scene.headTravel,"data-journey-head-span":scene.headSpan,"data-journey-footer-progress":scene.red,"data-journey-head-spin":spin.running?"running":"rest","data-journey-head-scale":spin.scale,"data-journey-head-turns-queued":spin.queued}
}
function virtualDelta(progress:number,delta:number,travel:number){return clamp(progress+clamp(delta,-1600,1600)/Math.max(800,travel))}
function virtualKey(progress:number,key:string,shift=false){if(key==="Home")return 0;if(key==="End")return 1;if(key==="ArrowDown"||key==="ArrowRight")return clamp(progress+.035);if(key==="ArrowUp"||key==="ArrowLeft")return clamp(progress-.035);if(key==="PageDown"||key===" ")return clamp(progress+(shift?-.11:.11));if(key==="PageUp")return clamp(progress-.11);return null}
const JOURNEY_VERTEX=`
attribute vec3 a_position;attribute vec3 a_normal;uniform mat3 u_rotation;uniform vec2 u_view;uniform vec2 u_center;uniform float u_flip;varying vec3 v_normal;varying vec3 v_position;
void main(){vec3 p=a_position-vec3(0.,.5,0.);v_position=a_position;v_normal=u_rotation*a_normal;p=u_rotation*p;gl_Position=vec4(p.xy*u_view*u_flip+u_center,-p.z*.3,1.);}`
// Independently authored multi-scale tear, raster fringe and glass-edge fit.
// The source's many-canvas displacement stack is not imported or reproduced byte-for-byte.
const JOURNEY_MASK=`
float hash(float x){return fract(sin(x*127.1)*43758.5453);}
float edge(float a,vec2 uv){float active=sin(clamp(a,0.,1.)*3.14159265);float x=uv.x;return mix(-.10,1.10,a)+active*(.026*sin(x*39.+sin(x*13.)*2.)+.011*sin(x*113.)+.006*(hash(floor(x*311.))-.5));}
float reveal(float a,vec2 uv){return step(uv.y,edge(a,uv));}
`
const JOURNEY_FRAGMENT=`
precision highp float;varying vec3 v_normal;varying vec3 v_position;uniform vec2 u_resolution;uniform vec2 u_logical;uniform float u_white;uniform float u_red;uniform float u_time;uniform float u_pitch;uniform float u_intensity;uniform float u_head;uniform float u_mini;
`+JOURNEY_MASK+`
void main(){vec2 uv=gl_FragCoord.xy/u_resolution,css=uv*u_logical;float white=reveal(u_white,uv),red=reveal(u_red,uv);if(u_mini>1.5){if(white<.5)discard;gl_FragColor=vec4(0.,0.,0.,1.);return;}if(u_mini>.5){gl_FragColor=vec4(1.);return;}if(u_head<.5&&white>.5)discard;if(u_head>.5&&white<.5)discard;vec3 n=normalize(v_normal);vec3 color;if(u_head<.5){float stripe=.42+.58*step(.45,fract(css.y/max(.7,u_pitch*.55)));float light=.25+.65*max(0.,dot(n,normalize(vec3(-.3,.5,1.))));float row=mod(floor(css.y/max(.7,u_pitch*.66)),3.);vec3 channel=vec3(row<.5?1.:.18,row>.5&&row<1.5?1.:.20,row>1.5?1.:.20);color=channel*light*stripe*u_intensity;}else{float contour=pow(1.-abs(n.z),7.)*.12;float dots=step(.78,fract(css.y/max(1.,u_pitch)))*.014;color=vec3(1.-contour-dots);}color*=mix(vec3(1.),vec3(1.,0.,0.),red);float frost=exp(-abs(uv.y-edge(u_white,uv))*55.)*sin(u_white*3.14159265);color=mix(color,vec3(.8,.86,.9),frost*.25);gl_FragColor=vec4(clamp(color,0.,1.),1.);}`
const JOURNEY_BG_VERTEX=`attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`
const JOURNEY_BG_FRAGMENT=`
precision highp float;varying vec2 v_uv;uniform vec2 u_logical;uniform float u_white;uniform float u_red;uniform float u_time;uniform float u_pitch;uniform float u_headTravel;
`+JOURNEY_MASK+`
float box(vec2 p,vec2 b){vec2 d=abs(p)-b;return max(d.x,d.y);}mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
void main(){vec2 uv=v_uv,css=uv*u_logical;float white=reveal(u_white,uv),red=reveal(u_red,uv);float active=sin(u_white*3.14159265),nearEdge=exp(-abs(uv.y-edge(u_white,uv))*48.)*active;vec2 lens=uv+vec2(sin(uv.y*23.),cos(uv.x*19.))*nearEdge*.009;vec3 channels=vec3(reveal(u_white,lens+vec2(0.,.003*active)),reveal(u_white,lens),reveal(u_white,lens-vec2(0.,.003*active)));vec3 color=mix(vec3(.012),vec3(.955),channels);float terrain=sin(uv.x*12.+sin(uv.x*21.)*.9)+sin(uv.x*28.-uv.y*17.)*.34;float map=1.-smoothstep(.03,.07,uv.y-(.18+terrain*.13));float dots=step(.76,fract(css.x/2.6))*step(.76,fract(css.y/2.6));color=mix(color,white>.5?vec3(0.):vec3(.06,.10,.14),map*dots);float raster=hash(floor(css.y/2.)+floor(u_time*12.));color+=nearEdge*(raster-.5)*.12;vec2 p=(uv-vec2(.5,.60))*u_logical;float angle=-.42+u_headTravel*.00025;float bar=step(box(rot(angle)*p,vec2(u_logical.x*.31,u_logical.y*.075)),0.);vec2 q=(uv-vec2(.45,.72))*u_logical;bar=max(bar,step(box(rot(angle)*q,vec2(u_logical.x*.043,u_logical.y*.21)),0.));float cross=white*(1.-smoothstep(1500.,2400.,u_headTravel));color=mix(color,vec3(1.,0.,0.),bar*cross);color*=mix(vec3(1.),vec3(1.,0.,0.),red);gl_FragColor=vec4(clamp(color,0.,1.),1.);}`
function journeyRotation(yaw:number,pitch=0){const c=Math.cos(yaw),s=Math.sin(yaw),a=Math.cos(pitch),b=Math.sin(pitch);return new Float32Array([c,s*b,-s*a,0,a,b,s,-c*b,c*a])}
interface GPUChunk{position:WebGLBuffer;normal:WebGLBuffer;index:WebGLBuffer;count:number}
function meshChunks(mesh:JourneyMesh){const chunks:{positions:Float32Array;normals:Float32Array;indices:Uint16Array}[]=[],map=new Map<number,number>();let positions:number[]=[],normals:number[]=[],indices:number[]=[];const flush=()=>{if(!indices.length)return;chunks.push({positions:new Float32Array(positions),normals:new Float32Array(normals),indices:new Uint16Array(indices)});map.clear();positions=[];normals=[];indices=[]};for(let i=0;i<mesh.indices.length;i+=3){const tri=[mesh.indices[i],mesh.indices[i+1],mesh.indices[i+2]],extra=tri.filter(x=>!map.has(x)).length;if(map.size+extra>65535)flush();for(const source of tri){let local=map.get(source);if(local===undefined){local=map.size;map.set(source,local);positions.push(...mesh.positions.subarray(source*3,source*3+3));normals.push(...mesh.normals.subarray(source*3,source*3+3))}indices.push(local)}}flush();return chunks}
function createRenderer(canvas:HTMLCanvasElement,initial:Settings,notify:(status:Status,error?:string)=>void,resumeTime=initial.stillTime){
    const context=canvas.getContext("webgl",{alpha:false,antialias:false,powerPreference:"low-power"});if(!context)throw Error("WebGL is unavailable");const gl:WebGLRenderingContext=context
    let settings=initial,width=1,height=1,bw=1,bh=1,clock=resumeTime,lost=false,disposed=false,mouse:[number,number]=[0,0],body:GPUChunk[]=[],head:GPUChunk[]=[],background:WebGLProgram|undefined,surface:WebGLProgram|undefined,quad:WebGLBuffer|undefined
    const programs:WebGLProgram[]=[],buffers:WebGLBuffer[]=[],locations=new Map<WebGLProgram,Map<string,WebGLUniformLocation|null>>()
    function release(){programs.forEach(x=>gl.deleteProgram(x));buffers.forEach(x=>gl.deleteBuffer(x));programs.length=0;buffers.length=0;locations.clear();body=[];head=[];background=surface=undefined;quad=undefined}
    function compile(kind:number,source:string){const s=gl.createShader(kind);if(!s)throw Error("Shader unavailable");gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(error||"Journey shader error")}return s}
    function program(vertex:string,fragment:string){const v=compile(gl.VERTEX_SHADER,vertex);let f:WebGLShader|undefined,p:WebGLProgram|undefined;try{f=compile(gl.FRAGMENT_SHADER,fragment);p=gl.createProgram()??undefined;if(!p)throw Error("Program unavailable");gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p)||"Journey link error");programs.push(p);return p}catch(e){if(p)gl.deleteProgram(p);throw e}finally{gl.deleteShader(v);if(f)gl.deleteShader(f)}}
    function buffer(data:Float32Array|Uint16Array,target:number){const b=gl.createBuffer();if(!b)throw Error("Geometry buffer unavailable");buffers.push(b);gl.bindBuffer(target,b);gl.bufferData(target,data,gl.STATIC_DRAW);return b}
    function upload(mesh:JourneyMesh){return meshChunks(mesh).map(c=>({position:buffer(c.positions,gl.ARRAY_BUFFER),normal:buffer(c.normals,gl.ARRAY_BUFFER),index:buffer(c.indices,gl.ELEMENT_ARRAY_BUFFER),count:c.indices.length}))}
    function allocate(){try{background=program(JOURNEY_BG_VERTEX,JOURNEY_BG_FRAGMENT);surface=program(JOURNEY_VERTEX,JOURNEY_FRAGMENT);quad=buffer(new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.ARRAY_BUFFER);const meshes=getJourneyMeshes();body=upload(meshes[0]);head=upload(meshes[1])}catch(e){release();throw e}}
    function uniform(p:WebGLProgram,name:string){let m=locations.get(p);if(!m){m=new Map();locations.set(p,m)}if(!m.has(name))m.set(name,gl.getUniformLocation(p,name));return m.get(name)??null}
    function one(p:WebGLProgram,name:string,v:number){const l=uniform(p,name);if(l!==null)gl.uniform1f(l,v)}function two(p:WebGLProgram,name:string,a:number,b:number){const l=uniform(p,name);if(l!==null)gl.uniform2f(l,a,b)}
    function attribute(p:WebGLProgram,name:string,b:WebGLBuffer,size:number){const l=gl.getAttribLocation(p,name);if(l<0)return;gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,0,0)}
    function resize(){width=Math.max(1,settings.renderWidth??canvas.clientWidth??960);height=Math.max(1,settings.renderHeight??canvas.clientHeight??720);let w=Math.max(1,Math.floor(settings.managedBufferWidth??width)),h=Math.max(1,Math.floor(settings.managedBufferHeight??height));const budget=Math.max(1,settings.pixelBudget??2000000);if(w*h>budget){const r=Math.sqrt(budget/(w*h));w=Math.max(1,Math.floor(w*r));h=Math.max(1,Math.min(Math.floor(budget/w),Math.floor(h*r)))}bw=w;bh=h;if(canvas.width!==w||canvas.height!==h){canvas.width=canvas.height=1;canvas.width=w;canvas.height=h}}
    function draw(){if(disposed||lost||!background||!surface||!quad)return;const p=clamp(settings.sceneState.progress),scene=journeyRenderedState(settings.sceneState,clock,height),time=settings.sceneState.frozenTime??clock-settings.sceneState.clockOffset,spin=journeySpinAt(settings.sceneState.headSpin,clock)
        gl.viewport(0,0,bw,bh);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);gl.depthMask(true);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(background);attribute(background,"a_position",quad,2);two(background,"u_logical",width,height);one(background,"u_white",scene.white);one(background,"u_red",scene.red);one(background,"u_time",time);one(background,"u_pitch",settings.rasterPitch);one(background,"u_headTravel",scene.headTravel);gl.drawArrays(gl.TRIANGLE_STRIP,0,4)
        gl.useProgram(surface);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);two(surface,"u_resolution",bw,bh);two(surface,"u_logical",width,height);one(surface,"u_white",scene.white);one(surface,"u_red",scene.red);one(surface,"u_time",time);one(surface,"u_pitch",settings.rasterPitch);one(surface,"u_intensity",settings.intensity);one(surface,"u_mini",0)
        const meshProgram=surface
        const model=(chunks:GPUChunk[],isHead:boolean,yaw:number,fit:number,centerY:number,flip=1)=>{one(meshProgram,"u_head",isHead?1:0);one(meshProgram,"u_flip",flip);two(meshProgram,"u_view",fit*2/width,fit*2/height);two(meshProgram,"u_center",0,1-centerY*2);const rot=uniform(meshProgram,"u_rotation");if(rot!==null)gl.uniformMatrix3fv(rot,false,journeyRotation(yaw+mouse[0]*settings.pointerStrength,mouse[1]*settings.pointerStrength*.3));for(const c of chunks){attribute(meshProgram,"a_position",c.position,3);attribute(meshProgram,"a_normal",c.normal,3);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,c.index);gl.drawElements(gl.TRIANGLES,c.count,gl.UNSIGNED_SHORT,0)}}
        const idle=time*4*Math.PI/180
        if(scene.white<1)model(body,false,scene.bodyYaw+idle,height*.49,.50)
        if(scene.white>0){const fit=Math.min(height*.95,width*1.2);model(head,true,scene.headYaw+idle+spin.yaw,fit*spin.scale,.16+fit/(2*height))}
        if(scene.white<1){gl.disable(gl.DEPTH_TEST);gl.viewport(0,Math.floor(bh*.79),Math.floor(bw*.23),Math.floor(bh*.20));one(surface,"u_mini",1);model(body,false,scene.bodyYaw+idle,height*.30,.50)}
        if(scene.white>0&&scene.red<1){
            gl.disable(gl.DEPTH_TEST);one(surface,"u_mini",2)
            const stripY=.5*height-scene.headTravel,scale=Math.min(1,width/700),x=width*.646316+101*scale,y=stripY+1579*scale,originX=width*.504158,originY=824.5*scale
            for(const [xx,yy,flip]of [[x,y,1],[2*originX-x-32*scale,stripY+2*originY-1643*scale,-1]])if(yy<height&&yy+64*scale>0){gl.viewport(Math.round(xx/width*bw),Math.round((height-yy-64*scale)/height*bh),Math.max(1,Math.round(32*scale/width*bw)),Math.max(1,Math.round(64*scale/height*bh)));model(body,false,idle+scene.headTravel*.06*Math.PI/180,height*.92,.5,flip)}
        }
        gl.viewport(0,0,bw,bh);gl.flush();for(const n of[canvas,settings.colorHost])if(n)for(const[k,v]of Object.entries(journeyFrameMetadata(settings.sceneState,clock,height)))n.setAttribute(k,String(v))
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






function publishJourneyFrame(e:StudyEntry|null){if(!e?.hasFrame||e.frameKey!==e.contentKey)return false;for(const[k,v]of Object.entries(journeyFrameMetadata(e.settings.sceneState,e.framePhase,e.logicalHeight)))e.display.setAttribute(k,String(v));return true}


const JOURNEY_SVG_0="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTEiIGhlaWdodD0iMjUzIiB2aWV3Qm94PSIwIDAgOTEgMjUzIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNNi4wODk4OWUtMDYgMjQuMzEwOUM2LjY3MjFlLTA2IDEwLjk5MTcgMTAuNjYgLTMuNTExNzdlLTA2IDIzLjUzIC0yLjk0OTIxZS0wNkw2Ny42IC0xLjAyMjg1ZS0wNkM4MC42IC00LjU0NTk5ZS0wNyA5MSAxMC45OTE3IDkxIDI0LjMxMUw5MSAzNS4xNzMzQzkxIDQ4LjYyMTkgODAuNiA1OS40ODQyIDY3LjYgNTkuNDg0MkwyMy41MyA1OS40ODQyQzEwLjY2IDU5LjQ4NDIgNS4wMjcyM2UtMDYgNDguNjIxOSA1LjYxNTA4ZS0wNiAzNS4xNzMzTDYuMDg5ODllLTA2IDI0LjMxMDlaTTIzLjUzIDEyLjgwMkMxNy44MSAxMi44MDIgMTMuMTMgMTguMTAzOSAxMy4xMyAyNC4zMTA5TDEzLjEzIDM1LjE3MzNDMTMuMTMgMzYuODU0NCAxMy41MiAzOC41MzU0IDE0LjE3IDM5Ljk1NzlMNTguNjMgMTIuODAyTDIzLjUzIDEyLjgwMlpNNzYuMDUgMTcuNDU3M0wyOC4wOCA0Ni42ODIyTDY3LjYgNDYuNjgyMkM3My40NSA0Ni42ODIyIDc4IDQxLjYzOSA3OCAzNS4xNzMzTDc4IDI0LjMxMUM3OCAyMS43MjQ3IDc3LjIyIDE5LjM5NyA3Ni4wNSAxNy40NTczWiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTMuMTc1MTFlLTA2IDkwLjk5MzNDMy43NTczMmUtMDYgNzcuNjc0IDEwLjY2IDY2LjY4MjQgMjMuNTMgNjYuNjgyNEw2Ny42IDY2LjY4MjRDODAuNiA2Ni42ODI0IDkxIDc3LjY3NCA5MSA5MC45OTMzTDkxIDEwMS44NTZDOTEgMTE1LjMwNCA4MC42IDEyNi4xNjcgNjcuNiAxMjYuMTY3TDIzLjUzIDEyNi4xNjdDMTAuNjYgMTI2LjE2NyAyLjExMjQ1ZS0wNiAxMTUuMzA0IDIuNzAwMzFlLTA2IDEwMS44NTZMMy4xNzUxMWUtMDYgOTAuOTkzM1pNMjMuNTMgNzkuNDg0NEMxNy44MSA3OS40ODQ0IDEzLjEzIDg0Ljc4NjMgMTMuMTMgOTAuOTkzM0wxMy4xMyAxMDEuODU2QzEzLjEzIDEwMy41MzcgMTMuNTIgMTA1LjIxOCAxNC4xNyAxMDYuNjRMNTguNjMgNzkuNDg0NEwyMy41MyA3OS40ODQ0Wk03Ni4wNSA4NC4xMzk3TDI4LjA4IDExMy4zNjVMNjcuNiAxMTMuMzY1QzczLjQ1IDExMy4zNjUgNzggMTA4LjMyMSA3OCAxMDEuODU2TDc4IDkwLjk5MzNDNzggODguNDA3IDc3LjIyIDg2LjA3OTQgNzYuMDUgODQuMTM5N1oiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0zLjkwMzQzZS0wNyAxNTQuNzAxQzkuNDk5MzhlLTA3IDE0MS44OTkgMTAuNCAxMzEuNDI1IDIzLjQgMTMxLjQyNUwyNy45NSAxMzEuNDI1TDI3Ljk1IDE0NC4zNTZMMjMuNCAxNDQuMzU2QzE3LjY4IDE0NC4zNTYgMTMgMTQ5LjAxMiAxMyAxNTQuNzAxTDEzIDE2NS4wNDdDMTMgMTcwLjg2NiAxNy41NSAxNzUuMzkyIDIzLjQgMTc1LjM5MkwyOS45IDE3NS4zOTJDMzUuNzUgMTc1LjM5MiA0MC4zIDE3MC44NjYgNDAuMyAxNjUuMDQ3TDQwLjMgMTU1Ljk5NUw1My4zIDE1NS45OTVMNTMuMyAxNjUuMDQ3QzUzLjMgMTcwLjg2NiA1Ny44NSAxNzUuMzkyIDYzLjcgMTc1LjM5Mkw2Ny42IDE3NS4zOTJDNzMuNDUgMTc1LjM5MiA3OCAxNzAuODY2IDc4IDE2NS4wNDdMNzggMTU0LjcwMUM3OCAxNDkuMDEyIDczLjMyIDE0NC4zNTYgNjcuNiAxNDQuMzU2TDYzLjA1IDE0NC4zNTZMNjMuMDUgMTMxLjQyNUw2Ny42IDEzMS40MjVDODAuNiAxMzEuNDI1IDkxIDE0MS44OTkgOTEgMTU0LjcwMUw5MSAxNjUuMDQ3QzkxIDE3Ny45NzggODAuNiAxODguMzIzIDY3LjYgMTg4LjMyM0w2My43IDE4OC4zMjNDNTcuMDcgMTg4LjMyMyA1MS4wOSAxODUuNjA3IDQ2LjggMTgxLjIxMUM0Mi41MSAxODUuNjA3IDM2LjUzIDE4OC4zMjMgMjkuOSAxODguMzIzTDIzLjQgMTg4LjMyM0MxMC40IDE4OC4zMjMgLTYuMjcxMDNlLTA3IDE3Ny45NzggLTYuMTg1NTRlLTA4IDE2NS4wNDdMMy45MDM0M2UtMDcgMTU0LjcwMVoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik05MSAyMjkuNzI0QzkxIDI0Mi41MjYgODAuNiAyNTMgNjcuNiAyNTNMMjMuNCAyNTNDMTAuNCAyNTMgLTMuNDU0MjJlLTA2IDI0Mi42NTUgLTIuODg4OThlLTA2IDIyOS43MjRMLTIuNDM2NzhlLTA2IDIxOS4zNzhDLTEuODcxNTNlLTA2IDIwNi40NDcgMTAuNCAxOTYuMTAyIDIzLjQgMTk2LjEwMkwyNy4zIDE5Ni4xMDJMMjcuMyAyMDkuMDMzTDIzLjQgMjA5LjAzM0MxNy41NSAyMDkuMDMzIDEzIDIxMy41NTkgMTMgMjE5LjM3OEwxMyAyMjkuNzI0QzEzIDIzNS41NDMgMTcuNTUgMjQwLjA2OSAyMy40IDI0MC4wNjlMNDAuNTYgMjQwLjA2OUwzMy4yOCAyMjkuMzM2TDMzLjI4IDIxOS4zNzhDMzMuMjggMjA2LjU3NiA0My42OCAxOTYuMTAyIDU2LjY4IDE5Ni4xMDJMNjcuNiAxOTYuMTAyQzgwLjYgMTk2LjEwMiA5MSAyMDYuNDQ3IDkxIDIxOS4zNzhMOTEgMjI5LjcyNFpNNTYuNjggMjA5LjAzM0M1MC45NiAyMDkuMDMzIDQ2LjI4IDIxMy42ODkgNDYuMjggMjE5LjM3OEw0Ni4yOCAyMjUuMzI3TDU2LjI5IDI0MC4wNjlMNjcuNiAyNDAuMDY5QzczLjMyIDI0MC4wNjkgNzggMjM1LjQxMyA3OCAyMjkuNzI0TDc4IDIxOS4zNzhDNzggMjEzLjU1OSA3My40NSAyMDkuMDMzIDY3LjYgMjA5LjAzM0w1Ni42OCAyMDkuMDMzWiIgZmlsbD0iYmxhY2siLz4KPC9zdmc+Cg=="
const JOURNEY_SVG_1="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNyIgaGVpZ2h0PSI3IiB2aWV3Qm94PSIwIDAgNyA3IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNNyAzLjA1OTc5ZS0wN0g0LjgxMjVWN0g3VjMuMDU5NzllLTA3WiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTcgMi4xODc1VjMuMDU5NzllLTA3TDAgMFYyLjE4NzVMNyAyLjE4NzVaIiBmaWxsPSJibGFjayIvPgo8L3N2Zz4K"
const JOURNEY_SVG_2="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTciIGhlaWdodD0iNDIiIHZpZXdCb3g9IjAgMCA1NyA0MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTU2LjUgMC41VjQxLjVIMC41VjkuMTcyODVMMy45NTQxIDQuODEwNTVMNy4zNjYyMSAwLjVINTYuNVoiIHN0cm9rZT0iYmxhY2siLz4KPHBhdGggZD0iTTU1IDIwLjk4MjFDNTUgMjIuMDg3NiA1NC4xOCAyMyA1My4xOSAyM0g0OS44QzQ4LjggMjMgNDggMjIuMDg3NiA0OCAyMC45ODIxTDQ4IDIwLjA4MDVDNDggMTguOTY0MiA0OC44IDE4LjA2MjYgNDkuOCAxOC4wNjI2SDUzLjE5QzU0LjE4IDE4LjA2MjYgNTUgMTguOTY0MiA1NSAyMC4wODA1VjIwLjk4MjFaTTUzLjE5IDIxLjkzNzRDNTMuNjMgMjEuOTM3NCA1My45OSAyMS40OTczIDUzLjk5IDIwLjk4MjFWMjAuMDgwNUM1My45OSAxOS45NDA5IDUzLjk2IDE5LjgwMTQgNTMuOTEgMTkuNjgzM0w1MC40OSAyMS45Mzc0SDUzLjE5Wk00OS4xNSAyMS41NTFMNTIuODQgMTkuMTI1Mkg0OS44QzQ5LjM1IDE5LjEyNTIgNDkgMTkuNTQzOCA0OSAyMC4wODA1VjIwLjk4MjFDNDkgMjEuMTk2OCA0OS4wNiAyMS4zOSA0OS4xNSAyMS41NTFaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNNTUgMTUuNDQ3MkM1NSAxNi41NTI3IDU0LjE4IDE3LjQ2NTEgNTMuMTkgMTcuNDY1MUg0OS44QzQ4LjggMTcuNDY1MSA0OCAxNi41NTI3IDQ4IDE1LjQ0NzJMNDggMTQuNTQ1NkM0OCAxMy40MjkzIDQ4LjggMTIuNTI3NyA0OS44IDEyLjUyNzdINTMuMTlDNTQuMTggMTIuNTI3NyA1NSAxMy40MjkzIDU1IDE0LjU0NTZWMTUuNDQ3MlpNNTMuMTkgMTYuNDAyNUM1My42MyAxNi40MDI1IDUzLjk5IDE1Ljk2MjQgNTMuOTkgMTUuNDQ3MlYxNC41NDU2QzUzLjk5IDE0LjQwNiA1My45NiAxNC4yNjY1IDUzLjkxIDE0LjE0ODRMNTAuNDkgMTYuNDAyNUg1My4xOVpNNDkuMTUgMTYuMDE2MUw1Mi44NCAxMy41OTAzSDQ5LjhDNDkuMzUgMTMuNTkwMyA0OSAxNC4wMDg5IDQ5IDE0LjU0NTZWMTUuNDQ3MkM0OSAxNS42NjE5IDQ5LjA2IDE1Ljg1NTEgNDkuMTUgMTYuMDE2MVoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik01NSAxMC4xNTkyQzU1IDExLjIyMTggNTQuMiAxMi4wOTEyIDUzLjIgMTIuMDkxMkg1Mi44NVYxMS4wMTc4SDUzLjJDNTMuNjQgMTEuMDE3OCA1NCAxMC42MzE0IDU0IDEwLjE1OTJMNTQgOS4zMDA0OEM1NCA4LjgxNzQ3IDUzLjY1IDguNDQxOCA1My4yIDguNDQxOEg1Mi43QzUyLjI1IDguNDQxOCA1MS45IDguODE3NDcgNTEuOSA5LjMwMDQ4TDUxLjkgMTAuMDUxOEg1MC45TDUwLjkgOS4zMDA0OEM1MC45IDguODE3NDcgNTAuNTUgOC40NDE4IDUwLjEgOC40NDE4SDQ5LjhDNDkuMzUgOC40NDE4IDQ5IDguODE3NDcgNDkgOS4zMDA0OFYxMC4xNTkyQzQ5IDEwLjYzMTQgNDkuMzYgMTEuMDE3OSA0OS44IDExLjAxNzhINTAuMTVWMTIuMDkxMkg0OS44QzQ4LjggMTIuMDkxMiA0OCAxMS4yMjE4IDQ4IDEwLjE1OTJMNDggOS4zMDA0OEM0OCA4LjIyNzEzIDQ4LjggNy4zNjg0NSA0OS44IDcuMzY4NDVINTAuMUM1MC42MSA3LjM2ODQ1IDUxLjA3IDcuNTkzODUgNTEuNCA3Ljk1ODc5QzUxLjczIDcuNTkzODUgNTIuMTkgNy4zNjg0NSA1Mi43IDcuMzY4NDVINTMuMkM1NC4yIDcuMzY4NDUgNTUgOC4yMjcxMyA1NSA5LjMwMDQ4TDU1IDEwLjE1OTJaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNNDggMy45MzIwNEM0OCAyLjg2OTQyIDQ4LjggMiA0OS44IDJMNTMuMiAyQzU0LjIgMiA1NSAyLjg1ODY4IDU1IDMuOTMyMDRWNC43OTA3MkM1NSA1Ljg2NDA3IDU0LjIgNi43MjI3NiA1My4yIDYuNzIyNzZINTIuOVY1LjY0OTRINTMuMkM1My42NSA1LjY0OTQgNTQgNS4yNzM3MyA1NCA0Ljc5MDcyVjMuOTMyMDRDNTQgMy40NDkwMyA1My42NSAzLjA3MzM1IDUzLjIgMy4wNzMzNUg1MS44OEw1Mi40NCAzLjk2NDI0VjQuNzkwNzJDNTIuNDQgNS44NTMzNCA1MS42NCA2LjcyMjc2IDUwLjY0IDYuNzIyNzZINDkuOEM0OC44IDYuNzIyNzYgNDggNS44NjQwNyA0OCA0Ljc5MDcyTDQ4IDMuOTMyMDRaTTUwLjY0IDUuNjQ5NEM1MS4wOCA1LjY0OTQgNTEuNDQgNS4yNjMgNTEuNDQgNC43OTA3MlY0LjI5Njk4TDUwLjY3IDMuMDczMzVINDkuOEM0OS4zNiAzLjA3MzM1IDQ5IDMuNDU5NzYgNDkgMy45MzIwNFY0Ljc5MDcyQzQ5IDUuMjczNzMgNDkuMzUgNS42NDk0IDQ5LjggNS42NDk0TDUwLjY0IDUuNjQ5NFoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0yNC40NTkgMjAuMTY1QzI1LjA2ODEgMTkuNTU1OSAyNS44OTQyIDE5LjIxMzcgMjYuNzU1NiAxOS4yMTM3SDQxVjI0LjQ3MTFIMjcuODMwM0MyNy40ODMyIDI0LjQ3MTEgMjcuMTUwNiAyNC42MSAyNi45MDY2IDI0Ljg1NjhMMjYuMzg0NiAyNS4zODQ2TDI1LjcyMiAyNi4wMjk3QzI1LjQ3MDggMjYuMjc0MyAyNS4zMjkxIDI2LjYxIDI1LjMyOTEgMjYuOTYwNlY0MEgyMC4yMTM3VjI1Ljc1NTZDMjAuMjEzNyAyNC44OTQyIDIwLjU1NTkgMjQuMDY4MSAyMS4xNjUgMjMuNDU5TDI0LjQ1OSAyMC4xNjVaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMTkuNTQxIDIxLjgzNUMxOC45MzE5IDIyLjQ0NDEgMTguMTA1OCAyMi43ODYzIDE3LjI0NDQgMjIuNzg2M0gzVjE3LjUyODlIMTYuMTY5N0MxNi41MTY4IDE3LjUyODkgMTYuODQ5NCAxNy4zOSAxNy4wOTM0IDE3LjE0MzJMMTcuNjE1NCAxNi42MTU0TDE4LjI3OCAxNS45NzAzQzE4LjUyOTIgMTUuNzI1NyAxOC42NzA5IDE1LjM5IDE4LjY3MDkgMTUuMDM5NFYyTDIzLjc4NjMgMlYxNi4yNDQ0QzIzLjc4NjMgMTcuMTA1OCAyMy40NDQxIDE3LjkzMTkgMjIuODM1IDE4LjU0MUwxOS41NDEgMjEuODM1WiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTU1IDI1SDUzLjc1VjI5SDU1VjI1WiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTU1IDI2LjI1VjI1TDUxIDI1VjI2LjI1TDU1IDI2LjI1WiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTQ4IDQwSDQ5LjI1VjM2SDQ4VjQwWiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTQ4IDM4Ljc1VjQwTDUyIDQwVjM4Ljc1TDQ4IDM4Ljc1WiIgZmlsbD0iYmxhY2siLz4KPC9zdmc+Cg=="
const JOURNEY_STRIP_PARTS=[{"kind":"t","style":{"left":"calc(55.1842% - 13.5px - 16px)","top":"835px","width":"16px","textAlign":"right"},"lines":["000"]},{"kind":"t","style":{"left":"49.6316%","top":"872px","width":"8px"},"lines":["//"]},{"kind":"t","style":{"left":"calc(55.1842% - 13.5px - 71px)","top":"872px","width":"71px","textAlign":"right"},"lines":["364DAYS"]},{"kind":"t","style":{"left":"calc(55.1842% + 13.5px)","top":"872px","width":"71px"},"lines":["BOLD","DISTINCTIVE","FUNCTIONAL","CLEVER","UNEXPECTED","CHARACTERFUL","EXPERIMENTAL","SHARP","BOLD","DISTINCTIVE","FUNCTIONAL","BOLD","DISTINCTIVE","FUNCTIONAL","CLEVER","UNEXPECTED","CHARACTERFUL","EXPERIMENTAL","SHARP","BOLD","DISTINCTIVE","FUNCTIONAL","CHARACTERFUL","EXPERIMENTAL","SHARP","BOLD","DISTINCTIVE","FUNCTIONAL","FUNCTIONAL"]},{"kind":"t","style":{"left":"49.6316%","top":"1025px","width":"5px"},"lines":["1"]},{"kind":"t","style":{"left":"calc(55.1842% - 13.5px - 71px)","top":"1025px","width":"71px","textAlign":"right"},"lines":["BOLD","DISTINCTIVE","FUNCTIONAL","CLEVER","UNEXPECTED","CHARACTERFUL","EXPERIMENTAL","SHARP","BOLD","DISTINCTIVE","FUNCTIONAL"]},{"kind":"t","style":{"left":"34.7368%","top":"1025px","width":"16px"},"lines":["000"]},{"kind":"t","style":{"left":"35.8421%","top":"1025px","width":"71px","textAlign":"right"},"lines":["BOLD","DISTINCTIVE"]},{"kind":"t","style":{"left":"44.1579%","top":"1025px","width":"8px"},"lines":["//"]},{"kind":"t","style":{"left":"64.6316%","top":"1025px","width":"70px"},"lines":["NON-FUNCTIONAL","DESIGN"]},{"kind":"t","style":{"left":"49.6316%","top":"1198px","width":"6px"},"lines":["2"]},{"kind":"t","style":{"left":"calc(55.1842% - 13.5px - 71px)","top":"1198px","width":"71px","textAlign":"right"},"lines":["MYSTERY OF LIFE"]},{"kind":"slash","style":{"left":"34.7368%","top":"1198px","width":"81px","height":"77px"},"lines":[]},{"kind":"t","style":{"left":"calc(55.1842% + 13.5px)","top":"1244px","width":"16px"},"lines":["002"]},{"kind":"bc","style":{"left":"calc(55.1842% + 13.5px)","top":"1258px","width":"26px","height":"79px"},"lines":[]},{"kind":"t","style":{"left":"41.8947%","top":"1333px","width":"16px"},"lines":["000"]},{"kind":"t","style":{"left":"28.3684%","top":"1333px","width":"70px"},"lines":["ROAMING AROUND"]},{"kind":"t","style":{"left":"calc(55.1842% - 13.5px - 71px)","top":"1333px","width":"71px","textAlign":"right"},"lines":["MYSTERY OF LIFE"]},{"kind":"num","style":{"left":"64.6316%","top":"1390px","width":"133px","height":"253px"},"lines":[]},{"kind":"t","style":{"left":"44.1579%","top":"1528px","width":"6px"},"lines":["#"]},{"kind":"t","style":{"left":"44.6842%","top":"1528px","width":"15px"},"lines":["N/A"]},{"kind":"t","style":{"left":"calc(55.1842% - 13.5px - 71px)","top":"1528px","width":"71px","textAlign":"right"},"lines":["BOLD","DISTINCTIVE","FUNCTIONAL","CLEVER","UNEXPECTED","CHARACTERFUL","EXPERIMENTAL","SHARP","BOLD","DISTINCTIVE","FUNCTIONAL"]},{"kind":"t","style":{"left":"calc(55.1842% + 13.5px)","top":"1528px","width":"16px"},"lines":["666"]},{"kind":"brk","style":{"left":"calc(55.1842% + 13.5px)","top":"1556px","width":"103px","height":"50px"},"lines":[]},{"kind":"t","style":{"left":"57.2632%","top":"1573px","width":"50px"},"lines":["EXPERIMENT","0039"]},{"kind":"t","style":{"left":"59.7368%","top":"1628px","width":"30px"},"lines":["GET OUT"]},{"kind":"t","style":{"left":"59.7895%","top":"1639px","width":"29px"},"lines":["PLEASE"]},{"kind":"dots","style":{"left":"calc(55.1842% + 13.5px)","top":"1630px","width":"6px","height":"13px"},"lines":[]},{"kind":"mark","style":{"left":"calc(55.1842% - 13.5px - 57px)","top":"972px","width":"57px","height":"42px"},"lines":[]}]
const JOURNEY_WORD_COLUMNS=[
["BOLD","DISTINCTIVE","FUNCTIONAL","CURIOUS","PRECISE","EXPERIMENTAL","CLEAR","RESTLESS","INTUITIVE","CONSIDERED","RADICAL","OPEN","EXPRESSIVE","INTENTIONAL","DYNAMIC","INVENTIVE","ORIGINAL","DECISIVE","UNEXPECTED","SHARP","PLAYFUL","TACTILE","UNCONVENTIONAL","MEMORABLE","RAW","CURATED","COMPOSED","INSTINCTIVE","RESOLUTE","DIRECT","LAYERED","UNAPOLOGETIC","ATTENTIVE","RESOURCEFUL","ALIVE"],
["FEARLESS","OBSERVANT","METICULOUS","SINGULAR","EXPLORATORY","ADAPTABLE","EMOTIONAL","CONCEPTUAL","CANDID","BRUTAL","CURIOUS","SPONTANEOUS","ARTICULATE","CULTURAL","CHARACTERFUL","ICONIC","DISRUPTIVE","IMPACTFUL","ECCENTRIC","PLAYFUL","RUTHLESS","PURPOSEFUL","RELENTLESS","REBELLIOUS","DEFIANT","PRECISE","RECKLESS","UNCOMPROMISING","UNCONTROLLED","VOLATILE","VIVID","QUIET","FLEXIBLE","FERAL","HUMAN"]]
function journeyClip(progress:number,white=false){
    const a=clamp(progress),points=Array.from({length:25},(_,i)=>{const x=i/24,noise=Math.sin(Math.floor(x*311)*127.1)*43758.5453,tear=Math.sin(Math.PI*a)*(.026*Math.sin(x*39+Math.sin(x*13)*2)+.011*Math.sin(x*113)+.006*(noise-Math.floor(noise)-.5));return(x*100).toFixed(3)+"% "+(clamp(1-(-.1+1.2*a+tear))*100).toFixed(3)+"%"})
    return"polygon("+(white?[...points,"100% 100%","0% 100%"]:["0% 0%","100% 0%",...points.reverse()]).join(",")+")"
}
function journeyCopyEdges(yaw:number,width:number,height:number){
    const bins=Array.from({length:64},()=>[width/2,width/2]),mesh=getJourneyMeshes()[0],c=Math.cos(yaw),sn=Math.sin(yaw),fit=height*.49
    for(let i=0;i<mesh.positions.length;i+=9){const x=width/2+(c*mesh.positions[i]+sn*mesh.positions[i+2])*fit,y=height/2-(mesh.positions[i+1]-.5)*fit,k=Math.floor(y/height*64);if(k>=0&&k<64){bins[k][0]=Math.min(bins[k][0],x);bins[k][1]=Math.max(bins[k][1],x)}}
    return bins
}
function JourneyStrip({top,width,mono}:{top:number;width:number;mono:React.CSSProperties}){
    const scale=Math.min(1,width/700)
    return <div data-journey-ui="source-strip" style={{position:"absolute",left:0,top,width:"100%",height:1644*scale}}><div style={{position:"absolute",left:0,top:0,width:width/scale,height:1644,transform:`scale(${scale})`,transformOrigin:"0 0",...mono,fontSize:10,lineHeight:"11px",color:"#393939"}}>{[true,false].map(flipped=><div key={String(flipped)} data-journey-strip-copy={flipped?"flipped":"upright"} style={{position:"absolute",inset:0,transform:flipped?"rotate(180deg)":undefined,transformOrigin:"50.4158% 824.5px"}}>{JOURNEY_STRIP_PARTS.map((part,i)=>{const css={position:"absolute",...part.style} as React.CSSProperties;return <div key={i} data-journey-strip-part={i} style={{...css,whiteSpace:"nowrap",fontSize:part.kind==="slash"?64:undefined,lineHeight:part.kind==="slash"?.9:undefined,background:part.kind==="bc"?"repeating-linear-gradient(to bottom,currentColor 0 2px,transparent 2px 4px,currentColor 4px 5px,transparent 5px 9px,currentColor 9px 12px,transparent 12px 14px)":undefined,display:part.kind==="num"?"flex":undefined,alignItems:part.kind==="num"?"flex-end":undefined,gap:part.kind==="num"?10:undefined}}>{part.kind==="t"?part.lines.map((line,j)=><div key={j} style={{height:11}}>{line}</div>):part.kind==="slash"?"//":part.kind==="num"?<><img src={JOURNEY_SVG_0} width={91} height={253} alt=""/><span data-journey-strip-figure="" style={{width:32,height:64}}/></>:part.kind==="mark"?<img src={JOURNEY_SVG_2} width={57} height={42} alt=""/>:part.kind==="brk"?[0,1,2,3].map(k=><img key={k} src={JOURNEY_SVG_1} width={7} height={7} alt="" style={{position:"absolute",right:k<2?0:undefined,left:k>=2?0:undefined,top:k===0||k===3?0:undefined,bottom:k===1||k===2?0:undefined,transform:`rotate(${k*90}deg)`}}/>):part.kind==="dots"?[0,1,2].map(k=><i key={k} style={{display:"block",width:3,height:3,marginBottom:2,background:"currentColor"}}/>):null}</div>})}</div>)}</div></div>
}


function JourneySurface(props:Props){
    const{animate=true,canvasMotion=false,speed=1,posterProgress=0,startProgress=0,inputEnabled=true,inputTravel=6400,rasterPitch=1.2,intensity=1,pointerStrength=0,biographyText=DEFAULT_BIOGRAPHY,showInterface=true,showPlayback=true,style}=props
    const target=RenderTarget.current(),staticRenderer=useIsStaticRenderer(),canvasPreview=canvasMotion&&target===RenderTarget.canvas,isStatic=target===RenderTarget.export||target===RenderTarget.thumbnail||(staticRenderer&&!canvasPreview)||(target===RenderTarget.canvas&&!canvasPreview)
    const root=React.useRef<HTMLDivElement>(null),footerBand=React.useRef<HTMLDivElement>(null),footerActions=React.useRef<HTMLDivElement>(null),transitionRef=React.useRef<JourneyTransition|null>(null),transitionRunning=React.useRef(false),canvas=React.useRef<HTMLCanvasElement>(null),hudX=React.useRef<HTMLSpanElement>(null),hudY=React.useRef<HTMLSpanElement>(null),value=React.useRef(clamp(startProgress)),pending=React.useRef<number|null>(null),settle=React.useRef<ReturnType<typeof setTimeout>|null>(null),touch=React.useRef<{id:number;y:number;startY:number;mouse:boolean}|null>(null),lastCommit=React.useRef(0),dragged=React.useRef(false),spin=React.useRef<{plan:JourneySpin|null;running:boolean}>({plan:null,running:false})
    const[progress,setProgress]=React.useState(value.current),[gesture,setGesture]=React.useState(false),[paused,setPaused]=React.useState(false),[frozen,setFrozen]=React.useState(0),[offset,setOffset]=React.useState(0),[status,setStatus]=React.useState<Status>("offscreen"),[error,setError]=React.useState(""),[reduced,setReduced]=React.useState(false),[viewport,setViewport]=React.useState({width:1280,height:720}),[headSpin,setHeadSpin]=React.useState<JourneySpin|null>(null),[spinning,setSpinning]=React.useState(false),[copyStarted,setCopyStarted]=React.useState(false),[transition,setTransition]=React.useState<JourneyTransition|null>(null),[transitionActive,setTransitionActive]=React.useState(false)
    const readTime=()=>Number(canvas.current?.getAttribute("data-journey-time")??0),readClock=()=>Number(canvas.current?.getAttribute("data-journey-clock")??0)
    React.useEffect(()=>{value.current=clamp(startProgress);setProgress(value.current);transitionRef.current=null;transitionRunning.current=false;setTransition(null);setTransitionActive(false)},[startProgress])
    React.useEffect(()=>{const media=window.matchMedia("(prefers-reduced-motion: reduce)"),update=()=>setReduced(media.matches);update();media.addEventListener("change",update);return()=>media.removeEventListener("change",update)},[])
    React.useLayoutEffect(()=>{const node=root.current;if(!node)return;const measure=()=>{const width=Math.max(1,node.clientWidth),height=Math.max(1,node.clientHeight);setViewport(old=>old.width===width&&old.height===height?old:{width,height})};measure();const observer=new ResizeObserver(measure);observer.observe(node);return()=>observer.disconnect()},[target])
    const inputAllowed=inputEnabled&&!isStatic&&target!==RenderTarget.canvas
    const navigate=(next:number)=>{if(!inputAllowed)return;if(animate&&speed>0&&!reduced){const clock=readClock(),old=transitionRef.current,desired=journeyState(next,viewport.height),white=Number(canvas.current?.getAttribute("data-journey-mask-progress")??scene.white),red=Number(canvas.current?.getAttribute("data-journey-footer-progress")??scene.red);if(!old||old.white.to!==desired.white||old.red.to!==desired.red){const plan={white:old?.white.to===desired.white?old.white:{from:white,to:desired.white,at:clock},red:old?.red.to===desired.red?old.red:{from:red,to:desired.red,at:clock}};transitionRef.current=plan;transitionRunning.current=true;setTransition(plan);setTransitionActive(true)}}value.current=Math.round(clamp(next)*100000)/100000;setCopyStarted(true);setGesture(true);if(settle.current)clearTimeout(settle.current);settle.current=setTimeout(()=>{settle.current=null;setGesture(false)},220);if(pending.current===null){const commit=(now:number)=>{if(now-lastCommit.current<1000/30){pending.current=requestAnimationFrame(commit);return}pending.current=null;lastCommit.current=now;setProgress(value.current)};pending.current=requestAnimationFrame(commit)}}
    React.useEffect(()=>{const node=root.current;if(!node||!inputAllowed)return;const wheel=(e:WheelEvent)=>{if(e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)*1.5)return;if(e.cancelable)e.preventDefault();const unit=e.deltaMode===1?16:e.deltaMode===2?node.clientHeight:1;navigate(journeyAdvance(value.current,e.deltaY*unit,inputTravel,viewport.height))};node.addEventListener("wheel",wheel,{passive:false});return()=>node.removeEventListener("wheel",wheel)},[inputAllowed,inputTravel,viewport.height,animate,speed,reduced])
    React.useEffect(()=>()=>{if(pending.current!==null)cancelAnimationFrame(pending.current);if(settle.current)clearTimeout(settle.current);pending.current=null;settle.current=null},[])
    React.useEffect(()=>{if(isStatic||reduced||!animate||speed<=0){spin.current={plan:null,running:false};setHeadSpin(null);setSpinning(false);transitionRef.current=null;transitionRunning.current=false;setTransition(null);setTransitionActive(false)}},[isStatic,reduced,animate,speed])
    const chosenProgress=isStatic||target===RenderTarget.canvas?clamp(posterProgress):progress,scene=journeyState(chosenProgress,viewport.height),ambientFrozen=isStatic||reduced?0:!animate||speed<=0?readTime():paused?frozen:null
    const sceneState:SceneState={progress:chosenProgress,frozenTime:ambientFrozen,clockOffset:offset,headSpin:inputAllowed&&!reduced?headSpin:null,transition:inputAllowed&&!reduced?transition:null}
    const settings:Settings={mode:"unbelievablycrapJourney",artworkRevision:JOURNEY_ARTWORK_REVISION,animate:(!paused&&animate&&speed>0)||gesture||spinning||transitionActive,static:isStatic,canvasPreview,speed:gesture||spinning||transitionActive?Math.max(.001,speed):Math.max(0,speed),stillTime:0,interactive:pointerStrength>0&&!reduced,primary:"#ffffff",secondary:"#000000",ink:"#000000",sceneState,rasterPitch:Math.max(.7,Math.min(4,rasterPitch)),intensity:Math.max(.35,Math.min(1.5,intensity)),pointerStrength:Math.max(0,Math.min(.7,pointerStrength))}
    const request=useStudySurface(root,canvas,settings,target,"SourceHeroJourneyStudy.tsx",(s,e)=>{setStatus(s);setError(e??"")})
    React.useLayoutEffect(()=>{const host=canvas.current;if(!host||typeof MutationObserver==="undefined")return;const sync=()=>{const entry=request.getEntry();publishJourneyFrame(entry);const white=Number(host.getAttribute("data-journey-mask-progress")),red=Number(host.getAttribute("data-journey-footer-progress"));if(root.current&&Number.isFinite(white)&&Number.isFinite(red)){root.current.style.setProperty("--journey-copy-clip",journeyClip(white));root.current.style.setProperty("--journey-white-clip",journeyClip(white,true));root.current.style.setProperty("--journey-red-clip",journeyClip(red,true));root.current.style.setProperty("--journey-bar-shift",String(smooth(.3,1,red)*110)+"%");const active=inputAllowed&&red>.9?"auto":"none";if(footerBand.current)footerBand.current.style.pointerEvents=active;if(footerActions.current)footerActions.current.style.pointerEvents=active}if(entry?.hasFrame&&entry.frameKey===entry.contentKey){if(spin.current.running&&!journeySpinAt(spin.current.plan,entry.framePhase).running){spin.current.running=false;setSpinning(false)}const plan=transitionRef.current;if(transitionRunning.current&&plan&&journeyRampAt(plan.white,entry.framePhase,plan.white.to)===plan.white.to&&journeyRampAt(plan.red,entry.framePhase,plan.red.to)===plan.red.to){transitionRunning.current=false;setTransitionActive(false)}}},observer=new MutationObserver(sync);observer.observe(host,{attributes:true,attributeFilter:["data-study-state","data-study-frame-width","data-study-frame-height"]});sync();return()=>observer.disconnect()},[target,inputAllowed])
    const toggle=()=>{if(paused){setOffset(readClock()-frozen);setPaused(false);request()}else{setFrozen(readTime());setPaused(true)}}
    const turnHead=()=>{if(!inputAllowed||reduced||!animate||speed<=0||Number(canvas.current?.getAttribute("data-journey-mask-progress")??scene.white)<.5||Number(canvas.current?.getAttribute("data-journey-footer-progress")??scene.red)>=.9)return;const plan=journeyQueueSpin(spin.current.plan,readClock());spin.current={plan,running:true};setHeadSpin(plan);setSpinning(true);request()}
    const color=scene.red>.5||scene.white>.5?"#111111":"#f0f0ed",mono:React.CSSProperties={fontFamily:'"PP Supply Mono","IBM Plex Mono",ui-monospace,monospace',fontSize:"clamp(6px,1.15cqh,10px)",lineHeight:1.2,letterSpacing:"-.04em"},condensed:React.CSSProperties={fontFamily:'"PP Supply Sans","Arial Narrow",Arial,sans-serif',fontStretch:"condensed",fontWeight:500,letterSpacing:"-.04em"},lines=biographyText.split(/\n+/).map(x=>x.trim()).filter(Boolean),copyEdges=journeyCopyEdges(scene.bodyYaw,viewport.width,viewport.height),introMotion=animate&&!reduced&&!isStatic&&copyStarted,phoneScale=Math.min(1,viewport.width/700),columnTop=viewport.height*.5-202.5*phoneScale+.7*viewport.height+1644-scene.headTravel,footerSize=Math.min(128,Math.max(36,viewport.width*.12)),bandTop=10+footerSize*2.3+64,bandHeight=170*Math.min(1,viewport.width/900)
    return <div ref={root} role="group" tabIndex={inputAllowed?0:undefined} aria-label="Unbelievably Crap / credited source journey" aria-description="Wheel or drag moves the virtual story. Arrow keys, Home and End navigate. In the white scene click or press Enter to turn the head once. Pause holds ambient motion; requested head turns remain available." onKeyDown={e=>{if(!inputAllowed||e.target!==e.currentTarget)return;if(e.key==="Enter"){e.preventDefault();turnHead();return}if(e.key==="Home"||e.key==="End"){e.preventDefault();navigate(e.key==="Home"?0:1);return}const amount=e.key==="ArrowDown"||e.key==="ArrowRight"?60:e.key==="ArrowUp"||e.key==="ArrowLeft"?-60:e.key==="PageDown"||e.key===" "?viewport.height*.8*(e.shiftKey?-1:1):e.key==="PageUp"?-viewport.height*.8:0;if(amount){e.preventDefault();navigate(journeyAdvance(value.current,amount,inputTravel,viewport.height))}}} onClick={e=>{if(dragged.current||e.defaultPrevented||(e.target as Element).closest?.("a,button,input,textarea,select,[contenteditable=true]"))return;turnHead()}} onPointerDown={e=>{dragged.current=false;if(!inputAllowed||(e.target as Element).closest?.("a,button,input,textarea,select,[contenteditable=true]")||(e.pointerType==="mouse"&&scene.white>.5))return;touch.current={id:e.pointerId,y:e.clientY,startY:e.clientY,mouse:e.pointerType==="mouse"};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMoveCapture={e=>{const box=e.currentTarget.getBoundingClientRect();if(hudX.current)hudX.current.textContent="X "+Math.round(clamp(e.clientX-box.left,0,box.width));if(hudY.current)hudY.current.textContent="Y "+Math.round(clamp(e.clientY-box.top,0,box.height));if(!touch.current||touch.current.id!==e.pointerId)return;e.stopPropagation();const delta=touch.current.y-e.clientY;if(Math.abs(e.clientY-touch.current.startY)>6)dragged.current=true;touch.current.y=e.clientY;navigate(journeyAdvance(value.current,delta*(touch.current.mouse?.2:2.4),inputTravel,viewport.height))}} onPointerUp={e=>{if(touch.current?.id===e.pointerId){touch.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}}} onPointerCancel={e=>{touch.current=null;dragged.current=true;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}} style={{width:"100%",height:"100%",...style,position:"relative",overflow:"hidden",background:"#030303",containerType:"size",touchAction:inputAllowed?"none":"pan-y",outlineOffset:-2,color} as React.CSSProperties & {containerType?:"size"}}>
        <style>{"@keyframes monarchicJourneyResolve{from{opacity:0;filter:blur(4px)}to{opacity:1;filter:blur(0)}}"}</style>
        <canvas ref={canvas} role="img" aria-label="Actual source scan geometry, raster material and reversible story scenes" style={{display:"block",width:"100%",height:"100%"}}/>
        <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
            {showInterface&&<>
                <div style={{...mono,position:"absolute",left:".8%",top:"21.5%",width:"22%",opacity:1-scene.white}}><span><span ref={hudX}>X 000</span></span><span style={{float:"right"}}><span ref={hudY}>Y 000</span></span><div style={{marginTop:6,display:"flex",justifyContent:"space-between"}}><span>ENEMY DETECTED</span><span>I AM WATCHING YOU</span></div></div>
                <div style={{...mono,position:"absolute",left:".8%",top:"64%",opacity:1-scene.white}}>ENEMY DETECTED<br/>PROTOCOL 00039<br/>2026 / ETERNITY</div>
                <div style={{...mono,position:"absolute",right:".8%",top:"1.5%",width:"22%",padding:3,background:"rgba(150,150,150,.16)",textAlign:"right",opacity:1-scene.white}}>UI/UX DESIGNER / CONCEPTUALIST</div>
                <div data-journey-ui="awards" style={{...mono,position:"absolute",right:".8%",top:"7.4%",width:"max(15.1%, 120px)",fontSize:"clamp(5px,min(1cqh,1.5cqw),9px)",lineHeight:1.75,opacity:1-scene.white}}>{["AWWWARDS HONORABLE MENTION","AWWWARDS PRODUCT HONORS","CSS DESIGN AWARD","CSSDA INNOVATION","CSSDA UI","CSSDA UX","OPETRON SITE OF THE DAY","OPETRON SOTD","FWA SOTD","18 / IN TOTAL"].map((label,i)=><div key={label} style={{opacity:.72-i*.045,whiteSpace:"nowrap"}}>{label}</div>)}</div>
                <div style={{...mono,position:"absolute",left:".8%",top:"1%",opacity:scene.white}}>DIGITAL DESIGNER<br/>ART DIRECTION<br/>ANIMATION<br/>CREATIVE DEVELOPMENT</div>
                <div style={{...mono,position:"absolute",right:".8%",top:"1%",textAlign:"right",opacity:scene.white}}>ART DIRECTION<br/>ANIMATION<br/>CREATIVE DEVELOPMENT</div>
                <div data-journey-ui="scroll-hud" style={{...mono,position:"absolute",left:".8%",right:".8%",bottom:"6%",display:"flex",justifyContent:"space-between"}}><span>000</span><span>100 / {scene.chapter.toUpperCase()}</span><span>SCROLL</span></div>
            </>}
            <div data-journey-ui="copy-mask" style={{position:"absolute",inset:0,clipPath:"var(--journey-copy-clip,"+journeyClip(scene.white)+")"}}><div data-journey-copy-lines="124" style={{...condensed,fontSize:viewport.width<700?6:10,lineHeight:"9.47px",position:"absolute",top:viewport.height-scene.copyTravel,left:0,right:0,height:1174}}>{Array.from({length:124},(_,i)=>{const y=viewport.height-scene.copyTravel+i*9.47,edges=copyEdges[Math.max(0,Math.min(63,Math.floor(y/viewport.height*64)))],left=i%2===0,edge=left?Math.max(40,edges[0]-22):Math.min(viewport.width-40,edges[1]+22);return <div key={i} data-journey-copy-line={i} style={{position:"absolute",top:i*9.47,left:left?0:edge,width:left?edge:viewport.width-edge,textAlign:left?"right":"left",whiteSpace:"nowrap",overflow:"hidden",animation:introMotion?`monarchicJourneyResolve 1600ms linear ${i*14}ms both`:undefined,animationPlayState:paused?"paused":"running"}}>{lines[i%Math.max(1,lines.length)]}</div>})}</div></div>
            <div data-journey-ui="white-story" style={{position:"absolute",inset:0,clipPath:"var(--journey-white-clip,"+journeyClip(scene.white,true)+")",color:"#393939"}}>
                <JourneyStrip top={.5*viewport.height-scene.headTravel} width={viewport.width} mono={{...mono,...condensed}}/>
                <div data-journey-ui="head-columns" style={{...condensed,position:"absolute",left:"50%",top:columnTop,width:226,display:"flex",gap:64,fontSize:10,lineHeight:"11px",transform:`translateX(-50%) scale(${phoneScale})`,transformOrigin:"top center"}}>{JOURNEY_WORD_COLUMNS.map((words,col)=><div key={col} data-journey-column-rows="35" style={{width:col===0?91:71,flexShrink:0,textAlign:col===0?"left":"right"}}><div style={{marginBottom:12}}>+</div>{words.map((word,i)=><div key={i} style={{height:11,whiteSpace:"nowrap"}}>{word}</div>)}</div>)}<svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" style={{position:"absolute",top:160,left:101,transform:`rotateY(${(ambientFrozen??readTime())*4}deg)`}}><path d="M8 0h4v8h8v4h-8v8H8v-8H0V8h8Z" fill="currentColor"/></svg></div>
                {["A DIFFERENT WAY THROUGH.","BUILT TO CHANGE.","ONE MORE QUESTION. / ANOTHER VIEW."].map((text,i)=>{let y=(1.8+i*1.25)*viewport.height+1644-scene.headTravel;if(i===2)y=Math.max(.3*viewport.height,y);return <div key={i} data-journey-caption={i} style={{...condensed,position:"absolute",top:y,left:i===2?"2%":"28%",right:i===2?"2%":"28%",textAlign:"center",fontWeight:700,color:"#e8271c",fontSize:Math.max(30,128*viewport.width/1920),lineHeight:.75,opacity:1-clamp(scene.red/.55)}}>{text}</div>})}
            </div>
            <div data-journey-ui="footer" style={{position:"absolute",inset:0,clipPath:"var(--journey-red-clip,"+journeyClip(scene.red,true)+")",color:"#080808"}}>
                <div style={{...condensed,fontSize:footerSize,fontWeight:700,lineHeight:.796875,letterSpacing:"-.04em",textAlign:"center",position:"absolute",top:10,left:0,right:0}}>FIND YOUR<br/>WAY OUT OF<br/>HERE</div>
                <div ref={footerBand} data-journey-ui="footer-band" style={{position:"absolute",left:10,right:10,top:bandTop,height:bandHeight,pointerEvents:"none"}}><svg aria-hidden="true" width="100%" height="100%" viewBox="0 0 1899 170" preserveAspectRatio="none"><path fillRule="evenodd" clipRule="evenodd" d="M1899 170H0V0H1899V170ZM1888.79 45.9326C1887.1 16.6971 1465.11 10.2641 946.237 31.5645C427.371 52.8647 8.11372 93.8319 9.79785 123.067C11.4853 152.303 433.48 158.736 952.349 137.436C1471.22 116.135 1890.47 75.1681 1888.79 45.9326Z" fill="#030303"/></svg><nav aria-label="Source footer navigation" style={{...mono,position:"absolute",top:7,left:"11.1111%",display:"flex",gap:16,color:"#ff0000"}}>{[["INDEX","/"],["WORK","/work"],["GALLERY","/gallery"],["404","/404"]].map(([label,url])=><a key={label} href={"https://www.unbelievablycrap.com"+url} target="_blank" rel="noreferrer" style={{color:"inherit"}}>{label}+</a>)}</nav></div>
                <div ref={footerActions} style={{...mono,position:"absolute",pointerEvents:"none",left:10,right:10,top:bandTop+bandHeight+6,display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}><a href="https://www.linkedin.com/in/liubomyr-ulytskyi-4426971a9/" target="_blank" rel="noreferrer" style={{background:"#080808",color:"#ff0000",padding:3,pointerEvents:scene.red>.9?"auto":"none"}}>LINKEDIN / SOURCE CREATOR ↗</a><span style={{background:"#080808",color:"#ff0000",padding:3}}>DON'T CONTACT ME</span></div>
                <div style={{...mono,position:"absolute",left:"1%",top:"72%"}}>0039 / PROJECT / STILL HERE</div>
                <div style={{...mono,position:"absolute",left:"52%",top:"72%",width:"24%"}}>A VISUAL PRACTICE IN MOTION.<br/><br/>FORM, TYPE AND TIMING<br/>SHARE THE SAME SPACE.<br/><br/>THE IMAGE KEEPS CHANGING.</div>
                <div style={{...mono,position:"absolute",left:"16%",top:"84%",width:"25%"}}>A DIFFERENT POINT OF VIEW.<br/>THE WORK CONTINUES.</div>
            </div>
        </div>
        {showInterface&&<nav aria-label="Original source navigation" style={{...mono,position:"absolute",bottom:0,left:0,right:0,height:"clamp(20px,3.8cqh,30px)",display:"flex",alignItems:"center",gap:"1.2%",padding:"0 .8%",background:"#383838",color:"#eeeeeb",transform:`translateY(var(--journey-bar-shift,${smooth(.3,1,scene.red)*110}%))`}}><a href="https://www.unbelievablycrap.com/" target="_blank" rel="noreferrer" style={{color:"inherit"}}>INDEX+</a><a href="https://www.unbelievablycrap.com/work" target="_blank" rel="noreferrer" style={{color:"inherit"}}>WORK+</a><a href="https://www.unbelievablycrap.com/gallery" target="_blank" rel="noreferrer" style={{color:"inherit"}}>GALLERY+</a><a href="https://www.unbelievablycrap.com/404" target="_blank" rel="noreferrer" style={{color:"inherit"}}>ERROR+</a><span style={{marginLeft:"auto"}}>GMT+2</span></nav>}
        {showPlayback&&!isStatic&&<button data-journey-ui="playback" onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()} onClick={toggle} disabled={reduced||!animate||speed<=0} aria-pressed={paused} style={{...mono,position:"absolute",right:10,bottom:showInterface?"12%":10,border:"1px solid currentColor",background:"transparent",color,padding:"4px 7px",cursor:"pointer"}}>{reduced?"REDUCED MOTION":paused?"PLAY":"PAUSE"}</button>}
        {(error||status==="recovering")&&<div role="status" style={{...mono,position:"absolute",top:"45%",left:"10%",right:"10%",textAlign:"center"}}>Restoring source geometry…</div>}
    </div>
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1280
 * @framerIntrinsicHeight 720
 */
export default function SourceHeroJourneyStudy(props:Props){return <JourneySurface key={JOURNEY_ARTWORK_REVISION} {...props}/>}
const DEFAULT_BIOGRAPHY="A VISUAL PRACTICE IN MOTION.\nAN IMAGE CAN CHANGE THE QUESTION.\nFORM, TYPE AND TIMING SHARE THE SAME SPACE.\nTHE DETAIL INVITES A CLOSER LOOK.\nA DIFFERENT POINT OF VIEW.\nTHE WORK CONTINUES BEYOND THE FIRST FRAME.\nRESEARCHING THE LIMITS OF THE IMAGE.\nWHAT REMAINS WHEN THE FRAME CHANGES?\nA THOUGHT BECOMES A MOVING FORM.\nLOOK AGAIN."
addPropertyControls(SourceHeroJourneyStudy,{
    animate:{type:ControlType.Boolean,title:"Animate",defaultValue:true},canvasMotion:{type:ControlType.Boolean,title:"Canvas motion",defaultValue:false},speed:{type:ControlType.Number,title:"Speed",min:0,max:2,step:.05,defaultValue:1},posterProgress:{type:ControlType.Number,title:"Poster scene",min:0,max:1,step:.01,defaultValue:0},startProgress:{type:ControlType.Number,title:"Start scene",min:0,max:1,step:.01,defaultValue:0},inputEnabled:{type:ControlType.Boolean,title:"Story input",defaultValue:true},inputTravel:{type:ControlType.Number,title:"Input travel",min:800,max:16000,step:100,defaultValue:6400},rasterPitch:{type:ControlType.Number,title:"Raster pitch",min:.7,max:4,step:.1,defaultValue:1.2},intensity:{type:ControlType.Number,title:"Intensity",min:.35,max:1.5,step:.05,defaultValue:1},pointerStrength:{type:ControlType.Number,title:"Pointer amount",min:0,max:.7,step:.01,defaultValue:0},biographyText:{type:ControlType.String,title:"Body text",displayTextArea:true,defaultValue:DEFAULT_BIOGRAPHY},showInterface:{type:ControlType.Boolean,title:"Source interface",defaultValue:true},showPlayback:{type:ControlType.Boolean,title:"Playback",defaultValue:true},
})
