import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Scene } from "@babylonjs/core/scene.js";
import { FOG_END, FOG_START, SKY_COLOR } from "./constants";

/** One hemispheric plus one directional light, linear fog and a flat sky colour. No shadows. */
export function setupLighting(scene: Scene): void {
  const sky = new Color3(SKY_COLOR.r, SKY_COLOR.g, SKY_COLOR.b);
  scene.clearColor = new Color4(sky.r, sky.g, sky.b, 1);
  scene.autoClear = true;
  scene.autoClearDepthAndStencil = true;
  scene.fogMode = Scene.FOGMODE_LINEAR;
  scene.fogColor = sky;
  scene.fogStart = FOG_START;
  scene.fogEnd = FOG_END;

  const ambient = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
  ambient.intensity = 0.7;
  ambient.groundColor = new Color3(0.45, 0.45, 0.5);

  const sun = new DirectionalLight("sun", new Vector3(-0.5, -1, -0.35), scene);
  sun.intensity = 0.6;
}
