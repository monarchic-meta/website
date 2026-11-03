import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const require = createRequire(import.meta.url), ts = require('typescript')
const repo = fileURLToPath(new URL('../', import.meta.url))
const sourcePath = path.join(repo, 'docs/design-studies/code-components/SourceFormatDetails.tsx')
const source = fs.readFileSync(sourcePath, 'utf8'), hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const output = process.env.MONARCHIC_FORMAT_MOBILE_EVIDENCE_DIR ?? '/tmp/monarchic-format-mobile'
fs.mkdirSync(output, { recursive: true })
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'format-mobile-local-'))
const browser = await chromium.launchPersistentContext(profile, { headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, viewport: { width: 1440, height: 900 }, args: ['--disable-dev-shm-usage'] })
const page = browser.pages()[0], errors = [], checks = [], samples = []
const check = (name, ok) => { assert.ok(ok, name); checks.push(name) }
const near = (a, b) => Math.abs(a - b) < .06
const wait = predicate => page.waitForFunction(predicate, null, { timeout: 4000, polling: 20 })
page.on('pageerror', error => errors.push(error.message))
await page.route('**/*', route => route.abort())
try {
    await page.setContent('<style>body{margin:0}*{box-sizing:border-box}p{margin:0}a{color:inherit}</style><div id="mount"></div>')
    for (const name of ['react', 'react-dom']) await page.addScriptTag({ content: fs.readFileSync(path.join(path.dirname(require.resolve(name + '/package.json')), 'umd/' + name + '.development.js'), 'utf8') })
    await page.evaluate(() => {
        window.__target = 'preview'; window.__static = false; window.__hidden = false; window.__raf = 0
        window.__time = Date.UTC(2026, 10, 1, 12, 34, 56); Date.now = () => __time
        const raf = window.requestAnimationFrame.bind(window)
        window.requestAnimationFrame = fn => { __raf++; return raf(fn) }
        const originalMatch = window.matchMedia.bind(window), coarse = new EventTarget()
        coarse.matches = false; coarse.media = '(pointer: coarse)'
        window.matchMedia = query => query === '(pointer: coarse)' ? coarse : originalMatch(query)
        window.setCoarse = value => { coarse.matches = value; coarse.dispatchEvent(new Event('change')) }
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => __hidden })
        window.setHidden = value => { __hidden = value; document.dispatchEvent(new Event('visibilitychange')) }
        const start = window.setInterval.bind(window), stop = window.clearInterval.bind(window)
        window.__timers = new Map()
        window.setInterval = (fn, delay, ...rest) => { const id = start(fn, delay, ...rest); __timers.set(id, { fn, delay }); return id }
        window.clearInterval = id => { __timers.delete(id); stop(id) }
        window.tick = milliseconds => { __time += milliseconds; for (const timer of __timers.values()) timer.fn() }
        const SourceIO = window.IntersectionObserver
        window.__ioTracked = new Set()
        window.IntersectionObserver = class extends SourceIO {
            constructor(callback, options) { super(callback, options); this.targets = new Set(); __ioTracked.add(this) }
            observe(target) { this.targets.add(target); super.observe(target) }
            unobserve(target) { this.targets.delete(target); super.unobserve(target) }
            disconnect() { this.targets.clear(); __ioTracked.delete(this); super.disconnect() }
        }
    })
    await page.addScriptTag({ content: '(function(){const exports={};const require=n=>n==="react"?window.React:{RenderTarget:{canvas:"canvas",export:"export",thumbnail:"thumbnail",current:()=>__target},useIsStaticRenderer:()=>__static};' + compiled + ';window.FormatMobileAPI=exports;})()' })
    await page.evaluate(() => {
        const E = React.createElement, u = 390 / 393, face = 353 * u
        const Native = React.forwardRef(({ asTag, children, ...props }, ref) => E(asTag ?? 'div', { ...props, ref }, children))
        const C = Object.fromEntries(Object.entries(FormatMobileAPI).map(([name, hoc]) => [name, hoc(Native)]))
        const block = { position: 'absolute', width: 355 * u, fontSize: 12 * u, lineHeight: (12 * u) + 'px', fontFamily: 'Arial', color: '#fff' }
        window.app = ReactDOM.createRoot(document.getElementById('mount'))
        window.render = (target = 'preview', staticFlag = false) => {
            __target = target; __static = staticFlag
            app.render(E('div', { id: 'holder' }, E('div', { id: 'story', style: { height: 5000 } }, 'Preserved source story'),
                E(C.withFormatMobileSplash, { id: 'splash', ref: node => { window.nativeRef = node }, 'data-caller': 'kept', onPointerDown: () => { window.callerTaps = (window.callerTaps ?? 0) + 1 }, style: { position: 'absolute', left: 0, top: 0, width: 390, height: 844, opacity: 1 } },
                    E(C.withFormatMobileLogo, { id: 'logo', style: { position: 'absolute', left: 19 * u, top: 19.707 * u, width: 354 * u, height: 54.239 * u, background: 'white' } }, 'FORMAT'),
                    E(C.withFormatMobileDial, { id: 'dial', asTag: window.dialTag ?? 'div', style: { position: 'absolute', width: face, height: face, background: 'white', borderRadius: '50%' } },
                        E(C.withFormatDialSecond, { id: 'second', style: { position: 'absolute', width: 16.304 * face / 697, height: 16.304 * face / 697, borderRadius: '50%', background: '#000' } }),
                        E(C.withFormatDialMinute, { id: 'minute', style: { position: 'absolute', width: 27.173 * face / 697, height: 27.173 * face / 697, borderRadius: '50%', background: '#000' } }),
                        E(C.withFormatDialHour, { id: 'hour', style: { position: 'absolute', width: 40.76 * face / 697, height: 40.76 * face / 697, borderRadius: '50%', background: '#000' } })),
                    E(C.withFormatMobileCredit, { id: 'credit', style: { ...block, left: 19 * u, bottom: 55 * u, height: 12 * u } },
                        ...['Format —\u00a0', 'Obys', '\u00a0and\u00a0', 'DES', '\u00a0Special Project'].map((text, index) => E(Native, { key: index, asTag: index === 1 || index === 3 ? 'a' : 'div', href: index === 1 ? 'https://obys.agency/' : index === 3 ? 'https://des.obys.agency/' : undefined, 'data-framer-name': 'mobile-credit-' + index, style: { position: 'absolute', left: index * 10 } }, text))),
                    E(C.withFormatMobileMessage, { id: 'message', asTag: 'p', style: { ...block, left: 19 * u, bottom: 19 * u, height: 24 * u, textAlign: 'center', whiteSpace: 'pre', color: '#939393' } }, 'Sorry, this experience is designed\nfor desktop devices.'))))
        }
        window.readMobile = () => {
            const rect = id => { const r = document.getElementById(id).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom } }
            return { show: getComputedStyle(document.getElementById('splash')).visibility, splash: rect('splash'), logo: rect('logo'), dial: rect('dial'), dialVisible: getComputedStyle(document.getElementById('dial')).visibility,
                credit: rect('credit'), message: rect('message'), time: document.getElementById('dial').getAttribute('data-format-mobile-clock-time'),
                hands: ['second', 'minute', 'hour'].map(id => document.getElementById(id).style.cssText), timers: __timers.size, cadences: [...__timers.values()].map(x => x.delay), raf: __raf }
        }
        render(); window.storyRef = document.getElementById('story')
    })
    await wait(() => document.getElementById('splash') && getComputedStyle(document.getElementById('splash')).visibility === 'hidden')
    check('Fine desktop keeps the source fallback hidden without a clock subscription', (await page.evaluate(() => readMobile())).timers === 0)
    check('Native content, caller attributes and forwarded root ref survive', await page.evaluate(() => nativeRef === document.getElementById('splash') && nativeRef.dataset.caller === 'kept' && !!document.getElementById('story')))
    await page.setViewportSize({ width: 390, height: 844 })
    await wait(() => getComputedStyle(document.getElementById('splash')).visibility === 'visible' && __timers.size === 1)
    let state = await page.evaluate(() => readMobile()); samples.push({ state: 'portrait', ...state })
    check('Phone overlay occupies the viewport at the observed source geometry', near(state.splash.x, 0) && near(state.splash.y, 0) && near(state.splash.width, 390) && near(state.splash.height, 844))
    check('Native logo and697-unit dial match the source393-unit positions', near(state.logo.x, 19 * 390 / 393) && near(state.logo.y, 19.707 * 390 / 393) && near(state.logo.width, 354 * 390 / 393) && near(state.logo.height, 54.239 * 390 / 393) && near(state.dial.width, 353 * 390 / 393) && near(state.dial.x + state.dial.width / 2, 195) && near(state.dial.y + state.dial.height / 2, 422))
    check('Credits/message retain source bottom offsets and separate external links', near(844 - state.credit.bottom, 55 * 390 / 393) && near(844 - state.message.bottom, 19 * 390 / 393) && await page.locator('#credit a').count() === 2)
    check('Clock reuses one250ms subscription without a new frame loop', state.timers === 1 && state.cadences[0] === 250 && state.raf === 0)
    const before = state.hands; await page.evaluate(() => tick(1000))
    await wait(() => document.getElementById('dial').getAttribute('data-format-mobile-clock-time') === String(__time))
    check('Shared time changes the actual three native clock positions', JSON.stringify((await page.evaluate(() => readMobile())).hands) !== JSON.stringify(before))
    await page.evaluate(() => { window.previousDial = document.getElementById('dial'); window.dialTag = 'section'; render() })
    await wait(() => document.getElementById('dial')?.tagName === 'SECTION' && __timers.size === 1 && [...__ioTracked].some(observer => observer.targets.has(document.getElementById('dial'))))
    check('Visible host replacement releases the old observer and resumes the same shared clock on the new dial', await page.evaluate(() => !previousDial.isConnected && [...__ioTracked].every(observer => !observer.targets.has(previousDial)) && document.getElementById('dial').tagName === 'SECTION' && __timers.size === 1))
    await page.dispatchEvent('#splash', 'pointerdown')
    check('Root preserves the caller input handler', await page.evaluate(() => callerTaps === 1))
    await page.evaluate(() => { window.preservedStory = document.getElementById('story'); window.scrollTo(0, 700) })
    state = await page.evaluate(() => readMobile())
    check('Fallback remains fixed while the original story stays mounted', near(state.splash.y, 0) && await page.evaluate(() => document.getElementById('story') === preservedStory))
    await page.setViewportSize({ width: 768, height: 900 })
    await wait(() => getComputedStyle(document.getElementById('splash')).visibility === 'hidden' && __timers.size === 0)
    check('768px fine pointer does not inherit the earlier1280 layout cutoff', (await page.evaluate(() => readMobile())).show === 'hidden')
    await page.setViewportSize({ width: 900, height: 900 }); await page.evaluate(() => setCoarse(true))
    await wait(() => getComputedStyle(document.getElementById('splash')).visibility === 'visible' && __timers.size === 1)
    state = await page.evaluate(() => readMobile())
    check('Coarse pointer independently enables the source splash and clamps the dial height', near(state.dial.width, 900 - 190 * 900 / 393))
    await page.setViewportSize({ width: 844, height: 390 })
    await wait(() => getComputedStyle(document.getElementById('dial')).visibility === 'hidden' && __timers.size === 0)
    state = await page.evaluate(() => readMobile()); samples.push({ state: 'landscape', ...state })
    check('Short landscape hides the clock and uses source20px edges', near(state.logo.x, 20) && near(state.logo.y, 20) && near(state.logo.width, 804) && near(390 - state.message.bottom, 20))
    await page.setViewportSize({ width: 390, height: 844 })
    await wait(() => __timers.size === 1)
    await page.evaluate(() => document.getElementById('holder').style.opacity = '0')
    await wait(() => __timers.size === 0)
    check('An authored transparent ancestor suspends the clock', (await page.evaluate(() => readMobile())).timers === 0)
    await page.evaluate(() => document.getElementById('holder').style.opacity = '1')
    await wait(() => __timers.size === 1)
    await page.evaluate(() => setHidden(true)); await wait(() => __timers.size === 0)
    check('Hidden document releases its shared clock subscription', (await page.evaluate(() => readMobile())).timers === 0)
    await page.evaluate(() => setHidden(false)); await wait(() => __timers.size === 1)
    await page.emulateMedia({ reducedMotion: 'reduce' }); await wait(() => __timers.size === 0)
    check('Reduced motion keeps native artwork without a timer', await page.locator('#dial').count() === 1 && (await page.evaluate(() => readMobile())).timers === 0)
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await wait(() => __timers.size === 1)
    for (const target of ['canvas', 'export', 'thumbnail']) {
        await page.evaluate(target => render(target), target); await wait(() => __timers.size === 0)
        check(target + ' freezes native clock content', (await page.evaluate(() => readMobile())).timers === 0)
    }
    await page.evaluate(() => app.unmount()); await wait(() => __timers.size === 0)
    const resources = await page.evaluate(() => ({ timers: __timers.size, raf: __raf, media: document.querySelectorAll('video,canvas').length, observers: __ioTracked.size }))
    check('Unmount leaves no clock/frame/media/observer workload', resources.timers === 0 && resources.raf === 0 && resources.media === 0 && resources.observers === 0)
    check('No uncaught browser error', errors.length === 0)
    const result = { passed: true, sourceSHA256: hash(source), testSHA256: hash(fs.readFileSync(fileURLToPath(import.meta.url))), checks, samples, resources, errors, scope: 'One isolated native-like React fixture: source splash geometry, input preservation, media-query/time/freeze/visibility lifecycle. Placeholder logo and fixture fonts do not establish actual native artwork/font fidelity or Framer Preview/reload.', actualFramerPreviewVerified: false, afterEditorReload: false }
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2) + '\n')
    console.log(JSON.stringify({ passed: true, checks: checks.length, output }))
} catch (error) {
    console.error(JSON.stringify({ error: String(error), checks, errors, snapshot: await page.evaluate(() => typeof readMobile === 'function' ? readMobile() : null).catch(() => null) }))
    throw error
} finally {
    await browser.close(); fs.rmSync(profile, { recursive: true, force: true })
}
