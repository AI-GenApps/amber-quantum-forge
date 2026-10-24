import {
  applyAction,
  closeShift,
  createShift,
  type ShiftAction,
  type ShiftDef,
  type ShiftEvent,
  type ShiftResult,
  type ShiftState,
  type StockPlan,
  TICK_MS,
  tickShift,
} from "@web-games/the-last-window-core";
import type { FrameHandle, Scheduler } from "./scheduler";

export const MAX_CATCH_UP_TICKS = 5 as const;

export type PauseReason = "sheet" | "hidden" | "coach" | "card";

export interface VisibilitySource {
  readonly hidden?: boolean;
  addEventListener(type: "visibilitychange", listener: () => void): void;
  removeEventListener(type: "visibilitychange", listener: () => void): void;
}

export interface RunnerOptions {
  def: ShiftDef;
  stock: StockPlan;
  scheduler: Scheduler;
  visibility?: VisibilitySource | null;
}

export type RunnerListener = (state: ShiftState) => void;
export type EventListener = (events: ShiftEvent[], state: ShiftState) => void;

/**
 * Owns one shift: the engine state, a time accumulator and an injected frame scheduler. It calls
 * `tickShift` once per `TICK_MS` of accumulated time, never more than `MAX_CATCH_UP_TICKS` per
 * frame, and stands still while any pause reason is set.
 */
export class Runner {
  private current: ShiftState;
  private readonly scheduler: Scheduler;
  private readonly visibility: VisibilitySource | null;
  private readonly reasons = new Set<PauseReason>();
  private readonly stateListeners = new Set<RunnerListener>();
  private readonly eventListeners = new Set<EventListener>();
  private handle: FrameHandle | null = null;
  private last: number | null = null;
  private acc = 0;
  private started = false;
  private disposed = false;
  private items = 0;

  constructor(options: RunnerOptions) {
    this.current = createShift(options.def, options.stock);
    this.scheduler = options.scheduler;
    this.visibility = options.visibility ?? null;
    this.visibility?.addEventListener("visibilitychange", this.onVisibility);
    if (this.visibility?.hidden) this.reasons.add("hidden");
  }

  get state(): ShiftState {
    return this.current;
  }

  get paused(): boolean {
    return this.reasons.size > 0;
  }

  get closed(): boolean {
    return this.current.phase === "closed";
  }

  /** Drinks and pastries finished so far, for the profile stats. */
  get itemsMade(): number {
    return this.items;
  }

  start(): void {
    if (this.started || this.disposed) return;
    this.started = true;
    this.schedule();
  }

  pause(reason: PauseReason = "sheet"): void {
    this.reasons.add(reason);
    this.last = null;
  }

  resume(reason: PauseReason = "sheet"): void {
    this.reasons.delete(reason);
    if (this.reasons.size === 0) this.last = null;
  }

  dispatch(action: ShiftAction): ShiftEvent[] {
    if (this.disposed || this.closed) return [];
    const result = applyAction(this.current, action);
    this.publish(result.state, result.events);
    return result.events;
  }

  /** Advances by whole ticks without the scheduler (used by tests and the closing sweep). */
  tick(count = 1): void {
    for (let index = 0; index < count && !this.closed; index++) {
      const result = tickShift(this.current);
      this.publish(result.state, result.events);
    }
  }

  result(): ShiftResult {
    return closeShift(this.current);
  }

  onState(listener: RunnerListener): () => void {
    this.stateListeners.add(listener);
    return () => void this.stateListeners.delete(listener);
  }

  onEvents(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => void this.eventListeners.delete(listener);
  }

  dispose(): void {
    this.disposed = true;
    if (this.handle !== null) this.scheduler.cancel(this.handle);
    this.handle = null;
    this.visibility?.removeEventListener("visibilitychange", this.onVisibility);
    this.stateListeners.clear();
    this.eventListeners.clear();
  }

  private readonly onVisibility = (): void => {
    if (this.visibility?.hidden) this.pause("hidden");
    else this.resume("hidden");
  };

  private schedule(): void {
    if (this.disposed || this.closed) return;
    this.handle = this.scheduler.request(this.frame);
  }

  private readonly frame = (now: number): void => {
    this.handle = null;
    if (this.disposed) return;
    if (this.paused || this.last === null) {
      this.last = now;
      this.schedule();
      return;
    }
    this.acc += Math.max(0, now - this.last);
    this.last = now;
    let ticks = 0;
    while (this.acc >= TICK_MS && ticks < MAX_CATCH_UP_TICKS && !this.closed) {
      this.acc -= TICK_MS;
      const result = tickShift(this.current);
      this.publish(result.state, result.events);
      ticks += 1;
    }
    if (this.acc >= TICK_MS) this.acc = this.acc % TICK_MS;
    this.schedule();
  };

  private publish(state: ShiftState, events: ShiftEvent[]): void {
    this.current = state;
    for (const event of events) {
      if (event.type === "item-ready" && event.component !== "book") this.items += 1;
    }
    for (const listener of [...this.stateListeners]) listener(state);
    if (events.length > 0) {
      for (const listener of [...this.eventListeners]) listener(events, state);
    }
  }
}
