# Sixty-Second Heist — Similar apps research

- Our app: Sixty-Second Heist
- Bundle ID: `app.w3dev.sixtysecondheist`
- Source path: `apps-native/games/sixty_second_heist`
- Researched: 2026-09-17 via iTunes Search API (App Store US) and DuckDuckGo web search. Ratings are App Store snapshots, not Play Store figures.

## Closest competitors

| App | Developer | Rating | Why similar | How we differ |
|---|---|---|---|---|
| Heist Plan — Every Second Counts | com.hestplan (Google Play) | n/a | Closest live comp: top-down planning game, draw the route on a blueprint, choose crew tools, no twitch reflexes | We add deterministic fixed-tick execution, ~80 solver-verified authored levels, and player-made challenges with attack/defense replay |
| Heist Master: 60 Seconds Plan | BKDCompany (Android) | n/a | "60 seconds on the clock" tactical robbery framing; near-identical title space | Confirms naming risk: differentiate via subtitle/keywords; ours is a route puzzle, theirs a stealth sim |
| Stolen in 60 Seconds | classic (J2ME-era) | n/a | The ancestral heist-planning premise (crew, plan, execute) | Legacy, not on modern stores; useful for keyword research only |
| Art Heist Puzzle | Magnetic Games AB | 4.7 | Heist-themed puzzling | Casual puzzle skins, no route planning or timing simulation |
| Lucky Looter: Stealth Heist | RadPirates | 4.7 | Stealth-heist arcade loop | Reflex-based; opposite of our deterministic planning promise |
| Armed Heist | SOZAP | 4.8 | Heist genre anchor with strong production values | Shooter; monetization and audience are entirely different |

## Genre benchmarks

- The planning-not-reflexes promise (Heist Plan's tagline) is validated demand: Reddit r/AndroidGaming threads actively ask for blueprint-planning heist games.
- Deterministic execution with visible failure replay (our SH-03 requirement) is absent from every competitor found; most stealth/heist games obscure outcomes.

## Takeaways

- Store listing must avoid the literal phrase "60 seconds heist plan" collision risk — Heist Master and Heist Plan already occupy it; lead with the vault-editor and challenge angle.
- The player level editor plus solver-proof challenges (SH-05/SH-06/SH-08) has no equivalent in this space; UGC heists are the wedge for content marketing.
- Free retry with explicit failure explanation is a review-score lever: competitors' action-heist games draw complaints about opaque difficulty.
