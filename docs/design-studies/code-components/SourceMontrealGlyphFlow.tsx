import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"

/**
 * SOURCE INSPIRATION / HERO-008 — PP Neue Montreal, Pangram Pangram.
 * Independent native sticky/flow implementation from inspected public geometry.
 * Actual six source SVG glyphs remain separate editable image-filled Frames.
 * Desktop shows8→N; narrow source widths addS before8. Display and Text share
 * a baseline, clipped into horizontal upper/lower halves, not left/right.
 * Dimensions use the source's common8-based scales, including S heights.
 * No source behavior function or SVG payload is imported into this module.
 * Ordinary scroll drives the sequence; there is no wheel/touch interception.
 * Canvas/export/thumbnail show a representative8 pose without subscriptions.
 * Reduced motion keeps that pose and removes the long pinned travel.
 */
type Props = { [key: string]: unknown; style?: React.CSSProperties }
type Native = ComponentType<Props>
type Glyph = "8" | "N" | "S"
type Family = "display" | "text"
type Geometry = { height8: number; heightN: number; heightS: number; widthN: number }
type State = { width: number; height: number; travel: number; offset: number; phone: boolean; frozen: boolean; reduced: boolean; display: Geometry; text: Geometry }
function geometry(width: number, family: Family): Geometry {
    const scale = width / (family === "display" ? 166 : 157)
    return family === "display"
        ? { height8: 159 * scale, heightN: 154 * scale, heightS: 146 * scale, widthN: 158 * scale }
        : { height8: 157 * scale, heightN: 145 * scale, heightS: 140 * scale, widthN: 143 * scale }
}
function stateAt(width: number, height: number, scroll: number, frozen: boolean, reduced: boolean): State {
    const display = geometry(width, "display"), text = geometry(width, "text"), travel = Math.max(display.height8 + display.heightN, text.height8 + text.heightN)
    const phone = width < 768, pose = Math.max(0, Math.min(travel, scroll))
    // A representative8-centered still; this is an explicit authoring poster,
    // not a claim about the source's initial live scroll position.
    const poster = display.height8 / 2 + (phone ? height * .06 : 0)
    return { width, height, display, text, travel, phone, frozen, reduced, offset: frozen || reduced ? poster : pose }
}
const INITIAL = stateAt(1440, 810, 0, true, false)
const GlyphContext = React.createContext<State>(INITIAL)
function writeRef<T>(ref: React.ForwardedRef<T>, node: T | null) { if (typeof ref === "function") ref(node); else if (ref) ref.current = node }
function useFrozen() { const target = RenderTarget.current(); return useIsStaticRenderer() || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail }
function scrollContainer(node: HTMLElement): HTMLElement | null {
    let parent = node.parentElement
    while (parent && parent !== document.body && parent !== document.documentElement) {
        const overflow = getComputedStyle(parent).overflowY
        if (/^(auto|scroll|overlay)$/.test(overflow) && parent.scrollHeight > parent.clientHeight) return parent
        parent = parent.parentElement
    }
    return null
}
export function withMontrealGlyphScene(Component: ComponentType<Props>): ComponentType<Props> {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const frozen = useFrozen(), own = React.useRef<HTMLElement | null>(null), [state, setState] = React.useState(INITIAL)
        React.useLayoutEffect(() => {
            const node = own.current
            if (!node) return
            const query = window.matchMedia("(prefers-reduced-motion: reduce)")
            const parent = scrollContainer(node), scroller: EventTarget = parent ?? window
            let frame = 0
            const measure = () => {
                frame = 0
                const width = node.clientWidth || 1440
                const height = frozen ? width < 768 ? 700 : 810 : window.visualViewport?.height || window.innerHeight
                const top = node.getBoundingClientRect().top - (parent?.getBoundingClientRect().top ?? 0)
                const next = stateAt(width, height, -top, frozen, query.matches)
                setState(previous => previous.width === next.width && previous.height === next.height && previous.offset === next.offset && previous.frozen === next.frozen && previous.reduced === next.reduced ? previous : next)
            }
            const schedule = () => { if (!frame) frame = requestAnimationFrame(measure) }
            const observer = new ResizeObserver(frozen ? measure : schedule)
            observer.observe(node); measure()
            if (!frozen) {
                scroller.addEventListener("scroll", schedule, { passive: true })
                window.addEventListener("resize", schedule)
                window.visualViewport?.addEventListener("resize", schedule)
                window.visualViewport?.addEventListener("scroll", schedule)
                query.addEventListener("change", schedule)
            }
            return () => {
                observer.disconnect(); if (frame) cancelAnimationFrame(frame)
                scroller.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule)
                window.visualViewport?.removeEventListener("resize", schedule); window.visualViewport?.removeEventListener("scroll", schedule)
                query.removeEventListener("change", schedule)
            }
        }, [frozen])
        return <GlyphContext.Provider value={state}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; writeRef(ref, node) }} data-montreal-glyph-scene="true" data-montreal-glyph-offset={state.offset} data-montreal-glyph-travel={state.travel} style={{ ...props.style, position: "relative", height: state.height + (state.reduced ? 0 : state.travel), overflow: "visible" }} /></GlyphContext.Provider>
    }) as Native
}
export function withMontrealGlyphViewport(Component: ComponentType<Props>): ComponentType<Props> {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const state = React.useContext(GlyphContext)
        return <Component {...props} ref={ref} data-montreal-glyph-viewport="true" style={{ ...props.style, position: state.frozen || state.reduced ? "relative" : "sticky", top: 0, left: 0, width: "100%", height: state.height, overflow: "hidden" }} />
    }) as Native
}
function mask(Component: Native, family: Family): Native {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const state = React.useContext(GlyphContext)
        return <Component {...props} ref={ref} style={{ ...props.style, position: "absolute", left: 0, top: family === "display" ? 0 : state.height / 2, width: "100%", height: state.height / 2, overflow: "hidden", pointerEvents: "none" }} />
    }) as Native
}
export function withMontrealGlyphDisplayMask(Component: ComponentType<Props>): ComponentType<Props> { return mask(Component, "display") }
export function withMontrealGlyphTextMask(Component: ComponentType<Props>): ComponentType<Props> { return mask(Component, "text") }
function glyph(Component: Native, family: Family, kind: Glyph): Native {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const state = React.useContext(GlyphContext), metrics = state[family], shown = kind !== "S" || state.phone
        const baseline = state.height / 2 - state.offset + (state.phone ? state.height * .06 : 0)
        const y = baseline + (kind === "N" ? metrics.height8 : kind === "S" ? -metrics.heightS : 0) - (family === "text" ? state.height / 2 : 0)
        const width = kind === "N" && !state.phone ? metrics.widthN : state.width
        const height = kind === "8" ? metrics.height8 : kind === "N" ? metrics.heightN : metrics.heightS
        return <Component {...props} ref={ref} data-montreal-glyph={`${family}-${kind}`} aria-hidden={!shown} style={{ ...props.style, position: "absolute", left: (state.width - width) / 2, top: y, width, height, opacity: shown ? 1 : 0, visibility: shown ? "visible" : "hidden", pointerEvents: "none" }} />
    }) as Native
}
export function withMontrealGlyphDisplay8(Component: ComponentType<Props>): ComponentType<Props> { return glyph(Component, "display", "8") }
export function withMontrealGlyphDisplayN(Component: ComponentType<Props>): ComponentType<Props> { return glyph(Component, "display", "N") }
export function withMontrealGlyphDisplayS(Component: ComponentType<Props>): ComponentType<Props> { return glyph(Component, "display", "S") }
export function withMontrealGlyphText8(Component: ComponentType<Props>): ComponentType<Props> { return glyph(Component, "text", "8") }
export function withMontrealGlyphTextN(Component: ComponentType<Props>): ComponentType<Props> { return glyph(Component, "text", "N") }
export function withMontrealGlyphTextS(Component: ComponentType<Props>): ComponentType<Props> { return glyph(Component, "text", "S") }
export function withMontrealGlyphDivider(Component: ComponentType<Props>): ComponentType<Props> {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const state = React.useContext(GlyphContext)
        return <Component {...props} ref={ref} style={{ ...props.style, left: 0, top: state.height / 2 - .5, width: "100%", height: 1, pointerEvents: "none" }} />
    }) as Native
}
function label(Component: Native, family: Family): Native {
    return React.forwardRef<HTMLElement, Props>((props, ref) => <Component {...props} ref={ref} style={{ ...props.style, top: "auto", bottom: family === "display" ? "calc(50% + 8px)" : 16, pointerEvents: "none" }} />) as Native
}
export function withMontrealGlyphDisplayLabel(Component: ComponentType<Props>): ComponentType<Props> { return label(Component, "display") }
export function withMontrealGlyphTextLabel(Component: ComponentType<Props>): ComponentType<Props> { return label(Component, "text") }
