---
epic: 17-city-drive
task: 18-name-candidates-and-icon-dry-run
status: pending
commit_scope: city-drive
depends_on: [17-city-drive/17-capacitor-packaging]
estimate: M
owner: agent
---

# Name candidates (strict uniqueness) + icon dry run

## Goal

Propose 6–8 public names that pass a strict uniqueness check, and 3 icon
directions as generated drafts, so the human can pick at task 19.

## Context / Decisions

- **Name method:** follow the strict approach used in epic 16 tasks 14/16.
  Read `tasks/epics/16-games-portfolio-wave2/14-*.md` and its evidence folder
  first. For each candidate, search:
  - the Google Play and App Store titles (exact and close matches in the
    driving and casual genres)
  - the USPTO and EUIPO trademark databases (class 9 and 41)
  - the `.com` / `.app` availability signal

  Reject any candidate with an exact or near-exact game title, or a live mark
  in classes 9/41. Record every query, URL, and date.
- The name must suit a stylized city-driving game with missions, be easy to
  say, be at most 14 characters, and avoid "Simulator" clichés and trademarks
  (no real car brands).
- **Icon drafts:** generate them with the `generate-image` skill, which wraps
  `codex exec` (`~/.local/bin/codex` exists on this server).
  - **First, a one-image smoke test.** If generation fails, return
    **blocked**. Never substitute code-drawn or downloaded art and present it
    as generated.
  - Make 3 directions × 2 variants, 1024×1024, no text in the icon:
    1. a hero car at three-quarter view on a city block
    2. a road-sign or map-pin mark
    3. a top-down car drifting on an intersection
  - Use the Kenney-style low-poly, flat palette to match the game.
  - Log the prompt, model, and params per image. Run `git status --porcelain`
    after generating and remove any stray files outside the evidence folder.
- Save everything under `.agents/resources/2026-10-15/city-drive-qa/18/` with
  a `README.md` containing:
  - a name table (name, verdict, evidence links)
  - an icon contact sheet (assemble one PNG grid with Python/Pillow if it is
    available, or sharp via bun)
  - a recommendation

## Implementation Checklist

- [ ] Name research and a shortlist of 6–8 passing candidates, with evidence.
- [ ] Image-generation smoke test, then 6 icon drafts and a contact sheet.
- [ ] Update `.agents/games/city-drive/open-questions.md` with the pick request.

## Files Touched

- `.agents/resources/2026-10-15/city-drive-qa/18/**`
- `.agents/games/city-drive/open-questions.md`

## Acceptance Criteria

- At least 6 candidates, each with recorded searches and a pass verdict.
- 6 generated icon drafts, each with a prompt log, or the task is blocked
  with the smoke-test error.
- No code changes.

## Out of Scope

- Applying the name or icon (task 20).

## Verification Commands

- `ls .agents/resources/2026-10-15/city-drive-qa/18/`
- `git status --porcelain` (only the files in this task's folder and open-questions)

## Commit message

`docs(city-drive): add name candidates and icon drafts [17-city-drive/18]`
