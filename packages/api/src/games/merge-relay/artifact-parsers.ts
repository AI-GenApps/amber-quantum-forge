import type {
  MergeAlias,
  MergeAttempt,
  MergeChallenge,
  MergeConfigRevision,
  MergeDailyChallenge,
  MergeEvent,
  MergeGuest,
  MergeResult,
  MergeReward,
  MergeSave,
  MergeSocialRecord,
} from "./contracts";
import {
  validateAttempt,
  validateChallenge,
  validateConfig,
  validateDaily,
  validateEvent,
  validateGuest,
  validateResult,
  validateReward,
  validateSave,
  validateSocial,
} from "./state-validation";
import { asRecord, validateAlias } from "./state-validation-helpers";

export const parseChallengeArtifact = (value: unknown): MergeChallenge =>
  parse(value, validateChallenge, "challenge");
export const parseAttemptArtifact = (value: unknown): MergeAttempt =>
  parse(value, validateAttempt, "attempt");
export const parseResultArtifact = (value: unknown): MergeResult =>
  parse(value, validateResult, "result");
export const parseSaveArtifact = (value: unknown): MergeSave => parse(value, validateSave, "save");
export const parseGuestArtifact = (value: unknown): MergeGuest =>
  parse(value, validateGuest, "guest");
export const parseDailyArtifact = (value: unknown): MergeDailyChallenge =>
  parse(value, validateDaily, "daily");
export const parseConfigArtifact = (value: unknown): MergeConfigRevision =>
  parse(value, validateConfig, "config");
export const parseEventArtifact = (value: unknown): MergeEvent =>
  parse(value, validateEvent, "event");
export const parseSocialArtifact = (value: unknown): MergeSocialRecord =>
  parse(value, validateSocial, "social");
export const parseRewardArtifact = (value: unknown): MergeReward =>
  parse(value, validateReward, "reward");
export const parseAliasArtifact = (value: unknown): MergeAlias =>
  parse(value, validateAlias, "alias");
function parse<T>(value: unknown, validate: (value: T) => void, kind: string): T {
  if (!asRecord(value)) throw new Error(`Merge Relay ${kind} artifact is invalid`);
  const cloned = JSON.parse(JSON.stringify(value)) as T;
  validate(cloned);
  return cloned;
}
