import type { Weather } from "@web-games/the-last-window-core";
import { C } from "./colors";

interface Scene {
  sky: string;
  horizon: string;
  water: string;
  wall: string;
  glowOpacity: number;
  tint: string | null;
  tintOpacity: number;
}

const SCENES: Readonly<Record<Weather, Scene>> = {
  morning: {
    sky: C.sky,
    horizon: C.glow,
    water: C.rain,
    wall: C.nightMid,
    glowOpacity: 0.28,
    tint: C.lamp,
    tintOpacity: 0.12,
  },
  evening: {
    sky: C.night,
    horizon: C.nightMid,
    water: C.navy,
    wall: C.wall,
    glowOpacity: 0.55,
    tint: null,
    tintOpacity: 0,
  },
  rain: {
    sky: C.denim,
    horizon: C.rain,
    water: C.nightMid,
    wall: C.wall,
    glowOpacity: 0.4,
    tint: C.rain,
    tintOpacity: 0.1,
  },
};

const STREAKS: readonly (readonly [number, number, number])[] = [
  [128, 70, 34],
  [150, 120, 40],
  [172, 60, 36],
  [194, 150, 44],
  [214, 90, 38],
  [236, 40, 34],
  [258, 130, 42],
  [276, 80, 36],
  [140, 190, 38],
  [184, 210, 40],
  [226, 180, 34],
  [266, 200, 38],
];

const SHELF_BOOKS: readonly string[] = [
  C.brick,
  C.teal,
  C.lamp,
  C.sage,
  C.paperDark,
  C.nightMid,
  C.lampDeep,
];

function Shelf({ x, y, flip }: { x: number; y: number; flip: boolean }) {
  return (
    <g transform={flip ? `translate(${x + 80} ${y}) scale(-1 1)` : `translate(${x} ${y})`}>
      <rect x="0" y="62" width="80" height="8" rx="2" fill={C.wood} />
      {SHELF_BOOKS.map((fill, index) => (
        <rect
          key={fill}
          x={4 + index * 10.5}
          y={62 - (28 + ((index * 7) % 14))}
          width="9"
          height={28 + ((index * 7) % 14)}
          rx="1.5"
          fill={fill}
        />
      ))}
    </g>
  );
}

/** Arched window top centre, shelves and counter in the lower third, a calm centre for the UI. */
export function Interior({ weather }: { weather: Weather }) {
  const scene = SCENES[weather];
  const glow = `tlw-glow-${weather}`;
  return (
    <g data-weather={weather}>
      <defs>
        <radialGradient id={glow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color={C.lamp} stop-opacity={scene.glowOpacity} />
          <stop offset="100%" stop-color={C.lamp} stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="600" fill={scene.wall} />
      <path d="M0 300 H400 M0 360 H400" stroke={C.night} stroke-width="2" opacity="0.4" />
      <path d="M96 290 V130 A104 104 0 0 1 304 130 V290Z" fill={C.paperDark} opacity="0.9" />
      <path d="M108 284 V130 A92 92 0 0 1 292 130 V284Z" fill={scene.sky} />
      <rect x="108" y="196" width="184" height="88" fill={scene.horizon} opacity="0.5" />
      <rect x="108" y="226" width="184" height="58" fill={scene.water} />
      <path
        d="M124 246 H176 M214 258 H268 M146 270 H198"
        stroke={C.paper}
        stroke-width="2"
        opacity="0.35"
      />
      <path d="M200 38 V284 M108 168 H292" stroke={C.paperDark} stroke-width="6" />
      {weather === "rain" ? (
        <g stroke={C.paper} stroke-width="2.5" stroke-linecap="round" opacity="0.55">
          {STREAKS.map(([x, y, length]) => (
            <line key={`${x}-${y}`} class="tlw-rain" x1={x} y1={y} x2={x - 4} y2={y + length} />
          ))}
        </g>
      ) : null}
      {weather === "morning" ? (
        <circle cx="250" cy="96" r="22" fill={C.glow} opacity="0.7" />
      ) : null}
      <circle cx="200" cy="300" r="170" fill={`url(#${glow})`} />
      {scene.tint ? (
        <rect width="400" height="600" fill={scene.tint} opacity={scene.tintOpacity} />
      ) : null}
      <Shelf x={14} y={380} flip={false} />
      <Shelf x={306} y={380} flip />
      <Shelf x={14} y={310} flip={false} />
      <Shelf x={306} y={310} flip />
      <path d="M200 20 V40" stroke={C.inkSoft} stroke-width="3" />
      <rect x="0" y="486" width="400" height="114" fill={C.night} />
      <rect x="0" y="480" width="400" height="14" fill={C.wood} />
      <path d="M0 540 H400" stroke={C.nightMid} stroke-width="3" opacity="0.6" />
      {weather === "rain" ? (
        <g>
          <path d="M360 470 L372 420 L384 470Z" fill={C.brick} />
          <path d="M372 420 V486" stroke={C.ink} stroke-width="3" />
        </g>
      ) : null}
      <circle cx="56" cy="456" r="10" fill={C.glow} opacity="0.9" />
    </g>
  );
}
