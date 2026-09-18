import { describe, expect, it } from "vitest";
import { parseEventArtifact, parseSaveArtifact } from "./artifact-parsers";
import type { MergeEvent, MergeSave } from "./contracts";
import { DrizzleMergeRelayStore } from "./drizzle-store";

const databaseUrl = process.env.MERGE_RELAY_TEST_DATABASE_URL;
const suite = describe.skipIf(!databaseUrl);

suite("Merge Relay isolated PostgreSQL adapter", () => {
  it("serializes concurrent saves without rewriting unrelated artifacts", async () => {
    if (!databaseUrl) return;
    const store = new DrizzleMergeRelayStore();
    const suffix = Date.now().toString(36);
    await Promise.all([writeSave(store, `one_${suffix}`, 1), writeSave(store, `two_${suffix}`, 2)]);
    const saves = await store.read("staging", async (state) => state.saves);
    expect(saves.filter((save) => save.saveId.endsWith(suffix))).toHaveLength(2);
  });

  it("rolls back a failed operation before any artifact upsert", async () => {
    if (!databaseUrl) return;
    const store = new DrizzleMergeRelayStore();
    const saveId = `stable_${Date.now().toString(36)}`;
    await writeSave(store, saveId, 1);
    await expect(
      store.transact("staging", async () => {
        throw new Error("rollback-check");
      }),
    ).rejects.toThrow("rollback-check");
    const save = await store.read("staging", async (state) =>
      state.saves.find((candidate) => candidate.saveId === saveId),
    );
    expect(save?.payload).toEqual({ score: 1 });
  });

  it("serializes targeted writes and keeps environment namespaces isolated", async () => {
    if (!databaseUrl) return;
    const store = new DrizzleMergeRelayStore();
    const suffix = Date.now().toString(36);
    await Promise.all([
      putTargetedSave(store, "debug", `target_one_${suffix}`, 1),
      putTargetedSave(store, "debug", `target_two_${suffix}`, 2),
    ]);
    const debug = await store.readArtifacts(
      "debug",
      { recordType: "save", ownerSubject: "targeted", limit: 100 },
      parseSaveArtifact,
    );
    const staging = await store.readArtifacts(
      "staging",
      { recordType: "save", ownerSubject: "targeted", limit: 100 },
      parseSaveArtifact,
    );
    expect(debug.items.filter((save) => save.saveId.includes(suffix))).toHaveLength(2);
    expect(staging.items.filter((save) => save.saveId.includes(suffix))).toHaveLength(0);
  });

  it("rolls back targeted artifacts and exposes bounded cursors", async () => {
    if (!databaseUrl) return;
    const store = new DrizzleMergeRelayStore();
    const suffix = Date.now().toString(36);
    await expect(
      store.transactArtifacts("debug", async (transaction) => {
        await transaction.put(
          "save",
          JSON.stringify(["rollback", suffix]),
          {
            saveId: `rollback_${suffix}`,
            subject: "rollback",
            schemaVersion: 1,
            version: 1,
            payload: {},
            updatedAt: new Date().toISOString(),
          } satisfies MergeSave,
          { ownerSubject: "rollback" },
        );
        throw new Error("targeted-rollback");
      }),
    ).rejects.toThrow("targeted-rollback");
    const rolledBack = await store.readArtifacts(
      "debug",
      { recordType: "save", ownerSubject: "rollback", limit: 100 },
      parseSaveArtifact,
    );
    expect(rolledBack.items.some((save) => save.saveId === `rollback_${suffix}`)).toBe(false);

    for (let index = 0; index < 105; index += 1)
      await store.transactArtifacts("debug", async (transaction) => {
        const event: MergeEvent = {
          eventId: `bounded_${suffix}_${index}`,
          idempotencyKey: `bounded_${suffix}_${index}`,
          subject: `bounded_${suffix}`,
          type: "replay_viewed",
          artifactId: null,
          payload: {},
          createdAt: new Date().toISOString(),
        };
        await transaction.put("event", event.eventId, event, {
          ownerSubject: event.subject,
          idempotencyKey: event.idempotencyKey,
        });
      });
    const first = await store.readArtifacts(
      "debug",
      { recordType: "event", ownerSubject: `bounded_${suffix}`, limit: 100 },
      parseEventArtifact,
    );
    expect(first.items).toHaveLength(100);
    expect(first.nextCursor).toBeTruthy();
    const second = await store.readArtifacts(
      "debug",
      {
        recordType: "event",
        ownerSubject: `bounded_${suffix}`,
        afterRecordId: first.nextCursor ?? "",
        limit: 100,
      },
      parseEventArtifact,
    );
    expect(second.items.filter((event) => event.eventId.includes(suffix))).toHaveLength(5);
  });

  it("enforces artifact parents and idempotency uniqueness in PostgreSQL", async () => {
    if (!databaseUrl) return;
    const store = new DrizzleMergeRelayStore();
    const suffix = Date.now().toString(36);
    await expect(
      store.transactArtifacts("debug", async (transaction) =>
        transaction.put(
          "event",
          `invalid_parent_${suffix}`,
          {
            eventId: `invalid_parent_${suffix}`,
            idempotencyKey: `constraint_${suffix}`,
            subject: "player",
            type: "replay_viewed",
            artifactId: null,
            payload: {},
            createdAt: new Date().toISOString(),
          } satisfies MergeEvent,
          {
            ownerSubject: "player",
            idempotencyKey: `constraint_${suffix}`,
            parentRecordType: "challenge",
            parentRecordId: `missing_${suffix}`,
          },
        ),
      ),
    ).rejects.toThrow(/foreign key/);
    await store.transactArtifacts("debug", async (transaction) =>
      transaction.put(
        "event",
        `valid_parent_${suffix}`,
        {
          eventId: `valid_parent_${suffix}`,
          idempotencyKey: `unique_${suffix}`,
          subject: "player",
          type: "replay_viewed",
          artifactId: null,
          payload: {},
          createdAt: new Date().toISOString(),
        } satisfies MergeEvent,
        { ownerSubject: "player", idempotencyKey: `unique_${suffix}` },
      ),
    );
    await expect(
      store.transactArtifacts("debug", async (transaction) =>
        transaction.put(
          "event",
          `duplicate_${suffix}`,
          {
            eventId: `duplicate_${suffix}`,
            idempotencyKey: `unique_${suffix}`,
            subject: "player",
            type: "replay_viewed",
            artifactId: null,
            payload: {},
            createdAt: new Date().toISOString(),
          } satisfies MergeEvent,
          { ownerSubject: "player", idempotencyKey: `unique_${suffix}` },
        ),
      ),
    ).rejects.toThrow(/unique/);
  });
});

async function putTargetedSave(
  store: DrizzleMergeRelayStore,
  environment: "debug" | "staging" | "production",
  saveId: string,
  score: number,
): Promise<void> {
  await store.transactArtifacts(environment, async (transaction) => {
    await transaction.put(
      "save",
      JSON.stringify(["targeted", saveId]),
      {
        saveId,
        subject: "targeted",
        schemaVersion: 1,
        version: 1,
        payload: { score },
        updatedAt: new Date().toISOString(),
      } satisfies MergeSave,
      { ownerSubject: "targeted" },
    );
  });
}

async function writeSave(
  store: DrizzleMergeRelayStore,
  saveId: string,
  score: number,
): Promise<void> {
  await store.transact("staging", async (state) => {
    state.saves.push({
      saveId,
      subject: "player",
      schemaVersion: 1,
      version: 1,
      payload: { score },
      updatedAt: new Date().toISOString(),
    });
    return undefined;
  });
}
