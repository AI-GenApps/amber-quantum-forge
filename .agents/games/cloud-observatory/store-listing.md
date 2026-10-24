# Cloud Observatory — store listing answer bank (draft)

No store submission is part of v1 (owner decision 2026-10-23). These are draft answers kept truthful
to the code so a later submission only needs them reviewed. Length limits are checked by the
release test in task 08, which reads the fenced `text` blocks below (each headed by its field name).
Edit copy here first.

v1 is offline-only: no accounts, no ads, no in-app purchases, no analytics, no network calls.

## Identity

| Field | Answer |
|---|---|
| App name (30 max) | **Cloud Observatory** (17). Working title; naming research is a later step |
| Package / bundle id | `app.w3dev.cloudobservatory` |
| Developer name / account | TBD (human, at submission) |
| Default language | English (United States) |
| App or game | Game |
| Free or paid | Free (no ads, no IAP) |
| Contact email / website | TBD (human, at submission) |
| Privacy policy URL | TBD (human). Content to say: the game stores progress on the device only and collects nothing |

## Category

**Play: Games > Simulation** (idle and incremental games sit here and in Casual; Simulation is the
closest match to building and managing an observatory). App Store: primary Games, subgenre
Simulation; secondary Puzzle (the constellation tracing layer). Tags to consider: idle, relaxing,
space, offline.

## Short description (80 max)

```text short-description
Build an observatory, chart the constellations and uncover a quiet cosmic story.
```

## Full description (4000 max)

```text full-description
Inherit a rooftop observatory and keep the night sky alive.

Cloud Observatory is a calm, beautiful incremental game. Gather starlight, build instruments that
collect it while you rest, and ink the constellations into your atlas, one star at a time.

GATHER AND BUILD
Tap the sky to gather your first starlight, then build eight instruments, from a humble Brass
Telescope to a humming Aurora Coil. Each instrument has three upgrades that multiply what it
earns. Your observatory keeps working while you are away, for up to eight hours.

CHART THE SKY
Twelve constellations wait to be drawn: the Lyre, the Crown, the Key, the Lantern, the Whale, the
Harp, the Fox, the Archer, the Serpent, the Ship, the Tower and the Owl. Tap the stars in order to
ink each one into your atlas. Every constellation makes all your starlight stronger and opens a
new page of the story.

THE ECLIPSE
When the sky is fully charted, let an Eclipse fall. Your instruments reset, but you keep your atlas
and earn Eclipse shards that buy permanent boons. Every cycle is faster than the last.

A QUIET STORY
Thirty short journal entries in six chapters follow the logbook of your Aunt Verity and the reason
the sky had grown so quiet.

EVERY EVENING A COMET
The Wandering Comet appears once a day with a new pattern to trace. Keep a streak for bigger
rewards.

MADE TO BE EASY ON YOU
No timers that punish you. No ads. No purchases. No account. No internet needed. Reduced-motion and
high-contrast options, large touch targets, and portrait play with one thumb.

Your progress stays on your device. Nothing is collected.
```

## What's new (v1.0.0)

```text whats-new
First release of Cloud Observatory.
```

## Content rating notes (IARC / App Store)

| Question | Answer |
|---|---|
| Violence, blood, fear | None |
| Sexual content, nudity | None |
| Profanity, crude humour | None |
| Drugs, alcohol, tobacco | None |
| Gambling or simulated gambling | None (no random rewards, no loot boxes) |
| User-generated content, chat | None |
| Location sharing | None |
| Digital purchases | None |
| Expected result | Everyone / PEGI 3 / App Store 4+ |

## Data safety (Google Play) and App Privacy (App Store)

| Question | Answer |
|---|---|
| Does the app collect or share user data | No data collected, no data shared |
| Data encrypted in transit | Not applicable (the app makes no network requests) |
| Account creation | None |
| Data deletion request | Not applicable; progress lives on the device and is removed on uninstall or via Settings > Reset progress |
| Third-party SDKs that collect data | None (Capacitor core plugins only: App, Haptics, Preferences, Screen Orientation, Share, Status Bar) |
| Advertising ID | Not used |
| Permissions requested | None. The Capacitor Android template declared `INTERNET`; task 07 removed it because the game makes no network calls and the bridge serves the bundled build in-process (nothing in Capacitor Android, the six plugins or the template requires it). Not proven on a device: if the app opens blank, restore the line (see evidence `07/README.md`). iOS declares no usage-description keys |
| Share feature | None in v1. The `@capacitor/share` plugin is installed (skeleton dependency) but no source file imports it, so the app never opens a share sheet. If a Share button is added later, it opens the system sheet only on tap and the game sends no data itself |
| App Store privacy label | "Data Not Collected" |

Evidence for these claims is the source audit `apps-games/cloud-observatory/test/release/no-network.test.ts`
(task 08): no `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, `importScripts`,
`CapacitorHttp`, remote URL, analytics or ad SDK name in the `src/` of the app and the core, and no
tracker, ad or analytics package in either `package.json`. The built bundle is also scanned
(`test/release/bundle.test.ts`): the only remote URLs in it are XML namespace identifiers, and the
three `fetch(` call sites are Vite's same-origin modulepreload polyfill, the kit audio loader (bundled
MP3 files) and Capacitor core's unused web HTTP plugin. The reproducible numbers are in the evidence
README `08/README.md`.

## Graphic assets for a later submission

| Asset | Source |
|---|---|
| App icon 512 / 1024 | painted master `icon` (accepted, retry round 1) at `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/icon.webp` (1024×1024). The shipped launcher icon is still the code-drawn stopgap `apps-games/cloud-observatory/resources/icon-only.png` (1024, opaque) from `scripts/build-icons.mjs`; swapping in the painted icon is open-questions row 15 |
| Feature graphic 1024×500 | art slot `feature-graphic` (accepted, retry round 3; 1536×1024 master at `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/feature-graphic.webp`, no text; cropped at submission) |
| Screenshots | Captured by the owner during browser/device QA, never by agents |
| Promo text overlays | Added at submission, not baked into art |
