import type { Achievement } from "./types";

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: "first-delivery",
    title: "First Delivery",
    condition: "Close case 01",
    rule: { kind: "close-case", caseId: "01" },
  },
  {
    id: "clean-sheet",
    title: "Clean Sheet",
    condition: "Close any case with 3 stamps",
    rule: { kind: "close-with-stamps", stamps: 3, noHint: false },
  },
  {
    id: "unaided",
    title: "Unaided",
    condition: "Close any case with 3 stamps and no hint",
    rule: { kind: "close-with-stamps", stamps: 3, noHint: true },
  },
  {
    id: "sharp-eyes",
    title: "Sharp Eyes",
    condition: "Find every clue in a case before accusing (every clue face inspected)",
    rule: { kind: "all-faces-inspected" },
  },
  {
    id: "chapter-1",
    title: "Spring Cleaning",
    condition: "Close all four cases of chapter 1",
    rule: { kind: "close-chapter", chapter: 1 },
  },
  {
    id: "chapter-2",
    title: "Dry at Last",
    condition: "Close all four cases of chapter 2",
    rule: { kind: "close-chapter", chapter: 2 },
  },
  {
    id: "chapter-3",
    title: "The Last Sack",
    condition: "Close all four cases of chapter 3",
    rule: { kind: "close-chapter", chapter: 3 },
  },
  {
    id: "stamp-collector",
    title: "Stamp Collector",
    condition: "Hold 12 stamps in total",
    rule: { kind: "total-stamps", stamps: 12 },
  },
  {
    id: "postmasters-pride",
    title: "Postmaster's Pride",
    condition: "Hold all 36 stamps",
    rule: { kind: "total-stamps", stamps: 36 },
  },
  {
    id: "daily-habit",
    title: "Daily Habit",
    condition: "Reach a Daily Parcel streak of 3",
    rule: { kind: "daily-streak", days: 3 },
  },
  {
    id: "week-at-the-desk",
    title: "A Week at the Desk",
    condition: "Reach a Daily Parcel streak of 7",
    rule: { kind: "daily-streak", days: 7 },
  },
  {
    id: "second-look",
    title: "Second Look",
    condition: "Replay a closed case and raise its best stamps",
    rule: { kind: "replay-improve" },
  },
];
