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
