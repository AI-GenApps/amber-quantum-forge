import { statSync } from "node:fs";
import { join } from "node:path";
import { assertAssetBudget } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import { ART_DIR, PUBLIC, walk } from "./paths";

const entriesOf = (dir: string, extension: string) =>
  walk(dir)
    .filter((file) => file.endsWith(extension))
    .map((file) => ({ path: file, bytes: statSync(file).size }));

describe("asset budgets", () => {
  it("keeps bundled art within 8 MB in all and 600 KB per file", () => {
    const entries = entriesOf(ART_DIR, ".webp");
    const report = assertAssetBudget(entries, { totalBytes: 8_000_000, perFileBytes: 600_000 });
    expect(report.fileCount).toBe(entries.length);
    expect(entries.length).toBeGreaterThan(0);
    expect(walk(ART_DIR)).toHaveLength(entries.length);
  });

  it("still keeps fonts within 400 KB (task 04)", () => {
    const report = assertAssetBudget(entriesOf(join(PUBLIC, "fonts"), ".woff2"), {
      totalBytes: 400_000,
      byExtension: { woff2: 400_000 },
    });
    expect(report.fileCount).toBe(4);
  });

  it("still keeps audio within 2.5 MB (task 05)", () => {
    const report = assertAssetBudget(entriesOf(join(PUBLIC, "audio"), ".mp3"), {
      totalBytes: 2_500_000,
      perFileBytes: 2_000_000,
    });
    expect(report.fileCount).toBe(14);
  });
});
