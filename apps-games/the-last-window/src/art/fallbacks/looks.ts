import { C } from "./colors";

export type HairStyle = "bun" | "cap" | "braid" | "curls" | "flatcap" | "bob" | "wispy" | "messy";
export type Gear =
  | "round-glasses"
  | "tortoise-glasses"
  | "spectacles"
  | "headphones"
  | "stethoscope"
  | "bowtie"
  | "scarf"
  | "moustache"
  | "freckles"
  | "satchel"
  | "apron"
  | "overalls"
  | "vest";

export interface Look {
  skin: string;
  hair: string;
  outfit: string;
  trim: string;
  style: HairStyle;
  gear: readonly Gear[];
}

/** Customer 1 to 8, matching the look lines in `content-plan.md`. */
export const REGULAR_LOOKS: readonly Look[] = [
  {
    skin: C.skinFair,
    hair: C.silver,
    outfit: C.navy,
    trim: C.paperDark,
    style: "bun",
    gear: ["round-glasses"],
  },
  {
    skin: C.skinFair,
    hair: C.sand,
    outfit: C.nightMid,
    trim: C.lampDeep,
    style: "cap",
    gear: ["overalls", "freckles"],
  },
  {
    skin: C.skinMid,
    hair: C.coal,
    outfit: C.sage,
    trim: C.paperDark,
    style: "braid",
    gear: ["tortoise-glasses", "satchel"],
  },
  {
    skin: C.skinDeep,
    hair: C.coal,
    outfit: C.denim,
    trim: C.lamp,
    style: "curls",
    gear: ["apron", "headphones"],
  },
  {
    skin: C.skinWarm,
    hair: C.silver,
    outfit: C.brick,
    trim: C.lamp,
    style: "flatcap",
    gear: ["vest", "moustache"],
  },
  {
    skin: C.skinMid,
    hair: C.coal,
    outfit: C.forest,
    trim: C.paper,
    style: "bob",
    gear: ["stethoscope"],
  },
  {
    skin: C.skinFair,
    hair: C.white,
    outfit: C.tweed,
    trim: C.brick,
    style: "wispy",
    gear: ["spectacles", "bowtie"],
  },
  {
    skin: C.skinWarm,
    hair: C.auburn,
    outfit: C.mustard,
    trim: C.nightMid,
    style: "messy",
    gear: ["scarf"],
  },
];

export function lookFor(regularId: number): Look {
  return REGULAR_LOOKS[(regularId - 1 + REGULAR_LOOKS.length) % REGULAR_LOOKS.length] as Look;
}
