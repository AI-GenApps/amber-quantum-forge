import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const workflow = readFileSync(".github/workflows/deploy-vercel.yml", "utf8");
const lines = workflow.split("\n").filter((line) => !line.trim().startsWith("#"));

test("the Vercel deploy packages the web app that mounts the shared API", () => {
  const web = JSON.parse(readFileSync("apps/web/package.json", "utf8"));
  expect(web.dependencies["@repo/api"]).toBeDefined();
  expect(readFileSync("apps/web/next.config.js", "utf8")).toContain('"@repo/api"');
});

test("deployment secrets are referenced only inside the deploy job", () => {
  const jobsAt = lines.findIndex((line) => line === "jobs:");
  const secretLines = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.includes("secrets."));
  expect(secretLines.length).toBeGreaterThan(0);
  for (const { index } of secretLines) expect(index).toBeGreaterThan(jobsAt);
  expect(lines.some((line) => /^env:/.test(line))).toBe(false);
});

test("no workflow-level or job-level env block can leak deployment secrets", () => {
  expect(lines.some((line) => /^ {2,6}env:/.test(line))).toBe(false);
  expect(workflow).toContain("permissions:\n  contents: read");
});

test("the deploy job is bound to a GitHub environment", () => {
  expect(workflow).toMatch(/environment:\n\s+name:/);
});
