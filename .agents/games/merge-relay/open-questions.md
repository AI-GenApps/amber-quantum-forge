# Merge Relay — open questions & launch blockers

| # | Question / blocker | Owner | Blocks |
|---|---|---|---|
| 1 | **Final public name** — the strict uniqueness check (task 14) proposes candidates; the human picks at task 17 | user | branding (task 18), listing, everything downstream of the name |

## Task 14 name shortlist (strict uniqueness check, 2026-09-27)

30 candidates checked (Google Play, App Store, web/itch.io/Steam,
trademark glance); 14 came back NOT FOUND. Ranked shortlist for the
human pick at task 17, full evidence in
`.agents/resources/2026-09-25/merge-relay-brand/name-check.md` and
`shortlist.json`:

1. **Glow Rescue** — merge sleepy tile friends until they glow, and rescue them.
2. **Drowsy Drift** — sleepy tile friends drift together until they merge.
3. **Cuddle Cove** — a cozy cove where rescued tile friends cuddle up.
4. **Twinkle Cove** — tiles twinkle to life in a cozy cove.
5. **Snug Convoy** — a snug little caravan of rescued friends traveling together.
6. **Bundle Rescue** — bundle tiles together to rescue them.
7. **Lantern Cove** (backup) — a lantern-lit cove that guides rescued friends home.
8. **Ember Convoy** (backup) — a warm little caravan crossing every chapter.

Rejected (hard conflicts): all "Huddle X" names (existing "Huddle Tiles"
mini-game in the published "Huddle Games" app), "Nestle X" (Nestlé
trademark), "Cozy Caravan" (exact-title published game), "Lantern Trail"
("PocketQuest: Lantern Trail" on the App Store). Held back as UNSURE:
"Cozy Convoy"/"Cozy Cluster" (saturated "Cozy X" pattern in this genre),
"Dreamers Trail" (close to Steam's "Dreamy Trail").
| 2 | **Crash reporting vendor** — still undecided (Firebase Crashlytics vs Sentry). Task 24 added the interface + `NoOpCrashReporter` seam (`apps-native/games/merge_relay/lib/src/crash/merge_relay_crash_reporter.dart`), wired into `main.dart`'s global error handlers, so no SDK/credentials are needed to ship v1 and a vendor can be dropped in later with no call-site changes. | user | picking + wiring a real vendor is a v1.1+ decision, not a v1 blocker |
| 3 | **Privacy-policy URL host** — page content is done (`docs-public/legal/glow-rescue-privacy-policy.md`, task 24); only the hosting URL (where the public docs site is deployed) and the support-contact line on that page are open | user | listing (Play Console "Privacy policy" field) |
| 4 | **Play developer account owner** — which account submits this app | user | production release |
| 5 | Logo + icon direction (task 19 dry run, human pick at task 21) | user | **resolved** — icon A + wordmark B picked at task 21, integrated task 22 (`decisions-log.md`) |
| 6 | Art-set direction: character tiles + home scene (task 20 dry run, human pick at task 21) | user | **resolved** — direction B picked at task 21, integrated task 23 (`decisions-log.md`) |
| 7 | v1.1 timeline for friend relays / PGS / commerce (deferred scope in `economy.md`) | user | not a v1 blocker; tracked for later |
| 8 | Content rating / target audience confirmation once no-ads/no-IAP is final | task 24 | **resolved** — answered in `store-listing.md` ("Content rating" and "Target audience & content"); broad/all-ages, no gambling/ads/user-interaction |
| 9 | Data safety form final answers | task 24 | **resolved** — answered in `store-listing.md` ("Data safety form"), every row cited against the shipped code (crash reporting is the no-op above, so "app info and performance" is "No") |
| 10 | Signing key / release track configuration | user / task 24 | guide written (`docs-internal/gaming/merge-relay-release-plan.md`, "Glow Rescue v1 solo release" section, task 24); generating the real upload keystore and configuring `key.properties` outside git is still a human/console step |
| 11 | Human checkpoint (task 25): device pass + provisioning | user | production release |
| 12 | **Support contact / developer account email** for the store listing and the privacy-policy page | user | listing |
| L1 | **Logo/icon direction (task 19, 2026-09-27)**: three directions are in `.agents/resources/2026-09-25/merge-relay-art/logo/contact-sheet.png`, with each direction's icon, wordmark and mockups in `A-hero-glow/`, `B-merge-spark/` and `C-tower-beacon/`. **A** is the single hero glow tile (the recommended default, cleanest at 48 px); **B** is two tiles merging with a spark; **C** is a stacked tile tower with a beacon face (the most mascot personality). Mixing is allowed (e.g. A's icon with B's wordmark). No lookalike conflicts were found, and the wordmark spells exactly "Glow Rescue". The pick happens at human task 21. | user | task 22 finals |
| A1 | **Art-set direction (task 20, 2026-09-27)**: two directions are in `.agents/resources/2026-09-25/merge-relay-art/set-1/contact-sheet.png`, with sample tile faces (tiers 2/16/128/2048), a home scene, a board frame and a chapter-1 card in `raw/`, plus Home/Play/Chapter-map mockups in `direction-a/mockups/` and `direction-b/mockups/`. **A** is flat vector, continuous with task 08's code-drawn tiles. **B** is a bold, glossy painted/3D-toy style (the stronger showcase, but a bigger swing from what ships now). Both are original, and the tile alpha is verified. Note for the task 23 finals: the lower numeral zone must stay clear (B's faces sit fairly low). The pick happens at human task 21. | user | task 23 finals |
