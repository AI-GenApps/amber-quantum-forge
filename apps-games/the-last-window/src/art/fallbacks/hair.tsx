import { C } from "./colors";
import type { HairStyle, Look } from "./looks";

/** Hair or headwear that sits behind the head. */
export function HairBack({ look }: { look: Look }) {
  const hair = look.hair;
  switch (look.style) {
    case "bun":
      return <circle cx="226" cy="205" r="22" fill={hair} />;
    case "braid":
      return (
        <g fill={hair}>
          <path d="M92 150 C80 240 86 260 96 262 L120 200 Z" />
          <path d="M208 150 C220 240 214 260 204 262 L180 200 Z" />
        </g>
      );
    case "curls":
      return (
        <g fill={hair}>
          {[
            [92, 120],
            [78, 150],
            [84, 184],
            [208, 120],
            [222, 150],
            [216, 184],
            [110, 78],
            [150, 66],
            [190, 78],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="26" />
          ))}
        </g>
      );
    case "bob":
      return (
        <path
          d="M82 130 C70 220 80 236 110 232 L110 130 Z M218 130 C230 220 220 236 190 232 L190 130 Z"
          fill={hair}
        />
      );
    case "messy":
      return <circle cx="150" cy="58" r="26" fill={hair} />;
    default:
      return null;
  }
}

function Hairline({ fill, d }: { fill: string; d: string }) {
  return <path d={d} fill={fill} />;
}

const CAPS: Readonly<Record<HairStyle, string>> = {
  bun: "M84 150 C80 78 220 78 216 150 C198 112 102 112 84 150Z",
  cap: "M86 140 C84 90 216 90 214 140 C196 118 104 118 86 140Z",
  braid: "M84 150 C80 80 220 80 216 150 C200 108 100 108 84 150Z",
  curls: "M90 130 C96 84 204 84 210 130 C190 108 110 108 90 130Z",
  flatcap: "M84 130 C86 84 214 84 216 130 Z",
  bob: "M82 160 C76 70 224 70 218 160 C204 110 96 110 82 160Z",
  wispy: "M96 110 C110 96 190 96 204 110 C190 106 110 106 96 110Z",
  messy: "M84 150 C80 80 220 80 216 150 C198 112 102 112 84 150Z",
};

/** Hair or headwear in front of the forehead. */
export function HairFront({ look }: { look: Look }) {
  const hair = look.hair;
  switch (look.style) {
    case "cap":
      return (
        <g>
          <Hairline fill={hair} d="M96 142 C100 126 112 120 124 124 L112 148 Z" />
          <path d="M82 138 C82 70 218 70 218 138 Z" fill={look.trim} />
          <rect x="80" y="122" width="140" height="22" rx="8" fill={C.lamp} opacity="0.85" />
          <path
            d="M98 122 V144 M120 122 V144 M142 122 V144 M164 122 V144 M186 122 V144 M204 122 V144"
            stroke={look.trim}
            stroke-width="3"
          />
        </g>
      );
    case "flatcap":
      return (
        <g>
          <path d="M80 132 C84 84 216 84 220 132 Z" fill={C.tweed} />
          <path d="M70 132 H230 C230 144 70 144 70 132Z" fill={C.inkSoft} />
          <path
            d="M96 100 L118 128 M126 94 L146 128 M158 94 L176 128 M190 100 L204 128"
            stroke={C.paperDark}
            stroke-width="2"
            opacity="0.5"
          />
          <path
            d="M84 150 C84 160 90 168 94 172 L96 140Z M216 150 C216 160 210 168 206 172 L204 140Z"
            fill={hair}
          />
        </g>
      );
    case "curls":
      return (
        <g>
          <Hairline fill={hair} d={CAPS.curls} />
          <rect x="80" y="104" width="140" height="14" rx="7" fill={C.lamp} />
        </g>
      );
    case "messy":
      return (
        <g>
          <Hairline fill={hair} d={CAPS.messy} />
          <path d="M120 40 L186 74" stroke={C.ink} stroke-width="5" stroke-linecap="round" />
          <path d="M120 40 L123 36" stroke={C.lamp} stroke-width="5" stroke-linecap="round" />
        </g>
      );
    case "bob":
      return (
        <g>
          <Hairline fill={hair} d={CAPS.bob} />
          <path
            d="M132 86 C128 108 126 124 126 140"
            stroke={C.silver}
            stroke-width="6"
            stroke-linecap="round"
            fill="none"
          />
        </g>
      );
    case "wispy":
      return (
        <g stroke={hair} stroke-width="5" stroke-linecap="round" fill="none">
          <path d="M96 118 C110 96 190 96 204 118" />
          <path d="M92 150 C86 136 88 126 94 120" />
          <path d="M208 150 C214 136 212 126 206 120" />
          <path d="M118 88 C130 76 150 74 168 80" />
        </g>
      );
    default:
      return <Hairline fill={hair} d={CAPS[look.style]} />;
  }
}
