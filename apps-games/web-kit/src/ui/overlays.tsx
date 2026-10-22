import type { ComponentChildren } from "preact";
import { useEffect, useId, useRef, useState } from "preact/hooks";
import { cx } from "./cx";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** `sheet` slides from the bottom edge; `modal` is centred. */
  variant?: "sheet" | "modal";
  dismissOnBackdrop?: boolean;
  class?: string;
  children?: ComponentChildren;
}

/** Dialog surface. Escape and (optionally) a backdrop tap call `onClose`; focus moves into it. */
export function Sheet({
  open,
  onClose,
  title,
  variant = "sheet",
  dismissOnBackdrop = true,
  class: className,
  children,
}: SheetProps) {
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) dialog.current?.focus();
  }, [open]);

  if (!open) return null;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Escape is handled on the dialog; the backdrop tap is a pointer shortcut
    <div
      role="presentation"
      class={cx("wg-overlay", `wg-overlay--${variant}`)}
      data-backdrop="true"
      onClick={(event) => {
        if (dismissOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialog}
        class={cx("wg-sheet", className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            onClose();
          }
        }}
      >
        <h2 id={titleId} class="wg-sheet__title">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

export type ModalProps = Omit<SheetProps, "variant">;

export function Modal(props: ModalProps) {
  return <Sheet {...props} variant="modal" />;
}

export type ToastTone = "info" | "success" | "danger";

export interface ToastProps {
  message: string;
  tone?: ToastTone;
  /** Auto-dismiss delay in ms; 0 keeps the toast until `onDismiss` is triggered elsewhere. */
  durationMs?: number;
  onDismiss?: () => void;
}

export function Toast({ message, tone = "info", durationMs = 2500, onDismiss }: ToastProps) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new message restarts the dismiss timer
  useEffect(() => {
    if (durationMs <= 0 || !onDismiss) return undefined;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  return (
    <div
      class={cx("wg-toast", tone !== "info" && `wg-toast--${tone}`)}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}

export interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

/** Single-slot toast state: `show` replaces whatever is visible. */
export function useToast(): {
  toast: ToastState | null;
  show: (message: string, tone?: ToastTone) => void;
  dismiss: () => void;
} {
  const [toast, setToast] = useState<ToastState | null>(null);
  const counter = useRef(0);
  return {
    toast,
    show: (message, tone = "info") => {
      counter.current += 1;
      setToast({ id: counter.current, message, tone });
    },
    dismiss: () => setToast(null),
  };
}
