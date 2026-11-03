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
type Layer = ComponentType<LayerProps>
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
export function withMechaTomorrowDetailRoot(Component: Layer): Layer {
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
                const nodes = focusable(frame), first = nodes[0] ?? frame, last = nodes.at(-1) ?? frame
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
export function withMechaTomorrowMore(Component: Layer): Layer {
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
export function withMechaTomorrowDetailOverlay(Component: Layer): Layer {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = useDetail(), own = React.useRef<HTMLElement | null>(null), bind = useRefPair(state?.panel ?? own, ref)
        if (!state || state.frozen) return <Component {...props} ref={bind} />
        return <Component {...props} ref={bind} id={state.panelID} role="dialog" aria-modal={state.active || undefined} aria-label="Tomorrow Recycling / source project details" aria-hidden={!state.active} tabIndex={-1}
            style={{ ...props.style, position: "fixed", inset: 0, width: "100vw", height: "100dvh", zIndex: 1000, opacity: state.active ? 1 : 0, visibility: state.active ? "visible" : "hidden", pointerEvents: state.active ? "auto" : "none" }} />
    })
}

/** Apply to the white scrolling native sheet, not its content-height frame. */
export function withMechaTomorrowDetailSheet(Component: Layer): Layer {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = useDetail(), own = React.useRef<HTMLElement | null>(null), bind = useRefPair(own, ref)
        React.useLayoutEffect(() => { if (state?.phase === "opening" || state?.phase === "open" && state.reduced) { if (own.current) own.current.scrollTop = 0 } }, [state?.phase, state?.reduced])
        if (!state || state.frozen) return <Component {...props} ref={bind} />
        const animation = state.reduced ? "none" : state.phase === "opening" ? `mechaTomorrowSheetIn .9s ${MENU_EASE} .15s both` : state.phase === "closing" ? `mechaTomorrowSheetOut .9s ${MENU_EASE} both` : "none"
        return <Component {...props} ref={bind} data-mecha-detail-scroll="" style={{ ...props.style, position: "absolute", inset: 0, width: "100%", height: "100%", overflowY: "auto", overflowX: "hidden", overscrollBehaviorY: "contain", touchAction: "pan-y", background: "#ffffff", opacity: 1, translate: state.phase === "closed" ? "0 100%" : "0 0", animation } as React.CSSProperties} />
    })
}

export function withMechaTomorrowDetailFader(Component: Layer): Layer {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = useDetail()
        if (!state || state.frozen) return <Component {...props} ref={ref} />
        const animation = state.reduced ? "none" : state.phase === "opening" ? "mechaTomorrowFaderIn .4s ease-in-out both" : state.phase === "closing" ? "mechaTomorrowFaderOut .4s ease-in-out .72s both" : "none"
        return <Component {...props} ref={ref} aria-hidden="true" style={{ ...props.style, position: "absolute", inset: 0, opacity: state.active ? 1 : 0, animation }} />
    })
}

export function withMechaTomorrowDetailClose(Component: Layer): Layer {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = useDetail(), own = React.useRef<HTMLElement | null>(null), bind = useRefPair(state?.closeButton ?? own, ref), activate = useActivation(() => state?.hide(), !state || state.frozen)
        return <Component {...props} ref={bind} role="button" tabIndex={props.tabIndex ?? 0}
            onTap={(event: NativeEvent, info: unknown) => { props.onTap?.(event, info); activate("tap", event) }}
            onClick={(event: React.MouseEvent<HTMLElement>) => { props.onClick?.(event); activate("click", event) }}
            onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => { props.onKeyDown?.(event); if (event.key === "Enter" || event.key === " ") activate("key", event) }} />
    })
}

/** Bind existing background siblings; do not translate the overlay's ancestor. */
export function withMechaTomorrowDetailBackground(Component: Layer): Layer {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = useDetail()
        if (!state || state.frozen) return <Component {...props} ref={ref} />
        const animation = state.reduced ? "none" : state.phase === "opening" ? `mechaTomorrowPageUp 1.2s ${MENU_EASE} both` : state.phase === "closing" ? `mechaTomorrowPageBack 1.2s ${MENU_EASE} both` : "none"
        return <Component {...props} ref={ref} aria-hidden={state.active ? true : props["aria-hidden"]} style={{ ...props.style, translate: state.active ? "0 -200px" : props.style?.translate, animation }} />
    })
}
