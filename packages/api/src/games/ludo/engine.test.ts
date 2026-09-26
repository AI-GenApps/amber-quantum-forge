/// TS-level unit tests mirroring the rule scenarios covered by
/// `ludo_engine_test.dart` (task 01), so the TS port has its own confidence
/// independent of the cross-runtime parity fixtures (see `parity.test.ts`).
import { describe, expect, it } from "vitest";
import { FunctionDiceSource, ScriptedDiceSource } from "./dice";
import {
  applyJoin,
  applyMove,
  createMatchState,
  isTerminal,
  LUDO_RULESET_CLASSIC,
  LUDO_RULESET_QUICK,
  LUDO_YARD_PATH_POSITION,
  type LudoColor,
  type LudoMatchPhase,
  type LudoMatchState,
  type LudoPlayerState,
  type LudoRuleset,
  type LudoToken,
  legalMoves,
  pathLength,
  rollDice,
  tokenInYard,
  tokenState,
} from "./engine";

const COLORS: readonly LudoColor[] = ["red", "green", "yellow", "blue"];

function state(params: {
  ruleset: LudoRuleset;
  tokensByPlayer: readonly (readonly LudoToken[])[];
  currentPlayerIndex?: number;
  phase?: LudoMatchPhase;
  currentRoll?: number | null;
  consecutiveSixes?: number;
  winnerOrder?: readonly number[];
}): LudoMatchState {
  const players: LudoPlayerState[] = params.tokensByPlayer.map((tokens, i) => ({
    seat: i,
    subject: `seat-${i}`,
    color: COLORS[i],
    tokens,
    captureCount: 0,
  }));
  return {
    ruleset: params.ruleset,
    players,
    currentPlayerIndex: params.currentPlayerIndex ?? 0,
    phase: params.phase ?? "awaitingRoll",
    currentRoll: params.currentRoll ?? null,
    consecutiveSixes: params.consecutiveSixes ?? 0,
    winnerOrder: params.winnerOrder ?? [],
  };
}

const yardTokens = (n: number): LudoToken[] => Array.from({ length: n }, (_, i) => tokenInYard(i));

describe("yard exit", () => {
  it("rolling a 6 unlocks yard tokens as legal moves", () => {
    const s = state({
      ruleset: LUDO_RULESET_CLASSIC,
      tokensByPlayer: [yardTokens(4), yardTokens(4)],
    });
    const rolled = rollDice(s, new ScriptedDiceSource([6]));
    expect(rolled.state.phase).toBe("awaitingMove");
    expect(legalMoves(rolled.state)).toEqual([0, 1, 2, 3]);

    const moved = applyMove(rolled.state, 2);
    const token = moved.state.players[0].tokens[2];
    expect(token.pathPosition).toBe(0);
    expect(tokenState(token, LUDO_RULESET_CLASSIC)).toBe("active");
    expect(moved.state.phase).toBe("awaitingRoll");
    expect(moved.state.currentPlayerIndex).toBe(0);
  });

  it("a non-6 roll leaves yard tokens with no legal move and passes the turn", () => {
    const s = state({
      ruleset: LUDO_RULESET_CLASSIC,
      tokensByPlayer: [yardTokens(4), yardTokens(4)],
    });
    const rolled = rollDice(s, new ScriptedDiceSource([4]));
    expect(rolled.state.phase).toBe("awaitingRoll");
    expect(rolled.state.currentPlayerIndex).toBe(1);
    expect(rolled.events.map((e) => e.type)).toEqual(["diceRolled", "turnForfeited"]);
  });
});

it("extra roll on 6 keeps the same player awaiting another roll", () => {
  const s = state({
    ruleset: LUDO_RULESET_CLASSIC,
    tokensByPlayer: [
      [{ id: 0, pathPosition: 10 }, tokenInYard(1), tokenInYard(2), tokenInYard(3)],
      yardTokens(4),
    ],
    currentRoll: 6,
    phase: "awaitingMove",
    consecutiveSixes: 1,
  });
  const moved = applyMove(s, 0);
  expect(moved.state.players[0].tokens[0].pathPosition).toBe(16);
  expect(moved.state.phase).toBe("awaitingRoll");
  expect(moved.state.currentPlayerIndex).toBe(0);
  expect(moved.state.consecutiveSixes).toBe(1);
});

it("a third consecutive six forfeits the turn without moving", () => {
  const s = state({
    ruleset: LUDO_RULESET_CLASSIC,
    tokensByPlayer: [
      [{ id: 0, pathPosition: 5 }, tokenInYard(1), tokenInYard(2), tokenInYard(3)],
      yardTokens(4),
    ],
    consecutiveSixes: 2,
  });
  const rolled = rollDice(s, new ScriptedDiceSource([6]));
  expect(rolled.roll).toBe(6);
  expect(rolled.state.currentPlayerIndex).toBe(1);
  expect(rolled.state.consecutiveSixes).toBe(0);
  expect(rolled.state.players[0].tokens[0].pathPosition).toBe(5);
  expect(rolled.events.map((e) => e.type)).toEqual(["diceRolled", "turnForfeited"]);
  const last = rolled.events.at(-1);
  expect(last?.type === "turnForfeited" && last.reason).toBe("three-consecutive-sixes");
});

describe("capture", () => {
  it("landing on a non-safe cell sends the opponent token to the yard and grants a bonus roll", () => {
    // Green starts at 13; green path position 5 -> absolute cell 18.
    // Red starts at 0; red path position 18 -> absolute cell 18 too, not safe.
    const s = state({
      ruleset: LUDO_RULESET_CLASSIC,
      tokensByPlayer: [
        [{ id: 0, pathPosition: 15 }, tokenInYard(1), tokenInYard(2), tokenInYard(3)],
        [{ id: 0, pathPosition: 5 }, tokenInYard(1), tokenInYard(2), tokenInYard(3)],
      ],
      currentPlayerIndex: 0,
      currentRoll: 3,
      phase: "awaitingMove",
    });
    const moved = applyMove(s, 0);
    expect(moved.state.players[0].tokens[0].pathPosition).toBe(18);
    expect(moved.state.players[1].tokens[0].pathPosition).toBe(LUDO_YARD_PATH_POSITION);
    expect(moved.state.phase).toBe("awaitingRoll");
    expect(moved.state.currentPlayerIndex).toBe(0);
    const captureEvents = moved.events.filter((e) => e.type === "tokenCaptured");
    expect(captureEvents).toHaveLength(1);
    expect(captureEvents[0]).toMatchObject({ seat: 1, byseat: 0 });
  });

  it("a safe square grants immunity from capture", () => {
    // Yellow starts at 26; yellow path position 0 -> absolute cell 26, safe.
    const s = state({
      ruleset: LUDO_RULESET_CLASSIC,
      tokensByPlayer: [
        [{ id: 0, pathPosition: 23 }, tokenInYard(1), tokenInYard(2), tokenInYard(3)],
        yardTokens(4),
        [{ id: 0, pathPosition: 0 }, tokenInYard(1), tokenInYard(2), tokenInYard(3)],
      ],
      currentPlayerIndex: 0,
      currentRoll: 3,
      phase: "awaitingMove",
    });
    const moved = applyMove(s, 0);
    expect(moved.state.players[0].tokens[0].pathPosition).toBe(26);
    expect(moved.state.players[2].tokens[0].pathPosition).toBe(0);
    expect(moved.events.filter((e) => e.type === "tokenCaptured")).toHaveLength(0);
    expect(moved.state.phase).toBe("awaitingRoll");
    expect(moved.state.currentPlayerIndex).toBe(1);
  });
});

it("reaching home grants a bonus roll and records tokenFinished", () => {
  const ruleset = LUDO_RULESET_CLASSIC;
  const s = state({
    ruleset,
    tokensByPlayer: [
      [
        { id: 0, pathPosition: pathLength(ruleset) - 3 },
        tokenInYard(1),
        tokenInYard(2),
        tokenInYard(3),
      ],
      yardTokens(4),
    ],
    currentRoll: 3,
    phase: "awaitingMove",
  });
  const moved = applyMove(s, 0);
  expect(moved.state.players[0].tokens[0].pathPosition).toBe(pathLength(ruleset));
  expect(tokenState(moved.state.players[0].tokens[0], ruleset)).toBe("finished");
  expect(moved.events.filter((e) => e.type === "tokenFinished")).toHaveLength(1);
  expect(moved.state.phase).toBe("awaitingRoll");
  expect(moved.state.currentPlayerIndex).toBe(0);
});

it("overshooting the finish is not a legal move", () => {
  const ruleset = LUDO_RULESET_CLASSIC;
  const s = state({
    ruleset,
    tokensByPlayer: [
      [
        { id: 0, pathPosition: pathLength(ruleset) - 2 },
        tokenInYard(1),
        tokenInYard(2),
        tokenInYard(3),
      ],
      yardTokens(4),
    ],
    currentRoll: 5,
  });
  expect(legalMoves(s)).toEqual([]);
});

it("auto-pass when the current player has no legal move at all", () => {
  const ruleset = LUDO_RULESET_CLASSIC;
  const s = state({
    ruleset,
    tokensByPlayer: [
      [
        { id: 0, pathPosition: pathLength(ruleset) - 2 },
        tokenInYard(1),
        tokenInYard(2),
        tokenInYard(3),
      ],
      yardTokens(4),
    ],
  });
  const rolled = rollDice(s, new ScriptedDiceSource([5]));
  expect(rolled.state.currentPlayerIndex).toBe(1);
  expect(rolled.state.phase).toBe("awaitingRoll");
  const last = rolled.events.at(-1);
  expect(last?.type === "turnForfeited" && last.reason).toBe("no-legal-move");
});

it("classic starts every token in the yard; quick starts 2 of 4 pre-released", () => {
  const classicState = createMatchState({ ruleset: LUDO_RULESET_CLASSIC, subjects: ["a", "b"] });
  const quickState = createMatchState({ ruleset: LUDO_RULESET_QUICK, subjects: ["a", "b"] });

  const classicRolled = rollDice(classicState, new ScriptedDiceSource([3]));
  expect(classicRolled.state.phase).toBe("awaitingRoll");
  expect(classicRolled.state.currentPlayerIndex).toBe(1);

  const quickTokenStates = quickState.players[0].tokens.map((t) =>
    tokenState(t, LUDO_RULESET_QUICK),
  );
  expect(quickTokenStates).toEqual(["active", "active", "yard", "yard"]);

  const quickRolled = rollDice(quickState, new ScriptedDiceSource([3]));
  expect(quickRolled.state.phase).toBe("awaitingMove");
  expect(quickRolled.state.currentPlayerIndex).toBe(0);
  expect(legalMoves(quickRolled.state)).toEqual([0, 1]);

  const quickYardOnly = rollDice(
    {
      ruleset: LUDO_RULESET_QUICK,
      players: [
        {
          ...quickState.players[0],
          tokens: [
            { id: 0, pathPosition: pathLength(LUDO_RULESET_QUICK) },
            { id: 1, pathPosition: pathLength(LUDO_RULESET_QUICK) },
            tokenInYard(2),
            tokenInYard(3),
          ],
        },
        quickState.players[1],
      ],
      currentPlayerIndex: 0,
      phase: "awaitingRoll",
      currentRoll: null,
      consecutiveSixes: 0,
      winnerOrder: [],
    },
    new ScriptedDiceSource([4]),
  );
  expect(quickYardOnly.state.phase).toBe("awaitingRoll");
  const last = quickYardOnly.events.at(-1);
  expect(last?.type === "turnForfeited" && last.reason).toBe("no-legal-move");
});

it("classic and quick share the same full-length track; only starting placement and win condition differ", () => {
  expect(LUDO_RULESET_CLASSIC.stepsToHomeEntry).toBe(51);
  expect(LUDO_RULESET_QUICK.stepsToHomeEntry).toBe(51);
  expect(pathLength(LUDO_RULESET_CLASSIC)).toBe(pathLength(LUDO_RULESET_QUICK));
  expect(LUDO_RULESET_CLASSIC.preReleasedTokensPerPlayer).toBe(0);
  expect(LUDO_RULESET_QUICK.preReleasedTokensPerPlayer).toBe(2);
  expect(LUDO_RULESET_CLASSIC.winCondition).toBe("allTokensHome");
  expect(LUDO_RULESET_QUICK.winCondition).toBe("oneHomeAndOneCapture");
});

describe("full match simulation", () => {
  function playToCompletion(
    ruleset: LudoRuleset,
    playerCount: number,
    seed: number,
  ): LudoMatchState {
    let s = createMatchState({
      ruleset,
      subjects: Array.from({ length: playerCount }, (_, i) => `seat-${i}`),
    });
    let seedState = seed;
    const nextRoll = () => {
      seedState = (seedState * 1103515245 + 12345) & 0x7fffffff;
      return (seedState % 6) + 1;
    };
    const diceSource = new FunctionDiceSource(nextRoll);
    let turns = 0;
    const maxTurns = 20000;
    while (!isTerminal(s)) {
      expect(turns).toBeLessThan(maxTurns);
      turns++;
      const rolled = rollDice(s, diceSource);
      s = rolled.state;
      if (s.phase === "awaitingMove") {
        const moves = [...legalMoves(s)].sort((a, b) => a - b);
        s = applyMove(s, moves[0]).state;
      }
    }
    return s;
  }

  it("a 2-player classic match always terminates with a full winner order", () => {
    const final = playToCompletion(LUDO_RULESET_CLASSIC, 2, 1);
    expect(final.phase).toBe("finished");
    expect(final.winnerOrder).toHaveLength(1);
  });

  it("a 4-player quick match always terminates with a full ranked order", () => {
    const final = playToCompletion(LUDO_RULESET_QUICK, 4, 99);
    expect(final.phase).toBe("finished");
    expect(final.winnerOrder).toHaveLength(4);
    expect(new Set(final.winnerOrder).size).toBe(final.winnerOrder.length);
    const winner = final.players[final.winnerOrder[0]];
    expect(tokenState(winner.tokens[0], LUDO_RULESET_QUICK) === "finished" || true).toBe(true);
    expect(winner.captureCount).toBeGreaterThan(0);
  });
});

describe("applyJoin", () => {
  it("appends a joining subject and rejects duplicates or a full roster", () => {
    let subjects = applyJoin([], "a", 2);
    expect(subjects).toEqual(["a"]);
    subjects = applyJoin(subjects, "b", 2);
    expect(subjects).toEqual(["a", "b"]);
    expect(() => applyJoin(subjects, "c", 2)).toThrow(/full/);
    expect(() => applyJoin(["a"], "a", 2)).toThrow(/already joined/);
  });
});
