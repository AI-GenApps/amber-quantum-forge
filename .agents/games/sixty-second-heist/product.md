# Sixty-Second Heist — product

## One-liner

A turn-based stealth route planner: plot moves on a grid, grab loot, reach the exit,
and avoid patrolling guards.

## Scope for this epic (2026-09-25)

**No gameplay work.** This epic (16) only adds custom fonts (task 03) and runs strict
name-uniqueness research for a rename (task 16), because the current name conflicts
with a casino slot machine. Gameplay and backend scope remain governed by
`docs-internal/gaming/handoffs/sixty-second-heist.md`.

## Systems (as implemented today)

| System | Status | Source |
|---|---|---|
| Grid / vault board | built (1 fixture level) | `apps-native/games/sixty_second_heist/lib/src/heist_app.dart`, `apps-native/games/sixty_second_heist/lib/src/heist_board_art.dart`, `apps-native/games/sixty_second_heist/lib/src/heist_board_painter.dart` |
| Route editing / execution | built | `apps-native/games/sixty_second_heist/lib/src/heist_ui.dart`, `apps-native/games/sixty_second_heist/lib/src/heist_ui_controls.dart` |
| Rules engine (fixed-tick, deterministic) | pure Dart package | `apps-native/games/packages/heist_rules` |
| Level content | 1 of ~80 target levels | `apps-native/games/sixty_second_heist/content/manifest.json` (`implemented_fixture_levels: 1`, `target_levels: 80`) |
| Obstacles / tools | small fixture (target: 6 obstacles + 3 tools per the handoff; manifest tracks a combined `target_obstacles: 12`) | `apps-native/games/sixty_second_heist/lib/src/heist_board_symbols.dart` |
| Timed ("sixty-second") mode | optional mode fixture only | `apps-native/games/sixty_second_heist/lib/src/heist_content.dart` |
| Editor / campaign / daily / economy | not built | — |

## Name problem (why this epic touches this game at all)

The current name is a hard blocker, independent of content or code quality: "60 Second
Heist" is an existing 4ThePlayer/Yggdrasil casino slot machine (gambling association,
trademark risk), and "Sixty Second Heist" is also an itch.io jam game. Source:
`.agents/resources/2026-09-25/games-portfolio-audit/README.md` ("Name: Conflict...").
Task 16 runs the strict uniqueness check and proposes rename candidates; no candidate
is picked in this task.

## Screens (current)

Mission/route planner ("Mission 1 planner"). Audit render:
`.agents/resources/2026-09-25/games-portfolio-audit/renders/sixty_second_heist-01-home.png`.
Device evidence (2026-09-17):
`docs-internal/gaming/evidence/visual/sixty-second-heist-before.png`,
`sixty-second-heist-after.png`,
`sixty-second-heist-final-draft-relaunch.png`,
`sixty-second-heist-final-success.png`.

## Graphics (current)

A navy grid with lines and a diamond, plus arrow buttons — reads as a debug view, no
characters/vault/guards drawn as art yet (portfolio audit verdict).

## Tech

Flutter + Flame; pure Dart rules package `apps-native/games/packages/heist_rules`
(fixed-tick vault state, route legality, deterministic event trace — the renderer does
not decide detection). Full requirement ledger (SH-01–SH-16):
`docs-internal/gaming/handoffs/sixty-second-heist.md`.
