import type { GraphicsQuality } from "@city-drive/core";
import { CAMERA_MAX_Z, FOG_END, FOG_START } from "../../render/constants";

export interface GraphicsProfile {
  /** Engine hardware scaling level: 1 is native resolution, higher renders fewer pixels. */
  hardwareScaling: number;
  fogStart: number;
  fogEnd: number;
  /** Camera far plane; never below the fog end so nothing pops in view. */
  maxZ: number;
}

const FULL: GraphicsProfile = {
  hardwareScaling: 1,
  fogStart: FOG_START,
  fogEnd: FOG_END,
  maxZ: CAMERA_MAX_Z,
};

const PROFILES: Readonly<Record<GraphicsQuality, GraphicsProfile>> = {
  low: { hardwareScaling: 1.5, fogStart: 55, fogEnd: 130, maxZ: 140 },
  medium: { hardwareScaling: 1.25, fogStart: 72, fogEnd: 175, maxZ: 190 },
  high: FULL,
  // Task 15 makes auto adaptive; until then it behaves like high.
  auto: FULL,
};

/** Maps the quality setting to hardware scaling and fog distance. Task 15 finalizes the numbers. */
export function graphicsProfile(quality: GraphicsQuality): GraphicsProfile {
  return PROFILES[quality];
}
