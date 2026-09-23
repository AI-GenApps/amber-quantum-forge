---
epic: 15-ludo-launch
task: 28-docs-and-release-checklist
status: pending
commit_scope: gaming
depends_on: [15-ludo-launch/27-release-hardening]
estimate: M
---

# Write the Ludo architecture doc, handoff, and release checklist

## Goal

Finish `docs-internal/gaming/ludo-flutter-plan.md` (started as a stub in
task 15/23), write `docs-internal/gaming/handoffs/ludo.md` following the
Merge Relay handoff pattern, and write a release checklist, so the next
owner (human or agent) has one place to understand what was built and what
remains.

## Context/Decisions

- The repo's actual handoff convention is `docs-internal/gaming/handoffs/
  <game>.md` (see `docs-internal/gaming/handoffs/merge-relay.md`,
  `pocket-biome.md`, etc.) — use that path, not a top-level `docs/`
  directory (there is no `docs/` directory in this repo; `docs-internal/`
  and `docs-public/` are the only documentation roots per
  `tasks/START.md`).
- `ludo-flutter-plan.md` (architecture doc, extend the stub): cover the
  path map (rules package, backend routes, DB tables, client app —
  referencing every task 00-27's `Files Touched`), the Classic/Quick
  ruleset definition (copy the frozen definition from task 01, don't
  restate it loosely), the identity/auth flow (task 23), the realtime
  fanout design (task 22) including the Firestore-absent degrade, and the
  matchmaking/bot-fill/timeout model (tasks 19-21), and the release-hardening
  work (crash reporting, perf/size budgets, privacy policy draft — task 27).
  Follow
  `ludo-implementation-plan.md`'s section structure loosely for
  familiarity, but this is a *different* document for a *different* stack —
  do not present it as an update to that Unity plan.
- `handoffs/ludo.md`: follow `handoffs/merge-relay.md`'s structure exactly —
  an intro paragraph, an "Ownership and boundaries" table (rules/client/
  service/content/release-style rows, adapted to Ludo's actual owners from
  this epic's STATUS.md), and a requirement ledger table (one row per
  product decision from the epic prompt: rulesets, modes, identity, backend
  architecture, art, audio, screens, platform, telemetry, human acceptance)
  with `specified`/`implemented`/`integrated`/`verified`/`enabled` columns
  using the same "yes/partial/no" and "enabled means a real release gate"
  conventions `merge-relay.md` uses. Every row must cite the actual test
  file(s) that back an "implemented"/"verified" claim — do not mark
  anything verified without a citation, matching the discipline the
  existing handoffs use.
- Release checklist (`docs-internal/gaming/ludo-release-checklist.md` or a
  section within the handoff — implementer picks one location and is
  consistent): physical Android device build/install/play-through, Firebase
  console provisioning (Firestore enabled, Android app registered,
  `google-services.json` present, service-account IAM), `CRON_SECRET` and
  `GAME_TOKEN_SECRET_LUDO_*` configured per environment, migration applied
  to a real database, two-device online play verified, store listing status
  (`unverified` until confirmed). This checklist is what task 29 executes
  against — write it so a human can follow it without re-reading every
  prior task file.
- Public docs: per `tasks/START.md`, `docs-public/` holds user-facing docs
  organized by tab (getting started, troubleshooting, support). Ludo has no
  public support surface yet (no store listing, no external users) — add a
  short "How to Play Ludo" page under `docs-public/` only if this repo's
  existing convention already publishes public how-to-play pages for the
  other five games (check for one, e.g. under a games/support tab); if none
  exists yet for any game, skip public docs for Ludo too and note that
  explicitly rather than creating a first-of-its-kind public page
  unprompted.

## Implementation Checklist

- [ ] Finish `docs-internal/gaming/ludo-flutter-plan.md` per the outline
  above.
- [ ] Create `docs-internal/gaming/handoffs/ludo.md` following
  `merge-relay.md`'s structure, with a fully cited requirement ledger.
- [ ] Create the release checklist (as its own file or a section of the
  handoff — state the choice at the top of whichever file holds it).
- [ ] Check for an existing public how-to-play convention across the other
  five games under `docs-public/`; either add a matching Ludo page or
  record in the handoff why one was not added.
- [ ] Add a `ludo` row to any cross-game index/table this repo maintains
  (e.g. `docs-internal/gaming/team-handoff.md`, if it lists all games) so
  Ludo is discoverable the same way the other five games are.
- [ ] Cross-link the new docs from `tasks/epics/15-ludo-launch/STATUS.md`'s
  Notes section.

## Files Touched

- `docs-internal/gaming/ludo-flutter-plan.md`
- `docs-internal/gaming/handoffs/ludo.md`
- `docs-internal/gaming/ludo-release-checklist.md` (or a section of the
  handoff)
- `docs-internal/gaming/team-handoff.md` (if it indexes all games)
- `docs-public/*` (only if an existing convention requires it)
- `tasks/epics/15-ludo-launch/STATUS.md`

## Acceptance Criteria

- Every row in the handoff's requirement ledger cites a real file path
  (test file, route file, or screen file) for any "implemented" or
  "verified" claim.
- The release checklist lists every environment variable and provisioning
  step a human needs before task 29 can be attempted, with no step assumed
  or implied.
- The architecture doc's path map matches the actual files created by tasks
  00-18 (spot-check a sample of paths against the real tree).

## Verification Commands

- `bun run check:doc-paths`
- `bun run check:staged-docs`
- `bun run games:validate -- --strict`

## Out of Scope

- Actually executing the release checklist (task 29).
- Any code change.

## Commit message

`docs(gaming): write ludo architecture plan, handoff, and release checklist [15-ludo-launch/28]`
