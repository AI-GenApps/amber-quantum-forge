import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder.js";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder.js";
import { Scene } from "@babylonjs/core/scene.js";

export function createEmptyScene(engine: AbstractEngine): Scene {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.55, 0.72, 0.9, 1);

  const camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 3,
    14,
    Vector3.Zero(),
    scene,
  );
  scene.activeCamera = camera;

  const light = new HemisphericLight("sun", new Vector3(0.3, 1, 0.2), scene);
  light.intensity = 0.95;

  const groundMaterial = new StandardMaterial("groundMaterial", scene);
  groundMaterial.diffuseColor = new Color3(0.32, 0.36, 0.34);
  const ground = CreateGround("ground", { width: 40, height: 40 }, scene);
  ground.material = groundMaterial;

  const boxMaterial = new StandardMaterial("boxMaterial", scene);
  boxMaterial.diffuseColor = new Color3(0.9, 0.55, 0.15);
  const box = CreateBox("box", { size: 2 }, scene);
  box.position.y = 1;
  box.material = boxMaterial;

  return scene;
}
