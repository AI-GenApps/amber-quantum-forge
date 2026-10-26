import {
  defaultProfile,
  type Profile,
  type SceneDef,
  sceneFor,
} from "@web-games/the-last-window-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bindAudioLifecycle } from "../src/feedback/feedback";
import { click, clickByText, mountApp, press, q, type Rig } from "./helpers";
import { makeDrink, selectSeat, serveActive } from "./play";
import { createRecorder, type Recorder } from "./recorder";

let rig: Rig | null = null;
let rec: Recorder;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

async function open(options: Parameters<typeof mountApp>[0]): Promise<HTMLElement> {
  rec = createRecorder();
  rig = await mountApp({ ...options, feedback: rec });
  return rig.container;
}

const stock = { pastries: ["pastry-1" as const], books: ["book-1" as const] };

describe("music scene by route", () => {
  it("plays menu music on menu screens, shift music in a shift and story music in a scene", async () => {
    await open({ route: ["home"] });
    expect(rec.scenes.at(-1)).toBe("menu");
    rig?.unmount();
    await open({ route: ["shift", { kind: "day", day: 2 }], profile: { day: 2, stock } });
    expect(rec.scenes.at(-1)).toBe("shift");
    rig?.unmount();
    const script = sceneFor(1, 1) as SceneDef;
    await open({
      route: ["scene", { ids: [script.id], index: 0, after: "home", replay: true }],
      profile: { day: 15 },
    });
    expect(rec.scenes.at(-1)).toBe("story");
  });

  it("returns to the menu music when a shift ends", async () => {
    const container = await open({
      route: ["shift", { kind: "day", day: 2 }],
      profile: { day: 2, stock },
    });
    expect(rec.scenes.at(-1)).toBe("shift");
    await (rig as Rig).advance(300000);
    expect(q(container, "[data-testid='result-title']")).toBeTruthy();
    expect(rec.scenes.at(-1)).toBe("menu");
  });
});

describe("interface sounds", () => {
  it("taps, backs, toggles and sheets each get their own sound", async () => {
    const container = await open({ route: ["home"] });
    await clickByText(container, "Settings");
    expect(rec.events.at(-1)).toEqual({ type: "ui", ui: "tap" });
    await clickByText(container, "Sound effects");
    expect(rec.events.at(-1)).toEqual({ type: "ui", ui: "toggle" });
    await click(q(container, ".tlw-header__back"));
    expect(rec.events.at(-1)).toEqual({ type: "ui", ui: "back" });
  });

  it("plays the sheet sound when a sheet opens", async () => {
    const container = await open({ route: ["settings"] });
    await clickByText(container, "Reset progress");
    expect(rec.events.filter((e) => e.type === "ui" && e.ui === "sheet")).toHaveLength(1);
  });

  it("does not add a tap sound on the station buttons", async () => {
    const container = await open({
      route: ["shift", { kind: "day", day: 2 }],
      profile: { day: 2, stock },
    });
    await (rig as Rig).advance(4000);
    const before = rec.events.filter((e) => e.type === "ui").length;
    await click(q(container, "[data-testid='drink-station'] [data-token='cup']"));
    expect(rec.events.filter((e) => e.type === "ui")).toHaveLength(before);
  });
});

describe("shift events", () => {
  it("fires the start, arrival, seat, step, wrong-step and serve events", async () => {
    const container = await open({
      route: ["shift", { kind: "day", day: 1 }],
      profile: { day: 1, stock, flags: { tutorial: true } },
    });
    const game = rig as Rig;
    expect(rec.types()).toContain("shift-start");
    await game.advance(1100);
    expect(rec.types()).toContain("customer-seated");
    await selectSeat(game, "Tobias");
    expect(rec.types()).toContain("seat-selected");
    await click(q(container, "[data-testid='drink-station'] [data-token='cup']"));
    await click(q(container, "[data-testid='drink-station'] [data-token='pour']"));
    expect(rec.types()).toContain("step-wrong");
    await makeDrink(game, "drink-1");
    expect(rec.types().filter((t) => t === "step-ok").length).toBeGreaterThanOrEqual(3);
    await serveActive(game);
    expect(rec.types()).toContain("served");
    expect(rec.types()).toContain("item-ready");
  });

  it("fires patience warnings and the closing bell", async () => {
    await open({ route: ["shift", { kind: "day", day: 2 }], profile: { day: 2, stock } });
    await (rig as Rig).advance(300000);
    expect(rec.types()).toContain("patience-warning");
    expect(rec.types()).toContain("shift-closed");
    expect(rec.types().some((t) => t === "customer-left")).toBe(true);
  });
});

describe("rain loop", () => {
  it("rains in a rain shift and clears when the shift screen closes", async () => {
    await open({ route: ["shift", { kind: "day", day: 3 }], profile: { day: 3, stock } });
    expect(rec.rain.at(-1)).toBe(true);
    await (rig as Rig).advance(400000);
    expect(rig?.app.router.current.name).toBe("result");
    expect(rec.rain.at(-1)).toBe(false);
  });

  it("stays dry on a morning shift", async () => {
    await open({ route: ["shift", { kind: "day", day: 1 }], profile: { day: 1, stock } });
    expect(rec.rain.includes(true)).toBe(false);
  });

  it("rains in the shop preview when the rain interior is chosen", async () => {
    const container = await open({ route: ["shop"] });
    expect(rec.rain.at(-1)).toBe(false);
    await clickByText(container, "Rain");
    expect(rec.rain.at(-1)).toBe(true);
    await clickByText(container, "Morning");
    expect(rec.rain.at(-1)).toBe(false);
  });
});

describe("result, shop and story feedback", () => {
  it("reveals the stars with a stagger and the right count", async () => {
    await open({ route: ["shift", { kind: "day", day: 2 }], profile: { day: 2, stock } });
    await (rig as Rig).advance(300000);
    const stars = rec.later.filter((item) => item.event.type === "star");
    expect(stars.length).toBeGreaterThanOrEqual(1);
    expect(stars.map((s) => s.delayMs)).toEqual(stars.map((_, i) => i * 120));
  });

  it("plays the decor sound after a purchase", async () => {
    const container = await open({ route: ["shop"], profile: { day: 4, coins: 200 } });
    await click(q(container, "[data-decor='decor-1']"));
    await clickByText(container, "Buy it");
    await (rig as Rig).flush();
    expect(rec.types()).toContain("decor-buy");
  });

  function sceneProfile(script: SceneDef): Partial<Profile> {
    return {
      day: 15,
      regulars: {
        ...defaultProfile().regulars,
        [script.regular]: {
          fp: 8,
          visits: 5,
          scenesDone: script.index - 1,
          choices: {},
          ending: null,
        },
      },
      pendingEvening: [script.id],
    };
  }

  it("plays scene-open, choice and ending sounds through a full scene", async () => {
    const script = sceneFor(1, 5) as SceneDef;
    const container = await open({
      route: ["scene", { ids: [script.id], index: 0, after: "home", replay: false }],
      profile: sceneProfile(script),
    });
    expect(rec.types()).toContain("scene-open");
    for (let guard = 0; guard < 80; guard++) {
      const dialogue = container.querySelector("[data-testid='dialogue']");
      if (dialogue) {
        await press(dialogue, "Enter");
        continue;
      }
      const choice = container.querySelector("[data-testid='choice']");
      if (choice) {
        await click(choice.querySelectorAll("button")[0] as HTMLElement);
        continue;
      }
      break;
    }
    expect(rec.types()).toContain("ending");
    expect(rec.types().some((t) => t === "choice") || script.choice === undefined).toBe(true);
  });
});

describe("reduced motion", () => {
  function spyAnimate() {
    const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel: () => undefined }));
    Object.defineProperty(Element.prototype, "animate", {
      value: animate,
      configurable: true,
      writable: true,
    });
    return animate;
  }
  afterEach(() => {
    Reflect.deleteProperty(Element.prototype, "animate");
  });

  it("runs no animation when the player asks for reduced motion, yet the result is complete", async () => {
    const animate = spyAnimate();
    const container = await open({
      route: ["shift", { kind: "day", day: 2 }],
      profile: { day: 2, stock },
      settings: { reducedMotion: true },
    });
    await (rig as Rig).advance(300000);
    expect(q(container, "[data-testid='result-title']").textContent).toContain("Day 2");
    expect(container.querySelectorAll(".wg-star--on").length).toBeGreaterThanOrEqual(1);
    expect(animate).not.toHaveBeenCalled();
  });

  it("also follows the system preference", async () => {
    const animate = spyAnimate();
    await open({
      route: ["shift", { kind: "day", day: 2 }],
      profile: { day: 2, stock },
      systemReducedMotion: true,
    });
    await (rig as Rig).advance(300000);
    expect(animate).not.toHaveBeenCalled();
  });

  it("animates when motion is allowed", async () => {
    const animate = spyAnimate();
    await open({ route: ["shift", { kind: "day", day: 2 }], profile: { day: 2, stock } });
    await (rig as Rig).advance(300000);
    expect(animate).toHaveBeenCalled();
  });
});

describe("audio lifecycle", () => {
  it("suspends on pause and resumes on return", () => {
    const calls: string[] = [];
    let pause: () => void = () => undefined;
    let resume: () => void = () => undefined;
    const off = bindAudioLifecycle(
      {
        suspend: async () => void calls.push("suspend"),
        resume: async () => void calls.push("resume"),
      },
      {
        onPause: (listener) => {
          pause = listener;
          return () => undefined;
        },
        onResume: (listener) => {
          resume = listener;
          return () => undefined;
        },
      },
    );
    pause();
    resume();
    expect(calls).toEqual(["suspend", "resume"]);
    off();
  });
});
