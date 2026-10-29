import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget, useIsStaticRenderer } from "framer"

// Independently composed kinetic form, material and type studies for Monarchic.
// No external artwork, source-reference geometry, images or fonts are embedded.
type Mode = "hinge" | "fault" | "glyph" | "relay"
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
    hinge:{key:"OL-05",title:"Chrome hinge"},
    fault:{key:"OL-06",title:"Fault line"},
    glyph:{key:"OL-07",title:"Glyph engine"},
    relay:{key:"OL-08",title:"Orbit relay"},
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
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float box2(vec2 p,vec2 b){vec2 q=abs(p)-b;return length(max(q,0.0))+min(max(q.x,q.y),0.0);}
float box3(vec3 p,vec3 b,float radius){vec3 q=abs(p)-b;return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0)-radius;}
float segment(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return length(p-a-d*clamp(dot(p-a,d)/max(dot(d,d),.00001),0.0,1.0));}
float typeMask(vec2 p,float row);
float opticalEdge(vec2 p,vec2 a,vec2 b){vec2 e=b-a;return -(e.x*(p.y-a.y)-e.y*(p.x-a.x))/length(e);}
float opticalQuad(vec2 p,vec2 a,vec2 b,vec2 c,vec2 d){return max(max(opticalEdge(p,a,b),opticalEdge(p,b,c)),max(opticalEdge(p,c,d),opticalEdge(p,d,a)));}
vec3 opticalSpace(vec3 p){
    p.xy=rot(-.23)*p.xy;
    p.xz=rot(.14+.11*sin(u_time*.19)+u_mouse.x*.27)*p.xz;
    p.yz=rot(-.25+.07*cos(u_time*.23)+u_mouse.y*.22)*p.yz;
    p.x+=.14*p.y;
    p.z-=.33*sin(p.x*3.7+.15)+.15*sin(p.y*4.1-.3)+.19*p.x*p.y+.040*sin(p.y*4.0+u_time*.18)*u_focus;
    return p;
}
vec2 hingeMap(vec3 p){
    vec3 q=opticalSpace(p);
    vec2 contour=(q.xy-vec2(-.035,.015))/vec2(.70,.47);
    float angle=atan(contour.y,contour.x);
    float radius=1.0+.105*sin(3.0*angle+.60)+.105*sin(angle-.65)-.055*cos(2.0*angle+1.3);
    float outer=(length(contour)-radius)*.43;
    vec2 h=q.xy-vec2(.065,.012);h.y+=.16*h.x*h.x;
    float inner=max(opticalEdge(h,vec2(-.19,-.18),vec2(.31,-.035)),max(opticalEdge(h,vec2(.31,-.035),vec2(.045,.235)),opticalEdge(h,vec2(.045,.235),vec2(-.19,-.18))))-.025;
    float thickness=.069+.060*pow(sin(q.x*2.8-.4),2.0)+.025*cos(q.y*4.0+.3);
    vec2 d=vec2(max(outer,-inner),abs(q.z)-thickness);
    return vec2(min(max(d.x,d.y),0.0)+length(max(d,0.0))-.044,thickness);
}
vec3 opticalNormal(vec3 p){vec2 e=vec2(.0016,0);return normalize(vec3(hingeMap(p+e.xyy).x-hingeMap(p-e.xyy).x,hingeMap(p+e.yxy).x-hingeMap(p-e.yxy).x,hingeMap(p+e.yyx).x-hingeMap(p-e.yyx).x));}
vec3 opticalBackdrop(vec2 uv){
    float atmosphere=exp(-dot(uv-vec2(-.12,.25),uv-vec2(-.12,.25))*1.8);
    vec3 color=mix(u_primary*.90,mix(u_primary,u_secondary,.17),atmosphere*.70);
    vec2 grid=abs(fract((uv+vec2(.04,.12))*vec2(5.0,5.0))-.5);
    float rules=max(1.0-smoothstep(.001,.003,grid.x),1.0-smoothstep(.001,.003,grid.y));
    color=mix(color,u_ink,rules*.028);
    vec2 field=rot(.035)*(uv-vec2(.03,-.18));
    float words=typeMask(vec2((field.x+.96)/1.92,(field.y+.105)/.21),0.0);
    color=mix(color,u_ink,words*.53);
    float stripes=typeMask(vec2((uv.x+.90)/1.80,(uv.y+.075)/.26),3.0);
    color=mix(color,u_ink,stripes*.32);
    vec2 metaUV=vec2((uv.x+.77)/.38,(uv.y-.365)/.080);
    float meta=typeMask(vec2(metaUV.x*.5,metaUV.y),2.0)*step(0.0,metaUV.x)*step(metaUV.x,1.0);
    color=mix(color,u_ink,meta*.65);
    return color;
}
vec3 chromeHinge(vec2 uv){
    vec3 color=opticalBackdrop(uv);
    vec3 ro=vec3(0,0,2.8),rd=normalize(vec3((uv-vec2(.015,.015))*1.43,-2.8));
    float distance=1.45;vec2 hit=vec2(0);bool found=false;
    for(int i=0;i<96;i++){hit=hingeMap(ro+rd*distance);if(hit.x<.0011){found=true;break;}distance+=max(hit.x*.46,.0007);if(distance>4.1)break;}
    if(!found)return color;
    vec3 p=ro+rd*distance,n=opticalNormal(p),inside=refract(rd,n,1.0/1.47);
    float travel=.009;vec3 back=p+inside*travel;
    for(int j=0;j<38;j++){back=p+inside*travel;float d=hingeMap(back).x;if(d>.001&&travel>.025)break;travel+=max(abs(d)*.48,.004);if(travel>.82)break;}
    vec3 backN=opticalNormal(back),outward=refract(inside,-backN,1.47);
    if(dot(outward,outward)<.001)outward=inside;
    vec2 refracted=(back.xy+outward.xy*max(0.0,(-.82-back.z)/min(outward.z,-.09)))/1.43;
    float dispersion=.007+.012*travel;
    vec3 through=vec3(opticalBackdrop(refracted+n.xy*dispersion).r,opticalBackdrop(refracted).g,opticalBackdrop(refracted-n.xy*dispersion).b);
    through=pow(max(through,0.0),vec3(1.28))*exp(-travel*vec3(5.4,4.6,3.8));
    vec3 reflection=reflect(rd,n);float facing=max(dot(n,-rd),0.0),fresnel=.055+.945*pow(1.0-facing,4.0);
    float broad=exp(-pow((reflection.y+.29)/.32,2.0));
    float softbox=exp(-pow((reflection.x+.53)/.30,2.0));
    float slash=exp(-pow((reflection.y+.42*reflection.x-.26)/.036,2.0));
    vec3 environment=mix(u_ink*.11,u_primary*1.45,clamp(broad*.95+softbox*.62,0.0,1.0));
    environment+=vec3(.93,.98,1.0)*slash*.85;
    float edgeGlow=pow(1.0-facing,3.0)*(.15+.85*exp(-pow((reflection.x-.23)/.42,2.0)));
    vec3 spectral=.5+.5*cos(vec3(0.0,2.1,4.2)+reflection.y*7.0+reflection.x*2.8);
    color=mix(through,environment,.43+fresnel*.49)+spectral*edgeGlow*.22;
    float grain=(hash(floor(gl_FragCoord.xy))-.5)*u_grain*.055;
    return clamp(color*u_intensity+grain,0.0,1.0);
}
float faultHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float thermalHeight(vec2 p){
    // Quantized carved terraces: a constructed volume, never a sine sheet.
    vec2 cell=floor(p*vec2(46.0,38.0));
    float micro=floor(faultHash(vec3(cell,2.0))*3.0)*.014;
    float steps=.075*floor((p.x+1.2)*2.8)+.068*floor((p.y+.8)*3.2);
    float platform=.13*step(-.42,p.x)*step(.02,p.y)-.115*step(.48,p.x)*step(.20,p.y);
    return -.06+steps+platform+micro;
}
vec3 thermalSpace(vec3 p){
    p.xy=rot(-.35)*p.xy;
    p.xz=rot(.14+.035*sin(u_time*.17)*u_focus+u_mouse.x*.18)*p.xz;
    p.yz=rot(.48+u_mouse.y*.20)*p.yz;
    return p;
}
vec3 thermalRamp(float t){
    vec3 red=mix(u_ink*.70,u_primary,smoothstep(.02,.60,t));
    return mix(red,u_secondary,smoothstep(.58,.97,t));
}
vec3 faultLine(vec2 uv){
    vec3 color=u_ink*.31;
    vec3 ro=vec3(0,.12,2.75),rd=normalize(vec3(uv*1.64,-2.75));
    float opacity=0.0;
    for(int i=0;i<108;i++){
        float t=1.05+float(i)*.027;
        vec3 q=thermalSpace(ro+rd*t);
        float h=thermalHeight(q.xz),layer=q.y-h;
        float footprint=max(abs(q.x)-1.13,abs(q.z)-.67);
        footprint=max(footprint,(q.x+q.z-1.43)*.7071);
        footprint=max(footprint,(-q.x-q.z-1.42)*.7071);
        float center=-.13+clamp(q.z*1.05,-.30,.30);
        center+=.022*sign(sin(floor((q.z+.8)*8.0)*2.3));
        float fissure=abs(q.x-center);
        float fissureWidth=.070+.026*step(.18,q.z);
        float solid=max(max(layer,-.29-q.y),max(footprint,fissureWidth-fissure));
        float body=1.0-smoothstep(-.012,.018,solid);
        vec3 grid=q*vec3(176.0,92.0,128.0);
        vec3 cell=floor(grid),f=abs(fract(grid)-.5);
        float grain=faultHash(cell);
        float column=(1.0-smoothstep(.29,.48,f.x))*(1.0-smoothstep(.29,.48,f.z));
        float scan=(.55+.45*(1.0-smoothstep(.28,.49,f.y)))*step(.09,grain);
        float density=body*column*scan;
        float top=1.0-smoothstep(.012,.07,abs(layer));
        float band=floor((q.y+.31)*19.0)*.0526;
        float heat=.22+.33*band+.17*top+.13*grain;
        float pulse=step(.71,fract(q.x*.27+q.z*.22-u_time*.055));
        float seam=exp(-abs(fissure-fissureWidth)*55.0)*(.48+.52*pulse);
        heat+=seam*.26;
        vec3 emission=thermalRamp(heat)*(1.02+.55*seam);
        float alpha=clamp(density*.25,0.0,.42);
        color+=(1.0-opacity)*emission*alpha;
        opacity+=(1.0-opacity)*alpha;
        if(opacity>.985)break;
    }
    // The repeated column/layer structure carries the volume. A restrained
    // phosphor spread joins nearby cells without smoothing away the raster.
    float field=exp(-dot((uv-vec2(-.03,.01))/vec2(.66,.31),(uv-vec2(-.03,.01))/vec2(.66,.31)));
    color+=u_primary*field*.012;
    float noise=(hash(floor(gl_FragCoord.xy))-.5)*u_grain*.035;
    return clamp(color*u_intensity+noise,0.0,1.0);
}
float typeMask(vec2 p,float row){
    if(any(lessThan(p,vec2(0)))||any(greaterThan(p,vec2(1))))return 0.0;
    return texture2D(u_panel,vec2(p.x,.75-row*.25+p.y*.25)).a;
}
vec3 glyphEngine(vec2 uv){
    vec3 color=u_primary;
    float phase=u_time*.24;
    float pulse=smoothstep(-.75,.75,sin(phase));
    float compression=1.0-.065*pulse*u_focus;
    vec2 p=vec2(uv.x/compression,uv.y);
    // A shared nine-cell construction produces MON / ARCH / IC. Individual
    // letters retain the same stroke pitch and stencil cuts in every fragment.
    vec2 top=vec2((p.x+.95-.025*pulse)/1.43,(p.y-.14)/.39);
    float mon=typeMask(vec2(top.x/3.0,top.y),0.0);
    vec2 middle=vec2((p.x+1.06+.04*pulse)/1.91,(p.y+.255)/.39);
    float arch=typeMask(vec2((3.0+middle.x*4.0)/9.0,middle.y),0.0);
    vec2 lower=vec2((p.x-.06+.035*pulse)/.93,(p.y+.645)/.39);
    float ic=typeMask(vec2((7.0+lower.x*2.0)/9.0,lower.y),0.0);
    mon*=step(0.0,top.x)*step(top.x,1.0);
    arch*=step(0.0,middle.x)*step(middle.x,1.0);
    ic*=step(0.0,lower.x)*step(lower.x,1.0);
    float body=max(mon,max(arch,ic));color=mix(color,u_ink,body);
    // One aligned orange interruption reveals a displaced slice of the same
    // letter construction; it is a typographic event rather than a floating card.
    float band=1.0-smoothstep(.069,.071,abs(p.y+.028));
    color=mix(color,u_secondary,band);
    vec2 cut=vec2(p.x+.090+.035*pulse,p.y-.010);
    vec2 cutWord=vec2((cut.x+1.06)/1.91,(cut.y+.255)/.39);
    float displaced=typeMask(vec2((3.0+cutWord.x*4.0)/9.0,cutWord.y),0.0)*step(0.0,cutWord.x)*step(cutWord.x,1.0);
    color=mix(color,u_ink,displaced*band);
    float hair=1.0-smoothstep(.0006,.0016,abs(p.y+.098));color=mix(color,u_ink,hair*.55);
    float upperRule=1.0-smoothstep(.0006,.0016,abs(p.y-.402));color=mix(color,u_ink,upperRule*.38);
    float vertical=1.0-smoothstep(.0006,.0016,abs(p.x-.568));color=mix(color,u_ink,vertical*.23);
    vec2 r=p-vec2(.568,.402);
    float cross=min(segment(r,vec2(-.016,0),vec2(.016,0)),segment(r,vec2(0,-.016),vec2(0,.016)));
    color=mix(color,u_ink,(1.0-smoothstep(.0006,.0016,cross))*.85);
    vec2 microUV=vec2((p.x+.76)/.35,(p.y+.39)/.070);
    float micro=typeMask(vec2(.5+microUV.x*.5,microUV.y),2.0)*step(0.0,microUV.x)*step(microUV.x,1.0);
    color=mix(color,u_ink,micro*.85);
    // Fine grain remains subordinate to the repeated letterform geometry.
    float grain=(hash(floor(gl_FragCoord.xy))-.5)*u_grain*.040;
    return clamp(color*u_intensity+grain,0.0,1.0);
}
vec3 relaySpace(vec3 p){
    p.xy=rot(-.23)*p.xy;
    p.xz=rot(-.40+.075*sin(u_time*.19)+u_mouse.x*.30)*p.xz;
    p.yz=rot(.26+.055*cos(u_time*.23)+u_mouse.y*.22)*p.yz;
    return p;
}
float relayMap(vec3 p){
    vec3 q=relaySpace(p);
    // One continuous die-like glyph has unequal open channels and a clipped
    // shoulder. The two voids never join into a ring or a repeated frame array.
    // Broad coupled optical faces curve gently through the existing silhouette.
    // Their varying normals bend a continuous transmitted field and catchlight.
    float lens=.078*max(0.0,1.0-pow(q.x/.61,2.0))*max(0.0,1.0-pow(q.y/.53,2.0));
    float solid=box3(q,vec3(.485,.400,.185+lens),.055);
    float upperChannel=box3(q-vec3(-.315,.105,0),vec3(.285,.107,.34),.021);
    float lowerChannel=box3(q-vec3(.305,-.215,0),vec3(.285,.085,.34),.019);
    solid=max(solid,-upperChannel);solid=max(solid,-lowerChannel);
    solid=max(solid,(q.x+q.y-.635)*.7071);
    solid=max(solid,(-q.x-q.y-.705)*.7071);
    return solid;
}
vec3 relayNormal(vec3 p){vec2 e=vec2(.0015,0);return normalize(vec3(relayMap(p+e.xyy)-relayMap(p-e.xyy),relayMap(p+e.yxy)-relayMap(p-e.yxy),relayMap(p+e.yyx)-relayMap(p-e.yyx)));}
vec3 relayBackdrop(vec2 uv){
    vec3 paper=mix(vec3(.972,.965,.981),u_secondary,.10);
    vec2 grid=abs(fract((uv+vec2(.03,.07))*vec2(6.0,6.0))-.5);
    float lines=max(1.0-smoothstep(.001,.0025,grid.x),1.0-smoothstep(.001,.0025,grid.y));
    paper=mix(paper,u_ink,lines*.065);
    vec2 q=rot(.10)*(uv-vec2(.04,-.045));
    float strip=typeMask(vec2((q.x+.84)/1.68,(q.y+.135)/.27),3.0);
    paper=mix(paper,u_ink,strip*.62);
    float rail=(1.0-smoothstep(.001,.002,abs(uv.y+.315)))*step(uv.x,.69)*step(-.72,uv.x);
    paper=mix(paper,u_ink,rail*.45);
    float tick=min(segment(uv,vec2(-.73,.34),vec2(-.67,.34)),segment(uv,vec2(-.70,.31),vec2(-.70,.37)));
    return mix(paper,u_ink,(1.0-smoothstep(.0008,.002,tick))*.66);
}
vec3 orbitRelay(vec2 uv){
    vec3 color=relayBackdrop(uv);
    vec3 ro=vec3(0,0,2.8),rd=normalize(vec3((uv-vec2(-.025,.025))*1.39,-2.8));
    float distance=1.45;bool found=false;
    for(int i=0;i<82;i++){float d=relayMap(ro+rd*distance);if(d<.0011){found=true;break;}distance+=max(d*.72,.0008);if(distance>4.1)break;}
    if(!found)return color;
    vec3 p=ro+rd*distance,n=relayNormal(p),inside=refract(rd,n,1.0/1.46);
    float travel=.009;vec3 back=p+inside*travel;
    for(int j=0;j<36;j++){back=p+inside*travel;float d=relayMap(back);if(d>.001&&travel>.027)break;travel+=max(abs(d)*.62,.004);if(travel>.95)break;}
    vec3 exitNormal=relayNormal(back),outward=refract(inside,-exitNormal,1.46);
    float totalInternal=1.0-step(.001,dot(outward,outward));
    if(totalInternal>.5)outward=inside;
    vec2 transmitted=(back.xy+outward.xy*max(0.0,(-.86-back.z)/min(outward.z,-.10)))/1.39;
    float dispersion=.005+.009*travel;
    vec3 through=vec3(relayBackdrop(transmitted+n.xy*dispersion).r,relayBackdrop(transmitted).g,relayBackdrop(transmitted-n.xy*dispersion).b);
    // Thickness absorbs blue/green while thin walls remain almost clear.
    // A second internally reflected image supplies dark displaced raster edges.
    vec3 extinction=(vec3(1.0)-max(u_primary,vec3(.06)))*3.0+vec3(.08,.01,.0);
    vec3 absorption=exp(-extinction*(.06+travel*1.10));
    vec3 bounce=reflect(inside,-exitNormal);
    vec2 echoUV=transmitted+bounce.xy*(.15+travel*.40)+exitNormal.xy*.11;
    vec3 echo=relayBackdrop(echoUV)*absorption;
    float wall=pow(1.0-clamp(abs(dot(inside,exitNormal)),0.0,1.0),2.0);
    through*=absorption;
    through=mix(through,echo,.12+wall*.27);
    through*=1.0-totalInternal*.38;
    through=mix(through,through*u_primary*.65,wall*.22);
    vec3 reflection=reflect(rd,n);float facing=max(dot(n,-rd),0.0),fresnel=.045+.955*pow(1.0-facing,4.0);
    float tall=exp(-pow((reflection.x+.48)/.145,2.0));
    float ceiling=exp(-pow((reflection.y-.48)/.25,2.0));
    float lip=exp(-pow((reflection.y+.32*reflection.x+.08)/.035,2.0));
    float blackCard=exp(-pow((reflection.x-.34*reflection.y-.12)/.092,2.0));
    vec3 reflected=mix(u_ink*.16,u_secondary*.60,clamp(.11+.40*ceiling+.26*tall,0.0,1.0));
    reflected=mix(reflected,u_ink*.08,blackCard*.94);
    reflected+=vec3(.98,.99,1.0)*(ceiling*.70+tall*.95+lip*1.22);
    color=mix(through,reflected,.12+fresnel*.70+totalInternal*.12);
    color*=1.0-blackCard*(.10+wall*.27);
    color+=vec3(1.0,.99,.98)*pow(lip,3.0)*.15;
    vec3 local=relaySpace(p);
    float internalBand=exp(-pow((local.z+.15)/.035,2.0))*(.5+.5*sin(local.y*18.0+local.x*7.0));
    color+=u_secondary*internalBand*.045;
    color+=(hash(floor(gl_FragCoord.xy))-.5)*u_grain*.028;
    return clamp(color*u_intensity,0.0,1.0);
}
void main(){
    vec2 uv=(gl_FragCoord.xy-.5*u_resolution)/u_resolution.y/max(u_scale,.1);
    vec3 color;
    if(u_mode<.5)color=chromeHinge(uv);
    else if(u_mode<1.5)color=faultLine(uv);
    else if(u_mode<2.5)color=glyphEngine(uv);
    else color=orbitRelay(uv);
    gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);
}
`
interface Resources {
    field: WebGLProgram
    quad: WebGLBuffer
    panel: WebGLTexture
}
// Original lettering is drawn locally for the kinetic typography shader.
function paintPanel(){
    const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=1024
    const c=canvas.getContext("2d");if(!c)throw new Error("Could not create original type atlas.")
    c.clearRect(0,0,1024,1024);c.fillStyle="#ffffff";c.strokeStyle="#ffffff"
    const polygon=(points:number[][])=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
    const line=(points:number[][])=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke()}
    const draw=(letter:string,x:number,y:number,w:number,h:number)=>{
        c.save();c.translate(x,y);c.scale(w/6,h/9);c.lineWidth=1.24;c.lineJoin="miter";c.lineCap="butt"
        if(letter==="M")line([[.62,9],[.62,.3],[3,4.15],[5.38,.3],[5.38,9]])
        else if(letter==="O"){polygon([[0,1],[1,0],[5,0],[6,1],[6,8],[5,9],[1,9],[0,8]]);c.globalCompositeOperation="destination-out";polygon([[1.24,1.6],[1.6,1.24],[4.4,1.24],[4.76,1.6],[4.76,7.4],[4.4,7.76],[1.6,7.76],[1.24,7.4]]);c.globalCompositeOperation="source-over"}
        else if(letter==="N")line([[.62,9],[.62,.4],[5.38,8.6],[5.38,0]])
        else if(letter==="A"){line([[.62,9],[2.5,.62],[3.5,.62],[5.38,9]]);line([[1.55,5.3],[4.45,5.3]])}
        else if(letter==="R"){line([[.62,9],[.62,.62],[4.3,.62],[5.38,1.7],[5.38,3.9],[4.3,4.98],[.62,4.98]]);line([[3.1,4.98],[5.45,9]])}
        else if(letter==="C")line([[5.55,1.4],[4.75,.62],[1.4,.62],[.62,1.4],[.62,7.6],[1.4,8.38],[4.75,8.38],[5.55,7.6]])
        else if(letter==="H"){line([[.62,0],[.62,9]]);line([[5.38,0],[5.38,9]]);line([[.62,4.5],[5.38,4.5]])}
        else if(letter==="I"){line([[.2,.62],[5.8,.62]]);line([[3,.62],[3,8.38]]);line([[.2,8.38],[5.8,8.38]])}
        // A common shallow diagonal stencil break ties every glyph to one pitch.
        c.globalCompositeOperation="destination-out";polygon([[-.4,4.55],[6.4,3.87],[6.4,4.12],[-.4,4.80]]);c.globalCompositeOperation="source-over"
        c.restore()
    }
    const word="MONARCHIC";for(let i=0;i<word.length;i++)draw(word[i],i*(1024/9)+6,12,1024/9-12,224)
    // The second row is reserved for independent fragments of the same system.
    draw("M",18,270,420,224);draw("C",550,270,420,224)
    c.font="500 52px monospace";c.textBaseline="alphabetic";c.fillText("OL-05",12,585,480);c.fillText("OL-07",530,585,480)
    c.font="500 30px monospace";c.fillText("MATERIAL STUDY",12,642,480);c.fillText("TYPE STUDY",530,642,480)
    for(let i=0;i<48;i++){const x=i*(1024/48);c.fillRect(x,786,i%6===0?8:i%3===0?4:1.2,214)}
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
        gl.uniform1f(location(p,"u_mode"),settings.mode==="hinge"?0:settings.mode==="fault"?1:settings.mode==="glyph"?2:3)
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
export default function OriginalFormStudy(props: Props) {
    const {study="hinge",animate=true,canvasMotion=false,speed=.65,stillTime=8,intensity=1.1,
        scale=1,grain=.35,focus=.65,refraction=.85,interactive=true,
        primary="#b7c8d0",secondary="#d9f44a",ink="#080b10",showLabels=true,style}=props
    const staticRenderer=useIsStaticRenderer(),target=RenderTarget.current()
    const canvasPreview=canvasMotion&&target===RenderTarget.canvas
    const isStatic=target===RenderTarget.export||target===RenderTarget.thumbnail||(staticRenderer&&!canvasPreview)
    const root=React.useRef<HTMLDivElement>(null),canvas=React.useRef<HTMLCanvasElement>(null)
    const [paused,setPaused]=React.useState(false)
    const [status,setStatus]=React.useState<Status>("offscreen"),[error,setError]=React.useState("")
    const settings:Settings={mode:study,animate:animate&&!paused,static:isStatic,canvasPreview,speed:Math.max(0,speed),stillTime,intensity,
        scale:Math.max(.5,scale),grain:Math.max(0,grain),focus:Math.max(0,Math.min(1,focus)),refraction:Math.max(0,refraction),interactive,primary,secondary,ink}
    const requestMotion=useStudySurface(root,canvas,settings,target,"OriginalFormStudy.tsx",(s,e)=>{setStatus(s);setError(e??"")})
    const source=STUDIES[study],color=study==="hinge"||study==="relay"?ink:study==="fault"?"#f7ddd1":study==="glyph"?"#17171b":"#e2e6ef"
    const mono:React.CSSProperties={fontFamily:'"IBM Plex Mono", monospace',fontSize:10,letterSpacing:".045em",lineHeight:1.5}
    return <div ref={root} role="group" aria-label={source.title} style={{width:"100%",height:"100%",...style,position:"relative",overflow:"hidden",background:study==="hinge"||study==="glyph"?primary:study==="relay"?"#f0edf4":ink,color}}>
        <canvas ref={canvas} role="img" aria-label={source.title+", independently composed animated graphic "+source.key} style={{display:"block",width:"100%",height:"100%",touchAction:"pan-y"}} />
        {showLabels&&<>
            <div style={{position:"absolute",left:"5%",top:"6%",pointerEvents:"none"}}>
                <div style={{...mono,opacity:.65}}>ORIGINAL COMPOSITION / {source.key}</div>
                {<div style={{fontFamily:'"Space Grotesk", sans-serif',fontSize:"clamp(14px,2vw,23px)",letterSpacing:"-.035em",marginTop:8,maxWidth:"75%"}}>{source.title}</div>}
            </div>
            <div style={{...mono,position:"absolute",left:"5%",bottom:"5%",opacity:.65}}>MONARCHIC / ORIGINAL LIVE STUDY</div>
            <div style={{...mono,position:"absolute",right:"5%",bottom:"5%",opacity:.65,pointerEvents:"none",fontSize:8,maxWidth:"55%",textAlign:"right"}}>INDEPENDENT FORM / PROCEDURAL MATERIAL</div>
        </>}
        {!isStatic&&<button onClick={()=>{if(status==="waiting"){setPaused(false);requestMotion()}else setPaused(p=>!p)}} disabled={status==="reduced-motion"||!animate||speed<=0} aria-pressed={paused} aria-label={paused||status==="waiting"?"Play animation":"Pause animation"} style={{...mono,position:"absolute",right:"5%",top:"6%",padding:"5px 9px",color,background:"transparent",border:"1px solid "+color,cursor:"pointer",opacity:.75}}>
            {status==="reduced-motion"?"REDUCED MOTION":!animate||speed<=0?"MOTION OFF":paused||status==="waiting"?"PLAY":"PAUSE"}
        </button>}
        {(error||status==="recovering")&&<div role="status" style={{...mono,position:"absolute",inset:"40% 10%",textAlign:"center"}}>{error?<>Graphics unavailable in this browser.<br/>Enable WebGL to view this study.</>:"Restoring graphics…"}</div>}
    </div>
}
addPropertyControls(OriginalFormStudy,{
    study:{type:ControlType.Enum,title:"Study",options:["hinge","fault","glyph","relay"],optionTitles:["Chrome hinge","Fault line","Glyph engine","Orbit relay"],defaultValue:"hinge"},
    animate:{type:ControlType.Boolean,title:"Animate",defaultValue:true},
    canvasMotion:{type:ControlType.Boolean,title:"Canvas motion",defaultValue:false},
    speed:{type:ControlType.Number,title:"Speed",min:0,max:2,step:.05,defaultValue:.65},
    stillTime:{type:ControlType.Number,title:"Still time",min:0,max:60,step:.5,defaultValue:8},
    intensity:{type:ControlType.Number,title:"Intensity",min:.2,max:2.5,step:.05,defaultValue:1.1},
    scale:{type:ControlType.Number,title:"Scale",min:.5,max:1.5,step:.05,defaultValue:1},
    grain:{type:ControlType.Number,title:"Grain",min:0,max:1,step:.05,defaultValue:.35},
    focus:{type:ControlType.Number,title:"Motion span",min:0,max:1,step:.05,defaultValue:.65},
    refraction:{type:ControlType.Number,title:"Relief",min:0,max:1.5,step:.05,defaultValue:.85,hidden:p=>p.study!=="fault"},
    primary:{type:ControlType.Color,title:"Primary",defaultValue:"#b7c8d0"},
    secondary:{type:ControlType.Color,title:"Secondary",defaultValue:"#d9f44a"},
    ink:{type:ControlType.Color,title:"Ink",defaultValue:"#080b10"},
    interactive:{type:ControlType.Boolean,title:"Mouse",defaultValue:true},
    showLabels:{type:ControlType.Boolean,title:"Labels",defaultValue:true},
})
