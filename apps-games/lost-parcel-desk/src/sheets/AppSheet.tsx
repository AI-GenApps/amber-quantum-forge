import { Sheet, type SheetProps } from "@web-games/kit";
import { useEffect, useRef } from "preact/hooks";
import { useApp, useFeedback } from "../state/app";
import { useBack } from "../state/useBack";

/** Kit sheet that also consumes the Android back press while it is open and makes the sheet sound. */
export function AppSheet(props: SheetProps) {
  const { router } = useApp();
  const feedback = useFeedback();
  const wasOpen = useRef(false);
  useBack(router, props.open, () => {
    props.onClose();
    return true;
  });
  useEffect(() => {
    if (props.open && !wasOpen.current) feedback.fire({ type: "ui", ui: "sheet" });
    wasOpen.current = props.open;
  }, [props.open, feedback]);
  return <Sheet {...props} class={`lp-sheet ${props.class ?? ""}`.trim()} />;
}
