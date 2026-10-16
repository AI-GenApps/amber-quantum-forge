import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
import type { Camera } from "@babylonjs/core/Cameras/camera.js";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { districtInfo, type Progression, rotateVec } from "@city-drive/core";
import { mapHalfExtents, parseCityManifest } from "@city-drive/core/city";
import type { AssetManifest } from "../assets/manifest";
import type { InputSource } from "../input";
import { applyViewDistance, createCityScene, loadDistrict } from "../render";
import type { LoadBytes } from "../render/assetCache";
import { createCarVisual } from "../render/carVisual";
import { ChaseCamera } from "../render/chaseCamera";
import type { RenderedCity } from "../render/city";
import { freezeMaterials } from "../render/freeze";
import { createMissionVisual } from "../render/missionVisual";
import { createTrafficVisual } from "../render/traffic";
import type { Profile } from "../save";
import type { PlayState } from "../ui/types";
import { DISTRICT_MISSIONS, type DistrictId } from "./missions";
import { GameSession, type SessionOptions } from "./session";

/** Fixed seed: the same city traffic every run. */
const TRAFFIC_SEED = 1;

/** Things shared by every district the player visits. */
export interface RuntimeEnv {
  engine: AbstractEngine;
  canvas: HTMLElement;
  manifest: AssetManifest;
  loadBytes: LoadBytes;
  profile: Profile;
  progression: Progression;
  /** Shared across districts, so it is wrapped to survive a session being disposed. */
  input: InputSource;
  /** Debug query flags: `?notraffic`, `?nomissions`, `?debugcam`. */
  flags: { traffic: boolean; missions: boolean; debugCamera: boolean };
}

const IDLE_HUD = {
  phase: "idle",
  missionId: undefined,
  title: undefined,
  objective: undefined,
  progress: { done: 0, total: 0 },
  elapsedS: 0,
  timeLeftS: 0,
  damage: 0,
  comfort: null,
  paused: false,
} as const;

function orbitCamera(city: RenderedCity, canvas: HTMLElement): ArcRotateCamera {
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

/**
 * One district, ready to drive: its city scene, the simulation session and every visual that
 * follows the session. Built once per district visit and disposed when the player leaves.
 */
export class DistrictRuntime {
  private seenRespawns = 0;

  private constructor(
    readonly districtId: string,
    readonly city: RenderedCity,
    readonly session: GameSession,
    private readonly chase: ChaseCamera,
    private readonly sync: (alpha: number) => void,
    readonly camera: Camera,
    private readonly trafficAgents: number,
  ) {}

  static async create(env: RuntimeEnv, districtId: DistrictId): Promise<DistrictRuntime> {
    const { manifest, loadBytes, profile } = env;
    const map = loadDistrict(districtId, manifest);
    const city = await createCityScene(env.engine, map, manifest, loadBytes);
    const options: SessionOptions = { profile };
    const trafficAgents = districtInfo(env.progression, districtId).traffic_agents;
    if (env.flags.traffic) options.traffic = { seed: TRAFFIC_SEED, maxAgents: trafficAgents };
    if (env.flags.missions) options.missions = DISTRICT_MISSIONS[districtId];
    // The session disposes its input when it ends; the input outlives districts, so it is shielded.
    const shared = env.input;
    const input: InputSource = { read: (dt) => shared.read(dt), dispose: () => undefined };
    const session = await GameSession.create(
      map,
      parseCityManifest(manifest),
      input,
      undefined,
      options,
    );
    const carVisual = await createCarVisual(
      city.scene,
      manifest,
      loadBytes,
      session.car.spec,
      profile.selectedEntry().model_id,
    );
    const trafficVisual = await createTrafficVisual(city.scene, manifest, loadBytes);
    const missionVisual = createMissionVisual(city.scene);
    const chase = new ChaseCamera(city.scene, session.plan.boxes);
    const camera: Camera = env.flags.debugCamera ? orbitCamera(city, env.canvas) : chase.camera;
    applyViewDistance(camera);
    city.scene.activeCamera = camera;
    freezeMaterials(city.scene);
    await city.scene.whenReadyAsync();

    const sync = (alpha: number): void => {
      carVisual.sync(session.pose(alpha));
      trafficVisual.sync([...session.trafficPoses(alpha), ...session.parkedPoses()]);
      const missions = session.missions;
      if (missions) {
        missionVisual.sync({
          markers: missions.run.phase === "idle" ? missions.markers() : [],
          route: missions.route?.points,
          objective: missions.objective,
          bay: missions.bay,
        });
      }
    };
    return new DistrictRuntime(districtId, city, session, chase, sync, camera, trafficAgents);
  }

  /** Draws one frame. `alpha` is the share of the next fixed step that has already passed. */
  render(alpha: number, frameSeconds: number): void {
    this.sync(alpha);
    if (this.session.respawns.length !== this.seenRespawns) {
      this.seenRespawns = this.session.respawns.length;
      this.chase.snap();
    }
    this.chase.update(frameSeconds, this.session.pose(alpha));
    this.city.scene.render();
  }

  /** Far plane and fog for a graphics quality. */
  setView(maxZ: number, fogStart: number, fogEnd: number): void {
    this.camera.maxZ = maxZ;
    this.city.scene.fogStart = fogStart;
    this.city.scene.fogEnd = fogEnd;
  }

  /** Scales the district's AI car count (1 = full). Used by the quality governor. */
  setTrafficDensity(scale: number): void {
    this.session.traffic?.setMaxAgents(Math.max(1, Math.round(this.trafficAgents * scale)));
  }

  /** What the HUD and menus read this frame. */
  playState(): PlayState {
    const { session } = this;
    const missions = session.missions;
    const state = session.state;
    const f = rotateVec(state.rotation, { x: 0, y: 0, z: 1 });
    const len = Math.hypot(f.x, f.z) || 1;
    const idle = !missions || missions.run.phase === "idle";
    return {
      speedKmh: state.speedKmh,
      hud: missions ? missions.hud() : IDLE_HUD,
      mission: missions?.run.mission,
      result: missions?.run.result,
      payout: session.lastPayout,
      parkHold: missions?.parkHold,
      player: {
        position: { x: state.position.x, z: state.position.z },
        forward: { x: f.x / len, z: f.z / len },
      },
      markers: idle && missions ? missions.markers().map((m) => ({ x: m.x, z: m.z })) : [],
    };
  }

  dispose(): void {
    this.session.dispose();
    this.city.dispose();
  }
}
