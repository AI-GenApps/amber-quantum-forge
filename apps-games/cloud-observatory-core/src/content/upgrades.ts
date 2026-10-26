import type { InstrumentId, UpgradeDef } from "../types";

const UPGRADE_NAMES: readonly (readonly [InstrumentId, readonly [string, string, string]])[] = [
  ["telescope", ["Polished Objective", "Steadied Tripod", "Silvered Mirror"]],
  ["lens", ["Ground Crown Glass", "Achromatic Doublet", "Coated Element"]],
  ["prism", ["Flint Prism Cut", "Spectral Slit", "Diffraction Grating"]],
  ["orrery", ["Oiled Gears", "Jewelled Bearings", "Clockwork Escapement"]],
  ["star-map", ["Vellum Charts", "Gilded Meridians", "Precession Tables"]],
  ["beacon", ["Reflector Cone", "Signal Lantern Chain", "Mountaintop Relay"]],
  ["archive", ["Card Catalogue", "Climate Vault", "Copyist Guild"]],
  ["aurora-coil", ["Copper Windings", "Auroral Resonance", "Magnetic Cradle"]],
];

export const UPGRADES: readonly UpgradeDef[] = UPGRADE_NAMES.flatMap(([instrumentId, names]) =>
  names.map((name, index) => ({
    id: `u-${instrumentId}-${index + 1}`,
    instrumentId,
    tier: index + 1,
    name,
  })),
);
