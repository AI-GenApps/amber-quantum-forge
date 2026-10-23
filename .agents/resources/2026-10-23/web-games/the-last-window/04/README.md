# Task 04 - screens, navigation, design tokens, fonts, accessibility (evidence)

Date: 2026-10-24. Everything was produced and checked headlessly (Vitest with happy-dom, `tsc`,
`vite build`, Biome). No browser, device, emulator or screenshot was used; the owner does browser QA at
the end of the epic.

## Fonts

Sources (all from `github.com/google/fonts`, `main` branch, fetched 2026-10-24 with `curl` into
`/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/the-last-window/fonts/`, deleted afterwards):

| Family | Upstream file | Licence file |
|---|---|---|
| Young Serif | `ofl/youngserif/YoungSerif-Regular.ttf` (single weight 400) | `ofl/youngserif/OFL.txt` |
| Nunito Sans | `ofl/nunitosans/NunitoSans[YTLC,opsz,wdth,wght].ttf` (variable) | `ofl/nunitosans/OFL.txt` |

Tool: `uvx` (uv from miniforge) with fonttools 4.67.0 and brotli. Nothing was added to the project.

```bash
U="U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018-201D,U+2022,U+2026"
# Nunito Sans: pin opsz=12, wdth=100 and the YTLC default, keep wght (limited to 400..800)
uvx --with brotli --from fonttools fonttools varLib.instancer NunitoSans.ttf \
  opsz=12 wdth=100 YTLC=500 wght=400:800 -o Nunito-pinned.ttf
uvx --with brotli --from fonttools fonttools subset Nunito-pinned.ttf --unicodes="$U" \
  --layout-features='*' --flavor=woff2 --output-file=out/NunitoSans-Variable.woff2
# Young Serif: static, same subset
uvx --with brotli --from fonttools fonttools subset YoungSerif-Regular.ttf --unicodes="$U" \
  --layout-features='*' --flavor=woff2 --output-file=out/YoungSerif-Regular.woff2
```

The pinned body font keeps one variable axis, `wght` 400 to 800 with default 400 (the upstream default
was 200), read back from the `fvar` table of the result. The subset covers Basic Latin, Latin-1,
U+2013, U+2014, U+2018 to U+201D, U+2022 and U+2026; both fonts cover the whole set (checked with the
`cmap`; only U+00AD, the soft hyphen, is missing from Young Serif and no text uses it). A unit test checks
that no source file contains a character outside that set, so no glyph can fall back to a platform font.

| Output (in `apps-games/the-last-window/public/fonts/`) | Bytes | SHA-256 |
|---|---|---|
| `nunito-sans/NunitoSans-Variable.woff2` | 26,412 | `fc9591c87e4806058919d333c2d80d52bba0f6c2396cbeb8f17dd6976905d6fa` |
| `young-serif/YoungSerif-Regular.woff2` | 25,464 | `d48c025fca525cd51af805feeb3d2d82c03f73f577c18f3ee2a06170c428bdb2` |
| `nunito-sans/OFL.txt` | 4,393 | `efbb0c9e864cef973982d9a17567e6be5c3d1759695574586f3f18c7ecca064b` |
| `young-serif/OFL.txt` | 4,398 | `737d8d343b674c6894f373de71a044b6782c130f2aebf180933d63ddf7a3dc19` |

Upstream TTF hashes (for reproducing): Nunito Sans `f934d7142fb4784bf828da485b7dcbd90c0c80d514e9d49a5da0ed3a1ae2491d`,
Young Serif `42bb2602364b28569fdce5eeb6ab3d81cf8090ba81b211f1229ed69f33155523`.

Budgets: each woff2 is at most 26 KB (limit 120 KB); the two woff2 files total 51,876 bytes (limit
300 KB). `test/theme.test.ts` asserts both limits and the OFL text. `font-synthesis: none` is set on
`html, body`, so Young Serif is never faux-bolded. Both fonts are preloaded from `index.html` and
registered at boot by `src/boot/preload.ts` (`registerFonts`), which the Title screen waits for.

## Contrast

`src/theme/contrast.ts` implements the WCAG relative-luminance ratio. `test/theme.test.ts` asserts the
values quoted in `product.md` (ink on paper 12.23, inkSoft on paper 7.44, inkSoft on paperDark 6.01,
paper on night 12.07, paper on nightMid 8.78, lamp on night 6.28, ink on lamp 6.36, lampDeep on paper 4.66,
paper on brick 5.76, paper on teal 5.27, paper on sage 5.31, rain on night 5.53), then every pair the
stylesheet and components use, in both modes (`tokenPairs(false)` and `tokenPairs(true)`, 36 pairs each):

- Normal mode: 18 text pairs (smallest 4.57, lamp text on nightMid) and 18 UI pairs (smallest 3.08, the border on a raised panel).
- High contrast: text pairs must reach 7:1 (smallest 8.26) and UI pairs 3:1 (smallest 8.26).
- Four colours are mixed from palette tokens because a token alone missed a target: `nightRaised`
  (nightMid mixed 10 percent with paper, raised panels), `tealLight` and `brickLight` (teal and brick
  mixed 50 percent with paper, status borders on night), `starOffPaper` (inkSoft mixed 30 percent with
  paper, hollow stars on paper, 3.58). High contrast replaces them with near-solid values.
- High contrast swaps `ink` to `#1B1209` and `night` to `#0F1826`, drops the paperDark fills and deepens
  brick, teal and sage so paper text on them reaches 7:1. Stars keep a number next to them; off stars are
  also dimmed (opacity 0.45) in high contrast.
- The code-drawn art uses only palette tokens or mixes of them (`FALLBACK_COLORS`); a test walks every
  `fill`, `stroke` and `stop-color` of all 60 drawings.

## Layout and accessibility checks

- `test/a11y.test.tsx` mounts every route (title, home with and without pending scenes, day, prep,
  late prep, shift, result, finale, scene, shop, journal, recipes, late, settings, how to play, credits)
  and every sheet (pause with the recipe book, quit, serve empty, purchase, reset, exit) and asserts, per
  interactive element: an accessible name, `min-width` and `min-height` of at least 44 px (resolved from
  the kit stylesheet, the game stylesheets and inline styles, with `var(--wg-hit-min)` = 44), and
  `assertNoPlatformFontFallback` with both families. A self-test proves the audit rejects an unsized
  button, an unnamed icon button and a serif paragraph.
- Body text is 16 px (`html` is `16px x --tlw-text-scale`, 1 or 1.25 for Large text); every other size
  is in `rem` and at least 0.875 rem (14 px).
- Information is not colour-only: the patience bar has a fill length plus a numeric badge with a clock
  icon under 10 seconds (and a dashed seat border with a striped fill); mood tags are an icon plus a
  word; the selected seat and station buttons use a thicker border; the recipe guide uses a double
  border; hearts and stars carry numbers in their labels.
- `aria-live=polite` announces arrivals, patience warnings, served outcomes with tips, wrong steps and
  customers leaving (`shift-live` region, tested).
- No `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource` or http URL exists in `src/`,
  apart from the three font licence links in `src/data/credits.ts` (grep tests). No source file exceeds
  800 lines (the largest is `src/screens.css` at about 400). No `any`.

## Runner

`src/shift/Runner.ts` owns the engine state and a time accumulator over an injected scheduler
(`requestAnimationFrame` in the browser, `createManualScheduler()` in tests). It calls `tickShift` once
per 100 ms, at most 5 ticks per frame (extra time is dropped), and stands still while the pause sheet is
open or the document is hidden. `test/runner.test.ts` covers accumulation, the catch-up cap, pause and
resume, hidden documents, actions, closing and disposal.

## Results of the verification commands

| Command | Result |
|---|---|
| `bun run --filter '@web-games/the-last-window*' typecheck` | exit 0 (core and app) |
| `bun run --filter '@web-games/the-last-window*' test` | core 604 tests in 37 files, app 247 tests in 13 files, all pass |
| `bun run --filter '@web-games/the-last-window' build` | built; `index-*.js` 236.6 kB (78.2 kB gzip), `index-*.css` 14.5 kB (3.4 kB gzip), five small Capacitor web shims (about 4.3 kB) |
| `bunx biome check apps-games/the-last-window apps-games/the-last-window-core` | clean |

The JS budget (300 KB gzip excluding art, fonts and audio) is met with room for audio, onboarding and
art loading. Fonts add 51,876 bytes.
