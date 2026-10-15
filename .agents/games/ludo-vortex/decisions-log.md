# Ludo Vortex — decisions log

| Date | Decision | Rationale / notes |
|---|---|---|
| 2026-09-24 | Rebuild in **Flutter + Flame** at `apps-native/games/ludo`; Unity project stays frozen | Unity attempt was a one-session scaffold (programmer art, sine-wave SFX, trivial bot, no online). Flutter reuses registry/CLI/CI/backend patterns; Ludo King-style game is mostly UI + 2D board; smaller APK |
| 2026-09-24 | v1 modes: vs Computer (3 levels), Pass N Play, Friends rooms, Online matchmaking | user |
| 2026-09-24 | Art: AI-generated with approval rounds; audio CC0 | user |
| 2026-09-24 | Android first | user |
| 2026-09-24 | Rules: Ludo King Classic (no blockades) + Quick | user |
| 2026-09-24 | Identity: guest + optional Google link | user |
| 2026-09-24 | Work and commit directly on `main`, never push | user |
| 2026-09-24 | Backend: Hono + Postgres authoritative, Firestore fanout, lazy timeouts + Vercel Cron | avoids new vendors; Vercel WebSockets beta/instance-pinned |
| 2026-09-24 | Visual overhaul before backend; target = Ludo King quality or better, original art only | device test: stock Material look, frozen turns, black area |
| 2026-09-24 | Evidence/screenshots always under `.agents/resources/<date>/<topic>/` | user |
| 2026-09-25 | Name **Ludo Vortex** | "Ludo" alone unbrandable; Carnival, Legend(s), Dice Dynasty, Fiesta, Tribe + ~20 others already exist; backups: Ludo Odyssey, Ludo Meridian. Formal trademark clearance still recommended |
| 2026-09-25 | Logo: token-orbit icon + dice-portal wordmark (stacked v2 splash, wide v1 lobby) | vortex-swirl rejected (Chrome lookalike risk) |
| 2026-09-25 | Quick mode = Ludo King official Quick (2 tokens out; win = 1 home + ≥1 capture); no points | earlier invented Quick contradicted official rule |
| 2026-09-25 | Lobby art: vortex background (B) + 3D object tiles (A) | brand-consistent + most characterful |
| 2026-09-25 | **Monetization reversed**: full economy in v1 via RevenueCat (Play Billing / StoreKit, never Apple Pay), rewarded ads only | revenue; competitor norm |
| 2026-09-25 | Economy numbers approved (see `economy.md`): XP all modes, coins online only, coin tables 5% rake (4p 70/25), no Remove Ads | offline farming risk; gambling-rating honesty |
| 2026-10-16 | Task 26g store: coin/diamond theme purchases go through `POST inventory/purchase` (atomic duplicate/owned/balance check + debit + inventory insert, never read-then-write); equip is local-only (persisted via platform_core SaveStore, no server call); purchase confirmation dialog before any spend | no partial debit, no overspend under concurrency; equip is not a spend |
| 2026-10-16 | Real-money store uses `purchases_flutter` configured by this standalone app itself (not linked under `flutter-app`), key from `--dart-define=REVENUECAT_API_KEY`; absent key = "Store unavailable" on Currency Packs/Pass, coin/diamond tabs unaffected; RevenueCat logged in with the game-token subject; every purchase/restore is followed by `POST revenuecat/sync` and a wallet refetch (client never trusts its own purchase result) | graceful no-op without keys; server is source of truth |
| 2026-10-16 | Task 26f (economy art session) skipped by user: store theme art is code-drawn per item (`ludo_store_theme_art.dart`), manifest slots `store_<itemId>` (`assets/art/store_<itemId>.png`) await art for dice_classic_wood, dice_neon_vortex, dice_marble, dice_galaxy, dice_gold, token_gem, token_robot, token_animal, board_cosmic, board_royal; currency icons are Material icons; no store banners yet | art slots fall back to code art; no bitmap generated |
| 2026-10-16 | Equipped themes are saved and shown in the store only; applying the equipped dice/token/board inside a match is NOT done yet (needs 26f art + match component theming) | scope of 26g |
