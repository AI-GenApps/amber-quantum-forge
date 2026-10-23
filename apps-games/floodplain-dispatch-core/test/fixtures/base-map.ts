import { c } from "../../src/content/dsl";
import type { CampaignMap } from "../../src/content/types";

export const BASE_MAP: CampaignMap = {
  id: "v01",
  name: "First Trickle",
  region: "valley",
  brief: "One house, one field, one river. Dig a canal and open the tap.",
  layout: [
    ".7 I6 .7 .5 .4 .3 T2 .1",
    ".5 .5 .5 .4 .3 .2 .1 .1",
    "H3 .3 S0 .3 .2 .1 .1 .1",
    "T2 .3 .3 .2 .1 T1 .1 .1",
    ".2 .3 .2 .2 .2 .2 .2 T2",
    ".2 F2 .2 .2 .2 .2 .2 .2",
    ".2 .2 .2 .2 .2 T2 .2 .2",
    ".2 T2 .2 .2 .2 .2 .2 .2",
    ".2 .2 .2 .2 .3 .2 T2 .2",
    ".2 .2 .3 .3 .3 .2 .2 .1",
    ".2 .2 .3 .3 .3 .2 .2 .1",
    ".2 .2 .3 .3 .3 .2 .2 .1",
  ],
  inlets: [2],
  houseKinds: ["cottage"],
  events: [],
  tide: null,
  weeks: 20,
  pieces: ["canal"],
  par: 6,
  budget: 9,
  reference: [c(0, 0), c(0, 1), c(1, 1), c(1, 2), c(1, 3), c(1, 4)],
};
