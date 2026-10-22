import { createRemoteJWKSet, type JWTVerifyGetKey, jwtVerify } from "jose";
import type { MergeRtdnAuthenticator } from "./commerce-contracts";
import type { MergeEnvironment } from "./contracts";

const googleCertsUrl = "https://www.googleapis.com/oauth2/v3/certs";
const issuers = ["https://accounts.google.com", "accounts.google.com"];

export function createRtdnAuthenticator(
  audience: string,
  serviceAccountEmail: string,
  keys: JWTVerifyGetKey = createRemoteJWKSet(new URL(googleCertsUrl)),
): MergeRtdnAuthenticator {
  return {
    async authenticate(header) {
      if (!header?.startsWith("Bearer ")) return false;
      try {
        const { payload } = await jwtVerify(header.slice(7).trim(), keys, {
          issuer: issuers,
          audience,
          algorithms: ["RS256"],
        });
        return payload.email === serviceAccountEmail && payload.email_verified === true;
      } catch {
        return false;
      }
    },
  };
}

export function rtdnAuthenticatorFromEnvironment(
  environment: MergeEnvironment,
): MergeRtdnAuthenticator | null {
  const prefix = `MERGE_RELAY_PLAY_${environment.toUpperCase()}_RTDN_`;
  const audience = process.env[`${prefix}AUDIENCE`];
  const email = process.env[`${prefix}SERVICE_ACCOUNT_EMAIL`];
  return audience && email ? createRtdnAuthenticator(audience, email) : null;
}
