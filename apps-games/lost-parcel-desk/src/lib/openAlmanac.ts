import type { Clue } from "@web-games/lost-parcel-desk-core";
import type { AppRouter } from "../nav";
import { almanacEntryFor, almanacKey } from "./almanacLink";

/** Opens the Almanac clue list; the entry that explains the clue is highlighted when one is known. */
export function openAlmanac(router: AppRouter, clue: Pick<Clue, "id" | "tag">): void {
  const entry = almanacEntryFor(clue);
  router.push("almanac", entry ? { tab: "clues", entry: almanacKey(entry) } : { tab: "clues" });
}
