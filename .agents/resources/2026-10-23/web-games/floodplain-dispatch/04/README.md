# Task 04 - screens, navigation, design tokens, fonts, accessibility (evidence)

Date: 2026-10-23. Everything was produced and checked headlessly (Vitest with happy-dom, `tsc`,
`vite build`, Biome). No browser, device, emulator or screenshot was used; the owner does browser QA
at the end of the epic.

## Fonts

Sources (all from `github.com/google/fonts`, `main` branch, fetched 2026-10-23 with `curl` into
`/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/floodplain-dispatch/fonts/`):

| Family | Upstream file | Licence file |
|---|---|---|
| Bricolage Grotesque | `ofl/bricolagegrotesque/BricolageGrotesque[opsz,wdth,wght].ttf` | `ofl/bricolagegrotesque/OFL.txt` |
| Atkinson Hyperlegible | `ofl/atkinsonhyperlegible/AtkinsonHyperlegible-Regular.ttf` and `-Bold.ttf` | `ofl/atkinsonhyperlegible/OFL.txt` |

Tool: `uvx` (uv 0.4.24) with fonttools 4.67.0 and brotli 1.2.1. Nothing was added to the project.

```bash
U="U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018-201D,U+2022,U+2026"
# Bricolage: pin opsz=36 and wdth=100, keep wght (limited to 400..800)
uvx --with brotli --from fonttools fonttools varLib.instancer Bricolage.ttf \
  opsz=36 wdth=100 wght=400:800 -o Bricolage-pinned.ttf
uvx --with brotli --from fonttools fonttools subset Bricolage-pinned.ttf --unicodes="$U" \
  --layout-features='*' --flavor=woff2 --output-file=out/BricolageGrotesque-Variable.woff2
# Atkinson: static Regular and Bold, same subset
uvx --with brotli --from fonttools fonttools subset Atk-Regular.ttf --unicodes="$U" \
  --layout-features='*' --flavor=woff2 --output-file=out/AtkinsonHyperlegible-Regular.woff2
uvx --with brotli --from fonttools fonttools subset Atk-Bold.ttf --unicodes="$U" \
  --layout-features='*' --flavor=woff2 --output-file=out/AtkinsonHyperlegible-Bold.woff2
```

The pinned display font keeps a single variable axis (`wght` 400 to 800, default 800), checked by
reading the `fvar` table of the result with fonttools. The subset covers Basic Latin, Latin-1,
U+2013, U+2014, U+2018 to U+201D, U+2022 and U+2026; a unit test checks that no source file contains
a character outside that set, so no rendered glyph can fall back to a platform font.

| Output (in `apps-games/floodplain-dispatch/public/fonts/`) | Bytes | SHA-256 |
|---|---|---|
| `bricolage-grotesque/BricolageGrotesque-Variable.woff2` | 42,316 | `fe32795effd8f6e49b4cc63cf98b7073c6bc2946fdda344cd95bfd32473ef7ee` |
| `atkinson-hyperlegible/AtkinsonHyperlegible-Regular.woff2` | 15,368 | `9f6cfd704a00cb8945ac8f34c3187a8f3e7e680f1bb141838e3abc4bc5e5fbc9` |
| `atkinson-hyperlegible/AtkinsonHyperlegible-Bold.woff2` | 15,680 | `6b8a7050f0fcd6cb1037ee2b7473963f294e2602969c233cba12ae037f02c51b` |
| `bricolage-grotesque/OFL.txt` | 4,403 | `4b5a7d8f37f5602621c8a8d7358a6a2e71317e6c231c661e15aef0275d3e07ba` |
| `atkinson-hyperlegible/OFL.txt` | 4,352 | `f32d22b3908fcad2c86a74000614ec22e6a7f66ea7e867e616026a27aebdc143` |

Upstream TTF hashes (for reproducing): Bricolage `413e7357809ddd12fd80a96a8a396de0e401638d4acd3cb3e37532f0472ac682`,
Atkinson Regular `7fb917c89019896d0b52ee84b7cbb3304c18cb90b19a62f5e32712bd23e97669`,
Atkinson Bold `5a3b0c8cc8ca545155150b4512a1fa248298df121c50d6557e651e61fbdab92f`.

Budgets: each woff2 is at most 42 KB (limit 120 KB); the three woff2 files total 73,364 bytes
(limit 300 KB). `test/theme.test.ts` asserts both limits and the OFL text.

## Contrast

`src/theme/contrast.ts` implements the WCAG relative-luminance ratio. `test/theme.test.ts` asserts
the measured values quoted in `product.md` (ink on paper 12.5, paper on night 13.75, paper on
water-deep 5.77, paper on meadow-deep 5.09, paper on clay 5.12, paper on ochre-deep 5.6, ink on
meadow 5.32, ink on ochre 5.35), then every pair used by the app:

- 29 chrome pairs (`chromePairs()` in `src/theme/tokens.ts`): text pairs need 4.5, UI pairs need 3.
  Two derived tokens exist only for contrast: `BORDER_ON_NIGHT` (#a29c8d) for borders on the dark
  background and `MUTED_ON_PAPER` (#3b5430) for muted text on paper surfaces. Muted text on
  paper-2 with the plain meadow-deep token was 4.41, which is why the derived value exists.
- 10 pairs per map theme x 7 themes (`themePairs()` in `src/theme/mapThemes.ts`): the shoreline
  against both ends of the land ramp, field, shallow and mid water; paper against sea and deep
  water; the paper chip behind depth numbers; page text against the theme background; focus colour.
  The shoreline is ink in the light themes and paper in Night Lantern, and the terrain ramp is
  checked at all eight heights.

## Layout and accessibility checks

- `test/a11y.test.tsx` mounts every route (11 routes, locked board included) and every sheet
  (pause, hint, exit confirm, inspector, gate inspector, result, reset confirm, playback) and
  asserts, per interactive element: an accessible name, `min-width` and `min-height` of at least
  44 px (resolved from the kit stylesheet, `src/styles.css` and inline styles, with
  `var(--wg-hit-min)` = 44), and `assertNoPlatformFontFallback` with both families. A self-test
  proves the audit rejects an unsized button, an unnamed icon button and a serif paragraph.
- Body text is 16 px; every label and caption rule is 14 px or larger (asserted on the stylesheet).
- No `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket` or http URL exists in `src/` (grep test).
  No source file exceeds 800 lines. No `any`.

## Build

`bun run --filter '@web-games/floodplain-dispatch' build`: `index-*.js` 210.7 kB (69.0 kB gzip),
`index-*.css` 8.1 kB (2.1 kB gzip), five small Capacitor web shims (about 4.3 kB). The JS budget
(300 KB gzip excluding art) is met with room to spare for audio, onboarding and art loading.
