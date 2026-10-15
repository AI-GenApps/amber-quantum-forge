import { indexTiles, tileKey } from "./coords";
import { DIR_VEC, type Dir, headingToDir, oppositeDir } from "./direction";
import { type CityManifest, modelById } from "./manifest";
import { parseCityMap } from "./parse";
import { hasRoadSockets, tileSockets } from "./road-sockets";
import { type CityMap, CityMapError, type CityMapIssue, type CityTile } from "./types";

type Collect = (issue: CityMapIssue) => void;

function at(tile: CityTile, code: CityMapIssue["code"], message: string): CityMapIssue {
  return { code, message, x: tile.x, y: tile.y };
}

function checkModel(tile: CityTile, manifest: CityManifest, add: Collect): void {
  if (tile.model === undefined) {
    if (tile.kind === "road" || tile.kind === "building") {
      add(at(tile, "missing-model", `${tile.kind} tiles need a model`));
    }
    return;
  }
  const model = modelById(manifest, tile.model);
  if (!model) {
    add(at(tile, "unknown-model", `model "${tile.model}" is not in the asset manifest`));
    return;
  }
  const wanted = tile.kind === "road" || tile.kind === "building" ? tile.kind : undefined;
  const bad = wanted ? model.kind !== wanted : model.kind === "road" || model.kind === "car";
  if (bad) {
    add(
      at(
        tile,
        "wrong-model-kind",
        `model "${tile.model}" is a ${model.kind}, not valid for a ${tile.kind} tile`,
      ),
    );
    return;
  }
  if (tile.kind === "road" && !hasRoadSockets(tile.model)) {
    add(at(tile, "unknown-road-model", `road model "${tile.model}" has no entry in ROAD_SOCKETS`));
  }
}

function checkSockets(
  map: CityMap,
  tile: CityTile,
  tiles: Map<string, CityTile>,
  add: Collect,
): void {
  for (const dir of tileSockets(tile)) {
    const { dx, dz } = DIR_VEC[dir];
    const nx = tile.x + dx;
    const ny = tile.y + dz;
    if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) {
      add(at(tile, "socket-outside-map", `road edge ${dir} leaves the map at (${nx},${ny})`));
      continue;
    }
    const neighbour = tiles.get(tileKey(nx, ny));
    if (neighbour?.kind !== "road") {
      const found = neighbour ? neighbour.kind : "empty";
      add(at(tile, "socket-mismatch", `road edge ${dir} faces ${found} tile (${nx},${ny})`));
    } else if (!tileSockets(neighbour).includes(oppositeDir(dir))) {
      add(
        at(tile, "socket-mismatch", `road edge ${dir} meets a closed edge of road (${nx},${ny})`),
      );
    }
  }
}

function checkSpawn(map: CityMap, tiles: Map<string, CityTile>, add: Collect): void {
  const { x, y, heading } = map.spawn;
  const bad = (message: string) => add({ code: "invalid-spawn", message, x, y });
  const dir: Dir | undefined = headingToDir(heading);
  if (dir === undefined) {
    bad(`heading ${heading} must be 0, 90, 180 or 270`);
    return;
  }
  const tile = tiles.get(tileKey(x, y));
  if (tile?.kind !== "road") {
    bad("spawn must be on a road tile");
    return;
  }
  const open = tileSockets(tile);
  if (!open.includes(dir) || !open.includes(oppositeDir(dir))) {
    bad(`spawn tile has no straight lane along heading ${heading} (open edges ${open.join("")})`);
  }
}

/** Check every rule that needs the manifest or neighbours. Returns issues sorted by tile. */
export function validateCityMap(map: CityMap, manifest: CityManifest): CityMapIssue[] {
  const issues: CityMapIssue[] = [];
  const add: Collect = (issue) => issues.push(issue);
  const seen = new Map<string, CityTile>();
  const inBounds: CityTile[] = [];
  for (const tile of map.tiles) {
    if (tile.x < 0 || tile.y < 0 || tile.x >= map.width || tile.y >= map.height) {
      add(at(tile, "out-of-bounds", `outside the ${map.width}x${map.height} map`));
      continue;
    }
    if (seen.has(tileKey(tile.x, tile.y))) {
      add(at(tile, "duplicate-tile", "tile is listed more than once"));
      continue;
    }
    seen.set(tileKey(tile.x, tile.y), tile);
    inBounds.push(tile);
  }
  const tiles = indexTiles({ ...map, tiles: inBounds });
  for (const tile of inBounds) checkModel(tile, manifest, add);
  for (const tile of inBounds) checkSockets(map, tile, tiles, add);
  checkSpawn(map, tiles, add);
  return issues.sort(
    (a, b) =>
      (a.y ?? -1) - (b.y ?? -1) || (a.x ?? -1) - (b.x ?? -1) || a.code.localeCompare(b.code),
  );
}

export function assertValidCityMap(map: CityMap, manifest: CityManifest): void {
  const issues = validateCityMap(map, manifest);
  if (issues.length > 0) throw new CityMapError(map.id, issues);
}

/** Parse then validate. Throws CityMapError listing every problem with its tile. */
export function loadCityMap(raw: unknown, manifest: CityManifest): CityMap {
  const map = parseCityMap(raw);
  assertValidCityMap(map, manifest);
  return map;
}
