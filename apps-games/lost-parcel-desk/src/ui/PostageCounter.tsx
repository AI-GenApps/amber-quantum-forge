import { t } from "../strings";

export function PostageCounter({ postage }: { postage: number }) {
  return (
    <span
      class="lp-counter"
      data-testid="postage"
      role="img"
      aria-label={t("postageLabel", { postage })}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" class="lp-counter__icon">
        <rect x="4" y="4" width="16" height="16" rx="1" />
        <circle cx="12" cy="12" r="4" />
      </svg>
      <span class="lp-counter__value">{postage}</span>
    </span>
  );
}
