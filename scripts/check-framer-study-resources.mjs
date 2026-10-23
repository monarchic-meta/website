import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Exercise the actual Framer study coordinators/renderers without React,
// a browser, network access, or generated files. The small DOM/WebGL doubles
// measure context ownership, scheduling, copying, and lifecycle transitions.
// They do not execute GLSL or replace real-browser visual/framebuffer checks.
// Run with: pnpm check:framer-studies

async function run() {
    const repo = fileURLToPath(new URL("../", import.meta.url));
    const ts = createRequire(path.join(repo, 'package.json'))('typescript');
    const manifest = JSON.parse(fs.readFileSync(repo + '/docs/design-studies/code-components/manifest.json', 'utf8'));
    const files = [...new Set(manifest.studies.map(s => s.componentSource))];
    let time = 1000, serial = 0, peakContexts = 0, peakPixels = 0, draws = 0, copies = 0, created = 0;
    const timers = new Map(), active = new Set(), owned = new Set(), shaderBySource = new Map(), renderErrors = [], checks = [];
    const hash = x => crypto.createHash('sha256').update(x).digest('hex');
    class Target {
        listeners = new Map();
        addEventListener(name, callback) {
            if (!this.listeners.has(name))
                this.listeners.set(name, new Set());
            this.listeners.get(name).add(callback);
        }
        removeEventListener(name, callback) {
            this.listeners.get(name)?.delete(callback);
        }
        dispatchEvent(event) {
            for (const callback of [...(this.listeners.get(event.type) ?? [])])
                callback(event);
        }
    }
    const sample = () => {
        peakContexts = Math.max(peakContexts, active.size);
        peakPixels = Math.max(peakPixels, [...active].reduce((n, g) => n + g.canvas.width * g.canvas.height, 0));
    };
    function createGL(canvas) {
        let lost = false, program = null, mode = 0, phase = 0, intensity = 1;
        const constants = new Map(), allocate = kind => {
            if (lost)
                return null;
            const handle = { kind };
            owned.add(handle);
            return handle;
        }, remove = handle => owned.delete(handle);
        const state = { canvas, get lost() {
                return lost;
            }, get phase() {
                return phase;
            }, get mode() {
                return mode;
            } };
        const api = {
            createShader: () => allocate('shader'), createProgram: () => allocate('program'), createBuffer: () => allocate('buffer'), createTexture: () => allocate('texture'), deleteShader: remove, deleteProgram: remove, deleteBuffer: remove, deleteTexture: remove,
            shaderSource(shader, source) {
                shader.source = source;
            }, attachShader(p, s) {
                (p.shaders ??= []).push(s);
            }, getShaderParameter: () => true, getProgramParameter: () => true, getShaderPrecisionFormat: () => ({ precision: 23 }), getAttribLocation: () => 0, getUniformLocation: (_p, name) => ({ name }),
            useProgram(p) {
                program = p;
            }, uniform1f(location, value) {
                if (location?.name === 'u_time')
                    phase = value;
                if (location?.name === 'u_mode')
                    mode = value;
                if (location?.name === 'u_intensity')
                    intensity = value;
            },
            drawArrays() {
                draws++;
                canvas.frame = { phase, mode, intensity, shader: hash((program?.shaders ?? []).map(s => s.source).join('\n')) };
                sample();
            },
            isContextLost: () => lost, getExtension(name) {
                if (name !== 'WEBGL_lose_context')
                    return null;
                return { loseContext() {
                        lost = true;
                        active.delete(state);
                    }, restoreContext() {
                        lost = false;
                        active.add(state);
                        canvas.dispatchEvent({ type: 'webglcontextrestored' });
                    } };
            },
        };
        const gl = new Proxy(api, { get: (object, key) => key in object ? object[key] : typeof key === 'string' && key === key.toUpperCase() ? (constants.has(key) ? constants.get(key) : (constants.set(key, constants.size + 1), constants.get(key))) : () => {
            } });
        state.api = gl;
        active.add(state);
        created++;
        sample();
        return gl;
    }
    class Canvas extends Target {
        width = 300;
        height = 150;
        clientWidth = 960;
        clientHeight = 600;
        isConnected = false;
        frame = null;
        getContext(kind) {
            if (kind === '2d')
                return this.twoD ??= new Proxy({ canvas: this, fillStyle: '#ffffff', drawImage: (source) => {
                        copies++;
                        this.frame = source.frame ? { ...source.frame } : null;
                    }, getImageData: () => ({ data: new Uint8ClampedArray([255, 255, 255, 255]) }) }, { get: (o, k) => k in o ? o[k] : () => {
                    } });
            if (kind === 'webgl')
                return this.gl ??= createGL(this);
            return null;
        }
        getBoundingClientRect() {
            return this.root?.getBoundingClientRect() ?? {
                left: 0, top: 0, width: this.clientWidth, height: this.clientHeight, right: this.clientWidth, bottom: this.clientHeight
            };
        }
    }
    class Root extends Target {
        clientWidth = 960;
        clientHeight = 600;
        isConnected = true;
        constructor(index) {
            super();
            this.setRect(index % 10 * 125, Math.floor(index / 10) * 90 + 30, 115, 72);
        }
        setRect(left, top, width, height) {
            this.rect = {
                left, top, width, height, right: left + width, bottom: top + height
            };
        }
        getBoundingClientRect() {
            return this.rect;
        }
        contains(element) {
            return element === this;
        }
    }
    const document = new Target();
    document.hidden = false;
    document.activeElement = null;
    document.createElement = name => name === 'canvas' ? new Canvas() : new Root(0);
    const window = new Target();
    window.document = document;
    window.innerWidth = 1280;
    window.innerHeight = 900;
    window.devicePixelRatio = 1.5;
    const motion = new Target();
    motion.matches = false;
    window.matchMedia = () => motion;
    const setTimeout = (callback, delay = 0) => {
        const id = ++serial;
        timers.set(id, { callback, due: time + delay });
        return id;
    }, clearTimeout = id => timers.delete(id);
    window.setTimeout = setTimeout;
    window.clearTimeout = clearTimeout;
    const raf = callback => setTimeout(() => callback(time), 16);
    const observers = [];
    class ResizeObserver {
        constructor(callback) {
            this.callback = callback;
            observers.push(this);
        }
        observe() {
        }
        disconnect() {
        }
    }
    class IntersectionObserver {
        constructor(callback) {
            this.callback = callback;
            observers.push(this);
        }
        observe() {
        }
        disconnect() {
        }
    }
    const context = vm.createContext({
        window, document, performance: { now: () => time }, setTimeout, clearTimeout, requestAnimationFrame: raf, cancelAnimationFrame: clearTimeout, ResizeObserver, IntersectionObserver, HTMLCanvasElement: Canvas, queueMicrotask, console, Float32Array, Uint8Array, Uint8ClampedArray, React: {}, RenderTarget: { canvas: 'canvas', preview: 'preview', export: 'export', thumbnail: 'thumbnail' }, getComputedStyle: () => ({ getPropertyValue: () => '' })
    });
    const modules = new Map(), coordinators = [];
    for (const file of files) {
        const source = fs.readFileSync(repo + '/docs/design-studies/code-components/' + file, 'utf8'), end = source.indexOf('/**\n * @framerSupportedLayoutWidth', source.indexOf('function createRenderer'));
        assert.ok(end > 0, 'helper prefix exists ' + file);
        coordinators.push(source.slice(source.indexOf('const STUDY_POOL_KEY'), end));
        const result = ts.transpileModule(source.slice(0, end), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2022 } });
        const js = result.outputText.replace(/^import .* from "(?:react|framer)";?\r?\n/gm, '').replace(/^export \{\};?\r?\n/gm, '');
        const api = vm.runInContext('(function(){' + js + ';return {createRenderer,getStudyPool,useStudySurface,VERTEX,FRAGMENT' + (source.includes('const CANOPY_VERTEX') ? ',CANOPY_VERTEX,CANOPY_FRAGMENT' : '') + '};})()', context);
        modules.set(file, api);
        shaderBySource.set(file, new Set([hash(api.VERTEX + '\n' + api.FRAGMENT), ...(api.CANOPY_VERTEX ? [hash(api.CANOPY_VERTEX + '\n' + api.CANOPY_FRAGMENT)] : [])]));
    }
    assert.equal(files.length, 5, 'five standalone study modules');
    assert.equal(manifest.studies.length, 20, 'twenty distinct studies');
    for (const coordinator of coordinators)
        assert.equal(coordinator, coordinators[0], 'standalone modules keep identical shared coordinator definitions');
    const pool = modules.values().next().value.getStudyPool();
    for (const api of modules.values())
        assert.equal(api.getStudyPool(), pool, 'all five modules share one pool');
    const entries = [];
    for (const study of manifest.studies)
        for (let replica = 0; replica < 3; replica++) {
            const root = new Root(entries.length), display = new Canvas();
            display.isConnected = true;
            display.root = root;
            const settings = {
                primary: '#efc8c8', secondary: '#d6b442', ink: '#424855', ...study.studyProps, mode: study.mode, static: false, canvasPreview: true, animate: true
            };
            const entry = pool.add({
                root, display, source: study.componentSource, target: 'canvas', settings, factory: modules.get(study.componentSource).createRenderer, notify: (status, error) => {
                    if (error)
                        renderErrors.push(error);
                }
            });
            entries.push(entry);
        }
    async function tick(count = 1) {
        for (let i = 0; i < count; i++) {
            time += 40;
            const ready = [...timers].filter(([, item]) => item.due <= time);
            for (const [id, item] of ready) {
                timers.delete(id);
                item.callback();
            }
            await Promise.resolve();
            sample();
        }
    }
    const record = (name, extra = {}) => checks.push({ name, pass: true, ...extra });
    assert.equal(created, 0, 'registration yields before graphics initialization');
    await tick(1);
    assert.ok(created <= 1, 'one task initializes at most one cold graphic');
    record('queue yields before and between initialization');
    await tick(160);
    assert.ok(peakContexts <= 2, 'cold and initialization contexts globally bounded');
    assert.equal(active.size, 0, 'overview keeps no live contexts');
    assert.equal(pool.debug().completedIds.length, 60, 'all sixty cards get generated graphics');
    assert.ok(peakPixels <= 24000, 'cold stills including context initialization stay within 24k pixels');
    for (const entry of entries) {
        assert.ok(entry.display.frame, 'generated snapshot exists ' + entry.id);
        assert.ok(shaderBySource.get(entry.source).has(entry.display.frame.shader), 'correct module factory ' + entry.source);
        assert.equal(entry.display.frame.phase, entry.settings.stillTime, 'deterministic cold snapshot phase');
    }
    record('mixed 60 cold snapshots complete with correct module factories', { contextsCreated: created, peakContexts, copies, peakPixels });
    const focused = entries.find(e => e.source === 'PointCodingStudy.tsx');
    focused.root.setRect(30, 100, 960, 600);
    focused.root.dispatchEvent({ type: 'pointerenter' });
    await tick(10);
    assert.equal(pool.debug().live.length, 1, 'one Canvas live lease');
    assert.ok(pool.debug().live[0].pixels <= 150000, 'editor live pixel cap');
    const phase = focused.phase;
    await tick(10);
    assert.ok(focused.phase > phase, 'focused phase animates');
    record('zoomed pointer focus animates with editor pixel cap');
    const completedBefore = pool.debug().completedStillJobs;
    for (const [index, entry] of entries.entries())
        pool.update(entry, { ...entry.settings, intensity: 1 + index * .001 });
    await tick(160);
    assert.equal(pool.debug().pendingStillIds.length, 0, 'parameter invalidation queue does not starve behind live motion');
    assert.ok(pool.debug().completedStillJobs >= completedBefore + 59, 'all other dirty cards regenerated while one animates');
    for (const [index, entry] of entries.entries())
        assert.equal(entry.display.frame.intensity, 1 + index * .001, 'each card reflects updated parameter ' + entry.id);
    assert.ok([...active].reduce((n, g) => n + g.canvas.width * g.canvas.height, 0) <= 150000, 'one retained Canvas live backing budget');
    assert.ok(peakPixels <= 174000, 'Canvas live plus cold still stays within 150k+24k total');
    record('parameter invalidation fair queue with one Canvas animation', { completedStillJobs: pool.debug().completedStillJobs, canvasPeakPixels: peakPixels });
    for (const [index, entry] of entries.entries()) {
        entry.root.setRect(20, 100, 960, 600);
        pool.update(entry, { ...entry.settings, intensity: 1.3 + index * .001 });
    }
    let previous = focused;
    for (let step = 0; step < 400; step++) {
        previous.root.dispatchEvent({ type: 'pointerleave' });
        const next = entries[step % entries.length];
        next.root.dispatchEvent({ type: 'pointerenter' });
        previous = next;
        await tick(1);
    }
    assert.equal(pool.debug().pendingStillIds.length, 0, 'continuous hover changes do not starve still jobs');
    for (const [index, entry] of entries.entries())
        assert.equal(entry.display.frame.intensity, 1.3 + index * .001, 'hover churn regenerates card ' + entry.id);
    assert.ok(peakContexts <= 2);
    assert.ok(peakPixels <= 174000);
    for (const [index, entry] of entries.entries())
        entry.root.setRect(index % 10 * 125, Math.floor(index / 10) * 90 + 30, 115, 72);
    previous.root.dispatchEvent({ type: 'pointerleave' });
    focused.root.setRect(30, 100, 960, 600);
    focused.root.dispatchEvent({ type: 'pointerenter' });
    window.dispatchEvent({ type: 'scroll' });
    await tick(3);
    record('continuous hover churn cannot starve snapshots', { canvasPeakPixels: peakPixels });
    pool.update(focused, { ...focused.settings, animate: false });
    await tick(2);
    const frozen = focused.phase;
    assert.equal(active.size, 0, 'pause releases GPU');
    await tick(10);
    assert.equal(focused.phase, frozen, 'paused phase frozen');
    pool.update(focused, { ...focused.settings, animate: true });
    await tick(3);
    assert.ok(focused.phase >= frozen, 'resume preserves phase');
    pool.update(focused, { ...focused.settings, static: true, canvasPreview: false });
    await tick(3);
    assert.equal(active.size, 0, 'turning Canvas motion off releases GPU');
    assert.equal(focused.phase, focused.settings.stillTime, 'Canvas motion off restores selected still time');
    assert.equal(focused.display.frame.phase, focused.settings.stillTime, 'Canvas displays the selected still time');
    pool.update(focused, { ...focused.settings, static: false, canvasPreview: true });
    await tick(3);
    record('pause releases and resume preserves phase');
    document.hidden = true;
    document.dispatchEvent({ type: 'visibilitychange' });
    await tick(2);
    assert.equal(active.size, 0, 'hidden releases all leases');
    const hiddenPhase = focused.phase;
    await tick(8);
    assert.equal(focused.phase, hiddenPhase, 'hidden phase frozen');
    document.hidden = false;
    document.dispatchEvent({ type: 'visibilitychange' });
    await tick(3);
    motion.matches = true;
    motion.dispatchEvent({ type: 'change' });
    await tick(2);
    assert.equal(active.size, 0, 'reduced motion releases');
    const reducedPhase = focused.phase;
    assert.equal(reducedPhase, focused.settings.stillTime, 'reduced motion restores selected still time');
    await tick(5);
    assert.equal(focused.phase, reducedPhase, 'reduced phase frozen');
    motion.matches = false;
    motion.dispatchEvent({ type: 'change' });
    await tick(3);
    focused.root.setRect(0, 3000, 960, 600);
    window.dispatchEvent({ type: 'scroll' });
    await tick(3);
    assert.equal(active.size, 0, 'offscreen releases');
    record('hidden reduced-motion and offscreen freeze and release');
    // Exercise two Preview leases, then a synchronous export admission while both
    // are alive. The export must drain/reserve through the same global coordinator.
    const preview = entries.slice(0, 2);
    for (const entry of preview) {
        entry.target = 'preview';
        entry.root.setRect(20, 100, 960, 600);
        pool.update(entry, { ...entry.settings, canvasPreview: false });
    }
    await tick(20);
    assert.ok(pool.debug().live.length <= 2, 'Preview max two');
    assert.ok(active.size <= 2, 'actual contexts max two');
    const api = modules.get('InterfaceCodingStudy.tsx'), exportHost = new Canvas(), exportSettings = {
        ...entries.find(e => e.source === 'InterfaceCodingStudy.tsx').settings, managed: true, static: true, renderWidth: 960, renderHeight: 600, pixelBudget: 650000
    };
    for (const target of ['export', 'thumbnail']) {
        pool.runStatic(() => {
            const gpu = new Canvas(), renderer = api.createRenderer(gpu, exportSettings, () => {
            }, 8);
            renderer.renderAt(8);
            exportHost.getContext('2d').drawImage(gpu, 0, 0);
            renderer.dispose();
        });
        assert.equal(exportHost.frame.phase, 8, target + ' is frozen');
        assert.ok(active.size <= 2, target + ' respects global context cap');
    }
    assert.ok(peakContexts <= 2, 'static admission never exceeds two contexts');
    record('Preview to export and thumbnail share global admission cap', { peakContexts });
    const beforeRemove = entries.length;
    for (const entry of entries)
        pool.remove(entry);
    await tick(2);
    assert.equal(active.size, 0, 'complete cleanup loses owned GPU slots');
    assert.equal(owned.size, 0, 'all owned shader program buffer texture handles deleted');
    assert.equal(pool.debug().entryCount, 0, 'all controllers removed');
    // StrictMode setup/cleanup/setup reuses a connected display and must neither
    // strand a registry entry nor reuse a deliberately lost WebGL display context.
    const root = new Root(0), display = new Canvas();
    display.isConnected = true;
    display.root = root;
    const spec = manifest.studies[0], input = {
        root, display, source: spec.componentSource, target: 'canvas', settings: { ...spec.studyProps, mode: spec.mode, static: false, canvasPreview: true }, factory: modules.get(spec.componentSource).createRenderer, notify: () => {
        }
    };
    const one = pool.add(input);
    pool.remove(one);
    const two = pool.add(input);
    await tick(8);
    assert.ok(display.frame, 'StrictMode remount still has snapshot');
    pool.remove(two);
    await tick(2);
    assert.equal(active.size, 0);
    assert.equal(owned.size, 0);
    assert.equal(pool.debug().entryCount, 0);
    record('StrictMode connected display cleanup and replay');
    for (const [file, api] of modules) {
        const study = manifest.studies.find(s => s.componentSource === file), root = new Root(0), display = new Canvas();
        display.isConnected = true;
        const refs = [], effects = [];
        let hookIndex = 0;
        context.React.useRef = initial => refs[hookIndex++] ??= ({ current: initial });
        context.React.useLayoutEffect = callback => effects.push(callback);
        const settings = {
            primary: '#efc8c8', secondary: '#d6b442', ink: '#424855', ...study.studyProps, mode: study.mode, static: true, canvasPreview: false
        };
        const before = created;
        api.useStudySurface({ current: root }, { current: display }, settings, 'export', file, () => {
        });
        const cleanups = effects.map(effect => effect());
        for (const cleanup of cleanups)
            cleanup?.();
        for (const effect of effects)
            effect();
        assert.equal(created - before, 1, 'static StrictMode replay renders once ' + file);
        assert.equal(display.frame.phase, settings.stillTime, 'export frozen phase ' + file);
        assert.equal(active.size, 0, 'export has no retained WebGL context ' + file);
    }
    record('all five one-shot export hooks render once through StrictMode replay');
    // A failed live draw/copy belongs to that entry. It must not stop the shared
    // timer, keep a GPU lease, or starve another card's pending still job.
    for (const failure of ['renderAt', 'copy']) {
        const badStudy = manifest.studies.find(s => s.componentSource === 'PointCodingStudy.tsx'), goodStudy = manifest.studies.find(s => s.componentSource === 'MaterialCodingStudy.tsx');
        const makeInput = (study, index, notify) => {
            const root = new Root(index), display = new Canvas();
            display.isConnected = true;
            display.root = root;
            return {
                root, display, source: study.componentSource, target: 'canvas', settings: {
                    primary: '#efc8c8', secondary: '#d6b442', ink: '#424855', ...study.studyProps, mode: study.mode, static: false, canvasPreview: true, animate: true
                }, factory: modules.get(study.componentSource).createRenderer, notify
            };
        };
        const failures = [];
        const bad = pool.add(makeInput(badStudy, 0, (status, error) => {
            if (error)
                failures.push(error);
        })), good = pool.add(makeInput(goodStudy, 1, () => {
        }));
        await tick(10);
        assert.ok(bad.display.frame, 'last good frame exists before injected ' + failure);
        const previousFrame = JSON.stringify(bad.display.frame), originalFactory = bad.factory, context2D = bad.display.getContext('2d'), originalCopy = context2D.drawImage;
        let fail = true;
        if (failure === 'renderAt')
            bad.factory = (...args) => {
                const renderer = originalFactory(...args);
                return { ...renderer, renderAt(phase) {
                        if (fail)
                            throw new Error('injected live renderAt failure');
                        renderer.renderAt(phase);
                    } };
            };
        else
            context2D.drawImage = (...args) => {
                if (fail)
                    throw new Error('injected live copy failure');
                originalCopy(...args);
            };
        bad.root.setRect(30, 100, 960, 600);
        bad.root.dispatchEvent({ type: 'pointerenter' });
        pool.update(good, { ...good.settings, intensity: 1.719 });
        await tick(8);
        assert.equal(active.size, 0, 'failed live ' + failure + ' releases GPU lease');
        assert.equal(bad.lease, undefined, 'failed entry has no lease ' + failure);
        assert.ok(failures.some(error => String(error).includes('injected live')), 'entry gets recovering error ' + failure);
        assert.ok(timers.size > 0, 'shared pump remains scheduled ' + failure);
        assert.equal(good.display.frame.intensity, 1.719, 'unrelated card warms after ' + failure + ' error');
        assert.equal(JSON.stringify(bad.display.frame), previousFrame, 'last owned frame survives ' + failure + ' failure');
        fail = false;
        await tick(135);
        assert.ok(bad.lease, 'failed entry can retry after backoff ' + failure);
        assert.ok(bad.phase > bad.settings.stillTime, 'recovered entry animates ' + failure);
        pool.remove(bad);
        pool.remove(good);
        await tick(2);
        assert.equal(active.size, 0, 'failure recovery cleanup releases GPU ' + failure);
        assert.equal(owned.size, 0, 'failure recovery deletes handles ' + failure);
    }
    record('live renderer and display-copy failures are isolated and retry without starving peers');
    assert.deepEqual(renderErrors, [], 'no renderer errors');
    const result = {
        passed: true, actualModules: files.length, instances: beforeRemove, checks, peakContexts, peakPixels, contextsCreated: created, draws, copies, errors: renderErrors, sourceHashes: Object.fromEntries(files.map(file => [file, hash(fs.readFileSync(repo + '/docs/design-studies/code-components/' + file))])), scope: 'Actual five module coordinator/renderers with deterministic DOM/WebGL/timer mocks. Does not execute GLSL or establish real-browser visual/framebuffer behavior; browser harness supplies that evidence.'
    };
    return result;
}
try {
    console.log(JSON.stringify(await run()));
}
catch (error) {
    console.log(JSON.stringify({ passed: false, error: error instanceof Error ? error.message : String(error) }));
    process.exitCode = 1;
}
