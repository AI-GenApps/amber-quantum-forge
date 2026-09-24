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
