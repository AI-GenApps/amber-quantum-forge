// @vitest-environment happy-dom
import { render } from "preact";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TouchInput } from "../../src/input";
import { App } from "../../src/ui/App";
import { FLAG_DONE } from "../../src/ui/onboarding";
import { hud, makeApp, playState, settle } from "./fakes";

let host: HTMLElement;
let app: Awaited<ReturnType<typeof makeApp>>;

async function mount(options: Parameters<typeof makeApp>[0] = {}) {
  app = await makeApp(options);
  render(
    <App
      controller={app.controller}
      content={app.content}
      touch={new TouchInput()}
      minimap={() => app.game.minimapModel()}
    />,
    host,
  );
  await app.controller.boot();
  await settle();
}

const q = (selector: string): HTMLElement | null => host.querySelector<HTMLElement>(selector);
const button = (text: string): HTMLButtonElement => {
  const found = [...host.querySelectorAll("button")].find((b) => b.textContent?.trim() === text);
  if (!found) throw new Error(`no button "${text}"`);
  return found;
};

const stepReport = (input: { throttle: number; steer: number }) => ({
  input: { ...input, handbrake: false, reset: false },
  speedKmh: 0,
  slipMps: 0,
  impactNs: 0,
  topSpeedKmh: 115,
});

function hold(input: { throttle: number; steer: number }, steps: number): void {
  for (let i = 0; i < steps; i++) app.controller.onStep(stepReport(input));
}

function completeControls(): void {
  hold({ throttle: 1, steer: 0 }, 61);
  hold({ throttle: 0, steer: 1 }, 40);
  hold({ throttle: -1, steer: 0 }, 40);
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
});

afterEach(() => {
  render(null, host);
  host.remove();
});

describe("tutorial overlay", () => {
  it("shows the gas step with its hint and a progress bar on the first drive", async () => {
    await mount({ onboarding: true });
    await app.controller.play();
    await settle();
    const overlay = q(".cd-onboarding");
    expect(overlay?.dataset.stage).toBe("controls");
    expect(overlay?.textContent).toContain("Hold gas");
    expect(overlay?.textContent).toContain("Step 1 of 3");
    expect(q("[role=progressbar]")?.getAttribute("aria-valuenow")).toBe("0");
  });

  it("advances the visible step and bar as the input is held", async () => {
    await mount({ onboarding: true });
    await app.controller.play();
    hold({ throttle: 1, steer: 0 }, 30);
    await settle();
    const shown = Number(q("[role=progressbar]")?.getAttribute("aria-valuenow"));
    expect(shown).toBeGreaterThanOrEqual(40);
    expect(shown).toBeLessThanOrEqual(50);
    hold({ throttle: 1, steer: 0 }, 31);
    await settle();
    expect(q(".cd-onboarding")?.textContent).toContain("Steer");
    expect(q(".cd-onboarding")?.textContent).toContain("Step 2 of 3");
  });

  it("Skip tutorial removes it for good", async () => {
    await mount({ onboarding: true });
    await app.controller.play();
    await settle();
    button("Skip tutorial").click();
    await settle();
    expect(q(".cd-onboarding")).toBeNull();
    expect(app.profile.flag(FLAG_DONE)).toBe(true);
  });

  it("explains markers, the route ribbon and stars beside the first briefing", async () => {
    await mount({ onboarding: true });
    await app.controller.play();
    completeControls();
    app.game.state = playState({ hud: hud({ phase: "briefing", missionId: "d1-m01" }) });
    app.controller.tick(0);
    await settle();
    const tip = q(".cd-onboarding[data-stage=briefing]");
    expect(tip?.textContent).toMatch(/markers/i);
    expect(tip?.textContent).toMatch(/ribbon/i);
    expect(tip?.textContent).toMatch(/stars/i);
    button("Got it").click();
    await settle();
    expect(q(".cd-onboarding")).toBeNull();
  });

  it("explains coins and the garage on the results", async () => {
    await mount({ onboarding: true });
    await app.controller.play();
    completeControls();
    for (const phase of ["briefing", "active", "success"] as const) {
      app.game.state = playState({ hud: hud({ phase, missionId: "d1-m01" }) });
      app.controller.tick(0);
    }
    await settle();
    const tip = q(".cd-onboarding[data-stage=results]");
    expect(tip?.textContent).toMatch(/coins/i);
    expect(tip?.textContent).toMatch(/garage/i);
    button("Got it").click();
    await settle();
    expect(q(".cd-onboarding")).toBeNull();
    expect(app.profile.flag(FLAG_DONE)).toBe(true);
  });
});

describe("settings and HUD", () => {
  it("Settings lists How to play, which replays the tutorial", async () => {
    await mount({ onboarding: true });
    app.profile.setFlag(FLAG_DONE, true);
    app.controller.openSettings();
    await settle();
    expect(host.textContent).toContain("How to play");
    button("Replay tutorial").click();
    await settle();
    await settle();
    expect(app.controller.view.screen).toBe("play");
    expect(q(".cd-onboarding")?.dataset.stage).toBe("controls");
  });

  it("the HUD has a horn button that calls the horn, and the tutorial is not drawn in menus", async () => {
    await mount({ onboarding: true });
    expect(q(".cd-onboarding")).toBeNull();
    await app.controller.play();
    app.game.state = playState();
    app.controller.tick(0);
    await settle();
    const horn = q("button[aria-label=Horn]");
    expect(horn).not.toBeNull();
    expect(horn?.dataset.noTap).toBe("true");
    horn?.click();
    horn?.click();
    expect(app.horns.count).toBe(2);
  });
});
