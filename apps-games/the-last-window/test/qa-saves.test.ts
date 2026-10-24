// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sanitizeProfile } from "@web-games/the-last-window-core";
import { describe, expect, it } from "vitest";
import { buildQaSaves, envelope } from "../scripts/qa-saves";
import { EVIDENCE_DIR } from "./kbDocs";

const DIR = join(EVIDENCE_DIR, "qa-saves");

describe("owner QA save files", () => {
  const saves = buildQaSaves();

  it("builds four saves", () => {
    expect(saves.map((save) => save.file)).toEqual([
      "day10-shopping.json",
      "day13-scene-backlog.json",
      "day14-ready.json",
      "campaign-complete.json",
    ]);
  });

  it("the committed files equal the generator output", () => {
    for (const save of saves) {
      expect(readFileSync(join(DIR, save.file), "utf8"), save.file).toBe(envelope(save.profile));
    }
  });

  it("every save survives the game's own sanitiser unchanged", () => {
    for (const save of saves) {
      const stored = JSON.parse(readFileSync(join(DIR, save.file), "utf8")) as {
        v: number;
        data: unknown;
      };
      expect(stored.v).toBe(1);
      expect(sanitizeProfile(stored.data), save.file).toEqual(
        JSON.parse(JSON.stringify(save.profile)),
      );
    }
  });

  it("the checklist names every save file", () => {
    const checklist = readFileSync(join(EVIDENCE_DIR, "qa-checklist.md"), "utf8");
    for (const save of saves) expect(checklist, save.file).toContain(save.file);
  });
});
