import { parseRuleCode } from "../rules";
import type { ChallengeDef } from "./types";

export type ChallengeInput = Omit<ChallengeDef, "rules"> & { readonly rules: string };

export function parseRules(codes: string): ChallengeDef["rules"] {
  return codes.split(";").map((code) => parseRuleCode(code.trim()));
}

export function challenge(input: ChallengeInput): ChallengeDef {
  return { ...input, rules: parseRules(input.rules) };
}
