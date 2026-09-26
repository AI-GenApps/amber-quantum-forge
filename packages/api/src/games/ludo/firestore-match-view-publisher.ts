/// Real `MatchViewPublisher` adapter (task 22): mirrors a `LudoMatchView`
/// into Firestore at `games/{appId}/{environment}/matches/{matchId}` — one
/// document per match, overwritten on every publish (the document is a
/// fast-mirror read model; `GET /:environment/matches/:matchId/state` and
/// `LudoStore` remain the ground truth, so no history/versioning is kept
/// here). Reuses `packages/api/src/firebase/admin.ts`'s existing lazy Admin
/// SDK init and credential env vars rather than initializing a second
/// Firebase app.
import { getFirestore } from "../../firebase/admin";
import type { LudoEnvironment, LudoMatchView } from "./contracts";
import type { MatchViewPublisher } from "./match-view-publisher";
import { matchViewToWire } from "./wire";

/**
 * Minimal Firestore surface this adapter needs. Declared locally (rather
 * than importing `firebase-admin`'s `Firestore`/`DocumentReference` types
 * everywhere) so `firestore-match-view-publisher.test.ts` can supply a fake
 * client — a plain object satisfying this shape — without real Firestore
 * credentials or the Admin SDK's network behavior.
 */
export interface FirestoreLikeClient {
  collection(path: string): FirestoreLikeCollection;
}

export interface FirestoreLikeCollection {
  doc(id: string): FirestoreLikeDocument;
}

export interface FirestoreLikeDocument {
  set(data: Record<string, unknown>): Promise<unknown>;
}

/**
 * The exact collection path documents are written to:
 * `games/{appId}/{environment}/matches`, with the match id as the document
 * id. Exported so tests (and any future debugging tool) assert against the
 * same literal path this adapter writes to.
 */
export function ludoMatchViewCollectionPath(appId: string, environment: LudoEnvironment): string {
  return `games/${appId}/${environment}/matches`;
}

export class FirestoreMatchViewPublisher implements MatchViewPublisher {
  private readonly explicitClient: FirestoreLikeClient | undefined;

  constructor(client?: FirestoreLikeClient) {
    this.explicitClient = client;
  }

  /**
   * Resolves the Firestore client on first use rather than at construction
   * time: `resolveMatchViewPublisher()` only constructs this class once
   * `hasFirebaseAdminConfig()` has confirmed the env vars are present, but
   * the Admin SDK itself (credential parsing, app init) still only runs
   * the first time a match is actually published — not merely resolved —
   * so a process that never plays an online match never touches Firebase.
   */
  private client(): FirestoreLikeClient {
    return this.explicitClient ?? (getFirestore() as unknown as FirestoreLikeClient);
  }

  async publish(
    appId: string,
    environment: LudoEnvironment,
    matchId: string,
    view: LudoMatchView,
  ): Promise<void> {
    await this.client()
      .collection(ludoMatchViewCollectionPath(appId, environment))
      .doc(matchId)
      .set(matchViewToWire(view));
  }
}
