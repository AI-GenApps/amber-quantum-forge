import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder.js";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import "@babylonjs/core/Meshes/thinInstanceMesh.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { type BayGeometry, quatFromForward } from "@city-drive/core";
import { MAX_ARROWS, type Point2, routeArrows } from "./missionRouteMath";

const BEAM_HEIGHT_M = 40;
const BEAM_BASE_M = 6;
const BEAM_TOP_M = 1.5;
const ROUTE_LIFT_M = 0.15;
const BAY_LIFT_M = 0.12;
/** Marker beams are at most this many (one per mission in view of a district). */
const MAX_BEAMS = 32;

const MARKER_COLOR = new Color3(1, 0.78, 0.2);
const OBJECTIVE_COLOR = new Color3(0.2, 0.9, 1);

/** What to draw for missions this frame. Plain data, so the renderer knows nothing about rules. */
export interface MissionView {
  /** Free-roam start markers. Empty while a mission is running. */
  markers: readonly Point2[];
  /** The A* route to the objective, from the car. */
  route: readonly Point2[] | undefined;
  objective: Point2 | undefined;
  bay: BayGeometry | undefined;
}

export const EMPTY_MISSION_VIEW: MissionView = {
  markers: [],
  route: undefined,
  objective: undefined,
  bay: undefined,
};

export interface MissionVisual {
  sync(view: MissionView): void;
  /** Meshes currently drawn, by name, for tests. */
  readonly visible: readonly string[];
  readonly meshes: readonly Mesh[];
  dispose(): void;
}

function glowMaterial(scene: Scene, name: string, color: Color3, alpha: number): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = Color3.Black();
  material.specularColor = Color3.Black();
  material.emissiveColor = color;
  material.disableLighting = true;
  material.alpha = alpha;
  material.backFaceCulling = false;
  material.zOffset = -2;
  return material;
}

/** A flat chevron pointing along +Z, one unit across. */
function buildArrow(scene: Scene): Mesh {
  const mesh = new Mesh("mission-arrow", scene);
  const data = new VertexData();
  data.positions = [0, 0, 1.2, 0.9, 0, -0.8, 0, 0, -0.2, -0.9, 0, -0.8];
  data.indices = [0, 1, 2, 0, 2, 3];
  data.normals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
  data.applyToMesh(mesh);
  mesh.material = glowMaterial(scene, "mission-arrow", OBJECTIVE_COLOR, 0.9);
  mesh.isPickable = false;
  mesh.setEnabled(false);
  return mesh;
}

function buildBeam(scene: Scene): Mesh {
  const mesh = CreateCylinder(
    "mission-beam",
    {
      height: BEAM_HEIGHT_M,
      diameterBottom: BEAM_BASE_M,
      diameterTop: BEAM_TOP_M,
      tessellation: 10,
      cap: Mesh.NO_CAP,
    },
    scene,
  );
  mesh.material = glowMaterial(scene, "mission-beam", MARKER_COLOR, 0.32);
  mesh.isPickable = false;
  mesh.setEnabled(false);
  return mesh;
}

function buildBayPad(scene: Scene): Mesh {
  const mesh = CreateGround("mission-bay", { width: 1, height: 1 }, scene);
  mesh.material = glowMaterial(scene, "mission-bay", OBJECTIVE_COLOR, 0.45);
  mesh.rotationQuaternion = Quaternion.Identity();
  mesh.isPickable = false;
  mesh.setEnabled(false);
  return mesh;
}

/**
 * Mission markers and guidance: a tapered beam over every free-roam start marker (and over the
 * objective while a mission runs), a ribbon of arrows along the A* route, and a pad on the bay of
 * a parking mission. Beams and arrows are thin instances, so the whole thing is at most three
 * draw calls however many markers or arrows are out.
 */
export function createMissionVisual(scene: Scene): MissionVisual {
  const arrow = buildArrow(scene);
  const beam = buildBeam(scene);
  const pad = buildBayPad(scene);
  const arrowBuffer = new Float32Array(MAX_ARROWS * 16);
  const beamBuffer = new Float32Array(MAX_BEAMS * 16);
  const visible: string[] = [];
  let lastRoute: readonly Point2[] | undefined;
  let arrowCount = 0;
  let lastBeams = "";

  const show = (mesh: Mesh, on: boolean): void => {
    mesh.setEnabled(on);
    if (on) visible.push(mesh.name);
  };

  const syncRoute = (route: readonly Point2[] | undefined): void => {
    if (route === lastRoute) return;
    lastRoute = route;
    const arrows = route ? routeArrows(route) : [];
    arrows.forEach((a, i) => {
      const q = quatFromForward(a.dx, a.dz);
      Matrix.Compose(
        new Vector3(1, 1, 1),
        new Quaternion(q.x, q.y, q.z, q.w),
        new Vector3(a.x, ROUTE_LIFT_M, a.z),
      ).copyToArray(arrowBuffer, i * 16);
    });
    arrowCount = arrows.length;
    arrow.thinInstanceBufferUpdated("matrix");
    arrow.thinInstanceCount = arrowCount;
    arrow.thinInstanceRefreshBoundingInfo(true);
  };

  const syncBeams = (spots: readonly Point2[]): void => {
    const shown = spots.slice(0, MAX_BEAMS);
    const key = shown.map((p) => `${p.x},${p.z}`).join(";");
    if (key === lastBeams) return;
    lastBeams = key;
    shown.forEach((p, i) => {
      Matrix.Translation(p.x, BEAM_HEIGHT_M / 2, p.z).copyToArray(beamBuffer, i * 16);
    });
    beam.thinInstanceBufferUpdated("matrix");
    beam.thinInstanceCount = shown.length;
    beam.thinInstanceRefreshBoundingInfo(true);
  };

  const syncBay = (bay: BayGeometry | undefined): void => {
    if (!bay) return;
    const q = quatFromForward(bay.axis.x, bay.axis.z);
    pad.position.set(bay.centre.x, BAY_LIFT_M, bay.centre.z);
    pad.rotationQuaternion?.set(q.x, q.y, q.z, q.w);
    pad.scaling.set(bay.halfWidth * 2, 1, bay.halfLength * 2);
  };

  arrow.thinInstanceSetBuffer("matrix", arrowBuffer, 16, false);
  arrow.thinInstanceCount = 0;
  beam.thinInstanceSetBuffer("matrix", beamBuffer, 16, false);
  beam.thinInstanceCount = 0;

  return {
    get visible() {
      return visible;
    },
    get meshes() {
      return [arrow, beam, pad];
    },
    sync(view) {
      visible.length = 0;
      const spots = view.objective ? [view.objective] : view.markers;
      syncBeams(spots);
      syncRoute(view.route);
      syncBay(view.bay);
      show(beam, spots.length > 0);
      show(arrow, arrowCount > 0);
      show(pad, view.bay !== undefined);
    },
    dispose() {
      arrow.dispose();
      beam.dispose();
      pad.dispose();
    },
  };
}
