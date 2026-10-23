import { useMemo, useRef } from "preact/hooks";
import { cellAtPoint, connectCells } from "./layout";

export const LONG_PRESS_MS = 500;

export interface BoardInputOptions {
  size: number;
  disabled: boolean;
  getRect: () => { left: number; top: number; width: number; height: number } | null;
  onTap(cell: number): void;
  onLongPress(cell: number): void;
  onDragStart(): void;
  onDrag(cells: readonly number[]): void;
  onDragEnd(): void;
  onDragCancel(): void;
  longPressMs?: number;
}

export interface BoardPointerHandlers {
  onPointerDown(event: PointerEvent): void;
  onPointerMove(event: PointerEvent): void;
  onPointerUp(event: PointerEvent): void;
  onPointerCancel(event: PointerEvent): void;
}

interface Gesture {
  pointerId: number;
  path: number[];
  dragging: boolean;
  longFired: boolean;
  timer: ReturnType<typeof setTimeout> | null;
}

/** Pointer gestures: tap, drag across cells, and a 500 ms long press that erases. */
export function useBoardInput(options: BoardInputOptions): BoardPointerHandlers {
  const latest = useRef(options);
  latest.current = options;
  const gesture = useRef<Gesture | null>(null);

  return useMemo<BoardPointerHandlers>(() => {
    const cellOf = (event: PointerEvent): number => {
      const { size, getRect } = latest.current;
      const rect = getRect();
      return rect === null ? -1 : cellAtPoint(rect, size, event.clientX, event.clientY);
    };
    const finish = (): void => {
      const current = gesture.current;
      if (current?.timer) clearTimeout(current.timer);
      gesture.current = null;
    };
    return {
      onPointerDown(event) {
        const opts = latest.current;
        if (opts.disabled || gesture.current !== null) return;
        const cell = cellOf(event);
        if (cell < 0) return;
        event.preventDefault();
        try {
          (event.currentTarget as Element | null)?.setPointerCapture?.(event.pointerId);
        } catch {
          // Capture is optional; moves still arrive while the pointer stays over the board.
        }
        const next: Gesture = {
          pointerId: event.pointerId,
          path: [cell],
          dragging: false,
          longFired: false,
          timer: null,
        };
        next.timer = setTimeout(() => {
          if (gesture.current !== next || next.dragging) return;
          next.longFired = true;
          next.timer = null;
          latest.current.onLongPress(cell);
        }, opts.longPressMs ?? LONG_PRESS_MS);
        gesture.current = next;
      },
      onPointerMove(event) {
        const current = gesture.current;
        if (current === null || current.pointerId !== event.pointerId || current.longFired) return;
        const cell = cellOf(event);
        const last = current.path[current.path.length - 1];
        if (cell < 0 || last === undefined || cell === last) return;
        if (current.timer) {
          clearTimeout(current.timer);
          current.timer = null;
        }
        const { size } = latest.current;
        current.path.push(...connectCells(size, last, cell));
        if (!current.dragging) {
          current.dragging = true;
          latest.current.onDragStart();
        }
        latest.current.onDrag(current.path.slice());
      },
      onPointerUp(event) {
        const current = gesture.current;
        if (current === null || current.pointerId !== event.pointerId) return;
        const { dragging, longFired, path } = current;
        finish();
        if (longFired) return;
        if (dragging) latest.current.onDragEnd();
        else if (path[0] !== undefined) latest.current.onTap(path[0]);
      },
      onPointerCancel(event) {
        const current = gesture.current;
        if (current === null || current.pointerId !== event.pointerId) return;
        const dragging = current.dragging;
        finish();
        if (dragging) latest.current.onDragCancel();
      },
    };
  }, []);
}
