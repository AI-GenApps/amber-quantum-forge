import { PALETTE } from "../theme/tokens";
import { FALLBACKS } from "./fallbacks";
import { ART_MANIFEST, hasArt } from "./manifest";
import type { Role, RoleColors, Shape } from "./shapes";
import { type SlotId, slotUrl } from "./slots";

export const DEFAULT_ROLE_COLORS: RoleColors = {
  ...PALETTE,
  wall: PALETTE.paper2,
  roof: PALETTE.clay,
  leaf: PALETTE.meadowDeep,
  leafDark: "#3a512c",
  trunk: "#6b4a2a",
};

export interface SpriteProps {
  slot: SlotId;
  size?: number;
  label?: string;
  colors?: RoleColors;
  manifest?: readonly SlotId[];
  class?: string;
}

function shapeElement(shape: Shape, index: number, colors: RoleColors) {
  const paint = (role: Role | undefined) => (role ? colors[role] : "none");
  const common = {
    fill: paint(shape.fill),
    stroke: paint(shape.stroke),
    "stroke-width": shape.stroke ? (shape.sw ?? 2.5) : 0,
    "stroke-linejoin": "round" as const,
    opacity: shape.a ?? 1,
  };
  if (shape.k === "rect") {
    return (
      <rect
        key={index}
        x={shape.x}
        y={shape.y}
        width={shape.w}
        height={shape.h}
        rx={shape.r ?? 0}
        {...common}
      />
    );
  }
  if (shape.k === "circle") {
    return <circle key={index} cx={shape.x} cy={shape.y} r={shape.r} {...common} />;
  }
  const points = shape.pts.join(" ");
  return shape.open ? (
    <polyline key={index} points={points} {...common} />
  ) : (
    <polygon key={index} points={points} {...common} />
  );
}

/** Renders designer art when the manifest lists the slot, otherwise the code-drawn fallback. */
export function Sprite({
  slot,
  size = 48,
  label,
  colors = DEFAULT_ROLE_COLORS,
  manifest = ART_MANIFEST,
  class: className,
}: SpriteProps) {
  const fallback = FALLBACKS[slot];
  const name = label ?? fallback.label;
  if (hasArt(slot, manifest)) {
    return (
      <img
        class={className}
        data-slot={slot}
        data-art="image"
        src={slotUrl(slot)}
        width={size}
        height={size}
        alt={name}
      />
    );
  }
  const background = fallback.gradient
    ? `linear-gradient(${colors[fallback.gradient[0]]}, ${colors[fallback.gradient[1]]})`
    : undefined;
  return (
    <svg
      class={className}
      data-slot={slot}
      data-art="fallback"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={name}
      style={background ? { background } : undefined}
    >
      {fallback.shapes.map((shape, index) => shapeElement(shape, index, colors))}
    </svg>
  );
}
