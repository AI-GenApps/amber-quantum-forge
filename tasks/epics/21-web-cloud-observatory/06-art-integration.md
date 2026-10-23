---
epic: 21-web-cloud-observatory
task: 06-art-integration
status: todo
commit_scope: cloud-observatory
depends_on: [21-web-cloud-observatory/04-screens-and-ui]
estimate: M
owner: agent
---

# Integrate reviewed art from the designer inbox

## Goal

Replace the code-drawn placeholders with the art that passed the strict review, slot by slot, at
the right sizes and within the budget, with provenance recorded, and keep placeholders for every
slot that was rejected or never generated. The task never generates, edits or judges images
itself: it only integrates what the review loop accepted.

## Context / Decisions

- Inbox (outside the repo, read-only here): `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/cloud-observatory/`.
  Accepted files live in `accepted/<assetId>.png` with `accepted/manifest.json` (entries
  `{assetId, file, model, prompt, size, transparent, notes, round, batch}`). The art bible is
  `art-bible.md` and the reviewer's notes are `<batch>/round-<n>/review/review.md`. Never use an
  image that is not in `accepted/`. Never retouch, upscale or regenerate; only resize and encode.
- Slots, shapes, transparency and display sizes: `.agents/games/cloud-observatory/assets-index.md`
  (33 slots: B1 icon, key-art, observatory-building, emblem-lyre; B2 sky-far, nebula-mid,
  horizon-hills and 11 emblems; B3 8 instruments, lore-1 to lore-6, feature-graphic).
- Encoding rules: bundled art is WebP at 2x the display size (table in assets-index.md), quality 82,
  alpha preserved for transparent slots (alpha quality 90), `sharp` Lanczos resize, no upscaling
  beyond the source. Masters (the accepted PNG at generation size) are stored as WebP quality 90
  under `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/<assetId>.webp`.
  `icon` and `feature-graphic` are masters only (not bundled); task 07 and the store use them.
- Budget: bundled art at most 8 MB total, no single file over 600 KB (kit `assertAssetBudget`).
- Rejected or missing slots keep their code-drawn placeholders; each one is listed in
  `assets-index.md` with the reviewer's reason and in `open-questions.md`.
- No visual QA by the agent: integration is verified by file checks (dimensions, alpha channel
  present, sizes, manifest consistency), never by looking at renders.

## Implementation Checklist

- [ ] Read `accepted/manifest.json`; list accepted vs rejected vs missing against the 33 slots.
      If the inbox has no accepted assets at all, finish the task with the tooling in place, the
      manifest empty, and the status recorded in `assets-index.md` (the task is then "done with
      all placeholders", not blocked).
- [ ] Copy `art-bible.md` and every `review.md` into
      `.agents/resources/2026-10-23/web-games/cloud-observatory/art/` as evidence.
- [ ] `apps-games/cloud-observatory/scripts/build-art.mjs` (uses the existing `sharp` dev
      dependency; run with `bun apps-games/cloud-observatory/scripts/build-art.mjs <inbox-accepted-dir>`):
      reads the slot table (a JSON file `art-slots.json` in the same folder with id, display size,
      transparent flag, bundled flag), writes masters (WebP q90) and bundled files (WebP at 2x),
      refuses to write a file that fails checks (wrong aspect class, missing alpha on a transparent
      slot, source smaller than the target), prints a summary table.
- [ ] Write bundled files to `apps-games/cloud-observatory/public/art/<assetId>.webp` and update
      `src/ui/art-manifest.ts` with exactly the accepted bundled slots (width, height, alt text
      or decorative flag, dominant background colour for the loading state).
- [ ] Preload strategy: critical slots (`key-art`, `sky-far`, `observatory-building`) preloaded
      with the kit `preloadImages` behind the title screen; the rest lazy; the loading state shows
      the placeholder, never a blank box.
- [ ] Alt texts: emblems and instruments get meaningful alt text only where they are the sole
      carrier of information; otherwise decorative (`alt=""`).
- [ ] Update `assets-index.md`: the art provenance table (slot, designer batch and round, review
      verdict and path, master path, app path, date), per-slot status (`accepted` / `placeholder`
      with reason), sizes, and the total bundled bytes.
- [ ] Update `open-questions.md` with every placeholder slot and a recommended follow-up.

Tests:

- [ ] `art/manifest.test.ts`: every manifest entry has a file under `public/art/`, the WebP header
      is valid (`RIFF....WEBP`), dimensions equal 2x display size (read with `sharp`), transparent
      slots have an alpha channel, opaque slots do not need one, slot names are within the 33.
- [ ] `art/budget.test.ts`: kit `assertAssetBudget` with `totalBytes: 8_000_000` and
      `perFileBytes: 600_000` over `public/art/**`, plus the fonts and audio budgets from tasks 04
      and 05 still passing.
- [ ] `art/masters.test.ts`: a master exists for every accepted slot (including `icon` and
      `feature-graphic`), as WebP; no master for a slot that is not in the manifest or accepted
      list; provenance table in `assets-index.md` has a row per accepted slot.
- [ ] `art/placeholders.test.ts`: every slot not in the manifest renders its placeholder, every
      slot in the manifest renders an `<img>` with the right `src`, `width` and `height`.
- [ ] Emblem framing check: the 12 emblem files have identical dimensions (same square size) and
      alpha-bordered corners (corner pixels fully transparent), which proves the shared framing
      mechanically; visual identity remains the reviewer's call.

## Files Touched

- `apps-games/cloud-observatory/public/art/*.webp`
- `apps-games/cloud-observatory/scripts/{build-art.mjs,art-slots.json}`
- `apps-games/cloud-observatory/src/ui/art-manifest.ts` and small wiring edits
- `apps-games/cloud-observatory/test/art/*.test.ts`
- `.agents/resources/2026-10-23/web-games/cloud-observatory/art/{art-bible.md,review/**,masters/*.webp}`
- `.agents/games/cloud-observatory/{assets-index,open-questions,decisions-log}.md`
- `tasks/epics/21-web-cloud-observatory/STATUS.md` (tick task 06)

## Acceptance Criteria

- Only files from the inbox `accepted/` folder are used; each has a provenance row.
- Every bundled file is WebP at 2x its display size, within the 8 MB total and 600 KB per file
  budgets; masters are WebP q90 in the evidence folder.
- Each of the 33 slots is either integrated or listed as a placeholder with a reason; no slot is
  half-integrated (manifest, file and provenance agree; tests prove it).
- The app builds and runs with any subset of art, including none.
- No image was generated, retouched or visually inspected by the agent for judgement.

## Verification Commands

- `bun run --filter '@web-games/cloud-observatory*' typecheck`
- `bun run --filter '@web-games/cloud-observatory*' test`
- `bun run --filter '@web-games/cloud-observatory' build`
- `bunx biome check apps-games/cloud-observatory apps-games/cloud-observatory-core`

## Out of Scope

- Generating, editing, upscaling or judging art; requesting new rounds from the designer.
- Icons and splash generation for native projects (task 07).
- Store screenshots and promo graphics.
- Changing the kit or dependencies.

## Commit message

`feat(cloud-observatory): integrate reviewed art and record provenance [21-web-cloud-observatory/06]`
