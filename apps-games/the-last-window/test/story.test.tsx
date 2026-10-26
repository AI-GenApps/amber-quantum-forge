import {
  defaultProfile,
  type OptionKey,
  type Profile,
  SCENES,
  type SceneDef,
  sceneFor,
} from "@web-games/the-last-window-core";
import { afterEach, describe, expect, it } from "vitest";
import {
  click,
  clickByText,
  currentScreen,
  mountApp,
  press,
  profileOf,
  q,
  type Rig,
  text,
} from "./helpers";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

function ready(
  script: SceneDef,
  choices: Record<string, OptionKey> = {},
  extra: Partial<Profile> = {},
): Partial<Profile> {
  return {
    day: 15,
    ...extra,
    regulars: {
      ...defaultProfile().regulars,
      [script.regular]: {
        fp: 8,
        visits: 5,
        scenesDone: script.index - 1,
        choices,
        ending: null,
      },
    },
    pendingEvening: [script.id],
  };
}

async function openScene(script: SceneDef, profile: Partial<Profile>, replay = false) {
  rig = await mountApp({
    route: ["scene", { ids: [script.id], index: 0, after: "home", replay }],
    profile,
  });
  return rig.container;
}

/** Reads every beat of the open scene; picks `pick` at a choice. Returns the texts shown. */
async function readAll(container: HTMLElement, pick: OptionKey = "a"): Promise<string[]> {
  const shown: string[] = [];
  for (let guard = 0; guard < 60; guard++) {
    const dialogue = container.querySelector("[data-testid='dialogue']");
    if (dialogue) {
      shown.push(dialogue.querySelector(".tlw-dialogue__text")?.textContent ?? "");
      await press(dialogue, "Enter");
      continue;
    }
    const choice = container.querySelector("[data-testid='choice']");
    if (choice) {
      await click(choice.querySelectorAll("button")[pick === "a" ? 0 : 1] as HTMLElement);
      continue;
    }
    break;
  }
  return shown;
}

describe("story scenes", () => {
  it("shows a choice, plays the picked reaction and saves the choice", async () => {
    const script = sceneFor(1, 3) as SceneDef;
    const choice = script.choice;
    expect(choice).toBeDefined();
    const container = await openScene(script, ready(script));
    const shown = await readAll(container, "b");
    const reaction = choice?.options.b.reaction[0]?.text ?? "";
    expect(shown).toContain(reaction);
    expect(shown).not.toContain(choice?.options.a.reaction[0]?.text);
    await (rig as Rig).flush();
    const saved = profileOf(rig as Rig).regulars[1];
    expect(saved?.choices[choice?.id ?? ""]).toBe("b");
    expect(saved?.scenesDone).toBe(3);
    expect(text(q(container, "[data-testid='scene-done']"))).toContain("5 coins");
    await clickByText(container, "Continue");
    expect(currentScreen(rig as Rig)).toBe("home");
  });

  it("shows only the beats whose guard matches an earlier choice", async () => {
    const script = SCENES.find((scene) => scene.beats.some((beat) => beat.guard)) as SceneDef;
    const beat = script.beats.find((entry) => entry.guard);
    const guard = beat?.guard;
    expect(guard).toBeDefined();
    if (!guard || !beat) return;
    const other: OptionKey = guard.option === "a" ? "b" : "a";
    const withGuard = await openScene(script, ready(script, { [guard.choice]: guard.option }));
    expect(await readAll(withGuard)).toContain(beat.text);
    rig?.unmount();
    const without = await openScene(script, ready(script, { [guard.choice]: other }));
    expect(await readAll(without)).not.toContain(beat.text);
  });

  it("closes scene 5 with the ending title card, the gift and a Journal entry", async () => {
    const script = sceneFor(1, 5) as SceneDef;
    const c1 = (sceneFor(1, 3) as SceneDef).choice?.id ?? "";
    const container = await openScene(script, ready(script, { [c1]: "a" }, { coins: 10 }));
    let sawEnding = false;
    for (let guard = 0; guard < 60; guard++) {
      const title = container.querySelector("[data-testid='ending-title']");
      if (title) {
        sawEnding = true;
        expect(title.textContent).toBe("Ending: Lit One More Night");
      }
      const dialogue = container.querySelector("[data-testid='dialogue']");
      if (!dialogue) break;
      await press(dialogue, "Enter");
    }
    expect(sawEnding).toBe(true);
    await (rig as Rig).flush();
    const done = text(q(container, "[data-testid='scene-done']"));
    expect(done).toContain("Ending: Lit One More Night");
    expect(done).toContain("Saved to your Journal");
    expect(done).toContain("15 coins");
    expect(profileOf(rig as Rig).regulars[1]?.ending).toBe("a");
    expect(profileOf(rig as Rig).coins).toBe(25);
  });

  it("replays a finished scene without rewards", async () => {
    const script = sceneFor(1, 1) as SceneDef;
    const profile = ready(script, {}, { coins: 40 });
    profile.regulars = {
      ...defaultProfile().regulars,
      1: { fp: 8, visits: 5, scenesDone: 5, choices: {}, ending: "a" },
    };
    profile.pendingEvening = [];
    const container = await openScene(script, profile, true);
    expect(container.textContent).toContain("Replay: no rewards");
    await readAll(container);
    await (rig as Rig).flush();
    expect(profileOf(rig as Rig).coins).toBe(40);
    expect(container.textContent).not.toContain("coins from a grateful friend");
  });

  it("chains several scenes in one evening and ends at the finale on Day 14", async () => {
    const first = sceneFor(1, 1) as SceneDef;
    const second = sceneFor(2, 1) as SceneDef;
    rig = await mountApp({
      route: ["scene", { ids: [first.id, second.id], index: 0, after: "finale", replay: false }],
      profile: {
        day: 15,
        pendingEvening: [first.id, second.id],
        regulars: {
          ...defaultProfile().regulars,
          1: { fp: 8, visits: 5, scenesDone: 0, choices: {}, ending: null },
          2: { fp: 8, visits: 5, scenesDone: 0, choices: {}, ending: null },
        },
      },
    });
    const container = rig.container;
    await readAll(container);
    await rig.flush();
    await clickByText(container, "Next");
    expect(container.textContent).toContain(second.title);
    await readAll(container);
    await rig.flush();
    await clickByText(container, "Continue");
    expect(currentScreen(rig)).toBe("result");
    expect(q(container, "[data-testid='finale-title']").textContent).toBe("Lantern Night");
    expect(container.querySelectorAll(".tlw-finale__card")).toHaveLength(8);
    expect(q(container, "[data-testid='finale-caption']").textContent).toContain(
      "Marit's notebook",
    );
  });
});
