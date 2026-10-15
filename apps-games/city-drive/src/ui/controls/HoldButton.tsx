import { useState } from "preact/hooks";
import type { TouchButton, TouchInput } from "../../input";

/** Smallest touch target in CSS pixels (the layout never makes a button smaller). */
export const MIN_HIT_PX = 56;

interface Props {
  input: TouchInput;
  button: TouchButton;
  /** Accessible name. */
  label: string;
  /** Visible text; defaults to the label. */
  text?: string;
  className?: string;
}

/**
 * A button that is "down" while a finger is on it. Pointer events only: each press records its
 * pointer id, so two fingers on two buttons both count and lifting one releases only its own.
 */
export function HoldButton({ input, button, label, text = label, className = "" }: Props) {
  const [down, setDown] = useState(false);

  const release = (event: PointerEvent): void => {
    input.release(button, event.pointerId);
    setDown(input.isHeld(button));
  };

  return (
    <button
      type="button"
      class={`cd-btn cd-btn-${button} ${className} ${down ? "cd-down" : ""}`.trim()}
      style={{ minWidth: `${MIN_HIT_PX}px`, minHeight: `${MIN_HIT_PX}px`, touchAction: "none" }}
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        try {
          (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
        } catch {
          // Capture can fail for a pointer that already ended; the press still counts.
        }
        input.press(button, event.pointerId);
        setDown(true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span aria-hidden="true">{text}</span>
    </button>
  );
}
