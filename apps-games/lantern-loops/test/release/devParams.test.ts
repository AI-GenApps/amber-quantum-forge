import { createMemoryAdapter } from "@web-games/kit";
import { MAX_STARS, totalStars } from "@web-games/lantern-loops-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyQaParams,
  parseQaParams,
  profileChange,
  QA_MARKER,
  starsFor,
} from "../../src/qa/devParams";
import { createServices } from "../../src/services";
import { buildChunks } from "./paths";

const NOW = new Date(2026, 9, 23, 12, 0, 0);

describe("parseQaParams", () => {
  it("reads stars, tokens, streak, onboarded and reset", () => {
    expect(parseQaParams("?qa=stars:210,tokens:5,streak:6,onboarded:1,reset:1")).toEqual({
      reset: true,
      stars: 210,
      tokens: 5,
      streak: 6,
      onboarded: true,
    });
  });

  it("clamps to the game limits and ignores junk", () => {
    expect(parseQaParams("?qa=stars:9999,tokens:99,x:1,stars2:3,tokens:abc")).toEqual({
      reset: false,
      stars: MAX_STARS,
      tokens: 20,
    });
    expect(parseQaParams("?other=1")).toEqual({ reset: false });
    expect(parseQaParams("")).toEqual({ reset: false });
    expect(parseQaParams("?qa=onboarded:0").onboarded).toBe(false);
  });
});

describe("starsFor", () => {
  it("totals exactly the requested stars in play order", () => {
    for (const total of [0, 1, 44, 45, 120, 210, 359, 360]) {
      expect(totalStars(starsFor(total)), String(total)).toBe(total);
    }
    expect(starsFor(4)).toEqual({ "harbor-01": 3, "harbor-02": 1 });
  });
});

describe("applyQaParams", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  async function open() {
    const services = createServices({ adapter: createMemoryAdapter(), now: () => NOW });
    await services.start();
    return services;
  }

  it("moves the profile to the requested stars and tokens", async () => {
    const services = await open();
    expect(await applyQaParams(services, "?qa=stars:45,tokens:5,streak:6")).toBe(true);
    const p = services.progression.current();
    expect(totalStars(p.stars)).toBe(45);
    expect(p).toMatchObject({ tokens: 5, streak: 6, bestStreak: 6, lastDailyDate: "2026-10-22" });
    expect(p.chaptersCleared).toEqual([]);
  });

  it("marks chapters cleared when the stars cover them, so no surprise +5 follows", async () => {
    const services = await open();
    await applyQaParams(services, "?qa=stars:210");
    expect(services.progression.current().chaptersCleared).toEqual(["harbor", "garden"]);
  });

  it("does nothing without a qa query", async () => {
    const services = await open();
    expect(await applyQaParams(services, "?foo=bar")).toBe(false);
    expect(services.progression.current().stars).toEqual({});
  });

  it("resets before applying", async () => {
    const services = await open();
    await applyQaParams(services, "?qa=stars:100");
    await applyQaParams(services, "?qa=reset:1,tokens:2");
    const p = services.progression.current();
    expect(p.stars).toEqual({});
    expect(p.tokens).toBe(2);
  });

  it("builds no change for an empty query", () => {
    expect(profileChange(parseQaParams(""), "2026-10-23")).toEqual({});
  });
});

describe("production bundle", () => {
  it("does not contain the dev QA helper", async () => {
    const chunks = await buildChunks("production");
    expect(chunks.length).toBeGreaterThan(0);
    for (const chunk of chunks) {
      expect(chunk.code, chunk.fileName).not.toContain(QA_MARKER);
      expect(chunk.fileName).not.toContain("devParams");
    }
  }, 120000);

  it("does contain it in a development build (so the check can fail)", async () => {
    const chunks = await buildChunks("development");
    expect(chunks.some((chunk) => chunk.code.includes(QA_MARKER))).toBe(true);
  }, 120000);
});
