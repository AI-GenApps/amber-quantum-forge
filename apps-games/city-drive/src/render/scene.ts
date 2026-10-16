import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine.js";
import { Scene } from "@babylonjs/core/scene.js";

/**
 * The only way the game makes a Scene. The simulation (Rapier) is right-handed, so the scene is
 * too: a mesh placed at simulation (x, y, z) is drawn at (x, y, z) with no axis flip, and Babylon's
 * glTF loader adds no `__root__` mirror. The flag must be set before any mesh is created, because
 * meshes pick their default winding from it.
 */
export function createScene(engine: AbstractEngine): Scene {
  const scene = new Scene(engine);
  scene.useRightHandedSystem = true;
  return scene;
}
