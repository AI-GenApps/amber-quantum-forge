import type { Finale, FinaleLine, FinaleVariant } from "./types";

type Triple = readonly [string, string, string];

const TEXTS: readonly Triple[] = [
  [
    "Odile stands at the old switch, and the beam sweeps the quay. Nothing lost tonight.",
    "A brass lens hangs in the Last Window, and Odile keeps watch from her chair.",
    "Odile watches the harbour from her chair by the glass, still deciding about the lens.",
  ],
  [
    "The Marigold glides out strung with paper lights, and Tobias grins at the wheel.",
    "A new postcard waits by the till. Tobias is far away, and still one of us.",
    "Tobias leans on the ferry rail, a letter in his pocket, still deciding.",
  ],
  [
    "Children line up at Priya's touch table, whispering to the tide pools.",
    "Priya's letter from the institute is pinned by the till, and her guide is on its way.",
    "Priya wades the shallows with her notebook, still wondering what to do with her find.",
  ],
  [
    "Juno reads on the quay, and the whole crowd listens. Her voice does not shake.",
    "Forty copies of Juno's zine are gone, and strangers read them by lantern light.",
    "Juno hums on her way to the bakery, her notebook safe in her apron pocket.",
  ],
  [
    "Henrik and Karin share one stall and two chairs, and the queue reaches the sea wall.",
    "A green bench stands between two stalls. Henrik and Karin share the morning tea.",
    "Henrik stands at his stall, a letter half written in his pocket.",
  ],
  [
    "Leona sends a sandy postcard from the shore. She ate lunch sitting down.",
    "The clinic door has a new sign, shared hours, and a drawing of a teacup.",
    "Leona catches a quiet ten minutes at the counter, her brochure folded in her coat.",
  ],
  [
    "Ines steps off the ferry, and Abel waits on the quay with the book.",
    "The book waits in the window, and Abel reads poems aloud there every Thursday.",
    "Abel checks the post once more, the book open on his knee.",
  ],
  [
    "The sea wall is a patchwork of everyone's tiles, and Sunniva only held the brush.",
    "One long sunrise stretches along the sea wall, and the whole town stands quietly to watch.",
    "Sunniva studies the blank sea wall, a pencil in her bun and seven jars at her feet.",
  ],
];

const VARIANTS: readonly FinaleVariant[] = ["a", "b", "unfinished"];

export const FINALE_LINES: readonly FinaleLine[] = TEXTS.flatMap((triple, index) =>
  triple.map((text, slot) => ({
    regularId: index + 1,
    variant: VARIANTS[slot] as FinaleVariant,
    text,
  })),
);

export const FINALE: Finale = {
  lines: FINALE_LINES,
  caption:
    "Marit's notebook, last page: A lamp is only a small thing. But the whole harbour finds its way home by it.",
};

export function finaleLine(regularId: number, variant: FinaleVariant): string {
  const line = FINALE_LINES.find(
    (entry) => entry.regularId === regularId && entry.variant === variant,
  );
  if (line === undefined) throw new RangeError(`no finale line for ${regularId} ${variant}`);
  return line.text;
}
