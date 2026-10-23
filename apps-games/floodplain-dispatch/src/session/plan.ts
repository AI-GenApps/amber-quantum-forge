import {
  addPlacement,
  checkPlacement,
  findPlacement,
  type MapDef,
  type PieceKind,
  type Placement,
  type PlacementError,
  removePlacement,
  rotatePump,
  setGateWeeks,
} from "@web-games/floodplain-dispatch-core";

export type StrokeState = "none" | "open" | "pushed";

export interface PlanState {
  placements: Placement[];
  past: Placement[][];
  future: Placement[][];
  stroke: StrokeState;
}

export type PlanChange = "placed" | "removed" | "rotated" | "gate" | "cleared" | "none";

export interface PlanResult {
  state: PlanState;
  change: PlanChange;
  error: PlacementError | null;
}

export const DEFAULT_PUMP_DIRECTION = "E" as const;
export const UNDO_LIMIT = 500 as const;

export function emptyPlan(placements: readonly Placement[] = []): PlanState {
  return { placements: placements.map((p) => ({ ...p })), past: [], future: [], stroke: "none" };
}

export const canUndo = (state: PlanState): boolean => state.past.length > 0;
export const canRedo = (state: PlanState): boolean => state.future.length > 0;

function commit(state: PlanState, next: Placement[]): PlanState {
  const push = state.stroke !== "pushed";
  const past = push ? [...state.past, state.placements].slice(-UNDO_LIMIT) : state.past;
  return {
    placements: next,
    past,
    future: [],
    stroke: state.stroke === "open" ? "pushed" : state.stroke,
  };
}

export function beginStroke(state: PlanState): PlanState {
  return { ...state, stroke: "open" };
}

export function endStroke(state: PlanState): PlanState {
  return { ...state, stroke: "none" };
}

export function undo(state: PlanState): PlanState {
  const previous = state.past[state.past.length - 1];
  if (!previous) return state;
  return {
    placements: previous,
    past: state.past.slice(0, -1),
    future: [...state.future, state.placements],
    stroke: "none",
  };
}

export function redo(state: PlanState): PlanState {
  const next = state.future[state.future.length - 1];
  if (!next) return state;
  return {
    placements: next,
    past: [...state.past, state.placements],
    future: state.future.slice(0, -1),
    stroke: "none",
  };
}

export function clearPlan(state: PlanState): PlanResult {
  if (state.placements.length === 0) return { state, change: "none", error: null };
  return { state: commit({ ...state, stroke: "none" }, []), change: "cleared", error: null };
}

export function placePiece(
  state: PlanState,
  def: MapDef,
  kind: PieceKind,
  x: number,
  y: number,
): PlanResult {
  const candidate: Placement =
    kind === "pump" ? { x, y, kind, dir: DEFAULT_PUMP_DIRECTION } : { x, y, kind };
  const error = checkPlacement(def, state.placements, candidate);
  if (error) return { state, change: "none", error };
  return {
    state: commit(state, addPlacement(state.placements, candidate)),
    change: "placed",
    error: null,
  };
}

export function erasePiece(state: PlanState, x: number, y: number): PlanResult {
  if (!findPlacement(state.placements, x, y)) return { state, change: "none", error: null };
  return {
    state: commit(state, removePlacement(state.placements, x, y)),
    change: "removed",
    error: null,
  };
}

export function rotateAt(state: PlanState, x: number, y: number): PlanResult {
  const piece = findPlacement(state.placements, x, y);
  if (piece?.kind !== "pump") return { state, change: "none", error: null };
  return {
    state: commit({ ...state, stroke: "none" }, rotatePump(state.placements, x, y)),
    change: "rotated",
    error: null,
  };
}

export function setGateAt(
  state: PlanState,
  def: MapDef,
  x: number,
  y: number,
  opensWeek: number,
  closesWeek: number,
): PlanResult {
  const piece = findPlacement(state.placements, x, y);
  if (piece?.kind !== "gate") return { state, change: "none", error: null };
  if (opensWeek < 0 || closesWeek > def.weeks || opensWeek >= closesWeek) {
    return { state, change: "none", error: "BAD_GATE_WEEKS" };
  }
  const same =
    (piece.opensWeek ?? 0) === opensWeek && (piece.closesWeek ?? def.weeks) === closesWeek;
  if (same) return { state, change: "none", error: null };
  return {
    state: commit(
      { ...state, stroke: "none" },
      setGateWeeks(state.placements, x, y, opensWeek, closesWeek),
    ),
    change: "gate",
    error: null,
  };
}
