# Merge Relay brand art provenance

Every bitmap in this directory is **original AI-generated art**, produced
for this project via Higgsfield (`gpt_image_2_5`) on 2026-09-26, reviewed
and approved by the user as the "Merge Relay" brand masters (logo round 2).
No third-party or attribution-required asset is used.

The full-resolution master files (contact sheet, per-file generation
metadata, and the six candidate renders) live outside the app bundle at
`.agents/resources/2026-09-26/merge-relay-brand/logo-round2/` — those are
the source of truth and are not modified. The prompts used to generate
them are recorded in
`.agents/resources/2026-09-26/merge-relay-brand/logo-round2/README.md`.

The files below are resized/palette-quantized copies of those masters,
prepared for in-app bundling (max 1024px wide, 256-color PNG, each well
under 600 KB) so the client stays small.

| File | Derived from (master) | Used for |
|---|---|---|
| `logo_stacked.png` | `wordmark-v2-transparent.png` (stacked wordmark + gold-ringed emblem) | Home-screen hero brand mark (`MergeRelayArtManifest.logoStackedSlot`) — this app has no dedicated splash widget |
| `logo_wide.png` | `wordmark-v1-transparent.png` (single-line wide wordmark) | Home header (`MergeRelayArtManifest.logoWideSlot`) |

The launcher icon (`icon-v1.png` master) is not copied into this
directory — it is embedded (as a resized, base64-encoded PNG) directly in
`apps-native/games/merge_relay/assets/branding/icon.svg`, the source
`scripts/games/icons.ts` rasterizes into the Android/iOS launcher icon
assets via `bun run games:icons -- --app merge_relay`.

## Generation details

- Model: Higgsfield `gpt_image_2_5`
- Date: 2026-09-26
- Prompts: see
  `.agents/resources/2026-09-26/merge-relay-brand/logo-round2/README.md`
- License: original commissioned work for this project; no external
  license terms apply.
