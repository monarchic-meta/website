import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const require = createRequire(import.meta.url)
const repo = fileURLToPath(new URL('../', import.meta.url))
const ts = require('typescript')
const file = process.env.MONARCHIC_TYPE_PROXIMITY_SOURCE_PATH ?? path.join(repo, 'docs/design-studies/code-components/SourceTypeProximity.tsx')
const source = fs.readFileSync(file, 'utf8')
const hash = data => crypto.createHash('sha256').update(data).digest('hex')
const output = process.env.MONARCHIC_TYPE_PROXIMITY_EVIDENCE_DIR ?? '/tmp/monarchic-source-type-proximity-browser'
fs.mkdirSync(output, { recursive: true })
const react = fs.readFileSync(path.join(path.dirname(require.resolve('react/package.json')), 'umd/react.development.js'), 'utf8')
const reactDOM = fs.readFileSync(path.join(path.dirname(require.resolve('react-dom/package.json')), 'umd/react-dom.development.js'), 'utf8')
const fontFile = path.join(path.dirname(require.resolve('@fontsource-variable/space-grotesk/package.json')), 'files/space-grotesk-latin-wght-normal.woff2')
const font = fs.readFileSync(fontFile)
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText
const checks = [], errors = []
const check = (name, condition) => { assert.ok(condition, name); checks.push(name) }
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH })
try {
    const page = await browser.newPage({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 1 })
    page.setDefaultTimeout(5000)
    page.on('pageerror', error => errors.push(error.message))
    await page.setContent(`<!doctype html><style>
      @font-face{font-family:FixtureVariable;src:url(data:font/woff2;base64,${font.toString('base64')});font-weight:300 700;font-style:normal;font-display:block}
      html,body{margin:0;min-height:1800px;background:#fff;color:#111}
      #mount{padding:30px}.word{display:flex;width:max-content;gap:0;margin-bottom:30px}
      .letter{font-family:FixtureVariable;font-size:64px;line-height:1.1;transition:opacity 2s linear,color .2s ease}
      .letter p{margin:0;font-family:FixtureVariable;font-weight:700;line-height:1.1}
    </style><div id="mount"></div>`)
    await page.addScriptTag({ content: react })
    await page.addScriptTag({ content: reactDOM })
    await page.evaluate(() => {
        window.__target = 'preview'
        window.__static = false
        window.exports = {}
        window.require = name => name === 'react' ? window.React : name === 'framer' ? {
            RenderTarget: { canvas: 'canvas', current: () => __target },
            useIsStaticRenderer: () => __static,
        } : undefined
        window.__frames = new Set()
        window.__requests = 0
        const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window)
        window.requestAnimationFrame = callback => {
            __requests++
            const id = request(time => { __frames.delete(id); callback(time) })
            __frames.add(id)
            return id
        }
        window.cancelAnimationFrame = id => { __frames.delete(id); cancel(id) }
        window.__listeners = new Map()
        const add = window.addEventListener.bind(window), remove = window.removeEventListener.bind(window)
        window.addEventListener = (type, fn, options) => {
            if (['resize', 'scroll'].includes(type)) __listeners.set(fn, type)
            return add(type, fn, options)
        }
        window.removeEventListener = (type, fn, options) => { __listeners.delete(fn); return remove(type, fn, options) }
        window.__rectReads = 0
        window.__realRect = HTMLElement.prototype.getBoundingClientRect
        HTMLElement.prototype.getBoundingClientRect = function () {
            if (this.hasAttribute('data-source-type-letter')) __rectReads++
            return __realRect.call(this)
        }
    })
    await page.addScriptTag({ content: code })
    await page.evaluate(() => {
        const Native = React.forwardRef((props, ref) => React.createElement('div', { ...props, ref }))
        window.Word = exports.withSourceTypeWord(Native)
        window.Letter = exports.withSourceTypeLetter(Native)
        window.__refs = {}
        window.__events = { enter: 0, move: 0, leave: 0, click: 0 }
        window.__prevent = false
        window.__transition = undefined
        window.__root = ReactDOM.createRoot(document.getElementById('mount'))
        window.render = () => ReactDOM.flushSync(() => __root.render(React.createElement(Word, {
            className: 'word', id: 'word', ref: node => { __refs.word = node },
            onMouseEnter: event => { __events.enter++; window.__lastEvent={x:event.clientX,y:event.clientY}; if (__prevent) event.preventDefault() },
            onMouseMove: () => __events.move++, onMouseLeave: () => __events.leave++,
            onClick: () => __events.click++, title: 'Native caller prop',
        }, Array.from('Story').map((letter, i) => React.createElement(Letter, {
            key: i, id: 'letter-' + i, className: 'letter', ref: node => { __refs[i] = node },
            style: { color: '#111111', opacity: 1, transition: __transition },
        }, React.createElement('p', null, React.createElement('span', null, letter)))))))
        window.snapshot = () => Array.from(document.querySelectorAll('[data-source-type-letter]')).map(node => ({
            id: node.id, target: Number(node.getAttribute('data-source-type-weight')),
            epoch: Number(node.getAttribute('data-source-type-bounds-epoch')),
            property: getComputedStyle(node).transitionProperty,
            duration: getComputedStyle(node).transitionDuration,
            timing: getComputedStyle(node).transitionTimingFunction,
            value: Number(getComputedStyle(node).getPropertyValue('--source-type-weight')),
            axis: getComputedStyle(node.querySelector('span')).fontVariationSettings,
            font: getComputedStyle(node.querySelector('span')).fontFamily,
        }))
        window.center = () => { const r = __realRect.call(document.getElementById('letter-0')); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } }
        window.enter = point => ReactDOM.flushSync(() => document.getElementById('word').dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: point.x, clientY: point.y, relatedTarget: document.body })))
        window.move = point => document.getElementById('word').dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: point.x, clientY: point.y }))
        window.leave = () => ReactDOM.flushSync(() => document.getElementById('word').dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body })))
        render()
    })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(50)
    // MouseEvent client coordinates are integral in Chromium. Align this
    // fixture's first center to whole pixels so exact900/650 bins are testable.
    await page.evaluate(() => { const p = center(); document.getElementById('word').style.transform = 'translate(' + (Math.ceil(p.x)-p.x) + 'px,' + (Math.ceil(p.y)-p.y) + 'px)' })
    const baseline = await page.evaluate(() => ({ letters: snapshot(), reads: __rectReads, refs: __refs.word?.id === 'word' && __refs[0]?.id === 'letter-0', title: __refs.word?.title }))
    check('Actual React18 and open-licensed variable font loaded', await page.evaluate(() => React.version.startsWith('18.') && document.fonts.check('64px FixtureVariable')))
    check('Native refs, caller props and resting descendant weight preserved', baseline.refs && baseline.title === 'Native caller prop' && baseline.letters.every(row => row.target === 400 && row.axis === '"wght" 400' && row.font.includes('FixtureVariable')))
    await page.screenshot({ path: path.join(output, 'resting.png'), clip: { x: 20, y: 20, width: 350, height: 110 } })
    const entered = await page.evaluate(() => { window.__center = center(); const before = __requests; enter(__center); return { row: snapshot()[0], requests: __requests - before, reads: __rectReads, events:{...__events} } })
    await page.waitForFunction(() => Number(document.getElementById('letter-0').getAttribute('data-source-type-weight')) === 900)
    entered.firstCommit = await page.evaluate(() => ({ row:snapshot()[0], requests:__requests }))
    check('Mouse entry reaches900 on the first React commit without a RAF', entered.firstCommit.row.target === 900 && entered.firstCommit.row.value === 900 && entered.requests === 0 && entered.firstCommit.requests === 0)
    const cachedReads = await page.evaluate(() => __rectReads)
    await page.evaluate(() => move({ x: __center.x, y: __center.y + 10 }))
    await page.waitForFunction(() => Number(document.getElementById('letter-0').getAttribute('data-source-type-weight')) === 650)
    const midpoint = await page.evaluate(() => snapshot()[0])
    check('20px Euclidean radius and exact smoothstep midpoint produce650', midpoint.target === 650 && midpoint.axis === '"wght" 650')
    for (let i = 0; i < 4; i++) { await page.evaluate(() => move(__center)); await page.waitForTimeout(40) }
    check('Changed variable widths never feed back into cached letter bounds', await page.evaluate(() => __rectReads === 10) && cachedReads === 10)
    await page.screenshot({ path: path.join(output, 'hovered.png'), clip: { x: 20, y: 20, width: 350, height: 110 } })
    const sharp = createRequire(require.resolve('astro/package.json'))('sharp')
    const a = await sharp(path.join(output, 'resting.png')).raw().toBuffer(), b = await sharp(path.join(output, 'hovered.png')).raw().toBuffer()
    let changedChannels = 0
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) changedChannels++
    check('Actual variable-font glyph pixels visibly change', changedChannels > 100)
    const leaveStart = await page.evaluate(() => { leave(); return snapshot()[0] })
    await page.waitForTimeout(90)
    const leaveMiddle = await page.evaluate(() => snapshot()[0])
    await page.waitForTimeout(500)
    const leaveEnd = await page.evaluate(() => snapshot()[0])
    check('Registered numeric custom property interpolates to400 over0.5s ease', leaveMiddle.target === 400 && leaveMiddle.value > 400 && leaveMiddle.value < 900 && leaveEnd.value === 400 && leaveEnd.axis === '"wght" 400')
    check('Native opacity/color transitions survive the added weight transition', leaveEnd.property === 'opacity, color, --source-type-weight' && leaveEnd.duration === '2s, 0.2s, 0.5s' && leaveEnd.timing === 'linear, ease, ease')
    await page.evaluate(() => { __transition = 'opacity 3s linear, transform 1s ease-in'; render() })
    const updatedTransition = await page.evaluate(() => snapshot()[0])
    check('Caller transition-prop updates are preserved', updatedTransition.property === 'opacity, transform, --source-type-weight' && updatedTransition.duration === '3s, 1s, 0.5s')
    await page.evaluate(() => { __prevent = true; enter(center()) })
    check('Caller defaultPrevented cancels helper activation', (await page.evaluate(() => snapshot()[0])).target === 400)
    await page.evaluate(() => { __prevent = false; enter(center()) })
    const beforeResize = await page.evaluate(() => ({ reads: __rectReads, epoch: snapshot()[0].epoch }))
    await page.evaluate(() => { document.getElementById('mount').style.paddingLeft = '90px'; dispatchEvent(new Event('resize')) })
    await page.waitForFunction(epoch => Number(document.getElementById('letter-0').getAttribute('data-source-type-bounds-epoch')) > epoch, beforeResize.epoch)
    const afterResize = await page.evaluate(() => ({ row: snapshot()[0], reads: __rectReads }))
    check('Resize epoch refreshes own cached bounds once per letter', afterResize.reads === beforeResize.reads + 5 && afterResize.row.target === 400)
    const beforeScroll = await page.evaluate(() => ({ reads: __rectReads, epoch: snapshot()[0].epoch }))
    await page.evaluate(() => window.scrollTo(0, 35))
    await page.waitForFunction(epoch => Number(document.getElementById('letter-0').getAttribute('data-source-type-bounds-epoch')) > epoch, beforeScroll.epoch)
    check('Captured document/nested scroll invalidates cached centers', await page.evaluate(before => __rectReads === before + 5, beforeScroll.reads))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForTimeout(40)
    await page.evaluate(() => enter(center()))
    await page.waitForFunction(() => Number(document.getElementById('letter-0').getAttribute('data-source-type-weight')) >= 895)
    const reduced = { active: await page.evaluate(() => snapshot()[0]) }
    await page.evaluate(() => leave())
    await page.waitForFunction(() => Number(document.getElementById('letter-0').getAttribute('data-source-type-weight')) === 400)
    reduced.resting = await page.evaluate(() => snapshot()[0])
    check('Reduced motion tracks immediately and leaves without interpolation', reduced.active.target >= 895 && reduced.resting.value === 400 && reduced.resting.duration.endsWith('0s'))
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    const frozen = []
    for (const target of ['canvas', 'export']) {
        await page.evaluate(target => { __target = target; __static = target === 'export'; render() }, target)
        const state = await page.evaluate(() => { const before = __requests; enter(center()); move(center()); leave(); return { letters: snapshot(), requests: __requests - before } })
        frozen.push({ target, ...state })
        check(target + ' stays at400 and schedules no pointer animation', state.requests === 0 && state.letters.every(row => row.target === 400 && row.axis === '"wght" 400'))
    }
    await page.evaluate(() => { __target = 'preview'; __static = false; render() })
    await page.evaluate(() => { enter(center()); move({ x: 0, y: 0 }); document.getElementById('word').click() })
    const events = await page.evaluate(() => ({ ...__events }))
    check('Native enter/move/leave/click handlers remain callable', events.enter > 2 && events.move > 2 && events.leave > 2 && events.click === 1)
    await page.evaluate(() => ReactDOM.flushSync(() => __root.unmount()))
    await page.waitForTimeout(50)
    const cleanup = await page.evaluate(() => ({ frames: __frames.size, listeners: __listeners.size, wordRef: __refs.word, letterRef: __refs[0] }))
    check('Unmount cancels pending RAF, removes listeners and clears forwarded refs', cleanup.frames === 0 && cleanup.listeners === 0 && cleanup.wordRef === null && cleanup.letterRef === null)
    await page.evaluate(() => {
        window.__nativeEvents = { start: 0, move: 0, end: 0, mouseEnter: 0, mouseMove: 0, mouseLeave: 0, click: 0 }
        window.__nativeCancel = ''; window.__nativeDual = false
        const NativeWord = React.forwardRef(({ onMouseEnter, onMouseMove, onMouseLeave, onHoverStart, onHoverEnd, onPointerMove, ...props }, ref) => React.createElement('div', {
            ...props, ref,
            onPointerEnter: event => { const info = { point: { x: event.clientX, y: event.clientY } }; window.__nativeInfo = info; onHoverStart?.(event, info); if (__nativeDual) onMouseEnter?.(event) },
            onPointerMove: event => { if (window.__nativeMoveChannel !== 'mouse') onPointerMove?.(event); if (__nativeDual || window.__nativeMoveChannel === 'mouse') onMouseMove?.(event) },
            onPointerLeave: event => { const info = { point: { x: event.clientX, y: event.clientY } }; onHoverEnd?.(event, info); if (__nativeDual) onMouseLeave?.(event) },
        }))
        const NativeOnlyWord = exports.withSourceTypeWord(NativeWord)
        window.__nativeRoot = ReactDOM.createRoot(document.getElementById('mount'))
        window.renderNative = () => ReactDOM.flushSync(() => __nativeRoot.render(React.createElement(NativeOnlyWord, {
            className: 'word', id: 'word', ref: node => { __refs.word = node }, title: 'Native hover caller',
            onHoverStart: (event, info) => { __nativeEvents.start++; window.__forwardedNativeInfo = info; if (__nativeCancel === 'start') event.preventDefault() },
            onPointerMove: event => { __nativeEvents.move++; if (__nativeCancel === 'move') event.preventDefault() },
            onHoverEnd: event => { __nativeEvents.end++; if (__nativeCancel === 'end') event.preventDefault() },
            onMouseEnter: () => __nativeEvents.mouseEnter++, onMouseMove: () => __nativeEvents.mouseMove++, onMouseLeave: () => __nativeEvents.mouseLeave++,
            onClick: () => __nativeEvents.click++,
        }, Array.from('Story').map((letter, i) => React.createElement(Letter, { key: i, id: 'letter-' + i, className: 'letter', ref: node => { __refs[i] = node } }, React.createElement('p', null, React.createElement('span', null, letter)))))))
        window.scrollTo(0, 0); renderNative()
    })
    await page.waitForTimeout(50)
    await page.evaluate(() => { const p = center(); document.getElementById('word').style.transform = 'translate(' + (Math.ceil(p.x) - p.x) + 'px,' + (Math.ceil(p.y) - p.y) + 'px)' })
    await page.mouse.move(550, 350)
    await page.screenshot({ path: path.join(output, 'native-resting.png'), clip: { x: 80, y: 20, width: 350, height: 110 } })
    const nativeCenter = await page.evaluate(() => center())
    await page.mouse.move(nativeCenter.x, nativeCenter.y)
    await page.waitForTimeout(80)
    const nativeEntry = await page.evaluate(() => ({ letters: snapshot(), events: { ...__nativeEvents }, infoPreserved: __nativeInfo === __forwardedNativeInfo, refs: __refs.word?.id === 'word' && __refs[0]?.id === 'letter-0' }))
    fs.writeFileSync(path.join(output, 'native-entry-observation.json'), JSON.stringify({ sourceSHA256: hash(source), nativeEntry }, null, 2) + '\n')
    check('Native Frame dropping mouse props activates through real hover and pointer channels', nativeEntry.letters[0].target >= 895 && nativeEntry.letters[0].epoch > 0 && nativeEntry.events.start === 1 && nativeEntry.events.mouseEnter === 0)
    check('Native hover info, caller refs and unrelated props are preserved', nativeEntry.infoPreserved && nativeEntry.refs && await page.evaluate(() => document.getElementById('word').title === 'Native hover caller'))
    await page.screenshot({ path: path.join(output, 'native-hovered.png'), clip: { x: 80, y: 20, width: 350, height: 110 } })
    const nativeRest = await sharp(path.join(output, 'native-resting.png')).raw().toBuffer(), nativeHover = await sharp(path.join(output, 'native-hovered.png')).raw().toBuffer()
    let nativePixelChanges = 0
    for (let i = 0; i < nativeRest.length; i++) if (nativeRest[i] !== nativeHover[i]) nativePixelChanges++
    check('Native hover adapters change actual variable-font glyph pixels', nativePixelChanges > 100)
    await page.mouse.move(nativeCenter.x, nativeCenter.y + 10); await page.waitForTimeout(60)
    check('Native pointer movement retains the exact650 falloff bin', (await page.evaluate(() => snapshot()[0])).target === 650)
    await page.evaluate(() => { __nativeMoveChannel = 'mouse' }); await page.mouse.move(nativeCenter.x, nativeCenter.y + 9); await page.waitForTimeout(60)
    await page.evaluate(() => { __nativeMoveChannel = 'pointer' }); await page.mouse.move(nativeCenter.x, nativeCenter.y + 10); await page.waitForTimeout(60)
    check('Native channel handoff preserves a legitimate1px pointer movement', (await page.evaluate(() => snapshot()[0])).target === 650)
    const beforeNativeMove = await page.evaluate(() => snapshot()[0].target)
    await page.evaluate(() => { __nativeCancel = 'move' }); await page.mouse.move(nativeCenter.x + 8, nativeCenter.y + 10); await page.waitForTimeout(60)
    check('Caller native pointer cancellation prevents helper mutation', (await page.evaluate(() => snapshot()[0])).target === beforeNativeMove)
    await page.evaluate(() => { __nativeCancel = ''; __nativeDual = true }); await page.mouse.move(550, 350); await page.waitForTimeout(550)
    const beforeDual = await page.evaluate(() => ({ reads: __rectReads, epoch: snapshot()[0].epoch }))
    await page.mouse.move(nativeCenter.x, nativeCenter.y); await page.waitForTimeout(60)
    const afterDual = await page.evaluate(() => ({ reads: __rectReads, row: snapshot()[0], events: { ...__nativeEvents } }))
    check('Dual native hover/mouse entry measures each current letter only once', afterDual.reads === beforeDual.reads + 5 && afterDual.row.epoch === beforeDual.epoch + 1 && afterDual.row.target >= 895 && afterDual.events.mouseEnter > 0)
    await page.mouse.move(550, 350); await page.waitForTimeout(550); await page.evaluate(() => { __nativeCancel = 'start' })
    await page.mouse.move(nativeCenter.x, nativeCenter.y); await page.waitForTimeout(60)
    check('Canceled native hover also suppresses its duplicate mouse entry', (await page.evaluate(() => snapshot()[0])).target === 400)
    await page.evaluate(() => { __nativeCancel = ''; __nativeDual = false }); await page.mouse.move(550, 350); await page.mouse.move(nativeCenter.x, nativeCenter.y); await page.waitForTimeout(60)
    await page.evaluate(() => { __nativeCancel = 'end' }); await page.mouse.move(550, 350); await page.waitForTimeout(60)
    check('Caller native hover-end cancellation retains the active helper state', (await page.evaluate(() => snapshot()[0])).target >= 895)
    await page.evaluate(() => { __nativeCancel = '' }); await page.mouse.move(nativeCenter.x, nativeCenter.y); await page.mouse.move(550, 350); await page.waitForTimeout(550)
    check('Native hover end returns to400 and leaves zero idle RAF', await page.evaluate(() => snapshot()[0].value === 400 && __frames.size === 0))
    const nativeBeforeRefresh = await page.evaluate(() => ({ reads: __rectReads, epoch: snapshot()[0].epoch }))
    await page.evaluate(() => { document.getElementById('word').style.marginLeft = '25px'; dispatchEvent(new Event('resize')) })
    await page.waitForTimeout(30)
    check('Native adapter keeps current-ref bounds refresh after layout change', await page.evaluate(before => __rectReads === before.reads + 5 && snapshot()[0].epoch > before.epoch, nativeBeforeRefresh))
    await page.locator('#word').click(); check('Native adapter preserves unrelated click behavior', await page.evaluate(() => __nativeEvents.click === 1))
    const nativeFrozen = []
    for (const target of ['canvas', 'export']) {
        await page.evaluate(target => { __target = target; __static = target === 'export'; renderNative() }, target)
        const before = await page.evaluate(() => __requests); await page.mouse.move(550, 350); const p = await page.evaluate(() => center()); await page.mouse.move(p.x, p.y); await page.waitForTimeout(40)
        const frozenState = await page.evaluate(() => ({ letters: snapshot(), requests: __requests }))
        nativeFrozen.push({ target, ...frozenState }); check('Native ' + target + ' forwards caller events without pointer animation', frozenState.requests === before && frozenState.letters.every(row => row.target === 400))
    }
    await page.evaluate(() => ReactDOM.flushSync(() => __nativeRoot.unmount())); await page.waitForTimeout(40)
    const nativeCleanup = await page.evaluate(() => ({ frames: __frames.size, listeners: __listeners.size, word: __refs.word, letter: __refs[0] }))
    check('Native event bridge cleans all pending work and caller refs', nativeCleanup.frames === 0 && nativeCleanup.listeners === 0 && nativeCleanup.word === null && nativeCleanup.letter === null)
    const nativeAdapter = { nativeEntry, nativePixelChanges, afterDual, nativeFrozen, nativeCleanup, scope: 'Real React/Chromium native-like component drops mouse handlers and forwards public hover/pointer events. Actual Framer event forwarding remains a separate retest.' }

    check('No actual browser errors', errors.length === 0)
    const result = { passed: true, sourceSHA256: hash(source), testSHA256: hash(fs.readFileSync(import.meta.filename)), fontFixture: { package: '@fontsource-variable/space-grotesk@5.3.0', path: fontFile, sha256: hash(font), range: [300, 700], note: 'Open-licensed fixture proves actual variable glyph rendering; requested source400–900 CSS axis values are checked separately from fixture font range.' }, checks, changedChannels, baseline, entered, midpoint, leave: [leaveStart, leaveMiddle, leaveEnd], updatedTransition, reduced, frozen, cleanup, nativeAdapter, errors, scope: 'Actual React18/Chromium pointer, font pixels, cached bounds, native transition/ref/event preservation, reduced/static targets and cleanup. Actual commercial font assignment and Framer persistence remain separate.' }
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2) + '\n')
    console.log(JSON.stringify({ passed: true, checks: checks.length, changedChannels, evidence: output, sourceSHA256: result.sourceSHA256 }, null, 2))
} catch (error) {
    fs.writeFileSync(path.join(output, 'failure.json'), JSON.stringify({ message: String(error), checks, errors }, null, 2) + '\n')
    throw error
} finally { await browser.close() }
