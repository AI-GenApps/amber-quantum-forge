import { PALETTE } from "../theme/tokens";

export function Pin({ size = 18 }: { size?: number }) {
  return (
    <svg
      class="lp-pin"
      viewBox="0 0 20 20"
      width={size}
      height={size}
      aria-hidden="true"
      data-pin="true"
    >
      <circle
        cx="10"
        cy="10"
        r="7"
        fill={PALETTE.mustardLight}
        stroke={PALETTE.ink}
        stroke-width="1.6"
      />
      <circle cx="8" cy="8" r="2" fill={PALETTE.cream} />
    </svg>
  );
}
