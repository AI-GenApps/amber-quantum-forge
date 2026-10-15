import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
import { Engine } from "@babylonjs/core/Engines/engine.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { mapHalfExtents } from "@city-drive/core/city";
import type { AssetManifest } from "./assets/manifest";
import { applyViewDistance, createCityScene, loadDistrict1 } from "./render";

function requireCanvas(): HTMLCanvasElement {
  const canvas = document.getElementById("game");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("City Drive: #game canvas element is missing from index.html");
  }
  return canvas;
}

async function fetchChecked(path: string): Promise<Response> {
  const response = await fetch(`${import.meta.env.BASE_URL}assets/${path}`);
  if (!response.ok) {
    throw new Error(`City Drive: could not load assets/${path} (HTTP ${response.status})`);
  }
  return response;
}

async function start(): Promise<void> {
  const canvas = requireCanvas();
  const manifest = (await (await fetchChecked("manifest.json")).json()) as AssetManifest;
  const map = loadDistrict1(manifest);

  const engine = new Engine(canvas, true, { stencil: false }, true);
  const city = await createCityScene(
    engine,
    map,
    manifest,
    async (file) => new Uint8Array(await (await fetchChecked(file)).arrayBuffer()),
  );

  const half = mapHalfExtents(map);
  const orbit = new ArcRotateCamera(
    "orbit",
    -Math.PI / 2,
    Math.PI / 3.2,
    Math.max(half.x, half.z) * 1.1,
    Vector3.Zero(),
    city.scene,
  );
  orbit.lowerRadiusLimit = 15;
  orbit.upperRadiusLimit = Math.max(half.x, half.z) * 1.6;
  orbit.upperBetaLimit = Math.PI / 2 - 0.03;
  orbit.wheelDeltaPercentage = 0.01;
  orbit.attachControl(canvas, true);
  applyViewDistance(orbit);
  city.scene.activeCamera = orbit;

  await city.scene.whenReadyAsync();
  engine.runRenderLoop(() => {
    city.scene.render();
  });
  window.addEventListener("resize", () => engine.resize());

  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has("inspector")) {
    void import("./devInspector").then(({ showInspector }) => showInspector(city.scene));
  }
}

start().catch((error: unknown) => {
  console.error("City Drive failed to start", error);
  throw error;
});
