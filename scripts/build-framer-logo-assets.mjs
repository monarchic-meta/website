#!/usr/bin/env node
// Offline inspection/build utility. Does not fetch, publish or synchronize Framer assets.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import ts from "typescript";

const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("astro/package.json"))("sharp");
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetDir = path.join(repo, "docs/design-studies/code-components/assets");
const out = process.argv.includes("--out") ? path.resolve(process.argv[process.argv.indexOf("--out") + 1]) : path.join(tmpdir(), "monarchic-logo-assets");
const hash = (bytes, algorithm = "sha256") => crypto.createHash(algorithm).update(bytes).digest("hex");
const gitBlob = bytes => hash(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes]), "sha1");
const svg = fs.readFileSync(path.join(assetDir, "monarchic-logo.svg"));
assert.equal(hash(svg), "71ef4b559a2f2bfaf8f8e00dffa6a820c35a3a9b77b2c55ec05c26ccc002a543", "Pinned canonical SVG bytes");
assert.equal(gitBlob(svg), "92f8fbd5704584d409cec29a38c8d28d0850839d", "Pinned GitHub blob");
const source = svg.toString("utf8");
assert.equal((source.match(/<path\b/g) || []).length, 1);
assert.ok(source.includes('viewBox="0 0 1024 1024"'));
const vectorPath = source.match(/<path\s+d="([^"]+)"/)[1];
const subpaths = vectorPath.match(/M[^M]+/g);
assert.equal(subpaths.length, 4);
assert.ok(subpaths.every(part => part.endsWith("Z")));
const helperPath = path.join(assetDir, "monarchic-logo-sdf.ts");
const helperSource = fs.readFileSync(helperPath, "utf8");
const compiled = ts.transpileModule(helperSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }, reportDiagnostics: true });
assert.ok(!(compiled.diagnostics || []).some(d => d.category === ts.DiagnosticCategory.Error));
const helper = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString("base64")}`);
assert.equal(helper.MONARCHIC_LOGO_PATH, vectorPath);
assert.deepEqual(helper.MONARCHIC_LOGO_VIEWBOX, [0, 0, 1024, 1024]);
const size = helper.LOGO_SDF_SIZE, range = helper.LOGO_SDF_DISTANCE_RANGE_PX;
assert.equal(size, 1024);assert.equal(range, 1024);
fs.mkdirSync(out, { recursive: true });
await sharp(svg).resize(size, size).flatten({ background: "#f3f0e7" }).png().toFile(path.join(out, "logo-on-paper.png"));
const raster = await sharp(svg).resize(size, size).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
assert.equal(raster.info.channels, 4);
const coverage = new Uint8Array(size * size);
for (let i = 0; i < coverage.length; i++) coverage[i] = raster.data[i * 4 + 3];
const started = performance.now();
const atlas = helper.packMonarchicLogoSDF(coverage, size, range);
const elapsedMilliseconds = performance.now() - started;
let signMismatches = 0, coverageMismatches = 0, saturatedWords = 0, insidePixels = 0;
let minX = size, minY = size, maxX = -1, maxY = -1;
for (let i = 0; i < coverage.length; i++) {
  const word = atlas[i * 4] * 256 + atlas[i * 4 + 1];
  if ((word < 32768) !== (coverage[i] >= 128)) signMismatches++;
  if (atlas[i * 4 + 2] !== coverage[i] || atlas[i * 4 + 3] !== 255) coverageMismatches++;
  if (word === 0 || word === 65535) saturatedWords++;
  if (coverage[i] >= 128) {
    insidePixels++;const x = i % size, y = Math.floor(i / size);
    minX = Math.min(minX, x);minY = Math.min(minY, y);maxX = Math.max(maxX, x);maxY = Math.max(maxY, y);
  }
}
assert.equal(signMismatches, 0);assert.equal(coverageMismatches, 0);assert.equal(saturatedWords, 0);
const features = [
  { name: "upper-right extension", x: 772, y: 217, inside: true },
  { name: "upper-left circular segment", x: 400, y: 400, inside: true },
  { name: "lower-right circular segment", x: 624, y: 624, inside: true },
  { name: "lower-left extension", x: 250, y: 800, inside: true },
  { name: "central diagonal gap", x: 512, y: 512, inside: false },
  { name: "diagonal gap continuation", x: 400, y: 643, inside: false },
  { name: "exterior", x: 64, y: 64, inside: false }
];
for (const feature of features) assert.equal(coverage[feature.y * size + feature.x] >= 128, feature.inside, feature.name);
// Degenerate masks are defined finite saturated fields, never NaN/undefined.
for (const fill of [0, 255]) {
  const fixture = new Uint8Array(64).fill(fill);
  const packed = helper.packMonarchicLogoSDF(fixture, 8, 8);
  for (let i = 0; i < fixture.length; i++) {
    const word = packed[i * 4] * 256 + packed[i * 4 + 1];
    assert.equal(word, fill === 0 ? 65535 : 0);assert.equal(packed[i * 4 + 2], fill);assert.equal(packed[i * 4 + 3], 255);
  }
}
// A small mask verifies the two-pass EDT against an independent brute-force oracle.
const tinySize = 13, tiny = new Uint8Array(tinySize * tinySize);
for (let y = 0; y < tinySize; y++) for (let x = 0; x < tinySize; x++) if ((x - 5) ** 2 + (y - 7) ** 2 < 17 && x + y > 7) tiny[y * tinySize + x] = 255;
const packedTiny = helper.packMonarchicLogoSDF(tiny, tinySize, 16);
for (let i = 0; i < tiny.length; i++) {
  let nearest = Infinity;
  for (let j = 0; j < tiny.length; j++) if (tiny[i] !== tiny[j]) nearest = Math.min(nearest, (i % tinySize - j % tinySize) ** 2 + (Math.floor(i / tinySize) - Math.floor(j / tinySize)) ** 2);
  const expected = (tiny[i] ? -1 : 1) * (Math.sqrt(nearest) - .5);
  const actual = ((packedTiny[i * 4] * 256 + packedTiny[i * 4 + 1]) / 65535 - .5) * 32;
  assert.ok(Math.abs(actual - expected) <= 16 / 65535 + 1e-10, "EDT versus brute force within quantization");
}
await sharp(Buffer.from(atlas), { raw: { width: size, height: size, channels: 4 } }).png().toFile(path.join(out, "logo-sdf-rgba.png"));
const pathParts = subpaths.map((d, index) => ({ index, name: features[index].name, d }));
const dx = 645.32365472 - 317.33050769, dy = 293.63834253 - 677.94842518;
const edgeLength = Math.hypot(dx, dy), normal = [-dy / edgeLength, dx / edgeLength];
const gapWidth = Math.abs((378.67634528 - 317.33050769) * normal[0] + (730.36165747 - 677.94842518) * normal[1]);
const result = {
  date: new Date().toISOString().slice(0, 10), passed: true,
  canonical: { repository: "https://github.com/monarchic-meta/logo", commit: "1844d35d6ffdedf2356ec929c36bb5c0454cf645", path: "logo.svg", gitBlobSHA: gitBlob(svg), sha256: hash(svg), bytes: svg.length, helperSHA256: hash(Buffer.from(helperSource)), provenance: "Pinned manual copy of the authoritative SVG; this utility does not fetch updates or synchronize Framer." },
  geometry: { viewBox: [0, 0, 1024, 1024], svgPathCount: 1, closedSubpaths: 4, fill: "#000000", stroke: null, exactSourceBounds: { minX: 150.05732267, minY: 150.05732267, maxX: 873.94267733, maxY: 873.94267733 }, approximateCore: { center: [512, 512], cardinalRadius: 255.86426108, note: "Source uses cubic Beziers; do not silently replace them with a mathematical circle." }, diagonal: { direction: [dx / edgeLength, dy / edgeLength], normal, screenAngleDegrees: Math.atan2(dy, dx) * 180 / Math.PI, gapWidth }, pathParts },
  raster: { renderer: "locked Sharp SVG raster used for offline checks; the runtime builds with exact-path Canvas Path2D", width: size, height: size, maskThreshold: "alpha >= 128", thresholdBoundsInclusive: { minX, minY, maxX, maxY }, insidePixels },
  distanceField: { dimensions: [size, size], signedDistanceRangePixels: range, positiveOutside: true, format: "RG16 affine packed word, B exact coverage, A255", quantizationMaximumErrorPixels: range / 65535, signMismatches, coverageMismatches, saturatedWords, elapsedMilliseconds, actualRGBABytes: atlas.length, approximation: "Two-pass Euclidean distance to thresholded pixel centers with a half-pixel edge correction; partial-coverage pixels use 0.5-alpha/255. This is a sampled field, not exact analytic Bezier distance. RG decoding remains affine under bilinear texture filtering." },
  checks: { pinnedSVGBytes: true, exactHelperPathAndViewBox: true, fourClosedSourceFeaturesAndGap: true, thresholdSignMaskMatches: true, originalCoveragePreservedInBlue: true, noCanonicalDistanceSaturation: true, bruteForceEDTOracle: true, emptyFullFiniteGuard: true },
  features, previews: ["logo-on-paper.png", "logo-sdf-rgba.png"]
};
fs.writeFileSync(path.join(out, "logo-geometry-and-sdf-verification.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ passed: true, canonicalSHA256: result.canonical.sha256, helperSHA256: result.canonical.helperSHA256, geometry: { closedSubpaths: 4, gapWidth, screenAngleDegrees: result.geometry.diagonal.screenAngleDegrees }, sdf: result.distanceField, out }, null, 2));
