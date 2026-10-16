// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { MissionHud, MissionResult } from "@city-drive/core";
import { render } from "preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatClock,
  objectiveLine,
  outcomeTitle,
  starText,
} from "../../src/ui/mission-debug/format";
import { MissionPanel, type MissionPanelState } from "../../src/ui/mission-debug/MissionPanel";
import { type MissionSource, mountMissionPanel } from "../../src/ui/mission-debug/mount";

const CSS = readFileSync(
  join(import.meta.dirname, "../../src/ui/mission-debug/mission.css"),
  "utf8",
);

const MISSION = {
  schema_version: 1,
  id: "d1-m01",
  district: "district-1",
  type: "delivery",
  title: "Corner Shop Run",
  brief: "Take the parcel across town.",
  start: { lane_point: { edgeId: "e:4,5:EW", s: 10 } },
  params: {
    pickup: { edgeId: "e:1,6:NS", s: 10 },
    drops: [{ edgeId: "e:5,9:SN", s: 10 }],
    time_limit_s: 100,
    max_damage: 3,
  },
  stars: {
    "1": { min_time_left_s: 0, max_damage: 3 },
    "2": { min_time_left_s: 40, max_damage: 2 },
    "3": { min_time_left_s: 60, max_damage: 1 },
  },
  reward_coins: { "1": 50, "2": 80, "3": 120 },
} as const;

function hud(over: Partial<MissionHud> = {}): MissionHud {
  return {
    phase: "idle",
    missionId: undefined,
    title: undefined,
    objective: undefined,
    progress: { done: 0, total: 0 },
    elapsedS: 0,
    timeLeftS: 0,
    damage: 0,
    comfort: null,
    paused: false,
    ...over,
  };
}

const OBJECTIVE = {
  kind: "dropoff" as const,
  label: "Deliver the parcel",
  x: 0,
  z: 0,
  radius: 6,
  lane: { edgeId: "e:5,9:SN", s: 10 },
};

const RESULT: MissionResult = {
  id: "d1-m01",
  success: true,
  stars: 2,
  time: 61.5,
  damage: 1,
  comfort: null,
  coins: 80,
};

let host: HTMLElement;
const actions = { accept: vi.fn(), decline: vi.fn(), quit: vi.fn(), next: vi.fn() };

function show(state: Partial<MissionPanelState>) {
  render(
    <MissionPanel
      state={{
        hud: hud(),
        mission: MISSION as never,
        result: undefined,
        parkHold: undefined,
        ...state,
      }}
      actions={actions}
    />,
    host,
  );
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  for (const fn of Object.values(actions)) fn.mockReset();
});

afterEach(() => {
  render(null, host);
  host.remove();
});

describe("mission panel", () => {
  it("shows nothing in free roam", () => {
    show({});
    expect(host.textContent).toBe("");
  });

  it("shows the briefing with title, brief, rewards and two buttons", () => {
    show({ hud: hud({ phase: "briefing", missionId: "d1-m01" }) });
    expect(host.textContent).toContain("Corner Shop Run");
    expect(host.textContent).toContain("Take the parcel across town.");
    expect(host.textContent).toContain("50 / 80 / 120");
    const [start, decline] = Array.from(host.querySelectorAll("button"));
    start?.click();
    decline?.click();
    expect(actions.accept).toHaveBeenCalledOnce();
    expect(actions.decline).toHaveBeenCalledOnce();
  });

  it("shows the objective, timer and damage while active, and can quit", () => {
    show({
      hud: hud({
        phase: "active",
        objective: OBJECTIVE,
        progress: { done: 1, total: 2 },
        timeLeftS: 74.2,
        damage: 2,
      }),
    });
    expect(host.textContent).toContain("Deliver the parcel (2/2)");
    expect(host.textContent).toContain("Time 1:15");
    expect(host.textContent).toContain("Damage 2");
    host.querySelector("button")?.click();
    expect(actions.quit).toHaveBeenCalledOnce();
  });

  it("shows comfort and the parking hold only when they apply", () => {
    show({ hud: hud({ phase: "active", objective: OBJECTIVE, comfort: 71.6 }), parkHold: 0.5 });
    expect(host.textContent).toContain("Comfort 72");
    expect(host.textContent).toContain("Hold 50%");
  });

  it("shows the result with stars and coins, and continues", () => {
    show({ hud: hud({ phase: "success" }), result: RESULT });
    expect(host.textContent).toContain("Mission complete");
    expect(host.textContent).toContain("★★☆");
    expect(host.textContent).toContain("+80 coins");
    host.querySelector("button")?.click();
    expect(actions.next).toHaveBeenCalledOnce();
  });

  it("explains a failure by its reason", () => {
    show({
      hud: hud({ phase: "fail" }),
      result: { ...RESULT, success: false, stars: 0, coins: 0, failReason: "time_out" },
    });
    expect(host.textContent).toContain("Out of time");
    expect(host.textContent).not.toContain("★");
  });

  it("every control is at least 44px tall in the stylesheet", () => {
    expect(CSS).toMatch(/min-height:\s*44px/);
  });
});

describe("format helpers", () => {
  it("formats clocks, stars, outcomes and objectives", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(59.01)).toBe("1:00");
    expect(formatClock(-3)).toBe("0:00");
    expect(starText(3)).toBe("★★★");
    expect(outcomeTitle(RESULT)).toBe("Mission complete");
    expect(outcomeTitle({ ...RESULT, success: false, failReason: "comfort_zero" })).toContain(
      "passenger",
    );
    expect(outcomeTitle({ ...RESULT, success: false })).toBe("Mission failed");
    expect(objectiveLine(hud())).toBe("");
    expect(
      objectiveLine(
        hud({ phase: "active", objective: OBJECTIVE, progress: { done: 0, total: 1 } }),
      ),
    ).toBe("Deliver the parcel");
  });
});

describe("mountMissionPanel", () => {
  function setup(initial: MissionHud["phase"]) {
    const state: MissionPanelState = {
      hud: hud({ phase: initial, missionId: "d1-m01" }),
      mission: MISSION as never,
      result: initial === "success" ? RESULT : undefined,
      parkHold: undefined,
    };
    const source: MissionSource = { ...actions, snapshot: () => state };
    const mounted = mountMissionPanel(host, source, window);
    return { state, mounted };
  }

  const press = (key: string) => window.dispatchEvent(new KeyboardEvent("keydown", { key }));

  it("Enter starts a briefing and Escape declines it", () => {
    const { mounted } = setup("briefing");
    press("Enter");
    expect(actions.accept).toHaveBeenCalledOnce();
    press("Escape");
    expect(actions.decline).toHaveBeenCalledOnce();
    mounted.dispose();
  });

  it("Escape quits an active mission and Enter continues past an end screen", () => {
    const active = setup("active");
    press("Escape");
    expect(actions.quit).toHaveBeenCalledOnce();
    press("Enter");
    expect(actions.accept).not.toHaveBeenCalled();
    active.mounted.dispose();
    const ended = setup("success");
    press("Enter");
    expect(actions.next).toHaveBeenCalledOnce();
    ended.mounted.dispose();
  });

  it("ignores keys in free roam and after dispose", () => {
    const { mounted } = setup("idle");
    press("Enter");
    press("Escape");
    expect(Object.values(actions).every((fn) => fn.mock.calls.length === 0)).toBe(true);
    mounted.dispose();
    press("Enter");
    expect(actions.accept).not.toHaveBeenCalled();
  });

  it("redraws only when something visible changed", () => {
    const { state, mounted } = setup("active");
    state.hud = hud({ phase: "active", missionId: "d1-m01", objective: OBJECTIVE, timeLeftS: 50 });
    mounted.update();
    expect(host.textContent).toContain("Time 0:50");
    const node = host.querySelector(".cd-mission-hud");
    state.hud = hud({
      phase: "active",
      missionId: "d1-m01",
      objective: OBJECTIVE,
      timeLeftS: 49.8,
    });
    mounted.update();
    expect(host.querySelector(".cd-mission-hud")).toBe(node);
    state.hud = hud({ phase: "active", missionId: "d1-m01", objective: OBJECTIVE, timeLeftS: 48 });
    mounted.update();
    expect(host.textContent).toContain("Time 0:48");
    mounted.dispose();
  });
});
