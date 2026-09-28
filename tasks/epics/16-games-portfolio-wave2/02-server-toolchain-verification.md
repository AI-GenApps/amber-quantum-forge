---
epic: 16-games-portfolio-wave2
task: 02-server-toolchain-verification
status: completed
commit_scope: games
depends_on: [16-games-portfolio-wave2/01-competitor-store-references]
estimate: S
owner: agent
---

# Verify the server toolchain and record the baseline

## Goal

Prove that every command later tasks rely on works on this device-less
server, and record a baseline (test counts, APK sizes, warnings), so a later
failure can be told apart from a pre-existing one.

## Context / Decisions

- The toolchain was installed under `/data/tools` on 2026-09-25: Bun 1.3.3,
  Flutter 3.47.3, JDK 17, Android SDK (platform 36, build-tools 36.0.0),
  and a Pillow venv. Use the environment block in `STATUS.md`.
- `bun run games:doctor` reports `NOT RUN` for `xcodebuild` (needs macOS)
  and for `adb` (no device). Both are expected and **not failures**.
- `bun run games:icons:check` needs root `node_modules` (`sharp`). Run
  `bun install` first if `node_modules/` is missing.
- Known pre-existing failure (seen on HEAD, 2026-09-25): `games:icons:check`
  reports `stale Android launcher label` for merge_relay. That manifest uses
  the `${mergeRelayAppLabel}` build placeholder, while
  `scripts/games/icons.ts` `updateAndroidLabel` only accepts a literal
  label. Record it as pre-existing; task 18 fixes it.
- If a build fails for an environmental reason (missing SDK package or
  licence), fix it **inside `/data/tools`** (e.g. `sdkmanager` installs)
  and document it. Never commit machine paths into app config.

## Implementation Checklist

- [x] Run each Verification Command with the STATUS.md environment and
      capture its output in
      `.agents/resources/2026-09-25/games-wave2-qa/02/baseline.md`
      (command → pass/fail → key lines → duration).
- [x] Build debug APKs for all five non-Ludo apps and record their sizes.
- [x] Record per-app `flutter test` counts (expected baseline from the audit:
      merge_relay 120, pocket_biome 8, sixty_second_heist 8, meme_court 5,
      snapquest 19).
- [x] If `games:icons:check` or any other command fails, find the root cause
      and record it with the output. Fix it only if the fix is
      environment-only (under `/data/tools`); otherwise record it as
      pre-existing, with proof from a throwaway worktree on HEAD.
- [x] Add a short "Server toolchain" section to
      `docs-internal/gaming/commands.md` describing the `/data/tools` layout
      and the environment block (generic, no secrets).

## Files Touched

- `.agents/resources/2026-09-25/games-wave2-qa/02/baseline.md`
- `docs-internal/gaming/commands.md`

## Acceptance Criteria

- `baseline.md` lists every verification command with an honest result.
- Five debug APKs were built, with paths and sizes recorded, or each failure
  is shown with its output and root cause.
- `git diff --stat` shows only the two files above.

## Verification Commands

- `ls node_modules | wc -l` (if it's 0: `bun install --frozen-lockfile --linker hoisted`)
- `bun --version` (expect 1.3.3)
- `bun run games:doctor`
- `bun run games:format:check`
- `bun run games:validate:strict`
- `bun run games:content:validate`
- `bun run games:icons:check`
- `bun run games:analyze -- --app merge_relay`
- `bun run games:test -- --app merge_relay`
- `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug`
  (repeat the build for pocket_biome, sixty_second_heist, meme_court, snapquest)
- `bun run check:doc-paths`

## Out of Scope

- App code changes. iOS builds (no macOS).

## Commit message

`chore(games): record server toolchain baseline for wave 2 [16-games-portfolio-wave2/02]`
