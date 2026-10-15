---
title: Ludo Vortex RevenueCat and AdMob runbook
description: Ordered operator steps to provision RevenueCat, Google Play products and AdMob rewarded ads for Ludo Vortex, matched to the shipped server routes and env vars.
---

Audience: the human operator in task 29. Nothing in this runbook has been
executed: no RevenueCat project, Play Console product, AdMob app or ad unit
exists yet, and every console step below is **NOT RUN**. Code paths degrade
safely until you finish: with no `REVENUECAT_API_KEY` the store shows "Store
unavailable" for real-money tabs, and with no real ad units a release build
shows no ads.

Companion docs: product list in
[`ludo-store-product-ids.md`](ludo-store-product-ids.md), economy numbers in
[`ludo-economy.md`](ludo-economy.md), env var reference in
`docs-internal/setup/02-env-vars.md`.

## 0. Values you need first

| Item | Value |
|---|---|
| Android package (release) | `app.w3dev.ludo` |
| Android package (debug) | `app.w3dev.ludo.debug` |
| API host | the production deployment host of `apps/web` (written `<host>` below) |
| Environments | `debug`, `staging`, `production`; each has its own route prefix `/api/games/ludo/<environment>/...` |
| Shared secret for the RevenueCat webhook | generate with `openssl rand -hex 32`; never commit it |

Use the `debug` or `staging` path for sandbox verification and `production`
for live. The webhook path segment decides which environment's wallet is
credited, so register one webhook per environment you intend to run.

## 1. Google Play Console products

1. In Play Console create the app `app.w3dev.ludo` (Game, Free, contains ads,
   contains in-app purchases) if it does not exist.
2. Upload at least one build to an internal testing track. Play only serves
   products to an app that has a billing-enabled build uploaded.
3. Create the eight products from
   [`ludo-store-product-ids.md`](ludo-store-product-ids.md) with exactly those
   ids: seven under **Monetize, In-app products**, and
   `ludo_vortex_pass_monthly` under **Subscriptions** with one monthly base
   plan. Set prices (INR 49/99/399/1,499/149/699/1,699 and 199/month) and
   **activate** each.
4. Add testers under **Setup, License testing** so test purchases are free.
5. Create a Google Cloud service account for RevenueCat (step 2.3) and grant it
   access in Play Console, **Users and permissions**, with the finance and
   order-management permissions RevenueCat's docs list. Permission changes can
   take up to 36 hours to propagate, so do this first.

## 2. RevenueCat project

1. Create a RevenueCat project named `Ludo Vortex`. Add an **Android (Google
   Play)** app with package `app.w3dev.ludo`.
2. Copy the app's **public SDK key** (starts with `goog_`). This is the client
   key, passed at build time as `--dart-define=REVENUECAT_API_KEY=goog_...`.
   Debug builds with the `.debug` package need the same project; add a second
   Android app for `app.w3dev.ludo.debug` if you want sandbox purchases from
   debug builds.
3. Upload the Play service-account JSON under the app's **Service account
   credentials** and press **Check permissions** until it passes. Set up the
   real-time developer notifications (Pub/Sub topic) RevenueCat shows so
   renewals and refunds arrive quickly.
4. **Products**: add all eight product ids exactly as in Play. Mark
   `ludo_starter_pack` **non-consumable** so the store blocks a second
   purchase (see the open question in the product-ids doc); the other seven
   coin and diamond packs are **consumable**; the pass is a subscription.
5. **Entitlements**: create the entitlement `vortex_pass` and attach
   `ludo_vortex_pass_monthly`. The server does not read the entitlement (it
   grants the pass from the webhook's product id in
   `revenuecat-routes.ts`), so this exists for the RevenueCat dashboard and
   future client checks. Currency packs need no entitlement.
6. **Offerings**: create an offering (for example `default`) that contains
   packages for all eight products. The client loads packages from every
   offering and matches them by store product id, so package identifiers are
   free-form.
7. **Webhook**: Integrations, Webhooks, add
   `https://<host>/api/games/ludo/<environment>/revenuecat/webhook`.
   Set the **Authorization header value** to the shared secret **exactly**
   (the route compares the header to the secret verbatim, so no `Bearer `
   prefix unless you also put it in the env var). Choose "all apps" or the
   Ludo app, and all event types. Send the test event from the dashboard;
   expect `422 ludo_revenuecat_unknown_product` for the dashboard's fake
   product id and `401 ludo_revenuecat_unauthorized` if the secret is wrong.
8. **Secret API key**: API keys, create a **secret** key with read access to
   customer info. This is the server's `REVENUECAT_API_KEY_LUDO`, used by
   `POST /api/games/ludo/:environment/revenuecat/sync`. It is never put in
   the app.
9. The app's RevenueCat user id is the game-token subject (the client calls
   `Purchases.logIn(subject)`); the webhook's `app_user_id` is that same
   subject, which is how purchases land on the right wallet. Do not enable
   RevenueCat anonymous-id aliasing tricks that change this.

### Server environment (Vercel project, per environment)

| Variable | Value | Notes |
|---|---|---|
| `REVENUECAT_WEBHOOK_SECRET_LUDO` | the shared secret from step 2.7 | falls back to `REVENUECAT_WEBHOOK_SECRET`; when neither is set every webhook call answers 401 |
| `REVENUECAT_API_KEY_LUDO` | secret key from step 2.8 | absent means `revenuecat/sync` answers `{synced:false}`, webhook still works |

## 3. AdMob app and rewarded ad units

1. In AdMob add an **Android** app `app.w3dev.ludo` (listed in Google Play, or
   "not yet listed" before launch). Note the **app id**
   (`ca-app-pub-<publisher>~<app>`).
2. Create two **Rewarded** ad units in that app:
   - `ludo_rewarded_coins` (grants 100 coins, cap 5 per UTC day)
   - `ludo_rewarded_diamonds` (grants 5 diamonds, cap 2 per UTC day)
   Note each full unit id (`ca-app-pub-<publisher>/<unit>`). The reward amount
   configured in AdMob is ignored; the server always pays the amount from the
   economy config.
3. **Server-side verification**: on each ad unit, open the reward settings and
   enable **Server-side verification**. Set the callback URL to
   `https://<host>/api/games/ludo/<environment>/ads/rewarded/callback`
   (use the production path for the live ad units). AdMob calls it with GET
   and appends `ad_network`, `ad_unit`, `reward_amount`, `reward_item`,
   `timestamp`, `transaction_id`, `user_id`, `custom_data`, `signature` and
   `key_id`.
4. There is **no signing secret to copy**. Verification uses AdMob's published
   ECDSA public keys, fetched by the server from
   `https://www.gstatic.com/admob/reward/verifier-keys.json` (cached 24 hours;
   see `admob-ssv.ts`). The "signature key" in the task text is Google's key
   list, not a value you configure.
5. Save, then wait for AdMob to activate the units (can take a few hours).
   Confirm the callback URL is publicly reachable over HTTPS; AdMob's
   "verify URL" button sends an unsigned probe, which the route correctly
   rejects with `403 ludo_ad_signature_invalid`, so a 403 on that probe is
   expected and not a misconfiguration.
6. **Privacy and messaging**: AdMob, Privacy and messaging, create a **GDPR
   message** (Google UMP) for the app and publish it. The client calls
   `ConsentInformation.requestConsentInfoUpdate` at startup and shows the form
   just before the first rewarded ad request. Add US state regulations
   message if you serve the US. Under **Blocking controls** keep the default
   restrictive categories for a 13+ audience.
7. Link the AdMob account to the Play Console developer account for
   reporting, and complete AdMob payment-profile setup (needed before payouts,
   not before ads serve).

### Server environment (Vercel project, per environment)

| Variable | Value | Notes |
|---|---|---|
| `LUDO_ADMOB_COIN_AD_UNIT_ID` | the coin unit's **numeric part** or full id as sent in `ad_unit` | the signed `ad_unit` decides the reward type; `resolveRewardType` in `rewarded-ads-routes.ts` compares against it |
| `LUDO_ADMOB_DIAMOND_AD_UNIT_ID` | the diamond unit id, same format | set both in production: with both unset the production callback refuses to grant (`503 ludo_ad_not_configured`), and with only one set the other unit's callbacks are rejected as an unknown ad unit |

### Client build inputs

| Input | Where | Notes |
|---|---|---|
| `--dart-define=REVENUECAT_API_KEY=goog_...` | `flutter build` / `games:build` | empty means "Store unavailable", never a crash |
| `--dart-define=LUDO_ADMOB_COIN_AD_UNIT_ID=ca-app-pub-.../...` | release build | debug builds ignore it and use Google's sample units only |
| `--dart-define=LUDO_ADMOB_DIAMOND_AD_UNIT_ID=ca-app-pub-.../...` | release build | a release build with missing or test-publisher units shows no ads |
| `-PLUDO_ADMOB_APP_ID=ca-app-pub-...~...` or env `LUDO_ADMOB_APP_ID` | Gradle (`android/app/build.gradle.kts`) | falls back to Google's sample app id with a warning, which shows no real ads |
| `--dart-define=LUDO_API_BASE_URL=https://<host>` | build | the Ludo API origin the gateway calls |

## 4. Verification (task 29, on the physical device)

These are the proofs required before economy provisioning is marked done.
Record device model, serial and Android version with each result.

1. **Sandbox purchase**: install a signed build from the internal testing
   track on a license-tester account. Buy `ludo_coins_small`. Expect the
   wallet to rise by 5,500 coins within a few seconds. In RevenueCat the
   customer shows the transaction; in the server logs
   `POST .../revenuecat/webhook` answers `200 {ok:true,applied:true}`.
2. **Idempotency**: tap Restore. The balance must not change again.
3. **Subscription**: buy `ludo_vortex_pass_monthly`. **Record the exact
   `product_id` the webhook sends.** If it carries a `:base_plan` suffix the
   webhook answers 422 and no pass is granted: see the known risk in
   [`ludo-store-product-ids.md`](ludo-store-product-ids.md); fix before
   launch. Then confirm the pass perk (+50% on the next daily claim).
4. **Refund**: refund the test order from Play Console or RevenueCat; the
   webhook's `REFUND` event must debit the coins (ledger reason `refund`).
5. **Test rewarded ad**: use a debug build, which always shows Google's
   sample unit, to watch one coin ad. Because the sample unit has no SSV
   callback to your server, confirm the credit path with a production-signed
   build against **test mode** (register the device as an AdMob test device)
   so a real unit serves a test creative and AdMob signs the callback.
   Expect `200 {credited:true,rewardType:"coins",amount:100}` and the wallet
   to rise by 100.
6. **Cap and replay**: replay the same `transaction_id` (the callback answers
   `200 {credited:false,duplicate:true}`); watch six coin ads in one UTC day
   and expect the sixth to answer `429 ludo_ad_daily_cap_reached`.
7. **Consent**: with a device in an EEA locale (or UMP debug geography), the
   consent form appears before the first ad. The client has **no** "Privacy
   options" entry in Settings today (no `showPrivacyOptionsForm` call exists in
   `apps-native/games/ludo/lib`). Google requires one where UMP reports it is
   required, so this is a launch gap to close in task 27 or a follow-up; it is
   logged in `.agents/games/ludo-vortex/open-questions.md`.

## 5. Rollback and safety

- To stop all real-money grants immediately, remove the webhook in
  RevenueCat or unset `REVENUECAT_WEBHOOK_SECRET_LUDO`; the route then
  answers 401 and nothing is credited (RevenueCat retries, and
  `revenuecat/sync` reconciles when you restore it).
- To stop ads, unset the two `LUDO_ADMOB_*_AD_UNIT_ID` variables; production
  then refuses to grant, and disable the units in AdMob.
- Never put the webhook secret, secret API key or service-account JSON in the
  repo, in a build define or in screenshots.
