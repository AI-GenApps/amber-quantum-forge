import { useBackInterceptor } from "@web-games/kit";
import { useCallback, useEffect, useRef } from "preact/hooks";
import { useApp } from "./context";

/** While `active`, a back press runs `onBack` and counts as handled. */
export function useBack(active: boolean, onBack: () => void): void {
  const { router } = useApp();
  const latest = useRef(onBack);
  latest.current = onBack;
  const interceptor = useCallback(() => {
    latest.current();
    return true;
  }, []);
  useBackInterceptor(router, active, interceptor);
}

export interface RepeatHandlers {
  onClick: () => void;
  onPointerDown: () => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
}

export const REPEAT_DELAY_MS = 450;
export const REPEAT_INTERVAL_MS = 250;

/**
 * Tap fires once; holding for 450 ms repeats at 4 per second until release. The click that ends
 * a hold is swallowed so a long press never adds a stray extra buy.
 */
export function useRepeat(fire: () => void): RepeatHandlers {
  const latest = useRef(fire);
  latest.current = fire;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeated = useRef(false);

  const stop = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => stop, [stop]);

  const loop = useCallback(() => {
    repeated.current = true;
    latest.current();
    timer.current = setTimeout(loop, REPEAT_INTERVAL_MS);
  }, []);

  return {
    onClick: () => {
      if (repeated.current) {
        repeated.current = false;
        return;
      }
      latest.current();
    },
    onPointerDown: () => {
      repeated.current = false;
      stop();
      timer.current = setTimeout(loop, REPEAT_DELAY_MS);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
  };
}
