import type { Slot } from "@web-games/dress-rehearsal-core";
import { useEffect, useRef, useState } from "preact/hooks";

export interface DragSource {
  readonly pieceId: string;
  readonly origin: "tray" | "board";
  readonly slot?: Slot;
}

export const DRAG_THRESHOLD_PX = 6;

export interface DragPoint {
  readonly x: number;
  readonly y: number;
}

export interface DragState {
  readonly source: DragSource;
  readonly point: DragPoint;
  readonly over: Slot | null;
}

export type SlotHit = (x: number, y: number) => Slot | null;

const SLOT_NAMES: readonly string[] = [
  "top",
  "bottom",
  "dress",
  "outer",
  "shoes",
  "bag",
  "hat",
  "accessory",
];

/** The board slot under a point, found through the document hit test. */
export const documentSlotHit: SlotHit = (x, y) => {
  if (typeof document.elementFromPoint !== "function") return null;
  const element = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-board-slot]");
  const name = element?.dataset.boardSlot;
  return name !== undefined && SLOT_NAMES.includes(name) ? (name as Slot) : null;
};

export interface DragOptions {
  /** Called once when the pointer is released after a drag; `target` is null outside every slot. */
  onDrop: (source: DragSource, target: Slot | null) => void;
  hit?: SlotHit;
  onStart?: (source: DragSource) => void;
}

export interface DragControls {
  drag: DragState | null;
  begin: (event: PointerEvent, source: DragSource) => void;
  /** True once after a drag ended, so the click that follows the release is ignored. */
  consumeClick: () => boolean;
}

/** Pointer-driven drag with a movement threshold; taps fall through to click handlers. */
export function useDrag(options: DragOptions): DragControls {
  const [drag, setDrag] = useState<DragState | null>(null);
  const latest = useRef(options);
  latest.current = options;
  const cleanup = useRef<(() => void) | null>(null);
  const swallow = useRef(false);

  useEffect(() => () => cleanup.current?.(), []);

  const begin = (event: PointerEvent, source: DragSource): void => {
    if (event.button !== undefined && event.button > 0) return;
    cleanup.current?.();
    const start: DragPoint = { x: event.clientX, y: event.clientY };
    let active = false;
    const hit = (point: DragPoint): Slot | null =>
      (latest.current.hit ?? documentSlotHit)(point.x, point.y);

    const move = (next: PointerEvent): void => {
      const point = { x: next.clientX, y: next.clientY };
      if (!active) {
        if (Math.hypot(point.x - start.x, point.y - start.y) < DRAG_THRESHOLD_PX) return;
        active = true;
        latest.current.onStart?.(source);
      }
      setDrag({ source, point, over: hit(point) });
    };
    const end = (finish: PointerEvent, cancelled: boolean): void => {
      stop();
      if (!active) return;
      swallow.current = true;
      setTimeout(() => {
        swallow.current = false;
      }, 0);
      setDrag(null);
      if (cancelled) return;
      latest.current.onDrop(source, hit({ x: finish.clientX, y: finish.clientY }));
    };
    const up = (finish: PointerEvent): void => end(finish, false);
    const cancel = (finish: PointerEvent): void => end(finish, true);
    const stop = (): void => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      cleanup.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    cleanup.current = stop;
  };

  return {
    drag,
    begin,
    consumeClick: () => {
      const was = swallow.current;
      swallow.current = false;
      return was;
    },
  };
}
