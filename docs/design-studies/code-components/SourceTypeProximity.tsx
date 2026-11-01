import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"

/**
 * Source inspiration — HERO-008 / PP Neue Montreal, Pangram Pangram.
 * Independently implemented overrides for the inspected capsule/footer effect.
 * Current authored values: weight 400–900, 20 CSS px Euclidean radius,
 * smoothstep falloff, immediate entry and a 0.5 s ease on leave. These are
 * public-code facts; selected-archive interaction was not browser-verified.
 *
 * Attach Word to a native horizontal word frame and Letter to each editable
 * one-character Text layer. Assign the actual variable font in Framer. This
 * module inherits that font, fetches no fonts, and reuses no source behavior JS.
 * Canvas/exports remain still. RAF work is shared by a word's letters and only
 * exists while a pointer update is pending; no GPU context is allocated.
 */

type LayerProps = {
    [key: string]: unknown
    style?: React.CSSProperties
    onMouseEnter?: React.MouseEventHandler<HTMLElement>
    onMouseMove?: React.MouseEventHandler<HTMLElement>
    onMouseLeave?: React.MouseEventHandler<HTMLElement>
}
type Point = { x: number; y: number }
type Bounds = { left: number; top: number; width: number; height: number }
type WordState = { pointer: Point | null; epoch: number; reducedMotion: boolean; register: (measure: () => void) => () => void }
type TransitionSet = { property: string[]; duration: string[]; timing: string[]; delay: string[] }
type VariableStyle = React.CSSProperties & { "--source-type-weight"?: number }
const EMPTY_TRANSITIONS: TransitionSet = { property: [], duration: [], timing: [], delay: [] }
const WordContext = React.createContext<WordState>({ pointer: null, epoch: 0, reducedMotion: false, register: () => () => {} })
const MIN_WEIGHT = 400
const MAX_WEIGHT = 900
const RADIUS = 20
const FRAME_MS = 1000 / 30
const WEIGHT_PROPERTY = "--source-type-weight"
let propertyRegistered = false
const useOwnLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

function registerWeightProperty() {
    if (propertyRegistered || typeof CSS === "undefined" || !CSS.registerProperty) return
    try {
        CSS.registerProperty({ name: WEIGHT_PROPERTY, syntax: "<number>", inherits: true, initialValue: "400" })
        propertyRegistered = true
    } catch {
        // Another copy can already own the identical public registration.
        // Immediate updates still work if a browser cannot register properties.
    }
}

function weightAt(pointer: Point | null, bounds: Bounds | null) {
    if (!pointer || !bounds) return MIN_WEIGHT
    const distance = Math.hypot(pointer.x - bounds.left - bounds.width / 2, pointer.y - bounds.top - bounds.height / 2)
    const f = Math.max(0, 1 - distance / RADIUS)
    return Math.round(MIN_WEIGHT + f * f * (3 - 2 * f) * (MAX_WEIGHT - MIN_WEIGHT))
}

function cssList(value: string) {
    const out: string[] = []
    let depth = 0
    let start = 0
    for (let i = 0; i < value.length; i++) {
        if (value[i] === "(") depth++
        else if (value[i] === ")") depth--
        else if (value[i] === "," && depth === 0) {
            out.push(value.slice(start, i).trim())
            start = i + 1
        }
    }
    out.push(value.slice(start).trim())
    return out.filter(Boolean)
}

function ownTransitions(node: HTMLElement, style: React.CSSProperties | undefined): TransitionSet {
    // Read only this public element. Temporarily remove our four injected
    // longhands so CSS classes and the caller's transition can be measured.
    const names = ["transition", "transition-property", "transition-duration", "transition-timing-function", "transition-delay"]
    const before = names.map(name => [name, node.style.getPropertyValue(name), node.style.getPropertyPriority(name)])
    for (const name of names) node.style.removeProperty(name)
    if (style?.transition !== undefined) node.style.transition = String(style.transition)
    if (style?.transitionProperty !== undefined) node.style.transitionProperty = String(style.transitionProperty)
    if (style?.transitionDuration !== undefined) node.style.transitionDuration = String(style.transitionDuration)
    if (style?.transitionTimingFunction !== undefined) node.style.transitionTimingFunction = String(style.transitionTimingFunction)
    if (style?.transitionDelay !== undefined) node.style.transitionDelay = String(style.transitionDelay)
    const computed = window.getComputedStyle(node)
    const properties = cssList(computed.transitionProperty)
    const duration = cssList(computed.transitionDuration)
    const timing = cssList(computed.transitionTimingFunction)
    const delay = cssList(computed.transitionDelay)
    const result: TransitionSet = { property: [], duration: [], timing: [], delay: [] }
    properties.forEach((property, index) => {
        if (property === "none" || property === WEIGHT_PROPERTY) return
        result.property.push(property)
        result.duration.push(duration[index % duration.length] || "0s")
        result.timing.push(timing[index % timing.length] || "ease")
        result.delay.push(delay[index % delay.length] || "0s")
    })
    for (const name of names) node.style.removeProperty(name)
    for (const [name, value, priority] of before) if (value) node.style.setProperty(name, value, priority)
    return result
}

export function withSourceTypeWord(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const frozen = useIsStaticRenderer() || RenderTarget.current() === RenderTarget.canvas
        const [pointer, setPointer] = React.useState<Point | null>(null)
        const [epoch, setEpoch] = React.useState(0)
        const [reducedMotion, setReducedMotion] = React.useState(false)
        const pending = React.useRef<Point | null>(null)
        const frame = React.useRef(0)
        const lastFrame = React.useRef(0)
        const measurements = React.useRef(new Set<() => void>())
        const register = React.useCallback((measure: () => void) => {
            measurements.current.add(measure)
            measure()
            return () => { measurements.current.delete(measure) }
        }, [])
        const measureLetters = React.useCallback(() => {
            for (const measure of measurements.current) measure()
            setEpoch(value => value + 1)
        }, [])

        React.useEffect(() => {
            if (frozen) return
            registerWeightProperty()
            const query = window.matchMedia("(prefers-reduced-motion: reduce)")
            const update = () => setReducedMotion(query.matches)
            const measure = measureLetters
            update()
            query.addEventListener("change", update)
            window.addEventListener("resize", measure)
            window.addEventListener("scroll", measure, true)
            return () => {
                query.removeEventListener("change", update)
                window.removeEventListener("resize", measure)
                window.removeEventListener("scroll", measure, true)
            }
        }, [frozen, measureLetters])
        React.useEffect(() => {
            if (frozen) {
                pending.current = null
                setPointer(null)
            }
            return () => {
                if (frame.current) window.cancelAnimationFrame(frame.current)
                frame.current = 0
            }
        }, [frozen])

        function schedule() {
            if (frame.current) return
            const tick = (time: number) => {
                frame.current = 0
                if (time - lastFrame.current < FRAME_MS) {
                    frame.current = window.requestAnimationFrame(tick)
                    return
                }
                lastFrame.current = time
                setPointer(pending.current)
            }
            frame.current = window.requestAnimationFrame(tick)
        }
        const value = React.useMemo(() => ({ pointer, epoch, reducedMotion, register }), [pointer, epoch, reducedMotion, register])
        if (frozen) return <Component {...props} ref={ref} />
        return <WordContext.Provider value={value}>
            <Component {...props} ref={ref}
                onMouseEnter={(event: React.MouseEvent<HTMLElement>) => {
                    props.onMouseEnter?.(event)
                    if (event.defaultPrevented) return
                    if (frame.current) window.cancelAnimationFrame(frame.current)
                    frame.current = 0
                    pending.current = { x: event.clientX, y: event.clientY }
                    // Re-measure resting letter boxes once, before the first
                    // painted weight update. Do not feed changed widths back.
                    measureLetters()
                    setPointer(pending.current)
                }}
                onMouseMove={(event: React.MouseEvent<HTMLElement>) => {
                    props.onMouseMove?.(event)
                    if (event.defaultPrevented) return
                    pending.current = { x: event.clientX, y: event.clientY }
                    schedule()
                }}
                onMouseLeave={(event: React.MouseEvent<HTMLElement>) => {
                    props.onMouseLeave?.(event)
                    if (event.defaultPrevented) return
                    pending.current = null
                    if (frame.current) window.cancelAnimationFrame(frame.current)
                    frame.current = 0
                    setPointer(null)
                }}
            />
        </WordContext.Provider>
    })
}

export function withSourceTypeLetter(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, forwardedRef) => {
        const frozen = useIsStaticRenderer() || RenderTarget.current() === RenderTarget.canvas
        const ownRef = React.useRef<HTMLElement | null>(null)
        const bounds = React.useRef<Bounds | null>(null)
        const [transitions, setTransitions] = React.useState<TransitionSet>(EMPTY_TRANSITIONS)
        const state = React.useContext(WordContext)
        const id = React.useId().replace(/[^a-zA-Z0-9_-]/g, "_")
        useOwnLayoutEffect(() => {
            if (frozen) return
            return state.register(() => {
                if (!ownRef.current) return
                const rect = ownRef.current.getBoundingClientRect()
                bounds.current = { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
            })
        }, [state.register, frozen])
        useOwnLayoutEffect(() => {
            if (!ownRef.current || frozen) return
            setTransitions(ownTransitions(ownRef.current, props.style))
        }, [frozen, props.style?.transition, props.style?.transitionProperty, props.style?.transitionDuration,
            props.style?.transitionTimingFunction, props.style?.transitionDelay])
        const weight = frozen ? MIN_WEIGHT : weightAt(state.pointer, bounds.current)
        const duration = frozen || state.pointer || state.reducedMotion ? "0s" : "0.5s"
        const selector = `[data-source-type-letter="${id}"]`
        const css = `${selector},${selector} *{font-variation-settings:"wght" var(${WEIGHT_PROPERTY},400)!important}`
        const style: VariableStyle = {
            ...props.style,
            [WEIGHT_PROPERTY]: weight,
            fontVariationSettings: `"wght" var(${WEIGHT_PROPERTY},400)`,
            ...(!frozen ? {
                transitionProperty: [...transitions.property, WEIGHT_PROPERTY].join(", "),
                transitionDuration: [...transitions.duration, duration].join(", "),
                transitionTimingFunction: [...transitions.timing, "ease"].join(", "),
                transitionDelay: [...transitions.delay, "0s"].join(", "),
            } : {}),
        }
        return <>
            <Component {...props}
                ref={(node: HTMLElement | null) => {
                    ownRef.current = node
                    if (typeof forwardedRef === "function") forwardedRef(node)
                    else if (forwardedRef) forwardedRef.current = node
                }}
                data-source-type-letter={id}
                data-source-type-weight={weight}
                data-source-type-bounds-epoch={state.epoch}
                style={style}
            />
            <style>{css}</style>
        </>
    })
}
