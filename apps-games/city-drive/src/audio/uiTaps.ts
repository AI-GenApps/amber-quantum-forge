/**
 * Plays a tap sound when any button in `host` is clicked, except buttons marked (or inside an
 * element marked) `data-no-tap`: the driving controls, which are held rather than tapped, and
 * the horn, which has its own sound.
 */
export function soundButtonTaps(host: HTMLElement, onTap: () => void): () => void {
  const onClick = (event: Event): void => {
    const target = event.target as Element | null;
    const button = target?.closest?.("button");
    if (!button || button.disabled || button.closest("[data-no-tap]")) return;
    onTap();
  };
  host.addEventListener("click", onClick);
  return () => host.removeEventListener("click", onClick);
}
