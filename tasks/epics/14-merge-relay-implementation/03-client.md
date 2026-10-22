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

- [x] Add an injected HTTP gateway using the published DTOs and game token
  provider; keep pure rules independent of Flutter and HTTP. Evidence
  2026-10-22: `flutter analyze` reports no issues; `flutter test` passes 310
  tests with only the 8 known golden pixel failures; gateway seam in
  `lib/src/merge_relay_gateway.dart`, rules in the `merge_rules` package.
- [ ] Add challenge-first routing, manual-code fallback, guest recovery,
  offline practice, reconnect conflict UI, and ranked reservation states.
  NOT MET 2026-10-22: routing, guest recovery, reconnect and reservation
  states exist behind the `MERGE_RELAY_SOCIAL` gate (off by default); no
  manual-code entry UI was found.
- [ ] Add rescue/daily/endless content, progression/themes, and truthful
  feature gates for rewards, ads, and remote tuning.
  NOT MET 2026-10-22: no client reward, ad, or remote-tuning gate surface
  was found beyond the parsed feature flags; content and progression tests pass.
- [ ] Exercise the complete local service loop with integration fixtures and
  one connected physical Android device. NOT RUN: no physical device here.

## Verification

- `bun run games:analyze -- --app merge_relay`
- `bun run games:test -- --app merge_relay`
- Two-device service acceptance when a second physical device is available.

## Acceptance

Base play remains available without login, notification permission, ads, or
payment. Ranked relay play is online and server validated; no local-code demo
is presented as cheat-proof ranked play.
