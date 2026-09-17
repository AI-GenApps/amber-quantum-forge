# Meme Court — Similar apps research

- Our app: Meme Court
- Bundle ID: `app.w3dev.memecourt`
- Source path: `apps-native/games/meme_court`
- Researched: 2026-09-17 via iTunes Search API (App Store US) and DuckDuckGo web search. Ratings are App Store snapshots, not Play Store figures.

## Closest competitors

| App | Developer | Rating | Why similar | How we differ |
|---|---|---|---|---|
| Make it Meme — Party Game | prealpha Games | 5.0 | Round-based meme matching/captioning with friends, room codes | Web-first and open lobbies; ours is private Court membership with moderation, guest web voting, and honest small-group outcomes |
| Evil Apples: Funny as ____ | Super Massive Ventures | 4.8 | The proven private-room party loop: code join, everyone answers, one votes; Cards Against Humanity formula | Card-deck humor, no UGC prompts; ours has curated versioned prompt library plus safety pipeline (MC-02/MC-10) |
| Meme Challenge — Funny Card Game | MagicLab | 4.7 | Meme caption competition in rooms | Thin moderation, engagement-bait ads; our anti-synthetic-activity guarantee (MC-01) is the trust wedge |
| Be The Meme: Party Game | Ilya Malyanov | 5.0 | Party meme roleplay in groups | Novelty format, small scale |
| Let's Meme — Party Game | Burak Ari | 0 | Same formula, minimal traction | Signals the space is full of abandoned clones — execution and safety ops are the differentiator |
| MemeClub: Party Game | Denys Brivka | 0 | Same formula, minimal traction | Same signal as Let's Meme |

## Genre benchmarks

- Evil Apples demonstrates the ceiling: a private-room voting party game can sustain years of revenue on the CAH formula with regular deck updates.
- Most competitors are low-review-count solo-dev clones; only Make it Meme (web) and Evil Apples (mobile) have real scale. Market is crowding but not saturated with quality.

## Takeaways

- Our differentiators are operational, not mechanical: human moderation pipeline, held/pending/approved caption states, guest web voting without crawler abuse, explicit tie/low-participation handling, and no fake activity. No competitor advertises any of these.
- Positioning must be "the meme game for your private group that respects honesty" — never show synthetic players or votes as real (MC-16).
- Free-text captions stay disabled until moderation staffing exists (MC-10 gate); tile-caption assembly matches competitor UX while keeping safety honest.
