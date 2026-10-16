// @vitest-environment happy-dom
import { render } from "preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TouchInput } from "../../src/input";
import { ROSTER } from "../../src/save";
import { App } from "../../src/ui/App";
import { GAME_TITLE } from "../../src/ui/brand";
import { FakeGame, hud, MINIMAP, makeApp, missionOfType, playState, result, settle } from "./fakes";

let host: HTMLElement;
let app: Awaited<ReturnType<typeof makeApp>>;
const touch = new TouchInput();

async function mount(options?: { coins?: number; stars?: number; showTouch?: boolean }) {
  app = await makeApp(options);
  if (options?.showTouch === false) app.content.showTouch = false;
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
  return app;
}

const q = <T extends Element = HTMLElement>(selector: string): T => {
  const el = host.querySelector<T>(selector);
  if (!el) throw new Error(`nothing matches ${selector}\n${host.innerHTML.slice(0, 600)}`);
  return el;
};
const all = (selector: string): HTMLElement[] => [...host.querySelectorAll<HTMLElement>(selector)];
const button = (text: string): HTMLButtonElement => {
  const found = all("button").find((b) => b.textContent?.trim().startsWith(text));
  if (!found)
    throw new Error(
      `no button "${text}" in: ${all("button")
        .map((b) => b.textContent)
        .join(" | ")}`,
    );
  return found as HTMLButtonElement;
};

async function drive(state = playState()) {
  await app.controller.play();
  app.game.state = state;
  app.controller.tick(performance.now());
  await settle();
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
});

afterEach(() => {
  render(null, host);
  host.remove();
  vi.restoreAllMocks();
});

describe("home screen", () => {
  it("shows the title constant, coins, stars and the four entries", async () => {
    await mount({ coins: 1234, stars: 5 });
    expect(q("[data-testid=game-title]").textContent).toBe(GAME_TITLE);
    expect(q("[data-testid=coins]").textContent).toBe("1,234");
    expect(q("[data-testid=stars]").textContent).toBe("5");
    expect(["Play", "Map", "Garage", "Settings"].map((t) => button(t).textContent)).toHaveLength(4);
    expect(button("Play").textContent).toContain("Free roam in Old Town");
  });

  it("Play enters the drive", async () => {
    await mount();
    button("Play").click();
    await settle();
    expect(app.controller.view.screen).toBe("play");
    expect(host.querySelector(".cd-hud")).not.toBeNull();
    expect(host.querySelector(".cd-home")).toBeNull();
  });

  it("Map, Garage and Settings open their screens", async () => {
    await mount();
    for (const [name, selector] of [
      ["Map", ".cd-map"],
      ["Garage", ".cd-garage"],
      ["Settings", ".cd-settings"],
    ] as const) {
      button(name).click();
      await settle();
      expect(host.querySelector(selector), name).not.toBeNull();
      q<HTMLButtonElement>("button[aria-label=Back]").click();
      await settle();
      expect(host.querySelector(".cd-home")).not.toBeNull();
    }
  });
});

describe("map screen", () => {
  async function openMap(stars = 0) {
    await mount({ stars });
    button("Map").click();
    await settle();
  }

  it("lists three districts; later ones are locked with the stars still needed", async () => {
    await openMap();
    const cards = all(".cd-district");
    expect(cards.map((c) => c.dataset.district)).toEqual([
      "district-1",
      "district-2",
      "district-3",
    ]);
    expect(cards.map((c) => c.dataset.locked)).toEqual(["false", "true", "true"]);
    const second = cards[1] as HTMLElement;
    expect(second.querySelector("[data-testid=lock]")?.textContent).toContain("10 more stars");
    expect((second.querySelector(".cd-button-primary") as HTMLButtonElement).disabled).toBe(true);
    expect(second.querySelectorAll(".cd-mission-row")).toHaveLength(0);
    expect((cards[0] as HTMLElement).querySelectorAll(".cd-mission-row")).toHaveLength(8);
  });

  it("unlocks district 2 at 10 stars, with progress bars and per-mission stars", async () => {
    await openMap(12);
    const cards = all(".cd-district");
    expect(cards.map((c) => c.dataset.locked)).toEqual(["false", "false", "true"]);
    expect((cards[2] as HTMLElement).querySelector("[data-testid=lock]")?.textContent).toContain(
      "12 more",
    );
    expect(
      (cards[0] as HTMLElement).querySelector("[data-testid=district-stars]")?.textContent,
    ).toBe("12/24 stars");
    const bar = (cards[0] as HTMLElement).querySelector("[role=progressbar]");
    expect(bar?.getAttribute("aria-valuenow")).toBe("50");
    const firstRow = (cards[0] as HTMLElement).querySelector(".cd-mission-row") as HTMLElement;
    expect(firstRow.querySelectorAll(".cd-star-slot[data-earned=true]")).toHaveLength(3);
    expect(firstRow.querySelector(".cd-mission-time")?.textContent).toBe("0:30.0");
  });

  it("Drive enters a district and a mission row opens that mission's briefing", async () => {
    await openMap(12);
    const second = all(".cd-district")[1] as HTMLElement;
    (second.querySelector(".cd-button-primary") as HTMLButtonElement).click();
    await settle();
    expect(app.game.loads).toEqual(["district-1", "district-2"]);
    expect(app.controller.view.screen).toBe("play");

    app.controller.stack.resetTo("home");
    app.controller.openMap();
    await settle();
    (q("[data-mission=d1-m04]") as HTMLButtonElement).click();
    await settle();
    expect(app.game.calls).toContain("open:d1-m04:false");
  });
});

describe("garage screen", () => {
  async function openGarage(coins = 0) {
    await mount({ coins });
    button("Garage").click();
    await settle();
  }
  const clickNext = async () => {
    q<HTMLButtonElement>("button[aria-label='Next car']").click();
    await settle();
  };

  it("shows the selected starter car with three stat bars and a disabled Selected button", async () => {
    await openGarage();
    expect(q("[data-testid=car-name]").textContent).toBe("City Sedan");
    expect(all(".cd-stats [role=meter]").map((m) => m.getAttribute("aria-label"))).toEqual([
      "Speed",
      "Acceleration",
      "Grip",
    ]);
    expect(button("Selected").disabled).toBe(true);
    expect(q("[data-testid=car-price]").textContent).toBe("Starter car");
    expect(app.game.previews).toEqual(["sedan"]);
  });

  it("an unaffordable car shows how many coins are missing and cannot be bought", async () => {
    await openGarage(100);
    await clickNext();
    const car = ROSTER.cars[1];
    expect(q("[data-testid=car-name]").textContent).toBe(car?.name);
    const locked = button("Need");
    expect(locked.disabled).toBe(true);
    expect(locked.textContent).toBe(`Need ${(car?.price ?? 0) - 100} more coins`);
    expect(app.game.previews.at(-1)).toBe(car?.id);
  });

  it("an affordable car can be bought, then selected", async () => {
    await openGarage(1000);
    await clickNext();
    const car = ROSTER.cars[1];
    const buy = button("Buy for");
    expect(buy.disabled).toBe(false);
    buy.click();
    await settle();
    expect(app.profile.coins).toBe(1000 - (car?.price ?? 0));
    expect(q("[data-testid=coins]").textContent).toBe(String(1000 - (car?.price ?? 0)));
    button("Select").click();
    await settle();
    expect(button("Selected").disabled).toBe(true);
    expect(app.profile.save.selected_car).toBe(car?.id);
  });

  it("the carousel wraps in both directions", async () => {
    await openGarage();
    q<HTMLButtonElement>("button[aria-label='Previous car']").click();
    await settle();
    expect(q("[data-testid=car-name]").textContent).toBe(ROSTER.cars.at(-1)?.name);
    await clickNext();
    expect(q("[data-testid=car-name]").textContent).toBe("City Sedan");
  });
});

describe("settings screen", () => {
  async function openSettings() {
    await mount();
    button("Settings").click();
    await settle();
  }

  it("toggles sound and vibration", async () => {
    await openSettings();
    const sound = q<HTMLButtonElement>("button[role=switch][aria-label=Sound]");
    expect(sound.getAttribute("aria-checked")).toBe("true");
    sound.click();
    await settle();
    expect(q("button[role=switch][aria-label=Sound]").getAttribute("aria-checked")).toBe("false");
    expect(app.profile.save.settings.audio).toBe(false);
    q<HTMLButtonElement>("button[role=switch][aria-label=Vibration]").click();
    expect(app.profile.save.settings.haptics).toBe(false);
  });

  const group = (name: string): HTMLElement => {
    const found = all("fieldset").find((f) => f.querySelector("legend")?.textContent === name);
    if (!found) throw new Error(`no choice group ${name}`);
    return found;
  };
  const choice = (name: string, text: string): HTMLInputElement => {
    const label = [...group(name).querySelectorAll("label")].find((l) => l.textContent === text);
    const input = label?.querySelector("input");
    if (!input) throw new Error(`no ${text} in ${name}`);
    return input as HTMLInputElement;
  };

  it("chooses the control layout and the graphics quality", async () => {
    await openSettings();
    const labels = (name: string) =>
      [...group(name).querySelectorAll("label")].map((l) => l.textContent);
    expect(labels("Controls")).toEqual(["Standard", "Mirrored"]);
    expect(choice("Controls", "Standard").checked).toBe(true);
    choice("Controls", "Mirrored").click();
    await settle();
    expect(app.profile.save.settings.control_layout).toBe("mirrored");
    expect(choice("Controls", "Mirrored").checked).toBe(true);
    expect(labels("Graphics")).toEqual(["Auto", "Low", "Medium", "High"]);
    choice("Graphics", "Low").click();
    await settle();
    expect(app.profile.save.settings.graphics_quality).toBe("low");
    expect(app.game.graphics.at(-1)).toBe("low");
    expect(choice("Graphics", "Low").checked).toBe(true);
    expect(choice("Graphics", "Auto").checked).toBe(false);
  });

  it("reset progress needs a confirmation", async () => {
    await mount({ coins: 400 });
    button("Settings").click();
    await settle();
    button("Reset progress").click();
    await settle();
    expect(q("[role=alertdialog]").textContent).toContain("cannot be undone");
    expect(app.profile.coins).toBe(400);
    button("Keep my progress").click();
    await settle();
    expect(host.querySelector("[role=alertdialog]")).toBeNull();
    button("Reset progress").click();
    await settle();
    button("Erase everything").click();
    await settle();
    expect(app.profile.coins).toBe(0);
    expect(host.querySelector(".cd-home")).not.toBeNull();
  });
});

describe("in-drive HUD", () => {
  const delivery = missionOfType("delivery");
  const active = (over: Partial<ReturnType<typeof hud>> = {}) =>
    hud({
      phase: "active",
      missionId: delivery.id,
      objective: {
        kind: "dropoff",
        label: "Deliver the parcel",
        x: 0,
        z: 100,
        radius: 6,
        lane: { edgeId: "e", s: 0 },
      },
      progress: { done: 0, total: 1 },
      timeLeftS: 83.2,
      damage: 1,
      ...over,
    });

  it("free roam shows the minimap, speed and pause button but no mission bar", async () => {
    await mount();
    await drive(playState({ speedKmh: 87.6 }));
    expect(q("[data-testid=speed]").textContent).toBe("88");
    expect(host.querySelector("canvas.cd-minimap")).not.toBeNull();
    expect(host.querySelector(".cd-mission-bar")).toBeNull();
    expect(q(".cd-hint").textContent).toContain("marker");
    expect(host.querySelector("button[aria-label=Pause]")).not.toBeNull();
  });

  it("a delivery shows the timer, objective and a damage meter", async () => {
    await mount();
    await drive(playState({ hud: active(), mission: delivery }));
    expect(q("[data-testid=timer]").textContent).toBe("1:24");
    expect(q("[data-testid=timer]").dataset.urgent).toBe("false");
    expect(q("[data-testid=objective]").textContent).toBe("Deliver the parcel");
    expect(q(".cd-mission-bar [role=meter]").getAttribute("aria-label")).toBe("Damage");
  });

  it("the timer turns urgent in the last ten seconds", async () => {
    await mount();
    await drive(playState({ hud: active({ timeLeftS: 9.5 }), mission: delivery }));
    expect(q("[data-testid=timer]").dataset.urgent).toBe("true");
  });

  it("each mission type gets its own meter", async () => {
    await mount();
    await app.controller.play();
    const expected: [Parameters<typeof missionOfType>[0], string][] = [
      ["taxi", "Comfort"],
      ["parking", "Touches"],
      ["time_trial", "Checkpoints"],
    ];
    for (const [type, label] of expected) {
      app.game.state = playState({
        hud: active({ comfort: type === "taxi" ? 70 : null, progress: { done: 1, total: 3 } }),
        mission: missionOfType(type),
      });
      app.controller.tick(performance.now() + Math.random() * 1000);
      await settle();
      expect(q(".cd-mission-bar [role=meter]").getAttribute("aria-label"), type).toBe(label);
    }
  });

  it("parking shows the hold-still meter while the car is in the bay", async () => {
    await mount();
    await drive(playState({ hud: active(), mission: missionOfType("parking"), parkHold: 0.5 }));
    const labels = all(".cd-mission-bar [role=meter]").map((m) => m.getAttribute("aria-label"));
    expect(labels).toEqual(["Touches", "Hold still"]);
  });

  it("the objective arrow shows only when the objective is off-screen", async () => {
    await mount();
    await drive(playState({ hud: active(), mission: delivery }));
    expect(host.querySelector("[data-testid=objective-arrow]")).toBeNull();
    app.game.state = playState({
      hud: active({
        objective: {
          kind: "dropoff",
          label: "Deliver the parcel",
          x: -80,
          z: 0,
          radius: 6,
          lane: { edgeId: "e", s: 0 },
        },
      }),
      mission: delivery,
    });
    app.controller.tick(performance.now() + 100);
    await settle();
    const arrow = q("[data-testid=objective-arrow]");
    expect(arrow.getAttribute("aria-label")).toContain("80 metres");
    expect((arrow.querySelector(".cd-arrow-pointer") as HTMLElement).style.transform).toContain(
      "rotate(",
    );
    expect(Number.parseFloat(arrow.style.left)).toBeGreaterThan(80);
  });

  it("the pause button opens the pause menu", async () => {
    await mount();
    await drive();
    q<HTMLButtonElement>("button[aria-label=Pause]").click();
    await settle();
    expect(q(".cd-pause").getAttribute("aria-label")).toBe("Paused");
    expect(host.querySelector(".cd-hud")).not.toBeNull();
  });
});

describe("minimap drawing rate", () => {
  it("draws about ten times a second however fast frames come", async () => {
    const draws: string[] = [];
    const ctx = new Proxy(
      {},
      {
        get: (_t, prop) =>
          typeof prop === "string"
            ? prop === "clearRect"
              ? () => draws.push("clear")
              : () => undefined
            : undefined,
        set: () => true,
      },
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as never);
    await mount();
    await drive();
    draws.length = 0;
    for (let frame = 0; frame < 120; frame++) app.controller.tick(5000 + (frame * 1000) / 60);
    expect(draws.length).toBeGreaterThanOrEqual(19);
    expect(draws.length).toBeLessThanOrEqual(21);
    expect(MINIMAP.roads.length).toBe(2);
  });
});

describe("briefing, pause and results", () => {
  it("the briefing shows the mission, its three star targets and two buttons", async () => {
    await mount();
    const mission = missionOfType("taxi");
    await drive(playState({ hud: hud({ phase: "briefing", missionId: mission.id }), mission }));
    expect(q("[data-testid=briefing-title]").textContent).toBe(mission.title);
    expect(all(".cd-targets li")).toHaveLength(3);
    expect(q(".cd-kind").textContent).toContain("Taxi");
    button("Start").click();
    button("Not now").click();
    expect(app.game.calls).toEqual(["accept", "decline"]);
  });

  it("the pause menu offers mission actions only during a mission", async () => {
    await mount();
    await drive();
    app.controller.pause();
    await settle();
    expect(all(".cd-pause-panel button").map((b) => b.textContent)).toEqual([
      "Resume",
      "Settings",
      "Quit to home",
    ]);
    app.controller.resume();
    await drive(
      playState({
        hud: hud({ phase: "active", missionId: "d1-m01" }),
        mission: missionOfType("delivery"),
      }),
    );
    app.controller.pause();
    await settle();
    expect(all(".cd-pause-panel button").map((b) => b.textContent)).toEqual([
      "Resume",
      "Restart mission",
      "Abandon mission",
      "Settings",
      "Quit to home",
    ]);
    button("Resume").click();
    await settle();
    expect(app.controller.view.screen).toBe("play");
  });

  it.each([
    [3, 3],
    [2, 2],
    [1, 1],
  ])("a %i-star success lights %i stars, shows the coins paid and the best time", async (stars, lit) => {
    await mount();
    await app.controller.play();
    app.profile.recordResult(
      result({ stars: stars as 1 | 2 | 3 }),
      missionOfType("delivery") as never,
    );
    await drive(
      playState({
        hud: hud({ phase: "results" }),
        result: result({ stars: stars as 1 | 2 | 3, time: 61.54 }),
        payout: { missionId: "d1-m01", coins: 120, firstClear: true, improved: true },
      }),
    );
    expect(q("[data-testid=outcome]").textContent).toBe("Mission complete");
    expect(all(".cd-results .cd-star-slot[data-earned=true]")).toHaveLength(lit);
    expect(all(".cd-results .cd-star-slot")).toHaveLength(3);
    expect(q(".cd-stars").dataset.animate).toBe("true");
    expect(q("[data-testid=payout]").textContent).toContain("+120 coins");
    expect(q("[data-testid=payout]").textContent).toContain("First clear");
    expect(q("[data-testid=result-time]").textContent).toBe("1:01.5");
    expect(q("[data-testid=result-best]").textContent).toBe("1:01.5");
  });

  it("a failed mission shows no stars, no coins and no Next button", async () => {
    await mount();
    await drive(
      playState({
        hud: hud({ phase: "fail" }),
        result: result({ success: false, stars: 0, coins: 0, failReason: "time_out" }),
        payout: { missionId: "d1-m01", coins: 0, firstClear: false, improved: false },
      }),
    );
    expect(q("[data-testid=outcome]").textContent).toBe("Out of time");
    expect(all(".cd-results .cd-star-slot[data-earned=true]")).toHaveLength(0);
    expect(q("[data-testid=payout]").textContent).toContain("+0 coins");
    expect(all(".cd-results button").map((b) => b.textContent)).toEqual(["Retry", "Free roam"]);
  });

  it("Retry, Next mission and Free roam are wired", async () => {
    await mount();
    await drive(playState({ hud: hud({ phase: "results" }), result: result({ stars: 3 }) }));
    expect(all(".cd-results button").map((b) => b.textContent)).toEqual([
      "Retry",
      "Next mission",
      "Free roam",
    ]);
    button("Retry").click();
    button("Next mission").click();
    button("Free roam").click();
    expect(app.game.calls).toEqual(["open:d1-m01:true", "open:d1-m02:false", "leave"]);
  });

  it("the replay payout notes a better star count", async () => {
    await mount();
    await drive(
      playState({
        hud: hud({ phase: "results" }),
        result: result({ stars: 3 }),
        payout: { missionId: "d1-m01", coins: 40, firstClear: false, improved: true },
      }),
    );
    expect(q("[data-testid=payout]").textContent).toContain("New best stars");
  });
});

describe("touch controls and overlays", () => {
  it("shows the driving buttons only while driving, hides them for briefings and results", async () => {
    await mount();
    expect(host.querySelector("[data-testid=touch-controls]")).toBeNull();
    await drive();
    expect(host.querySelector("[data-testid=touch-controls]")).not.toBeNull();
    app.game.state = playState({
      hud: hud({ phase: "briefing" }),
      mission: missionOfType("delivery"),
    });
    app.controller.tick(performance.now() + 50);
    await settle();
    expect(host.querySelector("[data-testid=touch-controls]")).toBeNull();
    app.game.state = playState({ hud: hud({ phase: "results" }), result: result() });
    app.controller.tick(performance.now() + 100);
    await settle();
    expect(host.querySelector("[data-testid=touch-controls]")).toBeNull();
  });

  it("passes the saved layout to the buttons", async () => {
    await mount();
    app.controller.setSetting("control_layout", "mirrored");
    await drive();
    expect(q("[data-testid=touch-controls]").dataset.layout).toBe("mirrored");
  });

  it("releases held buttons when they disappear so the car does not keep steering", async () => {
    await mount();
    await drive();
    touch.press("left", 1);
    expect(touch.isHeld("left")).toBe(true);
    app.controller.pause();
    app.controller.openSettings();
    await settle();
    app.controller.back();
    app.controller.back();
    app.controller.stack.resetTo("home");
    await settle();
    expect(touch.isHeld("left")).toBe(false);
  });

  it("without touch support no driving buttons render", async () => {
    await mount({ showTouch: false });
    await drive();
    expect(host.querySelector("[data-testid=touch-controls]")).toBeNull();
  });

  it("always includes the portrait guard", async () => {
    await mount();
    expect(host.querySelector("[data-testid=rotate-overlay]")).not.toBeNull();
  });

  it("shows the loading veil and an error banner with a Dismiss button", async () => {
    await mount();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    app.game.failLoad = new Error("boom");
    await app.controller.enterDistrict("district-1");
    app.game.id = undefined;
    await app.controller.enterDistrict("district-1");
    await settle();
    expect(q("[role=alert].cd-error").textContent).toContain("boom");
    button("Dismiss").click();
    await settle();
    expect(host.querySelector(".cd-error")).toBeNull();
  });
});

describe("accessibility", () => {
  it("every button on every screen has an accessible name", async () => {
    await mount({ coins: 500, stars: 12 });
    const names: string[] = [];
    const check = () => {
      for (const b of all("button")) {
        const name = (b.getAttribute("aria-label") ?? b.textContent ?? "").trim();
        expect(name, b.outerHTML).not.toBe("");
        names.push(name);
      }
    };
    check();
    for (const open of ["Map", "Garage", "Settings"]) {
      button(open).click();
      await settle();
      check();
      q<HTMLButtonElement>("button[aria-label=Back]").click();
      await settle();
    }
    await drive(
      playState({
        hud: hud({ phase: "active", missionId: "d1-m01" }),
        mission: missionOfType("delivery"),
      }),
    );
    check();
    app.controller.pause();
    await settle();
    check();
    expect(names.length).toBeGreaterThan(30);
  });

  it("every status region and dialog is labelled", async () => {
    await mount();
    await drive(playState({ hud: hud({ phase: "briefing" }), mission: missionOfType("parking") }));
    for (const dialog of all("[role=dialog]"))
      expect(dialog.getAttribute("aria-label")).toBeTruthy();
  });
});

describe("fake game guard", () => {
  it("the fake serves no state until a district is loaded", () => {
    const game = new FakeGame();
    expect(game.snapshot()).toBeUndefined();
    expect(game.minimapModel()).toBeUndefined();
  });
});
