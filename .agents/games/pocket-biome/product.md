# Pocket Biome — product

## One-liner

A cozy terrarium: plant a seed, watch it grow in real elapsed time, breed new species
along three trait axes, and collect them in a habitat.

## Scope for this epic (2026-09-25)

**No gameplay work.** This epic (16) only adds custom fonts (task 03) and runs an
art-direction dry run (task 15: preview images + full-screen mockups) for the user to
price and pick a visual direction before any full art budget is spent. Gameplay and
backend scope remain governed by `docs-internal/gaming/handoffs/pocket-biome.md`.

## Modes / systems (as implemented today)

| System | Status | Source |
|---|---|---|
| Habitat grid (6 pots) | built | `apps-native/games/pocket_biome/lib/src/pocket_biome_app.dart`, `apps-native/games/pocket_biome/lib/src/pocket_biome_ui.dart` |
| Planting / elapsed-time growth | built (1 plantable species: Mossling) | `apps-native/games/pocket_biome/lib/src/pocket_biome_app.dart`, rules in `apps-native/games/packages/biome_rules` |
| Species catalogue | 6 of ~30 authored (v0.3 target) | `apps-native/games/pocket_biome/content/manifest.json` (`implemented_species: 6`, `target_species: 30`), `apps-native/games/pocket_biome/lib/src/biome_content.dart` |
| Breeding (three trait axes) | specified, partial engine slice | `apps-native/games/packages/biome_rules` (`biome_rules_test.dart`) |
| Decoration | not built | — |
| Visits / gifting / crossbreeding invitations | not built (needs server) | — |
| Reminders | not built | — |
| Album | UI exists | `apps-native/games/pocket_biome/lib/src/pocket_biome_album.dart` |

## Content (today vs. v0.3 target)

| | Today | v0.3 target |
|---|---|---|
| Species | 6 (`apps-native/games/pocket_biome/content/manifest.json`) | ~30, three trait axes, six behaviors |
| Behaviors | fixture only | 6 authored |

## Screens (current)

Habitat/pot grid, planting flow, album. Audit renders:
`.agents/resources/2026-09-25/games-portfolio-audit/renders/pocket_biome-01-home.png`
(before/after planting: `pocket_biome-02-planted.png`). Device evidence (2026-09-17):
`docs-internal/gaming/evidence/visual/pocket-biome-before.png`,
`pocket-biome-after.png`, `pocket-biome-final-plant.png`,
`pocket-biome-final-harvest.png`, `pocket-biome-final-inspect-ready.png`,
`pocket-biome-final-lifecycle-growing.png`.

## Graphics (current gap this epic's art dry run addresses)

Pots are pale cards with a dot-and-ellipse sprout — no illustrated art yet. Portfolio
audit: "In this genre... the art is the product, and there is none yet."
Source: `apps-native/games/pocket_biome/lib/src/pocket_biome_art.dart`,
`apps-native/games/pocket_biome/lib/src/pocket_biome_painter.dart`.

## Tech

Flutter + Flame; pure Dart rules package `apps-native/games/packages/biome_rules`
(injected clock so growth/settlement is testable and cannot be spoofed by device-time
changes); local-only save adapter today
(`apps-native/games/pocket_biome/lib/src/pocket_biome_persistence.dart`,
`apps-native/games/pocket_biome/lib/src/save_adapter.dart`). Full requirement ledger
(PB-01–PB-16): `docs-internal/gaming/handoffs/pocket-biome.md`.
