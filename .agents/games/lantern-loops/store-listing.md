# Lantern Loops — store listing answer bank (draft)

Draft answers for Google Play Console and App Store Connect, finalised in task 08 and checked
against the shipped code. No store submission happens in v1 (owner decision 2026-10-23); this bank
exists so a later submission is a copy-paste job. Length limits are enforced by
`apps-games/lantern-loops/test/release/storeListing.test.ts` (task 08), which reads the fenced
`text` blocks below; each block is headed by its field name. Edit the copy here, never only in a console.

v1 is offline-only: no accounts, no ads, no in-app purchases, no analytics, no network calls.

## Identity

| Field | Answer |
|---|---|
| App name (30 max) | **Lantern Loops** (13) working title; trademark and name research still to do |
| Package / bundle id | `app.w3dev.lanternloops` |
| Developer name / account | TBD (human, at submission) |
| Default language | English (United States) |
| App or game | Game |
| Free or paid | Free (no ads, no IAP) |
| Contact email / website | TBD (human, at submission) |
| Privacy policy URL | TBD (human). Content: "this app collects no data"; host a one-page policy before submission |

## Category

**Play: Games > Puzzle.** App Store: primary Games, subgenre Puzzle, no secondary category. Justification: a grid logic puzzle with a daily format, the same shelf as other daily
logic and loop puzzles.

## Short description (Play, 80 max)

```text
short-description
Light every lantern and close every loop in a calm daily logic puzzle.
```

## Subtitle (App Store, 30 max)

```text
subtitle
A calm daily loop puzzle
```

## Long description (Play and App Store, 4000 max)

```text
long-description
Lantern Loops is a calm logic puzzle about light. Place and turn paper-ribbon paths on a grid so every lantern is lit, every path closes into a loop, and every clue on the board holds. Every puzzle has exactly one solution, so you can always reason your way to the answer.

Four chapters, 120 campaign puzzles. Harbor teaches the loops, Garden adds numbered stones that count their lit neighbours, Bridge adds mirrors that bend the light, and Sky adds colour gates and five lantern colours. Boards grow from 5x5 to 9x9 as you go.

A new daily puzzle arrives every day, generated on your device from the date, so everyone plays the same board with no account and no connection. Mondays are gentle, Sundays are the hardest. Keep a streak, protected by one free freeze each week, and replay the last 30 days from the archive. Share your result as a tiny emoji grid that hides the solution.

Stuck? Spend a hint token, earned by playing, never bought. Finish with no hints for three stars. Chapters open as you collect stars.

Designed to feel like a quiet lantern festival at dusk: layered paper shapes, warm amber glow, soft sounds, haptic taps, and no timers, lives or pressure. Works fully offline. No ads. No in-app purchases. No data collected.

Features
- 120 solver-checked campaign puzzles in four chapters
- A fresh daily puzzle with a 30-day archive
- Undo, redo, restart and optional hints
- Stats, streaks and shareable results
- Colour-blind friendly glyphs, high contrast mode, reduced motion
- Plays offline, no account needed
```

## What's new (first release)

```text
whats-new
First light: 120 puzzles, a daily lantern puzzle and a 30-day archive.
```

## Keywords (App Store, 100 max)

```text
keywords
puzzle,logic,loop,lantern,daily,brain,path,calm,offline,relax
```

## Content rating (expected, confirm in the consoles)

| Questionnaire topic | Answer |
|---|---|
| Violence, blood, fear | None |
| Sexual content or nudity | None |
| Profanity or crude humour | None |
| Alcohol, tobacco, drugs | None |
| Gambling, simulated gambling, loot boxes | None |
| User-generated content, chat, social | None (sharing is a text the player sends through the OS share sheet) |
| Location sharing, purchases | None |
| Expected ratings | IARC: all ages; ESRB Everyone; PEGI 3; USK 0; App Store 4+ |

## Data safety (Play) and Privacy nutrition label (App Store)

| Question | Answer |
|---|---|
| Does the app collect or share user data? | No. No data collected, none shared |
| Data types | None collected. Progress, settings and the streak stay in on-device storage (Capacitor Preferences / WebView storage) |
| Third-party SDKs | None that collect data (Capacitor core and plugins run locally; no analytics, ads or crash reporting) |
| Network use | None. The app makes no network requests |
| Account creation or deletion | No accounts. Uninstalling or "Reset progress" in Settings deletes all data |
| Data encrypted in transit | Not applicable (no transfer) |
| Children / families | Not targeted at children; no data from anyone |
| App Store privacy label | Data Not Collected |
| Export compliance | Uses no non-exempt encryption (`ITSAppUsesNonExemptEncryption` = false) |
| Permissions | None requested at runtime. Capacitor's Android template declares `INTERNET`; whether to strip it is tracked in `open-questions.md` |
| Share | The share action hands text to the OS share sheet; the player chooses the destination |

Evidence for every "no data" claim is produced in task 08 (`no-data-audit.txt` under
`.agents/resources/2026-10-23/web-games/lantern-loops/`).

## Graphics needed (from `assets-index.md`)

Icon (square, opaque), feature graphic (landscape 3:2, no text; stores want 1024x500, crop in
task 07/08 notes), phone screenshots (owner captures from the browser build at the end; agents take
none), key art for the title screen. Screenshots are an owner step after QA.
