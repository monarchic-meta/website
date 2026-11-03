import * as React from "react"
import { createPortal } from "react-dom"
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
type Row = { at: number; text: string; color?: string; detail?: boolean }
type TranscriptEntry = { key: number; kind: "phase"; phase: number; expanded: boolean; prompt: string } | { key: number; kind: "text"; text: string; color?: string }
const colors = { text: "#c6d1d8", muted: "#88959e", yellow: "#ffe134", purple: "#e66de4", green: "#9ee84c", cyan: "#6ed4dd" }
const prompts = ["investigate the recent payment failures", "how do i remediate this?", "go ahead and apply the fix", ""]
const durations = [0, 13.5, 7.5, 8]
const stageRows: Row[][] = [[], [
    { at: .3, text: "● Investigation started", color: colors.purple },
    { at: 1.2, text: "  cluster_inspector → inspect workload health", color: colors.cyan },
    { at: 2.4, text: "  ├ payments: elevated errors after the last rollout", detail: true },
    { at: 4.1, text: "  └ dependency checks: healthy", color: colors.muted, detail: true },
    { at: 5.8, text: "  metrics_analyst → compare error and latency signals", color: colors.cyan },
    { at: 7.6, text: "  ├ failures align with the new application version", detail: true },
    { at: 9.4, text: "  └ previous version remains a recovery candidate", color: colors.muted, detail: true },
    { at: 11.2, text: "✓ Evidence collected. A reviewed rollback is recommended.", color: colors.green },
    { at: 12.6, text: "  Press Enter to prepare the proposed change.", color: colors.yellow },
], [
    { at: .4, text: "● Preparing remediation", color: colors.purple },
    { at: 1.5, text: "  remediator → draft a bounded rollback", color: colors.cyan },
    { at: 3, text: "  Plan: restore the previous version, then check health.", detail: true },
    { at: 4.6, text: "  Approval required before applying this simulated change.", color: colors.yellow },
    { at: 6.4, text: "  Press Enter to approve and verify recovery.", color: colors.yellow },
], [
    { at: .4, text: "● Approval received", color: colors.purple },
    { at: 1.8, text: "  remediator → apply the reviewed version", color: colors.cyan },
    { at: 3.4, text: "  cluster_inspector → workload ready", color: colors.cyan },
    { at: 5.1, text: "  metrics_analyst → errors returning to baseline", color: colors.cyan },
    { at: 6.5, text: "✓ Recovery verified.", color: colors.green },
    { at: 7.6, text: "This simulation is complete. Type /help for available commands.", color: colors.yellow },
]]
// Genuine short AURA ANSI brand artwork observed in the original terminal.
const AURA_WORDMARK = [" █████╗ ██╗   ██╗██████╗  █████╗ ","██╔══██╗██║   ██║██╔══██╗██╔══██╗","███████║██║   ██║██████╔╝███████║","██╔══██║██║   ██║██╔══██╗██╔══██║","██║  ██║╚██████╔╝██║  ██║██║  ██║","╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝"]
// Genuine public display data; never parsed as configuration or executed.
const configuration = "# Kubernetes SRE incident-response coordinator.\n#\n# Runs in orchestration mode with three specialist workers and a workflow\n# worker that fronts human-in-the-loop approvals. Boots inside k3s on the\n# demo EC2 box; rendered into the pod from a Helm values ConfigMap.\n#\n# Prerequisites (all in-cluster):\n#   • OPENAI_API_KEY         — pulled from AWS SSM at pod boot\n#   • MEZMO_API_KEY          — Mezmo service account, log:read scope\n#   • PAGERDUTY_TOKEN        — workflow MCP uses it to page on-call\n#   • kubernetes-mcp-server  — read tools + resources_create_or_update\n#   • prometheus-mcp-server  — points at prometheus.otel-demo:9090\n#\n# Usage (local):\n#   CONFIG_PATH=config.toml cargo run --bin aura-web-server\n\n# ── LLM Provider ────────────────────────────────────────────────────\n[llm]\nprovider = \"openai\"\napi_key = \"{{ env.OPENAI_API_KEY }}\"\nmodel = \"gpt-4o-mini\"\nmax_tokens = 4096\n\n# ── MCP Tool Servers ────────────────────────────────────────────────\n[mcp]\n# OpenAI strict-mode rejects schemas with anyOf unions, missing types, or\n# bare optional params. Mezmo's MCP in particular ships schemas that need\n# this normalization to round-trip cleanly through function calling.\nsanitize_schemas = true\n\n# Kubernetes — cluster inspection + write path (gated by HITL approval).\n# https://github.com/containers/kubernetes-mcp-server\n[mcp.servers.kubernetes]\ntransport = \"http_streamable\"\nurl = \"http://kubernetes-mcp-server:8080/mcp\"\ndescription = \"Kubernetes cluster operations: pods, deployments, events, logs, resources_create_or_update\"\n\n# Prometheus — PromQL queries against the otel-demo Prometheus.\n# https://github.com/pab1it0/prometheus-mcp-server\n[mcp.servers.prometheus]\ntransport = \"http_streamable\"\nurl = \"http://prometheus-mcp-server:8080/mcp\"\ndescription = \"Prometheus metrics, instant + range queries, targets, metadata\"\n\n# Mezmo — log search, trace topology, root-cause analysis.\n# https://docs.mezmo.com/docs/mezmo-mcp\n[mcp.servers.mezmo]\ntransport = \"http_streamable\"\nurl = \"https://mcp.mezmo.com/mcp\"\ndescription = \"Mezmo log analysis, trace topology, RCA, log histograms\"\n\n[mcp.servers.mezmo.headers]\nAuthorization = \"Bearer {{ env.MEZMO_API_KEY }}\"\n\n# Workflow — fronts on-call paging via PagerDuty for HITL approvals on any\n# state-modifying tool call (e.g. resources_create_or_update).\n[mcp.servers.workflow]\ntransport = \"http_streamable\"\nurl = \"http://workflow-mcp:8080/mcp\"\ndescription = \"On-call approvals, audit trail, PagerDuty paging\"\n\n[mcp.servers.workflow.headers]\nAuthorization = \"Token {{ env.PAGERDUTY_TOKEN }}\"\n\n# ── Agent ───────────────────────────────────────────────────────────\n[agent]\nname = \"Kubernetes SRE Agent\"\nalias = \"kubernetes-sre\"\nmodel_owner = \"mezmo\"\nturn_depth = 20\nmax_tokens = 4096\nsystem_prompt = \"\"\"\nYou are an SRE incident-response coordinator running against a live\nOpenTelemetry demo deployment in the `otel-demo` namespace. The user is\ninteracting through a terminal and expects concise, incident-style updates.\n\nThree specialists are available:\n- cluster_inspector — reads pod state, deployments, events, and container\n  logs. Use when symptoms are about availability, restarts, or recent\n  rollouts. Also holds the gated `resources_create_or_update` tool used\n  to apply approved remediations.\n- metrics_analyst — runs PromQL against the demo's Prometheus. Use to\n  confirm symptoms with numbers (error rates, p95 latency, saturation)\n  and to scope blast radius across services.\n- mezmo_analyst — analyzes logs and trace topology in Mezmo. Use first\n  when the surface symptom is a downstream effect (cascading failures,\n  payment errors traced back to a slow upstream) — Mezmo's trace\n  topology and RCA tools collapse N error lines into one signature.\n\nA fourth worker (`workflow_orchestrator`) handles human-in-the-loop\napprovals; route any state-modifying action through it before execution.\n\nOperating rules:\n1. The default namespace is `otel-demo`. State it explicitly in tool args.\n2. Prefer dispatching to multiple workers in parallel when symptoms span\n   domains.\n3. State a hypothesis from the evidence, then verify it before concluding.\n4. Be terse. Bullet points. Cite specific pod names and metric values.\n5. State-modifying actions (rollbacks, scale changes, image patches) MUST\n   be approved via `request_approval_from_oncall` before execution. The\n   audit trail of who approved what is captured automatically.\n6. End every investigation with a one-line root cause and blast radius.\n\"\"\"\n\n# ── Orchestration ───────────────────────────────────────────────────\n[orchestration]\nenabled = true\nmax_planning_cycles = 2\nquality_threshold = 0.7\nallow_direct_answers = true\nallow_clarification = false\n# \"summary\" — workers see only a summary of available tools during\n# planning, then the full schema during execution. Keeps planning prompts\n# small without losing dispatch fidelity.\ntools_in_planning = \"summary\"\n\n[orchestration.timeouts]\nper_call_timeout_secs = 120\n\n[orchestration.artifacts]\nmemory_dir = \"/tmp/aura-orchestration\"\n\n# ── Workers ─────────────────────────────────────────────────────────\n\n[orchestration.worker.cluster_inspector]\ndescription = \"Kubernetes cluster inspection: pod status, container logs, deployments, services, events, node health. Holds the gated resources_create_or_update tool for approved remediations.\"\nturn_depth = 10\nmcp_filter = [\n  # read\n  \"configuration_view\",\n  \"events_list\",\n  \"namespaces_list\",\n  \"nodes_log\",\n  \"nodes_stats_summary\",\n  \"nodes_top\",\n  \"pods_get\",\n  \"pods_list\",\n  \"pods_list_in_namespace\",\n  \"pods_log\",\n  \"pods_top\",\n  \"resources_get\",\n  \"resources_list\",\n  # write — only invoked after request_approval_from_oncall succeeds\n  \"resources_create_or_update\",\n]\npreamble = \"\"\"\nYou are a Kubernetes cluster specialist for an OpenTelemetry demo running\nin the `otel-demo` namespace. Use read-only tools to inspect pod health,\nfetch container logs, list events, and check node status.\n\nTriage workflow:\n1. pods_list_in_namespace(namespace=\"otel-demo\") — find non-Running pods.\n2. For any suspect pod: events_list and pods_log (tail=200). Logs are the\n   ground truth; events explain why a pod is in its current phase.\n3. resources_get for the owning Deployment to see image tags and recent\n   ReplicaSet revisions.\n\nWhen asked to apply a remediation:\n- NEVER call resources_create_or_update directly.\n- Hand off to workflow_orchestrator first; only proceed once you receive\n  an approval token from request_approval_from_oncall.\n- After applying, poll pods_list_in_namespace until the new ReplicaSet is\n  Ready and the old one has fully drained.\n\nAlways specify `namespace=\"otel-demo\"`. Report findings as:\n`<pod> <phase> <reason> — <one-line evidence>`. Do not speculate beyond\nwhat the tools return.\n\"\"\"\n\n[orchestration.worker.metrics_analyst]\ndescription = \"Prometheus metrics analysis: PromQL queries for CPU, memory, latency, error rates; check alerts, targets, and metric metadata\"\nturn_depth = 10\nmcp_filter = [\n  \"execute_query\",\n  \"execute_range_query\",\n  \"get_metric_metadata\",\n  \"get_targets\",\n  \"health_check\",\n  \"list_metrics\",\n]\npreamble = \"\"\"\nYou are a Prometheus metrics specialist. The demo emits OpenTelemetry\nmetrics scraped by Prometheus at http://prometheus.otel-demo:9090.\n\nWorkflow:\n1. list_metrics(filter_pattern=…) to discover the right metric. Common\n   patterns: \"http_server\", \"rpc\", \"process_cpu\", \"container_memory\".\n2. execute_query for instant values; execute_range_query (last 15m,\n   step=30s) to see a trend.\n3. For latency regressions: histogram_quantile(0.95, sum(rate(\n   rpc_server_duration_milliseconds_bucket{service_name=\"...\"}[5m]))\n   by (le)).\n4. For error budgets: rate(http_server_errors_total[5m]) /\n   rate(http_server_requests_total[5m]) by (service_name).\n\nBe decisive. Report numbers with units. Flag any series above a sane SLO\n(error rate >1%, p95 latency >500ms, memory >85% of limit) explicitly.\nA clean step change with no ramp is the fingerprint of a deploy/config\nevent, not load.\n\"\"\"\n\n[orchestration.worker.mezmo_analyst]\ndescription = \"Mezmo log + trace analysis: trace topology, degraded service edges, root-cause analysis, log histograms, cross-service correlation timelines\"\nturn_depth = 10\nmcp_filter = [\n  \"find_trace_analysis_component\",\n  \"find_degraded_service_edges\",\n  \"get_service_failure_rates\",\n  \"analyze_logs_for_root_cause_relative_time\",\n  \"analyze_logs_for_root_cause_time_range\",\n  \"group_logs_by_field\",\n  \"get_log_histogram\",\n  \"get_correlated_timeline_relative_time\",\n  \"get_current_time\",\n]\npreamble = \"\"\"\nYou are a Mezmo specialist. Use Mezmo's trace topology + RCA tools to\ndisentangle cascading failures BEFORE diving into individual log lines.\n\nCascade-triage workflow:\n1. find_trace_analysis_component — locate the trace source for the\n   pipeline.\n2. find_degraded_service_edges — produces a ranked list of slow / erroring\n   service-to-service edges. The single common downstream node is almost\n   always the root cause.\n3. get_service_failure_rates — confirm which service is loudest vs. which\n   is the source. The loudest is typically the top of the cascade, not\n   the source.\n4. analyze_logs_for_root_cause_relative_time on each affected service —\n   this deduplicates N error lines into ~1-3 unique signatures.\n5. group_logs_by_field(field=\"msg\") on the suspected source — N+1\n   patterns appear as one msg with disproportionate count.\n6. get_log_histogram with a small bucket (1m or 30s) — clean step\n   changes pin deploy/config events; ramps suggest load.\n7. get_correlated_timeline_relative_time — orders the cascade end-to-end\n   so you can prove direction.\n\nReport the cascade as a one-line chain (`A → B → C`) and cite the\nT-offset where each link first lit up.\n\"\"\"\n\n[orchestration.worker.workflow_orchestrator]\ndescription = \"Human-in-the-loop approvals. Pages on-call via PagerDuty, captures the approval response and the dashboards reviewed, returns an approval token for downstream state-modifying actions.\"\nturn_depth = 5\nmcp_filter = [\n  \"request_approval_from_oncall\",\n]\npreamble = \"\"\"\nYou are the human-in-the-loop gateway. Any state-modifying action (image\npatch, scale change, restart, delete) routes through you BEFORE execution.\n\nUse `request_approval_from_oncall` with:\n- action: a one-line description of the proposed change in operational\n  terms (`patch deployment/X → image=Y`), not a kubectl command.\n- channel: `#sre-oncall` unless the user specifies otherwise.\n- priority: P1 for production-impacting cascades, P2 for contained\n  regressions, P3 for non-urgent.\n- justification: 1-2 sentences citing the strongest evidence (metric\n  delta, error count, link to a Mezmo dashboard).\n\nThe tool blocks until the on-call responds. On approval, surface the\napproval token AND the verbatim approval message back to the coordinator\nso the action call carries an audit trail. On denial, do NOT retry; ask\nthe user how to proceed.\n\"\"\"\n"

// Source's marketing shell uses a viewport drawer below its100px header,
// independently of the terminal aperture. Framer's header is inside its page
// stacking context, so clip only the backdrop below that94/78px header rather
// than covering it with the body portal. The sheet itself keeps source y100.
// The public266-line TOML stays
// display data; the terminal never connects to its listed infrastructure.
function ConfigurationDrawer({ reduced, close }: { reduced: boolean; close: () => void }) {
    const [closing, setClosing] = React.useState(false), [copyFeedback, setCopyFeedback] = React.useState({ text: "copy", version: 0 })
    const root = React.useRef<HTMLDivElement | null>(null), titleID = React.useId()
    const dismiss = () => { if (reduced) close(); else setClosing(true) }
    React.useLayoutEffect(() => { if (closing && reduced) close() }, [closing, reduced, close])
    React.useEffect(() => {
        if (copyFeedback.text === "copy") return
        const timer = window.setTimeout(() => setCopyFeedback(value => ({ ...value, text: "copy" })), 1200)
        return () => window.clearTimeout(timer)
    }, [copyFeedback])
    const copyConfiguration = () => {
        const feedback = (text: string) => setCopyFeedback(value => ({ text, version: value.version + 1 }))
        try {
            if (!navigator.clipboard) { feedback("n/a"); return }
            navigator.clipboard.writeText(configuration).then(() => feedback("copied"), () => feedback("n/a"))
        } catch { feedback("n/a") }
    }
    React.useEffect(() => {
        const escape = (event: KeyboardEvent) => {
            if (event.key === "Escape") { event.preventDefault(); if (reduced) close(); else setClosing(true) }
            if (event.key === "Tab" && root.current) {
                const buttons = Array.from(root.current.querySelectorAll<HTMLButtonElement>("button"))
                const first = buttons[0], last = buttons[buttons.length - 1]
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
            }
        }
        window.addEventListener("keydown", escape)
        return () => window.removeEventListener("keydown", escape)
    }, [reduced, close])
    const panelAnimation = reduced ? undefined : `source-mezmo-config-${closing ? "out" : "in"} .18s ease both`
    let multiline = false
    const configurationLines = configuration.split("\n").map((line, i) => {
        const wasMultiline = multiline, quotes = (line.match(/"""/g) ?? []).length
        if (quotes % 2) multiline = !multiline
        const match = wasMultiline ? null : /^(\w+)\s*=\s*(.*)$/.exec(line)
        const comment = !wasMultiline && /^\s*#/.test(line)
        return <div key={i} className={comment ? "source-mezmo-config-comment" : line.startsWith("[") ? "source-mezmo-config-section" : undefined} style={{ minHeight: "1.55em", color: wasMultiline ? "#a5d6a3" : comment ? "#8b949e" : line.startsWith("[") ? "#ffd43b" : "#e6edf3" }}>{match ? <><span style={{ color: "#79c0ff" }}>{match[1]}</span>{" = "}<span style={{ color: match[2].startsWith('"') ? "#a5d6a3" : /^\d/.test(match[2]) ? "#f0883e" : "#ff7b72" }}>{match[2]}</span></> : line}</div>
    })
    return createPortal(<div ref={root} data-mezmo-config-overlay="true" data-mezmo-config-closing={closing} style={{ position: "fixed", inset: 0, zIndex: 10000, pointerEvents: "none", color: "#e6edf3", font: "12px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace" }}>
        <style>{".source-mezmo-config-comment{font-style:italic}.source-mezmo-config-section{font-weight:600}.source-mezmo-config-backdrop{top:94px}@media(max-width:991px){.source-mezmo-config-backdrop{top:78px}}@keyframes source-mezmo-config-in{from{transform:translateX(100%)}to{transform:translateX(0)}}@keyframes source-mezmo-config-out{from{transform:translateX(0)}to{transform:translateX(100%)}}@keyframes source-mezmo-config-fade-in{from{opacity:0}to{opacity:1}}@keyframes source-mezmo-config-fade-out{from{opacity:1}to{opacity:0}}"}</style>
        <div className="source-mezmo-config-backdrop" data-mezmo-config-backdrop="true" onClick={dismiss} style={{ position: "absolute", left: 0, right: 0, bottom: 0, pointerEvents: "auto", background: "#00000073", animation: reduced ? undefined : `source-mezmo-config-fade-${closing ? "out" : "in"} .18s ease both` }} />
        <div role="dialog" aria-modal="true" aria-labelledby={titleID} data-mezmo-config-drawer="true"
            onAnimationEnd={(event: React.AnimationEvent<HTMLDivElement>) => { if (closing && event.target === event.currentTarget) close() }}
            style={{ position: "absolute", top: 100, right: 0, width: "min(720px,96vw)", height: "calc(100svh - 100px)", pointerEvents: "auto", background: "#11151a", borderLeft: "1px solid #21262d", boxShadow: "-10px 0 30px #00000080", display: "flex", flexDirection: "column", animation: panelAnimation }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 18px", borderBottom: "1px solid #21262d" }}>
                <div id={titleID} style={{ display: "flex", alignItems: "center", gap: 8, font: "600 13px/1 ui-monospace,SFMono-Regular,Consolas,monospace" }}><span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffd43b" }} /><span style={{ color: "#ffd43b" }}>config.toml</span><span style={{ color: "#8b949e", font: "400 13px/1 ui-monospace,SFMono-Regular,Consolas,monospace" }}>— Kubernetes SRE Agent</span></div>
                <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" onClick={copyConfiguration} style={{ color: "#8b949e", border: "1px solid #21262d", background: "transparent", padding: "5px 9px", borderRadius: 4, font: "12px/1 ui-monospace,SFMono-Regular,Consolas,monospace" }}>{copyFeedback.text}</button>
                    <button type="button" autoFocus aria-label="Close configuration" onClick={dismiss} style={{ color: "#8b949e", border: "1px solid #21262d", background: "transparent", padding: "2px 8px 4px", borderRadius: 4, font: "16px/1 ui-monospace,monospace" }}>×</button>
                </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 18px 10px", borderBottom: "1px solid #21262d", color: "#8b949e", font: "11px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace" }}><span><strong style={{ color: "#3fb950" }}>orchestration</strong> on · 3 workers + workflow gateway</span><span>· 4 MCP servers · gpt-4o-mini</span></div>
            <pre data-mezmo-config-text="true" style={{ margin: 0, padding: "14px 18px 32px", overflow: "auto", flex: 1, background: "#0b0d10", font: "12.5px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace", whiteSpace: "pre" }}>{configurationLines}</pre>
        </div>
    </div>, document.body)
}
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
    const [held, setHeld] = React.useState(false), [config, setConfig] = React.useState(false), [stream, setStream] = React.useState(false)
    const [transcript, setTranscript] = React.useState<TranscriptEntry[]>([]), [showIntro, setShowIntro] = React.useState(true), [expanded, setExpanded] = React.useState(true)
    const sequence = React.useRef(0), commandHistory = React.useRef<string[]>([]), historyCursor = React.useRef<number | null>(null), historyDraft = React.useRef("")
    const inputID = React.useId()
    const clock = React.useRef(0), last = React.useRef(0), tick = React.useRef(0), frame = React.useRef(0), inputRef = React.useRef<HTMLInputElement | null>(null), scrollRef = React.useRef<HTMLDivElement | null>(null)
    const effectiveStage = frozen ? Math.max(0, Math.min(3, Math.round(stillStage))) : stage
    const effectiveTime = frozen || reduced ? durations[effectiveStage] : elapsed
    const running = !frozen && animate && !paused && !held && visible && !config && !reduced && (stage !== 0 || input === null)
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
        const limit = stage === 0 ? prompts[0].length * .018 : durations[stage]
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
    React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [effectiveStage, effectiveTime, transcript, stream])
    React.useEffect(() => { if (frozen) setConfig(false) }, [frozen])
    const complete = effectiveTime >= durations[effectiveStage]
    const pretyped = effectiveStage === 0 ? prompts[0].slice(0, Math.floor((frozen || reduced ? 100 : effectiveTime) / .018)) : ""
    const append = (lines: string[], color = colors.muted) => { const entries: TranscriptEntry[] = lines.map(text => ({ key: ++sequence.current, kind: "text", text, color })); setTranscript(rows => [...rows, ...entries]) }
    const clearScreen = (resetStage = false) => { setTranscript([]); setShowIntro(false); if (resetStage) { setStage(0); clock.current = 0; setElapsed(0) } }
    const busy = effectiveStage > 0 && !complete
    const submit = (event: React.FormEvent) => {
        event.preventDefault(); if (frozen || held || paused || !animate || !visible || busy) return
        const value = (input ?? "").trim()
        const submitted = value || (input === null ? effectiveStage === 0 ? pretyped : complete ? prompts[Math.min(3, effectiveStage)] : "" : "")
        if (submitted && commandHistory.current[commandHistory.current.length - 1] !== submitted) commandHistory.current.push(submitted)
        historyCursor.current = null; historyDraft.current = ""
        if (value.startsWith("/")) {
            const command = value.slice(1).split(/\s+/, 1)[0]
            if (command === "clear") clearScreen()
            else if (command === "help" || command === "?") append([`❯ ${value}`, "aura SRE incident demo (MOCK)", "", "  Slash commands", "    /help     show this help", "    /expand   toggle expanded vs compact tool-call view", "    /stream   toggle the SSE event panel", "    /clear    clear the screen", "", "  Investigation prompts", "    investigate the recent payment failures", "    what is causing the cart latency?", "    why is the recommendation service crashing?", "    anything wrong with the ad service?", "", "  Output in this study is prerecorded; no tools are executed."])
            else if (command === "expand") { const next = !expanded; setExpanded(next); append([`❯ ${value}`, `tool view: ${next ? "expanded — results show under each completed tool" : "compact — only the call line + duration is shown"}`]) }
            else if (command === "stream") { setStream(!stream); append([`❯ ${value}`, `stream panel: ${stream ? "off — panel hidden" : "on — recorded events appear below"}`]) }
            else append([`❯ ${value}`, `unknown command: /${command}`, "type /help for available commands"], colors.yellow)
            setInput(""); return
        }
        if (value === "clear" || value === "cls") { clearScreen(true); setInput(""); return }
        if (stage < 3 && submitted) { const next = stage + 1, entry: TranscriptEntry = { key: ++sequence.current, kind: "phase", phase: next, expanded, prompt: submitted }; setTranscript(rows => [...rows, entry]); setStage(next); clock.current = 0; setElapsed(0); setInput(null) }
    }
    const history: TranscriptEntry[] = frozen ? Array.from({ length: effectiveStage }, (_, index) => ({ key: index, kind: "phase", phase: index + 1, expanded: true, prompt: prompts[index] })) : transcript
    return <div ref={setHost} onClick={(event: React.MouseEvent<HTMLDivElement>) => { if (!frozen && !config && !(event.target instanceof Element && event.target.closest("button,input,[role=dialog]"))) inputRef.current?.focus() }} data-source-reference="HERO-012" data-source-current-original="https://www.mezmo.com/" data-mezmo-stage={effectiveStage} data-mezmo-time={effectiveTime.toFixed(3)} data-mezmo-paused={held || paused} data-mezmo-visible={visible} data-mezmo-frozen={frozen} data-mezmo-stream={stream} data-mezmo-expanded={expanded}
        style={{ ...style, position: "relative", width: style?.width ?? "100%", height: style?.height ?? 522, minWidth: 0, color: colors.text, background: "#0b0e11", borderRadius: 6, overflow: "hidden", boxShadow: "0 0 10px #a484c7", font: "11px/1.48 ui-monospace,SFMono-Regular,Consolas,monospace", letterSpacing: ".055em", containerType: "inline-size", containerName: "source-mezmo" } as ContainerStyle}>
        <style>{"@container source-mezmo (max-width: 600px){.source-mezmo-wordmark{display:none}}"}</style>
        <div aria-hidden="true" style={{ height: 23, display: "flex", alignItems: "center", gap: 6, paddingLeft: 7, background: "#bdbdbd" }}>{["#ff4c64", "#ffcb28", "#00d832"].map(color => <span key={color} style={{ width: 10, height: 10, borderRadius: "50%", border: "1px solid #0003", background: color }} />)}</div>
        <div ref={scrollRef} role="log" aria-label="AURA prerecorded study output" aria-live="polite" aria-relevant="additions" style={{ height: "calc(100% - 62px)", overflow: "auto", padding: "25px 15px 15px", overflowWrap: "anywhere", scrollbarWidth: "thin" }}>
            {(frozen || showIntro) && <><Logo />
            <div style={{ marginBottom: 16 }}><span style={{ color: colors.purple }}>aura-cli v0.1.6</span><span style={{ color: colors.muted }}> · http://localhost:8080 (server v0.1.6)</span></div>
            <div style={{ color: colors.yellow }}>Agent</div><div>  sre-agent <span style={{ color: colors.muted }}>— coordinator</span></div>
            <div style={{ color: colors.yellow }}>Workers</div>
            <div>  cluster_inspector <span style={{ color: colors.muted }}>— workload state and events</span></div>
            <div>  metrics_analyst <span style={{ color: colors.muted }}>— errors and latency</span></div>
            <div>  remediator <span style={{ color: colors.muted }}>— reviewed recovery plan</span></div>
            <div style={{ color: "#d4aa00", margin: "16px 0" }}>This website feature is interactive.<br />Please click here then hit Enter to continue</div></>}
            {history.map(entry => entry.kind === "text" ? <div key={entry.key} data-mezmo-command-output="true" style={{ color: entry.color ?? colors.muted, whiteSpace: "pre-wrap", minHeight: "1.48em" }}>{entry.text}</div> : <section key={entry.key} data-mezmo-phase={entry.phase} data-mezmo-tool-view={entry.expanded ? "expanded" : "compact"}>
                <div style={{ margin: "12px 0 10px" }}><span style={{ color: colors.green }}>❯ </span>{entry.prompt}</div>
                {stageRows[entry.phase].filter(row => (entry.phase < effectiveStage || row.at <= effectiveTime) && (entry.expanded || !row.detail)).map((row, index) => <div key={index} data-mezmo-row={index} style={{ color: row.color ?? colors.text, whiteSpace: "pre-wrap" }}>{row.text}</div>)}
            </section>)}
            {stream && <aside aria-label="Simulated event stream" style={{ borderLeft: `2px solid ${colors.cyan}`, paddingLeft: 8, marginTop: 12, color: colors.muted }}>STREAM · {stageRows[effectiveStage].filter(row => row.at <= effectiveTime).length} recorded events</aside>}
            <form onSubmit={submit} style={{ display: "flex", gap: 7, marginTop: 14 }}>
                <label htmlFor={inputID} style={{ color: colors.green }}>❯</label>
                <input id={inputID} ref={inputRef} aria-label="Terminal command" value={input ?? (effectiveStage === 0 ? pretyped : complete ? prompts[Math.min(3, effectiveStage)] : "")} readOnly={frozen || held || paused || busy || !animate} onChange={(event: React.ChangeEvent<HTMLInputElement>) => { historyCursor.current = null; setInput(event.target.value) }} onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                    if (frozen || held || paused || busy || !animate || !visible) return
                    if (event.key === "c" && event.ctrlKey) { event.preventDefault(); historyCursor.current = null; historyDraft.current = ""; setInput(""); append(["^C"]); return }
                    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
                    const commands = commandHistory.current; if (!commands.length) return
                    event.preventDefault()
                    if (event.key === "ArrowUp") { if (historyCursor.current === null) historyDraft.current = event.currentTarget.value; historyCursor.current = Math.max(0, (historyCursor.current ?? commands.length) - 1); setInput(commands[historyCursor.current]) }
                    else if (historyCursor.current !== null) { const next = historyCursor.current + 1; historyCursor.current = next < commands.length ? next : null; setInput(historyCursor.current === null ? historyDraft.current : commands[historyCursor.current]) }
                }} autoComplete="off" spellCheck={false}
                    style={{ width: "100%", minWidth: 0, border: 0, outline: 0, padding: 0, background: "transparent", color: colors.text, font: "inherit", letterSpacing: "inherit", caretColor: running ? colors.green : "transparent" }} />
            </form>
        </div>
        <div style={{ position: "absolute", bottom: 10, left: 12, right: 12, display: "flex", justifyContent: "space-between", gap: 8 }}>
            {showPlayback && !frozen ? <button aria-pressed={held || paused} onClick={() => setHeld(value => !value)} style={{ border: 0, padding: "4px 6px", background: "transparent", color: colors.muted, font: "inherit" }}>{held || paused ? "RESUME" : "PAUSE"}</button> : <span />}
            <button aria-expanded={config} onClick={() => { if (!frozen) setConfig(value => !value) }} style={{ border: "1px solid #252a30", borderRadius: 6, padding: "6px 10px", color: colors.text, background: "#11151a", font: "inherit" }}><span style={{ color: colors.yellow }}>{"{}"}</span> config.toml</button>
        </div>
        {config && !frozen && host && <ConfigurationDrawer reduced={reduced} close={() => { setConfig(false); inputRef.current?.focus() }} />}
    </div>
}
addPropertyControls(SourceMezmoTerminal, {
    animate: { type: ControlType.Boolean, defaultValue: true }, canvasMotion: { type: ControlType.Boolean, defaultValue: false, title: "Canvas motion" }, paused: { type: ControlType.Boolean, defaultValue: false },
    stillStage: { type: ControlType.Number, min: 0, max: 3, step: 1, defaultValue: 0 }, showPlayback: { type: ControlType.Boolean, defaultValue: true },
})
