import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget, useIsStaticRenderer } from "framer"

// Original animated material treatments of the existing Monarchic brand mark.
// The canonical brand geometry is credited below; no new logo authorship is claimed.
type Mode = "press" | "contour" | "chrome" | "phosphor"
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
    managedBufferWidth?: number
    managedBufferHeight?: number
    pixelBudget?: number
    colorHost?: HTMLCanvasElement
}
const STUDIES = {
    press:{key:"LG-01",title:"Pigment relief"},
    contour:{key:"LG-02",title:"Optical counterform"},
    chrome:{key:"LG-03",title:"Chrome cut"},
    phosphor:{key:"LG-04",title:"Phosphor carrier"},
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
const float LOGO_SPAN=1.30;
mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float bayer(vec2 p){vec2 a=mod(floor(p),4.0),lo=mod(a,2.0),hi=floor(a/2.0);float x=2.0*lo.x+3.0*lo.y-4.0*lo.x*lo.y,y=2.0*hi.x+3.0*hi.y-4.0*hi.x*hi.y;return(4.0*x+y+.5)/16.0;}
float logoDistance(vec2 p){
    vec2 uv=p/LOGO_SPAN+.5;
    vec2 bounded=clamp(uv,vec2(.5/1024.0),vec2(1023.5/1024.0));
    vec4 field=texture2D(u_panel,bounded);
    float encodedDistance=(field.r*65280.0+field.g*255.0)/65535.0;
    float distance=(encodedDistance-.5)*2048.0*(LOGO_SPAN/1024.0);
    return distance+length((uv-bounded)*LOGO_SPAN);
}
float pixelWorld(){float fit=min(1.0,u_resolution.x/u_resolution.y/1.35);return 1.0/max(1.0,u_resolution.y*u_scale*fit);}
vec2 logoGradient(vec2 p){float e=max(LOGO_SPAN/1024.0,pixelWorld()*.7);return vec2(logoDistance(p+vec2(e,0))-logoDistance(p-vec2(e,0)),logoDistance(p+vec2(0,e))-logoDistance(p-vec2(0,e)))/(2.0*e);}
vec3 logoSpace(vec3 p,float material){
    float span=u_focus/.65;
    p.xy=rot(material<.5?-.17:.12)*p.xy;
    p.xz=rot((material<.5?-.29:.30)+.070*sin(u_time*.22)*span+u_mouse.x*.15)*p.xz;
    p.yz=rot((material<.5?.20:-.16)+.055*cos(u_time*.19)*span+u_mouse.y*.13)*p.yz;
    return p;
}
float logoSolid(vec3 p,float material){
    vec3 q=logoSpace(p,material);
    float bevel=material<.5?.0045:.008;
    float depth=(material<.5?.055:.075)*(1.0+(u_refraction-.85)*.65);
    // The compensated rounded extrusion preserves the canonical outer contour.
    vec2 d=vec2(logoDistance(q.xy)+bevel,abs(q.z)-depth+bevel);
    return min(max(d.x,d.y),0.0)+length(max(d,0.0))-bevel;
}
vec3 solidNormal(vec3 p,float material){vec2 e=vec2(.0016,0);return normalize(vec3(logoSolid(p+e.xyy,material)-logoSolid(p-e.xyy,material),logoSolid(p+e.yxy,material)-logoSolid(p-e.yxy,material),logoSolid(p+e.yyx,material)-logoSolid(p-e.yyx,material)));}
bool intersectLogo(vec3 ro,vec3 rd,float material,out vec3 hit){
    float t=1.20;
    for(int i=0;i<100;i++){
        float d=logoSolid(ro+rd*t,material);
        if(d<.00065){hit=ro+rd*t;return true;}
        t+=max(d*.65,.00035);
        if(t>4.5)break;
    }
    hit=ro+rd*t;return false;
}
vec3 pigmentPress(vec2 p){
    vec3 paper=u_secondary;
    vec3 color=paper;
    vec3 ro=vec3(0,0,2.9),rd=normalize(vec3((p-vec2(-.025,.005))*1.13,-2.9));
    vec3 hit;
    if(intersectLogo(ro,rd,0.0,hit)){
        vec3 n=solidNormal(hit,0.0),local=logoSpace(hit,0.0);
        vec3 light=normalize(vec3(-.65,.85,1.1));
        float diffuse=max(dot(n,light),0.0);
        float ambient=clamp(logoSolid(hit+n*.040,0.0)/.025,.0,1.0);
        float shine=pow(max(dot(reflect(-light,n),-rd),0.0),30.0);
        float tone=clamp((.14+.66*diffuse+.24*shine)*mix(.63,1.0,ambient),0.0,1.0);
        float weave=.5+.5*sin(local.x*7.5+local.y*5.5+.12*sin(u_time*.19));
        tone=clamp(tone+weave*.055,0.0,1.0);
        float threshold=bayer(gl_FragCoord.xy/(1.0+u_grain*.55));
        threshold=clamp(threshold+(hash(floor(gl_FragCoord.xy))-.5)*u_grain*.15,0.0,1.0);
        vec3 shadow=mix(u_ink,u_primary,.17);
        if(tone<.38)color=mix(u_ink,shadow,step(threshold,tone/.38));
        else if(tone<.76)color=mix(shadow,u_primary,step(threshold,(tone-.38)/.38));
        else color=mix(u_primary,paper,step(threshold,(tone-.76)/.24));
    }
    color+=(hash(floor(gl_FragCoord.xy))-.5)*u_grain*.012;
    return color*u_intensity;
}
float stripeIntegral(float phase,float halfWidth){float shifted=phase+halfWidth,n=floor(shifted/PI);return n*(2.0*halfWidth)+clamp(shifted-n*PI,0.0,2.0*halfWidth);}
float stripe(float phase,float footprint,float cut){float h=asin(cut),w=max(footprint,.0001);return clamp((stripeIntegral(phase+w*.5,h)-stripeIntegral(phase-w*.5,h))/w,0.0,1.0);}
vec3 opticalContour(vec2 p){
    float d=logoDistance(p),px=pixelWorld();
    vec2 gradient=logoGradient(p);
    float pitch=min(215.0,.82/px);
    float phase=d*pitch-sin(u_time*.26)*(.45+4.0*u_focus);
    float footprint=max(.02,(abs(gradient.x)+abs(gradient.y))*px*pitch);
    float inkLine=stripe(phase,footprint,.35);
    float inside=1.0-smoothstep(-px,px,d);
    float surrounding=(1.0-smoothstep(.11,.29,d))*(1.0-inside);
    float field=inside+surrounding*.30;
    // Leave the authentic diagonal counterform open even while its banks radiate.
    float across=dot(p,normalize(vec2(.761,-.649)));
    float along=dot(p,normalize(vec2(.649,.761)));
    float openCut=(1.0-smoothstep(.037,.050,abs(across)))*(1.0-smoothstep(.30,.44,abs(along)))*(1.0-inside);
    field*=1.0-openCut;
    vec3 color=mix(u_primary,u_ink,inkLine*field);
    float edge=exp(-abs(d)*650.0);
    float edgeGate=pow(max(.0,dot(normalize(gradient+vec2(.00001)),normalize(vec2(.8,-.6)))),8.0);
    color=mix(color,u_secondary,edge*edgeGate*.86);
    color+=(hash(floor(gl_FragCoord.xy))-.5)*u_grain*.016;
    return color*u_intensity;
}
vec3 chromeField(vec2 p){
    vec3 paper=mix(vec3(.95,.94,.97),u_secondary,.11);
    float atmosphere=exp(-dot(p-vec2(-.25,.25),p-vec2(-.25,.25))*2.4);
    return mix(paper,u_primary,.035+.05*atmosphere);
}
// Smooth the sampled-field gradient over 9.5 atlas texels for reflective normals.
// Intersection uses the original field, retaining the canonical logo contour.
vec3 chromeNormal(vec3 p){vec2 e=vec2(.012,0);return normalize(vec3(logoSolid(p+e.xyy,1.0)-logoSolid(p-e.xyy,1.0),logoSolid(p+e.yxy,1.0)-logoSolid(p-e.yxy,1.0),logoSolid(p+e.yyx,1.0)-logoSolid(p-e.yyx,1.0)));}
vec3 chromeMark(vec2 p){
    vec3 color=chromeField(p);
    vec3 ro=vec3(0,0,2.9),rd=normalize(vec3((p-vec2(.015,.0))*1.13,-2.9)),hit;
    if(!intersectLogo(ro,rd,1.0,hit))return color*u_intensity;
    vec3 n=chromeNormal(hit),r=reflect(rd,n);
    float facing=max(dot(n,-rd),0.0),fresnel=.07+.93*pow(1.0-facing,4.0);
    // A coherent studio environment defines real faces and the narrow bevel.
    float broad=exp(-pow((r.y-.34)/.23,2.0));
    float side=exp(-pow((r.x+.44)/.19,2.0));
    float strip=exp(-pow((r.y+.45*r.x+.12)/.030,2.0));
    float black=exp(-pow((r.x-.32*r.y-.17)/.13,2.0));
    vec3 environment=mix(u_ink*.12,u_primary*.92,.17+.75*clamp(broad+side*.68,0.0,1.0));
    environment=mix(environment,u_ink*.055,black*.91);
    environment+=vec3(.98,.99,1.0)*(strip*.62+broad*.26+side*.42);
    vec3 spectrum=.5+.5*cos(vec3(.2,2.3,4.5)+r.y*5.0+r.x*2.4);
    environment+=spectrum*u_secondary*(.10+.22*fresnel)*(.25+.75*side);
    float ambient=clamp(logoSolid(hit+n*.028,1.0)/.018,0.0,1.0);
    color=environment*mix(.68,1.0,ambient);
    color+=vec3(.80,.88,.96)*pow(1.0-facing,3.0)*.18;
    color=vec3(1.0)-exp(-max(color,vec3(0.0))*1.45);
    color+=(hash(floor(gl_FragCoord.xy))-.5)*u_grain*.018;
    return color*u_intensity;
}
vec3 phosphorMark(vec2 p){
    float px=pixelWorld(),spacing=max(.0049,px*2.3);
    vec3 color=u_ink*.44;
    float across=dot(p,normalize(vec2(.761,-.649)));
    float along=dot(p,normalize(vec2(.649,.761)));
    float traveler=sin(u_time*.38)*(.16+.36*u_focus);
    float pulse=exp(-pow((along-traveler)/.115,2.0));
    for(int i=0;i<4;i++){
        float layer=float(i);
        vec2 q=p+vec2(.010,-.007)*layer;
        float d=logoDistance(q);
        float mask=1.0-smoothstep(-px*.8,px*.8,d);
        vec2 grid=q/spacing,cell=floor(grid),f=fract(grid)-.5;
        float dotMask=1.0-smoothstep(.19,.48,length(f));
        float scan=.52+.48*pow(max(cos(q.y*245.0-u_time*.7-layer*.8),0.0),5.0);
        float drift=.62+.38*sin(cell.x*.23+cell.y*.17-u_time*.4);
        float alpha=exp(-layer*.65);
        vec3 cold=mix(u_primary,u_secondary,pow(max(.0,sin(cell.x*.17+cell.y*.11)),12.0)*.18);
        color+=cold*mask*(.020+dotMask*scan*drift*.58)*alpha;
    }
    float d=logoDistance(p);
    float edge=exp(-abs(d)*600.0);
    float cutEdge=exp(-abs(abs(across)-.050)*260.0)*(1.0-smoothstep(.32,.46,abs(along)));
    color+=u_primary*edge*.14;
    color+=mix(u_primary,vec3(.94,1.0,.99),.72)*cutEdge*pulse*(.42+edge*1.65);
    color+=u_secondary*cutEdge*exp(-pow((along-traveler+.12)/.16,2.0))*.25;
    color=vec3(1.0)-exp(-color*1.35);
    color*=1.0+(hash(floor(gl_FragCoord.xy))-.5)*u_grain*.07;
    return color*u_intensity;
}
void main(){
    vec2 p=(gl_FragCoord.xy-.5*u_resolution)/u_resolution.y;
    float fit=min(1.0,u_resolution.x/u_resolution.y/1.35);
    p/=max(u_scale,.1)*fit;
    p+=u_mouse*.012;
    vec3 color;
    if(u_mode<.5)color=pigmentPress(p);
    else if(u_mode<1.5)color=opticalContour(p);
    else if(u_mode<2.5)color=chromeMark(p);
    else color=phosphorMark(p);
    gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);
}
`
interface Resources {
    field: WebGLProgram
    quad: WebGLBuffer
    panel: WebGLTexture
}
/** Canonical Monarchic brand geometry; treatments do not claim authorship of the mark.
 * Source: https://github.com/monarchic-meta/logo/blob/1844d35d6ffdedf2356ec929c36bb5c0454cf645/logo.svg
 * SVG SHA-256: 71ef4b559a2f2bfaf8f8e00dffa6a820c35a3a9b77b2c55ec05c26ccc002a543
 * Canvas coordinates retain viewBox 0 0 1024 1024; positive distance is outside.
 * RG packs a 16-bit scalar; B is the original antialiased coverage; A is opaque.
 * Shader decode: ((dot(tex.rg, vec2(65280.,255.))/65535.)-.5)*2.*rangePx.
 * This is a sampled, pixel-grid distance approximation, not exact Bezier distance.
 */
const MONARCHIC_LOGO_PATH = "M706.66949231,346.05157482 C706.66949231,346.05157482 873.94267733,150.05732267 873.94267733,150.05732267 C873.94267733,150.05732267 767.86426108,150.05732267 767.86426108,150.05732267 C767.86426108,150.05732267 645.32365472,293.63834253 645.32365472,293.63834253 C668.44455564,307.79775793 689.14966036,325.52532756 706.66949231,346.05157482 ZM645.32365472,293.63834253 C606.48376029,269.85249606 560.82665278,256.13573892 512,256.13573892 C370.81799556,256.13573892 256.13573892,370.81799556 256.13573892,512 C256.13573892,575.28945904 279.18199112,633.25359671 317.33050769,677.94842518 C317.33050769,677.94842518 645.32365472,293.63834253 645.32365472,293.63834253 ZM378.67634528,730.3616574700001 C378.67634528,730.3616574700001 706.66949231,346.05157482 706.66949231,346.05157482 C744.81800888,390.74640329 767.86426108,448.71054096 767.86426108,512 C767.86426108,653.18200444 653.18200444,767.86426108 512,767.86426108 C463.17334722,767.86426108 417.51623971000004,754.14750394 378.67634528,730.3616574700001 ZM317.33050769,677.94842518 C317.33050769,677.94842518 150.05732267,873.94267733 150.05732267,873.94267733 C150.05732267,873.94267733 256.13573892,873.94267733 256.13573892,873.94267733 C256.13573892,873.94267733 378.67634528,730.3616574700001 378.67634528,730.3616574700001 C355.55544436,716.20224207 334.85033964,698.4746724400001 317.33050769,677.94842518 Z";
const MONARCHIC_LOGO_VIEWBOX = [0, 0, 1024, 1024] as const;
const LOGO_SDF_SIZE = 1024;
const LOGO_SDF_DISTANCE_RANGE_PX = 1024;

/** Squared Euclidean distance to the selected binary feature, in O(width*height). */
function logoSquaredDistance(mask: Uint8Array, width: number, height: number, feature: number): Float64Array {
    const infinity = 1e12;
    const work = new Float64Array(width * height);
    const result = new Float64Array(width * height);
    const length = Math.max(width, height);
    const input = new Float64Array(length);
    const output = new Float64Array(length);
    const sites = new Int32Array(length);
    const limits = new Float64Array(length + 1);
    const transform = (count: number) => {
        let last = -1;
        for (let q = 0; q < count; q++) {
            if (input[q] >= infinity) continue;
            let crossing = -Infinity;
            while (last >= 0) {
                const p = sites[last];
                crossing = ((input[q] + q * q) - (input[p] + p * p)) / (2 * (q - p));
                if (crossing > limits[last]) break;
                last--;
            }
            last++;
            sites[last] = q;
            limits[last] = last === 0 ? -Infinity : crossing;
            limits[last + 1] = Infinity;
        }
        if (last < 0) { output.fill(infinity, 0, count); return; }
        let site = 0;
        for (let q = 0; q < count; q++) {
            while (limits[site + 1] < q) site++;
            const distance = q - sites[site];
            output[q] = distance * distance + input[sites[site]];
        }
    };
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) input[x] = mask[y * width + x] === feature ? 0 : infinity;
        transform(width);
        for (let x = 0; x < width; x++) work[y * width + x] = output[x];
    }
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) input[y] = work[y * width + x];
        transform(height);
        for (let y = 0; y < height; y++) result[y * width + x] = output[y];
    }
    return result;
}

/** Exact sign at the documented alpha>=128 threshold; approximate pixel-grid distance. */
function packMonarchicLogoSDF(coverage: Uint8Array, size: number, rangePx = LOGO_SDF_DISTANCE_RANGE_PX): Uint8ClampedArray {
    if (!Number.isInteger(size) || size < 1 || size > 4096 || coverage.length !== size * size || !Number.isFinite(rangePx) || rangePx <= 0) throw new Error("Invalid logo distance-field dimensions or range");
    const mask = new Uint8Array(coverage.length);
    let insideCount = 0;
    for (let i = 0; i < mask.length; i++) { mask[i] = coverage[i] >= 128 ? 1 : 0; insideCount += mask[i]; }
    const rgba = new Uint8ClampedArray(mask.length * 4);
    const toInside = insideCount === 0 || insideCount === mask.length ? null : logoSquaredDistance(mask, size, size, 1);
    const toOutside = toInside ? logoSquaredDistance(mask, size, size, 0) : null;
    for (let i = 0; i < mask.length; i++) {
        let distance = insideCount === 0 ? rangePx : -rangePx;
        if (toInside && toOutside) {
            distance = mask[i] ? .5 - Math.sqrt(toOutside[i]) : Math.sqrt(toInside[i]) - .5;
            if (coverage[i] > 0 && coverage[i] < 255) distance = .5 - coverage[i] / 255;
        }
        const normalized = Math.max(0, Math.min(1, .5 + distance / (2 * rangePx)));
        const word = Math.round(normalized * 65535);
        rgba[i * 4] = word >>> 8;
        rgba[i * 4 + 1] = word & 255;
        rgba[i * 4 + 2] = coverage[i];
        rgba[i * 4 + 3] = 255;
    }
    return rgba;
}

let monarchicLogoAtlas: HTMLCanvasElement | null = null;

/** Synchronous, network-free, once-per-module atlas used by LogoStudy's u_panel hook. */
function paintPanel(): HTMLCanvasElement {
    if (monarchicLogoAtlas) return monarchicLogoAtlas;
    const canvas = document.createElement("canvas");
    canvas.width = LOGO_SDF_SIZE;
    canvas.height = LOGO_SDF_SIZE;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Logo distance field requires Canvas 2D");
    context.clearRect(0, 0, LOGO_SDF_SIZE, LOGO_SDF_SIZE);
    context.setTransform(LOGO_SDF_SIZE / 1024, 0, 0, LOGO_SDF_SIZE / 1024, 0, 0);
    context.fillStyle = "#000000";
    context.fill(new Path2D(MONARCHIC_LOGO_PATH));
    const raster = context.getImageData(0, 0, LOGO_SDF_SIZE, LOGO_SDF_SIZE);
    const coverage = new Uint8Array(LOGO_SDF_SIZE * LOGO_SDF_SIZE);
    for (let i = 0; i < coverage.length; i++) coverage[i] = raster.data[i * 4 + 3];
    const atlas = context.createImageData(LOGO_SDF_SIZE, LOGO_SDF_SIZE);
    atlas.data.set(packMonarchicLogoSDF(coverage, LOGO_SDF_SIZE));
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.putImageData(atlas, 0, 0);
    monarchicLogoAtlas = canvas;
    return canvas;
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
        gl.uniform1f(location(p,"u_mode"),settings.mode==="press"?0:settings.mode==="contour"?1:settings.mode==="chrome"?2:3)
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
        // Logical CSS geometry remains independent of screen-space raster LOD.
        const pixelBudget=settings.pixelBudget??(settings.static?2000000:1000000)
        const ratio=Math.min(window.devicePixelRatio||1,2,Math.sqrt(pixelBudget/Math.max(1,width*height)))
        const requestedWidth=settings.managed?settings.managedBufferWidth??Math.floor(width*ratio):Math.floor(width*ratio)
        const requestedHeight=settings.managed?settings.managedBufferHeight??Math.floor(height*ratio):Math.floor(height*ratio)
        const bufferWidth=Math.max(1,Math.min(Math.floor(pixelBudget),Math.floor(requestedWidth)))
        const bufferHeight=Math.max(1,Math.min(Math.floor(pixelBudget/bufferWidth),Math.floor(requestedHeight)))
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
    try{resize()}catch(error){
        disposed=true;stop();sizeObserver.disconnect();intersection.disconnect()
        canvas.removeEventListener("pointermove",pointer);canvas.removeEventListener("pointerleave",leave)
        canvas.removeEventListener("webglcontextlost",onLost);canvas.removeEventListener("webglcontextrestored",onRestored)
        motion.removeEventListener("change",reconcile);document.removeEventListener("visibilitychange",reconcile)
        try{release()}finally{gl.getExtension("WEBGL_lose_context")?.loseContext()}
        throw error
    }
    return {
        update(next:Settings) {
            const reset=next.mode!==settings.mode||next.stillTime!==settings.stillTime
            const resizeNeeded=next.canvasPreview!==settings.canvasPreview||next.renderWidth!==settings.renderWidth||next.renderHeight!==settings.renderHeight||next.pixelBudget!==settings.pixelBudget||next.managedBufferWidth!==settings.managedBufferWidth||next.managedBufferHeight!==settings.managedBufferHeight
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
        const keep=preserveLarger&&target.width*target.height>source.width*source.height
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
    return()=>{if(entry.current)pool.current?.request(entry.current)}
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 600
 */
export default function LogoStudy(props: Props) {
    const {study="press",animate=true,canvasMotion=false,speed=.65,stillTime=8,intensity=1.05,
        scale=1,grain=.65,focus=.65,refraction=.85,interactive=true,
        primary="#be5032",secondary="#eee4d2",ink="#222a29",showLabels=true,style}=props
    const staticRenderer=useIsStaticRenderer(),target=RenderTarget.current()
    const canvasPreview=canvasMotion&&target===RenderTarget.canvas
    const isStatic=target===RenderTarget.export||target===RenderTarget.thumbnail||(staticRenderer&&!canvasPreview)
    const root=React.useRef<HTMLDivElement>(null),canvas=React.useRef<HTMLCanvasElement>(null)
    const [paused,setPaused]=React.useState(false)
    const [status,setStatus]=React.useState<Status>("offscreen"),[error,setError]=React.useState("")
    const settings:Settings={mode:study,animate:animate&&!paused,static:isStatic,canvasPreview,speed:Math.max(0,speed),stillTime,intensity,
        scale:Math.max(.5,scale),grain:Math.max(0,grain),focus:Math.max(0,Math.min(1,focus)),refraction:Math.max(0,refraction),interactive,primary,secondary,ink}
    const requestMotion=useStudySurface(root,canvas,settings,target,"LogoStudy.tsx",(s,e)=>{setStatus(s);setError(e??"")})
    const source=STUDIES[study],color=study==="phosphor"?"#dbeef0":ink
    const mono:React.CSSProperties={fontFamily:'"IBM Plex Mono", monospace',fontSize:10,letterSpacing:".045em",lineHeight:1.5}
    return <div ref={root} role="group" aria-label={source.title} style={{width:"100%",height:"100%",...style,position:"relative",overflow:"hidden",background:study==="phosphor"?ink:study==="press"?secondary:study==="contour"?primary:"#ede9f4",color}}>
        <canvas ref={canvas} role="img" aria-label={source.title+", independently composed animated graphic "+source.key} style={{display:"block",width:"100%",height:"100%",touchAction:"pan-y"}} />
        {showLabels&&<>
            <div style={{position:"absolute",left:"5%",top:"6%",pointerEvents:"none"}}>
                <div style={{...mono,opacity:.65}}>BRAND MARK STUDY / {source.key}</div>
                {<div style={{fontFamily:'"Space Grotesk", sans-serif',fontSize:"clamp(14px,2vw,23px)",letterSpacing:"-.035em",marginTop:8,maxWidth:"75%"}}>{source.title}</div>}
            </div>
            <div style={{...mono,position:"absolute",left:"5%",bottom:"5%",opacity:.65}}>MONARCHIC / {source.key}</div>
            <div style={{...mono,position:"absolute",right:"5%",bottom:"5%",opacity:.65,pointerEvents:"none",fontSize:8,maxWidth:"55%",textAlign:"right"}}>EXISTING BRAND GEOMETRY / PROCEDURAL MATERIAL</div>
        </>}
        {!isStatic&&<button onClick={()=>{if(status==="waiting"){setPaused(false);requestMotion()}else setPaused(p=>!p)}} disabled={status==="reduced-motion"||!animate||speed<=0} aria-pressed={paused} aria-label={paused||status==="waiting"?"Play animation":"Pause animation"} style={{...mono,position:"absolute",right:"5%",top:"6%",padding:"5px 9px",color,background:"transparent",border:"1px solid "+color,cursor:"pointer",opacity:.75}}>
            {status==="reduced-motion"?"REDUCED MOTION":!animate||speed<=0?"MOTION OFF":paused||status==="waiting"?"PLAY":"PAUSE"}
        </button>}
        {(error||status==="recovering")&&<div role="status" style={{...mono,position:"absolute",inset:"40% 10%",textAlign:"center"}}>{error?<>Graphics unavailable in this browser.<br/>Enable WebGL to view this study.</>:"Restoring graphics…"}</div>}
    </div>
}
addPropertyControls(LogoStudy,{
    study:{type:ControlType.Enum,title:"Study",options:["press","contour","chrome","phosphor"],optionTitles:["Pigment relief","Optical counterform","Chrome cut","Phosphor carrier"],defaultValue:"press"},
    animate:{type:ControlType.Boolean,title:"Animate",defaultValue:true},
    canvasMotion:{type:ControlType.Boolean,title:"Canvas motion",defaultValue:false},
    speed:{type:ControlType.Number,title:"Speed",min:0,max:2,step:.05,defaultValue:.65},
    stillTime:{type:ControlType.Number,title:"Still time",min:0,max:60,step:.5,defaultValue:8},
    intensity:{type:ControlType.Number,title:"Intensity",min:.2,max:2.5,step:.05,defaultValue:1.05},
    scale:{type:ControlType.Number,title:"Scale",min:.5,max:1.5,step:.05,defaultValue:1},
    grain:{type:ControlType.Number,title:"Grain",min:0,max:1,step:.05,defaultValue:.65},
    focus:{type:ControlType.Number,title:"Motion span",min:0,max:1,step:.05,defaultValue:.65},
    refraction:{type:ControlType.Number,title:"Relief",min:0,max:1.5,step:.05,defaultValue:.85,hidden:p=>p.study!=="press"&&p.study!=="chrome"},
    primary:{type:ControlType.Color,title:"Primary",defaultValue:"#be5032"},
    secondary:{type:ControlType.Color,title:"Secondary",defaultValue:"#eee4d2"},
    ink:{type:ControlType.Color,title:"Ink",defaultValue:"#222a29"},
    interactive:{type:ControlType.Boolean,title:"Mouse",defaultValue:true},
    showLabels:{type:ControlType.Boolean,title:"Labels",defaultValue:true},
})
