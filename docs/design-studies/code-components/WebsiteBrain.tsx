import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget, useIsStaticRenderer } from "framer"

// Manual port of Monarchic's implemented website brain, not a new generic brain.
// Source: src/scripts/interactive-brain.ts (SHA-256 c5024620207d5a801582a745f16dc1663500b3bb20a455e9d6bd9b35364ecc7e).
// The complete anatomical geometry and static/live drawing passes below are
// preserved. Only the DOM lifecycle, backing-buffer sizing, time source and
// Framer host adaptors differ. No production imports, assets or WebGL contexts.
type Mode = "website-brain"
type Status = "waiting" | "running" | "paused" | "static" | "reduced-motion" | "offscreen" | "recovering"
interface Props {
    animate?: boolean; canvasMotion?: boolean; speed?: number; stillTime?: number
    interactive?: boolean; showLabels?: boolean; style?: React.CSSProperties
}
interface Settings {
    mode: Mode; animate: boolean; static: boolean; canvasPreview: boolean
    speed: number; stillTime: number; interactive: boolean
    primary: string; secondary: string; ink: string
    managed?: boolean; renderWidth?: number; renderHeight?: number
    managedBufferWidth?: number; managedBufferHeight?: number
    pixelBudget?: number; colorHost?: HTMLCanvasElement
    trace?: { id: number; x: number; y: number }
}

type Vector3 = {
  x: number;
  y: number;
  z: number;
};

type ProjectedPoint = Vector3;

type FiberRegion = "cerebrum" | "cerebellum" | "stem";

type CerebrumFamily =
  | "association"
  | "cortical-fold"
  | "cortical-microfold"
  | "cortical-arc"
  | "deep"
  | "temporal-longitudinal"
  | "crown-longitudinal"
  | "crown-descending"
  | "frontal-diagonal"
  | "frontal-loop"
  | "frontal-surface"
  | "temporal-loop"
  | "posterior-fan"
  | "posterior-surface"
  | "projection-tract"
  | "central-tract"
  | "local-cortical";

type FiberFamily =
  | CerebrumFamily
  | "interior-depth"
  | "posterior-depth"
  | "cerebellar-folia"
  | "cerebellar-ridge"
  | "cerebellar-shell"
  | "cerebellar-bridge"
  | "stem";

type OpacityBand = 0 | 1 | 2 | 3;

type WidthBand = 0 | 1;

type BundleTier = "dim" | "medium" | "active";

type Fiber = {
  points: Float32Array;
  projected: Float32Array;
  pointFade: Float32Array;
  region: FiberRegion;
  family: FiberFamily;
  active: boolean;
  particle: boolean;
  hot: boolean;
  activityKey: number;
  opacityBand: OpacityBand;
  phase: number;
  speed: number;
  qualityRank: number;
  bundleId: number;
  strandCount: number;
  strandSpread: number;
  boundaryScale: Float32Array;
  bundleTier: BundleTier;
  escapeStart: number;
  corticalLandmark: boolean;
  visible: boolean;
};

type FiberRenderPlan = {
  suppressed: boolean;
  liveSuppressed: boolean;
  strandVisible: Uint8Array;
  strandOffset: Float32Array;
  strandDrift: Float32Array;
  strandBend: Float32Array;
  strandBendPhase: Float32Array;
  strandStart: Float32Array;
  strandEnd: Float32Array;
};

type Pulse = {
  fiberIndices: number[];
  startedAt: number;
};

type Lobe = {
  center: Vector3;
  radius: Vector3;
};

type FieldSample = {
  value: number;
  inward: Vector3;
};

type FiberFamilyConfig = {
  family: CerebrumFamily;
  bundleCount: number;
  bundleSpread: number;
  seed: number;
  minimum: Vector3;
  maximum: Vector3;
  fieldMinimum: number;
  fieldMaximum: number;
  lengthMinimum: number;
  lengthMaximum: number;
  lengthExponent: number;
};

type SulcalGuide = {
  name: string;
  kind: "major" | "branch";
  parent?: string;
  controls: readonly Vector3[];
  channelRadius: number;
  bundleCount: number;
  seed: number;
};

type SulcalGuideGeometry = SulcalGuide & {
  samples: Vector3[];
  cumulative: Float32Array;
  length: number;
  bounds: {
    minimumX: number;
    maximumX: number;
    minimumY: number;
    maximumY: number;
  };
};

type BundleFactory = (
  trunk: Float32Array,
  region: FiberRegion,
  family: FiberFamily,
  spread: number,
  field?: (point: Vector3) => FieldSample,
  escapeTail?: { random: () => number; phase: number },
) => Fiber[];

const FIELD_SELECTOR = "[data-brain-field]";
const TAU = Math.PI * 2;
const DEPTH_LEVELS = 7;
const OPACITY_LEVELS = 4;
const WIDTH_LEVELS = 2;
const CORTEX_LIGHT_LEVELS = 4;
const OUTBOUND_OPACITY_LEVELS = 5;
const OUTBOUND_NODE_PHASES = 4;
const OUTBOUND_FIBER_COUNT = 12;
const STRUCTURAL_DEPTH_ALPHA = [0.07, 0.12, 0.2, 0.32, 0.49, 0.73, 1] as const;
const MAX_DEVICE_PIXEL_RATIO = 2;
const COMPACT_CEREBRUM_DENSITY_FLOOR = 0.12;
const PARTICLE_FIBER_COUNT = 36;
const HOT_PARTICLE_COUNT = 12;
const HORIZONTAL_MODEL_ASPECT = 0.835;
const CEREBRUM_STRAND_CYCLE = [5, 5, 5, 5] as const;
const LOWER_STRAND_CYCLE = [1, 1, 2, 2] as const;
const GEOMETRY_BATCH_SIZE = 48;

const DIM_CEREBRUM_STRAND_PATTERNS = [
  [0, 1, 2, 4],
  [0, 2, 3, 4],
  [0, 1, 2, 3],
  [1, 2, 3, 4],
  [0, 1, 2, 4],
  [0, 2, 3, 4],
  [0, 1, 2, 3],
  [1, 2, 3, 4],
] as const;

const MEDIUM_CEREBRUM_STRAND_PATTERNS = [
  [0, 1, 2, 3, 4],
] as const;

type CooperativeScheduler = {
  yield?: () => Promise<void>;
};

const yieldToBrowser = () => {
  const scheduler = (
    globalThis as typeof globalThis & {
      scheduler?: CooperativeScheduler;
    }
  ).scheduler;
  if (scheduler?.yield) return scheduler.yield();
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });
};

const FAMILY_SEEDS = {
  association: 0x4153534f,
  corticalFold: 0x464f4c44,
  corticalMicrofold: 0x4d464f4c,
  corticalArc: 0x43544152,
  deep: 0x44454550,
  temporalLongitudinal: 0x544c4f4e,
  crownLongitudinal: 0x43524c4e,
  crownDescending: 0x43524453,
  frontalDiagonal: 0x46524447,
  frontalLoop: 0x46524c50,
  frontalSurface: 0x46525346,
  temporalLoop: 0x544d4c50,
  posteriorFan: 0x5053464e,
  posteriorSurface: 0x50535346,
  projectionTract: 0x50524f4a,
  centralTract: 0x434e5452,
  localCortical: 0x4c434c43,
  rearCortical: 0x52454152,
  interiorDepth: 0x494e5444,
  posteriorDepth: 0x504f4450,
  cerebellar: 0x4342454c,
  stem: 0x5354454d,
  style: 0x5354594c,
  particles: 0x5349474e,
} as const;

const CEREBRUM_LOBES: Lobe[] = [
  {
    center: { x: -1.16, y: 0.35, z: 0 },
    radius: { x: 1.02, y: 0.91, z: 0.86 },
  },
  {
    center: { x: -0.08, y: 0.5, z: 0 },
    radius: { x: 1.5, y: 1, z: 1.01 },
  },
  {
    center: { x: 1.16, y: 0.35, z: 0 },
    radius: { x: 1.16, y: 0.92, z: 0.92 },
  },
  {
    center: { x: -0.27, y: -0.28, z: 0.02 },
    radius: { x: 1.08, y: 0.43, z: 0.84 },
  },
];

const SULCAL_GUIDES: SulcalGuide[] = [
  {
    name: "central-sulcus",
    kind: "major",
    controls: [
      { x: -0.06, y: 1.32, z: 0 },
      { x: -0.14, y: 1.05, z: 0 },
      { x: 0.01, y: 0.8, z: 0 },
      { x: -0.03, y: 0.53, z: 0 },
      { x: 0.14, y: 0.28, z: 0 },
      { x: 0.06, y: 0.06, z: 0 },
    ],
    channelRadius: 0.042,
    bundleCount: 12,
    seed: 0x43454e54,
  },
  {
    name: "precentral-sulcus",
    kind: "major",
    controls: [
      { x: -0.42, y: 1.28, z: 0 },
      { x: -0.51, y: 1.02, z: 0 },
      { x: -0.38, y: 0.75, z: 0 },
      { x: -0.49, y: 0.47, z: 0 },
      { x: -0.36, y: 0.19, z: 0 },
    ],
    channelRadius: 0.033,
    bundleCount: 10,
    seed: 0x50524543,
  },
  {
    name: "postcentral-sulcus",
    kind: "major",
    controls: [
      { x: 0.31, y: 1.26, z: 0 },
      { x: 0.22, y: 1.02, z: 0 },
      { x: 0.39, y: 0.79, z: 0 },
      { x: 0.3, y: 0.54, z: 0 },
      { x: 0.48, y: 0.29, z: 0 },
    ],
    channelRadius: 0.033,
    bundleCount: 10,
    seed: 0x504f5354,
  },
  {
    name: "lateral-fissure",
    kind: "major",
    controls: [
      { x: -1.22, y: 0.08, z: 0 },
      { x: -0.87, y: -0.01, z: 0 },
      { x: -0.52, y: -0.1, z: 0 },
      { x: -0.06, y: -0.05, z: 0 },
      { x: 0.42, y: 0.03, z: 0 },
      { x: 0.87, y: 0.15, z: 0 },
    ],
    channelRadius: 0.046,
    bundleCount: 12,
    seed: 0x4c415445,
  },
  {
    name: "superior-temporal-sulcus",
    kind: "major",
    controls: [
      { x: -1.02, y: -0.31, z: 0 },
      { x: -0.58, y: -0.39, z: 0 },
      { x: -0.08, y: -0.34, z: 0 },
      { x: 0.43, y: -0.26, z: 0 },
      { x: 0.9, y: -0.18, z: 0 },
    ],
    channelRadius: 0.034,
    bundleCount: 10,
    seed: 0x5354454d,
  },
  {
    name: "middle-temporal-sulcus",
    kind: "major",
    controls: [
      { x: -0.92, y: -0.61, z: 0 },
      { x: -0.48, y: -0.69, z: 0 },
      { x: 0.02, y: -0.62, z: 0 },
      { x: 0.45, y: -0.55, z: 0 },
      { x: 0.76, y: -0.45, z: 0 },
    ],
    channelRadius: 0.031,
    bundleCount: 10,
    seed: 0x4954454d,
  },
  {
    name: "superior-frontal-sulcus",
    kind: "major",
    controls: [
      { x: -1.79, y: 0.9, z: 0 },
      { x: -1.42, y: 0.82, z: 0 },
      { x: -1.03, y: 0.87, z: 0 },
      { x: -0.64, y: 0.79, z: 0 },
      { x: -0.33, y: 0.7, z: 0 },
    ],
    channelRadius: 0.03,
    bundleCount: 10,
    seed: 0x5346524f,
  },
  {
    name: "middle-frontal-sulcus",
    kind: "major",
    controls: [
      { x: -1.75, y: 0.47, z: 0 },
      { x: -1.42, y: 0.38, z: 0 },
      { x: -1.07, y: 0.44, z: 0 },
      { x: -0.73, y: 0.34, z: 0 },
      { x: -0.45, y: 0.28, z: 0 },
    ],
    channelRadius: 0.03,
    bundleCount: 10,
    seed: 0x4946524f,
  },
  {
    name: "intraparietal-sulcus",
    kind: "major",
    controls: [
      { x: 0.31, y: 0.84, z: 0 },
      { x: 0.64, y: 0.72, z: 0 },
      { x: 0.96, y: 0.79, z: 0 },
      { x: 1.29, y: 0.66, z: 0 },
      { x: 1.58, y: 0.58, z: 0 },
    ],
    channelRadius: 0.034,
    bundleCount: 10,
    seed: 0x494e5452,
  },
  {
    name: "parieto-occipital-sulcus",
    kind: "branch",
    parent: "intraparietal-sulcus",
    controls: [
      { x: 1.18, y: 0.7, z: 0 },
      { x: 1.08, y: 0.83, z: 0 },
      { x: 1.16, y: 0.96, z: 0 },
      { x: 1.11, y: 1.1, z: 0 },
      { x: 1.2, y: 1.2, z: 0 },
    ],
    channelRadius: 0.022,
    bundleCount: 6,
    seed: 0x5041524f,
  },
  {
    name: "calcarine-sulcus",
    kind: "branch",
    parent: "intraparietal-sulcus",
    controls: [
      { x: 1.34, y: 0.64, z: 0 },
      { x: 1.42, y: 0.49, z: 0 },
      { x: 1.55, y: 0.38, z: 0 },
      { x: 1.69, y: 0.27, z: 0 },
      { x: 1.84, y: 0.21, z: 0 },
    ],
    channelRadius: 0.019,
    bundleCount: 6,
    seed: 0x43414c43,
  },
  {
    name: "frontal-oblique-sulcus",
    kind: "branch",
    parent: "superior-frontal-sulcus",
    controls: [
      { x: -1.38, y: 0.83, z: 0 },
      { x: -1.48, y: 0.96, z: 0 },
      { x: -1.61, y: 1.04, z: 0 },
      { x: -1.76, y: 1.01, z: 0 },
    ],
    channelRadius: 0.019,
    bundleCount: 6,
    seed: 0x464f424c,
  },
  {
    name: "orbital-frontal-sulcus",
    kind: "branch",
    parent: "lateral-fissure",
    controls: [
      { x: -1.08, y: 0.04, z: 0 },
      { x: -1.24, y: -0.09, z: 0 },
      { x: -1.43, y: -0.15, z: 0 },
      { x: -1.62, y: -0.09, z: 0 },
      { x: -1.78, y: 0.02, z: 0 },
    ],
    channelRadius: 0.019,
    bundleCount: 6,
    seed: 0x4f524249,
  },
  {
    name: "inferior-temporal-fold",
    kind: "branch",
    parent: "middle-temporal-sulcus",
    controls: [
      { x: -0.36, y: -0.67, z: 0 },
      { x: -0.47, y: -0.76, z: 0 },
      { x: -0.34, y: -0.84, z: 0 },
      { x: -0.12, y: -0.83, z: 0 },
      { x: 0.08, y: -0.77, z: 0 },
    ],
    channelRadius: 0.018,
    bundleCount: 6,
    seed: 0x54464f4c,
  },
  {
    name: "occipital-arc",
    kind: "branch",
    parent: "intraparietal-sulcus",
    controls: [
      { x: 1.03, y: 0.75, z: 0 },
      { x: 1.22, y: 0.84, z: 0 },
      { x: 1.43, y: 0.83, z: 0 },
      { x: 1.62, y: 0.73, z: 0 },
      { x: 1.76, y: 0.59, z: 0 },
    ],
    channelRadius: 0.02,
    bundleCount: 6,
    seed: 0x4f434349,
  },
];

const CORTICAL_LANDMARK_GUIDES = new Set([
  "central-sulcus",
  "precentral-sulcus",
  "postcentral-sulcus",
  "lateral-fissure",
  "superior-temporal-sulcus",
  "superior-frontal-sulcus",
  "intraparietal-sulcus",
]);

const CEREBELLUM: Lobe = {
  center: { x: 1.01, y: -0.47, z: 0.06 },
  radius: { x: 0.63, y: 0.35, z: 0.46 },
};

const BRAINSTEM = {
  top: { x: 0.75, y: -0.33 },
  bottom: { x: 0.67, y: -1.08 },
  topRadius: { x: 0.46, z: 0.32 },
  centerZ: 0.07,
  curve: 0.11,
  endScale: 0.26,
} as const;

// Local cortical bundles form the substrate; regional families carry long tracts.
const CEREBRUM_FAMILIES: FiberFamilyConfig[] = [
  {
    family: "association",
    bundleCount: 110,
    bundleSpread: 0.01,
    seed: FAMILY_SEEDS.association,
    minimum: { x: -1.85, y: -0.28, z: -0.82 },
    maximum: { x: 1.78, y: 0.88, z: 0.82 },
    fieldMinimum: 0.08,
    fieldMaximum: 0.5,
    lengthMinimum: 0.85,
    lengthMaximum: 1.7,
    lengthExponent: 1.4,
  },
  {
    family: "cortical-arc",
    bundleCount: 96,
    bundleSpread: 0.007,
    seed: FAMILY_SEEDS.corticalArc,
    minimum: { x: -1.45, y: 0.28, z: -0.8 },
    maximum: { x: 1.42, y: 1.22, z: 0.8 },
    fieldMinimum: 0.1,
    fieldMaximum: 0.5,
    lengthMinimum: 1.2,
    lengthMaximum: 2.1,
    lengthExponent: 1.3,
  },
  {
    family: "deep",
    bundleCount: 105,
    bundleSpread: 0.0095,
    seed: FAMILY_SEEDS.deep,
    minimum: { x: -1.12, y: -0.44, z: -0.58 },
    maximum: { x: 1.14, y: 0.7, z: 0.58 },
    fieldMinimum: 0.46,
    fieldMaximum: 0.9,
    lengthMinimum: 1.1,
    lengthMaximum: 2.2,
    lengthExponent: 1.3,
  },
  {
    family: "temporal-longitudinal",
    bundleCount: 55,
    bundleSpread: 0.0075,
    seed: FAMILY_SEEDS.temporalLongitudinal,
    minimum: { x: -1.18, y: -0.94, z: -0.72 },
    maximum: { x: 0.92, y: -0.18, z: 0.72 },
    fieldMinimum: 0.02,
    fieldMaximum: 0.36,
    lengthMinimum: 0.8,
    lengthMaximum: 1.5,
    lengthExponent: 1.4,
  },
  {
    family: "crown-longitudinal",
    bundleCount: 81,
    bundleSpread: 0.0075,
    seed: FAMILY_SEEDS.crownLongitudinal,
    minimum: { x: -1.75, y: 0.72, z: -0.84 },
    maximum: { x: 1.72, y: 1.42, z: 0.84 },
    fieldMinimum: 0.01,
    fieldMaximum: 0.16,
    lengthMinimum: 0.9,
    lengthMaximum: 1.65,
    lengthExponent: 1.35,
  },
  {
    family: "crown-descending",
    bundleCount: 75,
    bundleSpread: 0.009,
    seed: FAMILY_SEEDS.crownDescending,
    minimum: { x: -1.65, y: 0.4, z: -0.8 },
    maximum: { x: 1.45, y: 1.17, z: 0.8 },
    fieldMinimum: 0.12,
    fieldMaximum: 0.58,
    lengthMinimum: 0.7,
    lengthMaximum: 1.4,
    lengthExponent: 1.4,
  },
  {
    family: "frontal-diagonal",
    bundleCount: 50,
    bundleSpread: 0.0095,
    seed: FAMILY_SEEDS.frontalDiagonal,
    minimum: { x: -2.02, y: -0.46, z: -0.78 },
    maximum: { x: -0.48, y: 1.18, z: 0.78 },
    fieldMinimum: 0.02,
    fieldMaximum: 0.38,
    lengthMinimum: 0.8,
    lengthMaximum: 1.65,
    lengthExponent: 1.4,
  },
  {
    family: "frontal-loop",
    bundleCount: 32,
    bundleSpread: 0.009,
    seed: FAMILY_SEEDS.frontalLoop,
    minimum: { x: -2.02, y: -0.46, z: -0.78 },
    maximum: { x: -0.48, y: 1.18, z: 0.78 },
    fieldMinimum: 0.025,
    fieldMaximum: 0.4,
    lengthMinimum: 0.65,
    lengthMaximum: 1.4,
    lengthExponent: 1.45,
  },
  {
    family: "frontal-surface",
    bundleCount: 220,
    bundleSpread: 0.006,
    seed: FAMILY_SEEDS.frontalSurface,
    minimum: { x: -2.06, y: -0.52, z: -0.82 },
    maximum: { x: -0.4, y: 1.3, z: 0.82 },
    fieldMinimum: 0.008,
    fieldMaximum: 0.2,
    lengthMinimum: 0.5,
    lengthMaximum: 1.02,
    lengthExponent: 1.42,
  },
  {
    family: "temporal-loop",
    bundleCount: 38,
    bundleSpread: 0.008,
    seed: FAMILY_SEEDS.temporalLoop,
    minimum: { x: -1.18, y: -0.94, z: -0.72 },
    maximum: { x: 0.92, y: -0.18, z: 0.72 },
    fieldMinimum: 0.02,
    fieldMaximum: 0.38,
    lengthMinimum: 0.55,
    lengthMaximum: 1.25,
    lengthExponent: 1.5,
  },
  {
    family: "posterior-fan",
    bundleCount: 65,
    bundleSpread: 0.009,
    seed: FAMILY_SEEDS.posteriorFan,
    minimum: { x: 0.48, y: -0.58, z: -0.76 },
    maximum: { x: 2.12, y: 1.18, z: 0.76 },
    fieldMinimum: 0.02,
    fieldMaximum: 0.38,
    lengthMinimum: 0.75,
    lengthMaximum: 1.5,
    lengthExponent: 1.45,
  },
  {
    family: "posterior-surface",
    bundleCount: 276,
    bundleSpread: 0.006,
    seed: FAMILY_SEEDS.posteriorSurface,
    minimum: { x: 0.42, y: -0.22, z: -0.82 },
    maximum: { x: 2.16, y: 1.34, z: 0.82 },
    fieldMinimum: 0.008,
    fieldMaximum: 0.2,
    lengthMinimum: 0.48,
    lengthMaximum: 0.9,
    lengthExponent: 1.5,
  },
  {
    family: "local-cortical",
    bundleCount: 1050,
    bundleSpread: 0.0075,
    seed: FAMILY_SEEDS.localCortical,
    minimum: { x: -1.95, y: -0.72, z: -0.86 },
    maximum: { x: 2.12, y: 1.4, z: 0.86 },
    fieldMinimum: 0.005,
    fieldMaximum: 0.2,
    lengthMinimum: 0.62,
    lengthMaximum: 1.35,
    lengthExponent: 1.35,
  },
  {
    family: "local-cortical",
    bundleCount: 240,
    bundleSpread: 0.0068,
    seed: FAMILY_SEEDS.rearCortical,
    minimum: { x: 0.38, y: -0.52, z: -0.82 },
    maximum: { x: 2.12, y: 1.24, z: 0.82 },
    fieldMinimum: 0.005,
    fieldMaximum: 0.22,
    lengthMinimum: 0.55,
    lengthMaximum: 1.15,
    lengthExponent: 1.4,
  },
];

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const smoothstep = (minimum: number, maximum: number, value: number) => {
  const normalized = clamp((value - minimum) / (maximum - minimum), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
};

const lerp = (minimum: number, maximum: number, position: number) =>
  minimum + (maximum - minimum) * position;

const mixRenderKey = (value: number) => {
  let mixed = value >>> 0;
  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, 0x21f0aaad);
  mixed ^= mixed >>> 15;
  mixed = Math.imul(mixed, 0x735a2d97);
  mixed ^= mixed >>> 15;
  return mixed >>> 0;
};

const renderUnit = (value: number) =>
  mixRenderKey(value) / 0x1_0000_0000;

const insideUpperCortexGap = (x: number, y: number) => {
  if (y < 0.66 || y > 1.34) return false;
  const height = y - 0.66;
  const frontalGap = -0.9 + height * 0.12;
  const centralGap = 0.05 - height * 0.09;
  const posteriorGap = 0.95 + height * 0.08;
  return (
    Math.abs(x - frontalGap) < 0.024 ||
    Math.abs(x - centralGap) < 0.021 ||
    Math.abs(x - posteriorGap) < 0.024
  );
};

const seededRandom = (seed: number) => {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
};

const add = (left: Vector3, right: Vector3): Vector3 => ({
  x: left.x + right.x,
  y: left.y + right.y,
  z: left.z + right.z,
});

const subtract = (left: Vector3, right: Vector3): Vector3 => ({
  x: left.x - right.x,
  y: left.y - right.y,
  z: left.z - right.z,
});

const multiply = (vector: Vector3, scalar: number): Vector3 => ({
  x: vector.x * scalar,
  y: vector.y * scalar,
  z: vector.z * scalar,
});

const dot = (left: Vector3, right: Vector3) =>
  left.x * right.x + left.y * right.y + left.z * right.z;

const cross = (left: Vector3, right: Vector3): Vector3 => ({
  x: left.y * right.z - left.z * right.y,
  y: left.z * right.x - left.x * right.z,
  z: left.x * right.y - left.y * right.x,
});

const vectorLength = (vector: Vector3) =>
  Math.hypot(vector.x, vector.y, vector.z);

const normalize = (vector: Vector3): Vector3 => {
  const length = Math.max(vectorLength(vector), 0.000001);
  return multiply(vector, 1 / length);
};

const distance = (left: Vector3, right: Vector3) =>
  vectorLength(subtract(left, right));

const rgba = (red: number, green: number, blue: number, alpha: number) =>
  "rgba(" + red + ", " + green + ", " + blue + ", " + alpha.toFixed(4) + ")";

const fieldForLobes = (point: Vector3, lobes: Lobe[]): FieldSample => {
  const scores: number[] = [];
  const gradients: Vector3[] = [];
  let maximum = Number.NEGATIVE_INFINITY;

  lobes.forEach((lobe) => {
    const normalizedX = (point.x - lobe.center.x) / lobe.radius.x;
    const normalizedY = (point.y - lobe.center.y) / lobe.radius.y;
    const normalizedZ = (point.z - lobe.center.z) / lobe.radius.z;
    const score =
      1 -
      normalizedX * normalizedX -
      normalizedY * normalizedY -
      normalizedZ * normalizedZ;
    scores.push(score);
    gradients.push({
      x: (-2 * (point.x - lobe.center.x)) / (lobe.radius.x * lobe.radius.x),
      y: (-2 * (point.y - lobe.center.y)) / (lobe.radius.y * lobe.radius.y),
      z: (-2 * (point.z - lobe.center.z)) / (lobe.radius.z * lobe.radius.z),
    });
    maximum = Math.max(maximum, score);
  });

  const sharpness = 8;
  let totalWeight = 0;
  let gradient = { x: 0, y: 0, z: 0 };
  scores.forEach((score, index) => {
    const weight = Math.exp(sharpness * (score - maximum));
    totalWeight += weight;
    gradient = add(gradient, multiply(gradients[index], weight));
  });

  return {
    value: maximum + Math.log(totalWeight) / sharpness - 0.055,
    inward: normalize(multiply(gradient, 1 / Math.max(totalWeight, 0.000001))),
  };
};

const intersectFields = (samples: FieldSample[]): FieldSample => {
  const minimum = Math.min(...samples.map((sample) => sample.value));
  const sharpness = 14;
  let totalWeight = 0;
  let value = 0;
  let inward = { x: 0, y: 0, z: 0 };
  samples.forEach((sample) => {
    const weight = Math.exp(-sharpness * (sample.value - minimum));
    totalWeight += weight;
    value += sample.value * weight;
    inward = add(inward, multiply(sample.inward, weight));
  });
  return {
    value: value / Math.max(totalWeight, 0.000001),
    inward: normalize(inward),
  };
};

const cerebrumField = (point: Vector3) => {
  const lobeUnion = fieldForLobes(point, CEREBRUM_LOBES);
  const floorY = -0.96 + smoothstep(0.35, 1.45, point.x) * 0.045;
  const floor: FieldSample = {
    value: (point.y - floorY) * 2.8,
    inward: { x: 0, y: 1, z: 0 },
  };
  const frontalBoundary = -2.08 + 0.1 * (point.y - 0.25);
  const frontalCap: FieldSample = {
    value: (point.x - frontalBoundary) * 2.4,
    inward: normalize({ x: 1, y: -0.1, z: 0 }),
  };
  const notchCenter = { x: 0.58, y: -0.82, z: 0 };
  const notchRadius = { x: 0.48, y: 0.15, z: 0.82 };
  const notchOffset = subtract(point, notchCenter);
  const notch: FieldSample = {
    value:
      ((notchOffset.x / notchRadius.x) ** 2 +
        (notchOffset.y / notchRadius.y) ** 2 +
        (notchOffset.z / notchRadius.z) ** 2 -
        1) *
      0.27,
    inward: normalize({
      x: notchOffset.x / (notchRadius.x * notchRadius.x),
      y: notchOffset.y / (notchRadius.y * notchRadius.y),
      z: notchOffset.z / (notchRadius.z * notchRadius.z),
    }),
  };
  return intersectFields([lobeUnion, floor, frontalCap, notch]);
};

const cerebellumField = (point: Vector3) =>
  fieldForLobes(point, [CEREBELLUM]);

const cerebellarSeparationVisibility = (point: Vector3) => {
  const overlap = smoothstep(-0.2, 0.08, cerebellumField(point).value);
  const posteriorInfluence = smoothstep(0.26, 0.58, point.x);
  const lowerInfluence = 1 - smoothstep(0.2, 0.52, point.y);
  return 1 - overlap * posteriorInfluence * lowerInfluence;
};

const brainstemCenterX = (position: number) =>
  lerp(BRAINSTEM.top.x, BRAINSTEM.bottom.x, position) -
  BRAINSTEM.curve * Math.sin(Math.PI * position);

const brainstemTaper = (position: number) => {
  const medullaTaper = lerp(
    1,
    BRAINSTEM.endScale,
    smoothstep(0.18, 1, position),
  );
  const ponsBulge =
    Math.exp(-(((position - 0.3) / 0.17) ** 2)) * 0.14;
  return medullaTaper + ponsBulge;
};

const brainstemField = (point: Vector3) => {
  const verticalSpan = BRAINSTEM.top.y - BRAINSTEM.bottom.y;
  const position = clamp(
    (BRAINSTEM.top.y - point.y) / verticalSpan,
    0,
    1,
  );
  const centerX = brainstemCenterX(position);
  const taper = brainstemTaper(position);
  const radiusX = BRAINSTEM.topRadius.x * taper;
  const radiusZ = BRAINSTEM.topRadius.z * taper;
  const offsetX = point.x - centerX;
  const offsetZ = point.z - BRAINSTEM.centerZ;
  const radial: FieldSample = {
    value:
      1 -
      (offsetX / radiusX) ** 2 -
      (offsetZ / radiusZ) ** 2,
    inward: normalize({
      x: (-2 * offsetX) / (radiusX * radiusX),
      y: 0,
      z: (-2 * offsetZ) / (radiusZ * radiusZ),
    }),
  };
  const top: FieldSample = {
    value: (BRAINSTEM.top.y - point.y) * 4,
    inward: { x: 0, y: -1, z: 0 },
  };
  const bottom: FieldSample = {
    value: (point.y - BRAINSTEM.bottom.y) * 4,
    inward: { x: 0, y: 1, z: 0 },
  };
  return intersectFields([radial, top, bottom]);
};

const projectTangent = (axis: Vector3, normal: Vector3) => {
  const projected = subtract(axis, multiply(normal, dot(axis, normal)));
  if (vectorLength(projected) > 0.0001) return normalize(projected);
  return normalize(cross(normal, { x: 0, y: 0, z: 1 }));
};

const familyAxis = (
  family: CerebrumFamily,
  point: Vector3,
  phase: number,
): Vector3 => {
  if (family === "association") {
    return normalize({
      x: 0.82,
      y:
        0.36 * Math.sin(point.x * 1.22 + phase) +
        0.18 * Math.sin(point.y * 1.78 - phase) +
        0.07 * Math.sin((point.x - point.y) * 2.35 + phase * 0.63),
      z: 0.2 * Math.cos(point.x + phase),
    });
  }
  if (family === "cortical-arc") {
    return normalize({
      x: 1,
      y:
        -0.36 * (point.x - 0.05) +
        0.06 * Math.sin(point.x * 1.3 + phase),
      z: 0.14 * Math.cos(point.x * 0.9 + phase),
    });
  }
  if (family === "deep") {
    const relative = subtract(point, { x: 0.08, y: 0.16, z: 0 });
    return normalize({
      x: 1,
      y:
        -0.34 * relative.x +
        0.23 * Math.sin(point.x * 1.32 + phase) +
        0.07 * Math.sin(point.y * 2.1 - phase * 0.72),
      z: 0.31 * Math.cos(point.x * 0.8 + phase),
    });
  }
  if (family === "temporal-longitudinal") {
    return normalize({
      x: 0.94,
      y: 0.13 + 0.14 * Math.cos(point.x * 1.2 + phase),
      z: 0.12 * Math.sin(point.x + phase),
    });
  }
  if (family === "crown-longitudinal") {
    return normalize({
      x: 1,
      y:
        -0.24 * (point.x - 0.05) +
        0.05 * Math.sin(point.x * 1.5 + phase),
      z: 0.12 * Math.cos(point.x + phase),
    });
  }
  if (family === "crown-descending") {
    return normalize({
      x:
        0.36 * Math.sin(point.y * 1.7 + phase) +
        0.18 * Math.sin(point.x * 1.9 - phase) +
        0.08 * Math.cos((point.x + point.y) * 2.2 + phase * 0.7),
      y: -1,
      z: 0.14 * Math.cos(point.y + phase),
    });
  }
  if (family === "frontal-diagonal") {
    return normalize({
      x: 0.55 + 0.12 * Math.sin(point.y + phase),
      y: 0.83,
      z: 0.14 * Math.cos(point.x + phase),
    });
  }
  if (family === "frontal-loop") {
    const relative = subtract(point, { x: -1.15, y: 0.18, z: 0 });
    return normalize({
      x: 0.12 - 0.74 * relative.y,
      y: 0.68 * relative.x,
      z: 0.12 * Math.sin(point.y + phase),
    });
  }
  if (family === "frontal-surface") {
    const localCenter = {
      x: -1.2 + Math.cos(phase * 1.37) * 0.24,
      y: 0.25 + Math.sin(phase * 0.83) * 0.22,
      z: 0,
    };
    const relative = subtract(point, localCenter);
    const radialX = relative.x / 0.72;
    const radialY = relative.y / 0.66;
    return normalize({
      x:
        -radialY +
        0.18 * Math.sin(point.y * 2.2 + phase) +
        0.08 * Math.sin(point.x * 2.8 - phase),
      y:
        radialX * 0.88 +
        0.12 * Math.cos(point.y * 2.1 + phase * 0.72),
      z: 0.1 * Math.sin(point.x * 1.6 + point.y * 1.3 + phase),
    });
  }
  if (family === "temporal-loop") {
    const relative = subtract(point, { x: -0.15, y: -0.52, z: 0 });
    return normalize({
      x: 0.22 - 0.82 * relative.y,
      y: 0.14 + 0.5 * relative.x,
      z: 0.13 * Math.cos(point.x + phase),
    });
  }
  if (family === "posterior-fan") {
    const relative = subtract(point, { x: 1.22, y: 0.24, z: 0 });
    return normalize({
      x: 0.08 - 0.82 * relative.y,
      y: 0.58 * relative.x,
      z: 0.13 * Math.sin(point.y + phase),
    });
  }
  if (family === "posterior-surface") {
    const localCenter = {
      x: 1.12 + Math.cos(phase * 1.21) * 0.23,
      y: 0.3 + Math.sin(phase * 0.91) * 0.2,
      z: 0,
    };
    const relative = subtract(point, localCenter);
    const radialX = relative.x / 0.7;
    const radialY = relative.y / 0.68;
    return normalize({
      x:
        -radialY +
        0.17 * Math.cos(point.y * 2.15 + phase) +
        0.075 * Math.sin(point.x * 2.7 - phase),
      y:
        radialX * 0.86 +
        0.11 * Math.sin(point.y * 2 + phase * 0.78),
      z: 0.1 * Math.cos(point.x * 1.55 + point.y * 1.25 + phase),
    });
  }
  if (family === "local-cortical") {
    const orientation = phase / TAU;
    const regionalCenter =
      point.x < -0.62
        ? { x: -1.15, y: 0.22, z: 0 }
        : point.x > 0.66
          ? { x: 1.05, y: 0.3, z: 0 }
          : { x: -0.02, y: 0.42, z: 0 };
    const relative = subtract(point, regionalCenter);
    if (orientation < 0.5) {
      return normalize({
        x: 1,
        y:
          -0.48 * relative.x +
          0.22 * Math.sin(point.y * 2.2 + phase) +
          0.11 * Math.sin(point.x * 2.6 - phase) +
          0.07 * Math.sin((point.x + point.y) * 2.9 + phase * 0.64),
        z: 0.09 * Math.cos(point.x * 1.7 + phase),
      });
    }
    if (orientation < 0.78) {
      return normalize({
        x:
          0.24 * Math.sin(point.y * 2.1 + phase) +
          relative.x * 0.09 +
          0.07 * Math.sin(point.x * 2.55 - phase * 0.74),
        y: -0.95 + 0.06 * Math.sin(point.x * 1.8 + phase),
        z: 0.08 * Math.cos(point.y * 1.5 - phase),
      });
    }
    return normalize({
      x:
        0.06 -
        relative.y * 1.02 +
        0.09 * Math.sin(point.x * 1.9 + phase),
      y:
        relative.x * 0.82 +
        0.06 * Math.cos(point.y * 2.05 - phase),
      z: 0.085 * Math.sin(point.x + point.y + phase),
    });
  }
  const sample = cerebrumField(point);
  const firstTangent = projectTangent({ x: 1, y: 0, z: 0 }, sample.inward);
  const secondTangent = normalize(cross(sample.inward, firstTangent));
  return normalize(
    add(
      multiply(firstTangent, Math.cos(phase)),
      multiply(secondTangent, Math.sin(phase)),
    ),
  );
};

const cerebrumVelocity = (
  point: Vector3,
  family: CerebrumFamily,
  phase: number,
  targetField: number,
  directionSign: number,
) => {
  const sample = cerebrumField(point);
  const rawAxis = familyAxis(family, point, phase);
  const axisTangent = projectTangent(
    rawAxis,
    sample.inward,
  );
  const volumeWeight =
    family === "crown-descending"
      ? 0.45
      : family === "frontal-diagonal"
        ? 0.48
        : family === "posterior-fan"
          ? 0.4
          : family === "deep"
            ? 0.22
            : 0.08;
  const directedAxis = normalize(
    add(
      multiply(axisTangent, 1 - volumeWeight),
      multiply(rawAxis, volumeWeight),
    ),
  );
  const side = normalize(cross(sample.inward, directedAxis));
  const primaryVariation = Math.sin(
    point.x * 1.7 + point.y * 1.1 + phase,
  );
  const secondaryVariation = Math.sin(
    point.x * 2.35 - point.y * 1.75 + phase * 0.67,
  );
  const variation =
    family === "local-cortical"
      ? 0.04 + primaryVariation * 0.17 + secondaryVariation * 0.07
      : family === "association" || family === "deep"
        ? 0.055 + primaryVariation * 0.12 + secondaryVariation * 0.045
        : 0.09 + primaryVariation * 0.07;
  const confinementStrength =
    family === "crown-descending"
      ? 0.65
      : family === "frontal-diagonal" || family === "posterior-fan"
        ? 0.82
        : 1.55;
  const confinement = clamp(
    (targetField - sample.value) * confinementStrength,
    -0.32,
    0.32,
  );
  return normalize(
    add(
      multiply(
        add(directedAxis, multiply(side, variation)),
        directionSign,
      ),
      multiply(sample.inward, confinement),
    ),
  );
};

const randomPoint = (
  random: () => number,
  minimum: Vector3,
  maximum: Vector3,
): Vector3 => ({
  x: lerp(minimum.x, maximum.x, random()),
  y: lerp(minimum.y, maximum.y, random()),
  z: lerp(minimum.z, maximum.z, random()),
});

const sampleSeed = (
  random: () => number,
  minimum: Vector3,
  maximum: Vector3,
  fieldMinimum: number,
  fieldMaximum: number,
  field: (point: Vector3) => FieldSample,
) => {
  const target = (fieldMinimum + fieldMaximum) * 0.5;
  let bestPoint = randomPoint(random, minimum, maximum);
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < 384; attempt += 1) {
    const candidate = randomPoint(random, minimum, maximum);
    const value = field(candidate).value;
    if (value >= fieldMinimum && value <= fieldMaximum) return candidate;
    const candidateDistance = Math.abs(value - target);
    if (candidateDistance < bestDistance) {
      bestDistance = candidateDistance;
      bestPoint = candidate;
    }
  }

  return bestPoint;
};

const traceDirection = (
  seed: Vector3,
  step: number,
  lengthBudget: number,
  directionSign: number,
  velocity: (point: Vector3, directionSign: number) => Vector3,
  field: (point: Vector3) => FieldSample,
  bounds: { minimum: Vector3; maximum: Vector3 },
) => {
  const points: Vector3[] = [];
  let current = seed;
  let previousVelocity: Vector3 | undefined;
  const maximumSteps = Math.ceil(lengthBudget / step);

  for (let index = 0; index < maximumSteps; index += 1) {
    const initialVelocity = velocity(current, directionSign);
    const midpoint = add(current, multiply(initialVelocity, step * 0.5));
    const midpointVelocity = velocity(midpoint, directionSign);
    const next = add(current, multiply(midpointVelocity, step));
    if (
      next.x < bounds.minimum.x ||
      next.x > bounds.maximum.x ||
      next.y < bounds.minimum.y ||
      next.y > bounds.maximum.y ||
      next.z < bounds.minimum.z ||
      next.z > bounds.maximum.z ||
      field(next).value < 0.005
    ) {
      break;
    }
    if (
      previousVelocity &&
      dot(previousVelocity, midpointVelocity) < -0.258
    ) {
      break;
    }
    points.push(next);
    current = next;
    previousVelocity = midpointVelocity;
  }

  return points;
};

const traceCerebrumFiber = (
  seed: Vector3,
  family: CerebrumFamily,
  phase: number,
  lengthBudget: number,
) => {
  const targetField = cerebrumField(seed).value;
  const velocity = (point: Vector3, directionSign: number) =>
    cerebrumVelocity(
      point,
      family,
      phase,
      targetField,
      directionSign,
    );
  const bounds = {
    minimum: { x: -2.5, y: -1.45, z: -1.12 },
    maximum: { x: 2.45, y: 1.72, z: 1.12 },
  };
  const backwards = traceDirection(
    seed,
    0.085,
    lengthBudget * 0.5,
    -1,
    velocity,
    cerebrumField,
    bounds,
  ).reverse();
  const forwards = traceDirection(
    seed,
    0.085,
    lengthBudget * 0.5,
    1,
    velocity,
    cerebrumField,
    bounds,
  );
  return [...backwards, seed, ...forwards];
};

const trajectoryArcLength = (points: Vector3[]) => {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += distance(points[index - 1], points[index]);
  }
  return length;
};

const trajectoryPlanarDeviation = (points: Vector3[]) => {
  if (points.length < 3) return 0;
  const first = points[0];
  const last = points[points.length - 1];
  const deltaX = last.x - first.x;
  const deltaY = last.y - first.y;
  const chordLength = Math.max(0.0001, Math.hypot(deltaX, deltaY));
  let maximumDeviation = 0;
  for (const point of points) {
    maximumDeviation = Math.max(
      maximumDeviation,
      Math.abs(
        deltaY * point.x -
          deltaX * point.y +
          last.x * first.y -
          last.y * first.x,
      ) / chordLength,
    );
  }
  return maximumDeviation;
};

const minimumArcLength = (family: CerebrumFamily) => {
  if (family === "local-cortical") return 0.38;
  if (
    family === "frontal-loop" ||
    family === "frontal-surface" ||
    family === "temporal-loop" ||
    family === "crown-descending" ||
    family === "posterior-surface"
  ) {
    return 0.5;
  }
  if (
    family === "temporal-longitudinal" ||
    family === "crown-longitudinal"
  ) {
    return 0.55;
  }
  if (family === "cortical-arc" || family === "deep") return 0.78;
  return 0.6;
};

const interpolateVector = (
  left: Vector3,
  right: Vector3,
  position: number,
): Vector3 => ({
  x: lerp(left.x, right.x, position),
  y: lerp(left.y, right.y, position),
  z: lerp(left.z, right.z, position),
});

const catmullRomPoint = (
  pointZero: Vector3,
  pointOne: Vector3,
  pointTwo: Vector3,
  pointThree: Vector3,
  position: number,
) => {
  const knotZero = 0;
  const knotOne =
    knotZero + Math.sqrt(Math.max(distance(pointZero, pointOne), 0.0001));
  const knotTwo =
    knotOne + Math.sqrt(Math.max(distance(pointOne, pointTwo), 0.0001));
  const knotThree =
    knotTwo + Math.sqrt(Math.max(distance(pointTwo, pointThree), 0.0001));
  const knot = lerp(knotOne, knotTwo, position);
  const first = interpolateVector(
    pointZero,
    pointOne,
    (knot - knotZero) / (knotOne - knotZero),
  );
  const second = interpolateVector(
    pointOne,
    pointTwo,
    (knot - knotOne) / (knotTwo - knotOne),
  );
  const third = interpolateVector(
    pointTwo,
    pointThree,
    (knot - knotTwo) / (knotThree - knotTwo),
  );
  const fourth = interpolateVector(
    first,
    second,
    (knot - knotZero) / (knotTwo - knotZero),
  );
  const fifth = interpolateVector(
    second,
    third,
    (knot - knotOne) / (knotThree - knotOne),
  );
  return interpolateVector(
    fourth,
    fifth,
    (knot - knotOne) / (knotTwo - knotOne),
  );
};

const smoothTrajectory = (points: Vector3[]) => {
  if (points.length < 4) return points;
  const smoothed: Vector3[] = [points[0]];
  for (let index = 0; index < points.length - 1; index += 1) {
    const pointZero = points[Math.max(0, index - 1)];
    const pointOne = points[index];
    const pointTwo = points[index + 1];
    const pointThree = points[Math.min(points.length - 1, index + 2)];
    for (let step = 1; step <= 3; step += 1) {
      smoothed.push(
        catmullRomPoint(
          pointZero,
          pointOne,
          pointTwo,
          pointThree,
          step / 3,
        ),
      );
    }
  }
  return smoothed;
};

const resampleTrajectory = (
  points: Vector3[],
  spacing: number,
  minimumCount = 18,
  maximumCount = 48,
) => {
  if (points.length < 2) {
    const point = points[0] ?? { x: 0, y: 0, z: 0 };
    return new Float32Array([
      point.x,
      point.y,
      point.z,
      point.x + 0.001,
      point.y,
      point.z,
    ]);
  }

  const cumulative = new Float32Array(points.length);
  let totalLength = 0;
  for (let index = 1; index < points.length; index += 1) {
    totalLength += distance(points[index - 1], points[index]);
    cumulative[index] = totalLength;
  }
  const sampleCount = clamp(
    Math.ceil(totalLength / spacing) + 1,
    minimumCount,
    maximumCount,
  );
  const result = new Float32Array(sampleCount * 3);
  let segment = 1;
  for (let index = 0; index < sampleCount; index += 1) {
    const targetDistance =
      (index / Math.max(1, sampleCount - 1)) * totalLength;
    while (
      segment < points.length - 1 &&
      cumulative[segment] < targetDistance
    ) {
      segment += 1;
    }
    const startDistance = cumulative[segment - 1];
    const endDistance = cumulative[segment];
    const position =
      endDistance === startDistance
        ? 0
        : (targetDistance - startDistance) /
          (endDistance - startDistance);
    const point = interpolateVector(
      points[segment - 1],
      points[segment],
      position,
    );
    result[index * 3] = point.x;
    result[index * 3 + 1] = point.y;
    result[index * 3 + 2] = point.z;
  }
  return result;
};

const buildSulcalGuideGeometry = (
  guide: SulcalGuide,
): SulcalGuideGeometry => {
  const sampled = resampleTrajectory(
    smoothTrajectory([...guide.controls]),
    0.045,
    12,
    64,
  );
  const samples: Vector3[] = [];
  let minimumX = Number.POSITIVE_INFINITY;
  let maximumX = Number.NEGATIVE_INFINITY;
  let minimumY = Number.POSITIVE_INFINITY;
  let maximumY = Number.NEGATIVE_INFINITY;
  for (let offset = 0; offset < sampled.length; offset += 3) {
    const point = {
      x: sampled[offset],
      y: sampled[offset + 1],
      z: 0,
    };
    samples.push(point);
    minimumX = Math.min(minimumX, point.x);
    maximumX = Math.max(maximumX, point.x);
    minimumY = Math.min(minimumY, point.y);
    maximumY = Math.max(maximumY, point.y);
  }
  const cumulative = new Float32Array(samples.length);
  let length = 0;
  for (let index = 1; index < samples.length; index += 1) {
    length += distance(samples[index - 1], samples[index]);
    cumulative[index] = length;
  }
  return {
    ...guide,
    samples,
    cumulative,
    length,
    bounds: {
      minimumX,
      maximumX,
      minimumY,
      maximumY,
    },
  };
};

const MAJOR_SULCAL_GUIDE_GEOMETRY = SULCAL_GUIDES.filter(
  (guide) => guide.kind === "major",
).map(buildSulcalGuideGeometry);

const SULCAL_GUIDE_GEOMETRY = [
  ...MAJOR_SULCAL_GUIDE_GEOMETRY,
  ...SULCAL_GUIDES.filter((guide) => guide.kind === "branch").map(
    (guide) => {
      const parent = MAJOR_SULCAL_GUIDE_GEOMETRY.find(
        (candidate) => candidate.name === guide.parent,
      );
      if (!parent) return buildSulcalGuideGeometry(guide);
      const requestedAttachment = guide.controls[0];
      const attachment = parent.samples.reduce((nearest, sample) =>
        distance(sample, requestedAttachment) <
        distance(nearest, requestedAttachment)
          ? sample
          : nearest,
      );
      return buildSulcalGuideGeometry({
        ...guide,
        controls: [attachment, ...guide.controls.slice(1)],
      });
    },
  ),
];

const pointOnSulcalGuide = (
  guide: SulcalGuideGeometry,
  progress: number,
) => {
  const targetDistance = clamp(progress, 0, 1) * guide.length;
  let segment = 1;
  while (
    segment < guide.samples.length - 1 &&
    guide.cumulative[segment] < targetDistance
  ) {
    segment += 1;
  }
  const startDistance = guide.cumulative[segment - 1];
  const endDistance = guide.cumulative[segment];
  const position =
    endDistance === startDistance
      ? 0
      : (targetDistance - startDistance) /
        (endDistance - startDistance);
  return interpolateVector(
    guide.samples[segment - 1],
    guide.samples[segment],
    position,
  );
};

const planarDistanceToSegment = (
  point: Vector3,
  start: Vector3,
  end: Vector3,
) => {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;
  if (lengthSquared < 0.000001) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }
  const position = clamp(
    ((point.x - start.x) * deltaX +
      (point.y - start.y) * deltaY) /
      lengthSquared,
    0,
    1,
  );
  return Math.hypot(
    point.x - lerp(start.x, end.x, position),
    point.y - lerp(start.y, end.y, position),
  );
};

const sulcalChannelVisibility = (point: Vector3) => {
  const depthInfluence = smoothstep(-0.22, 0.42, point.z);
  if (depthInfluence <= 0) return 1;
  let visibility = 1;
  for (const guide of SULCAL_GUIDE_GEOMETRY) {
    const effectiveRadius = guide.channelRadius * 0.64;
    const searchRadius = effectiveRadius * 1.35;
    if (
      point.x < guide.bounds.minimumX - searchRadius ||
      point.x > guide.bounds.maximumX + searchRadius ||
      point.y < guide.bounds.minimumY - searchRadius ||
      point.y > guide.bounds.maximumY + searchRadius
    ) {
      continue;
    }
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (let index = 1; index < guide.samples.length; index += 1) {
      nearestDistance = Math.min(
        nearestDistance,
        planarDistanceToSegment(
          point,
          guide.samples[index - 1],
          guide.samples[index],
        ),
      );
    }
    const channelVisibility = smoothstep(
      effectiveRadius * 0.58,
      effectiveRadius * 1.28,
      nearestDistance,
    );
    visibility = Math.min(
      visibility,
      lerp(1, channelVisibility, depthInfluence),
    );
  }
  return visibility;
};

const nearestSulcalInfluence = (
  point: Vector3,
  maximumDistance: number,
) => {
  let nearest:
    | {
        distance: number;
        signedDistance: number;
        normal: Vector3;
        channelRadius: number;
      }
    | undefined;
  for (const guide of SULCAL_GUIDE_GEOMETRY) {
    if (
      point.x < guide.bounds.minimumX - maximumDistance ||
      point.x > guide.bounds.maximumX + maximumDistance ||
      point.y < guide.bounds.minimumY - maximumDistance ||
      point.y > guide.bounds.maximumY + maximumDistance
    ) {
      continue;
    }
    for (let index = 1; index < guide.samples.length; index += 1) {
      const start = guide.samples[index - 1];
      const end = guide.samples[index];
      const deltaX = end.x - start.x;
      const deltaY = end.y - start.y;
      const lengthSquared = deltaX * deltaX + deltaY * deltaY;
      if (lengthSquared < 0.000001) continue;
      const position = clamp(
        ((point.x - start.x) * deltaX +
          (point.y - start.y) * deltaY) /
          lengthSquared,
        0,
        1,
      );
      const closestX = lerp(start.x, end.x, position);
      const closestY = lerp(start.y, end.y, position);
      const inverseLength = 1 / Math.sqrt(lengthSquared);
      const normal = {
        x: -deltaY * inverseLength,
        y: deltaX * inverseLength,
        z: 0,
      };
      const offsetX = point.x - closestX;
      const offsetY = point.y - closestY;
      const signedDistance = offsetX * normal.x + offsetY * normal.y;
      const candidateDistance = Math.hypot(offsetX, offsetY);
      if (
        candidateDistance > maximumDistance ||
        (nearest && candidateDistance >= nearest.distance)
      ) {
        continue;
      }
      nearest = {
        distance: candidateDistance,
        signedDistance,
        normal,
        channelRadius: guide.channelRadius * 0.64,
      };
    }
  }
  return nearest;
};

const warpTrajectoryAroundSulci = (
  points: Vector3[],
  family: CerebrumFamily,
) => {
  if (family === "cortical-fold") return points;
  const localFiber = family === "local-cortical";
  const maximumDistance = localFiber ? 0.18 : 0.13;
  return points.map((point, index) => {
    const depthInfluence = smoothstep(-0.28, 0.52, point.z);
    if (depthInfluence <= 0) return point;
    const nearest = nearestSulcalInfluence(point, maximumDistance);
    if (!nearest) return point;
    const influence =
      1 -
      smoothstep(
        nearest.channelRadius * 0.65,
        maximumDistance,
        nearest.distance,
      );
    if (influence <= 0) return point;
    const side =
      Math.abs(nearest.signedDistance) > 0.002
        ? Math.sign(nearest.signedDistance)
        : mixRenderKey(index ^ Math.round(point.z * 1000)) % 2 === 0
          ? -1
          : 1;
    const desiredDistance =
      nearest.channelRadius + (localFiber ? 0.034 : 0.022);
    const displacement =
      (Math.max(0, desiredDistance - nearest.distance) +
        influence * (localFiber ? 0.018 : 0.01)) *
      influence *
      depthInfluence;
    if (displacement <= 0.0001) return point;
    let candidate = {
      x: point.x + nearest.normal.x * displacement * side,
      y: point.y + nearest.normal.y * displacement * side,
      z: point.z,
    };
    if (cerebrumField(candidate).value < 0.005) {
      candidate = interpolateVector(point, candidate, 0.45);
    }
    return candidate;
  });
};

const curveLocalCorticalTrajectory = (
  points: Vector3[],
  phase: number,
) => {
  if (points.length < 4) return points;
  const first = points[0];
  const last = points[points.length - 1];
  const chord = subtract(last, first);
  const planarLength = Math.hypot(chord.x, chord.y);
  if (planarLength < 0.08) return points;
  const normal = {
    x: -chord.y / planarLength,
    y: chord.x / planarLength,
  };
  const broadKey = 0.5 + Math.sin(phase * 1.37) * 0.5;
  const localKey = 0.5 + Math.cos(phase * 0.83) * 0.5;
  const broadCycles = lerp(0.58, 1.12, broadKey);
  const broadAmplitude = lerp(0.035, 0.072, localKey);
  const localCycles = lerp(1.7, 2.8, localKey);
  const localAmplitude = lerp(0.007, 0.017, broadKey);
  return points.map((point, index) => {
    const position = index / Math.max(1, points.length - 1);
    const envelope = Math.sin(Math.PI * position);
    const displacement =
      (Math.sin(position * TAU * broadCycles + phase) * broadAmplitude +
        Math.sin(position * TAU * localCycles + phase * 1.31) *
          localAmplitude) *
      envelope;
    const candidate = {
      x: point.x + normal.x * displacement,
      y: point.y + normal.y * displacement,
      z:
        point.z +
        Math.sin(position * Math.PI * 1.6 + phase * 0.67) *
          0.006 *
          envelope,
    };
    return cerebrumField(candidate).value >= 0.005
      ? candidate
      : interpolateVector(point, candidate, 0.4);
  });
};

const curveRegionalTrajectory = (
  points: Vector3[],
  phase: number,
  family: CerebrumFamily,
) => {
  const broadAmplitude =
    family === "frontal-surface"
      ? 0.045
      : family === "frontal-diagonal"
        ? 0.055
        : family === "association"
          ? 0.06
          : family === "deep"
            ? 0.04
            : family === "posterior-fan"
              ? 0.035
              : family === "crown-longitudinal"
                ? 0.03
                : family === "temporal-longitudinal"
                  ? 0.026
                  : 0;
  if (broadAmplitude === 0 || points.length < 4) return points;
  const first = points[0];
  const last = points[points.length - 1];
  const chord = subtract(last, first);
  const planarLength = Math.hypot(chord.x, chord.y);
  if (planarLength < 0.12) return points;
  const normal = {
    x: -chord.y / planarLength,
    y: chord.x / planarLength,
  };
  const broadCycles = lerp(
    0.48,
    0.86,
    0.5 + Math.sin(phase * 1.27) * 0.5,
  );
  const localCycles = lerp(
    1.3,
    2.15,
    0.5 + Math.cos(phase * 0.91) * 0.5,
  );
  const localAmplitude = broadAmplitude * 0.22;
  return points.map((point, index) => {
    const position = index / Math.max(1, points.length - 1);
    const envelope = Math.sin(Math.PI * position);
    const displacement =
      (Math.sin(position * TAU * broadCycles + phase) * broadAmplitude +
        Math.sin(position * TAU * localCycles + phase * 1.31) *
          localAmplitude) *
      envelope;
    const candidate = {
      x: point.x + normal.x * displacement,
      y: point.y + normal.y * displacement,
      z:
        point.z +
        Math.sin(position * Math.PI * 1.4 + phase * 0.63) *
          broadAmplitude *
          0.12 *
          envelope,
    };
    return cerebrumField(candidate).value >= 0.005
      ? candidate
      : interpolateVector(point, candidate, 0.4);
  });
};

const pointOnCorticalSurface = (
  candidate: Vector3,
  guidePoint: Vector3,
  targetField: number,
) => {
  let x = candidate.x;
  let y = candidate.y;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (cerebrumField({ x, y, z: 0 }).value >= targetField + 0.025) {
      break;
    }
    x = lerp(x, guidePoint.x, 0.38);
    y = lerp(y, guidePoint.y, 0.38);
  }
  let lower = 0;
  let upper = 1.18;
  if (cerebrumField({ x, y, z: lower }).value < targetField) {
    return { x: guidePoint.x, y: guidePoint.y, z: 0.08 };
  }
  for (let iteration = 0; iteration < 14; iteration += 1) {
    const midpoint = (lower + upper) * 0.5;
    if (cerebrumField({ x, y, z: midpoint }).value >= targetField) {
      lower = midpoint;
    } else {
      upper = midpoint;
    }
  }
  return { x, y, z: Math.max(0.06, lower) };
};

const createCorticalFoldTrajectory = (
  guide: SulcalGuideGeometry,
  bundleIndex: number,
  random: () => number,
) => {
  const bankSign = bundleIndex % 2 === 0 ? -1 : 1;
  const bankRank = Math.floor(bundleIndex / 2);
  const bankFiberCount = Math.ceil(guide.bundleCount / 2);
  const baseLanePosition = bankRank / Math.max(1, bankFiberCount - 1);
  const lanePosition = clamp(
    baseLanePosition * lerp(0.78, 1.22, random()) +
      (random() - 0.5) * 0.08,
    0,
    1.14,
  );
  const anchorFiber = bankRank === 0;
  const primaryAnchor =
    guide.name === "central-sulcus" || guide.name === "lateral-fissure";
  const coverage = anchorFiber
    ? primaryAnchor
      ? lerp(0.86, 0.98, random())
      : lerp(0.8, 0.96, random())
    : guide.kind === "major"
      ? lerp(0.58, 0.93, random())
      : lerp(0.5, 0.84, random());
  const start = random() * (1 - coverage);
  const end = start + coverage;
  const segmentLength = guide.length * coverage;
  const sampleCount = clamp(
    Math.ceil(segmentLength / 0.055) + 1,
    9,
    36,
  );
  const guidePhase = renderUnit(guide.seed ^ 0x50484153) * TAU;
  const guideWave = lerp(
    guide.kind === "major" ? 0.34 : 0.24,
    guide.kind === "major" ? 0.52 : 0.38,
    renderUnit(guide.seed ^ 0x57415645),
  );
  const guideAmplitude = lerp(
    0.008,
    guide.kind === "major" ? 0.02 : 0.015,
    renderUnit(guide.seed ^ 0x414d504c),
  );
  const broadPhase = guidePhase + (random() - 0.5) * 1.2;
  const broadWave = guideWave * lerp(0.72, 1.3, random());
  const broadAmplitude = lerp(
    0.016,
    guide.kind === "major" ? 0.045 : 0.033,
    random(),
  );
  const localPhase = random() * TAU;
  const localWave = lerp(0.14, 0.26, random());
  const localAmplitude = lerp(0.003, 0.01, random());
  const effectiveChannelRadius = guide.channelRadius * 0.64;
  const baseOffset =
    effectiveChannelRadius +
    (guide.kind === "major" ? 0.013 : 0.01) +
    lanePosition * (guide.kind === "major" ? 0.04 : 0.025) +
    (random() - 0.5) * 0.006;
  const branchingGuide =
    guide.name === "superior-frontal-sulcus" ||
    guide.name === "superior-temporal-sulcus" ||
    guide.name === "intraparietal-sulcus" ||
    guide.name === "precentral-sulcus" ||
    guide.name === "postcentral-sulcus";
  const branchFiber =
    branchingGuide &&
    bankRank === bankFiberCount - 1 &&
    bundleIndex % 2 === guide.seed % 2;
  const longitudinalSkew = (random() - 0.5) * 0.05;
  const terminalDrift = anchorFiber
    ? 0
    : (random() - 0.5) * (guide.kind === "major" ? 0.075 : 0.052);
  const terminalDriftStart = lerp(0.38, 0.64, random());
  const targetField = clamp(
    0.065 + random() * 0.06,
    0.06,
    0.16,
  );
  const trajectory: Vector3[] = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const position = index / Math.max(1, sampleCount - 1);
    const guideProgress = lerp(start, end, position);
    const guidePoint = pointOnSulcalGuide(guide, guideProgress);
    const tangentBefore = pointOnSulcalGuide(
      guide,
      Math.max(0, guideProgress - 0.012),
    );
    const tangentAfter = pointOnSulcalGuide(
      guide,
      Math.min(1, guideProgress + 0.012),
    );
    const tangent = normalize({
      x: tangentAfter.x - tangentBefore.x,
      y: tangentAfter.y - tangentBefore.y,
      z: 0,
    });
    const normal = { x: -tangent.y, y: tangent.x, z: 0 };
    const guideDistance = guideProgress * guide.length;
    const sharedNoise =
      Math.sin((guideDistance / guideWave) * TAU + guidePhase) *
      guideAmplitude;
    const broadNoise =
      Math.sin((guideDistance / broadWave) * TAU + broadPhase) *
      broadAmplitude;
    const localNoise =
      Math.sin((guideDistance / localWave) * TAU + localPhase) *
        localAmplitude +
      Math.sin(
        (guideDistance / (localWave * 0.58)) * TAU +
          localPhase * 1.37,
      ) *
        localAmplitude *
        0.32;
    const offsetMagnitude = Math.max(
      effectiveChannelRadius + 0.009,
      baseOffset +
        sharedNoise * 0.62 +
        broadNoise +
        localNoise +
        longitudinalSkew * (position - 0.5) +
        terminalDrift * smoothstep(terminalDriftStart, 1, position) +
        (branchFiber ? smoothstep(0.52, 1, position) * 0.042 : 0),
    );
    const candidate = {
      x: guidePoint.x + normal.x * offsetMagnitude * bankSign,
      y: guidePoint.y + normal.y * offsetMagnitude * bankSign,
      z: 0,
    };
    trajectory.push(
      pointOnCorticalSurface(candidate, guidePoint, targetField),
    );
  }
  return resampleTrajectory(
    smoothTrajectory(smoothTrajectory(trajectory)),
    0.045,
    12,
    52,
  );
};

const createCorticalMicrofoldTrajectory = (
  guide: SulcalGuideGeometry,
  bundleIndex: number,
  bundleCount: number,
  random: () => number,
) => {
  const bankSign = bundleIndex % 2 === 0 ? -1 : 1;
  const bankRank = Math.floor(bundleIndex / 2);
  const bankCount = Math.ceil(bundleCount / 2);
  const lanePosition = clamp(
    bankRank / Math.max(1, bankCount - 1) +
      (random() - 0.5) * 0.18,
    0,
    1.12,
  );
  const coverage =
    guide.kind === "major"
      ? lerp(0.34, 0.7, random())
      : lerp(0.28, 0.58, random());
  const start = random() * (1 - coverage);
  const end = start + coverage;
  const sampleCount = clamp(
    Math.ceil((guide.length * coverage) / 0.042) + 1,
    8,
    34,
  );
  const broadPhase = random() * TAU;
  const broadWave = lerp(0.24, 0.52, random());
  const broadAmplitude = lerp(0.012, 0.035, random());
  const localPhase = random() * TAU;
  const localWave = lerp(0.11, 0.22, random());
  const localAmplitude = lerp(0.002, 0.007, random());
  const effectiveChannelRadius = guide.channelRadius * 0.64;
  const baseOffset =
    effectiveChannelRadius +
    lerp(0.035, guide.kind === "major" ? 0.19 : 0.13, lanePosition) +
    (random() - 0.5) * 0.014;
  const endDrift = (random() - 0.5) * 0.09;
  const targetField = lerp(0.025, 0.14, random());
  const trajectory: Vector3[] = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const position = index / Math.max(1, sampleCount - 1);
    const guideProgress = lerp(start, end, position);
    const guidePoint = pointOnSulcalGuide(guide, guideProgress);
    const tangentBefore = pointOnSulcalGuide(
      guide,
      Math.max(0, guideProgress - 0.012),
    );
    const tangentAfter = pointOnSulcalGuide(
      guide,
      Math.min(1, guideProgress + 0.012),
    );
    const tangent = normalize({
      x: tangentAfter.x - tangentBefore.x,
      y: tangentAfter.y - tangentBefore.y,
      z: 0,
    });
    const normal = { x: -tangent.y, y: tangent.x, z: 0 };
    const guideDistance = guideProgress * guide.length;
    const endpointEnvelope = Math.sin(Math.PI * position);
    const broadNoise =
      Math.sin((guideDistance / broadWave) * TAU + broadPhase) *
      broadAmplitude;
    const localNoise =
      Math.sin((guideDistance / localWave) * TAU + localPhase) *
      localAmplitude;
    const offset =
      baseOffset +
      broadNoise * endpointEnvelope +
      localNoise * endpointEnvelope +
      endDrift * smoothstep(0.42, 1, position);
    const candidate = {
      x: guidePoint.x + normal.x * offset * bankSign,
      y: guidePoint.y + normal.y * offset * bankSign,
      z: 0,
    };
    trajectory.push(
      pointOnCorticalSurface(candidate, guidePoint, targetField),
    );
  }

  return resampleTrajectory(
    smoothTrajectory(trajectory),
    0.034,
    10,
    46,
  );
};

const PROJECTION_SECTORS = [
  {
    minimum: { x: -1.9, y: 0.46, z: -0.82 },
    maximum: { x: -0.72, y: 1.3, z: 0.82 },
  },
  {
    minimum: { x: -0.78, y: 0.78, z: -0.88 },
    maximum: { x: 0.34, y: 1.46, z: 0.88 },
  },
  {
    minimum: { x: 0.22, y: 0.72, z: -0.84 },
    maximum: { x: 1.36, y: 1.38, z: 0.84 },
  },
  {
    minimum: { x: 1.02, y: 0.08, z: -0.78 },
    maximum: { x: 2.08, y: 1.04, z: 0.78 },
  },
] as const;

const createProjectionTractTrajectory = (
  bundleIndex: number,
  random: () => number,
) => {
  const sectorIndex = bundleIndex % PROJECTION_SECTORS.length;
  const sector = PROJECTION_SECTORS[sectorIndex];
  const regionalRank = Math.floor(bundleIndex / PROJECTION_SECTORS.length);
  const seed = sampleSeed(
    random,
    sector.minimum,
    sector.maximum,
    0.012,
    0.17,
    cerebrumField,
  );
  const hub = {
    x: clamp(
      seed.x * 0.38 + lerp(-0.22, 0.22, random()),
      -0.72,
      0.86,
    ),
    y: lerp(0.08, 0.44, random()),
    z: lerp(-0.28, 0.36, random()),
  };
  const chord = subtract(hub, seed);
  const chordNormal = normalize({ x: -chord.y, y: chord.x, z: 0 });
  const regionalDirection = sectorIndex < 2 ? -1 : 1;
  const bendDirection =
    regionalRank % 6 === 0 ? -regionalDirection : regionalDirection;
  const broadBend = lerp(0.1, 0.23, random()) * bendDirection;
  const bendExponent = lerp(0.78, 1.28, random());
  const localAmplitude = lerp(0.018, 0.045, random());
  const secondaryAmplitude = lerp(0.008, 0.02, random());
  const localCycles = lerp(1.15, 1.75, random());
  const secondaryCycles = lerp(2.3, 3.4, random());
  const depthJitter = lerp(0.035, 0.075, random());
  const phase = random() * TAU;
  const controlAt = (
    position: number,
  ) => {
    const envelope = Math.sin(Math.PI * position);
    const bendEnvelope = Math.sin(
      Math.PI * position ** bendExponent,
    );
    const localWave =
      Math.sin(position * TAU * localCycles + phase) *
      localAmplitude *
      envelope;
    const secondaryWave =
      Math.sin(position * TAU * secondaryCycles + phase * 1.37) *
      secondaryAmplitude *
      envelope;
    const lateralOffset =
      broadBend * bendEnvelope + localWave + secondaryWave;
    return {
      x:
        lerp(seed.x, hub.x, position) +
        chordNormal.x * lateralOffset,
      y:
        lerp(seed.y, hub.y, position) +
        chordNormal.y * lateralOffset +
        Math.sin(position * Math.PI * 1.7 + phase * 0.6) * 0.018 *
          envelope,
      z:
        lerp(seed.z, hub.z, position) +
        Math.sin(position * Math.PI + phase) *
          depthJitter *
          envelope +
        Math.sin(position * TAU * 2.2 + phase * 0.73) *
          0.012 *
          envelope,
    };
  };
  const controls = Array.from({ length: 19 }, (_, index) =>
    controlAt(index / 18),
  );
  const smoothed = smoothTrajectory(
    smoothTrajectory(controls),
  );
  return resampleTrajectory(smoothed, 0.035, 22, 66);
};

const CENTRAL_TRACT_GUIDES: readonly (readonly Vector3[])[] = [
  [
    { x: -1.38, y: 0.12, z: 0 },
    { x: -1, y: 0.32, z: 0 },
    { x: -0.52, y: 0.5, z: 0 },
    { x: 0, y: 0.54, z: 0 },
    { x: 0.55, y: 0.43, z: 0 },
    { x: 1.1, y: 0.27, z: 0 },
    { x: 1.5, y: 0.1, z: 0 },
  ],
  [
    { x: -1.22, y: -0.24, z: 0 },
    { x: -0.82, y: -0.08, z: 0 },
    { x: -0.28, y: 0.12, z: 0 },
    { x: 0.25, y: 0.16, z: 0 },
    { x: 0.76, y: 0.05, z: 0 },
    { x: 1.18, y: -0.16, z: 0 },
  ],
] as const;

const CENTRAL_TRACT_BUNDLE_COUNT = 48;
const CENTRAL_TRACT_VERTICAL_OFFSET = -0.075;

const createCentralTractTrajectory = (
  bundleIndex: number,
  random: () => number,
) => {
  const guide = CENTRAL_TRACT_GUIDES[bundleIndex % CENTRAL_TRACT_GUIDES.length];
  const guideRank = Math.floor(bundleIndex / CENTRAL_TRACT_GUIDES.length);
  const guideBundleCount = Math.ceil(
    CENTRAL_TRACT_BUNDLE_COUNT / CENTRAL_TRACT_GUIDES.length,
  );
  const lanePosition =
    guideRank / Math.max(1, guideBundleCount - 1) - 0.5;
  const laneOffset = lanePosition * 0.11 + lerp(-0.011, 0.011, random());
  const depth = lerp(0.06, 0.54, random());
  const phase = random() * TAU;
  const bundleArch = lerp(-0.038, 0.052, random());
  const bundleSkew = lerp(-0.045, 0.045, random());
  const localAmplitude = lerp(0.012, 0.026, random());
  const controls = guide.map((point, index) => {
    const position = index / Math.max(1, guide.length - 1);
    const envelope = Math.sin(Math.PI * position);
    return {
      x:
        point.x +
        Math.sin(position * TAU + phase) * 0.024 * envelope,
      y:
        point.y +
        CENTRAL_TRACT_VERTICAL_OFFSET +
        laneOffset +
        bundleArch * envelope +
        bundleSkew * (position - 0.5) +
        Math.sin(position * Math.PI * 1.7 + phase) *
          localAmplitude *
          envelope,
      z: depth + Math.cos(position * Math.PI + phase) * 0.055 * envelope,
    };
  });
  return resampleTrajectory(
    smoothTrajectory(smoothTrajectory(controls)),
    0.04,
    24,
    72,
  );
};

const centralTractCorridorVisibility = (point: Vector3) => {
  const depthInfluence = smoothstep(-0.18, 0.42, point.z) * 0.82;
  if (depthInfluence <= 0) return 1;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const guide of CENTRAL_TRACT_GUIDES) {
    for (let index = 1; index < guide.length; index += 1) {
      nearestDistance = Math.min(
        nearestDistance,
        planarDistanceToSegment(point, guide[index - 1], guide[index]),
      );
    }
  }
  const corridorVisibility = lerp(
    0.24,
    1,
    smoothstep(0.035, 0.13, nearestDistance),
  );
  return lerp(1, corridorVisibility, depthInfluence);
};

const reversePoints = (points: Float32Array) => {
  const count = points.length / 3;
  const reversed = new Float32Array(points.length);
  for (let index = 0; index < count; index += 1) {
    const source = (count - index - 1) * 3;
    const target = index * 3;
    reversed[target] = points[source];
    reversed[target + 1] = points[source + 1];
    reversed[target + 2] = points[source + 2];
  }
  return reversed;
};

const trimPosteriorEnd = (
  source: Float32Array,
  cutoff: number,
) => {
  let points = source;
  if (points[0] > points[points.length - 3]) {
    points = reversePoints(points);
  }
  const pointCount = points.length / 3;
  let finalIndex = pointCount - 1;
  while (finalIndex > 3 && points[finalIndex * 3] > cutoff) {
    finalIndex -= 1;
  }
  if (finalIndex === pointCount - 1) return points;
  const retainedCount = Math.min(pointCount, finalIndex + 2);
  const trimmed = new Float32Array(retainedCount * 3);
  trimmed.set(points.subarray(0, retainedCount * 3));
  return trimmed;
};

const constrainToLobe = (point: Vector3, lobe: Lobe, inset = 0.94) => {
  const normalized = {
    x: (point.x - lobe.center.x) / lobe.radius.x,
    y: (point.y - lobe.center.y) / lobe.radius.y,
    z: (point.z - lobe.center.z) / lobe.radius.z,
  };
  const radius = vectorLength(normalized);
  if (radius <= inset) return point;
  const scale = inset / Math.max(radius, 0.0001);
  return {
    x: lobe.center.x + normalized.x * scale * lobe.radius.x,
    y: lobe.center.y + normalized.y * scale * lobe.radius.y,
    z: lobe.center.z + normalized.z * scale * lobe.radius.z,
  };
};

const appendEscapeTail = (
  source: Float32Array,
  random: () => number,
  phase: number,
) => {
  let points = source;
  const firstX = points[0];
  const lastX = points[points.length - 3];
  if (firstX > lastX) points = reversePoints(points);
  const last = points.length - 3;
  const exit = {
    x: points[last],
    y: points[last + 1],
    z: points[last + 2],
  };
  const tangentStart = Math.max(0, last - 9);
  const immediateTangent = normalize({
    x: exit.x - points[last - 3],
    y: exit.y - points[last - 2],
    z: exit.z - points[last - 1],
  });
  const averagedTangent = normalize({
    x: exit.x - points[tangentStart],
    y: exit.y - points[tangentStart + 1],
    z: exit.z - points[tangentStart + 2],
  });
  const incomingTangent = normalize(
    add(
      multiply(immediateTangent, 0.75),
      multiply(averagedTangent, 0.25),
    ),
  );
  const outboundTangent = normalize({
    x: Math.max(0.68, incomingTangent.x),
    y: incomingTangent.y * 0.28,
    z: incomingTangent.z * 0.55,
  });
  const curveKey = random();
  const lengthKey = random();
  const desiredLength = lerp(0.34, 0.9, lengthKey ** 1.55);
  const endDirection = normalize({
    x: Math.max(0.72, outboundTangent.x * 0.82 + 0.32),
    y:
      outboundTangent.y * 0.35 +
      (curveKey - 0.5) * 0.14 +
      Math.sin(phase + 0.8) * 0.035,
    z:
      outboundTangent.z * 0.54 +
      Math.cos(phase + curveKey * TAU) * 0.08,
  });
  const variedMaximumX = 2.82 + curveKey * 0.16;
  const minimumEndX =
    2.15 + lerp(0.14, 0.65, lengthKey ** 1.4);
  const requestedEndX = exit.x + endDirection.x * desiredLength;
  const endX = Math.min(
    variedMaximumX,
    Math.max(minimumEndX, requestedEndX),
  );
  const tailLength =
    (endX - exit.x) / Math.max(0.3, endDirection.x);
  const posteriorBandY =
    clamp(exit.y, -0.12, 0.72) + Math.sin(phase + curveKey * TAU) * 0.035;
  const posteriorBandZ = clamp(exit.z, -0.35, 0.35);
  const end = {
    x: endX,
    y:
      posteriorBandY +
      clamp(endDirection.y * tailLength, -0.14, 0.14),
    z:
      posteriorBandZ +
      clamp(endDirection.z * tailLength, -0.12, 0.12),
  };
  const lateralNormal = normalize({
    x: -endDirection.y,
    y: endDirection.x,
    z: 0,
  });
  const curveDirection = curveKey < 0.5 ? -1 : 1;
  const lateralOffset =
    tailLength * lerp(0.06, 0.13, Math.abs(curveKey - 0.5) * 2);
  const curve = [
    exit,
    add(exit, multiply(outboundTangent, tailLength * 0.3)),
    add(
      subtract(end, multiply(endDirection, tailLength * 0.28)),
      multiply(lateralNormal, lateralOffset * curveDirection),
    ),
    end,
  ];
  const tailSamples = 32;
  const combined = new Float32Array(points.length + tailSamples * 3);
  combined.set(points);
  for (let index = 1; index <= tailSamples; index += 1) {
    const position = index / tailSamples;
    const inverse = 1 - position;
    const point = {
      x:
        inverse ** 3 * curve[0].x +
        3 * inverse ** 2 * position * curve[1].x +
        3 * inverse * position ** 2 * curve[2].x +
        position ** 3 * curve[3].x,
      y:
        inverse ** 3 * curve[0].y +
        3 * inverse ** 2 * position * curve[1].y +
        3 * inverse * position ** 2 * curve[2].y +
        position ** 3 * curve[3].y,
      z:
        inverse ** 3 * curve[0].z +
        3 * inverse ** 2 * position * curve[1].z +
        3 * inverse * position ** 2 * curve[2].z +
        position ** 3 * curve[3].z,
    };
    const waveEnvelope = Math.sin(Math.PI * position);
    const waveOffset =
      Math.sin(position * TAU + phase + curveKey * TAU) *
      tailLength *
      0.055 *
      waveEnvelope;
    point.x += lateralNormal.x * waveOffset;
    point.y += lateralNormal.y * waveOffset;
    point.z +=
      Math.sin(position * Math.PI + phase * 0.7) *
      tailLength *
      0.018 *
      waveEnvelope;
    const offset = points.length + (index - 1) * 3;
    combined[offset] = point.x;
    combined[offset + 1] = point.y;
    combined[offset + 2] = point.z;
  }
  return {
    points: combined,
    escapeStart: points.length / 3 - 1,
  };
};

const createFiber = (
  points: Float32Array,
  region: FiberRegion,
  family: FiberFamily,
  bundleId: number,
  strandCount: number,
  strandSpread: number,
  field?: (point: Vector3) => FieldSample,
  escapeStart = -1,
): Fiber => {
  const pointCount = points.length / 3;
  const pointFade = new Float32Array(pointCount);
  const boundaryScale = new Float32Array(pointCount);
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
    const position = pointIndex / Math.max(1, pointCount - 1);
    const offset = pointIndex * 3;
    boundaryScale[pointIndex] =
      field && (escapeStart < 0 || pointIndex <= escapeStart)
        ? smoothstep(
            0.005,
            0.095,
            field({
              x: points[offset],
              y: points[offset + 1],
              z: points[offset + 2],
            }).value,
          )
        : 1;
    if (region === "stem") {
      pointFade[pointIndex] = lerp(
        1,
        0.18,
        smoothstep(0.88, 1, position),
      );
      continue;
    }
    let fade =
      smoothstep(0, 0.08, position) *
      (1 - smoothstep(0.92, 1, position));
    if (
      region === "cerebrum" &&
      family !== "cortical-fold" &&
      family !== "projection-tract" &&
      family !== "central-tract"
    ) {
      fade *= sulcalChannelVisibility({
        x: points[offset],
        y: points[offset + 1],
        z: points[offset + 2],
      });
    }
    if (
      region === "cerebrum" &&
      family !== "projection-tract" &&
      family !== "central-tract"
    ) {
      fade *= centralTractCorridorVisibility({
        x: points[offset],
        y: points[offset + 1],
        z: points[offset + 2],
      });
    }
    if (region === "cerebrum" && family === "cortical-fold") {
      fade *= 0.72;
    }
    if (region === "cerebrum") {
      fade *= cerebellarSeparationVisibility({
        x: points[offset],
        y: points[offset + 1],
        z: points[offset + 2],
      });
    }
    if (
      region === "cerebellum" &&
      family !== "cerebellar-ridge" &&
      family !== "cerebellar-shell"
    ) {
      const normalizedCerebellarY =
        (points[offset + 1] - CEREBELLUM.center.y) /
        CEREBELLUM.radius.y;
      fade *= 1 - smoothstep(0.56, 0.82, normalizedCerebellarY);
    }
    if (escapeStart >= 0 && pointIndex >= escapeStart) {
      const escapePosition =
        (pointIndex - escapeStart) /
        Math.max(1, pointCount - 1 - escapeStart);
      fade *= 1 - smoothstep(0, 1, escapePosition);
    }
    pointFade[pointIndex] = fade;
  }
  return {
    points,
    projected: new Float32Array(points.length),
    pointFade,
    region,
    family,
    active: false,
    particle: false,
    hot: false,
    activityKey: 0,
    opacityBand: 0,
    phase: 0,
    speed: 0,
    qualityRank: 0,
    bundleId,
    strandCount,
    strandSpread,
    boundaryScale,
    bundleTier: "dim",
    escapeStart,
    corticalLandmark: false,
    visible: true,
  };
};

const createBundleFactory = (): BundleFactory => {
  let nextBundleId = 0;
  return (
    trunk,
    region,
    family,
    spread,
    field,
    escapeTail,
  ) => {
    const bundleId = nextBundleId;
    nextBundleId += 1;
    const strandCount =
      family === "cortical-microfold" || family === "posterior-depth"
        ? 1
        : family === "cerebellar-bridge"
          ? 1
          : family === "cerebellar-ridge" ||
              family === "cerebellar-folia"
            ? 3
            : family === "central-tract" || family === "projection-tract"
              ? 2
              : family === "cortical-fold"
                ? 1
                : region === "cerebrum"
                  ? CEREBRUM_STRAND_CYCLE[
                      bundleId % CEREBRUM_STRAND_CYCLE.length
                    ]
                  : LOWER_STRAND_CYCLE[
                      bundleId % LOWER_STRAND_CYCLE.length
                    ];
    let points = trunk;
    let escapeStart = -1;
    if (escapeTail) {
      const extended = appendEscapeTail(
        points,
        escapeTail.random,
        escapeTail.phase,
      );
      points = extended.points;
      escapeStart = extended.escapeStart;
    }
    return [
      createFiber(
        points,
        region,
        family,
        bundleId,
        strandCount,
        spread * (region === "cerebrum" ? 0.54 : 0.72),
        field,
        escapeStart,
      ),
    ];
  };
};

const createCerebrumFibers = async (createBundle: BundleFactory) => {
  const fibers: Fiber[] = [];
  let generatedBundles = 0;
  for (const guide of SULCAL_GUIDE_GEOMETRY) {
    const random = seededRandom(guide.seed ^ FAMILY_SEEDS.corticalFold);
    const landmarkIndex = guide.seed % 2;
    for (let index = 0; index < guide.bundleCount; index += 1) {
      const bundle = createBundle(
        createCorticalFoldTrajectory(guide, index, random),
        "cerebrum",
        "cortical-fold",
        0.0085,
        cerebrumField,
      );
      if (
        CORTICAL_LANDMARK_GUIDES.has(guide.name) &&
        index === landmarkIndex
      ) {
        bundle.forEach((fiber) => {
          fiber.corticalLandmark = true;
        });
      }
      fibers.push(...bundle);
      generatedBundles += 1;
      if (generatedBundles % GEOMETRY_BATCH_SIZE === 0) {
        await yieldToBrowser();
      }
    }
  }
  for (const guide of SULCAL_GUIDE_GEOMETRY) {
    const random = seededRandom(
      guide.seed ^ FAMILY_SEEDS.corticalMicrofold,
    );
    const bundleCount =
      guide.name === "central-sulcus" || guide.name === "lateral-fissure"
        ? 30
        : guide.kind === "major"
          ? 24
          : 16;
    for (let index = 0; index < bundleCount; index += 1) {
      fibers.push(
        ...createBundle(
          createCorticalMicrofoldTrajectory(
            guide,
            index,
            bundleCount,
            random,
          ),
          "cerebrum",
          "cortical-microfold",
          0,
          cerebrumField,
        ),
      );
      generatedBundles += 1;
      if (generatedBundles % GEOMETRY_BATCH_SIZE === 0) {
        await yieldToBrowser();
      }
    }
  }
  const projectionRandom = seededRandom(FAMILY_SEEDS.projectionTract);
  for (let index = 0; index < 120; index += 1) {
    fibers.push(
      ...createBundle(
        createProjectionTractTrajectory(index, projectionRandom),
        "cerebrum",
        "projection-tract",
        0.0052,
        cerebrumField,
      ),
    );
    generatedBundles += 1;
    if (generatedBundles % GEOMETRY_BATCH_SIZE === 0) {
      await yieldToBrowser();
    }
  }
  const centralRandom = seededRandom(FAMILY_SEEDS.centralTract);
  for (let index = 0; index < CENTRAL_TRACT_BUNDLE_COUNT; index += 1) {
    fibers.push(
      ...createBundle(
        createCentralTractTrajectory(index, centralRandom),
        "cerebrum",
        "central-tract",
        0.0046,
        cerebrumField,
      ),
    );
    generatedBundles += 1;
    if (generatedBundles % GEOMETRY_BATCH_SIZE === 0) {
      await yieldToBrowser();
    }
  }
  for (const config of CEREBRUM_FAMILIES) {
    const random = seededRandom(config.seed);
    for (let index = 0; index < config.bundleCount; index += 1) {
      let phase = 0;
      let trajectory: Vector3[] = [];
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const seed = sampleSeed(
          random,
          config.minimum,
          config.maximum,
          config.fieldMinimum,
          config.fieldMaximum,
          cerebrumField,
        );
        phase = random() * TAU;
        const lengthBudget = lerp(
          config.lengthMinimum,
          config.lengthMaximum,
          random() ** config.lengthExponent,
        );
        trajectory = traceCerebrumFiber(
          seed,
          config.family,
          phase,
          lengthBudget,
        );
        if (trajectoryArcLength(trajectory) >= minimumArcLength(config.family)) {
          break;
        }
      }
      trajectory = warpTrajectoryAroundSulci(
        trajectory,
        config.family,
      );
      if (config.family === "local-cortical") {
        trajectory = curveLocalCorticalTrajectory(trajectory, phase);
      } else {
        trajectory = curveRegionalTrajectory(
          trajectory,
          phase,
          config.family,
        );
      }
      let points: Float32Array = resampleTrajectory(
        smoothTrajectory(smoothTrajectory(trajectory)),
        0.055,
        14,
        56,
      );
      const escaping = config.family === "posterior-fan" && index < 36;
      if (config.family === "posterior-fan") {
        points = trimPosteriorEnd(
          points,
          escaping
            ? lerp(1.9, 2.08, random())
            : lerp(1.94, 2.2, random()),
        );
      }
      const escapeRandom =
        escaping && index >= 4
          ? seededRandom(
              mixRenderKey(
                config.seed ^ Math.imul(index + 1, 0x9e3779b1),
              ),
            )
          : random;
      fibers.push(
        ...createBundle(
          points,
          "cerebrum",
          config.family,
          config.bundleSpread,
          cerebrumField,
          escaping ? { random: escapeRandom, phase } : undefined,
        ),
      );
      generatedBundles += 1;
      if (generatedBundles % GEOMETRY_BATCH_SIZE === 0) {
        await yieldToBrowser();
      }
    }
  }
  return fibers;
};

const createCerebellumFibers = async (createBundle: BundleFactory) => {
  const fibers: Fiber[] = [];
  const random = seededRandom(FAMILY_SEEDS.cerebellar);
  let generatedBundles = 0;
  const foliaDepths = [-0.26, 0, 0.26] as const;
  const foliaBandCount = 62;
  for (let band = 0; band < foliaBandCount; band += 1) {
    // Build the cerebellum from layered folia with a few compact lobular
    // turns, keeping the arcs coherent without becoming horizontal scan lines.
    const bandPhase = band * 0.175 + random() * 0.045;
    const normalizedY =
      lerp(-0.72, 0.72, (band + 0.5) / foliaBandCount) +
      lerp(-0.018, 0.018, random());
    const verticalSection = Math.sqrt(
      Math.max(0.06, 1 - (normalizedY / 0.8) ** 2),
    );
    const lobuleIndex = band % 5;
    const localBundle = lobuleIndex === 0;
    const lobulePosition = [-0.34, -0.15, 0.08, 0.3, 0][lobuleIndex] ?? 0;
    const horizontalCenter = localBundle
      ? lobulePosition + lerp(-0.055, 0.055, random())
      : lerp(-0.035, 0.035, random());
    const baseHalfExtent =
      verticalSection *
      lerp(localBundle ? 0.34 : 0.64, localBundle ? 0.56 : 0.84, random());
    const archDirection = normalizedY < 0 ? -1 : 1;
    const centralArchScale = lerp(
      0.82,
      1,
      smoothstep(0.04, 0.5, Math.abs(normalizedY)),
    );
    const bandArchAmplitude =
      lerp(localBundle ? 0.21 : 0.18, localBundle ? 0.33 : 0.29, random()) *
      lerp(0.78, 1, verticalSection) *
      centralArchScale *
      archDirection;
    const bandArchExponent = lerp(0.9, 1.12, random());
    const bandFlowTilt = lerp(-0.07, 0.07, random());
    const bandBroadAmplitude = lerp(0.04, 0.072, random());
    const bandLocalAmplitude = lerp(0.009, 0.018, random());
    const bandLocalCycles = lerp(1.3, 1.95, random());
    const bandLateralAmplitude = lerp(0.02, 0.05, random());
    const centralCurlGain = lerp(
      1.14,
      1,
      smoothstep(0.04, 0.42, Math.abs(normalizedY)),
    );
    const bandCurlAmplitude =
      lerp(0.022, 0.045, random()) * centralCurlGain;
    const bandCounterCurlAmplitude = lerp(0.009, 0.019, random());
    const bandRotation = localBundle
      ? Math.sin(bandPhase * 1.37) * 0.075 +
        lobulePosition * 0.09 +
        lerp(-0.026, 0.026, random())
      : Math.sin(bandPhase * 1.37) * 0.022 +
        lobulePosition * 0.02 +
        lerp(-0.01, 0.01, random());
    const bandRotationCosine = Math.cos(bandRotation);
    const bandRotationSine = Math.sin(bandRotation);
    for (let lane = 0; lane < foliaDepths.length; lane += 1) {
      const normalizedZ =
        foliaDepths[(lane + band) % foliaDepths.length] +
        lerp(-0.014, 0.014, random());
      const depthSection = Math.sqrt(
        Math.max(0.16, 1 - (normalizedZ / 0.64) ** 2),
      );
      const halfExtent = baseHalfExtent * depthSection * lerp(0.96, 1.04, random());
      const startX =
        horizontalCenter - halfExtent * lerp(0.88, 1, random());
      const endX =
        horizontalCenter + halfExtent * lerp(0.88, 1, random());
      const phase = bandPhase + lane * 0.04 + lerp(-0.018, 0.018, random());
      const laneVariation = lerp(0.94, 1.06, random());
      const controls: Vector3[] = [];
      for (let step = 0; step <= 28; step += 1) {
        const position = step / 28;
        const envelope = Math.sin(Math.PI * position);
        const archEnvelope = Math.sin(
          Math.PI * position ** bandArchExponent,
        );
        const unrotatedX =
          lerp(startX, endX, position) +
          Math.sin(TAU * lerp(0.78, 1.15, verticalSection) * position + phase) *
            bandLateralAmplitude *
            laneVariation *
            envelope +
          Math.sin(TAU * 1.9 * position + phase * 0.72) *
            0.006 *
            envelope;
        const lobularCurl =
          Math.sin(
            Math.PI * lerp(0.78, 1.18, verticalSection) * position +
              phase * 0.82,
          ) *
          bandCurlAmplitude *
          envelope;
        const counterCurl =
          Math.sin(
            TAU * lerp(0.72, 1.08, verticalSection) * position -
              phase * 0.61,
          ) *
          bandCounterCurlAmplitude *
          envelope ** 1.25;
        const unrotatedY =
          normalizedY +
          bandFlowTilt * (position - 0.5) +
          bandArchAmplitude * laneVariation * archEnvelope ** 1.08 +
          Math.sin(TAU * lerp(0.68, 0.98, verticalSection) * position + phase) *
            bandBroadAmplitude *
            laneVariation *
            envelope +
          Math.sin(TAU * bandLocalCycles * position + phase * 1.31) *
            bandLocalAmplitude *
            envelope +
          lobularCurl +
          counterCurl;
        const centeredX = unrotatedX - horizontalCenter;
        const centeredY = unrotatedY - normalizedY;
        const localX =
          horizontalCenter +
          centeredX * bandRotationCosine -
          centeredY * bandRotationSine;
        const localY =
          normalizedY +
          centeredX * bandRotationSine +
          centeredY * bandRotationCosine;
        const localZ =
          normalizedZ * verticalSection +
          Math.sin(Math.PI * position + phase) * 0.018 * depthSection +
          Math.sin(TAU * 1.4 * position + phase * 0.69) *
            0.008 *
            envelope;
        controls.push(
          constrainToLobe(
            {
              x: CEREBELLUM.center.x + localX * CEREBELLUM.radius.x,
              y: CEREBELLUM.center.y + localY * CEREBELLUM.radius.y,
              z: CEREBELLUM.center.z + localZ * CEREBELLUM.radius.z,
            },
            CEREBELLUM,
            0.95,
          ),
        );
      }
      fibers.push(
        ...createBundle(
          resampleTrajectory(
            smoothTrajectory(controls),
            0.012,
            28,
            68,
          ),
          "cerebellum",
          "cerebellar-folia",
          0.007,
          cerebellumField,
        ),
      );
      generatedBundles += 1;
      if (generatedBundles % GEOMETRY_BATCH_SIZE === 0) {
        await yieldToBrowser();
      }
    }
  }

  const transverseFoliaCount = 6;
  for (let index = 0; index < transverseFoliaCount; index += 1) {
    const bandPosition = (index + 0.5) / transverseFoliaCount;
    const normalizedY =
      lerp(-0.46, 0.46, bandPosition) +
      lerp(-0.014, 0.014, random());
    const normalizedZ =
      [-0.24, 0.04, 0.27][index % 3] +
      lerp(-0.018, 0.018, random());
    const depthSection = Math.sqrt(
      Math.max(0.2, 1 - (normalizedZ / 0.64) ** 2),
    );
    const verticalSection = Math.sqrt(
      Math.max(0.18, 1 - (normalizedY / 0.78) ** 2),
    );
    const lobuleCenter = [-0.18, -0.02, 0.17][index % 3] ?? 0;
    const halfExtent =
      verticalSection * depthSection * lerp(0.32, 0.54, random());
    const phase = random() * TAU;
    const broadAmplitude = lerp(0.045, 0.09, random());
    const localAmplitude = lerp(0.012, 0.026, random());
    const flowTilt = lerp(-0.075, 0.075, random());
    const pathRotation = lerp(-0.075, 0.075, random());
    const pathRotationCosine = Math.cos(pathRotation);
    const pathRotationSine = Math.sin(pathRotation);
    const controls: Vector3[] = [];
    for (let step = 0; step <= 28; step += 1) {
      const position = step / 28;
      const envelope = Math.sin(Math.PI * position);
      const unrotatedX =
        lerp(-halfExtent, halfExtent, position) +
        Math.sin(TAU * 1.15 * position + phase) * 0.02 * envelope +
        Math.sin(TAU * 2.3 * position - phase * 0.48) *
          0.006 *
          envelope;
      const unrotatedY =
        flowTilt * (position - 0.5) +
        Math.sin(Math.PI * position + phase) *
          broadAmplitude *
          envelope +
        Math.sin(TAU * 1.7 * position + phase * 0.68) *
          localAmplitude *
          envelope +
        Math.sin(TAU * 0.72 * position - phase * 0.44) *
          0.015 *
          envelope ** 1.2;
      const localX =
        lobuleCenter +
        unrotatedX * pathRotationCosine -
        unrotatedY * pathRotationSine;
      const localY =
        normalizedY +
        unrotatedX * pathRotationSine +
        unrotatedY * pathRotationCosine;
      const localZ =
        normalizedZ +
        Math.sin(Math.PI * position + phase * 0.54) *
          0.022 *
          envelope;
      controls.push(
        constrainToLobe(
          {
            x: CEREBELLUM.center.x + localX * CEREBELLUM.radius.x,
            y: CEREBELLUM.center.y + localY * CEREBELLUM.radius.y,
            z: CEREBELLUM.center.z + localZ * CEREBELLUM.radius.z,
          },
          CEREBELLUM,
          0.95,
        ),
      );
    }
    fibers.push(
      ...createBundle(
        resampleTrajectory(
          smoothTrajectory(controls),
          0.012,
          28,
          68,
        ),
        "cerebellum",
        "cerebellar-folia",
        0.006,
        cerebellumField,
      ),
    );
    generatedBundles += 1;
    if (generatedBundles % GEOMETRY_BATCH_SIZE === 0) {
      await yieldToBrowser();
    }
  }

  const upperRidgeCount = 7;
  for (let index = 0; index < upperRidgeCount; index += 1) {
    const depthPosition = (index + 0.5) / upperRidgeCount;
    const normalizedZ =
      lerp(-0.3, 0.3, depthPosition) +
      lerp(-0.012, 0.012, random());
    const depthSection = Math.sqrt(
      Math.max(0.2, 1 - normalizedZ ** 2),
    );
    const horizontalExtent = depthSection * lerp(0.76, 0.86, random());
    const edgeHeight = lerp(0.08, 0.14, random());
    const archHeight = lerp(0.28, 0.42, random()) * depthSection;
    const phase = random() * TAU;
    const controls: Vector3[] = [];
    for (let step = 0; step <= 24; step += 1) {
      const position = step / 24;
      const envelope = Math.sin(Math.PI * position);
      const localX =
        lerp(-horizontalExtent, horizontalExtent, position) +
        Math.sin(TAU * position + phase) * 0.024 * envelope;
      const localY =
        edgeHeight +
        archHeight * envelope +
        Math.sin(TAU * 1.7 * position + phase) * 0.045 * envelope;
      const localZ =
        normalizedZ +
        Math.sin(Math.PI * position + phase) * 0.018 * envelope;
      controls.push(
        constrainToLobe(
          {
            x: CEREBELLUM.center.x + localX * CEREBELLUM.radius.x,
            y: CEREBELLUM.center.y + localY * CEREBELLUM.radius.y,
            z: CEREBELLUM.center.z + localZ * CEREBELLUM.radius.z,
          },
          CEREBELLUM,
          0.94,
        ),
      );
    }
    fibers.push(
      ...createBundle(
        resampleTrajectory(
          smoothTrajectory(smoothTrajectory(controls)),
          0.012,
          32,
          72,
        ),
        "cerebellum",
        "cerebellar-ridge",
        0.009,
        cerebellumField,
      ),
    );
  }

  const contourPairCount = 8;
  const contourArcCount = contourPairCount * 2;
  for (let index = 0; index < contourArcCount; index += 1) {
    const pairIndex = Math.floor(index / 2);
    const depthPosition =
      ((pairIndex * 7) % contourPairCount + 0.5) /
      contourPairCount;
    const contourSign = index % 2 === 0 ? -1 : 1;
    const normalizedZ =
      lerp(-0.36, 0.36, depthPosition) +
      lerp(-0.012, 0.012, random());
    const depthSection = Math.sqrt(
      Math.max(0.16, 1 - normalizedZ ** 2),
    );
    const radialPosition = (pairIndex + 0.5) / contourPairCount;
    const shellScale =
      depthSection *
      lerp(0.46, 0.98, Math.sqrt(radialPosition)) *
      lerp(0.97, 1.03, random());
    const horizontalRadius = shellScale * lerp(0.94, 1, random());
    const verticalRadius = shellScale * lerp(0.78, 0.9, random());
    const centerY = lerp(-0.025, 0.025, random());
    const phase = random() * TAU;
    const broadRipple = lerp(0.01, 0.022, random());
    const localRipple = lerp(0.003, 0.009, random());
    const controls: Vector3[] = [];
    for (let step = 0; step <= 28; step += 1) {
      const position = step / 28;
      const localX = lerp(-horizontalRadius, horizontalRadius, position);
      const normalizedX = localX / Math.max(0.001, horizontalRadius);
      const boundaryHeight =
        Math.sqrt(Math.max(0, 1 - normalizedX ** 2)) * verticalRadius;
      const radialVariation =
        1 +
        Math.sin(position * TAU * 1.35 + phase) * broadRipple +
        Math.sin(position * TAU * 3.1 + phase * 1.31) * localRipple;
      const localY =
        centerY +
        contourSign * boundaryHeight * radialVariation +
        Math.sin(position * TAU * 1.8 + phase * 0.82) * 0.012;
      const localZ =
        normalizedZ +
        Math.sin(Math.PI * position + phase) * 0.012 +
        Math.sin(position * TAU * 1.7 + phase * 0.73) * 0.006;
      controls.push(
        constrainToLobe(
          {
            x: CEREBELLUM.center.x + localX * CEREBELLUM.radius.x,
            y: CEREBELLUM.center.y + localY * CEREBELLUM.radius.y,
            z: CEREBELLUM.center.z + localZ * CEREBELLUM.radius.z,
          },
          CEREBELLUM,
          0.94,
        ),
      );
    }
    fibers.push(
      ...createBundle(
        resampleTrajectory(
          smoothTrajectory(smoothTrajectory(controls)),
          0.012,
          30,
          72,
        ),
        "cerebellum",
        "cerebellar-shell",
        0.0038,
        cerebellumField,
      ),
    );
  }
  await yieldToBrowser();
  return fibers;
};

const createStemFibers = async (createBundle: BundleFactory) => {
  const fibers: Fiber[] = [];
  const random = seededRandom(FAMILY_SEEDS.stem);
  const stemLaneCount = 28;
  for (let lane = 0; lane < stemLaneCount; lane += 1) {
    const lanePosition = (lane + 0.5) / stemLaneCount;
    const normalizedX = clamp(
      lerp(-0.78, 0.78, lanePosition) + lerp(-0.025, 0.025, random()),
      -0.8,
      0.8,
    );
    const depthExtent = Math.sqrt(Math.max(0.08, 1 - normalizedX ** 2));
    const normalizedZ = lerp(-0.72, 0.72, random()) * depthExtent;
    const endProgress = lerp(0.96, 1, random());
    const phase = random() * TAU;
    const lateralSway = lerp(-0.035, 0.035, random());
    const terminalScale = lerp(0.98, 1.02, random());
    const controls: Vector3[] = [];
    for (let step = 0; step <= 14; step += 1) {
      const position = (step / 14) * endProgress;
      const taper = brainstemTaper(position);
      const terminalSeparation = lerp(
        1,
        terminalScale,
        smoothstep(0.6, 1, position),
      );
      const curveEnvelope = Math.sin(Math.PI * position);
      controls.push({
        x:
          brainstemCenterX(position) +
          normalizedX *
            BRAINSTEM.topRadius.x *
            taper *
            terminalSeparation +
          lateralSway * curveEnvelope +
          Math.sin(position * TAU + phase) * 0.008 * curveEnvelope,
        y: lerp(BRAINSTEM.top.y, BRAINSTEM.bottom.y, position),
        z:
          BRAINSTEM.centerZ +
          normalizedZ * BRAINSTEM.topRadius.z * taper +
          Math.sin(position * Math.PI + phase) * 0.018 * curveEnvelope,
      });
    }
    fibers.push(
      ...createBundle(
        resampleTrajectory(
          smoothTrajectory(controls),
          0.028,
          16,
          32,
        ),
        "stem",
        "stem",
        0.0042,
        brainstemField,
      ),
    );
  }

  const junctionFiberCount = 24;
  for (let index = 0; index < junctionFiberCount; index += 1) {
    const lanePosition = (index + 0.5) / junctionFiberCount;
    const normalizedX = lerp(-0.9, 0.9, lanePosition);
    const normalizedZ = lerp(-0.3, 0.3, random());
    const junctionEnd = lerp(0.4, 0.56, random());
    const sourceX =
      BRAINSTEM.top.x +
      lerp(-0.48, 0.48, lanePosition) +
      lerp(-0.025, 0.025, random());
    const sourceY = BRAINSTEM.top.y + lerp(0.2, 0.34, random());
    const sourceZ =
      BRAINSTEM.centerZ + normalizedZ * BRAINSTEM.topRadius.z * 1.08;
    const junctionSway = lerp(-0.025, 0.025, random());
    const controls: Vector3[] = [];
    for (let step = 0; step <= 10; step += 1) {
      const blend = step / 10;
      const position = blend * junctionEnd;
      const taper = brainstemTaper(position);
      const convergence = smoothstep(0, 1, blend);
      const targetX =
        brainstemCenterX(position) +
        normalizedX * BRAINSTEM.topRadius.x * taper;
      const targetY = lerp(BRAINSTEM.top.y, BRAINSTEM.bottom.y, position);
      const targetZ =
        BRAINSTEM.centerZ +
        normalizedZ * BRAINSTEM.topRadius.z * taper;
      controls.push({
        x:
          lerp(sourceX, targetX, convergence) +
          Math.sin(Math.PI * blend) * junctionSway,
        y: lerp(sourceY, targetY, convergence),
        z: lerp(sourceZ, targetZ, convergence),
      });
    }
    fibers.push(
      ...createBundle(
        resampleTrajectory(smoothTrajectory(controls), 0.026, 12, 24),
        "stem",
        "stem",
        0.0042,
      ),
    );
  }

  const cerebellarBridgeCount = 4;
  for (let index = 0; index < cerebellarBridgeCount; index += 1) {
    const lanePosition = index / Math.max(1, cerebellarBridgeCount - 1);
    const phase = index * 0.72;
    const start = {
      x: lerp(0.36, 0.52, lanePosition),
      y: lerp(-0.32, -0.28, lanePosition),
      z: lerp(-0.16, 0.16, lanePosition),
    };
    const end = {
      x:
        CEREBELLUM.center.x -
        CEREBELLUM.radius.x * lerp(0.68, 0.54, lanePosition),
      y:
        CEREBELLUM.center.y +
        CEREBELLUM.radius.y * lerp(0.66, 0.54, lanePosition),
      z: lerp(-0.13, 0.13, lanePosition),
    };
    const controls: Vector3[] = [];
    for (let step = 0; step <= 8; step += 1) {
      const position = step / 8;
      const envelope = Math.sin(Math.PI * position);
      controls.push({
        x:
          lerp(start.x, end.x, position) +
          Math.sin(Math.PI * position + phase) * 0.018 * envelope,
        y:
          lerp(start.y, end.y, position) +
          lerp(0.035, 0.055, lanePosition) * envelope,
        z:
          lerp(start.z, end.z, position) +
          Math.sin(Math.PI * position + phase * 0.6) * 0.018 * envelope,
      });
    }
    fibers.push(
      ...createBundle(
        resampleTrajectory(
          smoothTrajectory(smoothTrajectory(controls)),
          0.018,
          16,
          28,
        ),
        "stem",
        "cerebellar-bridge",
        0.0036,
      ),
    );
  }
  await yieldToBrowser();
  return fibers;
};

const createInteriorDepthFibers = async (createBundle: BundleFactory) => {
  const fibers: Fiber[] = [];
  const config = CEREBRUM_FAMILIES.find(
    ({ family }) => family === "deep",
  );
  if (!config) return fibers;
  const random = seededRandom(FAMILY_SEEDS.interiorDepth);
  const bundleCount = 130;
  for (let index = 0; index < bundleCount; index += 1) {
    let trajectory: Vector3[] = [];
    let phase = 0;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const seed = sampleSeed(
        random,
        config.minimum,
        config.maximum,
        config.fieldMinimum,
        config.fieldMaximum,
        cerebrumField,
      );
      phase = random() * TAU;
      const lengthBudget = lerp(
        config.lengthMinimum,
        config.lengthMaximum,
        random() ** config.lengthExponent,
      );
      trajectory = traceCerebrumFiber(
        seed,
        "deep",
        phase,
        lengthBudget,
      );
      if (
        trajectoryArcLength(trajectory) >= minimumArcLength("deep") &&
        trajectoryPlanarDeviation(trajectory) >= 0.09
      ) {
        break;
      }
    }
    const curvedTrajectory = warpTrajectoryAroundSulci(
      curveRegionalTrajectory(trajectory, phase, "deep"),
      "deep",
    );
    const points = resampleTrajectory(
      smoothTrajectory(smoothTrajectory(curvedTrajectory)),
      0.055,
      14,
      56,
    );
    fibers.push(
      ...createBundle(
        points,
        "cerebrum",
        "interior-depth",
        config.bundleSpread,
        cerebrumField,
      ),
    );
    if ((index + 1) % GEOMETRY_BATCH_SIZE === 0) {
      await yieldToBrowser();
    }
  }
  await yieldToBrowser();
  return fibers;
};

const createPosteriorDepthFibers = async (createBundle: BundleFactory) => {
  const fibers: Fiber[] = [];
  const config = CEREBRUM_FAMILIES.find(
    ({ family }) => family === "posterior-surface",
  );
  if (!config) return fibers;
  const random = seededRandom(FAMILY_SEEDS.posteriorDepth);
  const bundleCount = 300;
  for (let index = 0; index < bundleCount; index += 1) {
    let trajectory: Vector3[] = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const seed = sampleSeed(
        random,
        config.minimum,
        config.maximum,
        config.fieldMinimum,
        config.fieldMaximum,
        cerebrumField,
      );
      const phase = random() * TAU;
      const lengthBudget = lerp(
        config.lengthMinimum,
        config.lengthMaximum,
        random() ** config.lengthExponent,
      );
      trajectory = warpTrajectoryAroundSulci(
        traceCerebrumFiber(
          seed,
          "posterior-surface",
          phase,
          lengthBudget,
        ),
        "posterior-surface",
      );
      if (
        trajectoryArcLength(trajectory) >=
          minimumArcLength("posterior-surface") &&
        trajectoryPlanarDeviation(trajectory) >= 0.075
      ) {
        break;
      }
    }
    fibers.push(
      ...createBundle(
        resampleTrajectory(
          smoothTrajectory(trajectory),
          0.055,
          14,
          56,
        ),
        "cerebrum",
        "posterior-depth",
        config.bundleSpread,
        cerebrumField,
      ),
    );
    if ((index + 1) % GEOMETRY_BATCH_SIZE === 0) {
      await yieldToBrowser();
    }
  }
  await yieldToBrowser();
  return fibers;
};

const styleFibers = (fibers: Fiber[]) => {
  const random = seededRandom(FAMILY_SEEDS.style);
  fibers.forEach((fiber) => {
    const activityKey = random();
    const regionalBoundaryMedium =
      (fiber.family === "cortical-arc" ||
        fiber.family === "crown-longitudinal" ||
        fiber.family === "temporal-longitudinal" ||
        fiber.family === "posterior-fan") &&
      activityKey < 0.4;
    const frontalMedium =
      (fiber.family === "frontal-surface" && activityKey < 0.64) ||
      (fiber.family === "frontal-loop" && activityKey < 0.38);
    const posteriorMedium =
      fiber.family === "posterior-surface" && activityKey < 0.12;
    const descendingMedium =
      (fiber.family === "frontal-diagonal" && activityKey < 0.38) ||
      (fiber.family === "crown-descending" && activityKey < 0.28);
    const boundaryMedium =
      regionalBoundaryMedium ||
      frontalMedium ||
      posteriorMedium ||
      descendingMedium;
    const cerebellarMedium =
      (fiber.family === "cerebellar-folia" && activityKey < 0.11) ||
      (fiber.family === "cerebellar-ridge" && activityKey < 0.3) ||
      (fiber.family === "cerebellar-shell" && activityKey < 0.14);
    fiber.particle = false;
    fiber.hot = false;
    fiber.activityKey = activityKey;
    fiber.bundleTier =
      fiber.corticalLandmark
        ? "medium"
        : fiber.family === "cortical-microfold" ||
            fiber.family === "interior-depth" ||
            fiber.family === "posterior-depth"
          ? "dim"
          : cerebellarMedium ||
              (fiber.family === "cortical-fold" &&
                activityKey < 0.56) ||
              (fiber.family === "central-tract" &&
                activityKey < 0.3) ||
              boundaryMedium ||
              fiber.family === "cerebellar-bridge" ||
              (fiber.region === "stem" && activityKey < 0.46) ||
              (fiber.region === "cerebrum" &&
                fiber.family !== "local-cortical" &&
                activityKey < 0.12)
            ? "medium"
            : "dim";
    fiber.opacityBand = fiber.bundleTier === "medium" ? 1 : 0;
    fiber.active = false;
    fiber.phase = random();
    fiber.speed = 1 / lerp(2500, 6000, random());
    fiber.qualityRank = random();
    if (fiber.escapeStart >= 0) {
      fiber.active = false;
      fiber.opacityBand = 0;
      fiber.bundleTier = "dim";
    }
  });

  const stratifyFamily = (family: FiberFamily) => {
    const ranked = fibers
      .filter((fiber) => fiber.family === family)
      .sort((left, right) => left.qualityRank - right.qualityRank);
    ranked.forEach((fiber, rank) => {
      const qualityRank = (rank + 0.5) / Math.max(1, ranked.length);
      fiber.qualityRank = qualityRank;
    });
  };
  Array.from(new Set(fibers.map((fiber) => fiber.family))).forEach(
    stratifyFamily,
  );
  fibers.forEach((fiber) => {
    if (fiber.corticalLandmark) fiber.qualityRank = 0;
  });

  type FiberProfile = {
    x: number;
    y: number;
    z: number;
    length: number;
  };
  const profiles = new Map<Fiber, FiberProfile>();
  const profileFor = (fiber: Fiber) => {
    const cached = profiles.get(fiber);
    if (cached) return cached;
    let x = 0;
    let y = 0;
    let z = 0;
    let length = 0;
    const pointCount = fiber.points.length / 3;
    for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
      const offset = pointIndex * 3;
      x += fiber.points[offset];
      y += fiber.points[offset + 1];
      z += fiber.points[offset + 2];
      if (pointIndex === 0) continue;
      const previousOffset = offset - 3;
      length += Math.hypot(
        fiber.points[offset] - fiber.points[previousOffset],
        fiber.points[offset + 1] - fiber.points[previousOffset + 1],
        fiber.points[offset + 2] - fiber.points[previousOffset + 2],
      );
    }
    const profile = {
      x: x / Math.max(1, pointCount),
      y: y / Math.max(1, pointCount),
      z: z / Math.max(1, pointCount),
      length,
    };
    profiles.set(fiber, profile);
    return profile;
  };

  const highwaySpecs: Array<{
    family: CerebrumFamily;
    x: number;
    y: number;
  }> = [
    { family: "central-tract", x: -0.28, y: 0.23 },
    { family: "central-tract", x: 0.42, y: -0.14 },
    { family: "cortical-fold", x: -0.05, y: 0.78 },
    { family: "frontal-surface", x: -1.5, y: 0.58 },
    { family: "frontal-diagonal", x: -1.34, y: 0.16 },
    { family: "temporal-longitudinal", x: -0.72, y: -0.52 },
    { family: "temporal-loop", x: 0.18, y: -0.54 },
    { family: "posterior-fan", x: 1.38, y: 0.22 },
    { family: "cortical-fold", x: 1.25, y: 0.5 },
    { family: "cortical-fold", x: -0.5, y: -0.45 },
    { family: "posterior-surface", x: 1.14, y: 0.34 },
    { family: "temporal-longitudinal", x: 0.04, y: -0.48 },
    { family: "projection-tract", x: -0.58, y: 0.7 },
    { family: "projection-tract", x: 0.54, y: 0.66 },
    { family: "projection-tract", x: -0.18, y: 0.56 },
    { family: "projection-tract", x: 0.12, y: 0.82 },
    { family: "temporal-loop", x: -0.12, y: -0.52 },
    { family: "temporal-longitudinal", x: 0.62, y: -0.38 },
    { family: "posterior-fan", x: 1, y: 0.45 },
  ];
  const highwayFibers: Fiber[] = [];
  const highwaySet = new Set<Fiber>();
  const highwaySupportSet = new Set<Fiber>();
  highwaySpecs.forEach((spec) => {
    const selected = fibers
      .filter(
        (fiber) =>
          fiber.region === "cerebrum" &&
          fiber.family === spec.family &&
          fiber.escapeStart < 0 &&
          !fiber.corticalLandmark &&
          !highwaySet.has(fiber),
      )
      .map((fiber) => {
        const profile = profileFor(fiber);
        const distance =
          (profile.x - spec.x) ** 2 * 0.46 +
          (profile.y - spec.y) ** 2;
        const rearPenalty = Math.max(0, -profile.z) * 0.34;
        const lengthReward = 0.34 / Math.max(0.42, profile.length);
        return {
          fiber,
          score: distance + rearPenalty + lengthReward,
        };
      })
      .sort((left, right) => left.score - right.score)[0]?.fiber;
    if (!selected) return;
    highwaySet.add(selected);
    highwayFibers.push(selected);
  });

  highwayFibers.forEach((highway) => {
    const profile = profileFor(highway);
    const supportFibers = fibers
      .filter(
        (fiber) =>
          fiber.region === "cerebrum" &&
          fiber.family === highway.family &&
          fiber !== highway &&
          !highwaySet.has(fiber) &&
          !highwaySupportSet.has(fiber),
      )
      .map((fiber) => {
        const candidate = profileFor(fiber);
        return {
          fiber,
          distance:
            (candidate.x - profile.x) ** 2 +
            (candidate.y - profile.y) ** 2 +
            (candidate.z - profile.z) ** 2 * 0.4,
        };
      })
      .sort((left, right) => left.distance - right.distance)
      .slice(0, 2)
      .map(({ fiber }) => fiber);
    supportFibers.forEach((support) => {
      support.bundleTier = "medium";
      highwaySupportSet.add(support);
    });
  });

  const particleRandom = seededRandom(FAMILY_SEEDS.particles);
  const particleFibers: Fiber[] = [...highwayFibers];
  const selectParticles = (region: FiberRegion, count: number) => {
    const selected = fibers
      .filter(
        (fiber) =>
          fiber.region === region &&
          !fiber.corticalLandmark &&
          fiber.family !== "cortical-microfold" &&
          (region !== "cerebrum" ||
            fiber.family !== "cortical-fold") &&
          fiber.family !== "local-cortical" &&
          fiber.family !== "frontal-loop" &&
          fiber.family !== "cerebellar-bridge" &&
          fiber.family !== "cerebellar-shell" &&
          (region !== "cerebellum" ||
            fiber.family === "cerebellar-folia") &&
          fiber.family !== "interior-depth" &&
          fiber.family !== "posterior-depth" &&
          fiber.escapeStart < 0 &&
          !particleFibers.includes(fiber) &&
          fiber.points.length >= 24,
      )
      .map((fiber) => {
        const profile = profileFor(fiber);
        const stemCenterPenalty =
          region === "stem"
            ? Math.abs(profile.x - BRAINSTEM.top.x) * 0.8 +
              Math.abs(profile.z - BRAINSTEM.centerZ) * 0.7
            : 0;
        return {
          fiber,
          key:
            particleRandom() * 0.22 +
            fiber.qualityRank * 0.24 -
            clamp(profile.z, -0.5, 0.5) * 0.34 +
            stemCenterPenalty,
        };
      })
      .sort((left, right) => left.key - right.key)
      .slice(0, count)
      .map(({ fiber }) => fiber);
    particleFibers.push(...selected);
  };
  selectParticles("cerebellum", 4);
  selectParticles("stem", 2);
  selectParticles("cerebrum", 15);
  let hotFiberCount = 0;
  let hotCorticalFoldCount = 0;
  particleFibers.slice(0, PARTICLE_FIBER_COUNT).forEach((fiber) => {
    const particleOnly = fiber.region === "cerebellum";
    const hotEligible =
      fiber.family !== "cortical-fold" || hotCorticalFoldCount < 2;
    fiber.bundleTier = particleOnly ? "dim" : "active";
    fiber.opacityBand = particleOnly ? 0 : 3;
    fiber.active = !particleOnly;
    fiber.particle = true;
    fiber.hot = hotEligible && hotFiberCount < HOT_PARTICLE_COUNT;
    if (fiber.hot) {
      hotFiberCount += 1;
      if (fiber.family === "cortical-fold") {
        hotCorticalFoldCount += 1;
      }
    }
  });

  fibers.forEach((fiber) => {
    fiber.active = fiber.bundleTier === "active";
    fiber.opacityBand =
      fiber.bundleTier === "active"
        ? 3
        : fiber.bundleTier === "medium"
          ? 1
          : 0;
  });
};

const createFiberField = async () => {
  const createBundle = createBundleFactory();
  const fibers = [
    ...(await createCerebrumFibers(createBundle)),
    ...(await createCerebellumFibers(createBundle)),
    ...(await createStemFibers(createBundle)),
    ...(await createInteriorDepthFibers(createBundle)),
    ...(await createPosteriorDepthFibers(createBundle)),
  ];
  styleFibers(fibers);
  return fibers;
};

const createFiberRenderPlan = (fiber: Fiber): FiberRenderPlan => {
  const strandVisible = new Uint8Array(fiber.strandCount);
  const strandOffset = new Float32Array(fiber.strandCount);
  const strandDrift = new Float32Array(fiber.strandCount);
  const strandBend = new Float32Array(fiber.strandCount);
  const strandBendPhase = new Float32Array(fiber.strandCount);
  const strandStart = new Float32Array(fiber.strandCount);
  const strandEnd = new Float32Array(fiber.strandCount);
  const centerStrand = Math.floor(fiber.strandCount / 2);

  for (let strandIndex = 0; strandIndex < fiber.strandCount; strandIndex += 1) {
    strandVisible[strandIndex] = 1;
    strandOffset[strandIndex] = strandIndex - centerStrand;
    strandStart[strandIndex] = 0;
    strandEnd[strandIndex] = 1;
  }

  if (fiber.region !== "cerebrum") {
    return {
      suppressed: false,
      liveSuppressed: false,
      strandVisible,
      strandOffset,
      strandDrift,
      strandBend,
      strandBendPhase,
      strandStart,
      strandEnd,
    };
  }

  const bundleKey = mixRenderKey(fiber.bundleId ^ 0x52454e44);
  const suppressible = fiber.escapeStart < 0;
  const boundaryFamily =
    fiber.family === "cortical-fold" ||
    fiber.family === "cortical-microfold" ||
    fiber.family === "cortical-arc" ||
    fiber.family === "projection-tract" ||
    fiber.family === "central-tract" ||
    fiber.family === "crown-longitudinal" ||
    fiber.family === "temporal-longitudinal" ||
    fiber.family === "posterior-fan" ||
    fiber.family === "frontal-surface" ||
    fiber.family === "posterior-surface" ||
    fiber.family === "posterior-depth";
  let upperRightPointCount = 0;
  let centralRearPointCount = 0;
  let frontalPointCount = 0;
  let crownPointCount = 0;
  let trajectoryLength = 0;
  for (let offset = 0; offset < fiber.points.length; offset += 3) {
    if (fiber.points[offset] > 0.55 && fiber.points[offset + 1] > 0.5) {
      upperRightPointCount += 1;
    }
    if (fiber.points[offset] > -0.15 && fiber.points[offset + 1] > -0.35) {
      centralRearPointCount += 1;
    }
    if (fiber.points[offset] < -0.55 && fiber.points[offset + 1] > -0.2) {
      frontalPointCount += 1;
    }
    if (fiber.points[offset + 1] > 0.72) {
      crownPointCount += 1;
    }
    if (offset >= 3) {
      trajectoryLength += Math.hypot(
        fiber.points[offset] - fiber.points[offset - 3],
        fiber.points[offset + 1] - fiber.points[offset - 2],
        fiber.points[offset + 2] - fiber.points[offset - 1],
      );
    }
  }
  const pointCount = Math.max(1, fiber.points.length / 3);
  const upperRightOccupancy =
    upperRightPointCount / pointCount;
  const centralRearOccupancy = centralRearPointCount / pointCount;
  const frontalOccupancy = frontalPointCount / pointCount;
  const crownOccupancy = crownPointCount / pointCount;
  const finalOffset = Math.max(0, fiber.points.length - 3);
  const trajectoryChord = Math.hypot(
    fiber.points[finalOffset] - fiber.points[0],
    fiber.points[finalOffset + 1] - fiber.points[1],
    fiber.points[finalOffset + 2] - fiber.points[2],
  );
  const straightness = trajectoryChord / Math.max(0.001, trajectoryLength);
  const planarChordX = fiber.points[finalOffset] - fiber.points[0];
  const planarChordY = fiber.points[finalOffset + 1] - fiber.points[1];
  const planarChordLength = Math.max(
    0.001,
    Math.hypot(planarChordX, planarChordY),
  );
  let maximumPlanarDeviation = 0;
  for (let offset = 0; offset < fiber.points.length; offset += 3) {
    maximumPlanarDeviation = Math.max(
      maximumPlanarDeviation,
      Math.abs(
        planarChordY * fiber.points[offset] -
          planarChordX * fiber.points[offset + 1] +
          fiber.points[finalOffset] * fiber.points[1] -
          fiber.points[finalOffset + 1] * fiber.points[0],
      ) / planarChordLength,
    );
  }
  const upperRightCrosshatch =
    fiber.bundleTier !== "active" &&
    !boundaryFamily &&
    upperRightOccupancy >= 0.25 &&
    mixRenderKey(bundleKey ^ 0x55505252) % 5 <= 2;
  const redundantUpperRightBoundary =
    fiber.bundleTier === "dim" &&
    boundaryFamily &&
    fiber.family !== "cortical-fold" &&
    fiber.family !== "projection-tract" &&
    fiber.family !== "central-tract" &&
    fiber.family !== "posterior-fan" &&
    fiber.family !== "posterior-depth" &&
    upperRightOccupancy >= 0.35 &&
    mixRenderKey(bundleKey ^ 0x42524e44) % 4 === 0;
  const redundantUpperRightLiveBoundary =
    fiber.bundleTier === "dim" &&
    boundaryFamily &&
    fiber.family !== "cortical-fold" &&
    fiber.family !== "projection-tract" &&
    fiber.family !== "central-tract" &&
    fiber.family !== "posterior-fan" &&
    fiber.family !== "posterior-depth" &&
    upperRightOccupancy >= 0.35 &&
    mixRenderKey(bundleKey ^ 0x42524e44) % 2 === 0;
  const straightInteriorScaffold =
    fiber.bundleTier !== "active" &&
    !boundaryFamily &&
    fiber.family !== "cortical-fold" &&
    fiber.family !== "local-cortical" &&
    fiber.family !== "deep" &&
    fiber.family !== "interior-depth" &&
    centralRearOccupancy >= 0.2 &&
    trajectoryLength >= 1.05 &&
    straightness >= 0.78 &&
    mixRenderKey(bundleKey ^ 0x53545254) % 5 !== 0;
  const straightLocalScratch =
    fiber.bundleTier !== "active" &&
    fiber.family === "local-cortical" &&
    centralRearOccupancy >= 0.2 &&
    trajectoryLength >= 0.72 &&
    straightness >= 0.82 &&
    mixRenderKey(bundleKey ^ 0x4c4f434c) % 6 !== 0;
  const straightLocalChord =
    fiber.bundleTier !== "active" &&
    fiber.family === "local-cortical" &&
    centralRearOccupancy >= 0.2 &&
    trajectoryLength >= 0.62 &&
    maximumPlanarDeviation < 0.075 &&
    mixRenderKey(bundleKey ^ 0x43484f52) % 4 !== 0;
  const straightDeepFamilyScaffold =
    fiber.bundleTier !== "active" &&
    fiber.family === "deep" &&
    centralRearOccupancy >= 0.18 &&
    trajectoryLength >= 1.1 &&
    straightness >= 0.8 &&
    mixRenderKey(bundleKey ^ 0x44465054) % 3 !== 0;
  const straightFrontalDiagonal =
    fiber.bundleTier !== "active" &&
    fiber.family === "frontal-diagonal" &&
    frontalOccupancy >= 0.3 &&
    trajectoryLength >= 0.9 &&
    straightness >= 0.82 &&
    mixRenderKey(bundleKey ^ 0x46524453) % 3 !== 0;
  const straightFrontalSurface =
    fiber.bundleTier !== "active" &&
    fiber.family === "frontal-surface" &&
    frontalOccupancy >= 0.3 &&
    trajectoryLength >= 0.5 &&
    maximumPlanarDeviation < 0.07 &&
    mixRenderKey(bundleKey ^ 0x46525354) % 2 === 0;
  const redundantFrontalProjection =
    fiber.bundleTier !== "active" &&
    fiber.family === "projection-tract" &&
    frontalOccupancy >= 0.3 &&
    mixRenderKey(bundleKey ^ 0x46525052) % 3 !== 0;
  const angularFrontalScaffold =
    fiber.bundleTier !== "active" &&
    !boundaryFamily &&
    frontalOccupancy >= 0.16 &&
    trajectoryLength >= 0.8 &&
    maximumPlanarDeviation < 0.095 &&
    mixRenderKey(bundleKey ^ 0x4652414e) % 3 !== 0;
  const redundantCrownMicrofold =
    fiber.family === "cortical-microfold" &&
    crownOccupancy >= 0.16 &&
    crownOccupancy < 0.3 &&
    mixRenderKey(bundleKey ^ 0x4d43524e) % 3 === 0;
  const redundantCentralMicrofold =
    fiber.family === "cortical-microfold" &&
    centralRearOccupancy >= 0.2 &&
    crownOccupancy < 0.16 &&
    mixRenderKey(bundleKey ^ 0x4d434e54) % 3 === 0;
  const dimFrontalClutter =
    fiber.bundleTier === "dim" &&
    !boundaryFamily &&
    frontalOccupancy >= 0.3 &&
    mixRenderKey(bundleKey ^ 0x46524e54) % 3 !== 0;
  const dimCrownClutter =
    fiber.bundleTier === "dim" &&
    !boundaryFamily &&
    crownOccupancy >= 0.3 &&
    mixRenderKey(bundleKey ^ 0x43524f57) % 2 === 0;
  const shortAngularFrontalLoop =
    fiber.family === "frontal-loop" &&
    trajectoryLength < 1.05 &&
    straightness < 0.55;
  const closedFrontalSurface =
    fiber.family === "frontal-surface" && straightness < 0.4;
  const straightDeepScaffold =
    fiber.bundleTier !== "active" &&
    fiber.family === "interior-depth" &&
    centralRearOccupancy >= 0.2 &&
    trajectoryLength >= 0.9 &&
    maximumPlanarDeviation < 0.085 &&
    mixRenderKey(bundleKey ^ 0x44454550) % 3 !== 0;
  const staticOnlyInteriorDepth =
    fiber.bundleTier !== "active" &&
    fiber.family === "interior-depth" &&
    centralRearOccupancy >= 0.15 &&
    !straightDeepScaffold;
  const staticOnlyPosteriorDepth =
    fiber.bundleTier !== "active" &&
    fiber.family === "posterior-depth";
  const sharedSuppression =
    upperRightCrosshatch ||
    straightInteriorScaffold ||
    straightLocalScratch ||
    straightLocalChord ||
    straightDeepFamilyScaffold ||
    straightFrontalDiagonal ||
    straightFrontalSurface ||
    redundantFrontalProjection ||
    angularFrontalScaffold ||
    redundantCrownMicrofold ||
    redundantCentralMicrofold ||
    straightDeepScaffold ||
    dimFrontalClutter ||
    dimCrownClutter ||
    shortAngularFrontalLoop ||
    closedFrontalSurface;
  const suppressed =
    suppressible &&
    fiber.family !== "cortical-fold" &&
    (sharedSuppression || redundantUpperRightBoundary);
  const liveSuppressed =
    suppressible &&
    fiber.family !== "cortical-fold" &&
    (sharedSuppression ||
      redundantUpperRightLiveBoundary ||
      staticOnlyInteriorDepth ||
      staticOnlyPosteriorDepth);
  const pattern: readonly number[] =
    fiber.escapeStart >= 0
      ? fiber.bundleId % 2 === 0
        ? [2]
        : [1, 2]
      : fiber.family === "cortical-fold"
        ? fiber.bundleTier === "active"
          ? [0, 1, 2]
          : fiber.bundleTier === "dim"
          ? [1, 2]
          : bundleKey % 2 === 0
            ? [0, 1]
            : [1, 2]
        : fiber.bundleTier === "dim"
        ? DIM_CEREBRUM_STRAND_PATTERNS[
            bundleKey % DIM_CEREBRUM_STRAND_PATTERNS.length
          ]
        : fiber.bundleTier === "medium"
          ? MEDIUM_CEREBRUM_STRAND_PATTERNS[
              bundleKey % MEDIUM_CEREBRUM_STRAND_PATTERNS.length
            ]
          : [0, 1, 2, 3, 4];
  const coverageKey = renderUnit(bundleKey ^ 0x4c454e47);
  const placementKey = renderUnit(bundleKey ^ 0x504c4143);
  const baseCoverage =
    fiber.bundleTier === "dim"
      ? lerp(0.76, 0.94, coverageKey)
      : fiber.bundleTier === "medium"
        ? lerp(0.86, 0.99, coverageKey)
        : lerp(0.9, 1, coverageKey);
  const liveFoldCoverageCompensation =
    fiber.family === "cortical-fold" && fiber.bundleTier !== "active"
      ? 0.1
      : 0;
  const coverage = Math.min(
    1,
    baseCoverage +
      (boundaryFamily ? 0.06 : 0) -
      liveFoldCoverageCompensation,
  );
  const baseStart = (1 - coverage) * placementKey;
  const baseEnd = baseStart + coverage;

  strandVisible.fill(0);
  pattern.forEach((strandIndex) => {
    if (strandIndex >= fiber.strandCount) return;
    const strandKey = mixRenderKey(
      bundleKey ^ Math.imul(strandIndex + 1, 0x45d9f3b),
    );
    const signedOffset = strandIndex - centerStrand;
    const centerActiveStrand =
      fiber.bundleTier === "active" && strandIndex === centerStrand;
    const offsetScale =
      fiber.bundleTier === "active"
        ? lerp(0.94, 1.08, renderUnit(strandKey ^ 0x4f464653))
        : lerp(0.78, 1.12, renderUnit(strandKey ^ 0x4f464653));
    const offsetBias =
      (renderUnit(strandKey ^ 0x42494153) - 0.5) *
      (fiber.bundleTier === "active" ? 0.08 : 0.16);
    const startJitter =
      (renderUnit(strandKey ^ 0x53544152) - 0.5) *
      (fiber.bundleTier === "active" ? 0.1 : 0.024);
    const endJitter =
      (renderUnit(strandKey ^ 0x454e4421) - 0.5) *
      (fiber.bundleTier === "active" ? 0.14 : 0.034);

    strandVisible[strandIndex] = 1;
    strandOffset[strandIndex] =
      signedOffset === 0
        ? 0
        : clamp(signedOffset * offsetScale + offsetBias, -2.15, 2.15);
    strandDrift[strandIndex] =
      signedOffset === 0
        ? 0
        : (renderUnit(strandKey ^ 0x44524946) - 0.5) *
          (fiber.bundleTier === "active" ? 0.32 : 0.2);
    strandBend[strandIndex] =
      centerActiveStrand
        ? 0
        : lerp(0.3, 0.6, renderUnit(strandKey ^ 0x42454e44)) *
          (renderUnit(strandKey ^ 0x43555256) < 0.5 ? -1 : 1);
    strandBendPhase[strandIndex] =
      renderUnit(strandKey ^ 0x50484153) * TAU;
    strandStart[strandIndex] = centerActiveStrand
      ? 0
      : clamp(baseStart + startJitter, 0, 0.28);
    strandEnd[strandIndex] = centerActiveStrand
      ? 1
      : clamp(baseEnd + endJitter, 0.68, 1);
  });

  return {
    suppressed,
    liveSuppressed,
    strandVisible,
    strandOffset,
    strandDrift,
    strandBend,
    strandBendPhase,
    strandStart,
    strandEnd,
  };
};

const buildRotationMatrix = (
  yaw: number,
  pitch: number,
  roll: number,
) => {
  const cosineYaw = Math.cos(yaw);
  const sineYaw = Math.sin(yaw);
  const cosinePitch = Math.cos(pitch);
  const sinePitch = Math.sin(pitch);
  const cosineRoll = Math.cos(roll);
  const sineRoll = Math.sin(roll);
  return [
    cosineRoll * cosineYaw -
      sineRoll * sinePitch * sineYaw,
    -sineRoll * cosinePitch,
    cosineRoll * sineYaw +
      sineRoll * sinePitch * cosineYaw,
    sineRoll * cosineYaw +
      cosineRoll * sinePitch * sineYaw,
    cosineRoll * cosinePitch,
    sineRoll * sineYaw -
      cosineRoll * sinePitch * cosineYaw,
    -cosinePitch * sineYaw,
    sinePitch,
    cosinePitch * cosineYaw,
  ];
};

const endpointFade = (
  fiber: Fiber,
  pointIndex: number,
  _pointCount: number,
) => {
  return fiber.pointFade[pointIndex] ?? 0;
};

const pathPointAt = (
  fiber: Fiber,
  position: number,
): ProjectedPoint => {
  const pointCount = fiber.projected.length / 3;
  const exactIndex =
    clamp(position, 0, 1) * Math.max(1, pointCount - 1);
  const start = Math.min(pointCount - 1, Math.floor(exactIndex));
  const end = Math.min(pointCount - 1, start + 1);
  const progress = exactIndex - start;
  return {
    x: lerp(
      fiber.projected[start * 3],
      fiber.projected[end * 3],
      progress,
    ),
    y: lerp(
      fiber.projected[start * 3 + 1],
      fiber.projected[end * 3 + 1],
      progress,
    ),
    z: lerp(
      fiber.projected[start * 3 + 2],
      fiber.projected[end * 3 + 2],
      progress,
    ),
  };
};

const createGlowSprite = () => {
  const sprite = document.createElement("canvas");
  const spriteSize = 20 * MAX_DEVICE_PIXEL_RATIO;
  const spriteCenter = spriteSize * 0.5;
  sprite.width = spriteSize;
  sprite.height = spriteSize;
  const spriteContext = sprite.getContext("2d");
  if (!spriteContext) return sprite;
  const gradient = spriteContext.createRadialGradient(
    spriteCenter,
    spriteCenter,
    0,
    spriteCenter,
    spriteCenter,
    spriteCenter,
  );
  gradient.addColorStop(0, "rgba(255, 232, 128, 0.9)");
  gradient.addColorStop(0.18, "rgba(255, 191, 18, 0.5)");
  gradient.addColorStop(0.5, "rgba(255, 165, 0, 0.13)");
  gradient.addColorStop(1, "rgba(255, 146, 0, 0)");
  spriteContext.fillStyle = gradient;
  spriteContext.fillRect(0, 0, spriteSize, spriteSize);
  return sprite;
};

const drawParticle = (
  context: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  point: ProjectedPoint,
  hot: boolean,
  alpha: number,
  size: number,
) => {
  context.save();
  context.globalCompositeOperation = "lighter";
  context.globalAlpha = alpha;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  const glowSize = hot ? 22 : 16;
  context.drawImage(
    sprite,
    point.x - glowSize * 0.5,
    point.y - glowSize * 0.5,
    glowSize,
    glowSize,
  );
  context.fillStyle = hot
    ? "rgb(255, 248, 210)"
    : "rgb(255, 224, 96)";
  context.beginPath();
  context.arc(point.x, point.y, size, 0, TAU);
  context.fill();
  context.restore();
};

const drawCornerBrackets = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) => {
  const bracket = clamp(width * 0.014, 12, 24);
  const horizontalInset = clamp(width * 0.018, 10, 30);
  const topInset = clamp(height * 0.076, 34, 72);
  const bottomInset = clamp(height * 0.05, 18, 48);
  const left = horizontalInset;
  const top = topInset;
  const right = width - horizontalInset;
  const bottom = height - bottomInset;
  context.beginPath();
  context.moveTo(left, top + bracket);
  context.lineTo(left, top);
  context.lineTo(left + bracket, top);
  context.moveTo(right - bracket, top);
  context.lineTo(right, top);
  context.lineTo(right, top + bracket);
  context.moveTo(left, bottom - bracket);
  context.lineTo(left, bottom);
  context.lineTo(left + bracket, bottom);
  context.moveTo(right - bracket, bottom);
  context.lineTo(right, bottom);
  context.lineTo(right, bottom - bracket);
  context.strokeStyle = "rgba(255, 197, 18, 0.32)";
  context.lineWidth = 0.7;
  context.stroke();
};

// Inline-only derived-data cache. No imports, network, storage permission request,
// or automatic website/Framer synchronization. Bump this manual source/schema
// version whenever original anatomical generation or base render plans change.
const BRAIN_DERIVED_CACHE_VERSION = "c5024620207d5a801582a745f16dc1663500b3bb20a455e9d6bd9b35364ecc7e:packed-v2"
const BRAIN_DERIVED_CACHE_DB = "monarchic.website-brain.derived"
const BRAIN_DERIVED_CACHE_STORE = "canonical"
const BRAIN_DERIVED_CACHE_KEY = "data"
const BRAIN_DERIVED_FIBERS = 3816
const BRAIN_DERIVED_NODES = 93036
const BRAIN_DERIVED_FAMILIES = ["association","cortical-fold","cortical-microfold","cortical-arc","deep","temporal-longitudinal","crown-longitudinal","crown-descending","frontal-diagonal","frontal-loop","frontal-surface","temporal-loop","posterior-fan","posterior-surface","projection-tract","central-tract","local-cortical","interior-depth","posterior-depth","cerebellar-folia","cerebellar-ridge","cerebellar-shell","cerebellar-bridge","stem"] as const
const BRAIN_DERIVED_REGIONS = ["cerebrum","cerebellum","stem"] as const
const BRAIN_DERIVED_TIERS = ["dim","medium","active"] as const
const BRAIN_DERIVED_PLAN_FIELDS = ["strandOffset","strandDrift","strandBend","strandBendPhase","strandStart","strandEnd"] as const
interface BrainCacheData { fibers: Fiber[]; plans: FiberRenderPlan[] }
interface PackedBrainRecord {
  schema: 1; version: string; fiberCount: number; nodeCount: number; strandCount: number; checksum: string
  nodes: Uint32Array; strands: Uint32Array; points: Float32Array; fade: Float32Array; boundary: Float32Array
  visibility: Uint8Array; planValues: Float32Array; metrics: Float64Array; tags: Uint8Array; flags: Uint8Array
}
interface BrainCacheRead { data?: BrainCacheData; readMs: number; reason: "hit"|"miss"|"absent"|"invalid"|"timeout"|"blocked"|"error" }
interface BrainCacheHost {
  getIndexedDB(): IDBFactory | undefined
  now(): number
  setTimer(callback: () => void, milliseconds: number): ReturnType<typeof globalThis.setTimeout>
  clearTimer(timer: ReturnType<typeof globalThis.setTimeout>): void
  readDeadlineMs: number; writeDeadlineMs: number; writeDelayMs: number
}
const brainCacheClock = () => typeof performance === "object" ? performance.now() : Date.now()
function brainCacheTyped(value: unknown, name: string, length: number): boolean {
  return ArrayBuffer.isView(value) && Object.prototype.toString.call(value) === "[object "+name+"]" && (value as unknown as {length:number}).length === length
}
function brainCacheFreeze(data: BrainCacheData): BrainCacheData {
  // Nonempty typed arrays cannot be Object.freeze'd. Their bytes are read-only
  // by contract: renderers copy projection buffers; WB-04 clones adjusted plans.
  for (const fiber of data.fibers) Object.freeze(fiber)
  for (const plan of data.plans) Object.freeze(plan)
  Object.freeze(data.fibers); Object.freeze(data.plans); return Object.freeze(data)
}
function brainCacheChecksum(record: PackedBrainRecord, expired: () => boolean): string | undefined {
  let a=0x811c9dc5,b=0x9e3779b9
  const multiply=Math.imul
  const planes=[record.nodes,record.strands,record.points,record.fade,record.boundary,record.visibility,record.planValues,record.metrics,record.tags,record.flags]
  for (const plane of planes) {
    // Packed planes own aligned buffers. Hash complete 32-bit words instead of
    // repeating intrinsic/global lookups for every byte; preserve trailing bytes.
    const words=new Uint32Array(plane.buffer,plane.byteOffset,plane.byteLength>>>2)
    for(let i=0;i<words.length;i++) {
      if((i&4095)===0&&expired())return
      const word=words[i];a=multiply(a^word,0x01000193);b=multiply(b^word,0x85ebca6b)
    }
    const bytes=new Uint8Array(plane.buffer,plane.byteOffset,plane.byteLength)
    for(let i=words.length*4;i<bytes.length;i++) {
      const byte=bytes[i];a=multiply(a^byte,0x01000193);b=multiply(b^byte,0x85ebca6b)
    }
    a=multiply(a^bytes.length,0x01000193);b=multiply(b^bytes.length,0x85ebca6b)
  }
  // An accidental-corruption fingerprint, not a security/authenticity boundary.
  return (a>>>0).toString(16).padStart(8,"0")+(b>>>0).toString(16).padStart(8,"0")
}
function brainCachePackedShape(value: unknown): value is PackedBrainRecord {
  if(!value||typeof value!=="object")return false
  const r=value as PackedBrainRecord,n=BRAIN_DERIVED_FIBERS,p=BRAIN_DERIVED_NODES,s=r.strandCount
  return r.schema===1&&r.version===BRAIN_DERIVED_CACHE_VERSION&&r.fiberCount===n&&r.nodeCount===p&&Number.isInteger(s)&&s>=n&&s<=n*5&&typeof r.checksum==="string"&&/^[a-f0-9]{16}$/.test(r.checksum)
    &&brainCacheTyped(r.nodes,"Uint32Array",n+1)&&brainCacheTyped(r.strands,"Uint32Array",n+1)
    &&brainCacheTyped(r.points,"Float32Array",p*3)&&brainCacheTyped(r.fade,"Float32Array",p)&&brainCacheTyped(r.boundary,"Float32Array",p)
    &&brainCacheTyped(r.visibility,"Uint8Array",s)&&brainCacheTyped(r.planValues,"Float32Array",s*6)
    &&brainCacheTyped(r.metrics,"Float64Array",n*7)&&brainCacheTyped(r.tags,"Uint8Array",n*4)&&brainCacheTyped(r.flags,"Uint8Array",n)
    &&[r.nodes,r.strands,r.points,r.fade,r.boundary,r.visibility,r.planValues,r.metrics,r.tags,r.flags].every(plane=>plane.byteOffset===0&&plane.buffer.byteLength===plane.byteLength&&Object.prototype.toString.call(plane.buffer)==="[object ArrayBuffer]")
}
function unpackBrainCache(value: unknown, deadline=Infinity, now=brainCacheClock): BrainCacheData | undefined {
  try {
    if(!brainCachePackedShape(value))return
    const r=value,expired=()=>now()>deadline
    if(expired()||r.nodes[0]!==0||r.strands[0]!==0||r.nodes[BRAIN_DERIVED_FIBERS]!==BRAIN_DERIVED_NODES||r.strands[BRAIN_DERIVED_FIBERS]!==r.strandCount)return
    if(brainCacheChecksum(r,expired)!==r.checksum)return
    const fibers: Fiber[]=[],plans: FiberRenderPlan[]=[]
    const finite=(v:number,min:number,max:number)=>Number.isFinite(v)&&v>=min&&v<=max
    for(let i=0;i<BRAIN_DERIVED_FIBERS;i++) {
      if((i&31)===0&&expired())return
      const a=r.nodes[i],z=r.nodes[i+1],sa=r.strands[i],sz=r.strands[i+1],count=z-a,strandCount=sz-sa,mi=i*7,ti=i*4,flags=r.flags[i]
      if(count<2||count>512||strandCount<1||strandCount>5||z>BRAIN_DERIVED_NODES||sz>r.strandCount||flags>127)return
      if(r.tags[ti]>=BRAIN_DERIVED_REGIONS.length||r.tags[ti+1]>=BRAIN_DERIVED_FAMILIES.length||r.tags[ti+2]>=BRAIN_DERIVED_TIERS.length||r.tags[ti+3]>3)return
      const activityKey=r.metrics[mi],phase=r.metrics[mi+1],speed=r.metrics[mi+2],qualityRank=r.metrics[mi+3],bundleId=r.metrics[mi+4],strandSpread=r.metrics[mi+5],escapeStart=r.metrics[mi+6]
      if(!finite(activityKey,0,1)||!finite(phase,0,1)||!finite(speed,0,1)||!finite(qualityRank,0,1)||!Number.isInteger(bundleId)||bundleId<0||bundleId>65535||!finite(strandSpread,0,4)||!Number.isInteger(escapeStart)||escapeStart< -1||escapeStart>=count)return
      for(let k=a*3;k<z*3;k++)if(!finite(r.points[k],-16,16))return
      for(let k=a;k<z;k++)if(!finite(r.fade[k],0,1)||!finite(r.boundary[k],0,1))return
      for(let k=sa;k<sz;k++) {
        if(r.visibility[k]>1)return
        for(let plane=0;plane<6;plane++)if(!finite(r.planValues[plane*r.strandCount+k],-8,8))return
        const start=r.planValues[4*r.strandCount+k],end=r.planValues[5*r.strandCount+k]
        if(start<0||start>1||end<start||end>1)return
      }
      // Each recovered array owns its exact-sized ArrayBuffer. Existing geometry
      // hash tests and consumers must not accidentally include adjacent views.
      fibers.push({points:r.points.slice(a*3,z*3),projected:new Float32Array(count*3),pointFade:r.fade.slice(a,z),boundaryScale:r.boundary.slice(a,z),
        region:BRAIN_DERIVED_REGIONS[r.tags[ti]],family:BRAIN_DERIVED_FAMILIES[r.tags[ti+1]],bundleTier:BRAIN_DERIVED_TIERS[r.tags[ti+2]],opacityBand:r.tags[ti+3] as OpacityBand,
        active:Boolean(flags&1),particle:Boolean(flags&2),hot:Boolean(flags&4),corticalLandmark:Boolean(flags&8),visible:Boolean(flags&16),activityKey,phase,speed,qualityRank,bundleId,strandCount,strandSpread,escapeStart})
      const plan={suppressed:Boolean(flags&32),liveSuppressed:Boolean(flags&64),strandVisible:r.visibility.slice(sa,sz)} as FiberRenderPlan
      for(let plane=0;plane<6;plane++)plan[BRAIN_DERIVED_PLAN_FIELDS[plane]]=r.planValues.slice(plane*r.strandCount+sa,plane*r.strandCount+sz)
      plans.push(plan)
    }
    if(expired())return
    const data=brainCacheFreeze({fibers,plans})
    return expired()?undefined:data
  } catch { return }
}
function packBrainCache(data: BrainCacheData): PackedBrainRecord | undefined {
  try {
    if(data.fibers.length!==BRAIN_DERIVED_FIBERS||data.plans.length!==BRAIN_DERIVED_FIBERS)return
    let nodeCount=0,strandCount=0
    for(const fiber of data.fibers) {
      const nodes=fiber.points?.length/3
      if(!Number.isInteger(nodes)||nodes<2||nodes>512||!Number.isInteger(fiber.strandCount)||fiber.strandCount<1||fiber.strandCount>5)return
      nodeCount+=nodes;strandCount+=fiber.strandCount
      if(nodeCount>BRAIN_DERIVED_NODES)return
    }
    if(nodeCount!==BRAIN_DERIVED_NODES)return
    const r:PackedBrainRecord={schema:1,version:BRAIN_DERIVED_CACHE_VERSION,fiberCount:BRAIN_DERIVED_FIBERS,nodeCount,strandCount,checksum:"",
      nodes:new Uint32Array(BRAIN_DERIVED_FIBERS+1),strands:new Uint32Array(BRAIN_DERIVED_FIBERS+1),points:new Float32Array(nodeCount*3),fade:new Float32Array(nodeCount),boundary:new Float32Array(nodeCount),visibility:new Uint8Array(strandCount),planValues:new Float32Array(strandCount*6),metrics:new Float64Array(BRAIN_DERIVED_FIBERS*7),tags:new Uint8Array(BRAIN_DERIVED_FIBERS*4),flags:new Uint8Array(BRAIN_DERIVED_FIBERS)}
    let node=0,strand=0
    for(let i=0;i<BRAIN_DERIVED_FIBERS;i++) {
      const f=data.fibers[i],p=data.plans[i],count=f.points.length/3,mi=i*7,ti=i*4
      if(!brainCacheTyped(f.points,"Float32Array",count*3)||!brainCacheTyped(f.projected,"Float32Array",count*3)||!brainCacheTyped(f.pointFade,"Float32Array",count)||!brainCacheTyped(f.boundaryScale,"Float32Array",count)||!brainCacheTyped(p.strandVisible,"Uint8Array",f.strandCount))return
      for(const value of f.projected)if(value!==0)return
      r.nodes[i]=node;r.strands[i]=strand;r.points.set(f.points,node*3);r.fade.set(f.pointFade,node);r.boundary.set(f.boundaryScale,node);r.visibility.set(p.strandVisible,strand)
      for(let plane=0;plane<6;plane++){const values=p[BRAIN_DERIVED_PLAN_FIELDS[plane]];if(!brainCacheTyped(values,"Float32Array",f.strandCount))return;r.planValues.set(values,plane*strandCount+strand)}
      r.metrics.set([f.activityKey,f.phase,f.speed,f.qualityRank,f.bundleId,f.strandSpread,f.escapeStart],mi)
      const region=BRAIN_DERIVED_REGIONS.indexOf(f.region),family=BRAIN_DERIVED_FAMILIES.indexOf(f.family),tier=BRAIN_DERIVED_TIERS.indexOf(f.bundleTier)
      if(region<0||family<0||tier<0)return
      r.tags.set([region,family,tier,f.opacityBand],ti)
      r.flags[i]=(f.active?1:0)|(f.particle?2:0)|(f.hot?4:0)|(f.corticalLandmark?8:0)|(f.visible?16:0)|(p.suppressed?32:0)|(p.liveSuppressed?64:0)
      node+=count;strand+=f.strandCount
    }
    r.nodes[BRAIN_DERIVED_FIBERS]=node;r.strands[BRAIN_DERIVED_FIBERS]=strand
    r.checksum=brainCacheChecksum(r,()=>false)??""
    return r
  } catch { return }
}
function createBrainPersistentCache(overrides: Partial<BrainCacheHost> = {}) {
  const host:BrainCacheHost={getIndexedDB:()=>globalThis.indexedDB,now:brainCacheClock,setTimer:(fn,ms)=>globalThis.setTimeout(fn,ms),clearTimer:id=>globalThis.clearTimeout(id),readDeadlineMs:200,writeDeadlineMs:250,writeDelayMs:300,...overrides}
  const readBudget=Math.min(250,Math.max(0,host.readDeadlineMs)),writeBudget=Math.min(1000,Math.max(1,host.writeDeadlineMs))
  let pendingRead:Promise<BrainCacheRead>|undefined,pendingWrite:Promise<boolean>|undefined,queuedData:BrainCacheData|undefined
  const diagnostics={readReason:"unused",readMs:0,writeState:"unused"}
  function read():Promise<BrainCacheRead> {
    if(pendingRead)return pendingRead
    const started=host.now(),deadline=started+readBudget
    const task=new Promise<BrainCacheRead>(resolve=>{
      let settled=false,db:IDBDatabase|undefined,timer:ReturnType<typeof globalThis.setTimeout>|undefined
      const close=()=>{try{db?.close()}catch{}}
      const finish=(reason:BrainCacheRead["reason"],data?:BrainCacheData)=>{if(settled)return;settled=true;if(timer!==undefined)host.clearTimer(timer);close();diagnostics.readReason=reason;diagnostics.readMs=host.now()-started;resolve({reason,readMs:diagnostics.readMs,...(data?{data}:{})})}
      try {
        // Access itself may throw SecurityError in a restricted iframe.
        const indexedDB=host.getIndexedDB();if(!indexedDB){finish("absent");return}
        timer=host.setTimer(()=>finish("timeout"),readBudget)
        const request=indexedDB.open(BRAIN_DERIVED_CACHE_DB,1)
        request.onerror=()=>finish("error");request.onblocked=()=>finish("blocked")
        request.onupgradeneeded=()=>{db=request.result;try{if(!db.objectStoreNames.contains(BRAIN_DERIVED_CACHE_STORE))db.createObjectStore(BRAIN_DERIVED_CACHE_STORE)}catch{};if(settled){close();return}finish("miss")}
        request.onsuccess=()=>{
          db=request.result;db.onversionchange=()=>db?.close()
          if(settled){close();return}
          try {
            const transaction=db.transaction(BRAIN_DERIVED_CACHE_STORE,"readonly"),get=transaction.objectStore(BRAIN_DERIVED_CACHE_STORE).get(BRAIN_DERIVED_CACHE_KEY)
            transaction.onabort=()=>finish("error");transaction.onerror=()=>finish("error");get.onerror=()=>finish("error")
            get.onsuccess=()=>{if(settled)return;try{if(host.now()>deadline){finish("timeout");return}const value=get.result,data=unpackBrainCache(value,deadline,host.now);finish(data?"hit":value===undefined?"miss":host.now()>deadline?"timeout":"invalid",data)}catch{finish("error")}}
          } catch {finish("error")}
        }
      } catch {finish("error")}
    })
    pendingRead=task;void task.then(()=>{if(pendingRead===task)pendingRead=undefined});return task
  }
  function writeRecord(record:PackedBrainRecord):Promise<boolean> {
    return new Promise(resolve=>{
      let settled=false,db:IDBDatabase|undefined,transaction:IDBTransaction|undefined,timer:ReturnType<typeof globalThis.setTimeout>|undefined
      const close=()=>{try{db?.close()}catch{}}
      const finish=(passed:boolean)=>{if(settled)return;settled=true;if(timer!==undefined)host.clearTimer(timer);if(!passed)try{transaction?.abort()}catch{};close();resolve(passed)}
      try {
        const indexedDB=host.getIndexedDB();if(!indexedDB){finish(false);return}
        timer=host.setTimer(()=>finish(false),writeBudget)
        const request=indexedDB.open(BRAIN_DERIVED_CACHE_DB,1)
        request.onerror=()=>finish(false);request.onblocked=()=>finish(false)
        request.onupgradeneeded=()=>{db=request.result;try{if(!db.objectStoreNames.contains(BRAIN_DERIVED_CACHE_STORE))db.createObjectStore(BRAIN_DERIVED_CACHE_STORE)}catch{finish(false)}if(settled)close()}
        request.onsuccess=()=>{
          db=request.result;db.onversionchange=()=>db?.close();if(settled){close();return}
          try {
            transaction=db.transaction(BRAIN_DERIVED_CACHE_STORE,"readwrite")
            transaction.oncomplete=()=>finish(true);transaction.onerror=()=>finish(false);transaction.onabort=()=>finish(false)
            // Only this component's dedicated cache store is replaced. No other
            // database/store is read, cleared, deleted or migrated.
            const store=transaction.objectStore(BRAIN_DERIVED_CACHE_STORE);store.clear();store.put(record,BRAIN_DERIVED_CACHE_KEY)
          } catch {finish(false)}
        }
      } catch {finish(false)}
    })
  }
  function writeSoon(data:BrainCacheData):Promise<boolean> {
    queuedData=data;if(pendingWrite)return pendingWrite
    diagnostics.writeState="queued"
    const task=new Promise<boolean>(resolve=>{
      host.setTimer(()=>{
        const latest=queuedData;queuedData=undefined
        const record=latest?packBrainCache(latest):undefined
        if(!record){diagnostics.writeState="invalid";resolve(false);return}
        diagnostics.writeState="writing"
        void writeRecord(record).then(passed=>{diagnostics.writeState=passed?"saved":"unavailable";resolve(passed)},()=>{diagnostics.writeState="unavailable";resolve(false)})
      },Math.max(0,host.writeDelayMs))
    })
    pendingWrite=task;void task.then(()=>{if(pendingWrite===task)pendingWrite=undefined;if(queuedData)void writeSoon(queuedData)});return task
  }
  return {read,writeSoon,getDiagnostics:()=>({...diagnostics}),version:BRAIN_DERIVED_CACHE_VERSION}
}

// Strip this final export declaration when inlining into a standalone component.

// Share exact immutable anatomy and base plans across standalone materials.
// The schema/source key prevents HMR or a later geometry revision from reusing
// incompatible buffers. Renderer projections and WB-04 adjustments stay local.
const BRAIN_GEOMETRY_KEY = Symbol.for("monarchic.website-brain.anatomy.v1.c5024620207d5a801582a745f16dc1663500b3bb20a455e9d6bd9b35364ecc7e")
interface PreparedBrainGeometry {
    fibers: Fiber[]; plans: FiberRenderPlan[]; origin: "generated" | "persistent"
    geometryMs: number; plansMs: number; startedAt: number; readyAt: number
    persistentReadMs?: number; persistentReadReason?: BrainCacheRead["reason"]
}
interface SharedBrainGeometry { state: "pending" | "ready"; startedAt: number; promise: Promise<PreparedBrainGeometry> }
interface BrainLoadProfile {
    cacheSource: "generated" | "persistent" | "shared-pending" | "shared-ready"
    origin?: "generated" | "persistent"; moduleStartedAt: number; moduleWaitMs?: number
    geometryMs?: number; plansMs?: number; startedAt?: number; readyAt?: number
    persistentReadMs?: number; persistentReadReason?: BrainCacheRead["reason"]
}
let preparedFibers: Fiber[] | undefined
let preparedRenderPlans: FiberRenderPlan[] | undefined
let geometryPreparation: Promise<Fiber[]> | undefined
let brainLoadProfile: BrainLoadProfile | undefined
const consumedTraces = new WeakMap<HTMLElement, number>()
let persistentBrainCache: ReturnType<typeof createBrainPersistentCache> | undefined
function getPersistentBrainCache() {
    return persistentBrainCache ??= createBrainPersistentCache()
}
async function buildBrainGeometry(): Promise<PreparedBrainGeometry> {
    const startedAt = performance.now(), cache = getPersistentBrainCache()
    let stored: BrainCacheRead
    // Only storage failures are recoverable here. A generation rejection must
    // reach the shared-job retry path, never start a second hidden generation.
    try { stored = await cache.read() }
    catch { stored = { reason: "error", readMs: performance.now() - startedAt } }
    if (stored.data) return { ...stored.data, origin: "persistent", geometryMs: 0, plansMs: 0, startedAt, readyAt: performance.now(), persistentReadMs: stored.readMs, persistentReadReason: stored.reason }
    const generationStartedAt = performance.now()
    const fibers = await createFiberField()
    const geometryReadyAt = performance.now()
    const plans = fibers.map(createFiberRenderPlan)
    const readyAt = performance.now()
    // Unsupported/restricted storage must not incur a useless packing job.
    // Supported cache misses/corruption are saved after the first-frame window.
    if (stored.reason === "miss" || stored.reason === "invalid") {
        try { void cache.writeSoon({ fibers, plans }).catch(() => {}) } catch { /* Optional cache writes never block drawing. */ }
    }
    return { fibers, plans, origin: "generated", geometryMs: geometryReadyAt - generationStartedAt, plansMs: readyAt - geometryReadyAt, startedAt, readyAt, persistentReadMs: stored.readMs, persistentReadReason: stored.reason }
}
function getPreparedRenderPlans(): FiberRenderPlan[] {
    if (!preparedRenderPlans) throw new Error("The anatomical render plans are not ready.")
    return preparedRenderPlans
}
function getBrainLoadProfile() {
    return { version: 1, geometrySource: "c5024620207d5a801582a745f16dc1663500b3bb20a455e9d6bd9b35364ecc7e", state: preparedFibers ? "ready" : geometryPreparation ? "pending" : "empty", ...brainLoadProfile }
}
function prepareGeometry(): Promise<Fiber[]> {
    if (preparedFibers) return Promise.resolve(preparedFibers)
    if (!geometryPreparation) {
        const realm = window as unknown as { [key: symbol]: SharedBrainGeometry | undefined }
        let shared = realm[BRAIN_GEOMETRY_KEY]
        const moduleStartedAt = performance.now()
        const cacheSource = shared ? shared.state === "ready" ? "shared-ready" : "shared-pending" : "generated"
        if (!shared) {
            const resource = { state: "pending" as "pending" | "ready", startedAt: moduleStartedAt, promise: undefined as unknown as Promise<PreparedBrainGeometry> }
            // Defer the CPU work until after the shared promise is installed:
            // simultaneous modules then join one job instead of starting four.
            resource.promise = Promise.resolve().then(buildBrainGeometry).then(value => { resource.state = "ready"; return value })
            realm[BRAIN_GEOMETRY_KEY] = resource
            shared = resource
        }
        const resource = shared
        brainLoadProfile = { cacheSource, moduleStartedAt }
        geometryPreparation = resource.promise.then(value => {
            preparedFibers = value.fibers; preparedRenderPlans = value.plans
            brainLoadProfile = { cacheSource: cacheSource === "generated" && value.origin === "persistent" ? "persistent" : cacheSource, origin: value.origin, moduleStartedAt, moduleWaitMs: performance.now() - moduleStartedAt, geometryMs: value.geometryMs, plansMs: value.plansMs, startedAt: value.startedAt, readyAt: value.readyAt, persistentReadMs: value.persistentReadMs, persistentReadReason: value.persistentReadReason }
            return value.fibers
        }).catch(error => {
            if (realm[BRAIN_GEOMETRY_KEY] === resource) delete realm[BRAIN_GEOMETRY_KEY]
            geometryPreparation = undefined; preparedFibers = undefined; preparedRenderPlans = undefined
            throw error
        })
    }
    return geometryPreparation
}

function createRenderer(canvas: HTMLCanvasElement, initial: Settings, notify: (status: Status, error?: string) => void, resumeTime = initial.stillTime) {
  if (!preparedFibers) throw new Error("The website brain geometry is not ready.")
  let settings = initial, currentTime = resumeTime, lastDrawTime = resumeTime, disposed = false
  const field = settings.colorHost?.parentElement
  const status = field?.querySelector<HTMLElement>("[data-brain-status]")
  const staticCanvas = document.createElement("canvas")
  const staticContext = staticCanvas.getContext("2d", { alpha: true })
  const context = canvas.getContext("2d", { alpha: true })
  if (!staticContext || !context) throw new Error("Canvas 2D is unavailable in this browser.")
  let staticBitmap: ImageBitmap | undefined, substrateGeneration = 0
  const fibers: Fiber[] = preparedFibers.map(fiber => ({ ...fiber, projected: new Float32Array(fiber.points.length), visible: false }))
  const renderPlans = getPreparedRenderPlans();
  const executionWaveEligible = new Uint8Array(fibers.length);
  const executionWaveBias = new Float32Array(fibers.length);
  const constructionWaveEligible = new Uint8Array(fibers.length);
  const constructionWavePhase = new Float32Array(fibers.length);
  const constructionWaveRank = new Float32Array(fibers.length);
  const constructionWaveDirection = new Int8Array(fibers.length);
  fibers.forEach((fiber, index) => {
    const waveKey = mixRenderKey(fiber.bundleId ^ 0x57415645);
    executionWaveEligible[index] =
      fiber.escapeStart < 0 &&
      (fiber.bundleTier !== "dim" || waveKey % 5 < 2)
        ? 1
        : 0;
    executionWaveBias[index] =
      (renderUnit(waveKey ^ 0x42494153) - 0.5) * 0.05;
    const constructionKey = mixRenderKey(
      fiber.bundleId ^ 0x434f4e53,
    );
    constructionWaveEligible[index] =
      fiber.escapeStart < 0 &&
      fiber.region === "cerebrum" &&
      fiber.bundleTier !== "active" &&
      fiber.family !== "cortical-microfold" &&
      fiber.family !== "interior-depth" &&
      fiber.family !== "posterior-depth" &&
      (fiber.bundleTier === "medium" || constructionKey % 7 < 2)
        ? 1
        : 0;
    constructionWavePhase[index] = renderUnit(
      constructionKey ^ 0x50484153,
    );
    constructionWaveRank[index] = renderUnit(
      constructionKey ^ 0x52414e4b,
    );
    constructionWaveDirection[index] = constructionKey % 2 === 0 ? 1 : -1;
  });
  const renderPlanByFiber = new Map(
    fibers.map((fiber, index) => [fiber, renderPlans[index]]),
  );

  const particleCerebrum = fibers.filter(
    (fiber) => fiber.particle && fiber.region === "cerebrum",
  );
  const particleCerebellum = fibers.filter(
    (fiber) => fiber.particle && fiber.region === "cerebellum",
  );
  const particleStem = fibers.filter(
    (fiber) => fiber.particle && fiber.region === "stem",
  );
  const particleQueues = {
    cerebrum: [...particleCerebrum],
    cerebellum: [...particleCerebellum],
    stem: [...particleStem],
  };
  const particleRegionPattern: FiberRegion[] = [
    "cerebrum",
    "cerebrum",
    "cerebrum",
    "cerebrum",
    "cerebellum",
    "cerebrum",
    "cerebrum",
    "cerebrum",
    "cerebellum",
    "stem",
  ];
  const particleFibers: Fiber[] = [];
  let particleQueueProgress = true;
  while (particleQueueProgress) {
    particleQueueProgress = false;
    particleRegionPattern.forEach((region) => {
      const fiber = particleQueues[region].shift();
      if (!fiber) return;
      particleFibers.push(fiber);
      particleQueueProgress = true;
    });
  }
  const particleFiberRank = new Map(
    particleFibers.map((fiber, index) => [fiber, index]),
  );
  const outboundCandidates = fibers
    .filter((fiber) => fiber.escapeStart >= 0)
    .sort(
      (left, right) =>
        left.points[left.escapeStart * 3 + 1] -
        right.points[right.escapeStart * 3 + 1],
    );
  const outboundFibers = Array.from(
    {
      length: Math.min(
        OUTBOUND_FIBER_COUNT,
        outboundCandidates.length,
      ),
    },
    (_, index) =>
      outboundCandidates[
        Math.round(
          (index * (outboundCandidates.length - 1)) /
            Math.max(1, OUTBOUND_FIBER_COUNT - 1),
        )
      ],
  );
  const outboundFiberPriority = Array.from(
    { length: outboundFibers.length },
    (_, rank) => {
      const pair = Math.floor(rank / 2);
      const index = rank % 2 === 0
        ? pair
        : outboundFibers.length - 1 - pair;
      return outboundFibers[index];
    },
  );
  const outboundFiberSets = Array.from(
    { length: OUTBOUND_FIBER_COUNT + 1 },
    (_, count) =>
      new Set(
        outboundFiberPriority.slice(
          0,
          Math.min(count, outboundFiberPriority.length),
        ),
      ),
  );
  const glowSprite = createGlowSprite();
  const pulses: Pulse[] = [];
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  const mediumFiberGain = 4.4;
  const staticLightGains = [1, 0.82, 2.15, 1.32] as const;
  const cerebrumLightBand = (
    modelX: number,
    modelY: number,
    boundaryStrength: number,
  ) => {
    if (
      modelX >= -0.62 &&
      modelX <= 1.05 &&
      modelY > 0.42 &&
      boundaryStrength > 0.16
    ) {
      return 1;
    }
    if (
      modelX < -0.62 &&
      modelY > -0.58 &&
      boundaryStrength > 0.2
    ) {
      return 2;
    }
    if (
      modelX > 0.32 &&
      modelY > 0.48 &&
      boundaryStrength > 0.55
    ) {
      return 1;
    }
    if (
      modelX > 0.35 &&
      modelY < -0.05 &&
      boundaryStrength > 0.15
    ) {
      return 2;
    }
    if (
      modelX > -0.7 &&
      modelX <= 0.35 &&
      modelY < -0.05 &&
      boundaryStrength > 0.15
    ) {
      return 1;
    }
    return 0;
  };
  const idleSignalSpeed = 0.3;
  const pulseDuration = () => (reducedMotion.matches ? 650 : 2200);
  const executionWaveCycle = 16000;
  const executionWaveTravel = 6000;
  const constructionWaveCycle = 15200;
  const constructionWaveTravel = 5200;
  const constructionWaveLevels = 4;
  const constructionWaveEchoSpacing = 0.056;
  const constructionWaveHeadWidth = 0.022;
  const executionWaveStepPattern = [
    0,
    0.055,
    0.055,
    -0.035,
    -0.035,
    0.085,
    0.025,
    0.025,
    -0.065,
    -0.01,
    0.05,
    0.05,
  ] as const;
  const pointer = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    active: false,
  };

  let width = 1;
  let height = 1;
  let pixelRatio = 1;

  let yaw = -0.34;
  let pitch = -0.055;

  let staticRenderSignature = "";

  // Preserve logical CSS dimensions for every anatomical/LOD calculation.
  // Only the backing buffers follow transformed screen demand and the pool cap.
  const targetPixelRatio = () => Math.max(Number.EPSILON, Math.min(
    (settings.managedBufferWidth ?? width) / width,
    (settings.managedBufferHeight ?? height) / height,
  ));

  const responsiveDensityPosition = () => {
    const cssDensity = Math.pow(smoothstep(320, 760, width), 1.35);
    // High-DPR panels retain physical sharpness with deterministic geometry LOD.
    const pixelDensityBudget = lerp(
      0.38,
      0.12,
      smoothstep(1, MAX_DEVICE_PIXEL_RATIO, pixelRatio),
    );
    return cssDensity * pixelDensityBudget;
  };

  const responsiveSignalPosition = () => {
    const cssSignalDensity = Math.pow(
      smoothstep(320, 980, width),
      0.78,
    );
    const highDprBudget = lerp(
      1,
      0.82,
      smoothstep(1, MAX_DEVICE_PIXEL_RATIO, pixelRatio),
    );
    return cssSignalDensity * highDprBudget;
  };

  const responsiveCurveDetailPosition = () => {
    const cssCurveDetail = smoothstep(360, 820, width);
    const highDprBudget = lerp(
      1,
      0.86,
      smoothstep(1, MAX_DEVICE_PIXEL_RATIO, pixelRatio),
    );
    return cssCurveDetail * highDprBudget;
  };

  const responsiveLiveQualityCutoff = (
    fiber: Fiber,
    densityPosition: number,
  ) => {
    const fullQualityFloor =
      fiber.region !== "cerebellum"
        ? lerp(
            COMPACT_CEREBRUM_DENSITY_FLOOR,
            0.14,
            smoothstep(320, 420, width),
          )
        : fiber.family === "cerebellar-folia"
          ? 0.58
          : 0.48;
    const responsiveFloor = lerp(
      fullQualityFloor,
      fiber.region === "cerebellum" ? 0.12 : 0.08,
      smoothstep(1, MAX_DEVICE_PIXEL_RATIO, pixelRatio),
    );
    return lerp(responsiveFloor, 0.62, densityPosition);
  };

  const drawStaticSubstrate = () => {
    staticContext.setTransform(
      pixelRatio,
      0,
      0,
      pixelRatio,
      0,
      0,
    );
    staticContext.clearRect(0, 0, width, height);

    const staticOpacityLevels = 3;
    const staticLightLevels = CORTEX_LIGHT_LEVELS;
    const staticPaths = Array.from(
      {
        length:
          staticOpacityLevels * DEPTH_LEVELS * staticLightLevels,
      },
      () => new Path2D(),
    );
    const staticCompanionPaths = Array.from(
      {
        length:
          staticOpacityLevels * DEPTH_LEVELS * staticLightLevels,
      },
      () => new Path2D(),
    );
    const posteriorDepthPaths = Array.from(
      { length: DEPTH_LEVELS },
      () => new Path2D(),
    );
    const staticNodePaths = Array.from(
      { length: DEPTH_LEVELS },
      () => new Path2D(),
    );
    let staticNodeCount = 0;
    const matrix = buildRotationMatrix(-0.34, -0.055, -0.018);
    const densityPosition = responsiveDensityPosition();
    const curveDetailPosition = responsiveCurveDetailPosition();
    const horizontalModelPadding = clamp(width * 0.02, 8, 16);
    const verticalModelPadding = clamp(height * 0.08, 28, 52);
    const modelScale = Math.min(
      (width - horizontalModelPadding * 2) / 4.66,
      (height - verticalModelPadding * 2) / 2.71,
    );
    const horizontalModelScale = modelScale * HORIZONTAL_MODEL_ASPECT;
    const centerX = width * 0.5 - modelScale * 0.29;
    const centerY = height * 0.5 + modelScale * 0.155;
    const cameraDistance = 7.8;

    fibers.forEach((fiber, fiberIndex) => {
      const renderPlan = renderPlans[fiberIndex];
      const staticOnlyMicrofold =
        fiber.family === "cortical-microfold";
      const staticOnlyFiber =
        renderPlan.liveSuppressed && !renderPlan.suppressed;
      if (
        fiber.escapeStart >= 0 ||
        fiber.bundleTier === "active" ||
        renderPlan.suppressed
      ) {
        return;
      }
      const liveQualityCutoff = responsiveLiveQualityCutoff(
        fiber,
        densityPosition,
      );
      if (
        (!staticOnlyMicrofold &&
          !staticOnlyFiber &&
          fiber.qualityRank <= liveQualityCutoff) ||
        fiber.qualityRank > (staticOnlyMicrofold ? 0.985 : 0.97)
      ) {
        return;
      }

      const pointCount = fiber.points.length / 3;
      let staticCrownPointCount = 0;
      let staticCentralPointCount = 0;
      for (let offset = 0; offset < fiber.points.length; offset += 3) {
        if (fiber.points[offset + 1] > 0.72) {
          staticCrownPointCount += 1;
        }
        if (fiber.points[offset] > -0.15 && fiber.points[offset + 1] > -0.35) {
          staticCentralPointCount += 1;
        }
      }
      const suppressStaticCompanions =
        staticOnlyFiber &&
        (staticCrownPointCount / Math.max(1, pointCount) >= 0.22 ||
          staticCentralPointCount / Math.max(1, pointCount) >= 0.38);
      const companionKey = mixRenderKey(fiber.bundleId ^ 0x434f4d50);
      const companionCount = fiber.family === "posterior-depth"
        ? 0
        : suppressStaticCompanions
          ? 0
          : fiber.region === "cerebellum"
            ? companionKey % 3 === 0
              ? 1
              : 0
            : staticOnlyMicrofold
              ? 0
              : fiber.family === "cortical-fold"
                ? 1
                : fiber.family === "local-cortical"
                  ? companionKey % 4 === 0
                    ? 2
                    : 1
                  : companionKey % 5 === 0
                    ? 1
                    : 2;
      const companionPhase = renderUnit(companionKey ^ 0x50484153) * TAU;
      const companionDrift = lerp(
        0.1,
        0.34,
        renderUnit(companionKey ^ 0x44524946),
      );
      const pointStep =
        curveDetailPosition >= 0.62
          ? 1
          : curveDetailPosition >= 0.18
            ? 2
            : fiber.region === "cerebrum"
              ? 3
              : 2;
      for (
        let pointIndex = pointStep;
        pointIndex < pointCount;
        pointIndex += pointStep
      ) {
        const previousPointIndex = pointIndex - pointStep;
        const previousOffset = previousPointIndex * 3;
        const offset = pointIndex * 3;
        let fade = Math.min(
          endpointFade(fiber, previousPointIndex, pointCount),
          endpointFade(fiber, pointIndex, pointCount),
        );
        fade *= Math.min(
          fiber.boundaryScale[previousPointIndex],
          fiber.boundaryScale[pointIndex],
        );
        if (fade < 0.06) continue;

        const previousX = fiber.points[previousOffset];
        const previousY = fiber.points[previousOffset + 1];
        const previousZ = fiber.points[previousOffset + 2];
        const previousRotatedX =
          matrix[0] * previousX +
          matrix[1] * previousY +
          matrix[2] * previousZ;
        const previousRotatedY =
          matrix[3] * previousX +
          matrix[4] * previousY +
          matrix[5] * previousZ;
        const previousRotatedZ =
          matrix[6] * previousX +
          matrix[7] * previousY +
          matrix[8] * previousZ;
        const previousPerspective =
          cameraDistance / (cameraDistance - previousRotatedZ);

        const nextX = fiber.points[offset];
        const nextY = fiber.points[offset + 1];
        const nextZ = fiber.points[offset + 2];
        const nextRotatedX =
          matrix[0] * nextX + matrix[1] * nextY + matrix[2] * nextZ;
        const nextRotatedY =
          matrix[3] * nextX + matrix[4] * nextY + matrix[5] * nextZ;
        const nextRotatedZ =
          matrix[6] * nextX + matrix[7] * nextY + matrix[8] * nextZ;
        const nextPerspective =
          cameraDistance / (cameraDistance - nextRotatedZ);
        const depth = (previousRotatedZ + nextRotatedZ) * 0.5;
        const depthBand = Math.min(
          DEPTH_LEVELS - 1,
          Math.floor(smoothstep(-0.92, 0.92, depth) * DEPTH_LEVELS),
        );
        const opacityBand = Math.min(
          staticOpacityLevels - 1,
          Math.floor(fade * staticOpacityLevels),
        );
        const modelX = (previousX + nextX) * 0.5;
        const modelY = (previousY + nextY) * 0.5;
        const staticLightBand =
          fiber.family === "cortical-fold"
            ? 3
            : fiber.region === "cerebellum"
            ? 2
            : fiber.region === "cerebrum"
              ? modelX < -0.62 && modelY > -0.58
                ? 3
                : cerebrumLightBand(modelX, modelY, 1)
              : 0;
        const staticPathIndex =
          (opacityBand * DEPTH_LEVELS + depthBand) *
            staticLightLevels +
          staticLightBand;
        const staticPath = fiber.family === "posterior-depth"
          ? posteriorDepthPaths[depthBand]
          : staticPaths[staticPathIndex];
        const previousProjectedX =
          centerX +
          previousRotatedX * horizontalModelScale * previousPerspective;
        const previousProjectedY =
          centerY - previousRotatedY * modelScale * previousPerspective;
        const nextProjectedX =
          centerX + nextRotatedX * horizontalModelScale * nextPerspective;
        const nextProjectedY =
          centerY - nextRotatedY * modelScale * nextPerspective;
        staticPath.moveTo(previousProjectedX, previousProjectedY);
        staticPath.lineTo(nextProjectedX, nextProjectedY);

        if (companionCount > 0) {
          const deltaX = nextProjectedX - previousProjectedX;
          const deltaY = nextProjectedY - previousProjectedY;
          const segmentLength = Math.max(0.001, Math.hypot(deltaX, deltaY));
          const normalX = -deltaY / segmentLength;
          const normalY = deltaX / segmentLength;
          const averagePerspective =
            (previousPerspective + nextPerspective) * 0.5;
          const companionSpacing = clamp(
            fiber.strandSpread * modelScale * averagePerspective * 2.25,
            0.72,
            1.85,
          );
          const previousPosition =
            previousPointIndex / Math.max(1, pointCount - 1);
          const nextPosition = pointIndex / Math.max(1, pointCount - 1);
          const previousDrift =
            Math.sin(Math.PI * previousPosition) *
            Math.sin(TAU * previousPosition + companionPhase) *
            companionDrift;
          const nextDrift =
            Math.sin(Math.PI * nextPosition) *
            Math.sin(TAU * nextPosition + companionPhase) *
            companionDrift;
          const companionPath =
            staticCompanionPaths[staticPathIndex];
          for (
            let companionIndex = 0;
            companionIndex < companionCount;
            companionIndex += 1
          ) {
            const signedLane =
              companionCount === 1
                ? companionKey % 2 === 0
                  ? -1
                  : 1
                : companionIndex === 0
                  ? -1
                  : 1;
            const previousOffset =
              signedLane * companionSpacing + previousDrift;
            const nextOffset = signedLane * companionSpacing + nextDrift;
            companionPath.moveTo(
              previousProjectedX + normalX * previousOffset,
              previousProjectedY + normalY * previousOffset,
            );
            companionPath.lineTo(
              nextProjectedX + normalX * nextOffset,
              nextProjectedY + normalY * nextOffset,
            );
          }
        }
      }

      const nodeKey = mixRenderKey(fiber.bundleId ^ 0x4e4f4445);
      if (
        fiber.family !== "posterior-depth" &&
        staticNodeCount < 120 &&
        nodeKey % 3 === 0
      ) {
        const nodeIndex = Math.floor(
          lerp(
            2,
            Math.max(2, pointCount - 3),
            renderUnit(nodeKey ^ 0x504f494e),
          ),
        );
        if (
          fiber.pointFade[nodeIndex] >= 0.2 &&
          fiber.boundaryScale[nodeIndex] >= 0.18
        ) {
          const nodeOffset = nodeIndex * 3;
          const nodeX = fiber.points[nodeOffset];
          const nodeY = fiber.points[nodeOffset + 1];
          const nodeZ = fiber.points[nodeOffset + 2];
          const rotatedX =
            matrix[0] * nodeX + matrix[1] * nodeY + matrix[2] * nodeZ;
          const rotatedY =
            matrix[3] * nodeX + matrix[4] * nodeY + matrix[5] * nodeZ;
          const rotatedZ =
            matrix[6] * nodeX + matrix[7] * nodeY + matrix[8] * nodeZ;
          const perspective = cameraDistance / (cameraDistance - rotatedZ);
          const depthBand = Math.min(
            DEPTH_LEVELS - 1,
            Math.floor(
              smoothstep(-0.92, 0.92, rotatedZ) * DEPTH_LEVELS,
            ),
          );
          const projectedX =
            centerX + rotatedX * horizontalModelScale * perspective;
          const projectedY =
            centerY - rotatedY * modelScale * perspective;
          const radius = 0.56 + depthBand * 0.04;
          staticNodePaths[depthBand].moveTo(
            projectedX + radius,
            projectedY,
          );
          staticNodePaths[depthBand].arc(
            projectedX,
            projectedY,
            radius,
            0,
            TAU,
          );
          staticNodeCount += 1;
        }
      }
    });

    staticContext.lineCap = "round";
    staticContext.lineJoin = "round";
    staticContext.lineWidth = 1 / pixelRatio;
    for (let depthBand = 0; depthBand < DEPTH_LEVELS; depthBand += 1) {
      const depthStrength = STRUCTURAL_DEPTH_ALPHA[depthBand];
      staticContext.strokeStyle = rgba(
        255,
        174 + depthBand * 3,
        0,
        0.02 + depthStrength * 0.06,
      );
      staticContext.stroke(posteriorDepthPaths[depthBand]);
    }
    const staticAlpha = [0.13, 0.22, 0.34] as const;
    for (
      let opacityBand = 0;
      opacityBand < staticOpacityLevels;
      opacityBand += 1
    ) {
      for (
        let depthBand = 0;
        depthBand < DEPTH_LEVELS;
        depthBand += 1
      ) {
        const depthStrength = STRUCTURAL_DEPTH_ALPHA[depthBand];
        const staticDepthStrength = 0.08 + depthStrength * 0.92;
        for (
          let staticLightBand = 0;
          staticLightBand < staticLightLevels;
          staticLightBand += 1
        ) {
          const staticLightGain = staticLightGains[staticLightBand];
          const staticPathIndex =
            (opacityBand * DEPTH_LEVELS + depthBand) *
              staticLightLevels +
            staticLightBand;
          staticContext.strokeStyle = rgba(
            255,
            174 + depthBand * 3,
            0,
            staticAlpha[opacityBand] *
              staticDepthStrength *
              staticLightGain *
              0.48,
          );
          staticContext.stroke(
            staticCompanionPaths[staticPathIndex],
          );
          staticContext.strokeStyle = rgba(
            255,
            174 + depthBand * 3,
            0,
            staticAlpha[opacityBand] *
              staticDepthStrength *
              staticLightGain,
          );
          staticContext.stroke(staticPaths[staticPathIndex]);
        }
      }
    }
    for (let depthBand = 0; depthBand < DEPTH_LEVELS; depthBand += 1) {
      const depthStrength = STRUCTURAL_DEPTH_ALPHA[depthBand];
      staticContext.fillStyle = rgba(
        255,
        228 + depthBand * 3,
        88 + depthBand * 3,
        0.16 + depthStrength * 0.76,
      );
      staticContext.fill(staticNodePaths[depthBand]);
    }
  };

  const updateStatus = (
    label: string,
    state: "idle" | "tracking" | "pulse",
  ) => {
    if (status) status.textContent = label;
    if (field) field.dataset.brainState = state;
  };

  const resize = () => {
    width = Math.max(1, settings.renderWidth ?? canvas.clientWidth ?? 704);
    height = Math.max(1, settings.renderHeight ?? canvas.clientHeight ?? 580);
    const fallbackRatio = targetPixelRatio();
    let backingWidth = Math.max(1, Math.floor(settings.managedBufferWidth ?? width * fallbackRatio));
    let backingHeight = Math.max(1, Math.floor(settings.managedBufferHeight ?? height * fallbackRatio));
    const budget = Math.max(1, Math.floor(settings.pixelBudget ?? 2000000));
    if (backingWidth * backingHeight > budget) {
      const fit = Math.sqrt(budget / (backingWidth * backingHeight));
      backingWidth = Math.max(1, Math.floor(backingWidth * fit));
      backingHeight = Math.max(1, Math.min(Math.floor(budget / backingWidth), Math.floor(backingHeight * fit)));
    }
    // Managed dimensions are the coordinator's exact integer demand. Deriving
    // both axes from a uniform ratio and flooring again can lose a pixel and
    // leave an otherwise sharp frozen frame permanently "inadequate".
    pixelRatio = Math.min(backingWidth / width, backingHeight / height);
    const resizeSurface = (surface: HTMLCanvasElement) => {
      if (surface.width === backingWidth && surface.height === backingHeight) return;
      // Reset both axes before a portrait/landscape transition: assigning one
      // new axis alongside the old other axis can transiently exceed the cap.
      surface.width = 1; surface.height = 1;
      surface.width = backingWidth; surface.height = backingHeight;
    };
    resizeSurface(canvas);
    const signature = width + ":" + height + ":" + backingWidth + ":" + backingHeight + ":" + pixelRatio;
    if (signature !== staticRenderSignature) {
      staticRenderSignature = signature;
      staticBitmap?.close(); staticBitmap = undefined;
      resizeSurface(staticCanvas);
      drawStaticSubstrate();
      const generation = ++substrateGeneration;
      // Preserve the website's separate immutable substrate without retaining a
      // second working canvas for every live frame. The coordinator pixel cap
      // describes the output; this separate cache has the same maximum size.
      if (!settings.static && typeof createImageBitmap === "function") {
        try {
          void createImageBitmap(staticCanvas).then(bitmap => {
            if (disposed || generation !== substrateGeneration) { bitmap.close(); return; }
            staticBitmap = bitmap;
            staticCanvas.width = 1; staticCanvas.height = 1;
          }).catch(() => { /* Keep the exact 2D substrate fallback. */ });
        } catch { /* A browser without bitmap snapshots keeps the 2D fallback. */ }
      }
    }
    pointer.x = pointer.x || width * 0.5;
    pointer.y = pointer.y || height * 0.47;
    pointer.targetX = pointer.targetX || pointer.x;
    pointer.targetY = pointer.targetY || pointer.y;
  };

  const addPulse = (x: number, y: number) => {
    const candidates: { index: number; distance: number }[] = [];
    fibers.forEach((fiber, fiberIndex) => {
      if (
        !fiber.visible ||
        fiber.escapeStart >= 0 ||
        renderPlans[fiberIndex].liveSuppressed
      ) {
        return;
      }
      let nearestDistance = Number.POSITIVE_INFINITY;
      const pointCount = fiber.projected.length / 3;
      for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 2) {
        const deltaX = fiber.projected[pointIndex * 3] - x;
        const deltaY = fiber.projected[pointIndex * 3 + 1] - y;
        nearestDistance = Math.min(
          nearestDistance,
          deltaX * deltaX + deltaY * deltaY,
        );
      }
      candidates.push({ index: fiberIndex, distance: nearestDistance });
    });
    const rankedCandidates = candidates.sort(
      (left, right) => left.distance - right.distance,
    );
    const primary = rankedCandidates[0];
    if (!primary || !Number.isFinite(primary.distance)) return;
    const primaryFiber = fibers[primary.index];
    const signalCount = Math.round(
      lerp(
        4,
        5,
        responsiveDensityPosition(),
      ),
    );
    const supportIndices = rankedCandidates
      .slice(1)
      .filter(({ index }) => fibers[index].region === primaryFiber.region)
      .sort((left, right) => {
        const leftFamilyGain =
          fibers[left.index].family === primaryFiber.family ? 0.82 : 1;
        const rightFamilyGain =
          fibers[right.index].family === primaryFiber.family ? 0.82 : 1;
        return (
          left.distance * leftFamilyGain -
          right.distance * rightFamilyGain
        );
      })
      .slice(0, signalCount - 1)
      .map(({ index }) => index);
    const fiberIndices = [primary.index, ...supportIndices];
    pulses.push({
      fiberIndices,
      startedAt: currentTime * 1000,
    });
    if (pulses.length > 2) pulses.shift();
    updateStatus("SIGNAL TRACE / PROPAGATING", "pulse");

  };

  const draw = (time: number, elapsed: number) => {
    context.setTransform(
      pixelRatio,
      0,
      0,
      pixelRatio,
      0,
      0,
    );
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
    context.filter = "none";
    context.shadowBlur = 0;
    context.clearRect(0, 0, width, height);

    // Keep inspection responsive at different rendering rates without snapping
    // when the field returns from an inactive tab or leaves the viewport.
    const pointerBlend = 1 - Math.exp(-elapsed / 180);
    const rotationBlend = 1 - Math.exp(-elapsed / 320);
    pointer.x += (pointer.targetX - pointer.x) * pointerBlend;
    pointer.y += (pointer.targetY - pointer.y) * pointerBlend;
    const normalizedPointerX = pointer.x / width - 0.5;
    const normalizedPointerY = pointer.y / height - 0.5;
    const idleYaw = reducedMotion.matches
      ? -0.34
      : -0.34 + Math.sin((time / 56000) * TAU) * 0.038;
    const idlePitch = reducedMotion.matches
      ? -0.055
      : -0.055 + Math.sin((time / 67000) * TAU) * 0.014;
    const pointerDepthActive = pointer.active && !reducedMotion.matches;
    const targetYaw = pointerDepthActive
      ? -0.34 + normalizedPointerX * 0.2
      : idleYaw;
    const targetPitch = pointerDepthActive
      ? -0.055 - normalizedPointerY * 0.11
      : idlePitch;
    if (reducedMotion.matches) {
      yaw = targetYaw;
      pitch = targetPitch;
    } else {
      yaw += (targetYaw - yaw) * rotationBlend;
      pitch += (targetPitch - pitch) * rotationBlend;
    }

    const matrix = buildRotationMatrix(yaw, pitch, -0.018);
    const densityPosition = responsiveDensityPosition();
    const curveDetailPosition = responsiveCurveDetailPosition();
    const signalDensityPosition = responsiveSignalPosition();
    const particleLimit = Math.round(
      lerp(8, PARTICLE_FIBER_COUNT, signalDensityPosition),
    );
    const currentPulseDuration = pulseDuration();
    const activePulses = pulses.filter(
      (pulse) => time - pulse.startedAt < currentPulseDuration,
    );
    pulses.splice(0, pulses.length, ...activePulses);
    const pulseActivityByFiber = new Map<
      number,
      { progress: number; strength: number; primary: boolean }
    >();
    activePulses.forEach((pulse) => {
      const age = time - pulse.startedAt;
      const pulsePosition = age / Math.max(1, currentPulseDuration);
      const fade = 1 - smoothstep(0.72, 1, pulsePosition);
      pulse.fiberIndices.forEach((fiberIndex, rank) => {
        const progress = reducedMotion.matches
          ? 0.5
          : clamp(age / 1900 - rank * 0.045, 0, 1);
        if (!reducedMotion.matches && progress <= 0) return;
        const supportPosition =
          rank / Math.max(1, pulse.fiberIndices.length - 1);
        const strength =
          fade * (rank === 0 ? 1 : lerp(0.64, 0.4, supportPosition));
        const existing = pulseActivityByFiber.get(fiberIndex);
        const primary = rank === 0;
        if (
          !existing ||
          primary ||
          (!existing.primary && strength > existing.strength)
        ) {
          pulseActivityByFiber.set(fiberIndex, {
            progress,
            strength,
            primary,
          });
        }
      });
    });
    const visibleOutboundFiberSet =
      outboundFiberSets[
        Math.round(
          lerp(2, OUTBOUND_FIBER_COUNT, densityPosition),
        )
      ];
    const secondaryNodeVisibility = smoothstep(
      0.08,
      0.42,
      signalDensityPosition,
    );
    const tertiaryNodeVisibility = smoothstep(
      0.22,
      0.55,
      signalDensityPosition,
    );
    const constructionWaveDensityCutoff = lerp(
      0.36,
      0.68,
      signalDensityPosition,
    );
    const layoutPosition = smoothstep(440, 680, width);
    const horizontalModelPadding = clamp(width * 0.02, 8, 16);
    const verticalModelPadding = clamp(height * 0.08, 28, 52);
    const modelScale = Math.min(
      (width - horizontalModelPadding * 2) / 4.66,
      (height - verticalModelPadding * 2) / 2.71,
    );
    const horizontalModelScale = modelScale * HORIZONTAL_MODEL_ASPECT;
    const centerX = width * 0.5 - modelScale * 0.29;
    const centerY = height * 0.5 + modelScale * 0.155;
    const cameraDistance = 7.8;
    const onePhysicalPixel = 1 / pixelRatio;
    const executionWaveCycleTime = time % executionWaveCycle;
    const executionWaveActive =
      !reducedMotion.matches &&
      executionWaveCycleTime < executionWaveTravel;
    const executionWavePosition = lerp(
      -2.5,
      2.55,
      clamp(executionWaveCycleTime / executionWaveTravel, 0, 1),
    );
    const executionWaveRowHeight = lerp(0.19, 0.145, layoutPosition);
    const executionWaveHeadWidth = lerp(0.065, 0.045, layoutPosition);
    const executionWaveEchoSpacing = lerp(0.15, 0.12, layoutPosition);
    const structuralPaths = Array.from(
      {
        length:
          OPACITY_LEVELS *
          DEPTH_LEVELS *
          WIDTH_LEVELS *
          CORTEX_LIGHT_LEVELS,
      },
      () => new Path2D(),
    );
    const mediumPaths = Array.from(
      {
        length:
          OPACITY_LEVELS *
          DEPTH_LEVELS *
          WIDTH_LEVELS *
          CORTEX_LIGHT_LEVELS,
      },
      () => new Path2D(),
    );
    const corticalRidgePaths = Array.from(
      { length: DEPTH_LEVELS },
      () => new Path2D(),
    );
    const majorCorticalRidgePaths = Array.from(
      { length: DEPTH_LEVELS },
      () => new Path2D(),
    );
    const majorCorticalRidgeCompanionPaths = Array.from(
      { length: DEPTH_LEVELS },
      () => new Path2D(),
    );
    const internalArcPaths = Array.from(
      { length: DEPTH_LEVELS },
      () => new Path2D(),
    );
    const cerebellumStructuralPaths = Array.from(
      {
        length:
          OPACITY_LEVELS *
          DEPTH_LEVELS *
          WIDTH_LEVELS *
          CORTEX_LIGHT_LEVELS,
      },
      () => new Path2D(),
    );
    const cerebellumMediumPaths = Array.from(
      {
        length:
          OPACITY_LEVELS *
          DEPTH_LEVELS *
          WIDTH_LEVELS *
          CORTEX_LIGHT_LEVELS,
      },
      () => new Path2D(),
    );
    const cerebellarRidgePaths = Array.from(
      { length: DEPTH_LEVELS },
      () => new Path2D(),
    );
    const cerebellumNodePhaseCount = 4;
    const cerebellumNodeCorePaths = Array.from(
      { length: cerebellumNodePhaseCount * DEPTH_LEVELS },
      () => new Path2D(),
    );
    const cerebellumNodeHaloPaths = Array.from(
      { length: cerebellumNodePhaseCount * DEPTH_LEVELS },
      () => new Path2D(),
    );
    const centralTractHaloPaths = Array.from(
      { length: DEPTH_LEVELS },
      () => new Path2D(),
    );
    const activePaths = Array.from(
      { length: DEPTH_LEVELS * WIDTH_LEVELS * 2 },
      () => new Path2D(),
    );
    const hotActivePaths = Array.from(
      { length: DEPTH_LEVELS },
      () => new Path2D(),
    );
    const signalResponseLevels = 5;
    const signalResponsePaths = Array.from(
      { length: signalResponseLevels * DEPTH_LEVELS },
      () => new Path2D(),
    );
    const executionWaveLevels = 4;
    const executionWavePaths = executionWaveActive
      ? Array.from(
          { length: executionWaveLevels * DEPTH_LEVELS },
          () => new Path2D(),
        )
      : [];
    const constructionWavePaths = reducedMotion.matches
      ? []
      : Array.from(
          { length: constructionWaveLevels * DEPTH_LEVELS },
          () => new Path2D(),
        );
    const outboundPaths = Array.from(
      { length: DEPTH_LEVELS * OUTBOUND_OPACITY_LEVELS },
      () => new Path2D(),
    );
    const outboundNodeCorePaths = Array.from(
      { length: DEPTH_LEVELS * OUTBOUND_NODE_PHASES },
      () => new Path2D(),
    );
    const outboundNodeHaloPaths = Array.from(
      { length: DEPTH_LEVELS * OUTBOUND_NODE_PHASES },
      () => new Path2D(),
    );
    const stemPaths = Array.from(
      { length: DEPTH_LEVELS },
      () => new Path2D(),
    );
    const stemJunctionPaths = Array.from(
      { length: DEPTH_LEVELS },
      () => new Path2D(),
    );
    const cerebellarBridgePaths = Array.from(
      { length: DEPTH_LEVELS },
      () => new Path2D(),
    );
    let cerebellumMinimumX = Number.POSITIVE_INFINITY;
    let cerebellumMinimumY = Number.POSITIVE_INFINITY;
    let cerebellumMaximumX = Number.NEGATIVE_INFINITY;
    let cerebellumMaximumY = Number.NEGATIVE_INFINITY;

    fibers.forEach((fiber, fiberIndex) => {
      if (fiber.family === "cortical-microfold") {
        fiber.visible = false;
        return;
      }
      const renderPlan = renderPlans[fiberIndex];
      const pulseActivity = pulseActivityByFiber.get(fiberIndex);
      const qualityCutoff = responsiveLiveQualityCutoff(
        fiber,
        densityPosition,
      );
      const denselyLayeredCerebellarFiber =
        fiber.family === "cerebellar-folia" ||
        fiber.family === "cerebellar-ridge";
      const keepCerebellarStructure =
        fiber.region === "cerebellum" &&
        (denselyLayeredCerebellarFiber
          ? fiber.bundleId % 3 !== 1
          : fiber.bundleId % 3 === 0);
      fiber.visible =
        (fiber.escapeStart >= 0 && fiber.bundleId % 2 === 0) ||
        visibleOutboundFiberSet.has(fiber) ||
        keepCerebellarStructure ||
        pulseActivity !== undefined ||
        fiber.corticalLandmark ||
        fiber.active ||
        fiber.bundleTier === "active" ||
        fiber.qualityRank <= qualityCutoff;
      if (!fiber.visible) return;

      const useBundlePlan = fiber.region === "cerebrum";
      if (
        useBundlePlan &&
        renderPlan.liveSuppressed &&
        fiber.escapeStart < 0
      ) {
        fiber.visible = false;
        return;
      }
      const pointCount = fiber.points.length / 3;
      const pointStep =
        fiber.escapeStart >= 0
          ? 1
          : fiber.family === "cortical-fold"
            ? curveDetailPosition >= 0.18
              ? 1
              : 2
          : fiber.bundleTier === "active"
            ? fiber.hot && curveDetailPosition >= 0.54
              ? 1
              : curveDetailPosition >= 0.18
                ? 2
                : 3
            : fiber.bundleTier === "dim" &&
              fiber.region === "cerebrum"
              ? 3
              : fiber.bundleTier === "medium" &&
                  fiber.region === "cerebrum"
                ? curveDetailPosition >= 0.995
                  ? 2
                  : 3
              : 2;
      const projectionStep =
        fiber.particle || pulseActivity !== undefined ? 1 : pointStep;
      for (
        let pointIndex = 0;
        pointIndex < pointCount;
        pointIndex = Math.min(pointCount - 1, pointIndex + projectionStep)
      ) {
        const offset = pointIndex * 3;
        const pointX = fiber.points[offset];
        const pointY = fiber.points[offset + 1];
        const pointZ = fiber.points[offset + 2];
        const rotatedX =
          matrix[0] * pointX + matrix[1] * pointY + matrix[2] * pointZ;
        const rotatedY =
          matrix[3] * pointX + matrix[4] * pointY + matrix[5] * pointZ;
        const rotatedZ =
          matrix[6] * pointX + matrix[7] * pointY + matrix[8] * pointZ;
        const perspective =
          cameraDistance / (cameraDistance - rotatedZ);
        const projectedX =
          centerX + rotatedX * horizontalModelScale * perspective;
        const projectedY =
          centerY - rotatedY * modelScale * perspective;
        fiber.projected[offset] = projectedX;
        fiber.projected[offset + 1] = projectedY;
        fiber.projected[offset + 2] = rotatedZ;
        if (fiber.region === "cerebellum") {
          cerebellumMinimumX = Math.min(cerebellumMinimumX, projectedX);
          cerebellumMinimumY = Math.min(cerebellumMinimumY, projectedY);
          cerebellumMaximumX = Math.max(cerebellumMaximumX, projectedX);
          cerebellumMaximumY = Math.max(cerebellumMaximumY, projectedY);
        }
        if (pointIndex === pointCount - 1) break;
      }

      if (
        fiber.region === "cerebellum" &&
        fiber.family === "cerebellar-folia"
      ) {
        const nodeKey = mixRenderKey(fiber.bundleId ^ 0x43424e44);
        if (nodeKey % 8 === 0) {
          const requestedNodeIndex = Math.floor(
            lerp(
              0.14,
              0.86,
              renderUnit(nodeKey ^ 0x504f494e),
            ) *
              (pointCount - 1),
          );
          const nodeIndex = Math.min(
            pointCount - 1,
            Math.floor(requestedNodeIndex / projectionStep) * projectionStep,
          );
          if (
            fiber.pointFade[nodeIndex] >= 0.2 &&
            fiber.boundaryScale[nodeIndex] >= 0.18
          ) {
            const nodeOffset = nodeIndex * 3;
            const nodeDepth = fiber.projected[nodeOffset + 2];
            const nodeDepthBand = Math.min(
              DEPTH_LEVELS - 1,
              Math.floor(
                smoothstep(-0.92, 0.92, nodeDepth) * DEPTH_LEVELS,
              ),
            );
            const phaseBand = nodeKey % cerebellumNodePhaseCount;
            const nodePathIndex =
              phaseBand * DEPTH_LEVELS + nodeDepthBand;
            const nodeX = fiber.projected[nodeOffset];
            const nodeY = fiber.projected[nodeOffset + 1];
            const coreRadius = 0.9 + nodeDepthBand * 0.07;
            const haloRadius = 2 + nodeDepthBand * 0.12;
            cerebellumNodeCorePaths[nodePathIndex].moveTo(
              nodeX + coreRadius,
              nodeY,
            );
            cerebellumNodeCorePaths[nodePathIndex].arc(
              nodeX,
              nodeY,
              coreRadius,
              0,
              TAU,
            );
            cerebellumNodeHaloPaths[nodePathIndex].moveTo(
              nodeX + haloRadius,
              nodeY,
            );
            cerebellumNodeHaloPaths[nodePathIndex].arc(
              nodeX,
              nodeY,
              haloRadius,
              0,
              TAU,
            );
          }
        }
      }

      const ambientParticleRank = particleFiberRank.get(fiber);
      const ambientActivity =
        ambientParticleRank !== undefined &&
        ambientParticleRank < particleLimit &&
        fiber.particle
          ? {
              progress: reducedMotion.matches
                ? fiber.phase
                : (fiber.phase + time * fiber.speed * idleSignalSpeed) % 1,
              strength: fiber.hot ? 0.46 : 0.36,
              primary: true,
            }
          : undefined;
      const signalActivity = pulseActivity ?? ambientActivity;
      const constructionCycleTime =
        (time +
          constructionWavePhase[fiberIndex] * constructionWaveCycle) %
        constructionWaveCycle;
      const constructionWaveActiveForFiber =
        !reducedMotion.matches &&
        constructionWaveEligible[fiberIndex] === 1 &&
        constructionWaveRank[fiberIndex] <= constructionWaveDensityCutoff &&
        constructionCycleTime < constructionWaveTravel;
      const constructionWaveProgress =
        constructionCycleTime / constructionWaveTravel;
      for (
        let pointIndex = pointStep;
        pointIndex < pointCount;
        pointIndex += pointStep
      ) {
        const previousPointIndex = pointIndex - pointStep;
        const previousOffset = previousPointIndex * 3;
        const offset = pointIndex * 3;
        const depth =
          (fiber.projected[previousOffset + 2] +
            fiber.projected[offset + 2]) *
          0.5;
        const front = smoothstep(-0.92, 0.92, depth);
        const depthBand = Math.min(
          DEPTH_LEVELS - 1,
          Math.floor(front * DEPTH_LEVELS),
        );
        const baseFade = Math.min(
          endpointFade(fiber, previousPointIndex, pointCount),
          endpointFade(fiber, pointIndex, pointCount),
        );
        if (baseFade < 0.04) continue;
        const isEscapeSegment =
          fiber.escapeStart >= 0 && pointIndex > fiber.escapeStart;
        if (isEscapeSegment && !visibleOutboundFiberSet.has(fiber)) {
          continue;
        }
        if (
          useBundlePlan &&
          renderPlan.liveSuppressed &&
          !isEscapeSegment
        ) {
          continue;
        }
        const rearBundleKey = fiber.bundleId % 10;
        const cullRearBundle =
          (fiber.bundleTier === "dim" &&
            ((depthBand === 0 && rearBundleKey < 3) ||
              (depthBand === 1 && rearBundleKey < 1))) ||
          (fiber.bundleTier === "medium" &&
            depthBand === 0 &&
            rearBundleKey < 1);
        if (
          cullRearBundle &&
          !fiber.corticalLandmark &&
          !isEscapeSegment
        ) {
          continue;
        }
        const previousNormalStart = Math.max(
          0,
          pointIndex - pointStep * 2,
        ) * 3;
        const previousNormalEnd = offset;
        const previousDeltaX =
          fiber.projected[previousNormalEnd] -
          fiber.projected[previousNormalStart];
        const previousDeltaY =
          fiber.projected[previousNormalEnd + 1] -
          fiber.projected[previousNormalStart + 1];
        const previousLength = Math.max(
          0.001,
          Math.hypot(previousDeltaX, previousDeltaY),
        );
        const nextNormalEnd = Math.min(
          pointCount - 1,
          pointIndex + pointStep,
        ) * 3;
        const nextDeltaX =
          fiber.projected[nextNormalEnd] -
          fiber.projected[previousOffset];
        const nextDeltaY =
          fiber.projected[nextNormalEnd + 1] -
          fiber.projected[previousOffset + 1];
        const nextLength = Math.max(
          0.001,
          Math.hypot(nextDeltaX, nextDeltaY),
        );
        const previousNormalX = -previousDeltaY / previousLength;
        const previousNormalY = previousDeltaX / previousLength;
        const nextNormalX = -nextDeltaY / nextLength;
        const nextNormalY = nextDeltaX / nextLength;
        const previousPerspective =
          cameraDistance /
          (cameraDistance - fiber.projected[previousOffset + 2]);
        const nextPerspective =
          cameraDistance /
          (cameraDistance - fiber.projected[offset + 2]);
        const previousSpread =
          fiber.strandSpread *
          modelScale *
          previousPerspective *
          fiber.boundaryScale[previousPointIndex];
        const nextSpread =
          fiber.strandSpread *
          modelScale *
          nextPerspective *
          fiber.boundaryScale[pointIndex];
        const previousPosition =
          previousPointIndex / Math.max(1, pointCount - 1);
        const nextPosition =
          pointIndex / Math.max(1, pointCount - 1);
        const segmentPosition = (previousPosition + nextPosition) * 0.5;
        const modelX =
          (fiber.points[previousOffset] + fiber.points[offset]) * 0.5;
        const modelY =
          (fiber.points[previousOffset + 1] + fiber.points[offset + 1]) *
          0.5;
        let executionWaveBand = -1;
        if (executionWaveActive && executionWaveEligible[fiberIndex]) {
          const row = Math.floor(
            (modelY + 1.25) / executionWaveRowHeight,
          );
          const patternIndex =
            ((row % executionWaveStepPattern.length) +
              executionWaveStepPattern.length) %
            executionWaveStepPattern.length;
          const steppedWaveX =
            executionWavePosition +
            executionWaveStepPattern[patternIndex] +
            executionWaveBias[fiberIndex];
          const distanceFromHead = steppedWaveX - modelX;
          for (
            let echoIndex = 0;
            echoIndex < executionWaveLevels;
            echoIndex += 1
          ) {
            const echoDistance = echoIndex * executionWaveEchoSpacing;
            const bandWidth = executionWaveHeadWidth * (1 - echoIndex * 0.08);
            if (
              Math.abs(distanceFromHead - echoDistance) <= bandWidth
            ) {
              executionWaveBand = executionWaveLevels - 1 - echoIndex;
              break;
            }
          }
        }
        let constructionWaveBand = -1;
        if (constructionWaveActiveForFiber) {
          const directedSegmentPosition =
            constructionWaveDirection[fiberIndex] > 0
              ? segmentPosition
              : 1 - segmentPosition;
          const distanceFromConstructionHead =
            constructionWaveProgress - directedSegmentPosition;
          for (
            let echoIndex = 0;
            echoIndex < constructionWaveLevels;
            echoIndex += 1
          ) {
            const echoDistance = echoIndex * constructionWaveEchoSpacing;
            const bandWidth =
              constructionWaveHeadWidth * (1 - echoIndex * 0.08);
            if (
              Math.abs(distanceFromConstructionHead - echoDistance) <=
              bandWidth
            ) {
              constructionWaveBand =
                constructionWaveLevels - 1 - echoIndex;
              break;
            }
          }
        }
        const boundaryStrength =
          (fiber.boundaryScale[previousPointIndex] +
            fiber.boundaryScale[pointIndex]) *
          0.5;
        const cortexLightBand =
          fiber.region === "cerebellum"
            ? modelY < CEREBELLUM.center.y - 0.02
              ? 2
              : 0
            : useBundlePlan && fiber.bundleTier !== "active"
              ? fiber.family === "cortical-fold"
                ? 3
                : cerebrumLightBand(modelX, modelY, boundaryStrength)
              : 0;
        const upperCortexGap =
          useBundlePlan &&
          fiber.family !== "cortical-fold" &&
          fiber.bundleTier !== "active" &&
          boundaryStrength > 0.55 &&
          insideUpperCortexGap(modelX, modelY);
        if (upperCortexGap) continue;
        const strandCount = isEscapeSegment ? 1 : fiber.strandCount;
        const centerStrand = Math.floor(strandCount / 2);
        for (
          let strandIndex = 0;
          strandIndex < strandCount;
          strandIndex += 1
        ) {
          const useStrandPlan = useBundlePlan && !isEscapeSegment;
          if (useStrandPlan && !renderPlan.strandVisible[strandIndex]) {
            continue;
          }
          const redundantCerebrumStrand =
            !useStrandPlan &&
            fiber.region === "cerebrum" &&
            ((fiber.bundleTier === "dim" && strandIndex % 2 === 1) ||
              (fiber.bundleTier === "medium" &&
                (strandIndex + fiber.bundleId) % 5 === 0));
          const redundantHighDprCerebellarStrand =
            pixelRatio > 1.5 &&
            fiber.region === "cerebellum" &&
            fiber.bundleTier !== "active" &&
            strandIndex % 2 === 1;
          if (
            redundantCerebrumStrand ||
            redundantHighDprCerebellarStrand
          ) {
            continue;
          }
          let fade = baseFade;
          if (useStrandPlan) {
            const start = renderPlan.strandStart[strandIndex];
            const end = renderPlan.strandEnd[strandIndex];
            const windowFade = Math.min(
              smoothstep(start, Math.min(end, start + 0.04), segmentPosition),
              1 -
                smoothstep(
                  Math.max(start, end - 0.05),
                  end,
                  segmentPosition,
                ),
            );
            fade *= windowFade;
          }
          if (fade < 0.04) continue;
          const baseStrandOffset = strandIndex - centerStrand;
          const centerDistance = Math.abs(baseStrandOffset);
          const compactStrandRadius =
            densityPosition < 0.82
              ? 0
              : densityPosition < 0.92
                ? 1
                : Number.POSITIVE_INFINITY;
          if (
            useStrandPlan &&
            fiber.bundleTier !== "active" &&
            centerDistance > compactStrandRadius
          ) {
            continue;
          }
          if (
            useStrandPlan &&
            fiber.bundleTier === "active" &&
            densityPosition < 0.2 &&
            centerDistance > 1
          ) {
            continue;
          }
          const previousBaseStrandOffset = useStrandPlan
            ? renderPlan.strandOffset[strandIndex] +
              renderPlan.strandDrift[strandIndex] *
                (previousPosition * 2 - 1)
            : baseStrandOffset;
          const nextBaseStrandOffset = useStrandPlan
            ? renderPlan.strandOffset[strandIndex] +
              renderPlan.strandDrift[strandIndex] * (nextPosition * 2 - 1)
            : baseStrandOffset;
          const previousBend =
            fiber.bundleTier === "active"
              ? renderPlan.strandBend[strandIndex] *
                Math.sin(Math.PI * previousPosition) *
                Math.sin(
                  Math.PI * previousPosition +
                    renderPlan.strandBendPhase[strandIndex],
                )
              : 0;
          const nextBend =
            fiber.bundleTier === "active"
              ? renderPlan.strandBend[strandIndex] *
                Math.sin(Math.PI * nextPosition) *
                Math.sin(
                  Math.PI * nextPosition +
                    renderPlan.strandBendPhase[strandIndex],
                )
              : 0;
          const previousStrandOffset =
            previousBaseStrandOffset + previousBend;
          const nextStrandOffset = nextBaseStrandOffset + nextBend;
          const fadeLoss =
            fade < 0.18 ? 3 : fade < 0.42 ? 2 : fade < 0.72 ? 1 : 0;
          let strandOpacityBand: number;
          if (fiber.bundleTier === "active") {
            strandOpacityBand =
              centerDistance === 0 ? 3 : centerDistance <= 1 ? 2 : 1;
          } else if (fiber.bundleTier === "medium") {
            strandOpacityBand =
              centerDistance === 0 ? 2 : centerDistance <= 2 ? 1 : 0;
          } else {
            strandOpacityBand = fiber.opacityBand;
          }
          const opacityBand = Math.max(
            0,
            strandOpacityBand - fadeLoss,
          ) as OpacityBand;
          const widthBand: WidthBand =
            fiber.bundleTier !== "dim" && centerDistance === 0 ? 1 : 0;
          const structuralIndex =
            (((opacityBand * DEPTH_LEVELS + depthBand) * WIDTH_LEVELS +
              widthBand) *
              CORTEX_LIGHT_LEVELS +
              cortexLightBand);
          const activeBundleSpreadFloor = onePhysicalPixel * 1.55;
          const renderPreviousSpread =
            fiber.region === "cerebrum" && fiber.bundleTier === "active"
              ? Math.max(previousSpread, activeBundleSpreadFloor)
              : previousSpread;
          const renderNextSpread =
            fiber.region === "cerebrum" && fiber.bundleTier === "active"
              ? Math.max(nextSpread, activeBundleSpreadFloor)
              : nextSpread;
          const previousOffsetPixels =
            previousStrandOffset * renderPreviousSpread;
          const nextOffsetPixels = nextStrandOffset * renderNextSpread;
          const segmentStartX =
            fiber.projected[previousOffset] +
            previousNormalX * previousOffsetPixels;
          const segmentStartY =
            fiber.projected[previousOffset + 1] +
            previousNormalY * previousOffsetPixels;
          const segmentEndX =
            fiber.projected[offset] + nextNormalX * nextOffsetPixels;
          const segmentEndY =
            fiber.projected[offset + 1] + nextNormalY * nextOffsetPixels;
          const horizontalCentralSegment =
            fiber.region === "cerebrum" &&
            Math.abs(fiber.points[offset] - fiber.points[previousOffset]) >
              Math.abs(
                fiber.points[offset + 1] -
                  fiber.points[previousOffset + 1],
              ) *
                1.35;
          const centralBreakCenter = lerp(
            -0.5,
            0.58,
            renderUnit(fiber.bundleId ^ 0x43474150),
          );
          const centralBreakWidth = lerp(
            0.085,
            0.16,
            renderUnit(fiber.bundleId ^ 0x47574944),
          );
          const interruptedCentralSegment =
            !fiber.corticalLandmark &&
            fiber.bundleTier !== "active" &&
            horizontalCentralSegment &&
            modelY > -0.38 &&
            modelY < 0.56 &&
            Math.abs(modelX - centralBreakCenter) < centralBreakWidth;
          if (!isEscapeSegment) {
            const structuralPath = fiber.region === "cerebellum"
              ? fiber.bundleTier === "medium"
                ? cerebellumMediumPaths[structuralIndex]
                : cerebellumStructuralPaths[structuralIndex]
              : fiber.bundleTier === "medium"
                ? mediumPaths[structuralIndex]
                : structuralPaths[structuralIndex];
            if (!interruptedCentralSegment) {
              structuralPath.moveTo(segmentStartX, segmentStartY);
              structuralPath.lineTo(segmentEndX, segmentEndY);
            }
            const corticalRidgeKey = mixRenderKey(
              fiber.bundleId ^ 0x46524944,
            );
            const corticalRidgeFiber =
              modelY > -0.55 &&
              ((modelX < -0.55 &&
                ((fiber.family === "cortical-fold" &&
                  centerDistance === 0 &&
                  corticalRidgeKey % 7 === 0) ||
                  (fiber.family === "frontal-surface" &&
                    centerDistance <= 1 &&
                    corticalRidgeKey % 24 === 0))) ||
                (modelX >= -0.55 &&
                  fiber.family === "cortical-fold" &&
                  centerDistance === 0 &&
                  corticalRidgeKey % 9 === 0) ||
                (modelX > 0.45 &&
                  modelY > 0.05 &&
                  fiber.family === "posterior-surface" &&
                  centerDistance === 0 &&
                  corticalRidgeKey % 48 === 0));
            const majorCorticalRidgeFiber =
              fiber.corticalLandmark && centerDistance === 0;
            if (corticalRidgeFiber || majorCorticalRidgeFiber) {
              corticalRidgePaths[depthBand].moveTo(
                segmentStartX,
                segmentStartY,
              );
              corticalRidgePaths[depthBand].lineTo(
                segmentEndX,
                segmentEndY,
              );
            }
            if (majorCorticalRidgeFiber) {
              majorCorticalRidgePaths[depthBand].moveTo(
                segmentStartX,
                segmentStartY,
              );
              majorCorticalRidgePaths[depthBand].lineTo(
                segmentEndX,
                segmentEndY,
              );
              const ridgeNestOffset = clamp(
                modelScale * 0.008,
                0.9,
                1.5,
              );
              for (const direction of [-1, 1]) {
                majorCorticalRidgeCompanionPaths[depthBand].moveTo(
                  segmentStartX +
                    previousNormalX * ridgeNestOffset * direction,
                  segmentStartY +
                    previousNormalY * ridgeNestOffset * direction,
                );
                majorCorticalRidgeCompanionPaths[depthBand].lineTo(
                  segmentEndX + nextNormalX * ridgeNestOffset * direction,
                  segmentEndY + nextNormalY * ridgeNestOffset * direction,
                );
              }
            }
            const internalArcKey = mixRenderKey(
              fiber.bundleId ^ 0x494e5441,
            );
            if (
              fiber.family === "central-tract" &&
              centerDistance <= 0.5 &&
              internalArcKey % 8 === 0 &&
              !interruptedCentralSegment &&
              modelX > -0.9 &&
              modelX < 1.02 &&
              modelY > -0.48 &&
              modelY < 0.68
            ) {
              internalArcPaths[depthBand].moveTo(
                segmentStartX,
                segmentStartY,
              );
              internalArcPaths[depthBand].lineTo(
                segmentEndX,
                segmentEndY,
              );
            }
            if (
              fiber.family === "cerebellar-ridge" &&
              centerDistance === 0
            ) {
              cerebellarRidgePaths[depthBand].moveTo(
                segmentStartX,
                segmentStartY,
              );
              cerebellarRidgePaths[depthBand].lineTo(
                segmentEndX,
                segmentEndY,
              );
            }
            if (
              fiber.family === "central-tract" &&
              !interruptedCentralSegment
            ) {
              centralTractHaloPaths[depthBand].moveTo(
                segmentStartX,
                segmentStartY,
              );
              centralTractHaloPaths[depthBand].lineTo(
                segmentEndX,
                segmentEndY,
              );
            }

            if (signalActivity) {
              const signalDistance =
                signalActivity.progress - segmentPosition;
              const signalEnvelope =
                signalDistance < 0
                  ? smoothstep(-0.03, 0, signalDistance)
                  : 1 - smoothstep(0.035, 0.16, signalDistance);
              const responseStrength =
                signalEnvelope * signalActivity.strength;
              const responseLane =
                signalActivity.primary || centerDistance <= 1;
              if (responseLane && responseStrength >= 0.025) {
                const responseBand = Math.min(
                  signalResponseLevels - 1,
                  Math.floor(responseStrength * signalResponseLevels),
                );
                const responsePath =
                  signalResponsePaths[
                    responseBand * DEPTH_LEVELS + depthBand
                  ];
                responsePath.moveTo(segmentStartX, segmentStartY);
                responsePath.lineTo(segmentEndX, segmentEndY);
              }
            }

            if (
              executionWaveBand >= 0 &&
              strandIndex === centerStrand
            ) {
              const wavePath =
                executionWavePaths[
                  executionWaveBand * DEPTH_LEVELS + depthBand
                ];
              wavePath.moveTo(segmentStartX, segmentStartY);
              wavePath.lineTo(segmentEndX, segmentEndY);
            }
            if (
              constructionWaveBand >= 0 &&
              strandIndex === centerStrand
            ) {
              const constructionPath =
                constructionWavePaths[
                  constructionWaveBand * DEPTH_LEVELS + depthBand
                ];
              constructionPath.moveTo(segmentStartX, segmentStartY);
              constructionPath.lineTo(segmentEndX, segmentEndY);
            }
          } else {
            const tailPosition =
              (pointIndex - fiber.escapeStart) /
              Math.max(1, pointCount - 1 - fiber.escapeStart);
            const individualOpacity = lerp(
              0.62,
              1,
              renderUnit(fiber.bundleId ^ 0x5441494c),
            );
            const tailVisibility =
              baseFade *
              individualOpacity *
              (1 - smoothstep(0.68, 1, tailPosition) * 0.22);
            const tailOpacityBand = Math.min(
              OUTBOUND_OPACITY_LEVELS - 1,
              Math.floor(tailVisibility * OUTBOUND_OPACITY_LEVELS),
            );
            const outboundPath =
              outboundPaths[
                tailOpacityBand * DEPTH_LEVELS + depthBand
              ];
            outboundPath.moveTo(
              fiber.projected[previousOffset],
              fiber.projected[previousOffset + 1],
            );
            outboundPath.lineTo(
              fiber.projected[offset],
              fiber.projected[offset + 1],
            );
            const outboundNodeKey = mixRenderKey(
              fiber.bundleId ^ 0x544e4f44,
            );
            if (outboundNodeKey % 3 !== 0) {
              const tailPointCount = pointCount - fiber.escapeStart - 1;
              const nodePointIndex =
                fiber.escapeStart +
                1 +
                Math.floor(
                  Math.max(0, tailPointCount - 1) *
                    lerp(
                      0.32,
                      0.84,
                      renderUnit(outboundNodeKey ^ 0x504f494e),
                    ),
                );
              if (
                previousPointIndex < nodePointIndex &&
                pointIndex >= nodePointIndex
              ) {
                const nodeOffset = nodePointIndex * 3;
                const nodeX = fiber.projected[nodeOffset];
                const nodeY = fiber.projected[nodeOffset + 1];
                const phaseBand =
                  (outboundNodeKey >>> 5) % OUTBOUND_NODE_PHASES;
                const nodePathIndex =
                  phaseBand * DEPTH_LEVELS + depthBand;
                const coreRadius = 1.08 + depthBand * 0.055;
                const haloRadius = 2.7 + depthBand * 0.11;
                outboundNodeHaloPaths[nodePathIndex].moveTo(
                  nodeX + haloRadius,
                  nodeY,
                );
                outboundNodeHaloPaths[nodePathIndex].arc(
                  nodeX,
                  nodeY,
                  haloRadius,
                  0,
                  TAU,
                );
                outboundNodeCorePaths[nodePathIndex].moveTo(
                  nodeX + coreRadius,
                  nodeY,
                );
                outboundNodeCorePaths[nodePathIndex].arc(
                  nodeX,
                  nodeY,
                  coreRadius,
                  0,
                  TAU,
                );
              }
            }
          }

          const stemEmphasis =
            fiber.family !== "cerebellar-bridge" &&
            fiber.region === "stem" &&
            pointCount >= 15 &&
            Math.abs(
              (fiber.points[0] - BRAINSTEM.top.x) /
                BRAINSTEM.topRadius.x,
            ) < 0.62 &&
            Math.abs(
              (fiber.points[2] - BRAINSTEM.centerZ) /
                BRAINSTEM.topRadius.z,
            ) < 0.65;
          if (
            stemEmphasis &&
            strandIndex === centerStrand &&
            !isEscapeSegment
          ) {
            stemPaths[depthBand].moveTo(
              fiber.projected[previousOffset],
              fiber.projected[previousOffset + 1],
            );
            stemPaths[depthBand].lineTo(
              fiber.projected[offset],
              fiber.projected[offset + 1],
            );
            if (modelY > -0.66) {
              stemJunctionPaths[depthBand].moveTo(
                fiber.projected[previousOffset],
                fiber.projected[previousOffset + 1],
              );
              stemJunctionPaths[depthBand].lineTo(
                fiber.projected[offset],
                fiber.projected[offset + 1],
              );
            }
          }
          if (
            fiber.family === "cerebellar-bridge" &&
            centerDistance === 0 &&
            !isEscapeSegment
          ) {
            cerebellarBridgePaths[depthBand].moveTo(
              fiber.projected[previousOffset],
              fiber.projected[previousOffset + 1],
            );
            cerebellarBridgePaths[depthBand].lineTo(
              fiber.projected[offset],
              fiber.projected[offset + 1],
            );
          }

          const highlightedActiveStrand =
            fiber.family === "cortical-fold"
              ? centerDistance === 0
              : centerDistance <= 1;
          if (
            fiber.particle &&
            fiber.region !== "cerebellum" &&
            highlightedActiveStrand &&
            fade >= 0.1
          ) {
            const fadeBand = fade >= 0.56 ? 1 : 0;
            const activeIndex =
              ((fadeBand * DEPTH_LEVELS + depthBand) * WIDTH_LEVELS +
                widthBand);
            const activePath = activePaths[activeIndex];
            activePath.moveTo(segmentStartX, segmentStartY);
            activePath.lineTo(segmentEndX, segmentEndY);
          }
          if (
            fiber.hot &&
            centerDistance === 0 &&
            modelY <=
              (fiber.family === "frontal-surface" ||
              fiber.family === "cortical-fold"
                ? 1.12
                : 0.68) &&
            fade >= 0.14
          ) {
            hotActivePaths[depthBand].moveTo(segmentStartX, segmentStartY);
            hotActivePaths[depthBand].lineTo(segmentEndX, segmentEndY);
          }
        }
      }
    });

    context.lineCap = "round";
    context.lineJoin = "round";
    for (let depthBand = 0; depthBand < DEPTH_LEVELS; depthBand += 1) {
      const depthStrength =
        0.12 + STRUCTURAL_DEPTH_ALPHA[depthBand] * 0.88;
      context.strokeStyle = rgba(
        255,
        174 + depthBand * 3,
        0,
        0.006 + depthStrength * 0.022,
      );
      context.lineWidth = 1.8 * onePhysicalPixel;
      context.stroke(centralTractHaloPaths[depthBand]);
    }

    const structuralAlpha = [0.14, 0.188, 0.257, 0.335];
    const drawStructuralBatches = (
      structuralBatch: Path2D[],
      mediumBatch: Path2D[],
      alphaGain = 1,
      lightBandGains: readonly number[] = [1, 0.8, 1.42, 1.22],
      greenBase = 166,
      blueBase = 0,
      mediumGain = mediumFiberGain,
      mediumGreenBase = greenBase,
      mediumBlueBase = blueBase,
    ) => {
      context.lineCap = "butt";
      context.lineJoin = "miter";
      for (
        let opacityBand = 0;
        opacityBand < OPACITY_LEVELS;
        opacityBand += 1
      ) {
        for (
          let depthBand = 0;
          depthBand < DEPTH_LEVELS;
          depthBand += 1
        ) {
          const depthStrength = STRUCTURAL_DEPTH_ALPHA[depthBand];
          for (
            let widthBand = 0;
            widthBand < WIDTH_LEVELS;
            widthBand += 1
          ) {
            for (
              let cortexLightBand = 0;
              cortexLightBand < CORTEX_LIGHT_LEVELS;
              cortexLightBand += 1
            ) {
              const index =
                (((opacityBand * DEPTH_LEVELS + depthBand) *
                  WIDTH_LEVELS +
                  widthBand) *
                  CORTEX_LIGHT_LEVELS +
                  cortexLightBand);
              const alpha =
                structuralAlpha[opacityBand] *
                depthStrength *
                lightBandGains[cortexLightBand] *
                alphaGain;
              context.lineWidth =
                (widthBand === 0 ? 2.35 : 2.7) * onePhysicalPixel;
              context.strokeStyle = rgba(
                255,
                172 + depthBand * 3,
                0,
                alpha * mediumGain * 0.13,
              );
              context.stroke(mediumBatch[index]);
              context.lineWidth =
                (widthBand === 0 ? 1 : 1.2) * onePhysicalPixel;
              context.strokeStyle = rgba(
                255,
                greenBase + depthBand * 3,
                blueBase + depthBand * 2,
                alpha,
              );
              context.stroke(structuralBatch[index]);
              context.strokeStyle = rgba(
                255,
                mediumGreenBase + depthBand * 3,
                mediumBlueBase + depthBand * 2,
                alpha * mediumGain,
              );
              context.stroke(mediumBatch[index]);
            }
          }
        }
      }
    };

    drawStructuralBatches(structuralPaths, mediumPaths);

    const internalVoidModel = { x: 0.12, y: 0.28, z: -0.04 };
    const internalVoidRotatedX =
      matrix[0] * internalVoidModel.x +
      matrix[1] * internalVoidModel.y +
      matrix[2] * internalVoidModel.z;
    const internalVoidRotatedY =
      matrix[3] * internalVoidModel.x +
      matrix[4] * internalVoidModel.y +
      matrix[5] * internalVoidModel.z;
    const internalVoidRotatedZ =
      matrix[6] * internalVoidModel.x +
      matrix[7] * internalVoidModel.y +
      matrix[8] * internalVoidModel.z;
    const internalVoidPerspective =
      cameraDistance / (cameraDistance - internalVoidRotatedZ);
    const internalVoidCenterX =
      centerX +
      internalVoidRotatedX * horizontalModelScale * internalVoidPerspective;
    const internalVoidCenterY =
      centerY -
      internalVoidRotatedY * modelScale * internalVoidPerspective;
    const internalVoidField = context.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      1,
    );
    internalVoidField.addColorStop(0, "rgba(0, 0, 0, 0.86)");
    internalVoidField.addColorStop(0.52, "rgba(0, 0, 0, 0.7)");
    internalVoidField.addColorStop(0.82, "rgba(0, 0, 0, 0.34)");
    internalVoidField.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.save();
    context.translate(internalVoidCenterX, internalVoidCenterY);
    context.rotate(-0.035);
    context.scale(
      horizontalModelScale * 1.02,
      modelScale * 0.5,
    );
    context.fillStyle = internalVoidField;
    context.beginPath();
    context.arc(0, 0, 1, 0, TAU);
    context.fill();
    context.restore();

    context.lineCap = "round";
    context.lineJoin = "round";
    for (let depthBand = 0; depthBand < DEPTH_LEVELS; depthBand += 1) {
      const depthStrength = STRUCTURAL_DEPTH_ALPHA[depthBand];
      context.strokeStyle = rgba(
        255,
        188 + depthBand * 2,
        24 + depthBand * 2,
        0.04 + depthStrength * 0.2,
      );
      context.lineWidth = onePhysicalPixel;
      context.stroke(internalArcPaths[depthBand]);
    }

    for (let depthBand = 0; depthBand < DEPTH_LEVELS; depthBand += 1) {
      const depthStrength = STRUCTURAL_DEPTH_ALPHA[depthBand];
      context.strokeStyle = rgba(
        255,
        208 + depthBand * 2,
        52 + depthBand * 2,
        0.05 + depthStrength * 0.16,
      );
      context.lineWidth = onePhysicalPixel;
      context.stroke(majorCorticalRidgeCompanionPaths[depthBand]);
    }

    for (let depthBand = 0; depthBand < DEPTH_LEVELS; depthBand += 1) {
      const depthStrength =
        0.14 + STRUCTURAL_DEPTH_ALPHA[depthBand] * 0.86;
      context.strokeStyle = rgba(
        255,
        230 + depthBand * 3,
        86 + depthBand * 3,
        0.15 + depthStrength * 0.48,
      );
      context.lineWidth = onePhysicalPixel;
      context.stroke(corticalRidgePaths[depthBand]);
    }

    for (let depthBand = 0; depthBand < DEPTH_LEVELS; depthBand += 1) {
      const depthStrength =
        0.14 + STRUCTURAL_DEPTH_ALPHA[depthBand] * 0.86;
      context.strokeStyle = rgba(
        255,
        188 + depthBand * 2,
        20 + depthBand * 2,
        0.04 + depthStrength * 0.09,
      );
      context.lineWidth = 1.7 * onePhysicalPixel;
      context.stroke(majorCorticalRidgePaths[depthBand]);
      context.strokeStyle = rgba(
        255,
        238 + depthBand * 2,
        104 + depthBand * 3,
        0.25 + depthStrength * 0.55,
      );
      context.lineWidth = 1.25 * onePhysicalPixel;
      context.stroke(majorCorticalRidgePaths[depthBand]);
    }

    if (
      Number.isFinite(cerebellumMinimumX) &&
      Number.isFinite(cerebellumMinimumY) &&
      Number.isFinite(cerebellumMaximumX) &&
      Number.isFinite(cerebellumMaximumY)
    ) {
      const cerebellumCenterX =
        (cerebellumMinimumX + cerebellumMaximumX) * 0.5;
      const cerebellumCenterY =
        (cerebellumMinimumY + cerebellumMaximumY) * 0.5;
      const cerebellumRadiusX = Math.max(
        1,
        (cerebellumMaximumX - cerebellumMinimumX) * 0.54,
      );
      const cerebellumRadiusY = Math.max(
        1,
        (cerebellumMaximumY - cerebellumMinimumY) * 0.54,
      );
      const depthField = context.createRadialGradient(0, 0, 0, 0, 0, 1);
      depthField.addColorStop(0, "rgba(0, 0, 0, 0.95)");
      depthField.addColorStop(0.76, "rgba(0, 0, 0, 0.86)");
      depthField.addColorStop(1, "rgba(0, 0, 0, 0)");

      context.save();
      context.translate(cerebellumCenterX, cerebellumCenterY);
      context.scale(cerebellumRadiusX, cerebellumRadiusY);
      context.fillStyle = depthField;
      context.beginPath();
      context.arc(0, 0, 1, 0, TAU);
      context.fill();
      context.restore();
    }

    drawStructuralBatches(
      cerebellumStructuralPaths,
      cerebellumMediumPaths,
      1.05,
      [0.9, 0.9, 1, 0.92],
      162,
      0,
      0.9,
      190,
      45,
    );

    context.lineCap = "round";
    context.lineJoin = "round";
    for (let depthBand = 0; depthBand < DEPTH_LEVELS; depthBand += 1) {
      const depthStrength =
        0.14 + STRUCTURAL_DEPTH_ALPHA[depthBand] * 0.86;
      context.strokeStyle = rgba(
        255,
        218 + depthBand * 3,
        52 + depthBand * 3,
        0.07 + depthStrength * 0.32,
      );
      context.lineWidth = onePhysicalPixel;
      context.stroke(cerebellarRidgePaths[depthBand]);
    }

    context.lineCap = "round";
    context.lineJoin = "round";
    for (let depthBand = 0; depthBand < DEPTH_LEVELS; depthBand += 1) {
      const depthStrength = STRUCTURAL_DEPTH_ALPHA[depthBand];
      context.strokeStyle = rgba(
        255,
        180 + depthBand * 2,
        20 + depthBand * 2,
        0.05 + depthStrength * 0.08,
      );
      context.lineWidth = 2 * onePhysicalPixel;
      context.stroke(cerebellarBridgePaths[depthBand]);
      context.strokeStyle = rgba(
        255,
        218 + depthBand * 2,
        62 + depthBand * 2,
        0.12 + depthStrength * 0.18,
      );
      context.lineWidth = onePhysicalPixel;
      context.stroke(cerebellarBridgePaths[depthBand]);
    }

    for (let depthBand = 0; depthBand < DEPTH_LEVELS; depthBand += 1) {
      const depthStrength = STRUCTURAL_DEPTH_ALPHA[depthBand];
      context.strokeStyle = rgba(
        255,
        176 + depthBand * 2,
        20 + depthBand * 2,
        0.018 + depthStrength * 0.03,
      );
      context.lineWidth = 1.7 * onePhysicalPixel;
      context.stroke(stemPaths[depthBand]);
      context.strokeStyle = rgba(
        255,
        188 + depthBand * 2,
        34 + depthBand * 2,
        0.18 + depthStrength * 0.16,
      );
      context.lineWidth = onePhysicalPixel;
      context.stroke(stemPaths[depthBand]);
      context.strokeStyle = rgba(
        255,
        226 + depthBand * 2,
        78 + depthBand * 2,
        0.22 + depthStrength * 0.24,
      );
      context.lineWidth = 1.15 * onePhysicalPixel;
      context.stroke(stemJunctionPaths[depthBand]);
    }

    for (
      let phaseBand = 0;
      phaseBand < cerebellumNodePhaseCount;
      phaseBand += 1
    ) {
      const nodePulse = reducedMotion.matches
        ? 0.72
        : 0.32 +
          0.68 *
            (0.5 +
              Math.sin(time * 0.001 + phaseBand * 1.67) * 0.5);
      for (let depthBand = 0; depthBand < DEPTH_LEVELS; depthBand += 1) {
        const depthStrength = STRUCTURAL_DEPTH_ALPHA[depthBand];
        const nodePathIndex = phaseBand * DEPTH_LEVELS + depthBand;
        context.fillStyle = rgba(
          255,
          190 + depthBand * 3,
          4 + depthBand * 2,
          (0.018 + depthStrength * 0.05) * nodePulse,
        );
        context.fill(cerebellumNodeHaloPaths[nodePathIndex]);
        context.fillStyle = rgba(
          255,
          238 + depthBand * 2,
          128 + depthBand * 2,
          (0.48 + depthStrength * 0.2) * (0.48 + nodePulse * 0.52),
        );
        context.fill(cerebellumNodeCorePaths[nodePathIndex]);
      }
    }

    const outboundAlpha = [0.16, 0.23, 0.32, 0.44, 0.58];
    for (
      let opacityBand = 0;
      opacityBand < OUTBOUND_OPACITY_LEVELS;
      opacityBand += 1
    ) {
      for (let depthBand = 0; depthBand < DEPTH_LEVELS; depthBand += 1) {
        const depthStrength = STRUCTURAL_DEPTH_ALPHA[depthBand];
        const index = opacityBand * DEPTH_LEVELS + depthBand;
        context.strokeStyle = rgba(
          255,
          178,
          24,
          outboundAlpha[opacityBand] *
            (0.55 + depthStrength * 0.45) *
            lerp(0.88, 1, densityPosition),
        );
        context.lineWidth = onePhysicalPixel;
        context.stroke(outboundPaths[index]);
      }
    }
    for (
      let phaseBand = 0;
      phaseBand < OUTBOUND_NODE_PHASES;
      phaseBand += 1
    ) {
      const phaseOffset = phaseBand * 1.73;
      const phaseSpeed = 1 + phaseBand * 0.07;
      const nodePulse = reducedMotion.matches
        ? 0.72
        : 0.52 +
          0.48 *
            (0.5 +
              Math.sin(time * 0.0011 * phaseSpeed + phaseOffset) * 0.5);
      for (let depthBand = 0; depthBand < DEPTH_LEVELS; depthBand += 1) {
        const depthStrength = STRUCTURAL_DEPTH_ALPHA[depthBand];
        const nodePathIndex = phaseBand * DEPTH_LEVELS + depthBand;
        context.fillStyle = rgba(
          255,
          190 + depthBand * 3,
          6 + depthBand * 2,
          (0.024 + depthStrength * 0.068) * nodePulse,
        );
        context.fill(outboundNodeHaloPaths[nodePathIndex]);
        context.fillStyle = rgba(
          255,
          222 + depthBand * 3,
          56 + depthBand * 2,
          (0.48 + depthStrength * 0.46) * (0.6 + nodePulse * 0.4),
        );
        context.fill(outboundNodeCorePaths[nodePathIndex]);
      }
    }

    if (executionWaveActive) {
      const executionWaveAlpha = [0.022, 0.04, 0.07, 0.115];
      context.lineCap = "butt";
      context.lineJoin = "miter";
      for (
        let waveBand = 0;
        waveBand < executionWaveLevels;
        waveBand += 1
      ) {
        for (let depthBand = 0; depthBand < DEPTH_LEVELS; depthBand += 1) {
          const depthStrength =
            0.28 + STRUCTURAL_DEPTH_ALPHA[depthBand] * 0.72;
          context.strokeStyle = rgba(
            255,
            213 + depthBand * 3,
            44 + depthBand * 2,
            executionWaveAlpha[waveBand] * depthStrength,
          );
          context.lineWidth = onePhysicalPixel;
          context.stroke(
            executionWavePaths[waveBand * DEPTH_LEVELS + depthBand],
          );
        }
      }
    }

    if (!reducedMotion.matches) {
      const constructionWaveAlpha = [0.05, 0.085, 0.14, 0.24];
      context.lineCap = "round";
      context.lineJoin = "round";
      for (
        let waveBand = 0;
        waveBand < constructionWaveLevels;
        waveBand += 1
      ) {
        for (let depthBand = 0; depthBand < DEPTH_LEVELS; depthBand += 1) {
          const depthStrength =
            0.2 + STRUCTURAL_DEPTH_ALPHA[depthBand] * 0.8;
          context.strokeStyle = rgba(
            255,
            (waveBand === constructionWaveLevels - 1 ? 232 : 204) +
              depthBand * 2,
            (waveBand === constructionWaveLevels - 1 ? 98 : 34) +
              depthBand * 2,
            constructionWaveAlpha[waveBand] * depthStrength,
          );
          context.lineWidth =
            (waveBand === constructionWaveLevels - 1 ? 1.45 : 1) *
            onePhysicalPixel;
          context.stroke(
            constructionWavePaths[
              waveBand * DEPTH_LEVELS + depthBand
            ],
          );
        }
      }
    }

    context.lineCap = "round";
    context.lineJoin = "round";
    for (let fadeBand = 0; fadeBand < 2; fadeBand += 1) {
      for (
        let depthBand = 0;
        depthBand < DEPTH_LEVELS;
        depthBand += 1
      ) {
        const depthStrength =
          0.12 + STRUCTURAL_DEPTH_ALPHA[depthBand] * 0.88;
        for (
          let widthBand = 0;
          widthBand < WIDTH_LEVELS;
          widthBand += 1
        ) {
          const index =
            ((fadeBand * DEPTH_LEVELS + depthBand) *
              WIDTH_LEVELS +
              widthBand);
          context.strokeStyle = rgba(
            255,
            174 + depthBand * 3,
            0,
            (fadeBand === 0 ? 0.014 : 0.04) * depthStrength,
          );
          context.lineWidth = 1.8 * onePhysicalPixel;
          context.stroke(activePaths[index]);
          context.strokeStyle = rgba(
            255,
            (widthBand === 1 ? 236 : 228) + depthBand * 2,
            (widthBand === 1 ? 118 : 90) + depthBand * 2,
            (widthBand === 1
              ? fadeBand === 0
                ? 0.34
                : 0.94
              : fadeBand === 0
                ? 0.18
                : 0.5) * depthStrength,
          );
          context.lineWidth = onePhysicalPixel;
          context.stroke(activePaths[index]);
        }
      }
    }

    context.lineCap = "round";
    context.lineJoin = "round";
    context.save();
    context.globalCompositeOperation = "lighter";
    for (let depthBand = 0; depthBand < DEPTH_LEVELS; depthBand += 1) {
      const depthStrength =
        0.12 + STRUCTURAL_DEPTH_ALPHA[depthBand] * 0.88;
      context.strokeStyle = rgba(
        255,
        182 + depthBand * 2,
        8 + depthBand * 2,
        0.008 + depthStrength * 0.026,
      );
      context.lineWidth = 1.9 * onePhysicalPixel;
      context.stroke(hotActivePaths[depthBand]);
    }
    context.restore();

    for (let depthBand = 0; depthBand < DEPTH_LEVELS; depthBand += 1) {
      const depthStrength =
        0.16 + STRUCTURAL_DEPTH_ALPHA[depthBand] * 0.84;
      context.strokeStyle = rgba(
        255,
        240 + depthBand * 2,
        124 + depthBand * 3,
        (0.24 + depthStrength * 0.76) * 0.98,
      );
      context.lineWidth = onePhysicalPixel;
      context.stroke(hotActivePaths[depthBand]);
    }

    const signalResponseAlpha = [0.018, 0.03, 0.05, 0.075, 0.11];
    context.lineCap = "round";
    context.lineJoin = "round";
    for (
      let responseBand = 0;
      responseBand < signalResponseLevels;
      responseBand += 1
    ) {
      for (let depthBand = 0; depthBand < DEPTH_LEVELS; depthBand += 1) {
        const depthStrength =
          0.18 + STRUCTURAL_DEPTH_ALPHA[depthBand] * 0.82;
        context.strokeStyle = rgba(
          255,
          211 + depthBand * 3,
          46 + depthBand * 2,
          signalResponseAlpha[responseBand] * depthStrength,
        );
        context.lineWidth = onePhysicalPixel;
        context.stroke(
          signalResponsePaths[responseBand * DEPTH_LEVELS + depthBand],
        );
      }
    }

    const bundleParticlePoint = (
      fiber: Fiber,
      position: number,
      signedLane: number,
    ) => {
      const point = pathPointAt(fiber, position);
      if (fiber.region !== "cerebrum") return point;
      const before = pathPointAt(fiber, Math.max(0, position - 0.012));
      const after = pathPointAt(fiber, Math.min(1, position + 0.012));
      const deltaX = after.x - before.x;
      const deltaY = after.y - before.y;
      const tangentLength = Math.max(0.001, Math.hypot(deltaX, deltaY));
      const normalX = -deltaY / tangentLength;
      const normalY = deltaX / tangentLength;
      const renderPlan = renderPlanByFiber.get(fiber);
      if (!renderPlan) return point;
      const centerStrand = Math.floor(fiber.strandCount / 2);
      const strandIndex = clamp(
        centerStrand + signedLane,
        0,
        fiber.strandCount - 1,
      );
      const strandOffset =
        renderPlan.strandOffset[strandIndex] +
        renderPlan.strandDrift[strandIndex] * (position * 2 - 1) +
        renderPlan.strandBend[strandIndex] *
          Math.sin(Math.PI * position) *
          Math.sin(
            Math.PI * position +
              renderPlan.strandBendPhase[strandIndex],
          );
      const perspective = cameraDistance / (cameraDistance - point.z);
      const spread = Math.max(
        fiber.strandSpread * modelScale * perspective,
        onePhysicalPixel * 1.55,
      );
      return {
        x: point.x + normalX * strandOffset * spread,
        y: point.y + normalY * strandOffset * spread,
        z: point.z,
      };
    };

    const drawSignalTrail = (
      fiber: Fiber,
      progress: number,
      lane: number,
      strength: number,
      length: number,
    ) => {
      if (reducedMotion.matches) return;
      context.save();
      context.globalCompositeOperation = "lighter";
      context.lineCap = "round";
      context.lineWidth = 1.1;
      // Sample the same strand as the head so the trail follows its curvature.
      // Stop at the fiber origin rather than drawing across its wraparound.
      for (let step = 8; step > 0; step -= 1) {
        const start = progress - (step / 8) * length;
        const end = progress - ((step - 1) / 8) * length;
        if (end <= 0) continue;
        const from = bundleParticlePoint(fiber, Math.max(0, start), lane);
        const to = bundleParticlePoint(fiber, end, lane);
        const front = smoothstep(-0.92, 0.92, to.z);
        context.strokeStyle = rgba(
          255, 220, 82,
          strength * front * (1 - (step - 1) / 8) ** 2 * 0.7,
        );
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
      }
      context.restore();
    };

    pulseActivityByFiber.forEach((activity, fiberIndex) => {
      const fiber = fibers[fiberIndex];
      if (!fiber.visible) return;
      const lane =
        fiber.region === "cerebrum"
          ? activity.primary
            ? 0
            : (fiber.bundleId % 3) - 1
          : 0;
      const point = bundleParticlePoint(fiber, activity.progress, lane);
      const front = smoothstep(-0.92, 0.92, point.z);
      if (front < 0.08) return;
      drawSignalTrail(fiber, activity.progress, lane, activity.strength, 0.1);
      drawParticle(
        context,
        glowSprite,
        point,
        activity.primary,
        activity.strength * (0.4 + front * 0.5),
        activity.primary ? 1.15 : 0.82,
      );
    });

    const particleLaneSequence = [-2, 0, 1, -1, 2, 0] as const;
    let particleCount = 0;
    let hotCount = 0;
    let hotCerebellumCount = 0;
    particleFibers.forEach((fiber) => {
      if (
        particleCount >= particleLimit ||
        !fiber.visible ||
        !fiber.particle
      ) {
        return;
      }
      const progress = reducedMotion.matches
        ? fiber.phase
        : (fiber.phase + time * fiber.speed * idleSignalSpeed) % 1;
      const lane =
        fiber.region === "cerebrum"
          ? particleLaneSequence[
              particleCount % particleLaneSequence.length
            ]
          : 0;
      const point = bundleParticlePoint(fiber, progress, lane);
      const front = smoothstep(-0.92, 0.92, point.z);
      if (front < 0.08) return;
      const hot =
        hotCount < HOT_PARTICLE_COUNT &&
        (fiber.hot ||
          (fiber.region === "cerebrum" && hotCount < 8) ||
          (fiber.region === "cerebellum" && hotCerebellumCount < 2));
      if (hot) {
        hotCount += 1;
        if (fiber.region === "cerebellum") {
          hotCerebellumCount += 1;
        }
      }
      const nodeBrightness = reducedMotion.matches
        ? 1
        : 1 +
          Math.sin(
            (time / lerp(2800, 4300, fiber.activityKey)) * TAU +
              fiber.phase * TAU,
          ) *
            (hot ? 0.09 : 0.06);
      if (hot) drawSignalTrail(fiber, progress, lane, 0.55, 0.055);
      drawParticle(
        context,
        glowSprite,
        point,
        hot,
        hot
          ? Math.min(1, (0.4 + front * 0.58) * nodeBrightness)
          : (0.34 + front * 0.5) * nodeBrightness,
        hot ? 1.6 : 1,
      );
      if (
        secondaryNodeVisibility > 0 &&
        fiber.region === "cerebrum"
      ) {
        const secondaryProgress = (progress + 0.31) % 1;
        const secondaryLane = lane === 0 ? 2 : -lane;
        const secondaryPoint = bundleParticlePoint(
          fiber,
          secondaryProgress,
          secondaryLane,
        );
        const secondaryFront = smoothstep(
          -0.92,
          0.92,
          secondaryPoint.z,
        );
        if (secondaryFront >= 0.08) {
          const secondaryBrightness = reducedMotion.matches
            ? 1
            : 1 +
              Math.sin(
                (time / lerp(3400, 5100, fiber.qualityRank)) * TAU +
                  (fiber.phase + 0.37) * TAU,
              ) *
                0.045;
          drawParticle(
            context,
            glowSprite,
            secondaryPoint,
            false,
            (0.18 + secondaryFront * 0.28) *
              secondaryBrightness *
              secondaryNodeVisibility,
            0.7,
          );
        }
        if (tertiaryNodeVisibility > 0) {
          const tertiaryProgress =
            (progress + 0.54 + fiber.activityKey * 0.17) % 1;
          const tertiaryLane = lane > 0 ? -2 : 2;
          const tertiaryPoint = bundleParticlePoint(
            fiber,
            tertiaryProgress,
            tertiaryLane,
          );
          const tertiaryFront = smoothstep(
            -0.92,
            0.92,
            tertiaryPoint.z,
          );
          if (tertiaryFront >= 0.08) {
            const tertiaryBrightness = reducedMotion.matches
              ? 1
              : 1 +
                Math.sin(
                  (time / lerp(3900, 5600, fiber.activityKey)) * TAU +
                    (fiber.phase + 0.61) * TAU,
                ) *
                  0.035;
            drawParticle(
              context,
              glowSprite,
              tertiaryPoint,
              false,
              (0.08 + tertiaryFront * 0.17) *
                tertiaryBrightness *
                tertiaryNodeVisibility,
              0.52,
            );
          }
        }
      }
      particleCount += 1;
    });

    context.save();
    context.globalCompositeOperation = "source-over";
    outboundFibers.forEach((fiber, index) => {
      if (
        !fiber.visible ||
        !visibleOutboundFiberSet.has(fiber)
      ) {
        return;
      }
      const pointCount = fiber.projected.length / 3;
      const tailStart =
        fiber.escapeStart / Math.max(1, pointCount - 1);
      const tailPosition = reducedMotion.matches
        ? 0.22 + index * 0.055
        : (fiber.phase + time * fiber.speed * idleSignalSpeed * 0.72) % 1;
      const point = pathPointAt(
        fiber,
        lerp(tailStart, 1, tailPosition),
      );
      const tailFade = 1 - smoothstep(0.7, 1, tailPosition);
      if (tailFade < 0.04) return;
      const front = smoothstep(-0.92, 0.92, point.z);
      context.fillStyle = rgba(
        255,
        196,
        26,
        (0.34 + front * 0.4) * tailFade,
      );
      context.beginPath();
      context.arc(point.x, point.y, 0.62, 0, TAU);
      context.fill();
    });
    context.restore();

    drawCornerBrackets(context, width, height);
  };


  // The existing shared coordinator is the sole animation clock. Its static
  // queue serializes warm frames and its leases cap live editor/Preview work.
  resize();
  return {
    update(next: Settings) { settings = next; resize() },
    getSnapshot() { return { mode: settings.mode, stillTime: settings.stillTime, time: currentTime, lost: false } },
    setPointer(x: number, y: number) {
      const enabled = settings.interactive && !settings.static && field?.dataset.brainPointerActive === "true" && field?.dataset.brainPointerType !== "touch" && field?.dataset.brainPointerSuppressed !== "true";
      // The shared pool's pointermove also sees layout-generated events. Only
      // actual hovering motion accepted by the source's 180 ms scroll guard is
      // allowed to change the inspection target.
      const acceptedX = Number(field?.dataset.brainPointerX ?? x);
      const acceptedY = Number(field?.dataset.brainPointerY ?? y);
      pointer.targetX = width * (enabled ? acceptedX + .5 : .5);
      pointer.targetY = height * (enabled ? .5 - acceptedY : .47);
      pointer.active = Boolean(enabled);
    },
    renderAt(seconds: number) {
      if (disposed) return;
      currentTime = seconds;
      const elapsed = Math.max(1, Math.min(100, (seconds - lastDrawTime) * 1000 || 32));
      lastDrawTime = seconds;
      draw(seconds * 1000, elapsed);
      // Projection must exist before the first tap can choose a real fiber.
      if (!settings.static && settings.interactive && settings.trace && settings.trace.id !== (field ? consumedTraces.get(field) : undefined)) {
        if (field) consumedTraces.set(field, settings.trace.id);
        addPulse(width * settings.trace.x, height * settings.trace.y);
        draw(seconds * 1000 + 1, 1);
      }
      if (!pulses.length) updateStatus(pointer.active ? "INSPECTION / TRACKING" : "SYSTEM STATE / ACTIVE", pointer.active ? "tracking" : "idle");
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.globalCompositeOperation = "destination-over";
      context.drawImage(staticBitmap ?? staticCanvas, 0, 0);
      context.fillStyle = "#000000";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.restore();
      canvas.setAttribute("data-brain-fiber-count", String(fibers.length));
      canvas.setAttribute("data-brain-phase", String(seconds));
      canvas.setAttribute("data-brain-live-pulses", String(pulses.length));
      settings.colorHost?.setAttribute("data-brain-fiber-count", String(fibers.length));
      settings.colorHost?.setAttribute("data-brain-phase", String(seconds));
      settings.colorHost?.setAttribute("data-brain-live-pulses", String(pulses.length));
    },
    dispose() { disposed = true; ++substrateGeneration; pulses.length = 0; staticBitmap?.close(); staticBitmap = undefined; staticCanvas.width = 1; staticCanvas.height = 1 },
  };
}

const colorCache=new Map<string,[number,number,number]>()
let colorContext:CanvasRenderingContext2D|null|undefined
function rgb(value: string, canvas:HTMLCanvasElement): [number,number,number] {
    // Resolve inherited Framer design tokens within this component's own node.
    for(let depth=0;depth<4&&value.trim().startsWith("var(");depth++){
        const token=value.match(/^var\(\s*(--[^,\s)]+)\s*(?:,\s*(.*))?\)$/)
        if(!token)break
        value=getComputedStyle(canvas).getPropertyValue(token[1]).trim()||token[2]||"#ffffff"
    }
    const cached=colorCache.get(value)
    if(cached)return cached
    // Framer colors can be hex, rgb(), hsl(), named, or alpha-bearing CSS.
    // The artwork is opaque: palette alpha is deliberately ignored.
    if(colorContext===undefined){
        const pixel=document.createElement("canvas");pixel.width=1;pixel.height=1
        colorContext=pixel.getContext("2d",{colorSpace:"srgb",willReadFrequently:true})
    }
    let result:[number,number,number]=[1,1,1]
    if(colorContext){
        colorContext.fillStyle="#ffffff";colorContext.fillStyle=value
        const normalized=String(colorContext.fillStyle)
        const channels=normalized.match(/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)/i)
        if(channels)result=channels.slice(1,4).map(x=>Math.min(255,Number(x))/255) as [number,number,number]
        else if(/^#[\da-f]{6,8}$/i.test(normalized))result=[0,2,4].map(i=>parseInt(normalized.slice(i+1,i+3),16)/255) as [number,number,number]
        else {
            // Convert wide-gamut CSS colors to the renderer's sRGB framebuffer.
            // Force alpha to one before readback so transparent RGB is retained.
            colorContext.fillStyle=normalized.replace(/\/\s*[-+\d.e%]+\s*\)$/i,"/ 1)")
            colorContext.clearRect(0,0,1,1);colorContext.fillRect(0,0,1,1)
            const data=colorContext.getImageData(0,0,1,1).data
            result=[data[0]/255,data[1]/255,data[2]/255]
        }
    }
    if(colorCache.size>64)colorCache.clear()
    colorCache.set(value,result)
    return result
}
// Embedded identically in the five standalone Framer files. Versioned so HMR
// cannot retain an earlier coordinator with different quality/lifetime rules.
const STUDY_POOL_KEY=Symbol.for("monarchic.gpu-budget.v2")
type StudyRenderer=ReturnType<typeof createRenderer>
interface StudyLease {canvas:HTMLCanvasElement;renderer:StudyRenderer;signature:string}
interface StudyFrame {canvas:HTMLCanvasElement;width:number;height:number;pixels:number}
interface StudyEntry {
    id:number;source:string;target:"canvas"|"preview"
    root:HTMLDivElement;display:HTMLCanvasElement;settings:Settings
    factory:typeof createRenderer;notify:(status:Status,error?:string)=>void
    lease?:StudyLease;rect:DOMRect;visible:boolean;hover:boolean;focus:boolean;pinUntil:number
    logicalWidth:number;logicalHeight:number;desiredWidth:number;desiredHeight:number
    liveDesiredWidth:number;liveDesiredHeight:number;frameWidth:number;frameHeight:number
    framePhase:number;framePointer:[number,number];frameKey:string;contentKey:string;canonical:boolean
    phase:number;lastTick:number;lastDraw:number;lastVisibleAt:number;needsStill:boolean;hasFrame:boolean
    retryAt:number;pointer:[number,number];smoothPointer:[number,number];emitted:string;cleanup:()=>void
}
interface StudyPool {
    add:(entry:Pick<StudyEntry,"source"|"target"|"root"|"display"|"settings"|"factory"|"notify">)=>StudyEntry
    update:(entry:StudyEntry,next:Settings)=>void;remove:(entry:StudyEntry)=>void
    request:(entry:StudyEntry)=>void;runStatic:(work:()=>number|void)=>void;debug:()=>unknown
}
function getStudyPool():StudyPool {
    const realm=window as unknown as {[key:symbol]:StudyPool|undefined},shared=realm[STUDY_POOL_KEY]
    if(shared)return shared
    const entries=new Map<number,StudyEntry>(),cache=new Map<string,StudyFrame>(),completed=new Set<number>()
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)")
    let serial=0,timer=0,contexts=0,peakContexts=0,peakPixels=0,cachePixels=0,completedStillJobs=0
    let lastMeasure=0,lastWarm=0,dirty=true,listening=false,pumping=false,wasReduced=reduced.matches,lastPoolError=""
    const ignored=new Set(["animate","static","canvasPreview","speed","interactive","managed","renderWidth","renderHeight","managedBufferWidth","managedBufferHeight","pixelBudget","colorHost"])
    const now=()=>performance.now()
    const pixels=()=>[...entries.values()].reduce((n,e)=>n+(e.lease?e.lease.canvas.width*e.lease.canvas.height:0),0)
    const displayPixels=()=>[...entries.values()].reduce((n,e)=>n+(e.hasFrame?e.display.width*e.display.height:0),0)
    const emit=(e:StudyEntry,status:Status,error="")=>{const value=status+"/"+error;if(e.emitted!==value){e.emitted=value;e.notify(status,error||undefined)}}
    const data=(e:StudyEntry,name:string,value:string|number)=>e.display.setAttribute?.("data-study-"+name,String(value))
    const demandData=(e:StudyEntry,live=Boolean(e.lease))=>{
        data(e,"demand-width",live?e.liveDesiredWidth:e.desiredWidth);data(e,"demand-height",live?e.liveDesiredHeight:e.desiredHeight)
        data(e,"source",e.source);data(e,"mode",e.settings.mode)
    }
    const frameData=(e:StudyEntry)=>{data(e,"frame-width",e.frameWidth);data(e,"frame-height",e.frameHeight)}
    const zero=(p:[number,number])=>Math.abs(p[0])+Math.abs(p[1])<.000001
    const canonical=(e:StudyEntry,phase:number,p:[number,number])=>Math.abs(phase-e.settings.stillTime)<.000001&&zero(p)
    const wanted=(e:StudyEntry):{phase:number;pointer:[number,number]}=>e.settings.static||reduced.matches
        ?{phase:e.settings.stillTime,pointer:[0,0]}:{phase:e.phase,pointer:e.settings.interactive&&e.hasFrame?e.framePointer:[0,0]}
    const stateMatches=(e:StudyEntry)=>{const state=wanted(e);return e.hasFrame&&e.frameKey===e.contentKey&&Math.abs(e.framePhase-state.phase)<.000001&&Math.abs(e.framePointer[0]-state.pointer[0])+Math.abs(e.framePointer[1]-state.pointer[1])<.000001}
    const adequate=(w:number,h:number,dw:number,dh:number)=>w>=dw&&h>=dh
    const raster=(logicalW:number,logicalH:number,screenW:number,screenH:number,budget:number):[number,number]=>{
        const aspect=Math.max(.0001,logicalW/Math.max(.0001,logicalH)),dpr=Math.max(.1,Math.min(2,window.devicePixelRatio||1))
        const longEdge=Math.max(384,Math.ceil(Math.max(screenW,screenH)*dpr/128)*128)
        let w=aspect>=1?longEdge:longEdge*aspect,h=aspect>=1?longEdge/aspect:longEdge
        const ratio=Math.min(1,Math.sqrt(budget/Math.max(1,w*h)));w*=ratio;h*=ratio
        const width=Math.max(1,Math.min(Math.floor(budget),Math.floor(w)))
        return[width,Math.max(1,Math.min(Math.floor(budget/width),Math.floor(h)))]
    }
    const key=(e:StudyEntry)=>e.source+"/"+e.logicalWidth+"x"+e.logicalHeight+"/"+JSON.stringify({
        ...Object.fromEntries(Object.entries(e.settings).filter(([name])=>!ignored.has(name))),
        resolvedPalette:[rgb(e.settings.primary,e.display),rgb(e.settings.secondary,e.display),rgb(e.settings.ink,e.display)],
    })
    const context2D=(canvas:HTMLCanvasElement)=>{const c=canvas.getContext("2d",{alpha:false});if(!c)throw new Error("Could not create the study display.");return c}
    const capture=(source:HTMLCanvasElement,width=source.width,height=source.height)=>{
        const result=document.createElement("canvas");result.width=width;result.height=height
        context2D(result).drawImage(source,0,0,width,height);return result
    }
    const copy=(source:HTMLCanvasElement,target:HTMLCanvasElement,preserveLarger:boolean)=>{
        const keep=preserveLarger&&target.width*target.height>source.width*source.height
        const width=keep?target.width:source.width,height=keep?target.height:source.height,c=context2D(target)
        if(target.width===width&&target.height===height){c.drawImage(source,0,0,width,height);return}
        // Stage before changing dimensions. Resizing clears canvas pixels; an
        // ImageData backup lets a failed final draw roll back independently of
        // the failing drawImage path. Metadata is committed only after success.
        const stage=capture(source,width,height),oldWidth=target.width,oldHeight=target.height
        const previous=c.getImageData(0,0,oldWidth,oldHeight)
        try{target.width=width;target.height=height;context2D(target).drawImage(stage,0,0)}
        catch(error){target.width=oldWidth;target.height=oldHeight;context2D(target).putImageData(previous,0,0);throw error}
    }
    const refreshNeed=(e:StudyEntry)=>{
        const required=e.visible?[e.desiredWidth,e.desiredHeight]:raster(e.logicalWidth,e.logicalHeight,0,0,2000000)
        e.needsStill=!stateMatches(e)||!adequate(e.frameWidth,e.frameHeight,required[0],required[1])
        demandData(e)
        data(e,"state",e.lease?"live":!e.hasFrame?"pending":e.needsStill?"pending":e.visible?"ready":"primed")
    }
    const commit=(e:StudyEntry,source:HTMLCanvasElement,phase:number,pointer:[number,number],preserve=true)=>{
        copy(source,e.display,preserve&&e.hasFrame&&(e.visible||e.frameKey===e.contentKey))
        e.frameWidth=source.width;e.frameHeight=source.height;e.framePhase=phase;e.framePointer=[...pointer]
        e.frameKey=e.contentKey;e.canonical=canonical(e,phase,pointer);e.hasFrame=true;completed.add(e.id)
        frameData(e);refreshNeed(e)
    }
    const dropCache=(cacheKey:string)=>{const old=cache.get(cacheKey);if(old){cachePixels-=old.pixels;cache.delete(cacheKey)}}
    const saveCache=(cacheKey:string,source:HTMLCanvasElement)=>{
        const old=cache.get(cacheKey)
        if(old&&adequate(old.width,old.height,source.width,source.height)){cache.delete(cacheKey);cache.set(cacheKey,old);return}
        const canvas=capture(source),frame={canvas,width:canvas.width,height:canvas.height,pixels:canvas.width*canvas.height}
        dropCache(cacheKey);cache.set(cacheKey,frame);cachePixels+=frame.pixels
        while(cache.size>64||cachePixels>8000000)dropCache(cache.keys().next().value as string)
    }
    const release=(e:StudyEntry)=>{
        const lease=e.lease;if(!lease)return
        e.lease=undefined;e.lastTick=0;e.lastDraw=0
        // A failed render/copy may be newer than the last displayed frame.
        // Continue from the frame the person actually saw, including pointer.
        try{
            e.phase=e.hasFrame?e.framePhase:lease.renderer.getSnapshot().time
            e.smoothPointer=[...e.framePointer]
        }finally{try{lease.renderer.dispose()}finally{contexts--}}
        demandData(e,false)
    }
    const fail=(e:StudyEntry,error:unknown,delay=1000)=>{
        try{release(e)}catch{}
        e.retryAt=now()+delay;e.needsStill=true;data(e,"state","error")
        try{emit(e,"recovering",error instanceof Error?error.message:String(error))}catch{}
    }
    const jobSize=(e:StudyEntry,still:boolean):[number,number]=>{
        if(!still)return[e.liveDesiredWidth,e.liveDesiredHeight]
        if(!e.visible)return raster(e.logicalWidth,e.logicalHeight,0,0,2000000)
        // A content change at a smaller zoom must retain the quality already
        // shown on a visible card. Demand itself still describes screen LOD.
        if(e.hasFrame&&(e.frameWidth>e.desiredWidth||e.frameHeight>e.desiredHeight)){
            const aspect=e.logicalWidth/e.logicalHeight,long=Math.max(e.desiredWidth,e.desiredHeight,e.frameWidth,e.frameHeight)
            let w=aspect>=1?long:long*aspect,h=aspect>=1?long/aspect:long
            const fit=Math.min(1,Math.sqrt(2000000/(w*h)));w*=fit;h*=fit
            const width=Math.max(1,Math.floor(w));return[width,Math.max(1,Math.min(Math.floor(2000000/width),Math.floor(h)))]
        }
        return[e.desiredWidth,e.desiredHeight]
    }
    const settingsFor=(e:StudyEntry,still:boolean):Settings=>{
        const [width,height]=jobSize(e,still)
        return{...e.settings,managed:true,static:still||e.settings.static,
            renderWidth:e.logicalWidth,renderHeight:e.logicalHeight,
            managedBufferWidth:width,managedBufferHeight:height,pixelBudget:still?2000000:1000000,colorHost:e.display}
    }
    const signature=(settings:Settings)=>JSON.stringify(Object.fromEntries(Object.entries(settings).filter(([name])=>name!=="colorHost")))
    const acquire=(e:StudyEntry,still:boolean):StudyLease|undefined=>{
        if(contexts>=2||e.retryAt>now())return
        const canvas=document.createElement("canvas"),settings=settingsFor(e,still);canvas.width=1;canvas.height=1
        contexts++;peakContexts=Math.max(peakContexts,contexts)
        try{
            const renderer=e.factory(canvas,settings,(status,error)=>{if(status==="recovering"){e.retryAt=now()+250;emit(e,"recovering",error)}},still?wanted(e).phase:e.phase)
            peakPixels=Math.max(peakPixels,pixels()+canvas.width*canvas.height)
            return{canvas,renderer,signature:signature(settings)}
        }catch(error){contexts--;fail(e,error);return}
    }
    const warm=(e:StudyEntry)=>{
        const lease=acquire(e,true);if(!lease)return
        const state=wanted(e)
        try{
            lease.renderer.setPointer(...state.pointer);lease.renderer.renderAt(state.phase)
            commit(e,lease.canvas,state.phase,state.pointer)
            if(e.canonical)saveCache(e.contentKey,lease.canvas)
            completedStillJobs++
        }catch(error){fail(e,error)}
        finally{try{lease.renderer.dispose()}catch{}finally{contexts--}}
    }
    const measure=(time:number)=>{
        for(const e of entries.values()){
            if(e.retryAt>time)continue
            try{
                e.rect=e.root.getBoundingClientRect()
                e.logicalWidth=e.display.clientWidth||e.root.clientWidth||0;e.logicalHeight=e.display.clientHeight||e.root.clientHeight||0
                const r=e.rect
                e.visible=!document.hidden&&r.width>0&&r.height>0&&r.right>0&&r.bottom>0&&r.left<window.innerWidth&&r.top<window.innerHeight
                if(e.visible)e.lastVisibleAt=time
                if(e.logicalWidth<=0||e.logicalHeight<=0){e.visible=false;continue}
                ;[e.desiredWidth,e.desiredHeight]=raster(e.logicalWidth,e.logicalHeight,r.width,r.height,2000000)
                ;[e.liveDesiredWidth,e.liveDesiredHeight]=raster(e.logicalWidth,e.logicalHeight,r.width,r.height,1000000)
                e.contentKey=key(e)
                refreshNeed(e)
                const state=wanted(e),cached=canonical(e,state.phase,state.pointer)?cache.get(e.contentKey):undefined
                // A smaller cache hit can prime a blank surface, but cannot
                // downgrade a good frame or claim a larger demand is ready.
                const improves=cached&&(!e.hasFrame||e.frameKey!==e.contentKey||cached.width>e.frameWidth||cached.height>e.frameHeight)
                if(cached&&improves&&(!e.hasFrame||adequate(cached.width,cached.height,e.frameWidth,e.frameHeight))){
                    try{commit(e,cached.canvas,state.phase,state.pointer)}catch(error){dropCache(e.contentKey);throw error}
                    cache.delete(e.contentKey);cache.set(e.contentKey,cached)
                }
            }catch(error){fail(e,error)}
        }
        dirty=false;lastMeasure=time
    }
    const visibleArea=(e:StudyEntry)=>{const r=e.rect;return Math.max(0,Math.min(window.innerWidth,r.right)-Math.max(0,r.left))*Math.max(0,Math.min(window.innerHeight,r.bottom)-Math.max(0,r.top))}
    const rank=(e:StudyEntry,time:number)=>{
        const r=e.rect,priority=e.focus?3:e.pinUntil>time?2:e.hover?1:0
        return priority*1000000-Math.hypot(r.left+r.width/2-window.innerWidth/2,r.top+r.height/2-window.innerHeight/2)
    }
    const eligible=(e:StudyEntry,time:number)=>{
        if(!e.visible||e.retryAt>time||e.settings.static||!e.settings.animate||e.settings.speed<=0||reduced.matches)return false
        if(e.target==="preview")return true
        if(!e.settings.canvasPreview)return false
        const keep=Boolean(e.lease),r=e.rect
        return e.pinUntil>time||(r.width>=(keep?120:160)&&r.height>=(keep?80:100)&&visibleArea(e)>=(keep?12000:24000))
    }
    const wake=(immediate=false)=>{
        dirty=true
        if(immediate&&timer){clearTimeout(timer);timer=0}
        if(!pumping&&!timer&&entries.size)timer=window.setTimeout(pump,0)
    }
    const onWake=()=>wake(),onVisibility=()=>wake(true)
    const trimDisplays=()=>{
        if(displayPixels()<=24000000)return
        const candidates=[...entries.values()].filter(e=>!e.visible&&!e.lease&&e.hasFrame).sort((a,b)=>a.lastVisibleAt-b.lastVisibleAt)
        for(const e of candidates){
            const [w,h]=raster(e.logicalWidth,e.logicalHeight,0,0,2000000)
            if(e.display.width*e.display.height<=w*h)continue
            try{
                const retained=capture(e.display,w,h);copy(retained,e.display,false)
                e.frameWidth=Math.min(e.frameWidth,w);e.frameHeight=Math.min(e.frameHeight,h);frameData(e);refreshNeed(e)
            }catch(error){fail(e,error)}
            break // One offscreen reduction per task; never degrade visible art.
        }
    }
    const pump=()=>{
        timer=0;pumping=true
        let previewActive=false,pending=false
        try{
            if(!entries.size)return
            const time=now()
            if(reduced.matches!==wasReduced){
                wasReduced=reduced.matches
                if(wasReduced)for(const e of entries.values()){release(e);e.phase=e.settings.stillTime;e.smoothPointer=[0,0];e.pointer=[0,0]}
                dirty=true
            }
            if(dirty||time-lastMeasure>=125)measure(time)
            const all=[...entries.values()]
            const cold=all.filter(e=>e.needsStill&&!e.lease&&e.logicalWidth>0&&e.logicalHeight>0&&e.retryAt<=time)
                .sort((a,b)=>(b.visible?1:0)-(a.visible?1:0)||(a.hasFrame?1:0)-(b.hasFrame?1:0)||rank(b,time)-rank(a,time))
            const candidates=all.filter(e=>eligible(e,time)).sort((a,b)=>rank(b,time)-rank(a,time)),selected:StudyEntry[]=[]
            if(!document.hidden)for(const e of candidates){
                if(selected.length>=(cold.length?1:2))break
                if(e.target==="canvas"&&selected.some(s=>s.target==="canvas"))continue
                selected.push(e)
            }
            for(const e of all)if(e.lease&&!selected.includes(e))try{release(e);refreshNeed(e)}catch(error){fail(e,error)}
            let created=false
            for(const e of selected){
                try{
                    if(!e.lease&&!created){e.lease=acquire(e,false);created=Boolean(e.lease)}
                    const lease=e.lease;if(!lease)continue
                    if(lease.renderer.getSnapshot().lost){fail(e,"Restoring graphics.",250);continue}
                    const settings=settingsFor(e,false),next=signature(settings)
                    if(lease.signature!==next){lease.renderer.update(settings);lease.signature=next}
                    const period=1000/(e.target==="canvas"?12:30)
                    if(!e.lastTick)e.lastTick=time
                    e.phase+=Math.min((time-e.lastTick)/1000,.1)*e.settings.speed;e.lastTick=time
                    if(time-e.lastDraw>=period||!e.hasFrame){
                        e.smoothPointer=e.smoothPointer.map((v,i)=>v+(e.pointer[i]-v)*.18) as [number,number]
                        const pointer:[number,number]=e.settings.interactive?e.smoothPointer:[0,0]
                        lease.renderer.setPointer(...pointer);lease.renderer.renderAt(e.phase)
                        commit(e,lease.canvas,e.phase,pointer);e.lastDraw=time
                    }
                    demandData(e,true);data(e,"state","live");emit(e,"running")
                }catch(error){fail(e,error)}
            }
            // Prime every mounted, sized card once even when viewport culling
            // excludes it. Visible upgrades take priority; one job yields each task.
            if(!document.hidden&&contexts<2&&(!created||time-lastWarm>=125)){
                const next=cold.find(e=>!selected.includes(e));if(next){warm(next);lastWarm=time}
            }
            for(const e of all)if(!e.lease&&e.retryAt<=time){
                const status:Status=e.settings.static?"static":reduced.matches?"reduced-motion":!e.settings.animate||e.settings.speed<=0?"paused":!e.visible?"offscreen":"waiting"
                try{emit(e,status)}catch(error){fail(e,error)}
            }
            trimDisplays();peakPixels=Math.max(peakPixels,pixels())
            previewActive=selected.some(e=>e.target==="preview");pending=cold.length>0
        }catch(error){lastPoolError=error instanceof Error?error.message:String(error)}
        finally{
            pumping=false
            // Even a failed measure/cache operation must leave peers a clock.
            if(entries.size&&!document.hidden&&!timer)timer=window.setTimeout(pump,previewActive?16:pending?40:125)
        }
    }
    const start=()=>{if(listening)return;listening=true;window.addEventListener("resize",onWake);window.addEventListener("scroll",onWake,true);document.addEventListener("visibilitychange",onVisibility);reduced.addEventListener("change",onVisibility)}
    const stop=()=>{if(timer)clearTimeout(timer);timer=0;if(!listening)return;listening=false;window.removeEventListener("resize",onWake);window.removeEventListener("scroll",onWake,true);document.removeEventListener("visibilitychange",onVisibility);reduced.removeEventListener("change",onVisibility)}
    const pool:StudyPool={
        add(input){
            const e:StudyEntry={...input,id:++serial,rect:input.root.getBoundingClientRect(),visible:false,hover:false,focus:false,pinUntil:0,
                logicalWidth:0,logicalHeight:0,desiredWidth:0,desiredHeight:0,liveDesiredWidth:0,liveDesiredHeight:0,frameWidth:0,frameHeight:0,
                framePhase:input.settings.stillTime,framePointer:[0,0],frameKey:"",contentKey:"",canonical:true,
                phase:input.settings.stillTime,lastTick:0,lastDraw:0,lastVisibleAt:0,needsStill:true,hasFrame:false,retryAt:0,pointer:[0,0],smoothPointer:[0,0],emitted:"",cleanup:()=>{}}
            const enter=()=>{e.hover=true;wake(true)},leave=()=>{e.hover=false;e.pointer=[0,0];wake(true)}
            const focus=()=>{e.focus=true;wake(true)},blur=()=>{e.focus=e.root.contains(document.activeElement);wake(true)}
            const pointer=(event:PointerEvent)=>{const r=e.root.getBoundingClientRect();e.pointer=[(event.clientX-r.left)/Math.max(1,r.width)-.5,.5-(event.clientY-r.top)/Math.max(1,r.height)]}
            input.root.addEventListener("pointerenter",enter);input.root.addEventListener("pointerleave",leave);input.root.addEventListener("focusin",focus);input.root.addEventListener("focusout",blur);input.root.addEventListener("pointermove",pointer)
            const observer=new ResizeObserver(onWake);observer.observe(input.root)
            e.cleanup=()=>{observer.disconnect();input.root.removeEventListener("pointerenter",enter);input.root.removeEventListener("pointerleave",leave);input.root.removeEventListener("focusin",focus);input.root.removeEventListener("focusout",blur);input.root.removeEventListener("pointermove",pointer)}
            entries.set(e.id,e);start();wake();return e
        },
        update(e,next){
            const reset=next.mode!==e.settings.mode||next.stillTime!==e.settings.stillTime||(next.static&&!e.settings.static)
            if(reset)release(e)
            e.settings=next
            if(reset){e.phase=next.stillTime;e.pointer=[0,0];e.smoothPointer=[0,0]}
            if(!next.interactive){e.pointer=[0,0];e.smoothPointer=[0,0]}
            wake()
        },
        remove(e){try{release(e)}finally{e.cleanup();entries.delete(e.id);completed.delete(e.id);if(!entries.size)stop();else wake()}},
        request(e){e.pinUntil=now()+4000;wake(true)},
        runStatic(work){for(const e of entries.values())try{release(e)}catch(error){fail(e,error)}contexts++;peakContexts=Math.max(peakContexts,contexts);try{const size=work();if(typeof size==="number")peakPixels=Math.max(peakPixels,size)}finally{contexts--;wake()}},
        debug(){return{version:2,activeContexts:contexts,peakContexts,peakPixels,entryCount:entries.size,cacheSize:cache.size,cachePixels,cachePixelBudget:8000000,displayPixels:displayPixels(),displayPixelBudget:24000000,completedStillJobs,completedIds:[...completed],lastPoolError,
            pendingStillIds:[...entries.values()].filter(e=>e.needsStill).map(e=>e.id),
            cache:[...cache].map(([key,f])=>({key,width:f.width,height:f.height,pixels:f.pixels})),
            live:[...entries.values()].filter(e=>e.lease).map(e=>({id:e.id,source:e.source,mode:e.settings.mode,target:e.target,pixels:e.lease!.canvas.width*e.lease!.canvas.height,phase:e.phase})),
            entries:[...entries.values()].map(e=>({id:e.id,source:e.source,mode:e.settings.mode,target:e.target,visible:e.visible,hasFrame:e.hasFrame,needsStill:e.needsStill,retryAt:e.retryAt,canonical:e.canonical,phase:e.phase,framePhase:e.framePhase,framePointer:e.framePointer,
                logicalWidth:e.logicalWidth,logicalHeight:e.logicalHeight,screenWidth:e.rect.width,screenHeight:e.rect.height,desiredWidth:e.desiredWidth,desiredHeight:e.desiredHeight,liveDesiredWidth:e.liveDesiredWidth,liveDesiredHeight:e.liveDesiredHeight,displayWidth:e.display.width,displayHeight:e.display.height,effectiveFrameWidth:e.frameWidth,effectiveFrameHeight:e.frameHeight,contentKey:e.contentKey}))}},
    }
    realm[STUDY_POOL_KEY]=pool;return pool
}
function useStudySurface(root:React.RefObject<HTMLDivElement>,display:React.RefObject<HTMLCanvasElement>,settings:Settings,target:ReturnType<typeof RenderTarget.current>,source:string,ready:boolean,notify:(status:Status,error?:string)=>void){
    const entry=React.useRef<StudyEntry|null>(null),pool=React.useRef<StudyPool|null>(null),current=React.useRef(settings),callback=React.useRef(notify)
    const staticKey=React.useRef(""),snapshot=React.useRef<{mode:Mode,stillTime:number,time:number}|null>(null)
    current.current=settings;callback.current=notify
    const oneShot=()=>{
        if(!display.current)return
        const gpu=document.createElement("canvas"),host=display.current,next=current.current;gpu.width=1;gpu.height=1
        const width=host.clientWidth||root.current?.clientWidth||960,height=host.clientHeight||root.current?.clientHeight||600
        const dpr=Math.max(.1,Math.min(2,window.devicePixelRatio||1)),long=Math.max(384,Math.ceil(Math.max(width,height)*dpr/128)*128)
        let bw=width>=height?long:long*width/height,bh=width>=height?long*height/width:long
        const fit=Math.min(1,Math.sqrt(2000000/(bw*bh)));bw=Math.max(1,Math.floor(bw*fit));bh=Math.max(1,Math.min(Math.floor(2000000/bw),Math.floor(bh*fit)))
        let renderer:StudyRenderer|undefined
        try{
            renderer=createRenderer(gpu,{...next,managed:true,static:true,renderWidth:width,renderHeight:height,managedBufferWidth:bw,managedBufferHeight:bh,pixelBudget:2000000,colorHost:host},(s,e)=>callback.current(s,e),next.stillTime)
            renderer.renderAt(next.stillTime)
            const stage=document.createElement("canvas");stage.width=gpu.width;stage.height=gpu.height
            const c=stage.getContext("2d",{alpha:false});if(!c)throw new Error("Could not create the study display.");c.drawImage(gpu,0,0)
            const previous=host.getContext("2d",{alpha:false}),oldWidth=host.width,oldHeight=host.height,backup=previous?.getImageData(0,0,oldWidth,oldHeight)
            try{host.width=stage.width;host.height=stage.height;const out=host.getContext("2d",{alpha:false});if(!out)throw new Error("Could not create the study display.");out.drawImage(stage,0,0)}
            catch(error){host.width=oldWidth;host.height=oldHeight;if(backup)host.getContext("2d")?.putImageData(backup,0,0);throw error}
            host.setAttribute?.("data-study-frame-width",String(gpu.width));host.setAttribute?.("data-study-frame-height",String(gpu.height));host.setAttribute?.("data-study-demand-width",String(bw));host.setAttribute?.("data-study-demand-height",String(bh));host.setAttribute?.("data-study-state","ready")
            callback.current("static");return gpu.width*gpu.height
        }catch(error){callback.current("recovering",String(error))}finally{renderer?.dispose()}
    }
    React.useLayoutEffect(()=>{
        if(!ready||!root.current||!display.current)return
        if(target===RenderTarget.export||target===RenderTarget.thumbnail)return
        staticKey.current=""
        const shared=getStudyPool();pool.current=shared
        const added=shared.add({root:root.current,display:display.current,source,target:target===RenderTarget.canvas?"canvas":"preview",settings:current.current,factory:createRenderer,notify:(s,e)=>callback.current(s,e)})
        const saved=snapshot.current;if(saved?.mode===current.current.mode&&saved.stillTime===current.current.stillTime)added.phase=saved.time
        entry.current=added
        return()=>{snapshot.current={mode:added.settings.mode,stillTime:added.settings.stillTime,time:added.phase};shared.remove(added);entry.current=null;pool.current=null}
    },[target,ready])
    React.useLayoutEffect(()=>{
        if(!ready)return
        if(entry.current)pool.current?.update(entry.current,settings)
        else if(target===RenderTarget.export||target===RenderTarget.thumbnail){
            const key=String(target)+"/"+JSON.stringify(settings)+"/"+(display.current?.clientWidth??0)+"/"+(display.current?.clientHeight??0)+"/"+(window.devicePixelRatio||1)
            if(staticKey.current!==key){staticKey.current=key;getStudyPool().runStatic(oneShot)}
        }
    },[settings,target,ready])
    return()=>{if(entry.current)pool.current?.request(entry.current)}
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 704
 * @framerIntrinsicHeight 580
 */
export default function WebsiteBrain(props: Props) {
    const { animate = true, canvasMotion = false, speed = 1, stillTime = 8, interactive = true, showLabels = true, style } = props
    const target = RenderTarget.current(), staticRenderer = useIsStaticRenderer()
    const canvasPreview = canvasMotion && target === RenderTarget.canvas
    const isStatic = target === RenderTarget.export || target === RenderTarget.thumbnail || (target === RenderTarget.canvas && !canvasPreview) || (staticRenderer && !canvasPreview)
    const root = React.useRef<HTMLDivElement>(null), canvas = React.useRef<HTMLCanvasElement>(null)
    const [ready, setReady] = React.useState(false), [paused, setPaused] = React.useState(false)
    const [status, setStatus] = React.useState<Status>("offscreen"), [error, setError] = React.useState("")
    const [trace, setTrace] = React.useState<Settings["trace"]>()
    const press = React.useRef<{ id: number; x: number; y: number } | null>(null)
    const lastPointer = React.useRef<{ x: number; y: number } | null>(null)
    const serial = React.useRef(0), lastScroll = React.useRef(-Infinity)
    React.useEffect(() => {
        let active = true
        const host = root.current, surface = canvas.current, mountedAt = performance.now()
        const localCache = preparedFibers ? "module-ready" : geometryPreparation ? "module-pending" : undefined
        if (host) {
            host.dataset.brainMountAt = mountedAt.toFixed(2); host.dataset.brainLoadState = "preparing"
            delete host.dataset.brainFirstFrameAt; delete host.dataset.brainFirstFrameMs
        }
        // Observe the coordinator's committed, resolution-adequate frame. This
        // also measures cached-copy first frames which never call a renderer.
        const observeFrame = () => {
            if (!active || !host || !surface || host.dataset.brainFirstFrameAt) return
            const state = surface.getAttribute("data-study-state")
            if (state !== "ready" && state !== "live" && state !== "primed") return
            const now = performance.now()
            host.dataset.brainFirstFrameAt = now.toFixed(2); host.dataset.brainFirstFrameMs = (now - mountedAt).toFixed(2)
            host.dataset.brainLoadState = "painted"
        }
        const frameObserver = surface ? new MutationObserver(observeFrame) : undefined
        if (surface) frameObserver?.observe(surface, { attributes: true, attributeFilter: ["data-study-state", "data-study-frame-width", "data-study-frame-height"] })
        prepareGeometry().then(() => {
            if (!active) return
            const profile = getBrainLoadProfile()
            if (host) {
                host.dataset.brainCacheSource = localCache ?? profile.cacheSource ?? "generated"
                host.dataset.brainGeometryOrigin = profile.origin ?? "generated"
                host.dataset.brainCacheReadMs = (profile.persistentReadMs ?? 0).toFixed(2)
                host.dataset.brainCacheReadReason = profile.persistentReadReason ?? "unused"
                host.dataset.brainGeometryMs = (profile.geometryMs ?? 0).toFixed(2)
                host.dataset.brainPlansMs = (profile.plansMs ?? 0).toFixed(2)
                host.dataset.brainPrepareMs = (performance.now() - mountedAt).toFixed(2)
                host.dataset.brainLoadState = host.dataset.brainFirstFrameAt ? "painted" : "ready"
            }
            setReady(true); observeFrame()
        }).catch(error => { if (active) { if (host) host.dataset.brainLoadState = "error"; setError(String(error)) } })
        const scroll = () => { lastScroll.current = performance.now(); if (root.current) { root.current.dataset.brainPointerSuppressed = "true"; root.current.dataset.brainPointerActive = "false" } }
        window.addEventListener("scroll", scroll, { passive: true, capture: true })
        return () => { active = false; frameObserver?.disconnect(); window.removeEventListener("scroll", scroll, true) }
    }, [])
    const settings: Settings = { mode: "website-brain", animate: animate && !paused, static: isStatic, canvasPreview,
        speed: Math.max(0, speed), stillTime, interactive, primary: "#ffd21a", secondary: "#ffffff", ink: "#000000", trace }
    const requestMotion = useStudySurface(root, canvas, settings, target, "WebsiteBrain.tsx", ready, (s, e) => { setStatus(s); setError(e ?? "") })
    const sendTrace = (x: number, y: number) => {
        if (isStatic || !interactive || paused) return
        setTrace({ id: ++serial.current, x: clamp(x, 0, 1), y: clamp(y, 0, 1) }); requestMotion()
    }
    const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontWeight: 700, textTransform: "uppercase", lineHeight: 1 }
    return <div ref={root} data-brain-state="idle" data-brain-port="website" role="group" tabIndex={0}
        aria-label="Monarchic interactive neural streamline field"
        aria-description="Move a mouse or pen to inspect the three-dimensional model. Click, tap, or press Enter to trace a signal through its fibers. Swipe to scroll."
        onPointerMove={event => {
            const previous = lastPointer.current
            const moved = !previous || previous.x !== event.clientX || previous.y !== event.clientY
            lastPointer.current = { x: event.clientX, y: event.clientY }
            if (root.current) {
                root.current.dataset.brainPointerType = event.pointerType
                if (event.pointerType !== "touch" && moved && performance.now() - lastScroll.current >= 180) {
                    const bounds = event.currentTarget.getBoundingClientRect()
                    root.current.dataset.brainPointerSuppressed = "false"
                    root.current.dataset.brainPointerActive = "true"
                    root.current.dataset.brainPointerX = String((event.clientX - bounds.left) / Math.max(1, bounds.width) - .5)
                    root.current.dataset.brainPointerY = String(.5 - (event.clientY - bounds.top) / Math.max(1, bounds.height))
                }
            }
        }}
        onPointerLeave={() => { if (root.current) root.current.dataset.brainPointerActive = "false" }}
        onPointerDown={event => {
            if (root.current) { root.current.dataset.brainPointerType = event.pointerType; if (event.pointerType === "touch") root.current.dataset.brainPointerActive = "false" }
            if (event.button === 0 && !(event.target as Element).closest("button")) press.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
        }}
        onPointerCancel={() => { press.current = null }}
        onPointerUp={event => {
            const start = press.current; press.current = null
            if (!start || start.id !== event.pointerId || (event.target as Element).closest("button") || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8 || performance.now() - lastScroll.current < 180) return
            const bounds = event.currentTarget.getBoundingClientRect()
            sendTrace((event.clientX - bounds.left) / Math.max(1, bounds.width), (event.clientY - bounds.top) / Math.max(1, bounds.height))
        }}
        onKeyDown={event => { if (event.currentTarget !== event.target || (event.key !== "Enter" && event.key !== " ")) return; event.preventDefault(); sendTrace(.46, .47) }}
        style={{ width: "100%", height: "100%", ...style, position: "relative", overflow: "hidden", isolation: "isolate", background: "#000000", color: "#ffd21a", cursor: "crosshair", touchAction: "pan-y", containerType: "inline-size" } as React.CSSProperties}>
        <canvas ref={canvas} role="img" aria-label="The implemented Monarchic website brain: layered anatomical gold and white neural streamlines" style={{ display: "block", width: "100%", height: "100%", pointerEvents: "none" }} />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", border: "1px solid rgba(255,255,255,.045)", background: "linear-gradient(180deg,rgba(0,0,0,.18),transparent 22% 76%,rgba(0,0,0,.4)),linear-gradient(90deg,rgba(0,0,0,.22),transparent 12% 88%,rgba(0,0,0,.22))" }} />
        {showLabels && <>
            <div style={{ ...mono, position: "absolute", top: "clamp(16px,2cqw,28px)", left: "clamp(16px,2.4cqw,40px)", display: "flex", alignItems: "center", gap: 8, borderLeft: "1px solid #ffd21a", paddingLeft: 8, fontSize: 10, pointerEvents: "none" }}>
                <span className="monarchic-website-brain-status-mark" style={{ width: 6, height: 6, background: "#ffd21a", boxShadow: "0 0 0 2px rgba(255,210,26,.12),0 0 16px rgba(255,210,26,.22)" }} />
                <span data-brain-status>{ready ? "SYSTEM STATE / ACTIVE" : "SYSTEM STATE / INITIALIZING"}</span>
            </div>
            <div className="monarchic-website-brain-instructions" style={{ ...mono, position: "absolute", top: "clamp(16px,2cqw,28px)", right: "clamp(16px,2.4cqw,40px)", fontSize: 10, color: "rgba(255,210,26,.62)", pointerEvents: "none" }}>INSPECT / ROTATE&nbsp;&nbsp; SELECT / TRACE</div>
            <ul className="monarchic-website-brain-principles" aria-label="Monarchic system principles" style={{ ...mono, position: "absolute", left: "clamp(16px,2.4cqw,40px)", right: "clamp(16px,2.4cqw,40px)", bottom: "clamp(16px,2cqw,28px)", display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", listStyle: "none", margin: 0, padding: 0, fontSize: 8, letterSpacing: ".035em", background: "linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.2)45%,rgba(0,0,0,.72))", pointerEvents: "none" }}>
                {[["State", "Persistent"], ["Control", "Operator"], ["Execution", "Bounded"], ["Memory", "Explicit"]].map(([key, value]) => <li key={key} style={{ display: "flex", justifyContent: "space-between", gap: 10, borderTop: "1px solid rgba(255,210,26,.28)", padding: "8px 10px 0", color: "rgba(255,210,26,.76)", whiteSpace: "nowrap" }}><span style={{ color: "rgba(255,255,255,.5)" }}>{key}</span>{value}</li>)}
            </ul>
        </>}
        {!isStatic && <button type="button" onClick={event => { event.stopPropagation(); if (status === "waiting") { setPaused(false); requestMotion() } else setPaused(value => !value) }}
            aria-pressed={paused} aria-label={paused || status === "waiting" ? "Play brain animation" : "Pause brain animation"}
            disabled={status === "reduced-motion" || !animate || speed <= 0 || !ready}
            style={{ ...mono, position: "absolute", right: "clamp(16px,2.4cqw,40px)", bottom: "clamp(64px,10cqw,84px)", fontSize: 9, padding: "7px 9px", border: "1px solid rgba(255,210,26,.45)", background: "rgba(0,0,0,.72)", color: "#ffd21a", cursor: "pointer" }}>
            {status === "reduced-motion" ? "REDUCED MOTION" : !ready ? "ASSEMBLING" : !animate || speed <= 0 ? "MOTION OFF" : paused || status === "waiting" ? "PLAY" : "PAUSE"}
        </button>}
        {error && <div role="status" style={{ ...mono, position: "absolute", inset: "45% 10%", textAlign: "center", fontSize: 10 }}>The website brain could not render in this browser.</div>}
        <style>{`[data-brain-port="website"]:focus-visible{outline:2px solid #ffd21a;outline-offset:-2px}.monarchic-website-brain-instructions{display:none}[data-brain-state="tracking"] .monarchic-website-brain-status-mark{box-shadow:0 0 0 3px rgba(255,210,26,.18),0 0 19px rgba(255,210,26,.54)!important;transform:scale(1.18)}[data-brain-state="pulse"] .monarchic-website-brain-status-mark{box-shadow:0 0 0 5px rgba(255,210,26,.16),0 0 26px rgba(255,210,26,.76)!important;transform:scale(1.34)}@container(min-width:640px){.monarchic-website-brain-instructions{display:block}.monarchic-website-brain-principles{grid-template-columns:repeat(4,minmax(0,1fr))!important}}`}</style>
    </div>
}
addPropertyControls(WebsiteBrain, {
    animate: { type: ControlType.Boolean, title: "Animate", defaultValue: true },
    canvasMotion: { type: ControlType.Boolean, title: "Canvas motion", defaultValue: false },
    speed: { type: ControlType.Number, title: "Speed", min: 0, max: 2, step: .05, defaultValue: 1 },
    stillTime: { type: ControlType.Number, title: "Still time", min: 0, max: 60, step: .5, defaultValue: 8 },
    interactive: { type: ControlType.Boolean, title: "Inspect / trace", defaultValue: true },
    showLabels: { type: ControlType.Boolean, title: "Site labels", defaultValue: true },
})
