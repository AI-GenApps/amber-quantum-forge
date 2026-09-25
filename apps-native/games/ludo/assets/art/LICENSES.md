# Ludo Vortex brand art provenance

Every bitmap in this directory is **original AI-generated art**, produced
for this project via Higgsfield (`gpt_image_2_5`) on 2026-09-25, reviewed
and approved as the "Ludo Vortex" brand masters. No third-party or
attribution-required asset is used.

The full-resolution master files (contact sheets, refinement sheets, and
the final selected renders) live outside the app bundle at
`.agents/resources/2026-09-25/ludo-vortex-art/logo/` — those are the
source of truth and are not modified. The prompts used to generate them
are recorded in
`.agents/resources/2026-09-25/ludo-vortex-art/logo/README.md`.

The files below are cropped/resized/optimized copies of those masters,
prepared for in-app bundling (max ~1024px wide, palette-quantized PNG,
each under ~150 KB) so the client stays small.

| File | Derived from (master) | Used for |
|---|---|---|
| `logo_stacked.png` | `wordmark-final-v2-transparent.png` (stacked emblem + wordmark) | Splash screen mark, onboarding welcome hero (`LudoArtManifest.logoStackedSlot`) |
| `logo_wide.png` | `wordmark-final-v1-transparent.png` (wide orbit wordmark) | Home lobby header (`LudoArtManifest.logoWideSlot`) |

The launcher icon (`token-orbit-icon.png` master) is not copied into this
directory — it is embedded (as a resized, base64-encoded PNG) directly in
`apps-native/games/ludo/assets/branding/icon.svg`, the source
`scripts/games/icons.ts` rasterizes into the Android/iOS launcher icon
assets via `bun run games:icons -- --app ludo`.

## Generation details

- Model: Higgsfield `gpt_image_2_5`
- Date: 2026-09-25
- Prompts: see `.agents/resources/2026-09-25/ludo-vortex-art/logo/README.md`
- License: original commissioned work for this project; no external
  license terms apply.

## Lobby art (task 12h)

Same provenance basis as the brand art above: **original AI-generated
art**, produced via Higgsfield (`gpt_image_2_5`, the `flare` job type) on
2026-09-24/25, user-approved as the lobby's background and mode-tile set.
No third-party or attribution-required asset is used.

The full-resolution master files (both background concepts, both tile
style passes, per-image job JSON with the full prompt/params, the
mockups, and the contact sheet) live outside the app bundle at
`.agents/resources/2026-09-25/ludo-vortex-art/lobby/` — that directory is
the source of truth and is not modified; its `README.md` records every
prompt. The files below are resized/palette-optimized copies of the
user-approved subset (background concept "B" / vortex galaxy, tile style
"A" / 3D objects) prepared for in-app bundling.

| File | Derived from (master, job record) | Resized to | Used for |
|---|---|---|---|
| `bg-b.png` | `bg-b.png` (`bg-b.json`) — "vortex galaxy" background, 1520x2688 native | 1080px wide, 256-color palette PNG (~567 KB) | Home lobby full-bleed background (`LudoArtManifest.lobbyBackgroundSlot`) |
| `tile-a-computer.png` | `tile-a-computer.png` (`tile-a-computer.json`) — glossy robot-head hero object, 2048x2048 native, transparent | 512px wide | Computer mode tile (`LudoArtManifest.lobbyTileComputerSlot`) |
| `tile-a-pass.png` | `tile-a-pass.png` (`tile-a-pass.json`) — hand holding phone hero object, 2048x2048 native, transparent | 512px wide | Pass N Play mode tile (`LudoArtManifest.lobbyTilePassAndPlaySlot`) |
| `tile-a-friends.png` | `tile-a-friends.png` (`tile-a-friends.json`) — two friend figures hero object, 2048x2048 native, transparent | 512px wide | Play with Friends mode tile (`LudoArtManifest.lobbyTileFriendsSlot`) |
| `tile-a-online.png` | `tile-a-online.png` (`tile-a-online.json`) — globe-with-orbit hero object, 2048x2048 native, transparent | 512px wide | Online mode tile (`LudoArtManifest.lobbyTileOnlineSlot`) |

### Lobby art generation details

- Model: Higgsfield `gpt_image_2_5` (`flare` job type), `--quality high
  --resolution 2k`, with `--image-references` set to the approved
  Direction-C token-orbit icon for gold-ring/token style consistency only
  (not literal reuse)
- Date: 2026-09-24/25
- Prompts: see
  `.agents/resources/2026-09-25/ludo-vortex-art/lobby/README.md`
  (includes the shared style block and each image's specific concept
  prompt)
- License: original commissioned work for this project; no external
  license terms apply.
