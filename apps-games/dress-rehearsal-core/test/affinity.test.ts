import { describe, expect, it } from "vitest";
import {
  AFFINITY_PAYMENT,
  AFFINITY_THRESHOLDS,
  affinityLevel,
  affinityProgress,
  affinityStars,
  applyCampaignResult,
  CHALLENGES,
  CLIENT_IDS,
  CLIENTS,
  defaultProfile,
  type Profile,
  type ProgressEvent,
  type Stars,
} from "../src/index";
import { score } from "./helpers/profiles";

const MIREILLE = CHALLENGES.filter((def) => def.clientId === "mireille");

function play(
  profile: Profile,
  results: readonly Stars[],
): { profile: Profile; events: ProgressEvent[] } {
  let current = profile;
  const events: ProgressEvent[] = [];
  results.forEach((stars, index) => {
    const def = MIREILLE[index];
    if (def === undefined) throw new Error("not enough challenges");
    const update = applyCampaignResult(current, def.id, score(stars));
    current = update.profile;
    events.push(...update.events);
  });
  return { profile: current, events };
}

function levels(events: readonly ProgressEvent[]): number[] {
  return events.flatMap((event) => (event.type === "affinity-level" ? [event.level] : []));
}

describe("affinity thresholds", () => {
  it("are 3, 9 and 15 stars", () => {
    expect([...AFFINITY_THRESHOLDS]).toEqual([3, 9, 15]);
  });

  it("every client has enough challenges to reach level 3", () => {
    for (const client of CLIENTS) {
      const own = CHALLENGES.filter((def) => def.clientId === client.id);
      expect(own.length * 3, client.id).toBeGreaterThanOrEqual(15);
    }
  });

  it("matches the per-client challenge counts in economy.md", () => {
    const counts = CLIENT_IDS.map((id) => CHALLENGES.filter((def) => def.clientId === id).length);
    expect(counts).toEqual([7, 7, 7, 7, 6, 6]);
  });
});

describe("affinity levels", () => {
  it("level 1 at 3 stars, not at 2", () => {
    const two = play(defaultProfile(), [1, 1]);
    expect(affinityStars(two.profile, "mireille")).toBe(2);
    expect(affinityLevel(two.profile, "mireille")).toBe(0);
    expect(levels(two.events)).toEqual([]);
    const three = play(defaultProfile(), [1, 1, 1]);
    expect(affinityLevel(three.profile, "mireille")).toBe(1);
    expect(levels(three.events)).toEqual([1]);
  });

  it("level 2 at 9 stars, not at 8", () => {
    const eight = play(defaultProfile(), [3, 3, 2]);
    expect(affinityLevel(eight.profile, "mireille")).toBe(1);
    const nine = play(defaultProfile(), [3, 3, 3]);
    expect(affinityLevel(nine.profile, "mireille")).toBe(2);
    expect(levels(nine.events)).toEqual([1, 2]);
  });

  it("level 3 at 15 stars, not at 14", () => {
    const fourteen = play(defaultProfile(), [3, 3, 3, 3, 2]);
    expect(affinityStars(fourteen.profile, "mireille")).toBe(14);
    expect(affinityLevel(fourteen.profile, "mireille")).toBe(2);
    const fifteen = play(defaultProfile(), [3, 3, 3, 3, 3]);
    expect(affinityLevel(fifteen.profile, "mireille")).toBe(3);
    expect(levels(fifteen.events)).toEqual([1, 2, 3]);
  });

  it("pays 10 coins per level, once, and records the highest level paid", () => {
    const run = play(defaultProfile(), [3, 3, 3, 3, 3]);
    expect(run.profile.affinityPaid.mireille).toBe(3);
    const payments = run.events.flatMap((event) =>
      event.type === "coins-gained" && event.reason === "affinity" ? [event.amount] : [],
    );
    expect(payments).toEqual([AFFINITY_PAYMENT, AFFINITY_PAYMENT, AFFINITY_PAYMENT]);
    const replay = applyCampaignResult(run.profile, MIREILLE[0]?.id ?? "", score(3));
    expect(replay.events).toEqual([]);
    expect(replay.profile.coins).toBe(run.profile.coins);
  });

  it("a jump over two thresholds pays both levels", () => {
    const seeded = {
      ...defaultProfile(),
      stars: { [MIREILLE[0]?.id ?? ""]: 3 as Stars, [MIREILLE[1]?.id ?? ""]: 3 as Stars },
    };
    const update = applyCampaignResult(seeded, MIREILLE[2]?.id ?? "", score(3));
    expect(levels(update.events)).toEqual([1, 2]);
    expect(update.profile.affinityPaid.mireille).toBe(2);
  });

  it("other clients are unaffected", () => {
    const run = play(defaultProfile(), [3, 3, 3]);
    expect(affinityLevel(run.profile, "tobias")).toBe(0);
    expect(run.profile.affinityPaid.tobias).toBeUndefined();
  });

  it("reports progress to the next threshold", () => {
    const run = play(defaultProfile(), [3, 3, 1]);
    expect(affinityProgress(run.profile, "mireille")).toEqual({ stars: 7, level: 1, nextAt: 9 });
    const full = play(defaultProfile(), [3, 3, 3, 3, 3]);
    expect(affinityProgress(full.profile, "mireille").nextAt).toBeNull();
  });
});
