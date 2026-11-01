import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"

/**
 * SOURCE INSPIRATION / HERO-002 — Ajedrez Film Poem / Julián Leiss.
 * Native editable scene clock for the retained 52.314558s recorded film.
 * Thirty-seven cut ranges follow the inspected one-second sample sequence;
 * subsecond cuts/interpolation are approximate. This is a temporal work, not
 * a website scroll journey. No original behavior JS or poem body is copied.
 * The overhead-chess aperture can play the credited silent 49-frame source crop
 * through its shared clock. Other photographic passages remain still-held;
 * their internal motion and unreviewed audio are not claimed as restored.
 *
 * One Film parent must contain all native phase groups and added playback UI.
 * Keep each phase group mounted visible:true/opacity0, with editable native
 * text, frames, shapes and credited individual source photographs beneath it.
 * Attach the matching Phase01…37 override; inactive groups stay in the tree.
 * Play/Pause/Replay are added prototype controls, outside the portrait field.
 * Default Canvas/export/reduced poster is title1.2s; the two alternate Film
 * overrides choose contact26.5s or montage44.5s. Preview auto-plays once at24fps,
 * freezes at credits, and pauses while offscreen or the document is hidden.
 * The phase clock has no GPU, scroll handler or background timer. Its optional
 * overhead media HOC admits one decoder through the existing shared film gate.
 */

type Phase = { from: number; to: number; name: string }
const DURATION = 52.314558
const PHASES: readonly Phase[] = [
    { from: 0, to: .8, name: "blank-paper" },
    { from: .8, to: 2.8, name: "title-metadata" },
    { from: 2.8, to: 4, name: "small-type" },
    { from: 4, to: 5, name: "numeric-table" },
    { from: 5, to: 6, name: "players-filmstrip" },
    { from: 6, to: 7, name: "scattered-type" },
    { from: 7, to: 8, name: "pale-type" },
    { from: 8, to: 9, name: "dark-type" },
    { from: 9, to: 10, name: "scattered-type" },
    { from: 10, to: 11, name: "chess-diagram" },
    { from: 11, to: 13, name: "network-grid" },
    { from: 13, to: 14, name: "thread-diagram" },
    { from: 14, to: 15, name: "small-type" },
    { from: 15, to: 17, name: "indexed-table" },
    { from: 17, to: 18, name: "small-type" },
    { from: 18, to: 20, name: "poem-layout" },
    { from: 20, to: 21, name: "dark-title" },
    { from: 21, to: 22, name: "pixel-rook" },
    { from: 22, to: 23, name: "indexed-rook-photo" },
    { from: 23, to: 24, name: "horse-filmstrip" },
    { from: 24, to: 26, name: "sculpture-spread" },
    { from: 26, to: 27, name: "contact-sheet" },
    { from: 27, to: 28, name: "pixel-knight" },
    { from: 28, to: 29, name: "indexed-elephant-photo" },
    { from: 29, to: 31, name: "repeated-figure" },
    { from: 31, to: 33, name: "paragraph-layout" },
    { from: 33, to: 34, name: "vertical-photo-strip" },
    { from: 34, to: 37, name: "paragraph-layout" },
    { from: 37, to: 39, name: "overhead-chess-film" },
    { from: 39, to: 41, name: "large-type" },
    { from: 41, to: 42, name: "hand-photo-strip" },
    { from: 42, to: 43, name: "scattered-type" },
    { from: 43, to: 46, name: "dense-montage" },
    { from: 46, to: 47, name: "scattered-type" },
    { from: 47, to: 48, name: "dark-globe" },
    { from: 48, to: 52, name: "type-grid" },
    { from: 52, to: DURATION, name: "end-credits" },
]
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
    children?: React.ReactNode
    [key: string]: unknown
    style?: React.CSSProperties
    onClick?: React.MouseEventHandler<HTMLElement>; onTap?: (event: NativeActivationEvent, info?: unknown) => void
    onKeyDown?: React.KeyboardEventHandler<HTMLElement>
}
type FilmState = {
    time: number; index: number; frozen: boolean; reduced: boolean; playing: boolean
    active: boolean; complete: boolean; toggle: () => void; replay: () => void
}
const DEFAULT: FilmState = { time: 1.2, index: 1, frozen: true, reduced: false, playing: false,
    active: false, complete: false, toggle() {}, replay() {} }
const Context = React.createContext<FilmState>(DEFAULT)
function indexAt(time: number) {
    const t = Math.max(0, Math.min(DURATION, Number.isFinite(time) ? time : 0))
    return t >= DURATION ? PHASES.length - 1 : PHASES.findIndex(phase => t >= phase.from && t < phase.to)
}
function writeRef<T>(ref: React.ForwardedRef<T>, value: T | null) { if (typeof ref === "function") ref(value); else if (ref) ref.current = value }
const useOwnLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

function film(Component: ComponentType<LayerProps>, poster: number): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const target = RenderTarget.current()
        const frozen = useIsStaticRenderer() || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail
        const own = React.useRef<HTMLElement | null>(null)
        const [host, setHost] = React.useState<HTMLElement | null>(null)
        const bindHost = React.useCallback((node: HTMLElement | null) => {
            own.current = node; setHost(node); writeRef(ref, node)
        }, [ref])
        const clock = React.useRef({ time: 0, started: null as number | null })
        const [time, setTime] = React.useState(0)
        const [playing, setPlaying] = React.useState(true)
        const [visible, setVisible] = React.useState(false)
        const [hidden, setHidden] = React.useState(false)
        const [reduced, setReduced] = React.useState(false)
        const [fit, setFit] = React.useState(1)
        const declaredZoom = props.style?.zoom, parsedZoom = parseFloat(String(declaredZoom ?? 1)) / (String(declaredZoom).endsWith("%") ? 100 : 1)
        const callerZoom = Number.isFinite(parsedZoom) && parsedZoom > 0 ? parsedZoom : 1
        useOwnLayoutEffect(() => {
            const node = host, parent = node?.parentElement
            if (!node || !parent) return
            let current = true
            // CSS zoom changes layout as well as paint, keeping native movie
            // contents and playback controls together inside a scrollbar gutter.
            const read = () => {
                if (!current || own.current !== node) return
                const width = node.offsetWidth * callerZoom, available = parent.clientWidth
                const next = width > 0 && available > 0 ? Math.min(1, available / width) : 1
                setFit(current => Math.abs(current - next) < 1e-7 ? current : next)
            }
            read()
            const observer = new ResizeObserver(read)
            observer.observe(node); observer.observe(parent)
            return () => { current = false; observer.disconnect() }
        }, [callerZoom, host])
        const sample = React.useCallback(() => Math.min(DURATION, Math.max(0, clock.current.time + (clock.current.started === null ? 0 : (performance.now() - clock.current.started) / 1000))), [])
        React.useEffect(() => {
            setVisible(false)
            if (frozen || !host) return
            let current = true
            const io = new IntersectionObserver(entries => {
                if (!current || own.current !== host) return
                const entry = entries.find(value => value.target === host)
                if (entry) setVisible(entry.isIntersecting)
            }); io.observe(host)
            const query = window.matchMedia("(prefers-reduced-motion: reduce)")
            const motion = () => setReduced(query.matches), visibility = () => setHidden(document.hidden)
            motion(); visibility(); query.addEventListener("change", motion); document.addEventListener("visibilitychange", visibility)
            return () => { current = false; io.disconnect(); query.removeEventListener("change", motion); document.removeEventListener("visibilitychange", visibility) }
        }, [frozen, host])
        const running = !frozen && !reduced && playing && visible && !hidden && time < DURATION
        React.useEffect(() => {
            if (!running) return
            let frame = 0, published = -Infinity
            clock.current.started = performance.now()
            const tick = (now: number) => {
                frame = 0
                const next = sample()
                if (now - published >= 1000 / 24 || next >= DURATION) { published = Number.isFinite(published) ? published + 1000 / 24 : now; setTime(next) }
                if (next >= DURATION) { clock.current.time = DURATION; clock.current.started = null; setPlaying(false) }
                else frame = requestAnimationFrame(tick)
            }
            frame = requestAnimationFrame(tick)
            return () => { if (frame) cancelAnimationFrame(frame); clock.current.time = sample(); clock.current.started = null }
        }, [running, sample])
        const toggle = React.useCallback(() => {
            if (frozen || reduced) return
            if (playing) { clock.current.time = sample(); clock.current.started = null; setTime(clock.current.time); setPlaying(false) }
            else {
                if (clock.current.time >= DURATION) { clock.current.time = 0; setTime(0) }
                setPlaying(true)
            }
        }, [frozen, reduced, playing, sample])
        const replay = React.useCallback(() => {
            if (frozen || reduced) return
            clock.current.time = 0
            // Keep an existing live RAF anchored to the new origin; a paused
            // instance will start its clock in the running effect instead.
            clock.current.started = running ? performance.now() : null
            setTime(0); setPlaying(true)
        }, [frozen, reduced, running])
        const shown = frozen || reduced ? poster : time
        const state: FilmState = { time: shown, index: indexAt(shown), frozen, reduced, playing: !frozen && !reduced && playing,
            active: running, complete: shown >= DURATION, toggle, replay }
        return <Context.Provider value={state}><Component {...props} ref={bindHost}
            style={fit < 1 ? { ...props.style, zoom: callerZoom * fit } : props.style}
            data-source-ajedrez-time={shown} data-source-ajedrez-phase={state.index + 1} data-source-ajedrez-state={PHASES[state.index].name}
            data-source-ajedrez-playback={frozen ? "poster" : reduced ? "reduced-motion" : state.complete ? "complete" : !playing ? "paused" : running ? "playing" : "offscreen"}
        /></Context.Provider>
    })
}
export function withAjedrezFilm(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return film(Component, 1.2) }
export function withAjedrezContactPoster(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return film(Component, 26.5) }
export function withAjedrezMontagePoster(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return film(Component, 44.5) }
function phase(Component: ComponentType<LayerProps>, index: number): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = React.useContext(Context), active = state.index === index
        return <Component {...props} ref={ref} aria-hidden={!active} data-source-ajedrez-group={index + 1}
            style={{ ...props.style, opacity: active ? 1 : 0, visibility: active ? "visible" : "hidden", pointerEvents: active ? props.style?.pointerEvents : "none", transition: "none" }} />
    })
}
export function withAjedrezPhase01(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 0) }
export function withAjedrezPhase02(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 1) }
export function withAjedrezPhase03(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 2) }
export function withAjedrezPhase04(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 3) }
export function withAjedrezPhase05(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 4) }
export function withAjedrezPhase06(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 5) }
export function withAjedrezPhase07(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 6) }
export function withAjedrezPhase08(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 7) }
export function withAjedrezPhase09(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 8) }
export function withAjedrezPhase10(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 9) }
export function withAjedrezPhase11(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 10) }
export function withAjedrezPhase12(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 11) }
export function withAjedrezPhase13(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 12) }
export function withAjedrezPhase14(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 13) }
export function withAjedrezPhase15(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 14) }
export function withAjedrezPhase16(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 15) }
export function withAjedrezPhase17(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 16) }
export function withAjedrezPhase18(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 17) }
export function withAjedrezPhase19(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 18) }
export function withAjedrezPhase20(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 19) }
export function withAjedrezPhase21(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 20) }
export function withAjedrezPhase22(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 21) }
export function withAjedrezPhase23(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 22) }
export function withAjedrezPhase24(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 23) }
export function withAjedrezPhase25(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 24) }
export function withAjedrezPhase26(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 25) }
export function withAjedrezPhase27(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 26) }
export function withAjedrezPhase28(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 27) }
export function withAjedrezPhase29(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 28) }
export function withAjedrezPhase30(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 29) }
export function withAjedrezPhase31(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 30) }
export function withAjedrezPhase32(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 31) }
export function withAjedrezPhase33(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 32) }
export function withAjedrezPhase34(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 33) }
export function withAjedrezPhase35(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 34) }
export function withAjedrezPhase36(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 35) }
export function withAjedrezPhase37(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return phase(Component, 36) }

function button(Component: ComponentType<LayerProps>, kind: "toggle" | "replay"): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = React.useContext(Context), disabled = state.frozen || state.reduced
        const activate = useNativeActivation(() => (kind === "toggle" ? state.toggle : state.replay)(), disabled)
        return <Component {...props} ref={ref} role={props.role ?? "button"} tabIndex={props.tabIndex ?? 0}
            aria-disabled={disabled} aria-pressed={kind === "toggle" ? !state.playing : undefined}
            onTap={(event: NativeActivationEvent, info?: unknown) => { props.onTap?.(event, info); activate("tap", !!event.defaultPrevented) }}
            onClick={(event: React.MouseEvent<HTMLElement>) => { props.onClick?.(event); activate("click", !!event.defaultPrevented) }}
            onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => { props.onKeyDown?.(event); if (!disabled && !event.defaultPrevented && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); activate("key", false) } }} />
    })
}
export function withAjedrezPlayPause(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return button(Component, "toggle") }
export function withAjedrezReplay(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return button(Component, "replay") }
export function withAjedrezPlaybackLabel(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = React.useContext(Context)
        return <Component {...props} ref={ref} text={state.frozen ? "POSTER" : state.reduced ? "REDUCED MOTION" : state.playing ? "PAUSE" : "PLAY"} />
    })
}
export function withAjedrezTime(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => { const state = React.useContext(Context); return <Component {...props} ref={ref} text={`${state.time.toFixed(1)} / 52.3 s`} /> })
}

// The URL is bound only after the 49-frame silent source crop has a genuine
// uploaded runtime URL. Native image fill remains the poster while unbound.
function ajedrezOverheadSource(): string | null { return "https://framerusercontent.com/assets/8mNQ0LUIe80fn27qQfvQoduVI.mp4" }
type AjedrezPhotoLease = { create: () => HTMLVideoElement; release: (video: HTMLVideoElement) => void; trackAbort: (video: HTMLVideoElement, cancel: () => void) => void; finish: () => void }
type AjedrezPhotoClient = { kind: "live" | "still"; enabled: boolean; priority: number; start: (lease: AjedrezPhotoLease) => void; stop: () => void }
type AjedrezPhotoGate = { add: (input: AjedrezPhotoClient) => { update: (next: Partial<AjedrezPhotoClient>) => void; remove: () => void }; debug: () => { clients: number; decoders: number; peakDecoders: number; owner: number | null; kind: string | null; failures: string[] } }
// Same owned admission protocol as SourcePortfolioFilmStudy; this self-contained
// file neither imports that actor nor creates a second independent decoder cap.
function ajedrezPhotoGate(): AjedrezPhotoGate {
    const key = Symbol.for("monarchic.source-portfolio-media.v1"), registry = window as unknown as Record<symbol, unknown>, existing = registry[key] as AjedrezPhotoGate | undefined
    if (existing) return existing
    type Client = AjedrezPhotoClient & { id: number; videos: Set<HTMLVideoElement>; aborts: Map<HTMLVideoElement, () => void> }
    const clients = new Map<number, Client>(), failures: string[] = []
    let sequence = 0, owner: Client | null = null, peak = 0, pumping = false, again = false
    const decoderCount = () => [...clients.values()].reduce((n, c) => n + c.videos.size, 0)
    function release(record: Client, video: HTMLVideoElement) { if (!record.videos.delete(video)) return; const cancel = record.aborts.get(video); record.aborts.delete(video); cancel?.(); try { video.pause(); video.removeAttribute("src"); video.load() } catch {} }
    function stop(record: Client) { try { record.stop() } catch (error) { failures.push(String(error)) } finally { for (const video of [...record.videos]) release(record, video) } }
    function pump() {
        if (pumping) { again = true; return }; pumping = true
        try { do {
            again = false
            const eligible = [...clients.values()].filter(c => c.enabled), next = eligible.filter(c => c.kind === "still").sort((a, b) => a.id - b.id)[0] ?? eligible.filter(c => c.kind === "live").sort((a, b) => b.priority - a.priority || b.id - a.id)[0] ?? null
            if (owner === next) continue
            if (owner) { const previous = owner; owner = null; stop(previous) }
            if (next) {
                owner = next
                const lease: AjedrezPhotoLease = { create() { if (owner !== next) throw Error("Stale film media lease"); if (decoderCount() >= 2) throw Error("Film decoder budget exceeded"); const video = document.createElement("video"); video.muted = true; video.playsInline = true; video.preload = "metadata"; video.crossOrigin = "anonymous"; next.videos.add(video); peak = Math.max(peak, decoderCount()); return video }, release: video => release(next, video), trackAbort(video, cancel) { if (next.videos.has(video)) next.aborts.set(video, (() => { const previous = next.aborts.get(video); return () => { previous?.(); cancel() } })()) }, finish() { if (owner !== next) return; next.enabled = false; owner = null; stop(next); again = true; pump() } }
                try { next.start(lease) } catch (error) { failures.push(String(error)); next.enabled = false; owner = null; stop(next); again = true }
            }
        } while (again) } finally { pumping = false }
    }
    const gate: AjedrezPhotoGate = { add(input) { const record: Client = { ...input, id: ++sequence, videos: new Set(), aborts: new Map() }; clients.set(record.id, record); pump(); return { update(next) { Object.assign(record, next); pump() }, remove() { if (owner === record) { owner = null; stop(record) } else stop(record); clients.delete(record.id); pump() } } }, debug: () => ({ clients: clients.size, decoders: decoderCount(), peakDecoders: peak, owner: owner?.id ?? null, kind: owner?.kind ?? null, failures: [...failures] }) }
    registry[key] = gate; return gate
}
type AjedrezTimedVideo = HTMLVideoElement & { requestVideoFrameCallback?: (callback: (now: number, metadata: { mediaTime: number }) => void) => number; cancelVideoFrameCallback?: (id: number) => void }
/** Source frames 881..929 (480x510 crop) fit the existing 37..39s phase.
 * Only photographic pixels use a 244,800px 2D surface; native text/art stays
 * outside it. Shared Film Context owns time, controls and responsive fitting. */
export function withAjedrezOverheadMotion(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, forwardedRef) => {
        const state = React.useContext(Context), latest = React.useRef(state), own = React.useRef<HTMLElement | null>(null), canvas = React.useRef<HTMLCanvasElement | null>(null), [host, setHost] = React.useState<HTMLElement | null>(null), [ready, setReady] = React.useState(false), [status, setStatus] = React.useState("poster")
        latest.current = state
        const bindHost = React.useCallback((node: HTMLElement | null) => { own.current = node; setHost(node); writeRef(forwardedRef, node) }, [forwardedRef]), url = ajedrezOverheadSource(), live = state.index === 28 && state.active && !state.frozen && !state.reduced && !!url
        React.useEffect(() => { setReady(false); setStatus(url ? "poster" : "unbound") }, [host, state.frozen, state.reduced, url])
        React.useEffect(() => {
            const surface = canvas.current
            if (!live || !host || !surface || !url) return
            const context = surface.getContext("2d")
            if (!context) { setStatus("2d-unavailable"); return }
            let disposed = false, stopVideo = () => {}
            const current = () => !disposed && own.current === host && canvas.current === surface
            const target = () => Math.min(2, Math.max(0, (latest.current.time - 37) / 2) * 49 / 24)
            const client = ajedrezPhotoGate().add({ kind: "live", enabled: true, priority: 1,
                start(lease) {
                    if (!current()) return
                    const video = lease.create() as AjedrezTimedVideo
                    let stopped = false, videoFrame: number | undefined, frame = 0, started = false
                    const valid = () => current() && !stopped
                    const paint = (mediaTime = video.currentTime) => {
                        if (!valid() || video.readyState < 2 || video.seeking) return
                        const wanted = target()
                        if (Math.abs(mediaTime - wanted) > .09) { video.currentTime = wanted; return }
                        context.drawImage(video, 0, 0, 480, 510); setReady(true); setStatus("moving")
                        surface.setAttribute("data-source-ajedrez-photo-media-time", String(mediaTime)); surface.setAttribute("data-source-ajedrez-photo-film-time", String(latest.current.time))
                    }
                    const schedule = () => { if (!valid()) return; if (video.requestVideoFrameCallback) videoFrame = video.requestVideoFrameCallback((_now, metadata) => { paint(metadata.mediaTime); schedule() }); else frame = requestAnimationFrame(() => { frame = 0; paint(); schedule() }) }
                    const play = () => { if (!valid() || started) return; started = true; video.playbackRate = 49 / 48; schedule(); void video.play().catch(() => { if (valid()) setStatus("playback-blocked") }) }
                    const seek = () => { if (!valid()) return; const wanted = target(); if (Math.abs(video.currentTime - wanted) > .001) video.currentTime = wanted; else { paint(); play() } }
                    const settled = () => { if (valid()) { paint(); play() } }, failed = () => { if (valid()) setStatus("media-error") }
                    stopVideo = () => { if (stopped) return; stopped = true; if (videoFrame !== undefined) video.cancelVideoFrameCallback?.(videoFrame); if (frame) cancelAnimationFrame(frame); video.removeEventListener("loadedmetadata", seek); video.removeEventListener("loadeddata", settled); video.removeEventListener("seeked", settled); video.removeEventListener("error", failed); video.pause() }
                    lease.trackAbort(video, stopVideo); video.addEventListener("loadedmetadata", seek); video.addEventListener("loadeddata", settled); video.addEventListener("seeked", settled); video.addEventListener("error", failed); setStatus("loading"); video.src = url; video.load()
                }, stop() { stopVideo() },
            })
            return () => { disposed = true; client.remove() }
        }, [live, host, url])
        const shown = ready && !state.frozen && !state.reduced && state.index === 28
        return <Component {...props} ref={bindHost} data-source-ajedrez-photo="overhead" data-source-ajedrez-photo-status={status} data-source-ajedrez-photo-live={live}>
            {props.children}<canvas ref={canvas} width={480} height={510} aria-hidden="true" data-source-ajedrez-photo-surface="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: shown ? 1 : 0 }} />
        </Component>
    })
}
