import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"

/**
 * SOURCE INSPIRATION / HERO-007 — Cantor8, website by Artemii Lebedev.
 * Native opening/Phone menu/Foundation coupling, separate from the retained
 * five arrow/backdrop HOCs and the existing independent Canvas2D instrument.
 * Fresh original: viewport-height opening, ordinary Foundation handoff, fixed
 * header, white eleven-link Phone panel, Menu/Close and five native cubes.
 * The source panel's .78/+100% and 1/0 endpoints are observed. Its 800ms
 * quint-like interpolation is an explicit endpoint fit, not measured timing.
 * Desktop field scale is a reversible fit to captured scroll bounds; no fade
 * is invented. Source SVG track coordinates and scroll-pulse formulas remain
 * credited material/data. No source behavior JS, renderer or new clock is used.
 * Canvas/export/thumbnail freeze; reduced motion removes finite interpolation.
 */
type OpeningEvent = { defaultPrevented?: boolean; key?: string; repeat?: boolean; preventDefault?: () => void }
type OpeningProps = {
    [key: string]: unknown
    children?: React.ReactNode
    style?: React.CSSProperties
    onClick?: (event: OpeningEvent) => void
    onTap?: (event: OpeningEvent, info?: unknown) => void
    onKeyDown?: (event: OpeningEvent) => void
}
type OpeningGeometry = { width: number; height: number; localScroll: number; foundationTop: number; foundationHeight: number; executionTop: number; admitted: boolean; reduced: boolean; fine: boolean }
type OpeningState = OpeningGeometry & { frozen: boolean; open: boolean; toggle: (event: OpeningEvent, channel: string) => void; register: (role: string, node: HTMLElement | null) => void }
const initialGeometry: OpeningGeometry = { width: 1440, height: 900, localScroll: 0, foundationTop: 900, foundationHeight: 1092.53125, executionTop: 1522.390625, admitted: false, reduced: false, fine: false }
const OpeningContext = React.createContext<OpeningState>({ ...initialGeometry, frozen: true, open: false, toggle: () => {}, register: () => {} })
const openingClamp = (v: number) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0))
function openingWriteRef<T>(ref: React.ForwardedRef<T>, node: T | null) { if (typeof ref === "function") ref(node); else if (ref) ref.current = node }
function openingPainted(node: HTMLElement) { for (let p: HTMLElement | null = node; p; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === "none" || s.visibility !== "visible" || Number(s.opacity) === 0 || p.hidden) return false }; return node.getBoundingClientRect().width > 0 && node.getBoundingClientRect().height > 0 }
function useOpeningNode(role: string | null, ref: React.ForwardedRef<HTMLElement>) {
    const { register } = React.useContext(OpeningContext), [node, setNode] = React.useState<HTMLElement | null>(null)
    const attach = React.useCallback((value: HTMLElement | null) => { setNode(value); if (role) register(role, value); openingWriteRef(ref, value) }, [ref, register, role])
    return [node, attach] as const
}
const openingSans = '"PP Neue Montreal Variable","PP Neue Montreal",Arial,sans-serif'
const openingMono = '"Fragment Mono",SourceCantorFragmentMono,monospace'
const typography = `[data-cantor-source-text] p,[data-cantor-source-text] span{font-family:inherit!important;font-size:inherit!important;font-weight:inherit!important;line-height:inherit!important;letter-spacing:inherit!important;color:inherit!important;margin:0!important}[data-cantor-opening-role="menu-social-base"] p,[data-cantor-opening-role="menu-social-base"] span{white-space:pre!important}[data-cantor-opening-role="company"] a{color:inherit!important;text-decoration:none}`

/** Bind to the existing native shell; the retained input override stays on its intro. */
export function withCantorOpeningRoot(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> {
    return React.forwardRef<HTMLElement, OpeningProps>((props, ref) => {
        const target = RenderTarget.current(), frozen = useIsStaticRenderer() || target === RenderTarget.canvas || target === RenderTarget.export || target === RenderTarget.thumbnail
        const [host, setHost] = React.useState<HTMLElement | null>(null), [geometry, setGeometry] = React.useState(initialGeometry), [open, setOpen] = React.useState(false)
        const nodes = React.useRef(new Map<string, HTMLElement>()), lastAction = React.useRef<{ channel: string; at: number } | null>(null)
        const register = React.useCallback((role: string, node: HTMLElement | null) => { if (node) nodes.current.set(role, node); else nodes.current.delete(role) }, [])
        const attach = React.useCallback((node: HTMLElement | null) => { setHost(node); openingWriteRef(ref, node) }, [ref])
        React.useLayoutEffect(() => {
            if (!host) return
            const reduced = matchMedia("(prefers-reduced-motion: reduce)"), fine = matchMedia("(hover: hover) and (pointer: fine)")
            const update = () => {
                const b = host.getBoundingClientRect(), width = host.clientWidth || b.width || 1440, sy = host.clientHeight > 0 ? b.height / host.clientHeight : 1
                const h = Math.max(1, frozen ? nodes.current.get("hero")?.clientHeight || 810 : window.innerHeight), f = nodes.current.get("foundation"), e = nodes.current.get("execution")
                const fr = f?.getBoundingClientRect(), er = e?.getBoundingClientRect(), scale = sy > 0 ? sy : 1
                const next: OpeningGeometry = { width, height: h, localScroll: Math.max(0, -b.top / scale), foundationTop: fr ? fr.top / scale : h, foundationHeight: f?.clientHeight || 1092.53125, executionTop: er ? er.top / scale : h + 622.390625, admitted: !frozen && !document.hidden && openingPainted(host), reduced: reduced.matches, fine: fine.matches }
                setGeometry(old => Object.keys(next).every(k => old[k as keyof OpeningGeometry] === next[k as keyof OpeningGeometry]) ? old : next)
            }
            update()
            const ro = new ResizeObserver(update); ro.observe(host)
            if (frozen) return () => ro.disconnect()
            window.addEventListener("scroll", update, { passive: true }); window.addEventListener("resize", update)
            document.addEventListener("visibilitychange", update); reduced.addEventListener("change", update); fine.addEventListener("change", update)
            const attributes = new MutationObserver(update), ancestors: HTMLElement[] = []
            for (let n: HTMLElement | null = host; n; n = n.parentElement) { ancestors.push(n); attributes.observe(n, { attributes: true, attributeFilter: ["style", "class", "hidden"] }) }
            const completed = (event: Event) => { if (event.target === host || ancestors.includes(event.target as HTMLElement)) update() }
            for (const n of ancestors) { n.addEventListener("transitionend", completed); n.addEventListener("animationend", completed) }
            return () => { ro.disconnect(); attributes.disconnect(); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); document.removeEventListener("visibilitychange", update); reduced.removeEventListener("change", update); fine.removeEventListener("change", update); for (const n of ancestors) { n.removeEventListener("transitionend", completed); n.removeEventListener("animationend", completed) } }
        }, [host, frozen])
        const allowed = geometry.admitted && geometry.width < 992 && !frozen
        React.useEffect(() => { if (!allowed) { setOpen(false); lastAction.current = null } }, [allowed])
        const toggle = (event: OpeningEvent, channel: string) => {
            const at = performance.now(), prior = lastAction.current
            if (prior && prior.channel !== channel && at - prior.at < 350) return
            lastAction.current = { channel, at }
            if (allowed && !event.defaultPrevented) setOpen(value => !value)
        }
        const state = { ...geometry, frozen, open: allowed && open, toggle, register }
        return <OpeningContext.Provider value={state}><Component {...props} ref={attach} data-cantor-source-opening="true" data-cantor-opening-width={geometry.width} data-cantor-opening-frozen={frozen}
            style={{ ...props.style, position: "relative", display: "block", height: "auto", overflow: "visible", backgroundColor: "#044ab3", fontFamily: openingSans, fontSize: geometry.width / 100, fontWeight: 400, lineHeight: 1, letterSpacing: -.01 * geometry.width / 100 }}><style>{typography}</style>{props.children}</Component></OpeningContext.Provider>
    })
}

type OpeningRole = "hero" | "field" | "header" | "desktop-nav" | "main-nav-anchor" | "contact-nav-anchor" | "logo" | "phone-toggle" | "hero-copy" | "headline" | "hero-action" | "scroll-cue" | "foundation" | "foundation-label" | "heading-wrap" | "foundation-heading" | "execution" | "content" | "deck-wrap" | "deck" | "body" | "company" | "company-label" | "company-arrow" | "fine-artwork" | "base-artwork" | "menu-body" | "menu-main" | "menu-bottom" | "menu-section" | "menu-title" | "menu-sublist" | "menu-main-link" | "menu-home-link" | "menu-sub-link" | "menu-link-text" | "menu-social-base" | "menu-social-sup" | "menu-rule" | "menu-active" | "cube-icon" | "cube-top-left" | "cube-top-right" | "cube-bottom-left" | "cube-bottom-right" | "cube-middle" | "menu-label" | "close-label"
function openingStyle(role: OpeningRole, s: OpeningState): React.CSSProperties {
    const w = s.width, u = w / 100, phone = w < 992, small = w < 480, medium = w < 768, padding = small || medium ? 16 : phone ? 20 : 28
    const panelFont = small ? 6.5 * u : medium ? 4.5 * u : 3.5 * u, subFont = small ? 4.8 * u : medium ? 2.85 * u : 2.5 * u
    const flow: React.CSSProperties = { position: "relative", top: "auto", left: "auto", right: "auto", bottom: "auto", flex: "0 0 auto", minWidth: 0, height: "auto" }
    if (role === "hero") return { position: "relative", top: "auto", left: 0, width: "100%", ...(s.frozen ? {} : { height: s.height }), overflow: "hidden" }
    if (role === "field") { const base = phone ? .94 : .64, grow = phone || s.frozen || s.reduced ? 1 : 1 + .1 * openingClamp(s.localScroll / s.height); return { position: "absolute", left: 0, top: `calc(50% - ${small ? 10 * u : 0}px)`, width: "100%", height: `${s.height / base}px`, transform: `translateY(-50%) scale(${base * grow})`, transformOrigin: "50% 50%", opacity: 1 } }
    if (role === "header") return { position: s.frozen ? "absolute" : "fixed", top: 0, left: 0, width: "100%", height: small ? 51.1875 : medium ? 62 : phone ? 64 : 65.609375 / 1440 * w, zIndex: 104, backgroundColor: "#044ab3" }
    if (role === "desktop-nav") return { display: phone ? "none" : "block", position: "absolute", inset: 0, width: "100%", height: "100%" }
    if (role === "main-nav-anchor") return { position: "absolute", left: "50%", top: 12.38, width: 337.5, height: 40.5, transform: "translateX(-50%)" }
    if (role === "contact-nav-anchor") return { position: "absolute", right: padding, top: 12.38, width: 276.75, height: 40.5 }
    if (role === "logo") { const width = (small ? 26 : medium ? 17 : phone ? 14.5 : 8) * u; return { position: "absolute", left: padding, top: "50%", transform: "translateY(-50%)", width, height: width * 101 / 632 } }
    if (role === "phone-toggle") return { display: phone ? "flex" : "none", position: "absolute", right: padding, top: small ? 13.59375 : 16, left: "auto", width: "auto", height: small ? 24 : medium ? 30 : 32, gap: small ? 10 : 12, alignItems: "center", cursor: s.admitted && !s.frozen ? "pointer" : "default", color: "#fff", fontSize: small ? 4 * u : medium ? 2 * u : 1.85 * u, lineHeight: 1 }
    if (role === "hero-copy") return { position: "absolute", left: padding, right: padding, top: "auto", bottom: small ? 10 * u : phone ? 4 * u : 2.5 * u, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: small ? 16 : phone ? 2.5 * u : 1.25 * u, width: "auto", height: "auto", zIndex: 15 }
    if (role === "headline") return { ...flow, width: phone ? "100%" : "max-content", maxWidth: "100%", fontSize: small ? 8.4 * u : phone ? 5.6 * u : 3.9 * u, lineHeight: 1, letterSpacing: -.01 * u, color: "#fff" }
    if (role === "hero-action") return { ...flow, width: small ? "100%" : 188.875 / 1440 * w, height: small ? 49.02 : 44.8125 / 1440 * w, fontSize: small ? 3.6 * u : medium ? 1.85 * u : phone ? 1.5 * u : .95 * u, fontWeight: 500, color: "#044ab3" }
    if (role === "scroll-cue") return { position: "absolute", left: "auto", right: padding, top: "auto", bottom: 2.5 * u, width: "auto", fontSize: 10.8 / 1440 * w, lineHeight: 1, color: "#bfd6e6", display: phone ? "none" : "block" }
    if (role === "foundation") return { position: "relative", top: "auto", left: 0, width: "100%", height: "auto", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: `${small ? 15 * u : medium ? 92 : 13.25 * u}px ${padding}px`, overflow: "hidden", backgroundColor: "#044ab3" }
    if (role === "foundation-label") return { ...flow, width: "100%", fontSize: small ? 3 * u : phone ? 1.35 * u : .75 * u, lineHeight: 1, letterSpacing: "-.02em", color: "#fff", marginBottom: medium ? 24 : 32, zIndex: 2 }
    if (role === "heading-wrap") return { ...flow, width: small ? "100%" : phone ? "87ch" : "77ch", fontSize: u, fontFamily: openingSans, zIndex: 2 }
    if (role === "foundation-heading") return { ...flow, width: "100%", fontSize: small ? 8.5 * u : phone ? 6.3 * u : 5 * u, lineHeight: small ? 1.08 : 1, letterSpacing: 0, color: "#fff", zIndex: 2 }
    if (role === "execution") return { ...flow, width: "100%", marginTop: small ? 62 * u : phone ? 20 * u : 17 * u, display: "block", zIndex: 2 }
    if (role === "content") return { ...flow, width: small ? "80%" : phone ? "45%" : "30%", marginLeft: "auto", marginRight: phone ? 0 : "15%", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0 }
    if (role === "deck-wrap") return { ...flow, width: small ? "100%" : phone ? "63ch" : "42ch", fontSize: u, fontFamily: openingSans }
    if (role === "deck") return { ...flow, width: "100%", fontSize: small ? 7 * u : phone ? 3.5 * u : 2.3 * u, lineHeight: 1, letterSpacing: -.01 * u, color: "#fff" }
    if (role === "body") return { ...flow, width: "100%", fontSize: small ? 3.7 * u : medium ? 1.9 * u : phone ? 1.45 * u : .9 * u, fontWeight: 500, lineHeight: 1.3, letterSpacing: "-.005em", marginTop: 14, marginBottom: 24, color: "#fff" }
    if (role === "company") return { ...flow, width: small ? "100%" : 201.6 / 1440 * w, height: small ? 49.02 : 44.8125 / 1440 * w, backgroundColor: "#fff", color: "#044ab3", borderRadius: 3, fontSize: small ? 3.6 * u : medium ? 1.85 * u : phone ? 1.5 * u : .95 * u, fontWeight: 500, letterSpacing: 0, textDecoration: "none" }
    if (role === "company-label") return { position: "absolute", left: "1em", top: "50%", width: "max-content", height: "auto", transform: "translateY(-50%)", fontSize: "inherit", lineHeight: 1, letterSpacing: 0, color: "inherit" }
    if (role === "company-arrow") return { position: "absolute", left: "auto", bottom: "auto", right: ".25em", top: ".25em", width: small ? 42 : 37.9725 / 1440 * w, height: small ? 42 : 37.9725 / 1440 * w, backgroundColor: "#044ab3", borderRadius: 3 }
    if (role === "fine-artwork") { const fine = !phone && (s.frozen || s.fine); return { display: fine ? "block" : "none" } }
    if (role === "base-artwork") { const fine = !phone && (s.frozen || s.fine), edge = small ? 16.4 : 1.125 * (medium ? 1.85 * u : phone ? 1.5 * u : .95 * u); return { display: fine ? "none" : "block", position: "absolute", left: "50%", top: "50%", width: edge, height: edge, transform: "translate(-50%,-50%)" } }
    if (role === "menu-body") return { position: "relative", width: "100%", height: s.frozen ? "100%" : "100svh", padding: `${medium ? 10 * u : 8 * u}px ${medium ? 16 : 24}px ${small ? 24 : medium ? 32 : 24}px`, boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "auto" }
    if (role === "menu-main") return { ...flow, width: "100%", display: "flex", flexDirection: "column", gap: 6, marginTop: "auto", marginBottom: 6 * u }
    if (role === "menu-bottom") return { ...flow, width: "100%", display: "flex", flexDirection: "column", gap: small ? 40 : medium ? 50.4 : 56, marginTop: "auto" }
    if (role === "menu-section") return { ...flow, width: "100%", display: "flex", flexDirection: "column", gap: 0 }
    if (role === "menu-title") return { ...flow, width: "100%", marginTop: 12, fontSize: small ? 3.5 * u : medium ? 2.05 * u : 1.85 * u, lineHeight: 1, color: "#044ab3" }
    if (role === "menu-sublist") return { ...flow, width: "100%", display: "flex", flexDirection: "column", marginTop: small ? 20 : medium ? 28 : 34.4, gap: medium ? 10 : 8 }
    if (role === "menu-main-link" || role === "menu-home-link") return { ...flow, display: "block", width: "100%", fontSize: panelFont, lineHeight: 1, fontWeight: 500, color: "#044ab3", paddingLeft: role === "menu-home-link" ? 20 : 0, textDecoration: "none", cursor: "pointer" }
    if (role === "menu-sub-link") return { ...flow, display: "flex", alignItems: "flex-start", width: "100%", fontSize: subFont, lineHeight: 1, fontWeight: 500, color: "#044ab3", textDecoration: "none", cursor: "pointer" }
    if (role === "menu-link-text") return { ...flow, width: "100%", fontSize: "inherit", lineHeight: "inherit", fontWeight: "inherit", letterSpacing: "inherit", color: "inherit" }
    if (role === "menu-social-base") return { ...flow, width: "max-content", fontSize: "inherit", lineHeight: 1, color: "inherit" }
    if (role === "menu-social-sup") return { ...flow, width: "max-content", top: "-.35em", fontSize: ".75em", lineHeight: 1, color: "inherit" }
    if (role === "menu-rule") return { ...flow, width: "100%", height: 1, backgroundImage: "linear-gradient(90deg,#044ab300,#044ab3 50%,#044ab300)" }
    if (role === "menu-active") return { position: "absolute", left: 0, top: "50%", width: 8, height: 8, transform: "translateY(-50%)", backgroundColor: "#044ab3", pointerEvents: "none" }
    if (role === "cube-icon") { const edge = small ? 24 : medium ? 30 : 32; return { position: "relative", width: edge, height: edge, flex: "0 0 auto" } }
    if (role.startsWith("cube-")) { const side = small ? 24 : medium ? 30 : 32, edge = small ? 6 : medium ? 7 : 8, inset = (side / 2 - edge) / 2, middle = role === "cube-middle"; return { position: "absolute", left: middle ? (side - edge) / 2 : inset + (role.endsWith("right") ? side / 2 : 0), top: middle ? (side - edge) / 2 : inset + (role.includes("bottom") ? side / 2 : 0), width: edge, height: edge, borderRadius: .5, pointerEvents: "none", ...(middle ? { transform: s.open ? "scale(1)" : "scale(0)", transition: s.admitted && !s.reduced && !s.frozen ? "transform 800ms cubic-bezier(.22,1,.36,1)" : "none" } : {}) } }
    if (role === "menu-label" || role === "close-label") return { ...flow, display: (role === "close-label") === s.open ? "block" : "none", fontSize: "inherit", lineHeight: 1, color: "inherit" }
    return {}
}
function openingRole(Component: ComponentType<OpeningProps>, role: OpeningRole): ComponentType<OpeningProps> {
    return React.forwardRef<HTMLElement, OpeningProps>((props, ref) => {
        const s = React.useContext(OpeningContext), [, attach] = useOpeningNode(role === "hero" || role === "foundation" || role === "execution" ? role : null, ref)
        const sourceText = ["headline", "scroll-cue", "foundation-label", "foundation-heading", "deck", "body", "company-label", "menu-title", "menu-main-link", "menu-home-link", "menu-sub-link", "menu-link-text", "menu-social-base", "menu-social-sup", "menu-label", "close-label"].includes(role)
        return <Component {...props} ref={attach} data-cantor-opening-role={role} data-cantor-source-text={sourceText || undefined} style={{ ...props.style, ...(sourceText ? { fontFamily: role === "scroll-cue" || role === "foundation-label" ? openingMono : openingSans } : {}), ...openingStyle(role, s) }} />
    })
}
export function withCantorViewportHero(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "hero") }
export function withCantorSourceFieldFrame(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "field") }
export function withCantorPersistentHeader(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "header") }
export function withCantorDesktopNavigationOnly(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "desktop-nav") }
export function withCantorSourceMainNavAnchor(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "main-nav-anchor") }
export function withCantorSourceContactNavAnchor(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "contact-nav-anchor") }
export function withCantorSourceLogo(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "logo") }
export function withCantorHeroCopy(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "hero-copy") }
export function withCantorSourceHeadline(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "headline") }
export function withCantorHeroActionFrame(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "hero-action") }
export function withCantorSourceScrollCue(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "scroll-cue") }
export function withCantorSourceFoundation(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "foundation") }
export function withCantorFoundationLabel(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "foundation-label") }
export function withCantorFoundationHeadingWrap(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "heading-wrap") }
export function withCantorFoundationHeading(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "foundation-heading") }
export function withCantorFoundationExecution(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "execution") }
export function withCantorFoundationContent(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "content") }
export function withCantorFoundationDeckWrap(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "deck-wrap") }
export function withCantorFoundationDeck(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "deck") }
export function withCantorFoundationBody(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "body") }
export function withCantorFoundationCompany(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "company") }
export function withCantorFoundationCompanyLabel(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "company-label") }
export function withCantorFoundationCompanyArrow(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "company-arrow") }
export function withCantorFineArtworkOnly(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "fine-artwork") }
export function withCantorBaseArtworkOnly(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "base-artwork") }
export function withCantorPhoneMenuBody(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "menu-body") }
export function withCantorPhoneMenuMain(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "menu-main") }
export function withCantorPhoneMenuBottom(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "menu-bottom") }
export function withCantorPhoneMenuSection(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "menu-section") }
export function withCantorPhoneMenuTitle(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "menu-title") }
export function withCantorPhoneMenuSublist(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "menu-sublist") }
export function withCantorPhoneMenuMainLink(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "menu-main-link") }
export function withCantorPhoneMenuHomeLink(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "menu-home-link") }
export function withCantorPhoneMenuSubLink(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "menu-sub-link") }
export function withCantorPhoneMenuLinkText(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "menu-link-text") }
export function withCantorPhoneMenuSocialBase(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "menu-social-base") }
export function withCantorPhoneMenuSocialSup(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "menu-social-sup") }
export function withCantorPhoneMenuRule(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "menu-rule") }
export function withCantorPhoneMenuActiveSquare(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "menu-active") }
export function withCantorPhoneCubeIcon(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "cube-icon") }
export function withCantorPhoneCubeTopLeft(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "cube-top-left") }
export function withCantorPhoneCubeTopRight(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "cube-top-right") }
export function withCantorPhoneCubeBottomLeft(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "cube-bottom-left") }
export function withCantorPhoneCubeBottomRight(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "cube-bottom-right") }
export function withCantorPhoneMenuMiddleCube(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "cube-middle") }
export function withCantorPhoneMenuLabel(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "menu-label") }
export function withCantorPhoneCloseLabel(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingRole(Component, "close-label") }

export function withCantorPhoneMenuToggle(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> {
    return React.forwardRef<HTMLElement, OpeningProps>((props, ref) => {
        const s = React.useContext(OpeningContext)
        return <Component {...props} ref={ref} role="button" tabIndex={s.width < 992 && !s.frozen ? 0 : -1} aria-expanded={s.open} aria-label={s.open ? "Close menu" : "Menu"} data-cantor-opening-role="phone-toggle"
            style={{ ...props.style, ...openingStyle("phone-toggle", s) }}
            onClick={(event: OpeningEvent) => { props.onClick?.(event); s.toggle(event, "click") }}
            onTap={(event: OpeningEvent, info?: unknown) => { props.onTap?.(event, info); s.toggle(event, "tap") }}
            onKeyDown={(event: OpeningEvent) => { props.onKeyDown?.(event); if ((event.key === "Enter" || event.key === " ") && !event.repeat) { const canceled = event.defaultPrevented; event.preventDefault?.(); s.toggle({ ...event, defaultPrevented: canceled }, "key") } }} />
    })
}
export function withCantorPhoneMenuPanel(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> {
    return React.forwardRef<HTMLElement, OpeningProps>((props, ref) => {
        const s = React.useContext(OpeningContext), [node, attach] = useOpeningNode(null, ref), previous = React.useRef(s.open), running = React.useRef<Animation | null>(null), interrupted = React.useRef<string | null>(null)
        const live = !s.frozen && s.width < 992 && s.admitted, transform = s.open ? "translateX(0%) scale(1)" : "translateX(100%) scale(.78)"
        React.useLayoutEffect(() => {
            const old = previous.current; previous.current = s.open
            if (!node) return
            const from = interrupted.current || (running.current ? getComputedStyle(node).transform : old ? "translateX(0%) scale(1)" : "translateX(100%) scale(.78)")
            interrupted.current = null
            running.current?.cancel(); running.current = null
            if (!live || s.reduced || old === s.open) return
            const motion = node.animate([{ transform: from }, { transform }], { duration: 800, easing: "cubic-bezier(.22,1,.36,1)" })
            running.current = motion
            motion.onfinish = () => { if (running.current === motion) { motion.cancel(); running.current = null } }
            return () => { if (running.current === motion && node.isConnected) interrupted.current = getComputedStyle(node).transform; motion.onfinish = null; motion.cancel(); if (running.current === motion) running.current = null }
        }, [node, s.open, live, s.reduced, transform])
        return <Component {...props} ref={attach} data-cantor-opening-role="phone-menu" data-cantor-menu-open={s.open} aria-hidden={!s.open}
            inert={!s.open ? "" : undefined} style={{ ...props.style, display: s.width < 992 ? "block" : "none", position: s.frozen ? "absolute" : "fixed", top: 0, left: 0, width: "100%", height: s.frozen ? s.height : "100dvh", backgroundColor: "#fff", zIndex: 102, transform, transformOrigin: "50% 50%", pointerEvents: live && s.open ? "auto" : "none", overflow: "visible" }} />
    })
}

/** Bind native Frame hosts; genuine SVG children keep their artwork and native IDs. */
function openingCircuit(Component: ComponentType<OpeningProps>, sub: boolean): ComponentType<OpeningProps> {
    return React.forwardRef<HTMLElement, OpeningProps>((props, ref) => {
        const s = React.useContext(OpeningContext), [node, attach] = useOpeningNode(null, ref), u = s.width / 100, phone = s.width < 992, small = s.width < 480, mobile = s.width < 768
        const svgWidth = small ? "235%" : mobile ? "210%" : phone ? "185%" : "100%", offset = small ? sub ? 36 : 44 : mobile ? sub ? 46 : 56 : phone ? sub ? 66 : 78 : sub ? 205 : 220
        const progress = s.frozen || s.reduced ? 0 : mobile ? openingClamp((s.height * 1.05 - s.executionTop) / (s.height * .93)) : openingClamp((s.height - s.foundationTop) / (s.height + s.foundationHeight))
        const dash = -(sub ? 1040 : 1000) + progress * (mobile ? sub ? 1020 : 1050 : sub ? 980 : 1000), opacity = progress > .82 ? 1 - (progress - .82) / .18 : 1
        const pose = React.useRef({ dash, opacity }), repaint = React.useRef<(() => void) | null>(null); pose.current = { dash, opacity }
        React.useLayoutEffect(() => {
            if (!node) return
            const originals = new Map<SVGPathElement, { offset: string; opacity: string }>()
            const paint = () => { for (const [path, old] of originals) if (!node.contains(path)) { path.style.strokeDashoffset = old.offset; path.style.opacity = old.opacity; originals.delete(path) }; for (const path of Array.from(node.querySelectorAll<SVGPathElement>('[data-cantor-source-pulse]'))) { if (!originals.has(path)) originals.set(path, { offset: path.style.strokeDashoffset, opacity: path.style.opacity }); path.style.strokeDashoffset = String(pose.current.dash); path.style.opacity = String(pose.current.opacity) } }
            repaint.current = paint; paint(); const children = new MutationObserver(paint); children.observe(node, { childList: true, subtree: true })
            return () => { children.disconnect(); if (repaint.current === paint) repaint.current = null; for (const [path, old] of originals) { path.style.strokeDashoffset = old.offset; path.style.opacity = old.opacity } }
        }, [node])
        React.useLayoutEffect(() => { repaint.current?.() }, [dash, opacity])
        return <Component {...props} ref={attach} data-cantor-opening-role={sub ? "circuit-sub" : "circuit-main"} data-cantor-circuit-progress={progress} data-cantor-circuit-offset={dash}
            style={{ ...props.style, position: "absolute", top: (small ? 25.5 : mobile ? 9.3 : phone ? 16.2 : 8) * u + offset, left: "50%", width: svgWidth, height: "auto", aspectRatio: sub ? "1920 / 914" : "1920 / 915", transform: "translateX(-50%)", pointerEvents: "none", zIndex: 1 }} />
    })
}
export function withCantorFoundationCircuitMain(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingCircuit(Component, false) }
export function withCantorFoundationCircuitSub(Component: ComponentType<OpeningProps>): ComponentType<OpeningProps> { return openingCircuit(Component, true) }


// Manual same-module Framer package: Rolling append; retained Opening prefix above is byte-exact.

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
