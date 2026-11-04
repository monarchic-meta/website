import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"

/**
 * Source inspiration — HERO-013 / FORMAT, Obys × DES; HERO-015 / MECHA,
 * Widelab / Grzegorz Leśniewicz. Independent behavior code for native layers.
 * Poses follow retained Desktop observations; interpolation is independently
 * fitted. This does not establish the original scrub curves or Phone behavior.
 * Keep native actor children editable and source credits visible. No source
 * website JavaScript, DOM queries, geometry, or runtime media are used here.
 *
 * FORMAT: untransformed ancestor, 1440-unit native actors and a long root.
 * Attach withFormatDocument to its root spacer, and the matching actor override
 * to each named actor. Phone below 1280px keeps its separate native flow.
 * These public React 18 HOCs preserve all props, native transforms and refs.
 */

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
    [key: string]: unknown
    style?: React.CSSProperties
    onClick?: React.MouseEventHandler<HTMLElement>
    onTap?: (event: NativeActivationEvent, info?: unknown) => void
    onKeyDown?: React.KeyboardEventHandler<HTMLElement>
    tabIndex?: number
}
type NativeLayer = React.ComponentType<LayerProps>
type IndependentTransforms = React.CSSProperties & {
    translate?: string
    scale?: string
    rotate?: string
}
type Viewport = { width: number; height: number; scrollY: number }
type Pose = {
    y: number
    left: number
    top: number
    scale: number
    rotate: number
    opacity: number
}
type Track = { width: number; height: number; poses: Pose[] }

const SERVER_VIEWPORT: Viewport = { width: 1440, height: 810, scrollY: 0 }
const FORMAT_WIDTH = 1440
const FORMAT_HEIGHT = 15158.25
const DESKTOP_MIN = 1280
let viewport: Viewport = SERVER_VIEWPORT
let viewportFrame = 0
const viewportListeners = new Set<() => void>()

function readViewport() {
    const next = {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollY: Math.max(0, window.scrollY),
    }
    if (
        next.width !== viewport.width ||
        next.height !== viewport.height ||
        next.scrollY !== viewport.scrollY
    ) {
        viewport = next
        for (const notify of viewportListeners) notify()
    }
}

function scheduleViewport() {
    if (viewportFrame) return
    viewportFrame = window.requestAnimationFrame(() => {
        viewportFrame = 0
        readViewport()
    })
}

function subscribeViewport(notify: () => void) {
    const first = viewportListeners.size === 0
    viewportListeners.add(notify)
    if (first) {
        window.addEventListener("scroll", scheduleViewport, { passive: true })
        window.addEventListener("resize", scheduleViewport)
        readViewport()
    }
    return () => {
        viewportListeners.delete(notify)
        if (viewportListeners.size === 0) {
            window.removeEventListener("scroll", scheduleViewport)
            window.removeEventListener("resize", scheduleViewport)
            if (viewportFrame) window.cancelAnimationFrame(viewportFrame)
            viewportFrame = 0
        }
    }
}

const subscribeFrozen = () => () => {}
function useViewport() {
    const frozen = useIsStaticRenderer() || RenderTarget.current() === RenderTarget.canvas
    return {
        frozen,
        view: React.useSyncExternalStore(
            frozen ? subscribeFrozen : subscribeViewport,
            frozen ? () => SERVER_VIEWPORT : () => viewport,
            () => SERVER_VIEWPORT
        ),
    }
}

function interpolate(poses: Pose[], y: number): Pose {
    if (y <= poses[0].y) return poses[0]
    for (let i = 1; i < poses.length; i++) {
        if (y > poses[i].y) continue
        const a = poses[i - 1]
        const b = poses[i]
        const t = (y - a.y) / Math.max(1, b.y - a.y)
        // Smooth interpolation is a declared fit, not recovered source code.
        const eased = t * t * (3 - 2 * t)
        const mix = (start: number, end: number) => start + (end - start) * eased
        return {
            y,
            left: mix(a.left, b.left),
            top: mix(a.top, b.top),
            scale: mix(a.scale, b.scale),
            rotate: mix(a.rotate, b.rotate),
            opacity: mix(a.opacity, b.opacity),
        }
    }
    return poses[poses.length - 1]
}

// Observed source poses converted from 1280×720 to the 1440-unit native recipe.
const FORMAT_TRACKS: Record<string, Track> = {
  "opening-wordmark": {
    "width": 1440,
    "height": 273,
    "poses": [
      {
        "y": 0,
        "left": 0,
        "top": 0,
        "scale": 1,
        "rotate": 0,
        "opacity": 1
      },
      {
        "y": 804.375,
        "left": 0,
        "top": -40,
        "scale": 1,
        "rotate": 0,
        "opacity": 0.2
      },
      {
        "y": 2415.375,
        "left": 0,
        "top": -273,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      }
    ]
  },
  "vertical-opening": {
    "width": 409,
    "height": 426,
    "poses": [
      {
        "y": 0,
        "left": 553,
        "top": 436,
        "scale": 1,
        "rotate": 0,
        "opacity": 1
      },
      {
        "y": 804.375,
        "left": 553,
        "top": -330,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      }
    ]
  },
  "horizontal-wide": {
    "width": 1045,
    "height": 448,
    "poses": [
      {
        "y": 0,
        "left": 198,
        "top": 868,
        "scale": 1,
        "rotate": 0,
        "opacity": 1
      },
      {
        "y": 804.375,
        "left": 198,
        "top": 63,
        "scale": 1,
        "rotate": 0,
        "opacity": 1
      },
      {
        "y": 2415.375,
        "left": 198,
        "top": -450,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      }
    ]
  },
  "vertical-deck": {
    "width": 335,
    "height": 426,
    "poses": [
      {
        "y": 1620,
        "left": 552,
        "top": 500,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      },
      {
        "y": 2415.375,
        "left": 552,
        "top": 195,
        "scale": 1,
        "rotate": 0,
        "opacity": 1
      },
      {
        "y": 3237.75,
        "left": 552,
        "top": -480,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      }
    ]
  },
  "paired-dials": {
    "width": 1440,
    "height": 697,
    "poses": [
      {
        "y": 2415.375,
        "left": 0,
        "top": 750,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      },
      {
        "y": 3237.75,
        "left": 0,
        "top": 50,
        "scale": 1,
        "rotate": 0,
        "opacity": 1
      },
      {
        "y": 4043.25,
        "left": 0,
        "top": -700,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      }
    ]
  },
  "triangle-format": {
    "width": 704,
    "height": 609,
    "poses": [
      {
        "y": 3237.75,
        "left": 368,
        "top": 850,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      },
      {
        "y": 4043.25,
        "left": 368,
        "top": 80,
        "scale": 1,
        "rotate": 0,
        "opacity": 1
      },
      {
        "y": 4844.25,
        "left": 368,
        "top": -620,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      },
      {
        "y": 7282.125,
        "left": 368,
        "top": 650,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      },
      {
        "y": 8095.5,
        "left": 368,
        "top": 72,
        "scale": 1,
        "rotate": 0,
        "opacity": 1
      },
      {
        "y": 8902.125,
        "left": 368,
        "top": -610,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      }
    ]
  },
  "photo-window": {
    "width": 1045,
    "height": 448,
    "poses": [
      {
        "y": 5667.75,
        "left": 198,
        "top": 720,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      },
      {
        "y": 6477.75,
        "left": 198,
        "top": 110,
        "scale": 1,
        "rotate": 0,
        "opacity": 1
      },
      {
        "y": 7282.125,
        "left": 198,
        "top": -450,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      }
    ]
  },
  "crossing-strips": {
    "width": 1440,
    "height": 841,
    "poses": [
      {
        "y": 6477.75,
        "left": 0,
        "top": 780,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      },
      {
        "y": 7282.125,
        "left": 0,
        "top": 100,
        "scale": 1,
        "rotate": 0,
        "opacity": 1
      },
      {
        "y": 8095.5,
        "left": 0,
        "top": -450,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      }
    ]
  },
  "oversized-ring-field": {
    "width": 1440,
    "height": 1800,
    "poses": [
      {
        "y": 8095.5,
        "left": 0,
        "top": 780,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      },
      {
        "y": 8902.125,
        "left": 0,
        "top": -80,
        "scale": 1,
        "rotate": 0,
        "opacity": 1
      },
      {
        "y": 9708.75,
        "left": 0,
        "top": -630,
        "scale": 1,
        "rotate": 0,
        "opacity": 1
      },
      {
        "y": 10525.5,
        "left": 0,
        "top": -1050,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      }
    ]
  },
  "poster-advice": {
    "width": 1440,
    "height": 1617,
    "poses": [
      {
        "y": 10525.5,
        "left": 0,
        "top": 820,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      },
      {
        "y": 11328.75,
        "left": 0,
        "top": 40,
        "scale": 1,
        "rotate": 0,
        "opacity": 1
      },
      {
        "y": 12139.875,
        "left": 0,
        "top": -120,
        "scale": 0.85,
        "rotate": 0,
        "opacity": 1
      },
      {
        "y": 12952.125,
        "left": 360,
        "top": 70,
        "scale": 0.48,
        "rotate": -5,
        "opacity": 1
      },
      {
        "y": 13766.625,
        "left": 380,
        "top": 110,
        "scale": 0.42,
        "rotate": 18,
        "opacity": 1
      },
      {
        "y": 14337,
        "left": 400,
        "top": 160,
        "scale": 0.36,
        "rotate": -8,
        "opacity": 1
      }
    ]
  },
  "poster-guides": {
    "width": 1440,
    "height": 810,
    "poses": [
      {
        "y": 12139.875,
        "left": 0,
        "top": 800,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      },
      {
        "y": 12952.125,
        "left": 0,
        "top": 0,
        "scale": 1,
        "rotate": 0,
        "opacity": 1
      },
      {
        "y": 13766.625,
        "left": 0,
        "top": 0,
        "scale": 1,
        "rotate": 0,
        "opacity": 1
      },
      {
        "y": 14337,
        "left": 0,
        "top": -700,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      }
    ]
  },
  "format-footer": {
    "width": 1440,
    "height": 273,
    "poses": [
      {
        "y": 13766.625,
        "left": 0,
        "top": 1000,
        "scale": 1,
        "rotate": 0,
        "opacity": 0
      },
      {
        "y": 14337,
        "left": 0,
        "top": 540,
        "scale": 1,
        "rotate": 0,
        "opacity": 1
      }
    ]
  }
}

function formatActor(Component: NativeLayer, key: string): NativeLayer {
    const track = FORMAT_TRACKS[key]
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const { frozen, view } = useViewport()
        if (frozen || view.width < DESKTOP_MIN) return <Component {...props} ref={ref} />
        const unit = view.width / FORMAT_WIDTH
        const pose = interpolate(track.poses, view.scrollY / unit)
        // Extra prototype review content follows the original document. Let
        // the terminal composition scroll out naturally at that boundary.
        const tailScroll = Math.max(0, view.scrollY - (FORMAT_HEIGHT * unit - view.height))
        const beyondSource = view.scrollY >= FORMAT_HEIGHT * unit
        const style: IndependentTransforms = {
            ...props.style,
            position: "fixed",
            left: 0,
            top: 0,
            width: track.width,
            height: track.height,
            translate: `${pose.left * unit}px ${pose.top * unit - tailScroll}px`,
            scale: String(pose.scale * unit),
            rotate: `${pose.rotate}deg`,
            transformOrigin: "top left",
            opacity: beyondSource ? 0 : pose.opacity,
            pointerEvents: beyondSource || pose.opacity < 0.01 ? "none" : props.style?.pointerEvents,
        }
        return <Component {...props} ref={ref} style={style} />
    })
}

export function withFormatDocument(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const { frozen, view } = useViewport()
        const style = frozen || view.width < DESKTOP_MIN
            ? props.style
            : { ...props.style, height: FORMAT_HEIGHT * view.width / FORMAT_WIDTH }
        return <Component {...props} ref={ref} style={style} />
    })
}

export function withFormatWordmark(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return formatActor(Component, "opening-wordmark")
}
export function withFormatVerticalOpening(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return formatActor(Component, "vertical-opening")
}
export function withFormatHorizontalWide(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return formatActor(Component, "horizontal-wide")
}
export function withFormatVerticalDeck(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return formatActor(Component, "vertical-deck")
}
export function withFormatPairedDials(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return formatActor(Component, "paired-dials")
}
export function withFormatTriangle(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return formatActor(Component, "triangle-format")
}
export function withFormatPhotoWindow(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return formatActor(Component, "photo-window")
}
export function withFormatCrossingStrips(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return formatActor(Component, "crossing-strips")
}
export function withFormatRingField(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return formatActor(Component, "oversized-ring-field")
}
export function withFormatPosterAdvice(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return formatActor(Component, "poster-advice")
}
export function withFormatPosterGuides(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return formatActor(Component, "poster-guides")
}
export function withFormatFooter(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return formatActor(Component, "format-footer")
}

type ToggleName = "notes" | "daughter"
let toggles = { notes: false, daughter: false }
const toggleListeners = new Set<() => void>()
function subscribeToggles(notify: () => void) {
    toggleListeners.add(notify)
    return () => { toggleListeners.delete(notify) }
}
function toggle(name: ToggleName) {
    toggles = { ...toggles, [name]: !toggles[name] }
    for (const notify of toggleListeners) notify()
}
function useToggle(name: ToggleName) {
    const frozen = useIsStaticRenderer() || RenderTarget.current() === RenderTarget.canvas
    return {
        frozen,
        enabled: React.useSyncExternalStore(
            frozen ? subscribeFrozen : subscribeToggles,
            frozen ? () => false : () => toggles[name],
            () => false
        ),
    }
}
function toggleButton(Component: NativeLayer, name: ToggleName): NativeLayer {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const { enabled, frozen } = useToggle(name)
        const activate = useNativeActivation(() => toggle(name), frozen)
        return <Component
            {...props}
            ref={ref}
            role="button"
            tabIndex={props.tabIndex ?? 0}
            aria-pressed={enabled}
            onClick={(event: React.MouseEvent<HTMLElement>) => {
                props.onClick?.(event)
                activate("click", !!event.defaultPrevented)
            }}
            onTap={(event: NativeActivationEvent, info?: unknown) => {
                props.onTap?.(event, info)
                activate("tap", !!event.defaultPrevented)
            }}
            onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
                props.onKeyDown?.(event)
                if (
                    !frozen && !event.defaultPrevented &&
                    event.currentTarget.tagName !== "BUTTON" &&
                    (event.key === "Enter" || event.key === " ")
                ) {
                    event.preventDefault()
                    activate("key", false)
                }
            }}
        />
    })
}
function toggleLayer(Component: NativeLayer, name: ToggleName): NativeLayer {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const { enabled } = useToggle(name)
        return <Component
            {...props}
            ref={ref}
            aria-hidden={!enabled}
            style={{
                ...props.style,
                opacity: enabled ? 1 : 0,
                visibility: enabled ? "visible" : "hidden",
                // Notes and daughter artwork are decorative, even when visible.
                pointerEvents: "none",
            }}
        />
    })
}

export function withFormatNotesButton(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return toggleButton(Component, "notes")
}
export function withFormatDaughterButton(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return toggleButton(Component, "daughter")
}
export function withFormatNote(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return toggleLayer(Component, "notes")
}
export function withFormatDaughter(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return toggleLayer(Component, "daughter")
}

/** Plain chip artwork must disappear beneath transparent Daughter alternatives. */
export function withFormatDaughterOriginal(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const { enabled } = useToggle("daughter")
        return <Component
            {...props}
            ref={ref}
            aria-hidden={enabled}
            style={{
                ...props.style,
                opacity: enabled ? 0 : 1,
                visibility: enabled ? "hidden" : "visible",
                pointerEvents: "none",
            }}
        />
    })
}

function toggleValue(Component: NativeLayer, name: ToggleName): NativeLayer {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const { enabled } = useToggle(name)
        // Framer's documented Text Content override, applied only to the
        // separate editable numeric Text node inside each native button.
        return <Component {...props} ref={ref} text={enabled ? "1" : "0"} />
    })
}
export function withFormatNotesValue(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return toggleValue(Component, "notes")
}
export function withFormatDaughterValue(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return toggleValue(Component, "daughter")
}

export function withMechaIndex(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const { frozen, view } = useViewport()
        if (frozen || view.width < DESKTOP_MIN) return <Component {...props} ref={ref} />
        const y = view.scrollY * 720 / view.height
        const poses: Pose[] = [
            { y: 0, top: 574, left: 0, scale: 1, rotate: 0, opacity: 1 },
            { y: 666, top: 574, left: 0, scale: 1, rotate: 0, opacity: 1 },
            { y: 1391, top: 300, left: 0, scale: 1, rotate: 0, opacity: 1 },
            { y: 2105, top: 105, left: 0, scale: 1, rotate: 0, opacity: 1 },
        ]
        return <Component
            {...props}
            ref={ref}
            style={{ ...props.style, position: "fixed", top: `${interpolate(poses, y).top / 720 * 100}vh` }}
        />
    })
}

function mechaIndexRow(Component: NativeLayer, row: 1 | 2 | 3): NativeLayer {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const { frozen, view } = useViewport()
        if (frozen || view.width < DESKTOP_MIN) return <Component {...props} ref={ref} />
        const y = view.scrollY * 720 / view.height
        // Observations: none at0; Tomorrow at666 and2796; Aescape at3144.
        // The intervening thresholds are fitted. The third section is outside
        // this retained opening sequence, so no unobserved active state is added.
        const active = y < 333 ? 0 : y < 3000 ? 1 : 2
        const chosen = active === row
        return <Component
            {...props}
            ref={ref}
            aria-current={chosen ? "location" : undefined}
            style={{
                ...props.style,
                opacity: active === 0 || chosen ? 1 : 0.35,
                borderBottom: `1px solid ${chosen ? "#171717" : "#d8d8d8"}`,
                boxSizing: "border-box",
            }}
        />
    })
}

export function withMechaTomorrowRow(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return mechaIndexRow(Component, 1)
}
export function withMechaAescapeRow(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return mechaIndexRow(Component, 2)
}
export function withMechaNonfictionRow(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return mechaIndexRow(Component, 3)
}

/** Public prop bridge for the independently owned source Notes chapter.
 * Reuse the existing two toggles; leave child fade/mask ownership to that chapter.
 * The native layer stays present in Preview so hiding it cannot cut off its fade.
 */
export function withFormatNotesStateBridge(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const notes = useToggle("notes"), daughter = useToggle("daughter"), target = RenderTarget.current()
        const frozen = useIsStaticRenderer() || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail
        return <Component {...props} ref={ref} data-format-notes-enabled={!frozen && notes.enabled ? "1" : "0"} data-format-daughter-enabled={!frozen && daughter.enabled ? "1" : "0"} aria-hidden="true" style={{ ...props.style, opacity: frozen ? 0 : 1, visibility: frozen ? "hidden" : "visible", pointerEvents: "none" }} />
    })
}

/** Source Daughter material effects — HERO-013 / FORMAT, Obys × DES.
 * Retained source Zu/cl equations; authentic image assets remain native layers.
 * Temporary pixel canvases are finite, source-sized and never run in Canvas,
 * export or thumbnail. A budget/error/interruption keeps the sharp native art.
 * Sparks are deliberately not implemented: their four authentic assets have
 * not been delivered. This chapter does not change the closing21/30 pool.
 */
type FormatDaughterKey = "vertical" | "mini" | "horizontal" | "tag" | "side" | "screens" | "clock" | "deck" | "v-card" | "tile" | "bar" | "pill" | "dial" | "side-a" | "tri" | "special" | "fan" | "win" | "vee-west" | "vee-east" | "vee-tri" | "poster-shot"
type FormatDaughterMaterial = { url: string; width: number; height: number }
// Genuine URL bindings are finalized only after the finite upload/readback.
const FORMAT_DAUGHTER_MATERIALS: Record<FormatDaughterKey, FormatDaughterMaterial> = {
    "vertical": {
        "url": "https://framerusercontent.com/images/y5Fcf4BlYIOxBVyVxQmg9XY4FfI.webp",
        "width": 670,
        "height": 852
    },
    "mini": {
        "url": "https://framerusercontent.com/images/42CsT9kzs8BCdU6LwtaS7DyiGww.webp",
        "width": 204,
        "height": 204
    },
    "horizontal": {
        "url": "https://framerusercontent.com/images/HQe1xMadtYyzi6UUy6KjQvFjYAg.webp",
        "width": 1380,
        "height": 896
    },
    "tag": {
        "url": "https://framerusercontent.com/images/QokABpqJs7bryGNSgYlWsWvGM.webp",
        "width": 513,
        "height": 366
    },
    "side": {
        "url": "https://framerusercontent.com/images/EzVo3wd7fcrSrKwQAiee3o8ZGI.webp",
        "width": 513,
        "height": 366
    },
    "screens": {
        "url": "https://framerusercontent.com/images/XM6eF20L1PMNSzcJbYXbKHHBA.webp",
        "width": 399,
        "height": 678
    },
    "clock": {
        "url": "https://framerusercontent.com/images/eK0mE9EJucBHKkaqeBsxmtFgRU.webp",
        "width": 1026,
        "height": 1026
    },
    "deck": {
        "url": "https://framerusercontent.com/images/ZE1GCu1cq3XTvrb9sw3nS2paTbw.webp",
        "width": 670,
        "height": 852
    },
    "v-card": {
        "url": "https://framerusercontent.com/images/5jiEpRCqnXUYBsB1IW5NnDBM.webp",
        "width": 670,
        "height": 852
    },
    "tile": {
        "url": "https://framerusercontent.com/images/npsAdcKTFEpuq34JQsGZe6eg2Y.webp",
        "width": 316,
        "height": 316
    },
    "bar": {
        "url": "https://framerusercontent.com/images/gRDZY641Fdhuxujby7mrs4rWQ.webp",
        "width": 1068,
        "height": 316
    },
    "pill": {
        "url": "https://framerusercontent.com/images/0N21IXLmUBfp1irXXpEv8eie6w0.webp",
        "width": 1392,
        "height": 316
    },
    "dial": {
        "url": "https://framerusercontent.com/images/hbdv7RGYwX9Tt2XVw08pch9NTs.webp",
        "width": 1394,
        "height": 1394
    },
    "side-a": {
        "url": "https://framerusercontent.com/images/FdyhzRNLaGVntYRWk5poVke1QE.webp",
        "width": 1298,
        "height": 1298
    },
    "tri": {
        "url": "https://framerusercontent.com/images/bIzOx9VdQpQsWXK71Te1X0TM3Wc.webp",
        "width": 1408,
        "height": 1217
    },
    "special": {
        "url": "https://framerusercontent.com/images/d28zgNVsND7A1UXxKtlIpzy2GQ.webp",
        "width": 704,
        "height": 654
    },
    "fan": {
        "url": "https://framerusercontent.com/images/ISq4Se6lChFaiWca1iVHfHEDaBA.webp",
        "width": 1378,
        "height": 1378
    },
    "win": {
        "url": "https://framerusercontent.com/images/x9bWRdTEeqRAUxE2gb4D3ouxDMA.webp",
        "width": 2090,
        "height": 896
    },
    "vee-west": {
        "url": "https://framerusercontent.com/images/dpsivWQwuTGTfVkuVYNjnZSei6Q.webp",
        "width": 1394,
        "height": 364
    },
    "vee-east": {
        "url": "https://framerusercontent.com/images/z2c0MM7pRZhqQOaZw0e5repLsY.webp",
        "width": 477,
        "height": 678
    },
    "vee-tri": {
        "url": "https://framerusercontent.com/images/md80G8Nf0VeiQJCIPiNOKMDk.webp",
        "width": 1408,
        "height": 1217
    },
    "poster-shot": {
        "url": "https://framerusercontent.com/images/lkHWxikpUIOb43BjlvlAelMqpQ.webp",
        "width": 1380,
        "height": 1668
    }
}
const FORMAT_DAUGHTER_REVISION = {}
const FORMAT_DAUGHTER_DIVISORS = [64, 32, 16, 8, 4, 2] as const
const FORMAT_DAUGHTER_LIMIT = 2_000_000, FORMAT_DAUGHTER_CACHE_LIMIT = 6, FORMAT_DAUGHTER_DECODED_LIMIT = 12_000_000
const useFormatDaughterLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect
function formatDaughterFrozen(staticRenderer: boolean) { const target = RenderTarget.current(); return staticRenderer || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail }
function formatDaughterRef(ref: React.ForwardedRef<HTMLElement>, node: HTMLElement | null) { if (typeof ref === "function") ref(node); else if (ref) ref.current = node }
function formatDaughterOwner(node: HTMLElement) { for (let parent = node.parentElement; parent; parent = parent.parentElement) if (parent.hasAttribute("data-format-source-height")) return parent; return null }
function formatDaughterWave(rows: readonly { top: number; bottom: number; index: number }[], height: number) { return rows.filter(row => row.bottom > 0 && row.top < height).sort((a, b) => a.top - b.top || a.index - b.index).map((row, order) => ({ index: row.index, delay: order * 40 })) }
function formatDaughterCorners(top: number, height: number, scroll: number, viewportHeight: number) { const start = top - viewportHeight, end = top + height / 2 - viewportHeight / 2, value = Math.max(0, Math.min(1, (scroll - start) / Math.max(1, end - start))), eased = value < .5 ? 4 * value ** 3 : 1 - 4 * (1 - value) ** 3; return { bar: 79 * (1 - eased), pill: 79 * eased } }
function formatDaughterPixel(context: CanvasRenderingContext2D, image: HTMLImageElement, canvas: HTMLCanvasElement, divisor: number, unit: number) {
    const width = canvas.width, height = canvas.height, lowWidth = Math.max(2, Math.round(width / (divisor * unit))), lowHeight = Math.max(1, lowWidth * height / width)
    context.imageSmoothingEnabled = false; context.clearRect(0, 0, width, height); context.drawImage(image, 0, 0, lowWidth, lowHeight); context.drawImage(canvas, 0, 0, lowWidth, lowHeight, 0, 0, width, height)
    context.globalCompositeOperation = "destination-in"; context.drawImage(image, 0, 0, width, height); context.globalCompositeOperation = "source-over"
}
type FormatDaughterLease = { node: HTMLElement; property: string; prior: string; priorPriority: string; value: string; priority: string }
function formatDaughterLeaseSet(rows: FormatDaughterLease[], node: HTMLElement, property: string, value: string) {
    let row = rows.find(row => row.node === node && row.property === property)
    const current = node.style.getPropertyValue(property), priority = node.style.getPropertyPriority(property)
    if (!row) { row = { node, property, prior: current, priorPriority: priority, value, priority: "" }; rows.push(row) }
    else { if (current !== row.value || priority !== row.priority) { row.prior = current; row.priorPriority = priority }; row.value = value; row.priority = "" }
    node.style.setProperty(property, value, row.priority)
    row.value = node.style.getPropertyValue(property); row.priority = node.style.getPropertyPriority(property)
}
function formatDaughterLeaseRestore(rows: FormatDaughterLease[]) {
    for (const row of rows) if (row.node.style.getPropertyValue(row.property) === row.value && row.node.style.getPropertyPriority(row.property) === row.priority) { if (row.prior) row.node.style.setProperty(row.property, row.prior, row.priorPriority); else row.node.style.removeProperty(row.property) }
    rows.length = 0
}
type FormatDaughterRow = { node: HTMLElement; owner: HTMLElement; key?: FormatDaughterKey; plate?: "bar" | "pill"; pixel: (active: boolean) => void; leases: FormatDaughterLease[]; disposed: boolean }
type FormatDaughterRecord = { url: string; material: FormatDaughterMaterial; state: "queued" | "loading" | "ready"; image: HTMLImageElement | null; jobs: Set<FormatDaughterJob>; touch: number }
type FormatDaughterJob = { row: FormatDaughterRow; generation: number; delay: number; record: FormatDaughterRecord; canvas: HTMLCanvasElement | null; context: CanvasRenderingContext2D | null; area: number; step: number; due: number }
type FormatDaughterAdmission = { record: FormatDaughterRecord; image: HTMLImageElement; token: object; decoding: boolean; cancelled: boolean }
type FormatDaughterResourceGate = { flight: object | null; pixels: number; buffers: Map<object, number>; waiters: Set<() => void> }
const FORMAT_DAUGHTER_RESOURCE_KEY = Symbol.for("monarchic.format.daughter.resources.v1")
function formatDaughterResourceGate() {
    const scope = window as unknown as { [key: symbol]: FormatDaughterResourceGate | undefined }
    return scope[FORMAT_DAUGHTER_RESOURCE_KEY] ?? (scope[FORMAT_DAUGHTER_RESOURCE_KEY] = { flight: null, pixels: 0, buffers: new Map(), waiters: new Set() })
}

function createFormatDaughterEffects() {
    const rows = new Set<FormatDaughterRow>(), pending = new Set<FormatDaughterRow>(), jobs = new Set<FormatDaughterJob>(), records = new Map<string, FormatDaughterRecord>(), queue: FormatDaughterRecord[] = []
    let mode = toggles.daughter, generation = 0, frame = 0, timer = 0, pixels = 0, clock = 0, loading: FormatDaughterRecord | null = null, disposed = false, cancelling = false
    const gate = formatDaughterResourceGate()
    let admission: FormatDaughterAdmission | null = null
    const releaseAdmission = (current: FormatDaughterAdmission) => { if (admission !== current) return; admission = null; if (loading === current.record) loading = null; if (gate.flight === current.token) gate.flight = null; for (const notify of Array.from(gate.waiters)) notify() }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)"), ready = () => !disposed && !document.hidden && !media.matches && window.innerWidth >= DESKTOP_MIN
    const decoded = () => Array.from(records.values()).filter(record => record.image !== null)
    const inputPixels = () => decoded().reduce((sum, record) => sum + (record.image!.naturalWidth || record.material.width) * (record.image!.naturalHeight || record.material.height), 0)
    const removeRecord = (record: FormatDaughterRecord) => {
        records.delete(record.url); const index = queue.indexOf(record); if (index >= 0) queue.splice(index, 1)
        const current = admission?.record === record ? admission : null
        if (current) current.cancelled = true
        if (record.image) { record.image.onload = null; record.image.onerror = null; record.image.removeAttribute("src"); record.image = null }
        // Clearing src aborts the load, but an already-started decode() Promise
        // still owns the serial lease until that exact Promise settles.
        if (current && !current.decoding) releaseAdmission(current)
        else if (!current && loading === record) loading = null
    }
    const trim = (incoming = 0) => { let idle = Array.from(records.values()).filter(record => record.state === "ready" && record.jobs.size === 0).sort((a, b) => a.touch - b.touch); while (idle.length && (decoded().length >= FORMAT_DAUGHTER_CACHE_LIMIT || inputPixels() + incoming > FORMAT_DAUGHTER_DECODED_LIMIT)) removeRecord(idle.shift()!) }
    const painted = (row: FormatDaughterRow) => {
        if (!row.node.isConnected || !row.owner.isConnected || formatDaughterOwner(row.node) !== row.owner) return false
        for (let node: HTMLElement | null = row.node; node; node = node.parentElement) { const style = getComputedStyle(node); if (style.display === "none" || (node !== row.node && style.visibility === "hidden") || Number(style.opacity) <= .001) return false; if (node === row.owner) break }
        const box = row.node.getBoundingClientRect(); return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < window.innerHeight && box.right > 0 && box.left < window.innerWidth
    }
    const finish = (job: FormatDaughterJob) => { if (!jobs.delete(job)) return; if (job.canvas) { job.canvas.remove(); job.canvas.width = 0; job.canvas.height = 0 }; pixels -= job.area; const reserved = gate.buffers.get(job); if (reserved !== undefined) { gate.pixels -= reserved; gate.buffers.delete(job) }; job.area = 0; job.canvas = null; job.context = null; job.record.jobs.delete(job); job.record.touch = ++clock; job.row.pixel(false); if (job.record.jobs.size === 0 && job.record.state !== "ready") removeRecord(job.record) }
    const finishRow = (row: FormatDaughterRow) => { pending.delete(row); for (const job of Array.from(jobs)) if (job.row === row) finish(job) }
    const cancel = () => {
        if (cancelling) return; cancelling = true
        try { if (timer) window.clearTimeout(timer); timer = 0; for (const job of Array.from(jobs)) finish(job); pending.clear(); if (loading && loading.jobs.size === 0) removeRecord(loading); trim() }
        finally { cancelling = false }
    }
    const makeCanvas = (job: FormatDaughterJob) => {
        const node = job.row.node, box = node.getBoundingClientRect(), width = Math.round(box.width), height = Math.round(box.height), area = width * height
        if (width <= 0 || height <= 0 || area > FORMAT_DAUGHTER_LIMIT || gate.pixels + area > FORMAT_DAUGHTER_LIMIT || !node.parentElement) return false
        const style = getComputedStyle(node), canvas = document.createElement("canvas")
        job.canvas = canvas; job.area = area; pixels += area; gate.pixels += area; gate.buffers.set(job, area)
        canvas.width = width; canvas.height = height; canvas.setAttribute("aria-hidden", "true"); canvas.setAttribute("data-format-daughter-pixel", job.row.key!)
        canvas.style.position = "absolute"; canvas.style.pointerEvents = "none"; canvas.style.imageRendering = "pixelated"
        // Match retained Zu: masks are NOT copied to its temporary sibling.
        // That code fact alone does not establish visible intermediate occlusion.
        for (const property of ["left", "top", "width", "height", "z-index", "clip-path", "border-radius", "transform", "object-fit"]) canvas.style.setProperty(property, style.getPropertyValue(property))
        const context = canvas.getContext("2d"); if (!context) return false
        job.context = context; node.parentElement.insertBefore(canvas, node.nextSibling); return true
    }
    const scheduleTimer = () => { if (timer) window.clearTimeout(timer); timer = 0; if (cancelling || !ready() || !mode) return; const due = Math.min(...Array.from(jobs).filter(job => job.record.state === "ready").map(job => job.due)); if (Number.isFinite(due)) timer = window.setTimeout(tick, Math.max(0, due - performance.now())) }
    const tick = () => {
        timer = 0; if (!ready() || !mode) { cancel(); return }
        const now = performance.now()
        for (const job of Array.from(jobs)) if (job.record.state === "ready" && job.due <= now + .1) {
            if (job.generation !== generation || job.row.disposed || !painted(job.row) || !job.record.image) { finish(job); continue }
            try {
                if (!job.canvas && !makeCanvas(job)) { finish(job); continue }
                formatDaughterPixel(job.context!, job.record.image, job.canvas!, FORMAT_DAUGHTER_DIVISORS[job.step], window.innerWidth / FORMAT_WIDTH)
                if (job.step === 0) job.row.pixel(true)
                job.step++; if (job.step === FORMAT_DAUGHTER_DIVISORS.length) finish(job); else job.due = performance.now() + 70
            } catch { finish(job) }
        }
        trim(); pump(); scheduleTimer()
    }
    const pump = () => {
        if (disposed || cancelling || loading || gate.flight || !ready() || !mode) return
        let record = queue.find(record => record.jobs.size > 0); if (!record) return
        trim(record.material.width * record.material.height)
        if (decoded().length >= FORMAT_DAUGHTER_CACHE_LIMIT || inputPixels() + record.material.width * record.material.height > FORMAT_DAUGHTER_DECODED_LIMIT) return
        queue.splice(queue.indexOf(record), 1); loading = record; record.state = "loading"
        const image = new Image(), current = { record, image, token: {}, decoding: false, cancelled: false }
        admission = current; gate.flight = current.token; record.image = image; image.crossOrigin = "anonymous"; image.decoding = "async"
        const failed = () => {
            if (admission !== current) return
            for (const job of Array.from(record.jobs)) finish(job)
            if (records.get(record.url) === record) removeRecord(record)
            releaseAdmission(current); scheduleTimer()
        }
        image.onerror = failed
        image.onload = () => {
            if (admission !== current || current.cancelled || disposed) return
            current.decoding = true
            let decodedImage: Promise<void>
            try { decodedImage = image.decode() } catch { failed(); return }
            Promise.resolve(decodedImage).then(() => {
                if (admission !== current) return
                if (current.cancelled || disposed || records.get(record.url) !== record) { releaseAdmission(current); return }
                if (!image.naturalWidth || !image.naturalHeight || inputPixels() > FORMAT_DAUGHTER_DECODED_LIMIT) { failed(); return }
                image.onload = null; image.onerror = null; record.state = "ready"; record.touch = ++clock
                for (const job of record.jobs) job.due = performance.now() + job.delay
                releaseAdmission(current); scheduleTimer()
            }, failed)
        }
        image.src = record.url
    }
    const enqueue = (row: FormatDaughterRow, delay: number) => {
        if (!row.key || row.disposed || !painted(row) || Array.from(jobs).some(job => job.row === row)) return
        const material = FORMAT_DAUGHTER_MATERIALS[row.key]; if (!material.url) return
        let record = records.get(material.url); if (!record) { record = { url: material.url, material, state: "queued", image: null, jobs: new Set(), touch: ++clock }; records.set(material.url, record); queue.push(record) }
        const job: FormatDaughterJob = { row, generation, delay, record, canvas: null, context: null, area: 0, step: 0, due: record.state === "ready" ? performance.now() + delay : Infinity }; jobs.add(job); record.jobs.add(job); record.touch = ++clock
    }
    const measure = () => {
        frame = 0; if (disposed) return
        const owners = new Set(Array.from(rows, row => row.owner))
        for (const owner of owners) {
            const bar = Array.from(rows).find(row => row.owner === owner && row.plate === "bar"), parent = bar?.node.parentElement
            if (parent) { const rect = parent.getBoundingClientRect(), radius = formatDaughterCorners(rect.top + window.scrollY, rect.height, window.scrollY, window.innerHeight); for (const row of rows) if (row.owner === owner && (row.plate || row.key === "bar" || row.key === "pill")) { const kind = row.plate ?? row.key as "bar" | "pill"; formatDaughterLeaseSet(row.leases, row.node, "border-radius", radius[kind] + "px"); formatDaughterLeaseSet(row.leases, row.node, "overflow", "clip"); if (row.plate && row.node.parentElement) formatDaughterLeaseSet(row.leases, row.node.parentElement, "overflow", "visible") } }
        }
        for (const row of rows) if (row.key === "mini") { const parent = row.node.parentElement; if (parent) { const rect = parent.getBoundingClientRect(), unit = window.innerWidth / FORMAT_WIDTH; formatDaughterLeaseSet(row.leases, row.node, "left", (Math.round(rect.left + 341 * unit) - rect.left) / unit + "px"); formatDaughterLeaseSet(row.leases, row.node, "width", Math.round(68 * unit) / unit + "px"); formatDaughterLeaseSet(row.leases, row.node, "height", Math.round(68 * unit) / unit + "px") } }
        if (!ready() || !mode) { pending.clear(); for (const job of Array.from(jobs)) finish(job); return }
        const selected = Array.from(pending).filter(row => rows.has(row) && painted(row)); pending.clear()
        const wave = formatDaughterWave(selected.map((row, index) => { const box = row.node.getBoundingClientRect(); return { top: box.top, bottom: box.bottom, index } }), window.innerHeight)
        for (const row of wave) enqueue(selected[row.index], row.delay)
        for (const job of Array.from(jobs)) if (!painted(job.row)) finish(job)
        pump(); scheduleTimer()
    }
    const schedule = () => { if (!disposed && !frame) frame = window.requestAnimationFrame(measure) }
    const visibility = () => { if (!ready()) cancel(); schedule() }
    const resize = () => { generation++; cancel(); schedule() }
    const observer = new ResizeObserver(schedule)
    const unViewport = subscribeViewport(schedule), unToggle = subscribeToggles(() => { const next = toggles.daughter; if (next === mode) return; mode = next; generation++; cancel(); if (mode) for (const row of rows) if (row.key) pending.add(row); schedule() })
    document.addEventListener("visibilitychange", visibility); media.addEventListener("change", visibility); window.addEventListener("resize", resize)
    const resume = () => { pump(); scheduleTimer() }; gate.waiters.add(resume)
    const api = {
        register: (row: FormatDaughterRow) => { const observedParent = row.plate ? row.node.parentElement : null; rows.add(row); observer.observe(row.node); if (observedParent) observer.observe(observedParent); if (mode && row.key) pending.add(row); schedule(); return () => { row.disposed = true; finishRow(row); observer.unobserve(row.node); if (observedParent) observer.unobserve(observedParent); formatDaughterLeaseRestore(row.leases); rows.delete(row); trim(); pump(); scheduleTimer(); if (!rows.size) api.dispose() } },
        refresh: schedule,
        debug: () => ({ rows: rows.size, jobs: jobs.size, loading: loading ? 1 : 0, decoded: decoded().length, decodedPixels: inputPixels(), pixels, windowPixels: gate.pixels, decodeLease: gate.flight ? 1 : 0, waiters: gate.waiters.size, timer: timer ? 1 : 0, frame: frame ? 1 : 0, generation }),
        dispose: () => { if (disposed) return; disposed = true; gate.waiters.delete(resume); cancel(); if (frame) window.cancelAnimationFrame(frame); frame = 0; observer.disconnect(); unViewport(); unToggle(); document.removeEventListener("visibilitychange", visibility); media.removeEventListener("change", visibility); window.removeEventListener("resize", resize); for (const row of rows) { row.disposed = true; row.pixel(false); formatDaughterLeaseRestore(row.leases) }; rows.clear(); for (const record of Array.from(records.values())) removeRecord(record); if (formatDaughterEffects === api) formatDaughterEffects = null },
    }
    return api
}
let formatDaughterEffects: ReturnType<typeof createFormatDaughterEffects> | null = null
function formatDaughterAssetStyle(key: FormatDaughterKey, unit: number): React.CSSProperties {
    const base: React.CSSProperties = { zIndex: 6 }
    if (key === "v-card") return { ...base, left: -1 / unit, top: -1 / unit, width: 335 + 2 / unit, height: 426 + 2 / unit, clipPath: `inset(${1 / unit}px)` }
    if (key === "side-a") return { zIndex: "auto", left: 24, top: 24, width: 649, height: 649, maskImage: "radial-gradient(circle closest-side,#0000 6%,#000 6.2%)", WebkitMaskImage: "radial-gradient(circle closest-side,#0000 6%,#000 6.2%)" }
    if (key === "special") return { ...base, maskImage: "radial-gradient(circle 120.5px at -.5px 163.5px,transparent 99%,#000 100%)", WebkitMaskImage: "radial-gradient(circle 120.5px at -.5px 163.5px,transparent 99%,#000 100%)" }
    if (key === "fan") return { zIndex: 1, maskImage: "radial-gradient(circle closest-side,#0000 2.6%,#000 2.8%)", WebkitMaskImage: "radial-gradient(circle closest-side,#0000 2.6%,#000 2.8%)" }
    return base
}
function formatDaughterSource(Component: NativeLayer, key?: FormatDaughterKey, plate?: "bar" | "pill"): NativeLayer {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const toggle = useToggle("daughter"), frozen = formatDaughterFrozen(useIsStaticRenderer()), view = React.useSyncExternalStore(frozen ? subscribeFrozen : subscribeViewport, frozen ? () => SERVER_VIEWPORT : () => viewport, () => SERVER_VIEWPORT)
        const [node, setNode] = React.useState<HTMLElement | null>(null), pixel = React.useRef(false), shown = React.useRef(false), own = React.useRef<HTMLElement | null>(null), live = !frozen && view.width >= DESKTOP_MIN
        shown.current = !frozen && toggle.enabled
        const bind = React.useCallback((value: HTMLElement | null) => { own.current = value; setNode(old => old === value ? old : value); formatDaughterRef(ref, value) }, [ref])
        useFormatDaughterLayoutEffect(() => {
            if (!live || !node) return; const owner = formatDaughterOwner(node); if (!owner) return
            const effects = formatDaughterEffects ?? (formatDaughterEffects = createFormatDaughterEffects()), row: FormatDaughterRow = { node, owner, key, plate, disposed: false, leases: [], pixel: active => { pixel.current = active; if (own.current === node && key) node.style.visibility = active ? "hidden" : shown.current && toggles.daughter ? "visible" : "hidden" } }
            const remove = effects.register(row); return () => { remove(); pixel.current = false }
        }, [node, live, key, plate, FORMAT_DAUGHTER_REVISION])
        useFormatDaughterLayoutEffect(() => { if (live) formatDaughterEffects?.refresh() }, [live, view.width, view.height])
        const style = key ? { ...props.style, ...(live ? formatDaughterAssetStyle(key, view.width / FORMAT_WIDTH) : {}), opacity: shown.current ? 1 : 0, visibility: shown.current && !pixel.current ? "visible" as const : "hidden" as const, pointerEvents: "none" as const } : props.style
        return <Component {...props} ref={bind} data-format-daughter-source={key} data-format-daughter-plate={plate} aria-hidden={key ? !shown.current : props["aria-hidden"]} style={style} />
    }) as NativeLayer
}
export function withFormatDaughterSourceVertical(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "vertical") }
export function withFormatDaughterSourceMini(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "mini") }
export function withFormatDaughterSourceHorizontal(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "horizontal") }
export function withFormatDaughterSourceTag(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "tag") }
export function withFormatDaughterSourceSide(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "side") }
export function withFormatDaughterSourceScreens(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "screens") }
export function withFormatDaughterSourceClock(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "clock") }
export function withFormatDaughterSourceDeck(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "deck") }
export function withFormatDaughterSourceVCard(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "v-card") }
export function withFormatDaughterSourceTile(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "tile") }
export function withFormatDaughterSourceBar(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "bar") }
export function withFormatDaughterSourcePill(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "pill") }
export function withFormatDaughterSourceDial(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "dial") }
export function withFormatDaughterSourceSideA(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "side-a") }
export function withFormatDaughterSourceTri(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "tri") }
export function withFormatDaughterSourceSpecial(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "special") }
export function withFormatDaughterSourceFan(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "fan") }
export function withFormatDaughterSourceWin(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "win") }
export function withFormatDaughterSourceVeeWest(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "vee-west") }
export function withFormatDaughterSourceVeeEast(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "vee-east") }
export function withFormatDaughterSourceVeeTri(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "vee-tri") }
export function withFormatDaughterSourcePosterShot(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, "poster-shot") }
export function withFormatDaughterSourceBarPlate(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, undefined, "bar") }
export function withFormatDaughterSourcePillPlate(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatDaughterSource(Component, undefined, "pill") }

/** Source Daughter sparks — HERO-013 / FORMAT / Obys × DES.
 * The exact retained source tick equations and four genuine non-square images.
 * Four Framer URL bindings were manually delivered and pixel-verified.
 * Three bursts/twelve particles and serial decoding are resource adaptations.
 * Canvas, exports, thumbnails and reduced motion never emit decorative sparks.
 */
type FormatSparkKey = "a" | "b" | "c" | "d"
type FormatSparkMaterial = { key: FormatSparkKey; url: string | null; width: number; height: number; sha256: string }
const FORMAT_SPARK_MATERIALS: FormatSparkMaterial[] = [
    { key: "a", url: "https://framerusercontent.com/images/i8ll2Cv87bMowMKajzzzKehwEWs.webp", width: 221, height: 304, sha256: "6580a99320e869654d8977243c53de049e53ccfb748bb13792c394c399d83217" },
    { key: "b", url: "https://framerusercontent.com/images/Z5VpKbzKscUUcarw2wN08hBIYH8.webp", width: 283, height: 246, sha256: "a2f435ba674eacabeb110a51c2428757daa86b2a40cd0a825d033ca5f14019fa" },
    { key: "c", url: "https://framerusercontent.com/images/F1NvRCX4KRo20F7tlZmZmXiy8k.webp", width: 203, height: 321, sha256: "0f8f0d49be0a07834ac1a6e12e969c44a2623db1623c702cf42f20f30b46c82b" },
    { key: "d", url: "https://framerusercontent.com/images/xas7I3OccsW6yp5T3pHoOCqH8E.webp", width: 303, height: 247, sha256: "99fb5c0523d3a2aaf14fe53abe0b9e1f849737a696858f401b3175303e2e63de" },
]
const FORMAT_SPARK_REVISION = {}, FORMAT_SPARK_BURSTS = 3, FORMAT_SPARK_CACHE_PIXELS = 276_806
const FORMAT_SPARK_MANAGER_KEY = Symbol.for("monarchic.format.daughter.sparks.v1")
type FormatSparkEvent = NativeActivationEvent & { currentTarget?: EventTarget | null; clientX?: number; clientY?: number; key?: string }
type FormatSparkPoint = readonly [number, number]
type FormatSparkOwner = { node: HTMLElement; frozen: () => boolean; materials: FormatSparkMaterial[]; disposed: boolean }
type FormatSparkAttempt = { channel: NativeActivationChannel; before: boolean; callerState: boolean; callerSeen: boolean; cancelled: boolean; point: FormatSparkPoint | null }
type FormatSparkBridge = { active: FormatSparkAttempt | null; owner: FormatSparkOwner | null }
type FormatSparkBody = { x: number; y: number; vx: number; vy: number; turn: number; spin: number }
type FormatSparkBurst = { owner: FormatSparkOwner; serial: number; point: FormatSparkPoint }
type FormatSparkSpawn = { burst: FormatSparkBurst; index: number; point: FormatSparkPoint; due: number }
type FormatSparkParticle = FormatSparkBody & { burst: FormatSparkBurst; element: HTMLImageElement; record: FormatSparkRecord | null }
type FormatSparkRecord = { material: FormatSparkMaterial; url: string; image: HTMLImageElement | null; ready: boolean; particles: Set<FormatSparkParticle>; touch: number }
type FormatSparkAdmission = { record: FormatSparkRecord; image: HTMLImageElement; token: object; decoding: boolean; cancelled: boolean }
function formatSparkPoint(event: FormatSparkEvent, owner: FormatSparkOwner | null): FormatSparkPoint | null {
    if (event.clientX && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) return [event.clientX, event.clientY!]
    const node = event.currentTarget instanceof HTMLElement ? event.currentTarget : owner?.node
    if (!node) return null
    const box = node.getBoundingClientRect(); return [box.left + box.width / 2, box.top + box.height / 2]
}
function formatSparkBody(point: FormatSparkPoint, index: number, unit: number, random = Math.random): FormatSparkBody {
    const c = (index - 1.5) / 1.5, l = Math.max(0, Math.min(1, point[1] / (140 * unit)))
    return { x: point[0], y: point[1], vx: (c * 9 + (random() - .5) * 3) * (1 + (1 - l) * 2), vy: -(11 + random() * 6) * l, turn: (random() - .5) * 40, spin: (random() - .5) * 14 }
}
function formatSparkTick(body: FormatSparkBody) { body.vy += .62; body.x += body.vx; body.y += body.vy; body.turn += body.spin }
function formatSparkAllowed(owner: FormatSparkOwner, reduced: boolean) {
    if (owner.disposed || owner.frozen() || reduced || document.hidden || !owner.node.isConnected) return false
    for (let node: HTMLElement | null = owner.node; node; node = node.parentElement) {
        const style = getComputedStyle(node)
        if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) <= .001) return false
    }
    const box = owner.node.getBoundingClientRect()
    return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < window.innerHeight && box.right > 0 && box.left < window.innerWidth
}
function createFormatSparkManager() {
    const owners = new Set<FormatSparkOwner>(), bursts: FormatSparkBurst[] = [], pending: FormatSparkSpawn[] = [], particles = new Set<FormatSparkParticle>(), records = new Map<string, FormatSparkRecord>()
    const shared = formatDaughterResourceGate(), media = window.matchMedia("(prefers-reduced-motion: reduce)"), targets = new Map<HTMLElement, Set<FormatSparkOwner>>()
    let timer = 0, frame = 0, serial = 0, clock = 0, disposed = false, cancelling = false, admission: FormatSparkAdmission | null = null
    const allowed = (owner: FormatSparkOwner) => !disposed && formatSparkAllowed(owner, media.matches)
    const release = (current: FormatSparkAdmission) => {
        if (admission !== current) return
        admission = null; if (shared.flight === current.token) shared.flight = null
        for (const notify of Array.from(shared.waiters)) notify()
    }
    const removeRecord = (record: FormatSparkRecord) => {
        if (records.get(record.url) === record) records.delete(record.url)
        const current = admission?.record === record ? admission : null
        if (current) current.cancelled = true
        if (record.image) { record.image.onload = null; record.image.onerror = null; record.image.removeAttribute("src"); record.image = null }
        if (current && !current.decoding) release(current)
    }
    const removeParticle = (particle: FormatSparkParticle) => {
        if (!particles.delete(particle)) return
        particle.element.removeAttribute("src"); particle.element.remove()
        const record = particle.record; particle.record = null
        if (record) { record.particles.delete(particle); if (!record.ready && !record.particles.size) removeRecord(record) }
    }
    const prune = () => { for (let i = bursts.length - 1; i >= 0; i--) if (!pending.some(job => job.burst === bursts[i]) && !Array.from(particles).some(p => p.burst === bursts[i])) bursts.splice(i, 1) }
    const stopIdle = () => { if (!pending.length && timer) { window.clearTimeout(timer); timer = 0 }; if (!particles.size && frame) { window.cancelAnimationFrame(frame); frame = 0 }; prune() }
    const cancelBurst = (burst: FormatSparkBurst) => {
        const was = cancelling; cancelling = true
        for (let i = pending.length - 1; i >= 0; i--) if (pending[i].burst === burst) pending.splice(i, 1)
        for (const particle of Array.from(particles)) if (particle.burst === burst) removeParticle(particle)
        const index = bursts.indexOf(burst); if (index >= 0) bursts.splice(index, 1)
        cancelling = was
    }
    const cancelOwner = (owner: FormatSparkOwner) => { const was = cancelling; cancelling = true; for (const burst of bursts.slice()) if (burst.owner === owner) cancelBurst(burst); cancelling = was; stopIdle(); scheduleTimer(); pump() }
    const clear = () => { const was = cancelling; cancelling = true; if (timer) window.clearTimeout(timer); if (frame) window.cancelAnimationFrame(frame); timer = 0; frame = 0; for (const burst of bursts.slice()) cancelBurst(burst); for (const record of Array.from(records.values())) removeRecord(record); cancelling = was }
    const attach = (particle: FormatSparkParticle, record: FormatSparkRecord) => {
        if (particles.has(particle) && !particle.burst.owner.disposed && allowed(particle.burst.owner) && record.ready) particle.element.src = record.url
    }
    const pump = () => {
        if (disposed || cancelling || admission || shared.flight || document.hidden || media.matches) return
        const record = Array.from(records.values()).find(record => !record.ready && record.particles.size > 0)
        if (!record) return
        const image = new Image(), current: FormatSparkAdmission = { record, image, token: {}, decoding: false, cancelled: false }
        admission = current; shared.flight = current.token; record.image = image; image.crossOrigin = "anonymous"; image.decoding = "async"
        const failed = () => {
            if (admission !== current) return
            for (const particle of record.particles) particle.record = null
            record.particles.clear(); removeRecord(record); release(current)
        }
        image.onerror = failed
        image.onload = () => {
            if (admission !== current || current.cancelled || disposed) return
            current.decoding = true
            let decoded: Promise<void>
            try { decoded = image.decode() } catch { failed(); return }
            Promise.resolve(decoded).then(() => {
                if (admission !== current) return
                if (current.cancelled || disposed || records.get(record.url) !== record) { release(current); return }
                if (image.naturalWidth !== record.material.width || image.naturalHeight !== record.material.height) { failed(); return }
                image.onload = null; image.onerror = null; record.ready = true; record.touch = ++clock
                for (const particle of record.particles) attach(particle, record)
                release(current)
            }, failed)
        }
        image.src = record.url
    }
    const materialFor = (particle: FormatSparkParticle, material: FormatSparkMaterial) => {
        const url = material.url; if (!url) return
        let record = records.get(url)
        if (!record) {
            const size = material.width * material.height
            const pixels = () => Array.from(records.values()).reduce((n, r) => n + r.material.width * r.material.height, 0)
            const idle = Array.from(records.values()).filter(r => r.particles.size === 0 && r.ready).sort((a, b) => a.touch - b.touch)
            while (idle.length && (records.size >= 4 || pixels() + size > FORMAT_SPARK_CACHE_PIXELS)) removeRecord(idle.shift()!)
            if (records.size >= 4 || pixels() + size > FORMAT_SPARK_CACHE_PIXELS) return
            record = { material, url, image: null, ready: false, particles: new Set(), touch: ++clock }; records.set(url, record)
        }
        particle.record = record; record.particles.add(particle); record.touch = ++clock
        if (record.ready) attach(particle, record); else pump()
    }
    const animate = () => {
        frame = 0; if (disposed) return
        for (const particle of Array.from(particles)) {
            if (!allowed(particle.burst.owner)) { cancelOwner(particle.burst.owner); continue }
            formatSparkTick(particle)
            particle.element.style.transform = `translate3d(${particle.x}px,${particle.y}px,0) rotate(${particle.turn}deg)`
            if (particle.y > window.innerHeight + 400) removeParticle(particle)
        }
        stopIdle(); if (particles.size) frame = window.requestAnimationFrame(animate)
    }
    const spawn = (job: FormatSparkSpawn) => {
        if (!allowed(job.burst.owner)) { cancelOwner(job.burst.owner); return }
        const unit = window.innerWidth / 1440, element = document.createElement("img"), body = formatSparkBody(job.point, job.index, unit)
        element.alt = ""; element.setAttribute("aria-hidden", "true"); element.setAttribute("data-format-daughter-spark", String(job.burst.serial) + ":" + job.index)
        element.style.cssText = `position:fixed;left:0;top:0;width:${92 * unit}px;height:auto;margin-left:${-46 * unit}px;margin-top:${-46 * unit}px;z-index:55;pointer-events:none;will-change:transform;transform:translate3d(${job.point[0]}px,${job.point[1]}px,0)`
        document.body.appendChild(element)
        const particle: FormatSparkParticle = { ...body, burst: job.burst, element, record: null }; particles.add(particle)
        materialFor(particle, job.burst.owner.materials[job.index]); if (!frame) frame = window.requestAnimationFrame(animate)
    }
    const runDue = () => { timer = 0; if (disposed) return; const now = performance.now(); for (const job of pending.slice().sort((a, b) => a.due - b.due || a.burst.serial - b.burst.serial || a.index - b.index)) if (job.due <= now + .1) { const index = pending.indexOf(job); if (index >= 0) { pending.splice(index, 1); spawn(job) } }; stopIdle(); scheduleTimer() }
    const scheduleTimer = () => { if (timer) window.clearTimeout(timer); timer = 0; if (disposed || cancelling || !pending.length) return; timer = window.setTimeout(runDue, Math.max(0, Math.min(...pending.map(job => job.due)) - performance.now())) }
    const suspend = () => { if (document.hidden || media.matches) clear() }
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(entries => { for (const entry of entries) if (!entry.isIntersecting) for (const owner of targets.get(entry.target as HTMLElement) ?? []) if (!allowed(owner)) cancelOwner(owner) })
    const resume = () => pump(); shared.waiters.add(resume)
    document.addEventListener("visibilitychange", suspend); media.addEventListener("change", suspend)
    const api = {
        register: (owner: FormatSparkOwner) => {
            owners.add(owner); let set = targets.get(owner.node); if (!set) { set = new Set(); targets.set(owner.node, set); observer?.observe(owner.node) }; set.add(owner)
            return () => { owner.disposed = true; cancelOwner(owner); owners.delete(owner); const set = targets.get(owner.node); set?.delete(owner); if (!set?.size) { targets.delete(owner.node); observer?.unobserve(owner.node) }; if (!owners.size) api.dispose() }
        },
        burst: (owner: FormatSparkOwner, point: FormatSparkPoint) => {
            if (!owners.has(owner) || !allowed(owner) || owner.materials.length !== 4 || owner.materials.some(material => !material.url)) return
            while (bursts.length >= FORMAT_SPARK_BURSTS) cancelBurst(bursts[0])
            const burst = { owner, serial: ++serial, point }, now = performance.now(); bursts.push(burst)
            for (let index = 0; index < 4; index++) pending.push({ burst, index, point, due: now + index * 55 })
            scheduleTimer()
        },
        debug: () => ({ owners: owners.size, bursts: bursts.length, burstPoints: bursts.map(burst => ({ serial: burst.serial, point: burst.point })), particles: particles.size, pending: pending.length, records: records.size, naturalPixels: Array.from(records.values()).reduce((n, r) => n + r.material.width * r.material.height, 0), admission: admission ? 1 : 0, sharedFlight: shared.flight ? 1 : 0, timer: timer ? 1 : 0, frame: frame ? 1 : 0 }),
        dispose: () => { if (disposed) return; disposed = true; shared.waiters.delete(resume); clear(); observer?.disconnect(); document.removeEventListener("visibilitychange", suspend); media.removeEventListener("change", suspend); targets.clear(); owners.clear(); const scope = window as unknown as { [key: symbol]: unknown }; if (scope[FORMAT_SPARK_MANAGER_KEY] === api) delete scope[FORMAT_SPARK_MANAGER_KEY] },
    }
    return api
}
function formatSparkManager() {
    const scope = window as unknown as { [key: symbol]: ReturnType<typeof createFormatSparkManager> | undefined }
    return scope[FORMAT_SPARK_MANAGER_KEY] ?? (scope[FORMAT_SPARK_MANAGER_KEY] = createFormatSparkManager())
}
function formatSparkObserve(Component: NativeLayer): NativeLayer {
    return React.forwardRef<HTMLElement, LayerProps>((input, ref) => {
        const { __formatDaughterSparkBridge, ...props } = input, bridge = __formatDaughterSparkBridge as FormatSparkBridge
        const run = (channel: NativeActivationChannel, event: FormatSparkEvent, handler: () => void) => {
            const prior = bridge.active, before = toggles.daughter, attempt: FormatSparkAttempt = { channel, before, callerState: before, callerSeen: false, cancelled: !!event.defaultPrevented, point: formatSparkPoint(event, bridge.owner) }
            bridge.active = attempt
            try {
                handler()
                if (attempt.callerSeen && !attempt.cancelled && attempt.callerState === before && !before && toggles.daughter && attempt.point && bridge.owner) formatSparkManager().burst(bridge.owner, attempt.point)
            } finally { bridge.active = prior }
        }
        return <Component {...props} ref={ref} onClick={(event: React.MouseEvent<HTMLElement>) => run("click", event, () => props.onClick?.(event))} onTap={(event: NativeActivationEvent, info?: unknown) => run("tap", event, () => props.onTap?.(event, info))} onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => run("key", event, () => props.onKeyDown?.(event))} />
    }) as NativeLayer
}
export function withFormatDaughterSparks(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    const Legacy = withFormatDaughterButton(formatSparkObserve(Component))
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const frozen = formatDaughterFrozen(useIsStaticRenderer()), frozenNow = React.useRef(frozen), bridge = React.useRef<FormatSparkBridge>({ active: null, owner: null }), [node, setNode] = React.useState<HTMLElement | null>(null)
        frozenNow.current = frozen
        const bind = React.useCallback((node: HTMLElement | null) => { setNode(node); formatDaughterRef(ref, node) }, [ref])
        useFormatDaughterLayoutEffect(() => {
            if (!node || frozen) return
            const owner: FormatSparkOwner = { node, materials: FORMAT_SPARK_MATERIALS, frozen: () => frozenNow.current, disposed: false }; bridge.current.owner = owner
            const remove = formatSparkManager().register(owner)
            return () => { if (bridge.current.owner === owner) bridge.current.owner = null; remove() }
        }, [node, frozen, FORMAT_SPARK_REVISION])
        const caller = (channel: NativeActivationChannel, event: NativeActivationEvent) => { const attempt = bridge.current.active; if (attempt?.channel === channel) { attempt.callerSeen = true; attempt.cancelled = !!event.defaultPrevented; attempt.callerState = toggles.daughter } }
        return <Legacy {...props} ref={bind} __formatDaughterSparkBridge={bridge.current}
            onClick={(event: React.MouseEvent<HTMLElement>) => { props.onClick?.(event); caller("click", event) }}
            onTap={(event: NativeActivationEvent, info?: unknown) => { props.onTap?.(event, info); caller("tap", event) }}
            onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => { props.onKeyDown?.(event); caller("key", event) }} />
    }) as NativeLayer
}

/** Source inspiration — HERO-013 / FORMAT, Obys × DES: the separate back nav.
 * Retained ed() thresholds and CSS timing; source-supported geometry only.
 * The existing viewport invalidations replace the source's ambient GSAP ticker.
 * A transparent editable native probe supplies the existing FooterFlow's top;
 * all pairing uses our own forwarded refs and public source-root marker.
 * The four old mode handlers/stores remain authoritative, including Sparks50.
 * Missing root/probe forwarding fails closed. Phone/coarse stays behind the
 * source splash; hidden and reduced-motion lifecycle policies are explicit fits.
 */
type FormatBackWorld = {
    root: HTMLElement
    navs: Set<() => void>
    probes: Map<object, HTMLElement>
    notify: () => void
    footer: () => HTMLElement | null
    release: () => void
}
type FormatBackState = { shown: boolean; lastY: number; hold: boolean }
type FormatBackContextValue = { unit: number; ink: string; frozen: boolean; reduced: boolean }
const FORMAT_BACK_REVISION = {}, FORMAT_BACK_ROOT = "[data-format-source-height]"
const formatBackWorlds = new WeakMap<HTMLElement, FormatBackWorld>()
const FormatBackContext = React.createContext<FormatBackContextValue>({ unit: 1, ink: "#000000", frozen: true, reduced: false })
function formatBackRoot(node: HTMLElement) { return node.closest<HTMLElement>(FORMAT_BACK_ROOT) }
function formatBackWorld(root: HTMLElement): FormatBackWorld {
    const old = formatBackWorlds.get(root); if (old) return old
    const navs = new Set<() => void>(), probes = new Map<object, HTMLElement>()
    const world: FormatBackWorld = {
        root, navs, probes,
        notify: () => { for (const notify of Array.from(navs)) notify() },
        footer: () => { const live = Array.from(probes.values()).filter(node => node.isConnected && formatBackRoot(node) === root); return live.length === 1 ? live[0] : null },
        release: () => { if (!navs.size && !probes.size && formatBackWorlds.get(root) === world) formatBackWorlds.delete(root) },
    }
    formatBackWorlds.set(root, world); return world
}
function formatBackDecision(shown: boolean, y: number, previousY: number, height: number, footerTop: number | null, hold: boolean) {
    if (y < height * 2 || (footerTop !== null && footerTop < height)) return false
    const delta = y - previousY
    return delta < -2 ? true : delta > 2 && !hold ? false : shown
}
function useFormatBackHost(ref: React.ForwardedRef<HTMLElement>) {
    const [node, setNode] = React.useState<HTMLElement | null>(null), current = React.useRef<HTMLElement | null>(null), caller = React.useRef(ref)
    const bind = React.useCallback((next: HTMLElement | null) => { current.current = next; setNode(old => old === next ? old : next); formatDaughterRef(caller.current, next) }, [])
    useFormatDaughterLayoutEffect(() => { if (caller.current !== ref) { formatDaughterRef(caller.current, null); caller.current = ref; formatDaughterRef(ref, current.current) } }, [ref])
    return { node, bind }
}
function formatBackCall(handler: unknown, event: unknown) { if (typeof handler === "function") (handler as (event: unknown) => void)(event) }
function formatBackFrozen() { return formatDaughterFrozen(useIsStaticRenderer()) }

export function withFormatBackNavigation(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const frozen = formatBackFrozen(), { node, bind } = useFormatBackHost(ref), [hidden, setHidden] = React.useState(false), [reduced, setReduced] = React.useState(false), [shown, setShown] = React.useState(false), [bridge, setBridge] = React.useState("awaiting-root")
        const state = React.useRef<FormatBackState>({ shown: false, lastY: 0, hold: false }), refresh = React.useRef<() => void>(() => {})
        const view = React.useSyncExternalStore(frozen || hidden ? subscribeFrozen : subscribeViewport, frozen || hidden ? () => SERVER_VIEWPORT : () => viewport, () => SERVER_VIEWPORT)
        useFormatDaughterLayoutEffect(() => {
            state.current = { shown: false, lastY: typeof window === "undefined" ? 0 : window.scrollY, hold: false }; setShown(false)
            if (!node || frozen) { setBridge("frozen"); return }
            const root = formatBackRoot(node)
            if (!root) { setBridge("awaiting-root"); return }
            let active = true
            const world = formatBackWorld(root), splash = window.matchMedia("(width <= 767px), (pointer: coarse)"), motion = window.matchMedia("(prefers-reduced-motion: reduce)")
            const read = () => {
                if (!active) return
                const row = state.current, y = window.scrollY, footer = world.footer(), admitted = node.isConnected && formatBackRoot(node) === root && !document.hidden && !splash.matches
                const next = admitted && footer ? formatBackDecision(row.shown, y, row.lastY, window.innerHeight, footer.getBoundingClientRect().top, row.hold) : false
                row.lastY = y; row.shown = next
                setShown(old => old === next ? old : next); setBridge(footer ? "ready" : "awaiting-footer")
            }
            const visibility = () => { setHidden(document.hidden); state.current.lastY = window.scrollY; if (document.hidden) { state.current.shown = false; state.current.hold = false; setShown(false) }; read() }
            const media = () => { setReduced(motion.matches); state.current.lastY = window.scrollY; if (splash.matches) { state.current.shown = false; state.current.hold = false; setShown(false) }; read() }
            refresh.current = read; world.navs.add(read)
            document.addEventListener("visibilitychange", visibility); splash.addEventListener("change", media); motion.addEventListener("change", media)
            setHidden(document.hidden); setReduced(motion.matches); read()
            return () => { active = false; refresh.current = () => {}; world.navs.delete(read); world.release(); document.removeEventListener("visibilitychange", visibility); splash.removeEventListener("change", media); motion.removeEventListener("change", media) }
        }, [node, frozen, FORMAT_BACK_REVISION])
        useFormatDaughterLayoutEffect(() => { refresh.current() }, [view, hidden])
        const hold = (value: boolean, handler: unknown, event: { defaultPrevented?: boolean }) => { formatBackCall(handler, event); if (!event.defaultPrevented && !frozen && node?.isConnected) state.current.hold = value }
        const unit = frozen ? 1 : view.width / 1440, context: FormatBackContextValue = { unit, ink: "#000000", frozen, reduced }
        const style = frozen ? { ...props.style, visibility: "hidden" as const, pointerEvents: "none" as const } : {
            ...props.style, position: "fixed" as const, left: 20 * unit, top: 10 * unit, width: 1400, height: 16, zIndex: 50,
            transform: "none", transformOrigin: "0 0", scale: String(unit), rotate: "0deg", translate: `0px ${shown ? 0 : -28 * unit}px`,
            visibility: shown ? "visible" as const : "hidden" as const, pointerEvents: shown ? "auto" as const : "none" as const,
            transition: reduced ? "none" : `translate .45s cubic-bezier(.22,1,.36,1),visibility 0s linear ${shown ? "0s" : ".45s"}`,
        }
        return <FormatBackContext.Provider value={context}><Component {...props} ref={bind} data-format-back-nav="source-ed" data-format-back-bridge={frozen ? "frozen" : bridge} data-format-back-shown={!frozen && shown ? "1" : "0"} aria-hidden={frozen || !shown} style={style as IndependentTransforms}
            onPointerEnter={(event: React.MouseEvent<HTMLElement>) => hold(true, props.onPointerEnter, event)} onPointerLeave={(event: React.MouseEvent<HTMLElement>) => hold(false, props.onPointerLeave, event)}
            onFocus={(event: React.FocusEvent<HTMLElement>) => hold(true, props.onFocus, event)} onBlur={(event: React.FocusEvent<HTMLElement>) => hold(false, props.onBlur, event)}
        /></FormatBackContext.Provider>
    }) as NativeLayer
}

export function withFormatBackNavigationFooterProbe(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const frozen = formatBackFrozen(), { node, bind } = useFormatBackHost(ref)
        useFormatDaughterLayoutEffect(() => {
            if (!node || frozen) return
            const root = formatBackRoot(node); if (!root) return
            const world = formatBackWorld(root), token = {}, path: HTMLElement[] = []
            for (let parent: HTMLElement | null = node; parent; parent = parent.parentElement) { path.push(parent); if (parent === root) break }
            let active = true
            const update = () => { if (active) world.notify() }, resize = new ResizeObserver(update), attributes = new MutationObserver(update)
            const watch = () => { resize.disconnect(); attributes.disconnect(); if (!document.hidden) { resize.observe(node); for (const parent of path) attributes.observe(parent, { attributes: true, attributeFilter: ["style", "class", "hidden"] }) }; update() }
            world.probes.set(token, node); document.addEventListener("visibilitychange", watch); watch()
            return () => { active = false; resize.disconnect(); attributes.disconnect(); document.removeEventListener("visibilitychange", watch); world.probes.delete(token); world.notify(); world.release() }
        }, [node, frozen, FORMAT_BACK_REVISION])
        return <Component {...props} ref={bind} data-format-back-footer-probe="source-footer-top" aria-hidden="true" style={{ ...props.style, width: 1, height: 1, opacity: 0, backgroundColor: "transparent", pointerEvents: "none" }} />
    }) as NativeLayer
}
function formatBackToggle(Component: NativeLayer, name: ToggleName): NativeLayer {
    const Legacy = name === "notes" ? withFormatNotesButton(Component) : withFormatDaughterSparks(Component)
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const parent = React.useContext(FormatBackContext), mode = useToggle(name), ink = !parent.frozen && mode.enabled ? "#939393" : "#000000"
        return <FormatBackContext.Provider value={{ ...parent, ink }}><Legacy {...props} ref={ref} data-format-back-toggle={name} style={{ ...props.style, color: ink }} /></FormatBackContext.Provider>
    }) as NativeLayer
}
export function withFormatBackNavigationNotes(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatBackToggle(Component, "notes") }
export function withFormatBackNavigationDaughter(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return formatBackToggle(Component, "daughter") }
export function withFormatBackNavigationText(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = React.useContext(FormatBackContext), id = React.useId().replace(/[^a-zA-Z0-9_-]/g, "_")
        return <><Component {...props} ref={ref} data-format-back-text={id} style={{ ...props.style, color: state.ink, whiteSpace: "pre", textDecoration: "none", transition: state.frozen || state.reduced ? "none" : "color .35s" }} /><style>{`[data-format-back-text="${id}"] *{color:inherit!important;white-space:inherit!important;text-decoration:inherit!important}`}</style></>
    }) as NativeLayer
}
export function withFormatBackNavigationRule(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>((props, ref) => {
        const state = React.useContext(FormatBackContext)
        return <Component {...props} ref={ref} data-format-back-rule="physical-one-pixel" aria-hidden="true" style={{ ...props.style, height: 1 / Math.max(.001, state.unit), backgroundColor: state.ink, pointerEvents: "none", transition: state.frozen || state.reduced ? "none" : "background-color .35s" }} />
    }) as NativeLayer
}


// Manual same-module Framer package: Details191 and Notes append; retained Shared56 prefix above is byte-exact.
/**
 * SOURCE INSPIRATION / HERO-013 — FORMAT, Obys and DES Special Project.
 * Exact14 primary inline-SVG polygons clip editable native Frames, including
 * the closing mark. Individual source photographs and typography remain native.
 * Independent public React HOCs implement the source-supported tiny Berlin
 * clock, large accelerated dial,100s record, running reel, triangle clips,
 * scroll-driven three-pair window, circular word gauge, late seven-photo deck,
 * terminal2.6s click/clack phases, decorative flower grounds and the same
 * native poster’s automatic scroll carry, physics release and reverse.
 * No source website behavior JavaScript is copied or executed here.
 * Known fits: scroll/Lenis velocity normalization, macro/phase anchors,
 * window scrub easing, gauge growth/morph interpolation, deck-ground collapse
 * and exact first-entry word stagger. Closing floor/rotation collisions are an
 * independent fit; photo parallax remains omitted. Source pointer-spawned bitmap chips use
 *30 native slots/21 templates and independently fitted bounded collisions. The
 * preloader, omitted fan/interstitials and complete Notes placement are absent.
 * Canvas/export/thumbnail and reduced motion freeze. Live native timers/RAF
 * suspend offscreen/hidden; no GPU context or runtime media/font fetch.
 */
type FormatDetailsPrivate_LayerProps = { [key: string]: unknown; style?: React.CSSProperties; children?: React.ReactNode }
type FormatDetailsPrivate_NativeLayer = ComponentType<FormatDetailsPrivate_LayerProps>
type FormatDetailsPrivate_DetailStyle = React.CSSProperties & { translate?: string; rotate?: string; scale?: string }
const FormatDetailsPrivate_useOwnLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect
const FormatDetailsPrivate_STATIC_TIME = Date.UTC(2026, 10, 1, 11, 0, 0)
const FormatDetailsPrivate_emptySubscribe = (_notify: () => void) => () => {}
const FormatDetailsPrivate_serverClock = () => FormatDetailsPrivate_STATIC_TIME
function FormatDetailsPrivate_writeRef<T>(ref: React.ForwardedRef<T>, value: T | null) { if (typeof ref === "function") ref(value); else if (ref) ref.current = value }
function FormatDetailsPrivate_useReducedMotion() { const [reduced, setReduced] = React.useState(false); React.useEffect(() => { const query = window.matchMedia("(prefers-reduced-motion: reduce)"), update = () => setReduced(query.matches); update(); query.addEventListener("change", update); return () => query.removeEventListener("change", update) }, []); return reduced }
function FormatDetailsPrivate_frozenTarget() { const target = RenderTarget.current(); return useIsStaticRenderer() || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail }
const FormatDetailsPrivate_FORMAT_POLYGONS: readonly string[] = [
    "polygon(0% 21.551386149%, 0% 100%, 42.05823101% 100%, 100% 100%, 100% 0%, 42.05823101% 0%, 0% 21.551386149%)",
    "polygon(100% 0%, 0% 0%, 0% 100%, 100% 100%, 100% 0%)",
    "polygon(100% 0%, 0% 0%, 0% 100%, 100% 100%, 100% 0%)",
    "polygon(0% 21.551393138%, 0% 78.448746993%, 41.984120473% 100%, 100% 100%, 100% 0%, 41.984120473% 0%, 0% 21.551393138%)",
    "polygon(0% 0%, 0% 100%, 57.942042461% 100%, 100% 78.448746993%, 100% 21.551393138%, 57.942042461% 0%, 0% 0%)",
    "polygon(0% 0%, 0% 100%, 42.058869108% 100%, 100% 100%, 100% 0%, 42.058869108% 0%, 0% 0%)",
    "polygon(0% 0%, 0% 100%, 100% 100%, 100% 40.510974957%, 49.586092715% 0%, 0% 0%)",
    "polygon(0% 0%, 0% 100%, 100% 100%, 34.838116262% 0%, 0% 0%)",
    "polygon(0% 0%, 0% 100%, 57.941130892% 100%, 100% 100%, 100% 21.54313458%, 57.941130892% 0%, 0% 0%)",
    "polygon(0% 21.543141567%, 0% 100%, 42.057957539% 100%, 100% 100%, 100% 0%, 42.057957539% 0%, 0% 21.543141567%)",
    "polygon(0% 21.543141567%, 0% 100%, 41.981678137% 100%, 100% 100%, 100% 0%, 41.981678137% 0%, 0% 21.543141567%)",
    "polygon(0% 0%, 0% 100%, 57.948951686% 100%, 100% 100%, 100% 21.543141567%, 57.948951686% 0%, 0% 0%)",
    "polygon(27.219690064% 0%, 0% 0%, 0% 21.543141567%, 0% 51.298752842%, 27.219690064% 51.298752842%, 27.219690064% 100%, 100% 100%, 100% 0%, 27.219690064% 0%)",
    "polygon(73.053344313% 0%, 0% 0%, 0% 21.543141567%, 0% 51.298752842%, 0% 100%, 73.053344313% 100%, 73.053344313% 51.298752842%, 100% 51.298752842%, 100% 21.543141567%, 100% 0%, 73.053344313% 0%)"
]
function FormatDetailsPrivate_clip(Component: FormatDetailsPrivate_NativeLayer, index: number): FormatDetailsPrivate_NativeLayer { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => <Component {...props} ref={ref} data-format-source-polygon={index} style={{ ...props.style, clipPath: FormatDetailsPrivate_FORMAT_POLYGONS[index], WebkitClipPath: FormatDetailsPrivate_FORMAT_POLYGONS[index] }} />) as FormatDetailsPrivate_NativeLayer }
export function withFormatLogo01(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_clip(Component, 0) }
export function withFormatLogo02(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_clip(Component, 1) }
export function withFormatLogo03(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_clip(Component, 2) }
export function withFormatLogo04(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_clip(Component, 3) }
export function withFormatLogo05(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_clip(Component, 4) }
export function withFormatLogo06(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_clip(Component, 5) }
export function withFormatLogo07(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_clip(Component, 6) }
export function withFormatLogo08(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_clip(Component, 7) }
export function withFormatLogo09(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_clip(Component, 8) }
export function withFormatLogo10(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_clip(Component, 9) }
export function withFormatLogo11(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_clip(Component, 10) }
export function withFormatLogo12(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_clip(Component, 11) }
export function withFormatLogo13(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_clip(Component, 12) }
export function withFormatLogo14(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_clip(Component, 13) }
function FormatDetailsPrivate_useOwnVisibility(ref: React.RefObject<HTMLElement | null>, frozen: boolean) {
    const [visible, setVisible] = React.useState(false), [hidden, setHidden] = React.useState(false), [reduced, setReduced] = React.useState(false)
    React.useEffect(() => {
        const node = ref.current; if (!node || frozen) return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)"), motion = () => setReduced(query.matches), visibility = () => setHidden(document.hidden)
        motion(); visibility(); const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting)); observer.observe(node)
        query.addEventListener("change", motion); document.addEventListener("visibilitychange", visibility)
        return () => { observer.disconnect(); query.removeEventListener("change", motion); document.removeEventListener("visibilitychange", visibility) }
    }, [frozen])
    return !frozen && visible && !hidden && !reduced
}
let FormatDetailsPrivate_clockNow = FormatDetailsPrivate_STATIC_TIME, FormatDetailsPrivate_clockTimer: ReturnType<typeof setInterval> | null = null
const FormatDetailsPrivate_clockListeners = new Set<() => void>()
function FormatDetailsPrivate_getClock() { return FormatDetailsPrivate_clockNow }
function FormatDetailsPrivate_subscribeClock(notify: () => void) {
    FormatDetailsPrivate_clockListeners.add(notify)
    if (FormatDetailsPrivate_clockTimer === null) { FormatDetailsPrivate_clockNow = Date.now(); FormatDetailsPrivate_clockTimer = setInterval(() => { FormatDetailsPrivate_clockNow = Date.now(); FormatDetailsPrivate_clockListeners.forEach(fn => fn()) }, 250) }
    return () => { FormatDetailsPrivate_clockListeners.delete(notify); if (!FormatDetailsPrivate_clockListeners.size && FormatDetailsPrivate_clockTimer !== null) { clearInterval(FormatDetailsPrivate_clockTimer); FormatDetailsPrivate_clockTimer = null } }
}
const FormatDetailsPrivate_CLOCK_SIZES = [2, 3, 5] as const
function FormatDetailsPrivate_berlinAngles(time: number) {
    const values: Record<string, number> = {}
    for (const part of new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(time))) if (part.type !== "literal") values[part.type] = Number(part.value)
    const second = values.second % 60, minute = values.minute + second / 60, hour = values.hour % 12 + minute / 60
    return [second * Math.PI / 30, minute * Math.PI / 30, hour * Math.PI / 6]
}
function FormatDetailsPrivate_radialBalls(angles: readonly number[], sizes: readonly number[], center: number, rail: number) {
    const radii = sizes.map(r => rail - r)
    // Independently solve radial circle intersection, keeping larger balls
    // inward from smaller ones when their angular paths meet.
    for (let i = 1; i < 3; i++) for (let j = 0; j < i; j++) {
        const delta = angles[j] - angles[i], projection = radii[j] * Math.cos(delta), across = radii[j] * Math.sin(delta), clearance = sizes[i] + sizes[j]
        if (projection > 0 && Math.abs(across) < clearance) radii[i] = Math.min(radii[i], projection - Math.sqrt(clearance * clearance - across * across))
    }
    return angles.map((angle, i) => ({ x: center + Math.sin(angle) * radii[i] - sizes[i], y: center - Math.cos(angle) * radii[i] - sizes[i], radius: sizes[i], angle, orbit: radii[i] }))
}
function FormatDetailsPrivate_berlinBalls(time: number) { return FormatDetailsPrivate_radialBalls(FormatDetailsPrivate_berlinAngles(time), FormatDetailsPrivate_CLOCK_SIZES, 34, 27) }
function FormatDetailsPrivate_clockBall(Component: FormatDetailsPrivate_NativeLayer, index: number): FormatDetailsPrivate_NativeLayer {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const frozen = FormatDetailsPrivate_frozenTarget(), own = React.useRef<HTMLElement | null>(null), live = FormatDetailsPrivate_useOwnVisibility(own, frozen), now = React.useSyncExternalStore(live ? FormatDetailsPrivate_subscribeClock : FormatDetailsPrivate_emptySubscribe, live ? FormatDetailsPrivate_getClock : FormatDetailsPrivate_serverClock, FormatDetailsPrivate_serverClock), [unit, setUnit] = React.useState(1)
        FormatDetailsPrivate_useOwnLayoutEffect(() => { const node = own.current; if (!node) return; const measure = () => { const width = parseFloat(getComputedStyle(node).width); if (Number.isFinite(width) && width > 0) setUnit(width / (FormatDetailsPrivate_CLOCK_SIZES[index] * 2)) }; measure(); const observer = new ResizeObserver(measure); observer.observe(node); return () => observer.disconnect() }, [])
        const ball = FormatDetailsPrivate_berlinBalls(now)[index]
        return <Component {...props} ref={(node: HTMLElement | null) => { own.current = node; FormatDetailsPrivate_writeRef(ref, node) }} data-format-berlin-clock={index} data-format-clock-time={now} style={{ ...props.style, left: ball.x * unit, top: ball.y * unit, pointerEvents: "none" }} />
    }) as FormatDetailsPrivate_NativeLayer
}
export function withFormatMiniSecond(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_clockBall(Component, 0) }
export function withFormatMiniMinute(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_clockBall(Component, 1) }
export function withFormatMiniHour(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_clockBall(Component, 2) }
export function withFormatRunningReel(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const frozen = FormatDetailsPrivate_frozenTarget(), own = React.useRef<HTMLElement | null>(null), live = FormatDetailsPrivate_useOwnVisibility(own, frozen), [phase, setPhase] = React.useState(0), motion = React.useRef({ start: 0, boost: 0, lastY: 0, unit: 1 })
        React.useEffect(() => {
            const node = own.current; if (!node || frozen) { setPhase(0); return }
            const state = motion.current; state.start = performance.now(); state.boost = 0; state.lastY = window.scrollY
            const measure = () => { const width = parseFloat(getComputedStyle(node).width); state.unit = Number.isFinite(width) && width > 0 ? width / 348 : 1 }, scroll = () => { state.boost += Math.abs(window.scrollY - state.lastY) * 26 / 60; state.lastY = window.scrollY }
            measure(); const observer = new ResizeObserver(measure); observer.observe(node); window.addEventListener("scroll", scroll, { passive: true })
            return () => { observer.disconnect(); window.removeEventListener("scroll", scroll) }
        }, [frozen])
        React.useEffect(() => { if (!live) return; let frame = 0, previous = -Infinity; const tick = (now: number) => { if (now - previous >= 1000 / 30) { previous = now; const state = motion.current; setPhase((((now - state.start) / 1000 * 14 + state.boost) % 756) * state.unit) } frame = requestAnimationFrame(tick) }; frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame) }, [live])
        return <Component {...props} ref={(node: HTMLElement | null) => { own.current = node; FormatDetailsPrivate_writeRef(ref, node) }} data-format-reel={frozen ? 0 : phase} style={{ ...props.style, translate: `0px ${frozen ? 0 : -phase}px`, pointerEvents: "none" } as FormatDetailsPrivate_DetailStyle} />
    }) as FormatDetailsPrivate_NativeLayer
}
type FormatDetailsPrivate_FlowerState = { progress: number; unit: number }
const FormatDetailsPrivate_FlowerContext = React.createContext<FormatDetailsPrivate_FlowerState>({ progress: .5, unit: 1 })
export function withFormatFlowerGround(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const frozen = FormatDetailsPrivate_frozenTarget(), own = React.useRef<HTMLElement | null>(null), [reduced, setReduced] = React.useState(false), [state, setState] = React.useState({ progress: .5, unit: 1, desktop: false })
        React.useEffect(() => { if (frozen) return; const query = window.matchMedia("(prefers-reduced-motion: reduce)"), update = () => setReduced(query.matches); update(); query.addEventListener("change", update); return () => query.removeEventListener("change", update) }, [frozen])
        FormatDetailsPrivate_useOwnLayoutEffect(() => {
            const node = own.current; if (!node) return; let frame = 0
            const measure = () => { frame = 0; const desktop = !frozen && window.innerWidth >= 1280, unit = desktop ? window.innerWidth / 1440 : parseFloat(getComputedStyle(node).width) / 1497 || 1, rect = node.getBoundingClientRect(); setState({ desktop, unit, progress: frozen || reduced ? .5 : Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height))) }) }, schedule = () => { if (!frame) frame = requestAnimationFrame(measure) }
            measure(); const observer = new ResizeObserver(frozen ? measure : schedule); observer.observe(node)
            if (!frozen) { if (!reduced) window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule) }
            return () => { observer.disconnect(); if (frame) cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule) }
        }, [frozen, reduced])
        const style = state.desktop ? { left: -26 * state.unit, top: 1074 * state.unit, width: 1497 * state.unit, height: 999 * state.unit } : {}
        return <FormatDetailsPrivate_FlowerContext.Provider value={state}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; FormatDetailsPrivate_writeRef(ref, node) }} data-format-flower-ground="true" style={{ ...props.style, ...style, pointerEvents: "none", overflow: "hidden" }} /></FormatDetailsPrivate_FlowerContext.Provider>
    }) as FormatDetailsPrivate_NativeLayer
}
export function withFormatFlowerDrift(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => { const state = React.useContext(FormatDetailsPrivate_FlowerContext); return <Component {...props} ref={ref} data-format-flower-drift={state.progress} style={{ ...props.style, top: -70 * state.unit, height: 1139 * state.unit, translate: `0px ${(-70 + 140 * state.progress) * state.unit}px`, pointerEvents: "none" } as FormatDetailsPrivate_DetailStyle} /> }) as FormatDetailsPrivate_NativeLayer
}
const FormatDetailsPrivate_LARGE_SIZES = [8.152, 13.5865, 20.38] as const
const FormatDetailsPrivate_LARGE_RATES = [1, .25, 1 / 12] as const
const FormatDetailsPrivate_LargeDialContext = React.createContext({ angles: FormatDetailsPrivate_berlinAngles(FormatDetailsPrivate_STATIC_TIME), unit: 1 })
/** Source large dial initializesBerlin, then accelerates its three hands by time and absolute ordinaryscroll. */
export function withFormatLargeDial(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const frozen = FormatDetailsPrivate_frozenTarget(), own = React.useRef<HTMLElement | null>(null), live = FormatDetailsPrivate_useOwnVisibility(own, frozen), active = React.useRef(false), state = React.useRef({ base: FormatDetailsPrivate_berlinAngles(FormatDetailsPrivate_STATIC_TIME), phase: 0, lastY: 0 }), [angles, setAngles] = React.useState(FormatDetailsPrivate_berlinAngles(FormatDetailsPrivate_STATIC_TIME)), [unit, setUnit] = React.useState(1)
        const publish = () => setAngles(state.current.base.map((angle, i) => angle + state.current.phase * FormatDetailsPrivate_LARGE_RATES[i]))
        FormatDetailsPrivate_useOwnLayoutEffect(() => { const node = own.current; if (!node) return; const measure = () => { const width = parseFloat(getComputedStyle(node).width); if (width > 0) setUnit(width / 697) }; measure(); const observer = new ResizeObserver(measure); observer.observe(node); return () => observer.disconnect() }, [])
        React.useEffect(() => { state.current = { base: FormatDetailsPrivate_berlinAngles(frozen ? FormatDetailsPrivate_STATIC_TIME : Date.now()), phase: 0, lastY: frozen ? 0 : window.scrollY }; publish(); if (frozen) return; const scroll = () => { const next = window.scrollY, distance = Math.abs(next - state.current.lastY); state.current.lastY = next; if (active.current) { state.current.phase += 240 * Math.PI / 180 * distance / Math.max(1, window.innerHeight); publish() } }; window.addEventListener("scroll", scroll, { passive: true }); return () => window.removeEventListener("scroll", scroll) }, [frozen])
        React.useEffect(() => { active.current = live; state.current.lastY = window.scrollY; if (!live) return; let frame = 0, previous = performance.now(), painted = previous; const tick = (now: number) => { if (now - painted >= 1000 / 30) { state.current.phase += 24 * Math.PI / 180 * (now - previous) / 1000; painted = now; publish(); previous = now } frame = requestAnimationFrame(tick) }; frame = requestAnimationFrame(tick); return () => { active.current = false; cancelAnimationFrame(frame) } }, [live])
        return <FormatDetailsPrivate_LargeDialContext.Provider value={{ angles: frozen ? FormatDetailsPrivate_berlinAngles(FormatDetailsPrivate_STATIC_TIME) : angles, unit }}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; FormatDetailsPrivate_writeRef(ref, node) }} data-format-large-dial={angles[0]} style={{ ...props.style, pointerEvents: "none" }} /></FormatDetailsPrivate_LargeDialContext.Provider>
    }) as FormatDetailsPrivate_NativeLayer
}
function FormatDetailsPrivate_largeBall(Component: FormatDetailsPrivate_NativeLayer, index: number): FormatDetailsPrivate_NativeLayer { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => { const state = React.useContext(FormatDetailsPrivate_LargeDialContext), ball = FormatDetailsPrivate_radialBalls(state.angles, FormatDetailsPrivate_LARGE_SIZES, 348.5, 252.034)[index]; return <Component {...props} ref={ref} data-format-large-ball={index} style={{ ...props.style, left: ball.x * state.unit, top: ball.y * state.unit, pointerEvents: "none" }} /> }) as FormatDetailsPrivate_NativeLayer }
export function withFormatDialSecond(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_largeBall(Component, 0) }
export function withFormatDialMinute(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_largeBall(Component, 1) }
export function withFormatDialHour(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_largeBall(Component, 2) }
export function withFormatRecordSurface(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => <Component {...props} ref={ref} style={{ ...props.style, maskImage: "radial-gradient(circle closest-side, transparent 8.7517934%, black 8.76%)", WebkitMaskImage: "radial-gradient(circle closest-side, transparent 8.7517934%, black 8.76%)", pointerEvents: "none" }} />) as FormatDetailsPrivate_NativeLayer }
export function withFormatRecordGlass(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => <Component {...props} ref={ref} style={{ ...props.style, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", maskImage: "radial-gradient(circle closest-side, transparent 16.1%, black 16.5%)", WebkitMaskImage: "radial-gradient(circle closest-side, transparent 16.1%, black 16.5%)", pointerEvents: "none" }} />) as FormatDetailsPrivate_NativeLayer }
export function withFormatRecordSpin(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => { const frozen = FormatDetailsPrivate_frozenTarget(), own = React.useRef<HTMLElement | null>(null), live = FormatDetailsPrivate_useOwnVisibility(own, frozen), angle = React.useRef(0), [rotation, setRotation] = React.useState(0); React.useEffect(() => { if (!live) return; let frame = 0, previous = performance.now(); const tick = (now: number) => { if (now - previous >= 1000 / 30) { angle.current = (angle.current + (now - previous) * 360 / 100000) % 360; previous = now; setRotation(angle.current) } frame = requestAnimationFrame(tick) }; frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame) }, [live]); return <Component {...props} ref={(node: HTMLElement | null) => { own.current = node; FormatDetailsPrivate_writeRef(ref, node) }} data-format-record-turn={frozen ? 0 : rotation} style={{ ...props.style, rotate: `${frozen ? 0 : rotation}deg`, transformOrigin: "50% 50%", pointerEvents: "none" } as FormatDetailsPrivate_DetailStyle} /> }) as FormatDetailsPrivate_NativeLayer
}
function FormatDetailsPrivate_polygonClip(Component: FormatDetailsPrivate_NativeLayer, polygon: string): FormatDetailsPrivate_NativeLayer { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => <Component {...props} ref={ref} style={{ ...props.style, clipPath: polygon, WebkitClipPath: polygon, pointerEvents: "none" }} />) as FormatDetailsPrivate_NativeLayer }
export function withFormatTriangleOutline(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_polygonClip(Component, "polygon(100% 8.409171563%, 54.281314941% 100%, 45.652634016% 100%, 0% 8.541855605%, 4.263715534% 0%, 95.802420735% 0%)") }
export function withFormatTriangleLeftMask(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_polygonClip(Component, "polygon(100% 0%, 100% 100%, 92.830526159% 100%, 0% 0%)") }
export function withFormatTriangleRightMask(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_polygonClip(Component, "polygon(0% 0%, 0% 100%, 7.1683% 100%, 100% 0%)") }
export function withFormatPosterHand(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => { const frozen = FormatDetailsPrivate_frozenTarget(), held = React.useContext(FormatDetailsPrivate_PosterCarryContext), own = React.useRef<HTMLElement | null>(null), live = FormatDetailsPrivate_useOwnVisibility(own, frozen || held), now = React.useSyncExternalStore(live ? FormatDetailsPrivate_subscribeClock : FormatDetailsPrivate_emptySubscribe, live ? FormatDetailsPrivate_getClock : FormatDetailsPrivate_serverClock, FormatDetailsPrivate_serverClock), heldAngle = React.useRef(new Date(now).getSeconds() * 30); if (!held) heldAngle.current = new Date(now).getSeconds() * 30; const angle = heldAngle.current; return <Component {...props} ref={(node: HTMLElement | null) => { own.current = node; FormatDetailsPrivate_writeRef(ref, node) }} data-format-poster-second={angle} style={{ ...props.style, rotate: `${angle}deg`, transformOrigin: "0 0", pointerEvents: "none" } as FormatDetailsPrivate_DetailStyle} /> }) as FormatDetailsPrivate_NativeLayer }
const FormatDetailsPrivate_WINDOW_PAIRS = [{ top: "Desert Tree", foot: "Frozen Bloom" }, { top: "Lost Dreams", foot: "Silent Fog" }, { top: "Fading Hour", foot: "Restless Wind" }] as const
const FormatDetailsPrivate_WindowContext = React.createContext({ at: 0, unit: 1 })
/** Source window strip is scroll-driven through3pairs with.8s scrub; it is not an autoplay slideshow. */
export function withFormatWindowSequence(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const frozen = FormatDetailsPrivate_frozenTarget(), own = React.useRef<HTMLElement | null>(null), live = FormatDetailsPrivate_useOwnVisibility(own, frozen), [state, setState] = React.useState({ at: 0, unit: 1 }), value = React.useRef(0), wake = React.useRef<() => void>(() => {})
        FormatDetailsPrivate_useOwnLayoutEffect(() => { const node = own.current; if (!node) return; const measure = () => { const width = parseFloat(getComputedStyle(node).width); if (width > 0) setState(previous => ({ ...previous, unit: width / 1045 })) }; measure(); const observer = new ResizeObserver(measure); observer.observe(node); return () => observer.disconnect() }, [])
        React.useEffect(() => {
            if (frozen || !live) return; let frame = 0, previous = performance.now()
            const target = () => { const rect = own.current!.getBoundingClientRect(); return Math.max(0, Math.min(3, (window.innerHeight - rect.top + 126 * rect.width / 1045) / Math.max(1, window.innerHeight + 697 * rect.width / 1045) * 3)) }
            const tick = (now: number) => { frame = 0; const next = target(), dt = Math.max(0, Math.min(.1, (now - previous) / 1000)); if (dt < 1 / 30) { frame = requestAnimationFrame(tick); return }; previous = now; value.current += (next - value.current) * (1 - Math.exp(-dt / .16)); if (Math.abs(next - value.current) < .00001) value.current = next; setState(state => ({ ...state, at: value.current })); if (value.current !== next) frame = requestAnimationFrame(tick) }
            const schedule = () => { if (!frame) { previous = performance.now(); frame = requestAnimationFrame(tick) } }; wake.current = schedule; window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule); schedule()
            return () => { wake.current = () => {}; if (frame) cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule) }
        }, [frozen, live])
        return <FormatDetailsPrivate_WindowContext.Provider value={frozen ? { at: 0, unit: state.unit } : state}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; FormatDetailsPrivate_writeRef(ref, node) }} data-format-window-at={frozen ? 0 : state.at} style={{ ...props.style, pointerEvents: "none" }} /></FormatDetailsPrivate_WindowContext.Provider>
    }) as FormatDetailsPrivate_NativeLayer
}
export function withFormatWindowDisc(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => { const state = React.useContext(FormatDetailsPrivate_WindowContext); return <Component {...props} ref={ref} style={{ ...props.style, rotate: `${state.at * 90}deg`, transformOrigin: "50% 50%", pointerEvents: "none" } as FormatDetailsPrivate_DetailStyle} /> }) as FormatDetailsPrivate_NativeLayer }
export function withFormatWindowPhotoStrip(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => { const state = React.useContext(FormatDetailsPrivate_WindowContext); return <Component {...props} ref={ref} style={{ ...props.style, translate: `0px ${-(state.at % 3) * 368.5 * state.unit}px`, pointerEvents: "none" } as FormatDetailsPrivate_DetailStyle} /> }) as FormatDetailsPrivate_NativeLayer }
function FormatDetailsPrivate_windowPhoto(Component: FormatDetailsPrivate_NativeLayer, index: number): FormatDetailsPrivate_NativeLayer { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => { const state = React.useContext(FormatDetailsPrivate_WindowContext), brightness = 1 - Math.min(1, Math.abs(index - state.at % 3)) * .45; return <Component {...props} ref={ref} style={{ ...props.style, filter: `brightness(${brightness})`, pointerEvents: "none" }} /> }) as FormatDetailsPrivate_NativeLayer }
export function withFormatWindowPhoto01(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_windowPhoto(Component, 0) }
export function withFormatWindowPhoto02(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_windowPhoto(Component, 1) }
export function withFormatWindowPhoto03(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_windowPhoto(Component, 2) }
export function withFormatWindowPhoto04(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_windowPhoto(Component, 3) }
function FormatDetailsPrivate_windowName(Component: FormatDetailsPrivate_NativeLayer, quarter: number): FormatDetailsPrivate_NativeLayer { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => { const state = React.useContext(FormatDetailsPrivate_WindowContext), index = Math.floor(state.at), pair = FormatDetailsPrivate_WINDOW_PAIRS[index % 3], next = FormatDetailsPrivate_WINDOW_PAIRS[(index + 1) % 3], side = (quarter + index) % 4, text = side === 0 ? pair.top : side === 2 ? pair.foot : side === 3 ? next.top : next.foot; return <Component {...props} ref={ref} text={text} /> }) as FormatDetailsPrivate_NativeLayer }
export function withFormatWindowName01(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_windowName(Component, 0) }
export function withFormatWindowName02(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_windowName(Component, 1) }
export function withFormatWindowName03(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_windowName(Component, 2) }
export function withFormatWindowName04(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_windowName(Component, 3) }
const FormatDetailsPrivate_GAUGE_NAMES = ["Format", "Vertical", "Horizontal", "Circle", "Triangle", "Complex"] as const
const FormatDetailsPrivate_GAUGE_WIDTHS = [150.080032349, 151.342056274, 201.586074829, 122.408035278, 162.166061401, 179.148040771] as const
const FormatDetailsPrivate_GaugeContext = React.createContext({ progress: 0, unit: 1, active: -13, stopped: true })
export function withFormatGaugeField(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const frozen = FormatDetailsPrivate_frozenTarget(), reduced = FormatDetailsPrivate_useReducedMotion(), stopped = frozen || reduced, own = React.useRef<HTMLElement | null>(null), [state, setState] = React.useState({ progress: 0, unit: 1, active: -13 })
        FormatDetailsPrivate_useOwnLayoutEffect(() => { const node = own.current; if (!node) return; let frame = 0; const read = () => { frame = 0; const width = parseFloat(getComputedStyle(node).width), unit = width > 0 ? width / 1440 : 1, rect = node.getBoundingClientRect(), screenUnit = rect.width / 1440, raw = stopped ? 0 : Math.max(0, Math.min(1, (window.innerHeight * 1.05 - (rect.top + 1218.5 * screenUnit)) / Math.max(1, window.innerHeight * .55))), progress = raw < .5 ? 4 * raw ** 3 : 1 - (-2 * raw + 2) ** 3 / 2; setState({ progress, unit, active: Math.round(-13 * (1 - progress)) }) }, schedule = () => { if (!frame) frame = requestAnimationFrame(read) }; read(); const observer = new ResizeObserver(stopped ? read : schedule); observer.observe(node); if (!stopped) { window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule) }; return () => { observer.disconnect(); if (frame) cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule) } }, [stopped])
        return <FormatDetailsPrivate_GaugeContext.Provider value={{ ...state, stopped }}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; FormatDetailsPrivate_writeRef(ref, node) }} data-format-gauge-active={state.active} data-format-gauge-progress={state.progress} style={{ ...props.style, pointerEvents: "none" }} /></FormatDetailsPrivate_GaugeContext.Provider>
    }) as FormatDetailsPrivate_NativeLayer
}
/** Each native word declares public elementId format-gauge-{left|right}-{0..25}; no Framer/private tree lookup. */
export function withFormatGaugeWord(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const state = React.useContext(FormatDetailsPrivate_GaugeContext), frozen = FormatDetailsPrivate_frozenTarget(), inkId = React.useId().replace(/[^\w-]/g, "_"), own = React.useRef<HTMLElement | null>(null), [identity, setIdentity] = React.useState<{ side: string; index: number } | null>(null)
        FormatDetailsPrivate_useOwnLayoutEffect(() => { const match = own.current?.id.match(/^format-gauge-(left|right)-(\d+)$/); if (match && Number(match[2]) < 26) setIdentity({ side: match[1], index: Number(match[2]) }) }, [])
        const order = (identity?.index ?? 13) - 13, name = ((order + 3) % 6 + 6) % 6, angle = order * Math.PI / 24, active = order === state.active, scale = active ? 1 : 12 / 42, width = FormatDetailsPrivate_GAUGE_WIDTHS[name], radius = active ? 693.5 - width : 455.5, side = identity?.side ?? "left", c = Math.cos(angle), s = Math.sin(angle), dy = -21 + (side === "right" ? 2 : -2), x = side === "left" ? c * radius - s * dy * scale : 1440 - c * radius + (-width * c + dy * s) * scale, y = 1218.5 + s * radius + (side === "left" ? c * dy : width * s + dy * c) * scale
        return <><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; FormatDetailsPrivate_writeRef(ref, node) }} data-format-gauge-ink={inkId} data-format-gauge-word={identity ? `${side}/${order}` : "missing-public-elementId"} data-format-gauge-read={active} style={{ ...props.style, left: x * state.unit, top: y * state.unit, rotate: `${(side === "right" ? -1 : 1) * order * 7.5}deg`, scale: String(scale), transformOrigin: "0 0", color: active ? "#000000" : "#bfbfbf", transition: state.stopped ? "none" : "left .45s cubic-bezier(.22,1,.36,1), top .45s cubic-bezier(.22,1,.36,1), scale .45s cubic-bezier(.22,1,.36,1), color .25s linear", pointerEvents: "none" } as FormatDetailsPrivate_DetailStyle} /><style>{`[data-format-gauge-ink="${inkId}"],[data-format-gauge-ink="${inkId}"] *{color:${active ? "#000000" : "#bfbfbf"}!important;white-space:pre!important;overflow-wrap:normal!important}`}</style></>
    }) as FormatDetailsPrivate_NativeLayer
}
export function withFormatGaugeWhiteRing(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => <Component {...props} ref={ref} style={{ ...props.style, maskImage: "radial-gradient(circle closest-side, transparent 1.3388437%, black 1.35%)", WebkitMaskImage: "radial-gradient(circle closest-side, transparent 1.3388437%, black 1.35%)", pointerEvents: "none" }} />) as FormatDetailsPrivate_NativeLayer }
export function withFormatGaugeBlackRing(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => <Component {...props} ref={ref} style={{ ...props.style, maskImage: "radial-gradient(circle closest-side, transparent 16.4983165%, black 16.51%)", WebkitMaskImage: "radial-gradient(circle closest-side, transparent 16.4983165%, black 16.51%)", pointerEvents: "none" }} />) as FormatDetailsPrivate_NativeLayer }
function FormatDetailsPrivate_resample(points: readonly (readonly number[])[], count = 72) { const segments = points.map((a, i) => { const b = points[(i + 1) % points.length]; return { a, b, length: Math.hypot(a[0] - b[0], a[1] - b[1]) } }), total = segments.reduce((sum, s) => sum + s.length, 0); return Array.from({ length: count }, (_, i) => { let distance = total * i / count; for (const s of segments) { if (distance <= s.length || s === segments[segments.length - 1]) { const t = s.length ? distance / s.length : 0; return [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t] }; distance -= s.length }; return [...points[0]] }) }
function FormatDetailsPrivate_gaugeShape(index: number, pane: number) {
    const w = 20 / 41, h = 22 / 41, rect = (width: number, height: number) => [[.5 - width / 2, .5 - height / 2], [.5 + width / 2, .5 - height / 2], [.5 + width / 2, .5 + height / 2], [.5 - width / 2, .5 + height / 2]], circle = (cx: number, cy: number, r: number, from: number, sweep: number) => Array.from({ length: 96 }, (_, i) => [cx + Math.cos(from + i / 96 * sweep) * r, cy + Math.sin(from + i / 96 * sweep) * r])
    if (pane === 1 && index !== 0 && index !== 5) return Array.from({ length: 72 }, () => [.5, 31 / 41])
    if (index === 0) { const sx = (x: number) => .5 - w / 2 + x * w, tall = 20 * 214.085 / 227.01 / 41, sy = (y: number) => .5 - tall / 2 + y * tall; return FormatDetailsPrivate_resample(pane ? [[sx(.5275), sy(0)], [sx(.5275), sy(1)], [sx(1 - 46.057 / 227.01), sy(1)], [sx(1), sy(1 - 46.138 / 214.085)], [sx(1), sy(46.138 / 214.085)], [sx(1 - 46.057 / 227.01), sy(0)]] : [[sx(0), sy(46.138 / 214.085)], [sx(0), sy(1 - 46.138 / 214.085)], [sx(46.057 / 227.01), sy(1)], [sx(.5 - .055 / 2), sy(1)], [sx(.5 - .055 / 2), sy(0)], [sx(46.057 / 227.01), sy(0)]]) }
    if (index === 1) return FormatDetailsPrivate_resample(rect(17 / 41, h)); if (index === 2) return FormatDetailsPrivate_resample(rect(w, 15 / 41)); if (index === 3) return FormatDetailsPrivate_resample(circle(.5, .5, w / 2, -Math.PI / 2, Math.PI * 2)); if (index === 4) { const high = w * 28.531 / 32.999; return FormatDetailsPrivate_resample([[.5 + w / 2, .7108785 - .084 * high], [.2560976 + .5427 * w, .7108785 - high], [.2560976 + .4564 * w, .7108785 - high], [.2560976, .7108785 - .0855 * high], [.2560976 + .0427 * w, .7108785], [.2560976 + .958 * w, .7108785]]) }; return FormatDetailsPrivate_resample(pane ? [[.25609756, 21 / 41], [.74390244, 21 / 41], [.74390244, 1], [.25609756, 1]] : circle(.5, w / 2, w / 2, Math.PI, Math.PI * 2))
}
function FormatDetailsPrivate_gaugePane(Component: FormatDetailsPrivate_NativeLayer, pane: number): FormatDetailsPrivate_NativeLayer { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => { const state = React.useContext(FormatDetailsPrivate_GaugeContext), index = ((state.active + 3) % 6 + 6) % 6, points = FormatDetailsPrivate_gaugeShape(index, pane), clipPath = "polygon(" + points.map(([x, y]) => `${(x * 100).toFixed(6)}% ${(y * 100).toFixed(6)}%`).join(",") + ")"; return <Component {...props} ref={ref} data-format-gauge-shape={FormatDetailsPrivate_GAUGE_NAMES[index]} style={{ ...props.style, width: "100%", height: "100%", backgroundColor: "var(--source-format-pip-color,#ffffff)", clipPath, WebkitClipPath: clipPath, transition: state.stopped ? "none" : "clip-path .55s cubic-bezier(.65,0,.35,1)", pointerEvents: "none" }} /> }) as FormatDetailsPrivate_NativeLayer }
export function withFormatGaugePaneA(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_gaugePane(Component, 0) }
export function withFormatGaugePaneB(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_gaugePane(Component, 1) }
export function withFormatGaugeShape(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const state = React.useContext(FormatDetailsPrivate_GaugeContext), world = React.useContext(FormatDetailsPrivate_FormatClosingContext), remove = React.useRef<(() => void) | null>(null), size = (20 + state.progress * 315) * 41 / 20 * state.unit
        const bind = React.useCallback((node: HTMLElement | null) => { remove.current?.(); remove.current = node && world ? world.registerMagnet("pip", node) : null; FormatDetailsPrivate_writeRef(ref, node) }, [world, ref])
        return <Component {...props} ref={bind} data-format-magnet-pip="retained-native-ring-center" style={{ ...props.style, left: 720 * state.unit - size / 2, top: 1218.5 * state.unit - size / 2, width: size, height: size, pointerEvents: "none" }} />
    }) as FormatDetailsPrivate_NativeLayer
}

/** Source field alternates the two native word groups every1.3s (2.6s step-end cycle). The original pointer-spawned physics chips remain outside this bounded detail module. */
function FormatDetailsPrivate_flickWord(Component: FormatDetailsPrivate_NativeLayer, phase: number): FormatDetailsPrivate_NativeLayer { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => { const frozen = FormatDetailsPrivate_frozenTarget(), own = React.useRef<HTMLElement | null>(null), live = FormatDetailsPrivate_useOwnVisibility(own, frozen); return <><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; FormatDetailsPrivate_writeRef(ref, node) }} data-format-click-phase={phase} style={{ ...props.style, opacity: phase ? .25 : 1, animation: live ? `source-format-click-flick 2.6s step-end ${phase ? "-1.3s" : "0s"} infinite` : "none", pointerEvents: "none" }} /><style>{`@keyframes source-format-click-flick{0%{opacity:1}50%{opacity:.25}}@media(prefers-reduced-motion:reduce){[data-format-click-phase]{animation:none!important}}`}</style></> }) as FormatDetailsPrivate_NativeLayer }
export function withFormatClickPhaseA(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_flickWord(Component, 0) }
export function withFormatClickPhaseB(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_flickWord(Component, 1) }
export function withFormatFieldRule(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => <Component {...props} ref={ref} style={{ ...props.style, backgroundImage: "repeating-linear-gradient(to right,#676767 0 4px,transparent 4px 12px)", backgroundColor: "transparent", pointerEvents: "none" }} />) as FormatDetailsPrivate_NativeLayer }
const FormatDetailsPrivate_DeckContext = React.createContext({ offset: 290, grey: 0, unit: 1 })
/** Source reel has seven99.5862px native slots with5px gaps. Its later ordinary-scroll drift is.18px/px. Its section geometry is independently derived from the public source constants; sourceLenis smoothing is not reproduced. */
export function withFormatDeckRuntime(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const frozen = FormatDetailsPrivate_frozenTarget(), reduced = FormatDetailsPrivate_useReducedMotion(), own = React.useRef<HTMLElement | null>(null), [state, setState] = React.useState({ offset: 290, grey: 0, unit: 1 })
        FormatDetailsPrivate_useOwnLayoutEffect(() => {
            const node = own.current; if (!node) return; let frame = 0
            const read = () => { frame = 0; const width = parseFloat(getComputedStyle(node).width), unit = width > 0 ? width / 335 : 1, l = FormatDetailsPrivate_sourceLayout(window.innerWidth, window.innerHeight), u = l.unit, start = l.group + 2646 * u - window.innerHeight, end = l.deck + 213 * u - window.innerHeight / 2, y = frozen || reduced ? 0 : window.scrollY, progress = frozen || reduced ? 0 : Math.max(0, Math.min(1, (y - start) / Math.max(1, end - start))), eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2, step = Math.round(99.586212 * u) + Math.round(5 * u), offset = frozen || reduced ? 290 : (Math.round(290 * u) + (Math.round(163.171875 * u) - 3 * step - Math.round(290 * u)) * eased - Math.max(0, y - end) * .18) / u; setState({ unit, offset, grey: Math.max(0, Math.min(1, progress / .18)) }) }, schedule = () => { if (!frame) frame = requestAnimationFrame(read) }
            read(); const observer = new ResizeObserver(frozen ? read : schedule); observer.observe(node); if (!frozen && !reduced) { window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule) }
            return () => { observer.disconnect(); if (frame) cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule) }
        }, [frozen, reduced])
        return <FormatDetailsPrivate_DeckContext.Provider value={state}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; FormatDetailsPrivate_writeRef(ref, node) }} data-format-deck-offset={state.offset} data-format-deck-grey={state.grey} style={{ ...props.style, pointerEvents: "none" }} /></FormatDetailsPrivate_DeckContext.Provider>
    }) as FormatDetailsPrivate_NativeLayer
}
function FormatDetailsPrivate_deckPhoto(Component: FormatDetailsPrivate_NativeLayer, index: number): FormatDetailsPrivate_NativeLayer { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => { const state = React.useContext(FormatDetailsPrivate_DeckContext), step = 104.586212, period = step * 7, raw = state.offset + index * step, y = ((raw + step) % period + period) % period - step; return <Component {...props} ref={ref} data-format-deck-photo={index} style={{ ...props.style, top: y * state.unit, pointerEvents: "none" }} /> }) as FormatDetailsPrivate_NativeLayer }
export function withFormatDeckPhoto01(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_deckPhoto(Component, 0) }
export function withFormatDeckPhoto02(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_deckPhoto(Component, 1) }
export function withFormatDeckPhoto03(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_deckPhoto(Component, 2) }
export function withFormatDeckPhoto04(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_deckPhoto(Component, 3) }
export function withFormatDeckPhoto05(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_deckPhoto(Component, 4) }
export function withFormatDeckPhoto06(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_deckPhoto(Component, 5) }
export function withFormatDeckPhoto07(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_deckPhoto(Component, 6) }
export function withFormatDeckInk(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => { const state = React.useContext(FormatDetailsPrivate_DeckContext), inkId = React.useId().replace(/[^\w-]/g, "_"), size = parseFloat(String(props.style?.fontSize ?? 8)), level = Math.round((size >= 24 ? 229 : 191) * state.grey); return <><Component {...props} ref={ref} data-format-deck-ink={inkId} style={{ ...props.style, color: `rgb(${level},${level},${level})`, pointerEvents: "none" }} /><style>{`[data-format-deck-ink="${inkId}"],[data-format-deck-ink="${inkId}"] *{color:rgb(${level},${level},${level})!important}`}</style></> }) as FormatDetailsPrivate_NativeLayer }
type FormatDetailsPrivate_SourceLayout = { unit: number; group: number; deck: number; fan: number; window: number; crossing: number; gauge: number; poster: number; field: number; footer: number; body: number; fieldHeight: number }
/** Independent algebra from inspected source dimensions: windowsection697px includes its448px aperture. The inverse cubic matches sourcepower2.inOut, with no behavior-JS import. */
function FormatDetailsPrivate_sourceLayout(width: number, height: number): FormatDetailsPrivate_SourceLayout {
    const unit = width / 1440, diagonal = Math.ceil(Math.hypot(width, height)), ratio = Math.min(1, height / Math.max(1, diagonal)), inverse = ratio < .5 ? Math.cbrt(ratio / 4) : 1 - Math.cbrt((1 - ratio) / 4)
    const group = 1554 * unit + 513 * unit / 2 - height / 2 + height * .763 * (.44 + inverse) + height, deck = group + 2646 * unit + height * .5, fan = deck + 432 * unit, windowAt = fan + 703 * unit, crossing = windowAt + 703 * unit, gauge = crossing + 960.664 * unit, poster = gauge + 2056 * unit, field = poster + 2717 * unit, fieldHeight = height * 1.43 - 40 * unit, footer = field + fieldHeight + 350 * unit
    return { unit, group, deck, fan, window: windowAt, crossing, gauge, poster, field, footer, body: footer + 273 * unit, fieldHeight }
}
const FormatDetailsPrivate_SourceLayoutContext = React.createContext({ width: 1440, height: 810, frozen: true, phone: false, layout: FormatDetailsPrivate_sourceLayout(1440, 810) })
// Revision-key the owner of hook-retained worlds when controller protocols change.
const FormatDetailsPrivate_FORMAT_DOCUMENT_REVISION="native-poster-magnet-88-flight-keyed-v3"
type FormatDetailsPrivate_FormatDocumentSurfaceProps = { Native: FormatDetailsPrivate_NativeLayer; layer: FormatDetailsPrivate_LayerProps; nativeRef: React.ForwardedRef<HTMLElement> }
function FormatDetailsPrivate_FormatDocumentSurface({ Native: Component, layer: props, nativeRef: ref }: FormatDetailsPrivate_FormatDocumentSurfaceProps) {
        const frozen = FormatDetailsPrivate_frozenTarget(), reduced = FormatDetailsPrivate_useReducedMotion(), own = React.useRef<HTMLElement | null>(null), closing = React.useRef<FormatDetailsPrivate_FormatClosingWorld | null>(null), [host, setHost] = React.useState<HTMLElement | null>(null), [view, setView] = React.useState({ width: 1440, height: 810 })
        FormatDetailsPrivate_useOwnLayoutEffect(() => { const node = host; if (!node) return; let frame = 0; const read = () => { frame = 0; const width = frozen ? node.clientWidth || 1440 : window.innerWidth, height = frozen ? width < 1280 ? 844 : 810 : window.innerHeight; setView(v => v.width === width && v.height === height ? v : { width, height }) }, schedule = () => { if (!frame) frame = requestAnimationFrame(read) }; read(); const observer = new ResizeObserver(frozen ? read : schedule); observer.observe(node); if (!frozen) window.addEventListener("resize", schedule); return () => { observer.disconnect(); if (frame) cancelAnimationFrame(frame); window.removeEventListener("resize", schedule) } }, [frozen, host])
        const bind = React.useCallback((node: HTMLElement | null) => { own.current = node; setHost(old => old === node ? old : node); FormatDetailsPrivate_writeRef(ref, node) }, [ref])
        const phone = view.width < 1280, layout = FormatDetailsPrivate_sourceLayout(view.width, view.height), style = frozen || phone ? props.style : { ...props.style, width: view.width, height: layout.body }
        if (!closing.current) closing.current = FormatDetailsPrivate_createFormatClosingWorld()
        const world = closing.current
        FormatDetailsPrivate_useOwnLayoutEffect(() => { world.configure({ frozen, reduced, phone, root: host }) }, [world, frozen, reduced, phone, host])
        FormatDetailsPrivate_useOwnLayoutEffect(() => () => world.dispose(), [world])
        return <FormatDetailsPrivate_FormatClosingContext.Provider value={world}><FormatDetailsPrivate_SourceLayoutContext.Provider value={{ ...view, frozen, phone, layout }}><><Component {...props} ref={bind} data-format-source-height={layout.body} style={style} /><style>{FormatDetailsPrivate_FORMAT_MAGNET_STYLE}</style></></FormatDetailsPrivate_SourceLayoutContext.Provider></FormatDetailsPrivate_FormatClosingContext.Provider>
    }
export function withFormatRefinedDocument(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => <FormatDetailsPrivate_FormatDocumentSurface key={FormatDetailsPrivate_FORMAT_DOCUMENT_REVISION} Native={Component} layer={props} nativeRef={ref} />) as FormatDetailsPrivate_NativeLayer
}
type FormatDetailsPrivate_FlowRole = "opening-card" | "usage" | "dials" | "triangle" | "window" | "crossing" | "gauge" | "poster" | "field" | "footer" | "late-deck" | "seven" | "early" | "fan" | "fog"
function FormatDetailsPrivate_sourceFlow(Component: FormatDetailsPrivate_NativeLayer, role: FormatDetailsPrivate_FlowRole): FormatDetailsPrivate_NativeLayer {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const state = React.useContext(FormatDetailsPrivate_SourceLayoutContext), l = state.layout, u = l.unit
        if (state.phone) return <Component {...props} ref={ref} style={role === "early" ? { ...props.style, pointerEvents: "none" } : props.style} />
        const positions: Record<FormatDetailsPrivate_FlowRole, readonly number[]> = { "opening-card": [553, 436 * u, 409, 426], usage: [552, l.group, 335, 426], dials: [0, l.group + 596 * u, 1440, 697], triangle: [368, l.group + 1299 * u, 704, 608.664], window: [198, l.window + 126 * u, 1045, 448], crossing: [0, l.crossing, 1440, 840.664], gauge: [0, l.gauge, 1440, 2050], poster: [0, l.poster, 1440, 1617], field: [0, l.field, 1440, l.fieldHeight / u], footer: [0, l.footer, 1440, 273], "late-deck": [552.5, l.deck, 335, 426], seven: [0, l.group, 1440, 2646], early: [0, 0, 1440, 2067], fan: [367, l.fan, 706, 697], fog: [0, l.fan + 348.5 * u, 1440, (l.crossing + 232 * u - l.fan - 348.5 * u) / u] }, [x, y, width, height] = positions[role]
        return <Component {...props} ref={ref} data-format-source-flow={role} style={{ ...props.style, position: "absolute", left: x * u, top: y, width, height, scale: String(u), rotate: "0deg", transformOrigin: "0 0", opacity: 1, ...(role === "early" ? { pointerEvents: "none" } : {}) } as FormatDetailsPrivate_DetailStyle} />
    }) as FormatDetailsPrivate_NativeLayer
}
export function withFormatOpeningCardFlow(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_sourceFlow(Component, "opening-card") }
export function withFormatUsageFlow(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_sourceFlow(Component, "usage") }
export function withFormatDialsFlow(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_sourceFlow(Component, "dials") }
export function withFormatTriangleFlow(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_sourceFlow(Component, "triangle") }
export function withFormatWindowFlow(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_sourceFlow(Component, "window") }
export function withFormatCrossingFlow(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_sourceFlow(Component, "crossing") }
export function withFormatGaugeFlow(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_sourceFlow(Component, "gauge") }
export function withFormatPosterFlow(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_sourceFlow(Component, "poster") }
export function withFormatFieldFlow(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_sourceFlow(Component, "field") }
export function withFormatFooterFlow(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_sourceFlow(Component, "footer") }
export function withFormatLateDeckFlow(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_sourceFlow(Component, "late-deck") }
export function withFormatSevenBlocksFlow(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_sourceFlow(Component, "seven") }
export function withFormatEarlyPanelsFlow(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_sourceFlow(Component, "early") }
export function withFormatFanFlow(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_sourceFlow(Component, "fan") }
export function withFormatFogFlow(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_sourceFlow(Component, "fog") }
const FormatDetailsPrivate_FanContext = React.createContext({ open: 0, unit: 1 })
export function withFormatFanMechanism(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => { const frozen = FormatDetailsPrivate_frozenTarget(), reduced = FormatDetailsPrivate_useReducedMotion(), own = React.useRef<HTMLElement | null>(null), [open, setOpen] = React.useState(0), [unit, setUnit] = React.useState(1); FormatDetailsPrivate_useOwnLayoutEffect(() => { const node = own.current; if (!node) return; let frame = 0; const read = () => { frame = 0; const rect = node.getBoundingClientRect(), logicalWidth = parseFloat(getComputedStyle(node).width), progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / Math.max(1, window.innerHeight + rect.height))); setUnit(logicalWidth > 0 ? logicalWidth / 706 : 1); setOpen(frozen || reduced ? 0 : progress - .5) }, schedule = () => { if (!frame) frame = requestAnimationFrame(read) }; read(); const observer = new ResizeObserver(frozen ? read : schedule); observer.observe(node); if (!frozen && !reduced) { window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule) }; return () => { observer.disconnect(); if (frame) cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule) } }, [frozen, reduced]); return <FormatDetailsPrivate_FanContext.Provider value={{ open, unit }}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; FormatDetailsPrivate_writeRef(ref, node) }} data-format-fan-open={open} style={{ ...props.style, pointerEvents: "none" }} /></FormatDetailsPrivate_FanContext.Provider> }) as FormatDetailsPrivate_NativeLayer
}
function FormatDetailsPrivate_fanCard(Component: FormatDetailsPrivate_NativeLayer, index: number): FormatDetailsPrivate_NativeLayer { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => { const state = React.useContext(FormatDetailsPrivate_FanContext), base = index === 5 ? 0 : index + 1, angle = (base + (index + 3) * state.open) * 60; return <Component {...props} ref={ref} data-format-fan-card={index} style={{ ...props.style, rotate: `${angle}deg`, transformOrigin: "12.398373984% 13.034188034%", maskImage: `radial-gradient(circle ${9.3786 * state.unit}px at 12.398373984% 13.034188034%, transparent 92%, black 100%)`, WebkitMaskImage: `radial-gradient(circle ${9.3786 * state.unit}px at 12.398373984% 13.034188034%, transparent 92%, black 100%)`, pointerEvents: "none" } as FormatDetailsPrivate_DetailStyle} /> }) as FormatDetailsPrivate_NativeLayer }
export function withFormatFanCard01(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_fanCard(Component, 0) }
export function withFormatFanCard02(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_fanCard(Component, 1) }
export function withFormatFanCard03(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_fanCard(Component, 2) }
export function withFormatFanCard04(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_fanCard(Component, 3) }
export function withFormatFanCard05(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_fanCard(Component, 4) }
export function withFormatFanCard06(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_fanCard(Component, 5) }
export function withFormatSpecialPunch(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => <Component {...props} ref={ref} style={{ ...props.style, maskImage: "radial-gradient(circle closest-side, transparent 73.70030581%, black 73.71%)", WebkitMaskImage: "radial-gradient(circle closest-side, transparent 73.70030581%, black 73.71%)", pointerEvents: "none" }} />) as FormatDetailsPrivate_NativeLayer }

const FormatDetailsPrivate_FAN_POLYGONS = [
    "polygon(73.053837426% 0.000000000%,0.000000000% 0.000000000%,0.000000000% 21.543201921%,0.000000000% 51.298616403%,0.000000000% 100.000000000%,73.053837426% 100.000000000%,73.053837426% 51.298616403%,100.000000000% 51.298616403%,100.000000000% 21.543201921%,100.000000000% 0.000000000%,73.053837426% 0.000000000%)",
    "polygon(27.218530369% 0.000000000%,0.000000000% 0.000000000%,0.000000000% 21.543141567%,0.000000000% 51.298752842%,27.218530369% 51.298752842%,27.218530369% 100.000000000%,100.000000000% 100.000000000%,100.000000000% 0.000000000%,27.218530369% 0.000000000%)",
    "polygon(0.000000000% 21.543104934%,0.000000000% 100.000000000%,41.983453431% 100.000000000%,100.000000000% 100.000000000%,100.000000000% 0.000000000%,41.983453431% 0.000000000%,0.000000000% 21.543104934%)",
    "polygon(0.000000000% 0.000000000%,0.000000000% 100.000000000%,57.942042461% 100.000000000%,100.000000000% 100.000000000%,100.000000000% 21.543094875%,57.942042461% 0.000000000%,0.000000000% 0.000000000%)",
    "polygon(0.000000000% 0.000000000%,0.000000000% 100.000000000%,57.941951304% 100.000000000%,100.000000000% 100.000000000%,100.000000000% 21.543141567%,57.941951304% 0.000000000%,0.000000000% 0.000000000%)",
    "polygon(0.000000000% 21.543141567%,0.000000000% 100.000000000%,42.058485716% 100.000000000%,100.000000000% 100.000000000%,100.000000000% 0.000000000%,42.058485716% 0.000000000%,0.000000000% 21.543141567%)",
    "polygon(0.000000000% 0.000000000%,0.000000000% 100.000000000%,42.058160980% 100.000000000%,100.000000000% 100.000000000%,100.000000000% 0.000000000%,42.058160980% 0.000000000%,0.000000000% 0.000000000%)",
    "polygon(0.000000000% 0.000000000%,0.000000000% 100.000000000%,100.000000000% 100.000000000%,100.000000000% 40.510824346%,49.585629007% 0.000000000%,0.000000000% 0.000000000%)",
    "polygon(0.000000000% 0.000000000%,0.000000000% 100.000000000%,100.000000000% 100.000000000%,34.837516901% 0.000000000%,0.000000000% 0.000000000%)",
    "polygon(0.000000000% 21.551356495%,0.000000000% 78.448736926%,41.983544587% 100.000000000%,100.000000000% 100.000000000%,100.000000000% 0.000000000%,41.983544587% 0.000000000%,0.000000000% 21.551356495%)",
    "polygon(0.000000000% 0.000000000%,0.000000000% 100.000000000%,57.942042461% 100.000000000%,100.000000000% 78.448310089%,100.000000000% 21.551362938%,57.942042461% 0.000000000%,0.000000000% 0.000000000%)",
    "polygon(0.000000000% 21.551428815%,0.000000000% 100.000000000%,42.058231010% 100.000000000%,100.000000000% 100.000000000%,100.000000000% 0.000000000%,42.058231010% 0.000000000%,0.000000000% 21.551428815%)",
    "polygon(100.000000000% 0.000000000%,0.000000000% 0.000000000%,0.000000000% 100.000000000%,100.000000000% 100.000000000%,100.000000000% 0.000000000%)",
    "polygon(100.000000000% 0.000000000%,0.000000000% 0.000000000%,0.000000000% 100.000000000%,100.000000000% 100.000000000%,100.000000000% 0.000000000%)"
] as const
export function withFormatFanShape(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => { const own = React.useRef<HTMLElement | null>(null), [index, setIndex] = React.useState<number | null>(null); FormatDetailsPrivate_useOwnLayoutEffect(() => { const match = own.current?.id.match(/^format-fan-shape-(\d+)$/); if (match && Number(match[1]) < FormatDetailsPrivate_FAN_POLYGONS.length) setIndex(Number(match[1])) }, []); const clipPath = index === null ? undefined : FormatDetailsPrivate_FAN_POLYGONS[index]; return <Component {...props} ref={(node: HTMLElement | null) => { own.current = node; FormatDetailsPrivate_writeRef(ref, node) }} data-format-fan-shape={index} style={{ ...props.style, clipPath, WebkitClipPath: clipPath, pointerEvents: "none" }} /> }) as FormatDetailsPrivate_NativeLayer }
const FormatDetailsPrivate_SevenGroundContext = React.createContext({ height: 1701, drift: 0 })
export function withFormatSevenGround(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const state = React.useContext(FormatDetailsPrivate_SourceLayoutContext), frozen = FormatDetailsPrivate_frozenTarget(), reduced = FormatDetailsPrivate_useReducedMotion(), own = React.useRef<HTMLElement | null>(null), [geometry, setGeometry] = React.useState({ x: 0, y: 3740, width: 1440, height: 1701, clip: "none", drift: 0 })
        FormatDetailsPrivate_useOwnLayoutEffect(() => { if (state.phone || frozen) return; let frame = 0; const read = () => { frame = 0; const l = state.layout, u = l.unit, y = window.scrollY, start = l.group + 2646 * u - state.height, end = l.deck + 213 * u - state.height / 2, p = reduced ? 0 : Math.max(0, Math.min(1, (y - start) / Math.max(1, end - start))), eased = p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2, imageH = Math.round(99.586212 * u), step = imageH + Math.round(5 * u), period = step * 7, offset = Math.round(290 * u) + (Math.round(163.171875 * u) - 3 * step - Math.round(290 * u)) * eased - Math.max(0, y - end) * .18, slot = ((offset + 4 * step) % period + period) % period - step, destX = state.width / 2 - 167.5 * u + Math.round(128 * u), destY = l.deck + slot, originY = l.group + 945 * u, height = 1701 * u + (imageH - 1701 * u) * eased, top = originY + (destY - originY) * eased, width = state.width + (Math.round(78.913185 * u) - state.width) * eased, clip = p === 1 ? `inset(${Math.max(0, l.deck - top)}px 0px ${Math.max(0, top + height - l.deck - 426 * u)}px 0px)` : "none", progress = reduced ? .5 : Math.max(0, Math.min(1, (y - (start - (2646 * u + state.height) + 2646 * u)) / (2646 * u + state.height))), travel = 70 / 1701 * height; setGeometry({ x: destX * eased, y: top, width, height, clip, drift: -travel + travel * 2 * progress }) }, schedule = () => { if (!frame) frame = requestAnimationFrame(read) }; read(); if (!reduced) window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule); return () => { if (frame) cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule) } }, [state.width, state.height, state.phone, frozen, reduced])
        const style: React.CSSProperties | undefined = state.phone ? props.style : frozen ? { ...props.style, position: "absolute", left: 0, top: state.layout.group + 945 * state.layout.unit, width: state.width, height: 1701 * state.layout.unit, overflow: "hidden", pointerEvents: "none" } : { ...props.style, position: "absolute", left: geometry.x, top: geometry.y, width: geometry.width, height: geometry.height, clipPath: geometry.clip, overflow: "hidden", pointerEvents: "none" }
        return <FormatDetailsPrivate_SevenGroundContext.Provider value={{ height: state.phone || frozen ? 1701 : geometry.height, drift: geometry.drift }}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; FormatDetailsPrivate_writeRef(ref, node) }} data-format-seven-ground="true" style={style} /></FormatDetailsPrivate_SevenGroundContext.Provider>
    }) as FormatDetailsPrivate_NativeLayer
}
export function withFormatSevenImage(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => { const state = React.useContext(FormatDetailsPrivate_SevenGroundContext), extra = state.height * 140 / 1701; return <Component {...props} ref={ref} style={{ ...props.style, width: "100%", top: state.drift, height: state.height + extra, pointerEvents: "none" }} /> }) as FormatDetailsPrivate_NativeLayer }

export function withFormatCutHardLight(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => <Component {...props} ref={ref} style={{ ...props.style, mixBlendMode: "hard-light" }} />) as FormatDetailsPrivate_NativeLayer }

/** FORMAT's same native poster carries into the inner field. Independent public
 * own-ref geometry/controller; no source behavior JS, bitmap poster or reparent.
 * Physics integrates source-scale gravity at60Hz and paints at30Hz. Collision
 * trajectories are independently fitted, not claimed byte-equivalent to Matter.
 */
/** Native glyphs share the closing world's one owned RAF. Source-supported
 * radial exclusion/attraction is integrated at60Hz and painted at30Hz;
 * the stable target can sleep instead of running an idle ticker forever. */
type FormatDetailsPrivate_FormatMagnetGlyph = { node: HTMLElement; x: number; y: number; vx: number; vy: number; turn: number }
type FormatDetailsPrivate_FormatMagnetGeometry = { p: HTMLElement; pr: DOMRect; top: number; unit: number; visual: number }
const FormatDetailsPrivate_FORMAT_MAGNET_STYLE = `[data-format-magnet-owned="1"]{translate:var(--source-format-magnet-x) var(--source-format-magnet-y)!important;rotate:var(--source-format-magnet-turn)!important;transform-origin:50% 50%!important}[data-format-pip-owned="1"]{left:var(--source-format-pip-left)!important;top:var(--source-format-pip-top)!important;width:var(--source-format-pip-size)!important;height:var(--source-format-pip-size)!important;rotate:var(--source-format-pip-turn)!important;visibility:var(--source-format-pip-visibility)!important;transform-origin:50% 50%!important}[data-format-pip-endpoint-owned="1"]{opacity:var(--source-format-pip-endpoint-opacity)!important;pointer-events:none!important}`
const FormatDetailsPrivate_FORMAT_MAGNET_PATH: readonly (readonly [number, number])[] = [[-900,720],[-780,716],[-650,700],[-500,655],[-350,585],[-200,490],[-60,390],[60,322],[190,318],[340,400],[430,500],[520,640],[610,810],[700,920],[790,1030],[880,1105],[980,1160],[1100,1205],[1240,1238],[1429.12,1252.5]]
function FormatDetailsPrivate_formatMagnetX(y: number) { let before = FormatDetailsPrivate_FORMAT_MAGNET_PATH[0]; for (const after of FormatDetailsPrivate_FORMAT_MAGNET_PATH.slice(1)) { if (y <= after[0]) { const mix = Math.max(0, Math.min(1, (y - before[0]) / (after[0] - before[0]))); return before[1] + (after[1] - before[1]) * mix }; before = after }; return before[1] }
function FormatDetailsPrivate_formatMagnetSupport(radius: number, halfW: number, halfH: number, nx: number, ny: number, turn: number) { const c = Math.abs(Math.cos(turn * Math.PI / 180)), s = Math.abs(Math.sin(turn * Math.PI / 180)); return radius + Math.abs(nx) * (halfW * c + halfH * s) + Math.abs(ny) * (halfW * s + halfH * c) }
function FormatDetailsPrivate_stepFormatMagnetGlyph(glyph: FormatDetailsPrivate_FormatMagnetGlyph, rest: { x: number; y: number; halfW: number; halfH: number }, magnet: { x: number; y: number; radius: number } | null) {
    let targetX = 0, targetY = 0, targetTurn = 0
    if (magnet) {
        const dx = rest.x - magnet.x, dy = rest.y - magnet.y, distance = Math.hypot(dx, dy), nx = distance > .0001 ? dx / distance : 1, ny = distance > .0001 ? dy / distance : 0, support = FormatDetailsPrivate_formatMagnetSupport(magnet.radius, rest.halfW, rest.halfH, nx, ny, glyph.turn), range = magnet.radius * 1.75
        let strength = 0
        if (distance < support) { targetX = magnet.x + nx * support - rest.x; targetY = magnet.y + ny * support - rest.y; strength = 1 }
        else if (distance < range) { strength = 1 - (distance - support) / Math.max(1, range - support); const pull = (distance - support) * .22 * strength; targetX = -nx * pull; targetY = -ny * pull }
        // A tangent direction, wrapped to±90°. The source's34 normalization
        // cancels at full strength; it is not a34-degree clamp.
        targetTurn = (((Math.atan2(dy, dx) * 180 / Math.PI + 180) % 180 + 180) % 180 - 90) * strength
    }
    glyph.vx = (glyph.vx + (targetX - glyph.x) * .09) * .85; glyph.vy = (glyph.vy + (targetY - glyph.y) * .09) * .85
    glyph.x += glyph.vx; glyph.y += glyph.vy; glyph.turn += (targetTurn - glyph.turn) * .18
    if (magnet) {
        const dx = rest.x + glyph.x - magnet.x, dy = rest.y + glyph.y - magnet.y, distance = Math.hypot(dx, dy), nx = distance > .0001 ? dx / distance : 1, ny = distance > .0001 ? dy / distance : 0, support = FormatDetailsPrivate_formatMagnetSupport(magnet.radius, rest.halfW, rest.halfH, nx, ny, glyph.turn)
        if (distance < support) { glyph.x = magnet.x + nx * support - rest.x; glyph.y = magnet.y + ny * support - rest.y; glyph.vx *= .5; glyph.vy *= .5 }
    }
    const moving = Math.abs(targetX - glyph.x) + Math.abs(targetY - glyph.y) + Math.abs(targetTurn - glyph.turn) + Math.abs(glyph.vx) + Math.abs(glyph.vy) > .01
    if (!magnet && !moving) glyph.x = glyph.y = glyph.vx = glyph.vy = glyph.turn = 0
    return moving
}
function FormatDetailsPrivate_createFormatPosterMagnet() {
    const glyphs = new Map<number, FormatDetailsPrivate_FormatMagnetGlyph>(); let pip: HTMLElement | null = null, endpoint: HTMLElement | null = null, flight: HTMLElement | null = null, previous = 0, accumulated = 0, frames = 0, motionPending = true
    const set = (node: HTMLElement, key: string, value: string) => { if (node.style.getPropertyValue(key) !== value) node.style.setProperty(key, value) }
    const flag = (node: HTMLElement, key: string) => { if (node.getAttribute(key) !== "1") node.setAttribute(key, "1") }
    const clear = (node: HTMLElement, attribute: string, keys: readonly string[]) => { node.removeAttribute(attribute); for (const key of keys) node.style.removeProperty(key) }
    const glyphKeys = ["--source-format-magnet-x", "--source-format-magnet-y", "--source-format-magnet-turn"]
    const pipKeys = ["--source-format-pip-left", "--source-format-pip-top", "--source-format-pip-size", "--source-format-pip-turn", "--source-format-pip-visibility", "--source-format-pip-color"]
    const clearGlyph = (glyph: FormatDetailsPrivate_FormatMagnetGlyph) => clear(glyph.node, "data-format-magnet-owned", glyphKeys)
    const pause = () => { previous = 0; accumulated = 0; motionPending = true }
    const reset = () => { pause(); for (const glyph of glyphs.values()) { glyph.x = glyph.y = glyph.vx = glyph.vy = glyph.turn = 0; clearGlyph(glyph) }; if (pip) clear(pip, "data-format-pip-owned", pipKeys); if (endpoint) clear(endpoint, "data-format-pip-endpoint-owned", ["--source-format-pip-endpoint-opacity"]) }
    const registerGlyph = (index: number, node: HTMLElement) => { if (index < 0 || index >= 86) throw Error("FORMAT magnet glyph index outside86 native parts"); const old = glyphs.get(index); if (old) clearGlyph(old); const value = { node, x: 0, y: 0, vx: 0, vy: 0, turn: 0 }; glyphs.set(index, value); pause(); return () => { clearGlyph(value); if (glyphs.get(index) === value) glyphs.delete(index); pause() } }
    const registerPip = (node: HTMLElement) => { if (pip && pip !== node) clear(pip, "data-format-pip-owned", pipKeys); pip = node; pause(); return () => { clear(node, "data-format-pip-owned", pipKeys); if (pip === node) pip = null; pause() } }
    const registerEndpoint = (node: HTMLElement) => { if (endpoint && endpoint !== node) clear(endpoint, "data-format-pip-endpoint-owned", ["--source-format-pip-endpoint-opacity"]); endpoint = node; pause(); return () => { clear(node, "data-format-pip-endpoint-owned", ["--source-format-pip-endpoint-opacity"]); if (endpoint === node) endpoint = null; pause() } }
    const registerFlight = (node: HTMLElement) => { flight = node; pause(); return () => { if (flight === node) flight = null; pause() } }
    const paint = (now: number, integrate: boolean, g: FormatDetailsPrivate_FormatMagnetGeometry, enabled: boolean) => {
        if (!enabled || glyphs.size !== 86 || !pip?.isConnected || !endpoint?.isConnected) { reset(); return false }
        const u = g.unit, viewport = window.innerHeight, y = window.scrollY, axis = g.top - 837.5 * u, ending = g.top + 1429.12 * u, start = axis - viewport / 2, phase = Math.max(0, Math.min(1, (y - start) / Math.max(1, ending - axis))), sourceY = Math.min(ending, y + viewport / 2), sourceX = FormatDetailsPrivate_formatMagnetX((sourceY - g.top) / Math.max(.001, u)), diameter = 20 + 315 * (1 - (1 - phase) ** 3), circle = { x: g.pr.left + sourceX * u, y: sourceY, radius: diameter * u / 2 }, complete = phase >= 1
        const parent = pip.offsetParent as HTMLElement | null, parentRect = parent?.getBoundingClientRect(), parentScale = parent && parentRect ? parentRect.width / Math.max(1, parent.offsetWidth) : 0
        if (!parent || !parentRect || parentScale <= 0 || g.visual <= 0) { pause(); return false }
        // Read all native rest boxes before writing any owned variables. CSS
        // translate/rotate never change offsetLeft/Top or recapture a live pose.
        const restRows = Array.from(glyphs.values()).map(glyph => { let x = 0, y = 0, node: HTMLElement | null = glyph.node; for (; node && node !== g.p; node = node.offsetParent as HTMLElement | null) { x += node.offsetLeft; y += node.offsetTop }; return { glyph, inside: node === g.p, rest: { x: g.pr.left + (x + glyph.node.offsetWidth / 2) * g.visual, y: g.top + (y + glyph.node.offsetHeight / 2) * g.visual, halfW: glyph.node.offsetWidth * g.visual / 2, halfH: glyph.node.offsetHeight * g.visual / 2 } } })
        if (restRows.some(row => !row.inside || !row.glyph.node.isConnected)) { reset(); return false }
        const early = flight?.isConnected ? FormatDetailsPrivate_formatEarlyPipPose(y, viewport, u, g.top, g.pr.left) : null
        const ownsTravel = y >= start, size = (ownsTravel ? diameter : 20) * 41 / 20 * u / parentScale * (early?.scale ?? 1), centerX = early?.x ?? (ownsTravel ? circle.x : g.pr.left + 720 * u), centerY = early?.y ?? (ownsTravel ? circle.y : axis)
        set(pip, "--source-format-pip-left", ((centerX - parentRect.left) / parentScale - size / 2 - parent.clientLeft) + "px"); set(pip, "--source-format-pip-top", ((centerY - y - parentRect.top) / parentScale - size / 2 - parent.clientTop) + "px"); set(pip, "--source-format-pip-size", size + "px"); set(pip, "--source-format-pip-turn", (early?.turn ?? 0) + "deg"); set(pip, "--source-format-pip-visibility", complete ? "hidden" : "visible"); set(pip, "--source-format-pip-color", early?.color ?? "#ffffff"); flag(pip, "data-format-pip-owned")
        set(endpoint, "--source-format-pip-endpoint-opacity", complete ? "1" : "0"); flag(endpoint, "data-format-pip-endpoint-owned")
        const onScreen = g.pr.bottom > 0 && g.pr.top < viewport || ownsTravel && !complete && circle.y - y + circle.radius > 0 && circle.y - y - circle.radius < viewport
        if (!onScreen) { pause(); return false }
        if (integrate) accumulated += previous ? Math.min(100, Math.max(0, now - previous)) : 1000 / 30
        previous = now; let moving = motionPending, steps = 0
        while (accumulated >= 1000 / 60) { accumulated -= 1000 / 60; steps++; moving = false; for (const row of restRows) moving = FormatDetailsPrivate_stepFormatMagnetGlyph(row.glyph, row.rest, ownsTravel && !complete ? circle : null) || moving }
        if (steps) motionPending = moving
        for (const { glyph } of restRows) { if (glyph.x || glyph.y || glyph.turn) { set(glyph.node, "--source-format-magnet-x", glyph.x / g.visual + "px"); set(glyph.node, "--source-format-magnet-y", glyph.y / g.visual + "px"); set(glyph.node, "--source-format-magnet-turn", glyph.turn + "deg"); flag(glyph.node, "data-format-magnet-owned") } else clearGlyph(glyph) }
        frames++; g.p.setAttribute("data-format-magnet-glyph-count", String(glyphs.size)); g.p.setAttribute("data-format-magnet-phase", String(phase)); g.p.setAttribute("data-format-magnet-frames", String(frames))
        return moving
    }
    return { paint, pause, reset, registerGlyph, registerPip, registerEndpoint, registerFlight, nodes: () => [...Array.from(glyphs.values(), value => value.node), ...[pip, endpoint, flight].filter((node): node is HTMLElement => node !== null)], dispose: () => { reset(); glyphs.clear(); pip = endpoint = flight = null }, debug: () => ({ glyphs: glyphs.size, hasPip: Boolean(pip), hasEndpoint: Boolean(endpoint), frames }) }
}

type FormatDetailsPrivate_ClosingRegistration = { node: HTMLElement; transform: string; width: string; left: string; top: string; height: string; origin: string; background: string; outline: string; z: string; pointer: string }
type FormatDetailsPrivate_ClosingBody = FormatDetailsPrivate_FormatCollisionBody
type FormatDetailsPrivate_ClosingConfig = { frozen: boolean; reduced: boolean; phone: boolean; root: HTMLElement | null }
function FormatDetailsPrivate_createFormatClosingWorld() {
    const magnet = FormatDetailsPrivate_createFormatPosterMagnet()
    let poster: FormatDetailsPrivate_ClosingRegistration | null = null, field: FormatDetailsPrivate_ClosingRegistration | null = null, config: FormatDetailsPrivate_ClosingConfig = { frozen: true, reduced: false, phone: false, root: null }, frame = 0, previous = 0, painted = 0, accumulator = 0, body: FormatDetailsPrivate_ClosingBody | null = null, lastCenter = 0, held = false, attached = false
    let chips: FormatDetailsPrivate_FormatChipBody[] = [], sequence = 0, played = false, chipAccumulator = 0, chipPrevious = 0, lastFieldWidth = 0, lastFieldHeight = 0, lastScroll = 0, lastScrollTime = 0, fastScroll = false
    const slots = new Map<number,{node:HTMLElement}>(), chipListeners = new Set<()=>void>(), promptListeners = new Set<()=>void>(), listeners = new Set<() => void>(), clamp = (x: number) => Math.max(0, Math.min(1, x)), ease = (x: number) => x < .5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x)
    const stopped = () => !config.root || config.frozen || config.reduced || typeof document !== "undefined" && document.hidden
    const save = (node: HTMLElement, style: React.CSSProperties): FormatDetailsPrivate_ClosingRegistration => { const css = (key: keyof React.CSSProperties, fallback: string, unit = "px") => typeof style[key] === "number" ? style[key] + unit : String(style[key] ?? fallback); return { node, transform: css("transform", "", ""), width: css("width", node.style.width), left: css("left", node.style.left), top: css("top", node.style.top), height: css("height", node.style.height), origin: css("transformOrigin", node.style.transformOrigin, ""), background: css("backgroundColor", node.style.backgroundColor, ""), outline: css("outline", node.style.outline, ""), z: css("zIndex", node.style.zIndex, ""), pointer: css("pointerEvents", node.style.pointerEvents, "") } }
    const restore = (r: FormatDetailsPrivate_ClosingRegistration) => { const s = r.node.style; s.transform = r.transform; s.width = r.width; s.left = r.left; s.top = r.top; s.height = r.height; s.transformOrigin = r.origin; s.backgroundColor = r.background; s.outline = r.outline; s.zIndex = r.z; s.pointerEvents = r.pointer }
    const restoreDecoration = (node: HTMLElement, style: React.CSSProperties = {}) => {
        const s = node.style
        s.backgroundColor = ""
        if (style.background !== undefined) s.background = String(style.background)
        if (style.backgroundColor !== undefined) s.backgroundColor = String(style.backgroundColor)
        s.zIndex = String(style.zIndex ?? ""); s.outline = String(style.outline ?? "")
        for (const key of ["outlineColor", "outlineStyle", "outlineWidth"] as const) if (style[key] !== undefined) s[key] = typeof style[key] === "number" ? style[key] + "px" : String(style[key])
    }
    const setHeld = (value: boolean) => { if (held !== value) { held = value; listeners.forEach(fn => fn()) } }
    const cancel = () => { if (frame) cancelAnimationFrame(frame); frame = 0; previous = 0; painted = 0; accumulator = 0; chipPrevious=0; chipAccumulator=0; magnet.pause() }
    const geometry = () => {
        if (!poster || !field) return null
        const p = poster.node, f = field.node, ownerRect = config.root?.getBoundingClientRect()
        if(ownerRect&&(ownerRect.width<=0||ownerRect.height<=0))return null
        // Temporarily restore only our own transforms, before the same-frame paint.
        // This measures the real untransformed native boxes without feedback.
        p.style.transform = poster.transform
        p.style.transformOrigin = poster.origin
        f.style.left = field.left; f.style.top = field.top; f.style.height = field.height
        const ownerScale = ownerRect && config.root ? ownerRect.width / Math.max(1, config.root.offsetWidth) : 1, ownerLeft = ownerRect?.left ?? 0
        const unit = config.phone ? p.getBoundingClientRect().width / 1440 : window.innerWidth / 1440 * ownerScale
        if (!config.phone) {
            p.style.width = document.documentElement.clientWidth * ownerScale / Math.max(.001, unit) + "px"
            const old = f.getBoundingClientRect(), logical = f.offsetWidth, ratio = logical > 0 ? old.width / logical : unit
            const parent = f.parentElement?.getBoundingClientRect()
            f.style.left = (parseFloat(field.left) || 0) + (ownerLeft + (document.documentElement.clientWidth * ownerScale - old.width) / 2 - old.left) / Math.max(.001, ratio) + "px"
            if (parent) f.style.top = (parseFloat(field.top) || 0) + (parent.top - old.top) / Math.max(.001, ratio) + "px"
            f.style.height = (window.innerHeight * 1.43 * ownerScale - 40 * unit) / Math.max(.001, ratio) + "px"
        }
        const pr = p.getBoundingClientRect(), fr = f.getBoundingClientRect();if(pr.width<=0||pr.height<=0||fr.width<=0||fr.height<=0)return null;const visual = pr.width / Math.max(1, p.offsetWidth)
        return { p, f, pr, fr, unit, visual, ownerScale, sourceCenterX: ownerLeft + window.innerWidth / 2 * ownerScale, top: Math.round(pr.top + window.scrollY), fieldTop: Math.round(fr.top + window.scrollY), fieldWidth: Math.round(fr.width), physicalWidth: window.innerWidth * ownerScale * 250 / 1440, height: pr.height * 250 / 1440 }
    }
    const paint = (now: number, integrate: boolean) => {
        if (!poster || !field) return false
        if (stopped()) { magnet.reset(); restore(poster); restore(field); body = null; setHeld(false); return false }
        const g = geometry(); if (!g) { magnet.pause(); return false }
        const magnetMoving = magnet.paint(now, integrate, g, !config.phone)
        fastScroll=lastScrollTime>0&&Math.abs(window.scrollY-lastScroll)*1000/Math.max(4,now-lastScrollTime)/Math.max(1,window.innerHeight)>.15;lastScroll=window.scrollY;lastScrollTime=now
        const { p, pr, fr, unit, visual } = g, start = g.top + 1429.12 * unit - window.innerHeight / 2 + .02 * window.innerHeight, end = Math.max(start + 1, g.fieldTop - .45 * window.innerHeight), progress = clamp((window.scrollY - start) / (end - start)), scale = 1 + (250 / 1440 - 1) * ease(clamp(progress / .75)), follow = ease(clamp(progress / .35)), targetY = (1 - ease(progress)) * window.innerHeight / 2 + ease(progress) * (.45 * window.innerHeight + 100 * unit + pr.height / 2 * 250 / 1440), ordinaryY = pr.top + pr.height / 2, xOffset = progress * (fr.left + g.fieldWidth / 2 - g.sourceCenterX)
        const paintBiasX = pr.left + pr.width / 2 - g.sourceCenterX
        let centerX = pr.left + pr.width / 2 + xOffset, centerY = ordinaryY + (targetY - ordinaryY) * follow, angle = 0
        if (progress >= 1 && !body) body = { x: g.fieldWidth / 2, y: 100 * unit + pr.height / 2 * 250 / 1440, vx: 0, vy: Math.max(0, Math.min(40, centerY - lastCenter)), angle: 0, angular: .008, quiet: 0, width: g.physicalWidth, height: g.height, shape: "rectangle", restitution: .1, friction: .6 }
        if (body) {
            if (progress <= 0) body = null
            else if (progress < .97) {
                const targetX = centerX - paintBiasX - fr.left, target = centerY - fr.top, dx = targetX - body.x, dy = target - body.y, distance = Math.hypot(dx, dy), max = 45 + Math.abs(centerY - lastCenter), amount = Math.min(1, max / Math.max(1, distance))
                body.vx = dx * amount; body.vy = dy * amount; body.angular = 0
                if (integrate) { body.x += body.vx; body.y += body.vy; body.angle *= .75 }
                if (distance < 8 && Math.abs(body.angle) < .02) body = null
            } else if (integrate) {
                const dt = previous ? Math.min(100, Math.max(0, now - previous)) : 1000 / 30
                accumulator += dt
                while (accumulator >= 1000 / 60) {
                    accumulator -= 1000 / 60
                    const b = body; b.vx *= .97; b.vy = b.vy * .97 + 1.8 * .001 * (1000 / 60) ** 2 * g.ownerScale; b.x += b.vx; b.y += b.vy; b.angle += b.angular; b.angular *= .97
                    const halfW = Math.abs(Math.cos(b.angle)) * g.physicalWidth / 2 + Math.abs(Math.sin(b.angle)) * g.height / 2, halfH = Math.abs(Math.sin(b.angle)) * g.physicalWidth / 2 + Math.abs(Math.cos(b.angle)) * g.height / 2
                    if (b.x < halfW) { b.x = halfW; b.vx = Math.abs(b.vx) * .1 }
                    if (b.x > fr.width - halfW) { b.x = Math.max(halfW, fr.width - halfW); b.vx = -Math.abs(b.vx) * .1 }
                    if (b.y > fr.height - halfH) { b.y = fr.height - halfH; b.vy = -Math.abs(b.vy) * .1; b.vx *= .6; b.angular *= .6; const beforeAngle=b.angle,nextAngle=b.angle*.8,side=beforeAngle<0?-1:1,corner=(a:number)=>side*g.physicalWidth/2*Math.cos(a)-g.height/2*Math.sin(a);b.x+=corner(beforeAngle)-corner(nextAngle);b.angle=nextAngle; if (Math.abs(b.vy) < .1) b.vy = 0; b.quiet = Math.abs(b.vx) + Math.abs(b.vy) + Math.abs(b.angular) < .02 ? b.quiet + 1 : 0 }
                }
            }
            if (body) { centerX = fr.left + body.x + paintBiasX; centerY = fr.top + body.y; angle = body.angle }
        }
        simulateChips(g, now, integrate)
        lastCenter = centerY; previous = now; setHeld(progress > 0 || body !== null)
        if (!held) { restore(poster); if (!config.phone) p.style.width = document.documentElement.clientWidth * g.ownerScale / Math.max(.001, unit) + "px" }
        else {
            const tx = (centerX - pr.left) / Math.max(.001, visual), ty = (centerY - pr.top) / Math.max(.001, visual)
            p.style.transformOrigin = "0 0"; p.style.transform = (poster.transform === "none" ? "" : poster.transform) + ` translate(${tx}px,${ty}px) rotate(${angle}rad) scale(${scale}) translate(${-p.offsetWidth / 2}px,${-p.offsetHeight / 2}px)`
            p.style.backgroundColor = "#222222"; p.style.zIndex = "2"; p.style.pointerEvents = poster.pointer; p.style.outline = `${clamp(progress / .5) / Math.max(.001, visual * scale)}px solid white`
        }
        p.setAttribute("data-format-carried-progress", String(progress)); p.setAttribute("data-format-carried-state", body ? progress < .97 ? "returning" : "falling" : held ? "carried" : "original"); p.setAttribute("data-format-carried-children", String(p.children.length))
        return magnetMoving || Boolean(body && body.quiet < 30 && (fr.bottom > 0 && fr.top < window.innerHeight || centerY + g.height / 2 > 0 && centerY - g.height / 2 < window.innerHeight) || g.fr.bottom>0&&g.fr.top<window.innerHeight&&chips.some(b=>b.quiet<30))
    }
    const tick = (now: number) => { frame = 0; if (stopped()) return; if (now - painted >= 1000 / 30) { painted = now; if (paint(now, true)) frame = requestAnimationFrame(tick); else { previous=0;accumulator=0;magnet.pause() } } else frame = requestAnimationFrame(tick) }
    const schedule = () => { if (!stopped() && !frame) frame = requestAnimationFrame(tick) }
    const changed = () => { cancel(); if (config.phone) magnet.reset(); if (config.frozen || config.reduced) { magnet.reset(); if (poster) { restore(poster); poster.node.setAttribute("data-format-carried-progress", "0"); poster.node.setAttribute("data-format-carried-state", "original") } if (field) restore(field); body = null; chips=[]; if(field)field.node.setAttribute("data-format-chip-count","0");if(config.frozen&&played){played=false;promptListeners.forEach(fn=>fn())}chipListeners.forEach(fn=>fn()); paintSlots(); setHeld(false) } else if (!stopped()) { paint(performance.now(), false); schedule() } }
    let observer: ResizeObserver | null = null
    const detach = () => { observer?.disconnect(); observer=null;if(attached){window.removeEventListener("scroll",schedule);window.removeEventListener("resize",changed);document.removeEventListener("visibilitychange",changed)}attached=false }
    const attach = () => { if (attached || typeof window === "undefined" || config.frozen || config.reduced || !poster || !field) return; attached = true; window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", changed); document.addEventListener("visibilitychange", changed); observer = new ResizeObserver(changed); if (poster) observer.observe(poster.node); if (field) observer.observe(field.node); for (const node of magnet.nodes()) observer.observe(node) }
    const register = (role: "poster" | "field", node: HTMLElement, style: React.CSSProperties, currentStyle?: () => React.CSSProperties | undefined) => { const authored: React.CSSProperties = { ...style }; for (const key of ["width", "height", "left", "top", "transform", "transformOrigin"] as const) if (authored[key] === undefined) authored[key] = ""; const value = save(node, authored); restore(value); if (role === "poster") poster = value; else field = value; attach(); observer?.observe(node); changed(); return () => { observer?.unobserve(node); /* React has already committed the next caller style; never restore stale breakpoint declarations here. */ if (role === "poster") restoreDecoration(node, currentStyle?.()); if (role === "poster" && poster === value) { poster = null; body = null; setHeld(false) } if (role === "field" && field === value) field = null;if(!poster||!field)detach(); cancel() } }
    const slotPose = (index: number, knownRatio?:number): FormatDetailsPrivate_DetailStyle => {
        const chip = chips.find(b => b.slot === index), binding = FormatDetailsPrivate_formatChipVariantRuntime()
        if (!chip || !field || !binding || binding.values.length !== 21) return { opacity: 0, pointerEvents: "none" }
        const ratio = knownRatio ?? field.node.getBoundingClientRect().width / Math.max(1, field.node.offsetWidth)
        return { position: "absolute", left: (chip.x - chip.width / 2) / Math.max(.001, ratio) - field.node.clientLeft, top: (chip.y - chip.height / 2) / Math.max(.001, ratio) - field.node.clientTop, width: chip.width / Math.max(.001, ratio), height: chip.height / Math.max(.001, ratio), rotate: `${chip.angle}rad`, transformOrigin: "50% 50%", opacity: 1, pointerEvents: "none" }
    }
    const paintSlots = () => { const ratio=field?field.node.getBoundingClientRect().width/Math.max(1,field.node.offsetWidth):1;for (const [index, entry] of slots) { const pose = slotPose(index,ratio), s = entry.node.style; s.opacity = String(pose.opacity); s.pointerEvents = "none"; if (pose.opacity === 1) { s.position = "absolute"; s.left = pose.left + "px"; s.top = pose.top + "px"; s.width = pose.width + "px"; s.height = pose.height + "px"; s.setProperty("rotate", String(pose.rotate)); s.transformOrigin = "50% 50%" } entry.node.setAttribute("data-format-chip-template", String(chips.find(b => b.slot === index)?.template ?? -1)) } }
    const simulateChips = (g: NonNullable<ReturnType<typeof geometry>>, now: number, integrate: boolean) => {
        if (lastFieldWidth && (Math.abs(lastFieldWidth-g.fr.width)>.1 || Math.abs(lastFieldHeight-g.fr.height)>.1)) for(const b of chips){const x=g.fr.width/lastFieldWidth,y=g.fr.height/lastFieldHeight;b.x*=x;b.y*=y;b.width*=x;b.height*=y;b.vx*=x;b.vy*=y}
        lastFieldWidth=g.fr.width;lastFieldHeight=g.fr.height
        if(integrate&&chips.length&&(body||g.fr.bottom>0&&g.fr.top<window.innerHeight)){chipAccumulator+=chipPrevious?Math.min(100,Math.max(0,now-chipPrevious)):1000/30;while(chipAccumulator>=1000/60){chipAccumulator-=1000/60;const moving=[...chips,...(body?[body]:[])];for(const b of chips){if(b.quiet>=30)continue;b.vx*=.99;b.vy=b.vy*.99+(fastScroll?-.2:1)*.001*(1000/60)**2*g.ownerScale;b.x+=b.vx;b.y+=b.vy;b.angle+=b.angular;b.angular*=.99;const c=Math.abs(Math.cos(b.angle)),s=Math.abs(Math.sin(b.angle)),halfW=b.shape==="circle"?b.width/2:c*b.width/2+s*b.height/2,halfH=b.shape==="circle"?b.height/2:s*b.width/2+c*b.height/2;if(b.x<halfW){b.x=halfW;b.vx=Math.abs(b.vx)*.15}if(b.x>g.fr.width-halfW){b.x=Math.max(halfW,g.fr.width-halfW);b.vx=-Math.abs(b.vx)*.15}if(b.y>g.fr.height-halfH){b.y=g.fr.height-halfH;b.vy=-Math.abs(b.vy)*.15;b.vx*=.6;b.angular*=.6;if(b.shape!=="circle")b.angle+=(Math.round(b.angle/(Math.PI/2))*Math.PI/2-b.angle)*.2;if(Math.abs(b.vy)<.1)b.vy=0;b.quiet=Math.abs(b.vx)+Math.abs(b.vy)+Math.abs(b.angular)<.02?b.quiet+1:0}}for(let pass=0;pass<2;pass++)for(let i=0;i<moving.length;i++)for(let j=0;j<i;j++)if(moving[i].quiet<30||moving[j].quiet<30)FormatDetailsPrivate_formatResolveContact(moving[i],moving[j]);const removed=chips.filter(b=>b.y<-g.fr.height);if(removed.length){chips=chips.filter(b=>!removed.includes(b));chipListeners.forEach(fn=>fn())}}}
        chipPrevious=now;paintSlots()
    }
    const spawn = (clientX: number, clientY: number) => {
        const binding=FormatDetailsPrivate_formatChipVariantRuntime();if(stopped()||!field||!poster||!binding||binding.values.length!==21||slots.size===0)return
        const g=geometry();if(!g||clientX<g.fr.left||clientX>g.fr.right||clientY<g.fr.top||clientY>g.fr.bottom)return
        const available=Array.from(slots.keys()).sort((a,b)=>a-b),free=available.find(index=>!chips.some(b=>b.slot===index));let slot=free
        if(slot===undefined){const oldest=chips.reduce((a,b)=>a.order<b.order?a:b);slot=oldest.slot;chips=chips.filter(b=>b!==oldest)}
        const template=Math.min(20,Math.floor(Math.random()*21)),[w,h,shape]=FormatDetailsPrivate_FORMAT_CHIP_SIZES[template],width=w/2*g.unit,height=h/2*g.unit
        chips.push({slot,template,order:++sequence,x:clientX-g.fr.left,y:clientY-g.fr.top-height*.35,vx:0,vy:0,angle:(Math.random()-.5)*.4,angular:0,quiet:0,width,height,shape,restitution:.15,friction:.4});if(!played){played=true;promptListeners.forEach(fn=>fn())}chipListeners.forEach(fn=>fn());field.node.setAttribute("data-format-chip-count",String(chips.length));paintSlots();schedule()
    }
    const registerSlot = (index: number,node: HTMLElement) => {if(index<0||index>=30||slots.has(index))throw Error("One owned native chip slot per index");const original={left:node.style.left,top:node.style.top,width:node.style.width,height:node.style.height,opacity:node.style.opacity,rotate:node.style.getPropertyValue("rotate"),pointer:node.style.pointerEvents};slots.set(index,{node});paintSlots();return()=>{slots.delete(index);chips=chips.filter(b=>b.slot!==index);const s=node.style;s.left=original.left;s.top=original.top;s.width=original.width;s.height=original.height;s.opacity=original.opacity;s.setProperty("rotate",original.rotate);s.pointerEvents=original.pointer;chipListeners.forEach(fn=>fn())}}

    const registerMagnet = (role: "glyph" | "pip" | "endpoint" | "flight", node: HTMLElement, index = -1) => { const remove = role === "glyph" ? magnet.registerGlyph(index, node) : role === "pip" ? magnet.registerPip(node) : role === "flight" ? magnet.registerFlight(node) : magnet.registerEndpoint(node); observer?.observe(node); changed(); return () => { observer?.unobserve(node); remove(); schedule() } }
    return { registerMagnet, magnetDebug: magnet.debug, register, registerSlot, slotPose, spawn, canInput:()=>!stopped(), subscribeChips:(notify:()=>void)=>{chipListeners.add(notify);return()=>{chipListeners.delete(notify)}}, getTemplate:(index:number)=>chips.find(b=>b.slot===index)?.template??-1, subscribePrompts:(notify:()=>void)=>{promptListeners.add(notify);return()=>{promptListeners.delete(notify)}}, getPlayed:()=>played, configure: (next: FormatDetailsPrivate_ClosingConfig) => { if (config.root && config.root !== next.root) observer?.unobserve(config.root); config = next; if(config.frozen||config.reduced)detach();else attach();if (config.root) observer?.observe(config.root); changed() }, subscribe: (notify: () => void) => { listeners.add(notify); return () => { listeners.delete(notify) } }, getHeld: () => held, dispose: () => { cancel(); detach(); magnet.dispose(); if (poster) restore(poster); if (field) restore(field); poster = null; field = null; body = null; chips=[];slots.clear();chipListeners.clear();promptListeners.clear();listeners.clear() } }
}
type FormatDetailsPrivate_FormatClosingWorld = ReturnType<typeof FormatDetailsPrivate_createFormatClosingWorld>
const FormatDetailsPrivate_FormatClosingContext = React.createContext<FormatDetailsPrivate_FormatClosingWorld | null>(null)
const FormatDetailsPrivate_PosterCarryContext = React.createContext(false)
function FormatDetailsPrivate_closingPoster(Component: FormatDetailsPrivate_NativeLayer): FormatDetailsPrivate_NativeLayer {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const world = React.useContext(FormatDetailsPrivate_FormatClosingContext), own = React.useRef<HTMLElement | null>(null), currentStyle = React.useRef(props.style), held = React.useSyncExternalStore(world?.subscribe ?? FormatDetailsPrivate_emptySubscribe, world?.getHeld ?? (() => false), () => false)
        currentStyle.current = props.style
        FormatDetailsPrivate_useOwnLayoutEffect(() => { const node = own.current; if (!node || !world) return; return world.register("poster", node, props.style ?? {}, () => currentStyle.current) }, [world, props.style])
        return <FormatDetailsPrivate_PosterCarryContext.Provider value={held}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; FormatDetailsPrivate_writeRef(ref, node) }} data-format-carried-poster="same-native-node" /></FormatDetailsPrivate_PosterCarryContext.Provider>
    }) as FormatDetailsPrivate_NativeLayer
}
export function withFormatCarriedPoster(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_sourceFlow(FormatDetailsPrivate_closingPoster(Component), "poster") }
export function withFormatClosingField(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => { const world = React.useContext(FormatDetailsPrivate_FormatClosingContext), own = React.useRef<HTMLElement | null>(null), input = FormatDetailsPrivate_useFormatFieldInput(world,props); FormatDetailsPrivate_useOwnLayoutEffect(() => { const node = own.current; if (!node || !world) return; return world.register("field", node, props.style ?? {}) }, [world, props.style]); return <Component {...props} ref={(node: HTMLElement | null) => { own.current = node; FormatDetailsPrivate_writeRef(ref, node) }} data-format-closing-field="inner-native-field" {...input} style={{ ...props.style, overflow: "hidden" }} /> }) as FormatDetailsPrivate_NativeLayer
}

type FormatDetailsPrivate_FormatCollisionBody = { x: number; y: number; vx: number; vy: number; angle: number; angular: number; quiet: number; width: number; height: number; shape: "rectangle" | "circle" | "polygon"; restitution: number; friction: number }
const FormatDetailsPrivate_FORMAT_CHIP_SIZES: readonly (readonly [number, number, "rectangle" | "circle" | "polygon"])[] = [[335,426,"rectangle"],[335,426,"rectangle"],[335,426,"rectangle"],[335,226,"rectangle"],[705,327,"rectangle"],[1044,447,"rectangle"],[170,122,"rectangle"],[170,122,"rectangle"],[533,157,"rectangle"],[695,157,"rectangle"],[696,225,"rectangle"],[696,225,"rectangle"],[157,157,"circle"],[513,513,"circle"],[697,697,"circle"],[697,697,"circle"],[697,697,"circle"],[697,698,"circle"],[136,136,"circle"],[704.001,608.664,"polygon"],[704.001,608.664,"polygon"]]
function FormatDetailsPrivate_formatCollisionVertices(b: FormatDetailsPrivate_FormatCollisionBody) {
    const corners = b.shape === "polygon" ? [[704.001,51.1836],[382.141,608.664],[321.395,608.664],[0,51.9912],[30.0166,0],[674.45,0]].map(([x,y])=>[(x/704.001-.5)*b.width,(y/608.664-.5)*b.height]) : [[-b.width/2,-b.height/2],[b.width/2,-b.height/2],[b.width/2,b.height/2],[-b.width/2,b.height/2]], c = Math.cos(b.angle), s = Math.sin(b.angle)
    return corners.map(([x,y])=>({x:b.x+x*c-y*s,y:b.y+x*s+y*c}))
}
function FormatDetailsPrivate_formatResolveContact(a: FormatDetailsPrivate_FormatCollisionBody, b: FormatDetailsPrivate_FormatCollisionBody) {
    const radiusA = Math.hypot(a.width,a.height)/2, radiusB = Math.hypot(b.width,b.height)/2
    if (Math.abs(a.x-b.x)>radiusA+radiusB || Math.abs(a.y-b.y)>radiusA+radiusB) return false
    const av = FormatDetailsPrivate_formatCollisionVertices(a), bv = FormatDetailsPrivate_formatCollisionVertices(b), axes: {x:number;y:number}[] = []
    const add = (x:number,y:number) => { const n=Math.hypot(x,y);if(n>1e-9)axes.push({x:x/n,y:y/n}) }
    for (const [body,points] of [[a,av],[b,bv]] as const) if(body.shape!=="circle") for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length];add(-(q.y-p.y),q.x-p.x)}
    if(a.shape==="circle"&&b.shape==="circle")add(b.x-a.x,b.y-a.y)
    for(const[circle,points]of[[a,bv],[b,av]]as const)if(circle.shape==="circle"){let nearest=points[0];for(const p of points)if(Math.hypot(p.x-circle.x,p.y-circle.y)<Math.hypot(nearest.x-circle.x,nearest.y-circle.y))nearest=p;add(nearest.x-circle.x,nearest.y-circle.y)}
    let depth=Infinity,normal={x:1,y:0}
    const project=(body:FormatDetailsPrivate_FormatCollisionBody,points:ReturnType<typeof FormatDetailsPrivate_formatCollisionVertices>,axis:{x:number;y:number})=>body.shape==="circle"?[body.x*axis.x+body.y*axis.y-body.width/2,body.x*axis.x+body.y*axis.y+body.width/2]:[Math.min(...points.map(p=>p.x*axis.x+p.y*axis.y)),Math.max(...points.map(p=>p.x*axis.x+p.y*axis.y))]
    for(const axis of axes){const pa=project(a,av,axis),pb=project(b,bv,axis),overlap=Math.min(pa[1],pb[1])-Math.max(pa[0],pb[0]);if(overlap<=0)return false;if(overlap<depth){depth=overlap;normal=axis}}
    if(!Number.isFinite(depth))return false
    if((b.x-a.x)*normal.x+(b.y-a.y)*normal.y<0)normal={x:-normal.x,y:-normal.y}
    const massA=Math.max(1,a.width*a.height*.001),massB=Math.max(1,b.width*b.height*.001),ia=1/massA,ib=1/massB,total=ia+ib,correction=Math.max(0,depth-.01)*.8/total
    a.x-=normal.x*correction*ia;a.y-=normal.y*correction*ia;b.x+=normal.x*correction*ib;b.y+=normal.y*correction*ib
    const speed=(b.vx-a.vx)*normal.x+(b.vy-a.vy)*normal.y
    if(speed<0){const impulse=-(1+Math.min(a.restitution,b.restitution))*speed/total;a.vx-=normal.x*impulse*ia;a.vy-=normal.y*impulse*ia;b.vx+=normal.x*impulse*ib;b.vy+=normal.y*impulse*ib;const tangent={x:-normal.y,y:normal.x},sliding=(b.vx-a.vx)*tangent.x+(b.vy-a.vy)*tangent.y,friction=Math.max(-impulse*Math.min(a.friction,b.friction),Math.min(impulse*Math.min(a.friction,b.friction),-sliding/total));a.vx-=tangent.x*friction*ia;a.vy-=tangent.y*friction*ia;b.vx+=tangent.x*friction*ib;b.vy+=tangent.y*friction*ib;a.angular-=friction*ia/Math.max(20,a.width);b.angular+=friction*ib/Math.max(20,b.width)}
    a.quiet=0;b.quiet=0;return true
}

/** Filled only from the genuine saved native schema, before registration. The
 * first retained real Slot01 Preview probe still gates the other29 instances. */
function FormatDetailsPrivate_formatChipVariantRuntime(): { prop: string; values: readonly string[]; schemaSHA256: string } | null { return {"prop":"variant","values":["ZeTdYyitj","fWcPOwQMJ","PfrCqgE65","dklxBAWmC","P5Hcrgipt","wzzUQ4t9B","FcBO6OrMo","jre40CVsx","ltfV0W5Co","h7TCqQnnn","d1FgwTdhY","yAnof6n2O","MRrwNLCtD","iKQVlAxtH","n_S6P9HO0","G5o4GShQG","BqLSZdoBV","lzxMcJ1hw","Rc8kcV4Ux","lcbPhQ29y","PxDrzupdu"],"schemaSHA256":"2105714425b8c685d5e28da267245f0dd45473335052ffab2bc0dda5192a58cc"} }
type FormatDetailsPrivate_FormatChipBody = FormatDetailsPrivate_FormatCollisionBody & { slot: number; template: number; order: number }
const FormatDetailsPrivate_FormatChipSlotContext = React.createContext(-1)
function FormatDetailsPrivate_formatNativeChipSlot(Component: FormatDetailsPrivate_NativeLayer, index: number): FormatDetailsPrivate_NativeLayer {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const world = React.useContext(FormatDetailsPrivate_FormatClosingContext), own = React.useRef<HTMLElement | null>(null)
        FormatDetailsPrivate_useOwnLayoutEffect(() => { const node = own.current; if (!world || !node) return; return world.registerSlot(index, node) }, [world])
        return <FormatDetailsPrivate_FormatChipSlotContext.Provider value={index}><Component {...props} ref={(node: HTMLElement | null) => { own.current = node; FormatDetailsPrivate_writeRef(ref, node) }}
            data-format-chip-slot={index} aria-hidden="true" style={{ ...props.style, opacity: 0, pointerEvents: "none" }} /></FormatDetailsPrivate_FormatChipSlotContext.Provider>
    }) as FormatDetailsPrivate_NativeLayer
}
/** Native variant roots may remount. Physics and visibility belong to the stable
 * primitive parent Frame; this inner native-instance override only selects art. */
export function withFormatChipVariant(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const world = React.useContext(FormatDetailsPrivate_FormatClosingContext), index = React.useContext(FormatDetailsPrivate_FormatChipSlotContext)
        const template = React.useSyncExternalStore(world?.subscribeChips ?? FormatDetailsPrivate_emptySubscribe, () => world?.getTemplate(index) ?? -1, () => -1)
        const binding = FormatDetailsPrivate_formatChipVariantRuntime(), variant = template >= 0 && binding ? { [binding.prop]: binding.values[template] } : {}
        return <Component {...props} {...variant} ref={ref} data-format-chip-variant={template} aria-hidden="true"
            style={{ ...props.style, position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none", ...(index < 0 ? { opacity: 0 } : {}) }} />
    })
}
export function withFormatChipPrompts(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return React.forwardRef<HTMLElement,FormatDetailsPrivate_LayerProps>((props,ref)=>{const world=React.useContext(FormatDetailsPrivate_FormatClosingContext),frozen=FormatDetailsPrivate_frozenTarget(),played=React.useSyncExternalStore(world?.subscribePrompts??FormatDetailsPrivate_emptySubscribe,world?.getPlayed??(()=>false),()=>false);return <Component {...props} ref={ref} data-format-chip-prompts={played?"played":"unplayed"} style={{...props.style,opacity:played?0:props.style?.opacity??1,transition:frozen?"none":"opacity .5s linear",pointerEvents:"none"}}/>})as FormatDetailsPrivate_NativeLayer}

export function withFormatChipSlot01(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,0)}
export function withFormatChipSlot02(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,1)}
export function withFormatChipSlot03(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,2)}
export function withFormatChipSlot04(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,3)}
export function withFormatChipSlot05(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,4)}
export function withFormatChipSlot06(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,5)}
export function withFormatChipSlot07(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,6)}
export function withFormatChipSlot08(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,7)}
export function withFormatChipSlot09(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,8)}
export function withFormatChipSlot10(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,9)}
export function withFormatChipSlot11(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,10)}
export function withFormatChipSlot12(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,11)}
export function withFormatChipSlot13(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,12)}
export function withFormatChipSlot14(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,13)}
export function withFormatChipSlot15(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,14)}
export function withFormatChipSlot16(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,15)}
export function withFormatChipSlot17(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,16)}
export function withFormatChipSlot18(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,17)}
export function withFormatChipSlot19(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,18)}
export function withFormatChipSlot20(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,19)}
export function withFormatChipSlot21(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,20)}
export function withFormatChipSlot22(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,21)}
export function withFormatChipSlot23(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,22)}
export function withFormatChipSlot24(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,23)}
export function withFormatChipSlot25(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,24)}
export function withFormatChipSlot26(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,25)}
export function withFormatChipSlot27(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,26)}
export function withFormatChipSlot28(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,27)}
export function withFormatChipSlot29(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,28)}
export function withFormatChipSlot30(Component:ComponentType<FormatDetailsPrivate_LayerProps>):ComponentType<FormatDetailsPrivate_LayerProps>{return FormatDetailsPrivate_formatNativeChipSlot(Component,29)}
type FormatDetailsPrivate_FormatFieldEvent = { clientX?: number; clientY?: number; defaultPrevented?: boolean; nativeEvent?: { clientX?: number; clientY?: number }; touches?: ArrayLike<{clientX:number;clientY:number}> }
function FormatDetailsPrivate_useFormatFieldInput(world: FormatDetailsPrivate_FormatClosingWorld | null,props: FormatDetailsPrivate_LayerProps) {
    const last = React.useRef<{channel:"pointer"|"tap";at:number;x:number;y:number}|null>(null)
    const accept = (channel:"pointer"|"tap",event:FormatDetailsPrivate_FormatFieldEvent,info?:{point?:{x:number;y:number}}) => {
        if(!world?.canInput())return
        const touch=event.touches?.[0],x=event.clientX??event.nativeEvent?.clientX??touch?.clientX??info?.point?.x,y=event.clientY??event.nativeEvent?.clientY??touch?.clientY??info?.point?.y
        if(!Number.isFinite(x)||!Number.isFinite(y))return
        const at=performance.now(),before=last.current
        if(before&&before.channel!==channel&&at-before.at<350&&Math.hypot(x!-before.x,y!-before.y)<2)return
        last.current={channel,at,x:x!,y:y!}
        Promise.resolve().then(()=>{if(!event.defaultPrevented&&world.canInput())world.spawn(x!,y!)})
    }
    return { onPointerDown:(event:FormatDetailsPrivate_FormatFieldEvent)=>{if(typeof props.onPointerDown==="function")props.onPointerDown(event);accept("pointer",event)},onTapStart:(event:FormatDetailsPrivate_FormatFieldEvent,info?:{point?:{x:number;y:number}})=>{if(typeof props.onTapStart==="function")props.onTapStart(event,info);accept("tap",event,info)} }
}

/** Public native elementId contract: format-poster-glyph-0..85 and
 * format-poster-pip-end. Each part remains an editable native layer. */
export function withFormatPosterGlyph(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const world = React.useContext(FormatDetailsPrivate_FormatClosingContext), remove = React.useRef<(() => void) | null>(null)
        const bind = React.useCallback((node: HTMLElement | null) => {
            remove.current?.(); remove.current = null
            if (node && world) { const match = node.id.match(/^format-poster-glyph-(\d+)$/); if (match && Number(match[1]) < 86) remove.current = world.registerMagnet("glyph", node, Number(match[1])); else if (node.id === "format-poster-pip-end") remove.current = world.registerMagnet("endpoint", node) }
            FormatDetailsPrivate_writeRef(ref, node)
        }, [world, ref])
        return <Component {...props} ref={bind} data-format-poster-glyph-part="editable-native" />
    }) as FormatDetailsPrivate_NativeLayer
}

type FormatDetailsPrivate_FormatMobileView = { width: number; height: number; coarse: boolean; show: boolean; landscape: boolean; frozen: boolean }
const FormatDetailsPrivate_FormatMobileContext = React.createContext<FormatDetailsPrivate_FormatMobileView>({ width: 393, height: 844, coarse: false, show: true, landscape: false, frozen: true })
function FormatDetailsPrivate_formatMobileView(width: number, height: number, coarse: boolean, frozen: boolean): FormatDetailsPrivate_FormatMobileView {
    return { width, height, coarse, show: width <= 767 || coarse, landscape: width > height && height <= 620, frozen }
}
function FormatDetailsPrivate_formatMobileNumber(value: unknown, fallback: number) { const number = typeof value === "number" ? value : parseFloat(String(value)); return Number.isFinite(number) && number > 0 ? number : fallback }
function FormatDetailsPrivate_useFormatMobileVisibility(host: HTMLElement | null, frozen: boolean) {
    const [seen, setSeen] = React.useState<{ host: HTMLElement | null; visible: boolean }>({ host: null, visible: false })
    const [hidden, setHidden] = React.useState(false), [reduced, setReduced] = React.useState(false)
    FormatDetailsPrivate_useOwnLayoutEffect(() => {
        if (!host || frozen) return
        let active = true
        const query = window.matchMedia("(prefers-reduced-motion: reduce)"), motion = () => setReduced(query.matches), visibility = () => setHidden(document.hidden)
        motion(); visibility()
        const observer = new IntersectionObserver(([entry]) => { if (active) setSeen({ host, visible: entry.isIntersecting }) })
        observer.observe(host); query.addEventListener("change", motion); document.addEventListener("visibilitychange", visibility)
        return () => { active = false; observer.disconnect(); query.removeEventListener("change", motion); document.removeEventListener("visibilitychange", visibility) }
    }, [host, frozen])
    return !frozen && seen.host === host && seen.visible && !hidden && !reduced
}
/** Current source splash: width<=767 or coarse pointer. The retained story stays
 * mounted behind the fixed surface; the source's landscape rule hides its dial. */
export function withFormatMobileSplash(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const frozen = FormatDetailsPrivate_frozenTarget(), [view, setView] = React.useState(() => FormatDetailsPrivate_formatMobileView(
            !frozen && typeof window !== "undefined" ? window.innerWidth : FormatDetailsPrivate_formatMobileNumber(props.style?.width, 393),
            !frozen && typeof window !== "undefined" ? window.innerHeight : FormatDetailsPrivate_formatMobileNumber(props.style?.height, 844), false, frozen))
        FormatDetailsPrivate_useOwnLayoutEffect(() => {
            if (frozen) return
            const query = window.matchMedia("(pointer: coarse)"), read = () => {
                const next = FormatDetailsPrivate_formatMobileView(window.innerWidth, window.innerHeight, query.matches, false)
                setView(old => old.width === next.width && old.height === next.height && old.coarse === next.coarse && old.frozen === next.frozen ? old : next)
            }
            read(); window.addEventListener("resize", read); query.addEventListener("change", read)
            return () => { window.removeEventListener("resize", read); query.removeEventListener("change", read) }
        }, [frozen])
        const current = { ...view, frozen }, style: React.CSSProperties = frozen ? props.style ?? {} : {
            ...props.style, position: "fixed", inset: 0, width: view.width, height: view.height, background: "#222222", overflow: "hidden", zIndex: 10000,
            opacity: view.show ? 1 : 0, visibility: view.show ? "visible" : "hidden", pointerEvents: view.show ? "auto" : "none",
        }
        return <FormatDetailsPrivate_FormatMobileContext.Provider value={current}><Component {...props} ref={ref} data-format-mobile-splash="source" aria-hidden={!view.show} style={style} /><style>{FormatDetailsPrivate_FORMAT_MOBILE_STYLE}</style></FormatDetailsPrivate_FormatMobileContext.Provider>
    }) as FormatDetailsPrivate_NativeLayer
}
type FormatDetailsPrivate_FormatMobileRole = "logo" | "dial" | "credit" | "message"
function FormatDetailsPrivate_formatMobilePart(Component: FormatDetailsPrivate_NativeLayer, role: FormatDetailsPrivate_FormatMobileRole): FormatDetailsPrivate_NativeLayer {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const view = React.useContext(FormatDetailsPrivate_FormatMobileContext), own = React.useRef<HTMLElement | null>(null), [host, setHost] = React.useState<HTMLElement | null>(null)
        const defaults = role === "logo" ? [1400, 214.846538187] : role === "dial" ? [697, 697] : [355, role === "message" ? 24 : 12]
        const [box, setBox] = React.useState(() => ({ width: FormatDetailsPrivate_formatMobileNumber(props.style?.width, defaults[0]), height: FormatDetailsPrivate_formatMobileNumber(props.style?.height, defaults[1]) }))
        const [painted, setPainted] = React.useState(false)
        const bind = React.useCallback((node: HTMLElement | null) => { own.current = node; setHost(old => old === node ? old : node); FormatDetailsPrivate_writeRef(ref, node) }, [ref])
        FormatDetailsPrivate_useOwnLayoutEffect(() => {
            if (!host) return
            const read = () => { const css = getComputedStyle(host), next = { width: FormatDetailsPrivate_formatMobileNumber(css.width, defaults[0]), height: FormatDetailsPrivate_formatMobileNumber(css.height, defaults[1]) }; setBox(old => old.width === next.width && old.height === next.height ? old : next) }
            read(); if (view.frozen) return
            const observer = new ResizeObserver(read); observer.observe(host); return () => observer.disconnect()
        }, [host, props.style?.width, props.style?.height, view.frozen])
        FormatDetailsPrivate_useOwnLayoutEffect(() => {
            if (!host || view.frozen || role !== "dial") return
            const read = () => {
                let shown = true
                for (let node: HTMLElement | null = host; node; node = node.parentElement) { const css = getComputedStyle(node); if (css.display === "none" || css.visibility !== "visible" || Number(css.opacity) === 0) { shown = false; break } }
                setPainted(old => old === shown ? old : shown)
            }
            const observer = new MutationObserver(read)
            for (let node: HTMLElement | null = host; node; node = node.parentElement) observer.observe(node, { attributes: true, attributeFilter: ["style", "class"] })
            read(); return () => observer.disconnect()
        }, [host, view.frozen])
        const u = view.width / 393, face = Math.max(0, Math.min(353 * u, view.height - 190 * u)), landscapeFont = Math.min(12 * u, .034 * view.height)
        const live = FormatDetailsPrivate_useFormatMobileVisibility(host, view.frozen || !view.show || view.landscape || !painted || face <= 0 || role !== "dial")
        const now = React.useSyncExternalStore(live ? FormatDetailsPrivate_subscribeClock : FormatDetailsPrivate_emptySubscribe, live ? FormatDetailsPrivate_getClock : FormatDetailsPrivate_serverClock, FormatDetailsPrivate_serverClock)
        let style: React.CSSProperties = props.style ?? {}
        if (!view.frozen) {
            if (role === "logo") {
                const width = view.landscape ? view.width - 40 : 354 * u, height = view.landscape ? width * 54.239 / 354 : 54.239 * u
                style = { ...style, position: "absolute", left: view.landscape ? 20 : 19 * u, top: view.landscape ? 20 : 19.707 * u, transformOrigin: "0 0", transform: `scale(${width / box.width},${height / box.height})`, pointerEvents: "none" }
            } else if (role === "dial") style = { ...style, position: "absolute", left: "50%", top: "50%", transformOrigin: "50% 50%", transform: `translate(-50%,-50%) scale(${face / box.width})`, opacity: view.landscape ? 0 : 1, visibility: view.landscape ? "hidden" : "visible", pointerEvents: "none" }
            else {
                const base = view.landscape ? landscapeFont / 12 : u, scale = base * 355 / box.width
                style = { ...style, position: "absolute", left: (view.width - box.width * scale) / 2, top: "auto", bottom: role === "credit" ? view.landscape ? 20 + 3 * landscapeFont : 55 * u : view.landscape ? 20 : 19 * u, transformOrigin: "0 100%", transform: `scale(${scale})`, pointerEvents: role === "credit" ? "auto" : "none" }
            }
        }
        const part = <Component {...props} ref={bind} data-format-mobile-part={role} data-format-mobile-clock-time={role === "dial" ? now : undefined} style={style} />
        return role === "dial" ? <FormatDetailsPrivate_LargeDialContext.Provider value={{ angles: FormatDetailsPrivate_berlinAngles(now), unit: box.width / 697 }}>{part}</FormatDetailsPrivate_LargeDialContext.Provider> : part
    }) as FormatDetailsPrivate_NativeLayer
}
export function withFormatMobileLogo(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatMobilePart(Component, "logo") }
export function withFormatMobileDial(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatMobilePart(Component, "dial") }
export function withFormatMobileCredit(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatMobilePart(Component, "credit") }
export function withFormatMobileMessage(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatMobilePart(Component, "message") }
const FormatDetailsPrivate_FORMAT_MOBILE_STYLE = `[data-format-mobile-part="credit"]{display:flex!important;align-items:center!important;justify-content:center!important;gap:0!important;white-space:pre!important}
[data-format-mobile-part="credit"]>[data-framer-name]{position:relative!important;left:auto!important;top:auto!important;right:auto!important;bottom:auto!important;width:max-content!important;height:auto!important;flex:0 0 auto!important;transform:none!important}
[data-format-mobile-part="credit"] p,[data-format-mobile-part="credit"] span{white-space:pre!important}`

/** Additive source-photo drift. The retained current FORMAT code maps every
 * selected aperture's top-bottom traversal linearly from -7% to +7% of its
 * height. Native material stays a separate editable Frame, enlarged to114%
 * above its clipped aperture; no photograph/screenshot is created here.
 * First finite binding: the original Vertical and Horizontal card photographs.
 */
type FormatDetailsPrivate_FormatPhotoState = { enabled: boolean; offset: number }
const FormatDetailsPrivate_FormatPhotoContext = React.createContext<FormatDetailsPrivate_FormatPhotoState>({ enabled: false, offset: 0 })
function FormatDetailsPrivate_formatPhotoOffset(top: number, visualHeight: number, viewportHeight: number, logicalHeight: number) {
    const progress = Math.max(0, Math.min(1, (viewportHeight - top) / Math.max(1, viewportHeight + visualHeight)))
    return logicalHeight * .07 * (2 * progress - 1)
}
function FormatDetailsPrivate_formatPhotoPainted(host: HTMLElement) {
    for (let node: HTMLElement | null = host; node; node = node.parentElement) {
        const css = getComputedStyle(node)
        if (css.display === "none" || css.visibility !== "visible" || Number(css.opacity) === 0) return false
    }
    return true
}
export function withFormatPhotoAperture(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const frozen = FormatDetailsPrivate_frozenTarget(), reduced = FormatDetailsPrivate_useReducedMotion(), layout = React.useContext(FormatDetailsPrivate_SourceLayoutContext), held = React.useContext(FormatDetailsPrivate_PosterCarryContext)
        const [host, setHost] = React.useState<HTMLElement | null>(null), [pose, setPose] = React.useState<FormatDetailsPrivate_FormatPhotoState>({ enabled: false, offset: 0 })
        const bind = React.useCallback((node: HTMLElement | null) => { setHost(previous => previous === node ? previous : node); FormatDetailsPrivate_writeRef(ref, node) }, [ref])
        FormatDetailsPrivate_useOwnLayoutEffect(() => {
            if (!host) return
            if (frozen || reduced || layout.phone) { setPose(previous => previous.enabled ? { enabled: false, offset: 0 } : previous); return }
            // Source poster carry holds its last drift. This first binding does
            // not change that poster or its separate reverse compensation.
            if (held) return
            let active = true, frame = 0, visible = false, lastPaint = 0
            const cancel = () => { if (frame) cancelAnimationFrame(frame); frame = 0 }
            const measure = () => {
                if (!active || document.hidden || !FormatDetailsPrivate_formatPhotoPainted(host)) return
                const box = host.getBoundingClientRect(), logicalHeight = host.clientHeight
                if (box.height <= 0 || logicalHeight <= 0) return
                const offset = FormatDetailsPrivate_formatPhotoOffset(box.top, box.height, window.innerHeight, logicalHeight)
                setPose(previous => previous.enabled && Math.abs(previous.offset - offset) < .001 ? previous : { enabled: true, offset })
            }
            const read = (now: number) => {
                frame = 0
                if (!active || !visible || document.hidden || !FormatDetailsPrivate_formatPhotoPainted(host)) return
                if (now - lastPaint < 1000 / 30) { frame = requestAnimationFrame(read); return }
                lastPaint = now; measure()
            }
            const schedule = () => { if (active && visible && !document.hidden && FormatDetailsPrivate_formatPhotoPainted(host) && !frame) frame = requestAnimationFrame(read) }
            const visibility = () => { if (document.hidden) cancel(); else { lastPaint = 0; schedule() } }
            // An initial bounded measurement supplies the correct crop even
            // before IntersectionObserver's first asynchronous admission.
            measure()
            const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) { lastPaint = 0; schedule() } else cancel() })
            // Geometry/style notifications use the same finite30Hz admission
            // as scroll. Immediate measurements here would bypass that budget
            // when a native ancestor animates its transform each frame.
            const resize = new ResizeObserver(schedule)
            const paint = new MutationObserver(() => { if (!FormatDetailsPrivate_formatPhotoPainted(host)) cancel(); else schedule() })
            for (let node: HTMLElement | null = host; node; node = node.parentElement) paint.observe(node, { attributes: true, attributeFilter: ["style", "class", "hidden"] })
            intersection.observe(host); resize.observe(host)
            window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule); document.addEventListener("visibilitychange", visibility)
            return () => { active = false; cancel(); intersection.disconnect(); resize.disconnect(); paint.disconnect(); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); document.removeEventListener("visibilitychange", visibility) }
        }, [host, frozen, reduced, layout.phone, held])
        return <FormatDetailsPrivate_FormatPhotoContext.Provider value={pose}><Component {...props} ref={bind} data-format-photo-aperture={pose.enabled ? "live" : "native-still"} data-format-photo-offset={pose.offset} style={pose.enabled ? { ...props.style, overflow: "hidden" } : props.style} /></FormatDetailsPrivate_FormatPhotoContext.Provider>
    }) as FormatDetailsPrivate_NativeLayer
}
export function withFormatPhotoImage(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const pose = React.useContext(FormatDetailsPrivate_FormatPhotoContext)
        return <Component {...props} ref={ref} data-format-photo-material="editable-native-frame" style={pose.enabled ? { ...props.style, position: "absolute", left: 0, top: "-7%", width: "100%", height: "114%", translate: `0px ${pose.offset}px` } as FormatDetailsPrivate_DetailStyle : props.style} />
    }) as FormatDetailsPrivate_NativeLayer
}

/** Source field words: one masked8-word entrance, then a common flick clock.
 * Native public elementIds format-field-mask-{0..7} encode the retained
 * DOM order. Rebind all8 old phase roles instead of mounting duplicate clocks.
 * CSS motion pauses as one group offscreen/hidden; source Phone keeps its
 * historical native geometry and the old1/.25 still phase appearance.
 */
const FormatDetailsPrivate_FORMAT_FIELD_PHASES = [0, 1, 0, 1, 0, 0, 1, 0] as const
const FormatDetailsPrivate_FORMAT_FIELD_ENTRY = "source-format-field-entry"
const FormatDetailsPrivate_FORMAT_FIELD_FLICK = "source-format-field-flick"
const FormatDetailsPrivate_FORMAT_FIELD_EASE = "linear(" + Array.from({ length: 33 }, (_, index) => (1 - (1 - index / 32) ** 4).toFixed(8)).join(",") + ")"
type FormatDetailsPrivate_FormatFieldEntryState = {
    phase: "native" | "waiting" | "entering" | "entered"
    running: boolean
    registerMask: (index: number, node: HTMLElement) => () => void
    registerWord: (index: number, node: HTMLElement) => () => void
    complete: (index: number) => void
}
const FormatDetailsPrivate_FormatFieldEntryContext = React.createContext<FormatDetailsPrivate_FormatFieldEntryState | null>(null)
function FormatDetailsPrivate_formatFieldMaskIdentity(node: HTMLElement | null) {
    const match = node?.id.match(/^format-field-mask-([0-7])$/)
    return match ? Number(match[1]) : null
}
export function withFormatStaggeredFieldPrompts(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const frozen = FormatDetailsPrivate_frozenTarget(), reduced = FormatDetailsPrivate_useReducedMotion(), layout = React.useContext(FormatDetailsPrivate_SourceLayoutContext), world = React.useContext(FormatDetailsPrivate_FormatClosingContext)
        const played = React.useSyncExternalStore(world?.subscribePrompts ?? FormatDetailsPrivate_emptySubscribe, world?.getPlayed ?? (() => false), () => false)
        const masks = React.useRef(new Map<number, HTMLElement>()), words = React.useRef(new Map<number, HTMLElement>()), started = React.useRef(false)
        const [revision, setRevision] = React.useState(0), [host, setHost] = React.useState<HTMLElement | null>(null), [entered, setEntered] = React.useState(false), [done, setDone] = React.useState(false), [running, setRunning] = React.useState(false)
        const bind = React.useCallback((node: HTMLElement | null) => { setHost(previous => previous === node ? previous : node); FormatDetailsPrivate_writeRef(ref, node) }, [ref])
        const registerMask = React.useCallback((index: number, node: HTMLElement) => { masks.current.set(index, node); setRevision(value => value + 1); return () => { if (masks.current.get(index) === node) { masks.current.delete(index); setRevision(value => value + 1) } } }, [])
        const registerWord = React.useCallback((index: number, node: HTMLElement) => { words.current.set(index, node); setRevision(value => value + 1); return () => { if (words.current.get(index) === node) { words.current.delete(index); setRevision(value => value + 1) } } }, [])
        const complete = React.useCallback((index: number) => { if (index === 7) setDone(true) }, [])
        const stopped = frozen || reduced || layout.frozen || layout.phone, ready = masks.current.size === 8 && words.current.size === 8
        FormatDetailsPrivate_useOwnLayoutEffect(() => () => { masks.current.clear(); words.current.clear() }, [])
        FormatDetailsPrivate_useOwnLayoutEffect(() => {
            if (!host || stopped || !ready) { setRunning(false); return }
            let active = true
            const read = () => {
                if (!active) return
                const box = host.getBoundingClientRect(), visible = box.bottom > 0 && box.top < window.innerHeight && box.right > 0 && box.left < window.innerWidth
                const allowed = visible && !document.hidden && !played && FormatDetailsPrivate_formatPhotoPainted(host) && (!world || world.canInput())
                setRunning(previous => previous === allowed ? previous : allowed)
                const trigger = masks.current.get(2)
                if (!started.current && trigger && !played && !document.hidden && FormatDetailsPrivate_formatPhotoPainted(host) && trigger.getBoundingClientRect().top <= window.innerHeight) { started.current = true; setEntered(true) }
            }
            const intersection = new IntersectionObserver(read), resize = new ResizeObserver(read), paint = new MutationObserver(read)
            intersection.observe(host); resize.observe(host)
            const trigger = masks.current.get(2); if (trigger) resize.observe(trigger)
            for (let node: HTMLElement | null = host; node; node = node.parentElement) paint.observe(node, { attributes: true, attributeFilter: ["style", "class", "hidden"] })
            read(); window.addEventListener("scroll", read, { passive: true }); window.addEventListener("resize", read); document.addEventListener("visibilitychange", read)
            return () => { active = false; intersection.disconnect(); resize.disconnect(); paint.disconnect(); window.removeEventListener("scroll", read); window.removeEventListener("resize", read); document.removeEventListener("visibilitychange", read) }
        }, [host, stopped, ready, revision, played, world])
        const phase: FormatDetailsPrivate_FormatFieldEntryState["phase"] = stopped || !ready ? "native" : !entered ? "waiting" : done ? "entered" : "entering"
        const value: FormatDetailsPrivate_FormatFieldEntryState = { phase, running, registerMask, registerWord, complete }
        return <FormatDetailsPrivate_FormatFieldEntryContext.Provider value={value}><Component {...props} ref={bind} data-format-field-entry={phase} data-format-field-ready={ready} data-format-field-running={running} data-format-chip-prompts={played ? "played" : "unplayed"} style={{ ...props.style, opacity: played ? 0 : props.style?.opacity ?? 1, transition: frozen ? "none" : "opacity .5s linear", pointerEvents: "none" }} /><style>{`@keyframes ${FormatDetailsPrivate_FORMAT_FIELD_ENTRY}{from{translate:0px var(--source-format-entry-shift)}to{translate:0px 0px}}@keyframes ${FormatDetailsPrivate_FORMAT_FIELD_FLICK}{0%{opacity:1}50%{opacity:.25}}[data-format-entry-live="true"][data-format-field-word="0"],[data-format-entry-live="true"][data-format-field-word="0"] *,[data-format-entry-live="true"][data-format-field-word="1"],[data-format-entry-live="true"][data-format-field-word="1"] *{line-height:18px!important}`}</style></FormatDetailsPrivate_FormatFieldEntryContext.Provider>
    }) as FormatDetailsPrivate_NativeLayer
}
export function withFormatFieldWordMask(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const state = React.useContext(FormatDetailsPrivate_FormatFieldEntryContext), [host, setHost] = React.useState<HTMLElement | null>(null), [index, setIndex] = React.useState<number | null>(null)
        const bind = React.useCallback((node: HTMLElement | null) => { setHost(previous => previous === node ? previous : node); FormatDetailsPrivate_writeRef(ref, node) }, [ref])
        FormatDetailsPrivate_useOwnLayoutEffect(() => { setIndex(FormatDetailsPrivate_formatFieldMaskIdentity(host)) }, [host])
        FormatDetailsPrivate_useOwnLayoutEffect(() => { if (host && index !== null && state) return state.registerMask(index, host) }, [host, index, state?.registerMask])
        const live = Boolean(state && state.phase !== "native" && index !== null), height = index !== null && index < 2 ? 18 : 37.8
        const top = index === 0 ? "5px" : index === 1 ? "calc(100% - 23px)" : "calc(50% - 38px)"
        return <Component {...props} ref={bind} data-format-field-mask={index ?? "missing-public-elementId"} style={live ? { ...props.style, top, height, overflow: state?.phase === "entered" ? "visible" : "hidden", pointerEvents: "none" } : { ...props.style, pointerEvents: "none" }} />
    }) as FormatDetailsPrivate_NativeLayer
}
function FormatDetailsPrivate_formatFieldEntryWord(Component: FormatDetailsPrivate_NativeLayer, index: number): FormatDetailsPrivate_NativeLayer {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const state = React.useContext(FormatDetailsPrivate_FormatFieldEntryContext), [host, setHost] = React.useState<HTMLElement | null>(null)
        const bind = React.useCallback((node: HTMLElement | null) => { setHost(previous => previous === node ? previous : node); FormatDetailsPrivate_writeRef(ref, node) }, [ref])
        FormatDetailsPrivate_useOwnLayoutEffect(() => { if (host && state) return state.registerWord(index, host) }, [host, index, state?.registerWord])
        FormatDetailsPrivate_useOwnLayoutEffect(() => {
            if (!host || !state) return
            const complete = state.complete
            const end = (event: AnimationEvent) => { if (event.target === host && event.animationName === FormatDetailsPrivate_FORMAT_FIELD_ENTRY) Promise.resolve().then(() => { if (host.isConnected && !event.defaultPrevented) complete(index) }) }
            host.addEventListener("animationend", end)
            return () => host.removeEventListener("animationend", end)
        }, [host, index, state?.complete])
        const phase = FormatDetailsPrivate_FORMAT_FIELD_PHASES[index], live = Boolean(state && state.phase !== "native"), height = index < 2 ? 18 : 37.8
        const animation = !live || state?.phase === "waiting" ? "none" : state?.phase === "entering" ? `${FormatDetailsPrivate_FORMAT_FIELD_ENTRY} .9s ${FormatDetailsPrivate_FORMAT_FIELD_EASE} ${index * .13}s both` : `${FormatDetailsPrivate_FORMAT_FIELD_FLICK} 2.6s step-end ${phase ? "-1.3s" : "0s"} infinite`
        const style = { ...props.style, opacity: phase ? .25 : 1, animation, pointerEvents: "none", ...(live ? { translate: state?.phase === "waiting" ? `0px ${height * 1.1}px` : "0px 0px", animationPlayState: state?.running ? "running" : "paused", "--source-format-entry-shift": `${height * 1.1}px` } : {}) } as FormatDetailsPrivate_DetailStyle
        return <Component {...props} ref={bind} data-format-field-word={index} data-format-entry-live={live} data-format-click-phase={phase} style={style} />
    }) as FormatDetailsPrivate_NativeLayer
}

export function withFormatFieldEntryWord01(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatFieldEntryWord(Component, 0) }
export function withFormatFieldEntryWord02(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatFieldEntryWord(Component, 1) }
export function withFormatFieldEntryWord03(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatFieldEntryWord(Component, 2) }
export function withFormatFieldEntryWord04(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatFieldEntryWord(Component, 3) }
export function withFormatFieldEntryWord05(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatFieldEntryWord(Component, 4) }
export function withFormatFieldEntryWord06(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatFieldEntryWord(Component, 5) }
export function withFormatFieldEntryWord07(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatFieldEntryWord(Component, 6) }
export function withFormatFieldEntryWord08(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatFieldEntryWord(Component, 7) }

/** Retained original bu(): the Vee flight shares the poster owner's clock.
 * Its native ring is a sibling of the clipped gauge runtime, inside the
 * existing overflow-visible gauge group. The optional registration leaves
 * old native placements on their previous pose until that group is bound. */
function FormatDetailsPrivate_formatEarlyPipPose(scroll: number, viewport: number, unit: number, posterTop: number, ownerLeft: number) {
    const axis = posterTop - 837.5 * unit, originY = axis - 1370.914 * unit
    const start = originY - viewport / 2, end = Math.max(start + 1, axis - viewport)
    const raw = Math.max(0, Math.min(1, (scroll - start) / (end - start)))
    const progress = raw < .5 ? 4 * raw ** 3 : 1 - (-2 * raw + 2) ** 3 / 2, a = 1 - progress
    const y = Math.min(posterTop + 1429.12 * unit - axis, scroll + viewport / 2 - axis)
    const pathX = FormatDetailsPrivate_formatMagnetX((axis + y - posterTop) / Math.max(.001, unit)) * unit
    const channel = Math.round(255 * Math.max(0, Math.min(1, progress / .2)))
    return { x: ownerLeft + pathX + (698.5 - 720) * unit * a, y: axis - 1370.914 * unit * a + y * progress, turn: 180 * a, scale: 1 + (33 / 20 - 1) * a, color: `rgb(${channel},${channel},${channel})`, progress }
}
export function withFormatGaugeFlowAndField(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    const FlowAndField = withFormatGaugeField(withFormatGaugeFlow(Component))
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const world = React.useContext(FormatDetailsPrivate_FormatClosingContext), remove = React.useRef<(() => void) | null>(null)
        const bind = React.useCallback((node: HTMLElement | null) => { remove.current?.(); remove.current = node && world ? world.registerMagnet("flight", node) : null; FormatDetailsPrivate_writeRef(ref, node) }, [world, ref])
        return <FlowAndField {...props} ref={bind} data-format-gauge-flight="same-owner-native-ring" />
    })
}

/** Cached source .wide is ordinary document flow, not the earlier fitted
 * fixed-position actor. Keep the authored Phone and renderer still intact. */
export function withFormatHorizontalWideFlow(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const state = React.useContext(FormatDetailsPrivate_SourceLayoutContext), frozen = FormatDetailsPrivate_frozenTarget(), u = state.layout.unit
        return <Component {...props} ref={ref} data-format-source-flow="wide" style={frozen || state.frozen || state.phone ? props.style : { ...props.style, position: "absolute", left: 198 * u, top: 868 * u, width: 1045, height: 448, scale: String(u), rotate: "0deg", transformOrigin: "0 0", opacity: 1 } as FormatDetailsPrivate_DetailStyle} />
    })
}

/** This newly owned poster aperture must not trap independently translated
 * source photo layers below the moving native glyphs. Native host defaults
 * are normalized explicitly; ordinary overflow clipping is retained. */
const FormatDetailsPrivate_FORMAT_POSTER_PHOTO_FLAT: FormatDetailsPrivate_DetailStyle = {
    opacity: 1, transform: "none", translate: "none", rotate: "none", scale: "none",
    perspective: "none", transformStyle: "flat", filter: "none", backdropFilter: "none",
    clipPath: "none", WebkitClipPath: "none", maskImage: "none", WebkitMaskImage: "none",
    isolation: "auto", contain: "none", willChange: "auto", mixBlendMode: "normal", zIndex: "auto",
}
export function withFormatPosterPhotoAperture(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    const FlatHost = React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => <Component {...props} ref={ref} data-format-poster-photo-aperture="flat-native-host" style={{ ...props.style, ...FormatDetailsPrivate_FORMAT_POSTER_PHOTO_FLAT }} />)
    return withFormatPhotoAperture(FlatHost)
}

/** Genuine introductory513px clock, retained original Jc() facts. The dial is
 * ordinary document content; only its three-circle burst is viewport-fixed.
 * Source offsetHeight rounds the section height, independently of CSS sizing.
 * This does not add the later697px dial, an invented pin or a wall clock. */
type FormatDetailsPrivate_FormatIntroClockGeometry = { sectionTop: number; sectionHeight: number; clockLeft: number; clockTop: number; physicalUnit: number }
function FormatDetailsPrivate_formatIntroClockPose(width: number, height: number, scroll: number, geometry?: FormatDetailsPrivate_FormatIntroClockGeometry) {
    const unit = Math.max(1, width) / 1440, viewport = Math.max(1, height), physicalUnit = geometry?.physicalUnit ?? unit
    const sectionTop = geometry?.sectionTop ?? 1554 * unit, sectionHeight = geometry?.sectionHeight ?? Math.round(513 * unit)
    const clamp = (value: number) => Math.max(0, Math.min(1, value)), cubicOut = (value: number) => 1 - (1 - value) ** 3
    const quadratic = (value: number) => value < .5 ? 2 * value * value : 1 - (-2 * value + 2) ** 2 / 2
    const cubic = (value: number) => value < .5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2
    const n = sectionHeight / 2 + viewport / 2, b = .763 * viewport, runway = n + 1.44 * b
    const time = Math.max(0, Math.min(runway, scroll - (sectionTop - viewport))), after = time - n
    const angle = after <= 0 ? 330 * clamp(time / n) : 330 + 60 * cubicOut(clamp(after / b))
    const diameter = Math.ceil(Math.hypot(Math.max(1, width), viewport)), onset = .82 * n, growthEnd = n + b
    const progress = clamp((time - onset) / (growthEnd - onset)), pivot = (n - onset) / (growthEnd - onset)
    const seed = 16.3041 * physicalUnit / diameter, dotScale = (seed ** (1 / (1 - quadratic(pivot)))) ** (1 - quadratic(progress))
    const rim = 220.2 - 32.3, inside = clamp((513 / 2 - dotScale * diameter / (2 * physicalUnit)) / rim), blend = inside * inside * (3 - 2 * inside)
    const clockX = (geometry?.clockLeft ?? (width - 513 * unit) / 2) + 256.5 * physicalUnit
    const clockY = (geometry?.clockTop ?? sectionTop - scroll) + 256.5 * physicalUnit
    const orbit = (330 + 120 * cubicOut(clamp(after / b))) * Math.PI / 180
    const centerX = clockX + (width / 2 - clockX) * (1 - blend), centerY = clockY + (viewport / 2 - clockY) * (1 - blend)
    return { unit, time, runway, angle, active: ((Math.round(angle / 30) % 12) + 12) % 12, diameter,
        x: centerX + rim * blend * physicalUnit * Math.cos(orbit), y: centerY + rim * blend * physicalUnit * Math.sin(orbit),
        dotOpacity: clamp((time - onset) / ((n - onset) * .5)), dotScale,
        lightScale: cubic(clamp((after - .22 * b) / b)), darkScale: cubic(clamp((after - .44 * b) / b)) }
}
type FormatDetailsPrivate_FormatIntroClockPose = ReturnType<typeof FormatDetailsPrivate_formatIntroClockPose>
type FormatDetailsPrivate_FormatIntroClockFrame = { x: number; y: number; inverse: string }
type FormatDetailsPrivate_FormatIntroClockState = { live: boolean; enabled: boolean; unit: number; pose: FormatDetailsPrivate_FormatIntroClockPose; frame: FormatDetailsPrivate_FormatIntroClockFrame; register: (role: "dial" | "burst", node: HTMLElement) => () => void }
const FormatDetailsPrivate_FORMAT_INTRO_CLOCK_STILL = FormatDetailsPrivate_formatIntroClockPose(1440, 810, 0)
const FormatDetailsPrivate_FORMAT_INTRO_CLOCK_FRAME = { x: 0, y: 0, inverse: "matrix(1,0,0,1,0,0)" }
const FormatDetailsPrivate_FORMAT_INTRO_CLOCK_REVISION = {}
const FormatDetailsPrivate_FormatIntroClockContext = React.createContext<FormatDetailsPrivate_FormatIntroClockState>({ live: false, enabled: false, unit: 1, pose: FormatDetailsPrivate_FORMAT_INTRO_CLOCK_STILL, frame: FormatDetailsPrivate_FORMAT_INTRO_CLOCK_FRAME, register: () => () => {} })

/** A zero-size owned fixed host gives three affine probes without querying
 * Framer's private DOM. Counter-transform its 2D containing-block matrix so
 * the native circles keep viewport dimensions under scale/rotation/borders.
 * Only this host's owned translate is changed temporarily and restored. */
function FormatDetailsPrivate_formatIntroClockFrame(node: HTMLElement, targetX: number, targetY: number): FormatDetailsPrivate_FormatIntroClockFrame | null {
    const previous = node.style.getPropertyValue("translate"), priority = node.style.getPropertyPriority("translate")
    try {
        node.style.setProperty("translate", "0px 0px"); const origin = node.getBoundingClientRect()
        if (origin.width > .000001 || origin.height > .000001) return null
        // Wide basis vectors avoid magnifying DOMRect quantization after a
        // long document scroll; this zero-size host never changes layout.
        node.style.setProperty("translate", "256px 0px"); const horizontal = node.getBoundingClientRect()
        node.style.setProperty("translate", "0px 256px"); const vertical = node.getBoundingClientRect()
        const a = (horizontal.left - origin.left) / 256, b = (horizontal.top - origin.top) / 256, c = (vertical.left - origin.left) / 256, d = (vertical.top - origin.top) / 256, determinant = a * d - b * c
        if (!Number.isFinite(determinant) || Math.abs(determinant) < .000001) return null
        const aa = d / determinant, bb = -b / determinant, cc = -c / determinant, dd = a / determinant
        const x = targetX - origin.left, y = targetY - origin.top
        return { x: aa * x + cc * y, y: bb * x + dd * y, inverse: `matrix(${aa},${bb},${cc},${dd},0,0)` }
    } finally { if (previous) node.style.setProperty("translate", previous, priority); else node.style.removeProperty("translate") }
}
export function withFormatIntroClockScene(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const layout = React.useContext(FormatDetailsPrivate_SourceLayoutContext), frozen = FormatDetailsPrivate_frozenTarget(), reduced = FormatDetailsPrivate_useReducedMotion(), live = !frozen && !reduced && !layout.frozen && !layout.phone
        const [host, setHost] = React.useState<HTMLElement | null>(null), [state, setState] = React.useState({ enabled: false, pose: FormatDetailsPrivate_FORMAT_INTRO_CLOCK_STILL, frame: FormatDetailsPrivate_FORMAT_INTRO_CLOCK_FRAME })
        const parts = React.useRef(new Map<"dial" | "burst", HTMLElement>()), wake = React.useRef<() => void>(() => {}), sizing = React.useRef<ResizeObserver | null>(null)
        const register = React.useCallback((role: "dial" | "burst", node: HTMLElement) => {
            const previous = parts.current.get(role)
            if (role === "dial" && previous) sizing.current?.unobserve(previous)
            parts.current.set(role, node)
            if (role === "dial") sizing.current?.observe(node)
            wake.current()
            return () => { if (parts.current.get(role) === node) { if (role === "dial") sizing.current?.unobserve(node); parts.current.delete(role) } }
        }, [])
        const bind = React.useCallback((node: HTMLElement | null) => { setHost(old => old === node ? old : node); FormatDetailsPrivate_writeRef(ref, node) }, [ref])
        FormatDetailsPrivate_useOwnLayoutEffect(() => {
            if (!host || !live) { setState(old => old.enabled ? { ...old, enabled: false } : old); return }
            let active = true, frame = 0, last = 0
            const cancel = () => { if (frame) cancelAnimationFrame(frame); frame = 0 }
            const read = () => {
                const dial = parts.current.get("dial"), burst = parts.current.get("burst")
                if (!active || document.hidden || !host.isConnected || !dial?.isConnected || !burst?.isConnected || !FormatDetailsPrivate_formatPhotoPainted(host)) return
                if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
                const box = host.getBoundingClientRect(), dialBox = dial.getBoundingClientRect()
                if (box.width <= 0 || box.height <= 0 || host.offsetWidth <= 0) return
                const physicalUnit = layout.layout.unit * box.width / host.offsetWidth
                const pose = FormatDetailsPrivate_formatIntroClockPose(window.innerWidth, window.innerHeight, window.scrollY, { sectionTop: box.top + window.scrollY, sectionHeight: host.offsetHeight, clockLeft: dialBox.left, clockTop: dialBox.top, physicalUnit })
                const position = FormatDetailsPrivate_formatIntroClockFrame(burst, pose.x, pose.y)
                if (!position) return
                setState(old => old.enabled && (Object.keys(pose) as (keyof FormatDetailsPrivate_FormatIntroClockPose)[]).every(key => old.pose[key] === pose[key]) && old.frame.x === position.x && old.frame.y === position.y && old.frame.inverse === position.inverse ? old : { enabled: true, pose, frame: position })
            }
            const tick = (now: number) => { frame = 0; if (!active || document.hidden || !FormatDetailsPrivate_formatPhotoPainted(host)) return; if (now - last < 1000 / 30) { frame = requestAnimationFrame(tick); return }; last = now; read() }
            const schedule = () => { if (active && host.isConnected && !document.hidden && FormatDetailsPrivate_formatPhotoPainted(host) && !frame) frame = requestAnimationFrame(tick) }
            const visibility = () => { if (document.hidden) cancel(); else schedule() }
            const completion = (event: Event) => { const target = event.target; if (target instanceof Element && target.contains(host)) schedule() }
            wake.current = schedule; last = performance.now(); read()
            const resize = new ResizeObserver(schedule), paint = new MutationObserver(() => { if (!FormatDetailsPrivate_formatPhotoPainted(host)) cancel(); else schedule() })
            sizing.current = resize
            resize.observe(host); resize.observe(parts.current.get("dial") ?? host)
            for (let node: HTMLElement | null = host; node; node = node.parentElement) paint.observe(node, { attributes: true, attributeFilter: ["style", "class", "hidden"] })
            window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule); document.addEventListener("visibilitychange", visibility)
            document.addEventListener("transitionend", completion, true); document.addEventListener("animationend", completion, true)
            return () => { active = false; cancel(); if (wake.current === schedule) wake.current = () => {}; if (sizing.current === resize) sizing.current = null; resize.disconnect(); paint.disconnect(); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); document.removeEventListener("visibilitychange", visibility); document.removeEventListener("transitionend", completion, true); document.removeEventListener("animationend", completion, true) }
        }, [host, live, layout.layout.unit, FormatDetailsPrivate_FORMAT_INTRO_CLOCK_REVISION])
        // Existing native story groups are auto-level transform contexts.
        // A new local level0 preserves the source's relative content order;
        // source level1 would incorrectly cover every later native group.
        const unit = layout.layout.unit, availableWidth = live && typeof document !== "undefined" ? document.documentElement.clientWidth : layout.width, style: React.CSSProperties | undefined = layout.phone ? { ...props.style, display: "none" } : live ? { ...props.style, ...FormatDetailsPrivate_FORMAT_POSTER_PHOTO_FLAT, position: "absolute", left: 0, top: 1554 * unit, width: availableWidth, height: 513 * unit, overflow: "visible", zIndex: 0, pointerEvents: "none" } as FormatDetailsPrivate_DetailStyle : props.style
        const pose = live && state.enabled ? state.pose : FormatDetailsPrivate_FORMAT_INTRO_CLOCK_STILL
        return <FormatDetailsPrivate_FormatIntroClockContext.Provider value={{ ...state, enabled: live && state.enabled, pose, live, unit, register }}><Component {...props} ref={bind} data-format-intro-clock-scene="ordinary-source-flow" data-format-intro-clock-time={pose.time} style={style} /></FormatDetailsPrivate_FormatIntroClockContext.Provider>
    })
}
export function withFormatIntroClockDial(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const state = React.useContext(FormatDetailsPrivate_FormatIntroClockContext), remove = React.useRef<(() => void) | null>(null)
        const bind = React.useCallback((node: HTMLElement | null) => { remove.current?.(); remove.current = node ? state.register("dial", node) : null; FormatDetailsPrivate_writeRef(ref, node) }, [state.register, ref])
        return <Component {...props} ref={bind} data-format-intro-clock-dial="genuine-513px-anchor" style={state.live ? { ...props.style, position: "absolute", left: "50%", top: 0, width: 513 * state.unit, height: 513 * state.unit, transform: "none", translate: "-50% 0px", rotate: "none", scale: "none", overflow: "visible", borderRadius: "50%", backgroundColor: "#ffffff" } as FormatDetailsPrivate_DetailStyle : props.style} />
    })
}
export function withFormatIntroClockMark(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const state = React.useContext(FormatDetailsPrivate_FormatIntroClockContext), [index, setIndex] = React.useState(-1), id = React.useId().replace(/[^\w-]/g, "_")
        const bind = React.useCallback((node: HTMLElement | null) => { const match = node?.id.match(/^format-intro-clock-mark-(\d+)$/); setIndex(match && Number(match[1]) < 12 ? Number(match[1]) : -1); FormatDetailsPrivate_writeRef(ref, node) }, [ref])
        const live = state.live && index >= 0, u = state.unit, angle = index * 30, ink = index === state.pose.active ? "#000000" : "#bfbfbf"
        const style = live ? { ...props.style, position: "absolute", left: (256.5 + 220.2 * Math.cos(angle * Math.PI / 180)) * u, top: (256.5 + 220.2 * Math.sin(angle * Math.PI / 180)) * u, width: 46 * u, height: 11 * u, transform: `translate(-50%,-50%) rotate(${angle}deg)`, translate: "none", rotate: "none", scale: "none", color: ink, fontSize: 12 * u, lineHeight: .9, letterSpacing: "normal", textAlign: "right", whiteSpace: "nowrap" } as FormatDetailsPrivate_DetailStyle : props.style
        return <><Component {...props} ref={bind} data-format-intro-clock-mark={id} data-format-intro-clock-active={index === state.pose.active} style={style} />{live && <style>{`[data-format-intro-clock-mark="${id}"],[data-format-intro-clock-mark="${id}"] *{font-size:${12 * u}px!important;line-height:.9!important;letter-spacing:normal!important;color:${ink}!important;text-align:right!important}`}</style>}</>
    })
}
export function withFormatIntroClockHand(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const state = React.useContext(FormatDetailsPrivate_FormatIntroClockContext), u = state.unit
        return <Component {...props} ref={ref} data-format-intro-clock-angle={state.pose.angle} style={state.live ? { ...props.style, position: "absolute", left: 255 * u, top: 247 * u, width: 197 * u, height: 19 * u, transform: `rotate(${state.pose.angle}deg)`, transformOrigin: "0 50%", translate: "none", rotate: "none", scale: "none", color: "#000000" } as FormatDetailsPrivate_DetailStyle : props.style} />
    })
}
export function withFormatIntroClockHandPart(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const state = React.useContext(FormatDetailsPrivate_FormatIntroClockContext), [part, setPart] = React.useState(""), id = React.useId().replace(/[^\w-]/g, "_")
        const bind = React.useCallback((node: HTMLElement | null) => { const match = node?.id.match(/^format-intro-clock-hand-(near|far|rule)$/); setPart(match?.[1] ?? ""); FormatDetailsPrivate_writeRef(ref, node) }, [ref])
        const live = state.live && Boolean(part), u = state.unit, rule = part === "rule", size = part === "near" ? 8 : 12
        const style = live ? { ...props.style, position: "absolute", left: part === "far" ? 165 * u : 0, top: (rule ? 18 : part === "near" ? 2 : 0) * u, ...(rule ? { width: 196 * u, height: 1, backgroundColor: "#000000" } : { color: "#000000", fontSize: size * u, lineHeight: 1.5, letterSpacing: "normal", textAlign: "left", whiteSpace: "nowrap" }) } as FormatDetailsPrivate_DetailStyle : props.style
        return <><Component {...props} ref={bind} data-format-intro-clock-hand-part={id} style={style} />{live && !rule && <style>{`[data-format-intro-clock-hand-part="${id}"],[data-format-intro-clock-hand-part="${id}"] *{font-size:${size * u}px!important;line-height:1.5!important;letter-spacing:normal!important;text-align:left!important;color:#000!important}`}</style>}</>
    })
}
export function withFormatIntroClockBurst(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const state = React.useContext(FormatDetailsPrivate_FormatIntroClockContext), remove = React.useRef<(() => void) | null>(null)
        const bind = React.useCallback((node: HTMLElement | null) => { remove.current?.(); remove.current = node ? state.register("burst", node) : null; FormatDetailsPrivate_writeRef(ref, node) }, [state.register, ref])
        return <Component {...props} ref={bind} data-format-intro-clock-burst="viewport-frame" style={state.live ? { ...props.style, ...FormatDetailsPrivate_FORMAT_POSTER_PHOTO_FLAT, position: "fixed", left: 0, top: 0, width: 0, height: 0, minWidth: 0, minHeight: 0, maxWidth: 0, maxHeight: 0, padding: 0, borderWidth: 0, transformOrigin: "0 0", translate: `${state.frame.x}px ${state.frame.y}px`, transform: state.frame.inverse, overflow: "visible", zIndex: 10, opacity: state.enabled ? 1 : 0, pointerEvents: "none" } as FormatDetailsPrivate_DetailStyle : props.style} />
    })
}
export function withFormatIntroClockBall(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const state = React.useContext(FormatDetailsPrivate_FormatIntroClockContext), [part, setPart] = React.useState(""), bind = React.useCallback((node: HTMLElement | null) => { const match = node?.id.match(/^format-intro-clock-ball-(dot|light|dark)$/); setPart(match?.[1] ?? ""); FormatDetailsPrivate_writeRef(ref, node) }, [ref])
        const pose = state.pose, scale = part === "dot" ? pose.dotScale : part === "light" ? pose.lightScale : pose.darkScale
        return <Component {...props} ref={bind} data-format-intro-clock-ball={part} style={state.live && part ? { ...props.style, position: "absolute", left: 0, top: 0, width: pose.diameter, height: pose.diameter, marginLeft: -pose.diameter / 2, marginTop: -pose.diameter / 2, borderRadius: "50%", backgroundColor: part === "dot" ? "#000000" : part === "light" ? "#ffffff" : "#222222", transformOrigin: "50% 50%", transform: `scale(${scale})`, translate: "none", rotate: "none", scale: "none", opacity: part === "dot" ? pose.dotOpacity : 1, pointerEvents: "none" } as FormatDetailsPrivate_DetailStyle : props.style} />
    })
}

/** Eighteen source Notes: exact geometry/tails/wave, independently paraphrased copy.
 * Original Ku/Xc/CSS facts are retained in the source audit; original sentences
 * are not copied into the prototype. Native paper/body/tail/RTE parts stay editable.
 * Only finite layout refreshes measure anchors. Scrolling does not chase artwork.
 */
type FormatDetailsPrivate_FormatNoteSpec = { anchor: string; side: "left" | "right" | "up" | "down"; tail: "start" | "end"; from: "top" | "bottom"; dx: number; dy: number; height: number; copyWidth: number; copy: string }
const FormatDetailsPrivate_FORMAT_NOTES: readonly FormatDetailsPrivate_FormatNoteSpec[] = [
    {
        "anchor": "block-one__card",
        "side": "right",
        "tail": "start",
        "from": "top",
        "dx": -147,
        "dy": 0,
        "height": 41,
        "copyWidth": 92,
        "copy": "Vertical framing gives upright lines more influence."
    },
    {
        "anchor": "block-one__round",
        "side": "left",
        "tail": "start",
        "from": "top",
        "dx": 75,
        "dy": 33,
        "height": 33,
        "copyWidth": 84,
        "copy": "The hands show Berlin time, including daylight saving."
    },
    {
        "anchor": "block-one__card",
        "side": "left",
        "tail": "start",
        "from": "top",
        "dx": 341,
        "dy": 317,
        "height": 33,
        "copyWidth": 87,
        "copy": "Make the vertical structure carry the composition."
    },
    {
        "anchor": "wide",
        "side": "down",
        "tail": "start",
        "from": "top",
        "dx": 824,
        "dy": -38,
        "height": 33,
        "copyWidth": 88,
        "copy": "Split one format into several smaller formats."
    },
    {
        "anchor": "screens__card",
        "side": "left",
        "tail": "start",
        "from": "top",
        "dx": 341,
        "dy": 96,
        "height": 41,
        "copyWidth": 89,
        "copy": "Here, the composition pairs a slender vertical strip with a wide horizontal block."
    },
    {
        "anchor": "clock",
        "side": "right",
        "tail": "start",
        "from": "top",
        "dx": -146,
        "dy": 251,
        "height": 41,
        "copyWidth": 92,
        "copy": "With a circular frame, radii and diameters become useful organizing lines."
    },
    {
        "anchor": "clock",
        "side": "left",
        "tail": "start",
        "from": "top",
        "dx": 519,
        "dy": 251,
        "height": 33,
        "copyWidth": 89,
        "copy": "Let movement follow the shape of the circular frame."
    },
    {
        "anchor": "tile",
        "side": "down",
        "tail": "start",
        "from": "top",
        "dx": 10,
        "dy": -47,
        "height": 41,
        "copyWidth": 89,
        "copy": "A frame like this naturally pulls the eye toward its middle."
    },
    {
        "anchor": "pill",
        "side": "down",
        "tail": "start",
        "from": "top",
        "dx": 259,
        "dy": -47,
        "height": 41,
        "copyWidth": 83,
        "copy": "Let the content respond to the outline that contains it, rather than fighting it."
    },
    {
        "anchor": "side-a",
        "side": "down",
        "tail": "end",
        "from": "top",
        "dx": -29,
        "dy": 45,
        "height": 41,
        "copyWidth": 89,
        "copy": "Centered alignment gains strength from the geometry of this particular frame."
    },
    {
        "anchor": "tri",
        "side": "left",
        "tail": "start",
        "from": "top",
        "dx": 515,
        "dy": 390,
        "height": 41,
        "copyWidth": 83,
        "copy": "Put a complex frame’s edges to work: let them create visual tension."
    },
    {
        "anchor": "deck",
        "side": "left",
        "tail": "start",
        "from": "top",
        "dx": 341,
        "dy": 0,
        "height": 33,
        "copyWidth": 90,
        "copy": "An upright format, organized by upright lines."
    },
    {
        "anchor": "fan__disc",
        "side": "down",
        "tail": "end",
        "from": "top",
        "dx": -88,
        "dy": 114,
        "height": 41,
        "copyWidth": 89,
        "copy": "Let an object’s physical behavior inform the way this format moves."
    },
    {
        "anchor": "win__plate--west",
        "side": "down",
        "tail": "start",
        "from": "top",
        "dx": 0,
        "dy": -47,
        "height": 41,
        "copyWidth": 83,
        "copy": "Try less expected ways of fitting different formats together."
    },
    {
        "anchor": "vee__card--west",
        "side": "down",
        "tail": "start",
        "from": "top",
        "dx": 178,
        "dy": -39,
        "height": 33,
        "copyWidth": 83,
        "copy": "Horizontal structure supports a horizontal frame."
    },
    {
        "anchor": "vee__plate",
        "side": "left",
        "tail": "start",
        "from": "top",
        "dx": 526,
        "dy": 375,
        "height": 41,
        "copyWidth": 89,
        "copy": "Echo the frame’s geometry in its inner shapes to create a repeating visual rhythm."
    },
    {
        "anchor": "poster",
        "side": "left",
        "tail": "start",
        "from": "top",
        "dx": 1280,
        "dy": 20,
        "height": 57,
        "copyWidth": 89,
        "copy": "On a screen this looks horizontal. Its physical form is vertical, with a composition designed to read comfortably in either orientation."
    },
    {
        "anchor": "field",
        "side": "up",
        "tail": "start",
        "from": "bottom",
        "dx": 0,
        "dy": 3,
        "height": 49,
        "copyWidth": 92,
        "copy": "Repeat a few visual rules across different formats so they read as a connected family."
    }
]
type FormatDetailsPrivate_FormatNoteBox = { left: number; top: number; width: number; height: number }
type FormatDetailsPrivate_FormatNoteGeometry = { paper: FormatDetailsPrivate_FormatNoteBox; body: FormatDetailsPrivate_FormatNoteBox; tail: FormatDetailsPrivate_FormatNoteBox & { clip: string }; label: { left: number; top: number }; copy: { left: number; top: number; width: number } }
function FormatDetailsPrivate_formatNoteGeometry(note: FormatDetailsPrivate_FormatNoteSpec, unit: number, anchor: { left: number; top: number; bottom: number }, root: { left: number; top: number }): FormatDetailsPrivate_FormatNoteGeometry {
    const pad = Math.max(1, Math.round(3 * unit)), width = Math.round(140 * unit), height = Math.round(note.height * unit), left = note.side === "left" ? pad : 0, top = note.side === "up" ? pad : 0, horizontal = note.side === "up" || note.side === "down"
    const tail = note.side === "right" ? { left: width, top: 0, width: pad, height: pad, clip: "polygon(0 0,100% 0,0 100%)" }
        : note.side === "left" ? { left: 0, top: 0, width: pad, height: pad, clip: "polygon(0 0,100% 0,100% 100%)" }
        : note.side === "up" ? { left: 0, top: 0, width: pad, height: pad, clip: "polygon(0 0,100% 100%,0 100%)" }
        : { left: note.tail === "end" ? width - pad : 0, top: height, width: pad, height: pad, clip: note.tail === "end" ? "polygon(0 0,100% 0,100% 100%)" : "polygon(0 0,100% 0,0 100%)" }
    return { paper: { left: Math.round(anchor.left - root.left + note.dx * unit) - left, top: Math.round((note.from === "bottom" ? anchor.bottom : anchor.top) - root.top + note.dy * unit), width: horizontal ? width : width + pad, height: horizontal ? height + pad : height }, body: { left, top, width, height }, tail, label: { left: Math.round(10 * unit) + left, top: Math.round(6 * unit) + top }, copy: { left: Math.round(41 * unit) + left, top: Math.round(8 * unit) + top, width: Math.round(note.copyWidth * unit) } }
}
function FormatDetailsPrivate_formatNotesWave(boxes: readonly ({ top: number; bottom: number } | null)[], height: number) {
    const visible = boxes.map((box, index) => ({ box, index })).filter(row => row.box && row.box.bottom > 0 && row.box.top < height).sort((a, b) => a.box!.top - b.box!.top), delays = boxes.map(() => 0)
    visible.forEach((row, order) => { delays[row.index] = order * .05 }); return delays
}
function FormatDetailsPrivate_formatNoteClip(note: FormatDetailsPrivate_FormatNoteSpec, pad: number) {
    if (note.side === "right") return `polygon(0 0,100% 0,calc(100% - ${pad}px) ${pad}px,calc(100% - ${pad}px) 100%,0 100%)`
    if (note.side === "left") return `polygon(0 0,100% 0,100% 100%,${pad}px 100%,${pad}px ${pad}px)`
    if (note.side === "up") return `polygon(0 0,${pad}px ${pad}px,100% ${pad}px,100% 100%,0 100%)`
    return note.tail === "end" ? `polygon(0 0,100% 0,100% 100%,calc(100% - ${pad}px) calc(100% - ${pad}px),0 calc(100% - ${pad}px))` : `polygon(0 0,100% 0,100% calc(100% - ${pad}px),${pad}px calc(100% - ${pad}px),0 100%)`
}
type FormatDetailsPrivate_FormatNotesState = { unit: number; enabled: boolean; daughter: boolean; animate: boolean; poses: readonly (FormatDetailsPrivate_FormatNoteGeometry | null)[]; delays: readonly number[] }
type FormatDetailsPrivate_FormatNotesAnchor = { node: HTMLElement; rect?: readonly [number, number, number, number] }
type FormatDetailsPrivate_FormatNotesAPI = { state: FormatDetailsPrivate_FormatNotesState; anchor: (key: string, node: HTMLElement, rect?: readonly [number, number, number, number]) => () => void; paper: (index: number, node: HTMLElement) => () => void; layer: (node: HTMLElement) => () => void; mode: (node: HTMLElement, notes: boolean, daughter: boolean) => void }
const FormatDetailsPrivate_FORMAT_NOTES_REVISION = {}
const FormatDetailsPrivate_FORMAT_NOTES_EMPTY: FormatDetailsPrivate_FormatNotesState = { unit: 1, enabled: false, daughter: false, animate: false, poses: FormatDetailsPrivate_FORMAT_NOTES.map(() => null), delays: FormatDetailsPrivate_FORMAT_NOTES.map(() => 0) }
const FormatDetailsPrivate_FormatNotesContext = React.createContext<FormatDetailsPrivate_FormatNotesAPI>({ state: FormatDetailsPrivate_FORMAT_NOTES_EMPTY, anchor: () => () => {}, paper: () => () => {}, layer: () => () => {}, mode: () => {} })
const FormatDetailsPrivate_FormatNotePaperContext = React.createContext({ index: 0, geometry: FormatDetailsPrivate_formatNoteGeometry(FormatDetailsPrivate_FORMAT_NOTES[0], 1, { left: 0, top: 0, bottom: 0 }, { left: 0, top: 0 }), unit: 1 })
function FormatDetailsPrivate_formatNotesDocument(Component: FormatDetailsPrivate_NativeLayer): FormatDetailsPrivate_NativeLayer {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const layout = React.useContext(FormatDetailsPrivate_SourceLayoutContext), anchors = React.useRef(new Map<string, FormatDetailsPrivate_FormatNotesAnchor>()), papers = React.useRef(new Map<number, HTMLElement>()), layer = React.useRef<HTMLElement | null>(null), mode = React.useRef({ notes: false, daughter: false }), enabled = React.useRef(false), wake = React.useRef<() => void>(() => {}), sizing = React.useRef<ResizeObserver | null>(null)
        const [state, setState] = React.useState<FormatDetailsPrivate_FormatNotesState>(FormatDetailsPrivate_FORMAT_NOTES_EMPTY)
        const registerAnchor = React.useCallback((key: string, node: HTMLElement, rect?: readonly [number, number, number, number]) => {
            const previous = anchors.current.get(key); if (previous) sizing.current?.unobserve(previous.node)
            const row = { node, rect }; anchors.current.set(key, row); sizing.current?.observe(node); wake.current()
            return () => { if (anchors.current.get(key) === row) { anchors.current.delete(key); sizing.current?.unobserve(node); wake.current() } }
        }, [])
        const registerPaper = React.useCallback((index: number, node: HTMLElement) => { papers.current.set(index, node); wake.current(); return () => { if (papers.current.get(index) === node) { papers.current.delete(index); wake.current() } } }, [])
        const registerLayer = React.useCallback((node: HTMLElement) => {
            const previous = layer.current; if (previous) sizing.current?.unobserve(previous)
            layer.current = node; sizing.current?.observe(node); wake.current()
            return () => { if (layer.current === node) { layer.current = null; sizing.current?.unobserve(node); mode.current = { notes: false, daughter: false }; wake.current() } }
        }, [])
        const publish = React.useCallback((node: HTMLElement, notes: boolean, daughter: boolean) => { if (layer.current !== node) return; mode.current = { notes, daughter }; wake.current() }, [])
        FormatDetailsPrivate_useOwnLayoutEffect(() => {
            if (layout.frozen || layout.phone) { enabled.current = false; setState(previous => previous.enabled || previous.daughter || previous.animate ? { ...previous, enabled: false, daughter: false, animate: false } : previous); return }
            let active = true, frame = 0
            const media = window.matchMedia("(prefers-reduced-motion: reduce)")
            const read = () => {
                frame = 0; if (!active) return
                const root = layer.current, unit = window.innerWidth / 1440
                if (!root?.isConnected) { enabled.current = false; setState(previous => previous.enabled || previous.daughter ? { ...previous, enabled: false, daughter: false } : previous); return }
                const rootBox = root.getBoundingClientRect(), boxes = new Map<string, { left: number; top: number; bottom: number }>()
                for (const [key, row] of anchors.current) {
                    if (!row.node.isConnected) continue
                    const box = row.node.getBoundingClientRect()
                    if (row.rect) { const scale = box.width / Math.max(1, parseFloat(getComputedStyle(row.node).width)), [x, y, , height] = row.rect; boxes.set(key, { left: box.left + x * scale, top: box.top + y * scale, bottom: box.top + (y + height) * scale }) }
                    else boxes.set(key, box)
                }
                const poses = FormatDetailsPrivate_FORMAT_NOTES.map(note => { const box = boxes.get(note.anchor); return box ? FormatDetailsPrivate_formatNoteGeometry(note, unit, box, rootBox) : null }), on = mode.current.notes, daughter = mode.current.daughter, animate = !document.hidden && !media.matches, enabling = on && !enabled.current
                const delayBoxes = poses.map((pose, index) => { const node = papers.current.get(index); if (!pose || !node?.isConnected) return null; return { top: rootBox.top + pose.paper.top, bottom: rootBox.top + pose.paper.top + pose.paper.height } })
                const wave = enabling ? FormatDetailsPrivate_formatNotesWave(delayBoxes, window.innerHeight) : null
                enabled.current = on
                setState(previous => {
                    const next: FormatDetailsPrivate_FormatNotesState = { unit, enabled: on, daughter, animate, poses, delays: wave ?? (!on ? FormatDetailsPrivate_FORMAT_NOTES.map(() => 0) : previous.delays) }
                    return JSON.stringify(next) === JSON.stringify(previous) ? previous : next
                })
            }
            const schedule = () => { if (active && !frame) frame = requestAnimationFrame(read) }
            const resize = new ResizeObserver(schedule); sizing.current = resize
            if (layer.current) resize.observe(layer.current)
            for (const row of anchors.current.values()) resize.observe(row.node)
            wake.current = schedule; schedule()
            window.addEventListener("resize", schedule); document.addEventListener("visibilitychange", schedule); media.addEventListener("change", schedule)
            document.fonts?.ready.then(() => { if (active) schedule() })
            return () => { active = false; if (wake.current === schedule) wake.current = () => {}; if (sizing.current === resize) sizing.current = null; resize.disconnect(); if (frame) cancelAnimationFrame(frame); window.removeEventListener("resize", schedule); document.removeEventListener("visibilitychange", schedule); media.removeEventListener("change", schedule) }
        }, [layout.width, layout.height, layout.frozen, layout.phone, FormatDetailsPrivate_FORMAT_NOTES_REVISION])
        return <FormatDetailsPrivate_FormatNotesContext.Provider value={{ state, anchor: registerAnchor, paper: registerPaper, layer: registerLayer, mode: publish }}><Component {...props} ref={ref} /></FormatDetailsPrivate_FormatNotesContext.Provider>
    }) as FormatDetailsPrivate_NativeLayer
}
export function withFormatDocumentAndSourceNotes(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return withFormatRefinedDocument(FormatDetailsPrivate_formatNotesDocument(Component)) }
function FormatDetailsPrivate_formatNotesLayer(Component: FormatDetailsPrivate_NativeLayer): FormatDetailsPrivate_NativeLayer {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const api = React.useContext(FormatDetailsPrivate_FormatNotesContext), frozen = FormatDetailsPrivate_frozenTarget(), own = React.useRef<HTMLElement | null>(null), remove = React.useRef<(() => void) | null>(null), flags = React.useRef({ notes: false, daughter: false })
        flags.current = { notes: props["data-format-notes-enabled"] === "1", daughter: props["data-format-daughter-enabled"] === "1" }
        const bind = React.useCallback((node: HTMLElement | null) => { remove.current?.(); own.current = node; remove.current = node ? api.layer(node) : null; if (node) api.mode(node, flags.current.notes, flags.current.daughter); FormatDetailsPrivate_writeRef(ref, node) }, [api.layer, api.mode, ref])
        FormatDetailsPrivate_useOwnLayoutEffect(() => { if (own.current) api.mode(own.current, props["data-format-notes-enabled"] === "1", props["data-format-daughter-enabled"] === "1") }, [api.mode, props["data-format-notes-enabled"], props["data-format-daughter-enabled"]])
        return <Component {...props} ref={bind} data-format-source-notes-layer="true" aria-hidden="true" style={frozen ? props.style : { ...props.style, position: "absolute", left: 0, top: 0, width: "100%", height: 0, zIndex: 7, overflow: "visible", pointerEvents: "none" }} />
    }) as FormatDetailsPrivate_NativeLayer
}
export function withFormatSourceNotesLayer(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return withFormatNotesStateBridge(FormatDetailsPrivate_formatNotesLayer(Component)) }
function FormatDetailsPrivate_formatNoteAnchor(Component: FormatDetailsPrivate_NativeLayer, key: string, rect?: readonly [number, number, number, number]): FormatDetailsPrivate_NativeLayer {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const api = React.useContext(FormatDetailsPrivate_FormatNotesContext), remove = React.useRef<(() => void) | null>(null), bind = React.useCallback((node: HTMLElement | null) => { remove.current?.(); remove.current = node ? api.anchor(key, node, rect) : null; FormatDetailsPrivate_writeRef(ref, node) }, [api.anchor, key, rect, ref])
        return <Component {...props} ref={bind} />
    }) as FormatDetailsPrivate_NativeLayer
}
const FormatDetailsPrivate_FORMAT_NOTE_VEE_WEST: readonly [number, number, number, number] = [20, 0, 697, 226]
export function withFormatNotesOpeningCard(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNoteAnchor(withFormatOpeningCardFlow(Component), "block-one__card") }
export function withFormatNotesTinyClock(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNoteAnchor(Component, "block-one__round") }
export function withFormatNotesWide(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNoteAnchor(withFormatHorizontalWideFlow(Component), "wide") }
export function withFormatNotesScreens(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNoteAnchor(Component, "screens__card") }
export function withFormatNotesIntroClock(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNoteAnchor(withFormatIntroClockDial(Component), "clock") }
export function withFormatNotesTile(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNoteAnchor(Component, "tile") }
export function withFormatNotesPill(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNoteAnchor(Component, "pill") }
export function withFormatNotesSideA(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNoteAnchor(withFormatRecordSurface(Component), "side-a") }
export function withFormatNotesTriangle(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNoteAnchor(withFormatTriangleFlow(Component), "tri") }
export function withFormatNotesDeck(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNoteAnchor(withFormatLateDeckFlow(Component), "deck") }
export function withFormatNotesFan(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNoteAnchor(withFormatRecordSurface(Component), "fan__disc") }
export function withFormatNotesWindowWest(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNoteAnchor(Component, "win__plate--west") }
export function withFormatNotesVeeWest(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNoteAnchor(withFormatCrossingFlow(Component), "vee__card--west", FormatDetailsPrivate_FORMAT_NOTE_VEE_WEST) }
export function withFormatNotesVeeTriangle(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNoteAnchor(withFormatTriangleOutline(Component), "vee__plate") }
export function withFormatNotesPoster(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNoteAnchor(withFormatCarriedPoster(Component), "poster") }
export function withFormatNotesField(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNoteAnchor(withFormatFieldFlow(Component), "field") }
function FormatDetailsPrivate_formatNotePaper(Component: FormatDetailsPrivate_NativeLayer, index: number): FormatDetailsPrivate_NativeLayer {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const api = React.useContext(FormatDetailsPrivate_FormatNotesContext), frozen = FormatDetailsPrivate_frozenTarget(), remove = React.useRef<(() => void) | null>(null), geometry = api.state.poses[index] ?? FormatDetailsPrivate_formatNoteGeometry(FormatDetailsPrivate_FORMAT_NOTES[index], api.state.unit, { left: 0, top: 0, bottom: 0 }, { left: 0, top: 0 })
        const bind = React.useCallback((node: HTMLElement | null) => { remove.current?.(); remove.current = node ? api.paper(index, node) : null; FormatDetailsPrivate_writeRef(ref, node) }, [api.paper, index, ref]), on = !frozen && api.state.enabled && !!api.state.poses[index], delay = api.state.delays[index] ?? 0
        const transition = !api.state.animate || frozen ? "none" : on ? `opacity 180ms ease ${delay}s, mask-size 340ms ease ${delay}s, -webkit-mask-size 340ms ease ${delay}s` : "opacity 180ms ease 0s, mask-size 0s linear 180ms, -webkit-mask-size 0s linear 180ms", clip = FormatDetailsPrivate_formatNoteClip(FormatDetailsPrivate_FORMAT_NOTES[index], geometry.tail.width)
        return <FormatDetailsPrivate_FormatNotePaperContext.Provider value={{ index, geometry, unit: api.state.unit }}><Component {...props} ref={bind} data-format-source-note={index} aria-hidden="true" style={{ ...props.style, ...(frozen ? {} : { ...geometry.paper, position: "absolute", transform: "translateZ(0)", clipPath: clip, WebkitClipPath: clip }), opacity: on ? 1 : 0, pointerEvents: "none", userSelect: "none", maskImage: "linear-gradient(#000,#000)", WebkitMaskImage: "linear-gradient(#000,#000)", maskSize: on ? "100% 100%" : "100% 0%", WebkitMaskSize: on ? "100% 100%" : "100% 0%", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", transition }} /></FormatDetailsPrivate_FormatNotePaperContext.Provider>
    }) as FormatDetailsPrivate_NativeLayer
}
function FormatDetailsPrivate_formatNotePart(Component: FormatDetailsPrivate_NativeLayer, part: "body" | "tail" | "label" | "copy"): FormatDetailsPrivate_NativeLayer {
    return React.forwardRef<HTMLElement, FormatDetailsPrivate_LayerProps>((props, ref) => {
        const state = React.useContext(FormatDetailsPrivate_FormatNotePaperContext), frozen = FormatDetailsPrivate_frozenTarget(), id = React.useId().replace(/[^\w-]/g, "_"), raw = state.geometry[part], box = part === "tail" ? { left: raw.left, top: raw.top, width: state.geometry.tail.width, height: state.geometry.tail.height } : raw, text = part === "label" || part === "copy", ink = text ? { fontSize: 8 * state.unit, lineHeight: part === "label" ? "normal" : 1, letterSpacing: "normal", color: "#000000", opacity: part === "label" ? .4 : 1, margin: 0, textAlign: "left" as const } : {}, clip = part === "tail" ? { clipPath: frozen ? state.geometry.tail.clip : "none", WebkitClipPath: frozen ? state.geometry.tail.clip : "none" } : {}
        return <><Component {...props} ref={ref} data-format-source-note-part={part} data-format-note-ink={text && !frozen ? id : undefined} style={frozen ? { ...props.style, ...clip } : { ...props.style, ...box, ...ink, ...clip, position: "absolute", pointerEvents: "none" }} />{text && !frozen && <style>{`[data-format-note-ink="${id}"],[data-format-note-ink="${id}"] *{font-size:${8 * state.unit}px!important;line-height:${part === "label" ? "normal" : "1"}!important;letter-spacing:normal!important;color:#000!important;text-align:left!important}`}</style>}</>
    }) as FormatDetailsPrivate_NativeLayer
}
export function withFormatSourceNoteBody(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePart(Component, "body") }
export function withFormatSourceNoteTail(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePart(Component, "tail") }
export function withFormatSourceNoteLabel(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePart(Component, "label") }
export function withFormatSourceNoteCopy(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePart(Component, "copy") }
export function withFormatSourceNote01(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePaper(Component, 0) }
export function withFormatSourceNote02(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePaper(Component, 1) }
export function withFormatSourceNote03(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePaper(Component, 2) }
export function withFormatSourceNote04(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePaper(Component, 3) }
export function withFormatSourceNote05(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePaper(Component, 4) }
export function withFormatSourceNote06(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePaper(Component, 5) }
export function withFormatSourceNote07(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePaper(Component, 6) }
export function withFormatSourceNote08(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePaper(Component, 7) }
export function withFormatSourceNote09(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePaper(Component, 8) }
export function withFormatSourceNote10(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePaper(Component, 9) }
export function withFormatSourceNote11(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePaper(Component, 10) }
export function withFormatSourceNote12(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePaper(Component, 11) }
export function withFormatSourceNote13(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePaper(Component, 12) }
export function withFormatSourceNote14(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePaper(Component, 13) }
export function withFormatSourceNote15(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePaper(Component, 14) }
export function withFormatSourceNote16(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePaper(Component, 15) }
export function withFormatSourceNote17(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePaper(Component, 16) }
export function withFormatSourceNote18(Component: ComponentType<FormatDetailsPrivate_LayerProps>): ComponentType<FormatDetailsPrivate_LayerProps> { return FormatDetailsPrivate_formatNotePaper(Component, 17) }
