import { carSpecOf, MAX_LEVELS, upgradedSpec } from "../../src/index";
import { readRoster } from "../economy/roster-support";
import { describeHandling } from "./handling-suite";

for (const entry of readRoster().cars) {
  describeHandling(carSpecOf(entry));
  describeHandling({ ...upgradedSpec(entry, MAX_LEVELS), id: `${entry.id}+max` });
}
