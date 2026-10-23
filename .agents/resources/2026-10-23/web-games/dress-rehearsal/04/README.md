# Task 04 - screens, navigation, design tokens, fonts, accessibility (evidence)

Date: 2026-10-24. Everything was produced and checked headlessly (Vitest with happy-dom, `tsc`,
`vite build`, Biome). No browser, device, emulator or screenshot was used; the owner does browser QA
at the end of the epic.

## Fonts

Sources (all from `github.com/google/fonts`, `main` branch, fetched 2026-10-24 with `curl` into
`/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/dress-rehearsal/fonts/`):

| Family | Upstream file | Licence file |
|---|---|---|
| Playfair Display | `ofl/playfairdisplay/PlayfairDisplay[wght].ttf` and `PlayfairDisplay-Italic[wght].ttf` | `ofl/playfairdisplay/OFL.txt` |
| DM Sans | `ofl/dmsans/DMSans[opsz,wght].ttf` | `ofl/dmsans/OFL.txt` |

Tool: `uvx` (uv 0.4.24) with fonttools 4.67.0 and brotli 1.2.1, run as an ephemeral environment.
Nothing was added to the project or to `package.json`.

```bash
U="U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018-201D,U+2022,U+2026"
ft() { uvx --with brotli --from fonttools fonttools "$@"; }
# Playfair Display: keep the whole wght axis (400..900), subset only
ft subset Playfair.ttf --unicodes="$U" --layout-features='*' --flavor=woff2 \
  --output-file=out/PlayfairDisplay-Variable.woff2
ft subset Playfair-Italic.ttf --unicodes="$U" --layout-features='*' --flavor=woff2 \
  --output-file=out/PlayfairDisplay-Italic-Variable.woff2
# DM Sans: pin opsz at 14, keep wght limited to 400..700, then subset
ft varLib.instancer DMSans.ttf opsz=14 wght=400:700 -o DMSans-pinned.ttf
ft subset DMSans-pinned.ttf --unicodes="$U" --layout-features='*' --flavor=woff2 \
  --output-file=out/DMSans-Variable.woff2
```

The axes of the results were read back with fonttools (`fvar`): Playfair Display and its italic
have `wght` 400 to 900 (default 400); DM Sans has `wght` 400 to 700 (default 400) and no `opsz`
axis. Each file maps 199 code points and contains U+0024 (dollar), U+2019 and U+2022. The subset
covers Basic Latin, Latin-1, U+2013, U+2014, U+2018 to U+201D, U+2022 and U+2026.

| Output (in `apps-games/dress-rehearsal/public/fonts/`) | Bytes | SHA-256 |
|---|---|---|
| `playfair-display/PlayfairDisplay-Variable.woff2` | 48,444 | `e9cfebdebe9fd53607cc2c39ed410726d2f6cf1fbff41a388fd29b3d7e555aea` |
| `playfair-display/PlayfairDisplay-Italic-Variable.woff2` | 48,120 | `6f933fb281be4081cf70efdd9de34b6227fbe437661b476cfe00788ec3ff0c5a` |
| `dm-sans/DMSans-Variable.woff2` | 23,844 | `f4e2ffb400dec5d46f16f82c0520f3ef61a97eb0a271a315258b4074e85a1b1b` |
| `playfair-display/OFL.txt` | 4,449 | `566be814f8e96e93dfa16101331557eb6b5467e9e03f627c0910fe93ca12300e` |
| `dm-sans/OFL.txt` | 4,482 | `9af36190332437f5ecd09974de43c1f7c77a310a996cdd8ceb25628b458840e1` |

Upstream TTF hashes (for reproducing): Playfair Display
`c40f2293766a503bc70cce9e512ef844a4ccb7cbcde792fe2ea31d191917d8d6`, Playfair Display Italic
`a5e26dc5e2e77fb2803a0bf02fd4f81ee136ec8dea863ccdb0c59a263b21378b`, DM Sans
`8cd08d97e89c24d0aa92edd2f0f4c8ee6195eee9b7c9f154865a58b02f0c1c0d`.

Budgets: the largest woff2 is 48,444 bytes (limit 120 KB); the three woff2 files total 120,408
bytes (limit 300 KB). `test/theme.test.ts` asserts the `wOF2` magic bytes, both limits and the OFL
text, and `test/source-audit.test.ts` asserts that no source file or content string contains a
character outside the subset, so no rendered glyph can fall back to a platform font.

The italic face is registered with `style: "italic"` (`src/fonts.ts`) for the client lines
(`.dr-quote`). `index.html` preloads the two upright faces; `main.tsx` registers all three before
the first render and `Boot` waits for them.

## Contrast

`src/theme/contrast.ts` implements the WCAG relative-luminance ratio. `test/theme.test.ts` asserts
the values measured in `product.md` (ink on paper 14.57, ink on paper-2 12.73, ink on linen 11.48,
ink-soft on paper 7.04, ink-soft on linen 5.55, paper on night 15.43, good on paper 6.06, bad on
paper 6.03, warn on paper 6.24, paper on good 6.06, paper on bad 6.03, focus on paper 5.65,
hairline on paper 4.77, hairline on linen 3.76, star on night 5.89, ink on star 5.56, star on
paper 2.62) and then checks every pair the app uses:

- 45 chrome pairs (`chromePairs()` in `src/theme/tokens.ts`): text pairs need 4.5, UI pairs need 3.
- 4 pairs per chapter accent x 6 chapters (`accentPairs()`): paper text on the accent, the accent
  as text on paper, as a border on paper, and as a UI colour on linen (3.99 to 5.12).
- Three derived tokens exist only for the dark chrome and are not part of the 14 art-bible tokens:
  `NIGHT_SURFACE` `#26201d`, `NIGHT_RAISED` `#322a26` and `BORDER_ON_NIGHT` `#a08c6e` (4.33 to
  5.43 on the three night surfaces). The focus ring is star gold on night (5.89) and the `focus`
  blue on paper surfaces, because `focus` is only 2.73 on night.
- Star gold is 2.62 on paper, so the stylesheet draws every star with an ink outline
  (`.wg-star { stroke: var(--dr-ink) }`, asserted), and the toggle track and progress bars carry an
  ink border for the same reason.

## Layout and accessibility checks

- `test/a11y.test.tsx` mounts every route (12 routes, locked states included) and every sheet
  (brief, pause, hint, leave confirm, result, export, reset confirm, delete confirm) and asserts,
  per interactive element: an accessible name, `min-width` and `min-height` of at least 44 px
  (88 px for board slots), resolved from the kit stylesheet, `src/styles.css` and inline styles
  (`var(--wg-hit-min)` = 44), and `assertNoPlatformFontFallback` with both families. A self-test
  proves the audit rejects an unsized button, an unnamed icon button and a serif paragraph.
- Body text is 16 px; every `font-size` rule in the stylesheet is 14 px or larger (asserted).
- Colour is never the only signal: rule chips carry a check, cross or document icon plus text and a
  hidden state word; swatches carry names; selection uses thicker borders and outlines; high
  contrast adds hatching to swatches and thicker garment outlines.
- Reduced motion (system preference or the in-app toggle) sets `data-motion="reduced"` on the
  document, which removes every animation and transition (rule in the stylesheet, flag tested).

## Not covered here (by decision)

No pixel, screenshot or real-pointer test exists. Drag is tested with scripted pointer events and a
stubbed hit test (`document.elementFromPoint`) in happy-dom; the real-browser feel of drag, touch
scrolling around the tray, canvas output, the Web Share sheet and the font rendering are for the
owner's browser QA (`open-questions.md`, Task 04 notes).

## Verification run

| Command | Result |
|---|---|
| `bun run --filter '@web-games/dress-rehearsal*' typecheck` | pass (core and app) |
| `bun run --filter '@web-games/dress-rehearsal*' test` | pass (core 457 tests, app 265 tests) |
| `bun run --filter '@web-games/dress-rehearsal' build` | pass |
| `bunx biome check apps-games/dress-rehearsal apps-games/dress-rehearsal-core` | pass |
