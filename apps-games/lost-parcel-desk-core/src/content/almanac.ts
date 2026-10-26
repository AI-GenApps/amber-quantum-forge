import type { FacetId } from "../types";
import type { AlmanacEntry } from "./types";

function entry(facet: FacetId, value: string, keywords: string, avoid: string[] = []): AlmanacEntry {
  return { facet, value, keywords: keywords.split(", "), avoid };
}

export const ALMANAC: readonly AlmanacEntry[] = [
  entry("street", "Quay Road", "river-mud grit, rope fibre, damp ferry paper", ["river mud", "quayside"]),
  entry("street", "Mill Lane", "grain husks, millstone dust", ["millstone", "flour dust"]),
  entry("street", "Tanner's Row", "tannery smell, leather dust, hide string", ["tannery", "tanned hide"]),
  entry("street", "Lamplight Street", "lamp soot, oil stains, brass fittings", ["soot", "lamp oil"]),
  entry("street", "Orchard Close", "apple blossom, windfalls, wasp stings", ["orchard", "wasp"]),
  entry("street", "Station Hill", "coal cinders, engine smuts, platform grit", ["cinder", "smuts"]),
  entry("pastime", "angling", "hooks, lead weights, line", ["fishing", "angler"]),
  entry("pastime", "choir", "hymn sheets, tuning forks, rehearsal notices", ["chorister", "alto", "tenor"]),
  entry("pastime", "crosswords", "pencilled grids, clue numbers, rubbed-out answers", ["crossword"]),
  entry("pastime", "model trains", "scale signal lamps, couplings, track pins", ["model railway", "gauge"]),
  entry("pastime", "birdwatching", "binoculars, lens caps, tick lists", ["birdwatcher", "bird list"]),
  entry("pastime", "chess", "carved pieces, postal scorecards, board notation", ["checkmate", "chessboard"]),
  entry("look", "red hair", "copper hairs on wool and collars", ["copper hair", "ginger"]),
  entry("look", "spectacles", "lens cloths, spare arms, smudged thumbprints", ["glasses", "spectacle"]),
  entry("look", "left-handed", "left-slanting writing, ink smeared on the left edge, left-hand scissors", ["left hand", "southpaw"]),
  entry("look", "hearing aid", "batteries, foam domes, clinic cards", ["hearing aid", "ear trumpet"]),
  entry("look", "tall", "let-down hems, high pencil marks, long sleeves", ["six feet", "tallest"]),
  entry("look", "walking stick", "rubber ferrules, worn tips, chemist's receipts", ["walking stick", "cane"]),
  entry("pet", "cat", "tabby hairs, scratched corners", ["cat hair", "whiskers"]),
  entry("pet", "dog", "paw prints, chew marks, biscuit crumbs", ["dog hair", "kennel"]),
  entry("pet", "canary", "birdseed, yellow feathers, cuttlebone", ["canary", "birdcage"]),
  entry("pet", "none", "spotless paper, no hairs or crumbs", []),
  entry("pet", "tortoise", "lettuce nibbles, heat-lamp receipts", ["tortoise", "shell-warmer"]),
  entry("pet", "goldfish", "fish-food flakes, nets, aquarium gravel", ["goldfish", "fish tank"]),
];

export const FACET_LABELS: Record<FacetId, string> = {
  street: "Street",
  pastime: "Pastime",
  look: "Look",
  pet: "Pet",
};

export function almanacFor(facet: FacetId, value: string): AlmanacEntry | undefined {
  return ALMANAC.find((item) => item.facet === facet && item.value === value);
}
