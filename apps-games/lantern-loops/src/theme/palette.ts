import type { Colour } from "@web-games/lantern-loops-core";

export const PALETTE = {
  indigoDeep: "#12132E",
  indigo: "#1E2050",
  indigoRaised: "#2A2D66",
  teal: "#0E5A5F",
  paper: "#F6EAD3",
  ink: "#241B2F",
} as const;

export const LANTERN_HEX: Readonly<Record<Colour, string>> = {
  amber: "#F2A33A",
  rose: "#E9657F",
  jade: "#3FBF98",
  azure: "#4EA6EA",
  violet: "#9A7DE3",
};

export const UNLIT_HEX = "#6E76A6";

export type GlyphKind = "circle" | "diamond" | "triangle" | "square" | "star";

export const GLYPH_BY_COLOUR: Readonly<Record<Colour, GlyphKind>> = {
  amber: "circle",
  rose: "diamond",
  jade: "triangle",
  azure: "square",
  violet: "star",
};

const round = (value: number): number => Math.round(value * 100) / 100;

/** Closed SVG path of a glyph centred on (cx, cy) with radius r. */
export function glyphPath(kind: GlyphKind, cx: number, cy: number, r: number): string {
  const p = (x: number, y: number): string => `${round(cx + x)} ${round(cy + y)}`;
  switch (kind) {
    case "circle":
      return `M${p(-r, 0)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
    case "diamond":
      return `M${p(0, -r)}L${p(r, 0)}L${p(0, r)}L${p(-r, 0)}Z`;
    case "triangle":
      return `M${p(0, -r)}L${p(r * 0.95, r * 0.8)}L${p(-r * 0.95, r * 0.8)}Z`;
    case "square": {
      const s = r * 0.82;
      return `M${p(-s, -s)}L${p(s, -s)}L${p(s, s)}L${p(-s, s)}Z`;
    }
    default: {
      const points: string[] = [];
      for (let k = 0; k < 10; k++) {
        const angle = -Math.PI / 2 + (k * Math.PI) / 5;
        const radius = k % 2 === 0 ? r : r * 0.42;
        points.push(p(Math.cos(angle) * radius, Math.sin(angle) * radius));
      }
      return `M${points.join("L")}Z`;
    }
  }
}

export function colourHex(colour: Colour): string {
  return LANTERN_HEX[colour];
}
