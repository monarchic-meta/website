import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"

// Source inspiration / HERO-012 / Mezmo / https://www.mezmo.com/
// Independent controller for editable native header/menu layers. The original
// 93 observed source states are retained in header-navigation-audit-v1. No
// original behavior script, terminal, media, request or form action is used.
type Input = { defaultPrevented?: boolean; nativeEvent?: { defaultPrevented?: boolean }; key?: string; relatedTarget?: EventTarget | null; preventDefault?: () => void }
type LayerProps = {
    [key: string]: unknown
    style?: React.CSSProperties
    onClick?: (event: Input) => void
    onTap?: (event: Input, info?: unknown) => void
    onKeyDown?: (event: Input) => void
    onPointerEnter?: (event: Input) => void
    onPointerLeave?: (event: Input) => void
}
type NativeLayer = ComponentType<LayerProps>
type Phase = "closed" | "opening" | "open" | "closing"
type Navigation = {
    frozen: boolean; admitted: boolean; reduced: boolean; phone: boolean; width: number
    phase: Phase; selected: number; header: HTMLElement | null; menu: HTMLElement | null
    focusRequest: number; focusGroup: number
    register: (kind: "trigger" | "phone-trigger" | "group" | "toggle" | "menu", index: number, node: HTMLElement | null) => void
    choose: (index: number, focus?: boolean, toggle?: boolean) => void
    leave: (index: number, event: Input) => void
    mainToggle: () => void
    finishMain: () => void
    anchor: (index: number) => { left: number; top: number }
}
const Context = React.createContext<Navigation | null>(null)
const useLayout = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect
const NO_ANCHOR = { left: 0, top: 0 }
const TYPE_STYLE = `[data-mezmo-nav-link] p,[data-mezmo-nav-link] span{font-size:12px!important;line-height:18px!important;white-space:nowrap!important}
[data-mezmo-nav-link]:hover p,[data-mezmo-nav-link]:hover span{text-decoration:underline!important}
[data-mezmo-nav-phone-trigger] p,[data-mezmo-nav-phone-trigger] span{font-size:12px!important;line-height:12.6px!important;white-space:nowrap!important}
[data-mezmo-nav-phone-trigger][data-mezmo-nav-trigger="0"] p,[data-mezmo-nav-phone-trigger][data-mezmo-nav-trigger="0"] span{font-size:13.008px!important}
[data-mezmo-nav-part="heading"] p,[data-mezmo-nav-part="heading"] span{font-size:12px!important;line-height:12.6px!important}
[data-mezmo-nav-part="signin"] p,[data-mezmo-nav-part="signin"] span{font-size:12px!important;line-height:12.6px!important}
@media(min-width:1280px){[data-mezmo-nav-link] p,[data-mezmo-nav-link] span{font-size:14px!important;line-height:21px!important}[data-mezmo-nav-part="heading"] p,[data-mezmo-nav-part="heading"] span{line-height:14.7px!important}}`
function writeRef<T>(ref: React.ForwardedRef<T>, value: T | null) { if (typeof ref === "function") ref(value); else if (ref) ref.current = value }
function frozenTarget() { const target = RenderTarget.current(); return useIsStaticRenderer() || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail }
function canceled(event: Input) { return event.defaultPrevented || event.nativeEvent?.defaultPrevented }
function painted(node: HTMLElement) { for (let p: HTMLElement | null = node; p; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === "none" || s.visibility !== "visible" || Number(s.opacity) === 0) return false }; return true }
function enabledLinks(node: HTMLElement) { return Array.from(node.querySelectorAll<HTMLElement>("a[href],button,[tabindex='0']")).filter(n => n.getBoundingClientRect().width > 0 && painted(n)) }

/** Existing navigation Frame. Caller styles, children and refs stay intact. */
export function withMezmoHeaderNavigation(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const frozen = frozenTarget(), [host, setHost] = React.useState<HTMLElement | null>(null)
        const [view, setView] = React.useState({ width: 1440, reduced: false, admitted: false })
        const [phase, setPhase] = React.useState<Phase>("closed"), [selected, setSelected] = React.useState(-1)
        const [focus, setFocus] = React.useState({ group: -1, request: 0 }), [, refresh] = React.useState(0)
        const triggers = React.useRef(new Map<number, HTMLElement>()), phoneTriggers = React.useRef(new Map<number, HTMLElement>()), groups = React.useRef(new Map<number, HTMLElement>())
        const toggle = React.useRef<HTMLElement | null>(null), menu = React.useRef<HTMLElement | null>(null), returnFocus = React.useRef(false)
        const state = React.useRef({ phase, selected, phone: view.width <= 991, admitted: view.admitted })
        state.current = { phase, selected, phone: view.width <= 991, admitted: view.admitted }
        const bind = React.useCallback((node: HTMLElement | null) => { setHost(old => old === node ? old : node); writeRef(ref, node) }, [ref])
        const register = React.useCallback((kind: "trigger" | "phone-trigger" | "group" | "toggle" | "menu", index: number, node: HTMLElement | null) => {
            if (kind === "menu") menu.current = node
            else if (kind === "toggle") toggle.current = node
            else { const map = kind === "trigger" ? triggers.current : kind === "phone-trigger" ? phoneTriggers.current : groups.current; if (node) map.set(index, node); else map.delete(index) }
        }, [])
        const closeMain = React.useCallback((focusToggle: boolean) => {
            returnFocus.current = focusToggle; setSelected(-1)
            setPhase(previous => previous === "closed" ? previous : view.reduced ? "closed" : "closing")
            if (view.reduced && focusToggle) toggle.current?.focus()
        }, [view.reduced])
        const finishMain = React.useCallback(() => {
            setPhase(previous => previous === "opening" ? "open" : previous === "closing" ? "closed" : previous)
            if (state.current.phase === "closing" && returnFocus.current) { returnFocus.current = false; toggle.current?.focus() }
        }, [])
        const choose = React.useCallback((index: number, focusLink = false, toggleSelection = true) => {
            if (frozen || !state.current.admitted) return
            setSelected(previous => focusLink || !toggleSelection ? index : previous === index ? -1 : index)
            if (focusLink) setFocus(previous => ({ group: index, request: previous.request + 1 }))
        }, [frozen])
        const leave = React.useCallback((index: number, event: Input) => {
            if (state.current.phone || state.current.selected !== index) return
            const next = event.relatedTarget
            if (next instanceof Node && (triggers.current.get(index)?.contains(next) || groups.current.get(index)?.contains(next))) return
            setSelected(-1)
        }, [])
        const mainToggle = React.useCallback(() => {
            if (frozen || !state.current.admitted || !state.current.phone) return
            if (state.current.phase === "open" || state.current.phase === "opening") closeMain(false)
            else { returnFocus.current = false; setSelected(-1); setPhase(view.reduced ? "open" : "opening") }
        }, [frozen, view.reduced, closeMain])
        useLayout(() => {
            if (!host || frozen) { setView(old => old.admitted ? { ...old, admitted: false } : old); setSelected(-1); setPhase("closed"); return }
            let active = true, intersecting = false, previousWidth = window.innerWidth
            const media = matchMedia("(prefers-reduced-motion: reduce)")
            const measure = () => {
                if (!active) return
                const width = window.innerWidth, admitted = intersecting && !document.hidden && painted(host)
                if ((previousWidth <= 991) !== (width <= 991) || !admitted) { returnFocus.current = false; setSelected(-1); setPhase("closed") }
                previousWidth = width
                setView(old => old.width === width && old.reduced === media.matches && old.admitted === admitted ? old : { width, reduced: media.matches, admitted })
                refresh(n => n + 1)
            }
            const intersection = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; measure() })
            const resize = new ResizeObserver(measure), attributes = new MutationObserver(measure), paintPath: HTMLElement[] = []
            const paintEnd = (event: Event) => { if (event.currentTarget === host || event.currentTarget === event.target) measure() }
            intersection.observe(host); resize.observe(host)
            for (let n: HTMLElement | null = host; n; n = n.parentElement) { attributes.observe(n, { attributes: true, attributeFilter: ["style", "class", "hidden"] }); n.addEventListener("transitionend", paintEnd); n.addEventListener("animationend", paintEnd); paintPath.push(n) }
            const outside = (event: PointerEvent) => {
                if (event.defaultPrevented || !state.current.admitted) return
                const node = event.target
                if (!(node instanceof Node)) return
                if (toggle.current?.contains(node)) return
                if (state.current.phone) {
                    if (menu.current?.contains(node)) return
                    if (state.current.phase !== "closed") closeMain(false)
                } else if (![...triggers.current.values(), ...groups.current.values()].some(n => n.contains(node))) setSelected(-1)
            }
            const key = (event: KeyboardEvent) => {
                if (event.defaultPrevented || event.key !== "Escape" || !state.current.admitted) return
                if (state.current.selected >= 0) {
                    event.preventDefault(); const index = state.current.selected; setSelected(-1)
                    ;(state.current.phone ? phoneTriggers.current : triggers.current).get(index)?.focus()
                } else if (state.current.phone && state.current.phase !== "closed") { event.preventDefault(); closeMain(true) }
            }
            window.addEventListener("resize", measure); document.addEventListener("visibilitychange", measure)
            // Bubble after React/native caller cancellation, with no interception
            // of source links, body scrolling, touchmove or wheel propagation.
            document.addEventListener("pointerdown", outside); document.addEventListener("keydown", key)
            media.addEventListener("change", measure); measure()
            return () => { active = false; intersection.disconnect(); resize.disconnect(); attributes.disconnect(); for (const n of paintPath) { n.removeEventListener("transitionend", paintEnd); n.removeEventListener("animationend", paintEnd) }; window.removeEventListener("resize", measure); document.removeEventListener("visibilitychange", measure); document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", key); media.removeEventListener("change", measure) }
        }, [host, frozen, closeMain])
        const context: Navigation = { frozen, admitted: view.admitted && !frozen, reduced: view.reduced, phone: view.width <= 991, width: view.width, phase, selected, header: host, menu: menu.current, focusRequest: focus.request, focusGroup: focus.group, register, choose, leave, mainToggle, finishMain, anchor(index) {
            const trigger = triggers.current.get(index), h = host?.getBoundingClientRect(), t = trigger?.getBoundingClientRect()
            const xScale = h && host?.clientWidth ? h.width / host.clientWidth : 1, yScale = h && host?.clientHeight ? h.height / host.clientHeight : 1
            // Bounding rectangles use transformed screen pixels. Menu native
            // geometry uses the header's logical CSS pixels; source19 stays
            // a logical offset even inside a scaled/translated Preview owner.
            return h && t ? { left: (t.left - h.left) / Math.max(.001, xScale), top: (t.top - h.top) / Math.max(.001, yScale) + 19 } : NO_ANCHOR
        } }
        return <Context.Provider value={context}><Component {...props} ref={bind} data-mezmo-header-navigation={frozen ? "native-still" : "managed"} />{!frozen && <style>{TYPE_STYLE}</style>}</Context.Provider>
    }) as NativeLayer
}

function useActivation(action: () => void, props: LayerProps, disabled: boolean) {
    const previous = React.useRef({ channel: "", at: -1000 })
    const accept = (channel: string, event: Input, run = action) => {
        if (disabled) return
        const now = performance.now(), last = previous.current
        if (last.channel !== channel && now - last.at < 350) return
        previous.current = { channel, at: now }; if (!canceled(event)) run()
    }
    return { accept, events: { onClick(event: Input) { props.onClick?.(event); accept("click", event) }, onTap(event: Input, info?: unknown) { props.onTap?.(event, info); accept("tap", event) } } }
}
function trigger(Component: NativeLayer, index: number, phoneOnly: boolean): NativeLayer {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const nav = React.useContext(Context), disabled = !nav?.admitted || (phoneOnly && !nav.phone)
        const bind = React.useCallback((node: HTMLElement | null) => { nav?.register(phoneOnly ? "phone-trigger" : "trigger", index, node); writeRef(ref, node) }, [nav?.register, ref])
        const actions = useActivation(() => nav?.choose(index), props, disabled)
        const live = nav && !nav.frozen
        return <Component {...props} {...actions.events} ref={bind} role={live ? "button" : props.role} tabIndex={live ? 0 : props.tabIndex} aria-haspopup={live ? "menu" : undefined} aria-expanded={live ? nav.selected === index : undefined}
            data-mezmo-nav-trigger={index} data-mezmo-nav-phone-trigger={phoneOnly || undefined}
            onPointerEnter={(event: Input) => { props.onPointerEnter?.(event); if (nav?.admitted && !nav.phone && !canceled(event)) nav.choose(index, false, false) }}
            onPointerLeave={(event: Input) => { props.onPointerLeave?.(event); if (!canceled(event)) nav?.leave(index, event) }}
            onKeyDown={(event: Input) => { props.onKeyDown?.(event); if (!["Enter", " ", "ArrowDown"].includes(event.key ?? "")) return; const blocked = canceled(event); actions.accept("key", event, event.key === "ArrowDown" ? () => nav?.choose(index, true) : undefined); if (!disabled && !blocked) event.preventDefault?.() }}
            style={phoneOnly && live ? { ...props.style, display: nav.phone ? "block" : "none", position: "relative", left: "auto", top: "auto", width: "max-content", height: "auto", padding: "5px 0", fontSize: index === 0 ? 13.008 : 12, lineHeight: "12.6px", cursor: "pointer" } : props.style} />
    }) as NativeLayer
}
export function withMezmoPlatformTrigger(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return trigger(Component, 0, false) }
export function withMezmoSolutionsTrigger(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return trigger(Component, 1, false) }
export function withMezmoResourcesTrigger(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return trigger(Component, 2, false) }
export function withMezmoAboutTrigger(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return trigger(Component, 3, false) }
export function withMezmoPhonePlatform(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return trigger(Component, 0, true) }
export function withMezmoPhoneSolutions(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return trigger(Component, 1, true) }
export function withMezmoPhoneResources(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return trigger(Component, 2, true) }
export function withMezmoPhoneAbout(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return trigger(Component, 3, true) }
export function withMezmoPhoneMenuToggle(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const nav = React.useContext(Context), bind = React.useCallback((node: HTMLElement | null) => { nav?.register("toggle", 0, node); writeRef(ref, node) }, [nav?.register, ref])
        const actions = useActivation(() => nav?.mainToggle(), props, !nav?.admitted || !nav.phone)
        return <Component {...props} {...actions.events} ref={bind} role={nav && !nav.frozen ? "button" : props.role} tabIndex={nav && !nav.frozen ? 0 : props.tabIndex} aria-label="menu" aria-haspopup="menu" aria-expanded={!!nav && nav.phase !== "closed"}
            style={nav && !nav.frozen ? { ...props.style, display: nav.phone ? "block" : "none", position: "absolute", left: "auto", right: 4, top: 5, width: 50, height: 68, cursor: "pointer", backgroundColor: "transparent" } : props.style}
            onKeyDown={(event: Input) => { props.onKeyDown?.(event); if (event.key === "Enter" || event.key === " ") { const blocked = canceled(event); actions.accept("key", event); if (!blocked && nav?.admitted && nav.phone) event.preventDefault?.() } }} />
    }) as NativeLayer
}
/** Retain the genuine18×14 SVG artwork; the separate native50×68 Frame
 * supplies the source hit area without stretching or replacing that SVG. */
export function withMezmoPhoneMenuArtwork(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const nav = React.useContext(Context)
        return <Component {...props} ref={ref} style={nav && !nav.frozen && nav.phone ? { ...props.style, position: "absolute", left: "auto", right: 20, top: 32, width: 18, height: 14, pointerEvents: "none" } : props.style} />
    }) as NativeLayer
}

/** Native collection owns only its finite300ms vertical entrance/exit. */
export function withMezmoMenuCollection(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const nav = React.useContext(Context), [host, setHost] = React.useState<HTMLElement | null>(null)
        const bind = React.useCallback((node: HTMLElement | null) => { setHost(old => old === node ? old : node); nav?.register("menu", 0, node); writeRef(ref, node) }, [nav?.register, ref])
        useLayout(() => {
            if (!nav || !host || !nav.phone || nav.frozen || !nav.admitted || !["opening", "closing"].includes(nav.phase)) return
            if (nav.reduced) { nav.finishMain(); return }
            let active = true
            const distance = host.getBoundingClientRect().height + (nav.header?.getBoundingClientRect().height ?? 78), closing = nav.phase === "closing"
            const effect = host.animate([{ transform: closing ? "translateY(0)" : `translateY(${-distance}px)` }, { transform: closing ? `translateY(${-distance}px)` : "translateY(0)" }], { duration: 300, easing: "ease", fill: "both" })
            effect.onfinish = () => { if (active) nav.finishMain() }
            return () => { active = false; effect.onfinish = null; effect.cancel() }
        }, [host, nav?.phone, nav?.frozen, nav?.admitted, nav?.reduced, nav?.phase, nav?.finishMain])
        const shown = !!nav && !nav.frozen && nav.admitted && (nav.phone ? nav.phase !== "closed" : nav.selected >= 0)
        return <Component {...props} ref={bind} data-mezmo-nav-collection={shown ? nav?.phase : "closed"} aria-hidden={!shown}
            style={{ ...props.style, display: shown ? "block" : "none", position: "absolute", left: 0, top: nav?.phone ? "100%" : 0, width: "100%", height: nav?.phone ? "auto" : 0, padding: nav?.phone ? 16 : 0, overflow: "visible", pointerEvents: shown ? "auto" : "none", zIndex: 1 }} />
    }) as NativeLayer
}
export function withMezmoMenuBody(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const nav = React.useContext(Context)
        return <Component {...props} ref={ref} data-mezmo-nav-body="true" style={{ ...props.style, position: "relative", left: 0, top: 0, width: "100%", height: nav?.phone ? "auto" : 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0, padding: nav?.phone ? nav.width <= 479 ? "16px 20px" : "16px 30px" : 0, maxHeight: nav?.phone ? "70vh" : "none", overflow: nav?.phone ? "auto" : "visible", backgroundColor: nav?.phone ? "#ffffff" : "transparent", borderRadius: nav?.phone ? 5 : 0, boxShadow: nav?.phone ? "0 2px 5px #0003" : "none" }} />
    }) as NativeLayer
}
function group(Component: NativeLayer, index: number): NativeLayer {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const nav = React.useContext(Context), own = React.useRef<HTMLElement | null>(null), anchor = nav?.anchor(index) ?? NO_ANCHOR
        const bind = React.useCallback((node: HTMLElement | null) => { own.current = node; nav?.register("group", index, node); writeRef(ref, node) }, [nav?.register, ref])
        useLayout(() => { if (nav?.focusGroup === index && nav.selected === index && own.current) enabledLinks(own.current).find(n => !n.hasAttribute("data-mezmo-nav-phone-trigger"))?.focus() }, [nav?.focusRequest, nav?.focusGroup, nav?.selected])
        return <Component {...props} ref={bind} data-mezmo-nav-group={index} onPointerEnter={(event: Input) => { props.onPointerEnter?.(event); if (nav?.admitted && !nav.phone && !canceled(event)) nav.choose(index, false, false) }} onPointerLeave={(event: Input) => { props.onPointerLeave?.(event); if (!canceled(event)) nav?.leave(index, event) }}
            style={{ ...props.style, display: nav?.phone || nav?.selected === index ? "flex" : "none", flexDirection: "column", alignItems: "flex-start", gap: 0, position: nav?.phone ? "relative" : "absolute", left: nav?.phone ? 0 : anchor.left, top: nav?.phone ? 0 : anchor.top, width: "max-content", height: "auto", marginBottom: nav?.phone ? index === 3 ? 5 : 10 : 0, pointerEvents: "auto" }} />
    }) as NativeLayer
}
export function withMezmoPlatformGroup(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return group(Component, 0) }
export function withMezmoSolutionsGroup(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return group(Component, 1) }
export function withMezmoResourcesGroup(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return group(Component, 2) }
export function withMezmoAboutGroup(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return group(Component, 3) }
function panel(Component: NativeLayer, index: number): NativeLayer {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const nav = React.useContext(Context)
        return <Component {...props} ref={ref} data-mezmo-nav-panel={index} style={{ ...props.style, display: nav?.selected === index ? "flex" : "none", position: "relative", left: 0, top: 0, width: "max-content", height: "auto", flexDirection: nav?.phone ? "column" : "row", alignItems: "flex-start", gap: nav?.phone ? 8 : 24, marginTop: nav?.phone ? 6 : 30, marginRight: nav?.phone ? 40 : 0, padding: nav?.phone ? "5px 0 21px" : "16px 24px", backgroundColor: nav?.phone ? "transparent" : "#ffffff", borderRadius: nav?.phone ? 0 : 3, boxShadow: nav?.phone ? "none" : "0 2px 5px #0003", pointerEvents: "auto" }} />
    }) as NativeLayer
}
export function withMezmoPlatformPanel(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return panel(Component, 0) }
export function withMezmoSolutionsPanel(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return panel(Component, 1) }
export function withMezmoResourcesPanel(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return panel(Component, 2) }
export function withMezmoAboutPanel(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return panel(Component, 3) }
/** Newly authored native link typography; old Desktop labels are untouched. */
export function withMezmoMenuLink(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const nav = React.useContext(Context)
        return <Component {...props} ref={ref} data-mezmo-nav-link="source" style={{ ...props.style, position: "relative", left: "auto", top: "auto", display: props.style?.display ?? "block", width: "max-content", height: "auto", padding: "4px 0", fontSize: nav && nav.width >= 1280 ? 14 : 12, lineHeight: nav && nav.width >= 1280 ? "21px" : "18px", whiteSpace: "nowrap", color: "#0a090c" }} />
    }) as NativeLayer
}
export function withMezmoCustomersVisibility(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    const Link = withMezmoMenuLink(Component)
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => { const nav = React.useContext(Context); return <Link {...props} ref={ref} style={{ ...props.style, ...(nav && nav.width >= 1280 ? { display: "none" } : {}) }} /> }) as NativeLayer
}
function phoneOnly(Component: NativeLayer, role: "aura" | "signin" | "cta" | "heading"): NativeLayer {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const nav = React.useContext(Context), show = nav?.phone
        const common: React.CSSProperties = { ...props.style, display: show ? "block" : "none", position: "relative", left: "auto", top: "auto", height: "auto", width: "max-content" }
        const style: React.CSSProperties = role === "aura" ? { ...common, width: 49, height: 33.59375, marginBottom: 5 } : role === "signin" ? { ...common, padding: "5px 0", fontSize: 12, lineHeight: "12.6px" } : role === "cta" ? { ...common, width: "100%", height: 40.796875, marginTop: 16 } : { ...props.style, position: "relative", left: "auto", top: "auto", width: "max-content", height: "auto", fontSize: 12, lineHeight: nav && nav.width >= 1280 ? "14.7px" : "12.6px", marginBottom: 8 }
        return <Component {...props} ref={ref} data-mezmo-nav-part={role} style={style} />
    }) as NativeLayer
}
export function withMezmoPhoneAura(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phoneOnly(Component, "aura") }
export function withMezmoPhoneSignin(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phoneOnly(Component, "signin") }
export function withMezmoPhoneCTA(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phoneOnly(Component, "cta") }
export function withMezmoMenuHeading(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phoneOnly(Component, "heading") }
