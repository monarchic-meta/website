import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url), ts = require('typescript')
const repo = fileURLToPath(new URL('../', import.meta.url))
const file = path.join(repo, 'docs/design-studies/code-components/SourceTypeProximity.tsx')
const source = fs.readFileSync(file, 'utf8'), hash = b => crypto.createHash('sha256').update(b).digest('hex')
const checks = [], check = (name, fn) => { fn(); checks.push(name) }
const reactStub = `
export interface CSSProperties {transition?:string;transitionProperty?:string;transitionDuration?:string;transitionTimingFunction?:string;transitionDelay?:string;fontVariationSettings?:string}
export type MouseEventHandler<T> = (event:MouseEvent<T>)=>void;
export interface MouseEvent<T>{clientX:number;clientY:number;defaultPrevented:boolean;currentTarget:T}
export type ComponentType<P> = (props:P)=>unknown;
export interface Context<T>{Provider:ComponentType<{value:T;children?:unknown}>;__type?:T}
export function createContext<T>(v:T):Context<T>;
export function useContext<T>(v:Context<T>):T;
export function useRef<T>(v:T):{current:T};
export function useState<T>(v:T):[T,(v:T|((p:T)=>T))=>void];
export function useEffect(f:()=>void|(()=>void),d:unknown[]):void;
export const useLayoutEffect:typeof useEffect;
export function useMemo<T>(f:()=>T,d:unknown[]):T;
export function useCallback<T extends Function>(f:T,d:unknown[]):T;
export function useId():string;
export function forwardRef<T,P>(f:(props:P,ref:((node:T|null)=>void)|{current:T|null}|null)=>unknown):ComponentType<P>;
export function createElement(...args:unknown[]):unknown;
export const Fragment:ComponentType<{children?:unknown}>;
declare global{namespace JSX{interface IntrinsicElements{style:{children?:string}}}}
`
const definitions = new Map([[path.join(repo, '__type-react.d.ts'), reactStub], [path.join(repo, '__type-framer.d.ts'), 'export const RenderTarget:{canvas:string;current():string};export function useIsStaticRenderer():boolean;']])
check('Strict semantic TypeScript with DOM and constrained CSSProperties', () => {
    const options = { strict:true, noEmit:true, skipLibCheck:true, target:ts.ScriptTarget.ES2022, module:ts.ModuleKind.ESNext, moduleResolution:ts.ModuleResolutionKind.Node10, jsx:ts.JsxEmit.React, baseUrl:repo, paths:{react:['__type-react.d.ts'],framer:['__type-framer.d.ts']} }
    const host = ts.createCompilerHost(options), read = host.readFile.bind(host), exists = host.fileExists.bind(host)
    host.readFile = p => definitions.get(p) ?? read(p)
    host.fileExists = p => definitions.has(p) || exists(p)
    host.getSourceFile = (p,v) => {const s=host.readFile(p);return s===undefined?undefined:ts.createSourceFile(p,s,v,true)}
    const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([file], options, host))
    assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {getCurrentDirectory:()=>repo,getCanonicalFileName:x=>x,getNewLine:()=> '\n'}))
})
const ast = ts.createSourceFile('source.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const functionText = name => ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name)?.getText(ast)
const pure = ts.transpileModule('const MIN_WEIGHT=400,MAX_WEIGHT=900,RADIUS=20;'+functionText('weightAt')+functionText('cssList'), {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText
const math = vm.runInNewContext(pure+';({weightAt,cssList})')
check('Exact source-authored radius, Euclidean smoothstep bins and range', () => {
    const r={left:0,top:0,width:40,height:80}
    for (const [x,y,expected] of [[20,40,900],[20,50,650],[30,40,650],[20,60,400],[50,80,400]]) assert.equal(math.weightAt({x,y},r),expected)
    assert.equal(math.weightAt(null,r),400);assert.equal(math.weightAt({x:20,y:40},null),400)
    for(let i=0;i<100;i++){const d=i*.25,f=Math.max(0,1-d/20),expected=Math.round(400+(3*f*f-2*f*f*f)*500);assert.equal(math.weightAt({x:20+d,y:40},r),expected)}
})
check('Transition parsing preserves functional easing commas', () => {
    assert.deepEqual(Array.from(math.cssList('linear, cubic-bezier(.3, .1, .4, 1), steps(3, end)')),['linear','cubic-bezier(.3, .1, .4, 1)','steps(3, end)'])
})
check('Actual React18 server rendering is window-free and frozen', () => {
    const React = require('react'), server = require('react-dom/server')
    const exports = {}, compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText
    vm.runInNewContext(compiled,{exports,require:name=>name==='react'?React:{RenderTarget:{canvas:'canvas',current:()=> 'export'},useIsStaticRenderer:()=>true}})
    const Native=React.forwardRef((props,ref)=>React.createElement('div',{...props,ref}))
    const Word=exports.withSourceTypeWord(Native), Letter=exports.withSourceTypeLetter(Native)
    const html=server.renderToStaticMarkup(React.createElement(Word,{title:'native caller'},React.createElement(Letter,{style:{transition:'opacity 2s linear'}},React.createElement('p',null,'A'))))
    assert.match(html,/data-source-type-weight="400"/);assert.match(html,/--source-type-weight:400/);assert.match(html,/opacity 2s linear/);assert.match(html,/native caller/)
})
check('Self-contained public overrides allocate no renderer/font/network resources', () => {
    assert.doesNotMatch(source,/\bfetch\(|XMLHttpRequest|querySelector|getElementById|new Image|createElement\(["']canvas|\.getContext\(|@ts-ignore|\bas any\b/)
    assert.match(source,/CSS\.registerProperty/);assert.match(source,/measureLetters\(\)/)
    assert.deepEqual(Array.from(source.matchAll(/export function (\w+)/g),m=>m[1]),['withSourceTypeWord','withSourceTypeLetter'])
})
check('Compiled JS and declaration fit the Framer file limit', () => {
    const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.React}}).outputText
    const dts=ts.transpileDeclaration(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText
    assert.ok(Buffer.byteLength(js)+Buffer.byteLength(dts)<1048576)
})
console.log(JSON.stringify({passed:true,sourceSHA256:hash(source),sourceBytes:Buffer.byteLength(source),testSHA256:hash(fs.readFileSync(import.meta.filename)),checks,scope:'Strict types, mathematical falloff, CSS-list preservation, actual React18 SSR and bounded public self-contained API. Actual browser pixels/interaction are checked separately.'},null,2))
