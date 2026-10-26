import { describe, expect, it } from "vitest";
import {
  artFileLimit,
  BUDGET,
  type BudgetReport,
  formatReport,
  measureBudgets,
  sumBytes,
  violations,
} from "../scripts/budgets";

let report: BudgetReport;

describe("release budgets", () => {
  it("builds the production bundle through the Vite API", async () => {
    report = await measureBudgets();
    expect(report.bundle.files.length).toBeGreaterThan(0);
    expect(report.bundle.rawBytes).toBeGreaterThan(50_000);
  }, 60_000);

  it("keeps the JS bundle at most 300 KB gzip (art, fonts and audio excluded)", () => {
    expect(report.bundle.gzipBytes).toBeGreaterThan(10_000);
    expect(report.bundle.gzipBytes).toBeLessThanOrEqual(BUDGET.jsGzipBytes);
  });

  it("keeps runtime art at most 8 MB, 58 files, every file within its limit", () => {
    expect(report.art).toHaveLength(58);
    expect(sumBytes(report.art)).toBeLessThanOrEqual(BUDGET.artBytes);
    for (const file of report.art) {
      expect(file.bytes, file.path).toBeLessThanOrEqual(BUDGET.artFileBytes);
      expect(file.bytes, file.path).toBeLessThanOrEqual(artFileLimit(file));
    }
  });

  it("keeps pieces at most 60 KB and clients at most 100 KB", () => {
    const pieces = report.art.filter((file) => file.path.startsWith("item-"));
    const clients = report.art.filter((file) => file.path.startsWith("client-"));
    expect(pieces).toHaveLength(46);
    expect(clients).toHaveLength(6);
    for (const file of pieces) expect(file.bytes, file.path).toBeLessThanOrEqual(60_000);
    for (const file of clients) expect(file.bytes, file.path).toBeLessThanOrEqual(100_000);
  });

  it("keeps fonts at most 300 KB and audio at most 2 MB", () => {
    expect(report.fonts).toHaveLength(3);
    expect(sumBytes(report.fonts)).toBeLessThanOrEqual(BUDGET.fontBytes);
    expect(report.audio).toHaveLength(26);
    expect(sumBytes(report.audio)).toBeLessThanOrEqual(BUDGET.audioBytes);
  });

  it("reports no violation and prints a table", () => {
    expect(violations(report)).toEqual([]);
    expect(formatReport(report)).toContain("js gzip");
  });

  it("detects an over-budget report", () => {
    const fat: BudgetReport = {
      ...report,
      bundle: { ...report.bundle, gzipBytes: BUDGET.jsGzipBytes + 1 },
      art: [{ path: "client-1.webp", bytes: 100_001 }],
    };
    expect(violations(fat).map((item) => item.what)).toEqual(["js gzip", "art client-1.webp"]);
  });
});
