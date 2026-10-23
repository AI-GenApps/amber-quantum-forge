import { createMotion } from "@web-games/kit";
import { afterEach, describe, expect, it } from "vitest";
import {
  FRAMES,
  flameFlicker,
  lanternBloom,
  loopGlow,
  screenEnter,
  sheetEnter,
  starPop,
  tilePop,
  winCascade,
} from "../../src/motion/presets";
import { installAnimate, removeAnimate } from "../helpers/env";

afterEach(() => {
  removeAnimate();
  document.body.replaceChildren();
});

function board(cells: number[]): HTMLElement {
  const root = document.createElement("div");
  for (const cell of cells) {
    const holder = document.createElement("div");
    holder.setAttribute("data-cell", String(cell));
    for (const cls of ["ll-tile", "ll-lantern"]) {
      const el = document.createElement("div");
      el.className = cls;
      holder.appendChild(el);
    }
    root.appendChild(holder);
  }
  document.body.appendChild(root);
  return root;
}

const finalOf = (el: Element | null | undefined, prop: string): string =>
  (el as HTMLElement | null | undefined)?.style.getPropertyValue(prop) ?? "";

interface Case {
  name: string;
  run: (motion: ReturnType<typeof createMotion>, root: HTMLElement) => Promise<void>;
  /** The element the final frame lands on, with the property and value it must hold. */
  final: (root: HTMLElement) => [Element | null, string, string];
  animations: number;
}

const CASES: Case[] = [
  {
    name: "tilePop",
    run: (m, root) => tilePop(m, root, [0, 1]),
    final: (root) => [root.querySelector('[data-cell="0"] .ll-tile'), "transform", "scale(1)"],
    animations: 2,
  },
  {
    name: "loopGlow",
    run: (m, root) => loopGlow(m, root, [[0, 1, 2]]),
    final: (root) => [root.querySelector('[data-cell="2"] .ll-tile'), "filter", "none"],
    animations: 3,
  },
  {
    name: "lanternBloom",
    run: (m, root) => lanternBloom(m, root, [0]),
    final: (root) => [root.querySelector('[data-cell="0"] .ll-lantern'), "transform", "scale(1)"],
    animations: 1,
  },
  {
    name: "winCascade",
    run: (m, root) => winCascade(m, root, [[0, 1, 2]]),
    final: (root) => [root.querySelector('[data-cell="0"] .ll-tile'), "opacity", ""],
    animations: 3,
  },
  {
    name: "screenEnter",
    run: (m, root) => screenEnter(m, root),
    final: (root) => [root, "opacity", "1"],
    animations: 1,
  },
  {
    name: "sheetEnter",
    run: (m, root) => sheetEnter(m, root),
    final: (root) => [root, "transform", "translateY(0)"],
    animations: 1,
  },
  {
    name: "starPop",
    run: (m, root) =>
      starPop(m, Array.from(root.querySelectorAll<HTMLElement>('[data-cell="0"] > div'))),
    final: (root) => [root.querySelector('[data-cell="0"] .ll-tile'), "opacity", "1"],
    animations: 2,
  },
  {
    name: "flameFlicker",
    run: (m, root) => flameFlicker(m, root),
    final: (root) => [root, "transform", "scale(1, 1)"],
    animations: 1,
  },
];

describe("motion presets", () => {
  it("has a final frame for every preset", () => {
    for (const frames of Object.values(FRAMES)) expect(frames.length).toBeGreaterThanOrEqual(2);
  });

  it.each(CASES)("$name animates when motion is on", async ({ run, animations }) => {
    const animate = installAnimate();
    await run(createMotion(false), board([0, 1, 2]));
    expect(animate).toHaveBeenCalledTimes(animations);
  });

  it.each(CASES)("$name applies its final frame at once and starts nothing when reduced", async ({
    run,
    final,
  }) => {
    const animate = installAnimate();
    const root = board([0, 1, 2]);
    await run(createMotion(true), root);
    expect(animate).not.toHaveBeenCalled();
    const [el, prop, value] = final(root);
    expect(el).not.toBeNull();
    if (value !== "") expect(finalOf(el, prop)).toBe(value);
  });

  it("settles synchronously when reduced: the frame is there before the promise resolves", () => {
    const animate = installAnimate();
    const root = board([0]);
    void tilePop(createMotion(true), root, [0]);
    expect(finalOf(root.querySelector(".ll-tile"), "transform")).toBe("scale(1)");
    expect(animate).not.toHaveBeenCalled();
  });

  it("follows the setting when it flips at run time", async () => {
    const animate = installAnimate();
    let reduced = false;
    const motion = createMotion(() => reduced);
    const root = board([0]);
    await tilePop(motion, root, [0]);
    expect(animate).toHaveBeenCalledTimes(1);
    reduced = true;
    await tilePop(motion, root, [0]);
    expect(animate).toHaveBeenCalledTimes(1);
  });
});
