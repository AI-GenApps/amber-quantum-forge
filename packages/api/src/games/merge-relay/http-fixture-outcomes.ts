import { call, checkpoint, createFixtureApp, type FixtureReply } from "./http-fixture-support";

export const terminalBoard = [4, 8, 4, 8, 8, 4, 8, 4, 4, 8, 4, 8, 8, 4, 16, 16];

export function createBody(key: string, extra: Record<string, unknown> = {}) {
  return { idempotency_key: key, creator_alias: "Ada", checkpoint, ...extra };
}

export function dataOf(reply: FixtureReply): Record<string, unknown> {
  return reply.body.data as Record<string, unknown>;
}

export function idOf(reply: FixtureReply, key: string, nested?: string): string {
  const data = dataOf(reply);
  const source = nested ? (data[nested] as Record<string, unknown>) : data;
  return source[key] as string;
}

export async function collectOutcomes(): Promise<Record<string, unknown>> {
  const h = createFixtureApp();
  const out: Record<string, unknown> = {};
  const record = (name: string, status: number, reply: FixtureReply) => {
    if (reply.status !== status) throw new Error(`${name} returned ${reply.status}`);
    out[name] = reply.body;
  };
  const admin = { as: "admin", role: "game_admin" } as const;
  record("daily_provision", 201, await call(h, "POST", "/daily/2026-01-01/provision", admin));
  record(
    "daily_provision_replay",
    201,
    await call(h, "POST", "/daily/2026-01-01/provision", admin),
  );
  const daily = await call(h, "GET", "/daily/2026-01-01", { as: null });
  const dailyCheckpoint = dataOf(daily).checkpoint;
  const root = await call(h, "POST", "/challenges", { body: createBody("outcome-root") });
  record("create_rescue", 201, root);
  record(
    "create_replay",
    201,
    await call(h, "POST", "/challenges", { body: createBody("outcome-root") }),
  );
  const rootId = idOf(root, "challenge_id", "challenge");
  record(
    "create_daily_origin",
    201,
    await call(h, "POST", "/challenges", {
      body: createBody("outcome-daily", {
        mode: "daily",
        content_id: "daily_20260101",
        checkpoint: dailyCheckpoint,
      }),
    }),
  );
  record(
    "create_endless_origin",
    201,
    await call(h, "POST", "/challenges", {
      body: createBody("outcome-endless", { mode: "endless" }),
    }),
  );
  record(
    "create_child",
    201,
    await call(h, "POST", "/challenges", {
      body: createBody("outcome-child", { parent_challenge_id: rootId }),
    }),
  );
  record("challenge_private", 200, await call(h, "GET", `/challenges/${rootId}`));
  record("challenge_retired", 200, await call(h, "POST", "/challenges/ch_fixture_2/retire", admin));

  const reserved = await call(h, "POST", `/challenges/${rootId}/attempts`, {
    as: "player",
    body: { reservation_key: "outcome-reserve" },
  });
  record("reserve_attempt", 201, reserved);
  record(
    "reserve_replay",
    201,
    await call(h, "POST", `/challenges/${rootId}/attempts`, {
      as: "player",
      body: { reservation_key: "outcome-reserve" },
    }),
  );
  const attemptId = idOf(reserved, "attempt_id", "attempt");
  const moves = ["left", "down", "right"];
  record(
    "submit_three_moves",
    200,
    await call(h, "POST", `/attempts/${attemptId}/moves`, {
      as: "player",
      body: { expected_version: 0, moves },
    }),
  );
  record("attempt_private", 200, await call(h, "GET", `/attempts/${attemptId}`, { as: "player" }));
  const finalize = { idempotency_key: "outcome-finalize", return_alias: "Bea" };
  const complete = await call(h, "POST", `/attempts/${attemptId}/finalize`, {
    as: "player",
    body: finalize,
  });
  record("finalize_complete_with_return", 200, complete);
  record(
    "finalize_replay",
    200,
    await call(h, "POST", `/attempts/${attemptId}/finalize`, { as: "player", body: finalize }),
  );
  const resultId = idOf(complete, "result_id", "result");
  record("result_private", 200, await call(h, "GET", `/results/${resultId}`, { as: "player" }));
  record("result_owner_view", 200, await call(h, "GET", `/results/${resultId}`));

  const terminal = await call(h, "POST", "/challenges", {
    body: createBody("outcome-terminal", {
      checkpoint: { ...checkpoint, board: terminalBoard },
    }),
  });
  record("create_near_terminal", 201, terminal);
  const terminalId = idOf(terminal, "challenge_id", "challenge");
  const tAttempt = await call(h, "POST", `/challenges/${terminalId}/attempts`, {
    as: "player",
    body: { reservation_key: "outcome-terminal" },
  });
  const tAttemptId = idOf(tAttempt, "attempt_id", "attempt");
  record(
    "submit_to_terminal",
    200,
    await call(h, "POST", `/attempts/${tAttemptId}/moves`, {
      as: "player",
      body: { expected_version: 0, moves: ["left"] },
    }),
  );
  record(
    "finalize_terminal",
    200,
    await call(h, "POST", `/attempts/${tAttemptId}/finalize`, {
      as: "player",
      body: { idempotency_key: "outcome-terminal-finalize", return_alias: "Bea" },
    }),
  );
  record("finalize_early_finish", 200, await finishEarly(h, rootId));
  return out;
}

async function finishEarly(h: ReturnType<typeof createFixtureApp>, rootId: string) {
  const reserved = await call(h, "POST", `/challenges/${rootId}/attempts`, {
    as: "early",
    body: { reservation_key: "outcome-early" },
  });
  const id = idOf(reserved, "attempt_id", "attempt");
  return call(h, "POST", `/attempts/${id}/finalize`, {
    as: "early",
    body: { idempotency_key: "outcome-early-finalize", finish_early: true },
  });
}
