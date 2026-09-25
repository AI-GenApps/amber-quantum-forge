# Merge Relay — assets & evidence index

## Research & planning

| What | Path |
|---|---|
| Portfolio audit (verdict, benchmark table, recommendation) | `.agents/resources/2026-09-25/games-portfolio-audit/README.md` |
| Competitor references (Threes! primary + 2048, X2 Blocks, X2 Puzzle) | `.agents/resources/2026-09-25/games-competitor-references/README.md` |
| Store-listing references: Threes! (primary, 6 imgs, both Play listings + App Store), X2 Blocks (game-feel only, 4 imgs), 2048 Cirulli (anti-reference, 3 imgs) (task 01) | `.agents/resources/2026-09-25/threes-store-reference/`, `.agents/resources/2026-09-25/x2-blocks-store-reference/`, `.agents/resources/2026-09-25/2048-cirulli-store-reference/` |
| Merge Relay visual reference (anchors, do/don't checklist, contact sheet) (task 01) | `.agents/resources/2026-09-25/merge-relay-visual-reference/README.md`, `.agents/resources/2026-09-25/merge-relay-visual-reference/contact-sheet.png` |
| Epic + task files | `tasks/epics/16-games-portfolio-wave2/` |
| Prior backend release plan / audit (v0.3 full-scope plan, now partially deferred) | `docs-internal/gaming/merge-relay-release-plan.md`, `docs-internal/gaming/merge-relay-release-audit.md`, `docs-internal/gaming/merge-relay-api-contract.md`, `docs-internal/gaming/merge-relay-commerce.md` |
| Requirement ledger + 2026-09-25 solo-v1 decision | `docs-internal/gaming/handoffs/merge-relay.md` |
| Reusable process skill | `.claude/skills/audit-game-and-prepare-for-release/` |

## Device / render evidence (our game)

| What | Path |
|---|---|
| Device captures, 2026-09-17 (before/after, final states, QA candidate) | `docs-internal/gaming/evidence/visual/merge-relay-before.png`, `merge-relay-after.png`, `merge-relay-final-new-confirmation.png`, `merge-relay-final-new-round.png`, `merge-relay-final-real-merge.png`, `merge-relay-final-relaunch.png`, `merge-relay-final-relaunch-route.png`, `merge-relay-qa-candidate-relaunch.png` |
| Headless renders, 2026-09-25 audit (home, tutorial, play, result) — Flame board tile digits render as white squares (font-loading test artifact, not a device bug) | `.agents/resources/2026-09-25/games-portfolio-audit/renders/merge_relay-01-home.png`, `merge_relay-02-tutorial.png`, `merge_relay-03-play.png`, `merge_relay-04-result.png` |
| Full visual review write-up | `docs-internal/gaming/visual-review.md` |
| Screen goldens (from task 07 onward, real fonts loaded) | `apps-native/games/merge_relay/test/goldens/screens/` |

## Brand (not yet produced — planned this epic)

| What | Path | Status |
|---|---|---|
| Threes!-grade visual reference set (task 01) | `.agents/resources/2026-09-25/merge-relay-visual-reference/` | done |
| Name candidates (task 14) + human pick (task 17) | `.agents/resources/2026-09-25/<topic>/`, this folder's `decisions-log.md` | planned |
| Logo + icon dry run (task 19) / final (task 22) | `.agents/resources/2026-09-25/<game>-art/logo/` | planned |
| Art-set dry run (task 20) / final (task 23): character tiles, home scene | `.agents/resources/2026-09-25/<game>-art/<set>/` | planned |
| CC0 audio + music (task 10) | `apps-native/games/merge_relay/assets/audio/` (with `LICENSES.md`, mirroring Ludo Vortex's pattern) | planned |

## Fonts (planned, task 07)

Fredoka (display) / Nunito Sans (body), OFL — source
`github.com/google/fonts/tree/main/ofl/<family>`. Each family's `OFL.txt` is committed
beside the font files.
