import { Sheet, type SheetProps } from "@web-games/kit";
import { useEffect } from "preact/hooks";
import { useMotion } from "../motion/useMotion";
import { useApp } from "../state/app";
import { useBack } from "../state/useBack";

/** Kit sheet that also consumes the Android back press while it is open and slides in. */
export function AppSheet(props: SheetProps) {
  const { router } = useApp();
  const motion = useMotion();
  useBack(router, props.open, () => {
    props.onClose();
    return true;
  });
  useEffect(() => {
    if (!props.open) return;
    const dialogs = document.querySelectorAll<HTMLElement>(".wg-sheet.fd-sheet");
    const dialog = dialogs[dialogs.length - 1];
    if (dialog) void motion.sheetSlide(dialog);
  }, [props.open, motion]);
  return <Sheet {...props} class={`fd-sheet ${props.class ?? ""}`.trim()} />;
}
