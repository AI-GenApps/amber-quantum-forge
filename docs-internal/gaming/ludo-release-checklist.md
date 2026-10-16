---
title: Ludo release checklist
description: Every provisioning step, environment variable and physical-device check a human must complete before Ludo Vortex can be accepted, written for task 29.
---

# Ludo release checklist

**Location decision (task 28):** the release checklist is this stand-alone file,
not a section of the handoff. The [Ludo handoff](handoffs/ludo) links here and does
not repeat it. It is what task 29
(`tasks/epics/15-ludo-launch/29-human-acceptance-provisioning.md`) executes, and
it is written so you can follow it without reading any earlier task file.
Background and design are in the [Ludo Flutter plan](ludo-flutter-plan).

**Nothing in this checklist has been done.** Every box is open. No Firebase
project, database, Vercel deployment, RevenueCat project, AdMob account, Play
Console app or physical-device online run exists. Completing it does not publish
anything: store registration, submission and publication are separate approvals.
Do not tick a box from emulator or simulator output; the tooling refuses emulator
ids on purpose.

Record the device (model, serial, Android version) with every result. Put
evidence under `.agents/resources/<date>/ludo-task-29/` (and
`.agents/resources/<date>/ludo-vortex-economy/device/` for economy evidence),
never only in `/tmp`.

## 0. Read these five things first

1. **Firebase will not initialize on Android until a build change is made.**
   `apps-native/games/ludo/android` does not apply the `com.google.gms.google-services`
   Gradle plugin (or the Crashlytics plugin), and
   `ensureLudoFirebaseInitialized()` calls `Firebase.initializeApp()` with no
   options. Dropping in `google-services.json` alone leaves online play disabled
   and crash reporting on the null reporter. This is a code change, which task 29
   forbids, so it needs its own small task **before** section 8. Until it lands,
   section 8 cannot pass.
2. **The client's API base URL cannot reach both the sign-in and the Ludo routes
   as written (found by reading the code; not tried against a live server).** In
   `apps-native/games/ludo/lib/src/net/ludo_gateway.dart` sign-in resolves
   `api/auth/exchange` and `api/auth/refresh`, but Ludo routes resolve
   `games/ludo/<environment>/...`, both against the one `LUDO_API_BASE_URL`
   (`ludo_http.dart`). The deployed API serves everything under `/api/`
   (`apps/web/app/api/[...route]/route.ts`, no rewrites). With base `https://HOST/`
   sign-in works and Ludo routes hit `https://HOST/games/ludo/...` (404); with base
   `https://HOST/api/` the Ludo routes work and sign-in hits `/api/api/auth/exchange`
   (404). The gateway tests (`test/net/ludo_gateway_test.dart`) use a fixture
   transport keyed by relative path, so they cannot see this. Fix it with a small
   code task before section 8, then use the base URL that task documents.
3. **`bun run games:build` is not enough for online or store testing.** It passes
   only `GAME_ENVIRONMENT` and `APP_VERSION` (`scripts/games/cli-build.ts`). Use the
   direct build in section 6 for those passes.
4. **Six migrations**, `0005` to `0010`, must be applied, not one (section 4).
5. **Debug builds are sandboxed on purpose.** Debug uses Google's AdMob sample
   units only and the `debug` API environment. Test production behavior with the
   `staging` environment, not by pointing a debug build at production.

## 1. Accounts and tools you need

- [ ] A Google account that can create a Firebase project, and the Firebase CLI or
  console.
- [ ] Vercel access to the project that deploys `apps/web` (Environment Variables,
  Cron Jobs, deployments).
- [ ] A Postgres database you may migrate (Neon, Supabase or similar). Use a new,
  empty one for acceptance. Never run these steps against a database you care about
  until section 4 says so.
- [ ] A physical Android phone with USB debugging (the project's recorded reference
  is Samsung SM-A525F, serial `RZ8R32EAB7T`, Android 14). A **second** physical
  device is strongly preferred for section 9. If you only have one, use a second
  account on the same device and write that down.
- [ ] Google Play Console developer account (for sections 10 and 11; the account
  type decides the closed-test requirement, open question 2).
- [ ] RevenueCat and AdMob accounts (section 10).
- [ ] Bun 1.4.3 (the repo pins it in `apps-native/games/toolchain.json`; a different
  Bun makes `games:doctor` warn and `games:ludo:parity` refuse to run), Flutter 3.47.3 and Dart 3.13.3, Android SDK,
  `adb`.

## 2. Preflight on a clean checkout (no accounts needed)

Run from the repository root with Flutter on `PATH`. All must pass before you
spend time on consoles.

- [ ] `bun install --frozen-lockfile`
- [ ] `bun run games:doctor`
- [ ] `bun run games:format -- --check`
- [ ] `bun run games:analyze -- --app ludo`
- [ ] `bun run games:test -- --app ludo` (about 480 tests, under 3 minutes)
- [ ] `bun run games:validate -- --strict`
- [ ] `bun run games:ludo:parity` (needs the pinned Bun 1.4.3; this is the three-way Dart VM,
  compiled JS and TypeScript check)
- [ ] `cd packages/api && npx vitest run src/games/ludo` (Postgres suites skip
  unless `LUDO_TEST_DATABASE_URL` is set; see section 4 for running them)
- [ ] `bun run typecheck`

## 3. Firebase console

- [ ] Create or select the Firebase project. Record its project id:
  `________________`.
- [ ] Authentication: enable the **Anonymous** provider (guest play) and the
  **Google** provider (account linking).
- [ ] Firestore: create a database in Native mode in the region you want. Without
  Firestore the game still works through polling, so do this to test the realtime
  path, not to unblock play.
- [ ] Firestore rules: the repository has none. Set rules so clients can read
  `games/ludo/{environment}/matches/{matchId}` only for matches they sit in, or deny
  client reads entirely and rely on polling. The server writes with Admin
  credentials, which ignore rules. Record the rules you chose.
- [ ] Register the Android app **twice**: `app.w3dev.ludo` (release) and
  `app.w3dev.ludo.debug` (debug). A staging build uses `app.w3dev.ludo.staging`
  (`applicationIdSuffix` in `android/app/build.gradle.kts`); register it too if you
  run section 8 on staging.
- [ ] Add the SHA-1 and SHA-256 of the signing key for each registered app (debug
  keystore for debug and staging builds; the upload and app-signing key for
  release). Google sign-in fails without the SHA-1.
- [ ] Download `google-services.json` for each app and place it at
  `apps-native/games/ludo/android/app/google-services.json`. The file is
  gitignored (`**/google-services.json`); **never commit it**. Note that a single
  file can hold several registered apps.
- [ ] Service account: Project settings, Service accounts, generate a private key.
  The default Firebase Admin SDK service account already carries what
  `packages/api/src/firebase/admin.ts` needs (verify ID tokens, write Firestore); if
  you create a custom one, grant **Firebase Authentication Admin** and **Cloud
  Datastore User**. Keep the JSON out of the repo.
- [ ] Crashlytics: enable it in the console (needed for crash reports to appear).
- [ ] Complete the Gradle plugin task from section 0 item 1, then confirm
  `flutter build apk` succeeds with the file present.

## 4. Environment variables

Set these in the **Vercel project** (and in your local shell only for local
testing). One value per environment where the name has `<ENV>`. Secrets are
generated, not chosen: `openssl rand -hex 32`.

| Variable | Required for | Notes |
|---|---|---|
| `DATABASE_URL` | all server routes | Postgres connection string. Without it the match routes answer unavailable and the economy falls back to memory. |
| `API_JWT_SECRET` | sign-in exchange | 64-character hex. `packages/api/src/lib/jwt.ts` throws at import without it. |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | sign-in exchange (token verification) and Firestore fanout | From the service account. All three set means the Firestore publisher is used; if any is missing the publisher silently becomes the no-op, but sign-in verification fails. Keep the key's `\n` line breaks intact. |
| `GAME_TOKEN_ISSUER` | every Ludo route | Any stable string; the same in all environments. |
| `GAME_TOKEN_AUDIENCE` | every Ludo route | Any stable string; the same in all environments. |
| `GAME_TOKEN_SECRET_LUDO_DEBUG` | `debug` routes | At least 32 characters. Must differ from the others. |
| `GAME_TOKEN_SECRET_LUDO_STAGING` | `staging` routes | Same rule. |
| `GAME_TOKEN_SECRET_LUDO_PRODUCTION` | `production` routes | Same rule. Missing means `ludo_token_configuration_unavailable` (503) for that environment, by design. |
| `CRON_SECRET` | timeout, matchmaking and room sweeper | Vercel Cron sends it as `Authorization: Bearer`. Unset or mismatched means the sweeper answers 401. |
| `LUDO_MATCHMAKING_BOT_FILL_SECONDS` | optional | Default 20. Lower it to 10 to make the bot-fill test quicker. |
| `LUDO_ROOM_EXPIRY_HOURS` | optional | Default 24. |
| `REVENUECAT_WEBHOOK_SECRET_LUDO` | purchases | Falls back to `REVENUECAT_WEBHOOK_SECRET`. Unset means every webhook call answers 401. |
| `REVENUECAT_API_KEY_LUDO` | purchase sync | RevenueCat secret API key. Unset means `revenuecat/sync` returns `synced: false`; the webhook still works. |
| `LUDO_ADMOB_COIN_AD_UNIT_ID`, `LUDO_ADMOB_DIAMOND_AD_UNIT_ID` | production rewarded ads | Both set. With neither set production refuses every ad callback (503). |

Never set in production: `LUDO_LOCAL_STORE=memory` (honored only when `NODE_ENV` is
not production; it swaps in an in-memory store). `LUDO_TEST_DATABASE_URL` is for the
gated Postgres tests only and must point at a throwaway database.

Checklist:

- [ ] All server variables above set in Vercel for the environments you will test.
- [ ] `docs-internal/setup/02-env-vars.md` does not list `GAME_TOKEN_SECRET_LUDO_*`,
  the two optional tuning variables, or the Firebase variables for Ludo's
  purposes; this table is the complete list. (Fixing that doc is documentation
  work for a follow-up, not part of this checklist.)

## 5. Database migration

- [ ] Point `DATABASE_URL` at the **provisioned** database only, never one from a
  teammate's `.env`.
- [ ] From `packages/db`, apply every migration in order: `bun run db:migrate`
  (or `db:push` if that is the project's chosen apply method; record which). The
  Ludo files are:

  | Migration | Creates |
  |---|---|
  | `0005_yummy_warbound.sql` | matches, players, events, commands, matchmaking tickets, rooms |
  | `0006_eager_lenny_balinger.sql` | wallet transactions, balances, inventory, catalog, progression, daily reward state, ad reward claims, coin table escrow |
  | `0007_lyrical_scalphunter.sql` | XP claims |
  | `0008_boring_omega_sentinel.sql` | `coin_tier` columns on tickets and rooms |
  | `0009_deep_patriot.sql` | RevenueCat events, subscriptions |
  | `0010_silly_joystick.sql` | free-play win claims |
- [ ] Confirm all `ludo_*` tables exist (18 tables).
- [ ] Optional but recommended: run the gated Postgres suites against a **throwaway**
  database: `LUDO_TEST_DATABASE_URL=<throwaway url> npx vitest run
  src/games/ludo/drizzle-postgres.test.ts
  src/games/ludo/economy-drizzle-capped-postgres.test.ts` from `packages/api`.
  Record pass or fail; these are the only tests of the real SQL and the atomic caps.

## 6. Deploy and server smoke checks

- [ ] Deploy `apps/web` to Vercel so the API, `apps/web/vercel.json` Cron (every
  minute) and Firestore fanout run on real infrastructure. Record the host:
  `https://________________`.
- [ ] Cron: in Vercel, confirm the cron job for `/api/games/ludo/cron/sweep-timeouts`
  is registered. `curl -s -o /dev/null -w '%{http_code}'
  https://HOST/api/games/ludo/cron/sweep-timeouts` must print `401` (fails closed
  without the secret). With `-H 'Authorization: Bearer CRON_SECRET'` it must print
  `200` and a JSON body with `swept`, `matchmaking` and `rooms`.
- [ ] Token config: after signing in (section 8), `POST
  /api/games/ludo/debug/session` must return 200, not 503.
- [ ] Build the Android debug APK for the device. Use this form, from
  `apps-native/games/ludo`, so the build knows the API and environment:

  ```bash
  flutter build apk --debug \
    --android-project-arg gameEnvironment=debug \
    --dart-define=GAME_ENVIRONMENT=debug \
    --dart-define=APP_VERSION=<version from registry> \
    --dart-define=LUDO_API_BASE_URL=<base url, see section 0 item 2>
  ```

  Which base URL is correct depends on the section 0 item 2 fix (`https://HOST/` or
  `https://HOST/api/`). Before installing, prove it with `curl`: the base plus
  `games/ludo/debug/session` and the base plus the sign-in path must both answer
  something other than 404 (401 is the expected answer without a token). Record the
  exact value you used.
- [ ] Also run the documented command and record its result:
  `bun run games:build -- --app ludo --platform android --mode release
  --environment debug`. It builds, but the result has no API URL, so use it for the
  size record only.

## 7. Physical device: local play (no server needed)

Install with `bun run games:run -- --app ludo --device-id <physical-id>` (refused for
emulators, exit code 2) or `adb install` of the APK from section 6. Tick each only
when you saw it on the device.

- [ ] Cold start: splash, welcome, name and avatar (skip path and complete path),
  interactive tutorial.
- [ ] vs Computer, Classic, at Easy, Medium and Hard: play to the results screen.
- [ ] vs Computer, Quick: confirm two tokens start released, and the match ends on
  one home plus one capture.
- [ ] Pass N Play with 2 seats and with 4 seats, including the hand-off interstitial.
- [ ] A full local match to results, then **Rematch**.
- [ ] Kill the app mid-match and relaunch: it resumes on the same board.
- [ ] Settings: sound, music, vibration and reduced motion toggles take effect and
  persist.
- [ ] How to play screen matches the rules you just played.
- [ ] 60-second performance capture on a 4-player match with the debug all-bots demo,
  following [performance budgets](ludo-performance-budgets). Pass: no more than 1% of
  frames over 16 ms on the UI and raster threads, none over 100 ms.
- [ ] Record the AAB size: `bun run games:build -- --app ludo --platform android
  --mode aab --environment production` needs the upload keystore (`ANDROID_KEYSTORE_PATH`,
  `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `ANDROID_STORE_PASSWORD`) and
  `-PLUDO_ADMOB_APP_ID` or the `LUDO_ADMOB_APP_ID` variable. Decide formally whether
  the 40 MB budget is per-ABI download (current reading).

## 8. Physical device: online play against the real backend

Requires sections 3 to 6 done and the section 0 fixes landed. Run one device, then
two.

- [ ] Launch with Wi-Fi on. The home lobby shows **Online** and **Play with Friends**
  enabled. (If they are disabled, either `LUDO_API_BASE_URL` was not baked in or
  Firebase did not initialize: see section 0.)
- [ ] Guest sign-in: a game session is created without an account; a row appears in
  Firebase Authentication as anonymous.
- [ ] Google link: Settings, link Google. The Firebase UID is unchanged after linking
  and an in-progress match is unaffected.
- [ ] Private room on **two devices**: device A creates a room and shares the invite
  link; device B opens the `w3dev-ludo://room/<code>` link (both cold start and
  warm start) and joins. Play a few turns on both. Try an invalid code and an expired
  code and confirm the error dialogs.
- [ ] Random matchmaking on two devices: both search and are matched.
- [ ] Bot-fill: one device searches alone and waits out `LUDO_MATCHMAKING_BOT_FILL_SECONDS`
  (default 20 s). A medium bot fills the seat and is labeled as a bot.
- [ ] Timeout: leave an online turn alone for 30 seconds; the turn passes. After three
  misses in a **room** match the seat is forfeited; in a **matchmaking** match it is
  bot-filled instead.
- [ ] Background and reconnect: background the app mid-match for 20 to 40 seconds,
  return; the reconnecting banner appears and clears and the board matches the other
  device.
- [ ] Firestore path: with Firebase configured, confirm a document appears at
  `games/ludo/<environment>/matches/<matchId>` in the console. Then unset
  `FIREBASE_PRIVATE_KEY` on a **staging** deployment and confirm the match still
  works through polling.
- [ ] Sweeper: leave a staged match alone and confirm the Cron run (not a request)
  eventually advances it, in Vercel logs.

## 9. Economy provisioning and device verification

Follow [the RevenueCat and AdMob runbook](ludo-revenuecat-admob-runbook) sections 1 to 3
for the console steps and [store product ids](ludo-store-product-ids) for the exact
eight product ids, including `ludo_vortex_pass_monthly` (not `ludo_pass_monthly`).

- [ ] Play Console: create the eight products with the exact ids.
- [ ] RevenueCat: project, Android app, products, the `vortex_pass` entitlement, the
  offering, and the webhook to `https://HOST/api/games/ludo/<environment>/revenuecat/webhook`
  with the shared secret in the authorization header. One webhook per environment you
  run.
- [ ] AdMob: the app and two rewarded units (`ludo_rewarded_coins`,
  `ludo_rewarded_diamonds`), server-side verification on both with the callback
  `https://HOST/api/games/ludo/<environment>/ads/rewarded/callback`, and the UMP (GDPR)
  message published.
- [ ] Set `REVENUECAT_WEBHOOK_SECRET_LUDO`, `REVENUECAT_API_KEY_LUDO`,
  `LUDO_ADMOB_COIN_AD_UNIT_ID`, `LUDO_ADMOB_DIAMOND_AD_UNIT_ID` (section 4).
- [ ] Build with the economy inputs (extend the section 6 command):
  `--dart-define=REVENUECAT_API_KEY=goog_...`,
  `--dart-define=LUDO_ADMOB_COIN_AD_UNIT_ID=ca-app-pub-.../...`,
  `--dart-define=LUDO_ADMOB_DIAMOND_AD_UNIT_ID=ca-app-pub-.../...`, and Gradle
  `-PLUDO_ADMOB_APP_ID=ca-app-pub-...~...` (or the environment variable). Debug
  builds ignore the unit defines and show Google's test ads.
- [ ] Device, with a license-tester account: buy `ludo_coins_small` and see the wallet
  rise by 5,500 coins; press **Restore** and see no second credit; refund it and see the
  debit.
- [ ] Device: buy `ludo_vortex_pass_monthly`. **Record the exact `product_id` the webhook
  receives.** A `:base_plan` suffix makes the server answer 422 and grant nothing; that
  needs a code fix before launch (open question in
  `.agents/games/ludo-vortex/open-questions.md`).
- [ ] Device: watch one real test rewarded ad; the callback credits it, a replayed
  `transaction_id` returns `duplicate`, and the sixth coin ad in a UTC day answers 429.
- [ ] Device, EEA locale or UMP debug geography: the consent form shows before the first
  ad. Note that Settings has no "Privacy options" entry yet.
- [ ] Save captures under `.agents/resources/<date>/ludo-vortex-economy/device/`.

## 10. Store, privacy and listing gates (all unverified until you confirm them)

None of these is done. Each row stays `unverified` until you attach evidence.

| Gate | Status | Evidence to attach |
|---|---|---|
| Privacy policy hosted at a public URL | unverified | URL; source draft [privacy policy](ludo-privacy-policy) |
| Account and data deletion request path and URL | unverified, not built | URL and in-app entry; required by Play Data Safety |
| Play Data Safety form | unverified | Screenshot of the submitted form from [data safety](ludo-data-safety) (purchase history, advertising id, account, crash data) |
| Content rating questionnaire | unverified | Outcome, answering **simulated gambling: Yes** and that coins and diamonds are never redeemable ([content rating](ludo-content-rating)) |
| Store listing text and assets | unverified | Title, short and full description from [store listing](ludo-store-listing); screenshots, feature graphic and icon still to be produced |
| Target audience | unverified | 13+, not child-directed |
| Trademark clearance for "Ludo Vortex" | unverified | Search results (India TMR, USPTO, WIPO) |
| Developer account type and closed-test requirement | unverified | Account type; 12 testers for 14 days if personal |
| Upload keystore and Play App Signing | unverified | Fingerprint only; never the key |
| iOS | out of scope | Android ships first; no iOS provisioning, and no iOS AdMob app id exists |

## 11. Sign-off record

Fill in when done; copy the table into task 29 and update the ledger rows in
[the handoff](handoffs/ludo).

| Scenario | Device (model, serial, Android) | Result | Evidence |
|---|---|---|---|
| Local modes (section 7) | | | |
| Performance capture | | | |
| Private room, two devices | | | |
| Random matchmaking, two devices | | | |
| Bot-fill | | | |
| Background and reconnect | | | |
| Coin pack purchase, restore, refund | | | |
| Vortex Pass `product_id` recorded | | | |
| Rewarded ad, replay, cap | | | |

Store publication remains unresolved regardless of the outcome.
