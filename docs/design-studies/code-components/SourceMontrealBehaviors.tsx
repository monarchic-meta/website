import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"

/**
 * SOURCE INSPIRATION / HERO-008 — PP Neue Montreal, Pangram Pangram.
 * Independent public native overrides. Current public source supports the
 * 2.2s initial/1.8s repeated postcard face switch, eleven 4.8:1 attraction
 * panels with .75s easing, and eleven Display/seven Text weight selections.
 * The selected archive supplies composition; current-code facts do not prove
 * its historical input timing. Native images, type and fonts stay editable.
 * Phone uses the authored 74px headers/260px bodies as an explicit adaptation.
 * No source behavior JavaScript, font binaries or image bytes are embedded.
 * Register real native font selectors on the two separate specimen layers.
 * Reset native attraction-heading rotations to zero before attaching its HOC.
 */
type ActivationEvent = { defaultPrevented?: boolean }
type Props = {
    [key: string]: unknown
    style?: React.CSSProperties
    children?: React.ReactNode
    onTap?: (event: ActivationEvent, info?: unknown) => void
    onClick?: React.MouseEventHandler<HTMLElement>
    onKeyDown?: React.KeyboardEventHandler<HTMLElement>
}
type Native = ComponentType<Props>
type MotionStyle = React.CSSProperties & { rotate?: string }
function assignRef<T>(ref: React.ForwardedRef<T>, node: T | null) {
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
}
function useFrozen() {
    const target = RenderTarget.current()
    return useIsStaticRenderer() || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail
}
function useActivation(action: () => void, frozen: boolean) {
    const previous = React.useRef<{ channel: string; at: number } | null>(null)
    return (channel: string, canceled: boolean) => {
        const at = typeof performance === "undefined" ? Date.now() : performance.now(), prior = previous.current
        if (prior && prior.channel !== channel && at - prior.at < 350) return
        previous.current = { channel, at }
        if (!frozen && !canceled) action()
    }
}
function activationProps(props: Props, activate: ReturnType<typeof useActivation>, frozen: boolean) {
    return {
        onTap(event: ActivationEvent, info?: unknown) { props.onTap?.(event, info); activate("tap", !!event.defaultPrevented) },
        onClick(event: React.MouseEvent<HTMLElement>) { props.onClick?.(event); activate("click", event.defaultPrevented) },
        onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
            props.onKeyDown?.(event)
            if (!frozen && event.currentTarget.tagName !== "BUTTON" && (event.key === "Enter" || event.key === " ")) {
                const canceled = event.defaultPrevented
                event.preventDefault(); activate("key", canceled)
            }
        },
    }
}
type PlaybackStore = { paused: boolean; listeners: Set<() => void> }
// Owned per-window state shared with the separate self-contained motion HOCs.
// This contains no Framer/editor state or external service data.
const PLAYBACK_KEY = Symbol.for("monarchic.sourceMontreal.playback.v1")
const SERVER_PLAYBACK: PlaybackStore = { paused: false, listeners: new Set() }
function playbackStore(): PlaybackStore {
    if (typeof window === "undefined") return SERVER_PLAYBACK
    const host = window as unknown as Record<symbol, PlaybackStore | undefined>
    return host[PLAYBACK_KEY] ?? (host[PLAYBACK_KEY] = { paused: false, listeners: new Set() })
}
const subscribePause = (notify: () => void) => { const store = playbackStore(); store.listeners.add(notify); return () => { store.listeners.delete(notify) } }
const frozenSubscribe = (_notify: () => void) => () => {}
function usePaused(frozen: boolean) { return React.useSyncExternalStore(frozen ? frozenSubscribe : subscribePause, () => frozen || playbackStore().paused, () => true) }
function useLive(ref: React.RefObject<HTMLElement | null>, frozen: boolean) {
    const held = usePaused(frozen), [visible, setVisible] = React.useState(false), [reduced, setReduced] = React.useState(false), [hidden, setHidden] = React.useState(false)
    React.useEffect(() => {
        const node = ref.current
        if (!node || frozen) return
        const query = matchMedia("(prefers-reduced-motion: reduce)"), motion = () => setReduced(query.matches), visibility = () => setHidden(document.hidden)
        const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
        observer.observe(node); motion(); visibility()
        query.addEventListener("change", motion); document.addEventListener("visibilitychange", visibility)
        return () => { observer.disconnect(); query.removeEventListener("change", motion); document.removeEventListener("visibilitychange", visibility) }
    }, [frozen])
    return !frozen && !held && visible && !reduced && !hidden
}
export function withMontrealPlayback(Component: ComponentType<Props>): ComponentType<Props> {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const frozen = useFrozen(), held = usePaused(frozen), activate = useActivation(() => { const store = playbackStore(); store.paused = !store.paused; store.listeners.forEach(fn => fn()) }, frozen)
        return <Component {...props} {...activationProps(props, activate, frozen)} ref={ref} role="button" tabIndex={props.tabIndex ?? 0} aria-pressed={held} />
    }) as Native
}
export function withMontrealPlaybackLabel(Component: ComponentType<Props>): ComponentType<Props> {
    return React.forwardRef<HTMLElement, Props>((props, ref) => <Component {...props} ref={ref} text={usePaused(useFrozen()) ? "PLAY MOTION" : "PAUSE MOTION"} />) as Native
}
const Faces = React.createContext({ back: false })
export function withMontrealPostcards(Component: ComponentType<Props>): ComponentType<Props> {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const frozen = useFrozen(), own = React.useRef<HTMLElement | null>(null), live = useLive(own, frozen), elapsed = React.useRef(0), [back, setBack] = React.useState(false)
        React.useEffect(() => {
            if (!live) return
            const start = performance.now()
            let timer: ReturnType<typeof setTimeout>
            const tick = () => {
                const time = elapsed.current + performance.now() - start
                setBack(time >= 2200 && Math.floor((time - 2200) / 1800) % 2 === 0)
                const next = time < 2200 ? 2200 - time : 1800 - (time - 2200) % 1800
                timer = setTimeout(tick, Math.max(1, next))
            }
            tick()
            return () => { elapsed.current += performance.now() - start; clearTimeout(timer) }
        }, [live])
        return <Faces.Provider value={{ back: !frozen && back }}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; assignRef(ref, node) }} data-montreal-postcards={!frozen && back ? "back" : "front"} data-montreal-postcards-live={live} /></Faces.Provider>
    }) as Native
}
function face(Component: Native, back: boolean): Native {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const selected = React.useContext(Faces).back === back
        return <Component {...props} ref={ref} aria-hidden={!selected} style={{ ...props.style, opacity: selected ? 1 : 0, visibility: selected ? "visible" : "hidden", pointerEvents: selected ? props.style?.pointerEvents : "none" }} />
    }) as Native
}
export function withMontrealPostcardFront(Component: ComponentType<Props>): ComponentType<Props> { return face(Component, false) }
export function withMontrealPostcardBack(Component: ComponentType<Props>): ComponentType<Props> { return face(Component, true) }

type AttractionsState = { active: number; phone: boolean; width: number; frozen: boolean; reduced: boolean; select: (index: number) => void }
const Attractions = React.createContext<AttractionsState>({ active: 0, phone: false, width: 1440, frozen: true, reduced: false, select() {} })
export function withMontrealAttractions(Component: ComponentType<Props>): ComponentType<Props> {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const frozen = useFrozen(), own = React.useRef<HTMLElement | null>(null), [width, setWidth] = React.useState(1440), [chosen, setChosen] = React.useState(0), phone = width < 1024
        React.useLayoutEffect(() => {
            const node = own.current
            if (!node) return
            const measure = () => setWidth(node.clientWidth || 1440), observer = new ResizeObserver(measure)
            measure(); observer.observe(node); return () => observer.disconnect()
        }, [])
        React.useLayoutEffect(() => setChosen(phone ? -1 : 0), [phone])
        const [reduced, setReduced] = React.useState(false)
        React.useEffect(() => {
            if (frozen) return
            const query = matchMedia("(prefers-reduced-motion: reduce)"), update = () => setReduced(query.matches)
            update(); query.addEventListener("change", update); return () => query.removeEventListener("change", update)
        }, [frozen])
        const active = frozen ? phone ? -1 : 0 : chosen
        const state: AttractionsState = { active, phone, width, frozen, reduced, select: index => { if (!frozen) setChosen(previous => phone && previous === index ? -1 : index) } }
        const leave = (event: ActivationEvent, name: string, info?: unknown) => { const callback = props[name]; if (typeof callback === "function") callback(event, info); if (!frozen && !phone && !event.defaultPrevented) setChosen(0) }
        return <Attractions.Provider value={state}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; assignRef(ref, node) }} data-montreal-attractions={active} data-montreal-attractions-phone={phone} style={{ ...props.style, height: phone ? 1020 + (active >= 0 ? 260 : 0) : props.style?.height }} onMouseLeave={(event: ActivationEvent) => leave(event, "onMouseLeave")} onHoverEnd={(event: ActivationEvent, info?: unknown) => leave(event, "onHoverEnd", info)} /></Attractions.Provider>
    }) as Native
}
const Pane = React.createContext({ index: 0, selected: false })
function attraction(Component: Native, index: number): Native {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const state = React.useContext(Attractions), selected = state.active === index, activate = useActivation(() => state.select(index), state.frozen), unit = state.width / (state.active < 0 ? 11 : 14.8)
        const hover = (event: ActivationEvent, name: string, info?: unknown) => { const callback = props[name]; if (typeof callback === "function") callback(event, info); if (!state.frozen && !state.phone && !event.defaultPrevented) state.select(index) }
        return <Pane.Provider value={{ index, selected }}><Component {...props} {...activationProps(props, activate, state.frozen)} ref={ref} role="button" tabIndex={props.tabIndex ?? 0} aria-expanded={selected} data-montreal-attraction={index} style={{ ...props.style, position: "absolute", left: state.phone ? 0 : unit * (index + (state.active >= 0 && state.active < index ? 3.8 : 0)), top: state.phone ? 160 + index * 74 + (state.active >= 0 && state.active < index ? 260 : 0) : 210, width: state.phone ? state.width : unit * (selected ? 4.8 : 1), height: state.phone ? 74 + (selected ? 260 : 0) : 540, overflow: "hidden", transition: state.frozen || state.reduced ? "none" : "left .75s cubic-bezier(.65,0,.15,1), top .75s cubic-bezier(.65,0,.15,1), width .75s cubic-bezier(.65,0,.15,1), height .75s cubic-bezier(.65,0,.15,1)" }} onMouseEnter={(event: ActivationEvent) => hover(event, "onMouseEnter")} onHoverStart={(event: ActivationEvent, info?: unknown) => hover(event, "onHoverStart", info)} /></Pane.Provider>
    }) as Native
}
export function withMontrealAttraction01(Component: ComponentType<Props>): ComponentType<Props> { return attraction(Component, 0) }
export function withMontrealAttraction02(Component: ComponentType<Props>): ComponentType<Props> { return attraction(Component, 1) }
export function withMontrealAttraction03(Component: ComponentType<Props>): ComponentType<Props> { return attraction(Component, 2) }
export function withMontrealAttraction04(Component: ComponentType<Props>): ComponentType<Props> { return attraction(Component, 3) }
export function withMontrealAttraction05(Component: ComponentType<Props>): ComponentType<Props> { return attraction(Component, 4) }
export function withMontrealAttraction06(Component: ComponentType<Props>): ComponentType<Props> { return attraction(Component, 5) }
export function withMontrealAttraction07(Component: ComponentType<Props>): ComponentType<Props> { return attraction(Component, 6) }
export function withMontrealAttraction08(Component: ComponentType<Props>): ComponentType<Props> { return attraction(Component, 7) }
export function withMontrealAttraction09(Component: ComponentType<Props>): ComponentType<Props> { return attraction(Component, 8) }
export function withMontrealAttraction10(Component: ComponentType<Props>): ComponentType<Props> { return attraction(Component, 9) }
export function withMontrealAttraction11(Component: ComponentType<Props>): ComponentType<Props> { return attraction(Component, 10) }
export function withMontrealAttractionHeading(Component: ComponentType<Props>): ComponentType<Props> {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const state = React.useContext(Attractions), pane = React.useContext(Pane), active = state.phone || pane.selected
        return <Component {...props} ref={ref} style={{ ...props.style, left: state.phone ? 58 : pane.selected ? 100 : 62, top: state.phone ? 22 : pane.selected ? 40 : 132, rotate: active ? "0deg" : "90deg", transformOrigin: "0 0", pointerEvents: "none", transition: state.frozen || state.reduced ? "none" : "rotate .75s cubic-bezier(.65,0,.15,1), left .75s cubic-bezier(.65,0,.15,1), top .75s cubic-bezier(.65,0,.15,1)" } as MotionStyle} />
    }) as Native
}
export function withMontrealAttractionBody(Component: ComponentType<Props>): ComponentType<Props> {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const state = React.useContext(Attractions), pane = React.useContext(Pane)
        return <Component {...props} ref={ref} aria-hidden={!pane.selected} style={{ ...props.style, left: state.phone ? 58 : 125, top: state.phone ? 82 : 210, width: state.phone ? Math.max(1, state.width - 82) : Math.max(1, state.width * 4.8 / 14.8 - 149), opacity: pane.selected ? 1 : 0, pointerEvents: "none", transition: state.frozen || state.reduced ? "none" : "opacity .75s cubic-bezier(.65,0,.15,1)" }} />
    }) as Native
}

type Family = "display" | "text"
const DISPLAY = [100, 150, 250, 300, 350, 400, 500, 600, 700, 800, 900]
const TEXT = [250, 300, 350, 400, 500, 600, 700]
const DISPLAY_NAMES = ["Hairline", "Extralight", "Thin", "Light", "Book", "Regular", "Medium", "Semibold", "Bold", "Extrabold", "Black"]
const TEXT_NAMES = ["Thin", "Light", "Book", "Regular", "Medium", "Semibold", "Bold"]
type ChartState = { family: Family; weight: number; frozen: boolean; chooseFamily: (family: Family) => void; chooseWeight: (index: number) => void }
const Chart = React.createContext<ChartState>({ family: "display", weight: 900, frozen: true, chooseFamily() {}, chooseWeight() {} })
export function withMontrealChart(Component: ComponentType<Props>): ComponentType<Props> {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const frozen = useFrozen(), [state, setState] = React.useState<{ family: Family; weight: number }>({ family: "display", weight: 900 })
        const context: ChartState = { ...(frozen ? { family: "display" as Family, weight: 900 } : state), frozen,
            chooseFamily: family => { if (!frozen) setState(previous => { const weights = family === "display" ? DISPLAY : TEXT; return { family, weight: weights.reduce((best, value) => Math.abs(value - previous.weight) < Math.abs(best - previous.weight) ? value : best) } }) },
            chooseWeight: index => { if (!frozen) setState(previous => { const weights = previous.family === "display" ? DISPLAY : TEXT; return index < weights.length ? { ...previous, weight: weights[index] } : previous }) },
        }
        return <Chart.Provider value={context}><Component {...props} ref={ref} data-montreal-chart-family={context.family} data-montreal-chart-weight={context.weight} /></Chart.Provider>
    }) as Native
}
function chartMode(Component: Native, family: Family): Native {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const state = React.useContext(Chart), selected = state.family === family, activate = useActivation(() => state.chooseFamily(family), state.frozen)
        return <Component {...props} {...activationProps(props, activate, state.frozen)} ref={ref} role="button" tabIndex={props.tabIndex ?? 0} aria-pressed={selected} style={{ ...props.style, opacity: selected ? 1 : .5 }} />
    }) as Native
}
export function withMontrealDisplayMode(Component: ComponentType<Props>): ComponentType<Props> { return chartMode(Component, "display") }
export function withMontrealTextMode(Component: ComponentType<Props>): ComponentType<Props> { return chartMode(Component, "text") }
function chartWeight(Component: Native, index: number): Native {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const state = React.useContext(Chart), weights = state.family === "display" ? DISPLAY : TEXT, names = state.family === "display" ? DISPLAY_NAMES : TEXT_NAMES, exists = index < weights.length, activate = useActivation(() => state.chooseWeight(index), state.frozen)
        const hover = (event: ActivationEvent, name: string, info?: unknown) => { const callback = props[name]; if (typeof callback === "function") callback(event, info); if (exists && !state.frozen && !event.defaultPrevented) state.chooseWeight(index) }
        return <Component {...props} {...activationProps(props, activate, state.frozen)} ref={ref} text={names[index] ?? ""} role="button" tabIndex={exists ? props.tabIndex ?? 0 : -1} aria-pressed={exists && state.weight === weights[index]} aria-hidden={!exists} style={{ ...props.style, opacity: !exists ? 0 : state.weight === weights[index] ? 1 : .5, pointerEvents: exists ? props.style?.pointerEvents : "none" }} onMouseEnter={(event: ActivationEvent) => hover(event, "onMouseEnter")} onHoverStart={(event: ActivationEvent, info?: unknown) => hover(event, "onHoverStart", info)} />
    }) as Native
}
export function withMontrealWeight01(Component: ComponentType<Props>): ComponentType<Props> { return chartWeight(Component, 0) }
export function withMontrealWeight02(Component: ComponentType<Props>): ComponentType<Props> { return chartWeight(Component, 1) }
export function withMontrealWeight03(Component: ComponentType<Props>): ComponentType<Props> { return chartWeight(Component, 2) }
export function withMontrealWeight04(Component: ComponentType<Props>): ComponentType<Props> { return chartWeight(Component, 3) }
export function withMontrealWeight05(Component: ComponentType<Props>): ComponentType<Props> { return chartWeight(Component, 4) }
export function withMontrealWeight06(Component: ComponentType<Props>): ComponentType<Props> { return chartWeight(Component, 5) }
export function withMontrealWeight07(Component: ComponentType<Props>): ComponentType<Props> { return chartWeight(Component, 6) }
export function withMontrealWeight08(Component: ComponentType<Props>): ComponentType<Props> { return chartWeight(Component, 7) }
export function withMontrealWeight09(Component: ComponentType<Props>): ComponentType<Props> { return chartWeight(Component, 8) }
export function withMontrealWeight10(Component: ComponentType<Props>): ComponentType<Props> { return chartWeight(Component, 9) }
export function withMontrealWeight11(Component: ComponentType<Props>): ComponentType<Props> { return chartWeight(Component, 10) }
function specimen(Component: Native, family: Family): Native {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const state = React.useContext(Chart), id = React.useId().replace(/[^a-zA-Z0-9_-]/g, "_"), selected = state.family === family, selector = `[data-montreal-specimen="${id}"]`
        return <><Component {...props} ref={ref} data-montreal-specimen={id} data-montreal-specimen-family={family} aria-hidden={!selected} style={{ ...props.style, opacity: selected ? 1 : 0, visibility: selected ? "visible" : "hidden", pointerEvents: "none" }} /><style>{`${selector},${selector} *{font-variation-settings:"wght" ${state.weight}!important}`}</style></>
    }) as Native
}
export function withMontrealDisplaySpecimen(Component: ComponentType<Props>): ComponentType<Props> { return specimen(Component, "display") }
export function withMontrealTextSpecimen(Component: ComponentType<Props>): ComponentType<Props> { return specimen(Component, "text") }
