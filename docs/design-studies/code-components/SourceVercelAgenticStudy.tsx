import * as React from "react"
import type {ComponentType} from "react"
import {addPropertyControls,ControlType,RenderTarget,useIsStaticRenderer} from "framer"
// SOURCE INSPIRATION / HERO-009 / Vercel / https://vercel.com/
// Current original Agentic Infrastructure hero, inspected2026-11-01.
// Independent fitted light/brush renderer; no original website JavaScript reused.
// Native title, navigation, CTAs, narrative rows and following content stay editable.
type Mode="vercelLight"
type Capability="none"|"coding"|"shipping"|"automation"
type Status="waiting"|"running"|"paused"|"static"|"reduced-motion"|"offscreen"|"recovering"
type BrushPoint=[number,number,number]
interface SceneState{rgbEnabled:boolean;capability:Capability;brushes:BrushPoint[];frozenTime:number|null;clockOffset:number}
interface Props{animate?:boolean;canvasMotion?:boolean;speed?:number;stillTime?:number;artworkScale?:number;pointerEnabled?:boolean;rgbEnabled?:boolean;capability?:Capability;brushRadius?:number;brushStrength?:number;background?:string;showPlayback?:boolean;style?:React.CSSProperties}
interface Settings{mode:Mode;artworkRevision?:string;animate:boolean;static:boolean;canvasPreview:boolean;speed:number;stillTime:number;interactive:boolean;primary:string;secondary:string;ink:string;sceneState:SceneState;artworkScale:number;brushRadius:number;brushStrength:number;managed?:boolean;renderWidth?:number;renderHeight?:number;managedBufferWidth?:number;managedBufferHeight?:number;pixelBudget?:number;colorHost?:HTMLCanvasElement}
const MAX_VERCEL_BRUSH=16
function vercelClamp(n:number,a=0,b=1){return Math.max(a,Math.min(b,Number.isFinite(n)?n:a))}
function vercelTriangle(width:number,height:number,scale=1){const phone=width<700,unit=Math.min(width/(phone?390:1080),height/(phone?400:720))*scale*(phone?170/192:1),cx=width*.5,cy=height*(phone?176.5/400:333/720);return[[cx,cy-83*unit],[cx-96*unit,cy+83*unit],[cx+96*unit,cy+83*unit]]}
function vercelHit(x:number,y:number,width:number,height:number,scale=1){const points=vercelTriangle(width,height,scale);return points.every((a,i)=>{const b=points[(i+1)%3];return(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0])<=1e-7})}
const VERCEL_VERTEX=`attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0.,1.);}`
function vercelFragment(capacity:number){return `precision highp float;
uniform vec2 u_resolution,u_cssResolution;
uniform vec4 u_scene;
uniform vec2 u_brushControl;
uniform vec3 u_background;
uniform vec4 u_points[`+capacity+`];
float segment(vec2 p,vec2 a,vec2 b){vec2 d=b-a;float t=clamp(dot(p-a,d)/max(dot(d,d),.0001),0.,1.);return length(p-a-d*t);}
float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*vec3(.1031,.103,.0973));q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){
 vec2 pixel=vec2(gl_FragCoord.x/u_resolution.x,1.-gl_FragCoord.y/u_resolution.y)*u_cssResolution;
 float phone=1.-step(700.,u_cssResolution.x);
 float unit=max(.0001,min(u_cssResolution.x/mix(1080.,390.,phone),u_cssResolution.y/mix(720.,400.,phone))*u_scene.x*mix(1.,170./192.,phone));
 vec2 p=(pixel-vec2(u_cssResolution.x*.5,u_cssResolution.y*mix(333./720.,176.5/400.,phone)))/unit;
 vec2 a=vec2(0.,-83.),b=vec2(-96.,83.),c=vec2(96.,83.);
 float dl=segment(p,a,b),db=segment(p,b,c),dr=segment(p,c,a),edge=min(dl,min(db,dr));
 bool inside=(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x)<=0.&&(c.x-b.x)*(p.y-b.y)-(c.y-b.y)*(p.x-b.x)<=0.&&(a.x-c.x)*(p.y-c.y)-(a.y-c.y)*(p.x-c.x)<=0.;
 float sd=inside?-edge:edge,aa=max(u_cssResolution.x/u_resolution.x,u_cssResolution.y/u_resolution.y)/unit;
 float outside=smoothstep(-aa*.55,aa*.55,sd);
 float upperRim=.021*exp(-dl*dl/550.)+.022*exp(-dr*dr/550.);
 float bottomShadow=.25*exp(-pow((p.y-87.)/15.,2.))*exp(-pow(p.x/100.,8.));
 float lowerShadow=.095*exp(-pow((p.y-98.)/24.,2.)-pow(p.x/101.,4.));
 vec3 color=u_background+vec3(upperRim-bottomShadow-lowerShadow);
 float painted=0.,brush=0.;vec2 previous=vec2(0.);float previousAge=100.;
 for(int i=0;i<`+capacity+`;i++){if(float(i)>=u_brushControl.x)break;vec4 point=u_points[i];vec2 location=point.xy*u_cssResolution;float age=mod(u_scene.y-point.z+64.,64.);float fade=exp(-age*.35)*(1.-smoothstep(5.,8.,age));painted=max(painted,fade);float d=length(pixel-location);if(i>0&&previousAge<8.)d=min(d,segment(pixel,previous,location));brush+=exp(-d*d/max(1.,u_scene.w*u_scene.w))*fade;previous=location;previousAge=age;}
 float red=exp(-pow((p.x+65.)/155.,2.)-pow((p.y+55.)/205.,2.));
 float blue=exp(-pow((p.x-87.)/155.,2.)-pow((p.y+50.)/190.,2.));
 float green=exp(-pow((p.x-25.)/145.,2.)-pow((p.y-113.)/90.,2.));
 float yellow=exp(-pow((p.x+76.)/112.,2.)-pow((p.y-91.)/70.,2.));
 vec3 tint=red*vec3(.0,.32,.19+.05*(1.-smoothstep(-30.,90.,p.y)))+blue*vec3(.29,.12,.0)+green*vec3(.27,.0,.11)+yellow*vec3(.02,.02,.24);
 float strength=u_scene.z*min(1.,painted*1.8+brush*.08)*u_brushControl.y;
 float overlap=min(red,blue)/max(.001,max(red,blue));
 float chroma=mix(.68+.32*overlap,1.,smoothstep(10.,80.,p.y));
 vec3 tinted=vec3(1.)-tint*chroma;
 tinted/=max(tinted.r,max(tinted.g,tinted.b));
 float presence=smoothstep(0.,.15,max(red,max(blue,max(green,yellow))));
 color=mix(color,tinted,strength*presence);
 float grain=(hash(pixel*1.73)-.5)*.008*strength;
 gl_FragColor=vec4(clamp((color+grain)*outside,0.,1.),1.);
}`}
function vercelRaster(settings:Settings,width:number,height:number):[number,number]{let w=Math.max(1,Math.floor(settings.managedBufferWidth??width)),h=Math.max(1,Math.floor(settings.managedBufferHeight??height));const budget=Math.max(1,Math.floor(settings.pixelBudget??2000000));if(w*h>budget){const fit=Math.sqrt(budget/(w*h));w=Math.max(1,Math.floor(w*fit));h=Math.max(1,Math.min(Math.floor(budget/w),Math.floor(h*fit)))}return[w,h]}
function vercelActiveBrushes(state:SceneState,time:number,capacity=MAX_VERCEL_BRUSH){return state.brushes.filter(point=>Number.isFinite(point[2])&&time>=point[2]&&time-point[2]<8).slice(-capacity)}
function vercelMetadata(canvas:HTMLCanvasElement,settings:Settings,phase:number,capacity=MAX_VERCEL_BRUSH){const time=settings.sceneState.frozenTime??phase-settings.sceneState.clockOffset;for(const node of[canvas,settings.colorHost])if(node)for(const[k,v]of Object.entries({"data-source-vercel-reference":"HERO-009","data-source-vercel-time":Math.max(0,time),"data-source-vercel-clock":phase,"data-source-vercel-rgb":settings.sceneState.rgbEnabled,"data-source-vercel-capability":settings.sceneState.capability,"data-source-vercel-brushes":vercelActiveBrushes(settings.sceneState,Math.max(0,time),capacity).length,"data-source-vercel-brush-capacity":capacity,"data-source-vercel-orientation":"upright-fixed"}))node.setAttribute(k,String(v))}
function createRenderer(canvas:HTMLCanvasElement,initial:Settings,notify:(status:Status,error?:string)=>void,resumeTime=initial.stillTime){const context=canvas.getContext("webgl",{alpha:false,antialias:false,powerPreference:"low-power"});if(!context)throw Error("WebGL is unavailable.");const gl:WebGLRenderingContext=context;let settings=initial,phase=resumeTime,disposed=false,lost=false,width=1,height=1,bw=1,bh=1,program:WebGLProgram|null=null,quad:WebGLBuffer|null=null;const capacity=Math.min(MAX_VERCEL_BRUSH,Math.max(4,Math.floor(Number(gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS))||32)-8)),locations=new Map<string,WebGLUniformLocation|null>();
 function location(name:string){if(!locations.has(name))locations.set(name,gl.getUniformLocation(program!,name));return locations.get(name)??null}
 function release(){if(quad)gl.deleteBuffer(quad);if(program)gl.deleteProgram(program);quad=null;program=null;locations.clear()}
 function compile(type:number,text:string){const shader=gl.createShader(type);if(!shader)throw Error("Could not allocate light shader");const precision=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT);gl.shaderSource(shader,precision?.precision?text:text.replace("precision highp float","precision mediump float"));gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(shader)||"Could not compile light shader";gl.deleteShader(shader);throw Error(error)}return shader}
 function allocate(){let vertex:WebGLShader|undefined,fragment:WebGLShader|undefined;try{vertex=compile(gl.VERTEX_SHADER,VERCEL_VERTEX);fragment=compile(gl.FRAGMENT_SHADER,vercelFragment(capacity));program=gl.createProgram();if(!program)throw Error("Could not allocate light program");gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)||"Could not link light program");quad=gl.createBuffer();if(!quad)throw Error("Could not allocate light surface");gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW)}catch(error){release();throw error}finally{if(vertex)gl.deleteShader(vertex);if(fragment)gl.deleteShader(fragment)}}
 function resize(){width=Math.max(1,settings.renderWidth??canvas.clientWidth??576);height=Math.max(1,settings.renderHeight??canvas.clientHeight??400);[bw,bh]=vercelRaster(settings,width,height);if(canvas.width!==bw||canvas.height!==bh){canvas.width=1;canvas.height=1;canvas.width=bw;canvas.height=bh}}
 function renderAt(next:number){if(disposed||lost||!program||!quad)return;phase=next;const time=Math.max(0,settings.sceneState.frozenTime??phase-settings.sceneState.clockOffset),samples=vercelActiveBrushes(settings.sceneState,time,capacity),points=new Float32Array(capacity*4);samples.forEach((p,i)=>{points[i*4]=vercelClamp(p[0]);points[i*4+1]=vercelClamp(p[1]);points[i*4+2]=((p[2]%64)+64)%64;points[i*4+3]=1});gl.viewport(0,0,bw,bh);gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);gl.disable(gl.DITHER);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,quad);const attribute=gl.getAttribLocation(program,"a_position");gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);gl.uniform2f(location("u_resolution"),bw,bh);gl.uniform2f(location("u_cssResolution"),width,height);gl.uniform4f(location("u_scene"),settings.artworkScale,time%64,settings.sceneState.rgbEnabled?1:0,settings.brushRadius);gl.uniform2f(location("u_brushControl"),samples.length,settings.brushStrength);gl.uniform3fv(location("u_background"),rgb(settings.ink,settings.colorHost??canvas));gl.uniform4fv(location("u_points[0]"),points);gl.drawArrays(gl.TRIANGLES,0,6);gl.disableVertexAttribArray(attribute);gl.flush();vercelMetadata(canvas,settings,phase,capacity)}
 const onLost=(event:Event)=>{event.preventDefault();if(disposed||lost)return;lost=true;release();notify("recovering","Restoring source light.")},onRestored=()=>{if(disposed||!lost)return;lost=false;try{allocate();resize();notify("waiting")}catch(error){lost=true;release();notify("recovering",String(error))}};canvas.addEventListener("webglcontextlost",onLost);canvas.addEventListener("webglcontextrestored",onRestored);try{allocate();resize()}catch(error){canvas.removeEventListener("webglcontextlost",onLost);canvas.removeEventListener("webglcontextrestored",onRestored);release();gl.getExtension("WEBGL_lose_context")?.loseContext();throw error}return{update(next:Settings){if(disposed)return;settings=next;resize()},renderAt,resize,setPointer(_x:number,_y:number){},getSnapshot(){return{mode:settings.mode,stillTime:settings.stillTime,time:phase,lost}},dispose(){if(disposed)return;disposed=true;canvas.removeEventListener("webglcontextlost",onLost);canvas.removeEventListener("webglcontextrestored",onRestored);release();gl.getExtension("WEBGL_lose_context")?.loseContext()}}}

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

interface VercelControls { capability: Capability; rgbEnabled: boolean; reduced: boolean; paused: boolean; menuOpen: boolean }
const VERCEL_DEFAULT: VercelControls = Object.freeze({ capability: "none", rgbEnabled: false, reduced: false, paused: false, menuOpen: false })
const VERCEL_CONTROL_SYMBOL = Symbol.for("monarchic.source-vercel-agentic-controls.v1")
const VERCEL_EMPTY_SUBSCRIBE = (_listener: () => void) => () => {}
const VERCEL_SERVER_SNAPSHOT = () => VERCEL_DEFAULT
function getVercelControls() {
    if (typeof window === "undefined") return null
    const registry = window as unknown as Record<symbol, unknown>
    type Store = { get: () => VercelControls; subscribe: (f: () => void) => () => void; patch: (p: Partial<VercelControls>) => void }
    const existing = registry[VERCEL_CONTROL_SYMBOL] as Store | undefined
    if (existing) return existing
    let state = VERCEL_DEFAULT, media: MediaQueryList | null = null
    const listeners = new Set<() => void>()
    const patch = (value: Partial<VercelControls>) => {
        const next = { ...state, ...value }
        if (Object.keys(next).every(k => next[k as keyof VercelControls] === state[k as keyof VercelControls])) return
        state = Object.freeze(next); listeners.forEach(f => f())
    }
    const motion = () => patch({ reduced: media?.matches ?? false })
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") patch({ menuOpen: false }) }
    const store: Store = { get: () => state, patch, subscribe(f) {
        listeners.add(f)
        if (listeners.size === 1) { media = matchMedia("(prefers-reduced-motion: reduce)"); media.addEventListener("change", motion); document.addEventListener("keydown", escape); motion() }
        return () => { listeners.delete(f); if (!listeners.size) { media?.removeEventListener("change", motion); document.removeEventListener("keydown", escape); media = null; state = VERCEL_DEFAULT } }
    } }
    registry[VERCEL_CONTROL_SYMBOL] = store
    return store
}
function useVercelControls(frozen: boolean) { const store = frozen ? null : getVercelControls(); return React.useSyncExternalStore(store?.subscribe ?? VERCEL_EMPTY_SUBSCRIBE, store?.get ?? VERCEL_SERVER_SNAPSHOT, VERCEL_SERVER_SNAPSHOT) }
function vercelFrozen() { const target = RenderTarget.current(); return useIsStaticRenderer() || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail }
function vercelWriteRef<T>(ref: React.ForwardedRef<T>, value: T | null) { if (typeof ref === "function") ref(value); else if (ref) ref.current = value }
interface LayerProps { style?: React.CSSProperties; children?: React.ReactNode; text?: string; [key: string]: unknown }
function vercelForwardEvent(props: LayerProps, name: string, ...args: unknown[]) { const f = props[name]; if (typeof f === "function") f(...args) }
function useVercelNativeActivation(action: () => void, frozen: boolean) {
    const last = React.useRef<{ channel: string; at: number } | null>(null)
    return (channel: string, prevented: boolean) => {
        const at = performance.now(), previous = last.current
        if (previous && previous.channel !== channel && at - previous.at < 350) return
        last.current = { channel, at }
        if (!frozen && !prevented) action()
    }
}
function vercelRow(Component: ComponentType<LayerProps>, capability: Capability): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>(function AgenticRow(props, ref) {
        const frozen = vercelFrozen(), controls = useVercelControls(frozen)
        const activate = useVercelNativeActivation(() => getVercelControls()?.patch({ capability: controls.capability === capability ? "none" : capability }), frozen)
        return <Component {...props} ref={ref} role="button" tabIndex={frozen ? undefined : 0} aria-expanded={controls.capability === capability} onMouseEnter={(e: React.MouseEvent<HTMLElement>) => { vercelForwardEvent(props, "onMouseEnter", e); if (!frozen && !e.defaultPrevented) getVercelControls()?.patch({ capability }) }} onHoverStart={(...args: unknown[]) => { vercelForwardEvent(props, "onHoverStart", ...args); if (!frozen && !(args[0] as {defaultPrevented?: boolean} | undefined)?.defaultPrevented) getVercelControls()?.patch({ capability }) }} onFocus={(e: React.FocusEvent<HTMLElement>) => { vercelForwardEvent(props, "onFocus", e); if (!frozen && !e.defaultPrevented) getVercelControls()?.patch({ capability }) }} onTap={(e: {defaultPrevented?: boolean}) => { vercelForwardEvent(props, "onTap", e); activate("tap", Boolean(e.defaultPrevented)) }} onClick={(e: {defaultPrevented?: boolean}) => { vercelForwardEvent(props, "onClick", e); activate("click", Boolean(e.defaultPrevented)) }} onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => { vercelForwardEvent(props, "onKeyDown", e); if (e.key === "Enter" || e.key === " ") { activate("key", e.defaultPrevented); e.preventDefault() } }} style={{ ...props.style, cursor: frozen ? props.style?.cursor : "pointer" }} />
    })
}
function vercelDetail(Component: ComponentType<LayerProps>, capability: Capability): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>(function AgenticDetail(props, ref) {
        const frozen = vercelFrozen(), controls = useVercelControls(frozen), open = !frozen && controls.capability === capability
        return <Component {...props} ref={ref} aria-hidden={!open} style={{ ...props.style, ...(frozen ? {} : { height: open ? 52 : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: controls.reduced ? "none" : "height 180ms ease, opacity 180ms ease" }) }} />
    })
}
export function withVercelAgenticCodingRow(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return vercelRow(Component, "coding") }
export function withVercelAgenticShippingRow(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return vercelRow(Component, "shipping") }
export function withVercelAgenticAutomationRow(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return vercelRow(Component, "automation") }
export function withVercelAgenticCodingDetail(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return vercelDetail(Component, "coding") }
export function withVercelAgenticShippingDetail(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return vercelDetail(Component, "shipping") }
export function withVercelAgenticAutomationDetail(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return vercelDetail(Component, "automation") }
export function withVercelAgenticNarrative(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>(function AgenticNarrative(props, ref) {
        const frozen = vercelFrozen()
        return <Component {...props} ref={ref} onMouseLeave={(e: React.MouseEvent<HTMLElement>) => { vercelForwardEvent(props, "onMouseLeave", e); if (!frozen && !e.defaultPrevented) getVercelControls()?.patch({ capability: "none" }) }} onHoverEnd={(...args: unknown[]) => { vercelForwardEvent(props, "onHoverEnd", ...args); if (!frozen && !(args[0] as {defaultPrevented?: boolean} | undefined)?.defaultPrevented) getVercelControls()?.patch({ capability: "none" }) }} onBlur={(e: React.FocusEvent<HTMLElement>) => { vercelForwardEvent(props, "onBlur", e); if (!frozen && !e.defaultPrevented && !e.currentTarget.contains(e.relatedTarget as Node | null)) getVercelControls()?.patch({ capability: "none" }) }} />
    })
}
const VERCEL_PHRASES = ["For coding agents", "To ship apps and agents", "Automated by agents"]
export function withVercelAgenticPhonePhrase(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>(function AgenticPhonePhrase(props, forwarded) {
        const frozen = vercelFrozen(), controls = useVercelControls(frozen), [host, setHost] = React.useState<HTMLElement | null>(null), [index, setIndex] = React.useState(0)
        const setNode = React.useCallback((node: HTMLElement | null) => { setHost(node); vercelWriteRef(forwarded, node) }, [forwarded])
        React.useEffect(() => {
            if (!host || frozen || controls.reduced || controls.paused) return
            let timer: ReturnType<typeof setTimeout> | null = null, visible = false, disposed = false
            const clear = () => { if (timer !== null) clearTimeout(timer); timer = null }
            const schedule = () => { clear(); if (visible && !document.hidden && !disposed) timer = setTimeout(() => { setIndex(i => (i + 1) % 3); schedule() }, 3000) }
            const observer = new IntersectionObserver(entries => { visible = entries.some(e => e.isIntersecting && e.intersectionRect.width > 0 && e.intersectionRect.height > 0); schedule() })
            observer.observe(host); document.addEventListener("visibilitychange", schedule)
            return () => { disposed = true; clear(); observer.disconnect(); document.removeEventListener("visibilitychange", schedule) }
        }, [host, frozen, controls.reduced, controls.paused])
        return <Component {...props} text={frozen ? props.text : VERCEL_PHRASES[index]} ref={setNode} />
    })
}
export function withVercelAgenticMenuToggle(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>(function AgenticMenuToggle(props, ref) {
        const frozen = vercelFrozen(), controls = useVercelControls(frozen), activate = useVercelNativeActivation(() => getVercelControls()?.patch({ menuOpen: !controls.menuOpen }), frozen)
        return <Component {...props} ref={ref} role="button" tabIndex={frozen ? undefined : 0} aria-expanded={controls.menuOpen} onTap={(e: {defaultPrevented?: boolean}) => { vercelForwardEvent(props, "onTap", e); activate("tap", Boolean(e.defaultPrevented)) }} onClick={(e: {defaultPrevented?: boolean}) => { vercelForwardEvent(props, "onClick", e); activate("click", Boolean(e.defaultPrevented)) }} onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => { vercelForwardEvent(props, "onKeyDown", e); if (e.key === "Enter" || e.key === " ") { activate("key", e.defaultPrevented); e.preventDefault() } }} />
    })
}
export function withVercelAgenticMenuSurface(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>(function AgenticMenuSurface(props, ref) {
        const frozen = vercelFrozen(), controls = useVercelControls(frozen), open = !frozen && controls.menuOpen
        return <Component {...props} ref={ref} inert={!open ? "" : undefined} aria-hidden={!open} style={{ ...props.style, ...(frozen ? {} : { visibility: open ? "visible" : "hidden", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }) }} />
    })
}
function publishVercelFrame(entry: StudyEntry | null) { if (!entry?.hasFrame || entry.frameKey !== entry.contentKey) return false; vercelMetadata(entry.display, entry.settings, entry.framePhase); return true }

const VERCEL_AGENTIC_REVISION = "current-light-v1"
function VercelAgenticSurface(props: Props) {
    const { animate = true, canvasMotion = false, speed = 1, stillTime = 1, artworkScale = 1, pointerEnabled = true, rgbEnabled = false, capability = "none", brushRadius = 110, brushStrength = 1, background = "#fafafa", showPlayback = true, style } = props
    const target = RenderTarget.current(), staticRenderer = useIsStaticRenderer(), canvasPreview = canvasMotion && target === RenderTarget.canvas, isStatic = target === RenderTarget.export || target === RenderTarget.thumbnail || (staticRenderer && !canvasPreview) || (target === RenderTarget.canvas && !canvasPreview), controls = useVercelControls(isStatic)
    const root = React.useRef<HTMLDivElement>(null), canvas = React.useRef<HTMLCanvasElement>(null), press = React.useRef<{ id: number; x: number; y: number } | null>(null), lastBrush = React.useRef(0), pending = React.useRef<number | null>(null), brushQueue = React.useRef<BrushPoint[]>([])
    const [brushes, setBrushes] = React.useState<BrushPoint[]>([]), [paused, setPaused] = React.useState(false), [frozenTime, setFrozenTime] = React.useState(stillTime), [clockOffset, setClockOffset] = React.useState(0), [status, setStatus] = React.useState<Status>("offscreen"), [error, setError] = React.useState("")
    const readTime = () => Number(canvas.current?.getAttribute("data-source-vercel-time") ?? stillTime), readClock = () => Number(canvas.current?.getAttribute("data-source-vercel-clock") ?? stillTime)
    React.useEffect(() => { if (!isStatic) getVercelControls()?.patch({ rgbEnabled }) }, [rgbEnabled, isStatic])
    React.useEffect(() => { if (!isStatic) getVercelControls()?.patch({ capability }) }, [capability, isStatic])
    React.useEffect(() => () => { if (pending.current !== null) cancelAnimationFrame(pending.current); pending.current = null }, [])
    React.useEffect(() => { if (controls.reduced) { brushQueue.current = []; setBrushes([]) } }, [controls.reduced])
    const ambientFrozen = isStatic || controls.reduced ? stillTime : paused || !animate || speed <= 0 ? frozenTime : null
    const sceneState: SceneState = { rgbEnabled: isStatic ? rgbEnabled : controls.rgbEnabled, capability: isStatic ? capability : controls.capability, brushes: isStatic || controls.reduced ? [] : brushes, frozenTime: ambientFrozen, clockOffset }
    const settings: Settings = { mode: "vercelLight", artworkRevision: VERCEL_AGENTIC_REVISION, animate: animate && !paused && speed > 0, static: isStatic, canvasPreview, speed: Math.max(0, speed), stillTime: Math.max(0, stillTime), interactive: false, primary: "#000000", secondary: background, ink: background, sceneState, artworkScale: vercelClamp(artworkScale, .3, 2), brushRadius: vercelClamp(brushRadius, 4, 240), brushStrength: vercelClamp(brushStrength, 0, 2) }
    const request = useStudySurface(root, canvas, settings, target, "SourceVercelAgenticStudy.tsx", (s, e) => { setStatus(s); setError(e ?? "") })
    React.useLayoutEffect(() => {
        const host = canvas.current; if (!host || typeof MutationObserver === "undefined") return
        const sync = () => publishVercelFrame(request.getEntry()), observer = new MutationObserver(sync)
        observer.observe(host, { attributes: true, attributeFilter: ["data-study-state", "data-study-frame-width", "data-study-frame-height"] }); sync(); return () => observer.disconnect()
    }, [target])
    const input = pointerEnabled && !isStatic && target !== RenderTarget.canvas
    const ignore = (event: React.PointerEvent<HTMLDivElement>) => (event.target as Element).closest?.("a,button,input,textarea,select,[contenteditable=true]")
    const toggle = () => { if (paused) { setClockOffset(readClock() - frozenTime); setPaused(false); getVercelControls()?.patch({ paused: false }); request() } else { setFrozenTime(readTime()); setPaused(true); getVercelControls()?.patch({ paused: true }) } }
    const addBrush = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!input || paused || !animate || speed <= 0 || controls.reduced || !controls.rgbEnabled || event.pointerType === "touch" || ignore(event)) return
        const now = performance.now(); if (now - lastBrush.current < 1000 / 30) return; lastBrush.current = now
        const rect = event.currentTarget.getBoundingClientRect(); if (!rect.width || !rect.height) return
        brushQueue.current = [...brushQueue.current, [vercelClamp((event.clientX - rect.left) / rect.width), vercelClamp((event.clientY - rect.top) / rect.height), readTime()] as BrushPoint].slice(-MAX_VERCEL_BRUSH)
        if (pending.current === null) pending.current = requestAnimationFrame(() => { pending.current = null; setBrushes(brushQueue.current) })
    }
    return <div ref={root} role="group" aria-label="HERO-009 / Vercel current original Agentic Infrastructure light study" onPointerMove={addBrush} onPointerDown={event => { if (input && !paused && !ignore(event)) press.current = { id: event.pointerId, x: event.clientX, y: event.clientY } }} onPointerCancel={() => { press.current = null }} onPointerUp={event => {
        const start = press.current; press.current = null
        if (!input || paused || !start || start.id !== event.pointerId || Math.hypot(start.x - event.clientX, start.y - event.clientY) > 7 || ignore(event)) return
        const rect = event.currentTarget.getBoundingClientRect()
        if (vercelHit((event.clientX - rect.left) * event.currentTarget.clientWidth / rect.width, (event.clientY - rect.top) * event.currentTarget.clientHeight / rect.height, event.currentTarget.clientWidth, event.currentTarget.clientHeight, settings.artworkScale)) { const store = getVercelControls(); store?.patch({ rgbEnabled: !store.get().rgbEnabled }); brushQueue.current = []; setBrushes([]) }
    }} style={{ width: "100%", height: "100%", ...style, position: "relative", overflow: "hidden", background, touchAction: "pan-y" }}>
        <canvas ref={canvas} role="img" aria-label="Upright black triangle on pale gray with a soft monochrome shadow; click the triangle then move the pointer to paint color" style={{ width: "100%", height: "100%", display: "block" }} />
        {showPlayback && !isStatic && <button data-source-vercel-playback="true" onPointerDown={event => event.stopPropagation()} onPointerUp={event => event.stopPropagation()} onClick={toggle} disabled={controls.reduced || !animate || speed <= 0} aria-pressed={paused} style={{ position: "absolute", right: 8, bottom: 8, fontFamily: "ui-monospace,monospace", fontSize: 9, lineHeight: 1.2, padding: "4px 6px", border: "1px solid #ddd", background: "#fafafa", color: "#444", cursor: "pointer" }}>{controls.reduced ? "REDUCED MOTION" : paused ? "PLAY" : "PAUSE"}</button>}
        {(error || status === "recovering") && <span role="status" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#555", fontSize: 10 }}>Restoring light…</span>}
    </div>
}
// Current original: the customer marquee is below the961px container boundary.
// Its six source SVGs stay native/editable. Only Preview creates moving mirrors;
// Canvas/export/thumbnail keep the authored native layout without a live clock.
export function withVercelAgenticCustomerRail(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>(function AgenticCustomerRail(props, forwardedRef) {
        const frozen = vercelFrozen(), controls = useVercelControls(frozen)
        const [host, setHost] = React.useState<HTMLElement | null>(null)
        const time = React.useRef(0), update = React.useRef<(() => void) | null>(null)
        const receive = React.useCallback((node: HTMLElement | null) => {
            setHost(node); vercelWriteRef(forwardedRef, node)
        }, [forwardedRef])
        React.useLayoutEffect(() => {
            if (!host || frozen) return
            const widths = [79, 130, 67, 116, 51, 113], heights = [16, 15, 18, 14, 40, 26]
            const period = widths.reduce((sum, width) => sum + width + 8 + 48, 0)
            const restoreStyles: Array<() => void> = []
            let overlay: HTMLElement | null = null, animation: Animation | null = null
            let visible = false, active = true, queued = false
            const write = (element: HTMLElement | SVGElement, key: string, value: string) => {
                const before = element.style.getPropertyValue(key), priority = element.style.getPropertyPriority(key)
                restoreStyles.push(() => { if (before) element.style.setProperty(key, before, priority); else element.style.removeProperty(key) })
                element.style.setProperty(key, value)
            }
            const clear = () => {
                if (animation) { time.current = Number(animation.currentTime ?? time.current); animation.cancel(); animation = null }
                overlay?.remove(); overlay = null
                restoreStyles.splice(0).reverse().forEach(restore => restore())
            }
            const refresh = () => {
                const state = getVercelControls()?.get() ?? VERCEL_DEFAULT
                if (!animation) return
                if (visible && !document.hidden && !state.paused && !state.reduced && !state.menuOpen) animation.play()
                else animation.pause()
            }
            const build = () => {
                clear()
                if (!active || !host.isConnected || host.clientWidth >= 961) return
                const originals = Array.from(host.querySelectorAll<HTMLElement | SVGElement>('[data-framer-name]'))
                    .filter(node => /^HERO-009 \/ Current original \/ customer-[0-5]$/.test(node.getAttribute('data-framer-name') ?? ''))
                    .sort((a, b) => Number(a.getAttribute('data-framer-name')?.slice(-1)) - Number(b.getAttribute('data-framer-name')?.slice(-1)))
                if (originals.length !== 6) return
                const artwork = originals.map(node => node.matches('svg,img') ? node : node.querySelector<HTMLElement | SVGElement>('svg,img'))
                if (artwork.some(node => !node)) return
                overlay = document.createElement('div')
                overlay.setAttribute('data-vercel-customer-overlay', '')
                Object.assign(overlay.style, { position: 'absolute', inset: '0', pointerEvents: 'none', userSelect: 'none' })
                const track = document.createElement('div')
                track.setAttribute('data-vercel-customer-track', '')
                Object.assign(track.style, { position: 'absolute', left: '0', top: '0', width: period + 'px', height: '100%', willChange: controls.reduced ? 'auto' : 'transform' })
                overlay.appendChild(track)
                const copies = controls.reduced ? 1 : Math.ceil(host.clientWidth / period) + 1
                const prefix = 'vercel-customer-' + Math.random().toString(36).slice(2) + '-'
                for (let copy = 0; copy < copies; copy++) {
                    let x = copy * period + 4
                    for (let index = 0; index < artwork.length; index++) {
                        const image = artwork[index]!.cloneNode(true) as HTMLElement | SVGElement
                        const ids = new Map<string, string>()
                        for (const node of [image, ...Array.from(image.querySelectorAll('[id]'))]) {
                            const id = node.getAttribute('id')
                            if (id) { const next = prefix + copy + '-' + index + '-' + ids.size; ids.set(id, next); node.setAttribute('id', next) }
                        }
                        for (const node of [image, ...Array.from(image.querySelectorAll('*'))]) {
                            for (const attribute of Array.from(node.attributes)) {
                                let value = attribute.value
                                for (const [id, next] of ids) {
                                    value = value.replaceAll('url(#' + id + ')', 'url(#' + next + ')')
                                    if ((attribute.name === 'href' || attribute.name === 'xlink:href') && value === '#' + id) value = '#' + next
                                }
                                if (value !== attribute.value) node.setAttribute(attribute.name, value)
                            }
                        }
                        image.removeAttribute('data-framer-name')
                        if (copy) image.setAttribute('aria-hidden', 'true')
                        Object.assign(image.style, { position: 'absolute', left: x + 'px', top: (host.clientHeight - heights[index]) / 2 + 'px', width: widths[index] + 'px', height: heights[index] + 'px', transform: 'none', display: 'block', maxWidth: 'none', pointerEvents: 'none' })
                        track.appendChild(image); x += widths[index] + 8 + 48
                    }
                }
                originals.forEach(node => write(node, 'visibility', 'hidden'))
                write(host, 'overflow-x', controls.reduced ? 'auto' : 'hidden'); write(host, 'overflow-y', 'hidden')
                host.appendChild(overlay)
                if (!controls.reduced) {
                    // The original currently computes40s even though its local
                    // --marquee-speed says50s: the inherited animation token is
                    // resolved at the source root. Match the observed motion.
                    animation = track.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(-' + period + 'px)' }], { duration: 40000, iterations: Infinity, easing: 'linear' })
                    animation.pause(); animation.currentTime = time.current; refresh()
                }
            }
            const resize = new ResizeObserver(build)
            const intersection = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting && entry.intersectionRatio > 0); refresh() })
            const mutation = new MutationObserver(records => {
                const changed = records.some(record => !(record.target instanceof Element && record.target.closest('[data-vercel-customer-overlay]')) && [...Array.from(record.addedNodes), ...Array.from(record.removedNodes)].some(node => !(node instanceof Element && node.matches('[data-vercel-customer-overlay]'))))
                if (changed && !queued) { queued = true; queueMicrotask(() => { queued = false; if (active) build() }) }
            })
            update.current = refresh
            resize.observe(host); intersection.observe(host)
            mutation.observe(host, { childList: true, subtree: true })
            document.addEventListener('visibilitychange', refresh); build()
            return () => {
                active = false; update.current = null
                resize.disconnect(); intersection.disconnect(); mutation.disconnect()
                document.removeEventListener('visibilitychange', refresh); clear()
            }
        }, [host, frozen, controls.reduced])
        React.useLayoutEffect(() => { update.current?.() }, [controls.paused, controls.menuOpen])
        return <Component {...props} ref={receive} />
    })
}


/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1080
 * @framerIntrinsicHeight 720
 */
export default function SourceVercelAgenticStudy(props: Props) { return <VercelAgenticSurface key={VERCEL_AGENTIC_REVISION} {...props} /> }
addPropertyControls(SourceVercelAgenticStudy, {
    animate: { type: ControlType.Boolean, title: "Animate", defaultValue: true }, canvasMotion: { type: ControlType.Boolean, title: "Canvas motion", defaultValue: false }, speed: { type: ControlType.Number, title: "Speed", min: 0, max: 2, step: .05, defaultValue: 1 }, stillTime: { type: ControlType.Number, title: "Still time", min: 0, max: 60, step: .1, defaultValue: 1 }, artworkScale: { type: ControlType.Number, title: "Artwork size", min: .3, max: 2, step: .05, defaultValue: 1 }, pointerEnabled: { type: ControlType.Boolean, title: "Pointer brush", defaultValue: true }, rgbEnabled: { type: ControlType.Boolean, title: "RGB light", defaultValue: false }, capability: { type: ControlType.Enum, title: "Capability", options: ["none", "coding", "shipping", "automation"], optionTitles: ["None", "Coding", "Shipping", "Automation"], defaultValue: "none" }, brushRadius: { type: ControlType.Number, title: "Brush radius", min: 4, max: 240, step: 1, defaultValue: 110 }, brushStrength: { type: ControlType.Number, title: "Brush amount", min: 0, max: 2, step: .05, defaultValue: 1 }, background: { type: ControlType.Color, title: "Background", defaultValue: "#fafafa" }, showPlayback: { type: ControlType.Boolean, title: "Playback", defaultValue: true }
})
