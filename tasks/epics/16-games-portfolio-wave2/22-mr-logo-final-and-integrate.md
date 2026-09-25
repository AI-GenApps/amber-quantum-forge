---
epic: 16-games-portfolio-wave2
task: 22-mr-logo-final-and-integrate
status: pending
commit_scope: merge-relay
depends_on: [16-games-portfolio-wave2/21-human-logo-and-art-pick]
estimate: M
owner: agent
---

# Merge Relay: final logo and icon, integrated into the app

## Goal

Render the chosen icon and wordmark at final quality, make stacked and wide
variants with transparent versions, and integrate them as the launcher
icons, splash, and home header.

## Context / Decisions

- Picks: `tasks/epics/16-games-portfolio-wave2/decisions.md`
  (`mr_icon`, `mr_wordmark`).
- Process: skill reference `07-brand-name-logo.md` (steps 2, 4, and 5).
  Render the finals with the `image-gen` command (STATUS.md),
  naming the dry-run images by path in the prompt as style references,
  plus transparent-background variants (or chroma key, per STATUS.md). Verify
  the alpha with Pillow.
- Launcher icons: `bun run games:icons` renders them from
  `apps-native/games/merge_relay/assets/branding/icon.svg`. Embed the final
  PNG in that SVG (this worked for Ludo), then run the script. Android
  adaptive icons must keep the motif inside the safe zone.
- In-app: optimized copies (≤1024 px, < 600 KB each) at
  `assets/art/logo_wide.png` and `assets/art/logo_stacked.png`, bound to the
  manifest slots `logoWide` and `logoStacked`. Code-drawn fallbacks remain.
  Add `assets/art/LICENSES.md` (file → master path → tool/model → date →
  "original AI-generated art").
- Masters stay in `.agents/resources/2026-09-25/merge-relay-art/logo/final/`.

## Implementation Checklist

- [ ] Run a smoke test, render the finals, VIEW them, and regenerate once if needed.
- [ ] Create the stacked, wide, and transparent variants, plus a sheet on
      the app background.
- [ ] Integrate the icons, splash, and home header, with the manifest
      bindings and `LICENSES.md`.
- [ ] Update the goldens (welcome, home, splash). Add a manifest test
      showing the bitmap is used when present (decode inside `runAsync`).
- [ ] Copy the goldens and the launcher-icon PNGs to
      `.agents/resources/2026-09-25/games-wave2-qa/22/`, and VIEW them.

## Files Touched

- `apps-native/games/merge_relay/{assets/branding/icon.svg,assets/art/**,android/app/src/main/res/**,ios/Runner/Assets.xcassets/**,lib/src/assets/**,test/**}`
- `.agents/resources/2026-09-25/merge-relay-art/logo/final/**`

## Acceptance Criteria

- `bun run games:icons:check` passes, and every launcher density exists.
- The goldens show the bitmap logo on Home and Welcome; the verifier views them.
- Each in-app PNG is < 600 KB, and `LICENSES.md` covers every file.
- The fallback tests still pass.

## Verification Commands

- `bun run games:icons -- --app merge_relay`
- `bun run games:icons:check`
- `du -k apps-native/games/merge_relay/assets/art/*.png`
- `bun run games:format:check`
- `bun run games:analyze -- --app merge_relay`
- `bun run games:test -- --app merge_relay`
- `bun run games:validate:strict`
- `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug`

## Out of Scope

- Tile and scene art (task 23). Store feature graphic (task 24).

## Commit message

`feat(merge-relay): integrate final logo, launcher icons, and wordmarks [16-games-portfolio-wave2/22]`
