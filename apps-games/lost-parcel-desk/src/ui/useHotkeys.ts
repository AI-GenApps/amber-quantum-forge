import { useEffect, useRef } from "preact/hooks";

export type HotkeyMap = Readonly<Record<string, () => void>>;

function typing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/** Window key shortcuts (F, M, P and so on); ignored inside dialogs, inputs and with modifier keys. */
export function useHotkeys(map: HotkeyMap, enabled = true): void {
  const latest = useRef(map);
  latest.current = map;
  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
      if (typing(event.target)) return;
      if (event.target instanceof Element && event.target.closest("[role='dialog']")) return;
      const handler = latest.current[event.key.length === 1 ? event.key.toLowerCase() : event.key];
      if (!handler) return;
      event.preventDefault();
      handler();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}

/** Arrow keys move focus between `[data-nav]` controls inside the element that owns the handler. */
export function arrowNav(event: KeyboardEvent): void {
  const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
  const backward = event.key === "ArrowLeft" || event.key === "ArrowUp";
  if (!forward && !backward) return;
  const group = (event.currentTarget as HTMLElement | null)?.closest("[data-navgroup]");
  if (!group) return;
  const items = Array.from(group.querySelectorAll<HTMLElement>("[data-nav]:not([disabled])"));
  const at = items.indexOf(event.target as HTMLElement);
  if (at < 0 || items.length === 0) return;
  event.preventDefault();
  const next = items[(at + (forward ? 1 : -1) + items.length) % items.length];
  next?.focus();
}
