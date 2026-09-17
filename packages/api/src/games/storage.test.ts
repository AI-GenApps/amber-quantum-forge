import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FileGameStore,
  type GameNamespace,
  GameStorageUnavailableError,
  InMemoryGameStore,
} from "./index";

const namespace: GameNamespace = { appId: "merge_relay", environment: "debug" };

function saveInput(saveId: string, ownerUserId: string, expectedVersion = 0) {
  return {
    saveId,
    ownerUserId,
    schemaVersion: 1,
    expectedVersion,
    payload: { saveId },
  };
}

async function tempRoot(): Promise<string> {
  return mkdtemp(join(tmpdir(), "games-api-"));
}

describe("game storage isolation", () => {
  it("uses collision-proof user and save tuple keys", async () => {
    const store = new InMemoryGameStore();
    await store.putSave(namespace, saveInput("c", "a:b"));
    await store.putSave(namespace, saveInput("b:c", "a"));
    const first = await store.getSave(namespace, "c", "a:b");
    const second = await store.getSave(namespace, "b:c", "a");
    expect(first?.payload.saveId).toBe("c");
    expect(second?.payload.saveId).toBe("b:c");
    await store.grantPurchase(namespace, {
      entitlementId: "ent-1",
      productId: "product",
      purchaseId: "purchase",
      userId: "a:b",
    });
    expect(await store.listEntitlements(namespace, "a")).toHaveLength(0);
    expect(await store.listEntitlements(namespace, "a:b")).toHaveLength(1);
  });

  it("serializes file writes and survives a new store instance", async () => {
    const root = await tempRoot();
    try {
      const store = new FileGameStore(root);
      const results = await Promise.all([
        store.putSave(namespace, saveInput("first", "owner-1")),
        store.putSave(namespace, saveInput("second", "owner-2")),
      ]);
      expect(results.every((result) => result.kind === "saved")).toBe(true);
      const reloaded = new FileGameStore(root);
      expect(await reloaded.getSave(namespace, "first", "owner-1")).not.toBeNull();
      expect(await reloaded.getSave(namespace, "second", "owner-2")).not.toBeNull();
      const raw = await readFile(join(root, "merge_relay__debug.json"), "utf8");
      expect(JSON.parse(raw).contract_version).toBe("games.v1");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rolls back memory when atomic persistence fails", async () => {
    const root = await tempRoot();
    try {
      const store = new FileGameStore(root);
      await store.putSave(namespace, saveInput("stable", "owner"));
      const path = join(root, "merge_relay__debug.json");
      await rm(path);
      await mkdir(path);
      await expect(store.putSave(namespace, saveInput("failed", "owner"))).rejects.toBeInstanceOf(
        GameStorageUnavailableError,
      );
      expect(await store.getSave(namespace, "stable", "owner")).not.toBeNull();
      expect(await store.getSave(namespace, "failed", "owner")).toBeNull();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects a snapshot copied from another app scope", async () => {
    const root = await tempRoot();
    try {
      await writeFile(
        join(root, "merge_relay__debug.json"),
        JSON.stringify({
          contract_version: "games.v1",
          app_id: "pocket_biome",
          environment: "debug",
          saves: [],
          challenges: [],
          entitlements: [],
        }),
      );
      const store = new FileGameStore(root);
      await expect(store.getAdminSummary(namespace)).rejects.toBeInstanceOf(
        GameStorageUnavailableError,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("fails closed for production file storage", async () => {
    const root = await tempRoot();
    try {
      const store = new FileGameStore(root);
      await expect(
        store.getAdminSummary({ appId: "merge_relay", environment: "production" }),
      ).rejects.toBeInstanceOf(GameStorageUnavailableError);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
