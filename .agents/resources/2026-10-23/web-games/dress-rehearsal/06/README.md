# Task 06 evidence - integrate reviewed art from the designer inbox

No image was looked at and no browser, device or emulator was used. Every decision below follows
the orchestrator's verdict and the designer review notes; every technical claim is an automated
check (`scripts/art-checks.ts`, re-run by `test/art-assets.test.ts`).

## Inputs

- Inbox (read-only, nothing deleted or modified): `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/dress-rehearsal/`.
- Verdict: the orchestrator's `accepted/` folder and its `accepted/manifest.json` (copied here as
  `art/accepted-manifest.json`, 60 entries with designer batch, round, prompt notes and the
  designer's own SHA-256). Only these 60 files were read. Nothing from `bN/round-R/out/` or `retry/`
  was copied, so no rejected or unreviewed delivery is in the repository.
- Art bible: `art/art-bible.md` (copy). Review notes: `art/reviews/<batch>/round-<n>.md` (copies of
  every `review/review.md` of the designer loop; contact-sheet PNGs were not copied).

## Result

- Accepted: 60 of 63 slots. Runtime WebP in `apps-games/dress-rehearsal/public/art/`: 58 files
  (754,078 bytes in total, the largest 42,024 bytes). `icon` and
  `feature-graphic` are store assets: master only. Masters: 60 files, 5,473,364 bytes in total, in
  `art/masters/`.
- Not integrated (code-drawn placeholder kept, listed in `assets-index.md` and `open-questions.md`):
  `key-art` (missing: no key-art.png delivered because the cover attempts failed; the retry cover was
  also rejected for style drift in `art/reviews/retry/round-3.md`), `item-rainy-city-5` (missing: no
  file delivered because all four candidates failed the designer's own self-review,
  `art/reviews/b2/round-4.md`; the retry in `art/reviews/retry/round-3.md` was rejected as well) and
  `item-studio-3` (rejected for a flat vector-sticker style, a ruler-straight cone skirt, an
  unreadable wrap band, airbrushed grey ribbons and a thin outline at small sizes).

## How the files were made (`bun run art` = `bun run scripts/build-art.ts`)

Deterministic and idempotent (two runs gave the same SHA-256 over all 58 runtime files). Tool:
`sharp` 0.35.3 (already a devDependency), no dependency change.

| Class | Source (delivered) | Runtime | Master |
|---|---|---|---|
| Piece (`item-*`) | 1024 x 1024 RGBA | 256 x 256, Lanczos3, WebP q82, lossless alpha | original size, WebP q90, lossless alpha |
| Client (`client-*`) | 1024 x 1536 RGBA | crop to the 3:4 content frame (x 2 to 1022, y 85 to 1445, art bible section 12), 360 x 480, WebP q82 | full 1024 x 1536 canvas, WebP q90 |
| Backdrop (`backdrop-*`) | 1024 x 1536 RGB | 800 x 1200, WebP q82 | original size, WebP q90 |
| `icon` | 1024 x 1024 RGB | none (store asset) | original size, WebP q90 |
| `feature-graphic` | 1536 x 1024 RGB | none (store asset) | original size, WebP q90 |

Metadata is stripped (no EXIF), single frame. Two deviations from the task text, both recorded in
`decisions-log.md` D32: masters keep the delivered generation size (the bible's 1600 x 2400 and
1536 x 2048 would only be an upscale), and the client runtime is cropped to the designer's 3:4
content frame instead of resized, because the delivered canvas is 2:3.

## Automated checks (per runtime file; any violation names the slot and fails the script and the test)

Exact pixel size and format; no animation; no EXIF; bytes at most 60,000 (piece), 100,000 (client),
400,000 (800 x 1200); total at most 8,000,000. Pieces and clients: alpha channel present, four
corner pixels alpha 0, outer 2 percent border alpha at most 8. Pieces: opaque (alpha 128 or more)
bounding box within the category scale of `assets-index.md` (neither axis more than 12 points above
the scale, at least one axis within 12 points below it), inside the 85 percent safe area (the table's
88 and 92 percent bottom and dress heights allowed plus 2 points), centred within 3 points. Clients:
opaque coverage 25 to 90 percent, centred, inside the safe width, not touching the top. Backdrops: no
alpha or fully opaque. The 12-point rule is read as the art bible reads it ("within the category
maximum and touching it on one axis"): thin pieces such as the pearl necklace or sunglasses are far
below the scale on one axis and pass because the other axis matches.

## Per-slot decision table

| Slot | Decision | Designer batch / round | Verdict reference (copied review notes) | Runtime file (bytes) | Master (bytes) | Source PNG SHA-256 |
|---|---|---|---|---|---|---|
| `icon` | accepted | b1 / 1 | `art/reviews/b1/round-1.md` | store asset, none | `art/masters/icon.webp` (31,108, 1024 x 1024) | `d2fc76cebf30566b340ae1a789adc144950edfe16a83a1424272539ca8dd5097` |
| `key-art` | missing: placeholder kept | retry / 3 | `art/reviews/retry/round-3.md` | none | none | none |
| `item-riviera-1` | accepted | b1 / 1 | `art/reviews/b1/round-1.md` | `public/art/item-riviera-1.webp` (9,924, 256 x 256) | `art/masters/item-riviera-1.webp` (78,288, 1024 x 1024) | `29d75e94b5b2c9e699721c535b13536cb56ba301ae809bc496e2acf7fe590634` |
| `item-riviera-2` | accepted | b2 / 1 | `art/reviews/b2/round-1.md` | `public/art/item-riviera-2.webp` (8,800, 256 x 256) | `art/masters/item-riviera-2.webp` (82,792, 1024 x 1024) | `1dacc4c12b24292d5d47e2c7253a6291c5dbe0943baeb1ab624f248c142b1bb8` |
| `item-riviera-3` | accepted | b2 / 1 | `art/reviews/b2/round-1.md` | `public/art/item-riviera-3.webp` (9,000, 256 x 256) | `art/masters/item-riviera-3.webp` (71,616, 1024 x 1024) | `6345e668a3c1aab12f45a7a7bd175949d3a69ef8ad45b536f01b80e7675503f9` |
| `item-riviera-4` | accepted | b2 / 2 | `art/reviews/b2/round-2.md` | `public/art/item-riviera-4.webp` (6,286, 256 x 256) | `art/masters/item-riviera-4.webp` (47,478, 1024 x 1024) | `b5a2eff4afec121d8d0255ae4b8c3092f2d278d9a44735e7126f2cf080d58b59` |
| `item-riviera-5` | accepted | b2 / 1 | `art/reviews/b2/round-1.md` | `public/art/item-riviera-5.webp` (10,620, 256 x 256) | `art/masters/item-riviera-5.webp` (93,310, 1024 x 1024) | `40d44aba0943ace32cf84b0d6de4f8ab2fea704b9504a477788fd57e34342000` |
| `item-riviera-6` | accepted | b2 / 1 | `art/reviews/b2/round-1.md` | `public/art/item-riviera-6.webp` (8,770, 256 x 256) | `art/masters/item-riviera-6.webp` (72,968, 1024 x 1024) | `4ccf450810ff7a60477db6c039062e3cfbafe01d610ac2cce39462b750519c92` |
| `item-riviera-7` | accepted | b2 / 1 | `art/reviews/b2/round-1.md` | `public/art/item-riviera-7.webp` (8,430, 256 x 256) | `art/masters/item-riviera-7.webp` (76,062, 1024 x 1024) | `279a4967259c74ab4307265f867516499d67dc7598c7bc148898959f75dcc190` |
| `item-riviera-8` | accepted | b2 / 1 | `art/reviews/b2/round-1.md` | `public/art/item-riviera-8.webp` (3,244, 256 x 256) | `art/masters/item-riviera-8.webp` (18,932, 1024 x 1024) | `0a2c2d8b070d2c36df594170014fd8942f02f79d4fe5723e841460c23951951b` |
| `item-rainy-city-1` | accepted | b2 / 1 | `art/reviews/b2/round-1.md` | `public/art/item-rainy-city-1.webp` (12,626, 256 x 256) | `art/masters/item-rainy-city-1.webp` (110,738, 1024 x 1024) | `d049d8211f957af476b2e8c636265c7d1167d43e1022b55942463c3739b04c58` |
| `item-rainy-city-2` | accepted | b2 / 1 | `art/reviews/b2/round-1.md` | `public/art/item-rainy-city-2.webp` (12,654, 256 x 256) | `art/masters/item-rainy-city-2.webp` (105,850, 1024 x 1024) | `8aca6308d011b8e97d212d6302c2fd756d1001e2cba170c39b268fa0e0c72307` |
| `item-rainy-city-3` | accepted | b2 / 2 | `art/reviews/b2/round-2.md` | `public/art/item-rainy-city-3.webp` (8,002, 256 x 256) | `art/masters/item-rainy-city-3.webp` (50,582, 1024 x 1024) | `6a76d3f1323064d1c910941c04116b056f588ae5e2ba6759168ae8f23ec1eb95` |
| `item-rainy-city-4` | accepted | b2 / 1 | `art/reviews/b2/round-1.md` | `public/art/item-rainy-city-4.webp` (7,310, 256 x 256) | `art/masters/item-rainy-city-4.webp` (55,744, 1024 x 1024) | `5dc07040f917c03577437e29de4539c5a9ff4c1110062e780057675c7216ceac` |
| `item-rainy-city-5` | missing: placeholder kept | b2 / 4 | `art/reviews/b2/round-4.md` | none | none | none |
| `item-rainy-city-6` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-rainy-city-6.webp` (7,720, 256 x 256) | `art/masters/item-rainy-city-6.webp` (71,644, 1024 x 1024) | `c69e5bf98c7dd99f0507676a0a6c42ed9912ec96f050b493b50a7ff10b18f7c5` |
| `item-rainy-city-7` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-rainy-city-7.webp` (9,038, 256 x 256) | `art/masters/item-rainy-city-7.webp` (70,460, 1024 x 1024) | `987e57f1e2ae57e94301a162c4e26f23612b03f3d2619047695a37a0fec5ce01` |
| `item-rainy-city-8` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-rainy-city-8.webp` (4,774, 256 x 256) | `art/masters/item-rainy-city-8.webp` (30,554, 1024 x 1024) | `c4cc7ca1d987c716068dc8a59331e5cd20501c4e30371c7cced3e6305cb75d0e` |
| `item-gala-1` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-gala-1.webp` (6,904, 256 x 256) | `art/masters/item-gala-1.webp` (49,446, 1024 x 1024) | `104643fe798901c1b74287c9bc8fb45b239204f8d798e14a2dfd43bfdadbd03b` |
| `item-gala-2` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-gala-2.webp` (9,562, 256 x 256) | `art/masters/item-gala-2.webp` (81,728, 1024 x 1024) | `5ace73a3231660ae2684b13316c7eef411be934911dde17a6c8796f404f5684c` |
| `item-gala-3` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-gala-3.webp` (10,810, 256 x 256) | `art/masters/item-gala-3.webp` (82,364, 1024 x 1024) | `4b54f75d950a2213c344c92da637e556f10c52ecb10e8b178bcb6d555489f539` |
| `item-gala-4` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-gala-4.webp` (6,874, 256 x 256) | `art/masters/item-gala-4.webp` (52,496, 1024 x 1024) | `67e8b0d007836552bb778a789349e905378aa76c06e93eb66ddf64558576eb8f` |
| `item-gala-5` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-gala-5.webp` (11,948, 256 x 256) | `art/masters/item-gala-5.webp` (92,018, 1024 x 1024) | `1d9f9e7df4dd45dbffe8eac6f1df6e8548263e3c309ea9498f47b08bb9aca372` |
| `item-gala-6` | accepted | b3 / 2 | `art/reviews/b3/round-2.md` | `public/art/item-gala-6.webp` (9,952, 256 x 256) | `art/masters/item-gala-6.webp` (78,844, 1024 x 1024) | `3481c341e7708552e7f7d8150a3f239a2dbe94c332d715e223f79ed964f9df39` |
| `item-gala-7` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-gala-7.webp` (7,304, 256 x 256) | `art/masters/item-gala-7.webp` (53,954, 1024 x 1024) | `d1c90c49dc64d4e21b4ce08030b89ec66ee32ee4a9f5164f43dc5a79b616280f` |
| `item-gala-8` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-gala-8.webp` (5,736, 256 x 256) | `art/masters/item-gala-8.webp` (39,612, 1024 x 1024) | `7afc6efded93645a7f09722c2a1e3046d95084b31e3045def5361e06ca983f43` |
| `item-mountain-1` | accepted | b3 / 1 | `art/reviews/b3/round-1.md` | `public/art/item-mountain-1.webp` (9,094, 256 x 256) | `art/masters/item-mountain-1.webp` (86,300, 1024 x 1024) | `b5bbaf59e96bd833196d6f94a792d7d69be6a5b8f3e0d59e0514447df77c7706` |
| `item-mountain-2` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-mountain-2.webp` (10,974, 256 x 256) | `art/masters/item-mountain-2.webp` (80,968, 1024 x 1024) | `33b35b8bab7121edfd57d54e3dbe17ccbe965badbd25d9317489f643d5d0b87a` |
| `item-mountain-3` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-mountain-3.webp` (9,330, 256 x 256) | `art/masters/item-mountain-3.webp` (79,872, 1024 x 1024) | `3192e362623c844bbc8fc569f6123eb9bfc8be8118ad4033cf0073f21212d4cd` |
| `item-mountain-4` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-mountain-4.webp` (11,302, 256 x 256) | `art/masters/item-mountain-4.webp` (105,462, 1024 x 1024) | `c6524e80a6d00fe8b0617bd394427d505bde29815b9b51f7c71dde3adaa49525` |
| `item-mountain-5` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-mountain-5.webp` (9,432, 256 x 256) | `art/masters/item-mountain-5.webp` (83,940, 1024 x 1024) | `5350e2e7d55075a021b63de3540a0b0049f1fae8940662043ab894e9ef2a6db0` |
| `item-mountain-6` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-mountain-6.webp` (8,090, 256 x 256) | `art/masters/item-mountain-6.webp` (78,084, 1024 x 1024) | `f541f03864022a77e0efdd096ab9bb030ef4de571c4b2bd898ed100a9f089c5b` |
| `item-mountain-7` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-mountain-7.webp` (8,426, 256 x 256) | `art/masters/item-mountain-7.webp` (93,728, 1024 x 1024) | `fa9d417831d13eb5f6d49229a8d12481abbff939652e52d0b02c8aa5fcea78ca` |
| `item-mountain-8` | accepted | b4 / 2 | `art/reviews/b4/round-2.md` | `public/art/item-mountain-8.webp` (6,540, 256 x 256) | `art/masters/item-mountain-8.webp` (52,870, 1024 x 1024) | `e3d7e44eb52118c6df5d1ba2631fee50bd4a8215678f820002441d7fb67b5547` |
| `item-studio-1` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-studio-1.webp` (7,146, 256 x 256) | `art/masters/item-studio-1.webp` (63,386, 1024 x 1024) | `c2fb74031f9d7821270daea88b04265cb16ee6634f02d05d31bea436afd25736` |
| `item-studio-2` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-studio-2.webp` (6,902, 256 x 256) | `art/masters/item-studio-2.webp` (44,400, 1024 x 1024) | `26735e79d55f73138b6a3808d5f9a96e786c920c01c64ee7491bce1b1febb09d` |
| `item-studio-3` | rejected: placeholder kept | retry / 3 | `art/reviews/retry/round-3.md` | none | none | none |
| `item-studio-4` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-studio-4.webp` (10,770, 256 x 256) | `art/masters/item-studio-4.webp` (90,068, 1024 x 1024) | `197b564c08ed440b4468196bf823a6136589d940b2607e5a1bb7fffdffb05b9c` |
| `item-studio-5` | accepted | b4 / 1 | `art/reviews/b4/round-1.md` | `public/art/item-studio-5.webp` (8,242, 256 x 256) | `art/masters/item-studio-5.webp` (71,820, 1024 x 1024) | `0ddcdcb61cee0c2c9d2a7118507086a7541cb7150fa39039f52fa84ebf9664f3` |
| `item-studio-6` | accepted | b5 / 1 | `art/reviews/b5/round-1.md` | `public/art/item-studio-6.webp` (7,352, 256 x 256) | `art/masters/item-studio-6.webp` (54,718, 1024 x 1024) | `d4d909b83d3dd673e92da0e614a2c3cb5f308a113dcc16846f9adc57501b8291` |
| `item-studio-7` | accepted | b5 / 1 | `art/reviews/b5/round-1.md` | `public/art/item-studio-7.webp` (7,572, 256 x 256) | `art/masters/item-studio-7.webp` (85,364, 1024 x 1024) | `d57e4727d47548169b6f64b913aac3e707860bfe09c1f6e1258cf6ef9de5000a` |
| `item-studio-8` | accepted | b5 / 1 | `art/reviews/b5/round-1.md` | `public/art/item-studio-8.webp` (5,826, 256 x 256) | `art/masters/item-studio-8.webp` (39,996, 1024 x 1024) | `ed233644cb9589c074d005cfe4a0df0a2d1114eaf3a217317b5dff224aff6e8a` |
| `item-vintage-1` | accepted | b5 / 2 | `art/reviews/b5/round-2.md` | `public/art/item-vintage-1.webp` (10,978, 256 x 256) | `art/masters/item-vintage-1.webp` (81,008, 1024 x 1024) | `c65959237345fb655cd2d607923fd999ea37c0f6d983ca0fd831691ac8695333` |
| `item-vintage-2` | accepted | b5 / 2 | `art/reviews/b5/round-2.md` | `public/art/item-vintage-2.webp` (8,962, 256 x 256) | `art/masters/item-vintage-2.webp` (83,632, 1024 x 1024) | `e9be41830e195c80ba2a387dd69f7d15928b64d4fbc8f3a77147e7058f71ae79` |
| `item-vintage-3` | accepted | b5 / 1 | `art/reviews/b5/round-1.md` | `public/art/item-vintage-3.webp` (11,368, 256 x 256) | `art/masters/item-vintage-3.webp` (95,358, 1024 x 1024) | `6b8110a855dc64bf0a2fce857ae205df89ae467e9713c78bba2c5472d17ffc03` |
| `item-vintage-4` | accepted | b5 / 1 | `art/reviews/b5/round-1.md` | `public/art/item-vintage-4.webp` (13,038, 256 x 256) | `art/masters/item-vintage-4.webp` (137,700, 1024 x 1024) | `525c7c533c3a484ddc37211f1d7a18345d7a714cd34165e3758357a93e41a042` |
| `item-vintage-5` | accepted | b5 / 1 | `art/reviews/b5/round-1.md` | `public/art/item-vintage-5.webp` (9,504, 256 x 256) | `art/masters/item-vintage-5.webp` (90,696, 1024 x 1024) | `94439e1f82d0fd4e97fa84beeafda4fd330c727ce9dfcf3ec555a97497419dc0` |
| `item-vintage-6` | accepted | b5 / 1 | `art/reviews/b5/round-1.md` | `public/art/item-vintage-6.webp` (7,072, 256 x 256) | `art/masters/item-vintage-6.webp` (68,006, 1024 x 1024) | `6be2bfd6ac6140a98253df1503c9842c86e44330023112f31d416bd3c19cba18` |
| `item-vintage-7` | accepted | b5 / 1 | `art/reviews/b5/round-1.md` | `public/art/item-vintage-7.webp` (5,928, 256 x 256) | `art/masters/item-vintage-7.webp` (57,944, 1024 x 1024) | `f96e6504b126c677468838d939346ba448104cba5b7611f8ac15cff8b7118b69` |
| `item-vintage-8` | accepted | b5 / 1 | `art/reviews/b5/round-1.md` | `public/art/item-vintage-8.webp` (7,008, 256 x 256) | `art/masters/item-vintage-8.webp` (47,462, 1024 x 1024) | `28e12eb53798334e4c08bbe5b74bc1e3053f6712b1e0be78729a2e6916818df4` |
| `client-1` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/client-1.webp` (41,732, 360 x 480) | `art/masters/client-1.webp` (289,816, 1024 x 1536) | `1111cbf1e82235f8171555b5984eaac44138b642977f224a35b7ef7c12803cd7` |
| `client-2` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/client-2.webp` (28,854, 360 x 480) | `art/masters/client-2.webp` (205,228, 1024 x 1536) | `945bc9bb632e85aa1eb9d09d584fa8fea0d7fce1f92a12a141e8aced461aadd6` |
| `client-3` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/client-3.webp` (27,042, 360 x 480) | `art/masters/client-3.webp` (178,134, 1024 x 1536) | `b10f2bbad1c8f02821bbc4593bba4e15e3b25db004f0023fd855dc0a4aadfa24` |
| `client-4` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/client-4.webp` (35,564, 360 x 480) | `art/masters/client-4.webp` (229,280, 1024 x 1536) | `b1d504ae3ad11550bc7aa30001c67971d97d533d7cfa4471eecb3e90d31e61fe` |
| `client-5` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/client-5.webp` (32,090, 360 x 480) | `art/masters/client-5.webp` (232,250, 1024 x 1536) | `4df65b49c4a9dc0fb1d9ad452d37440614917580966497cc87bba098ff94088c` |
| `client-6` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/client-6.webp` (42,024, 360 x 480) | `art/masters/client-6.webp` (291,070, 1024 x 1536) | `59851a29afa256f0a9714e47f468911833ac86a78780edd7624bb35484a4841b` |
| `backdrop-studio` | accepted | retry / 1 | `art/reviews/retry/round-1.md` | `public/art/backdrop-studio.webp` (28,082, 800 x 1200) | `art/masters/backdrop-studio.webp` (95,542, 1024 x 1536) | `764108af0a35ec49218b3d8b65002dc24081412921d2d9bed51b2dc5a3e60285` |
| `backdrop-riviera` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/backdrop-riviera.webp` (15,606, 800 x 1200) | `art/masters/backdrop-riviera.webp` (65,580, 1024 x 1536) | `1f74f8f87e3eb8ce1397d6ad479a640097763403ebc87738ee9f9577880166e4` |
| `backdrop-rainy-city` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/backdrop-rainy-city.webp` (26,442, 800 x 1200) | `art/masters/backdrop-rainy-city.webp` (98,808, 1024 x 1536) | `d5c58792cd15ada2374421ca71bdb6edb9f6337ac9bf1bb4c4c7cf8d5c5e94fb` |
| `backdrop-gala` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/backdrop-gala.webp` (26,456, 800 x 1200) | `art/masters/backdrop-gala.webp` (99,198, 1024 x 1536) | `212d5aff2cd2fe5e314f1e6b1a21ba90d89a8f29a05b1087c2da0485a02e608b` |
| `backdrop-mountain` | accepted | b6 / 2 | `art/reviews/b6/round-2.md` | `public/art/backdrop-mountain.webp` (26,212, 800 x 1200) | `art/masters/backdrop-mountain.webp` (87,632, 1024 x 1536) | `ffbffc407650f7061c8f9acfe3cdda8e83dcd4dfe896194ad9a9e6101daa5acb` |
| `backdrop-vintage` | accepted | b6 / 3 | `art/reviews/b6/round-3.md` | `public/art/backdrop-vintage.webp` (26,830, 800 x 1200) | `art/masters/backdrop-vintage.webp` (86,770, 1024 x 1536) | `cd05a4a5dd5d9b8ea8e8d1f4d499c75c87900031a51af1a486c66fec95d9c781` |
| `feature-graphic` | accepted | retry / 2 | `art/reviews/retry/round-2.md` | store asset, none | `art/masters/feature-graphic.webp` (142,686, 1536 x 1024) | `2e81e5837389498bfdbfbd322cc06dba58e01b10cea0b6ecdb476300c98e7f3d` |

## Code changes that came with the art

- `src/art/manifest.ts` block is generated by the script (58 entries); `Sprite` now reads the
  manifest from the app context when no prop is given, so one list drives every screen.
- `Result` sheet shows the client portrait beside the reaction line (code-drawn badge when the slot
  has no art, same box).
- The export renderer cover-fits the 2:3 backdrop into the board rect (clipped, centred) instead of
  stretching it.
- Credits screen: one art entry (MobileGamesDesigner thread, owned by the project).

## Verification (real output, task 06)

See the final run recorded in `tasks/epics/23-web-dress-rehearsal/STATUS.md` notes and the commit.
Not verified (owner browser QA): how any image looks, contrast of name plates over portraits, the
cropped board backdrop at phone sizes, the export PNG with backdrop art.
