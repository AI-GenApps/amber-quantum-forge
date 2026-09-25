---
epic: 16-games-portfolio-wave2
task: 24-mr-release-readiness
status: pending
commit_scope: merge-relay
depends_on: [16-games-portfolio-wave2/23-mr-art-final-and-integrate]
estimate: M
owner: agent
---

# Merge Relay: release readiness package (no console access)

## Goal

Prepare everything for a Google Play submission that doesn't need
credentials: the privacy policy page, a data-safety and content-rating
answer bank, listing copy, captioned store screenshots, a feature graphic,
a signing guide, and a crash-reporting integration that is disabled until
it is configured.

## Context / Decisions

- Skill reference: `references/10-store-submission.md` (read it fully).
  Google Play first. No monetization, so declare no ads and no in-app
  purchases.
- The v1 build is offline (task 05): no account, no network calls, and
  local save only. The data-safety answers must match the code. Verify
  them by grepping for network, analytics, and telemetry sinks, and
  document the evidence. If `platform_core` telemetry sends anything
  off-device, record it truthfully.
- Privacy policy: a public page in `docs-public/` (the Mintlify structure
  the repo uses; `bun run check:staged-docs` validates it). Its hosting URL
  is an open question for the human.
- Crash reporting: add an interface plus a no-op default. Record the vendor
  choice (e.g. Firebase Crashlytics vs Sentry) as a human decision in
  `open-questions.md`, and **do not add an SDK that requires credentials to
  build**.
- Store screenshots: 6 at 1080×2400, made from the final goldens with Pillow
  captions (the Fredoka font, the brand palette): the hero board, a merge
  moment, the chapter map, Daily, Endless best, and the result. Plus a
  feature graphic at 1024×500 from the wide logo and the home scene.
- Signing: a guide for creating the upload keystore and configuring
  `key.properties` **outside git**. Never generate or commit a real key.

## Implementation Checklist

- [ ] Fill in `.agents/games/merge-relay/store-listing.md` completely:
      title, short and full description, category, tags, content-rating
      questionnaire answers, data safety, ads/IAP = none, permissions
      rationale (`INTERNET`, if it stays, for a disabled future feature,
      otherwise remove it), support contact = TBD (human).
- [ ] Add the `docs-public` privacy policy page and navigation entry.
- [ ] Add a crash-reporting interface and no-op implementation, with a
      test.
- [ ] Make the store screenshots and feature graphic in
      `.agents/resources/2026-09-25/merge-relay-store/`, then VIEW them.
- [ ] Write the signing guide in `docs-internal/gaming/` (a Merge Relay
      release section).
- [ ] Add a release checklist that marks each item done / human /
      credentials.

## Files Touched

- `.agents/games/merge-relay/{store-listing,open-questions}.md`
- `.agents/resources/2026-09-25/merge-relay-store/**`
- `docs-public/**` (privacy policy page and navigation)
- `docs-internal/gaming/merge-relay-release-plan.md` (v1 solo release section)
- `apps-native/games/merge_relay/lib/src/crash/**`, `test/**`

## Acceptance Criteria

- Every data-safety answer cites code evidence (file:line).
- There are 6 screenshots at 1080×2400, plus a feature graphic at 1024×500;
  the verifier views them.
- `bun run check:staged-docs` passes with the privacy page staged.
- No secrets and no keystore files are in the diff.

## Verification Commands

- `bun run check:doc-paths`
- `git add -N docs-public && bun run check:staged-docs`
- `bun run games:format:check`
- `bun run games:analyze -- --app merge_relay`
- `bun run games:test -- --app merge_relay`
- `bun run check`

## Out of Scope

- Play Console actions, uploading, and account creation (human, task 25).

## Commit message

`docs(merge-relay): add store listing, privacy policy, screenshots, and signing guide [16-games-portfolio-wave2/24]`
