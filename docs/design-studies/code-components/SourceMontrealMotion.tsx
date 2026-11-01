import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"
/**
 * SOURCE INSPIRATION / HERO-008 — PP Neue Montreal, Pangram Pangram.
 * Independent public native-layer motion from retained current source facts:
 * eight posters orbit in40s, radius .32×the smaller own-field dimension,
 * circumference/8×.6 card width,1.25 aspect,1.2s cubic intro; city font axes
 * follow ordinary section scroll over0..70%; postcards tilt500px/±20°Desktop
 * or±1°narrow. Native images/type remain selectable; no foreign behavior JS,
 * DOM query, runtime font/media fetch, Canvas or WebGL is used here.
 * Selected archive establishes composition; these timing/input facts are from
 * current public code inspection, not independently observed archive motion.
 * Pause interoperates with the separate self-contained Montreal core through
 * its public per-window store. Canvas/export/thumbnail/reduced freeze; own
 * visibility and document visibility suspend timers/RAF; all listeners clean.
 * The entrance wall clock continues offscreen after its first intersecting entry, as in
 * the retained source; rotation holds. Explicit studyPause/reduced suspend both.
 */
type NativeInputEvent = { clientX?: number; clientY?: number; defaultPrevented?: boolean }
type Props = { [key: string]: unknown; style?: React.CSSProperties; onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void; onMouseMove?: (event: React.MouseEvent<HTMLElement>) => void; onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void; onPointerEnter?: (event: React.PointerEvent<HTMLElement>) => void; onPointerMove?: (event: React.PointerEvent<HTMLElement>) => void; onPointerLeave?: (event: React.PointerEvent<HTMLElement>) => void; onHoverStart?: (event: NativeInputEvent) => void; onHoverEnd?: (event: NativeInputEvent) => void }
type Native = ComponentType<Props>
type TransformStyle = React.CSSProperties & { rotate?: string; scale?: string }
const useOwnLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect
function writeRef<T>(ref: React.ForwardedRef<T>, node: T | null) { if (typeof ref === "function") ref(node); else if (ref) ref.current = node }
function useFrozen() { const target = RenderTarget.current(); return useIsStaticRenderer() || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail }
type Playback = { paused: boolean; listeners: Set<() => void> }
const PLAYBACK = Symbol.for("monarchic.sourceMontreal.playback.v1")
function playback(): Playback { if (typeof window === "undefined") return { paused: false, listeners: new Set() }; const realm = window as unknown as Record<symbol, Playback>; if (!realm[PLAYBACK]) realm[PLAYBACK] = { paused: false, listeners: new Set() }; return realm[PLAYBACK] }
function subscribePlayback(fn: () => void) { const state = playback(); state.listeners.add(fn); return () => state.listeners.delete(fn) }
const noSubscribe = (_fn: () => void) => () => {}
function usePaused(frozen: boolean) { return React.useSyncExternalStore(frozen ? noSubscribe : subscribePlayback, () => frozen || playback().paused, () => true) }
function useReducedMotion() { const [reduced, setReduced] = React.useState(() => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches); React.useEffect(() => { const query = matchMedia("(prefers-reduced-motion: reduce)"), update = () => setReduced(query.matches); update(); query.addEventListener("change", update); return () => query.removeEventListener("change", update) }, []); return reduced }
function useVisible(own: React.RefObject<HTMLElement | null>, frozen: boolean) { const [visible, setVisible] = React.useState(false), [hidden, setHidden] = React.useState(false); React.useEffect(() => { if (frozen || !own.current) return; const observer = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: .2 }), visibility = () => setHidden(document.hidden); observer.observe(own.current); visibility(); document.addEventListener("visibilitychange", visibility); return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility) } }, [frozen]); return visible && !hidden }
type Orbit = { width: number; height: number; angle: number; intro: number }
const OrbitContext = React.createContext<Orbit>({ width: 1440, height: 1350, angle: 0, intro: 1 })
export function withMontrealPosterOrbit(Component: ComponentType<Props>): ComponentType<Props> {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const frozen = useFrozen(), reduced = useReducedMotion(), paused = usePaused(frozen), own = React.useRef<HTMLElement | null>(null), visible = useVisible(own, frozen), time = React.useRef(0), intro = React.useRef({ start: -1, pausedAt: -1, suspended: 0 }), [state, setState] = React.useState<Orbit>({ width: 1440, height: 1350, angle: 0, intro: 0 }), live = !frozen && !reduced && !paused && visible
        useOwnLayoutEffect(() => { const node = own.current; if (!node) return; const measure = () => setState(s => ({ ...s, width: node.clientWidth || parseFloat(getComputedStyle(node).width) || 1440, height: node.clientHeight || parseFloat(getComputedStyle(node).height) || 1350 })); measure(); const observer = new ResizeObserver(measure); observer.observe(node); return () => observer.disconnect() }, [])
        React.useEffect(() => {
            const now = performance.now(), clock = intro.current
            if (paused || reduced || frozen) { if (clock.start >= 0 && clock.pausedAt < 0) clock.pausedAt = now }
            else if (clock.pausedAt >= 0) { clock.suspended += now - clock.pausedAt; clock.pausedAt = -1 }
        }, [paused, reduced, frozen])
        React.useEffect(() => {
            if (!live) return
            let frame = 0, previous = performance.now(), lastPaint = previous
            if (intro.current.start < 0) intro.current.start = previous
            const tick = (now: number) => {
                if (now - lastPaint >= 1000 / 30) {
                    time.current += Math.max(0, now - previous); previous = now; lastPaint = now
                    const progress = Math.min(1, Math.max(0, (now - intro.current.start - intro.current.suspended) / 1200))
                    setState(s => ({ ...s, angle: time.current * 360 / 40000 % 360, intro: 1 - (1 - progress) ** 3 }))
                }
                frame = requestAnimationFrame(tick)
            }
            frame = requestAnimationFrame(tick)
            return () => cancelAnimationFrame(frame)
        }, [live])
        const value = frozen || reduced ? { ...state, angle: 0, intro: 1 } : state
        return <OrbitContext.Provider value={value}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; writeRef(ref, node) }} data-montreal-poster-angle={value.angle} data-montreal-poster-intro={value.intro} data-montreal-poster-live={live} /></OrbitContext.Provider>
    }) as Native
}
function poster(Component: Native, index: number): Native { return React.forwardRef<HTMLElement, Props>((props, ref) => { const state = React.useContext(OrbitContext), radius = Math.min(state.width, state.height) * .32, width = 2 * Math.PI * radius / 8 * .6, height = width * 1.25, angle = (index * 45 - 90 + state.angle) * Math.PI / 180, r = radius * state.intro, scale = .1 + state.intro * .9; return <Component {...props} ref={ref} data-montreal-orbit-card={index} style={{ ...props.style, position: "absolute", left: state.width / 2 + r * Math.cos(angle) - width / 2, top: state.height / 2 + r * Math.sin(angle) - height / 2, width, height, rotate: `${index * 45 + state.angle}deg`, scale: String(scale), transformOrigin: "50% 50%", pointerEvents: "none" } as TransformStyle} /> }) as Native }
export function withMontrealPoster01(Component: ComponentType<Props>): ComponentType<Props> { return poster(Component, 0) }
export function withMontrealPoster02(Component: ComponentType<Props>): ComponentType<Props> { return poster(Component, 1) }
export function withMontrealPoster03(Component: ComponentType<Props>): ComponentType<Props> { return poster(Component, 2) }
export function withMontrealPoster04(Component: ComponentType<Props>): ComponentType<Props> { return poster(Component, 3) }
export function withMontrealPoster05(Component: ComponentType<Props>): ComponentType<Props> { return poster(Component, 4) }
export function withMontrealPoster06(Component: ComponentType<Props>): ComponentType<Props> { return poster(Component, 5) }
export function withMontrealPoster07(Component: ComponentType<Props>): ComponentType<Props> { return poster(Component, 6) }
export function withMontrealPoster08(Component: ComponentType<Props>): ComponentType<Props> { return poster(Component, 7) }
function nearestScroller(node: HTMLElement): HTMLElement | null { let parent = node.parentElement; while (parent && parent !== document.body && parent !== document.documentElement) { if (/^(auto|scroll|overlay)$/.test(getComputedStyle(parent).overflowY) && parent.scrollHeight > parent.clientHeight) return parent; parent = parent.parentElement }; return null }
const DISPLAY_NAMES = ["Black", "Extrabold", "Bold", "Semibold", "Medium", "Regular", "Book", "Light", "Thin", "Extralight", "Hairline"] as const
const TEXT_NAMES = ["Text Thin", "Text Light", "Text Book", "Text Regular", "Text Medium", "Text Semibold", "Text Bold"] as const
type City = { main: number; reverse: number; progress: number }
const CityContext = React.createContext<City>({ main: 900, reverse: 200, progress: 0 })
export function withMontrealCityWeights(Component: ComponentType<Props>): ComponentType<Props> {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const frozen = useFrozen(), reduced = useReducedMotion(), paused = usePaused(frozen), own = React.useRef<HTMLElement | null>(null), [state, setState] = React.useState<City>({ main: 900, reverse: 200, progress: 0 })
        useOwnLayoutEffect(() => {
            const node = own.current
            if (!node || frozen || reduced || paused) return
            let frame = 0
            const read = () => {
                frame = 0
                if (document.hidden) return
                const parent = nearestScroller(node), rect = node.getBoundingClientRect(), top = rect.top - (parent?.getBoundingClientRect().top ?? 0), raw = Math.max(0, Math.min(1, -top / Math.max(1, rect.height))), progress = Math.min(1, raw / .7)
                setState({ progress, main: Math.round(900 - progress * 800), reverse: Math.round(200 + progress * 500) })
            }
            const schedule = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(read) }
            const scroll = (event: Event) => {
                const target = event.target
                if (target === document || target === window || target instanceof HTMLElement && target.contains(node)) schedule()
            }
            const visibility = () => { if (document.hidden) { if (frame) cancelAnimationFrame(frame); frame = 0 } else schedule() }
            const observer = new ResizeObserver(schedule)
            observer.observe(node); read()
            window.addEventListener("scroll", scroll, { passive: true, capture: true })
            window.addEventListener("resize", schedule)
            document.addEventListener("visibilitychange", visibility)
            return () => { observer.disconnect(); if (frame) cancelAnimationFrame(frame); window.removeEventListener("scroll", scroll, true); window.removeEventListener("resize", schedule); document.removeEventListener("visibilitychange", visibility) }
        }, [frozen, reduced, paused])
        const value = frozen || reduced ? { main: 900, reverse: 200, progress: 0 } : state
        return <CityContext.Provider value={value}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; writeRef(ref, node) }} data-montreal-city-progress={value.progress} data-montreal-city-main={value.main} data-montreal-city-reverse={value.reverse} /></CityContext.Provider>
    }) as Native
}
function cityText(Component: Native, role: number): Native {
    return React.forwardRef<HTMLElement, Props>((props, ref) => { const state = React.useContext(CityContext), id = React.useId().replace(/[^\w-]/g, "_"), weight = role < 2 ? state.main : state.reverse, name = role === 0 ? DISPLAY_NAMES[Math.min(DISPLAY_NAMES.length - 1, Math.floor(state.progress * DISPLAY_NAMES.length))] : role === 3 ? TEXT_NAMES[Math.min(TEXT_NAMES.length - 1, Math.floor(state.progress * TEXT_NAMES.length))] : undefined; return <><Component {...props} ref={ref} {...name === undefined ? {} : { text: name }} data-montreal-city-ink={id} data-montreal-city-weight={weight} style={{ ...props.style, fontVariationSettings: `"wght" ${weight}` }} /><style>{`[data-montreal-city-ink="${id}"],[data-montreal-city-ink="${id}"] *{font-variation-settings:"wght" ${weight}!important}`}</style></> }) as Native
}
export function withMontrealCityDisplayName(Component: ComponentType<Props>): ComponentType<Props> { return cityText(Component, 0) }
export function withMontrealCityDisplayTitle(Component: ComponentType<Props>): ComponentType<Props> { return cityText(Component, 1) }
export function withMontrealCityTextCopy(Component: ComponentType<Props>): ComponentType<Props> { return cityText(Component, 2) }
export function withMontrealCityTextName(Component: ComponentType<Props>): ComponentType<Props> { return cityText(Component, 3) }
export function withMontrealPostcardTilt(Component: ComponentType<Props>): ComponentType<Props> {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const frozen = useFrozen(), reduced = useReducedMotion(), paused = usePaused(frozen), own = React.useRef<HTMLElement | null>(null), visible = useVisible(own, frozen), bounds = React.useRef<DOMRect | null>(null), frame = React.useRef(0), pointer = React.useRef({ x: .5, y: .5 }), [pose, setPose] = React.useState({ x: 0, y: 0, scale: 1 })
        const stopped = frozen || reduced || paused || !visible
        const measure = () => { if (own.current) bounds.current = own.current.getBoundingClientRect() }
        const clear = () => { if (frame.current) cancelAnimationFrame(frame.current); frame.current = 0; setPose({ x: 0, y: 0, scale: 1 }) }
        const update = (event: NativeInputEvent) => { if (stopped || event.defaultPrevented || event.clientX === undefined || event.clientY === undefined) return; if (!bounds.current) measure(); const rect = bounds.current; if (!rect || !rect.width || !rect.height) return; pointer.current = { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) }; if (!frame.current) frame.current = requestAnimationFrame(() => { frame.current = 0; if (event.defaultPrevented) return; const phone = (own.current?.clientWidth ?? 600) < 400, limit = phone ? 1 : 20; setPose({ x: (pointer.current.y - .5) * limit * 2, y: -(pointer.current.x - .5) * limit * 2, scale: phone ? 1 : 1.1 }) }) }
        React.useEffect(() => { if (stopped) clear(); return () => { if (frame.current) cancelAnimationFrame(frame.current); frame.current = 0 } }, [stopped])
        React.useEffect(() => { const node = own.current; if (!node) return; const observer = new ResizeObserver(measure); observer.observe(node); window.addEventListener("resize", measure); window.addEventListener("scroll", measure, { passive: true, capture: true }); return () => { observer.disconnect(); window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true) } }, [])
        React.useEffect(() => { const node = own.current; if (!node || stopped) return; const enter = () => measure(), move = (event: PointerEvent) => update(event), leave = () => clear(); node.addEventListener("pointerenter", enter); node.addEventListener("pointermove", move); node.addEventListener("pointerleave", leave); return () => { node.removeEventListener("pointerenter", enter); node.removeEventListener("pointermove", move); node.removeEventListener("pointerleave", leave) } }, [stopped])
        const transform = `${props.style?.transform ?? ""} perspective(500px) rotateX(${pose.x}deg) rotateY(${pose.y}deg) scale(${pose.scale})`.trim()
        return <Component {...props} ref={(node: HTMLElement | null) => { own.current = node; writeRef(ref, node) }} data-montreal-card-tilt={`${pose.x}/${pose.y}`} data-montreal-card-scale={pose.scale} onMouseEnter={(event: React.MouseEvent<HTMLElement>) => { props.onMouseEnter?.(event); measure(); update(event) }} onMouseMove={(event: React.MouseEvent<HTMLElement>) => { props.onMouseMove?.(event); update(event) }} onMouseLeave={(event: React.MouseEvent<HTMLElement>) => { props.onMouseLeave?.(event); clear() }} onPointerEnter={(event: React.PointerEvent<HTMLElement>) => { props.onPointerEnter?.(event); measure(); update(event) }} onPointerMove={(event: React.PointerEvent<HTMLElement>) => { props.onPointerMove?.(event); update(event) }} onPointerLeave={(event: React.PointerEvent<HTMLElement>) => { props.onPointerLeave?.(event); clear() }} onHoverStart={(event: NativeInputEvent) => { props.onHoverStart?.(event); measure(); update(event) }} onHoverEnd={(event: NativeInputEvent) => { props.onHoverEnd?.(event); clear() }} style={{ ...props.style, transform, transition: props.style?.transition ? `${props.style.transition}, transform .2s ease-out` : "transform .2s ease-out", transformStyle: "preserve-3d" }} />
    }) as Native
}
