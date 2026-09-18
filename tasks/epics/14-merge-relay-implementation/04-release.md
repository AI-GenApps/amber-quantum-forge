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

- [ ] Add explicit sandbox commerce and rewarded-ad provider interfaces with
  disabled behavior when configuration is absent.
- [ ] Add remote disable/rollback checks and artifact/source metadata.
- [ ] Verify the existing Vercel workflow can package the shared backend while
  keeping secrets scoped to the deployment job.
- [ ] Build, install, and smoke-test the debug Android identity on the
  connected physical device; record missing two-device evidence separately.

## Verification

- `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug`
- `bun run games:run -- --app merge_relay --device-id <physical-id>`
- `bun run check:ci`

## Acceptance

Implementation-ready means reproducible code, tests, and deployable config.
Store registration, signing ownership, publication, paid spending, and
production migration remain separately approved actions.
