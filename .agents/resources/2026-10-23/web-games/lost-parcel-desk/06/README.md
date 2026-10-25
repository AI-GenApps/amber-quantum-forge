# Task 06 - art integration evidence

Date: 2026-10-23. Input (read-only): `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/lost-parcel-desk/`, folder `accepted/`
(63 PNG files plus `manifest.json`) and the review notes of the designer loop. Only slots with an accepted verdict
(recorded in `verdicts.json`, each verdict quoted from a review note copied to `../art/review/`) were converted. Nothing
from a rejected delivery was read into the repo, and nothing in the inbox was changed or deleted. The art bible is copied to
`../art/art-bible.md`, the 27 review notes to `../art/review/<batch>-round-<n>.md` and the designer manifest to
`../art/designer-manifest.json`.

Nobody looked at the images (no visual QA). The designer loop's reviews are the quality gate; this task only runs automated
checks (dimensions, alpha, coverage, safe area, bytes). Designer batches: b1 (icon, key-art, desk-backdrop, postcard), b2 to
b5 (48 evidence objects), b6 (12 busts), b7 (parcels, feature graphic) and retry (desk-backdrop, final round for the four
rejected slots). Each accepted file is byte-identical to the file in the batch folder it was accepted from
(`designerOutMatchesAccepted` in `verdicts.json`).

## Result

- 67 slots: 63 accepted, 4 rejected, 0 missing.
- 61 runtime WebP files in `apps-games/lost-parcel-desk/public/art/`: 1,848,678 bytes in total (budget 8,000,000), the largest
  is `evidence-02-2` at 44,542 bytes (cap 250,000 for sprites and portraits, 400,000 for 800 x 1200 images). Every file passed at
  quality 82; the quality ladder (82, 78, 74, 70, 66) was never needed.
- 63 masters (WebP q90, original resolution) in `art/masters/`: 5,196,216 bytes.
- `icon` and `feature-graphic` are accepted store assets: master only, no runtime file.
- Rejected, placeholder kept (final round, retry round 3): `key-art`, `evidence-04-3`, `evidence-08-1`, `townsfolk-9`.

## Per-slot decisions (67 rows)

"No-text statement" says where the review note states that the slot has no text: `slot` (in the slot's own verdict),
`batch` (in the batch-level technical or style lines of the same note) or `none` (no statement found). Text-in-image cannot be
detected from pixels, so the designer review owns it; the two `none` rows are open questions Q17 and Q18.

| Slot | Decision | Designer batch, round | Verdict quoted | No-text statement | Runtime | Master |
|---|---|---|---|---|---|---|
| `icon` | master only (store asset) | b1 round 2 | `## icon: ACCEPTED` | slot | - | `art/masters/icon.webp` 1024x1024, 85,682 B |
| `key-art` | rejected, placeholder kept | retry round 3 | `## key-art - REJECTED` | - | - | - |
| `desk-backdrop` | integrated | retry round 2 | `## desk-backdrop: ACCEPTED` | slot | `/art/desk-backdrop.webp` 800x1200, 9,168 B, q82 | `art/masters/desk-backdrop.webp` 1024x1536, 74,326 B |
| `evidence-postcard` | integrated | b1 round 1 | `## evidence-postcard: ACCEPTED` | slot | `/art/evidence-postcard.webp` 560x560, 34,612 B, q82 | `art/masters/evidence-postcard.webp` 1024x1024, 71,018 B |
| `evidence-01-2` | integrated | b2 round 2 | `\| evidence-01-2 scarf \| ACCEPT \|` | batch | `/art/evidence-01-2.webp` 560x560, 31,180 B, q82 | `art/masters/evidence-01-2.webp` 1024x1024, 68,808 B |
| `evidence-01-3` | integrated | b2 round 2 | `\| evidence-01-3 glove \| ACCEPT \|` | slot | `/art/evidence-01-3.webp` 560x560, 31,178 B, q82 | `art/masters/evidence-01-3.webp` 1024x1024, 68,886 B |
| `evidence-01-4` | integrated | b2 round 2 | `\| evidence-01-4 compass \| ACCEPT \|` | slot | `/art/evidence-01-4.webp` 560x560, 37,632 B, q82 | `art/masters/evidence-01-4.webp` 1024x1024, 86,802 B |
| `evidence-02-1` | integrated | b2 round 2 | `\| evidence-02-1 biscuit tin \| ACCEPT \|` | slot | `/art/evidence-02-1.webp` 560x560, 36,836 B, q82 | `art/masters/evidence-02-1.webp` 1024x1024, 91,578 B |
| `evidence-02-2` | integrated | b2 round 2 | `\| evidence-02-2 hymn sheet \| ACCEPT \|` | batch | `/art/evidence-02-2.webp` 560x560, 44,542 B, q82 | `art/masters/evidence-02-2.webp` 1024x1024, 115,334 B |
| `evidence-02-3` | integrated | b2 round 2 | `\| evidence-02-3 lozenge tin \| ACCEPT \|` | slot | `/art/evidence-02-3.webp` 560x560, 32,934 B, q82 | `art/masters/evidence-02-3.webp` 1024x1024, 70,814 B |
| `evidence-02-4` | integrated | b2 round 2 | `\| evidence-02-4 bookmark \| ACCEPT \|` | batch | `/art/evidence-02-4.webp` 560x560, 21,798 B, q82 | `art/masters/evidence-02-4.webp` 1024x1024, 42,674 B |
| `evidence-03-1` | integrated | b2 round 2 | `\| evidence-03-1 hat box \| ACCEPT \|` | batch | `/art/evidence-03-1.webp` 560x560, 41,004 B, q82 | `art/masters/evidence-03-1.webp` 1024x1024, 96,950 B |
| `evidence-03-2` | integrated | b2 round 2 | `\| evidence-03-2 barometer \| ACCEPT \|` | slot | `/art/evidence-03-2.webp` 560x560, 34,814 B, q82 | `art/masters/evidence-03-2.webp` 1024x1024, 79,932 B |
| `evidence-03-3` | integrated | b2 round 2 | `\| evidence-03-3 tea towel \| ACCEPT \|` | batch | `/art/evidence-03-3.webp` 560x560, 23,326 B, q82 | `art/masters/evidence-03-3.webp` 1024x1024, 59,902 B |
| `evidence-03-4` | integrated | b2 round 2 | `\| evidence-03-4 drawstring bag \| ACCEPT \|` | batch | `/art/evidence-03-4.webp` 560x560, 30,682 B, q82 | `art/masters/evidence-03-4.webp` 1024x1024, 55,522 B |
| `evidence-04-1` | integrated | b2 round 2 | `\| evidence-04-1 button tin \| ACCEPT \|` | batch | `/art/evidence-04-1.webp` 560x560, 36,202 B, q82 | `art/masters/evidence-04-1.webp` 1024x1024, 85,722 B |
| `evidence-04-2` | integrated | b3 round 1 | `\| evidence-04-2 \| ACCEPT \|` | batch | `/art/evidence-04-2.webp` 560x560, 22,948 B, q82 | `art/masters/evidence-04-2.webp` 1024x1024, 37,966 B |
| `evidence-04-3` | rejected, placeholder kept | retry round 3 | `## evidence-04-3 - REJECTED` | - | - | - |
| `evidence-04-4` | integrated | b3 round 1 | `\| evidence-04-4 \| ACCEPT \|` | slot | `/art/evidence-04-4.webp` 560x560, 34,430 B, q82 | `art/masters/evidence-04-4.webp` 1024x1024, 80,992 B |
| `evidence-05-1` | integrated | b3 round 1 | `\| evidence-05-1 \| ACCEPT \|` | batch | `/art/evidence-05-1.webp` 560x560, 37,000 B, q82 | `art/masters/evidence-05-1.webp` 1024x1024, 81,478 B |
| `evidence-05-2` | integrated | b3 round 1 | `\| evidence-05-2 \| ACCEPT \|` | slot | `/art/evidence-05-2.webp` 560x560, 32,032 B, q82 | `art/masters/evidence-05-2.webp` 1024x1024, 75,372 B |
| `evidence-05-3` | integrated | b3 round 1 | `\| evidence-05-3 \| ACCEPT \|` | slot | `/art/evidence-05-3.webp` 560x560, 38,594 B, q82 | `art/masters/evidence-05-3.webp` 1024x1024, 114,124 B |
| `evidence-05-4` | integrated | b3 round 4 | `## evidence-05-4 (Crumpled coach ticket) - ACCEPTED` | slot | `/art/evidence-05-4.webp` 560x560, 27,700 B, q82 | `art/masters/evidence-05-4.webp` 1024x1024, 47,698 B |
| `evidence-06-1` | integrated | b3 round 1 | `\| evidence-06-1 \| ACCEPT \|` | slot | `/art/evidence-06-1.webp` 560x560, 33,860 B, q82 | `art/masters/evidence-06-1.webp` 1024x1024, 80,170 B |
| `evidence-06-2` | integrated | b3 round 1 | `\| evidence-06-2 \| ACCEPT \|` | batch | `/art/evidence-06-2.webp` 560x560, 23,326 B, q82 | `art/masters/evidence-06-2.webp` 1024x1024, 42,674 B |
| `evidence-06-3` | integrated | b3 round 1 | `\| evidence-06-3 \| ACCEPT \|` | slot | `/art/evidence-06-3.webp` 560x560, 20,722 B, q82 | `art/masters/evidence-06-3.webp` 1024x1024, 42,314 B |
| `evidence-06-4` | integrated | b3 round 1 | `\| evidence-06-4 \| ACCEPT \|` | slot | `/art/evidence-06-4.webp` 560x560, 22,710 B, q82 | `art/masters/evidence-06-4.webp` 1024x1024, 52,842 B |
| `evidence-07-1` | integrated | b3 round 1 | `\| evidence-07-1 \| ACCEPT \|` | batch | `/art/evidence-07-1.webp` 560x560, 18,444 B, q82 | `art/masters/evidence-07-1.webp` 1024x1024, 34,562 B |
| `evidence-07-2` | integrated | b4 round 1 | `- evidence-07-2 Rehearsal notice:` | batch | `/art/evidence-07-2.webp` 560x560, 34,400 B, q82 | `art/masters/evidence-07-2.webp` 1024x1024, 82,142 B |
| `evidence-07-3` | integrated | b4 round 1 | `- evidence-07-3 Birdseed twist:` | batch | `/art/evidence-07-3.webp` 560x560, 36,678 B, q82 | `art/masters/evidence-07-3.webp` 1024x1024, 71,564 B |
| `evidence-07-4` | integrated | b4 round 1 | `- evidence-07-4 Chewed pencil stub:` | batch | `/art/evidence-07-4.webp` 560x560, 31,064 B, q82 | `art/masters/evidence-07-4.webp` 1024x1024, 65,546 B |
| `evidence-08-1` | rejected, placeholder kept | retry round 3 | `## evidence-08-1 - REJECTED` | - | - | - |
| `evidence-08-2` | integrated | b4 round 1 | `- evidence-08-2 Chemist's receipt:` | slot | `/art/evidence-08-2.webp` 560x560, 24,198 B, q82 | `art/masters/evidence-08-2.webp` 1024x1024, 58,274 B |
| `evidence-08-3` | integrated | b4 round 2 | `## evidence-08-3 - ACCEPTED` | none | `/art/evidence-08-3.webp` 560x560, 43,242 B, q82 | `art/masters/evidence-08-3.webp` 1024x1024, 110,966 B |
| `evidence-08-4` | integrated | b4 round 1 | `- evidence-08-4 Spotted handkerchief:` | batch | `/art/evidence-08-4.webp` 560x560, 36,442 B, q82 | `art/masters/evidence-08-4.webp` 1024x1024, 101,180 B |
| `evidence-09-1` | integrated | b4 round 1 | `- evidence-09-1 Matchbox of foam domes:` | slot | `/art/evidence-09-1.webp` 560x560, 30,456 B, q82 | `art/masters/evidence-09-1.webp` 1024x1024, 76,388 B |
| `evidence-09-2` | integrated | b4 round 1 | `- evidence-09-2 Clinic reorder card:` | batch | `/art/evidence-09-2.webp` 560x560, 30,658 B, q82 | `art/masters/evidence-09-2.webp` 1024x1024, 68,334 B |
| `evidence-09-3` | integrated | b4 round 1 | `- evidence-09-3 Brass door key:` | slot | `/art/evidence-09-3.webp` 560x560, 32,100 B, q82 | `art/masters/evidence-09-3.webp` 1024x1024, 69,012 B |
| `evidence-09-4` | integrated | b4 round 1 | `none: accepted in the orchestrator list` | none | `/art/evidence-09-4.webp` 560x560, 33,324 B, q82 | `art/masters/evidence-09-4.webp` 1024x1024, 85,928 B |
| `evidence-10-1` | integrated | b4 round 1 | `- evidence-10-1 Boxwood knight:` | batch | `/art/evidence-10-1.webp` 560x560, 34,066 B, q82 | `art/masters/evidence-10-1.webp` 1024x1024, 76,194 B |
| `evidence-10-2` | integrated | b5 round 1 | `- evidence-10-2 scorecard:` | slot | `/art/evidence-10-2.webp` 560x560, 29,526 B, q82 | `art/masters/evidence-10-2.webp` 1024x1024, 72,130 B |
| `evidence-10-3` | integrated | b5 round 1 | `- evidence-10-3 certificate:` | batch | `/art/evidence-10-3.webp` 560x560, 25,066 B, q82 | `art/masters/evidence-10-3.webp` 1024x1024, 62,476 B |
| `evidence-10-4` | integrated | b5 round 2 | `## evidence-10-4 - ACCEPTED` | slot | `/art/evidence-10-4.webp` 560x560, 26,518 B, q82 | `art/masters/evidence-10-4.webp` 1024x1024, 57,708 B |
| `evidence-11-1` | integrated | b5 round 1 | `- evidence-11-1 brass 8:` | batch | `/art/evidence-11-1.webp` 560x560, 39,496 B, q82 | `art/masters/evidence-11-1.webp` 1024x1024, 109,754 B |
| `evidence-11-2` | integrated | b5 round 1 | `- evidence-11-2 round sheet:` | slot | `/art/evidence-11-2.webp` 560x560, 28,066 B, q82 | `art/masters/evidence-11-2.webp` 1024x1024, 65,228 B |
| `evidence-11-3` | integrated | b5 round 1 | `- evidence-11-3 refund slip:` | batch | `/art/evidence-11-3.webp` 560x560, 29,084 B, q82 | `art/masters/evidence-11-3.webp` 1024x1024, 79,218 B |
| `evidence-11-4` | integrated | b5 round 1 | `- evidence-11-4 teacup:` | batch | `/art/evidence-11-4.webp` 560x560, 41,506 B, q82 | `art/masters/evidence-11-4.webp` 1024x1024, 108,396 B |
| `evidence-12-1` | integrated | b5 round 1 | `- evidence-12-1 trousers:` | batch | `/art/evidence-12-1.webp` 560x560, 27,690 B, q82 | `art/masters/evidence-12-1.webp` 1024x1024, 66,730 B |
| `evidence-12-2` | integrated | b5 round 1 | `- evidence-12-2 tailor's ticket:` | batch | `/art/evidence-12-2.webp` 560x560, 32,004 B, q82 | `art/masters/evidence-12-2.webp` 1024x1024, 84,078 B |
| `evidence-12-3` | integrated | b5 round 1 | `- evidence-12-3 timetable:` | batch | `/art/evidence-12-3.webp` 560x560, 24,032 B, q82 | `art/masters/evidence-12-3.webp` 1024x1024, 58,888 B |
| `evidence-12-4` | integrated | b5 round 1 | `- evidence-12-4 note:` | slot | `/art/evidence-12-4.webp` 560x560, 18,846 B, q82 | `art/masters/evidence-12-4.webp` 1024x1024, 40,926 B |
| `evidence-12-5` | integrated | b5 round 1 | `- evidence-12-5 brass key:` | slot | `/art/evidence-12-5.webp` 560x560, 32,116 B, q82 | `art/masters/evidence-12-5.webp` 1024x1024, 75,124 B |
| `townsfolk-1` | integrated | b6 round 1 | `- townsfolk-1 ACCEPT:` | batch | `/art/townsfolk-1.webp` 360x480, 27,674 B, q82 | `art/masters/townsfolk-1.webp` 960x1280, 110,140 B |
| `townsfolk-2` | integrated | b6 round 1 | `- townsfolk-2 ACCEPT:` | batch | `/art/townsfolk-2.webp` 360x480, 26,896 B, q82 | `art/masters/townsfolk-2.webp` 960x1280, 107,344 B |
| `townsfolk-3` | integrated | b6 round 1 | `- townsfolk-3 ACCEPT:` | slot | `/art/townsfolk-3.webp` 360x480, 27,066 B, q82 | `art/masters/townsfolk-3.webp` 960x1280, 113,362 B |
| `townsfolk-4` | integrated | b6 round 1 | `- townsfolk-4 ACCEPT:` | batch | `/art/townsfolk-4.webp` 360x480, 19,616 B, q82 | `art/masters/townsfolk-4.webp` 960x1280, 74,918 B |
| `townsfolk-5` | integrated | b6 round 1 | `- townsfolk-5 ACCEPT:` | batch | `/art/townsfolk-5.webp` 360x480, 28,320 B, q82 | `art/masters/townsfolk-5.webp` 960x1280, 125,422 B |
| `townsfolk-6` | integrated | b6 round 1 | `- townsfolk-6 ACCEPT:` | batch | `/art/townsfolk-6.webp` 360x480, 24,990 B, q82 | `art/masters/townsfolk-6.webp` 960x1280, 103,026 B |
| `townsfolk-7` | integrated | b6 round 1 | `- townsfolk-7 ACCEPT:` | batch | `/art/townsfolk-7.webp` 360x480, 24,246 B, q82 | `art/masters/townsfolk-7.webp` 960x1280, 92,950 B |
| `townsfolk-8` | integrated | b6 round 1 | `- townsfolk-8 ACCEPT:` | batch | `/art/townsfolk-8.webp` 360x480, 29,886 B, q82 | `art/masters/townsfolk-8.webp` 960x1280, 120,958 B |
| `townsfolk-9` | rejected, placeholder kept | retry round 3 | `## townsfolk-9 - REJECTED` | - | - | - |
| `townsfolk-10` | integrated | b6 round 1 | `- townsfolk-10 ACCEPT:` | slot | `/art/townsfolk-10.webp` 360x480, 24,806 B, q82 | `art/masters/townsfolk-10.webp` 960x1280, 95,112 B |
| `townsfolk-11` | integrated | b6 round 1 | `- townsfolk-11 ACCEPT:` | batch | `/art/townsfolk-11.webp` 360x480, 26,298 B, q82 | `art/masters/townsfolk-11.webp` 960x1280, 117,772 B |
| `townsfolk-12` | integrated | b6 round 1 | `- townsfolk-12 ACCEPT:` | batch | `/art/townsfolk-12.webp` 360x480, 25,712 B, q82 | `art/masters/townsfolk-12.webp` 960x1280, 111,138 B |
| `parcel-closed` | integrated | b7 round 1 | `## parcel-closed: ACCEPTED` | slot | `/art/parcel-closed.webp` 560x560, 43,542 B, q82 | `art/masters/parcel-closed.webp` 1024x1024, 117,748 B |
| `parcel-open` | integrated | b7 round 1 | `## parcel-open: ACCEPTED` | slot | `/art/parcel-open.webp` 560x560, 41,374 B, q82 | `art/masters/parcel-open.webp` 1024x1024, 100,888 B |
| `feature-graphic` | master only (store asset) | b7 round 4 | `## feature-graphic: ACCEPTED` | slot | - | `art/masters/feature-graphic.webp` 1536x1024, 215,112 B |

## Items to know

- `evidence-09-4` (Housing list extract): in `accepted/`, in `accepted/manifest.json` and in the orchestrator's accepted list, but
  the b4 round 1 note has no line for it (open question Q17). It is integrated on the orchestrator's list; `verdicts.json` marks the
  source as `orchestrator-accepted-list`.
- `evidence-08-3`: accepted in b4 round 2, but that note never says "no text" (Q18).
- Coverage floor: 10 slim objects (scarf, bookmark, signal lamp, waxed paper twist, tuning fork, pencil stub, matchbox, door key,
  horse head, desk key) have 13 to 25 percent opaque coverage, under the 25 percent rule. Each has a named override in
  `scripts/art-lib.ts` (`COVERAGE_MIN_OVERRIDES`, minimum 10 percent) and `test/art-assets.test.ts` proves each is needed.
- Safe area: `townsfolk-7` and `townsfolk-12` (the two tall cast members) are 90.1 percent tall, as the art bible asks for a head
  high in the frame; their limit is 91 percent (`SAFE_AREA_OVERRIDES`).
- Rejected slots (reasons quoted from `art/review/retry-round-3.md`): `key-art` (flat vector look, floating dots, broken cast shadows),
  `evidence-04-3` (cells read as rings, not hearing-aid batteries), `evidence-08-1` (reads as a stick in a bowl, not a cane tip),
  `townsfolk-9` (no hearing aid drawn, which cases 04 and 06 need as a rule-out clue). Their code-drawn placeholders stay.

## Tool and commands

```
cd apps-games/lost-parcel-desk
bun run build:art            # = bun run scripts/build-art.ts [--inbox <path>]
```

On this machine Bun 1.4.3 hangs inside sharp (open question Q20), so the script was run as a Node bundle:

```
bun build scripts/build-art.ts --target=node --format=esm --external sharp --outfile scripts/.build-art.mjs
node scripts/.build-art.mjs
rm scripts/.build-art.mjs
```

`scripts/build-art.ts` (sharp 0.35.3): reads `accepted/manifest.json`, requires an accepted verdict per slot whose quoted line
exists in the copied review note (under its `## ACCEPTED` heading where the note uses one) and whose batch and round equal the
designer manifest, then per slot

1. master: original pixels as WebP quality 90 (alpha quality 100, effort 6), alpha dropped for opaque slots;
2. runtime (bundle slots only): lanczos3 resize to 560 x 560 (evidence, parcels), 360 x 480 (busts) or 800 x 1200 (scenes), WebP
   quality 82 (ladder 82, 78, 74, 70, 66 until under the size cap), alpha quality 100;
3. checks from `scripts/art-lib.ts` on master and runtime, all collected before anything is written; any violation prints the slot
   id and exits 1 with no file written;
4. writes masters, runtime files, `06/provenance.json`, the generated block in `src/art/manifest.ts` and the provenance table in
   `.agents/games/lost-parcel-desk/assets-index.md`; stale files for slots that are no longer accepted are removed from
   `public/art/` and `art/masters/`.

Checks: format webp, no animation, no EXIF, exact aspect (1:1, 3:4, 2:3 or 3:2), exact runtime size, masters not smaller than the
runtime size; sprites and busts: alpha channel, four corners alpha 0, outer 3 percent border alpha 0, opaque (alpha >= 128)
coverage 25 to 90 percent (overrides above), bounding box (alpha >= 16) at most 90 percent of the frame in each dimension
(overrides above); opaque slots: every pixel alpha 255; at most 250,000 bytes per sprite or bust, 400,000 per 800 x 1200
file, 8,000,000 total. `test/art-assets.test.ts` re-runs them on the committed files.

## Integration in the game

- `src/art/manifest.ts`: generated `ART_ENTRIES` (slot, url, pixel size); `ART_MANIFEST` derives from it, so rejected and store
  slots are not in it and keep their fallbacks. `artUrls()` feeds the boot preload (61 files).
- `Sprite` (unchanged logic) shows the WebP for listed slots and the code-drawn drawing for the rest: evidence objects on the
  table, in the viewer, the board tray and the Almanac, `parcel-closed` on the case intro, `parcel-open` on the table, the
  busts on profile cards, the Almanac and the reveal.
- `src/art/Backdrop.tsx`: `desk-backdrop` behind the table, viewer and board; `key-art` behind the title and boot (rejected,
  so the screen colour shows today). It is absolutely positioned behind the screens, so the layout never moves; a scrim of the
  desk colour at 85 percent keeps text readable (`test/backdrop.test.tsx` checks text and muted text on all five desk themes
  over the lightest and darkest backdrop pixel) and high contrast covers the art completely.
- Credits: two grouped art rows (author MobileGamesDesigner thread, licence "Owned by the project").

## Verification (run in the worktree, no browser)

- `bun run --filter '@web-games/lost-parcel-desk*' typecheck`: both packages exit 0.
- `bun run --filter '@web-games/lost-parcel-desk*' test`: core 25 files, 496 tests; app 29 files, 375 tests; all pass.
- `bun run --filter '@web-games/lost-parcel-desk' build`: built, 61 files in `dist/art`, main JS 218.67 kB (74.75 kB gzip).
- `bunx biome check apps-games/lost-parcel-desk apps-games/lost-parcel-desk-core`: 196 files, no findings.
- Idempotence: a second `build-art` run left every WebP, `provenance.json`, `manifest.ts` and the assets index byte-identical.
