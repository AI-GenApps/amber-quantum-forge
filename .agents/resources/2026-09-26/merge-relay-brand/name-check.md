# "Merge Relay" — strict name existence check

Date: 2026-09-26. Method: `.claude/skills/audit-game-and-prepare-for-release/references/07-brand-name-logo.md`
(Google Play search + site search, iTunes Search API `trackName`, web/APK/browser-game
portals, trademark glance). Domains not required. Fuzzy same-category matches count as
conflicts.

## 1. Google Play

- Query `"Merge Relay" game app play store` (general web) — top results are unrelated merge
  games: EverMerge (`id1446344746` / `com.bigfishgames.mergetalesgoog`), Merge Inn
  (`com.mergegame.merge`), LUDUS Merge Battle (`com.studion.mergearena`), Merge Mansion
  (`com.everywear.game5`), Merge Restyle, Dice Merge, Merge Fables. None named "Merge Relay".
- `site:play.google.com "Merge Relay"` — no matching listing. Results are unrelated:
  `Relay` (com.relaysocial.relay), `MergeKing`, `RELAY | Messaging`, `Merge Resort`,
  `Merge Legacy`.
- Verdict: **NOT FOUND** on Google Play.

## 2. Apple App Store (iTunes Search API)

- `https://itunes.apple.com/search?term=Merge%20Relay&entity=software&limit=50` — no
  `trackName` equal to or closely matching "Merge Relay". Returned unrelated merge titles:
  Chef Merge, Merge Miracle 2023, Fairyland: Merge & Magic, Merge Mermaids, Happy Merge
  Estate, Elemental Merge Game, Merge Clash: Tower Defense, Merge Camp, Fighter Merge, and
  the unrelated "T-Mobile IP Relay".
- `site:apps.apple.com "Merge Relay"` — no matching app page. Results are unrelated Relay
  (messaging/sharing) apps and unrelated "Merge Apps" developer account entries.
- Verdict: **NOT FOUND** on the App Store.

## 3. Web / APK mirrors / browser-game portals

- `"Merge Relay" itch.io OR kongregate OR steam OR apk` — no game titled "Merge Relay" on
  itch.io, Kongregate, or Steam-adjacent results. Only generic "merge"-tagged listings and
  an unrelated "Relay" game page.
- No APK-mirror or browser-portal hit for the exact phrase.
- Verdict: **NOT FOUND**.

## 4. Trademark glance

- `"Merge Relay" trademark` — no combined "Merge Relay" registration found. Separate marks
  exist for "MERGE" (Merge Labs, Inc., Reg. 5115636, VR software/games) and "RELAY" (Relay,
  Inc., Serial 98303145, communications services) individually, but no combined mark and no
  overlap in the puzzle-game category.
- Verdict: **NOT FOUND** (no formal USPTO/WIPO/India TMR search performed — recommend formal
  clearance before launch, per the skill).

## Overall verdict

**NOT FOUND** across Google Play, the App Store, web/APK/browser-game portals, and a
trademark glance. No fuzzy same-category conflict identified (all near-matches are either
generic "merge" games with unrelated full names, or "Relay" apps in unrelated categories —
messaging/communications, not puzzle games).

**"Merge Relay" is cleared to keep as the working name.** Per the skill, alternative names
are only required when the check finds a conflict — none was found, so no alternatives were
generated. Formal trademark clearance (USPTO / India TMR / WIPO) is still recommended before
store submission, consistent with the Ludo Vortex precedent.
