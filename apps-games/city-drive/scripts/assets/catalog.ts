import type { AssetKind, AssetPack } from "../../src/assets/manifest";

export interface CatalogItem {
  id: string;
  kind: AssetKind;
  pack: AssetPack;
  /** Source file name (without extension) inside the pack's `GLB format` folder. */
  source: string;
}

const item = (id: string, kind: AssetKind, pack: AssetPack, source: string): CatalogItem => ({
  id,
  kind,
  pack,
  source,
});

const roads: CatalogItem[] = [
  item("road-straight", "road", "city-kit-roads", "road-straight"),
  item("road-corner", "road", "city-kit-roads", "road-bend"),
  item("road-t", "road", "city-kit-roads", "road-intersection"),
  item("road-crossroads", "road", "city-kit-roads", "road-crossroad"),
  item("road-end", "road", "city-kit-roads", "road-end"),
  item("road-crossing", "road", "city-kit-roads", "road-crossing"),
];

const commercialNames = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "skyscraper-a"];
const commercial: CatalogItem[] = commercialNames.map((name) =>
  item(`bld-commercial-${name}`, "building", "city-kit-commercial", `building-${name}`),
);

const suburbanNames = ["a", "b", "c", "d", "e", "f", "g", "h"];
const suburban: CatalogItem[] = suburbanNames.map((name) =>
  item(`bld-suburban-${name}`, "building", "city-kit-suburban", `building-type-${name}`),
);

// None of the four packs contains a bench. The planter stands in as street furniture.
const props: CatalogItem[] = [
  item("prop-light-square", "prop", "city-kit-roads", "light-square"),
  item("prop-light-curved", "prop", "city-kit-roads", "light-curved"),
  item("prop-traffic-light", "prop", "city-kit-roads", "traffic-light"),
  item("prop-sign-stop", "prop", "city-kit-roads", "road-sign-stop"),
  item("prop-construction-cone", "prop", "city-kit-roads", "construction-cone"),
  item("prop-construction-barrier", "prop", "city-kit-roads", "construction-barrier"),
  item("prop-tree-large", "prop", "city-kit-suburban", "tree-large"),
  item("prop-tree-small", "prop", "city-kit-suburban", "tree-small"),
  item("prop-planter", "prop", "city-kit-suburban", "planter"),
  item("prop-cone", "prop", "car-kit", "cone"),
];

const carNames = ["sedan", "hatchback-sports", "suv", "van", "truck", "taxi", "police", "race"];
const cars: CatalogItem[] = carNames.map((name) => item(`car-${name}`, "car", "car-kit", name));

export const CATALOG: CatalogItem[] = [...roads, ...commercial, ...suburban, ...props, ...cars];

export interface PackSource {
  pack: AssetPack;
  /** Official Kenney page, recorded in the licence record. */
  pageUrl: string;
  /** Direct zip URL on kenney.nl at the time of download. */
  downloadUrl: string;
  /** Directory-name prefix of the extracted zip under the raw folder. */
  dirPrefix: string;
}

export const PACK_SOURCES: PackSource[] = [
  {
    pack: "city-kit-roads",
    pageUrl: "https://kenney.nl/assets/city-kit-roads",
    downloadUrl:
      "https://kenney.nl/media/pages/assets/city-kit-roads/74288c9459-1791628607/kenney_city-kit-roads.zip",
    dirPrefix: "kenney_city-kit-roads",
  },
  {
    pack: "city-kit-commercial",
    pageUrl: "https://kenney.nl/assets/city-kit-commercial",
    downloadUrl:
      "https://kenney.nl/media/pages/assets/city-kit-commercial/a742d900eb-1753115042/kenney_city-kit-commercial_2.1.zip",
    dirPrefix: "kenney_city-kit-commercial",
  },
  {
    pack: "city-kit-suburban",
    pageUrl: "https://kenney.nl/assets/city-kit-suburban",
    downloadUrl:
      "https://kenney.nl/media/pages/assets/city-kit-suburban/2c871b7af2-1745479373/kenney_city-kit-suburban_20.zip",
    dirPrefix: "kenney_city-kit-suburban",
  },
  {
    pack: "car-kit",
    pageUrl: "https://kenney.nl/assets/car-kit",
    downloadUrl:
      "https://kenney.nl/media/pages/assets/car-kit/1a312ec241-1775131960/kenney_car-kit.zip",
    dirPrefix: "kenney_car-kit",
  },
];
