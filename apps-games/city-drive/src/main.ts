import { Engine } from "@babylonjs/core/Engines/engine.js";
import { version } from "@city-drive/core";
import { createEmptyScene } from "./scene";

function requireCanvas(): HTMLCanvasElement {
  const canvas = document.getElementById("game");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("City Drive: #game canvas element is missing from index.html");
  }
  return canvas;
}

function start(): void {
  const canvas = requireCanvas();
  const engine = new Engine(canvas, true, { stencil: false }, true);
  const scene = createEmptyScene(engine);

  engine.runRenderLoop(() => {
    scene.render();
  });
  window.addEventListener("resize", () => engine.resize());

  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has("inspector")) {
    void import("./devInspector").then(({ showInspector }) => showInspector(scene));
  }

  console.info(`City Drive core ${version}`);
}

start();
