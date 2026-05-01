#!/usr/bin/env bun

/**
 * Grant the `admin: true` Firebase custom claim to a user.
 * Usage: bun --cwd packages/api run grant-admin <firebaseUid>
 *
 * Requires FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL.
 */

import * as admin from "firebase-admin";

async function main() {
  const uid = process.argv[2];
  if (!uid) {
    console.error("Usage: bun --cwd packages/api run grant-admin <firebaseUid>");
    process.exit(1);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.error(
      "Missing FIREBASE_PROJECT_ID / FIREBASE_PRIVATE_KEY / FIREBASE_CLIENT_EMAIL env vars.",
    );
    process.exit(1);
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
    });
  }

  const existing = await admin.auth().getUser(uid);
  const claims = { ...(existing.customClaims || {}), admin: true };
  await admin.auth().setCustomUserClaims(uid, claims);

  console.log(`Granted admin to ${uid} (${existing.email ?? "no email"}).`);
  console.log("The user must sign out and sign back in for the claim to apply.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
