# Epic 15 — Ludo Launch (Flutter + Flame)

Status: pending

## Purpose

Build a Ludo King–style Ludo game as the sixth Flutter client in the
`apps-native/games` workspace, registry id `ludo`, bundle
`app.w3dev.ludo` / `.debug`. This supersedes the earlier, separate Unity 3D
effort at `apps-native/unity/ludo/`, which stays frozen and untouched by this
epic except for a superseding note added to its own docs. Scope: pure Dart
rules package, a code-drawn/animated Flutter+Flame client with local modes
first, server-authoritative online play (Hono/Postgres/Firestore),
audio/haptics, the full Ludo King–inspired screen set (without
ads/monetization), telemetry, release hardening, docs, and two human-gated
checkpoints (a local-play checkpoint partway through, and a final
acceptance/provisioning checklist).

## Execution order

Filename order is execution order. The unattended workflow implements and
verifies each task in strict numeric sequence (00, 01, 02, ...), committing
after each one passes verification, up to 2 fix attempts per task before
escalating. Each task depends on the immediately preceding task unless its
frontmatter lists additional dependencies (task 00 also depends on epic
13's registry/tooling tasks, already completed; task 24 depends on both
task 13 and task 23, since it needs the client's local-checkpoint sign-off
and the backend's identity work).

The client (tasks 03-13) and backend (tasks 14-23) are two independently
buildable halves that happen to run in this fixed order — no client task
(03-12) depends on any backend task, and no backend task depends on any
client task. Online integration (tasks 24-26) is the first work that needs
both halves finished, which is why it comes after both.

**The workflow stops at every `owner: human` task (13 and 29) and does not
resume automatically.** A human must execute that task's checklist,
record results, and mark it complete before the workflow proceeds to the
next task.

## Ownership

| Task | Owner | Scope | Status |
|---|---|---|---|
| 00 | Registry/tooling owner | Registry, CI allowlists, workspace wiring, Unity superseded note | [x] |
| 01 | Domain owner | `ludo_rules` core engine (board, movement, turns, dice, capture, Classic/Quick config) | [x] |
| 02 | Domain owner | `ludo_rules` bot strategies and cross-runtime replay fixtures | [x] |
| 03 | Client owner | Flutter app scaffold, asset manifest slots, `lib/src/{screens,state,game,assets}` convention | [ ] |
| 04 | Client/art owner | Board, track, safe stars, glossy tokens, hop animation, legal-move/turn highlight | [ ] |
| 05 | Client/art owner | Animated dice tumble, capture particles, home-arrival burst, win confetti, reduced motion | [ ] |
| 06 | Client/audio owner | Audio service, CC0 SFX/music, haptics, sound settings | [ ] |
| 07 | Client/UX owner | Splash, welcome, name+avatar picker (8+ avatars), interactive tutorial | [ ] |
| 08 | Client/UX owner | Home lobby (Computer/Pass N Play/Friends/Online tiles, online disabled) | [ ] |
| 09 | Client/UX owner | Mode/setup sheet, game board screen chrome, pause/quit dialog | [ ] |
| 10 | Client/UX owner | Results/rematch, settings, how-to-play, reduced motion | [ ] |
| 11 | Client owner | Durable local match persistence and resume after restart | [ ] |
| 12 | Client owner | Local (vs Computer / Pass N Play) wiring, LOCAL telemetry, full quality pass (goldens, a11y, flow test) | [ ] |
| 13 | Release owner (human) | Local-play checkpoint: build, install, play, visual review, sign-off | [ ] |
| 14 | Auth owner | Fix API JWT refresh identity bug + tests | [ ] |
| 15 | Backend owner | Ludo HTTP contracts, wire codecs, validation, game token issuance | [ ] |
| 16 | Database owner | Ludo Drizzle schema (including `match_origin`, rooms), migration, memory/Drizzle store interface | [ ] |
| 17 | Backend owner | TS authority match engine port + Dart/TS parity mechanism | [ ] |
| 18 | Backend owner | Transactional command service, match create/join/command routes | [ ] |
| 19 | Backend owner | Turn timeout enforcement, claim-timeout endpoint, Vercel Cron sweeper | [ ] |
| 20 | Backend owner | Random matchmaking with bot-fill | [ ] |
| 21 | Backend owner | Private rooms with shareable invite codes | [ ] |
| 22 | Backend owner | Realtime fanout (`MatchViewPublisher`, Firestore adapter, polling fallback) | [ ] |
| 23 | Backend/auth owner | Guest-first + Google-linked identity exchange for Ludo | [ ] |
| 24 | Client owner | Guarded Firebase init, typed gateway client, guest/Google auth controller | [ ] |
| 25 | Client owner | Firestore match listener, polling fallback, reconnect, online board wiring | [ ] |
| 26 | Client owner | Rooms/matchmaking UI, enable online lobby tiles, ONLINE telemetry | [ ] |
| 27 | Release owner | Crash reporting, perf/size budgets, privacy policy + data safety + store listing drafts | [ ] |
| 28 | Docs owner | Architecture doc, handoff, release checklist | [ ] |
| 29 | Release owner (human) | Physical-device acceptance, Firebase console provisioning, privacy/data-safety/store-listing execution | [ ] |

## Frozen layout (target)

```text
apps-native/games/
  ludo/
    lib/
      main.dart
      src/
        app.dart
        screens/
        state/
        game/
        widgets/
        audio/
        net/
        telemetry/
        assets/
    assets/
    content/
    ios/
    android/
    test/
      goldens/
  packages/
    ludo_rules/
packages/api/src/games/ludo/
packages/db/src/schema.ts (ludo_* tables)
docs-internal/gaming/ludo-flutter-plan.md
docs-internal/gaming/handoffs/ludo.md
docs-internal/gaming/ludo-privacy-policy.md
docs-internal/gaming/ludo-data-safety.md
docs-internal/gaming/ludo-store-listing.md
```

## Notes

The existing `docs-internal/gaming/ludo-implementation-plan.md` and
`docs-internal/gaming/ludo-mobile-ui-plan.md` describe the earlier Unity 3D
direction (including blockades, which this epic explicitly excludes). Those
documents and the Unity project remain as historical record; task 00 adds a
superseding pointer, it does not delete or rewrite them.

No task before task 13 runs an emulator/simulator or performs real Firebase
console provisioning. Task 13 is a human-only local-play checkpoint (device
build/install/play/visual review) gating the backend half of the epic; the
workflow stops there until a human signs off. Task 29 is the final
human-only acceptance and provisioning checklist (real Firebase project,
physical two-device online verification, privacy policy hosting, Play Data
Safety form, store listing assets) and does not grant store publication.

See `docs-internal/gaming/ludo-flutter-plan.md` (architecture) and
`docs-internal/gaming/handoffs/ludo.md` (ownership/requirement ledger, both
written by task 28) for details once those exist.
