import { RULE_FAMILY, THREE_STAR_HARMONY } from "../constants";
import { CLIENTS } from "../content/clients";
import type { ChallengeDef } from "../content/types";
import { harmonyTotal } from "../harmony";
import { createPrng, type Prng } from "../prng";
import { checkRule } from "../rules";
import { scoreLook } from "../score";
import type { Look, Piece, Rule, RuleFamily, SlotSetId } from "../types";
import { buildBrief } from "./brief";
import { candidateRules, lookOf, type Pools, poolsOf, randomLook } from "./candidates";
import { fallbackFor } from "./fallbacks";
import {
  DAILY_CHAPTER_INDEX,
  DAILY_NAME,
  type DailyTier,
  GENERATION_ATTEMPTS,
  MAX_THREE_STAR_SHARE,
  MIN_FAIL_SHARE,
  SAMPLE_SIZE,
  SEED_DRAWS,
  tierFor,
} from "./tiers";

export interface DailyInput {
  readonly seed: number;
  readonly weekday: number;
  readonly closet: readonly Piece[];
  readonly dateKey?: string;
}

export interface DailyOptions {
  readonly strict?: boolean;
}

export interface DailyChallenge extends ChallengeDef {
  readonly source: "generated" | "fallback";
  readonly attempts: number;
  readonly sampledShare: number;
  readonly weekday: number;
}

interface Attempt {
  readonly slotSet: SlotSetId;
  readonly rules: readonly Rule[];
  readonly reference: Look;
  readonly share: number;
}

function idFor(input: DailyInput): string {
  return input.dateKey === undefined ? `daily-${input.seed}` : `daily-${input.dateKey}`;
}

function drawSeedLook(set: SlotSetId, pools: Pools, rnd: Prng): Piece[] | null {
  for (let draw = 0; draw < SEED_DRAWS; draw += 1) {
    const pieces = randomLook(set, pools, rnd);
    if (pieces === null) return null;
    if (harmonyTotal(pieces) >= THREE_STAR_HARMONY) return pieces;
  }
  return null;
}

function failShare(rule: Rule, sample: readonly (readonly Piece[])[]): number {
  let failed = 0;
  for (const pieces of sample) if (!checkRule(rule, pieces)) failed += 1;
  return failed / sample.length;
}

function matchesNeed(tier: DailyTier, family: RuleFamily): boolean {
  if (tier.need === "budget") return family === "budget";
  if (tier.need === "era-or-formality") return family === "era" || family === "formality";
  return false;
}

function chooseRules(tier: DailyTier, candidates: readonly Rule[], rnd: Prng): Rule[] | null {
  const chosen: Rule[] = [];
  const used = new Set<RuleFamily>();
  const add = (rule: Rule): void => {
    used.add(RULE_FAMILY[rule.kind]);
    chosen.push(rule);
  };
  if (tier.need !== null) {
    const needed = candidates.find((rule) => matchesNeed(tier, RULE_FAMILY[rule.kind]));
    if (needed === undefined) return null;
    add(needed);
  }
  for (const rule of candidates) {
    if (chosen.length >= tier.ruleCount) break;
    if (!used.has(RULE_FAMILY[rule.kind])) add(rule);
  }
  return chosen.length === tier.ruleCount ? rnd.shuffle(chosen) : null;
}

function attempt(
  tier: DailyTier,
  pools: Pools,
  closet: readonly Piece[],
  rnd: Prng,
): Attempt | null {
  const slotSet = rnd.pick(tier.slotSets);
  const seedLook = drawSeedLook(slotSet, pools, rnd);
  if (seedLook === null) return null;
  const candidates = candidateRules(seedLook, closet, rnd);
  const sample: Piece[][] = [];
  for (let i = 0; i < SAMPLE_SIZE; i += 1) {
    const pieces = randomLook(slotSet, pools, rnd);
    if (pieces === null) return null;
    sample.push(pieces);
  }
  const lively = candidates.filter((rule) => failShare(rule, sample) >= MIN_FAIL_SHARE);
  const rules = chooseRules(tier, rnd.shuffle(lively), rnd);
  if (rules === null) return null;
  const winners = sample.filter(
    (pieces) =>
      rules.every((rule) => checkRule(rule, pieces)) && harmonyTotal(pieces) >= THREE_STAR_HARMONY,
  );
  const share = winners.length / sample.length;
  if (share > MAX_THREE_STAR_SHARE) return null;
  return { slotSet, rules, reference: lookOf(seedLook), share };
}

function fromFallback(input: DailyInput, attempts: number): DailyChallenge {
  const template = fallbackFor(input.weekday);
  return {
    ...template,
    id: idFor(input),
    name: DAILY_NAME,
    source: "fallback",
    attempts,
    sampledShare: 0,
    weekday: input.weekday,
  };
}

export function generateDaily(input: DailyInput, options: DailyOptions = {}): DailyChallenge {
  const tier = tierFor(input.weekday);
  const pools = poolsOf(input.closet);
  const root = createPrng(input.seed);
  for (let index = 0; index < GENERATION_ATTEMPTS; index += 1) {
    const rnd = root.fork(`attempt-${index}`);
    const found = attempt(tier, pools, input.closet, rnd);
    if (found === null) continue;
    const client = rnd.pick(CLIENTS);
    const def: ChallengeDef = {
      id: idFor(input),
      name: DAILY_NAME,
      chapterIndex: DAILY_CHAPTER_INDEX,
      clientId: client.id,
      slotSet: found.slotSet,
      rules: found.rules,
      brief: buildBrief(client, found.rules),
      reference: found.reference,
    };
    if (scoreLook(def, input.closet, def.reference).stars !== 3) {
      if (options.strict === true) {
        throw new Error(`daily reference look is not three stars for seed ${input.seed}`);
      }
      return fromFallback(input, index + 1);
    }
    return {
      ...def,
      source: "generated",
      attempts: index + 1,
      sampledShare: found.share,
      weekday: input.weekday,
    };
  }
  return fromFallback(input, GENERATION_ATTEMPTS);
}
