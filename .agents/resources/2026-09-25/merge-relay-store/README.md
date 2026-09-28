# Glow Rescue — store screenshots & feature graphic (task 24)

Marketing assets for the Google Play listing, composed with Pillow from
**real, in-game captures** and integrated art (tasks 22/23) — no
image-generation tool was used for this task (only compositing of
already-approved, already-integrated assets and real gameplay renders).

- Script: `scripts/` below is not committed as a repo script (one-off); the
  exact generator is preserved here for reproducibility:
  `make_screenshots.py`, `make_feature_graphic.py`.
- Tool: Pillow (`/data/tools/pyenv/bin/python`, PIL 10.x). No AI image
  generation involved in this task.
- Fonts: `apps-native/games/merge_relay/assets/fonts/Fredoka` (headline,
  variable-font instance "Bold") and `.../NunitoSans` (subcaption, instance
  "SemiBold") — the app's own bundled OFL fonts, never a platform default.
- Palette: `apps-native/games/merge_relay/lib/src/merge_relay_theme.dart`
  (`signalRelayTheme`) and `lib/src/ui/mr_tokens.dart` — ink `#1e2a44` (caption
  band), cream `#fff7ea` (subcaption/board), warm `#f2914b`, sky `#2a7a8c`,
  coral `#c03e4f` (accent rules).

## Fix round 1 (orchestrator review)

The first pass reused the *functional* screen goldens
(`test/goldens/screens/`) for every shot, three of which read as weak
marketing because those goldens exist to prove specific UI states, not to
look good in a listing: a two-tile tutorial hint, a near-empty Endless
board, and the home screen standing in for "Daily". Fixed by adding
**store-only captures** —
`apps-native/games/merge_relay/test/goldens/store/store_shots_test.dart` —
that seed real, rules-legal, mid-game boards (many tiles across several
tiers) through the real game object (see that file's doc comment for
exactly how: a real `MergeBoard`, injected via `MergeRelayGame.state` after
calling the real `startRescue`/`startDaily`/`startEndless` entry points, so
the HUD's goal/target/budget are the real ones for that mode; the
merge-moment shot calls the real `MergeRelayGame.move(...)` and samples
mid-flight, same as the existing `tutorial_hint.png` samples its repeating
hint animation mid-swing). These are checked in as goldens under
`test/goldens/store/*.png` and regenerated with
`flutter test --update-goldens test/goldens/store/store_shots_test.dart`.

## Screenshots (`screenshots/`, 1080×2400 each)

Each is a source PNG (already exactly 1080×2400) scaled to fit under an ink
caption band and pasted with rounded corners and a soft shadow. Captions are
short, original, and game-voiced (no "relay"/"friend" wording, per the
task's v1 solo-scope rule).

| File | Source | Headline | Sub-caption |
|---|---|---|---|
| `01-hero-board.png` | `store/store_hero_rescue.png` — real Rescue board (chapter 6 "Observatory Dawn"), 11 tiles across 7 tiers (2–128), goal progress 96/164 | "Slide. Merge. Rescue." | "A real mid-game board — seven tiers deep." |
| `02-merge-moment.png` | `store/store_merge_moment.png` — same board, one real `move()` call frozen ~180ms into the real squash-and-pop animation (two 8s merging into 16, with the pop's sparkle accent visible) | "Feel every merge." | "Every pop is real — no two boards play the same." |
| `03-chapter-map.png` | `screens/chapter_map.png` (unchanged) | "60 boards. 6 chapters." | "A cozy campaign to clear, at your pace." |
| `04-daily.png` | `store/store_daily_play.png` — the actual Daily play screen, 11-tile board, "Today's chain 2/3 moves" | "A new board, daily." | "Beat today's chain in three moves." |
| `05-endless-best.png` | `store/store_endless_best.png` — Endless board with a 512 best tile, 12 tiles across 9 tiers, score 8420 | "Keep the chain going." | "Endless mode: chase your best score." |
| `06-result.png` | `screens/result_win.png` (unchanged) | "Path cleared." | "Every tile found its place." |

All six were viewed with the Read tool before being accepted (both in this
round and the prior one): readable text, brand fonts throughout (no tofu, no
platform-default fallback), no clipping, no overflow, no Material-default
styling, and — this round's specific check — every board reads as a real,
populated mid-game state rather than a sparse or wrong-screen capture.

## Feature graphic (`feature-graphic.png`, 1024×500, RGB, no alpha)

Composed from `apps-native/games/merge_relay/assets/art/homeScene.png`
(cropped to the 1024:500 aspect, keeping the three tile characters and the
sunset, trimming most of the ocean) with
`apps-native/games/merge_relay/assets/art/logoWide.png` (the final wordmark)
placed in the calmer ocean band at the bottom so it never overlaps the
characters' faces, with a soft drop shadow for legibility. Saved flattened to
RGB (no alpha channel), matching the Play Console spec (JPG or 24-bit PNG, no
alpha).

## Verification

- `file screenshots/*.png feature-graphic.png` — confirms PNG, exact pixel
  dimensions (1080×2400 ×6, 1024×500 ×1).
- Every file was opened and visually reviewed with the Read tool (see task
  24 implementation notes) for text legibility, font correctness, and no
  Material-default/black-region/overflow failures.

## Not done here (human/console, task 25)

- Uploading these to Play Console, ordering, and any localized variants.
- iOS 6.9" screenshot set (App Store, not in this task's scope — Android
  first per `references/10-store-submission.md`).
