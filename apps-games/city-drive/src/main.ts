import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
import type { Camera } from "@babylonjs/core/Cameras/camera.js";
import { Engine } from "@babylonjs/core/Engines/engine.js";
import { SceneInstrumentation } from "@babylonjs/core/Instrumentation/sceneInstrumentation.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { districtInfo, parseProgression } from "@city-drive/core";
import { mapHalfExtents, parseCityManifest } from "@city-drive/core/city";
import type { AssetManifest } from "./assets/manifest";
import { FpsOverlay } from "./game/fpsOverlay";
import { GameLoop } from "./game/loop";
import { DISTRICT_MISSIONS, isDistrictId, PROGRESSION_RAW } from "./game/missions";
import { GameSession, type SessionOptions } from "./game/session";
import { CombinedInput, GamepadInput, KeyboardInput, TouchInput } from "./input";
import { applyViewDistance, createCityScene, loadDistrict } from "./render";
import { createCarVisual } from "./render/carVisual";
import { ChaseCamera } from "./render/chaseCamera";
import { createMissionVisual } from "./render/missionVisual";
import { frameStats } from "./render/stats";
import { createTrafficVisual } from "./render/traffic";
import { mountControls, wantsTouchControls } from "./ui/controls/mount";
import { mountMissionPanel } from "./ui/mission-debug/mount";

/** Fixed seed: the same city traffic every run (a per-run seed can come with missions). */
const TRAFFIC_SEED = 1;

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`City Drive: #${id} element is missing from index.html`);
  return element;
}

async function fetchChecked(path: string): Promise<Response> {
  const response = await fetch(`${import.meta.env.BASE_URL}assets/${path}`);
  if (!response.ok) {
    throw new Error(`City Drive: could not load assets/${path} (HTTP ${response.status})`);
  }
  return response;
}

const loadBytes = async (file: string): Promise<Uint8Array> =>
  new Uint8Array(await (await fetchChecked(file)).arrayBuffer());

function createOrbitCamera(city: Awaited<ReturnType<typeof createCityScene>>, canvas: HTMLElement) {
  const half = mapHalfExtents(city.map);
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
  return orbit;
}

async function start(): Promise<void> {
  const canvas = requireElement("game");
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error("City Drive: #game is not a canvas");
  const params = new URLSearchParams(window.location.search);
  const manifest = (await (await fetchChecked("manifest.json")).json()) as AssetManifest;
  const requested = params.get("district") ?? "district-1";
  if (!isDistrictId(requested)) throw new Error(`City Drive: unknown district "${requested}"`);
  const districtId = requested;
  const traffic = districtInfo(parseProgression(PROGRESSION_RAW), districtId).traffic_agents;
  const map = loadDistrict(districtId, manifest);

  const engine = new Engine(canvas, true, { stencil: false }, true);
  const city = await createCityScene(engine, map, manifest, loadBytes);

  const touch = new TouchInput();
  const input = new CombinedInput([
    new KeyboardInput(window),
    touch,
    new GamepadInput(() => navigator.getGamepads?.() ?? []),
  ]);
  const sessionOptions: SessionOptions = {};
  if (!params.has("notraffic")) {
    sessionOptions.traffic = { seed: TRAFFIC_SEED, maxAgents: traffic };
  }
  if (!params.has("nomissions")) sessionOptions.missions = DISTRICT_MISSIONS[districtId];
  const session = await GameSession.create(
    map,
    parseCityManifest(manifest),
    input,
    undefined,
    sessionOptions,
  );
  const carVisual = await createCarVisual(city.scene, manifest, loadBytes, session.car.spec);
  const trafficVisual = await createTrafficVisual(city.scene, manifest, loadBytes);
  const chase = new ChaseCamera(city.scene, session.plan.boxes);
  const missionVisual = createMissionVisual(city.scene);
  const missions = session.missions;
  const missionPanel = missions
    ? mountMissionPanel(
        requireElement("ui"),
        {
          snapshot: () => ({
            hud: missions.hud(),
            mission: missions.run.mission,
            result: missions.run.result,
            parkHold: missions.parkHold,
          }),
          accept: () => missions.accept(),
          decline: () => missions.decline(),
          quit: () => missions.quit(),
          next: () => session.advanceMission(),
        },
        window,
      )
    : undefined;
  document.addEventListener("visibilitychange", () => session.setPaused(document.hidden));

  let camera: Camera = chase.camera;
  if (params.has("debugcam")) camera = createOrbitCamera(city, canvas);
  applyViewDistance(camera);
  city.scene.activeCamera = camera;
  mountControls(requireElement("ui"), touch, wantsTouchControls(window));

  const instrumentation = new SceneInstrumentation(city.scene);
  const fps = params.has("fps")
    ? new FpsOverlay(requireElement("ui"), () => ({
        fps: engine.getFps(),
        drawCalls: instrumentation.drawCallsCounter.current,
        triangles: frameStats(city.scene).triangles,
      }))
    : undefined;

  let seenRespawns = 0;
  const loop = new GameLoop({
    step: () => session.step(),
    render: (alpha, frameSeconds) => {
      const pose = session.pose(alpha);
      carVisual.sync(pose);
      trafficVisual.sync([...session.trafficPoses(alpha), ...session.parkedPoses()]);
      if (missions) {
        missionVisual.sync({
          markers: missions.run.phase === "idle" ? missions.markers() : [],
          route: missions.route?.points,
          objective: missions.objective,
          bay: missions.bay,
        });
        missionPanel?.update();
      }
      if (session.respawns.length !== seenRespawns) {
        seenRespawns = session.respawns.length;
        chase.snap();
      }
      chase.update(frameSeconds, pose);
      city.scene.render();
      fps?.update(performance.now());
    },
  });

  await city.scene.whenReadyAsync();
  engine.runRenderLoop(() => loop.frame(performance.now()));
  window.addEventListener("resize", () => engine.resize());

  if (import.meta.env.DEV && params.has("inspector")) {
    void import("./devInspector").then(({ showInspector }) => showInspector(city.scene));
  }
}

start().catch((error: unknown) => {
  console.error("City Drive failed to start", error);
  throw error;
});
