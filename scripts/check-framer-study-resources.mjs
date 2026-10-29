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

async function run(includeOriginals = false) {
    const repo = fileURLToPath(new URL("../", import.meta.url));
    const ts = createRequire(path.join(repo, 'package.json'))('typescript');
    const manifest = JSON.parse(fs.readFileSync(repo + '/docs/design-studies/code-components/manifest.json', 'utf8'));
    // Keep the complete legacy 60 suite, then rerun it in one seven-family window
    // with 24 original fixtures. These are resource-test replicas, not saved pages.
    const originalManifest = JSON.parse(fs.readFileSync(repo + '/docs/design-studies/code-components/originals-manifest.json', 'utf8'));
    const originalFixtures = originalManifest.studies;
    assert.equal(originalFixtures.length, 8, 'eight independently composed original modes');
    for (const study of originalFixtures) {
        assert.equal(study.classification, 'original-composition', 'original fixtures stay separate from source-led work');
        assert.equal(study.studyProps.canvasMotion, false, 'original presets keep editor motion opt-in');
    }
    const studies = includeOriginals ? [...manifest.studies, ...originalFixtures] : manifest.studies;
    const files = [...new Set(studies.map(s => s.componentSource))];
    const expectedPlacements = includeOriginals ? 84 : 60;
    let time = 1000, serial = 0, peakContexts = 0, peakPixels = 0, draws = 0, copies = 0, created = 0, initializationDrawFailures = 0;
    const timers = new Map(), active = new Set(), owned = new Set(), shaderBySource = new Map(), checks = [];
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
        let pointer = [0, 0], resolution = null, cssResolution = null;
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
            uniform2f(location, x, y) {
                if (location?.name === 'u_mouse')
                    pointer = [x, y];
                if (location?.name === 'u_resolution')
                    resolution = [x, y];
                if (location?.name === 'u_cssResolution')
                    cssResolution = [x, y];
            },
            drawArrays() {
                draws++;
                if (initializationDrawFailures > 0) {
                    initializationDrawFailures--;
                    throw new Error('injected initial draw failure');
                }
                canvas.frame = { phase, mode, intensity, pointer: [...pointer], resolution, cssResolution, effectiveW: canvas.width, effectiveH: canvas.height, shader: hash((program?.shaders ?? []).map(s => s.source).join('\n')) };
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
        _width = 300;
        _height = 150;
        get width() { return this._width; }
        set width(value) { this._width = value; this.frame = null; this.bitmapClears = (this.bitmapClears ?? 0) + 1; sample(); }
        get height() { return this._height; }
        set height(value) { this._height = value; this.frame = null; this.bitmapClears = (this.bitmapClears ?? 0) + 1; sample(); }
        clientWidth = 960;
        clientHeight = 600;
        isConnected = false;
        frame = null;
        getContext(kind) {
            if (kind === '2d')
                return this.twoD ??= new Proxy({ canvas: this, fillStyle: '#ffffff', createLinearGradient: () => ({ addColorStop() {} }), drawImage: (source) => {
                        copies++;
                        if (this.copyFailures > 0) {
                            this.copyFailures--;
                            throw new Error('injected display copy failure');
                        }
                        this.frame = source.frame ? { ...source.frame, effectiveW: Math.min(source.frame.effectiveW, this.width), effectiveH: Math.min(source.frame.effectiveH, this.height) } : null;
                    }, getImageData: () => ({ data: new Uint8ClampedArray([255, 255, 255, 255]), width: this.width, height: this.height, frame: this.frame ? structuredClone(this.frame) : null }),
                    putImageData: image => { this.frame = image.frame ? structuredClone(image.frame) : null; }
                }, { get: (o, k) => k in o ? o[k] : () => { }, set: (o, k, value) => {
                        if (k === 'fillStyle' && value === rgbFailureValue && rgbFailures > 0) {
                            rgbFailures--;
                            throw new Error('injected color normalization failure');
                        }
                        o[k] = value;
                        return true;
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
            if (this.measureFailures > 0) {
                this.measureFailures--;
                throw new Error('injected measurement failure');
            }
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
    let rgbFailureValue = '', rgbFailures = 0;
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
        if (file.startsWith('Original')) {
            assert.match(source, /canvasMotion:[^\n]*defaultValue:false/, 'original editor motion defaults off ' + file);
            assert.match(source, /ORIGINAL COMPOSITION/, 'original labels are explicit ' + file);
            assert.doesNotMatch(source, /CC-\d{3}|https:\/\/x\.com\//, 'originals have no external source attribution ' + file);
            const saved = originalManifest.components.find(component => component.source === file);
            assert.equal(hash(source), saved.sourceSHA256, 'original code matches its authoritative manifest ' + file);
        } else {
            const saved = manifest.components.find(component => component.source === file);
            assert.equal(hash(source), saved.sourceSHA256, 'legacy source stays byte-exact ' + file);
        }
        coordinators.push(source.slice(source.indexOf('const STUDY_POOL_KEY'), end));
        const result = ts.transpileModule(source.slice(0, end), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2022 } });
        const js = result.outputText.replace(/^import .* from "(?:react|framer)";?\r?\n/gm, '').replace(/^export \{\};?\r?\n/gm, '');
        const api = vm.runInContext('(function(){' + js + ';return {createRenderer,getStudyPool,useStudySurface,VERTEX,FRAGMENT' + (source.includes('const CANOPY_VERTEX') ? ',CANOPY_VERTEX,CANOPY_FRAGMENT' : '') + '};})()', context);
        modules.set(file, api);
        shaderBySource.set(file, new Set([hash(api.VERTEX + '\n' + api.FRAGMENT), ...(api.CANOPY_VERTEX ? [hash(api.CANOPY_VERTEX + '\n' + api.CANOPY_FRAGMENT)] : [])]));
    }
    assert.equal(files.length, includeOriginals ? 7 : 5, 'expected standalone study modules');
    assert.equal(manifest.studies.length, 20, 'twenty distinct legacy studies');
    assert.equal(studies.length, includeOriginals ? 28 : 20, 'all legacy and original modes represented');
    for (const coordinator of coordinators)
        assert.equal(coordinator, coordinators[0], 'standalone modules keep identical shared coordinator definitions');
    const pool = modules.values().next().value.getStudyPool();
    for (const api of modules.values())
        assert.equal(api.getStudyPool(), pool, 'all loaded modules share one pool');
    const entries = [], failures = [];
    const roles = {
        main: { width: 2180, height: 1362, x: 0, columns: 3, pitchX: 2400, pitchY: 1700 },
        reference: { width: 620, height: 360, x: 7500, columns: 5, pitchX: 700, pitchY: 500 },
        lab: { width: 1020, height: 638, x: 11400, columns: 1, pitchX: 1200, pitchY: 930 },
    };
    for (const [index, study] of studies.entries())
        for (const [role, shape] of Object.entries(roles)) {
            const root = new Root(entries.length), display = new Canvas();
            root.clientWidth = display.clientWidth = shape.width;
            root.clientHeight = display.clientHeight = shape.height;
            display.isConnected = true;
            display.root = root;
            const settings = { primary: '#efc8c8', secondary: '#d6b442', ink: '#424855', ...study.studyProps, mode: study.mode, static: false, canvasPreview: true, animate: false };
            const entry = pool.add({ root, display, source: study.componentSource, target: 'canvas', settings, factory: modules.get(study.componentSource).createRenderer, notify: (status, error) => { if (error)
                    failures.push({ id: study.id + '-' + role, error }); } });
            entry.fixture = { id: study.id + '-' + role, role, index, ...shape, worldX: shape.x + index % shape.columns * shape.pitchX, worldY: Math.floor(index / shape.columns) * shape.pitchY };
            entries.push(entry);
        }
    const record = (name, extra = {}) => checks.push({ name, pass: true, ...extra });
    async function tick(count = 1) {
        for (let i = 0; i < count; i++) {
            time += 40;
            const ready = [...timers].filter(([, task]) => task.due <= time);
            for (const [id, task] of ready) {
                timers.delete(id);
                task.callback();
            }
            await Promise.resolve();
            sample();
        }
    }
    function project(zoom, panX = 0, panY = 0) {
        for (const entry of entries) {
            const f = entry.fixture;
            entry.root.setRect(20 + (f.worldX - panX) * zoom, 30 + (f.worldY - panY) * zoom, f.width * zoom, f.height * zoom);
        }
        window.dispatchEvent({ type: 'resize' });
    }
    function isVisible(entry) {
        const r = entry.root.rect;
        return !document.hidden && r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < window.innerWidth && r.top < window.innerHeight;
    }
    function expected(entry, budget = 2000000) {
        const r = entry.root.rect, long = Math.max(r.width, r.height);
        const tier = Math.max(384, Math.ceil(long * Math.min(window.devicePixelRatio, 2) / 128) * 128);
        const ratio = tier / Math.max(1, long), w = r.width * ratio, h = r.height * ratio;
        const cap = Math.min(1, Math.sqrt(budget / Math.max(1, w * h)));
        return [Math.max(1, Math.floor(w * cap)), Math.max(1, Math.floor(h * cap))];
    }
    function sufficient(entry, budget = 2000000) {
        const [w, h] = expected(entry, budget), frame = entry.display.frame;
        return !!frame && frame.effectiveW >= w - 2 && frame.effectiveH >= h - 2;
    }
    function assertFrame(entry) {
        assert.ok(entry.display.frame, 'generated frame ' + entry.fixture.id);
        assert.ok(shaderBySource.get(entry.source).has(entry.display.frame.shader), 'correct module factory ' + entry.fixture.id);
        assert.ok(entry.display.frame.effectiveW <= entry.display.width && entry.display.frame.effectiveH <= entry.display.height, 'quality records source pixels, never destination upsampling');
        if (entry.fixture.id.startsWith('OL-')) {
            const modes = originalFixtures.filter(study => study.componentSource === entry.source).map(study => study.mode);
            assert.equal(entry.display.frame.mode, modes.indexOf(entry.settings.mode), 'original mode dispatch is exact ' + entry.fixture.id);
        }
        if (entry.settings.mode === 'dither')
            assert.deepEqual(entry.display.frame.cssResolution, [entry.root.clientWidth, entry.root.clientHeight], 'dither CSS geometry stays logical across zoom, DPR and replica roles');
    }
    async function settle(label, maxTicks = 360) {
        for (let i = 0; i < maxTicks; i++) {
            await tick();
            if (entries.filter(isVisible).every(e => sufficient(e))) {
                for (const entry of entries.filter(isVisible))
                    assertFrame(entry);
                return;
            }
        }
        const pending = entries.filter(e => isVisible(e) && !sufficient(e)).map(e => ({ id: e.fixture.id, screen: e.root.rect, expected: expected(e), frame: e.display.frame && [e.display.frame.effectiveW, e.display.frame.effectiveH], needsStill: e.needsStill }));
        assert.fail(label + ' visible quality did not converge: ' + JSON.stringify(pending));
    }
    const assertCaps = () => {
        const debug = pool.debug();
        assert.ok(active.size <= 2 && peakContexts <= 2, 'global context limit includes initialization');
        assert.ok((debug.cachePixels ?? Infinity) <= 8000000, 'retained cache stays within 8M pixels');
        assert.ok(debug.cacheSize <= 64, 'retained cache entry limit');
    };
    project(.05);
    assert.equal(created, 0, 'registration yields before graphics initialization');
    await tick();
    assert.ok(created <= 1, 'initializations yield between jobs');
    await tick(includeOriginals ? 276 : 180);
    assert.equal(entries.filter(e => e.hasFrame).length, expectedPlacements, 'all mounted nonzero placements bootstrap, including offscreen');
    assert.equal(entries.filter(e => !e.fixture.id.startsWith('OL-') && e.hasFrame).length, 60, 'all sixty legacy placements remain covered');
    if (includeOriginals) assert.equal(entries.filter(e => e.fixture.id.startsWith('OL-') && e.hasFrame).length, 24, 'all eight original modes have three mixed replicas');
    for (const entry of entries)
        assertFrame(entry);
    assert.equal(active.size, 0, 'paused overview retains no WebGL contexts');
    assertCaps();
    record(includeOriginals ? 'spatial 84-placement bootstrap uses seven actual renderer factories, including offscreen cards' : 'spatial 60-placement bootstrap uses five actual renderer factories, including offscreen cards');
    let zoomCases = 0;
    for (const dpr of [1, 1.5, 2]) {
        window.devicePixelRatio = dpr;
        for (const zoom of [.05, .13, .4, 1]) {
            for (const role of Object.keys(roles)) {
                project(zoom, roles[role].x, 0);
                await settle(role + ' zoom=' + zoom + ' DPR=' + dpr);
                assertCaps();
                zoomCases++;
            }
        }
    }
    record('every visible card upgrades without focus across 5/13/40/100% zoom and DPR 1/1.5/2', { cases: zoomCases });
    for (const entry of entries) {
        const f = entry.fixture;
        project(.4, f.worldX, f.worldY);
        await settle('pan into ' + f.id);
        assert.ok(sufficient(entry), 'panned card becomes sharp without hovering ' + f.id);
        assertCaps();
    }
    project(.05);
    await settle('return to overview');
    // The mixed board has six rows instead of four. Keep every peer visible for
    // this fairness stress case; the preceding pan/zoom cases retain 900px.
    if (includeOriginals) window.innerHeight = 1280;
    project(.4, roles.reference.x, 0);
    await settle('return to cached reference board');
    record(includeOriginals ? 'pan through all 84 mixed placements and back never reuses inadequate cache tiers' : 'pan through all sixty main/reference/lab placements and back never reuses inadequate cache tiers');
    const movingPeers = entries.filter(e => e.fixture.role === 'reference');
    assert.ok(movingPeers.every(isVisible), 'all hover fairness peers are actually visible');
    for (const [index, entry] of movingPeers.entries())
        pool.update(entry, { ...entry.settings, animate: true, intensity: entry.settings.intensity + .0001 * (index + 1) });
    let previousHover = null;
    for (let i = 0; i < 220; i++) {
        previousHover?.root.dispatchEvent({ type: 'pointerleave' });
        previousHover = movingPeers[i % movingPeers.length];
        previousHover.root.dispatchEvent({ type: 'pointerenter' });
        await tick();
    }
    for (const entry of movingPeers) {
        assert.ok(sufficient(entry, 1000000), 'continuous hover cannot starve visible quality ' + entry.fixture.id);
        assert.equal(entry.display.frame.intensity, entry.settings.intensity, 'visible parameter update eventually renders ' + entry.fixture.id);
        pool.update(entry, { ...entry.settings, animate: false });
    }
    previousHover.root.dispatchEvent({ type: 'pointerleave' });
    await settle('hover queue settles');
    assert.ok(peakPixels <= 3000000, 'editor live plus serial still initialization stays within 1M+2M GPU pixels');
    assertCaps();
    record(includeOriginals ? 'twenty-eight mixed cards upgrade fairly during continuous hover and parameter churn' : 'twenty visible cards upgrade fairly during continuous hover and parameter churn');
    if (includeOriginals) window.innerHeight = 900;
    const focused = entries.find(e => e.fixture.role === 'reference' && e.source === 'PointCodingStudy.tsx');
    project(1, focused.fixture.worldX, focused.fixture.worldY);
    await settle('focus setup');
    pool.update(focused, { ...focused.settings, animate: true });
    focused.root.dispatchEvent({ type: 'pointerenter' });
    focused.root.dispatchEvent({ type: 'pointermove', clientX: focused.root.rect.left + focused.root.rect.width * .8, clientY: focused.root.rect.top + focused.root.rect.height * .2 });
    await tick(12);
    assert.equal(pool.debug().live.length, 1, 'editor animates one selected study');
    assert.ok(sufficient(focused, 1000000), 'live backing meets independent 1M tier demand');
    const phase = focused.phase;
    await tick(6);
    assert.ok(focused.phase > phase, 'selected phase advances');
    const beforePause = structuredClone(focused.display.frame), beforeSize = [focused.display.width, focused.display.height];
    pool.update(focused, { ...focused.settings, animate: false });
    await tick(4);
    assert.equal(active.size, 0, 'pause releases all GPU leases');
    assert.ok(focused.display.frame, 'release retains pixels');
    assert.ok(focused.display.width >= beforeSize[0] && focused.display.height >= beforeSize[1], 'handoff never downscales the retained frame');
    assert.equal(focused.display.frame.phase, beforePause.phase, 'handoff retains displayed phase');
    assert.deepEqual(focused.display.frame.pointer, beforePause.pointer, 'handoff retains displayed pointer');
    await settle('paused high-quality phase upgrade');
    assert.equal(focused.display.frame.phase, beforePause.phase, 'quality upgrade uses the same paused phase');
    assert.deepEqual(focused.display.frame.pointer, beforePause.pointer, 'quality upgrade uses the same paused pointer');
    assert.ok(focused.display.frame.pointer.some(value => Math.abs(value) > .01), 'paused fixture retains a nonzero pointer before disabling Mouse');
    const pointerResetPhase = focused.display.frame.phase;
    pool.update(focused, { ...focused.settings, interactive: false });
    await tick(40);
    assert.equal(active.size, 0, 'disabling Mouse while paused does not retain a live context');
    assert.deepEqual(focused.display.frame.pointer, [0, 0], 'disabling Mouse redraws a paused card at zero pointer without live admission');
    assert.equal(focused.display.frame.phase, pointerResetPhase, 'disabling Mouse preserves the paused animation phase');
    assert.ok(sufficient(focused), 'paused zero-pointer redraw retains required raster quality');
    pool.update(focused, { ...focused.settings, interactive: true });
    const pausedPhase = focused.phase;
    await tick(8);
    assert.equal(focused.phase, pausedPhase, 'paused phase freezes');
    pool.update(focused, { ...focused.settings, animate: true });
    await tick(4);
    assert.ok(focused.phase >= pausedPhase, 'resume preserves phase');
    pool.update(focused, { ...focused.settings, animate: false });
    await tick(2);
    record('live admission, pause and quality handoff retain phase, pointer and sharp backing');
    const backup = structuredClone(focused.display.frame), backupSize = [focused.display.width, focused.display.height], previousClears = focused.display.bitmapClears;
    focused.display.copyFailures = 1;
    project(2, focused.fixture.worldX, focused.fixture.worldY);
    pool.update(focused, { ...focused.settings, intensity: focused.settings.intensity + .013 });
    for (let i = 0; i < 8 && focused.display.copyFailures > 0; i++) await tick();
    assert.equal(focused.display.copyFailures, 0, 'changed-size copy failure actually ran');
    assert.ok(focused.display.bitmapClears >= previousClears + 4, 'test exercises destructive resize followed by rollback resize');
    assert.ok(focused.display.frame, 'resize plus failed draw cannot clear the prior good bitmap');
    assert.deepEqual(focused.display.frame, backup, 'failed resized copy rolls back artwork, phase, pointer and effective source resolution');
    assert.deepEqual([focused.display.width, focused.display.height], backupSize, 'failed resized copy rolls back dimensions');
    await tick(140);
    await settle('copy-failure retry');
    record('changed-size copy failure restores old pixels/dimensions and retries without reporting upsampled quality');
    // These failures happen outside the live draw path. One bad measurement or
    // color normalization must not abort all later entries or stop the clock.
    const neighbor = entries.find(e => e.fixture.role === 'reference' && e.source === 'MaterialCodingStudy.tsx');
    project(.4, roles.reference.x, 0);
    await settle('measurement failure setup');
    focused.root.measureFailures = 1;
    rgbFailureValue = '#c0ffee';
    rgbFailures = 1;
    pool.update(neighbor, { ...neighbor.settings, primary: rgbFailureValue });
    for (const entry of entries.filter(isVisible))
        pool.update(entry, { ...entry.settings, intensity: entry.settings.intensity + .003 });
    window.dispatchEvent({ type: 'resize' });
    await tick(10);
    assert.ok(timers.size > 0, 'measure/color failures keep the coordinator clock alive');
    assert.ok(entries.some(e => isVisible(e) && e !== focused && e !== neighbor && sufficient(e)), 'unrelated cards continue rendering');
    await tick(145);
    await settle('measurement and color retry');
    assertCaps();
    record('measurement and color-normalization failures isolate one card, preserve queue progress, and retry');
    for (const failure of ['renderAt', 'copy']) {
        project(1, focused.fixture.worldX, focused.fixture.worldY);
        await settle('live failure setup');
        const originalFactory = focused.factory;
        let fail = true;
        if (failure === 'renderAt')
            focused.factory = (...args) => { const renderer = originalFactory(...args); return { ...renderer, renderAt(seconds) { if (fail)
                    throw new Error('injected live renderAt failure'); renderer.renderAt(seconds); } }; };
        else
            focused.display.copyFailures = 1;
        pool.update(focused, { ...focused.settings, animate: true });
        focused.root.dispatchEvent({ type: 'pointerenter' });
        await tick(8);
        assert.equal(focused.lease, undefined, failure + ' releases failing live lease');
        assert.ok(focused.display.frame, failure + ' retains prior image');
        assert.ok(timers.size > 0, failure + ' keeps shared queue alive');
        fail = false;
        await tick(140);
        assert.ok(focused.lease, failure + ' can recover after backoff');
        pool.update(focused, { ...focused.settings, animate: false });
        await tick(2);
        focused.factory = originalFactory;
    }
    record('live rendering and copy errors release contexts and recover independently');
    pool.update(focused, { ...focused.settings, animate: true });
    await tick(4);
    document.hidden = true;
    document.dispatchEvent({ type: 'visibilitychange' });
    await tick(3);
    assert.equal(active.size, 0, 'hidden page owns zero GL contexts');
    const hiddenPhase = focused.phase;
    await tick(8);
    assert.equal(focused.phase, hiddenPhase, 'hidden motion freezes');
    document.hidden = false;
    document.dispatchEvent({ type: 'visibilitychange' });
    await tick(3);
    motion.matches = true;
    motion.dispatchEvent({ type: 'change' });
    await tick(4);
    assert.equal(active.size, 0, 'reduced motion owns zero GL contexts');
    assert.equal(focused.phase, focused.settings.stillTime, 'reduced motion restores selected still time');
    motion.matches = false;
    motion.dispatchEvent({ type: 'change' });
    await tick(4);
    pool.update(focused, { ...focused.settings, animate: false });
    project(.4, roles.lab.x, roles.lab.pitchY * 19);
    await settle('offscreen retention and eviction');
    assert.ok((pool.debug().displayPixels ?? Infinity) <= 24000000 || entries.filter(isVisible).reduce((sum, e) => sum + e.display.width * e.display.height, 0) > 24000000, 'offscreen display LRU respects 24M retained pixels');
    record('hidden/reduced/offscreen release GPU slots and bound retained offscreen displays');
    const previews = entries.filter(e => e.fixture.role === 'reference').slice(0, 2);
    project(1, roles.reference.x, 0);
    for (const entry of previews) {
        entry.target = 'preview';
        pool.update(entry, { ...entry.settings, animate: true, canvasPreview: false });
    }
    await tick(30);
    assert.ok(active.size <= 2, 'Preview globally caps at two');
    const api = modules.get('InterfaceCodingStudy.tsx'), exportHost = new Canvas(), exportSettings = { ...entries.find(e => e.source === 'InterfaceCodingStudy.tsx').settings, managed: true, static: true, renderWidth: 1020, renderHeight: 638, managedBufferWidth: 1024, managedBufferHeight: 640, pixelBudget: 2000000 };
    for (const target of ['export', 'thumbnail']) {
        pool.runStatic(() => { const gpu = new Canvas(), renderer = api.createRenderer(gpu, exportSettings, () => { }, 8); try {
            renderer.renderAt(8);
            exportHost.width = gpu.width;
            exportHost.height = gpu.height;
            exportHost.getContext('2d').drawImage(gpu);
        }
        finally {
            renderer.dispose();
        } });
        assert.equal(exportHost.frame.phase, 8, target + ' freezes selected still time');
        assert.ok(active.size <= 2, target + ' shares admission cap');
    }
    record('Preview and one-shot export/thumbnail share the same global context cap');
    for (const entry of entries)
        pool.remove(entry);
    await tick(2);
    assert.equal(active.size, 0, 'all contexts released on unmount');
    assert.equal(owned.size, 0, 'all shader/program/buffer/texture handles deleted');
    assert.equal(pool.debug().entryCount, 0, 'registry emptied');
    for (const [file, api] of modules) {
        const study = studies.find(s => s.componentSource === file), gpu = new Canvas();
        gpu.width = 1; gpu.height = 1;
        initializationDrawFailures = 1;
        assert.throws(() => api.createRenderer(gpu, { primary: '#efc8c8', secondary: '#d6b442', ink: '#424855', ...study.studyProps, mode: study.mode, managed: true, static: true, renderWidth: 620, renderHeight: 360, managedBufferWidth: 640, managedBufferHeight: 371, pixelBudget: 2000000 }, () => {}), /injected initial draw failure/, 'constructor propagates first-draw failure ' + file);
        assert.equal(active.size, 0, 'constructor failure releases actual GL context ' + file);
        assert.equal(owned.size, 0, 'constructor failure deletes owned GL handles ' + file);
    }
    const failedRoot = new Root(0), failedDisplay = new Canvas(), failedStudy = studies[0];
    failedRoot.clientWidth = failedDisplay.clientWidth = 620;
    failedRoot.clientHeight = failedDisplay.clientHeight = 360;
    failedRoot.setRect(20, 30, 620, 360);
    const failingSnapshot = pool.add({ root: failedRoot, display: failedDisplay, source: failedStudy.componentSource, target: 'canvas', settings: { primary: '#efc8c8', secondary: '#d6b442', ink: '#424855', ...failedStudy.studyProps, mode: failedStudy.mode, animate: true, canvasPreview: true, static: false }, factory: (...args) => { const renderer = modules.get(failedStudy.componentSource).createRenderer(...args); return { ...renderer, getSnapshot() { throw new Error('injected snapshot failure before first displayed frame'); } }; }, notify: () => {} });
    await tick(4);
    assert.equal(active.size, 0, 'snapshot failure releases a lease even before its first displayed frame');
    assert.equal(owned.size, 0, 'snapshot failure still deletes owned resources');
    assert.equal(pool.debug().activeContexts, 0, 'snapshot failure balances the registry reservation');
    pool.remove(failingSnapshot); await tick(2);
    record('constructor first-draw and pre-display snapshot failures clean actual contexts and GPU handles');
    for (const [file, api] of modules) {
        const study = studies.find(s => s.componentSource === file), root = new Root(0), display = new Canvas();
        display.isConnected = true;
        const refs = [], effects = [];
        let hookIndex = 0;
        context.React.useRef = initial => refs[hookIndex++] ??= { current: initial };
        context.React.useLayoutEffect = callback => effects.push(callback);
        const settings = { primary: '#efc8c8', secondary: '#d6b442', ink: '#424855', ...study.studyProps, mode: study.mode, static: true, canvasPreview: false }, before = created;
        api.useStudySurface({ current: root }, { current: display }, settings, 'export', file, () => { });
        const cleanups = effects.map(effect => effect());
        for (const cleanup of cleanups)
            cleanup?.();
        for (const effect of effects)
            effect();
        assert.equal(created - before, 1, 'StrictMode export replay renders once ' + file);
        assert.equal(display.frame.phase, settings.stillTime, 'export stays frozen ' + file);
        assert.equal(active.size, 0, 'static export does not retain GL ' + file);
    }
    record(includeOriginals ? 'all seven static export hooks render once through StrictMode replay' : 'all five static export hooks render once through StrictMode replay');
    assertCaps();
    return { passed: true, actualModules: files.length, instances: entries.length, checks, peakContexts, peakPixels, contextsCreated: created, draws, copies, handledInjectedFailures: failures.length, sourceHashes: Object.fromEntries(files.map(file => [file, hash(fs.readFileSync(repo + '/docs/design-studies/code-components/' + file))])), originalStudies: includeOriginals ? 8 : 0, originalInstances: includeOriginals ? 24 : 0, legacyInstances: 60, scope: 'Actual standalone coordinator/renderers with deterministic DOM/WebGL/timer doubles and realistic spatial/quality assertions. Does not execute GLSL; the separate real-browser harness compares all visible output to fresh same-phase/pointer/size shader renders.' };
}
try {
    const legacyRegression = await run(false);
    const mixedRegression = await run(true);
    assert.equal(legacyRegression.actualModules, 5, 'legacy module regression remains unchanged');
    assert.equal(legacyRegression.instances, 60, 'legacy placement regression remains unchanged');
    assert.equal(legacyRegression.checks.length, 12, 'all twelve legacy resource assertion groups retained');
    console.log(JSON.stringify({ ...mixedRegression, legacyAssertionsRetained: true, legacyRegression }));
}
catch (error) {
    console.log(JSON.stringify({ passed: false, error: error instanceof Error ? error.message : String(error) }));
    process.exitCode = 1;
}
