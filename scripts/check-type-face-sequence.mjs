import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {chromium} from '@playwright/test';

const repo=fileURLToPath(new URL('../',import.meta.url));
const file=path.join(repo,'docs/design-studies/code-components/TypeFaceSequence.tsx');
const source=fs.readFileSync(file,'utf8');
const prior=fs.readFileSync(path.join(repo,'docs/design-studies/code-components/HeroRecreationStudy.tsx'),'utf8');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const slice=(text,a,b)=>text.slice(text.indexOf(a),text.indexOf(b,text.indexOf(a)));
const poolStart='// Embedded identically in the five standalone Framer files.';
assert.equal(slice(source,poolStart,'function useStudySurface'),slice(prior,poolStart,'function useStudySurface'),'Shared coordinator stays byte-exact');
assert.equal(source.match(/const HERO_HEAD_BASE64="([^"]+)"/)[1],prior.match(/const HERO_HEAD_BASE64="([^"]+)"/)[1],'Licensed head geometry stays byte-exact');
assert.ok(source.includes('added.phase=0'),'Preview starts at the beginning, independent of the static poster');
assert.ok(!source.includes('window.addEventListener("wheel"'),'Motion post does not acquire an invented scroll story');

// Use real TypeScript DOM libraries; Framer supplies these two authoring modules.
const priorCheck=fs.readFileSync(path.join(repo,'scripts/check-hero-recreation-study.mjs'),'utf8');
const declarationBlock=slice(priorCheck,'const declarations=new Map([','\ncheck(\'Strict semantic');
const declarations=Function('repo','path',declarationBlock+'\nreturn declarations;')(repo,path);
const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Node10,jsx:ts.JsxEmit.React,baseUrl:repo,paths:{react:['__hero-react.d.ts'],framer:['__hero-framer.d.ts']}};
const host=ts.createCompilerHost(options),read=host.readFile.bind(host),exists=host.fileExists.bind(host);
host.readFile=name=>declarations.get(name)??read(name);
host.fileExists=name=>declarations.has(name)||exists(name);
host.getSourceFile=(name,version)=>{const text=host.readFile(name);return text===undefined?undefined:ts.createSourceFile(name,text,version,true);};
const diagnostics=ts.getPreEmitDiagnostics(ts.createProgram([file],options,host));
assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics.slice(0,8),{getCurrentDirectory:()=>repo,getCanonicalFileName:x=>x,getNewLine:()=> '\n'}));

const bundle=(text,name)=>{
    const code=ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
    return `(function(){const exports={};const require=name=>name==='react'?{}:{RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail'},ControlType:{},addPropertyControls(){}};${code}\nwindow.${name}={createRenderer,getStudyPool${name==='sequence'?',typeFaceSequenceAt':''}};})();`;
};
const newBundle=bundle(source,'sequence'),oldBundle=bundle(prior,'prior');
const evidence=process.env.MONARCHIC_TYPE_FACE_EVIDENCE_DIR??'/tmp/monarchic-type-face-sequence';
fs.mkdirSync(evidence,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],report={sourceSHA256:hash(source),priorSHA256:hash(prior),movieSeconds:9.6,frames:[],mixed:[]};
const settings={mode:'typeface',animate:true,static:false,canvasPreview:false,speed:1,stillTime:2.4,loopDuration:9.6,scale:.95,density:.54,glyphSize:1.15,motionSpan:1,interactive:false,primary:'#e1e1dc',secondary:'#000000',ink:'#000000'};
try{
    const page=await browser.newPage({viewport:{width:720,height:720}});
    page.on('pageerror',error=>errors.push(error.message));
    await page.setContent('<!doctype html><style>html,body{margin:0;background:black}</style>');
    await page.addScriptTag({content:newBundle});
    await page.evaluate(settings=>{
        const canvas=document.createElement('canvas');canvas.style='width:720px;height:720px';document.body.append(canvas);
        const renderer=sequence.createRenderer(canvas,{...settings,managed:true,renderWidth:720,renderHeight:720,managedBufferWidth:768,managedBufferHeight:768,pixelBudget:1000000},()=>{});
        window.live={canvas,renderer};
        window.sample=seconds=>{
            renderer.renderAt(seconds);const gl=canvas.getContext('webgl'),pixels=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
            let count=0,sum=0,checksum=2166136261;
            for(let i=0;i<pixels.length;i+=4){const light=(pixels[i]+pixels[i+1]+pixels[i+2])/3;if(light>16)count++;sum+=light;checksum=Math.imul(checksum^pixels[i],16777619);}
            return {seconds,brightFraction:count/(canvas.width*canvas.height),mean:sum/(canvas.width*canvas.height),checksum:checksum>>>0,stage:canvas.getAttribute('data-hero-sequence-stage'),error:gl.getError()};
        };
    },settings);
    for(const seconds of [0,1.2,2.4,4.8,7.2,8.8,9.2,9.6]){
        const frame=await page.evaluate(seconds=>sample(seconds),seconds);report.frames.push(frame);assert.equal(frame.error,0);
        await page.screenshot({path:path.join(evidence,'sequence-'+seconds+'.png')});
    }
    const at=seconds=>report.frames.find(frame=>frame.seconds===seconds);
    assert.ok(at(2.4).brightFraction>.008&&at(2.4).brightFraction<.35,'A complete writing-covered head resolves');
    assert.ok(at(0).brightFraction<at(2.4).brightFraction*.65,'Entry contains a partial assembly, not the full static head');
    assert.ok(at(9.2).brightFraction<at(2.4).brightFraction*.55,'The head disappears before the loop repeats');
    assert.notEqual(at(2.4).checksum,at(4.8).checksum,'Resolved head actually turns');
    assert.equal(at(0).checksum,at(9.6).checksum,'Loop boundary replays exactly');
    await page.evaluate(()=>{live.loss=live.canvas.getContext('webgl').getExtension('WEBGL_lose_context');live.loss.loseContext();});
    await page.waitForFunction(()=>live.renderer.getSnapshot().lost);
    await page.evaluate(()=>live.loss.restoreContext());
    await page.waitForFunction(()=>!live.renderer.getSnapshot().lost);
    assert.equal((await page.evaluate(()=>sample(2.4))).checksum,at(2.4).checksum,'Context restoration replays the same geometry/material frame');
    await page.evaluate(()=>live.renderer.dispose());await page.close();

    // Sixty real mixed still placements, with either component creating the
    // window coordinator first. Check head pixels as well as resource counts.
    for(const leader of ['prior','sequence']){
        const page=await browser.newPage({viewport:{width:1000,height:800},deviceScaleFactor:1});
        page.on('pageerror',error=>errors.push(error.message));
        await page.setContent('<!doctype html><style>html,body{margin:0;background:#222}.card{position:absolute;width:220px;height:220px}.card canvas{width:100%;height:100%}</style>');
        await page.addScriptTag({content:oldBundle});await page.addScriptTag({content:newBundle});
        await page.evaluate(({settings,leader})=>{
            const pool=window[leader].getStudyPool();window.mixed={pool,entries:[]};
            for(let i=0;i<60;i++){
                const root=document.createElement('div');root.className='card';root.style.left=(i%4)*240+'px';root.style.top=Math.floor(i/4)*240+'px';
                const display=document.createElement('canvas');root.append(display);document.body.append(root);
                const kind=i%2?'sequence':'prior',unit=window[kind],itemSettings={...settings,static:true,animate:false,canvasPreview:false};
                const entry=pool.add({root,display,source:kind+'-test',target:'canvas',settings:itemSettings,factory:unit.createRenderer,notify(){}});
                mixed.entries.push({entry,root,display,kind,itemSettings});
            }
        },{settings,leader});
        await page.waitForFunction(()=>mixed.pool.debug().completedIds.length===60,undefined,{timeout:120000});
        const quality=await page.evaluate(()=>mixed.entries.map(({display,entry,kind})=>{
            const context=display.getContext('2d'),data=context.getImageData(0,0,display.width,display.height).data;let head=0,top=display.height,bottom=0;
            for(let i=0;i<data.length;i+=4)if(data[i]+data[i+1]+data[i+2]>48){head++;const y=Math.floor(i/4/display.width);top=Math.min(top,y);bottom=Math.max(bottom,y);}
            return {id:entry.id,kind,width:display.width,height:display.height,headFraction:head/(display.width*display.height),headHeight:(bottom-top)/display.height};
        }));
        assert.equal(quality.length,60);assert.ok(quality.every(frame=>frame.width>=384&&frame.height>=384&&frame.headFraction>.006&&frame.headFraction<.4&&frame.headHeight>.4),'All sixty placements resolve a complete head at adequate detail');
        for(const offset of [0,720,1440,2160,2880]){
            await page.evaluate(offset=>window.scrollTo(0,offset),offset);
            await page.waitForTimeout(100);
        }
        await page.evaluate(()=>{window.scrollTo(0,0);for(const item of mixed.entries.slice(0,3))mixed.pool.update(item.entry,{...item.itemSettings,static:false,canvasPreview:true,animate:true});});
        await page.waitForFunction(()=>mixed.pool.debug().live.length===1);
        const editor=await page.evaluate(()=>mixed.pool.debug());assert.ok(editor.activeContexts<=2&&editor.peakContexts<=2&&editor.live.filter(entry=>entry.target==='canvas').length<=1);
        await page.evaluate(()=>{for(const item of mixed.entries.slice(0,3))mixed.pool.update(item.entry,{...item.itemSettings,static:true,animate:false});});
        await page.waitForFunction(()=>mixed.pool.debug().live.length===0);
        const after=await page.evaluate(()=>mixed.pool.debug());assert.equal(after.lastPoolError,'');
        assert.ok(after.peakContexts<=2);report.mixed.push({leader,quality,peakContexts:after.peakContexts,editorLive:editor.live.length,completed:after.completedIds.length});
        await page.screenshot({path:path.join(evidence,'mixed-'+leader+'.png')});
        await page.evaluate(()=>{for(const item of mixed.entries)mixed.pool.remove(item.entry);});
        assert.equal((await page.evaluate(()=>mixed.pool.debug())).activeContexts,0);await page.close();
    }
    assert.deepEqual(errors,[]);report.passed=true;
}finally{await browser.close();fs.writeFileSync(path.join(evidence,'results.json'),JSON.stringify({...report,errors},null,2));}
console.log(JSON.stringify({passed:report.passed,frames:report.frames.length,mixedPlacements:report.mixed.reduce((n,item)=>n+item.quality.length,0),evidence,sourceSHA256:report.sourceSHA256},null,2));
