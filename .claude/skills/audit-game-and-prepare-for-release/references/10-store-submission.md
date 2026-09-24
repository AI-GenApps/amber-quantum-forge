# Phase 10 — Store listing and submission

Store requirements change — **re-verify every number below against the current Play
Console / App Store Connect help pages at submission time** (a Sonnet agent with web
access, citing URLs) and note the date checked in the submission README.
Evidence/output folder: `.agents/resources/<date>/<game>-store-submission/`.

## Google Play (Android)

Account & app setup
- Developer account type (personal accounts created after Nov 2023 must run a **closed
  test with ≥12 testers opted in for 14 continuous days** before production access — verify
  current numbers). Create app: name, default language, app/game, free/paid.
- Package name = production bundle id (e.g. `app.w3dev.ludo`); signed **AAB** with Play App
  Signing; upload key kept outside the repo (`ANDROID_KEYSTORE_PATH` etc. for `games:build
  --mode aab`). Target API level must meet the current yearly requirement.
Store listing
- App name ≤ 30 chars; short description ≤ 80; full description ≤ 4000.
- App icon 512x512 PNG (32-bit); **feature graphic 1024x500** (JPG/24-bit PNG, no alpha).
- Phone screenshots: 2–8, PNG/JPG, each side 320–3840 px, max aspect 2:1; games should
  provide ≥4 at 1080p+ (portrait 9:16 for portrait games) to be eligible for promotion.
  Optional: 7"/10" tablet screenshots, promo video (YouTube URL).
- Category (Game → Board), tags, contact email, website (optional), privacy policy URL.
App content (Policy)
- Privacy policy (hosted URL), **Data safety form** (what's collected: e.g. device IDs,
  app interactions, crash logs via Firebase; encryption in transit; deletion request path),
  ads declaration, **content rating questionnaire (IARC)**, target audience & content
  (if under-13s are targeted → Families policy), news app = no, government app = no,
  financial features = no, health = no.
Release
- Internal testing → closed testing (testers list/Google Group) → production; release
  notes per track; pre-launch report review; staged rollout percentage.

## Apple App Store (iOS, if applicable)

- Apple Developer Program; bundle id + App ID capabilities (Game Center if used, Sign in
  with Apple required only if other third-party logins exist — Google sign-in → consider
  Sign in with Apple requirement); certificates/profiles; archive via Xcode or `games:build
  --platform ios --mode ipa` with `IOS_DISTRIBUTION_TEAM`/`IOS_EXPORT_OPTIONS_PLIST`.
- App Store Connect: name ≤ 30, subtitle ≤ 30, promotional text ≤ 170, description ≤ 4000,
  keywords ≤ 100 (comma separated), support URL, marketing URL (optional), privacy policy URL,
  copyright, category (Games → Board), age rating questionnaire, **App Privacy
  ("nutrition label")**, export compliance (encryption: standard HTTPS only → exempt),
  content rights, pricing/availability.
- Screenshots: required 6.9" iPhone set (1320x2868 or 1290x2796 portrait), 1–10 per
  locale; 13" iPad set if iPad is supported. App previews optional (15–30 s).
- TestFlight internal/external testing; App Review info: notes, demo steps (guest play
  needs no account), contact.

## Edited store screenshots (both stores)

Raw device captures are not enough. Produce **marketing screenshots**:
1. Capture clean device screens (release build, realistic mid-game states: board with
   tokens spread, capture moment, win/confetti, lobby, online room code, pass-and-play) at
   1080x2400 (Android) and the iPhone 6.9" resolution (iOS, from a physical device or by
   rendering the app at that size).
2. Compose frames with PIL (or generated background art): brand background, a device
   frame or rounded screen with shadow, **headline caption** (≤ 5 words, e.g. "Play with
   friends online", "Smart bots, 3 levels", "Classic & Quick modes", "No ads. Just Ludo."),
   optional sub-caption, consistent font (the game's display font), safe margins.
3. Export exact sizes per store; ordering tells a story (hero → modes → social → feel →
   polish). Keep text claims true (no "online" caption if online isn't live).
4. Dry run first: caption list + one composed sample for approval, then the full set.
5. Save sources, captions, and outputs under the submission folder with a README.

## Submission README checklist

Listing copy (all fields, char counts), assets (paths + sizes), forms answers (data
safety, content rating, privacy labels), privacy policy URL, build numbers, tracks,
testers, dates, and what the human must click/confirm. Final submission and any payment,
legal attestations, or account-level actions are **human-only** steps.
