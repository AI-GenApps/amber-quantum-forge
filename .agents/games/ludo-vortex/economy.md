# Ludo Vortex — economy (approved 2026-09-25)

All numbers live in a versioned **server** config (tunable after launch). Research and
rationale: `.agents/resources/2026-09-25/ludo-vortex-economy/research.md`. Tasks: 26a–26i.

## Principles

- Server-authoritative wallet: append-only ledger, idempotent grants; the client never
  sets balances.
- Coins and diamonds are **virtual only — never cashable or transferable for money**.
- No random paid items (no loot boxes) → no odds disclosure needed. Keep it that way or
  add disclosures.
- Rewarded ads are opt-in only; **no interstitial/banner ads**.

## Currencies

| Currency | Type | Earned | Spent |
|---|---|---|---|
| Coins | soft | online wins, daily login, rewarded ads, level-ups, starter grant | coin-table entries, standard dice/token themes |
| Diamonds | premium | IAP, day-7 login, rare rewarded ad, every 5th level | premium themes, board themes, Vortex Pass perks |

Starting balance (one-time, server-granted): **5,000 coins, 20 diamonds**, default themes.

## Progression

- **XP in every mode** (vs Computer, pass-and-play, online) — daily-capped, synced/claimed
  through the server. Coins are **not** earned offline.
- XP to next level: `100 × level^1.6`, rounded to nearest 10 (table computed in task 26a).
- Level-up reward: `100 × new level` coins; every 5th level +10 diamonds; every 10th level
  a free theme item from a rotating pool.

## Daily rewards (7-day streak, resets when broken)

Day 1: 200 coins · 2: 250 · 3: 300 · 4: 350 · 5: 400 · 6: 500 · 7: 750 coins + 5 diamonds.

## Rewarded ads (AdMob, UMP consent, server-side verification)

100 coins per ad, max 5/day · 5 diamonds per ad, max 2/day.

## Online coin tables (5% rake)

| Tier | Entry | 2 players: winner gets | 4 players: 1st / 2nd get |
|---|---|---|---|
| Low | 500 | 950 | 1,400 / 500 (pot 2,000) |
| Mid | 2,000 | 3,800 | 5,600 / 2,000 (pot 8,000) |
| High | 10,000 | 19,000 | 28,000 / 10,000 (pot 40,000) |

Entry escrowed at match start; refunded if the match aborts. (4p = 70% / 25% of pot, 5% rake.)

## Store — cosmetics

| Type | Items | Price |
|---|---|---|
| Dice themes | Default (free), Classic Wood, Neon Vortex, Marble, Galaxy, Gold | 1,500 coins or 30 diamonds |
| Token themes | Default (free), Gem, Robot, Animal | 2,500 coins or 50 diamonds |
| Board themes | Default (free), Cosmic, Royal | 80 diamonds (diamond-only) |

## In-app purchases (RevenueCat → Google Play Billing; StoreKit on iOS later)

| Product | Contents | INR | USD |
|---|---|---|---|
| Starter Pack (one-time) | 3,000 coins + 30 diamonds | ₹49 | $0.99 |
| Coins S / M / L | 5,500 / 30,000 / 110,000 coins | ₹99 / ₹399 / ₹1,499 | $1.99 / $4.99 / $17.99 |
| Diamonds S / M / L | 100 / 600 / 1,600 diamonds | ₹149 / ₹699 / ₹1,699 | $2.99 / $8.99 / $19.99 |
| Vortex Pass (monthly subscription) | +50% daily rewards, 1 free theme/month, exclusive dice skin | ₹199/mo | $3.99/mo |

Product IDs: to be fixed in task 26i (record them here). **Not Apple Pay** — iOS uses Apple
In-App Purchase (StoreKit).

## Anti-abuse

Idempotency keys, per-day caps (XP, ads, free rewards), server timestamps, rate limits,
anomaly logging, refund/revocation handling from RevenueCat webhooks.
