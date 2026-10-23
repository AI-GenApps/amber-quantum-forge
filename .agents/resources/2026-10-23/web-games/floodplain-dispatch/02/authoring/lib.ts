import { evaluate } from "../../../../../../../apps-games/floodplain-dispatch-core/src/evaluate";
import { runSeason } from "../../../../../../../apps-games/floodplain-dispatch-core/src/simulate";
import { createBoard } from "../../../../../../../apps-games/floodplain-dispatch-core/src/board";
import type { MapDef, Placement } from "../../../../../../../apps-games/floodplain-dispatch-core/src/types";
export { evaluate, runSeason, createBoard };
export type { MapDef, Placement };

export function show(def: MapDef, pl: Placement[], week?: number): string {
  const b = createBoard(def);
  const r = runSeason(def, pl);
  const frame = r.weekFrames[week ?? r.weeks - 1] as Uint8Array;
  const lines: string[] = [];
  for (let y = 0; y < b.height; y++) {
    let s = "";
    for (let x = 0; x < b.width; x++) {
      const i = y * b.width + x;
      const p = pl.find((q) => q.x === x && q.y === y);
      const k = b.kinds[i];
      const ch = p ? { canal: "c", barrier: "b", pump: "p", gate: "g", reservoir: "r" }[p.kind] : { land: ".", house: "H", field: "F", scenery: "T", inlet: "I", sea: "S" }[k as string];
      s += `${ch}${b.heights[i]}:${String(frame[i]).padStart(2, " ")} `;
    }
    lines.push(s);
  }
  return lines.join("\n");
}
