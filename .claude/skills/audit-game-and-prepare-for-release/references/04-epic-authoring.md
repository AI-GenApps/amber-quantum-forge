# Phase 4 — Epic authoring

Epics live in `tasks/epics/NN-<slug>/` with `STATUS.md` and one file per task; the epic is
listed in `tasks/STATUS.md`. Read `tasks/START.md` and an existing epic (e.g.
`tasks/epics/15-ludo-launch/`) to match conventions exactly.

## Task file template

```markdown
---
epic: NN-<slug>
task: <id>-<name>
status: pending
commit_scope: <game>
depends_on: [NN-<slug>/<previous-task>]
estimate: S|M|L
owner: agent            # or: human (the workflow stops at human tasks)
---
# <Title>
## Goal
## Context / Decisions        (product decisions, references, why)
## Implementation Checklist   (- [ ] concrete, file-level steps)
## Files Touched
## Acceptance Criteria        (objective; tests, goldens, files, command output, device screenshots)
## Verification Commands      (exact commands that exist — verify each)
## Out of Scope
## Commit message             `<type>(<scope>): <summary> [NN-<slug>/<id>]`
```

## Ordering (local-playable first)

1. Registry/CI wiring → rules core → bots + replay fixtures.
2. Client scaffold → board/pieces → dice/effects → audio/haptics → onboarding → lobby →
   setup + game screen → results/settings → save/resume → local modes + quality
   (full-match tests, flow tests, goldens with real fonts, accessibility).
3. Gameplay bugfix + visual overhaul tasks (design system, board fidelity, HUD, menus,
   device visual QA) — add after the first device look.
4. **Human checkpoint** (owner: human): user plays on device and signs off.
5. Backend: auth fixes → contracts → schema → authority engine + parity → command
   service → timers → matchmaking/bot-fill → rooms → realtime fanout → identity.
6. Online client: gateway/auth → match source/reconnect → online lobby.
7. Release hardening → docs/release checklist → store submission → human release task.
Filenames sort in execution order; insert later tasks with suffixes (`12a`…`12g`, `12d2`).

## Sizing

One focused agent session per task. Split anything with >3 subsystems (e.g. "online client"
→ gateway / realtime source / lobby UI; "board rendering" → board+tokens / dice+effects).
Agents write ≤ ~200 lines per tool call; big tasks stall.

## Verification commands (this repo — check they exist before writing them)

- Client (after the app is scaffolded): `bun run games:format -- --check`,
  `bun run games:analyze -- --app <id>`, `bun run games:test -- --app <id>`,
  `bun run games:validate -- --strict`.
- Pure rules package BEFORE the app exists: `cd apps-native/games/packages/<id>_rules &&
  dart analyze && dart test` (`--app <id>` fails with "Game app is not scaffolded").
- Backend: `bun run check`, `bun run typecheck`, the packages/api test script.
- Device (client/visual tasks): `bun run games:build -- --app <id> --platform android
  --mode debug --environment debug`; `adb -s <serial> install -r
  apps-native/games/<id>/build/app/outputs/flutter-apk/app-debug.apk`; launch via monkey;
  navigate; `adb exec-out screencap -p`; verifier VIEWS screenshots vs the reference.

## Acceptance criteria rules

- Objective only; subjective look-and-feel goes to human checkpoint tasks — EXCEPT the
  device screenshot vs reference comparison, which the verifier must perform per item
  (e.g. "center has four colored triangles", "no empty bands", "tokens ~1 cell wide").
- Visual tasks require golden tests (with fonts loaded) so flat placeholder art can't pass.
- Full-match tests must drive the REAL controller/bot scheduler with a fake clock through
  ≥50 seeded games per mode/player-count and assert every game reaches results.
- Evidence path: `.agents/resources/<date>/<game>-visual-qa/<task-id>/`.
- Parity tasks: "never modify fixtures to make parity pass; stop as blocked instead."

## Adversarial review (always run before executing)

Second agent checks: ordering/dependency chain; oversized tasks; commands that don't exist
or fail pre-scaffold; fabricated precedent ("existing Vercel Cron conventions" that don't
exist); hard-coded registry counts / CI allowlists; wrong file paths/line refs; subjective
criteria; ways an unattended agent could fake success (edit fixtures, synthesize "CC0"
audio, skip goldens); missing quality bar items (crash reporting, privacy policy, perf/APK
budgets, accessibility). A third agent applies fixes and renumbers.

## Repo gotchas that break task 00 (registry)

`scripts/games/registry.ts` validateGameRegistry hard-codes the game count; CI case
allowlists in `.github/workflows/games-build.yml`, `games-android-release.yml`,
`games-ci.yml` (git diff path list); generator blocklist regex in `scripts/games/generate.ts`;
`GAME_APP_IDS` in `packages/api/src/games/contracts.ts`; pub workspace list in
`apps-native/games/pubspec.yaml`; run `bun run games:codegen` after registry edits.
