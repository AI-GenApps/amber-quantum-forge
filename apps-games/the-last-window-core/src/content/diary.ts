import { DAYS } from "./days";
import type { DiaryEntry } from "./types";

const TEXTS: readonly string[] = [
  "I lit Marit's lamp and turned the sign. Three regulars came in before noon. Odile took the chair by the glass. I spilled only two cups.",
  "Salt on every window, and a busy evening. Juno hid a notebook, Henrik grumbled about my stools, and a doctor fell asleep over her tea.",
  "The first rain. The quay shone and the shop filled with wet coats. Odile brought her logbook, Priya drew a sea slug, and Abel found his own name in a book.",
  "A bright morning smelling of oil and cinnamon. Tobias brought a letter from the cargo line. Juno hung a poster in the window. Abel told me about Ines.",
  "The lamps went on before dusk. Priya came in muddy with a jar, Henrik would not say a name, and Leona showed me a brochure of the sea.",
  "A grey quay and a full shop. Odile showed me a council letter. Tobias needed a pump part. Sunniva stared at a blank wall and I gave advice.",
  "Market morning. Henrik brought a cracked crate. Abel found a ledger. Juno read me a page, and I forgot the cocoa twice.",
  "Ink on the counter and chamomile in the cups. Leona ate a squashed sandwich, Priya practised her talk, and Sunniva lined up seven jars of grey.",
  "The long rain kept everyone indoors. Odile told me about Marit's lamp in the fog. I walked down to see Tobias at the ferry. Juno shook like a leaf.",
  "A fresh morning and a quiet shop. Priya told me how her talk went. Henrik read a note from Karin. Abel waited for the post. I made my first mocha.",
  "Council week. Odile opened an envelope. Leona helped a neighbour's boy, then went home to rest. Sunniva loved a crayon drawing. My ginger loaf was nearly right.",
  "Storm warning flags on the quay. Tobias tested his pump four times. Juno finished her draft. Abel opened a letter in the rain.",
  "The night before. Lanterns stacked in every doorway. Henrik polished his boots. Leona slept. Sunniva asked me to stand at the wall with her.",
  "Lantern Night. The lamp in the window was the last to be lit. Every regular came, and the harbour glowed. Marit would have been proud.",
];

export const DIARY: readonly DiaryEntry[] = DAYS.map((day, index) => ({
  day: day.day,
  title: day.title,
  text: TEXTS[index] as string,
}));
