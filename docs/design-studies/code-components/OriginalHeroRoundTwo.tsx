import * as React from "react"
import {addPropertyControls,ControlType,RenderTarget,useIsStaticRenderer} from "framer"

// Original Round02 / pure lanes OH-010–018. Additive; Round01 remains unchanged.
// Actual vocabulary: src/lib/productDetails.ts. Actual report excerpts/data:
// src/lib/explicitmemBenchmark.ts. Architecture: src/components/SystemField.astro.
// These are editorial excerpts/reference diagrams, never fabricated papers or live results.
// Owned logo geometry: monarchic-meta/logo1844d35; canonicalSVG SHA71ef4b55…a543.
type Mode="pathfield"|"concordance"|"axialpassage"|"letterengine"|"reportcuts"|"researchfilm"|"semanticaperture"|"formatpress"|"fieldtransmission"
type Status="waiting"|"running"|"paused"|"static"|"reduced-motion"|"offscreen"|"recovering"
interface Props {study?:Mode;animate?:boolean;canvasMotion?:boolean;speed?:number;stillTime?:number;artworkScale?:number;detail?:number;motionSpan?:number;ditherPitch?:number;interactive?:boolean;customColors?:boolean;background?:string;primary?:string;ink?:string;accent?:string;showPlayback?:boolean;style?:React.CSSProperties}
interface Settings {mode:Mode;animate:boolean;static:boolean;canvasPreview:boolean;speed:number;stillTime:number;artworkScale:number;detail:number;motionSpan:number;ditherPitch:number;interactive:boolean;background:string;primary:string;secondary:string;ink:string;accent:string;managed?:boolean;renderWidth?:number;renderHeight?:number;managedBufferWidth?:number;managedBufferHeight?:number;pixelBudget?:number;colorHost?:HTMLCanvasElement}
const STUDIES={
 pathfield:{key:"OH-010",title:"Pathfield",palette:["#0c1110","#c5d8be","#f1f2e9","#d7fb78"]},
 concordance:{key:"OH-011",title:"Concordance",palette:["#eeeee8","#232724","#171b19","#a12c2c"]},
 axialpassage:{key:"OH-012",title:"Axial Passage",palette:["#101112","#eeeeea","#f7f7f2","#898d90"]},
 letterengine:{key:"OH-013",title:"Letterform Engine",palette:["#e04b33","#191b1a","#101211","#f1e9d4"]},
 reportcuts:{key:"OH-014",title:"Report Cuts",palette:["#ddd8ca","#1c201e","#161a18","#a73427"]},
 researchfilm:{key:"OH-015",title:"Research Film",palette:["#0c0e0f","#ebe7d9","#f3f1e8","#5d6b85"]},
 semanticaperture:{key:"OH-016",title:"Semantic Aperture",palette:["#263de1","#f0eadc","#f7f2e4","#d59072"]},
 formatpress:{key:"OH-017",title:"Format Press",palette:["#3b1b2e","#eee7d4","#191512","#bf795e"]},
 fieldtransmission:{key:"OH-018",title:"Field Transmission",palette:["#eae6d9","#2d3430","#171b18","#a6c34e"]},
} as const
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v))
const smooth=(t:number)=>{t=clamp(t);return t*t*(3-2*t)}
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5]
const METHODS=["The complete 500-question set was scored with deterministic normalized answer matching under a fixed evaluation profile.","Each result applies only to its named dataset, configuration, metric, and artifact.","One temporal item differed from the upstream gold answer, so the strict perfect-score gate remained unmet.","A fixed retrieval profile was evaluated against 1,986 cases using expected-memory recall as the primary metric.","High-recall candidate generation for downstream ranking. It is not final top-50 ranking quality or answer accuracy.","Deterministic extractive answer support. It is not LLM-judged provider scoring or proof of open-ended answer quality."]
const QUESTION_TYPES=[["Knowledge update",78],["Multi-session",133],["Single-session assistant",56],["Single-session preference",30],["Single-session user",70],["Temporal reasoning",133]] as const
const SOURCE_PATHS=["src/lib/productDetails.ts","src/lib/explicitmemBenchmark.ts","src/components/SystemField.astro"]
const ACTUAL_TERMS=["Agent Workflows","Launch run","Monitor progress","Review artifacts","Control execution","Delivery Operations","Pipeline diagnosis","Release gates","Change impact","Architecture export","Browser QA","Observe a URL","Verify a page","Capture screenshots","Inspect console and network","Strategy","Company synthesis","Gate review","Blueprint creation","Market research","Project Setup","Choose template","Create project","Return manifest","Report failure","Agent Memory","Write memory","Search memory","Retrieve context","Audit objects","Incident Response","Source ingestion","Incident triage","Response packet","Guarded updates","Infrastructure Intelligence","Hotspot ranking","Cost analysis","Pipeline profiling","Go-to-Market","Validate enrichment","Generate targets","Rank accounts","Package campaign research","Terminal Control","Start session","Write input","Read output","Close session","Release Management","Release readiness","Changelog scope","Artifact manifest","Reviewer pack","Repository Operations","Fleet inventory","Repository sync","Batch checks","Failure reporting","Repository Intelligence","Repository summary","Generated wiki","Source lookup","Workflow discovery","SEO Operations","Route discovery","Live inspection","Internal-link planning","Ranking checks","Code Quality","Submit source","Analyze quality","Explain finding","Review remediation","Content Quality","Submit copy","Edit text","Review vagueness","Apply revisions","Health and Nutrition","Inspect schema","Validate requirements","Run calculation","Build plan","Code Intelligence","Index repository","Find symbols","Trace references","Inspect diagnostics","Code Analysis","Detect stack","Run probes","Review report","Organization Operations","Inventory organization","Check drift","Approve sync","Review results","Organization Intelligence","Select scope","Start analysis","Resume job","Export report","Visual Design","Build artwork","Review geometry","Export asset","Web Planning","Load contract","Define hierarchy","Specify states","Prepare implementation","Web Research","Collect sources","Record findings","Approve decisions","Publish project context","Web Visuals","Define scene","Render preview","Inspect output","Export bundle"] as const
const LOGO_CIRCLE_PATH = "M645.32365472,293.63834253 C606.48376029,269.85249606 560.82665278,256.13573892 512,256.13573892 C370.81799556,256.13573892 256.13573892,370.81799556 256.13573892,512 C256.13573892,575.28945904 279.18199112,633.25359671 317.33050769,677.94842518 C334.85033964,698.47467244 355.55544436,716.20224207 378.67634528,730.36165747 C417.51623971,754.14750394 463.17334722,767.86426108 512,767.86426108 C653.18200444,767.86426108 767.86426108,653.18200444 767.86426108,512 C767.86426108,448.71054096 744.81800888,390.74640329 706.66949231,346.05157482 C689.14966036,325.52532756 668.44455564,307.79775793 645.32365472,293.63834253 Z"
const LOGO_CARRIER_PATH = "M873.94267733,150.05732267 L767.86426108,150.05732267 L150.05732267,873.94267733 L256.13573892,873.94267733 Z"
// Down-left axis between the midpoints of the canonical bar's horizontal caps.
const CARRIER_AXIS = { x: -617.80693841, y: 723.88535466 }

const GLYPHS:Record<string,string[]>={M:["10001","11011","10101","10001","10001","10001","10001"],O:["01110","10001","10001","10001","10001","10001","01110"],N:["10001","11001","11001","10101","10011","10011","10001"],A:["01110","10001","10001","11111","10001","10001","10001"],R:["11110","10001","10001","11110","10100","10010","10001"],C:["01111","10000","10000","10000","10000","10000","01111"],H:["10001","10001","10001","11111","10001","10001","10001"],I:["11111","00100","00100","00100","00100","00100","11111"]}
function createRenderer(canvas:HTMLCanvasElement,initial:Settings,notify:(status:Status,error?:string)=>void,resumeTime=initial.stillTime){
 const ctx=canvas.getContext("2d",{alpha:false,willReadFrequently:initial.mode==="researchfilm"});if(!ctx)throw Error("Canvas artwork is unavailable.")
 const proseCache=new Map<string,string[]>()
 let settings=initial,width=1,height=1,bw=1,bh=1,time=resumeTime,disposed=false,mouse:[number,number]=[0,0],circle:Path2D|undefined,carrier:Path2D|undefined
 const color=(v:string,a=1)=>"rgba("+rgb(v,settings.colorHost??canvas).map(n=>Math.round(n*255)).join(",")+","+clamp(a)+")"
 const mix=(a:string,b:string,t:number)=>{const x=rgb(a,canvas),y=rgb(b,canvas);return"rgb("+x.map((v,i)=>Math.round((v+(y[i]-v)*clamp(t))*255)).join(",")+")"}
 const t=()=>time*settings.motionSpan
 function resize(){width=Math.max(1,settings.renderWidth??canvas.clientWidth??1440);height=Math.max(1,settings.renderHeight??canvas.clientHeight??1000);let w=Math.max(1,Math.floor(settings.managedBufferWidth??width)),h=Math.max(1,Math.floor(settings.managedBufferHeight??height)),budget=settings.pixelBudget??2000000;if(w*h>budget){const f=Math.sqrt(budget/(w*h));w=Math.max(1,Math.floor(w*f));h=Math.max(1,Math.min(Math.floor(budget/w),Math.floor(h*f)))}if(canvas.width!==w||canvas.height!==h){canvas.width=1;canvas.height=1;canvas.width=w;canvas.height=h;}bw=w;bh=h}
 function line(x:number,y:number,xx:number,yy:number,c:string,w=.7){ctx!.beginPath();ctx!.moveTo(x,y);ctx!.lineTo(xx,yy);ctx!.strokeStyle=c;ctx!.lineWidth=w;ctx!.stroke()}
 function text(s:string,x:number,y:number,size:number,c:string,weight=400,family='"Arial",sans-serif'){ctx!.font=weight+" "+size+"px "+family;ctx!.fillStyle=c;ctx!.fillText(s,x,y)}
 function wrap(s:string,x:number,y:number,w:number,size:number,c:string,lineHeight=size*1.4,weight=400){ctx!.font=weight+" "+size+"px Arial,sans-serif";ctx!.fillStyle=c;let row="",yy=y;for(const word of s.split(" ")){const next=row?row+" "+word:word;if(row&&ctx!.measureText(next).width>w){ctx!.fillText(row,x,yy);row=word;yy+=lineHeight}else row=next}if(row)ctx!.fillText(row,x,yy);return yy+lineHeight}
 function pathfield(){
  const phone=width<600,unit=Math.min(width/1440,height/1000),cy=height*.40,vanishX=width*.59+mouse[0]*width*.04,spin=t()*.045
  const layers=Math.round(9*settings.detail)
  for(let layer=layers-1;layer>=0;layer--){const z=layer/(layers-1),scale=.22+(1-z)*1.28,alpha=.13+(1-z)*.5,shift=Math.sin(spin+layer*.55)*width*.035+mouse[0]*width*.045*(1-z),baseline=cy+(layer-layers*.40)*height*.055+mouse[1]*height*.04*(1-z)
   ctx!.save();ctx!.translate(vanishX+shift,baseline);ctx!.transform(scale,-.10*scale,.55*scale,.62*scale,0,0)
   for(let row=-3;row<4;row++){let xx=-width*(phone?1.5:.92)+((row+layer)%3)*width*.04;for(let col=0;col<(phone?5:7);col++){const index=((layer*19+row*7+col)%ACTUAL_TERMS.length+ACTUAL_TERMS.length)%ACTUAL_TERMS.length,term=ACTUAL_TERMS[index],size=(row===0?25:15)*Math.max(.6,unit);text(term,xx,row*47*unit,size,color(settings.primary,alpha),row===0?500:400,'"Courier New",monospace');xx+=ctx!.measureText(term).width+64*unit;}}
   ctx!.restore()
  }
  const vignette=ctx!.createRadialGradient(width*.30,height*.80,0,width*.30,height*.80,width*.64);vignette.addColorStop(0,color(settings.background,.99));vignette.addColorStop(.54,color(settings.background,.86));vignette.addColorStop(1,color(settings.background,0));ctx!.fillStyle=vignette;ctx!.fillRect(0,height*.44,width,height*.56)
  for(let i=0;i<5;i++){const y=height*(.15+i*.105)+Math.sin(t()*.12+i)*height*.012;line(width*.04,y,width*(.22+i*.12),y-height*.025,color(settings.accent,.07+i*.025),.6)}
 }
 function concordance(){
  const phone=width<600,size=(phone?8.5:13)*settings.detail,leading=size*1.8,colW=width/(phone?3:6),rows=Math.ceil(height/leading)+2
  const key=colW+"/"+size;let lines=proseCache.get(key);if(!lines){lines=[];ctx!.font="400 "+size+'px "Courier New",monospace';let row="";for(const word of METHODS.join(" ").split(" ")){const next=row?row+" "+word:word;if(row&&ctx!.measureText(next).width>colW-24){lines.push(row);row=word}else row=next}if(row)lines.push(row);proseCache.set(key,lines)}
  for(let c=0;c<(phone?3:6);c++){const shift=Math.sin(t()*.10+c)*leading*.42;for(let row=0;row<rows;row++){const phrase=lines[(row+c*7)%lines.length],alpha=.10+.25*(.5+.5*Math.sin(row*.22+c*1.7));text(phrase,c*colW+12,row*leading+shift,size,color(settings.primary,alpha),row%9===0?700:400,'"Courier New",monospace');}}
  ctx!.save();ctx!.translate(width*.82,height*.6);ctx!.rotate(-Math.PI/2);text("CONTEXT",0,0,(phone?110:250),color(settings.primary,.065),800);ctx!.restore()
  const band=height*(phone?.30:.32);ctx!.fillStyle=color(settings.background,.97);ctx!.fillRect(width*.035,band,width*.91,height*(phone?.27:.32));line(width*.035,band-8,width*.94,band-8,color(settings.accent,.62),1)
  const x=width*(.58+mouse[0]*.04),yy=height*(.80+mouse[1]*.04),r=Math.min(width,height)*.19;const lens=ctx!.createRadialGradient(x,yy,0,x,yy,r);lens.addColorStop(0,color(settings.background,.70));lens.addColorStop(1,color(settings.background,0));ctx!.fillStyle=lens;ctx!.fillRect(0,0,width,height)
 }
 function axialpassage(){
  circle??=new Path2D(LOGO_CIRCLE_PATH);carrier??=new Path2D(LOGO_CARRIER_PATH)
  const phone=width<600,size=Math.min(width*(phone?1.35:.91),height*(phone?1.02:1.45)),cx=width*(phone?.70:.73),cy=height*(phone?.42:.50),phase=((t()%12)+12)%12,offset=phase<3?-960*(1-smooth(phase/3)):phase<6?0:phase<9?960*smooth((phase-6)/3):960,dx=offset*CARRIER_AXIS.x/CARRIER_AXIS.y,shape=new Path2D(circle)
  shape.addPath(carrier,new DOMMatrix().translate(dx,offset));const layers=Math.round(36*settings.detail),depth=size*(.075+.04*Math.sin(t()*.24)),skew=-.22+Math.sin(t()*.13)*.025
  for(let i=layers;i>=0;i--){const k=i/layers;ctx!.save();ctx!.translate(cx-depth*k,cy+depth*k*.65);ctx!.transform(.88,.04+mouse[1]*.03,skew,1,0,0);ctx!.scale(size/1024,size/1024);ctx!.translate(-512,-512);ctx!.fillStyle=mix(settings.primary,settings.background,.10+k*.72);ctx!.fill(shape,"evenodd");ctx!.restore()}
  ctx!.save();ctx!.translate(cx,cy);ctx!.transform(.88,.04+mouse[1]*.03,skew,1,0,0);ctx!.scale(size/1024,size/1024);ctx!.translate(-512,-512);ctx!.fillStyle=color(settings.primary);ctx!.fill(shape,"evenodd");ctx!.strokeStyle=color(settings.ink,.9);ctx!.lineWidth=1.1;ctx!.stroke(shape);ctx!.restore()
 }
 function letterengine(){
  const phone=width<600,groups=phone?[{word:"MON",x:-.07,y:.30,u:.081},{word:"ARCH",x:-.02,y:.58,u:.047},{word:"IC",x:.55,y:.76,u:.065}]:[{word:"MON",x:-.025,y:.28,u:.041},{word:"ARCHIC",x:.22,y:.66,u:.023}],cycle=((t()%12)+12)%12,phase=cycle<6?0:cycle<9?smooth((cycle-6)/3):1-smooth((cycle-9)/3)
  for(const group of groups){const u=width*group.u,xx=width*group.x,yy=height*group.y;for(let li=0;li<group.word.length;li++){const glyph=GLYPHS[group.word[li]];for(let row=0;row<7;row++)for(let col=0;col<5;col++)if(glyph[row][col]==="1"){const pulse=phase*(.7+.3*Math.sin(li*.8+row*.3)),part=(row+col+li)%4,offset=pulse*u*.7,px=xx+li*6*u+col*u+(part===0?-offset:part===1?offset:0)+mouse[0]*u*.12,py=yy+row*u+(part===2?-offset:part===3?offset:0);ctx!.fillStyle=color(settings.ink,.34);ctx!.fillRect(px+u*.12,py+u*.16,u*.96,u*.96);ctx!.fillStyle=color(settings.primary);ctx!.fillRect(px,py,u*.96,u*.96);if((row+col)%3===0){ctx!.fillStyle=color(settings.accent,.55);ctx!.fillRect(px,py,u*.96,u*.045)}}}}
 }
 function report(w:number,h:number,kind:number){
  ctx!.fillStyle="#f4f0e6";ctx!.fillRect(0,0,w,h);const pad=w*.06;line(pad,h*.09,w-pad,h*.09,"#262a27",.8);text("EXPLICITMEM",pad,h*.065,w*.036,"#202521",700);text("METHOD / SCOPE",w*.62,h*.065,w*.017,"#414740",400,'"Courier New",monospace')
  if(kind===0){text("Memory that survives",pad,h*.22,w*.071,"#202521",600);text("long agent work",pad,h*.29,w*.071,"#202521",600);let y=h*.40;y=wrap(METHODS[0],pad,y,w*.62,w*.025,"#333b35",w*.038);y=wrap(METHODS[1],pad,y+h*.06,w*.80,w*.023,"#475047",w*.035);line(pad,y+h*.04,w-pad,y+h*.04,"#bd3d2c",1.5);wrap("LongMemEval-S / Fixed answer synthesis / 1 August 2026",pad,y+h*.095,w*.82,w*.025,"#242c26",w*.037,600)}
  else if(kind===1){text("Question types",pad,h*.22,w*.067,"#202521",600);text("LongMemEval-S / 500 questions",pad,h*.29,w*.026,"#596254",400);for(let i=0;i<QUESTION_TYPES.length;i++){const y=h*(.40+i*.075);line(pad,y-h*.025,w-pad,y-h*.025,"#a5a89c",.6);text(QUESTION_TYPES[i][0],pad,y,w*.027,"#2d352d");text(String(QUESTION_TYPES[i][1]),w*.83,y,w*.029,"#2d352d",700)}text("Question counts, not answer-accuracy values",pad,h*.94,w*.019,"#596254")}
  else{text("A result within",pad,h*.21,w*.072,"#202521",600);text("its benchmark",pad,h*.29,w*.072,"#202521",600);wrap(METHODS[2],pad,h*.44,w*.82,w*.041,"#242b26",w*.058,500);line(pad,h*.73,w*.54,h*.73,"#a73427",3);wrap(METHODS[1],pad,h*.82,w*.82,w*.026,"#525b50",w*.037)}
 }
 function reportcuts(){
  const phone=width<600,edit=0,alternate=Math.floor(t()/8)%2===1,pieces=alternate?(phone?[{x:.11,y:.12,w:1.05,h:.72,a:.035,k:2},{x:-.36,y:.58,w:1.01,h:.51,a:-.07,k:1},{x:.56,y:.76,w:.84,h:.39,a:.045,k:0}]:[{x:.28,y:.08,w:.77,h:.91,a:.025,k:2},{x:-.14,y:.51,w:.61,h:.58,a:-.055,k:1},{x:-.08,y:-.13,w:.50,h:.48,a:.04,k:0}]):phone?[{x:-.28,y:.12,w:1.19,h:.53,a:-.08,k:0},{x:.31,y:.48,w:.87,h:.47,a:.07,k:1},{x:-.08,y:.77,w:.90,h:.38,a:-.04,k:2}]:[{x:-.09,y:.12,w:.69,h:.71,a:-.065,k:0},{x:.48,y:.38,w:.53,h:.63,a:.085,k:1},{x:.09,y:.76,w:.50,h:.39,a:-.035,k:2}]
  for(const p of pieces){ctx!.save();ctx!.translate(width*p.x+mouse[0]*7,height*p.y);ctx!.rotate(p.a+edit*(p.k-1));ctx!.fillStyle=color(settings.ink,.18);ctx!.fillRect(9,13,width*p.w,height*p.h);report(width*p.w,height*p.h,p.k);ctx!.restore()}
 }
 function diagram(w:number,h:number){
  ctx!.fillStyle="#121818";ctx!.fillRect(0,0,w,h);const x=(n:number)=>n/100*w,y=(n:number)=>n/100*h;ctx!.strokeStyle="#a8b6a6";ctx!.lineWidth=Math.max(1,w*.001);ctx!.strokeRect(x(12),y(12),x(76),y(76));ctx!.strokeRect(x(38),y(38),x(24),y(24));
  const routes=[[[22,21],[31,21],[31,42],[40,42]],[[78,21],[69,21],[69,42],[60,42]],[[22,75],[31,75],[31,58],[40,58]],[[78,75],[69,75],[69,58],[60,58]]];for(const[r,route]of routes.entries()){ctx!.beginPath();route.forEach((p,i)=>i?ctx!.lineTo(x(p[0]),y(p[1])):ctx!.moveTo(x(p[0]),y(p[1])));ctx!.strokeStyle="#778e7d";ctx!.stroke();const phase=((t()*.13+r*.25)%1+1)%1,index=Math.min(2,Math.floor(phase*3)),f=phase*3-index,a=route[index],b=route[index+1];ctx!.fillStyle="#dee7d4";ctx!.fillRect(x(a[0]+(b[0]-a[0])*f)-3,y(a[1]+(b[1]-a[1])*f)-3,6,6)}
  for(const[n,xx,yy]of [["Intent",22,21],["Plan",78,21],["Workers",22,75],["Result",78,75],["Run",50,50]] as const){ctx!.fillStyle="#182320";ctx!.fillRect(x(xx-10),y(yy-5),x(20),y(10));text(n,x(xx-8),y(yy+2),w*.039,"#d7e1cf",600)}
  text("Architecture reference model",x(4),y(96),w*.014,"#98aa9a",400,'"Courier New",monospace')
 }
 function researchfilm(){
  const phone=width<600,cut=Math.floor(t()/9)%2,drift=Math.sin(t()*.09)*.008
  // A diagram, a question-count table and a separate limitations excerpt form an
  // editorial edit. These are named repository fragments, not new publications.
  ctx!.save();ctx!.translate(width*(phone?-.18:-.075)+mouse[0]*width*.012,height*(phone?.075:.055));ctx!.rotate(-.045+drift);diagram(width*(phone?1.17:.66),height*(phone?.42:.57));ctx!.restore()
  ctx!.save();ctx!.translate(width*(phone?.48:.57),height*(phone?.22:.09));ctx!.rotate(.035-drift);report(width*(phone?.68:.40),height*(phone?.43:.56),1);ctx!.restore()
  ctx!.save();const x=width*(phone?-.10:.045),y=height*(phone?.52:.48),w=width*(phone?1.02:.52),h=height*(phone?.22:.24);ctx!.translate(x,y);ctx!.rotate(-.025);ctx!.fillStyle="#e4ddcc";ctx!.fillRect(0,0,w,h);const p=w*.055;text(cut?"Specific evidence":"A result within its benchmark",p,h*.21,w*(phone?.050:.045),"#202521",600);wrap(METHODS[cut?1:2],p,h*.43,w*.88,w*(phone?.031:.023),"#333b35",w*(phone?.046:.034),500);text("EXPLICITMEM / EVALUATION SCOPE",p,h*.91,w*.016,"#596254",400,'"Courier New",monospace');ctx!.restore()
  ctx!.fillStyle=color(settings.background,.98);ctx!.fillRect(0,height*.73,width*(phone?1:.58),height*.27)
 }
 function semanticaperture(){
  circle??=new Path2D(LOGO_CIRCLE_PATH);carrier??=new Path2D(LOGO_CARRIER_PATH)
  const phone=width<600,size=Math.min(width*(phone?1.85:1.15),height*1.65),x=width*(phone?.33:.33),y=height*(phone?.49:.54),offset=Math.sin(t()*.20)*230,shape=new Path2D(circle)
  shape.addPath(carrier,new DOMMatrix().translate(offset*CARRIER_AXIS.x/CARRIER_AXIS.y,offset))
  ctx!.save();ctx!.translate(x,y);ctx!.scale(size/1024,size/1024);ctx!.translate(-512,-512);ctx!.fillStyle=color(settings.primary,.13);ctx!.fill(shape,"evenodd");ctx!.clip(shape,"evenodd")
  const lines=Math.ceil(33*settings.detail),font=(phone?22:17)/Math.sqrt(settings.detail),spacing=(phone?30:23)/settings.detail;for(let row=-1;row<lines;row++){let xx=-50+(row%2)*60+mouse[0]*20;for(let col=0;col<6;col++){const phrase=ACTUAL_TERMS[(row*5+col*7+ACTUAL_TERMS.length)%ACTUAL_TERMS.length];text(phrase,xx,140+row*spacing,font,color(settings.primary,.42+((row+col)%3)*.22),row%7===0?700:400,'"Courier New",monospace');xx+=ctx!.measureText(phrase).width+35}}
  ctx!.restore();ctx!.save();ctx!.translate(x,y);ctx!.scale(size/1024,size/1024);ctx!.translate(-512,-512);ctx!.strokeStyle=color(settings.ink,.56);ctx!.lineWidth=1.5;ctx!.stroke(shape);ctx!.restore()
  if(!phone){ctx!.fillStyle=color(settings.background);ctx!.fillRect(width*.515,height*.065,width*.485,height*.15)}
  const bx=width*(phone?.08:.55),by=height*(phone?.26:.22);ctx!.fillStyle=color(settings.accent);ctx!.fillRect(bx,by,phone?64:120,phone?4:6)
 }
 function formatpress(){
  const phone=width<600,x=width*(phone?-.12:.08),y=height*(phone?.19:.14),w=width*(phone?1.23:.90),h=height*(phone?.85:1.02),cycle=((t()%12)+12)%12,open=cycle<4?0:cycle<7?smooth((cycle-4)/3):cycle<9?1:1-smooth((cycle-9)/3),gap=open*height*.055+mouse[1]*5,shape=new Path2D()
  for(const[xx,yy]of[[0,0],[.23,0],[.5,.42],[.77,0],[1,0],[1,1],[.74,1],[.74,.43],[.5,.79],[.26,.43],[.26,1],[0,1]]as const)shape.lineTo(x+xx*w,y+yy*h);shape.closePath()
  for(let half=0;half<2;half++){ctx!.save();ctx!.translate(0,(half?1:-1)*gap);ctx!.beginPath();ctx!.rect(0,half?y+h*.49:0,width,half?height:y+h*.49);ctx!.clip();ctx!.fillStyle=color(settings.primary);ctx!.fill(shape);ctx!.clip(shape)
   ctx!.save();ctx!.translate(x-w*.04,y-h*.02);ctx!.rotate(-.025);report(w*.57,h*1.08,0);ctx!.restore();ctx!.save();ctx!.translate(x+w*.56,y+h*.08);ctx!.rotate(.035);report(w*.60,h*.97,1);ctx!.restore();ctx!.strokeStyle=color(settings.accent);ctx!.lineWidth=phone?3:6;ctx!.stroke(shape);ctx!.restore()}
  ctx!.fillStyle=color(settings.background);ctx!.fillRect(0,height*.91,width,height*.09)
 }
 function fieldtransmission(){
  const phone=width<600,tableX=width*(phone?.48:.57),tableY=-height*.17
  ctx!.save();ctx!.translate(tableX,tableY);ctx!.rotate(-.035);report(width*(phone?.89:.64),height*1.42,1);ctx!.restore()
  const fieldX=width*.045,fieldY=height*(phone?.11:.10),font=phone?13:23;for(let row=0;row<(phone?9:11);row++){const phrase=ACTUAL_TERMS[(row*7+Math.floor(t()/7))%ACTUAL_TERMS.length],xx=fieldX+(row%3)*width*.035;const active=row===Math.floor(t()*.22)%9;text(phrase,xx,fieldY+row*font*1.36,font,color(active?settings.ink:settings.primary,active?1:.48),active?700:400,'"Courier New",monospace');if(active){ctx!.fillStyle=color(settings.accent);ctx!.fillRect(xx-8,fieldY+row*font*1.36-font*.8,3,font)}}
  ctx!.save();ctx!.translate(-width*.08,height*(phone?.58:.57));diagram(width*(phone?1.04:.72),height*.65);ctx!.restore()
  circle??=new Path2D(LOGO_CIRCLE_PATH);carrier??=new Path2D(LOGO_CARRIER_PATH);const mark=new Path2D(circle),offset=Math.sin(t()*.18)*105;mark.addPath(carrier,new DOMMatrix().translate(offset*CARRIER_AXIS.x/CARRIER_AXIS.y,offset));ctx!.save();const size=width*(phone?.55:.26);ctx!.translate(width*(phone?.42:.40)+mouse[0]*8,height*(phone?.27:.21));ctx!.scale(size/1024,size/1024);ctx!.translate(-512,-512);ctx!.fillStyle=color(settings.ink);ctx!.fill(mark,"evenodd");ctx!.clip(mark,"evenodd");ctx!.fillStyle=color(settings.accent);ctx!.fillRect(0,440,1024,190);ctx!.restore()
  ctx!.fillStyle=color(settings.background);ctx!.fillRect(0,height*(phone?.40:.395),width,height*(phone?.18:.18))
 }
 function tonalFilm(){
  const image=ctx!.getImageData(0,0,bw,bh),pixels=new Uint32Array(image.data.buffer),pitchX=Math.max(1,Math.round(settings.ditherPitch*bw/width)),pitchY=Math.max(1,Math.round(settings.ditherPitch*bh/height)),bg=rgb(settings.background,canvas),fg=rgb(settings.primary,canvas),luma=(a:number[])=>a[0]*.2126+a[1]*.7152+a[2]*.0722,low=luma(bg),range=Math.max(.01,luma(fg)-low),little=new Uint8Array(new Uint32Array([0x01020304]).buffer)[0]===4,packed=(v:number[])=>{const r=Math.round(v[0]*255),g=Math.round(v[1]*255),b=Math.round(v[2]*255);return little?(0xff000000|(b<<16)|(g<<8)|r)>>>0:((r<<24)|(g<<16)|(b<<8)|255)>>>0},paper=packed(fg),black=packed(bg)
  const thresholds=BAYER.map(n=>(low+.04+Math.max(.01,range-.04)*(n+.5)/16)*255),data=image.data
  if(pitchX===1&&pitchY===1){for(let y=0;y<bh;y++){const row=(y&3)*4;for(let x=0;x<bw;x++){const at=y*bw+x,i=at*4;pixels[at]=data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722>thresholds[row+(x&3)]?paper:black}}}
  else for(let y=0,row=0;y<bh;y+=pitchY,row++){const ey=Math.min(bh,y+pitchY),sampleY=Math.min(bh-1,y+(pitchY>>1)),rowAt=y*bw;for(let x=0,col=0;x<bw;x+=pitchX,col++){const ex=Math.min(bw,x+pitchX),i=(sampleY*bw+Math.min(bw-1,x+(pitchX>>1)))*4,value=data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722>thresholds[(row&3)*4+(col&3)]?paper:black;for(let xx=x;xx<ex;xx++)pixels[rowAt+xx]=value}for(let yy=y+1;yy<ey;yy++)pixels.copyWithin(yy*bw,rowAt,rowAt+bw)}
  ctx!.putImageData(image,0,0)
 }
 function draw(){if(disposed)return;ctx!.setTransform(bw/width,0,0,bh/height,0,0);ctx!.globalAlpha=1;ctx!.globalCompositeOperation="source-over";ctx!.shadowBlur=0;ctx!.setLineDash([]);ctx!.clearRect(0,0,width,height);ctx!.beginPath();ctx!.fillStyle=color(settings.background);ctx!.fillRect(0,0,width,height);ctx!.save();ctx!.translate(width/2,height/2);ctx!.scale(settings.artworkScale,settings.artworkScale);ctx!.translate(-width/2,-height/2);if(settings.mode==="pathfield")pathfield();else if(settings.mode==="concordance")concordance();else if(settings.mode==="axialpassage")axialpassage();else if(settings.mode==="letterengine")letterengine();else if(settings.mode==="reportcuts")reportcuts();else if(settings.mode==="researchfilm")researchfilm();else if(settings.mode==="semanticaperture")semanticaperture();else if(settings.mode==="formatpress")formatpress();else fieldtransmission();ctx!.restore();if(settings.mode==="researchfilm")tonalFilm();for(const n of [canvas,settings.colorHost])if(n){n.setAttribute("data-original-round-two-id",STUDIES[settings.mode].key);n.setAttribute("data-original-round-two-mode",settings.mode);n.setAttribute("data-original-round-two-phase",String(time));n.setAttribute("data-hero-mode",settings.mode);n.setAttribute("data-hero-phase",String(time));n.setAttribute("data-hero-mechanism","original-round-two-"+settings.mode)}}
 resize();return{update(next:Settings){settings=next;resize()},getSnapshot(){return{mode:settings.mode,stillTime:settings.stillTime,time,lost:false}},setPointer(x:number,y:number){mouse=settings.interactive?[x,y]:[0,0]},renderAt(seconds:number){time=seconds;draw()},dispose(){disposed=true;circle=undefined;carrier=undefined;proseCache.clear()}}
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
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 1000
 */
export default function OriginalHeroRoundTwo(props:Props){
    const{study="pathfield",animate=true,canvasMotion=false,speed=1,stillTime=3,artworkScale=1,detail=1,motionSpan=1,ditherPitch=3.5,interactive=true,customColors=false,background="#0c1110",primary="#c5d8be",ink="#f1f2e9",accent="#d7fb78",showPlayback=true,style}=props
    const palette=customColors?[background,primary,ink,accent]:STUDIES[study].palette,target=RenderTarget.current(),staticRenderer=useIsStaticRenderer(),canvasPreview=canvasMotion&&target===RenderTarget.canvas,isStatic=target===RenderTarget.export||target===RenderTarget.thumbnail||(staticRenderer&&!canvasPreview)||(target===RenderTarget.canvas&&!canvasPreview)
    const root=React.useRef<HTMLDivElement>(null),canvas=React.useRef<HTMLCanvasElement>(null),lastMove=React.useRef<[number,number]|null>(null),scrollAt=React.useRef(-Infinity),[paused,setPaused]=React.useState(false),[status,setStatus]=React.useState<Status>("offscreen"),[error,setError]=React.useState("")
    React.useEffect(()=>{const scroll=()=>{scrollAt.current=performance.now()};window.addEventListener("scroll",scroll,{passive:true,capture:true});return()=>window.removeEventListener("scroll",scroll,true)},[])
    const settings:Settings={mode:study,animate:animate&&!paused,static:isStatic,canvasPreview,speed:Math.max(0,speed),stillTime,artworkScale:clamp(artworkScale,.5,1.5),detail:clamp(detail,.6,1.4),motionSpan:clamp(motionSpan),ditherPitch:clamp(ditherPitch,1.8,6),interactive,background:palette[0],primary:palette[1],secondary:palette[3],ink:palette[2],accent:palette[3]}
    const request=useStudySurface(root,canvas,settings,target,"OriginalHeroRoundTwo.tsx",(s,e)=>{setStatus(s);setError(e??"")}),mono:React.CSSProperties={fontFamily:'"IBM Plex Mono",monospace',fontSize:9,lineHeight:1.4,letterSpacing:".02em"}
    return <div ref={root} role="group" aria-label={STUDIES[study].key+" / "+STUDIES[study].title+" / original composition"} onPointerMoveCapture={e=>{const last=lastMove.current,same=last?.[0]===e.clientX&&last?.[1]===e.clientY;lastMove.current=[e.clientX,e.clientY];if(e.pointerType==="touch"||same||performance.now()-scrollAt.current<180)e.stopPropagation()}} style={{width:"100%",height:"100%",...style,position:"relative",overflow:"hidden",background:palette[0]}}>
        <canvas ref={canvas} role="img" aria-label={"Original procedural "+STUDIES[study].title+" graphic; speculative visual composition"} style={{display:"block",width:"100%",height:"100%",touchAction:"pan-y"}}/>
        {showPlayback&&!isStatic&&<button onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()} onClick={()=>{if(status==="waiting"){setPaused(false);request()}else setPaused(p=>!p)}} disabled={status==="reduced-motion"||!animate||speed<=0} aria-pressed={paused} style={{...mono,position:"absolute",right:"3%",top:study==="reportcuts"?"19%":study==="semanticaperture"?"28%":study==="formatpress"?"17%":"10%",padding:"4px 8px",color:palette[0],background:palette[1],border:"none",cursor:"pointer",opacity:.85}}>{status==="reduced-motion"?"REDUCED MOTION":!animate||speed<=0?"MOTION OFF":paused||status==="waiting"?"PLAY":"PAUSE"}</button>}
        {(error||status==="recovering")&&<div role="status" style={{...mono,position:"absolute",inset:"42% 8%",textAlign:"center",color:palette[2]}}>{error?"Graphics unavailable in this browser.":"Restoring graphics…"}</div>}
    </div>
}
addPropertyControls(OriginalHeroRoundTwo,{
    study:{type:ControlType.Enum,title:"Composition",options:["pathfield","concordance","axialpassage","letterengine","reportcuts","researchfilm","semanticaperture","formatpress","fieldtransmission"],optionTitles:["010 · Pathfield","011 · Concordance","012 · Axial Passage","013 · Letterform Engine","014 · Report Cuts","015 · Research Film","016 · Semantic Aperture","017 · Format Press","018 · Field Transmission"],defaultValue:"pathfield"},
    animate:{type:ControlType.Boolean,title:"Animate",defaultValue:true},canvasMotion:{type:ControlType.Boolean,title:"Canvas motion",defaultValue:false},speed:{type:ControlType.Number,title:"Speed",min:0,max:2,step:.05,defaultValue:1},stillTime:{type:ControlType.Number,title:"Still time",min:0,max:60,step:.25,defaultValue:3},artworkScale:{type:ControlType.Number,title:"Artwork size",min:.5,max:1.5,step:.05,defaultValue:1},detail:{type:ControlType.Number,title:"Structure",min:.6,max:1.4,step:.05,defaultValue:1,hidden:(p:Props)=>["letterengine","reportcuts","researchfilm","formatpress","fieldtransmission"].includes(p.study??"pathfield")},motionSpan:{type:ControlType.Number,title:"Motion span",min:0,max:1,step:.05,defaultValue:1},ditherPitch:{type:ControlType.Number,title:"Raster pitch",min:1.8,max:6,step:.1,defaultValue:3.5,hidden:(p:Props)=>p.study!=="researchfilm"},interactive:{type:ControlType.Boolean,title:"Pointer",defaultValue:true},customColors:{type:ControlType.Boolean,title:"Custom colors",defaultValue:false},background:{type:ControlType.Color,title:"Background",defaultValue:"#0c1110",hidden:(p:Props)=>!p.customColors},primary:{type:ControlType.Color,title:"Primary",defaultValue:"#c5d8be",hidden:(p:Props)=>!p.customColors||p.study==="reportcuts"},ink:{type:ControlType.Color,title:"Ink",defaultValue:"#f1f2e9",hidden:(p:Props)=>!p.customColors||["pathfield","concordance","researchfilm"].includes(p.study??"pathfield")},accent:{type:ControlType.Color,title:"Accent",defaultValue:"#d7fb78",hidden:(p:Props)=>!p.customColors||["axialpassage","reportcuts","researchfilm"].includes(p.study??"pathfield")},showPlayback:{type:ControlType.Boolean,title:"Playback button",defaultValue:true}
})



