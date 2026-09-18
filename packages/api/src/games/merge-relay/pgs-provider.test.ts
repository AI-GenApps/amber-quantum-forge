import { describe, expect, it } from "vitest";
import { GooglePlayGamesProvider, GooglePlayGamesProviderError } from "./pgs-provider";

type RequestRecord = { url: string; init: RequestInit | undefined };

function provider(
  body: unknown,
  status = 200,
  timeoutMs?: number,
): { client: GooglePlayGamesProvider; requests: RequestRecord[] } {
  const requests: RequestRecord[] = [];
  const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    requests.push({ url: String(input), init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  };
  return {
    client: new GooglePlayGamesProvider("web-client", "web-secret", fetchImpl, timeoutMs),
    requests,
  };
}

describe("Google Play Games provider", () => {
  it("exchanges and verifies a server auth code", async () => {
    const exchange = provider({
      access_token: "access",
      expires_in: 3600,
      refresh_token: "refresh",
      scope: "games",
    });
    const credential = await exchange.client.exchangeServerAuthCode({
      environment: "debug",
      applicationId: "com.example.merge",
      serverAuthCode: "auth-code",
    });
    expect(credential.refreshToken).toBe("refresh");
    expect(exchange.requests[0]?.init?.method).toBe("POST");
    const verification = provider({
      kind: "games#applicationVerifyResponse",
      player_id: "player-123",
    });
    const identity = await verification.client.verifyPlayer({
      accessToken: "access",
      applicationId: "com.example.merge",
    });
    expect(identity.playerId).toBe("player-123");
    expect(verification.requests[0]?.url).toContain("applications/com.example.merge/verify");
  });

  it("refreshes credentials and sends bounded achievement and leaderboard requests", async () => {
    const refresh = provider({ access_token: "new-access", expires_in: 3600, scope: "games" });
    const access = await refresh.client.refreshAccessToken({
      refreshToken: "refresh",
      applicationId: "com.example.merge",
    });
    expect(access.accessToken).toBe("new-access");
    const achievement = provider({
      kind: "games#achievementUnlockResponse",
      newlyUnlocked: true,
    });
    const unlocked = await achievement.client.unlockAchievement({
      accessToken: "access",
      playerId: "player-123",
      achievementId: "achievement-1",
      resultId: "result-1",
      idempotencyKey: "event-1",
    });
    expect(unlocked.status).toBe("succeeded");
    const repeated = provider({
      kind: "games#achievementUnlockResponse",
      newlyUnlocked: false,
    });
    await expect(
      repeated.client.unlockAchievement({
        accessToken: "access",
        playerId: "player-123",
        achievementId: "achievement-1",
        resultId: "result-2",
        idempotencyKey: "event-2",
      }),
    ).resolves.toMatchObject({ status: "succeeded" });
    expect(achievement.requests[0]?.url).toContain("games/v1/achievements/achievement-1/unlock");
    expect(achievement.requests[0]?.url).not.toContain("players/");
    const leaderboard = provider({
      kind: "games#playerScoreResponse",
      beatenScoreTimeSpans: ["ALL_TIME"],
      unbeatenScores: [],
      formattedScore: "123",
      leaderboardId: "leaderboard-1",
      scoreTag: "result-1",
    });
    await leaderboard.client.submitLeaderboard({
      accessToken: "access",
      playerId: "player-123",
      leaderboardId: "leaderboard-1",
      score: 123,
      scoreTag: "result-1",
      resultId: "result-1",
      idempotencyKey: "event-1",
    });
    expect(leaderboard.requests[0]?.url).toContain("games/v1/leaderboards/leaderboard-1/scores");
    expect(leaderboard.requests[0]?.url).not.toContain("players/");
    expect(leaderboard.requests[0]?.url).toContain("score=123");
  });

  it("maps provider authorization failures without exposing response content", async () => {
    const response = provider({ secret_token: "provider-secret" }, 401);
    await expect(
      response.client.verifyPlayer({ accessToken: "access", applicationId: "app" }),
    ).rejects.toMatchObject({ code: "reauthorization_required" });
    try {
      await response.client.verifyPlayer({ accessToken: "access", applicationId: "app" });
    } catch (error) {
      expect(error).toBeInstanceOf(GooglePlayGamesProviderError);
      expect(String(error)).not.toContain("provider-secret");
    }
  });

  it("rejects an HTML or structurally invalid success response", async () => {
    const html = provider("<html>not google</html>");
    await expect(
      html.client.unlockAchievement({
        accessToken: "access",
        playerId: "player-123",
        achievementId: "achievement-1",
        resultId: "result-1",
        idempotencyKey: "event-1",
      }),
    ).resolves.toMatchObject({
      status: "permanent_failure",
      errorCode: "provider_response_invalid",
    });
    const invalid = provider({ kind: "games#achievementUnlockResponse" });
    await expect(
      invalid.client.unlockAchievement({
        accessToken: "access",
        playerId: "player-123",
        achievementId: "achievement-1",
        resultId: "result-1",
        idempotencyKey: "event-1",
      }),
    ).resolves.toMatchObject({
      status: "permanent_failure",
      errorCode: "provider_response_invalid",
    });
  });

  it("rejects chunked provider bodies above the bounded response size", async () => {
    const response = provider("x".repeat(65 * 1024));
    await expect(
      response.client.verifyPlayer({ accessToken: "access", applicationId: "app" }),
    ).rejects.toMatchObject({ code: "provider_response_too_large" });
  });

  it("cancels an advertised oversized provider body before rejecting", async () => {
    let cancelled = false;
    const client = new GooglePlayGamesProvider(
      "web-client",
      "web-secret",
      async () =>
        new Response(
          new ReadableStream<Uint8Array>({
            cancel: () => {
              cancelled = true;
            },
          }),
          { headers: { "content-length": String(65 * 1024) } },
        ),
    );
    await expect(
      client.verifyPlayer({ accessToken: "access", applicationId: "app" }),
    ).rejects.toMatchObject({
      code: "provider_response_too_large",
    });
    expect(cancelled).toBe(true);
  });

  it("aborts a provider body that stalls after headers", async () => {
    const client = new GooglePlayGamesProvider(
      "web-client",
      "web-secret",
      async () =>
        new Response(
          new ReadableStream<Uint8Array>({
            pull: () => new Promise<void>(() => undefined),
          }),
          { headers: { "content-type": "application/json" } },
        ),
      20,
    );
    await expect(
      client.verifyPlayer({ accessToken: "access", applicationId: "app" }),
    ).rejects.toMatchObject({ code: "provider_timeout" });
  });

  it("aborts a provider request that stalls before headers", async () => {
    const client = new GooglePlayGamesProvider(
      "web-client",
      "web-secret",
      async () => new Promise<Response>(() => undefined),
      20,
    );
    await expect(
      client.verifyPlayer({ accessToken: "access", applicationId: "app" }),
    ).rejects.toMatchObject({ code: "provider_timeout" });
  });
});
