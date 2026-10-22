// @vitest-environment happy-dom
import { render } from "preact";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TouchInput } from "../../src/input";
import { App } from "../../src/ui/App";
import type { PlayState } from "../../src/ui/types";
import { hud, makeApp, playState, result, settle } from "./fakes";

let host: HTMLElement;
let app: Awaited<ReturnType<typeof makeApp>>;
const touch = new TouchInput();

async function mount(options?: { coins?: number; stars?: number; today?: string }) {
  app = await makeApp(options);
  render(
    <App
      controller={app.controller}
      content={app.content}
      touch={touch}
      minimap={() => app.game.minimapModel()}
    />,
    host,
  );
  await app.controller.boot();
  await settle();
}

const q = <T extends Element = HTMLElement>(selector: string): T => {
  const el = host.querySelector<T>(selector);
  if (!el) throw new Error(`nothing matches ${selector}\n${host.innerHTML.slice(0, 600)}`);
  return el;
};
const all = (selector: string): HTMLElement[] => [...host.querySelectorAll<HTMLElement>(selector)];
const button = (text: string): HTMLButtonElement => {
  const found = all("button").find((b) => b.textContent?.trim().startsWith(text));
  if (!found) throw new Error(`no button "${text}"`);
  return found as HTMLButtonElement;
};

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
});

afterEach(() => {
  render(null, host);
  host.remove();
});

describe("home daily card", () => {
  it("shows today's mission, the three rewards and the streak", async () => {
    await mount();
    expect(q("[data-testid=daily-title]").textContent).toContain(
      app.controller.view.daily?.title ?? "?",
    );
    expect(q("[data-testid=daily-rewards]").textContent).toContain("40");
    expect(q("[data-testid=daily-rewards]").textContent).toContain("80");
    expect(q("[data-testid=daily-rewards]").textContent).toContain("150");
    expect(q("[data-testid=daily-streak]").textContent).toBe("1 day streak");
    expect(button("Drive daily").disabled).toBe(false);
  });

  it("Drive daily opens today's mission and goes to the play screen", async () => {
    await mount();
    button("Drive daily").click();
    await settle();
    expect(app.controller.view.screen).toBe("play");
    expect(app.game.dailyOpened).toHaveLength(1);
  });

  it("a claimed day shows Claimed today, disabled, with the streak after it", async () => {
    await mount();
    app.profile.claimDaily("2026-10-15", 3);
    app.controller.openMap();
    app.controller.back();
    await settle();
    expect(button("Claimed today").disabled).toBe(true);
    expect(q(".cd-daily").dataset.status).toBe("claimed");
  });

  it("tomorrow the streak bonus appears in the rewards", async () => {
    await mount();
    app.profile.claimDaily("2026-10-15", 3);
    app.clock.date = "2026-10-16";
    app.controller.openMap();
    app.controller.back();
    await settle();
    expect(q("[data-testid=daily-streak]").textContent).toBe("2 day streak +10%");
    expect(q("[data-testid=daily-rewards]").textContent).toContain("165");
  });

  it("a clock behind the last claim disables the card", async () => {
    await mount();
    app.profile.claimDaily("2026-10-15", 1);
    app.clock.date = "2026-10-01";
    app.controller.openMap();
    app.controller.back();
    await settle();
    expect(button("Clock is behind").disabled).toBe(true);
  });
});

describe("garage upgrade panel", () => {
  async function openGarage(coins: number) {
    await mount({ coins });
    button("Garage").click();
    await settle();
  }

  it("lists the three tracks of an owned car with level and cost", async () => {
    await openGarage(500);
    expect(all("[data-testid^=upgrade-]").map((r) => r.dataset.testid)).toEqual([
      "upgrade-power",
      "upgrade-grip",
      "upgrade-brakes",
    ]);
    expect(q("[data-testid=upgrade-power]").textContent).toContain("Level 0/3");
    expect(q("[data-testid=upgrade-power] button").textContent).toBe("Upgrade 60");
  });

  it("buying raises the level, takes the coins and updates the wallet", async () => {
    await openGarage(500);
    q<HTMLButtonElement>("[data-testid=upgrade-grip] button").click();
    await settle();
    expect(q("[data-testid=upgrade-grip]").textContent).toContain("Level 1/3");
    expect(q("[data-testid=upgrade-grip] button").textContent).toBe("Upgrade 100");
    expect(q("[data-testid=coins]").textContent).toBe("440");
  });

  it("disables a track the player cannot afford and shows Max at level 3", async () => {
    await openGarage(10);
    expect(q<HTMLButtonElement>("[data-testid=upgrade-brakes] button").disabled).toBe(true);
    app.profile.manager.commit({
      ...app.profile.save,
      coins: 5000,
      upgrades: { sedan: { power: 3, grip: 0, brakes: 0 } },
    });
    app.controller.focusCar("sedan");
    await settle();
    const top = q<HTMLButtonElement>("[data-testid=upgrade-power] button");
    expect(top.textContent).toBe("Max");
    expect(top.disabled).toBe(true);
  });

  it("a car that is not owned has no upgrade panel", async () => {
    await openGarage(500);
    q<HTMLButtonElement>("button[aria-label='Next car']").click();
    await settle();
    expect(host.querySelector("[data-testid=upgrades]")).toBeNull();
  });
});

describe("results daily payout", () => {
  async function ended(stars: 0 | 1 | 2 | 3, payout?: PlayState["dailyPayout"]) {
    await mount();
    await app.controller.play();
    app.game.state = playState({
      hud: hud({ phase: stars === 0 ? "fail" : "results" }),
      result: result({
        stars,
        success: stars > 0,
        coins: 0,
        ...(stars === 0 ? { failReason: "time_out" as const } : {}),
      }),
      daily: { date: "2026-10-15", missionId: "d1-m01" },
      dailyPayout: payout,
    });
    app.controller.tick(performance.now());
    await settle();
  }

  it("shows the daily reward, the streak and the bonus instead of the mission payout", async () => {
    await ended(3, {
      date: "2026-10-15",
      missionId: "d1-m01",
      stars: 3,
      coins: 165,
      base: 150,
      bonus: 15,
      streak: 2,
      claimed: true,
    });
    const line = q("[data-testid=daily-payout]").textContent ?? "";
    expect(line).toContain("+165 coins");
    expect(line).toContain("streak 2");
    expect(line).toContain("+15 bonus");
    expect(host.querySelector("[data-testid=payout]")).toBeNull();
  });

  it("a failed daily says nothing was paid and the day is still open", async () => {
    await ended(0, {
      date: "2026-10-15",
      missionId: "d1-m01",
      stars: 0,
      coins: 0,
      base: 0,
      bonus: 0,
      streak: 0,
      claimed: false,
      reason: "no-stars",
    });
    expect(q("[data-testid=daily-payout]").textContent).toContain("Retry today");
  });

  it("a plain mission still shows the normal payout", async () => {
    await mount();
    await app.controller.play();
    app.game.state = playState({ hud: hud({ phase: "results" }), result: result() });
    app.controller.tick(performance.now());
    await settle();
    expect(host.querySelector("[data-testid=daily-payout]")).toBeNull();
    expect(q("[data-testid=payout]").textContent).toContain("coins");
  });
});
