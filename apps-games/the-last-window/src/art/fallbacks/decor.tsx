import { C } from "./colors";

const SHADOW = <ellipse cx="50" cy="92" rx="34" ry="5" fill={C.ink} opacity="0.25" />;

export function Decor({ id }: { id: string }) {
  switch (id) {
    case "decor-1":
      return (
        <g data-decor={id}>
          {SHADOW}
          <rect x="6" y="66" width="88" height="22" rx="8" fill={C.wood} />
          <rect
            x="12"
            y="38"
            width="26"
            height="30"
            rx="8"
            fill={C.lamp}
            transform="rotate(-8 25 53)"
          />
          <rect x="38" y="34" width="26" height="34" rx="8" fill={C.teal} />
          <rect
            x="62"
            y="38"
            width="26"
            height="30"
            rx="8"
            fill={C.brick}
            transform="rotate(8 75 53)"
          />
          <path d="M44 42 L58 60 M58 42 L44 60" stroke={C.paper} stroke-width="2" opacity="0.6" />
        </g>
      );
    case "decor-2":
      return (
        <g data-decor={id}>
          {SHADOW}
          <ellipse cx="50" cy="86" rx="22" ry="6" fill={C.lampDeep} />
          <path d="M50 84 V44" stroke={C.lamp} stroke-width="6" />
          <path d="M50 44 L66 26" stroke={C.lamp} stroke-width="5" />
          <path d="M52 12 H84 L76 32 H60Z" fill={C.sage} stroke={C.forest} stroke-width="3" />
          <path d="M62 34 L58 44 L78 44 L74 34Z" fill={C.glow} opacity="0.7" />
        </g>
      );
    case "decor-3":
      return (
        <g data-decor={id}>
          {SHADOW}
          <path d="M28 58 H72 L66 90 H34Z" fill={C.terracotta} />
          <rect x="24" y="52" width="52" height="10" rx="3" fill={C.brick} />
          <g stroke={C.sage} stroke-width="4" stroke-linecap="round" fill="none">
            <path d="M50 52 V14 M50 40 L34 24 M50 40 L66 22 M50 30 L40 14 M50 30 L60 12" />
          </g>
        </g>
      );
    case "decor-4":
      return (
        <g data-decor={id}>
          {SHADOW}
          <ellipse cx="50" cy="84" rx="30" ry="6" fill={C.paperDark} />
          <rect x="46" y="64" width="8" height="20" fill={C.paperDark} />
          <ellipse cx="50" cy="64" rx="34" ry="7" fill={C.rain} />
          <path
            d="M22 62 C22 22 78 22 78 62Z"
            fill={C.paper}
            opacity="0.35"
            stroke={C.rain}
            stroke-width="3"
          />
          <circle cx="50" cy="20" r="4" fill={C.rain} />
          <ellipse cx="50" cy="56" rx="18" ry="9" fill={C.lamp} />
        </g>
      );
    case "decor-5":
      return (
        <g data-decor={id}>
          {SHADOW}
          <rect x="4" y="10" width="92" height="6" rx="3" fill={C.lampDeep} />
          <path
            d="M34 16 L22 90 M66 16 L78 90"
            stroke={C.wood}
            stroke-width="7"
            stroke-linecap="round"
          />
          <g stroke={C.wood} stroke-width="5">
            <path d="M30 36 H70 M27 56 H73 M24 76 H76" />
          </g>
        </g>
      );
    case "decor-6":
      return (
        <g data-decor={id}>
          {SHADOW}
          <rect x="10" y="14" width="80" height="68" rx="4" fill={C.wood} />
          <rect x="18" y="22" width="64" height="52" fill={C.paperDark} />
          <path
            d="M26 58 C34 38 44 62 54 44 C64 30 70 52 76 36"
            stroke={C.nightMid}
            stroke-width="3"
            fill="none"
          />
          <circle cx="62" cy="62" r="7" stroke={C.brick} stroke-width="2" fill="none" />
          <path d="M62 55 V69 M55 62 H69" stroke={C.brick} stroke-width="2" />
        </g>
      );
    case "decor-7":
      return (
        <g data-decor={id}>
          <path d="M20 8 H80" stroke={C.wood} stroke-width="6" stroke-linecap="round" />
          <g stroke={C.lampDeep} stroke-width="1.5">
            <path d="M28 10 V30 M42 10 V24 M58 10 V28 M72 10 V22" />
          </g>
          {[
            [28, 30, 40],
            [42, 24, 52],
            [58, 28, 46],
            [72, 22, 56],
          ].map(([x, y, h]) => (
            <rect
              key={x}
              x={(x as number) - 5}
              y={y}
              width="10"
              height={h as number}
              rx="4"
              fill={C.lamp}
            />
          ))}
          <circle cx="50" cy="82" r="7" fill={C.sky} stroke={C.rain} stroke-width="2" />
        </g>
      );
    case "decor-8":
      return (
        <g data-decor={id}>
          {SHADOW}
          <rect x="30" y="62" width="40" height="8" rx="3" fill={C.wood} />
          <path
            d="M36 70 L32 92 M64 70 L68 92"
            stroke={C.wood}
            stroke-width="6"
            stroke-linecap="round"
          />
          <rect x="30" y="50" width="40" height="14" rx="3" fill={C.lampDeep} />
          <path
            d="M50 50 C50 30 46 18 38 10 C60 4 90 14 92 40 C82 36 66 38 60 50Z"
            fill={C.lamp}
            stroke={C.lampDeep}
            stroke-width="3"
          />
          <circle cx="40" cy="57" r="4" fill={C.glow} />
        </g>
      );
    default:
      return null;
  }
}
