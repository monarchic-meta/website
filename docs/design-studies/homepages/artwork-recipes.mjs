// Original geometry for manual native-layer authoring in Framer. These recipes
// return editable parts; they do not connect to Framer or the production site.

const signalPalette = ["#182017", "#506B2E", "#95BB47", "#D9FF72", "#F1FFCE"];
const bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const ribbonFaces = [
  [[32, 250], [176, 24], [286, 62], [150, 282]],
  [[176, 24], [286, 62], [440, 262], [330, 302]],
  [[330, 302], [440, 262], [496, 100], [386, 140]],
];

function insidePolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function ribbonTone(face, x, y) {
  if (face === 0) return 0.28 + 0.6 * (x / 286) + 0.1 * Math.cos(y / 70);
  if (face === 1) return 0.2 + 0.6 * (1 - (y - 24) / 278);
  return 0.35 + 0.58 * (x - 330) / 166;
}

export function buildSignalLoom() {
  const pixels = [];
  for (let row = 0; row < 25; row++) {
    for (let col = 0; col < 37; col++) {
      const x = col * 14;
      const y = row * 14;
      let face = -1;
      ribbonFaces.forEach((polygon, index) => {
        if (insidePolygon(x + 6.5, y + 6.5, polygon)) face = index;
      });
      if (face < 0) continue;
      const level = Math.max(0, Math.min(0.999, ribbonTone(face, x, y))) * 4;
      const low = Math.floor(level);
      const fraction = level - low;
      const threshold = (bayer[row % 4][col % 4] + 0.5) / 16;
      const tone = Math.min(4, low + (fraction > threshold ? 1 : 0));
      pixels.push({
        name: `Fold ${face + 1} / tone ${tone} / ${row}-${col}`,
        x, y, width: 13, height: 13, fill: signalPalette[tone],
      });
    }
  }
  return {
    name: "Signal Loom / original folded tonal field",
    width: 512,
    height: 352,
    palette: [...signalPalette],
    method: "4x4 Bayer ordered distribution between adjacent palette tones across three original angular faces; 14px pitch, 13px editable square marks.",
    references: ["GRA-008", "WEB-005", "GRA-011"],
    pixels,
  };
}

export function buildVermilionIndex() {
  return {
    name: "Vermilion Index / original interrupted contour plates",
    width: 640,
    height: 380,
    references: ["GRA-007", "GRA-013", "WEB-001", "GRA-002"],
    plates: [
      {
        name: "Contour plate A", x: 24, y: 24, width: 400, height: 280,
        rotation: -12, clip: true,
        ellipses: Array.from({ length: 28 }, (_, i) => ({
          x: 180 - (56 + 13 * i) / 2, y: 180 - (30 + 8 * i) / 2,
          width: 56 + 13 * i, height: 30 + 8 * i,
          stroke: i % 7 === 0 ? "#E94E2A" : "#17171B",
          strokeWidth: i % 7 === 0 ? 2 : 1.5, fill: "transparent",
        })),
      },
      {
        name: "Contour plate B", x: 260, y: 140, width: 340, height: 220,
        rotation: 18, clip: true,
        ellipses: Array.from({ length: 22 }, (_, i) => ({
          x: 210 - (40 + 14 * i) / 2, y: 45 - (24 + 8 * i) / 2,
          width: 40 + 14 * i, height: 24 + 8 * i,
          stroke: i % 6 === 0 ? "#17171B" : "#E94E2A",
          strokeWidth: i % 6 === 0 ? 2 : 1.5, fill: "transparent",
        })),
      },
    ],
    cut: { x: 270, y: 45, width: 30, height: 310, rotation: 18, fill: "#EEE8DC" },
    ticks: [[18, 18], [600, 18], [18, 350], [600, 350], [2, 170], [622, 170], [305, 2], [305, 366]]
      .map(([x, y], index) => ({
        x, y, width: index < 4 ? 18 : 10, height: 2, fill: "#17171B",
      })),
  };
}
