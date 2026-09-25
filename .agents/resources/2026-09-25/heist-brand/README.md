# Sixty-Second Heist — rename research (2026-09-25)

Parallel-lane research for epic `16-games-portfolio-wave2` task 16. Research
only — no code, registry, or display-name change.

## Files

- `name-check.md` — all 22 brainstormed candidates, each run through the
  four-part strict check (Google Play search, iTunes Search API, web /
  itch.io / Steam, trademark glance), with a verdict (EXISTS / NOT FOUND /
  UNSURE) and evidence URLs per name, followed by the ranked shortlist and
  the rejected/held-back list.
- `shortlist.json` — the six ranked NOT FOUND candidates in
  `[{name, rationale, verdict, checked_at, evidence[]}]` form, validated
  with `/data/tools/pyenv/bin/python -m json.tool shortlist.json`.

## Result

12 of 22 candidates came back NOT FOUND. The top 6, ranked, are:

1. Heist Plotter
2. Vault Sketch
3. Loot Route
4. Grid Heist
5. Guard Dodge
6. Sneak Route

All six avoid casino/slot connotations, avoid promising a time limit (the
60-second timer is only an optional mode), and avoid the existing-IP words
"GO" and "Bob". None conflict with the current "Sixty-Second Heist" /
"60 Second Heist" name collisions (the 4ThePlayer/Yggdrasil slot and the
itch.io jam game).

Five candidates came back as hard conflicts (EXISTS): Vault Runner, Shadow
Vault, Blueprint Heist, Night Vault, Loot Ledger, Quiet Steps. Four came
back UNSURE on a synonym or close-spelling risk and were held back in
favor of the clean six: Quiet Heist, Vault Break, Grid Thief, Vault Logic.
Full detail, evidence, and the remaining clean backups (Vault Tactics,
Tactical Heist, Loot Planner, Copycat Heist, Thief's Route, Route the
Vault) are in `name-check.md`.

## Next step

Per the task file, the rename itself (and formal trademark clearance on
whichever name is picked) happens when this game is picked up in a later
epic — this task only produces the checked shortlist. The orchestrator
applies the corresponding entry to
`.agents/games/sixty-second-heist/open-questions.md`.
