import { backdropStars } from "../../sky/geometry";

function Stars({
  count,
  seed,
  width,
  height,
}: {
  count: number;
  seed: number;
  width: number;
  height: number;
}) {
  return (
    <>
      {backdropStars(count, seed).map((star, index) => (
        <circle
          key={index}
          class="co-gl-dot"
          cx={(star.x / 1000) * width}
          cy={(star.y / 1400) * height}
          r={star.r * 0.6}
        />
      ))}
    </>
  );
}

/** Opaque navy sky, viewBox 0 0 390 585. */
export function SkyFarPlaceholder() {
  return (
    <>
      <defs>
        <linearGradient id="co-sky-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0B1226" />
          <stop offset="0.7" stop-color="#16244A" />
          <stop offset="1" stop-color="#27386B" />
        </linearGradient>
      </defs>
      <rect width="390" height="585" fill="url(#co-sky-far)" />
      <Stars count={46} seed={11} width={390} height={585} />
    </>
  );
}

export function NebulaPlaceholder() {
  return (
    <>
      <defs>
        <radialGradient id="co-neb-a" cx="30%" cy="28%" r="45%">
          <stop offset="0" stop-color="#6FB3BD" stop-opacity="0.32" />
          <stop offset="1" stop-color="#6FB3BD" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="co-neb-b" cx="74%" cy="52%" r="42%">
          <stop offset="0" stop-color="#D98BA0" stop-opacity="0.26" />
          <stop offset="1" stop-color="#D98BA0" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="390" height="585" fill="url(#co-neb-a)" />
      <rect width="390" height="585" fill="url(#co-neb-b)" />
    </>
  );
}

export function HillsPlaceholder() {
  return (
    <>
      <path class="co-hill" d="M0 470 Q70 430 140 460 T280 440 T390 462 V585 H0 Z" />
      <path class="co-hill co-hill--near" d="M0 520 Q90 490 180 516 T390 504 V585 H0 Z" />
    </>
  );
}

export function BuildingPlaceholder() {
  return (
    <>
      <defs>
        <linearGradient id="co-bld" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#22335C" />
          <stop offset="1" stop-color="#0B1226" />
        </linearGradient>
      </defs>
      <path d="M60 300 V190 H260 V300 Z" fill="url(#co-bld)" class="co-gl" />
      <path d="M90 190 A70 70 0 0 1 230 190 Z" fill="url(#co-bld)" class="co-gl" />
      <path class="co-gl" d="M150 130 L196 98 L206 112 L160 144" />
      <path class="co-gl" d="M160 190 V120 M120 300 V250 H200 V300" />
      <circle class="co-gl-dot" cx="270" cy="70" r="4" />
      <circle class="co-gl-dot" cx="52" cy="110" r="3" />
    </>
  );
}

/** Title key art, viewBox 0 0 360 540. */
export function KeyArtPlaceholder() {
  return (
    <>
      <defs>
        <linearGradient id="co-key-art" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0B1226" />
          <stop offset="0.65" stop-color="#1E2D5E" />
          <stop offset="1" stop-color="#4A4F7C" />
        </linearGradient>
        <radialGradient id="co-key-glow" cx="50%" cy="38%" r="50%">
          <stop offset="0" stop-color="#EBCB85" stop-opacity="0.35" />
          <stop offset="1" stop-color="#EBCB85" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="360" height="540" fill="url(#co-key-art)" />
      <rect width="360" height="540" fill="url(#co-key-glow)" />
      <Stars count={60} seed={23} width={360} height={540} />
      <circle class="co-gl" cx="180" cy="190" r="90" />
      <circle class="co-gl co-gl--thin" cx="180" cy="190" r="106" />
      <path
        class="co-gl"
        d="M180 120 L190 176 L246 190 L190 204 L180 260 L170 204 L114 190 L170 176 Z"
      />
      <path class="co-hill" d="M0 430 Q90 390 180 420 T360 404 V540 H0 Z" />
      <path class="co-gl" d="M130 430 V400 H230 V430 M150 400 A30 30 0 0 1 210 400" />
    </>
  );
}

export function IconPlaceholder() {
  return (
    <>
      <rect width="512" height="512" rx="96" fill="#101A33" />
      <circle class="co-gl" cx="256" cy="256" r="150" style={{ strokeWidth: 12 }} />
      <path
        class="co-gl"
        style={{ strokeWidth: 12 }}
        d="M256 120 L280 232 L392 256 L280 280 L256 392 L232 280 L120 256 L232 232 Z"
      />
    </>
  );
}

export function FeaturePlaceholder() {
  return (
    <>
      <rect width="768" height="512" fill="#101A33" />
      <Stars count={70} seed={5} width={768} height={512} />
      <path class="co-hill" d="M0 420 Q190 360 384 410 T768 396 V512 H0 Z" />
      <circle class="co-gl" cx="384" cy="200" r="90" />
    </>
  );
}
