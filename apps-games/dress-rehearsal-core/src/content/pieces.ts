import type { Piece } from "../types";
import { THEME_IDS, type ThemeId } from "./types";

const RIVIERA: readonly Piece[] = [
  { id: "item-riviera-1", name: "Breton Stripe Tee", category: "top", colour: "white", era: "now", formality: 2, warmth: 1, price: 38, features: [] },
  { id: "item-riviera-2", name: "Sky Camp-Collar Shirt", category: "top", colour: "sky", era: "50s", formality: 3, warmth: 0, price: 54, features: [] },
  { id: "item-riviera-3", name: "Cream Linen Trousers", category: "bottom", colour: "cream", era: "now", formality: 3, warmth: 1, price: 72, features: [] },
  { id: "item-riviera-4", name: "Orange Wrap Skirt", category: "bottom", colour: "orange", era: "50s", formality: 3, warmth: 0, price: 60, features: [] },
  { id: "item-riviera-5", name: "White Rope Espadrilles", category: "shoes", colour: "white", era: "now", formality: 2, warmth: 0, price: 44, features: [] },
  { id: "item-riviera-6", name: "Straw Basket Tote", category: "bag", colour: "tan", era: "now", formality: 1, warmth: 0, price: 52, features: [] },
  { id: "item-riviera-7", name: "Wide-Brim Sun Hat", category: "hat", colour: "cream", era: "50s", formality: 3, warmth: 0, price: 46, features: ["shade"] },
  { id: "item-riviera-8", name: "Cat-Eye Sunglasses", category: "accessory", colour: "black", era: "50s", formality: 3, warmth: 0, price: 68, features: ["shade"] },
];

const RAINY_CITY: readonly Piece[] = [
  { id: "item-rainy-city-1", name: "Yellow Rain Slicker", category: "outer", colour: "yellow", era: "90s", formality: 2, warmth: 2, price: 96, features: ["waterproof"] },
  { id: "item-rainy-city-2", name: "Camel Trench Coat", category: "outer", colour: "tan", era: "now", formality: 4, warmth: 2, price: 180, features: ["waterproof"] },
  { id: "item-rainy-city-3", name: "Grey Wool Jumper", category: "top", colour: "grey", era: "90s", formality: 2, warmth: 2, price: 64, features: [] },
  { id: "item-rainy-city-4", name: "Navy Pleated Trousers", category: "bottom", colour: "navy", era: "now", formality: 4, warmth: 2, price: 88, features: [] },
  { id: "item-rainy-city-5", name: "Black Rubber Boots", category: "shoes", colour: "black", era: "now", formality: 2, warmth: 2, price: 110, features: ["waterproof"] },
  { id: "item-rainy-city-6", name: "Mint Waxed Satchel", category: "bag", colour: "mint", era: "now", formality: 2, warmth: 0, price: 78, features: ["waterproof"] },
  { id: "item-rainy-city-7", name: "Navy Shirtdress", category: "dress", colour: "navy", era: "now", formality: 3, warmth: 1, price: 120, features: [] },
  { id: "item-rainy-city-8", name: "Black Compact Umbrella", category: "accessory", colour: "black", era: "now", formality: 3, warmth: 0, price: 42, features: ["waterproof"] },
];

const GALA: readonly Piece[] = [
  { id: "item-gala-1", name: "Red Satin Column Gown", category: "dress", colour: "red", era: "50s", formality: 5, warmth: 1, price: 340, features: [] },
  { id: "item-gala-2", name: "Black Velvet Midi Dress", category: "dress", colour: "black", era: "now", formality: 4, warmth: 2, price: 210, features: [] },
  { id: "item-gala-3", name: "Cream Silk Blouse", category: "top", colour: "cream", era: "50s", formality: 4, warmth: 0, price: 130, features: [] },
  { id: "item-gala-4", name: "Black Tuxedo Trousers", category: "bottom", colour: "black", era: "now", formality: 5, warmth: 1, price: 150, features: [] },
  { id: "item-gala-5", name: "Midnight Opera Coat", category: "outer", colour: "navy", era: "50s", formality: 5, warmth: 3, price: 280, features: [] },
  { id: "item-gala-6", name: "Gold Strappy Heels", category: "shoes", colour: "yellow", era: "now", formality: 5, warmth: 0, price: 160, features: ["sparkle"] },
  { id: "item-gala-7", name: "Silver Beaded Clutch", category: "bag", colour: "grey", era: "now", formality: 5, warmth: 0, price: 120, features: ["sparkle"] },
  { id: "item-gala-8", name: "Pearl Collar Necklace", category: "accessory", colour: "white", era: "50s", formality: 5, warmth: 0, price: 90, features: ["sparkle"] },
];

const MOUNTAIN: readonly Piece[] = [
  { id: "item-mountain-1", name: "Red Check Flannel Shirt", category: "top", colour: "red", era: "90s", formality: 1, warmth: 2, price: 58, features: [] },
  { id: "item-mountain-2", name: "Cream Cable-Knit Sweater", category: "top", colour: "cream", era: "70s", formality: 2, warmth: 3, price: 96, features: [] },
  { id: "item-mountain-3", name: "Tan Hiking Trousers", category: "bottom", colour: "tan", era: "now", formality: 1, warmth: 2, price: 84, features: ["sturdy"] },
  { id: "item-mountain-4", name: "Orange Down Puffer", category: "outer", colour: "orange", era: "90s", formality: 1, warmth: 3, price: 190, features: [] },
  { id: "item-mountain-5", name: "Black Trail Boots", category: "shoes", colour: "black", era: "now", formality: 1, warmth: 2, price: 140, features: ["sturdy","waterproof"] },
  { id: "item-mountain-6", name: "Blue Canvas Rucksack", category: "bag", colour: "blue", era: "90s", formality: 1, warmth: 0, price: 88, features: ["sturdy"] },
  { id: "item-mountain-7", name: "Grey Wool Beanie", category: "hat", colour: "grey", era: "now", formality: 1, warmth: 2, price: 28, features: [] },
  { id: "item-mountain-8", name: "Green Wool Scarf", category: "accessory", colour: "green", era: "70s", formality: 2, warmth: 2, price: 36, features: [] },
];

const STUDIO: readonly Piece[] = [
  { id: "item-studio-1", name: "Violet Origami Top", category: "top", colour: "violet", era: "now", formality: 4, warmth: 1, price: 120, features: [] },
  { id: "item-studio-2", name: "Grey Pleated Culottes", category: "bottom", colour: "grey", era: "now", formality: 4, warmth: 1, price: 104, features: [] },
  { id: "item-studio-3", name: "White Drape Dress", category: "dress", colour: "white", era: "now", formality: 4, warmth: 1, price: 230, features: [] },
  { id: "item-studio-4", name: "Cobalt Oversized Blazer-Coat", category: "outer", colour: "blue", era: "90s", formality: 4, warmth: 2, price: 210, features: [] },
  { id: "item-studio-5", name: "Black Platform Boots", category: "shoes", colour: "black", era: "90s", formality: 3, warmth: 2, price: 150, features: [] },
  { id: "item-studio-6", name: "Magenta Geometric Bag", category: "bag", colour: "magenta", era: "now", formality: 3, warmth: 0, price: 130, features: [] },
  { id: "item-studio-7", name: "Blush Sculpted Felt Hat", category: "hat", colour: "pink", era: "now", formality: 3, warmth: 1, price: 76, features: [] },
  { id: "item-studio-8", name: "Chrome Sculpture Cuff", category: "accessory", colour: "grey", era: "now", formality: 4, warmth: 0, price: 85, features: ["sparkle"] },
];

const VINTAGE: readonly Piece[] = [
  { id: "item-vintage-1", name: "Cream Pussy-Bow Blouse", category: "top", colour: "cream", era: "70s", formality: 3, warmth: 1, price: 62, features: [] },
  { id: "item-vintage-2", name: "Rust Flared Corduroys", category: "bottom", colour: "orange", era: "70s", formality: 2, warmth: 2, price: 70, features: [] },
  { id: "item-vintage-3", name: "Mustard Maxi Dress", category: "dress", colour: "yellow", era: "70s", formality: 3, warmth: 1, price: 98, features: [] },
  { id: "item-vintage-4", name: "Tan Suede Fringe Jacket", category: "outer", colour: "tan", era: "70s", formality: 2, warmth: 2, price: 150, features: [] },
  { id: "item-vintage-5", name: "Red Platform Clogs", category: "shoes", colour: "red", era: "70s", formality: 2, warmth: 1, price: 90, features: [] },
  { id: "item-vintage-6", name: "Olive Patchwork Shoulder Bag", category: "bag", colour: "lime", era: "70s", formality: 2, warmth: 0, price: 74, features: [] },
  { id: "item-vintage-7", name: "Navy Floppy Felt Hat", category: "hat", colour: "navy", era: "70s", formality: 3, warmth: 1, price: 58, features: [] },
  { id: "item-vintage-8", name: "Teal Bead Necklace", category: "accessory", colour: "teal", era: "70s", formality: 2, warmth: 0, price: 44, features: [] },
];

export const PIECES_BY_THEME: Readonly<Record<ThemeId, readonly Piece[]>> = {
  riviera: RIVIERA,
  "rainy-city": RAINY_CITY,
  gala: GALA,
  mountain: MOUNTAIN,
  studio: STUDIO,
  vintage: VINTAGE,
};

export const PIECES: readonly Piece[] = THEME_IDS.flatMap((theme) => PIECES_BY_THEME[theme]);

export const PIECE_BY_ID: ReadonlyMap<string, Piece> = new Map(
  PIECES.map((piece) => [piece.id, piece]),
);

export function piecesOfTheme(themeId: ThemeId): readonly Piece[] {
  return PIECES_BY_THEME[themeId];
}

export function closetFor(chapterIndex: number): readonly Piece[] {
  const reach = Math.max(1, chapterIndex);
  return THEME_IDS.filter((_, index) => index <= reach).flatMap((theme) => PIECES_BY_THEME[theme]);
}
