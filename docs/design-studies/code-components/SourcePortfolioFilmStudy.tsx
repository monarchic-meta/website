import * as React from "react"
import type {ComponentType} from "react"
import {addPropertyControls,ControlType,RenderTarget,useIsStaticRenderer} from "framer"
// SOURCE INSPIRATION / HERO-004 / Artemii Lebedev / https://artemiilebedev.com/
// Real source case films supplied through manually uploaded File controls. No source behavior JS.
// Actual source films, native copy and this independent Canvas2D/controller adaptation stay distinct.
// Current public constants support20s selection,2s entrance,1s clip,650ms hold and Phone swipe.
// Immersive perspective, five unobserved effect appearances and exact restart/easing are fitted limits.
type Mode="portfolioFilm"
type Status="waiting"|"running"|"paused"|"static"|"reduced-motion"|"offscreen"|"recovering"
interface SceneState{project:number;frame:string;immersive:boolean}
interface Settings{mode:Mode;animate:boolean;static:boolean;canvasPreview:boolean;speed:number;stillTime:number;interactive:boolean;primary:string;secondary:string;ink:string;sceneState:SceneState;managed?:boolean;renderWidth?:number;renderHeight?:number;managedBufferWidth?:number;managedBufferHeight?:number;pixelBudget?:number;colorHost?:HTMLCanvasElement}
interface Props{film01?:string;film02?:string;film03?:string;film04?:string;film05?:string;film06?:string;film07?:string;film08?:string;film09?:string;film10?:string;film11?:string;film12?:string;film13?:string;posters?:string[];animate?:boolean;canvasMotion?:boolean;speed?:number;posterTime?:number;startProject?:number;autoAdvance?:boolean;controlsEnabled?:boolean;effectsEnabled?:boolean;showPlayback?:boolean;background?:string;layout?:"auto"|"desktop"|"phone";style?:React.CSSProperties}
const FILM_STREAMS=[[0,1],[2,3],[4,4],[5,6],[7,7],[8,9],[10,11],[12,12]] as const
function filmClamp(n:number,a=0,b=1){return Math.max(a,Math.min(b,Number.isFinite(n)?n:a))}
function filmProject(n:number){return Math.floor(filmClamp(n,0,7))}
function filmStream(project:number,phone:boolean){return FILM_STREAMS[filmProject(project)][phone?1:0]}
function filmRaster(settings:Settings,canvas:HTMLCanvasElement):[number,number]{let w=Math.max(1,Math.floor(settings.managedBufferWidth??settings.renderWidth??canvas.clientWidth??1280)),h=Math.max(1,Math.floor(settings.managedBufferHeight??settings.renderHeight??canvas.clientHeight??720));const budget=Math.max(1,Math.floor(settings.pixelBudget??2000000));if(w*h>budget){const f=Math.sqrt(budget/(w*h));w=Math.max(1,Math.floor(w*f));h=Math.max(1,Math.min(Math.floor(budget/w),Math.floor(h*f)))}return[w,h]}
function filmCover(ctx:CanvasRenderingContext2D,source:CanvasImageSource,sw:number,sh:number,width:number,height:number){const scale=Math.max(width/Math.max(1,sw),height/Math.max(1,sh)),w=sw*scale,h=sh*scale;ctx.drawImage(source,(width-w)/2,(height-h)/2,w,h)}
interface FilmFrame{id:string;url:string;project:number;time:number;transition?:number;kind:"poster"|"video"|"snapshot";source:HTMLCanvasElement;width:number;height:number}
interface FilmLease{create:()=>HTMLVideoElement;release:(video:HTMLVideoElement)=>void;trackAbort:(video:HTMLVideoElement,cancel:()=>void)=>void;finish:()=>void}
interface FilmMediaClient{kind:"live"|"still";enabled:boolean;priority:number;start:(lease:FilmLease)=>void;stop:()=>void}
interface FilmMediaRecord extends FilmMediaClient{id:number;videos:Set<HTMLVideoElement>;aborts:Map<HTMLVideoElement,()=>void>}
const FILM_MEDIA_SYMBOL=Symbol.for("monarchic.source-portfolio-media.v1")
function getFilmMediaGate(){
    if(typeof window==="undefined")throw Error("Film media is browser-only")
    type Gate={add:(input:FilmMediaClient)=>{update:(next:Partial<FilmMediaClient>)=>void;remove:()=>void};debug:()=>{clients:number;decoders:number;peakDecoders:number;owner:number|null;kind:string|null;failures:string[]}}
    const registry=window as unknown as Record<symbol,unknown>,existing=registry[FILM_MEDIA_SYMBOL] as Gate|undefined;if(existing)return existing
    const clients=new Map<number,FilmMediaRecord>(),failures:string[]=[];let sequence=0,owner:FilmMediaRecord|null=null,peak=0,pumping=false,again=false
    const decoderCount=()=>[...clients.values()].reduce((n,c)=>n+c.videos.size,0)
    function release(record:FilmMediaRecord,video:HTMLVideoElement){if(!record.videos.delete(video))return;const cancel=record.aborts.get(video);record.aborts.delete(video);cancel?.();try{video.pause();video.removeAttribute("src");video.load()}catch{}}
    function stop(record:FilmMediaRecord){try{record.stop()}catch(error){failures.push(String(error))}finally{for(const video of[...record.videos])release(record,video)}}
    function pump(){if(pumping){again=true;return}pumping=true;try{do{again=false;const eligible=[...clients.values()].filter(c=>c.enabled),next=eligible.filter(c=>c.kind==="still").sort((a,b)=>a.id-b.id)[0]??eligible.filter(c=>c.kind==="live").sort((a,b)=>b.priority-a.priority||b.id-a.id)[0]??null;if(owner===next)continue;if(owner){const previous=owner;owner=null;stop(previous)}if(next){owner=next;const lease:FilmLease={create(){if(owner!==next)throw Error("Stale film media lease");if(decoderCount()>=2)throw Error("Film decoder budget exceeded");const video=document.createElement("video");video.muted=true;video.playsInline=true;video.preload="metadata";video.crossOrigin="anonymous";next.videos.add(video);peak=Math.max(peak,decoderCount());return video},release:video=>release(next,video),trackAbort(video,cancel){if(next.videos.has(video))next.aborts.set(video,(()=>{const previous=next.aborts.get(video);return()=>{previous?.();cancel()}})())},finish(){if(owner!==next)return;next.enabled=false;owner=null;stop(next);again=true;pump()}};try{next.start(lease)}catch(error){failures.push(String(error));next.enabled=false;owner=null;stop(next);again=true}}}while(again)}finally{pumping=false}}
    const gate:Gate={add(input){const record:FilmMediaRecord={...input,id:++sequence,videos:new Set(),aborts:new Map()};clients.set(record.id,record);pump();return{update(next){Object.assign(record,next);pump()},remove(){if(owner===record){owner=null;stop(record)}else stop(record);clients.delete(record.id);pump()}}},debug:()=>({clients:clients.size,decoders:decoderCount(),peakDecoders:peak,owner:owner?.id??null,kind:owner?.kind??null,failures:[...failures]})};registry[FILM_MEDIA_SYMBOL]=gate;return gate
}
type FilmTimedVideo=HTMLVideoElement & {requestVideoFrameCallback?:(callback:(now:number,metadata:{mediaTime:number})=>void)=>number;cancelVideoFrameCallback?:(id:number)=>void}
const FILM_VIDEO_TIMES=new WeakMap<HTMLVideoElement,{time:number;known:boolean}>()
function filmVideoTime(video:HTMLVideoElement){const value=FILM_VIDEO_TIMES.get(video);return value?.known?value.time:video.currentTime}
function loadFilmVideo(lease:FilmLease,url:string,time:number,signal:AbortSignal){
    const video=lease.create(),timed=video as FilmTimedVideo,stamp={time:0,known:false};FILM_VIDEO_TIMES.set(video,stamp);let callback:number|undefined,cancelled=false;if(timed.requestVideoFrameCallback){const sample=(_now:number,metadata:{mediaTime:number})=>{if(cancelled)return;stamp.time=metadata.mediaTime;stamp.known=true;callback=timed.requestVideoFrameCallback?.(sample)};callback=timed.requestVideoFrameCallback(sample)}lease.trackAbort(video,()=>{cancelled=true;if(callback!==undefined)timed.cancelVideoFrameCallback?.(callback);FILM_VIDEO_TIMES.delete(video)});let settled=false,timer:ReturnType<typeof setTimeout>|null=null
    const promise=new Promise<HTMLVideoElement>((resolve,reject)=>{const cleanup=()=>{video.removeEventListener("loadedmetadata",metadata);video.removeEventListener("loadeddata",data);video.removeEventListener("seeked",data);video.removeEventListener("error",error);signal.removeEventListener("abort",abort);if(timer!==null)clearTimeout(timer);timer=null},finish=(reason?:Error)=>{if(settled)return;settled=true;cleanup();if(reason)reject(reason);else resolve(video)},error=()=>finish(Error("Source film could not be loaded")),abort=()=>finish(new DOMException("Film request cancelled","AbortError")),data=()=>{if(video.readyState>=2&&!video.seeking&&Math.abs(video.currentTime-target())<.08)finish()},target=()=>Math.min(Math.max(0,time),Math.max(0,(Number.isFinite(video.duration)?video.duration:time+1)-.04)),metadata=()=>{try{if(Math.abs(video.currentTime-target())>.03)video.currentTime=target();else data()}catch{error()}};lease.trackAbort(video,abort);signal.addEventListener("abort",abort,{once:true});video.addEventListener("loadedmetadata",metadata);video.addEventListener("loadeddata",data);video.addEventListener("seeked",data);video.addEventListener("error",error);timer=setTimeout(()=>finish(Error("Source film timed out")),15000);if(signal.aborted){abort();return}video.src=url;video.load()})
    return{video,promise}
}
interface FilmControlSnapshot{project:number;expanded:boolean;immersive:boolean;paused:boolean;effect:number;effectOn:boolean;reduced:boolean}
const FILM_DEFAULT:FilmControlSnapshot=Object.freeze({project:0,expanded:false,immersive:false,paused:false,effect:0,effectOn:false,reduced:false})
const FILM_CONTROL_SYMBOL=Symbol.for("monarchic.source-portfolio-controls.v1")
function getFilmControls(){
    if(typeof window==="undefined")return null
    type Store={get:()=>FilmControlSnapshot;getPoster:()=>FilmControlSnapshot;poster:(project:number)=>void;subscribePoster:(f:()=>void)=>()=>void;subscribe:(f:()=>void)=>()=>void;subscribeClock:(f:()=>void)=>()=>void;select:(project:number)=>void;toggleExpanded:()=>void;togglePaused:()=>void;beginHold:(x:number,y:number)=>void;moveHold:(x:number,y:number)=>void;cancelHold:()=>void;clock:()=>{elapsed:number;progress:number;hold:number};advance:(delta:number,auto:boolean)=>void;configure:(enabled:boolean,effects:boolean)=>void}
    const registry=window as unknown as Record<symbol,unknown>,existing=registry[FILM_CONTROL_SYMBOL] as Store|undefined;if(existing)return existing
    let state=FILM_DEFAULT,posterState=FILM_DEFAULT,elapsed=0,enabled=true,effects=true,holdStart=0,holdPoint:[number,number]|null=null,holdTimer:ReturnType<typeof setTimeout>|null=null,holdRaf=0,media:MediaQueryList|null=null,lastEscape=-Infinity
    const listeners=new Set<()=>void>(),posterListeners=new Set<()=>void>(),clocks=new Set<()=>void>(),publish=(next:FilmControlSnapshot)=>{if(Object.keys(next).every(key=>next[key as keyof FilmControlSnapshot]===state[key as keyof FilmControlSnapshot]))return;state=Object.freeze(next);listeners.forEach(f=>f())},clockNotify=()=>clocks.forEach(f=>f()),cancelHold=()=>{if(holdTimer!==null)clearTimeout(holdTimer);if(holdRaf)cancelAnimationFrame(holdRaf);holdTimer=null;holdRaf=0;holdPoint=null;holdStart=0;clockNotify()},select=(project:number)=>{if(!enabled)return;elapsed=0;publish({...state,project:filmProject(project)});clockNotify()},motion=()=>{const reduced=media?.matches??false;if(reduced)cancelHold();publish({...state,reduced,effectOn:reduced?false:state.effectOn})},key=(event:KeyboardEvent)=>{if(!enabled||(event.target as Element)?.closest?.("input,textarea,select,[contenteditable=true]"))return;if(state.immersive&&(event.key==="ArrowLeft"||event.key==="ArrowRight")){event.preventDefault();select((state.project+(event.key==="ArrowRight"?1:7))%8)}if(event.key!=="Escape"||!effects||state.reduced||window.innerWidth<768||!window.matchMedia("(hover:hover) and (pointer:fine)").matches||performance.now()-lastEscape<260)return;lastEscape=performance.now();publish({...state,effect:state.effectOn?(state.effect+1)%6:state.effect,effectOn:!state.effectOn})}
    const store:Store={get:()=>state,getPoster:()=>posterState,poster(project){const selected=filmProject(project);if(posterState.project===selected)return;posterState=Object.freeze({...FILM_DEFAULT,project:selected});posterListeners.forEach(f=>f())},subscribePoster(f){posterListeners.add(f);return()=>{posterListeners.delete(f);if(!posterListeners.size)posterState=FILM_DEFAULT}},subscribe(f){listeners.add(f);if(listeners.size===1){media=window.matchMedia("(prefers-reduced-motion: reduce)");media.addEventListener("change",motion);window.addEventListener("keydown",key);motion()}return()=>{listeners.delete(f);if(!listeners.size){cancelHold();media?.removeEventListener("change",motion);media=null;window.removeEventListener("keydown",key);state=FILM_DEFAULT;elapsed=0;lastEscape=-Infinity}}},subscribeClock(f){clocks.add(f);return()=>clocks.delete(f)},select,toggleExpanded(){if(enabled)publish({...state,expanded:!state.expanded})},togglePaused(){publish({...state,paused:!state.paused})},beginHold(x,y){cancelHold();if(!enabled||state.reduced||window.innerWidth<992)return;holdPoint=[x,y];holdStart=performance.now();const tick=()=>{if(!holdPoint)return;clockNotify();holdRaf=requestAnimationFrame(tick)};holdRaf=requestAnimationFrame(tick);holdTimer=setTimeout(()=>{holdTimer=null;publish({...state,immersive:!state.immersive});cancelHold()},650)},moveHold(x,y){if(holdPoint&&Math.hypot(x-holdPoint[0],y-holdPoint[1])>14)cancelHold()},cancelHold,clock:()=>({elapsed,progress:filmClamp(elapsed/20),hold:holdStart?filmClamp((performance.now()-holdStart)/650):0}),advance(delta,auto){if(state.paused||state.reduced)return;elapsed+=Math.max(0,delta);if(auto&&elapsed>=20){elapsed%=20;publish({...state,project:(state.project+1)%8})}clockNotify()},configure(nextEnabled,nextEffects){enabled=nextEnabled;effects=nextEffects;if(!effects&&state.effectOn)publish({...state,effectOn:false});if(!enabled)cancelHold()}};registry[FILM_CONTROL_SYMBOL]=store;return store
}
interface FilmConfiguration{urls:string[];posters:string[];phone:boolean;project:number;posterTime:number;speed:number;autoAdvance:boolean;paused:boolean;reduced:boolean;background:string;immersive:boolean;posterMode:boolean}
interface FilmField{priority:number;configuration:FilmConfiguration;frames:Map<string,FilmFrame>;current:FilmFrame|null;disposed:boolean;notify:(frame:FilmFrame)=>void;error:(message:string)=>void;player:FilmPlayer|null;capture:(source:CanvasImageSource,width:number,height:number,project:number,url:string,time:number)=>FilmFrame;commit:(frame:FilmFrame)=>void;prepare:(configuration:FilmConfiguration)=>void;acceptPoster:(image:HTMLImageElement,project:number,url:string,poster:string)=>void;dispose:()=>void}
interface FilmPlayer{isActive:()=>boolean;focus:()=>void;select:()=>void;draw:(ctx:CanvasRenderingContext2D,width:number,height:number)=>{project:number;time:number;transition:number;ready:boolean;kind:"poster"|"video"|"snapshot"};snapshot:()=>FilmFrame|null;dispose:()=>void}
const FILM_FIELDS=new WeakMap<HTMLCanvasElement,FilmField>()
let filmFrameSequence=0

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
function createFilmField(configuration:FilmConfiguration,notify:(frame:FilmFrame)=>void,error:(message:string)=>void):FilmField{
    let generation=0,pending:{remove:()=>void}|null=null,pendingAbort:AbortController|null=null
    function remember(frame:FilmFrame){const replaced=field.frames.get(frame.id);field.frames.delete(frame.id);if(replaced&&replaced!==frame){if(field.current===replaced)field.current=frame;replaced.source.width=1;replaced.source.height=1}field.frames.set(frame.id,frame);while(field.frames.size>3){const first=[...field.frames.keys()].find(id=>id!==field.current?.id&&id!==frame.id);if(!first)break;const old=field.frames.get(first);field.frames.delete(first);if(old){old.source.width=1;old.source.height=1}}}
    const field:FilmField={priority:0,configuration,frames:new Map(),current:null,disposed:false,notify,error,player:null,
        capture(source,width,height,project,url,time){const canvas=document.createElement("canvas");const fit=Math.min(1,Math.sqrt(2000000/Math.max(1,width*height)));canvas.width=Math.max(1,Math.floor(width*fit));canvas.height=Math.max(1,Math.min(Math.floor(2000000/canvas.width),Math.floor(height*fit)));const ctx=canvas.getContext("2d",{alpha:false});if(!ctx)throw Error("Source film frame could not be prepared");ctx.drawImage(source,0,0,canvas.width,canvas.height);return{id:"film-frame-"+(++filmFrameSequence),url,project,time,kind:"video",source:canvas,width:canvas.width,height:canvas.height}},
        commit(frame){if(field.disposed){frame.source.width=frame.source.height=1;return}remember(frame);field.current=frame;field.notify(frame)},
        acceptPoster(image,project,url,poster){if(field.disposed||field.configuration.project!==project||field.configuration.urls[filmStream(project,field.configuration.phone)]!==url||field.configuration.posters[filmStream(project,field.configuration.phone)]!==poster||field.configuration.posterTime>.001||!image.naturalWidth||(image.currentSrc&&image.currentSrc!==poster))return;const frame=field.capture(image,image.naturalWidth,image.naturalHeight,project,url,0);frame.kind="poster";frame.id="film-poster/"+project+"/"+url+"/"+poster;if((field.player?.isActive()&&!field.configuration.paused&&!field.configuration.reduced)||(!field.configuration.posterMode&&field.current?.url===url&&field.current.kind==="snapshot"))remember(frame);else field.commit(frame)},
        prepare(next){field.configuration=next;generation++;pendingAbort?.abort();pendingAbort=null;pending?.remove();pending=null;if(field.player){if(!next.paused&&!next.reduced&&field.player.isActive()){field.player.select();return}const frozen=next.posterMode?null:field.player.snapshot();if(frozen&&frozen.url===next.urls[filmStream(next.project,next.phone)])field.commit(frozen);else if(frozen){frozen.source.width=frozen.source.height=1}}const url=next.urls[filmStream(next.project,next.phone)],poster=next.posters[filmStream(next.project,next.phone)];if(field.current?.url===url&&next.paused&&!next.posterMode){field.error("");return};if(next.posterTime<=.001&&poster)return;if(!url){field.error("Film asset is unavailable.");return}const token=generation,controller=new AbortController();pendingAbort=controller;const gate=getFilmMediaGate();let job:{remove:()=>void}|null=null;job=gate.add({kind:"still",enabled:true,priority:0,stop:()=>controller.abort(),start(lease){const loaded=loadFilmVideo(lease,url,next.posterTime,controller.signal);loaded.promise.then(video=>{if(field.disposed||generation!==token||controller.signal.aborted)return;const frame=field.capture(video,video.videoWidth,video.videoHeight,next.project,url,filmVideoTime(video));field.commit(frame)}).catch(reason=>{if(!controller.signal.aborted&&generation===token&&!field.disposed)field.error(String(reason))}).finally(()=>{lease.finish();job?.remove();if(pending===job)pending=null;if(pendingAbort===controller)pendingAbort=null})}});pending=job},
        dispose(){if(field.disposed)return;field.disposed=true;generation++;pendingAbort?.abort();pendingAbort=null;pending?.remove();pending=null;field.player?.dispose();field.player=null;for(const frame of field.frames.values()){frame.source.width=1;frame.source.height=1}field.frames.clear();field.current=null},
    };return field
}
function createFilmPlayer(field:FilmField,presentation:HTMLCanvasElement,logical:()=>[number,number]):FilmPlayer{
    let disposed=false,owner=false,generation=0,lease:FilmLease|null=null,controller:AbortController|null=null,active:HTMLVideoElement|null=null,incoming:HTMLVideoElement|null=null,activeProject=-1,incomingProject=-1,activeURL="",incomingURL="",transitionStart=0,lastClock=0,lastElapsed=0,incomingReady=false,client:{update:(next:Partial<FilmMediaClient>)=>void;remove:()=>void}|null=null
    const stop=()=>{if(owner&&!disposed&&!field.disposed&&!field.configuration.posterMode){const frame=player.snapshot(),wanted=field.configuration.urls[filmStream(field.configuration.project,field.configuration.phone)];if(frame&&frame.url===wanted)field.commit(frame);else{if(frame){frame.source.width=frame.source.height=1}const poster=[...field.frames.values()].find(frame=>frame.kind==="poster"&&frame.url===wanted);if(poster)field.commit(poster)}}owner=false;generation++;controller?.abort();controller=null;if(active&&lease)lease.release(active);if(incoming&&lease)lease.release(incoming);active=incoming=null;activeURL=incomingURL="";activeProject=incomingProject=-1;incomingReady=false;lease=null;lastClock=0}
    const select=()=>{if(!owner||!lease||disposed)return;const configuration=field.configuration,index=configuration.project,url=configuration.urls[filmStream(index,configuration.phone)];if(!url){field.error("Film asset is unavailable.");return}if(activeURL===url){if(incoming&&incomingURL!==url){generation++;controller?.abort();controller=null;lease.release(incoming);incoming=null;incomingURL="";incomingProject=-1;incomingReady=false}if(active)active.playbackRate=configuration.speed;return}if(incomingURL===url)return;generation++;const token=generation;controller?.abort();controller=null;if(incoming){lease.release(incoming);incoming=null;incomingURL="";incomingProject=-1;incomingReady=false}const abort=new AbortController();controller=abort;const currentLease=lease,loaded=loadFilmVideo(currentLease,url,field.current?.url===url?field.current.time:0,abort.signal);incoming=loaded.video;incomingURL=url;incomingProject=index;loaded.video.loop=true;loaded.video.playbackRate=configuration.speed;loaded.promise.then(async video=>{if(disposed||!owner||token!==generation||abort.signal.aborted)return;try{await video.play()}catch(reason){if(!abort.signal.aborted)field.error(String(reason));return}if(disposed||!owner||token!==generation||abort.signal.aborted){currentLease.release(video);return}field.error("");if(!active){active=video;activeURL=url;activeProject=index;incoming=null;incomingURL="";incomingProject=-1;transitionStart=performance.now()-(field.current?.url===url&&field.current.time>.05?2000:0);lastClock=0;incomingReady=false}else{transitionStart=performance.now();incomingReady=true}}).catch(reason=>{if(!abort.signal.aborted&&token===generation&&!disposed)field.error(String(reason));if(incoming===loaded.video){currentLease.release(loaded.video);incoming=null;incomingURL="";incomingProject=-1;incomingReady=false}})}
    const player:FilmPlayer={isActive:()=>owner&&!disposed,focus:()=>{field.priority=performance.now();client?.update({priority:field.priority})},select,draw(ctx,width,height){const now=performance.now(),configuration=field.configuration;let time=field.current?.time??0,project=field.current?.project??configuration.project,ready=false,transition=1;if(!owner||!active){const frame=field.current;if(frame)filmCover(ctx,frame.source,frame.width,frame.height,width,height);return{project,time,transition,ready:!!frame,kind:frame?.kind??"poster"}}const delta=lastClock?Math.max(0,(now-lastClock)/1000):0;lastClock=now;if(!configuration.paused&&!configuration.reduced)getFilmControls()?.advance(delta*configuration.speed,configuration.autoAdvance&&!configuration.immersive);active.playbackRate=configuration.speed;const elapsed=configuration.paused?lastElapsed:Math.max(0,(now-transitionStart)/1000),reduced=configuration.reduced;lastElapsed=elapsed;
        const drawIncoming=(video:HTMLVideoElement,amount:number)=>{ctx.save();if(!reduced&&amount<1){const ease=1-Math.pow(1-filmClamp(amount),3),scale=1.3-.3*ease;ctx.translate(width/2,height/2);ctx.rotate((1-ease)*4*Math.PI/180);ctx.scale(scale,scale);ctx.translate(-width/2,-height/2);ctx.filter=`brightness(${.78+.22*ease}) grayscale(${1-ease}) blur(${(1-ease)*10}px)`}filmCover(ctx,video,video.videoWidth,video.videoHeight,width,height);ctx.restore()}
        if(incoming&&incomingReady&&incoming.readyState>=2){const clip=filmClamp(elapsed);drawIncoming(incoming,reduced?1:elapsed/2);ctx.save();ctx.beginPath();ctx.rect(0,0,width,height*(1-clip));ctx.clip();ctx.translate(0,-125*filmClamp(elapsed/1.1));filmCover(ctx,active,active.videoWidth,active.videoHeight,width,height);ctx.restore();time=filmVideoTime(incoming);project=incomingProject;transition=filmClamp(elapsed/2);if(reduced||elapsed>=2){const previous=active;active=incoming;activeURL=incomingURL;activeProject=incomingProject;incoming=null;incomingURL="";incomingProject=-1;incomingReady=false;lease?.release(previous)}}else{drawIncoming(active,reduced?1:elapsed/2);time=filmVideoTime(active);project=activeProject;transition=filmClamp(elapsed/2)}ready=true;return{project,time,transition,ready,kind:"video"}},
        snapshot(){const video=incoming&&incomingReady&&incoming.readyState>=2?incoming:active;if(!video||video.readyState<2)return null;active?.pause();incoming?.pause();const[logicalWidth,logicalHeight]=logical(),aspect=Math.max(.1,logicalWidth/Math.max(1,logicalHeight)),width=Math.max(1,Math.floor(Math.sqrt(2000000*aspect))),height=Math.max(1,Math.floor(2000000/width)),copy=document.createElement("canvas");copy.width=width;copy.height=height;const ctx=copy.getContext("2d",{alpha:false});if(!ctx)return null;ctx.fillStyle=field.configuration.background;ctx.fillRect(0,0,width,height);ctx.scale(width/logicalWidth,height/logicalHeight);const output=player.draw(ctx,logicalWidth,logicalHeight),frame:FilmFrame={id:"film-snapshot-"+(++filmFrameSequence),url:video===incoming?incomingURL:activeURL,project:output.project,time:output.time,transition:output.transition,kind:"snapshot",source:copy,width,height};return frame},
        dispose(){if(disposed)return;disposed=true;const frame=field.disposed?null:player.snapshot();if(frame&&!field.configuration.posterMode&&frame.url===field.configuration.urls[filmStream(field.configuration.project,field.configuration.phone)]&&!field.disposed)field.commit(frame);else if(frame){frame.source.width=frame.source.height=1}client?.remove();client=null;stop()},
    }
    client=getFilmMediaGate().add({kind:"live",enabled:true,priority:field.priority,stop,start(next){owner=true;lease=next;lastClock=0;select()}});return player
}
function filmPreparedFrame(field:FilmField,settings:Settings){return settings.animate&&!field.configuration.posterMode&&field.current?.project===settings.sceneState.project?field.current:field.frames.get(settings.sceneState.frame)??field.current}
function createRenderer(canvas:HTMLCanvasElement,initial:Settings,_notify:(status:Status,error?:string)=>void,resumeTime=initial.stillTime){
    const field=initial.colorHost?FILM_FIELDS.get(initial.colorHost):undefined;if(!field)throw Error("Film source frame is not prepared");const ctx=canvas.getContext("2d",{alpha:false});if(!ctx)throw Error("Film presentation is unavailable");let settings=initial,phase=resumeTime,disposed=false,width=1,height=1,player:FilmPlayer|null=null
    const resize=()=>{width=Math.max(1,settings.renderWidth??canvas.clientWidth??1280);height=Math.max(1,settings.renderHeight??canvas.clientHeight??720);const[w,h]=filmRaster(settings,canvas);if(canvas.width!==w||canvas.height!==h){canvas.width=1;canvas.height=1;canvas.width=w;canvas.height=h}}
    const renderAt=(next:number)=>{if(disposed)return;phase=next;ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";ctx.filter="none";ctx.fillStyle=settings.ink;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.scale(canvas.width/width,canvas.height/height);const frame=filmPreparedFrame(field,settings);let output={project:frame?.project??settings.sceneState.project,time:frame?.time??0,transition:frame?.transition??1,ready:!!frame,kind:frame?.kind??"poster"};if(settings.sceneState.immersive&&getComputedStyle(settings.colorHost??canvas).getPropertyValue("--source-film-carousel-managed").trim()!=="1"){ctx.translate(width/2,height/2);ctx.rotate(-2*Math.PI/180);ctx.scale(.70,.70);ctx.translate(-width/2,-height/2);ctx.shadowColor="rgba(0,0,0,.65)";ctx.shadowBlur=30}if(player)output=player.draw(ctx,width,height);else if(frame)filmCover(ctx,frame.source,frame.width,frame.height,width,height);ctx.restore();for(const node of[canvas,settings.colorHost])if(node)for(const[key,value]of Object.entries({"data-source-film-reference":"HERO-004","data-source-film-project":output.project,"data-source-film-requested":settings.sceneState.project,"data-source-film-time":output.time,"data-source-film-clock":phase,"data-source-film-transition":output.transition,"data-source-film-state":output.ready?"ready":"loading","data-source-film-kind":output.kind,"data-source-film-frame":frame?.id??settings.sceneState.frame,"data-source-film-immersive":settings.sceneState.immersive}))node.setAttribute(key,String(value))}
    resize();if(!initial.static){player=createFilmPlayer(field,canvas,()=>[width,height]);field.player=player}
    return{update(next:Settings){settings=next;resize();player?.select()},resize,renderAt,setPointer(_x:number,_y:number){},getSnapshot(){return{mode:settings.mode,stillTime:settings.stillTime,time:phase,lost:false}},dispose(){if(disposed)return;disposed=true;player?.dispose();if(field.player===player)field.player=null;player=null}}
}

const FILM_EMPTY_SUBSCRIBE=(_listener:()=>void)=>()=>{}
const FILM_SERVER_SNAPSHOT=()=>FILM_DEFAULT
function useFilmControls(frozen:boolean){const store=getFilmControls();return React.useSyncExternalStore((frozen?store?.subscribePoster:store?.subscribe)??FILM_EMPTY_SUBSCRIBE,(frozen?store?.getPoster:store?.get)??FILM_SERVER_SNAPSHOT,FILM_SERVER_SNAPSHOT)}
function useFilmFrozen(){const target=RenderTarget.current();return useIsStaticRenderer()||target===RenderTarget.canvas||target===RenderTarget.export||target===RenderTarget.thumbnail}
interface FilmLayerProps{style?:React.CSSProperties;children?:React.ReactNode;text?:string;[key:string]:unknown}
function filmRef<T>(ref:React.ForwardedRef<T>,value:T|null){if(typeof ref==="function")ref(value);else if(ref)ref.current=value}
function filmEvent(props:FilmLayerProps,name:string,...args:unknown[]){const callback=props[name];if(typeof callback==="function")callback(...args)}
type FilmNativeActivationEvent={defaultPrevented?:boolean;target?:EventTarget|null;clientX?:number;clientY?:number}
type FilmNativeActivationChannel="tap"|"click"|"key"
function useFilmNativeActivation(action:()=>void,frozen=false){const last=React.useRef<{channel:FilmNativeActivationChannel;at:number}|null>(null);return(channel:FilmNativeActivationChannel,prevented:boolean)=>{const at=typeof performance==="undefined"?Date.now():performance.now(),previous=last.current;if(previous&&channel!==previous.channel&&at-previous.at<350)return;last.current={channel,at};if(!frozen&&!prevented)action()}}
function filmPoint(event:FilmNativeActivationEvent,info?:unknown):[number,number]{const point=info&&typeof info==="object"&&"point"in info?info.point:undefined;return[event.clientX??(point&&typeof point==="object"&&"x"in point&&typeof point.x==="number"?point.x:0),event.clientY??(point&&typeof point==="object"&&"y"in point&&typeof point.y==="number"?point.y:0)]}
function filmInteractive(event:FilmNativeActivationEvent){return !!(event.target as Element|null)?.closest?.("a,button,input,textarea,select,[contenteditable=true]")}
function filmRow(Component:ComponentType<FilmLayerProps>,index:number):ComponentType<FilmLayerProps>{return React.forwardRef<HTMLElement,FilmLayerProps>(function FilmRow(props,ref){const frozen=useFilmFrozen(),state=useFilmControls(frozen),[hovered,setHovered]=React.useState(false),active=state.project===index,activate=useFilmNativeActivation(()=>getFilmControls()?.select(index),frozen),hover=(name:string,value:boolean,event:FilmNativeActivationEvent,info?:unknown)=>{if(info===undefined)filmEvent(props,name,event);else filmEvent(props,name,event,info);if(!frozen&&!event.defaultPrevented)setHovered(value)};return <Component {...props} ref={ref} data-film-native={"project-row-"+index} data-film-active={active} aria-current={active?"true":undefined} role={props.role??"button"} tabIndex={props.tabIndex??0} style={{...props.style,opacity:active||hovered?1:.62,cursor:"pointer"}} onMouseEnter={(event:FilmNativeActivationEvent)=>hover("onMouseEnter",true,event)} onMouseLeave={(event:FilmNativeActivationEvent)=>hover("onMouseLeave",false,event)} onHoverStart={(event:FilmNativeActivationEvent,info?:unknown)=>hover("onHoverStart",true,event,info)} onHoverEnd={(event:FilmNativeActivationEvent,info?:unknown)=>hover("onHoverEnd",false,event,info)} onClick={(event:FilmNativeActivationEvent)=>{filmEvent(props,"onClick",event);activate("click",!!event.defaultPrevented||filmInteractive(event))}} onTap={(event:FilmNativeActivationEvent,info?:unknown)=>{filmEvent(props,"onTap",event,info);activate("tap",!!event.defaultPrevented||filmInteractive(event))}} onKeyDown={(event:React.KeyboardEvent<HTMLElement>)=>{filmEvent(props,"onKeyDown",event);if(!frozen&&event.currentTarget.tagName!=="BUTTON"&&(event.key==="Enter"||event.key===" ")){const prevented=!!event.defaultPrevented;event.preventDefault();activate("key",prevented)}}}/>}) as ComponentType<FilmLayerProps>}
function filmProgress(Component:ComponentType<FilmLayerProps>,index:number):ComponentType<FilmLayerProps>{return React.forwardRef<HTMLElement,FilmLayerProps>(function FilmProgress(props,ref){const frozen=useFilmFrozen(),state=useFilmControls(frozen),node=React.useRef<HTMLElement|null>(null),base=props.style?.transform;React.useEffect(()=>{const update=()=>{if(!node.current)return;const control=getFilmControls(),progress=!frozen&&control?.get().project===index?control.clock().progress:0;node.current.style.transform=[base,`scaleX(${progress})`].filter(Boolean).join(" ");node.current.setAttribute("data-film-progress",String(progress))};update();return frozen?undefined:getFilmControls()?.subscribeClock(update)},[frozen,index,base,state.project]);return <Component {...props} ref={(value:HTMLElement|null)=>{node.current=value;filmRef(ref,value)}} data-film-native={"project-progress-"+index} style={{...props.style,transform:[base,"scaleX(0)"].filter(Boolean).join(" "),transformOrigin:"left center",pointerEvents:"none"}}/>}) as ComponentType<FilmLayerProps>}
export function withFilmPonderRow(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return filmRow(Component,0)}
export function withFilmCantorRow(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return filmRow(Component,1)}
export function withFilmBetterLouRow(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return filmRow(Component,2)}
export function withFilmFrequencyRow(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return filmRow(Component,3)}
export function withFilmGoomRow(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return filmRow(Component,4)}
export function withFilmMonolithRow(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return filmRow(Component,5)}
export function withFilmTigerRow(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return filmRow(Component,6)}
export function withFilmOxiRow(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return filmRow(Component,7)}
export function withFilmPonderProgress(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return filmProgress(Component,0)}
export function withFilmCantorProgress(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return filmProgress(Component,1)}
export function withFilmBetterLouProgress(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return filmProgress(Component,2)}
export function withFilmFrequencyProgress(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return filmProgress(Component,3)}
export function withFilmGoomProgress(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return filmProgress(Component,4)}
export function withFilmMonolithProgress(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return filmProgress(Component,5)}
export function withFilmTigerProgress(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return filmProgress(Component,6)}
export function withFilmOxiProgress(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return filmProgress(Component,7)}
// Source page scrollbar policy is confined to this owned live Preview root.
export function withFilmPage(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return React.forwardRef<HTMLElement,FilmLayerProps>(function FilmPage(props,ref){const staticRenderer=useIsStaticRenderer(),live=!staticRenderer&&RenderTarget.current()===RenderTarget.preview;return <>{live&&<style>{'html:has([data-source-film-page="hero-004"]){scrollbar-width:none}html:has([data-source-film-page="hero-004"])::-webkit-scrollbar{width:0px;height:0px}'}</style>}<Component {...props} ref={ref} data-source-film-page={live?"hero-004":undefined}/></>}) as ComponentType<FilmLayerProps>}
export function withFilmUtilityPanel(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return React.forwardRef<HTMLElement,FilmLayerProps>(function FilmPanel(props,ref){const frozen=useFilmFrozen(),state=useFilmControls(frozen),expanded=!frozen&&state.expanded;return <Component {...props} ref={ref} data-film-native="utility-panel" data-film-expanded={expanded} style={{...props.style,...(expanded?{scrollbarWidth:"none" as const}:{}),height:expanded?"calc(100vh - 36px)":props.style?.height,overflow:expanded?"auto":props.style?.overflow,transition:state.reduced?"none":`height ${expanded?920:820}ms ${expanded?"cubic-bezier(.22,1,.36,1)":"cubic-bezier(.65,0,.35,1)"}`} as React.CSSProperties & {scrollbarWidth?:"none"}}/>}) as ComponentType<FilmLayerProps>}
export function withFilmExpandedLayer(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return React.forwardRef<HTMLElement,FilmLayerProps>(function FilmExpanded(props,ref){const frozen=useFilmFrozen(),state=useFilmControls(frozen),expanded=!frozen&&state.expanded;return <Component {...props} ref={ref} data-film-native="expanded-content" aria-hidden={!expanded} style={{...props.style,opacity:expanded?1:0,pointerEvents:expanded?"auto":"none",transition:state.reduced?"none":`opacity ${expanded?920:820}ms ease`}}/>}) as ComponentType<FilmLayerProps>}
export function withFilmExpandButton(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return React.forwardRef<HTMLElement,FilmLayerProps>(function FilmExpand(props,ref){const frozen=useFilmFrozen(),state=useFilmControls(frozen),activate=useFilmNativeActivation(()=>getFilmControls()?.toggleExpanded(),frozen);return <Component {...props} ref={ref} data-film-native="expand-button" text={!frozen&&state.expanded?"MINIMIZE":"EXPAND"} aria-expanded={!frozen&&state.expanded} role={props.role??"button"} tabIndex={props.tabIndex??0} onClick={(event:FilmNativeActivationEvent)=>{filmEvent(props,"onClick",event);activate("click",!!event.defaultPrevented)}} onTap={(event:FilmNativeActivationEvent,info?:unknown)=>{filmEvent(props,"onTap",event,info);activate("tap",!!event.defaultPrevented)}} onKeyDown={(event:React.KeyboardEvent<HTMLElement>)=>{filmEvent(props,"onKeyDown",event);if(!frozen&&event.currentTarget.tagName!=="BUTTON"&&(event.key==="Enter"||event.key===" ")){const prevented=!!event.defaultPrevented;event.preventDefault();activate("key",prevented)}}}/>}) as ComponentType<FilmLayerProps>}
export function withFilmHoldButton(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return React.forwardRef<HTMLElement,FilmLayerProps>(function FilmHold(props,ref){const frozen=useFilmFrozen(),state=useFilmControls(frozen),point=React.useRef<[number,number]>([0,0]),activate=useFilmNativeActivation(()=>getFilmControls()?.beginHold(...point.current),frozen),start=(name:string,channel:FilmNativeActivationChannel,event:FilmNativeActivationEvent,info?:unknown)=>{if(info===undefined)filmEvent(props,name,event);else filmEvent(props,name,event,info);point.current=filmPoint(event,info);activate(channel,!!event.defaultPrevented)},move=(name:string,event:FilmNativeActivationEvent,info?:unknown)=>{if(info===undefined)filmEvent(props,name,event);else filmEvent(props,name,event,info);if(!frozen){if(event.defaultPrevented)getFilmControls()?.cancelHold();else getFilmControls()?.moveHold(...filmPoint(event,info))}},stop=(name:string,event:unknown,info?:unknown)=>{if(info===undefined)filmEvent(props,name,event);else filmEvent(props,name,event,info);if(!frozen)getFilmControls()?.cancelHold()};return <Component {...props} ref={ref} data-film-native="hold-button" aria-pressed={!frozen&&state.immersive} onPointerDown={(event:FilmNativeActivationEvent)=>start("onPointerDown","click",event)} onTapStart={(event:FilmNativeActivationEvent,info?:unknown)=>start("onTapStart","tap",event,info)} onPointerMove={(event:FilmNativeActivationEvent)=>move("onPointerMove",event)} onPan={(event:FilmNativeActivationEvent,info?:unknown)=>move("onPan",event,info)} onPointerUp={(event:unknown)=>stop("onPointerUp",event)} onTap={(event:unknown,info?:unknown)=>stop("onTap",event,info)} onTapCancel={(event:unknown,info?:unknown)=>stop("onTapCancel",event,info)} onPointerCancel={(event:unknown)=>stop("onPointerCancel",event)} onPointerLeave={(event:unknown)=>stop("onPointerLeave",event)} onHoverEnd={(event:unknown,info?:unknown)=>stop("onHoverEnd",event,info)}/>}) as ComponentType<FilmLayerProps>}
export function withFilmHoldProgress(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return React.forwardRef<HTMLElement,FilmLayerProps>(function FilmHoldProgress(props,ref){const frozen=useFilmFrozen(),node=React.useRef<HTMLElement|null>(null);React.useEffect(()=>{const update=()=>{if(node.current){const hold=frozen?0:getFilmControls()?.clock().hold??0;node.current.style.backgroundImage=`conic-gradient(#eeeeeb ${hold*360}deg, transparent 0deg)`;node.current.setAttribute("data-film-hold-progress",String(hold))}};update();return frozen?undefined:getFilmControls()?.subscribeClock(update)},[frozen]);return <Component {...props} ref={(value:HTMLElement|null)=>{node.current=value;filmRef(ref,value)}} data-film-native="hold-progress" style={{...props.style,pointerEvents:"none",borderRadius:"50%",backgroundImage:"conic-gradient(transparent 0deg,transparent 360deg)",maskImage:"radial-gradient(transparent calc(50% - 2px),black calc(50% - 1px))"}}/>}) as ComponentType<FilmLayerProps>}
export function withFilmPlaybackButton(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return React.forwardRef<HTMLElement,FilmLayerProps>(function FilmPlayback(props,ref){const frozen=useFilmFrozen(),state=useFilmControls(frozen),activate=useFilmNativeActivation(()=>getFilmControls()?.togglePaused(),frozen);return <Component {...props} ref={ref} data-film-native="playback-button" text={state.paused?"PLAY":"PAUSE"} aria-pressed={state.paused} role={props.role??"button"} tabIndex={props.tabIndex??0} onClick={(event:FilmNativeActivationEvent)=>{filmEvent(props,"onClick",event);activate("click",!!event.defaultPrevented)}} onTap={(event:FilmNativeActivationEvent,info?:unknown)=>{filmEvent(props,"onTap",event,info);activate("tap",!!event.defaultPrevented)}} onKeyDown={(event:React.KeyboardEvent<HTMLElement>)=>{filmEvent(props,"onKeyDown",event);if(!frozen&&event.currentTarget.tagName!=="BUTTON"&&(event.key==="Enter"||event.key===" ")){const prevented=!!event.defaultPrevented;event.preventDefault();activate("key",prevented)}}}/>}) as ComponentType<FilmLayerProps>}
// Native full-viewport overlay: source observed grain first; five other appearances remain independent fits.
export function withFilmEffectsOverlay(Component:ComponentType<FilmLayerProps>):ComponentType<FilmLayerProps>{return React.forwardRef<HTMLElement,FilmLayerProps>(function FilmEffects(props,ref){const frozen=useFilmFrozen(),state=useFilmControls(frozen),node=React.useRef<HTMLElement|null>(null);React.useEffect(()=>{const element=node.current;if(!element)return;let last=-1;const noise=document.createElement("canvas");noise.width=noise.height=64;const ctx=noise.getContext("2d");const update=()=>{const store=getFilmControls(),current=store?.get(),enabled=!frozen&&current?.effectOn&&!current.reduced;if(!enabled){element.style.backgroundImage="none";return}if(current.effect!==0)return;const seed=Math.floor((store?.clock().elapsed??0)*10);if(seed===last)return;last=seed;if(!ctx)return;const pixels=ctx.createImageData(64,64);let random=(seed+1)*1664525;for(let i=0;i<pixels.data.length;i+=4){random=(Math.imul(random,1664525)+1013904223)|0;const gray=(random>>>24);pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=gray;pixels.data[i+3]=80}ctx.putImageData(pixels,0,0);element.style.backgroundImage='url("'+noise.toDataURL()+'")'};update();const remove=frozen?undefined:getFilmControls()?.subscribeClock(update);return()=>{remove?.();noise.width=noise.height=1}},[frozen,state.effect,state.effectOn,state.reduced]);const active=!frozen&&state.effectOn&&!state.reduced,patterns=[undefined,"repeating-linear-gradient(0deg,transparent 0 5px,#ffffff33 5px 6px),repeating-linear-gradient(90deg,transparent 0 5px,#ffffff22 5px 6px)","linear-gradient(90deg,transparent 33%,#fff3 33% 33.1%,transparent 33.1% 66%,#fff3 66% 66.1%,transparent 66.1%),linear-gradient(transparent 50%,#fff3 50% 50.2%,transparent 50.2%)","radial-gradient(ellipse at center,#e3ffd033,transparent 65%)","linear-gradient(120deg,#ff173333,#12ccff33)","repeating-radial-gradient(circle at 60% 40%,transparent 0 42px,#ffffff18 43px 45px,transparent 46px 84px)"];return <Component {...props} ref={(value:HTMLElement|null)=>{node.current=value;filmRef(ref,value)}} data-film-native="effects-overlay" data-film-effect={active?state.effect:"off"} style={{...props.style,opacity:active?1:0,pointerEvents:"none",backgroundImage:active?patterns[state.effect]:"none",backgroundSize:state.effect===0?"192px 192px":undefined,mixBlendMode:state.effect===0?"soft-light":"normal"}}/>}) as ComponentType<FilmLayerProps>}

interface FilmPoolMountProps{root:React.RefObject<HTMLDivElement>;canvas:React.RefObject<HTMLCanvasElement>;settings:Settings;target:ReturnType<typeof RenderTarget.current>;notify:(status:Status,error?:string)=>void}
function FilmPoolMount(props:FilmPoolMountProps){const request=useStudySurface(props.root,props.canvas,props.settings,props.target,"SourcePortfolioFilmStudy.tsx",props.notify);React.useLayoutEffect(()=>{const node=props.canvas.current;if(!node)return;const publish=()=>{const entry=request.getEntry();if(!entry?.hasFrame||entry.frameKey!==entry.contentKey||entry.lease)return;const field=FILM_FIELDS.get(node),frame=field?filmPreparedFrame(field,entry.settings):null;if(!frame)return;for(const[k,v]of Object.entries({"data-source-film-reference":"HERO-004","data-source-film-project":frame.project,"data-source-film-requested":entry.settings.sceneState.project,"data-source-film-time":frame.time,"data-source-film-clock":entry.framePhase,"data-source-film-transition":frame.transition??1,"data-source-film-state":"ready","data-source-film-kind":frame.kind,"data-source-film-frame":frame.id,"data-source-film-immersive":entry.settings.sceneState.immersive}))node.setAttribute(k,String(v))};const observer=new MutationObserver(publish);observer.observe(node,{attributes:true,attributeFilter:["data-study-state","data-study-frame-width","data-study-frame-height"]});publish();return()=>observer.disconnect()},[props.target]);return null}
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1280
 * @framerIntrinsicHeight 720
 */
export default function SourcePortfolioFilmStudy(props:Props){
    const{posters=[],animate=true,canvasMotion=false,speed=1,posterTime=0,startProject=0,autoAdvance=true,controlsEnabled=true,effectsEnabled=true,showPlayback=true,background="#000000",layout="auto",style}=props,target=RenderTarget.current(),canvasPreview=canvasMotion&&target===RenderTarget.canvas,staticRenderer=useIsStaticRenderer(),isStatic=target===RenderTarget.export||target===RenderTarget.thumbnail||(staticRenderer&&!canvasPreview)||(target===RenderTarget.canvas&&!canvasPreview),controls=useFilmControls(isStatic),root=React.useRef<HTMLDivElement>(null),canvas=React.useRef<HTMLCanvasElement>(null),poster=React.useRef<HTMLImageElement>(null),field=React.useRef<FilmField|null>(null),touch=React.useRef<{id:number;x:number;y:number;time:number}|null>(null)
    const[logicalWidth,setLogicalWidth]=React.useState(1280),[frame,setFrame]=React.useState<string|null>(null),[error,setError]=React.useState(""),[poolError,setPoolError]=React.useState(""),urls=Array.from({length:13},(_,i)=>String(props[("film"+String(i+1).padStart(2,"0")) as keyof Props]??"")),phone=layout==="phone"||(layout==="auto"&&logicalWidth<992),project=isStatic?filmProject(startProject):controls.project,index=filmStream(project,phone),posterURL=posters[index]??"",url=urls[index]??"",paused=isStatic||controls.reduced||controls.paused||!animate||speed<=0
    const configuration:FilmConfiguration={urls,posters,phone,project,posterTime:Math.max(0,posterTime),speed:filmClamp(speed,.25,2),autoAdvance:autoAdvance&&target!==RenderTarget.canvas,paused,reduced:controls.reduced,background,immersive:!isStatic&&!phone&&controls.immersive,posterMode:isStatic||controls.reduced},latest=React.useRef(configuration);latest.current=configuration
    React.useLayoutEffect(()=>{const node=root.current,display=canvas.current;if(!node||!display)return;let mounted=true;const instance=createFilmField(latest.current,value=>{if(mounted){setFrame(value.id);setError("")}},message=>{if(mounted)setError(message)});field.current=instance;FILM_FIELDS.set(display,instance);const measure=()=>setLogicalWidth(node.clientWidth||1280);measure();const observer=typeof ResizeObserver==="undefined"?null:new ResizeObserver(measure);observer?.observe(node);return()=>{mounted=false;observer?.disconnect();FILM_FIELDS.delete(display);instance.dispose();if(field.current===instance)field.current=null}},[])
    React.useLayoutEffect(()=>{const instance=field.current;if(!instance)return;instance.prepare(configuration);const image=poster.current;if(image?.complete&&image.naturalWidth)instance.acceptPoster(image,project,url,posterURL)},[urls.join("\n"),posters.join("\n"),phone,project,posterTime,speed,autoAdvance,paused,controls.reduced,background,controls.immersive,isStatic])
    React.useEffect(()=>{if(isStatic)getFilmControls()?.poster(startProject);else getFilmControls()?.select(startProject)},[startProject,isStatic]);React.useEffect(()=>{if(!isStatic)getFilmControls()?.configure(controlsEnabled,effectsEnabled)},[controlsEnabled,effectsEnabled,isStatic])
    const sceneState:SceneState={project,frame:frame??"unprepared",immersive:configuration.immersive&&!phone},settings:Settings={mode:"portfolioFilm",animate:!paused,static:isStatic,canvasPreview,speed:Math.max(0,speed),stillTime:Math.max(0,posterTime),interactive:false,primary:background,secondary:background,ink:background,sceneState},input=controlsEnabled&&!isStatic&&target!==RenderTarget.canvas
    return <div ref={root} role="group" aria-label="HERO-004 / Artemii Lebedev actual source films" onPointerEnter={()=>{if(field.current){field.current.priority=performance.now();field.current.player?.focus()}}} onPointerDown={event=>{if(field.current){field.current.priority=performance.now();field.current.player?.focus()}if(input&&phone&&event.pointerType==="touch")touch.current={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now()}}} onPointerUp={event=>{const start=touch.current;touch.current=null;if(!start||start.id!==event.pointerId||!input||!phone)return;const delta=event.clientY-start.y;if(Math.abs(delta)>=48&&Math.abs(delta)>Math.abs(event.clientX-start.x)&&performance.now()-start.time<=700)getFilmControls()?.select((project+(delta<0?1:7))%8)}} onPointerCancel={()=>{touch.current=null}} style={{width:"100%",height:"100%",...style,position:"relative",overflow:"hidden",background,touchAction:input&&phone?"none":"pan-y"}}>
        <canvas ref={canvas} role="img" aria-label="Actual credited source case film; native interface remains outside this surface" style={{width:"100%",height:"100%",display:"block"}}/>
        {posterURL&&<img ref={poster} src={posterURL} crossOrigin="anonymous" alt="" onLoad={event=>field.current?.acceptPoster(event.currentTarget,project,url,posterURL)} onError={()=>{const instance=field.current;if(instance)instance.prepare({...latest.current,posters:latest.current.posters.map((value,i)=>i===index?"":value)});else setError("Source poster could not be loaded.")}} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:frame?0:1,pointerEvents:"none"}}/>}
        {frame&&<FilmPoolMount root={root} canvas={canvas} settings={settings} target={target} notify={(_status,message)=>setPoolError(message??"")}/>}
        {showPlayback&&!isStatic&&<button data-film-playback="true" onPointerDown={event=>event.stopPropagation()} onPointerUp={event=>event.stopPropagation()} onClick={()=>getFilmControls()?.togglePaused()} disabled={controls.reduced||!animate||speed<=0} aria-pressed={controls.paused} style={{position:"absolute",right:12,bottom:12,padding:"5px 8px",font:"10px ui-monospace,monospace",color:"#eee",background:"rgba(0,0,0,.55)",border:"1px solid #888"}}>{controls.reduced?"REDUCED MOTION":controls.paused?"PLAY":"PAUSE"}</button>}
        {(error||poolError)&&<span role="status" style={{position:"absolute",left:12,bottom:12,color:"#eee",background:"#111",padding:6,font:"10px ui-monospace,monospace"}}>Film is temporarily unavailable.</span>}
    </div>
}
const FILM_FILE_CONTROLS=Object.fromEntries(Array.from({length:13},(_,i)=>["film"+String(i+1).padStart(2,"0"),{type:ControlType.File,title:"Film "+String(i+1).padStart(2,"0"),allowedFileTypes:["mp4"]}]))
addPropertyControls(SourcePortfolioFilmStudy,{
    ...FILM_FILE_CONTROLS,posters:{type:ControlType.Array,title:"Film posters",control:{type:ControlType.File,allowedFileTypes:["avif","png","jpg","webp"]},maxCount:13,defaultValue:[]},animate:{type:ControlType.Boolean,title:"Animate",defaultValue:true},canvasMotion:{type:ControlType.Boolean,title:"Canvas motion",defaultValue:false},speed:{type:ControlType.Number,title:"Speed",min:0,max:2,step:.05,defaultValue:1},posterTime:{type:ControlType.Number,title:"Poster time",min:0,max:30,step:.1,defaultValue:0},startProject:{type:ControlType.Number,title:"Start project",min:0,max:7,step:1,defaultValue:0},autoAdvance:{type:ControlType.Boolean,title:"Auto advance",defaultValue:true},controlsEnabled:{type:ControlType.Boolean,title:"Source controls",defaultValue:true},effectsEnabled:{type:ControlType.Boolean,title:"Escape effects",defaultValue:true},showPlayback:{type:ControlType.Boolean,title:"Playback",defaultValue:true},background:{type:ControlType.Color,title:"Background",defaultValue:"#000000"},layout:{type:ControlType.Enum,title:"Film viewport",options:["auto","desktop","phone"],optionTitles:["Automatic","Desktop","Phone"],defaultValue:"auto"},
})
