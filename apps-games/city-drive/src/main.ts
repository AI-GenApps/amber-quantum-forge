import { Engine } from "@babylonjs/core/Engines/engine.js";
import { SceneInstrumentation } from "@babylonjs/core/Instrumentation/sceneInstrumentation.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { parseProgression, SaveManager } from "@city-drive/core";
import type { AssetManifest } from "./assets/manifest";
import { FpsOverlay } from "./game/fpsOverlay";
import { GameHost } from "./game/gameHost";
import { GameLoop } from "./game/loop";
import { DISTRICT_MISSIONS, PROGRESSION_RAW } from "./game/missions";
import { CombinedInput, GamepadInput, KeyboardInput, TouchInput } from "./input";
import { createGarage } from "./render/garage";
import { frameStats } from "./render/stats";
import { LastDistrict, PreferencesSaveStore, Profile, ROSTER, showSaveNotice } from "./save";
import { AppController } from "./ui/controller";
import { wantsTouchControls } from "./ui/controls/wantsTouch";
import { summarizeMission } from "./ui/model/districts";
import { mountUi } from "./ui/mount";
import { EscapeBackSource } from "./ui/nav/back";

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

async function start(): Promise<void> {
  const canvas = requireElement("game");
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error("City Drive: #game is not a canvas");
  const ui = requireElement("ui");
  const params = new URLSearchParams(window.location.search);
  const manifest = (await (await fetchChecked("manifest.json")).json()) as AssetManifest;
  const progression = parseProgression(PROGRESSION_RAW);

  const engine = new Engine(canvas, true, { stencil: false }, true);
  const touch = new TouchInput();
  const input = new CombinedInput([
    new KeyboardInput(window),
    touch,
    new GamepadInput(() => navigator.getGamepads?.() ?? []),
  ]);
  const store = new PreferencesSaveStore();
  const saveManager = new SaveManager(store, {
    starterCarId: ROSTER.starter,
    onNotice: (notice) => showSaveNotice(ui, notice),
  });
  const profile = await Profile.load(saveManager, ROSTER);

  const host = new GameHost(
    {
      engine,
      canvas,
      manifest,
      loadBytes,
      profile,
      progression,
      input,
      flags: {
        traffic: !params.has("notraffic"),
        missions: !params.has("nomissions"),
        debugCamera: params.has("debugcam"),
      },
    },
    engine,
    () => createGarage(engine, manifest, loadBytes, ROSTER),
  );
  const missions = Object.fromEntries(
    Object.entries(DISTRICT_MISSIONS).map(([id, files]) => [id, files.map(summarizeMission)]),
  );
  const controller = new AppController({
    game: host,
    profile,
    roster: ROSTER,
    progression,
    missions,
    lastDistrict: new LastDistrict(store, progression.districts[0]?.id ?? "district-1"),
  });
  mountUi(
    ui,
    {
      controller,
      content: {
        roster: ROSTER,
        progression,
        missions,
        showTouch: wantsTouchControls(window),
      },
      touch,
      minimap: () => host.minimapModel(),
    },
    new EscapeBackSource(window),
    window,
  );

  document.addEventListener("visibilitychange", () => {
    controller.setHidden(document.hidden);
    if (document.hidden) void saveManager.flush();
  });
  window.addEventListener("pagehide", () => void saveManager.flush());

  let instrumented: { scene: Scene; instrumentation: SceneInstrumentation } | undefined;
  const fps = params.has("fps")
    ? new FpsOverlay(ui, () => {
        const scene = host.current?.city.scene;
        if (!scene) return { fps: engine.getFps(), drawCalls: 0, triangles: 0 };
        const cached =
          instrumented?.scene === scene
            ? instrumented
            : { scene, instrumentation: new SceneInstrumentation(scene) };
        instrumented = cached;
        return {
          fps: engine.getFps(),
          drawCalls: cached.instrumentation.drawCallsCounter.current,
          triangles: frameStats(scene).triangles,
        };
      })
    : undefined;

  const loop = new GameLoop({
    step: () => host.step(),
    render: (alpha, frameSeconds) => {
      host.render(alpha, frameSeconds);
      const now = performance.now();
      controller.tick(now);
      fps?.update(now);
    },
  });
  engine.runRenderLoop(() => loop.frame(performance.now()));
  window.addEventListener("resize", () => engine.resize());

  // `?district=district-2` skips the menus and drops straight into that district (dev shortcut).
  const direct = params.get("district");
  if (!direct || !(await controller.enterDistrict(direct))) await controller.boot();

  if (import.meta.env.DEV && params.has("inspector") && host.current) {
    void import("./devInspector").then(({ showInspector }) => {
      const scene = host.current?.city.scene;
      if (scene) showInspector(scene);
    });
  }
}

start().catch((error: unknown) => {
  console.error("City Drive failed to start", error);
  throw error;
});
