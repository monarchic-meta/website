import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { chromium } from '@playwright/test'
const require = createRequire(import.meta.url), ts = require('typescript'), repo = path.resolve(import.meta.dirname, '..')
const file = path.join(repo, 'docs/design-studies/code-components/SourceGtheMotion.tsx'), source = fs.readFileSync(file, 'utf8'), out = process.env.MONARCHIC_GTHE_EVIDENCE_DIR ?? '/tmp/monarchic-gthe-motion'
fs.mkdirSync(out, { recursive: true })
const checks = [], verify = (name, value) => { assert.ok(value, name); checks.push(name) }
const definitions = new Map([[repo + '/__gthe-react.d.ts', `export interface CSSProperties{[key:string]:string|number|undefined};export type ForwardedRef<T>=((node:T|null)=>void)|{current:T|null}|null;export type ComponentType<P>=(props:P)=>unknown;export interface Context<T>{Provider:ComponentType<{value:T;children?:unknown}>;__value?:T};export function createContext<T>(value:T):Context<T>;export function useContext<T>(context:Context<T>):T;export function useRef<T>(value:T):{current:T};export function useState<T>(value:T):[T,(value:T)=>void];export function useCallback<T extends Function>(callback:T,dependencies:unknown[]):T;export function useEffect(callback:()=>void|(()=>void),dependencies:unknown[]):void;export const useLayoutEffect:typeof useEffect;export function useMemo<T>(factory:()=>T,dependencies:unknown[]):T;export function forwardRef<T,P>(render:(props:P,ref:ForwardedRef<T>)=>unknown):ComponentType<P>;export function createElement(...args:unknown[]):unknown;declare global{namespace JSX{interface IntrinsicElements{style:{children?:string}}}}`], [repo + '/__gthe-framer.d.ts', `export const RenderTarget:{canvas:string;export:string;thumbnail:string;current():string};export function useIsStaticRenderer():boolean;`]])
const options = { strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Node10, jsx: ts.JsxEmit.React, baseUrl: repo, paths: { react: ['__gthe-react.d.ts'], framer: ['__gthe-framer.d.ts'] } }
const host = ts.createCompilerHost(options), read = host.readFile.bind(host), exists = host.fileExists.bind(host)
host.readFile = p => definitions.get(p) ?? read(p); host.fileExists = p => definitions.has(p) || exists(p); host.getSourceFile = (p, v) => { const s = host.readFile(p); return s === undefined ? undefined : ts.createSourceFile(p, s, v, true) }
const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([file], options, host))
verify('Strict semantic React HOCs and actual DOM styles compile', diagnostics.length === 0 || assert.fail(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory: () => repo, getCanonicalFileName: p => p, getNewLine: () => '\n' })))
verify('Six source families, two cell groups and23 native-circle overrides', (source.match(/^export function /gm) ?? []).length === 31)
verify('No external dependency, renderer, media or source-script execution', !/from ["'](?!react|framer)|fetch\(|new Function|eval\(|getContext\(|setInterval\(/.test(source))
const react = fs.readFileSync(path.join(path.dirname(require.resolve('react/package.json')), 'umd/react.development.js'), 'utf8'), reactDOM = fs.readFileSync(path.join(path.dirname(require.resolve('react-dom/package.json')), 'umd/react-dom.development.js'), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, headless: true }), context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }), page = await context.newPage(), errors = []
page.on('pageerror', e => errors.push(String(e)))
try {
    await page.setContent('<body style="margin:0;background:#000;color:white"><div id="root"></div></body>')
    await page.addScriptTag({ content: react }); await page.addScriptTag({ content: reactDOM })
    await page.addScriptTag({ content: `window.target='preview';window.staticRenderer=false;window.require=name=>name==='react'?window.React:{RenderTarget:{canvas:'canvas',export:'export',thumbnail:'thumbnail',current:()=>target},useIsStaticRenderer:()=>staticRenderer};window.exports={};(function(require,exports){${code}})(window.require,window.exports);window.sourceG=window.exports;` })
    await page.addScriptTag({ content: `
        const adapter=React.forwardRef((props,ref)=>{const {children,nativeTag='div',framerPseudoBorder,...rest}=props;return React.createElement(nativeTag,{...rest,ref,...(framerPseudoBorder?{'data-framer-border':'true'}:{})},children)});
        const families={home:['Home',5,960,670],manifesto:['Manifesto',6,400,400],vision:['Vision',23,400,400],expertise:['Expertise',15,400,400],experience:['Experience',9,360,720],contact:['Contact',5,480,480]};
        const groups=Object.fromEntries(Object.entries(families).map(([name,row])=>[name,sourceG['withG'+row[0]+'Motion'](adapter)]));
        const circles=Array.from({length:23},(_,i)=>sourceG['withGCircle'+String(i).padStart(2,'0')](adapter));
        window.app=ReactDOM.createRoot(document.querySelector('#root'));
        window.renderStudy=(mode,targetName='preview',staticFlag=false,nativeTag='div',circleTag=nativeTag)=>{window.target=targetName;window.staticRenderer=staticFlag;const row=families[mode];Object.assign(document.querySelector('#root').style,{width:(innerWidth<1025?innerWidth:row[2])+'px',height:row[3]+'px'});app.render(React.createElement(groups[mode],{key:mode+'/'+targetName+'/'+staticFlag,id:'study',nativeTag,style:{position:'relative',width:row[2],height:row[3],margin:20}},Array.from({length:row[1]},(_,i)=>React.createElement(circles[i],{key:i,nativeTag:circleTag,style:{position:'absolute',boxSizing:'border-box',left:'17px',top:'23px',width:'101px',height:'101px',border:'1px solid white',borderRadius:'50%'}}))))};
        window.readStudy=()=>({mode:document.querySelector('#study')?.dataset.sourceGMotion,running:document.querySelector('#study')?.dataset.sourceGRunning,time:document.querySelector('#study')?.dataset.sourceGTime,paints:Number(document.querySelector('#study')?.dataset.sourceGPaints||0),actors:[...document.querySelectorAll('[data-source-g-circle]')].map(n=>({index:Number(n.dataset.sourceGCircle),style:n.getAttribute('style'),rect:[n.offsetLeft,n.offsetTop,n.offsetWidth,n.offsetHeight],mask:getComputedStyle(n).maskImage}))});
    ` })
    assert.deepEqual(errors, [], "Harness and source load without errors");
    await page.addScriptTag({content:`
        const Left=sourceG.withGHomeLeftMotion(adapter),Right=sourceG.withGHomeRightMotion(adapter);
        window.renderHomeCells=()=>{window.target='preview';window.staticRenderer=false;Object.assign(document.querySelector('#root').style,{width:'100%',height:'900px'});const cell=(Group,count)=>React.createElement('div',{style:{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}},React.createElement(Group,{style:{position:'relative',width:200,height:200}},Array.from({length:count},(_,i)=>React.createElement(circles[i],{key:i,style:{position:'absolute',boxSizing:'border-box',left:17,top:23,width:101,height:101,border:'1px solid white',borderRadius:'50%'}}))));app.render(React.createElement('div',{id:'cells',style:{width:innerWidth<1025?'100vw':'calc(100vw - 480px)',height:670,display:'flex'}},cell(Left,1),cell(Right,4)))};
    `})
    await page.addStyleTag({content:'[data-framer-border=true]::after{content:"";border:1px solid white;box-sizing:border-box;border-radius:inherit;pointer-events:none;width:100%;height:100%;position:absolute;top:0;left:0}'})
    await page.addScriptTag({content:`window.renderFramerBorders=()=>{window.target='preview';window.staticRenderer=false;Object.assign(document.querySelector('#root').style,{width:'400px',height:'400px'});app.render(React.createElement(groups.manifesto,{id:'study',style:{position:'relative',width:400,height:400}},React.createElement(circles[3],{framerPseudoBorder:true,style:{position:'absolute',boxSizing:'border-box',left:17,top:23,width:101,height:101,borderRadius:'50%',border:'none'}})))}`})
    const snapshots = []
    await page.evaluate(() => renderStudy('home')); await page.waitForTimeout(350)
    let a = await page.evaluate(() => readStudy()); verify('Home entry actually masks native ring strokes', a.actors.length === 5 && a.actors.some(n => n.mask.includes('conic-gradient')))
    await page.waitForTimeout(2300); a = await page.evaluate(() => readStudy()); verify('Home completes all five rings and releases its finite RAF', a.running === 'false' && a.actors.every(n => n.mask === 'none'))
    await page.waitForTimeout(200); verify('Completed Home stays still', (await page.evaluate(() => readStudy())).paints === a.paints)
    await page.screenshot({ path: out + '/home-settled.png' }); snapshots.push(a)
    for (const [mode, count] of [['manifesto',6],['vision',23],['expertise',15],['experience',9],['contact',5]]) {
        await page.evaluate(mode => renderStudy(mode), mode); await page.waitForTimeout(350); const early = await page.evaluate(() => readStudy())
        await page.waitForTimeout(1600); const later = await page.evaluate(() => readStudy())
        verify(mode + ' keeps the exact native-circle population', early.actors.length === count && later.actors.length === count)
        verify(mode + ' changes real native shape bounds over time', early.actors.some((n,i) => n.rect.some((v,j) => v !== later.actors[i].rect[j])))
        verify(mode + ' uses finite nonnegative ellipse dimensions', later.actors.every(n => n.rect.every(Number.isFinite) && n.rect[2] >= 0 && n.rect[3] >= 0))
        await page.screenshot({ path: out + '/' + mode + '-moving.png' }); snapshots.push({ early, later })
    }
    await page.evaluate(() => renderFramerBorders());await page.waitForTimeout(250)
    verify('Native Framer pseudo-border remains the only visible stroke', await page.evaluate(() => {const n=document.querySelector('[data-source-g-circle]');return getComputedStyle(n).borderTopWidth==='0px'&&getComputedStyle(n,'::after').borderTopWidth==='1px'&&n.dataset.sourceGActive==='true'}))
    verify('Procedural motion leaves native fill/radius/border attributes authoritative', await page.evaluate(() => {const n=document.querySelector('[data-source-g-circle]');return n.style.borderTopStyle==='none'&&n.style.borderRadius==='50%'&&n.style.background===''}))
    await page.evaluate(() => renderStudy('vision')); await page.waitForTimeout(200)
    await page.evaluate(() => { document.querySelector('#study').style.marginTop='2000px' }); await page.waitForTimeout(180)
    const off = await page.evaluate(() => readStudy()); await page.waitForTimeout(250); const held = await page.evaluate(() => readStudy())
    verify('Offscreen native motion stops and retains the last geometry', off.running === 'false' && held.paints === off.paints && held.time === off.time)
    await page.evaluate(() => { document.querySelector('#study').style.marginTop='20px' }); await page.waitForTimeout(250)
    verify('Returning to view resumes the same native motion', (await page.evaluate(() => readStudy())).paints > held.paints)
    await page.evaluate(() => { window.circleOnlyOldActors=[...document.querySelectorAll('[data-source-g-circle]')]; window.circleOnlyHost=document.querySelector('#study'); renderStudy('vision','preview',false,'div','section') }); await page.waitForTimeout(250)
    verify('Retained circle HOCs register replacement nodes without changing their group', await page.evaluate(() => document.querySelector('#study') === circleOnlyHost && [...document.querySelectorAll('[data-source-g-circle]')].every(n => n.tagName === 'SECTION' && n.dataset.sourceGActive==='true') && circleOnlyOldActors.every(n => !n.isConnected && n.style.transform === '' && !n.style.getPropertyValue('--source-g-left') && !n.hasAttribute('data-source-g-active'))))
    await page.evaluate(() => { window.oldActors=[...document.querySelectorAll('[data-source-g-circle]')]; window.oldHost=document.querySelector('#study'); renderStudy('vision','preview',false,'section') }); await page.waitForTimeout(250)
    verify('Retained HOCs rebind motion to replacement native hosts', await page.evaluate(() => document.querySelector('#study') !== oldHost && document.querySelector('#study').tagName === 'SECTION' && document.querySelector('#study').dataset.sourceGRunning === 'true' && [...document.querySelectorAll('[data-source-g-circle]')].every(n => n.tagName === 'SECTION' && n.dataset.sourceGActive==='true')))
    verify('Replacement releases detached circle hosts and their motion styles', await page.evaluate(() => oldActors.every(n => !n.isConnected && n.style.left === '17px' && n.style.top === '23px' && n.style.transform === '')))
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(100); a = await page.evaluate(() => readStudy())
    fs.writeFileSync(out+'/reduced-state.json',JSON.stringify(a,null,2));
    verify('Reduced motion restores the authored native pose and stops RAF', a.running === 'false' && a.actors.every(n => n.rect.join(',') === '17,23,101,101'))
    await page.evaluate(() => { document.querySelector('[data-source-g-circle]').style.transform='translateX(14px) rotateY(70deg)' })
    verify('Reduced pose takes precedence over retained native inline loop transforms', await page.evaluate(() => getComputedStyle(document.querySelector('[data-source-g-circle]')).transform === 'none'))
    await page.evaluate(() => { document.querySelector('[data-source-g-circle]').style.transform='' })
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(200)
    verify('Motion preference can resume without remounting', (await page.evaluate(() => readStudy())).running === 'true')
    for (const target of ['canvas','export','thumbnail']) {
        await page.evaluate(t => renderStudy('expertise',t), target); await page.waitForTimeout(180); a = await page.evaluate(() => readStudy())
        verify(target + ' retains its editable authored geometry without animation', a.paints === 0 && a.actors.every(n => n.rect.join(',') === '17,23,101,101'))
    }
    await page.evaluate(() => renderStudy('experience','preview',true)); await page.waitForTimeout(180)
    verify('Static renderer also freezes a Preview target', (await page.evaluate(() => readStudy())).paints === 0)
    await page.evaluate(() => renderHomeCells()); await page.waitForTimeout(2400)
    verify('Separate native Home cells fit source Desktop padding at1440', await page.evaluate(() => Math.abs(document.querySelector('[data-source-g-motion="home-left"]').getBoundingClientRect().width - 280) < 1 && Math.abs(document.querySelector('[data-source-g-motion="home-left"] [data-source-g-circle]').getBoundingClientRect().width - 268.8) < 1))
    await page.setViewportSize({width:1280,height:720}); await page.waitForTimeout(120)
    verify('Settled native Home remains sharp/responsive without another animation', await page.evaluate(() => Math.abs(document.querySelector('[data-source-g-motion="home-left"]').getBoundingClientRect().width - 200) < 1 && document.querySelector('[data-source-g-motion="home-left"]').dataset.sourceGRunning === 'false'))
    await page.setViewportSize({width:390,height:844});await page.evaluate(() => renderHomeCells());await page.waitForTimeout(250)
    verify('Source Phone Home uses30px padding per half field', await page.evaluate(() => Math.abs(document.querySelector('[data-source-g-motion="home-left"]').getBoundingClientRect().width - 135) < 1))
    await page.evaluate(() => renderStudy('vision'));await page.waitForTimeout(180)
    verify('Source Phone Vision retains65% graphic width and23 native circles', await page.evaluate(() => Math.abs(document.querySelector('#study').clientWidth - 253.5) < 1 && document.querySelectorAll('[data-source-g-circle]').length === 23))
    await page.evaluate(() => renderStudy('contact'));await page.waitForTimeout(180)
    verify('Source Phone Contact uses the observed100-by110 world', await page.evaluate(() => document.querySelector('#study').clientWidth === 390 && Math.abs(document.querySelector('#study').clientHeight - 429) < 1))
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(100)
    fs.writeFileSync(out+'/phone-reduced-state.json',JSON.stringify(await page.evaluate(()=>({w:document.querySelector('#study').clientWidth,h:document.querySelector('#study').clientHeight,style:document.querySelector('#study').getAttribute('style'),read:readStudy()})),null,2))
    verify('Phone reduced motion preserves authored group dimensions and native shape positions', await page.evaluate(() => document.querySelector('#study').clientWidth === 480 && document.querySelector('#study').clientHeight === 480 && readStudy().actors.every(n => n.rect.join(',') === '17,23,101,101')))
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.setViewportSize({width:1440,height:900});await page.evaluate(() => renderStudy('vision')); await page.waitForTimeout(180)
    await page.evaluate(() => { window.detachedActors=[...document.querySelectorAll('[data-source-g-circle]')]; app.unmount() }); await page.waitForTimeout(100)
    verify('Unmount restores native styles on detached retained nodes', await page.evaluate(() => detachedActors.every(n => n.style.left==='17px' && n.style.top==='23px' && n.style.width==='101px' && n.style.transform==='' && !n.style.getPropertyValue('--source-g-left') && !n.hasAttribute('data-source-g-active'))))
    verify('Browser has no uncaught implementation errors', errors.length === 0)
    const result = { passed: true, scope: 'Local ReactDOM native-like Framer HOC fixture; not actual Framer Preview/reload', source: { path:file, bytes:Buffer.byteLength(source), sha256:crypto.createHash('sha256').update(source).digest('hex') }, checks, errors, snapshots }
    fs.writeFileSync(out+'/result.json',JSON.stringify(result,null,2)+'\n'); console.log(JSON.stringify({passed:true,checks:checks.length,evidence:out+'/result.json'}))
} finally { await context.close(); await browser.close() }
