import type { Place, Street } from "./types";

export const POST_OFFICE = "Ketterly Post Office";

export const STREETS: readonly Street[] = [
  { id: "quay-road", name: "Quay Road" },
  { id: "mill-lane", name: "Mill Lane" },
  { id: "tanners-row", name: "Tanner's Row" },
  { id: "lamplight-street", name: "Lamplight Street" },
  { id: "orchard-close", name: "Orchard Close" },
  { id: "station-hill", name: "Station Hill" },
];

export const PLACES: readonly Place[] = [
  { caseId: "01", name: "Ferry Landing", street: "Quay Road" },
  { caseId: "02", name: "Crumb's Bakery", street: "Mill Lane" },
  { caseId: "03", name: "Pike's Barbershop", street: "Tanner's Row" },
  { caseId: "04", name: "The Roxy Picture House", street: "Lamplight Street" },
  { caseId: "05", name: "Ketterly Library", street: "Orchard Close" },
  { caseId: "06", name: "Gault's Garage", street: "Station Hill" },
  { caseId: "07", name: "St. Wren's School", street: "Orchard Close" },
  { caseId: "08", name: "Bloom's Florist", street: "Mill Lane" },
  { caseId: "09", name: "Station Signal Box", street: "Station Hill" },
  { caseId: "10", name: "Thimble & Son Tailors", street: "Tanner's Row" },
  { caseId: "11", name: "Kettle's Hardware", street: "Lamplight Street" },
  { caseId: "12", name: "Quill's Piano Rooms", street: "Quay Road" },
];
