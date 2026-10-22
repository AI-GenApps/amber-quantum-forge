import type { ComponentChildren } from "preact";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: (event: MouseEvent) => void;
  class?: string;
  children?: ComponentChildren;
}

export function Button({
  variant = "primary",
  size = "medium",
  fullWidth = false,
  disabled = false,
  type = "button",
  onClick,
  class: className,
  children,
}: ButtonProps) {
  return (
    <button
      type={type}
      class={cx(
        "wg-btn",
        `wg-btn--${variant}`,
        size !== "medium" && `wg-btn--${size}`,
        fullWidth && "wg-btn--full",
        className,
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export interface IconButtonProps {
  /** Required accessible name; icon-only buttons have no visible text. */
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
  class?: string;
  children?: ComponentChildren;
}

export function IconButton({
  label,
  variant = "ghost",
  disabled = false,
  onClick,
  class: className,
  children,
}: IconButtonProps) {
  return (
    <button
      type="button"
      class={cx("wg-btn", "wg-btn--icon", `wg-btn--${variant}`, className)}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  class?: string;
}

export function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
  class: className,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      class={cx("wg-toggle", className)}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span class="wg-toggle__label">{label}</span>
      <span class="wg-toggle__track" aria-hidden="true">
        <span class="wg-toggle__thumb" />
      </span>
    </button>
  );
}
