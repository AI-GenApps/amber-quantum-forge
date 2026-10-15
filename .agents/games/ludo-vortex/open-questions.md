# Ludo Vortex — open questions & launch blockers

| # | Question / blocker | Owner | Blocks |
|---|---|---|---|
| 1 | Formal trademark clearance for "Ludo Vortex" (India TMR, USPTO, WIPO) | user / legal | launch |
| 2 | Developer account type (personal → 12 testers × 14 days closed test) and developer name | user | production release |
| 3 | Privacy policy hosting URL, support email, website | user | listing |
| 4 | Account/data deletion path (in-app + URL) | product + task 26i | data safety |
| 5 | Target age group (13+ recommended) and content-rating outcome with simulated gambling | user | listing |
| 6 | Firebase: enable Firestore, register Android app (`google-services.json`), service account | user (task 29) | online + economy |
| 7 | RevenueCat project, Play service account, product IDs; AdMob app + rewarded units + SSV key | user (task 29/26i) | IAP + ads |
| 8 | Rush / 1 Kill Win / Mask modes — in or out of scope? (currently out) | user | — |
| 9 | Quick-chat / emoji in online matches (affects "user interaction" rating) | user | online polish |
| 10 | Localization (Hindi first?) | user | listing languages |
| 11 | iOS timing (App Store account, StoreKit products, 6.9" screenshots) | user | iOS launch |
| 12 | ~~Human checkpoint 13~~ — signed off 2026-09-26 | user | done |

- (2026-10-16, task 26g) Apply the equipped dice/token/board theme inside matches (board/token/dice components still render the default look); blocked on 26f art and a follow-up task. Vortex Pass perk copy in the Pass tab is static text mirroring `economy-config.ts` and must be kept in sync by hand.
- (2026-10-16, task 26h) AdMob console work is NOT done (task 26i / 29): create the app and the two rewarded units, enable SSV on both with the callback URL `https://<host>/api/games/ludo/<env>/ads/rewarded/callback`, then set `LUDO_ADMOB_COIN_AD_UNIT_ID` / `LUDO_ADMOB_DIAMOND_AD_UNIT_ID` on the server, `-PLUDO_ADMOB_APP_ID` for the Android build and `--dart-define=LUDO_ADMOB_COIN_AD_UNIT_ID/..DIAMOND..` for the client. Until then production grants no ad reward and a release build shows no ads. iOS has no `GADApplicationIdentifier` (ludo is Android-first in the registry); add it before enabling iOS. Whether Google's test rewarded units trigger real SSV callbacks was not verified (no device in the 26h run).
- (2026-10-16, task 26i) Verify in the task 29 sandbox the exact `product_id` RevenueCat sends for the Play subscription. If it is `ludo_vortex_pass_monthly:<base_plan>` the webhook (verbatim catalog lookup) answers 422 and grants no pass; a follow-up must strip the suffix in the webhook and `revenuecat/sync`. The client already strips it for display.
- (2026-10-16, task 26i) `ludo_starter_pack` is described as purchase-once but the server does not enforce it; rely on marking it non-consumable in RevenueCat/Play, or add a server guard.
- (2026-10-16, task 26i) No Settings "Privacy options" (UMP) entry exists in the client although the answer bank said so; no in-app data-deletion path exists either (Data Safety requires a request URL).
- (2026-10-16, task 26i) Client telemetry stays in an in-memory sink (no upload), so the Data Safety "App interactions" row rests on server-recorded actions; revisit if an upload pipeline ships. Release-prep docs were created here before task 27; task 27 must extend them.
