---
epic: 16-games-portfolio-wave2
task: 01-competitor-store-references
status: pending
commit_scope: games
depends_on: [16-games-portfolio-wave2/00-knowledge-base-and-decisions]
estimate: M
owner: agent
---

# Competitor store-listing references and the Merge Relay visual target

## Goal

Download the public store-listing screenshots of the reference games into
dated folders, then write the Merge Relay **visual reference README** that
every later visual task and verifier points at (the equivalent of Ludo's
`ludo-visual-reference/README.md`).

## Context / Decisions

- The list of games, store URLs and roles is in
  `.agents/resources/2026-09-25/games-competitor-references/README.md`.
- No device is available, so store screenshots stand in for device captures.
  They are **internal reference only**: never copied, traced, shipped, or
  put in public docs. The README must say so.
- Get screenshot URLs from the Google Play listing HTML
  (`curl -sL -A "Mozilla/5.0" "https://play.google.com/store/apps/details?id=<pkg>&hl=en_US&gl=US"`,
  take the `play-lh.googleusercontent.com` image URLs, and append `=w1080`
  to each for a large size). The App Store page for Threes!
  (`https://apps.apple.com/us/app/threes/id779157948`) is an extra source if
  Play gives fewer than 5 gameplay images.
- Minimum sets: **Threes!** (≥6 images, both Play listings), X2 Blocks (≥4),
  2048 Cirulli (≥3), Terrarium: Garden Idle (≥4), Pocket Frogs (≥4),
  Hitman GO (≥4).
- Merge Relay visual target (write it concretely in the README): a warm,
  off-white/cream play field; tiles with an original **face or character per
  tier**; soft drop shadows and a rounded "physical card" feel; a friendly
  rounded display font (Fredoka); a calm board frame; generous whitespace
  that is **composed, not empty**; delight moments on merge (squash/stretch,
  pop, sound). The audit found these failures in the current build:
  flat blue squares, a mostly empty home screen, Material defaults.

## Implementation Checklist

- [ ] Create `.agents/resources/2026-09-25/<competitor>-store-reference/`
      per game with numbered PNG/WebP files (convert WebP to PNG with
      `/data/tools/pyenv/bin/python` and Pillow), a `README.md` (file → what
      it shows → source URL → retrieval date) and a `manifest.json`
      (`[{file, screen, source_url, notes}]`).
- [ ] VIEW every downloaded image. Delete promo banners that show no
      gameplay, and log each deletion in the README.
- [ ] Create `.agents/resources/2026-09-25/merge-relay-visual-reference/README.md`:
      2–3 named **style anchors** (specific Threes! files), the target
      description above, a "do / don't" list, and the audit's "before"
      captures (`docs-internal/gaming/evidence/visual/merge-relay-final-real-merge.png`,
      `.agents/resources/2026-09-25/games-portfolio-audit/renders/merge_relay-0*.png`).
- [ ] Build `contact-sheet.png` (Threes! anchors next to the current Merge Relay
      renders) with Pillow, and view it.
- [ ] Link the new folders from each game's `.agents/games/<slug>/assets-index.md`.

## Files Touched

- `.agents/resources/2026-09-25/*-store-reference/**`
- `.agents/resources/2026-09-25/merge-relay-visual-reference/**`
- `.agents/games/*/assets-index.md`

## Acceptance Criteria

- The minimum image counts above are met, and every file is listed in its
  folder's manifest with a working source URL.
- The visual-reference README names the specific anchor files and gives
  ≥8 checkable "do/don't" items (e.g. "tile numerals ≥ 40% of tile
  height", "no screen region > 25% height left as flat empty background").
- The contact sheet exists and the verifier has viewed it.
- No image appears anywhere outside `.agents/resources/` (checked with `git diff --stat`).

## Verification Commands

- `find .agents/resources/2026-09-25 -name manifest.json | xargs -n1 /data/tools/pyenv/bin/python -m json.tool > /dev/null && echo manifests-ok`
- `git diff --stat`

## Out of Scope

- Device captures of competitors (no device). Any app code.

## Commit message

`docs(games): add competitor store references and Merge Relay visual target [16-games-portfolio-wave2/01]`
