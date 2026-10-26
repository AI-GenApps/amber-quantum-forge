import type { Category, SchemeName, Stars } from "../types";
import type { FrameDef, HowToPage, ResultHeadline, TrayTabLabels } from "./types";

export const GAME_TITLE = "Dress Rehearsal";

export const TAGLINE = "Style the look. Meet the brief.";

export const TRAY_TAB_LABELS: TrayTabLabels = {
  top: "Tops",
  bottom: "Bottoms",
  dress: "Dresses",
  outer: "Outerwear",
  shoes: "Shoes",
  bag: "Bags",
  hat: "Hats",
  accessory: "Extras",
};

export const TRAY_TAB_ORDER: readonly Category[] = [
  "top",
  "bottom",
  "dress",
  "outer",
  "shoes",
  "bag",
  "hat",
  "accessory",
];

export const RESULT_HEADLINES: readonly ResultHeadline[] = [
  { stars: 3, text: "Polished. The client is speechless." },
  { stars: 2, text: "On brief. Add a little polish." },
  { stars: 1, text: "Presentable, with notes." },
  { stars: 0, text: "Not ready for the rehearsal." },
];

export function resultHeadline(stars: Stars): string {
  return RESULT_HEADLINES.find((headline) => headline.stars === stars)?.text ?? "";
}

export const STAR_NAMES: readonly [string, string, string] = [
  "Presentable",
  "On brief",
  "Polished",
];

export const HARMONY_PART_LABELS: readonly string[] = [
  "Colour scheme",
  "Neutral anchor",
  "Dress code",
  "Era match",
  "Season sense",
];

export const SCHEME_NAMES: readonly SchemeName[] = [
  "Neutral",
  "Tonal",
  "Analogous",
  "Complementary",
  "Triad pair",
  "Awkward pair",
  "Triadic",
  "Analogous trio",
  "Busy",
  "Too many colours",
];

export const HOW_TO_PAGES: readonly HowToPage[] = [
  { id: "brief", title: "The brief" },
  { id: "pieces", title: "Pieces and slots" },
  { id: "rules", title: "Rules" },
  { id: "harmony", title: "Harmony" },
  { id: "stars", title: "Stars and scoring" },
  { id: "daily-gallery", title: "Daily Fitting and Gallery" },
];

export const FRAMES: readonly FrameDef[] = [
  { id: "plain", name: "Plain" },
  { id: "paper", name: "Paper Border" },
  { id: "polaroid", name: "Polaroid" },
  { id: "magazine", name: "Magazine Cover" },
];
