import { CONSTELLATIONS } from "@web-games/cloud-observatory-core";
import { createMemoryAdapter, type StorageAdapter } from "@web-games/kit";
import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../src/App";
import { createAppRouter } from "../../src/app/routes";
import { PROFILE_KEY } from "../../src/save/profile-store";
import { ConstellationFigure } from "../../src/sky/ConstellationFigure";
import { NumberText } from "../../src/ui/NumberText";
import { createHarness } from "../session/harness";
import { cleanup, renderApp } from "./harness";

afterEach(cleanup);

async function draw(vnode: preact.ComponentChild): Promise<HTMLElement> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  await act(() => render(vnode, container));
  return container;
}

describe("NumberText", () => {
  it("shows the compact number and speaks it in words", async () => {
    const cases: Array<[number, string, string]> = [
      [0, "0", "0"],
      [999, "999", "999"],
      [1234, "1.23K", "1.23 thousand"],
      [1.2e6, "1.20M", "1.2 million"],
      [4.5e9, "4.50B", "4.5 billion"],
      [Number.NaN, "0", "0"],
      [1e305, "1.00e300+", "more than ten to the 300"],
    ];
    for (const [value, shown, spoken] of cases) {
      const box = await draw(<NumberText value={value} />);
      const el = box.querySelector(".co-num");
      expect(el?.textContent).toBe(shown);
      expect(el?.getAttribute("aria-label")).toBe(spoken);
      expect(`${el?.textContent}`).not.toMatch(/NaN|Infinity/);
    }
  });

  it("appends the unit to the spoken label only", async () => {
    const box = await draw(<NumberText value={1500} unit="starlight" />);
    expect(box.querySelector(".co-num")?.getAttribute("aria-label")).toBe("1.5 thousand starlight");
    expect(box.textContent).toBe("1.50K");
  });
});

describe("ConstellationFigure", () => {
  it("draws every constellation with one dot per star and a path", async () => {
    for (const def of CONSTELLATIONS) {
      const box = await draw(<ConstellationFigure def={def} />);
      expect(box.querySelectorAll("circle")).toHaveLength(def.stars.length);
      expect(box.querySelector("path")?.getAttribute("d")?.startsWith("M")).toBe(true);
      expect(box.querySelector("path")?.getAttribute("d")?.endsWith("Z")).toBe(def.closed);
      expect(box.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("is named when given a label and dims when not charted", async () => {
    const def = CONSTELLATIONS[0];
    if (!def) throw new Error("no constellations");
    const box = await draw(<ConstellationFigure def={def} label="The Lyre" dim />);
    const svg = box.querySelector("svg");
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-label")).toBe("The Lyre");
    expect(svg?.classList.contains("co-figure--dim")).toBe(true);
  });
});

describe("boot", () => {
  it("shows a loading state, then the title, while the save loads", async () => {
    const harness = await createHarness({ load: false });
    expect(harness.session.snapshot().loaded).toBe(false);
    const router = createAppRouter();
    const container = document.createElement("div");
    document.body.appendChild(container);
    await act(() =>
      render(<App session={harness.session} router={router} now={harness.clock.now} />, container),
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(harness.session.snapshot().loaded).toBe(true);
    expect(container.querySelector("[data-screen='title']")).not.toBeNull();
  });

  it("tells the player when the save was damaged and repaired", async () => {
    const r = await renderApp({ start: "title", harness: { raw: "{not json" } });
    const notice = r.q("[data-notice='recovered']");
    expect(notice.textContent).toContain("Your save was damaged");
    await r.click(notice.querySelector("button"));
    expect(r.container.querySelector("[data-notice]")).toBeNull();
  });

  it("warns that nothing will be saved when the save cannot be read at all", async () => {
    const memory = createMemoryAdapter();
    const flaky: StorageAdapter = {
      name: "flaky",
      get: async (key) => {
        if (key === PROFILE_KEY) throw new Error("storage busy");
        return memory.get(key);
      },
      set: memory.set,
      remove: memory.remove,
    };
    const r = await renderApp({ start: "title", harness: { adapter: memory, storage: flaky } });
    expect(r.q("[data-notice='read-failed']").textContent).toContain("will not be saved");
    expect(r.harness.session.snapshot().persistence).toBe("read-failed");
  });
});
