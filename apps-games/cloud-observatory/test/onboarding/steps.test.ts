import { createProfile, createTutorial, type Profile } from "@web-games/cloud-observatory-core";
import { createMemoryAdapter } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import {
  activeStep,
  advance,
  BUILD_AT_STARLIGHT,
  eventsBetween,
  impliedFlags,
  initialMachine,
  OBSERVE_TAPS,
  STEP_ORDER,
  type StepFlag,
  shouldShowEclipseIntro,
  type TutorialEvent,
} from "../../src/onboarding/steps";
import { createProfileStore } from "../../src/save/profile-store";
import type { SessionSnapshot } from "../../src/session/types";

const fresh = (): Profile => createProfile(1000);

type ProfilePatch = Omit<Partial<Profile>, "game"> & { game?: Partial<Profile["game"]> };

function withProfile(base: Profile, patch: ProfilePatch): Profile {
  const { game, ...rest } = patch;
  return { ...base, ...rest, game: { ...base.game, ...game } };
}

function withFlags(base: Profile, flags: Partial<Record<StepFlag, boolean>>): Profile {
  return { ...base, tutorial: { ...base.tutorial, ...flags } };
}

/** Feeds events through the machine and applies the flags it asks for, as the hook does. */
function play(profile: Profile, events: TutorialEvent[]): Profile {
  let machine = initialMachine;
  let current = profile;
  for (const event of events) {
    const outcome = advance(current, machine, event);
    machine = outcome.machine;
    const tutorial = { ...current.tutorial };
    for (const flag of outcome.set) tutorial[flag] = true;
    current = { ...current, tutorial };
  }
  return current;
}

function snapshot(profile: Profile, chart: SessionSnapshot["chart"] = null): SessionSnapshot {
  return {
    version: 1,
    loaded: true,
    profile,
    chart,
    saveNotice: null,
    persistence: "ok",
  };
}

describe("step order", () => {
  it("lists the four beats", () => {
    expect(STEP_ORDER).toEqual(["observe", "build", "atlas", "chart"]);
  });

  it("walks observe, build, atlas and chart in order", () => {
    const none = { chartOpen: false };
    let profile = fresh();
    expect(activeStep(profile, none)).toBe("observe");

    profile = play(profile, [{ type: "gather", count: OBSERVE_TAPS }]);
    expect(profile.tutorial.observe).toBe(true);
    expect(activeStep(profile, none)).toBeNull();

    profile = withProfile(profile, { game: { starlight: BUILD_AT_STARLIGHT } });
    expect(activeStep(profile, none)).toBe("build");

    profile = play(profile, [{ type: "buy" }]);
    expect(profile.tutorial.build).toBe(true);
    expect(activeStep(profile, none)).toBeNull();

    profile = withProfile(profile, { game: { starlight: 100, owned: { telescope: 2 } } });
    expect(activeStep(profile, none)).toBe("atlas");

    profile = play(profile, [{ type: "chart-open" }]);
    expect(profile.tutorial.atlas).toBe(true);
    expect(activeStep(profile, none)).toBeNull();
    expect(activeStep(profile, { chartOpen: true })).toBe("chart");

    profile = play(profile, [{ type: "star" }]);
    expect(profile.tutorial.chart).toBe(true);
    expect(activeStep(profile, { chartOpen: true })).toBeNull();
  });

  it("the observe beat needs three taps in all, however they arrive", () => {
    const profile = fresh();
    expect(play(profile, [{ type: "gather", count: 1 }]).tutorial.observe).toBe(false);
    expect(
      play(profile, [
        { type: "gather", count: 1 },
        { type: "gather", count: 1 },
      ]).tutorial.observe,
    ).toBe(false);
    expect(
      play(profile, [
        { type: "gather", count: 1 },
        { type: "gather", count: 2 },
      ]).tutorial.observe,
    ).toBe(true);
  });

  it("the build beat waits for 15 starlight, the atlas beat for a ready constellation", () => {
    const seen = withFlags(fresh(), { observe: true });
    expect(
      activeStep(withProfile(seen, { game: { starlight: 14 } }), { chartOpen: false }),
    ).toBeNull();
    expect(activeStep(withProfile(seen, { game: { starlight: 15 } }), { chartOpen: false })).toBe(
      "build",
    );
    const built = withFlags(seen, { build: true });
    expect(activeStep(built, { chartOpen: false })).toBeNull();
  });

  it("an event that repeats a finished beat changes nothing", () => {
    const done = withFlags(fresh(), { observe: true, build: true, atlas: true, chart: true });
    for (const event of [{ type: "buy" }, { type: "chart-open" }, { type: "star" }] as const) {
      expect(advance(done, initialMachine, event).set).toEqual([]);
    }
  });
});

describe("skip and replay", () => {
  it("a skipped tutorial shows nothing", () => {
    const skipped = withFlags(fresh(), { skipped: true });
    expect(activeStep(skipped, { chartOpen: true })).toBeNull();
    expect(
      activeStep(withProfile(skipped, { game: { starlight: 99 } }), { chartOpen: false }),
    ).toBeNull();
  });

  it("replay (a fresh tutorial) starts over at observe, with taps counted from zero", () => {
    const finished = withFlags(fresh(), { observe: true, build: true, atlas: true, chart: true });
    const replayed = { ...finished, tutorial: createTutorial() };
    expect(activeStep(replayed, { chartOpen: false })).toBe("observe");
    expect(advance(replayed, { taps: 0 }, { type: "gather", count: 1 }).machine.taps).toBe(1);
    expect(advance(replayed, { taps: 5 }, { type: "reset" }).machine).toEqual(initialMachine);
  });
});

describe("returning players", () => {
  it("a save with purchases or charts is not taught what it knows", () => {
    expect(impliedFlags(fresh())).toEqual([]);
    expect(impliedFlags(withProfile(fresh(), { game: { taps: 4 } }))).toEqual(["observe"]);
    const bought = withProfile(fresh(), { game: { owned: { telescope: 1 } } });
    expect(impliedFlags(bought).sort()).toEqual(["build", "observe"]);
    const charted = withProfile(fresh(), { game: { charted: ["lyre"] } });
    expect(impliedFlags(charted).sort()).toEqual(["atlas", "build", "chart", "observe"]);
    const known = withFlags(charted, { observe: true, build: true, atlas: true, chart: true });
    expect(impliedFlags(known)).toEqual([]);
  });
});

describe("persistence", () => {
  it("the flags and the Eclipse intro survive a save and load", async () => {
    const adapter = createMemoryAdapter();
    const store = createProfileStore(adapter, { now: () => 5 });
    const profile = {
      ...withFlags(fresh(), { observe: true, build: true }),
      eclipseIntroSeen: true,
    };
    await store.save(profile);
    const loaded = await createProfileStore(adapter, { now: () => 5 }).load();
    expect(loaded.data.tutorial).toEqual({
      observe: true,
      build: true,
      atlas: false,
      chart: false,
      skipped: false,
    });
    expect(loaded.data.eclipseIntroSeen).toBe(true);
  });
});

describe("the Eclipse intro", () => {
  it("shows once, when pending shards first reach the minimum", () => {
    expect(shouldShowEclipseIntro(fresh())).toBe(false);
    const ready = withProfile(fresh(), { game: { cycleStarlight: 4e10 } });
    expect(shouldShowEclipseIntro(ready)).toBe(true);
    expect(shouldShowEclipseIntro({ ...ready, eclipseIntroSeen: true })).toBe(false);
    const almost = withProfile(fresh(), { game: { cycleStarlight: 1e9 } });
    expect(shouldShowEclipseIntro(almost)).toBe(false);
  });
});

describe("events between snapshots", () => {
  const base = fresh();
  it("reads taps, purchases, chart opens and stars", () => {
    const tapped = withProfile(base, { game: { taps: 2 } });
    expect(eventsBetween(snapshot(base), snapshot(tapped))).toEqual([{ type: "gather", count: 2 }]);
    const bought = withProfile(tapped, { game: { owned: { telescope: 1 } } });
    expect(eventsBetween(snapshot(tapped), snapshot(bought))).toEqual([{ type: "buy" }]);
    const chart = { next: 0, mistakes: 0, id: "lyre" } as unknown as NonNullable<
      SessionSnapshot["chart"]
    >;
    const open = snapshot(bought, chart);
    expect(eventsBetween(snapshot(bought), open)).toEqual([{ type: "chart-open" }]);
    const one = snapshot(bought, { ...chart, next: 1 });
    expect(eventsBetween(open, one)).toEqual([{ type: "star" }]);
    expect(eventsBetween(one, one)).toEqual([]);
  });

  it("a smaller tap count or a new profile reads as a reset", () => {
    const played = withProfile(base, { game: { taps: 30 } });
    expect(eventsBetween(snapshot(played), snapshot(base))).toEqual([{ type: "reset" }]);
    const other = { ...base, createdMs: base.createdMs + 1 };
    expect(eventsBetween(snapshot(base), snapshot(other))).toEqual([{ type: "reset" }]);
  });
});
