# Ludo Unity implementation handoff

## Purpose

Use this file as the execution prompt for the next implementation session. Build the
first Unity full-3D URP Ludo client and its shared Next/Hono backend for `app.w3dev.ludo`.
This handoff itself performs no gameplay or backend implementation.

The latest user instruction explicitly selects this task and supersedes the normal
automatic first-unchecked-epic picker. Read `tasks/START.md`, but do not start Epic 14
Merge Relay, change task gates, or rewrite unrelated dirty work. Preserve all existing
uncommitted work in the checkout. Do not reset, clean, or stage unrelated files while
creating this handoff. The implementation session follows active user and repository
commit rules; any commit must contain only scoped Ludo work.

## Read before changing anything

- Root `AGENTS.md`, `tasks/START.md`, `tasks/STATUS.md`, and the current epic status.
- `docs-internal/gaming/ludo-implementation-plan.md` as the product and architecture
  source of truth.
- Existing API, DB, auth, workflow, and test conventions under `packages/api`,
  `packages/db`, `apps/web`, and `.github/workflows`.
- The worktree status and diff. Never discard or format unrelated changes.

## Fixed product and architecture decisions

- Stable game identity is `ludo`; production app id is `app.w3dev.ludo` and the
  development id is `app.w3dev.ludo.debug`. Use the plan's namespaces and IDs.
- The client is a Unity 6.6 full-3D URP project under `apps-native/unity/ludo`. Use the
  already available Unity 6.6 installation only, pin and record verified patch
  `6000.6.2f1`, and never install Unity 6.3 LTS or another editor. Minimize disk use.
- The current QA slice is Android on the connected physical device. Do not use an
  emulator or simulator. This Android-first local slice does not change the public
  release order: iOS is the first publication target and Android follows later.
- The current user-directed milestone is a reference-first basic mobile flow before
  backend expansion: welcome, objective tutorial, local home, Classic setup, and a
  readable board. Keep Unity 3D, but use a shallow top-down orthographic view; the
  evidence-linked UI and tutorial annex is
  [ludo-mobile-ui-plan.md](../../../../docs-internal/gaming/ludo-mobile-ui-plan.md).
- The web stack remains the common Next.js app with Hono API on Vercel, PostgreSQL,
  and the existing repository package conventions. Do not introduce Nakama or Unity
  Authentication as an authority.
- The server is authoritative for rules, state, turn ownership, dice outcomes,
  persistence, idempotency, and recovery. The Unity client's 3D dice throw and token
  animation are cosmetic presentations of the server result.
- Keep a pure C# rules engine and a TypeScript authority engine in lockstep. Freeze
  `ludo_v1.json`, board coordinates, safe squares, captures, home rules, turn rules,
  dice rules, replay/event schema, and deterministic vectors before feature expansion.
- Use Firebase UID as the immutable auth subject (`sub` and `uid`) across token
  exchange and refresh. Never derive identity from email. Fix the known refresh path
  that currently uses email. Handle missing email safely for guests and providers that
  do not expose email; reject malformed linkage and identity collisions, not the absence
  of email itself. Add exchange-refresh continuity and account-identity freeze tests,
  including UID stability after email changes, plus guest/link/recovery tests.
- Game tokens must be scoped to Ludo and the existing issuer/audience conventions.
  Guest play must have an explicit recovery/link path; provider display names or email
  must never silently become identity keys.
- REST commands and polling are the baseline transport. WebSocket is a notification
  and low-latency adapter with reconnect cursors and polling fallback; it cannot be the
  only recovery path. Use an external subscription-capable pub/sub service where the
  selected Vercel adapter requires it.
- Commands, events, outbox rows, and turn timers must be transactional and durable.
  Use a real scheduler/worker for deadlines and repair; a Vercel Cron repair sweep is
  only a safety net. No process-memory timer or in-memory authoritative state.
- GameKit and Google Play Games Services v2 are optional provider adapters with an
  internal identity boundary. Base play and recovery must remain testable when either
  provider is unavailable. Achievements and leaderboards accept only finalized server
  results and use idempotent outbox delivery with retry and offline recovery. External
  provider, signing, and store-console work is a separate gate and must not be
  represented as complete without evidence.

## Known repository state and pending setup evidence

The audit found no Unity project, C# sources, Unity scenes, `.meta` files, Ludo API
routes, Ludo migrations, Ludo workflow, WebSocket adapter, Redis/pub-sub dependency,
or durable scheduler in the checkout. These are implementation work, not external
prerequisite failures. Existing game CI is Flutter-only and does not cover Unity.

The existing API and DB typechecks and the selected auth, game-isolation, storage, and
Merge Relay tests pass. The auth refresh subject bug and missing Ludo contracts remain
unresolved. Do not claim backend readiness from those baseline tests.

The read-only machine check confirmed the sole installed arm64 Unity 6.6 editor at
`/Applications/Unity/Hub/Editor/6000.6.2f1/Unity.app/`, whose executable reports
`6000.6.2f1`. Hub CLI `1.0.0-beta.8` is available via
`/Applications/Unity Hub.app/Contents/Resources/cli/unity`; the `unity` command is not
on this shell's PATH, and the new session must recheck its guaranteed PATH setup.
`unity editors verify 6000.6.2f1` passed, `unity doctor --ci` passed with only the
binary-on-PATH warning, and a headless `Unity -batchmode -nographics -quit -version`
smoke check reported `6000.6.2f1`.
Android support and its toolchain are installed: embedded OpenJDK `17.0.18`, NDK
`27.2.12479018`, SDK command tools `16.0`, SDK build-tools/platform-tools `36.0.0`,
CMake `3.22.1`, and SDK platforms `android-34`, `android-36`, and `android-37.0`.
The assigned Unity license is active. No Unity project exists yet, so no project import,
build, install, or launch has been tested. `adb devices -l` currently reports no device;
the user guarantees a physical Android device and PATH setup in the new session. iOS
modules, signing, and device validation remain later release gates.

The local skills `.agents/skills/unity-cli`, `.agents/skills/unity-package-management`,
and `.agents/skills/urp-postprocessing` are present and were read. Their generic
bootstrap guidance may default to latest/LTS or install an editor; this task overrides
that guidance: pin `6000.6.2f1`, never use generic latest/LTS, `--allow-install`, or a
different-editor download. Use the package Client API rather than hand-editing
`Packages/manifest.json`. Package additions within this approved Ludo scope may proceed
without a separate permission request for each package; do not change editor versions.

The machine has Bun `1.4.2` while the repository declares `bun@1.3.3`. Use the existing
repository-compatible Bun command path and do not install a second global toolchain or
silently rewrite the repository pin; investigate the discrepancy only if a real check
requires it.

Keep these implementation prerequisites explicitly pending until the new session
records evidence:

- Physical Android device model/OS, USB/debug authorization, and install/launch path.
- iOS modules/signing/device validation are later and do not block the Android slice;
  do not install redundant SDKs or global toolchains.
- URP, GameKit, PGS v2, transport, pub/sub, scheduler, and provider-console choices.
  Blender is optional and must not become a setup gate.
- Any mobile/device/backend/release skill selected later; do not invent unavailable
  skills.

## Execution phases and gates

### Phase 0: setup and contract freeze

1. Verify the pending setup evidence above without installing another Unity version or
   changing global toolchains. Record the exact verified 6.6 patch and modules.
2. Freeze the rules, board coordinates, state/event schema, transport envelope, auth
   subject contract, recovery model, privacy boundary, and visual acceptance checklist
   in the plan-owned source paths. Resolve open provider, pub/sub, and scheduler choices
   before wiring gameplay.
3. Establish a clean, scoped list of new files. Do not modify root task status files or
   the existing Merge Relay implementation. Track Ludo progress in this plan's phases
   or Ludo-owned checklists only.

### Phase 1: Android visual slice first

1. Create the Unity 6.6 URP project under `apps-native/unity/ludo` with source-controlled
   `Assets`, `Packages`, `ProjectSettings`, scenes, prefabs, and `.meta` files. Add
   source rules for generated Unity and build output; preserve source assets. Use the
   verified URP template `com.unity.template.urp-blank-17.2.1`.
2. After project creation, read the installed CLI's `unity pipeline install --help` and
   use its documented flags to install/verify `com.unity.pipeline` for this project.
   Start the pinned editor, verify `unity status`, and discover the command catalog. If
   the bundled `unity-pipeline` skill is needed, mirror it with the documented CLI
   command. A connected Pipeline is not expected before this project exists.
3. Before editing scenes, prefabs, or assets, run `unity status`. If a live Editor is
   reachable, use the CLI's discovered commands and do not hand-edit Unity YAML. If no
   live Editor is reachable, state that fact before using a direct source workflow.
4. Implement the reference-first local mobile route on the physical Android device:
   welcome, objective tutorial with Next/Skip, clean local home, Classic mode,
   original token/color and two/four-player setup, and Play into the board. Keep Unity
   3D with a shallow top-down orthographic board that fits portrait safe margins,
   keeps tokens and labels readable without overlap, uses touch-sized controls, and
   removes debug copy. Record reference ad/upgrade states only; do not add live
   monetization or make undo a required mechanic. Add the board's lighting, materials,
   legal-move highlights, capture feedback, turn presentation, audio/haptic hooks,
   reduced-motion option, and touch input after the flow is legible.
5. If post-processing is used, run the URP skill preflight for the active pipeline,
   HDR, camera, volume mask, profile, and overrides; keep mobile effects lightweight.
6. Inject a deterministic simulated authority response. Animate a 3D die to the
   server-provided face, then move the token and show capture/turn results. The visible
   die must never generate or override the authoritative outcome.
7. Produce device evidence with editor patch, app id, build artifact, fixture/vector,
   install/launch result, and observed acceptance behavior. This is a visual-slice
   gate, not a release or backend-readiness claim. Use the annex's provisional matrix;
   do not infer move, capture, win, or tutorial behavior from reference frames alone.

The basic mobile visual/tutorial gate precedes the shared rules, backend, transport,
provider, and scheduler phases below. A passing visual screenshot does not authorize
or prove those later phases.

### Phase 2: rules and parity

1. Keep rules in a testable C# assembly with legal move generation, turn transitions,
   captures, safe/home rules, replay, injected dice, serialization, and tamper checks.
2. Implement the matching TypeScript authority engine and shared `ludo_v1.json` vectors.
   Run positive, negative, duplicate-command, stale-version, and replay parity tests in
   both runtimes. No client-only rule may decide a committed match result.

### Phase 3: authoritative backend

1. Add Ludo contracts/routes under `packages/api/src/games/ludo` and register them in
   `packages/api/src/index.ts`. Add `ludo` to `packages/api/src/games/contracts.ts`
   `GAME_APP_IDS` and its token validation. Keep `scripts/games/registry.ts`'s five
   Flutter-game count unchanged; use a separate Unity `ludo.config` validator. HTTP
   requests continue through the existing Next
   adapter at `apps/web/app/api/[...route]/route.ts`; follow current auth, error,
   validation, and test conventions. Add only the dedicated WebSocket route at
   `apps/web/app/api/games/ludo/[environment]/realtime/route.ts`; do not create or call
   a dedicated Ludo HTTP path catch-all.
2. Add normalized PostgreSQL migrations for games, players, state/version, commands,
   events, outbox, recovery/link records, and durable turn deadlines. Use transactions,
   row locks or equivalent version checks, idempotency keys, and append-only events.
3. Generate dice with a server CSPRNG, persist the outcome and event atomically, and
   publish only after commit. Add REST polling and cursor-based recovery before any WS
   optimization. Add load/concurrency tests for duplicate and racing commands.
4. Implement the Firebase UID auth fix, scoped game tokens, guest recovery/link flow,
   safe no-email provider handling, and explicit malformed-linkage/collision behavior.
   Keep secrets in environment configuration; never print values, tokens, or Vercel
   identifiers.

### Phase 4: transport, providers, and recovery

1. Add the selected Vercel-compatible WS notification adapter, external pub/sub, and
   durable scheduler behind narrow interfaces. Verify reconnect, missed-event replay,
   polling fallback, timer expiry, repair, and restart behavior.
2. Add GameKit and PGS v2 adapters only at the provider boundary, with fakes for tests.
   Verify guest-to-provider linking, account recovery, privacy, and provider outage
   behavior without making either provider required for base play. Queue achievement
   and leaderboard submissions only for finalized results; make retry, offline replay,
   deduplication, and permanent failure observable.

### Phase 5: iOS-first publication readiness

After the shared client/backend gates pass, a later release session validates the same
build on two physical iPhones, including GameKit behavior, recovery, accessibility,
performance, and signed export/TestFlight inputs. This iOS gate is not part of the
current Android-only session. Public iOS publication remains first. Signing, Apple
console, and store submission are separate externally authorized gates.

### Phase 6: Android parity and later release

Validate PGS v2 and cross-platform matches on two physical Android devices, then prepare
Android signing/AAB and Play closed testing only after the iOS-first gate is evidenced.
Do not call Android publication complete from the local visual slice.

## Validation and reporting

- Use Bun for TypeScript/JavaScript checks. Run targeted tests while the worktree is
  dirty, then the relevant typecheck and lint/test commands without implicit writes.
- Use Unity CLI/batchmode for project import, serialization, edit-mode/play-mode tests,
  and the Android build. Do not edit generated Xcode projects directly; use the repo's
  declared source workflow and regenerate when that workflow is in scope.
- Preserve the setup evidence with `unity editors verify 6000.6.2f1`,
  `unity doctor --ci`, and the headless editor version smoke check before relying on
  the editor. Treat the current PATH warning and absent device as setup state, not as
  successful on-device validation.
- Keep each new source file at or below 300 lines, follow named-import and strict-type
  rules, and preserve the repository's existing conventions.
- Check Git LFS/attributes and ignore rules for large binary assets and Unity generated
  directories before adding assets. Do not add generated Library, Temp, Logs, or local
  settings to source control.
- Before any release claim, report exact files, commands, editor patch, build artifact,
  device, fixture/vector, test results, and observed evidence. Explicitly label pending
  provider consoles, signing, cloud configuration, migrations, and deployment gates.
- Leave unrelated worktree changes, current task gates, and the existing Ludo plan
  history intact. This prompt authorizes implementation in the new session, not a
  commit or publication.
