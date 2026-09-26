/// Loads every checked-in `ludo_rules` fixture (task 02) and asserts that
/// replaying its recorded event log through this package's TS engine
/// reproduces the Dart-recorded final state exactly — the Bun-test-level half
/// of task 17's cross-runtime parity mechanism (the script-level half is
/// `scripts/games/ludo-parity.ts`, run via `bun run games:ludo:parity`).
///
/// Mirrors `ludo_fixture_replay_test.dart`'s structure/assertions, but drives
/// the TS engine's pure functions instead of Dart's `replay()`.
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  eventFromJson,
  LUDO_COLOR_ORDER,
  type LudoPlayerState,
  type LudoReplayEvent,
  matchStateToJson,
  playerToJson,
  replay,
  rulesetFromJson,
  tokenInYard,
  tokenOnTrack,
} from "./engine";

const fixturesDir = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../../../apps-native/games/packages/ludo_rules/test/fixtures",
);

interface LudoFixture {
  readonly ruleset: string;
  readonly subjects: readonly string[];
  readonly events: readonly Record<string, unknown>[];
  readonly final_state: Record<string, unknown>;
}

const fixtureFiles = readdirSync(fixturesDir)
  .filter((name) => name.endsWith(".json"))
  .sort();

describe("ludo TS engine vs. Dart ludo_rules fixtures", () => {
  it("at least 8 fixtures are checked in", () => {
    expect(fixtureFiles.length).toBeGreaterThanOrEqual(8);
  });

  for (const file of fixtureFiles) {
    it(`${file} replays to its recorded final state via the TS engine`, () => {
      const fixture = JSON.parse(readFileSync(join(fixturesDir, file), "utf8")) as LudoFixture;

      const ruleset = rulesetFromJson({ id: fixture.ruleset });
      const subjects = fixture.subjects;

      // Mirrors `LudoMatchState.initial`'s starting placement, since the
      // fixture's recorded event log assumes the match began that way.
      const initialPlayers: LudoPlayerState[] = subjects.map((subject, seat) => ({
        seat,
        subject,
        color: LUDO_COLOR_ORDER[seat],
        captureCount: 0,
        tokens: Array.from({ length: ruleset.tokensPerPlayer }, (_, id) => {
          if (!ruleset.requiresYardExitRoll) return tokenOnTrack(id);
          return id < ruleset.preReleasedTokensPerPlayer ? tokenOnTrack(id) : tokenInYard(id);
        }),
      }));

      const events: LudoReplayEvent[] = fixture.events.map(eventFromJson);

      const replayed = replay(events, { ruleset, initialPlayers });

      expect(matchStateToJson(replayed)).toEqual(fixture.final_state);
    });
  }
});

// Exercise the pure per-player serializer too, since `matchStateToJson`
// already covers it via `matchStateToJson`'s output above but this keeps a
// direct unit-level check of the byte-identical shape independent of replay.
describe("playerToJson matches the fixture player shape", () => {
  it("omits capture_count for a Classic-shaped player by default", () => {
    const player: LudoPlayerState = {
      seat: 0,
      subject: "seat-0",
      color: "red",
      captureCount: 0,
      tokens: [tokenInYard(0)],
    };
    expect(playerToJson(player, { includeCaptureCount: false })).not.toHaveProperty(
      "capture_count",
    );
    expect(playerToJson(player, { includeCaptureCount: true })).toHaveProperty("capture_count", 0);
  });
});
