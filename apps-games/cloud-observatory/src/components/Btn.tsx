import { Button, type ButtonProps } from "@web-games/kit";
import { cx } from "../ui/cx";

/** Kit button with the app's hit-area class. */
export function Btn(props: ButtonProps) {
  return <Button {...props} class={cx("co-btn", props.class)} />;
}
