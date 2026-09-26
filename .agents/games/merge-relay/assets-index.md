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
Recommended combo: `icon-v1.png` + `wordmark-v2.png`. Not yet integrated into the app —
awaiting user approval before any refinement/integration round.

## Current in-app art

| What | Path |
|---|---|
| Theme definitions (Signal + Ember palettes) | `apps-native/games/merge_relay/lib/src/merge_relay_theme.dart` |
| Home screen composition | `apps-native/games/merge_relay/lib/src/merge_relay_home.dart`, `merge_relay_home_widgets.dart`, `merge_relay_home_art.dart` |
| Board painter/renderer | `apps-native/games/merge_relay/lib/src/merge_relay_board_painter.dart` |

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
