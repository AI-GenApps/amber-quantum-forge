# Sixty-Second Heist — game knowledge base

Single source of truth for what Sixty-Second Heist **is** and the answers we need for
store listings, reviews, support, and future work. Keep it current: every product
decision, number, or listing answer that changes must be updated here in the same
commit. Evidence (screenshots, research, art masters) lives in dated folders under
`.agents/resources/<date>/…` and is linked from `assets-index.md`.

| File | Use it to answer |
|---|---|
| [`product.md`](product.md) | What the game is, modes, exact rules, content, platforms, identity, tech |
| [`economy.md`](economy.md) | Monetization status (TBD — pre-launch) |
| [`store-listing.md`](store-listing.md) | Play Console / App Store Connect fields, listing copy, content rating, data safety, privacy, ads & IAP declarations |
| [`assets-index.md`](assets-index.md) | Where every logo, art set, screenshot, reference, and research file is |
| [`decisions-log.md`](decisions-log.md) | Dated decisions with rationale (why we chose X) |
| [`open-questions.md`](open-questions.md) | Unresolved items, owners, what blocks launch |

## Quick facts

| | |
|---|---|
| Name | **Sixty-Second Heist** — **must be renamed**, see below (internal registry id `sixty_second_heist`) |
| Package / bundle | `app.w3dev.sixtysecondheist` (production), `app.w3dev.sixtysecondheist.debug` (debug) — registry: `docs-internal/gaming/app-source-registry.md` |
| Code | `apps-native/games/sixty_second_heist` (Flutter + Flame), rules `apps-native/games/packages/heist_rules` |
| Epic | `tasks/epics/16-games-portfolio-wave2/` (this epic, tasks 03 fonts + 16 name-candidate research only); no gameplay/backend epic yet |
| Platforms | Android first (Google Play); iOS later |
| Genre | Turn-based route planner: plot moves, grab loot, reach exit, avoid guards |
| Monetization | TBD — no gameplay/economy epic has started; see `economy.md` |
| Fonts | Bungee (display) / Chakra Petch (body) — OFL, task 03 |
| Primary competitor reference | **Hitman GO** — see `.agents/resources/2026-09-25/games-competitor-references/README.md` |
| Name conflict | **"60 Second Heist" is an existing 4ThePlayer/Yggdrasil casino slot** (gambling association, trademark risk); "Sixty Second Heist" is also an itch.io jam game. **No gameplay work this epic** — strict name-uniqueness research only (task 16) |
| Status (2026-09-25) | **Rename research only.** Foundation playable slice: 1 of ~80 target levels, small obstacle/tool fixtures, no editor/campaign/daily/economy |
