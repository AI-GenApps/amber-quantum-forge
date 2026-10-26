import { constellationById } from "@web-games/cloud-observatory-core";
import { figureBox, pathFor } from "../../sky/geometry";

/** Round emblem frame with the constellation drawn inside, viewBox 0 0 144 144. */
export function EmblemPlaceholder({ id }: { id: string }) {
  const def = constellationById.get(id);
  const box = def ? figureBox(def.stars, 90) : null;
  const scale = box ? 92 / box.width : 1;
  return (
    <>
      <defs>
        <radialGradient id={`co-emb-${id}`} cx="50%" cy="35%" r="70%">
          <stop offset="0" stop-color="#22335C" />
          <stop offset="1" stop-color="#0B1226" />
        </radialGradient>
      </defs>
      <circle cx="72" cy="72" r="66" fill={`url(#co-emb-${id})`} class="co-disc-ring" />
      <circle cx="72" cy="72" r="58" class="co-gl co-gl--thin" />
      {def && box ? (
        <g
          transform={`translate(${72 - 46} ${72 - 46}) scale(${scale}) translate(${-box.x} ${-box.y})`}
        >
          <path
            class="co-gl co-gl--fig"
            d={pathFor(def.stars, def.closed)}
            style={{ strokeWidth: 5 / scale }}
          />
          {def.stars.map((star, index) => (
            <circle key={index} class="co-gl-dot" cx={star.x} cy={star.y} r={9 / scale} />
          ))}
        </g>
      ) : null}
    </>
  );
}
