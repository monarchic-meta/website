import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const executedTest = fs.readFileSync(fileURLToPath(import.meta.url))
const repo = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
const ts = require('typescript')
const { chromium } = require('@playwright/test')
const directory = path.join(repo, 'docs/design-studies/code-components')
const evidence = path.join(process.env.MONARCHIC_ORIGIN_NATIVE_EVIDENCE_DIR ?? '/tmp/monarchic-source-origin-native', 'mixed')
fs.mkdirSync(evidence, { recursive: true })
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const sourceFiles = new Map()
function read(file) {
    const filename = path.join(directory, file), bytes = fs.readFileSync(filename)
    sourceFiles.set(filename, { path: filename, sha256: hash(bytes), bytes: bytes.length })
    return bytes.toString()
}
const source = read('SourceOriginNativeBehaviors.tsx')
const originJS = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText
const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json')))
assert.equal(manifest.studies.length, 20)
const fixtures = manifest.studies.map(s => ({ id: s.id, file: s.componentSource, settings: { primary: '#efc8c8', secondary: '#d6b442', ink: '#424855', ...s.studyProps, mode: s.mode, static: false, animate: false, canvasPreview: false, interactive: false } }))
function bundle(file) {
    const text = read(file), end = text.indexOf('/**\n * @framerSupportedLayoutWidth', text.indexOf('function createRenderer'))
    assert.ok(end > 0, 'Retained core boundary ' + file)
    assert.equal(ts.preProcessFile(text).importedFiles.filter(x => x.fileName.startsWith('./')).length, 0, 'No silently omitted legacy data import')
    const js = ts.transpileModule(text.slice(0, end), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText
    return '(function(){const exports={};const require=n=>n==="react"?{}:{RenderTarget:{canvas:"canvas",export:"export",thumbnail:"thumbnail"}};' + js + ';legacyModules[' + JSON.stringify(file) + ']={createRenderer,getStudyPool}})();'
}
const legacyBundles = [...new Set(fixtures.map(x => x.file))].map(file => ({ file, code: bundle(file) }))
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'origin-native-mixed-'))
const browser = await chromium.launchPersistentContext(profile, { headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, viewport: { width: 1660, height: 1100 }, deviceScaleFactor: 1, args: ['--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = browser.pages()[0], checks = [], reports = [], errors = []
page.on('pageerror', error => errors.push(String(error)))
await page.route('**/*', route => route.abort())
const verify = (name, ok) => { assert.ok(ok, name); checks.push(name) }
try {
    await page.setContent('<!doctype html><style>html,body{margin:0;background:#ddd;overflow:hidden}.tile{position:absolute;transform-origin:0 0}canvas{display:block;width:100%;height:100%}</style><div id="origins"></div><div id="references"></div>')
    await page.evaluate(() => {
        window.legacyModules = {}; window.legacyErrors = []; window.actualGL = new Set(); window.peakGL = 0; window.peakGLPixels = 0
        const get = HTMLCanvasElement.prototype.getContext
        window.sampleGL = () => { const live = [...actualGL].filter(gl => !gl.isContextLost()); peakGL = Math.max(peakGL, live.length); peakGLPixels = Math.max(peakGLPixels, live.reduce((n, gl) => n + gl.canvas.width * gl.canvas.height, 0)) }
        HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
            const result = Reflect.apply(get, this, kind === '2d' ? [kind, { ...(args[0] ?? {}), willReadFrequently: true }, ...args.slice(1)] : [kind, ...args])
            if (result && ['webgl', 'webgl2', 'experimental-webgl'].includes(kind) && !actualGL.has(result)) {
                actualGL.add(result); const extension = result.getExtension.bind(result)
                result.getExtension = name => { const e = extension(name); if (name === 'WEBGL_lose_context' && e && !e.__originTestTracked) { const lose = e.loseContext.bind(e); e.loseContext = () => { lose(); sampleGL() }; e.__originTestTracked = true } return e }; sampleGL()
            }
            return result
        }
        for (const name of ['width', 'height']) { const descriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, name); Object.defineProperty(HTMLCanvasElement.prototype, name, { ...descriptor, set(value) { descriptor.set.call(this, value); sampleGL() } }) }
        const raf = requestAnimationFrame, cancel = cancelAnimationFrame; window.pendingRAF = new Set()
        window.requestAnimationFrame = fn => { let id = raf(t => { pendingRAF.delete(id); fn(t) }); pendingRAF.add(id); return id }
        window.cancelAnimationFrame = id => { pendingRAF.delete(id); cancel(id) }
        window.target = 'canvas'; window.isStatic = true; window.originOptIn = false
        window.quality = canvas => {
            const { width, height } = canvas, pixels = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, width, height).data
            let low = 255, high = 0, sum = 0, square = 0, edge = 0, checksum = 2166136261; const values = new Float32Array(width * height), tiles = Array.from({ length: 64 }, () => ({ low: 255, high: 0 }))
            for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const i = (y * width + x) * 4, value = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3; values[y * width + x] = value; low = Math.min(low, value); high = Math.max(high, value); sum += value; square += value * value; const t = tiles[Math.min(7, Math.floor(y / height * 8)) * 8 + Math.min(7, Math.floor(x / width * 8))]; t.low = Math.min(t.low, value); t.high = Math.max(t.high, value); if (x) edge += Math.abs(value - values[y * width + x - 1]); if (y) edge += Math.abs(value - values[(y - 1) * width + x]); for (let k = 0; k < 3; k++) checksum = Math.imul(checksum ^ pixels[i + k], 16777619) }
            return { width, height, contrast: high - low, variance: square / (width * height) - (sum / (width * height)) ** 2, meanEdge: edge / (2 * width * height), activeTiles: tiles.filter(t => t.high - t.low > 12).length, checksum: checksum >>> 0 }
        }
        window.pixelDifference = (a, b) => { if (a.width !== b.width || a.height !== b.height) return { dimensionsMatch: false }; const aa = a.getContext('2d').getImageData(0, 0, a.width, a.height).data, bb = b.getContext('2d').getImageData(0, 0, b.width, b.height).data; let changed = 0, max = 0; for (let i = 0; i < aa.length; i++) { const d = Math.abs(aa[i] - bb[i]); if (d) changed++; max = Math.max(max, d) } return { dimensionsMatch: true, changed, max } }
    })
    for (const item of legacyBundles) await page.addScriptTag({ content: item.code })
    for (const name of ['react', 'react-dom']) await page.addScriptTag({ path: path.join(path.dirname(require.resolve(name + '/package.json')), 'umd/' + name + '.development.js') })
    await page.addScriptTag({ content: 'window.exports={};(function(){const require=n=>n==="react"?window.React:{RenderTarget:{canvas:"canvas",export:"export",thumbnail:"thumbnail",current:()=>window.target},useIsStaticRenderer:()=>window.isStatic};' + originJS + '})();window.originSource=exports;' })
    await page.evaluate(fixtures => {
        window.pool = legacyModules[fixtures[0].file].getStudyPool(); for (const module of Object.values(legacyModules)) if (module.getStudyPool() !== pool) throw Error('Legacy modules must retain one actual shared pool')
        window.placements = []; window.legacy = []
        window.tileFor = (index, width, height) => { const tile = document.createElement('div'), scale = 96 / Math.max(width, height); tile.className = 'tile'; tile.style.cssText = 'left:' + (10 + index % 10 * 136) + 'px;top:' + (10 + Math.floor(index / 10) * 160) + 'px;width:' + width + 'px;height:' + height + 'px;transform:scale(' + scale + ')'; document.body.append(tile); return { tile, scale, width, height, index } }
        for (const fixture of fixtures) { const p = tileFor(placements.length, 960, 600), display = document.createElement('canvas'); display.style.cssText = 'display:block;width:100%;height:100%'; display.getContext('2d', { alpha: false, willReadFrequently: true }); p.tile.append(display); p.kind = 'legacy'; p.fixture = fixture; p.display = display; p.entry = pool.add({ root: p.tile, display, source: fixture.file, target: 'canvas', settings: fixture.settings, factory: (...args) => legacyModules[fixture.file].createRenderer(...args), notify: (_s, error) => { if (error) legacyErrors.push(error) } }); placements.push(p); legacy.push(p) }
        const E = React.createElement, Native = React.forwardRef(({ children, canvasMotion, ...props }, ref) => E('div', { ...props, ref }, children)), Controller = originSource.withOriginMenuController(Native), Field = originSource.withOriginProgramsField(Native)
        window.originComponents = { E, Controller, Field }; window.origins = []
        for (let i = 0; i < 40; i++) { const [width, height] = [[240, 240], [300, 180], [180, 300], [160, 220]][i % 4], p = tileFor(placements.length, width, height); p.kind = 'origin'; p.key = i; p.mount = document.createElement('div'); p.mount.style.cssText = 'width:100%;height:100%'; p.tile.append(p.mount); placements.push(p); origins.push(p) }
        window.originRoot = ReactDOM.createRoot(document.getElementById('origins'))
        window.renderOrigins = () => ReactDOM.flushSync(() => originRoot.render(E(React.Fragment, null, ...origins.map(p => ReactDOM.createPortal(E(Controller, { id: 'origin-world-' + p.key, canvasMotion: originOptIn, style: { position: 'relative', width: p.width, height: p.height } }, E(Field, { id: 'origin-field-' + p.key, style: { position: 'absolute', left: 0, top: 0, width: p.width, height: p.height, background: '#08080a', overflow: 'hidden' } })), p.mount, p.key)))))
        window.originDemand = p => { const r = (p.mount.querySelector('[id="origin-field-' + p.key + '"]') ?? p.tile).getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), budget = target === 'canvas' ? 1000000 : 2000000; let width = Math.max(2, Math.floor(r.width * dpr)), height = Math.max(2, Math.floor(r.height * dpr)); if (width * height > budget) { const scale = Math.sqrt(budget / (width * height)); width = Math.max(2, Math.floor(width * scale)); height = Math.max(2, Math.floor(height * scale)) } return { width, height, rect: r.toJSON() } }
        window.adequate = () => placements.every(p => { if (p.kind === 'origin') { const c = p.mount.querySelector('canvas[data-origin-field]'), d = originDemand(p); return c && c.width >= d.width && c.height >= d.height } const e = p.entry, r = p.tile.getBoundingClientRect(); return e.visible && e.hasFrame && !e.needsStill && e.frameKey === e.contentKey && Math.abs(e.rect.width - r.width) < .01 && Math.abs(e.rect.height - r.height) < .01 && Math.abs(e.rect.left - r.left) < .01 && Math.abs(e.rect.top - r.top) < .01 && e.frameWidth >= e.desiredWidth && e.frameHeight >= e.desiredHeight && p.display.width >= e.desiredWidth && p.display.height >= e.desiredHeight })
        window.snapshot = () => ({ placements: placements.map(p => { const c = p.kind === 'origin' ? p.mount.querySelector('canvas[data-origin-field]') : p.display, d = p.kind === 'origin' ? originDemand(p) : { width: p.entry.desiredWidth, height: p.entry.desiredHeight, rect: p.tile.getBoundingClientRect().toJSON() }; return { kind: p.kind, id: p.kind === 'origin' ? p.key : p.fixture.id, demand: d, ...quality(c) } }), pool: pool.debug(), gate: window[Symbol.for('monarchic.origin-native-motion.v1')]?.debug(), pendingRAF: pendingRAF.size, activeGL: [...actualGL].filter(gl => !gl.isContextLost()).length, peakGL, peakGLPixels })
        window.changeAncestors = (x, y, dpr, pan) => { Object.defineProperty(window, 'devicePixelRatio', { value: dpr, configurable: true }); for (const p of placements) { p.tile.style.transform = 'scale(' + p.scale * x + ',' + p.scale * y + ')'; if (pan) { p.tile.style.left = 13 + p.index % 10 * 136 + 'px'; p.tile.style.top = 15 + Math.floor(p.index / 10) * 160 + 'px' } } }
        renderOrigins()
    }, fixtures)
    const settle = async () => { try { await page.waitForFunction(() => adequate(), null, { timeout: 60000 }) } catch (error) { fs.writeFileSync(path.join(evidence, 'adequacy-failure.json'), JSON.stringify(await page.evaluate(() => ({ snapshot: snapshot(), legacyErrors })), null, 2)); throw error } }
    const record = async name => { const value = await page.evaluate(() => snapshot()); reports.push({ name, ...value }); verify(name + ': all60 placements retain both-axis buffer adequacy', value.placements.length === 60 && value.placements.every(p => p.width >= p.demand.width && p.height >= p.demand.height)); verify(name + ': every placement has meaningful contrast and spatial ink', value.placements.every(p => p.contrast > 15 && p.variance > 6 && p.meanEdge > .035 && p.activeTiles >= 4)); verify(name + ': Canvas-off Origin clocks stay frozen beside legacy canvases', value.gate.admitted === 0 && value.pendingRAF === 0); return value }
    await settle(); const initial = await record('initial'); await page.waitForTimeout(180); const held = await page.evaluate(() => snapshot()); verify('All60 Canvas-off/paused placements hold their exact still pixels', held.placements.every((p, i) => p.checksum === initial.placements[i].checksum))
    await page.evaluate(() => changeAncestors(1.7, 1.25, 1.5, false)); await settle(); await record('ancestor-nonuniform-zoom')
    await page.evaluate(() => changeAncestors(3, 2.8, 2, true)); await settle(); const zoomed = await record('ancestor-pan-and-second-axis-zoom'); verify('Final ancestor zoom forces every legacy and Origin buffer above its initial demand', zoomed.placements.every((p, i) => p.width > initial.placements[i].width && p.height > initial.placements[i].height)); await page.screenshot({ path: path.join(evidence, 'mixed60-canvas-off-zoomed.png') })
    // Compare retained shared-pool copies with actual freshly executed renderers.
    const legacyReferences = await page.evaluate(() => legacy.map(p => { let diff; pool.runStatic(() => { const e = p.entry, canvas = document.createElement('canvas'), renderer = legacyModules[p.fixture.file].createRenderer(canvas, { ...e.settings, managed: true, static: true, renderWidth: e.logicalWidth, renderHeight: e.logicalHeight, managedBufferWidth: e.frameWidth, managedBufferHeight: e.frameHeight, pixelBudget: 2000000 }, () => {}, e.framePhase); renderer.setPointer(...e.framePointer); renderer.renderAt(e.framePhase); const copy = document.createElement('canvas'); copy.width = p.display.width; copy.height = p.display.height; copy.getContext('2d').drawImage(canvas, 0, 0, copy.width, copy.height); diff = pixelDifference(p.display, copy); renderer.dispose(); return canvas.width * canvas.height }); return { id: p.fixture.id, ...diff } }))
    fs.writeFileSync(path.join(evidence, 'legacy-references.json'), JSON.stringify(legacyReferences, null, 2) + '\n')
    verify('All20 retained legacy copies equal fresh same-state renderer pixels', legacyReferences.every(r => r.dimensionsMatch && r.changed === 0))
    // Each Origin reference is a fresh real HOC world, warmed serially with
    // identical ancestor geometry to avoid fractional layout-coordinate drift.
    const originReferences = []
    for (let i = 0; i < 40; i++) {
        await page.evaluate(i => { const p = origins[i], { E, Controller, Field } = originComponents, tile = document.createElement('div'); tile.className = 'tile'; tile.style.cssText = p.tile.style.cssText; document.body.append(tile); window.referenceTile = tile; window.referenceRoot = ReactDOM.createRoot(tile); ReactDOM.flushSync(() => referenceRoot.render(E(Controller, { style: { position: 'relative', width: p.width, height: p.height } }, E(Field, { style: { position: 'absolute', left: 0, top: 0, width: p.width, height: p.height, background: '#08080a', overflow: 'hidden' } })))) }, i)
        await page.waitForFunction(i => { const c = referenceTile.querySelector('canvas[data-origin-field]'), d = originDemand(origins[i]); return c && c.width === d.width && c.height === d.height }, i)
        originReferences.push(await page.evaluate(i => ({ id: i, ...pixelDifference(origins[i].mount.querySelector('canvas[data-origin-field]'), referenceTile.querySelector('canvas[data-origin-field]')) }), i))
        await page.evaluate(() => { ReactDOM.flushSync(() => referenceRoot.unmount()); referenceTile.remove() })
    }
    fs.writeFileSync(path.join(evidence, 'origin-references.json'), JSON.stringify(originReferences, null, 2) + '\n')
    verify('All40 Origin copies equal fresh same-size real-HOC still pixels', originReferences.every(r => r.dimensionsMatch && r.changed === 0))
    await page.evaluate(() => { for (const p of legacy) { pool.remove(p.entry); p.display.remove() } placements = placements.filter(p => p.kind === 'origin'); target = 'preview'; isStatic = false; originOptIn = false; renderOrigins() })
    await page.waitForFunction(() => { const g = window[Symbol.for('monarchic.origin-native-motion.v1')].debug(); return g.preview === 2 && g.canvas === 0 && g.legacyCanvases === 0 })
    const previewBefore = await page.evaluate(() => origins.map(p => quality(p.mount.querySelector('canvas')).checksum)); await page.waitForTimeout(350)
    const previewAfter = await page.evaluate(() => ({ hashes: origins.map(p => quality(p.mount.querySelector('canvas')).checksum), gate: window[Symbol.for('monarchic.origin-native-motion.v1')].debug(), raf: pendingRAF.size }))
    verify('After actual legacy retirement only two Preview Origin fields move', previewAfter.hashes.filter((n, i) => n !== previewBefore[i]).length === 2 && previewAfter.raf <= 2)
    await page.evaluate(() => { target = 'canvas'; isStatic = true; originOptIn = true; renderOrigins() }); await page.waitForFunction(() => window[Symbol.for('monarchic.origin-native-motion.v1')].debug().canvas === 1)
    const canvasBefore = await page.evaluate(() => origins.map(p => quality(p.mount.querySelector('canvas')).checksum)); await page.waitForTimeout(350)
    const canvasAfter = await page.evaluate(() => ({ hashes: origins.map(p => quality(p.mount.querySelector('canvas')).checksum), gate: window[Symbol.for('monarchic.origin-native-motion.v1')].debug(), raf: pendingRAF.size }))
    verify('Forty explicit Canvas opt-ins admit only one changing Origin field', canvasAfter.hashes.filter((n, i) => n !== canvasBefore[i]).length === 1 && canvasAfter.raf <= 1)
    await page.evaluate(() => { const p = legacy[0]; p.tile.append(p.display); p.entry = pool.add({ root: p.tile, display: p.display, source: p.fixture.file, target: 'canvas', settings: p.fixture.settings, factory: (...args) => legacyModules[p.fixture.file].createRenderer(...args), notify: (_s, error) => { if (error) legacyErrors.push(error) } }); window.returnedLegacy = p })
    await page.waitForFunction(() => window[Symbol.for('monarchic.origin-native-motion.v1')].debug().admitted === 0)
    const veto = await page.evaluate(() => ({ gate: window[Symbol.for('monarchic.origin-native-motion.v1')].debug(), raf: pendingRAF.size }))
    verify('Reintroducing an actual legacy pool canvas revokes every Origin clock', veto.gate.legacyCanvases === 1 && veto.raf === 0)
    await page.evaluate(() => { ReactDOM.flushSync(() => originRoot.unmount()); pool.remove(returnedLegacy.entry); returnedLegacy.display.remove() }); await page.waitForTimeout(100)
    const cleanup = await page.evaluate(() => ({ pool: pool.debug(), gate: window[Symbol.for('monarchic.origin-native-motion.v1')].debug(), raf: pendingRAF.size, activeGL: [...actualGL].filter(gl => !gl.isContextLost()).length, peakGL, peakGLPixels, legacyErrors }))
    verify('Mixed run never exceeds two actual GL contexts or2MP active GL buffers', cleanup.peakGL <= 2 && cleanup.peakGLPixels <= 2000000)
    verify('Cleanup releases every legacy entry/context and Origin client/RAF', cleanup.pool.entryCount === 0 && cleanup.pool.activeContexts === 0 && cleanup.gate.clients === 0 && cleanup.gate.admitted === 0 && cleanup.raf === 0 && cleanup.activeGL === 0)
    verify('No actual renderer or browser errors', errors.length === 0 && cleanup.legacyErrors.length === 0)
    const result = { passed: true, sourceSHA256: hash(source), sourceFiles: [...sourceFiles.values()], testSHA256: hash(executedTest), checks, placements: 60, legacyModes: 20, originWorlds: 40, reports, legacyReferences, originReferences, previewAfter, canvasAfter, veto, cleanup, errors, scope: 'One isolated actual Chromium realm; unchanged legacy shader/coordinator cores plus real native-like Origin HOCs. Canvas-off quality at every placement, actual ancestor transform observers/pool polling, both-axis adequate buffers, fresh renderer/HOC pixel references, conservative legacy handoff and bounded motion. 2D contexts explicitly request willReadFrequently for reproducible fresh readbacks; the retained88 checks exercise production-default context options. No hover/Play or fake clock; no Framer persistence or source-fidelity claim.', actualFramerPreviewVerified: false }
    for (const pin of sourceFiles.values()) assert.equal(hash(fs.readFileSync(pin.path)), pin.sha256, 'Source unchanged during mixed run')
    fs.writeFileSync(path.join(evidence, 'result.json'), JSON.stringify(result, null, 2) + '\n')
    console.log(JSON.stringify({ passed: true, checks: checks.length, placements: 60, evidence }))
} catch (error) {
    const state = await page.evaluate(() => ({ pool: window.pool?.debug(), gate: window[Symbol.for('monarchic.origin-native-motion.v1')]?.debug(), legacyErrors: window.legacyErrors, activeGL: [...(window.actualGL ?? [])].filter(gl => !gl.isContextLost()).length })).catch(() => null)
    fs.writeFileSync(path.join(evidence, 'failure.json'), JSON.stringify({ error: String(error), checks, reports, errors, state }, null, 2) + '\n')
    throw error
} finally { await browser.close(); fs.rmSync(profile, { recursive: true, force: true }) }
