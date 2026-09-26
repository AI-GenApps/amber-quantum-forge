/// Dependency-injection wiring for Ludo (task 22), mirroring
/// `packages/api/src/games/merge-relay/dependencies.ts`'s style: a small
/// set of factories that pick the real adapter in production and a
/// fake/no-op one otherwise, so `routes.ts`/`cron-routes.ts` never
/// construct `FirestoreMatchViewPublisher`/`NullMatchViewPublisher`
/// directly.
import { hasFirebaseAdminConfig } from "../../firebase/admin";
import { FirestoreMatchViewPublisher } from "./firestore-match-view-publisher";
import { type MatchViewPublisher, NullMatchViewPublisher } from "./match-view-publisher";

/**
 * Picks `FirestoreMatchViewPublisher` when Firebase Admin's env vars
 * (`FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`)
 * are present, `NullMatchViewPublisher` otherwise. Never throws: this is
 * the one call site allowed to check `hasFirebaseAdminConfig()` instead of
 * letting a missing config crash the server the way `getFirebaseAdmin()`
 * does for auth (see `match-view-publisher.ts`'s doc comment).
 */
export function resolveMatchViewPublisher(): MatchViewPublisher {
  return hasFirebaseAdminConfig()
    ? new FirestoreMatchViewPublisher()
    : new NullMatchViewPublisher();
}
