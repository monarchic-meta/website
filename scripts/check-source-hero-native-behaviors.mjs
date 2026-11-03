import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {chromium} from '@playwright/test';

const repo=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(import.meta.url);
const sharp=createRequire(require.resolve('astro/package.json'))('sharp');
const file=path.join(repo,'docs/design-studies/code-components/SourceHeroNativeBehaviors.tsx');
const source=fs.readFileSync(file,'utf8');
const packet=JSON.parse(fs.readFileSync(path.join(repo,'docs/design-studies/hero-behavior/native/HERO-013.json')));
const evidence=process.env.MONARCHIC_NATIVE_BEHAVIOR_EVIDENCE_DIR??'/tmp/monarchic-source-hero-native-behaviors';
fs.mkdirSync(evidence,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const checks=[];
assert.ok(!/\bany\b|@ts-ignore|@ts-expect-error|querySelector|getElementById|\.innerHTML\s*=/.test(source),'Public typed layer props; no private document lookups');
const bridgeAt=source.indexOf('\n/** Public prop bridge');
assert.ok(bridgeAt>0&&hash(source.slice(0,bridgeAt))==='67bba0a23e1f99e05bdb5ec87f5b3cbdd749ea881a439751f511fd241f7a3ee4','The previously verified24-HOC source prefix remains byte-exact');
const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),exportsAST=ast.statements.filter(node=>ts.isFunctionDeclaration(node)&&node.modifiers?.some(modifier=>modifier.kind===ts.SyntaxKind.ExportKeyword)),append=ast.statements.filter(node=>node.end>bridgeAt);
assert.equal(exportsAST.length,25,'Current public contract has the original24 plus one Notes bridge');
assert.ok(append.length===1&&ts.isFunctionDeclaration(append[0])&&append[0].name?.text==='withFormatNotesStateBridge','Only the one public bridge follows the exact old prefix');
const bridge=source.slice(bridgeAt,append[0].end);
assert.match(bridge,/export function withFormatNotesStateBridge\(Component: ComponentType<LayerProps>\): ComponentType<LayerProps>/);
assert.ok(bridge.includes('useToggle("notes")')&&bridge.includes('useToggle("daughter")')&&!/new Set|new Map|createContext|useState|useSyncExternalStore|let toggles/.test(bridge),'Bridge composes the existing stores without introducing another store');
checks.push('Exact old24 prefix and one public typed Notes bridge; no duplicated store');

const declarations=new Map([
    [path.join(repo,'__native-react.d.ts'),`export interface CSSProperties{[key:string]:string|number|undefined}; export type Ref<T>=((value:T|null)=>void)|{current:T|null}|null; export type ComponentType<P={}>=(props:P)=>unknown; export function forwardRef<T,P>(render:(props:P,ref:Ref<T>)=>unknown):ComponentType<P>; export function useSyncExternalStore<T>(subscribe:(notify:()=>void)=>()=>void,getSnapshot:()=>T,getServerSnapshot:()=>T):T; export interface MouseEvent<T>{currentTarget:T;defaultPrevented:boolean};export interface KeyboardEvent<T> extends MouseEvent<T>{key:string;preventDefault():void};export type MouseEventHandler<T>=(event:MouseEvent<T>)=>void;export type KeyboardEventHandler<T>=(event:KeyboardEvent<T>)=>void;export function useRef<T>(value:T):{current:T};export function createElement(...args:unknown[]):unknown;`],
    [path.join(repo,'__native-framer.d.ts'),`export const RenderTarget:{canvas:string;export:string;thumbnail:string;current():string};export function useIsStaticRenderer():boolean;`],
]);
const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Node10,jsx:ts.JsxEmit.React,baseUrl:repo,paths:{react:['__native-react.d.ts'],framer:['__native-framer.d.ts']}};
const host=ts.createCompilerHost(options),read=host.readFile.bind(host),exists=host.fileExists.bind(host);
host.readFile=p=>declarations.get(p)??read(p);
host.fileExists=p=>declarations.has(p)||exists(p);
host.getSourceFile=(p,v)=>{const s=host.readFile(p);return s===undefined?undefined:ts.createSourceFile(p,s,v,true)};
const diagnostics=ts.getPreEmitDiagnostics(ts.createProgram([file],options,host));
assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics.slice(0,12),{getCurrentDirectory:()=>repo,getCanonicalFileName:x=>x,getNewLine:()=> '\n'}));
checks.push('Strict semantic TypeScript with actual DOM libraries and explicit React/Framer public authoring declarations');

const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
const ssrModule={exports:{}};
let ssrTarget='preview';
vm.runInNewContext(`(function(require,exports){${code}\n})(require,module.exports)`,{module:ssrModule,require:name=>name==='react'?require('react'):{RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail',current:()=>ssrTarget},useIsStaticRenderer:()=>false}});
const React=require('react');
const ssr=require('react-dom/server').renderToString(React.createElement(ssrModule.exports.withFormatWordmark(React.forwardRef((props,ref)=>React.createElement('div',{...props,ref}))),{style:{transform:'translateZ(0)'},'data-preserved':'yes'}));
assert.ok(ssr.includes('data-preserved="yes"')&&ssr.includes('translateZ(0)'));
checks.push('Actual React 18 server render has no window access and preserves native props/transform');
const BridgeNative=React.forwardRef((props,ref)=>React.createElement('div',{...props,ref}));
for(const target of ['preview','canvas','export','thumbnail']){
    ssrTarget=target;
    const html=require('react-dom/server').renderToString(React.createElement(ssrModule.exports.withFormatNotesStateBridge(BridgeNative),{'data-preserved':'bridge',style:{transform:'translateZ(0)'}},'Editable native bridge children'));
    assert.ok(html.includes('data-preserved="bridge"')&&html.includes('translateZ(0)')&&html.includes('Editable native bridge children')&&html.includes('data-format-notes-enabled="0"')&&html.includes('data-format-daughter-enabled="0"'));
    assert.ok(html.includes(target==='preview'?'visibility:visible':'visibility:hidden'),'Explicit frozen target remains an off still');
}
checks.push('New bridge realReactSSR preserves props/children and independently freezes Canvas/export/thumbnail');

const react=fs.readFileSync(path.join(path.dirname(require.resolve('react/package.json')),'umd/react.development.js'),'utf8');
const reactDOM=fs.readFileSync(path.join(path.dirname(require.resolve('react-dom/package.json')),'umd/react-dom.development.js'),'utf8');
const actorNames={
    'opening-wordmark':'withFormatWordmark','vertical-opening':'withFormatVerticalOpening',
    'horizontal-wide':'withFormatHorizontalWide','vertical-deck':'withFormatVerticalDeck',
    'paired-dials':'withFormatPairedDials','triangle-format':'withFormatTriangle',
    'photo-window':'withFormatPhotoWindow','crossing-strips':'withFormatCrossingStrips',
    'oversized-ring-field':'withFormatRingField','poster-advice':'withFormatPosterAdvice',
    'poster-guides':'withFormatPosterGuides','format-footer':'withFormatFooter',
};
const actors=Object.fromEntries(packet.actors.map(a=>[a.key,a]));
const posePacket=Object.fromEntries(packet.scrollTracks.map(t=>[t.targetKey,{
    width:actors[t.targetKey].width,height:actors[t.targetKey].height,
    poses:t.poses.map(p=>({y:p.logicalScrollY,left:p.left,top:p.viewportTop,scale:p.scale,rotate:p.rotation,opacity:p.opacity})),
}]));
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
const reports=[],errors=[];
try {
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    page.on('pageerror',e=>errors.push(e.message));
    await page.setContent('<!doctype html><style>html,body{margin:0;background:#222;color:white}button{position:fixed;bottom:5px;z-index:20}#notes{left:5px}#daughter{left:90px}</style><div id="app"></div>');
    await page.addScriptTag({content:react});await page.addScriptTag({content:reactDOM});
    await page.addScriptTag({content:`window.target='preview';window.staticRenderer=false;window.listenerCounts={scroll:0,resize:0};const add=window.addEventListener.bind(window),remove=window.removeEventListener.bind(window);window.addEventListener=(n,...a)=>{if(n in listenerCounts)listenerCounts[n]++;return add(n,...a)};window.removeEventListener=(n,...a)=>{if(n in listenerCounts)listenerCounts[n]--;return remove(n,...a)};window.nativeModule={};(function(require,exports){${code}\nwindow.nativeViewport=()=>viewport;})(name=>name==='react'?React:{RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail',current:()=>target},useIsStaticRenderer:()=>staticRenderer},nativeModule);`});
    await page.evaluate(({actorNames,posePacket})=>{
        window.clicks=0;window.refs={};window.nativeRoot=ReactDOM.createRoot(document.getElementById('app'));
        const Layer=React.forwardRef(({text,...props},ref)=>React.createElement(props.id==='notes'||props.id==='daughter'?'button':'div',{...props,ref},text??props.children));
        const make=(name,id,style,extra={})=>React.createElement(nativeModule[name](Layer),{key:id,id,ref:node=>refs[id]=node,'data-retained':'native',className:'preserved-native-class',style,...extra},id);
        window.renderNative=()=>nativeRoot.render(React.createElement(React.Fragment,null,
            make('withFormatDocument','document',{position:'relative',height:15158.25}),
            ...Object.entries(actorNames).map(([key,name])=>make(name,key,{width:posePacket[key].width,height:posePacket[key].height,transform:'translateZ(0)',background:'#fff',color:'#222'})),
            make('withFormatNotesButton','notes',{}, {onClick:()=>clicks++}),
            make('withFormatDaughterButton','daughter',{}),
            make('withFormatNotesValue','notes-value',{}),
            make('withFormatDaughterValue','daughter-value',{}),
            make('withFormatNote','note-layer',{opacity:0,position:'fixed',top:20}),
            make('withFormatDaughter','daughter-layer',{opacity:0,position:'fixed',top:40}),
            make('withMechaIndex','mecha-index',{left:28,top:574,width:366,height:100,transform:'translateZ(0)'}),
            ...['Tomorrow','Aescape','Nonfiction'].map((name,i)=>make('withMecha'+name+'Row','mecha-row-'+(i+1),{opacity:1,height:28,width:366})),
            ...Array.from({length:21},(_,i)=>React.createElement('div',{key:'source-chip-'+i,style:{position:'fixed',left:400+(i%7)*64,top:30+Math.floor(i/7)*64,width:60,height:60,background:'#222'}},
                make('withFormatDaughterOriginal','chip-original-'+i,{position:'absolute',left:0,top:0,width:60,height:60,background:'#ee3322',transform:'translateZ(0)'},{text:'',title:'retained original chip'}),
                make('withFormatDaughter','chip-daughter-'+i,{position:'absolute',left:0,top:0,width:60,height:60,background:'linear-gradient(to right,#2288cc 0 50%,transparent 50% 100%)'},{text:''})
            )),
            React.createElement('div',{key:'review',style:{height:1000}},'review')
        ));
        renderNative();
    },{actorNames,posePacket});
    await page.waitForFunction(()=>refs['opening-wordmark']?.style.position==='fixed');
    const chipPixels=async()=>{
        const shot=await page.screenshot({clip:{x:400,y:30,width:60,height:60}}),{data,info}=await sharp(shot).removeAlpha().raw().toBuffer({resolveWithObject:true});
        const rgb=(x,y)=>[...data.subarray((y*info.width+x)*info.channels,(y*info.width+x)*info.channels+3)];
        return{left:rgb(10,40),transparentHalf:rgb(50,40)};
    };
    const chipOriginalPixels=await chipPixels();
    const chipOriginalAttrs=await page.evaluate(()=>Array.from({length:21},(_,i)=>{const n=refs['chip-original-'+i];return{retained:n.dataset.retained,title:n.title,className:n.className,transform:n.style.transform,hasRef:n instanceof HTMLElement}}));
    assert.deepEqual(chipOriginalPixels,{left:[238,51,34],transparentHalf:[238,51,34]});
    assert.ok(await page.evaluate(()=>Array.from({length:21},(_,i)=>getComputedStyle(refs['chip-original-'+i]).visibility==='visible'&&getComputedStyle(refs['chip-daughter-'+i]).visibility==='hidden').every(Boolean)));
    const actions=[];
    for(const[key,track]of Object.entries(posePacket)) for(const pose of track.poses){
        const scrollY=pose.y*1280/1440;
        await page.evaluate(y=>window.scrollTo(0,y),scrollY);
        await page.waitForFunction(y=>Math.abs(window.scrollY-y)<1,scrollY);
        await page.waitForFunction(()=>document.getElementById('mecha-index').style.top!== '574px');
        // Wait for the actual shared RAF store to publish this input.
        await page.waitForFunction(y=>Math.abs(nativeViewport().scrollY-y)<1,scrollY);
        const actual=await page.evaluate(key=>{const n=refs[key],r=n.getBoundingClientRect(),s=getComputedStyle(n);return{x:r.x,y:r.y,width:r.width,height:r.height,opacity:Number(s.opacity),translate:s.translate,scale:Number(s.scale),rotate:s.rotate,transform:s.transform,retained:n.dataset.retained,hasRef:n instanceof HTMLElement}},key);
        const unit=1280/1440,angle=pose.rotate*Math.PI/180,w=track.width*pose.scale*unit,h=track.height*pose.scale*unit;
        const xs=[0,w*Math.cos(angle),-h*Math.sin(angle),w*Math.cos(angle)-h*Math.sin(angle)],ys=[0,w*Math.sin(angle),h*Math.cos(angle),w*Math.sin(angle)+h*Math.cos(angle)];
        assert.ok(Math.abs(actual.x-(pose.left*unit+Math.min(...xs)))<2,`${key} source-pose x`);
        assert.ok(Math.abs(actual.y-(pose.top*unit+Math.min(...ys)))<2,`${key} source-pose y`);
        assert.ok(Math.abs(actual.width-(Math.max(...xs)-Math.min(...xs)))<2,`${key} source-pose width ${JSON.stringify({pose,actual,w,h})}`);
        assert.ok(Math.abs(actual.opacity-pose.opacity)<.01,`${key} source-pose opacity`);
        assert.equal(actual.retained,'native');assert.equal(actual.hasRef,true);assert.notEqual(actual.transform,'none');
        actions.push({key,scrollY,actual});
    }
    reports.push({case:'all source-pose DOM bounds',count:actions.length,actions});
    await page.evaluate(()=>scrollTo(0,0));
    await page.getByRole('button',{name:'notes',exact:true}).click();
    await page.waitForFunction(()=>getComputedStyle(refs['note-layer']).opacity==='1');
    assert.equal(await page.evaluate(()=>refs['notes-value'].textContent),'1');
    assert.equal(await page.evaluate(()=>clicks),1);
    await page.getByRole('button',{name:'daughter',exact:true}).focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(()=>getComputedStyle(refs['daughter-layer']).opacity==='1');
    assert.equal(await page.evaluate(()=>refs['daughter-value'].textContent),'1');
    assert.ok(await page.evaluate(()=>Array.from({length:21},(_,i)=>getComputedStyle(refs['chip-original-'+i]).visibility==='hidden'&&getComputedStyle(refs['chip-daughter-'+i]).visibility==='visible').every(Boolean)));
    const chipDaughterPixels=await chipPixels();
    assert.deepEqual(chipDaughterPixels,{left:[34,136,204],transparentHalf:[34,34,34]});
    assert.deepEqual(await page.evaluate(()=>Array.from({length:21},(_,i)=>{const n=refs['chip-original-'+i];return{retained:n.dataset.retained,title:n.title,className:n.className,transform:n.style.transform,hasRef:n instanceof HTMLElement}})),chipOriginalAttrs);
    assert.ok(chipOriginalAttrs.every(n=>n.retained==='native'&&n.title==='retained original chip'&&n.className==='preserved-native-class'&&n.hasRef&&n.transform.includes('translateZ(')));
    assert.ok(await page.evaluate(()=>Array.from({length:21},(_,i)=>{const n=refs['chip-original-'+i];return n.getAttribute('aria-hidden')==='true'&&getComputedStyle(n).pointerEvents==='none'}).every(Boolean)));
    await page.getByRole('button',{name:'daughter',exact:true}).click();
    await page.waitForFunction(()=>getComputedStyle(refs['chip-original-0']).visibility==='visible');
    assert.deepEqual(await chipPixels(),chipOriginalPixels);
    await page.getByRole('button',{name:'daughter',exact:true}).click();
    await page.waitForFunction(()=>getComputedStyle(refs['chip-original-0']).visibility==='hidden');
    reports.push({case:'All21 native plain/Daughter pairs share the same toggle; transparent alternate regions reveal the backing, not the original bitmap; reverse preserves refs/props/transform',chipOriginalPixels,chipDaughterPixels,passed:true});
    await page.getByRole('button',{name:'notes',exact:true}).click();
    await page.waitForFunction(()=>getComputedStyle(refs['note-layer']).visibility==='hidden');
    assert.equal(await page.evaluate(()=>refs['notes-value'].textContent),'0');
    for(const[y,top]of[[0,574],[666,574],[1391,300],[2105,105],[0,574]]){
        await page.evaluate(y=>scrollTo(0,y),y);
        await page.waitForFunction(top=>Math.abs(refs['mecha-index'].getBoundingClientRect().y-top)<1,top);
    }
    for(const[y,active]of[[0,0],[666,1],[2796,1],[3144,2],[666,1],[0,0]]){
        await page.evaluate(y=>scrollTo(0,y),y);
        await page.waitForFunction(y=>Math.abs(nativeViewport().scrollY-y)<1,y);
        const rows=await page.evaluate(()=>[1,2,3].map(i=>{const n=refs['mecha-row-'+i];return{opacity:Number(getComputedStyle(n).opacity),current:n.getAttribute('aria-current'),border:getComputedStyle(n).borderBottomColor}}));
        rows.forEach((row,i)=>{
            assert.equal(row.opacity,active===0||active===i+1?1:.35,'Source-observed investment-row emphasis');
            assert.equal(row.current,active===i+1?'location':null,'Native current-row semantics');
        });
    }
    reports.push({case:'Native controls retain callbacks; keyboard toggles; actual forward/reverse MECHA index',passed:true});
    await page.setViewportSize({width:390,height:844});
    await page.waitForFunction(()=>refs['opening-wordmark'].style.position!=='fixed');
    assert.equal(await page.evaluate(()=>refs.document.style.height),'15158.2px');
    reports.push({case:'Phone retains independent native positions without Desktop tracks',passed:true});
    await page.setViewportSize({width:1280,height:720});
    await page.evaluate(()=>{target='canvas';renderNative()});
    await page.waitForFunction(()=>listenerCounts.scroll===0&&listenerCounts.resize===0);
    assert.ok(await page.evaluate(()=>Array.from({length:21},(_,i)=>getComputedStyle(refs['chip-original-'+i]).visibility==='visible'&&getComputedStyle(refs['chip-daughter-'+i]).visibility==='hidden').every(Boolean)));
    await page.getByRole('button',{name:'notes',exact:true}).click();
    assert.equal(await page.evaluate(()=>getComputedStyle(refs['note-layer']).visibility),'hidden');
    await page.evaluate(()=>{target='export';staticRenderer=true;renderNative()});
    await page.waitForFunction(()=>refs['opening-wordmark'].style.position!=='fixed');
    assert.ok(await page.evaluate(()=>Array.from({length:21},(_,i)=>getComputedStyle(refs['chip-original-'+i]).visibility==='visible'&&getComputedStyle(refs['chip-daughter-'+i]).visibility==='hidden').every(Boolean)));
    await page.evaluate(()=>nativeRoot.unmount());
    assert.deepEqual(await page.evaluate(()=>listenerCounts),{scroll:0,resize:0});
    assert.ok(await page.evaluate(()=>Array.from({length:21},(_,i)=>refs['chip-original-'+i]===null&&refs['chip-daughter-'+i]===null).every(Boolean)));
    reports.push({case:'Canvas/export freeze and full listener/ref cleanup',passed:true});
    await page.screenshot({path:path.join(evidence,'after-cleanup.png')});
    await page.close();
} finally {await browser.close()}
assert.deepEqual(errors,[]);
const result={passed:true,sourceSHA256:hash(source),testSHA256:hash(fs.readFileSync(import.meta.filename)),checks,reports,errors,scope:'Actual React18 SSR and browser/native DOM bounds, refs/props/events, controls, reverse index/scroll, Phone/Canvas/export and listener cleanup. Framer registration/persistence and original source-curve fidelity remain separate.'};
fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:true,sourceSHA256:result.sourceSHA256,cases:reports.length,evidence},null,2));
