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
- [x] Add challenge-first routing, manual-code fallback, guest recovery,
  offline practice, reconnect conflict UI, and ranked reservation states.
  Evidence 2026-10-22: manual code entry (`merge_relay_manual_code.dart`)
  with inline validation and offline, not-found, retired and unsupported
  states via `mergeRelayOutcomeFor`, covered by
  `test/merge_relay_manual_code_ui_test.dart`; everything stays behind
  `MERGE_RELAY_SOCIAL` (off by default, `solo_v1_scope_test` passes). Also
  added report/block (`merge_relay_safety_sheet.dart`).
- [x] Add rescue/daily/endless content, progression/themes, and truthful
  feature gates for rewards, ads, and remote tuning.
  Evidence 2026-10-22: `merge_relay_feature_gates.dart` shows rewards, ads,
  themes/purchases and remote tuning as off or not available yet from
  `gateway.getConfig`, never a grant or purchase action, covered by
  `test/merge_relay_feature_gates_test.dart`; no billing or ad SDK added;
  content and progression tests pass.
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
