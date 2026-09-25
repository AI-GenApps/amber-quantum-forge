# Merge Relay — store listing answer bank

Answers for Google Play Console (now) and App Store Connect (later). All fields are
**TBD** pending task 17 (name pick) and task 24 (release readiness). Draft copy must
stay truthful: v1 has no relays, no PGS, no ads, no IAP — do not advertise them.

## Identity

| Field | Answer |
|---|---|
| App name (≤30) | **TBD** — final name chosen at task 17 (candidates from task 14, strict uniqueness check) |
| Package name | `app.w3dev.mergerelay` (production), `app.w3dev.mergerelay.debug` (debug) |
| Developer name / account | **TBD** |
| Default language | **TBD** (English (United States) expected) |
| App or game | Game |
| Category | Puzzle |
| Free or paid | Free (no ads, no IAP in v1) |
| Contact email / website | **TBD** |
| Privacy policy URL | **TBD** (see `open-questions.md`) |

## Listing copy (drafts)

- **Short description (≤80):** **TBD** — written after the rename (task 17/18); must
  reflect solo-only v1 (no "play with friends" claim while relays are gated off).
- **Full description (≤4000):** **TBD** — outline once name is picked: hook (character
  tiles, Threes!-grade feel) · modes (Rescue 60-board/6-chapter campaign, Daily,
  Endless) · no ads, no IAP · offline play.
- **App Store (later):** subtitle, keywords — **TBD**.

## Graphics

| Asset | Spec (verify) | Source |
|---|---|---|
| App icon | 512×512 PNG | **TBD** — logo/icon dry run is task 19, final task 22 |
| Feature graphic | 1024×500, no alpha | **TBD** |
| Phone screenshots | 4–8 edited, 9:16, ≥1080 px | **TBD** — after art-set integration (task 23), device pass task 25 |
| iOS screenshots (later) | 6.9" set | **TBD** |

## Content rating (IARC questionnaire) — expected answers

| Topic | Answer |
|---|---|
| Violence / fear / sexuality / language / drugs | None expected |
| Gambling | None — no coin tables, no random paid items in v1 |
| User interaction | No — solo only in v1, no chat, no matched strangers |
| Shares location | No |
| Digital purchases | No (v1 has no IAP) |
| Ads | No (v1 has no ads) |

## Target audience & content

**TBD** — likely broad/all-ages given no gambling, no ads, no online interaction; needs
confirmation at task 24.

## Data safety form (Google Play) — expected answers (verify against final SDK list)

| Data type | Collected? | Purpose | Notes |
|---|---|---|---|
| User IDs | No (v1) | — | No server identity required for local-save-only v1 |
| Purchase history | No (v1) | — | No IAP in v1 |
| App interactions / diagnostics | **TBD** | — | Depends whether crash reporting (task 24) is wired before submission |
| Device or other IDs (advertising ID) | No (v1) | — | No ads in v1 |
| Location, contacts, photos, messages, camera, microphone | No | — | Not used |

Security / deletion / third parties: **TBD**, finalized at task 24.

## Ads declaration & consent

Contains ads: **No** (v1).

## In-app products

None in v1. See `economy.md` for what is deferred to v1.1.

## Permissions (Android)

**TBD** — expect a minimal manifest (no camera/location/contacts) since v1 is local-save
only; verify the final merged manifest at task 24.

## Testing & release

**TBD** at task 24 (release readiness: privacy, data safety, listing, signing docs).

## FAQ for support/reviews

- *Can I play offline?* Yes — v1 is entirely offline, local-save only.
- *Can I play with a friend?* Not in v1; friend relays are planned for a future update.
- *Are there ads or purchases?* No — v1 has neither.
