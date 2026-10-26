import type { RuleCard, TutorialStep } from "./types";

export const RULE_CARDS: readonly RuleCard[] = [
  {
    id: "brief",
    title: "The brief",
    shownOn: "riv-01",
    kinds: [],
    text: "Fill every slot, then meet every rule on the client's card. A rule turns green when it is met.",
  },
  {
    id: "warmth",
    title: "Warmth",
    shownOn: "riv-01",
    kinds: ["warmth-min", "warmth-max"],
    text: "Every piece has a warmth from 0 (airy) to 3 (heavy). Weather rules add up the warmth of the whole look.",
  },
  {
    id: "features",
    title: "Features",
    shownOn: "riv-01",
    kinds: ["needs-feature"],
    text: "Some pieces are waterproof, give shade, sparkle or are sturdy. A rule can ask for at least one.",
  },
  {
    id: "colour-wheel",
    title: "Colour wheel",
    shownOn: "riv-02",
    kinds: ["palette-warm", "palette-cool", "max-hues", "include-colour", "avoid-colour"],
    text: "Neutrals go with everything. Beyond that, neighbours and opposites on the wheel get along; too many colours do not.",
  },
  {
    id: "budget",
    title: "Budget",
    shownOn: "riv-02",
    kinds: ["max-spend", "min-spend"],
    text: "Each piece has a price in dollars. Some briefs cap the spend, and some ask for a splurge.",
  },
  {
    id: "one-piece",
    title: "One-piece rule",
    shownOn: "riv-03",
    kinds: [],
    text: "A dress replaces the top and the bottom. Placing one clears the other pieces.",
  },
  {
    id: "dress-codes",
    title: "Dress codes",
    shownOn: "riv-05",
    kinds: ["formality-min", "formality-max"],
    text: "Formality runs from 1 (loungewear) to 5 (black tie). A dress-code rule sets a floor or a ceiling for every piece.",
  },
  {
    id: "must-not",
    title: "Must and must-not",
    shownOn: "riv-07",
    kinds: ["include-piece", "avoid-piece"],
    text: "Some briefs name a piece you must wear or must leave out.",
  },
  {
    id: "eras",
    title: "Eras",
    shownOn: "gal-05",
    kinds: ["era-min", "era-max"],
    text: "Pieces come from the 50s, 70s, 90s or now. Era rules set a limit, and mixing distant eras costs harmony.",
  },
];

export const TUTORIAL_CHALLENGE_ID = "riv-01";

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    index: 1,
    title: "Meet your client.",
    description: "Highlights the client card and the first rule chip.",
    targets: ["client-card", "rule-chip"],
    advance: "tap",
  },
  {
    index: 2,
    title: "Open the Tops tab.",
    description: "Highlights the tray tab; advances when the tab is opened.",
    targets: ["tray-tab"],
    advance: "tab-opened",
  },
  {
    index: 3,
    title: "Drag a piece onto its slot.",
    description: "Requires the first placement (tap-to-place also advances).",
    targets: ["slot"],
    advance: "first-placement",
  },
  {
    index: 4,
    title: "Fill every slot.",
    description: "Rule chips turn green as rules are met; advances when the look is complete.",
    targets: ["rule-chip", "slot"],
    advance: "look-complete",
  },
  {
    index: 5,
    title: "Finish your look.",
    description:
      "Highlights Finish look; the result sheet then explains the three stars: complete, on brief, polished.",
    targets: ["finish-button"],
    advance: "finish",
  },
];
