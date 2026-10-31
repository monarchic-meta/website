import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';

// Actual Canvas paths, fonts and software-WebGL pixels, with the real component
// wrapper. Shared admission/cache behavior is checked in the mixed host suite.
// This is neither Framer persistence verification nor a hardware FPS benchmark.
const repo=fileURLToPath(new URL('../',import.meta.url)),ts=createRequire(import.meta.url)('typescript');
const source=fs.readFileSync(path.join(repo,'docs/design-studies/code-components/HeroMechanismStudy.tsx'),'utf8');
const evidence=process.env.MONARCHIC_HERO_MECHANISM_EVIDENCE_DIR??'/tmp/monarchic-hero-mechanism-browser';fs.mkdirSync(evidence,{recursive:true});
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const start=source.indexOf('// Embedded identically in the five standalone Framer files.'),end=source.indexOf('/**\n * @framerSupportedLayoutWidth',start);
const fixture=source.slice(0,start)+'function useStudySurface(...args:any[]){window.fixtureArgs=args;return()=>{}}\n'+source.slice(end);
const code=ts.transpileModule(fixture,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText+'\nwindow.mechanisms={createRenderer,getMacFrames,unpackVectorBlock,MAC_VECTOR_BASE64,MAC_VECTOR_RAW_BYTES};';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const reports=[],failures=[],pageErrors=[];
const verify=(test,message)=>{if(!test)failures.push(message);};
let codec;
try{
  for(const mode of ['macmoss','vercel','raster','mecha','origin'])for(const size of [{name:'desktop',width:960,height:600,bw:1024,bh:640},{name:'phone',width:351,height:440,bw:384,bh:481}]){
    const page=await browser.newPage({viewport:{width:size.width,height:size.height},deviceScaleFactor:1});page.on('pageerror',error=>pageErrors.push(error.message));
    await page.setContent('<!doctype html><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}*{box-sizing:border-box}</style>');
    await page.evaluate(()=>{
      window.exports={};window.schema={};
      const unitless=new Set(['opacity','fontWeight','lineHeight','zIndex','flex','flexGrow','flexShrink']);
      window.fixtureReact={Fragment:Symbol('Fragment'),useRef:value=>({current:value}),useState:value=>[value,()=>{}],useEffect(){},useLayoutEffect(){},createElement(type,props,...children){
        const append=(node,value)=>{if(Array.isArray(value))value.forEach(v=>append(node,v));else if(value!==null&&value!==undefined&&value!==false&&value!==true)node.append(value instanceof Node?value:document.createTextNode(String(value)));};
        const node=typeof type==='symbol'?document.createDocumentFragment():document.createElement(type);
        for(const[key,value]of Object.entries(props??{})){
          if(key==='style'){for(const[name,v]of Object.entries(value))node.style[name]=typeof v==='number'&&!unitless.has(name)?v+'px':v;}
          else if(key==='ref'){value.current=node;}
          else if(key.startsWith('on'))node.addEventListener(key.slice(2).replace(/Capture$/,'').toLowerCase(),value,key.endsWith('Capture'));
          else if(value!==undefined&&value!==false)node.setAttribute(key,String(value));
        }
        children.forEach(value=>append(node,value));return node;
      }};
      window.require=name=>name==='react'?window.fixtureReact:{RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail',current:()=> 'preview'},ControlType:{},useIsStaticRenderer:()=>false,addPropertyControls(component,controls){window.schema=controls;}};
    });
    await page.addScriptTag({content:code});
    const initial=await page.evaluate(({mode,size})=>{
      const root=exports.default({study:mode}),args=window.fixtureArgs;document.body.append(root);const canvas=args[1].current;if(mode!=='raster')canvas.getContext('2d',{alpha:false,willReadFrequently:true});const settings={...args[2],managed:true,renderWidth:size.width,renderHeight:size.height,managedBufferWidth:size.bw,managedBufferHeight:size.bh,pixelBudget:1000000},began=performance.now(),renderer=mechanisms.createRenderer(canvas,settings,()=>{}),factoryMs=performance.now()-began;
      window.live={root,canvas,settings,renderer};
      window.pixels=()=>{if(settings.mode==='raster'){const gl=canvas.getContext('webgl'),raw=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,raw);const out=new Uint8Array(raw.length),stride=canvas.width*4;for(let y=0;y<canvas.height;y++)out.set(raw.subarray(y*stride,(y+1)*stride),(canvas.height-y-1)*stride);return out;}return canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;};
      window.capture=(phase,px=0,py=0)=>{
        renderer.setPointer(px,py);const began=performance.now();renderer.renderAt(phase);const drawMs=performance.now()-began,data=pixels(),w=canvas.width,h=canvas.height;let checksum=2166136261,bright=0,dark=0,red=0,green=0,inkROI=0;const cells=[0,0,0,0],pad=Math.min(size.width,size.height)*.035,top=pad+Math.max(24,size.height*.07),bottom=Math.max(35,size.height*.08),side=Math.min((size.width-2*pad)/2,(size.height-top-bottom)/2),left=size.width-pad-side*2;
        for(let i=0;i<data.length;i+=4){for(let k=0;k<3;k++)checksum=Math.imul(checksum^data[i+k],16777619);const r=data[i],g=data[i+1],b=data[i+2],xx=(i/4%w)/w,yy=Math.floor(i/4/w)/h;if(xx>.25&&xx<.9&&yy>.15&&yy<.9&&Math.abs(r-243)+Math.abs(g-243)+Math.abs(b-241)>40)inkROI++;if(r>180&&g>180&&b>180)bright++;if(r<30&&g<30&&b<30)dark++;if(r>180&&g<60&&b<60)red++;if(g>100&&g>r*1.04&&g>b*1.02){green++;const gx=(xx*size.width-left)/side,gy=(yy*size.height-top)/side,cx=Math.floor(gx),cy=Math.floor(gy),lx=gx-cx,ly=gy-cy;if(cx>=0&&cx<2&&cy>=0&&cy<2&&lx>.06&&lx<.94&&ly>.18&&ly<.92)cells[cx+cy*2]++;}}
        const gl=settings.mode==='raster'?canvas.getContext('webgl'):null;
        return{phase,checksum:checksum>>>0,width:w,height:h,drawMs,brightFraction:bright/(w*h),darkFraction:dark/(w*h),redFraction:red/(w*h),greenFraction:green/(w*h),inkROIFraction:inkROI/(w*h),cells,cellAreaPixels:side*side*w/size.width*h/size.height,error:gl?.getError()??0,frame:canvas.getAttribute('data-hero-vector-frame'),visibleEdges:canvas.getAttribute('data-hero-visible-edges')};
      };
      const fonts=['serif','sans-serif','monospace'].map(family=>{const c=document.createElement('canvas');c.width=512;c.height=80;const g=c.getContext('2d');g.fillStyle='#fff';g.font='32px '+family;g.fillText('Source writing 0123456789',4,48);let ink=0;for(let i=3,d=g.getImageData(0,0,512,80).data;i<d.length;i+=4)if(d[i])ink++;return{family,width:g.measureText('Source writing 0123456789').width,ink};});
      return{factoryMs,frame:capture(1),fonts,credits:root.textContent,button:root.querySelector('button')?.getBoundingClientRect().toJSON(),labels:[...root.querySelectorAll('div')].filter(n=>n.textContent.startsWith('SELECTED GALLERY')).map(n=>n.getBoundingClientRect().toJSON())};
    },{mode,size});
    const name=mode+'/'+size.name;
    verify(initial.fonts.every(x=>x.width>0&&x.ink>0),name+' usable Canvas fonts');verify(initial.frame.error===0,name+' initial GL error');verify(initial.frame.width===size.bw&&initial.frame.height===size.bh,name+' exact managed raster');
    const sourceID={macmoss:'006',vercel:'009',raster:'014',mecha:'015',origin:'016'}[mode];verify(initial.credits.includes('HERO-'+sourceID),name+' visible source credit');
    if(mode==='macmoss'){verify(initial.frame.greenFraction>.02,name+' resolved mint glyphs');verify(Number(initial.frame.frame)===12,name+' source timeline frame');verify(initial.frame.cells.every(n=>n>initial.frame.cellAreaPixels*.005),name+' each of four source glyph ROIs resolves beyond labels/frame');}
    if(mode==='vercel'){verify(initial.frame.darkFraction>.65&&initial.frame.brightFraction<.05,name+' dark silhouette/open field');}
    if(mode==='mecha'){verify(Number(initial.frame.visibleEdges)>200&&initial.frame.inkROIFraction>.001,name+' source mark edges');}
    if(mode==='origin'){verify(initial.frame.darkFraction>.85&&initial.frame.brightFraction>.0002,name+' compact resolved light');}
    if(mode==='raster'){
      verify(initial.frame.redFraction>.02,name+' selected red bars');verify(initial.credits.includes('Lee Perry-Smith')&&initial.credits.includes('CC BY 3.0'),name+' visible adapted geometry attribution');
      verify(initial.labels.every(label=>initial.button.y>=label.bottom),name+' Pause clears upper-right HUD');
    }
    if(!codec){const raw=await page.evaluate(()=>{const text=atob(mechanisms.MAC_VECTOR_BASE64),packed=Uint8Array.from(text,c=>c.charCodeAt(0));return Array.from(mechanisms.unpackVectorBlock(packed,mechanisms.MAC_VECTOR_RAW_BYTES));});codec={rawSHA256:hash(Buffer.from(raw)),bytes:raw.length};verify(codec.rawSHA256==='2b9b78c5b3d1a80c508364b5da8428bae79e4f1f519eb07db636bef50e10835e','Chromium vector decompression byte-for-byte pinned');}
    const motion=await page.evaluate(()=>capture(3));verify(motion.error===0&&motion.checksum!==initial.frame.checksum,name+' actual phase changes pixels');
    const pointer=await page.evaluate(()=>capture(1,.24,-.16));verify(pointer.error===0,name+' pointer GL state');if(mode!=='macmoss')verify(pointer.checksum!==initial.frame.checksum,name+' actual inspection/light response');
    const repeat=await page.evaluate(()=>capture(1));verify(repeat.checksum===initial.frame.checksum,name+' exact fresh-frame replay without feedback');
    const scale=await page.evaluate(()=>{live.renderer.update({...live.settings,artworkScale:.8});const changed=capture(1);live.renderer.update(live.settings);return changed;});verify(scale.checksum!==initial.frame.checksum,name+' Artwork size affects pixels');
    const frozen=await page.evaluate(()=>{live.renderer.update({...live.settings,motionSpan:0});const a=capture(1),b=capture(3);live.renderer.update(live.settings);return{a,b};});verify(frozen.a.checksum===frozen.b.checksum,name+' zero Motion span freezes complete mechanism');
    let surface,restored;
    if(mode==='raster'){
      surface=await page.evaluate(()=>{
        const active=capture(1),a=pixels();live.renderer.update({...live.settings,artworkScale:0});capture(1);const bg=pixels();let difference=0,headGray=0;for(let y=Math.floor(live.canvas.height*.15);y<live.canvas.height*.9;y++)for(let x=Math.floor(live.canvas.width*.22);x<live.canvas.width*.8;x++){const i=(y*live.canvas.width+x)*4;if(Math.abs(a[i]-bg[i])+Math.abs(a[i+1]-bg[i+1])+Math.abs(a[i+2]-bg[i+2])>15){difference++;if(a[i]>80&&Math.abs(a[i]-a[i+1])<4&&Math.abs(a[i]-a[i+2])<4)headGray++;}}
        live.renderer.update({...live.settings,scanPitch:4.8});const raster=capture(1);live.renderer.update(live.settings);return{difference,headGray,rasterChecksum:raster.checksum,activeChecksum:active.checksum};
      });verify(surface.difference>size.bw*size.bh*.025&&surface.headGray>size.bw*size.bh*.015,name+' head ROI resolved independently of red/background artwork');verify(surface.rasterChecksum!==surface.activeChecksum,name+' actual raster material control');
      await page.evaluate(()=>{window.loss=live.canvas.getContext('webgl').getExtension('WEBGL_lose_context');loss.loseContext();});await page.waitForFunction(()=>live.renderer.getSnapshot().lost);await page.evaluate(()=>loss.restoreContext());await page.waitForFunction(()=>!live.renderer.getSnapshot().lost);restored=await page.evaluate(()=>capture(1));verify(restored.error===0&&restored.checksum===initial.frame.checksum,name+' clean actual WebGL restoration and identical surface');
    }
    await page.evaluate(()=>capture(1));await page.screenshot({path:path.join(evidence,mode+'-'+size.name+'.png')});
    const disposed=await page.evaluate(()=>{const before=capture(1).checksum;live.renderer.dispose();live.renderer.renderAt(9);return{before,after:(()=>{const data=pixels();let n=2166136261;for(let i=0;i<data.length;i+=4)for(let k=0;k<3;k++)n=Math.imul(n^data[i+k],16777619);return n>>>0;})()};});
    if(mode!=='raster')verify(disposed.before===disposed.after,name+' disposed 2D renderer cannot paint');
    reports.push({mode,layout:size.name,...initial,motion,pointer,repeat,scale,frozen,surface,restored,disposed});await page.close();
  }
  // Chromium adaptively migrates the default 2D context after repeated CPU
  // readbacks, changing anti-aliasing once. Preserve an explicit default-options
  // probe: stabilized frames must be bit-exact AND equal the fresh readback-
  // appropriate context above. No image-difference tolerance is substituted.
  const defaultContextReplay=[];
  const core=ts.transpileModule(source.slice(source.indexOf('type Mode='),start),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText+'\nwindow.createMechanism=createRenderer;';
  for(const mode of ['macmoss','vercel','mecha','origin']){
    const page=await browser.newPage();await page.setContent('<canvas id="art"></canvas>');await page.addScriptTag({content:core});
    const samples=await page.evaluate(mode=>{
      const canvas=document.getElementById('art'),settings={mode,animate:true,static:false,canvasPreview:false,speed:1,stillTime:1,artworkScale:1,density:1,intensity:1,motionSpan:1,scanPitch:2.5,blur:.65,interactive:true,primary:'#c4e5ca',light:'#ffffff',secondary:'#f3f3f1',accent:'#ff0000',ink:'#11120f',managed:true,renderWidth:960,renderHeight:600,managedBufferWidth:1024,managedBufferHeight:640,pixelBudget:1000000},renderer=createMechanism(canvas,settings,()=>{}),records=[];let first;
      for(let j=0;j<8;j++){renderer.renderAt(1);const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let checksum=2166136261,changedChannels=0,maxDelta=0;for(let i=0;i<pixels.length;i+=4)for(let k=0;k<3;k++){checksum=Math.imul(checksum^pixels[i+k],16777619);if(first){const delta=Math.abs(first[i+k]-pixels[i+k]);if(delta)changedChannels++;maxDelta=Math.max(maxDelta,delta);}}if(!first)first=pixels.slice();records.push({checksum:checksum>>>0,changedChannels,maxDelta});}
      renderer.dispose();return records;
    },mode);
    const expected=reports.find(r=>r.mode===mode&&r.layout==='desktop').frame.checksum;verify(samples.slice(-3).every(s=>s.checksum===expected),mode+' default context stabilizes to exact fresh CPU/readback frame');defaultContextReplay.push({mode,samples,freshReadbackChecksum:expected});await page.close();
  }
  verify(pageErrors.length===0,'No actual browser errors: '+JSON.stringify(pageErrors));
  const result={passed:failures.length===0,sourceSHA256:hash(source),testSHA256:hash(fs.readFileSync(import.meta.filename)),fontconfigFile:process.env.FONTCONFIG_FILE??null,pixelCapturePolicy:'Canvas2D readback context initialized with willReadFrequently=true to avoid adaptive Chromium GPU-to-CPU raster switch; production renderer options are unchanged. Default-options warmup is retained and must match exact fresh CPU pixels.',codec,reports,defaultContextReplay,failures,pageErrors,scope:'Real source paths/fonts, actual software-WebGL shader compilation/framebuffers, two responsive sizes, source-specific artwork ROI, exact replay/control effects and context restoration. Framer saves/art approval and hardware cadence are separate.'};
  fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));assert.deepEqual(failures,[]);
}finally{await browser.close();}
