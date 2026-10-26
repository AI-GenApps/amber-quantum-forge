import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { collectContentText, outsideFontSubset } from "@web-games/dress-rehearsal-core";
import { describe, expect, it } from "vitest";
import { strings } from "../src/strings";
import { APP, APP_FILES, CORE_FILES } from "./sources";

describe("source hygiene", () => {
  it("keeps every source file under 800 lines", () => {
    for (const file of [...APP_FILES, ...CORE_FILES]) {
      expect(file.text.split("\n").length, file.file).toBeLessThanOrEqual(800);
    }
  });

  it("avoids any", () => {
    for (const file of APP_FILES) {
      expect(file.text, file.file).not.toMatch(/:\s*any\b|\bas any\b|<any>/);
    }
  });

  it("uses only characters the bundled font subset covers", () => {
    for (const file of APP_FILES) {
      expect(
        outsideFontSubset(file.text).filter((char) => char !== "\n"),
        file.file,
      ).toEqual([]);
    }
    for (const entry of collectContentText()) {
      expect(outsideFontSubset(entry.text), entry.label).toEqual([]);
    }
  });

  it("has English strings with no leftover placeholders", () => {
    for (const key of strings.keys()) {
      const params = (strings.t as (k: string, p?: Record<string, string>) => string)(key, {
        name: "x",
      });
      expect(params.trim().length, key).toBeGreaterThan(0);
      expect(params, key).not.toMatch(/\b(lorem|ipsum|todo|tbd|xxx)\b/i);
    }
    expect(strings.keys().length).toBeGreaterThan(150);
  });

  it("keeps public assets to fonts, audio and designer art", () => {
    const publicDir = join(APP, "public");
    const names = (readdirSync(publicDir, { recursive: true }) as string[]).filter((name) =>
      statSync(join(publicDir, name)).isFile(),
    );
    expect(
      names.every(
        (name) =>
          name.startsWith("fonts/") ||
          name.startsWith("audio/") ||
          /^art\/[a-z0-9-]+\.webp$/.test(name),
      ),
    ).toBe(true);
  });
});
