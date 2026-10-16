import type {
  CarRoster,
  GraphicsQuality,
  MissionDef,
  MissionHud,
  MissionPayoutInfo,
  MissionResult,
  Progression,
} from "@city-drive/core";
import type { Point2 } from "./model/arrow";
import type { MissionSummary } from "./model/districts";
import type { MinimapModel } from "./model/minimap";

/** Everything the in-drive screens need, read once per frame. Plain data, no engine objects. */
export interface PlayState {
  speedKmh: number;
  hud: MissionHud;
  /** The mission being briefed or driven (undefined in free roam). */
  mission: MissionDef | undefined;
  result: MissionResult | undefined;
  /** What the last finished mission paid. */
  payout: MissionPayoutInfo | undefined;
  /** 0..1 while parking, otherwise undefined. */
  parkHold: number | undefined;
  player: { position: Point2; forward: Point2 };
  /** Free-roam mission starts (empty while a mission runs). */
  markers: readonly Point2[];
}

/**
 * What the UI asks of the game. The real one (`src/game/uiGame.ts`) drives Babylon and the
 * simulation; component tests pass a fake.
 */
export interface UiGame {
  districtId(): string | undefined;
  /** Builds the district's city and session, replacing the current one. */
  loadDistrict(id: string): Promise<void>;
  /** The frame's state, or undefined while no district is loaded. */
  snapshot(): PlayState | undefined;
  minimapModel(): MinimapModel | undefined;
  setPaused(paused: boolean): void;
  /** Shows the garage scene instead of the city. */
  setGarageOpen(open: boolean): void;
  /** Shows this car in the garage scene. */
  previewCar(carId: string): Promise<void>;
  applyGraphics(quality: GraphicsQuality): void;
  mission: {
    accept(): void;
    decline(): void;
    /** Abandon whatever is running and return to free roam. */
    leave(): void;
    /** Drive-to-start shortcut: opens the briefing, or starts the mission at once. */
    open(missionId: string, start: boolean): void;
  };
}

/** Static content the screens list: cars, districts and the missions in each district. */
export interface UiContent {
  roster: CarRoster;
  progression: Progression;
  /** Mission summaries per district id, in play order. */
  missions: Readonly<Record<string, readonly MissionSummary[]>>;
  /** Whether to draw the on-screen driving buttons. */
  showTouch: boolean;
}
