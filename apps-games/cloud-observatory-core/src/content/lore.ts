import type { LoreChapter, LoreEntry, LoreTrigger } from "./types";

export const LORE_CHAPTERS: readonly LoreChapter[] = [
  { number: 1, title: "The Roof at Dusk", slot: "lore-1" },
  { number: 2, title: "The Brass Years", slot: "lore-2" },
  { number: 3, title: "The Night Library", slot: "lore-3" },
  { number: 4, title: "The Dimming Hours", slot: "lore-4" },
  { number: 5, title: "The Hour of Shadow", slot: "lore-5" },
  { number: 6, title: "Morning Star", slot: "lore-6" },
];

function entry(
  id: string,
  chapter: number,
  title: string,
  trigger: LoreTrigger,
  body: string,
): LoreEntry {
  return { id, chapter, title, trigger, body };
}

const instrument = (id: string): LoreTrigger => ({ kind: "instrument", id });
const constellation = (id: string): LoreTrigger => ({ kind: "constellation", id });
const boon = (id: string): LoreTrigger => ({ kind: "boon", id });

const CHAPTER_ONE: readonly LoreEntry[] = [
  entry(
    "lore-01",
    1,
    "The Key Under the Slate",
    instrument("telescope"),
    "A loose slate by the chimney gives way under your hand, and beneath it lies a small iron key wrapped in oilcloth. A note is folded inside, written in a careful slanting hand: Look up. V. You turn the key over twice. It fits the little door behind the dust sheet, where a brass telescope waits, cold and patient. The roof is yours now, and so is the evening.",
  ),
  entry(
    "lore-02",
    1,
    "Verity's Logbook",
    instrument("lens"),
    "Beside the lens rack you find her logbook, its spine gone soft from use. The early pages are crowded with sketches, times and small exclamations. Toward the end the entries thin out, one line, then a few words, then only a date and the phrase quiet again. You do not read it as sadness. You read it as a habit, kept faithfully, for whoever might be watching next.",
  ),
  entry(
    "lore-03",
    1,
    "The Lyre Rises",
    constellation("lyre"),
    "You draw the last line and the Lyre holds its shape against the dark. For a breath nothing happens. Then, faintly, the sky hums back, a single low note that you feel in the slates under your boots rather than hear. It is not loud. It does not need to be. Somewhere above, a very old instrument has been tuned, and it recognises your hand.",
  ),
  entry(
    "lore-04",
    1,
    "A Crown of Six",
    constellation("crown"),
    "Six stars close into a circle, small and exact, like a circlet set down on dark velvet. In the margin of Verity's logbook, beside her own sketch of the Crown, she wrote four words: someone is listening. You read them aloud, softly, to the empty roof. The wind turns a page for you, and for a moment it feels like an answer.",
  ),
  entry(
    "lore-05",
    1,
    "Ink and Dew",
    instrument("prism"),
    "The prism splits a thread of starlight into colours, and you remember a recipe pinned inside the logbook cover. Gold ink, Verity wrote, is dew from the north slates, lamp soot and patience, stirred at dawn with a feather quill. You mix a spoonful of your own. It dries the colour of a lit doorway at dusk, and it smells faintly of rain.",
  ),
];

const CHAPTER_TWO: readonly LoreEntry[] = [
  entry(
    "lore-06",
    2,
    "The Key That Fits",
    constellation("key"),
    "The iron key turns in a drawer you had thought was only a panel. Inside lie letters from the town below, tied in faded ribbon: thanks, questions, a child's drawing of the Lyre with far too many strings. Verity answered every one, you can tell from the replies she kept in copy. The sky, it seems, was never her only company.",
  ),
  entry(
    "lore-07",
    2,
    "Lantern Nights",
    constellation("lantern"),
    "Once a month, on the first clear night, the town hung lanterns along its lanes and turned its faces upward. Verity answered from the roof with one long flash of the lamp. You find the old signal card, edges worn soft. When the Lantern settles into place among the stars, you hold the lamp high and flash once, just in case anyone still remembers.",
  ),
  entry(
    "lore-08",
    2,
    "The Orrery Turns",
    instrument("orrery"),
    "Anselm the clockmaker built the orrery in a single winter, and Verity noted that he never looked up at the real sky again. He said he had already seen it done properly in brass. The planets turn by hand and gear, each on its own patient arm. You wind the key a half turn and listen to them agree with one another.",
  ),
  entry(
    "lore-09",
    2,
    "Whale Song",
    constellation("whale"),
    "Sailors once steered by the Whale and sang to it when the nights were long. A scrap of their lullaby is tucked behind the map drawer: slow and deep, the dark will keep, the light will find you by and by. You hum it badly. The lamp seems to lean a little closer, as if it, too, would like to learn the tune.",
  ),
  entry(
    "lore-10",
    2,
    "Printing the Heavens",
    instrument("star-map"),
    "The press runs all evening, setting the sky onto vellum, sheet after sheet. Verity sent the charts to the schools along the valley, and the children sent back their own, pencil stars in the margins, some wildly misplaced and all of them treasured. You pin one above the bench: a crooked Whale with a smile. It is exactly right.",
  ),
];

const CHAPTER_THREE: readonly LoreEntry[] = [
  entry(
    "lore-11",
    3,
    "The Harp Strings",
    constellation("harp"),
    "Each string of the Harp, Verity wrote, is a night she kept watch alone. The first is the night she arrived, the second the night the snow came sideways, the third a night nobody wrote to her at all. You count them with one finger along the frame. Alone is a different thing under a sky that keeps its shape and, quietly, keeps you.",
  ),
  entry(
    "lore-12",
    3,
    "The Fox in the Margins",
    constellation("fox"),
    "In the margin beside the Fox, Verity drew a small, unmistakable fox wearing a scarf, and beneath it the only joke in all her logbook: never trust a constellation that looks this pleased with itself. You laugh out loud, alone on the roof, and it is the first laughter the place has heard in years. The slates seem to enjoy it.",
  ),
  entry(
    "lore-13",
    3,
    "A Light on the Ridge",
    instrument("beacon"),
    "The beacon flashes into the dark and you wait, counting. Nothing. Then, far along the ridge, a pinprick of answering light. Then another beyond it, then a third, faint as a breath on cold glass. You had thought the roof was the whole world. It is only one lamp among many, each keeper holding theirs up in turn.",
  ),
  entry(
    "lore-14",
    3,
    "The Night Library",
    instrument("archive"),
    "The archive hums with shelves of watched nights, each one a thin folio of observations tied in thread. You find the night of Verity's arrival, the night of the great meteor, and a long row of nights you recognise as your own. Further along there are blank folios, waiting. Unwatched nights are not lost, the label says. They are only unwritten.",
  ),
  entry(
    "lore-15",
    3,
    "The Archer's Patience",
    constellation("archer"),
    "The Archer does not shoot. It draws and holds, string taut, arrow aimed at a star that has not yet risen. Verity underlined one line in her notes: waiting is also an instrument. You sit with the lamp turned low and wait with it. The thing you were waiting for arrives quietly, the way the best things do.",
  ),
];

const CHAPTER_FOUR: readonly LoreEntry[] = [
  entry(
    "lore-16",
    4,
    "The Serpent's Coil",
    constellation("serpent"),
    "The Serpent circles the question without ever asking it. You trace the coils and feel them tighten and loosen like a long, slow breath. Verity's note says only: some patterns are not answers, they are company while you hold the question. You decide to keep the question. It seems to weigh less when something warm is curled around it.",
  ),
  entry(
    "lore-17",
    4,
    "The Ship Sets Out",
    constellation("ship"),
    "You learn something Verity spent decades confirming. The stars do not die when they go unwatched. They drift, gently, like a ship slipped from its mooring, and charting is how you call them home. The sail of the Ship fills as you finish the last line, and the roof hums with something very like gratitude.",
  ),
  entry(
    "lore-18",
    4,
    "The Tower Without a Door",
    constellation("tower"),
    "There is no way into the Tower except by looking. You walk all around its outline and find no door, only stairs of light that appear when you pay attention to them. Verity wrote, in an unsteady hand: some places are built from being noticed. You climb a few steps, and the stairs hold, and the view is kind.",
  ),
  entry(
    "lore-19",
    4,
    "The Owl Who Keeps Count",
    constellation("owl"),
    "The last chart is the Owl, and its eyes finally meet yours. It has been counting every star you drew, every lamp you lit, every quiet night between. The count, you realise, is the sky remembering itself, one patient number at a time. The Owl blinks, slowly, and you find yourself blinking back.",
  ),
  entry(
    "lore-20",
    4,
    "Aurora Over the Roof",
    instrument("aurora-coil"),
    "The coil hums, copper warm against your palm, and the sky answers. Ribbons of green and rose unfurl over the roof, silent and enormous, and for a moment it is not quiet at all. Everything above you is speaking in colour. You do not reach for the logbook. You do not write anything down. You simply stay, and listen, and let it happen.",
  ),
];

const CHAPTER_FIVE: readonly LoreEntry[] = [
  entry(
    "lore-21",
    5,
    "Dark-Adapted",
    boon("dark-adapted"),
    "Eyes learn the dark slowly, a little more each minute, until shapes you thought were nothing resolve into stars. You stand under the Eclipse and wait for your sight to come back. Everything else is like this too, you decide: trust, craft, the hang of a hard tune. It comes to those willing to sit in the dark a while.",
  ),
  entry(
    "lore-22",
    5,
    "What Brass Remembers",
    boon("brass-polish"),
    "Metal keeps the shape of every hand that held it. The telescope's focusing ring has a faint bright groove worn by Verity's thumb, and now by yours. You fit your thumb into it. Brass remembers, and passes along what it knows, one polished turn at a time, to whoever picks it up next. You rub it with your sleeve until it shines.",
  ),
  entry(
    "lore-23",
    5,
    "Clear Glass",
    boon("clear-glass"),
    "Verity's secret, you discover, was not genius. She cleaned the glass every night, before anything else, with a soft cloth and a small word of thanks. A clear lens, she wrote, is just an honest one. You polish until the lamplight shows no smear, and the stars arrive sharper than you have ever seen them.",
  ),
  entry(
    "lore-24",
    5,
    "The Night Watch",
    boon("night-watch"),
    "Someone keeps watch while you sleep. Instruments turn, lamps burn low and steady, and patient hands you have never met keep the ledger. You are not alone on the roof, and perhaps you never were. Before you go down the ladder you leave a mug of tea cooling on the sill, the way someone once left one for you.",
  ),
  entry(
    "lore-25",
    5,
    "The Apprentice's Bench",
    boon("apprentice"),
    "Under the sloped eaves stands a low wooden bench, scarred and stained with ink, a pair of letters scratched into its edge: V.H. This was Verity's own first bench, from the first season, when she knew nothing at all. You sit where she sat. Your feet do not quite reach the floor, and somehow that is the most reassuring thing you have found.",
  ),
];

const CHAPTER_SIX: readonly LoreEntry[] = [
  entry(
    "lore-26",
    6,
    "Atlas Ink",
    boon("atlas-ink"),
    "The atlas is a letter to whoever comes next. You see that now, laying the last gold line down. Every star charted says: here, this one, I found it for you. You add a small note of your own in the corner of the Owl's page, in your own hand, and leave a space beneath it for later.",
  ),
  entry(
    "lore-27",
    6,
    "The Long Vigil",
    boon("long-vigil"),
    "Watching is not waiting. Waiting hopes for something to arrive; watching is already company. Through the long vigil the roof grows familiar: the creak of the third slate, the smell of lamp oil, the sound the sky makes when it settles for the night. You stay until the cold turns kind.",
  ),
  entry(
    "lore-28",
    6,
    "Second Sight",
    boon("second-sight"),
    "Seeing a thing twice is how it becomes yours. The first time, the Whale was a pattern. The second time, it was a place you knew. You go back over the old charts with fresh eyes, and the sky seems to rearrange itself, politely, into a shape you can finally keep.",
  ),
  entry(
    "lore-29",
    6,
    "Corona",
    boon("corona"),
    "At the height of the Eclipse, a ring of pale light holds the dark at arm's length. Verity called it the sky's thank-you: not a reward, but an acknowledgement, a hand held out. You stand inside its glow and say thank you back. It seems the polite thing to do, and also the true one.",
  ),
  entry(
    "lore-30",
    6,
    "Totality",
    boon("totality"),
    "The last page of the logbook is blank except for one line in Verity's hand: leave the key under the slate. Dawn arrives slowly across the roof. You wrap the iron key in oilcloth, tuck a note beneath it that says Look up, and slide the slate back into place. Somewhere below, a child is waking up.",
  ),
];

export const LORE: readonly LoreEntry[] = [
  ...CHAPTER_ONE,
  ...CHAPTER_TWO,
  ...CHAPTER_THREE,
  ...CHAPTER_FOUR,
  ...CHAPTER_FIVE,
  ...CHAPTER_SIX,
];
