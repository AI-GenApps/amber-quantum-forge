import { describe, expect, it } from "vitest";
import * as core from "../src/index";

describe("public API", () => {
  it("re-exports the engine from the package root", () => {
    for (const name of [
      "version",
      "createPrng",
      "hashString",
      "SLOT_ORDER",
      "SLOT_SETS",
      "openSlots",
      "place",
      "clearSlot",
      "isComplete",
      "missingSlots",
      "canPlace",
      "checkRule",
      "ruleCode",
      "parseRuleCode",
      "ruleChipText",
      "ruleDetail",
      "RULE_FAMILY",
      "harmony",
      "scoreLook",
      "livePreview",
      "enumerateLooks",
      "countLooks",
      "solveLook",
      "pickHint",
      "UNKNOWN",
      "HINT_NODE_CAP",
      "THREE_STAR_HARMONY",
    ]) {
      expect(core, name).toHaveProperty(name);
    }
  });
});
