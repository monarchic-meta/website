import {
    createElement,
    forwardRef,
    useCallback,
    useEffect,
    useRef,
    useState,
    type ComponentType,
} from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"

// Optional behavior for the two native homepage navigation studies. Their
// editable layers, dropdowns, links and modal overlays remain owned by Framer.
// Prototype choices: Phone <= 809px; 8px direction hysteresis; 180ms movement.
export const navigationPrototype = {
    phoneMaxWidth: 809,
    directionDistance: 8,
    topTolerance: 1,
    durationMs: 180,
} as const

export type NavigationState = { hidden: boolean; anchorY: number }
export type NavigationSample = {
    y: number
    coverageY: number | null
    mobile: boolean
    keyboardFocus: boolean
}

export function nextNavigationState(
    state: NavigationState,
    sample: NavigationSample
): NavigationState {
    const y = Math.max(0, sample.y)
    if (
        !sample.mobile ||
        sample.keyboardFocus ||
        sample.coverageY === null ||
        y <= Math.max(navigationPrototype.topTolerance, sample.coverageY)
    ) {
        return { hidden: false, anchorY: y }
    }
    const distance = y - state.anchorY
    if (Math.abs(distance) < navigationPrototype.directionDistance) return state
    return { hidden: distance > 0, anchorY: y }
}

export function bannerCoverageY(
    bannerBottom: number,
    scrollY: number,
    navigationHeight: number
): number {
    return Math.max(0, bannerBottom + scrollY - navigationHeight)
}

type ViewState = { hidden: boolean; reducedMotion: boolean }
type ControllerOptions = {
    root: HTMLElement
    banner: HTMLElement | null
    win: Window & typeof globalThis
    doc: Document
    onChange: (state: ViewState) => void
}

const modalLabels = new Set(["Open full navigation", "Search Monarchic"])
const closeLabels = new Set(["Close full navigation", "Close search"])
const bannerJourneys = new WeakMap<Window, { covered: boolean }>()
const bannerVisibility = new WeakMap<
    HTMLElement,
    { prior: string; owners: Set<symbol> }
>()

function concealBanner(banner: HTMLElement, owner: symbol): void {
    let record = bannerVisibility.get(banner)
    if (!record) {
        record = { prior: banner.style.visibility || "", owners: new Set() }
        bannerVisibility.set(banner, record)
    }
    record.owners.add(owner)
    banner.style.visibility = "hidden"
}

function releaseBanner(banner: HTMLElement, owner: symbol): void {
    const record = bannerVisibility.get(banner)
    if (!record) return
    record.owners.delete(owner)
    if (!record.owners.size) {
        banner.style.visibility = record.prior
        bannerVisibility.delete(banner)
    }
}

function visiblePageBanner(
    root: HTMLElement,
    doc: Document,
    fallback: HTMLElement | null
): HTMLElement | null {
    // Responsive page variants can coexist in the DOM. Choose the visible
    // banner nearest this native header, rather than the first duplicate ID.
    for (let parent = root.parentElement; parent; parent = parent.parentElement) {
        const candidates = parent.querySelectorAll<HTMLElement>(
            '[id="homepage-rd-banner"]'
        )
        for (const candidate of candidates) {
            if (candidate.getBoundingClientRect().height > 0) return candidate
        }
    }
    const candidate = fallback?.isConnected
        ? fallback
        : doc.getElementById("homepage-rd-banner")
    return candidate?.isConnected && candidate.getBoundingClientRect().height !== 0
        ? candidate
        : null
}

// Native dropdown and overlay events pass through unchanged. Their dismissal
// stays with Framer; this controller only restores context after a native close.
export function createNavigationController({
    root,
    banner,
    win,
    doc,
    onChange,
}: ControllerOptions): { dispose: () => void } {
    const phone = win.matchMedia(
        `(max-width: ${navigationPrototype.phoneMaxWidth}px)`
    )
    const reduced = win.matchMedia("(prefers-reduced-motion: reduce)")
    let state: NavigationState = { hidden: false, anchorY: win.scrollY }
    let preparedActivation: string | null = null
    let pendingPointerModal: { opener: HTMLElement; label: string } | null = null
    let keyboardMode = false
    let frame = 0
    let restoreFrame = 0
    let closeIntent = false
    let disposed = false
    let modal: { x: number; y: number; opener: HTMLElement; label: string } | null = null
    const visibilityOwner = Symbol("homepage-navigation-banner")
    const ownedBanners = new Set<HTMLElement>()
    let journey = bannerJourneys.get(win)
    if (!journey) {
        journey = { covered: false }
        bannerJourneys.set(win, journey)
    }

    const releaseBanners = () => {
        for (const item of ownedBanners) releaseBanner(item, visibilityOwner)
        ownedBanners.clear()
    }

    const emit = () =>
        onChange({ hidden: state.hidden, reducedMotion: reduced.matches })
    const focusWithoutScroll = (element: HTMLElement | null) => {
        const label = element?.getAttribute("aria-label")
        const current = element?.isConnected
            ? element
            : label
              ? Array.from(root.querySelectorAll<HTMLElement>("button[aria-label]")).find(
                    button => button.getAttribute("aria-label") === label
                )
              : null
        if (current?.isConnected) current.focus({ preventScroll: true })
    }
    const triggerFor = (target: EventTarget | null): HTMLElement | null => {
        if (!(target instanceof win.Element)) return null
        const trigger = target.closest<HTMLElement>("button[aria-label]")
        if (!trigger || !root.contains(trigger)) return null
        const label = trigger.getAttribute("aria-label") || ""
        return modalLabels.has(label) ? trigger : null
    }
    const closeFor = (target: EventTarget | null): boolean => {
        if (!(target instanceof win.Element)) return false
        const close = target.closest("button[aria-label]")
        return !!close && closeLabels.has(close.getAttribute("aria-label") || "")
    }
    const sample = () => {
        if (disposed || modal) return
        const navigationHeight = root.getBoundingClientRect().height
        if (navigationHeight <= 0) {
            releaseBanners()
            const changed = state.hidden
            state = { hidden: false, anchorY: Math.max(0, win.scrollY) }
            if (changed) emit()
            return
        }
        const focused =
            keyboardMode && !!doc.activeElement && root.contains(doc.activeElement)
        const measuredBanner = visiblePageBanner(root, doc, banner)
        const coverage = measuredBanner
            ? bannerCoverageY(
                  measuredBanner.getBoundingClientRect().bottom,
                  win.scrollY,
                  navigationHeight
              )
            : null
        if (win.scrollY <= navigationPrototype.topTolerance) journey.covered = false
        else if (coverage !== null && win.scrollY >= coverage) journey.covered = true
        if (journey.covered && measuredBanner) {
            // Once covered, hide paint while retaining the banner's layout.
            // Sliding the header away must not expose a remaining banner strip;
            // reversing near the top must not reveal it before true page top.
            for (const item of ownedBanners) {
                if (item !== measuredBanner) {
                    releaseBanner(item, visibilityOwner)
                    ownedBanners.delete(item)
                }
            }
            concealBanner(measuredBanner, visibilityOwner)
            ownedBanners.add(measuredBanner)
        } else releaseBanners()
        const next = nextNavigationState(state, {
            y: win.scrollY,
            coverageY: coverage,
            mobile: phone.matches,
            keyboardFocus: focused,
        })
        const changed = next.hidden !== state.hidden
        state = next
        if (changed) emit()
    }
    const queueSample = () => {
        if (frame || disposed) return
        frame = win.requestAnimationFrame(() => {
            frame = 0
            sample()
        })
    }
    const prepareTrigger = (trigger: HTMLElement) => {
        const label = trigger.getAttribute("aria-label") || ""
        if (modal?.label === label) {
            // A native whileOpen variant may replace the same semantic opener.
            // Keep its original scroll context across down/up/click delivery.
            modal.opener = trigger
            return
        }
        const snapshot = { x: win.scrollX, y: win.scrollY, opener: trigger, label }
        if (modalLabels.has(label)) {
            modal = snapshot
            state = { hidden: false, anchorY: snapshot.y }
            emit()
        }
    }
    const restoreContext = (onlyAfterNativeClose = false) => {
        if (!modal || restoreFrame || disposed) return
        // Two bounded animation frames run after native Tap/close and scroll
        // unlocking. There is no timer loop, polling or mutation observer.
        restoreFrame = win.requestAnimationFrame(() => {
            restoreFrame = win.requestAnimationFrame(() => {
                restoreFrame = 0
                if (disposed || !modal) return
                if (onlyAfterNativeClose) {
                    const label =
                        modal.label === "Open full navigation"
                            ? "Close full navigation"
                            : "Close search"
                    const stillOpen = Array.from(
                        doc.body.querySelectorAll<HTMLElement>("button[aria-label]")
                    ).some(
                        button =>
                            button.getAttribute("aria-label") === label &&
                            button.getBoundingClientRect().height > 0
                    )
                    // Escape belongs to Framer. An open native X means that it
                    // did not close; keep the snapshot for the real X instead.
                    if (stillOpen) return
                }
                const snapshot = modal
                const priorBehavior = doc.documentElement.style.scrollBehavior
                doc.documentElement.style.scrollBehavior = "auto"
                win.scrollTo(snapshot.x, snapshot.y)
                doc.documentElement.style.scrollBehavior = priorBehavior
                focusWithoutScroll(snapshot.opener)
                state = { hidden: false, anchorY: snapshot.y }
                modal = null
                closeIntent = false
                emit()
            })
        })
    }
    const cancelPointerActivation = () => {
        if (!pendingPointerModal) return
        if (modal?.label === pendingPointerModal.label) {
            modal = null
            closeIntent = false
            preparedActivation = null
            if (restoreFrame) win.cancelAnimationFrame(restoreFrame)
            restoreFrame = 0
        }
        pendingPointerModal = null
        sample()
    }
    const onPointerDown = (event: PointerEvent) => {
        if (pendingPointerModal) {
            // A visible native X also establishes that the opener activated,
            // including assistive activation that omitted a pointerup event.
            if (closeFor(event.target)) pendingPointerModal = null
            else cancelPointerActivation()
        }
        keyboardMode = false
        preparedActivation = null
        const trigger = triggerFor(event.target)
        if (trigger) {
            prepareTrigger(trigger)
            const label = trigger.getAttribute("aria-label") || ""
            preparedActivation = label
            if (modalLabels.has(label)) {
                pendingPointerModal = { opener: trigger, label }
            }
        }
        else if (modal && closeFor(event.target)) closeIntent = true
    }
    const onCloseEnd = (event: Event) => {
        if (event.type === "pointerup" && pendingPointerModal) {
            const target = event.target instanceof win.Element
                ? event.target.closest<HTMLElement>("button[aria-label]")
                : null
            const owned = triggerFor(event.target)
            if (
                target === pendingPointerModal.opener ||
                owned?.getAttribute("aria-label") === pendingPointerModal.label
            ) {
                pendingPointerModal = null
            } else if (closeFor(event.target)) pendingPointerModal = null
            else cancelPointerActivation()
        }
        if (event.type === "click") {
            const trigger = triggerFor(event.target)
            if (trigger && preparedActivation !== trigger.getAttribute("aria-label")) {
                prepareTrigger(trigger)
            }
            if (trigger || closeFor(event.target)) pendingPointerModal = null
            preparedActivation = null
        }
        if (modal && closeFor(event.target)) closeIntent = true
        if (closeIntent) restoreContext()
    }
    const onKeyDown = (event: KeyboardEvent) => {
        keyboardMode = true
        if (event.key === "Escape" && modal) {
            // Do not prevent or stop the native key event, and do not guess
            // that Escape closed it. Check once after native handling settles.
            restoreContext(true)
        }
        if (event.key === "Enter" || event.key === " ") {
            if (modal && closeFor(event.target)) closeIntent = true
            else {
                const trigger = triggerFor(event.target)
                if (trigger && !event.repeat) {
                    prepareTrigger(trigger)
                    preparedActivation = trigger.getAttribute("aria-label")
                }
            }
        }
        queueSample()
    }
    const onFocus = () => queueSample()
    const onPointerCancel = () => {
        cancelPointerActivation()
    }
    const onMedia = () => {
        sample()
        emit()
    }

    win.addEventListener("scroll", queueSample, { passive: true })
    win.addEventListener("resize", queueSample, { passive: true })
    doc.addEventListener("pointerdown", onPointerDown, true)
    doc.addEventListener("pointerup", onCloseEnd, true)
    doc.addEventListener("pointercancel", onPointerCancel, true)
    doc.addEventListener("click", onCloseEnd, true)
    doc.addEventListener("keydown", onKeyDown, true)
    root.addEventListener("focusin", onFocus)
    phone.addEventListener("change", onMedia)
    reduced.addEventListener("change", onMedia)
    sample()
    emit()

    return {
        dispose() {
            disposed = true
            releaseBanners()
            if (frame) win.cancelAnimationFrame(frame)
            if (restoreFrame) win.cancelAnimationFrame(restoreFrame)
            win.removeEventListener("scroll", queueSample)
            win.removeEventListener("resize", queueSample)
            doc.removeEventListener("pointerdown", onPointerDown, true)
            doc.removeEventListener("pointerup", onCloseEnd, true)
            doc.removeEventListener("pointercancel", onPointerCancel, true)
            doc.removeEventListener("click", onCloseEnd, true)
            doc.removeEventListener("keydown", onKeyDown, true)
            root.removeEventListener("focusin", onFocus)
            phone.removeEventListener("change", onMedia)
            reduced.removeEventListener("change", onMedia)
        },
    }
}

export function withHomepageNavigation(
    Component: ComponentType<any>
): ComponentType<any> {
    const Navigation = forwardRef<HTMLElement, any>((props, forwardedRef) => {
        const root = useRef<HTMLElement | null>(null)
        const isStatic = useIsStaticRenderer()
        const interactive = !isStatic && RenderTarget.current() !== RenderTarget.canvas
        const [view, setView] = useState<ViewState>({
            hidden: false,
            reducedMotion: false,
        })
        const assignRef = useCallback(
            (node: HTMLElement | null) => {
                root.current = node
                if (typeof forwardedRef === "function") forwardedRef(node)
                else if (forwardedRef) forwardedRef.current = node
            },
            [forwardedRef]
        )
        useEffect(() => {
            if (!interactive || !root.current) return
            const element = root.current
            const doc = element.ownerDocument
            const win = doc.defaultView
            if (!win) return
            const controller = createNavigationController({
                root: element,
                banner: doc.getElementById("homepage-rd-banner"),
                win,
                doc,
                onChange: setView,
            })
            return () => controller.dispose()
        }, [interactive])
        const hidden = interactive && view.hidden
        return createElement(Component, {
            ...props,
            ref: assignRef,
            style: {
                ...props.style,
                translate: hidden ? "0 -100%" : "0 0",
                transition: view.reducedMotion
                    ? "none"
                    : `translate ${navigationPrototype.durationMs}ms cubic-bezier(.22,1,.36,1)`,
                pointerEvents: hidden ? "none" : props.style?.pointerEvents,
            },
        })
    })
    Navigation.displayName = `HomepageNavigation(${Component.displayName || Component.name || "Component"})`
    return Navigation
}
