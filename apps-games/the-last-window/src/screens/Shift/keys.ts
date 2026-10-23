import { useEffect, useRef } from "preact/hooks";

/** Each handler returns true when it used the key; only then is the browser default suppressed. */
export interface ShiftKeyHandlers {
  seat: (index: number) => boolean;
  serve: () => boolean;
  escape: () => boolean;
}

const TEXT_TARGET = /^(input|textarea|select)$/i;

/**
 * Shift keyboard bindings on the document: `1 2 3` select a seat, `Space` serves, `Escape`
 * pauses or closes a sheet. `Tab` and `Enter` keep their normal button behaviour, and every key keeps
 * its normal behaviour while a sheet is open (the handlers return false then).
 */
export function useShiftKeys(handlers: ShiftKeyHandlers, enabled = true): void {
  const latest = useRef(handlers);
  latest.current = handlers;
  useEffect(() => {
    if (!enabled) return undefined;
    let spaceHandled = false;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as Element | null;
      if (target && TEXT_TARGET.test(target.tagName ?? "")) return;
      let handled = false;
      if (event.key === "1" || event.key === "2" || event.key === "3") {
        handled = latest.current.seat(Number(event.key) - 1);
      } else if (event.key === " " || event.code === "Space") {
        handled = latest.current.serve();
        spaceHandled = handled;
      } else if (event.key === "Escape") {
        handled = latest.current.escape();
      }
      if (handled) event.preventDefault();
    };
    const onKeyUp = (event: KeyboardEvent): void => {
      if ((event.key === " " || event.code === "Space") && spaceHandled) {
        spaceHandled = false;
        event.preventDefault();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [enabled]);
}
