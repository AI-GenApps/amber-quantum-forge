import type { ControlLayout } from "@city-drive/core";
import { useLayoutEffect } from "preact/hooks";
import type { TouchInput } from "../../input";
import { HoldButton } from "./HoldButton";

interface Props {
  input: TouchInput;
  /** "mirrored" puts steering on the right hand and the pedals on the left. */
  layout?: ControlLayout;
}

/**
 * Landscape touch layout: steer buttons on the left, pedals and handbrake on the right. The
 * stylesheet places both clusters from the safe-area insets so notches never cover them.
 */
export function TouchControls({ input, layout = "standard" }: Props) {
  // Hiding the buttons while a finger is down must not leave the car steering or accelerating.
  useLayoutEffect(() => () => input.releaseAll(), [input]);
  return (
    <div class="cd-controls" data-testid="touch-controls" data-layout={layout}>
      <div class="cd-cluster cd-cluster-left">
        <HoldButton input={input} button="left" label="Left" />
        <HoldButton input={input} button="right" label="Right" />
      </div>
      <div class="cd-cluster cd-cluster-right">
        <HoldButton
          input={input}
          button="handbrake"
          label="Handbrake"
          text="Drift"
          className="cd-small"
        />
        <HoldButton input={input} button="brake" label="Brake or reverse" text="Brake" />
        <HoldButton input={input} button="gas" label="Gas" className="cd-big" />
      </div>
      <HoldButton input={input} button="reset" label="Reset" className="cd-reset" />
    </div>
  );
}
