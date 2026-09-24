# Ludo Vortex — store listing answer bank

Answers for Google Play Console (now) and App Store Connect (later). Items marked
**TBD** must be decided/confirmed before submission; items marked **verify** depend on
current store rules (re-check at submission). Draft copy must stay truthful: don't
advertise online play or features that aren't live in the submitted build.

## Identity

| Field | Answer |
|---|---|
| App name (≤30) | Ludo Vortex |
| Package name | `app.w3dev.ludo` |
| Developer name / account | **TBD** (W3Dev account) |
| Default language | English (United States) — **TBD** add Hindi later? |
| App or game | Game |
| Category | Board |
| Free or paid | Free (contains in-app purchases) |
| Contact email / website | **TBD** |
| Privacy policy URL | **TBD** (hosted page; draft in task 27/26i) |

## Listing copy (drafts)

- **Short description (≤80):** `Roll, race & capture! Classic and Quick Ludo vs bots, friends and players online.`
  (drop "online" until online is live).
- **Full description (≤4000):** outline — hook (Ludo, reimagined with vivid 3D-style art) ·
  modes (vs Computer with 3 bot levels, Pass N Play, Play with Friends, Online) · rules
  (Classic + Quick: one token home + one capture) · progression (levels, daily rewards,
  collectible dice/token/board themes) · fair play (server-verified dice online) · no
  forced ads (optional rewarded ads only) · offline play. Write final in task 27/28.
- **App Store (later):** subtitle (≤30) `Classic & Quick Ludo Party`; keywords (≤100)
  `ludo,dice,board game,parchisi,pachisi,family,friends,multiplayer,classic,quick` — **verify**
  no competitor trademarks in keywords.

## Graphics

| Asset | Spec (verify) | Source |
|---|---|---|
| App icon | 512×512 PNG | `logo/token-orbit-icon.png` master |
| Feature graphic | 1024×500, no alpha | wide wordmark v1 + vortex background (to compose) |
| Phone screenshots | 4–8 edited, 9:16, ≥1080 px | device captures + captions (task 27/28, dry run first) |
| iOS screenshots (later) | 6.9" set | — |

Caption ideas: "Classic & Quick modes" · "Smart bots, 3 levels" · "Play with friends" ·
"Collect dice & board themes" · "No forced ads".

## Content rating (IARC questionnaire) — expected answers

| Topic | Answer |
|---|---|
| Violence / fear / sexuality / language / drugs | None |
| Gambling | **Simulated gambling: Yes** — online coin tables use virtual coins as stakes (coins can be bought with real money but can **never** be cashed out). No real-money gambling. Expect a higher age rating in some regions — **verify** outcome. |
| User interaction | Yes once online/rooms live (players matched with strangers); no free-text chat in v1 (**TBD** if quick-chat/emoji added) |
| Shares location | No |
| Digital purchases | Yes (in-app purchases) |
| Ads | Yes (rewarded ads only) |

## Target audience & content

Target age groups: **13+** recommended (simulated gambling + IAP + online) — **TBD**
confirm; not designed for children → Families policy does not apply. Declare "Contains ads: Yes".

## Data safety form (Google Play) — expected answers (verify against final SDK list)

| Data type | Collected? | Purpose | Notes |
|---|---|---|---|
| User IDs (Firebase anonymous UID, account link) | Yes | App functionality, account management | required for online/economy |
| Name (player nickname) | Yes (user-provided display name) | App functionality | not real name |
| Email (only if Google account linked) | Yes, optional | Account management | via Google Sign-In |
| Purchase history | Yes | App functionality (grants, restore) | via RevenueCat / Play Billing |
| App interactions / in-app actions | Yes | Analytics | telemetry events |
| Crash logs / diagnostics | Yes | App functionality / analytics | crash reporting (task 27) |
| Device or other IDs (advertising ID) | Yes | Advertising | AdMob rewarded ads |
| Location, contacts, photos, messages | No | — | — |
Security: data encrypted in transit (HTTPS). Deletion: provide in-app/URL request path — **TBD** (required).
Third parties: Google (Firebase, AdMob, Play Billing), RevenueCat.

## Ads declaration & consent

Contains ads: Yes (rewarded, opt-in). Google UMP consent in EEA/UK; privacy options
entry in Settings. No ads targeted to children.

## In-app products (to create in Play Console)

See `economy.md` → IAP table; record final product IDs here after task 26i:
| Product | ID | Type | Price |
|---|---|---|---|
| Starter Pack | **TBD** | one-time (consumable, purchasable once) | ₹49 |
| Coins S/M/L | **TBD** | consumable | ₹99/₹399/₹1,499 |
| Diamonds S/M/L | **TBD** | consumable | ₹149/₹699/₹1,699 |
| Vortex Pass | **TBD** | subscription (monthly) | ₹199 |

## Permissions (Android)

INTERNET; `com.google.android.gms.permission.AD_ID` (AdMob); billing
(`com.android.vending.BILLING`); VIBRATE. No location/camera/contacts. **Verify** final merged manifest.

## Testing & release

Internal testing → closed testing (**personal accounts: ≥12 testers for 14 days — verify
account type**) → production. Pre-launch report review. License testers for IAP.

## App review notes (App Store, later)

Guest play needs no login; describe how to reach store/purchases; RevenueCat sandbox;
no external payment links; coins not redeemable for money.

## FAQ for support/reviews

- *Is it real-money gambling?* No — coins/diamonds are virtual, not cashable.
- *Can I play offline?* Yes — vs Computer and Pass N Play (XP syncs when online).
- *Why do I need a 6?* Classic/Quick rules: a 6 releases a token from the yard.
- *How do I win Quick mode?* Get one token home and capture at least one opponent.
- *Restore purchases?* Store → Restore (via Google/Apple account).
