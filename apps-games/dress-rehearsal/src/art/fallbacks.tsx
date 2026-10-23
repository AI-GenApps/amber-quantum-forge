import { CHAPTERS, PIECE_BY_ID, type ThemeId } from "@web-games/dress-rehearsal-core";
import { Glyph } from "../glyphs/Glyph";
import { ACCENTS, PALETTE } from "../theme/tokens";
import { BackdropDrawing, FeatureDrawing, IconDrawing, KeyArtDrawing } from "./drawings";
import { type SlotId, type SlotKind, slotDef } from "./slots";

export const RATIO: Readonly<Record<SlotKind, number>> = {
  item: 1,
  client: 4 / 3,
  backdrop: 1.5,
  keyart: 1.5,
  icon: 1,
  landscape: 2 / 3,
};

const CLIENT_INITIALS: readonly string[] = ["M", "T", "O", "P", "J", "E"];

function accentOf(index: number): string {
  const theme = CHAPTERS[index]?.themeId;
  return theme === undefined ? PALETTE.ink : ACCENTS[theme];
}

function backdropTheme(slot: SlotId): ThemeId | null {
  const match = /^backdrop-(.+)$/.exec(slot);
  const theme = match?.[1];
  return CHAPTERS.find((chapter) => chapter.themeId === theme)?.themeId ?? null;
}

export interface FallbackProps {
  slot: SlotId;
  size: number;
  label: string;
  decorative: boolean;
  className: string | undefined;
}

export function Fallback({ slot, size, label, decorative, className }: FallbackProps) {
  const kind = slotDef(slot).kind;
  if (kind === "item") {
    const piece = PIECE_BY_ID.get(slot);
    if (piece) {
      return (
        <Glyph
          category={piece.category}
          colour={piece.colour}
          size={size}
          {...(decorative ? {} : { label })}
          slot={slot}
          {...(className ? { class: className } : {})}
        />
      );
    }
  }
  if (kind === "client") {
    const index = Number(slot.slice("client-".length)) - 1;
    return (
      <div
        class={className ? `dr-badge ${className}` : "dr-badge"}
        data-art="fallback"
        {...(decorative
          ? { "aria-hidden": "true" as const }
          : { role: "img" as const, "aria-label": label })}
        data-art-slot={slot}
        style={{
          "--dr-accent": accentOf(index),
          width: `${size}px`,
          height: `${Math.round(size * RATIO.client)}px`,
        }}
      >
        <span aria-hidden="true">{CLIENT_INITIALS[index] ?? "?"}</span>
      </div>
    );
  }
  const index = (() => {
    const theme = backdropTheme(slot);
    const found = CHAPTERS.findIndex((chapter) => chapter.themeId === theme);
    return found < 0 ? 4 : found;
  })();
  const accent = accentOf(index);
  const drawLabel = decorative ? "" : label;
  if (kind === "backdrop") {
    return (
      <BackdropDrawing size={size} label={drawLabel} accent={accent} slot={slot} seed={index + 3} />
    );
  }
  if (kind === "keyart")
    return <KeyArtDrawing size={size} label={drawLabel} accent={accentOf(2)} slot={slot} />;
  if (kind === "icon")
    return <IconDrawing size={size} label={drawLabel} accent={accentOf(2)} slot={slot} />;
  return <FeatureDrawing size={size} label={drawLabel} accent={accentOf(4)} slot={slot} />;
}
