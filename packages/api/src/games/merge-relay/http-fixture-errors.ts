import { createBody, idOf, terminalBoard } from "./http-fixture-outcomes";
import {
  call,
  checkpoint,
  createFixtureApp,
  type FixtureCall,
  type FixtureHarness,
  type FixtureReply,
} from "./http-fixture-support";

type Errors = Record<string, FixtureReply>;

const admin = { as: "admin", role: "game_admin" } as const;

export async function collectErrors(): Promise<Errors> {
  const errors: Errors = {};
  const h = createFixtureApp();
  const expectError = (status: number, code: string, reply: FixtureReply) => {
    const error = reply.body.error as Record<string, unknown> | undefined;
    if (reply.status !== status || error?.code !== code)
      throw new Error(`${code}: got ${reply.status} ${JSON.stringify(reply.body)}`);
    const diagnostic = String(error.diagnostic_id);
    const stable = /^[0-9a-f-]{36}$/.test(diagnostic) ? "diagnostic-id" : diagnostic;
    errors[code] ??= {
      status: reply.status,
      body: { ...reply.body, error: { ...error, diagnostic_id: stable } },
    };
  };
  const run = async (
    status: number,
    code: string,
    method: string,
    path: string,
    options: FixtureCall = {},
    target: FixtureHarness = h,
  ) => expectError(status, code, await call(target, method, path, options));

  await call(h, "POST", "/daily/2026-01-01/provision", admin);
  const root = idOf(
    await call(h, "POST", "/challenges", { body: createBody("err-root") }),
    "challenge_id",
    "challenge",
  );
  const reserve = async (id: string, as: string, key: string) =>
    idOf(
      await call(h, "POST", `/challenges/${id}/attempts`, {
        as,
        body: { reservation_key: key },
      }),
      "attempt_id",
      "attempt",
    );
  const attempt = await reserve(root, "player", "err-reserve");

  await run(401, "game_token_required", "POST", "/challenges", { as: null });
  await run(401, "invalid_game_token", "POST", "/challenges", {
    as: null,
    headers: { Authorization: "Bearer not-a-token" },
  });
  await run(400, "client_app_scope_mismatch", "POST", "/challenges", {
    headers: { "X-App-Id": "other_app" },
  });
  await run(404, "environment_not_found", "GET", "/config", { environment: "nowhere" });
  await run(413, "body_too_large", "POST", "/challenges", {
    rawBody: JSON.stringify({ filler: "x".repeat(70_000) }),
  });
  await run(422, "invalid_challenge_payload", "POST", "/challenges", {
    body: { creator_alias: "Ada" },
  });
  await run(422, "invalid_reservation", "POST", `/challenges/${root}/attempts`, { body: {} });
  await run(422, "invalid_moves", "POST", `/attempts/${attempt}/moves`, {
    as: "player",
    body: { moves: [] },
  });
  await run(422, "invalid_finalize", "POST", `/attempts/${attempt}/finalize`, {
    as: "player",
    body: {},
  });
  await run(400, "invalid_challenge_id", "GET", "/challenges/bad.id");
  await run(400, "invalid_attempt_id", "GET", "/attempts/bad.id");
  await run(400, "invalid_result_id", "GET", "/results/bad.id");
  await run(400, "invalid_daily_date", "GET", "/daily/2026-13-45");
  await run(422, "invalid_guest_recovery", "POST", "/guest/recover", { as: null, body: {} });
  await run(422, "invalid_guest_upgrade", "POST", "/guest/upgrade", { body: {} });
  await run(404, "guest_recovery_not_found", "POST", "/guest/recover", {
    as: null,
    body: { recovery_token: "unknown-recovery-token" },
  });
  await run(400, "invalid_save_id", "GET", "/saves/bad.id");
  await run(404, "save_not_found", "GET", "/saves/main");

  await run(403, "player_role_required", "POST", "/challenges", {
    ...admin,
    body: createBody("err-admin"),
  });
  await run(403, "game_admin_role_required", "POST", `/challenges/${root}/retire`);
  await run(403, "daily_provision_role_required", "POST", "/daily/2026-01-02/provision");
  await run(404, "challenge_not_found", "GET", "/challenges/ch_missing");
  await run(404, "attempt_not_found", "GET", "/attempts/att_missing", { as: "player" });
  await run(404, "result_not_found", "GET", "/results/res_missing");
  await run(404, "daily_unavailable", "GET", "/daily/2026-02-02");
  await run(403, "challenge_membership_required", "GET", `/challenges/${root}`, {
    as: "stranger",
  });
  await run(403, "attempt_owner_required", "POST", `/attempts/${attempt}/moves`, {
    as: "stranger",
    body: { expected_version: 0, moves: ["left"] },
  });
  await run(409, "reservation_exists", "POST", `/challenges/${root}/attempts`, {
    as: "player",
    body: { reservation_key: "err-reserve-other" },
  });
  await run(409, "attempt_version_conflict", "POST", `/attempts/${attempt}/moves`, {
    as: "player",
    body: { expected_version: 5, moves: ["left"] },
  });
  await run(422, "illegal_move", "POST", `/attempts/${attempt}/moves`, {
    as: "player",
    body: { expected_version: 0, moves: ["up"] },
  });
  await run(409, "attempt_incomplete", "POST", `/attempts/${attempt}/finalize`, {
    as: "player",
    body: { idempotency_key: "err-incomplete" },
  });
  await call(h, "POST", `/attempts/${attempt}/moves`, {
    as: "player",
    body: { expected_version: 0, moves: ["left", "down"] },
  });
  await run(422, "move_budget_exceeded", "POST", `/attempts/${attempt}/moves`, {
    as: "player",
    body: { expected_version: 1, moves: ["right", "left"] },
  });
  await call(h, "POST", `/attempts/${attempt}/finalize`, {
    as: "player",
    body: { idempotency_key: "err-final", finish_early: true },
  });
  await run(409, "idempotency_conflict", "POST", `/attempts/${attempt}/finalize`, {
    as: "player",
    body: { idempotency_key: "err-final-other", finish_early: true },
  });
  await run(409, "attempt_not_playable", "POST", `/attempts/${attempt}/moves`, {
    as: "player",
    body: { expected_version: 2, moves: ["right"] },
  });
  await run(403, "result_access_denied", "GET", "/results/res_fixture_1", { as: "stranger" });

  const terminal = idOf(
    await call(h, "POST", "/challenges", {
      body: createBody("err-terminal", { checkpoint: { ...checkpoint, board: terminalBoard } }),
    }),
    "challenge_id",
    "challenge",
  );
  const tAttempt = await reserve(terminal, "player", "err-terminal-reserve");
  await call(h, "POST", `/attempts/${tAttempt}/moves`, {
    as: "player",
    body: { expected_version: 0, moves: ["left"] },
  });
  await run(422, "attempt_terminal", "POST", `/attempts/${tAttempt}/moves`, {
    as: "player",
    body: { expected_version: 1, moves: ["right"] },
  });

  const expiring = idOf(
    await call(h, "POST", "/challenges", { body: createBody("err-expire") }),
    "challenge_id",
    "challenge",
  );
  const eAttempt = await reserve(expiring, "late", "err-expire-reserve");
  h.setNow("2026-01-03T00:00:00.000Z");
  await run(409, "reservation_expired", "POST", `/attempts/${eAttempt}/moves`, {
    as: "late",
    body: { expected_version: 0, moves: ["left"] },
  });
  h.setNow("2026-01-01T00:00:00.000Z");

  const retired = idOf(
    await call(h, "POST", "/challenges", { body: createBody("err-retire") }),
    "challenge_id",
    "challenge",
  );
  await call(h, "POST", `/challenges/${retired}/retire`, admin);
  await run(409, "challenge_retired", "POST", `/challenges/${retired}/attempts`, {
    as: "player2",
    body: { reservation_key: "err-retired" },
  });
  await call(h, "POST", "/social/block", {
    as: "blocker",
    body: { target_subject: "owner", reason: "fixture" },
  });
  await run(403, "player_blocked", "POST", `/challenges/${root}/attempts`, {
    as: "blocker",
    body: { reservation_key: "err-blocked" },
  });

  await run(409, "idempotency_conflict", "POST", "/challenges", {
    body: { ...createBody("err-root"), creator_alias: "Other" },
  });
  await run(422, "checkpoint_terminal", "POST", "/challenges", {
    body: createBody("err-full", {
      checkpoint: { ...checkpoint, board: [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 8] },
    }),
  });
  await run(404, "parent_challenge_not_found", "POST", "/challenges", {
    body: createBody("err-parent", { parent_challenge_id: "ch_missing" }),
  });
  await run(422, "daily_reference_required", "POST", "/challenges", {
    body: createBody("err-daily-ref", { mode: "daily" }),
  });
  await run(404, "daily_unavailable", "POST", "/challenges", {
    body: createBody("err-daily-missing", { mode: "daily", content_id: "daily_20260202" }),
  });
  await run(422, "daily_config_mismatch", "POST", "/challenges", {
    body: createBody("err-daily-weights", {
      mode: "daily",
      content_id: "daily_20260101",
      checkpoint: { ...checkpoint, spawn_two_weight: 50, spawn_four_weight: 50 },
    }),
  });
  await run(422, "content_version_mismatch", "POST", "/challenges", {
    body: createBody("err-version", { content_version: "MR-CONTENT-9" }),
  });
  await run(422, "content_id_mismatch", "POST", "/challenges", {
    body: createBody("err-content", {
      content_id: "one",
      checkpoint: { ...checkpoint, content_id: "two" },
    }),
  });

  const disabled = createFixtureApp((s) => {
    const config = s.configs[0];
    if (config) config.features.rankedRelay = false;
  });
  await run(
    503,
    "feature_disabled",
    "POST",
    "/challenges",
    {
      body: createBody("err-disabled"),
    },
    disabled,
  );
  const missing = createFixtureApp((s) => {
    s.configs.length = 0;
  });
  await run(
    503,
    "merge_relay_unavailable",
    "POST",
    "/challenges",
    {
      body: createBody("err-missing"),
    },
    missing,
  );
  return errors;
}
