import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

// Prepared only. Called by the external checker after its unchanged drift
// oracles and resource assertions. This file never evaluates source-site JS.
export async function runPinLiftProof(page, { source, ts, evidence, reports, hash }) {
    const trace = [];
    const close = (actual, expected, label, tolerance = 2e-6) => assert.ok(Math.abs(actual - expected) < tolerance, `${label}: ${actual} != ${expected}`);
    const closeVec = (actual, expected, label) => actual.forEach((value, i) => close(value, expected[i], `${label}[${i}]`));
    const helpers = source.slice(source.indexOf('function basisQuat('), source.indexOf('function mergeRef<T>'));
    assert.ok(helpers.includes('function slerpQuat(') && helpers.includes('function quatBasis('));
    const context = {};
    vm.runInNewContext(ts.transpileModule(helpers, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText + '\nthis.math = {basisQuat, slerpQuat, quatBasis};', context);
    const { basisQuat, slerpQuat, quatBasis } = context.math;
    const bases = [
        { right: [1, 0, 0], up: [0, 1, 0], normal: [0, 0, 1] },
        { right: [0, 1, 0], up: [-1, 0, 0], normal: [0, 0, 1] },
        { right: [-1, 0, 0], up: [0, 1, 0], normal: [0, 0, -1] },
    ];
    for (let i = 0; i < 40; i++) {
        const y = 1 - i / 39 * 2;
        if (Math.abs(y) >= .55) continue;
        const radius = Math.sqrt(1 - y * y), phi = Math.PI * (3 - Math.sqrt(5)) * i;
        for (const turn of [0, .37, -1.1, 2.4]) {
            const normal = [Math.cos(phi + turn) * radius, y, Math.sin(phi + turn) * radius];
            const right = [normal[2], 0, -normal[0]], length = Math.hypot(...right);
            right.forEach((value, k) => right[k] = value / length);
            const up = [normal[1] * right[2], normal[2] * right[0] - normal[0] * right[2], -normal[1] * right[0]];
            bases.push({ right, up, normal });
        }
    }
    for (const [index, basis] of bases.entries()) {
        const q = basisQuat(basis.right, basis.up, basis.normal), roundtrip = quatBasis(q);
        close(Math.hypot(...q), 1, `quaternion unit ${index}`);
        for (const key of ['right', 'up', 'normal']) closeVec(roundtrip[key], basis[key], `basis roundtrip ${index} ${key}`);
        for (const amount of [0, .2, .5, 1]) close(Math.hypot(...slerpQuat(q, [0, 0, 0, 1], amount)), 1, `unit slerp ${index}/${amount}`);
    }
    const quarterTurn = basisQuat([0, 1, 0], [-1, 0, 0], [0, 0, 1]);
    closeVec(quatBasis(slerpQuat(quarterTurn, [0, 0, 0, 1], .5)).right, [Math.SQRT1_2, Math.SQRT1_2, 0], 'independent 45deg midpoint');
    reports.push({ case: 'Pin lift quaternion conversion roundtrips original affine bases and a known 45deg midpoint', bases: bases.length });

    // The independent lift oracle is a closed-form product, not the actor loop.
    const liftAt = (initial, target, milliseconds) => {
        const product = milliseconds.reduce((value, ms) => value * (1 - .12 * Math.min(1, Math.min(ms / 1000, .05) * 60)), 1);
        const result = target + (initial - target) * product;
        return target ? result > .995 ? 1 : result : result < .005 ? 0 : result;
    };
    const rotationAt = (columns, lift) => {
        const theta = Math.acos(Math.max(-1, Math.min(1, (columns[0][0] + columns[1][1] + columns[2][2] - 1) / 2)));
        if (theta < 1e-6) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        assert.ok(Math.abs(Math.sin(theta)) > 1e-5, 'chosen front plane has an unambiguous axis-angle oracle');
        const axis = [(columns[1][2] - columns[2][1]), (columns[2][0] - columns[0][2]), (columns[0][1] - columns[1][0])].map(value => value / (2 * Math.sin(theta)));
        const angle = theta * (1 - lift), c = Math.cos(angle), sine = Math.sin(angle);
        return [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(v => {
            const dot = axis.reduce((sum, value, i) => sum + value * v[i], 0), cross = [axis[1] * v[2] - axis[2] * v[1], axis[2] * v[0] - axis[0] * v[2], axis[0] * v[1] - axis[1] * v[0]];
            return v.map((value, i) => value * c + cross[i] * sine + axis[i] * dot * (1 - c));
        });
    };
    const assertRotation = (actual, expected, label) => actual.forEach((column, i) => closeVec(column, expected[i], label + ' column' + i));
    const frontPosition = [0, 0, 1.8];
    const mix = (from, to, t) => from.map((value, i) => value + (to[i] - value) * t);
    const baseFor = (index, time, angle) => {
        const all = Array.from({ length: 40 }, (_, i) => {
            const y = 1 - i / 39 * 2, r = Math.sqrt(1 - y * y), phi = Math.PI * (3 - Math.sqrt(5)) * i;
            return [Math.cos(phi) * r, y, Math.sin(phi) * r];
        }).filter(value => Math.abs(value[1]) < .55).slice(0, 16);
        const original = all[index], c = Math.cos(angle), s = Math.sin(angle);
        const normal = [original[0] * c + original[2] * s, original[1], original[2] * c - original[0] * s];
        const breath = .05 * (Math.sin((time * .1 + original[1] * 1.85 * 1.5) * Math.PI * 2) + 1);
        return { normal, position: normal.map(value => value * (1.85 + breath)) };
    };
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => {
        document.body.style.minHeight = '0'; document.getElementById('app').style.padding = '20px'; scrollTo(0, 0);
        window.savedPinRAF = requestAnimationFrame; window.savedPinCAF = cancelAnimationFrame;
        window.manualFrames = new Map(); window.manualID = 200000000; window.manualNow = 4096;
        window.requestAnimationFrame = callback => { const id = ++manualID; manualFrames.set(id, callback); frames.add(id); return id };
        window.cancelAnimationFrame = id => { manualFrames.delete(id); frames.delete(id) };
        window.manualAdvance = ms => ReactDOM.flushSync(() => { manualNow += ms; for (const [id, callback] of [...manualFrames]) { manualFrames.delete(id); frames.delete(id); callback(manualNow) } });
        window.pinNativeCalls = 0; window.pinOffscreen = false; window.pinRawProps = {}; window.pinRawFieldProps = null;
        const E = React.createElement;
        const Native = React.forwardRef((props, ref) => {
            const { onTap, onClick, onPointerUp, children, ...rest } = props;
            const plane = props['data-source-bleibt-plane'];
            // Observe committed facade inputs before CSSOM serialization. These
            // records do not replace the DOM/paint measurements below.
            React.useLayoutEffect(() => { const record = { ...props.style }; if (plane === undefined) pinRawFieldProps = record; else pinRawProps[plane] = record });
            return E('div', { ...rest, ref, onPointerUp: event => { onPointerUp?.(event); onTap?.(event.nativeEvent, { point: { x: event.clientX, y: event.clientY } }) } }, plane === undefined ? children : E('div', { 'data-native-background-image-wrapper': true, style: { position: 'absolute', inset: 0 } }, E('img', { id: 'pin-proof-img-' + plane, draggable: false, alt: 'Native picture fixture ' + plane, src: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="70"><rect width="100" height="70" fill="hsl(' + plane * 22 + ',80%,50%)"/></svg>'), style: { display: 'block', width: '100%', height: '100%' } })));
        });
        const Field = actor.withBleibtProjectField(Native), Planes = Array.from({ length: 16 }, (_, i) => actor['withBleibtProject' + String(i + 1).padStart(2, '0')](Native));
        window.pinRender = () => root.render(E(Field, { id: 'pin-proof-field', ref: node => refs.field = node, style: { width: 647, height: 647, marginTop: pinOffscreen ? 2000 : 0 } }, ...Planes.map((Plane, index) => E(Plane, { key: index, id: 'pin-proof-plane-' + index, ref: node => refs[index] = node, onTap: () => pinNativeCalls++, style: { transform: 'translateZ(0)' } }))));
        window.pinRead = index => {
            const node = refs[index], raw = pinRawProps[index], m = new DOMMatrixReadOnly(raw.transform), unit = Number(raw.width) / .4;
            const cssMatrix = new DOMMatrixReadOnly(node.style.transform);
            const matrixKeys = ['m11','m12','m13','m14','m21','m22','m23','m24','m31','m32','m33','m34','m41','m42','m43','m44'];
            const matrixInput = matrixKeys.map(key => m[key]), matrixCSSOM = matrixKeys.map(key => cssMatrix[key]);
            const scale = Math.hypot(m.m11, m.m12, m.m13), rect = node.getBoundingClientRect(), field = refs.field.getBoundingClientRect();
            const perspective = parseFloat(pinRawFieldProps.perspective), halfWidth = Number(raw.width) / 2, halfHeight = Number(raw.height) / 2;
            const corners = [-1, 1].flatMap(x => [-1, 1].map(y => { const dx = x * halfWidth, dy = y * halfHeight, z = m.m13 * dx + m.m23 * dy + m.m43, depth = 1 - z / perspective; return [(field.left + field.right) / 2 + (m.m11 * dx + m.m21 * dy + m.m41) / depth, (field.top + field.bottom) / 2 + (m.m12 * dx + m.m22 * dy + m.m42) / depth] }));
            const projected = { left: Math.min(...corners.map(v => v[0])), right: Math.max(...corners.map(v => v[0])), top: Math.min(...corners.map(v => v[1])), bottom: Math.max(...corners.map(v => v[1])) };
            return { index, lift: Number(node.dataset.sourcePlaneLift), overlay: node.dataset.sourcePlaneOverlay === 'true', cooldown: Number(node.dataset.sourcePlaneCooldown), facing: Number(node.dataset.sourcePlaneFacing), position: [m.m41 / unit, -m.m42 / unit, m.m43 / unit], scale, rotation: [[m.m11 / scale, -m.m12 / scale, m.m13 / scale], [-m.m21 / scale, m.m22 / scale, -m.m23 / scale], [m.m31 / scale, -m.m32 / scale, m.m33 / scale]], rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }, projected, time: Number(refs.field.dataset.sourceFieldTime), angle: Number(refs.field.dataset.sourceFieldAngle), pinned: Number(refs.field.dataset.sourceFieldPinned), frames: manualFrames.size, nativeCalls: pinNativeCalls, measurement: { raw: { matrix: matrixInput, width: Number(raw.width), height: Number(raw.height), perspective }, cssom: { matrix: matrixCSSOM, width: parseFloat(node.style.width), height: parseFloat(node.style.height), perspective: parseFloat(refs.field.style.perspective), transform: node.style.transform } } };
        };
    });
    const reset = async () => {
        await page.mouse.move(1, 1);
        await page.evaluate(() => { if (root) ReactDOM.flushSync(() => root.unmount()); if (manualFrames.size || frames.size) throw Error('Old pin fixture frame leak'); target = 'preview'; staticRenderer = false; pinOffscreen = false; refs = {}; pinNativeCalls = 0; pinRawProps = {}; pinRawFieldProps = null; root = ReactDOM.createRoot(document.getElementById('app')); ReactDOM.flushSync(() => pinRender()) });
        await page.waitForFunction(() => manualFrames.size === 1 && refs.field?.clientWidth === 647);
        await page.evaluate(() => { manualAdvance(0); for (let i = 0; i < 40; i++) manualAdvance(50) });
    };
    const pick = async exclude => page.evaluate(exclude => Array.from({ length: 16 }, (_, index) => pinRead(index)).find(value => value.index !== exclude && value.facing > .3 && !value.overlay && value.cooldown === 0)?.index, exclude);
    const nativeTap = async index => {
        const before = await page.evaluate(() => pinNativeCalls);
        await page.locator('#pin-proof-img-' + index).dispatchEvent('pointerup', { bubbles: true, pointerType: 'pen', pointerId: 51, button: 0 });
        await page.waitForFunction(count => pinNativeCalls === count + 1, before);
    };
    const advance = async milliseconds => page.evaluate(milliseconds => { for (const ms of milliseconds) manualAdvance(ms) }, milliseconds);
    const read = async index => page.evaluate(index => pinRead(index), index);
    const assertDOM = value => {
        for (const key of ['left', 'right', 'top', 'bottom']) close(value.rect[key], value.projected[key], `actual native perspective bounds ${key}`, 1);
        const serialized = (actual, raw, label) => {
            // Chrome CSSOM serializes these numeric CSS values to six
            // significant digits. Bound that representation independently;
            // keep the raw-prop recurrence tolerance unchanged at2e-6.
            const bound = raw === 0 ? 0 : .5 * 10 ** (Math.floor(Math.log10(Math.abs(raw))) - 5);
            assert.ok(Math.abs(actual - raw) <= bound + 1e-12, `${label}: CSSOM ${actual}, committed raw ${raw}, six-digit half-ULP ${bound}`);
        };
        value.measurement.raw.matrix.forEach((raw, i) => serialized(value.measurement.cssom.matrix[i], raw, 'matrix component' + i));
        for (const key of ['width', 'height', 'perspective']) serialized(value.measurement.cssom[key], value.measurement.raw[key], key);
        assert.equal(value.frames, 1);
    };
    const observe = (label, value, expected) => { trace.push({ label, expected, actual: value }); fs.writeFileSync(path.join(evidence, 'pin-lift-trace.json'), JSON.stringify(trace, null, 2) + '\n') };

    await reset();
    const first = await pick(-1); assert.ok(Number.isInteger(first));
    const snap = await read(first); await nativeTap(first);
    let actual = await read(first); assert.equal(actual.pinned, first); assert.equal(actual.lift, 0); close(actual.scale, 1, 'pin input does not teleport scale'); closeVec(actual.position, snap.position, 'snap logical target');
    for (const elapsed of [1, 2, 3, 4, 5, 6]) {
        await advance([50]); actual = await read(first); const lift = liftAt(0, 1, Array(elapsed).fill(50));
        close(actual.lift, lift, `intermediate lift ${elapsed}`, 1e-12); close(actual.scale, 1 + 2.2 * lift, 'intermediate source scale'); closeVec(actual.position, mix(snap.position, frontPosition, lift), 'intermediate source position'); assertRotation(actual.rotation, rotationAt(snap.rotation, lift), 'source shortest rotation'); assertDOM(actual); observe('pin-step-' + elapsed, actual, { lift });
    }
    const raised = actual.lift;
    await nativeTap(first); assert.equal((await read(first)).pinned, -1);
    await advance(Array(4).fill(50)); actual = await read(first);
    const reversed = liftAt(raised, 0, Array(4).fill(50)), belt = baseFor(first, actual.time, actual.angle);
    close(actual.lift, reversed, 'early unpin reversal', 1e-12); closeVec(actual.position, mix(belt.position, frontPosition, reversed), 'return follows current breathing rotated belt'); const beltRight = [belt.normal[2], 0, -belt.normal[0]], beltLength = Math.hypot(...beltRight); beltRight.forEach((value, i) => beltRight[i] = value / beltLength); const beltUp = [belt.normal[1] * beltRight[2], belt.normal[2] * beltRight[0] - belt.normal[0] * beltRight[2], -belt.normal[1] * beltRight[0]]; assertRotation(actual.rotation, rotationAt([beltRight, beltUp, belt.normal], reversed), 'return rotation follows live belt'); assertDOM(actual); observe('early-reversal', actual, { lift: reversed, belt });
    await nativeTap(first); assert.equal((await read(first)).pinned, -1, 'releasing plane cannot be explicitly repinned');
    const second = await pick(first); assert.ok(Number.isInteger(second));
    await nativeTap(second); assert.equal((await read(second)).pinned, second);
    await advance(Array(6).fill(50)); const retarget = await read(second); close(retarget.lift, liftAt(0, 1, Array(6).fill(50)), 'retarget lift', 1e-12); assertDOM(retarget); observe('retarget-other-plane', retarget, {});
    reports.push({ case: 'Continuous native tap pin, six intermediate perspective poses, reversal and retarget follow independent source recurrence', first, second, scope: 'DOM-dispatched pen pointerup through native tap-only nested IMG adapter; physical mouse tested separately' });

    // Publish on every50ms callback for this bounded threshold case. This does
    // not claim every production30Hz presentation paints the logical zero step.
    await nativeTap(second); let returned = await read(second), count = 0;
    while (returned.lift > 0 && count++ < 80) { await advance([50]); returned = await read(second) }
    assert.equal(returned.lift, 0); assert.equal(returned.overlay, true); assert.equal(returned.cooldown, 0); observe('published-logical-zero-step', returned, {});
    await advance([50]); returned = await read(second); assert.equal(returned.overlay, false); close(returned.cooldown, .4, 'reattach starts cooldown', 1e-12);
    await nativeTap(second); assert.equal((await read(second)).pinned, -1, 'cooldown blocks click raycast equivalent');
    await advance(Array(9).fill(50)); assert.equal((await read(second)).cooldown, 0);
    await nativeTap(second); assert.equal((await read(second)).pinned, second); observe('repin-after-cooldown', await read(second), {});
    reports.push({ case: 'Source strict terminal threshold, next-step reattachment and .4s cooldown gate pointer repin' });

    await reset();
    const mouseTarget = await page.evaluate(() => Array.from({ length: 16 }, (_, index) => { const value = pinRead(index), x = (value.rect.left + value.rect.right) / 2, y = (value.rect.top + value.rect.bottom) / 2; return { ...value, x, y, hit: document.elementFromPoint(x, y)?.closest('[data-source-bleibt-plane]')?.id } }).find(value => value.facing > .3 && value.hit === 'pin-proof-plane-' + value.index));
    assert.ok(mouseTarget, 'a visible native IMG must accept physical mouse input');
    await page.mouse.click(mouseTarget.x, mouseTarget.y); await page.waitForFunction(index => Number(refs.field.dataset.sourceFieldPinned) === index, mouseTarget.index);
    await advance(Array(6).fill(50)); actual = await read(mouseTarget.index); assertDOM(actual);
    await page.mouse.click((actual.rect.left + actual.rect.right) / 2, (actual.rect.top + actual.rect.bottom) / 2); await page.waitForFunction(() => Number(refs.field.dataset.sourceFieldPinned) === -1);
    reports.push({ case: 'Physical mouse hit-testing pins and reverses actual native tap-only nested IMG, without forced locator click', mouseTarget: mouseTarget.index });

    await reset(); const scrollTarget = await pick(-1); await nativeTap(scrollTarget); await advance(Array(6).fill(50)); const scrollRaised = (await read(scrollTarget)).lift;
    await page.evaluate(() => { document.body.style.minHeight = '2400px'; scrollTo(0, 50) }); await page.waitForFunction(() => Number(refs.field.dataset.sourceFieldPinned) === -1);
    await advance(Array(4).fill(50)); actual = await read(scrollTarget); close(actual.lift, liftAt(scrollRaised, 0, Array(4).fill(50)), 'scroll reverses ongoing lift', 1e-12); observe('scroll-reversal', actual, {});
    await page.evaluate(() => { scrollTo(0, 0); document.body.style.minHeight = '0' });
    reports.push({ case: 'Real window scroll reverses an unfinished lift rather than teleporting back' });

    const lifecycle = [];
    for (const mode of ['reduced', 'canvas', 'export', 'offscreen']) {
        await reset(); const index = await pick(-1); await nativeTap(index); await advance(Array(3).fill(50)); const before = await read(index);
        if (mode === 'reduced') await page.emulateMedia({ reducedMotion: 'reduce' });
        else await page.evaluate(mode => { if (mode === 'canvas') target = 'canvas'; else if (mode === 'export') { target = 'export'; staticRenderer = true } else pinOffscreen = true; ReactDOM.flushSync(() => pinRender()) }, mode);
        await page.waitForFunction(() => manualFrames.size === 0); await advance([500]);
        const disabled = await read(index); close(disabled.time, before.time, mode + ' no clock advance', 1e-12); assert.equal(disabled.frames, 0);
        if (mode === 'reduced') await page.emulateMedia({ reducedMotion: 'no-preference' });
        else await page.evaluate(() => { target = 'preview'; staticRenderer = false; pinOffscreen = false; ReactDOM.flushSync(() => pinRender()) });
        await page.waitForFunction(() => manualFrames.size === 1); await advance([0]); const resumed = await read(index); close(resumed.lift, before.lift, mode + ' pending lift retained', 1e-12);
        lifecycle.push({ mode, before, disabled, resumed });
    }
    await page.evaluate(() => { ReactDOM.flushSync(() => root.unmount()); if (manualFrames.size || frames.size) throw Error('Pin proof leaked RAF'); window.requestAnimationFrame = savedPinRAF; window.cancelAnimationFrame = savedPinCAF });
    assert.equal(await page.evaluate(() => frames.size), 0); assert.equal(await page.evaluate(() => document.querySelectorAll('canvas').length), 0);
    fs.writeFileSync(path.join(evidence, 'pin-lift-lifecycle.json'), JSON.stringify(lifecycle, null, 2) + '\n');
    reports.push({ case: 'Pending lift creates no work under reduced/Canvas/export/offscreen and cleans the one owned field RAF', lifecycle });
    fs.writeFileSync(path.join(evidence, 'pin-lift-proof-receipt.json'), JSON.stringify({ sourceSHA256: hash(source), proofSHA256: hash(fs.readFileSync(import.meta.filename)), traceCases: trace.length, scope: 'Local authored raw committed native-style props, separately measured DOM perspective bounds and CSSOM six-significant-digit serialization, input and math. Raw-prop recurrence tolerance remains2e-6. Retained source JS was not executed. Actual Framer Preview/reload and the committed CSS-target snapshot fit remain separate.' }, null, 2) + '\n');
}
