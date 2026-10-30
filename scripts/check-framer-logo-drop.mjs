// Focused contract checks for the native SVG logo motion studies.
// Run with: nix develop -c node scripts/check-framer-logo-drop.mjs
// Executes the actual component clock/hooks with deterministic host doubles.
// Real Framer React reconciliation and browser SVG rasterization are separate.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const repo = fileURLToPath(new URL('../', import.meta.url));
const ts = createRequire(import.meta.url)('typescript');
const sourcePath = path.join(repo, 'docs/design-studies/code-components/LogoDropStudy.tsx');
const source = fs.readFileSync(sourcePath, 'utf8');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const script = ts.transpileModule(source, {
    compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React
    }
}).outputText + '\nexports.__qa={getMotionClock,carrierPose,carrierPoses,LOGO_CIRCLE_PATH,LOGO_CARRIER_PATH};';
const checks = [];
let allocations = 0;
function hub() {
    const listeners = new Map();
    return {
        addEventListener(k, f) {
            if (!listeners.has(k))
                listeners.set(k, new Set());
            listeners.get(k).add(f);
        },
        removeEventListener(k, f) {
            listeners.get(k)?.delete(f);
        },
        emit(k) {
            for (const f of [...listeners.get(k) ?? []])
                f();
        },
        count() {
            return [...listeners.values()].reduce((n, s) => n + s.size, 0);
        }
    };
}
function environment({ target = 'preview', staticRenderer = false, reduced = false } = {}) {
    let now = 1000, serial = 0, active = null;
    const rafs = new Map(), media = {
        matches: reduced,
        ...hub()
    }, document = {
        hidden: false,
        ...hub(),
        createElement() {
            allocations++;
            throw Error('SVG source unexpectedly allocates DOM canvas/image outside React');
        }
    }, window = {
        matchMedia: () => media
    };
    const React = {
        Fragment: Symbol('fragment'),
        createElement: (type, props, ...children) => ({
            type,
            props: props ?? {},
            children: children.flat(Infinity)
        }),
        useId: () => {
            const h = active.next();
            return h.id ??= ':qa' + (++serial) + ':';
        },
        useRef(value) {
            const h = active.next();
            return h.ref ??= {
                current: value
            };
        },
        useState(value) {
            const h = active.next();
            if (!('value' in h))
                h.value = typeof value === 'function' ? value() : value;
            return [h.value, v => {
                    h.value = typeof v === 'function' ? v(h.value) : v;
                }];
        },
        useCallback(fn, deps) {
            const h = active.next();
            if (!h.deps || deps.some((v, i) => !Object.is(v, h.deps[i]))) {
                h.deps = deps;
                h.fn = fn;
            }
            return h.fn;
        },
        useLayoutEffect(fn, deps) {
            const h = active.next();
            if (!h.deps || deps.some((v, i) => !Object.is(v, h.deps[i]))) {
                h.deps = deps;
                active.pending.push(() => {
                    h.cleanup?.();
                    h.cleanup = fn();
                });
            }
        }
    };
    const observers = [];
    class IntersectionObserver {
        constructor(callback) {
            this.callback = callback;
            observers.push(this);
        }
        observe() {
            this.connected = true;
            this.callback([{
                    isIntersecting: true
                }]);
        }
        disconnect() {
            this.connected = false;
        }
        emit(value) {
            this.callback([{
                    isIntersecting: value
                }]);
        }
    }
    const controls = {};
    const module = {
        exports: {}
    };
    const context = vm.createContext({
        window,
        document,
        performance: {
            now: () => now
        },
        requestAnimationFrame: fn => {
            const id = ++serial;
            rafs.set(id, fn);
            return id;
        },
        cancelAnimationFrame: id => rafs.delete(id),
        IntersectionObserver,
        HTMLCanvasElement: class {
            constructor() {
                allocations++;
                throw Error('No canvas allowed');
            }
        },
        console,
        module,
        exports: module.exports,
        require: name => {
            if (name === 'react') return React;
            assert.equal(name, 'framer', 'SVG study remains self-contained');
            return {
            RenderTarget: {
                canvas: 'canvas',
                preview: 'preview',
                export: 'export',
                thumbnail: 'thumbnail',
                current: () => target
            },
            useIsStaticRenderer: () => staticRenderer,
            ControlType: new Proxy({}, {
                get: (_, k) => k
            }),
            addPropertyControls: (_, value) => Object.assign(controls, value)
            };
        }
    });
    vm.runInContext(script, context);
    function advance(ms) {
        const end = now + ms;
        while (now + 16.6666667 <= end + .0001) {
            now += 16.6666667;
            const jobs = [...rafs.values()];
            rafs.clear();
            for (const fn of jobs)
                fn(now);
        }
        now = end;
    }
    function root(top = 0) {
        const history = [], node = (props = {}) => ({
            attrs: Object.fromEntries(Object.entries(props).filter(([key]) => key.startsWith('data-') || key === 'transform' || key === 'opacity').map(([key, value]) => [key, String(value)])),
            setAttribute(k, v) {
                this.attrs[k] = v;
            },
            getAttribute(k) {
                return this.attrs[k] ?? null;
            }
        }), carriers = [], echoes = [];
        const dataset = new Proxy({}, {
            set(obj, k, v) {
                obj[k] = v;
                if (k === 'motionPhase')
                    history.push({
                        time: now,
                        phase: Number(v)
                    });
                return true;
            }
        });
        return {
            dataset,
            history,
            carriers,
            echoes,
            attach(vnode) {
                const visit = value => {
                    if (!value || typeof value !== 'object') return;
                    if (value.props?.['data-drop-carrier'] !== undefined) carriers.push(node(value.props));
                    if (value.props?.['data-drop-echo'] !== undefined) echoes.push(node(value.props));
                    for (const child of value.children ?? []) visit(child);
                };
                visit(vnode);
            },
            getBoundingClientRect: () => ({
                top,
                width: 960,
                height: 600
            }),
            querySelectorAll: selector => {
                assert(['[data-drop-carrier]', '[data-drop-echo]'].includes(selector));
                return selector === '[data-drop-carrier]' ? carriers : echoes;
            }
        };
    }
    function mount(props = {}) {
        const instance = {
            hooks: [],
            pending: [],
            index: 0,
            next() {
                return this.hooks[this.index++] ??= ({});
            },
            root: root(),
            props,
            vnode: null,
            render() {
                active = this;
                this.index = 0;
                this.pending = [];
                this.vnode = module.exports.default(this.props);
                if (!this.attached) {
                    this.root.attach(this.vnode);
                    this.attached = true;
                }
                this.hooks.find(h => h.ref)?.ref && (this.hooks.find(h => h.ref).ref.current = this.root);
                active = null;
                for (const fn of this.pending)
                    fn();
                return this;
            },
            unmount() {
                for (const h of this.hooks)
                    h.cleanup?.();
                this.hooks.forEach(h => h.cleanup = undefined);
            }
        };
        return instance.render();
    }
    return {
        qa: module.exports.__qa,
        module,
        window,
        document,
        media,
        observers,
        controls,
        root,
        mount,
        advance,
        rafs,
        get now() {
            return now;
        }
    };
}
function addCheck(name, details = {}) {
    checks.push({
        name,
        passed: true,
        ...details
    });
}
function carrierAxis(pathData) {
    const coordinates = pathData.match(/-?\d+(?:\.\d+)?/g)?.map(Number);
    assert.equal(coordinates?.length, 8, 'finite carrier has four vertices');
    const [ax, ay, bx, by, cx, cy, dx, dy] = coordinates;
    assert.equal(ay, by, 'top cap is horizontal');
    assert.equal(cy, dy, 'bottom cap is horizontal');
    const axis = { x: (cx + dx - ax - bx) / 2, y: (cy + dy - ay - by) / 2 };
    assert(axis.x < 0 && axis.y > 0, 'source carrier axis points down-left');
    return axis;
}
function assertOnAxis(vector, axis) {
    assert(Number.isFinite(vector.x) && Number.isFinite(vector.y), 'translation has finite x and y');
    const distance = Math.abs(vector.x * axis.y - vector.y * axis.x) / Math.hypot(axis.x, axis.y);
    assert(distance < 1e-8, 'translation is collinear with the carrier path');
}
function translation(value) {
    const match = value.match(/^translate\(\s*([^,\s]+)[,\s]+([^\s)]+)\s*\)$/);
    assert(match, 'carrier uses a two-coordinate translation');
    return { x: Number(match[1]), y: Number(match[2]) };
}
function assertDOMAxis(root, axis) {
    assert(root.carriers.length > 0 && root.carriers.length % 2 === 0);
    const copies = new Map();
    for (const node of root.carriers) {
        const copy = Number(node.getAttribute('data-drop-copy'));
        const layer = node.getAttribute('data-drop-layer');
        assert(Number.isInteger(copy) && copy >= 0);
        assert(['mask', 'ink'].includes(layer));
        if (!copies.has(copy)) copies.set(copy, {});
        assert(!copies.get(copy)[layer], 'each copy has one node per layer');
        copies.get(copy)[layer] = node;
        assertOnAxis(translation(node.attrs.transform), axis);
    }
    for (const { mask, ink } of copies.values()) {
        assert(mask && ink, 'each copy has both mask and ink');
        assert.equal(mask.attrs.transform, ink.attrs.transform, 'mask and ink share displacement');
        assert.equal(mask.attrs.opacity, ink.attrs.opacity, 'mask and ink share opacity');
    }
    const position = translation(copies.get(0).ink.attrs.transform);
    assert.equal(position.x, Number(root.dataset.carrierX));
    assert.equal(position.y, Number(root.dataset.carrierY));
    let previous = position;
    for (const echo of root.echoes) {
        const current = translation(echo.attrs.transform);
        const offset = { x: current.x - previous.x, y: current.y - previous.y };
        assertOnAxis(offset, axis);
        assert(offset.x * axis.x + offset.y * axis.y < 0, 'each echo trails up-right along the carrier axis');
        previous = current;
    }
    return position;
}
function runChecks() {
    const e = environment();
    const axis = carrierAxis(e.qa.LOGO_CARRIER_PATH);
    const modes = ['drop', 'spring', 'echo', 'ratchet', 'pendulum', 'conveyor'];
    for (const mode of ['drop', 'spring', 'echo']) {
        const p = e.qa.carrierPose(mode, .5);
        assert(p.x === 0);
        assert.equal(p.y, 0);
        assert.equal(p.echoOpacity, 0);
        for (const phase of [.1, .2, .26, .4, .5, .8, .95]) {
            for (const travel of [.1, 1, 1.5]) {
                const pose = e.qa.carrierPose(mode, phase, travel);
                assertOnAxis(pose, axis);
                const trailing = { x: pose.echoX - pose.x, y: pose.echoY - pose.y };
                assertOnAxis(trailing, axis);
                assert(trailing.x * axis.x + trailing.y * axis.y < 0);
            }
        }
    }
    assert(e.qa.carrierPose('drop', .2).y < 0 && e.qa.carrierPose('drop', .8).y > 0);
    assert(e.qa.carrierPose('spring', .26, 1, 1).y > e.qa.carrierPose('spring', .26, 1, 0).y);
    assert(e.qa.carrierPose('echo', .25).echoOpacity > 0);
    assert.equal(e.qa.carrierPose('echo', .25, 0).echoOpacity, 0);
    addCheck('path-derived down-left axis preserves assembled pose; carrier and trailing echoes stay collinear across modes and travel');
    {
        const positions = Array.from({ length: 401 }, (_, i) => e.qa.carrierPose('ratchet', i / 401));
        const plateaus = new Set();
        let advanced = false;
        for (let i = 1; i < positions.length; i++) {
            const delta = positions[i].y - positions[i - 1].y;
            assert(delta >= -1e-8, 'ratchet advances along the down-left axis without reversing');
            advanced ||= delta > 1;
            if (i >= 4 && positions.slice(i - 4, i + 1).every(p => Math.abs(p.y - positions[i].y) < 1e-8)
                && Math.abs(positions[i].y) < 1119) plateaus.add(positions[i].y);
            assertOnAxis(positions[i], axis);
        }
        assert(advanced && plateaus.size >= 3, 'ratchet includes multiple intermediate holds, not one eased fall');
        for (const phase of [.495, .5, .505]) assert.equal(e.qa.carrierPose('ratchet', phase).y, 0);
        assert(Math.abs(e.qa.carrierPose('ratchet', .3, 1.5).y) > Math.abs(e.qa.carrierPose('ratchet', .3, .1).y));
        assert(e.qa.carrierPose('ratchet', .3, 0).x === 0 && e.qa.carrierPose('ratchet', .3, 0).y === 0);
        addCheck('ratchet has multiple intermediate plateaus, monotone axis steps and an assembled hold');
    }
    {
        const positions = Array.from({ length: 401 }, (_, i) => e.qa.carrierPose('pendulum', i / 400));
        const deltas = positions.slice(1).map((p, i) => p.y - positions[i].y);
        assert(deltas.some(d => d > 1) && deltas.some(d => d < -1), 'pendulum reverses along its axis');
        assert(positions.some(p => p.y < -100) && positions.some(p => p.y > 100), 'reciprocal pass reaches both sides');
        positions.forEach(p => { assertOnAxis(p, axis); assert.equal(p.opacity, 1); });
        for (const phase of [.495, .5, .505, 0, .999999]) assert(e.qa.carrierPose('pendulum', phase).y === 0);
        assert(Math.abs(e.qa.carrierPose('pendulum', .25, 1.5).y) > Math.abs(e.qa.carrierPose('pendulum', .25, .1).y));
        assert(e.qa.carrierPose('pendulum', .25, 0).x === 0 && e.qa.carrierPose('pendulum', .25, 0).y === 0);
        addCheck('pendulum reverses through both sides with an assembled hold and an opaque continuous loop seam');
    }
    {
        const vertices = e.qa.LOGO_CARRIER_PATH.match(/-?\d+(?:\.\d+)?/g).map(Number);
        const barMinY = Math.min(...vertices.filter((_, i) => i % 2));
        const barMaxY = Math.max(...vertices.filter((_, i) => i % 2));
        const visible = (pose, scale, width, height) => {
            // The actual SVG uses xMidYMid meet with this viewBox and centered
            // logo transform. Test the finite path bounds against its viewport,
            // including Phone letterboxing, rather than only testing modulo math.
            const units = Math.min(width / 1440, height / 1024);
            const clipMinY = 512 - height / (2 * units), clipMaxY = 512 + height / (2 * units);
            const low = 512 + .92 * scale * (barMinY + pose.y - 512);
            const high = 512 + .92 * scale * (barMaxY + pose.y - 512);
            return high >= clipMinY && low <= clipMaxY;
        };
        let previousSpacing = 0;
        for (const travel of [.001, .1, 1, 1.5]) {
            const samples = [.1, .2, .3].map(phase => e.qa.carrierPoses('conveyor', phase, travel));
            samples.forEach(poses => {
                assert.equal(poses.length, 3, 'a nonzero conveyor uses three finite canonical bars');
                poses.forEach(p => { assertOnAxis(p, axis); assert.equal(p.opacity, 1); });
            });
            const sorted = samples[0].map(p => p.y).sort((a, b) => a - b);
            const spacing = sorted[1] - sorted[0];
            assert(Math.abs(spacing - (sorted[2] - sorted[1])) < 1e-8, 'train spacing is regular');
            assert(spacing > previousSpacing, 'Travel changes the train spacing');
            previousSpacing = spacing;
            for (let copy = 0; copy < 3; copy++) {
                const first = samples[1][copy].y - samples[0][copy].y;
                const second = samples[2][copy].y - samples[1][copy].y;
                assert(first > 0 && Math.abs(first - second) < 1e-8, 'every train bar advances at constant speed');
            }
            for (const scale of [.5, 1, 1.5]) for (const [width, height] of [[960, 600], [350, 280], [335, 280]]) {
                const start = e.qa.carrierPoses('conveyor', 0, travel).filter(p => visible(p, scale, width, height)).sort((a, b) => a.y - b.y);
                const end = e.qa.carrierPoses('conveyor', 1 - 1e-10, travel).filter(p => visible(p, scale, width, height)).sort((a, b) => a.y - b.y);
                assert.equal(start.length, end.length, 'wrap drops only offscreen end copies');
                start.forEach((p, i) => {
                    assert(Math.abs(p.x - end[i].x) < 1e-5 && Math.abs(p.y - end[i].y) < 1e-5, 'unordered visible train is continuous across wrap');
                });
            }
        }
        for (const phase of [0, .2, .5, .8, .999999]) {
            const poses = e.qa.carrierPoses('conveyor', phase, 0);
            assert.equal(poses.length, 1);
            assert(poses[0].x === 0 && poses[0].y === 0 && poses[0].opacity === 1);
        }
        addCheck('conveyor keeps an opaque constant-speed train, meaningful spacing, clipped periodic seam and Travel0 rest across desktop/phone scales');
    }
    for (const options of [{
            target: 'export'
        }, {
            target: 'thumbnail'
        }, {
            target: 'canvas'
        }, {
            target: 'preview',
            staticRenderer: true
        }]) {
        for (const study of modes) {
            const x = environment(options), m = x.mount({ study });
            assert.equal(x.rafs.size, 0);
            assert.equal(x.window[Symbol.for('monarchic.logo-vector-motion.v1')], undefined);
            assert.equal(m.root.dataset.carrierX, '0');
            assert.equal(m.root.dataset.carrierY, '0');
            const n = m.root.history.length;
            x.advance(1000);
            assert.equal(m.root.history.length, n);
            m.unmount();
        }
    }
    addCheck('all six modes freeze assembled pose on export/thumbnail/Canvas-off/static renderer without clock or RAF');
    {
        for (const study of ['ratchet', 'pendulum', 'conveyor']) {
            const x = environment(), m = x.mount({ study, stillPhase: 10 });
            const initial = assertDOMAxis(m.root, axis);
            assert.equal(m.root.carriers.length, study === 'conveyor' ? 6 : 2);
            assert.equal(m.root.echoes.length, 0);
            x.advance(1500);
            const after = assertDOMAxis(m.root, axis);
            assert.notEqual(after.x, initial.x);
            assert.notEqual(after.y, initial.y);
            m.unmount();
            assert.equal(x.rafs.size, 0);
        }
        addCheck('new-mode actual JSX marker counts and hook painting preserve per-copy mask/ink parity while advancing x/y');
    }
    {
        for (const update of [{ travel: 0 }, { study: 'ratchet' }]) {
            const x = environment(), m = x.mount({ study: 'conveyor' });
            x.advance(200);
            m.props = { ...m.props, ...update };
            // This host retains the six initially mounted markers. It models a
            // render-updated config reaching paint before React removes copies.
            m.render();
            assert.equal(m.root.carriers.length, 6);
            const phase = Number(m.root.dataset.motionPhase);
            x.advance(1000);
            assert.notEqual(Number(m.root.dataset.motionPhase), phase, 'stale copies cannot stall the shared clock');
            const actual = assertDOMAxis(m.root, axis);
            const expected = x.qa.carrierPose(m.props.study, Number(m.root.dataset.motionPhase), m.props.travel ?? 1);
            assert(actual.x === expected.x && actual.y === expected.y, 'primary uses the current mode and Travel pose');
            for (const node of m.root.carriers.filter(node => Number(node.getAttribute('data-drop-copy')) > 0)) {
                assert.equal(node.attrs.opacity, '0', 'unmatched stale copies are hidden');
            }
            m.unmount();
            assert.equal(x.rafs.size, 0);
            assert.equal(x.document.count(), 0);
            assert.equal(x.media.count(), 0);
            assert(x.observers.every(o => !o.connected));
        }
        addCheck('stale conveyor copies hide safely on Travel0 or single-mode transition while primary motion and cleanup continue');
    }
    for (const target of ['preview', 'canvas']) {
        const x = environment({
            target,
            staticRenderer: target === 'canvas'
        }), m = x.mount({
            study: 'echo',
            canvasMotion: target === 'canvas'
        });
        const before = m.root.history.length;
        x.advance(1000);
        const frames = m.root.history.length - before;
        assert(frames > 0 && frames <= (target === 'canvas' ? 13 : 31));
        assert(Number(m.root.dataset.motionPhase) > .5);
        const position = assertDOMAxis(m.root, axis);
        assert.equal(m.root.echoes.length, 2, 'hook test uses actual echo JSX markers');
        assert(position.x < 0 && position.y > 0, 'actual hook paint advances down-left');
        m.unmount();
        assert.equal(x.rafs.size, 0);
        assert.equal(x.media.count(), 0);
        assert.equal(x.document.count(), 0);
        assert(x.observers.every(o => !o.connected));
        addCheck(target + ' actual hook advances mask/ink and trailing echoes on source axis via DOM; cleans observers/listeners/RAF', {
            framesIn1000ms: frames
        });
    }
    for (const options of [{
            reduced: true
        }, {
            animate: false
        }, {
            speed: 0
        }]) {
        const x = environment({
            reduced: options.reduced ?? false
        }), m = x.mount(options);
        const before = m.root.history.length;
        x.advance(1000);
        assert.equal(m.root.history.length, before);
        assert.equal(x.rafs.size, 0);
        m.unmount();
    }
    addCheck('initial reduced motion, Animate-off and speed-zero schedule no ongoing time or paint');
    {
        const x = environment(), m = x.mount();
        x.advance(300);
        const phase = Number(m.root.dataset.motionPhase);
        x.media.matches = true;
        x.media.emit('change');
        x.advance(1000);
        assert.equal(Number(m.root.dataset.motionPhase), phase);
        assert.equal(x.rafs.size, 0);
        x.media.matches = false;
        x.media.emit('change');
        x.advance(300);
        assert(Number(m.root.dataset.motionPhase) > phase);
        m.unmount();
        addCheck('reduced-motion changes freeze and resume the existing phase without a listener leak');
    }
    function entry(x, target, top = 0) {
        return {
            root: x.root(top),
            target,
            enabled: true,
            speed: 1,
            phase: .2,
            visible: true,
            pinned: 0,
            last: 0,
            drawn: 0,
            renders: [],
            status: '',
            render(phase) {
                this.renders.push({
                    phase,
                    time: x.now
                });
            },
            notify(status) {
                this.status = status;
            }
        };
    }
    {
        const x = environment(), clock = x.qa.getMotionClock(), rows = [0, 100, 200].map(top => entry(x, 'preview', top));
        rows.forEach(v => clock.add(v));
        x.advance(200);
        assert.equal(rows.filter(r => r.renders.length).length, 2);
        assert.equal(rows[2].status, 'waiting');
        clock.request(rows[2]);
        x.advance(200);
        assert(rows[2].renders.length > 0);
        rows.forEach(v => clock.remove(v));
        assert.equal(x.rafs.size, 0);
        addCheck('three visible Preview entries respect two motion slots and explicit focus request');
    }
    {
        const x = environment(), clock = x.qa.getMotionClock(), a = entry(x, 'canvas'), b = entry(x, 'canvas', 100);
        clock.add(a);
        clock.add(b);
        x.advance(200);
        assert.equal([a, b].filter(r => r.renders.length).length, 1);
        const count = a.renders.length + b.renders.length;
        x.window[Symbol.for('monarchic.gpu-budget.v2')] = {
            debug: () => ({
                live: [{
                        target: 'canvas'
                    }]
            })
        };
        x.advance(200);
        assert.equal(a.renders.length + b.renders.length, count);
        clock.remove(a);
        clock.remove(b);
        addCheck('one Canvas SVG slot yields to an occupied existing GPU Canvas slot');
    }
    {
        const x = environment(), clock = x.qa.getMotionClock(), rows = [entry(x, 'preview'), entry(x, 'preview', 100)];
        x.window[Symbol.for('monarchic.gpu-budget.v2')] = {
            debug: () => ({
                live: [{
                        target: 'preview'
                    }, {
                        target: 'preview'
                    }]
            })
        };
        rows.forEach(r => clock.add(r));
        x.advance(200);
        assert(rows.every(r => !r.renders.length && r.status === 'waiting'));
        x.window[Symbol.for('monarchic.gpu-budget.v2')].debug = () => ({
            live: []
        });
        x.advance(200);
        assert(rows.every(r => r.renders.length));
        rows.forEach(r => clock.remove(r));
        addCheck('Preview SVG motion yields to two existing GPU slots and resumes after release');
    }
    {
        const x = environment(), clock = x.qa.getMotionClock(), a = entry(x, 'preview');
        clock.add(a);
        x.advance(200);
        x.document.hidden = true;
        x.document.emit('visibilitychange');
        x.advance(1000);
        const count = a.renders.length;
        assert.equal(x.rafs.size, 0);
        x.advance(1000);
        assert.equal(a.renders.length, count);
        x.document.hidden = false;
        x.document.emit('visibilitychange');
        x.advance(200);
        assert(a.renders.length > count);
        a.visible = false;
        clock.wake();
        x.advance(1000);
        assert.equal(x.rafs.size, 0);
        clock.remove(a);
        addCheck('hidden/offscreen entries stop ongoing RAF and visibility wake resumes them');
    }
    {
        const x = environment(), m = x.mount();
        x.advance(250);
        m.render();
        const button = v => !v || typeof v !== 'object' ? null : v.type === 'button' ? v : (v.children ?? []).map(button).find(Boolean);
        button(m.vnode).props.onClick();
        m.render();
        x.advance(1000);
        const stopped = m.root.dataset.motionPhase;
        x.advance(1000);
        assert.equal(m.root.dataset.motionPhase, stopped);
        m.render();
        button(m.vnode).props.onClick();
        m.render();
        x.advance(250);
        assert.notEqual(m.root.dataset.motionPhase, stopped);
        m.unmount();
        const replay = x.mount();
        x.advance(100);
        replay.unmount();
        assert.equal(x.rafs.size, 0);
        assert.equal(x.document.count(), 0);
        assert.equal(x.media.count(), 0);
        addCheck('actual component Pause/Play effects freeze/resume and StrictMode-style remount cleans ownership');
    }
    {
        const x = environment();
        for (const mode of ['drop', 'spring', 'echo']) {
            const a = x.qa.carrierPose(mode, 0, .1), b = x.qa.carrierPose(mode, .999999, .1);
            assert.equal(a.opacity, 0);
            assert(b.opacity < 1e-8);
            for (const phase of [0, .2, .5, .8, .999999]) {
                const pose = x.qa.carrierPose(mode, phase, 0);
                assert(pose.x === 0);
                assert(pose.y === 0);
                assert.equal(pose.opacity, 1);
                assert.equal(pose.echoOpacity, 0);
            }
            for (const stillPhase of [0, 99.99]) {
                const m = x.mount({
                    study: mode,
                    scale: .5,
                    travel: .1,
                    stillPhase
                });
                assert(m.root.carriers.every(node => Number(node.attrs.opacity) < .00002));
                m.unmount();
            }
            const frozen = x.mount({
                study: mode,
                scale: .5,
                travel: 0,
                stillPhase: 0
            });
            x.advance(1000);
            assert(frozen.root.carriers.every(node => node.attrs.transform === 'translate(0 0)' && node.attrs.opacity === '1'));
            frozen.unmount();
        }
        addCheck('small Scale.5/Travel.1 wrap fades BOTH mask and ink to the same unbroken circle; Travel0 stays assembled and opaque');
    }
    assert.equal(allocations, 0);
    addCheck('all cases allocate zero canvas, WebGL, image or GPU surfaces');
    return {
        passed: true,
        sourceSHA256: sha(source),
        checks,
        allocationCount: allocations,
        scope: 'Actual SVG component hooks and shared clock executed with deterministic React/DOM/RAF/matchMedia doubles. Exercises scheduling and ownership, not actual Framer React reconciliation or browser SVG raster; those are separately verified.',
    };
}
try {
    console.log(JSON.stringify(runChecks(), null, 2));
}
catch (error) {
    console.log(JSON.stringify({
        passed: false,
        sourceSHA256: sha(source),
        error: error instanceof Error ? error.message : String(error),
        checks
    }, null, 2));
    process.exitCode = 1;
}
