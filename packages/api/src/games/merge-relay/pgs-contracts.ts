import type { GameEnvironment } from "../contracts";

export const MERGE_PGS_PROVIDER = "google_play_games" as const;
export const MERGE_PGS_CREDENTIAL_VERSION = 1 as const;
export const MERGE_PGS_LEASE_SECONDS = 120 as const;
export const MERGE_PGS_MAX_BATCH = 20 as const;
export const MERGE_PGS_MAX_ATTEMPTS = 8 as const;
export const MERGE_PGS_MAX_TILE_BOUND = 1_000_000 as const;
export const MERGE_PGS_MAX_PROVIDER_SCORE = 9_000_000_000_000_000 as const;

export type MergePgsEnvironment = GameEnvironment;
type MergePgsIdentityLinkStatus = "unlinked" | "active" | "reauthorization_required" | "revoked";

export interface MergePgsIdentityStatus {
  provider: typeof MERGE_PGS_PROVIDER;
  configured: boolean;
  status: MergePgsIdentityLinkStatus;
}
type MergePgsOutboxKind = "achievement" | "leaderboard";
type MergePgsOutboxStatus =
  | "pending"
  | "leased"
  | "retryable"
  | "succeeded"
  | "permanent_failure"
  | "disabled"
  | "reauthorization_required";
type MergePgsDisabledReason =
  | "pgs_unconfigured"
  | "identity_unlinked"
  | "target_unconfigured"
  | "not_comparable";

export interface MergePgsIdentity {
  identityId: string;
  environment: MergePgsEnvironment;
  subject: string;
  provider: typeof MERGE_PGS_PROVIDER;
  playerId: string;
  credentialId: string;
  status: Exclude<MergePgsIdentityLinkStatus, "unlinked">;
  verifiedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MergePgsCredential {
  credentialId: string;
  environment: MergePgsEnvironment;
  subject: string;
  principalSubject: string;
  provider: typeof MERGE_PGS_PROVIDER;
  playerId: string;
  version: typeof MERGE_PGS_CREDENTIAL_VERSION;
  ciphertext: string;
  iv: string;
  authTag: string;
  accessTokenExpiresAt: string;
  scopes: string[];
  hasRefreshToken: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MergePgsOutbox {
  outboxId: string;
  environment: MergePgsEnvironment;
  subject: string;
  provider: typeof MERGE_PGS_PROVIDER;
  kind: MergePgsOutboxKind;
  resultId: string;
  identityId: string | null;
  identityUpdatedAt?: string | null;
  credentialId: string | null;
  playerId: string | null;
  targetKey: string;
  targetId: string | null;
  cohortHash: string | null;
  scoreDelta: number | null;
  maxTile: number | null;
  providerScore: number | null;
  idempotencyKey: string;
  status: MergePgsOutboxStatus;
  disabledReason: MergePgsDisabledReason | null;
  attemptCount: number;
  leaseId: string | null;
  leaseExpiresAt: string | null;
  nextAttemptAt: string;
  lastErrorCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MergePgsOAuthCredential {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string | null;
  scopes: string[];
}

export interface MergePgsAccessToken {
  accessToken: string;
  accessTokenExpiresAt: string;
  scopes: string[];
}

export interface MergePgsProviderDelivery {
  status: "succeeded" | "retryable" | "permanent_failure";
  errorCode: string | null;
}

export interface MergePgsProvider {
  exchangeServerAuthCode(input: {
    environment: MergePgsEnvironment;
    applicationId: string;
    serverAuthCode: string;
  }): Promise<MergePgsOAuthCredential>;
  verifyPlayer(input: {
    accessToken: string;
    applicationId: string;
  }): Promise<{ playerId: string }>;
  refreshAccessToken(input: {
    refreshToken: string;
    applicationId: string;
  }): Promise<MergePgsAccessToken>;
  unlockAchievement(input: {
    accessToken: string;
    playerId: string;
    achievementId: string;
    resultId: string;
    idempotencyKey: string;
  }): Promise<MergePgsProviderDelivery>;
  submitLeaderboard(input: {
    accessToken: string;
    playerId: string;
    leaderboardId: string;
    score: number;
    scoreTag: string;
    resultId: string;
    idempotencyKey: string;
  }): Promise<MergePgsProviderDelivery>;
}

export interface MergePgsCredentialVault {
  seal(input: {
    environment: MergePgsEnvironment;
    principalSubject: string;
    playerId: string;
    credential: MergePgsOAuthCredential;
  }): Pick<MergePgsCredential, "ciphertext" | "iv" | "authTag">;
  open(input: { record: MergePgsCredential }): MergePgsOAuthCredential;
}

interface MergePgsLeaderboardTarget {
  leaderboardId: string;
  cohortHash: string;
  maxTileBound: number;
}

interface MergePgsRuntimeConfig {
  applicationId: string;
  webClientId: string;
  webClientSecret: string;
  achievementTargets: Readonly<Record<string, string>>;
  leaderboardTarget: MergePgsLeaderboardTarget | null;
}

export interface MergePgsRuntime {
  config: MergePgsRuntimeConfig;
  provider: MergePgsProvider;
  vault: MergePgsCredentialVault;
}
