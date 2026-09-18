import type {
  MergePgsAccessToken,
  MergePgsOAuthCredential,
  MergePgsProvider,
  MergePgsProviderDelivery,
} from "./pgs-contracts";
import { MAX_PROVIDER_RESPONSE_BYTES, readProviderResponse } from "./pgs-provider-body";

const oauthUrl = "https://oauth2.googleapis.com/token";
const gamesUrl = "https://games.googleapis.com/games/v1";
const providerTimeoutMs = 10_000;

export class GooglePlayGamesProviderError extends Error {
  constructor(
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(code);
  }
}

export class GooglePlayGamesProvider implements MergePgsProvider {
  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs = providerTimeoutMs,
  ) {}

  async exchangeServerAuthCode(input: {
    environment: "debug" | "staging" | "production";
    applicationId: string;
    serverAuthCode: string;
  }): Promise<MergePgsOAuthCredential> {
    const response = await this.request(oauthUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: input.serverAuthCode,
        grant_type: "authorization_code",
      }),
    });
    if (!response.ok) throw oauthError(response.status);
    const body = await jsonRecord(response);
    const accessToken = stringField(body.access_token);
    const expiresIn = numberField(body.expires_in);
    if (!accessToken || expiresIn === null || expiresIn < 60)
      throw new GooglePlayGamesProviderError("oauth_response_invalid", false);
    const refreshToken = body.refresh_token === undefined ? null : stringField(body.refresh_token);
    if (body.refresh_token !== undefined && !refreshToken)
      throw new GooglePlayGamesProviderError("oauth_response_invalid", false);
    return {
      accessToken,
      accessTokenExpiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      refreshToken,
      scopes: scopesFrom(body.scope),
    };
  }

  async verifyPlayer(input: {
    accessToken: string;
    applicationId: string;
  }): Promise<{ playerId: string }> {
    const response = await this.request(
      `${gamesUrl}/applications/${encodeURIComponent(input.applicationId)}/verify`,
      { headers: { authorization: `Bearer ${input.accessToken}` } },
    );
    if (!response.ok) throw oauthError(response.status);
    const body = await jsonRecord(response);
    const playerId = stringField(body.player_id);
    const alternatePlayerId =
      body.alternate_player_id === undefined ? null : stringField(body.alternate_player_id);
    if (
      body.kind !== "games#applicationVerifyResponse" ||
      !playerId ||
      (body.alternate_player_id !== undefined && !alternatePlayerId)
    )
      throw new GooglePlayGamesProviderError("player_response_invalid", false);
    return { playerId };
  }

  async refreshAccessToken(input: {
    refreshToken: string;
    applicationId: string;
  }): Promise<MergePgsAccessToken> {
    const response = await this.request(oauthUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: input.refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!response.ok) throw oauthError(response.status);
    const body = await jsonRecord(response);
    const accessToken = stringField(body.access_token);
    const expiresIn = numberField(body.expires_in);
    if (!accessToken || expiresIn === null || expiresIn < 60)
      throw new GooglePlayGamesProviderError("refresh_response_invalid", false);
    return {
      accessToken,
      accessTokenExpiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      scopes: scopesFrom(body.scope),
    };
  }

  unlockAchievement(input: {
    accessToken: string;
    playerId: string;
    achievementId: string;
    resultId: string;
    idempotencyKey: string;
  }): Promise<MergePgsProviderDelivery> {
    return this.deliver(
      `${gamesUrl}/achievements/${encodeURIComponent(input.achievementId)}/unlock`,
      input.accessToken,
      { method: "POST" },
      (body) =>
        body.kind === "games#achievementUnlockResponse" && typeof body.newlyUnlocked === "boolean",
    );
  }

  submitLeaderboard(input: {
    accessToken: string;
    playerId: string;
    leaderboardId: string;
    score: number;
    scoreTag: string;
    resultId: string;
    idempotencyKey: string;
  }): Promise<MergePgsProviderDelivery> {
    const query = new URLSearchParams({ score: String(input.score), scoreTag: input.scoreTag });
    return this.deliver(
      `${gamesUrl}/leaderboards/${encodeURIComponent(input.leaderboardId)}/scores?${query.toString()}`,
      input.accessToken,
      { method: "POST" },
      (body) =>
        body.kind === "games#playerScoreResponse" &&
        body.leaderboardId === input.leaderboardId &&
        body.scoreTag === input.scoreTag &&
        typeof body.formattedScore === "string" &&
        Array.isArray(body.beatenScoreTimeSpans) &&
        body.beatenScoreTimeSpans.every((value) => typeof value === "string") &&
        Array.isArray(body.unbeatenScores) &&
        body.unbeatenScores.every(validPlayerScore),
    );
  }

  private async deliver(
    url: string,
    accessToken: string,
    init: RequestInit,
    validResponse: (body: Record<string, unknown>) => boolean,
  ): Promise<MergePgsProviderDelivery> {
    try {
      const response = await this.request(url, {
        ...init,
        headers: { ...(init.headers ?? {}), authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const body = await jsonRecord(response);
        return validResponse(body)
          ? { status: "succeeded", errorCode: null }
          : { status: "permanent_failure", errorCode: "provider_response_invalid" };
      }
      if (response.status === 401 || response.status === 403)
        return { status: "permanent_failure", errorCode: "reauthorization_required" };
      if (response.status === 429 || response.status >= 500)
        return { status: "retryable", errorCode: `provider_http_${response.status}` };
      return { status: "permanent_failure", errorCode: `provider_http_${response.status}` };
    } catch (error) {
      if (error instanceof GooglePlayGamesProviderError && !error.retryable)
        return { status: "permanent_failure", errorCode: error.code };
      if (error instanceof GooglePlayGamesProviderError && error.retryable)
        return { status: "retryable", errorCode: error.code };
      return { status: "retryable", errorCode: "provider_network_error" };
    }
  }

  private async request(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const deadline = Date.now() + this.timeoutMs;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new GooglePlayGamesProviderError("provider_timeout", true));
        }, this.timeoutMs);
      });
      const response = await Promise.race([
        this.fetchImpl(input, { ...init, signal: controller.signal }),
        timeout,
      ]);
      const body = await readProviderResponse(
        response,
        controller,
        deadline,
        (code, retryable) => new GooglePlayGamesProviderError(code, retryable),
      );
      return new Response(body, { headers: response.headers, status: response.status });
    } catch (error) {
      if (error instanceof GooglePlayGamesProviderError) throw error;
      if (controller.signal.aborted)
        throw new GooglePlayGamesProviderError("provider_timeout", true);
      throw new GooglePlayGamesProviderError("provider_network_error", true);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}

function oauthError(status: number): GooglePlayGamesProviderError {
  return new GooglePlayGamesProviderError(
    status === 400 || status === 401 || status === 403
      ? "reauthorization_required"
      : `provider_http_${status}`,
    status >= 500 || status === 429,
  );
}

async function jsonRecord(response: Response): Promise<Record<string, unknown>> {
  try {
    const length = response.headers.get("content-length");
    if (length && Number(length) > MAX_PROVIDER_RESPONSE_BYTES)
      throw new GooglePlayGamesProviderError("provider_response_too_large", false);
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > MAX_PROVIDER_RESPONSE_BYTES)
      throw new GooglePlayGamesProviderError("provider_response_too_large", false);
    const value: unknown = JSON.parse(text);
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  } catch (error) {
    if (error instanceof GooglePlayGamesProviderError) throw error;
    throw new GooglePlayGamesProviderError("provider_response_invalid", false);
  }
}

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberField(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null;
}

function scopesFrom(value: unknown): string[] {
  return typeof value === "string" ? value.split(" ").filter((scope) => scope.length > 0) : [];
}

function validPlayerScore(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    record.kind === "games#playerScore" &&
    typeof record.timeSpan === "string" &&
    typeof record.score === "string" &&
    /^\d+$/.test(record.score) &&
    typeof record.formattedScore === "string" &&
    typeof record.scoreTag === "string"
  );
}
