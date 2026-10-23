import type { Placement } from "../src";
import { createBoard, evaluate, getMap, runSeason, totalCost } from "../src";

const GLYPH: Readonly<Record<string, string>> = {
  canal: "c",
  barrier: "b",
  pump: "p",
  gate: "g",
  reservoir: "r",
};
const BASE: Readonly<Record<string, string>> = {
  land: ".",
  house: "H",
  field: "F",
  scenery: "T",
  inlet: "I",
  sea: "S",
};

function boardText(id: string, placements: readonly Placement[], week: number | null): string {
  const map = getMap(id);
  const board = createBoard(map);
  const result = runSeason(map, placements);
  const frame = week === null ? null : result.weekFrames[week];
  const rows: string[] = [];
  for (let y = 0; y < board.height; y++) {
    const cells: string[] = [];
    for (let x = 0; x < board.width; x++) {
      const index = y * board.width + x;
      const piece = placements.find((entry) => entry.x === x && entry.y === y);
      const glyph = piece ? GLYPH[piece.kind] : BASE[board.kinds[index] as string];
      const depth = frame ? String(frame[index]).padStart(2, " ") : "";
      cells.push(`${glyph}${board.heights[index]}${frame ? `:${depth}` : ""}`);
    }
    rows.push(cells.join(" "));
  }
  return rows.join("\n");
}

function main(): void {
  const [id, weekArg] = process.argv.slice(2);
  if (!id) {
    console.log("usage: bun scripts/report-map.ts <map id> [week]");
    return;
  }
  const map = getMap(id);
  const evaluation = evaluate(map, runSeason(map, map.reference), map.reference);
  const week = weekArg === undefined ? null : Number(weekArg);
  console.log(
    `${map.id} ${map.name}: par ${map.par}, budget ${map.budget}, cost ${totalCost(map.reference)}`,
  );
  console.log(
    `stars ${evaluation.stars}, flooded ${evaluation.housesFlooded}, score ${evaluation.score}`,
  );
  console.log(boardText(id, map.reference, week));
  const badges = runSeason(map, map.reference).metrics;
  for (const house of badges.houses) {
    console.log(
      `house ${house.x},${house.y}: supplied ${house.suppliedSteps}, flooded ${house.floodedSteps}`,
    );
  }
  for (const field of badges.fields)
    console.log(`field ${field.x},${field.y}: wet ${field.wetSteps}`);
}

main();
