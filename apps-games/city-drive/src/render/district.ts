import { type CityMap, loadCityMap, parseCityManifest } from "@city-drive/core/city";
import district1 from "@city-drive/core/maps/district-1.json";
import district2 from "@city-drive/core/maps/district-2.json";
import district3 from "@city-drive/core/maps/district-3.json";

const DISTRICT_MAPS: Readonly<Record<string, unknown>> = {
  "district-1": district1,
  "district-2": district2,
  "district-3": district3,
};

/** Parses and validates a district map against the shipped asset manifest. Throws with tile coordinates. */
export function loadDistrict(id: string, rawManifest: unknown): CityMap {
  const raw = DISTRICT_MAPS[id];
  if (raw === undefined) throw new Error(`City Drive: unknown district "${id}"`);
  return loadCityMap(raw, parseCityManifest(rawManifest));
}

/** Parses and validates district-1 against the shipped asset manifest. */
export function loadDistrict1(rawManifest: unknown): CityMap {
  return loadDistrict("district-1", rawManifest);
}
