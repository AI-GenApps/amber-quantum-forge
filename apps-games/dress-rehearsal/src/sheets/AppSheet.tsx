import { Sheet, type SheetProps } from "@web-games/kit";
import { useEffect, useRef } from "preact/hooks";
import { useMotion } from "../motion/useMotion";
import { useApp, useFeedback } from "../state/app";
import { useBack } from "../state/useBack";

export interface AppSheetProps extends SheetProps {
  /** True for a sheet whose opening already has its own sound (the result sheet). */
  silentOpen?: boolean;
}

/** Kit sheet that consumes the Android back press, slides in and plays the open sound. */
export function AppSheet({ silentOpen = false, ...props }: AppSheetProps) {
  const { router } = useApp();
  const feedback = useFeedback();
  const motion = useMotion();
  const host = useRef<HTMLDivElement>(null);
  useBack(router, props.open, () => {
    props.onClose();
    return true;
  });
  // biome-ignore lint/correctness/useExhaustiveDependencies: the cue and slide run once per opening
  useEffect(() => {
    if (!props.open) return;
    if (!silentOpen) feedback.fire({ type: "ui", ui: "sheet" });
    const dialog = host.current?.querySelector<HTMLElement>(".wg-sheet");
    if (dialog && (props.variant ?? "sheet") === "sheet") void motion.sheetSlide(dialog);
  }, [props.open]);
  return (
    <div ref={host} class="dr-sheet-host">
      <Sheet {...props} class={`dr-sheet ${props.class ?? ""}`.trim()} />
    </div>
  );
}
