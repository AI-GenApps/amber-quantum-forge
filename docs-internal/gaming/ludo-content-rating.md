---
title: Ludo Vortex content rating notes
description: Draft IARC and Google Play content-rating answers for Ludo Vortex, including the simulated gambling declaration and the odds-disclosure statement.
---

Draft answers for the Google Play / IARC questionnaire (and the equivalent
App Store Connect age-rating questions later). Nothing here has been
submitted; task 29 executes the form. Re-check each answer against the
questionnaire wording at submission time, because the questions change.

## Simulated gambling, and coins and diamonds are never real money

**Declare simulated gambling: Yes.** The online coin-stake tables (task 26c)
let a player wager coins on a dice game whose outcome is influenced by chance
(dice rolls), paying the pot out to the winner(s) minus a 5% rake
([`ludo-economy.md`](ludo-economy.md), "Online coin-stake tables"). Content
rating questionnaires classify that as **simulated gambling** even though no
real money is paid out, and this app declares it honestly.

**In the same breath: coins and diamonds are virtual currency only and are
never redeemable for real money or any real-world value.** There is no
withdrawal, cash-out, voucher, gift card, prize or peer-to-peer transfer path
for either currency, in code or in any store listing, and none will be added
(binding decision in task 26a; `ludo-economy.md`, "Policy: coins and diamonds
are never cashable"). Players can buy coins and diamonds with real money, but
there is no way back out. This is the fact that keeps Ludo Vortex out of
real-money-gaming territory, and every store answer, listing sentence and
support reply must state the two facts together: **simulated gambling with a
virtual currency that has no cash value.**

Consequences to expect and plan for:

- A higher age rating in some regions (for example an IARC outcome that
  reflects simulated gambling). Do not argue the rating down by omitting the
  coin tables. If a region disallows simulated gambling for the chosen age
  band, the coin-stake tables are the feature that gets region-gated, not
  hidden from the questionnaire.
- Target audience stays **13+**, not designed for children, so the Families
  policy does not apply (same position as the answer bank in
  `.agents/games/ludo-vortex/store-listing.md`).
- The app must never show "win real money", "cash out", "jackpot" or a
  cash-equivalent price next to coins. Store copy reviewed for this in task
  27.

## Odds disclosure (loot boxes and randomized paid items)

**Not applicable: there are no randomized paid items in this catalog.**
Reason: every real-money product is a fixed-price product with guaranteed
contents (coin packs, diamond packs, the starter pack and the Vortex Pass; see
[`ludo-store-product-ids.md`](ludo-store-product-ids.md)), and every cosmetic
(dice, token and board themes) is bought directly at a fixed coin or diamond
price with no random draw (task 26a decision; task 26g purchase route). Dice
rolls in a match are gameplay, not a purchased random item, and the online
dice are server-generated.

This section exists on purpose. If a later task considers adding a gacha, loot
box, mystery pack, spin wheel with a paid entry, or any other paid item whose
contents are chosen at random, it must first (a) publish the odds in the store
listing and in-app before purchase (Google Play and Apple both require odds
disclosure for paid random items), (b) re-answer the content-rating
questionnaire, and (c) update this section, the Data Safety draft and the
privacy policy. The free daily reward calendar and rewarded ads are fixed
amounts, not random.

## Questionnaire answers (draft)

| Topic | Answer | Notes |
|---|---|---|
| Violence, blood, fear | None | Tokens are "captured" back to the yard; no depiction of harm |
| Sexuality, nudity | None | |
| Profanity, crude humor | None | No free-text chat in v1; display names are user-entered, so see user-generated content below |
| Drugs, alcohol, tobacco | None | |
| Gambling, real money | No | No real-money wagering and no cash-out |
| Simulated gambling | **Yes** | Coin-stake tables use virtual coins that can be bought but **never cashed out** |
| Users can interact | Yes once online is live | Matchmaking and private rooms pair players; no free-text chat |
| Users can exchange content | No | Only display name and avatar choice are visible to others |
| Shares user location | No | |
| Digital purchases | Yes | Coins, diamonds, starter pack, Vortex Pass subscription |
| Contains ads | Yes | Rewarded video only, opt-in, consent form where required |
| Unrestricted web access | No | |

User-generated content: players choose a display name that other players see.
Declare it as limited user-generated content, point to the in-app report path
once task 27 defines one, and keep name filtering on the follow-up list.

## App Store Connect (later)

Same facts, mapped to Apple's questionnaire: the "Simulated Gambling" frequency question
applies to the coin tables (**verify** which bucket at submission), and Apple requires the
"no real-world value" statement in App Review notes (see the answer bank). iOS
is not part of v1.
