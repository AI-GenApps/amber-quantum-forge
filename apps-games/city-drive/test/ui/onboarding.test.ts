import { FIXED_DT, SaveManager } from "@city-drive/core";
import { describe, expect, it, vi } from "vitest";
import type { StepReport } from "../../src/game/stepReport";
import { ROSTER } from "../../src/save";
import {
  ALL_FLAGS,
  FLAG_BRIEFING,
  FLAG_CONTROLS,
  FLAG_DONE,
  FLAG_RESULTS,
  OnboardingFlow,
} from "../../src/ui/onboarding";
import { ControlsTutorial, STEPS, SustainedDetector } from "../../src/ui/onboarding/detectors";
import { hud, makeApp, playState } from "./fakes";

const IDLE = { throttle: 0, steer: 0, handbrake: false };
const GAS = { ...IDLE, throttle: 1 };
const LEFT = { ...IDLE, steer: -1 };
const BRAKE = { ...IDLE, throttle: -1 };

function hold(tutorial: ControlsTutorial, input: typeof IDLE, seconds: number): boolean {
  let completed = false;
  for (let t = 0; t < Math.round(seconds / FIXED_DT); t++) {
    completed = tutorial.update(input, FIXED_DT) || completed;
  }
  return completed;
}

describe("SustainedDetector", () => {
  const gas = STEPS[0] as (typeof STEPS)[number];

  it("completes after the input is held long enough, in fixed steps", () => {
    const d = new SustainedDetector(gas);
    for (let i = 0; i < 59; i++) d.update(GAS, FIXED_DT);
    expect(d.done).toBe(false);
    d.update(GAS, FIXED_DT);
    expect(d.done).toBe(true);
    expect(d.progress).toBe(1);
  });

  it("starts over when the input lets go", () => {
    const d = new SustainedDetector(gas);
    for (let i = 0; i < 50; i++) d.update(GAS, FIXED_DT);
    d.update(IDLE, FIXED_DT);
    expect(d.progress).toBe(0);
    for (let i = 0; i < 59; i++) d.update(GAS, FIXED_DT);
    expect(d.done).toBe(false);
  });

  it("ignores light touches below the threshold", () => {
    const d = new SustainedDetector(gas);
    for (let i = 0; i < 300; i++) d.update({ ...IDLE, throttle: 0.3 }, FIXED_DT);
    expect(d.progress).toBe(0);
  });
});

describe("ControlsTutorial", () => {
  it("needs gas, then steering, then brake or handbrake, each held on its own turn", () => {
    const t = new ControlsTutorial();
    expect(hold(t, LEFT, 3)).toBe(false);
    expect(t.step).toBe(0);
    expect(hold(t, GAS, 1)).toBe(true);
    expect(t.step).toBe(1);
    expect(hold(t, GAS, 3)).toBe(false);
    expect(hold(t, { ...GAS, steer: 1 }, 0.6)).toBe(true);
    expect(t.step).toBe(2);
    expect(hold(t, { ...IDLE, handbrake: true }, 0.5)).toBe(true);
    expect(t.finished).toBe(true);
    expect(t.progress).toBe(1);
    expect(hold(t, GAS, 2)).toBe(false);
  });

  it("accepts the brake pedal as well as the handbrake", () => {
    const t = new ControlsTutorial();
    hold(t, GAS, 1);
    hold(t, LEFT, 0.6);
    expect(hold(t, BRAKE, 0.5)).toBe(true);
    expect(t.finished).toBe(true);
  });
});

function flowWith(initial: Record<string, boolean> = {}, progress = false) {
  const flags = new Map(Object.entries(initial));
  const opened: string[] = [];
  const flow = new OnboardingFlow({
    flag: (n) => flags.get(n) === true,
    setFlag: (n, v) => void flags.set(n, v),
    hasProgress: () => progress,
    openMission: (id) => void opened.push(id),
    firstMissionId: "d1-m01",
  });
  return { flow, flags, opened };
}

function feedControls(flow: OnboardingFlow): void {
  for (const [input, secs] of [
    [GAS, 1],
    [LEFT, 0.6],
    [BRAKE, 0.5],
  ] as const) {
    for (let i = 0; i < Math.round(secs / FIXED_DT) + 1; i++) flow.feed(input, FIXED_DT);
  }
}

describe("OnboardingFlow", () => {
  it("starts on the first drive and shows the gas step", () => {
    const { flow } = flowWith();
    expect(flow.enter()).toBe(true);
    expect(flow.view).toMatchObject({ stage: "controls", step: 0, stepId: "gas", steps: 3 });
  });

  it("does not start again once done, and marks a returning player done without showing anything", () => {
    expect(flowWith({ [FLAG_DONE]: true }).flow.enter()).toBe(false);
    const veteran = flowWith({}, true);
    expect(veteran.flow.enter()).toBe(false);
    expect(veteran.flags.get(FLAG_DONE)).toBe(true);
    expect(veteran.flow.view).toBeUndefined();
  });

  it("finishing the controls opens the first mission's briefing and saves the flag", () => {
    const { flow, flags, opened } = flowWith();
    flow.enter();
    feedControls(flow);
    expect(opened).toEqual(["d1-m01"]);
    expect(flags.get(FLAG_CONTROLS)).toBe(true);
    expect(flow.view).toBeUndefined();
  });

  it("walks briefing, mission and results, then persists every flag", () => {
    const { flow, flags } = flowWith();
    flow.enter();
    feedControls(flow);
    flow.observe(hud({ phase: "briefing", missionId: "d1-m01" }));
    expect(flow.view).toEqual({ stage: "briefing" });
    expect(flags.get(FLAG_BRIEFING)).toBe(true);
    flow.observe(hud({ phase: "active", missionId: "d1-m01" }));
    expect(flow.view).toBeUndefined();
    flow.observe(hud({ phase: "success", missionId: "d1-m01" }));
    expect(flow.view).toEqual({ stage: "results" });
    flow.dismiss();
    expect(flow.active).toBe(false);
    for (const name of ALL_FLAGS) expect(flags.get(name), name).toBe(true);
    expect(flow.enter()).toBe(false);
  });

  it("ends quietly when the player declines the briefing or abandons the mission", () => {
    const declined = flowWith();
    declined.flow.enter();
    feedControls(declined.flow);
    declined.flow.observe(hud({ phase: "briefing", missionId: "d1-m01" }));
    declined.flow.observe(hud({ phase: "idle" }));
    expect(declined.flow.active).toBe(false);
    expect(declined.flags.get(FLAG_DONE)).toBe(true);
    expect(declined.flags.get(FLAG_RESULTS)).toBeUndefined();

    const quit = flowWith();
    quit.flow.enter();
    feedControls(quit.flow);
    quit.flow.observe(hud({ phase: "briefing", missionId: "d1-m01" }));
    quit.flow.dismiss();
    quit.flow.observe(hud({ phase: "active", missionId: "d1-m01" }));
    quit.flow.observe(hud({ phase: "idle" }));
    expect(quit.flow.active).toBe(false);
    expect(quit.flags.get(FLAG_DONE)).toBe(true);
    expect(quit.flags.get(FLAG_RESULTS)).toBeUndefined();
  });

  it("can be skipped at any step and stays skipped", () => {
    const { flow, flags } = flowWith();
    flow.enter();
    flow.skip();
    expect(flow.view).toBeUndefined();
    expect(flags.get(FLAG_DONE)).toBe(true);
    expect(flow.feed(GAS, FIXED_DT)).toBe(false);
    expect(flow.enter()).toBe(false);
  });

  it("replays from the start and clears the flags", () => {
    const { flow, flags } = flowWith(Object.fromEntries(ALL_FLAGS.map((n) => [n, true])));
    flow.replay();
    expect(flow.view).toMatchObject({ stage: "controls", step: 0 });
    for (const name of ALL_FLAGS) expect(flags.get(name), name).toBe(false);
  });

  it("gives up with a warning, and no half-state, when the mission cannot open", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const flow = new OnboardingFlow({
      flag: () => false,
      setFlag: () => undefined,
      hasProgress: () => false,
      openMission: () => {
        throw new Error("missions are off");
      },
      firstMissionId: "d1-m01",
    });
    flow.enter();
    feedControls(flow);
    expect(flow.active).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("reports a signature that changes only when the overlay would", () => {
    const { flow } = flowWith();
    flow.enter();
    const seen = new Set<string>();
    for (let i = 0; i < 59; i++) {
      flow.feed(GAS, FIXED_DT);
      seen.add(flow.signature);
    }
    expect(seen.size).toBeLessThanOrEqual(11);
    expect(seen.size).toBeGreaterThan(1);
  });
});

const report = (input: typeof IDLE): StepReport => ({
  input: { ...input, reset: false },
  speedKmh: 0,
  slipMps: 0,
  impactNs: 0,
  topSpeedKmh: 115,
});

function drive(app: Awaited<ReturnType<typeof makeApp>>, input: typeof IDLE, seconds: number) {
  for (let i = 0; i < Math.round(seconds / FIXED_DT) + 1; i++) app.controller.onStep(report(input));
}

describe("first drive through the controller", () => {
  it("onboarding completes, the mission starts, and the flags persist across a reload", async () => {
    const app = await makeApp({ onboarding: true });
    await app.controller.play();
    expect(app.controller.view.screen).toBe("play");
    expect(app.controller.view.onboarding).toMatchObject({ stage: "controls", stepId: "gas" });

    drive(app, GAS, 1);
    expect(app.controller.view.onboarding).toMatchObject({ stage: "controls", stepId: "steer" });
    drive(app, LEFT, 0.6);
    expect(app.controller.view.onboarding).toMatchObject({ stage: "controls", stepId: "brake" });
    expect(app.game.calls).not.toContain("open:d1-m01:false");
    drive(app, BRAKE, 0.5);
    expect(app.game.calls).toContain("open:d1-m01:false");
    expect(app.profile.flag(FLAG_CONTROLS)).toBe(true);

    app.game.state = playState({ hud: hud({ phase: "briefing", missionId: "d1-m01" }) });
    app.controller.tick(0);
    expect(app.controller.view.onboarding).toEqual({ stage: "briefing" });
    app.game.state = playState({ hud: hud({ phase: "active", missionId: "d1-m01" }) });
    app.controller.tick(1);
    expect(app.controller.view.onboarding).toBeUndefined();
    app.game.state = playState({ hud: hud({ phase: "success", missionId: "d1-m01" }) });
    app.controller.tick(2);
    expect(app.controller.view.onboarding).toEqual({ stage: "results" });
    app.controller.dismissOnboarding();
    expect(app.controller.view.onboarding).toBeUndefined();

    await app.manager.flush();
    const reloaded = new SaveManager(app.store, { starterCarId: ROSTER.starter });
    await reloaded.load();
    const data = reloaded.data;
    for (const name of ALL_FLAGS) expect(data.onboarding[name], name).toBe(true);
  });

  it("does not run for a player who already finished it", async () => {
    const app = await makeApp({ onboarding: true });
    app.profile.setFlag(FLAG_DONE, true);
    await app.controller.play();
    expect(app.controller.view.onboarding).toBeUndefined();
    drive(app, GAS, 2);
    expect(app.game.calls).toEqual([]);
  });

  it("does not watch input while paused or in a menu", async () => {
    const app = await makeApp({ onboarding: true });
    await app.controller.play();
    app.controller.pause();
    drive(app, GAS, 2);
    expect(app.controller.view.onboarding).toMatchObject({ stage: "controls", stepId: "gas" });
  });

  it("Skip ends it and keeps it from coming back", async () => {
    const app = await makeApp({ onboarding: true });
    await app.controller.play();
    app.controller.skipOnboarding();
    expect(app.controller.view.onboarding).toBeUndefined();
    expect(app.profile.flag(FLAG_DONE)).toBe(true);
    app.controller.quitToHome();
    await app.controller.play();
    expect(app.controller.view.onboarding).toBeUndefined();
  });

  it("How to play replays it from the first step on free roam", async () => {
    const app = await makeApp({ onboarding: true });
    app.profile.setFlag(FLAG_DONE, true);
    app.profile.setFlag(FLAG_CONTROLS, true);
    await app.controller.boot();
    app.controller.openSettings();
    await app.controller.replayOnboarding();
    expect(app.controller.view.screen).toBe("play");
    expect(app.controller.view.onboarding).toMatchObject({ stage: "controls", step: 0 });
    expect(app.profile.flag(FLAG_DONE)).toBe(false);
    expect(app.profile.flag(FLAG_CONTROLS)).toBe(false);
    expect(app.game.calls).toContain("leave");
  });

  it("starts over after progress is erased", async () => {
    const app = await makeApp({ onboarding: true });
    await app.controller.play();
    drive(app, GAS, 1);
    await app.controller.confirmReset();
    expect(app.controller.view.onboarding).toBeUndefined();
    expect(app.profile.save.onboarding).toEqual({});
    await app.controller.play();
    expect(app.controller.view.onboarding).toMatchObject({ stage: "controls", step: 0 });
  });

  it("skips the tutorial for a save that already has mission records", async () => {
    const app = await makeApp({ onboarding: true, stars: 3 });
    await app.controller.play();
    expect(app.controller.view.onboarding).toBeUndefined();
    expect(app.profile.flag(FLAG_DONE)).toBe(true);
  });

  it("is absent when no flow is supplied", async () => {
    const app = await makeApp();
    await app.controller.play();
    expect(app.controller.view.onboarding).toBeUndefined();
    app.controller.onStep(report(GAS));
    app.controller.horn();
    expect(app.horns.count).toBe(1);
  });
});
