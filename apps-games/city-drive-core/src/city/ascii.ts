import { indexTiles, tileKey } from "./coords";
import { type Dir, headingToDir } from "./direction";
import { tileSockets } from "./road-sockets";
import type { CityMap, CityTile } from "./types";

const ROAD_GLYPHS: Readonly<Record<string, string>> = {
  NESW: "┼",
  ESW: "┬",
  NSW: "┤",
  NEW: "┴",
  NES: "├",
  NS: "│",
  EW: "─",
  NE: "└",
  ES: "┌",
  SW: "┐",
  NW: "┘",
  N: "╵",
  E: "╶",
  S: "╷",
  W: "╴",
};

const SPAWN_GLYPHS: Readonly<Record<Dir, string>> = { N: "^", E: ">", S: "v", W: "<" };

function glyph(tile: CityTile | undefined): string {
  if (!tile) return ".";
  switch (tile.kind) {
    case "road":
      return ROAD_GLYPHS[tileSockets(tile).join("")] ?? "?";
    case "building":
      return "B";
    case "park":
      return "p";
    case "plaza":
      return "o";
    default:
      return ".";
  }
}

/** Render a map as text. Each tile is a glyph plus a connector that continues roads eastward. */
export function renderMapAscii(map: CityMap): string {
  const tiles = indexTiles(map);
  const spawnDir = headingToDir(map.spawn.heading);
  const pad = String(map.height - 1).length;
  const header = Array.from({ length: map.width }, (_, x) => `${x % 10} `).join("");
  const lines = [`${" ".repeat(pad)} ${header.trimEnd()}`];
  for (let y = 0; y < map.height; y++) {
    let row = "";
    for (let x = 0; x < map.width; x++) {
      const tile = tiles.get(tileKey(x, y));
      const isSpawn = x === map.spawn.x && y === map.spawn.y && spawnDir !== undefined;
      row += isSpawn ? SPAWN_GLYPHS[spawnDir] : glyph(tile);
      row += tile && tileSockets(tile).includes("E") ? "─" : " ";
    }
    lines.push(`${String(y).padStart(pad)} ${row.trimEnd()}`);
  }
  const legend =
    "road: ┼┬┤┴├ T/cross, │─ straight, └┌┐┘ corner, ╵╶╷╴ road-end; B building, p park, o plaza, . empty; ^>v< spawn";
  lines.push("", `${map.id} ${map.width}x${map.height} tile=${map.tile_size_m}m`, legend);
  return lines.join("\n");
}
