import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"

/** Source inspiration / HERO-010 — G!theimagineers, website by Index Studio.
 * https://www.gtheimagineers.com/en.html — inspected 2026-11-01.
 * Independent React motion for retained editable Framer circles. The public
 * site's six animation families and real chapter input were inspected; no
 * source website JavaScript is imported or executed. Native chapter variants,
 * copy, navigation, inner scrolling and authored static drawings remain intact.
 *
 * Home draws five rings once. Manifesto contracts six ellipses; Vision moves
 * 23 nested circles; Expertise circulates 15 tilted sections; Experience pulses
 * nine stacked circles; Contact moves five colliding balls under changing
 * gravity. Timing follows observed/source-supported durations. Contact uses
 * independent deterministic initial positions and a small fitted solver in
 * place of the source's random Matter.js world. Entry orientations are fixed
 * instead of randomly changing on every Home visit.
 *
 * Bind one group override to each graphic container and matching numbered
 * circle overrides to its native ellipse children, in source DOM order.
 * Canvas/export/thumbnail retain the authored still. Reduced motion holds the
 * authored native pose. One CPU RAF per visible group; no canvas, WebGL, media,
 * network, document-wide observer or extra pointer interception.
 */
type Mode = "home" | "home-left" | "home-right" | "manifesto" | "vision" | "expertise" | "experience" | "contact"
type LayerProps = { [key: string]: unknown; style?: React.CSSProperties }
type NativeLayer = ComponentType<LayerProps>
type Registry = { add: (index: number, node: HTMLElement) => () => void }
const RegistryContext = React.createContext<Registry | null>(null)
const mod = (n: number, d: number) => ((n % d) + d) % d
const cubic = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
const quint = (t: number) => t < .5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2
const clamp = (t: number) => Math.min(1, Math.max(0, t))
const mix = (a: number, b: number, t: number) => a + (b - a) * t
function assignRef(ref: React.ForwardedRef<HTMLElement>, node: HTMLElement | null) {
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
}
function frozenTarget() {
    const target = RenderTarget.current()
    return target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail
}
type Pose = { x: number; y: number; rx: number; ry: number; angle?: number; reveal?: number }
type Ball = { x: number; y: number; vx: number; vy: number }
function startBalls(): Ball[] {
    return [0, 1, 2, 3, 4].map(i => ({ x: 20 + mod(i * 29 + 7, 60), y: -20 - i * 49, vx: i % 2 ? -.45 : .5, vy: 0 }))
}
function physics(balls: Ball[], elapsed: number, dt: number, bottom: number) {
    const wave = clamp((Math.sin(elapsed * 1.2) + .8) / 1.3)
    const gravity = mix(-.1, .7, wave * wave * (3 - 2 * wave))
    const step = Math.min(20, dt * 1000) / (1000 / 60), radius = 17.5
    for (const b of balls) {
        b.vy += gravity * step
        b.x += b.vx * step; b.y += b.vy * step
        if (b.x < radius) { b.x = radius; b.vx = Math.abs(b.vx) * .8 }
        if (b.x > 100 - radius) { b.x = 100 - radius; b.vx = -Math.abs(b.vx) * .8 }
        if (b.y > bottom - radius) { b.y = bottom - radius; b.vy = -Math.abs(b.vy) * .8; b.vx *= .99 }
    }
    for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i], b = balls[j], dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy)
        if (!distance || distance >= 35) continue
        const nx = dx / distance, ny = dy / distance, half = (35 - distance) / 2
        a.x -= nx * half; a.y -= ny * half; b.x += nx * half; b.y += ny * half
        const approach = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
        if (approach < 0) { const impulse = -.9 * approach; a.vx -= impulse * nx; a.vy -= impulse * ny; b.vx += impulse * nx; b.vy += impulse * ny }
    }
}
function pose(mode: Mode, i: number, t: number, phone: boolean, ratio: number, balls: Ball[]): Pose {
    const delay = phone ? 0 : .1
    if (mode === "home-left" || mode === "home-right") {
        const index = mode === "home-left" ? 0 : i + 1
        return { x: mode === "home-left" ? 50 : i % 2 ? 75 : 25, y: mode === "home-left" ? 50 : i < 2 ? 25 : 75, rx: mode === "home-left" ? 48 : 24, ry: mode === "home-left" ? 48 : 24, reveal: cubic(clamp((t - index * .15) / 1.5)), angle: index * 71 }
    }
    if (mode === "home") {
        const radius = i ? 7 : 14
        return { x: i ? 75 + (i % 2 ? -7 : 7) : 25, y: i ? ratio / 2 + (i <= 2 ? -7 : 7) : ratio / 2, rx: radius, ry: radius, reveal: cubic(clamp((t - i * .15) / 1.5)), angle: i * 71 }
    }
    if (mode === "manifesto") {
        const age = Math.max(0, t - delay - i * .05), cycle = Math.floor(age / 3.6), p = quint(clamp(mod(age, 3.6) / 1.5))
        return { x: 50, y: 50, rx: mix(48, 48 - i * 43 / 5, cycle % 2 ? 1 - p : p), ry: 48 }
    }
    if (mode === "vision") {
        const age = Math.max(0, t - delay - (22 - i) * .03), cycle = Math.floor(age / 3.6), p = cubic(clamp(mod(age, 3.6) / 1.5)), offset = i * 1.2 - 2.4 * Math.max(0, i - 14)
        const target = 50 + (cycle % 2 ? -offset : offset), initial = cycle ? 50 + (cycle % 2 ? offset : -offset) : 50
        const radius = mix(48, 48 - 33 * i / 22, cubic(clamp(age / 1.5)))
        return { x: mix(initial, target, p), y: 50, rx: radius, ry: radius }
    }
    if (mode === "expertise") {
        const age = Math.max(0, t - delay - i * .02), amount = quint(clamp(age / 1.2)), a = mod(1 - i / 14 - t * .1, 1), cap = (.5 - Math.pow(Math.abs(a - .5) * 2, 1.5) * .5) * 55
        const r = Math.sqrt(Math.max(0, 110 * cap - cap * cap)), x = mix(50, 11 + 78 * a, amount), angle = -Math.PI / 6
        return { x: 50 + (x - 50) * Math.cos(angle), y: 50 + (x - 50) * Math.sin(angle), rx: mix(48, r * .5, amount), ry: mix(48, r, amount), angle: -30 }
    }
    if (mode === "experience") {
        const amount = cubic(clamp((t - delay - i * .05) / 1.5)), radius = mix(48, 39 + 9 * Math.sin(t * .8 + Math.PI * i / 9), amount)
        return { x: 50, y: 100 + (4 - i) * 9 * amount, rx: radius, ry: radius }
    }
    const b = balls[i % balls.length]
    return { x: b.x, y: b.y, rx: 17, ry: 17 }
}
const OWN_VARS = ["left", "top", "width", "height", "angle", "mask"] as const
const REDUCED_RULE = '@media(prefers-reduced-motion:reduce){[data-source-g-frozen="false"][data-source-g-motion] [data-source-g-circle]{transform:none!important}[data-source-g-frozen="false"][data-source-g-motion="expertise"] [data-source-g-circle]{transform:rotate(-30deg)!important}}'
const ACTIVE_RULE = '[data-source-g-circle][data-source-g-active="true"]{left:var(--source-g-left)!important;top:var(--source-g-top)!important;width:var(--source-g-width)!important;height:var(--source-g-height)!important;transform-origin:50% 50%!important;transform:translate(-50%,-50%) rotate(var(--source-g-angle))!important;mask-image:var(--source-g-mask,none)!important;-webkit-mask-image:var(--source-g-mask,none)!important}'
function clearPose(node: HTMLElement) {
    delete node.dataset.sourceGActive
    for (const key of OWN_VARS) node.style.removeProperty("--source-g-" + key)
}
function group(Component: NativeLayer, mode: Mode): NativeLayer {
    return React.forwardRef<HTMLElement, LayerProps>((props, forwarded) => {
        const [host, setHost] = React.useState<HTMLElement | null>(null), actors = React.useRef(new Map<number, HTMLElement>())
        const setNode = React.useCallback((node: HTMLElement | null) => { setHost(node); assignRef(forwarded, node) }, [forwarded])
        const frozen = useIsStaticRenderer() || frozenTarget()
        const [reduced, setReduced] = React.useState(false)
        const registry = React.useMemo<Registry>(() => ({ add(index, node) {
            actors.current.set(index, node)
            return () => { if (actors.current.get(index) === node) actors.current.delete(index); clearPose(node) }
        } }), [])
        React.useEffect(() => {
            if (frozen || !host) return
            const reduce = matchMedia("(prefers-reduced-motion: reduce)")
            let frame = 0, visible = false, disposed = false, elapsed = 0, last = 0, previousPaint = -Infinity, count = 0, balls = startBalls()
            const restore = () => { for (const node of actors.current.values()) clearPose(node); host.dataset.sourceGActors = String(actors.current.size) }
            const stop = () => { if (frame) cancelAnimationFrame(frame); frame = 0; last = 0; host.dataset.sourceGRunning = "false" }
            const tick = (now: number) => {
                frame = 0
                if (disposed || !visible || reduce.matches || document.hidden) { stop(); if (reduce.matches) { setReduced(true); restore() } return }
                const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now; elapsed += dt
                if (mode === "contact") physics(balls, elapsed, dt, host.clientHeight / Math.max(1, host.clientWidth) * 100)
                if (now - previousPaint >= 1000 / 30 - .5) {
                    previousPaint = now
                    const width = host.clientWidth, height = host.clientHeight, viewHeight = mode === "home" || mode === "contact" ? height / Math.max(1, width) * 100 : mode === "experience" ? 200 : 100
                    for (const [index, node] of actors.current) {
                        const p = pose(mode, index, elapsed, innerWidth < 1025, viewHeight, balls), s = node.style
                        s.setProperty("--source-g-left", `${p.x}%`); s.setProperty("--source-g-top", `${p.y / viewHeight * 100}%`)
                        s.setProperty("--source-g-width", `${2 * p.rx}%`); s.setProperty("--source-g-height", `${2 * p.ry / viewHeight * 100}%`)
                        s.setProperty("--source-g-angle", `${p.angle ?? 0}deg`)
                        s.setProperty("--source-g-mask", p.reveal === undefined || p.reveal >= 1 ? "none" : `conic-gradient(#000 ${p.reveal * 360}deg,transparent 0deg)`)
                        node.dataset.sourceGActive = "true"
                    }
                    host.dataset.sourceGTime = elapsed.toFixed(4); host.dataset.sourceGPaints = String(++count)
                }
                if (mode.startsWith("home") && elapsed >= 2.2) { stop(); return }
                host.dataset.sourceGRunning = "true"; frame = requestAnimationFrame(tick)
            }
            const update = () => { setReduced(reduce.matches); if (!visible || document.hidden || reduce.matches) { stop(); if (reduce.matches) restore() } else if (!frame && !(mode.startsWith("home") && elapsed >= 2.2)) frame = requestAnimationFrame(tick) }
            const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0); update() }, { threshold: 0 })
            setReduced(reduce.matches); observer.observe(host); reduce.addEventListener("change", update); document.addEventListener("visibilitychange", update)
            return () => { disposed = true; stop(); restore(); observer.disconnect(); reduce.removeEventListener("change", update); document.removeEventListener("visibilitychange", update) }
        }, [frozen, mode, host])
        const sizing: React.CSSProperties = frozen || reduced ? {} : mode === "home-left" || mode === "home-right" ? { width: "calc(100% - var(--source-g-home-padding, 200px))", height: "auto", aspectRatio: "1", flexShrink: 0 } : mode === "home" ? {} : mode === "contact" ? { width: "100%", height: "100%", flexShrink: 0 } : { width: mode === "experience" ? "90%" : "100%", maxWidth: mode === "experience" ? "40vh" : "60vh", height: "auto", aspectRatio: mode === "experience" ? "1 / 2" : "1", flexShrink: 0 }
        return <RegistryContext.Provider value={registry}><style>{ACTIVE_RULE + REDUCED_RULE + '@media(max-width:1024px) and (prefers-reduced-motion:no-preference){[data-source-g-frozen="false"][data-source-g-motion="home-left"],[data-source-g-frozen="false"][data-source-g-motion="home-right"]{--source-g-home-padding:60px}[data-source-g-frozen="false"][data-source-g-motion="manifesto"],[data-source-g-frozen="false"][data-source-g-motion="vision"],[data-source-g-frozen="false"][data-source-g-motion="expertise"]{width:65%!important;max-width:none!important}[data-source-g-frozen="false"][data-source-g-motion="experience"]{width:45%!important;max-width:none!important}[data-source-g-frozen="false"][data-source-g-motion="contact"]{height:110vw!important}}'}</style><Component {...props} style={{ ...props.style, ...sizing }} ref={setNode} data-source-g-motion={mode} data-source-g-frozen={String(frozen)} /></RegistryContext.Provider>
    })
}
function circle(Component: NativeLayer, index: number): NativeLayer {
    return React.forwardRef<HTMLElement, LayerProps>((props, forwarded) => {
        const registry = React.useContext(RegistryContext), release = React.useRef<(() => void) | null>(null)
        const setNode = React.useCallback((value: HTMLElement | null) => {
            release.current?.(); release.current = null
            if (value && registry) release.current = registry.add(index, value)
            assignRef(forwarded, value)
        }, [registry, forwarded])
        return <Component {...props} ref={setNode} data-source-g-circle={index} />
    })
}
export function withGHomeLeftMotion(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return group(Component, "home-left") }
export function withGHomeRightMotion(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return group(Component, "home-right") }
export function withGHomeMotion(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return group(Component, "home") }
export function withGManifestoMotion(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return group(Component, "manifesto") }
export function withGVisionMotion(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return group(Component, "vision") }
export function withGExpertiseMotion(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return group(Component, "expertise") }
export function withGExperienceMotion(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return group(Component, "experience") }
export function withGContactMotion(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return group(Component, "contact") }
export function withGCircle00(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 0) }
export function withGCircle01(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 1) }
export function withGCircle02(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 2) }
export function withGCircle03(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 3) }
export function withGCircle04(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 4) }
export function withGCircle05(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 5) }
export function withGCircle06(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 6) }
export function withGCircle07(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 7) }
export function withGCircle08(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 8) }
export function withGCircle09(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 9) }
export function withGCircle10(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 10) }
export function withGCircle11(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 11) }
export function withGCircle12(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 12) }
export function withGCircle13(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 13) }
export function withGCircle14(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 14) }
export function withGCircle15(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 15) }
export function withGCircle16(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 16) }
export function withGCircle17(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 17) }
export function withGCircle18(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 18) }
export function withGCircle19(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 19) }
export function withGCircle20(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 20) }
export function withGCircle21(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 21) }
export function withGCircle22(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return circle(Component, 22) }
