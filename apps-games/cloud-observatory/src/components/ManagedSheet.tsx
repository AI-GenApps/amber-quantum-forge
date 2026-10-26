import { Sheet, type SheetProps } from "@web-games/kit";
import { useBack } from "../app/hooks";

/** A kit sheet or modal that also closes on the hardware back button before any screen pops. */
export function ManagedSheet(props: SheetProps) {
  useBack(props.open, props.onClose);
  return <Sheet {...props} />;
}
