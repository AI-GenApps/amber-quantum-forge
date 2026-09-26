# Merge Relay — store listing answer bank

Answers for Google Play Console (release priority) and App Store Connect (later, paused
until after Google Play publication). Items marked **TBD** must be decided/confirmed before
submission; items marked **verify** depend on current store rules (re-check at submission).
Draft copy must stay truthful: nothing here claims features that are not live in the
submitted build — per repository policy this game is not store-configured yet
(`storeProductIds: {ios: null, android: null}`, `lifecycle: "concept"`).

## Identity

| Field | Answer |
|---|---|
| App name (≤30) | Merge Relay |
| Package name | `app.w3dev.mergerelay` (same value used for iOS bundle ID; registration status: unverified) |
| Developer name / account | **TBD** (W3Dev account) |
| Default language | English (United States) — **TBD** add others later? |
| App or game | Game |
| Category | Puzzle |
| Free or paid | Free (contains in-app purchases) — **TBD** confirm once IAP is live |
| Contact email / website | **TBD** |
| Privacy policy URL | **TBD** |

## Listing copy (drafts — placeholder until epic reaches a polished milestone)

- **Short description (≤80):** `Merge tiles, beat the clock, challenge friends to a relay.`
  (registry subtitle: "Merge tiles. Challenge friends" — keep consistent).
- **Full description (≤4000):** outline only — hook (a fast, clean merge puzzle) · modes
  (Rescue boards with a move budget, Daily challenge, Endless, Relay challenges you send to
  friends) · fair play (server-verified moves and results) · cosmetics only, no forced ads ·
  offline-capable core play. Do **not** mention online multiplayer/PGS/achievements until
  those gates are enabled. Write final copy once the client milestone is verified on device.
- **App Store (later):** subtitle, keywords — **TBD**, draft after Android listing is
  finalized (per release sequencing, iOS work is paused).

## Graphics

| Asset | Spec (verify) | Source |
|---|---|---|
| App icon | 512×512 PNG | **TBD** — no logo rendered yet; see `.agents/resources/2026-09-26/merge-relay-brand/logo-briefs.md` |
| Feature graphic | 1024×500, no alpha | **TBD** |
| Phone screenshots | 4–8 edited, 9:16, ≥1080 px | **TBD** — existing evidence under `docs-internal/gaming/evidence/visual/` is QA capture, not edited/captioned store screenshots |
| iOS screenshots (later) | 6.9" set | **TBD** |

## Content rating (IARC questionnaire) — expected answers

| Topic | Answer |
|---|---|
| Violence / fear / sexuality / language / drugs | None expected |
| Gambling | **No** — cosmetic-only IAP (theme pack), no stakes/currency wagering designed into the economy |
| User interaction | Limited — challenge codes/deep links between known contacts, report/block exists (MR-13); no free-text chat, no open matchmaking with strangers described in sources |
| Shares location | No |
| Digital purchases | Yes (in-app purchases — cosmetic theme pack) |
| Ads | **TBD** — registry lists `ads` capability but rewarded-ad SSV is not implemented; declare only once live |

## Target audience & content

Target age group: **TBD** — likely general/all-ages given no violence/gambling/chat surface,
but not yet confirmed against a completed IARC questionnaire.

## Data safety form (Google Play) — expected answers (verify against final SDK list)

| Data type | Collected? | Purpose | Notes |
|---|---|---|---|
| User IDs (guest subject, optional account link) | Yes | App functionality, account management | guest identity + optional upgrade per MR-08 |
| Purchase history | Yes (once native Billing ships) | App functionality (grants, restore) | via Google Play Billing |
| App interactions / in-app actions | Likely yes | Analytics | MR-14 telemetry (create/open/start/complete/return events) — not yet fully reconciled |
| Crash logs / diagnostics | **TBD** | — | not mentioned as implemented in sourced docs |
| Device or other IDs (advertising ID) | **TBD** | Advertising | only if/when AdMob ships |
| Location, contacts, photos, messages | No | — | no such capability referenced |
Security: **TBD** confirm encryption in transit. Deletion path: **TBD** (required).
Third parties: Google Play Billing (commerce), possibly Google Play Games Services v2
(platform identity) once configured.

## Ads declaration & consent

**TBD** — declare "Contains ads" only once AdMob/rewarded ads are actually integrated and
enabled; currently not implemented.

## In-app products (to create in Play Console)

| Product | ID | Type | Price |
|---|---|---|---|
| Theme pack | `merge_relay_theme_pack_v1` (server entitlement `merge_relay.theme_pack.v1`) | one-time (non-consumable) | **TBD** — not priced/registered in Play Console yet |

## Permissions (Android)

Registry declares `permissions: noPermissions` — no Android/iOS permissions currently
declared. **Verify** final merged manifest once native PGS/Billing/AdMob SDKs are added
(they typically require INTERNET and possibly billing/ad-ID permissions).

## Testing & release

**TBD** — no Play Console track configured; internal testing → closed testing → production
progression has not started. No PGS testers, no signing fingerprints registered.

## App review notes (App Store, later)

**TBD** — deprioritized until after Google Play publication.

## FAQ for support/reviews

- *Is it real-money gambling?* No — the only planned purchase is a cosmetic theme pack; no
  currency stakes are designed into the economy.
- *Can I play offline?* Core rescue/endless play is designed to be local-deterministic;
  relay/daily require a server round-trip. **Verify** exact offline behavior once client
  wiring (task 03) lands.
- *What is a "relay"?* A challenge code/link a player sends to a friend from a board they
  played; the friend gets a bounded (≤3-move) continuation and can send a reciprocal result
  back.
- *Restore purchases?* **TBD** — no native Billing SDK yet.
