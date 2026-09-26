import * as admin from "firebase-admin";

interface FirebaseAdminConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
}

function readFirebaseAdminConfig(): FirebaseAdminConfig | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  if (!projectId || !privateKey || !clientEmail) return null;
  return { projectId, privateKey, clientEmail };
}

/**
 * True when `FIREBASE_PROJECT_ID`/`FIREBASE_PRIVATE_KEY`/`FIREBASE_CLIENT_EMAIL`
 * are all present, without throwing or initializing the Admin SDK. Ludo's
 * `resolveMatchViewPublisher()` (task 22) uses this to pick between the real
 * Firestore adapter and a no-op one instead of letting a missing config
 * crash the command path the way `getFirebaseAdmin()` does for auth.
 */
export function hasFirebaseAdminConfig(): boolean {
  return readFirebaseAdminConfig() !== null;
}

function getFirebaseAdmin() {
  if (!admin.apps.length) {
    const config = readFirebaseAdminConfig();

    if (!config) {
      throw new Error(
        "Firebase Admin configuration is missing. Please set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL environment variables.",
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(config),
    });
  }
  return admin;
}

/**
 * Lazy Firestore accessor (task 22), mirroring `getFirebaseAdmin()`'s
 * lazy-init pattern: initializes the Admin SDK on first use from the same
 * credential env vars, then returns its Firestore client. Callers that
 * cannot tolerate the throw-if-misconfigured behavior should check
 * `hasFirebaseAdminConfig()` first (see `FirestoreMatchViewPublisher`,
 * which is only constructed once that check has passed).
 */
export function getFirestore(): admin.firestore.Firestore {
  return getFirebaseAdmin().firestore();
}

export const verifyIdToken = async (idToken: string): Promise<admin.auth.DecodedIdToken> => {
  try {
    const decodedToken = await getFirebaseAdmin().auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error(
      `Invalid ID token: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export default admin;
