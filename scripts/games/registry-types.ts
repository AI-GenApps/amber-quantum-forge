export type GameId =
  | "merge_relay"
  | "pocket_biome"
  | "sixty_second_heist"
  | "meme_court"
  | "snapquest"
  | "ludo";

export type GameCapability =
  | "game_loop"
  | "camera"
  | "guest_identity"
  | "save_sync"
  | "billing"
  | "ads"
  | "sharing"
  | "notifications"
  | "moderation"
  | "web_voting";

type GamePlatform = "ios" | "android";
export type GameEnvironment = "debug" | "staging" | "production";

export interface GameCapabilities {
  readonly specified: readonly GameCapability[];
  readonly implemented: readonly GameCapability[];
  readonly enabled: readonly GameCapability[];
}

export interface GameReadiness {
  readonly specified: boolean;
  readonly implemented: boolean;
  readonly integrated: boolean;
  readonly verified: boolean;
  readonly enabled: boolean;
}

export interface GameRegistration {
  readonly id: GameId;
  readonly canonicalName: string;
  readonly publicTitle: string;
  readonly subtitle: string;
  readonly lifecycle: "concept";
  readonly paths: {
    readonly app: string;
    readonly rulesPackage: string;
  };
  readonly source: {
    readonly folderId: string;
    readonly indexId: string;
    readonly prdId: string;
    readonly validationId: string;
    readonly canonicalDrivePath: string | null;
  };
  readonly platforms: readonly GamePlatform[];
  readonly environments: readonly GameEnvironment[];
  readonly rendering: "flame" | "flutter_widgets";
  readonly capabilities: GameCapabilities;
  readonly permissions: {
    readonly specified: readonly string[];
    readonly enabled: readonly string[];
  };
  readonly readiness: GameReadiness;
  readonly identity: {
    readonly iosBundleId: string;
    readonly androidApplicationId: string;
    readonly registrationStatus: "unverified" | "verified";
    readonly debugSuffix: ".debug";
  };
  readonly namespaces: {
    readonly save: string;
    readonly saveSchemaVersion: number;
    readonly analytics: string;
    readonly entitlements: string;
    readonly deepLink: string;
  };
  readonly release: {
    readonly version: string;
    readonly buildNumber: number;
    readonly storeProductIds: { readonly ios: string | null; readonly android: string | null };
    readonly publisher: string | null;
    readonly domains: readonly string[];
  };
}

const driveFile = (id: string): string => `https://drive.google.com/file/d/${id}/view`;
const driveFolder = (id: string): string => `https://drive.google.com/drive/folders/${id}`;

export function source(
  folderId: string,
  indexId: string,
  prdId: string,
  validationId: string,
  canonicalDrivePath: string | null,
) {
  return {
    folderId,
    indexId,
    prdId,
    validationId,
    canonicalDrivePath,
    links: {
      folder: driveFolder(folderId),
      index: driveFile(indexId),
      prd: driveFile(prdId),
      validation: driveFile(validationId),
    },
  };
}

/**
 * Same shape as `source()`, for games whose source material lives in this
 * repo (docs-internal) rather than on Google Drive. `links` point at
 * repo-relative doc paths instead of Drive URLs.
 */
export function internalSource(
  folderId: string,
  indexId: string,
  prdId: string,
  validationId: string,
  links: { readonly index: string; readonly prd: string; readonly validation: string },
) {
  return {
    folderId,
    indexId,
    prdId,
    validationId,
    canonicalDrivePath: null,
    links: {
      folder: folderId,
      index: links.index,
      prd: links.prd,
      validation: links.validation,
    },
  };
}

export function identity(id: string) {
  return {
    iosBundleId: `app.w3dev.${id.replaceAll("_", "")}`,
    androidApplicationId: `app.w3dev.${id.replaceAll("_", "")}`,
    registrationStatus: "unverified" as const,
    debugSuffix: ".debug" as const,
  };
}

export function namespaces(id: GameId) {
  return {
    save: `games.${id}`,
    saveSchemaVersion: 1,
    analytics: `game.${id}`,
    entitlements: `games.${id}.entitlements`,
    deepLink: `w3dev-${id}`,
  };
}

export function capabilities(specified: readonly GameCapability[]): GameCapabilities {
  return { specified, implemented: [], enabled: [] };
}

export const noPermissions = { specified: [], enabled: [] } as const;
export const supportedEnvironments = [
  "debug",
  "staging",
  "production",
] as const satisfies readonly GameEnvironment[];
export const scaffoldReadiness: GameReadiness = {
  specified: true,
  implemented: false,
  integrated: false,
  verified: false,
  enabled: false,
};
