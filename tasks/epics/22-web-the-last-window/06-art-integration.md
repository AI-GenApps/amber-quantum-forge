---
epic: 22-web-the-last-window
task: 06-art-integration
status: in-progress
commit_scope: the-last-window
depends_on: [22-web-the-last-window/04-screens-and-ui]
estimate: L
owner: agent
---

# Integrate reviewed art from the designer inbox

## Goal

Integrate the art that the MobileGamesDesigner thread delivered and the orchestrator accepted: convert to runtime WebP at 2x display size, keep masters as WebP q90, flip the art manifest, record provenance, and keep the code-drawn placeholder for every slot that is rejected or missing. Verification is automated (dimensions, alpha, bytes, framing consistency), never visual.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/the-last-window/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Inbox (read-only input):** `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/`, under the game's folder. Only files with an explicit accepted verdict from the orchestrator's review are integrated (a verdict file or message recorded in the evidence README). Anything unreviewed, rejected or ambiguous keeps its placeholder. The strict art review happens in the designer loop, not here, and agents never look at images to judge them.
- **Slots and sizes:** the 54 slots in `assets-index.md` (B1 `icon`, `key-art`, `interior-evening`, `customer-1-neutral`; B2 `interior-morning`, `interior-rain`, `customer-2-neutral` to `customer-8-neutral`; B3 `customer-1..8-happy` and `-sad`; B4 `drink-1..6`, `pastry-1..5`, `book-1..5`, `decor-1..8`, `feature-graphic`). Runtime: key art and interiors 800 x 1200, customer busts 480 x 640, drinks, pastries and books 192 x 192, decor 256 x 256, WebP quality about 82, alpha preserved for busts and objects. Masters: delivered resolution as WebP q90 under `.agents/resources/2026-10-23/web-games/the-last-window/art/masters/`. `icon` and `feature-graphic` are store assets: master only, not in `public/art/`.
- **Automated checks standing in for visual QA:** width and height match the slot table and the aspect ratio is exact (1:1, 2:3, 3:4, 3:2); busts and objects have an alpha channel with fully transparent corner pixels; busts cover 35 to 85 percent of the frame with opaque pixels and objects 25 to 90 percent with the bounding box inside an 85 percent safe area; `icon`, `key-art`, interiors and `feature-graphic` are fully opaque; no animation frames; no EXIF; per-file size at most 400 KB for 800 x 1200 images, 120 KB for busts and 60 KB for objects; total runtime art at most 8 MB (expected about 2.5 MB). **Identity proxy:** for each customer the opaque bounding boxes of neutral, happy and sad agree within 4 percent of the frame width and height (same framing and scale), and all 24 busts share a bust bottom edge within 4 percent. These are proxies; the real identity review is the designer loop.
- **Tooling:** `sharp` (already a devDependency) through `scripts/build-art.ts` in the app, run with `bun run`. The script is deterministic and idempotent.
- **Provenance:** the table in `assets-index.md` gets one row per slot: status (accepted, rejected, missing), batch and round, review verdict reference, runtime file, bytes, master path and SHA-256, regenerated between marker comments by the script.
- If the inbox holds nothing accepted yet, the task still completes: the tooling, tests and manifest logic are delivered with all slots marked `missing`, the evidence says so, and the orchestrator reruns this task's script when art arrives.

## Implementation Checklist

- [x] Read the inbox listing and the recorded verdicts; write `.agents/resources/2026-10-23/web-games/the-last-window/06/README.md` with the per-slot decision table (accepted, rejected, missing).
- [x] `scripts/build-art.ts`: reads accepted inbox files, runs the automated checks above (fails loudly with the slot id on any violation), writes masters (WebP q90) and runtime WebP, regenerates `src/art/manifest.ts` and the provenance table.
- [x] Update `src/art/manifest.ts` so accepted slots point at `public/art/<slot>.webp` with their pixel size; rejected and missing slots stay out of the manifest and keep fallbacks.
- [x] Wire the accepted slots into the screens that already reference them (title key art, three interiors by weather on Shift and Shop, busts on Seats and Scene by expression, item icons on stations, tray and recipe book, decor objects on the interior and the shop). A regular whose `happy` or `sad` slot is missing falls back to the neutral image, and a missing neutral falls back to the code-drawn bust; no layout change when a slot is missing.
- [x] Update the provenance table in `assets-index.md` and the Credits screen data (art: MobileGamesDesigner thread, licence: owned by the project).
- [x] `test/art.test.tsx` (rendering with empty, partial and full manifests, expression fallback chain, Backdrop) and `test/art-assets.test.ts` (files, checks, masters, provenance, budget): reads `public/art/*.webp` with sharp and re-runs the checks for every manifest entry; asserts every manifest entry has a file and every file has a manifest entry; masters exist for every accepted slot; `assertAssetBudget` from the kit with `totalBytes: 8_000_000`; provenance rows exist for all 54 slots.
- [x] Delete nothing from the inbox; do not copy rejected files anywhere.

## Files Touched

- `apps-games/the-last-window/public/art/*.webp` (accepted slots only)
- `apps-games/the-last-window/scripts/build-art.ts`, `src/art/manifest.ts`, small `Portrait`, `ItemIcon` and `Backdrop` changes
- `apps-games/the-last-window/test/{art.test.tsx,art-assets.test.ts}`
- `.agents/resources/2026-10-23/web-games/the-last-window/art/masters/**`, `.../06/README.md`
- `.agents/games/the-last-window/assets-index.md`
- `tasks/epics/22-web-the-last-window/STATUS.md` (tick task 06)

## Acceptance Criteria

- Every accepted slot has a runtime WebP at the exact size, a q90 WebP master and a provenance row; every other slot keeps its code-drawn placeholder and says so in the provenance table.
- The art budget test passes: total runtime art at most 8 MB, per-file limits met.
- The game renders completely with zero, some or all slots present (tests cover empty, partial and full manifests and the expression fallback chain).
- No file from a rejected or unreviewed delivery is committed.

## Verification Commands

- `bun run --filter '@web-games/the-last-window*' typecheck`
- `bun run --filter '@web-games/the-last-window*' test`
- `bun run --filter '@web-games/the-last-window' build`
- `bunx biome check apps-games/the-last-window apps-games/the-last-window-core`

## Out of Scope

- Judging art quality visually or regenerating art (the designer loop owns that).
- Icon and splash generation for native projects (task 07).
- New art slots beyond the 54 listed.

## Commit message

`feat(the-last-window): integrate reviewed art and keep placeholders for the rest [22-web-the-last-window/06]`
