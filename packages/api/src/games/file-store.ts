import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  AdminSummary,
  ChallengeRecord,
  ChallengeWriteInput,
  EntitlementRecord,
  GameNamespace,
  PurchaseGrantInput,
  SaveConflict,
  SaveRecord,
  SaveWriteInput,
  SaveWriteSuccess,
} from "./contracts";
import { emptySnapshot, parseSnapshot, snapshotEnvelope } from "./file-snapshot";
import { type GameStorage, GameStorageUnavailableError, InMemoryGameStore } from "./storage";
import { isGameAppId, isGameEnvironment } from "./validation";

export class FileGameStore implements GameStorage {
  private readonly root: string;
  private readonly memory = new InMemoryGameStore();
  private readonly loaded = new Set<string>();
  private readonly tails = new Map<string, Promise<void>>();

  constructor(root: string) {
    if (!root.trim()) throw new GameStorageUnavailableError("Game storage root is required");
    this.root = root;
  }

  getSave(
    namespace: GameNamespace,
    saveId: string,
    ownerUserId: string,
  ): Promise<SaveRecord | null> {
    return this.run(namespace, false, () => this.memory.getSave(namespace, saveId, ownerUserId));
  }

  putSave(
    namespace: GameNamespace,
    input: SaveWriteInput,
  ): Promise<SaveWriteSuccess | SaveConflict> {
    return this.run(namespace, true, () => this.memory.putSave(namespace, input));
  }

  listEntitlements(namespace: GameNamespace, userId: string): Promise<EntitlementRecord[]> {
    return this.run(namespace, false, () => this.memory.listEntitlements(namespace, userId));
  }

  grantPurchase(namespace: GameNamespace, input: PurchaseGrantInput): Promise<EntitlementRecord> {
    return this.run(namespace, true, () => this.memory.grantPurchase(namespace, input));
  }

  createChallenge(namespace: GameNamespace, input: ChallengeWriteInput): Promise<ChallengeRecord> {
    return this.run(namespace, true, () => this.memory.createChallenge(namespace, input));
  }

  getChallenge(namespace: GameNamespace, challengeId: string): Promise<ChallengeRecord | null> {
    return this.run(namespace, false, () => this.memory.getChallenge(namespace, challengeId));
  }

  getAdminSummary(namespace: GameNamespace): Promise<AdminSummary> {
    return this.run(namespace, false, () => this.memory.getAdminSummary(namespace));
  }

  private async run<T>(
    namespace: GameNamespace,
    mutating: boolean,
    operation: () => Promise<T>,
  ): Promise<T> {
    this.assertLocal(namespace);
    const key = this.scopeKey(namespace);
    const previous = this.tails.get(key) ?? Promise.resolve();
    const current = previous
      .catch(() => undefined)
      .then(async () => {
        await this.ensureLoaded(namespace);
        const before = this.memory.snapshot(namespace);
        try {
          const result = await operation();
          if (mutating) await this.persist(namespace);
          return result;
        } catch (error) {
          if (mutating) this.memory.replaceSnapshot(namespace, before);
          throw error;
        }
      });
    this.tails.set(
      key,
      (async () => {
        try {
          await current;
        } catch {
          return;
        }
      })(),
    );
    return current;
  }

  private async ensureLoaded(namespace: GameNamespace): Promise<void> {
    const key = this.scopeKey(namespace);
    if (this.loaded.has(key)) return;
    await mkdir(this.root, { recursive: true });
    try {
      const raw = await readFile(this.pathFor(namespace), "utf8");
      this.memory.replaceSnapshot(namespace, parseSnapshot(JSON.parse(raw), namespace));
    } catch (error) {
      if (isMissingFile(error)) {
        await this.persistSnapshot(namespace, emptySnapshot(namespace));
      } else if (error instanceof GameStorageUnavailableError) {
        throw error;
      } else {
        throw new GameStorageUnavailableError("Game storage snapshot could not be read");
      }
    }
    this.loaded.add(key);
  }

  private async persist(namespace: GameNamespace): Promise<void> {
    await this.persistSnapshot(
      namespace,
      snapshotEnvelope(namespace, this.memory.snapshot(namespace)),
    );
  }

  private async persistSnapshot(namespace: GameNamespace, snapshot: object): Promise<void> {
    const path = this.pathFor(namespace);
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify(snapshot), "utf8");
      await rename(temporary, path);
    } catch {
      try {
        await unlink(temporary);
      } catch {
        throw new GameStorageUnavailableError("Game storage snapshot could not be written");
      }
      throw new GameStorageUnavailableError("Game storage snapshot could not be written");
    }
  }

  private pathFor(namespace: GameNamespace): string {
    return join(
      this.root,
      encodeURIComponent(namespace.appId) +
        "__" +
        encodeURIComponent(namespace.environment) +
        ".json",
    );
  }

  private scopeKey(namespace: GameNamespace): string {
    return JSON.stringify([namespace.appId, namespace.environment]);
  }

  private assertLocal(namespace: GameNamespace): void {
    if (!isGameAppId(namespace.appId) || !isGameEnvironment(namespace.environment)) {
      throw new GameStorageUnavailableError("Game storage scope is invalid");
    }
    if (namespace.environment === "production") {
      throw new GameStorageUnavailableError("File game storage is local-only");
    }
  }
}

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
