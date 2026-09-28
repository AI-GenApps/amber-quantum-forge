# Merge Relay — decisions log

Decisions below are the six wave-2 decisions recorded in
`tasks/epics/16-games-portfolio-wave2/STATUS.md` ("Decisions (user, 2026-09-25)"),
applied to Merge Relay specifically.

| Date | Decision | Rationale / notes |
|---|---|---|
| 2026-09-25 | Merge Relay visual target: **Threes!** (character tiles, warm hand-made palette, real soundtrack); original art only | Portfolio audit found Merge Relay's current look "plain Material... looks like a utility app, not a game"; Threes! is the genre's acknowledged visual/feel benchmark. Source: `.agents/resources/2026-09-25/games-portfolio-audit/README.md`, `.agents/resources/2026-09-25/games-competitor-references/README.md` |
| 2026-09-25 | Merge Relay v1 monetization: **None** (no ads, no IAP) | Ship a clean solo experience first; commerce/relay backend work (MR-04–MR-13) was oversized for a v1 and is deferred to v1.1. See `economy.md` |
| 2026-09-25 | Merge Relay name: the workflow proposes candidates that pass the strict uniqueness check (task 14); **the user picks** at task 17 | "Merge Relay" describes mechanics, not a feeling, and is weak on a store shelf (portfolio audit verdict) |
| 2026-09-25 | Rescue content: **60 boards, 6 chapters**, every board solver-validated | Expands from the current 5 authored boards (`apps-native/games/merge_relay/content/rescue_boards.json`) to a real campaign (task 06) |
| 2026-09-25 | Branch: everything on `main`, one commit per task, never push | Matches the epic's execution protocol (`tasks/epics/16-games-portfolio-wave2/STATUS.md`, "Execution order") |
| 2026-09-25 | Fonts: every game uses bundled custom fonts; Merge Relay uses **Fredoka** (display) / **Nunito Sans** (body) | Rounded, friendly numerals for tiles, echoing Threes!-like warmth. Source: `github.com/google/fonts/tree/main/ofl/fredoka`, `.../nunito-sans` (verified to exist 2026-09-25) |

## Scope-gate decision (this task)

| Date | Decision | Rationale / notes |
|---|---|---|
| 2026-09-25 | Friend relays, PGS, and every network path gated off for v1 (kept in code for v1.1); a dated decision section was added to `docs-internal/gaming/handoffs/merge-relay.md` recording which requirement-ledger rows (MR-04–MR-08, MR-11, MR-13, PGS) are deferred | Per `apps-native/games/AGENTS.md`'s rule: refresh provenance and the affected handoff before changing a source-indexed requirement |
| 2026-09-25 | Gate implemented as a single compile-time constant, `mergeRelaySocialEnabled` in `apps-native/games/merge_relay/lib/src/merge_relay_features.dart`, wrapped in an injectable `MergeRelayFeatures` object | Lets `main.dart` and every widget/action check one flag, while relay/PGS tests force it on through the seam instead of deleting coverage (task 05) |
| 2026-09-25 | Android deep-link intent filters (`mergerelay://challenge…` and the https challenge path) are **kept**, not removed, for v1 | `games:validate:strict` (`scripts/games/cli-commands.ts`) only checks the game registry/content/scaffold, not manifest contents, so nothing requires their removal; keeping them means v1.1 (relay re-enabled) needs no manifest migration. While gated, an incoming link is never read by the Dart layer — the app just opens to Home |
| 2026-09-27 | Public name: **Glow Rescue** (task 17; rank 1 of the strictly checked shortlist in `.agents/resources/2026-09-25/merge-relay-brand/`). Internal id `merge_relay` and bundle ids unchanged. | user |
| 2026-09-27 | Logo: **icon A** (hero glow tile) + **wordmark B** (gradient with spark); art set: **direction B** (glossy 3D-toy), keeping a clear numeral zone (task 21). | user |

## Release-readiness decisions (task 24)

| Date | Decision | Rationale / notes |
|---|---|---|
| 2026-09-28 | Keep the `INTERNET` permission in `AndroidManifest.xml` for v1 | It's a normal (non-dangerous) permission, granted with no runtime prompt; no network call is ever made while `mergeRelaySocialEnabled` is `false` (`merge_relay_client.dart:56` returns `null` before constructing any HTTP client); removing and re-adding it for v1.1 would be pure churn. Matches the 2026-09-25 decision to keep the relay deep-link intent filters for the same reason. See `store-listing.md` § Permissions |
| 2026-09-28 | Crash reporting ships as `MergeRelayCrashReporter` (interface) + `NoOpCrashReporter` (the only implementation wired into v1); no crash SDK is bundled | No SDK needs build-time credentials to compile; the vendor choice (Crashlytics vs Sentry) stays an explicit open human decision (`open-questions.md` #2) instead of being made by default via whichever SDK happened to be added first |
| 2026-09-28 | Privacy policy lives at `docs-public/legal/glow-rescue-privacy-policy.md`, under a new "Legal" tab in `docs-public/docs.json` | Follows the existing docs-public Mintlify structure (tabs organized by audience/context); no other public docs page existed for a game-specific policy |
| 2026-09-28 | Store screenshots and feature graphic are Pillow composites of the final screen goldens and final integrated art (tasks 22/23) — no new image-gen renders | The task's own instruction ("made from the final goldens with Pillow captions"); avoids spending an image-gen budget on marketing crops when the final art already exists |
