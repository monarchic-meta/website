import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"

// SOURCE INSPIRATION / HERO-005 / https://www.maximiliankaspar.com/
// Independently authored native-layer behavior. The existing, budgeted botanical
// ASCII renderer stays separate. No original website JavaScript is imported.
interface LayerProps {
    style?: React.CSSProperties
    children?: React.ReactNode
    onTap?: (event: unknown, ...info: unknown[]) => void
    [key: string]: unknown
}
type Part = "hero" | "field" | "header" | "headline" | "fine-grid" | "columns" | "cue" |
    "projects" | "project-header" | "project-body" | "gallery" | "card"
const REVISION = "kaspar-current-native-v1"
const FINE_GRID = "repeating-linear-gradient(180deg,transparent 0 10px,#f5f5f5 10px 11px),repeating-linear-gradient(90deg,transparent 0 10px,rgba(0,0,0,.025) 10px 10.1px)"
const FINE_GRID_POSITION = "0 -2px,7.5px 0"
const selector = (part: Part) => `[data-kaspar-native="${part}"]`
function forward<T>(ref: React.ForwardedRef<T>, node: T | null) {
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
}
function useKasparFrozenTarget() {
    const target = RenderTarget.current()
    return useIsStaticRenderer() || target === RenderTarget.canvas ||
        target === RenderTarget.export || target === RenderTarget.thumbnail
}
function marker(Component: ComponentType<LayerProps>, part: Part): ComponentType<LayerProps> {
    return React.forwardRef<HTMLElement, LayerProps>(function KasparNativePart(props, ref) {
        const frozen = useKasparFrozenTarget(), node = React.useRef<HTMLElement | null>(null)
        const interactive = part === "card" || part === "project-header"
        const bind = (value: HTMLElement | null) => { node.current = value; forward(ref, value) }
        const tap = (event: unknown, ...info: unknown[]) => {
            props.onTap?.(event, ...info)
            const input = event as { defaultPrevented?: boolean; nativeEvent?: { defaultPrevented?: boolean } }
            const canceled = !!(input?.defaultPrevented || input?.nativeEvent?.defaultPrevented)
            node.current?.dispatchEvent(new CustomEvent("kaspar-native-activate", { bubbles: true, detail: { input: event, canceled } }))
        }
        const style = part === "fine-grid" ? { ...props.style, backgroundImage: FINE_GRID, backgroundPosition: FINE_GRID_POSITION } : props.style
        return <Component {...props} style={style} ref={bind} onTap={interactive && !frozen ? tap : props.onTap} data-kaspar-native={part} />
    })
}
const CSS = `
@font-face { font-family:KasparSourceBugrino; src:url("https://cdn.prod.website-files.com/6915dc055cdc24f198ca9061/692c485307fbc15ab082acbc_Bugrino-Regular.woff2") format("woff2"); font-weight:400; font-style:normal; font-display:swap; }
[data-kaspar-current-page] { width:100%!important; height:auto!important; min-height:100vh; overflow:clip!important; }
[data-kaspar-current-page] [data-kaspar-native="hero"] { height:100svh!important; min-height:600px; position:relative!important; width:100%!important; flex-shrink:0; }
[data-kaspar-current-page] [data-kaspar-native="field"] { position:fixed!important; left:0!important; top:-2vh!important; width:100%!important; height:115svh!important; pointer-events:none; }
[data-kaspar-current-page] [data-kaspar-native="header"] { position:fixed!important; left:0!important; top:0!important; width:100%!important; z-index:30!important; }
[data-kaspar-current-page] [data-kaspar-native="headline"] { position:absolute!important; left:10px!important; bottom:15px!important; top:auto!important; width:calc(100% - 20px)!important; height:auto!important; overflow:visible!important; z-index:10; }
[data-kaspar-current-page] [data-kaspar-native="headline"], [data-kaspar-current-page] [data-kaspar-native="headline"] p { font-family:KasparSourceBugrino,monospace!important; font-weight:400!important; }
[data-kaspar-current-page] [data-kaspar-native="fine-grid"] { position:absolute!important; inset:0!important; width:100%!important; height:100%!important; pointer-events:none; background-image:${FINE_GRID}; background-position:${FINE_GRID_POSITION}; z-index:1; }
[data-kaspar-current-page] [data-kaspar-native="columns"] { position:absolute!important; inset:0!important; height:100%!important; width:100%!important; pointer-events:none; opacity:0!important; }
[data-kaspar-current-page][data-kaspar-grid="true"] [data-kaspar-native="columns"] { opacity:1!important; }
[data-kaspar-current-page] [data-kaspar-native="cue"] { position:fixed!important; top:0!important; left:0!important; z-index:31!important; pointer-events:none!important; opacity:0; }
[data-kaspar-current-page] [data-kaspar-native="projects"] { position:relative!important; width:100%!important; height:auto!important; background:#fff!important; z-index:20; }
[data-kaspar-current-page] [data-kaspar-native="project-header"] { cursor:pointer; }
[data-kaspar-current-page] [data-kaspar-native="project-body"] { overflow:hidden!important; height:0!important; transition:height .4s cubic-bezier(.65,0,.35,1); }
[data-kaspar-current-page] [data-kaspar-native="project-body"][data-kaspar-open="true"] { height:var(--kaspar-body-height)!important; }
[data-kaspar-current-page] [data-kaspar-native="gallery"] { position:relative!important; width:calc(100% - 10px)!important; height:auto!important; margin:0 5px!important; padding:0!important; display:flex!important; flex-wrap:wrap!important; align-items:stretch!important; align-content:start!important; gap:28px 0!important; }
[data-kaspar-current-page] [data-kaspar-native="card"] { position:relative!important; left:auto!important; top:auto!important; width:25%!important; height:auto!important; flex:0 0 auto!important; padding:0 5px!important; cursor:pointer; user-select:none; transform-origin:0 0; }
[data-kaspar-current-page] [data-kaspar-native="card"][data-kaspar-expanded="true"] { width:50%!important; }
[data-kaspar-current-page] [data-kaspar-native="card"] > * { width:100%!important; }
[data-kaspar-current-page] [data-kaspar-native="card"] > *:first-child { height:auto!important; flex-shrink:0!important; }
[data-kaspar-current-page] [data-kaspar-native="card"]:nth-child(1) > *:first-child { aspect-ratio:4/5!important; }
[data-kaspar-current-page] [data-kaspar-native="card"]:nth-child(2) > *:first-child { aspect-ratio:4/3!important; }
[data-kaspar-current-page] [data-kaspar-native="card"]:nth-child(3) > *:first-child,
[data-kaspar-current-page] [data-kaspar-native="card"]:nth-child(4) > *:first-child { aspect-ratio:1!important; }
@media(max-width:767px) {
 [data-kaspar-current-page] [data-kaspar-native="hero"] { min-height:600px; }
 [data-kaspar-current-page] [data-kaspar-native="field"] { top:2svh!important; height:100svh!important; }
 [data-kaspar-current-page] [data-kaspar-native="gallery"] { gap:14px 0!important; }
 [data-kaspar-current-page] [data-kaspar-native="card"] { width:50%!important; }
 [data-kaspar-current-page] [data-kaspar-native="card"][data-kaspar-expanded="true"] { width:100%!important; }
}
@media(prefers-reduced-motion:reduce) {
 [data-kaspar-current-page] [data-kaspar-native="project-body"] { transition:none!important; }
}
`

function visible(node: HTMLElement) {
    const box = node.getBoundingClientRect()
    if (!box.width || !box.height || box.bottom <= 0 || box.top >= innerHeight ||
        box.right <= 0 || box.left >= innerWidth) return false
    for (let p: HTMLElement | null = node; p; p = p.parentElement) {
        const s = getComputedStyle(p)
        if (s.display === "none" || s.visibility === "hidden" || +s.opacity === 0) return false
    }
    return true
}

function wordRanges(root: HTMLElement) {
    const tree = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const result: { range: Range; word: string }[] = []
    for (let node = tree.nextNode(); node; node = tree.nextNode()) {
        const text = node.textContent ?? ""
        for (const match of text.matchAll(/\S+/g)) {
            const range = document.createRange()
            range.setStart(node, match.index!)
            range.setEnd(node, match.index! + match[0].length)
            result.push({ range, word: match[0].replace(/[^a-zA-Z]/g, "") })
        }
    }
    return result
}

function createKasparNativeWorld(root: HTMLElement) {
    const query = (part: Part) => root.querySelector<HTMLElement>(selector(part))
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const fine = window.matchMedia("(hover:hover) and (pointer:fine)")
    const owner = document.createElement("div")
    owner.dataset.kasparNativeEffects = "true"
    owner.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:40;overflow:hidden"
    const svgNS = "http://www.w3.org/2000/svg"
    const svg = document.createElementNS(svgNS, "svg")
    svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;overflow:visible"
    owner.append(svg)
    root.append(owner)
    let disposed = false, scan = false, timer: ReturnType<typeof setTimeout> | undefined
    let revealTimer: ReturnType<typeof setTimeout> | undefined, revealing = 0
    let cueFrame = 0, cueGone = false, cueStarted = false
    let pointer = [0, 0], current = [0, 0]
    let lastActivation: { node: HTMLElement; channel: string; time: number } | undefined
    const animations = new Set<Animation>(), restores: (() => void)[] = []
    const selected = new WeakSet<HTMLElement>(), opened = new WeakSet<HTMLElement>()
    for (const [part, properties] of [["field", ["opacity"]], ["cue", ["opacity", "transform"]],
        ["project-body", ["--kaspar-body-height"]]] as const) {
        const node = query(part)
        if (!node) continue
        const values = properties.map(name => [name, node.style.getPropertyValue(name), node.style.getPropertyPriority(name)])
        restores.push(() => values.forEach(([name, value, priority]) => node.style.setProperty(name, value, priority)))
    }

    function fitHeadline() {
        const node = query("headline"), hero = query("hero")
        if (!node || !hero) return
        const text = node.querySelector<HTMLElement>("p,h1,h2") ?? node
        const saved = ["font-size", "line-height", "text-indent", "padding-bottom"].map(name =>
            [name, text.style.getPropertyValue(name), text.style.getPropertyPriority(name)])
        if (!text.hasAttribute("data-kaspar-fit")) {
            text.setAttribute("data-kaspar-fit", "true")
            restores.push(() => {
                saved.forEach(([name, value, priority]) => text.style.setProperty(name, value, priority))
                text.removeAttribute("data-kaspar-fit")
            })
        }
        text.style.setProperty("text-indent", "25%", "important")
        text.style.setProperty("padding-bottom", `${hero.clientWidth * .004}px`, "important")
        const maxHeight = hero.clientHeight * (hero.clientWidth < 768 ? .37 : .4)
        let size = 10
        for (; size < 500; size++) {
            text.style.setProperty("font-size", `${size}px`, "important")
            text.style.setProperty("line-height", "1.02", "important")
            if (text.scrollHeight >= maxHeight || text.scrollWidth >= hero.clientWidth) break
        }
        text.style.setProperty("font-size", `${Math.max(10, size - 1)}px`, "important")
        node.dataset.kasparFontSize = String(Math.max(10, size - 1))
    }

    function clearScan() {
        if (timer !== undefined) clearTimeout(timer)
        timer = undefined
        svg.replaceChildren()
    }
    function drawScan() {
        clearScan()
        if (!scan || reduced.matches || document.hidden || !visible(root)) return
        const headline = query("headline")
        if (!headline || !visible(headline)) return
        const words = wordRanges(headline), corners: { x: number; y: number }[][] = []
        if (!words.length) return
        for (let i = 0; i < 4; i++) {
            const word = words[Math.floor(Math.random() * words.length)], box = word.range.getBoundingClientRect()
            const x = box.left, y = box.top + 15, w = box.width, h = Math.max(4, box.height - 30)
            const rectangle = document.createElementNS(svgNS, "rect")
            rectangle.setAttribute("x", String(x)); rectangle.setAttribute("y", String(y))
            rectangle.setAttribute("width", String(w)); rectangle.setAttribute("height", String(h))
            rectangle.setAttribute("fill", "rgba(0,0,0,.3)"); rectangle.setAttribute("stroke", "#000")
            rectangle.dataset.kasparScanBox = word.word
            const label = document.createElementNS(svgNS, "text")
            label.setAttribute("x", String(x)); label.setAttribute("y", String(y - 3))
            label.setAttribute("font-size", "11"); label.setAttribute("fill", "#000")
            label.textContent = word.word
            svg.append(rectangle, label)
            corners.push([{ x, y }, { x: x + w, y }, { x, y: y + h }, { x: x + w, y: y + h }])
        }
        for (let i = 0; i < corners.length; i++) {
            let closest: [number, typeof corners[0][0], typeof corners[0][0]] | undefined
            for (const a of corners[i]) for (const b of corners[(i + 1) % corners.length]) {
                const distance = Math.hypot(a.x - b.x, a.y - b.y)
                if (!closest || distance < closest[0]) closest = [distance, a, b]
            }
            if (!closest) continue
            const line = document.createElementNS(svgNS, "line")
            line.setAttribute("x1", String(closest[1].x)); line.setAttribute("y1", String(closest[1].y))
            line.setAttribute("x2", String(closest[2].x)); line.setAttribute("y2", String(closest[2].y))
            line.setAttribute("stroke", "#000"); line.setAttribute("stroke-width", ".5")
            svg.prepend(line)
        }
        // The source uses four independent timers; one bounded event timer here
        // cycles the whole selection. It owns no canvas, decoder or idle RAF.
        timer = setTimeout(drawScan, 800 + Math.random() * 600)
    }

    function stopCue() {
        if (cueFrame) cancelAnimationFrame(cueFrame)
        cueFrame = 0
        const cue = query("cue")
        if (cue) cue.style.opacity = "0"
    }
    function cueTick() {
        cueFrame = 0
        const cue = query("cue"), hero = query("hero"), header = query("header")
        if (!cue || !hero || cueGone || reduced.matches || !fine.matches || document.hidden || !visible(hero)) return stopCue()
        const h = header?.getBoundingClientRect(), overHeader = h && pointer[0] >= h.left && pointer[0] <= h.right && pointer[1] >= h.top && pointer[1] <= h.bottom
        current = current.map((n, i) => n + (pointer[i] - n) * .05)
        cue.style.transform = `translate3d(${current[0] + 15}px,${current[1] - 20}px,0)`
        cue.style.opacity = overHeader ? "0" : ".5"
        if (Math.hypot(current[0] - pointer[0], current[1] - pointer[1]) > .1) cueFrame = requestAnimationFrame(cueTick)
    }
    function pointerMove(event: PointerEvent) {
        if (event.pointerType === "touch" || !root.contains(event.target as Node)) return
        pointer = [event.clientX, event.clientY]
        if (!cueStarted) { current = pointer.slice(); cueStarted = true }
        if (!cueFrame) cueFrame = requestAnimationFrame(cueTick)
    }
    function setBody(open: boolean) {
        const body = query("project-body")
        if (!body) return
        body.style.setProperty("--kaspar-body-height", `${body.scrollHeight}px`)
        body.dataset.kasparOpen = String(open)
        query("project-header")?.setAttribute("aria-expanded", String(open))
    }
    function activate(event: Event) {
        if (event.defaultPrevented || (event.target as Element)?.closest("a,input,textarea,select,[contenteditable=true]")) return
        const detail = event.type === "kaspar-native-activate" ? (event as CustomEvent<{ input?: { target?: EventTarget }; canceled?: boolean }>).detail : undefined
        if (detail?.input?.target instanceof Element && detail.input.target.closest("a,input,textarea,select,[contenteditable=true]")) return
        const target = (event.target as Element)?.closest<HTMLElement>(selector("card") + "," + selector("project-header"))
        if (!target || !root.contains(target)) return
        if (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ") return
        if (event instanceof KeyboardEvent) event.preventDefault()
        const channel = event.type === "kaspar-native-activate" ? "tap" : event.type
        const time = performance.now()
        if (lastActivation?.node === target && lastActivation.channel !== channel && time - lastActivation.time < 350) return
        lastActivation = { node: target, channel, time }
        if (detail?.canceled) return
        if (target.matches(selector("project-header"))) return setBody(query("project-body")?.dataset.kasparOpen !== "true")
        const gallery = target.closest<HTMLElement>(selector("gallery"))
        if (!gallery || revealing || revealTimer !== undefined) return
        const cards = Array.from(gallery.querySelectorAll<HTMLElement>(selector("card")))
        const before = cards.map(card => card.getBoundingClientRect())
        animations.forEach(animation => animation.cancel()); animations.clear()
        const expand = !selected.has(target)
        if (expand) selected.add(target); else selected.delete(target)
        target.dataset.kasparExpanded = String(expand)
        target.setAttribute("aria-expanded", String(expand))
        const after = cards.map(card => card.getBoundingClientRect())
        if (!reduced.matches) cards.forEach((card, i) => {
            if (!after[i].width || !after[i].height) return
            const a = card.animate([
                { transform: `translate(${before[i].x - after[i].x}px,${before[i].y - after[i].y}px) scale(${before[i].width / after[i].width},${before[i].height / after[i].height})` },
                { transform: "none" },
            ], { duration: 650, easing: "cubic-bezier(.65,0,.35,1)" })
            animations.add(a); a.onfinish = () => animations.delete(a)
        })
    }
    function key(event: KeyboardEvent) {
        if (event.defaultPrevented || (event.target as Element)?.closest("input,textarea,select,[contenteditable=true]") || !visible(root)) return
        if (event.key.toLowerCase() === "a" && !event.ctrlKey && !event.metaKey && !event.altKey) { scan = !scan; drawScan() }
        if (event.shiftKey && event.key.toLowerCase() === "g") { event.preventDefault(); root.dataset.kasparGrid = String(root.dataset.kasparGrid !== "true") }
    }
    function scroll() {
        // Current full source crosses its 2% cue threshold at about180 CSS px.
        // The bounded recreation ends after the first project handoff, so use
        // that measured distance rather than 2% of its shorter document.
        if (window.scrollY > 180) { cueGone = true; stopCue() }
        const hero = query("hero"), field = query("field")
        // Once the white project content replaces the opening, stop its hidden
        // renderer via the existing pool's ancestor-visibility observation.
        if (hero && field) field.style.opacity = hero.getBoundingClientRect().bottom > 0 ? "1" : "0"
        if (scan) drawScan()
    }
    function motion() {
        if (reduced.matches || document.hidden || !visible(root)) {
            clearScan(); stopCue(); animations.forEach(a => a.cancel()); animations.clear()
        } else if (scan) drawScan()
    }
    const resized = () => { fitHeadline(); scroll(); const body = query("project-body"); if (body?.dataset.kasparOpen === "true") setBody(true) }
    const observer = new ResizeObserver(resized), intersection = new IntersectionObserver(motion)
    observer.observe(root); intersection.observe(root)
    const intro = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting && !opened.has(entry.target as HTMLElement)) { opened.add(entry.target as HTMLElement); setBody(true) } })
    }, { rootMargin: "0px 0px -25% 0px", threshold: 0 })
    const header = query("project-header"); if (header) intro.observe(header)
    const seen = new WeakSet<Element>()
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting || seen.has(entry.target)) return
        seen.add(entry.target); reveal.unobserve(entry.target)
        const card = entry.target as HTMLElement
        if (reduced.matches) { card.style.opacity = "1"; return }
        revealing++
        const animation = card.animate([{ opacity: 0, transform: "translateY(80px)" }, { opacity: 1, transform: "none" }],
            { duration: 600, delay: Math.random() * 300, easing: "cubic-bezier(.65,0,.35,1)", fill: "both" })
        animations.add(animation)
        const finish = () => {
            animations.delete(animation)
            if (disposed) return
            animation.onfinish = animation.oncancel = null
            animation.cancel(); card.style.opacity = "1"
            revealing = Math.max(0, revealing - 1)
            if (!revealing) {
                if (revealTimer !== undefined) clearTimeout(revealTimer)
                revealTimer = setTimeout(() => { revealTimer = undefined }, 100)
            }
        }
        animation.onfinish = finish; animation.oncancel = finish
    }), { rootMargin: "0px 0px 15% 0px", threshold: 0 })
    root.querySelectorAll<HTMLElement>(selector("card")).forEach(card => {
        const opacity = card.style.opacity
        card.style.opacity = reduced.matches ? "1" : "0"
        restores.push(() => { card.style.opacity = opacity })
        reveal.observe(card)
    })
    root.querySelectorAll<HTMLElement>(selector("card") + "," + selector("project-header")).forEach(node => {
        const attrs = ["role", "tabindex", "aria-expanded", "data-kaspar-expanded"].map(name => [name, node.getAttribute(name)] as const)
        node.setAttribute("role", "button"); node.setAttribute("tabindex", "0"); node.setAttribute("aria-expanded", "false")
        restores.push(() => attrs.forEach(([name, value]) => { if (value === null) node.removeAttribute(name); else node.setAttribute(name, value) }))
    })
    // React/Framer's root handler sees the event before this document bubble
    // listener, so a caller can prevent or stop its action first.
    document.addEventListener("click", activate); document.addEventListener("keydown", activate)
    document.addEventListener("kaspar-native-activate", activate)
    root.addEventListener("pointermove", pointerMove); root.addEventListener("pointerleave", stopCue); window.addEventListener("keydown", key)
    window.addEventListener("scroll", scroll, { passive: true })
    document.addEventListener("visibilitychange", motion); reduced.addEventListener("change", motion)
    document.fonts?.ready.then(() => { if (!disposed) resized() })
    document.fonts?.load("115px KasparSourceBugrino").then(() => { if (!disposed) resized() }).catch(() => {})
    document.fonts?.addEventListener("loadingdone", resized)
    fitHeadline()
    return () => {
        disposed = true; clearScan(); stopCue(); animations.forEach(a => a.cancel()); animations.clear()
        if (revealTimer !== undefined) clearTimeout(revealTimer)
        observer.disconnect(); intersection.disconnect(); intro.disconnect(); reveal.disconnect(); owner.remove()
        document.removeEventListener("click", activate); document.removeEventListener("keydown", activate)
        document.removeEventListener("kaspar-native-activate", activate)
        root.removeEventListener("pointermove", pointerMove); root.removeEventListener("pointerleave", stopCue); window.removeEventListener("keydown", key)
        window.removeEventListener("scroll", scroll); document.removeEventListener("visibilitychange", motion)
        reduced.removeEventListener("change", motion); restores.forEach(restore => restore())
        document.fonts?.removeEventListener("loadingdone", resized)
        query("project-body")?.removeAttribute("data-kaspar-open"); root.removeAttribute("data-kaspar-grid")
    }
}

export function withKasparCurrentPage(Component: ComponentType<LayerProps>): ComponentType<LayerProps> {
    const Surface = React.forwardRef<HTMLElement, LayerProps>(function KasparCurrentPage(props, ref) {
        const frozen = useKasparFrozenTarget(), [node, setNode] = React.useState<HTMLElement | null>(null)
        const bind = React.useCallback((element: HTMLElement | null) => { setNode(element); forward(ref, element) }, [ref])
        React.useLayoutEffect(() => { if (node && !frozen) return createKasparNativeWorld(node) }, [node, frozen])
        return <><Component {...props} ref={bind} data-kaspar-current-page={frozen ? undefined : REVISION} />{!frozen && <style>{CSS}</style>}</>
    })
    return React.forwardRef<HTMLElement, LayerProps>(function KasparCurrentPageRevision(props, ref) {
        return <Surface {...props} ref={ref} key={REVISION} />
    })
}
export function withKasparHero(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return marker(Component, "hero") }
export function withKasparBotanicalField(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return marker(Component, "field") }
export function withKasparHeader(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return marker(Component, "header") }
export function withKasparHeadline(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return marker(Component, "headline") }
export function withKasparFineGrid(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return marker(Component, "fine-grid") }
export function withKasparColumns(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return marker(Component, "columns") }
export function withKasparPointerCue(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return marker(Component, "cue") }
export function withKasparProjects(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return marker(Component, "projects") }
export function withKasparProjectHeader(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return marker(Component, "project-header") }
export function withKasparProjectBody(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return marker(Component, "project-body") }
export function withKasparProjectGallery(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return marker(Component, "gallery") }
export function withKasparProjectCard(Component: ComponentType<LayerProps>): ComponentType<LayerProps> { return marker(Component, "card") }
