---
epic: 14-merge-relay-implementation
task: 03-client
status: pending
commit_scope: merge-relay
depends_on: [14-merge-relay-implementation/00-contracts, 14-merge-relay-implementation/01-service]
estimate: XL
---

# Wire the Merge Relay Flutter client

## Implementation Checklist

- [ ] Add an injected HTTP gateway using the published DTOs and game token
  provider; keep pure rules independent of Flutter and HTTP.
- [ ] Add challenge-first routing, manual-code fallback, guest recovery,
  offline practice, reconnect conflict UI, and ranked reservation states.
- [ ] Add rescue/daily/endless content, progression/themes, and truthful
  feature gates for rewards, ads, and remote tuning.
- [ ] Exercise the complete local service loop with integration fixtures and
  one connected physical Android device.

## Verification

- `bun run games:analyze -- --app merge_relay`
- `bun run games:test -- --app merge_relay`
- Two-device service acceptance when a second physical device is available.

## Acceptance

Base play remains available without login, notification permission, ads, or
payment. Ranked relay play is online and server validated; no local-code demo
is presented as cheat-proof ranked play.
