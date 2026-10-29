import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget, useIsStaticRenderer } from "framer"

// Source-led field studies. These are independently authored visual and motion
// approximations: no source shader, image, simulation or recording is embedded.
type Mode = "radial" | "ridge" | "corridor" | "glyphs"
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
    // Internal surface-host options. Framer controls remain unchanged.
    managed?: boolean
    renderWidth?: number
    renderHeight?: number
    managedBufferWidth?: number
    managedBufferHeight?: number
    pixelBudget?: number
    colorHost?: HTMLCanvasElement
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
    // Soft overlapping chambers, curled internal folds and a white-blue core
    // follow the sampled source's cloudy radial volume, not clean leaf icons.
    vec2 p=uv-vec2(.015,.12)-u_mouse*.035;
    float r=max(length(p),.003),a=atan(p.y,p.x),t=u_time*.13;
    float warp=fbm(p*6.0+vec2(t,-t*.6)),faces=0.0,edges=0.0,folds=0.0;
    for(int i=0;i<7;i++){
        float k=float(i),count=18.0+mod(k,3.0)*4.0;
        float curved=a+.11*sin(r*8.0-t+k)+.14*(warp-.5);
        float angular=curved*count/(2.0*PI)+k*.43;
        float sector=mod(floor(angular),count),theta=(fract(angular)-.5)*(2.0*PI/count);
        float center=.10+k*.12,len=.125+k*.037;
        float x=(r*cos(theta)-center)/len;
        float width=(.024+k*.012)*(1.0+.18*sin(sector*2.1+k));
        float y=(r*sin(theta)+.017*sin(x*4.5+k+t)*(1.0-min(x*x,1.0)))/width;
        vec2 tissue=vec2(x*2.2+sector*1.7,y*1.6+k*4.3);
        float fluid=fbm(tissue+vec2(t*.35,-t*.3));
        float chamber=pow(abs(x),1.55)+pow(abs(y),1.6)+.25*(fluid-.5);
        float inside=1.0-smoothstep(.88,1.24,chamber);
        float boundary=exp(-abs(chamber-1.0)*8.0);
        float curl=fbm(tissue*2.5+vec2(fluid*2.4,-fluid*1.8));
        float nested=pow(.5+.5*cos(sqrt(max(chamber,.001))*24.0+curl*10.0-t),5.0);
        float relief=.35+.65*(.5+.5*cos(x*3.7+y*.65+fluid*5.0+k));
        faces+=inside*(.16+.27*relief)*(.6+.4*fluid);
        edges+=boundary*(.35+.65*relief);
        folds+=inside*nested*(.3+.7*relief);
    }
    float outer=1.0-smoothstep(.69,1.24,r),core=exp(-r*r*140.0)*4.1;
    float streak=pow(.5+.5*sin(a*75.0+r*9.0+warp*12.0-t),13.0)*exp(-r*1.7);
    float white=((edges*.40+folds*.46+faces*.24+streak*.13)*.62+core)*outer;
    float blue=(faces*.94+folds*.25+edges*.34+.045)*outer*.68;
    return mix(u_ink,lightColor(blue*1.6,white*1.55),outer);
}
vec3 ridge(vec2 uv){
    // Fine domain-warped striations retain the sampled diagonal fluid relief.
    // A broad merging tributary rides above the layered bright lower lip.
    vec2 p=rot(-.57)*(uv-u_mouse*.025);float t=u_time*.13;
    float base=-.12+.035*sin(p.x*5.0-t)+.025*sin(p.x*13.0+t*.6);
    float h=p.y-base;
    vec2 flow=vec2(p.x*3.6+t*.35,h*5.0-t*.25);
    vec2 warp=vec2(fbm(flow+vec2(0,2.1)),fbm(flow+vec2(4.6,0)))-.5;
    vec2 folded=flow+warp*1.65;
    float medium=fbm(folded*2.4+vec2(-t,t*.6));
    float small=fbm(folded*6.0+vec2(t*.5,-t));
    float branches=exp(-abs(medium-.49)*30.0);
    float threads=exp(-abs(small-.51)*48.0);
    float sheet=0.0;
    for(int i=0;i<3;i++){
        float k=float(i);
        float path=.035+k*.13+.045*sin(p.x*(6.0+k*3.0)+t+k*2.2)+.065*(medium-.5);
        float distance=h-path-.025*sin(p.x*27.0+h*11.0+k*4.0+t);
        sheet+=exp(-abs(distance)*(62.0+k*10.0))*(.5+.65*small);
    }
    float front=exp(-abs(h+.04*(medium-.5))*83.0);
    float forkPath=.105+.09*smoothstep(-.1,.5,p.x)+.028*sin(p.x*12.0+t)+.035*(medium-.5);
    float fork=exp(-abs(h-forkPath)*80.0);
    float above=smoothstep(-.055,.07,h),mass=above*exp(-max(h-.05,0.0)*2.5);
    float detail=.45+.55*small;
    float white=front*1.18+fork*.83+mass*(sheet*1.48+branches*detail*1.05+threads*.38);
    float blue=mass*(.27+medium*.26+branches*.35+sheet*.21)+front*.14+fork*.07;
    float falloff=1.0-smoothstep(.38,.88,h);
    return mix(u_ink,lightColor(blue*1.45,white*1.45),falloff);
}
float corridorDistance(vec3 p){
    // Coarse staggered relief carries nested chips. The sampled architecture has
    // large irregular faces and dark recesses, rather than a uniform brick grid.
    p.xy=rot(.035*sin(p.z*.37))*p.xy;
    float erosion=.023*sin(p.y*27.0+sin(p.z*11.0))*sin(p.z*22.0+p.x*7.0);
    erosion+=.019*sin(p.z*51.0+p.y*13.0)*sin(p.y*43.0-p.z*9.0);
    float walls=1.34-max(abs(p.x),abs(p.y))+erosion;
    vec2 xcell=floor(vec2((p.y+.14*floor(p.z/.57))/.48,p.z/.57));
    vec2 ycell=floor(vec2((p.x+.13*floor(p.z/.69))/.51,(p.z+.19)/.69));
    float hx=.13+.40*hash2(xcell+vec2(step(0.0,p.x)*17.0,3.0));
    float hy=.14+.38*hash2(ycell+vec2(11.0,step(0.0,p.y)*23.0));
    vec3 xq=vec3(abs(p.x)-(1.30-hx*.5),mod(p.y+.14*floor(p.z/.57),.48)-.24,mod(p.z,.57)-.285);
    vec3 yq=vec3(mod(p.x+.13*floor(p.z/.69),.51)-.255,abs(p.y)-(1.30-hy*.5),mod(p.z+.19,.69)-.345);
    xq.yz=rot((hash2(xcell+6.3)-.5)*.40)*xq.yz;
    yq.xz=rot((hash2(ycell+4.2)-.5)*.33)*yq.xz;
    vec3 xb=abs(xq)-vec3(hx*.5,.205,.252),yb=abs(yq)-vec3(.221,hy*.5,.308);
    float xd=length(max(xb,0.0))+min(max(xb.x,max(xb.y,xb.z)),0.0);
    float yd=length(max(yb,0.0))+min(max(yb.x,max(yb.y,yb.z)),0.0);
    xd=max(xd,(xq.y-xq.z)*.64-.19)+erosion-.012;
    yd=max(yd,(yq.x+yq.z)*.63-.21)+erosion-.012;
    vec3 cq=vec3(abs(p.x)-1.10,mod(p.y+.07*floor(p.z/.24),.21)-.105,mod(p.z+.11,.24)-.12);
    vec3 cb=abs(cq)-vec3(.08,.073,.085);
    float chip=length(max(cb,0.0))+min(max(cb.x,max(cb.y,cb.z)),0.0)+erosion*.65;
    return min(walls,min(min(xd,yd),chip));
}
vec3 corridor(vec2 uv){
    vec3 ro=vec3(.19+.025*sin(u_time*.17),-.08,u_time*.38);
    vec3 rd=normalize(vec3(uv*1.72+u_mouse*.06,1.22));
    rd.xy=rot(.045+.025*sin(u_time*.12))*rd.xy;
    float travel=.03;vec3 q=ro,volume=vec3(0);bool hit=false;
    for(int i=0;i<80;i++){
        q=ro+rd*travel;float d=corridorDistance(q);
        if(d<.0018){hit=true;break;}
        float stepLength=max(d*.46,.0015);
        float heat=.5+.5*sin(q.z*1.8+q.x*2.2+u_time*.18);
        vec3 hazeColor=mix(u_secondary*vec3(.80,.22,.08),u_primary,heat*heat*.15);
        volume+=hazeColor*exp(-max(d,0.0)*23.0)*min(stepLength,.10)*1.8*exp(-travel*.18);
        travel+=stepLength;if(travel>19.0)break;
    }
    if(!hit)return u_ink+(1.0-exp(-volume*u_intensity));
    vec2 e=vec2(.002,0);
    vec3 normal=normalize(vec3(corridorDistance(q+e.xyy)-corridorDistance(q-e.xyy),corridorDistance(q+e.yxy)-corridorDistance(q-e.yxy),corridorDistance(q+e.yyx)-corridorDistance(q-e.yyx)));
    vec3 lamp=ro+vec3(.67,.80,2.5);float diffuse=max(dot(normal,normalize(lamp-q)),0.0);
    float detail=fbm(q.xy*15.0+vec2(q.z*3.3,-q.z*2.1));
    float fractures=exp(-abs(detail-.51)*30.0);
    float occlusion=clamp(corridorDistance(q+normal*.06)/.06,.12,1.0);
    float side=smoothstep(-.45,.62,q.x+q.y*.38+.12*sin(q.z*2.0));
    float pockets=fbm(q.zy*4.0+vec2(q.x*2.3,-q.x*1.1));
    float hotSites=smoothstep(.39,.62,pockets)*(.20+.80*side);
    float hotFaces=hotSites*(.68+.32*diffuse)*(.55+.45*occlusion);
    vec3 material=u_secondary*vec3(.86,.25,.10)*(.16+diffuse*.92)*occlusion;
    vec3 incandescent=mix(u_primary*vec3(1.12,.85,.54),vec3(1.0,.94,.72),smoothstep(.30,.8,hotSites));
    // Broad heated faces retain marbled/chipped relief; smaller cracks connect
    // them across otherwise dark burgundy blocks and deep recessed architecture.
    float crackEnergy=fractures*(.16+hotSites*.72);
    vec3 emission=incandescent*(hotFaces*3.5+crackEnergy*.65);
    float distanceFade=exp(-travel*.22);
    vec3 color=material*distanceFade+emission*exp(-travel*.28)+volume*.35;
    return u_ink+(1.0-exp(-color*u_intensity*1.6));
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
    // Subtle continuous warping keeps bowls and stems gestural. These are loose
    // luminous writing fragments, rather than a collection of clean font glyphs.
    p.x+=.012*sin(p.y*18.0+phase*.3)+.006*sin(p.y*39.0+kind*2.0);
    p.y+=.009*sin(p.x*23.0+kind*1.7);
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
    if(kind<3.5){
        d=segment(p,vec2(-.075,.17),vec2(-.055,-.18));
        return min(d,segment(p,vec2(-.15,-.015),vec2(.12,.005)));
    }
    if(kind<4.5){
        d=arc(p-vec2(-.018,.072),vec2(.075,.105),1.45,.15+phase*.04);
        return min(d,arc(p+vec2(-.005,.087),vec2(.105,.105),1.5,PI+phase*.04));
    }
    if(kind<5.5){
        d=segment(p,vec2(-.035,-.13),vec2(.025,.18));
        return min(d,arc(p+vec2(.012,.12),vec2(.07,.06),1.1,1.0));
    }
    if(kind<6.5){
        d=arc(p-vec2(.015,.045),vec2(.09,.10),.9,phase+.8);
        return min(d,segment(p,vec2(-.06,-.15),vec2(.11,-.15)));
    }
    d=arc(p,vec2(.115,.155),1.25,phase);
    return min(d,segment(p,vec2(-.12,.01),vec2(.105,.01)));
}
vec3 glyphs(vec2 uv){
    vec3 glow=vec3(0);float t=u_time*.28;
    // Fine distant scratches and faint crossbars supply the source's floating
    // depth; the foreground varies from tiny fragments to oversized loose loops.
    for(int i=0;i<42;i++){
        float k=float(i),seed=hash(k+142.0);
        vec2 center=vec2((hash(k+111.0)-.5)*1.85,(hash(k+170.0)-.5)*1.02);
        vec2 p=uv-center-vec2(.002*sin(t+k),.004*cos(t*.6+k));
        float length=.005+.018*hash(k+96.0);
        float d=segment(p,vec2(0,-length),vec2(.0015*sin(k),length));
        if(seed>.65)d=min(d,segment(p,vec2(-length*.65,0),vec2(length*.65,0)));
        glow+=mix(u_secondary,u_primary,seed)*exp(-d*d/.0000012)*(.06+.16*seed);
    }
    for(int i=0;i<24;i++){
        float k=float(i),seed=hash(k+2.0);
        vec2 center=vec2((hash(k+18.0)-.5)*1.55,(hash(k+37.0)-.5)*.82);
        float size=.12+.58*pow(hash(k+48.0),1.30);
        float kind=floor(hash(k+71.0)*8.0),angle=(hash(k+91.0)-.5)*.75;
        if(i==0){center=vec2(-.25,-.035);size=2.0;kind=0.0;angle=-.26;}
        if(i==1){center=vec2(-.15,-.055);size=.88;kind=2.0;angle=-.10;}
        if(i==2){center=vec2(.04,.055);size=.98;kind=1.0;angle=.06;}
        if(i==3){center=vec2(.37,.16);size=.68;kind=1.0;angle=.18;}
        if(i==4){center=vec2(.47,-.24);size=.88;kind=2.0;angle=.45;}
        for(int j=0;j<3;j++){
            float lag=float(j)*.42,phase=t-lag;
            vec2 drift=vec2(sin(phase*.85+k*2.0),cos(phase*.7+k))*vec2(.022,.017);
            vec2 p=rot(angle+.09*sin(phase+k))*(uv-center-drift-u_mouse*.018)/size;
            float d=gesture(p,kind,phase*.18+k*.28);
            float width=(.00135+.0012*seed)/size;
            float core=exp(-d*d/(width*width));
            float halo=exp(-d*90.0*size)*.12;
            float fade=exp(-float(j)*1.65);
            float flicker=.7+.3*sin(t*.7+k*2.3);
            if(i==0)flicker*=.21;
            glow+=mix(u_primary,u_secondary,step(.57,seed))*(core+halo)*fade*flicker;
        }
    }
    // Compact luminous dashes and writing fragments sit in front of the faint
    // loop field. They carry the sampled source's short bright mark hierarchy.
    for(int i=0;i<18;i++){
        float k=float(i),seed=hash(k+244.0);
        vec2 center=vec2((hash(k+231.0)-.5)*1.48,(hash(k+272.0)-.5)*.78);
        if(i==0)center=vec2(.27,.055);
        if(i==1)center=vec2(-.12,-.20);
        if(i==2)center=vec2(.22,-.32);
        vec2 p=rot((hash(k+289.0)-.5)*.24)*(uv-center-vec2(.004*sin(t+k),.002*cos(t+k)));
        float length=.009+.030*seed;
        float d=segment(p,vec2(-length,0),vec2(length,.002*sin(k)));
        if(seed>.82)d=segment(p,vec2(0,-length),vec2(.002,length));
        float width=.0013+.0014*hash(k+299.0);
        float core=exp(-d*d/(width*width)),halo=exp(-d*135.0)*.14;
        glow+=mix(u_primary,u_secondary,step(.80,seed))*(core+halo)*(.46+.55*seed);
    }
    vec3 dust=vec3(hash2(floor(gl_FragCoord.xy))*u_grain*.028);
    return u_ink+dust+(1.0-exp(-glow*u_intensity*1.2));
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
        gl.uniform1f(location(p,"u_mode"),settings.mode==="radial"?0:settings.mode==="ridge"?1:settings.mode==="corridor"?2:3)
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
export default function FieldCodingStudy(props: Props) {
    const {study="radial",animate=true,canvasMotion=false,speed=.65,stillTime=8,intensity=1.1,
        scale=1,grain=.35,interactive=true,
        primary="#b5f1ff",secondary="#2c6be4",ink="#01040c",showLabels=true,style}=props
    const staticRenderer=useIsStaticRenderer(),target=RenderTarget.current()
    const canvasPreview=canvasMotion&&target===RenderTarget.canvas
    const isStatic=target===RenderTarget.export||target===RenderTarget.thumbnail||(staticRenderer&&!canvasPreview)
    const root=React.useRef<HTMLDivElement>(null),canvas=React.useRef<HTMLCanvasElement>(null)
    const [paused,setPaused]=React.useState(false)
    const [status,setStatus]=React.useState<Status>("offscreen"),[error,setError]=React.useState("")
    const settings:Settings={mode:study,animate:animate&&!paused,static:isStatic,canvasPreview,speed:Math.max(0,speed),stillTime,intensity,
        scale:Math.max(.5,scale),grain:Math.max(0,grain),interactive,primary,secondary,ink}
    const requestMotion=useStudySurface(root,canvas,settings,target,"FieldCodingStudy.tsx",(s,e)=>{setStatus(s);setError(e??"")})
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
            <div style={{...mono,position:"absolute",right:"5%",bottom:"5%",opacity:.65,pointerEvents:"none",fontSize:8,maxWidth:"55%",textAlign:"right"}}>INDEPENDENT CODE / SOURCE EFFECT APPROXIMATED</div>
        </>}
        {!isStatic&&<button onClick={()=>{if(status==="waiting"){setPaused(false);requestMotion()}else setPaused(p=>!p)}} disabled={status==="reduced-motion"||!animate||speed<=0} aria-pressed={paused} aria-label={paused||status==="waiting"?"Play animation":"Pause animation"} style={{...mono,position:"absolute",right:"5%",top:"6%",padding:"5px 9px",color,background:"transparent",border:"1px solid "+color,cursor:"pointer",opacity:.75}}>
            {status==="reduced-motion"?"REDUCED MOTION":!animate||speed<=0?"MOTION OFF":paused||status==="waiting"?"PLAY":"PAUSE"}
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
