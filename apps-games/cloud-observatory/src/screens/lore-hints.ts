import {
  boonById,
  constellationById,
  instrumentById,
  type LoreEntry,
} from "@web-games/cloud-observatory-core";
import { t } from "../strings";

/** What unlocks a locked entry, from its trigger. */
export function loreHint(entry: LoreEntry): string {
  const trigger = entry.trigger;
  switch (trigger.kind) {
    case "instrument":
      return t("journal.hint.instrument", {
        name: instrumentById.get(trigger.id)?.name ?? trigger.id,
      });
    case "constellation":
      return t("journal.hint.constellation", {
        name: constellationById.get(trigger.id)?.name ?? trigger.id,
      });
    case "boon":
      return t("journal.hint.boon", { name: boonById.get(trigger.id)?.name ?? trigger.id });
  }
}
