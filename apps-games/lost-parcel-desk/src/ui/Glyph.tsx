import { GLYPH_KINDS, type GlyphKind } from "@web-games/lost-parcel-desk-core";
import type { VNode } from "preact";
import { GLYPH_DRAWINGS, type Shape } from "../art/shapes";
import { PALETTE } from "../theme/tokens";

export const GRAIN_ID = "lp-grain" as const;

function paint(
  shape: Shape,
  key: string,
  fill: string,
  extra: Record<string, unknown> = {},
): VNode {
  switch (shape.k) {
    case "rect":
      return (
        <rect
          key={key}
          x={shape.x}
          y={shape.y}
          width={shape.w}
          height={shape.h}
          rx={shape.r ?? 0}
          fill={fill}
          {...extra}
        />
      );
    case "circle":
      return <circle key={key} cx={shape.x} cy={shape.y} r={shape.r} fill={fill} {...extra} />;
    case "ellipse":
      return (
        <ellipse
          key={key}
          cx={shape.x}
          cy={shape.y}
          rx={shape.rx}
          ry={shape.ry}
          fill={fill}
          {...extra}
        />
      );
    case "poly":
      return <polygon key={key} points={shape.pts} fill={fill} {...extra} />;
    case "path":
      return <path key={key} d={shape.d} fill={fill} {...extra} />;
    case "line":
      return (
        <path
          key={key}
          d={shape.d}
          fill="none"
          stroke={fill}
          stroke-width={shape.sw}
          stroke-linecap="round"
          stroke-linejoin="round"
          {...extra}
        />
      );
  }
}

/** Pure drawing of one object glyph: offset layer, flat fills, then a dot grain pass. */
export function glyphNodes(kind: GlyphKind): VNode[] {
  const drawing = GLYPH_DRAWINGS[kind];
  const offset = PALETTE[drawing.offset];
  return [
    <g key="offset" data-layer="offset" transform="translate(2 2)" opacity="0.8">
      {drawing.shapes.map((shape, index) => paint(shape, `o${index}`, offset))}
    </g>,
    <g key="fill" data-layer="fill" stroke={PALETTE.ink} stroke-width="1.5" stroke-linejoin="round">
      {drawing.shapes.map((shape, index) =>
        paint(
          shape,
          `f${index}`,
          PALETTE[shape.c],
          shape.k === "line" ? { stroke: PALETTE[shape.c] } : {},
        ),
      )}
    </g>,
    <g key="grain" data-layer="grain" opacity="0.22" pointer-events="none">
      {drawing.shapes
        .filter((shape) => shape.k !== "line")
        .map((shape, index) => paint(shape, `g${index}`, `url(#${GRAIN_ID})`, { stroke: "none" }))}
    </g>,
  ];
}

export function GrainDefs() {
  return (
    <defs>
      <pattern id={GRAIN_ID} width="4" height="4" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.8" fill={PALETTE.ink} />
        <circle cx="3" cy="3" r="0.6" fill={PALETTE.ink} />
      </pattern>
    </defs>
  );
}

export interface GlyphProps {
  kind: GlyphKind;
  size?: number;
  label?: string;
  class?: string;
}

export function Glyph({ kind, size = 64, label, class: className }: GlyphProps) {
  const cls = className ? `lp-glyph ${className}` : "lp-glyph";
  if (label) {
    return (
      <svg
        class={cls}
        viewBox="0 0 100 100"
        width={size}
        height={size}
        data-glyph={kind}
        role="img"
        aria-label={label}
      >
        <GrainDefs />
        {glyphNodes(kind)}
      </svg>
    );
  }
  return (
    <svg
      class={cls}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      data-glyph={kind}
      aria-hidden="true"
    >
      <GrainDefs />
      {glyphNodes(kind)}
    </svg>
  );
}

export { GLYPH_KINDS };
