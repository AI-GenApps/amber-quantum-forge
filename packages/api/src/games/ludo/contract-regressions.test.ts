import { describe, expect, it } from "vitest";
import type {
  LudoEvent,
  LudoMatchState,
  LudoMatchSummary,
  LudoMoveTokenCommand,
} from "./contracts";
import { parseLudoCommand } from "./validation";
import {
  eventFromWire,
  eventToWire,
  fromWireCommand,
  fromWireMatchState,
  matchSummaryFromWire,
  matchSummaryToWire,
  toWireCommand,
  toWireMatchState,
} from "./wire";

const summary: LudoMatchSummary = {
  matchId: "match-1",
  environment: "debug",
  mode: "classic",
  status: "active",
  playerCount: 2,
  seats: 4,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:01.000Z",
};

const matchState: LudoMatchState = {
  matchId: "match-1",
  environment: "debug",
  mode: "quick",
  status: "active",
  players: [
    {
      seat: 0,
      subject: "player-a",
      color: "red",
      tokens: [
        { id: 0, pathPosition: -1 },
        { id: 1, pathPosition: 5 },
        { id: 2, pathPosition: -1 },
        { id: 3, pathPosition: -1 },
      ],
      captureCount: 1,
    },
    {
      seat: 1,
      subject: "player-b",
      color: "yellow",
      tokens: [
        { id: 0, pathPosition: 0 },
        { id: 1, pathPosition: 0 },
        { id: 2, pathPosition: -1 },
        { id: 3, pathPosition: -1 },
      ],
      captureCount: 0,
    },
  ],
  currentPlayerIndex: 1,
  phase: "awaiting_move",
  currentRoll: 6,
  consecutiveSixes: 1,
  winnerOrder: [],
  deadlineAt: "2026-01-01T00:00:30.000Z",
  updatedAt: "2026-01-01T00:00:01.000Z",
};

const events: LudoEvent[] = [
  {
    type: "dice_rolled",
    eventId: "e1",
    matchId: "match-1",
    sequence: 1,
    createdAt: "t",
    seat: 0,
    roll: 6,
  },
  {
    type: "token_moved",
    eventId: "e2",
    matchId: "match-1",
    sequence: 2,
    createdAt: "t",
    seat: 0,
    tokenId: 1,
    fromPathPosition: 0,
    toPathPosition: 6,
  },
  {
    type: "token_captured",
    eventId: "e3",
    matchId: "match-1",
    sequence: 3,
    createdAt: "t",
    seat: 0,
    tokenId: 1,
    capturedSeat: 1,
    capturedTokenId: 0,
  },
  {
    type: "token_finished",
    eventId: "e4",
    matchId: "match-1",
    sequence: 4,
    createdAt: "t",
    seat: 0,
    tokenId: 1,
  },
  {
    type: "turn_forfeited",
    eventId: "e5",
    matchId: "match-1",
    sequence: 5,
    createdAt: "t",
    seat: 1,
    reason: "three_consecutive_sixes",
  },
  {
    type: "match_finished",
    eventId: "e6",
    matchId: "match-1",
    sequence: 6,
    createdAt: "t",
    winnerOrder: [0, 1],
  },
  {
    type: "player_joined",
    eventId: "e7",
    matchId: "match-1",
    sequence: 7,
    createdAt: "t",
    seat: 1,
    subject: "player-b",
  },
  { type: "player_left", eventId: "e8", matchId: "match-1", sequence: 8, createdAt: "t", seat: 1 },
  { type: "bot_filled", eventId: "e9", matchId: "match-1", sequence: 9, createdAt: "t", seat: 1 },
  {
    type: "turn_timed_out",
    eventId: "e10",
    matchId: "match-1",
    sequence: 10,
    createdAt: "t",
    seat: 0,
  },
];

describe("Ludo contract wire round-trips", () => {
  it("round-trips a match summary through JSON parsing", () => {
    const wire = matchSummaryToWire(summary);
    const parsed = JSON.parse(JSON.stringify(wire));
    expect(matchSummaryFromWire(parsed)).toEqual(summary);
  });

  it("round-trips a match state through JSON parsing", () => {
    const wire = toWireMatchState(matchState);
    const parsed = JSON.parse(JSON.stringify(wire));
    expect(fromWireMatchState(parsed)).toEqual(matchState);
  });

  it("round-trips every ludo event kind through JSON parsing", () => {
    for (const event of events) {
      const wire = eventToWire(event);
      const parsed = JSON.parse(JSON.stringify(wire));
      expect(eventFromWire(parsed)).toEqual(event);
    }
  });

  it("round-trips every ludo command kind through JSON parsing", () => {
    const moveToken: LudoMoveTokenCommand = {
      type: "move_token",
      idempotencyKey: "idem-1",
      matchId: "match-1",
      tokenId: 2,
    };
    const commands = [
      { type: "create_match", idempotencyKey: "idem-2", mode: "classic", seats: 4 } as const,
      { type: "join_match", idempotencyKey: "idem-3", matchId: "match-1" } as const,
      { type: "roll_dice", idempotencyKey: "idem-4", matchId: "match-1" } as const,
      moveToken,
      { type: "claim_timeout", idempotencyKey: "idem-5", matchId: "match-1" } as const,
      { type: "surrender", idempotencyKey: "idem-6", matchId: "match-1" } as const,
      { type: "rematch", idempotencyKey: "idem-7", matchId: "match-1" } as const,
    ];
    for (const command of commands) {
      const wire = toWireCommand(command);
      const parsed = JSON.parse(JSON.stringify(wire));
      expect(fromWireCommand(parsed)).toEqual(command);
    }
  });
});

describe("Ludo command validation", () => {
  it("accepts a well-formed create_match command", () => {
    const result = parseLudoCommand({
      type: "create_match",
      idempotency_key: "idem-1",
      mode: "classic",
      seats: 4,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a command missing an idempotency key", () => {
    const result = parseLudoCommand({ type: "roll_dice", match_id: "match-1" });
    expect(result).toEqual({ ok: false, error: "ludo_idempotency_key_invalid" });
  });

  it("rejects create_match with an invalid mode", () => {
    const result = parseLudoCommand({
      type: "create_match",
      idempotency_key: "idem-1",
      mode: "chaos",
      seats: 4,
    });
    expect(result).toEqual({ ok: false, error: "ludo_mode_invalid" });
  });

  it("rejects create_match with an out-of-range seat count", () => {
    const result = parseLudoCommand({
      type: "create_match",
      idempotency_key: "idem-1",
      mode: "classic",
      seats: 6,
    });
    expect(result).toEqual({ ok: false, error: "ludo_seats_invalid" });
  });

  it("rejects move_token with a non-integer token id", () => {
    const result = parseLudoCommand({
      type: "move_token",
      idempotency_key: "idem-1",
      match_id: "match-1",
      token_id: "not-a-number",
    });
    expect(result).toEqual({ ok: false, error: "ludo_token_id_invalid" });
  });

  it("rejects an unknown command type", () => {
    const result = parseLudoCommand({
      type: "teleport",
      idempotency_key: "idem-1",
    });
    expect(result).toEqual({ ok: false, error: "ludo_command_type_unknown" });
  });

  it("rejects a non-object payload", () => {
    const result = parseLudoCommand("not-an-object");
    expect(result).toEqual({ ok: false, error: "ludo_command_must_be_object" });
  });
});
