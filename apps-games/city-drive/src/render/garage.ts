import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine.js";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Viewport } from "@babylonjs/core/Maths/math.viewport.js";
import { CreateDisc } from "@babylonjs/core/Meshes/Builders/discBuilder.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { type CarRoster, carSpecOf, findCar, quatFromYaw } from "@city-drive/core";
import type { AssetManifest } from "../assets/manifest";
import type { LoadBytes } from "./assetCache";
import { type CarVisual, createCarVisual } from "./carVisual";
import { flatMaterial } from "./materials";
import { createScene } from "./scene";

/** Chassis centre height with the wheels on the floor (same as the budget test's parked car). */
const CAR_Y = 0.87;
const SETTLED_SUSPENSION_M = 0.27;
/** Turntable speed in radians per second. */
const SPIN_RAD_PER_S = 0.5;
/** The camera renders into the left part of the canvas; the garage panel covers the rest. */
const STAGE_WIDTH = 0.6;
/** The garage may never cost more than this many draw calls (checked by test/render/garage.test.ts). */
export const GARAGE_MAX_DRAW_CALLS = 20;

export interface GarageScene {
  readonly scene: Scene;
  /** The car on the turntable, if one has been shown. */
  readonly shown: string | undefined;
  /** Builds the car on first use, then shows it and hides the previous one. */
  show(carId: string): Promise<void>;
  /** Advances the turntable. */
  update(dtSeconds: number): void;
  /** Renders the garage to the engine's canvas. */
  render(): void;
  dispose(): void;
}

function setVisible(visual: CarVisual, visible: boolean): void {
  visual.root.setEnabled(visible);
  visual.shadow.setEnabled(visible);
}

/**
 * A small second scene on the shared engine: a floor disc, two lights and one turntable car.
 * While the garage is open the host renders this scene instead of the city, which is cheaper than
 * a render-target texture (no extra pass, and the city draws nothing). Cars are built lazily and
 * kept, so flicking through the carousel loads each model once.
 */
export async function createGarage(
  engine: AbstractEngine,
  manifest: AssetManifest,
  loadBytes: LoadBytes,
  roster: CarRoster,
): Promise<GarageScene> {
  const scene = createScene(engine);
  scene.clearColor = new Color4(0.043, 0.063, 0.125, 1);
  const hemi = new HemisphericLight("garage-hemi", new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.85;
  hemi.groundColor = new Color3(0.35, 0.37, 0.5);
  const sun = new DirectionalLight("garage-sun", new Vector3(-0.4, -1, -0.6), scene);
  sun.intensity = 0.7;

  const floor: Mesh = CreateDisc("garage-floor", { radius: 4.2, tessellation: 48 }, scene);
  floor.rotation.x = Math.PI / 2;
  floor.material = flatMaterial(scene, "garage-floor", new Color3(0.16, 0.2, 0.36));
  floor.isPickable = false;

  const camera = new ArcRotateCamera(
    "garage-cam",
    -Math.PI / 2 - 0.55,
    1.2,
    7.2,
    new Vector3(0, 0.75, 0),
    scene,
  );
  camera.viewport = new Viewport(0, 0, STAGE_WIDTH, 1);
  camera.minZ = 0.3;
  camera.maxZ = 60;
  scene.activeCamera = camera;

  const visuals = new Map<string, CarVisual>();
  let current: string | undefined;
  let yaw = 0;

  const poseOf = (visual: CarVisual, carId: string) => {
    const spec = carSpecOf(findCar(roster, carId));
    visual.sync({
      position: { x: 0, y: CAR_Y, z: 0 },
      rotation: quatFromYaw(yaw),
      speedKmh: 0,
      wheels: spec.wheels.map(() => ({
        steering: 0,
        rotation: 0,
        suspensionLength: SETTLED_SUSPENSION_M,
      })),
    });
  };

  return {
    scene,
    get shown() {
      return current;
    },
    async show(carId) {
      const entry = findCar(roster, carId);
      let visual = visuals.get(carId);
      if (!visual) {
        visual = await createCarVisual(
          scene,
          manifest,
          loadBytes,
          carSpecOf(entry),
          entry.model_id,
        );
        visuals.set(carId, visual);
      }
      for (const [id, other] of visuals) setVisible(other, id === carId);
      current = carId;
      poseOf(visual, carId);
    },
    update(dt) {
      yaw += SPIN_RAD_PER_S * dt;
      if (current === undefined) return;
      const visual = visuals.get(current);
      if (visual) poseOf(visual, current);
    },
    render() {
      scene.render();
    },
    dispose() {
      for (const visual of visuals.values()) visual.dispose();
      visuals.clear();
      scene.dispose();
    },
  };
}
