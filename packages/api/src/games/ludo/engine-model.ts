/// Board geometry, ruleset config, match-state models, and replay-event
/// (de)serialization for the TS port of the `ludo_rules` Dart engine.
///
/// Split out of `engine.ts` (which holds the pure gameplay functions) purely
/// to keep individual files under the repo's max-lines limit; together the
/// two files are the single TS authority engine described in task 17. See
/// `engine.ts`'s file header for the full provenance/parity notes — they
/// apply equally to everything in this file.

// ---------------------------------------------------------------------------
// Board geometry (`ludo_board.dart`) — frozen, shared by every ruleset.
// ---------------------------------------------------------------------------

/** Number of squares on the shared track every match plays on. */
export const LUDO_TRACK_LENGTH = 52;

export type LudoColor = "red" | "green" | "yellow" | "blue";

/** Fixed seat -> color assignment, in enum order (mirrors `LudoColor.values`). */
export const LUDO_COLOR_ORDER: readonly LudoColor[] = ["red", "green", "yellow", "blue"];

const START_INDEX_BY_COLOR: Record<LudoColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

const STAR_OFFSET_FROM_START = 8;

export function startIndexOf(color: LudoColor): number {
  return START_INDEX_BY_COLOR[color];
}

/** The absolute track cell (`0..51`) a token of `color` occupies at `pathPosition`. */
export function absoluteCellOf(color: LudoColor, pathPosition: number): number {
  if (pathPosition < 0) {
    throw new RangeError(`pathPosition must be >= 0, got ${pathPosition}`);
  }
  return (startIndexOf(color) + pathPosition) % LUDO_TRACK_LENGTH;
}

/** Whether absolute track `cell` is a safe square (a start or star square). */
export function isSafeCell(cell: number): boolean {
  for (const start of Object.values(START_INDEX_BY_COLOR)) {
    const starCell = (start + STAR_OFFSET_FROM_START) % LUDO_TRACK_LENGTH;
    if (cell === start || cell === starCell) return true;
  }
  return false;
}

export function isOnSharedTrack(ruleset: LudoRuleset, pathPosition: number): boolean {
  return pathPosition >= 0 && pathPosition < ruleset.stepsToHomeEntry;
}

/** All safe absolute cells, sorted, for tests/inspection. */
export const LUDO_SAFE_CELLS: readonly number[] = (() => {
  const cells = new Set<number>();
  for (const start of Object.values(START_INDEX_BY_COLOR)) {
    cells.add(start);
    cells.add((start + STAR_OFFSET_FROM_START) % LUDO_TRACK_LENGTH);
  }
  return [...cells].sort((a, b) => a - b);
})();

// ---------------------------------------------------------------------------
// Ruleset config (`ludo_config.dart`) — the numeric rules that vary between
// Classic and Quick mode.
// ---------------------------------------------------------------------------

export const LUDO_CONFIG_SCHEMA_VERSION = 1;

/** Version tag for the rules implemented here; must track `ludoRulesVersion`. */
export const LUDO_RULES_VERSION = "LUDO-2";

export type LudoWinCondition = "allTokensHome" | "oneHomeAndOneCapture";

export interface LudoRuleset {
  readonly id: "classic" | "quick";
  readonly tokensPerPlayer: number;
  readonly stepsToHomeEntry: number;
  readonly homeLength: number;
  readonly requiresYardExitRoll: boolean;
  readonly preReleasedTokensPerPlayer: number;
  readonly winCondition: LudoWinCondition;
  readonly rulesVersion: string;
  readonly schemaVersion: number;
}

function pathLengthOf(ruleset: LudoRuleset): number {
  return ruleset.stepsToHomeEntry + ruleset.homeLength;
}

export { pathLengthOf as pathLength };

export const LUDO_RULESET_CLASSIC: LudoRuleset = Object.freeze({
  id: "classic",
  tokensPerPlayer: 4,
  stepsToHomeEntry: 51,
  homeLength: 6,
  requiresYardExitRoll: true,
  preReleasedTokensPerPlayer: 0,
  winCondition: "allTokensHome",
  // Classic's own replay semantics did not change in task 12g (only Quick's
  // did); kept pinned at the pre-12g version. See `ludo_config.dart`.
  rulesVersion: "LUDO-1",
  schemaVersion: LUDO_CONFIG_SCHEMA_VERSION,
});

export const LUDO_RULESET_QUICK: LudoRuleset = Object.freeze({
  id: "quick",
  tokensPerPlayer: 4,
  stepsToHomeEntry: 51,
  homeLength: 6,
  requiresYardExitRoll: true,
  preReleasedTokensPerPlayer: 2,
  winCondition: "oneHomeAndOneCapture",
  rulesVersion: LUDO_RULES_VERSION,
  schemaVersion: LUDO_CONFIG_SCHEMA_VERSION,
});

export const LUDO_RULESETS_BY_ID: Readonly<Record<string, LudoRuleset>> = {
  classic: LUDO_RULESET_CLASSIC,
  quick: LUDO_RULESET_QUICK,
};

/**
 * `pre_released_tokens_per_player` and `win_condition` are only serialized
 * when they differ from Classic's pre-12g implicit values, matching
 * `LudoRuleset.toJson` in `ludo_config.dart` byte-for-byte (see that
 * function's doc comment for why).
 */
export function rulesetToJson(ruleset: LudoRuleset): Record<string, unknown> {
  const json: Record<string, unknown> = {
    id: ruleset.id,
    tokens_per_player: ruleset.tokensPerPlayer,
    steps_to_home_entry: ruleset.stepsToHomeEntry,
    home_length: ruleset.homeLength,
    requires_yard_exit_roll: ruleset.requiresYardExitRoll,
  };
  if (ruleset.preReleasedTokensPerPlayer !== 0) {
    json.pre_released_tokens_per_player = ruleset.preReleasedTokensPerPlayer;
  }
  if (ruleset.winCondition !== "allTokensHome") {
    json.win_condition = ruleset.winCondition;
  }
  json.rules_version = ruleset.rulesVersion;
  json.schema_version = ruleset.schemaVersion;
  return json;
}

export function rulesetFromJson(json: Record<string, unknown>): LudoRuleset {
  const id = json.id;
  const ruleset = typeof id === "string" ? LUDO_RULESETS_BY_ID[id] : undefined;
  if (!ruleset) throw new Error(`Unknown ludo ruleset id: ${String(id)}`);
  return ruleset;
}

// ---------------------------------------------------------------------------
// Match state models (`ludo_models.dart`).
// ---------------------------------------------------------------------------

/** Sentinel marking a token that has not yet entered play. */
export const LUDO_YARD_PATH_POSITION = -1;

export type LudoTokenState = "yard" | "active" | "finished";

export interface LudoToken {
  readonly id: number;
  /** `-1` while in the yard; `0..ruleset.pathLength` while active or finished. */
  readonly pathPosition: number;
}

export function tokenInYard(id: number): LudoToken {
  return { id, pathPosition: LUDO_YARD_PATH_POSITION };
}

/** A token pre-placed directly on the shared track (used for Quick's pre-released tokens). */
export function tokenOnTrack(id: number): LudoToken {
  return { id, pathPosition: 0 };
}

export function tokenState(token: LudoToken, ruleset: LudoRuleset): LudoTokenState {
  if (token.pathPosition === LUDO_YARD_PATH_POSITION) return "yard";
  if (token.pathPosition >= pathLengthOf(ruleset)) return "finished";
  return "active";
}

export function tokenToJson(token: LudoToken): Record<string, unknown> {
  return { id: token.id, path_position: token.pathPosition };
}

export function tokenFromJson(json: Record<string, unknown>): LudoToken {
  const id = json.id;
  const pathPosition = json.path_position;
  if (typeof id !== "number" || typeof pathPosition !== "number") {
    throw new Error("Invalid ludo token");
  }
  return { id, pathPosition };
}

/** One player's seat, color and tokens. */
export interface LudoPlayerState {
  readonly seat: number;
  /** Opaque identity string; carries no PII. */
  readonly subject: string;
  readonly color: LudoColor;
  readonly tokens: readonly LudoToken[];
  /** Number of opponent tokens captured during the match so far (never decreases). */
  readonly captureCount: number;
}

export function allFinished(player: LudoPlayerState, ruleset: LudoRuleset): boolean {
  return player.tokens.every((t) => tokenState(t, ruleset) === "finished");
}

export function finishedCount(player: LudoPlayerState, ruleset: LudoRuleset): number {
  return player.tokens.filter((t) => tokenState(t, ruleset) === "finished").length;
}

export function hasHomeToken(player: LudoPlayerState, ruleset: LudoRuleset): boolean {
  return finishedCount(player, ruleset) > 0;
}

export function hasCaptured(player: LudoPlayerState): boolean {
  return player.captureCount > 0;
}

export function totalProgress(player: LudoPlayerState): number {
  return player.tokens.reduce(
    (sum, t) => sum + (t.pathPosition === LUDO_YARD_PATH_POSITION ? 0 : t.pathPosition),
    0,
  );
}

export function playerToJson(
  player: LudoPlayerState,
  { includeCaptureCount = true }: { includeCaptureCount?: boolean } = {},
): Record<string, unknown> {
  const json: Record<string, unknown> = {
    seat: player.seat,
    subject: player.subject,
    color: player.color,
    tokens: player.tokens.map(tokenToJson),
  };
  if (includeCaptureCount) json.capture_count = player.captureCount;
  return json;
}

export function playerFromJson(json: Record<string, unknown>): LudoPlayerState {
  const {
    seat,
    subject,
    color,
    tokens,
    capture_count: captureCount,
  } = json as {
    seat: unknown;
    subject: unknown;
    color: unknown;
    tokens: unknown;
    capture_count: unknown;
  };
  if (
    typeof seat !== "number" ||
    typeof subject !== "string" ||
    typeof color !== "string" ||
    !Array.isArray(tokens) ||
    (captureCount !== undefined && captureCount !== null && typeof captureCount !== "number")
  ) {
    throw new Error("Invalid ludo player state");
  }
  return {
    seat,
    subject,
    color: color as LudoColor,
    tokens: tokens.map((t) => tokenFromJson(t as Record<string, unknown>)),
    captureCount: (captureCount as number | undefined) ?? 0,
  };
}

export type LudoMatchPhase = "awaitingRoll" | "awaitingMove" | "finished";

/** Full state of a Ludo match at a point in time. Always treated as immutable. */
export interface LudoMatchState {
  readonly ruleset: LudoRuleset;
  readonly players: readonly LudoPlayerState[];
  readonly currentPlayerIndex: number;
  readonly phase: LudoMatchPhase;
  /** The most recent unspent dice roll, or `null` outside `awaitingMove`. */
  readonly currentRoll: number | null;
  /** Consecutive 6s rolled by the current player so far this turn-streak. */
  readonly consecutiveSixes: number;
  /** Seats in the order they finished/were ranked. */
  readonly winnerOrder: readonly number[];
}

export function currentPlayer(state: LudoMatchState): LudoPlayerState {
  return state.players[state.currentPlayerIndex];
}

export function assertValidMatchState(state: LudoMatchState): void {
  if (state.players.length < 2 || state.players.length > 4) {
    throw new RangeError(`players.length must be 2..4, got ${state.players.length}`);
  }
  if (state.currentPlayerIndex < 0 || state.currentPlayerIndex >= state.players.length) {
    throw new RangeError(`currentPlayerIndex out of range: ${state.currentPlayerIndex}`);
  }
}

/**
 * Builds the starting state for a fresh match: every player's tokens begin in
 * the yard, except the first `ruleset.preReleasedTokensPerPlayer`, which
 * start already placed on the player's own start square. Colors are assigned
 * to seats in `LUDO_COLOR_ORDER`, truncated to the number of players.
 */
export function createMatchState(params: {
  ruleset: LudoRuleset;
  subjects: readonly string[];
}): LudoMatchState {
  const { ruleset, subjects } = params;
  if (subjects.length < 2 || subjects.length > 4) {
    throw new RangeError(`subjects.length must be 2..4, got ${subjects.length}`);
  }
  const players: LudoPlayerState[] = subjects.map((subject, seat) => {
    const tokens = Array.from({ length: ruleset.tokensPerPlayer }, (_, id) => {
      if (!ruleset.requiresYardExitRoll) return tokenOnTrack(id);
      return id < ruleset.preReleasedTokensPerPlayer ? tokenOnTrack(id) : tokenInYard(id);
    });
    return { seat, subject, color: LUDO_COLOR_ORDER[seat], tokens, captureCount: 0 };
  });
  const state: LudoMatchState = {
    ruleset,
    players,
    currentPlayerIndex: 0,
    phase: "awaitingRoll",
    currentRoll: null,
    consecutiveSixes: 0,
    winnerOrder: [],
  };
  assertValidMatchState(state);
  return state;
}

export function matchStateToJson(state: LudoMatchState): Record<string, unknown> {
  const includeCaptureCount = state.ruleset.winCondition !== "allTokensHome";
  return {
    ruleset: rulesetToJson(state.ruleset),
    players: state.players.map((p) => playerToJson(p, { includeCaptureCount })),
    current_player_index: state.currentPlayerIndex,
    phase: state.phase,
    current_roll: state.currentRoll,
    consecutive_sixes: state.consecutiveSixes,
    winner_order: [...state.winnerOrder],
  };
}

export function matchStateFromJson(json: Record<string, unknown>): LudoMatchState {
  const rulesetJson = json.ruleset;
  const playersJson = json.players;
  const currentPlayerIndex = json.current_player_index;
  const phase = json.phase;
  const currentRoll = json.current_roll;
  const consecutiveSixes = json.consecutive_sixes;
  const winnerOrder = json.winner_order;
  if (
    typeof rulesetJson !== "object" ||
    rulesetJson === null ||
    !Array.isArray(playersJson) ||
    typeof currentPlayerIndex !== "number" ||
    typeof phase !== "string" ||
    (currentRoll !== null && typeof currentRoll !== "number") ||
    typeof consecutiveSixes !== "number" ||
    !Array.isArray(winnerOrder)
  ) {
    throw new Error("Invalid ludo match state");
  }
  const state: LudoMatchState = {
    ruleset: rulesetFromJson(rulesetJson as Record<string, unknown>),
    players: playersJson.map((p) => playerFromJson(p as Record<string, unknown>)),
    currentPlayerIndex,
    phase: phase as LudoMatchPhase,
    currentRoll: currentRoll as number | null,
    consecutiveSixes,
    winnerOrder: winnerOrder as number[],
  };
  assertValidMatchState(state);
  return state;
}

// ---------------------------------------------------------------------------
// Replay events (`ludo_replay.dart`).
// ---------------------------------------------------------------------------

export type LudoReplayEvent =
  | { type: "diceRolled"; seat: number; roll: number }
  | { type: "tokenMoved"; seat: number; tokenId: number; from: number; to: number }
  | { type: "tokenCaptured"; seat: number; tokenId: number; byseat: number }
  | { type: "tokenFinished"; seat: number; tokenId: number }
  | { type: "turnForfeited"; seat: number; reason: "three-consecutive-sixes" | "no-legal-move" }
  | { type: "matchFinished"; winnerOrder: readonly number[] };

/** Serializes an event to the exact snake_case shape used by the checked-in fixtures. */
export function eventToJson(event: LudoReplayEvent): Record<string, unknown> {
  switch (event.type) {
    case "diceRolled":
      return { type: "diceRolled", seat: event.seat, roll: event.roll };
    case "tokenMoved":
      return {
        type: "tokenMoved",
        seat: event.seat,
        token_id: event.tokenId,
        from: event.from,
        to: event.to,
      };
    case "tokenCaptured":
      return {
        type: "tokenCaptured",
        seat: event.seat,
        token_id: event.tokenId,
        by_seat: event.byseat,
      };
    case "tokenFinished":
      return { type: "tokenFinished", seat: event.seat, token_id: event.tokenId };
    case "turnForfeited":
      return { type: "turnForfeited", seat: event.seat, reason: event.reason };
    case "matchFinished":
      return { type: "matchFinished", winner_order: [...event.winnerOrder] };
  }
}

export function eventFromJson(json: Record<string, unknown>): LudoReplayEvent {
  const type = json.type;
  switch (type) {
    case "diceRolled":
      return { type, seat: json.seat as number, roll: json.roll as number };
    case "tokenMoved":
      return {
        type,
        seat: json.seat as number,
        tokenId: json.token_id as number,
        from: json.from as number,
        to: json.to as number,
      };
    case "tokenCaptured":
      return {
        type,
        seat: json.seat as number,
        tokenId: json.token_id as number,
        byseat: json.by_seat as number,
      };
    case "tokenFinished":
      return { type, seat: json.seat as number, tokenId: json.token_id as number };
    case "turnForfeited":
      return {
        type,
        seat: json.seat as number,
        reason: json.reason as "three-consecutive-sixes" | "no-legal-move",
      };
    case "matchFinished":
      return { type, winnerOrder: json.winner_order as number[] };
    default:
      throw new Error(`Unknown ludo replay event type: ${String(type)}`);
  }
}
