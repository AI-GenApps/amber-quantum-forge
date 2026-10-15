import { type CityMap, loadCityMap, parseCityManifest } from "@city-drive/core/city";
import district1 from "@city-drive/core/maps/district-1.json";

/** Parses and validates district-1 against the shipped asset manifest. Throws with tile coordinates. */
export function loadDistrict1(rawManifest: unknown): CityMap {
  return loadCityMap(district1, parseCityManifest(rawManifest));
}
