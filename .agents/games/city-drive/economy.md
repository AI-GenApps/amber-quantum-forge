# City Drive — economy

## v1 decision (2026-10-15, user)

**Coins and car unlocks only. No real money.** No ads (no rewarded, no
interstitial, no banner), no in-app purchases, no accounts, no network. Coins
are a soft currency earned from missions and spent on unlocking cars. Nothing
can be bought with real money and nothing has to be watched.

## v1 loop

| Step | Detail |
|---|---|
| Earn | Completing a mission pays coins. The payout scales with the stars earned (1 to 3). Exact payouts: **TBD (task 12)** |
| Spend | Coins unlock cars from a fixed roster. Prices and roster: **TBD (task 12)** |
| Gate | Districts unlock by total stars, not by coins. Star thresholds: **TBD (task 11)** |
| Save | Local only, versioned with migrations (task 12). Uninstalling deletes it. |

Do not invent numbers here before the owning task fixes them; mark them
"TBD (task NN)" until then.

## Deferred (v1.1+), explicitly out of scope for this epic

| Idea | Why it is out of scope |
|---|---|
| Rewarded ads for payout multipliers | Needs an ad SDK (AdMob), consent flow, and data-safety changes. The epic ships a clean offline game first. |
| One-time ad-free IAP | Pointless until ads exist. Needs RevenueCat or native billing and store provisioning. |
| Daily challenges, login streaks | Retention levers, but they need a clock/anti-cheat story. Candidates for v1.1. |
| Car customization (paint, wheels) | Retention lever; needs more art and UI. v1.1 candidate. |

**Rationale (CrazyGames driving-genre guidance, 2026-10-15):** the driving genre
averages about 8.7 minutes of playtime and about 5.7% day-1 retention, and the
guidance ties monetization to rewarded placements after the player has
invested time. With that short session length, v1 spends its effort on the
retention drivers that need no ad stack (missions/career and car unlocks)
and keeps ads and IAP for later. Source:
docs.crazygames.com/resources/monetizing-driving/. Competitors all ship ads and
IAP (see `decisions-log.md`), so "no ads, no IAP, offline" is also the
store-listing differentiator.
