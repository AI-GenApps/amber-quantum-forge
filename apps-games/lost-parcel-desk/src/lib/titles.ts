import type { CaseDef } from "@web-games/lost-parcel-desk-core";
import { getCase } from "@web-games/lost-parcel-desk-core";
import { t } from "../strings";

/** "Case 01: The Seaside Postcard" for campaign cases and the daily label for generated ones. */
export function caseTitle(def: CaseDef, daily: boolean): string {
  if (daily) return t("dailyTitle");
  const item = getCase(def.id);
  return item ? t("caseHeading", { id: item.id, title: item.title }) : def.id;
}
