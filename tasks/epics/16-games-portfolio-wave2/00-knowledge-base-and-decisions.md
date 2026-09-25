---
epic: 16-games-portfolio-wave2
task: 00-knowledge-base-and-decisions
status: completed
commit_scope: games
depends_on: []
estimate: M
owner: agent
---

# Game knowledge bases and decision records for the five non-Ludo games

## Goal

Create the per-game knowledge base the release skill requires
(`.agents/games/<slug>/`, modelled on `.agents/games/ludo-vortex/`) for all
five games, and record the 2026-09-25 decisions so that later tasks and
humans read one source of truth.

## Context / Decisions

- Template: `.agents/games/ludo-vortex/` (read every file first and mirror
  its structure and tone).
- Inputs: the audit (`.agents/resources/2026-09-25/games-portfolio-audit/README.md`),
  competitor references
  (`.agents/resources/2026-09-25/games-competitor-references/README.md`),
  the per-game handoffs in `docs-internal/gaming/handoffs/`, and the
  decision tables in `tasks/epics/16-games-portfolio-wave2/STATUS.md`.
- Slugs: `merge-relay` (keep this folder name even after the rename;
  task 18 updates its README title), `pocket-biome`, `sixty-second-heist`,
  `meme-court`, `peeklings`.
- `apps-native/games/AGENTS.md` rule: before changing a source-indexed
  requirement, refresh provenance and the affected handoff. The solo-v1 cut
  changes Merge Relay's scope, so add a dated "2026-09-25 user decision"
  section to `docs-internal/gaming/handoffs/merge-relay.md` stating which
  MR rows are deferred to v1.1 (MR-04 to MR-08 and MR-13 relay/social,
  MR-11 purchases, PGS). Do **not** delete requirement rows.
- Status per game: Merge Relay **active (solo v1)**; Pocket Biome **art
  dry run only**; Sixty-Second Heist **rename research only**; Meme Court
  **parked**; Peeklings **parked, name kept**.

## Implementation Checklist

- [x] For each of the five slugs, create `.agents/games/<slug>/` with
      `README.md` (quick facts: app id, bundle ids, status, fonts, primary
      competitor reference, index), `product.md` (modes and rules **as
      implemented today**, from code, citing file paths), `economy.md`
      (Merge Relay: "no monetization in v1" plus the deferred items; others:
      TBD), `store-listing.md` (answer-bank skeleton with every field marked
      TBD), `assets-index.md` (links to the audit, the competitor references
      and the `docs-internal/gaming/evidence/visual/` captures),
      `decisions-log.md` (dated decisions from STATUS.md), and
      `open-questions.md` (owner and blocker per question).
- [x] Merge Relay `open-questions.md` includes: final name (task 17), crash
      reporting vendor, privacy-policy URL host, and Play developer account
      owner.
- [x] Sixty-Second Heist `open-questions.md` records the name conflict with
      source URLs from the audit. (Note: the audit itself cites no source
      URLs for the casino-slot/itch.io conflicts — only names. This is
      recorded explicitly, and task 16's uniqueness research is flagged as
      owning the URL lookup.)
- [x] Add the dated decision section to
      `docs-internal/gaming/handoffs/merge-relay.md`.
- [x] Mark every unknown as **TBD** / needs-verification; invent no numbers.

## Files Touched

- `.agents/games/{merge-relay,pocket-biome,sixty-second-heist,meme-court,peeklings}/*.md`
- `docs-internal/gaming/handoffs/merge-relay.md`

## Acceptance Criteria

- 35 files exist (5 folders × 7 files), each non-empty and matching the
  Ludo template's section structure.
- Every `product.md` cites at least three real source paths that exist
  (the verifier spot-checks them with `ls`).
- Merge Relay `decisions-log.md` contains all six decisions from
  STATUS.md with the date 2026-09-25.
- The handoff edit adds a section and removes no existing table rows
  (checked with `git diff`).
- `bun run check:staged-docs` passes once the files are staged, or reports
  that there are no staged `docs-internal`/`docs-public` pages to validate.

## Verification Commands

- `ls .agents/games/*/ | head -60`
- `git diff --stat`
- `git diff docs-internal/gaming/handoffs/merge-relay.md`
- `bun run check:doc-paths`

## Out of Scope

- Any code change. Ludo files (frozen).

## Commit message

`docs(games): add knowledge bases and wave-2 decisions for five games [16-games-portfolio-wave2/00]`
