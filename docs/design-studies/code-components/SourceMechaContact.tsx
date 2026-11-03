import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"
import { withMechaTomorrowDetailRoot, withMechaTomorrowDetailBackground } from "./SourceMechaTomorrowDetail.tsx"

/**
 * SOURCE INSPIRATION / HERO-015 / MECHA / Widelab, Grzegorz Leśniewicz.
 * Contact opening, native editable form/typography and independent Phone scroll.
 * Fresh anonymous original-site inspection: contact-opening-v2, fourteen states.
 * The original contact/preloader scripts and genuine GLB match retained bytes.
 * Native source fonts, inputs, artwork and exact authored links have separate
 * model/Preview gates. This prototype never sends a form or invents success.
 * The existing Tomorrow sheet remains composed, with its bodies unchanged.
 */
type Phase = "closed" | "opening" | "open" | "closing"
type Event = { defaultPrevented?: boolean; key?: string; repeat?: boolean; currentTarget?: EventTarget | null; preventDefault?: () => void }
type Props = {
    [key: string]: unknown
    children?: React.ReactNode
    style?: React.CSSProperties
    tabIndex?: number
    onClick?: React.MouseEventHandler<HTMLElement>
    onTap?: (event: Event, info?: unknown) => void
    onKeyDown?: React.KeyboardEventHandler<HTMLElement>
}
type Geometry = { width: number; height: number; rem: number; phone: boolean }
type State = Geometry & { phase: Phase; frozen: boolean; reduced: boolean; id: string; show: (trigger: HTMLElement | null) => void; hide: () => void; register: (key: string, node: HTMLElement | null) => void }
const Context = React.createContext<State>({ width: 1440, height: 900, rem: 16, phone: false, phase: "closed", frozen: true, reduced: false, id: "", show: () => {}, hide: () => {}, register: () => {} })
const EASE = "cubic-bezier(.82,0,.18,1)"
const FADE = `linear(${Array.from({ length: 129 }, (_, index) => { const t = index / 128; return `${Number((t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2).toFixed(9))} ${t * 100}%` }).join(",")})`
const REVISION = {}
const OPEN_MS = 1950
const CLOSE_MS = 1120
function writeRef(ref: React.ForwardedRef<HTMLElement>, node: HTMLElement | null) { if (typeof ref === "function") ref(node); else if (ref) ref.current = node }
function sourceRem(width: number) {
    const span = width <= 479 ? [375, 479, 16, 18] : width <= 767 ? [479, 767, 16, 18] : width <= 991 ? [767, 991, 16, 18] : width <= 1440 ? [991, 1440, 11, 16] : width <= 1920 ? [1440, 1920, 16, 21] : [1920, 2400, 21, 26]
    return span[2] + (width - span[0]) / (span[1] - span[0]) * (span[3] - span[2])
}
function scrollerFor(root: HTMLElement) {
    for (let node = root.parentElement; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
        if (/auto|scroll/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight) return node
    }
    return null
}
function contactProvider(Component: ComponentType<Props>): ComponentType<Props> {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const target = RenderTarget.current(), frozen = useIsStaticRenderer() || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail
        const [host, setHost] = React.useState<HTMLElement | null>(null), [phase, setPhase] = React.useState<Phase>("closed"), [reduced, setReduced] = React.useState(false)
        const [geometry, setGeometry] = React.useState<Geometry>({ width: 1440, height: 900, rem: 16, phone: false })
        const parts = React.useRef(new Map<string, HTMLElement>()), trigger = React.useRef<HTMLElement | null>(null), reducedNow = React.useRef(reduced)
        reducedNow.current = reduced
        const id = "mecha-contact-" + React.useId().replace(/[^\w-]/g, "_")
        const register = React.useCallback((key: string, node: HTMLElement | null) => { if (node) parts.current.set(key, node); else parts.current.delete(key) }, [])
        const attach = React.useCallback((node: HTMLElement | null) => { setHost(node); writeRef(ref, node) }, [ref])
        React.useLayoutEffect(() => {
            if (!host || frozen) { setPhase("closed"); return }
            const motion = matchMedia("(prefers-reduced-motion: reduce)")
            const read = () => { const width = window.innerWidth; setGeometry({ width, height: window.innerHeight, rem: sourceRem(width), phone: width <= 991 }); setReduced(motion.matches) }
            read(); window.addEventListener("resize", read); motion.addEventListener("change", read)
            return () => { window.removeEventListener("resize", read); motion.removeEventListener("change", read) }
        }, [host, frozen, REVISION])
        React.useEffect(() => {
            if (frozen || phase === "closed" || phase === "open") return
            if (reduced) { setPhase(phase === "opening" ? "open" : "closed"); return }
            const timer = window.setTimeout(() => setPhase(phase === "opening" ? "open" : "closed"), phase === "opening" ? OPEN_MS : CLOSE_MS)
            return () => window.clearTimeout(timer)
        }, [frozen, phase, reduced])
        const active = !frozen && phase !== "closed"
        React.useLayoutEffect(() => {
            if (!active || !host) return
            const container = scrollerFor(host), owner = container ?? document.documentElement
            const gutter = !container && window.innerWidth > document.documentElement.clientWidth
            const properties = gutter ? ["overflow-y", "overscroll-behavior-y", "scrollbar-gutter"] : ["overflow-y", "overscroll-behavior-y"]
            const leases = properties.map(name => ({ name, value: owner.style.getPropertyValue(name), priority: owner.style.getPropertyPriority(name) }))
            if (gutter) owner.style.setProperty("scrollbar-gutter", "stable", "important")
            owner.style.setProperty("overflow-y", "hidden", "important"); owner.style.setProperty("overscroll-behavior-y", "contain", "important")
            if (container) container.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); else window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
            parts.current.get("close")?.focus({ preventScroll: true })
            const key = (event: KeyboardEvent) => { if (!event.defaultPrevented && event.key === "Escape") { event.preventDefault(); setPhase(reducedNow.current ? "closed" : "closing") } }
            window.addEventListener("keydown", key)
            return () => {
                window.removeEventListener("keydown", key)
                for (const lease of leases) {
                    const own = lease.name === "overflow-y" ? "hidden" : lease.name === "scrollbar-gutter" ? "stable" : "contain"
                    if (owner.style.getPropertyValue(lease.name) !== own || owner.style.getPropertyPriority(lease.name) !== "important") continue
                    if (lease.value) owner.style.setProperty(lease.name, lease.value, lease.priority); else owner.style.removeProperty(lease.name)
                }
                if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true })
            }
        }, [active, host])
        // Source opening resets the background Lenis position, but leaves the
        // modal wrap’s independent scroll position intact across reopenings.
        const show = (node: HTMLElement | null) => { if (frozen || phase !== "closed") return; trigger.current = node; setPhase(reduced ? "open" : "opening") }
        const hide = () => { if (!frozen && phase !== "closed" && phase !== "closing") setPhase(reduced ? "closed" : "closing") }
        const state = { ...geometry, phase, frozen, reduced, id, register, show, hide }
        return <Context.Provider value={state}><Component {...props} ref={attach} data-mecha-contact-state={phase}><style>{`[data-mecha-contact-text] p,[data-mecha-contact-text] span{font-family:inherit!important;font-size:inherit!important;font-weight:inherit!important;line-height:inherit!important;letter-spacing:inherit!important;color:inherit!important;margin:0!important}[data-mecha-contact-field] input,[data-mecha-contact-field] textarea{font-family:inherit!important;font-size:inherit!important;font-weight:inherit!important;line-height:inherit!important;letter-spacing:inherit!important;color:inherit!important;background:transparent!important;width:100%!important;height:100%!important;min-height:0!important;padding:0!important;border:0!important;border-radius:0!important;resize:none}`}</style>{props.children}</Component></Context.Provider>
    })
}
function useNode(key: string | null, ref: React.ForwardedRef<HTMLElement>) {
    const { register } = React.useContext(Context), [node, setNode] = React.useState<HTMLElement | null>(null)
    const attach = React.useCallback((value: HTMLElement | null) => { setNode(value); if (key) register(key, value); writeRef(ref, value) }, [key, register, ref])
    return [node, attach] as const
}
function useActivation(action: (node: HTMLElement | null) => void, frozen: boolean) {
    const last = React.useRef<{ channel: string; time: number } | null>(null)
    return (channel: string, event: Event) => {
        if (frozen || event.repeat) return
        const time = performance.now(), previous = last.current
        if (previous && previous.channel !== channel && time - previous.time < 350) return
        // Consume a caller-cancelled tap/click too: its alternate synthetic
        // channel is the same physical gesture and must not reopen the panel.
        last.current = { channel, time }
        if (event.defaultPrevented) return
        event.preventDefault?.()
        action(event.currentTarget instanceof HTMLElement ? event.currentTarget : null)
    }
}
type Motion = { transform?: string; opacity?: number }
function useMotion(node: HTMLElement | null, state: State, target: Motion, duration: number, openDelay: number, ease = EASE, closeDelay = 0) {
    const running = React.useRef<Animation | null>(null), previous = React.useRef<Motion | null>(null), lastTarget = React.useRef<Motion | null>(null)
    const key = JSON.stringify(target)
    React.useLayoutEffect(() => {
        const priorTarget = lastTarget.current; lastTarget.current = target
        if (!node || state.frozen || state.reduced || state.phase === "closed" || state.phase === "open" || !duration || !Object.keys(target).length) { running.current?.cancel(); running.current = null; previous.current = null; return }
        const before = getComputedStyle(node), initial: Motion = previous.current ?? priorTarget ?? { ...(target.transform !== undefined ? { transform: before.transform } : {}), ...(target.opacity !== undefined ? { opacity: Number(before.opacity) } : {}) }
        running.current?.cancel()
        previous.current = null
        if (JSON.stringify(initial) === key) return
        const animation = node.animate([initial, target], { duration, delay: state.phase === "opening" ? openDelay : closeDelay, easing: ease, fill: "backwards" })
        running.current = animation
        animation.onfinish = () => { animation.cancel(); if (running.current === animation) running.current = null }
        return () => { const painted = getComputedStyle(node); previous.current = { ...(target.transform !== undefined ? { transform: painted.transform } : {}), ...(target.opacity !== undefined ? { opacity: Number(painted.opacity) } : {}) }; animation.onfinish = null; animation.cancel(); if (running.current === animation) running.current = null }
    }, [node, state.phase, state.frozen, state.reduced, key, duration, openDelay, closeDelay, ease])
}
type Role = "overlay" | "background" | "fader" | "wrap" | "form-pane" | "form" | "title" | "badge" | "badge-art" | "headlines" | "title-mask" | "title-first" | "title-second" | "subtitle-mask" | "subtitle" | "fields" | "field-mask" | "wide-field-mask" | "name" | "email" | "message" | "input" | "textarea" | "label" | "rule" | "send" | "send-label" | "model-pane" | "model-clip" | "graphic" | "close" | "close-label" | "divider"
function styleFor(role: Role, s: State): React.CSSProperties {
    const r = s.rem, phone = s.phone, active = s.phase !== "closed", close = s.phase === "closing", padding = phone ? 16 : 28, titleSize = s.width <= 767 ? 2 : phone ? 3.25 : 3.75, titleLine = s.width <= 767 ? 1.02 : phone ? .96 : .92
    const flow: React.CSSProperties = { position: "relative", top: "auto", left: "auto", right: "auto", bottom: "auto", minWidth: 0, flex: "0 0 auto" }
    const text: React.CSSProperties = { fontFamily: '"Neue Haas Grotesk",Arial,sans-serif', fontSize: r, lineHeight: 1.5, letterSpacing: "normal", fontWeight: 400, color: "#c5f0f7" }
    switch (role) {
        case "overlay": return { position: "fixed", inset: 0, width: "100%", height: "100dvh", display: active ? "block" : "none", opacity: active ? 1 : 0, overflow: "hidden", zIndex: 2147483647, background: "transparent", pointerEvents: active ? "auto" : "none" }
        case "background": return { position: "absolute", inset: 0, width: "100%", height: "100%", background: "#911a46", transform: close || !active ? "translateY(100%)" : "translateY(0%)", zIndex: 1 }
        case "fader": return { position: "absolute", inset: 0, width: "100%", height: "100%", background: "rgba(255,255,255,.5)", opacity: close || !active ? 0 : 1, zIndex: 0 }
        case "wrap": return { position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: phone ? "column" : "row", overflowY: phone ? "auto" : "visible", overflowX: phone ? "hidden" : "visible", overscrollBehaviorY: "contain", transform: close ? "translateY(100%)" : "translateY(0%)", zIndex: 2 }
        case "form-pane": return { ...flow, position: phone ? "static" : "relative", width: phone ? "100%" : "auto", flex: phone ? "0 0 auto" : "1 1 0", height: phone ? "auto" : "100%", padding: phone ? "0 16px" : 0, display: "flex", alignItems: "center", justifyContent: "center" }
        case "form": return { ...flow, position: phone ? "static" : "relative", width: "100%", maxWidth: phone ? "100%" : 32.5 * r, height: "auto", display: "flex", flexDirection: "column", gap: (phone ? 3.75 : 4) * r, paddingBottom: phone ? 16 : 0 }
        case "title": return { ...flow, position: phone ? "static" : "relative", width: "100%", height: "auto", display: "flex", flexDirection: "column", alignItems: phone ? "flex-start" : "center", gap: 2 * r, textAlign: phone ? "left" : "center" }
        case "badge": return { ...(phone ? { position: "absolute", left: padding, top: 20, zIndex: 5 } : flow), width: 8.3125 * r, height: 1.5625 * r, overflow: s.phase === "open" ? "visible" : "clip" }
        case "badge-art": return { ...flow, width: "100%", height: "100%", transform: active ? "translateY(0%)" : "translateY(150%)" }
        case "headlines": return { ...flow, width: "100%", height: "auto", display: "flex", flexDirection: "column", alignItems: phone ? "flex-start" : "center" }
        case "title-mask": return { ...flow, width: "100%", height: titleSize * titleLine * r, fontSize: titleSize * r, clipPath: "inset(0 0 -0.3em 0)", overflow: "visible" }
        case "title-first": case "title-second": return { ...flow, ...text, width: "100%", height: "100%", fontFamily: '"Flecha M",Georgia,serif', fontSize: titleSize * r, lineHeight: titleLine, letterSpacing: "-.02em", textAlign: phone ? "left" : "center", whiteSpace: "pre", transform: active ? "translateY(0%)" : "translateY(150%)" }
        case "subtitle-mask": return { ...flow, width: "100%", height: 1.5 * r, marginTop: (phone ? 1 : 1.25) * r, overflow: "clip" }
        case "subtitle": return { ...flow, ...text, width: "100%", height: "100%", textAlign: phone ? "left" : "center", transform: active ? "translateY(0%)" : "translateY(150%)" }
        case "fields": return { ...flow, width: "100%", height: "auto", display: "grid", gridTemplateColumns: phone ? "1fr" : "1fr 1fr", columnGap: 1.25 * r, rowGap: 1.75 * r }
        case "field-mask": case "wide-field-mask": return { ...flow, width: "100%", height: "auto", overflow: s.phase === "open" ? "visible" : "clip", gridColumn: role === "wide-field-mask" ? "1 / -1" : "auto" }
        case "name": case "email": case "message": return { ...flow, width: "100%", height: "auto", display: "flex", flexDirection: "column", gap: .75 * r, paddingBottom: .75 * r, gridColumn: role === "message" ? "1 / -1" : "auto", transform: active ? "translateY(0%)" : "translateY(150%)", overflow: "hidden" }
        case "label": return { ...flow, ...text, width: "100%", height: phone ? 15 : .9375 * r, fontSize: phone ? 10 : .625 * r, lineHeight: 1.5, textTransform: "uppercase" }
        case "input": case "textarea": return { ...flow, ...text, width: "100%", height: (role === "textarea" ? 3.8125 : 1.25) * r, minHeight: (role === "textarea" ? 3.8125 : 1.25) * r, lineHeight: 1.44, letterSpacing: ".02em", padding: 0, border: 0, borderRadius: 0, background: "transparent", outlineOffset: 3, resize: "none" }
        case "rule": return { position: "absolute", bottom: 0, left: 0, width: "100%", height: 1, background: "rgba(197,240,247,.3)" }
        case "send": return { ...flow, width: "100%", minHeight: 6.25 * r, height: 6.25 * r, gridColumn: "1 / -1", display: "flex", alignItems: "flex-end", padding: 1.0625 * r, background: "#c5f0f7", color: "#262933", cursor: "pointer", transform: active ? "translateY(0%)" : "translateY(150%)" }
        case "send-label": return { ...flow, ...text, width: "auto", height: 1.5 * r, color: "#262933" }
        case "model-pane": return { ...flow, order: phone ? -1 : 0, width: phone ? "100%" : 35 * r, height: phone ? "50dvh" : "100%", padding: phone ? "48px 16px" : padding, display: "flex", alignItems: "center", justifyContent: "center" }
        case "model-clip": return { ...flow, width: phone ? "90%" : "100%", maxWidth: phone ? "none" : 26.25 * r, height: phone ? "90%" : "auto", aspectRatio: phone ? "auto" : "2 / 3", overflow: "clip", display: "flex", alignItems: "center", justifyContent: "center", transform: active ? "translateY(0%)" : "translateY(100%)", opacity: active ? 1 : 0 }
        case "graphic": return { ...flow, width: "100%", height: phone ? "50dvh" : "100%", minHeight: phone ? "50dvh" : "70dvh", flexShrink: 0 }
        case "close": return { position: "absolute", right: padding, top: phone ? 20 : padding, width: 5 * r, height: 1.5 * r, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transform: active ? "translateX(0px)" : `translateX(${3 * r}px)`, opacity: active ? 1 : 0 }
        case "close-label": return { ...flow, ...text, width: "auto", height: 1.5 * r }
        case "divider": return { position: "absolute", top: 0, right: 0, width: 1, height: "100%", background: "rgba(197,240,247,.3)", display: phone ? "none" : "block", transformOrigin: "50% 0%", transform: active ? "scaleY(1)" : "scaleY(0)" }
    }
}
function role(Component: ComponentType<Props>, name: Role): ComponentType<Props> {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const s = React.useContext(Context), [node, attach] = useNode(name === "close" || name === "wrap" ? name : null, ref)
        const close = s.phase === "closing", contentPhase = React.useRef(s.phase)
        if (!close) contentPhase.current = s.phase
        const mask = name === "badge" || name === "field-mask" || name === "wide-field-mask"
        const own = styleFor(name, close && mask ? { ...s, phase: contentPhase.current } : s), motion: Motion = {}
        let duration = 0, delay = 0, ease = EASE
        if (name === "background" || name === "wrap") { motion.transform = String(own.transform); duration = 900; delay = name === "background" ? 150 : 0 }
        if (name === "fader") { motion.opacity = Number(own.opacity); duration = 400; delay = 0; ease = FADE }
        if (name === "model-clip") { motion.transform = String(own.transform); motion.opacity = Number(own.opacity); duration = 900; delay = 250 }
        if (["title-first", "title-second", "subtitle"].includes(name)) { motion.transform = String(own.transform); duration = 1000; delay = name === "title-first" ? 610 : name === "title-second" ? 690 : 770 }
        if (["badge-art", "name", "email", "message", "send", "close", "divider"].includes(name)) { if (own.transform) motion.transform = String(own.transform); if (own.opacity !== undefined) motion.opacity = Number(own.opacity); duration = 1000; delay = 950 }
        // Closing keeps the content fixed inside the translating source wrap;
        // its fader waits.72s before its.4s fade. No new renderer is involved.
        const animationState = close && !["background", "wrap", "fader"].includes(name) ? { ...s, phase: contentPhase.current } : s
        useMotion(node, animationState, motion, duration, delay, ease, name === "fader" ? 720 : 0)
        return <Component {...props} ref={attach} data-mecha-contact-role={name} data-mecha-contact-text={!s.frozen && ["title-first", "title-second", "subtitle", "label", "send-label", "close-label"].includes(name) ? "" : undefined} data-mecha-contact-field={!s.frozen && (name === "input" || name === "textarea") ? "" : undefined}
            {...(name === "overlay" ? { id: s.id, role: "dialog", "aria-modal": s.phase !== "closed" || undefined, "aria-label": "MECHA / Contact", "aria-hidden": s.phase === "closed" } : {})}
            style={s.frozen ? props.style : { ...props.style, ...own }} />
    })
}
export function withMechaContactRoot(Component: ComponentType<Props>): ComponentType<Props> { return withMechaTomorrowDetailRoot(contactProvider(Component)) }
export function withMechaContactTrigger(Component: ComponentType<Props>): ComponentType<Props> {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const s = React.useContext(Context), activate = useActivation(s.show, s.frozen)
        return <Component {...props} ref={ref} role="button" tabIndex={props.tabIndex ?? 0} aria-controls={s.id} aria-expanded={s.phase !== "closed"}
            onClick={(event: React.MouseEvent<HTMLElement>) => { props.onClick?.(event); activate("click", event) }} onTap={(event: Event, info?: unknown) => { props.onTap?.(event, info); activate("tap", event) }}
            onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => { props.onKeyDown?.(event); if (event.key === "Enter" || event.key === " ") activate("key", event) }} />
    })
}
export function withMechaContactClose(Component: ComponentType<Props>): ComponentType<Props> {
    const Layer = role(Component, "close")
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const s = React.useContext(Context), activate = useActivation(() => s.hide(), s.frozen)
        return <Layer {...props} ref={ref} role="button" tabIndex={0} aria-label="Close contact"
            onClick={(event: React.MouseEvent<HTMLElement>) => { props.onClick?.(event); activate("click", event) }} onTap={(event: Event, info?: unknown) => { props.onTap?.(event, info); activate("tap", event) }}
            onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => { props.onKeyDown?.(event); if (event.key === "Enter" || event.key === " ") activate("key", event) }} />
    })
}
function pushed(Component: ComponentType<Props>): ComponentType<Props> {
    return React.forwardRef<HTMLElement, Props>((props, ref) => {
        const s = React.useContext(Context), [node, attach] = useNode(null, ref), active = s.phase === "opening" || s.phase === "open"
        const transform = [props.style?.transform, `translateY(${active ? -200 : 0}px)`].filter(Boolean).join(" ")
        useMotion(node, s, { transform }, 1200, 0)
        return <Component {...props} ref={attach} style={s.frozen ? props.style : { ...props.style, transform }} />
    })
}
export function withMechaContactPage(Component: ComponentType<Props>): ComponentType<Props> { return withMechaTomorrowDetailBackground(pushed(Component)) }
export function withMechaContactOverlay(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "overlay") }
export function withMechaContactBackground(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "background") }
export function withMechaContactFader(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "fader") }
export function withMechaContactWrap(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "wrap") }
export function withMechaContactFormPane(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "form-pane") }
export function withMechaContactForm(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "form") }
export function withMechaContactTitle(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "title") }
export function withMechaContactBadge(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "badge") }
export function withMechaContactBadgeArt(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "badge-art") }
export function withMechaContactHeadlines(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "headlines") }
export function withMechaContactTitleMask(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "title-mask") }
export function withMechaContactTitleFirst(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "title-first") }
export function withMechaContactTitleSecond(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "title-second") }
export function withMechaContactSubtitleMask(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "subtitle-mask") }
export function withMechaContactSubtitle(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "subtitle") }
export function withMechaContactFields(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "fields") }
export function withMechaContactFieldMask(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "field-mask") }
export function withMechaContactWideFieldMask(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "wide-field-mask") }
export function withMechaContactName(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "name") }
export function withMechaContactEmail(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "email") }
export function withMechaContactMessage(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "message") }
export function withMechaContactInput(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "input") }
export function withMechaContactMessageInput(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "textarea") }
export function withMechaContactFieldLabel(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "label") }
export function withMechaContactRule(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "rule") }
export function withMechaContactSend(Component: ComponentType<Props>): ComponentType<Props> {
    const Layer = role(Component, "send")
    return React.forwardRef<HTMLElement, Props>((props, ref) => <Layer {...props} ref={ref} role="button" tabIndex={0} onClick={(event: React.MouseEvent<HTMLElement>) => { props.onClick?.(event); event.preventDefault() }} onTap={(event: Event, info?: unknown) => { props.onTap?.(event, info); event.preventDefault?.() }} />)
}
export function withMechaContactSendLabel(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "send-label") }
export function withMechaContactModelPane(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "model-pane") }
export function withMechaContactModelClip(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "model-clip") }
export function withMechaContactGraphic(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "graphic") }
export function withMechaContactCloseLabel(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "close-label") }
export function withMechaContactDivider(Component: ComponentType<Props>): ComponentType<Props> { return role(Component, "divider") }
