# Merge Relay — Similar apps research

- Our app: Merge Relay
- Bundle ID: `app.w3dev.mergerelay`
- Source path: `apps-native/games/merge_relay`
- Researched: 2026-09-17 via iTunes Search API (App Store US) and DuckDuckGo web search. Ratings are App Store snapshots, not Play Store figures.

## Closest competitors

| App | Developer | Rating | Why similar | How we differ |
|---|---|---|---|---|
| 2048 | Ketchapp | 4.4 | Grid tile-merge, deterministic moves, seeded spawning is the same core loop | We add daily seeded boards, rescue/endless modes, and friend relays |
| 2048 (original) | Solebon / Gabriele Cirulli | 4.8 | Deterministic open-source merge puzzle; parity culture | Our rules are a versioned contract with server recomputation and replay parity fixtures |
| 2248: Number Puzzle | Inspired Square FZE / UNICO Studio | 4.9 | Number-merge board, casual retention loop | Pure single-player; no challenge or relay mechanics |
| Drop The Number: Merge Puzzle | SUPERBOX Inc | 4.7 | Merge puzzle genre anchor, high ad monetization | Different physics sub-genre; confirms merge demand and ad-light tolerance |
| X2 Puzzle / 2248 Number Merge | UNICO Studio | 4.9 | Merge progression on a grid | No social layer at all |
| Merge Mansion | Metacore Games Oy | 4.6 | Owns the "merge" brand genre | Item-chain meta with energy timers, not deterministic boards; our anti-pattern is their monetization core |
| Travel Town | Moon Active | 4.8 | Merge adventure, huge UA machine | Same conclusion as Merge Mansion: merge brand is crowded, deterministic-challenge niche is empty |

## Genre benchmarks

- Wordle / NYT Games (4.8): the daily-seed shareable challenge loop we mirror — one board, everyone plays the same seed, shareable result.
- Merge genre overall: dominated by item-chain meta games with energy systems; deterministic puzzle boards are a small but loyal niche (r/MergeMobileGames community).

## Takeaways

- No competitor does server-validated friend relays or bounded move-passing (at most three legal moves). This is our differentiator; lean into "challenge a friend" as the marketing hook.
- The merge genre's top-grossing titles all use energy timers; a no-timer deterministic experience is a positioning advantage for the puzzle-purist audience.
- Daily seeded challenge (Wordle model) is a proven retention pattern to prioritize in the MVP requirement ledger (MR-09).
