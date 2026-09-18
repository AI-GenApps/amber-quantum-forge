---
epic: 14-merge-relay-implementation
task: 11-maintenance-ci
status: completed
commit_scope: gaming-ci
depends_on: [14-merge-relay-implementation/10-backend-corrective-foundation]
estimate: M
---

# Maintain the Merge Relay backend and share-preview gates

## Scope

This task adds repeatable maintenance checks for the implemented foundation.
It does not enable PGS, publish an app, deploy production, or replace the
full-MVP release gates in task 05.

## Checklist

- [x] Extend gaming CI triggers to include `apps/web`, generators, lockfiles,
  API/DB changes, and workflow changes.
- [x] Pin Bun 1.3.3 and PostgreSQL 16.15 for isolated migration and lifecycle
  checks; unavailable PostgreSQL reports `NOT RUN` and fails the job.
- [x] Build the Next entry and smoke the real `/api/health`, protected daily
  provision, authenticated challenge creation, and read-only share page.
- [x] Keep local QA memory storage explicitly non-production and assert the
  share page contains actual challenge content rather than its fallback.
- [x] Validate workflow syntax and document the local smoke command.

## Verification

- `actionlint .github/workflows/*.yml`
- `bun run check:ci`
- `bun run typecheck`
- `bun run knip:ci`
- `bun run docs:validate`
- Local Next build and real Next/API/share smoke passed with nonsecret debug
  configuration.

## Acceptance boundary

CI proves code and local integration paths only. Provider credentials, Play
Console configuration, signing, deployment, production migrations, and store
publication remain external or explicitly gated.
