import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type {
  MergePgsCredentialVault,
  MergePgsEnvironment,
  MergePgsOAuthCredential,
} from "./pgs-contracts";

export function createPgsCredentialVault(key: Buffer): MergePgsCredentialVault {
  if (key.length !== 32) throw new Error("PGS credential key must be 32 bytes");
  return {
    seal: ({ environment, principalSubject, playerId, credential }) => {
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      cipher.setAAD(aad(environment, principalSubject, playerId));
      const ciphertext = Buffer.concat([
        cipher.update(JSON.stringify(credential), "utf8"),
        cipher.final(),
      ]);
      return {
        ciphertext: ciphertext.toString("base64url"),
        iv: iv.toString("base64url"),
        authTag: cipher.getAuthTag().toString("base64url"),
      };
    },
    open: ({ record }) => {
      try {
        const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(record.iv, "base64url"));
        decipher.setAAD(aad(record.environment, record.principalSubject, record.playerId));
        decipher.setAuthTag(Buffer.from(record.authTag, "base64url"));
        const plaintext = Buffer.concat([
          decipher.update(Buffer.from(record.ciphertext, "base64url")),
          decipher.final(),
        ]).toString("utf8");
        return parseCredential(JSON.parse(plaintext));
      } catch {
        throw new Error("PGS credential could not be opened");
      }
    },
  };
}

export function pgsCredentialKeyFromEnvironment(environment: MergePgsEnvironment): Buffer | null {
  const encoded = process.env[`MERGE_RELAY_PGS_${environment.toUpperCase()}_CREDENTIAL_KEY`];
  if (!encoded) return null;
  try {
    const key = Buffer.from(encoded, "base64url");
    return key.length === 32 ? key : null;
  } catch {
    return null;
  }
}

function aad(environment: MergePgsEnvironment, subject: string, playerId: string): Buffer {
  return Buffer.from(`merge_relay|${environment}|${subject}|google_play_games|${playerId}|v1`);
}

function parseCredential(value: unknown): MergePgsOAuthCredential {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("PGS credential payload is invalid");
  const record = value as Record<string, unknown>;
  if (
    typeof record.accessToken !== "string" ||
    typeof record.accessTokenExpiresAt !== "string" ||
    (record.refreshToken !== null && typeof record.refreshToken !== "string") ||
    !Array.isArray(record.scopes) ||
    !record.scopes.every((scope) => typeof scope === "string")
  )
    throw new Error("PGS credential payload is invalid");
  return {
    accessToken: record.accessToken,
    accessTokenExpiresAt: record.accessTokenExpiresAt,
    refreshToken: record.refreshToken,
    scopes: record.scopes,
  };
}
