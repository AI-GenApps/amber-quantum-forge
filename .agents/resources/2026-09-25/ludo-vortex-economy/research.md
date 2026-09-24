# Ludo Vortex economy & IAP research (desk pass, 2026-09-25)

Scope: design research only, for `apps-native/games/ludo` (Flutter + Flame). No app code touched. Sources are cited inline; every claim is labeled **CONFIRMED** (verified in our own repo or an official first-party source), **REPORTED** (third-party/unverified claim, cited), or **UNKNOWN** (searched, not found).

Product decisions already final (given by requester, not re-derived here): full v1 economy — levels/XP, coins (soft), diamonds (premium), inventory of dice/token/board themes, IAP store via RevenueCat (Google Play Billing + Apple StoreKit, **not** Apple Pay), daily rewards, rewarded ads only (AdMob, no interstitials), server-authoritative wallet/ledger in `packages/api` + `packages/db` (Postgres), Android first / iOS later.

---

## 1. Ludo King's economy from evidence

Primary local evidence: `.agents/resources/2026-09-19/ludo-reference/study.md` + `manifest.json` (89 screenshots, Samsung device, 2026-09-19) and `.agents/resources/2026-09-25/ludo-king-points/README.md` (desk + phone + web pass, 2026-09-25). Both are reproduced/summarized here; full detail lives in those files — read them directly for screenshot-level evidence.

### Currencies & wallet
- **CONFIRMED** (screenshots): Two currencies exist — **coins** and **diamonds**. Home HUD shows a numeric balance for both (e.g. "2,250 coins and 150 diamonds" — `ludo-king-points/README.md`, phone pass, screenshot `07-computer-mode-selection.png`).
- **CONFIRMED**: Coins/diamonds are explicitly non-monetizable virtual currency per Gametion's own FAQ: *"Coins and diamonds in the games are virtual currency and they cannot be converted into real money by any means."* (https://ludoking.com/faq, fetched 2026-09-25). This matters for policy — it keeps Ludo King (and by extension a clone) out of real-money-gaming/skill-gaming regulatory territory as long as we keep the same no-cashout rule.
- **CONFIRMED**: An ad-free pass is sold as a separate IAP ("Get Verified" pack) accessible from a "No Ads" icon on the home screen (ludoking.com/faq).

### Coin table entry fees & payouts
- **UNKNOWN (official)**: No official Gametion source publishes a numeric coin-stake entry-fee/payout table.
- **REPORTED**: Third-party guides describe coin-stake matches where the winner receives back more than the stake (app takes a rake). One cited worked example: entering a 2-player match with 500 coins and winning returns ~950 coins (~52% return over stake). Source: search-summarized coin-earning guides (gamingonphone.com, candid.technology); exact article not re-verified — treat as illustrative only, not a spec to copy exactly.
- **REPORTED**: Tournament formats have per-contest coin entry fees and a tiered prize-pool split, largest share to 1st place; no Ludo-King-specific numeric table found.
- **Design implication**: because we cannot cite a trustworthy source for exact numbers, our v1 coin table (Section 6) is an original design using standard rake economics (see below), not a copy of Ludo King's numbers.

### What diamonds buy
- **CONFIRMED**: Diamonds fund the "undo/re-roll" mechanic in Quick Mode — after rolling, a player can spend diamonds to undo the move and re-roll to try again for a kill (official Gametion blog: "Ludo King rolls out Quick Mode and 6 Player Online Multiplayer updates", 2021-01-28, https://blog.gametion.com/2021/01/ludo-king-rolls-out-quick-mode-and-6-player-online-multiplayer-updates/).
- **CONFIRMED** (screenshot): diamonds are also sold directly as an IAP bundle, e.g. "Special Diamond Offer — 500 diamonds at ₹259" and a bundled "10,000,000 coins + 12,500 diamonds" offer (`ludo-reference/manifest.json` #67-69).
- **REPORTED**: Diamonds can also be earned by watching reward videos (YouTube tutorial frame stating "watching a video can grant diamonds" — `ludo-reference/manifest.json` #83).
- **UNKNOWN**: Whether diamonds unlock cosmetic themes directly, or only coins/real-money do — not observed in captures.

### Level/XP system
- **CONFIRMED** (screenshot): a player level exists and is shown on relaunch — "Hi there FreakyReptile7401, Level 15" (`ludo-reference/manifest.json` #66), and Home shows a level "crown" badge (`ludo-king-points/README.md` phone pass, screenshots 07/13).
- **REPORTED**: one low-reliability third-party source claims "the first level is earning 180 XP" — no further curve, no per-match XP values, no level-up rewards found anywhere. Treat as **UNKNOWN** for design purposes; do not reuse this number.

### Daily rewards / spin
- **CONFIRMED** (screenshot): Home has a "Season Claim" surface and a free-reward/spin element (`ludo-reference/manifest.json` #70: "Free reward, spin, and Home/Event/Adda/Inventory/Social navigation"); "SEASON 27 CLAIM, TOURNAMENT, EVENT" tiles also seen in the phone pass (screenshots 07/13).
- **CONFIRMED**: A persistent "Free Coins" offer grants coins for watching up to 5 ads (1000 coins × 5 ad views) is shown on cold start (`ludo-king-points/README.md` phone pass, screenshots 01/04/05).
- **UNKNOWN**: exact daily-login calendar structure, streak bonuses, or spin-wheel prize table — not captured.

### Themes & dice/token inventory
- **CONFIRMED** (screenshot): a Theme selection screen exists with at least 12 named themes — DEFAULT, NATURE, EGYPT, DISCO, MARBLE, CANDY, CHRISTMAS, PENGUIN, BATTLE, DIWALI, PIRATE, ALIEN (`ludo-king-points/README.md` phone pass, screenshot `10-help-info.png`, reached by mistake via the help icon).
- **CONFIRMED**: themes are sold as paid offers, e.g. "Get NATURE Theme offer with ad-count and ₹180 purchase choices" (`ludo-reference/manifest.json` #6).
- **CONFIRMED**: setup screen for a Computer match has a token-color/style carousel and color swatches separate from the board theme (`ludo-reference/manifest.json` #9).
- **CONFIRMED**: a dedicated "Inventory" tile exists on the Home lobby nav (`ludo-reference/manifest.json` #7, `ludo-king-points/README.md` phone pass).
- **UNKNOWN**: whether dice skins are sold/inventoried separately from token/board themes, or bundled as one "theme" unit — the evidence only shows combined theme purchases and a separate token-color picker, not an independent dice-skin store.

### King Pass (subscription)
- **CONFIRMED** (screenshot, two independent captures): King Pass is a recurring IAP subscription. First-run price ₹99/month; benefits listed: Remove Ads, Unlock All Modes, Unlimited Talktime, Rematch Instantly, Access Game History, Unlimited Gameplay, Create Tournament, Unlimited ADDA Access (`ludo-king-points/README.md` phone pass, screenshot `25-after-splash.png`; corroborated by `ludo-reference/manifest.json` #4, ₹99/month, "Remove Ads, premium feature list").
- **REPORTED**: Brazilian App Store listing shows King Pass at R$19.90 (search result, not independently fetched/screenshotted) — regional pricing varies, as expected.

### Rewarded ads (no interstitials confirmed as the pattern to copy)
- **CONFIRMED** (screenshot): a persistent "No Ads for 30 minutes" rewarded-ad offer with "Remove Ads" and "Free" choices is shown and is sticky (does not dismiss easily) — `ludo-reference/manifest.json` #87-89.
- **CONFIRMED**: forced *playable* ads (not just banners) are interposed in the onboarding→first-match path (Tasty Travels, Water Sort playable-ad webviews) — `ludo-reference/study.md`, `ludo-reference/manifest.json` #10-13, #68. **This is explicitly an anti-pattern for us** — the product decision here is "rewarded ads only, no interstitials," which Ludo King does not follow. Our design should avoid forced/playable interstitials entirely, consistent with the given product decision.
- **UNKNOWN**: exact rewarded-ad daily cap in Ludo King.

### Open evidence gaps (things web + screenshots could not confirm)
No official numeric coin-table, no official XP curve, no official daily-reward calendar, no confirmed dice-skin-vs-theme separation, no results-screen capture (blocked by persistent offer overlays in both phone passes per `ludo-king-points/README.md`). These gaps are why Section 6 below is an original design rather than a transcription.

---

## 2. Genre benchmarks

### Yalla Ludo (REPORTED, web search 2026-09-25)
- Dual currency: **Gold** (soft, earned via matches/quests/events, spent on board skins/avatar frames/room themes) and **Diamonds** (premium, top-up only). Source: search-summarized guide content, https://news.bittopup.com/news/yalla-ludo-global-beginner-guide-2026-tiers-free-diamonds.
- VIP subscription tiers: "Knight" ~US$11.99/month, "Baron" ~US$39.99/month (multi-tier subscription ladder, richer than Ludo King's single King Pass tier).
- Apple diamond pack pricing observed: 400 diamonds/€1.19, 1,800/€4.99, 5,000/€11.99, up to 53,700/€119.99 — i.e. roughly €0.003/diamond at the low end, improving (more diamonds per €) at higher tiers, the standard "bigger pack = better rate" IAP ladder.

### Ludo Star / Parchisi Star (Gameberry Labs) (REPORTED, thin)
- Confirmed only that Gameberry Labs makes both titles (https://gameberrylabs.com/); no IAP price points surfaced in this pass. Treat pricing for these as **UNKNOWN**; not enough to cite numbers.

### Ludo Club (Moonfrog) (UNKNOWN — not reached in this pass beyond confirming the Play Store listing exists at `com.moonfrog.ludo.club`)

### Cross-genre pattern (REPORTED, general mobile-game-economy knowledge, not Ludo-specific)
Across match-3/casual/board titles broadly (industry-standard pattern, not sourced to a specific Ludo competitor in this pass): coin/diamond pack ladders typically run 4-7 tiers from a "starter pack" (heavily discounted, one-time, e.g. $0.99-$1.99 for a large bonus bundle) up to a "mega pack" ($49.99-$99.99), with mid packs at $4.99/$9.99/$19.99; remove-ads is usually a standalone $2.99-$4.99 one-time IAP; a "pass" (battle-pass-like) is usually $4.99-$9.99/month or /season with a free + premium track. This is the shape used for Section 6's price ladder, informed by the Yalla Ludo diamond-pack data point above and standard app-store IAP tiering.

---

## 3. Repo reuse: what already exists

Confirmed by direct `grep`/`Read` over `apps/native`, `packages/api/src`, `packages/db/src/schema.ts`, `scripts/games/registry-games.ts`, and `apps-native/flutter-app` (read-only; no files modified).

### RevenueCat in `apps/native` (Expo/React Native) — CONFIRMED
- `apps/native/services/revenuecat.ts` initializes the RN SDK (`react-native-purchases`): `initializeRevenueCat()` calls `Purchases.configure({ apiKey, appUserID: null, storeKitVersion: STOREKIT_2 (iOS), entitlementVerificationMode: DISABLED, ... })`. API key comes from `EXPO_PUBLIC_REVENUECAT_API_KEY` (via `expo-constants` `extra.revenueCatApiKey` or `process.env`), read in both `apps/native/firebase.config.ts` and `apps/native/services/revenuecat.ts`.
- `setRevenueCatUserId(userId)` calls `Purchases.logIn(userId)` — i.e. the pattern is to log RevenueCat in with **our own** server-issued user id (from the Firebase→JWT exchange), not an anonymous RevenueCat id. This is exactly the pattern to replicate for the Flutter game: call `Purchases.logIn(ourUserId)` right after auth, not before.
- `apps/native/contexts/RevenueCatContext.tsx` is a React context/provider (`RevenueCatProvider`, `useRevenueCat()`) wrapping `customerInfo`, `offerings`, `packages`, `isSubscribed`, `activeEntitlements`, plus `purchasePackage`, `restorePurchases`, `refreshCustomerInfo`, `showManageSubscriptions` — consumed from `apps/native/app/plans.tsx` and mounted in `apps/native/app/_layout.tsx`.
- No RevenueCat **webhook route** was found under `packages/api/src` (`grep -rl "revenuecat" packages/api/src` returned nothing) — `apps/native`'s subscription entitlement checks currently appear to be client-side only (via `Purchases.getCustomerInfo()`), with no server-side webhook sync yet in this repo. This means there is **no existing RevenueCat-webhook-to-Postgres pattern to copy** — the Merge Relay commerce flow (below) is the closer analog for a server-authoritative design, since it verifies purchases server-side directly against Google Play rather than trusting a RevenueCat webhook.

### Merge Relay commerce (`packages/api/src/games/merge-relay/commerce-*.ts`) — CONFIRMED, most relevant prior art
- **No RevenueCat involved at all** — Merge Relay verifies Google Play purchases directly against the Play Developer API, bypassing RevenueCat entirely:
  - `commerce-google-auth.ts`: `createServiceAccountTokenSource(encodedJson)` parses a Google service-account JSON (`client_email`/`private_key`), signs a JWT (`jose` `SignJWT`, RS256, scope `https://www.googleapis.com/auth/androidpublisher`) and exchanges it for an OAuth access token at `https://oauth2.googleapis.com/token`, with in-memory token caching.
  - `commerce-provider.ts`: `GooglePlayPurchaseProvider.verifyPurchase()` calls `GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{package}/purchases/productsv2/tokens/{purchaseToken}` (the Play Developer API "purchases.products.get" v2 endpoint) and `acknowledgePurchase()` POSTs to the `:acknowledge` endpoint — this is the exact template for Ludo Vortex's server-side Play purchase verification if we go the "verify against Google directly" route instead of/alongside RevenueCat webhooks.
  - `commerce-service.ts` (`settleCommercePurchase`): idempotency key is `purchaseId = "play_purchase_" + digest(purchaseToken)` — i.e. a hash of the purchase token itself, looked up before re-verifying, so retries/replays of the same purchase token are no-ops. Purchases go through states `pending → purchased → cancelled/refunded/revoked` (`commerce-contracts.ts`).
- **Storage is NOT dedicated wallet/ledger SQL tables.** `packages/db/src/schema.ts` has no `wallet`, `ledger`, `transaction`, `purchase`, or `entitlement` tables. Instead Merge Relay uses two generic tables: `mergeRelayScopes` (per app+environment row, row-locked via `SELECT ... FOR UPDATE` for serializing writes — see `lockScope()` in `drizzle-artifacts.ts`) and `mergeRelayRecords` (a generic keyed JSON-artifact store: `recordType` + `recordId` + `ownerSubject` + payload, with indexes including `merge_relay_records_idempotency_idx` and a `merge_relay_records_scope_idempotency_unique` unique index). Commerce purchases and entitlements are stored as `recordType: "commerce_purchase"` / `"commerce_entitlement"` rows in this generic table, not as their own SQL schema. **Design implication for Ludo Vortex**: we can either (a) follow this same generic-artifact-table pattern (fast to reuse, less rigid schema), or (b) add purpose-built `ludo_wallet_transactions`/`ludo_wallets` tables as recommended in Section 4 (clearer schema, better suited to a high-volume append-only ledger with numeric aggregation). Recommend (b) for the wallet/ledger specifically, since coin/diamond balances need efficient `SUM()`/indexed-by-user-and-date queries that a generic JSON artifact table handles poorly at scale — but the **idempotency-by-hashed-token** and **transactional read-then-write** patterns from Merge Relay's `commerce-service.ts` should be copied directly regardless of table shape.
- Product/entitlement model is currently a single hardcoded non-consumable (`MERGE_RELAY_THEME_PRODUCT_ID = "merge_relay_theme_pack_v1"`) — Ludo Vortex will need a real product catalog (coins/diamonds/themes/pass, multiple SKUs), which Merge Relay's contracts don't yet generalize to.

### Games registry capability flags (`scripts/games/registry-games.ts`) — CONFIRMED
- Ludo already has a registry entry (id `"ludo"`, `canonicalName: "Ludo Vortex"` — the brand name is already set in this file): `platforms: ["android"]` (matches the Android-first decision), `capabilities: capabilities(["game_loop", "guest_identity", "save_sync", "sharing"])`. **`"billing"` and `"ads"` are NOT yet in Ludo's capability list** and must be added once the store/rewarded-ads work lands — compare to `merge_relay`'s entry which already has `capabilities: capabilities(["game_loop", "guest_identity", "save_sync", "billing", "ads", "sharing"])`, the reference shape to copy.
- The `GameCapability` union type (in `scripts/games/registry-types.ts`) includes `"billing"` and `"ads"` as first-class capability strings already — no new capability type needs to be invented, just added to Ludo's array.
- `capabilities()` produces a `{ specified, implemented, enabled }` triple (not just a flat array) — need to check `registry-types.ts` further for how `implemented`/`enabled` get toggled before assuming `capabilities([...])` alone flips these on end-to-end.

### AdMob usage — CONFIRMED absent
- No `google_mobile_ads` or AdMob SDK reference exists anywhere in the repo (`pubspec.yaml` files, `apps/native/package.json`) at the time of this research. Ludo Vortex (or Merge Relay, whichever ships ads first) would be the **first AdMob integration** in this monorepo — no existing pattern to copy; follow Google's official `google_mobile_ads` Flutter plugin + UMP consent SDK directly (Section 5).

### Flutter app (`apps-native/flutter-app`) plumbing — CONFIRMED
- `apps-native/flutter-app/pubspec.yaml` already depends on `purchases_flutter: ^8.2.1`, and `apps-native/flutter-app/lib/main.dart` is the only file referencing `Purchases.`/`purchases_flutter` — i.e. RevenueCat is wired at the **host app's** top level (`main.dart`), not yet per-feature-module. No `google_mobile_ads` dependency exists in this pubspec.
- Confirm before building: whether `apps-native/games/ludo` is a Flutter package consumed by `apps-native/flutter-app`'s `main.dart` (in which case Ludo can reuse the host app's already-initialized `purchases_flutter` instance/login state) or an independent Flutter app of its own — this determines whether Ludo needs its own RevenueCat init/login or just reads the host's already-logged-in `CustomerInfo`. This repo's `plugins/flutter/*` path-dependency convention (per `CLAUDE.md`) suggests the former (Ludo as a linked package under the flutter-app host), which is the cheaper integration path.

---

## 4. Architecture recommendation

### Wallet & ledger
- **Append-only ledger table** (`ludo_wallet_transactions` or similar): `id` (uuid), `user_id`, `currency` (`coins` | `diamonds`), `delta` (signed integer), `balance_after` (denormalized for fast reads, computed server-side in the same transaction), `reason` (enum: `iap_purchase`, `rewarded_ad`, `daily_reward`, `match_reward`, `match_entry_fee`, `admin_grant`, `refund`), `source_ref` (RevenueCat transaction id / AdMob SSV signature / match id — whatever produced this row), `idempotency_key` (unique constraint), `created_at`.
- Never mutate a `balance` column directly from a request handler; balance is `SUM(delta)` per user/currency, optionally cached in a `ludo_wallets` summary table updated inside the same DB transaction as the ledger insert, for fast reads.
- **Idempotency is mandatory** on every grant path: RevenueCat webhook event id, AdMob SSV `transaction_id` param, and match-end grants (keyed by `match_id + user_id + reason`) must all have a unique index so retries/replays never double-credit — this mirrors the Merge Relay commerce pattern (Section 3).

### Product catalog
- A `ludo_products` table (or reuse of a shared `products` table if Merge Relay already has one) mapping our internal product id → RevenueCat product identifier → grant payload (currency + amount, or entitlement id for King-Pass-equivalent). Store price display strings from RevenueCat's `StoreProduct` client-side only; server never trusts client-reported price, only the verified purchase event.

### Grant flows
1. **IAP (coins/diamonds/theme packs) via RevenueCat**: client purchases through `purchases_flutter` → RevenueCat validates against StoreKit/Play Billing → RevenueCat webhook (`INITIAL_PURCHASE`/`NON_SUBSCRIPTION_PURCHASE`) hits a new `packages/api` endpoint → server maps `product_id` → grant → ledger insert, idempotent on RevenueCat's event id. **Note (confirmed, Section 3): this repo has no existing RevenueCat webhook handler to copy** — `apps/native` currently checks entitlements client-side only. Two viable designs, pick one explicitly rather than assuming: (a) add a first RevenueCat webhook handler (new work, standard RevenueCat-documented pattern: verify the `Authorization` header against a shared secret configured in the RevenueCat dashboard, parse the event, grant); or (b) skip RevenueCat webhooks for consumables and verify Play purchases server-side directly against the Play Developer API, copying Merge Relay's `commerce-google-auth.ts` + `commerce-provider.ts` pattern (service-account JWT → Play Developer API `purchases.products.get` v2 → acknowledge), with RevenueCat used only client-side as the StoreKit/Play-Billing UI wrapper. Recommend (b) for coin/diamond/theme consumables (matches the one proven pattern already in this codebase, Section 3) and reserve RevenueCat webhooks for the Vortex Pass **subscription** specifically, since subscription renewal/cancellation state is exactly what RevenueCat webhooks are best at and what Merge Relay's model doesn't cover at all (it only has one non-consumable). Either way, idempotency key = the purchase token digest (or RevenueCat event id for the subscription path), following `commerce-service.ts`'s `purchaseId = "play_purchase_" + digest(purchaseToken)` pattern.
   Client-side "restore purchases" (`purchases_flutter`'s `restorePurchases()`) is the offline/reinstall recovery path; it must NOT itself grant currency client-side — it only triggers a resync, and the server-side verification (webhook or direct Play Developer API call) remains the source of truth.
2. **Rewarded ads (AdMob SSV)**: enable Server-Side Verification on each AdMob rewarded ad unit, callback URL pointed at our own `packages/api` endpoint (not RevenueCat's, since RevenueCat's AdMob SSV integration is for entitlement rewards tied to RevenueCat's own product model — for a simple coin grant we likely want our own SSV endpoint that verifies AdMob's signed callback per Google's documented HMAC/JWS verification, then inserts a ledger row keyed by AdMob's `transaction_id` for idempotency). Cap rewarded-ad grants server-side (see Section 6) regardless of what the client claims, since a client could in principle call the endpoint without watching an ad — SSV signature verification is what prevents that.
3. **Match-end rewards**: for **online** matches (server already authoritative for match state/turns), grant coins server-side at match resolution, keyed by `match_id + user_id`, no client involvement needed for idempotency (server already knows the match ended once). For **offline vs-computer matches** (bot runs entirely on-device, no server round-trip during play), the server cannot verify the match actually happened — recommend: (a) do NOT grant real coin rewards for offline-bot matches at all (safest, zero anti-cheat burden), or (b) if offline rewards are a product requirement, grant a small, capped "daily offline play" bonus (e.g. first N offline matches/day, flat reward regardless of match outcome, tracked by a server-side daily counter keyed by device/user — not amount claimed by client) rather than trusting a client-reported win/score. Recommend option (a) for v1 simplicity, revisit if retention data shows offline-only players need incentive.
4. **Daily rewards / login streak**: server-side calendar keyed by `user_id` + last-claim date (UTC), idempotent by date (unique constraint on `user_id + reward_date`), claimed via an authenticated endpoint — cannot be replayed same-day.

### Coin-table matchmaking (entry-fee escrow, online only)
- For any online coin-stake match: on match creation, debit each player's entry fee into an `escrow` ledger reason (still append-only — a `match_entry_fee` debit row), hold in a `matches` table's `pot` field; on match resolution, credit winner(s) a `match_reward` row from the pot minus rake; if the match is abandoned/disconnected before resolution, refund via a `refund` ledger row. This must be server-authoritative since real coins are at stake — never allow client-reported match outcomes to trigger payout for coin-stake matches.
- Offline (vs-computer) matches should never use coin-stake entry fees, since there's no server-verifiable outcome — consistent with the match-reward recommendation above.

### Anti-cheat
- Client never has write access to its own balance; every balance change is server-derived from a verified external event (store receipt, AdMob SSV signature, server-computed match result, server-side daily-claim check).
- Rate-limit and cap all grant endpoints server-side (daily rewarded-ad cap, daily offline-bonus cap, daily-login idempotency) regardless of client claims.
- Store purchases must be re-validated against RevenueCat's server-side CustomerInfo (or Play/Apple receipt validation) — never trust a client-asserted "I bought this" flag.

### XP/level curve
See Section 6 for the concrete v1 curve; architecturally, XP is just another server-tracked counter per user (`ludo_xp` table or column), incremented on the same server-authoritative events that grant coins (match wins, daily reward claims, etc.), with level computed from XP via the formula rather than stored redundantly (or stored denormalized + recomputed on write, matching the wallet-balance caching pattern above).

### What must work offline
- Full solo vs-computer gameplay (already true — Flame/Dart bot logic runs on-device).
- Reading current wallet/inventory/level state from a local cache (last-synced-from-server snapshot), so the player sees their coins/diamonds/theme unlocks without a network call every screen — but any *spend* or *grant* action must either queue for sync-when-online (for non-monetary, low-risk actions only, e.g. selecting an already-owned theme) or simply be disabled offline (for anything touching real currency/IAP/rewarded ads, which inherently require network anyway).
- Rewarded ads and IAP inherently require connectivity (ad fill + StoreKit/Play Billing + our webhook), so there's no offline path to design for those — just graceful "you're offline" UI states.

---

## 5. Policy & setup checklist

- **Google Play Payments policy**: any in-app virtual currency (coins/diamonds) sold for real money **must** go through Google Play Billing on Android — confirmed current policy (https://support.google.com/googleplay/android-developer/answer/10281818). Virtual currency may only be used within the app it was purchased for (no cross-app spend). As of the 2026 Epic-settlement-driven changes, US-specific alternative billing/webshop-link programs exist but require separate enrollment by Jan 28, 2026 if used — not required if we simply use standard Play Billing, which is the default recommendation here (https://www.coda.co/blog/epic-v-google-policy-update-2026/, https://www.neonpay.com/blog/google-plays-new-u.s.-billing-linking-policies-what-game-developers-need-to-know).
- **Apple guideline 3.1.1**: any in-app digital content/currency purchase must use Apple's In-App Purchase (StoreKit) — explicitly **not** Apple Pay, matching the stated product decision. (https://developer.apple.com/app-store/review/guidelines/)
- **Loot box / random-reward odds disclosure**: Apple requires odds disclosure prior to purchase for any mechanism granting randomized virtual items (https://www.fenwick.com/insights/publications/apple-now-requires-disclosure-of-loot-box-odds); Google Play similarly requires "clear and timely" odds disclosure for loot-box-like mechanics. **Recommendation for v1: avoid random-reward paid items entirely** (no "mystery box" theme purchases, no gacha) — sell all theme/cosmetic items as fixed-price, guaranteed-contents IAPs. This sidesteps the disclosure requirement and associated regulatory/loot-box-law risk (several jurisdictions increasingly regulate loot boxes) rather than requiring us to build odds-disclosure UI.
- **Families/children policy implications**: if the store listing targets a general audience (not specifically kids), standard policies apply, but Ludo is a family-friendly board game that may attract a mixed-age audience — avoid Play Families program enrollment complexity by not specifically targeting under-13s, keep IAP purchase confirmation dialogs on (no one-tap repeat purchases), and ensure AdMob is configured for non-personalized/limited ads when a user is tagged as a minor (UMP SDK `isTagForUnderAgeOfConsent`).
- **Data safety / privacy nutrition labels**: must disclose purchase history collection (Play Data Safety section) and advertising ID usage (GAID/IDFA) for AdMob — confirmed current requirement (https://developers.google.com/admob/android/privacy/play-data-disclosure, https://support.google.com/googleplay/android-developer/answer/10787469). Apple's App Store "Privacy Nutrition Label" needs equivalent disclosure (Purchases, Identifiers, Usage Data linked to AdMob SDK).
- **AdMob + UMP consent (GDPR)**: integrate Google's User Messaging Platform (UMP) SDK to show an EEA/UK consent form (IAB TCF v2) before requesting ads for EEA users; tag underage users to suppress ad ID transmission (https://developers.google.com/admob/android/privacy/gdpr).
- **RevenueCat setup**: create a RevenueCat project, link Google Play service account (for server-side receipt validation / Play Developer API access — same credential type Merge Relay commerce likely already uses per Section 3) and Apple App Store Connect API key / shared secret (for iOS later), configure entitlements (`premium`/pass) and product catalog mirroring Play Console + App Store Connect product IDs, configure the RevenueCat webhook pointed at our `packages/api` endpoint with shared-secret auth.
- **Product ID naming**: recommend a consistent scheme, e.g. `ludo_coins_1000`, `ludo_coins_5500`, `ludo_diamonds_100`, `ludo_diamonds_600`, `ludo_pass_monthly`, `ludo_theme_<name>`, `ludo_noads` — matched 1:1 across Play Console, App Store Connect, and RevenueCat.
- **Tax/payments profiles**: standard Play Console merchant/payments-profile setup (already required for any paid app in the org) and App Store Connect Agreements/Tax/Banking (Paid Apps agreement) must be active before any IAP product can go live — verify these org-level profiles exist before building products, since this is often the actual bottleneck (not code).
- **Testing**: Google Play license testers (Play Console → Setup → License testing) for Android sandbox purchases without real charges; Apple Sandbox testers (App Store Connect → Users and Access → Sandbox) for iOS later; RevenueCat has its own sandbox/test mode reflecting both.

---

## 6. Proposed v1 economy table (original design — not copied from Ludo King, given the evidence gaps in Section 1)

### Currencies
| Currency | Type | Earned via | Spent on |
|---|---|---|---|
| Coins | Soft | Match wins (online only), daily reward, rewarded ads, level-up bonus, starter grant | Online coin-stake match entries, unlocking mid-tier cosmetics |
| Diamonds | Premium | IAP only, small daily-reward trickle, rare rewarded-ad bonus | Premium cosmetics (dice/token/board), reroll/undo-style convenience (future), pass |

### Starting balances (new player)
- 5,000 coins, 20 diamonds, 1 free theme unlocked (Default), granted server-side on first login (idempotent, one-time `reason: starter_grant`).

### Sources & sinks (starting numbers)
| Source | Amount | Cap |
|---|---|---|
| Daily login (day 1-6) | 200 / 250 / 300 / 350 / 400 / 500 coins | once/day |
| Daily login (day 7, streak reset) | 5 diamonds + 750 coins | once/week |
| Rewarded ad (coins) | 100 coins | 5/day |
| Rewarded ad (diamonds, rarer unit) | 5 diamonds | 2/day |
| Online match win (coin-stake) | stake × 1.9 (see coin table below) | per match |
| Online free-play match win (no stake) | 50 coins flat | 10/day (anti-farm cap) |
| Level-up bonus | 100 × new level (coins) | per level |
| Offline vs-computer win | none in v1 (see Section 4 rationale) | — |

| Sink | Cost |
|---|---|
| Coin-stake match entry (Low) | 500 coins |
| Coin-stake match entry (Mid) | 2,000 coins |
| Coin-stake match entry (High) | 10,000 coins |
| Dice theme (standard, 6 total) | 1,500 coins or 30 diamonds each |
| Token theme (standard, 4 total) | 2,500 coins or 50 diamonds each |
| Board theme (premium, 3 total) | 80 diamonds each (diamond-only, no coin price) |

### Coin table (online stakes, rake = 5%)
| Tier | Entry fee | Players | Pot | Winner payout | Rake |
|---|---|---|---|---|---|
| Low | 500 | 2 | 1,000 | 950 | 50 (5%) |
| Mid | 2,000 | 2 | 4,000 | 3,800 | 200 (5%) |
| High | 10,000 | 2 | 20,000 | 19,000 | 1,000 (5%) |
| Low (4p) | 500 | 4 | 2,000 | 1,900 (winner-take-most) | 100 (5%) |

(4-player split model, or 1st/2nd split, is a product decision to finalize; flat "winner takes pot minus rake" is the v1 default for simplicity and matches the ~52%-over-stake return pattern reported for Ludo King in Section 1.)

### XP curve
Formula: `xp_required(level) = 100 * level^1.6` (rounded to nearest 10), a mild super-linear curve (matches the "quadratic-ish, mobile-casual-friendly" pattern from Section 2's genre research — predictable early levels, gently steepening later, no late-game wall).

| Level | XP to next |
|---|---|
| 1→2 | 100 |
| 2→3 | 240 |
| 5→6 | 660 |
| 10→11 | 1,590 |
| 20→21 | 4,830 |
| 50→51 | 21,000 |

Level rewards: every level grants `100 × new level` coins (Section table above); every 5th level also grants 10 diamonds; every 10th level unlocks one free theme item from a rotating pool.

### IAP products (6-10, INR + USD price tiers)
| Product | Contents | INR | USD |
|---|---|---|---|
| Starter Pack (one-time, best value, shown once) | 3,000 coins + 30 diamonds | ₹49 | $0.99 |
| Coins — Small | 5,500 coins | ₹99 | $1.99 |
| Coins — Medium | 30,000 coins | ₹399 | $4.99 |
| Coins — Large | 110,000 coins | ₹1,499 | $17.99 |
| Diamonds — Small | 100 diamonds | ₹149 | $2.99 |
| Diamonds — Medium | 600 diamonds | ₹699 | $8.99 |
| Diamonds — Large | 1,600 diamonds | ₹1,699 | $19.99 |
| Remove Ads (one-time) | Removes rewarded-ad prompts (not gameplay ads, since we're rewarded-only — this instead removes the "watch ad" nag / grants an ad-free HUD) | ₹149 | $2.99 |
| Vortex Pass (monthly subscription) | +50% daily reward, 1 free theme/month, exclusive dice skin | ₹199/mo | $3.99/mo |

(Pricing anchored to the Yalla Ludo diamond-pack data point in Section 2 and standard mobile IAP tiering; not copied from Ludo King, whose exact current price list was not fully retrievable in this pass — see Section 1.)

### Rewarded ad caps
- 5 coin-rewarded ads/day (100 coins each = 500 coins/day max from ads).
- 2 diamond-rewarded ads/day (5 diamonds each = 10 diamonds/day max from ads).
- No interstitials anywhere, per product decision.

### Daily reward calendar (7-day cycle, resets on streak break)
Day 1: 200 coins · Day 2: 250 coins · Day 3: 300 coins · Day 4: 350 coins · Day 5: 400 coins · Day 6: 500 coins · Day 7: 750 coins + 5 diamonds.

### Theme catalog (v1)
- **6 dice themes**: Default (free), Classic Wood, Neon Vortex, Marble, Galaxy, Gold — 1,500 coins or 30 diamonds each (except Default).
- **4 token themes**: Default (free), Gem Tokens, Robot Tokens, Animal Tokens — 2,500 coins or 50 diamonds each (except Default).
- **3 board themes**: Default (free), Cosmic Board, Royal Board — 80 diamonds each, diamond-only (matches Ludo King's pattern of board-level themes being the most premium tier).

---

## Sources index

- `.agents/resources/2026-09-19/ludo-reference/study.md`, `manifest.json` (local, 2026-09-19 device capture)
- `.agents/resources/2026-09-25/ludo-king-points/README.md` (local, 2026-09-25 desk + phone + web pass)
- https://ludoking.com/faq (fetched 2026-09-25)
- https://blog.gametion.com/2021/01/ludo-king-rolls-out-quick-mode-and-6-player-online-multiplayer-updates/ (Quick Mode / diamond undo mechanic)
- https://blog.gametion.com/2020/10/ludo-king-brings-mask-mode-to-educate-masses-on-health-safety-while-entertaining-them/ (Mask Mode)
- https://news.bittopup.com/news/yalla-ludo-global-beginner-guide-2026-tiers-free-diamonds (Yalla Ludo currency/VIP structure)
- https://gameberrylabs.com/ (Ludo Star / Parchisi Star publisher)
- https://support.google.com/googleplay/android-developer/answer/10281818 (Google Play Payments policy)
- https://www.coda.co/blog/epic-v-google-policy-update-2026/ ; https://www.neonpay.com/blog/google-plays-new-u.s.-billing-linking-policies-what-game-developers-need-to-know (2026 US billing policy changes)
- https://developer.apple.com/app-store/review/guidelines/ (Apple guideline 3.1.1)
- https://www.fenwick.com/insights/publications/apple-now-requires-disclosure-of-loot-box-odds (loot box odds disclosure)
- https://developers.google.com/admob/android/privacy/play-data-disclosure ; https://support.google.com/googleplay/android-developer/answer/10787469 (Play Data safety)
- https://developers.google.com/admob/android/privacy/gdpr (UMP/GDPR consent)
- https://www.revenuecat.com/docs/ad-monetization/rewards ; https://developers.google.com/admob/android/ssv (AdMob rewarded ad SSV + RevenueCat)
- https://github.com/RevenueCat/purchases-flutter ; https://pub.dev/packages/purchases_flutter (RevenueCat Flutter SDK)
- `CLAUDE.md` (this repo — architecture, auth flow, app metadata, admin gating references)
- Repo reuse (Section 3): confirmed by direct `grep`/`Read` of `apps/native/services/revenuecat.ts`, `apps/native/contexts/RevenueCatContext.tsx`, `apps/native/app/plans.tsx`, `apps/native/app/_layout.tsx`, `apps/native/firebase.config.ts`, `packages/api/src/games/merge-relay/commerce-*.ts`, `packages/api/src/games/merge-relay/drizzle-artifacts.ts`, `packages/db/src/schema.ts`, `scripts/games/registry-games.ts`, `scripts/games/registry-types.ts`, `apps-native/flutter-app/pubspec.yaml`, `apps-native/flutter-app/lib/main.dart` — 2026-09-25.
