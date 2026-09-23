import { importPKCS8, SignJWT } from "jose";
import { readProviderResponse } from "./pgs-provider-body";

export const GOOGLE_PLAY_PUBLISHER_SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const defaultTokenUri = "https://oauth2.googleapis.com/token";
const tokenTimeoutMs = 10_000;

export class GooglePlayAuthError extends Error {
  constructor(
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(code);
  }
}

export interface GooglePlayAccessTokenSource {
  getAccessToken(): Promise<string>;
}

export function createServiceAccountTokenSource(
  encodedJson: string,
  fetchImpl: typeof fetch = fetch,
): GooglePlayAccessTokenSource | null {
  try {
    const value: unknown = JSON.parse(encodedJson);
    if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (typeof record.client_email !== "string" || typeof record.private_key !== "string")
      return null;
    const tokenUri = record.token_uri === undefined ? defaultTokenUri : record.token_uri;
    if (tokenUri !== defaultTokenUri) return null;
    return new ServiceAccountTokenSource(
      record.client_email,
      record.private_key.replaceAll("\\n", "\n"),
      tokenUri,
      fetchImpl,
    );
  } catch {
    return null;
  }
}

class ServiceAccountTokenSource implements GooglePlayAccessTokenSource {
  private cached: { token: string; expiresAt: number } | null = null;
  private inFlight: Promise<string> | null = null;

  constructor(
    private readonly clientEmail: string,
    private readonly privateKey: string,
    private readonly tokenUri: string,
    private readonly fetchImpl: typeof fetch,
  ) {}

  async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.cached && this.cached.expiresAt > now + 60) return this.cached.token;
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.issueToken();
    try {
      return await this.inFlight;
    } finally {
      this.inFlight = null;
    }
  }

  private async issueToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const key = await importPKCS8(this.privateKey, "RS256");
    const assertion = await new SignJWT({ scope: GOOGLE_PLAY_PUBLISHER_SCOPE })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuer(this.clientEmail)
      .setAudience(this.tokenUri)
      .setIssuedAt(now)
      .setExpirationTime(now + 3_600)
      .sign(key);
    const response = await requestToken(
      this.fetchImpl,
      this.tokenUri,
      new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    );
    if (!response.ok)
      throw new GooglePlayAuthError(
        response.status === 400 || response.status === 401
          ? "publisher_auth_rejected"
          : `publisher_auth_http_${response.status}`,
        response.status === 429 || response.status >= 500,
      );
    const body = parseTokenResponse(response.body);
    this.cached = { token: body.accessToken, expiresAt: now + body.expiresIn };
    return body.accessToken;
  }
}

async function requestToken(
  fetchImpl: typeof fetch,
  uri: string,
  body: URLSearchParams,
): Promise<{ ok: boolean; status: number; body: string }> {
  const controller = new AbortController();
  const deadline = Date.now() + tokenTimeoutMs;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new GooglePlayAuthError("publisher_auth_timeout", true));
      }, tokenTimeoutMs);
    });
    const response = await Promise.race([
      fetchImpl(uri, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
        signal: controller.signal,
      }),
      timeout,
    ]).catch((error) => {
      if (error instanceof GooglePlayAuthError) throw error;
      throw new GooglePlayAuthError("publisher_auth_network", true);
    });
    const bodyText = await readProviderResponse(
      response,
      controller,
      deadline,
      (code, retryable) => new GooglePlayAuthError(code, retryable),
    );
    return { ok: response.ok, status: response.status, body: bodyText };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function parseTokenResponse(value: string): { accessToken: string; expiresIn: number } {
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error();
    const record = parsed as Record<string, unknown>;
    if (
      typeof record.access_token !== "string" ||
      !record.access_token ||
      typeof record.expires_in !== "number" ||
      !Number.isSafeInteger(record.expires_in) ||
      record.expires_in < 60
    )
      throw new Error();
    return { accessToken: record.access_token, expiresIn: record.expires_in };
  } catch {
    throw new GooglePlayAuthError("publisher_auth_response_invalid", false);
  }
}
