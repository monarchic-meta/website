import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget, useIsStaticRenderer } from "framer"

// Source-led material and geometry studies. Independent formulas and motion;
// original source code, assets, simulations and physical models are not adopted.
type Mode = "capsules" | "glass" | "lattice" | "spectral"
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
    focus?: number
    refraction?: number
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
    focus: number
    refraction: number
    interactive: boolean
    primary: string
    secondary: string
    ink: string
}
const SOURCES = {
    capsules: { key: "CC-004", title: "Capsules / optical depth", account: "@kellymilligannz", url: "https://x.com/kellymilligannz/status/2095011696180171077" },
    glass: { key: "CC-008", title: "Glass / refracted interface", account: "@AlbiaHossain", url: "https://x.com/AlbiaHossain/status/2093330866143662498" },
    lattice: { key: "CC-013", title: "Recursive triangle lattice", account: "@YoheiNishitsuji", url: "https://x.com/YoheiNishitsuji/status/2098603831944945735" },
    spectral: { key: "CC-016", title: "Spectral / grain and reflection", account: "@Jaenam97", url: "https://x.com/Jaenam97/status/2098418240900804947" },
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
uniform float u_focus;
uniform float u_refraction;
uniform vec3 u_primary;
uniform vec3 u_secondary;
uniform vec3 u_ink;
uniform sampler2D u_panel;
const float PI=3.14159265359;
mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float capsuleDistance(vec2 p,float halfLength,float radius){p.x-=clamp(p.x,-halfLength,halfLength);return length(p)-radius;}
vec3 capsules(vec2 uv){
    // Analytic capsule profiles and focus-dependent soft coverage; independent
    // layered arrangement rather than a copied simulation or physical DOF model.
    vec2 p=uv*2.5;
    vec3 color=mix(u_primary,u_secondary,.12+.10*(uv.y+.5));
    color*=1.0-.035*dot(uv,uv);
    for(int i=0;i<14;i++){
        float k=float(i),seed=hash(vec3(k,2,4));
        float depth=(k+.5)/14.0;
        float angle=-1.15+2.3*hash(vec3(k,3,1))+.065*sin(u_time*.4+k);
        vec2 center=vec2(-1.7+3.4*hash(vec3(k,6,2)),-.79+.26*hash(vec3(k,1,7)));
        center.x+=.035*sin(u_time*.35+k*1.7);
        center.y+=.025*sin(u_time*.55+k*2.1);
        float lengthA=.12+.18*seed,radius=.075+.028*depth;
        vec2 q=rot(angle)*(p-center);
        float d=capsuleDistance(q,lengthA,radius);
        float blur=.004+.09*pow(abs(depth-u_focus),1.3);
        float shadow=capsuleDistance(rot(angle)*(p-center+vec2(-.025,.06)),lengthA,radius);
        color*=1.0-.14*exp(-max(shadow,0.0)*16.0)*(1.0-smoothstep(.10,.19,shadow));
        float radial=length(vec2(q.x-clamp(q.x,-lengthA,lengthA),q.y))/radius;
        float facing=sqrt(max(0.0,1.0-radial*radial));
        float highlight=.5+.5*clamp(-q.y/radius*.55+facing*.45,0.0,1.0);
        vec3 body=u_ink+vec3(.055*highlight+.018*depth)*u_intensity;
        body+=vec3(.025)*pow(max(facing,0.0),7.0);
        float alpha=1.0-smoothstep(-blur,blur,d);
        color=mix(color,body,alpha);
    }
    return clamp(color,0.0,1.0);
}
float roundBox(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.0))+min(max(q.x,q.y),0.0)-r;}
vec3 panelAt(vec2 uv){
    vec3 panel=texture2D(u_panel,clamp(uv,0.0,1.0)).rgb;
    float accent=smoothstep(.05,.18,panel.g-max(panel.r,panel.b));
    return mix(panel,u_primary*max(panel.g,.2),accent);
}
vec3 glass(vec2 uv){
    // Actual local resampling of a canvas-generated UI texture. No screenshot,
    // remote texture, DOM capture or source website is used.
    vec2 st=uv+vec2(.5);
    vec3 color=panelAt(st);
    for(int i=0;i<2;i++){
        float k=float(i);
        float angle=mix(-.31,.25,k)+.06*sin(u_time*.28+k*2.0);
        vec2 center=vec2(mix(.32,.69,k)+.025*sin(u_time*.35+k),.5)+u_mouse*.05;
        vec2 q=rot(angle)*(st-center);
        float d=roundBox(q,vec2(.19,.40),.012);
        float e=.0015;
        vec2 grad=vec2(roundBox(q+vec2(e,0),vec2(.19,.40),.012)-roundBox(q-vec2(e,0),vec2(.19,.40),.012),
                       roundBox(q+vec2(0,e),vec2(.19,.40),.012)-roundBox(q-vec2(0,e),vec2(.19,.40),.012))/(2.0*e);
        float bevel=exp(-abs(d)*58.0);
        vec2 bend=rot(-angle)*(grad*bevel*.050+vec2(q.x*.18,q.y*.035))*u_refraction;
        vec2 sampleUV=st+bend;
        vec3 refracted=panelAt(sampleUV);
        refracted.r=panelAt(sampleUV+bend*.045).r;
        refracted.b=panelAt(sampleUV-bend*.045).b;
        float reflection=pow(.5+.5*cos(q.x*9.0+q.y*3.2+u_time*.18),14.0)*.07;
        refracted=mix(refracted,u_secondary,.015)+reflection+bevel*.075*u_intensity;
        float inside=1.0-smoothstep(-.0015,.0015,d);
        color=mix(color,refracted,inside);
        float rim=exp(-abs(d)*650.0);
        color+=vec3(.36,.40,.44)*rim*u_intensity;
    }
    return clamp(color,0.0,1.0);
}
float tetra(vec3 p){return (max(max(-p.x-p.y-p.z,p.x+p.y-p.z),max(-p.x+p.y+p.z,p.x-p.y+p.z))-1.0)*.577350269;
}
vec3 latticeSpace(vec3 p){p.xz=rot(.35+u_time*.10+u_mouse.x*.4)*p.xz;p.yz=rot(.25+u_mouse.y*.3)*p.yz;return p;}
float latticeDistance(vec3 p){
    p=latticeSpace(p);
    // Five independent nearest-vertex IFS levels, with angular tetrahedral
    // leaves. Open triangular holes remain actual empty ray-marched space.
    float scale=1.0;
    for(int i=0;i<5;i++){
        vec3 vertex=vec3(1,1,1);
        float closest=dot(p-vertex,p-vertex),d;
        vec3 a=vec3(-1,-1,1);d=dot(p-a,p-a);if(d<closest){closest=d;vertex=a;}
        a=vec3(1,-1,-1);d=dot(p-a,p-a);if(d<closest){closest=d;vertex=a;}
        a=vec3(-1,1,-1);d=dot(p-a,p-a);if(d<closest){vertex=a;}
        p=p*2.0-vertex;scale*=.5;
    }
    return tetra(p)*scale;
}
vec3 lattice(vec2 uv){
    vec3 ro=vec3(0,0,4.2),rd=normalize(vec3(uv*2.7,-3.1));
    float travel=1.8;bool hit=false;vec3 q;
    for(int i=0;i<100;i++){
        q=ro+rd*travel;float d=latticeDistance(q);
        if(d<.0010){hit=true;break;}
        travel+=max(d*.72,.0009);if(travel>6.3)break;
    }
    if(!hit)return u_ink;
    float e=.0015;vec2 h=vec2(e,0);
    vec3 normal=normalize(vec3(latticeDistance(q+h.xyy)-latticeDistance(q-h.xyy),latticeDistance(q+h.yxy)-latticeDistance(q-h.yxy),latticeDistance(q+h.yyx)-latticeDistance(q-h.yyx)));
    float light=.18+.82*max(dot(normal,normalize(vec3(-.5,.8,1.2))),0.0);
    float fog=exp(-max(travel-2.8,0.0)*.28);
    return mix(u_ink,mix(u_secondary,u_primary,light)*u_intensity,fog);
}
vec3 ringSpace(vec3 p){p.yz=rot(.30+.18*sin(u_time*.23)+u_mouse.y*.4)*p.yz;p.xz=rot(.12*sin(u_time*.17)+u_mouse.x*.4)*p.xz;return p;}
float ringDistance(vec3 p){p=ringSpace(p);return length(vec2(length(p.xy)-.59,p.z))-.27;}
vec3 spectral(vec2 uv){
    vec3 ro=vec3(0,0,3.0),rd=normalize(vec3(uv*2.35,-3.0));
    float travel=1.5;bool hit=false;vec3 q;
    for(int i=0;i<72;i++){
        q=ro+rd*travel;float d=ringDistance(q);
        if(d<.001){hit=true;break;}
        travel+=max(d*.8,.001);if(travel>4.7)break;
    }
    vec3 color=mix(u_ink,vec3(.19),.58+.15*uv.y);
    if(hit){
        vec2 e=vec2(.0015,0);
        vec3 n=normalize(vec3(ringDistance(q+e.xyy)-ringDistance(q-e.xyy),ringDistance(q+e.yxy)-ringDistance(q-e.yxy),ringDistance(q+e.yyx)-ringDistance(q-e.yyx)));
        vec3 reflection=reflect(rd,n);
        float facing=max(dot(n,-rd),0.0),fresnel=pow(1.0-facing,2.4);
        float boxLight=pow(max(0.0,dot(reflection,normalize(vec3(-.4,.85,1.0)))),12.0);
        float lowLight=pow(max(0.0,dot(reflection,normalize(vec3(.2,-.8,1.0)))),18.0);
        float phase=1.05*fresnel+.15*reflection.x+.035*u_time;
        vec3 spectrum=.5+.5*cos(6.2831853*(phase+vec3(.02,.34,.67)));
        vec3 tint=mix(u_primary,u_secondary,.5+.5*n.y);
        color=vec3(.035+.13*max(n.y,0.0))+(boxLight*.48+lowLight*.16)*tint;
        color+=spectrum*(pow(fresnel,.65)*.55+lowLight*.17)*u_intensity;
        // Spatial grain is an intentional material treatment, not a claim of
        // spectral path tracing or a converging physical light simulation.
        float grain=hash(vec3(floor(gl_FragCoord.xy),.7))-.5;
        color+=grain*u_grain*.24*(.6+boxLight);
    }
    return clamp(color,0.0,1.0);
}
void main(){
    vec2 uv=(gl_FragCoord.xy-.5*u_resolution)/u_resolution.y;
    float fit=min(1.0,u_resolution.x/u_resolution.y/1.3);
    vec3 color;
    if(u_mode<.5)color=capsules(uv/(u_scale*fit));
    else if(u_mode<1.5)color=glass(vec2((gl_FragCoord.x/u_resolution.x-.5)/u_scale,(gl_FragCoord.y/u_resolution.y-.5)/u_scale));
    else if(u_mode<2.5)color=lattice(uv/(u_scale*fit));
    else color=spectral(uv/(u_scale*fit));
    gl_FragColor=vec4(color,1.0);
}
`
interface Resources {
    field: WebGLProgram
    quad: WebGLBuffer
    panel: WebGLTexture
}
// Original UI artwork is drawn locally, then refracted by the glass shader.
function paintPanel(): HTMLCanvasElement {
    const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=640
    const c=canvas.getContext("2d")
    if(!c)throw new Error("Could not create the procedural interface texture.")
    c.fillStyle="#0a0c10";c.fillRect(0,0,1024,640)
    c.strokeStyle="#232831";c.lineWidth=1
    for(let x=40;x<1024;x+=80){c.beginPath();c.moveTo(x,0);c.lineTo(x,640);c.stroke()}
    c.fillStyle="#11151b";c.fillRect(38,32,948,68)
    c.fillStyle="#e1e6ec";c.font="17px monospace";c.fillText("MONARCHIC / MATERIAL LAB",62,72)
    c.fillStyle="#8b959f";c.fillText("REFRACTION STUDY  /  06",666,72)
    c.fillStyle="#f1f4f6";c.font="bold 106px sans-serif";c.fillText("LIGHT",62,249);c.fillText("BENDS.",62,350)
    c.fillStyle="#89939e";c.font="17px monospace";c.fillText("A generated surface. A different view.",65,400)
    c.fillStyle="#c2ff76";c.fillRect(64,448,230,50);c.fillStyle="#0a0c10";c.font="bold 17px monospace";c.fillText("EXPLORE MATERIAL",83,480)
    const labels=["LAYER / TRANSMISSION","SURFACE / REFLECTION","EDGE / DISPERSION"]
    for(let i=0;i<3;i++){
        const y=158+i*114;c.fillStyle="#131820";c.fillRect(630,y,328,92)
        c.strokeStyle="#323b47";c.strokeRect(630,y,328,92)
        c.fillStyle="#a6b0bd";c.font="14px monospace";c.fillText(labels[i],650,y+27)
        c.fillStyle="#303b46";c.fillRect(650,y+47,280,5)
        c.fillStyle="#c2ff76";c.fillRect(650,y+47,80+i*59,5)
        c.fillStyle="#77838f";c.font="12px monospace";c.fillText("ORIGINAL UI / OPTICAL EXPERIMENT",650,y+75)
    }
    c.fillStyle="#6f7c89";c.font="14px monospace";c.fillText("CODE-GENERATED TEXTURE   /   NO SOURCE SCREENSHOT",64,583)
    c.strokeStyle="#404b57";c.beginPath();c.moveTo(64,546);c.lineTo(958,546);c.stroke()
    return canvas
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
        gl.deleteBuffer(resources.quad);gl.deleteProgram(resources.field);gl.deleteTexture(resources.panel)
        resources=undefined;locations.clear()
    }
    const allocate = () => {
        let field:WebGLProgram|undefined,quad:WebGLBuffer|null=null,panel:WebGLTexture|null=null
        try {
            field=program(VERTEX,FRAGMENT);quad=gl.createBuffer();panel=gl.createTexture()
            if(!quad||!panel)throw new Error("Could not allocate graphics resources.")
            gl.bindBuffer(gl.ARRAY_BUFFER,quad)
            gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW)
            gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,panel)
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true)
            gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,paintPanel())
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)
            resources={field,quad,panel}
        } catch(error) {
            if(quad)gl.deleteBuffer(quad);if(field)gl.deleteProgram(field);if(panel)gl.deleteTexture(panel)
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
        gl.uniform1f(location(p,"u_focus"),settings.focus)
        gl.uniform1f(location(p,"u_refraction"),settings.refraction)
        gl.uniform1i(location(p,"u_panel"),0)
        gl.uniform1f(location(p,"u_mode"),settings.mode==="capsules"?0:settings.mode==="glass"?1:settings.mode==="lattice"?2:3)
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
        gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,resources.panel)
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
export default function MaterialCodingStudy(props: Props) {
    const {study="capsules",animate=true,canvasMotion=false,speed=.65,stillTime=8,intensity=1.1,
        scale=1,grain=.7,focus=.65,refraction=.85,interactive=true,
        primary="#d5dbd2",secondary="#a3aea2",ink="#111411",showLabels=true,style}=props
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
        scale:Math.max(.5,scale),grain:Math.max(0,grain),focus:Math.max(0,Math.min(1,focus)),refraction:Math.max(0,refraction),interactive,primary,secondary,ink}
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
    React.useEffect(()=>{renderer.current?.update(settings)},[study,animate,paused,isStatic,canvasPreview,speed,stillTime,intensity,scale,grain,focus,refraction,interactive,primary,secondary,ink])
    const source=SOURCES[study],color=study==="capsules"?ink:"#e2e6ef"
    const mono:React.CSSProperties={fontFamily:'"IBM Plex Mono", monospace',fontSize:10,letterSpacing:".045em",lineHeight:1.5}
    return <div ref={root} role="group" aria-label={source.title} style={{width:"100%",height:"100%",...style,position:"relative",overflow:"hidden",background:study==="capsules"?primary:ink,color}}>
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
addPropertyControls(MaterialCodingStudy,{
    study:{type:ControlType.Enum,title:"Study",options:["capsules","glass","lattice","spectral"],optionTitles:["Capsule depth","Glass refraction","Triangle lattice","Spectral grain"],defaultValue:"capsules"},
    animate:{type:ControlType.Boolean,title:"Animate",defaultValue:true},
    canvasMotion:{type:ControlType.Boolean,title:"Canvas motion",defaultValue:false},
    speed:{type:ControlType.Number,title:"Speed",min:0,max:2,step:.05,defaultValue:.65},
    stillTime:{type:ControlType.Number,title:"Still time",min:0,max:60,step:.5,defaultValue:8},
    intensity:{type:ControlType.Number,title:"Intensity",min:.2,max:2.5,step:.05,defaultValue:1.1},
    scale:{type:ControlType.Number,title:"Scale",min:.5,max:1.5,step:.05,defaultValue:1},
    grain:{type:ControlType.Number,title:"Grain",min:0,max:1,step:.05,defaultValue:.7,hidden:p=>p.study!=="spectral"},
    focus:{type:ControlType.Number,title:"Focus",min:0,max:1,step:.05,defaultValue:.65,hidden:p=>p.study!=="capsules"},
    refraction:{type:ControlType.Number,title:"Refraction",min:0,max:1.5,step:.05,defaultValue:.85,hidden:p=>p.study!=="glass"},
    primary:{type:ControlType.Color,title:"Primary",defaultValue:"#d5dbd2"},
    secondary:{type:ControlType.Color,title:"Secondary",defaultValue:"#a3aea2"},
    ink:{type:ControlType.Color,title:"Ink",defaultValue:"#111411"},
    interactive:{type:ControlType.Boolean,title:"Mouse",defaultValue:true},
    showLabels:{type:ControlType.Boolean,title:"Credits",defaultValue:true},
})
