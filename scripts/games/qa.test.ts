import { expect, test } from "bun:test";
import { buildChallengePayload, buildConfigPayload, isLocalApiUrl } from "./qa";

test("local QA only accepts loopback API origins", () => {
  expect(isLocalApiUrl("http://127.0.0.1:4001/api")).toBe(true);
  expect(isLocalApiUrl("http://localhost:4001/api/")).toBe(true);
  expect(isLocalApiUrl("https://api.example.test/api")).toBe(false);
  expect(isLocalApiUrl("http://127.0.0.1:4001/api?token=secret")).toBe(false);
});

test("QA config enables ranked, daily, and endless without changing reward flags", () => {
  expect(
    buildConfigPayload({
      revision: 3,
      content_revision: "MR-CONTENT-1",
      spawn_two_weight: 90,
      spawn_four_weight: 10,
      features: {
        daily: false,
        endless: false,
        ranked_relay: false,
        rewarded_ads: true,
        cosmetics: false,
      },
    }),
  ).toEqual({
    expected_revision: 3,
    spawn_two_weight: 90,
    spawn_four_weight: 10,
    content_revision: "MR-CONTENT-1",
    features: {
      daily: true,
      endless: true,
      ranked_relay: true,
      rewarded_ads: true,
      cosmetics: false,
    },
  });
});

test("QA challenge payload preserves the server-produced daily checkpoint", () => {
  const checkpoint = { board: [2, 2], seed: 7 };
  expect(
    buildChallengePayload(
      "2026-09-17",
      {
        date: "2026-09-17",
        content_revision: "MR-CONTENT-1",
        max_legal_moves: 3,
        checkpoint,
      },
      4,
    ),
  ).toEqual({
    idempotency_key: "qa-daily-2026-09-17-r4",
    creator_alias: "Local QA",
    mode: "daily",
    max_legal_moves: 3,
    content_id: "daily_20260917",
    content_version: "MR-CONTENT-1",
    checkpoint,
  });
});
