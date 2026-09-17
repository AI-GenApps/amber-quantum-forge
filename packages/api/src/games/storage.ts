import type {
  AdminSummary,
  ChallengeRecord,
  ChallengeWriteInput,
  EntitlementRecord,
  GameNamespace,
  GameStorageSnapshot,
  PurchaseGrantInput,
  SaveConflict,
  SaveRecord,
  SaveWriteInput,
  SaveWriteSuccess,
} from "./contracts";

export interface GameStorage {
  getSave(
    namespace: GameNamespace,
    saveId: string,
    ownerUserId: string,
  ): Promise<SaveRecord | null>;
  putSave(
    namespace: GameNamespace,
    input: SaveWriteInput,
  ): Promise<SaveWriteSuccess | SaveConflict>;
  listEntitlements(namespace: GameNamespace, userId: string): Promise<EntitlementRecord[]>;
  grantPurchase(namespace: GameNamespace, input: PurchaseGrantInput): Promise<EntitlementRecord>;
  createChallenge(namespace: GameNamespace, input: ChallengeWriteInput): Promise<ChallengeRecord>;
  getChallenge(namespace: GameNamespace, challengeId: string): Promise<ChallengeRecord | null>;
  getAdminSummary(namespace: GameNamespace): Promise<AdminSummary>;
}

export class GameStorageUnavailableError extends Error {
  readonly code = "game_storage_unavailable";
}

function namespaceKey(namespace: GameNamespace): string {
  return JSON.stringify([namespace.appId, namespace.environment]);
}

function namespacePrefix(namespace: GameNamespace): string {
  return `${namespaceKey(namespace).slice(0, -1)},`;
}

function belongsToNamespace(key: string, namespace: GameNamespace): boolean {
  return key.startsWith(namespacePrefix(namespace));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class InMemoryGameStore implements GameStorage {
  private readonly saves = new Map<string, SaveRecord>();
  private readonly challenges = new Map<string, ChallengeRecord>();
  private readonly entitlements = new Map<string, EntitlementRecord>();

  async getSave(
    namespace: GameNamespace,
    saveId: string,
    ownerUserId: string,
  ): Promise<SaveRecord | null> {
    const record = this.saves.get(this.saveKey(namespace, saveId, ownerUserId));
    return record ? clone(record) : null;
  }

  async putSave(
    namespace: GameNamespace,
    input: SaveWriteInput,
  ): Promise<SaveWriteSuccess | SaveConflict> {
    const key = this.saveKey(namespace, input.saveId, input.ownerUserId);
    const current = this.saves.get(key);
    const currentVersion = current?.version ?? 0;
    if (input.expectedVersion !== currentVersion) {
      return { kind: "conflict", current: current ? clone(current) : null };
    }
    const record: SaveRecord = {
      saveId: input.saveId,
      ownerUserId: input.ownerUserId,
      schemaVersion: input.schemaVersion,
      version: currentVersion + 1,
      payload: clone(input.payload),
      updatedAt: new Date().toISOString(),
    };
    this.saves.set(key, record);
    return { kind: "saved", record: clone(record) };
  }

  async listEntitlements(namespace: GameNamespace, userId: string): Promise<EntitlementRecord[]> {
    const prefix = namespacePrefix(namespace);
    return Array.from(this.entitlements.entries())
      .filter(([key, value]) => key.startsWith(prefix) && value.userId === userId)
      .map(([, value]) => clone(value));
  }

  async grantPurchase(
    namespace: GameNamespace,
    input: PurchaseGrantInput,
  ): Promise<EntitlementRecord> {
    const key = this.entitlementKey(namespace, input.userId, input.entitlementId);
    const existing = this.entitlements.get(key);
    if (existing) return clone(existing);
    const record: EntitlementRecord = {
      entitlementId: input.entitlementId,
      productId: input.productId,
      purchaseId: input.purchaseId,
      userId: input.userId,
      grantedAt: new Date().toISOString(),
    };
    this.entitlements.set(key, record);
    return clone(record);
  }

  async createChallenge(
    namespace: GameNamespace,
    input: ChallengeWriteInput,
  ): Promise<ChallengeRecord> {
    const key = this.challengeKey(namespace, input.challengeId);
    if (this.challenges.has(key)) {
      throw new Error("Challenge already exists");
    }
    const now = new Date().toISOString();
    const record: ChallengeRecord = {
      challengeId: input.challengeId,
      ownerUserId: input.ownerUserId,
      memberUserIds: Array.from(new Set(input.memberUserIds)),
      payload: clone(input.payload),
      createdAt: now,
      updatedAt: now,
    };
    this.challenges.set(key, record);
    return clone(record);
  }

  async getChallenge(
    namespace: GameNamespace,
    challengeId: string,
  ): Promise<ChallengeRecord | null> {
    const record = this.challenges.get(this.challengeKey(namespace, challengeId));
    return record ? clone(record) : null;
  }

  async getAdminSummary(namespace: GameNamespace): Promise<AdminSummary> {
    return {
      appId: namespace.appId,
      environment: namespace.environment,
      saveCount: Array.from(this.saves.keys()).filter((key) => belongsToNamespace(key, namespace))
        .length,
      challengeCount: Array.from(this.challenges.keys()).filter((key) =>
        belongsToNamespace(key, namespace),
      ).length,
      entitlementCount: Array.from(this.entitlements.keys()).filter((key) =>
        belongsToNamespace(key, namespace),
      ).length,
    };
  }

  snapshot(namespace: GameNamespace): GameStorageSnapshot {
    return {
      saves: Array.from(this.saves.entries())
        .filter(([key]) => belongsToNamespace(key, namespace))
        .map(([, value]) => clone(value)),
      challenges: Array.from(this.challenges.entries())
        .filter(([key]) => belongsToNamespace(key, namespace))
        .map(([, value]) => clone(value)),
      entitlements: Array.from(this.entitlements.entries())
        .filter(([key]) => belongsToNamespace(key, namespace))
        .map(([, value]) => clone(value)),
    };
  }

  restore(namespace: GameNamespace, snapshot: GameStorageSnapshot): void {
    for (const record of snapshot.saves) {
      this.saves.set(this.saveKey(namespace, record.saveId, record.ownerUserId), clone(record));
    }
    for (const record of snapshot.challenges) {
      this.challenges.set(this.challengeKey(namespace, record.challengeId), clone(record));
    }
    for (const record of snapshot.entitlements) {
      this.entitlements.set(
        this.entitlementKey(namespace, record.userId, record.entitlementId),
        clone(record),
      );
    }
  }

  replaceSnapshot(namespace: GameNamespace, snapshot: GameStorageSnapshot): void {
    for (const key of Array.from(this.saves.keys())) {
      if (belongsToNamespace(key, namespace)) this.saves.delete(key);
    }
    for (const key of Array.from(this.challenges.keys())) {
      if (belongsToNamespace(key, namespace)) this.challenges.delete(key);
    }
    for (const key of Array.from(this.entitlements.keys())) {
      if (belongsToNamespace(key, namespace)) this.entitlements.delete(key);
    }
    this.restore(namespace, snapshot);
  }

  private saveKey(namespace: GameNamespace, saveId: string, userId: string): string {
    return JSON.stringify([namespace.appId, namespace.environment, userId, saveId]);
  }

  private challengeKey(namespace: GameNamespace, challengeId: string): string {
    return JSON.stringify([namespace.appId, namespace.environment, challengeId]);
  }

  private entitlementKey(namespace: GameNamespace, userId: string, entitlementId: string): string {
    return JSON.stringify([namespace.appId, namespace.environment, userId, entitlementId]);
  }
}

export class UnavailableGameStore implements GameStorage {
  private fail(): never {
    throw new GameStorageUnavailableError("No approved game storage is configured");
  }

  async getSave(): Promise<SaveRecord | null> {
    return this.fail();
  }

  async putSave(): Promise<SaveWriteSuccess | SaveConflict> {
    return this.fail();
  }

  async listEntitlements(): Promise<EntitlementRecord[]> {
    return this.fail();
  }

  async grantPurchase(): Promise<EntitlementRecord> {
    return this.fail();
  }

  async createChallenge(): Promise<ChallengeRecord> {
    return this.fail();
  }

  async getChallenge(): Promise<ChallengeRecord | null> {
    return this.fail();
  }

  async getAdminSummary(): Promise<AdminSummary> {
    return this.fail();
  }
}
