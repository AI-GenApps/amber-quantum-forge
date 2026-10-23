---
epic: 19-web-lantern-loops
task: 08-release-readiness
status: pending
commit_scope: lantern-loops
depends_on: [19-web-lantern-loops/07-capacitor-packaging]
estimate: M
owner: agent
---

# Release readiness, budgets, knowledge base, owner QA checklist

## Goal

Close the epic: prove the whole game works end to end headlessly (a full 120-puzzle campaign
playthrough through the real services), enforce the budgets, audit that the game collects and sends
nothing, make the knowledge base complete and consistent with the code, and hand the owner a precise
browser QA checklist. No agent opens a browser; the checklist is for the owner.

## Context / Decisions

- Budgets (single source `.agents/games/lantern-loops/README.md`): JS bundle <= 300 KB gzip (art, fonts
  and audio excluded), art <= 8 MB, audio <= 1.5 MB, each woff2 <= 120 KB. The bundle test calls Vite's
  `build()` API with `write: false` and a silent logger, gzips every emitted JS chunk with `node:zlib`,
  and sums them; it runs inside Vitest (timeout 120 s) so the verification order (test before build) still
  enforces it.
- No-data claim (store bank): the source and `public` contain no network API use. The audit scans
  `src` and `public` for `fetch(`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`,
  `navigator.geolocation`, `importScripts`, and any `http://` or `https://` URL except the allowlist (XML
  namespaces such as `http://www.w3.org/2000/svg`, licence URLs in the About/licence text); results go to
  `no-data-audit.txt`. Also confirm `package.json` dependencies are unchanged from the skeleton.
- Dev-only QA helper: `?qa=stars:210,tokens:5` style query handling that exists only when
  `import.meta.env.DEV` is true (so the owner can reach later chapters and test token states quickly); a
  test builds production with `write: false` and asserts the helper's marker string is absent from the
  output.
- The owner's checklist lives at
  `.agents/resources/2026-10-23/web-games/lantern-loops/qa-checklist.md` (not in the app folder).
- Store listing copy is final here: the test reads the fenced `text` blocks of `store-listing.md` and
  enforces limits (name 30, subtitle 30, short 80, long 4000, keywords 100).

## Implementation Checklist

- [ ] Campaign playthrough test (`test/release/playthrough.test.ts`): from a fresh profile with an
      in-memory adapter, solve all 120 puzzles in order using stored solutions through the real services
      with zero hints; assert chapter unlocks happen exactly at 45, 120 and 210 stars, final stars 360, four
      chapter-clear rewards (+5 each, capped at 20 tokens), progress survives a save/load round trip, and the
      statistics screen numbers match.
- [ ] Daily and archive playthrough: simulate 40 consecutive days with a fake clock (including a freeze
      save, a reset, and milestones 3, 7, 14, 30), assert tokens, streak, freeze counts and the share text.
- [ ] Bundle budget test and a printed size table (JS gzip, art, audio, fonts) written to
      `.agents/resources/2026-10-23/web-games/lantern-loops/08/budgets.json`.
- [ ] No-data audit script `scripts/no-data-audit.ts` (run by a test; output committed as
      `08/no-data-audit.txt`).
- [ ] Dev-only QA helper (`src/qa/devParams.ts`) and the production-absence test.
- [ ] Knowledge-base consistency tests (`test/release/knowledgeBase.test.ts`): `README.md` quick facts
      match code constants (puzzle count 120, unlocks 45/120/210, max stars 360, tokens start 3 / cap 20,
      freeze 1 per week, art slot count 15, budgets); all eight KB files exist and have no `TODO`; the
      content plan titles match the data (task 02 test still passes); `assets-index.md` has no slot left as
      `planned` (each is `shipped` or `placeholder`), every font and audio file has provenance;
      `decisions-log.md` has a 2026-10-23 row for every area in the epic decision table.
- [ ] Store listing test (`test/release/storeListing.test.ts`).
- [ ] Final accessibility sweep tests (contrast, hit areas, labels, reduced motion) re-run across all
      screens; fix any gap found.
- [ ] Write `qa-checklist.md` (below), `08/README.md` (what was verified, commands, numbers), and update
      `README.md` status line, `open-questions.md` (carry unresolved items), and the epic `STATUS.md`
      task table (mark 01 to 08 `[x]` only if their own acceptance criteria are met).
- [ ] Run the full verification commands and the pre-existing-failure check (same commands in a
      throwaway `origin/main` worktree under `.../aqf-wt/scratch/`, removed afterwards) for any red result.

### Owner browser QA checklist (content of `qa-checklist.md`)

Setup: `bun run --filter '@web-games/lantern-loops' dev` (port 4011) or `... build` then `... preview`;
test at 360x740, 390x844 and a desktop window narrowed to 390 px; try Chrome and Safari; later try a
real Android/iOS device with the Capacitor projects.

1. First run: onboarding appears, both tutorial boards can be solved by drag, Skip works, never repeats.
2. Board feel: drag-draw, tap-rotate with both brushes, erase brush, long-press erase, undo/redo,
   no accidental page scroll during a drag; 9x9 cells are comfortable to hit.
3. Each mechanic: stones count correctly; mirrors force the right corners; gates and the five colours with
   their glyphs; fixed tiles cannot be changed; hint places and locks one tile and costs one token.
4. Win flow: loops light up, win sheet shows the right stars (0/1/2+ hints), next puzzle works.
5. Progression: use the dev `?qa=` helper to reach 45/120/210 stars and see the unlock celebration; locked
   chapter cards show the stars missing; tokens cap at 20 with the toast.
6. Daily: today's puzzle matches the weekday tier; change the device date to cover Monday to Sunday (5x5
   to 9x9) and check Sunday generation time feels instant (Q3); streak, medallion, freeze save and reset
   behave per `economy.md`; archive lists 30 days and Completed shows the empty illustration at first.
7. Share: text format and the hide-path setting, native sheet or clipboard fallback.
8. Statistics numbers look right after a few solves.
9. Settings: sound, music, haptics, reduced motion, high contrast, show timer, show conflicts, reset
   progress (two-step).
10. Look: fonts are Fraunces and Nunito everywhere (no default font anywhere), contrast readable,
    backdrops per chapter, placeholders vs final art, nothing cut off at 130% text size.
11. Audio: every sound plays once at the right moment, music loop (if shipped) fades, nothing plays when
    muted; haptics (device only).
12. Lifecycle: leave mid-puzzle and return (restored board), kill and reopen (profile and run restored),
    airplane mode changes nothing, Android back button behaviour (device).
13. Capture screenshots for the store bank (owner step).

## Files Touched

- `apps-games/lantern-loops/test/release/*.test.ts`, `scripts/no-data-audit.ts`, `src/qa/devParams.ts`,
  `src/main.tsx` (dev helper hook only), any small fixes found by the sweep
- `.agents/games/lantern-loops/**` (final pass)
- `.agents/resources/2026-10-23/web-games/lantern-loops/{qa-checklist.md,08/**}`
- `tasks/epics/19-web-lantern-loops/STATUS.md`

## Acceptance Criteria

- [ ] The playthrough test passes: 120 puzzles solved, 360 stars, unlocks at exactly 45, 120 and 210.
- [ ] The 40-day daily simulation passes with the expected tokens, streak, freeze and milestone events.
- [ ] JS bundle <= 300 KB gzip (printed), art <= 8 MB, audio <= 1.5 MB, fonts <= 120 KB each, all enforced by tests.
- [ ] `no-data-audit.txt` is committed, shows zero network API uses and zero non-allowlisted URLs, and
      `package.json` dependencies equal the skeleton set.
- [ ] The dev QA helper works in dev and is absent from the production bundle.
- [ ] Knowledge base complete and consistent (tests above); store listing limits hold.
- [ ] `qa-checklist.md` exists with the 13 sections above, specific to this game.
- [ ] Epic `STATUS.md` rows 01 to 08 are `[x]`; any red verification result is proven pre-existing.
- [ ] All verification commands below pass.

## Verification Commands

```
bun run --filter '@web-games/lantern-loops*' typecheck
bun run --filter '@web-games/lantern-loops*' test
bun run --filter '@web-games/lantern-loops' build
bunx biome check apps-games/lantern-loops apps-games/lantern-loops-core
```

## Out of Scope

Browser, device or screenshot QA by an agent; store submission; privacy-policy hosting; naming
research; any monetization; changes outside the epic scope fence.

## Commit message

`chore(lantern-loops): release readiness, budgets and owner QA checklist [19-web-lantern-loops/08]`
