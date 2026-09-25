---
epic: 16-games-portfolio-wave2
task: 14-mr-name-candidates
status: pending
commit_scope: merge-relay
depends_on: [16-games-portfolio-wave2/13-mr-local-quality]
estimate: M
owner: agent
---

# Merge Relay: brand-name candidates with a strict uniqueness check

## Goal

Produce **≥6 candidate names** for the renamed game, each verified as
**NOT FOUND** under the strict check, with evidence. The user picks one in
task 17.

## Context / Decisions

- Rules: skill reference
  `.claude/skills/audit-game-and-prepare-for-release/references/07-brand-name-logo.md`.
  The user rejects any name that already exists as an app or game anywhere.
  A generic genre word alone ("Merge", "2048", "Tiles") is rejected, and
  crowded patterns ("Merge X", "X 2048", "Tile X") are almost always taken.
- The name should evoke the game's warmth and its character tiles (the
  Threes! direction), stay short (≤ 2 words, ≤ 14 characters), be easy to
  say, and work as an icon wordmark. The rescue/chapter framing and cute
  tile characters are good hooks. Avoid "Threes", "2048", and "Relay" as the
  main word.
- Strict check per name (web only; domains are not required):
  1. Google Play search: `https://play.google.com/store/search?q=<name>&c=apps`
     (plain and quoted) plus `site:play.google.com "<name>"`.
  2. App Store: `https://itunes.apple.com/search?term=<name>&entity=software&limit=50`
     (compare `trackName`) plus `site:apps.apple.com "<name>"`.
  3. Web: `"<name>" game`, `"<name>" app`, itch.io, Steam, APK mirrors,
     browser-game sites.
  4. A trademark glance (USPTO / WIPO hints via search).
  Fuzzy or near matches in games = conflict. Verdict per name: EXISTS / NOT FOUND
  / UNSURE, with URLs.
- Brainstorm ≥25 names, check them all, and present only NOT FOUND names
  (≥6), ranked, each with a one-line rationale and a plain-language
  meaning.

## Implementation Checklist

- [ ] Write `.agents/resources/2026-09-25/merge-relay-brand/name-check.md`:
      every candidate checked (the table name → verdict → evidence URLs →
      notes), then the shortlist.
- [ ] Write `.agents/resources/2026-09-25/merge-relay-brand/shortlist.json`:
      `[{name, rationale, verdict, checked_at}]`.
- [ ] Add the shortlist to `.agents/games/merge-relay/open-questions.md`.

## Files Touched

- `.agents/resources/2026-09-25/merge-relay-brand/{name-check.md,shortlist.json}`
- `.agents/games/merge-relay/open-questions.md`

## Acceptance Criteria

- ≥25 names were checked, and ≥6 NOT FOUND names are shortlisted, each with
  ≥3 evidence URLs.
- The verifier independently re-checks the top 3 shortlisted names on Play
  and the App Store; any hit fails the task.

## Verification Commands

- `/data/tools/pyenv/bin/python -m json.tool .agents/resources/2026-09-25/merge-relay-brand/shortlist.json`
- `git diff --stat`

## Out of Scope

- Changing any app name (task 18). Logos (task 19).

## Commit message

`docs(merge-relay): add strictly checked brand-name shortlist [16-games-portfolio-wave2/14]`
