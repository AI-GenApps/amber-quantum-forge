---
epic: 14-merge-relay-implementation
task: 04-release
status: pending
commit_scope: merge-relay
depends_on: [14-merge-relay-implementation/01-service, 14-merge-relay-implementation/03-client]
estimate: L
---

# Gate Merge Relay release readiness

## Implementation Checklist

- [x] Add explicit sandbox commerce and rewarded-ad provider interfaces with
  disabled behavior when configuration is absent. Evidence 2026-10-22:
  `commerce-runtime.ts` and `ad-ssv-keys.ts` return null without env; covered
  by `release-gates.test.ts` (5 tests).
- [x] Add remote disable/rollback checks and artifact/source metadata.
  Evidence 2026-10-22: remote flag and `rollbackConfig` rollback checked in
  `release-gates.test.ts`; source hashing and build metadata already exist in
  `scripts/games/metadata.ts`.
- [ ] Verify the existing Vercel workflow can package the shared backend while
  keeping secrets scoped to the deployment job. Evidence 2026-10-22:
  `scripts/games/merge-relay-deploy-workflow.test.ts` (4 tests); actionlint
  is not installed here.
- [ ] Build, install, and smoke-test the debug Android identity on the
  connected physical device; record missing two-device evidence separately.
  PARTIAL 2026-10-22: `flutter build apk --debug` succeeded (sha256
  `8ea75ee27f90...796ed`, 175247845 bytes, not committed). Install and smoke
  NOT RUN: no device; two-device evidence NOT RUN.

## Verification

- `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug`
- `bun run games:run -- --app merge_relay --device-id <physical-id>`
- `bun run check:ci`

## Acceptance

Implementation-ready means reproducible code, tests, and deployable config.
Store registration, signing ownership, publication, paid spending, and
production migration remain separately approved actions.
