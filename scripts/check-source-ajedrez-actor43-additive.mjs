import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import vm from 'node:vm'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const repo = process.env.MONARCHIC_REPO_ROOT ?? fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(path.join(repo, 'package.json')), ts = require('typescript')
const sourcePath = process.env.MONARCHIC_AJEDREZ_SOURCE_PATH ?? path.join(repo, 'docs/design-studies/code-components/SourceAjedrezSequence.tsx')
const fixturePath = process.env.MONARCHIC_AJEDREZ_WORD_FITS_FIXTURE_PATH ?? path.join(repo, 'scripts/fixtures/source-ajedrez-two-track-extension.json')
const source = fs.readFileSync(sourcePath, 'utf8'), fixture = JSON.parse(fs.readFileSync(fixturePath))
const actor3FixturePath = process.env.MONARCHIC_AJEDREZ_ACTOR3_FIXTURE_PATH ?? path.join(repo, "scripts/fixtures/source-ajedrez-actor3-additive.json")
const actor3InversePath = process.env.MONARCHIC_AJEDREZ_ACTOR3_INVERSE_PATH ?? path.join(repo, "docs/design-studies/code-components/assets/source-ajedrez-actor3-additive-inverse.json")
const actor3Fixture = JSON.parse(fs.readFileSync(actor3FixturePath)), actor3Inverse = JSON.parse(fs.readFileSync(actor3InversePath))
const actor3Rows = new Map(actor3Fixture.rows.map(row => [row.frame, row]))
const actor3Correspondence = JSON.parse(fs.readFileSync(path.join(repo, actor3Fixture.dataset.path)))
const actor43FixturePath = process.env.MONARCHIC_AJEDREZ_ACTOR43_FIXTURE_PATH ?? path.join(repo,"scripts/fixtures/source-ajedrez-actor43-additive.json")
const actor43InversePath = process.env.MONARCHIC_AJEDREZ_ACTOR43_INVERSE_PATH ?? path.join(repo,"docs/design-studies/code-components/assets/source-ajedrez-actor43-additive-inverse.json")
const actor43Fixture = JSON.parse(fs.readFileSync(actor43FixturePath)), actor43Inverse = JSON.parse(fs.readFileSync(actor43InversePath))
const actor43Rows = new Map(actor43Fixture.rows.map(row=>[row.frame,row]))
const actor43Review = JSON.parse(fs.readFileSync(path.join(repo,actor43Fixture.review.path)))
const oldFixture = JSON.parse(fs.readFileSync(path.join(repo, 'docs/design-studies/code-components/assets/source-ajedrez-type-grid-provenance.json')))
const output = process.env.MONARCHIC_AJEDREZ_ACTOR43_EVIDENCE_DIR ?? process.env.MONARCHIC_AJEDREZ_ACTOR3_EVIDENCE_DIR ?? process.env.MONARCHIC_AJEDREZ_WORD_EXTENSION_EVIDENCE_DIR ?? process.env.MONARCHIC_AJEDREZ_WORD_FITS_EVIDENCE_DIR ?? '/tmp/monarchic-ajedrez-actor43-additive'
fs.mkdirSync(output, { recursive: true })
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
assert.equal(hash(fs.readFileSync(path.join(repo,actor3Fixture.dataset.path))),actor3Fixture.dataset.sha256,'Portable source correspondence proof hash')
assert.equal(hash(fs.readFileSync(actor3InversePath)),actor3Fixture.inverse.sha256,'Portable actor3 inverse hash')
const historicalCheckerProof = fs.readFileSync(path.join(repo, "scripts/fixtures/source-ajedrez-actor3-preimages/check-source-ajedrez-two-track-extension.mjs.txt"))
assert.equal(hash(historicalCheckerProof), "4da6430b97e3225f4ccd53fb5f78b534dc1129dd185e2846f56769a724aea3f8", 'Frozen historical40 proof bytes must remain exact')
assert.equal(historicalCheckerProof.length, 45236)
const historical51Proof = fs.readFileSync(path.join(repo,"scripts/fixtures/source-ajedrez-actor43-preimages/check-source-ajedrez-actor3-additive.mjs.txt"))
assert.equal(hash(historical51Proof),'07056f0d6f7058a5902ac2972787cd7f67789f55993ffd26b25ef8a40724face')
assert.equal(hash(fs.readFileSync(path.join(repo,actor43Fixture.review.path))),actor43Fixture.review.sha256)
assert.equal(hash(fs.readFileSync(actor43InversePath)),actor43Fixture.inverse.sha256)
const pins = { actor43FixtureSHA256: hash(fs.readFileSync(actor43FixturePath)), actor43InverseSHA256: hash(fs.readFileSync(actor43InversePath)), historical51SHA256: hash(historical51Proof), historical40SHA256: hash(historicalCheckerProof), actor3FixtureSHA256: hash(fs.readFileSync(actor3FixturePath)), actor3InverseSHA256: hash(fs.readFileSync(actor3InversePath)), sourceSHA256: hash(source), sourceBytes: Buffer.byteLength(source), checkerSHA256: hash(fs.readFileSync(import.meta.filename)), fixtureSHA256: hash(fs.readFileSync(fixturePath)) }
const checks = [], reports = [], errors = [], requests = []
const check = (name, value) => { assert.ok(value, name); checks.push(name) }
const compilerOptions = { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React }
let browser, server
try {
    let parent837 = source
    for (const patch of [...actor43Inverse.patches].reverse()) {
        assert.equal(parent837.split(patch.after).length-1,1,patch.name+': exact actor43 inverse')
        parent837=parent837.replace(patch.after,()=>patch.before)
    }
    check('The actor43 private branch restores exact837c before all existing actor3/two-track lineages', hash(parent837)===actor43Inverse.parent.sha256 && Buffer.byteLength(parent837)===actor43Inverse.parent.bytes)
    assert.equal(hash(source),actor43Fixture.candidate.sha256)
    assert.equal(Buffer.byteLength(source),actor43Fixture.candidate.bytes)
    let parent8ad = parent837
    for (const patch of [...actor3Inverse.patches].reverse()) {
        assert.equal(parent8ad.split(patch.after).length - 1, 1, patch.name + ': exact actor3 inverse')
        parent8ad = parent8ad.replace(patch.after, patch.before)
    }
    check('The additive actor3 branch restores byte-exact canonical8ad before the historical two-track lineage', hash(parent8ad) === actor3Inverse.parent.sha256 && Buffer.byteLength(parent8ad) === actor3Inverse.parent.bytes)
    assert.equal(hash(parent837), actor3Fixture.candidate.sha256)
    assert.equal(Buffer.byteLength(parent837), actor3Fixture.candidate.bytes)
    let previous = parent8ad
    for (const patch of fixture.inversePatches) {
        assert.equal(previous.split(patch.after).length - 1, 1, patch.name + ': exact inverse occurrence')
        previous = previous.replace(patch.after, patch.before)
    }
    check('Only the reviewed74-frame table/gap/perimeter changes differ from frozen E1', hash(previous) === fixture.parent.sha256 && Buffer.byteLength(previous) === fixture.parent.bytes)
    let a804 = previous
    for (const patch of fixture.previousArrivalLineage.patches) {
        assert.equal(a804.split(patch.after).length - 1, 1, patch.name + ': historical E1 inverse')
        a804 = a804.replace(patch.after, patch.before)
    }
    check('The retained E1→a804 inverse also remains exact, keeping both genuine historical lineages distinct', hash(a804) === fixture.previousArrivalLineage.parent.sha256 && Buffer.byteLength(a804) === fixture.previousArrivalLineage.parent.bytes)
    const ast = text => ts.createSourceFile('source.tsx', text, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX)
    const publicBodies = text => ast(text).statements.filter(node => ts.isFunctionDeclaration(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)).map(node => [node.name.text, node.getText()])
    const oldBodies = publicBodies(previous), bodies = publicBodies(source)
    check('All46 public override names/types remain; the45 unrelated public bodies are byte-exact', bodies.length === 46 && JSON.stringify(bodies.map(([name]) => name)) === JSON.stringify(oldBodies.map(([name]) => name)) && bodies.every(([name, body], index) => name === 'withAjedrezTypeGridMotion' || body === oldBodies[index][1]))
    check('All46 current8ad public HOC bodies remain byte-exact after the private actor3 addition', JSON.stringify(publicBodies(source)) === JSON.stringify(publicBodies(parent8ad)))
    check('All46 current837c public HOC bodies remain byte-exact after the private actor43 addition', JSON.stringify(publicBodies(source))===JSON.stringify(publicBodies(parent837)))
    const weakRegion = text => text.slice(text.indexOf('const AJEDREZ_TYPE_MEASURED_OWNERS'), text.indexOf('function ajedrezTypeTrackedActor'))
    check('The retained module-host weak owner and measured frame clock bytes remain exact', weakRegion(source) === weakRegion(parent8ad))
    const photoMarker = '\n// Source-cut photographic compositions.'
    check('All166 photo poses/material/controller bytes and the master clock stay unchanged', source.slice(source.indexOf(photoMarker)) === previous.slice(previous.indexOf(photoMarker)) && source.slice(0, source.indexOf('// Source-sampled HERO-002 type-grid')) === previous.slice(0, previous.indexOf('// Source-sampled HERO-002 type-grid')))
    const tableOf = text => text.slice(text.indexOf('const AJEDREZ_TYPE_WORDS'), text.indexOf('/** Attach only to the existing phase36'))
    const pureJS = ts.transpileModule(tableOf(source), { compilerOptions: { ...compilerOptions, module: ts.ModuleKind.None } }).outputText
    const pure = vm.runInNewContext(pureJS + ';({AJEDREZ_TYPE_WORDS,AJEDREZ_TYPE_RULES,AJEDREZ_TYPE_SAMPLES,AJEDREZ_TYPE_MEASURED_FITS,AJEDREZ_TYPE_ACTOR3_FITS,AJEDREZ_TYPE_ACTOR43_FITS,ajedrezTypeSample,ajedrezTypeMeasuredOwner,ajedrezTypeTrackedActor,ajedrezTypeMeasuredFrame,ajedrezTypeMeasuredFit,ajedrezInsetScoreVisible})')
    const oldPure = vm.runInNewContext(ts.transpileModule(tableOf(previous), { compilerOptions: { ...compilerOptions, module: ts.ModuleKind.None } }).outputText + ';({AJEDREZ_TYPE_WORDS,AJEDREZ_TYPE_RULES,AJEDREZ_TYPE_SAMPLES,ajedrezTypeSample,ajedrezTypeMeasuredFrame,ajedrezTypeMeasuredFit})')
    for (const key of ['AJEDREZ_TYPE_WORDS', 'AJEDREZ_TYPE_RULES', 'AJEDREZ_TYPE_SAMPLES']) assert.deepEqual(JSON.parse(JSON.stringify(pure[key])), JSON.parse(JSON.stringify(oldPure[key])))
    check('All84 independent identities,24 rules and12 representative samples remain exact', pure.AJEDREZ_TYPE_WORDS.length === 84 && oldFixture.words.length === 84 && pure.AJEDREZ_TYPE_RULES.length === 24 && pure.AJEDREZ_TYPE_SAMPLES.length === 12)
    const parentPure = vm.runInNewContext(ts.transpileModule(tableOf(parent8ad), { compilerOptions: { ...compilerOptions, module: ts.ModuleKind.None } }).outputText + ';({AJEDREZ_TYPE_MEASURED_FITS,ajedrezTypeMeasuredFit,ajedrezTypeTrackedActor})')
    assert.deepEqual(JSON.parse(JSON.stringify(pure.AJEDREZ_TYPE_MEASURED_FITS)), JSON.parse(JSON.stringify(parentPure.AJEDREZ_TYPE_MEASURED_FITS)))
    const parent837Pure = vm.runInNewContext(ts.transpileModule(tableOf(parent837),{compilerOptions:{...compilerOptions,module:ts.ModuleKind.None}}).outputText+';({AJEDREZ_TYPE_MEASURED_FITS,AJEDREZ_TYPE_ACTOR3_FITS,ajedrezTypeMeasuredFit})')
    assert.deepEqual(JSON.parse(JSON.stringify(pure.AJEDREZ_TYPE_ACTOR3_FITS)),JSON.parse(JSON.stringify(parent837Pure.AJEDREZ_TYPE_ACTOR3_FITS)))
    for(const row of actor43Fixture.rows){
        assert.deepEqual(JSON.parse(JSON.stringify(pure.AJEDREZ_TYPE_ACTOR43_FITS[row.frame-1152])),row.point)
        const got=pure.ajedrezTypeMeasuredFit(row.frame,43),observed=actor43Review.reviewed.find(record=>record.frame===row.frame)
        assert.deepEqual(got?JSON.parse(JSON.stringify(got)):null,row.point?{left:row.point[0],top:row.point[1],width:row.point[2]}:null)
        if(row.point){assert.ok(observed);assert.equal(observed.verdict,'SOURCE_REVIEW_SUPPORTED_PENDING_ROOT_ACCEPTANCE');assert.deepEqual(observed.cropRectangle,row.sourceCandidateBounds);assert.equal(observed.sourceCandidateIndex,row.sourceCandidateIndex);assert.deepEqual(row.point,[observed.cropRectangle[0],observed.cropRectangle[1]-3.5,observed.cropRectangle[2]])}
        for(const index of [60,25,3])assert.deepEqual(JSON.parse(JSON.stringify(pure.ajedrezTypeMeasuredFit(row.frame,index))),JSON.parse(JSON.stringify(parent837Pure.ajedrezTypeMeasuredFit(row.frame,index))))
    }
    for(const frame of [1208,1222])assert.equal(pure.ajedrezTypeMeasuredFit(frame,43),null)
    check('Exactly62 actor43 crop-rectangle fits and12 baseline nulls preserve all195 existing placements and27 gaps',actor43Fixture.rows.length===74&&actor43Fixture.rows.filter(row=>row.point).length===62&&actor43Fixture.rows.filter(row=>!row.point).length===12)
    const actor43Held=oldPure.ajedrezTypeSample(1169/24),actor43Measured=pure.ajedrezTypeMeasuredFit(1169,43)
    check('The source-viewed1169 actor43 fit rejects the old held1172 baseline by more than150 logical pixels',Math.hypot(actor43Measured.left-actor43Held.xy[86],actor43Measured.top-actor43Held.xy[87])>150)
    for (const row of actor3Fixture.rows) {
        assert.deepEqual(JSON.parse(JSON.stringify(pure.AJEDREZ_TYPE_ACTOR3_FITS[row.frame - 1152])), row.point)
        const crop = actor3Correspondence.admitted.find(record => record.frame === row.frame)
        if (row.point) {
            assert.ok(crop, 'Every admitted row has local source-crop evidence')
            assert.equal(crop.sourceCandidateIndex,row.sourceCandidateIndex)
            assert.deepEqual(crop.cropRectangle,row.sourceCandidateBounds)
            assert.deepEqual(row.point,[crop.cropRectangle[0],crop.cropRectangle[1]-3.5,crop.cropRectangle[2]])
            assert.equal(crop.maskMetadata.height,crop.cropRectangle[3])
            assert.equal(crop.maskMetadata.width,crop.cropRectangle[2])
            assert.match(crop.maskMetadata.rowTextSHA256,/^[a-f0-9]{64}$/)
            assert.ok(crop.maskMetadata.emptyRows.every(index=>Number.isInteger(index)&&index>=0&&index<crop.cropRectangle[3]))
        } else assert.equal(crop,undefined,'Null rows are excluded from local admissions')
        const point = pure.ajedrezTypeMeasuredFit(row.frame, 3)
        assert.deepEqual(point ? JSON.parse(JSON.stringify(point)) : null, row.point ? { left: row.point[0], top: row.point[1], width: row.point[2] } : null)
        for (const index of [60,25]) assert.deepEqual(JSON.parse(JSON.stringify(pure.ajedrezTypeMeasuredFit(row.frame,index))), JSON.parse(JSON.stringify(parentPure.ajedrezTypeMeasuredFit(row.frame,index))))
    }
    for (const frame of [1210,1211,1212]) assert.equal(pure.ajedrezTypeMeasuredFit(frame,3),null)
    check('Exactly51 reviewed actor3 crop-rectangle fits and23 baseline nulls preserve all144 old fits and4 original gaps', actor3Fixture.rows.length === 74 && actor3Fixture.rows.filter(row => row.point).length === 51 && actor3Fixture.rows.filter(row => !row.point).length === 23)
    const actor3Baseline = oldPure.ajedrezTypeSample(1169/24), actor3Negative = pure.ajedrezTypeMeasuredFit(1169,3)
    check('The viewed1169 actor3 fit rejects the old held1172 baseline by more than350 logical pixels', Math.hypot(actor3Negative.left-actor3Baseline.xy[6],actor3Negative.top-actor3Baseline.xy[7]) > 350)
    for (const row of fixture.rows) for (let index = 0; index < 84; index++) {
        if (index === 3 || index === 43) continue // Separate exact oracles own only these two additions.
        const expected = row.positions.find(position => position[0] === index)
        const got = pure.ajedrezTypeMeasuredFit(row.frame, index)
        assert.deepEqual(got ? JSON.parse(JSON.stringify(got)) : null, expected ? { left: expected[1], top: expected[2], width: expected[3] } : null)
    }
    for (const time of [0, 1151 / 24, 1152 / 24 - 1e-5, 1226 / 24, NaN, Infinity, -1]) assert.equal(pure.ajedrezTypeMeasuredFrame(time), -1)
    for (const n of fixture.rows.map(row => row.frame)) {
        assert.equal(pure.ajedrezTypeMeasuredFrame(n / 24), n)
        assert.equal(pure.ajedrezTypeMeasuredFrame((n + .99) / 24), n)
    }
    for (let index = 0; index < 84; index++) assert.equal(pure.ajedrezTypeTrackedActor(index), (fixture.actorIndices.includes(index) || index === 3 || index === 43))
    check('All144 measured actor-frame fits and4null gaps cover exactly74 literal frames1152..1225; historical actors60/25 remain unchanged and actor3 is checked separately', pure.AJEDREZ_TYPE_MEASURED_FITS.length === 74 && fixture.rows.reduce((count, row) => count + row.positions.length, 0) === 144)
    const hostA = {}, hostB = {}
    check('One weak module-local dependency token is stable per host, distinct for replacement hosts, and null for no host', pure.ajedrezTypeMeasuredOwner(hostA) === pure.ajedrezTypeMeasuredOwner(hostA) && pure.ajedrezTypeMeasuredOwner(hostA) !== pure.ajedrezTypeMeasuredOwner(hostB) && pure.ajedrezTypeMeasuredOwner(null) === null)
    const held = pure.ajedrezTypeSample(1169 / 24)
    assert.equal(held.sourceFrame, 1172)
    for (const actor of fixture.actors) {
        const index = actor.nativeActor.wordIndex, anchor = actor.poses.find(pose => pose.frame === 1172).logical480
        assert.deepEqual(anchor, { left: held.xy[index * 2], top: held.xy[index * 2 + 1], sourceWidth: held.widths[index] })
        assert.equal(actor.retainedAnchorEvidence.reviewNeeded, false)
        for (const frame of [1169,1170,1171,1172,1173]) assert.deepEqual(JSON.parse(JSON.stringify(pure.ajedrezTypeMeasuredFit(frame, index))), JSON.parse(JSON.stringify(oldPure.ajedrezTypeMeasuredFit(frame, index))))
        const changed = actor.poses.find(pose => pose.frame === fixture.negativeFrame).logical480, baseline = oldPure.ajedrezTypeSample(fixture.negativeFrame / 24)
        assert.ok(Math.hypot(changed.left - baseline.xy[index * 2], changed.top - baseline.xy[index * 2 + 1]) > 150)
    }
    check('All ten E1fits/1172anchors remain exact; the E1held baseline at1177 misses both new measured positions by>150logicalpx', true)
    const historicalFrames = [1152,1154,1165,1172,1176,1187,1192,1196,1204,1208,1217,1224]
    const historicalFlags = [[true,true,true,false,false,true,false,true,true,true,true,true],[false,false,false,false,false,true,false,false,false,true,false,false]]
    for (let index = 0; index < fixture.actors.length; index++) assert.deepEqual(fixture.actors[index].historicalNativeAssociations.map(row => [row.frame, row.reviewNeeded]), historicalFrames.map((frame, n) => [frame, historicalFlags[index][n]]))
    check('All12 historical association flags per actor stay literal, including every unresolved original native fit', true)
    for (const frame of [1192, 1193, 1194, 1195, 1196]) assert.equal(pure.ajedrezInsetScoreVisible(frame / 24), frame >= 1193 && frame < 1196)
    const owned = source.slice(source.indexOf('// Two source-glyph geometry tracks'), source.indexOf(photoMarker))
    check('The sparse fit adds no timer/RAF/media/GPU/import or DOM search beyond the existing host-scoped controller', !/requestAnimationFrame|setTimeout|setInterval|fetch\(|getContext\(|new Image|import\s/.test(owned) && (owned.match(/new ResizeObserver/g) ?? []).length === 1 && (owned.match(/new MutationObserver/g) ?? []).length === 1)
    const reactTypes = `export type ReactNode=unknown;export interface CSSProperties{opacity?:number;visibility?:string;pointerEvents?:string;transition?:string;zoom?:number|string};export type ComponentType<P>=(p:P)=>unknown;export type ForwardedRef<T>=((n:T|null)=>void)|{current:T|null}|null;export interface MouseEvent<T>{defaultPrevented:boolean;currentTarget:T;preventDefault():void};export interface KeyboardEvent<T>extends MouseEvent<T>{key:string};export type MouseEventHandler<T>=(e:MouseEvent<T>)=>void;export type KeyboardEventHandler<T>=(e:KeyboardEvent<T>)=>void;export interface Context<T>{Provider:ComponentType<{value:T;children?:unknown}>;__type?:T};export function createContext<T>(v:T):Context<T>;export function useContext<T>(v:Context<T>):T;export function useRef<T>(v:T):{current:T};export function useRef<T>(v:T|null):{readonly current:T|null};export function useState<T>(v:T):[T,(v:T|((p:T)=>T))=>void];export function useEffect(f:()=>void|(()=>void),d:unknown[]):void;export function useLayoutEffect(f:()=>void|(()=>void),d:unknown[]):void;export function useCallback<T extends Function>(f:T,d:unknown[]):T;export function forwardRef<T,P>(f:(p:P,r:ForwardedRef<T>)=>unknown):ComponentType<P>;export function createElement(...a:unknown[]):unknown;declare global{namespace JSX{interface IntrinsicElements{[tag:string]:{[name:string]:unknown}}}}`
    const declarations = new Map([[path.join(repo, '__measured-react.d.ts'), reactTypes], [path.join(repo, '__measured-framer.d.ts'), 'export const RenderTarget:{canvas:string;export:string;thumbnail:string;current():string};export function useIsStaticRenderer():boolean;']])
    const strictOptions = { strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2020, lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'], module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Node10, jsx: ts.JsxEmit.React, baseUrl: repo, paths: { react: ['__measured-react.d.ts'], framer: ['__measured-framer.d.ts'] } }
    const host = ts.createCompilerHost(strictOptions), readFile = host.readFile.bind(host), exists = host.fileExists.bind(host)
    host.readFile = file => file === sourcePath ? source : declarations.get(file) ?? readFile(file)
    host.fileExists = file => declarations.has(file) || exists(file)
    host.getSourceFile = (file, languageVersion) => { const text = host.readFile(file); return text === undefined ? undefined : ts.createSourceFile(file, text, languageVersion, true) }
    const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([sourcePath], strictOptions, host))
    assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory: () => repo, getCanonicalFileName: value => value, getNewLine: () => '\n' }))
    check('The complete candidate passes strict ES2020/DOM semantic types with nullable/readonly React18 ref overloads', true)
    const js = ts.transpileModule(source, { compilerOptions }).outputText, previousJS = ts.transpileModule(previous, { compilerOptions }).outputText
    const React = require('react'), renderer = require('react-dom/server')
    for (const target of ['canvas', 'export', 'thumbnail']) {
        const sandbox = { exports: {}, require: name => name === 'react' ? React : { RenderTarget: { canvas: 'canvas', export: 'export', thumbnail: 'thumbnail', current: () => target }, useIsStaticRenderer: () => true } }
        vm.runInNewContext(js, sandbox)
        const Native = React.forwardRef((props, ref) => React.createElement('section', { ...props, ref }))
        const Grid = sandbox.exports.withAjedrezTypeGridMotion(Native)
        const html = renderer.renderToStaticMarkup(React.createElement(Grid, { title: 'caller preserved', style: { left: 7, transform: 'scale(.8)' }, 'data-caller': 'preserved' }, React.createElement('b', null, 'editable native content')))
        assert.ok(html.includes('caller preserved') && html.includes('editable native content') && html.includes('left:7px') && html.includes('scale(.8)') && html.includes('data-caller="preserved"'))
        assert.equal(Object.keys(sandbox.exports).length, 46)
    }
    check('Actual React18 SSR preserves caller style/attrs/editable content and all46 exports for every static target', true)
    const staticResult = { passed: true, ...pins, checks: [...checks], scope: 'Actor43 62/12 proof plus preserved actor3 51/23 and historical two-track144/4 oracles; no browser/native/actualPreview claim.' }
    fs.writeFileSync(path.join(output, 'static-result.json'), JSON.stringify(staticResult, null, 2) + '\n')
    if (process.argv.includes('--static-only')) { console.log(JSON.stringify(staticResult, null, 2)); process.exit(0) }

    const mediaRoot = process.env.MONARCHIC_AJEDREZ_WORD_MEDIA_ROOT ?? path.join(repo, 'scripts/fixtures/source-ajedrez-word-frames')
    const media = new Map(fixture.sourceFrames.map(frame => {
        const file = path.join(mediaRoot, frame.relativePath), bytes = fs.readFileSync(file)
        assert.equal(hash(bytes), frame.sha256, frame.relativePath + ' exact cached source bytes')
        assert.equal(bytes.length, frame.bytes)
        assert.equal(bytes.readUInt32BE(16), 480); assert.equal(bytes.readUInt32BE(20), 852)
        return [frame.frame, bytes]
    }))
    check('All declared source-context/overlap comparison PNGs retain their exact bytes and480×852 dimensions', media.size === fixture.sourceFrames.length)
    server = http.createServer((request, response) => {
        if (request.url === '/' || request.url === '/fixture.html') { response.writeHead(200, { 'Content-Type': 'text/html' }); response.end('<!doctype html><div id="app"></div>'); return }
        if (request.url === '/favicon.ico') { response.writeHead(204); response.end(); return }
        const match = /^\/frame-(\d+)\.png$/.exec(request.url)
        if (match && media.has(Number(match[1]))) { requests.push(request.url); response.writeHead(200, { 'Content-Type': 'image/png' }); response.end(media.get(Number(match[1]))); return }
        response.writeHead(404); response.end('Not in the bounded fixture')
    })
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    const base = 'http://127.0.0.1:' + server.address().port
    const { chromium } = require('@playwright/test')
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] })
    const context = await browser.newContext({ viewport: { width: 1100, height: 980 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    page.setDefaultTimeout(5000); page.on('pageerror', error => errors.push(error.message))
    await page.goto(base)
    await page.addStyleTag({ content: 'html,body{margin:0;background:#eee;font:12px Arial}#comparison{display:flex;gap:20px;margin:10px;width:max-content}header{height:25px}#source-field{position:relative;width:480px;height:852px}#source-frame{display:block;width:100%;height:100%}.source-box{position:absolute;border:1px solid #c25;pointer-events:none;box-sizing:border-box}.word{position:absolute;white-space:pre;width:54px;font:8px/10px monospace;color:#202724}.word p{margin:0}.rule{position:absolute;background:#999;opacity:.5}#outside{position:absolute;left:1030px;top:20px}' })
    const react = fs.readFileSync(path.join(path.dirname(require.resolve('react/package.json')), 'umd/react.development.js'), 'utf8')
    const reactDOM = fs.readFileSync(path.join(path.dirname(require.resolve('react-dom/package.json')), 'umd/react-dom.development.js'), 'utf8')
    await page.addScriptTag({ content: react }); await page.addScriptTag({ content: reactDOM })
    await page.evaluate(() => {
        document.getElementById('app').innerHTML = '<div id="comparison"><div><header id="source-label">Retained source frame</header><div id="source-field"><img id="source-frame" alt="Retained source film comparison"><div id="source-boxes"></div></div></div><div><header>Independent strings:144 historical +51 actor3 +62 actor43 fits;4 +23 +12 baseline nulls</header><div id="native-mount"></div></div></div><div id="baseline-mount" style="position:absolute;left:2000px;top:0"></div><div id="outside"></div>'
        window.__target = 'preview'; window.__frames = new Set(); window.__observers = new Set(); window.__observerCreates = 0; window.__reads = 0; window.__clicks = 0; window.__refCalls = []
        window.__oldTwoReads = 0; window.__actor3Reads = 0; window.__actor43Reads = 0; window.__otherReads = 0
        window.__originalRange = document.createRange.bind(document)
        document.createRange = () => {
            __reads++; const range = __originalRange(), select = range.selectNodeContents.bind(range); let attributed = false
            range.selectNodeContents = node => {
                if (!attributed) {
                    const element = node.nodeType === 1 ? node : node.parentElement
                    const index = Number(element?.closest('[data-native-word]')?.dataset.nativeWord)
                    if (index === 3) __actor3Reads++; else if (index === 43) __actor43Reads++; else if (index === 60 || index === 25) __oldTwoReads++; else __otherReads++
                    attributed = true
                }
                return select(node)
            }
            return range
        }
        const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window)
        window.requestAnimationFrame = callback => { const id = request(time => { __frames.delete(id); callback(time) }); __frames.add(id); return id }
        window.cancelAnimationFrame = id => { __frames.delete(id); cancel(id) }
        for (const name of ['ResizeObserver', 'MutationObserver']) { const Original = window[name]; window[name] = class extends Original { constructor(...args) { super(...args); __observerCreates++; __observers.add(this) } disconnect() { __observers.delete(this); super.disconnect() } } }
        window.require = name => name === 'react' ? React : { RenderTarget: { canvas: 'canvas', export: 'export', thumbnail: 'thumbnail', current: () => __target }, useIsStaticRenderer: () => __target !== 'preview' }
    })
    const module = (code, name, after = '') => '(()=>{const exports={};const require=window.require;' + code + after + ';window.' + name + '={exports,Context,ajedrezTypeMeasuredOwner};})()'
    await page.addScriptTag({ content: module(js, '__current') })
    await page.evaluate(({ data, evidence }) => {
        window.__data = data; window.__evidence = evidence; window.__width = 480; window.__actor3Revision = 0; window.__actor43Revision = 0; window.__sceneTag = 'section'; window.__revision = 0; window.__callbackRef = false; window.__ref = { current: null }; window.__controlledFrame = 1172
        window.__state = { time: 1172 / 24, index: 35, frozen: false, reduced: false, playing: false, active: false, complete: false, toggle() {}, replay() {} }
        const E = React.createElement
        window.NativeScene = React.forwardRef((props, ref) => {
            const u = __width / 480
            return E(__sceneTag, { ...props, ref, style: { ...props.style, position: 'relative', width: __width, height: 852 * u, background: '#b7c0bb' } },
                ...data.words.map((word, index) => E('div', { key: word.name + (index === 60 ? ':' + __revision : index === 3 ? ':actor3:' + __actor3Revision : index === 43 ? ':actor43:' + __actor43Revision : ''), 'data-framer-name': word.name, 'data-native-word': index, 'data-native-id': u === 1 ? word.desktopID : word.phoneID, className: 'word', style: { left: Math.round(word.staticLeft * u * 100) / 100, top: Math.round(word.staticTop * u * 100) / 100, width: 54 * u, fontSize: 8 * u, lineHeight: 10 * u + 'px', transition: 'opacity 2s', transform: index === 60 ? 'translateZ(0)' : undefined, transformOrigin: index === 60 ? '25% 50%' : undefined } }, E('p', null, E('span', null, word.independentText)))),
                ...data.ruleNames.map((name, index) => E('i', { key: name, 'data-framer-name': name, 'data-native-rule': index, className: 'rule', style: { left: index % 8 * 55 * u, top: 38 * u, width: 1, height: 777 * u } })),
                E('div', { 'data-framer-name': 'film-phase-36-inset-score-grid', 'data-inset': true, style: { position: 'absolute', opacity: 0, left: 267 * u, top: 621 * u, width: 200 * u, height: 215 * u } }, ...Array.from({ length: 18 }, (_, index) => E('i', { key: index, 'data-inset-part': index, style: { position: 'absolute', left: index * u, top: index * u, width: 1, height: 30 * u } }))),
                props.children)
        })
        window.Grid = __current.exports.withAjedrezTypeGridMotion(NativeScene)
        window.__root = ReactDOM.createRoot(document.getElementById('native-mount'))
        window.__render = () => ReactDOM.flushSync(() => __root.render(E(__current.Context.Provider, { value: { ...__state } }, E(Grid, { id: 'native-scene', ref: __callbackRef ? node => { __ref.current = node; __refCalls.push(node ? node.tagName : null) } : __ref, title: 'caller preserved', 'data-caller': 'preserved', onClick: () => __clicks++, style: { transform: 'translateZ(0)', outline: '1px solid #557' } }, E('strong', { 'data-caller-child': true, style: { position: 'absolute', top: 830 * (__width / 480) } }, 'editable caller child')))))
        window.__set = (frame, changes = {}) => { __controlledFrame = frame; __state = { ...__state, time: frame / 24, ...changes }; __render() }
        window.__snapshot = () => {
            const host = document.getElementById('native-scene'), hostRect = host.getBoundingClientRect(), scale = hostRect.width / host.offsetWidth
            return { width: host.offsetWidth, scale, ref: __ref.current === host, tag: host.tagName, title: host.title, caller: host.dataset.caller, transform: host.style.transform, count: Number(host.dataset.sourceAjedrezGridCount), status: host.dataset.sourceAjedrezGridStatus, sample: Number(host.dataset.sourceAjedrezGridSample), inset: host.querySelector('[data-inset]').style.opacity, insetParts: host.querySelectorAll('[data-inset-part]').length + 1, rules: [...host.querySelectorAll('[data-native-rule]')].map(node => node.getAttribute('style')), frames: __frames.size, observers: __observers.size, reads: __reads, oldTwoReads: __oldTwoReads, actor3Reads: __actor3Reads, actor43Reads: __actor43Reads, otherReads: __otherReads,
                words: [...host.querySelectorAll('[data-native-word]')].map(node => { const r = node.getBoundingClientRect(), range = __originalRange(); range.selectNodeContents(node.querySelector('span')); return { index: Number(node.dataset.nativeWord), id: node.dataset.nativeId, text: node.textContent, left: parseFloat(node.style.left), top: parseFloat(node.style.top), domLeft: (r.left - hostRect.left) / scale, domTop: (r.top - hostRect.top) / scale, glyphWidth: range.getBoundingClientRect().width / scale, style: node.getAttribute('style') } }) }
        }
        document.getElementById('outside').dataset.framerName = data.words[60].name
        __render()
    }, { data: oldFixture, evidence: fixture })
    const settle = async () => { await page.waitForTimeout(30); await page.evaluate(() => ReactDOM.flushSync(() => {})) }
    const snapshot = () => page.evaluate(() => __snapshot())
    const baselineSample = n => oldPure.ajedrezTypeSample(n / 24)
    const expected = (frame, index, width = 480) => {
        const sample = baselineSample(frame), extra = index === 43 ? actor43Rows.get(frame)?.point : index === 3 ? actor3Rows.get(frame)?.point : null, measured = extra ? [index,...extra] : fixture.rows.find(row => row.frame === frame)?.positions.find(row => row[0] === index)
        const u = width / 480
        return { left: Math.round((measured ? measured[1] : sample.xy[index * 2]) * u * 100) / 100, top: Math.round((measured ? measured[2] : sample.xy[index * 2 + 1]) * u * 100) / 100, width: (measured ? measured[3] : sample.widths[index]) * u }
    }
    const assertPose = (read, n) => {
        assert.equal(read.count, 84); assert.equal(read.words.length, 84)
        for (const word of read.words) {
            const value = expected(n, word.index, read.width)
            assert.equal(word.left, value.left, `frame${n}/actor${word.index} left`); assert.equal(word.top, value.top, `frame${n}/actor${word.index} top`)
            assert.ok(Math.abs(word.domLeft - value.left) < .025 && Math.abs(word.domTop - value.top) < .025, `frame${n}/actor${word.index} actual DOM bounds`)
            if (fixture.rows.find(row => row.frame === n)?.positions.some(point => point[0] === word.index) || word.index === 3 && actor3Rows.get(n)?.point || word.index === 43 && actor43Rows.get(n)?.point) assert.ok(word.glyphWidth <= value.width + .1, 'native glyph fits a measured source span without enlarging font height')
        }
    }
    await settle()
    const initial = await snapshot(); assertPose(initial, 1172)
    check('The actual84-word native-like DOM retains identities,caller props,children and object ref at the unchanged1172 anchor', initial.ref && initial.title === 'caller preserved' && initial.caller === 'preserved' && initial.insetParts === 19 && initial.words.every((word, index) => word.id === oldFixture.words[index].desktopID && word.text === oldFixture.words[index].independentText) && await page.locator('[data-caller-child]').textContent() === 'editable caller child')
    await page.locator('[data-caller-child]').click(); check('Caller event handling survives the existing word-grid HOC', await page.evaluate(() => __clicks === 1))
    const forward = [], comparableFrames = new Set(fixture.sourceFrames.map(frame => frame.frame))
    let previousRead = initial, previousFrame = 1172
    for (const frame of fixture.rows.map(row => row.frame)) {
        await page.evaluate(frame => __set(frame), frame)
        if (comparableFrames.has(frame)) {
            await page.evaluate(frame => { const img = document.getElementById('source-frame'); img.src = '/frame-' + frame + '.png'; document.getElementById('source-label').textContent = 'Retained source frame ' + frame; document.getElementById('source-boxes').innerHTML = __evidence.actors.flatMap(actor => { const pose = actor.poses.find(pose => pose.frame === frame); if (!pose) return []; const b = pose.sourceInkBounds; return ['<i class="source-box" style="left:' + b.left + 'px;top:' + b.top + 'px;width:' + b.width + 'px;height:' + b.height + 'px"></i>'] }).join('') }, frame)
            await page.waitForFunction(() => document.getElementById('source-frame').complete && document.getElementById('source-frame').naturalWidth === 480)
        }
        await settle(); const read = await snapshot(); assertPose(read, frame)
        const expectedReads = baselineSample(previousFrame).sourceFrame === baselineSample(frame).sourceFrame ? 4 : 84
        assert.equal(read.reads - previousRead.reads, expectedReads, 'A frame edge measures exactly4 tracked words or the original84 on a representative change')
        assert.equal(read.oldTwoReads - previousRead.oldTwoReads, 2, 'Historical two-track read budget stays exactly2')
        assert.equal(read.actor3Reads - previousRead.actor3Reads, 1, 'Actor3 adds exactly1 read per real measured-frame edge')
        assert.equal(read.actor43Reads - previousRead.actor43Reads, 1, 'Actor43 adds exactly1 read per real measured-frame edge')
        assert.equal(read.otherReads - previousRead.otherReads, expectedReads === 84 ? 80 : 0, 'Other80 actors are read only at a representative change')
        forward.push({ frame, read, expectedReads }); previousFrame = frame; previousRead = read
        if (comparableFrames.has(frame)) await page.screenshot({ path: path.join(output, 'source-and-native-' + frame + '.png'), clip: { x: 9, y: 9, width: 982, height: 880 } })
    }
    check('All74frames/144measured fits and4explicit baseline gaps drive the actual84-node DOM, with pinned source-context comparisons', forward.length === 74 && forward.every(({ read }) => read.frames === 0 && read.words.every(word => word.style.includes('transition: none'))))
    const unchangedBySample = new Map()
    for (const { frame, read } of forward) {
        const key = baselineSample(frame).sourceFrame, words = read.words.filter(word => !fixture.actorIndices.includes(word.index) && word.index !== 3 && word.index !== 43)
        if (!unchangedBySample.has(key)) unchangedBySample.set(key, words.map(word => word.style))
        else assert.deepEqual(words.map(word => word.style), unchangedBySample.get(key))
    }
    check('All80 untracked native style strings stay byte-exact inside each original representative hold', unchangedBySample.size === 12)
    for (const frame of fixture.rows.map(row => row.frame).toReversed()) { await page.evaluate(n => __set(n), frame); await settle(); assertPose(await snapshot(), frame) }
    check('Reverse seek deterministically covers all74 literal poses and nullable fallbacks without tweening', true)
    await page.evaluate(() => __set(1170)); await settle(); const beforeActor3Edge = await snapshot(), readsBefore = beforeActor3Edge.reads
    await page.evaluate(() => __set(1171)); await settle(); const afterActor3Edge = await snapshot(), readsAfter = afterActor3Edge.reads
    check('A frame edge retains exact oldtwo2+actor3one+actor43one reads without reading the80 held actors', readsAfter - readsBefore === 4 && afterActor3Edge.oldTwoReads-beforeActor3Edge.oldTwoReads === 2 && afterActor3Edge.actor3Reads-beforeActor3Edge.actor3Reads === 1 && afterActor3Edge.actor43Reads-beforeActor3Edge.actor43Reads === 1 && afterActor3Edge.otherReads-beforeActor3Edge.otherReads === 0)
    await page.evaluate(() => __set(1171.5)); await settle()
    check('Subframe updates in the same24fps row perform zero additional native text measurements', (await snapshot()).reads === readsAfter)
    for (const [from, to] of [[1208,1209],[1209,1210],[1212,1213],[1213,1212],[1215,1216],[1216,1215]]) {
        await page.evaluate(n => __set(n), from); await settle(); const before = await snapshot()
        await page.evaluate(n => __set(n), to); await settle(); const after = await snapshot(); assertPose(after, to)
        assert.equal(after.reads - before.reads, baselineSample(from).sourceFrame === baselineSample(to).sourceFrame ? 4 : 84)
    }
    check('Entering/exiting each null gap forward/reverse restores the exact old representative pose, never the preceding measured pose', true)
    for (const n of [1174,1175,1176]) { await page.evaluate(n => __set(n), n); await settle(); assertPose(await snapshot(), n) }
    check('The historical two perimeter words and admitted actors3/43 receive source-width fits while the80 remaining perimeter declarations stay intact', true)
    for (const n of [1151,1226]) { await page.evaluate(n => __set(n), n); await settle(); assertPose(await snapshot(), n) }
    check('The complete measured-range endpoints return to original representative behavior', true)
    for (const row of actor3Fixture.rows.filter(row => !row.point)) for (const neighbor of [row.frame-1,row.frame+1]) {
        await page.evaluate(n => __set(n), neighbor); await settle()
        await page.evaluate(n => __set(n), row.frame); await settle(); assertPose(await snapshot(),row.frame)
    }
    check('Every23 actor3 nulls restores the exact representative baseline forward and reverse, including rejected1210..1212', true)
    for(const row of actor43Fixture.rows.filter(row=>!row.point))for(const neighbor of [row.frame-1,row.frame+1]){
        await page.evaluate(n=>__set(n),neighbor);await settle();await page.evaluate(n=>__set(n),row.frame);await settle();assertPose(await snapshot(),row.frame)
    }
    check('All12 actor43 nulls restore the exact representative baseline forward and reverse, including1208and1222',true)
    await page.addScriptTag({ content: module(previousJS, '__baseline') })
    await page.evaluate(frame => {
        const E = React.createElement, Base = __baseline.exports.withAjedrezTypeGridMotion(NativeScene)
        window.__baseRoot = ReactDOM.createRoot(document.getElementById('baseline-mount'))
        ReactDOM.flushSync(() => __baseRoot.render(E(__baseline.Context.Provider, { value: { ...__state, time: frame / 24 } }, E(Base, { id: 'negative-baseline' }))))
        __set(frame)
    }, fixture.negativeFrame); await settle()
    const negative = await page.evaluate(() => [60, 25].map(index => { const node = document.querySelector('#negative-baseline [data-native-word="' + index + '"]'); return { index, left: parseFloat(node.style.left), top: parseFloat(node.style.top) } }))
    check('The genuine E1preimage reproduces both old held-pose errors at1177 by>150logicalpx', negative.every(word => { const wanted = expected(fixture.negativeFrame, word.index); return Math.hypot(word.left - wanted.left, word.top - wanted.top) > 150 }))
    await page.evaluate(() => __set(1169)); await settle(); const actor3BeforeNegative = await snapshot(); assertPose(actor3BeforeNegative,1169)
    const wantedActor3 = expected(1169,3), heldActor3 = baselineSample(1169)
    check('The actor3 real DOM at1169 rejects the genuine old held pose by more than350 logical pixels', Math.hypot(actor3BeforeNegative.words[3].left-heldActor3.xy[6],actor3BeforeNegative.words[3].top-heldActor3.xy[7])>350 && actor3BeforeNegative.words[3].left===wantedActor3.left && actor3BeforeNegative.words[3].top===wantedActor3.top)
    await page.evaluate(()=>__set(1169));await settle();const actor43NegativeRead=await snapshot();assertPose(actor43NegativeRead,1169)
    const actor43Wanted=expected(1169,43),actor43Old=baselineSample(1169)
    check('Actor43 actual DOM rejects the genuine old held1172 baseline at1169 by more than150 logical pixels',Math.hypot(actor43NegativeRead.words[43].left-actor43Old.xy[86],actor43NegativeRead.words[43].top-actor43Old.xy[87])>150&&actor43NegativeRead.words[43].left===actor43Wanted.left&&actor43NegativeRead.words[43].top===actor43Wanted.top)
    reports.push({ negativePreimageRead: negative })
    await page.evaluate(() => ReactDOM.flushSync(() => __baseRoot.unmount())); await settle()
    let policyNegative = source
    for (const mutant of [fixture.negativeMutants.gapGuard, fixture.negativeMutants.perimeterWidth]) {
        assert.equal(policyNegative.split(mutant.correct).length - 1, 1, 'one exact meaningful policy mutant')
        policyNegative = policyNegative.replace(mutant.correct, mutant.stale)
    }
    await page.addScriptTag({ content: module(ts.transpileModule(policyNegative, { compilerOptions }).outputText, '__badPolicy') })
    await page.evaluate(() => {
        const E = React.createElement, Bad = __badPolicy.exports.withAjedrezTypeGridMotion(NativeScene)
        window.__policyRoot = ReactDOM.createRoot(document.getElementById('baseline-mount')); window.__policyFrame = 1176
        window.__renderPolicy = () => ReactDOM.flushSync(() => __policyRoot.render(E(__badPolicy.Context.Provider, { value: { ...__state, time: __policyFrame / 24 } }, E(Bad, { id: 'policy-negative' }))))
        window.__policySnapshot = () => [60,25,3,43].map(index => { const node = document.querySelector('#policy-negative [data-native-word="' + index + '"]'), range = __originalRange(); range.selectNodeContents(node.querySelector('span')); return { index, left: parseFloat(node.style.left), top: parseFloat(node.style.top), glyphWidth: range.getBoundingClientRect().width } })
        __renderPolicy()
    }); await settle()
    const badPerimeter = await page.evaluate(() => __policySnapshot())
    check('Negative old perimeter-width policy leaves the measured actor60 wider than its genuine source span', badPerimeter.find(word => word.index === 60).glyphWidth > expected(1176,60).width + 2)
    const badGaps = []
    for (const [before, after, index] of [[1208,1209,60],[1212,1213,25]]) {
        await page.evaluate(frame => { __policyFrame = frame; __renderPolicy() }, before); await settle()
        const first = await page.evaluate(() => __policySnapshot())
        await page.evaluate(frame => { __policyFrame = frame; __renderPolicy() }, after); await settle()
        const second = await page.evaluate(() => __policySnapshot()), a = first.find(word => word.index === index), b = second.find(word => word.index === index), wanted = expected(after,index)
        assert.equal(a.left,b.left); assert.equal(a.top,b.top)
        assert.ok(b.left !== wanted.left || b.top !== wanted.top, 'old nonnull-only guard wrongly retains the preceding measured pose')
        badGaps.push({ before, after, index, first:a, stale:b, requiredBaseline:wanted })
    }
    check('Negative nonnull-only write guard fails both different-actor gaps; the positive74-frame read restores them', badGaps.length === 2)
    await page.evaluate(() => { __policyFrame = 1222; __renderPolicy() }); await settle()
    const staleActor3Before = (await page.evaluate(() => __policySnapshot())).find(word=>word.index===3)
    await page.evaluate(() => { __policyFrame = 1223; __renderPolicy() }); await settle()
    const staleActor3After = (await page.evaluate(() => __policySnapshot())).find(word=>word.index===3), requiredActor3Baseline = expected(1223,3)
    check('The genuine nonnull-only guard mutant incorrectly holds actor3 at1223 instead of restoring baseline', staleActor3After.left===staleActor3Before.left && staleActor3After.top===staleActor3Before.top && (staleActor3After.left!==requiredActor3Baseline.left || staleActor3After.top!==requiredActor3Baseline.top))
    reports.push({ actor3NullGuardNegative:{staleActor3Before,staleActor3After,requiredActor3Baseline} })
    await page.evaluate(()=>{__policyFrame=1221;__renderPolicy()});await settle()
    const staleActor43Before=(await page.evaluate(()=>__policySnapshot())).find(word=>word.index===43)
    await page.evaluate(()=>{__policyFrame=1222;__renderPolicy()});await settle()
    const staleActor43After=(await page.evaluate(()=>__policySnapshot())).find(word=>word.index===43),requiredActor43Baseline=expected(1222,43)
    check('The genuine nonnull-only guard mutant incorrectly holds actor43 through unresolved1222 instead of restoring baseline',staleActor43After.left===staleActor43Before.left&&staleActor43After.top===staleActor43Before.top&&(staleActor43After.left!==requiredActor43Baseline.left||staleActor43After.top!==requiredActor43Baseline.top))
    reports.push({actor43NullGuardNegative:{staleActor43Before,staleActor43After,requiredActor43Baseline}})
    reports.push({ policyNegatives:{badPerimeter,badGaps} })
    await page.evaluate(() => ReactDOM.flushSync(() => __policyRoot.unmount())); await settle()
    // Keep one actual React hook owner, host, ref and paused clock value while
    // replacing only its implementation. This deliberately avoids React Refresh
    // remount/force-effect machinery, so stale ordinary dependency closures fail.
    const staleNeedle = '}, [ajedrezTypeMeasuredOwner(host)])'
    assert.equal(source.split(staleNeedle).length - 1, 1)
    // Negative fixture deliberately reuses E1's dependency-token function.
    // A fresh real module owns its own WeakMap; no production source is changed.
    await page.addScriptTag({ content: module(js, '__staleDependency', ';ajedrezTypeMeasuredOwner=window.__baseline.ajedrezTypeMeasuredOwner;') })
    await page.addScriptTag({ content: module(js, '__laterModule') })
    await page.evaluate(frame => {
        const E = React.createElement
        window.__hmrRef = { current: null }
        window.__hmrValue = { ...__state, time: frame / 24 }
        window.__hmrImpl = null
        window.Retained = React.forwardRef((props, ref) => __hmrImpl(props, ref))
        window.__renderHMR = () => ReactDOM.flushSync(() => __hmrRoot.render(E(__baseline.Context.Provider, { value: __hmrValue }, E(__current.Context.Provider, { value: __hmrValue }, E(__staleDependency.Context.Provider, { value: __hmrValue }, E(__laterModule.Context.Provider, { value: __hmrValue }, E(Retained, { id: 'retained-pause', ref: __hmrRef })))))))
        window.__mountHMR = () => { window.__hmrRoot = ReactDOM.createRoot(document.getElementById('baseline-mount')); __hmrImpl = __baseline.exports.withAjedrezTypeGridMotion(NativeScene).render; __renderHMR() }
        window.__readHMR = () => { const host = document.getElementById('retained-pause'); return { width: host.offsetWidth, ref: __hmrRef.current === host, reads: __reads, creates: __observerCreates, observers: __observers.size, actor43: (()=>{const node=host.querySelector('[data-native-word="43"]');return{left:parseFloat(node.style.left),top:parseFloat(node.style.top)}})(), actor3: (()=>{const node=host.querySelector('[data-native-word="3"]');return{left:parseFloat(node.style.left),top:parseFloat(node.style.top)}})(), words: [60, 25].map(index => { const node = host.querySelector('[data-native-word="' + index + '"]'); return { index, left: parseFloat(node.style.left), top: parseFloat(node.style.top) } }) } }
        __mountHMR()
    }, fixture.negativeFrame); await settle()
    const staleBefore = await page.evaluate(() => { window.__sameHMRHost = __hmrRef.current; return __readHMR() })
    await page.evaluate(() => { __hmrImpl = __staleDependency.exports.withAjedrezTypeGridMotion(NativeScene).render; __renderHMR() }); await settle()
    const staleAfter = await page.evaluate(() => ({ ...__readHMR(), sameHost: __sameHMRHost === __hmrRef.current }))
    check('Negative shared old-token refresh keeps E1held positions while paused at1177', staleAfter.sameHost && JSON.stringify(staleAfter.words) === JSON.stringify(staleBefore.words) && staleAfter.words.every(word => { const wanted = expected(fixture.negativeFrame, word.index); return Math.hypot(word.left - wanted.left, word.top - wanted.top) > 150 }))
    await page.evaluate(() => ReactDOM.flushSync(() => __hmrRoot.unmount())); await settle()
    await page.evaluate(() => __mountHMR()); await settle()
    await page.evaluate(() => { window.__sameHMRHost = __hmrRef.current; __hmrImpl = __current.exports.withAjedrezTypeGridMotion(NativeScene).render; __renderHMR() }); await settle()
    const hmrCurrent = await page.evaluate(() => ({ ...__readHMR(), sameHost: __sameHMRHost === __hmrRef.current }))
    check('E1token→newmodule token preserves the paused hook owner/DOM/ref while applying both1177 fits without input', hmrCurrent.sameHost && hmrCurrent.ref && hmrCurrent.words.every(word => { const wanted = expected(fixture.negativeFrame, word.index); return word.left === wanted.left && word.top === wanted.top }))
    await page.evaluate(() => { __hmrImpl = __laterModule.exports.withAjedrezTypeGridMotion(NativeScene).render; __renderHMR() }); await settle()
    const hmrLater = await page.evaluate(() => ({ ...__readHMR(), sameHost: __sameHMRHost === __hmrRef.current }))
    check('Newmodule[token]→latermodule[token] renews the existing two-observer lease without remount/input or a stale closure', hmrLater.sameHost && hmrLater.creates === hmrCurrent.creates + 2 && hmrLater.observers === hmrCurrent.observers && JSON.stringify(hmrLater.words) === JSON.stringify(hmrCurrent.words))
    const hmrActor3Wanted = expected(fixture.negativeFrame,3)
    check('Actor3 also updates on the retained paused hook owner after module refresh without input', hmrCurrent.actor3.left===hmrActor3Wanted.left && hmrCurrent.actor3.top===hmrActor3Wanted.top && JSON.stringify(hmrLater.actor3)===JSON.stringify(hmrCurrent.actor3))
    const hmrActor43Wanted=expected(fixture.negativeFrame,43)
    check('Actor43 updates on the retained paused hook owner after module refresh without input',hmrCurrent.actor43.left===hmrActor43Wanted.left&&hmrCurrent.actor43.top===hmrActor43Wanted.top&&JSON.stringify(hmrLater.actor43)===JSON.stringify(hmrCurrent.actor43))
    await page.evaluate(() => { __sceneTag = 'article'; __renderHMR() }); await settle()
    const hmrReplacement = await page.evaluate(() => ({ ...__readHMR(), replaced: __sameHMRHost !== __hmrRef.current, tag: __hmrRef.current.tagName }))
    check('The same one-slot token also rebinds a replacement native host after a module refresh', hmrReplacement.replaced && hmrReplacement.tag === 'ARTICLE' && hmrReplacement.ref && hmrReplacement.words.every(word => { const wanted = expected(fixture.negativeFrame, word.index); return word.left === wanted.left && word.top === wanted.top }))
    await page.evaluate(() => { ReactDOM.flushSync(() => __hmrRoot.unmount()); __sceneTag = 'section' }); await settle()
    reports.push({ retainedHookRefresh: { staleBefore, staleAfter, hmrCurrent, hmrLater, hmrReplacement }, boundary: 'Actual retained React18 hook owner; demonstrates dependency refresh semantics, not actual Framer HMR/Preview paint.' })
    const heldA = await snapshot(); await page.waitForTimeout(120); const heldB = await snapshot()
    check('A paused measured row holds all DOM geometry with zero ownedRAF and only the existing two observers', JSON.stringify(heldA.words) === JSON.stringify(heldB.words) && heldB.frames === 0 && heldB.observers === 2)
    await page.evaluate(() => { __width = 375; __sceneTag = 'article'; __callbackRef = true; __set(1177) }); await settle()
    const phone = await snapshot(); assertPose(phone, 1177)
    check('A real375px Phone host replacement preserves unit scaling, native IDs and callback ref', phone.tag === 'ARTICLE' && phone.width === 375 && phone.ref && phone.words.every((word, index) => word.id === oldFixture.words[index].phoneID) && await page.evaluate(() => __refCalls.includes('ARTICLE')))
    for (const frame of [1176,1208,1209,1208,1212,1213,1212,1215,1216,1215]) { await page.evaluate(frame => __set(frame), frame); await settle(); assertPose(await snapshot(), frame) }
    for (const frame of actor3Fixture.rows.map(row=>row.frame)) { await page.evaluate(n=>__set(n),frame); await settle(); assertPose(await snapshot(),frame) }
    check('The375px Phone host exercises actor43 62/12 plus actor3 51/23 and all historical two-track poses', true)
    check('Phone preserves measured perimeter fitting and forward/reverse nullable-gap fallback geometry', true)
    await page.evaluate(() => { document.getElementById('comparison').style.transformOrigin = '0 0'; document.getElementById('comparison').style.transform = 'translate(13px,7px) scale(.8)'; __set(1210) }); await settle()
    const affine = await snapshot(); assertPose(affine, 1210)
    check('Public affine parent scaling preserves CSS/native logical coordinates and source-width fitting', Math.abs(affine.scale - .8) < .001)
    await page.evaluate(() => { window.__detachedWord = document.querySelector('[data-native-word="60"]'); __revision++; __render() }); await settle()
    assertPose(await snapshot(), 1210)
    check('A same-frame native word replacement receives its fit and restores the detached old word', await page.evaluate(() => !__detachedWord.isConnected && __detachedWord.style.left === Math.round(__data.words[60].staticLeft * 375 / 480 * 100) / 100 + 'px' && __observers.size === 2))
    await page.evaluate(() => { __set(1213); window.__detachedActor3=document.querySelector('[data-native-word="3"]'); __actor3Revision++; __render() }); await settle(); assertPose(await snapshot(),1213)
    check('A same-frame actor3 native replacement receives its fit and restores the detached old declaration', await page.evaluate(()=>!__detachedActor3.isConnected && __detachedActor3.style.left===Math.round(__data.words[3].staticLeft*375/480*100)/100+'px' && __observers.size===2))
    await page.evaluate(()=>{__set(1217);window.__detachedActor43=document.querySelector('[data-native-word="43"]');__actor43Revision++;__render()});await settle();assertPose(await snapshot(),1217)
    check('A same-frame actor43 native replacement receives its fit and restores the detached old declaration',await page.evaluate(()=>!__detachedActor43.isConnected&&__detachedActor43.style.left===Math.round(__data.words[43].staticLeft*375/480*100)/100+'px'&&__observers.size===2))
    await page.evaluate(() => { document.getElementById('comparison').style.transform = ''; __set(1210, { frozen: true }) }); await settle()
    const poster = await snapshot()
    for (const mode of ['canvas', 'export', 'thumbnail', 'reduced']) {
        await page.evaluate(mode => { __target = mode === 'reduced' ? 'preview' : mode; __set(1209, { frozen: mode !== 'reduced', reduced: mode === 'reduced' }) }, mode)
        await settle(); const read = await snapshot()
        assert.equal(read.status, 'native-poster'); assert.equal(read.frames, 0)
        assert.deepEqual(read.words.map(word => word.style), poster.words.map(word => word.style))
        assert.deepEqual(read.rules, poster.rules); assert.equal(read.inset, '0')
    }
    check('Canvas/export/thumbnail/reduced restores every authored Phone poster style and preserves the19-part inset', poster.insetParts === 19)
    await page.evaluate(() => { __target = 'preview'; __set(1192, { frozen: false, reduced: false }) }); await settle()
    let insetReads = (await snapshot()).reads, insetSample = baselineSample(1192).sourceFrame
    const insetEdges = []
    for (const n of [1193, 1194, 1195, 1196, 1195, 1193, 1192]) {
        await page.evaluate(n => __set(n), n); await settle(); const read = await snapshot()
        assert.equal(read.inset, n >= 1193 && n < 1196 ? '1' : '0'); assert.equal(read.insetParts, 19)
        const sample = baselineSample(n).sourceFrame, expectedReads = sample === insetSample ? 4 : 84
        assert.equal(read.sample, sample)
        assert.equal(read.reads - insetReads, expectedReads, 'Only an existing representative-word-sample change remeasures84 words')
        insetEdges.push({ frame: n, sample, inset: read.inset, readDelta: read.reads - insetReads, expectedReads })
        insetReads = read.reads; insetSample = sample
    }
    reports.push({ insetEdges })
    check('All19 inset parts retain exact1193..1195 visibility; moving-fit edges perform4reads (oldtwo2+actor3one+actor43one) and existing representative changes perform84reads', true)
    await page.evaluate(() => { __set(1169); document.querySelector('[data-native-word="60"]').style.setProperty('left', '17px', 'important'); __set(1170); __set(1.2, { index: 1 }) }); await settle()
    check('Scene exit restores a newer caller declaration and priority while leaving matching outside layers untouched', await page.evaluate(() => { const node = document.querySelector('[data-native-word="60"]'); return node.style.left === '17px' && node.style.getPropertyPriority('left') === 'important' && document.getElementById('outside').style.left === '' }))
    await page.evaluate(() => ReactDOM.flushSync(() => __root.unmount())); await settle()
    check('All existing owned observers and forwarded refs clean up with zero pendingRAF', await page.evaluate(() => __observers.size === 0 && __frames.size === 0 && __ref.current === null))
    const allowedRequests = new Set(fixture.sourceFrames.map(frame => '/frame-' + frame.frame + '.png'))
    check('No browser exceptions or unplanned network/material requests occurred; all declared source comparisons loaded', errors.length === 0 && requests.every(url => allowedRequests.has(url)) && new Set(requests).size === allowedRequests.size)
    reports.push({ initial, forward, phone, affine, scope: 'Native-like editable DOM supplied by fixture; source screenshots are retained comparison evidence, independent strings intentionally differ. No actual Framer DOM/paint/reload assertion.' })
    const result = { passed: true, ...pins, checks, reports, errors, requests, nodeVersion: process.version, chromiumVersion: browser.version(), sourceCorrespondence: 'Historical two tracks retain144fits/4gaps and actor3 retains51fits/23gaps; actor43 adds62 reviewed crop-rectangle fits/12baseline nulls across the same74frames. Independent captions and80held actors remain; source lexical identity,easing,full-film fidelity and actual Framer paint remain unclaimed.', actualFramerPreviewVerified: false, afterEditorReload: false }
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2) + '\n')
    console.log(JSON.stringify({ passed: true, scope: 'actor43-additive-60', checks: checks.length, ...pins, evidence: output }, null, 2))
} catch (error) {
    fs.writeFileSync(path.join(output, 'failure.json'), JSON.stringify({ error: String(error), stack: error.stack, ...pins, checks, reports, errors, requests }, null, 2) + '\n')
    throw error
} finally {
    if (browser) await browser.close()
    if (server) await new Promise(resolve => server.close(resolve))
}
