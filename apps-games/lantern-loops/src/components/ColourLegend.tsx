import { COLOURS, type Colour, type Puzzle } from "@web-games/lantern-loops-core";
import { colourName } from "../a11y/labels";
import { ArtImage } from "../art/ArtImage";
import type { SlotId } from "../art/slots";

const SLOT_BY_COLOUR: Readonly<Record<Colour, SlotId>> = {
  amber: "lantern-amber",
  rose: "lantern-rose",
  jade: "lantern-jade",
  azure: "lantern-azure",
  violet: "lantern-violet",
};

/** Colours that matter to the player: more than one lantern colour, or any gate. */
export function legendColours(puzzle: Puzzle): Colour[] {
  const used = new Set<Colour>();
  let hasGate = false;
  for (const cell of puzzle.cells) {
    const content = cell.clue;
    if (content?.kind === "lantern") used.add(content.colour);
    if (content?.kind === "gate") {
      used.add(content.colour);
      hasGate = true;
    }
  }
  return used.size > 1 || hasGate ? COLOURS.filter((colour) => used.has(colour)) : [];
}

export interface ColourLegendProps {
  puzzle: Puzzle;
  files?: ReadonlyMap<string, string> | undefined;
}

/** Row of coloured lantern icons naming each colour that appears on the board. */
export function ColourLegend({ puzzle, files }: ColourLegendProps) {
  const colours = legendColours(puzzle);
  if (colours.length === 0) return null;
  return (
    <ul class="ll-legend" data-testid="colour-legend">
      {colours.map((colour) => (
        <li key={colour} class="ll-legend-item" data-colour={colour}>
          <ArtImage slot={SLOT_BY_COLOUR[colour]} size={24} files={files} />
          <span>{colourName(colour)}</span>
        </li>
      ))}
    </ul>
  );
}
