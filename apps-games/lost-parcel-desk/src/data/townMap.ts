export interface StreetLine {
  id: string;
  label: string;
  /** SVG path in the 360 x 520 map space. */
  d: string;
  labelAt: { x: number; y: number };
}

export interface PlaceSpot {
  caseId: string;
  x: number;
  y: number;
}

export const MAP_WIDTH = 360;
export const MAP_HEIGHT = 520;

export const STREET_LINES: readonly StreetLine[] = [
  { id: "orchard-close", label: "Orchard Close", d: "M20 70 H340", labelAt: { x: 180, y: 56 } },
  { id: "mill-lane", label: "Mill Lane", d: "M60 70 V470", labelAt: { x: 34, y: 240 } },
  {
    id: "lamplight-street",
    label: "Lamplight Street",
    d: "M180 70 V470",
    labelAt: { x: 154, y: 240 },
  },
  { id: "station-hill", label: "Station Hill", d: "M300 70 V470", labelAt: { x: 326, y: 240 } },
  { id: "tanners-row", label: "Tanner's Row", d: "M20 380 H340", labelAt: { x: 180, y: 366 } },
  { id: "quay-road", label: "Quay Road", d: "M20 450 H340", labelAt: { x: 180, y: 436 } },
];

export const PLACE_SPOTS: readonly PlaceSpot[] = [
  { caseId: "01", x: 110, y: 450 },
  { caseId: "02", x: 60, y: 170 },
  { caseId: "03", x: 120, y: 380 },
  { caseId: "04", x: 180, y: 170 },
  { caseId: "05", x: 90, y: 70 },
  { caseId: "06", x: 300, y: 170 },
  { caseId: "07", x: 290, y: 70 },
  { caseId: "08", x: 60, y: 300 },
  { caseId: "09", x: 300, y: 300 },
  { caseId: "10", x: 240, y: 380 },
  { caseId: "11", x: 180, y: 300 },
  { caseId: "12", x: 250, y: 450 },
];
