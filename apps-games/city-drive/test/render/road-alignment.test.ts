// @vitest-environment node

import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Scene } from "@babylonjs/core/scene.js";
import {
  DIR_VEC,
  DIRS,
  ROAD_MODEL_YAW_OFFSET,
  ROAD_SOCKETS,
  type TileRotation,
  tileSockets,
} from "@city-drive/core/city";
import { describe, expect, it } from "vitest";
import { AssetCache } from "../../src/render/assetCache";
import { placementMatrix } from "../../src/render/chunkBuilder";
import { buildTemplate } from "../../src/render/templates";
import { readManifest } from "../assets/helpers";
import { readBytes } from "./helpers";

const ROTATIONS: TileRotation[] = [0, 90, 180, 270];
const ASPHALT_MIN_Y = 0.005;
const ASPHALT_MAX_Y = 0.015;
const EDGE_EPS = 0.01;
const CENTRELINE_HALF_WIDTH = 0.2;

describe("road model alignment with the socket table", () => {
  it("asphalt reaches exactly the sockets of every road model at every rotation", async () => {
    const manifest = readManifest();
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const ids = Object.keys(ROAD_SOCKETS);
    const cache = await AssetCache.load(scene, manifest, ids, readBytes);
    for (const id of ids) {
      const template = buildTemplate(scene, cache, id);
      const base: Vector3[] = [];
      for (const part of template.parts) {
        const data = part.getVerticesData(VertexBuffer.PositionKind) ?? [];
        for (let i = 0; i < data.length; i += 3) {
          base.push(new Vector3(data[i], data[i + 1], data[i + 2]));
        }
      }
      const asphalt = base.filter((v) => v.y > ASPHALT_MIN_Y && v.y < ASPHALT_MAX_Y);
      expect(asphalt.length, id).toBeGreaterThan(0);
      for (const rot of ROTATIONS) {
        const m = placementMatrix({
          model: id,
          group: "road",
          x: 0,
          z: 0,
          yawDeg: rot + (ROAD_MODEL_YAW_OFFSET[id] ?? 0),
          scale: 1,
          chunk: "0,0",
        });
        const world = asphalt.map((v) => Vector3.TransformCoordinates(v, m));
        const open = DIRS.filter((d) => {
          const { dx, dz } = DIR_VEC[d];
          return world.some((v) => {
            const along = v.x * dx + v.z * dz;
            const across = Math.abs(v.x * dz) + Math.abs(v.z * dx);
            return along >= 0.5 - EDGE_EPS && across < CENTRELINE_HALF_WIDTH;
          });
        });
        expect(open, `${id} rot ${rot}`).toEqual(tileSockets({ kind: "road", model: id, rot }));
      }
    }
    cache.dispose();
    scene.dispose();
    engine.dispose();
  });
});
