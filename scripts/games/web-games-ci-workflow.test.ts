import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./toolchain";

interface Workflow {
  on: Record<string, { branches?: string[]; paths?: string[] }>;
  permissions: Record<string, string>;
  concurrency: { group: string; "cancel-in-progress": boolean };
  jobs: Record<string, { "timeout-minutes"?: number; steps: { uses?: string; run?: string }[] }>;
}

const SLUGS = [
  "lantern-loops",
  "floodplain-dispatch",
  "cloud-observatory",
  "the-last-window",
  "dress-rehearsal",
  "lost-parcel-desk",
];

const raw = readFileSync(join(ROOT, ".github/workflows/web-games-ci.yml"), "utf8");
const workflow = Bun.YAML.parse(raw) as Workflow;
const steps = workflow.jobs.quality?.steps ?? [];
const commands = steps.flatMap((step) => (step.run ? [step.run] : []));

test("the workflow triggers on push to main and pull requests with identical path filters", () => {
  expect(Object.keys(workflow.on).sort()).toEqual(["pull_request", "push"]);
  expect(workflow.on.push?.branches).toEqual(["main"]);
  expect(workflow.on.pull_request?.paths).toEqual(workflow.on.push?.paths);
});

test("path filters cover the kit, every game app and core, the lockfile and the workflow", () => {
  const expected = [
    "apps-games/web-kit/**",
    ...SLUGS.flatMap((slug) => [`apps-games/${slug}/**`, `apps-games/${slug}-core/**`]),
    "bun.lock",
    "package.json",
    ".github/workflows/web-games-ci.yml",
  ];
  expect([...(workflow.on.push?.paths ?? [])].sort()).toEqual([...expected].sort());
});

test("the Bun version is derived from the packageManager field, not hard-coded", () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
    packageManager: string;
  };
  expect(pkg.packageManager).toMatch(/^bun@\d+\.\d+\.\d+$/);
  expect(raw).toContain("packageManager");
  expect(raw).not.toContain(pkg.packageManager.replace("bun@", '"'));
  expect(raw).not.toMatch(/BUN_VERSION/);
});

test("install, typecheck, test and build run in that order through the root scripts", () => {
  const rootScripts = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"))
    .scripts as Record<string, string>;
  expect(commands.slice(-4)).toEqual([
    "bun install --frozen-lockfile",
    "bun run web-games:typecheck",
    "bun run web-games:test",
    "bun run web-games:build",
  ]);
  for (const name of ["typecheck", "test", "build"]) {
    expect(rootScripts[`web-games:${name}`]).toBe(`bun run --filter '@web-games/*' ${name}`);
  }
});

test("least privilege, superseded runs are cancelled and the job has a timeout", () => {
  expect(workflow.permissions).toEqual({ contents: "read" });
  expect(workflow.concurrency["cancel-in-progress"]).toBe(true);
  expect(workflow.concurrency.group).toContain("web-games");
  const timeout = workflow.jobs.quality?.["timeout-minutes"] ?? 0;
  expect(timeout).toBeGreaterThan(0);
  expect(timeout).toBeLessThanOrEqual(30);
});

test("no browser, device or deploy steps run in CI", () => {
  expect(raw).not.toMatch(/playwright|chromium|emulator|gradle|xcodebuild|vercel|secrets\./i);
});
