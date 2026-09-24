# Phase 3 — Decision bank

Ask with `AskUserQuestion` (≤4 questions per call, 2–4 options each, recommended option
first labelled "(Recommended)"). If the user picks "clarify", ask what they want to clarify
and re-ask — don't guess. Record each answer in memory (`<game>-rebuild-decisions`).

## Engine (present a comparison table first)

For a board/casual game "like <competitor>", compare on: UI-heavy screens (lobby, shop,
profile) · 2D board/sprites/particles · true 3D needs · APK size (low-end Android markets) ·
online multiplayer (engine-independent; server decides) · reuse of repo tooling ·
agent-operability (plain code vs editor-bound scenes/prefabs, licence installs) · ads/IAP SDKs.
Ludo outcome: **Flutter + Flame** won (menus are most of the app, 2D board, ~15–20 MB vs
31.5 MB Unity APK, full reuse of registry/CLI/CI, agents can test/diff Dart). Unity only
wins for real 3D (tilted board, physics dice, camera moves). Port the old rules engine +
tests; keep old project frozen if the user wants.

## Scope / modes

- Which modes in v1? (vs bots with difficulty tiers · pass-and-play · online private rooms
  · online matchmaking with bot-fill · any competitor special modes)
- Rules source: "Match <competitor> <mode> (Recommended)" vs "keep ported rules" vs
  custom. Specify every mode precisely (see competitor study) before the epic is written.
- Points/scoring: only if the competitor has it or the user wants a separate mode.

## Identity & backend

- Sign-in: guest + optional Google link (Recommended) · guest only · required login.
- Realtime: Postgres-authoritative commands + Firestore fanout (Recommended in this repo)
  vs WebSockets vs Durable Objects vs hosted (see `09-backend-multiplayer.md`).

## Platforms & monetization

- Android first (Recommended) · both · iOS first.
- Monetization/economy: ask explicitly with the competitor's economy in view — full
  economy in v1 · progression only · free v1. Then IAP layer (RevenueCat recommended here),
  ads (rewarded only recommended), currencies. See `11-economy-monetization.md`. The Ludo
  user first chose "none", then reversed to "full economy in v1" — surface it early.

## Assets

- Art source: AI-generated + CC0 audio with human approval (Recommended) · user-provided ·
  code-drawn only. Visual bar: "match or beat <competitor>" (ask explicitly).
- Final art timing: a separate interactive art session with approval per set (Recommended).

## Repo process

- Branch strategy: feature branch vs directly on main; push policy.
- Old implementation: delete vs keep frozen; bundle id reuse (collision note).
- Where evidence goes (default `.agents/resources/<date>/<topic>/`).

## Brand (ask when the local game is playable, before logo work)

- The name must not already exist as any app/game (user rule). Offer only names that
  passed the strict existence check in `07-brand-name-logo.md`.

## Lessons

- Ask the engine question with a recommendation and trade-off table; the user may ask
  "which engine for exactly <competitor>?" — answer with evidence, then re-ask.
- Don't batch unrelated decisions the user can't answer yet (e.g. name before a playable build).
- When research contradicts an earlier decision (e.g. invented Quick mode), surface it
  with a concrete re-decision question and the cost of changing later (parity with server).
