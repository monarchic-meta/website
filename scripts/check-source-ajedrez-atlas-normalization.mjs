import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
const require = createRequire(import.meta.url), ts = require('typescript'), repo = fileURLToPath(new URL('../', import.meta.url))
const sourcePath = process.env.MONARCHIC_AJEDREZ_SOURCE_PATH ?? path.join(repo, 'docs/design-studies/code-components/SourceAjedrezSequence.tsx'), source = fs.readFileSync(sourcePath, 'utf8')
const output = process.env.MONARCHIC_AJEDREZ_NORMALIZER_EVIDENCE_DIR ?? '/tmp/monarchic-ajedrez-atlas-normalization'
fs.mkdirSync(output, { recursive: true })
const hash = value => crypto.createHash('sha256').update(value).digest('hex'), checks = [], requests = [], errors = []
const check = (name, value) => { assert.ok(value, name); checks.push(name) }
const assetManifest = process.env.MONARCHIC_AJEDREZ_NORMALIZER_ASSET_MANIFEST
const manifest = assetManifest ? JSON.parse(fs.readFileSync(assetManifest)) : null, publicAsset = manifest?.assets.find(asset => asset.index === 7)
const owned = '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="64"><path fill="#b3bab7" d="M0 0H128V64H0z"/><path fill="#232c29" d="M3 4H53V32H3zM61 36H124V60H61z"/><path stroke="#dbf063" stroke-width="3" d="M0 60L126 3M15 0L110 64"/></svg>'
const server = http.createServer((req, res) => {
    if (req.url === '/fixture.html') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<div>Source atlas cache regression fixture</div>'); return }
    if (req.url === '/favicon.ico') { res.writeHead(204); res.end(); return }
    requests.push(req.url)
    res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Access-Control-Allow-Origin': '*' })
    if (req.url.startsWith('/public') && publicAsset) fs.createReadStream(publicAsset.public.path).pipe(res)
    else res.end(req.url.startsWith('/oversize') ? owned.replace('width="128" height="64"', 'width="2001" height="1000"') : owned)
})
const cacheStart = source.indexOf('type AjedrezStillImageRecord ='), cacheEnd = source.indexOf('\nfunction useAjedrezPhotographicComposition', cacheStart)
assert.ok(cacheStart > 0 && cacheEnd > cacheStart)
const cacheSource = source.slice(cacheStart, cacheEnd)
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const base = 'http://127.0.0.1:' + server.address().port, urls = Array.from({ length: 10 }, (_, index) => base + '/owned-' + index + '.svg'), main = publicAsset ? base + '/public.svg' : urls[0]
const compile = () => '(()=>{' + ts.transpileModule('const AJEDREZ_PHOTO_ATLAS_URLS: readonly (string|null)[] = ' + JSON.stringify([main, ...urls]) + '\n' + cacheSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText + '\nwindow.__factory=ajedrezPhotographicImages;})()'
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] })
try {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
    const wait = (predicate, argument) => page.waitForFunction(predicate, argument, { polling: 20 })
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(base + '/fixture.html')
    await page.evaluate(() => {
        window.__raf = 0; window.__gl = 0; window.__video = 0; window.__rasterAllocations = 0; window.__failRasterOnce = false; window.__rasters = new Set()
        const raf = requestAnimationFrame; window.requestAnimationFrame = callback => { __raf++; return raf(callback) }
        const create = document.createElement.bind(document); document.createElement = (tag, ...args) => { if (tag === 'video') __video++; return create(tag, ...args) }
        const context = HTMLCanvasElement.prototype.getContext
        HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
            if (String(kind).includes('webgl')) __gl++
            if (this.dataset.sourceAjedrezAtlasRaster === 'true' && !__rasters.has(this)) { __rasters.add(this); __rasterAllocations++ }
            if (this.dataset.sourceAjedrezAtlasRaster === 'true' && __failRasterOnce) { __failRasterOnce = false; throw new Error('Injected isolated raster-copy failure') }
            return context.call(this, kind, ...args)
        }
        window.digest = async canvas => {
            const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
            return [...new Uint8Array(await crypto.subtle.digest('SHA-256', pixels))].map(n => n.toString(16).padStart(2, '0')).join('')
        }
        window.residency = () => { const records = [...__cache.backend.records.values()]; return { resident: records.filter(record => record.image.naturalWidth || record.raster?.width > 1).length, rasters: records.filter(record => record.raster?.width > 1).length, loading: records.filter(record => record.state === 'loading').length, queued: __cache.backend.queue.length } }
    })
    await page.addScriptTag({ content: compile() })
    await page.evaluate(url => { window.__cache = __factory(); window.__updates = 0; window.__main = __cache.watch(url, () => __updates++); }, main)
    await wait(() => __main.record.state === 'ready' && !!__main.record.raster)
    const first = await page.evaluate(async () => { const record = __main.record; return { width: record.raster.width, height: record.raster.height, digest: await digest(record.raster), image: record.image instanceof HTMLImageElement && record.image.complete && record.image.naturalWidth > 0, allocations: __rasterAllocations } })
    check('one lazy serial material warm produces an intrinsic 2D raster while preserving its HTMLImage driver', first.image && first.width * first.height <= 2000000 && first.allocations === 1 && requests.length === 1)
    if (publicAsset) check('production cache raster matches the already-proven public slot7 full-RGBA digest', first.digest === publicAsset.proof.RGBAsha256 && first.width === publicAsset.width && first.height === publicAsset.height)
    const crop = await page.evaluate(async () => {
        const record = __main.record, reference = document.createElement('canvas'); reference.width = record.image.naturalWidth; reference.height = record.image.naturalHeight; reference.getContext('2d').drawImage(record.image, 0, 0, reference.width, reference.height)
        const results = []
        for (const scale of [.75, 1, 1.375, 2]) {
            const w = Math.min(61, reference.width - 4), h = Math.min(37, reference.height - 4), pair = []
            for (const image of [record.raster, reference]) { const canvas = document.createElement('canvas'); canvas.width = Math.ceil(w * scale); canvas.height = Math.ceil(h * scale); canvas.getContext('2d').drawImage(image, 2, 2, w, h, 0, 0, canvas.width, canvas.height); pair.push(await digest(canvas)) }
            results.push({ scale, exact: pair[0] === pair[1] })
        }
        return results
    })
    check('the production CanvasImageSource nine-argument crop path matches an independent full-WH normalized reference at fractional scales', crop.every(result => result.exact))
    const cachedRequests = requests.length
    await page.evaluate(url => { window.__second = __cache.watch(url, () => {}); window.__oldRaster = __main.record.raster; window.__oldBackend = __cache.backend; window.__oldRecords = __cache.backend.records; }, main)
    check('a second owner reuses the same intrinsic raster without another load or allocation', requests.length === cachedRequests && await page.evaluate(() => __second.record.raster === __oldRaster && __rasterAllocations === 1))
    await page.addScriptTag({ content: compile() })
    await page.evaluate(() => { __cache = __factory(); })
    check('same-schema HMR preserves the backend, record map and already-normalized raster', requests.length === cachedRequests && await page.evaluate(() => __cache.backend === __oldBackend && __cache.backend.records === __oldRecords && __main.record.raster === __oldRaster && __rasterAllocations === 1))
    await page.evaluate(url => { __oldRaster.width = 1; __oldRaster.height = 1; __main.record.raster = undefined; __cache.peek(url); }, main)
    check('a legacy-ready image lacking its raster normalizes from cached pixels without a network retry', requests.length === cachedRequests && await page.evaluate(() => __main.record.state === 'ready' && __main.record.raster !== __oldRaster && __main.record.raster.width === __main.record.image.naturalWidth))
    check('legacy cached normalization preserves exact source pixels', await page.evaluate(() => digest(__main.record.raster)) === first.digest)
    await page.evaluate(url => { __main.record.raster.width = 4; __cache.peek(url); }, main)
    check('inadequate cached raster dimensions are repaired before reuse', requests.length === cachedRequests && await page.evaluate(() => __main.record.raster.width === __main.record.image.naturalWidth))
    await page.evaluate(url => { __failRasterOnce = true; __main.record.raster.width = 4; __cache.peek(url); }, main)
    check('a cached-copy error fails only that record and clears its raster and decoded image', await page.evaluate(() => __main.record.state === 'failed' && !__main.record.raster && __main.record.image.naturalWidth === 0))
    for (let i = 0; i < 3; i++) await page.evaluate(url => __cache.peek(url), main)
    check('failed-copy inspection does not create an automatic retry loop', requests.length === cachedRequests)
    await page.evaluate(url => { window.__other = __cache.watch(url, () => {}); }, urls[1])
    await wait(() => __other.record.state === 'ready')
    check('an independent queued material still warms after a different record fails normalization', await page.evaluate(() => __other.record.raster.width === 128 && __cache.backend.loading === null))
    await page.evaluate(url => { window.__retry = __cache.watch(url, () => {}); }, main)
    await wait(() => __retry.record.state === 'ready')
    check('one new watch recovers the failed material for all retained owners', await page.evaluate(() => __main.record === __retry.record && __main.record.raster.width > 1 && __main.record.listeners.size === 3))
    check('recovered raster retains the exact original source pixels', await page.evaluate(() => digest(__main.record.raster)) === first.digest)
    await page.evaluate(() => { __main.release(); __second.release(); __retry.release(); __other.release(); window.__pins = []; })
    for (let i = 0; i < 6; i++) {
        await page.evaluate(url => { __pins.push(__cache.watch(url, () => {})); }, urls[i])
        await wait(index => __pins[index].record.state === 'ready', i)
        check('resident atlas bound holds while pinning material ' + i, await page.evaluate(() => residency().resident <= 6 && residency().rasters <= 6 && residency().loading <= 1))
    }
    const pressureRequests = requests.length
    await page.evaluate(url => { window.__blocked = __cache.watch(url, () => {}); window.__evictedRaster = __pins[0].record.raster; }, urls[6])
    check('a seventh pinned atlas waits without an eager fetch or raster allocation', requests.length === pressureRequests && await page.evaluate(() => __blocked.record.state === 'queued' && __cache.backend.loading === null && residency().resident === 6))
    await page.evaluate(() => __pins[0].release())
    await wait(() => __blocked.record.state === 'ready')
    check('releasing one resident immediately admits queued material and disposes the evicted 2D raster', await page.evaluate(() => residency().resident === 6 && __evictedRaster.width === 1 && __evictedRaster.height === 1))
    await page.evaluate(url => { window.__pending = __cache.watch(url, () => {}); }, urls[7])
    const beforeFreeze = requests.length
    await page.evaluate(() => { __pending.release(); __pins.slice(1).forEach(lease => lease.release()); __blocked.release(); })
    check('releasing queued work before ready owners avoids any warm during freeze-style cleanup', requests.length === beforeFreeze && await page.evaluate(() => __cache.backend.loading === null && __cache.backend.queue.length === 0 && [...__cache.backend.records.values()].every(record => record.listeners.size === 0)))
    await page.evaluate(url => { window.__oversize = __cache.watch(url, () => {}); }, base + '/oversize.svg')
    await wait(() => __oversize.record.state === 'failed')
    check('an over-budget intrinsic atlas is rejected before allocating an over-budget 2D raster', await page.evaluate(() => !__oversize.record.raster && [...__rasters].every(canvas => canvas.width * canvas.height <= 2000000)))
    await page.evaluate(() => __oversize.release())
    const resources = await page.evaluate(() => ({ raf: __raf, gl: __gl, video: __video, mountedCanvas: !!document.querySelector('canvas') }))
    fs.writeFileSync(path.join(output, 'resources.json'), JSON.stringify(resources, null, 2) + '\n')
    check('normalization introduces no RAF, WebGL context, video decoder or mounted raster canvas', resources.raf === 0 && resources.gl === 0 && resources.video === 0 && !resources.mountedCanvas)
    check('no actual browser errors occurred', errors.length === 0)
    const result = { passed: true, sourceSHA256: hash(source), sourceBytes: Buffer.byteLength(source), testSHA256: hash(fs.readFileSync(import.meta.filename)), checks, requests, errors, first, crop, nodeVersion: process.version, chromiumVersion: browser.version(), publicSlot7ProofReused: publicAsset ? { manifest: assetManifest, manifestSHA256: hash(fs.readFileSync(assetManifest)), index: 7, expectedRGBAsha256: publicAsset.proof.RGBAsha256 } : null, all29Or464ProofsRerun: false, actualFramerPreviewVerified: false }
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2) + '\n')
    console.log(JSON.stringify({ passed: true, checks: checks.length, sourceSHA256: result.sourceSHA256, testSHA256: result.testSHA256 }))
} catch (error) { fs.writeFileSync(path.join(output, 'failure.json'), JSON.stringify({ error: String(error), checks, requests, errors }, null, 2)); throw error }
finally { await browser.close(); await new Promise(resolve => server.close(resolve)) }
