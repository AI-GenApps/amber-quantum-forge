# SnapQuest / Peeklings — Similar apps research

- Our app: SnapQuest (public title candidate: Peeklings)
- Bundle ID: `app.w3dev.snapquest`
- Source path: `apps-native/games/snapquest`
- Researched: 2026-09-17 via iTunes Search API (App Store US) and DuckDuckGo web search. Ratings are App Store snapshots, not Play Store figures.

## Closest competitors

| App | Developer | Rating | Why similar | How we differ |
|---|---|---|---|---|
| Pokémon GO | Scopely Explore (Niantic) | 4.0 | Genre anchor: creature collection in the real world | GPS-driven with constant location permission; ours uses the camera only at capture, no location, and offers full no-camera desk mode |
| Seek by iNaturalist | iNaturalist | 4.8 | On-device camera recognition of real-world organisms — the closest camera-recognition analog | Education utility, no game loop; ours wraps descriptor matching in collect/reveal/album progression |
| Goosechase | Goosechase Adventures Inc. | 4.8 | Missions-based scavenger hunts with photo proof | Event/education tooling, human-reviewed submissions; ours is instant on-device descriptor matching with daily quests |
| Scavenger Hunt! | Popcore GmbH | 4.4 | Casual scavenger-hunt game loop | List-completion format, no creature collection or album meta |
| Camera Hunt — Scavenger Game | Robbie Elias | 4.1 | Camera-based hunt gameplay | Minimal meta; validates the keyword space |
| Peridot (genre reference) | Niantic/Scopely | unverified in this scan | AR creature-pet collection | AR-first, no desk fallback; ours treats AR as optional and desk mode as fully equal (SQ-05) |

## Genre benchmarks

- Seek proves on-device camera identification works without uploads — matching our ephemeral 96×96 bounded-frame architecture (SQ-03).
- Goosechase shows sustained demand for structured real-world hunt tasks; its B2B pricing model hints at school/event partnership potential for Peeklings.

## Takeaways

- No competitor combines camera descriptor matching + collectible creatures + an equal no-camera mode with identical rewards. Desk-mode parity (SQ-05) is the accessibility headline for the store listing.
- Privacy posture is a marketing asset: camera permission only at capture, no audio, no location, no uploads — directly contrast with Pokémon GO's location demands.
- Physical descriptor-recognition calibration (SQ-02/SQ-08) remains our own gating risk before any store claims about recognition accuracy.
