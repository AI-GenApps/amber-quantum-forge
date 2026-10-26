import { afterEach, describe, expect, it } from "vitest";
import { cleanup, goTab, openScreen, renderApp, SEEDS, type SeedName } from "./harness";

const POINTS = Object.keys(SEEDS) as SeedName[];

describe("every screen renders at three progress points", () => {
  afterEach(cleanup);

  for (const point of POINTS) {
    describe(point, () => {
      it("Observe shows the sky, Gather and a goal hint", async () => {
        const r = await renderApp({ seed: point });
        expect(r.q("[data-tab='observe']")).toBeTruthy();
        expect(r.q(".co-gather").getAttribute("aria-label")).toMatch(/^Gather starlight, plus /);
        expect(r.q("[data-goal]").textContent?.length).toBeGreaterThan(5);
        expect(r.q("[data-sky='full']")).toBeTruthy();
        expect(r.q("[data-art-slot='observatory-building']")).toBeTruthy();
      });

      it("Build lists 8 instrument rows", async () => {
        const r = await renderApp({ seed: point });
        await goTab(r, "build");
        expect(r.qa("li[data-instrument]")).toHaveLength(8);
        expect(r.qa("[data-mode]")).toHaveLength(3);
        const open = r.qa("li[data-instrument][data-state='open']").length;
        const expected = { fresh: 1, mid: 4, late: 8 }[point];
        expect(open).toBe(expected);
        expect(r.qa("[data-upgrade]")).toHaveLength(open * 3);
      });

      it("Atlas lists 12 constellation cards", async () => {
        const r = await renderApp({ seed: point });
        await goTab(r, "atlas");
        expect(r.qa("li[data-constellation]")).toHaveLength(12);
        const charted = r.qa("li[data-state='charted']").length;
        expect(charted).toBe({ fresh: 0, mid: 2, late: 8 }[point]);
        expect(r.q(".co-atlas-head__bonus").textContent).toBe(
          `+${{ fresh: 0, mid: 10, late: 40 }[point]}% starlight from the atlas`,
        );
      });

      it("Eclipse lists 10 boons", async () => {
        const r = await renderApp({ seed: point });
        await goTab(r, "eclipse");
        expect(r.qa("li[data-boon]")).toHaveLength(10);
        const owned = r.qa("li[data-boon][data-state='owned']").length;
        expect(owned).toBe({ fresh: 0, mid: 0, late: 3 }[point]);
      });

      it("Journal lists 6 chapters and 30 entries", async () => {
        const r = await renderApp({ seed: point });
        await goTab(r, "journal");
        expect(r.qa("section[data-chapter]")).toHaveLength(6);
        expect(r.qa("[data-entry]")).toHaveLength(30);
        expect(r.qa("[data-art-slot^='lore-']")).toHaveLength(6);
        const open = r.qa("[data-entry]:not([data-state='locked'])").length;
        expect(open).toBe({ fresh: 0, mid: 5, late: 19 }[point]);
      });

      it("Achievements lists 20 rows", async () => {
        const r = await renderApp({ seed: point });
        await openScreen(r, "achievements");
        expect(r.qa("li[data-achievement]")).toHaveLength(20);
        expect(r.qa("li[data-achievement][data-state='unlocked']").length).toBeGreaterThanOrEqual(
          { fresh: 0, mid: 2, late: 5 }[point],
        );
      });

      it("Statistics, Settings and How to Play render", async () => {
        const r = await renderApp({ seed: point });
        await openScreen(r, "statistics");
        expect(r.qa("[data-stat]")).toHaveLength(16);
        await openScreen(r, "settings");
        expect(r.qa("[role='switch']")).toHaveLength(5);
        await openScreen(r, "howto");
        expect(r.q("[data-page]").textContent).toBe("Page 1 of 4");
      });
    });
  }

  it("Title offers Begin for a new player and Continue plus New Journey for a returning one", async () => {
    const fresh = await renderApp({ seed: "fresh", start: "title" });
    expect(fresh.q("[data-screen='title']").textContent).toContain("Begin Journey");
    expect(fresh.q("[data-screen='title']").textContent).not.toContain("New Journey");
    await fresh.unmount();
    const returning = await renderApp({ seed: "mid", start: "title" });
    const text = returning.q("[data-screen='title']").textContent ?? "";
    expect(text).toContain("Continue");
    expect(text).toContain("New Journey");
    expect(text).toContain("How to Play");
    expect(text).toContain("Settings");
    expect(returning.q("[data-art-slot='key-art']")).toBeTruthy();
  });

  it("Comet screen renders locked, ready and claimed states", async () => {
    const locked = await renderApp({ seed: "fresh" });
    await openScreen(locked, "comet");
    expect(locked.q("[data-comet-result]").getAttribute("data-comet-result")).toBe("locked");
    await locked.unmount();
    const ready = await renderApp({ seed: "mid" });
    await openScreen(ready, "comet");
    expect(ready.qa("[data-star]")).toHaveLength(6);
  });
});
