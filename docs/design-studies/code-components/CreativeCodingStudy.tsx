import * as React from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

/**
 * Live source-led studies: CC-003 @GaloAndStuff, CC-001 @yuruyurau,
 * CC-005 @XorDev. Independently authored geometry and GLSL; source code,
 * assets, exact motion, and source algorithms are not reproduced.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 600
 */
type Mode = "dither" | "canopy" | "coronal"
type Status = "running" | "paused" | "static" | "reduced-motion" | "offscreen" | "recovering"
interface Props {
    study?: Mode
    animate?: boolean
    speed?: number
    stillTime?: number
    intensity?: number
    pixelSize?: number
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
    speed: number
    stillTime: number
    intensity: number
    pixelSize: number
    interactive: boolean
    primary: string
    secondary: string
    ink: string
}
const SOURCES = {
    dither: { key: "CC-003", title: "Ordered terrain", account: "@GaloAndStuff", url: "https://x.com/GaloAndStuff/status/2094074141557117090" },
    canopy: { key: "CC-001", title: "Suspended point field", account: "@yuruyurau", url: "https://x.com/yuruyurau/status/2093710258120331463" },
    coronal: { key: "CC-005", title: "Coronal / light study", account: "@XorDev", url: "https://x.com/XorDev/status/2093488121392300374" },
}
const VERTEX = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`
const FRAGMENT = `
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_cssResolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_intensity;
uniform float u_pixelSize;
uniform float u_mode;
uniform vec3 u_primary;
uniform vec3 u_secondary;
uniform vec3 u_ink;
const float PI = 3.14159265359;
mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
float hash(vec3 p) {
    p = fract(p * .3183099 + vec3(.1, .2, .3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
                   mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                   mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p) { return .57*noise(p)+.28*noise(p*2.03+3.1)+.15*noise(p*4.07-2.4); }
float bayer(vec2 p) {
    vec2 a = mod(floor(p),4.0);
    vec2 lo = mod(a,2.0), hi = floor(a/2.0);
    float b0 = 2.0*lo.x + 3.0*lo.y - 4.0*lo.x*lo.y;
    float b1 = 2.0*hi.x + 3.0*hi.y - 4.0*hi.x*hi.y;
    return (4.0*b0+b1+.5)/16.0;
}
float terrain(vec2 p, float t) {
    return -.5 + .24*sin(p.x*1.7+t*.22) + .16*cos(p.y*2.3-t*.17)
        + .45*exp(-pow(p.x*.9 + sin(p.y*.8+t*.12)*.45,2.0)*1.8)
        + .07*sin(p.x*4.2+p.y*2.1-t*.32);
}
vec3 ditheredTerrain(vec2 frag) {
    // Quantization is locked to CSS-pixel cells, independent of display DPR.
    vec2 cell = floor(frag/u_pixelSize);
    vec2 p = ((cell+.5)*u_pixelSize-.5*u_cssResolution)/u_cssResolution.y;
    vec3 ro = vec3(1.8+u_mouse.x*.7,1.25+u_mouse.y*.4,2.7);
    vec3 target = vec3(0.0,-.35,-.3);
    vec3 forward = normalize(target-ro);
    vec3 right = normalize(cross(forward,vec3(0,1,0)));
    vec3 up = cross(right,forward);
    vec3 rd = normalize(forward*1.75+right*p.x*2.0+up*p.y*2.0);
    float distance = .3;
    bool hit = false;
    for(int i=0;i<76;i++) {
        vec3 q = ro+rd*distance;
        float h = q.y-terrain(q.xz,u_time);
        if(h<.008) { hit=true; break; }
        distance += clamp(h*.48,.015,.4);
        if(distance>9.0) break;
    }
    float tone = .53;
    if(hit) {
        vec3 q = ro+rd*distance;
        float e = .012;
        vec3 normal = normalize(vec3(terrain(q.xz-vec2(e,0),u_time)-terrain(q.xz+vec2(e,0),u_time),2.0*e,
            terrain(q.xz-vec2(0,e),u_time)-terrain(q.xz+vec2(0,e),u_time)));
        float diffuse = max(0.0,dot(normal,normalize(vec3(-.7,.6,-.6))));
        float ridge = .5+.5*sin(q.z*1.45+q.x*.6+u_time*.1);
        tone = .08+diffuse*.76+ridge*.17;
        // Soft pink distance fade over independently composed moving terrain.
        tone = mix(tone,.53,1.0-exp(-distance*distance*.018));
    }
    tone = clamp((tone-.5)*u_intensity+.5,0.0,1.0)*2.0;
    float index = floor(tone) + step(bayer(cell),fract(tone));
    return index < .5 ? u_ink : index < 1.5 ? u_primary : u_secondary;
}
vec3 coronal(vec2 p) {
    vec3 ro = vec3(0,0,2.65);
    vec3 rd = normalize(vec3(p*2.05,-2.65));
    vec3 light = vec3(0.0);
    float transmittance = 1.0;
    for(int i=0;i<64;i++) {
        float travel = 1.32+float(i)*.041;
        vec3 q = ro+rd*travel;
        q.xz = rot(.22*sin(u_time*.16)+u_mouse.x*.45)*q.xz;
        q.yz = rot(.25+u_mouse.y*.35)*q.yz;
        float angle = atan(q.y,q.x);
        float n = fbm(q*5.0+vec3(u_time*.15,-u_time*.11,u_time*.07));
        float radius = .59 + .055*sin(angle*3.0+u_time*.38)
            + .025*sin(angle*7.0-u_time*.47);
        float warp = .055*(n-.5) + .026*sin(angle*12.0+q.z*9.0-u_time*.8);
        float tube = length(vec2(length(q.xy)-radius,q.z*.88));
        float edge = tube-(.075+warp);
        float filament = pow(.5+.5*sin(angle*34.0-q.z*35.0-u_time*1.3+9.0*n),7.0);
        float core = exp(-abs(edge)*135.0)*(.22+filament*1.6);
        float smoke = exp(-max(edge,0.0)*18.0)*smoothstep(-.04,.025,edge)
            * pow(max(n-.25,0.0)*1.5,2.0);
        // Uneven arcs and wispy emission retain a dark aperture, not a solid tube.
        float arc = .3+.7*pow(.5+.5*sin(angle*2.0+u_time*.23+q.z*5.0),2.0);
        float plume = exp(-max(edge,0.0)*8.0)*smoothstep(.015,.13,edge)
            * pow(max(n-.32,0.0)*1.8,2.0)
            * pow(.5+.5*sin(angle*5.0-u_time*.4+q.z*10.0),2.0);
        float energy = (core*3.2+smoke*1.2+plume*1.1)*arc;
        float palette = .5+.5*sin(angle*1.8+q.z*4.0-u_time*.18);
        vec3 color = mix(u_primary,u_secondary,palette);
        color = mix(color,vec3(.88,.98,1.0),min(core*.22,.65));
        light += color*energy*.22*transmittance*u_intensity;
        transmittance *= exp(-smoke*.025);
    }
    return vec3(1.0)-exp(-light*3.0);
}
void main() {
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution)/u_resolution.y;
    vec3 color;
    if(u_mode<.5) color = ditheredTerrain(gl_FragCoord.xy*u_cssResolution/u_resolution);
    else color = coronal(uv/min(1.0,u_resolution.x/u_resolution.y/1.35));
    gl_FragColor=vec4(color,1.0);
}
`
const CANOPY_VERTEX = `
// CC-001 / @yuruyurau — source-led white point-canopy approximation.
// https://x.com/yuruyurau/status/2093710258120331463
// Independent parametric geometry; the source formula is not copied or executed.
// WebGL 1 / GLSL ES 1.00. Grid values should sample cell centers, not endpoints.
precision highp float;

attribute vec2 a_grid;
attribute float a_kind; // 0.0: continuous canopy/drape; 1.0: thin trailing strand
uniform float u_time;
uniform vec2 u_resolution; // actual drawing-buffer pixel dimensions
uniform vec2 u_mouse;      // centered normalized pointer, approximately [-1,1]
uniform float u_intensity;

varying float v_opacity;
varying float v_white;

void main() {
  const float PI = 3.141592653589793;
  const float TAU = 6.283185307179586;
  float tm = u_time;
  float s = clamp(a_grid.y, 0.0001, 0.9999);
  float lane = a_grid.x * TAU;
  float phase = lane + 0.12 * tm + 0.15 * sin(7.0 * s - 0.46 * tm);
  float breath = 1.0 + 0.025 * sin(0.73 * tm);
  float radius;
  float height;
  float depthScale;
  float density;
  float strandFade = 1.0;

  if (a_kind < 0.5) {
    // A hemisphere-like cap occupies the first 48% of the longitudinal grid.
    // The remainder is a continuous pinched drape, not a disconnected object.
    if (s < 0.48) {
      float cap = s / 0.48;
      float theta = cap * PI * 0.5;
      radius = 0.56 * sin(theta) * breath;
      height = 0.085 + 0.225 * cos(theta);
      depthScale = 0.48;
      float ripple = 0.006 * sin(phase * 7.0 + cap * 15.0 - tm * 1.05);
      height += ripple * sin(theta) * sin(theta);
      radius += 0.004 * sin(phase * 5.0 - tm * 0.8) * sin(theta) * cos(theta);
      density = 0.22 + 0.78 * smoothstep(0.02, 0.22, radius);
    } else {
      float drop = (s - 0.48) / 0.52;
      // Fast collapse near the rim makes a narrow throat; the lower bulge and
      // taper preserve the airy hanging-fabric/tentacle silhouette.
      float bulge = sin(PI * drop);
      radius = (0.025 + 0.535 * exp(-19.0 * drop)
               + 0.12 * bulge * bulge * (1.0 - 0.5 * drop)) * breath;
      height = 0.085 - 0.465 * drop;
      phase += drop * 3.1 + 0.28 * (sin(drop * 10.0 - tm * 0.8) - sin(-tm * 0.8));
      radius *= 1.0 + 0.12 * sin(phase * 3.0 - drop * 9.0 + tm * 0.65)
                * smoothstep(0.0, 0.16, drop);
      height += 0.005 * sin(phase * 4.0 - drop * 14.0 + tm * 0.9) * bulge;
      height += 0.006 * sin(phase * 7.0 + 15.0 - tm * 1.05) * exp(-12.0 * drop);
      depthScale = mix(0.48, 0.68, smoothstep(0.0, 0.2, drop));
      density = 0.56 + 0.25 * (1.0 - drop);
      strandFade = 1.0 - 0.6 * smoothstep(0.82, 1.0, drop);
    }
  } else {
    // a_grid.x is one fixed lane per strand; a_grid.y runs along the strand.
    // Strand length and shape vary smoothly by lane, with no random glitter.
    phase = lane + 0.18 * tm + s * 7.2 + 0.3 * sin(s * 8.0 - tm * 0.7 + lane);
    float bow = sin(PI * s);
    radius = 0.027 + 0.073 * bow * bow;
    radius *= 1.0 + 0.22 * sin(s * 12.0 - tm * 0.7 + lane * 2.0);
    height = -0.008 - s * (0.38 + 0.055 * (0.5 + 0.5 * sin(lane * 3.0)));
    depthScale = 0.72;
    density = 0.62;
    strandFade = 1.0 - 0.75 * smoothstep(0.65, 1.0, s);
  }

  vec3 p = vec3(radius * cos(phase), height,
                radius * depthScale * sin(phase));
  // Small, continuous lateral sway: the dome remains the visual anchor.
  p.x += 0.012 * sin(tm * 0.47 + s * 8.0) * smoothstep(0.48, 1.0, s);

  float yaw = 0.12 * sin(tm * 0.22) + clamp(u_mouse.x, -1.0, 1.0) * 0.24;
  float pitch = 0.21 + 0.045 * sin(tm * 0.31)
                + clamp(u_mouse.y, -1.0, 1.0) * 0.11;
  float cy = cos(yaw);
  float sy = sin(yaw);
  float cp = cos(pitch);
  float sp = sin(pitch);
  p.xz = mat2(cy, -sy, sy, cy) * p.xz;
  p.yz = mat2(cp, -sp, sp, cp) * p.yz;

  float perspective = 2.6 / (2.6 + p.z);
  vec2 screen = p.xy * perspective;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  screen *= min(1.0, aspect / 1.3);
  // World coordinates match centered full-screen UVs normalized by height:
  // a 1600x1000 surface spans x +/-0.8 and y +/-0.5.
  gl_Position = vec4(screen.x * 2.0 / max(aspect, 0.001),
                     screen.y * 2.0, 0.0, 1.0);

  float front = clamp(0.62 - p.z * 1.25, 0.25, 1.0);
  gl_PointSize = clamp(u_resolution.y * 0.0030 * perspective,
                       1.0, 3.6);
  v_opacity = clamp(u_intensity, 0.0, 2.0) * density * strandFade
              * (0.24 + 0.5 * front);
  v_white = 0.82 + 0.18 * front;
}
`
const CANOPY_FRAGMENT = `
// Point sprite fragment for CC-001's source-led canopy approximation.
// Pair with canopy-vertex.glsl. Transparent background, white additive points.
precision mediump float;

varying float v_opacity;
varying float v_white;

void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  // Small bright core, faint soft skirt; no square sprite edges or decorations.
  float core = exp(-r2 * 3.2);
  float halo = exp(-r2 * 2.8) * 0.12;
  float edge = 1.0 - smoothstep(0.72, 1.0, r2);
  float alpha = min((core + halo) * edge * v_opacity * 1.7, 1.0);
  gl_FragColor = vec4(vec3(v_white), alpha);
}
`

interface Resources {
    field: WebGLProgram
    points: WebGLProgram
    quad: WebGLBuffer
    grid: WebGLBuffer
    pointCount: number
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
function createRenderer(canvas: HTMLCanvasElement, initial: Settings, notify: (status: Status, error?: string)=>void) {
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" })
    if (!gl) throw new Error("WebGL is unavailable in this browser.")
    let settings = initial, resources: Resources | undefined
    const locations=new Map<WebGLProgram,Map<string,WebGLUniformLocation|null>>()
    let disposed = false, lost = false, visible = true, width = 1, height = 1, failure = ""
    let frame = 0, last = 0, lastDraw = 0, time = initial.stillTime
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
        if(!resources) return
        gl.deleteBuffer(resources.quad); gl.deleteBuffer(resources.grid)
        gl.deleteProgram(resources.field); gl.deleteProgram(resources.points)
        resources=undefined;locations.clear()
    }
    const allocate = () => {
        let field: WebGLProgram | undefined, points: WebGLProgram | undefined
        let quad: WebGLBuffer | null = null, grid: WebGLBuffer | null = null
        try {
            field=program(VERTEX,FRAGMENT); points=program(CANOPY_VERTEX,CANOPY_FRAGMENT)
            quad=gl.createBuffer(); grid=gl.createBuffer()
            if(!quad||!grid) throw new Error("Could not allocate graphics geometry.")
            gl.bindBuffer(gl.ARRAY_BUFFER,quad)
            gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW)
            const vertices: number[]=[]
            for(let row=0;row<96;row++) for(let col=0;col<128;col++) vertices.push((col+.5)/128,(row+.5)/96,0)
            for(let strand=0;strand<10;strand++) for(let dot=0;dot<96;dot++) vertices.push((strand+.5)/10,(dot+.5)/96,1)
            gl.bindBuffer(gl.ARRAY_BUFFER,grid)
            gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW)
            resources={field,points,quad,grid,pointCount:vertices.length/3}
        } catch(error) {
            if(quad)gl.deleteBuffer(quad); if(grid)gl.deleteBuffer(grid)
            if(field)gl.deleteProgram(field); if(points)gl.deleteProgram(points)
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
        gl.uniform2f(location(p,"u_cssResolution"),width,height)
        gl.uniform2f(location(p,"u_mouse"),mouse[0],mouse[1])
        gl.uniform1f(location(p,"u_time"),time)
        gl.uniform1f(location(p,"u_intensity"),settings.intensity)
        gl.uniform1f(location(p,"u_pixelSize"),settings.pixelSize)
        gl.uniform1f(location(p,"u_mode"),settings.mode==="dither"?0:1)
        gl.uniform3fv(location(p,"u_primary"),rgb(settings.primary,canvas))
        gl.uniform3fv(location(p,"u_secondary"),rgb(settings.secondary,canvas))
        gl.uniform3fv(location(p,"u_ink"),rgb(settings.ink,canvas))
    }
    const draw = () => {
        if(disposed||lost||!resources||width<=0||height<=0) return
        gl.viewport(0,0,canvas.width,canvas.height)
        gl.disable(gl.DITHER)
        gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT)
        if(settings.mode==="canopy") {
            gl.useProgram(resources.points); uniforms(resources.points)
            gl.bindBuffer(gl.ARRAY_BUFFER,resources.grid)
            const a=gl.getAttribLocation(resources.points,"a_grid")
            gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a,2,gl.FLOAT,false,12,0)
            const kind=gl.getAttribLocation(resources.points,"a_kind")
            gl.enableVertexAttribArray(kind);gl.vertexAttribPointer(kind,1,gl.FLOAT,false,12,8)
            gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE)
            gl.drawArrays(gl.POINTS,0,resources.pointCount)
            gl.disable(gl.BLEND); gl.disableVertexAttribArray(a);gl.disableVertexAttribArray(kind)
        } else {
            gl.useProgram(resources.field); uniforms(resources.field)
            gl.bindBuffer(gl.ARRAY_BUFFER,resources.quad)
            const a=gl.getAttribLocation(resources.field,"a_position")
            gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0)
            gl.drawArrays(gl.TRIANGLES,0,6); gl.disableVertexAttribArray(a)
        }
    }
    const stop = () => { if(frame)cancelAnimationFrame(frame); frame=0; last=0; lastDraw=0 }
    const tick = (now: number) => {
        frame=0
        if(!canRun()) { last=0; return }
        if(!last)last=now
        time+=Math.min((now-last)/1000,.1)*settings.speed; last=now
        mouse=mouse.map((v,i)=>v+(targetMouse[i]-v)*.08)
        if(now-lastDraw>=1000/30) { draw(); lastDraw=now }
        frame=requestAnimationFrame(tick)
    }
    const reconcile = () => {
        stop(); notify(status(),failure||undefined)
        if(settings.static||motion.matches)time=settings.stillTime
        draw()
        if(canRun())frame=requestAnimationFrame(tick)
    }
    const resize = () => {
        width=canvas.clientWidth; height=canvas.clientHeight
        // Logical size ignores the editor's canvas zoom; limit actual GPU area.
        const ratio=Math.min(window.devicePixelRatio||1,1.5,Math.sqrt(650000/Math.max(1,width*height)))
        canvas.width=Math.max(1,Math.round(width*ratio)); canvas.height=Math.max(1,Math.round(height*ratio))
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
            settings=next
            if(reset)time=next.stillTime
            if(!next.interactive){mouse=[0,0];targetMouse=[0,0]}
            reconcile()
        },
        renderAt(seconds:number) { stop();time=seconds;draw() },
        dispose() {
            disposed=true;stop();sizeObserver.disconnect();intersection.disconnect()
            canvas.removeEventListener("pointermove",pointer);canvas.removeEventListener("pointerleave",leave)
            canvas.removeEventListener("webglcontextlost",onLost);canvas.removeEventListener("webglcontextrestored",onRestored)
            motion.removeEventListener("change",reconcile);document.removeEventListener("visibilitychange",reconcile)
            release()
        },
    }
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 600
 */
export default function CreativeCodingStudy(props: Props) {
    const {study="dither",animate=true,speed=.65,stillTime=8,intensity=1.1,pixelSize=3,interactive=true,
        primary="#efc8c8",secondary="#d6b442",ink="#424855",showLabels=true,style}=props
    const isStatic=useIsStaticRenderer()
    const canvas=React.useRef<HTMLCanvasElement>(null)
    const renderer=React.useRef<ReturnType<typeof createRenderer>|null>(null)
    const [paused,setPaused]=React.useState(false)
    const [status,setStatus]=React.useState<Status>("static")
    const [error,setError]=React.useState("")
    const settings:Settings={mode:study,animate:animate&&!paused,static:isStatic,speed:Math.max(0,speed),stillTime,intensity,pixelSize:Math.max(1,pixelSize),interactive,primary,secondary,ink}
    React.useEffect(()=>{
        if(!canvas.current)return
        try { renderer.current=createRenderer(canvas.current,settings,(next,detail)=>{setStatus(next);setError(detail??"")}) }
        catch(problem){setError(problem instanceof Error?problem.message:String(problem))}
        return()=>{renderer.current?.dispose();renderer.current=null}
    },[])
    React.useEffect(()=>{renderer.current?.update(settings)},[study,animate,paused,isStatic,speed,stillTime,intensity,pixelSize,interactive,primary,secondary,ink])
    const source=SOURCES[study]
    const color=study==="dither"?ink:"#e2e6ef"
    const mono:React.CSSProperties={fontFamily:'"IBM Plex Mono", monospace',fontSize:10,letterSpacing:".045em",lineHeight:1.5}
    return <div style={{width:"100%",height:"100%",...style,position:"relative",overflow:"hidden",background:study==="dither"?primary:"#030407",color}}>
        <canvas ref={canvas} role="img" aria-label={`${source.title}, animated source-led study of ${source.key} by ${source.account}`} style={{display:"block",width:"100%",height:"100%",touchAction:"pan-y"}} />
        {showLabels&&<>
            <div style={{position:"absolute",left:"5%",top:"6%",pointerEvents:"none"}}>
                <div style={{...mono,opacity:.65}}>SOURCE-LED CODE STUDY / {source.key}</div>
                <div style={{fontFamily:'"Space Grotesk", sans-serif',fontSize:"clamp(14px,2vw,23px)",letterSpacing:"-.035em",marginTop:8,maxWidth:"75%"}}>{source.title}</div>
            </div>
            <a href={source.url} target="_blank" rel="noreferrer" style={{...mono,position:"absolute",left:"5%",bottom:"5%",color,textDecoration:"underline",textUnderlineOffset:3}}>{source.account} ↗</a>
            <div style={{...mono,position:"absolute",right:"5%",bottom:"5%",opacity:.65,pointerEvents:"none",fontSize:8,maxWidth:"55%",textAlign:"right"}}>INDEPENDENT GEOMETRY / SOURCE MOTION APPROXIMATED</div>
        </>}
        {!isStatic&&<button onClick={()=>setPaused(p=>!p)} disabled={status==="reduced-motion"||!animate} aria-pressed={paused} aria-label={paused?"Play animation":"Pause animation"} style={{...mono,position:"absolute",right:"5%",top:"6%",padding:"5px 9px",color,background:"transparent",border:`1px solid ${color}`,cursor:"pointer",opacity:.75}}>
            {status==="reduced-motion"?"REDUCED MOTION":!animate?"MOTION OFF":paused?"PLAY":"PAUSE"}
        </button>}
        {(error||status==="recovering")&&<div role="status" style={{...mono,position:"absolute",inset:"40% 10%",textAlign:"center"}}>{error?<>Graphics unavailable in this browser.<br/>Enable WebGL to view this study.</>:"Restoring graphics…"}</div>}
    </div>
}
addPropertyControls(CreativeCodingStudy,{
    study:{type:ControlType.Enum,title:"Study",options:["dither","canopy","coronal"],optionTitles:["Ordered terrain","Point canopy","Coronal light"],defaultValue:"dither"},
    animate:{type:ControlType.Boolean,title:"Animate",defaultValue:true},
    speed:{type:ControlType.Number,title:"Speed",min:0,max:2,step:.05,defaultValue:.65},
    stillTime:{type:ControlType.Number,title:"Still time",min:0,max:60,step:.5,defaultValue:8},
    intensity:{type:ControlType.Number,title:"Intensity",min:.2,max:2.5,step:.05,defaultValue:1.1},
    pixelSize:{type:ControlType.Number,title:"Pixel size",min:1,max:12,step:1,defaultValue:3,hidden:p=>p.study!=="dither"},
    primary:{type:ControlType.Color,title:"Primary",defaultValue:"#efc8c8",hidden:p=>p.study==="canopy"},
    secondary:{type:ControlType.Color,title:"Secondary",defaultValue:"#d6b442",hidden:p=>p.study==="canopy"},
    ink:{type:ControlType.Color,title:"Ink",defaultValue:"#424855",hidden:p=>p.study!=="dither"},
    interactive:{type:ControlType.Boolean,title:"Mouse",defaultValue:true},
    showLabels:{type:ControlType.Boolean,title:"Credits",defaultValue:true},
})
