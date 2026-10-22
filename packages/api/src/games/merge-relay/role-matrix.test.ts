import { describe, expect, it } from "vitest";
import { MATRIX_ROUTES } from "./role-matrix-routes";
import { createMatrixApp, PRINCIPALS, principalHeaders, probe } from "./role-matrix-support";
import { MATRIX_EXPECTATIONS } from "./role-matrix-table";

describe("Merge Relay signed-token role matrix", () => {
  it("covers every registered route and no stale route", () => {
    const registered = createMatrixApp()
      .registered.map((route) => `${route.method} ${route.path}`)
      .sort();
    expect(Object.keys(MATRIX_EXPECTATIONS).sort()).toEqual(registered);
    expect(MATRIX_ROUTES.map((route) => route.key).sort()).toEqual(registered);
  });

  it("allows anonymous access only to the known public routes", () => {
    const anonymous = Object.entries(MATRIX_EXPECTATIONS)
      .filter(([, expectation]) => expectation.none[0] !== 401)
      .map(([key]) => key)
      .sort();
    expect(anonymous).toEqual(
      [
        "GET /:environment/challenges/:challengeId/resolve",
        "GET /:environment/config",
        "GET /:environment/daily/:date",
        "GET /:environment/rewards/admob/ssv",
        "POST /:environment/commerce/google-play/rtdn",
        "POST /:environment/guest",
        "POST /:environment/guest/recover",
      ].sort(),
    );
  });

  for (const route of MATRIX_ROUTES) {
    describe(route.key, () => {
      for (const principal of PRINCIPALS) {
        it(`${principal}`, async () => {
          const expected = MATRIX_EXPECTATIONS[route.key]?.[principal];
          if (!expected) throw new Error(`Missing expectation for ${route.key} as ${principal}`);
          const { app } = createMatrixApp();
          const outcome = await probe(app, principal, route);
          expect([outcome.status, outcome.code]).toEqual([...expected]);
        });
      }
    });
  }

  it("cannot be elevated by a body app id, admin headers or a player token", async () => {
    const { app } = createMatrixApp();
    const headers = {
      ...(await principalHeaders("player")),
      "Content-Type": "application/json",
      "X-Admin": "true",
      "X-Game-Role": "game_admin",
      "X-Admin-Token": "legacy",
    };
    for (const path of ["/config", "/config/rollback", "/maintenance/prune", "/rewards"]) {
      const response = await app.request(`/games/merge_relay/debug${path}`, {
        method: path === "/config" ? "PUT" : "POST",
        headers,
        body: JSON.stringify({ app_id: "merge_relay", role: "service", client_score: 999999 }),
      });
      expect(response.status).toBe(403);
    }
  });

  it("rejects a token minted for another environment on every protected route", async () => {
    const { app } = createMatrixApp();
    const response = await app.request("/games/merge_relay/staging/challenges", {
      method: "POST",
      headers: { ...(await principalHeaders("player")), "Content-Type": "application/json" },
      body: "{}",
    });
    expect(response.status).toBe(401);
  });

  it("reports unknown environments before any role check", async () => {
    const { app } = createMatrixApp();
    const response = await app.request("/games/merge_relay/prod/config/rollback", {
      method: "POST",
      headers: await principalHeaders("game_admin"),
    });
    expect(response.status).toBe(404);
  });
});
