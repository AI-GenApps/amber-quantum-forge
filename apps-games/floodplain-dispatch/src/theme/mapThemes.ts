import { THEMES } from "@web-games/floodplain-dispatch-core";
import { mixHex } from "./contrast";
import { PALETTE } from "./tokens";

export interface MapTheme {
  id: string;
  name: string;
  background: string;
  landLow: string;
  landHigh: string;
  fieldBase: string;
  fieldRow: string;
  waterShallow: string;
  waterMid: string;
  waterDeep: string;
  sea: string;
  shore: string;
  leaf: string;
  leafDark: string;
  trunk: string;
  rock: string;
  wall: string;
  roof: string;
  haze: string | null;
  windowLight: string | null;
  lightHighlight: string;
  lightShadow: string;
}

const base: MapTheme = {
  id: "gouache-meadow",
  name: "Gouache Meadow",
  background: PALETTE.night,
  landLow: "#7d9a5c",
  landHigh: "#b6cb92",
  fieldBase: PALETTE.ochre,
  fieldRow: PALETTE.ochreDeep,
  waterShallow: PALETTE.waterLight,
  waterMid: PALETTE.water,
  waterDeep: PALETTE.waterDeep,
  sea: PALETTE.sea,
  shore: PALETTE.ink,
  leaf: PALETTE.meadowDeep,
  leafDark: "#3a512c",
  trunk: "#6b4a2a",
  rock: PALETTE.rock,
  wall: PALETTE.paper2,
  roof: PALETTE.clay,
  haze: null,
  windowLight: null,
  lightHighlight: "#ffffff",
  lightShadow: PALETTE.ink,
};

const overrides: Readonly<Record<string, Partial<MapTheme>>> = {
  "gouache-meadow": {},
  "harvest-ochre": {
    landLow: "#b79b52",
    landHigh: "#e0cb8c",
    fieldBase: "#c0662a",
    fieldRow: "#6e3a14",
    leaf: "#6a7a2e",
    leafDark: "#4a561f",
    roof: "#9c4a22",
  },
  "reed-and-mist": {
    landLow: "#92a48e",
    landHigh: "#c4d2bf",
    fieldBase: "#b6ae78",
    fieldRow: "#6b6a3c",
    leaf: "#5d7560",
    leafDark: "#42584a",
    roof: "#7a5a4a",
    haze: "#e8efe9",
  },
  "terracotta-dry": {
    landLow: "#c88b64",
    landHigh: "#e6bd9c",
    fieldBase: "#a3b18a",
    fieldRow: "#4d6a45",
    leaf: "#7a8a4a",
    leafDark: "#566330",
    roof: "#8a3a22",
  },
  "slate-highland": {
    landLow: "#8996a0",
    landHigh: "#bcc7cb",
    fieldBase: "#a2ad6e",
    fieldRow: "#55632f",
    leaf: "#586f5a",
    leafDark: "#3f5242",
    rock: "#6f7a82",
    roof: "#5c4a52",
  },
  "night-lantern": {
    background: "#0f1a22",
    landLow: "#34483c",
    landHigh: "#5d7c66",
    fieldBase: "#6d5a2c",
    fieldRow: "#d8a64a",
    waterShallow: "#3b8dc4",
    waterMid: "#2a7ab5",
    waterDeep: "#1f5f8f",
    sea: "#1f5f8f",
    shore: PALETTE.paper,
    leaf: "#2f4a38",
    leafDark: "#1f3326",
    wall: "#c9bfa3",
    roof: "#8a3a2a",
    windowLight: "#ffd27a",
    lightHighlight: "#ffd27a",
    lightShadow: "#0f1a22",
  },
  "paper-blueprint": {
    background: "#14233a",
    landLow: "#ebe1c4",
    landHigh: "#faf5e4",
    fieldBase: "#d9c993",
    fieldRow: "#2f5f93",
    waterShallow: "#b4cde4",
    waterMid: "#6b98c6",
    waterDeep: "#2f5f93",
    sea: "#2f5f93",
    shore: "#1d3557",
    leaf: "#8fb0d2",
    leafDark: "#2f5f93",
    trunk: "#1d3557",
    rock: "#7b93ad",
    wall: "#faf5e4",
    roof: "#2f5f93",
    lightHighlight: "#ffffff",
    lightShadow: "#1d3557",
  },
};

export const MAP_THEMES: readonly MapTheme[] = THEMES.map((def) => ({
  ...base,
  ...(overrides[def.id] ?? {}),
  id: def.id,
  name: def.name,
}));

export const DEFAULT_MAP_THEME: MapTheme = MAP_THEMES[0] as MapTheme;

export function mapThemeFor(id: string): MapTheme {
  return MAP_THEMES.find((theme) => theme.id === id) ?? DEFAULT_MAP_THEME;
}

export const MAX_TERRAIN_LEVEL = 7 as const;

export function landColor(theme: MapTheme, height: number): string {
  const level = Math.max(0, Math.min(MAX_TERRAIN_LEVEL, height));
  return mixHex(theme.landLow, theme.landHigh, level / MAX_TERRAIN_LEVEL);
}

export function waterColor(theme: MapTheme, depth: number): string {
  if (depth <= 2) return theme.waterShallow;
  if (depth <= 4) return theme.waterMid;
  return theme.waterDeep;
}

export interface ContrastPair {
  id: string;
  fg: string;
  bg: string;
  kind: "text" | "ui";
}

export function themePairs(theme: MapTheme): ContrastPair[] {
  const pair = (id: string, fg: string, bg: string, kind: "text" | "ui"): ContrastPair => ({
    id,
    fg,
    bg,
    kind,
  });
  const lows = [theme.landLow, theme.landHigh];
  return [
    ...lows.map((land, i) => pair(`shore-on-land-${i}`, theme.shore, land, "ui")),
    pair("shore-on-field", theme.shore, theme.fieldBase, "ui"),
    pair("shore-on-shallow", theme.shore, theme.waterShallow, "ui"),
    pair("shore-on-mid", theme.shore, theme.waterMid, "ui"),
    pair("paper-on-sea", PALETTE.paper, theme.sea, "ui"),
    pair("paper-on-deep", PALETTE.paper, theme.waterDeep, "text"),
    pair("ink-on-paper-chip", PALETTE.ink, PALETTE.paper, "text"),
    pair("text-on-background", PALETTE.paper, theme.background, "text"),
    pair("muted-on-background", PALETTE.paper2, theme.background, "text"),
    pair("focus-on-background", PALETTE.waterLight, theme.background, "ui"),
  ];
}
