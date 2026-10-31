// Run with: nix develop -c node scripts/check-homepage-navigation.mjs
// Executes the actual optional Framer override with deterministic DOM/hook
// doubles. Native overlay compatibility and browser layout require Preview QA.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("../", import.meta.url));
const ts = createRequire(import.meta.url)("typescript");
const sourcePath = path.join(repo, "docs/design-studies/code-components/HomepageNavigationInteractions.tsx");
const source = fs.readFileSync(sourcePath, "utf8");
const sourceSHA256 = crypto.createHash("sha256").update(source).digest("hex");
const checks = [];

// These host declarations describe only the external Framer/React contracts.
// DOM and application types are checked against TypeScript's actual libraries.
const declarations = new Map([
    [path.join(repo, "__navigation-react.d.ts"), `
export type ComponentType<P = {}> = ((props: P) => any) & { displayName?: string; name?: string };
export function createElement(type: any, props: any, ...children: any[]): any;
export function forwardRef<T, P>(render: (props: P, ref: ((node: T | null) => void) | { current: T | null } | null) => any): ComponentType<P>;
export function useRef<T>(value: T): { current: T };
export function useState<T>(value: T | (() => T)): [T, (value: T | ((previous: T) => T)) => void];
export function useCallback<T extends (...args: any[]) => any>(fn: T, dependencies: readonly unknown[]): T;
export function useEffect(fn: () => void | (() => void), dependencies: readonly unknown[]): void;
`],
    [path.join(repo, "__navigation-framer.d.ts"), `
export const RenderTarget: { canvas: string; current(): string };
export function useIsStaticRenderer(): boolean;
`],
]);
const options = {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    jsx: ts.JsxEmit.React,
    baseUrl: repo,
    paths: {
        react: ["__navigation-react.d.ts"],
        framer: ["__navigation-framer.d.ts"],
    },
};
const host = ts.createCompilerHost(options);
const readFile = host.readFile.bind(host);
const fileExists = host.fileExists.bind(host);
host.readFile = file => declarations.get(file) ?? readFile(file);
host.fileExists = file => declarations.has(file) || fileExists(file);
host.getSourceFile = (file, version) => {
    const text = host.readFile(file);
    return text === undefined ? undefined : ts.createSourceFile(file, text, version, true);
};
const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([sourcePath], options, host));
assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => repo,
    getCanonicalFileName: file => file,
    getNewLine: () => "\n",
}));
checks.push({ name: "semantic TypeScript with real DOM libraries", pass: true });
const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
}).outputText;

class EventHost {
    listeners = new Map();
    parent = null;
    addEventListener(type, callback, options) {
        const capture = typeof options === "boolean" ? options : !!options?.capture;
        const list = this.listeners.get(type) ?? [];
        if (!list.some(item => item.callback === callback && item.capture === capture)) list.push({ callback, capture });
        this.listeners.set(type, list);
    }
    removeEventListener(type, callback, options) {
        const capture = typeof options === "boolean" ? options : !!options?.capture;
        this.listeners.set(type, (this.listeners.get(type) ?? []).filter(item => item.callback !== callback || item.capture !== capture));
    }
    dispatchEvent(event) {
        if (!event.target) event.target = this;
        const chain = [];
        for (let node = this; node; node = node.parent) chain.push(node);
        const invoke = (node, capture) => {
            event.currentTarget = node;
            for (const item of [...node.listeners.get(event.type) ?? []]) if (item.capture === capture) item.callback(event);
        };
        for (const node of [...chain].reverse()) {
            invoke(node, true);
            if (event.stopped) return !event.defaultPrevented;
        }
        for (const node of chain) {
            invoke(node, false);
            if (event.stopped || !event.bubbles) break;
        }
        return !event.defaultPrevented;
    }
    listenerCount() { return [...this.listeners.values()].reduce((sum, list) => sum + list.length, 0); }
}
class HostEvent {
    constructor(type, options = {}) { this.type = type; Object.assign(this, options); }
    preventDefault() { if (this.cancelable) this.defaultPrevented = true; }
    stopPropagation() { this.stopped = true; }
}

function environment({ mobile = true, reduced = false, target = "preview", staticRenderer = false, y = 0, bannerHeight = 92, bannerPresent = true, hiddenBannerBeforeVisible = false } = {}) {
    const nodes = [], media = [], rafs = new Map(), views = [], focusCalls = [], scrollCalls = [], nativeEvents = [], mutationObservers = [], mutations = [];
    let serial = 0, activeHooks = null;
    const doc = new EventHost(), win = new EventHost();
    class Element extends EventHost {
        constructor(tag = "div", label = "", parent = null) {
            super(); this.tagName = tag.toUpperCase(); this.attributes = { "aria-label": label }; this.parent = parent; this.ownerDocument = doc; this.style = {}; this.children = []; parent?.children?.push(this); nodes.push(this);
        }
        get parentElement() { return this.parent instanceof Element ? this.parent : null; }
        get isConnected() { for (let node = this; node; node = node.parent) if (node === doc) return true; return false; }
        getAttribute(name) { return this.attributes[name] ?? null; }
        setAttribute(name, value) { this.attributes[name] = String(value); }
        removeAttribute(name) { delete this.attributes[name]; }
        querySelectorAll(selector) {
            const bannerSelector = selector === '[id="homepage-rd-banner"]';
            const buttonSelector = /^button\[aria-label(?:=["']([^"']+)["'])?\]$/.exec(selector);
            assert(bannerSelector || buttonSelector, "supported public selector: " + selector);
            return nodes.filter(node => node !== this && this.contains(node) && (bannerSelector
                ? node.attributes.id === "homepage-rd-banner"
                : node.tagName === "BUTTON" && !!node.attributes["aria-label"] && (!buttonSelector[1] || node.attributes["aria-label"] === buttonSelector[1])));
        }
        querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
        contains(target) { for (let node = target; node; node = node.parent) if (node === this) return true; return false; }
        closest() { for (let node = this; node instanceof Element; node = node.parent) if (node.tagName === "BUTTON" && node.attributes["aria-label"]) return node; return null; }
        focus(options) { doc.activeElement = this; focusCalls.push({ element: this, options }); this.dispatchEvent(new HostEvent("focusin", { bubbles: true })); }
    }
    class HostMutationObserver {
        constructor(callback) { this.callback = callback; this.target = null; this.options = null; mutationObservers.push(this); }
        observe(target, options) { this.target = target; this.options = { ...options }; }
        disconnect() { this.target = null; }
    }
    doc.documentElement = new Element("html", "", doc);
    doc.documentElement.style.scrollBehavior = "smooth";
    doc.body = new Element("body", "", doc.documentElement);
    doc.activeElement = doc.body;
    doc.defaultView = win;
    Object.assign(win, { Element, PointerEvent: HostEvent, MouseEvent: HostEvent, MutationObserver: HostMutationObserver, scrollX: 13, scrollY: y });
    const hiddenPage = hiddenBannerBeforeVisible ? new Element("div", "", doc.body) : null;
    const hiddenBanner = hiddenPage ? new Element("section", "", hiddenPage) : null;
    if (hiddenBanner) {
        hiddenBanner.attributes.id = "homepage-rd-banner";
        hiddenBanner.getBoundingClientRect = () => ({ bottom: 0, height: 0 });
    }
    const visiblePage = new Element("div", "", doc.body);
    const root = new Element("header", "", visiblePage), banner = new Element("section", "", bannerPresent ? visiblePage : null);
    banner.attributes.id = "homepage-rd-banner";
    root.getBoundingClientRect = () => ({ height: 72 });
    banner.getBoundingClientRect = () => ({ bottom: 72 + bannerHeight - win.scrollY, height: bannerHeight });
    const button = (label, parent = root) => new Element("button", label, parent);
    const triggers = Object.fromEntries(["Products menu", "Solutions menu", "Research menu", "Try Monarchic", "Apps", "Open full navigation", "Search Monarchic"].map(label => [label, button(label)]));
    const closes = Object.fromEntries(["Close full navigation", "Close search"].map(label => [label, button(label, doc.body)]));
    for (const close of Object.values(closes)) close.getBoundingClientRect = () => ({ height: 32 });
    const phone = Object.assign(new EventHost(), { matches: mobile }), motion = Object.assign(new EventHost(), { matches: reduced });
    media.push(phone, motion);
    win.matchMedia = query => query.includes("prefers-reduced-motion") ? motion : phone;
    win.requestAnimationFrame = callback => { const id = ++serial; rafs.set(id, callback); return id; };
    win.cancelAnimationFrame = id => rafs.delete(id);
    win.scrollTo = (x, nextY) => { scrollCalls.push({ x, y: nextY, behavior: doc.documentElement.style.scrollBehavior }); win.scrollX = x; win.scrollY = nextY; };
    doc.getElementById = id => nodes.find(node => node.isConnected && node.attributes.id === id) ?? null;
    // Observe the native bubble path after the override's capture listeners.
    // Exact event identity detects both consumption and synthetic additions.
    for (const type of ["pointerover", "pointerdown", "pointerup", "pointercancel", "mousedown", "mouseup", "click", "keydown"]) {
        doc.addEventListener(type, event => nativeEvents.push(event));
    }
    const baselineListeners = () => doc.listenerCount() + win.listenerCount() + nodes.reduce((sum, node) => sum + node.listenerCount(), 0) + media.reduce((sum, item) => sum + item.listenerCount(), 0);
    const initialListenerCount = baselineListeners();
    const nextHook = () => { const index = activeHooks.index++; return activeHooks.slots[index] ??= {}; };
    const React = {
        createElement: (type, props) => ({ type, props }),
        forwardRef: callback => (props, ref = null) => callback(props, ref),
        useRef(value) { const hook = nextHook(); return hook.ref ??= { current: value }; },
        useState(value) { const hook = nextHook(); if (!("value" in hook)) hook.value = typeof value === "function" ? value() : value; return [hook.value, value => { hook.value = typeof value === "function" ? value(hook.value) : value; }]; },
        useCallback(fn, dependencies) { const hook = nextHook(); if (!hook.dependencies || dependencies.some((value, i) => !Object.is(value, hook.dependencies[i]))) { hook.dependencies = dependencies; hook.fn = fn; } return hook.fn; },
        useEffect(callback, dependencies) { const hook = nextHook(); if (!hook.dependencies || dependencies.some((value, i) => !Object.is(value, hook.dependencies[i]))) { hook.dependencies = dependencies; activeHooks.effects.push(() => { hook.cleanup?.(); hook.cleanup = callback(); }); } },
    };
    const module = { exports: {} };
    vm.runInNewContext(compiled, {
        module, exports: module.exports,
        require(name) { if (name === "react") return React; assert.equal(name, "framer", "override remains self-contained"); return { RenderTarget: { canvas: "canvas", current: () => target }, useIsStaticRenderer: () => staticRenderer }; },
        console,
    }, { filename: sourcePath });
    const api = module.exports;
    const emit = (element, type, options = {}) => { const event = new HostEvent(type, { bubbles: true, cancelable: true, pointerType: "mouse", ...options }); element.dispatchEvent(event); return event; };
    const flushFrame = () => { const callbacks = [...rafs.values()]; rafs.clear(); for (const callback of callbacks) callback(0); };
    const flush = () => { let count = 0; while (rafs.size) { assert(++count <= 20, "bounded RAF work"); flushFrame(); } };
    const scroll = nextY => { win.scrollY = nextY; emit(win, "scroll"); flush(); };
    const removeElement = element => {
        const parent = element.parent;
        assert(parent, "remove a connected fixture element");
        parent.children = parent.children.filter(child => child !== element);
        element.parent = null;
        mutations.push({ type: "childList", target: parent, removedNodes: [element] });
    };
    const flushMutations = () => {
        const records = mutations.splice(0);
        for (const observer of mutationObservers) {
            if (!observer.target) continue;
            const matching = records.filter(record => observer.options.childList && (record.target === observer.target || observer.options.subtree && observer.target.contains(record.target)));
            if (matching.length) observer.callback(matching, observer);
        }
    };
    const observing = () => mutationObservers.filter(observer => observer.target).length;
    const create = () => api.createNavigationController({ root, banner: doc.getElementById("homepage-rd-banner"), win, doc, onChange: view => views.push({ ...view }) });
    const replaceTrigger = label => {
        const old = triggers[label];
        old.parent.children = old.parent.children.filter(child => child !== old);
        old.parent = null;
        const replacement = button(label);
        triggers[label] = replacement;
        return { old, replacement };
    };
    const mount = () => {
        const hooks = { slots: [], effects: [], index: 0 }, original = () => null;
        const Component = api.withHomepageNavigation(original), forwarded = { current: null };
        const props = { id: "native-header", style: { opacity: 0.8, pointerEvents: "auto" } };
        const render = () => { hooks.index = 0; activeHooks = hooks; const tree = Component(props, forwarded); activeHooks = null; tree.props.ref(root); for (const effect of hooks.effects.splice(0)) effect(); return tree; };
        return { render, tree: render(), forwarded, original, unmount() { for (const hook of hooks.slots) hook.cleanup?.(); } };
    };
    return { api, doc, win, root, visiblePage, banner, hiddenBanner, triggers, closes, views, focusCalls, scrollCalls, nativeEvents, emit, flush, flushFrame, scroll, create, replaceTrigger, mount, rafs, phone, motion, mutationObservers, observing, removeElement, flushMutations, listenerCount: baselineListeners, initialListenerCount, lastView: () => views.at(-1) };
}

function check(name, run) { run(); checks.push({ name, pass: true }); }
function assertNativePassThrough(env, events) {
    assert.deepEqual(env.nativeEvents, events, "native bubble listeners receive exactly the original events");
    for (const event of events) {
        assert.notEqual(event.defaultPrevented, true, event.type + " remains unconsumed");
        assert.notEqual(event.stopped, true, event.type + " continues to native listeners");
    }
}

check("mobile waits until measured92px banner is covered", () => {
    const env = environment(), controller = env.create();
    env.scroll(40); assert.equal(env.lastView().hidden, false);
    env.scroll(92); assert.equal(env.lastView().hidden, false);
    env.scroll(100); assert.equal(env.lastView().hidden, true);
    env.scroll(0); assert.equal(env.lastView().hidden, false);
    controller.dispose();
});
check("coverage follows geometry rather than a hard-coded banner size", () => {
    const env = environment({ bannerHeight: 150 }), controller = env.create();
    env.scroll(110); assert.equal(env.lastView().hidden, false);
    env.scroll(158); assert.equal(env.lastView().hidden, true);
    controller.dispose();
});
check("hidden Desktop banner duplicate does not suppress visible Phone gating", () => {
    const env = environment({ hiddenBannerBeforeVisible: true });
    assert.equal(env.doc.getElementById("homepage-rd-banner"), env.hiddenBanner);
    const controller = env.create();
    env.scroll(40); assert.equal(env.lastView().hidden, false);
    env.scroll(100); assert.equal(env.lastView().hidden, true);
    assert.notEqual(env.hiddenBanner.style.visibility, "hidden", "inactive responsive copy is not mutated");
    controller.dispose();
});
check("covered banner stays absent through navbar hiding and upward travel until top", () => {
    const env = environment();
    env.banner.style.visibility = "visible";
    const controller = env.create();
    env.scroll(40); assert.equal(env.banner.style.visibility, "visible");
    env.scroll(92); assert.equal(env.banner.style.visibility, "hidden");
    env.scroll(100); assert.equal(env.lastView().hidden, true); assert.equal(env.banner.style.visibility, "hidden");
    env.scroll(156); assert.equal(env.banner.style.visibility, "hidden");
    env.scroll(40); assert.equal(env.lastView().hidden, false); assert.equal(env.banner.style.visibility, "hidden");
    env.scroll(2); assert.equal(env.banner.style.visibility, "hidden");
    assert.equal(env.banner.getBoundingClientRect().height, 92, "hiding preserves banner layout");
    env.scroll(0); assert.equal(env.banner.style.visibility, "visible");
    env.scroll(100); controller.dispose(); assert.equal(env.banner.style.visibility, "visible", "cleanup restores existing style");
});
check("direction hysteresis ignores jitter, shows upward and re-hides downward", () => {
    const env = environment(), controller = env.create();
    env.scroll(200); assert.equal(env.lastView().hidden, true);
    env.scroll(197); assert.equal(env.lastView().hidden, true);
    env.scroll(192); assert.equal(env.lastView().hidden, false);
    env.scroll(195); assert.equal(env.lastView().hidden, false);
    env.scroll(200); assert.equal(env.lastView().hidden, true);
    env.scroll(-12); assert.equal(env.lastView().hidden, false);
    controller.dispose();
});
check("desktop and missing-banner cases remain visible", () => {
    for (const setup of [{ mobile: false }, { bannerPresent: false }]) {
        const env = environment(setup), controller = env.create();
        env.scroll(500); assert.equal(env.lastView().hidden, false);
        controller.dispose();
    }
});
check("keyboard focus keeps navigation visible while focused", () => {
    const env = environment(), controller = env.create();
    env.scroll(200); assert.equal(env.lastView().hidden, true);
    env.emit(env.doc.body, "keydown", { key: "Tab" });
    env.triggers["Products menu"].focus({ preventScroll: true }); env.flush();
    assert.equal(env.lastView().hidden, false);
    env.scroll(300); assert.equal(env.lastView().hidden, false);
    env.doc.body.focus({ preventScroll: true }); env.scroll(308);
    assert.equal(env.lastView().hidden, true);
    controller.dispose();
});
check("media changes refresh visible state and reduced-motion output", () => {
    const env = environment(), controller = env.create();
    env.scroll(200); assert.equal(env.lastView().hidden, true);
    env.phone.matches = false; env.emit(env.phone, "change");
    assert.equal(env.lastView().hidden, false);
    env.motion.matches = true; env.emit(env.motion, "change");
    assert.equal(env.lastView().reducedMotion, true);
    controller.dispose();
});
check("mouse hover and activation pass through without synthetic dismissal events", () => {
    const env = environment(), controller = env.create();
    const events = [];
    for (const label of ["Products menu", "Solutions menu"]) {
        for (const type of ["pointerover", "pointerdown", "pointerup", "click"]) events.push(env.emit(env.triggers[label], type));
    }
    env.flush();
    assertNativePassThrough(env, events);
    assert.equal(env.scrollCalls.length, 0);
    assert.equal(env.focusCalls.length, 0);
    controller.dispose();
});
check("dropdown keyboard activation and Escape reach native listeners unconsumed", () => {
    const env = environment(), controller = env.create();
    const events = [];
    for (const key of ["Enter", " ", "Escape"]) events.push(env.emit(env.triggers["Products menu"], "keydown", { key }));
    env.flush();
    assertNativePassThrough(env, events);
    assert.equal(env.scrollCalls.length, 0);
    assert.equal(env.focusCalls.length, 0);
    controller.dispose();
});
check("touch hover and explicit activation remain native without synthetic events", () => {
    const env = environment(), controller = env.create();
    const events = [];
    for (const label of ["Products menu", "Solutions menu"]) {
        for (const type of ["pointerover", "pointerdown", "pointerup", "click"]) events.push(env.emit(env.triggers[label], type, { pointerType: "touch" }));
    }
    env.flush();
    assertNativePassThrough(env, events);
    assert.equal(env.scrollCalls.length, 0);
    assert.equal(env.focusCalls.length, 0);
    controller.dispose();
});
check("canceled pointer activation releases pending modal state without restoring scroll", () => {
    for (const cancellation of ["pointercancel", "pointerup"]) {
        const env = environment({ y: 200 }), controller = env.create();
        env.emit(env.triggers["Open full navigation"], "pointerdown", { pointerType: "touch" });
        env.emit(env.doc.body, "keydown", { key: "Escape" }); env.flush();
        assert.equal(env.observing(), 1, "Escape watches only the pending native close");
        env.emit(env.doc.body, cancellation, { pointerType: "touch" });
        assert.equal(env.observing(), 0, "canceled activation disconnects its close observer");
        env.scroll(208);
        assert.equal(env.lastView().hidden, true, cancellation + " must not leave scroll sampling frozen");
        assert.equal(env.scrollCalls.length, 0, "unopened modal must not restore stale context");
        assert.equal(env.focusCalls.length, 0, "canceled touch must not steal focus");
        controller.dispose();
    }
    const env = environment({ y: 2342 }), controller = env.create();
    const trigger = env.triggers["Open full navigation"];
    env.emit(trigger, "pointerdown"); env.emit(trigger, "pointerup"); env.emit(trigger, "click");
    env.win.scrollY = 1991;
    env.emit(env.doc.body, "pointercancel");
    env.emit(env.closes["Close full navigation"], "click"); env.flush();
    assert.equal(env.win.scrollY, 2342, "unrelated cancel after activation must preserve the real modal context");
    controller.dispose();
});
check("modal X restores exact scroll context and opener after native close", () => {
    const env = environment({ y: 2342 }), controller = env.create();
    env.emit(env.triggers["Open full navigation"], "pointerdown");
    env.win.scrollX = 0; env.win.scrollY = 1991;
    env.emit(env.closes["Close full navigation"], "pointerdown");
    env.emit(env.closes["Close full navigation"], "click"); env.flush();
    assert.equal(env.win.scrollX, 13); assert.equal(env.win.scrollY, 2342);
    assert.equal(env.scrollCalls.at(-1).behavior, "auto");
    assert.equal(env.doc.documentElement.style.scrollBehavior, "smooth");
    assert.equal(env.doc.activeElement, env.triggers["Open full navigation"]);
    assert.equal(env.focusCalls.at(-1).options.preventScroll, true);
    env.scroll(2350); assert.equal(env.lastView().hidden, true);
    controller.dispose();
});
for (const stage of ["before-pointerup", "after-pointerup-before-click"]) {
    check("native opener replacement " + stage + " retains the first activation context", () => {
        const env = environment({ y: 2302 }), controller = env.create();
        const label = "Open full navigation", old = env.triggers[label];
        env.emit(old, "pointerdown");
        if (stage === "after-pointerup-before-click") env.emit(old, "pointerup");
        const { replacement } = env.replaceTrigger(label);
        assert.equal(old.isConnected, false);
        env.win.scrollX = 0; env.win.scrollY = 2067;
        if (stage === "before-pointerup") env.emit(env.doc, "pointerup", { target: old });
        env.emit(replacement, "click");
        env.emit(env.closes["Close full navigation"], "pointerdown");
        env.emit(env.closes["Close full navigation"], "pointerup"); env.flush();
        assert.equal(env.win.scrollX, 13);
        assert.equal(env.win.scrollY, 2302, "replacement must not resnapshot the shifted native viewport");
        assert.equal(env.scrollCalls.length, 1, "one bounded restore for one activation");
        assert.equal(env.doc.activeElement, replacement);
        assert.equal(env.focusCalls.at(-1).options.preventScroll, true);
        controller.dispose();
    });
}
check("detached keyboard opener restores focus to a connected owned replacement", () => {
    const env = environment({ y: 2302 }), controller = env.create();
    const label = "Search Monarchic", old = env.triggers[label];
    env.emit(old, "keydown", { key: "Enter" }); env.emit(old, "click");
    const outside = new old.constructor("button", label, env.doc.body);
    const { replacement } = env.replaceTrigger(label);
    env.win.scrollY = 2067;
    env.emit(env.closes["Close search"], "click"); env.flush();
    assert.equal(env.win.scrollY, 2302);
    assert.equal(env.doc.activeElement, replacement, "focus resolution remains scoped to the owned header");
    assert.notEqual(env.doc.activeElement, outside);
    assert(env.focusCalls.every(call => call.element.isConnected), "do not focus a detached old button");
    assert.equal(env.focusCalls.at(-1).options.preventScroll, true);
    controller.dispose();
});
check("keyboard Enter/Space and programmatic close-click restore modal context", () => {
    for (const key of ["Enter", " ", null]) {
        const env = environment({ y: 2342 }), controller = env.create();
        env.emit(env.triggers["Search Monarchic"], "keydown", { key: "Enter" });
        env.win.scrollY = 1991;
        if (key) env.emit(env.closes["Close search"], "keydown", { key });
        env.emit(env.closes["Close search"], "click"); env.flush();
        assert.equal(env.win.scrollY, 2342, "close without pointerdown must restore");
        assert.equal(env.doc.activeElement, env.triggers["Search Monarchic"]);
        env.doc.body.focus({ preventScroll: true });
        env.scroll(2350); assert.equal(env.lastView().hidden, true, "modal state must be cleared");
        controller.dispose();
    }
});
check("semantic click-only modal activation captures and restores context", () => {
    const env = environment({ y: 2342 }), controller = env.create();
    env.emit(env.triggers["Open full navigation"], "click");
    env.win.scrollY = 1991;
    env.emit(env.closes["Close full navigation"], "click"); env.flush();
    assert.equal(env.win.scrollY, 2342);
    assert.equal(env.doc.activeElement, env.triggers["Open full navigation"]);
    controller.dispose();
});
check("modal Escape passes through without asserting native dismissal", () => {
    const env = environment({ y: 1200 }), controller = env.create();
    const opener = env.triggers["Open full navigation"];
    assert.equal(env.mutationObservers.length, 0, "ordinary mounting does not allocate an observer");
    const events = [env.emit(opener, "pointerdown"), env.emit(opener, "pointerup"), env.emit(opener, "click")];
    env.win.scrollY = 900;
    events.push(env.emit(env.doc.body, "keydown", { key: "Escape" })); env.flush();
    assertNativePassThrough(env, events);
    assert.equal(env.win.scrollY, 900, "a visible native X keeps the saved context pending");
    assert.equal(env.scrollCalls.length, 0, "Escape alone does not imply a native close");
    assert.equal(env.focusCalls.length, 0);
    assert.equal(env.observing(), 1);
    // This double does not implement Framer's native Escape behavior. Explicit
    // X remains the tested close path for restoring the saved page context.
    env.emit(env.closes["Close full navigation"], "click"); env.flush();
    assert.equal(env.win.scrollY, 1200);
    assert.equal(env.doc.activeElement, opener);
    assert.equal(env.observing(), 0, "explicit X disconnects native-close observation");
    controller.dispose();
});
check("late native Escape close releases context after the initial two frames", () => {
    const env = environment({ y: 2302 }), controller = env.create();
    const opener = env.triggers["Open full navigation"];
    env.emit(opener, "pointerdown"); env.emit(opener, "pointerup"); env.emit(opener, "click");
    env.win.scrollX = 0; env.win.scrollY = 2067;
    const escape = env.emit(env.doc.body, "keydown", { key: "Escape" }); env.flush();
    assert.notEqual(escape.defaultPrevented, true); assert.notEqual(escape.stopped, true);
    assert.equal(env.scrollCalls.length, 0, "the native exit transition is still visible after two frames");
    assert.equal(env.focusCalls.length, 0);
    assert.equal(env.observing(), 1);
    const observer = env.mutationObservers[0];
    assert.equal(observer.target, env.doc.body);
    assert.deepEqual(observer.options, { childList: true, subtree: true }, "only native child removal is observed");
    env.emit(env.doc.body, "keydown", { key: "Escape" }); env.flush();
    assert.equal(env.mutationObservers.length, 1, "repeated Escape reuses the same scoped observer");
    env.removeElement(env.closes["Close search"]); env.flushMutations(); env.flush();
    assert.equal(env.scrollCalls.length, 0, "unrelated native close does not release this modal");
    env.removeElement(env.closes["Close full navigation"]); env.flushMutations(); env.flush();
    assert.equal(env.win.scrollX, 13); assert.equal(env.win.scrollY, 2302);
    assert.equal(env.scrollCalls.length, 1, "one restore follows the observed native close");
    assert.equal(env.doc.activeElement, opener);
    assert.equal(env.observing(), 0);
    env.doc.body.focus({ preventScroll: true }); env.scroll(2310);
    assert.equal(env.lastView().hidden, true, "modal state no longer blocks direction sampling");
    controller.dispose();
});
check("unmount cancels samples/restoration and removes all owned listeners", () => {
    const env = environment({ y: 2342 }), controller = env.create();
    env.emit(env.triggers["Open full navigation"], "pointerdown");
    env.win.scrollY = 1991; env.emit(env.closes["Close full navigation"], "click");
    env.emit(env.win, "scroll"); assert(env.rafs.size > 0);
    controller.dispose(); assert.equal(env.rafs.size, 0);
    const calls = env.views.length; env.flush(); env.emit(env.win, "scroll");
    assert.equal(env.scrollCalls.length, 0); assert.equal(env.views.length, calls);
    assert.equal(env.listenerCount(), env.initialListenerCount);
    const waiting = environment({ y: 2342 }), pending = waiting.create();
    const opener = waiting.triggers["Open full navigation"];
    waiting.emit(opener, "pointerdown"); waiting.emit(opener, "pointerup"); waiting.emit(opener, "click");
    waiting.emit(waiting.doc.body, "keydown", { key: "Escape" }); waiting.flush();
    assert.equal(waiting.observing(), 1);
    pending.dispose(); assert.equal(waiting.observing(), 0);
    waiting.removeElement(waiting.closes["Close full navigation"]); waiting.flushMutations(); waiting.flush();
    assert.equal(waiting.scrollCalls.length, 0, "a late native removal after unmount cannot restore scroll");
    assert.equal(waiting.listenerCount(), waiting.initialListenerCount); assert.equal(waiting.rafs.size, 0);
});
check("repeated mount/dispose does not accumulate listeners or work", () => {
    const env = environment();
    for (let i = 0; i < 3; i++) { const controller = env.create(); env.scroll(200); controller.dispose(); assert.equal(env.listenerCount(), env.initialListenerCount); assert.equal(env.rafs.size, 0); }
});
check("wrapper preserves native element/props/ref and honors reduced motion", () => {
    const env = environment({ reduced: true }), mounted = env.mount();
    assert.equal(mounted.tree.type, mounted.original);
    assert.equal(mounted.tree.props.id, "native-header"); assert.equal(mounted.tree.props.style.opacity, 0.8);
    assert.equal(mounted.forwarded.current, env.root);
    env.scroll(200); const tree = mounted.render();
    assert.equal(tree.props.style.translate, "0 -100%"); assert.equal(tree.props.style.transition, "none"); assert.equal(tree.props.style.pointerEvents, "none");
    mounted.unmount(); assert.equal(env.listenerCount(), env.initialListenerCount);
});
check("Canvas, static export and thumbnail rendering remain inert", () => {
    for (const setup of [{ target: "canvas" }, { target: "export", staticRenderer: true }, { target: "thumbnail", staticRenderer: true }, { target: "preview", staticRenderer: true }]) {
        const env = environment(setup), mounted = env.mount();
        assert.equal(env.listenerCount(), env.initialListenerCount); assert.equal(env.rafs.size, 0);
        env.scroll(200); assert.equal(mounted.render().props.style.translate, "0 0");
        assert.equal(env.scrollCalls.length, 0); mounted.unmount();
    }
});

console.log(JSON.stringify({
    passed: true,
    source: path.relative(repo, sourcePath),
    sourceSHA256,
    semanticTypeScript: { files: 1, diagnostics: 0, realDOMLibraries: true, externalHostDeclarations: ["react", "framer"] },
    checks,
    scope: "Actual override/controller source with deterministic DOM, event and React-hook doubles. Tests verify scroll state, native event pass-through, context restoration after explicit X or observed native close, scoped observer cleanup and lifecycle. They do not establish native popup exclusivity or Escape dismissal, Framer overlay integration, browser layout, focus trapping or actual reduced-motion animation; those require separate actual Preview QA. No graphics surfaces or unrelated shader suites are exercised.",
}, null, 2));
