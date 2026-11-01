import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"

/**
 * Source inspiration / HERO-007 — Cantor8, website by Artemii Lebedev.
 * Independent native-layer implementation of the retained current CSS states:
 * fine-pointer Desktop arrows exchange along a 24px diagonal over 620ms;
 * header arrows keep scale1, while the larger CTA exchanges scale1/.85.
 * The two navigation backings use source rgba(0,0,0,71/255) and 7px blur.
 * Current CSS facts do not establish selected-archive hover equivalence.
 * Keep original arrow parts native and add a separate hidden incoming copy.
 * No artwork, source behavior JS, renderer, font or media is imported here.
 * Phone/coarse input, Canvas/export/thumbnail and reduced motion stay still.
 */
type CantorNativeEvent = { defaultPrevented?: boolean; currentTarget?: HTMLElement; relatedTarget?: EventTarget | null }
type CantorNativeProps = {
    [key: string]: unknown
    style?: React.CSSProperties
    onMouseEnter?: (event: CantorNativeEvent) => void
    onMouseLeave?: (event: CantorNativeEvent) => void
    onPointerEnter?: (event: CantorNativeEvent) => void
    onPointerLeave?: (event: CantorNativeEvent) => void
    onHoverStart?: (event: CantorNativeEvent, info?: unknown) => void
    onHoverEnd?: (event: CantorNativeEvent, info?: unknown) => void
    onFocus?: (event: CantorNativeEvent) => void
    onBlur?: (event: CantorNativeEvent) => void
}
type CantorArrowState = { kind: "header" | "cta"; active: boolean; enabled: boolean }
type CantorBackdropStyle = React.CSSProperties & { backdropFilter?: string; WebkitBackdropFilter?: string }
const CantorArrowContext = React.createContext<CantorArrowState>({ kind: "header", active: false, enabled: false })
const CANTOR_FINE_POINTER = "(min-width: 992px) and (hover: hover) and (pointer: fine)"
const CANTOR_ARROW_EASING = "cubic-bezier(0.22,1,0.36,1)"
function writeCantorNativeRef<T>(ref: React.ForwardedRef<T>, node: T | null) {
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
}
function useCantorArrowEnabled() {
    const target = RenderTarget.current()
    const frozen = useIsStaticRenderer() || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail
    const [mode, setMode] = React.useState({ fine: false, reduced: false })
    React.useEffect(() => {
        if (frozen) return
        const fine = matchMedia(CANTOR_FINE_POINTER), reduced = matchMedia("(prefers-reduced-motion: reduce)")
        const read = () => setMode({ fine: fine.matches, reduced: reduced.matches })
        read(); fine.addEventListener("change", read); reduced.addEventListener("change", read)
        return () => { fine.removeEventListener("change", read); reduced.removeEventListener("change", read) }
    }, [frozen])
    return !frozen && mode.fine && !mode.reduced
}
function cantorArrowButton(Component: ComponentType<CantorNativeProps>, kind: "header" | "cta"): ComponentType<CantorNativeProps> {
    return React.forwardRef<HTMLElement, CantorNativeProps>((props, ref) => {
        const enabled = useCantorArrowEnabled(), own = React.useRef<HTMLElement | null>(null)
        const [hovered, setHovered] = React.useState(false), [focused, setFocused] = React.useState(false)
        const last = React.useRef<{ kind: boolean; channel: string; at: number } | null>(null)
        React.useEffect(() => { if (!enabled) { setHovered(false); setFocused(false) } }, [enabled])
        const hover = (value: boolean, channel: string, event: CantorNativeEvent) => {
            if (!enabled) return
            const now = performance.now(), prior = last.current
            if (prior && prior.kind === value && prior.channel !== channel && now - prior.at < 350) return
            last.current = { kind: value, channel, at: now }
            if (!event.defaultPrevented) setHovered(value)
        }
        const active = enabled && (hovered || focused)
        return <CantorArrowContext.Provider value={{ kind, active, enabled }}><Component {...props}
            ref={(node: HTMLElement | null) => { own.current = node; writeCantorNativeRef(ref, node) }}
            data-cantor-arrow-button={kind} data-cantor-arrow-active={active} data-cantor-arrow-enabled={enabled}
            onMouseEnter={(event: CantorNativeEvent) => { props.onMouseEnter?.(event); hover(true, "mouse", event) }}
            onMouseLeave={(event: CantorNativeEvent) => { props.onMouseLeave?.(event); hover(false, "mouse", event) }}
            onPointerEnter={(event: CantorNativeEvent) => { props.onPointerEnter?.(event); hover(true, "pointer", event) }}
            onPointerLeave={(event: CantorNativeEvent) => { props.onPointerLeave?.(event); hover(false, "pointer", event) }}
            onHoverStart={(event: CantorNativeEvent, info?: unknown) => { props.onHoverStart?.(event, info); hover(true, "hover", event) }}
            onHoverEnd={(event: CantorNativeEvent, info?: unknown) => { props.onHoverEnd?.(event, info); hover(false, "hover", event) }}
            onFocus={(event: CantorNativeEvent) => { props.onFocus?.(event); if (enabled && !event.defaultPrevented) setFocused(!!own.current?.matches(":focus-visible")) }}
            onBlur={(event: CantorNativeEvent) => { props.onBlur?.(event); if (!event.defaultPrevented) setFocused(false) }}
        /></CantorArrowContext.Provider>
    })
}
export function withCantorHeaderArrowButton(Component: ComponentType<CantorNativeProps>): ComponentType<CantorNativeProps> { return cantorArrowButton(Component, "header") }
export function withCantorCTAArrowButton(Component: ComponentType<CantorNativeProps>): ComponentType<CantorNativeProps> { return cantorArrowButton(Component, "cta") }
function cantorArrowPart(Component: ComponentType<CantorNativeProps>, incoming: boolean): ComponentType<CantorNativeProps> {
    return React.forwardRef<HTMLElement, CantorNativeProps>((props, ref) => {
        const state = React.useContext(CantorArrowContext)
        const distance = incoming ? state.active ? 0 : -24 : state.active ? 24 : 0
        const scale = state.kind === "cta" && (incoming ? !state.active : state.active) ? .85 : 1
        const original = props.style?.transform && props.style.transform !== "none" ? props.style.transform + " " : ""
        const transition = state.enabled ? `${props.style?.transition ? props.style.transition + ", " : ""}transform 620ms ${CANTOR_ARROW_EASING}, opacity 620ms ${CANTOR_ARROW_EASING}` : "none"
        return <Component {...props} ref={ref} data-cantor-arrow-part={incoming ? "incoming" : "outgoing"}
            style={{ ...props.style, transform: `${original}translate(${distance}px,${-distance}px) scale(${scale})`, transformOrigin: "50% 50%", opacity: incoming ? state.active ? 1 : 0 : state.active ? 0 : 1, zIndex: incoming ? 1 : 2, transition, pointerEvents: "none" }} />
    })
}
export function withCantorArrowOutgoing(Component: ComponentType<CantorNativeProps>): ComponentType<CantorNativeProps> { return cantorArrowPart(Component, false) }
export function withCantorArrowIncoming(Component: ComponentType<CantorNativeProps>): ComponentType<CantorNativeProps> { return cantorArrowPart(Component, true) }
export function withCantorBlurredNavigation(Component: ComponentType<CantorNativeProps>): ComponentType<CantorNativeProps> {
    return React.forwardRef<HTMLElement, CantorNativeProps>((props, ref) => <Component {...props} ref={ref} data-cantor-navigation-blur="7"
        style={{ ...props.style, backgroundColor: "rgba(0,0,0,0.2784313725490196)", backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)" } as CantorBackdropStyle} />)
}
