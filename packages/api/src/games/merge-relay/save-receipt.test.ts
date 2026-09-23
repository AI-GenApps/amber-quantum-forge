import { describe, expect, it } from "vitest";
import { parseEventArtifact } from "./artifact-parsers";
import type { MergeRelayArtifactTransaction } from "./artifact-store";
import type { MergeEnvironment, MergeSession } from "./contracts";
import type { MergeRelayClock, MergeRelayServiceDependencies } from "./dependencies";
import { createGuest, upgradeGuest } from "./identity-service";
import { InMemoryMergeRelayStore } from "./memory-store";
import { parseSaveWriteReceipt } from "./save-contracts";
import { getSave, putSave, putSaveWithReceipt } from "./save-service";
import { emptyMergeRelayState } from "./store";

class FixedClock implements MergeRelayClock {
  private current = new Date("2026-01-01T00:00:00.000Z");

  now(): Date {
    return new Date(this.current);
  }

  advance(minutes: number): void {
    this.current = new Date(this.current.getTime() + minutes * 60 * 1000);
  }
}

function session(subject: string, environment: MergeEnvironment = "debug"): MergeSession {
  return { appId: "merge_relay", environment, subject, role: "player" };
}

function setup() {
  const clock = new FixedClock();
  const store = new InMemoryMergeRelayStore({
    debug: emptyMergeRelayState(),
    staging: emptyMergeRelayState(),
  });
  const dependencies: MergeRelayServiceDependencies = {
    store,
    clock,
    rewardProvider: null,
  };
  return { clock, store, dependencies };
}

function input(payload: Record<string, boolean | number | string>, clientWriteId?: string) {
  return {
    expectedVersion: 0,
    schemaVersion: 1,
    payload,
    ...(clientWriteId === undefined ? {} : { clientWriteId }),
  };
}

class EventFailingStore extends InMemoryMergeRelayStore {
  override async transactArtifacts<T>(
    environment: MergeEnvironment,
    operation: (transaction: MergeRelayArtifactTransaction) => Promise<T>,
  ): Promise<T> {
    return super.transactArtifacts(environment, (transaction) =>
      operation({
        ...transaction,
        put: async (recordType, recordId, payload, metadata) => {
          if (recordType === "event") throw new Error("event-write-failed");
          await transaction.put(recordType, recordId, payload, metadata);
        },
      }),
    );
  }
}

describe("Merge Relay cloud save receipts", () => {
  it("replays the original receipt after a later save", async () => {
    const { clock, dependencies, store } = setup();
    const player = session("player");
    const first = await putSaveWithReceipt(
      dependencies,
      "debug",
      player,
      "main",
      input({ score: 1 }, "write-1"),
    );
    clock.advance(1);
    await putSave(dependencies, "debug", player, "main", {
      expectedVersion: 1,
      schemaVersion: 1,
      payload: { score: 2 },
    });
    const replay = await putSaveWithReceipt(
      dependencies,
      "debug",
      player,
      "main",
      input({ score: 1 }, "write-1"),
    );
    expect(first.receipt?.eventId).toBe(replay.receipt?.eventId);
    expect(replay.replayed).toBe(true);
    expect(replay.save.version).toBe(1);
    expect(replay.save.payload).toEqual({ score: 1 });
    expect((await getSave(dependencies, "debug", player, "main"))?.version).toBe(2);
    const events = await store.readArtifacts(
      "debug",
      { recordType: "event", limit: 10 },
      parseEventArtifact,
    );
    expect(events.items.filter((event) => event.type === "checkpoint_saved")).toHaveLength(2);
  });

  it("rejects a reused write ID with changed semantics or expected version", async () => {
    const { dependencies } = setup();
    const player = session("player");
    await putSaveWithReceipt(dependencies, "debug", player, "main", input({ score: 1 }, "write-1"));
    await expect(
      putSaveWithReceipt(dependencies, "debug", player, "main", input({ score: 9 }, "write-1")),
    ).rejects.toMatchObject({ code: "save_write_id_conflict" });
    await expect(
      putSaveWithReceipt(dependencies, "debug", player, "main", {
        expectedVersion: 1,
        schemaVersion: 1,
        payload: { score: 1 },
        clientWriteId: "write-1",
      }),
    ).rejects.toMatchObject({ code: "save_write_id_conflict" });
  });

  it("keeps optimistic stale writes explicit for old clients", async () => {
    const { dependencies } = setup();
    const player = session("player");
    await putSave(dependencies, "debug", player, "main", {
      expectedVersion: 0,
      schemaVersion: 1,
      payload: { score: 1 },
    });
    await expect(
      putSave(dependencies, "debug", player, "main", {
        expectedVersion: 0,
        schemaVersion: 1,
        payload: { score: 2 },
      }),
    ).rejects.toMatchObject({ code: "save_version_conflict" });
  });

  it("rolls back the save and receipt when the checkpoint event fails", async () => {
    const clock = new FixedClock();
    const store = new EventFailingStore({ debug: emptyMergeRelayState() });
    const dependencies: MergeRelayServiceDependencies = {
      store,
      clock,
      rewardProvider: null,
    };
    await expect(
      putSaveWithReceipt(
        dependencies,
        "debug",
        session("player"),
        "main",
        input({ score: 1 }, "write-1"),
      ),
    ).rejects.toThrow("event-write-failed");
    expect(await getSave(dependencies, "debug", session("player"), "main")).toBeNull();
    const receipts = await store.readArtifacts(
      "debug",
      { recordType: "save_write_receipt", limit: 10 },
      parseSaveWriteReceipt,
    );
    expect(receipts.items).toHaveLength(0);
  });

  it("isolates identical write IDs by subject, environment, and save key", async () => {
    const { dependencies } = setup();
    const first = await putSaveWithReceipt(
      dependencies,
      "debug",
      session("one"),
      "main",
      input({ owner: "one" }, "same-id"),
    );
    const second = await putSaveWithReceipt(
      dependencies,
      "debug",
      session("two"),
      "main",
      input({ owner: "two" }, "same-id"),
    );
    const otherSave = await putSaveWithReceipt(
      dependencies,
      "debug",
      session("one"),
      "other",
      input({ owner: "one" }, "same-id"),
    );
    const staging = await putSaveWithReceipt(
      dependencies,
      "staging",
      session("one", "staging"),
      "main",
      input({ owner: "one" }, "same-id"),
    );
    expect([first, second, otherSave, staging].every((write) => !write.replayed)).toBe(true);
    const receipts = await dependencies.store.readArtifacts(
      "debug",
      { recordType: "save_write_receipt", limit: 10 },
      parseSaveWriteReceipt,
    );
    expect(receipts.items).toHaveLength(3);
  });

  it("migrates receipts with a guest save during upgrade", async () => {
    const { dependencies, store } = setup();
    const guest = await createGuest(dependencies, "debug");
    const guestSession = session(guest.subject);
    await putSaveWithReceipt(
      dependencies,
      "debug",
      guestSession,
      "main",
      input({ score: 4 }, "guest-write"),
    );
    await upgradeGuest(dependencies, "debug", session("account"), {
      recoveryToken: guest.recoveryToken,
    });
    const replay = await putSaveWithReceipt(
      dependencies,
      "debug",
      session("account"),
      "main",
      input({ score: 4 }, "guest-write"),
    );
    expect(replay.replayed).toBe(true);
    expect(replay.save.subject).toBe("account");
    const guestReceipts = await store.readArtifacts(
      "debug",
      { recordType: "save_write_receipt", ownerSubject: guest.subject, limit: 10 },
      parseSaveWriteReceipt,
    );
    expect(guestReceipts.items).toHaveLength(0);
  });

  it("rejects guest self-upgrade without deleting its receipt", async () => {
    const { dependencies } = setup();
    const guest = await createGuest(dependencies, "debug");
    const guestSession = session(guest.subject);
    const first = await putSaveWithReceipt(
      dependencies,
      "debug",
      guestSession,
      "main",
      input({ score: 4 }, "guest-write"),
    );
    await expect(
      upgradeGuest(dependencies, "debug", guestSession, {
        recoveryToken: guest.recoveryToken,
      }),
    ).rejects.toMatchObject({ code: "guest_self_upgrade" });
    const replay = await putSaveWithReceipt(
      dependencies,
      "debug",
      guestSession,
      "main",
      input({ score: 4 }, "guest-write"),
    );
    expect(replay.replayed).toBe(true);
    expect(replay.receipt?.receiptId).toBe(first.receipt?.receiptId);
  });
});
