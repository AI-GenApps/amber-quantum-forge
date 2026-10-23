export interface HowToPage {
  id: string;
  title: string;
  body: readonly string[];
}

/** Six pages. Task 05 enriches the text and adds the guided tutorial. */
export const HOWTO_PAGES: readonly HowToPage[] = [
  {
    id: "goal",
    title: "The goal",
    body: [
      "Water the town before the water finds it.",
      "Supply every house and every field. Keep every house dry. Spend no more than par.",
    ],
  },
  {
    id: "pieces",
    title: "Your pieces",
    body: [
      "Canal (1): a groove that carries water fast.",
      "Sandbags (1): raise the ground by three.",
      "Pump (3): pushes water uphill to the cell it faces.",
      "Sluice gate (2): open only between two weeks you choose.",
      "Reservoir (4): a walled tank that holds ten units.",
    ],
  },
  {
    id: "placing",
    title: "Placing and editing",
    body: [
      "Pick a tool, then tap or drag across the board. Tap a placed piece to inspect it.",
      "The eraser removes a piece and refunds it. Undo and redo are unlimited while planning.",
      "With a keyboard: arrows move the cursor, Enter places, Backspace removes, R rotates, Space runs.",
    ],
  },
  {
    id: "forecast",
    title: "The forecast",
    body: [
      "The bar above the board shows every surge, drought and tide before you run. Nothing is hidden.",
      "Surges raise the river, droughts cut it, tides lift the sea.",
    ],
  },
  {
    id: "season",
    title: "Running the season",
    body: [
      "Run season plays 20 to 30 weeks. Use the speed buttons or scrub the bar.",
      "Badges show which houses are supplied, which fields are irrigated and which houses flooded.",
    ],
  },
  {
    id: "stars",
    title: "Stars, coins and hints",
    body: [
      "One star for supplying everything, two for dry feet, three for staying within par.",
      "Coins buy hints and daily streak freezes. A hint shows the next piece of the reference plan.",
      "The Daily Dispatch is a new map every day.",
    ],
  },
];
