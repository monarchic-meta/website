import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"

/**
 * Source inspiration / native media lifecycle. First binding: HERO-006,
 * Mac Moss Studio's genuine Eco-End film. Keep the existing native video,
 * poster, source, loop, mute and controls. Verify the native host/Playing bridge
 * before changing serialized Playing to false for an idle editor Canvas.
 * The override supplies the live Playing prop once it owns a host. Native
 * controls can still pause playback, including across a viewport round trip.
 * This loading adaptation holds its frame outside a visible Preview instead
 * of spending playback work behind the board. It does not recreate the source
 * site's hidden-tab GIF clock. Canvas, exports and reduced motion stay still.
 * A missing native host keeps the caller's live Playing value unchanged.
 * The manual variant begins with Playing false and admits native controls
 * without starting the film. Only an admitted native Play marks it started;
 * visibility returns may then resume it unless the user manually paused it.
 * No media element, decoder, canvas, timer or animation loop is created here.
 */
type LayerProps = { [key: string]: unknown; style?: React.CSSProperties }
type VideoPermission = { active: boolean; allowed: boolean }
type ManagedVideo = {
    video: HTMLVideoElement
    permission: VideoPermission
    pending: boolean
    onPlay: () => void
    onReady: () => void
}
const OWNER = Symbol.for("monarchic.source-native-video-visibility.v1")

function owner(video: HTMLVideoElement) {
    return video as unknown as Record<symbol, VideoPermission | undefined>
}
function writeRef<T>(ref: React.ForwardedRef<T>, value: T | null) {
    if (typeof ref === "function") ref(value)
    else if (ref) ref.current = value
}
function visiblePaint(host: HTMLElement) {
    for (let node: HTMLElement | null = host; node; node = node.parentElement) {
        const style = getComputedStyle(node)
        if (style.display === "none" || style.visibility !== "visible" || Number(style.opacity) === 0) return false
    }
    return true
}

function visibleNativeVideo(Component: ComponentType<LayerProps>, autoplay: boolean): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const target = RenderTarget.current()
        const frozen = useIsStaticRenderer() || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail
        const [host, setHost] = React.useState<HTMLElement | null>(null)
        const [playback, setPlayback] = React.useState<{ host: HTMLElement | null; allowed: boolean }>({ host: null, allowed: false })
        const manuallyPaused = React.useRef(false)
        const started = React.useRef(autoplay)
        const bind = React.useCallback((node: HTMLElement | null) => {
            setHost(previous => previous === node ? previous : node)
            writeRef(ref, node)
        }, [ref])

        React.useEffect(() => {
            if (!host) return
            let active = true, intersecting = false, managed: ManagedVideo | null = null, videoVisibility: MutationObserver | null = null
            const setPlaying = (allowed: boolean) => setPlayback(previous => previous.host === host && previous.allowed === allowed ? previous : { host, allowed })
            const reduced = frozen ? null : window.matchMedia("(prefers-reduced-motion: reduce)")
            const owns = (entry: ManagedVideo) => owner(entry.video)[OWNER] === entry.permission
            const hold = (entry: ManagedVideo) => {
                entry.permission.allowed = false
                if (owns(entry) && !entry.video.paused) entry.video.pause()
            }
            const play = (entry: ManagedVideo) => {
                if (!active || !owns(entry) || !entry.permission.allowed || !started.current || manuallyPaused.current || entry.pending || !entry.video.paused) return
                try {
                    entry.pending = true
                    const result = entry.video.play()
                    Promise.resolve(result).then(() => {
                        entry.pending = false
                        if (owns(entry) && (!entry.permission.active || !entry.permission.allowed || manuallyPaused.current)) entry.video.pause()
                    }, () => { entry.pending = false })
                } catch { entry.pending = false }
            }
            const release = () => {
                const previous = managed
                managed = null
                if (!previous) return
                previous.permission.active = false
                hold(previous)
                previous.video.removeEventListener("play", previous.onPlay)
                previous.video.removeEventListener("pause", onPause)
                previous.video.removeEventListener("loadedmetadata", previous.onReady)
                videoVisibility?.disconnect()
                // Retain the inactive token until the node is collected or a
                // new owner replaces it, so late play promises cannot escape.
            }
            const onPause = () => {
                if (managed && owns(managed) && managed.permission.allowed && managed.video.paused) {
                    manuallyPaused.current = true
                    setPlaying(false)
                }
            }
            const refresh = () => {
                if (!active) return
                const video = host.tagName === "VIDEO" ? host as HTMLVideoElement : host.getElementsByTagName("video")[0] ?? null
                if (video !== managed?.video) {
                    release()
                    if (video) {
                        const permission: VideoPermission = { active: true, allowed: false }
                        const entry: ManagedVideo = { video, permission, pending: false, onPlay() {}, onReady() {} }
                        owner(video)[OWNER] = permission
                        entry.onPlay = () => {
                            if (!owns(entry)) return
                            if (!permission.allowed) hold(entry)
                            else { started.current = true; manuallyPaused.current = false; setPlaying(true) }
                        }
                        entry.onReady = () => play(entry)
                        managed = entry
                        video.addEventListener("play", entry.onPlay)
                        video.addEventListener("pause", onPause)
                        video.addEventListener("loadedmetadata", entry.onReady)
                    }
                }
                const entry = managed
                videoVisibility?.disconnect()
                if (videoVisibility && entry) for (let node: HTMLElement | null = entry.video; node && node !== host; node = node.parentElement) {
                    videoVisibility.observe(node, { attributes: true, attributeFilter: ["style", "class", "hidden"] })
                }
                const admitted = !frozen && intersecting && !document.hidden && !reduced?.matches && visiblePaint(host)
                setPlaying(admitted && started.current && !manuallyPaused.current)
                if (!entry || !owns(entry)) return
                const allowed = admitted && visiblePaint(entry.video)
                const changed = allowed !== entry.permission.allowed
                entry.permission.allowed = allowed
                host.setAttribute("data-source-native-video-active", String(allowed))
                if (!allowed) hold(entry)
                else if (changed) play(entry)
            }
            const children = new MutationObserver(refresh)
            children.observe(host, { childList: true, subtree: true })
            const visibility = frozen ? null : new MutationObserver(refresh)
            videoVisibility = frozen ? null : new MutationObserver(refresh)
            const paintPath: HTMLElement[] = []
            const onPaintEnd = (event: Event) => {
                // Attribute observers sample the beginning of CSS transitions.
                // Recheck the settled paint without polling or another clock.
                if (event.currentTarget === host || event.target === event.currentTarget) refresh()
            }
            if (visibility) for (let node: HTMLElement | null = host; node; node = node.parentElement) {
                visibility.observe(node, { attributes: true, attributeFilter: ["style", "class", "hidden"] })
                node.addEventListener("transitionend", onPaintEnd)
                node.addEventListener("animationend", onPaintEnd)
                paintPath.push(node)
            }
            const intersection = frozen ? null : new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; refresh() })
            intersection?.observe(host)
            if (!frozen) document.addEventListener("visibilitychange", refresh)
            reduced?.addEventListener("change", refresh)
            refresh()
            return () => {
                active = false
                intersection?.disconnect(); children.disconnect(); visibility?.disconnect(); videoVisibility?.disconnect()
                for (const node of paintPath) {
                    node.removeEventListener("transitionend", onPaintEnd)
                    node.removeEventListener("animationend", onPaintEnd)
                }
                document.removeEventListener("visibilitychange", refresh)
                reduced?.removeEventListener("change", refresh)
                const wasOwner = managed && owns(managed)
                release()
                if (wasOwner) host.removeAttribute("data-source-native-video-active")
            }
        }, [host, frozen])
        const playing = !frozen && (host ? playback.host === host && playback.allowed : autoplay ? props.playing ?? true : false)
        return <Component {...props} ref={bind} playing={playing} data-source-native-video-visibility={host ? "managed" : "awaiting-host"} />
    })
}

/** Existing automatic source-film behavior, including lazy native admission. */
export function withVisibleNativeVideo(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return visibleNativeVideo(Component, true)
}

/** Manual native controls first; hidden and frozen films remain suspended. */
export function withVisibleManualNativeVideo(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return visibleNativeVideo(Component, false)
}
