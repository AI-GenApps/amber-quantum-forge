import "@babylonjs/inspector";
import type { Scene } from "@babylonjs/core/scene.js";

export function showInspector(scene: Scene): void {
  void scene.debugLayer.show({ embedMode: true });
}
