import { describe, expect, it } from "vitest";
import { parseEventArtifact, parseSaveArtifact } from "./artifact-parsers";
import type { MergeEnvironment, MergeEvent, MergeSave, MergeSession } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { DrizzleMergeRelayStore } from "./drizzle-store";
import { createGuest, upgradeGuest } from "./identity-service";
import {
  parseSaveWriteReceipt,
  savePayloadFingerprint,
  saveReceiptRecordId,
} from "./save-contracts";
import { putSave, putSaveWithReceipt } from "./save-service";

const databaseUrl = process.env.MERGE_RELAY_TEST_DATABASE_URL;
const suite = describe.skipIf(!databaseUrl);

function session(subject: string, environment: MergeEnvironment = "staging"): MergeSession {
  return { appId: "merge_relay", environment, subject, role: "player" };
}

function dependencies(store: DrizzleMergeRelayStore): MergeRelayServiceDependencies {
  return {
    store,
    clock: { now: () => new Date("2026-01-01T00:00:00.000Z") },
    rewardProvider: null,
  };
}

function saveInput(
  expectedVersion: number,
  score: number,
  clientWriteId?: string,
): Parameters<typeof putSaveWithReceipt>[4] {
  return {
    expectedVersion,
    schemaVersion: 1,
    payload: { score },
    ...(clientWriteId === undefined ? {} : { clientWriteId }),
  };
}

suite("Merge Relay PostgreSQL cloud save receipts", () => {
  it("durably replays the original receipt after a later write", async () => {
    const suffix = Date.now().toString(36);
    const store = new DrizzleMergeRelayStore();
    const deps = dependencies(store);
    const player = session(`receipt_${suffix}`);
    const first = await putSaveWithReceipt(
      deps,
      "staging",
      player,
      `main_${suffix}`,
      saveInput(0, 1, `write_${suffix}`),
    );
    await putSave(deps, "staging", player, `main_${suffix}`, saveInput(1, 2));
    const replay = await putSaveWithReceipt(
      dependencies(new DrizzleMergeRelayStore()),
      "staging",
      player,
      `main_${suffix}`,
      saveInput(0, 1, `write_${suffix}`),
    );
    expect(first.receipt?.eventId).toBe(replay.receipt?.eventId);
    expect(replay.replayed).toBe(true);
    expect(replay.save.version).toBe(1);
    const stateSaveIds = await store.transact("staging", async (state) =>
      state.saves.filter((save) => save.saveId === `main_${suffix}`).map((save) => save.saveId),
    );
    expect(stateSaveIds).toEqual([`main_${suffix}`]);
    const receipts = await store.readArtifacts(
      "staging",
      { recordType: "save_write_receipt", ownerSubject: player.subject, limit: 10 },
      parseSaveWriteReceipt,
    );
    expect(receipts.items).toHaveLength(1);
  });

  it("migrates a receipt with the guest save in one database transaction", async () => {
    const suffix = Date.now().toString(36);
    const store = new DrizzleMergeRelayStore();
    const deps = dependencies(store);
    const guest = await createGuest(deps, "staging");
    const saveId = `guest_${suffix}`;
    await putSaveWithReceipt(
      deps,
      "staging",
      session(guest.subject),
      saveId,
      saveInput(0, 4, `guest_write_${suffix}`),
    );
    await upgradeGuest(deps, "staging", session(`account_${suffix}`), {
      recoveryToken: guest.recoveryToken,
    });
    const replay = await putSaveWithReceipt(
      deps,
      "staging",
      session(`account_${suffix}`),
      saveId,
      saveInput(0, 4, `guest_write_${suffix}`),
    );
    expect(replay.replayed).toBe(true);
    expect(replay.save.subject).toBe(`account_${suffix}`);
  });

  it("serializes concurrent retries with the same write ID", async () => {
    const suffix = Date.now().toString(36);
    const store = new DrizzleMergeRelayStore();
    const deps = dependencies(store);
    const player = session(`concurrent_${suffix}`);
    const writes = await Promise.all([
      putSaveWithReceipt(
        deps,
        "staging",
        player,
        `main_${suffix}`,
        saveInput(0, 1, `write_${suffix}`),
      ),
      putSaveWithReceipt(
        deps,
        "staging",
        player,
        `main_${suffix}`,
        saveInput(0, 1, `write_${suffix}`),
      ),
    ]);
    expect(writes.filter((write) => write.replayed)).toHaveLength(1);
    expect(writes.filter((write) => !write.replayed)).toHaveLength(1);
    const saves = await store.readArtifacts(
      "staging",
      { recordType: "save", ownerSubject: player.subject, limit: 10 },
      parseSaveArtifact,
    );
    expect(saves.items).toHaveLength(1);
    expect(saves.items[0]?.version).toBe(1);
  });

  it("rolls back save, event, and receipt together", async () => {
    const suffix = Date.now().toString(36);
    const store = new DrizzleMergeRelayStore();
    const subject = `rollback_${suffix}`;
    const saveId = `main_${suffix}`;
    const clientWriteId = `write_${suffix}`;
    const payloadFingerprint = savePayloadFingerprint({
      schemaVersion: 1,
      payload: { score: 3 },
    });
    const save: MergeSave = {
      saveId,
      subject,
      schemaVersion: 1,
      version: 1,
      payload: { score: 3 },
      payloadFingerprint,
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const event: MergeEvent = {
      eventId: `event_${suffix}`,
      idempotencyKey: `event_${suffix}`,
      subject,
      type: "checkpoint_saved",
      artifactId: saveId,
      payload: { version: 1 },
      createdAt: save.updatedAt,
    };
    const receipt = {
      receiptId: saveReceiptRecordId(subject, saveId, clientWriteId),
      environment: "staging" as const,
      subject,
      saveId,
      clientWriteId,
      expectedVersion: 0,
      schemaVersion: 1,
      payload: save.payload,
      payloadFingerprint,
      savedVersion: 1,
      eventId: event.eventId,
      createdAt: save.updatedAt,
    };
    await expect(
      store.transactArtifacts("staging", async (transaction) => {
        await transaction.put("save", JSON.stringify([subject, saveId]), save, {
          ownerSubject: subject,
        });
        await transaction.put("event", event.eventId, event, {
          ownerSubject: subject,
          idempotencyKey: event.idempotencyKey,
        });
        await transaction.put("save_write_receipt", receipt.receiptId, receipt, {
          ownerSubject: subject,
          idempotencyKey: receipt.receiptId,
        });
        throw new Error("receipt-rollback");
      }),
    ).rejects.toThrow("receipt-rollback");
    expect(
      (
        await store.readArtifacts(
          "staging",
          { recordType: "save", ownerSubject: subject, limit: 10 },
          parseSaveArtifact,
        )
      ).items,
    ).toHaveLength(0);
    expect(
      (
        await store.readArtifacts(
          "staging",
          { recordType: "event", ownerSubject: subject, limit: 10 },
          parseEventArtifact,
        )
      ).items,
    ).toHaveLength(0);
    expect(
      (
        await store.readArtifacts(
          "staging",
          { recordType: "save_write_receipt", ownerSubject: subject, limit: 10 },
          parseSaveWriteReceipt,
        )
      ).items,
    ).toHaveLength(0);
  });

  it("keeps a guest write and upgrade in one subject namespace", async () => {
    const suffix = Date.now().toString(36);
    const store = new DrizzleMergeRelayStore();
    const deps = dependencies(store);
    const guest = await createGuest(deps, "staging");
    const account = `race_account_${suffix}`;
    const saveId = `race_${suffix}`;
    const [write, upgrade] = await Promise.allSettled([
      putSaveWithReceipt(
        deps,
        "staging",
        session(guest.subject),
        saveId,
        saveInput(0, 8, `race_write_${suffix}`),
      ),
      upgradeGuest(deps, "staging", session(account), { recoveryToken: guest.recoveryToken }),
    ]);
    expect(write.status).toBe("fulfilled");
    expect(upgrade.status).toBe("fulfilled");
    const guestSaves = await store.readArtifacts(
      "staging",
      { recordType: "save", ownerSubject: guest.subject, limit: 10 },
      parseSaveArtifact,
    );
    const accountSaves = await store.readArtifacts(
      "staging",
      { recordType: "save", ownerSubject: account, limit: 10 },
      parseSaveArtifact,
    );
    expect(guestSaves.items).toHaveLength(0);
    expect(accountSaves.items.map((save) => save.saveId)).toEqual([saveId]);
  });
});
