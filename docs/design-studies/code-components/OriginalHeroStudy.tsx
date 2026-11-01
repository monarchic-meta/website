import * as React from "react"
import {addPropertyControls,ControlType,RenderTarget,useIsStaticRenderer} from "framer"

// Independently composed original Monarchic hero artwork, OH-001–009.
// No external head/mark/contour geometry, screenshots, models or source scripts.
// OH-003 and OH-008 adapt the owned canonical Monarchic logo, not a new logo.
// Canonical asset: assets/monarchic-logo.svg, SHA256
// 71ef4b559a2f2bfaf8f8e00dffa6a820c35a3a9b77b2c55ec05c26ccc002a543.
// Research specimens are abstract visual metaphors, not data, papers or results.
// Native Framer layers supply the company identity, primary heading and copy.
type Mode="counterfield"|"atlas"|"axial"|"fold"|"palimpsest"|"assemblage"|"counterfold"|"indexorbit"|"researchfield"
type Status="waiting"|"running"|"paused"|"static"|"reduced-motion"|"offscreen"|"recovering"
interface Props {study?:Mode;animate?:boolean;canvasMotion?:boolean;speed?:number;stillTime?:number;artworkScale?:number;detail?:number;motionSpan?:number;ditherPitch?:number;interactive?:boolean;customColors?:boolean;background?:string;primary?:string;ink?:string;accent?:string;showPlayback?:boolean;style?:React.CSSProperties}
interface Settings {mode:Mode;animate:boolean;static:boolean;canvasPreview:boolean;speed:number;stillTime:number;artworkScale:number;detail:number;motionSpan:number;ditherPitch:number;interactive:boolean;background:string;primary:string;secondary:string;ink:string;accent:string;managed?:boolean;renderWidth?:number;renderHeight?:number;managedBufferWidth?:number;managedBufferHeight?:number;pixelBudget?:number;colorHost?:HTMLCanvasElement}
const STUDIES={
    counterfield:{key:"OH-001",title:"Counterfield",palette:["#101511","#ddefba","#f0f0e8","#819366"]},
    atlas:{key:"OH-002",title:"Atlas",palette:["#eee9df","#2c4df4","#171a1b","#ed5032"]},
    axial:{key:"OH-003",title:"Axial",palette:["#dce3e4","#171a1b","#171a1b","#f6f3e8"]},
    fold:{key:"OH-004",title:"Fold",palette:["#2139ee","#eceee1","#101312","#d9ff72"]},
    palimpsest:{key:"OH-005",title:"Palimpsest",palette:["#e9e4d9","#181a18","#181a18","#bd462e"]},
    assemblage:{key:"OH-006",title:"Assemblage",palette:["#ed4e35","#fff3dc","#171a1b","#213fe8"]},
    counterfold:{key:"OH-007",title:"Counterfold",palette:["#141613","#d9ff72","#eeeadf","#829065"]},
    indexorbit:{key:"OH-008",title:"Index orbit",palette:["#dce2ea","#244af3","#171a1b","#e9653c"]},
    researchfield:{key:"OH-009",title:"Research field",palette:["#eee9de","#191b1a","#191b1a","#c39a4d"]},
} as const
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5]
const OWNED_MARK="M706.66949231,346.05157482 C706.66949231,346.05157482 873.94267733,150.05732267 873.94267733,150.05732267 C873.94267733,150.05732267 767.86426108,150.05732267 767.86426108,150.05732267 C767.86426108,150.05732267 645.32365472,293.63834253 645.32365472,293.63834253 C668.44455564,307.79775793 689.14966036,325.52532756 706.66949231,346.05157482 ZM645.32365472,293.63834253 C606.48376029,269.85249606 560.82665278,256.13573892 512,256.13573892 C370.81799556,256.13573892 256.13573892,370.81799556 256.13573892,512 C256.13573892,575.28945904 279.18199112,633.25359671 317.33050769,677.94842518 C317.33050769,677.94842518 645.32365472,293.63834253 645.32365472,293.63834253 ZM378.67634528,730.3616574700001 C378.67634528,730.3616574700001 706.66949231,346.05157482 706.66949231,346.05157482 C744.81800888,390.74640329 767.86426108,448.71054096 767.86426108,512 C767.86426108,653.18200444 653.18200444,767.86426108 512,767.86426108 C463.17334722,767.86426108 417.51623971000004,754.14750394 378.67634528,730.3616574700001 ZM317.33050769,677.94842518 C317.33050769,677.94842518 150.05732267,873.94267733 150.05732267,873.94267733 C150.05732267,873.94267733 256.13573892,873.94267733 256.13573892,873.94267733 C256.13573892,873.94267733 378.67634528,730.3616574700001 378.67634528,730.3616574700001 C355.55544436,716.20224207 334.85033964,698.4746724400001 317.33050769,677.94842518 Z"
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v))
function orderedTone(tone:number,x:number,y:number){return clamp(tone)>(BAYER[(y&3)*4+(x&3)]+.5)/16}
function originalRaster(width:number,height:number,s:Settings):[number,number]{let w=Math.max(1,Math.floor(s.managedBufferWidth??width)),h=Math.max(1,Math.floor(s.managedBufferHeight??height)),budget=Math.max(1,s.pixelBudget??2000000);if(w*h>budget){const ratio=Math.sqrt(budget/(w*h));w=Math.max(1,Math.floor(w*ratio));h=Math.max(1,Math.min(Math.floor(budget/w),Math.floor(h*ratio)))}return[w,h]}
function originalPoint(x:number,y:number,z:number,yaw:number,pitch:number):[number,number,number]{const a=x*Math.cos(yaw)+z*Math.sin(yaw),b=-x*Math.sin(yaw)+z*Math.cos(yaw);return[a,y*Math.cos(pitch)-b*Math.sin(pitch),y*Math.sin(pitch)+b*Math.cos(pitch)]}

function createRenderer(canvas:HTMLCanvasElement,initial:Settings,notify:(status:Status,error?:string)=>void,resumeTime=initial.stillTime){
    const context=canvas.getContext("2d",{alpha:false});if(!context)throw new Error("Canvas artwork is unavailable.")
    const ctx:CanvasRenderingContext2D=context
    let settings=initial,width=1,height=1,bw=1,bh=1,time=resumeTime,disposed=false,mouse:[number,number]=[0,0],mark:Path2D|undefined
    const materials=new Map<string,Path2D>()
    let ditherCells=0
    const color=(value:string,alpha=1)=>"rgba("+rgb(value,settings.colorHost??canvas).map(v=>Math.round(v*255)).join(",")+","+clamp(alpha)+")"
    function mix(a:string,b:string,t:number){const x=rgb(a,settings.colorHost??canvas),y=rgb(b,settings.colorHost??canvas);return"rgb("+x.map((v,i)=>Math.round((v+(y[i]-v)*clamp(t))*255)).join(",")+")"}
    function polygon(points:number[][],fill?:string,stroke?:string,lineWidth=.8){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke()}}
    function path(points:number[][],stroke:string,lineWidth=.7){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke()}
    function tonal(kind:number,w:number,h:number,pitch=settings.ditherPitch){
        const key=[kind,w,h,pitch,settings.detail].join("/"),cached=materials.get(key);if(cached)return cached
        const result=new Path2D(),cols=Math.ceil(w/pitch),rows=Math.ceil(h/pitch)
        for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const u=x/Math.max(1,cols-1),v=y/Math.max(1,rows-1),ridge=kind===0?.15+.74*(.5+.5*Math.sin(u*4.8+v*2.1))*(.35+.65*Math.sin(v*Math.PI)):kind===1?clamp(.86-Math.hypot((u-.56)*1.1,(v-.42)*1.5)):.18+.67*(.5+.5*Math.sin((u+v*.3)*8.2))*(.4+.6*v);if(orderedTone(ridge,x,y))result.rect(x*pitch,y*pitch,pitch*.82,pitch*.82)}
        materials.set(key,result);while(materials.size>6)materials.delete(materials.keys().next().value as string);return result
    }
    function dither(kind:number,x:number,y:number,w:number,h:number,fill:string,alpha=1,pitch=settings.ditherPitch){ctx.save();ctx.translate(x,y);ctx.fillStyle=fill;ctx.globalAlpha=clamp(alpha);ctx.fill(tonal(kind,w,h,pitch));ctx.restore();ditherCells+=Math.ceil(w/pitch)*Math.ceil(h/pitch)}
    function clipPolygon(points:number[][]){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.clip()}
    function resize(){width=Math.max(1,settings.renderWidth??canvas.clientWidth??960);height=Math.max(1,settings.renderHeight??canvas.clientHeight??600);const next=originalRaster(width,height,settings);if(bw!==next[0]||bh!==next[1]||canvas.width!==next[0]||canvas.height!==next[1]){canvas.width=1;canvas.height=1;canvas.width=next[0];canvas.height=next[1]}[bw,bh]=next}
    const phase=()=>time*settings.motionSpan
    function field(cx:number,cy:number,w:number,h:number,ink:string,weight=1){
        const t=phase(),rows=Math.round(36*settings.detail),cols=44
        for(let row=0;row<rows;row++){const v=row/(rows-1),points=[];for(let col=0;col<=cols;col++){const u=col/cols,envelope=Math.sin(u*Math.PI),fold=Math.sin(u*5.2+v*3.1+t*.24)*envelope;points.push([cx+(u-.5)*w+(v-.5)*w*.12,cy+(v-.5)*h+fold*h*.28])}path(points,color(ink,.15+.65*Math.sin(v*Math.PI)),weight*(row%7===0?1.6:.65))}
        for(let col=0;col<=24;col++){const u=col/24,points=[];for(let row=0;row<=24;row++){const v=row/24,envelope=Math.sin(u*Math.PI),fold=Math.sin(u*5.2+v*3.1+t*.24)*envelope;points.push([cx+(u-.5)*w+(v-.5)*w*.12,cy+(v-.5)*h+fold*h*.28])}path(points,color(ink,.23),.55)}
    }
    function counterfield(){
        const x=width*.57,y=height*.68,w=width*.89,h=height*.44
        ctx.save();ctx.translate(x,y);ctx.rotate(-.13+Math.sin(phase()*.18)*.025);polygon([[-w*.50,-h*.33],[w*.41,-h*.60],[w*.52,h*.38],[-w*.39,h*.54]],color(settings.primary,.11));ctx.save();clipPolygon([[-w*.50,-h*.33],[w*.41,-h*.60],[w*.52,h*.38],[-w*.39,h*.54]]);dither(0,-w*.5,-h*.6,w,h*1.2,color(settings.primary),.66);ctx.restore();field(0,0,w,h,settings.primary,.9);ctx.restore()
        const slit=width*(.34+.025*Math.sin(phase()*.3));polygon([[slit,height*.46],[slit+width*.10,height*.43],[slit+width*.17,height*.93],[slit+width*.08,height*.95]],color(settings.background));path([[width*.12,height*.9],[width*.86,height*.39]],color(settings.accent,.65),1.1)
    }
    function atlas(){
        const cx=width*.57,cy=height*.32,unit=Math.min(width*.40,height*.36),turn=phase()*.12
        for(let band=0;band<Math.round(42*settings.detail);band++){const f=band/(42*settings.detail),r=unit*(.28+f*.92),points=[];for(let i=0;i<=84;i++){const a=i/84*Math.PI*2,rad=r*(1+.18*Math.sin(a*3+turn))+Math.sin(a*2-turn)*unit*.11,x=Math.cos(a)*rad,y=Math.sin(a)*rad*.58;points.push([cx+x+y*.42,cy+y+Math.cos(a*2+turn)*unit*.11])}path(points,color(settings.primary,.3+.6*f),band%8===0?1.6:.65)}
        ctx.save();clipPolygon([[cx-unit*.9,cy-unit*.48],[cx+unit*.85,cy-unit*.35],[cx+unit*.5,cy+unit*.65],[cx-unit*.45,cy+unit*.7]]);dither(1,cx-unit,cy-unit*.6,unit*2,unit*1.3,color(settings.primary),.58);ctx.restore();polygon([[cx-unit*.44,cy-unit*.25],[cx+unit*.30,cy-unit*.43],[cx+unit*.17,cy+unit*.25],[cx-unit*.31,cy+unit*.40]],color(settings.background));path([[cx-unit*1.1,cy+unit*.73],[cx+unit*.83,cy-unit*.83]],color(settings.accent),2.1)
    }
    function axial(){
        const size=Math.min(width*.67,height*.98),cx=width*.51,cy=height*.49,t=phase(),depth=Math.min(width,height)*(.08+.065*(.5+.5*Math.sin(t*.36))),layers=Math.round(22*settings.detail)
        mark??=new Path2D(OWNED_MARK)
        for(let layer=layers;layer>=0;layer--){const z=layer/layers;ctx.save();ctx.translate(cx-depth*z*.78,cy+depth*z*.56);ctx.transform(1,.035+Math.sin(t*.19)*.045,-.17,1,0,0);ctx.scale(size/1024,size/1024);ctx.translate(-512,-512);ctx.fillStyle=mix(settings.primary,settings.background,layer%4===0?.62:.06+z*.68);ctx.fill(mark);ctx.restore()}
        ctx.save();ctx.translate(cx,cy);ctx.transform(1,.035+Math.sin(t*.19)*.045,-.17,1,0,0);ctx.scale(size/1024,size/1024);ctx.translate(-512,-512);ctx.fillStyle=color(settings.primary);ctx.fill(mark);ctx.clip(mark);dither(0,0,0,1024,1024,color(settings.accent),.85,settings.ditherPitch*1024/size);ctx.restore()
        path([[cx-size*.55,cy+size*.52],[cx+size*.57,cy-size*.53]],color(settings.ink,.4),.55)
    }
    function ribbon(cx:number,cy:number,unit:number,light:string,accent:string,angle=0){
        const faces:{p:number[][];z:number;tone:number}[]=[],t=phase(),segments=Math.round(50*settings.detail),yaw=-.35+Math.sin(t*.16)*.18
        const p=(u:number,v:number)=>{const a=-2.18+u*4.36,r=.82+v*.22,raw=originalPoint(Math.cos(a)*r,Math.sin(a)*r*.63,.25*Math.sin(a*2)+v*.20*Math.cos(a),yaw,.44),x=raw[0]*Math.cos(angle)-raw[1]*Math.sin(angle),y=raw[0]*Math.sin(angle)+raw[1]*Math.cos(angle);return[cx+x*unit,cy-y*unit,raw[2]]}
        for(let i=0;i<segments;i++){const u=i/segments,q=[p(u,-1),p((i+1)/segments,-1),p((i+1)/segments,1),p(u,1)];faces.push({p:q,z:q.reduce((n,p)=>n+p[2],0)/4,tone:.24+.74*(.5+.5*Math.sin(u*5.4-.6))})}faces.sort((a,b)=>a.z-b.z)
        for(const f of faces){polygon(f.p.map(p=>[p[0]+unit*.025,p[1]+unit*.035]),color(settings.ink,.35));polygon(f.p,mix(settings.background,light,f.tone),color(settings.ink,.26),.55)}
        ctx.save();const silhouette=new Path2D();for(const f of faces){f.p.forEach((p,i)=>i?silhouette.lineTo(p[0],p[1]):silhouette.moveTo(p[0],p[1]));silhouette.closePath()}ctx.clip(silhouette);dither(2,cx-unit,cy-unit*.75,unit*2,unit*1.5,color(accent),.45);ctx.restore();const edge=[];for(let i=0;i<=segments;i++)edge.push(p(i/segments,1));path(edge,color(accent),1.6)
    }
    function fold(){ribbon(width*.65,height*.57,Math.min(width*.35,height*.54),settings.primary,settings.accent,-.44)}
    function specimen(x:number,y:number,w:number,h:number,angle:number,kind:number,fill:string,stroke:string){
        ctx.save();ctx.translate(x,y);ctx.rotate(angle);polygon([[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]],mix(settings.background,settings.ink,.18));ctx.translate(-w*.025,-h*.045);ctx.fillStyle=fill;ctx.fillRect(-w/2,-h/2,w,h);ctx.save();ctx.beginPath();ctx.rect(-w/2,-h/2,w,h);ctx.clip();if(kind===0){for(let i=0;i<Math.round(35*settings.detail);i++){const v=i/(35*settings.detail),points=[];for(let j=0;j<=32;j++){const u=j/32;points.push([(u-.5)*w,(v-.5)*h+Math.sin(u*7+v*3+phase()*.2)*h*.18])}path(points,stroke,i%8===0?1.5:.6)}dither(1,-w/2,-h/2,w,h,stroke,.42)}else if(kind===1){const r=Math.min(w,h)*.48;for(let i=0;i<38*settings.detail;i++){ctx.beginPath();ctx.ellipse(w*.12,0,r*(1-i/(41*settings.detail)),r*.78*(1-i/(41*settings.detail)),.25+phase()*.025,0,Math.PI*2);ctx.strokeStyle=stroke;ctx.lineWidth=i%9===0?1.4:.65;ctx.stroke()}}else{dither(2,-w/2,-h/2,w,h,stroke,.85);for(let i=0;i<8;i++)polygon([[-w*.5+i*w*.15,-h*.5],[-w*.46+i*w*.15,-h*.5],[w*.20+i*w*.15,h*.5],[w*.16+i*w*.15,h*.5]],color(settings.background,.42))}ctx.restore();ctx.restore()
    }
    function palimpsest(){
        const t=phase();specimen(width*.27,height*.18,width*.48,height*.34,-.17+Math.sin(t*.16)*.015,0,color(settings.background),color(settings.primary));specimen(width*.72,height*.75,width*.46,height*.45,.11+Math.sin(t*.12)*.025,2,mix(settings.background,settings.accent,.12),color(settings.primary));specimen(width*.78,height*.10,width*.25,height*.22,.08,1,color(settings.accent),color(settings.background));ctx.fillStyle=color(settings.background);ctx.fillRect(0,height*.358,width,height*.15);path([[width*.07,height*.92],[width*.86,height*.58]],color(settings.accent),2)
    }
    function assemblage(){
        const t=phase(),u=Math.min(width,height),cx=width*.56,cy=height*.48
        const blocks=[[-.42,-.24,.38,.28,-.23],[-.06,-.18,.36,.20,.09],[.17,.02,.34,.31,-.19],[-.28,.11,.32,.28,.24],[.01,.28,.38,.22,-.10]]
        for(let i=0;i<blocks.length;i++){const[x,y,w,h,a]=blocks[i];ctx.save();ctx.translate(cx+x*u,cy+y*u);ctx.rotate(a+Math.sin(t*.17+i)*.018);const p=[[-w*u/2,-h*u/2],[w*u/2,-h*u/2],[w*u/2,h*u/2],[-w*u/2,h*u/2]];polygon(p.map(v=>[v[0]+u*.016,v[1]+u*.02]),color(settings.ink));polygon(p,color(i===2?settings.accent:settings.primary));ctx.save();clipPolygon(p);if(i%2===0)dither(i%3,-w*u/2,-h*u/2,w*u,h*u,color(settings.ink),.72);else for(let j=0;j<23*settings.detail;j++)path([[-w*u*.5+j*u*.014,-h*u*.5],[-w*u*.18+j*u*.014,h*u*.5]],color(settings.ink,.85),.7);ctx.restore();ctx.restore()}
    }
    function counterfold(){
        field(width*.53,height*.80,width*.9,height*.28,settings.accent,.65);ribbon(width*.74,height*.62,Math.min(width*.27,height*.35),settings.primary,settings.ink,-.53);ctx.fillStyle=color(settings.background);ctx.fillRect(width*.06,height*.25,width*.80,height*.25);path([[width*.09,height*.91],[width*.90,height*.64]],color(settings.primary,.5),.7)
    }
    function indexorbit(){
        const cx=width*.73,cy=height*.27,unit=Math.min(width*.29,height*.31),t=phase()
        ctx.save();ctx.translate(cx,cy);ctx.rotate(-.2+Math.sin(t*.13)*.035);for(let i=0;i<28*settings.detail;i++){ctx.beginPath();ctx.ellipse(0,0,unit*(.48+i*.018),unit*(.48+i*.018)*.73,0,.32,Math.PI*1.93);ctx.strokeStyle=color(settings.primary,.35+i/(42*settings.detail));ctx.lineWidth=i%7===0?1.5:.7;ctx.stroke()}ctx.restore();specimen(width*.20,height*.77,width*.37,height*.33,-.11,0,mix(settings.background,settings.primary,.10),color(settings.ink));const size=unit*.67;mark??=new Path2D(OWNED_MARK);ctx.save();ctx.translate(cx,cy);ctx.rotate(.15+Math.sin(t*.17)*.06);ctx.scale(size/1024,size/1024);ctx.translate(-512,-512);ctx.fillStyle=color(settings.accent);ctx.fill(mark);ctx.restore();ctx.fillStyle=color(settings.background);ctx.fillRect(width*.26,height*.45,width*.73,height*.20)
    }
    function researchfield(){
        field(width*.60,height*.26,width*.76,height*.27,settings.accent,.6);specimen(width*.61,height*.20,width*.42,height*.31,-.16+Math.sin(phase()*.13)*.02,2,color(settings.background),color(settings.primary));specimen(width*.80,height*.43,width*.31,height*.27,.17,1,color(settings.accent),color(settings.background));ribbon(width*.40,height*.27,Math.min(width*.18,height*.24),settings.primary,settings.accent,-.72);ctx.fillStyle=color(settings.background);ctx.fillRect(0,height*.658,width*.71,height*.35)
    }
    function draw(){
        if(disposed)return;const started=performance.now();ditherCells=0;ctx.setTransform(bw/width,0,0,bh/height,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;ctx.setLineDash([]);ctx.clearRect(0,0,width,height);ctx.beginPath();ctx.fillStyle=color(settings.background);ctx.fillRect(0,0,width,height);ctx.save();ctx.translate(width*.5+mouse[0]*width*.035,height*.5-mouse[1]*height*.035);ctx.scale(settings.artworkScale,settings.artworkScale);ctx.translate(-width*.5,-height*.5)
        if(settings.mode==="counterfield")counterfield();else if(settings.mode==="atlas")atlas();else if(settings.mode==="axial")axial();else if(settings.mode==="fold")fold();else if(settings.mode==="palimpsest")palimpsest();else if(settings.mode==="assemblage")assemblage();else if(settings.mode==="counterfold")counterfold();else if(settings.mode==="indexorbit")indexorbit();else researchfield();ctx.restore()
        for(const node of [canvas,settings.colorHost])if(node){node.setAttribute("data-original-hero-id",STUDIES[settings.mode].key);node.setAttribute("data-original-hero-mode",settings.mode);node.setAttribute("data-original-hero-phase",String(time));node.setAttribute("data-original-hero-dither-cells",String(ditherCells));node.setAttribute("data-original-hero-draw-ms",String(Math.round((performance.now()-started)*100)/100));node.setAttribute("data-hero-mode",settings.mode);node.setAttribute("data-hero-phase",String(time));node.setAttribute("data-hero-mechanism","original-procedural-"+settings.mode)}
    }
    resize();return{update(next:Settings){settings=next;resize()},getSnapshot(){return{mode:settings.mode,stillTime:settings.stillTime,time,lost:false}},setPointer(x:number,y:number){mouse=settings.interactive?[x,y]:[0,0]},renderAt(seconds:number){time=seconds;draw()},dispose(){disposed=true;materials.clear();mark=undefined}}
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
    return()=>{if(entry.current)pool.current?.request(entry.current)}
}



/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 600
 */
export default function OriginalHeroStudy(props:Props){
    const{study="counterfield",animate=true,canvasMotion=false,speed=1,stillTime=3,artworkScale=1,detail=1,motionSpan=1,ditherPitch=3.5,interactive=true,customColors=false,background="#101511",primary="#ddefba",ink="#f0f0e8",accent="#819366",showPlayback=true,style}=props
    const palette=customColors?[background,primary,ink,accent]:STUDIES[study].palette,target=RenderTarget.current(),staticRenderer=useIsStaticRenderer(),canvasPreview=canvasMotion&&target===RenderTarget.canvas,isStatic=target===RenderTarget.export||target===RenderTarget.thumbnail||(staticRenderer&&!canvasPreview)||(target===RenderTarget.canvas&&!canvasPreview)
    const root=React.useRef<HTMLDivElement>(null),canvas=React.useRef<HTMLCanvasElement>(null),lastMove=React.useRef<[number,number]|null>(null),scrollAt=React.useRef(-Infinity),[paused,setPaused]=React.useState(false),[status,setStatus]=React.useState<Status>("offscreen"),[error,setError]=React.useState("")
    React.useEffect(()=>{const scroll=()=>{scrollAt.current=performance.now()};window.addEventListener("scroll",scroll,{passive:true,capture:true});return()=>window.removeEventListener("scroll",scroll,true)},[])
    const settings:Settings={mode:study,animate:animate&&!paused,static:isStatic,canvasPreview,speed:Math.max(0,speed),stillTime,artworkScale:clamp(artworkScale,.5,1.5),detail:clamp(detail,.6,1.4),motionSpan:clamp(motionSpan),ditherPitch:clamp(ditherPitch,1.8,6),interactive,background:palette[0],primary:palette[1],secondary:palette[3],ink:palette[2],accent:palette[3]}
    const request=useStudySurface(root,canvas,settings,target,"OriginalHeroStudy.tsx",(s,e)=>{setStatus(s);setError(e??"")}),mono:React.CSSProperties={fontFamily:'"IBM Plex Mono",monospace',fontSize:9,lineHeight:1.4,letterSpacing:".02em"}
    return <div ref={root} role="group" aria-label={STUDIES[study].key+" / "+STUDIES[study].title+" / original composition"} onPointerMoveCapture={e=>{const last=lastMove.current,same=last?.[0]===e.clientX&&last?.[1]===e.clientY;lastMove.current=[e.clientX,e.clientY];if(e.pointerType==="touch"||same||performance.now()-scrollAt.current<180)e.stopPropagation()}} style={{width:"100%",height:"100%",...style,position:"relative",overflow:"hidden",background:palette[0]}}>
        <canvas ref={canvas} role="img" aria-label={"Original procedural "+STUDIES[study].title+" graphic; speculative visual composition"} style={{display:"block",width:"100%",height:"100%",touchAction:"pan-y"}}/>
        {showPlayback&&!isStatic&&<button onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()} onClick={()=>{if(status==="waiting"){setPaused(false);request()}else setPaused(p=>!p)}} disabled={status==="reduced-motion"||!animate||speed<=0} aria-pressed={paused} style={{...mono,position:"absolute",right:"3%",top:"3%",padding:"4px 8px",color:palette[0],background:palette[1],border:"none",cursor:"pointer",opacity:.85}}>{status==="reduced-motion"?"REDUCED MOTION":!animate||speed<=0?"MOTION OFF":paused||status==="waiting"?"PLAY":"PAUSE"}</button>}
        {(error||status==="recovering")&&<div role="status" style={{...mono,position:"absolute",inset:"42% 8%",textAlign:"center",color:palette[2]}}>{error?"Graphics unavailable in this browser.":"Restoring graphics…"}</div>}
    </div>
}
addPropertyControls(OriginalHeroStudy,{
    study:{type:ControlType.Enum,title:"Composition",options:["counterfield","atlas","axial","fold","palimpsest","assemblage","counterfold","indexorbit","researchfield"],optionTitles:["001 · Counterfield","002 · Atlas","003 · Axial","004 · Fold","005 · Palimpsest","006 · Assemblage","007 · Counterfold","008 · Index orbit","009 · Research field"],defaultValue:"counterfield"},
    animate:{type:ControlType.Boolean,title:"Animate",defaultValue:true},canvasMotion:{type:ControlType.Boolean,title:"Canvas motion",defaultValue:false},speed:{type:ControlType.Number,title:"Speed",min:0,max:2,step:.05,defaultValue:1},stillTime:{type:ControlType.Number,title:"Still time",min:0,max:60,step:.25,defaultValue:3},artworkScale:{type:ControlType.Number,title:"Artwork size",min:.5,max:1.5,step:.05,defaultValue:1},detail:{type:ControlType.Number,title:"Structure",min:.6,max:1.4,step:.05,defaultValue:1},motionSpan:{type:ControlType.Number,title:"Motion span",min:0,max:1,step:.05,defaultValue:1},ditherPitch:{type:ControlType.Number,title:"Tonal pitch",min:1.8,max:6,step:.1,defaultValue:3.5},interactive:{type:ControlType.Boolean,title:"Pointer",defaultValue:true},customColors:{type:ControlType.Boolean,title:"Custom colors",defaultValue:false},background:{type:ControlType.Color,title:"Background",defaultValue:"#101511",hidden:(p:Props)=>!p.customColors},primary:{type:ControlType.Color,title:"Primary",defaultValue:"#ddefba",hidden:(p:Props)=>!p.customColors},ink:{type:ControlType.Color,title:"Ink",defaultValue:"#f0f0e8",hidden:(p:Props)=>!p.customColors},accent:{type:ControlType.Color,title:"Accent",defaultValue:"#819366",hidden:(p:Props)=>!p.customColors},showPlayback:{type:ControlType.Boolean,title:"Playback button",defaultValue:true}
})



