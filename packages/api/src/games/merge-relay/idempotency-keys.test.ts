import { describe, expect, it } from "vitest";
import { recordEvent } from "./data-service";
import { parseEvent } from "./data-validation";
import { asMergeError } from "./errors";
import { createChallenge } from "./relay-service";
import { rankedDependencies, testCheckpoint, testSession, testStores } from "./relay-test-support";
import { parseCreateChallenge, parseFinalize, parseReserveAttempt, parseSave } from "./validation";

const checkpointWire = {
  board: testCheckpoint.board,
  score: 0,
  move_count: 0,
  seed: 7,
  rng_state: 123,
  rule_version: "MR-2D-1",
};

describe("client idempotency key hygiene", () => {
  it("rejects server-reserved prefixes in every client key parser", () => {
    for (const prefix of [
      "retire:",
      "cancel:",
      "save:",
      "result:",
      "return:",
      "abandoned:",
      "attempt:",
      "challenge:",
      "Return:",
    ]) {
      const key = `${prefix}x`;
      expect(parseFinalize({ idempotency_key: key })).toBeNull();
      expect(parseReserveAttempt({ reservation_key: key })).toBeNull();
      expect(
        parseSave({ expected_version: 0, schema_version: 1, payload: {}, client_write_id: key }),
      ).toBeNull();
      expect(
        parseCreateChallenge({
          idempotency_key: key,
          creator_alias: "A",
          checkpoint: checkpointWire,
        }),
      ).toBeNull();
      expect(parseEvent({ idempotency_key: key, type: "replay_viewed", payload: {} })).toBeNull();
    }
    expect(parseFinalize({ idempotency_key: "finish-1" })).not.toBeNull();
  });

  it("rejects server-authored event types from clients", () => {
    for (const type of [
      "challenge_created",
      "challenge_retired",
      "checkpoint_saved",
      "relay_attempt_reserved",
      "attempt_completed",
      "relay_return_created",
    ])
      expect(parseEvent({ idempotency_key: "k1", type, payload: {} })).toBeNull();
    expect(
      parseEvent({ idempotency_key: "k1", type: "replay_viewed", payload: {} }),
    ).not.toBeNull();
  });

  it("maps unique violations to 409", () => {
    const mapped = asMergeError(Object.assign(new Error("wrapped"), { cause: { code: "23505" } }));
    expect(mapped.status).toBe(409);
  });
});

for (const [name, factory] of testStores) {
  describe.skipIf(!factory)(`Merge Relay idempotency namespacing on ${name}`, () => {
    it("lets two subjects reuse the same client key without blocking each other", async () => {
      if (!factory) return;
      const deps = await rankedDependencies(factory());
      const suffix = Date.now().toString(36);
      const key = `shared-${suffix}`;
      const input = { idempotencyKey: key, creatorAlias: "Same", checkpoint: testCheckpoint };
      const first = await createChallenge(deps, "staging", testSession(`a_${suffix}`), input);
      const second = await createChallenge(deps, "staging", testSession(`b_${suffix}`), input);
      expect(second.challenge.challengeId).not.toBe(first.challenge.challengeId);
      const eventInput = { idempotencyKey: key, type: "replay_viewed" as const, payload: {} };
      const eventA = await recordEvent(deps, "staging", testSession(`a_${suffix}`), eventInput);
      const eventB = await recordEvent(deps, "staging", testSession(`b_${suffix}`), eventInput);
      expect(eventB.eventId).not.toBe(eventA.eventId);
    });
  });
}

describe.skipIf(!testStores[1]?.[1])("Merge Relay PostgreSQL duplicate key mapping", () => {
  it("surfaces a same-owner duplicate key write as a 409", async () => {
    const store = testStores[1]?.[1]?.();
    if (!store) return;
    const suffix = Date.now().toString(36);
    const write = (id: string) =>
      store.transactArtifacts("staging", (transaction) =>
        transaction.put(
          "event",
          id,
          {
            eventId: id,
            idempotencyKey: `dup-${suffix}`,
            subject: "s",
            type: "replay_viewed",
            artifactId: null,
            payload: {},
            createdAt: "2026-01-01T00:00:00.000Z",
          },
          { ownerSubject: `dup_${suffix}`, idempotencyKey: `dup-${suffix}` },
        ),
      );
    await write(`evt_a_${suffix}`);
    const error = await write(`evt_b_${suffix}`).catch((caught: unknown) => caught);
    expect(asMergeError(error).status).toBe(409);
  });
});
