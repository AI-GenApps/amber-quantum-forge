import type { InstrumentDef } from "../types";

export const INSTRUMENTS: readonly InstrumentDef[] = [
  { id: "telescope", name: "Brass Telescope", baseCost: 15, baseSps: 0.2, growth: 1.12 },
  { id: "lens", name: "Lens Array", baseCost: 100, baseSps: 1.2, growth: 1.12 },
  { id: "prism", name: "Prism Spectrograph", baseCost: 700, baseSps: 7.5, growth: 1.12 },
  { id: "orrery", name: "Clockwork Orrery", baseCost: 5000, baseSps: 47, growth: 1.125 },
  { id: "star-map", name: "Star-Map Press", baseCost: 36000, baseSps: 290, growth: 1.125 },
  { id: "beacon", name: "Signal Beacon", baseCost: 250000, baseSps: 1800, growth: 1.13 },
  { id: "archive", name: "Star Archive", baseCost: 1800000, baseSps: 11500, growth: 1.13 },
  { id: "aurora-coil", name: "Aurora Coil", baseCost: 13000000, baseSps: 72000, growth: 1.135 },
];
