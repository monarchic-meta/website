import * as React from "react"
import type { ComponentType } from "react"
import { addPropertyControls, ControlType, RenderTarget, useIsStaticRenderer } from "framer"

/**
 * SOURCE INSPIRATION / HERO-017 — Maksym Bleibtgleich / bleibtgleich.dev.
 * Four actual source project assets orbit under a white pointer-reveal mask.
 * Independent CPU advection/diffusion approximates the inspected fluid effect;
 * it is not the source's WebGL2 simulation. Current public-code values inform
 * stroke size, spread, decay, 24s orbit and staggered2.5s advances. Source code
 * is not imported. Differences: bounded CPU grid, fitted easing/noise,30fps
 * Preview,12fps opt-in Canvas and1MP transformed output. This is a procedural
 * asset study; typography, mark, dividers and menu remain native outside it.
 *
 * Attach withBleibtOpeningInput to the native intro parent so pointer movement
 * over its editable text reaches this background without intercepting clicks.
 * Place this component behind that text, covering the first viewport only.
 * Assign four actual source File assets, in order: Velor,bleibtgleich'25,Grabl,
 * Do Lorem Ipsum. Canvas/export are white source-at-rest stills by default.
 */

type NativeProps = { [key: string]: unknown; onPointerMoveCapture?: React.PointerEventHandler<HTMLElement>; onPointerLeave?: React.PointerEventHandler<HTMLElement>; style?: React.CSSProperties }
type Input = { x: number; y: number; stamp: number }
const inputListeners = new Set<(input: Input) => void>()
function inputAt(x: number, y: number, stamp: number) { const input = { x, y, stamp }; for (const receive of inputListeners) receive(input) }
export function withBleibtOpeningInput(Component: ComponentType<NativeProps>): ComponentType<NativeProps> {
    return React.forwardRef<HTMLElement, NativeProps>((props, ref) => {
        const target = RenderTarget.current(), staticRenderer = useIsStaticRenderer()
        // The renderer itself gates Canvas opt-in. Relay over native text so
        // an explicitly moving Canvas study can receive the same input there.
        const frozen = target === RenderTarget.export || target === RenderTarget.thumbnail || staticRenderer && target !== RenderTarget.canvas
        return <Component {...props} ref={ref}
            onPointerMoveCapture={(e: React.PointerEvent<HTMLElement>) => { props.onPointerMoveCapture?.(e); if (!frozen && !e.defaultPrevented && e.pointerType === "mouse") inputAt(e.clientX, e.clientY, e.timeStamp) }}
            onPointerLeave={(e: React.PointerEvent<HTMLElement>) => { props.onPointerLeave?.(e); if (!frozen) inputAt(-100000, -100000, e.timeStamp) }}
        />
    })
}

interface Props { image1?: string; image2?: string; image3?: string; image4?: string; animate?: boolean; canvasMotion?: boolean; revealStrength?: number; decay?: number; style?: React.CSSProperties }
type Stroke = { x: number; y: number; vx: number; vy: number }
const clamp = (x: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x))
function orbitEase(t: number) {
    let lo = 0, hi = 1
    for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2, x = 3 * (1 - m) ** 2 * m * .625 + m ** 3; if (x < clamp(t)) lo = m; else hi = m }
    const m = (lo + hi) / 2
    return 3 * (1 - m) ** 2 * m * .05 + 3 * (1 - m) * m ** 2 + m ** 3
}

/** @framerSupportedLayoutWidth any @framerSupportedLayoutHeight any */
export default function SourceBleibtOpeningField(props: Props) {
    const { image1, image2, image3, image4, animate = true, canvasMotion = false, revealStrength = 3.5, decay = 1.5, style } = props
    const target = RenderTarget.current(), staticRenderer = useIsStaticRenderer(), isCanvas = target === RenderTarget.canvas
    const canvasPreview = isCanvas && canvasMotion
    const frozen = target === RenderTarget.export || target === RenderTarget.thumbnail || staticRenderer && !canvasPreview || isCanvas && !canvasPreview || !animate
    const root = React.useRef<HTMLDivElement | null>(null), canvas = React.useRef<HTMLCanvasElement | null>(null)
    const images = React.useRef<Array<HTMLImageElement | null>>([])
    const queue = React.useRef<Stroke[]>([]), last = React.useRef<Input | null>(null)
    const orbitClock = React.useRef({ elapsed: 0, started: 0 })
    const receive = React.useRef<(input: Input) => void>(() => {})
    const [visible, setVisible] = React.useState(false), [reduced, setReduced] = React.useState(false)
    const [desktop, setDesktop] = React.useState(false)
    const [size, setSize] = React.useState({ width: 1280, height: 720, bufferWidth: 1280, bufferHeight: 720 })
    const [revision, setRevision] = React.useState(0)

    React.useEffect(() => {
        const node = root.current; if (!node) return
        const measure = () => {
            const rect = node.getBoundingClientRect(), w = node.clientWidth, h = node.clientHeight
            const ratio = Math.min(window.devicePixelRatio || 1, 2), requested = Math.max(1, rect.width * ratio) * Math.max(1, rect.height * ratio)
            const scale = Math.min(1, Math.sqrt(1000000 / requested))
            setSize({ width: w || 1280, height: h || 720, bufferWidth: Math.max(1, Math.floor(rect.width * ratio * scale)), bufferHeight: Math.max(1, Math.floor(rect.height * ratio * scale)) })
            setDesktop(isCanvas ? w >= 992 : window.innerWidth >= 992)
        }
        const ro = new ResizeObserver(measure); ro.observe(node); measure()
        window.addEventListener("resize", measure)
        const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting)); io.observe(node)
        const query = window.matchMedia("(prefers-reduced-motion: reduce)"); const motion = () => setReduced(query.matches); motion(); query.addEventListener("change", motion)
        return () => { ro.disconnect(); io.disconnect(); window.removeEventListener("resize", measure); query.removeEventListener("change", motion) }
    }, [isCanvas])
    React.useEffect(() => {
        if (frozen || reduced || !visible || !desktop) return
        orbitClock.current.started = performance.now()
        return () => {
            orbitClock.current.elapsed += Math.max(0, performance.now() - orbitClock.current.started) / 1000
            orbitClock.current.started = 0
        }
    }, [frozen, reduced, visible, desktop])
    React.useEffect(() => {
        const callback = (input: Input) => receive.current(input)
        if (!frozen) inputListeners.add(callback)
        return () => { inputListeners.delete(callback); last.current = null; queue.current = [] }
    }, [frozen])
    React.useEffect(() => {
        if (!canvas.current) return
        const node = canvas.current
        node.width = size.bufferWidth; node.height = size.bufferHeight
        const ctx = node.getContext("2d")
        if (!ctx) return
        ctx.clearRect(0, 0, node.width, node.height)
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, node.width, node.height)
        node.dataset.sourceFluidState = "still"; node.dataset.sourceFluidEnergy = "0"
        if (frozen || reduced || !visible || !desktop) { receive.current = () => {}; return }

        const gridWidth = Math.max(32, Math.min(512, Math.round(size.width / 3))), gridHeight = Math.max(24, Math.round(gridWidth * size.height / size.width))
        const count = gridWidth * gridHeight
        let density = new Float32Array(count), vx = new Float32Array(count), vy = new Float32Array(count)
        let nextD = new Float32Array(count), nextX = new Float32Array(count), nextY = new Float32Array(count)
        const scratch = document.createElement("canvas"); scratch.width = gridWidth; scratch.height = gridHeight
        const sc = scratch.getContext("2d"); if (!sc) return
        const pixels = sc.createImageData(gridWidth, gridHeight)
        let frame = 0, previous = 0, time = 0, energy = 0
        const sample = (field: Float32Array, x: number, y: number) => {
            const px = clamp(x, 0, gridWidth - 1.001), py = clamp(y, 0, gridHeight - 1.001), ix = Math.floor(px), iy = Math.floor(py), fx = px - ix, fy = py - iy, at = iy * gridWidth + ix
            return (field[at] * (1 - fx) + field[at + 1] * fx) * (1 - fy) + (field[at + gridWidth] * (1 - fx) + field[at + gridWidth + 1] * fx) * fy
        }
        const splat = (point: Stroke) => {
            const aspect = size.width / size.height, rx = .18 / aspect, ry = .18
            const x0 = Math.max(0, Math.floor((point.x - rx) * gridWidth)), x1 = Math.min(gridWidth - 1, Math.ceil((point.x + rx) * gridWidth))
            const y0 = Math.max(0, Math.floor((point.y - ry) * gridHeight)), y1 = Math.min(gridHeight - 1, Math.ceil((point.y + ry) * gridHeight))
            for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
                const dx = (x / gridWidth - point.x) * aspect, dy = y / gridHeight - point.y
                const g = Math.exp(-(dx * dx + dy * dy) / .004), at = y * gridWidth + x, mix = clamp(g * revealStrength)
                density[at] = Math.min(20, density[at] + g * revealStrength)
                vx[at] += (point.vx - vx[at]) * mix; vy[at] += (point.vy - vy[at]) * mix
            }
        }
        const orbit = (now: number) => {
            // The source's orbit continues behind its opaque white mask.
            // Keep that independent phase without drawing during idle periods.
            const clock = orbitClock.current
            const phase = clock.elapsed + (clock.started ? Math.max(0, now - clock.started) / 1000 : 0)
            const cycle = Math.floor(phase / 2.725), local = phase - cycle * 2.725, front = cycle % 4, theta = phase / 24 * Math.PI * 2
            for (let i = 0; i < 4; i++) {
                const image = images.current[i]; if (!image) continue
                const delay = ((i - front + 4) % 4) * .075, progress = cycle + orbitEase((local - delay) / 2.5), angle = (i - progress) / 4 * Math.PI * 2
                const distance = Math.sin(angle) * size.width * .3, closeness = ((Math.cos(angle) + 1) / 2) ** 1.3
                image.style.translate = `${distance * Math.cos(theta)}px ${distance * Math.sin(theta)}px`
                image.style.scale = String(.2 + closeness * .8)
                image.style.filter = `blur(${size.width * .3 * .04 * (1 - closeness)}px) brightness(${.3 + .7 * closeness})`
                image.style.zIndex = String(Math.round(closeness * 1000))
            }
            node.dataset.sourceOrbitTime = String(phase)
        }
        const tick = (now: number) => {
            frame = 0
            const limit = 1000 / (isCanvas ? 12 : 30)
            if (previous && now - previous < limit - .5) { frame = requestAnimationFrame(tick); return }
            const dt = previous ? Math.min(.05, (now - previous) / 1000) : 1 / 30
            previous = now; time += dt
            // Editor zoom changes transformed bounds without changing layout
            // or firing ResizeObserver. Refresh output adequacy while retaining
            // the logical simulation and its current density/velocity field.
            const bounds = node.getBoundingClientRect(), ratio = Math.min(window.devicePixelRatio || 1, 2)
            const requestedWidth = Math.max(1, bounds.width * ratio), requestedHeight = Math.max(1, bounds.height * ratio)
            const outputScale = Math.min(1, Math.sqrt(1000000 / (requestedWidth * requestedHeight)))
            const bw = Math.max(1, Math.floor(requestedWidth * outputScale)), bh = Math.max(1, Math.floor(requestedHeight * outputScale))
            if (node.width !== bw || node.height !== bh) { node.width = bw; node.height = bh }
            const pending = queue.current.splice(0, 32); for (const point of pending) splat(point)
            energy = 0
            for (let y = 0; y < gridHeight; y++) for (let x = 0; x < gridWidth; x++) {
                const at = y * gridWidth + x, px = x - vx[at] * dt * gridWidth, py = y - vy[at] * dt * gridHeight
                const d = sample(density, px, py), dAvg = (sample(density, px - 1, py) + sample(density, px + 1, py) + sample(density, px, py - 1) + sample(density, px, py + 1)) * .25
                const noise = .5 + .25 * Math.sin(x * .031 + y * .063 + time * .7) + .25 * Math.sin(x * .073 - y * .029 - time * .43)
                const value = (d * .21 + dAvg * .79) / (1 + decay * (.3 + 1.4 * noise) * dt)
                nextD[at] = value < .0005 ? 0 : value
                nextX[at] = sample(vx, px, py) / (1 + 3 * dt); nextY[at] = sample(vy, px, py) / (1 + 3 * dt)
                energy = Math.max(energy, value)
                const bottom = clamp((1 - y / gridHeight) / .18), edge = clamp((value * bottom - .39) / .01), a = 1 - edge * edge * (3 - 2 * edge)
                const out = at * 4; pixels.data[out] = pixels.data[out + 1] = pixels.data[out + 2] = 255; pixels.data[out + 3] = Math.round(a * 255)
            }
            ;[density, nextD] = [nextD, density]; [vx, nextX] = [nextX, vx]; [vy, nextY] = [nextY, vy]
            sc.putImageData(pixels, 0, 0); ctx.clearRect(0, 0, node.width, node.height); ctx.drawImage(scratch, 0, 0, node.width, node.height)
            orbit(now); node.dataset.sourceFluidState = "live"; node.dataset.sourceFluidEnergy = String(energy); node.dataset.sourceFluidTime = String(time)
            if (energy > .002 || queue.current.length) frame = requestAnimationFrame(tick)
            else { node.dataset.sourceFluidState = "still"; previous = 0 }
        }
        receive.current = input => {
            if (last.current?.stamp === input.stamp && last.current.x === input.x && last.current.y === input.y) return
            const rect = root.current?.getBoundingClientRect(); if (!rect) return
            const x = (input.x - rect.left) / rect.width, y = (input.y - rect.top) / rect.height
            if (x < 0 || x > 1 || y < 0 || y > 1) { last.current = null; return }
            const prior = last.current, elapsed = prior ? Math.max(.004, (input.stamp - prior.stamp) / 1000) : .016
            const dx = prior ? (input.x - prior.x) / rect.width : 0, dy = prior ? (input.y - prior.y) / rect.height : 0
            const steps = Math.min(16, Math.max(1, Math.ceil(Math.hypot(dx * size.width / size.height, dy) / .025)))
            for (let i = 1; i <= steps; i++) queue.current.push({ x: x - dx * (1 - i / steps), y: y - dy * (1 - i / steps), vx: clamp(dx / elapsed, -4, 4) * 1.6, vy: clamp(dy / elapsed, -4, 4) * 1.6 })
            if (queue.current.length > 32) queue.current.splice(0, queue.current.length - 32)
            last.current = input; if (!frame) frame = requestAnimationFrame(tick)
        }
        orbit(performance.now())
        return () => { if (frame) cancelAnimationFrame(frame); receive.current = () => {}; queue.current = []; last.current = null; density = nextD = vx = nextX = vy = nextY = new Float32Array(0); scratch.width = scratch.height = 1 }
    }, [frozen, reduced, visible, desktop, size, revealStrength, decay, isCanvas, revision])

    const active = !frozen && !reduced && desktop
    return <div ref={root} data-source-bleibt-opening="four-assets-and-fluid-mask" style={{ width: "100%", height: "100%", ...style, position: "relative", overflow: "hidden", background: "#ffffff" }} onPointerMove={e => { if (active && e.pointerType === "mouse") receive.current({ x: e.clientX, y: e.clientY, stamp: e.timeStamp }) }}>
        {[image1, image2, image3, image4].map((src, i) => src && <img key={i} ref={node => { images.current[i] = node }} src={src} alt={["Velor Dating App", "bleibtgleich'25", "Grabl App", "Do Lorem Ipsum"][i]} loading="lazy" draggable={false} onLoad={() => setRevision(v => v + 1)} style={{ position: "absolute", left: "35%", top: "30%", width: "30%", height: "40%", objectFit: "cover", visibility: active ? "visible" : "hidden", pointerEvents: "none" }} />)}
        <canvas ref={canvas} role="img" aria-label="Source-led white fluid reveal over four actual project assets" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 2000, pointerEvents: "none" }} />
    </div>
}

addPropertyControls(SourceBleibtOpeningField, {
    image1: { type: ControlType.File, title: "Velor", allowedFileTypes: ["avif", "webp", "png", "jpg"] },
    image2: { type: ControlType.File, title: "bleibtgleich25", allowedFileTypes: ["avif", "webp", "png", "jpg"] },
    image3: { type: ControlType.File, title: "Grabl", allowedFileTypes: ["avif", "webp", "png", "jpg"] },
    image4: { type: ControlType.File, title: "Do Lorem", allowedFileTypes: ["avif", "webp", "png", "jpg"] },
    animate: { type: ControlType.Boolean, title: "Animate", defaultValue: true },
    canvasMotion: { type: ControlType.Boolean, title: "Canvas motion", defaultValue: false },
    revealStrength: { type: ControlType.Number, title: "Reveal", min: .5, max: 6, step: .1, defaultValue: 3.5 },
    decay: { type: ControlType.Number, title: "Decay", min: .5, max: 4, step: .1, defaultValue: 1.5 },
})
