import { Sheet, type SheetProps } from "@web-games/kit";
import { useApp } from "../state/app";
import { useBack } from "../state/useBack";

/** Kit sheet that also consumes the Android back press while it is open. */
export function AppSheet(props: SheetProps) {
  const { router } = useApp();
  useBack(router, props.open, () => {
    props.onClose();
    return true;
  });
  return <Sheet {...props} class={`lp-sheet ${props.class ?? ""}`.trim()} />;
}
