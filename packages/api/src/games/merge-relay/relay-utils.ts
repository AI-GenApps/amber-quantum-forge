import { randomUUID } from "node:crypto";
import type { MergeChallenge, MergeCheckpoint, PublicChallenge } from "./contracts";

const id = (prefix: string): string => `${prefix}_${randomUUID().replaceAll("-", "")}`;

export function createId(
  factory: ((prefix: string) => string) | undefined,
  prefix: string,
): string {
  return factory?.(prefix) ?? id(prefix);
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function toPublicChallenge(challenge: MergeChallenge): PublicChallenge {
  return {
    challengeId: challenge.challengeId,
    creatorAlias: challenge.creatorAlias,
    mode: challenge.mode,
    originMode: challenge.originMode,
    configRevision: challenge.configRevision,
    checkpoint: clone<MergeCheckpoint>(challenge.checkpoint),
    checkpointHash: challenge.checkpointHash,
    ...(challenge.payloadHash === undefined ? {} : { payloadHash: challenge.payloadHash }),
    parentChallengeId: challenge.parentChallengeId,
    status: challenge.status,
    createdAt: challenge.createdAt,
  };
}
