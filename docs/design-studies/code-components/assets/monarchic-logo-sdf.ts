/** Canonical Monarchic brand geometry; treatments do not claim authorship of the mark.
 * Source: https://github.com/monarchic-meta/logo/blob/1844d35d6ffdedf2356ec929c36bb5c0454cf645/logo.svg
 * SVG SHA-256: 71ef4b559a2f2bfaf8f8e00dffa6a820c35a3a9b77b2c55ec05c26ccc002a543
 * Canvas coordinates retain viewBox 0 0 1024 1024; positive distance is outside.
 * RG packs a 16-bit scalar; B is the original antialiased coverage; A is opaque.
 * Shader decode: ((dot(tex.rg, vec2(65280.,255.))/65535.)-.5)*2.*rangePx.
 * This is a sampled, pixel-grid distance approximation, not exact Bezier distance.
 */
export const MONARCHIC_LOGO_PATH = "M706.66949231,346.05157482 C706.66949231,346.05157482 873.94267733,150.05732267 873.94267733,150.05732267 C873.94267733,150.05732267 767.86426108,150.05732267 767.86426108,150.05732267 C767.86426108,150.05732267 645.32365472,293.63834253 645.32365472,293.63834253 C668.44455564,307.79775793 689.14966036,325.52532756 706.66949231,346.05157482 ZM645.32365472,293.63834253 C606.48376029,269.85249606 560.82665278,256.13573892 512,256.13573892 C370.81799556,256.13573892 256.13573892,370.81799556 256.13573892,512 C256.13573892,575.28945904 279.18199112,633.25359671 317.33050769,677.94842518 C317.33050769,677.94842518 645.32365472,293.63834253 645.32365472,293.63834253 ZM378.67634528,730.3616574700001 C378.67634528,730.3616574700001 706.66949231,346.05157482 706.66949231,346.05157482 C744.81800888,390.74640329 767.86426108,448.71054096 767.86426108,512 C767.86426108,653.18200444 653.18200444,767.86426108 512,767.86426108 C463.17334722,767.86426108 417.51623971000004,754.14750394 378.67634528,730.3616574700001 ZM317.33050769,677.94842518 C317.33050769,677.94842518 150.05732267,873.94267733 150.05732267,873.94267733 C150.05732267,873.94267733 256.13573892,873.94267733 256.13573892,873.94267733 C256.13573892,873.94267733 378.67634528,730.3616574700001 378.67634528,730.3616574700001 C355.55544436,716.20224207 334.85033964,698.4746724400001 317.33050769,677.94842518 Z";
export const MONARCHIC_LOGO_VIEWBOX = [0, 0, 1024, 1024] as const;
export const LOGO_SDF_SIZE = 1024;
export const LOGO_SDF_DISTANCE_RANGE_PX = 1024;

/** Squared Euclidean distance to the selected binary feature, in O(width*height). */
function logoSquaredDistance(mask: Uint8Array, width: number, height: number, feature: number): Float64Array {
    const infinity = 1e12;
    const work = new Float64Array(width * height);
    const result = new Float64Array(width * height);
    const length = Math.max(width, height);
    const input = new Float64Array(length);
    const output = new Float64Array(length);
    const sites = new Int32Array(length);
    const limits = new Float64Array(length + 1);
    const transform = (count: number) => {
        let last = -1;
        for (let q = 0; q < count; q++) {
            if (input[q] >= infinity) continue;
            let crossing = -Infinity;
            while (last >= 0) {
                const p = sites[last];
                crossing = ((input[q] + q * q) - (input[p] + p * p)) / (2 * (q - p));
                if (crossing > limits[last]) break;
                last--;
            }
            last++;
            sites[last] = q;
            limits[last] = last === 0 ? -Infinity : crossing;
            limits[last + 1] = Infinity;
        }
        if (last < 0) { output.fill(infinity, 0, count); return; }
        let site = 0;
        for (let q = 0; q < count; q++) {
            while (limits[site + 1] < q) site++;
            const distance = q - sites[site];
            output[q] = distance * distance + input[sites[site]];
        }
    };
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) input[x] = mask[y * width + x] === feature ? 0 : infinity;
        transform(width);
        for (let x = 0; x < width; x++) work[y * width + x] = output[x];
    }
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) input[y] = work[y * width + x];
        transform(height);
        for (let y = 0; y < height; y++) result[y * width + x] = output[y];
    }
    return result;
}

/** Exact sign at the documented alpha>=128 threshold; approximate pixel-grid distance. */
export function packMonarchicLogoSDF(coverage: Uint8Array, size: number, rangePx = LOGO_SDF_DISTANCE_RANGE_PX): Uint8ClampedArray {
    if (!Number.isInteger(size) || size < 1 || size > 4096 || coverage.length !== size * size || !Number.isFinite(rangePx) || rangePx <= 0) throw new Error("Invalid logo distance-field dimensions or range");
    const mask = new Uint8Array(coverage.length);
    let insideCount = 0;
    for (let i = 0; i < mask.length; i++) { mask[i] = coverage[i] >= 128 ? 1 : 0; insideCount += mask[i]; }
    const rgba = new Uint8ClampedArray(mask.length * 4);
    const toInside = insideCount === 0 || insideCount === mask.length ? null : logoSquaredDistance(mask, size, size, 1);
    const toOutside = toInside ? logoSquaredDistance(mask, size, size, 0) : null;
    for (let i = 0; i < mask.length; i++) {
        let distance = insideCount === 0 ? rangePx : -rangePx;
        if (toInside && toOutside) {
            distance = mask[i] ? .5 - Math.sqrt(toOutside[i]) : Math.sqrt(toInside[i]) - .5;
            if (coverage[i] > 0 && coverage[i] < 255) distance = .5 - coverage[i] / 255;
        }
        const normalized = Math.max(0, Math.min(1, .5 + distance / (2 * rangePx)));
        const word = Math.round(normalized * 65535);
        rgba[i * 4] = word >>> 8;
        rgba[i * 4 + 1] = word & 255;
        rgba[i * 4 + 2] = coverage[i];
        rgba[i * 4 + 3] = 255;
    }
    return rgba;
}

let monarchicLogoAtlas: HTMLCanvasElement | null = null;

/** Synchronous, network-free, once-per-module atlas used by LogoStudy's u_panel hook. */
export function paintPanel(): HTMLCanvasElement {
    if (monarchicLogoAtlas) return monarchicLogoAtlas;
    const canvas = document.createElement("canvas");
    canvas.width = LOGO_SDF_SIZE;
    canvas.height = LOGO_SDF_SIZE;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Logo distance field requires Canvas 2D");
    context.clearRect(0, 0, LOGO_SDF_SIZE, LOGO_SDF_SIZE);
    context.setTransform(LOGO_SDF_SIZE / 1024, 0, 0, LOGO_SDF_SIZE / 1024, 0, 0);
    context.fillStyle = "#000000";
    context.fill(new Path2D(MONARCHIC_LOGO_PATH));
    const raster = context.getImageData(0, 0, LOGO_SDF_SIZE, LOGO_SDF_SIZE);
    const coverage = new Uint8Array(LOGO_SDF_SIZE * LOGO_SDF_SIZE);
    for (let i = 0; i < coverage.length; i++) coverage[i] = raster.data[i * 4 + 3];
    const atlas = context.createImageData(LOGO_SDF_SIZE, LOGO_SDF_SIZE);
    atlas.data.set(packMonarchicLogoSDF(coverage, LOGO_SDF_SIZE));
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.putImageData(atlas, 0, 0);
    monarchicLogoAtlas = canvas;
    return canvas;
}
