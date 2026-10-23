import { C } from "./colors";

/** Arched window with a lit lamp: icon, key art and feature graphic fallbacks. */
export function LampWindow({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-70 120 V-10 A70 70 0 0 1 70 -10 V120Z" fill={C.paperDark} />
      <path d="M-58 112 V-10 A58 58 0 0 1 58 -10 V112Z" fill={C.night} />
      <path d="M0 -68 V112 M-58 40 H58" stroke={C.paperDark} stroke-width="5" />
      <circle cx="0" cy="62" r="46" fill={C.lamp} opacity="0.3" />
      <circle cx="0" cy="62" r="26" fill={C.lamp} opacity="0.5" />
      <path d="M-14 100 H14 L10 84 H-10Z" fill={C.lampDeep} />
      <path d="M-12 84 C-12 56 12 56 12 84Z" fill={C.glow} />
    </g>
  );
}

export function IconBadge() {
  return (
    <g>
      <rect width="100" height="100" rx="22" fill={C.night} />
      <LampWindow x={50} y={34} scale={0.38} />
    </g>
  );
}

export function KeyArt() {
  return (
    <g>
      <defs>
        <linearGradient id="tlw-key-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color={C.night} />
          <stop offset="100%" stop-color={C.nightMid} />
        </linearGradient>
      </defs>
      <rect width="400" height="600" fill="url(#tlw-key-sky)" />
      <LampWindow x={200} y={170} scale={1.7} />
      <rect x="0" y="500" width="400" height="100" fill={C.wall} />
      <rect x="0" y="494" width="400" height="10" fill={C.wood} />
    </g>
  );
}

export function FeatureGraphic() {
  return (
    <g>
      <rect width="600" height="400" fill={C.night} />
      <LampWindow x={300} y={110} scale={1.4} />
    </g>
  );
}
