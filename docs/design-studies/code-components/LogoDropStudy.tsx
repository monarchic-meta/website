import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget, useIsStaticRenderer } from "framer"

// Original motion treatments of the existing Monarchic mark.
// Geometry: monarchic-meta/logo, commit 1844d35d6ffdedf2356ec929c36bb5c0454cf645.
// The two masks express circle XOR finite carrier, preserving the canonical
// diagonal negative space and horizontal end caps at the assembled pose.
type Mode = "drop" | "spring" | "echo"
type Status = "ready" | "running" | "paused" | "waiting" | "offscreen" | "reduced-motion" | "static"
interface Props {
    study?: Mode
    animate?: boolean
    canvasMotion?: boolean
    speed?: number
    stillPhase?: number
    travel?: number
    bounce?: number
    trail?: number
    scale?: number
    primary?: string
    accent?: string
    background?: string
    showLabels?: boolean
    style?: React.CSSProperties
}
const LOGO_CIRCLE_PATH = "M645.32365472,293.63834253 C606.48376029,269.85249606 560.82665278,256.13573892 512,256.13573892 C370.81799556,256.13573892 256.13573892,370.81799556 256.13573892,512 C256.13573892,575.28945904 279.18199112,633.25359671 317.33050769,677.94842518 C334.85033964,698.47467244 355.55544436,716.20224207 378.67634528,730.36165747 C417.51623971,754.14750394 463.17334722,767.86426108 512,767.86426108 C653.18200444,767.86426108 767.86426108,653.18200444 767.86426108,512 C767.86426108,448.71054096 744.81800888,390.74640329 706.66949231,346.05157482 C689.14966036,325.52532756 668.44455564,307.79775793 645.32365472,293.63834253 Z"
const LOGO_CARRIER_PATH = "M873.94267733,150.05732267 L767.86426108,150.05732267 L150.05732267,873.94267733 L256.13573892,873.94267733 Z"
const STUDIES = {
    drop: { key: "LG-05", title: "Gravity pass", note: "A line in free passage." },
    spring: { key: "LG-06", title: "Magnetic catch", note: "Fall. Catch. Release." },
    echo: { key: "LG-07", title: "Signal fall", note: "One carrier. Repeated signal." },
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const smooth = (t: number) => t * t * (3 - 2 * t)
function carrierPose(mode: Mode, phase: number, travel = 1, bounce = .65) {
    const p = ((phase % 1) + 1) % 1
    let y = 0
    if (mode === "spring") {
        if (p < .08) y = -1120
        else if (p < .26) y = -1120 + (1120 + 110 * bounce) * Math.pow((p - .08) / .18, 2)
        else if (p < .46) {
            const t = (p - .26) / .20
            y = 110 * bounce * Math.cos(t * Math.PI * 4) * Math.exp(-t * 4) * (1 - smooth(t))
        } else if (p < .72) y = 0
        else if (p < .94) y = 1120 * Math.pow((p - .72) / .22, 2)
        else y = 1120
    } else {
        const entryEnd = mode === "echo" ? .42 : .48
        const exitStart = mode === "echo" ? .62 : .56
        if (p < .08) y = -1120
        else if (p < entryEnd) {
            const t = (p - .08) / (entryEnd - .08)
            y = -1120 * (1 - (mode === "echo" ? smooth(t) : t * t))
        } else if (p < exitStart) y = 0
        else if (p < .92) y = 1120 * Math.pow((p - exitStart) / (.92 - exitStart), mode === "echo" ? 1.25 : 2)
        else y = 1120
    }
    const moving = travel > 0 && Math.abs(y) > 1 && Math.abs(y) < 1119
    // At small scale or travel, the bar can remain in view at the wrap. Fade
    // both its ink and its cut to the unbroken circle before resetting above.
    const opacity = travel <= 0 ? 1 : smooth(clamp(p / .04, 0, 1)) * smooth(clamp((1 - p) / .04, 0, 1))
    return { y: y * travel, opacity, echoY: y * travel - 94, echoOpacity: mode === "echo" && moving ? .28 : 0 }
}

interface MotionEntry {
    root: HTMLDivElement
    target: "canvas" | "preview"
    enabled: boolean
    speed: number
    phase: number
    visible: boolean
    pinned: number
    last: number
    drawn: number
    render: (phase: number) => void
    notify: (status: Status) => void
}
interface MotionClock {
    add: (entry: MotionEntry) => void
    remove: (entry: MotionEntry) => void
    wake: () => void
    request: (entry: MotionEntry) => void
}
const MOTION_KEY = Symbol.for("monarchic.logo-vector-motion.v1")
function getMotionClock(): MotionClock {
    const realm = window as unknown as { [key: symbol]: MotionClock | undefined }
    if (realm[MOTION_KEY]) return realm[MOTION_KEY]!
    const entries = new Set<MotionEntry>()
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    let frame = 0
    const tick = (time: number) => {
        frame = 0
        const candidates = [...entries].filter(e => e.enabled && e.speed > 0 && e.visible && !document.hidden && !reduced.matches)
            .sort((a, b) => b.pinned - a.pinned || Math.abs(a.root.getBoundingClientRect().top) - Math.abs(b.root.getBoundingClientRect().top))
        // SVG allocates no GPU contexts or image buffers. Yield motion slots to
        // existing WebGL studies when both kinds are visible in the same window.
        const gpu = (window as unknown as { [key: symbol]: { debug?: () => { live?: { target: string }[] } } | undefined })[Symbol.for("monarchic.gpu-budget.v2")]?.debug?.()
        let editor = Math.max(0, 1 - (gpu?.live?.filter(e => e.target === "canvas").length ?? 0))
        let preview = Math.max(0, 2 - (gpu?.live?.filter(e => e.target === "preview").length ?? 0))
        const running = new Set<MotionEntry>()
        for (const e of candidates) {
            if (e.target === "canvas" ? editor-- > 0 : preview-- > 0) running.add(e)
        }
        for (const e of entries) {
            if (!running.has(e)) {
                e.last = time
                e.notify(reduced.matches ? "reduced-motion" : !e.enabled || e.speed <= 0 ? "paused" : !e.visible || document.hidden ? "offscreen" : "waiting")
                continue
            }
            const delta = e.last ? Math.min(.1, (time - e.last) / 1000) : 0
            e.last = time
            e.phase = (e.phase + delta * e.speed / 4.5) % 1
            const interval = 1000 / (e.target === "canvas" ? 12 : 30)
            if (time - e.drawn + .01 >= interval) {
                e.render(e.phase)
                e.drawn = time
            }
            e.notify("running")
        }
        if (candidates.length) frame = requestAnimationFrame(tick)
    }
    const wake = () => { if (!frame && entries.size) frame = requestAnimationFrame(tick) }
    const clock: MotionClock = {
        add(e) {
            if (!entries.size) {
                document.addEventListener("visibilitychange", wake)
                reduced.addEventListener("change", wake)
            }
            entries.add(e); wake()
        },
        remove(e) {
            entries.delete(e)
            if (!entries.size) {
                cancelAnimationFrame(frame); frame = 0
                document.removeEventListener("visibilitychange", wake)
                reduced.removeEventListener("change", wake)
            }
        },
        request(e) { e.pinned = performance.now(); wake() },
        wake,
    }
    realm[MOTION_KEY] = clock
    return clock
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 600
 */
export default function LogoDropStudy(props: Props) {
    const { study = "drop", animate = true, canvasMotion = false, speed = .8, stillPhase = 50,
        travel = 1, bounce = .65, trail = .5, scale = 1, primary = "#171717", accent = "#171717",
        background = "#f2f2f2", showLabels = true, style } = props
    const target = RenderTarget.current(), staticRenderer = useIsStaticRenderer()
    const canvasOptIn = target === RenderTarget.canvas && canvasMotion
    const frozen = target === RenderTarget.export || target === RenderTarget.thumbnail || (staticRenderer && !canvasOptIn) || (target === RenderTarget.canvas && !canvasMotion)
    const root = React.useRef<HTMLDivElement>(null)
    const motion = React.useRef<MotionEntry | null>(null)
    const clock = React.useRef<MotionClock | null>(null)
    const config = React.useRef({ study, travel, bounce, trail })
    config.current = { study, travel, bounce, trail }
    const [paused, setPaused] = React.useState(false)
    const [status, setStatus] = React.useState<Status>(frozen ? "static" : "ready")
    const statusRef = React.useRef<Status>(frozen ? "static" : "ready")
    const id = "logo-drop-" + React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const still = clamp(stillPhase, 0, 99.99) / 100
    const paint = React.useCallback((phase: number) => {
        if (!root.current) return
        const c = config.current, pose = carrierPose(c.study, phase, clamp(c.travel, 0, 1.5), clamp(c.bounce, 0, 1.5))
        root.current.querySelectorAll("[data-drop-carrier]").forEach(node => {
            node.setAttribute("transform", `translate(0 ${pose.y})`)
            node.setAttribute("opacity", String(pose.opacity))
        })
        root.current.querySelectorAll("[data-drop-echo]").forEach((node, i) => {
            node.setAttribute("transform", `translate(0 ${pose.echoY - i * 94})`)
            node.setAttribute("opacity", String(pose.echoOpacity * clamp(c.trail, 0, 1) * (i ? .45 : 1)))
        })
        root.current.dataset.motionPhase = String(phase)
        root.current.dataset.carrierY = String(pose.y)
    }, [])
    React.useLayoutEffect(() => {
        paint(still)
        if (frozen || !root.current) { setStatus("static"); statusRef.current = "static"; return }
        const notify = (next: Status) => {
            if (next !== statusRef.current) { statusRef.current = next; setStatus(next) }
        }
        const entry: MotionEntry = { root: root.current, target: target === RenderTarget.canvas ? "canvas" : "preview", enabled: animate && !paused,
            speed: Math.max(0, speed), phase: .08, visible: false, pinned: 0, last: 0, drawn: 0, render: paint, notify }
        const shared = getMotionClock(); clock.current = shared; motion.current = entry
        const observer = new IntersectionObserver(records => { entry.visible = records[0]?.isIntersecting ?? false; shared.wake() })
        observer.observe(root.current); shared.add(entry)
        return () => { observer.disconnect(); shared.remove(entry); motion.current = null; clock.current = null }
    }, [frozen, target])
    React.useLayoutEffect(() => {
        const entry = motion.current
        if (entry) { entry.enabled = animate && !paused; entry.speed = Math.max(0, speed); clock.current?.wake() }
    }, [animate, paused, speed])
    React.useLayoutEffect(() => {
        paint(still)
        if (motion.current) motion.current.phase = still
    }, [study, still, travel, bounce, trail, paint])
    const initial = carrierPose(study, still, clamp(travel, 0, 1.5), clamp(bounce, 0, 1.5))
    const source = STUDIES[study], mono: React.CSSProperties = { fontFamily: "monospace", fontSize: 10, lineHeight: 1.5, letterSpacing: ".045em" }
    const pale = primary
    return <div ref={root} role="group" aria-label={source.title} data-logo-drop={study} data-motion-status={status}
        style={{ width: "100%", height: "100%", ...style, position: "relative", overflow: "hidden", background, color: pale }}>
        <svg role="img" aria-label={source.title + ", animated Monarchic logo " + source.key} viewBox="0 0 1440 1024" preserveAspectRatio="xMidYMid meet"
            style={{ display: "block", width: "100%", height: "100%", overflow: "hidden" }}>
            <defs>
                <mask id={id + "-circle"} x="-1800" y="-1800" width="4600" height="4600" maskUnits="userSpaceOnUse" style={{ maskType: "luminance" }}>
                    <rect x="-1800" y="-1800" width="4600" height="4600" fill="white" />
                    <g data-drop-carrier transform={`translate(0 ${initial.y})`} opacity={initial.opacity}><path d={LOGO_CARRIER_PATH} fill="black" /></g>
                </mask>
                <mask id={id + "-outside"} x="-1800" y="-1800" width="4600" height="4600" maskUnits="userSpaceOnUse" style={{ maskType: "luminance" }}>
                    <rect x="-1800" y="-1800" width="4600" height="4600" fill="white" />
                    <path d={LOGO_CIRCLE_PATH} fill="black" />
                </mask>
                <pattern id={id + "-dots"} patternUnits="userSpaceOnUse" width="12" height="12"><circle cx="2" cy="2" r="1" fill={primary} opacity=".11" /></pattern>
            </defs>
            {study === "echo" && <rect width="1440" height="1024" fill={`url(#${id}-dots)`} />}
            <g transform={`translate(720 512) scale(${.92 * clamp(scale, .5, 1.5)}) translate(-512 -512)`}>
                <g fill="none" stroke={primary} opacity={study === "echo" ? .13 : .08} strokeWidth="1">
                    <path d="M-140 512H1164M512-140V1164" />
                    <circle cx="512" cy="512" r="346" strokeDasharray="2 14" />
                </g>
                <path d={LOGO_CIRCLE_PATH} fill={primary} mask={`url(#${id}-circle)`} />
                {study === "echo" && [0, 1].map(i => <g key={i} data-drop-echo transform={`translate(0 ${initial.echoY - i * 94})`} opacity={initial.echoOpacity * trail * (i ? .45 : 1)}>
                    <path d={LOGO_CARRIER_PATH} fill="none" stroke={accent} strokeWidth="3" />
                </g>)}
                <g mask={`url(#${id}-outside)`}><g data-drop-carrier transform={`translate(0 ${initial.y})`} opacity={initial.opacity}><path d={LOGO_CARRIER_PATH} fill={accent} /></g></g>
                <g fill={primary} opacity=".45"><rect x="-132" y="503" width="1" height="18" /><rect x="1155" y="503" width="1" height="18" /></g>
            </g>
        </svg>
        {showLabels && <>
            <div style={{ ...mono, position: "absolute", left: "5%", top: "6%", pointerEvents: "none" }}><span style={{ opacity: .6 }}>{source.key} / KINETIC BRAND MARK</span><div style={{ fontSize: 17, letterSpacing: "-.04em", marginTop: 6 }}>{source.title}</div></div>
            <div style={{ ...mono, position: "absolute", left: "5%", bottom: "5%", opacity: .6 }}>MONARCHIC / {source.key}</div>
            <div style={{ ...mono, position: "absolute", right: "5%", bottom: "5%", fontSize: 8, opacity: .6, textAlign: "right" }}>EXISTING MARK / ORIGINAL MOTION</div>
        </>}
        {!frozen && <button aria-label={paused || status === "waiting" ? "Play animation" : "Pause animation"} aria-pressed={paused}
            disabled={!animate || speed <= 0 || status === "reduced-motion"} onClick={() => {
                if (status === "waiting") { setPaused(false); if (motion.current) clock.current?.request(motion.current) }
                else setPaused(p => !p)
            }} style={{ ...mono, position: "absolute", top: "6%", right: "5%", color: pale, border: "1px solid currentColor", background: "transparent", padding: "5px 9px", cursor: "pointer", opacity: .7 }}>
            {status === "reduced-motion" ? "REDUCED MOTION" : !animate || speed <= 0 ? "MOTION OFF" : paused || status === "waiting" ? "PLAY" : "PAUSE"}
        </button>}
    </div>
}
addPropertyControls(LogoDropStudy, {
    study: { type: ControlType.Enum, title: "Study", options: ["drop", "spring", "echo"], optionTitles: ["Gravity pass", "Magnetic catch", "Signal fall"], defaultValue: "drop" },
    animate: { type: ControlType.Boolean, title: "Animate", defaultValue: true },
    canvasMotion: { type: ControlType.Boolean, title: "Canvas motion", defaultValue: false },
    speed: { type: ControlType.Number, title: "Speed", min: 0, max: 2, step: .05, defaultValue: .8 },
    stillPhase: { type: ControlType.Number, title: "Still phase", min: 0, max: 99.5, step: .5, defaultValue: 50 },
    travel: { type: ControlType.Number, title: "Travel", min: 0, max: 1.5, step: .05, defaultValue: 1 },
    bounce: { type: ControlType.Number, title: "Bounce", min: 0, max: 1.5, step: .05, defaultValue: .65, hidden: p => p.study !== "spring" },
    trail: { type: ControlType.Number, title: "Echo", min: 0, max: 1, step: .05, defaultValue: .5, hidden: p => p.study !== "echo" },
    scale: { type: ControlType.Number, title: "Scale", min: .5, max: 1.5, step: .05, defaultValue: 1 },
    primary: { type: ControlType.Color, title: "Circle", defaultValue: "#171717" },
    accent: { type: ControlType.Color, title: "Line", defaultValue: "#171717" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#f2f2f2" },
    showLabels: { type: ControlType.Boolean, title: "Labels", defaultValue: true },
})
