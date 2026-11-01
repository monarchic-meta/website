import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget, useIsStaticRenderer } from "framer"

/**
 * SOURCE INSPIRATION / HERO-017 — Maksym Bleibtgleich, bleibtgleich.dev.
 * Actual source mark, independently implemented entrance. Source public code
 * reveals a 95×160 rectangle over .8s, then morphs to this mark over 1.2s.
 * Those durations/ease are code observations, not measured archive playback.
 * The intermediate contour correspondence is fitted; the terminal path is the
 * exact source vector. This is an animated vector asset study, not an original
 * Monarchic logo. Source reuse rights are unverified; keep the draft credited.
 *
 * Canvas/export show the final mark. Canvas motion is explicit and 12fps.
 * SVG rendering uses no Canvas bitmap, WebGL context, runtime fetch, or timer
 * outside visibility. This actor does not claim to recreate the source's
 * separate fluid-reveal background or project gallery.
 */

interface Props {
    animate?: boolean
    canvasMotion?: boolean
    color?: string
    background?: string
    duration?: number
    replay?: number
    showPlayback?: boolean
    style?: React.CSSProperties
}
type Point = readonly [number, number]
const SOURCE_PATH = "M20.064 1.6663C22.0173 1.32437 25.2528 1.28553 30.4712 2.37724C41.3446 4.65309 52.9548 14.991 55.1089 17.2669C57.2584 19.5425 63.8639 29.5439 67.2037 33.5735C70.5434 37.6031 73.399 52.1129 75.1255 54.0159C76.8525 55.9201 82.8245 67.6086 81.2681 74.9612C79.7116 82.3143 80.8632 86.9047 85.8335 89.3294C90.8038 91.7585 92.957 87.4274 92.399 91.2727C91.8059 97.3185 89.0206 97.1305 86.4615 102.431C84.4341 106.631 84.4074 110.035 84.4859 111.267C84.5076 111.613 84.4639 111.955 84.3462 112.283C83.8666 113.638 82.629 117.195 82.5679 117.918C82.4933 118.814 77.911 131.91 74.9595 133.703C72.2259 135.361 67.2036 139.946 66.4751 140.617C66.4141 140.67 66.3614 140.723 66.3091 140.784C65.4622 141.737 57.7371 150.331 51.4332 155.684C44.7539 161.357 41.6365 159.415 40.3765 158.893C39.1214 158.373 35.7294 155.039 35.7027 155.013L29.2457 147.997C29.2457 147.997 18.4854 135.273 15.7037 119.339C13.3276 105.738 5.7855 85.3936 3.6314 79.7278C3.31748 78.8947 3.45261 77.9601 3.99761 77.263C7.09727 73.3034 6.71385 64.2535 6.64409 62.8636C6.56085 61.35 1.55113 49.0909 3.60893 47.5257C5.66305 45.962 6.49793 37.5167 6.50444 37.4505C6.50444 37.4505 8.64944 19.9949 11.6578 14.9261C11.9193 14.4788 12.3115 14.1102 12.7955 13.9173C15.3983 12.8869 16.5975 7.66517 17.0728 4.74052C17.3257 3.17956 18.5162 1.93377 20.064 1.6663ZM47.7915 73.969C44.286 73.9691 41.4263 76.7465 41.2681 80.2327L23.4078 80.888C23.0007 77.654 20.2574 75.1528 16.9312 75.1526C13.3241 75.1526 10.4 78.0934 10.4 81.721C10.4002 85.3484 13.3243 88.2893 16.9312 88.2893C20.1605 88.2891 22.8407 85.9311 23.3667 82.8343L41.4634 82.1682C42.1848 85.0066 44.7445 87.1057 47.7915 87.1057C51.3983 87.1055 54.3225 84.1646 54.3228 80.5374C54.3228 76.9099 51.3985 73.9692 47.7915 73.969Z"
const OUTLINE: readonly Point[] = [[20.064,1.6663],[22.1003,1.4656],[24.1473,1.4895],[26.1872,1.6654],[28.2145,1.9529],[30.2277,2.3268],[32.2175,2.8083],[34.1673,3.4331],[36.075,4.1765],[37.9414,5.0187],[39.7678,5.9444],[41.5563,6.9416],[43.3085,8.0012],[45.0262,9.1159],[46.7106,10.2803],[48.3626,11.4903],[49.9823,12.7431],[51.5687,14.038],[53.118,15.3769],[54.6181,16.7706],[55.9821,18.2957],[57.2249,19.9231],[58.4331,21.5764],[59.6265,23.2405],[60.814,24.9088],[62.001,26.5775],[63.1925,28.2429],[64.3939,29.9013],[65.6139,31.5459],[66.8692,33.1637],[68.0536,34.83],[68.9686,36.6611],[69.7449,38.5557],[70.4413,40.4814],[71.0876,42.4244],[71.7032,44.3775],[72.3026,46.3356],[72.9006,48.2941],[73.5173,50.2468],[74.1937,52.1794],[75.1119,54.0006],[76.2695,55.6862],[77.2527,57.4821],[78.1415,59.3268],[78.9486,61.2086],[79.6736,63.1236],[80.3084,65.0703],[80.8387,67.0479],[81.2412,69.0553],[81.4805,71.0883],[81.5023,73.1347],[81.2263,75.1614],[80.8701,77.1776],[80.6573,79.2137],[80.6459,81.2603],[80.9185,83.2875],[81.5738,85.2232],[82.6738,86.9437],[84.1699,88.3346],[85.9298,89.3757],[87.8691,90.0145],[89.9077,90.0529],[91.9042,89.6054],[92.4001,91.2647],[92.0751,93.2849],[91.4036,95.2152],[90.314,96.9444],[89.0093,98.5226],[87.7704,100.152],[86.7227,101.9101],[85.8689,103.7706],[85.1983,105.7045],[84.7294,107.6969],[84.4876,109.7291],[84.4692,111.7749],[83.8442,113.722],[83.1939,115.6637],[82.6181,117.6283],[82.0757,119.5994],[81.3955,121.5309],[80.6683,123.4451],[79.8978,125.3424],[79.0794,127.2194],[78.1994,129.0683],[77.2304,130.872],[76.1045,132.5807],[74.5904,133.9354],[72.9245,135.1255],[71.3201,136.3979],[69.7509,137.7135],[68.2063,139.0579],[66.683,140.4264],[65.2841,141.92],[63.8982,143.4276],[62.4994,144.9231],[61.0877,146.4065],[59.6629,147.8774],[58.2235,149.3339],[56.7678,150.7741],[55.2934,152.1951],[53.7966,153.5926],[52.2723,154.96],[50.7081,156.2813],[49.0589,157.4943],[47.2976,158.5364],[45.404,159.3087],[43.3893,159.6367],[41.379,159.3078],[39.554,158.3966],[37.9635,157.1079],[36.4496,155.7291],[35.0167,154.2676],[33.63,152.7608],[32.2433,151.2541],[30.8565,149.7473],[29.4698,148.2405],[28.1824,146.6492],[26.9726,144.9971],[25.8131,143.3094],[24.7007,141.5901],[23.6348,139.8417],[22.6165,138.0651],[21.6469,136.2615],[20.7287,134.4312],[19.864,132.575],[19.0564,130.6933],[18.3092,128.7868],[17.6264,126.8564],[17.0124,124.9029],[16.472,122.9279],[16.0103,120.9329],[15.6294,118.921],[15.2405,116.9106],[14.8083,114.9089],[14.3407,112.9153],[13.843,110.9289],[13.3199,108.9491],[12.7743,106.9754],[12.2091,105.0071],[11.6263,103.0441],[11.0274,101.0858],[10.4142,99.132],[9.7879,97.1824],[9.149,95.2368],[8.4986,93.295],[7.8374,91.357],[7.1658,89.4224],[6.4843,87.4914],[5.7929,85.5638],[5.0918,83.6398],[4.3812,81.7193],[3.6598,79.8028],[3.6733,77.8088],[4.7551,76.0747],[5.5343,74.1836],[6.0514,72.2032],[6.3873,70.1837],[6.589,68.1461],[6.6837,66.1007],[6.6858,64.0531],[6.4606,62.0272],[5.8529,60.0718],[5.2216,58.1238],[4.6086,56.1699],[4.0375,54.2034],[3.5396,52.2173],[3.1825,50.2018],[3.2236,48.166],[4.3947,46.5178],[5.1554,44.6199],[5.6736,42.6393],[6.0648,40.6295],[6.3684,38.6045],[6.6183,36.572],[6.9011,34.5439],[7.2059,32.5189],[7.5324,30.4974],[7.8822,28.4797],[8.2587,26.4669],[8.6669,24.4602],[9.114,22.4619],[9.6123,20.4757],[10.1824,18.509],[10.8654,16.579],[11.7726,14.7468],[13.4183,13.5755],[14.7662,12.0516],[15.6642,10.2143],[16.3085,8.2715],[16.7889,6.2812],[17.1793,4.2718],[18.2501,2.5561]]
const SOURCE_DURATION = 2

const clamp = (v: number) => Math.max(0, Math.min(1, v))
function easeOut(x: number) {
    // Invert source cubic-bezier(.25,1,.5,1) without an animation dependency.
    const t = clamp(x)
    let lo = 0, hi = 1
    for (let i = 0; i < 14; i++) {
        const m = (lo + hi) / 2
        const bx = 3 * (1 - m) ** 2 * m * .25 + 3 * (1 - m) * m ** 2 * .5 + m ** 3
        if (bx < t) lo = m
        else hi = m
    }
    return 1 - (1 - (lo + hi) / 2) ** 3
}
function morphPath(amount: number) {
    if (amount >= 1) return SOURCE_PATH
    const t = easeOut(amount)
    return OUTLINE.map(([x, y], i) => {
        const dx = x - 47.5, dy = y - 80
        const k = 1 / Math.max(Math.abs(dx) / 47.5, Math.abs(dy) / 80, .00001)
        const rx = 47.5 + dx * k, ry = 80 + dy * k
        return `${i ? "L" : "M"}${(rx + (x - rx) * t).toFixed(3)} ${(ry + (y - ry) * t).toFixed(3)}`
    }).join(" ") + " Z"
}

/** @framerSupportedLayoutWidth any @framerSupportedLayoutHeight any */
export default function SourceBleibtMark(props: Props) {
    const { animate = true, canvasMotion = false, color = "#000000", background = "#ffffff", duration = SOURCE_DURATION, replay = 0, showPlayback = false, style } = props
    const target = RenderTarget.current()
    const isCanvas = target === RenderTarget.canvas
    const staticRenderer = useIsStaticRenderer()
    const frozen = staticRenderer || (isCanvas && !canvasMotion)
    const root = React.useRef<HTMLDivElement | null>(null)
    const elapsed = React.useRef(0)
    const [time, setTime] = React.useState(0)
    const [paused, setPaused] = React.useState(false)
    const [visible, setVisible] = React.useState(true)
    const [reduced, setReduced] = React.useState(false)

    React.useEffect(() => {
        if (frozen) return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(query.matches)
        update(); query.addEventListener("change", update)
        return () => query.removeEventListener("change", update)
    }, [frozen])
    React.useEffect(() => {
        if (frozen || !root.current) return
        const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
        observer.observe(root.current)
        return () => observer.disconnect()
    }, [frozen])
    React.useEffect(() => { elapsed.current = 0; setTime(0); setPaused(false) }, [replay])
    const seconds = Math.max(.1, duration)
    const running = !frozen && !reduced && animate && !paused && visible && time < seconds
    React.useEffect(() => {
        if (!running) return
        let frame = 0, previous = 0, published = 0
        const tick = (now: number) => {
            if (previous) elapsed.current = Math.min(seconds, elapsed.current + Math.min(.1, (now - previous) / 1000))
            previous = now
            if (!isCanvas || now - published >= 1000 / 12 || elapsed.current >= seconds) {
                published = now
                setTime(elapsed.current)
            }
            if (elapsed.current < seconds) frame = window.requestAnimationFrame(tick)
        }
        frame = window.requestAnimationFrame(tick)
        return () => window.cancelAnimationFrame(frame)
    }, [running, isCanvas, seconds])

    const normalized = frozen || reduced || !animate ? SOURCE_DURATION : time / seconds * SOURCE_DURATION
    const reveal = easeOut(normalized / .8)
    const morph = clamp((normalized - .8) / 1.2)
    const path = morphPath(morph)
    const replayNow = () => { elapsed.current = 0; setTime(0); setPaused(false) }
    return <div ref={root} data-source-bleibt-phase={normalized < .8 ? "reveal" : morph < 1 ? "morph" : "complete"} data-source-bleibt-time={time} data-source-bleibt-state={running ? "live" : "still"} style={{ width: "100%", height: "100%", ...style, position: "relative", color, background, overflow: "hidden" }}>
        <svg role="img" aria-label="Bleibtgleich source mark — rectangle reveal and original contour" viewBox="0 0 95 160" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block", clipPath: `inset(0 0 ${(1 - reveal) * 100}% 0)` }}>
            <path d={path} fill={color} fillRule="evenodd" />
        </svg>
        {showPlayback && !frozen && <div style={{ position: "absolute", bottom: 0, right: 0, display: "flex", gap: 4, font: "10px monospace" }}>
            <button onClick={() => setPaused(v => !v)} aria-pressed={paused}>{paused ? "PLAY" : "PAUSE"}</button>
            <button onClick={replayNow}>REPLAY</button>
        </div>}
    </div>
}

addPropertyControls(SourceBleibtMark, {
    animate: { type: ControlType.Boolean, title: "Animate", defaultValue: true },
    canvasMotion: { type: ControlType.Boolean, title: "Canvas motion", defaultValue: false },
    color: { type: ControlType.Color, title: "Mark", defaultValue: "#000000" },
    background: { type: ControlType.Color, title: "Ground", defaultValue: "#ffffff" },
    duration: { type: ControlType.Number, title: "Entrance", min: .1, max: 8, step: .1, defaultValue: 2 },
    replay: { type: ControlType.Number, title: "Replay key", min: 0, max: 100, step: 1, defaultValue: 0 },
    showPlayback: { type: ControlType.Boolean, title: "Playback", defaultValue: false },
})
