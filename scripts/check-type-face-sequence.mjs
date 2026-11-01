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
const artworkRevision=source.match(/const TYPE_FACE_ARTWORK_REVISION="([^"]+)"/)[1];
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const slice=(text,a,b)=>text.slice(text.indexOf(a),text.indexOf(b,text.indexOf(a)));
const poolStart='// Embedded identically in the five standalone Framer files.';
assert.equal(slice(source,poolStart,'function useStudySurface'),slice(prior,poolStart,'function useStudySurface'),'Shared coordinator stays byte-exact');
assert.equal(slice(source,'const colorCache=new Map',poolStart).trimEnd(),slice(prior,'const colorCache=new Map',poolStart).trimEnd(),'Shared color resolution stays byte-exact (excluding inter-block blank lines)');
const contourBase64=source.match(/const TYPE_FACE_CONTOURS_BASE64="([^"]+)"/)[1];
const contourBytes=Buffer.from(contourBase64,'base64');
assert.equal(hash(contourBytes),'37a9d612e2169b9b873049ae55a3abec5e1cb4cf91c7323516072e4e4d6aa611','Actual museum-derived contour data stays pinned');
assert.equal(contourBytes.length,142238);
assert.ok(source.includes('added.phase=0'),'Preview starts at the beginning, independent of the static poster');
assert.ok(!source.includes('window.addEventListener("wheel"'),'Motion post does not acquire an invented scroll story');

// Use real TypeScript DOM libraries; Framer supplies these two authoring modules.
const priorCheck=fs.readFileSync(path.join(repo,'scripts/check-hero-recreation-study.mjs'),'utf8');
const declarationBlock=slice(priorCheck,'const declarations=new Map([','\ncheck(\'Strict semantic');
const declarations=Function('repo','path',declarationBlock+'\nreturn declarations;')(repo,path);
// React18 accepts key through JSX.IntrinsicAttributes rather than component props.
const reactDeclaration=path.join(repo,'__hero-react.d.ts');
declarations.set(reactDeclaration,declarations.get(reactDeclaration).replace('namespace JSX{','namespace JSX{interface IntrinsicAttributes{key?:string|number|null}'));
const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Node10,jsx:ts.JsxEmit.React,baseUrl:repo,paths:{react:['__hero-react.d.ts'],framer:['__hero-framer.d.ts']}};
const host=ts.createCompilerHost(options),read=host.readFile.bind(host),exists=host.fileExists.bind(host);
host.readFile=name=>declarations.get(name)??read(name);
host.fileExists=name=>declarations.has(name)||exists(name);
host.getSourceFile=(name,version)=>{const text=host.readFile(name);return text===undefined?undefined:ts.createSourceFile(name,text,version,true);};
const diagnostics=ts.getPreEmitDiagnostics(ts.createProgram([file],options,host));
assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics.slice(0,8),{getCurrentDirectory:()=>repo,getCanonicalFileName:x=>x,getNewLine:()=> '\n'}));
const emitted=[];
ts.createProgram([file],{...options,noEmit:false,declaration:true},host).emit(undefined,(name,text)=>{if(/TypeFaceSequence\.(js|d\.ts)$/.test(name))emitted.push({name,bytes:Buffer.byteLength(text)});});
assert.equal(emitted.length,2);assert.ok(emitted.reduce((sum,item)=>sum+item.bytes,0)<1048576,'Self-contained JS plus declarations fits the Framer source limit');
const privateCode=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
const authoringRequire=name=>name==='react'?{}:{RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail'},ControlType:{},addPropertyControls(){}};
const geometry=Function('require','exports',privateCode+'\nreturn {decodeTypeFaceContours,buildTypeFaceStrips,typeFaceSequenceAt,typeFaceAdmissions};')(authoringRequire,{});
const admissions=geometry.typeFaceAdmissions();
assert.equal(admissions.length,2304);
assert.equal(hash(admissions),'84d2512e43b82b4c8aa0948ec057c961765f162af34816ae4de9418f9167d5bc','Coverage stays bound to the two reviewed observed source states');
assert.ok(admissions.every((value,index)=>index%4===3?value===255:index%4===2?value===0:value===0||value===255),'Coarse admission map contains binary coverage only');
const admissionReport={sha256:hash(admissions),bytes:admissions.length,sourceFrames:[36,252],entryCells:0,exitCells:0};
for(let i=0;i<admissions.length;i+=4){admissionReport.entryCells+=admissions[i]?1:0;admissionReport.exitCells+=admissions[i+1]?1:0;}
const rows=geometry.decodeTypeFaceContours(contourBase64);
assert.equal(rows.length,192);assert.equal(rows.reduce((sum,row)=>sum+row.loops.length,0),342);
assert.equal(rows.reduce((sum,row)=>sum+row.loops.reduce((sum,loop)=>sum+loop.points.length/2,0),0),35108);
const malformed=[];
for(const [name,change] of [
    ['truncation',bytes=>bytes.subarray(0,-1)],['trailing bytes',bytes=>Buffer.concat([bytes,Buffer.from([0])])],
    ['reserved header',bytes=>{bytes[6]=1;return bytes;}],['wrong point total',bytes=>{bytes.writeUInt32LE(35109,8);return bytes;}],
    ['oversized loop count',bytes=>{bytes.writeUInt16LE(33,14);return bytes;}],['closed two-point loop',bytes=>{bytes[16]=1;bytes.writeUInt16LE(2,17);return bytes;}],
]){assert.throws(()=>geometry.decodeTypeFaceContours(change(Buffer.from(contourBytes)).toString('base64')),undefined,name);malformed.push(name);}
const stripCases=[];
for(const density of [.5,.54,1,1.5]){
    const strips=geometry.buildTypeFaceStrips(density);assert.ok(strips.length>=1);
    for(const strip of strips){
        const count=strip.positions.length/3;assert.ok(count<=65534);assert.equal(strip.normals.length,count*3);assert.equal(strip.uv.length,count*3);assert.equal(strip.edges.length,count);
        assert.ok([...strip.positions,...strip.normals,...strip.uv].every(Number.isFinite));
        for(let i=0;i<count;i++)assert.ok(Math.abs(Math.hypot(...strip.normals.subarray(i*3,i*3+3))-1)<1e-6);
        for(const index of strip.indices)assert.ok(index<count);
    }
    stripCases.push({density,batches:strips.length,vertices:strips.reduce((sum,strip)=>sum+strip.positions.length/3,0)});
}
assert.equal(stripCases.at(-1).batches,2,'Maximum density uses bounded WebGL1 index batches');
assert.equal(geometry.typeFaceSequenceAt(9).stage,'assembling');
assert.equal(geometry.typeFaceSequenceAt(8.4).stage,'disappearing');
assert.deepEqual(geometry.typeFaceSequenceAt(0),geometry.typeFaceSequenceAt(9.6),'Pure loop state repeats exactly');

const bundle=(text,name)=>{
    const code=ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
    return `(function(){const exports={};const require=name=>name==='react'?{}:{RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail'},ControlType:{},addPropertyControls(){}};${code}\nwindow.${name}={createRenderer,getStudyPool${name==='sequence'?',typeFaceSequenceAt':''}};})();`;
};
const newBundle=bundle(source,'sequence'),oldBundle=bundle(prior,'prior');
const evidence=process.env.MONARCHIC_TYPE_FACE_EVIDENCE_DIR??'/tmp/monarchic-type-face-sequence';
fs.mkdirSync(evidence,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],report={sourceSHA256:hash(source),priorSHA256:hash(prior),movieSeconds:9.6,strictGroups:7,contours:{sha256:hash(contourBytes),bytes:contourBytes.length,rows:rows.length,loops:342,points:35108,malformed,stripCases},admissions:admissionReport,emitted,frames:[],mixed:[]};
const settings={mode:'typeface',artworkRevision,animate:true,static:false,canvasPreview:false,speed:1,stillTime:2.4,loopDuration:9.6,scale:.95,density:.54,glyphSize:1.15,motionSpan:1,interactive:false,primary:'#e1e1dc',secondary:'#000000',ink:'#000000'};
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
            let count=0,sum=0,checksum=2166136261,top=canvas.height,bottom=0;
            for(let i=0;i<pixels.length;i+=4){const light=(pixels[i]+pixels[i+1]+pixels[i+2])/3;if(light>16){count++;const y=canvas.height-1-Math.floor(i/4/canvas.width);top=Math.min(top,y);bottom=Math.max(bottom,y);}sum+=light;checksum=Math.imul(checksum^pixels[i],16777619);}
            return {seconds,brightFraction:count/(canvas.width*canvas.height),mean:sum/(canvas.width*canvas.height),checksum:checksum>>>0,top:top/canvas.height,bottom:bottom/canvas.height,stage:canvas.getAttribute('data-hero-sequence-stage'),error:gl.getError()};
        };
    },settings);
    for(const seconds of [0,1.2,2.4,4.8,7.2,8.4,8.8,9,9.2,9.6]){
        const frame=await page.evaluate(seconds=>sample(seconds),seconds);report.frames.push(frame);assert.equal(frame.error,0);
        await page.screenshot({path:path.join(evidence,'sequence-'+seconds+'.png')});
    }
    const at=seconds=>report.frames.find(frame=>frame.seconds===seconds);
    assert.ok(at(2.4).brightFraction>.008&&at(2.4).brightFraction<.35,'A complete writing-covered head resolves');
    assert.ok(at(0).brightFraction<at(2.4).brightFraction*.65,'Entry contains a partial assembly, not the full static head');
    assert.ok(at(8.4).brightFraction>0&&at(8.4).bottom<.5,'Departure leaves upper-head writing, not the lower neck');
    assert.equal(at(9).brightFraction,0,'Observed source frame270 is completely black');
    assert.ok(at(9.2).brightFraction>0&&at(9.2).brightFraction<at(2.4).brightFraction*.55&&at(9.2).top>.6,'Lower-neck writing re-enters before the loop boundary');
    assert.notEqual(at(2.4).checksum,at(4.8).checksum,'Resolved head actually turns');
    assert.equal(at(0).checksum,at(9.6).checksum,'Loop boundary replays exactly');
    assert.equal((await page.evaluate(()=>sample(2.4))).checksum,at(2.4).checksum,'Reverse sampling replays an exact held frame');
    await page.evaluate(()=>{live.loss=live.canvas.getContext('webgl').getExtension('WEBGL_lose_context');live.loss.loseContext();});
    await page.waitForFunction(()=>live.renderer.getSnapshot().lost);
    await page.evaluate(()=>live.loss.restoreContext());
    await page.waitForFunction(()=>!live.renderer.getSnapshot().lost);
    assert.equal((await page.evaluate(()=>sample(2.4))).checksum,at(2.4).checksum,'Context restoration replays the same geometry/material frame');
    assert.equal((await page.evaluate(()=>sample(8.4))).checksum,at(8.4).checksum,'Context restoration also restores the observed-state admission texture');
    await page.evaluate(()=>live.renderer.dispose());await page.close();

    // Model a same-filename HMR handoff in the retained v2 coordinator. Without
    // a content revision the new factory really receives the old cached still.
    const hot=await browser.newPage({viewport:{width:400,height:400}});
    hot.on('pageerror',error=>errors.push(error.message));
    await hot.setContent('<!doctype html><style>html,body{margin:0;background:black}#root{width:320px;height:320px}canvas{width:100%;height:100%}</style><div id="root"><canvas></canvas></div>');
    await hot.addScriptTag({content:oldBundle});await hot.addScriptTag({content:newBundle});
    await hot.evaluate(settings=>{
        const pool=prior.getStudyPool(),root=document.querySelector('#root'),display=root.querySelector('canvas');
        const legacy={...settings,static:true,animate:false};delete legacy.artworkRevision;
        window.hotState={pool,root,display,legacy,settings:{...settings,static:true,animate:false},draws:0};
        hotState.entry=pool.add({root,display,source:'TypeFaceSequence.tsx',target:'canvas',settings:legacy,factory:prior.createRenderer,notify(){}});
        window.hotPixels=()=>{const data=hotState.display.getContext('2d').getImageData(0,0,hotState.display.width,hotState.display.height).data;let hash=2166136261;for(const x of data)hash=Math.imul(hash^x,16777619);return hash>>>0;};
    },settings);
    await hot.waitForFunction(()=>hotState.pool.debug().completedIds.includes(hotState.entry.id));
    const legacyChecksum=await hot.evaluate(()=>hotPixels());
    await hot.evaluate(()=>{
        const h=hotState;h.pool.remove(h.entry);h.entry=h.pool.add({root:h.root,display:h.display,source:'TypeFaceSequence.tsx',target:'canvas',settings:h.legacy,factory:(...args)=>{h.draws++;return sequence.createRenderer(...args);},notify(){}});
    });
    await hot.waitForFunction(()=>hotState.pool.debug().completedIds.includes(hotState.entry.id));
    assert.equal(await hot.evaluate(()=>hotPixels()),legacyChecksum,'Counterfactual without revision reproduces the obsolete cached still');
    assert.equal(await hot.evaluate(()=>hotState.draws),0,'Counterfactual cache bypasses the new factory entirely');
    await hot.evaluate(()=>{
        const h=hotState;h.pool.remove(h.entry);h.entry=h.pool.add({root:h.root,display:h.display,source:'TypeFaceSequence.tsx',target:'canvas',settings:h.settings,factory:(...args)=>{h.draws++;return sequence.createRenderer(...args);},notify(){}});
    });
    await hot.waitForFunction(()=>hotState.pool.debug().completedIds.includes(hotState.entry.id));
    const handoff=await hot.evaluate(()=>({checksum:hotPixels(),draws:hotState.draws,key:hotState.pool.debug().entries[0].contentKey,debug:hotState.pool.debug()}));
    assert.notEqual(handoff.checksum,legacyChecksum,'Revised source produces actual new Augustus pixels');assert.ok(handoff.draws>0&&handoff.key.includes(artworkRevision));
    await hot.evaluate(()=>{hotState.pool.remove(hotState.entry);});
    await hot.waitForFunction(()=>hotState.pool.debug().activeContexts===0);
    // A fresh canonical render through the same producer must match the handoff.
    await hot.evaluate(()=>{const h=hotState;h.entry=h.pool.add({root:h.root,display:h.display,source:'TypeFaceSequence-fresh-check',target:'canvas',settings:h.settings,factory:sequence.createRenderer,notify(){}});});
    await hot.waitForFunction(()=>hotState.pool.debug().completedIds.includes(hotState.entry.id));
    assert.equal(await hot.evaluate(()=>hotPixels()),handoff.checksum,'HMR handoff is pixel-identical to a fresh new-source still');
    await hot.evaluate(()=>hotState.pool.remove(hotState.entry));assert.equal(await hot.evaluate(()=>hotState.pool.debug().activeContexts),0);
    report.hmrHandoff={artworkRevision,legacyChecksum,checksum:handoff.checksum,newFactoryCalls:handoff.draws,peakContexts:handoff.debug.peakContexts};await hot.close();

    // Real React keeps the outer and private surface proxy identities stable,
    // as Fast Refresh can. Only the actual public wrapper's revision key changes.
    const reactPage=await browser.newPage({viewport:{width:400,height:400}});
    reactPage.on('pageerror',error=>errors.push(error.message));
    await reactPage.setContent('<!doctype html><style>html,body{margin:0;background:black}#app{width:320px;height:320px}</style><div id="app"></div>');
    for(const name of ['react/umd/react.development.js','react-dom/umd/react-dom.development.js'])await reactPage.addScriptTag({content:fs.readFileSync(path.join(repo,'node_modules',name),'utf8')});
    await reactPage.addScriptTag({content:oldBundle});
    await reactPage.evaluate(()=>{window.hmrModules={};window.hmrCalls={legacy:0,current:0};window.TypeFaceSurfaceProxy=props=>hmrActive.surface(props);window.TypeFaceOuter=props=>hmrActive.component(props);});
    for(const name of ['legacy','current']){
        const text=source.replace('return <TypeFaceSurface key=','return <window.TypeFaceSurfaceProxy key=').replace(`const TYPE_FACE_ARTWORK_REVISION="${artworkRevision}"`,`const TYPE_FACE_ARTWORK_REVISION="${name==='legacy'?'prior-content-v0':artworkRevision}"`);
        const code=ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
        await reactPage.addScriptTag({content:`(function(){const exports={};const require=name=>name==='react'?window.React:{RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail',current:()=> 'canvas'},useIsStaticRenderer:()=>false,ControlType:{},addPropertyControls(){}};${code}\nconst factory=${name==='legacy'?'window.prior.createRenderer':'createRenderer'};createRenderer=(...args)=>{window.hmrCalls.${name}++;return factory(...args);};window.hmrModules.${name}={surface:TypeFaceSurface,component:exports.default,pool:getStudyPool};})();`});
    }
    await reactPage.evaluate(()=>{window.hmrActive=hmrModules.legacy;window.reactRoot=ReactDOM.createRoot(document.querySelector('#app'));reactRoot.render(React.createElement(TypeFaceOuter,{animate:false,showCredits:false,showPlayback:false}));window.reactPixels=()=>{const c=document.querySelector('canvas'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=2166136261;for(const x of d)h=Math.imul(h^x,16777619);return h>>>0;};});
    await reactPage.waitForFunction(()=>hmrActive.pool().debug().completedIds.length===1);
    const beforeReact=await reactPage.evaluate(()=>({id:hmrActive.pool().debug().entries[0].id,pixels:reactPixels()}));
    await reactPage.evaluate(()=>{hmrActive=hmrModules.current;reactRoot.render(React.createElement(TypeFaceOuter,{animate:false,showCredits:false,showPlayback:false}));});
    await reactPage.waitForFunction(id=>{const d=hmrActive.pool().debug();return d.entries.length===1&&d.entries[0].id!==id&&d.completedIds.includes(d.entries[0].id);},beforeReact.id);
    const afterReact=await reactPage.evaluate(()=>({pixels:reactPixels(),calls:hmrCalls.current,debug:hmrActive.pool().debug()}));
    assert.notEqual(afterReact.pixels,beforeReact.pixels);assert.equal(afterReact.pixels,handoff.checksum,'Keyed surface remounts the new factory under preserved React identities');assert.ok(afterReact.calls>0&&afterReact.debug.peakContexts<=2);
    await reactPage.evaluate(()=>reactRoot.unmount());assert.equal(await reactPage.evaluate(()=>hmrActive.pool().debug().entryCount),0);assert.equal(await reactPage.evaluate(()=>hmrActive.pool().debug().activeContexts),0);
    report.hmrReact={keyedSurface:true,legacyChecksum:beforeReact.pixels,checksum:afterReact.pixels,newFactoryCalls:afterReact.calls,peakContexts:afterReact.debug.peakContexts};await reactPage.close();

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
