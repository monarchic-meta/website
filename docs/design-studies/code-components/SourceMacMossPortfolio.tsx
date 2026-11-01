import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"

/**
 * SOURCE INSPIRATION / HERO-006 — Mac Moss Studio.
 * Independent public native-layer controls for the inspected Idaho slideshow
 * and clock. Source DOM declares four images, manual arrows, autoplay:false,
 * slide duration0.5s and constrained height. Wrap/wait-for-animation follow the
 * source's bundled defaults but were not visually audited; easing is fitted.
 * No source behavior JavaScript is imported. Four native image-filled Frames
 * remain editable under one clipped Viewport; no image is fetched by this code.
 *
 * Attach Portfolio to their common parent; Photo01…04 source order is Idaho
 * 0005,0008,0007,0006. Next/Previous are native click/keyboard controls. Initial
 * Canvas/export is Photo01, no motion. Reduced motion changes slides instantly.
 * Clock is native text HH:mm:ss, once per second while visible; it uses the
 * viewer's local timezone, an explicit adaptation because source timezone is
 * unresolved. Static clock20:18:07 is the retained source poster, not Idaho time.
 */

type NativeActivationEvent = { defaultPrevented?: boolean; preventDefault?: () => void; stopPropagation?: () => void }
type NativeActivationChannel = "tap" | "click" | "key"
// Framer native motion layers expose onTap; DOM fixtures can also emit click.
// Alternate channels within one gesture are consumed once, including a caller's
// cancellation. Repeated gestures through the same channel remain responsive.
function useNativeActivation(action: () => void, frozen = false) {
    const last = React.useRef<{ channel: NativeActivationChannel; at: number } | null>(null)
    return (channel: NativeActivationChannel, prevented: boolean) => {
        const at = typeof performance === "undefined" ? Date.now() : performance.now(), previous = last.current
        if (previous && channel !== previous.channel && at - previous.at < 350) return
        last.current = { channel, at }
        if (!frozen && !prevented) action()
    }
}

type LayerProps = { [key: string]: unknown; style?: React.CSSProperties; onClick?: React.MouseEventHandler<HTMLElement>; onTap?: (event: NativeActivationEvent, info?: unknown) => void; onKeyDown?: React.KeyboardEventHandler<HTMLElement> }
type Slide = { index: number; from: number | null; direction: 1 | -1; phase: "settled" | "prepared" | "moving" }
type PortfolioState = { slide: Slide; frozen: boolean; reduced: boolean; clock: string; step: (direction: 1 | -1) => void }
const INITIAL: Slide = { index: 0, from: null, direction: 1, phase: "settled" }
const DEFAULT: PortfolioState = { slide: INITIAL, frozen: true, reduced: false, clock: "20:18:07", step() {} }
const Context = React.createContext<PortfolioState>(DEFAULT)
function localClock(date: Date) { return [date.getHours(), date.getMinutes(), date.getSeconds()].map(value => String(value).padStart(2, "0")).join(":") }
function writeRef<T>(ref: React.ForwardedRef<T>, value: T | null) { if (typeof ref === "function") ref(value); else if (ref) ref.current = value }

export function withMacMossPortfolio(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const target = RenderTarget.current(), frozen = useIsStaticRenderer() || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail
        const own = React.useRef<HTMLElement | null>(null)
        const [slide, setSlide] = React.useState<Slide>(INITIAL), liveSlide = React.useRef(INITIAL)
        const [clock, setClock] = React.useState("20:18:07")
        const [visible, setVisible] = React.useState(false), [hidden, setHidden] = React.useState(false), [reduced, setReduced] = React.useState(false)
        const busy = React.useRef(false), frame = React.useRef(0), timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
        const commit = React.useCallback((next: Slide) => { liveSlide.current = next; setSlide(next) }, [])
        const stop = React.useCallback(() => { if (frame.current) cancelAnimationFrame(frame.current); if (timer.current !== null) clearTimeout(timer.current); frame.current = 0; timer.current = null; busy.current = false }, [])
        React.useEffect(() => {
            if (frozen || !own.current) return
            const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting)); observer.observe(own.current)
            const query = window.matchMedia("(prefers-reduced-motion: reduce)")
            const motion = () => setReduced(query.matches), visibility = () => setHidden(document.hidden)
            motion(); visibility(); query.addEventListener("change", motion); document.addEventListener("visibilitychange", visibility)
            return () => { observer.disconnect(); query.removeEventListener("change", motion); document.removeEventListener("visibilitychange", visibility) }
        }, [frozen])
        React.useEffect(() => {
            if (frozen || !visible || hidden) return
            const tick = () => setClock(localClock(new Date()))
            tick(); const id = setInterval(tick, 1000)
            return () => clearInterval(id)
        }, [frozen, visible, hidden])
        React.useEffect(() => {
            if (frozen || reduced || !visible || hidden) {
                stop()
                commit(frozen ? INITIAL : { ...liveSlide.current, from: null, phase: "settled" })
            }
            return stop
        }, [frozen, reduced, visible, hidden, stop, commit])
        const step = React.useCallback((direction: 1 | -1) => {
            if (frozen || busy.current) return
            const previous = liveSlide.current.index, index = (previous + direction + 4) % 4
            if (reduced || hidden || !visible) { commit({ index, from: null, direction, phase: "settled" }); return }
            busy.current = true
            commit({ index, from: previous, direction, phase: "prepared" })
            frame.current = requestAnimationFrame(() => {
                frame.current = 0
                commit({ index, from: previous, direction, phase: "moving" })
                timer.current = setTimeout(() => { timer.current = null; busy.current = false; commit({ index, from: null, direction, phase: "settled" }) }, 500)
            })
        }, [frozen, reduced, hidden, visible, commit])
        const state: PortfolioState = { slide: frozen ? INITIAL : slide, frozen, reduced, clock: frozen ? "20:18:07" : clock, step }
        return <Context.Provider value={state}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; writeRef(ref, node) }}
            data-source-mac-slide={state.slide.index + 1} data-source-mac-phase={state.slide.phase} data-source-mac-clock={state.clock}
        /></Context.Provider>
    })
}
export function withMacMossIdahoViewport(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => <Component {...props} ref={ref} style={{ ...props.style, overflow: "hidden" }} />)
}
function photo(Component: ComponentType<LayerProps>, index: number): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = React.useContext(Context), slide = state.slide, selected = index === slide.index, outgoing = index === slide.from
        let offset = 0
        if (selected && slide.phase === "prepared") offset = slide.direction * 100
        else if (outgoing && slide.phase === "moving") offset = -slide.direction * 100
        const visible = selected || outgoing
        return <Component {...props} ref={ref} data-source-mac-photo={index + 1} data-source-mac-selected={selected} aria-hidden={!visible}
            style={{ ...props.style, opacity: visible ? 1 : 0, visibility: visible ? "visible" : "hidden", pointerEvents: selected ? props.style?.pointerEvents : "none", transform: `translateX(${offset}%)`, transition: !state.frozen && !state.reduced && slide.phase === "moving" ? "transform .5s ease" : "none" }} />
    })
}
export function withMacMossIdahoPhoto01(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return photo(Component, 0) }
export function withMacMossIdahoPhoto02(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return photo(Component, 1) }
export function withMacMossIdahoPhoto03(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return photo(Component, 2) }
export function withMacMossIdahoPhoto04(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return photo(Component, 3) }
function arrow(Component: ComponentType<LayerProps>, direction: 1 | -1): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => { const state = React.useContext(Context), activate = useNativeActivation(() => state.step(direction), state.frozen); return <Component {...props} ref={ref}
        role={props.role ?? "button"} tabIndex={props.tabIndex ?? 0} aria-disabled={state.frozen || state.slide.phase !== "settled"}
        onTap={(event: NativeActivationEvent, info?: unknown) => { props.onTap?.(event, info); activate("tap", !!event.defaultPrevented) }}
        onClick={(event: React.MouseEvent<HTMLElement>) => { props.onClick?.(event); activate("click", !!event.defaultPrevented) }}
        onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => { props.onKeyDown?.(event); if (!state.frozen && !event.defaultPrevented && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); activate("key", false) } }} /> })
}
export function withMacMossIdahoNext(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return arrow(Component, 1) }
export function withMacMossIdahoPrevious(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return arrow(Component, -1) }
export function withMacMossClock(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => { const state = React.useContext(Context); return <Component {...props} ref={ref} text={state.clock} /> })
}
