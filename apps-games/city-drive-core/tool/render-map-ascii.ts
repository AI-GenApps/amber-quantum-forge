import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildRoadGraph,
  findDeadEnds,
  isStronglyConnected,
  loadCityMap,
  parseCityManifest,
  renderMapAscii,
} from "../src/city/index";

const MANIFEST_PATH = resolve(import.meta.dirname, "../../city-drive/public/assets/manifest.json");

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

const target = process.argv[2];
if (!target) {
  console.error("usage: bun apps-games/city-drive-core/tool/render-map-ascii.ts <map.json>");
  process.exit(2);
}

try {
  const manifest = parseCityManifest(readJson(MANIFEST_PATH));
  const map = loadCityMap(readJson(resolve(target)), manifest);
  const graph = buildRoadGraph(map);
  console.log(renderMapAscii(map));
  console.log(
    `lane graph: ${graph.nodeList.length} nodes, ${graph.edgeList.length} edges, ` +
      `strongly connected: ${isStronglyConnected(graph)}, dead ends: ${findDeadEnds(graph).length}`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
