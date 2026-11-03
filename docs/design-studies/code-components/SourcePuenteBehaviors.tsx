import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"

/**
 * SOURCE INSPIRATION / HERO-018 — pu—ente / https://www.pu-ente.com/
 * Independent public React overrides for editable native gate/gallery layers.
 * Current public source facts: fine-pointer half fills, three distinct palette
 * colors, split curtain 1.8s/power3.in with a .12s lower delay and .6 viewport
 * displacement; graphic-tile info .3s and blue16px/26-point pointer trail.
 * These are code-supported, not newly browser-observed archive interactions.
 * No original source behavior JS is reused. The SVG trail expresses the
 * source's quadratic midpoint geometry while retaining the native artwork.
 * The CSS cubic curtain curve approximates the source GSAP power3.in ease.
 *
 * One Experience parent contains GateStage and GraphicGallery. Gate contains
 * the two cards; UpperHalf/LowerHalf are separate viewport backgrounds. Attach
 * ProjectTile to each native artwork frame and ProjectInfo to its mounted,
 * opacity-zero native info group. Art retains its native external source link;
 * no Art branch or invented project pages are created. No archive slider runs.
 * Gate owns its centering transform: attach it to an untransformed native Frame.
 * Experience must stay in normal fit-content page flow; its height follows the
 * native entry artboard in static targets and the measured gallery when opened.
 * The in-page gate→gallery architecture adapts the original route transition.
 * Canvas/exports are static; reduced motion skips timed motion. No GPU/fetch.
 */

type Phase = "entry" | "leaving" | "gallery"
type Side = "art" | "graphic" | null
type Point = { x: number; y: number }
type Combo = { background: string; art: string; graphic: string }
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

type LayerProps = {
    [key: string]: unknown
    style?: React.CSSProperties
    children?: React.ReactNode
    onClick?: React.MouseEventHandler<HTMLElement>; onTap?: (event: NativeActivationEvent, info?: unknown) => void
    onKeyDown?: React.KeyboardEventHandler<HTMLElement>
    onPointerEnter?: React.PointerEventHandler<HTMLElement>
    onPointerMove?: React.PointerEventHandler<HTMLElement>
    onPointerLeave?: React.PointerEventHandler<HTMLElement>
}
type Experience = {
    phase: Phase; hover: Side; combo: Combo; viewportHeight: number; viewportWidth: number
    frozen: boolean; reduced: boolean; fine: boolean; trailEnabled: boolean; infoEnabled: boolean
    hoverCard: (side: Side) => void; enterGraphic: () => void; returnToGate: () => void
    setGalleryHeight: (height: number) => void; setStaticSize: (size: { width: number; height: number }) => void
}
const PALETTE = ["#1b1b1b", "#323232", "#7a7a7a", "#d9d5d5", "#ffffff"]
const INITIAL: Combo = { background: "#d9d5d5", art: "#1b1b1b", graphic: "#ffffff" }
const EMPTY: Experience = { phase: "entry", hover: null, combo: INITIAL, viewportHeight: 810, viewportWidth: 1440,
    frozen: true, reduced: false, fine: false, trailEnabled: false, infoEnabled: false,
    hoverCard() {}, enterGraphic() {}, returnToGate() {}, setGalleryHeight() {}, setStaticSize() {} }
const Context = React.createContext<Experience>(EMPTY)
const TileContext = React.createContext(false)
const useOwnLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect
function writeRef<T>(ref: React.ForwardedRef<T>, value: T | null) { if (typeof ref === "function") ref(value); else if (ref) ref.current = value }
function isFrozen() {
    const target = RenderTarget.current()
    return useIsStaticRenderer() || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail
}
function foreground(color: string) {
    const r = parseInt(color.slice(1, 3), 16), g = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16)
    return Math.sqrt(.299 * r * r + .587 * g * g + .114 * b * b) < 140 ? "#ffffff" : "#1b1b1b"
}
function projectTrailPath(points: Point[]) {
    if (points.length < 2) return ""
    const first = points[0], last = points[points.length - 1]
    const curves = points.slice(1, -2).map((point, index) => {
        const next = points[index + 2]
        return `Q${point.x},${point.y} ${(point.x + next.x) / 2},${(point.y + next.y) / 2}`
    })
    return `M${first.x},${first.y} ${curves.join(" ")} L${last.x},${last.y}`
}
function nextCombo(): Combo {
    const pool = PALETTE.slice()
    const pick = () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0]
    return { background: pick(), art: pick(), graphic: pick() }
}
function curtainStyle(state: Experience, side: Exclude<Side, null>, existing: React.CSSProperties | undefined) {
    const lower = side === "graphic", moving = state.phase === "leaving"
    return { ...existing,
        transform: [existing?.transform, moving ? `translateY(${(lower ? 1 : -1) * state.viewportHeight * .6}px)` : ""].filter(Boolean).join(" "),
        transition: state.reduced || state.frozen ? "none" : moving
            ? `transform 1.8s cubic-bezier(.895,.03,.685,.22) ${lower ? ".12s" : "0s"}`
            : "background-color 1s ease-in-out, color 1s ease-in-out",
    }
}

export function withPuenteExperience(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const frozen = isFrozen(), own = React.useRef<HTMLElement | null>(null)
        const [phase, setPhase] = React.useState<Phase>("entry")
        const [hover, setHover] = React.useState<Side>(null)
        const [combo, setCombo] = React.useState<Combo>(INITIAL)
        const [viewportHeight, setViewportHeight] = React.useState(810)
        const [viewportWidth, setViewportWidth] = React.useState(1440)
        const [galleryHeight, setGalleryHeight] = React.useState(2560)
        const [nativeSize, setNativeSize] = React.useState({ width: 1440, height: 810 })
        const setStaticSize = React.useCallback((size: { width: number; height: number }) => setNativeSize(old => old.width === size.width && old.height === size.height ? old : size), [])
        const [media, setMedia] = React.useState({ fine: false, trailEnabled: false, infoEnabled: false, reduced: false })
        const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
        const clear = React.useCallback(() => { if (timer.current !== null) clearTimeout(timer.current); timer.current = null }, [])
        React.useEffect(() => {
            if (frozen) return
            const fine = window.matchMedia("(hover: hover) and (pointer: fine)")
            const narrow = window.matchMedia("(max-width: 900px)")
            const small = window.matchMedia("(max-width: 550px)")
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
            const update = () => { setViewportHeight(window.innerHeight); setViewportWidth(window.innerWidth); setMedia({ fine: fine.matches, trailEnabled: fine.matches && !narrow.matches, infoEnabled: fine.matches && !small.matches, reduced: reduced.matches }) }
            update()
            const queries = [fine, narrow, small, reduced]
            queries.forEach(query => query.addEventListener("change", update)); window.addEventListener("resize", update)
            return () => { queries.forEach(query => query.removeEventListener("change", update)); window.removeEventListener("resize", update); clear() }
        }, [clear, frozen])
        React.useEffect(() => {
            if (frozen) { clear(); setPhase("entry"); setHover(null) }
        }, [frozen, clear])
        const enterGraphic = React.useCallback(() => {
            if (frozen || phase !== "entry") return
            clear()
            if (media.reduced) setPhase("gallery")
            else { setPhase("leaving"); timer.current = setTimeout(() => { timer.current = null; setPhase("gallery") }, 1920) }
        }, [frozen, phase, media.reduced, clear])
        React.useEffect(() => { if (media.reduced && phase === "leaving") { clear(); setPhase("gallery") } }, [media.reduced, phase, clear])
        const returnToGate = React.useCallback(() => { if (!frozen) { clear(); setHover(null); setPhase("entry"); own.current?.scrollIntoView({ block: "start", behavior: "auto" }) } }, [frozen, clear])
        const value: Experience = { phase: frozen ? "entry" : phase, hover: frozen ? null : hover, combo: frozen ? INITIAL : combo,
            viewportHeight: frozen ? nativeSize.height : viewportHeight, viewportWidth: frozen ? nativeSize.width : viewportWidth, frozen, ...media, hoverCard: side => { if (!frozen && media.fine) setHover(side) }, enterGraphic, returnToGate, setGalleryHeight, setStaticSize }
        const activatePalette = useNativeActivation(() => { if (phase === "entry") setCombo(nextCombo()) }, frozen)
        return <Context.Provider value={value}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; writeRef(ref, node) }}
            data-source-puente-phase={value.phase} data-source-puente-palette={`${value.combo.background}/${value.combo.art}/${value.combo.graphic}`}
            style={{ ...props.style, position: "relative", height: value.phase === "gallery" ? galleryHeight : value.viewportHeight, overflow: "hidden", background: value.phase === "entry" ? value.combo.background : "#323232" }}
            onTap={(event: NativeActivationEvent, info?: unknown) => { props.onTap?.(event, info); activatePalette("tap", !!event.defaultPrevented) }}
            onClick={(event: React.MouseEvent<HTMLElement>) => { props.onClick?.(event); activatePalette("click", !!event.defaultPrevented) }}
        /></Context.Provider>
    })
}

export function withPuenteGateStage(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const s = React.useContext(Context), own = React.useRef<HTMLElement | null>(null)
        useOwnLayoutEffect(() => {
            const node = own.current; if (!node) return
            const measure = () => { if (node.clientWidth && node.clientHeight) s.setStaticSize({ width: node.clientWidth, height: node.clientHeight }) }
            measure(); const observer = new ResizeObserver(measure); observer.observe(node)
            return () => observer.disconnect()
        }, [s.setStaticSize, s.frozen])
        return <Component {...props} ref={(node: HTMLElement | null) => { own.current = node; writeRef(ref, node) }}
            data-source-puente-layer="gate-stage" aria-hidden={s.phase === "gallery"}
            style={{ ...props.style, top: 0, ...(!s.frozen ? { height: s.viewportHeight } : {}), opacity: s.phase === "gallery" ? 0 : 1, pointerEvents: s.phase === "entry" ? "auto" : "none", background: s.phase === "entry" ? s.combo.background : "transparent", zIndex: 2 }} />
    })
}
export function withPuenteGate(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => { const s = React.useContext(Context); return <Component {...props} ref={ref}
        data-source-puente-layer="gate" style={{ ...props.style, ...(!s.frozen ? { width: s.viewportWidth <= 900 ? "100%" : 460, height: 460 } : {}), left: "50%", top: "50%", transform: "translate(-50%,-50%)" }} /> })
}
function half(Component: ComponentType<LayerProps>, side: Exclude<Side, null>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => { const s = React.useContext(Context), lower = side === "graphic"
        const color = s.hover === side ? s.combo[side] : s.combo.background
        return <Component {...props} ref={ref} data-source-puente-layer={lower ? "lower-half" : "upper-half"}
            style={{ ...curtainStyle(s, side, props.style), left: 0, top: lower ? s.viewportHeight / 2 : 0, width: "100%", height: s.viewportHeight / 2, backgroundColor: color, pointerEvents: "none" }} />
    })
}
export function withPuenteUpperHalf(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return half(Component, "art") }
export function withPuenteLowerHalf(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return half(Component, "graphic") }
function card(Component: ComponentType<LayerProps>, side: Exclude<Side, null>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => { const s = React.useContext(Context), activate = useNativeActivation(() => { if (side === "graphic") s.enterGraphic() }, s.frozen)
        return <Component {...props} ref={ref} data-source-puente-card={side}
            style={{ ...curtainStyle(s, side, props.style), width: "100%", height: 230, top: side === "graphic" ? 230 : 0, backgroundColor: s.combo[side], color: foreground(s.combo[side]), cursor: "pointer" }}
            role={props.role ?? (side === "graphic" ? "button" : undefined)} tabIndex={props.tabIndex ?? (side === "graphic" ? 0 : undefined)}
            onPointerEnter={(event: React.PointerEvent<HTMLElement>) => { props.onPointerEnter?.(event); if (!event.defaultPrevented && event.pointerType !== "touch") s.hoverCard(side) }}
            onPointerLeave={(event: React.PointerEvent<HTMLElement>) => { props.onPointerLeave?.(event); if (!event.defaultPrevented) s.hoverCard(null) }}
            onTap={(event: NativeActivationEvent, info?: unknown) => { props.onTap?.(event, info); event.stopPropagation?.(); activate("tap", !!event.defaultPrevented) }}
            onClick={(event: React.MouseEvent<HTMLElement>) => { props.onClick?.(event); event.stopPropagation(); activate("click", !!event.defaultPrevented) }}
            onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => { props.onKeyDown?.(event); if (!s.frozen && side === "graphic" && !event.defaultPrevented && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); activate("key", false) } }} />
    })
}
export function withPuenteArtCard(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return card(Component, "art") }
export function withPuenteGraphicCard(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return card(Component, "graphic") }
function ink(Component: ComponentType<LayerProps>, side: Exclude<Side, null>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => { const s = React.useContext(Context), id = React.useId().replace(/[^\w-]/g, "_")
        const color = foreground(s.combo[side]), selector = `[data-source-puente-ink="${id}"]`
        return <><Component {...props} ref={ref} data-source-puente-ink={id} style={{ ...props.style, color }} /><style>{`${selector},${selector} *{color:${color}!important}`}</style></>
    })
}
export function withPuenteArtText(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return ink(Component, "art") }
export function withPuenteGraphicText(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return ink(Component, "graphic") }
// A small DOM square replaces the source's viewport-sized cursor canvas. It
// uses viewport coordinates outside the clipped tile trail, so it needs no
// bitmap, context or continuous idle loop. Each gallery owns and cleans it up.
function useGalleryDifferenceCursor(node: HTMLElement | null, state: Experience, id: string) {
    React.useEffect(() => {
        if (!node || state.frozen || state.reduced || state.phase !== "gallery" || !state.trailEnabled) return
        const cursor = document.createElement("div"), style = document.createElement("style")
        cursor.setAttribute("data-source-puente-outside-cursor", id)
        cursor.setAttribute("aria-hidden", "true")
        style.setAttribute("data-source-puente-cursor-style", id)
        cursor.hidden = true
        Object.assign(cursor.style, { position: "fixed", left: "0px", top: "0px", width: "16px", height: "16px", background: "#ffffff", mixBlendMode: "difference", pointerEvents: "none", zIndex: "9999" })
        style.textContent = '[data-source-puente-cursor-owner="' + id + '"],[data-source-puente-cursor-owner="' + id + '"] *{cursor:none!important}'
        document.body.appendChild(cursor); document.head.appendChild(style)
        let pending = 0, previous = 0, current: Point | null = null, target: Point | null = null, last: Point | null = null
        const cancel = () => { if (pending) cancelAnimationFrame(pending); pending = 0; previous = 0 }
        const hide = () => { cancel(); cursor.hidden = true; current = null; target = null }
        const paint = (point: Point) => { cursor.style.left = Math.round(point.x - 8) + "px"; cursor.style.top = Math.round(point.y - 8) + "px"; cursor.hidden = false }
        const tick = (now: number) => {
            pending = 0
            if (!current || !target || document.hidden) { hide(); return }
            const dt = previous ? Math.min(.05, (now - previous) / 1000) : 1 / 60; previous = now
            const mix = 1 - Math.pow(.68, dt * 60)
            current = { x: current.x + (target.x - current.x) * mix, y: current.y + (target.y - current.y) * mix }
            const moving = Math.abs(target.x - current.x) > .5 || Math.abs(target.y - current.y) > .5
            if (!moving) current = { ...target }
            paint(current)
            if (moving) pending = requestAnimationFrame(tick)
        }
        const sample = (point: Point) => {
            const hit = document.elementFromPoint(point.x, point.y)
            if (document.hidden || !hit || !node.contains(hit) || hit.closest("[data-source-puente-project]")) { hide(); return }
            target = point
            if (!current) { current = { ...point }; paint(current) }
            if (!pending) pending = requestAnimationFrame(tick)
        }
        const move = (event: PointerEvent) => {
            if (event.defaultPrevented || event.pointerType === "touch") { last = null; hide(); return }
            last = { x: event.clientX, y: event.clientY }; sample(last)
        }
        const leave = () => { last = null; hide() }
        const reposition = () => { if (last) sample(last) }
        const visibility = () => { if (document.hidden) leave() }
        // Window bubbling runs after the native layer's React callbacks, so
        // their preventDefault remains authoritative for this source effect.
        window.addEventListener("pointermove", move)
        node.addEventListener("pointerleave", leave)
        window.addEventListener("scroll", reposition, { passive: true, capture: true })
        window.addEventListener("resize", reposition)
        window.addEventListener("blur", leave)
        document.addEventListener("visibilitychange", visibility)
        return () => {
            leave(); window.removeEventListener("pointermove", move); node.removeEventListener("pointerleave", leave)
            window.removeEventListener("scroll", reposition, true); window.removeEventListener("resize", reposition); window.removeEventListener("blur", leave)
            document.removeEventListener("visibilitychange", visibility); cursor.remove(); style.remove()
        }
    }, [node, state.frozen, state.phase, state.trailEnabled, state.reduced, id])
}

export function withPuenteGraphicGallery(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => { const s = React.useContext(Context), [host, setHost] = React.useState<HTMLElement | null>(null), cursorID = React.useId().replace(/[^\w-]/g, "_")
        const attach = React.useCallback((node: HTMLElement | null) => { setHost(node); writeRef(ref, node) }, [ref])
        useGalleryDifferenceCursor(host, s, cursorID)
        useOwnLayoutEffect(() => { if (!host) return; const measure = () => s.setGalleryHeight(host.clientHeight); measure(); const observer = new ResizeObserver(measure); observer.observe(host); return () => observer.disconnect() }, [host, s.setGalleryHeight])
        return <Component {...props} ref={attach}
            data-source-puente-layer="gallery" data-source-puente-cursor-owner={cursorID} aria-hidden={s.phase === "entry"}
            style={{ ...props.style, top: 0, opacity: s.phase === "entry" ? 0 : 1, pointerEvents: s.phase === "gallery" ? "auto" : "none", zIndex: 1 }} />
    })
}
export function withPuenteReturnToGate(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => { const s = React.useContext(Context), activate = useNativeActivation(s.returnToGate, s.frozen); return <Component {...props} ref={ref}
        role={props.role ?? "button"} tabIndex={props.tabIndex ?? 0} data-source-puente-layer="return"
        onTap={(event: NativeActivationEvent, info?: unknown) => { props.onTap?.(event, info); activate("tap", !!event.defaultPrevented) }}
        onClick={(event: React.MouseEvent<HTMLElement>) => { props.onClick?.(event); activate("click", !!event.defaultPrevented) }}
        onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => { props.onKeyDown?.(event); if (!s.frozen && !event.defaultPrevented && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); activate("key", false) } }} /> })
}

export function withPuenteProjectTile(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const s = React.useContext(Context), [hovered, setHovered] = React.useState(false), [trail, setTrail] = React.useState<Point[]>([])
        const pending = React.useRef(0), target = React.useRef<Point | null>(null), current = React.useRef<Point | null>(null), points = React.useRef<Point[]>([]), previous = React.useRef(0), published = React.useRef(0)
        const stop = React.useCallback(() => { if (pending.current) cancelAnimationFrame(pending.current); pending.current = 0; current.current = null; target.current = null; points.current = []; previous.current = 0; setTrail([]) }, [])
        React.useEffect(() => { if (s.frozen || s.reduced || !s.trailEnabled || s.phase !== "gallery") { stop(); setHovered(false) } return stop }, [s.frozen, s.reduced, s.trailEnabled, s.phase, stop])
        const update = (event: React.PointerEvent<HTMLElement>) => {
            if (s.frozen || s.reduced || !s.trailEnabled || s.phase !== "gallery" || event.pointerType === "touch") return
            const rect = event.currentTarget.getBoundingClientRect(); if (!rect.width || !rect.height) return
            target.current = { x: (event.clientX - rect.left) * event.currentTarget.clientWidth / rect.width, y: (event.clientY - rect.top) * event.currentTarget.clientHeight / rect.height }
            if (!current.current) current.current = { ...target.current }
            if (pending.current) return
            const tick = (now: number) => {
                pending.current = 0
                const to = target.current, from = current.current; if (!to || !from) return
                const dt = previous.current ? Math.min(.05, (now - previous.current) / 1000) : 1 / 60; previous.current = now
                const mix = 1 - Math.pow(.68, dt * 60)
                current.current = { x: from.x + (to.x - from.x) * mix, y: from.y + (to.y - from.y) * mix }
                const head = current.current, last = points.current[points.current.length - 1]
                if (!last || Math.hypot(head.x - last.x, head.y - last.y) > 1.5) points.current = [...points.current, { ...head }].slice(-26)
                const moving = Math.abs(to.x - head.x) > .5 || Math.abs(to.y - head.y) > .5
                if (!moving && points.current.length > 1) points.current = points.current.slice(1)
                if (now - published.current >= 1000 / 30) { published.current = now; setTrail(points.current.slice()) }
                if (moving || points.current.length > 1) pending.current = requestAnimationFrame(tick)
                else setTrail(points.current.slice())
            }
            pending.current = requestAnimationFrame(tick)
        }
        const visible = hovered && s.infoEnabled && !s.frozen
        const head = trail[trail.length - 1]
        return <TileContext.Provider value={visible}><Component {...props} ref={ref} data-source-puente-project="native" data-source-puente-trail-points={trail.length}
            style={{ ...props.style, overflow: "hidden" }}
            onPointerEnter={(event: React.PointerEvent<HTMLElement>) => { props.onPointerEnter?.(event); if (!event.defaultPrevented && event.pointerType !== "touch" && s.fine) { setHovered(true); update(event) } }}
            onPointerMove={(event: React.PointerEvent<HTMLElement>) => { props.onPointerMove?.(event); if (!event.defaultPrevented) update(event) }}
            onPointerLeave={(event: React.PointerEvent<HTMLElement>) => { props.onPointerLeave?.(event); setHovered(false); stop() }}
        >{props.children}{head && <svg aria-hidden="true" data-source-puente-trail="quadratic-source-fit" width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 9998 }}>
            {trail.length > 1 ? <path d={projectTrailPath(trail)} fill="none" stroke="#0057ff" strokeWidth={16} strokeLinejoin="round" strokeLinecap="butt" /> : <rect x={Math.round(head.x - 8)} y={Math.round(head.y - 8)} width={16} height={16} fill="#0057ff" />}
        </svg>}</Component></TileContext.Provider>
    })
}
export function withPuenteProjectInfo(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => { const visible = React.useContext(TileContext), s = React.useContext(Context)
        return <Component {...props} ref={ref} data-source-puente-info={visible} aria-hidden={!visible}
            style={{ ...props.style, opacity: visible ? 1 : 0, pointerEvents: "none", transition: s.reduced || s.frozen ? "none" : "opacity .3s ease-in" }} />
    })
}
