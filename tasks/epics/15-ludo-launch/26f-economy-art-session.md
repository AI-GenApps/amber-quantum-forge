---
epic: 15-ludo-launch
task: 26f-economy-art-session
status: pending
commit_scope: ludo
owner: human
depends_on: [15-ludo-launch/26e-client-wallet-hud-progression]
estimate: M
---

# Economy art session: theme sets, currency icons, store banners

## Goal

Generate and approve original bitmap art for the 6 dice / 4 token / 3 board
themes from task 26a's catalog, currency icons (coin, diamond), and store
banners, via the art pipeline (dry run → human approval → finals), so task
26g's store/inventory UI has real art manifest slots to render instead of
code-drawn fallbacks. **This task requires a human present for interactive
approval — no agent session can complete it unattended**, matching the
epic's precedent for the art session between task 12f and task 13.

## Context/Decisions

- Follow `.claude/skills/audit-game-and-prepare-for-release/references/
  08-art-audio-pipeline.md` exactly: prompt plan per set → cheap dry-run
  previews composited into full-screen mockups at device resolution → show
  a contact sheet + mockups via `AskUserQuestion` → render finals only for
  the approved direction → integration (optimized sizes, APK budget
  contributes to task 27's 40MB total) → device captures → user review.
- Art sets for this task, in order: (1) currency icons — coin, diamond,
  matching the HUD chip style from task 26e; (2) dice theme set — 6 themes
  from task 26a's catalog (Default free / Classic Wood / Neon Vortex /
  Marble / Galaxy / Gold), all six pip faces per theme; (3) token theme set
  — 4 themes (Default free / Gem Tokens / Robot Tokens / Animal Tokens),
  4 token colors per theme; (4) board theme set — 3 themes (Default free /
  Cosmic Board / Royal Board); (5) store banners — one per IAP tier
  (Starter Pack, Coins S/M/L, Diamonds S/M/L, Vortex Pass) plus a Vortex
  Pass hero banner.
- Every generated asset is ORIGINAL — no Ludo King or any competitor art,
  motifs, or copied palettes; premium casual mobile game style, matching
  task 12b/12c's existing design system tokens and palette so the economy
  art doesn't clash with the already-shipped board/token art.
- Save masters, prompts, and per-file provenance under
  `.agents/resources/2026-09-25/ludo-vortex-art/economy/<set>/`, one README
  per set (model, params, prompt, regeneration notes) — do not skip the
  provenance README even under time pressure, per the pipeline doc.
- Slot wiring into `lib/src/assets/ludo_art_manifest.dart` (or wherever
  task 03/12b's manifest lives) happens in **this** task's integration
  step for currency icons and theme art — task 26g still needs a
  code-drawn fallback path for any slot this session does not finish
  approving, so task 26g is not blocked on 100% completion of this task,
  but should not be started until at least the currency icons and one
  approved theme set exist, since it needs real slots to build the store
  screen against.

## Implementation Checklist (human + Claude, interactive)

- [ ] Write the prompt plan for all five sets (subject, style, aspect,
  transparency, references to task 12b/12c's existing palette).
- [ ] Produce dry-run previews and full-screen mockups for each set; show
  contact sheets via `AskUserQuestion`; get explicit approval per set
  before spending credits on finals.
- [ ] Generate finals for every approved set via the Higgsfield CLI per the
  pipeline doc's brief template and model/params.
- [ ] Verify sprite/icon transparency (alpha channel) with PIL for every
  transparent-background asset (dice, tokens, currency icons).
- [ ] Integrate approved art into `lib/src/assets/ludo_art_manifest.dart`
  slots, optimizing file sizes.
- [ ] Add `assets/art/LICENSES.md` entries (or extend the existing file)
  for every new asset: master path in `.agents/`, model, date, "original
  AI-generated art".
- [ ] Capture device screenshots (physical device, serial `RZ8R32EAB7T`)
  of the new art rendered in the (still code-laid-out, pre-26g) store
  preview or theme picker, for final user review.
- [ ] Save all masters/prompts/READMEs under
  `.agents/resources/2026-09-25/ludo-vortex-art/economy/`.

## Files Touched

- `apps-native/games/ludo/assets/art/*` (new PNGs)
- `apps-native/games/ludo/assets/art/LICENSES.md` (extended)
- `apps-native/games/ludo/lib/src/assets/ludo_art_manifest.dart` (new slots
  wired)
- `.agents/resources/2026-09-25/ludo-vortex-art/economy/**` (new)

## Acceptance Criteria (objective)

- Every approved art set has a provenance README under
  `.agents/resources/2026-09-25/ludo-vortex-art/economy/<set>/` naming
  model, date, and prompt.
- Every transparent-background asset's alpha channel is verified (not just
  assumed) before integration.
- `assets/art/LICENSES.md` lists every new file with its master path and
  "original AI-generated art" provenance.
- At least the currency icons and one full theme set (dice, tokens, or
  board) are integrated into the art manifest with real bitmap slots
  before this task is marked complete.

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:run -- --app ludo --device-id RZ8R32EAB7T` (device
  screenshot review)

## Out of Scope

- Store/inventory screen UI and purchase flow (task 26g) — this task only
  produces and wires the art assets it renders with.
- Rewarded-ad creative/UI (task 26h) — no ad creative is produced here.
- Any code-drawn fallback removal — fallbacks stay in place for any slot
  this session does not finish.

## Commit message

`feat(ludo): add economy art — theme sets, currency icons, store banners [15-ludo-launch/26f]`
