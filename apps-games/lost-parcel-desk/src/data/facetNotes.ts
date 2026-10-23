import type { FacetId } from "@web-games/lost-parcel-desk-core";

/** One line under each Almanac heading about what kind of trace the facet leaves behind. */
export const FACET_NOTE: Readonly<Record<FacetId, string>> = {
  street: "traces of where a parcel has travelled",
  pastime: "tools and papers from a hobby",
  look: "marks a person leaves on what they carry",
  pet: "hairs, crumbs and seed",
};
