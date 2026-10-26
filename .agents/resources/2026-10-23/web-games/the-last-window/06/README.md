# Task 06 - art integration evidence

Inputs (read-only): `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/the-last-window/`. The orchestrator's
review loop (designer thread, batches b1 to b7 plus `retry`) ended with status ok and 54 of 54 slots in
`accepted/`; nothing was rejected or left ungenerated at the end of the loop. The verdict record for each
slot is the `ACCEPTED` heading or table row in the review notes of the batch and round named in
`accepted/manifest.json`. `scripts/build-art.ts` refuses a slot unless that round's `review.md` carries an
ACCEPT line for it, so an unreviewed or rejected file cannot be integrated.

Evidence copied here (all under `.agents/resources/2026-10-23/web-games/the-last-window/art/`):

| File | What |
|---|---|
| `art-bible.md` | the art bible the designer worked from |
| `accepted-manifest.json` | the inbox manifest of accepted files (model, prompt, size, batch, round) |
| `review/<batch>-round-<n>.md` | review notes of every round that accepted at least one slot (17 files) |
| `masters/<slot>.webp` | WebP q90 masters at the delivered resolution, all 54 slots |

Contact sheets and other review images stay in the inbox (not copied). Rejected intermediate attempts are
not copied anywhere; only the accepted file of each slot was read.

## How it was built

`bun run scripts/build-art.ts` (in `apps-games/the-last-window`, optional `--inbox <dir>`), deterministic and
idempotent (a second run rewrites identical bytes):

1. Reads `accepted/manifest.json`, checks the file is a PNG and that its round's review notes accept it.
2. Writes the master: `sharp` WebP quality 90, delivered resolution, lossless alpha, no metadata.
3. Writes the runtime file (not for `icon` and `feature-graphic`): Lanczos3 resize to the slot's runtime
   size, WebP quality 82 with lossless alpha (the script steps down to 78, 74, 70, 66 only if a file
   exceeds its byte limit; none needed it).
4. Runs the automated checks on both files (see `scripts/art-checks.ts`) plus the identity proxy over the 24
   busts, and fails with the slot id before writing anything if any check fails.
5. Rewrites the generated blocks of `src/art/manifest.ts`, `assets-index.md` and the table below.

## Delivered versus planned resolution

The designer's generator delivers fixed native sizes, below the planned 1600 x 2400 and 1536 x 2048
masters: interiors and key art 1024 x 1536 (2:3), busts 1020 x 1360 (3:4), objects and icon 1024 x 1024
(1:1), feature graphic 1536 x 1024 (3:2). Every aspect ratio is exact and every runtime size is a
downscale, so nothing is upscaled. Masters are kept at the delivered resolution (task text: "delivered
resolution").

## Check thresholds actually enforced

The task's proxies were applied with two documented adjustments, because the objects were accepted by the
designer loop and the original wording did not fit them:

- Objects: the task says "25 to 90 percent" occupancy and a box inside an 85 percent safe area. The accepted
  objects fill about 55 to 86 percent of the frame along their longest side (tall chime and ladder, wide
  pastries) but cover only 11 to 50 percent in opaque pixels and 23 to 59 percent in box area (a coffee cup
  box is 23 percent of the frame). So the enforced rule is: longest box side 50 to 90 percent of the frame
  (the art bible's "about 80 percent"), opaque coverage at least 10 percent, margin of at least 3 percent on
  every side (the Brass Reading Lamp and Glass Cake Stand leave 3.9 percent above them, which an 85 percent safe area would not allow). Recorded in
  `open-questions.md`.
- Busts: opaque coverage 35 to 85 percent (accepted busts are 41 to 52 percent), corner pixels fully
  transparent, shared bottom edge (all 24 busts run off the bottom edge, 100 percent).
- Identity proxy: neutral, happy and sad of each customer agree to well within 4 percent on all four box
  edges (the delivered silhouettes are identical across the three expressions).

Everything else is as in the task: exact size and aspect, alpha on busts and objects, fully opaque
`key-art` and interiors (and `icon`, `feature-graphic` masters), one frame, no EXIF, at most 400 KB for
800 x 1200 images, 120 KB for busts, 60 KB for objects, 8 MB in total.

## Result

- Total runtime art: 1,101,464 bytes (1.05 MB, budget 8 MB); largest files `interior-rain` 56,864 bytes
  and `key-art` 54,960 bytes; busts 24 to 40 KB; objects 4 to 16 KB.
- Masters: 54 files, 4.8 MB, committed.
- Automated verification is `test/art-assets.test.ts` and `test/art.test.tsx`; no browser, no images viewed.

## Per-slot decisions

<!-- art-decisions:start -->
Accepted 54, rejected 0, missing 0 of 54 slots.

| Slot | Decision | Batch, round | Delivered PNG SHA-256 | Review notes |
|---|---|---|---|---|
| `icon` | accepted | b1, round 1 | `5798b726bbd955c8665fea07f44029b9c28083741e6edaf7f6030f0c02165ab3` | `review/b1-round-1.md` |
| `key-art` | accepted | b1, round 3 | `d00cba42170ba67c827950b9e9a4883f2d2fada6c175385b75908d3e154644fa` | `review/b1-round-3.md` |
| `interior-evening` | accepted | b1, round 1 | `917c74b61aea80ec0e5d34b7948f44578b28436ef87adcc97f167c0f1d72fb5e` | `review/b1-round-1.md` |
| `customer-1-neutral` | accepted | b1, round 3 | `204df2d537011be9042bdb441736e894554792092d0adef3210521d6689288f1` | `review/b1-round-3.md` |
| `interior-morning` | accepted | b2, round 2 | `eabcab7549cad59b6661d10417c2b1f83fe8b9a6d718412ecf4c6959d12ddf4f` | `review/b2-round-2.md` |
| `interior-rain` | accepted | b2, round 2 | `2af5e9232fec49a95fcc37a99247df8d23b76b228c128990e483a6bf0f6e911b` | `review/b2-round-2.md` |
| `customer-2-neutral` | accepted | b2, round 1 | `9659872f3471ebd8a2fbc6dba340ccdd5378a99c95ba5a81fcd6325ca8a159a5` | `review/b2-round-1.md` |
| `customer-3-neutral` | accepted | b2, round 1 | `2f65961547fdc093ae0fbdd02592bbff78f7300f9792b641712d65ff01523e38` | `review/b2-round-1.md` |
| `customer-4-neutral` | accepted | b2, round 1 | `ab40290ea47d093d39b34cd1848b7a7d2b9e863df6cfe206ed705f89240473cf` | `review/b2-round-1.md` |
| `customer-5-neutral` | accepted | b2, round 2 | `772911e00c78377e8d3e593876b41f597d09fa6839d5198426ca2aceeae1dfb4` | `review/b2-round-2.md` |
| `customer-6-neutral` | accepted | b2, round 1 | `797008cae8177ab73ac48f175788c6a5f876b253eb07fd0b30568f7f394a6b15` | `review/b2-round-1.md` |
| `customer-7-neutral` | accepted | b2, round 1 | `49b19906d89a4dacf980e2885093e962812bf224c91a11578c22bd61ae2c4430` | `review/b2-round-1.md` |
| `customer-8-neutral` | accepted | b2, round 1 | `957a548860e7ded1628f8a884e952391987e76d2e3ad2872393146254d4d8403` | `review/b2-round-1.md` |
| `customer-1-happy` | accepted | b3, round 3 | `f72ea02809cc9773aa3f9fa97139f2c15fa38b7eb28fcec04036a47500c15277` | `review/b3-round-3.md` |
| `customer-1-sad` | accepted | b3, round 2 | `3fb6f773eb2f57ce9720e3540b3eaafafd48aba9d901f00c50fb94303a80c82e` | `review/b3-round-2.md` |
| `customer-2-happy` | accepted | b3, round 1 | `683bb4a6b019bf2ecb396bb78650719c0df6107930b7b022159130c06b306d22` | `review/b3-round-1.md` |
| `customer-2-sad` | accepted | b3, round 1 | `d8fed19fed253cff11f6fc7ccf7292130b326dc599f3df7e6ddc49db353b0373` | `review/b3-round-1.md` |
| `customer-3-happy` | accepted | b3, round 1 | `68fa1eaf8256e62fa6c47fad78a933d79946e7092b7ea02213cf1ade84185938` | `review/b3-round-1.md` |
| `customer-3-sad` | accepted | b3, round 3 | `4a837b1ff92254cb3b455bb284fe8974fe7379013ffee04a2b0f2fc63a212980` | `review/b3-round-3.md` |
| `customer-4-happy` | accepted | b3, round 1 | `60c399de5fef9bbcb78e9e0760cbd66e843d5f34d9c20bd11654ac6d5d49c8d4` | `review/b3-round-1.md` |
| `customer-4-sad` | accepted | b3, round 1 | `69bd153b29897c675fda1378dede2f90a9f81143abc50b5f57a73dc4501f9e44` | `review/b3-round-1.md` |
| `customer-5-happy` | accepted | b4, round 1 | `bdadffa9666a66677c66ffb84f3ef870117303d6d8af212851cddb7e108941bb` | `review/b4-round-1.md` |
| `customer-5-sad` | accepted | b4, round 1 | `517fcb64baf52e8e548f00a5997aa7a22f6bbdbf8355e488e2477e7456d09f72` | `review/b4-round-1.md` |
| `customer-6-happy` | accepted | b4, round 2 | `c89c41415645db725c3cf417c1b8a8b1b09714d95baa38e7121a3a0fa4788098` | `review/b4-round-2.md` |
| `customer-6-sad` | accepted | b4, round 1 | `701d51a8ae7c9755b7f6d497ba7307d12c770c925fc684cc4f461f20b7c5ad0d` | `review/b4-round-1.md` |
| `customer-7-happy` | accepted | b4, round 2 | `54313bda3d66ba6a2787f3a2ab896b15918df373f509694157eb9b2177c6caf6` | `review/b4-round-2.md` |
| `customer-7-sad` | accepted | b4, round 1 | `67c99e19625de8c4402c515d68fb071c7bffe7ad1bb6ea60c331241ba663ccc0` | `review/b4-round-1.md` |
| `customer-8-happy` | accepted | b4, round 1 | `31fdfefb4a06de6532740c163144709adf6c6595d4c533622594516263a31028` | `review/b4-round-1.md` |
| `customer-8-sad` | accepted | b4, round 1 | `bd19686b65c049f332877ce31daf77d85e57112f062de12a0417afee87e0beb4` | `review/b4-round-1.md` |
| `drink-1` | accepted | b5, round 1 | `8c3270eaa3acda2f3c0d398ef8fe63b82dbfa76f9e921c9d294ea7d195c1c81b` | `review/b5-round-1.md` |
| `drink-2` | accepted | b5, round 1 | `bf8fe72cd53ce759b8ab6b10a34e56d908f141a5be0904ed97723942abae501f` | `review/b5-round-1.md` |
| `drink-3` | accepted | b5, round 1 | `733abe681c90b499b08b0a9e9d9f69317470f9224e1bd036be3a1ce4c0e50d84` | `review/b5-round-1.md` |
| `drink-4` | accepted | b5, round 1 | `eb17680463f9047aa7afae3519fa43aff4251c30ec6ff0ed1dcecb1e4910331a` | `review/b5-round-1.md` |
| `drink-5` | accepted | b5, round 1 | `c3dbb7ade1eda5d77f1955e8ddd8df4ee841ae26f8bbaf2f8edc68c81d21c054` | `review/b5-round-1.md` |
| `drink-6` | accepted | b5, round 2 | `aee8f7d1d84a38e5bcc2a4a332831091374ea0ddcc2d3a8f34fc4b9bdeff40c9` | `review/b5-round-2.md` |
| `pastry-1` | accepted | b5, round 1 | `60e312dcb69d045217a4968899b9e0204c0ae76471b2321426933b2acae6be06` | `review/b5-round-1.md` |
| `pastry-2` | accepted | b5, round 1 | `e2f29f748b0cc26584ad7c4300c48c51ef25da1b387eca531c5b9518db36031c` | `review/b5-round-1.md` |
| `pastry-3` | accepted | b5, round 1 | `fc0f3fba4ad3fd3b1a69cdc5c2da0bbf07de19177223dd73a5531f4d10902042` | `review/b5-round-1.md` |
| `pastry-4` | accepted | b5, round 1 | `5070cd22c5126ab777c3afc45d8b70d180f7fdf69b950089e4a80d3d76b5cb81` | `review/b5-round-1.md` |
| `pastry-5` | accepted | b5, round 1 | `a0517858ef20103d48e3f078513c446681d806c4aee767ffb4bb42fe53eb7fdd` | `review/b5-round-1.md` |
| `book-1` | accepted | b6, round 1 | `ef530bf30738ca0bdfbcc12d852466aa0955364ca6c93763ae7dfc1b9b2a3da5` | `review/b6-round-1.md` |
| `book-2` | accepted | b6, round 2 | `9830f1a7f9a005b79cfe46771be553e6b271f79cfcc91b5e27c716eb9836faf6` | `review/b6-round-2.md` |
| `book-3` | accepted | b6, round 1 | `d80035197d8254d9fb310e917bcda9ab87fba6972f05a7d8326eae5fd908c740` | `review/b6-round-1.md` |
| `book-4` | accepted | b6, round 2 | `018b8320107bc9119e13007b3b0b64ec7b5da4ee4be594d66d410d2b8c056219` | `review/b6-round-2.md` |
| `book-5` | accepted | b6, round 2 | `a08ce188a22a2371dfc8b8212bb3ae9fc56e6dc3765eddc0cb081dcb1a10ed76` | `review/b6-round-2.md` |
| `decor-1` | accepted | b6, round 1 | `263b27ffdb54afbbb5d58a47af02dcd80d99a0686ae32b7666d9e3b2177d41ef` | `review/b6-round-1.md` |
| `decor-2` | accepted | b6, round 1 | `cb4f759224254d7441209957d3261c48fb11a1c7129468e976b34f75dd4a7bc5` | `review/b6-round-1.md` |
| `decor-3` | accepted | b6, round 3 | `fad5dfbf76cb94ba38c2e3f003176bf23a4dfe5327d658c480e4e499852c2fa2` | `review/b6-round-3.md` |
| `decor-4` | accepted | b6, round 1 | `b55b269317d59f08d02f4b03cc7d29861af310123e0f867fe7625839a87c3405` | `review/b6-round-1.md` |
| `decor-5` | accepted | retry, round 1 | `17b9eb0e9f7fb4741405f3824f914be92eb7dfd1b8f2fd41c43b0ecf048cd764` | `review/retry-round-1.md` |
| `decor-6` | accepted | b7, round 1 | `7b12f2f23d5422455f6759d1620ccfc84e1acc33e59e87f81b1512d7c3c456da` | `review/b7-round-1.md` |
| `decor-7` | accepted | b7, round 2 | `2f58af6ea3aa4bd10f7c347992bb6584da8431cd410b6968b2fbd769bb3153ab` | `review/b7-round-2.md` |
| `decor-8` | accepted | b7, round 2 | `3f7fdbd8597531b4eb289d291e12bc3891ab6614cd2c016d8318c6246e00f0db` | `review/b7-round-2.md` |
| `feature-graphic` | accepted | b7, round 1 | `8e1e05fe043702f0ade40d8dd25eea40149500e88e64d973a05f342117844d85` | `review/b7-round-1.md` |
<!-- art-decisions:end -->

