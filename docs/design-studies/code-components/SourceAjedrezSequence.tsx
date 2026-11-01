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
    { from: 48, to: 1226 / 24, name: "type-grid" },
    { from: 1226 / 24, to: DURATION, name: "end-credits" },
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


// Source-sampled HERO-002 type-grid: 12 reviewed representative image poses.
// Exact24fps source cuts drive sample holds, never an invented global easing.
// Word identities use an independent geometric fit; original verse is absent.
// Live horizontal fitting keeps longer independent words inside source-ink
// spans without changing their font height; static49 geometry is unscaled.
// The brief49s perimeter is the authored native/Canvas poster. Later small dark
// grid choreography and all per-frame source trajectories remain unrebuilt.
const AJEDREZ_TYPE_WORDS: readonly string[] = ["film-phase-36-grid-word-0-1","film-phase-36-grid-word-0-3","film-phase-36-grid-word-0-5","film-phase-36-grid-word-0-7","film-phase-36-grid-word-1-0","film-phase-36-grid-word-1-1","film-phase-36-grid-word-1-2","film-phase-36-grid-word-1-3","film-phase-36-grid-word-1-4","film-phase-36-grid-word-1-5","film-phase-36-grid-word-1-6","film-phase-36-grid-word-1-7","film-phase-36-grid-word-2-0","film-phase-36-grid-word-2-2","film-phase-36-grid-word-2-4","film-phase-36-grid-word-2-6","film-phase-36-grid-word-3-0","film-phase-36-grid-word-3-1","film-phase-36-grid-word-3-2","film-phase-36-grid-word-3-3","film-phase-36-grid-word-3-4","film-phase-36-grid-word-3-5","film-phase-36-grid-word-3-6","film-phase-36-grid-word-3-7","film-phase-36-grid-word-4-1","film-phase-36-grid-word-4-3","film-phase-36-grid-word-4-5","film-phase-36-grid-word-4-7","film-phase-36-grid-word-5-0","film-phase-36-grid-word-5-1","film-phase-36-grid-word-5-2","film-phase-36-grid-word-5-3","film-phase-36-grid-word-5-4","film-phase-36-grid-word-5-5","film-phase-36-grid-word-5-6","film-phase-36-grid-word-5-7","film-phase-36-grid-word-6-0","film-phase-36-grid-word-6-2","film-phase-36-grid-word-6-4","film-phase-36-grid-word-6-6","film-phase-36-grid-word-7-0","film-phase-36-grid-word-7-1","film-phase-36-grid-word-7-2","film-phase-36-grid-word-7-3","film-phase-36-grid-word-7-4","film-phase-36-grid-word-7-5","film-phase-36-grid-word-7-6","film-phase-36-grid-word-7-7","film-phase-36-grid-word-8-1","film-phase-36-grid-word-8-3","film-phase-36-grid-word-8-5","film-phase-36-grid-word-8-7","film-phase-36-grid-word-9-0","film-phase-36-grid-word-9-1","film-phase-36-grid-word-9-2","film-phase-36-grid-word-9-3","film-phase-36-grid-word-9-4","film-phase-36-grid-word-9-5","film-phase-36-grid-word-9-6","film-phase-36-grid-word-9-7","film-phase-36-grid-word-10-0","film-phase-36-grid-word-10-2","film-phase-36-grid-word-10-4","film-phase-36-grid-word-10-6","film-phase-36-grid-word-11-0","film-phase-36-grid-word-11-1","film-phase-36-grid-word-11-2","film-phase-36-grid-word-11-3","film-phase-36-grid-word-11-4","film-phase-36-grid-word-11-5","film-phase-36-grid-word-11-6","film-phase-36-grid-word-11-7","film-phase-36-grid-word-12-1","film-phase-36-grid-word-12-3","film-phase-36-grid-word-12-5","film-phase-36-grid-word-12-7","film-phase-36-grid-word-13-0","film-phase-36-grid-word-13-1","film-phase-36-grid-word-13-2","film-phase-36-grid-word-13-3","film-phase-36-grid-word-13-4","film-phase-36-grid-word-13-5","film-phase-36-grid-word-13-6","film-phase-36-grid-word-13-7"]
const AJEDREZ_TYPE_RULES: readonly string[] = ["film-phase-36-grid-v-0","film-phase-36-grid-v-1","film-phase-36-grid-v-2","film-phase-36-grid-v-3","film-phase-36-grid-v-4","film-phase-36-grid-v-5","film-phase-36-grid-v-6","film-phase-36-grid-v-7","film-phase-36-grid-v-8","film-phase-36-grid-h-0","film-phase-36-grid-h-1","film-phase-36-grid-h-2","film-phase-36-grid-h-3","film-phase-36-grid-h-4","film-phase-36-grid-h-5","film-phase-36-grid-h-6","film-phase-36-grid-h-7","film-phase-36-grid-h-8","film-phase-36-grid-h-9","film-phase-36-grid-h-10","film-phase-36-grid-h-11","film-phase-36-grid-h-12","film-phase-36-grid-h-13","film-phase-36-grid-h-14"]
type AjedrezTypeSample = { frame: number; sourceFrame: number; xy: readonly number[]; widths: readonly number[] }
const AJEDREZ_TYPE_SAMPLES: readonly AjedrezTypeSample[] = [{"frame":1152,"sourceFrame":1152,"xy":[352,352.5,18,384.5,74,328.5,74,297.5,130,297.5,19,217.5,185,519.5,241,550.5,296,408.5,241,273.5,74,550.5,297,463.5,74,519.5,74,495.5,241,352.5,352,439.5,352,328.5,74,273.5,241,574.5,297,574.5,19,297.5,352,519.5,185,408.5,19,328.5,135,352.5,296,352.5,297,519.5,241,463.5,240,495.5,130,352.5,74,408.5,241,297.5,297,273.5,185,273.5,185,384.5,296,550.5,185,297.5,130,574.5,240,328.5,74,463.5,296,495.5,18,273.5,185,241.5,129,550.5,74,217.5,75,352.5,352,297.5,296,439.5,351,463.5,74,384.5,255,328.5,18,241.5,74,439.5,186,328.5,129,241.5,185,550.5,129,495.5,185,463.5,185,574.5,240,408.5,296,297.5,185,439.5,129,463.5,73,574.5,185,495.5,352,574.5,296,328.5,297,384.5,352,550.5,18,352.5,241,439.5,130,384.5,352,384.5,352,273.5,241,519.5,240,384.5,129,328.5,302,273.5,352,495.5,130,519.5,185,352.5,130,273.5,129,408.5,185,217.5],"widths":[30,26,38,17,21,29,26,25,35,39,13,12,12,21,21,8,8,8,8,12,8,38,8,7,21,31,12,3,27,2,44,29,2,8,17,8,26,12,12,39,8,22,21,48,26,38,12,13,26,39,7,34,21,11,8,17,8,7,8,31,17,26,31,27,7,26,8,29,17,26,7,12,26,12,26,22,31,11,8,34,31,30,18,22]},{"frame":1153,"sourceFrame":1154,"xy":[19,431.5,408,288.5,130,454.5,353,399.5,353,288.5,131,375.5,408,431.5,307,209.5,352,454.5,187,264.5,408,454.5,75,375.5,19,454.5,352,209.5,297,264.5,353,264.5,130,264.5,408,320.5,186,232.5,242,454.5,75,288.5,19,320.5,19,486.5,298,454.5,75,232.5,74,431.5,186,431.5,75,344.5,186,454.5,19,399.5,408,375.5,75,399.5,298,399.5,200,431.5,408,264.5,241,320.5,241,431.5,242,344.5,242,209.5,241,264.5,241,375.5,130,320.5,131,209.5,19,375.5,19,264.5,75,510.5,241,232.5,297,375.5,408,209.5,352,232.5,130,510.5,241,288.5,297,431.5,131,232.5,241,399.5,19,510.5,19,209.5,186,399.5,130,431.5,408,232.5,297,344.5,353,344.5,130,288.5,74,264.5,75,486.5,297,288.5,297,209.5,19,344.5,297,232.5,185,344.5,353,320.5,297,320.5,408,399.5,187,320.5,352,431.5,74,454.5,75,320.5,131,486.5,19,232.5,75,209.5,130,399.5,186,288.5,186,209.5,408,344.5],"widths":[30,26,38,16,21,28,26,20,35,38,17,12,13,22,17,8,8,8,8,12,8,38,8,7,12,31,11,8,26,4,44,29,25,6,17,8,26,15,20,40,17,22,21,48,26,39,9,12,26,43,7,34,21,12,8,17,8,8,8,31,17,25,31,27,7,26,7,30,17,27,7,12,26,11,26,22,25,11,8,35,30,30,12,22]},{"frame":1161,"sourceFrame":1165,"xy":[379,344.5,352,454.5,370,423.5,384,533.5,352,319.5,370,391.5,419,533.5,398,319.5,365,517.5,371,311.5,388,430.5,365,533.5,406,486.5,419,486.5,384,415.5,352,303.5,379,510.5,352,344.5,352,517.5,380,319.5,374,542.5,379,399.5,383,351.5,407,533.5,352,525.5,352,288.5,352,423.5,352,463.5,352,351.5,352,439.5,374,525.5,406,303.5,428,319.5,383,493.5,352,542.5,352,327.5,361,439.5,384,454.5,388,542.5,392,478.5,365,303.5,401,335.5,352,399.5,352,486.5,370,335.5,402,454.5,392,359.5,397,351.5,352,415.5,392,439.5,428,335.5,383,406.5,365,463.5,353,311.5,365,344.5,442,335.5,352,359.5,352,533.5,383,470.5,352,430.5,370,478.5,353,406.5,352,383.5,428,517.5,365,510.5,352,493.5,352,510.5,388,383.5,397,493.5,352,470.5,420,517.5,353,478.5,397,470.5,353,391.5,389,510.5,379,303.5,410,359.5,353,335.5,406,517.5,389,375.5,352,375.5,366,327.5,393,463.5,365,359.5],"widths":[26,26,38,16,22,29,26,25,35,38,21,13,8,22,24,8,7,8,8,11,8,38,8,7,17,30,12,8,26,4,44,29,30,8,17,7,26,12,17,43,8,22,21,48,26,38,13,12,26,39,8,34,22,11,8,17,8,8,8,31,17,25,30,26,7,26,8,30,17,26,3,11,26,11,20,21,31,11,11,34,30,30,15,22]},{"frame":1169,"sourceFrame":1172,"xy":[264,256.5,129,229.5,219,354.5,157,201.5,160,340.5,175,256.5,215,340.5,228,382.5,179,312.5,251,312.5,129,368.5,282,229.5,264,340.5,214,229.5,210,284.5,281,340.5,255,215.5,250,326.5,129,326.5,130,271.5,259,284.5,215,201.5,228,215.5,197,284.5,135,256.5,152,215.5,130,382.5,281,271.5,129,340.5,156,368.5,129,312.5,210,243.5,183,354.5,223,256.5,147,271.5,201,201.5,250,271.5,215,395.5,210,271.5,147,382.5,129,215.5,183,298.5,143,326.5,129,395.5,214,368.5,246,368.5,245,340.5,198,340.5,178,271.5,165,368.5,237,271.5,174,243.5,129,354.5,242,284.5,268,215.5,228,298.5,250,243.5,201,326.5,167,271.5,131,298.5,188,215.5,269,354.5,147,284.5,183,395.5,250,298.5,219,312.5,233,243.5,156,354.5,197,382.5,246,229.5,241,215.5,130,284.5,264,243.5,166,298.5,170,326.5,129,201.5,152,229.5,211,215.5,179,201.5,247,201.5,214,326.5,220,201.5,193,229.5,237,256.5],"widths":[26,17,38,16,20,28,25,25,34,38,16,12,12,22,21,9,8,8,8,11,8,2,8,7,20,30,11,9,26,4,44,20,26,8,17,7,26,15,20,40,17,20,21,48,26,39,13,10,26,39,7,31,22,12,8,17,8,7,6,24,16,20,31,26,7,26,7,22,16,26,7,12,17,11,25,22,30,11,17,34,31,21,16,21]},{"frame":1174,"sourceFrame":1176,"xy":[18,64,73.75,64,129.5,64,185.25,64,241,64,296.75,64,352.5,64,408.25,64,18,106,73.75,106,129.5,106,185.25,106,241,106,296.75,106,352.5,106,408.25,106,18,161.5,73.75,161.5,129.5,161.5,185.25,161.5,241,161.5,296.75,161.5,352.5,161.5,408.25,161.5,18,203,73.75,203,185.25,203,241,203,296.75,203,352.5,203,408.25,203,18,259,352.5,259,408.25,259,18,300.5,352.5,300.5,408.25,300.5,18,356,352.5,356,408.25,356,18,397.5,352.5,397.5,408.25,397.5,18,453,352.5,453,408.25,453,18,494.5,408.25,494.5,18,550,352.5,550,408.25,550,18,591.5,352.5,591.5,408.25,591.5,18,647,73.75,647,129.5,647,185.25,647,241,647,296.75,647,352.5,647,408.25,647,18,688.5,73.75,688.5,129.5,688.5,185.25,688.5,241,688.5,296.75,688.5,352.5,688.5,408.25,688.5,18,744,73.75,744,129.5,744,185.25,744,241,744,296.75,744,352.5,744,408.25,744,18,785.5,73.75,785.5,129.5,785.5,296.75,785.5,352.5,785.5,408.25,785.5],"widths":[34,26,38,17,21,29,29,25,36,39,22,13,12,22,25,9,9,8,8,12,8,38,8,8,20,30,11,8,26,3,44,29,30,8,18,7,26,15,21,43,17,21,21,49,27,38,13,13,26,43,7,34,22,11,8,18,8,7,8,32,17,25,31,27,7,27,9,30,20,26,7,12,26,11,26,21,31,11,17,33,31,30,18,22]},{"frame":1177,"sourceFrame":1187,"xy":[129,174.5,19,798.5,129,119.5,297,188.5,19,49.5,75,742.5,352,327.5,19,604.5,129,104.5,130,590.5,241,160.5,75,645.5,241,145.5,240,49.5,408,798.5,241,493.5,241,215.5,130,244.5,241,327.5,353,145.5,352,590.5,19,701.5,130,550.5,75,215.5,352,201.5,18,90.5,242,382.5,408,133.5,130,215.5,408,688.5,352,438.5,130,133.5,74,633.5,185,521.5,74,327.5,18,160.5,74,590.5,20,382.5,358,659.5,185,355.5,241,715.5,352,742.5,408,577.5,129,327.5,18,314.5,298,300.5,130,438.5,74,770.5,18,493.5,296,49.5,74,76.5,185,62.5,129,230.5,19,201.5,185,160.5,296,798.5,74,104.5,352,62.5,130,659.5,407,76.5,185,133.5,242,341.5,407,160.5,240,271.5,185,244.5,18,715.5,185,577.5,186,174.5,18,271.5,74,521.5,74,201.5,75,411.5,302,521.5,130,770.5,19,758.5,408,645.5,407,465.5,298,742.5,19,645.5,75,285.5,408,784.5,186,201.5,241,36.5,296,62.5],"widths":[35,26,39,16,21,29,26,26,36,39,21,12,8,22,24,8,8,8,8,12,9,38,8,7,22,31,11,8,26,4,44,29,26,8,18,8,26,15,12,43,17,22,21,49,27,38,13,13,27,43,8,34,22,12,8,18,8,7,8,31,13,25,31,27,8,27,8,30,18,26,7,12,21,12,26,21,31,11,8,34,31,30,17,22]},{"frame":1192,"sourceFrame":1192,"xy":[185,132.5,185,145.5,185,382.5,186,49.5,186,340.5,186,104.5,185,257.5,297,312.5,187,506.5,298,173.5,297,159.5,297,230.5,297,424.5,186,645.5,186,215.5,296,354.5,185,173.5,297,300.5,185,368.5,185,230.5,297,327.5,185,451.5,297,271.5,296,215.5,186,618.5,296,118.5,187,300.5,297,63.5,185,493.5,241,618.5,185,410.5,186,285.5,185,327.5,297,382.5,296,201.5,186,534.5,296,285.5,186,36.5,185,674.5,185,756.5,296,340.5,297,132.5,186,312.5,185,590.5,296,396.5,298,244.5,187,480.5,185,188.5,296,368.5,186,424.5,186,576.5,296,104.5,186,396.5,187,354.5,187,605.5,185,715.5,186,466.5,185,701.5,297,77.5,185,742.5,186,244.5,298,257.5,185,271.5,185,63.5,297,36.5,246,618.5,296,410.5,297,49.5,186,548.5,185,563.5,297,90.5,186,659.5,191,521.5,298,188.5,186,633.5,74,271.5,296,145.5,186,77.5,186,688.5,297,437.5,185,201.5,186,770.5,185,90.5,185,437.5],"widths":[31,27,36,17,21,29,27,25,34,38,16,12,12,21,21,9,9,8,9,14,8,35,8,9,21,31,11,8,27,2,35,29,26,7,17,7,27,13,18,40,12,21,21,49,26,38,11,13,27,39,7,31,21,11,7,18,8,8,8,31,17,22,31,27,7,21,9,30,17,26,7,12,21,11,26,22,31,12,17,34,31,30,18,22]},{"frame":1194,"sourceFrame":1196,"xy":[157,145.5,81,117.5,308,200.5,95,103.5,285,200.5,393,242.5,348,228.5,113,117.5,308,228.5,176,131.5,193,117.5,203,103.5,290,228.5,95,145.5,37,145.5,162,131.5,388,214.5,241,242.5,180,117.5,353,200.5,384,228.5,344,214.5,86,159.5,407,255.5,308,255.5,58,131.5,273,242.5,59,159.5,54,173.5,220,131.5,290,242.5,416,200.5,94,131.5,255,269.5,130,103.5,420,255.5,139,159.5,357,255.5,67,145.5,18,103.5,321,214.5,240,200.5,18,159.5,171,159.5,130,131.5,412,228.5,357,242.5,339,242.5,198,145.5,240,228.5,241,255.5,99,159.5,67,103.5,20,145.5,72,159.5,335,255.5,220,117.5,189,103.5,229,131.5,285,214.5,254,255.5,19,117.5,152,103.5,50,117.5,45,159.5,276,255.5,370,200.5,144,117.5,304,269.5,428,242.5,433,255.5,268,214.5,384,200.5,255,242.5,86,173.5,379,255.5,18,173.5,376,242.5,117,173.5,19,131.5,268,269.5,121,145.5,246,214.5,402,214.5],"widths":[34,26,35,17,18,29,26,26,35,38,22,12,12,21,24,8,9,8,8,12,8,38,8,7,21,31,12,8,26,4,44,28,30,6,18,7,26,13,21,43,17,21,22,48,27,38,12,13,26,40,7,31,22,11,9,17,8,7,8,31,17,26,31,26,7,24,9,30,16,27,7,12,26,11,26,22,31,11,17,34,30,31,16,21]},{"frame":1203,"sourceFrame":1204,"xy":[240,76.5,129,104.5,241,145.5,186,200.5,80,173.5,186,76.5,352,200.5,75,159.5,352,132.5,20,200.5,352,228.5,186,145.5,407,145.5,352,159.5,353,173.5,18,187.5,19,159.5,74,118.5,74,132.5,353,187.5,408,104.5,352,89.5,130,215.5,20,215.5,186,132.5,18,145.5,409,215.5,74,243.5,74,76.5,75,173.5,186,215.5,19,76.5,242,159.5,185,159.5,18,228.5,408,118.5,241,104.5,186,89.5,19,118.5,129,228.5,185,187.5,74,145.5,408,228.5,130,132.5,19,243.5,131,173.5,130,187.5,352,145.5,408,200.5,19,104.5,352,76.5,241,89.5,185,118.5,20,173.5,352,215.5,408,159.5,74,215.5,130,76.5,204,187.5,241,173.5,74,89.5,242,118.5,18,132.5,129,89.5,241,187.5,130,159.5,408,76.5,185,104.5,407,89.5,130,118.5,74,228.5,186,228.5,130,145.5,353,104.5,242,215.5,407,132.5,407,187.5,186,173.5,408,173.5,242,200.5,74,104.5,130,200.5,352,118.5,241,132.5],"widths":[31,27,38,16,16,29,30,25,35,38,22,12,14,22,24,9,8,9,9,12,8,38,8,7,21,31,11,8,26,2,43,29,34,8,18,7,26,15,17,40,16,22,21,48,26,38,12,12,26,39,8,30,22,12,8,17,9,7,7,31,18,25,31,27,8,26,8,31,17,26,8,12,26,11,25,22,31,12,17,34,31,30,17,21]},{"frame":1207,"sourceFrame":1208,"xy":[186,243.5,226,479.5,185,423.5,185,409.5,208,188.5,186,479.5,257,409.5,208,312.5,185,229.5,240,312.5,248,437.5,217,201.5,239,409.5,185,326.5,186,201.5,217,437.5,230,437.5,230,326.5,199,215.5,280,493.5,284,451.5,203,382.5,271,368.5,186,215.5,257,354.5,216,493.5,230,243.5,243,451.5,226,354.5,199,465.5,248,382.5,234,201.5,189,368.5,212,215.5,248,243.5,239,423.5,222,299.5,249,256.5,262,326.5,225,284.5,185,188.5,252,299.5,257,451.5,258,201.5,248,465.5,231,340.5,185,382.5,270,243.5,185,270.5,235,188.5,221,270.5,185,256.5,217,256.5,271,256.5,225,229.5,208,465.5,216,340.5,266,479.5,279,465.5,185,396.5,243,326.5,186,340.5,243,215.5,185,299.5,185,465.5,208,409.5,252,479.5,221,396.5,235,270.5,257,396.5,212,354.5,226,215.5,257,270.5,231,465.5,185,493.5,252,493.5,225,368.5,213,326.5,185,312.5,186,284.5,185,437.5,208,451.5,239,229.5,185,354.5],"widths":[34,21,37,17,21,29,26,25,35,38,13,12,12,22,24,8,8,8,8,12,7,38,7,7,21,31,12,9,26,3,44,21,30,8,17,11,25,15,16,43,17,22,21,10,25,38,13,13,26,38,7,26,21,12,9,16,8,7,8,31,16,25,31,26,7,26,8,29,17,26,8,12,20,11,17,22,31,11,17,34,26,30,17,22]},{"frame":1210,"sourceFrame":1217,"xy":[296,49.5,18,770.5,351,673.5,408,340.5,296,90.5,19,285.5,295,770.5,19,728.5,352,90.5,18,673.5,407,673.5,130,90.5,74,188.5,407,49.5,352,244.5,18,631.5,240,770.5,185,188.5,296,728.5,130,49.5,18,244.5,18,576.5,407,576.5,19,438.5,296,673.5,18,49.5,19,382.5,185,770.5,351,631.5,129,146.5,351,146.5,241,90.5,406,244.5,18,90.5,73,770.5,296,631.5,407,285.5,408,728.5,184,673.5,407,90.5,18,188.5,185,49.5,301,340.5,240,49.5,184,728.5,130,673.5,240,146.5,240,728.5,407,203.5,129,728.5,129,188.5,352,770.5,129,631.5,19,534.5,74,146.5,352,49.5,296,188.5,185,631.5,185,313.5,18,479.5,185,90.5,407,631.5,184,146.5,73,508.5,18,340.5,407,188.5,129,313.5,351,188.5,74,90.5,240,188.5,240,631.5,352,285.5,19,146.5,74,728.5,407,146.5,407,770.5,240,216.5,352,534.5,73,49.5,130,770.5,351,728.5,407,479.5,296,146.5,240,673.5],"widths":[31,26,35,16,22,29,27,25,35,39,21,12,12,22,24,8,8,8,8,12,9,35,8,7,22,31,12,8,27,4,45,30,31,8,18,8,26,15,21,43,18,21,21,49,27,38,22,13,26,39,8,38,22,12,8,17,8,7,8,31,17,26,31,27,8,26,13,31,17,27,8,12,26,12,26,21,31,12,18,34,31,31,17,22]},{"frame":1224,"sourceFrame":1224,"xy":[240,189.5,407,216.5,296,120.5,241,522.5,352,230.5,186,590.5,352,91.5,297,341.5,241,77.5,408,202.5,185,271.5,408,314.5,351,715.5,296,230.5,296,786.5,240,632.5,73,63.5,185,703.5,407,91.5,408,425.5,74,605.5,352,341.5,351,772.5,130,326.5,408,647.5,185,36.5,186,258.5,352,383.5,296,562.5,18,133.5,74,590.5,296,465.5,351,494.5,407,562.5,296,618.5,296,452.5,73,383.5,19,243.5,129,216.5,296,632.5,296,743.5,18,577.5,74,730.5,73,175.5,407,757.5,241,410.5,129,439.5,18,354.5,352,452.5,240,63.5,407,535.5,407,618.5,18,63.5,353,271.5,74,508.5,74,396.5,185,146.5,407,673.5,352,535.5,18,798.5,241,230.5,75,285.5,351,243.5,351,605.5,18,689.5,296,673.5,352,106.5,185,354.5,246,590.5,352,51.5,185,368.5,129,549.5,352,36.5,186,480.5,129,772.5,240,300.5,129,660.5,74,618.5,129,106.5,297,160.5,240,146.5,241,743.5,407,120.5,240,133.5],"widths":[31,26,35,16,21,28,26,25,35,39,21,12,13,22,25,9,9,8,9,12,8,38,9,8,21,31,12,8,26,4,44,26,26,8,17,7,27,15,21,39,17,22,21,49,26,39,13,13,26,40,8,34,22,11,8,17,8,8,8,31,17,25,31,27,8,26,8,30,12,26,7,13,26,11,26,22,31,12,18,34,31,30,18,22]}]
function ajedrezTypeSample(time: number): AjedrezTypeSample {
    const frame = Math.floor(Math.max(48, time) * 24 + 1e-7)
    let sample = AJEDREZ_TYPE_SAMPLES[0]
    for (const next of AJEDREZ_TYPE_SAMPLES) { if (next.frame > frame) break; sample = next }
    return sample
}
/** Attach only to the existing phase36 native component instance, beneath its
 * existing Phase36 wrapper. Public native layer names scope all84 words; no
 * generated text, private Framer data or new visual layer is created. */
export function withAjedrezTypeGridMotion(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, forwardedRef) => {
        const state = React.useContext(Context), latest = React.useRef(state), own = React.useRef<HTMLElement | null>(null), [host, setHost] = React.useState<HTMLElement | null>(null)
        const update = React.useRef<(() => void) | null>(null)
        latest.current = state
        const bindHost = React.useCallback((node: HTMLElement | null) => { own.current = node; setHost(node); writeRef(forwardedRef, node) }, [forwardedRef])
        useOwnLayoutEffect(() => {
            if (!host) return
            const properties = ["left", "top", "transition", "transform", "transform-origin"] as const
            type Property = typeof properties[number]
            type Owned = { before: Record<Property, { value: string; priority: string }>; written: Partial<Record<Property, string>>; fit: number; cssTransform: string }
            const records = new Map<HTMLElement, Owned>(), indices = new Map(AJEDREZ_TYPE_WORDS.map((name, index) => [name, index])), ruleNames = new Set(AJEDREZ_TYPE_RULES)
            const ruleRecords = new Map<HTMLElement, { value: string; priority: string }>()
            let disposed = false, dirty = true, previousSample = -1, previousWidth = -1
            const restore = (node: HTMLElement, record: Owned) => {
                for (const property of properties) if (record.written[property] !== undefined && node.style.getPropertyValue(property) === record.written[property]) {
                    const original = record.before[property]
                    if (original.value) node.style.setProperty(property, original.value, original.priority)
                    else node.style.removeProperty(property)
                }
            }
            const restoreRule = (node: HTMLElement) => {
                const original = ruleRecords.get(node)
                if (!original) return
                if (node.style.opacity === "0") {
                    if (original.value) node.style.setProperty("opacity", original.value, original.priority)
                    else node.style.removeProperty("opacity")
                }
                ruleRecords.delete(node)
            }
            const clear = () => { for (const [node, record] of records) restore(node, record); records.clear(); for (const node of ruleRecords.keys()) restoreRule(node) }
            const write = (node: HTMLElement, left: number, top: number, sourceWidth: number | null, screenUnit: number) => {
                let record = records.get(node)
                if (!record) {
                    const capture = (property: Property) => ({ value: node.style.getPropertyValue(property), priority: node.style.getPropertyPriority(property) })
                    record = { before: { left: capture("left"), top: capture("top"), transition: capture("transition"), transform: capture("transform"), "transform-origin": capture("transform-origin") }, written: {}, fit: 1, cssTransform: getComputedStyle(node).transform }; records.set(node, record)
                }
                const previousFit = node.style.transform === record.written.transform ? record.fit : 1
                for (const property of properties) {
                    const current = node.style.getPropertyValue(property)
                    // A new native responsive declaration supersedes our prior
                    // write; retain that caller value for later static cleanup.
                    if (record.written[property] !== undefined && current !== record.written[property]) record.before[property] = { value: current, priority: node.style.getPropertyPriority(property) }
                }
                // Measure only this native word's real text runs. Box width54
                // is not its glyph width; a range also respects the loaded font.
                const walker = node.ownerDocument.createTreeWalker(node, NodeFilter.SHOW_TEXT), range = node.ownerDocument.createRange()
                let textWidth = 0, text: Node | null
                while ((text = walker.nextNode())) { range.selectNodeContents(text); textWidth += range.getBoundingClientRect().width }
                const naturalWidth = textWidth / Math.max(.0001, screenUnit * previousFit)
                const fit = sourceWidth !== null && naturalWidth > 0 ? Math.min(1, sourceWidth / naturalWidth) : 1
                const base = record.before.transform.value || (record.cssTransform === "none" ? "" : record.cssTransform)
                const values = { left: left + "px", top: top + "px", transition: "none", transform: fit < 1 ? (base ? base + " " : "") + "scaleX(" + fit + ")" : record.before.transform.value, "transform-origin": fit < 1 ? "0px 0px" : record.before["transform-origin"].value }
                for (const property of properties) {
                    if (node.style.getPropertyValue(property) !== values[property]) node.style.setProperty(property, values[property])
                    record.written[property] = node.style.getPropertyValue(property)
                }
                record.fit = fit
            }
            const refresh = () => {
                if (disposed || own.current !== host) return
                const current = latest.current, live = current.index === 35 && !current.frozen && !current.reduced
                if (!live) { clear(); dirty = true; previousSample = -1; host.setAttribute("data-source-ajedrez-grid-status", "native-poster"); host.setAttribute("data-source-ajedrez-grid-count", "0"); return }
                const sample = ajedrezTypeSample(current.time), unit = host.offsetWidth > 0 ? host.offsetWidth / 480 : 1, screenUnit = host.offsetWidth > 0 ? host.getBoundingClientRect().width / host.offsetWidth : 1
                // A held sample needs no repeated text measurement or layout.
                if (!dirty && previousSample === sample.sourceFrame && previousWidth === host.offsetWidth) return
                dirty = false; previousSample = sample.sourceFrame; previousWidth = host.offsetWidth
                for (const [node, record] of records) if (!host.contains(node)) { restore(node, record); records.delete(node) }
                for (const node of ruleRecords.keys()) if (!host.contains(node)) restoreRule(node)
                const gridVisible = current.time >= 1169 / 24
                let count = 0
                for (const node of Array.from(host.querySelectorAll<HTMLElement>("[data-framer-name]"))) {
                    const name = node.getAttribute("data-framer-name") ?? "", index = indices.get(name)
                    if (ruleNames.has(name)) {
                        if (gridVisible) restoreRule(node)
                        else {
                            if (!ruleRecords.has(node) || node.style.opacity !== "0") ruleRecords.set(node, { value: node.style.opacity, priority: node.style.getPropertyPriority("opacity") })
                            node.style.opacity = "0"
                        }
                    }
                    if (index === undefined) continue
                    write(node, Math.round(sample.xy[index * 2] * unit * 100) / 100, Math.round(sample.xy[index * 2 + 1] * unit * 100) / 100, sample.sourceFrame === 1176 ? null : sample.widths[index] * unit, screenUnit); count++
                }
                host.setAttribute("data-source-ajedrez-grid-sample", String(sample.sourceFrame)); host.setAttribute("data-source-ajedrez-grid-start", String(sample.frame)); host.setAttribute("data-source-ajedrez-grid-count", String(count)); host.setAttribute("data-source-ajedrez-grid-status", count === 84 ? "sample-hold" : "incomplete-native-binding")
            }
            update.current = refresh; refresh()
            const invalidate = () => { dirty = true; refresh() }
            const resize = new ResizeObserver(invalidate), mutation = new MutationObserver(invalidate)
            resize.observe(host); mutation.observe(host, { childList: true, subtree: true })
            return () => { disposed = true; resize.disconnect(); mutation.disconnect(); if (update.current === refresh) update.current = null; clear() }
        }, [host])
        useOwnLayoutEffect(() => { update.current?.() }, [state.time, state.index, state.frozen, state.reduced])
        return <Component {...props} ref={bindHost} data-source-ajedrez-type-grid="sampled-native-words" />
    })
}
