import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { MergePurchaseTokenVault } from "./commerce-contracts";
import type { MergeEnvironment } from "./contracts";

export function createPurchaseTokenVault(key: Buffer): MergePurchaseTokenVault {
  if (key.length !== 32) throw new Error("Merge purchase token key must be 32 bytes");
  return {
    seal: ({ environment, subject, purchaseToken }) => {
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      cipher.setAAD(aad(environment, subject));
      const ciphertext = Buffer.concat([cipher.update(purchaseToken, "utf8"), cipher.final()]);
      return {
        version: 1,
        ciphertext: ciphertext.toString("base64url"),
        iv: iv.toString("base64url"),
        authTag: cipher.getAuthTag().toString("base64url"),
      };
    },
    open: ({ environment, subject, envelope }) => {
      try {
        const decipher = createDecipheriv(
          "aes-256-gcm",
          key,
          Buffer.from(envelope.iv, "base64url"),
        );
        decipher.setAAD(aad(environment, subject));
        decipher.setAuthTag(Buffer.from(envelope.authTag, "base64url"));
        return Buffer.concat([
          decipher.update(Buffer.from(envelope.ciphertext, "base64url")),
          decipher.final(),
        ]).toString("utf8");
      } catch {
        throw new Error("Merge purchase token could not be opened");
      }
    },
  };
}

export function purchaseTokenKeyFromEnvironment(environment: MergeEnvironment): Buffer | null {
  const encoded = process.env[`MERGE_RELAY_PLAY_${environment.toUpperCase()}_PURCHASE_TOKEN_KEY`];
  if (!encoded) return null;
  try {
    const key = Buffer.from(encoded, "base64url");
    return key.length === 32 ? key : null;
  } catch {
    return null;
  }
}

function aad(environment: MergeEnvironment, subject: string): Buffer {
  return Buffer.from(`merge_relay|${environment}|${subject}|google_play_billing|v1`);
}
