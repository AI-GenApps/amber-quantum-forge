import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  CATEGORIES,
  defaultProfile,
  FRAME_IDS,
  type FrameId,
  getChallenge,
} from "@web-games/dress-rehearsal-core";
import { describe, expect, it } from "vitest";
import { frameLayout } from "../src/export/frames";
import { entryExportInput, sessionExportInput, slotsOfLook } from "../src/export/inputs";
import { renderBoard } from "../src/export/render";
import { exportFileName, paintTo, renderToBlob, saveImage, shareImage } from "../src/export/share";
import { EXPORT_SIZE, type ExportInput } from "../src/export/types";
import { FONT_FAMILIES } from "../src/fonts";
import { drawGarment } from "../src/glyphs/draw";
import { Glyph } from "../src/glyphs/Glyph";
import { parsePath } from "../src/glyphs/path";
import { GLYPH_BOUNDS, GLYPH_SHAPES } from "../src/glyphs/shapes";
import { resolveSession } from "../src/state/session";
import { garmentPaint } from "../src/theme/garment";
import { PALETTE } from "../src/theme/tokens";
import { fakeExport, galleryEntry, RecordingContext } from "./helpers";

const GOLDEN = join(import.meta.dirname, "fixtures", "export-calls.json");
const CHALLENGE = getChallenge("riv-01");
const SESSION = resolveSession({ challengeId: "riv-01" }, defaultProfile(), "2026-10-23");
if (!CHALLENGE || !SESSION) throw new Error("fixture challenge missing");

function input(frame: FrameId, over: Partial<ExportInput> = {}): ExportInput {
  return {
    ...sessionExportInput(
      SESSION as NonNullable<typeof SESSION>,
      { look: CHALLENGE?.reference ?? {}, stars: 3, harmony: 84 },
      frame,
    ),
    ...over,
  };
}

const LANDMARKS = new Set(["fillRect", "strokeRect", "fillText", "drawImage"]);

function landmarks(ctx: RecordingContext): unknown[][] {
  return ctx.ops
    .filter((op) => LANDMARKS.has(op.op))
    .map((op) => [
      op.op,
      ...op.args.map((arg) => (typeof arg === "number" ? Math.round(arg) : arg)),
    ]);
}

function record(frame: FrameId, over: Partial<ExportInput> = {}): RecordingContext {
  const ctx = new RecordingContext();
  renderBoard(ctx, input(frame, over));
  return ctx;
}

describe("export draw calls", () => {
  const actual = Object.fromEntries(FRAME_IDS.map((frame) => [frame, landmarks(record(frame))]));

  it("matches the committed call sequence for all four frames", () => {
    if (process.env.UPDATE_EXPORT_CALLS === "1" || !existsSync(GOLDEN)) {
      writeFileSync(GOLDEN, `${JSON.stringify(actual, null, 1)}\n`);
    }
    const expected = JSON.parse(readFileSync(GOLDEN, "utf8")) as Record<string, unknown[][]>;
    for (const frame of FRAME_IDS) expect(actual[frame], frame).toEqual(expected[frame]);
  });

  it("draws the page, the board surface, six piece captions and the footer for a plain frame", () => {
    const calls = actual.plain ?? [];
    expect(calls[0]).toEqual(["fillRect", 0, 0, 1080, 1350, PALETTE.paper]);
    expect(calls[1]).toEqual(["fillRect", 0, 0, 1080, 1170, PALETTE.linen]);
    const texts = calls.filter((call) => call[0] === "fillText").map((call) => call[1]);
    expect(texts).toEqual([
      "Wide-Brim Sun Hat",
      "Cat-Eye Sunglasses",
      "Straw Basket Tote",
      "Breton Stripe Tee",
      "White Rope Espadrilles",
      "Orange Wrap Skirt",
      "Riviera Summer - Harbour Lunch",
      "Chapter 1 - Sun on the Water",
      "Styled for Mireille Vasseur  -  Harmony 84",
      "Dress Rehearsal",
    ]);
  });

  it("gives each frame its own decoration", () => {
    expect(actual.paper?.filter((call) => call[0] === "strokeRect")).toHaveLength(3);
    expect(
      actual.polaroid?.some((call) => call[0] === "fillRect" && call[5] === PALETTE.mist),
    ).toBe(true);
    expect(actual.magazine?.[2]).toEqual(["fillText", "Mireille Vasseur", 540, 120]);
    expect(actual.magazine?.[3]).toEqual(["fillText", "DRESS REHEARSAL", 540, 210]);
    expect(actual.plain?.some((call) => call[0] === "strokeRect")).toBe(false);
  });

  it("uses a different board rectangle per frame, all inside the 1080 x 1350 page", () => {
    const boards = FRAME_IDS.map((frame) => frameLayout(frame, EXPORT_SIZE).board);
    expect(new Set(boards.map((b) => JSON.stringify(b))).size).toBe(4);
    for (const frame of FRAME_IDS) {
      const { board, footer } = frameLayout(frame, EXPORT_SIZE);
      for (const rect of [board, footer]) {
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.w).toBeLessThanOrEqual(1080);
        expect(rect.y + rect.h).toBeLessThanOrEqual(1350);
      }
      expect(board.y + board.h).toBeLessThanOrEqual(footer.y);
    }
  });

  it("balances save and restore and sets only bundled font families", () => {
    for (const frame of FRAME_IDS) {
      const ctx = record(frame);
      expect(ctx.count("save")).toBe(ctx.count("restore"));
      const fonts = ctx.calls("set:font").map((args) => String(args[0]));
      expect(fonts.length).toBeGreaterThan(3);
      for (const font of fonts) {
        expect(
          FONT_FAMILIES.some((family) => font.includes(`"${family}"`)),
          font,
        ).toBe(true);
      }
    }
  });

  it("draws one filled star per star earned, each outlined in ink", () => {
    const fills = (stars: 0 | 1 | 2 | 3): number => {
      const ctx = record("plain", { stars });
      return ctx.ops.filter(
        (op, i) =>
          op.op === "fill" && op.args[0] === PALETTE.star && ctx.ops[i - 1]?.op !== undefined,
      ).length;
    };
    expect([fills(1), fills(2), fills(3)]).toEqual([1, 2, 3]);
  });

  it("draws designer images when they are decoded and skips the accent tint for a backdrop", () => {
    const hat = { id: "hat-image" };
    const backdrop = { id: "backdrop-image" };
    const ctx = record("plain", {
      images: { "item-riviera-7": hat, "backdrop-riviera": backdrop },
    });
    const images = ctx.calls("drawImage");
    expect(images).toHaveLength(2);
    expect(images.map((args) => args[0])).toEqual(expect.arrayContaining([hat, backdrop]));
    const tints = ctx.calls("fillRect").filter((args) => args[4] === "#2b6a9a");
    expect(tints).toHaveLength(0);
  });

  it("cover-fits the 2:3 backdrop inside the board rect without stretching it", () => {
    for (const frame of FRAME_IDS) {
      const backdrop = { id: "backdrop-image" };
      const ctx = record(frame, { images: { "backdrop-riviera": backdrop } });
      const call = ctx.calls("drawImage").find((args) => args[0] === backdrop);
      expect(call, frame).toBeDefined();
      const [, x, y, w, h] = call as [unknown, number, number, number, number];
      expect(w / h, frame).toBeCloseTo(2 / 3, 5);
      const { board } = frameLayout(frame, EXPORT_SIZE);
      expect(w, frame).toBeGreaterThanOrEqual(board.w - 1e-6);
      expect(h, frame).toBeGreaterThanOrEqual(board.h - 1e-6);
      expect(x + w / 2, frame).toBeCloseTo(board.x + board.w / 2, 5);
      expect(y + h / 2, frame).toBeCloseTo(board.y + board.h / 2, 5);
      const names = ctx.ops.map((op) => op.op);
      expect(names.indexOf("clip"), frame).toBeGreaterThan(-1);
      expect(names.indexOf("clip"), frame).toBeLessThan(names.indexOf("drawImage"));
    }
  });

  it("draws dashed outlines for empty slots and shrinks long names to fit", () => {
    const ctx = record("plain", { look: { hat: "item-riviera-7" } });
    const dashes = ctx.calls("setLineDash").map((args) => JSON.stringify(args[0]));
    expect(dashes.filter((d) => d === "[12,10]")).toHaveLength(5);
    const long = record("magazine", {
      clientName: "A client with a very long and winding name indeed",
    });
    const sizes = long
      .calls("set:font")
      .map((args) => Number(/(\d+)px/.exec(String(args[0]))?.[1]));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(16);
  });

  it("builds the daily and gallery inputs", () => {
    const entry = galleryEntry(1, "riv-02");
    const campaign = entryExportInput(entry, "polaroid");
    expect(campaign?.title).toBe("Riviera Summer - Market Morning");
    expect(campaign?.clientName).toBe("Mireille Vasseur");
    expect(campaign?.slots).toHaveLength(6);
    expect(entryExportInput({ ...entry, ref: "nope" }, "plain")).toBeNull();
    const daily = entryExportInput(
      { ...entry, kind: "daily", ref: "2026-10-20", look: { top: "item-riviera-1" } },
      "plain",
    );
    expect(daily).toMatchObject({
      title: "Daily Fitting",
      subtitle: "2026-10-20",
      clientName: null,
      slots: ["top"],
    });
    expect(slotsOfLook({ shoes: "x", hat: "y" })).toEqual(["hat", "shoes"]);
    expect(exportFileName(input("plain"))).toBe("dress-rehearsal-riviera-summer-harbour-lunch.png");
    expect(exportFileName(input("plain", { title: "***" }))).toBe("dress-rehearsal-look.png");
  });
});

describe("garment drawings", () => {
  it("has a parseable drawing for each of the eight categories", () => {
    expect(Object.keys(GLYPH_SHAPES).sort()).toEqual([...CATEGORIES].sort());
    for (const category of CATEGORIES) {
      for (const shape of GLYPH_SHAPES[category]) {
        if (shape.kind === "path") expect(parsePath(shape.d).length).toBeGreaterThan(1);
      }
    }
    expect(() => parsePath("M 1 2 X 3 4")).toThrow(/Unsupported/);
    expect(() => parsePath("M 1")).toThrow(/needs 2 numbers/);
  });

  it("keeps each garment inside the safe area with the planned proportions", () => {
    const planned = {
      top: [80, 70],
      bottom: [55, 88],
      dress: [62, 92],
      outer: [84, 80],
      shoes: [78, 62],
      bag: [60, 62],
      hat: [78, 62],
      accessory: [52, 52],
    } as const;
    for (const category of CATEGORIES) {
      const box = GLYPH_BOUNDS[category];
      const [w, h] = planned[category];
      expect(box.x1 - box.x0, `${category} width`).toBeGreaterThanOrEqual(w - 6);
      expect(box.x1 - box.x0, `${category} width`).toBeLessThanOrEqual(w + 6);
      expect(box.y1 - box.y0, `${category} height`).toBeGreaterThanOrEqual(h - 12);
      expect(box.y1 - box.y0, `${category} height`).toBeLessThanOrEqual(h + 6);
      for (const shape of GLYPH_SHAPES[category]) {
        const numbers =
          shape.kind === "path"
            ? (shape.d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
            : [shape.cx, shape.cy];
        for (const value of numbers) {
          expect(value).toBeGreaterThanOrEqual(2);
          expect(value).toBeLessThanOrEqual(98);
        }
      }
    }
  });

  it("paints the main fill with the piece colour and outlines in ink on a canvas", () => {
    const ctx = new RecordingContext();
    drawGarment(ctx, "top", garmentPaint("sky"), PALETTE.paper, 10, 20, 200);
    expect(ctx.ops[0]?.op).toBe("save");
    expect(ctx.calls("translate")[0]).toEqual([10, 20]);
    expect(ctx.calls("scale")[0]).toEqual([2, 2]);
    expect(ctx.calls("fill")[0]).toEqual([garmentPaint("sky").main]);
    expect(ctx.calls("stroke")[0]?.[0]).toBe(PALETTE.ink);
    expect(ctx.calls("quadraticCurveTo").length).toBeGreaterThan(0);
    expect(typeof Glyph).toBe("function");
  });

  it("thickens outlines with the outline factor", () => {
    const thin = new RecordingContext();
    const thick = new RecordingContext();
    drawGarment(thin, "bag", garmentPaint("tan"), PALETTE.paper, 0, 0, 100, 1);
    drawGarment(thick, "bag", garmentPaint("tan"), PALETTE.paper, 0, 0, 100, 2);
    expect(Number(thick.calls("stroke")[0]?.[1])).toBe(Number(thin.calls("stroke")[0]?.[1]) * 2);
  });
});

describe("export sharing", () => {
  const SUBJECT = input("plain");

  it("renders a PNG blob through a canvas", async () => {
    const fake = fakeExport();
    const blob = await renderToBlob(fake.env, SUBJECT);
    expect(blob?.type).toBe("image/png");
    expect(fake.canvases).toHaveLength(1);
    expect(fake.canvases[0]).toMatchObject({ width: 1080, height: 1350 });
    expect(fake.canvases[0]?.context.count("fillText")).toBe(10);
  });

  it("returns null when canvas is missing, has no context, or throws", async () => {
    const fake = fakeExport();
    expect(await renderToBlob({ ...fake.env, createCanvas: () => null }, SUBJECT)).toBeNull();
    const noContext = {
      ...fake.env,
      createCanvas: () => ({
        width: 1,
        height: 1,
        getContext: () => null,
        toBlob: () => undefined,
      }),
    };
    expect(paintTo(noContext, SUBJECT)).toBeNull();
    const broken = {
      ...fake.env,
      createCanvas: () => {
        throw new Error("no canvas");
      },
    };
    expect(paintTo(broken, SUBJECT)).toBeNull();
    const failing = {
      ...fake.env,
      createCanvas: () => ({
        width: 1,
        height: 1,
        getContext: () => new RecordingContext(),
        toBlob: () => {
          throw new Error("toBlob failed");
        },
      }),
    };
    expect(await renderToBlob(failing, SUBJECT)).toBeNull();
  });

  async function share(mode: "ok" | "abort" | "fail" | "none" | "unsupported", shareOk = true) {
    const fake = fakeExport(mode);
    const sent: unknown[] = [];
    const blob = new Blob(["png"], { type: "image/png" });
    const outcome = await shareImage({
      env: fake.env,
      blob,
      filename: "look.png",
      text: "Look text",
      title: "Dress Rehearsal",
      shareText: async (content) => {
        sent.push(content);
        return { path: "clipboard", ok: shareOk, cancelled: false };
      },
    });
    return { outcome, fake, sent };
  }

  it("shares the file with the text where the browser can", async () => {
    const { outcome, fake, sent } = await share("ok");
    expect(outcome).toBe("shared");
    expect(fake.shares).toHaveLength(1);
    expect(fake.shares[0]?.files?.[0]?.name).toBe("look.png");
    expect(fake.shares[0]?.text).toBe("Look text");
    expect(sent).toEqual([]);
  });

  it("downloads the image and sends the text through the kit share when files cannot be shared", async () => {
    for (const mode of ["none", "unsupported", "fail"] as const) {
      const { outcome, fake, sent } = await share(mode);
      expect(outcome, mode).toBe("downloaded-text");
      expect(fake.downloads, mode).toEqual([{ name: "look.png", size: 3 }]);
      expect(sent, mode).toEqual([{ title: "Dress Rehearsal", text: "Look text" }]);
    }
  });

  it("reports a cancelled file share without downloading", async () => {
    const { outcome, fake, sent } = await share("abort");
    expect(outcome).toBe("cancelled");
    expect(fake.downloads).toEqual([]);
    expect(sent).toEqual([]);
  });

  it("falls back to text only when there is no image, and fails cleanly", async () => {
    const fake = fakeExport("none");
    const base = { env: fake.env, blob: null, filename: "a.png", text: "t", title: "T" };
    expect(
      await shareImage({
        ...base,
        shareText: async () => ({ path: "clipboard", ok: true, cancelled: false }),
      }),
    ).toBe("text-only");
    expect(
      await shareImage({
        ...base,
        shareText: async () => ({ path: "unavailable", ok: false, cancelled: false }),
      }),
    ).toBe("failed");
    expect(
      await shareImage({
        ...base,
        shareText: async () => ({ path: "navigator", ok: false, cancelled: true }),
      }),
    ).toBe("cancelled");
    expect(
      await shareImage({
        ...base,
        shareText: async () => {
          throw new Error("boom");
        },
      }),
    ).toBe("failed");
    const blob = new Blob(["x"]);
    expect(
      await shareImage({
        ...base,
        blob,
        shareText: async () => {
          throw new Error("boom");
        },
      }),
    ).toBe("downloaded");
    expect(
      await shareImage({
        ...base,
        blob,
        shareText: async () => ({ path: "unavailable", ok: false, cancelled: false }),
      }),
    ).toBe("downloaded");
  });

  it("saves a download and handles a missing blob or a failing download", () => {
    const fake = fakeExport();
    expect(saveImage(fake.env, new Blob(["abc"]), "a.png")).toBe(true);
    expect(fake.downloads).toHaveLength(1);
    expect(saveImage(fake.env, null, "a.png")).toBe(false);
    const failing = {
      ...fake.env,
      download: () => {
        throw new Error("blocked");
      },
    };
    expect(saveImage(failing, new Blob(["abc"]), "a.png")).toBe(false);
  });
});
