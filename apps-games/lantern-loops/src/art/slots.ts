import type { ComponentType } from "preact";
import { BACKDROP_SCENES, type SceneProps } from "./fallbacks/Backdrops";
import {
  AppIcon,
  DailyMedallion,
  EmptyArchive,
  KeyArt,
  LanternAmber,
  LanternAzure,
  LanternJade,
  LanternRose,
  LanternUnlit,
  LanternViolet,
} from "./fallbacks/Icons";

export const SLOT_IDS = [
  "icon",
  "key-art",
  "lantern-amber",
  "lantern-rose",
  "lantern-jade",
  "lantern-azure",
  "lantern-violet",
  "lantern-unlit",
  "backdrop-harbor",
  "backdrop-garden",
  "backdrop-bridge",
  "backdrop-sky",
  "daily-medallion",
  "empty-archive",
  "feature-graphic",
] as const;

export type SlotId = (typeof SLOT_IDS)[number];

export interface ArtSlot {
  id: SlotId;
  /** File name searched under `src/art/files/`. */
  file: string;
  /** Display size in css pixels; 0 means the slot fills its container. */
  width: number;
  height: number;
  /** False for store-only art that is never shown in the app. */
  inApp: boolean;
  Fallback: ComponentType<SceneProps>;
}

const slot = (
  id: SlotId,
  width: number,
  height: number,
  Fallback: ComponentType<SceneProps>,
  inApp = true,
): ArtSlot => ({ id, file: `${id}.webp`, width, height, inApp, Fallback });

export const ART_SLOTS: readonly ArtSlot[] = [
  slot("icon", 48, 48, AppIcon),
  slot("key-art", 0, 0, KeyArt),
  slot("lantern-amber", 56, 56, LanternAmber),
  slot("lantern-rose", 56, 56, LanternRose),
  slot("lantern-jade", 56, 56, LanternJade),
  slot("lantern-azure", 56, 56, LanternAzure),
  slot("lantern-violet", 56, 56, LanternViolet),
  slot("lantern-unlit", 56, 56, LanternUnlit),
  slot("backdrop-harbor", 0, 0, BACKDROP_SCENES.harbor),
  slot("backdrop-garden", 0, 0, BACKDROP_SCENES.garden),
  slot("backdrop-bridge", 0, 0, BACKDROP_SCENES.bridge),
  slot("backdrop-sky", 0, 0, BACKDROP_SCENES.sky),
  slot("daily-medallion", 120, 120, DailyMedallion),
  slot("empty-archive", 160, 160, EmptyArchive),
  slot("feature-graphic", 0, 0, KeyArt, false),
];

const discovered = import.meta.glob<string>("./files/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

const urlByFile = new Map<string, string>(
  Object.entries(discovered).map(([path, url]) => [path.slice(path.lastIndexOf("/") + 1), url]),
);

export type SlotSource =
  | { kind: "file"; url: string; slot: ArtSlot }
  | { kind: "fallback"; slot: ArtSlot };

export function getSlot(id: SlotId): ArtSlot {
  return ART_SLOTS.find((entry) => entry.id === id) as ArtSlot;
}

/** The delivered file of a slot, or its code-drawn fallback when no file exists yet. */
export function resolveSlot(
  id: SlotId,
  files: ReadonlyMap<string, string> = urlByFile,
): SlotSource {
  const entry = getSlot(id);
  const url = files.get(entry.file);
  return url === undefined ? { kind: "fallback", slot: entry } : { kind: "file", url, slot: entry };
}

/** URLs of every delivered file that the app shows, for the boot preload. */
export function bundledArtUrls(files: ReadonlyMap<string, string> = urlByFile): string[] {
  return ART_SLOTS.filter((entry) => entry.inApp)
    .map((entry) => files.get(entry.file))
    .filter((url): url is string => url !== undefined);
}
