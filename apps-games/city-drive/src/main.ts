import { Engine } from "@babylonjs/core/Engines/engine.js";
import type { SceneInstrumentation } from "@babylonjs/core/Instrumentation/sceneInstrumentation.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { parseProgression, SaveManager } from "@city-drive/core";
import type { AssetManifest } from "./assets/manifest";
import {
  AudioManager,
  type AudioManifest,
  createBrowserContext,
  FeelDirector,
  soundButtonTaps,
  unlockOnFirstGesture,
} from "./audio";
import { FpsOverlay } from "./game/fpsOverlay";
import { GameHost } from "./game/gameHost";
import { GameLoop } from "./game/loop";
import { DISTRICT_MISSIONS, PROGRESSION_RAW } from "./game/missions";
import { createDriver, HapticsService } from "./haptics";
import { CombinedInput, GamepadInput, KeyboardInput, TouchInput } from "./input";
import {
  bindKeepAwake,
  bindLifecycle,
  browserNativeEnv,
  createNativeServices,
  DomExitPrompt,
} from "./native";
import { createGarage } from "./render/garage";
import { frameStats } from "./render/stats";
import { LastDistrict, PreferencesSaveStore, Profile, ROSTER, showSaveNotice } from "./save";
import { AppController } from "./ui/controller";
import { wantsTouchControls } from "./ui/controls/wantsTouch";
import { summarizeMission } from "./ui/model/districts";
import { mountUi } from "./ui/mount";
import { EscapeBackSource } from "./ui/nav/back";
import { OnboardingFlow } from "./ui/onboarding";

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

/** The audio manifest, or an empty one (silent game) when it cannot be loaded. */
async function loadAudioManifest(): Promise<AudioManifest> {
  try {
    return (await (await fetchChecked("audio/manifest.json")).json()) as AudioManifest;
  } catch (error) {
    console.error("City Drive: audio could not be loaded; the game will be silent", error);
    return { version: 1, totalBytes: 0, sounds: [], procedural: [] };
  }
}

async function start(): Promise<void> {
  const canvas = requireElement("game");
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error("City Drive: #game is not a canvas");
  const ui = requireElement("ui");
  const params = new URLSearchParams(window.location.search);
  const manifest = (await (await fetchChecked("manifest.json")).json()) as AssetManifest;
  const progression = parseProgression(PROGRESSION_RAW);

  // The host sets the render resolution (device pixel ratio capped at 2), so Babylon's own
  // adaptToDeviceRatio is off.
  const engine = new Engine(canvas, true, { stencil: false }, false);
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
  const audio = new AudioManager({
    createContext: createBrowserContext,
    loadBytes: (file) => loadBytes(`audio/${file}`),
    manifest: await loadAudioManifest(),
  });
  const feel = new FeelDirector(
    audio,
    new HapticsService(createDriver(), () => profile.save.settings.haptics),
  );
  const firstDistrict = progression.districts[0]?.id ?? "district-1";
  const firstMissionId = missions[firstDistrict]?.[0]?.id;
  if (!firstMissionId) throw new Error(`City Drive: district "${firstDistrict}" has no missions`);
  const onboarding = new OnboardingFlow({
    flag: (name) => profile.flag(name),
    setFlag: (name, value) => profile.setFlag(name, value),
    hasProgress: () => profile.hasMissionRecords(),
    openMission: (id) => host.mission.open(id, false),
    firstMissionId,
  });
  const controller = new AppController({
    game: host,
    profile,
    roster: ROSTER,
    progression,
    missions,
    lastDistrict: new LastDistrict(store, firstDistrict),
    onboarding,
    horn: () => feel.horn(),
  });
  const applySound = (): void =>
    audio.setToggles({ master: profile.save.settings.audio, sfx: true, music: true });
  applySound();
  controller.subscribe(applySound);
  controller.onFrame((play) => {
    const { screen, loading } = controller.view;
    feel.onFrame(play, {
      driving: screen === "play" || screen === "pause",
      engineOn: screen === "play" && !loading,
      missionActive: play?.hud.phase === "active",
    });
  });
  host.onStep((report) => {
    feel.onStep(report);
    controller.onStep(report);
  });
  unlockOnFirstGesture(window, audio);
  const nativeServices = createNativeServices(browserNativeEnv(new DomExitPrompt(ui)));
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
    nativeServices.deviceBack ?? new EscapeBackSource(window),
    window,
  );

  soundButtonTaps(ui, () => feel.uiTap());
  // Background and foreground: pause the game, save and silence audio (web: page visibility; device:
  // @capacitor/app). The pause menu stays up when the app returns.
  bindLifecycle(nativeServices.lifecycle, {
    setHidden: (hidden) => {
      controller.setHidden(hidden);
      if (!hidden) void nativeServices.display.enterGameDisplay();
    },
    save: async () => void (await saveManager.flush()),
    audio,
  });
  bindKeepAwake(controller, nativeServices.keepAwake);
  void nativeServices.display.enterGameDisplay();

  let instrumented: { scene: Scene; instrumentation: SceneInstrumentation } | undefined;
  // Only the ?fps overlay counts draw calls, so the instrumentation code is loaded on demand.
  const instrumentationModule = params.has("fps")
    ? await import("@babylonjs/core/Instrumentation/sceneInstrumentation.js")
    : undefined;
  const fps = instrumentationModule
    ? new FpsOverlay(ui, () => {
        const scene = host.current?.city.scene;
        if (!scene) return { fps: engine.getFps(), drawCalls: 0, triangles: 0 };
        const cached =
          instrumented?.scene === scene
            ? instrumented
            : { scene, instrumentation: new instrumentationModule.SceneInstrumentation(scene) };
        instrumented = cached;
        return {
          fps: engine.getFps(),
          drawCalls: cached.instrumentation.drawCallsCounter.current,
          triangles: frameStats(scene).triangles,
        };
      })
    : undefined;

  let lastFrameMs: number | undefined;
  const loop = new GameLoop({
    step: () => host.step(),
    render: (alpha, frameSeconds) => {
      host.render(alpha, frameSeconds);
      const now = performance.now();
      controller.tick(now);
      fps?.update(now);
    },
  });
  engine.runRenderLoop(() => {
    const now = performance.now();
    if (lastFrameMs !== undefined && !document.hidden) host.recordFrame(now - lastFrameMs);
    lastFrameMs = now;
    loop.frame(now);
  });
  window.addEventListener("resize", () => {
    host.refreshScaling();
    engine.resize();
  });

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
