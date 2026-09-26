# Merge Relay — economy

**TBD stub.** No currency/consumable economy (coins, diamonds, XP tables, store, inventory)
is defined anywhere in the sourced docs (`docs-internal/gaming/handoffs/merge-relay.md`,
`merge-relay-release-plan.md`, `merge-relay-commerce.md`, `merge-relay-release-audit.md`).

What exists today:
- A single **cosmetic-only, non-consumable** product: `merge_relay_theme_pack_v1` (Play
  one-time product) → server entitlement `merge_relay.theme_pack.v1`. No price set, no Play
  Console registration. See `docs-internal/gaming/merge-relay-commerce.md` and
  `.agents/games/merge-relay/store-listing.md`'s In-app products table.
- Registry capability list includes `ads`, but rewarded-ad integration (AdMob SSV) is
  explicitly not implemented.
- No coins/diamonds/soft-currency, no leveling/XP table, no in-app store screen, and no
  server ledger are specified in the sourced PRD/plan/audit documents for this game.

If/when an economy is scoped for Merge Relay (levels, currencies, cosmetics store beyond
the single theme pack, rewarded-ad grants), replace this stub following
`.claude/skills/audit-game-and-prepare-for-release/references/11-economy-monetization.md`
and record the approved numbers here, mirroring `.agents/games/ludo-vortex/economy.md`'s
format.
