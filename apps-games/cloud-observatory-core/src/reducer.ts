import { applyOffline, buyBoon, buyInstrument, buyUpgrade, gather, tick } from "./actions";
import { type ChartSession, completeChart } from "./chart";
import { eclipse } from "./eclipse";
import type {
  BoonId,
  Catalog,
  GameEvent,
  GameState,
  InstrumentId,
  RejectReason,
  UpgradeId,
} from "./types";

export type Action =
  | { readonly type: "gather" }
  | { readonly type: "tick"; readonly seconds: number }
  | { readonly type: "offline"; readonly elapsed: number }
  | {
      readonly type: "buy-instrument";
      readonly id: InstrumentId;
      readonly quantity: number | "max";
    }
  | { readonly type: "buy-upgrade"; readonly id: UpgradeId }
  | { readonly type: "buy-boon"; readonly id: BoonId }
  | { readonly type: "complete-chart"; readonly session: ChartSession }
  | { readonly type: "eclipse" };

export interface ReduceResult {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
  readonly ok: boolean;
  readonly reason?: RejectReason;
}

function accept(state: GameState, events: readonly GameEvent[] = []): ReduceResult {
  return { state, events, ok: true };
}

function reject(state: GameState, reason: RejectReason): ReduceResult {
  return { state, events: [], ok: false, reason };
}

type Outcome =
  | { readonly ok: true; readonly state: GameState; readonly events: readonly GameEvent[] }
  | { readonly ok: false; readonly reason: RejectReason };

function settle(state: GameState, outcome: Outcome): ReduceResult {
  return outcome.ok ? accept(outcome.state, outcome.events) : reject(state, outcome.reason);
}

export function reduce(state: GameState, action: Action, catalog: Catalog): ReduceResult {
  switch (action.type) {
    case "gather":
      return accept(gather(state, catalog));
    case "tick":
      return accept(tick(state, action.seconds, catalog));
    case "offline":
      return accept(applyOffline(state, action.elapsed, catalog).state);
    case "buy-instrument":
      return settle(state, buyInstrument(state, action.id, action.quantity, catalog));
    case "buy-upgrade":
      return settle(state, buyUpgrade(state, action.id, catalog));
    case "buy-boon":
      return settle(state, buyBoon(state, action.id, catalog));
    case "complete-chart":
      return settle(state, completeChart(state, action.session, catalog));
    case "eclipse":
      return settle(state, eclipse(state, catalog));
  }
}
