# Phase 1 — Audit

Goal: an honest, cited picture of where the game stands and *why* it isn't launch-ready,
plus what the repo already offers to reuse. Two read-only Sonnet agents in parallel.

## Agent A — game audit prompt (adapt `<game>`)

```
Read-only research in <repo>. Do NOT modify files. Produce a thorough audit of the
"<game>" implementation so we can plan making it launch-ready (great graphics, sound,
multiplayer, menus, onboarding).
1. Locate every piece of <game> code (grep -ril "<game>" excluding node_modules, .git,
   build dirs, Pods, .dart_tool, Library). Identify stack/engine and location.
2. Report: file tree with purpose + LOC; game logic vs the standard rules of the genre
   (list rule bugs/missing rules, house-rule variants); AI/bots (strategy quality);
   multiplayer (local / online / backend routes / schema / realtime — exists vs stubbed);
   rendering (how drawn, assets present, animation); sound/haptics (real assets or
   synthesized?); screens (menu, settings, onboarding, tutorial, results, pause);
   persistence, analytics, monetization, branding (name, icon, splash); tests.
3. Read tasks/STATUS.md, tasks/START.md and any tasks/ or docs-internal/ files mentioning
   <game>: planned vs done, known issues, handoff notes. Also .agents/tasks/** plans.
4. git log for <game>-related commits.
Return markdown: stack & location, inventory, what works, concrete defects (file:line),
top reasons it is not launch-ready.
```

## Agent B — infrastructure survey prompt

```
Read-only. Ignore <game>-specific code. Survey reusable infrastructure for making a game
launch-ready: all game apps (path, engine, maturity; which is most polished = template);
shared packages (audio, haptics, onboarding, telemetry, save, leaderboards, PGS/GameKit,
realtime, billing/ads); backend routes + db schema patterns for games; build/release
setup (registry, bundle ids, CI workflows, store listing per game); task system protocol
and current state; QA tooling (tests, parity, device runners); recent git history.
Return a concise markdown report with paths.
```

## Launch-ready rubric (score each 0–3 in the synthesis)

| Area | 3 = launch-ready |
|---|---|
| Core rules | Correct vs genre standard / competitor; every mode fully specified; seeded full-match tests |
| Bots | Tiered difficulty with real strategy; never stalls a turn |
| Game feel | Animations (move, roll, capture, win), haptics, SFX + music, reduced motion |
| Visuals | Matches or beats the competitor on device; no framework-default styling |
| Flow | Splash, onboarding, tutorial, lobby, setup, game, pause, results/rematch, settings, how-to-play, resume |
| Multiplayer | Local + online modes in scope work on real devices; server authoritative |
| Brand | Unique name, icon, wordmark, store art |
| Economy | Levels/XP, currencies, inventory/store, IAP + ads decided and (if in scope) server-authoritative |
| Ops | Crash reporting, analytics, privacy policy, data safety, release signing, CI |
| Tracking | Work lives in a tasks/ epic with statuses and evidence |

## Common findings (seen in the Ludo run — check for them explicitly)

- Work tracked outside `tasks/` (e.g. only in `.agents/tasks/...`) → no gating, "acceptance pending" forever.
- Editor-script-generated / programmer art; synthesized sine-wave "SFX"; one generic vibration.
- Bot = "first legal move" placeholder.
- Online multiplayer designed in docs but 0% built; client engine treated as authority.
- Identity bugs in shared auth (e.g. refresh token signing `sub` from email instead of UID).
- No icon/splash; stock template assets still present.
- Engine mismatch with the rest of the repo → none of the shared tooling applies
  (drives the engine decision in Phase 3).

## Synthesis for the user

One table (area / state / evidence), then "what went wrong" bullets, then a recommendation
(engine, approach) — and only then the decision questions. Keep it skimmable.
