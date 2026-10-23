import { circle, poly, type Role, rect, type Shape } from "./shapes";
import type { SlotId } from "./slots";

export interface Fallback {
  label: string;
  gradient?: readonly [Role, Role];
  shapes: readonly Shape[];
}

const SHADOW: Shape = circle(52, 88, 34, "ink", { a: 0.18 });
const line = { stroke: "ink" as Role, sw: 3 };

const cottage: Shape[] = [
  SHADOW,
  rect(20, 46, 60, 40, "wall", line),
  poly([12, 50, 50, 14, 88, 50], "roof", line),
  rect(44, 62, 13, 24, "ochreDeep", line),
  rect(26, 56, 11, 11, "waterLight", { stroke: "ink", sw: 2 }),
  rect(64, 56, 11, 11, "waterLight", { stroke: "ink", sw: 2 }),
];

const townhouse: Shape[] = [
  SHADOW,
  rect(24, 28, 52, 58, "wall", line),
  poly([18, 32, 50, 8, 82, 32], "roof", line),
  rect(32, 38, 10, 10, "waterLight", { stroke: "ink", sw: 2 }),
  rect(58, 38, 10, 10, "waterLight", { stroke: "ink", sw: 2 }),
  rect(32, 56, 10, 10, "waterLight", { stroke: "ink", sw: 2 }),
  rect(58, 56, 10, 10, "waterLight", { stroke: "ink", sw: 2 }),
  rect(44, 68, 12, 18, "ochreDeep", line),
];

const mill: Shape[] = [
  SHADOW,
  poly([30, 86, 36, 34, 64, 34, 70, 86], "wall", line),
  poly([30, 38, 50, 14, 70, 38], "roof", line),
  rect(44, 66, 12, 20, "ochreDeep", line),
  poly([50, 36, 16, 20], undefined, { stroke: "ochreDeep", sw: 5, open: true }),
  poly([50, 36, 84, 52], undefined, { stroke: "ochreDeep", sw: 5, open: true }),
  circle(50, 36, 4, "ink"),
];

const barn: Shape[] = [
  SHADOW,
  poly([14, 86, 14, 44, 30, 22, 70, 22, 86, 44, 86, 86], "clay", line),
  rect(36, 52, 28, 34, "wall", line),
  poly([36, 52, 64, 86], undefined, { stroke: "ink", sw: 2.5, open: true }),
  poly([64, 52, 36, 86], undefined, { stroke: "ink", sw: 2.5, open: true }),
  rect(42, 30, 16, 10, "wall", { stroke: "ink", sw: 2 }),
];

const school: Shape[] = [
  SHADOW,
  rect(14, 48, 72, 38, "wall", line),
  poly([10, 52, 50, 28, 90, 52], "roof", line),
  rect(42, 12, 16, 18, "wall", line),
  poly([40, 14, 50, 4, 60, 14], "roof", line),
  rect(22, 58, 10, 10, "waterLight", { stroke: "ink", sw: 2 }),
  rect(68, 58, 10, 10, "waterLight", { stroke: "ink", sw: 2 }),
  rect(44, 62, 12, 24, "ochreDeep", line),
];

const pump: Shape[] = [
  SHADOW,
  circle(50, 58, 28, "rock", line),
  circle(50, 58, 16, "waterDeep", line),
  rect(42, 20, 16, 22, "rock", line),
  circle(50, 58, 6, "paper", { stroke: "ink", sw: 2 }),
];

const reservoir: Shape[] = [
  SHADOW,
  circle(50, 54, 34, "rock", line),
  circle(50, 54, 24, "waterDeep", line),
  poly([34, 50, 42, 46, 50, 50, 58, 46, 66, 50], undefined, {
    stroke: "waterLight",
    sw: 3,
    open: true,
  }),
  poly([34, 62, 42, 58, 50, 62, 58, 58, 66, 62], undefined, {
    stroke: "waterLight",
    sw: 3,
    open: true,
  }),
];

const gate: Shape[] = [
  SHADOW,
  rect(10, 40, 80, 38, "water", line),
  rect(14, 22, 10, 56, "rock", line),
  rect(76, 22, 10, 56, "rock", line),
  rect(34, 30, 8, 40, "ochreDeep", line),
  rect(46, 30, 8, 40, "ochreDeep", line),
  rect(58, 30, 8, 40, "ochreDeep", line),
  rect(10, 20, 80, 8, "ochre", line),
];

const barrier: Shape[] = [
  SHADOW,
  rect(10, 58, 38, 24, "ochre", { stroke: "ink", sw: 3, r: 10 }),
  rect(52, 58, 38, 24, "ochre", { stroke: "ink", sw: 3, r: 10 }),
  rect(30, 36, 40, 24, "ochre", { stroke: "ink", sw: 3, r: 10 }),
  poly([32, 48, 68, 48], undefined, { stroke: "ochreDeep", sw: 2.5, open: true }),
];

const windmill: Shape[] = [
  SHADOW,
  poly([34, 86, 40, 40, 60, 40, 66, 86], "wall", line),
  poly([36, 44, 50, 26, 64, 44], "roof", line),
  poly([50, 40, 18, 18], undefined, { stroke: "ochreDeep", sw: 5, open: true }),
  poly([50, 40, 82, 18], undefined, { stroke: "ochreDeep", sw: 5, open: true }),
  poly([50, 40, 18, 62], undefined, { stroke: "ochreDeep", sw: 5, open: true }),
  poly([50, 40, 82, 62], undefined, { stroke: "ochreDeep", sw: 5, open: true }),
  circle(50, 40, 5, "ink"),
];

const oak: Shape[] = [
  SHADOW,
  rect(44, 60, 12, 26, "trunk", line),
  circle(50, 40, 28, "leaf", line),
  circle(36, 50, 16, "leafDark", { a: 0.7 }),
];

const poplar: Shape[] = [
  SHADOW,
  rect(46, 70, 8, 16, "trunk", line),
  poly([50, 6, 70, 40, 66, 76, 34, 76, 30, 40], "leaf", line),
  poly([50, 14, 50, 70], undefined, { stroke: "leafDark", sw: 2.5, open: true }),
];

const willow: Shape[] = [
  SHADOW,
  rect(44, 52, 12, 34, "trunk", line),
  circle(50, 36, 30, "leaf", line),
  poly([24, 44, 22, 76], undefined, { stroke: "leafDark", sw: 4, open: true }),
  poly([38, 56, 36, 82], undefined, { stroke: "leafDark", sw: 4, open: true }),
  poly([62, 56, 64, 82], undefined, { stroke: "leafDark", sw: 4, open: true }),
  poly([76, 44, 78, 76], undefined, { stroke: "leafDark", sw: 4, open: true }),
];

const river: Shape[] = [
  poly([30, 0, 44, 30, 40, 60, 56, 100, 76, 100, 60, 60, 64, 30, 50, 0], "water", { a: 0.8 }),
];

const hills: Shape[] = [
  circle(20, 100, 46, "meadow", { a: 0.6 }),
  circle(76, 104, 52, "meadowDeep", { a: 0.5 }),
];

export const FALLBACKS: Readonly<Record<SlotId, Fallback>> = {
  icon: {
    label: "Roof and wave badge",
    shapes: [
      rect(4, 4, 92, 92, "night", { r: 20 }),
      poly([16, 54, 50, 20, 84, 54], "ochre", { stroke: "paper", sw: 4 }),
      poly([20, 66, 32, 58, 44, 66, 56, 58, 68, 66, 80, 58], undefined, {
        stroke: "waterLight",
        sw: 5,
        open: true,
      }),
      poly([20, 80, 32, 72, 44, 80, 56, 72, 68, 80, 80, 72], undefined, {
        stroke: "water",
        sw: 5,
        open: true,
      }),
    ],
  },
  "key-art": {
    label: "Title backdrop with a river",
    gradient: ["night", "meadowDeep"],
    shapes: [...hills, ...river],
  },
  "house-cottage": { label: "Cottage", shapes: cottage },
  pump: { label: "Pump", shapes: pump },
  "house-townhouse": { label: "Townhouse", shapes: townhouse },
  "house-mill": { label: "Mill", shapes: mill },
  "house-barn": { label: "Barn", shapes: barn },
  "house-school": { label: "School", shapes: school },
  reservoir: { label: "Reservoir", shapes: reservoir },
  "sluice-gate": { label: "Sluice gate", shapes: gate },
  "sandbag-barrier": { label: "Sandbags", shapes: barrier },
  windmill: { label: "Windmill", shapes: windmill },
  "tree-oak": { label: "Oak", shapes: oak },
  "tree-poplar": { label: "Poplar", shapes: poplar },
  "tree-willow": { label: "Willow", shapes: willow },
  "backdrop-valley": { label: "Valley backdrop", gradient: ["night", "meadowDeep"], shapes: [] },
  "backdrop-delta": { label: "Delta backdrop", gradient: ["night", "waterDeep"], shapes: [] },
  "backdrop-highland": { label: "Highland backdrop", gradient: ["night", "rock"], shapes: [] },
  "backdrop-estuary": { label: "Estuary backdrop", gradient: ["night", "sea"], shapes: [] },
  "feature-graphic": {
    label: "Store feature graphic",
    gradient: ["night", "water"],
    shapes: [...hills, ...river],
  },
};
