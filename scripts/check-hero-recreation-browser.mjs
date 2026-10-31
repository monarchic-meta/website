import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';

// Actual shader/pixel/lifecycle check in software WebGL. This is not a hardware
// frame-rate benchmark, source-fidelity approval, or a Framer persistence test.
const repo=fileURLToPath(new URL('../',import.meta.url)),ts=createRequire(import.meta.url)('typescript');
const source=fs.readFileSync(path.join(repo,'docs/design-studies/code-components/HeroRecreationStudy.tsx'),'utf8');
const evidence=process.env.MONARCHIC_HERO_EVIDENCE_DIR??'/tmp/monarchic-hero-recreations-browser';fs.mkdirSync(evidence,{recursive:true});
const core=ts.transpileModule(source.slice(source.indexOf('type Mode='),source.indexOf('// Embedded identically in the five standalone Framer files.')),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText+'\nwindow.heroFixture={createRenderer,getHeroHead};';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const reports=[],errors=[];
try{
  const fontPage=await browser.newPage(),fontProbe=await fontPage.evaluate(()=>{
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=80;const context=canvas.getContext('2d');
    return ['serif','sans-serif','monospace'].map(family=>{context.clearRect(0,0,512,80);context.fillStyle='#ffffff';context.font='32px '+family;context.fillText('Surface writing 0123456789',4,48);const pixels=context.getImageData(0,0,512,80).data;let inkPixels=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>0)inkPixels++;return{family,width:context.measureText('Surface writing 0123456789').width,inkPixels}});
  });await fontPage.close();
  const fontEnvironment={fontconfigFile:process.env.FONTCONFIG_FILE??null,fontProbe};fs.writeFileSync(path.join(evidence,'font-environment.json'),JSON.stringify(fontEnvironment,null,2)+'\n');
  assert.ok(fontProbe.every(probe=>probe.width>0&&probe.inkPixels>0),'Browser Canvas text requires usable fonts: '+JSON.stringify(fontEnvironment));
  for(const mode of ['typeface','cantor'])for(const size of [{name:'desktop',width:960,height:600,bw:1024,bh:640},{name:'phone',width:351,height:320,bw:384,bh:350}]){
    const page=await browser.newPage({viewport:{width:size.width,height:size.height},deviceScaleFactor:1});page.on('pageerror',error=>errors.push(error.message));
    await page.setContent('<!doctype html><style>html,body{margin:0;background:#000}canvas{display:block;width:100vw;height:100vh}</style><canvas id="study"></canvas>');
    await page.addScriptTag({content:core});
    const initial=await page.evaluate(({mode,size})=>{
      const canvas=document.getElementById('study'),settings={mode,animate:true,static:false,canvasPreview:false,speed:.65,stillTime:2,scale:1,density:1,glyphSize:1,motionSpan:1,interactive:true,primary:'#ffffff',secondary:'#044ab3',ink:'#000000',managed:true,renderWidth:size.width,renderHeight:size.height,managedBufferWidth:size.bw,managedBufferHeight:size.bh,pixelBudget:1000000};
      const started=performance.now(),renderer=heroFixture.createRenderer(canvas,settings,()=>{}),factoryMs=performance.now()-started;
      window.liveHero={canvas,settings,renderer};
      window.captureHero=(phase,px=0,py=0)=>{
        renderer.setPointer(px,py);const drawStart=performance.now();renderer.renderAt(phase);const drawMs=performance.now()-drawStart,gl=canvas.getContext('webgl'),error=gl.getError(),pixels=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
        const background=renderer.getSnapshot().mode==='cantor'?[4,74,179]:[0,0,0];let count=0,minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,checksum=2166136261;
        for(let i=0;i<pixels.length;i+=4){checksum=Math.imul(checksum^pixels[i],16777619);checksum=Math.imul(checksum^pixels[i+1],16777619);checksum=Math.imul(checksum^pixels[i+2],16777619);if(Math.abs(pixels[i]-background[0])+Math.abs(pixels[i+1]-background[1])+Math.abs(pixels[i+2]-background[2])>30){count++;const x=(i/4)%canvas.width,y=Math.floor(i/4/canvas.width);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}}
        return{phase,error,readError:gl.getError(),width:canvas.width,height:canvas.height,drawMs,foregroundPixels:count,foregroundFraction:count/(canvas.width*canvas.height),checksum:checksum>>>0,bounds:{minX,maxX,minY,maxY}};
      };
      return{factoryMs,frame:captureHero(2)};
    },{mode,size});
    assert.equal(initial.frame.error,0,mode+' shader/draw GL error');assert.equal(initial.frame.readError,0);assert.equal(initial.frame.width,size.bw);assert.equal(initial.frame.height,size.bh);assert.ok(initial.frame.foregroundFraction>.003,mode+' has insufficient resolved artwork');assert.ok(initial.frame.foregroundFraction<.7,mode+' must retain open background');
    const motion=await page.evaluate(()=>captureHero(2.35));assert.equal(motion.error,0);assert.notEqual(motion.checksum,initial.frame.checksum,mode+' phase change must alter actual pixels');
    const pointer=await page.evaluate(()=>captureHero(2,.22,-.12));assert.equal(pointer.error,0);assert.notEqual(pointer.checksum,initial.frame.checksum,mode+' pointer must alter actual pixels');
    let caption;
    if(mode==='typeface'&&size.name==='phone'){
      caption=await page.evaluate(({size})=>{const c=document.createElement('canvas').getContext('2d');c.font='8px "IBM Plex Mono", monospace';return{width:c.measureText('Head stand-in: Lee Perry-Smith · CC BY 3.0 · adapted').width,availableWidth:size.width*.92,top:size.height*.97-8*1.45*2}},{size});
      assert.ok(caption.width<caption.availableWidth,'Phone mesh attribution fits in its single secondary line');
      for(const frame of [initial.frame,motion,pointer])assert.ok(size.height*(1-frame.bounds.minY/frame.height)+3<caption.top,'Default Phone surface clears its two-line credit through motion/inspection');
    }
    const repeat=await page.evaluate(()=>captureHero(2));assert.deepEqual({checksum:repeat.checksum,count:repeat.foregroundPixels},{checksum:initial.frame.checksum,count:initial.frame.foregroundPixels},mode+' frozen replay must produce identical pixels without feedback');
    const crossMode=await page.evaluate(()=>{const other=liveHero.settings.mode==='cantor'?'typeface':'cantor';liveHero.renderer.update({...liveHero.settings,mode:other});const otherFrame=captureHero(2);liveHero.renderer.update(liveHero.settings);return{other:otherFrame,replay:captureHero(2)}});assert.equal(crossMode.other.error,0,'Cross-mode lease update must reset active vertex arrays and samplers');assert.ok(crossMode.other.foregroundFraction>.003);assert.equal(crossMode.replay.error,0);assert.equal(crossMode.replay.checksum,initial.frame.checksum,'Returning to original mode preserves exact artwork');
    await page.screenshot({path:path.join(evidence,mode+'-'+size.name+'.png')});
    await page.evaluate(()=>{window.heroLoss=liveHero.canvas.getContext('webgl').getExtension('WEBGL_lose_context');heroLoss.loseContext()});
    await page.waitForFunction(()=>liveHero.renderer.getSnapshot().lost===true);await page.evaluate(()=>heroLoss.restoreContext());await page.waitForFunction(()=>liveHero.renderer.getSnapshot().lost===false);
    const restored=await page.evaluate(()=>captureHero(2));assert.equal(restored.error,0,mode+' context restoration must make no stale-handle GL calls');assert.equal(restored.readError,0);assert.equal(restored.checksum,initial.frame.checksum,mode+' restored framebuffer must match');
    await page.evaluate(()=>liveHero.renderer.dispose());reports.push({mode,layout:size.name,...initial,motion,pointer,caption,repeat,crossMode,restored});await page.close();
  }
  assert.deepEqual(errors,[]);
  const result={passed:true,sourceSHA256:crypto.createHash('sha256').update(source).digest('hex'),testSHA256:crypto.createHash('sha256').update(fs.readFileSync(import.meta.filename)).digest('hex'),fontEnvironment,reports,errors,scope:'Actual GLSL compilation and software-WebGL framebuffer/motion/restoration. Timing is local software submission, not production GPU cadence; source art and Framer saves remain separate review.'};
  fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}finally{await browser.close()}
