import type { Category, Colour } from "@web-games/dress-rehearsal-core";
import { type GarmentPaint, garmentPaint } from "../theme/garment";
import { PALETTE } from "../theme/tokens";
import { paintOf } from "./draw";
import { DEFAULT_STROKE_WIDTH, GLYPH_SHAPES, type GlyphShape } from "./shapes";

export interface GlyphProps {
  category: Category;
  colour: Colour;
  size?: number;
  label?: string;
  /** Art slot id when drawn as a fallback for designer art. */
  slot?: string;
  class?: string;
}

function shapeNode(shape: GlyphShape, index: number, paint: GarmentPaint) {
  const fill = paintOf(shape.fill, paint, PALETTE.paper);
  const stroke = shape.stroke === undefined ? null : paintOf(shape.stroke, paint, PALETTE.paper);
  const common = {
    fill: fill ?? "none",
    stroke: stroke ?? "none",
    "stroke-width": stroke === null ? 0 : (shape.sw ?? DEFAULT_STROKE_WIDTH),
    "stroke-linejoin": "round" as const,
    "stroke-linecap": "round" as const,
  };
  if (shape.kind === "circle") {
    return <circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} {...common} />;
  }
  return <path key={index} d={shape.d} {...common} />;
}

/** The code-drawn garment for a category, filled with the piece colour and outlined in ink. */
export function Glyph({ category, colour, size = 56, label, slot, class: className }: GlyphProps) {
  const paint = garmentPaint(colour);
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: named through aria-label, or hidden when the control around it has the name
    <svg
      class={className ? `dr-glyph ${className}` : "dr-glyph"}
      data-category={category}
      data-colour={colour}
      {...(slot === undefined ? {} : { "data-art": "fallback", "data-art-slot": slot })}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      {...(label === undefined
        ? { "aria-hidden": "true" as const }
        : { role: "img" as const, "aria-label": label })}
    >
      {GLYPH_SHAPES[category].map((shape, index) => shapeNode(shape, index, paint))}
    </svg>
  );
}
