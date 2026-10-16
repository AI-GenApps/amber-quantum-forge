# Street Royale — store listing answer bank

Final answers for Google Play Console (first) and App Store Connect (later), completed at task 21
and checked against the shipped code. Length limits are enforced by
`apps-games/city-drive/test/release/storeListing.test.ts`, which reads the fenced `text` blocks
below (each block is headed by its field name). Edit the copy here, never in the console only.

v1 is offline-only: no accounts, no ads, no in-app purchases, no analytics. Listing copy must stay
truthful to that. Evidence for every "no data" claim:
`.agents/resources/2026-10-15/city-drive-qa/21/no-data-audit.txt`.

## Identity

| Field | Answer |
|---|---|
| App name (30 max) | **Street Royale** (13). Trademark clearance still to do (human, before submission) |
| Package / bundle id | `app.w3dev.citydrive` (shipped in the Android and iOS projects, task 17) |
| Developer name / account | **TBD (human, task 22)** |
| Default language | English (United States) |
| App or game | Game |
| Free or paid | Free (no ads, no IAP) |
| Contact email / website | **TBD (human, task 22)** |
| Privacy policy URL | **TBD (human, hosting)**. Content: `docs-public/legal/street-royale-privacy-policy.md`; publish it and paste the URL |

## Category

**Play: Games > Racing.** App Store: primary Games, subgenre Racing; secondary Simulation.

Justification, from the store pages of the five competitors in the task 00 research (read
2026-10-16, `.agents/resources/2026-10-15/city-drive-qa/21/competitor-categories.txt`):

| Competitor | Play category |
|---|---|
| Dr. Driving (500M+) | Racing |
| Extreme Car Driving Simulator (500M+) | Racing |
| Drive Zone (100M+) | Racing |
| Car Parking Multiplayer (100M+) | Simulation |
| Taxi Car Simulator: EVO (10M+) | Simulation |

Three of five, including both 500M+ titles, sit in Racing, and a driving game with a time trial,
free roam and a car garage is found by players browsing Racing. Simulation is the home of
parking-only and taxi-only games; Street Royale mixes four mission types, so Racing is the broader
fit. Revisit after launch if search data says otherwise.

## Listing copy

### Title

```text
Street Royale
```

### Short description

```text
Drive a low-poly city, take missions and unlock cars. Offline, no ads.
```

### Full description

```text
Street Royale is a free-roam driving game set in a small low-poly city. Pick your own route, find the glowing mission markers and earn stars, coins and new cars.

WHAT YOU DO
- Free roam: cruise the streets with no timer and no rules, or head for a marker when you feel like a challenge.
- Four kinds of mission: deliver parcels across town, pick up taxi fares and ride them smoothly, race a checkpoint route against the clock, and squeeze into tight parking bays.
- Earn 1 to 3 stars on every mission. Beat the par time, drive cleanly and finish with a flourish.
- Three districts to explore: Old Town, Harbor and Downtown. Collect stars to open the next district, each with its own streets, traffic and 8 missions.
- Spend the coins you earn on new cars in the garage. Every car handles a little differently.

BUILT TO BE LEFT ALONE
- Works fully offline. No sign-in, no account.
- No ads and no in-app purchases. Everything is earned by playing.
- No data is collected. Your progress is saved on your device only.
- Landscape controls designed for touch: steer, gas, brake and handbrake. Keyboard and gamepad also work on supported devices.

Other cars share the roads, so keep your eyes open at junctions. Bumping into other cars is cartoon-style and harmless, but it costs you stars on missions that check for damage.

Street Royale is a one-time free download for everyone. Jump in, pick a marker and drive.
```

## Keywords and tags

| Store | Field | Value |
|---|---|---|
| Play | Tags (up to 5, choose the nearest predefined tags in the console) | Racing, Driving, Car, Offline, Simulation |
| App Store | Subtitle (30 max) | see below |
| App Store | Keywords (100 max, comma separated) | see below |
| App Store | Promotional text (170 max) | see below |

### App Store subtitle

```text
Free-roam city driving
```

### App Store keywords

```text
driving,car,city,taxi,parking,delivery,offline,missions,open world,drive,low poly
```

### App Store promotional text

```text
Free-roam a low-poly city, take delivery, taxi, time trial and parking missions, and unlock new cars. Fully offline, no ads, no purchases.
```

## Declarations

| Topic | Answer | Checked against |
|---|---|---|
| Contains ads | **No** | no ad SDK in either `package.json`; `test/release/noData.test.ts` |
| In-app purchases | **No** | no purchase plugin; coins are earned only and cannot be bought |
| Accounts / sign-in | None | no auth code |
| Data collected or shared | None | no network call except loading bundled assets, see `noData.test.ts` |
| Permissions (Android) | `INTERNET` only (see below) | `AndroidManifest.xml`; the test pins the list |
| Permissions (iOS) | None; no usage-description strings | `Info.plist` |
| Target audience | **13 and up** for the first release (decision for the owner at task 22) | see below |
| Orientation | Landscape | manifest `sensorLandscape`, screen-orientation plugin |
| Device features | Touchscreen, optional gamepad; WebGL2 required | |

`INTERNET` is declared by Capacitor's template and the WebView needs it to be allowed to load.
The app makes no request to any server. The Android template also sets `allowBackup="true"`, so
Android Auto Backup may copy the on-device save to the user's own Google backup; the developer
never receives it, so Data Safety still answers "no data collected".

Target audience: choosing an age band that includes under-13s opts into the Google Play Families
Policy (extra review, certified SDKs). The game has no ads or SDKs, so it would pass, but it is a
decision for the owner at task 22. Default recommendation: 13+ for the first release.

## Content rating (IARC questionnaire)

| Question | Answer |
|---|---|
| Violence (any depiction) | No. Cars bump into each other with no injury, no blood and no pedestrians. Expect the "cartoon / fantasy" car-collision note at most |
| Sexual content or nudity | No |
| Profanity or crude humour | No |
| Controlled substances (drugs, alcohol, tobacco) | No |
| Gambling or simulated gambling | No. Coins are earned, cannot be bought and never wagered |
| Fear / horror themes | No |
| Users can interact or exchange content | No. No chat, no multiplayer, no user-generated content |
| Shares user location | No |
| Allows purchases of digital goods | No |
| Unrestricted web access | No |

Expected result: ESRB Everyone, PEGI 3, USK 0, IARC Generic 3+. Confirm the generated ratings in the
console; the questionnaire is answered by the human at task 22.

## Google Play Data safety

| Section | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data collected by your app encrypted in transit? | Not applicable (no data collected) |
| Do you provide a way for users to request that their data be deleted? | Not applicable; uninstalling removes the save |
| Data types | None collected, none shared |
| Independent security review | Not claimed |
| Privacy policy | Required; URL from the identity table |

## App Store privacy nutrition label

**Data Not Collected.** Select "No, we do not collect data from this app". Nothing is linked to the
user, nothing is used to track, and the app contains no third-party SDK that collects data. The
privacy policy URL is still required in App Store Connect.

Open: the iOS project has no `PrivacyInfo.xcprivacy`. Capacitor's Preferences plugin stores the
save in `UserDefaults`, a "required reason" API (category `NSPrivacyAccessedAPICategoryUserDefaults`).
It is tracked in `open-questions.md` and fixed on a Mac before the first TestFlight upload.

## Graphics

| Asset | Spec | Status |
|---|---|---|
| App icon | 512x512 PNG for Play; iOS sizes via the asset catalog | Done (task 20), generated from variant 1b |
| Feature graphic | 1024x500 PNG, no alpha | TODO (human, task 22) from the hero-car art; not generated by an agent |
| Screenshots | See the plan below | Captured by the human at task 22 |

## Screenshot plan

Eight shots in total. Play needs at least 2 per device class; the App Store takes up to 10. Capture
all eight on a phone (16:9 landscape, for example 1920x1080), then repeat the starred shots on a
7-inch and a 10-inch tablet. Agents do not capture screens or use a browser; this is human task 22.
Captions are overlays added in the console graphics tool or any editor, not part of the game.

| # | Class | Scene | State to set up | Caption |
|---|---|---|---|---|
| 1 | phone, 7", 10" | District 1, Old Town, chase camera | Free roam at speed, a mission marker ahead, HUD visible, starter City Sedan | Free-roam the city |
| 2 | phone, 7", 10" | District 1 junction | Delivery in progress: route line, timer and parcel icon in the HUD | Deliveries, taxis, time trials and parking |
| 3 | phone | District 2, Harbor | Time trial mid-run, checkpoint ring ahead, timer running | Race the clock |
| 4 | phone | Parking mission | Car lining up with the bay, bay highlighted | Squeeze into tight spots |
| 5 | phone, 7", 10" | Results screen | A 3-star result with coin payout | Earn stars and coins |
| 6 | phone, 7", 10" | Garage | A locked car and an unlocked car, coins balance visible | Unlock new cars |
| 7 | phone | Map / home screen | All three districts, one locked with its star requirement | Three districts to open |
| 8 | phone | District 3, Downtown | Dense grid with traffic around the player | Offline. No ads. |

Capture rules: use the final build, a fresh save for shots 1, 2, 6 and 7 (plus a save with stars for
5 and 7), hide any debug overlay (no `?fps`), and keep the HUD safe-area visible.
