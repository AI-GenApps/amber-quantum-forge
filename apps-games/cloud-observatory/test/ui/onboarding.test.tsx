import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { START_MS } from "../session/harness";
import { cleanup, fakeFrames, goTab, openScreen, type Rendered, renderApp } from "./harness";

afterEach(cleanup);

const tutorial = (r: Rendered) => r.harness.session.snapshot().profile.tutorial;
const hint = (r: Rendered) => r.container.querySelector("[data-coach]");
const text = (el: Element | null) => el?.textContent ?? "";

async function gather(r: Rendered, times: number): Promise<void> {
  for (let index = 0; index < times; index += 1) await r.click(r.q(".co-gather"));
}

async function tick(r: Rendered, seconds: number): Promise<void> {
  for (let left = seconds; left > 0; left -= 30) {
    await act(() => {
      r.harness.session.tick(Math.min(30, left));
    });
  }
}

describe("onboarding hints", () => {
  it("teaches Observe first, never blocks input, and ends after three taps", async () => {
    const r = await renderApp({});
    expect(hint(r)?.getAttribute("data-coach")).toBe("observe");
    expect(text(hint(r))).toContain("Tap the sky to gather starlight.");
    expect(r.qa("[data-coach] button")).toHaveLength(1);
    expect(r.container.querySelector("[role='dialog']")).toBeNull();
    await gather(r, 2);
    expect(hint(r)).not.toBeNull();
    expect(r.harness.session.snapshot().profile.game.taps).toBe(2);
    await gather(r, 1);
    expect(hint(r)).toBeNull();
    expect(tutorial(r).observe).toBe(true);
    await r.harness.session.flush();
    expect(r.harness.saved().tutorial.observe).toBe(true);
  });

  it("walks Build, Atlas and Chart as the player reaches them", async () => {
    const r = await renderApp({});
    await gather(r, 5);
    expect(hint(r)?.getAttribute("data-coach")).toBe("build");
    expect(text(hint(r))).toContain("Brass Telescope");

    await goTab(r, "build");
    await r.click(r.q("[data-buy='telescope']"));
    expect(tutorial(r).build).toBe(true);
    expect(hint(r)).toBeNull();

    await tick(r, 120);
    await r.click(r.q("[data-buy='telescope']"));
    await tick(r, 300);
    expect(hint(r)?.getAttribute("data-coach")).toBe("atlas");
    expect(text(hint(r))).toContain("Your first constellation is ready.");

    await goTab(r, "atlas");
    await r.click(r.q("li[data-constellation='lyre'] .co-card-atlas__action"));
    expect(tutorial(r).atlas).toBe(true);
    expect(hint(r)?.getAttribute("data-coach")).toBe("chart");
    expect(text(hint(r))).toContain("Tap the numbered stars in order.");

    await r.click(r.q('[data-star="0"]'));
    expect(tutorial(r).chart).toBe(true);
    expect(hint(r)).toBeNull();
  });

  it("skip hides the tips and keeps them hidden", async () => {
    const r = await renderApp({});
    await r.click(r.q(".co-coach__skip"));
    expect(hint(r)).toBeNull();
    expect(tutorial(r).skipped).toBe(true);
    await gather(r, 5);
    expect(hint(r)).toBeNull();
    await r.harness.session.flush();
    expect(r.harness.saved().tutorial.skipped).toBe(true);
  });

  it("replay from How to Play starts the hints again", async () => {
    const r = await renderApp({ seed: "mid" });
    expect(hint(r)).toBeNull();
    await openScreen(r, "howto");
    await r.click(r.q(".co-howto__replay"));
    expect(tutorial(r)).toEqual({
      observe: false,
      build: false,
      atlas: false,
      chart: false,
      skipped: false,
    });
    expect(r.container.querySelector(".wg-toast")?.textContent).toContain("tips will show again");
    await r.click(r.q("[aria-label='Back']"));
    expect(hint(r)?.getAttribute("data-coach")).toBe("observe");
    await gather(r, 3);
    expect(tutorial(r).observe).toBe(true);
    expect(hint(r)?.getAttribute("data-coach")).toBe("build");
  });

  it("a returning player with progress sees no tips", async () => {
    const r = await renderApp({ seed: "late" });
    expect(hint(r)).toBeNull();
    expect(tutorial(r).chart).toBe(true);
  });

  it("a New Journey starts the tips over", async () => {
    const r = await renderApp({ seed: "mid", start: "title" });
    await r.click(Array.from(r.qa("button")).find((b) => b.textContent === "New Journey") ?? null);
    await r.click(
      Array.from(r.qa("button")).find((b) => b.textContent === "Erase and begin again") ?? null,
    );
    await r.flush();
    expect(hint(r)?.getAttribute("data-coach")).toBe("observe");
  });
});

describe("the Eclipse intro", () => {
  const seed = { game: { starlight: 5e9, cycleStarlight: 4e10, lifetimeStarlight: 4e10 } };

  it("opens once when 5 shards are pending, and never again", async () => {
    const r = await renderApp({ seed });
    const sheet = r.q("[data-sheet='eclipse-intro']");
    expect(sheet.textContent).toContain("resets your starlight and instruments");
    await r.click(Array.from(sheet.querySelectorAll("button")).at(-1) ?? null);
    expect(r.container.querySelector("[data-sheet='eclipse-intro']")).toBeNull();
    expect(r.harness.session.snapshot().profile.eclipseIntroSeen).toBe(true);
    await goTab(r, "eclipse");
    await goTab(r, "observe");
    expect(r.container.querySelector("[data-sheet='eclipse-intro']")).toBeNull();
    await r.harness.session.flush();
    expect(r.harness.saved().eclipseIntroSeen).toBe(true);
  });

  it("does not open below 5 pending shards or when already seen", async () => {
    const low = await renderApp({ seed: { game: { cycleStarlight: 1e9 } } });
    expect(low.container.querySelector("[data-sheet='eclipse-intro']")).toBeNull();
    const seen = await renderApp({ seed: { ...seed, profile: { eclipseIntroSeen: true } } });
    expect(seen.container.querySelector("[data-sheet='eclipse-intro']")).toBeNull();
  });

  it("waits behind the Welcome Back sheet", async () => {
    const r = await renderApp({
      seed: {
        game: { ...seed.game, owned: { telescope: 10 } },
        profile: { lastSeenMs: START_MS - 2 * 3600 * 1000 },
      },
    });
    expect(r.container.querySelector("[data-sheet='welcome-back']")).not.toBeNull();
    expect(r.container.querySelector("[data-sheet='eclipse-intro']")).toBeNull();
    await r.click(Array.from(r.qa("[data-sheet='welcome-back'] button")).at(-1) ?? null);
    expect(r.container.querySelector("[data-sheet='eclipse-intro']")).not.toBeNull();
  });
});

describe("full first session", () => {
  it("runs from a fresh save to the first chart with the expected feedback and no rejections", async () => {
    const rejections: unknown[] = [];
    const onRejection = (reason: unknown) => void rejections.push(reason);
    process.on("unhandledRejection", onRejection);
    try {
      const r = await renderApp({});
      await gather(r, 5);
      await goTab(r, "build");
      await r.click(r.q("[data-buy='telescope']"));
      await tick(r, 120);
      await r.click(r.q("[data-buy='telescope']"));
      await tick(r, 300);
      await goTab(r, "atlas");
      await r.click(r.q("li[data-constellation='lyre'] .co-card-atlas__action"));
      for (let index = 0; index < 5; index += 1) await r.click(r.q(`[data-star="${index}"]`));

      const profile = r.harness.session.snapshot().profile;
      expect(profile.game.charted).toEqual(["lyre"]);
      expect(profile.tutorial).toMatchObject({
        observe: true,
        build: true,
        atlas: true,
        chart: true,
      });
      expect(r.container.querySelector("[data-coach]")).toBeNull();

      const sounds = r.feedback.sounds;
      expect(sounds.filter((id) => id === "gather")).toHaveLength(5);
      expect(sounds.filter((id) => id === "buy")).toHaveLength(2);
      expect(sounds.filter((id) => id === "star-ok")).toHaveLength(5);
      expect(sounds.filter((id) => id === "chart-done")).toHaveLength(1);
      expect(sounds.filter((id) => id === "star-miss")).toHaveLength(0);
      expect(r.feedback.haptics.filter((kind) => kind === "light")).toHaveLength(2 + 5);
      expect(r.feedback.haptics).toContain("success");
      expect(r.feedback.haptics).not.toContain("warning");
      await r.flush();
      await new Promise((resolve) => setTimeout(resolve, 0));
    } finally {
      process.off("unhandledRejection", onRejection);
    }
    expect(rejections).toEqual([]);
  });
});

describe("count-up", () => {
  it("Welcome Back counts the gained starlight up over frames, and shows it at once when reduced", async () => {
    const seed = {
      game: { owned: { telescope: 10 }, starlight: 0 },
      profile: { lastSeenMs: START_MS - 2 * 3600 * 1000 },
    };
    const uiFrames = fakeFrames();
    const r = await renderApp({ seed, props: { uiFrames } });
    const gained = Number(r.q("[data-gained]").getAttribute("data-gained"));
    expect(gained).toBeGreaterThan(0);
    const shown = () => r.q("[data-gained] [aria-hidden='true']").textContent ?? "";
    expect(shown()).toBe("+0 starlight");
    await act(() => uiFrames.fire(1000));
    await act(() => uiFrames.fire(1450));
    const middle = shown();
    expect(middle).not.toBe("+0 starlight");
    await act(() => uiFrames.fire(2000));
    await act(() => uiFrames.fire(2100));
    expect(r.q("[data-gained] .co-sr-only").textContent).toBe(shown());
    expect(uiFrames.pending).toBe(0);
    await r.unmount();

    const calm = await renderApp({ seed, props: { systemReducedMotion: () => true } });
    expect(calm.q("[data-gained] [aria-hidden='true']").textContent).toBe(
      calm.q("[data-gained] .co-sr-only").textContent,
    );
  });
});
