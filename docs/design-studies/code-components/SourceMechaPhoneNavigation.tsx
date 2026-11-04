import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"

/**
 * SOURCE INSPIRATION / HERO-015 / MECHA / Widelab, Grzegorz Leśniewicz.
 * Independent behavior for the observed Phone Tomorrow Recycling MORE sheet.
 * Keep the sheet, copy, rules and individual media as editable native layers.
 * Retained source code supplies the .4/.9s reveals and 200px page push;
 * retained Phone captures establish independent sheet scrolling/background y585.
 * No original behavior JS, image of the whole sheet, model or decoder is used.
 * Contact, other project details and successful form submission are separate.
 */

type Phase = "closed" | "opening" | "open" | "closing"
type NativeEvent = {
    defaultPrevented?: boolean
    currentTarget?: EventTarget | null
    preventDefault?: () => void
    stopPropagation?: () => void
}
type LayerProps = {
    [key: string]: unknown
    style?: React.CSSProperties
    onClick?: React.MouseEventHandler<HTMLElement>
    onTap?: (event: NativeEvent, info?: unknown) => void
    onKeyDown?: React.KeyboardEventHandler<HTMLElement>
    tabIndex?: number
}
type RefSlot = { current: HTMLElement | null }
type DetailState = {
    phase: Phase
    active: boolean
    frozen: boolean
    phone: boolean
    reduced: boolean
    panelID: string
    root: RefSlot
    panel: RefSlot
    closeButton: RefSlot
    show: (trigger: HTMLElement | null) => void
    hide: () => void
}
const Context = React.createContext<DetailState | null>(null)
const MENU_EASE = "cubic-bezier(.82,0,.18,1)"
// The sheet lands at 1.05s; retain the opening phase until the source page push
// finishes at 1.2s so replacing the animation cannot truncate that movement.
const OPEN_MS = 1200
const CLOSE_MS = 1120
const CSS = `
@keyframes mechaTomorrowSheetIn{from{translate:0 100%}to{translate:0 0}}
@keyframes mechaTomorrowSheetOut{from{translate:0 0}to{translate:0 100%}}
@keyframes mechaTomorrowFaderIn{from{opacity:0}to{opacity:1}}
@keyframes mechaTomorrowFaderOut{from{opacity:1}to{opacity:0}}
@keyframes mechaTomorrowPageUp{from{translate:0 0}to{translate:0 -200px}}
@keyframes mechaTomorrowPageBack{from{translate:0 -200px}to{translate:0 0}}
`

function assignRef(ref: React.ForwardedRef<HTMLElement>, node: HTMLElement | null) {
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
}
function useRefPair(own: RefSlot, caller: React.ForwardedRef<HTMLElement>) {
    return React.useCallback((node: HTMLElement | null) => {
        own.current = node
        assignRef(caller, node)
    }, [own, caller])
}
function useDetail() { return React.useContext(Context) }
function eventNode(event: NativeEvent) {
    return typeof HTMLElement !== "undefined" && event.currentTarget instanceof HTMLElement ? event.currentTarget : null
}
function useActivation(action: (node: HTMLElement | null) => void, disabled: boolean) {
    const last = React.useRef<{ channel: string; at: number } | null>(null)
    return (channel: string, event: NativeEvent) => {
        if (disabled || event.defaultPrevented) return
        const at = typeof performance === "undefined" ? Date.now() : performance.now(), prior = last.current
        if (prior && prior.channel !== channel && at - prior.at < 350) return
        last.current = { channel, at }
        event.preventDefault?.()
        action(eventNode(event))
    }
}
function scrollerFor(root: HTMLElement | null): HTMLElement | null {
    for (let node = root?.parentElement ?? null; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
        if (/(auto|scroll)/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight) return node
    }
    return null
}
function focusable(panel: HTMLElement) {
    return Array.from(panel.querySelectorAll<HTMLElement>("a[href],button,input,select,textarea,video[controls],audio[controls],[tabindex]:not([tabindex='-1'])"))
        .filter(node => !node.hasAttribute("disabled") && node.getAttribute("aria-hidden") !== "true" && node.getBoundingClientRect().width > 0 && getComputedStyle(node).visibility !== "hidden")
}

/** Apply to the existing source shell; all authored children and props survive. */
export function withMechaTomorrowDetailRoot(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const target = RenderTarget.current(), staticRenderer = useIsStaticRenderer(), frozen = staticRenderer || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail
        const root = React.useRef<HTMLElement | null>(null), panel = React.useRef<HTMLElement | null>(null), closeButton = React.useRef<HTMLElement | null>(null), trigger = React.useRef<HTMLElement | null>(null)
        const bind = useRefPair(root, ref), token = React.useId().replace(/[^a-zA-Z0-9]/g, ""), panelID = "mecha-tomorrow-detail-" + token
        const [phase, setPhase] = React.useState<Phase>("closed"), [phone, setPhone] = React.useState(false), [reduced, setReduced] = React.useState(false)
        const active = phase !== "closed"
        React.useEffect(() => {
            if (frozen) return
            const narrow = window.matchMedia("(max-width: 991px)"), motion = window.matchMedia("(prefers-reduced-motion: reduce)")
            const read = () => { setPhone(narrow.matches); setReduced(motion.matches); if (!narrow.matches) setPhase("closed") }
            read(); narrow.addEventListener("change", read); motion.addEventListener("change", read)
            return () => { narrow.removeEventListener("change", read); motion.removeEventListener("change", read) }
        }, [frozen])
        React.useEffect(() => {
            if (frozen || !phone) { setPhase("closed"); return }
            if (phase !== "opening" && phase !== "closing") return
            if (reduced) { setPhase(phase === "opening" ? "open" : "closed"); return }
            const timer = window.setTimeout(() => setPhase(phase === "opening" ? "open" : "closed"), phase === "opening" ? OPEN_MS : CLOSE_MS)
            return () => window.clearTimeout(timer)
        }, [phase, frozen, phone, reduced])
        React.useLayoutEffect(() => {
            if (!active || frozen) return
            const scroll = scrollerFor(root.current), styleOwner = scroll ?? document.documentElement, url = window.location.href
            const x = scroll ? scroll.scrollLeft : window.scrollX, y = scroll ? scroll.scrollTop : window.scrollY
            const properties = ["overflow-y", "overscroll-behavior-y"] as const
            const previous = properties.map(name => ({ name, value: styleOwner.style.getPropertyValue(name), priority: styleOwner.style.getPropertyPriority(name) }))
            styleOwner.style.setProperty("overflow-y", "hidden", "important"); styleOwner.style.setProperty("overscroll-behavior-y", "contain", "important")
            closeButton.current?.focus({ preventScroll: true })
            const key = (event: KeyboardEvent) => {
                if (event.defaultPrevented) return
                if (event.key === "Escape") { event.preventDefault(); setPhase("closing"); return }
                const frame = panel.current
                if (event.key !== "Tab" || !frame) return
                const nodes = focusable(frame), first = nodes[0] ?? frame, last = nodes[nodes.length - 1] ?? frame
                if (!nodes.length || event.shiftKey && (document.activeElement === first || !frame.contains(document.activeElement))) { event.preventDefault(); last.focus({ preventScroll: true }) }
                else if (!event.shiftKey && (document.activeElement === last || !frame.contains(document.activeElement))) { event.preventDefault(); first.focus({ preventScroll: true }) }
            }
            window.addEventListener("keydown", key)
            return () => {
                window.removeEventListener("keydown", key)
                for (const saved of previous) {
                    const own = saved.name === "overflow-y" ? "hidden" : "contain"
                    if (styleOwner.style.getPropertyValue(saved.name) !== own || styleOwner.style.getPropertyPriority(saved.name) !== "important") continue
                    if (saved.value) styleOwner.style.setProperty(saved.name, saved.value, saved.priority); else styleOwner.style.removeProperty(saved.name)
                }
                if (window.location.href === url) {
                    if (scroll?.isConnected) { scroll.scrollLeft = x; scroll.scrollTop = y }
                    else if (!scroll) window.scrollTo({ left: x, top: y, behavior: "instant" as ScrollBehavior })
                    if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true })
                }
            }
        }, [active, frozen])
        const show = (node: HTMLElement | null) => { if (frozen || !phone || phase !== "closed") return; trigger.current = node ?? (document.activeElement instanceof HTMLElement && root.current?.contains(document.activeElement) ? document.activeElement : null); setPhase(reduced ? "open" : "opening") }
        const hide = () => { if (!frozen && phase !== "closed" && phase !== "closing") setPhase(reduced ? "closed" : "closing") }
        const state: DetailState = { phase, active, frozen, phone, reduced, panelID, root, panel, closeButton, show, hide }
        return <Context.Provider value={state}><style>{CSS}</style><Component {...props} ref={bind} data-mecha-detail-state={phase} /></Context.Provider>
    })
}

/** Attach to a new native MORE button; Desktop remains untouched. */
export function withMechaTomorrowMore(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = useDetail(), activate = useActivation(node => state?.show(node), !state || state.frozen || !state.phone)
        return <Component {...props} ref={ref} role="button" tabIndex={props.tabIndex ?? 0} aria-controls={state?.panelID} aria-expanded={state?.active ?? false}
            style={state && !state.frozen && !state.phone ? { ...props.style, display: "none" } : props.style}
            onTap={(event: NativeEvent, info: unknown) => { props.onTap?.(event, info); activate("tap", event) }}
            onClick={(event: React.MouseEvent<HTMLElement>) => { props.onClick?.(event); activate("click", event) }}
            onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => { props.onKeyDown?.(event); if (event.key === "Enter" || event.key === " ") activate("key", event) }} />
    })
}

/** Full viewport native overlay; its authored children stay selectable. */
export function withMechaTomorrowDetailOverlay(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = useDetail(), own = React.useRef<HTMLElement | null>(null), bind = useRefPair(state?.panel ?? own, ref)
        if (!state || state.frozen) return <Component {...props} ref={bind} />
        return <Component {...props} ref={bind} id={state.panelID} role="dialog" aria-modal={state.active || undefined} aria-label="Tomorrow Recycling / source project details" aria-hidden={!state.active} tabIndex={-1}
            style={{ ...props.style, position: "fixed", inset: 0, width: "100vw", height: "100dvh", zIndex: 1000, opacity: state.active ? 1 : 0, visibility: state.active ? "visible" : "hidden", pointerEvents: state.active ? "auto" : "none" }} />
    })
}

/** Apply to the white scrolling native sheet, not its content-height frame. */
export function withMechaTomorrowDetailSheet(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = useDetail(), own = React.useRef<HTMLElement | null>(null), bind = useRefPair(own, ref)
        React.useLayoutEffect(() => { if (state?.phase === "opening" || state?.phase === "open" && state.reduced) { if (own.current) own.current.scrollTop = 0 } }, [state?.phase, state?.reduced])
        if (!state || state.frozen) return <Component {...props} ref={bind} />
        const animation = state.reduced ? "none" : state.phase === "opening" ? `mechaTomorrowSheetIn .9s ${MENU_EASE} .15s both` : state.phase === "closing" ? `mechaTomorrowSheetOut .9s ${MENU_EASE} both` : "none"
        return <Component {...props} ref={bind} data-mecha-detail-scroll="" style={{ ...props.style, position: "absolute", inset: 0, width: "100%", height: "100%", overflowY: "auto", overflowX: "hidden", overscrollBehaviorY: "contain", touchAction: "pan-y", background: "#ffffff", opacity: 1, translate: state.phase === "closed" ? "0 100%" : "0 0", animation } as React.CSSProperties} />
    })
}

export function withMechaTomorrowDetailFader(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = useDetail()
        if (!state || state.frozen) return <Component {...props} ref={ref} />
        const animation = state.reduced ? "none" : state.phase === "opening" ? "mechaTomorrowFaderIn .4s ease-in-out both" : state.phase === "closing" ? "mechaTomorrowFaderOut .4s ease-in-out .72s both" : "none"
        return <Component {...props} ref={ref} aria-hidden="true" style={{ ...props.style, position: "absolute", inset: 0, opacity: state.active ? 1 : 0, animation }} />
    })
}

export function withMechaTomorrowDetailClose(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = useDetail(), own = React.useRef<HTMLElement | null>(null), bind = useRefPair(state?.closeButton ?? own, ref), activate = useActivation(() => state?.hide(), !state || state.frozen)
        return <Component {...props} ref={bind} role="button" tabIndex={props.tabIndex ?? 0}
            onTap={(event: NativeEvent, info: unknown) => { props.onTap?.(event, info); activate("tap", event) }}
            onClick={(event: React.MouseEvent<HTMLElement>) => { props.onClick?.(event); activate("click", event) }}
            onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => { props.onKeyDown?.(event); if (event.key === "Enter" || event.key === " ") activate("key", event) }} />
    })
}

/** Bind existing background siblings; do not translate the overlay's ancestor. */
export function withMechaTomorrowDetailBackground(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = useDetail()
        if (!state || state.frozen || !state.phone) return <Component {...props} ref={ref} />
        const animation = state.reduced ? "none" : state.phase === "opening" ? `mechaTomorrowPageUp 1.2s ${MENU_EASE} both` : state.phase === "closing" ? `mechaTomorrowPageBack 1.2s ${MENU_EASE} both` : "none"
        return <Component {...props} ref={ref} aria-hidden={state.active ? true : props["aria-hidden"]} style={{ ...props.style, translate: state.active ? "0 -200px" : props.style?.translate, animation }} />
    })
}


// Manual same-module Framer package: Contact append; retained Tomorrow prefix above is byte-exact.

/**
 * SOURCE INSPIRATION / HERO-015 / MECHA / Widelab, Grzegorz Leśniewicz.
 * Contact opening, native editable form/typography and independent Phone scroll.
 * Fresh anonymous original-site inspection: contact-opening-v2, fourteen states.
 * The original contact/preloader scripts and genuine GLB match retained bytes.
 * Native source fonts, inputs, artwork and exact authored links have separate
 * model/Preview gates. This prototype never sends a form or invents success.
 * The existing Tomorrow sheet remains composed, with its bodies unchanged.
 */
type MechaContactPrivate_Phase = "closed" | "opening" | "open" | "closing"
type MechaContactPrivate_Event = { defaultPrevented?: boolean; key?: string; repeat?: boolean; currentTarget?: EventTarget | null; preventDefault?: () => void }
type MechaContactPrivate_Props = {
    [key: string]: unknown
    children?: React.ReactNode
    style?: React.CSSProperties
    tabIndex?: number
    onClick?: React.MouseEventHandler<HTMLElement>
    onTap?: (event: MechaContactPrivate_Event, info?: unknown) => void
    onKeyDown?: React.KeyboardEventHandler<HTMLElement>
}
type MechaContactPrivate_Geometry = { width: number; height: number; rem: number; phone: boolean }
type MechaContactPrivate_State = MechaContactPrivate_Geometry & { phase: MechaContactPrivate_Phase; frozen: boolean; reduced: boolean; id: string; show: (trigger: HTMLElement | null) => void; hide: () => void; register: (key: string, node: HTMLElement | null) => void }
const MechaContactPrivate_Context = React.createContext<MechaContactPrivate_State>({ width: 1440, height: 900, rem: 16, phone: false, phase: "closed", frozen: true, reduced: false, id: "", show: () => {}, hide: () => {}, register: () => {} })
const MechaContactPrivate_EASE = "cubic-bezier(.82,0,.18,1)"
const MechaContactPrivate_FADE = `linear(${Array.from({ length: 129 }, (_, index) => { const t = index / 128; return `${Number((t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2).toFixed(9))} ${t * 100}%` }).join(",")})`
const MechaContactPrivate_REVISION = {}
const MechaContactPrivate_OPEN_MS = 1950
const MechaContactPrivate_CLOSE_MS = 1120
function MechaContactPrivate_writeRef(ref: React.ForwardedRef<HTMLElement>, node: HTMLElement | null) { if (typeof ref === "function") ref(node); else if (ref) ref.current = node }
function MechaContactPrivate_sourceRem(width: number) {
    const span = width <= 479 ? [375, 479, 16, 18] : width <= 767 ? [479, 767, 16, 18] : width <= 991 ? [767, 991, 16, 18] : width <= 1440 ? [991, 1440, 11, 16] : width <= 1920 ? [1440, 1920, 16, 21] : [1920, 2400, 21, 26]
    return span[2] + (width - span[0]) / (span[1] - span[0]) * (span[3] - span[2])
}
function MechaContactPrivate_scrollerFor(root: HTMLElement) {
    for (let node = root.parentElement; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
        if (/auto|scroll/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight) return node
    }
    return null
}
function MechaContactPrivate_contactProvider(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> {
    return React.forwardRef<HTMLElement, MechaContactPrivate_Props>((props, ref) => {
        const target = RenderTarget.current(), frozen = useIsStaticRenderer() || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail
        const [host, setHost] = React.useState<HTMLElement | null>(null), [phase, setPhase] = React.useState<MechaContactPrivate_Phase>("closed"), [reduced, setReduced] = React.useState(false)
        const [geometry, setGeometry] = React.useState<MechaContactPrivate_Geometry>({ width: 1440, height: 900, rem: 16, phone: false })
        const parts = React.useRef(new Map<string, HTMLElement>()), trigger = React.useRef<HTMLElement | null>(null), reducedNow = React.useRef(reduced)
        reducedNow.current = reduced
        const id = "mecha-contact-" + React.useId().replace(/[^\w-]/g, "_")
        const register = React.useCallback((key: string, node: HTMLElement | null) => { if (node) parts.current.set(key, node); else parts.current.delete(key) }, [])
        const attach = React.useCallback((node: HTMLElement | null) => { setHost(node); MechaContactPrivate_writeRef(ref, node) }, [ref])
        React.useLayoutEffect(() => {
            if (!host || frozen) { setPhase("closed"); return }
            const motion = matchMedia("(prefers-reduced-motion: reduce)")
            const read = () => { const width = window.innerWidth; setGeometry({ width, height: window.innerHeight, rem: MechaContactPrivate_sourceRem(width), phone: width <= 991 }); setReduced(motion.matches) }
            read(); window.addEventListener("resize", read); motion.addEventListener("change", read)
            return () => { window.removeEventListener("resize", read); motion.removeEventListener("change", read) }
        }, [host, frozen, MechaContactPrivate_REVISION])
        React.useEffect(() => {
            if (frozen || phase === "closed" || phase === "open") return
            if (reduced) { setPhase(phase === "opening" ? "open" : "closed"); return }
            const timer = window.setTimeout(() => setPhase(phase === "opening" ? "open" : "closed"), phase === "opening" ? MechaContactPrivate_OPEN_MS : MechaContactPrivate_CLOSE_MS)
            return () => window.clearTimeout(timer)
        }, [frozen, phase, reduced])
        const active = !frozen && phase !== "closed"
        React.useLayoutEffect(() => {
            if (!active || !host) return
            const container = MechaContactPrivate_scrollerFor(host), owner = container ?? document.documentElement
            const gutter = !container && window.innerWidth > document.documentElement.clientWidth
            const properties = gutter ? ["overflow-y", "overscroll-behavior-y", "scrollbar-gutter"] : ["overflow-y", "overscroll-behavior-y"]
            const leases = properties.map(name => ({ name, value: owner.style.getPropertyValue(name), priority: owner.style.getPropertyPriority(name) }))
            if (gutter) owner.style.setProperty("scrollbar-gutter", "stable", "important")
            owner.style.setProperty("overflow-y", "hidden", "important"); owner.style.setProperty("overscroll-behavior-y", "contain", "important")
            if (container) container.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); else window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
            parts.current.get("close")?.focus({ preventScroll: true })
            const key = (event: KeyboardEvent) => { if (!event.defaultPrevented && event.key === "Escape") { event.preventDefault(); setPhase(reducedNow.current ? "closed" : "closing") } }
            window.addEventListener("keydown", key)
            return () => {
                window.removeEventListener("keydown", key)
                for (const lease of leases) {
                    const own = lease.name === "overflow-y" ? "hidden" : lease.name === "scrollbar-gutter" ? "stable" : "contain"
                    if (owner.style.getPropertyValue(lease.name) !== own || owner.style.getPropertyPriority(lease.name) !== "important") continue
                    if (lease.value) owner.style.setProperty(lease.name, lease.value, lease.priority); else owner.style.removeProperty(lease.name)
                }
                if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true })
            }
        }, [active, host])
        // Source opening resets the background Lenis position, but leaves the
        // modal wrap’s independent scroll position intact across reopenings.
        const show = (node: HTMLElement | null) => { if (frozen || phase !== "closed") return; trigger.current = node; setPhase(reduced ? "open" : "opening") }
        const hide = () => { if (!frozen && phase !== "closed" && phase !== "closing") setPhase(reduced ? "closed" : "closing") }
        const state = { ...geometry, phase, frozen, reduced, id, register, show, hide }
        return <MechaContactPrivate_Context.Provider value={state}><Component {...props} ref={attach} data-mecha-contact-state={phase}><style>{`[data-mecha-contact-text] p,[data-mecha-contact-text] span{font-family:inherit!important;font-size:inherit!important;font-weight:inherit!important;line-height:inherit!important;letter-spacing:inherit!important;color:inherit!important;margin:0!important}[data-mecha-contact-field] input,[data-mecha-contact-field] textarea{font-family:inherit!important;font-size:inherit!important;font-weight:inherit!important;line-height:inherit!important;letter-spacing:inherit!important;color:inherit!important;background:transparent!important;width:100%!important;height:100%!important;min-height:0!important;padding:0!important;border:0!important;border-radius:0!important;resize:none}`}</style>{props.children}</Component></MechaContactPrivate_Context.Provider>
    })
}
function MechaContactPrivate_useNode(key: string | null, ref: React.ForwardedRef<HTMLElement>) {
    const { register } = React.useContext(MechaContactPrivate_Context), [node, setNode] = React.useState<HTMLElement | null>(null)
    const attach = React.useCallback((value: HTMLElement | null) => { setNode(value); if (key) register(key, value); MechaContactPrivate_writeRef(ref, value) }, [key, register, ref])
    return [node, attach] as const
}
function MechaContactPrivate_useActivation(action: (node: HTMLElement | null) => void, frozen: boolean) {
    const last = React.useRef<{ channel: string; time: number } | null>(null)
    return (channel: string, event: MechaContactPrivate_Event) => {
        if (frozen || event.repeat) return
        const time = performance.now(), previous = last.current
        if (previous && previous.channel !== channel && time - previous.time < 350) {
            // The second channel still has its own browser default. In
            // particular, a click following Framer's tap can navigate an
            // anchor even though its modal action was correctly deduplicated.
            event.preventDefault?.()
            return
        }
        // Consume a caller-cancelled tap/click too: its alternate synthetic
        // channel is the same physical gesture and must not reopen the panel.
        last.current = { channel, time }
        if (event.defaultPrevented) return
        event.preventDefault?.()
        action(event.currentTarget instanceof HTMLElement ? event.currentTarget : null)
    }
}
type MechaContactPrivate_Motion = { transform?: string; opacity?: number }
function MechaContactPrivate_useMotion(node: HTMLElement | null, state: MechaContactPrivate_State, target: MechaContactPrivate_Motion, duration: number, openDelay: number, ease = MechaContactPrivate_EASE, closeDelay = 0) {
    const running = React.useRef<Animation | null>(null), previous = React.useRef<MechaContactPrivate_Motion | null>(null), lastTarget = React.useRef<MechaContactPrivate_Motion | null>(null)
    const key = JSON.stringify(target)
    React.useLayoutEffect(() => {
        const priorTarget = lastTarget.current; lastTarget.current = target
        if (!node || state.frozen || state.reduced || state.phase === "closed" || state.phase === "open" || !duration || !Object.keys(target).length) { running.current?.cancel(); running.current = null; previous.current = null; return }
        const before = getComputedStyle(node), initial: MechaContactPrivate_Motion = previous.current ?? priorTarget ?? { ...(target.transform !== undefined ? { transform: before.transform } : {}), ...(target.opacity !== undefined ? { opacity: Number(before.opacity) } : {}) }
        running.current?.cancel()
        previous.current = null
        if (JSON.stringify(initial) === key) return
        const animation = node.animate([initial, target], { duration, delay: state.phase === "opening" ? openDelay : closeDelay, easing: ease, fill: "backwards" })
        running.current = animation
        animation.onfinish = () => { animation.cancel(); if (running.current === animation) running.current = null }
        return () => { const painted = getComputedStyle(node); previous.current = { ...(target.transform !== undefined ? { transform: painted.transform } : {}), ...(target.opacity !== undefined ? { opacity: Number(painted.opacity) } : {}) }; animation.onfinish = null; animation.cancel(); if (running.current === animation) running.current = null }
    }, [node, state.phase, state.frozen, state.reduced, key, duration, openDelay, closeDelay, ease])
}
type MechaContactPrivate_Role = "overlay" | "background" | "fader" | "wrap" | "form-pane" | "form" | "title" | "badge" | "badge-art" | "headlines" | "title-mask" | "title-first" | "title-second" | "subtitle-mask" | "subtitle" | "fields" | "field-mask" | "wide-field-mask" | "name" | "email" | "message" | "input" | "textarea" | "label" | "rule" | "send" | "send-label" | "model-pane" | "model-clip" | "graphic" | "close" | "close-label" | "divider" | "send-icon" | "close-icon" | "action-line-horizontal" | "action-line-vertical"
function MechaContactPrivate_styleFor(role: MechaContactPrivate_Role, s: MechaContactPrivate_State): React.CSSProperties {
    const r = s.rem, phone = s.phone, active = s.phase !== "closed", close = s.phase === "closing", padding = phone ? 16 : 28, titleSize = s.width <= 767 ? 2 : phone ? 3.25 : 3.75, titleLine = s.width <= 767 ? 1.02 : phone ? .96 : .92
    const flow: React.CSSProperties = { position: "relative", top: "auto", left: "auto", right: "auto", bottom: "auto", minWidth: 0, flex: "0 0 auto" }
    const text: React.CSSProperties = { fontFamily: '"Neue Haas Grotesk",Arial,sans-serif', fontSize: r, lineHeight: 1.5, letterSpacing: "normal", fontWeight: 400, color: "#c5f0f7" }
    switch (role) {
        case "overlay": return { position: "fixed", inset: 0, width: "100%", height: "100dvh", display: active ? "block" : "none", opacity: active ? 1 : 0, overflow: "hidden", zIndex: 2147483647, background: "transparent", pointerEvents: active ? "auto" : "none", transform: "none", scale: "1", transformOrigin: "0 0" }
        case "background": return { position: "absolute", inset: 0, width: "100%", height: "100%", background: "#911a46", transform: close || !active ? "translateY(100%)" : "translateY(0%)", zIndex: 1 }
        case "fader": return { position: "absolute", inset: 0, width: "100%", height: "100%", background: "rgba(255,255,255,.5)", opacity: close || !active ? 0 : 1, zIndex: 0 }
        case "wrap": return { position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: phone ? "column" : "row", overflowY: phone ? "auto" : "visible", overflowX: phone ? "hidden" : "visible", overscrollBehaviorY: "contain", transform: close ? "translateY(100%)" : "translateY(0%)", zIndex: 2 }
        case "form-pane": return { ...flow, position: phone ? "static" : "relative", width: phone ? "100%" : "auto", flex: phone ? "0 0 auto" : "1 1 0", height: phone ? "auto" : "100%", padding: phone ? "0 16px" : 0, display: "flex", alignItems: "center", justifyContent: "center" }
        case "form": return { ...flow, position: phone ? "static" : "relative", width: "100%", maxWidth: phone ? "100%" : 32.5 * r, height: "auto", display: "flex", flexDirection: "column", gap: (phone ? 3.75 : 4) * r, paddingBottom: phone ? 16 : 0 }
        case "title": return { ...flow, position: phone ? "static" : "relative", width: "100%", height: "auto", display: "flex", flexDirection: "column", alignItems: phone ? "flex-start" : "center", gap: 2 * r, textAlign: phone ? "left" : "center" }
        case "badge": return { ...(phone ? { position: "absolute", left: padding, top: 20, zIndex: 5 } : flow), width: 8.3125 * r, height: 1.5625 * r, overflow: s.phase === "open" ? "visible" : "clip" }
        case "badge-art": return { ...flow, width: "100%", height: "100%", transform: active ? "translateY(0%)" : "translateY(150%)" }
        case "headlines": return { ...flow, width: "100%", height: "auto", display: "flex", flexDirection: "column", alignItems: phone ? "flex-start" : "center" }
        case "title-mask": return { ...flow, width: "100%", height: titleSize * titleLine * r, fontSize: titleSize * r, clipPath: "inset(0 0 -0.3em 0)", overflow: "visible" }
        case "title-first": case "title-second": return { ...flow, ...text, width: "100%", height: "100%", fontFamily: '"Flecha M",Georgia,serif', fontSize: titleSize * r, lineHeight: titleLine, letterSpacing: "-.02em", textAlign: phone ? "left" : "center", whiteSpace: "pre", transform: active ? "translateY(0%)" : "translateY(150%)" }
        case "subtitle-mask": return { ...flow, width: "100%", height: 1.5 * r, marginTop: (phone ? 1 : 1.25) * r, overflow: "clip" }
        case "subtitle": return { ...flow, ...text, width: "100%", height: "100%", textAlign: phone ? "left" : "center", transform: active ? "translateY(0%)" : "translateY(150%)" }
        case "fields": return { ...flow, width: "100%", height: "auto", display: "grid", gridTemplateColumns: phone ? "1fr" : "1fr 1fr", columnGap: 1.25 * r, rowGap: 1.75 * r }
        case "field-mask": case "wide-field-mask": return { ...flow, width: "100%", height: "auto", overflow: s.phase === "open" ? "visible" : "clip", gridColumn: role === "wide-field-mask" ? "1 / -1" : "auto" }
        case "name": case "email": case "message": return { ...flow, width: "100%", height: "auto", display: "flex", flexDirection: "column", gap: .75 * r, paddingBottom: .75 * r, gridColumn: role === "message" ? "1 / -1" : "auto", transform: active ? "translateY(0%)" : "translateY(150%)", overflow: "hidden" }
        case "label": return { ...flow, ...text, width: "100%", height: phone ? 15 : .9375 * r, fontSize: phone ? 10 : .625 * r, lineHeight: 1.5, textTransform: "uppercase" }
        case "input": case "textarea": return { ...flow, ...text, width: "100%", height: (role === "textarea" ? 3.8125 : 1.25) * r, minHeight: (role === "textarea" ? 3.8125 : 1.25) * r, lineHeight: 1.44, letterSpacing: ".02em", padding: 0, border: 0, borderRadius: 0, background: "transparent", outlineOffset: 3, resize: "none" }
        case "rule": return { position: "absolute", bottom: 0, left: 0, width: "100%", height: 1, background: "#fff", opacity: .2 }
        case "send": return { ...flow, width: "100%", minHeight: 6.25 * r, height: 6.25 * r, gridColumn: "1 / -1", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-start", gap: 1.25 * r, padding: `${.75 * r}px ${.75 * r}px ${r}px ${1.125 * r}px`, background: "#c5f0f7", color: "#262933", cursor: "pointer", overflow: "clip", transform: active ? "translateY(0%)" : "translateY(150%)" }
        case "send-label": return { ...flow, ...text, width: "auto", height: 1.5 * r, color: "#262933" }
        // The source action glyphs are two editable, unrotated strokes. Their
        // boxes scale in rem; their line thickness remains one CSS pixel.
        case "send-icon": return { ...flow, width: 1.15 * r, height: 1.25 * r, marginLeft: "auto", marginBottom: "auto", color: "#262933" }
        case "close-icon": return { ...flow, width: 1.25 * r, height: 1.25 * r, color: "#c5f0f7" }
        case "action-line-horizontal": return { position: "absolute", left: 0, top: "50%", width: "100%", height: 1, background: "currentColor", transform: "translateY(-50%)", transformOrigin: "100%" }
        case "action-line-vertical": return { position: "absolute", right: 0, top: 0, width: 1, height: "100%", background: "currentColor" }
        case "model-pane": return { ...flow, order: phone ? -1 : 0, width: phone ? "100%" : 35 * r, height: phone ? "50dvh" : "100%", padding: phone ? "48px 16px" : padding, display: "flex", alignItems: "center", justifyContent: "center" }
        case "model-clip": return { ...flow, width: phone ? "90%" : "100%", maxWidth: phone ? "none" : 26.25 * r, height: phone ? "90%" : "auto", aspectRatio: phone ? "auto" : "2 / 3", overflow: "clip", display: "flex", alignItems: "center", justifyContent: "center", transform: active ? "translateY(0%)" : "translateY(100%)", opacity: active ? 1 : 0 }
        case "graphic": return { ...flow, width: "100%", height: phone ? "50dvh" : "100%", minHeight: phone ? "50dvh" : "70dvh", flexShrink: 0 }
        case "close": return { position: "absolute", right: padding, top: phone ? 20 : padding, width: 5 * r, height: 1.5 * r, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transform: active ? "translateX(0px)" : `translateX(${3 * r}px)`, opacity: active ? 1 : 0 }
        case "close-label": return { ...flow, ...text, width: "auto", height: 1.5 * r }
        case "divider": return { position: "absolute", top: 0, right: 0, width: 1, height: "100%", background: "#fff", opacity: .2, display: phone ? "none" : "block", transformOrigin: "50% 0%", transform: active ? "scaleY(1)" : "scaleY(0)" }
    }
}
function MechaContactPrivate_role(Component: ComponentType<MechaContactPrivate_Props>, name: MechaContactPrivate_Role): ComponentType<MechaContactPrivate_Props> {
    return React.forwardRef<HTMLElement, MechaContactPrivate_Props>((props, ref) => {
        const s = React.useContext(MechaContactPrivate_Context), [node, attach] = MechaContactPrivate_useNode(name === "close" || name === "wrap" ? name : null, ref)
        const close = s.phase === "closing", contentPhase = React.useRef(s.phase)
        if (!close) contentPhase.current = s.phase
        const mask = name === "badge" || name === "field-mask" || name === "wide-field-mask"
        const own = MechaContactPrivate_styleFor(name, close && mask ? { ...s, phase: contentPhase.current } : s), motion: MechaContactPrivate_Motion = {}
        let duration = 0, delay = 0, ease = MechaContactPrivate_EASE
        if (name === "background" || name === "wrap") { motion.transform = String(own.transform); duration = 900; delay = name === "background" ? 150 : 0 }
        if (name === "fader") { motion.opacity = Number(own.opacity); duration = 400; delay = 0; ease = MechaContactPrivate_FADE }
        if (name === "model-clip") { motion.transform = String(own.transform); motion.opacity = Number(own.opacity); duration = 900; delay = 250 }
        if (["title-first", "title-second", "subtitle"].includes(name)) { motion.transform = String(own.transform); duration = 1000; delay = name === "title-first" ? 610 : name === "title-second" ? 690 : 770 }
        if (["badge-art", "name", "email", "message", "send", "close", "divider"].includes(name)) { if (own.transform) motion.transform = String(own.transform); if (own.opacity !== undefined) motion.opacity = Number(own.opacity); duration = 1000; delay = 950 }
        // Closing keeps the content fixed inside the translating source wrap;
        // its fader waits.72s before its.4s fade. No new renderer is involved.
        const animationState = close && !["background", "wrap", "fader"].includes(name) ? { ...s, phase: contentPhase.current } : s
        MechaContactPrivate_useMotion(node, animationState, motion, duration, delay, ease, name === "fader" ? 720 : 0)
        return <Component {...props} ref={attach} data-mecha-contact-role={name} data-mecha-contact-text={!s.frozen && ["title-first", "title-second", "subtitle", "label", "send-label", "close-label"].includes(name) ? "" : undefined} data-mecha-contact-field={!s.frozen && (name === "input" || name === "textarea") ? "" : undefined}
            {...(name === "overlay" ? { id: s.id, role: "dialog", "aria-modal": s.phase !== "closed" || undefined, "aria-label": "MECHA / Contact", "aria-hidden": s.phase === "closed" } : {})}
            style={s.frozen ? props.style : { ...props.style, ...own }} />
    })
}
export function withMechaContactRoot(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return withMechaTomorrowDetailRoot(MechaContactPrivate_contactProvider(Component)) }
export function withMechaContactTrigger(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> {
    return React.forwardRef<HTMLElement, MechaContactPrivate_Props>((props, ref) => {
        const s = React.useContext(MechaContactPrivate_Context), activate = MechaContactPrivate_useActivation(s.show, s.frozen)
        return <Component {...props} ref={ref} role="button" tabIndex={props.tabIndex ?? 0} aria-controls={s.id} aria-expanded={s.phase !== "closed"}
            onClick={(event: React.MouseEvent<HTMLElement>) => { props.onClick?.(event); activate("click", event) }} onTap={(event: MechaContactPrivate_Event, info?: unknown) => { props.onTap?.(event, info); activate("tap", event) }}
            onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => { props.onKeyDown?.(event); if (event.key === "Enter" || event.key === " ") activate("key", event) }} />
    })
}
export function withMechaContactClose(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> {
    const Layer = MechaContactPrivate_role(Component, "close")
    return React.forwardRef<HTMLElement, MechaContactPrivate_Props>((props, ref) => {
        const s = React.useContext(MechaContactPrivate_Context), activate = MechaContactPrivate_useActivation(() => s.hide(), s.frozen)
        return <Layer {...props} ref={ref} role="button" tabIndex={0} aria-label="Close contact"
            onClick={(event: React.MouseEvent<HTMLElement>) => { props.onClick?.(event); activate("click", event) }} onTap={(event: MechaContactPrivate_Event, info?: unknown) => { props.onTap?.(event, info); activate("tap", event) }}
            onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => { props.onKeyDown?.(event); if (event.key === "Enter" || event.key === " ") activate("key", event) }} />
    })
}
function MechaContactPrivate_pushed(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> {
    return React.forwardRef<HTMLElement, MechaContactPrivate_Props>((props, ref) => {
        const s = React.useContext(MechaContactPrivate_Context), [node, attach] = MechaContactPrivate_useNode(null, ref), active = s.phase === "opening" || s.phase === "open"
        const transform = [props.style?.transform, `translateY(${active ? -200 : 0}px)`].filter(Boolean).join(" ")
        MechaContactPrivate_useMotion(node, s, { transform }, 1200, 0)
        return <Component {...props} ref={attach} style={s.frozen ? props.style : { ...props.style, transform }} />
    })
}
export function withMechaContactPage(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return withMechaTomorrowDetailBackground(MechaContactPrivate_pushed(Component)) }
export function withMechaContactOverlay(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "overlay") }
export function withMechaContactBackground(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "background") }
export function withMechaContactFader(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "fader") }
export function withMechaContactWrap(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "wrap") }
export function withMechaContactFormPane(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "form-pane") }
export function withMechaContactForm(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "form") }
export function withMechaContactTitle(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "title") }
export function withMechaContactBadge(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "badge") }
export function withMechaContactBadgeArt(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "badge-art") }
export function withMechaContactHeadlines(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "headlines") }
export function withMechaContactTitleMask(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "title-mask") }
export function withMechaContactTitleFirst(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "title-first") }
export function withMechaContactTitleSecond(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "title-second") }
export function withMechaContactSubtitleMask(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "subtitle-mask") }
export function withMechaContactSubtitle(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "subtitle") }
export function withMechaContactFields(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "fields") }
export function withMechaContactFieldMask(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "field-mask") }
export function withMechaContactWideFieldMask(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "wide-field-mask") }
export function withMechaContactName(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "name") }
export function withMechaContactEmail(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "email") }
export function withMechaContactMessage(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "message") }
export function withMechaContactInput(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "input") }
export function withMechaContactMessageInput(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "textarea") }
export function withMechaContactFieldLabel(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "label") }
export function withMechaContactRule(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "rule") }
export function withMechaContactSend(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> {
    const Layer = MechaContactPrivate_role(Component, "send")
    return React.forwardRef<HTMLElement, MechaContactPrivate_Props>((props, ref) => <Layer {...props} ref={ref} role="button" tabIndex={0} onClick={(event: React.MouseEvent<HTMLElement>) => { props.onClick?.(event); event.preventDefault() }} onTap={(event: MechaContactPrivate_Event, info?: unknown) => { props.onTap?.(event, info); event.preventDefault?.() }} />)
}
export function withMechaContactSendLabel(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "send-label") }
export function withMechaContactModelPane(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "model-pane") }
export function withMechaContactModelClip(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "model-clip") }
export function withMechaContactGraphic(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "graphic") }
export function withMechaContactCloseLabel(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "close-label") }
export function withMechaContactDivider(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "divider") }
export function withMechaContactSendIcon(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "send-icon") }
export function withMechaContactCloseIcon(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "close-icon") }
export function withMechaContactActionLineHorizontal(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "action-line-horizontal") }
export function withMechaContactActionLineVertical(Component: ComponentType<MechaContactPrivate_Props>): ComponentType<MechaContactPrivate_Props> { return MechaContactPrivate_role(Component, "action-line-vertical") }


// Manual same-module Framer package: Phone navigation append; old 47 bodies above are byte-exact.
/**
 * SOURCE INSPIRATION / HERO-015 / MECHA / Widelab, Grzegorz Leśniewicz.
 * Bounded source Phone full-screen navigation recreation, from retained primary
 * HTML/CSS/JS and captures031/032. Native Frames/RTEs remain the editable artwork.
 * Observed: opening; Teams closes and source hash#teams arrives at documenty1962.
 * Code-supported only: Close hitbox, Escape, hover and source<=991 admission.
 * Unknown: actual Close point-hit, focus, touch scroll, resize/reversal outcomes.
 * Project accessibility fits: semantic button/landmark, ARIA and closed-link inertness;
 * reduced/hidden/offscreen/static/ref-replacement cleanup. No focus trap/scroll lock.
 * Source hrefs remain in metadata. Teams/Contact hand off to the selected original
 * site because their local destinations are out of scope; the tab navigation is
 * an explicit prototype difference, and local y1962 arrival is not claimed.
 */
type MechaPhoneNav_Event = {
    defaultPrevented?: boolean
    currentTarget?: EventTarget | null
    key?: string
    repeat?: boolean
    preventDefault?: () => void
}
type MechaPhoneNav_Props = {
    [key: string]: unknown
    children?: React.ReactNode
    style?: React.CSSProperties
    tabIndex?: number
    onClick?: React.MouseEventHandler<HTMLElement>
    onTap?: (event: MechaPhoneNav_Event, info?: unknown) => void
    onKeyDown?: React.KeyboardEventHandler<HTMLElement>
}
type MechaPhoneNav_State = {
    frozen: boolean
    enabled: boolean
    active: boolean
    reduced: boolean
    rem: number
    id: string
    toggle: () => void
    close: () => void
}
const MechaPhoneNav_Context = React.createContext<MechaPhoneNav_State>({
    frozen: true, enabled: false, active: false, reduced: false, rem: 16,
    id: "", toggle: () => {}, close: () => {},
})
const MechaPhoneNav_CLIP_CLOSED = "polygon(0% 0%,100% 0%,100% 0%,0% 0%)"
const MechaPhoneNav_CLIP_OPEN = "polygon(0% 0%,100% 0%,100% 100%,0% 100%)"
const MechaPhoneNav_CLIP_EASE = "cubic-bezier(.9,0,.1,1)"
const MechaPhoneNav_LINK_EASE = "cubic-bezier(.7,0,.3,1)"
const MechaPhoneNav_OPEN_DELAYS = [.3, .35, .4, .45] as const
const MechaPhoneNav_CLOSE_DELAYS = [.2, .15, .1, .05] as const
const MechaPhoneNav_CSS = `
[data-mecha-phone-menu] [data-mecha-phone-nav-text] p,
[data-mecha-phone-menu] [data-mecha-phone-nav-text] span{
 font-family:inherit!important;font-size:inherit!important;font-weight:inherit!important;
 line-height:inherit!important;letter-spacing:inherit!important;color:inherit!important;margin:0!important;
}
[data-mecha-phone-menu] [data-mecha-phone-nav-role="cell"],
[data-mecha-phone-menu] [data-mecha-phone-nav-role="join-cell"]{
 transition:opacity .5s cubic-bezier(.7,0,.3,1);
}
[data-mecha-phone-menu] [data-mecha-phone-nav-role="grid"]:has([data-mecha-phone-nav-role="cell"]:hover) > *,
[data-mecha-phone-menu] [data-mecha-phone-nav-role="grid"]:has([data-mecha-phone-nav-role="join-cell"]:hover) > *{opacity:.15!important}
[data-mecha-phone-menu] [data-mecha-phone-nav-role="grid"] > [data-mecha-phone-nav-role]:hover{opacity:1!important}
[data-mecha-phone-menu] [data-mecha-phone-nav-role="link-text"]{
 transition:transform .5s cubic-bezier(.7,0,.3,1);transform:translateY(0%) rotate(.001deg)!important;
}
[data-mecha-phone-menu] [data-mecha-phone-nav-link]:hover [data-mecha-phone-nav-role="link-text"]{
 transform:translateY(-100%) rotate(.001deg)!important;
}
[data-mecha-phone-menu] [data-mecha-phone-nav-role="toggle"]:hover [data-mecha-phone-nav-role="hamb-top"]{transform:translate(0,-.25em) scale(.5,1) rotate(.001deg)!important}
[data-mecha-phone-menu] [data-mecha-phone-nav-role="toggle"]:hover [data-mecha-phone-nav-role="hamb-bottom"]{transform:translate(0,.25em) scale(.5,1) rotate(.001deg)!important}
[data-mecha-phone-menu][data-navigation-status="active"] [data-mecha-phone-nav-role="toggle"]:hover [data-mecha-phone-nav-role="hamb-top"]{transform:translate(0,0) rotate(45deg) scale(.7,1)!important}
[data-mecha-phone-menu][data-navigation-status="active"] [data-mecha-phone-nav-role="toggle"]:hover [data-mecha-phone-nav-role="hamb-bottom"]{transform:translate(0,0) rotate(-45deg) scale(.7,1)!important}
[data-mecha-phone-menu][data-mecha-phone-nav-reduced="true"] *,
[data-mecha-phone-menu][data-mecha-phone-nav-enabled="false"] *{transition:none!important}
`
function MechaPhoneNav_writeRef(ref: React.ForwardedRef<HTMLElement>, node: HTMLElement | null) {
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
}
function MechaPhoneNav_sourceRem(width: number) {
    // The live (uncommented) primary HTML root-size rule, including its small widths.
    const span = width <= 320 ? [1, 320, 4, 12] : width <= 375 ? [320, 375, 12, 16]
        : width <= 479 ? [375, 479, 16, 18] : width <= 767 ? [479, 767, 16, 18]
        : width <= 991 ? [767, 991, 16, 18] : [991, 1440, 11, 16]
    return span[2] + (width - span[0]) / (span[1] - span[0]) * (span[3] - span[2])
}
function MechaPhoneNav_provider(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> {
    return React.forwardRef<HTMLElement, MechaPhoneNav_Props>((props, ref) => {
        const target = RenderTarget.current(), staticRenderer = useIsStaticRenderer()
        const frozen = staticRenderer || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail
        const [host, setHost] = React.useState<HTMLElement | null>(null)
        const [open, setOpen] = React.useState(false)
        const [environment, setEnvironment] = React.useState({ phone: false, visible: false, onscreen: false, reduced: false, rem: 16 })
        const id = "mecha-phone-nav-" + React.useId().replace(/[^\w-]/g, "_")
        const attach = React.useCallback((node: HTMLElement | null) => {
            setHost(node); MechaPhoneNav_writeRef(ref, node)
        }, [ref])
        React.useLayoutEffect(() => {
            setOpen(false)
            if (!host || frozen) return
            let disposed = false, onscreen = true
            const narrow = window.matchMedia("(max-width: 991px)")
            const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
            const read = () => {
                if (disposed) return
                const visible = document.visibilityState !== "hidden", phone = narrow.matches
                setEnvironment({ phone, visible, onscreen, reduced: motion.matches, rem: MechaPhoneNav_sourceRem(window.innerWidth) })
                if (!phone || !visible || !onscreen) setOpen(false)
            }
            const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(entries => {
                const entry = entries.find(value => value.target === host)
                if (entry) { onscreen = entry.isIntersecting; read() }
            })
            read(); observer?.observe(host)
            narrow.addEventListener("change", read); motion.addEventListener("change", read)
            window.addEventListener("resize", read); document.addEventListener("visibilitychange", read)
            return () => {
                disposed = true; observer?.disconnect()
                narrow.removeEventListener("change", read); motion.removeEventListener("change", read)
                window.removeEventListener("resize", read); document.removeEventListener("visibilitychange", read)
            }
        }, [host, frozen])
        const enabled = !!host && !frozen && environment.phone && environment.visible && environment.onscreen
        const active = enabled && open
        React.useEffect(() => {
            if (!active) return
            // Literal source initializer supports Escape; actual source input remains unobserved.
            const key = (event: KeyboardEvent) => { if (!event.defaultPrevented && event.key === "Escape") setOpen(false) }
            document.addEventListener("keydown", key)
            return () => document.removeEventListener("keydown", key)
        }, [active])
        const state: MechaPhoneNav_State = {
            frozen, enabled, active, reduced: environment.reduced, rem: environment.rem, id,
            toggle: () => { if (enabled) setOpen(value => !value) }, close: () => setOpen(false),
        }
        return <MechaPhoneNav_Context.Provider value={state}>
            <Component {...props} ref={attach}>{!frozen && <style>{MechaPhoneNav_CSS}</style>}{props.children}</Component>
        </MechaPhoneNav_Context.Provider>
    })
}
/** Replace ONLY the current root binding; this calls the old public composition once. */
export function withMechaPhoneNavigationRoot(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> {
    return withMechaContactRoot(MechaPhoneNav_provider(Component))
}
function MechaPhoneNav_useGesture() {
    const previous = React.useRef<{ channel: string; at: number; cancelled: boolean } | null>(null)
    return (channel: "tap" | "click" | "key", event: MechaPhoneNav_Event, consume: boolean, allowed = true) => {
        if (event.repeat) return false
        const at = typeof performance === "undefined" ? Date.now() : performance.now(), prior = previous.current
        if (prior && prior.channel !== channel && at - prior.at < 350) {
            // Semantic links retain one real click default after accepted Framer tap.
            // Cancelled gestures and consumed button gestures cancel both channels.
            if (consume || prior.cancelled) event.preventDefault?.()
            return false
        }
        previous.current = { channel, at, cancelled: !!event.defaultPrevented || !allowed }
        if (!allowed) { event.preventDefault?.(); return false }
        if (event.defaultPrevented) return false
        if (consume) event.preventDefault?.()
        return true
    }
}
type MechaPhoneNav_Role = "overlay" | "tile" | "bar" | "header-rule" | "toggle" | "hamb-top" | "hamb-middle" | "hamb-bottom"
    | "badge" | "close-visual" | "close-label" | "close-icon" | "horizontal" | "vertical" | "grid" | "cell" | "link-text"
    | "join-cell" | "join" | "join-label" | "join-icon"
function MechaPhoneNav_style(role: MechaPhoneNav_Role, s: MechaPhoneNav_State, rightCell = false): React.CSSProperties {
    const base: React.CSSProperties = { boxSizing: "border-box", minWidth: 0, minHeight: 0, left: "auto", top: "auto", right: "auto", bottom: "auto", margin: 0, padding: 0, transform: "none", scale: "none", rotate: "none", translate: "none" }
    const text: React.CSSProperties = { color: "#262933", fontSize: s.rem, fontWeight: 400, lineHeight: 1.44, letterSpacing: ".02em" }
    const transition = s.enabled && !s.reduced
    switch (role) {
        case "overlay": return { ...base, position: "fixed", inset: 0, width: "100vw", height: "100dvh", zIndex: 100, pointerEvents: "none", display: s.enabled ? "block" : "none" }
        case "tile": return { ...base, position: "absolute", inset: 0, width: "100%", height: "100%", padding: 16, opacity: 1, background: "#d3dbde", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", pointerEvents: "auto", clipPath: s.active ? MechaPhoneNav_CLIP_OPEN : MechaPhoneNav_CLIP_CLOSED, transition: transition ? `clip-path 1s ${MechaPhoneNav_CLIP_EASE}` : "none" }
        case "bar": return { ...base, position: "absolute", top: 0, left: 0, width: "100%", maxWidth: "100vw", padding: "20px 16px 16px", height: 61, display: "flex", justifyContent: "space-between", zIndex: 1, pointerEvents: "none", overflow: "clip" }
        case "header-rule": return { ...base, position: "absolute", left: 16, right: 16, bottom: 0, width: "auto", height: 1, background: "#00000026", pointerEvents: "none" }
        case "toggle": return { ...base, position: "relative", width: s.active ? 5 * s.rem : 24, height: 25, marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "center", overflow: "clip", border: "1px solid #262933", background: "transparent", padding: 0, borderRadius: 0, color: "#262933", cursor: "pointer", pointerEvents: "auto", opacity: s.active ? 0 : 1 }
        case "hamb-top": case "hamb-middle": case "hamb-bottom": {
            const transform = role === "hamb-top" ? s.active ? "translateY(0em) rotate(45deg)" : "translateY(-.25em) rotate(.001deg)"
                : role === "hamb-bottom" ? s.active ? "translateY(0em) rotate(-45deg)" : "translateY(.25em) rotate(.001deg)"
                : s.active ? "translateX(-150%) rotate(.001deg)" : "translateX(0%) rotate(.001deg)"
            return { ...base, position: "absolute", width: 12, height: 1, background: "currentColor", transform, transition: transition ? `transform .5s ${MechaPhoneNav_LINK_EASE}` : "none", pointerEvents: "none", fontSize: s.rem }
        }
        case "badge": return { ...base, position: "absolute", right: 46, width: 24, height: 25, marginLeft: -6, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", border: "1px solid #262933", borderRadius: "100%", color: "#262933", opacity: s.active ? 0 : 1, pointerEvents: "none" }
        case "close-visual": return { ...base, ...text, position: "absolute", right: 16, width: 5 * s.rem, height: 1.5 * s.rem, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: s.active ? 1 : 0, pointerEvents: "none", overflow: "clip" }
        case "close-label": return { ...base, ...text, position: "relative", width: "auto", height: "auto", pointerEvents: "none" }
        case "close-icon": return { ...base, position: "relative", width: 1.25 * s.rem, height: 1.25 * s.rem, marginLeft: "auto", color: "#262933", display: "flex", alignItems: "center", justifyContent: "flex-end", pointerEvents: "none" }
        case "horizontal": return { ...base, position: "absolute", width: "100%", height: 1, background: "currentColor", transformOrigin: "100%", pointerEvents: "none" }
        case "vertical": return { ...base, position: "absolute", width: 1, height: "100%", background: "currentColor", pointerEvents: "none" }
        case "grid": return { ...base, position: "relative", width: "100%", height: "auto", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gridTemplateRows: "auto", columnGap: 0, rowGap: 16, margin: 0, padding: 0, listStyle: "none" }
        case "cell": return { ...base, ...text, position: "relative", width: "100%", height: "auto", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", margin: 0, padding: 0, border: "1px solid #b3babd", borderTop: "none", borderLeft: rightCell ? "none" : "1px solid #b3babd" }
        case "link-text": return { ...base, ...text, position: "relative", width: "auto", height: "auto", display: "block", overflow: "hidden", textShadow: "0 1.1em 0", pointerEvents: "none" }
        case "join-cell": return { ...base, position: "relative", gridColumn: "span 2", width: "100%", height: "auto", display: "flex", margin: 0, padding: 0, overflow: "hidden", border: "1px solid #b3babd", borderTop: "none" }
        case "join": return { ...base, position: "relative", width: "100%", height: 6.25 * s.rem, minWidth: 0, background: "#911a46", color: "#fff", padding: `${s.rem}px ${.75 * s.rem}px ${s.rem}px ${1.125 * s.rem}px`, display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", gap: 1.25 * s.rem, cursor: "pointer", textDecoration: "none", pointerEvents: s.active ? "auto" : "none" }
        case "join-label": return { ...base, ...text, position: "relative", color: "#fff", width: "auto", height: "auto", pointerEvents: "none" }
        case "join-icon": return { ...base, position: "relative", width: 1.25 * s.rem, height: 1.5 * s.rem, marginLeft: "auto", top: -.25 * s.rem, right: -1, color: "#fff", display: "flex", justifyContent: "flex-end", alignItems: "center", pointerEvents: "none" }
    }
}
function MechaPhoneNav_role(Component: ComponentType<MechaPhoneNav_Props>, role: MechaPhoneNav_Role, rightCell = false): ComponentType<MechaPhoneNav_Props> {
    return React.forwardRef<HTMLElement, MechaPhoneNav_Props>((props, ref) => {
        const s = React.useContext(MechaPhoneNav_Context)
        if (s.frozen) return <Component {...props} ref={ref} />
        const text = ["close-label", "link-text", "join-label"].includes(role)
        return <Component {...props} ref={ref} data-mecha-phone-nav-role={role} data-mecha-phone-nav-text={text ? "" : undefined}
            {...(role === "overlay" ? { id: s.id, "data-mecha-phone-menu": "", "data-navigation-status": s.active ? "active" : "not-active", "data-mecha-phone-nav-enabled": String(s.enabled), "data-mecha-phone-nav-reduced": String(s.reduced), role: "navigation", "aria-label": "MECHA mobile navigation" } : {})}
            {...(role === "tile" ? { inert: !s.active ? "" : undefined, "aria-hidden": !s.active } : {})}
            {...(["badge", "header-rule", "hamb-top", "hamb-middle", "hamb-bottom", "close-visual", "close-icon", "join-icon", "horizontal", "vertical"].includes(role) ? { "aria-hidden": true } : {})}
            style={{ ...props.style, ...MechaPhoneNav_style(role, s, rightCell) }} />
    })
}
export function withMechaPhoneNavOverlay(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "overlay") }
export function withMechaPhoneNavTile(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "tile") }
export function withMechaPhoneNavBar(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "bar") }
export function withMechaPhoneNavHeaderRule(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "header-rule") }
export function withMechaPhoneNavToggle(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> {
    const Layer = MechaPhoneNav_role(Component, "toggle")
    return React.forwardRef<HTMLElement, MechaPhoneNav_Props>((props, ref) => {
        const s = React.useContext(MechaPhoneNav_Context), gesture = MechaPhoneNav_useGesture()
        const activate = (channel: "tap" | "click" | "key", event: MechaPhoneNav_Event) => {
            if (!s.enabled) { if (!s.frozen) event.preventDefault?.(); return }
            if (gesture(channel, event, true)) s.toggle()
        }
        return <Layer {...props} ref={ref} role="button" tabIndex={s.frozen ? props.tabIndex : s.enabled ? props.tabIndex ?? 0 : -1}
            aria-label={s.active ? "Close menu" : "Open menu"} aria-expanded={s.active} aria-controls={s.id}
            onTap={(event, info) => { props.onTap?.(event, info); activate("tap", event) }}
            onClick={event => { props.onClick?.(event); activate("click", event) }}
            onKeyDown={event => { props.onKeyDown?.(event); if (event.key === "Enter" || event.key === " ") activate("key", event) }} />
    })
}
export function withMechaPhoneNavHamburgerTop(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "hamb-top") }
export function withMechaPhoneNavHamburgerMiddle(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "hamb-middle") }
export function withMechaPhoneNavHamburgerBottom(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "hamb-bottom") }
export function withMechaPhoneNavBadge(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "badge") }
export function withMechaPhoneNavCloseVisual(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "close-visual") }
export function withMechaPhoneNavCloseLabel(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "close-label") }
export function withMechaPhoneNavCloseIcon(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "close-icon") }
export function withMechaPhoneNavActionHorizontal(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "horizontal") }
export function withMechaPhoneNavActionVertical(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "vertical") }
export function withMechaPhoneNavGrid(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "grid") }
export function withMechaPhoneNavLeftCell(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "cell") }
export function withMechaPhoneNavRightCell(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "cell", true) }
export function withMechaPhoneNavLinkText(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "link-text") }
function MechaPhoneNav_link(Component: ComponentType<MechaPhoneNav_Props>, index: 0 | 1 | 2 | 3, sourceHref: string, prototypeHref = sourceHref): ComponentType<MechaPhoneNav_Props> {
    return React.forwardRef<HTMLElement, MechaPhoneNav_Props>((props, ref) => {
        const s = React.useContext(MechaPhoneNav_Context), gesture = MechaPhoneNav_useGesture()
        const accept = (channel: "tap" | "click", event: MechaPhoneNav_Event) => {
            // The source acts on click. A Framer tap only records caller cancellation;
            // closing/inerting on pointerup can swallow the following anchor click.
            gesture(channel, event, false, s.active)
            if (channel === "click" && s.active && !event.defaultPrevented) s.close()
        }
        if (s.frozen) return <Component {...props} ref={ref} />
        return <Component {...props} ref={ref} href={prototypeHref} target="_self" role="link" data-mecha-phone-nav-link={index + 1} data-mecha-phone-nav-source-href={sourceHref} data-mecha-phone-nav-handoff={prototypeHref === sourceHref ? undefined : "selected-original-site"}
            tabIndex={s.active ? props.tabIndex ?? 0 : -1} style={{ ...props.style, boxSizing: "border-box", position: "relative", left: "auto", top: "auto", right: "auto", bottom: "auto", margin: 0, scale: "none", rotate: "none", translate: "none", width: "100%", height: "auto", color: "#262933", fontSize: s.rem, fontWeight: 400, lineHeight: 1.44, letterSpacing: ".02em", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", padding: "12px 18px 15px", textDecoration: "none", transform: s.active ? "translateY(0%) rotate(.001deg)" : "translateY(100%) rotate(5deg)", transition: s.enabled && !s.reduced ? `transform .75s ${MechaPhoneNav_LINK_EASE}` : "none", transitionDelay: s.enabled && !s.reduced ? `${s.active ? MechaPhoneNav_OPEN_DELAYS[index] : MechaPhoneNav_CLOSE_DELAYS[index]}s` : "0s" }}
            onTap={(event, info) => { props.onTap?.(event, info); accept("tap", event) }}
            onClick={event => { props.onClick?.(event); accept("click", event) }} />
    })
}
export function withMechaPhoneNavInvestmentsLink(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_link(Component, 0, "#investments") }
export function withMechaPhoneNavTeamsLink(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_link(Component, 1, "#teams", "https://mecha-xyz.webflow.io/#teams") }
export function withMechaPhoneNavContactLink(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_link(Component, 2, "#contact", "https://mecha-xyz.webflow.io/#contact") }
export function withMechaPhoneNavBlogLink(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_link(Component, 3, "#") }
export function withMechaPhoneNavJoinCell(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "join-cell") }
export function withMechaPhoneNavJoin(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> {
    // Public existing Contact trigger; no second Contact provider/store/controller.
    const Trigger = withMechaContactTrigger(MechaPhoneNav_role(Component, "join"))
    return React.forwardRef<HTMLElement, MechaPhoneNav_Props>((props, ref) => {
        const s = React.useContext(MechaPhoneNav_Context), gesture = MechaPhoneNav_useGesture()
        const gate = (channel: "tap" | "click" | "key", event: MechaPhoneNav_Event) => {
            // Do not consume an accepted event before the existing Contact trigger.
            // Cancellation still follows the physical gesture across Framer channels.
            if (gesture(channel, event, false, s.active)) s.close()
        }
        if (s.frozen) return <Component {...props} ref={ref} />
        return <Trigger {...props} ref={ref} href="#" data-mecha-phone-nav-source-href="#" data-mecha-phone-nav-open-modal="" tabIndex={s.active ? props.tabIndex ?? 0 : -1}
            onTap={(event, info) => { props.onTap?.(event, info); gate("tap", event) }}
            onClick={event => { props.onClick?.(event); gate("click", event) }}
            onKeyDown={event => { props.onKeyDown?.(event); if ((event.key === "Enter" || event.key === " ") && !event.repeat) gate("key", event) }} />
    })
}
export function withMechaPhoneNavJoinLabel(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "join-label") }
export function withMechaPhoneNavJoinIcon(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> { return MechaPhoneNav_role(Component, "join-icon") }
/** Optional existing PHONE row binding after exact Native preimage; preserve its children/IDs. */
export function withMechaPhoneNavLegacyRow(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> {
    return React.forwardRef<HTMLElement, MechaPhoneNav_Props>((props, ref) => {
        const s = React.useContext(MechaPhoneNav_Context)
        return <Component {...props} ref={ref} style={s.frozen ? props.style : s.enabled ? { ...props.style, display: "none" } : { ...props.style, opacity: 1 }} />
    })
}
/** Optional existing genuine PHONE wordmark Frame binding; never bind its SVG child. */
export function withMechaPhoneNavRetainedWordmark(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> {
    return React.forwardRef<HTMLElement, MechaPhoneNav_Props>((props, ref) => {
        const s = React.useContext(MechaPhoneNav_Context)
        return <Component {...props} ref={ref} style={s.frozen || !s.enabled ? props.style : { ...props.style, position: "fixed", left: 16, top: 16, width: 120.125, height: 26.46875, zIndex: 101 }} />
    })
}
/** New empty alias Frame inside existing Investments target; retain old #mecha-tomorrow. */
export function withMechaPhoneNavInvestmentsAlias(Component: ComponentType<MechaPhoneNav_Props>): ComponentType<MechaPhoneNav_Props> {
    return React.forwardRef<HTMLElement, MechaPhoneNav_Props>((props, ref) => <Component {...props} ref={ref} id="investments" aria-hidden="true" />)
}
