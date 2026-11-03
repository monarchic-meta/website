import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"
import { withCantorOpeningRoot, withCantorFoundationCompanyLabel } from "./SourceCantorOpening.tsx"

/**
 * SOURCE INSPIRATION / HERO-007 — Cantor8, website by Artemii Lebedev.
 * The retained source wraps ten opening labels only on initial fine/wide load.
 * Its inner line rolls950ms; only seven header links share320ms dimming.
 * Preserve the actual native RichText, its editable paragraph and semantic link.
 * Generated CSS copy has an empty speech alternative where supported. No source
 * behavior JS, new native frame, renderer, timer, animation clock or RAF is used.
 * Public semantic DOM admission is deliberate: unsupported markup stays intact.
 * Reduced motion/editor/static rendering keep the ordinary native text still;
 * this is an explicit project-policy difference from source rolling CSS.
 */
type RollingEvent = { defaultPrevented?: boolean; key?: string; repeat?: boolean; preventDefault?: () => void }
type RollingProps = {
    [key: string]: unknown
    children?: React.ReactNode
    style?: React.CSSProperties
    onClick?: (event: RollingEvent) => void
    onTap?: (event: RollingEvent, info?: unknown) => void
    onKeyDown?: (event: RollingEvent) => void
}
type RollingRole = "header-link" | "button"
type AttributeLease = { node: HTMLElement; name: string; before: string | null; owned: string }
type RollingRecord = { host: HTMLElement; role: RollingRole; leases: AttributeLease[] }
type RollingContextValue = { register: (host: HTMLElement, role: RollingRole) => () => void }
const RollingContext = React.createContext<RollingContextValue>({ register: () => () => {} })
const ROLL_FINE = "(min-width: 992px) and (hover: hover) and (pointer: fine)"
const ROLL_REVISION = {}
function writeRollingRef(ref: React.ForwardedRef<HTMLElement>, node: HTMLElement | null) {
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
}
function restoreLease(lease: AttributeLease) {
    if (lease.node.getAttribute(lease.name) !== lease.owned) return
    if (lease.before === null) lease.node.removeAttribute(lease.name)
    else lease.node.setAttribute(lease.name, lease.before)
}
function releaseLeases(record: { leases: AttributeLease[] }) {
    for (const lease of record.leases) restoreLease(lease)
    record.leases = []
}
function ownAttribute(record: { leases: AttributeLease[] }, node: HTMLElement, name: string, value: string) {
    const prior = record.leases.find(lease => lease.node === node && lease.name === name)
    // A caller/editor that takes over an attribute keeps its newer value.
    if (prior && node.getAttribute(name) !== prior.owned) return
    if (prior) prior.owned = value
    else record.leases.push({ node, name, before: node.getAttribute(name), owned: value })
    if (node.getAttribute(name) !== value) node.setAttribute(name, value)
}
function rollingPainted(host: HTMLElement) {
    if (!host.isConnected) return false
    for (let node: HTMLElement | null = host; node; node = node.parentElement) {
        const style = getComputedStyle(node)
        if (node.hidden || style.display === "none" || style.visibility !== "visible" || Number(style.opacity) === 0) return false
    }
    const box = host.getBoundingClientRect()
    return box.width > 0 && box.height > 0 && box.right > 0 && box.bottom > 0 && box.left < window.innerWidth && box.top < window.innerHeight
}
function semanticBridge(host: HTMLElement, scope: HTMLElement) {
    // Standard HTML text elements only; no Framer-private class/DOM contract.
    const blocks = Array.from(host.querySelectorAll<HTMLElement>("p,h1,h2,h3,h4,h5,h6"))
    const copy = (host.textContent ?? "").trim()
    if (!copy || blocks.length !== 1 || (blocks[0].textContent ?? "").trim() !== copy) return { reason: "unsupported-text-block" }
    let anchor: HTMLElement | null = host
    while (anchor && anchor !== scope && anchor.tagName !== "A") anchor = anchor.parentElement
    if (!anchor || anchor === scope || !anchor.hasAttribute("href")) return { reason: "missing-semantic-link" }
    const block = blocks[0]
    if (block.style.transform && block.style.transform !== "none") return { reason: "owned-inner-transform-conflict" }
    return { block, anchor, copy, reason: "ready" }
}
function rollingCSS(id: string) {
    const root = `[data-cantor-roll-scope="${id}"]`, text = `[data-cantor-roll-text="${id}"]`, block = `[data-cantor-roll-block="${id}"]`, trigger = `[data-cantor-roll-trigger="${id}"]`, nav = `[data-cantor-roll-nav="${id}"]`
    return `@media ${ROLL_FINE} and (prefers-reduced-motion:no-preference){
${root} ${text}{overflow:hidden!important;height:1.25em!important;line-height:1.25em!important}
${root} ${block}{position:relative!important;display:block!important;line-height:inherit!important;margin:0!important;transform:translateY(0%)!important;transition:transform 950ms cubic-bezier(.16,1,.3,1)!important;will-change:transform}
${root} ${block}::after{content:attr(data-cantor-roll-copy) / "";position:absolute;left:0;top:100%;white-space:nowrap}
${root} ${trigger}:hover ${block},${root} ${trigger}:focus-visible ${block}{transform:translateY(-100%)!important}
${root} ${nav}{transition:opacity 320ms cubic-bezier(.22,1,.36,1)!important}
${root}:has(${nav}:hover) ${nav}{opacity:.65!important}
${root}:has(${nav}:hover) ${nav}:hover,${root}:has(${nav}:hover) ${nav}:focus-visible{opacity:1!important}
}`
}
function rollingScope(Component: ComponentType<RollingProps>): ComponentType<RollingProps> {
    return React.forwardRef<HTMLElement, RollingProps>((props, ref) => {
        const id = React.useId().replace(/[^\w-]/g, "_"), target = RenderTarget.current()
        const frozen = useIsStaticRenderer() || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail
        const [host, setHost] = React.useState<HTMLElement | null>(null)
        const records = React.useRef(new Map<HTMLElement, RollingRecord>()), firstFine = React.useRef<boolean | null>(null), wake = React.useRef<() => void>(() => {})
        const register = React.useCallback((node: HTMLElement, role: RollingRole) => {
            const record: RollingRecord = { host: node, role, leases: [] }
            const previous = records.current.get(node)
            if (previous) releaseLeases(previous)
            records.current.set(node, record); wake.current()
            return () => { releaseLeases(record); if (records.current.get(node) === record) records.current.delete(node); wake.current() }
        }, [])
        const bind = React.useCallback((node: HTMLElement | null) => { setHost(old => old === node ? old : node); writeRollingRef(ref, node) }, [ref])
        React.useLayoutEffect(() => {
            if (!host || frozen) return
            if (firstFine.current === null) firstFine.current = window.matchMedia(ROLL_FINE).matches
            const scopeLease = { leases: [] as AttributeLease[] }, paths = new Set<HTMLElement>()
            let active = true, refreshing = false
            const supportsCopy = typeof CSS !== "undefined" && CSS.supports("content", 'attr(data-cantor-roll-copy) / ""')
            if (!firstFine.current || !supportsCopy) {
                const explain = () => { for (const record of records.current.values()) ownAttribute(record, record.host, "data-cantor-roll-admission", !firstFine.current ? "initial-coarse-or-narrow" : "unsupported-empty-speech-copy") }
                wake.current = explain; explain()
                return () => { if (wake.current === explain) wake.current = () => {}; for (const record of records.current.values()) releaseLeases(record) }
            }
            const observers = new MutationObserver(mutations => refresh(mutations.some(row => row.type === "childList")))
            const intersection = new IntersectionObserver(() => refresh(false), { threshold: 0 })
            const completed = (event: Event) => { if (event.target instanceof HTMLElement && paths.has(event.target)) refresh(false) }
            const rebuild = () => {
                observers.disconnect(); intersection.disconnect()
                for (const node of paths) { node.removeEventListener("transitionend", completed); node.removeEventListener("animationend", completed) }
                paths.clear()
                for (const record of records.current.values()) {
                    intersection.observe(record.host)
                    for (let node: HTMLElement | null = record.host; node; node = node.parentElement) paths.add(node)
                }
                for (const node of paths) {
                    observers.observe(node, { attributes: true, attributeFilter: ["style", "class", "hidden"], childList: node === host || host.contains(node), ...(records.current.has(node) ? { subtree: true, characterData: true } : {}) })
                    node.addEventListener("transitionend", completed); node.addEventListener("animationend", completed)
                }
            }
            const refresh = (topology: boolean) => {
                if (!active || refreshing) return
                refreshing = true
                try {
                    ownAttribute(scopeLease, host, "data-cantor-roll-scope", id)
                    for (const record of records.current.values()) {
                        const bridge = semanticBridge(record.host, host)
                        const ready = firstFine.current && supportsCopy && !document.hidden && host.contains(record.host) && rollingPainted(record.host) && bridge.block && bridge.anchor
                        const oldBlock = record.leases.find(lease => lease.name === "data-cantor-roll-block")?.node
                        const oldAnchor = record.leases.find(lease => lease.name === "data-cantor-roll-trigger")?.node
                        if (!ready || oldBlock && oldBlock !== bridge.block || oldAnchor && oldAnchor !== bridge.anchor) releaseLeases(record)
                        ownAttribute(record, record.host, "data-cantor-roll-admission", !firstFine.current ? "initial-coarse-or-narrow" : !supportsCopy ? "unsupported-empty-speech-copy" : !ready ? bridge.reason === "ready" ? "suspended" : bridge.reason : "ready")
                        if (ready && bridge.block && bridge.anchor) {
                            ownAttribute(record, record.host, "data-cantor-roll-text", id)
                            ownAttribute(record, bridge.block, "data-cantor-roll-block", id)
                            ownAttribute(record, bridge.block, "data-cantor-roll-copy", bridge.copy)
                            ownAttribute(record, bridge.anchor, "data-cantor-roll-trigger", id)
                            if (record.role === "header-link") ownAttribute(record, bridge.anchor, "data-cantor-roll-nav", id)
                        }
                    }
                    if (topology) rebuild()
                } finally { refreshing = false }
            }
            const change = () => refresh(false)
            const refreshRegistered = () => refresh(true)
            wake.current = refreshRegistered
            rebuild(); refresh(false)
            document.addEventListener("visibilitychange", change)
            return () => {
                active = false; if (wake.current === refreshRegistered) wake.current = () => {}
                document.removeEventListener("visibilitychange", change); observers.disconnect(); intersection.disconnect()
                for (const node of paths) { node.removeEventListener("transitionend", completed); node.removeEventListener("animationend", completed) }
                for (const record of records.current.values()) releaseLeases(record)
                releaseLeases(scopeLease)
            }
        }, [host, frozen, id, ROLL_REVISION])
        return <RollingContext.Provider value={{ register }}><Component {...props} ref={bind}><style>{rollingCSS(id)}</style>{props.children}</Component></RollingContext.Provider>
    })
}
function rollingText(Component: ComponentType<RollingProps>, role: RollingRole): ComponentType<RollingProps> {
    return React.forwardRef<HTMLElement, RollingProps>((props, ref) => {
        const { register } = React.useContext(RollingContext), remove = React.useRef<(() => void) | null>(null)
        const bind = React.useCallback((node: HTMLElement | null) => { remove.current?.(); remove.current = node ? register(node, role) : null; writeRollingRef(ref, node) }, [register, role, ref])
        return <Component {...props} ref={bind} />
    })
}
export function withCantorRollingOpeningRoot(Component: ComponentType<RollingProps>): ComponentType<RollingProps> {
    return withCantorOpeningRoot(rollingScope(Component))
}
export function withCantorRollingHeaderLinkText(Component: ComponentType<RollingProps>): ComponentType<RollingProps> {
    return rollingText(Component, "header-link")
}
export function withCantorRollingText(Component: ComponentType<RollingProps>): ComponentType<RollingProps> {
    return rollingText(Component, "button")
}
export function withCantorRollingCompanyLabel(Component: ComponentType<RollingProps>): ComponentType<RollingProps> {
    return withCantorFoundationCompanyLabel(rollingText(Component, "button"))
}
