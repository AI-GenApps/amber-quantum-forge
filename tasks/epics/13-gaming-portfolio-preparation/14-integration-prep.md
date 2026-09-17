---
epic: 13-gaming-portfolio-preparation
task: 14-integration-prep
status: completed
commit_scope: docs
depends_on: [06-records, 07-merge-relay, 08-pocket-biome, 09-sixty-second-heist, 10-meme-court, 11-snapquest, 12-api-isolation]
estimate: M
---

# Reconcile integration records and staging boundaries

## Context

The preparation branch has five independent Flutter clients, pure rules packages, an app-scoped API boundary, source-backed handoffs and current Android visual evidence. The integration lead still needs a factual handoff that separates bounded fixes from final physical QA, preserves the existing root products, and stages normal task commits without committing generated caches or claiming Play/MVP completion.

## Implementation Checklist

- [x] Reconcile the current Android-first sequence, historical iOS baseline and post-publication iOS QA pause.
- [x] Preserve all 79 requirement rows and identify remaining owners/tests for Play and full-MVP gates.
- [x] Record app-only visual evidence without personal, home-screen or raw-camera content; preserve the QA-accepted readable 1080×2400 smoke captures separately from historical pairs.
- [x] Record the Court/SnapQuest app-documents save migration and failure behavior.
- [x] Record the concise game-native copy criterion and one screenshot-linked before/after wording row for each app.
- [x] Publish a one-task-per-commit staging plan with lockfile, native asset and cache boundaries.
- [x] Complete final root/apps-freeze verification after the integration lead queues all remaining fixes and joins current artifact/device/source metadata to the accepted smoke captures.
- [x] Mark task 13 complete only after every app has post-fix Android before/after evidence, actual play, device/build metadata and recovery/error coverage.

## Verification

- `PATH=/tmp/luna-bun-1.3.3/bin:$PATH bun run check:doc-paths`
- `PATH=/tmp/luna-bun-1.3.3/bin:$PATH bun x mintlify validate` from `docs-internal/`
- Review [the integration staging plan](../../../docs-internal/gaming/integration-staging-plan) and [the visual review](../../../docs-internal/gaming/visual-review).

## Acceptance

This task is complete as a factual integration handoff: root and app changes are frozen for this evidence milestone, the final scoped checks pass, and Task 13's bounded physical visual milestone is complete. It does not authorize a commit, device action, Play submission, publication, or full-MVP claim. The next normal commit uses `docs(gaming): reconcile integration handoff [13-gaming-portfolio-preparation/14]` after parent review.
