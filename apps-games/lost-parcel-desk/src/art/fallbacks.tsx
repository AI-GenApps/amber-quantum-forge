import { CASES, type GlyphKind, PEOPLE } from "@web-games/lost-parcel-desk-core";
import type { VNode } from "preact";
import { DISPLAY_FAMILY } from "../fonts";
import { PALETTE, type PaletteToken } from "../theme/tokens";
import { GrainDefs, glyphNodes } from "../ui/Glyph";
import { type SlotDef, slotDef } from "./slots";

export const GLYPH_BY_SLOT: Readonly<Record<string, GlyphKind>> = Object.fromEntries(
  CASES.flatMap((item) => item.objects.map((object) => [object.artSlot, object.glyph] as const)),
);

export interface FallbackSpec {
  /** Accessible name when the caller passes none. */
  label: string;
  width: number;
  height: number;
  nodes: VNode[];
}

const PORTRAIT_TINTS: readonly PaletteToken[] = [
  "mustard",
  "tealLight",
  "mustardLight",
  "cream2",
  "tealDeep",
  "brick",
];

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function portrait(slot: string): FallbackSpec {
  const index = PEOPLE.findIndex((person) => person.portraitSlot === slot);
  const person = PEOPLE[index];
  const fill = PORTRAIT_TINTS[Math.max(0, index) % PORTRAIT_TINTS.length] as PaletteToken;
  const name = person?.name ?? "Townsperson";
  return {
    label: `Portrait of ${name}`,
    width: 75,
    height: 100,
    nodes: [
      <rect key="bg" x="0" y="0" width="75" height="100" rx="6" fill={PALETTE[fill]} />,
      <circle
        key="head"
        cx="37.5"
        cy="36"
        r="18"
        fill={PALETTE.cream}
        stroke={PALETTE.ink}
        stroke-width="1.5"
      />,
      <path
        key="body"
        d="M8 100 C8 66 28 58 37.5 58 C47 58 67 66 67 100 Z"
        fill={PALETTE.cream2}
        stroke={PALETTE.ink}
        stroke-width="1.5"
      />,
      <text
        key="t"
        x="37.5"
        y="42"
        text-anchor="middle"
        font-size="16"
        font-weight="700"
        font-family={DISPLAY_FAMILY}
        fill={PALETTE.ink}
      >
        {initialsOf(name)}
      </text>,
    ],
  };
}

function parcel(open: boolean): FallbackSpec {
  return {
    label: open ? "Open parcel with tissue" : "Tied brown-paper parcel",
    width: 100,
    height: 100,
    nodes: [
      <rect
        key="b"
        x="14"
        y="34"
        width="72"
        height="50"
        rx="3"
        fill={PALETTE.cream2}
        stroke={PALETTE.ink}
        stroke-width="1.5"
      />,
      open ? (
        <path
          key="t"
          d="M14 34 L26 14 L50 30 L74 14 L86 34 Z"
          fill={PALETTE.cream}
          stroke={PALETTE.ink}
          stroke-width="1.5"
        />
      ) : (
        <rect key="s" x="46" y="34" width="8" height="50" fill={PALETTE.brick} />
      ),
      open ? (
        <path key="m" d="M24 56 H76" stroke={PALETTE.line} stroke-width="2" />
      ) : (
        <rect key="s2" x="14" y="55" width="72" height="8" fill={PALETTE.brick} />
      ),
      <rect
        key="tag"
        x="58"
        y="22"
        width="22"
        height="14"
        rx="2"
        fill={PALETTE.mustardLight}
        stroke={PALETTE.ink}
        stroke-width="1.2"
        transform="rotate(8 69 29)"
      />,
    ],
  };
}

function backdrop(): FallbackSpec {
  return {
    label: "Sorting desk",
    width: 100,
    height: 150,
    nodes: [
      <rect key="b" width="100" height="150" fill={PALETTE.cream2} />,
      <rect key="g" width="100" height="150" fill="url(#lp-grain)" opacity="0.18" />,
      <rect
        key="p"
        x="8"
        y="14"
        width="84"
        height="122"
        rx="4"
        fill={PALETTE.mustard}
        opacity="0.55"
      />,
    ],
  };
}

function keyArt(): FallbackSpec {
  return {
    label: "Lost Parcel Desk",
    width: 100,
    height: 150,
    nodes: [
      <rect key="b" width="100" height="150" fill={PALETTE.night} />,
      <circle key="halo" cx="50" cy="52" r="34" fill={PALETTE.mustardLight} opacity="0.35" />,
      <path
        key="lamp"
        d="M50 18 L70 52 H30 Z"
        fill={PALETTE.mustard}
        stroke={PALETTE.ink}
        stroke-width="1.5"
      />,
      <rect key="desk" x="0" y="112" width="100" height="38" fill={PALETTE.tealDeep} />,
      <rect
        key="env"
        x="26"
        y="92"
        width="48"
        height="32"
        rx="2"
        fill={PALETTE.cream}
        stroke={PALETTE.ink}
        stroke-width="1.5"
      />,
      <path
        key="flap"
        d="M26 92 L50 110 L74 92"
        fill="none"
        stroke={PALETTE.ink}
        stroke-width="1.5"
      />,
    ],
  };
}

function icon(): FallbackSpec {
  return {
    label: "Lost Parcel Desk",
    width: 100,
    height: 100,
    nodes: [
      <rect key="b" width="100" height="100" rx="18" fill={PALETTE.tealDeep} />,
      <rect
        key="e"
        x="16"
        y="30"
        width="68"
        height="46"
        rx="3"
        fill={PALETTE.cream}
        stroke={PALETTE.ink}
        stroke-width="2"
      />,
      <path key="f" d="M16 30 L50 56 L84 30" fill="none" stroke={PALETTE.ink} stroke-width="2" />,
      <circle
        key="s"
        cx="72"
        cy="38"
        r="12"
        fill={PALETTE.brick}
        stroke={PALETTE.cream}
        stroke-width="2"
      />,
    ],
  };
}

function plain(def: SlotDef): FallbackSpec {
  return {
    label: def.id,
    width: 100,
    height: 100,
    nodes: [<rect key="b" width="100" height="100" fill={PALETTE.cream2} />],
  };
}

/** One code-drawn fallback per slot kind; always returns a drawing so a missing image never leaves a gap. */
export function fallbackFor(slot: string): FallbackSpec {
  const def = slotDef(slot);
  if (!def) return { label: slot, width: 100, height: 100, nodes: [] };
  switch (def.kind) {
    case "evidence": {
      const kind = GLYPH_BY_SLOT[slot] ?? "paper";
      return { label: `Evidence: ${kind}`, width: 100, height: 100, nodes: glyphNodes(kind) };
    }
    case "portrait":
      return portrait(slot);
    case "parcel":
      return parcel(slot === "parcel-open");
    case "backdrop":
      return backdrop();
    case "key-art":
      return keyArt();
    case "icon":
      return icon();
    case "store":
      return plain(def);
  }
}

export { GrainDefs };
