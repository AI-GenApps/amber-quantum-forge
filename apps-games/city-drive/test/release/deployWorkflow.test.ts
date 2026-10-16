// @vitest-environment node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const FILE = join(import.meta.dirname, "../../../../.github/workflows/deploy-city-drive-web.yml");
const SOURCE = readFileSync(FILE, "utf8");

type Step = { name?: string; uses?: string; run?: string; with?: Record<string, string> };
type Workflow = {
  name: string;
  on: Record<string, unknown>;
  jobs: Record<string, { env: Record<string, string>; steps: Step[] }>;
};

function parse(): Workflow {
  const result = spawnSync(
    "bun",
    ["-e", "console.log(JSON.stringify(Bun.YAML.parse(await Bun.stdin.text())))"],
    {
      input: SOURCE,
      encoding: "utf8",
    },
  );
  if (result.status !== 0) throw new Error(`workflow is not valid YAML: ${result.stderr}`);
  return JSON.parse(result.stdout) as Workflow;
}

describe("deploy-city-drive-web.yml", () => {
  const workflow = parse();
  const job = workflow.jobs.deploy;
  const steps = job?.steps ?? [];

  it("is valid YAML with one deploy job", () => {
    expect(Object.keys(workflow.jobs)).toEqual(["deploy"]);
  });

  it("runs on workflow_dispatch only", () => {
    expect(Object.keys(workflow.on)).toEqual(["workflow_dispatch"]);
  });

  it("fails fast, before checkout, when the project id is missing", () => {
    const first = steps[0];
    expect(first?.run).toContain('[ -z "$CITY_DRIVE_VERCEL_PROJECT_ID" ]');
    expect(first?.run).toContain("::error");
    expect(first?.run).toContain('exit "$missing"');
    expect(steps.findIndex((s) => s.uses?.startsWith("actions/checkout"))).toBeGreaterThan(0);
  });

  it("reads the project id from the repository secret or variable", () => {
    expect(job?.env.CITY_DRIVE_VERCEL_PROJECT_ID).toBe(
      "$" + "{{ secrets.CITY_DRIVE_VERCEL_PROJECT_ID || vars.CITY_DRIVE_VERCEL_PROJECT_ID }}",
    );
  });

  it("deploys with the shared W3Dev action to that project, not the main app's project", () => {
    const deploy = steps.find((s) => s.uses?.startsWith("W3Dev/vercel-deploy@"));
    expect(deploy?.with?.vercel_project_id).toBe("$" + "{{ env.CITY_DRIVE_VERCEL_PROJECT_ID }}");
    expect(SOURCE).not.toContain("prj_");
  });

  it("builds the game before it deploys", () => {
    const runs = steps.map((s) => s.run ?? "");
    const build = runs.findIndex((r) => r.includes("bun run city-drive:build"));
    const deploy = steps.findIndex((s) => s.uses?.startsWith("W3Dev/vercel-deploy@"));
    expect(build).toBeGreaterThan(0);
    expect(deploy).toBeGreaterThan(build);
    expect(runs.some((r) => r.includes("bun install --frozen-lockfile"))).toBe(true);
  });

  it("never calls the Vercel CLI directly", () => {
    for (const step of steps)
      expect(step.run ?? "").not.toMatch(/(^|[;&|]\s*)(vercel|(bunx|npx|bun x)\s+vercel)\b/m);
  });
});
