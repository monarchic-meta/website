import {approvedStudyHash} from './study-source-lineage.mjs';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createRoundTwoHost,LEGACY_HOST_SHA256} from './hero-round-two-test-host.mjs';
import{readSourceHeroPackage,installSourceHeroDataModules,sourceHeroPackageMetadata}from'./source-hero-package-test-loader.mjs';
const repo=fileURLToPath(new URL('../',import.meta.url));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
// Keep retained suites and their deterministic DOM/GL/Canvas host immutable.
assert.equal(hash(fs.readFileSync(new URL('./check-hero-mechanism-integration.mjs',import.meta.url))),'4930ef22ec4be9ee961717e947ea2529ed51714f3519c566782c67c778bbd246');
assert.equal(hash(fs.readFileSync(new URL('./hero-mechanism-test-host.mjs',import.meta.url))),'f8b02823c018a4459e38a95e03842ae5e06fd71188e339583e3e229e09e5baa8');
assert.equal(hash(fs.readFileSync(new URL('./check-original-hero-integration.mjs',import.meta.url))),"13d8e5f473b8b46be446824189a305900488ac540082387b54c140791fc465ca",'Retained original mixed runner remains unchanged');
async function run(target){
    const h=createRoundTwoHost(),sourcePackage=readSourceHeroPackage(repo,h.ts),supportModules=installSourceHeroDataModules(sourcePackage,h.context),modules=new Map(),shaders=new Map(),sourceHashes={},coordinators=[];
    const heroFile='HeroRecreationStudy.tsx',mechanismFile='HeroMechanismStudy.tsx',originalFile='OriginalHeroStudy.tsx',roundTwoFile='OriginalHeroRoundTwo.tsx',sourcePageFile='SourceHeroPageStudy.tsx';
    const setAttribute=h.Canvas.prototype.setAttribute;
    h.Canvas.prototype.setAttribute=function(name,value){setAttribute.call(this,name,value);if(name==='data-hero-mechanism'&&String(value).startsWith('original-procedural-')&&this.frame&&this.frame.paintOwner===h.canvasID(this)){this.frame.original={id:this.attributes['data-original-hero-id'],mode:this.attributes['data-original-hero-mode'],phase:Number(this.attributes['data-original-hero-phase']),ditherCells:Number(this.attributes['data-original-hero-dither-cells'])};}if(name==='data-source-hero-page-reference'&&this.frame&&(this.contextKind==='webgl'||this.frame.paintOwner===h.canvasID(this)))this.frame.sourcePage={reference:String(value),mode:this.attributes['data-source-hero-page-mode'],phase:Number(this.attributes['data-source-hero-page-phase'])};};
    for(const file of [...h.files,heroFile,mechanismFile,originalFile,sourcePageFile,roundTwoFile]){
        const source=fs.readFileSync(path.join(repo,'docs/design-studies/code-components',file),'utf8'),end=source.indexOf('/**\n * @framerSupportedLayoutWidth',source.indexOf('function createRenderer'));
        assert.ok(end>0);sourceHashes[file]=hash(source);
        if(file===heroFile)assert.equal(sourceHashes[file],'0912a84fe2f93881c2a86e6ee7baebc925e1f2395eff9c019bd422022995f9a4','Approved hero renderer remains frozen');
        else if(file===mechanismFile)assert.equal(sourceHashes[file],'013866971e271a649b7d719eda0490bafbbabee391ed27f1f9197a61762e0ea7','Reviewed five-mode source remains frozen');
        else if(file===sourcePageFile)assert.equal(sourceHashes[file],'62f84d32bf61c7761e8b38b68c5f1ebb35ca42ad95f4e892b3f6d0628e40d8d2');
        else if(file===originalFile)assert.equal(sourceHashes[file],'c95a74776a0a96834a07d37e1ebdf64c2a013c46384a1206bb864614c5c818ac');
        else if(file===roundTwoFile)assert.equal(sourceHashes[file],'5ab8e702ef0f42a1f8184638bdf5ab111b519bd20a6cae4fca512c0e650a1dd4');
        else assert.equal(sourceHashes[file],approvedStudyHash(h.manifest.components.find(component=>component.source===file).sourceSHA256),'Legacy renderer remains authoritative');
        coordinators.push(source.slice(source.indexOf('const STUDY_POOL_KEY'),end).trimEnd());
        const js=h.ts.transpileModule(source.slice(0,end),{compilerOptions:{target:h.ts.ScriptTarget.ES2020,module:file===sourcePageFile?h.ts.ModuleKind.CommonJS:h.ts.ModuleKind.ES2022}}).outputText.replace(/^import .* from "(?:react|framer)";?\r?\n/gm,'').replace(/^export \{\};?\r?\n/gm,'');
        const names=[originalFile,roundTwoFile,sourcePageFile].includes(file)?'STUDIES':file===mechanismFile?'RASTER_VERTEX,RASTER_FRAGMENT,RASTER_BG_VERTEX,RASTER_BG_FRAGMENT':file===heroFile?'HEAD_VERTEX,HEAD_FRAGMENT,FIELD_VERTEX,FIELD_FRAGMENT,POINT_VERTEX,POINT_FRAGMENT':'VERTEX,FRAGMENT'+(source.includes('const CANOPY_VERTEX')?',CANOPY_VERTEX,CANOPY_FRAGMENT':'');
        const api=vm.runInContext(file===sourcePageFile?'(function(require,exports){'+js+';return{createRenderer,getStudyPool,'+names+'};})(__sourceHeroRequire,{})':'(function(){'+js+';return{createRenderer,getStudyPool,'+names+'};})()',h.context);if(file===roundTwoFile){const actualFactory=api.createRenderer;api.createRenderer=(canvas,settings,...args)=>{if(settings.mode==='researchfilm')h.markTonal(canvas);return actualFactory(canvas,settings,...args)}}modules.set(file,api);
        shaders.set(file,new Set(file===sourcePageFile?[...shaders.get(heroFile),...shaders.get(mechanismFile)]:[originalFile,roundTwoFile].includes(file)?[]:file===mechanismFile?[hash(api.RASTER_VERTEX+'\n'+api.RASTER_FRAGMENT)]:file===heroFile?[hash(api.HEAD_VERTEX+'\n'+api.HEAD_FRAGMENT),hash(api.POINT_VERTEX+'\n'+api.POINT_FRAGMENT)]:[hash(api.VERTEX+'\n'+api.FRAGMENT),...(api.CANOPY_VERTEX?[hash(api.CANOPY_VERTEX+'\n'+api.CANOPY_FRAGMENT)]:[])]));
    }
    for(const c of coordinators)assert.equal(c,coordinators[0],'All ten modules use the exact shared v2 coordinator');
    const pool=modules.get(heroFile).getStudyPool();for(const api of modules.values())assert.equal(api.getStudyPool(),pool,'All ten modules share the same per-window pool');
    const heroDefaults={animate:false,static:false,canvasPreview:target==='canvas',speed:.65,stillTime:2,scale:1,density:1,glyphSize:1,motionSpan:1,interactive:true,primary:'#ffffff',secondary:'#044ab3',ink:'#000000'};
    const heroes=['typeface','cantor'].map((mode,index)=>({id:index?'HERO-007':'HERO-001',mode,componentSource:heroFile,studyProps:heroDefaults}));
    const mechanismDefaults={animate:false,static:false,canvasPreview:target==='canvas',speed:1,stillTime:1,artworkScale:1,density:1,intensity:1,motionSpan:1,scanPitch:2.5,blur:.65,interactive:true,primary:'#c4e5ca',light:'#ffffff',secondary:'#f3f3f1',accent:'#ff0000',ink:'#11120f'};
    const mechanisms=['macmoss','vercel','raster','mecha','origin'].map((mode,i)=>({id:['HERO-006','HERO-009','HERO-014','HERO-015','HERO-016'][i],mode,componentSource:mechanismFile,studyProps:mechanismDefaults}));
    const originalsAPI=modules.get(originalFile),originalModes=['counterfield','atlas','axial','fold','palimpsest','assemblage','counterfold','indexorbit','researchfield'];
    assert.deepEqual(Object.keys(originalsAPI.STUDIES),originalModes,'All nine original modes belong to the actual renderer');
    const originalDefaults={animate:false,static:false,canvasPreview:target==='canvas',speed:1,stillTime:3,artworkScale:1,detail:1,motionSpan:1,ditherPitch:3.5,interactive:true};
    const originals=originalModes.map(mode=>{const s=originalsAPI.STUDIES[mode],[background,primary,ink,accent]=s.palette;return{id:s.key,mode,componentSource:originalFile,studyProps:{...originalDefaults,background,primary,ink,accent,secondary:accent}}});
    const roundTwoAPI=modules.get(roundTwoFile),roundTwoModes=Object.keys(roundTwoAPI.STUDIES),roundTwos=roundTwoModes.map(mode=>{const def=roundTwoAPI.STUDIES[mode],[background,primary,ink,accent]=def.palette;return{id:def.key,mode,componentSource:roundTwoFile,studyProps:{...originalDefaults,background,primary,ink,accent,secondary:accent,ditherPitch:1.8}}});
    const sourcePageAPI=modules.get(sourcePageFile),sourcePageModes=Object.keys(sourcePageAPI.STUDIES),sourcePages=sourcePageModes.map(mode=>({id:'SOURCE-PAGE-'+mode,mode,componentSource:sourcePageFile,studyProps:{...mechanismDefaults,atlasColumns:4,showLabels:true,glyphSize:1,primary:['typeface','cantor'].includes(mode)?'#ffffff':mechanismDefaults.primary,secondary:mode==='cantor'?'#044ab3':mechanismDefaults.secondary}}));
    const studies=[...h.studies,...heroes,...mechanisms,...originals,...roundTwos,...sourcePages],entries=[],errors=[],checks=[];
    const roles={main:{width:2180,height:1362,x:0,columns:3,pitchX:2400,pitchY:1700},reference:{width:620,height:360,x:7500,columns:6,pitchX:700,pitchY:500},lab:{width:1020,height:638,x:12400,columns:1,pitchX:1200,pitchY:930}};
    for(const[index,study]of studies.entries())for(const[role,baseShape]of Object.entries(roles)){
        // Actual original Design/Desktop art uses960x600; inheritedPhone art351x440.
        const shape=study.componentSource===roundTwoFile?{...baseShape,...(role==='reference'?{width:390,height:900}:{width:1440,height:1000})}:study.componentSource===sourcePageFile?{...baseShape,...(role==='reference'?{width:390,height:780}:{width:1440,height:1000})}:study.componentSource===originalFile?{...baseShape,...(role==='reference'?{width:351,height:440}:{width:960,height:600})}:baseShape;
        const root=new h.Root(entries.length),display=new h.Canvas();root.clientWidth=display.clientWidth=shape.width;root.clientHeight=display.clientHeight=shape.height;display.isConnected=true;display.root=root;
        const settings={primary:'#efc8c8',secondary:'#d6b442',ink:'#424855',...study.studyProps,mode:study.mode,static:false,canvasPreview:target==='canvas',animate:false};
        const entry=pool.add({root,display,source:study.componentSource,target,settings,factory:modules.get(study.componentSource).createRenderer,notify:(status,error)=>{if(error)errors.push({id:study.id+'-'+role,error})}});
        entry.fixture={id:study.id+'-'+role,role,hero:study.componentSource===heroFile,mechanism:study.componentSource===mechanismFile,original:study.componentSource===originalFile,roundTwo:study.componentSource===roundTwoFile,sourcePage:study.componentSource===sourcePageFile,...shape,worldX:shape.x+index%shape.columns*shape.pitchX,worldY:Math.floor(index/shape.columns)*shape.pitchY};entries.push(entry);
    }
    function project(zoom,panX=0,panY=0){for(const e of entries){const f=e.fixture;e.root.setRect(20+(f.worldX-panX)*zoom,30+(f.worldY-panY)*zoom,f.width*zoom,f.height*zoom)}h.window.dispatchEvent({type:'resize'})}
    const visible=e=>{const r=e.root.rect;return !h.document.hidden&&r.right>0&&r.bottom>0&&r.left<h.window.innerWidth&&r.top<h.window.innerHeight};
    function demand(e,budget=2000000){const r=e.root.rect,long=Math.max(r.width,r.height),tier=Math.max(384,Math.ceil(long*Math.min(2,h.window.devicePixelRatio)/128)*128),aspect=e.root.clientWidth/e.root.clientHeight,w=aspect>=1?tier:tier*aspect,hh=aspect>=1?tier/aspect:tier,fit=Math.min(1,Math.sqrt(budget/(w*hh)));return[Math.max(1,Math.floor(w*fit)),Math.max(1,Math.floor(hh*fit))]}
    function adequate(e,budget=2000000){const[w,hh]=demand(e,budget),f=e.display.frame;return Boolean(f&&f.effectiveW>=w-2&&f.effectiveH>=hh-2&&f.effectiveW<=e.display.width&&f.effectiveH<=e.display.height)}
    function quality(e,budget=2000000){
        assert.ok(adequate(e,budget),'Adequate source pixels, not destination upsampling: '+e.fixture.id);const f=e.display.frame;
        if(e.fixture.roundTwo){assert.equal(f.kind,'2d');assert.equal(f.mode,e.settings.mode);assert.equal(f.phase,e.framePhase);assert.equal(f.mechanism,'original-round-two-'+e.settings.mode);assert.match(f.paintHash,/^[a-f0-9]{64}$/);const minima={pathfield:150,concordance:100,axialpassage:20,letterengine:200,reportcuts:50,researchfilm:30,semanticaperture:150,formatpress:50,fieldtransmission:30};assert.ok(f.paintOps>=minima[e.settings.mode]*Math.min(1,e.settings.detail),'Actual full-opening geometry/content '+e.fixture.id);if(e.settings.mode==='researchfilm')assert.match(f.tonalHash,/^[a-f0-9]{64}$/,'Actual quantizer consumed and returned a complete synthetic readback');return;}
        if(e.fixture.sourcePage){assert.equal(f.sourcePage?.mode,e.settings.mode);assert.equal(f.sourcePage?.phase,e.framePhase);assert.equal(f.sourcePage.reference,sourcePageAPI.STUDIES[e.settings.mode].key);if(['typeface','cantor','raster'].includes(e.settings.mode)){assert.ok(shaders.get(sourcePageFile).has(f.shader));assert.ok(f.passes.length>=1);if(e.settings.mode==='typeface'||e.settings.mode==='raster')assert.equal(f.passes.at(-1).count,53052);else assert.ok(f.passes[0].count>20000)}else{assert.equal(f.kind,'2d');assert.ok(f.paintOps>=4);if(e.settings.mode==='macmoss')assert.equal(f.pathFills,40,'All20 source cells with2 tonal contours');if(e.settings.mode==='mecha')assert.ok(f.paintOps>1000);if(e.settings.mode==='origin')assert.equal(f.gradients,3)}return;}
        if(e.fixture.original){
            assert.equal(f.kind,'2d');assert.match(f.paintHash,/^[0-9a-f]{64}$/);
            assert.equal(f.mode,e.settings.mode);assert.equal(f.phase,e.framePhase);assert.equal(f.mechanism,'original-procedural-'+e.settings.mode);
            assert.equal(f.original?.id,originalsAPI.STUDIES[e.settings.mode].key);assert.equal(f.original?.mode,e.settings.mode);assert.equal(f.original?.phase,e.framePhase);
            const minimum={counterfield:50,atlas:30,axial:25,fold:100,palimpsest:60,assemblage:40,counterfold:145,indexorbit:45,researchfield:180}[e.settings.mode];
            assert.ok(f.paintOps>=Math.floor(minimum*Math.min(1,e.settings.detail)),'Substantial mode-specific path construction, not a nonempty bitmap: '+e.fixture.id);
            assert.ok(f.pathFills>=1,'Actual ordered-tone Path2D material submitted');
            if(e.settings.mode==='axial')assert.equal(f.pathFills,Math.round(22*e.settings.detail)+3,'Structure-controlled owned-mark depth layers, front face and tonal material');
            assert.ok(Number.isFinite(f.original.ditherCells)&&f.original.ditherCells>=64,'Ordered-tone geometry actually traversed');
            return;
        }
        if(e.fixture.mechanism&&e.settings.mode!=='raster'){
            assert.equal(f.kind,'2d');assert.match(f.paintHash,/^[0-9a-f]{64}$/);assert.ok(f.paintOps>=4,'Actual path/gradient paint submitted');assert.equal(f.mode,e.settings.mode);assert.equal(f.phase,e.framePhase);
            if(e.settings.mode==='macmoss')assert.equal(f.pathFills,8,'Four source glyph cells and two tonal contours');
            if(e.settings.mode==='origin')assert.equal(f.gradients,3,'Three actual procedural light gradients');
            if(e.settings.mode==='vercel')assert.ok(f.gradients>=1,'Halo atmosphere gradient');
            if(e.settings.mode==='mecha')assert.ok(f.paintOps>1000,'Actual source mesh faces/edges, not generic placeholder');
            return;
        }
        assert.ok(shaders.get(e.source).has(f.shader),'Correct actual renderer/shader: '+e.fixture.id);
        if(e.fixture.mechanism){assert.equal(f.passes.at(-1).count,53052);assert.equal(f.passes.length,2);assert.ok(f.uniforms.u_rotation.every(Number.isFinite));assert.equal(f.uniforms.u_density,e.settings.density);assert.equal(f.uniforms.u_pitch,e.settings.scanPitch);return;}
        if(e.fixture.hero){if(e.settings.mode==='typeface'){assert.equal(f.passes.at(-1).count,53052);assert.ok(f.uniforms.u_rotation?.every(Number.isFinite));assert.equal(f.uniforms.u_density,e.settings.density);assert.equal(f.uniforms.u_glyphSize,e.settings.glyphSize)}else{assert.equal(f.passes.length,2);assert.equal(f.passes[0].count,Math.max(48,Math.min(200,Math.round((e.logicalWidth<500?110:130)*e.settings.density)))*56*6);assert.equal(f.passes[1].count,Math.max(48,Math.min(200,Math.round((e.logicalWidth<500?110:130)*e.settings.density))));assert.equal(f.phase,e.framePhase)}}
    }
    function caps(){const d=pool.debug();assert.ok(h.active.size<=2&&h.stats().peakContexts<=2,'Initialization and leases share at most two contexts');assert.ok(d.cachePixels<=8000000&&d.cacheSize<=64,'Shared cache remains bounded');assert.ok(h.stats().peakPixels<=3000000&&d.peakPixels<=3000000,'GL and mixed render surfaces remain bounded');assert.ok(d.peakContexts<=2,'Canvas2D and GL initialization share admission slots');assert.ok(d.live.length<=(target==='canvas'?1:2),'Target live admission is bounded on every tick');assert.equal(h.recording.kindConflicts,0,'Actual factories never reuse a canvas across context kinds');assert.equal(h.recording.invalidAlpha,0,'Submitted Canvas alpha values remain valid')}
    async function tick(count=1){await h.tick(count);caps()}
    async function settle(label,max=450,budget=2000000){for(let i=0;i<max;i++){await tick();if(entries.filter(visible).every(e=>adequate(e,budget))){entries.filter(visible).forEach(e=>quality(e,budget));return}}assert.fail(label+' quality did not settle: '+JSON.stringify({errors:errors.slice(-12),debug:pool.debug(),missing:entries.filter(e=>visible(e)&&!adequate(e)).map(e=>({id:e.fixture.id,desired:[e.desiredWidth,e.desiredHeight],retry:e.retryAt}))}))}
    function freshMatch(e){
        const phase=e.framePhase,pointer=[...e.framePointer],candidate=structuredClone(e.display.frame);let fresh;
        pool.runStatic(()=>{const surface=new h.Canvas();surface.width=1;surface.height=1;const renderer=modules.get(e.source).createRenderer(surface,{...e.settings,managed:true,static:true,renderWidth:e.logicalWidth,renderHeight:e.logicalHeight,managedBufferWidth:e.frameWidth,managedBufferHeight:e.frameHeight,pixelBudget:2000000},()=>{},phase);try{renderer.setPointer(...pointer);renderer.renderAt(phase);fresh=structuredClone(surface.frame);return surface.width*surface.height}finally{renderer.dispose()}});
        assert.ok(candidate&&fresh);const select=f=>f.kind==='2d'?{kind:f.kind,paintHash:f.paintHash,paintOps:f.paintOps,pathFills:f.pathFills,gradients:f.gradients,mode:f.mode,phase:f.phase,mechanism:f.mechanism,original:f.original,tonalHash:f.tonalHash,sourcePage:f.sourcePage}:{shader:f.shader,passes:f.passes,uniforms:f.uniforms,sourcePage:f.sourcePage};
        assert.deepEqual(select(candidate),select(fresh),'Cached output matches fresh same-phase/pointer/control/path/material state: '+e.fixture.id);caps();
    }
    async function responsiveDisplayRegression(){
        const e=entries.find(entry=>entry.fixture.roundTwo&&entry.settings.mode==='axialpassage'&&entry.fixture.role==='main'),saved={...e.settings},priorWindow=[h.window.innerWidth,h.window.innerHeight,h.window.devicePixelRatio];
        assert.ok(e);for(const other of entries)other.root.setRect(-10000,-10000,100,60);
        h.window.innerWidth=1600;h.window.innerHeight=1100;h.window.devicePixelRatio=1;
        const layout=(width,height,screenWidth=width)=>{e.root.clientWidth=e.display.clientWidth=width;e.root.clientHeight=e.display.clientHeight=height;e.root.setRect(20,30,screenWidth,screenWidth*height/width);h.window.dispatchEvent({type:'resize'})};
        layout(1440,1000);pool.update(e,{...saved,animate:true,static:false,canvasPreview:true});await tick(25);
        assert.deepEqual([e.frameWidth,e.frameHeight],[1200,833],'Desktop begins with its actual1M live raster');
        layout(390,900);await tick(25);quality(e,1000000);freshMatch(e);
        assert.deepEqual([e.frameWidth,e.frameHeight],[443,1024]);assert.ok(e.display.width>=443&&e.display.height>=1024,'A larger-area landscape display cannot undersample Phone vertically');
        pool.update(e,{...saved,animate:false});const paused=e.framePhase;layout(1440,1000,1100);await tick(35);quality(e);assert.deepEqual([e.frameWidth,e.frameHeight],[1152,800]);
        layout(390,900);await tick(35);quality(e);freshMatch(e);assert.equal(e.framePhase,paused,'Paused responsive recomposition retains actual phase');assert.ok(e.display.width>=443&&e.display.height>=1024);
        pool.update(e,{...saved,animate:false,stillTime:8});h.window.devicePixelRatio=1.5;layout(390,900);await tick(35);quality(e);assert.deepEqual([e.frameWidth,e.frameHeight],[610,1408]);
        h.window.devicePixelRatio=1;layout(1440,1000);await tick(35);pool.update(e,{...saved,animate:true,static:false,canvasPreview:true,stillTime:8});layout(390,900);for(let step=0;step<12&&(e.frameWidth!==443||e.frameHeight!==1024);step++)await tick(1);assert.deepEqual([e.frameWidth,e.frameHeight],[443,1024]);assert.equal(e.framePhase,8,'First live frame starts at the selected canonical phase');assert.ok(e.display.width>=1536&&e.display.height>=1066,'Adequate larger Desktop backing may still be retained');const jobs=pool.debug().completedStillJobs;
        pool.update(e,{...saved,animate:false,stillTime:8});h.window.devicePixelRatio=1.5;h.window.dispatchEvent({type:'resize'});await tick(15);quality(e);freshMatch(e);assert.equal(e.framePhase,8);assert.deepEqual([e.frameWidth,e.frameHeight],[610,1408]);assert.equal(pool.debug().completedStillJobs,jobs,'The larger cached Phone frame restores without warm rendering');assert.ok(e.display.width>=610&&e.display.height>=1408,'Cached Phone copy also retains adequate display axes');
        pool.update(e,saved);e.root.clientWidth=e.display.clientWidth=e.fixture.width;e.root.clientHeight=e.display.clientHeight=e.fixture.height;[h.window.innerWidth,h.window.innerHeight,h.window.devicePixelRatio]=priorWindow;project(.05);await settle('responsive regression restored');
        record('Same entry Desktop-to-Phone live, paused and cached copies retain both demanded display axes, phase, geometry and shared budgets');
    }
    const handledInjectedFailures=[];
    const record=name=>{checks.push(name);console.error(target+" / "+name)};
    async function exerciseOriginals(){
        const originalEntries=entries.filter(e=>e.fixture.original),peers=originalEntries.filter(e=>e.fixture.role==='reference');
        assert.equal(peers.length,9);assert.equal(new Set(peers.map(e=>e.settings.mode)).size,9);
        const hideAll=()=>{for(const e of entries)e.root.setRect(-10000,-10000,100,60);};
        const showPeers=()=>{hideAll();h.window.innerWidth=1280;h.window.innerHeight=1050;for(const[i,e]of peers.entries())e.root.setRect(20+i%3*390,30+Math.floor(i/3)*330,240,240*440/351);h.window.dispatchEvent({type:'resize'});};
        const settleState=async(label,e,phase)=>{for(let i=0;i<150;i++){await tick();if(adequate(e)&&!e.needsStill&&e.frameKey===e.contentKey&&Math.abs(e.framePhase-phase)<.000001){quality(e);return;}}assert.fail(label+JSON.stringify({id:e.fixture.id,phase:e.framePhase,expected:phase,retryAt:e.retryAt,needsStill:e.needsStill}));};

        for(const e of peers){
            hideAll();e.root.setRect(20,30,351,440);h.window.dispatchEvent({type:'resize'});await settle('original controls '+e.fixture.id);
            const original={...e.settings},oldPaint=e.display.frame.paintHash;
            pool.update(e,{...original,artworkScale:.85,detail:1.2,motionSpan:.65,ditherPitch:2.7,primary:'#e0e5d3',ink:'#111915',accent:'#f17b43',secondary:'#f17b43',stillTime:5.25});
            await tick(8);await settle('original controls updated '+e.fixture.id);quality(e);freshMatch(e);
            assert.equal(e.framePhase,5.25);assert.notEqual(e.display.frame.paintHash,oldPaint,'Geometry/material/phase controls invalidate the original cached paint');
            pool.update(e,original);await tick(8);await settle('original controls restored '+e.fixture.id);quality(e);freshMatch(e);
        }
        record('All nine originals invalidate and restore actual geometry, tonal pitch, palette, artwork size and phase at adequate source resolution');

        const switched=peers[0],saved={...switched.settings};hideAll();switched.root.setRect(20,30,351,440);h.window.dispatchEvent({type:'resize'});
        const modePaints=[];
        for(const mode of originalModes){
            const[background,primary,ink,accent]=originalsAPI.STUDIES[mode].palette;
            pool.update(switched,{...saved,mode,background,primary,ink,accent,secondary:accent});await tick(8);await settle('original mode dispatch '+mode);quality(switched);freshMatch(switched);modePaints.push(switched.display.frame.paintHash);
        }
        assert.equal(new Set(modePaints).size,9,'Mode dispatch cannot retain one generic or stale composition');pool.update(switched,saved);await tick(8);await settle('original mode restore');
        record('One actual instance changes through all nine Canvas2D mechanisms with distinct fresh paint and no stale cross-mode material');

        showPeers();await settle('all original live peers');for(const e of peers)pool.update(e,{...e.settings,static:false,animate:true,canvasPreview:true});await tick(30);
        assert.equal(pool.debug().live.length,target==='canvas'?1:2);
        let previous;
        for(const e of peers){
            previous?.root.dispatchEvent({type:'pointerleave'});e.root.dispatchEvent({type:'pointerenter'});e.root.dispatchEvent({type:'pointermove',clientX:e.root.rect.left+e.root.rect.width*.77,clientY:e.root.rect.top+e.root.rect.height*.22});
            await tick(12);assert.ok(e.lease,'Every hovered original receives an actual shared admission slot');assert.equal(e.lease.canvas.contextKind,'2d');
            const phase=e.framePhase;await tick(8);assert.ok(e.framePhase>phase,'Original live phase advances '+e.settings.mode);quality(e,1000000);freshMatch(e);previous=e;
        }
        previous?.root.dispatchEvent({type:'pointerleave'});for(const e of peers)pool.update(e,{...e.settings,animate:false});await tick(5);
        const paused=peers.map(e=>({id:e.id,phase:e.framePhase,pointer:[...e.framePointer]}));await tick(15);for(const e of peers){const p=paused.find(p=>p.id===e.id);assert.equal(e.framePhase,p.phase);assert.deepEqual([...e.framePointer],p.pointer);quality(e);freshMatch(e);}
        assert.equal(pool.debug().live.length,0);
        record('Each of nine originals advances with pointer input, respects one-editor/two-Preview admission, then pauses at the exact retained phase and pose');

        for(const e of peers)pool.update(e,{...e.settings,animate:true});await tick(15);
        for(const e of peers)e.root.setRect(-10000,-10000,240,240*440/351);h.window.dispatchEvent({type:'resize'});await tick(6);assert.equal(pool.debug().live.length,0);assert.equal(pool.debug().activeContexts,0);
        showPeers();await tick(20);assert.equal(pool.debug().live.length,target==='canvas'?1:2);
        h.document.hidden=true;h.document.dispatchEvent({type:'visibilitychange'});await tick(5);assert.equal(pool.debug().live.length,0);assert.equal(pool.debug().activeContexts,0);h.document.hidden=false;h.document.dispatchEvent({type:'visibilitychange'});await tick(20);
        if(target==='canvas'){for(const e of peers)pool.update(e,{...e.settings,canvasPreview:false});await tick(10);assert.equal(pool.debug().live.length,0);for(const e of peers)pool.update(e,{...e.settings,canvasPreview:true});await tick(15);}
        h.motion.matches=true;h.motion.dispatchEvent({type:'change'});await tick(25);assert.equal(pool.debug().live.length,0);for(const e of peers){assert.equal(e.framePhase,e.settings.stillTime);quality(e);freshMatch(e);}h.motion.matches=false;h.motion.dispatchEvent({type:'change'});for(const e of peers)pool.update(e,{...e.settings,animate:false});await tick(5);
        record('All nine originals release offscreen/hidden leases, require Canvas opt-in and replay their canonical selected still under reduced motion');

        let staticWorkers=0,peakStaticWorkers=0;
        for(const e of peers){
            pool.runStatic(()=>{
                staticWorkers++;peakStaticWorkers=Math.max(peakStaticWorkers,staticWorkers);assert.equal(pool.debug().activeContexts,1,'One-shot work holds the shared admission reservation');
                const surface=new h.Canvas(),renderer=originalsAPI.createRenderer(surface,{...e.settings,managed:true,static:true,animate:true,renderWidth:960,renderHeight:600,managedBufferWidth:1788,managedBufferHeight:1118,pixelBudget:2000000},()=>{},e.settings.stillTime);
                try{renderer.setPointer(0,0);renderer.renderAt(e.settings.stillTime);const paint=surface.frame.paintHash;assert.ok(surface.width*surface.height<=2000000);assert.equal(surface.frame.original.phase,e.settings.stillTime);renderer.renderAt(e.settings.stillTime);assert.equal(surface.frame.paintHash,paint,'Frozen same-state original one-shot rendering is deterministic');return surface.width*surface.height;}finally{renderer.dispose();staticWorkers--;}
            });assert.equal(staticWorkers,0);
        }
        assert.equal(peakStaticWorkers,1);assert.equal(pool.debug().activeContexts,0);
        for(const e of originalEntries){pool.update(e,{...e.settings,static:true,animate:true});e.root.setRect(20,30,400,400*e.root.clientHeight/e.root.clientWidth);}h.window.dispatchEvent({type:'resize'});await tick(90);await settle('all27 original static placements');
        for(const e of originalEntries){assert.equal(e.framePhase,e.settings.stillTime);quality(e);freshMatch(e);}assert.equal(pool.debug().live.length,0);
        record('All27 original export/static replicas remain frozen; nine2M-pixel one-shots execute serially inside the shared reservation');

        assert.deepEqual(errors,[],'No unexpected errors precede deliberate isolation probes');
        const victim=peers[0],unaffected=peers[1],unaffectedPaint=unaffected.display.frame.paintHash;
        victim.display.copyFailures=1;pool.update(victim,{...victim.settings,stillTime:9.25});
        for(let i=0;i<20&&victim.display.copyFailures>0;i++)await tick();assert.equal(victim.display.copyFailures,0,'Actual display copy failure was exercised');assert.ok(h.timers.size>0,'One failed card keeps the shared queue alive');await settleState('original cached-copy recovery',victim,9.25);quality(victim);freshMatch(victim);assert.equal(unaffected.display.frame.paintHash,unaffectedPaint);
        // Injection errors originate in this Node realm, while the pinned pool
        // runs in vm: its public catch path deliberately String(error)s them.
        const copyErrors=errors.slice();assert.ok(copyErrors.length>0&&copyErrors.every(e=>e.id===victim.fixture.id&&e.error==='Error: injected display copy failure'),JSON.stringify(copyErrors));handledInjectedFailures.push(...copyErrors);
        const factory=victim.factory;let failPaint=true,disposed=0;
        victim.factory=(...args)=>{const renderer=factory(...args);return{...renderer,renderAt(t){if(failPaint){failPaint=false;throw Error('injected original paint failure');}renderer.renderAt(t);},dispose(){disposed++;renderer.dispose();}};};
        pool.update(victim,{...victim.settings,stillTime:10.5});for(let i=0;i<120&&failPaint;i++)await tick();assert.equal(failPaint,false,'Actual acquired original renderer paint failure was exercised');assert.ok(h.timers.size>0);await settleState('original renderer failure recovery',victim,10.5);quality(victim);freshMatch(victim);assert.ok(disposed>0,'Faulted original renderers are disposed');victim.factory=factory;
        const drawErrors=errors.slice(copyErrors.length);assert.ok(drawErrors.length>0&&drawErrors.every(e=>e.id===victim.fixture.id&&e.error==='Error: injected original paint failure'),JSON.stringify(drawErrors));handledInjectedFailures.push(...drawErrors);assert.equal(pool.debug().entryCount,156);assert.equal(pool.debug().lastPoolError,'');
        record('Injected original cached-copy and acquired-renderer paint errors isolate one card, dispose failed work and preserve all156 registry entries and the shared clock');
    }
    async function exerciseAdded(){
        const added=entries.filter(e=>e.fixture.roundTwo||e.fixture.sourcePage),peers=added.filter(e=>e.fixture.role==='reference');assert.equal(peers.length,16);
        const hide=()=>{for(const e of entries)e.root.setRect(-10000,-10000,100,60)},refresh=()=>h.window.dispatchEvent({type:'resize'});
        for(const e of peers){hide();e.root.setRect(20,30,390,e.root.clientHeight);refresh();await settle('added initial '+e.fixture.id);freshMatch(e);const settings={...e.settings};pool.update(e,{...settings,artworkScale:.83,motionSpan:.6,stillTime:5.5});await tick(8);await settle('added controls '+e.fixture.id);assert.equal(e.framePhase,5.5);quality(e);freshMatch(e);pool.update(e,settings);await tick(8);await settle('added controls restored '+e.fixture.id);freshMatch(e)}
        record('All16 additive mechanisms invalidate and restore nondefault artwork size, motion span and selected still at adequate source resolution');
        for(const [file,modes]of[[roundTwoFile,roundTwoModes],[sourcePageFile,sourcePageModes]]){const e=peers.find(e=>e.source===file),saved={...e.settings};hide();e.root.setRect(20,30,390,780);refresh();pool.update(e,{...saved,animate:true,canvasPreview:true});let priorSurface,priorKind;
            for(const mode of modes){let settings={...saved,mode,animate:true,canvasPreview:true};if(file===roundTwoFile){const[background,primary,ink,accent]=roundTwoAPI.STUDIES[mode].palette;Object.assign(settings,{background,primary,ink,accent,secondary:accent})}pool.update(e,settings);e.root.dispatchEvent({type:'pointerenter'});await tick(16);await settle('additive mode '+mode,450,1000000);assert.ok(e.lease);const kind=e.lease.canvas.contextKind;if(priorKind&&priorKind!==kind)assert.notEqual(e.lease.canvas,priorSurface,'Cross-kind mode changes require a fresh actual canvas');priorKind=kind;priorSurface=e.lease.canvas;quality(e,1000000);freshMatch(e)}
            e.root.dispatchEvent({type:'pointerleave'});pool.update(e,saved);await tick(8);await settle('additive mode restored');freshMatch(e)}
        record('Actual source-page7mode and original9mode changes use fresh cross-kind surfaces and exact same-state output; old sources remain separate');
        for(const file of[roundTwoFile,sourcePageFile]){const e=peers.find(e=>e.source===file);hide();e.root.setRect(20,30,390,780);refresh();pool.update(e,{...e.settings,static:false,animate:true,canvasPreview:true});e.root.dispatchEvent({type:'pointerenter'});await tick(15);let changes=0,phase=e.framePhase;for(let i=0;i<25;i++){await tick();if(e.framePhase!==phase){changes++;phase=e.framePhase}}assert.ok(changes>=2&&changes<=(target==='canvas'?13:31),'Actual rendered phase submissions obey target cadence over one fake-clock second');e.root.dispatchEvent({type:'pointerleave'});pool.update(e,{...e.settings,animate:false});await tick(8);await settle('paced additive pause');quality(e);freshMatch(e)}
        record('Both additive factories separately obey editor12fps and Preview30fps ceilings on actual rendered phase changes over one deterministic second');
        const show=()=>{hide();h.window.innerWidth=1280;h.window.innerHeight=2700;for(const[i,e]of peers.entries())e.root.setRect(20+i%4*310,30+Math.floor(i/4)*630,240,240*e.root.clientHeight/e.root.clientWidth);refresh()};show();await settle('all additive peers');for(const e of peers)pool.update(e,{...e.settings,static:false,animate:true,canvasPreview:true});await tick(25);assert.equal(pool.debug().live.length,target==='canvas'?1:2);let previous;
        for(const e of peers){previous?.root.dispatchEvent({type:'pointerleave'});e.root.dispatchEvent({type:'pointerenter'});e.root.dispatchEvent({type:'pointermove',clientX:e.root.rect.left+e.root.rect.width*.72,clientY:e.root.rect.top+e.root.rect.height*.27});await tick(12);assert.ok(e.lease,'Each additive peer acquires the real shared slot');const phase=e.framePhase;await tick(8);assert.ok(e.framePhase>phase,'Actual additive renderer phase advances');quality(e,1000000);freshMatch(e);previous=e}
        previous?.root.dispatchEvent({type:'pointerleave'});for(const e of peers)pool.update(e,{...e.settings,animate:false});await tick(6);const paused=peers.map(e=>[e,e.framePhase,[...e.framePointer]]);await tick(15);for(const[e,phase,pointer]of paused){assert.equal(e.framePhase,phase);assert.deepEqual([...e.framePointer],pointer);quality(e);freshMatch(e)}assert.equal(pool.debug().live.length,0);
        record('Every additive mode advances under one-editor/two-Preview admission and retains its exact paused phase/pointer and sharp cached output');
        for(const e of peers)pool.update(e,{...e.settings,animate:true});await tick(20);hide();refresh();await tick(8);assert.equal(pool.debug().live.length,0);show();await tick(25);h.document.hidden=true;h.document.dispatchEvent({type:'visibilitychange'});await tick(6);assert.equal(pool.debug().live.length,0);h.document.hidden=false;h.document.dispatchEvent({type:'visibilitychange'});await tick(20);if(target==='canvas'){for(const e of peers)pool.update(e,{...e.settings,canvasPreview:false});await tick(12);assert.equal(pool.debug().live.length,0);for(const e of peers)pool.update(e,{...e.settings,canvasPreview:true});await tick(20)}h.motion.matches=true;h.motion.dispatchEvent({type:'change'});await tick(80);await settle('additive reduced motion');for(const e of peers){assert.equal(e.framePhase,e.settings.stillTime);quality(e);freshMatch(e)}assert.equal(pool.debug().live.length,0);h.motion.matches=false;h.motion.dispatchEvent({type:'change'});for(const e of peers)pool.update(e,{...e.settings,animate:false});await tick(8);
        record('All16 additive peers obey offscreen, hidden, Canvas opt-in and reduced-motion canonical still behavior');
        for(const e of peers)pool.runStatic(()=>{const canvas=new h.Canvas(),r=modules.get(e.source).createRenderer(canvas,{...e.settings,managed:true,static:true,renderWidth:e.logicalWidth,renderHeight:e.logicalHeight,managedBufferWidth:1000,managedBufferHeight:1999,pixelBudget:2000000},()=>{},e.settings.stillTime);try{r.renderAt(e.settings.stillTime);assert.ok(canvas.width*canvas.height<=2000000);assert.equal(e.fixture.sourcePage?canvas.frame.sourcePage.phase:canvas.frame.phase,e.settings.stillTime);return canvas.width*canvas.height}finally{r.dispose()}});
        for(const e of added){pool.update(e,{...e.settings,static:true,animate:true});e.root.setRect(20,30,200,200*e.root.clientHeight/e.root.clientWidth)}refresh();await tick(180);await settle('all48 additive static placements');for(const e of added){assert.equal(e.framePhase,e.settings.stillTime);quality(e);freshMatch(e)}assert.equal(pool.debug().live.length,0);assert.ok(h.readbacks.freshCompositionChecks>0&&h.readbacks.putCount===h.readbacks.count);assert.ok(h.readbacks.maxPixels<=2000000);
        record('All48 new static/export replicas freeze canonically;16 two-million-pixel one-shots share serial admission and tonal readback follows fresh composition');
    }
    project(.05);assert.equal(h.stats().created,0,'Registration yields before initialization');await tick(500);assert.equal(entries.length,156);assert.equal(entries.filter(e=>!e.fixture.hero&&!e.fixture.mechanism&&!e.fixture.original&&!e.fixture.roundTwo&&!e.fixture.sourcePage&&e.hasFrame).length,60,JSON.stringify({errors,missing:entries.filter(e=>!e.hasFrame).map(e=>e.fixture.id),debug:pool.debug()}));assert.equal(entries.filter(e=>e.fixture.hero&&e.hasFrame).length,6,JSON.stringify(errors));assert.equal(entries.filter(e=>e.fixture.mechanism&&e.hasFrame).length,15,JSON.stringify(errors));assert.equal(entries.filter(e=>e.fixture.original&&e.hasFrame).length,27,JSON.stringify(errors));assert.equal(new Set(entries.filter(e=>e.fixture.original&&e.fixture.role==='main').map(e=>e.display.frame.paintHash)).size,9,'Nine distinct original constructions');assert.equal(entries.filter(e=>e.fixture.roundTwo&&e.hasFrame).length,27);assert.equal(entries.filter(e=>e.fixture.sourcePage&&e.hasFrame).length,21);for(const e of entries)quality(e);assert.equal(h.active.size,0);record('60 legacy +6 first-wave +15 mechanism +27 Round01 +21 standalone-source +27 RoundTwo replicas bootstrap with ten actual factories and zero retained paused contexts');
    await responsiveDisplayRegression();
    let zoomCases=0;for(const dpr of [1,1.5,2]){h.window.devicePixelRatio=dpr;for(const zoom of [.05,.25,1])for(const role of Object.keys(roles)){project(zoom,roles[role].x,0);await settle(role+' zoom/DPR');zoomCases++}}
    record('All visible replicas refresh source quality without hover at three zooms and three DPRs ('+zoomCases+' views)');
    for(const e of entries){project(.4,e.fixture.worldX,e.fixture.worldY);await settle('pan '+e.fixture.id);quality(e);if(e.fixture.hero||e.fixture.mechanism||e.fixture.original||e.fixture.roundTwo||e.fixture.sourcePage)freshMatch(e)}record('Pan all156 placements; cached hero frames match fresh actual renderer state at adequate resolution');
    const heroEntries=entries.filter(e=>e.fixture.hero),focused=heroEntries.find(e=>e.settings.mode==='typeface'&&e.fixture.role==='reference'),field=heroEntries.find(e=>e.settings.mode==='cantor'&&e.fixture.role==='reference');
    project(1,focused.fixture.worldX,focused.fixture.worldY);await settle('head controls');pool.update(focused,{...focused.settings,density:1.17,glyphSize:1.2,primary:'#dddddd',stillTime:5});await tick(8);await settle('head changed controls');quality(focused);freshMatch(focused);assert.equal(focused.framePhase,5);record('Head density/type/color/still-time updates invalidate cached content and replay exact surface pose');
    pool.update(focused,{...focused.settings,mode:'cantor',density:.8});await tick(8);await settle('head to field');quality(focused);freshMatch(focused);pool.update(focused,{...focused.settings,mode:'typeface',density:1.17});await tick(8);await settle('field to head');quality(focused);freshMatch(focused);record('Both mode changes invalidate geometry/material caches without cross-family stale imagery');
    const mechanismEntries=entries.filter(e=>e.fixture.mechanism),modern=mechanismEntries.find(e=>e.settings.mode==='macmoss'&&e.fixture.role==='reference');
    project(1,modern.fixture.worldX,modern.fixture.worldY);await settle('mechanism control baseline');
    for(const mode of ['macmoss','vercel','raster','mecha','origin']){
        const oldSurface=modern.lease?.canvas;pool.update(modern,{...modern.settings,mode,intensity:1.5,density:.8,artworkScale:.9,stillTime:2.25,scanPitch:3.1});await tick(8);await settle('mechanism mode '+mode);quality(modern);freshMatch(modern);
        if(oldSurface&&modern.lease)assert.notEqual(modern.lease.canvas,oldSurface,'Mode dispatch allocates a fresh backing canvas');
    }
    record('All five new modes and nondefault controls invalidate caches with exact fresh Canvas2D paths/gradients or GL geometry/uniform state');
    // Hold a live lease across both context-kind transitions: browsers reject a
    // second context kind on the same canvas even after resetting dimensions.
    pool.update(modern,{...modern.settings,mode:'vercel',animate:true});modern.root.dispatchEvent({type:'pointerenter'});await tick(12);assert.ok(modern.lease);let contextCanvas=modern.lease.canvas;assert.equal(contextCanvas.contextKind,'2d');
    pool.update(modern,{...modern.settings,mode:'raster'});await tick(12);assert.ok(modern.lease);assert.equal(modern.lease.canvas.contextKind,'webgl');assert.notEqual(modern.lease.canvas,contextCanvas);contextCanvas=modern.lease.canvas;
    pool.update(modern,{...modern.settings,mode:'origin'});await tick(12);assert.ok(modern.lease);assert.equal(modern.lease.canvas.contextKind,'2d');assert.notEqual(modern.lease.canvas,contextCanvas);pool.update(modern,{...modern.settings,animate:false});modern.root.dispatchEvent({type:'pointerleave'});await settle('post context-kind changes');freshMatch(modern);
    record('Live Canvas2D→WebGL→Canvas2D transitions use fresh canvas objects with real context-kind locking');
    pool.update(modern,{...modern.settings,mode:'macmoss',animate:false});await tick(8);await settle('restore Mac peer after mode transitions');quality(modern);freshMatch(modern);
    // All reference cards are visible for deliberate contention, including both
    // hero modes; no offscreen peer can make a fairness assertion pass trivially.
    h.window.innerWidth=2300;h.window.innerHeight=2600;project(.4,roles.reference.x,0);await settle('mixed live board');const peers=entries.filter(e=>e.fixture.role==='reference');assert.ok(peers.every(visible));for(const e of peers)pool.update(e,{...e.settings,animate:true});
    let last;for(let i=0;i<180;i++){last?.root.dispatchEvent({type:'pointerleave'});last=peers[i%peers.length];last.root.dispatchEvent({type:'pointerenter'});await tick()}
    assert.ok(pool.debug().live.length<=(target==='canvas'?1:2));for(const e of peers)assert.ok(adequate(e,1000000),'Live contention cannot starve adequate peer '+e.fixture.id);for(const e of peers)pool.update(e,{...e.settings,animate:false});last?.root.dispatchEvent({type:'pointerleave'});await settle('contention pauses');record('Mixed legacy/hero contention respects target-specific one-editor/two-Preview admission and fair source quality');
    // Select hero + legacy together to prove global admission across factories.
    h.window.innerWidth=1280;h.window.innerHeight=900;for(const e of entries)e.root.setRect(-10000,-10000,100,60);focused.root.setRect(20,40,500,300);field.root.setRect(540,40,500,300);const legacy=entries.find(e=>!e.fixture.hero&&e.fixture.role==='reference');legacy.root.setRect(20,390,500,300);h.window.dispatchEvent({type:'resize'});await settle('hero live setup');
    for(const e of [focused,field,legacy])pool.update(e,{...e.settings,animate:true});focused.root.dispatchEvent({type:'pointerenter'});focused.root.dispatchEvent({type:'pointermove',clientX:420,clientY:100});await tick(20);assert.equal(pool.debug().live.length,target==='canvas'?1:2);const selected=[focused,field,legacy].find(e=>e.lease);assert.ok(selected);const phase=selected.phase;await tick(8);assert.ok(selected.phase>phase);const retained=structuredClone(selected.display.frame),retainedPhase=selected.framePhase,retainedPointer=[...selected.framePointer],size=[selected.display.width,selected.display.height];for(const e of [focused,field,legacy])pool.update(e,{...e.settings,animate:false});await tick(4);assert.equal(h.active.size,0);assert.ok(selected.display.width>=size[0]&&selected.display.height>=size[1]);assert.equal(selected.framePhase,retainedPhase);assert.deepEqual([...selected.framePointer],retainedPointer);assert.equal(selected.display.frame.shader,retained.shader);await settle('paused quality refinement');assert.equal(selected.framePhase,retainedPhase);if(selected.fixture.hero)freshMatch(selected);record('Live phase/pointer advance; pause/handoff retain sharp same-state artwork while releasing all leases');
    // Hero exports/static work uses admission while two Preview peers are live.
    for(const e of [focused,field,legacy])pool.update(e,{...e.settings,animate:true});focused.root.dispatchEvent({type:'pointerenter'});await tick(10);for(const e of [focused,field])freshMatch(e);assert.ok(h.active.size<=2);for(const e of [focused,field,legacy])pool.update(e,{...e.settings,animate:false});await tick(4);record('Hero one-shot fresh/static work shares the window admission cap with live legacy peers');
    // Explicit canvas-off/reduced/hidden guards are tested through the actual pool.
    pool.update(focused,{...focused.settings,animate:true,canvasPreview:false});await tick(8);if(target==='canvas')assert.equal(h.active.size,0,'Canvas motion requires explicit opt-in');pool.update(focused,{...focused.settings,canvasPreview:true});await tick(8);h.document.hidden=true;h.document.dispatchEvent({type:'visibilitychange'});await tick(4);assert.equal(h.active.size,0);h.document.hidden=false;h.document.dispatchEvent({type:'visibilitychange'});h.motion.matches=true;h.motion.dispatchEvent({type:'change'});await tick(8);assert.equal(h.active.size,0);assert.equal(focused.phase,focused.settings.stillTime);h.motion.matches=false;h.motion.dispatchEvent({type:'change'});pool.update(focused,{...focused.settings,animate:false});await tick(4);record('Editor opt-in, hidden and reduced-motion guards apply to hero admission in the mixed registry');
    const newPeers=mechanismEntries.filter(e=>e.fixture.role==='reference');assert.equal(new Set(newPeers.map(e=>e.settings.mode)).size,5,'All five distinct new modes remain represented after transition tests');
    for(const e of entries)e.root.setRect(-10000,-10000,100,60);
    const showNew=()=>{for(const [i,e]of newPeers.entries())e.root.setRect(20+i*245,30,220,300);h.window.dispatchEvent({type:'resize'});};
    showNew();for(const e of newPeers)pool.update(e,{...e.settings,static:false,animate:true,canvasPreview:true});await tick(25);assert.equal(pool.debug().live.length,target==='canvas'?1:2);
    for(const e of newPeers)e.root.setRect(-10000,-10000,220,300);h.window.dispatchEvent({type:'resize'});await tick(6);assert.equal(pool.debug().live.length,0);assert.equal(h.active.size,0,'Offscreen new modes release GL leases');
    showNew();await tick(20);assert.equal(pool.debug().live.length,target==='canvas'?1:2);
    h.document.hidden=true;h.document.dispatchEvent({type:'visibilitychange'});await tick(5);assert.equal(pool.debug().live.length,0);assert.equal(h.active.size,0);h.document.hidden=false;h.document.dispatchEvent({type:'visibilitychange'});await tick(20);
    if(target==='canvas'){for(const e of newPeers)pool.update(e,{...e.settings,canvasPreview:false});await tick(10);assert.equal(pool.debug().live.length,0);assert.equal(h.active.size,0);for(const e of newPeers)pool.update(e,{...e.settings,canvasPreview:true});await tick(15);}
    h.motion.matches=true;h.motion.dispatchEvent({type:'change'});await tick(20);assert.equal(pool.debug().live.length,0);assert.equal(h.active.size,0);for(const e of newPeers){assert.equal(e.phase,e.settings.stillTime);assert.equal(e.framePhase,e.settings.stillTime);quality(e);freshMatch(e);}h.motion.matches=false;h.motion.dispatchEvent({type:'change'});for(const e of newPeers)pool.update(e,{...e.settings,animate:false});await tick(5);
    record('All five new mode peers obey offscreen, document-hidden, explicit Canvas opt-in and reduced-motion canonical replay guards');
    for(const e of mechanismEntries){pool.update(e,{...e.settings,static:true,animate:true});e.root.setRect(20,30,400,300);}h.window.dispatchEvent({type:'resize'});await tick(45);for(const e of mechanismEntries){assert.equal(e.framePhase,e.settings.stillTime);quality(e);freshMatch(e);}assert.equal(pool.debug().live.length,0);record('All15 new export/static placements replay frozen canonical states through shared admission');
    await exerciseOriginals();
    await exerciseAdded();
    for(const e of entries)pool.remove(e);await tick(3);assert.equal(h.active.size,0);assert.equal(h.owned.size,0);assert.equal(pool.debug().entryCount,0);assert.equal(h.timers.size,0);record('Unmount clears mixed registry, graphics handles, contexts and scheduled work');
    assert.deepEqual(errors,handledInjectedFailures);caps();return{target,passed:true,instances:156,legacyInstances:60,heroInstances:6,mechanismInstances:15,originalInstances:27,originalModes:9,roundTwoInstances:27,sourcePageInstances:21,readbacks:h.readbacks,actualModules:modules.size,checks,zoomCases,...h.stats(),recording:h.recording,handledInjectedFailures,sourceHashes,supportModules:sourceHeroPackageMetadata(sourcePackage),scope:'Actual ten standalone factories/coordinator; retained legacy DOM/GL/clock doubles plus Canvas2D path/gradient/transform recording and context-kind locks. All original modes exercise actual paths/ordered-tone geometry at adequate source resolution with exact fresh same-state replay. These156 placements per target/312 total record submitted state and admission, not rasterized appearance. Separate browser suites cover14 source-page and18 RoundTwo actual pixel cases. Synthetic tonal readback verifies invocation/state/serialization only.'};
}
try{const canvas=await run('canvas'),preview=await run('preview');console.log(JSON.stringify({passed:true,testSHA256:hash(fs.readFileSync(import.meta.filename)),adapterSHA256:hash(fs.readFileSync(new URL('./hero-round-two-test-host.mjs',import.meta.url))),hostSHA256:LEGACY_HOST_SHA256,canvas,preview},null,2))}catch(error){console.error(error);process.exitCode=1}
