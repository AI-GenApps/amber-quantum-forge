import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ECLIPSE_SEQUENCE_MS } from "../../src/screens/EclipseSequence";
import { skyCss } from "../../src/ui/styles-sky";
import { cleanup, goTab, type Rendered, renderApp } from "./harness";

interface AnimateCall {
  readonly tag: string;
  readonly keyframes: unknown;
  readonly duration: unknown;
}

let calls: AnimateCall[] = [];
const original = Object.getOwnPropertyDescriptor(Element.prototype, "animate");

beforeEach(() => {
  calls = [];
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    writable: true,
    value(this: Element, keyframes: unknown, options: { duration?: number }) {
      calls.push({
        tag: this.className?.toString() ?? this.tagName,
        keyframes,
        duration: options?.duration,
      });
      return { finished: Promise.resolve(), cancel: () => undefined };
    },
  });
});

afterEach(() => {
  cleanup();
  if (original) Object.defineProperty(Element.prototype, "animate", original);
  else Reflect.deleteProperty(Element.prototype, "animate");
});

const reduced = { systemReducedMotion: () => true };
const rich = {
  game: { starlight: 5e9, cycleStarlight: 4e10, lifetimeStarlight: 4e10, owned: { telescope: 30 } },
  profile: { eclipseIntroSeen: true },
};

async function eclipse(r: Rendered): Promise<void> {
  await goTab(r, "eclipse");
  await r.click(r.q(".co-eclipse-btn"));
  await r.click(r.q(".co-eclipse-confirm"));
}

describe("motion is skipped when reduced", () => {
  it("a purchase does not animate and leaves no inline style", async () => {
    const r = await renderApp({ seed: { game: { starlight: 100 } }, props: reduced });
    await goTab(r, "build");
    await r.click(r.q("[data-buy='telescope']"));
    expect(calls).toEqual([]);
    expect(r.q<HTMLElement>("[data-buy='telescope']").getAttribute("style")).toBeNull();
  });

  it("the Eclipse is a static card with no animation calls", async () => {
    const r = await renderApp({ seed: rich, props: reduced });
    await eclipse(r);
    const card = r.q("[data-sheet='eclipse-sequence']");
    expect(card.getAttribute("data-still")).toBe("true");
    expect(calls).toEqual([]);
    expect(card.getAttribute("style")).toBeNull();
  });

  it("the chart-complete wash and the chapter card do not animate or render", async () => {
    const r = await renderApp({
      seed: { game: { starlight: 100, owned: { telescope: 2 } } },
      props: reduced,
    });
    await goTab(r, "atlas");
    await r.click(r.q("li[data-constellation='lyre'] .co-card-atlas__action"));
    for (let index = 0; index < 5; index += 1) await r.click(r.q(`[data-star="${index}"]`));
    expect(r.container.querySelector("[data-wash]")).toBeNull();
    expect(calls).toEqual([]);
  });

  it("no animation classes appear anywhere", async () => {
    const r = await renderApp({ props: reduced });
    await r.click(r.q(".co-gather"));
    for (const name of ["co-twinkle", "co-pulse", "co-shake", "co-line--new", "co-pop"]) {
      expect(r.container.querySelector(`.${name}`), name).toBeNull();
    }
  });
});

describe("motion plays when allowed", () => {
  it("a purchase swells the bought control", async () => {
    const r = await renderApp({ seed: { game: { starlight: 100 } } });
    await goTab(r, "build");
    await r.click(r.q("[data-buy='telescope']"));
    expect(calls.some((call) => call.tag.includes("co-buy"))).toBe(true);
  });

  it("the Eclipse plays its three beats inside 2.4 seconds", async () => {
    expect(ECLIPSE_SEQUENCE_MS).toBe(2400);
    const r = await renderApp({ seed: rich });
    await eclipse(r);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const durations = calls.map((call) => call.duration);
    expect(durations).toContain(700);
    expect(durations).toContain(1100);
    expect(durations).toContain(600);
    expect(r.q("[data-sheet='eclipse-sequence']").getAttribute("data-still")).toBe("false");
  });

  it("finishing a chart washes the board with gold", async () => {
    const r = await renderApp({ seed: { game: { starlight: 100, owned: { telescope: 2 } } } });
    await goTab(r, "atlas");
    await r.click(r.q("li[data-constellation='lyre'] .co-card-atlas__action"));
    for (let index = 0; index < 5; index += 1) await r.click(r.q(`[data-star="${index}"]`));
    expect(r.container.querySelector("[data-wash='gold']")).not.toBeNull();
    expect(calls.some((call) => call.tag.includes("co-wash-gold"))).toBe(true);
  });

  it("a new chapter card fades in", async () => {
    const r = await renderApp({ seed: { game: { starlight: 100 } } });
    await goTab(r, "build");
    await r.click(r.q("[data-buy='telescope']"));
    expect(r.container.querySelector("[data-sheet='chapter-card']")).not.toBeNull();
    expect(calls.some((call) => call.tag.includes("co-chapter-card"))).toBe(true);
  });
});

describe("motion limits", () => {
  it("the twinkle is slower than 1.5 Hz and the wrong-tap shake swings every 80 ms", () => {
    const twinkle = /\.co-twinkle \{ animation: co-twinkle ([\d.]+)s/.exec(skyCss);
    expect(twinkle).not.toBeNull();
    expect(1 / Number(twinkle?.[1])).toBeLessThanOrEqual(1.5);
    const shake = /\.co-shake \{ animation: co-shake (\d+)ms/.exec(skyCss);
    const swings =
      (/@keyframes co-shake \{([\s\S]*?)\}\s*\}/.exec(skyCss)?.[1] ?? "").match(/\d+%/g) ?? [];
    expect(Number(shake?.[1]) / (swings.length - 1)).toBe(80);
  });
});
