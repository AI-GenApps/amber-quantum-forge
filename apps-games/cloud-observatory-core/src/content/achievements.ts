import type { AchievementDef } from "./types";

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: "telescope-row",
    name: "Telescope Row",
    description: "Own 10 Brass Telescopes",
    condition: { kind: "owned", instrumentId: "telescope", count: 10 },
  },
  {
    id: "lens-bench",
    name: "Lens Bench",
    description: "Own 10 Lens Arrays",
    condition: { kind: "owned", instrumentId: "lens", count: 10 },
  },
  {
    id: "spectrograph-gallery",
    name: "Spectrograph Gallery",
    description: "Own 10 Prism Spectrographs",
    condition: { kind: "owned", instrumentId: "prism", count: 10 },
  },
  {
    id: "orrery-hall",
    name: "Orrery Hall",
    description: "Own 10 Clockwork Orreries",
    condition: { kind: "owned", instrumentId: "orrery", count: 10 },
  },
  {
    id: "press-room",
    name: "Press Room",
    description: "Own 10 Star-Map Presses",
    condition: { kind: "owned", instrumentId: "star-map", count: 10 },
  },
  {
    id: "beacon-ridge",
    name: "Beacon Ridge",
    description: "Own 10 Signal Beacons",
    condition: { kind: "owned", instrumentId: "beacon", count: 10 },
  },
  {
    id: "reading-room",
    name: "Reading Room",
    description: "Own 10 Star Archives",
    condition: { kind: "owned", instrumentId: "archive", count: 10 },
  },
  {
    id: "coil-field",
    name: "Coil Field",
    description: "Own 10 Aurora Coils",
    condition: { kind: "owned", instrumentId: "aurora-coil", count: 10 },
  },
  {
    id: "first-ink",
    name: "First Ink",
    description: "Chart 1 constellation",
    condition: { kind: "charted", count: 1 },
  },
  {
    id: "cartographer",
    name: "Cartographer",
    description: "Chart 6 constellations",
    condition: { kind: "charted", count: 6 },
  },
  {
    id: "whole-sky",
    name: "The Whole Sky",
    description: "Chart all 12 constellations",
    condition: { kind: "charted", count: 12 },
  },
  {
    id: "steady-hand",
    name: "Steady Hand",
    description: "Chart a constellation with no mistaken taps",
    condition: { kind: "flawless" },
  },
  {
    id: "million-rays",
    name: "A Million Rays",
    description: "Gather 1,000,000 starlight over your lifetime",
    condition: { kind: "lifetime", amount: 1e6 },
  },
  {
    id: "billion-fold",
    name: "Billion-Fold",
    description: "Gather 1,000,000,000 starlight over your lifetime",
    condition: { kind: "lifetime", amount: 1e9 },
  },
  {
    id: "first-shadow",
    name: "The First Shadow",
    description: "Perform 1 Eclipse",
    condition: { kind: "eclipses", count: 1 },
  },
  {
    id: "shadow-keeper",
    name: "Shadow Keeper",
    description: "Perform 5 Eclipses",
    condition: { kind: "eclipses", count: 5 },
  },
  {
    id: "comet-chaser",
    name: "Comet Chaser",
    description: "Trace the Wandering Comet on 3 different dates",
    condition: { kind: "comet-days", count: 3 },
  },
  {
    id: "seven-nights",
    name: "Seven Nights",
    description: "Reach a 7-day comet streak",
    condition: { kind: "comet-streak", count: 7 },
  },
  {
    id: "keeper-of-tales",
    name: "Keeper of Tales",
    description: "Unlock all 30 lore entries",
    condition: { kind: "lore", count: 30 },
  },
  {
    id: "long-sleep",
    name: "Long Sleep",
    description: "Collect a full 8 hours of offline progress",
    condition: { kind: "offline-full" },
  },
];
