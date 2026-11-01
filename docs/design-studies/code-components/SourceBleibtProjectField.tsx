import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"

/**
 * SOURCE INSPIRATION / HERO-017 — Maksym Bleibtgleich, bleibtgleich.dev.
 * Independent CSS 3D projection for sixteen editable, genuine source pictures.
 * The inspected public source uses a Fibonacci belt, radius1.85, plane width.4,
 * camera48deg, drift.003 per60Hz frame, breathing.1, dragcap.11 and pin3.2.
 * Those are current public-code facts, not measured archive timing. Source
 * code is not imported. CSS3D replaces Three/WebGL; hover/pin interpolation
 * and reveal ordering are fitted. Back-facing images retain a low.1 opacity.
 *
 * Attach withBleibtProjectField to an untransformed, square native Frame;
 * attach each numbered HOC to the matching native image Frame in source order.
 * Keep those sixteen native Frames at left/top0 with no native rotation.
 * Their image fills, credits and editor selections remain native/editable.
 * Native typography and the separate fluid/mark opening remain outside this
 * actor. Canvas/exports freeze; there is no Canvas bitmap or WebGL context.
 */

type NativeTapEvent = { defaultPrevented?: boolean }
type LayerProps = {
    [key: string]: unknown
    style?: React.CSSProperties
    onPointerDown?: React.PointerEventHandler<HTMLElement>
    onPointerMove?: React.PointerEventHandler<HTMLElement>
    onPointerUp?: React.PointerEventHandler<HTMLElement>
    onPointerCancel?: React.PointerEventHandler<HTMLElement>
    onPointerEnter?: React.PointerEventHandler<HTMLElement>
    onPointerLeave?: React.PointerEventHandler<HTMLElement>
    onClick?: React.MouseEventHandler<HTMLElement>
    onTap?: (event: NativeTapEvent, info?: unknown) => void
}
type Vec = readonly [number, number, number]
type State = {
    width: number; height: number; time: number; angle: number; frozen: boolean
    hovered: number; pinned: number; dragged: React.MutableRefObject<boolean>
    setHovered: (i: number) => void; setPinned: (i: number) => void
}
const DEFAULT: State = { width: 647, height: 647, time: 0, angle: 0, frozen: true, hovered: -1, pinned: -1, dragged: { current: false }, setHovered() {}, setPinned() {} }
const FieldContext = React.createContext<State>(DEFAULT)
const WorkTerminalContext = React.createContext(false)
const useOwnLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect
const ASPECT = [1011 / 680, 1011 / 680, 1, 1, 1011 / 680, 1, 1011 / 680, 1, 1011 / 680, 1011 / 680, 1011 / 680, 1011 / 680, 1011 / 680, 1011 / 1360, 1011 / 680, 1011 / 680]
const POINTS: Vec[] = Array.from({ length: 40 }, (_, i) => {
    const y = 1 - i / 39 * 2, radius = Math.sqrt(1 - y * y), phi = Math.PI * (3 - Math.sqrt(5)) * i
    return [Math.cos(phi) * radius, y, Math.sin(phi) * radius] as Vec
}).filter(v => Math.abs(v[1]) < .55).slice(0, 16)
const clamp = (x: number) => Math.max(0, Math.min(1, x))
function out(t: number) { return 1 - (1 - clamp(t)) ** 3 }
function normalize(v: Vec): Vec { const n = Math.hypot(...v) || 1; return [v[0] / n, v[1] / n, v[2] / n] }
function mergeRef<T>(ref: React.ForwardedRef<T>, node: T | null) { if (typeof ref === "function") ref(node); else if (ref) ref.current = node }

export function withBleibtProjectField(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const frozen = useIsStaticRenderer() || RenderTarget.current() === RenderTarget.canvas
        const own = React.useRef<HTMLElement | null>(null)
        const [size, setSize] = React.useState({ width: 647, height: 647 })
        const [visible, setVisible] = React.useState(false)
        const [reduced, setReduced] = React.useState(false)
        const [pose, setPose] = React.useState({ time: 0, angle: 0 })
        const [hovered, setHovered] = React.useState(-1)
        const [pinned, setPinned] = React.useState(-1)
        const hoveredRef = React.useRef(-1), pinnedRef = React.useRef(-1)
        hoveredRef.current = hovered; pinnedRef.current = pinned
        const dragged = React.useRef(false)
        const drag = React.useRef<{ id: number; start: number; last: number } | null>(null)
        const velocity = React.useRef(0), angle = React.useRef(0), elapsed = React.useRef(0), idle = React.useRef(2)

        useOwnLayoutEffect(() => {
            if (!own.current) return
            const node = own.current
            const measure = () => setSize({ width: node.clientWidth || 647, height: node.clientHeight || 647 })
            const ro = new ResizeObserver(measure); ro.observe(node); measure()
            return () => ro.disconnect()
        }, [])
        React.useEffect(() => {
            if (!own.current || frozen) return
            const node = own.current
            const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting)); io.observe(node)
            const query = window.matchMedia("(prefers-reduced-motion: reduce)")
            const motion = () => setReduced(query.matches); motion(); query.addEventListener("change", motion)
            const resetPin = () => setPinned(-1)
            window.addEventListener("scroll", resetPin, { passive: true, capture: true })
            return () => { io.disconnect(); query.removeEventListener("change", motion); window.removeEventListener("scroll", resetPin, true) }
        }, [frozen])
        React.useEffect(() => {
            if (frozen || reduced || !visible) return
            let frame = 0, previous = 0, published = 0
            const tick = (now: number) => {
                const dt = previous ? Math.min(.05, (now - previous) / 1000) : 0
                previous = now; elapsed.current += dt
                const held = !!drag.current || hoveredRef.current !== -1 || pinnedRef.current !== -1
                idle.current = held ? 0 : idle.current + dt
                velocity.current *= Math.pow(drag.current ? .9 : .94, dt * 60)
                angle.current += (velocity.current + (!held && idle.current > 1 ? .003 : 0)) * dt * 60
                if (now - published >= 1000 / 30) { published = now; setPose({ time: elapsed.current, angle: angle.current }) }
                frame = window.requestAnimationFrame(tick)
            }
            frame = window.requestAnimationFrame(tick)
            return () => window.cancelAnimationFrame(frame)
        }, [frozen, reduced, visible])
        const state: State = { ...size, ...pose, frozen: frozen || reduced, hovered, pinned, dragged, setHovered, setPinned }
        const halfFov = 24 * Math.PI / 180
        const perspective = size.height / (2 * Math.tan(halfFov))
        return <FieldContext.Provider value={state}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; mergeRef(ref, node) }}
            data-source-bleibt-field="native-css3d" data-source-field-time={pose.time} data-source-field-angle={pose.angle} data-source-field-pinned={pinned}
            style={{ ...props.style, position: "relative", perspective: `${perspective}px`, perspectiveOrigin: "50% 50%", overflow: "visible", touchAction: "pan-y", cursor: drag.current ? "grabbing" : hovered >= 0 ? "pointer" : "grab" }}
            onPointerDown={(e: React.PointerEvent<HTMLElement>) => {
                props.onPointerDown?.(e); if (frozen || reduced || e.defaultPrevented || e.button !== 0) return
                drag.current = { id: e.pointerId, start: e.clientX, last: e.clientX }; dragged.current = false; velocity.current = 0
                // Capture the actual pressed image, preserving its eventual
                // click target while the parent continues to receive bubbles.
                if (e.pointerType === "mouse" && e.target instanceof Element) e.target.setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e: React.PointerEvent<HTMLElement>) => {
                props.onPointerMove?.(e); const d = drag.current; if (!d || d.id !== e.pointerId || frozen || reduced) return
                const delta = e.clientX - d.last; d.last = e.clientX
                if (Math.abs(e.clientX - d.start) > 3) { dragged.current = true; setPinned(-1) }
                velocity.current = Math.max(-.11, Math.min(.11, velocity.current + delta * .013))
            }}
            onPointerUp={(e: React.PointerEvent<HTMLElement>) => { props.onPointerUp?.(e); drag.current = null; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId) }}
            onPointerCancel={(e: React.PointerEvent<HTMLElement>) => { props.onPointerCancel?.(e); drag.current = null; dragged.current = true; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId) }}
            onPointerLeave={(e: React.PointerEvent<HTMLElement>) => { props.onPointerLeave?.(e); setHovered(-1) }}
        /></FieldContext.Provider>
    })
}

function plane(index: number, Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = React.useContext(FieldContext)
        const original = POINTS[index]
        const c = Math.cos(state.angle), s = Math.sin(state.angle)
        const n: Vec = [original[0] * c + original[2] * s, original[1], original[2] * c - original[0] * s]
        const r: Vec = normalize([n[2], 0, -n[0]])
        const up: Vec = [n[1] * r[2], n[2] * r[0] - n[0] * r[2], -n[1] * r[0]]
        const halfFov = 24 * Math.PI / 180
        const cameraZ = 1.08 * Math.max(2.09 / Math.tan(halfFov), 2.09 / (Math.tan(halfFov) * state.width / state.height))
        const f = state.height / (2 * Math.tan(halfFov)), unit = f / cameraZ
        const reveal = state.frozen ? 1 : out((state.time - index * .015) / 1.4)
        const breath = state.frozen ? 0 : (.5 * (Math.sin((state.time * .1 + original[1] * 1.85 * 1.5) * Math.PI * 2) + 1)) * .1
        const selected = state.pinned === index
        const lastActivation = React.useRef<{ channel: "tap" | "click"; at: number } | null>(null)
        const activate = (channel: "tap" | "click", prevented: boolean) => {
            const at = typeof performance === "undefined" ? Date.now() : performance.now()
            const previous = lastActivation.current
            // Framer native Frames expose onTap; ordinary DOM layers emit click.
            // Consume the alternate event for one gesture, including cancellation,
            // while allowing consecutive gestures from either individual channel.
            if (previous && previous.channel !== channel && at - previous.at < 350) return
            lastActivation.current = { channel, at }
            if (!state.frozen && !prevented && !state.dragged.current && n[2] > .05 && reveal > .995) state.setPinned(selected ? -1 : index)
        }
        const facing = selected || state.hovered === index
        const normal: Vec = facing ? [0, 0, 1] : n
        const right: Vec = facing ? [1, 0, 0] : r
        const vertical: Vec = facing ? [0, 1, 0] : up
        const scale = selected ? 3.2 : reveal
        const x = selected ? 0 : n[0] * (1.85 + breath) * reveal
        const y = selected ? 0 : n[1] * (1.85 + breath) * reveal
        const z = selected ? 1.8 : n[2] * (1.85 + breath) * reveal
        const matrix = [right[0] * scale, -right[1] * scale, right[2] * scale, 0, -vertical[0] * scale, vertical[1] * scale, -vertical[2] * scale, 0, normal[0] * scale, -normal[1] * scale, normal[2] * scale, 0, x * unit, -y * unit, z * unit, 1].map(v => +v.toFixed(7)).join(",")
        const opacity = selected || facing ? 1 : (n[2] > .25 ? 1 : n[2] > 0 ? .1 + n[2] / .25 * .9 : .1) * reveal
        const width = .4 * unit, height = width / ASPECT[index]
        const native = props.style?.transform
        return <Component {...props} ref={ref} data-source-bleibt-plane={index} data-source-plane-facing={n[2]} data-source-plane-reveal={reveal}
            style={{ ...props.style, position: "absolute", left: "50%", top: "50%", width, height, translate: "-50% -50%", transform: `${native && native !== "none" ? native + " " : ""}matrix3d(${matrix})`, transformOrigin: "50% 50%", backfaceVisibility: "visible", opacity, zIndex: selected ? 999 : Math.round((z + 2) * 100), transition: state.frozen ? "none" : "transform 100ms linear, opacity 100ms linear" } as React.CSSProperties & { translate?: string }}
            onPointerEnter={(e: React.PointerEvent<HTMLElement>) => { props.onPointerEnter?.(e); if (!state.frozen && e.pointerType === "mouse" && n[2] > .05 && reveal > .995) state.setHovered(index) }}
            onPointerLeave={(e: React.PointerEvent<HTMLElement>) => { props.onPointerLeave?.(e); if (state.hovered === index) state.setHovered(-1) }}
            onClick={(e: React.MouseEvent<HTMLElement>) => { props.onClick?.(e); activate("click", e.defaultPrevented) }}
            onTap={(e: NativeTapEvent, info?: unknown) => { props.onTap?.(e, info); activate("tap", !!e.defaultPrevented) }}
        />
    })
}

export function withBleibtProject01(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return plane(0, Component) }
export function withBleibtProject02(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return plane(1, Component) }
export function withBleibtProject03(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return plane(2, Component) }
export function withBleibtProject04(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return plane(3, Component) }
export function withBleibtProject05(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return plane(4, Component) }
export function withBleibtProject06(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return plane(5, Component) }
export function withBleibtProject07(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return plane(6, Component) }
export function withBleibtProject08(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return plane(7, Component) }
export function withBleibtProject09(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return plane(8, Component) }
export function withBleibtProject10(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return plane(9, Component) }
export function withBleibtProject11(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return plane(10, Component) }
export function withBleibtProject12(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return plane(11, Component) }
export function withBleibtProject13(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return plane(12, Component) }
export function withBleibtProject14(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return plane(13, Component) }
export function withBleibtProject15(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return plane(14, Component) }
export function withBleibtProject16(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return plane(15, Component) }

/**
 * Source Work24–26 sticky heading. The current public timeline expands its
 * measured375px resting width to its1280px parent, then contracts it again as
 * the globe crosses top75%→bottom25%. At observed scroll2160/viewport1280×720
 * this gives785px, matching the retained source DOM. Native child labels use
 * ordinary space-between layout. Put this frame first inside the native
 * featured section, with the field558.40625 source units below that section.
 */
export function withBleibtWorkHeading(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const frozen = useIsStaticRenderer() || RenderTarget.current() === RenderTarget.canvas
        const own = React.useRef<HTMLElement | null>(null)
        const [width, setWidth] = React.useState(375)
        const [active, setActive] = React.useState(false)
        const [terminal, setTerminal] = React.useState(false)
        React.useEffect(() => {
            const node = own.current; if (!node || frozen) return
            let frame = 0
            const update = () => {
                frame = 0
                const parent = node.parentElement; if (!parent) return
                const unit = parent.clientWidth / 1280
                const fieldTop = parent.getBoundingClientRect().top + window.scrollY + 558.40625 * unit
                const fieldHeight = 647.109375 * unit
                const p = clamp((window.scrollY - fieldTop + window.innerHeight * .75) / (fieldHeight + window.innerHeight * .5))
                const triangle = p <= .5 ? p * 2 : (1 - p) * 2
                setWidth((375 + (1280 - 375) * triangle) * unit)
                setActive(window.innerWidth >= 992)
                setTerminal(p >= .99)
            }
            const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update) }
            window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule)
            update()
            return () => { window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); if (frame) window.cancelAnimationFrame(frame) }
        }, [frozen])
        return <WorkTerminalContext.Provider value={!frozen && active && terminal}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; mergeRef(ref, node) }} data-source-work-heading-width={width} data-source-work-terminal={!frozen && active && terminal}
            style={frozen || !active ? props.style : { ...props.style, position: "sticky", top: "50vh", width, marginLeft: "auto", marginRight: "auto", left: "auto", right: "auto", translate: "0 -50%", zIndex: 10 } as React.CSSProperties & { translate?: string }} /></WorkTerminalContext.Provider>
    })
}

export function withBleibtWorkLabel(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const terminal = React.useContext(WorkTerminalContext)
        return <Component {...props} ref={ref} style={{ ...props.style, opacity: terminal ? 0 : 1, visibility: terminal ? "hidden" : "visible" }} />
    })
}
export function withBleibtAllWorks(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const terminal = React.useContext(WorkTerminalContext)
        return <Component {...props} ref={ref} style={{ ...props.style, opacity: terminal ? 1 : 0, visibility: terminal ? "visible" : "hidden" }} />
    })
}
