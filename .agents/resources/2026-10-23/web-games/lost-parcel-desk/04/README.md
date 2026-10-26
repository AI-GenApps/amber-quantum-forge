# Task 04 evidence - fonts, contrast and headless verification

No browser, device or emulator was used. Everything below is produced by shell tools and Vitest (happy-dom).

## Fonts

Both families are SIL Open Font License 1.1, downloaded from `github.com/google/fonts` (raw files on the
`main` branch, whose HEAD was `e7db6ca603fd4862010383ff17ffd6cc4ffac1c0` when checked after the download),
subset, converted to woff2 with an ephemeral tool environment (no project dependency changed) and bundled in
`apps-games/lost-parcel-desk/public/fonts/` with the family `OFL.txt`.

Tool environment: `uv 0.4.24`, `fonttools 4.67.0`, `brotli 1.2.1` (all through `uvx`/`uv run --with ...`, nothing
installed in the repo). Working directory: `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/lost-parcel-desk/fonts/`
(deleted when the task ended).

Source files:

| File | Source path in google/fonts | SHA-256 |
|---|---|---|
| `CourierPrime-Regular.ttf` | `ofl/courierprime/CourierPrime-Regular.ttf` | `72f793376f8e2841656bf21d77a5de010f2929bd6956a22ee848ad0c7eb978af` |
| `CourierPrime-Bold.ttf` | `ofl/courierprime/CourierPrime-Bold.ttf` | `ff1f38786c849d1c41fa8e447960abdb2bd75fdfb0cfcdeb524fad65a5af3638` |
| `IBMPlexSans[wdth,wght].ttf` | `ofl/ibmplexsans/IBMPlexSans[wdth,wght].ttf` | `3b031aa4216174205bd8471f88a49b91f093169e9e87bd5262242bc5967fe2e3` |
| `OFL.txt` (Courier Prime) | `ofl/courierprime/OFL.txt` | `9a755af092b494944c99f471be6fddd19b006a448fefdc4717e4ee0aa09a97b0` |
| `OFL.txt` (IBM Plex Sans) | `ofl/ibmplexsans/OFL.txt` | `7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da` |

Commands (`U` is the Unicode range: Basic Latin, Latin-1, U+2013, U+2014, U+2018 to U+201D, U+2022, U+2026):

```
U="U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018-201D,U+2022,U+2026"
uvx --with fonttools --with brotli fonttools subset courierprime/CourierPrime-Regular.ttf --unicodes="$U" --flavor=woff2 --layout-features='*' --output-file=out/CourierPrime-Regular.woff2
uvx --with fonttools --with brotli fonttools subset courierprime/CourierPrime-Bold.ttf    --unicodes="$U" --flavor=woff2 --layout-features='*' --output-file=out/CourierPrime-Bold.woff2
uvx --with fonttools --with brotli fonttools varLib.instancer "ibmplexsans/IBMPlexSans[wdth,wght].ttf" wdth=100 -o out/IBMPlexSans-wght.ttf
uvx --with fonttools --with brotli fonttools subset out/IBMPlexSans-wght.ttf --unicodes="$U" --flavor=woff2 --layout-features='*' --output-file=out/IBMPlexSans.woff2
```

The `wdth` axis is pinned at 100 and `wght` is kept (100 to 700). A check with `fontTools.ttLib` confirmed that
each output holds 200 glyph-mapped code points including U+00E9, U+2013, U+2014, U+2018, U+2019, U+201C, U+201D,
U+2022 and U+2026, and that the Plex file has the single axis `wght 100 / 400 / 700`.

Shipped files:

| File in `public/fonts/` | Bytes | Budget | SHA-256 |
|---|---|---|---|
| `courier-prime/CourierPrime-Regular.woff2` | 17,668 | 60 KB | `0f17499a29d2edffdcd7264f5e53241d4171a890c0b226da79eeb414ebe6842f` |
| `courier-prime/CourierPrime-Bold.woff2` | 18,172 | 60 KB | `74d3098ae4cf7442cf0ea63b6c3460b43ed60eece4f5f29f70992024b2dff6e2` |
| `ibm-plex-sans/IBMPlexSans.woff2` | 44,044 | 120 KB | `8dbc905e0b8b9c5f15490f7a5559d00cb5dae32a552542079fa61fbbd2117c16` |
| `courier-prime/OFL.txt`, `ibm-plex-sans/OFL.txt` | 4,403 and 4,456 | - | identical to the sources above |

Total woff2: 79,884 bytes (budget 300 KB). `test/fonts.test.ts` asserts the file list, the `wOF2` header, the per-file
and total budgets, the `OFL.txt` text, the `@font-face` rules and that the stylesheets name no other family.

Reserved Font Name: the IBM Plex `OFL.txt` declares the Reserved Font Name "Plex". Subsetting and axis pinning
produce a modified build whose name table keeps the upstream family name; this is recorded as Q12 in
`.agents/games/lost-parcel-desk/open-questions.md` for the owner.

## Contrast

`test/theme.test.ts` computes WCAG contrast for every foreground and background pair a desk theme puts on screen
(`themePairs(themeId)`, 21 pairs per theme: text, muted text, accent text, danger text, warning text, borders, focus
ring, toggle track and thumb, stamp icon, blotter edge) and for the 19 paper pairs shared by all themes
(`PAPER_PAIRS`). Text pairs must reach 4.5 and non-text pairs 3, for all 5 desk themes and for the high-contrast
variants. Teal is never the foreground of a text pair. The test also pins the measured values of the art bible
(for example ink on cream 13.06, cream on teal-deep 6.58, cream on brick 5.33).

Findings that changed the design while writing the test: the stamp icon in Midnight Sorting Room was brick on night
(2.72) and became mustard (7.61); functional borders on cream and cream-2 use a derived `lineStrong` `#6e6040`
because the art-bible `line` is only 2.92 on cream-2; muted text uses the derived `#3d4658` (light desks) and
`#d6cdb4` (dark desks).

## Hit areas and names

`test/a11y.test.tsx` parses the kit stylesheet and the game stylesheets for `min-width`, `min-height`, `width` and
`height` (and reads inline sizes), and asserts for every `button`, `[role=switch]` and `[role=tab]` on all 18
screens, the viewer (front, back, magnifier on), the board with links and a returned card, the reveal and every sheet
that it has an accessible name, at least 44 x 44 CSS px (hotspots 48) and that no text falls back to a platform font
(`assertNoPlatformFontFallback` with Courier Prime and IBM Plex Sans).

## Commands run

```
bun run --filter '@web-games/lost-parcel-desk*' typecheck
bun run --filter '@web-games/lost-parcel-desk*' test
bun run --filter '@web-games/lost-parcel-desk' build
bunx biome check apps-games/lost-parcel-desk apps-games/lost-parcel-desk-core
```

The results are in the task report and the commit message of the orchestrator; they are not repeated here so that
this file never goes stale.
