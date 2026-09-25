# Meme Court — product

## One-liner

Private-group caption battles: friends caption a prompt, everyone votes in pairs, and
the group reaches a "verdict".

## Scope for this epic (2026-09-25)

**Parked. Fonts only (task 04).** No gameplay work. Portfolio audit rank: 5 (lowest) —
"furthest from launch in practice (needs a live service plus staffing). Recommend
parking." Source: `.agents/resources/2026-09-25/games-portfolio-audit/README.md`.

## Systems (as implemented today)

| System | Status | Source |
|---|---|---|
| Hot-seat demo (fake players Alice and Bea) | built | `apps-native/games/meme_court/lib/meme_court_app.dart` |
| One hard-coded round | built (fixture only) | `apps-native/games/meme_court/assets/content/prompts.json` (`prompts: [1 fixture item]`, `status: "pending_human_review"`) |
| Caption cards / voting UI | built | `apps-native/games/meme_court/lib/meme_court_cards.dart`, `apps-native/games/meme_court/lib/meme_court_submission_cards.dart` |
| Pairing / ballot / verdict rules | pure Dart package | `apps-native/games/packages/court_rules` |
| Real membership / invitations | not built (needs server) | — |
| Web voting entry | not built | — |
| Moderation / reporting / blocking | not built | — |

## Why parked (product-level blockers, not just content)

- Party game needs real friends online at once — a cold-start problem.
- UGC needs a human moderation owner; the handoff itself keeps free text disabled until
  one exists.
- Meme imagery raises copyright questions, and the concept forbids generated images —
  **there are no memes in the app today** (`apps-native/games/meme_court/assets/content/prompts.json`
  describes "a friend posts a photo" but no photo is shown).

Source: `.agents/resources/2026-09-25/games-portfolio-audit/README.md`.

## Screens (current)

Caption pick, frozen docket. Audit renders:
`.agents/resources/2026-09-25/games-portfolio-audit/renders/meme_court-01-home.png`,
`meme_court-02-frozen.png`. Device evidence (2026-09-17):
`docs-internal/gaming/evidence/visual/meme-court-before.png`,
`meme-court-after.png`, `meme-court-final-frozen.png`,
`meme-court-final-verdict.png`, `meme-court-final-selected-both.png`.

## Tech

Flutter + Flame; pure Dart rules package `apps-native/games/packages/court_rules`
(versioned rounds, phrase IDs, moderation states, seeded pairings, ballots, outcomes,
injected clock). Full requirement ledger (MC-01–MC-16):
`docs-internal/gaming/handoffs/meme-court.md`.
