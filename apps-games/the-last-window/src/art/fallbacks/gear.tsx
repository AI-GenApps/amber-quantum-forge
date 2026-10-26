import { C } from "./colors";
import { EYE_Y } from "./face";
import type { Gear, Look } from "./looks";

/** Worn items drawn over the outfit, below the face. */
export function BodyGear({ gear, look }: { gear: Gear; look: Look }) {
  switch (gear) {
    case "overalls":
      return (
        <g>
          <path
            d="M96 318 L120 352 L120 400 L96 400Z M204 318 L180 352 L180 400 L204 400Z"
            fill={look.outfit}
          />
          <rect x="112" y="344" width="76" height="56" rx="6" fill={look.outfit} />
          <circle cx="120" cy="352" r="5" fill={C.lamp} />
          <circle cx="180" cy="352" r="5" fill={C.lamp} />
          <ellipse cx="150" cy="372" rx="16" ry="8" fill={C.ink} opacity="0.35" />
        </g>
      );
    case "satchel":
      return (
        <g>
          <path d="M70 330 L224 400" stroke={C.brown} stroke-width="14" />
          <rect x="196" y="352" width="70" height="48" rx="8" fill={C.brown} />
          <rect x="204" y="360" width="54" height="10" rx="4" fill={C.lampDeep} />
        </g>
      );
    case "apron":
      return (
        <g>
          <path d="M104 316 H196 L206 400 H94Z" fill={C.paper} opacity="0.92" />
          <path
            d="M104 316 L126 300 M196 316 L174 300"
            stroke={C.paperDark}
            stroke-width="8"
            stroke-linecap="round"
          />
          <circle cx="132" cy="360" r="5" fill={C.paperDark} />
          <circle cx="176" cy="372" r="4" fill={C.paperDark} />
        </g>
      );
    case "headphones":
      return (
        <g>
          <path
            d="M96 290 C96 340 204 340 204 290"
            stroke={C.coal}
            stroke-width="14"
            fill="none"
            stroke-linecap="round"
          />
          <rect x="84" y="272" width="26" height="40" rx="12" fill={C.ink} />
          <rect x="190" y="272" width="26" height="40" rx="12" fill={C.ink} />
        </g>
      );
    case "vest":
      return (
        <g>
          <path
            d="M60 400 C62 346 96 314 122 306 L134 400Z M240 400 C238 346 204 314 178 306 L166 400Z"
            fill={look.trim}
          />
          <circle cx="130" cy="352" r="4" fill={C.ink} />
          <circle cx="130" cy="376" r="4" fill={C.ink} />
        </g>
      );
    case "stethoscope":
      return (
        <g fill="none" stroke={C.ink} stroke-width="6" stroke-linecap="round">
          <path d="M112 300 C100 360 142 380 150 350 C158 380 200 360 188 300" />
          <circle cx="150" cy="352" r="9" fill={C.rain} stroke-width="4" />
        </g>
      );
    case "bowtie":
      return (
        <g fill={look.trim}>
          <path d="M150 304 L122 292 L122 318Z M150 304 L178 292 L178 318Z" />
          <circle cx="150" cy="304" r="7" />
        </g>
      );
    case "scarf":
      return (
        <g>
          <path
            d="M100 286 C130 316 170 316 200 286 L214 312 C170 344 130 344 86 312Z"
            fill={look.trim}
          />
          <circle cx="132" cy="322" r="3" fill={C.lamp} />
          <circle cx="166" cy="326" r="3" fill={C.brick} />
          <path d="M176 330 L196 388 L172 392Z" fill={look.trim} />
        </g>
      );
    default:
      return null;
  }
}

/** Items on the face: glasses, moustache, freckles. */
export function FaceGear({ gear, look }: { gear: Gear; look: Look }) {
  const frame = { fill: "none", stroke: C.ink, "stroke-width": 4 } as const;
  switch (gear) {
    case "round-glasses":
      return (
        <g {...frame}>
          <circle cx="124" cy={EYE_Y} r="17" />
          <circle cx="176" cy={EYE_Y} r="17" />
          <path d="M141 152 H159" />
          <path
            d="M107 156 C90 190 96 226 112 262 M193 156 C210 190 204 226 188 262"
            stroke-width="2"
          />
        </g>
      );
    case "tortoise-glasses":
      return (
        <g {...frame} stroke={C.lampDeep} stroke-width="6">
          <circle cx="124" cy={EYE_Y} r="18" />
          <circle cx="176" cy={EYE_Y} r="18" />
          <path d="M142 150 H158" />
        </g>
      );
    case "spectacles":
      return (
        <g {...frame} stroke={C.inkSoft} stroke-width="3">
          <rect x="106" y="138" width="36" height="28" rx="6" />
          <rect x="158" y="138" width="36" height="28" rx="6" />
          <path d="M142 150 H158" />
          <path d="M106 150 C90 200 100 240 112 262" stroke-width="2" />
        </g>
      );
    case "moustache":
      return (
        <path
          d="M150 188 C136 176 112 186 108 198 C124 196 138 200 150 192 C162 200 176 196 192 198 C188 186 164 176 150 188Z"
          fill={look.hair}
        />
      );
    case "freckles":
      return (
        <g fill={C.brown} opacity="0.55">
          {[
            [112, 174],
            [122, 180],
            [132, 174],
            [168, 174],
            [178, 180],
            [188, 174],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" />
          ))}
        </g>
      );
    default:
      return null;
  }
}
