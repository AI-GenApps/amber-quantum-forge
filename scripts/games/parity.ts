import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { readToolchain } from "./toolchain";

const root = resolve(import.meta.dir, "../..");
const packageRoot = join(root, "apps-native/games/packages/merge_rules");
const fixturePath = join(import.meta.dir, "parity_fixture.json");

function run(command: string, args: string[], cwd: string): string {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

function parseState(output: string): unknown {
  const line = output
    .split(/\r?\n/)
    .filter((value) => value.length > 0)
    .at(-1);
  if (!line) throw new Error("Replay runner produced no JSON state");
  return JSON.parse(line) as unknown;
}

function fixtureDefine(json: string): string {
  return `-DREPLAY_FIXTURE_B64=${Buffer.from(json, "utf8").toString("base64")}`;
}

function pinnedBun(): { command: string; version: string } {
  const command = "bun";
  const version = run(command, ["--version"], root);
  const expected = readToolchain().bun;
  if (version !== expected) throw new Error(`Pinned Bun ${expected} is required; found ${version}`);
  return { command, version };
}

function main(): void {
  const bun = pinnedBun();
  const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as {
    readonly seed: number;
    readonly moves: readonly string[];
    readonly expected: unknown;
  };
  const fixtureJson = JSON.stringify({ seed: fixture.seed, moves: fixture.moves });
  const define = fixtureDefine(fixtureJson);
  const vm = parseState(run("dart", ["run", define, "bin/replay_fixture.dart"], packageRoot));
  const outputRoot = mkdtempSync(join(tmpdir(), "gaming-parity-"));
  try {
    const javascript = join(outputRoot, "replay_fixture.js");
    run(
      "dart",
      ["compile", "js", define, "bin/replay_fixture.dart", "-o", javascript],
      packageRoot,
    );
    const js = parseState(run(bun.command, [javascript], packageRoot));
    const variantJson = JSON.stringify({
      seed: 2147483647,
      moves: ["up", "left", "down", "right", "up", "left"],
    });
    const variantDefine = fixtureDefine(variantJson);
    const variantJavascript = join(outputRoot, "replay_fixture_variant.js");
    const variantVm = parseState(
      run("dart", ["run", variantDefine, "bin/replay_fixture.dart"], packageRoot),
    );
    run(
      "dart",
      ["compile", "js", variantDefine, "bin/replay_fixture.dart", "-o", variantJavascript],
      packageRoot,
    );
    const variantJs = parseState(run(bun.command, [variantJavascript], packageRoot));
    const expected = JSON.stringify(fixture.expected);
    if (JSON.stringify(vm) !== JSON.stringify(js))
      throw new Error("Dart VM and compiled JS diverged");
    if (JSON.stringify(vm) !== expected)
      throw new Error("Replay output diverged from checked-in fixture");
    if (JSON.stringify(variantVm) !== JSON.stringify(variantJs))
      throw new Error("Dart VM and compiled JS diverged for variant input");
    if (JSON.stringify(variantVm) === JSON.stringify(vm))
      throw new Error("Replay runner did not consume variant input");
    console.log(`Merge Relay VM/JS replay parity passed via Bun ${bun.version}.`);
  } finally {
    rmSync(outputRoot, { recursive: true, force: true });
  }
}

main();
