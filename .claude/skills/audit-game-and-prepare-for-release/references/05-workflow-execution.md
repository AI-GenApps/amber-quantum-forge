# Phase 5 — Sequential workflow execution

Script: `references/assets/sequential-epic-workflow.js` (copy to your scratchpad, adjust
the RULES block for the game, pass tasks via `args`). Load the `workflow-authoring` skill
before editing it. One agent at a time; stages per task:

1. **implement** — reads START.md, STATUS.md, the task; continues any partial uncommitted
   work; implements the checklist; runs every verification command; ticks boxes; no commit.
2. **verify** — fresh skeptical agent; re-runs every command itself; judges each acceptance
   criterion with evidence; fails scope creep, stubs, skipped tests, edited frozen dirs,
   unticked required items; for device steps actually runs them and VIEWS screenshots.
3. **fix** — up to 2 rounds, each followed by a fresh verify.
4. **commit** — explicit paths only, task commit message + session trailer, hooks run, no push.
Stop on: blocked, failed after 2 fixes, commit failure, human task, `stopAfter` checkpoint.

## Args

```json
{"branch":"main","epicDir":"tasks/epics/NN-slug",
 "resumeDirtyPaths":[".claude/","apps-native/games/<id>/"],   // only when resuming partial work
 "tasks":[{"id":"03","file":"03-client-scaffold.md"}],
 "stopAfter":"09"}
```

## RULES block — must include

- Branch policy; never push/force/rewrite; don't touch frozen dirs.
- Never boot emulators. Physical device serial; run device steps for real; NOT RUN only if
  adb shows no device. Never fabricate output.
- Visual target README path + competitor anchor screenshots; list of visual failures
  (framework-default styling, empty/black regions, overflow, clipped text, misalignment).
- Artifacts → `.agents/resources/<date>/<game>-visual-qa/<task-id>/`, committed with the task.
- Incremental writes (≤ ~200 lines per Write/Edit); no filesystem-wide `find`; long commands
  with timeouts/background.
- Flutter tests: healthy suite < 3 min; iterate per file with `--timeout 60s`; a hanging
  test is a bug (pumpAndSettle on infinite animation / Flame game loop, real async image
  decode outside `tester.runAsync`), never "blocked".
- Pre-existing failures: prove on HEAD in a throwaway `git worktree` (never `git stash`);
  proven unrelated or "expected until later task N" failures don't fail the task.
- Commit trailer line (`Claude-Session: …`) if the harness provides one.

## Failure modes seen and the fix

| Symptom | Cause | Fix |
|---|---|---|
| Task 01 "blocked": `games:validate --strict` fails | check needs the app scaffold (later task) + unrelated pre-existing failure | fix root cause of pre-existing failure separately; move strict validation to scaffold task; add pre-existing rule |
| "agent stalled on all 6 attempts" | agent planning a huge file in one write / `find /` | ≤200-line writes, act early, no filesystem-wide search; restart from the task (tree was clean) |
| Implement "blocked": flutter test didn't finish | a hanging test (2% CPU for 10 min) | time the suite yourself; add hanging-test rule; resume with dirty paths |
| Tests all green, device frozen / black canvas | tests never drove real controller/timers; no device check | full-match controller tests + device verification in every client task |
| Verifier fails: acceptance says "committed" but fix agent forbidden to commit | instruction contradiction | orchestrator commits directly after checking results; align evidence paths |
| Evidence landed in docs-internal and .agents | task file path vs user rule | RULES override evidence path; dedupe before commit |
| Workflow paused by user (`/workflows`) | — | resume with `resumeFromRunId` and the same args |
| User visual feedback mid-run | automated verifier missed quality gap | `TaskStop`, write a spec task with measurable items + side-by-side verifier checklist, restart with dirty paths |

## Orchestrator duties during the run

- Don't poll; wait for notifications. On stop: read `journal.jsonl` results, `git log`,
  `git status`, then decide (fix directly if tiny, else a Sonnet agent) and restart.
- After each run: look at the committed device screenshots yourself and tell the user your
  honest assessment before declaring success.
- Keep the user informed in 2–4 lines when they check in.
