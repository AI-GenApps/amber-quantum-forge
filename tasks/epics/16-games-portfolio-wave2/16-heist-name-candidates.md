---
epic: 16-games-portfolio-wave2
task: 16-heist-name-candidates
status: completed
commit_scope: heist
depends_on: [16-games-portfolio-wave2/15-pb-art-direction-dry-run]
estimate: S
owner: agent
---

# Sixty-Second Heist: rename candidates with a strict uniqueness check

## Goal

Replace the conflicting name with a shortlist of ≥5 strictly checked,
NOT FOUND alternatives. Research only; the rename itself happens when the
game is picked up in a later epic.

## Context / Decisions

- Conflicts (audit, 2026-09-25): "60 Second Heist" is a 4ThePlayer /
  Yggdrasil casino slot (a gambling association and trademark risk), and
  "Sixty Second Heist" is an itch.io jam game.
- Concept: a turn-based heist route planner (plot moves, grab the loot,
  reach the exit, avoid guards). The timer is only an optional mode, so the
  name should not promise a time limit. References: Hitman GO, Robbery Bob.
- Use the same strict-check procedure and output format as task 14.
  Brainstorm ≥20 names and present ≥5 NOT FOUND ones. Avoid slot/casino
  connotations and existing IP ("GO", "Bob").

## Implementation Checklist

- [x] Write `.agents/resources/2026-09-25/heist-brand/name-check.md` and `shortlist.json`.
- [x] Update `.agents/games/sixty-second-heist/open-questions.md`.

## Files Touched

- `.agents/resources/2026-09-25/heist-brand/**`
- `.agents/games/sixty-second-heist/open-questions.md`

## Acceptance Criteria

- ≥20 names were checked, and ≥5 are shortlisted as NOT FOUND, each with
  ≥3 evidence URLs.
- The verifier re-checks the top 2 on Play and the App Store.

## Verification Commands

- `/data/tools/pyenv/bin/python -m json.tool .agents/resources/2026-09-25/heist-brand/shortlist.json`
- `git diff --stat`

## Out of Scope

- Any code, registry, or display-name change.

## Commit message

`docs(heist): add strictly checked rename shortlist [16-games-portfolio-wave2/16]`
