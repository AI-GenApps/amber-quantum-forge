# Merge Relay — open questions & launch blockers

| # | Question / blocker | Owner | Blocks |
|---|---|---|---|
| 1 | Name decision: "Merge Relay" passed the strict existence check on 2026-09-26 (no conflict found on Play/App Store/web/trademark glance) — formal trademark clearance (USPTO / India TMR / WIPO) still recommended before submission | user / legal | launch |
| 2 | Client end-to-end device wiring (epic task 03: Flutter gateway, full device flow) has not started (`[ ]` in STATUS.md) | client owner | first polished solo milestone |
| 3 | 8 P1 + 4 P2 backend blockers open: contract/hash freeze, guest-recovery edge cases, role-guard matrix, retirement semantics, config-revision freezing, daily seed reconciliation across Dart/JS/server, durable-store transaction shape, event/reward ID collisions | merge-service | release evidence gate |
| 4 | No PGS (Play Games Services v2) project/app ID, OAuth client IDs/fingerprints, achievement/leaderboard IDs, or tester allowlist configured | Play Console owner | native PGS integration, achievements/leaderboards |
| 5 | No second physical Android device — cross-device relay/restore/PGS-sync evidence is unverified | release owner | Physical Play test gate |
| 6 | No native Google Play Billing SDK, no live Play product registration/pricing for the theme pack, no AdMob integration, no RTDN/voided-purchase requery | merge-release | IAP/ads enablement |
| 7 | No store listing copy, privacy policy URL, content rating (IARC), or Data Safety form inputs exist yet | publication owner | listing/submission |
| 8 | Developer account type/name, support email, website not decided | user | listing |
| 9 | Whether the rejected-preview's fixed-viewport/swipe findings were confirmed, and whether process-death/offline tests ran on the recorded device | client/QA owner | first polished solo milestone |
| 10 | Whether any 16 KB page-size / bundle-alignment check was physical-device or bundle-inspection only (test AAB currently uses a `NOTFORUPLOAD` test signing key) | release owner | artifact gate |
| 11 | Endless mode's exact rules/end-state are only lightly specified in the sourced docs (referenced as "local deterministic" without a full spec) — needs a precise definition before content/QA work | merge-content | content completeness |
| 12 | Logo direction (3 briefs drafted 2026-09-26) not yet rendered or approved — no icon/wordmark exists | user (approval gate) | brand integration |
