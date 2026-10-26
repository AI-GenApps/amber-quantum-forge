# Task 04 evidence: screens, design tokens, fonts, accessibility

Headless verification only (Vitest with happy-dom, `tsc`, `vite build`, Biome). No browser, screenshot,
emulator or device was used; the owner judges the look in the browser at the end of the epic.

## Fonts (OFL)

Downloaded on 2026-10-23 from `https://github.com/google/fonts` (`main`, repository HEAD
`e7db6ca603fd4862010383ff17ffd6cc4ffac1c0`) into the scratch directory
`/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/cloud-observatory/fonts/` (deleted afterwards).

| Family | Source path | Last commit touching the path | Source file | Licence |
|---|---|---|---|---|
| Cormorant Garamond | `ofl/cormorantgaramond` | `3dd78844021e948ceb633d1dcee3f7885561b5d9` | `CormorantGaramond[wght].ttf`, `CormorantGaramond-Italic[wght].ttf` | SIL OFL 1.1, `OFL.txt` copied from the same directory |
| Manrope | `ofl/manrope` | `b31870aff700ab7a1d74fa0c6887d95beb9e0037` | `Manrope[wght].ttf` | SIL OFL 1.1, `OFL.txt` copied from the same directory |

Bundled files (`apps-games/cloud-observatory/public/fonts/`):

| File | Bytes | Use |
|---|---|---|
| `cormorant-garamond/CormorantGaramond-Medium.woff2` | 18,096 | Display, weight 500 |
| `cormorant-garamond/CormorantGaramond-Bold.woff2` | 17,272 | Display, weight 700 (titles, big numbers) |
| `cormorant-garamond/CormorantGaramond-MediumItalic.woff2` | 19,124 | Display italic 500 (reserved for flavour text) |
| `manrope/Manrope-Variable.woff2` | 22,300 | Body, variable weight 400 to 700 (the file keeps the full 200 to 800 axis) |
| `*/OFL.txt` (2 files) | 4,387 each | Licence text |

Total woff2: 76,792 bytes (budget 400,000). A unit test checks the budget with the kit's
`assertAssetBudget`.

Subset command (Python fontTools 4.61.1 with brotli). Latin set: U+0020-007E, U+00A0-00FF, U+0131,
U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2013-2014, U+2018-201D, U+2020-2022, U+2026,
U+2032-2033, U+2190-2193, U+2212, U+2215. The multiplication sign (U+00D7) used by the buy buttons is
inside the Latin-1 range.

```
python3 -m fontTools.varLib.instancer CormorantGaramond[wght].ttf wght=500 -o cg-500.ttf
python3 -m fontTools.varLib.instancer CormorantGaramond[wght].ttf wght=700 -o cg-700.ttf
python3 -m fontTools.varLib.instancer CormorantGaramond-Italic[wght].ttf wght=500 -o cg-i500.ttf
pyftsubset cg-500.ttf --unicodes="$U" --flavor=woff2 --layout-features='kern,liga,lnum,pnum,tnum,onum,ccmp,locl,mark,mkmk' --output-file=CormorantGaramond-Medium.woff2
(same for cg-700 -> CormorantGaramond-Bold.woff2 and cg-i500 -> CormorantGaramond-MediumItalic.woff2)
pyftsubset Manrope[wght].ttf --unicodes="$U" --flavor=woff2 --layout-features='kern,liga,tnum,lnum,pnum,ccmp,locl,mark,mkmk,calt' --output-file=Manrope-Variable.woff2
```

The `tnum` feature stays in both families; `.co-num` turns tabular figures on for every counter.

## Design tokens and contrast

`src/ui/tokens.ts` maps the art bible to the kit's `ThemeTokens` (background `#101A33`, surface
`#172445`, raised `#22335C`, text `#F3E9D2`, muted text `#C9BFA4`, accent `#D8A94B`, accent text
`#0B1226`, danger `#F08A78`, success `#8FCB9B`, focus `#EBCB85`) plus a high-contrast variant and the
`--co-hit: 44px` token. `textPairs()` lists every foreground and background combination that text is
drawn in (19 pairs per variant); `test/ui/a11y.test.tsx` computes the WCAG ratio of each from hex and
requires at least 4.5:1. All pass in both variants. Default variant: lowest 5.71:1 (tertiary text
`#A39E8F` on the surface), then 6.26:1 (danger on surface), 6.44:1 (tertiary on the page background);
highest 14.29:1 (parchment on the page background). High-contrast variant: lowest 7.63:1, highest
15.41:1 (parchment on solid `#0B1226`).

## Bundle size (task 04 measurement, hard gate is task 08)

`bun run --filter '@web-games/cloud-observatory' build`:

| Output | Raw | Gzip |
|---|---|---|
| `dist/assets/index-*.js` (app, core, kit, Preact) | 172.00 kB | 55.91 kB |
| five small Capacitor `web-*.js` chunks | 4.3 kB | 2.2 kB |

About 58 kB gzip in total against the 300 kB budget. The fonts (76.8 kB) are separate files.

## Test map

| Acceptance item | Test file |
|---|---|
| Every screen at three progress points, with counts 8, 12, 10, 30, 20 | `test/ui/screens.test.tsx` |
| Interaction flows (gather, buy, atlas to board, full chart, wrong tap, Eclipse, boons, journal, comet once per date, settings, reset, welcome back) | `test/ui/flows.test.tsx` |
| Contrast, 44 px classes, rem fonts, names, live region throttle, ring and badge, 24 px hit radius, reduced motion | `test/ui/a11y.test.tsx` |
| Bundled fonts only, CSS font-family scan, font assets and budget, font registration timeout | `test/ui/fonts.test.tsx` |
| Back button order | `test/ui/back.test.tsx` |
| 33 placeholders and manifest images | `test/ui/art.test.tsx` |
| Game loop cap, dev speed flag in both branches, lifecycle pause, long press | `test/ui/loop.test.tsx` |
| Pure view helpers and map geometry | `test/ui/derive.test.ts`, `test/ui/geometry.test.ts`, `test/ui/components.test.tsx` |
