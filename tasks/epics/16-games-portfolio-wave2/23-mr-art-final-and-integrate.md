---
epic: 16-games-portfolio-wave2
task: 23-mr-art-final-and-integrate
status: pending
commit_scope: merge-relay
depends_on: [16-games-portfolio-wave2/22-mr-logo-final-and-integrate]
estimate: L
owner: agent
---

# Merge Relay: final art set, integrated through the manifest slots

## Goal

Render the approved art direction for every slot (≥12 tile tiers, the home
scene, the board frame, and 6 chapter cards) and integrate it. The goldens
then show a finished, illustrated game.

## Context / Decisions

- Pick: `decisions.md` → `mr_art_direction` and `mr_art_notes`. Dry-run
  references are in `.agents/resources/2026-09-25/merge-relay-art/set-1/`.
- Process: skill reference `08-art-audio-pipeline.md`. Use the `image-gen` command (STATUS.md)
  at final quality, with the approved samples as style
  references. Verify transparency, and VIEW every output (regenerate once
  if it's off-brief). Keep tiles consistent in lighting, outline weight,
  and face scale.
- Integration: `assets/art/<slot>.png`, optimized (tiles ≤ 256 px at 3x,
  the scene ≤ 1080 px wide), with the manifest bindings from task 07.
  Code-drawn fallbacks remain for tiers above the rendered set. Numerals
  stay code-drawn on top of the art (the art keeps a numeral-safe zone).
- APK budget: the arm64 release APK stays ≤ 40 MB (task 13 method).
- Provenance: append to `assets/art/LICENSES.md`, and keep the masters and
  prompts in `.agents/resources/2026-09-25/merge-relay-art/set-1/final/`.

## Implementation Checklist

- [ ] Run a smoke test, then render the finals, view them, and regenerate
      once if needed.
- [ ] Optimize and integrate the art, and update `LICENSES.md`.
- [ ] Update the tier-sheet and screen goldens. Add a manifest test per slot
      family.
- [ ] Re-measure the APK size in `.agents/resources/2026-09-25/games-wave2-qa/23/budgets.md`.
- [ ] Build an after contact sheet against the Threes! anchors and the audit's
      "before" renders, and VIEW it.

## Files Touched

- `apps-native/games/merge_relay/{assets/art/**,lib/src/assets/**,test/**}`
- `.agents/resources/2026-09-25/merge-relay-art/set-1/final/**`

## Acceptance Criteria

- Every listed slot has a bundled bitmap, and the goldens show them; the
  verifier views the tier sheet, Home, Play, and Chapter map.
- Numerals remain legible on every tier (the numeral-ratio test from task
  08 still passes).
- The arm64 release APK is ≤ 40 MB, and `LICENSES.md` covers every file.

## Verification Commands

- `bun run games:format:check`
- `bun run games:analyze -- --app merge_relay`
- `bun run games:test -- --app merge_relay`
- `cd apps-native/games/merge_relay && flutter build apk --release --split-per-abi`
- `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug`

## Out of Scope

- New slots, and store screenshots (task 24).

## Commit message

`feat(merge-relay): integrate final tile, scene, board, and chapter art [16-games-portfolio-wave2/23]`
