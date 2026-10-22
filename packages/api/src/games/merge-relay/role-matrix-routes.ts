import { MERGE_RELAY_THEME_PRODUCT_ID } from "./commerce-contracts";

const checkpoint = {
  board: [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  score: 0,
  move_count: 0,
  seed: 7,
  rng_state: 123,
  rule_version: "MR-2D-1",
};

export interface MatrixRoute {
  key: string;
  method: string;
  pattern: string;
  path: string;
  body?: unknown;
}

function route(method: string, pattern: string, path: string, body?: unknown): MatrixRoute {
  return {
    key: `${method} ${pattern}`,
    method,
    pattern,
    path,
    ...(body === undefined ? {} : { body }),
  };
}

export const MATRIX_ROUTES: MatrixRoute[] = [
  route("POST", "/:environment/guest", "/guest", {}),
  route("POST", "/:environment/guest/recover", "/guest/recover", {
    recovery_token: "unknown-token",
  }),
  route("GET", "/:environment/challenges/:challengeId/resolve", "/challenges/chal_missing/resolve"),
  route("GET", "/:environment/daily/:date", "/daily/2026-02-03"),
  route("GET", "/:environment/config", "/config"),
  route("POST", "/:environment/commerce/google-play/rtdn", "/commerce/google-play/rtdn", {}),
  route("GET", "/:environment/rewards/admob/ssv", "/rewards/admob/ssv"),
  route("POST", "/:environment/daily/:date/provision", "/daily/2026-02-03/provision", {}),
  route("POST", "/:environment/guest/upgrade", "/guest/upgrade", {
    recovery_token: "unknown-token",
  }),
  route("POST", "/:environment/challenges", "/challenges", {
    idempotency_key: "matrix-create-1",
    creator_alias: "Matrix",
    checkpoint,
  }),
  route("GET", "/:environment/challenges/:challengeId", "/challenges/chal_missing"),
  route(
    "POST",
    "/:environment/challenges/:challengeId/retire",
    "/challenges/chal_missing/retire",
    {},
  ),
  route(
    "POST",
    "/:environment/challenges/:challengeId/attempts",
    "/challenges/chal_missing/attempts",
    {
      reservation_key: "matrix-reserve-1",
    },
  ),
  route("POST", "/:environment/attempts/:attemptId/moves", "/attempts/att_missing/moves", {
    expected_version: 0,
    moves: ["left"],
  }),
  route("GET", "/:environment/attempts/:attemptId", "/attempts/att_missing"),
  route("POST", "/:environment/attempts/:attemptId/finalize", "/attempts/att_missing/finalize", {
    idempotency_key: "matrix-final-1",
    finish_early: true,
  }),
  route("GET", "/:environment/results/:resultId", "/results/res_missing"),
  route("GET", "/:environment/saves/:saveId", "/saves/save_missing"),
  route("PUT", "/:environment/saves/:saveId", "/saves/save_matrix", {
    expected_version: 0,
    schema_version: 1,
    payload: {},
  }),
  route("POST", "/:environment/rewards", "/rewards", {
    result_id: "res_missing",
    kind: "cosmetic",
    product_id: "theme_pack",
    provider_transaction_id: "tx_matrix",
  }),
  route("POST", "/:environment/events", "/events", {
    idempotency_key: "matrix-event-1",
    type: "challenge_opened",
    payload: {},
  }),
  route("POST", "/:environment/social/:action", "/social/report", {
    reason: "matrix",
    target_subject: "matrix_target",
  }),
  route("PUT", "/:environment/config", "/config", {
    expected_revision: 1,
    spawn_two_weight: 90,
    spawn_four_weight: 10,
    features: {
      daily: true,
      endless: true,
      ranked_relay: true,
      rewarded_ads: false,
      cosmetics: false,
    },
  }),
  route("POST", "/:environment/config/bootstrap", "/config/bootstrap", {}),
  route("POST", "/:environment/config/rollback", "/config/rollback", {
    target_revision: 1,
    expected_revision: 1,
  }),
  route("GET", "/:environment/commerce/catalog", "/commerce/catalog"),
  route("GET", "/:environment/commerce/entitlements", "/commerce/entitlements"),
  route("POST", "/:environment/commerce/google-play/purchases", "/commerce/google-play/purchases", {
    product_id: MERGE_RELAY_THEME_PRODUCT_ID,
    purchase_token: "matrixtoken",
  }),
  route("POST", "/:environment/commerce/google-play/restore", "/commerce/google-play/restore", {
    product_id: MERGE_RELAY_THEME_PRODUCT_ID,
    purchase_token: "matrixtoken",
  }),
  route(
    "POST",
    "/:environment/commerce/google-play/voided/reconcile",
    "/commerce/google-play/voided/reconcile",
    {},
  ),
  route(
    "GET",
    "/:environment/platform/google-play-games/identity",
    "/platform/google-play-games/identity",
  ),
  route(
    "POST",
    "/:environment/platform/google-play-games/identity",
    "/platform/google-play-games/identity",
    { server_auth_code: "matrix-code" },
  ),
  route(
    "POST",
    "/:environment/platform/google-play-games/outbox/dispatch",
    "/platform/google-play-games/outbox/dispatch",
    {},
  ),
  route("POST", "/:environment/maintenance/prune", "/maintenance/prune", { dry_run: true }),
];
