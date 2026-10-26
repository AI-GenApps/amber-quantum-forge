import { mixHex } from "../../theme/contrast";
import { PALETTE as P } from "../../theme/tokens";

const mix = mixHex;

/** Every colour the code-drawn art uses: palette tokens or mixes of them. */
export const C = {
  paper: P.paper,
  paperDark: P.paperDark,
  ink: P.ink,
  inkSoft: P.inkSoft,
  night: P.night,
  nightMid: P.nightMid,
  lamp: P.lamp,
  lampDeep: P.lampDeep,
  brick: P.brick,
  teal: P.teal,
  sage: P.sage,
  rain: P.rain,
  skinFair: mix(P.paperDark, P.lamp, 0.18),
  skinWarm: mix(P.paperDark, P.lampDeep, 0.35),
  skinMid: mix(P.paperDark, P.lampDeep, 0.6),
  skinDeep: mix(P.lampDeep, P.ink, 0.5),
  silver: mix(P.paper, P.rain, 0.5),
  white: mix(P.paper, P.rain, 0.12),
  sand: mix(P.lamp, P.paperDark, 0.45),
  auburn: mix(P.brick, P.ink, 0.35),
  coal: mix(P.ink, P.night, 0.55),
  brown: mix(P.ink, P.lampDeep, 0.35),
  navy: mix(P.nightMid, P.night, 0.5),
  forest: mix(P.sage, P.night, 0.45),
  tweed: mix(P.inkSoft, P.paperDark, 0.2),
  denim: mix(P.rain, P.nightMid, 0.55),
  mustard: mix(P.lamp, P.lampDeep, 0.2),
  glow: mix(P.lamp, P.paper, 0.4),
  shade: mix(P.ink, P.night, 0.4),
  wood: mix(P.lampDeep, P.ink, 0.55),
  wall: mix(P.nightMid, P.night, 0.35),
  sky: mix(P.rain, P.paper, 0.45),
  steam: mix(P.paper, P.rain, 0.3),
  terracotta: mix(P.brick, P.lamp, 0.35),
} as const;

export type ColorName = keyof typeof C;

export const FALLBACK_COLORS: ReadonlySet<string> = new Set(Object.values(C));

export function tint(name: ColorName, other: ColorName, amount: number): string {
  return mix(C[name], C[other], amount);
}
