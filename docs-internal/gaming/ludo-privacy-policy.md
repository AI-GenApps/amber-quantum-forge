---
title: Ludo Vortex privacy policy draft
description: Draft privacy policy text for Ludo Vortex covering accounts, purchases, advertising ID and app interactions, to be hosted publicly in task 29.
---

**Draft, not legal advice, not yet hosted.** Task 29 hosts the final text at a
public URL and Play Console and the in-app link point to it. Counsel should
review before publication. Fields in angle brackets are placeholders to fill
at hosting time. The text must stay consistent with
[`ludo-data-safety.md`](ludo-data-safety.md). Task 26i created this file
because task 27 had not yet; task 27 extends it (crash reporting, retention
periods, final contact details).

The text below is the draft policy to host.

---

# Ludo Vortex Privacy Policy

Effective date: `<date>`. Publisher: `<legal entity name>`, `<address>`.
Contact: `<privacy contact email>`.

Ludo Vortex ("the app") is a board game you can play against the computer, with
friends on one device, and online. This policy explains what information the
app and our servers handle and why.

## Information we collect

**Account and identifiers.** The app signs you in as a guest with Firebase
Authentication, which creates an anonymous user ID. If you choose to link a
Google account, we also receive your Google account email and ID from Google.
We create a game player ID from this for our servers.

**Profile.** The display name and avatar you pick. Other players in an online
match can see them. Do not use your real name if you do not want it shown.

**Game data.** Matches you play online, their moves and results, your level and
XP, your coin and diamond balances and the history of changes to them, the
themes you own, and your daily reward streak. This is stored on our servers so
the game is fair and your progress survives reinstalling.

**Purchase history.** When you buy coins, diamonds, a starter pack or the
Vortex Pass subscription, the purchase is processed by Google Play. We use
RevenueCat to manage purchases and subscriptions. RevenueCat and our servers
receive your player ID, the product bought, the time, an order or transaction
ID, and whether it was refunded or cancelled. **We do not receive or store
your payment card or billing details**; Google Play handles them.

**Advertising ID and ad data.** If you watch an optional rewarded video ad, the
app uses Google AdMob. AdMob and its partners may collect your device's
advertising ID, IP address-derived approximate location, device and app
information, and ad interaction data to serve and measure ads and prevent
fraud. Where the law requires it (for example in the EEA and UK), we ask for
your consent first through a Google consent form before the first ad. You can
reset or delete your advertising ID in your Android settings, and you can
decline ads at any time because ads are optional. Our server also receives a
verification message from AdMob with your player ID so we can grant the reward
and not grant it twice.

**App interactions and diagnostics.** The app records what you do in it, such
as starting or finishing a match or opening the store, using a fixed set of
event fields that never include free text such as your display name. `<If crash
reporting ships: we also collect crash reports and diagnostics to fix bugs.>`

We do not collect your precise location, contacts, photos, files, microphone or
messages.

## What coins and diamonds are

Coins and diamonds are virtual items inside the game. They have no cash value,
**cannot be redeemed for real money or anything of real-world value**, and
cannot be transferred between players. You may buy them with real money, and
you may stake coins in online coin tables, but they can never be withdrawn or
cashed out.

## How we use information

To run and secure the game, match you with other players, keep your progress,
grant and restore purchases and rewards, prevent cheating and abuse, show
optional rewarded ads, and understand and improve how the app is used.

## Who we share it with

We use service providers who process data for us: Google (Firebase
Authentication and Firestore, Google Play Billing), RevenueCat (purchase
management), and our hosting provider `<provider>`. Google AdMob receives
advertising data as described above. We do not sell your personal information.
We may disclose information if the law requires it or to protect the game and
its players.

## Retention and deletion

We keep account, game and purchase records for as long as your account exists
and as needed for tax, accounting and fraud prevention. To ask for your account
and associated data to be deleted, email `<privacy contact email>` from the
address you linked, or use `<deletion request URL, required by Google Play,
to be provided in task 29>`. Some purchase records may be kept as the law
requires.

## Children

The app is not designed for children under 13 and we do not knowingly collect
their personal information. `<Confirm age policy and minimum age by region.>`

## Security

Data is sent over encrypted connections. No system is perfectly secure.

## International transfers

Our providers may process data in countries other than yours.

## Your choices and rights

Depending on where you live, you may have rights to access, correct, delete or
export your data and to withdraw consent. Contact us at the address above. In
the EEA and UK you can change your advertising consent in the app `<once the
privacy options entry exists>` or by clearing the app data.

## Changes

We will post changes here and update the effective date.

---

## Internal notes (not part of the hosted text)

- Sources for each paragraph: wallet and ledger (tasks 26a/26b), RevenueCat
  webhook and sync (26d), AdMob SSV, UMP and daily caps (26h), identity
  (task 23/24).
- Open before hosting: legal entity and contact, deletion mechanism and URL,
  region age policy, crash reporting wording, retention periods, and a
  Settings entry to reopen the UMP privacy options form (not built).
- Telemetry in the current build is not uploaded; remove or keep the
  "app interactions" sentence depending on whether an upload pipeline ships.
