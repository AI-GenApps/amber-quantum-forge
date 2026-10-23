import {
  CANAL_EDGE_CAP,
  CREST_BARRIER,
  FLOOD_DEPTH,
  FREEZE_PRICE,
  HINT_PRICE,
  MAX_FREEZES,
  NEED_STEPS,
  PIECE_COSTS,
  PUMP_RATE,
  RESERVOIR_CAPACITY,
  SCORE_PER_FLOODED_HOUSE,
  SCORE_PER_IRRIGATED_FIELD,
  SCORE_PER_SUPPLIED_HOUSE,
  SCORE_PER_UNSPENT_POINT,
  SCORE_STAR_ONE,
  STEPS_PER_WEEK,
  SUPPLY_DEPTH,
  TAGLINE,
} from "@web-games/floodplain-dispatch-core";

export interface HowToPage {
  id: string;
  title: string;
  body: readonly string[];
}

/** The six pages. Every number is read from the core constants so the text cannot drift. */
export const HOWTO_PAGES: readonly HowToPage[] = [
  {
    id: "goal",
    title: "Goal",
    body: [
      TAGLINE,
      "Bring water to every house and every field, keep every house dry, and spend no more than par.",
      "Plan first, then press Run season. The season plays out week by week and cannot be changed while it runs.",
    ],
  },
  {
    id: "pieces",
    title: "Pieces",
    body: [
      `Canal (${PIECE_COSTS.canal}): a groove that carries water fast.`,
      `Sandbags (${PIECE_COSTS.barrier}): raise the ground by ${CREST_BARRIER}.`,
      `Sluice gate (${PIECE_COSTS.gate}): open only between two weeks you choose.`,
      `Pump (${PIECE_COSTS.pump}): pushes up to ${PUMP_RATE} units a step to the cell it faces, uphill too.`,
      `Reservoir (${PIECE_COSTS.reservoir}): a walled tank that holds ${RESERVOIR_CAPACITY} units.`,
      "Costs come out of the map budget. The eraser removes a piece and refunds it in full.",
    ],
  },
  {
    id: "water",
    title: "Reading the water",
    body: [
      "Water runs downhill. The river inlet and the sea never take a piece.",
      `Water moves along a canal up to ${CANAL_EDGE_CAP} units a step, and much more slowly over open ground.`,
      `A house is supplied after ${NEED_STEPS} steps with a canal of depth ${SUPPLY_DEPTH} or more beside it.`,
      `A house floods if water on its own cell reaches depth ${FLOOD_DEPTH}, even for a single step.`,
    ],
  },
  {
    id: "forecast",
    title: "Forecast and weeks",
    body: [
      "The bar above the board shows every surge, drought and tide before you run. Nothing is hidden.",
      "Surges raise the river, droughts cut it, tides lift the sea, and storm tides lift it further.",
      `A week is ${STEPS_PER_WEEK} steps. Use the speed buttons, pause, or scrub the bar to replay any moment.`,
    ],
  },
  {
    id: "stars",
    title: "Stars and scoring",
    body: [
      "One star: every house supplied and every field irrigated.",
      "Two stars: one star and no flooded house.",
      "Three stars: two stars and spend no more than par.",
      `Score: ${SCORE_STAR_ONE} for the first star, ${SCORE_PER_SUPPLIED_HOUSE} per supplied house, ${SCORE_PER_IRRIGATED_FIELD} per irrigated field, minus ${SCORE_PER_FLOODED_HOUSE} per flooded house, plus ${SCORE_PER_UNSPENT_POINT} per unspent budget point.`,
      `A hint shows the next piece of the reference plan and costs ${HINT_PRICE.campaign} coins on a campaign map.`,
    ],
  },
  {
    id: "daily",
    title: "Daily Dispatch",
    body: [
      "A new map every day, the same for everyone on that date, and it always has a three-star plan.",
      "Clear it with at least one star to extend your streak. Daily stars do not count toward the campaign.",
      `A streak freeze covers one missed day. It costs ${FREEZE_PRICE} coins and you can hold ${MAX_FREEZES}.`,
      `Daily hints cost ${HINT_PRICE.daily} coins.`,
    ],
  },
];
