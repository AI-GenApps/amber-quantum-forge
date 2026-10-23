---
epic: 23-web-dress-rehearsal
task: 06-art-integration
status: todo
commit_scope: dress-rehearsal
depends_on: [23-web-dress-rehearsal/04-screens-and-ui]
estimate: L
owner: agent
---

# Integrate reviewed art from the designer inbox

## Goal

Integrate the art that the MobileGamesDesigner thread delivered and the orchestrator accepted (63 slots in six batches): convert to runtime WebP at 2x display size, keep masters as WebP q90, flip the art manifest, record provenance, and keep the code-drawn placeholder for every slot that is rejected or missing. Verification is automated (dimensions, alpha, bounding boxes, bytes), never visual.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/dress-rehearsal/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Inbox (read-only input):** `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/`, under the game's folder. Only files with an explicit accepted verdict from the orchestrator's review are integrated (a verdict file or message recorded in the evidence README). Anything unreviewed, rejected or ambiguous keeps its placeholder. The strict art review happens in the designer loop, not here, and agents never look at images to judge them.
- **Slots and sizes:** the 63 slots in `assets-index.md` (B1 `icon`, `key-art`, `item-riviera-1`, `backdrop-studio`; B2 to B5 the other 47 pieces `item-<theme>-<n>` with 12, 12, 12 and 11 per batch; B6 `client-1..6`, `backdrop-riviera`, `backdrop-rainy-city`, `backdrop-gala`, `backdrop-mountain`, `backdrop-vintage`, `feature-graphic`). Runtime: pieces 256 x 256 WebP with alpha, clients 360 x 480 WebP with alpha, key-art and backdrops 800 x 1200 WebP, quality about 82. Masters: original resolution as WebP q90 under `.agents/resources/2026-10-23/web-games/dress-rehearsal/art/masters/`. `icon` and `feature-graphic` are store assets: master only, not in `public/art/`.
- **Automated checks standing in for visual QA:** width and height match the slot table; aspect ratio exact; pieces and clients have an alpha channel, corner pixels fully transparent, and an opaque bounding box inside the 85 percent safe area whose width and height fraction sit within 12 percentage points of the category scale rules in `assets-index.md` (clients: opaque coverage between 25 and 90 percent); icon, key-art and backdrops are fully opaque; no animation frames; no EXIF; file size per slot at most 60 KB for pieces, 100 KB for clients and 400 KB for 800 x 1200 images; total runtime art at most 8 MB (expected under 2 MB).
- **Tooling:** `sharp` (already a devDependency) through `scripts/build-art.ts` in the app, run with `bun run`. The script is deterministic and idempotent and regenerates `src/art/manifest.ts` entries.
- **Provenance:** the table in `assets-index.md` gets one row per slot: status (accepted, rejected, missing), designer batch and round, review verdict reference, runtime file, master path, bytes, SHA-256 of the master.
- **Use in the game:** pieces in the tray, board and Closet screen (`Sprite`), client portraits on the Brief sheet, Clients screen and Result sheet, backdrops behind the board per chapter (Studio Avant-garde backdrop also used for the Gallery), key-art on the title if accepted. Missing slots keep the code-drawn fallback with no layout change.
- If the inbox holds nothing accepted yet, the task still completes: the tooling, tests and manifest logic are delivered with all slots marked `missing`, the evidence says so, and the orchestrator reruns this task's script when art arrives.

## Implementation Checklist

- [ ] Read the inbox listing and the recorded verdicts; write `.agents/resources/2026-10-23/web-games/dress-rehearsal/06/README.md` with the per-slot decision table.
- [ ] `scripts/build-art.ts`: reads accepted inbox files, runs the automated checks above (fails loudly with the slot id on any violation), writes masters (WebP q90) and runtime WebP, and regenerates `src/art/manifest.ts` entries.
- [ ] Update `src/art/manifest.ts` so accepted slots point at `public/art/<slot>.webp` with their pixel size; rejected and missing slots stay out of the manifest and keep fallbacks.
- [ ] Use the backdrops, client portraits, pieces and key-art in the screens that already reference them behind the `Sprite` and `Backdrop` components with fallbacks; no layout change when a slot is missing.
- [ ] Update the provenance table in `assets-index.md` and the Credits screen data (art: MobileGamesDesigner thread, licence: owned by the project).
- [ ] `test/art.test.tsx` (rendering with empty, partial and full manifests, `Backdrop`, `Sprite`, export renderer using images) and `test/art-assets.test.ts` (files, checks, masters, provenance, budget): reads `public/art/*.webp` with sharp and re-runs the checks for every manifest entry; asserts every manifest entry has a file and every file has a manifest entry; masters exist for every accepted slot; `assertAssetBudget` from the kit with `totalBytes: 8_000_000`; rendering with an empty manifest and with a full manifest both work; provenance rows exist for all 63 slots.
- [ ] Delete nothing from the inbox; do not copy rejected files anywhere.

## Files Touched

- `apps-games/dress-rehearsal/public/art/*.webp` (accepted slots only)
- `apps-games/dress-rehearsal/scripts/build-art.ts`, `src/art/manifest.ts`, small `Sprite` and `Backdrop` changes
- `apps-games/dress-rehearsal/test/{art,art-assets}.test.ts(x)`
- `.agents/resources/2026-10-23/web-games/dress-rehearsal/art/masters/**`, `.../06/README.md`
- `.agents/games/dress-rehearsal/assets-index.md`
- `tasks/epics/23-web-dress-rehearsal/STATUS.md` (tick task 06)

## Acceptance Criteria

- Every accepted slot has a runtime WebP at the exact size, a q90 WebP master and a provenance row; every other slot keeps its code-drawn placeholder and says so in the provenance table.
- The art budget test passes: total runtime art at most 8 MB, per-file limits met.
- The game renders completely with zero, some or all slots present (tests cover empty and full manifests).
- No file from a rejected or unreviewed delivery is committed.

## Verification Commands

- `bun run --filter '@web-games/dress-rehearsal*' typecheck`
- `bun run --filter '@web-games/dress-rehearsal*' test`
- `bun run --filter '@web-games/dress-rehearsal' build`
- `bunx biome check apps-games/dress-rehearsal apps-games/dress-rehearsal-core`

## Out of Scope

- Judging art quality visually or regenerating art (the designer loop owns that).
- Icon and splash generation for native projects (task 07).
- New art slots beyond the 63 listed.

## Commit message

`feat(dress-rehearsal): integrate reviewed art and keep placeholders for the rest [23-web-dress-rehearsal/06]`
