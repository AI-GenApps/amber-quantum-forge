import { SAVE_SCHEMA_VERSION, type SaveData, type SaveSettings } from "./types";

export const DEFAULT_SETTINGS: Readonly<SaveSettings> = {
  audio: true,
  haptics: true,
  control_layout: "standard",
  graphics_quality: "auto",
};

/** A brand-new player: no coins, only the free starter car, nothing played. */
export function defaultSave(starterCarId: string): SaveData {
  return {
    schema_version: SAVE_SCHEMA_VERSION,
    coins: 0,
    owned_cars: [starterCarId],
    selected_car: starterCarId,
    missions: {},
    settings: { ...DEFAULT_SETTINGS },
    onboarding: {},
  };
}
