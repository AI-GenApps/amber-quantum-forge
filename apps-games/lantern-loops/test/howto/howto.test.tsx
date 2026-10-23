import { afterEach, describe, expect, it } from "vitest";
import { HOWTO_PAGES } from "../../src/app/routes";
import { AUDIO_RECORDS } from "../../src/audio/sources";
import { DIAGRAMS, fixtureSolved } from "../../src/howto/fixtures";
import { HOWTO_COPY, MAX_HOWTO_WORDS, wordCount } from "../../src/howto/pages";
import { FONT_CREDITS, FONT_FACES } from "../../src/theme/fonts";
import {
  byText,
  click,
  createTestEnv,
  flush,
  mountApp,
  removeAnimate,
  type TestEnv,
  type TestEnvOptions,
} from "../helpers/env";

type Mounted = Awaited<ReturnType<typeof mountApp>>;
let mounted: Mounted | null = null;

afterEach(() => {
  mounted?.unmount();
  mounted = null;
  document.body.replaceChildren();
  removeAnimate();
});

async function open(
  route: NonNullable<TestEnvOptions["route"]>,
  fixture: "fresh" | "mid" = "mid",
): Promise<{ app: Mounted; test: TestEnv }> {
  const test = await createTestEnv({ route, fixture });
  const app = await mountApp(test.env);
  mounted = app;
  await flush(8);
  return { app, test };
}

const text = (root: ParentNode, selector: string): string =>
  root.querySelector(selector)?.textContent ?? "";

describe("how-to copy", () => {
  it("has exactly six pages in the planned order", () => {
    expect(HOWTO_PAGES).toEqual(["basics", "stones", "mirrors", "gates", "daily", "hints"]);
    expect(Object.keys(HOWTO_COPY)).toEqual([...HOWTO_PAGES]);
    expect(Object.keys(DIAGRAMS)).toEqual([...HOWTO_PAGES]);
  });

  it("keeps every page body under 60 words", () => {
    for (const page of HOWTO_PAGES) {
      const copy = HOWTO_COPY[page];
      const words = wordCount(copy.body());
      expect(words, page).toBeGreaterThan(8);
      expect(words, page).toBeLessThanOrEqual(MAX_HOWTO_WORDS);
      expect(copy.title().length, page).toBeGreaterThan(2);
      expect(copy.diagram().length, page).toBeGreaterThan(10);
    }
  });

  it("counts words the way the limit means it", () => {
    expect(wordCount("  one two\nthree ")).toBe(3);
    expect(wordCount("")).toBe(0);
  });

  it("draws every diagram from a solved fixture", () => {
    for (const page of HOWTO_PAGES) expect(fixtureSolved(DIAGRAMS[page]), page).toBe(true);
  });
});

describe("how-to screen", () => {
  it("renders a diagram built from the board cells on every page", async () => {
    const { app } = await open({ name: "howto", params: { page: "basics" } });
    for (const page of HOWTO_PAGES) {
      const figure = app.container.querySelector(`figure[data-diagram='${page}']`);
      expect(figure, page).not.toBeNull();
      expect(figure?.querySelectorAll("[data-cell]")).toHaveLength(9);
      expect(figure?.querySelector("svg[role='img']")?.getAttribute("aria-label")).toBe(
        HOWTO_COPY[page].diagram(),
      );
      expect(text(app.container, ".ll-body")).toBe(HOWTO_COPY[page].body());
      if (page !== "hints") await click(byText(app.container, "button", "Next"));
    }
  });

  it("shows the matching clue on each page", async () => {
    const wanted: Record<string, string> = {
      basics: ".ll-lantern",
      stones: ".ll-stone[data-stone='4']",
      mirrors: ".ll-mirror",
      gates: ".ll-gate[data-colour='rose']",
      daily: "[data-testid='week-dots']",
      hints: ".ll-hinted",
    };
    for (const page of HOWTO_PAGES) {
      const { app } = await open({ name: "howto", params: { page } });
      expect(app.container.querySelector(`figure ${wanted[page]}`), page).not.toBeNull();
      app.unmount();
      mounted = null;
      document.body.replaceChildren();
    }
  });

  it("draws a week of seven dots with five marked on the daily page", async () => {
    const { app } = await open({ name: "howto", params: { page: "daily" } });
    expect(app.container.querySelectorAll("[data-testid='week-dots'] circle")).toHaveLength(7);
    expect(app.container.querySelectorAll("circle[data-on='true']")).toHaveLength(5);
  });

  it("moves between the pages and disables the ends", async () => {
    const { app } = await open({ name: "howto", params: { page: "basics" } });
    const prev = () => byText(app.container, "button", "Previous") as HTMLButtonElement;
    const next = () => byText(app.container, "button", "Next") as HTMLButtonElement;
    expect(prev().disabled).toBe(true);
    for (let n = 1; n < 6; n++) {
      expect(text(app.container, "[data-testid='howto-position']")).toBe(`Page ${n} of 6`);
      await click(next());
    }
    expect(text(app.container, "[data-testid='howto-position']")).toBe("Page 6 of 6");
    expect(next().disabled).toBe(true);
    await click(prev());
    expect(app.container.querySelector("[data-page='daily']")).not.toBeNull();
  });

  it("opens at the requested page", async () => {
    const { app } = await open({ name: "howto", params: { page: "gates" } });
    expect(app.container.querySelector("[data-page='gates']")).not.toBeNull();
    expect(text(app.container, "[data-testid='howto-position']")).toBe("Page 4 of 6");
  });

  it("is reachable from Home and from the pause sheet", async () => {
    const home = await open({ name: "home" });
    await click(byText(home.app.container, "button", "How to play"));
    expect(home.test.router.current).toEqual({ name: "howto", params: { page: "basics" } });
    home.app.unmount();
    mounted = null;
    document.body.replaceChildren();
    const play = await open({ name: "puzzle", params: { id: "harbor-01" } });
    await click(play.app.container.querySelector("[aria-label='Pause']"));
    await click(byText(play.app.container, "button", "How to play"));
    expect(play.test.router.current.name).toBe("howto");
  });
});

describe("about screen", () => {
  it("lists every font and every audio source from the manifests", async () => {
    const { app } = await open({ name: "about" });
    const fonts = text(app.container, "[data-testid='font-credits']");
    for (const credit of FONT_CREDITS) {
      expect(fonts).toContain(credit.family);
      expect(fonts).toContain(credit.url);
      expect(fonts).toContain("SIL Open Font License 1.1");
    }
    expect(FONT_CREDITS.map((credit) => credit.family).sort()).toEqual(
      FONT_FACES.map((face) => face.family).sort(),
    );
    const audio = text(app.container, "[data-testid='audio-credits']");
    for (const record of AUDIO_RECORDS) {
      expect(audio, record.id).toContain(record.packUrl);
      expect(audio, record.id).toContain(record.id);
      expect(audio, record.id).toContain("CC0");
    }
  });
});
