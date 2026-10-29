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
    managedBufferWidth?: number
    managedBufferHeight?: number
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
    float flap=.83+.20*sin(t*1.15);p.x=abs(p.x)/flap;
    // Rounded upper chambers sweep toward short tapered tips; small lower
    // lobes and a narrow central gap keep the compact butterfly-like silhouette.
    vec2 a=vec2(.009,.006),b=vec2(.300,.112),c=vec2(.120,-.018);
    vec2 ab=b-a,bc=c-b,ca=a-c,ap=p-a,bp=p-b,cp=p-c;
    float h1=(ab.x*ap.y-ab.y*ap.x)/length(ab);
    float h2=(bc.x*bp.y-bc.y*bp.x)/length(bc);
    float h3=(ca.x*cp.y-ca.y*cp.x)/length(ca);
    float tip=max(h1,max(h2,h3))-.004;
    float lobe=wing(p,vec2(.135,.059),vec2(.153,.052),.19);
    float blend=clamp(.5+.5*(lobe-tip)/.018,0.0,1.0);
    float upper=mix(lobe,tip,blend)-.018*blend*(1.0-blend);
    upper=max(upper,.004-p.x);
    float lower=wing(p,vec2(.064,-.038),vec2(.050,.060),.18);
    return min(upper,lower);
}

vec3 afterimage(vec2 p){
    vec3 color=u_ink;float echoSpacing=.032+.065*u_focus;
    for(int i=11;i>=0;i--){
        float k=float(i),phase=u_time-k*(.11+.30*u_focus);
        vec2 q=p/(.74*(1.0+k*echoSpacing));
        q-=vec2(.012*sin(phase*.8)+u_mouse.x*.08,.007*cos(phase*.6)+u_mouse.y*.06);
        float d=glyph(q,phase),body=1.0-smoothstep(-.002,.005,d);
        float edge=exp(-abs(d)*137.0),attenuation=exp(-k*.43);
        vec3 warm=mix(u_primary,vec3(1.0,.82,.37),.22);
        vec3 pale=mix(warm,vec3(1.0,.995,.94),smoothstep(.018,.15,abs(q.x))*.82);
        pale=mix(pale,u_secondary,.07*(.5+.5*sin(phase*.5+k*.2)));
        float foreground=1.0-step(.5,k);
        float haze=exp(-max(d,0.0)*65.0);
        color+=pale*(body*(.033+foreground*.67)+edge*.19+haze*.055)*attenuation*u_intensity;
        vec2 frame=p/(1.0+k*(.047+.065*u_focus));
        float rect=abs(box(frame,vec2(.302,.253),0.0));
        color+=vec3(.20,.21,.23)*exp(-rect*55.0)*attenuation*.52;
        float innerField=1.0-smoothstep(-.035,.020,box(frame,vec2(.302,.253),0.0));
        color+=vec3(.014,.015,.018)*innerField*attenuation;
    }
    color+=u_primary*exp(-length(p)*14.0)*.15*u_intensity;
    vec2 strip=vec2(p.x/1.6+.5,(p.y+.41)/.10);
    if(all(greaterThan(strip,vec2(0)))&&all(lessThan(strip,vec2(1)))){
        vec3 labels=texture2D(u_panel,vec2(strip.x,.25+.125*strip.y)).rgb;
        color+=labels*.5;
    }
    return color;
}

vec3 glassSpace(vec3 p,float id){
    float yaw=.16+.055*sin(id*1.73)+.020*sin(u_time*.28+id*.3)+u_mouse.x*.08;
    float pitch=-.12+.028*cos(id*1.37)+.015*cos(u_time*.23+id*.7);
    p.xz=rot(yaw)*p.xz;p.yz=rot(pitch)*p.yz;
    return p;
}
float glassDistance(vec3 p,float id){
    // Nearly cubic volume: broad side and top facets remain visible rather than
    // reducing the module to a white plate with a thin rounded edge.
    vec3 q=abs(glassSpace(p,id))-vec3(.74,.74,.60);
    return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0)-.12;
}
vec2 glassAtlas(vec2 local,vec2 cell){
    return (cell+clamp(local,.025,.975))/3.0*.25;
}
vec3 glyphGrid(vec2 p){
    vec3 bg=mix(u_primary,u_secondary,clamp(p.x*.5+p.y*.3+.5,0.0,1.0));
    bg=mix(bg,vec3(1),.60);
    vec2 gridLine=abs(fract((p+vec2(.013,.025))*9.0)-.5);
    bg+=vec3(.025)*exp(-min(gridLine.x,gridLine.y)*180.0);
    p=rot(.045+.014*sin(u_time*.35)+u_mouse.x*.035)*p;p.x+=.018*p.y;
    vec2 grid=p/.228+1.5,cell=floor(grid),q=(fract(grid)-.5)*.228;
    if(any(lessThan(cell,vec2(0)))||any(greaterThan(cell,vec2(2))))return bg;
    float id=cell.x+cell.y*3.0;q.y-=.003*sin(u_time*.65+id*.7);
    vec3 ro=vec3(q/.103,3.1),rd=normalize(vec3(.035,-.018,-1));
    float travel=1.95;vec3 hitPoint=ro;bool hit=false;
    for(int i=0;i<40;i++){
        hitPoint=ro+rd*travel;float d=glassDistance(hitPoint,id);
        if(d<.002){hit=true;break;}
        travel+=max(d*.80,.001);if(travel>4.2)break;
    }
    vec2 shadowPoint=(q-vec2(.012,-.019))/vec2(.096,.087);
    float shadow=exp(-dot(shadowPoint,shadowPoint)*2.0)*.105;
    if(!hit)return bg*(1.0-shadow);
    vec2 e=vec2(.002,0);
    vec3 n=normalize(vec3(glassDistance(hitPoint+e.xyy,id)-glassDistance(hitPoint-e.xyy,id),glassDistance(hitPoint+e.yxy,id)-glassDistance(hitPoint-e.yxy,id),glassDistance(hitPoint+e.yyx,id)-glassDistance(hitPoint-e.yyx,id)));
    vec3 local=glassSpace(hitPoint,id),inside=glassSpace(refract(rd,n,1.0/1.46),id);
    vec3 bounds=vec3(.87,.87,.73);
    vec3 safeDirection=mix(vec3(-1),vec3(1),step(vec3(0),inside))*max(abs(inside),vec3(.0001));
    vec3 exits=(sign(inside)*bounds-local)/safeDirection;
    float depth=max(.02,min(exits.x,min(exits.y,exits.z)));
    vec3 back=local+inside*depth,middle=local+inside*depth*.52;
    vec2 frontUV=local.xy/1.72+.5;
    vec2 backUV=mix(back.xy/1.72+.5,frontUV,.34),middleUV=mix(middle.xy/1.72+.5,frontUV,.20);
    vec4 image=texture2D(u_panel,glassAtlas(backUV,cell));
    vec4 inner=texture2D(u_panel,glassAtlas(middleUV+vec2(.022,-.016)*u_refraction,cell));
    vec4 reflectedImage=texture2D(u_panel,glassAtlas(vec2(1.0-backUV.x,backUV.y)+vec2(.05,.02),cell));
    float red=texture2D(u_panel,glassAtlas(backUV+vec2(.010,0)*u_refraction,cell)).r;
    float blue=texture2D(u_panel,glassAtlas(backUV-vec2(.010,0)*u_refraction,cell)).b;
    // Clear space inside the atlas transmits the pale background. Independently
    // offset front/rear image planes remain visible through the glass volume.
    vec3 transmitted=mix(bg,image.rgb,image.a*.78);
    transmitted=mix(transmitted,inner.rgb,inner.a*.23);
    transmitted=mix(transmitted,reflectedImage.rgb,reflectedImage.a*.12*(1.0-abs(n.z)));
    transmitted.r=mix(transmitted.r,red,image.a*.14);transmitted.b=mix(transmitted.b,blue,image.a*.14);
    transmitted*=exp(-depth*vec3(.018,.012,.007));
    vec3 reflection=reflect(rd,n),localNormal=glassSpace(n,id);
    float facing=max(dot(n,-rd),0.0),side=1.0-abs(localNormal.z);
    float fresnel=.035+.72*pow(1.0-facing,2.1);
    float band=smoothstep(-.45,-.20,reflection.y)*(1.0-smoothstep(.04,.30,reflection.y));
    float topLight=exp(-pow(reflection.y-.67,2.0)*22.0);
    float upright=exp(-pow(reflection.x+.43,2.0)*42.0);
    vec3 environment=mix(vec3(.72,.76,.77),vec3(.035,.047,.058),band*.83);
    environment+=vec3(.62,.67,.70)*topLight+vec3(.35,.42,.48)*upright;
    vec3 glass=mix(transmitted,environment,fresnel+side*.07);
    float spec=pow(max(dot(reflection,normalize(vec3(-.55,.8,1))),0.0),35.0);
    float frontRim=exp(-pow((max(abs(frontUV.x-.5),abs(frontUV.y-.5))-.435)/.009,2.0));
    float backRim=exp(-abs(abs(back.x)-.82)*90.0)+exp(-abs(abs(back.y)-.82)*90.0);
    glass+=vec3(.66,.73,.77)*frontRim*(.24+.30*max(localNormal.y,0.0));
    glass+=vec3(.36,.42,.46)*min(backRim,.9)*.22;
    glass+=vec3(spec*.46)+vec3(.11,.046,.013)*(1.0-facing)*u_refraction;
    return clamp(glass*u_intensity,0.0,1.0);
}
vec2 loopsMap(vec3 p){
    p.yz=rot(.64+.14*sin(u_time*.23))*p.yz;
    p.xz=rot(.34+.16*cos(u_time*.19))*p.xz;
    p.xy=rot(-.18+u_time*.08)*p.xy;
    float angle=atan(p.y,p.x),best=10.0,path=0.0;
    // Two azimuthal branches describe one over-under tubular knot, rather than
    // three disconnected circular tori. The changing cross-section stays smooth.
    for(int i=0;i<2;i++){
        float t=angle*.5+float(i)*PI;
        float radius=.275+.125*cos(t*3.0);
        vec3 center=vec3(radius*cos(t*2.0),radius*sin(t*2.0),.135*sin(t*3.0));
        float thickness=.069+.022*(.5+.5*sin(t*2.0-u_time*.37));
        float d=(length(p-center)-thickness)*.62;
        if(d<best){best=d;path=t;}
    }
    return vec2(best,path);
}
vec3 loopPalette(float t){
    float cycle=fract(t/(2.0*PI)+u_time*.018)*3.0;
    vec3 third=vec3(.29,.65,.98);
    if(cycle<1.0)return mix(u_primary,u_secondary,smoothstep(0.0,1.0,cycle));
    if(cycle<2.0)return mix(u_secondary,third,smoothstep(0.0,1.0,cycle-1.0));
    return mix(third,u_primary,smoothstep(0.0,1.0,cycle-2.0));
}
vec3 colorfulLoops(vec2 p){
    vec3 ro=vec3(u_mouse.x*.4,u_mouse.y*.25,2.6),rd=normalize(vec3(p*1.65,-2.6));
    float travel=1.5;vec2 hit=vec2(0);bool found=false;
    for(int i=0;i<64;i++){hit=loopsMap(ro+rd*travel);if(hit.x<.0018){found=true;break;}travel+=max(.002,hit.x*.86);if(travel>3.7)break;}
    if(!found)return u_ink;
    vec3 q=ro+rd*travel;float e=.0023;
    vec3 n=normalize(vec3(loopsMap(q+vec3(e,0,0)).x-loopsMap(q-vec3(e,0,0)).x,loopsMap(q+vec3(0,e,0)).x-loopsMap(q-vec3(0,e,0)).x,loopsMap(q+vec3(0,0,e)).x-loopsMap(q-vec3(0,0,e)).x));
    vec3 material=loopPalette(hit.y);
    float diffuse=.32+.68*max(0.0,dot(n,normalize(vec3(-.4,.8,1))));
    float rim=pow(1.0-max(0.0,dot(n,-rd)),2.0);
    float grain=hash(vec3(floor(gl_FragCoord.xy*.85),floor(u_time*10.0)));
    vec3 color=material*(diffuse+rim*.13);
    color*=1.0+(grain-.5)*u_grain*1.22;
    color=mix(u_ink,color,smoothstep(.01,.12,grain+(.7-u_grain)*.09));
    color+=material*pow(max(0.0,dot(reflect(rd,n),normalize(vec3(-.4,.6,1)))),24.0)*.12;
    return color*u_intensity;
}
vec2 connectionPoint(float t){
    float a=PI*(.5-t);
    return vec2(357.0+34.0*cos(a),509.0+22.0*sin(a));
}
vec3 technical(vec2 p){
    vec2 uv=vec2(p.x/1.6+.5,p.y+.5);
    if(any(lessThan(uv,vec2(0)))||any(greaterThan(uv,vec2(1))))return u_ink;
    vec2 q=uv*vec2(1024,640),sampleUV=uv;
    float cycle=fract(u_time*.105);
    for(int j=0;j<2;j++){
        float k=float(j),press=pow(.5+.5*sin(u_time*1.25-k*.9),14.0);
        vec2 center=k<.5?vec2(655,522.5):vec2(727,522.5);
        vec2 capPoint=q-center;
        if(abs(capPoint.x)<(k<.5?37.0:29.0)&&abs(capPoint.y)<29.0)sampleUV.y+=press*.004;
    }
    vec3 textureColor=texture2D(u_panel,vec2(sampleUV.x,.375+.625*sampleUV.y)).rgb;
    float luminance=dot(textureColor,vec3(.2126,.7152,.0722));
    vec3 color=mix(textureColor,mix(u_ink,u_secondary,clamp(luminance*2.0,0.0,1.0)),.055);
    float phase=fract(u_time*.24+u_mouse.x*.10);
    vec2 dotPosition=connectionPoint(phase);
    color+=mix(u_primary,u_secondary,phase)*exp(-length(q-dotPosition)*.32)*.46*u_intensity;
    for(int j=0;j<2;j++){
        float k=float(j),press=pow(.5+.5*sin(u_time*1.25-k*.9),14.0);
        vec2 center=k<.5?vec2(655,522.5):vec2(727,522.5);
        float cap=abs(box((q-center)/640.0,vec2(k<.5?.046:.034,.031),.007));
        color+=u_primary*exp(-cap*640.0)*press*.22;
    }
    float ticket=step(620.0,q.x)*step(q.x,620.0+82.0*phase)*exp(-abs(q.y-260.0)*1.5);
    color+=u_secondary*ticket*.28;
    float revoke=smoothstep(.60,.70,cycle)*(1.0-smoothstep(.82,.94,cycle));
    float localKey=abs(box((q-vec2(243,311))/640.0,vec2(.015,.015),.004));
    color+=u_primary*exp(-localKey*850.0)*revoke*.26;
    float connection=exp(-segment(q,vec2(268,250),vec2(425,250))*.9);
    color+=u_secondary*connection*(1.0-revoke)*.15;
    float cursor=step(abs(q.x-294.0),2.0)*step(abs(q.y-67.0),5.0)*step(.1,sin(u_time*3.2));
    color+=u_primary*cursor*.29;
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
    c.fillStyle="#080b0d";c.fillRect(0,0,1024,1024)
    const rounded=(x:number,y:number,w:number,h:number,r:number)=>{c.beginPath();c.roundRect(x,y,w,h,r)}
    rounded(145,16,734,612,16);c.fillStyle="#06080a";c.fill();c.strokeStyle="#11161b";c.lineWidth=1;c.stroke()
    const card=(x:number,y:number)=>{rounded(x,y,340,225,16);c.fillStyle="#0d1115";c.fill();c.strokeStyle="#252b31";c.stroke();rounded(x+12,y+12,316,140,10);c.fillStyle="#090c10";c.fill();c.strokeStyle="#10171d";c.stroke()}
    card(166,45);card(518,45);card(166,282);card(518,282)
    // A local terminal and restrained loop cable form the upper-left diagram.
    c.setLineDash([2,3]);rounded(220,81,220,115,18);c.strokeStyle="#303745";c.stroke();c.setLineDash([])
    c.fillStyle="#46505b";c.font="9px monospace";c.fillText("your machine",235,96)
    rounded(235,105,122,67,8);c.fillStyle="#171b24";c.fill();c.strokeStyle="#343b47";c.stroke()
    c.fillStyle="#4c5663";c.fillRect(246,111,3,3);c.fillRect(253,111,3,3);c.fillRect(260,111,3,3)
    c.strokeStyle="#2b323e";c.beginPath();c.moveTo(236,122);c.lineTo(356,122);c.stroke()
    c.fillStyle="#a0a8b8";c.font="16px monospace";c.fillText("127.0.0.1",246,150)
    c.strokeStyle="#49536a";c.lineWidth=1.5;c.beginPath();c.moveTo(357,109);c.bezierCurveTo(403,109,403,153,357,153);c.stroke()
    c.fillStyle="#586274";c.font="18px monospace";c.fillText("→ ×",402,141)
    // Subtle extruded keycaps and a short access-code pill occupy the second card.
    for(let i=0;i<2;i++){
        const x=i?700:620,w=i?54:70;rounded(x,95,w,54,9);c.fillStyle="#080b10";c.fill();c.strokeStyle="#242b33";c.lineWidth=1;c.stroke()
        const shade=c.createLinearGradient(0,95,0,140);shade.addColorStop(0,"#191e26");shade.addColorStop(1,"#0c1016")
        rounded(x,95,w,45,8);c.fillStyle=shade;c.fill();c.strokeStyle="#373f4d";c.stroke();c.strokeStyle="#444d5b";c.beginPath();c.moveTo(x+10,99);c.lineTo(x+w-10,99);c.stroke()
        c.fillStyle="#a9b0c0";c.font="17px monospace";c.fillText(i?"S":"⌃",x+w/2-5,123)
    }
    rounded(610,158,150,25,12);c.fillStyle="#1c2338";c.fill();c.strokeStyle="#3b4562";c.stroke();c.fillStyle="#a4b5eb";c.font="12px monospace";c.fillText("7F2A · 0481",644,175)
    // The revocation diagram has a laptop, an independent lock and a phone.
    rounded(220,355,48,35,6);c.fillStyle="#171d24";c.fill();c.strokeStyle="#3c444e";c.stroke();c.beginPath();c.moveTo(215,394);c.lineTo(273,394);c.stroke()
    rounded(232,318,22,22,5);c.fillStyle="#10151c";c.fill();c.stroke();c.fillStyle="#9ca5b7";c.font="12px monospace";c.fillText("u",239,333)
    c.lineWidth=4;c.strokeStyle="#606874";c.beginPath();c.arc(360,338,13,Math.PI,Math.PI*2);c.lineTo(373,349);c.moveTo(347,338);c.lineTo(347,349);c.stroke();c.lineWidth=1
    rounded(341,347,39,34,8);c.fillStyle="#171d25";c.fill();c.strokeStyle="#414a56";c.stroke();c.fillStyle="#768293";c.beginPath();c.arc(360,362,2,0,Math.PI*2);c.fill();c.fillRect(359,363,2,6)
    rounded(425,350,25,47,6);c.fillStyle="#121820";c.fill();c.strokeStyle="#343d49";c.stroke();c.beginPath();c.moveTo(432,355);c.lineTo(443,355);c.stroke()
    c.setLineDash([2,2]);c.strokeStyle="#494c68";c.beginPath();c.moveTo(268,390);c.lineTo(425,390);c.stroke();c.setLineDash([])
    // A ticket silhouette and fine barcode stay readable without becoming a UI page.
    rounded(596,332,176,70,8);c.fillStyle="#171c24";c.fill();c.strokeStyle="#343c49";c.stroke()
    c.fillStyle="#090c10";for(const x of [596,772]){c.beginPath();c.arc(x,367,8,0,Math.PI*2);c.fill()}
    c.fillStyle="#7b879d";c.font="12px monospace";c.fillText("TKT / 7N4K",611,356)
    c.fillStyle="#2c3346";c.fillRect(620,378,82,3);c.fillStyle="#9aacdf";c.fillRect(620,378,46,3)
    c.strokeStyle="#4d586c";for(let x=727;x<755;x+=4){c.beginPath();c.moveTo(x,342);c.lineTo(x,390);c.stroke()}
    const title=(text:string,x:number,y:number)=>{c.fillStyle="#c2c7cf";c.font='13px "Space Grotesk", sans-serif';c.fillText(text,x,y)}
    const body=(a:string,b:string,x:number,y:number)=>{c.fillStyle="#68737e";c.font="10px sans-serif";c.fillText(a,x,y);if(b)c.fillText(b,x,y+14)}
    title("Local by default",178,217);body("Loopback only, with a temporary session token.","No relay or account required.",178,239)
    title("Two keys to share",530,217);body("A familiar shortcut starts the connection", "and prints a one-time code.",530,239)
    title("Revoke instantly",178,454);body("Close a share and its unused tickets", "with one deliberate keypress.",178,476)
    title("Single-use tickets",530,454);body("A ticket is consumed once, then expires.","",530,476)
    rounded(166,519,692,95,16);c.fillStyle="#0d1115";c.fill();c.strokeStyle="#252b31";c.stroke()
    rounded(181,535,170,64,8);c.fillStyle="#10131a";c.fill();c.strokeStyle="#353c47";c.stroke()
    for(let i=0;i<3;i++){c.fillStyle=["#c66f75","#b5a46b","#78a38c"][i];c.beginPath();c.arc(190+i*8,544,2,0,Math.PI*2);c.fill()}
    c.strokeStyle="#2a303c";c.beginPath();c.moveTo(182,552);c.lineTo(350,552);c.stroke()
    c.fillStyle="#8a97b0";c.font="11px monospace";c.fillText("~ > signal",192,578)
    title("Your shell, unchanged",381,555);body("Familiar commands and history,", "carried over a temporary connection.",381,579)
    c.fillStyle="#020304";c.fillRect(0,640,1024,128)
    c.font="13px monospace";c.fillStyle="#77818b";c.fillText("TEMPORAL STUDY / INDEPENDENT GLYPH",60,719);c.fillText("FRAME 01 / 76   T + 08.00 S",662,719)
    c.clearRect(0,768,256,256)
    const cats=[
        ["000100001000","001110011100","001111111100","011111111110","011111111110","011001100110","011001100110","011110011110","001111111100","000111111000","001111111100","001100001100"],
        ["001000000100","001100001100","001111111100","011111111110","011001100110","011001100110","011111111110","001110011100","000111111000","000011110000","000110011000","001110011100"],
        ["001100001100","001110011100","011111111110","011111111110","011001100110","011001100110","011111111110","001110011100","000111111000","000111111000","001100001100","011100001110"],
    ]
    const palettes=[
        ["#eef1ec","#29343a","#d6e1e0","#b8a48e"],["#f0efe7","#25333c","#dae3e1","#c7a788"],["#485963","#202c34","#b9cdce","#bf7974"],
        ["#263a44","#101e26","#c3d7d5","#b6c8c7"],["#3c5059","#1a2d35","#c0d3d3","#c2d5d0"],["#233640","#a3c1c8","#20303a","#95b8bf"],
        ["#5a6e73","#152933","#e0e5db","#d4a783"],["#304650","#142731","#bacfcd","#dcad89"],["#314b59","#b6cdd0","#203440","#bf9f7e"],
    ]
    for(let row=0;row<3;row++)for(let col=0;col<3;col++){
        const id=(2-row)*3+col,cell=256/3,x0=col*cell,y0=768+(2-row)*cell,palette=palettes[id],cat=cats[id%3]
        c.globalAlpha=id===5||id===8?.42:.17;c.fillStyle=palette[0];c.fillRect(x0,y0,cell,cell);c.globalAlpha=1
        c.fillStyle=palette[3];c.fillRect(x0+4,y0+cell-10,cell-8,4);c.fillStyle=palette[1];c.fillRect(x0+3,y0+8,3,cell-18)
        for(let y=0;y<12;y++)for(let x=0;x<12;x++)if(cat[y][x]==="1"){
            const eye=(y===5||y===6)&&(x===3||x===4||x===7||x===8),ear=(y===2||y===3)&&(x===3||x===8)
            c.globalAlpha=.88;c.fillStyle=eye?palette[2]:ear&&id===2?palette[3]:palette[1]
            c.fillRect(x0+10+x*5.5,y0+8+y*5.5,5.6,5.6);c.globalAlpha=1
        }
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
