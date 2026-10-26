import {
  type Category,
  canPlace,
  clearSlot,
  type Look,
  type Piece,
  type PlaceFailure,
  place,
  type Slot,
  type SlotSetId,
} from "@web-games/dress-rehearsal-core";
import { commit, type History, redo, startHistory, undo } from "./history";

export type Selection =
  | { readonly kind: "piece"; readonly pieceId: string }
  | { readonly kind: "slot"; readonly slot: Slot };

export interface HintMark {
  readonly pieceId: string;
  readonly slot: Slot;
}

export interface BoardState {
  readonly history: History;
  readonly selected: Selection | null;
  readonly tab: Category;
  readonly hint: HintMark | null;
}

export interface BoardContext {
  readonly set: SlotSetId;
  readonly pieces: ReadonlyMap<string, Piece>;
}

export type BoardAction =
  | { readonly type: "select-piece"; readonly pieceId: string }
  | { readonly type: "tap-slot"; readonly slot: Slot }
  | { readonly type: "place"; readonly pieceId: string; readonly slot?: Slot }
  | { readonly type: "remove"; readonly slot: Slot }
  | { readonly type: "remove-selected" }
  | { readonly type: "undo" }
  | { readonly type: "redo" }
  | { readonly type: "clear" }
  | { readonly type: "set-tab"; readonly tab: Category }
  | { readonly type: "set-hint"; readonly hint: HintMark | null }
  | { readonly type: "deselect" }
  | { readonly type: "reset" };

export type BoardEvent =
  | {
      readonly type: "placed";
      readonly piece: Piece;
      readonly slot: Slot;
      readonly replaced: string | null;
      readonly displaced: readonly string[];
    }
  | {
      readonly type: "refused";
      readonly reason: PlaceFailure;
      readonly piece: Piece;
      readonly slot: Slot;
    }
  | { readonly type: "removed"; readonly piece: Piece; readonly slot: Slot }
  | { readonly type: "selected"; readonly piece: Piece }
  | { readonly type: "deselected" }
  | { readonly type: "tab-opened"; readonly slot: Slot }
  | { readonly type: "history"; readonly action: "undo" | "redo" | "clear" }
  | { readonly type: "none" };

export interface Reduced {
  readonly state: BoardState;
  readonly event: BoardEvent;
}

export function initialBoard(look: Look = {}, tab: Category = "top"): BoardState {
  return { history: startHistory(look), selected: null, tab, hint: null };
}

export function lookOf(state: BoardState): Look {
  return state.history.present;
}

function withLook(state: BoardState, next: Look, extra: Partial<BoardState> = {}): BoardState {
  return { ...state, history: commit(state.history, next), hint: null, ...extra };
}

function placeInto(ctx: BoardContext, state: BoardState, piece: Piece, slot: Slot): Reduced {
  const check = canPlace(ctx.set, piece, slot);
  if (!check.ok) {
    return { state, event: { type: "refused", reason: check.reason, piece, slot } };
  }
  const look = lookOf(state);
  const result = place(ctx.set, look, piece, slot);
  if (!result.ok) {
    return { state, event: { type: "refused", reason: result.reason, piece, slot } };
  }
  const previous = look[slot];
  const replaced = previous !== undefined && previous !== piece.id ? previous : null;
  const next = withLook(state, result.look, { selected: null, tab: piece.category });
  return {
    state: next,
    event: {
      type: "placed",
      piece,
      slot,
      replaced,
      displaced: result.displaced.filter((id) => id !== replaced),
    },
  };
}

function removeFrom(ctx: BoardContext, state: BoardState, slot: Slot): Reduced {
  const id = lookOf(state)[slot];
  const piece = id === undefined ? undefined : ctx.pieces.get(id);
  if (piece === undefined) return { state, event: { type: "none" } };
  const next = withLook(state, clearSlot(lookOf(state), slot), { selected: null });
  return { state: next, event: { type: "removed", piece, slot } };
}

export function reduceBoard(ctx: BoardContext, state: BoardState, action: BoardAction): Reduced {
  switch (action.type) {
    case "select-piece": {
      const piece = ctx.pieces.get(action.pieceId);
      if (piece === undefined) return { state, event: { type: "none" } };
      const same = state.selected?.kind === "piece" && state.selected.pieceId === piece.id;
      if (same) return { state: { ...state, selected: null }, event: { type: "deselected" } };
      return {
        state: { ...state, selected: { kind: "piece", pieceId: piece.id }, tab: piece.category },
        event: { type: "selected", piece },
      };
    }
    case "tap-slot": {
      const selected = state.selected;
      if (selected?.kind === "piece") {
        const piece = ctx.pieces.get(selected.pieceId);
        if (piece !== undefined) return placeInto(ctx, state, piece, action.slot);
      }
      const id = lookOf(state)[action.slot];
      const here = id === undefined ? undefined : ctx.pieces.get(id);
      if (here === undefined) {
        return {
          state: { ...state, selected: null, tab: action.slot },
          event: { type: "tab-opened", slot: action.slot },
        };
      }
      if (selected?.kind === "slot" && selected.slot === action.slot) {
        return { state: { ...state, selected: null }, event: { type: "deselected" } };
      }
      return {
        state: { ...state, selected: { kind: "slot", slot: action.slot }, tab: action.slot },
        event: { type: "selected", piece: here },
      };
    }
    case "place": {
      const piece = ctx.pieces.get(action.pieceId);
      if (piece === undefined) return { state, event: { type: "none" } };
      return placeInto(ctx, state, piece, action.slot ?? piece.category);
    }
    case "remove":
      return removeFrom(ctx, state, action.slot);
    case "remove-selected":
      return state.selected?.kind === "slot"
        ? removeFrom(ctx, state, state.selected.slot)
        : { state, event: { type: "none" } };
    case "undo": {
      const history = undo(state.history);
      if (history === state.history) return { state, event: { type: "none" } };
      return {
        state: { ...state, history, selected: null, hint: null },
        event: { type: "history", action: "undo" },
      };
    }
    case "redo": {
      const history = redo(state.history);
      if (history === state.history) return { state, event: { type: "none" } };
      return {
        state: { ...state, history, selected: null, hint: null },
        event: { type: "history", action: "redo" },
      };
    }
    case "clear": {
      if (Object.keys(lookOf(state)).length === 0) return { state, event: { type: "none" } };
      return {
        state: withLook(state, {}, { selected: null }),
        event: { type: "history", action: "clear" },
      };
    }
    case "set-tab":
      return { state: { ...state, tab: action.tab }, event: { type: "none" } };
    case "set-hint":
      return { state: { ...state, hint: action.hint }, event: { type: "none" } };
    case "deselect":
      return state.selected === null
        ? { state, event: { type: "none" } }
        : { state: { ...state, selected: null }, event: { type: "deselected" } };
    case "reset":
      return { state: initialBoard({}, state.tab), event: { type: "none" } };
  }
}
