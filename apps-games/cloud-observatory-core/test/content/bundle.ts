import { ACHIEVEMENTS } from "../../src/content/achievements";
import { CATALOG } from "../../src/content/catalog";
import { LORE, LORE_CHAPTERS } from "../../src/content/lore";
import type { Bundle } from "./validators";

export const BUNDLE: Bundle = {
  catalog: CATALOG,
  lore: LORE,
  chapters: LORE_CHAPTERS,
  achievements: ACHIEVEMENTS,
};

export function cloneBundle(): Bundle {
  return JSON.parse(JSON.stringify(BUNDLE)) as Bundle;
}
