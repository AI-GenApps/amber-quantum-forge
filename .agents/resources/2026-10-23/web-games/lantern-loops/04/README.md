# Task 04 evidence: screens, board, tokens, fonts, accessibility

Epic 19, task 04. No browser, screenshot or device was used (owner decision 4); everything below was
verified headlessly with Vitest (happy-dom), `tsc`, `vite build` and Biome.

## Fonts

| | Fraunces | Nunito |
|---|---|---|
| Role | display (titles, numerals, headings) | body (UI, labels) |
| Source | https://github.com/google/fonts/tree/e7db6ca603fd4862010383ff17ffd6cc4ffac1c0/ofl/fraunces | https://github.com/google/fonts/tree/e7db6ca603fd4862010383ff17ffd6cc4ffac1c0/ofl/nunito |
| Source file | `Fraunces[SOFT,WONK,opsz,wght].ttf` (360,440 bytes) | `Nunito[wght].ttf` (276,932 bytes) |
| Source SHA-256 | `177ff6c0f14e5550a3c624247cd1189611d4eb65d000b14944c63d967958abbb` | `bb55a5ca5c2042335b3991af27c4d0705d0ef41cac6164ac737fd8f2a1e85207` |
| Shipped file | `apps-games/lantern-loops/public/fonts/fraunces/Fraunces-Variable.woff2` | `apps-games/lantern-loops/public/fonts/nunito/Nunito-Variable.woff2` |
| Shipped size | 109,868 bytes | 32,776 bytes |
| Shipped SHA-256 | `06902db0749fe3852d6f0a89c42a0fd65ae4cb52cc655803fb6e7545cb6d7b4e` | `e7f5e0461b054c3c5fe22d34d3349e61ef5a677d6cd483a75c2d8d9cbe9392bf` |
| Licence | SIL OFL 1.1, `OFL.txt` copied from the same commit next to the font | same |

Commit `e7db6ca603fd4862010383ff17ffd6cc4ffac1c0` is the `main` head of `google/fonts` on 2026-10-23
(2026-10-23T02:02:18Z). Downloads were made with `curl` from `raw.githubusercontent.com` at that commit.

Subset command (fonttools in a venv under the scratch directory, `brotli` installed for woff2):

```
pyftsubset <source>.ttf \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,U+2212" \
  --flavor=woff2 --layout-features='kern,liga,lnum,onum,tnum,pnum' --output-file=<name>-Variable.woff2
```

All variation axes are kept (Fraunces: SOFT, WONK, opsz, wght; Nunito: wght). The star glyph is not in
the subset because every star in the UI is an SVG. The downloads and the venv were deleted from the
scratch directory when the task finished. Tests: `test/assets.test.ts` (files exist, woff2 magic bytes,
at most 120 KB each through the kit budget helper, an `OFL.txt` per font, page preload links) and the
font test in `test/screens.test.tsx` (kit `assertNoPlatformFontFallback` with Fraunces and Nunito on
every screen, fresh and finished profiles, no art files present).

## Contrast table

Produced by `test/helpers/contrast-pairs.ts` (the same rows the test asserts on): text pairs must reach
4.5:1, graphical pairs 3:1, in the default and the high-contrast theme. The test also prints this table.

| Pair | Foreground | Background | Ratio | Minimum |
|---|---|---|---|---|
| default text text on background | #F6EAD3 | #12132E | 15.22 | 4.5 |
| default text muted on background | #B9BBD6 | #12132E | 9.62 | 4.5 |
| default text text on surface | #F6EAD3 | #1E2050 | 12.80 | 4.5 |
| default text muted on surface | #B9BBD6 | #1E2050 | 8.09 | 4.5 |
| default text text on raised | #F6EAD3 | #2A2D66 | 10.58 | 4.5 |
| default text muted on raised | #B9BBD6 | #2A2D66 | 6.69 | 4.5 |
| default text accent text on accent | #241B2F | #F2A33A | 7.92 | 4.5 |
| default text accent text on danger | #241B2F | #E9657F | 5.21 | 4.5 |
| default text danger on surface | #E9657F | #1E2050 | 4.81 | 4.5 |
| default text success on surface | #3FBF98 | #1E2050 | 6.62 | 4.5 |
| default text stone numeral on stone | #241B2F | #F6EAD3 | 13.85 | 4.5 |
| default graphic border on background | #7C83C4 | #12132E | 5.09 | 3 |
| default graphic border on surface | #7C83C4 | #1E2050 | 4.28 | 3 |
| default graphic border on raised | #7C83C4 | #2A2D66 | 3.54 | 3 |
| default graphic focus on background | #8FD0FF | #12132E | 10.91 | 3 |
| default graphic tile ribbon on plate | #F6EAD3 | #1E2050 | 12.80 | 3 |
| default graphic unlit lantern on plate | #6E76A6 | #1E2050 | 3.49 | 3 |
| default graphic conflict ring on plate | #E9657F | #1E2050 | 4.81 | 3 |
| default graphic amber lantern on plate | #F2A33A | #1E2050 | 7.31 | 3 |
| default graphic glyph ink on amber body | #241B2F | #F2A33A | 7.92 | 3 |
| default graphic rose lantern on plate | #E9657F | #1E2050 | 4.81 | 3 |
| default graphic glyph ink on rose body | #241B2F | #E9657F | 5.21 | 3 |
| default graphic jade lantern on plate | #3FBF98 | #1E2050 | 6.62 | 3 |
| default graphic glyph ink on jade body | #241B2F | #3FBF98 | 7.16 | 3 |
| default graphic azure lantern on plate | #4EA6EA | #1E2050 | 5.78 | 3 |
| default graphic glyph ink on azure body | #241B2F | #4EA6EA | 6.26 | 3 |
| default graphic violet lantern on plate | #9A7DE3 | #1E2050 | 4.66 | 3 |
| default graphic glyph ink on violet body | #241B2F | #9A7DE3 | 5.04 | 3 |
| default graphic glyph ink on unlit body | #241B2F | #6E76A6 | 3.78 | 3 |
| default graphic tile outline on plate (high contrast ribbons) | #F6EAD3 | #241B2F | 13.85 | 3 |
| high-contrast text text on background | #FFFFFF | #0A0B1F | 19.43 | 4.5 |
| high-contrast text muted on background | #DADCF0 | #0A0B1F | 14.32 | 4.5 |
| high-contrast text text on surface | #FFFFFF | #14163D | 17.33 | 4.5 |
| high-contrast text muted on surface | #DADCF0 | #14163D | 12.77 | 4.5 |
| high-contrast text text on raised | #FFFFFF | #20235A | 14.49 | 4.5 |
| high-contrast text muted on raised | #DADCF0 | #20235A | 10.68 | 4.5 |
| high-contrast text accent text on accent | #000000 | #FFB84D | 12.22 | 4.5 |
| high-contrast text accent text on danger | #000000 | #FF8FA6 | 9.73 | 4.5 |
| high-contrast text danger on surface | #FF8FA6 | #14163D | 8.03 | 4.5 |
| high-contrast text success on surface | #5EE0B6 | #14163D | 10.57 | 4.5 |
| high-contrast text stone numeral on stone | #000000 | #FFFFFF | 21.00 | 4.5 |
| high-contrast graphic border on background | #C2C8F0 | #0A0B1F | 11.86 | 3 |
| high-contrast graphic border on surface | #C2C8F0 | #14163D | 10.57 | 3 |
| high-contrast graphic border on raised | #C2C8F0 | #20235A | 8.84 | 3 |
| high-contrast graphic focus on background | #FFFFFF | #0A0B1F | 19.43 | 3 |
| high-contrast graphic tile ribbon on plate | #FFFFFF | #14163D | 17.33 | 3 |
| high-contrast graphic unlit lantern on plate | #A9B1E0 | #14163D | 8.29 | 3 |
| high-contrast graphic conflict ring on plate | #FF8FA6 | #14163D | 8.03 | 3 |
| high-contrast graphic amber lantern on plate | #FFB84D | #14163D | 10.08 | 3 |
| high-contrast graphic glyph ink on amber body | #000000 | #FFB84D | 12.22 | 3 |
| high-contrast graphic rose lantern on plate | #FF8FA6 | #14163D | 8.03 | 3 |
| high-contrast graphic glyph ink on rose body | #000000 | #FF8FA6 | 9.73 | 3 |
| high-contrast graphic jade lantern on plate | #5EE0B6 | #14163D | 10.57 | 3 |
| high-contrast graphic glyph ink on jade body | #000000 | #5EE0B6 | 12.81 | 3 |
| high-contrast graphic azure lantern on plate | #7CC4FF | #14163D | 9.24 | 3 |
| high-contrast graphic glyph ink on azure body | #000000 | #7CC4FF | 11.20 | 3 |
| high-contrast graphic violet lantern on plate | #B9A2FF | #14163D | 7.98 | 3 |
| high-contrast graphic glyph ink on violet body | #000000 | #B9A2FF | 9.67 | 3 |
| high-contrast graphic glyph ink on unlit body | #000000 | #A9B1E0 | 10.05 | 3 |
| high-contrast graphic tile outline on plate (high contrast ribbons) | #FFFFFF | #000000 | 21.00 | 3 |

Two hexes were adjusted to pass: the unlit lantern `#5C6385` became `#6E76A6` (it measured 2.6:1 on the
board plate) and the UI border `#7C83C4` (it measured 2.76:1 on the raised surface). `content-plan.md`
section 7 carries the final token table.

## Verification results (2026-10-23)

| Command | Result |
|---|---|
| `bun run --filter '@web-games/lantern-loops*' typecheck` | pass (app and core) |
| `bun run --filter '@web-games/lantern-loops*' test` | pass: core 28 files, 389 tests; app 22 files, 223 tests |
| `bun run --filter '@web-games/lantern-loops' build` | pass; main chunk 195.8 kB, 64.6 kB gzip (budget 300 KB gzip); fonts copied to `dist/fonts` |
| `bunx biome check apps-games/lantern-loops apps-games/lantern-loops-core` | pass, no diagnostics |

No pre-existing failure was hit, so no baseline run in a throwaway worktree was needed.

## What the tests cover (acceptance criteria)

| Criterion | Test file |
|---|---|
| Render tests per screen and overlay with fresh, mid-game and finished profiles; chapter locks with 45/120/210 and "N stars to go" | `screens.test.tsx`, `overlays.test.tsx`, `boot.test.tsx` |
| Board fixture per mechanic, drag, tap cycles, long press, locked cells, keyboard solve, conflicts, win sheet star counts | `board.test.tsx`, `puzzle-flow.test.tsx`, `session.test.ts` |
| Contrast (prints the table) | `theme.test.ts` |
| Hit areas (`layoutBoard`, `--ll-hit: 44px`, `min-height: var(--ll-hit)`) | `layout.test.ts`, `theme.test.ts` |
| Fonts | `assets.test.ts`, `screens.test.tsx` |
| Art slots and fallbacks without `<text>` | `art.test.tsx` |
| Reduced motion (counts `Element.animate` calls) | `navigation.test.tsx`, `winSequence.test.ts` |
| Strings (TypeScript AST scan of JSX text and copy attributes) | `strings.test.ts` |
| Android back (sheet, screen, Home exit prompt) | `navigation.test.tsx` |
| No file over 800 lines, no `any` | `files.test.ts` |

## Not checked here (owner browser QA)

Real pointer and touch feel, drag smoothness on a phone, font rendering and swap flash, layout at 130%
system font scale, the look of the code-drawn backdrops, the win sequence timing, safe-area insets.
