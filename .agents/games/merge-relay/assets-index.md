# Merge Relay — assets & evidence index

## Brand (this session, 2026-09-26)

| What | Path |
|---|---|
| Strict name existence check + evidence URLs | `.agents/resources/2026-09-26/merge-relay-brand/name-check.md` |
| 3 logo direction briefs (icon + wordmark prompts) | `.agents/resources/2026-09-26/merge-relay-brand/logo-briefs.md` |
| Logo round 1 renders (3 directions x icon+wordmark, contact sheet, critique, lookalike notes, recommendation) | `.agents/resources/2026-09-26/merge-relay-brand/logo/` (see its `README.md`) |

Round 1 rendered via `gpt_image_2_5` (Higgsfield CLI, `--quality high --resolution 2k`), all
6 images passed QA on first generation. Recommended direction: Signal Grid icon, refined
wordmark treatment (see `logo/README.md` recommendation section). Round 1 was flat/corporate
in style and had a wordmark misspelling ("REIAY", an arc replacing the "l").

| Logo round 2 renders (premium glossy casual restyle of Signal Grid: 2 icon variants, 2 wordmark variants x opaque+transparent, contact sheet, letter-by-letter spelling checks, critique, lookalike notes) | `.agents/resources/2026-09-26/merge-relay-brand/logo-round2/` (see its `README.md`) |

Round 2 rendered via `gpt_image_2_5` (Higgsfield CLI, `--quality high --resolution 2k`,
`--image-references` against the Ludo Vortex brand quality bar). All 6 generations passed
QA on first attempt; both wordmarks verified letter-by-letter ("M-E-R-G-E R-E-L-A-Y").
Recommended combo: `icon-v1.png` + `wordmark-v2.png`. **Approved by the user 2026-09-26 and
integrated** — icon + splash/home logo only (see decisions log).

## Current in-app art (integrated 2026-09-26)

| What | Path |
|---|---|
| Launcher icon source (base64 PNG derived from `icon-v1.png`, embedded per the Ludo Vortex pattern) | `apps-native/games/merge_relay/assets/branding/icon.svg` |
| Rasterized launcher icons (regenerated via `bun run games:icons -- --app merge_relay`) | `apps-native/games/merge_relay/android/app/src/main/res/mipmap-*/ic_launcher.png`, `.../drawable/ic_launcher_foreground.png`, `.../values/ic_launcher_colors.xml`, `apps-native/games/merge_relay/ios/Runner/Assets.xcassets/AppIcon.appiconset/` |
| Stacked hero logo (home-screen hero; derived from `wordmark-v2-transparent.png`) | `apps-native/games/merge_relay/assets/art/logo_stacked.png` |
| Wide header logo (derived from `wordmark-v1-transparent.png`) | `apps-native/games/merge_relay/assets/art/logo_wide.png` |
| Brand art provenance | `apps-native/games/merge_relay/assets/art/LICENSES.md` |
| Named-slot art manifest + bitmap/fallback widget | `apps-native/games/merge_relay/lib/src/merge_relay_art_manifest.dart` |
| Theme definitions (Signal + Ember palettes, untouched) | `apps-native/games/merge_relay/lib/src/merge_relay_theme.dart` |
| Home screen composition (hero + header wired to the art manifest) | `apps-native/games/merge_relay/lib/src/merge_relay_home.dart`, `merge_relay_home_widgets.dart`, `merge_relay_home_art.dart` |
| Board painter/renderer (untouched — visual overhaul is a separate future epic) | `apps-native/games/merge_relay/lib/src/merge_relay_board_painter.dart` |

## Device / visual evidence (pre-existing, from the implementation epic)

| What | Path |
|---|---|
| Before/after overhaul snapshots | `docs-internal/gaming/evidence/visual/merge-relay-before.png`, `merge-relay-after.png` |
| Real-merge capture (2026-09-17 Android smoke, device `SM-A525F`) | `docs-internal/gaming/evidence/visual/merge-relay-final-real-merge.png` |
| Relaunch / new-round / new-confirmation / relaunch-route captures | `docs-internal/gaming/evidence/visual/merge-relay-final-relaunch.png`, `merge-relay-final-relaunch-route.png`, `merge-relay-final-new-round.png`, `merge-relay-final-new-confirmation.png` |
| QA-candidate relaunch capture | `docs-internal/gaming/evidence/visual/merge-relay-qa-candidate-relaunch.png` |

## Research & planning (pre-existing)

| What | Path |
|---|---|
| Implementation handoff | `docs-internal/gaming/handoffs/merge-relay.md` |
| Corrective release plan (UX contract, PGS decision, phases, state gates) | `docs-internal/gaming/merge-relay-release-plan.md` |
| Versioned API/HTTP contract | `docs-internal/gaming/merge-relay-api-contract.md` |
| Server commerce boundary (cosmetic IAP) | `docs-internal/gaming/merge-relay-commerce.md` |
| Service/release audit (P1/P2 blockers) | `docs-internal/gaming/merge-relay-release-audit.md` |
| Source provenance (Drive URLs, revisions, hashes) | `docs-internal/gaming/sources/merge-relay.json` |
| Epic status | `tasks/epics/14-merge-relay-implementation/STATUS.md` |
| Registry entry | `scripts/games/registry-games.ts` (id `merge_relay`) |
| Reusable process skill | `.claude/skills/audit-game-and-prepare-for-release/` |
