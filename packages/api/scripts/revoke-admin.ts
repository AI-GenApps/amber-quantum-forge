#!/usr/bin/env bun

/**
 * Revoke the `admin` Firebase custom claim from a user.
 * Usage: bun --cwd packages/api run revoke-admin <firebaseUid>
 */

import * as admin from "firebase-admin";

async function main() {
  const uid = process.argv[2];
  if (!uid) {
    console.error("Usage: bun --cwd packages/api run revoke-admin <firebaseUid>");
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
  const { admin: _drop, ...rest } = (existing.customClaims || {}) as Record<string, unknown>;
  await admin.auth().setCustomUserClaims(uid, rest);

  console.log(`Revoked admin from ${uid} (${existing.email ?? "no email"}).`);
  console.log("The user must sign out and sign back in for the change to apply.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
