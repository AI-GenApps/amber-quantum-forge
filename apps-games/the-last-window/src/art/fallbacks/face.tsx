import type { Face } from "@web-games/the-last-window-core";
import { C } from "./colors";

export const EYE_Y = 152 as const;

/** Eyes, brows, cheeks and mouth for one expression, drawn on a 300 x 400 bust. */
export function FaceMarks({ face, ink = C.ink }: { face: Face; ink?: string }) {
  const stroke = {
    stroke: ink,
    "stroke-width": 4,
    "stroke-linecap": "round",
    fill: "none",
  } as const;
  return (
    <g data-face={face}>
      {face === "happy" ? (
        <>
          <path d={`M114 ${EYE_Y + 3} Q124 ${EYE_Y - 9} 134 ${EYE_Y + 3}`} {...stroke} />
          <path d={`M166 ${EYE_Y + 3} Q176 ${EYE_Y - 9} 186 ${EYE_Y + 3}`} {...stroke} />
          <ellipse cx="108" cy="178" rx="13" ry="8" fill={C.brick} opacity="0.22" />
          <ellipse cx="192" cy="178" rx="13" ry="8" fill={C.brick} opacity="0.22" />
          <path
            d="M126 190 Q150 216 174 190 Q150 198 126 190Z"
            fill={C.ink}
            stroke={C.ink}
            stroke-width="3"
            stroke-linejoin="round"
          />
        </>
      ) : (
        <>
          <ellipse cx="124" cy={EYE_Y} rx="5.5" ry="7" fill={ink} />
          <ellipse cx="176" cy={EYE_Y} rx="5.5" ry="7" fill={ink} />
          {face === "sad" ? (
            <>
              <path d="M108 140 L136 131" {...stroke} />
              <path d="M192 140 L164 131" {...stroke} />
              <path d="M134 206 Q150 190 166 206" {...stroke} />
              <path
                d="M178 168 Q180 176 177 182"
                stroke={C.rain}
                stroke-width="4"
                stroke-linecap="round"
                fill="none"
              />
            </>
          ) : (
            <>
              <path d="M110 136 L136 134" {...stroke} />
              <path d="M190 136 L164 134" {...stroke} />
              <path d="M136 198 Q150 203 164 198" {...stroke} />
            </>
          )}
        </>
      )}
      <path
        d="M147 160 Q142 176 150 178"
        stroke={ink}
        stroke-width="3"
        stroke-linecap="round"
        fill="none"
        opacity="0.5"
      />
    </g>
  );
}
