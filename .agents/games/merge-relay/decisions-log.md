# Merge Relay — decisions log

Decisions below are the six wave-2 decisions recorded in
`tasks/epics/16-games-portfolio-wave2/STATUS.md` ("Decisions (user, 2026-09-25)"),
applied to Merge Relay specifically.

| Date | Decision | Rationale / notes |
|---|---|---|
| 2026-09-25 | Merge Relay visual target: **Threes!** (character tiles, warm hand-made palette, real soundtrack); original art only | Portfolio audit found Merge Relay's current look "plain Material... looks like a utility app, not a game"; Threes! is the genre's acknowledged visual/feel benchmark. Source: `.agents/resources/2026-09-25/games-portfolio-audit/README.md`, `.agents/resources/2026-09-25/games-competitor-references/README.md` |
| 2026-09-25 | Merge Relay v1 monetization: **None** (no ads, no IAP) | Ship a clean solo experience first; commerce/relay backend work (MR-04–MR-13) was oversized for a v1 and is deferred to v1.1. See `economy.md` |
| 2026-09-25 | Merge Relay name: the workflow proposes candidates that pass the strict uniqueness check (task 14); **the user picks** at task 17 | "Merge Relay" describes mechanics, not a feeling, and is weak on a store shelf (portfolio audit verdict) |
| 2026-09-25 | Rescue content: **60 boards, 6 chapters**, every board solver-validated | Expands from the current 5 authored boards (`apps-native/games/merge_relay/content/rescue_boards.json`) to a real campaign (task 06) |
| 2026-09-25 | Branch: everything on `main`, one commit per task, never push | Matches the epic's execution protocol (`tasks/epics/16-games-portfolio-wave2/STATUS.md`, "Execution order") |
| 2026-09-25 | Fonts: every game uses bundled custom fonts; Merge Relay uses **Fredoka** (display) / **Nunito Sans** (body) | Rounded, friendly numerals for tiles, echoing Threes!-like warmth. Source: `github.com/google/fonts/tree/main/ofl/fredoka`, `.../nunito-sans` (verified to exist 2026-09-25) |

## Scope-gate decision (this task)

| Date | Decision | Rationale / notes |
|---|---|---|
| 2026-09-25 | Friend relays, PGS, and every network path gated off for v1 (kept in code for v1.1); a dated decision section was added to `docs-internal/gaming/handoffs/merge-relay.md` recording which requirement-ledger rows (MR-04–MR-08, MR-11, MR-13, PGS) are deferred | Per `apps-native/games/AGENTS.md`'s rule: refresh provenance and the affected handoff before changing a source-indexed requirement |
