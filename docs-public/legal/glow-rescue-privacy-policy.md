---
title: Glow Rescue Privacy Policy
---

# Glow Rescue Privacy Policy

**Last updated: 2026-10-16**

Glow Rescue (package name `app.w3dev.mergerelay`) is a single-player tile-merge
puzzle game. This page explains what the app does — and does not — do with
your data.

<Note>
This policy's hosting URL has not been assigned yet; publishing it (and
filling in the support contact below) is a human step before submission.
See the app's release checklist for status.
</Note>

## Summary

- **No account is required.** You can open the app and play immediately.
- **No data leaves your device.** The game itself makes no network calls in
  this version of the app. The app bundles Google's Play Games Services
  library, but it is switched off and never started in this version (see
  "Google Play Games Services library" below).
- **No ads. No in-app purchases.** There is nothing to buy and nothing is
  monetized.
- **No crash reports are sent anywhere.** Crash reporting is currently a
  no-op — see "Crash reporting" below.

## Information we collect

Glow Rescue does not collect, store on a server, or transmit any personal
information, device identifiers, advertising identifiers, location data,
contacts, photos, or usage analytics. The app has no account system and no
way to identify you.

The app keeps a small amount of in-app diagnostic data (for example, which
move you just made) only in memory, for the current play session. This data
is never written to a file, never leaves the app process, and is discarded
when you close the app.

This describes what the game's own code does. The app also bundles Google's
Play Games Services library, which this version never starts; see the section
below for what that means now and what changes when it is turned on.

## Data stored on your device

Your game progress (which boards you've cleared, your best scores, and your
settings) is saved to a file in the app's private storage area on your
device. This save file:

- never leaves your device,
- is not readable by other apps,
- is deleted automatically if you uninstall the app or clear the app's
  storage from your device's Settings app.

There is currently no cloud backup or sync for this save data. The app's
Android manifest sets `android:allowBackup="false"` and its backup and
data-transfer rules exclude all app data, so the app does not opt in to
Android's cloud backup or device-to-device data transfer. If you uninstall
the app or switch devices, your progress does not carry over.

## Crash reporting

This version of Glow Rescue does not send crash reports, error logs, or any
other diagnostic information to us or to any third party. The app's
crash-reporting code path exists but is wired to a "do nothing" handler in
this release. If a future release adds real crash reporting, this policy
will be updated first, and the update will say plainly what is collected,
which provider it goes to, and how to opt out where the provider requires
that.

## Advertising and analytics

Glow Rescue contains no advertising SDK and no analytics SDK that
communicates with a server. The only Google SDK we added to the app is the
Play Games Services library described below. That library ships with other
Google Play services components that are part of it or its dependencies,
such as `GoogleApiActivity` (from `play-services-base`) and
`GamesResolutionActivity` (from the Play Games SDK); they are not started by
the game in this version. How Google counts these components for disclosure
purposes should be verified in Play Console help. We do not show ads, and we
do not track you across other apps or websites.

## Google Play Games Services library

The app bundles Google's Play Games Services (PGS) library
(`com.google.android.gms:play-services-games-v2`), so that leaderboards and
achievements can be added in a later version. In this version it is turned
off:

- The game never starts the library. Its automatic start-up component is
  removed from the app, and every game call into it is behind a switch that is
  off in this version.
- The game does not ask you to sign in to Google Play Games, and it does not
  send or request any leaderboard, achievement, or player data.
- The game makes no network request for this feature. The app does not have a
  Play Games application id configured in this version (this holds for builds
  made without a `MERGE_RELAY_PGS_<ENV>_APPLICATION_ID` environment variable,
  which is how the released build is made).

If a later version turns PGS on, the app would use your Google Play Games
player profile (a Play Games player id) to sign you in, and leaderboard and
achievement data would be handled by Google under Google's own terms and
privacy policy. If that happens, this policy will be updated before that
version is released, and will say what is collected and why.

The bundled library also adds two entries to the app's Android manifest that
you may see in tools that list app components: a declaration that the app may
look up the Google Play services and Google Play Store packages on your
device, and a component that Android uses for Play Games app shortcuts. These
do not collect data on their own in this version.

## In-app purchases

This version of Glow Rescue has no in-app purchases and no monetization of
any kind.

## Network permission

The Android app declares the `INTERNET` permission. It is present for a
social/multiplayer feature (challenge links between players, and the Play
Games Services library described above) that is built into the app but
turned off in this release — the game's code never uses this permission while
that feature is disabled, and makes no network request. If that feature is
turned on in a future release, this policy will be updated to describe exactly
what it sends and to whom before that release ships.

The app's merged Android manifest also lists one other permission,
`app.w3dev.mergerelay.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`. It is added
by an Android support library, is a signature-level permission that only this
app can hold, and gives access to no personal data.

## Children's privacy

Glow Rescue does not knowingly collect any personal information from
anyone, including children. Because the app collects no personal
information at all, it does not require special handling to comply with
children's privacy laws such as COPPA; if that changes in a future release,
this policy will be updated accordingly.

## Changes to this policy

If a future version of Glow Rescue changes what it collects or how it
behaves online (for example, turning on the social/multiplayer feature or
Google Play Games Services described above, or adding crash reporting or
ads), we will update this
page and change the "Last updated" date at the top before that version is
released.

## Contact

Support contact: **TBD** (a human step — see the app's release checklist).
