import { describe, expect, it } from "vitest";
import { adSsvRecordId } from "./ad-ssv-service";
import { parseConfigArtifact } from "./artifact-parsers";
import type { MergeRelayRecordType } from "./artifact-store";
import type { MergeEnvironment } from "./contracts";
import { getConfig, updateConfig } from "./data-service";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { retireChallenge } from "./relay-queries";
import { createChallenge, reserveAttempt } from "./relay-service";
import { rankedDependencies, testCheckpoint, testSession, testStores } from "./relay-test-support";
import { resolveRetentionPolicy } from "./retention-config";
import { pruneRetention } from "./retention-service";
import {
  ANCIENT,
  playToResult,
  seedAdSsv,
  seedEvent,
  seedOutbox,
  withClock,
} from "./retention-test-support";

const environment: MergeEnvironment = "debug";
const service = testSession("svc", environment, "service");
const noCursors = { dryRun: false, cursors: {} };

async function exists(
  dependencies: MergeRelayServiceDependencies,
  recordType: MergeRelayRecordType,
  recordId: string,
): Promise<boolean> {
  const page = await dependencies.store.readArtifacts(
    environment,
    { recordType, recordId, limit: 1 },
    (payload) => payload,
  );
  return page.items.length === 1;
}

for (const [name, factory] of testStores) {
  describe.skipIf(!factory)(`Merge Relay retention on ${name}`, () => {
    it("denies every non-service role", async () => {
      if (!factory) return;
      const deps = await rankedDependencies(factory(), environment);
      for (const role of ["player", "game_admin", "moderator"] as const)
        await expect(
          pruneRetention(deps, environment, testSession("x", environment, role), noCursors),
        ).rejects.toMatchObject({ status: 403, code: "service_role_required" });
    });

    it("validates policy bounds", () => {
      expect(() => resolveRetentionPolicy({ eventDays: 0 })).toThrow();
      expect(() => resolveRetentionPolicy({ batchLimit: 1.5 })).toThrow();
      expect(resolveRetentionPolicy(undefined).eventDays).toBe(90);
    });

    it("prunes only aged telemetry, ssv, delivered outbox and retired inactive attempts", async () => {
      if (!factory) return;
      const base = await rankedDependencies(factory(), environment);
      const suffix = Date.now().toString(36);
      const ancient = withClock(base, ANCIENT);
      await seedEvent(base, environment, `evt_old_${suffix}`, ANCIENT);
      await seedEvent(base, environment, `evt_new_${suffix}`, "2026-01-01T00:00:00.000Z");
      const oldSsv = await seedAdSsv(base, environment, `tx_old_${suffix}`, ANCIENT);
      const newSsv = await seedAdSsv(
        base,
        environment,
        `tx_new_${suffix}`,
        "2026-01-01T00:00:00.000Z",
      );
      expect(oldSsv).toBe(adSsvRecordId(`tx_old_${suffix}`));

      const played = await playToResult(base, environment, `a${suffix}`);
      const doneOld = await seedOutbox(
        base,
        environment,
        played.result,
        `done_old_${suffix}`,
        "succeeded",
        ANCIENT,
      );
      const doneNew = await seedOutbox(
        base,
        environment,
        played.result,
        `done_new_${suffix}`,
        "succeeded",
        "2026-01-01T00:00:00.000Z",
      );
      const pendingOld = await seedOutbox(
        base,
        environment,
        played.result,
        `pend_old_${suffix}`,
        "pending",
        ANCIENT,
      );

      const admin = testSession("admin", environment, "game_admin");
      const retiredChallenge = await createChallenge(
        ancient,
        environment,
        testSession(`own_${suffix}`, environment),
        {
          idempotencyKey: `ret-own-${suffix}`,
          creatorAlias: "Owner",
          checkpoint: testCheckpoint,
        },
      );
      const cancelled = await reserveAttempt(
        ancient,
        environment,
        testSession(`rec_${suffix}`, environment),
        retiredChallenge.challenge.challengeId,
        { reservationKey: `ret-res-${suffix}` },
      );
      await retireChallenge(ancient, environment, admin, retiredChallenge.challenge.challengeId);
      const openChallenge = await createChallenge(
        ancient,
        environment,
        testSession(`own2_${suffix}`, environment),
        {
          idempotencyKey: `ret-own2-${suffix}`,
          creatorAlias: "Owner",
          checkpoint: testCheckpoint,
        },
      );
      const expiredOpen = await reserveAttempt(
        ancient,
        environment,
        testSession(`rec2_${suffix}`, environment),
        openChallenge.challenge.challengeId,
        { reservationKey: `ret-res2-${suffix}` },
      );

      const dry = await pruneRetention(base, environment, service, { dryRun: true, cursors: {} });
      expect(dry.categories.events.deleted).toBeGreaterThanOrEqual(1);
      expect(await exists(base, "event", `evt_old_${suffix}`)).toBe(true);
      expect(await exists(base, "attempt", cancelled.attempt.attemptId)).toBe(true);

      const report = await pruneRetention(base, environment, service, noCursors);
      expect(report.categories.events.deleted).toBeGreaterThanOrEqual(1);
      expect(await exists(base, "event", `evt_old_${suffix}`)).toBe(false);
      expect(await exists(base, "event", `evt_new_${suffix}`)).toBe(true);
      expect(await exists(base, "ad_ssv", oldSsv)).toBe(false);
      expect(await exists(base, "ad_ssv", newSsv)).toBe(true);
      expect(await exists(base, "pgs_outbox", doneOld)).toBe(false);
      expect(await exists(base, "pgs_outbox", doneNew)).toBe(true);
      expect(await exists(base, "pgs_outbox", pendingOld)).toBe(true);
      expect(await exists(base, "attempt", cancelled.attempt.attemptId)).toBe(false);
      expect(await exists(base, "attempt", expiredOpen.attempt.attemptId)).toBe(true);
      expect(await exists(base, "attempt", played.attemptId)).toBe(true);
      expect(await exists(base, "challenge", retiredChallenge.challenge.challengeId)).toBe(true);
      expect(await exists(base, "challenge", played.challengeId)).toBe(true);
      expect(await exists(base, "result", played.result.resultId)).toBe(true);

      const again = await pruneRetention(base, environment, service, noCursors);
      for (const category of Object.values(again.categories)) expect(category.deleted).toBe(0);
    });

    it("pages through a backlog with cursors and a batch limit", async () => {
      if (!factory) return;
      const base = await rankedDependencies(factory(), environment);
      const deps: MergeRelayServiceDependencies = { ...base, retention: { batchLimit: 2 } };
      const suffix = Date.now().toString(36);
      const ids = [1, 2, 3, 4, 5].map((index) => `evt_page_${suffix}_${index}`);
      for (const id of ids) await seedEvent(deps, environment, id, ANCIENT);
      let cursors: Record<string, string> = {};
      let guard = 0;
      do {
        const report = await pruneRetention(deps, environment, service, {
          dryRun: false,
          cursors,
        });
        expect(report.categories.events.deleted).toBeLessThanOrEqual(2);
        const next = report.categories.events.nextCursor;
        cursors = next === null ? {} : { events: next };
        guard += 1;
        if (next === null) break;
      } while (guard < 200);
      for (const id of ids) expect(await exists(deps, "event", id)).toBe(false);
    });

    it("keeps the newest, active and challenge-referenced config revisions", async () => {
      if (!factory) return;
      const deps = await rankedDependencies(factory(), environment);
      const suffix = Date.now().toString(36);
      const pinned = await getConfig(deps, environment);
      const challenge = await createChallenge(
        deps,
        environment,
        testSession(`cfg_${suffix}`, environment),
        {
          idempotencyKey: `cfg-${suffix}`,
          creatorAlias: "Config",
          checkpoint: testCheckpoint,
        },
      );
      expect(challenge.challenge.configRevision).toBe(pinned.revision);
      const admin = testSession("admin", environment, "game_admin");
      for (let index = 0; index < 4; index += 1) {
        const current = await getConfig(deps, environment);
        await updateConfig(deps, environment, admin, {
          expectedRevision: current.revision,
          spawnTwoWeight: index % 2 === 0 ? 80 : 90,
          spawnFourWeight: index % 2 === 0 ? 20 : 10,
          features: current.features,
          contentRevision: current.contentRevision,
        });
      }
      const listRevisions = async () =>
        (
          await deps.store.readArtifacts(
            environment,
            { recordType: "config", direction: "desc", limit: 100 },
            parseConfigArtifact,
          )
        ).items.map((item) => item.revision);
      const before = await listRevisions();
      const pruning = { ...deps, retention: { configRevisionsKeep: 2 } };
      const report = await pruneRetention(pruning, environment, service, noCursors);
      const after = await listRevisions();
      expect(after.slice(0, 2)).toEqual(before.slice(0, 2));
      expect(after).toContain(pinned.revision);
      expect(after).toContain((await getConfig(deps, environment)).revision);
      expect(before.length - after.length).toBe(report.categories.configs.deleted);
      const again = await pruneRetention(pruning, environment, service, noCursors);
      expect(again.categories.configs.deleted).toBe(0);
    });
  });
}
