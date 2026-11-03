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
