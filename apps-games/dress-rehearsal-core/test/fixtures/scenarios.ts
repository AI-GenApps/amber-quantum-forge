import { ALL_COLOURS, ERA_ORDER, FEATURES, RULE_KINDS } from "../../src/constants";
import { createPrng } from "../../src/prng";
import type { Prng } from "../../src/prng";
import { SLOT_ORDER, SLOT_SET_IDS } from "../../src/slots";
import type { ChallengeShape, Look, MaxHues, Rule } from "../../src/types";
import { STARTER_PIECES } from "./starter-pieces";

export interface Scenario {
  readonly challenge: ChallengeShape;
  readonly look: Look;
}

function randomRule(prng: Prng): Rule {
  const kind = prng.pick(RULE_KINDS);
  switch (kind) {
    case "palette-warm":
    case "palette-cool":
      return { kind };
    case "max-hues":
      return { kind, max: prng.int(4) as MaxHues };
    case "include-colour":
    case "avoid-colour":
      return { kind, colour: prng.pick(ALL_COLOURS) };
    case "era-min":
    case "era-max":
      return { kind, era: prng.pick(ERA_ORDER) };
    case "formality-min":
    case "formality-max":
      return { kind, value: 1 + prng.int(5) };
    case "warmth-min":
    case "warmth-max":
      return { kind, value: prng.int(14) };
    case "needs-feature":
      return { kind, feature: prng.pick(FEATURES) };
    case "max-spend":
    case "min-spend":
      return { kind, amount: 100 * prng.int(9) };
    case "include-piece":
    case "avoid-piece":
      return { kind, pieceId: prng.pick(STARTER_PIECES).id };
  }
}

function randomLook(prng: Prng): Look {
  const look: Look = {};
  for (const slot of SLOT_ORDER) {
    const roll = prng.next();
    if (roll < 0.12) continue;
    if (roll < 0.16) {
      look[slot] = "unknown-piece";
      continue;
    }
    if (roll < 0.2) {
      look[slot] = prng.pick(STARTER_PIECES).id;
      continue;
    }
    const choices = STARTER_PIECES.filter((piece) => piece.category === slot);
    if (choices.length > 0) look[slot] = prng.pick(choices).id;
  }
  return look;
}

export function makeScenarios(seed: number, count: number): Scenario[] {
  const prng = createPrng(seed);
  const out: Scenario[] = [];
  for (let i = 0; i < count; i += 1) {
    const rules: Rule[] = [];
    const ruleCount = 2 + prng.int(3);
    for (let r = 0; r < ruleCount; r += 1) rules.push(randomRule(prng));
    out.push({
      challenge: { id: `scenario-${i}`, slotSet: prng.pick(SLOT_SET_IDS), rules },
      look: randomLook(prng),
    });
  }
  return out;
}
