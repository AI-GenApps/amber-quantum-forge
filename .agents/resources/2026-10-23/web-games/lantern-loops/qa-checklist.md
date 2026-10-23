# Lantern Loops - owner browser QA checklist

No agent opened a browser, a simulator or a device for this game. Everything below is yours. All
automated checks (Vitest, tsc, vite build, Biome) pass; this list covers what only eyes, ears and
thumbs can judge. Tick each box, and write down anything odd with the screen name and the device.

## Setup

- Dev server (needed for section 5 and the `?qa=` helper): `bun run --filter '@web-games/lantern-loops' dev`, then open `http://localhost:4011`.
- Production-like check: `bun run --filter '@web-games/lantern-loops' build`, then `bun run --filter '@web-games/lantern-loops' preview` (also port 4011). The `?qa=` helper does not exist there.
- Sizes to test: 360x740, 390x844, and a desktop window narrowed to 390 px wide. Browsers: Chrome and Safari.
- Later: a real Android phone and an iPhone with the Capacitor projects (`bun run --filter '@web-games/lantern-loops' cap:sync`, then open `android/` or `ios/`).
- `?qa=` helper (dev server only, writes to the real save): `?qa=stars:210,tokens:5,streak:6,onboarded:1,reset:1`. Keys: `stars` (0 to 360, fills campaign puzzles in order with 3 stars), `tokens` (0 to 20), `streak` (days; sets yesterday as the last daily), `onboarded` (1 or 0), `reset` (1 wipes the save first). Reload with the query to apply it. Clear site data between big experiments.

## 1. First run

- [ ] A brand-new profile (`?qa=reset:1`, or clear site data) shows the Welcome card with "Start practice" and "Skip".
- [ ] "Start practice" opens the first 4x4 tutorial board with one sentence and a highlighted target; it can be solved by dragging.
- [ ] The second tutorial board also solves; the walk ends on Home and does not appear again after a reload.
- [ ] "Skip" works on the Welcome card and on both tutorial boards, goes to Home, and never shows the Welcome again.
- [ ] Settings > "Replay tutorial" starts the walk again from board one.

## 2. Board feel

- [ ] Drag-draw: dragging across empty cells lays straight and corner ribbons that follow the finger without lag.
- [ ] Tap-rotate with the Straight brush and with the Corner brush: each tap on a placed tile turns it to the next orientation (straight: 2 positions, corner: 4).
- [ ] Erase brush removes a tile on tap and by dragging; long-press on a tile erases it with any brush.
- [ ] Undo and Redo walk back and forward through every move, including an erase; Restart asks for confirmation, then clears every tile except hinted ones (the hint count of the attempt stays).
- [ ] No accidental page scroll or pull-to-refresh while dragging on the board, in Chrome and Safari.
- [ ] 9x9 cells (use a Sunday daily or Sky 20+) are comfortable to hit at 360 px wide (open question Q7: cell floor 36 px).
- [ ] Keyboard (desktop): arrow keys move the focus ring, Space or Enter applies the brush, S / C / E pick Straight / Corner / Erase, Z undo, Y redo, H hint, Escape pauses.

## 3. Each mechanic

- [ ] Lanterns: a lantern is lit when its path closes into a loop; an unlit lantern is visibly grey.
- [ ] Numbered stones (Garden): the number equals the count of neighbouring cells that hold a tile; a wrong count shows a conflict ring when "Show conflicts" is on.
- [ ] Mirrors (Bridge): a mirror cell forces a corner on one of its two diagonals; a wrong tile there is flagged.
- [ ] Colour gates and the five colours (Sky): each colour has its own glyph (circle, diamond, triangle, square, star) and a gate needs a straight tile on a loop of its colour; colour is never the only cue.
- [ ] Fixed tiles (pinned by the puzzle) cannot be rotated, erased or covered.
- [ ] A hint (after its confirm sheet) places and locks exactly one correct tile and costs one token; the Hint button shows the balance; with 0 tokens it is refused with a clear message.

## 4. Win flow

- [ ] On the last correct move the loops light up and the win sheet opens with the right stars (0 hints = 3, 1 hint = 2, 2 or more = 1).
- [ ] "Next puzzle" opens the following puzzle; after Harbor 30 it continues to Garden 01 if Garden is open.
- [ ] A replay never lowers stars; a new best time shows "New best time".
- [ ] The win sheet shows token rewards (and "Your token jar is full" at the cap).

## 5. Progression (dev server)

- [ ] `?qa=reset:1,stars:44` then solve one Harbor puzzle: the Garden unlock celebration appears at 45 stars exactly, not before.
- [ ] `?qa=stars:119` then solve one puzzle: Bridge unlocks at 120. `?qa=stars:209`: Sky unlocks at 210.
- [ ] Locked chapter cards show the stars still missing and cannot be opened.
- [ ] Finishing all 30 puzzles of a chapter pays +5 tokens once; with `?qa=tokens:19` the jar caps at 20 and the toast says so.

## 6. Daily

- [ ] Today's puzzle size matches the weekday: Mon 5x5, Tue 6x6, Wed 7x7, Thu 7x7 with mirrors, Fri 8x8, Sat 8x8 with gates, Sun 9x9. Change the device date to cover Monday to Sunday and reload each time.
- [ ] Sunday (9x9) generation feels instant on the phone (open question Q3).
- [ ] The Daily screen lists the mechanics used today and the tier ("Tier n of 7").
- [ ] Solve two consecutive days: streak 2. Skip one day and solve the next: "Freeze saved your streak" and the freeze count drops. Skip two days: streak resets to 1.
- [ ] Streak milestones at 3, 7, 14 and 30 days show a celebration and pay +1, +2, +2, +4 tokens (use `?qa=streak:2` and solve to reach 3).
- [ ] The freeze comes back on the first open of a new ISO week (Monday).
- [ ] Archive lists the 30 previous days, yesterday first; "Completed" shows the empty illustration at first and fills as you solve.
- [ ] An archive solve pays +1 token once per date (0 hints only) and never changes the streak.

## 7. Share

- [ ] After a daily, "Share result" opens the native share sheet on a phone, or copies to the clipboard on desktop ("Result copied").
- [ ] Text format: header `Lantern Loops Daily YYYY-MM-DD`, then `n stars  m:ss`, then an emoji grid with lanterns, stones and empty cells.
- [ ] Settings > "Hide path in shared grid" on: no path squares in the grid; off: coloured squares show the loops.

## 8. Statistics

- [ ] After a few solves the totals match what you did: solved / 120, stars / 360, three-star count, dailies, streak, best streak, hints used, play time, best time per board size.
- [ ] The two bar charts (chapters, weekdays) have readable labels and values.

## 9. Settings

- [ ] Sound, Music, Haptics, Reduced motion, High contrast, Show timer, Show conflicts each toggle immediately and survive a reload.
- [ ] High contrast thickens outlines and adds glyphs on tiles; text stays readable.
- [ ] Reduced motion removes transitions and the win animation.
- [ ] "Reset progress" needs two confirmations and then restores 3 tokens, no stars, no streak.

## 10. Look

- [ ] Every piece of text is Fraunces (headings, numerals) or Nunito (body); nothing falls back to Times, Arial or the system font, also on first load before fonts arrive (inspect with the browser dev tools).
- [ ] Contrast is readable in a bright room and in the dark; the muted text is still legible.
- [ ] Each chapter has its own backdrop (Harbor, Garden, Bridge, Sky) and the board stays the calmest zone.
- [ ] Placeholders: 13 of 15 art slots are code-drawn (Q11). Only `lantern-amber` is final art. Judge whether the amber art lantern next to the code-drawn grey unlit lantern looks consistent.
- [ ] Nothing is cut off or overlapping at browser text size 130% and at 360 px width, on every screen including the win sheet and Settings.

## 11. Audio and haptics

- [ ] Each sound plays once at the right moment: tap, tile place, tile rotate, erase, conflict, hint, undo, loop closes, lantern lit, win (3 variants by stars), daily done, chapter unlock, freeze used.
- [ ] The calm music loop fades in and out cleanly and the loop seam is not audible (Q10).
- [ ] With Sound off, nothing plays; with Music off, only the loop stops.
- [ ] Haptics (device only): light taps on placement, a distinct buzz on conflict, success on a win.

## 12. Lifecycle

- [ ] Leave mid-puzzle (switch app or tab) and return: the board is restored exactly.
- [ ] Kill the app or close the tab and reopen: profile, settings and the in-progress run are restored.
- [ ] Airplane mode changes nothing: the game works fully offline.
- [ ] Android back button (device): closes sheets first, then goes back one screen, and on Home asks "Leave Lantern Loops?".
- [ ] The splash and launcher icon look right on the device (Q12).

## 13. Store bank (your step)

- [ ] Capture phone screenshots from the browser build: Home, a Harbor board, a Garden board with stones, a Bridge board, a Sky board with colours, the win sheet, the Daily screen, Statistics. Save them under `.agents/resources/<date>/web-games/lantern-loops/screenshots/`.
- [ ] A feature graphic still has to be produced (no art exists for it, see Q11).
- [ ] Decide Q1 (name), Q6 (Android INTERNET permission) and Q8 (account, contact, privacy policy URL) before any submission.
