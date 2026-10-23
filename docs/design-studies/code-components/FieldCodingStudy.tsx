import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget, useIsStaticRenderer } from "framer"

// Source-led field studies. These are independently authored visual and motion
// approximations: no source shader, image, simulation or recording is embedded.
type Mode = "radial" | "ridge" | "corridor" | "glyphs"
type Status = "running" | "paused" | "static" | "reduced-motion" | "offscreen" | "recovering"
interface Props {
    study?: Mode
    animate?: boolean
    canvasMotion?: boolean
    speed?: number
    stillTime?: number
    intensity?: number
    scale?: number
    grain?: number
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
    grain: number
    interactive: boolean
    primary: string
    secondary: string
    ink: string
}
const SOURCES = {
    radial: { key: "CC-006", title: "Electric radial / icy filaments", account: "@YoheiNishitsuji", url: "https://x.com/YoheiNishitsuji/status/2106013834540732704" },
    ridge: { key: "CC-017", title: "Icy ridge / layered flow", account: "@YoheiNishitsuji", url: "https://x.com/YoheiNishitsuji/status/2098403689421570237" },
    corridor: { key: "CC-018", title: "Warm corridor / recursive relief", account: "@XorDev", url: "https://x.com/XorDev/status/2099543044945023343" },
    glyphs: { key: "CC-019", title: "Glyph trails / luminous gestures", account: "@tsumiki_room", url: "https://x.com/tsumiki_room/status/2099891155282612462" },
}
const VERTEX = `
attribute vec2 a_position;
void main(){gl_Position=vec4(a_position,0.0,1.0);}
`
const FRAGMENT = `
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_mode;
uniform float u_intensity;
uniform float u_scale;
uniform float u_grain;
uniform vec3 u_primary;
uniform vec3 u_secondary;
uniform vec3 u_ink;
const float PI=3.14159265359;
mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float hash(float x){return fract(sin(x*127.1+311.7)*43758.5453);}
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
    vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(hash2(i),hash2(i+vec2(1,0)),f.x),mix(hash2(i+vec2(0,1)),hash2(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){
    float v=0.0,a=.5;
    for(int i=0;i<4;i++){v+=a*noise(p);p=mat2(1.6,1.2,-1.2,1.6)*p+vec2(4.3,1.7);a*=.5;}
    return v;
}
vec3 lightColor(float blue,float white){
    return 1.0-exp(-(u_secondary*blue+u_primary*white)*u_intensity);
}
vec3 radial(vec2 uv){
    // A folded polar field, with warped multi-scale branches. The luminous
    // center and dense radial relief are observed motifs, not a copied formula.
    vec2 p=uv-vec2(.02,.10)-u_mouse*.035;
    float r=max(length(p),.003),a=atan(p.y,p.x),t=u_time*.22;
    vec2 direction=vec2(cos(a),sin(a));
    float warp=fbm(direction*3.0+vec2(log(r+.04)*1.9,t*.35));
    float bent=a+.11*sin(a*7.0+r*8.0-t)+.17*(warp-.5);
    float radialPhase=log(r+.045)*13.0-t*2.3;
    float branches=sin(bent*27.0+radialPhase+3.0*warp);
    float fine=sin(bent*73.0-radialPhase*1.3+4.0*warp);
    float vein=exp(-abs(branches)*14.0),thread=exp(-abs(fine)*23.0);
    float detail=fbm(p*34.0+direction*t*.17);
    float ridge=pow(.5+.5*sin(radialPhase*1.4+warp*12.0),5.0);
    float density=.35+.65*smoothstep(.05,.5,r);
    float haze=exp(-r*1.35)*(.22+.4*warp);
    float fingers=vein*(.28+.85*detail)+thread*.30;
    float core=exp(-r*21.0)*2.5;
    float outer=1.0-smoothstep(.25,1.05,r);
    float white=(fingers*(.55+ridge)*density+core)*outer;
    float blue=(haze+fingers*.55+ridge*.10)*outer;
    vec3 c=lightColor(blue*1.8,white*1.3);
    return mix(u_ink,c,clamp(outer+.25,0.0,1.0));
}
vec3 ridge(vec2 uv){
    // An oblique luminous boundary with stacked, advecting ridges above it.
    // The lower-left remains dark negative space, as in the observed crop.
    vec2 p=rot(-.57)*(uv-u_mouse*.025);
    float t=u_time*.18;
    float base=-.105+.025*sin(p.x*6.0-t)+.018*sin(p.x*15.0+t*.6);
    float h=p.y-base;
    float n=fbm(vec2(p.x*5.8+t*.6,h*8.0-t*.3));
    float fold=h+.035*sin(p.x*22.0+h*17.0+t)+.055*(n-.5);
    float layers=sin(fold*94.0+6.0*n+sin(p.x*12.0+t)*1.5);
    float veins=exp(-abs(layers)*12.0);
    float strands=exp(-abs(sin(p.x*93.0+fold*38.0+n*12.0-t))*20.0);
    float front=exp(-abs(h)*125.0);
    float above=smoothstep(-.012,.018,h);
    float mass=exp(-max(h,0.0)*2.1)*above;
    float detail=.4+.6*fbm(vec2(p.x*29.0-t,h*39.0+t*.7));
    float white=front*2.4+mass*veins*(.22+.8*detail)+mass*strands*.12;
    float blue=mass*(.18+.30*n+veins*.40)+front*.20;
    float falloff=1.0-smoothstep(.28,.80,h);
    return mix(u_ink,lightColor(blue*1.5,white),clamp(falloff,0.0,1.0));
}
float corridorDistance(vec3 p){
    // Square room walls, repeated rectangular ribs and a bounded relief field.
    // This is an original architectural distance field, not the source fractal.
    float radius=max(abs(p.x),abs(p.y));
    float relief=.017*sin(p.x*31.0+p.z*8.0)*sin(p.y*27.0-p.z*5.0);
    relief+=.009*sin(p.x*69.0+p.y*39.0+p.z*19.0);
    float walls=1.10-radius+relief;
    float slab=abs(mod(p.z+.7,1.4)-.7)-.065;
    float frame=max(abs(radius-.99)-.105,slab);
    return min(walls,frame);
}
vec3 corridor(vec2 uv){
    vec3 ro=vec3(.14+.025*sin(u_time*.17),-.04,u_time*.38);
    vec3 rd=normalize(vec3(uv*1.72+u_mouse*.06,1.22));
    rd.xy=rot(.035*sin(u_time*.12))*rd.xy;
    float travel=.03;vec3 q=ro;bool hit=false;
    for(int i=0;i<64;i++){
        q=ro+rd*travel;float d=corridorDistance(q);
        if(d<.0018){hit=true;break;}
        travel+=max(d*.65,.0015);if(travel>19.0)break;
    }
    if(!hit)return u_ink;
    vec2 e=vec2(.002,0);
    vec3 normal=normalize(vec3(corridorDistance(q+e.xyy)-corridorDistance(q-e.xyy),corridorDistance(q+e.yxy)-corridorDistance(q-e.yxy),corridorDistance(q+e.yyx)-corridorDistance(q-e.yyx)));
    float light=.18+.82*max(dot(normal,normalize(vec3(-.35,.48,-.75))),0.0);
    float relief=fbm(q.xy*18.0+vec2(q.z*2.1,-q.z*1.4));
    float cracks=pow(.5+.5*sin(q.z*38.0+q.x*51.0+q.y*57.0+relief*12.0),15.0);
    float ribs=exp(-abs(sin(q.z*PI/1.4))*15.0);
    float distanceFade=exp(-travel*.21);
    vec3 material=mix(u_secondary,u_primary,clamp(light*.7+relief*.3,0.0,1.0));
    vec3 color=material*(light*.8+cracks*.30+ribs*.55)*u_intensity*distanceFade;
    color+=u_secondary*(.06+.08*relief)*distanceFade;
    return mix(u_ink,1.0-exp(-color*1.8),clamp(distanceFade*1.8,0.0,1.0));
}
float segment(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return length(p-a-d*clamp(dot(p-a,d)/dot(d,d),0.0,1.0));}
float arc(vec2 p,vec2 radii,float opening,float phase){
    vec2 q=p/radii;
    float d=abs(length(q)-1.0)*min(radii.x,radii.y);
    float angle=atan(q.y,q.x);
    float gate=abs(atan(sin(angle-phase),cos(angle-phase)));
    return max(d,(opening-gate)*.11);
}
float gesture(vec2 p,float kind,float phase){
    // Four abstract stroke families: open loops, a loop with a stem, paired
    // loops and a hook. These suggest drawn marks rather than source lettering.
    float d=arc(p,vec2(.105,.15),.55,phase);
    if(kind<.5)return d;
    if(kind<1.5){
        d=arc(p-vec2(.015,.035),vec2(.085,.115),.4,phase+.4);
        return min(d,segment(p,vec2(-.07,-.20),vec2(-.055,.12)));
    }
    if(kind<2.5){
        d=arc(p-vec2(0,.095),vec2(.075,.09),.4,phase);
        return min(d,arc(p+vec2(0,.075),vec2(.095,.11),.45,phase+PI));
    }
    d=arc(p-vec2(.02,.05),vec2(.09,.11),.95,phase+.8);
    d=min(d,segment(p,vec2(-.065,-.12),vec2(-.04,.12)));
    return min(d,segment(p,vec2(-.065,-.12),vec2(.055,-.12)));
}
vec3 glyphs(vec2 uv){
    vec3 glow=vec3(0);float t=u_time*.28;
    for(int i=0;i<18;i++){
        float k=float(i),seed=hash(k+2.0);
        vec2 center=vec2((hash(k+18.0)-.5)*1.55,(hash(k+37.0)-.5)*.82);
        float size=.28+.75*hash(k+48.0);
        if(i<4){center=vec2((k-1.5)*.12,.02+.025*sin(k));size=1.05;}
        float kind=floor(hash(k+71.0)*4.0),angle=(hash(k+91.0)-.5)*1.8;
        for(int j=0;j<3;j++){
            float lag=float(j)*.24,phase=t-lag;
            vec2 drift=vec2(sin(phase*.85+k*2.0),cos(phase*.7+k))*vec2(.016,.012);
            vec2 p=rot(angle+.14*sin(phase+k))*(uv-center-drift-u_mouse*.018)/size;
            float d=gesture(p,kind,phase*.8+k);
            float width=(.0018+.0015*seed)/size;
            float core=exp(-d*d/(width*width));
            float halo=exp(-d*100.0*size)*.11;
            float fade=exp(-float(j)*1.45);
            float flicker=.7+.3*sin(t*.7+k*2.3);
            glow+=mix(u_primary,u_secondary,step(.57,seed))*(core+halo)*fade*flicker;
        }
    }
    return u_ink+(1.0-exp(-glow*u_intensity*1.2));
}
void main(){
    vec2 uv=(gl_FragCoord.xy-.5*u_resolution)/u_resolution.y;
    float fit=min(1.0,u_resolution.x/u_resolution.y/1.3);
    uv/=u_scale*fit;
    vec3 color;
    if(u_mode<.5)color=radial(uv);
    else if(u_mode<1.5)color=ridge(uv);
    else if(u_mode<2.5)color=corridor(uv);
    else color=glyphs(uv);
    // Spatial material grain stays deterministic when rendering a frozen frame.
    float grain=(hash2(floor(gl_FragCoord.xy))-.5)*u_grain*.035;
    color+=grain*(.15+sqrt(max(dot(color,vec3(.333)),0.0)));
    gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);
}
`
interface Resources {
    field: WebGLProgram
    quad: WebGLBuffer
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
        gl.deleteBuffer(resources.quad);gl.deleteProgram(resources.field)
        resources=undefined;locations.clear()
    }
    const allocate = () => {
        let field:WebGLProgram|undefined,quad:WebGLBuffer|null=null
        try {
            field=program(VERTEX,FRAGMENT);quad=gl.createBuffer()
            if(!quad)throw new Error("Could not allocate graphics resources.")
            gl.bindBuffer(gl.ARRAY_BUFFER,quad)
            gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW)
            resources={field,quad}
        } catch(error) {
            if(quad)gl.deleteBuffer(quad);if(field)gl.deleteProgram(field)
            throw error
        }
    }
    const canRun = () => !disposed&&!lost&&Boolean(resources)&&visible&&!document.hidden&&!motion.matches&&!settings.static&&settings.animate&&settings.speed>0&&width>0&&height>0
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
        gl.uniform1f(location(p,"u_grain"),settings.grain)
        gl.uniform1f(location(p,"u_mode"),settings.mode==="radial"?0:settings.mode==="ridge"?1:settings.mode==="corridor"?2:3)
        gl.uniform3fv(location(p,"u_primary"),rgb(settings.primary,canvas))
        gl.uniform3fv(location(p,"u_secondary"),rgb(settings.secondary,canvas))
        gl.uniform3fv(location(p,"u_ink"),rgb(settings.ink,canvas))
    }
    const draw = () => {
        if(disposed||lost||!resources||width<=0||height<=0) return
        gl.viewport(0,0,canvas.width,canvas.height)
        gl.disable(gl.DITHER)
        gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(resources.field);uniforms(resources.field)
        gl.bindBuffer(gl.ARRAY_BUFFER,resources.quad)
        const a=gl.getAttribLocation(resources.field,"a_position")
        gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0)
        gl.drawArrays(gl.TRIANGLES,0,6);gl.disableVertexAttribArray(a)
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
        width=canvas.clientWidth; height=canvas.clientHeight
        // Logical size ignores the editor's canvas zoom; limit actual GPU area.
        const pixelBudget=settings.canvasPreview?150000:650000
        const ratio=Math.min(window.devicePixelRatio||1,1.5,Math.sqrt(pixelBudget/Math.max(1,width*height)))
        canvas.width=Math.max(1,Math.floor(width*ratio)); canvas.height=Math.max(1,Math.floor(height*ratio))
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
    allocate()
    const sizeObserver=new ResizeObserver(resize)
    const intersection=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;reconcile()})
    sizeObserver.observe(canvas); intersection.observe(canvas)
    canvas.addEventListener("pointermove",pointer);canvas.addEventListener("pointerleave",leave)
    canvas.addEventListener("webglcontextlost",onLost);canvas.addEventListener("webglcontextrestored",onRestored)
    motion.addEventListener("change",reconcile);document.addEventListener("visibilitychange",reconcile)
    resize()
    return {
        update(next:Settings) {
            const reset=next.mode!==settings.mode||next.stillTime!==settings.stillTime
            const resizeNeeded=next.canvasPreview!==settings.canvasPreview
            settings=next
            if(reset)time=next.stillTime
            if(!next.interactive){mouse=[0,0];targetMouse=[0,0]}
            if(resizeNeeded)resize();else reconcile()
        },
        getSnapshot(){return {mode:settings.mode,stillTime:settings.stillTime,time}},
        renderAt(seconds:number) { stop();time=seconds;draw() },
        dispose() {
            disposed=true;stop();sizeObserver.disconnect();intersection.disconnect()
            canvas.removeEventListener("pointermove",pointer);canvas.removeEventListener("pointerleave",leave)
            canvas.removeEventListener("webglcontextlost",onLost);canvas.removeEventListener("webglcontextrestored",onRestored)
            motion.removeEventListener("change",reconcile);document.removeEventListener("visibilitychange",reconcile)
            release()
            // StrictMode can replay cleanup/setup on a connected canvas.
            // Only release the context slot after its DOM node is detached.
            queueMicrotask(()=>{if(!canvas.isConnected)gl.getExtension("WEBGL_lose_context")?.loseContext()})
        },
    }
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 600
 */
export default function FieldCodingStudy(props: Props) {
    const {study="radial",animate=true,canvasMotion=false,speed=.65,stillTime=8,intensity=1.1,
        scale=1,grain=.35,interactive=true,
        primary="#b5f1ff",secondary="#2c6be4",ink="#01040c",showLabels=true,style}=props
    const staticRenderer=useIsStaticRenderer(),target=RenderTarget.current()
    const canvasPreview=canvasMotion&&target===RenderTarget.canvas
    const isStatic=target===RenderTarget.export||target===RenderTarget.thumbnail||(staticRenderer&&!canvasPreview)
    const root=React.useRef<HTMLDivElement>(null),canvas=React.useRef<HTMLCanvasElement>(null)
    const renderer=React.useRef<ReturnType<typeof createRenderer>|null>(null)
    const snapshot=React.useRef<{mode:Mode,stillTime:number,time:number}|null>(null)
    const [inView,setInView]=React.useState(false),[paused,setPaused]=React.useState(false)
    const [status,setStatus]=React.useState<Status>("offscreen"),[error,setError]=React.useState("")
    const active=target===RenderTarget.export||target===RenderTarget.thumbnail||inView
    const settings:Settings={mode:study,animate:animate&&!paused,static:isStatic,canvasPreview,speed:Math.max(0,speed),stillTime,intensity,
        scale:Math.max(.5,scale),grain:Math.max(0,grain),interactive,primary,secondary,ink}
    const current=React.useRef(settings);current.current=settings
    React.useEffect(()=>{
        if(!root.current)return
        const observer=new IntersectionObserver(entries=>setInView(entries[0]?.isIntersecting??false),{rootMargin:"120px"})
        observer.observe(root.current);return()=>observer.disconnect()
    },[])
    React.useEffect(()=>{
        if(!active||!canvas.current)return
        const saved=snapshot.current,next=current.current
        const phase=saved?.mode===next.mode&&saved.stillTime===next.stillTime?saved.time:next.stillTime
        let instance:ReturnType<typeof createRenderer>|null=null
        try { instance=createRenderer(canvas.current,next,(s,e)=>{setStatus(s);setError(e??"")},phase);renderer.current=instance }
        catch(problem){setError(problem instanceof Error?problem.message:String(problem))}
        return()=>{if(instance){snapshot.current=instance.getSnapshot();instance.dispose()}renderer.current=null}
    },[active])
    React.useEffect(()=>{renderer.current?.update(settings)},[study,animate,paused,isStatic,canvasPreview,speed,stillTime,intensity,scale,grain,interactive,primary,secondary,ink])
    const source=SOURCES[study],color="#e2e6ef"
    const mono:React.CSSProperties={fontFamily:'"IBM Plex Mono", monospace',fontSize:10,letterSpacing:".045em",lineHeight:1.5}
    return <div ref={root} role="group" aria-label={source.title} style={{width:"100%",height:"100%",...style,position:"relative",overflow:"hidden",background:ink,color}}>
        {active&&<canvas ref={canvas} role="img" aria-label={source.title+", animated source-led study of "+source.key+" by "+source.account} style={{display:"block",width:"100%",height:"100%",touchAction:"pan-y"}} />}
        {showLabels&&<>
            <div style={{position:"absolute",left:"5%",top:"6%",pointerEvents:"none"}}>
                <div style={{...mono,opacity:.65}}>SOURCE-LED CODE STUDY / {source.key}</div>
                <div style={{fontFamily:'"Space Grotesk", sans-serif',fontSize:"clamp(14px,2vw,23px)",letterSpacing:"-.035em",marginTop:8,maxWidth:"75%"}}>{source.title}</div>
            </div>
            <a href={source.url} target="_blank" rel="noreferrer" style={{...mono,position:"absolute",left:"5%",bottom:"5%",color,textDecoration:"underline",textUnderlineOffset:3}}>{source.account} ↗</a>
            <div style={{...mono,position:"absolute",right:"5%",bottom:"5%",opacity:.65,pointerEvents:"none",fontSize:8,maxWidth:"55%",textAlign:"right"}}>INDEPENDENT CODE / SOURCE EFFECT APPROXIMATED</div>
        </>}
        {active&&!isStatic&&<button onClick={()=>setPaused(p=>!p)} disabled={status==="reduced-motion"||!animate||speed<=0} aria-pressed={paused} aria-label={paused?"Play animation":"Pause animation"} style={{...mono,position:"absolute",right:"5%",top:"6%",padding:"5px 9px",color,background:"transparent",border:"1px solid "+color,cursor:"pointer",opacity:.75}}>
            {status==="reduced-motion"?"REDUCED MOTION":!animate||speed<=0?"MOTION OFF":paused?"PLAY":"PAUSE"}
        </button>}
        {(error||status==="recovering")&&<div role="status" style={{...mono,position:"absolute",inset:"40% 10%",textAlign:"center"}}>{error?<>Graphics unavailable in this browser.<br/>Enable WebGL to view this study.</>:"Restoring graphics…"}</div>}
    </div>
}
addPropertyControls(FieldCodingStudy,{
    study:{type:ControlType.Enum,title:"Study",options:["radial","ridge","corridor","glyphs"],optionTitles:["Electric radial","Icy ridge flow","Warm corridor","Glyph trails"],defaultValue:"radial"},
    animate:{type:ControlType.Boolean,title:"Animate",defaultValue:true},
    canvasMotion:{type:ControlType.Boolean,title:"Canvas motion",defaultValue:false},
    speed:{type:ControlType.Number,title:"Speed",min:0,max:2,step:.05,defaultValue:.65},
    stillTime:{type:ControlType.Number,title:"Still time",min:0,max:60,step:.5,defaultValue:8},
    intensity:{type:ControlType.Number,title:"Intensity",min:.2,max:2.5,step:.05,defaultValue:1.1},
    scale:{type:ControlType.Number,title:"Scale",min:.5,max:1.5,step:.05,defaultValue:1},
    grain:{type:ControlType.Number,title:"Grain",min:0,max:1,step:.05,defaultValue:.35},
    primary:{type:ControlType.Color,title:"Primary",defaultValue:"#b5f1ff"},
    secondary:{type:ControlType.Color,title:"Secondary",defaultValue:"#2c6be4"},
    ink:{type:ControlType.Color,title:"Ink",defaultValue:"#01040c"},
    interactive:{type:ControlType.Boolean,title:"Mouse",defaultValue:true},
    showLabels:{type:ControlType.Boolean,title:"Credits",defaultValue:true},
})
