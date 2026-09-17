import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

test("checked-in Dart VM and compiled JS replay fixture stays in parity", () => {
  const script = resolve(import.meta.dir, "parity.ts");
  const result = spawnSync("bun", [script], {
    cwd: resolve(import.meta.dir, "../.."),
    stdio: "inherit",
  });
  expect(result.status).toBe(0);
});
