// Three-way Ludo cross-runtime parity: Dart VM, compiled Dart->JS, and the
// TS authority engine (`packages/api/src/games/ludo/engine.ts`) must all
// agree on the same fixture's output.
//
// Mirrors `parity.ts` (Merge Relay's VM-vs-compiled-JS self-consistency
// check), but adds a third leg task 17 needed that didn't exist before this
// task: the TS engine's pure-function output for the same fixture. This is
// `bun run games:ludo:parity`'s dedicated script (a new invocation name, not
// a generalization of `parity.ts`, since Ludo's fixture shape — seed +
// ruleset + player count, replayed by the engine itself rather than a fixed
// move list — differs from Merge Relay's).
//
// Dart's `bin/parity_runner.dart` (in `ludo_rules`) is the entrypoint run
// both ways: under `dart run` (the VM) and compiled with `dart compile js`
// (run under the pinned Bun). It reads its fixture from a
// `-D REPLAY_FIXTURE_B64=<base64 json>` compile-time define rather than
// `dart:io` (see that file's doc comment for why: `dart:io` throws
// `Unsupported operation` once compiled to JS).
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  eventFromJson,
  LUDO_COLOR_ORDER,
  type LudoPlayerState,
  type LudoReplayEvent,
  matchStateToJson,
  replay,
  rulesetFromJson,
  tokenInYard,
  tokenOnTrack,
} from "../../packages/api/src/games/ludo/engine";
import { readToolchain } from "./toolchain";

const root = resolve(import.meta.dir, "../..");
const packageRoot = join(root, "apps-native/games/packages/ludo_rules");

interface LudoParityFixture {
  readonly ruleset: "classic" | "quick";
  readonly seed: number;
  readonly player_count: number;
  readonly subjects: readonly string[];
  readonly bot: "easy" | "medium" | "hard" | null;
}

// A dice-only, no-bot fixture proves the plain engine path; a bot fixture
// (run separately below) additionally proves the compiled runner's bot
// selection is byte-identical, which the Dart-only VM/JS comparison alone
// cannot show is wired the same way the TS side expects (the TS engine
// never runs bot logic itself — see below).
const DICE_FIXTURE: LudoParityFixture = {
  ruleset: "classic",
  seed: 1,
  player_count: 2,
  subjects: ["seat-0", "seat-1"],
  bot: null,
};

const BOT_FIXTURE: LudoParityFixture = {
  ruleset: "quick",
  seed: 7,
  player_count: 3,
  subjects: ["seat-0", "seat-1", "seat-2"],
  bot: "medium",
};

function run(command: string, args: string[], cwd: string): string {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

function parseOutput(output: string): { events: unknown[]; final_state: Record<string, unknown> } {
  const line = output
    .split(/\r?\n/)
    .filter((value) => value.length > 0)
    .at(-1);
  if (!line) throw new Error("Dart runner produced no JSON output");
  return JSON.parse(line) as { events: unknown[]; final_state: Record<string, unknown> };
}

function fixtureDefine(fixture: LudoParityFixture): string {
  return `-DREPLAY_FIXTURE_B64=${Buffer.from(JSON.stringify(fixture), "utf8").toString("base64")}`;
}

function pinnedBun(): { command: string; version: string } {
  const command = "bun";
  const version = run(command, ["--version"], root);
  const expected = readToolchain().bun;
  if (version !== expected) throw new Error(`Pinned Bun ${expected} is required; found ${version}`);
  return { command, version };
}

/** Runs the TS engine's pure functions over the same fixture's Dart-VM-recorded event log. */
function tsEngineOutput(
  fixture: LudoParityFixture,
  dartOutput: { events: unknown[]; final_state: Record<string, unknown> },
): Record<string, unknown> {
  const ruleset = rulesetFromJson({ id: fixture.ruleset });
  const initialPlayers: LudoPlayerState[] = fixture.subjects.map((subject, seat) => ({
    seat,
    subject,
    color: LUDO_COLOR_ORDER[seat],
    captureCount: 0,
    tokens: Array.from({ length: ruleset.tokensPerPlayer }, (_, id) => {
      if (!ruleset.requiresYardExitRoll) return tokenOnTrack(id);
      return id < ruleset.preReleasedTokensPerPlayer ? tokenOnTrack(id) : tokenInYard(id);
    }),
  }));
  const events: LudoReplayEvent[] = (dartOutput.events as Record<string, unknown>[]).map(
    eventFromJson,
  );
  const replayed = replay(events, { ruleset, initialPlayers });
  return matchStateToJson(replayed);
}

function checkFixture(
  label: string,
  fixture: LudoParityFixture,
  outputRoot: string,
  bun: { command: string; version: string },
): void {
  const define = fixtureDefine(fixture);
  const vmOutput = parseOutput(run("dart", ["run", define, "bin/parity_runner.dart"], packageRoot));

  const javascript = join(outputRoot, `parity_runner_${label}.js`);
  run("dart", ["compile", "js", define, "bin/parity_runner.dart", "-o", javascript], packageRoot);
  const jsOutput = parseOutput(run(bun.command, [javascript], packageRoot));

  if (JSON.stringify(vmOutput) !== JSON.stringify(jsOutput)) {
    throw new Error(`[${label}] Dart VM and compiled JS diverged`);
  }

  const tsState = tsEngineOutput(fixture, vmOutput);
  if (JSON.stringify(tsState) !== JSON.stringify(vmOutput.final_state)) {
    throw new Error(
      `[${label}] TS engine diverged from Dart VM/compiled-JS final state:\n` +
        `  dart:  ${JSON.stringify(vmOutput.final_state)}\n` +
        `  ts:    ${JSON.stringify(tsState)}`,
    );
  }

  console.log(`[${label}] Dart VM, compiled Dart->JS and the TS engine agree.`);
}

function main(): void {
  const bun = pinnedBun();
  const outputRoot = mkdtempSync(join(tmpdir(), "ludo-parity-"));
  try {
    checkFixture("classic-dice", DICE_FIXTURE, outputRoot, bun);
    checkFixture("quick-bot", BOT_FIXTURE, outputRoot, bun);
    console.log(
      `Ludo three-way (Dart VM / compiled JS / TS) parity passed via Bun ${bun.version}.`,
    );
  } finally {
    rmSync(outputRoot, { recursive: true, force: true });
  }
}

main();
