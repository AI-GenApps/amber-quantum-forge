---
epic: 24-web-lost-parcel-desk
task: 06-art-integration
status: in-progress
commit_scope: lost-parcel-desk
depends_on: [24-web-lost-parcel-desk/05-audio-haptics-onboarding]
estimate: M
owner: agent
---

# Integrate reviewed art from the designer inbox

## Goal

Integrate the art that passed the strict review in the designer loop: runtime WebP files for the accepted slots, masters, provenance in `assets-index.md`, the manifest that switches `Sprite` from fallback to image, and an art budget test of at most 8 MB. Rejected, missing or unreviewed slots keep their code-drawn placeholder.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/lost-parcel-desk/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Spec of record:** `assets-index.md` "Art slots (67)" and "Art style", `content-plan.md` (object names per slot) and `product.md` (no legible text on objects; code overlays all text).
- **Inbox (read-only input):** `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/`, under the game's folder. Only files with an explicit accepted verdict from the orchestrator's review are integrated (a verdict file or message recorded in the evidence README). Anything unreviewed, rejected or ambiguous keeps its placeholder. The strict art review happens in the designer loop, not here, and agents never look at images to judge them.
- **Slots and sizes:** the 67 slots in `assets-index.md`: B1 `icon`, `key-art`, `desk-backdrop`, `evidence-postcard`; B2 to B5 the 48 `evidence-NN-k` objects (12 per batch); B6 `townsfolk-1` to `townsfolk-12`, `parcel-closed`, `parcel-open`, `feature-graphic`. Runtime sizes: evidence objects and parcels 560 x 560 WebP (alpha), townsfolk 360 x 480 WebP (alpha), `key-art` and `desk-backdrop` 800 x 1200 WebP, quality about 82. Masters: original resolution as WebP q90 under `.agents/resources/2026-10-23/web-games/lost-parcel-desk/art/masters/`. `icon` and `feature-graphic` are store assets: master only, not in `public/art/`.
- **Automated checks standing in for visual QA:** width and height match the slot table; aspect ratio exact; sprites and portraits have an alpha channel, corner pixels fully transparent, opaque coverage between 25 and 90 percent of the frame and a bounding box inside the 90 percent safe area; icon, key-art and backdrop are fully opaque; no animation frames; no EXIF; file size per slot at most 250 KB for sprites and portraits and 400 KB for 800 x 1200 images; total runtime art at most 8 MB (expected under 3 MB). Text-in-image cannot be detected by pixels; the designer review owns it and the verdict note must state "no text" for every accepted slot.
- **Tooling:** `sharp` (already a devDependency) through `scripts/build-art.ts` in the app, run with `bun run`. The script is deterministic and idempotent.
- **Provenance:** the table in `assets-index.md` gets one row per slot: status (accepted, rejected, missing), designer batch and round, review verdict reference, runtime file, master path, bytes, SHA-256 of the master.
- If the inbox holds nothing accepted yet, the task still completes: the tooling, tests and manifest logic are delivered with all slots marked `missing`, the evidence says so, and the orchestrator reruns this task's script when art arrives.

## Implementation Checklist

- [x] Read the inbox listing and the recorded verdicts; write `.agents/resources/2026-10-23/web-games/lost-parcel-desk/06/README.md` with the per-slot decision table (67 rows).
- [x] `scripts/build-art.ts`: reads accepted inbox files, runs the automated checks above (fails loudly with the slot id on any violation), writes masters (WebP q90) and runtime WebP, and regenerates `src/art/manifest.ts` entries.
- [x] Update `src/art/manifest.ts` so accepted slots point at `public/art/<slot>.webp` with their pixel size; rejected and missing slots stay out of the manifest and keep fallbacks.
- [x] Use `desk-backdrop` behind the evidence table, viewer and board, `key-art` on the title, `townsfolk-N` on the profile cards, the Townsfolk Book and the Almanac, `parcel-closed` on the case intro and `parcel-open` on the table, and the evidence slots in the table and viewer, all behind `Sprite` and `Backdrop` with fallbacks; no layout change when a slot is missing.
- [x] Update the provenance table in `assets-index.md` and the Credits screen data (art: MobileGamesDesigner thread, licence: owned by the project).
- [x] `test/art.test.tsx` (rendering with empty, partial and full manifests, `Backdrop`, `Sprite`) and `test/art-assets.test.ts` (files, checks, masters, provenance, budget): reads `public/art/*.webp` with sharp and re-runs the checks for every manifest entry; asserts every manifest entry has a file and every file has a manifest entry; masters exist for every accepted slot; `assertAssetBudget` from the kit with `totalBytes: 8_000_000`; rendering with an empty manifest and with a full manifest both work; provenance rows exist for all 67 slots.
- [x] Delete nothing from the inbox; do not copy rejected files anywhere.

## Files Touched

- `apps-games/lost-parcel-desk/public/art/*.webp` (accepted slots only)
- `apps-games/lost-parcel-desk/scripts/build-art.ts`, `src/art/manifest.ts`, small `Sprite` and `Backdrop` changes
- `apps-games/lost-parcel-desk/test/{art,art-assets}.test.ts(x)`
- `.agents/resources/2026-10-23/web-games/lost-parcel-desk/art/masters/**`, `.../06/README.md`
- `.agents/games/lost-parcel-desk/assets-index.md`
- `tasks/epics/24-web-lost-parcel-desk/STATUS.md` (tick task 06)

## Acceptance Criteria

- Every accepted slot has a runtime WebP at the exact size (icon and feature graphic as masters only), a q90 WebP master and a provenance row; every other slot keeps its code-drawn placeholder and says so in the provenance table.
- The art budget test passes: total runtime art at most 8 MB, per-file limits met.
- The game renders completely with zero, some or all slots present (tests cover empty and full manifests).
- No file from a rejected or unreviewed delivery is committed.

## Verification Commands

- `bun run --filter '@web-games/lost-parcel-desk*' typecheck`
- `bun run --filter '@web-games/lost-parcel-desk*' test`
- `bun run --filter '@web-games/lost-parcel-desk' build`
- `bunx biome check apps-games/lost-parcel-desk apps-games/lost-parcel-desk-core`

## Out of Scope

- Judging art quality visually or regenerating art (the designer loop owns that).
- Icon and splash generation for native projects (task 07).
- New art slots beyond the 67 listed.

## Commit message

`feat(lost-parcel-desk): integrate reviewed art and keep placeholders for the rest [24-web-lost-parcel-desk/06]`
