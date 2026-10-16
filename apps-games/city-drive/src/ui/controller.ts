import type {
  CarRoster,
  GraphicsQuality,
  Progression,
  PurchaseResult,
  SaveData,
  SaveSettings,
} from "@city-drive/core";
import { FIXED_DT, isDistrictUnlocked, totalStars } from "@city-drive/core";
import type { StepReport } from "../game/stepReport";
import type { LastDistrict } from "../save/lastDistrict";
import type { Profile } from "../save/profile";
import { objectiveArrow } from "./model/arrow";
import { type MissionSummary, nextMissionId } from "./model/districts";
import { backAction } from "./nav/back";
import { type ScreenId, ScreenStack } from "./nav/screenStack";
import type { OnboardingFlow, OnboardingView } from "./onboarding";
import type { PlayState, UiGame } from "./types";

/** Everything the screens read. A new object is built whenever something visible changes. */
export interface AppView {
  screen: ScreenId;
  stack: readonly ScreenId[];
  /** A message while a district is being built, otherwise undefined. */
  loading: string | undefined;
  /** A failure the player should see (for example a district that would not load). */
  error: string | undefined;
  save: SaveData;
  districtId: string | undefined;
  play: PlayState | undefined;
  /** The car shown in the garage carousel. */
  garageCar: string;
  confirmingReset: boolean;
  /** The first-drive tutorial, while it has something to show. */
  onboarding: OnboardingView | undefined;
}

export interface ControllerDeps {
  game: UiGame;
  profile: Profile;
  roster: CarRoster;
  progression: Progression;
  /** Mission list per district id, in play order. */
  missions: Readonly<Record<string, readonly MissionSummary[]>>;
  lastDistrict: LastDistrict;
  /** First-drive tutorial. Omit it and the game has none. */
  onboarding?: OnboardingFlow | undefined;
  /** Plays the horn. Omit it and the horn button is silent. */
  horn?: (() => void) | undefined;
}

export type FrameListener = (play: PlayState | undefined, nowMs: number) => void;

/** Rounded fingerprint of what the screens draw, so a still frame does not re-render. */
function fingerprint(play: PlayState | undefined): string {
  if (!play) return "";
  const { hud, result } = play;
  const objective = hud.objective;
  const arrow = objective
    ? objectiveArrow(play.player.position, play.player.forward, objective)
    : undefined;
  return [
    hud.phase,
    hud.missionId,
    play.mission?.id,
    objective?.label,
    hud.progress.done,
    Math.ceil(hud.timeLeftS),
    Math.round(hud.damage),
    hud.comfort === null ? "" : Math.round(hud.comfort),
    play.parkHold === undefined ? "" : Math.round(play.parkHold * 20),
    result?.stars,
    result?.coins,
    play.payout?.coins,
    Math.round(play.speedKmh),
    arrow ? Math.round(arrow.angle * 20) : "",
    arrow ? Math.round(arrow.distanceM / 3) : "",
    arrow?.offscreen,
  ].join("|");
}

/**
 * The UI's brain: the screen stack, the loading state and every action a screen can take. It
 * talks to the game only through `UiGame`, so it runs in tests with a fake. Screens read
 * `view` and call its methods; `tick()` is called once per frame by the host.
 */
export class AppController {
  readonly stack = new ScreenStack("home");
  private readonly listeners = new Set<() => void>();
  private readonly frameListeners = new Set<FrameListener>();
  private current: AppView;
  private loading: string | undefined;
  private error: string | undefined;
  private garageCar: string;
  private confirmingReset = false;
  private carChanged = false;
  private hidden = false;
  private lastPrint = "";
  private lastPlay: PlayState | undefined;

  constructor(private readonly deps: ControllerDeps) {
    this.garageCar = deps.profile.save.selected_car;
    this.current = this.build();
    this.stack.subscribe(() => this.afterNavigation());
  }

  get view(): AppView {
    return this.current;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Per-frame hook that is not tied to re-rendering (the minimap draws from it at 10 Hz). */
  onFrame(listener: FrameListener): () => void {
    this.frameListeners.add(listener);
    return () => this.frameListeners.delete(listener);
  }

  /** Call once per rendered frame. Re-renders the screens only when something visible changed. */
  tick(nowMs: number): void {
    this.lastPlay = this.deps.game.snapshot();
    this.deps.onboarding?.observe(this.lastPlay?.hud);
    for (const listener of [...this.frameListeners]) listener(this.lastPlay, nowMs);
    const print = `${fingerprint(this.lastPlay)}#${this.deps.onboarding?.signature ?? ""}`;
    if (print === this.lastPrint) return;
    this.lastPrint = print;
    this.refresh();
  }

  // ---- boot, districts ---------------------------------------------------------------------

  /** Loads the district Play continues in, staying on the home screen. */
  async boot(): Promise<void> {
    const id = await this.continueDistrict();
    await this.load(id);
  }

  /** The last district the player drove in, if it is still open to them. */
  async continueDistrict(): Promise<string> {
    return this.deps.lastDistrict.get((id) => this.isOpen(id));
  }

  /** Home screen: continue free roam in the last district. */
  async play(): Promise<void> {
    if (this.deps.game.districtId() === undefined) {
      await this.enterDistrict(await this.continueDistrict());
      return;
    }
    this.stack.resetTo("play");
  }

  /** Map screen: load a district and drive. With a mission id the briefing is opened at its start. */
  async enterDistrict(id: string, missionId?: string): Promise<boolean> {
    if (!this.isOpen(id)) return false;
    if (this.deps.game.districtId() !== id) {
      if (!(await this.load(id))) return false;
    }
    await this.deps.lastDistrict.set(id);
    if (missionId !== undefined) this.deps.game.mission.open(missionId, false);
    this.stack.resetTo("play");
    return true;
  }

  isOpen(districtId: string): boolean {
    return isDistrictUnlocked(
      this.deps.progression,
      totalStars(this.deps.profile.save),
      districtId,
    );
  }

  /** One simulated step: the tutorial watches the player's input. */
  onStep(report: StepReport): void {
    if (this.stack.top === "play" && this.deps.onboarding?.feed(report.input, FIXED_DT)) {
      this.refresh();
    }
  }

  horn(): void {
    this.deps.horn?.();
  }

  // ---- first-drive tutorial ----------------------------------------------------------------

  skipOnboarding(): void {
    this.deps.onboarding?.skip();
    this.refresh();
  }

  dismissOnboarding(): void {
    this.deps.onboarding?.dismiss();
    this.refresh();
  }

  /** Settings, "How to play": back to free roam in the first district with the tutorial running. */
  async replayOnboarding(): Promise<void> {
    const flow = this.deps.onboarding;
    const first = this.deps.progression.districts[0]?.id;
    if (!flow || first === undefined) return;
    this.deps.game.mission.leave();
    if (!(await this.enterDistrict(first))) return;
    flow.replay();
    this.refresh();
  }

  // ---- menus -------------------------------------------------------------------------------

  openMap(): void {
    this.stack.push("map");
  }

  openSettings(): void {
    this.stack.push("settings");
  }

  openGarage(): void {
    this.garageCar = this.deps.profile.save.selected_car;
    this.carChanged = false;
    this.stack.push("garage");
    this.deps.game.setGarageOpen(true);
    void this.preview(this.garageCar);
  }

  /** Runs the back action for the current screen. Returns false when nothing can go back. */
  back(): boolean {
    const phase = this.lastPlay?.hud.phase ?? "idle";
    switch (backAction(this.stack.top, phase)) {
      case "pop":
      case "resume":
        this.stack.pop();
        return true;
      case "pause":
        this.pause();
        return true;
      case "decline":
        this.deps.game.mission.decline();
        return true;
      case "continue":
        this.deps.game.mission.leave();
        return true;
      case "exit":
        return false;
    }
  }

  // ---- driving -----------------------------------------------------------------------------

  pause(): void {
    if (this.stack.top === "play") this.stack.push("pause");
  }

  resume(): void {
    if (this.stack.top === "pause") this.stack.pop();
  }

  /** The page was hidden or shown. Hiding during a drive opens the pause menu. */
  setHidden(hidden: boolean): void {
    this.hidden = hidden;
    if (hidden) this.pause();
    this.syncPause();
  }

  restartMission(): void {
    const id = this.lastPlay?.mission?.id;
    if (id === undefined) return;
    this.deps.game.mission.open(id, true);
    this.resume();
  }

  abandonMission(): void {
    this.deps.game.mission.leave();
    this.resume();
  }

  quitToHome(): void {
    this.deps.game.mission.leave();
    this.stack.resetTo("home");
  }

  accept(): void {
    this.deps.game.mission.accept();
  }

  decline(): void {
    this.deps.game.mission.decline();
  }

  /** Enter key: starts a briefed mission or moves past an end screen. */
  confirm(): void {
    if (this.stack.top !== "play") return;
    const phase = this.lastPlay?.hud.phase;
    if (phase === "briefing") this.accept();
    else if (phase === "success" || phase === "fail" || phase === "results") this.freeRoam();
  }

  retry(): void {
    const id = this.lastPlay?.result?.id;
    if (id !== undefined) this.deps.game.mission.open(id, true);
  }

  /** The mission after the one just played, if its district has one. */
  nextMission(): string | undefined {
    const id = this.lastPlay?.result?.id;
    const district = this.deps.game.districtId();
    if (id === undefined || district === undefined) return undefined;
    return nextMissionId(this.deps.missions[district] ?? [], id);
  }

  next(): void {
    const next = this.nextMission();
    if (next === undefined) this.deps.game.mission.leave();
    else this.deps.game.mission.open(next, false);
  }

  freeRoam(): void {
    this.deps.game.mission.leave();
  }

  // ---- garage ------------------------------------------------------------------------------

  async focusCar(carId: string): Promise<void> {
    this.garageCar = carId;
    this.refresh();
    await this.preview(carId);
  }

  buy(carId: string): PurchaseResult {
    const result = this.deps.profile.purchase(carId);
    this.refresh();
    return result;
  }

  select(carId: string): boolean {
    const result = this.deps.profile.select(carId);
    if (result.ok) this.carChanged = true;
    this.refresh();
    return result.ok;
  }

  // ---- settings ----------------------------------------------------------------------------

  setSetting<K extends keyof SaveSettings>(key: K, value: SaveSettings[K]): void {
    this.deps.profile.updateSettings({ [key]: value } as Partial<SaveSettings>);
    if (key === "graphics_quality") this.applyGraphics(value as GraphicsQuality);
    this.refresh();
  }

  applyGraphics(quality: GraphicsQuality = this.deps.profile.save.settings.graphics_quality): void {
    this.deps.game.applyGraphics(quality);
  }

  requestReset(): void {
    this.confirmingReset = true;
    this.refresh();
  }

  cancelReset(): void {
    this.confirmingReset = false;
    this.refresh();
  }

  /** Erases progress after the player confirmed, then returns home with the starter car. */
  async confirmReset(): Promise<void> {
    this.confirmingReset = false;
    this.deps.game.mission.leave();
    this.deps.onboarding?.stop();
    this.deps.profile.reset();
    await this.deps.lastDistrict.clear();
    this.applyGraphics();
    this.stack.resetTo("home");
    await this.load(this.deps.progression.districts[0]?.id ?? "district-1");
  }

  dismissError(): void {
    this.error = undefined;
    this.refresh();
  }

  // ---- internals ---------------------------------------------------------------------------

  private async preview(carId: string): Promise<void> {
    try {
      await this.deps.game.previewCar(carId);
    } catch (error) {
      this.fail("The garage preview could not load", error);
    }
  }

  private async load(id: string): Promise<boolean> {
    this.loading = "Loading the city";
    this.refresh();
    try {
      await this.deps.game.loadDistrict(id);
      this.applyGraphics();
      this.carChanged = false;
      return true;
    } catch (error) {
      this.fail(`District "${id}" could not load`, error);
      return false;
    } finally {
      this.loading = undefined;
      this.syncPause();
      this.refresh();
    }
  }

  private fail(message: string, error: unknown): void {
    console.error(message, error);
    this.error = `${message}: ${error instanceof Error ? error.message : String(error)}`;
    this.refresh();
  }

  private afterNavigation(): void {
    const top = this.stack.top;
    if (top !== "settings") this.confirmingReset = false;
    this.deps.game.setGarageOpen(top === "garage");
    this.syncPause();
    if (top === "play" && this.deps.game.districtId() === this.deps.progression.districts[0]?.id) {
      this.deps.onboarding?.enter();
    }
    this.refresh();
    // Leaving the garage with a different car selected rebuilds the city with that car.
    if (top !== "garage" && this.carChanged && this.deps.game.districtId() !== undefined) {
      this.carChanged = false;
      void this.load(this.deps.game.districtId() as string);
    }
  }

  private syncPause(): void {
    this.deps.game.setPaused(
      this.hidden || this.stack.top !== "play" || this.loading !== undefined,
    );
  }

  private build(): AppView {
    return {
      screen: this.stack.top,
      stack: this.stack.screens,
      loading: this.loading,
      error: this.error,
      save: this.deps.profile.save,
      districtId: this.deps.game.districtId(),
      play: this.lastPlay,
      garageCar: this.garageCar,
      confirmingReset: this.confirmingReset,
      onboarding: this.deps.onboarding?.view,
    };
  }

  private refresh(): void {
    this.lastPlay = this.deps.game.snapshot();
    this.current = this.build();
    for (const listener of [...this.listeners]) listener();
  }
}
