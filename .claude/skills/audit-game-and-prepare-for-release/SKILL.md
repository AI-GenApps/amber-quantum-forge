---
name: audit-game-and-prepare-for-release
description: Audit a mobile game in this monorepo (any engine — Flutter/Flame, Unity, etc.) and drive it to store-ready — competitor study on a physical device, product decisions, a tasks/ epic executed by sequential verified agents, visual overhaul against a reference game, brand name + logo + art/audio pipeline with dry runs and human approval gates, server-authoritative multiplayer, store listing assets, and Google Play / App Store submission. Use when asked to review why a game "isn't launch-ready", make a game publishable, clone the quality of a competitor game, plan/execute a game epic, or prepare a game for Play Store / App Store release.
---

# Audit a game and prepare it for release

This skill encodes the process that took a scaffolded, "nowhere near launch" Ludo game
(`apps-native/games/ludo`, epic `tasks/epics/15-ludo-launch`) to a branded, device-verified
game. Follow it for any game in this repo. Read the reference files when a phase says so —
they carry the detail, the gotchas, and the templates.

## Non-negotiable working style (defaults — confirm once at the start)

1. **Orchestrator mode.** You plan, decide, and review; Sonnet subagents do research,
   implementation, and verification summaries. Max **2 subagents at once**; wait for both
   before firing more. Only do work yourself when it is tiny or needs your own context
   (e.g. distilling decisions, committing a blocked task, reviewing screenshots).
2. **Workflows run ONE agent at a time** (no parallel agents inside a workflow), and
   **never start a workflow until the user confirms** the plan. Do all research and ask all
   clarifying questions *before* proposing the workflow.
3. **Evidence lives in `.agents/`.** Every screenshot, device capture, generated image,
   research note, and comparison goes under `.agents/resources/<YYYY-MM-DD>/<topic>/` with a
   `README.md` (what each file shows, how it was produced/reached, which decision it supports)
   and, for screenshot sets, a `manifest.json`. Commit it. Nothing lives only in `/tmp`.
4. **Physical-device QA.** Unit/golden tests are necessary but NOT sufficient — in the Ludo
   run every test passed while the device showed a frozen turn and a black half-screen.
   Every client task's verifier installs the build on the connected phone, drives it via
   adb, captures screenshots, *views them*, and compares against the competitor reference.
5. **Dry runs before spending on media.** In preparation phases that need a human decision
   (name, logo, art direction, store screenshots), produce a dry run first: prompt plan +
   cheap previews/mockups composited into real screen frames. Render finals only after the
   user approves. See `references/08-art-audio-pipeline.md`.
6. **Ask about branch strategy** at kickoff (the Ludo user chose "commit directly to main,
   never push"). Never push unless asked. One commit per task, repo commit format.
7. **Honesty over momentum.** Report failing commands with output, state what was NOT
   verified, and give your own candid visual judgment ("the lobby still looks generic")
   instead of relaying a verifier's pass.

## Phase map

| # | Phase | Output | Human gate? | Reference |
|---|---|---|---|---|
| 0 | Kickoff | working-style confirmation, device check | yes | this file |
| 1 | Audit (current state) | audit report: what exists, defects, why not launch-ready | — | `01-audit.md` |
| 2 | Competitor study | documented captures of the reference game + rules/scoring research | device access | `02-competitor-study.md` |
| 3 | Product decisions | engine, modes, rules, identity, platforms, monetization, art source | **yes** | `03-decision-bank.md` |
| 4 | Epic authoring + adversarial review | `tasks/epics/NN-<game>-launch/` task files | **yes (review)** | `04-epic-authoring.md` |
| 5 | Sequential execution | one commit per task, verified | confirm before run | `05-workflow-execution.md` |
| 6 | Device QA + visual overhaul | screen walk evidence, fix tasks | user feedback loop | `06-visual-qa.md` |
| 7 | Brand: name + logo | unique name, icon, wordmarks | **yes (each round)** | `07-brand-name-logo.md` |
| 8 | Art & audio pipeline | art sets integrated via manifest slots | **yes (each set)** | `08-art-audio-pipeline.md` |
| 9 | Backend / multiplayer | server-authoritative services, parity | provisioning | `09-backend-multiplayer.md` |
| 10 | Store listing + submission | listing copy, edited screenshots, forms, tracks | **yes** | `10-store-submission.md` |
| 11 | Economy + monetization | levels/XP, currencies, inventory/store, IAP (RevenueCat → Play Billing/StoreKit), rewarded ads, server ledger | **yes (scope + numbers)** | `11-economy-monetization.md` |

Phases 7–8 can start as soon as the local game is playable (they don't need the backend).
Recommended order: 0 → 1 → 2 → 3 → 4 → 5 (local-playable tasks) → 6 → 7 → 8 → human
checkpoint → 5 (backend tasks) → 9 → 11 → 10. Audit and decide the economy in Phases 1–3
(never let "no monetization in v1" silently drop it); build it after backend identity.

## Phase 0 — Kickoff checklist

- Confirm working style (above) and branch strategy.
- `adb devices -l` — record serial/model; ask the user to keep the phone connected, unlocked,
  and untouched while agents drive it. Any *other* session that wants the phone (e.g. a
  competitor-explorer session) must ask you first; you grant/withhold access and require a
  "phone free" message when done. Only one actor drives the phone at a time.
- Save memory notes for the user's decisions as they are made (engine, name, rules, visual bar).

## Phase 1 — Audit

Fire two Sonnet research agents in parallel (read-only):
1. **Game audit** — inventory, rules correctness, bot quality, multiplayer, rendering, audio,
   screens/onboarding, persistence, analytics, branding, tests, git history, task tracking.
2. **Infrastructure survey** — sibling games, shared packages, registry/CLI, backend
   patterns, CI, device tooling, the most polished game to use as template.
Prompts and the "launch-ready rubric" are in `references/01-audit.md`. Synthesize into a
short table for the user: *what's good, what's broken, top reasons it isn't launch-ready*.

## Phase 2 — Competitor study

Capture the reference game on the same device before designing anything, and research its
rules (scoring, modes, win conditions) from evidence + official sources. Protocol, capture
list, and doc format: `references/02-competitor-study.md`. Never invent rules the
competitor has — the Ludo run invented a "Quick mode" that contradicted the official one
and had to be re-done (task 12g).

## Phase 3 — Decisions

Use `AskUserQuestion` (max 4 per call, recommended option first) from the question bank in
`references/03-decision-bank.md`. Present a recommendation with a comparison table for
engine choice. Record every answer in memory.

## Phase 4 — Epic

A Sonnet agent writes the epic (template + rules in `references/04-epic-authoring.md`), then
a **second agent adversarially reviews it** (ordering, sizing, commands that don't exist,
fabricated precedent, unverifiable criteria, stuck/fake-success risks), then a third applies
the fixes. Order **local-playable first**, then a human device checkpoint, then backend.
Commit the epic before running the workflow (preflight requires a clean tree).

## Phase 5 — Execution

Use the sequential workflow in `references/assets/sequential-epic-workflow.js`
(implement → independent verify → ≤2 fixes → commit, one agent at a time, stop on
blocked/failed/human tasks). Read `references/05-workflow-execution.md` for the RULES block
and every failure mode seen so far (stalls, hanging tests, pre-existing failures,
dirty-tree resume, instruction contradictions) and how to recover.

## Phase 6 — Device QA and visual overhaul

After the local game is playable, capture a "before" set on device, compare against the
competitor, write targeted overhaul tasks, and make every verifier judge real device
screenshots against the reference. When the user gives visual feedback mid-run, pause the
workflow, turn the feedback into a concrete spec task (measured, checklist-able), and
resume. Details: `references/06-visual-qa.md`.

## Phases 7–10

- Name + logo: strict uniqueness check (the user rejects any name that already exists as
  an app/game anywhere), lookalike-trademark check (e.g. four-color swirls ≈ Chrome), dry
  run → approval rounds → integration. `references/07-brand-name-logo.md`.
- Art/audio: manifest slots with code-drawn fallbacks; art sets generated in rounds, shown
  as full-screen mockups, approved, then integrated with provenance. `references/08-art-audio-pipeline.md`.
- Backend: `references/09-backend-multiplayer.md`.
- Store submission (Play + App Store), including edited/captioned screenshots and every
  form: `references/10-store-submission.md`.
- Economy/monetization (levels, coins, diamonds, inventory, store, IAP via Play Billing +
  StoreKit — never Apple Pay for digital goods — rewarded ads, server-authoritative
  ledger): `references/11-economy-monetization.md`.

## Repo map

Commands, registry gotchas, and paths for this monorepo's games: `references/repo-map.md`.

## Definition of "launch-ready" (exit criteria)

All must be true, with evidence committed under `.agents/`:
- A full match in every mode reaches the results screen on a physical device (automated
  all-bots run + human play), and seeded full-match tests (≥50 games) pass in CI.
- Every screen reviewed on device against the competitor; no stock-framework styling, no
  empty/black/unfilled regions, no overflow, legible at the target resolution.
- Unique brand name, icon, wordmarks, art and audio integrated with provenance/licences.
- Onboarding + tutorial, settings (sound/music/vibration/reduced motion), how-to-play,
  results + rematch, save/resume.
- Online modes (if in scope) verified on two real devices.
- Economy (if in scope): server ledger with invariants, IAP sandbox purchase + restore
  verified on device, rewarded ad SSV grant, store/inventory/level-up screens reviewed.
- Crash reporting, analytics events, privacy policy, data-safety/nutrition labels, content
  rating, store listing with edited screenshots, release build signed, testing track live.
- The human checkpoint tasks are signed off by the user.
