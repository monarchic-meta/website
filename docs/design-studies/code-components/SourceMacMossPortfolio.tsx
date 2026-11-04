import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"

/**
 * SOURCE INSPIRATION / HERO-006 — Mac Moss Studio.
 * Independent public native-layer controls for the inspected Idaho slideshow
 * and clock. Source DOM declares four images, manual arrows, autoplay:false,
 * slide duration0.5s and constrained height. Wrap/wait-for-animation follow the
 * source's bundled defaults but were not visually audited. Desktop source easing is ease-in-out.
 * No source behavior JavaScript is imported. Four native image-filled Frames
 * remain editable under one clipped Viewport; no image is fetched by this code.
 *
 * Attach Portfolio to their common parent; Photo01…04 source order is Idaho
 * 0005,0008,0007,0006. Next/Previous are native click/keyboard controls. Initial
 * Canvas/export is Photo01, no motion. Reduced motion changes slides instantly.
 * Desktop photo clicks and horizontal mouse tracking are source observed.
 * Source code/runtime use rounded horizontal distance, width/5 admission and
 * >10 logical pixels to suppress the following photo click. Observed8% returns,
 * 48% advances, and reverse drag returns to the preceding photo. Existing native
 * photos stay editable; both drag release and return start at their live pose.
 * Current390px coarse-touch source tap/swipe and Desktop10/11px returns are
 * observed. Mouseleave is normal release; source commits before outside mouseup.
 * Source gallery pan-y permits vertical page scrolling without a slide; the
 * live viewport adds pinch-zoom as an explicit adaptation. Cancel/lost-capture
 * safe return, sub10px details and the one-viewport clamp remain bounded fits.
 * Input/state observations do not certify full source-media paint or pixel identity.
 * Clock is native text HH:mm:ss, once per second while visible; it uses the
 * viewer's local timezone, an explicit adaptation because source timezone is
 * unresolved. Static clock20:18:07 is the retained source poster, not Idaho time.
 */

type NativeActivationEvent = { defaultPrevented?: boolean; preventDefault?: () => void; stopPropagation?: () => void; target?: EventTarget | null; currentTarget?: EventTarget | null; pointerType?: string; isPrimary?: boolean }
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

type NativePointerEvent = NativeActivationEvent & { currentTarget: HTMLElement; clientX: number; clientY: number; pointerId: number; pointerType: string; button: number; buttons: number; isPrimary?: boolean }
type Pose = { selected: number; other: number; exit: number }
type MouseDrag = { id: number; host: HTMLElement; startU: number; startV: number; startX: number; startY: number; startLeft: number; startTop: number; startWidth: number; startHeight: number; index: number; fraction: number; distance: number; logicalWidth: number; horizontal: boolean; direction: 1 | -1; hasPose: boolean; pendingPhoto: boolean }
// Unknown native targets are not admitted. This only walks the event's own
// native subtree; it does not search the document or replace editable children.
function photoTarget(event: NativeActivationEvent, host: HTMLElement | null): boolean | null {
    if (!host || typeof Node === "undefined" || !(event.target instanceof Node)) return null
    if (!host.contains(event.target)) return false
    let node = event.target instanceof Element ? event.target : event.target.parentElement
    for (; node && node !== host; node = node.parentElement) if (node.matches('a,button,input,textarea,select,summary,[role="button"],[role="link"],[contenteditable]:not([contenteditable="false"])')) return false
    return true
}
function pointerMetrics(event: NativePointerEvent, drag: MouseDrag) {
    const rect = drag.host.getBoundingClientRect(), width = drag.host.clientWidth, height = drag.host.clientHeight
    if (!(rect.width > 0 && rect.height > 0 && width > 0 && height > 0)) return null
    // Client coordinates and transformed bounds are screen CSS pixels. Threshold
    // rounding is in the native viewport's logical CSS pixels, as in Slick.
    const anchorX = rect.left === drag.startLeft && rect.width === drag.startWidth ? drag.startX : rect.left + drag.startU * rect.width
    const anchorY = rect.top === drag.startTop && rect.height === drag.startHeight ? drag.startY : rect.top + drag.startV * rect.height
    const dx = (event.clientX - anchorX) * (width / rect.width)
    const dy = (event.clientY - anchorY) * (height / rect.height)
    const distance = Math.round(Math.abs(dx)), angle = Math.abs(Math.round(Math.atan2(dy, dx) * 180 / Math.PI))
    return { distance, logicalWidth: width, horizontal: angle <= 45 || angle >= 135, direction: (dx === 0 ? drag.direction : dx < 0 ? 1 : -1) as 1 | -1, fraction: Math.max(-1, Math.min(1, Math.sign(dx) * distance / width)) }
}
type LayerProps = { [key: string]: unknown; style?: React.CSSProperties; onClick?: React.MouseEventHandler<HTMLElement>; onTap?: (event: NativeActivationEvent, info?: unknown) => void; onKeyDown?: React.KeyboardEventHandler<HTMLElement>; onPointerDown?: (event: NativePointerEvent) => void; onPointerMove?: (event: NativePointerEvent) => void; onPointerUp?: (event: NativePointerEvent) => void; onPointerCancel?: (event: NativePointerEvent) => void; onPointerLeave?: (event: NativePointerEvent) => void; onLostPointerCapture?: (event: NativePointerEvent) => void; onDragStart?: (event: NativeActivationEvent) => void }
type Slide = { index: number; from: number | null; direction: 1 | -1; phase: "settled" | "prepared" | "moving" | "dragging"; pose?: Pose }
type PortfolioState = { slide: Slide; frozen: boolean; reduced: boolean; clock: string; step: (direction: 1 | -1) => void; photoNext: () => void; startPointer: (event: NativePointerEvent) => void; movePointer: (event: NativePointerEvent) => void; finishPointer: (event: NativePointerEvent, cancelled?: boolean) => void; preventNativeDrag: (event: NativeActivationEvent) => void }
const INITIAL: Slide = { index: 0, from: null, direction: 1, phase: "settled" }
const DEFAULT: PortfolioState = { slide: INITIAL, frozen: true, reduced: false, clock: "20:18:07", step() {}, photoNext() {}, startPointer() {}, movePointer() {}, finishPointer() {}, preventNativeDrag() {} }
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
        const drag = React.useRef<MouseDrag | null>(null), blockPhoto = React.useRef(false)
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
        // The original arrow step, clock and lifecycle above are unchanged.
        // Lifecycle transitions still use their existing settling path; poses
        // are ignored when settled, and this cleanup invalidates late input.
        React.useEffect(() => () => { if (drag.current) { drag.current = null; blockPhoto.current = true } }, [frozen, reduced, visible, hidden])
        function runPose(index: number, from: number, direction: 1 | -1, pose: Pose) {
            if (frozen || reduced || hidden || !visible) { busy.current = false; commit(frozen ? INITIAL : { index, from: null, direction, phase: "settled" }); return }
            busy.current = true
            const prepared: Slide = { index, from, direction, phase: "prepared", pose }
            commit(prepared)
            frame.current = requestAnimationFrame(() => {
                frame.current = 0
                commit({ ...prepared, phase: "moving" })
                timer.current = setTimeout(() => { timer.current = null; busy.current = false; commit({ index, from: null, direction, phase: "settled" }) }, 500)
            })
        }
        function photoNext() {
            if (frozen) return
            const active = drag.current
            if (active) { if (active.distance <= 10) active.pendingPhoto = true; return }
            if (!blockPhoto.current) step(1)
        }
        function startPointer(event: NativePointerEvent) {
            if (event.pointerType !== "mouse" && event.pointerType !== "touch") {
                // Other pointer photo activation is an adaptation, not dragging.
                // A fresh safe pointerdown retires only an older pointer receipt.
                if (photoTarget(event, event.currentTarget) === true) {
                    if (event.defaultPrevented) blockPhoto.current = true
                    else if (!frozen && !busy.current) blockPhoto.current = false
                }
                return
            }
            if (event.button !== 0 || event.isPrimary === false || (event.pointerType === "touch" && event.isPrimary !== true) || drag.current) return
            const host = event.currentTarget
            if (photoTarget(event, host) !== true) return
            if (event.defaultPrevented) { blockPhoto.current = true; return }
            if (frozen || busy.current || hidden || !visible) return
            const rect = host.getBoundingClientRect()
            if (!(rect.width > 0 && rect.height > 0 && host.clientWidth > 0 && host.clientHeight > 0)) return
            drag.current = { id: event.pointerId, host, startU: (event.clientX - rect.left) / rect.width, startV: (event.clientY - rect.top) / rect.height, startX: event.clientX, startY: event.clientY, startLeft: rect.left, startTop: rect.top, startWidth: rect.width, startHeight: rect.height, index: liveSlide.current.index, fraction: 0, distance: 0, logicalWidth: host.clientWidth, horizontal: false, direction: 1, hasPose: false, pendingPhoto: false }
            busy.current = true
        }
        function movePointer(event: NativePointerEvent) {
            const active = drag.current
            if (!active || active.id !== event.pointerId) return
            if (event.defaultPrevented || event.buttons === 0) { finishPointer(event, true); return }
            const metrics = pointerMetrics(event, active)
            if (!metrics) { finishPointer(event, true); return }
            active.distance = metrics.distance; active.logicalWidth = metrics.logicalWidth; active.horizontal = metrics.horizontal
            if (!metrics.horizontal || (!metrics.distance && !active.hasPose)) return
            active.fraction = metrics.fraction; active.direction = metrics.direction; active.hasPose = true
            if (metrics.distance > 4) event.preventDefault?.()
            const from = (active.index + active.direction + 4) % 4
            commit({ index: active.index, from, direction: active.direction, phase: "dragging", pose: { selected: active.fraction, other: active.fraction + active.direction, exit: active.direction } })
        }
        function finishPointer(event: NativePointerEvent, cancelled = false) {
            const active = drag.current
            if (!active || active.id !== event.pointerId) return
            drag.current = null
            const cancel = cancelled || !!event.defaultPrevented
            blockPhoto.current = cancel || active.distance > 10
            const pose = liveSlide.current.pose
            if (!active.hasPose || !pose) {
                busy.current = false
                if (!cancel && active.pendingPhoto && !blockPhoto.current) step(1)
                return
            }
            const neighbor = (active.index + active.direction + 4) % 4
            if (!cancel && active.horizontal && active.distance >= active.logicalWidth / 5) {
                runPose(neighbor, active.index, active.direction, { selected: pose.other, other: pose.selected, exit: -active.direction })
            } else {
                // Cancel/lost-capture handling is an independent safe return.
                // Returns at10/11px are observed; sub10px source ordering stays open.
                runPose(active.index, neighbor, active.direction, { selected: pose.selected, other: pose.other, exit: active.direction })
            }
        }
        function preventNativeDrag(event: NativeActivationEvent) { if (drag.current && !event.defaultPrevented) event.preventDefault?.() }
        const state: PortfolioState = { slide: frozen ? INITIAL : slide, frozen, reduced, clock: frozen ? "20:18:07" : clock, step, photoNext, startPointer, movePointer, finishPointer, preventNativeDrag }
        return <Context.Provider value={state}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; writeRef(ref, node) }}
            data-source-mac-slide={state.slide.index + 1} data-source-mac-phase={state.slide.phase} data-source-mac-clock={state.clock}
        /></Context.Provider>
    })
}
export function withMacMossIdahoViewport(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = React.useContext(Context)
        return <Component {...props} ref={ref} style={{ ...props.style, overflow: "hidden", ...(state.frozen ? {} : { touchAction: "pan-y pinch-zoom" }) }}
            onPointerDown={(event: NativePointerEvent) => { props.onPointerDown?.(event); state.startPointer(event) }}
            onPointerMove={(event: NativePointerEvent) => { props.onPointerMove?.(event); state.movePointer(event) }}
            onPointerUp={(event: NativePointerEvent) => { props.onPointerUp?.(event); state.finishPointer(event) }}
            onPointerCancel={(event: NativePointerEvent) => { props.onPointerCancel?.(event); state.finishPointer(event, true) }}
            onPointerLeave={(event: NativePointerEvent) => { props.onPointerLeave?.(event); state.finishPointer(event) }}
            onLostPointerCapture={(event: NativePointerEvent) => { props.onLostPointerCapture?.(event); state.finishPointer(event, true) }}
            onDragStart={(event: NativeActivationEvent) => { props.onDragStart?.(event); state.preventNativeDrag(event) }} />
    })
}
function photo(Component: ComponentType<LayerProps>, index: number): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = React.useContext(Context), slide = state.slide, selected = index === slide.index, outgoing = index === slide.from
        const ownPhoto = React.useRef<HTMLElement | null>(null)
        const bind = React.useCallback((node: HTMLElement | null) => { ownPhoto.current = node; writeRef(ref, node) }, [ref])
        const activate = useNativeActivation(() => state.photoNext(), state.frozen)
        const activatePhoto = (channel: "tap" | "click", event: NativeActivationEvent) => {
            if (event.isPrimary === false) return
            const target = photoTarget(event, ownPhoto.current)
            // An opaque native onTap cannot establish that a child was safe.
            // A later DOM click with a real target may still supply that proof;
            // explicit caller cancellation is consumed across both channels.
            if (target === null && !event.defaultPrevented) return
            activate(channel, !!event.defaultPrevented || target !== true || !selected)
        }
        let offset = 0
        if (slide.pose && slide.phase !== "settled") {
            if (selected) offset = (slide.phase === "moving" ? 0 : slide.pose.selected) * 100
            else if (outgoing) offset = (slide.phase === "moving" ? slide.pose.exit : slide.pose.other) * 100
        } else if (selected && slide.phase === "prepared") offset = slide.direction * 100
        else if (outgoing && slide.phase === "moving") offset = -slide.direction * 100
        const visible = selected || outgoing
        return <Component {...props} ref={bind} data-source-mac-photo={index + 1} data-source-mac-selected={selected} aria-hidden={!visible}
            onTap={(event: NativeActivationEvent, info?: unknown) => { props.onTap?.(event, info); activatePhoto("tap", event) }}
            onClick={(event: React.MouseEvent<HTMLElement>) => { props.onClick?.(event); activatePhoto("click", event) }}
            style={{ ...props.style, opacity: visible ? 1 : 0, visibility: visible ? "visible" : "hidden", pointerEvents: selected ? props.style?.pointerEvents : "none", transform: `translateX(${offset}%)`, transition: !state.frozen && !state.reduced && slide.phase === "moving" ? "transform .5s ease-in-out" : "none" }} />
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
