export interface HowToPage {
  title: string;
  lines: readonly string[];
}

/** Six pages. Task 05 replaces the wording with the final text and adds the tutorial replay. */
export const HOWTO_PAGES: readonly HowToPage[] = [
  {
    title: "Your shop",
    lines: [
      "You keep The Last Window, a cafe-bookshop on Quay Lane. Each day is one short shift.",
      "Customers sit at three seats. Tap a seat to see what that person wants.",
    ],
  },
  {
    title: "Making drinks",
    lines: [
      "Tap the step buttons in order. A wrong tap empties the cup, so start again.",
      "Some steps need a moment. The next button glows when the recipe guide is on.",
    ],
  },
  {
    title: "Pastries and the oven",
    lines: [
      "Pick a pastry, then follow its steps. The oven works while you do something else.",
      "You have two plates. A plate flashes when it is ready for its next step.",
    ],
  },
  {
    title: "Books and moods",
    lines: [
      "Open the book shelf and give a book that matches the mood the customer asked for.",
      "Every book has two mood tags. A match earns a better tip.",
    ],
  },
  {
    title: "Friends and stories",
    lines: [
      "Happy regulars become friends. Friends share short stories in the evening.",
      "Some stories ask you to choose. Your choices shape how each story ends.",
    ],
  },
  {
    title: "Stock and decor",
    lines: [
      "Plan the shelves each evening. Pastries cost coins, books are free.",
      "Spend coins in the decor shop. Every item helps the shop in one small way.",
    ],
  },
];
