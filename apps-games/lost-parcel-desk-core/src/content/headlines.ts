export const TITLE = "Lost Parcel Desk";
export const SUBTITLE = "Cosy detective stories";
export const TAGLINE = "Open lost parcels, read the clues and find the owner in a 1970s post office.";
export const RETURN_TO_SENDER = "Return to sender";

export const HEADLINES: Readonly<Record<1 | 2 | 3, string>> = {
  3: "Delivered with a flourish",
  2: "Delivered, after a second look",
  1: "Delivered, eventually",
};

export function headlineFor(stamps: number): string {
  if (stamps >= 3) return HEADLINES[3];
  if (stamps === 2) return HEADLINES[2];
  return HEADLINES[1];
}
