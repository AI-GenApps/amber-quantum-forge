import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine.js";
import type { GraphicsQuality } from "@city-drive/core";
import type { GarageScene } from "../render/garage";
import { buildMinimapModel, type MinimapModel } from "../ui/model/minimap";
import { graphicsProfile } from "../ui/model/quality";
import type { PlayState, UiGame } from "../ui/types";
import { isDistrictId } from "./missions";
import { DistrictRuntime, type RuntimeEnv } from "./runtime";
import type { StepReport } from "./stepReport";

/** Builds the garage scene on demand (the first time the garage opens). */
export type GarageFactory = () => Promise<GarageScene>;

/**
 * The real `UiGame`: owns the current district runtime and the garage scene, decides which one
 * the render loop draws, and carries out what the menus ask. One engine, one canvas.
 */
export class GameHost implements UiGame {
  private runtime: DistrictRuntime | undefined;
  private garage: GarageScene | undefined;
  private garagePromise: Promise<GarageScene> | undefined;
  private garageOpen = false;
  private quality: GraphicsQuality = "auto";
  private loadToken = 0;
  private minimap: { id: string; model: MinimapModel } | undefined;
  private readonly stepListeners = new Set<(report: StepReport) => void>();

  constructor(
    private readonly env: RuntimeEnv,
    private readonly engine: AbstractEngine,
    private readonly makeGarage: GarageFactory,
  ) {}

  get paused(): boolean {
    return this.runtime?.session.paused ?? true;
  }

  districtId(): string | undefined {
    return this.runtime?.districtId;
  }

  async loadDistrict(id: string): Promise<void> {
    if (!isDistrictId(id)) throw new Error(`City Drive: unknown district "${id}"`);
    const token = ++this.loadToken;
    const old = this.runtime;
    this.runtime = undefined;
    old?.dispose();
    const next = await DistrictRuntime.create(this.env, id);
    if (token !== this.loadToken) {
      next.dispose();
      return;
    }
    this.runtime = next;
    this.minimap = { id, model: buildMinimapModel(next.city.map) };
    this.applyGraphics(this.quality);
  }

  snapshot(): PlayState | undefined {
    return this.runtime?.playState();
  }

  minimapModel(): MinimapModel | undefined {
    return this.minimap?.model;
  }

  setPaused(paused: boolean): void {
    this.runtime?.session.setPaused(paused);
  }

  setGarageOpen(open: boolean): void {
    this.garageOpen = open;
  }

  async previewCar(carId: string): Promise<void> {
    this.garagePromise ??= this.makeGarage();
    this.garage = await this.garagePromise;
    await this.garage.show(carId);
  }

  applyGraphics(quality: GraphicsQuality): void {
    this.quality = quality;
    const profile = graphicsProfile(quality);
    this.engine.setHardwareScalingLevel(profile.hardwareScaling);
    this.runtime?.setView(profile.maxZ, profile.fogStart, profile.fogEnd);
  }

  readonly mission: UiGame["mission"] = {
    accept: () => this.runtime?.session.missions?.accept(),
    decline: () => this.runtime?.session.missions?.decline(),
    leave: () => this.runtime?.session.leaveMission(),
    open: (id, start) => this.runtime?.session.openMission(id, start),
  };

  /** Called with the report of every simulated step (never while paused). */
  onStep(listener: (report: StepReport) => void): () => void {
    this.stepListeners.add(listener);
    return () => this.stepListeners.delete(listener);
  }

  /** One fixed simulation step. The session ignores it while paused. */
  step(): void {
    const session = this.runtime?.session;
    if (!session || session.paused) return;
    session.step();
    const report = session.lastReport;
    if (report) for (const listener of this.stepListeners) listener(report);
  }

  /** Draws the garage while it is open, otherwise the city. */
  render(alpha: number, frameSeconds: number): void {
    if (this.garageOpen && this.garage) {
      this.garage.update(frameSeconds);
      this.garage.render();
      return;
    }
    this.runtime?.render(alpha, frameSeconds);
  }

  /** The runtime, for tools and tests that need the session. */
  get current(): DistrictRuntime | undefined {
    return this.runtime;
  }

  dispose(): void {
    this.runtime?.dispose();
    this.garage?.dispose();
  }
}
