import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget, useIsStaticRenderer } from "framer"

// SOURCE INSPIRATION / HERO-012 / Mezmo / https://www.mezmo.com/
// Current AURA marketing terminal, independently authored from actual Enter,
// streaming, config/Escape and Phone observations. Native source-brand heading,
// CTA, gradients and following features remain editable outside this component.
// This is a prerecorded study simulation. No original behavior JS, backend,
// infrastructure tools, telemetry, external commands or fetch calls are used.
// Scenario prose is independently summarized; source ANSI brand is represented
// as editable DOM glyph cells. Exact original transcript/typing times unclaimed.

type ContainerStyle = React.CSSProperties & { containerType?: "inline-size"; containerName?: string }
type Props = { animate?: boolean; canvasMotion?: boolean; paused?: boolean; stillStage?: number; showPlayback?: boolean; style?: React.CSSProperties }
type Row = { at: number; text: string; color?: string }
const colors = { text: "#c6d1d8", muted: "#88959e", yellow: "#ffe134", purple: "#e66de4", green: "#9ee84c", cyan: "#6ed4dd" }
const prompts = ["investigate the recent payment failures", "prepare a safe remediation plan", "apply the reviewed fix and verify recovery", ""]
const durations = [0, 13.5, 7.5, 8]
const stageRows: Row[][] = [[], [
    { at: .3, text: "● Investigation started", color: colors.purple },
    { at: 1.2, text: "  cluster_inspector → inspect workload health", color: colors.cyan },
    { at: 2.4, text: "  ├ payments: elevated errors after the last rollout" },
    { at: 4.1, text: "  └ dependency checks: healthy", color: colors.muted },
    { at: 5.8, text: "  metrics_analyst → compare error and latency signals", color: colors.cyan },
    { at: 7.6, text: "  ├ failures align with the new application version" },
    { at: 9.4, text: "  └ previous version remains a recovery candidate", color: colors.muted },
    { at: 11.2, text: "✓ Evidence collected. A reviewed rollback is recommended.", color: colors.green },
    { at: 12.6, text: "  Press Enter to prepare the proposed change.", color: colors.yellow },
], [
    { at: .4, text: "● Preparing remediation", color: colors.purple },
    { at: 1.5, text: "  remediator → draft a bounded rollback", color: colors.cyan },
    { at: 3, text: "  Plan: restore the previous version, then check health." },
    { at: 4.6, text: "  Approval required before applying this simulated change.", color: colors.yellow },
    { at: 6.4, text: "  Press Enter to approve and verify recovery.", color: colors.yellow },
], [
    { at: .4, text: "● Approval received", color: colors.purple },
    { at: 1.8, text: "  remediator → apply the reviewed version", color: colors.cyan },
    { at: 3.4, text: "  cluster_inspector → workload ready", color: colors.cyan },
    { at: 5.1, text: "  metrics_analyst → errors returning to baseline", color: colors.cyan },
    { at: 6.5, text: "✓ Recovery verified.", color: colors.green },
    { at: 7.6, text: "This simulation is complete. Type /reset to replay.", color: colors.yellow },
]]
// Genuine short AURA ANSI brand artwork observed in the original terminal.
const AURA_WORDMARK = [" █████╗ ██╗   ██╗██████╗  █████╗ ","██╔══██╗██║   ██║██╔══██╗██╔══██╗","███████║██║   ██║██████╔╝███████║","██╔══██║██║   ██║██╔══██╗██╔══██║","██║  ██║╚██████╔╝██║  ██║██║  ██║","╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝"]
const configuration = `# AURA configuration\n[agent]\nname = "sre-agent"\nmode = "reviewed"\n\n[workers]\ninspect = "workload health"\nanalyze = "metric summary"\nremediate = "approval required"\n\n[safety]\nexternal_actions = false\nreplay = "/reset"`
function Logo() {
    const palette = ["#7cbed1", "#9ea6ce", "#ad8bc6", "#e0ba80", "#e4cbb0", "#ce91c1"]
    return <div className="source-mezmo-wordmark" aria-label="AURA" data-mezmo-aura-logo="true" style={{ marginBottom: 54, width: "max-content", fontSize: 12, lineHeight: "15px", letterSpacing: 0 }}>
        {AURA_WORDMARK.map((row, y) => <div key={y} aria-hidden="true" style={{ whiteSpace: "pre", height: 15 }}>{Array.from(row).map((glyph, x) => <span key={x} style={{ color: palette[Math.floor(x / 3) % palette.length] }}>{glyph}</span>)}</div>)}
    </div>
}

/** Current-original terminal aperture; native scene text and CTA stay outside. */
export default function SourceMezmoTerminal({ animate = true, canvasMotion = false, paused = false, stillStage = 0, showPlayback = true, style }: Props) {
    const target = RenderTarget.current(), staticRenderer = useIsStaticRenderer()
    const frozen = staticRenderer || target === RenderTarget.export || target === RenderTarget.thumbnail || (target === RenderTarget.canvas && !canvasMotion)
    const [host, setHost] = React.useState<HTMLDivElement | null>(null), [visible, setVisible] = React.useState(false), [reduced, setReduced] = React.useState(false)
    const [stage, setStage] = React.useState(0), [elapsed, setElapsed] = React.useState(0), [input, setInput] = React.useState<string | null>(null)
    const [held, setHeld] = React.useState(false), [config, setConfig] = React.useState(false), [stream, setStream] = React.useState(false), [extra, setExtra] = React.useState<string[]>([])
    const inputID = React.useId()
    const clock = React.useRef(0), last = React.useRef(0), tick = React.useRef(0), frame = React.useRef(0), inputRef = React.useRef<HTMLInputElement | null>(null), scrollRef = React.useRef<HTMLDivElement | null>(null)
    const effectiveStage = frozen ? Math.max(0, Math.min(3, Math.round(stillStage))) : stage
    const effectiveTime = frozen || reduced ? durations[effectiveStage] : elapsed
    const running = !frozen && animate && !paused && !held && visible && !config && !reduced
    React.useEffect(() => {
        if (!host) return
        let current = true
        const observer = new IntersectionObserver(rows => { if (current && host.isConnected) setVisible(rows.some(row => row.target === host && row.isIntersecting)) })
        observer.observe(host)
        const media = matchMedia("(prefers-reduced-motion: reduce)"), change = () => setReduced(media.matches)
        change(); media.addEventListener("change", change)
        const visibility = () => { if (document.hidden) setVisible(false); else observer.unobserve(host), observer.observe(host) }
        document.addEventListener("visibilitychange", visibility)
        return () => { current = false; observer.disconnect(); media.removeEventListener("change", change); document.removeEventListener("visibilitychange", visibility) }
    }, [host])
    React.useEffect(() => {
        if (!running) { last.current = 0; return }
        let active = true; const rate = target === RenderTarget.canvas ? 1000 / 12 : 1000 / 24
        const limit = stage === 0 ? prompts[0].length * .035 : durations[stage]
        const next = (now: number) => {
            if (!active) return
            if (last.current) clock.current = Math.min(limit, clock.current + Math.min(.1, (now - last.current) / 1000))
            last.current = now
            if (now - tick.current >= rate) { tick.current = now; setElapsed(clock.current) }
            if (clock.current < limit) frame.current = requestAnimationFrame(next)
            else { setElapsed(clock.current); last.current = 0; frame.current = 0 }
        }
        frame.current = requestAnimationFrame(next)
        return () => { active = false; cancelAnimationFrame(frame.current); frame.current = 0; last.current = 0 }
    }, [running, target, stage])
    React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [effectiveStage, effectiveTime, extra, stream])
    React.useEffect(() => { if (!config) return; const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setConfig(false); inputRef.current?.focus() } }; window.addEventListener("keydown", escape); return () => window.removeEventListener("keydown", escape) }, [config])
    const complete = effectiveTime >= durations[effectiveStage]
    const pretyped = effectiveStage === 0 ? prompts[0].slice(0, Math.floor((frozen || reduced ? 100 : effectiveTime) / .035)) : ""
    const reset = () => { setStage(0); clock.current = 0; setElapsed(0); setInput(null); setExtra([]); setStream(false) }
    const submit = (event: React.FormEvent) => {
        event.preventDefault(); if (frozen || held || paused || !animate || !visible) return
        const value = (input ?? "").trim()
        if (value.startsWith("/")) {
            if (value === "/reset") reset()
            else if (value === "/clear") setExtra([])
            else if (value === "/stream") { setStream(value => !value); setExtra(rows => [...rows.slice(-8), "Event stream toggled."]) }
            else setExtra(rows => [...rows.slice(-8), "Commands: /reset  /stream  /clear  /help"])
            setInput(""); return
        }
        if (stage > 0 && !complete) return
        if (stage < 3) { setStage(value => value + 1); clock.current = 0; setElapsed(0); setInput(null) }
    }
    const history = Array.from({ length: effectiveStage }, (_, index) => index + 1)
    return <div ref={setHost} onClick={(event: React.MouseEvent<HTMLDivElement>) => { if (!frozen && !(event.target instanceof Element && event.target.closest("button,input,[role=dialog]"))) inputRef.current?.focus() }} data-source-reference="HERO-012" data-source-current-original="https://www.mezmo.com/" data-mezmo-stage={effectiveStage} data-mezmo-time={effectiveTime.toFixed(3)} data-mezmo-paused={held || paused} data-mezmo-visible={visible} data-mezmo-frozen={frozen} data-mezmo-stream={stream}
        style={{ ...style, position: "relative", width: style?.width ?? "100%", height: style?.height ?? 522, minWidth: 0, color: colors.text, background: "#0b0e11", borderRadius: 6, overflow: "hidden", boxShadow: "0 0 10px #a484c7", font: "11px/1.48 ui-monospace,SFMono-Regular,Consolas,monospace", letterSpacing: ".055em", containerType: "inline-size", containerName: "source-mezmo" } as ContainerStyle}>
        <style>{"@container source-mezmo (max-width: 600px){.source-mezmo-wordmark{display:none}}"}</style>
        <div aria-hidden="true" style={{ height: 23, display: "flex", alignItems: "center", gap: 6, paddingLeft: 7, background: "#bdbdbd" }}>{["#ff4c64", "#ffcb28", "#00d832"].map(color => <span key={color} style={{ width: 10, height: 10, borderRadius: "50%", border: "1px solid #0003", background: color }} />)}</div>
        <div ref={scrollRef} role="log" aria-label="AURA prerecorded study output" aria-live="polite" aria-relevant="additions" style={{ height: "calc(100% - 62px)", overflow: "auto", padding: "25px 15px 15px", overflowWrap: "anywhere", scrollbarWidth: "thin" }}>
            <Logo />
            <div style={{ marginBottom: 16 }}><span style={{ color: colors.purple }}>aura-cli v0.1.6</span><span style={{ color: colors.muted }}> · http://localhost:8080 (server v0.1.6)</span></div>
            <div style={{ color: colors.yellow }}>Agent</div><div>  sre-agent <span style={{ color: colors.muted }}>— coordinator</span></div>
            <div style={{ color: colors.yellow }}>Workers</div>
            <div>  cluster_inspector <span style={{ color: colors.muted }}>— workload state and events</span></div>
            <div>  metrics_analyst <span style={{ color: colors.muted }}>— errors and latency</span></div>
            <div>  remediator <span style={{ color: colors.muted }}>— reviewed recovery plan</span></div>
            <div style={{ color: "#d4aa00", margin: "16px 0" }}>This website feature is interactive.<br />Please click here then hit Enter to continue</div>
            {history.map(phase => <section key={phase} data-mezmo-phase={phase}>
                <div style={{ margin: "12px 0 10px" }}><span style={{ color: colors.green }}>❯ </span>{prompts[phase - 1]}</div>
                {stageRows[phase].filter(row => phase < effectiveStage || row.at <= effectiveTime).map((row, index) => <div key={index} data-mezmo-row={index} style={{ color: row.color ?? colors.text, whiteSpace: "pre-wrap" }}>{row.text}</div>)}
            </section>)}
            {stream && <aside aria-label="Simulated event stream" style={{ borderLeft: `2px solid ${colors.cyan}`, paddingLeft: 8, marginTop: 12, color: colors.muted }}>STREAM · {stageRows[effectiveStage].filter(row => row.at <= effectiveTime).length} recorded events</aside>}
            {extra.map((row, index) => <div key={index} style={{ color: colors.muted }}>{row}</div>)}
            <form onSubmit={submit} style={{ display: "flex", gap: 7, marginTop: 14 }}>
                <label htmlFor={inputID} style={{ color: colors.green }}>❯</label>
                <input id={inputID} ref={inputRef} aria-label="Terminal command" value={input ?? (effectiveStage === 0 ? pretyped : complete ? prompts[Math.min(3, effectiveStage)] : "")} readOnly={frozen || held || paused} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setInput(event.target.value)} onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => { if (event.key === "c" && event.ctrlKey) { event.preventDefault(); setInput("") } }} autoComplete="off" spellCheck={false}
                    style={{ width: "100%", minWidth: 0, border: 0, outline: 0, padding: 0, background: "transparent", color: colors.text, font: "inherit", letterSpacing: "inherit", caretColor: running ? colors.green : "transparent" }} />
            </form>
        </div>
        <div style={{ position: "absolute", bottom: 10, left: 12, right: 12, display: "flex", justifyContent: "space-between", gap: 8 }}>
            {showPlayback && !frozen ? <button aria-pressed={held || paused} onClick={() => setHeld(value => !value)} style={{ border: 0, padding: "4px 6px", background: "transparent", color: colors.muted, font: "inherit" }}>{held || paused ? "RESUME" : "PAUSE"}</button> : <span />}
            <button aria-expanded={config} onClick={() => { if (!frozen) setConfig(value => !value) }} style={{ border: "1px solid #252a30", borderRadius: 6, padding: "6px 10px", color: colors.text, background: "#11151a", font: "inherit" }}><span style={{ color: colors.yellow }}>{"{}"}</span> config.toml</button>
        </div>
        {config && <div role="dialog" aria-modal="true" aria-label="Study configuration" style={{ position: "absolute", inset: 0, background: "#080a0de8", padding: 20, overflow: "auto" }}>
            <button autoFocus aria-label="Close configuration" onClick={() => { setConfig(false); inputRef.current?.focus() }} style={{ float: "right", border: "1px solid #515a66", background: "#11151a", color: colors.text, padding: 6 }}>Close ×</button>
            <pre style={{ whiteSpace: "pre-wrap", color: colors.cyan, font: "inherit", marginTop: 40 }}>{configuration}</pre>
        </div>}
    </div>
}
addPropertyControls(SourceMezmoTerminal, {
    animate: { type: ControlType.Boolean, defaultValue: true }, canvasMotion: { type: ControlType.Boolean, defaultValue: false, title: "Canvas motion" }, paused: { type: ControlType.Boolean, defaultValue: false },
    stillStage: { type: ControlType.Number, min: 0, max: 3, step: 1, defaultValue: 0 }, showPlayback: { type: ControlType.Boolean, defaultValue: true },
})
