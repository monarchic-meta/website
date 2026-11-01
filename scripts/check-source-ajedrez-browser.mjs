import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {chromium} from '@playwright/test'
const require=createRequire(import.meta.url),ts=require('typescript'),repo=fileURLToPath(new URL('../',import.meta.url)),file=process.env.MONARCHIC_AJEDREZ_SOURCE_PATH??path.join(repo,'docs/design-studies/code-components/SourceAjedrezSequence.tsx'),source=fs.readFileSync(file,'utf8'),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),dir=process.env.MONARCHIC_AJEDREZ_EVIDENCE_DIR??'/tmp/monarchic-source-ajedrez-browser'
fs.mkdirSync(dir,{recursive:true})
const react=fs.readFileSync(path.join(path.dirname(require.resolve('react/package.json')),'umd/react.development.js'),'utf8'),reactDOM=fs.readFileSync(path.join(path.dirname(require.resolve('react-dom/package.json')),'umd/react-dom.development.js'),'utf8'),js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText
const contract=JSON.parse(fs.readFileSync(path.join(repo,'docs/design-studies/hero-behavior/source-contracts/HERO-002.json'))),checks=[],errors=[],reports=[],check=(n,c)=>{assert.ok(c,n);checks.push(n)},browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,ignoreDefaultArgs:['--hide-scrollbars']})
try{for(const layout of(process.env.MONARCHIC_AJEDREZ_FIT_ONLY||process.env.MONARCHIC_AJEDREZ_HOST_ONLY?[]:[{name:'desktop',width:1280,height:1000},{name:'phone',width:390,height:900}])){
const page=await browser.newPage({viewport:{width:layout.width,height:layout.height}});page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(layout.name+':'+e.message))
const epoch=Date.UTC(2026,10,1);await page.clock.install({time:new Date(epoch)});await page.clock.pauseAt(new Date(epoch+1000))
await page.setContent('<!doctype html><style>*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#111;font:14px Arial}#mount{width:100%;display:flex;justify-content:center}p{margin:0}button{font:inherit}</style><div id="mount"></div>');await page.addScriptTag({content:react});await page.addScriptTag({content:reactDOM});await page.evaluate(()=>{window.__target='preview';window.__poster='withAjedrezFilm';window.exports={};window.require=n=>n==='react'?window.React:{RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail',current:()=>__target},useIsStaticRenderer:()=>__target==='export'};window.__frames=new Set();window.__listeners=new Set();window.__events={controls:0,child:0};window.__prevent=false;window.__hidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>__hidden});const request=requestAnimationFrame.bind(window),cancel=cancelAnimationFrame.bind(window),add=document.addEventListener.bind(document),remove=document.removeEventListener.bind(document);window.requestAnimationFrame=fn=>{const id=request(t=>{__frames.delete(id);fn(t)});__frames.add(id);return id};window.cancelAnimationFrame=id=>{__frames.delete(id);cancel(id)};document.addEventListener=(type,fn,opt)=>{if(type==='visibilitychange')__listeners.add(fn);add(type,fn,opt)};document.removeEventListener=(type,fn,opt)=>{__listeners.delete(fn);remove(type,fn,opt)}});await page.addScriptTag({content:js});
await page.evaluate(({width,phases})=>{const Native=React.forwardRef((props,ref)=>{const {text,...rest}=props;return React.createElement('div',{...rest,ref},text??props.children)}),E=React.createElement;window.__H={Root:exports.withAjedrezFilm(Native),Contact:exports.withAjedrezContactPoster(Native),Montage:exports.withAjedrezMontagePoster(Native),Toggle:exports.withAjedrezPlayPause(Native),Replay:exports.withAjedrezReplay(Native),Label:exports.withAjedrezPlaybackLabel(Native),Time:exports.withAjedrezTime(Native),Phases:phases.map((_,i)=>exports['withAjedrezPhase'+String(i+1).padStart(2,'0')](Native))};window.__refs={};window.__root=ReactDOM.createRoot(document.getElementById('mount'));const w=Math.min(480,width),h=w*852/480;window.__asset='data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="160"><rect width="200" height="160" fill="#b5bdb8"/><circle cx="100" cy="80" r="55" fill="#282e2a"/></svg>');window.render=()=>{const Root=__poster==='withAjedrezContactPoster'?__H.Contact:__poster==='withAjedrezMontagePoster'?__H.Montage:__H.Root;ReactDOM.flushSync(()=>__root.render(E(Root,{id:'film',ref:n=>__refs.root=n,title:'native caller',style:{position:'relative',width:w,height:h+95}},E('div',{id:'portrait',style:{position:'relative',width:w,height:h,overflow:'hidden'}},...phases.map((phase,i)=>E(__H.Phases[i],{key:i,id:'scene-'+i,ref:n=>__refs[i]=n,style:{position:'absolute',left:0,top:0,width:w,height:h,opacity:0,background:'hsl('+((i*31)%360)+',12%,85%)'},'data-native-scene':phase.state},E('p',{style:{position:'absolute',left:20,top:40,fontSize:22}},phase.state),E('div',{'data-native-shape':i,style:{position:'absolute',left:30,top:130,width:150,height:180,border:'3px solid #111'}},E('button',{onClick:()=>__events.child++},'Native child')),E('img',{'data-native-photo-binding':'opaque-fixture-asset',src:__asset,style:{position:'absolute',left:20,top:350,width:200,height:160}})))),E(__H.Toggle,{id:'toggle',onClick:e=>{__events.controls++;if(__prevent)e.preventDefault()},style:{position:'absolute',left:10,top:h+20,width:120,height:35,border:'1px solid #111'}},E(__H.Label,{id:'label',text:'PAUSE'})),E(__H.Replay,{id:'replay',style:{position:'absolute',left:150,top:h+20,width:100,height:35,border:'1px solid #111'}},'REPLAY'),E(__H.Time,{id:'time',style:{position:'absolute',left:10,top:h+65,width:200},text:'0 /52.3s'}))))};window.snap=()=>{const root=document.getElementById('film'),groups=Array.from(document.querySelectorAll('[data-native-scene]')),visible=groups.filter(n=>getComputedStyle(n).opacity==='1'&&getComputedStyle(n).visibility==='visible');return{time:Number(root.dataset.sourceAjedrezTime),phase:Number(root.dataset.sourceAjedrezPhase),state:root.dataset.sourceAjedrezState,status:root.dataset.sourceAjedrezPlayback,groups:groups.length,visible:visible.map(n=>n.id),assetIdentity:groups.every(n=>n.querySelector('img').src===__asset),refIdentity:__refs.root===root&&Object.values(__refs).filter(Boolean).length===38,frames:__frames.size,listeners:__listeners.size,events:{...__events},label:document.getElementById('label').textContent}};render()},{width:layout.width,phases:contract.phases});
const flush=async(ms=0)=>{if(ms)await page.clock.runFor(ms);await page.waitForTimeout(20);await page.evaluate(()=>ReactDOM.flushSync(()=>{}))};await flush(100);const initial=await page.evaluate(()=>snap());check(layout.name+' native portrait/ref/photo bindings stay intact',initial.groups===37&&initial.visible.length===1&&initial.assetIdentity&&initial.refIdentity);const frozenKeys=async label=>{const events=await page.evaluate(()=>['toggle','replay'].flatMap(id=>['Enter',' '].map(key=>{const event=new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true});document.getElementById(id).dispatchEvent(event);return{id,key,prevented:event.defaultPrevented}})));check(layout.name+' '+label+' disabled native controls preserve Enter and Space defaults',events.every(e=>!e.prevented))};const journey=[];for(let i=0;i<contract.phases.length;i++){const p=contract.phases[i],target=(p.from+p.to)/2,current=await page.evaluate(()=>snap().time);await flush(Math.max(0,(target-current)*1000));const frame=await page.evaluate(()=>snap());check(layout.name+' recorded phase'+String(i+1).padStart(2,'0')+' is uniquely visible',frame.phase===i+1&&frame.state===p.state&&frame.visible.length===1&&frame.visible[0]==='scene-'+i&&frame.groups===37&&frame.assetIdentity);journey.push(frame);if(i===4||i===32)await page.screenshot({path:path.join(dir,layout.name+'-phase-'+(i+1)+'.png'),clip:await page.locator('#portrait').boundingBox()})}await flush(500);const complete=await page.evaluate(()=>snap());check(layout.name+' exact terminal time freezes credits without auto-loop',complete.time===52.314558&&complete.phase===37&&complete.status==='complete'&&complete.frames===0);await page.locator('#replay').click();await flush(1300);const replay=await page.evaluate(()=>snap());check(layout.name+' Replay resets actual native sequence',replay.time<1.6&&replay.phase===2&&replay.status==='playing');await page.locator('#toggle').click();await flush(50);const paused=await page.evaluate(()=>snap());const clip=await page.locator('#portrait').boundingBox();await page.screenshot({path:path.join(dir,layout.name+'-paused-a.png'),clip});await flush(1800);const held=await page.evaluate(()=>snap());await page.screenshot({path:path.join(dir,layout.name+'-paused-b.png'),clip});const sharp=createRequire(require.resolve('astro/package.json'))('sharp'),pa=await sharp(path.join(dir,layout.name+'-paused-a.png')).raw().toBuffer(),pb=await sharp(path.join(dir,layout.name+'-paused-b.png')).raw().toBuffer();check(layout.name+' Pause holds exact native time/phase/pixels with zeroRAF',paused.status==='paused'&&held.time===paused.time&&held.phase===paused.phase&&held.frames===0&&pa.equals(pb));await page.locator('#toggle').press('Enter');await flush(400);const resumed=await page.evaluate(()=>snap());check(layout.name+' keyboard Play resumes from held recorded time',resumed.time>held.time&&resumed.status==='playing');await page.evaluate(()=>{__prevent=true});await page.locator('#toggle').click();await flush(100);check(layout.name+' caller prevented control remains respected',(await page.evaluate(()=>snap())).status==='playing');await page.evaluate(()=>{__prevent=false;__hidden=true;document.dispatchEvent(new Event('visibilitychange'))});await flush(100);const hiddenA=await page.evaluate(()=>snap());await flush(1500);const hiddenB=await page.evaluate(()=>snap());check(layout.name+' emulated document-hidden state pauses clock andRAF',hiddenA.status==='offscreen'&&hiddenA.time===hiddenB.time&&hiddenB.frames===0);await page.evaluate(()=>{__hidden=false;document.dispatchEvent(new Event('visibilitychange'))});await flush(100);await page.evaluate(()=>{document.getElementById('mount').style.marginTop='3000px'});await flush(100);const offA=await page.evaluate(()=>snap());await flush(1000);const offB=await page.evaluate(()=>snap());check(layout.name+' real offscreen intersection pauses native timeline',offA.status==='offscreen'&&offA.time===offB.time&&offB.frames===0);await page.evaluate(()=>{document.getElementById('mount').style.marginTop='0px'});await flush(100);await page.emulateMedia({reducedMotion:'reduce'});await flush(100);const reduced=await page.evaluate(()=>snap());await flush(1000);check(layout.name+' reduced motion chooses declared title poster without RAF',reduced.time===1.2&&reduced.phase===2&&reduced.status==='reduced-motion'&&(await page.evaluate(()=>snap())).time===1.2&&reduced.frames===0);await frozenKeys('reduced-motion');await page.emulateMedia({reducedMotion:'no-preference'});for(const [target,poster,phase]of[['canvas','withAjedrezFilm',2],['export','withAjedrezContactPoster',22],['thumbnail','withAjedrezMontagePoster',33]]){await page.evaluate(({target,poster})=>{__target=target;__poster=poster;render()},{target,poster});await flush(100);const frozen=await page.evaluate(()=>snap());await flush(2000);const after=await page.evaluate(()=>snap());check(layout.name+' '+target+' selected poster is static',frozen.phase===phase&&frozen.time===after.time&&frozen.status==='poster'&&frozen.frames===0);await frozenKeys(target);}
await page.evaluate(()=>ReactDOM.flushSync(()=>__root.unmount()));await flush(100);const cleanup=await page.evaluate(()=>({frames:__frames.size,listeners:__listeners.size,refs:Object.values(__refs).filter(Boolean).length}));check(layout.name+' all RAF/listeners/forwarded refs clean up',cleanup.frames===0&&cleanup.listeners===0&&cleanup.refs===0);reports.push({layout,initial,journey,complete,replay,paused,held,resumed,hidden:[hiddenA,hiddenB],offscreen:[offA,offB],reduced,cleanup});await page.close()}
for(const width of process.env.MONARCHIC_AJEDREZ_HOST_ONLY?[]:[375,320]) {
    const page=await browser.newPage({viewport:{width,height:844}})
    page.on('pageerror',error=>errors.push('fit-'+width+':'+error.message))
    const epoch=Date.UTC(2026,10,1)
    await page.clock.install({time:new Date(epoch)});await page.clock.pauseAt(new Date(epoch+1000))
    await page.setContent('<!doctype html><style>*{box-sizing:border-box}html{overflow-y:scroll}body{margin:0;min-height:2000px}#fit-parent{width:100%;position:relative}p{margin:0}</style><div id="fit-parent"></div>')
    await page.addScriptTag({content:react});await page.addScriptTag({content:reactDOM})
    await page.evaluate(()=>{
        window.__target='preview';window.__static=false;window.exports={}
        window.require=name=>name==='react'?window.React:{RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail',current:()=>__target},useIsStaticRenderer:()=>__static}
        window.__frames=new Set();window.__fitObservers=new Set()
        const request=requestAnimationFrame.bind(window),cancel=cancelAnimationFrame.bind(window),RO=ResizeObserver
        window.requestAnimationFrame=fn=>{const id=request(t=>{__frames.delete(id);fn(t)});__frames.add(id);return id}
        window.cancelAnimationFrame=id=>{__frames.delete(id);cancel(id)}
        window.ResizeObserver=class extends RO {constructor(fn){super(fn);__fitObservers.add(this)}disconnect(){__fitObservers.delete(this);super.disconnect()}}
    })
    await page.addScriptTag({content:js})
    await page.evaluate(()=>{
        const E=React.createElement,Native=React.forwardRef(({text,...props},ref)=>E('div',{...props,ref},text??props.children))
        const Film=exports.withAjedrezFilm(Native),Phase=exports.withAjedrezPhase02(Native),Toggle=exports.withAjedrezPlayPause(Native),Replay=exports.withAjedrezReplay(Native)
        window.fitRoot=ReactDOM.createRoot(document.getElementById('fit-parent'))
        window.renderFit=()=>ReactDOM.flushSync(()=>fitRoot.render(E(Film,{id:'fit-film',title:'native caller retained',style:{position:'relative',left:0,top:20,width:375,height:742,...(window.__callerZoom===undefined?{}:{zoom:__callerZoom}),transform:'translateZ(0)',outline:'2px solid rgb(23, 51, 79)'}},
            E('div',{id:'fit-portrait',style:{position:'absolute',left:0,top:0,width:375,height:666,border:'3px solid #121212',background:'#e9e2d4'}},
                E(Phase,{style:{position:'absolute',left:15,top:30,width:345,height:80}},'Native title poster'),
                E('div',{id:'fit-bottom-right',style:{position:'absolute',left:357,top:648,width:12,height:12,background:'#b62a12'}})),
            E(Toggle,{id:'fit-toggle',style:{position:'absolute',left:250,top:686,width:110,height:35,background:'#ddd'}},'Pause / Play'),
            E(Replay,{id:'fit-replay',style:{position:'absolute',left:15,top:686,width:100,height:35,background:'#ddd'}},'Replay'))))
        window.fitSnap=()=>{const film=document.getElementById('fit-film'),portrait=document.getElementById('fit-portrait'),parent=document.getElementById('fit-parent'),style=getComputedStyle(film);return{client:document.documentElement.clientWidth,documentScroll:document.documentElement.scrollWidth,parentScroll:parent.scrollWidth,parentClient:parent.clientWidth,parent:parent.getBoundingClientRect().toJSON(),film:film.getBoundingClientRect().toJSON(),portrait:portrait.getBoundingClientRect().toJSON(),marker:document.getElementById('fit-bottom-right').getBoundingClientRect().toJSON(),toggle:document.getElementById('fit-toggle').getBoundingClientRect().toJSON(),replay:document.getElementById('fit-replay').getBoundingClientRect().toJSON(),logicalWidth:film.offsetWidth,portraitLogicalWidth:portrait.offsetWidth,logicalHeight:film.offsetHeight,zoom:Number(style.zoom),time:Number(film.dataset.sourceAjedrezTime),phase:Number(film.dataset.sourceAjedrezPhase),playback:film.dataset.sourceAjedrezPlayback,frames:__frames.size,observers:__fitObservers.size,caller:{title:film.title,outline:style.outline,transform:style.transform,inlineOutline:film.style.outline,inlineTransform:film.style.transform}}}
        renderFit()
    })
    const flush=async(ms=100)=>{await page.clock.runFor(ms);await page.waitForTimeout(20);await page.evaluate(()=>ReactDOM.flushSync(()=>{}))}
    await flush(150)
    const initial=await page.evaluate(()=>fitSnap()),zoom=(width-15)/375
    fs.writeFileSync(path.join(dir,'fit-'+width+'-initial.json'),JSON.stringify(initial,null,2)+'\n')
    check('fit-'+width+' Chromium supports CSSzoom and retains the actual15px scrollbar',await page.evaluate(()=>CSS.supports('zoom','0.5'))&&initial.client===width-15)
    check('fit-'+width+' complete native frame fits parent without horizontal overflow',initial.documentScroll===initial.client&&initial.parentScroll===initial.parentClient&&Math.abs(initial.film.width-(width-15))<.1&&initial.film.right<=initial.parent.right+.1)
    check('fit-'+width+' native375x666 artwork and742px common parent stay unmodified',initial.logicalWidth===375&&initial.portraitLogicalWidth===375&&initial.logicalHeight===742&&Math.abs(initial.zoom-zoom)<1e-6&&Math.abs(initial.portrait.height-666*zoom)<.1&&Math.abs(initial.film.height-742*zoom)<.1)
    check('fit-'+width+' complete bottom-right artwork and both controls scale within the opening',initial.marker.width>9&&initial.marker.right<initial.portrait.right&&initial.marker.bottom<initial.portrait.bottom&&initial.toggle.right<=initial.film.right&&initial.replay.left>=initial.film.left)
    check('fit-'+width+' caller title/transform/outline survive uniform fitting',initial.caller.title==='native caller retained'&&initial.caller.inlineOutline==='rgb(23, 51, 79) solid 2px'&&initial.caller.inlineTransform==='translateZ(0px)')
    await page.locator('#fit-toggle').click();await flush(100);const paused=await page.evaluate(()=>fitSnap());await flush(1000);const held=await page.evaluate(()=>fitSnap())
    check('fit-'+width+' real scaled Pause control freezes the timeline without RAF',paused.playback==='paused'&&held.time===paused.time&&held.frames===0)
    await page.locator('#fit-replay').click();await flush(150);const replay=await page.evaluate(()=>fitSnap())
    check('fit-'+width+' real scaled Replay control resets and plays the native film',replay.time<.3&&replay.phase===1&&replay.playback==='playing')
    await page.emulateMedia({reducedMotion:'reduce'});await flush(100);const reduced=await page.evaluate(()=>fitSnap())
    check('fit-'+width+' reduced-motion title poster keeps the same complete fit and zeroRAF',reduced.time===1.2&&reduced.phase===2&&reduced.frames===0&&reduced.documentScroll===reduced.client&&Math.abs(reduced.zoom-zoom)<1e-6)
    await page.emulateMedia({reducedMotion:'no-preference'})
    for(const target of ['canvas','export','thumbnail']) {
        await page.evaluate(target=>{__target=target;renderFit()},target);await flush(100);const frozen=await page.evaluate(()=>fitSnap())
        check('fit-'+width+' '+target+' retains full title poster fit and disabled controls',frozen.time===1.2&&frozen.phase===2&&frozen.frames===0&&frozen.documentScroll===frozen.client&&Math.abs(frozen.zoom-zoom)<1e-6&&await page.locator('#fit-toggle').getAttribute('aria-disabled')==='true')
    }
    await page.screenshot({path:path.join(dir,'phone-fit-'+width+'.png'),clip:await page.locator('#fit-film').boundingBox()})
    await page.setViewportSize({width:1000,height:844});await flush(100);const large=await page.evaluate(()=>fitSnap())
    check('fit-'+width+' parent resize restores unscaled caller375px geometry with no upscaling',large.zoom===1&&large.film.width===375&&large.logicalWidth===375&&large.caller.inlineOutline===initial.caller.inlineOutline&&large.caller.inlineTransform===initial.caller.inlineTransform)
    await page.setViewportSize({width,height:844});await page.evaluate(()=>{window.__callerZoom='50%';renderFit()});await flush(100);const callerZoom=await page.evaluate(()=>fitSnap())
    check('fit-'+width+' preserves a smaller caller zoom instead of upscaling it',callerZoom.zoom===.5&&Math.abs(callerZoom.film.width-187.5)<.1&&callerZoom.documentScroll===callerZoom.client)
    await page.evaluate(()=>ReactDOM.flushSync(()=>fitRoot.unmount()));await flush(100)
    const cleanup=await page.evaluate(()=>({frames:__frames.size,observers:__fitObservers.size}))
    check('fit-'+width+' native resize observer and RAF clean up',cleanup.frames===0&&cleanup.observers===0)
    reports.push({layout:{name:'phone-scrollbar-fit',width,height:844},initial,paused,held,replay,reduced,large,cleanup})
    await page.close()
}

{
    const page=await browser.newPage({viewport:{width:375,height:1000}})
    page.on('pageerror',error=>errors.push('responsive-host:'+error.message))
    const epoch=Date.UTC(2026,10,1)
    await page.clock.install({time:new Date(epoch)});await page.clock.pauseAt(new Date(epoch+1000))
    await page.setContent('<!doctype html><style>*{box-sizing:border-box}html{overflow-y:scroll}body{margin:0;min-height:2400px}#host-parent{width:100%;position:relative}p{margin:0}</style><div id="host-parent"></div>')
    await page.addScriptTag({content:react});await page.addScriptTag({content:reactDOM})
    await page.evaluate(()=>{
        window.__target='preview';window.exports={};window.__frames=new Set();window.__observerRecords=[]
        window.require=name=>name==='react'?window.React:{RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail',current:()=>__target},useIsStaticRenderer:()=>__target==='export'}
        const request=requestAnimationFrame.bind(window),cancel=cancelAnimationFrame.bind(window)
        window.requestAnimationFrame=fn=>{const id=request(t=>{__frames.delete(id);fn(t)});__frames.add(id);return id}
        window.cancelAnimationFrame=id=>{__frames.delete(id);cancel(id)}
        for(const name of ['IntersectionObserver','ResizeObserver']) {
            const Original=window[name]
            window[name]=class extends Original {
                constructor(callback,options){const record={name,targets:new Set(),entries:[],active:true,callback};super((entries,observer)=>{record.entries=entries;callback(entries,observer)},options);record.observer=this;this.record=record;__observerRecords.push(record)}
                observe(target,...args){this.record.targets.add(target);return super.observe(target,...args)}
                disconnect(){this.record.active=false;return super.disconnect()}
            }
        }
    })
    await page.addScriptTag({content:js})
    await page.evaluate(phases=>{
        const E=React.createElement,Native=React.forwardRef(({text,...props},ref)=>E('div',{...props,ref},text??props.children))
        // The override component remains mounted, while its native adapter
        // replaces the actual host element at the responsive boundary.
        const ResponsiveNative=React.forwardRef((props,ref)=>E(props['data-native-layout']==='desktop'?'section':'article',{...props,ref},props.children))
        const Film=exports.withAjedrezFilm(ResponsiveNative),Toggle=exports.withAjedrezPlayPause(Native),Replay=exports.withAjedrezReplay(Native)
        const Scenes=phases.map((_,index)=>exports['withAjedrezPhase'+String(index+1).padStart(2,'0')](Native))
        window.__hostRef={current:null};window.__hostFixtureMounts=0
        function Fixture(){
            const [desktop,setDesktop]=React.useState(innerWidth>=992)
            React.useEffect(()=>{__hostFixtureMounts++;const resize=()=>setDesktop(innerWidth>=992);addEventListener('resize',resize);return()=>removeEventListener('resize',resize)},[])
            const width=desktop?480:375,height=desktop?852:666
            return E(Film,{id:'host-film',ref:__hostRef,'data-native-layout':desktop?'desktop':'phone',style:{position:'relative',left:0,top:20,width,height:height+80,transform:'translateZ(0)'}},
                E('div',{id:'host-art',style:{position:'relative',width,height,overflow:'hidden',border:'2px solid black'}},
                    ...phases.map((phase,index)=>E(Scenes[index],{key:index,'data-host-scene':index,style:{position:'absolute',left:0,top:0,width,height,background:'hsl('+index*17+',30%,80%)',opacity:0}},phase.state)),
                    E('div',{id:'host-corner',style:{position:'absolute',right:4,bottom:4,width:12,height:12,background:'#b62a12'}})),
                E(Toggle,{id:'host-toggle',style:{position:'absolute',left:width-125,top:height+20,width:110,height:35,background:'#ddd'}},'Pause / Play'),
                E(Replay,{id:'host-replay',style:{position:'absolute',left:15,top:height+20,width:100,height:35,background:'#ddd'}},'Replay'))
        }
        window.__hostRoot=ReactDOM.createRoot(document.getElementById('host-parent'))
        window.renderHost=()=>ReactDOM.flushSync(()=>__hostRoot.render(E(Fixture)))
        window.hostSnap=()=>{const node=document.getElementById('host-film'),parent=node.parentElement,rect=node.getBoundingClientRect(),corner=document.getElementById('host-corner').getBoundingClientRect();return{tag:node.tagName,layout:node.dataset.nativeLayout,time:Number(node.dataset.sourceAjedrezTime),phase:Number(node.dataset.sourceAjedrezPhase),playback:node.dataset.sourceAjedrezPlayback,zoom:Number(getComputedStyle(node).zoom),logicalWidth:node.offsetWidth,rect:rect.toJSON(),corner:corner.toJSON(),client:document.documentElement.clientWidth,documentScroll:document.documentElement.scrollWidth,parentClient:parent.clientWidth,parentScroll:parent.scrollWidth,forwardedRef:__hostRef.current===node,fixtureMounts:__hostFixtureMounts,frames:__frames.size,visibleScenes:Array.from(node.querySelectorAll('[data-host-scene]')).filter(n=>getComputedStyle(n).opacity==='1'&&getComputedStyle(n).visibility==='visible').map(n=>Number(n.dataset.hostScene)+1),activeIO:__observerRecords.filter(r=>r.name==='IntersectionObserver'&&r.active).length,activeRO:__observerRecords.filter(r=>r.name==='ResizeObserver'&&r.active).length}}
        renderHost()
    },contract.phases)
    const flush=async(ms=100)=>{await page.clock.runFor(ms);await page.waitForTimeout(20);await page.evaluate(()=>ReactDOM.flushSync(()=>{}))}
    await flush(250)
    const initial=await page.evaluate(()=>hostSnap())
    check('responsive host initial Phone has full gutter fit, current forwarded ref and a running clock',initial.tag==='ARTICLE'&&initial.playback==='playing'&&initial.time>0&&initial.logicalWidth===375&&initial.client===360&&initial.documentScroll===360&&Math.abs(initial.zoom-.96)<1e-6&&initial.forwardedRef)
    await page.evaluate(()=>{window.__oldPhone=document.getElementById('host-film');document.getElementById('host-parent').style.marginTop='3000px'})
    await flush(250);const offscreen=await page.evaluate(()=>hostSnap());await flush(300)
    check('responsive host real old Phone intersection stops the clock before replacement',offscreen.playback==='offscreen'&&offscreen.time===(await page.evaluate(()=>hostSnap())).time&&offscreen.frames===0)
    await page.setViewportSize({width:1440,height:1000});await flush(150)
    const replaced=await page.evaluate(()=>({oldDisconnected:!__oldPhone.isConnected,newHost:document.getElementById('host-film')!==__oldPhone,...hostSnap()}))
    await page.evaluate(()=>{document.getElementById('host-parent').style.marginTop='0px'})
    await flush(350);const desktop=await page.evaluate(()=>hostSnap())
    check('responsive native replacement drops the old Phone DOM while retaining the mounted override fixture',replaced.oldDisconnected&&replaced.newHost&&desktop.tag==='SECTION'&&desktop.fixtureMounts===1&&desktop.forwardedRef)
    check('visible replacement Desktop resumes from the held clock and refits its actual480px host',desktop.playback==='playing'&&desktop.time>offscreen.time&&desktop.logicalWidth===480&&desktop.zoom===1&&desktop.rect.width===480&&desktop.documentScroll===desktop.client)
    const stalePhoneCallbacks=await page.evaluate(()=>{const records=__observerRecords.filter(r=>!r.active&&r.targets.has(__oldPhone)&&r.entries.some(e=>e.target===__oldPhone));for(const r of records)r.callback(r.entries,r.observer);return records.map(r=>r.name)})
    await flush(350);const afterStalePhone=await page.evaluate(()=>hostSnap())
    check('queued observer callbacks for detached Phone cannot mark the current Desktop offscreen',stalePhoneCallbacks.includes('IntersectionObserver')&&afterStalePhone.playback==='playing'&&afterStalePhone.time>desktop.time&&afterStalePhone.zoom===1)
    await flush(900);const phaseTwo=await page.evaluate(()=>hostSnap())
    check('replacement Desktop advances through the real phase boundary with one visible native group',phaseTwo.phase===2&&phaseTwo.visibleScenes.length===1&&phaseTwo.visibleScenes[0]===2)
    await page.locator('#host-toggle').click();await flush(100);const paused=await page.evaluate(()=>hostSnap());await flush(800);const held=await page.evaluate(()=>hostSnap())
    check('Pause on replacement Desktop holds the actual clock and releases RAF',paused.playback==='paused'&&held.time===paused.time&&held.frames===0)
    await page.locator('#host-toggle').press('Enter');await flush(250)
    check('keyboard Play on replacement Desktop resumes the held native clock',(await page.evaluate(()=>hostSnap())).time>held.time)
    await page.evaluate(()=>{window.__oldDesktop=document.getElementById('host-film')})
    await page.setViewportSize({width:320,height:1000});await flush(300);const narrow=await page.evaluate(()=>hostSnap())
    check('replacement320px Phone refits the entire375px native movie and controls into client305',narrow.tag==='ARTICLE'&&narrow.logicalWidth===375&&narrow.client===305&&narrow.documentScroll===305&&narrow.parentScroll===narrow.parentClient&&Math.abs(narrow.zoom-305/375)<1e-6&&narrow.corner.right<narrow.rect.right&&narrow.playback==='playing')
    const staleDesktopCallbacks=await page.evaluate(()=>{const records=__observerRecords.filter(r=>!r.active&&r.targets.has(__oldDesktop)&&r.entries.some(e=>e.target===__oldDesktop));for(const r of records)r.callback(r.entries,r.observer);return records.map(r=>r.name)})
    await flush(300);const afterStaleDesktop=await page.evaluate(()=>hostSnap())
    check('queued detached Desktop resize/intersection callbacks cannot overwrite current Phone fit or playback',staleDesktopCallbacks.includes('ResizeObserver')&&staleDesktopCallbacks.includes('IntersectionObserver')&&Math.abs(afterStaleDesktop.zoom-305/375)<1e-6&&afterStaleDesktop.documentScroll===305&&afterStaleDesktop.playback==='playing'&&afterStaleDesktop.time>narrow.time)
    await page.setViewportSize({width:1600,height:1000});await flush(200)
    await page.locator('#host-replay').click();await flush(1300);const replay=await page.evaluate(()=>hostSnap())
    check('second replacement Desktop Replay starts the title phase at the real unscaled host',replay.tag==='SECTION'&&replay.phase===2&&replay.time<1.6&&replay.playback==='playing'&&replay.zoom===1&&replay.logicalWidth===480&&replay.fixtureMounts===1)
    await flush(53000);const complete=await page.evaluate(()=>hostSnap())
    check('replacement Desktop completes the52.314558s film rather than staying at offscreen phase1',complete.time===52.314558&&complete.phase===37&&complete.playback==='complete'&&complete.frames===0&&complete.visibleScenes.length===1&&complete.visibleScenes[0]===37)
    await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:375,height:1000});await flush(150);const reduced=await page.evaluate(()=>hostSnap())
    check('replacement Phone under reduced motion retains the full title poster and no RAF',reduced.time===1.2&&reduced.phase===2&&reduced.frames===0&&reduced.documentScroll===360&&Math.abs(reduced.zoom-.96)<1e-6)
    await page.emulateMedia({reducedMotion:'no-preference'})
    const frozen=[]
    for(const [target,width]of [['canvas',1440],['export',320],['thumbnail',1600]]) {
        await page.evaluate(target=>{__target=target;renderHost()},target);await page.setViewportSize({width,height:1000});await flush(150)
        const state=await page.evaluate(()=>hostSnap());frozen.push({target,...state})
        check('responsive host '+target+' replacement freezes title with no live intersection observer',state.time===1.2&&state.phase===2&&state.playback==='poster'&&state.frames===0&&state.activeIO===0&&state.documentScroll===state.client&&await page.locator('#host-toggle').getAttribute('aria-disabled')==='true')
    }
    await page.evaluate(()=>ReactDOM.flushSync(()=>__hostRoot.unmount()));await flush(100)
    const cleanup=await page.evaluate(()=>({frames:__frames.size,activeObservers:__observerRecords.filter(r=>r.active).length,ref:__hostRef.current,dom:document.getElementById('host-film')}))
    check('responsive native replacements clean up both observer families, RAF and caller ref',cleanup.frames===0&&cleanup.activeObservers===0&&cleanup.ref===null&&cleanup.dom===null)
    reports.push({layout:{name:'responsive-native-host-replacement'},initial,offscreen,replaced,desktop,stalePhoneCallbacks,afterStalePhone,phaseTwo,paused,held,narrow,staleDesktopCallbacks,afterStaleDesktop,replay,complete,reduced,frozen,cleanup})
    await page.close()
}

check('No actual React/browser errors',errors.length===0);const result={passed:true,sourceSHA256:hash(source),testSHA256:hash(fs.readFileSync(import.meta.filename)),checks,reports,errors,mode:process.env.MONARCHIC_AJEDREZ_HOST_ONLY?'bounded-responsive-native-host':process.env.MONARCHIC_AJEDREZ_FIT_ONLY?'bounded-phone-fit-and-responsive-host':'full-sequence-phone-fit-and-responsive-host',clock:'Public Playwright clock drives actual ReactDOM/Chromium. Full mode observes every37phase midpoint; responsive-host mode also completes the52.314558s film after native host replacement.',scope:'Controller behavior and preservation of native groups/opaque asset bindings, uniform Phone scrollbar fitting and real responsive host replacement. Owned SVG/label fixtures are test assets, not source art. Does not establish source-film photographic motion/audio fidelity or Framer persistence.'};fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:true,cases:reports.length,checks:checks.length,sourceSHA256:result.sourceSHA256,evidence:dir},null,2))}catch(e){fs.writeFileSync(path.join(dir,'failure.json'),JSON.stringify({message:String(e),checks,errors},null,2)+'\n');throw e}finally{await browser.close()}
