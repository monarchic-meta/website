import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget, useIsStaticRenderer } from "framer"

// Source-led interface and motion studies, independently authored from observed frames.
// CC-002 credits @threejs and display-name afterimage (support: https://x.com/i/status/2093373917218103449).
// Original geometry, glyphs, UI and analytic materials; source assets and algorithms are not copied.
type Mode = "afterimage" | "glyphs" | "loops" | "technical"
type Status = "waiting" | "running" | "paused" | "static" | "reduced-motion" | "offscreen" | "recovering"
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
    // Internal surface-host options. Framer controls remain unchanged.
    managed?: boolean
    renderWidth?: number
    renderHeight?: number
    pixelBudget?: number
    colorHost?: HTMLCanvasElement
}
const SOURCES = {
    afterimage: { key: "CC-002", title: "Temporal glyph / afterimages", account: "@threejs · credit: afterimage", url: "https://x.com/threejs/status/2093387984741761280" },
    glyphs: { key: "CC-009", title: "Glass pixel glyphs / nine modules", account: "@dnatsuuu", url: "https://x.com/dnatsuuu/status/2093175907867656302" },
    loops: { key: "CC-011", title: "Chromatic loops / granular surface", account: "@zozuar", url: "https://x.com/zozuar/status/2094068054590190033" },
    technical: { key: "CC-012", title: "Technical keycaps / signal paths", account: "@icanvardar", url: "https://x.com/icanvardar/status/2094171308795826332" },
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
float box(vec2 p,vec2 b,float r){vec2 q=abs(p)-b;return length(max(q,0.0))+min(max(q.x,q.y),0.0)-r;}
float segment(vec2 p,vec2 a,vec2 b){vec2 q=p-a,v=b-a;return length(q-v*clamp(dot(q,v)/dot(v,v),0.0,1.0));}
float wing(vec2 p,vec2 c,vec2 size,float angle){p=rot(angle)*(p-c);return (length(p/size)-1.0)*min(size.x,size.y);}
float glyph(vec2 p,float t){
    float flap=.65+.28*sin(t*1.15);p.x=abs(p.x)/flap;
    float a=wing(p,vec2(.13,.075),vec2(.17,.070),-.48);
    float b=wing(p,vec2(.10,-.06),vec2(.090,.105),.40);
    float stem=segment(p,vec2(0,-.10),vec2(0,.10))-.012;
    return min(min(a,b),stem);
}
vec3 afterimage(vec2 p){
    vec3 color=u_ink;float echoSpacing=.045+.11*u_focus;
    for(int i=11;i>=0;i--){
        float k=float(i),phase=u_time-k*(.10+.30*u_focus);
        vec2 q=p/(1.0+k*echoSpacing);
        q-=vec2(.022*sin(phase*.8)+u_mouse.x*.08,.012*cos(phase*.6)+u_mouse.y*.06);
        float d=glyph(q,phase);
        float body=1.0-smoothstep(-.002,.005,d);
        float edge=exp(-abs(d)*160.0);
        float attenuation=exp(-k*.36);
        vec3 pale=mix(u_primary,u_secondary,.5+.5*sin(phase*.5+k*.2));
        color+=pale*(body*.22+edge*.65)*attenuation*u_intensity;
        float rect=abs(box(q,vec2(.33,.255),0.0));
        color+=vec3(.23,.26,.31)*exp(-rect*170.0)*attenuation*.20;
    }
    color+=u_primary*exp(-length(p)*12.0)*.14*u_intensity;
    vec2 strip=vec2(p.x/1.6+.5,(p.y+.41)/.10);
    if(all(greaterThan(strip,vec2(0)))&&all(lessThan(strip,vec2(1)))){
        vec3 labels=texture2D(u_panel,vec2(strip.x,.25+.125*strip.y)).rgb;
        color+=labels*.5;
    }
    return color;
}
vec3 glyphGrid(vec2 p){
    vec3 bg=mix(u_primary,u_secondary,clamp(p.x*.5+p.y*.3+.5,0.0,1.0));
    bg=mix(bg,vec3(1),.60);
    p=rot(.04*sin(u_time*.45)+u_mouse.x*.11)*p;
    p.x+=.04*p.y;p.y*=1.03;
    vec2 grid=p/.255+1.5,cell=floor(grid),q=(fract(grid)-.5)*.255;
    if(any(lessThan(cell,vec2(0)))||any(greaterThan(cell,vec2(2))))return bg;
    float id=cell.x+cell.y*3.0;
    q.y-=.006*sin(u_time*.85+id*.7);
    float d=box(q,vec2(.105),.014);
    float cover=1.0-smoothstep(-.002,.002,d);
    float shadow=exp(-max(box(q-vec2(.012,-.017),vec2(.102),.014),0.0)*90.0)*.16;
    bg*=1.0-shadow;
    vec2 grad=normalize(q+vec2(.0001));
    float edge=pow(clamp(1.0+d/.024,0.0,1.0),2.0);
    vec2 local=q/.235+.5;
    local+=grad*(.025+.05*edge)*u_refraction+vec2(.016*sin(u_time+id),.012*cos(u_time*.7+id));
    local=clamp(local,.02,.98);
    vec2 atlas=(cell+local)/3.0*.25;
    float mask=1.0-texture2D(u_panel,atlas).r;
    float dispersion=(texture2D(u_panel,atlas+vec2(.0015*u_refraction,0)).r-texture2D(u_panel,atlas-vec2(.0015*u_refraction,0)).r);
    vec3 glass=mix(bg,u_ink,mask*.86);
    glass=mix(glass,mix(u_primary,u_secondary,fract(id*.37)),edge*.20);
    float topEdge=exp(-abs(q.y-.113)*410.0)*.45;
    float leftEdge=exp(-abs(q.x+.111)*460.0)*.32;
    glass+=vec3(topEdge+leftEdge)*(.5+.5*sin(u_time*.6+id)*sin(u_time*.6+id));
    glass+=vec3(.7,.15,-.15)*dispersion*.7;
    glass=mix(glass,vec3(1),pow(edge,7.0)*.35);
    return mix(bg,glass*u_intensity,cover);
}
float torus(vec3 p,vec2 r){return length(vec2(length(p.xy)-r.x,p.z))-r.y;}
vec2 loopsMap(vec3 p){
    vec3 a=p-vec3(-.22,.08,0);a.yz=rot(.45+.18*sin(u_time*.4))*a.yz;a.xz=rot(-.25)*a.xz;
    vec3 b=p-vec3(.21,-.02,.09);b.yz=rot(1.00+.22*cos(u_time*.35))*b.yz;b.xz=rot(.70)*b.xz;
    vec3 c=p-vec3(.24,-.19,-.04);c.xz=rot(.72+.15*sin(u_time*.5))*c.xz;
    vec2 res=vec2(torus(a,vec2(.30,.073)),0.0);
    float db=torus(b,vec2(.29,.083)),dc=torus(c,vec2(.19,.068));
    if(db<res.x)res=vec2(db,1);if(dc<res.x)res=vec2(dc,2);return res;
}
vec3 colorfulLoops(vec2 p){
    vec3 ro=vec3(u_mouse.x*.4,u_mouse.y*.25,2.6),rd=normalize(vec3(p*2.0,-2.6));
    float travel=.9;vec2 hit=vec2(0);bool found=false;
    for(int i=0;i<58;i++){hit=loopsMap(ro+rd*travel);if(hit.x<.002){found=true;break;}travel+=max(.004,hit.x*.73);if(travel>4.0)break;}
    if(!found)return u_ink;
    vec3 q=ro+rd*travel;float e=.0025;
    vec3 n=normalize(vec3(loopsMap(q+vec3(e,0,0)).x-loopsMap(q-vec3(e,0,0)).x,loopsMap(q+vec3(0,e,0)).x-loopsMap(q-vec3(0,e,0)).x,loopsMap(q+vec3(0,0,e)).x-loopsMap(q-vec3(0,0,e)).x));
    vec3 material=hit.y<.5?u_primary:hit.y<1.5?u_secondary:vec3(.31,.68,.97);
    float diffuse=.28+.72*max(0.0,dot(n,normalize(vec3(-.4,.8,1))));
    float rim=pow(1.0-max(0.0,dot(n,-rd)),2.0);
    float grain=hash(vec3(floor(gl_FragCoord.xy),floor(u_time*12.0)));
    vec3 color=material*diffuse+material*rim*.16;
    color*=1.0+(grain-.5)*u_grain*.85;
    color+=vec3(pow(max(0.0,dot(reflect(rd,n),normalize(vec3(-.4,.6,1)))),22.0))*.12;
    return color*u_intensity;
}
vec3 technical(vec2 p){
    vec2 uv=vec2(p.x/1.6+.5,p.y+.5);
    if(any(lessThan(uv,vec2(0)))||any(greaterThan(uv,vec2(1))))return u_ink;
    vec3 textureColor=texture2D(u_panel,vec2(uv.x,.375+.625*uv.y)).rgb;
    float luminance=dot(textureColor,vec3(.2126,.7152,.0722));
    vec3 color=mix(textureColor,mix(u_ink,u_secondary,clamp(luminance*2.0,0.0,1.0)),.22);
    vec2 q=uv*vec2(1024,640);
    for(int i=0;i<3;i++){
        float k=float(i),y=413.0-k*49.0;
        vec2 start=vec2(154,y),end=vec2(442,y);
        float phase=fract(u_time*.32-k*.29+u_mouse.x*.12);
        vec2 dotPosition=mix(start,end,phase);
        float glow=exp(-length(q-dotPosition)*.18);
        float trace=exp(-segment(q,start,end)*.9)*(.12+.1*sin(u_time+k));
        color+=mix(u_primary,u_secondary,k*.35)*(glow*.85+trace*.35)*u_intensity;
    }
    for(int j=0;j<2;j++){
        float k=float(j),flash=pow(.5+.5*sin(u_time*1.6+k*PI),8.0);
        float cap=abs(box((q-vec2(681.0+99.0*k,346.5))/640.0,vec2(.047,.037),.008));
        color+=u_primary*exp(-cap*550.0)*flash*.8;
    }
    float scan=exp(-pow((q.y-115.0-mod(u_time*40.0,380.0))/4.0,2.0));
    color+=u_secondary*scan*.025;
    return color;
}
void main(){
    vec2 p=(gl_FragCoord.xy-.5*u_resolution)/u_resolution.y/u_scale;
    vec3 color=u_mode<.5?afterimage(p):u_mode<1.5?glyphGrid(p):u_mode<2.5?colorfulLoops(p):technical(p);
    gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);
}
`
interface Resources {
    field: WebGLProgram
    quad: WebGLBuffer
    panel: WebGLTexture
}
// Original UI artwork is drawn locally, then refracted by the glass shader.
function paintPanel(){
    const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=1024
    const c=canvas.getContext("2d");if(!c)throw new Error("Could not create local UI atlas.")
    c.fillStyle="#0b0e12";c.fillRect(0,0,1024,1024)
    const rounded=(x:number,y:number,w:number,h:number,r:number)=>{c.beginPath();c.roundRect(x,y,w,h,r)}
    c.strokeStyle="#1d242e";c.lineWidth=1
    for(let x=32;x<1024;x+=32){c.beginPath();c.moveTo(x,0);c.lineTo(x,640);c.stroke()}
    c.fillStyle="#8c99ad";c.font='13px "IBM Plex Mono", monospace';c.fillText("SIGNAL CONTROL / ORIGINAL INTERFACE STUDY",64,91)
    c.fillStyle="#ecedf5";c.font='28px "Space Grotesk", sans-serif';c.fillText("Ephemeral connections",64,122)
    for(const x of [64,530]){rounded(x,142,430,244,18);c.fillStyle="#10151d";c.fill();c.strokeStyle="#2b3341";c.stroke()}
    c.fillStyle="#b8b7f9";c.font="12px monospace";c.fillText("01 / DEVICE LINK",87,173);c.fillText("02 / ONE-SHOT ACCESS",553,173)
    for(let i=0;i<3;i++){
        const y=211+i*49;rounded(89,y,65,31,6);c.fillStyle="#1c222e";c.fill();c.strokeStyle="#3c465b";c.stroke()
        c.fillStyle="#abb8cb";c.font="11px monospace";c.fillText(["LOCAL","EDGE","CLIENT"][i],97,y+20)
        c.strokeStyle="#414c64";c.beginPath();c.moveTo(154,y+16);c.lineTo(420,y+16);c.stroke()
        rounded(422,y+4,42,24,5);c.fillStyle="#222938";c.fill();c.fillStyle="#b9bdd5";c.fillText("→",436,y+20)
    }
    for(let i=0;i<2;i++){rounded(642+i*99,265,78,57,9);c.fillStyle="#1d2331";c.fill();c.strokeStyle="#4c5671";c.lineWidth=2;c.stroke();c.fillStyle="#dcdef0";c.font="24px monospace";c.fillText(i?"S":"⌘",666+i*99,303)}
    rounded(624,333,245,28,9);c.fillStyle="#31394f";c.fill();c.fillStyle="#cbcafd";c.font="12px monospace";c.fillText("TOKEN / 7F2A · 0481",648,352)
    rounded(64,414,896,157,16);c.fillStyle="#11161e";c.fill();c.strokeStyle="#313949";c.stroke()
    for(let i=0;i<3;i++){c.fillStyle=["#fa7375","#eac46c","#85cfa0"][i];c.beginPath();c.arc(87+i*15,435,3,0,Math.PI*2);c.fill()}
    c.font="14px monospace";c.fillStyle="#a5b6c8";c.fillText("~/signal $ authorize session --ephemeral",87,473)
    c.fillStyle="#b8b7f9";c.fillText("✓ device verified     ↔ route established",87,504)
    c.fillStyle="#69798f";c.fillText("LOCAL UI TEXTURE / CONNECTION MOTION IS A VISUAL STUDY",87,537)
    c.fillStyle="#020304";c.fillRect(0,640,1024,128)
    c.font="13px monospace";c.fillStyle="#77818b";c.fillText("TEMPORAL STUDY / INDEPENDENT GLYPH",60,719);c.fillText("FRAME 01 / 76   T + 08.00 S",662,719)
    c.fillStyle="#fff";c.fillRect(0,768,256,256)
    const glyphs=[['00100','01110','11011','01010','01010'],['11111','00100','01110','10101','00100'],['10001','01010','00100','01010','10001'],['11111','10000','11110','10000','11111'],['01110','11011','10001','11011','01110'],['10101','01110','11011','01010','11011'],['00100','11111','10101','01110','01010'],['10100','11110','00101','01111','00101'],['01110','10101','11011','10001','01110']]
    for(let row=0;row<3;row++)for(let col=0;col<3;col++){
        const glyph=glyphs[row*3+col],cell=256/3;c.fillStyle="#202832"
        for(let y=0;y<5;y++)for(let x=0;x<5;x++)if(glyph[y][x]==="1")c.fillRect(col*cell+13+x*12,768+(2-row)*cell+13+y*12,12,12)
    }
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
        gl.uniform1f(location(p,"u_grain"),settings.grain)
        gl.uniform1f(location(p,"u_focus"),settings.focus)
        gl.uniform1f(location(p,"u_refraction"),settings.refraction)
        gl.uniform1i(location(p,"u_panel"),0)
        gl.uniform1f(location(p,"u_mode"),settings.mode==="afterimage"?0:settings.mode==="glyphs"?1:settings.mode==="loops"?2:3)
        gl.uniform3fv(location(p,"u_primary"),rgb(settings.primary,settings.colorHost??canvas))
        gl.uniform3fv(location(p,"u_secondary"),rgb(settings.secondary,settings.colorHost??canvas))
        gl.uniform3fv(location(p,"u_ink"),rgb(settings.ink,settings.colorHost??canvas))
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
            settings=next
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
export default function InterfaceCodingStudy(props: Props) {
    const {study="afterimage",animate=true,canvasMotion=false,speed=.65,stillTime=8,intensity=1.1,
        scale=1,grain=.7,focus=.65,refraction=.85,interactive=true,
        primary="#fff8ba",secondary="#a8c9e6",ink="#020304",showLabels=true,style}=props
    const staticRenderer=useIsStaticRenderer(),target=RenderTarget.current()
    const canvasPreview=canvasMotion&&target===RenderTarget.canvas
    const isStatic=target===RenderTarget.export||target===RenderTarget.thumbnail||(staticRenderer&&!canvasPreview)
    const root=React.useRef<HTMLDivElement>(null),canvas=React.useRef<HTMLCanvasElement>(null)
    const [paused,setPaused]=React.useState(false)
    const [status,setStatus]=React.useState<Status>("offscreen"),[error,setError]=React.useState("")
    const settings:Settings={mode:study,animate:animate&&!paused,static:isStatic,canvasPreview,speed:Math.max(0,speed),stillTime,intensity,
        scale:Math.max(.5,scale),grain:Math.max(0,grain),focus:Math.max(0,Math.min(1,focus)),refraction:Math.max(0,refraction),interactive,primary,secondary,ink}
    const requestMotion=useStudySurface(root,canvas,settings,target,"InterfaceCodingStudy.tsx",(s,e)=>{setStatus(s);setError(e??"")})
    const source=SOURCES[study],color=study==="glyphs"?"#28303b":"#e2e6ef"
    const mono:React.CSSProperties={fontFamily:'"IBM Plex Mono", monospace',fontSize:10,letterSpacing:".045em",lineHeight:1.5}
    return <div ref={root} role="group" aria-label={source.title} style={{width:"100%",height:"100%",...style,position:"relative",overflow:"hidden",background:study==="glyphs"?primary:ink,color}}>
        <canvas ref={canvas} role="img" aria-label={source.title+", animated source-led study of "+source.key+" by "+source.account} style={{display:"block",width:"100%",height:"100%",touchAction:"pan-y"}} />
        {showLabels&&<>
            <div style={{position:"absolute",left:"5%",top:"6%",pointerEvents:"none"}}>
                <div style={{...mono,opacity:.65}}>SOURCE-LED CODE STUDY / {source.key}</div>
                {study!=="technical"&&<div style={{fontFamily:'"Space Grotesk", sans-serif',fontSize:"clamp(14px,2vw,23px)",letterSpacing:"-.035em",marginTop:8,maxWidth:"75%"}}>{source.title}</div>}
            </div>
            <a href={source.url} target="_blank" rel="noreferrer" style={{...mono,position:"absolute",left:"5%",bottom:"5%",color,textDecoration:"underline",textUnderlineOffset:3}}>{source.account} ↗</a>
            <div style={{...mono,position:"absolute",right:"5%",bottom:"5%",opacity:.65,pointerEvents:"none",fontSize:8,maxWidth:"55%",textAlign:"right"}}>INDEPENDENT CODE / SOURCE EFFECT APPROXIMATED</div>
        </>}
        {!isStatic&&<button onClick={()=>{if(status==="waiting"){setPaused(false);requestMotion()}else setPaused(p=>!p)}} disabled={status==="reduced-motion"||!animate||speed<=0} aria-pressed={paused} aria-label={paused||status==="waiting"?"Play animation":"Pause animation"} style={{...mono,position:"absolute",right:"5%",top:"6%",padding:"5px 9px",color,background:"transparent",border:"1px solid "+color,cursor:"pointer",opacity:.75}}>
            {status==="reduced-motion"?"REDUCED MOTION":!animate||speed<=0?"MOTION OFF":paused||status==="waiting"?"PLAY":"PAUSE"}
        </button>}
        {(error||status==="recovering")&&<div role="status" style={{...mono,position:"absolute",inset:"40% 10%",textAlign:"center"}}>{error?<>Graphics unavailable in this browser.<br/>Enable WebGL to view this study.</>:"Restoring graphics…"}</div>}
    </div>
}
addPropertyControls(InterfaceCodingStudy,{
    study:{type:ControlType.Enum,title:"Study",options:["afterimage","glyphs","loops","technical"],optionTitles:["Temporal glyph","Glass pixel modules","Chromatic loops","Technical signals"],defaultValue:"afterimage"},
    animate:{type:ControlType.Boolean,title:"Animate",defaultValue:true},
    canvasMotion:{type:ControlType.Boolean,title:"Canvas motion",defaultValue:false},
    speed:{type:ControlType.Number,title:"Speed",min:0,max:2,step:.05,defaultValue:.65},
    stillTime:{type:ControlType.Number,title:"Still time",min:0,max:60,step:.5,defaultValue:8},
    intensity:{type:ControlType.Number,title:"Intensity",min:.2,max:2.5,step:.05,defaultValue:1.1},
    scale:{type:ControlType.Number,title:"Scale",min:.5,max:1.5,step:.05,defaultValue:1},
    grain:{type:ControlType.Number,title:"Grain",min:0,max:1,step:.05,defaultValue:.7,hidden:p=>p.study!=="loops"},
    focus:{type:ControlType.Number,title:"Echo depth",min:0,max:1,step:.05,defaultValue:.65,hidden:p=>p.study!=="afterimage"},
    refraction:{type:ControlType.Number,title:"Refraction",min:0,max:1.5,step:.05,defaultValue:.85,hidden:p=>p.study!=="glyphs"},
    primary:{type:ControlType.Color,title:"Primary",defaultValue:"#fff8ba"},
    secondary:{type:ControlType.Color,title:"Secondary",defaultValue:"#a8c9e6"},
    ink:{type:ControlType.Color,title:"Ink",defaultValue:"#020304"},
    interactive:{type:ControlType.Boolean,title:"Mouse",defaultValue:true},
    showLabels:{type:ControlType.Boolean,title:"Credits",defaultValue:true},
})
