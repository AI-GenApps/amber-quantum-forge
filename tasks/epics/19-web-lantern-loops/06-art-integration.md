---
epic: 19-web-lantern-loops
task: 06-art-integration
status: in-progress
commit_scope: lantern-loops
depends_on: [19-web-lantern-loops/04-screens-and-ui, 19-web-lantern-loops/05-audio-haptics-onboarding]
estimate: M
owner: agent
---

# Integrate reviewed art from the designer inbox

## Goal

Put the art that the MobileGamesDesigner thread delivered and the strict review accepted into the
game: converted to WebP at 2x display size, masters kept as WebP q90 under the evidence folder,
provenance recorded, an art budget test (<= 8 MB), and the code-drawn placeholder kept for every
slot that was rejected or not delivered. The game must be complete and consistent either way.

## Context / Decisions

- Only images in the accepted folder count: `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/lantern-loops/accepted/`
  (with its `manifest.json`). Art bible: `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/lantern-loops/art-bible.md`;
  review notes: `<batch>/round-<n>/review/review.md` in the same inbox. The inbox is read-only; copy what
  is needed into the evidence folder. Never use, edit or restyle an image that is not in `accepted/`, and
  never generate images in this task. The orchestrator supplies the list of accepted and rejected slots in
  the task prompt; trust it over file presence.
- The 15 slots, shapes, display sizes and fallbacks are in `assets-index.md`. Shipped size is 2x display
  size: lanterns 112x112, daily-medallion 240x240, empty-archive 320x320, key-art and the four backdrops
  800x1200. `icon` (1024x1024 master) and `feature-graphic` (1500x1000 master) are not bundled in the
  web build: they feed Capacitor assets (task 07) and the store bank.
- Format: WebP via `sharp` (already a devDependency); shipped quality 82 (alpha preserved for transparent
  slots); masters WebP q90 at the original generation size under
  `.agents/resources/2026-10-23/web-games/lantern-loops/art/masters/<slot>.webp`. Shipped files live in
  `apps-games/lantern-loops/src/art/files/<slot>.webp` where the task 04 `import.meta.glob` finds them
  with no code change.
- Budgets: all shipped art <= 8 MB total; per file <= 400 KB for backdrops and key-art, <= 40 KB for
  lanterns, <= 120 KB for the medallion and empty-archive (test).
- Style consistency is judged by the review already done; this task does not re-review taste, but it must
  verify objective properties: dimensions, alpha, file name equals slot id, transparent slots
  actually have transparent corners, backdrops have their calm centre (the central 60% of the image has
  low edge density: compute with a simple sobel mean and record it, informational), and file hash
  provenance.
- A placeholder is kept for each rejected or undelivered slot; list each in `assets-index.md` (status
  `placeholder`) and `open-questions.md`.

## Implementation Checklist

- [x] Read the accepted manifest; copy art bible, review notes and manifest into
      `.agents/resources/2026-10-23/web-games/lantern-loops/art/` (evidence).
- [x] `scripts/convert-art.ts` (app `scripts/` dir; add it to the tsconfig include): reads accepted PNGs,
      writes masters (q90) and shipped WebP (2x display size, q82), prints a table (slot, source size,
      shipped bytes, SHA-256 of the source PNG and master). Deterministic and idempotent.
- [x] Run it for the accepted slots; commit masters and shipped files.
- [x] `src/art/slots.ts`: no change needed if filenames match slot ids; otherwise adjust the mapping, and
      mark each slot `shipped` or `placeholder` through the glob result.
- [x] Use the shipped art where the layout expects it (Home key-art, chapter backdrops, lantern icons in
      lists and legends, medallion, empty-archive) and keep the fallback for any slot without a file.
- [x] `assets-index.md`: fill the provenance table (slot, inbox file, review round and verdict, SHA-256,
      date, notes) and set each slot's status to `shipped` or `placeholder`.
- [x] Art budget test and objective property tests (below).
- [x] Update `README.md` quick facts (art slots shipped N of 15) and `decisions-log.md`.

Result (2026-10-23): the designer loop ended `style_anchor_failed`; 2 of 15 slots integrated
(`lantern-amber` bundled, `icon` master for task 07), 13 placeholders kept (Q11). The slots.ts change
was `icon` -> `inApp: false`; `ArtImage` got an optional `files` prop so tests inject the glob result.

## Files Touched

- `apps-games/lantern-loops/src/art/files/*.webp`, `src/art/slots.ts` (only if needed),
  `scripts/convert-art.ts`, `tsconfig.json` (include `scripts`)
- `apps-games/lantern-loops/test/art/*.test.ts`
- `.agents/resources/2026-10-23/web-games/lantern-loops/art/**` (masters, bible, review notes, report)
- `.agents/games/lantern-loops/{assets-index,README,decisions-log,open-questions}.md`

## Acceptance Criteria

- [x] Every shipped file has dimensions equal to 2x its display size, is WebP, and has a provenance row
      whose SHA-256 matches the recorded master; no file exists without a row.
- [x] Transparent slots (all lanterns, medallion, empty-archive) have alpha and transparent corner pixels;
      opaque slots (key-art, backdrops) have none.
- [x] Total shipped art bytes <= 8,000,000 and per-file limits hold (test using the kit `assertAssetBudget`).
- [x] With zero art files present the whole app still renders (placeholder test from task 04 still
      passes), and with any subset present each slot resolves to its file URL or its fallback; a test
      deletes nothing, it injects the glob result.
- [x] Rejected or undelivered slots are listed in `assets-index.md` with status `placeholder` and in
      `open-questions.md`; the counts in `README.md` match.
- [x] No unreviewed file: a test compares the shipped slot list to the committed accepted manifest copy.
- [x] All verification commands below pass.

## Verification Commands

```
bun run --filter '@web-games/lantern-loops*' typecheck
bun run --filter '@web-games/lantern-loops*' test
bun run --filter '@web-games/lantern-loops' build
bunx biome check apps-games/lantern-loops apps-games/lantern-loops-core
```

## Out of Scope

Generating, editing, upscaling or restyling any image; contacting the designer thread; judging taste
(the review loop did that); icon and splash generation (task 07); screenshots of the app.

## Commit message

`feat(lantern-loops): integrate reviewed art with placeholders kept [19-web-lantern-loops/06]`
