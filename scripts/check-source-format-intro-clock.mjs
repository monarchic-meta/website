import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {chromium} from '@playwright/test'

const require=createRequire(import.meta.url),ts=require('typescript'),repo=fileURLToPath(new URL('../',import.meta.url))
const folder=path.join(repo,'docs/design-studies/code-components'),source=fs.readFileSync(folder+'/SourceFormatDetails.tsx','utf8'),hash=b=>crypto.createHash('sha256').update(b).digest('hex')
const output=process.env.MONARCHIC_FORMAT_INTRO_CLOCK_EVIDENCE_DIR??'/tmp/monarchic-format-intro-clock',checks=[],samples=[],errors=[],check=(name,value)=>{assert.ok(value,name);checks.push(name)}
fs.mkdirSync(output,{recursive:true});if(!process.argv.includes('--static-only')){fs.writeFileSync(output+'/SourceFormatDetails.tsx',source);fs.copyFileSync(fileURLToPath(import.meta.url),output+'/check-source-format-intro-clock.mjs');fs.writeFileSync(output+'/input-pins.json',JSON.stringify({sourceSHA256:hash(source),testSHA256:hash(fs.readFileSync(fileURLToPath(import.meta.url)))},null,2)+'\n')}
const start=source.indexOf('\n/** Genuine introductory513px clock'),ast=ts.createSourceFile('format.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
const rows=ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)),end=rows.find(n=>n.name.text==='withFormatIntroClockBall')?.end,chapter=source.slice(start,end)
const roles=['Scene','Dial','Mark','Hand','HandPart','Burst','Ball'].map(n=>'withFormatIntroClock'+n)
check('The validated144-role poster source remains byte-identical',start>0&&hash(source.slice(0,start))==='77d827161e7aed0ddfbe14245964f3731bcfb4d6e741bb69dfc7a9e663aa5bac')
check('Seven additive Frame/RTE roles use the actual public ComponentType/ES2020 boundary',rows.length>=151&&roles.every((n,i)=>rows[144+i]?.name.text===n&&new RegExp('export function '+n+'\\(Component: ComponentType<LayerProps>\\): ComponentType<LayerProps>').test(chapter))&&!/\.at\(|useRef<HTMLElement>\(null\)/.test(chapter))
check('The scroll controller adds no wall clock, timer, raster, GPU, decoder, fetch or private DOM lookup',!/setTimeout|setInterval|Date\.|new Image|createElement\(|getContext\(|\bfetch\(|querySelector|getElementById|innerHTML|\bfrom\s+["']\./.test(chapter))
check('Source ordinary513px dial and local fixed burst remain distinct',chapter.includes('top: 1554 * unit')&&chapter.includes('height: 513 * unit')&&chapter.includes('position: "fixed"')&&!/pin:|position: "sticky"/.test(chapter))
check('Observer invalidations share the finite30Hz admission without resetting it',chapter.includes('now - last < 1000 / 30')&&chapter.includes('new ResizeObserver(schedule)')&&chapter.includes('else schedule()')&&!/MutationObserver[^\n]*last\s*=/.test(chapter))
check('Dial-only replacement rebinds the one resize observer without retaining the old target',chapter.includes('sizing.current?.unobserve(previous)')&&chapter.includes('if (role === "dial") sizing.current?.observe(node)')&&chapter.includes('if (sizing.current === resize) sizing.current = null'))
check('Ancestor transition/animation completion wakes the owned finite controller',chapter.includes('target.contains(host)')&&chapter.includes('document.addEventListener("transitionend", completion, true)')&&chapter.includes('document.removeEventListener("animationend", completion, true)'))
check('Hot replacement refreshes the retained scene owner and releases its previous observers/listeners',chapter.includes('const FORMAT_INTRO_CLOCK_REVISION = {}')&&chapter.includes('[host, live, layout.layout.unit, FORMAT_INTRO_CLOCK_REVISION]')&&chapter.includes('resize.disconnect(); paint.disconnect()'))
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,React=require('react'),exports={}
const helpers=vm.runInNewContext('(function(require,exports){'+js+';return{formatIntroClockPose,formatIntroClockFrame,sourceLayout};})(require,exports)',{exports,require:n=>n==='react'?React:{RenderTarget:{current:()=> 'canvas',canvas:'canvas',export:'export',thumbnail:'thumbnail'},useIsStaticRenderer:()=>true}})

// Independent algebra for the retained Jc() constants, not original script.
// offsetHeight is rounded; the supplied clock rect is a viewport measurement.
function reference(width,height,scroll,g) {
    const u=width/1440,v=g?.physicalUnit??u,top=g?.sectionTop??1554*u,n=(g?.sectionHeight??Math.round(513*u))/2+height/2,b=height*.763,runway=n+b*1.44,t=Math.min(runway,Math.max(0,scroll-top+height)),a=t-n
    const limit=x=>Math.max(0,Math.min(1,x)),out=x=>1-(1-x)**3,qi=x=>x<.5?2*x*x:1-2*(1-x)*(1-x),ci=x=>x<.5?4*x*x*x:1-4*(1-x)**3
    const angle=a>0?330+60*out(limit(a/b)):330*limit(t/n),growth=limit((t-n*.82)/(n+b-n*.82)),pivot=n*.18/(n+b-n*.82)
    const diameter=Math.ceil(Math.hypot(width,height)),dotScale=Math.exp(Math.log(16.3041*v/diameter)*(1-qi(growth))/(1-qi(pivot)))
    const f=limit((256.5-dotScale*diameter/(2*v))/187.9),blend=f*f*(3-2*f),r=187.9*blend*v,angle2=(330+120*out(limit(a/b)))/180*Math.PI
    const cx=(g?.clockLeft??(width-513*u)/2)+256.5*v,cy=(g?.clockTop??top-scroll)+256.5*v
    return{unit:u,time:t,runway,angle,active:(Math.round(angle/30)%12+12)%12,diameter,x:cx+(width/2-cx)*(1-blend)+r*Math.cos(angle2),y:cy+(height/2-cy)*(1-blend)+r*Math.sin(angle2),dotOpacity:limit((t-.82*n)/(.09*n)),dotScale,lightScale:ci(limit(a/b-.22)),darkScale:ci(limit(a/b-.44))}
}
for(const[w,h]of[[1440,900],[1280,720],[1536,865]]) {
    const u=w/1440,n=Math.round(513*u)/2+h/2,b=.763*h,start=1554*u-h,times=[-1,0,.82*n,.91*n,n,n+.22*b,n+.44*b,n+b,n+1.22*b,n+1.44*b,n+1.44*b+1]
    for(const t of times) {
        const scroll=start+t,actual=helpers.formatIntroClockPose(w,h,scroll),expected=reference(w,h,scroll)
        for(const key of Object.keys(expected))assert.ok(Math.abs(actual[key]-expected[key])<2e-10,w+'/'+h+'/'+t+'/'+key)
        assert.ok(actual.dotScale>=0&&actual.dotScale<=1&&actual.lightScale>=0&&actual.lightScale<=1&&actual.darkScale>=0&&actual.darkScale<=1)
    }
    const seed=helpers.formatIntroClockPose(w,h,start+n),done=helpers.formatIntroClockPose(w,h,start+n+1.44*b)
    check('Original hand, logarithmic seed and three growth boundaries '+w+'/'+h,Math.abs(seed.angle-330)<1e-10&&Math.abs(seed.dotScale*seed.diameter-16.3041*u)<1e-10&&done.active===1&&Math.abs(done.angle-390)<1e-10&&done.dotScale===1&&done.lightScale===1&&done.darkScale===1&&Math.abs(done.x-w/2)<1e-10&&Math.abs(done.y-h/2)<1e-10)
}
for(const scroll of[1372,2065,2770,3198]) {
    // Saved source1440×900 captures explicitly have clientWidth1425.
    const geometry={sectionTop:1554,sectionHeight:513,clockLeft:(1425-513)/2,clockTop:1554-scroll,physicalUnit:1},actual=helpers.formatIntroClockPose(1440,900,scroll,geometry),expected=reference(1440,900,scroll,geometry)
    check('Retained source viewport/scroll and client-width geometry '+scroll,Object.keys(expected).every(k=>Math.abs(actual[k]-expected[k])<2e-10))
}
const forward=Array.from({length:65},(_,i)=>i*60),backward=[...forward].reverse()
check('Reverse scrolling returns to the exact same stateless pose',forward.every((y,i)=>JSON.stringify(helpers.formatIntroClockPose(1440,900,y))===JSON.stringify(helpers.formatIntroClockPose(1440,900,backward[64-i]))))
function fakeFrame(matrix,origin,initial='13px 17px',priority='important',throws=false) {
    let value=initial,weight=priority,reads=0
    const style={getPropertyValue:()=>value,getPropertyPriority:()=>weight,setProperty:(_k,v,p='')=>{value=v;weight=p},removeProperty:()=>{value='';weight=''}}
    return{style,getBoundingClientRect(){if(throws&&++reads===2)throw Error('finite-probe-fixture');const[x,y=0]=value.split(' ').map(parseFloat);return{left:origin[0]+matrix[0]*x+matrix[2]*y,top:origin[1]+matrix[1]*x+matrix[3]*y}},state:()=>[value,weight]}
}
for(const m of[[1,0,0,1],[.8,0,0,.8],[1.25,.2,-.3,.9]]) {
    const node=fakeFrame(m,[31,-4977]),p=helpers.formatIntroClockFrame(node,720,450),inv=p.inverse.slice(7,-1).split(',').map(Number)
    check('Fixed-frame affine/border/long-scroll projection '+m.join('/'),Math.abs(31+m[0]*p.x+m[2]*p.y-720)<1e-8&&Math.abs(-4977+m[1]*p.x+m[3]*p.y-450)<1e-8&&Math.abs(m[0]*inv[0]+m[2]*inv[1]-1)<1e-10&&Math.abs(m[1]*inv[2]+m[3]*inv[3]-1)<1e-10&&node.state()[0]==='13px 17px'&&node.state()[1]==='important')
}
const singular=fakeFrame([0,0,0,0],[0,0]);check('A collapsed host yields no invalid projection and restores style',helpers.formatIntroClockFrame(singular,720,450)===null&&singular.state()[0]==='13px 17px')
const throwing=fakeFrame([1,0,0,1],[0,0],'','',true);assert.throws(()=>helpers.formatIntroClockFrame(throwing,720,450));check('A failed synchronous measurement restores property absence and priority',throwing.state()[0]===''&&throwing.state()[1]==='')
const Native=React.forwardRef((props,ref)=>React.createElement('div',{...props,ref}));for(const name of roles){const html=require('react-dom/server').renderToString(React.createElement(exports[name](Native),{'data-caller':'retained',style:{width:151,height:513,transform:'translateZ(0)'}},'Editable native clock'));check(name+' retains the frozen native facade without DOM access',html.includes('Editable native clock')&&html.includes('data-caller="retained"')&&html.includes('translateZ(0)'))}
const result=()=>({passed:true,node:process.version,sourceSHA256:hash(source),sourceBytes:Buffer.byteLength(source),testSHA256:hash(fs.readFileSync(fileURLToPath(import.meta.url))),publicRoles:Object.keys(exports).length,newRoles:roles,checks,samples,errors,sourceFacts:'Retained Jc/CSS/HTML and four original1440×900 source frames, not a fresh live source audit. The Native-like fixture exercises editable shapes/typography and2D fixed-containing-block conversion.',limits:['Source Lenis smoothing and complete original-site input timing are not re-observed.','The Source Scene normalizes local content stacking to0 because existing native story contexts are auto-level.','The affine host adapter handles2D native transforms; arbitrary3D perspective is outside this branch.','Native Framer reference forwarding/font tuples/material delivery, actual Preview paint and saved-state reload remain separate gates.','Clock-specific Daughter pixelation and the complete18Notes wave remain subsequent work.'],actualFramerPreviewVerified:false,afterEditorReload:false})
if(process.argv.includes('--static-only')){fs.writeFileSync(output+'/static-result.json',JSON.stringify(result(),null,2)+'\n');console.log(JSON.stringify({passed:true,checks:checks.length,output}));process.exit(0)}

// The browser branch is intentionally separate from source-only preparation.
// All media are retained originals, warmed serially; there is no source fetch.
const cached=process.env.MONARCHIC_FORMAT_CACHED_MEDIA_ROOT??'/home/midischwarz12/.codex/visualizations/2026/10/22/01a164a2-0652-73b3-8037-ef2681515624/hero-behavior-contracts-2026-11-01/HERO-013',font=fs.readFileSync(cached+'/source-font/ObysSans-Regular.woff2'),kid=fs.readFileSync(cached+'/kid-assets/clock.webp')
check('The genuine source font and clock-specific Daughter subject are pinned',hash(font)==='2d6e1af3075ea8a3577dac5c210a808873bf6c06e23df2e11d4a8acfc7a1292e'&&hash(kid)==='ac5656432ec96c3771dbac37faa71b1bc569f5cc9875a6ebd39b93563e67c5ed')
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'format-intro-clock-')),browser=await chromium.launchPersistentContext(profile,{headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,viewport:{width:1440,height:900},args:['--disable-dev-shm-usage']}),page=browser.pages()[0]
page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.abort())
const wait=f=>page.waitForFunction(f,null,{timeout:5000,polling:20})
try {
    await page.setContent('<style>*{box-sizing:border-box}body{margin:0;background:#222;overflow-x:hidden}p{margin:0}#mount{position:relative;height:16000px}</style><div id="mount"></div>')
    for(const n of['react','react-dom'])await page.addScriptTag({content:fs.readFileSync(path.join(path.dirname(require.resolve(n+'/package.json')),'umd/'+n+'.development.js'),'utf8')})
    await page.addStyleTag({content:'@font-face{font-family:FixtureObys;src:url(data:font/woff2;base64,'+font.toString('base64')+')}'});
    await page.evaluate(()=>{
        window.__target='preview';window.__static=false;window.__phone=false;window.__reduced=false;window.__hidden=false;window.__frames=new Set();window.__observers=new Set();window.__listeners=[];window.__reads=[];window.__probes=[];window.__maximumFrames=0
        const own=()=>new Error().stack?.includes('format-intro-clock-module.js'),raf=requestAnimationFrame.bind(window),caf=cancelAnimationFrame.bind(window)
        window.__nativeRAF=raf;window.requestAnimationFrame=f=>{if(!own())return raf(f);const id=raf(t=>{__frames.delete(id);f(t)});__frames.add(id);__maximumFrames=Math.max(__maximumFrames,__frames.size);return id};window.cancelAnimationFrame=id=>{__frames.delete(id);caf(id)}
        for(const name of['ResizeObserver','MutationObserver']){const O=window[name];window[name]=class extends O{constructor(...args){super(...args);this.owned=own();this.targets=new Set();if(this.owned)__observers.add(this)}observe(node,...args){this.targets.add(node);if(this.owned)__observers.add(this);return super.observe(node,...args)}unobserve(node){this.targets.delete(node);return super.unobserve(node)}disconnect(){this.targets.clear();__observers.delete(this);return super.disconnect()}}}
        const add=EventTarget.prototype.addEventListener,remove=EventTarget.prototype.removeEventListener;EventTarget.prototype.addEventListener=function(type,listener,options){if(own())__listeners.push({target:this,type,listener});return add.call(this,type,listener,options)};EventTarget.prototype.removeEventListener=function(type,listener,options){__listeners=__listeners.filter(r=>r.target!==this||r.type!==type||r.listener!==listener);return remove.call(this,type,listener,options)}
        const media=new EventTarget();media.matches=false;media.media='(prefers-reduced-motion: reduce)';window.matchMedia=()=>media;window.setReduced=v=>{__reduced=v;media.matches=v;media.dispatchEvent(new Event('change'))}
        Object.defineProperty(document,'hidden',{configurable:true,get:()=>__hidden});window.hide=v=>{__hidden=v;document.dispatchEvent(new Event('visibilitychange'))}
        const bounds=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(){const r=bounds.call(this);if(this.id==='format-intro-clock-burst'&&own()){const value=this.style.getPropertyValue('translate'),p=value.split(' ').map(parseFloat);if((p[0]??0)===0&&(p[1]??0)===0)__reads.push(performance.now());__probes.push({translate:value,transform:this.style.transform,left:r.left,top:r.top,width:r.width,height:r.height});__probes=__probes.slice(-9)};return r}
    })
    await page.addScriptTag({content:'(function(){const exports={};const require=n=>n==="react"?window.React:{RenderTarget:{current:()=>__target,canvas:"canvas",export:"export",thumbnail:"thumbnail"},useIsStaticRenderer:()=>__static};'+js+';window.API=exports;window.Layout=SourceLayoutContext;window.sourceLayout=sourceLayout;})()\n//# sourceURL=format-intro-clock-module.js'})
    const native=fs.readFileSync(folder+'/SourceHeroNativeBehaviors.tsx','utf8'),nativeJS=ts.transpileModule(native,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText
    await page.addScriptTag({content:'(function(){const exports={};const require=n=>n==="react"?window.React:{RenderTarget:{current:()=>__target,canvas:"canvas"},useIsStaticRenderer:()=>__static};'+nativeJS+';window.NativeSource=exports;window.toggleKid=()=>toggle("daughter");})()'})
    await page.evaluate(async uri=>{window.clockKid=uri;const image=new Image();image.src=uri;await image.decode();await document.fonts.ready},'data:image/webp;base64,'+kid.toString('base64'))
    await page.evaluate(()=>{
        const E=React.createElement,N=React.forwardRef(({text,rawSize,rawColor,rawLine,children,...props},ref)=>E((props.id==='clock-dial'?window.__dialTag:undefined)??window.__tag??'div',{...props,ref},text?E('p',{style:{fontSize:rawSize??12,lineHeight:rawLine??1.5,color:rawColor??'#000'}},E('span',null,text)):children))
        const C=API.withFormatIntroClockScene(N),D=API.withFormatIntroClockDial(N),M=API.withFormatIntroClockMark(N),H=API.withFormatIntroClockHand(N),I=API.withFormatIntroClockHandPart(N),B=API.withFormatIntroClockBurst(N),Ball=API.withFormatIntroClockBall(N),Kid=NativeSource.withFormatDaughter(N),Next=API.withFormatSevenBlocksFlow(N)
        window.root=ReactDOM.createRoot(document.getElementById('mount'));window.render=()=>{const w=innerWidth,h=innerHeight,l=sourceLayout(w,h),u=__target==='preview'&&!__static&&!__reduced&&!__phone?w/1440:1,marks=Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return E(M,{key:i,id:'format-intro-clock-mark-'+i,text:'(Format)',rawSize:12,rawLine:.9,rawColor:i===0?'#000':'#bfbfbf',style:{position:'absolute',left:256.5+220.2*Math.cos(a)-23,top:256.5+220.2*Math.sin(a)-5.5,width:46,height:11,fontSize:12,lineHeight:.9,fontFamily:'FixtureObys',color:i===0?'#000':'#bfbfbf',textAlign:'right',transform:'rotate('+(i*30)+'deg)'}})})
            const hand=E(H,{id:'clock-hand',style:{position:'absolute',left:255,top:247,width:197,height:19,transformOrigin:'0 50%'}},
                E(I,{id:'format-intro-clock-hand-near',text:'3',rawSize:8,style:{position:'absolute',left:0,top:2,width:8,height:12,fontSize:8,color:'#000'}}),
                E(I,{id:'format-intro-clock-hand-far',text:'Circle',rawSize:12,style:{position:'absolute',left:165,top:0,width:32,height:18,fontSize:12,color:'#000'}}),
                E(I,{id:'format-intro-clock-hand-rule',style:{position:'absolute',left:0,top:18,width:196,height:1,background:'#000'}}))
            const dial=E(D,{id:'clock-dial',style:{position:'absolute',left:463.5,top:0,width:513,height:513,borderRadius:'50%',background:'#fff'}},
                E(Kid,{id:'clock-daughter',style:{position:'absolute',left:0,top:0,width:'100%',height:'100%',backgroundImage:'url('+clockKid+')',backgroundSize:'cover',opacity:0}}),...marks,hand)
            const burst=E(B,{id:'format-intro-clock-burst',style:{position:'fixed',left:0,top:0,width:0,height:0,opacity:0,overflow:'visible'}},
                ...['dot','light','dark'].map(part=>E(Ball,{key:part,id:'format-intro-clock-ball-'+part,style:{position:'absolute',left:0,top:0,width:16.3041,height:16.3041,borderRadius:'50%',opacity:0}})))
            const scene=E(C,{id:'clock-scene',style:{position:'absolute',left:0,top:1554,width:1440,height:513,overflow:'visible'}},dial,burst)
            const next=E(Next,{id:'next-source-content',style:{position:'absolute',background:'#222'}},E(N,{id:'next-content-probe',style:{position:'absolute',left:40,top:160,width:200,height:50,background:'#ffbb00'}}))
            ReactDOM.flushSync(()=>root.render(E(Layout.Provider,{value:{width:w,height:h,frozen:false,phone:__phone,layout:l}},E('div',{id:'native-root',style:{position:'relative',width:w,height:16000,fontFamily:'FixtureObys'}},scene,next))))
        }

        window.read=()=>{const scene=document.getElementById('clock-scene'),dial=document.getElementById('clock-dial'),hand=document.getElementById('clock-hand'),burst=document.getElementById('format-intro-clock-burst'),dot=document.getElementById('format-intro-clock-ball-dot'),r=n=>{const b=n.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height}};return{scroll:scrollY,width:innerWidth,height:innerHeight,clientWidth:document.documentElement.clientWidth,time:Number(scene.dataset.formatIntroClockTime),angle:Number(hand.dataset.formatIntroClockAngle),scene:r(scene),sectionHeight:scene.offsetHeight,sectionWidth:scene.offsetWidth,dial:r(dial),dot:r(dot),dark:r(document.getElementById('format-intro-clock-ball-dark')),burst:r(burst),burstOpacity:getComputedStyle(burst).opacity,burstTransform:getComputedStyle(burst).transform,burstTranslate:getComputedStyle(burst).translate,partFont:getComputedStyle(document.querySelector('#format-intro-clock-hand-near span')).fontSize,markFont:getComputedStyle(document.querySelector('#format-intro-clock-mark-0 span')).fontSize,active:Array.from(document.querySelectorAll('[data-format-intro-clock-active="true"]'),n=>n.id),reads:__reads.length,frames:__frames.size,observers:__observers.size}}
        render()
    })
    await page.evaluate(()=>document.fonts.ready);await wait(()=>read().observers===2&&read().frames===0)
    const settle=async y=>{await page.evaluate(y=>scrollTo(0,y),y);try{await wait(()=>{const s=read(),n=s.sectionHeight/2+s.height/2,end=n+1.44*.763*s.height,t=Math.max(0,Math.min(end,s.scroll-(s.scene.y+s.scroll-s.height)));return Math.abs(s.time-t)<1e-7&&s.frames===0})}catch(error){samples.push({name:'settle-admission-failure',targetScroll:y,state:await page.evaluate(()=>read()),probes:await page.evaluate(()=>__probes),observerTargets:await page.evaluate(()=>Array.from(__observers,o=>Array.from(o.targets??[],n=>({id:n.id,connected:n.isConnected}))))});throw error};await page.waitForTimeout(40);return page.evaluate(()=>read())}
    for(const[w,h]of[[1440,900],[1280,720]]) {
        await page.setViewportSize({width:w,height:h});await page.evaluate(()=>render());await page.waitForTimeout(80)
        for(const y of[1372,2065,2770,3198,2065,1372]) {
            const s=await settle(y),g={sectionTop:s.scene.y+s.scroll,sectionHeight:s.sectionHeight,clockLeft:s.dial.x,clockTop:s.dial.y,physicalUnit:w/1440*s.scene.width/s.sectionWidth},expected=reference(w,h,s.scroll,g)
            check('Native dial remains ordinary flow and its hand follows source forward/reverse '+w+'/'+y,Math.abs(s.scene.y+s.scroll-1554*w/1440)<.03&&Math.abs(s.angle-expected.angle)<1e-7&&s.active.length===1&&s.active[0]==='format-intro-clock-mark-'+expected.active)
            check('Viewport dot diameter/center follow source equations '+w+'/'+y,Math.abs(s.dot.width-expected.diameter*expected.dotScale)<.04&&Math.abs(s.dot.x+s.dot.width/2-expected.x)<.04&&Math.abs(s.dot.y+s.dot.height/2-expected.y)<.04)
            samples.push({name:'source-'+w+'-'+y,state:s,expected});if(w===1440&&(y===1372||y===2065))await page.screenshot({path:output+'/native-like-'+w+'-'+y+'.png'})
        }
        check('Nested editable RTE typography scales without changing its genuine face '+w,Math.abs(parseFloat((await page.evaluate(()=>read())).partFont)-8*w/1440)<.001&&Math.abs(parseFloat((await page.evaluate(()=>read())).markFont)-12*w/1440)<.001)
    }
    await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>render());await settle(1372)
    await page.evaluate(()=>toggleKid());await wait(()=>getComputedStyle(document.getElementById('clock-daughter')).visibility==='visible');check('The correct genuine clock subject uses the unchanged shared Daughter toggle',await page.evaluate(()=>getComputedStyle(document.getElementById('clock-daughter')).backgroundImage.includes('data:image/webp')&&getComputedStyle(document.getElementById('clock-daughter')).opacity==='1'))
    await page.screenshot({path:output+'/native-like-clock-daughter.png'});await page.evaluate(()=>toggleKid());await settle(helpers.sourceLayout(1440,900).group+80)
    const bright=await page.evaluate(()=>{const r=document.getElementById('next-content-probe').getBoundingClientRect();return{x:r.x+10,y:r.y+10}}),sharp=createRequire(require.resolve('astro/package.json'))('sharp'),pixel=async point=>Array.from(await sharp(await page.screenshot({clip:{x:Math.round(point.x),y:Math.round(point.y),width:1,height:1}})).removeAlpha().raw().toBuffer())
    check('Following native auto-level content appears above the completed local dark circle',JSON.stringify(await pixel(bright))==='[255,187,0]')
    await page.evaluate(()=>document.getElementById('clock-scene').style.zIndex='1');check('The rejected global content-level1 would cover the following content',JSON.stringify(await pixel(bright))==='[34,34,34]');await page.evaluate(()=>document.getElementById('clock-scene').style.zIndex='0')
    await page.evaluate(()=>{const root=document.getElementById('native-root');root.style.border='7px solid transparent';root.style.transformOrigin='0 0';root.style.transform='translate(31px,17px) rotate(9deg) scale(.8)'});const transformed=await settle(5000)
    check('The fixed native circles retain viewport diameter/center through transformed/bordered ancestors',Math.abs(transformed.dark.width-Math.ceil(Math.hypot(1440,900)))<.06&&Math.abs(transformed.dark.height-transformed.dark.width)<.06&&Math.abs(transformed.dark.x+transformed.dark.width/2-720)<.06&&Math.abs(transformed.dark.y+transformed.dark.height/2-450)<.06);samples.push({name:'affine-fixed-frame',state:transformed})
    await page.evaluate(()=>{const root=document.getElementById('native-root');root.style.transform='';root.style.border=''});await settle(1372)
    const throttle=await page.evaluate(async()=>{__reads=[];const start=performance.now(),root=document.getElementById('native-root');await new Promise(resolve=>{const tick=now=>{root.style.transform='translateX('+Math.sin(now)*2+'px)';if(now-start<420)__nativeRAF(tick);else resolve()};__nativeRAF(tick)});root.style.transform='';await new Promise(r=>setTimeout(r,100));return{reads:__reads.length,duration:performance.now()-start,maxFrames:__maximumFrames,pending:__frames.size}})
    check('Animated ancestor notifications stay within one finite30Hz paint chain',throttle.reads<=Math.ceil(throttle.duration/(1000/30))+1&&throttle.maxFrames<=1&&throttle.pending===0);samples.push({name:'ancestor-throttle',...throttle})
    await page.evaluate(()=>{window.__retainedScene=document.getElementById('clock-scene');window.__retiredDial=document.getElementById('clock-dial');__dialTag='section';render()});await page.waitForTimeout(80)
    check('Replacing only the dial rebinds RO to its new node and unobserves the detached dial',await page.evaluate(()=>document.getElementById('clock-scene')===__retainedScene&&!__retiredDial.isConnected&&Array.from(__observers).some(o=>o.targets.has(document.getElementById('clock-dial')))&&Array.from(__observers).every(o=>!o.targets.has(__retiredDial))))
    await page.evaluate(()=>document.getElementById('native-root').style.opacity='0');await page.waitForTimeout(40);const beforeFade=await page.evaluate(()=>__reads.length);await page.evaluate(()=>scrollTo(0,2065));await page.waitForTimeout(60);check('A hidden ancestor suspends clock geometry without discarding the sharp pose',await page.evaluate(n=>__reads.length===n&&__frames.size===0,beforeFade))
    await page.evaluate(()=>{const root=document.getElementById('native-root');getComputedStyle(root).opacity;root.style.transition='opacity .12s linear';root.style.opacity='1'})
    await wait(()=>read().frames===0&&Math.abs(read().angle-390)<1e-7);check('Ancestor opacity completion refreshes the current source pose without scroll/resize/hover',await page.evaluate(n=>__reads.length>n,beforeFade));await page.evaluate(()=>document.getElementById('native-root').style.transition='')
    await page.evaluate(()=>hide(true));const hiddenReads=await page.evaluate(()=>__reads.length);await settle(2065);check('Hidden documents suspend measurements and frames',await page.evaluate(n=>__reads.length===n&&__frames.size===0,hiddenReads));await page.evaluate(()=>hide(false));await page.waitForTimeout(80);check('Visibility return refreshes without Play or hover',Math.abs((await page.evaluate(()=>read())).angle-reference(1440,900,2065).angle)<1e-7)
    await page.evaluate(()=>setReduced(true));await page.waitForTimeout(60);check('Reduced motion restores the authored still and removes geometry observers',await page.evaluate(()=>read().observers===0&&read().frames===0&&read().burstOpacity==='0'));await page.evaluate(()=>setReduced(false));await page.waitForTimeout(80)
    for(const mode of['canvas','export','thumbnail','static','phone']){await page.evaluate(mode=>{__target=mode==='static'||mode==='phone'?'preview':mode;__static=mode==='static';__phone=mode==='phone';render()},mode);await page.waitForTimeout(60);check(mode+' never admits the clock burst or a geometry loop',await page.evaluate(()=>read().frames===0&&read().observers===0&&read().burstOpacity==='0'));if(mode==='phone')check('The new clock does not change the historical Phone composition',await page.evaluate(()=>getComputedStyle(document.getElementById('clock-scene')).display==='none'))}
    await page.evaluate(()=>{__target='preview';__static=false;__phone=false;render()});await page.waitForTimeout(80);await page.evaluate(()=>{__tag='section';render()});await page.waitForTimeout(80);check('Native host replacement re-admits the new parts and releases old observers',await page.evaluate(()=>document.getElementById('clock-scene').tagName==='SECTION'&&read().observers===2&&read().frames===0&&read().burstOpacity==='1'))
    await page.evaluate(()=>ReactDOM.flushSync(()=>root.unmount()));await page.waitForTimeout(40);check('Unmount releases all owned frames, geometry observers and event listeners',await page.evaluate(()=>__frames.size===0&&__observers.size===0&&__listeners.length===0));check('No React/Chromium errors',errors.length===0)
    fs.writeFileSync(output+'/result.json',JSON.stringify(result(),null,2)+'\n');console.log(JSON.stringify({passed:true,checks:checks.length,output}))
} catch(error) {fs.writeFileSync(output+'/failure.json',JSON.stringify({message:String(error),checks,samples,errors,currentState:await page.evaluate(()=>typeof read==='function'?read():null).catch(()=>null),lastProbes:await page.evaluate(()=>window.__probes??[]).catch(()=>[])},null,2)+'\n');throw error} finally {await browser.close();fs.rmSync(profile,{recursive:true,force:true})}
