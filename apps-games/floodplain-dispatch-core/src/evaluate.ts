import {
  NEED_STEPS,
  SCORE_PER_FLOODED_HOUSE,
  SCORE_PER_IRRIGATED_FIELD,
  SCORE_PER_SUPPLIED_HOUSE,
  SCORE_PER_UNSPENT_POINT,
  SCORE_STAR_ONE,
} from "./constants";
import { totalCost } from "./placement";
import type { Evaluation, MapDef, Placement, SeasonResult } from "./types";

export function evaluate(
  def: MapDef,
  result: SeasonResult,
  placements: readonly Placement[],
): Evaluation {
  const { houses, fields } = result.metrics;
  const housesSupplied = houses.filter((h) => h.suppliedSteps >= NEED_STEPS).length;
  const housesFlooded = houses.filter((h) => h.floodedSteps >= 1).length;
  const fieldsIrrigated = fields.filter((f) => f.wetSteps >= NEED_STEPS).length;
  const spend = totalCost(placements);
  const starSupply = housesSupplied === houses.length && fieldsIrrigated === fields.length;
  const starDry = starSupply && housesFlooded === 0;
  const starThrift = starDry && spend <= def.par;
  const stars = starThrift ? 3 : starDry ? 2 : starSupply ? 1 : 0;
  const budgetLeft = def.budget - spend;
  const raw =
    (starSupply ? SCORE_STAR_ONE : 0) +
    SCORE_PER_SUPPLIED_HOUSE * housesSupplied +
    SCORE_PER_IRRIGATED_FIELD * fieldsIrrigated -
    SCORE_PER_FLOODED_HOUSE * housesFlooded +
    SCORE_PER_UNSPENT_POINT * Math.max(0, budgetLeft);
  return {
    housesTotal: houses.length,
    housesSupplied,
    housesFlooded,
    fieldsTotal: fields.length,
    fieldsIrrigated,
    spend,
    par: def.par,
    budgetLeft,
    starSupply,
    starDry,
    starThrift,
    stars,
    cleared: stars >= 1,
    score: Math.max(0, raw),
  };
}
