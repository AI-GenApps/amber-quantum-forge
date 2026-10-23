import type { ChapterId } from "@web-games/lantern-loops-core";

export interface SceneProps {
  class?: string | undefined;
}

const VIEW = "0 0 400 600";

function Frame({
  id,
  from,
  to,
  className,
  children,
}: {
  id: string;
  from: string;
  to: string;
  className: string | undefined;
  children: preact.ComponentChildren;
}) {
  return (
    <svg
      class={className}
      viewBox={VIEW}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      data-fallback={id}
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color={from} />
          <stop offset="1" stop-color={to} />
        </linearGradient>
      </defs>
      <rect width="400" height="600" fill={`url(#${id}-sky)`} />
      {children}
    </svg>
  );
}

export function HarborScene({ class: className }: SceneProps) {
  return (
    <Frame id="backdrop-harbor" from="#12132E" to="#0E5A5F" className={className}>
      <circle cx="310" cy="120" r="46" fill="#F6EAD3" fill-opacity="0.85" />
      <path d="M0 380 Q100 350 200 380 T400 370 V600 H0Z" fill="#14456B" fill-opacity="0.7" />
      <path d="M0 430 Q100 405 200 430 T400 425 V600 H0Z" fill="#0E5A5F" fill-opacity="0.85" />
      <path d="M0 490 Q100 470 200 490 T400 485 V600 H0Z" fill="#0B3D45" />
      <path
        d="M60 372 L120 372 L108 396 L72 396Z M92 372 V340 L110 372Z"
        fill="#12132E"
        fill-opacity="0.85"
      />
      <path
        d="M260 392 L330 392 L316 416 L274 416Z M298 392 V352 L320 392Z"
        fill="#12132E"
        fill-opacity="0.85"
      />
      <rect x="20" y="410" width="10" height="70" fill="#12132E" />
      <rect x="370" y="420" width="10" height="70" fill="#12132E" />
    </Frame>
  );
}

export function GardenScene({ class: className }: SceneProps) {
  return (
    <Frame id="backdrop-garden" from="#161A3D" to="#0E4A44" className={className}>
      <circle cx="90" cy="110" r="38" fill="#F6EAD3" fill-opacity="0.8" />
      <path d="M0 360 Q120 300 240 350 T400 330 V600 H0Z" fill="#0E3F3B" />
      <path d="M0 440 Q140 390 260 440 T400 430 V600 H0Z" fill="#0B332F" />
      <path d="M0 520 Q150 490 400 520 V600 H0Z" fill="#082724" />
      <rect x="0" y="330" width="400" height="14" fill="#241B2F" fill-opacity="0.7" />
      <g fill="#E9657F" fill-opacity="0.55">
        <circle cx="70" cy="250" r="16" />
        <circle cx="92" cy="236" r="12" />
        <circle cx="330" cy="270" r="18" />
        <circle cx="352" cy="250" r="12" />
        <circle cx="310" cy="244" r="10" />
      </g>
      <path
        d="M70 400 H110 M200 470 H260 M290 410 H350"
        stroke="#F6EAD3"
        stroke-opacity="0.2"
        stroke-width="10"
        stroke-linecap="round"
      />
    </Frame>
  );
}

export function BridgeScene({ class: className }: SceneProps) {
  return (
    <Frame id="backdrop-bridge" from="#12132E" to="#1E2050" className={className}>
      <circle cx="200" cy="130" r="52" fill="#F6EAD3" fill-opacity="0.75" />
      <path d="M0 360 H400 V392 H0Z" fill="#241B2F" />
      <path
        d="M20 392 V440 Q60 360 100 440 V392Z M150 392 V440 Q190 360 230 440 V392Z M280 392 V440 Q320 360 360 440 V392Z"
        fill="#241B2F"
      />
      <rect x="0" y="440" width="400" height="160" fill="#0E5A5F" fill-opacity="0.75" />
      <path
        d="M20 450 Q60 520 100 450 M150 450 Q190 520 230 450 M280 450 Q320 520 360 450"
        fill="none"
        stroke="#F6EAD3"
        stroke-opacity="0.25"
        stroke-width="6"
      />
      <path
        d="M0 520 Q100 505 200 520 T400 515"
        fill="none"
        stroke="#F6EAD3"
        stroke-opacity="0.18"
        stroke-width="4"
      />
    </Frame>
  );
}

export function SkyScene({ class: className }: SceneProps) {
  return (
    <Frame id="backdrop-sky" from="#1E2050" to="#5B3F8C" className={className}>
      <g fill="#F6EAD3" fill-opacity="0.2">
        <ellipse cx="90" cy="380" rx="110" ry="34" />
        <ellipse cx="300" cy="440" rx="120" ry="38" />
        <ellipse cx="170" cy="510" rx="150" ry="44" />
      </g>
      <g fill="#F6EAD3" fill-opacity="0.12">
        <ellipse cx="320" cy="300" rx="80" ry="26" />
        <ellipse cx="60" cy="260" rx="70" ry="22" />
      </g>
      <g fill="#F2A33A" fill-opacity="0.8">
        <rect x="120" y="150" width="16" height="22" rx="6" />
        <rect x="270" y="110" width="14" height="19" rx="5" />
        <rect x="340" y="210" width="12" height="17" rx="5" />
      </g>
      <g fill="#E9657F" fill-opacity="0.75">
        <rect x="60" y="90" width="12" height="17" rx="5" />
        <rect x="200" y="230" width="14" height="19" rx="5" />
      </g>
    </Frame>
  );
}

export const BACKDROP_SCENES: Readonly<
  Record<ChapterId, (props: SceneProps) => preact.JSX.Element>
> = {
  harbor: HarborScene,
  garden: GardenScene,
  bridge: BridgeScene,
  sky: SkyScene,
};
