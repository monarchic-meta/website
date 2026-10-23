import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget, useIsStaticRenderer } from "framer"

// Source-led point studies. Independent parametric surfaces and local motion;
// source caption code, exact formulas, assets and complete timing are not copied.
type Mode = "folded" | "curl" | "loops" | "feather"
type Status = "waiting" | "running" | "paused" | "static" | "reduced-motion" | "offscreen" | "recovering"
interface Props {
    study?: Mode
    animate?: boolean
    canvasMotion?: boolean
    speed?: number
    stillTime?: number
    intensity?: number
    scale?: number
    density?: number
    interactive?: boolean
    primary?: string
    secondary?: string
    ink?: string
    showLabels?: boolean
    style?: React.CSSProperties
}
interface Settings {
    mode: Mode
    animate: boolean
    static: boolean
    canvasPreview: boolean
    speed: number
    stillTime: number
    intensity: number
    scale: number
    density: number
    interactive: boolean
    primary: string
    secondary: string
    ink: string
    // Internal surface-host options. Framer controls remain unchanged.
    managed?: boolean
    renderWidth?: number
    renderHeight?: number
    pixelBudget?: number
    colorHost?: HTMLCanvasElement
}
const SOURCES = {
    folded: { key: "CC-007", title: "Folded white point mesh", account: "@yuruyurau", url: "https://x.com/yuruyurau/status/2093711731084415124" },
    curl: { key: "CC-014", title: "Curling point gesture", account: "@yuruyurau", url: "https://x.com/yuruyurau/status/2098075684593893667" },
    loops: { key: "CC-015", title: "Connected mesh loops", account: "@yuruyurau", url: "https://x.com/yuruyurau/status/2098070701597192431" },
    feather: { key: "CC-020", title: "Curved mesh feather", account: "@yuruyurau", url: "https://x.com/yuruyurau/status/2100230050063024467" },
}
const VERTEX = `
precision highp float;
attribute vec2 a_uv;
attribute float a_kind;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_mode;
uniform float u_intensity;
uniform float u_scale;
uniform float u_density;
varying mediump float v_shade;
varying mediump float v_opacity;
const float PI=3.14159265359;
const float TAU=6.28318530718;
mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
vec3 folded(vec2 uv,float kind){
    // A pinched continuous sheet opens into two opposing, locally twisting wings.
    float u=uv.x*2.0-1.0,v=uv.y*2.0-1.0;
    if(kind>.5){u=uv.y*2.0-1.0;v=uv.x*2.0-1.0;}
    float waist=.15+.85*pow(abs(u),.70);
    float fold=.23*sin(u*4.0-u_time*.38)+.09*sin(v*4.0+u*2.0+u_time*.3);
    vec3 p=vec3(u*.64,v*.27*waist,fold*(.6+.4*abs(v)));
    p.yz=rot(u*2.25+.20*sin(u*3.0+u_time*.4))*p.yz;
    p.y+=.045*sin(u*6.0+u_time*.55)*(1.0-v*v);
    p.z+=.035*sin(v*5.0-u_time*.6)*abs(u);
    return p;
}
vec3 curl(vec2 uv,float kind){
    // A tapering curled body and a separate family of thin upper contour trails.
    float s=uv.y,phi=uv.x*TAU+s*4.8+u_time*.17;
    if(kind>.5){
        float lane=uv.x-.5;
        float angle=s*5.6+lane*1.8+u_time*.16;
        float reach=.10+.20*s;
        return vec3(.08+reach*sin(angle)+lane*.09,
            .04+.30*s+.055*cos(angle),.12*cos(angle)+lane*.035);
    }
    vec3 center=vec3(.18*sin(s*TAU-.4)*(1.0-.28*s),
        -.36+.64*s+.04*sin(s*TAU+u_time*.24),.10*cos(s*5.3+u_time*.22));
    float width=.014+.11*pow(max(sin(PI*s),0.0),1.15);
    width*=1.0+.14*sin(s*10.0-u_time*.7);
    vec3 p=center+vec3(cos(phi)*width,sin(phi)*width*.45,sin(phi)*width);
    p.x+=.025*sin(s*10.0-u_time*.5)*sin(PI*s);
    return p;
}
vec3 loops(vec2 uv,float kind){
    // A continuous figure-eight surface, with open connected contour families.
    float angle=uv.y*TAU,phi=uv.x*TAU;
    float flow=.055*sin(angle*3.0-u_time*.46);
    vec3 center=vec3(.40*sin(angle),.255*sin(angle*2.0)+flow,.15*cos(angle));
    float width=.028+.021*(.5+.5*sin(angle*3.0+u_time*.5));
    vec3 p=center+vec3(cos(phi)*width*cos(angle),
        cos(phi)*width*sin(angle*2.0),sin(phi)*width);
    if(kind>.5){
        float lane=uv.x-.5;
        p=vec3((.40+.12*lane)*sin(angle),
            .255*sin(angle*2.0)+lane*.16+flow,
            .15*cos(angle)+lane*.08*sin(angle*3.0-u_time*.3));
    }
    p.xy=rot(-.16+.07*sin(u_time*.26))*p.xy;
    return p;
}
vec3 featherSpine(float s){
    return vec3(.25*sin(s*PI*1.35-1.1)+.025*sin(s*5.0-u_time*.3),
        -.39+.75*s,.08*sin(s*4.0+u_time*.25));
}
vec3 feather(vec2 uv,float kind){
    // An arcing spine supports a fine folded fan and curved side filaments.
    float s=uv.y,v=uv.x*2.0-1.0;
    if(kind>.5){
        float root=.035+uv.x*.9;
        float side=mod(floor(uv.x*12.0),2.0)<.5?-1.0:1.0;
        float reach=(.04+.16*sin(PI*root))*s;
        vec3 p=featherSpine(root);
        p.x+=side*reach;
        p.y+=.09*s+.035*sin(PI*s);
        p.z+=side*.06*sin(s*PI)+.018*sin(root*9.0-u_time*.5)*s;
        return p;
    }
    vec3 p=featherSpine(s);
    float width=.012+.17*pow(max(sin(PI*s),0.0),.85);
    vec2 barb=vec2(v*width,.065*sin(v*PI)*sin(PI*s));
    barb=rot(.55*sin(s*4.0+u_time*.24))*barb;
    p.x+=barb.x;p.z+=barb.y;
    p.y+=.11*abs(v)*sin(PI*s)+.016*sin(v*6.0+s*12.0-u_time*.65)*abs(v);
    return p;
}
void main(){
    vec3 p;
    if(u_mode<.5)p=folded(a_uv,a_kind);
    else if(u_mode<1.5)p=curl(a_uv,a_kind);
    else if(u_mode<2.5)p=loops(a_uv,a_kind);
    else p=feather(a_uv,a_kind);
    p.xz=rot(.10*sin(u_time*.18)+u_mouse.x*.35)*p.xz;
    p.yz=rot(.12+u_mouse.y*.28)*p.yz;
    float perspective=2.8/(2.8+p.z);
    float aspect=u_resolution.x/max(u_resolution.y,1.0);
    float fit=min(1.0,aspect/1.3);
    vec2 screen=p.xy*perspective*u_scale*fit;
    gl_Position=vec4(screen.x*2.0/max(aspect,.001),screen.y*2.0,0.0,1.0);
    gl_PointSize=clamp(u_resolution.y*.0028*perspective,1.0,3.3);
    float front=clamp(.62-p.z*.8,.2,1.0);
    v_shade=front;
    v_opacity=clamp(u_intensity,0.0,2.5)*(.24+.36*front)/sqrt(max(u_density,.35));
    if(a_kind>.5)v_opacity*=1.25;
}
`
const FRAGMENT = `
precision mediump float;
uniform vec3 u_primary;
uniform vec3 u_secondary;
varying mediump float v_shade;
varying mediump float v_opacity;
void main(){
    vec2 q=gl_PointCoord*2.0-1.0;
    float r2=dot(q,q);
    if(r2>1.0)discard;
    float core=exp(-r2*3.2),edge=1.0-smoothstep(.7,1.0,r2);
    float alpha=clamp(core*edge*v_opacity,0.0,1.0);
    gl_FragColor=vec4(mix(u_secondary,u_primary,v_shade),alpha);
}
`
interface Resources {
    field: WebGLProgram
    grid: WebGLBuffer
    count: number
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
function createRenderer(canvas: HTMLCanvasElement, initial: Settings, notify: (status: Status, error?: string)=>void, resumeTime=initial.stillTime) {
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" })
    if (!gl) throw new Error("WebGL is unavailable in this browser.")
    let settings = initial, resources: Resources | undefined
    const locations=new Map<WebGLProgram,Map<string,WebGLUniformLocation|null>>()
    let disposed = false, lost = false, visible = true, width = 1, height = 1, failure = ""
    let frame = 0, last = 0, lastDraw = 0, time = resumeTime
    let mouse = [0,0], targetMouse = [0,0]
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const shader = (type: number, source: string) => {
        const s = gl.createShader(type)
        if (!s) throw new Error("Could not allocate a graphics shader.")
        const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT)
        gl.shaderSource(s, precision && precision.precision ? source : source.replace("precision highp float", "precision mediump float"))
        gl.compileShader(s)
        if (!gl.getShaderParameter(s,gl.COMPILE_STATUS)) {
            const detail = gl.getShaderInfoLog(s) || "Shader compilation failed."
            gl.deleteShader(s)
            throw new Error(detail)
        }
        return s
    }
    const program = (vertex: string, fragment: string) => {
        const p = gl.createProgram()
        if (!p) throw new Error("Could not allocate a graphics program.")
        let v: WebGLShader | undefined, f: WebGLShader | undefined
        try {
            v=shader(gl.VERTEX_SHADER,vertex); f=shader(gl.FRAGMENT_SHADER,fragment)
            gl.attachShader(p,v); gl.attachShader(p,f); gl.linkProgram(p)
            if (!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)||"Could not link graphics.")
            return p
        } catch (error) { gl.deleteProgram(p); throw error }
        finally { if(v)gl.deleteShader(v); if(f)gl.deleteShader(f) }
    }
    const release = () => {
        if(!resources)return
        gl.deleteBuffer(resources.grid);gl.deleteProgram(resources.field)
        resources=undefined;locations.clear()
    }
    const uploadGrid = (grid:WebGLBuffer,density:number) => {
        const factor=Math.sqrt(Math.max(.35,Math.min(1.8,density)))
        const columns=Math.max(16,Math.round(96*factor)),rows=Math.max(24,Math.round(160*factor))
        const vertices:number[]=[]
        for(let row=0;row<rows;row++)for(let col=0;col<columns;col++)vertices.push((col+.5)/columns,(row+.5)/rows,0)
        for(let strand=0;strand<12;strand++)for(let dot=0;dot<rows;dot++)vertices.push((strand+.5)/12,(dot+.5)/rows,1)
        gl.bindBuffer(gl.ARRAY_BUFFER,grid)
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW)
        return vertices.length/3
    }
    const allocate = () => {
        let field:WebGLProgram|undefined,grid:WebGLBuffer|null=null
        try {
            field=program(VERTEX,FRAGMENT);grid=gl.createBuffer()
            if(!grid)throw new Error("Could not allocate point geometry.")
            const count=uploadGrid(grid,settings.density)
            resources={field,grid,count}
        } catch(error) {
            if(grid)gl.deleteBuffer(grid);if(field)gl.deleteProgram(field)
            throw error
        }
    }
    const canRun = () => !settings.managed&&!disposed&&!lost&&Boolean(resources)&&visible&&!document.hidden&&!motion.matches&&!settings.static&&settings.animate&&settings.speed>0&&width>0&&height>0
    const status = (): Status => lost ? "recovering" : settings.static ? "static" : motion.matches ? "reduced-motion" : !settings.animate||settings.speed<=0 ? "paused" : !visible||document.hidden ? "offscreen" : "running"
    const location = (p:WebGLProgram,name:string) => {
        let cache=locations.get(p)
        if(!cache){cache=new Map();locations.set(p,cache)}
        if(!cache.has(name))cache.set(name,gl.getUniformLocation(p,name))
        return cache.get(name)??null
    }
    const uniforms = (p:WebGLProgram) => {
        gl.uniform2f(location(p,"u_resolution"),canvas.width,canvas.height)
        gl.uniform2f(location(p,"u_mouse"),mouse[0],mouse[1])
        gl.uniform1f(location(p,"u_time"),time)
        gl.uniform1f(location(p,"u_intensity"),settings.intensity)
        gl.uniform1f(location(p,"u_scale"),settings.scale)
        gl.uniform1f(location(p,"u_density"),settings.density)
        gl.uniform1f(location(p,"u_mode"),settings.mode==="folded"?0:settings.mode==="curl"?1:settings.mode==="loops"?2:3)
        gl.uniform3fv(location(p,"u_primary"),rgb(settings.primary,settings.colorHost??canvas))
        gl.uniform3fv(location(p,"u_secondary"),rgb(settings.secondary,settings.colorHost??canvas))
        gl.uniform3fv(location(p,"u_ink"),rgb(settings.ink,settings.colorHost??canvas))
    }
    const draw = () => {
        if(disposed||lost||!resources||width<=0||height<=0) return
        gl.viewport(0,0,canvas.width,canvas.height)
        gl.disable(gl.DITHER)
        const ink=rgb(settings.ink,settings.colorHost??canvas)
        gl.clearColor(ink[0],ink[1],ink[2],1);gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(resources.field);uniforms(resources.field)
        gl.bindBuffer(gl.ARRAY_BUFFER,resources.grid)
        const uv=gl.getAttribLocation(resources.field,"a_uv"),kind=gl.getAttribLocation(resources.field,"a_kind")
        gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,12,0)
        gl.enableVertexAttribArray(kind);gl.vertexAttribPointer(kind,1,gl.FLOAT,false,12,8)
        gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE)
        gl.drawArrays(gl.POINTS,0,resources.count)
        gl.disable(gl.BLEND);gl.disableVertexAttribArray(uv);gl.disableVertexAttribArray(kind)
    }

    const stop = () => { if(frame)cancelAnimationFrame(frame); frame=0; last=0; lastDraw=0 }
    const tick = (now: number) => {
        frame=0
        if(!canRun()) { last=0; return }
        if(!last)last=now
        time+=Math.min((now-last)/1000,.1)*settings.speed; last=now
        mouse=mouse.map((v,i)=>v+(targetMouse[i]-v)*.08)
        if(now-lastDraw>=1000/(settings.canvasPreview?12:30)) { draw(); lastDraw=now }
        frame=requestAnimationFrame(tick)
    }
    const reconcile = () => {
        if(disposed)return
        stop(); notify(status(),failure||undefined)
        if(settings.static||motion.matches)time=settings.stillTime
        draw()
        if(canRun())frame=requestAnimationFrame(tick)
    }
    const resize = () => {
        if(disposed)return
        width=settings.managed?settings.renderWidth??1:canvas.clientWidth; height=settings.managed?settings.renderHeight??1:canvas.clientHeight
        // Managed hosts supply screen-space size, including editor zoom.
        const pixelBudget=settings.pixelBudget??(settings.canvasPreview?150000:650000)
        const ratio=Math.min(window.devicePixelRatio||1,1.5,Math.sqrt(pixelBudget/Math.max(1,width*height)))
        const bufferWidth=Math.max(1,Math.min(Math.floor(pixelBudget),Math.floor(width*ratio)))
        const bufferHeight=Math.max(1,Math.min(Math.floor(pixelBudget/bufferWidth),Math.floor(height*ratio)))
        if(canvas.width!==bufferWidth||canvas.height!==bufferHeight){
            // Shrink first so intermediate setter states cannot exceed budget.
            canvas.width=1;canvas.height=1;canvas.width=bufferWidth;canvas.height=bufferHeight
        }
        reconcile()
    }
    const pointer = (event:PointerEvent) => {
        if(!settings.interactive||settings.static||motion.matches) return
        const rect=canvas.getBoundingClientRect()
        targetMouse=[(event.clientX-rect.left)/Math.max(1,rect.width)-.5,.5-(event.clientY-rect.top)/Math.max(1,rect.height)]
        if(!canRun()) { mouse=targetMouse.slice(); draw() }
    }
    const leave = () => { targetMouse=[0,0]; if(!canRun()){mouse=[0,0];draw()} }
    const onLost = (event:Event) => { event.preventDefault();lost=true;failure="";stop();notify("recovering") }
    const onRestored = () => {
        if(disposed)return
        lost=false;failure="";resources=undefined;locations.clear()
        try{allocate();resize()}catch(error){lost=true;failure=String(error);stop();notify("recovering",failure)}
    }
    try{allocate()}catch(error){gl.getExtension("WEBGL_lose_context")?.loseContext();throw error}
    const sizeObserver=new ResizeObserver(resize)
    const intersection=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;reconcile()})
    if(!settings.managed){sizeObserver.observe(canvas);intersection.observe(canvas)}
    canvas.addEventListener("pointermove",pointer);canvas.addEventListener("pointerleave",leave)
    canvas.addEventListener("webglcontextlost",onLost);canvas.addEventListener("webglcontextrestored",onRestored)
    motion.addEventListener("change",reconcile);document.addEventListener("visibilitychange",reconcile)
    resize()
    return {
        update(next:Settings) {
            const reset=next.mode!==settings.mode||next.stillTime!==settings.stillTime
            const resizeNeeded=next.canvasPreview!==settings.canvasPreview||next.renderWidth!==settings.renderWidth||next.renderHeight!==settings.renderHeight||next.pixelBudget!==settings.pixelBudget
            const densityChanged=next.density!==settings.density
            settings=next
            if(densityChanged&&!lost&&!disposed&&resources)resources.count=uploadGrid(resources.grid,settings.density)
            if(reset)time=next.stillTime
            if(!next.interactive){mouse=[0,0];targetMouse=[0,0]}
            if(resizeNeeded)resize();else reconcile()
        },
        getSnapshot(){return {mode:settings.mode,stillTime:settings.stillTime,time,lost}},
        setPointer(x:number,y:number){mouse=[x,y];targetMouse=[x,y]},
        renderAt(seconds:number) { stop();time=seconds;draw() },
        dispose() {
            disposed=true;stop();sizeObserver.disconnect();intersection.disconnect()
            canvas.removeEventListener("pointermove",pointer);canvas.removeEventListener("pointerleave",leave)
            canvas.removeEventListener("webglcontextlost",onLost);canvas.removeEventListener("webglcontextrestored",onRestored)
            motion.removeEventListener("change",reconcile);document.removeEventListener("visibilitychange",reconcile)
            release()
            // StrictMode can replay cleanup/setup on a connected canvas.
            // Only release the context slot after its DOM node is detached.
            if(settings.managed)gl.getExtension("WEBGL_lose_context")?.loseContext()
            else queueMicrotask(()=>{if(!canvas.isConnected)gl.getExtension("WEBGL_lose_context")?.loseContext()})
        },
    }
}

// The same small coordinator is deliberately embedded in each standalone file.
// Symbol.for joins separate Framer modules in this window; no dependency/import.
const STUDY_POOL_KEY=Symbol.for("monarchic.gpu-budget.v1")
type StudyRenderer=ReturnType<typeof createRenderer>
interface StudyLease {
    canvas:HTMLCanvasElement
    renderer:StudyRenderer
    signature:string
}
interface StudyEntry {
    id:number
    source:string
    target:"canvas"|"preview"
    root:HTMLDivElement
    display:HTMLCanvasElement
    settings:Settings
    factory:typeof createRenderer
    notify:(status:Status,error?:string)=>void
    lease?:StudyLease
    rect:DOMRect
    visible:boolean
    hover:boolean
    focus:boolean
    pinUntil:number
    phase:number
    lastTick:number
    lastDraw:number
    lastKey:string
    needsStill:boolean
    hasFrame:boolean
    retryAt:number
    pointer:[number,number]
    smoothPointer:[number,number]
    emitted:string
    cleanup:()=>void
}
interface StudyPool {
    add:(entry:Omit<StudyEntry,"id"|"rect"|"visible"|"hover"|"focus"|"pinUntil"|"phase"|"lastTick"|"lastDraw"|"lastKey"|"needsStill"|"hasFrame"|"retryAt"|"pointer"|"smoothPointer"|"emitted"|"cleanup">)=>StudyEntry
    update:(entry:StudyEntry,next:Settings)=>void
    remove:(entry:StudyEntry)=>void
    request:(entry:StudyEntry)=>void
    runStatic:(work:()=>number|void)=>void
    debug:()=>unknown
}
function getStudyPool():StudyPool {
    const realm=window as unknown as {[key:symbol]:StudyPool|undefined}
    const shared=realm[STUDY_POOL_KEY]
    if(shared)return shared
    const entries=new Map<number,StudyEntry>(),cache=new Map<string,HTMLCanvasElement>()
    const completed=new Set<number>()
    let serial=0,timer=0,contexts=0,peakContexts=0,peakPixels=0,completedStillJobs=0
    let lastMeasure=0,lastWarm=0,dirty=true,listening=false
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)")
    let wasReduced=reduced.matches
    const ignored=new Set(["animate","static","canvasPreview","speed","interactive","managed","renderWidth","renderHeight","pixelBudget","colorHost"])
    const now=()=>performance.now()
    const emit=(entry:StudyEntry,status:Status,error="")=>{
        const signature=status+"/"+error
        if(entry.emitted!==signature){entry.emitted=signature;entry.notify(status,error||undefined)}
    }
    const key=(entry:StudyEntry)=>entry.source+"/"+Math.round(entry.rect.width/Math.max(1,entry.rect.height)*100)/100+"/"+JSON.stringify({...Object.fromEntries(Object.entries(entry.settings).filter(([name])=>!ignored.has(name))),resolvedPalette:[rgb(entry.settings.primary,entry.display),rgb(entry.settings.secondary,entry.display),rgb(entry.settings.ink,entry.display)]})
    const pixels=()=>[...entries.values()].reduce((total,e)=>total+(e.lease?e.lease.canvas.width*e.lease.canvas.height:0),0)
    const copy=(source:HTMLCanvasElement,target:HTMLCanvasElement)=>{
        if(target.width!==source.width)target.width=source.width
        if(target.height!==source.height)target.height=source.height
        const context=target.getContext("2d",{alpha:false})
        if(!context)throw new Error("Could not create the study display.")
        context.drawImage(source,0,0)
    }
    const smallCopy=(source:HTMLCanvasElement)=>{
        const result=document.createElement("canvas")
        const ratio=Math.min(1,Math.sqrt(24000/Math.max(1,source.width*source.height)))
        result.width=Math.max(1,Math.floor(source.width*ratio));result.height=Math.max(1,Math.floor(source.height*ratio))
        const context=result.getContext("2d",{alpha:false})
        if(!context)throw new Error("Could not retain a study frame.")
        context.drawImage(source,0,0,result.width,result.height)
        return result
    }
    const release=(entry:StudyEntry)=>{
        const lease=entry.lease
        if(!lease)return
        entry.phase=lease.renderer.getSnapshot().time
        entry.lease=undefined;entry.lastTick=0;entry.lastDraw=0
        try{lease.renderer.dispose()}finally{contexts--}
        // Keep the last owned frame in cheap CPU/2D storage after losing GL.
        if(entry.hasFrame){try{copy(smallCopy(entry.display),entry.display)}catch{}}
    }
    const settingsFor=(entry:StudyEntry,still:boolean):Settings=>({...entry.settings,
        managed:true,static:still||entry.settings.static,
        renderWidth:Math.max(1,entry.rect.width),renderHeight:Math.max(1,entry.rect.height),
        pixelBudget:still?24000:entry.target==="canvas"?150000:650000,
        colorHost:entry.display,
    })
    const signature=(settings:Settings)=>JSON.stringify(Object.fromEntries(Object.entries(settings).filter(([key])=>key!=="colorHost")))
    const acquire=(entry:StudyEntry,still:boolean):StudyLease|undefined=>{
        if(contexts>=2||entry.retryAt>now())return
        const canvas=document.createElement("canvas"),settings=settingsFor(entry,still)
        canvas.width=1;canvas.height=1
        // Reserve before compiling/allocating: initialization counts toward cap.
        contexts++;peakContexts=Math.max(peakContexts,contexts)
        try{
            const renderer=entry.factory(canvas,settings,(status,error)=>{if(status==="recovering"){entry.retryAt=now()+250;emit(entry,"recovering",error)}},still?entry.settings.stillTime:entry.phase)
            const lease={canvas,renderer,signature:signature(settings)}
            peakPixels=Math.max(peakPixels,pixels()+canvas.width*canvas.height)
            return lease
        }catch(error){
            contexts--;entry.retryAt=now()+5000
            emit(entry,"recovering",error instanceof Error?error.message:String(error))
            return
        }
    }
    const warm=(entry:StudyEntry)=>{
        const lease=acquire(entry,true)
        if(!lease)return
        try{
            lease.renderer.renderAt(entry.settings.stillTime)
            // Copy synchronously before the default framebuffer may be cleared.
            copy(lease.canvas,entry.display)
            const snapshot=smallCopy(entry.display),cacheKey=key(entry)
            cache.delete(cacheKey);cache.set(cacheKey,snapshot)
            while(cache.size>64)cache.delete(cache.keys().next().value as string)
            entry.hasFrame=true;entry.needsStill=false;entry.lastKey=cacheKey
            completed.add(entry.id);completedStillJobs++
        }catch(error){entry.retryAt=now()+5000;emit(entry,"recovering",String(error))}
        finally{try{lease.renderer.dispose()}finally{contexts--}}
    }
    const measure=()=>{
        const w=window.innerWidth,h=window.innerHeight
        for(const entry of entries.values()){
            entry.rect=entry.root.getBoundingClientRect()
            const r=entry.rect
            entry.visible=!document.hidden&&r.width>0&&r.height>0&&r.right>0&&r.bottom>0&&r.left<w&&r.top<h
            const cacheKey=key(entry)
            if(cacheKey!==entry.lastKey){
                entry.needsStill=true
                const cached=cache.get(cacheKey)
                if(cached){copy(cached,entry.display);entry.hasFrame=true;entry.needsStill=false;entry.lastKey=cacheKey;completed.add(entry.id)}
            }
        }
        dirty=false;lastMeasure=now()
    }
    const visibleArea=(entry:StudyEntry)=>{
        const r=entry.rect
        return Math.max(0,Math.min(window.innerWidth,r.right)-Math.max(0,r.left))*Math.max(0,Math.min(window.innerHeight,r.bottom)-Math.max(0,r.top))
    }
    const rank=(entry:StudyEntry,time:number)=>{
        const r=entry.rect,priority=entry.focus?3:entry.pinUntil>time?2:entry.hover?1:0
        const distance=Math.hypot(r.left+r.width/2-window.innerWidth/2,r.top+r.height/2-window.innerHeight/2)
        return priority*1000000-distance
    }
    const eligible=(entry:StudyEntry,time:number)=>{
        if(!entry.visible||entry.retryAt>time||entry.settings.static||!entry.settings.animate||entry.settings.speed<=0||reduced.matches)return false
        if(entry.target==="preview")return true
        if(!entry.settings.canvasPreview)return false
        // Screen-space LOD includes Framer's transform zoom. Hysteresis keeps
        // admission steady near the boundary; a deliberate Play can override.
        const keep=Boolean(entry.lease),r=entry.rect
        return entry.pinUntil>time||(r.width>=(keep?120:160)&&r.height>=(keep?80:100)&&visibleArea(entry)>=(keep?12000:24000))
    }
    const wake=()=>{
        dirty=true
        if(!timer&&entries.size)timer=window.setTimeout(pump,0)
    }
    const pump=()=>{
        timer=0
        if(!entries.size)return
        const time=now()
        if(reduced.matches!==wasReduced){
            wasReduced=reduced.matches
            if(wasReduced)for(const entry of entries.values()){release(entry);entry.phase=entry.settings.stillTime;entry.needsStill=true;entry.lastKey=""}
            dirty=true
        }
        if(dirty||time-lastMeasure>=125)measure()
        const visible=[...entries.values()].filter(e=>e.visible)
        const cold=visible.filter(e=>e.needsStill&&!e.lease&&e.retryAt<=time).sort((a,b)=>rank(b,time)-rank(a,time))
        const candidates=visible.filter(e=>eligible(e,time)).sort((a,b)=>rank(b,time)-rank(a,time))
        // One editor animation; Preview can use two, reserving a warm-up slot
        // while visible cold cards still need deterministic overview frames.
        const selected:StudyEntry[]=[]
        for(const entry of candidates){
            if(selected.length>=(cold.length?1:2))break
            if(entry.target==="canvas"&&selected.some(e=>e.target==="canvas"))continue
            selected.push(entry)
        }
        for(const entry of entries.values())if(entry.lease&&!selected.includes(entry))release(entry)
        let created=false
        for(const entry of selected){
            if(!entry.lease&&!created){entry.lease=acquire(entry,false);created=Boolean(entry.lease)}
            const lease=entry.lease
            if(!lease)continue
            try{
            if(lease.renderer.getSnapshot().lost){release(entry);entry.retryAt=time+250;emit(entry,"recovering");continue}
            const settings=settingsFor(entry,false),nextSignature=signature(settings)
            if(lease.signature!==nextSignature){lease.renderer.update(settings);lease.signature=nextSignature}
            const period=1000/(entry.target==="canvas"?12:30)
            if(!entry.lastTick)entry.lastTick=time
            entry.phase+=Math.min((time-entry.lastTick)/1000,.1)*entry.settings.speed;entry.lastTick=time
            if(time-entry.lastDraw>=period||!entry.hasFrame){
                entry.smoothPointer=entry.smoothPointer.map((v,i)=>v+(entry.pointer[i]-v)*.18) as [number,number]
                lease.renderer.setPointer(...(entry.settings.interactive?entry.smoothPointer:[0,0] as [number,number]))
                lease.renderer.renderAt(entry.phase)
                copy(lease.canvas,entry.display);entry.hasFrame=true;entry.needsStill=false;entry.lastKey=key(entry)
                entry.lastDraw=time;completed.add(entry.id)
            }
            emit(entry,"running")
            }catch(error){
                // One failing graphics/copy operation must not stop the shared
                // clock or retain its lease while other studies wait.
                release(entry);entry.retryAt=time+5000;entry.needsStill=true
                emit(entry,"recovering",error instanceof Error?error.message:String(error))
            }
        }
        // One still job per task yields between jobs. Guaranteed progress also
        // prevents rapid focus/hover changes from starving the overview queue.
        if(contexts<2&&(!created||time-lastWarm>=125)){const next=cold.find(e=>!selected.includes(e));if(next){warm(next);lastWarm=time}}
        for(const entry of entries.values())if(!entry.lease){
            const status:Status=entry.settings.static?"static":reduced.matches?"reduced-motion":!entry.settings.animate||entry.settings.speed<=0?"paused":!entry.visible?"offscreen":"waiting"
            if(entry.retryAt<=time)emit(entry,status)
        }
        peakPixels=Math.max(peakPixels,pixels())
        // One shared clock also notices transform-only zoom changes, which do
        // not trigger ResizeObserver and may leave intersection ratios intact.
        if(!document.hidden)timer=window.setTimeout(pump,selected.some(e=>e.target==="preview")?16:40)
    }
    const start=()=>{
        if(listening)return
        listening=true
        window.addEventListener("resize",wake);window.addEventListener("scroll",wake,true)
        document.addEventListener("visibilitychange",wake);reduced.addEventListener("change",wake)
    }
    const stop=()=>{
        if(timer)clearTimeout(timer);timer=0
        if(!listening)return
        listening=false
        window.removeEventListener("resize",wake);window.removeEventListener("scroll",wake,true)
        document.removeEventListener("visibilitychange",wake);reduced.removeEventListener("change",wake)
    }
    const pool:StudyPool={
        add(input){
            const entry:StudyEntry={...input,id:++serial,rect:input.root.getBoundingClientRect(),visible:false,hover:false,focus:false,pinUntil:0,phase:input.settings.stillTime,lastTick:0,lastDraw:0,lastKey:"",needsStill:true,hasFrame:false,retryAt:0,pointer:[0,0],smoothPointer:[0,0],emitted:"",cleanup:()=>{}}
            const enter=()=>{entry.hover=true;wake()},leave=()=>{entry.hover=false;entry.pointer=[0,0];wake()}
            const focus=()=>{entry.focus=true;wake()},blur=()=>{entry.focus=entry.root.contains(document.activeElement);wake()}
            const pointer=(event:PointerEvent)=>{const r=entry.root.getBoundingClientRect();entry.pointer=[(event.clientX-r.left)/Math.max(1,r.width)-.5,.5-(event.clientY-r.top)/Math.max(1,r.height)]}
            input.root.addEventListener("pointerenter",enter);input.root.addEventListener("pointerleave",leave)
            input.root.addEventListener("focusin",focus);input.root.addEventListener("focusout",blur);input.root.addEventListener("pointermove",pointer)
            const observer=new ResizeObserver(wake);observer.observe(input.root)
            entry.cleanup=()=>{observer.disconnect();input.root.removeEventListener("pointerenter",enter);input.root.removeEventListener("pointerleave",leave);input.root.removeEventListener("focusin",focus);input.root.removeEventListener("focusout",blur);input.root.removeEventListener("pointermove",pointer)}
            entries.set(entry.id,entry);start();wake();return entry
        },
        update(entry,next){
            const reset=next.mode!==entry.settings.mode||next.stillTime!==entry.settings.stillTime||(next.static&&!entry.settings.static)
            entry.settings=next
            if(reset){release(entry);entry.phase=next.stillTime;entry.lastTick=0;entry.lastKey="";entry.needsStill=true}
            if(!next.interactive){entry.pointer=[0,0];entry.smoothPointer=[0,0]}
            wake()
        },
        remove(entry){release(entry);entry.cleanup();entries.delete(entry.id);completed.delete(entry.id);if(!entries.size)stop();else wake()},
        request(entry){entry.pinUntil=now()+4000;wake()},
        runStatic(work){
            // Exports are synchronous: evict our live leases before reserving
            // the one-shot context, including during target/StrictMode changes.
            for(const entry of entries.values())release(entry)
            contexts++;peakContexts=Math.max(peakContexts,contexts)
            try{const size=work();if(typeof size==="number")peakPixels=Math.max(peakPixels,size)}finally{contexts--;wake()}
        },
        debug(){return{version:1,activeContexts:contexts,peakContexts,peakPixels,entryCount:entries.size,cacheSize:cache.size,completedStillJobs,completedIds:[...completed],pendingStillIds:[...entries.values()].filter(e=>e.needsStill).map(e=>e.id),live:[...entries.values()].filter(e=>e.lease).map(e=>({id:e.id,source:e.source,mode:e.settings.mode,target:e.target,pixels:e.lease!.canvas.width*e.lease!.canvas.height,phase:e.phase})),entries:[...entries.values()].map(e=>({id:e.id,source:e.source,mode:e.settings.mode,target:e.target,visible:e.visible,hasFrame:e.hasFrame,phase:e.phase,screenWidth:e.rect.width,screenHeight:e.rect.height}))}},
    }
    realm[STUDY_POOL_KEY]=pool
    return pool
}
function useStudySurface(root:React.RefObject<HTMLDivElement>,display:React.RefObject<HTMLCanvasElement>,settings:Settings,target:ReturnType<typeof RenderTarget.current>,source:string,notify:(status:Status,error?:string)=>void){
    const entry=React.useRef<StudyEntry|null>(null),pool=React.useRef<StudyPool|null>(null)
    const current=React.useRef(settings),callback=React.useRef(notify)
    const staticKey=React.useRef("")
    const snapshot=React.useRef<{mode:Mode,stillTime:number,time:number}|null>(null)
    current.current=settings;callback.current=notify
    const oneShot=()=>{
        if(!display.current)return
        const gpu=document.createElement("canvas"),host=display.current,next=current.current
        gpu.width=1;gpu.height=1
        let renderer:StudyRenderer|undefined
        try{
            renderer=createRenderer(gpu,{...next,managed:true,static:true,renderWidth:host.clientWidth||root.current?.clientWidth||960,renderHeight:host.clientHeight||root.current?.clientHeight||600,pixelBudget:650000,colorHost:host},(s,e)=>callback.current(s,e),next.stillTime)
            renderer.renderAt(next.stillTime)
            host.width=gpu.width;host.height=gpu.height
            const context=host.getContext("2d",{alpha:false})
            if(!context)throw new Error("Could not create the study display.")
            context.drawImage(gpu,0,0);callback.current("static");return gpu.width*gpu.height
        }catch(error){callback.current("recovering",String(error))}
        finally{renderer?.dispose()}
    }
    React.useLayoutEffect(()=>{
        if(!root.current||!display.current)return
        if(target===RenderTarget.export||target===RenderTarget.thumbnail)return
        staticKey.current=""
        const shared=getStudyPool();pool.current=shared
        const added=shared.add({root:root.current,display:display.current,source,target:target===RenderTarget.canvas?"canvas":"preview",settings:current.current,factory:createRenderer,notify:(s,e)=>callback.current(s,e)})
        const saved=snapshot.current
        if(saved?.mode===current.current.mode&&saved.stillTime===current.current.stillTime)added.phase=saved.time
        entry.current=added
        return()=>{snapshot.current={mode:added.settings.mode,stillTime:added.settings.stillTime,time:added.phase};shared.remove(added);entry.current=null;pool.current=null}
    },[target])
    React.useLayoutEffect(()=>{
        if(entry.current)pool.current?.update(entry.current,settings)
        else if(target===RenderTarget.export||target===RenderTarget.thumbnail){
            const key=String(target)+"/"+JSON.stringify(settings)+"/"+(display.current?.clientWidth??0)+"/"+(display.current?.clientHeight??0)
            if(staticKey.current!==key){staticKey.current=key;getStudyPool().runStatic(oneShot)}
        }
    },[settings,target])
    return()=>{if(entry.current)pool.current?.request(entry.current)}
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 600
 */
export default function PointCodingStudy(props: Props) {
    const {study="folded",animate=true,canvasMotion=false,speed=.65,stillTime=8,intensity=1.1,
        scale=1,density=1,interactive=true,
        primary="#f4f7fb",secondary="#8a939f",ink="#020304",showLabels=true,style}=props
    const staticRenderer=useIsStaticRenderer(),target=RenderTarget.current()
    const canvasPreview=canvasMotion&&target===RenderTarget.canvas
    const isStatic=target===RenderTarget.export||target===RenderTarget.thumbnail||(staticRenderer&&!canvasPreview)
    const root=React.useRef<HTMLDivElement>(null),canvas=React.useRef<HTMLCanvasElement>(null)
    const [paused,setPaused]=React.useState(false)
    const [status,setStatus]=React.useState<Status>("offscreen"),[error,setError]=React.useState("")
    const settings:Settings={mode:study,animate:animate&&!paused,static:isStatic,canvasPreview,speed:Math.max(0,speed),stillTime,intensity,
        scale:Math.max(.5,Math.min(1.5,scale)),density:Math.max(.35,Math.min(1.8,density)),interactive,primary,secondary,ink}
    const requestMotion=useStudySurface(root,canvas,settings,target,"PointCodingStudy.tsx",(s,e)=>{setStatus(s);setError(e??"")})
    const source=SOURCES[study],color="#e2e6ef"
    const mono:React.CSSProperties={fontFamily:'"IBM Plex Mono", monospace',fontSize:10,letterSpacing:".045em",lineHeight:1.5}
    return <div ref={root} role="group" aria-label={source.title} style={{width:"100%",height:"100%",...style,position:"relative",overflow:"hidden",background:ink,color}}>
        <canvas ref={canvas} role="img" aria-label={source.title+", animated source-led study of "+source.key+" by "+source.account} style={{display:"block",width:"100%",height:"100%",touchAction:"pan-y"}} />
        {showLabels&&<>
            <div style={{position:"absolute",left:"5%",top:"6%",pointerEvents:"none"}}>
                <div style={{...mono,opacity:.65}}>SOURCE-LED CODE STUDY / {source.key}</div>
                <div style={{fontFamily:'"Space Grotesk", sans-serif',fontSize:"clamp(14px,2vw,23px)",letterSpacing:"-.035em",marginTop:8,maxWidth:"75%"}}>{source.title}</div>
            </div>
            <a href={source.url} target="_blank" rel="noreferrer" style={{...mono,position:"absolute",left:"5%",bottom:"5%",color,textDecoration:"underline",textUnderlineOffset:3}}>{source.account} ↗</a>
            <div style={{...mono,position:"absolute",right:"5%",bottom:"5%",opacity:.65,pointerEvents:"none",fontSize:8,maxWidth:"55%",textAlign:"right"}}>INDEPENDENT GEOMETRY / SOURCE MOTION APPROXIMATED</div>
        </>}
        {!isStatic&&<button onClick={()=>{if(status==="waiting"){setPaused(false);requestMotion()}else setPaused(p=>!p)}} disabled={status==="reduced-motion"||!animate||speed<=0} aria-pressed={paused} aria-label={paused||status==="waiting"?"Play animation":"Pause animation"} style={{...mono,position:"absolute",right:"5%",top:"6%",padding:"5px 9px",color,background:"transparent",border:"1px solid "+color,cursor:"pointer",opacity:.75}}>
            {status==="reduced-motion"?"REDUCED MOTION":!animate||speed<=0?"MOTION OFF":paused||status==="waiting"?"PLAY":"PAUSE"}
        </button>}
        {(error||status==="recovering")&&<div role="status" style={{...mono,position:"absolute",inset:"40% 10%",textAlign:"center"}}>{error?<>Graphics unavailable in this browser.<br/>Enable WebGL to view this study.</>:"Restoring graphics…"}</div>}
    </div>
}
addPropertyControls(PointCodingStudy,{
    study:{type:ControlType.Enum,title:"Study",options:["folded","curl","loops","feather"],optionTitles:["Folded mesh","Curling gesture","Connected loops","Mesh feather"],defaultValue:"folded"},
    animate:{type:ControlType.Boolean,title:"Animate",defaultValue:true},
    canvasMotion:{type:ControlType.Boolean,title:"Canvas motion",defaultValue:false},
    speed:{type:ControlType.Number,title:"Speed",min:0,max:2,step:.05,defaultValue:.65},
    stillTime:{type:ControlType.Number,title:"Still time",min:0,max:60,step:.5,defaultValue:8},
    intensity:{type:ControlType.Number,title:"Intensity",min:.2,max:2.5,step:.05,defaultValue:1.1},
    scale:{type:ControlType.Number,title:"Scale",min:.5,max:1.5,step:.05,defaultValue:1},
    density:{type:ControlType.Number,title:"Density",min:.35,max:1.8,step:.05,defaultValue:1},
    primary:{type:ControlType.Color,title:"Primary",defaultValue:"#f4f7fb"},
    secondary:{type:ControlType.Color,title:"Secondary",defaultValue:"#8a939f"},
    ink:{type:ControlType.Color,title:"Ink",defaultValue:"#020304"},
    interactive:{type:ControlType.Boolean,title:"Mouse",defaultValue:true},
    showLabels:{type:ControlType.Boolean,title:"Credits",defaultValue:true},
})
