export interface AssetEntry {
  path: string;
  bytes: number;
}

export interface AssetBudget {
  /** Maximum total bytes across all entries. */
  totalBytes?: number;
  /** Maximum bytes for any single file. */
  perFileBytes?: number;
  maxFiles?: number;
  /** Per-extension totals, keyed by lowercase extension without the dot ("png", "woff2"). */
  byExtension?: Readonly<Record<string, number>>;
}

export interface BudgetViolation {
  kind: "total" | "file" | "count" | "extension";
  message: string;
  path?: string;
  actual: number;
  limit: number;
}

export interface BudgetReport {
  ok: boolean;
  totalBytes: number;
  fileCount: number;
  byExtension: Record<string, number>;
  violations: BudgetViolation[];
}

export function extensionOf(path: string): string {
  const name = path.slice(path.lastIndexOf("/") + 1);
  const dot = name.lastIndexOf(".");
  return dot <= 0 ? "" : name.slice(dot + 1).toLowerCase();
}

/** Pure check of asset sizes against a budget; feed it file stats from a Node test. */
export function checkAssetBudget(
  entries: readonly AssetEntry[],
  budget: AssetBudget,
): BudgetReport {
  const violations: BudgetViolation[] = [];
  const byExtension: Record<string, number> = {};
  let totalBytes = 0;
  for (const entry of entries) {
    totalBytes += entry.bytes;
    const ext = extensionOf(entry.path);
    byExtension[ext] = (byExtension[ext] ?? 0) + entry.bytes;
    if (budget.perFileBytes !== undefined && entry.bytes > budget.perFileBytes) {
      violations.push({
        kind: "file",
        path: entry.path,
        actual: entry.bytes,
        limit: budget.perFileBytes,
        message: `${entry.path} is ${entry.bytes} bytes (limit ${budget.perFileBytes})`,
      });
    }
  }
  if (budget.totalBytes !== undefined && totalBytes > budget.totalBytes) {
    violations.push({
      kind: "total",
      actual: totalBytes,
      limit: budget.totalBytes,
      message: `total ${totalBytes} bytes (limit ${budget.totalBytes})`,
    });
  }
  if (budget.maxFiles !== undefined && entries.length > budget.maxFiles) {
    violations.push({
      kind: "count",
      actual: entries.length,
      limit: budget.maxFiles,
      message: `${entries.length} files (limit ${budget.maxFiles})`,
    });
  }
  for (const [ext, limit] of Object.entries(budget.byExtension ?? {})) {
    const actual = byExtension[ext] ?? 0;
    if (actual > limit) {
      violations.push({
        kind: "extension",
        actual,
        limit,
        message: `.${ext} files total ${actual} bytes (limit ${limit})`,
      });
    }
  }
  return {
    ok: violations.length === 0,
    totalBytes,
    fileCount: entries.length,
    byExtension,
    violations,
  };
}

/** Throws with every violation listed; handy as a one-line assertion in a game's asset test. */
export function assertAssetBudget(
  entries: readonly AssetEntry[],
  budget: AssetBudget,
): BudgetReport {
  const report = checkAssetBudget(entries, budget);
  if (!report.ok) {
    throw new Error(
      `Asset budget exceeded:\n${report.violations.map((v) => `- ${v.message}`).join("\n")}`,
    );
  }
  return report;
}
