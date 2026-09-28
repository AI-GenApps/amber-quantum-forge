# Threes! (Sirvo) — store-listing reference screenshots

Internal reference only. Retrieved 2026-09-25. **Never copied, traced, shipped,
or put in public docs** — these are copyrighted third-party marketing images,
used only to calibrate the Merge Relay visual target (see
`../merge-relay-visual-reference/README.md`).

Sources used, per the task's minimum-set rule ("≥6 images, both Play
listings; App Store as an extra source if Play gives fewer than 5 gameplay
images"):

- Play (paid): `https://play.google.com/store/apps/details?id=vo.threes.exclaim&hl=en_US&gl=US`
- Play (freeplay): `https://play.google.com/store/apps/details?id=vo.threes.free&hl=en_US&gl=US`
- App Store: `https://apps.apple.com/us/app/threes/id779157948` (screenshot
  URLs pulled from `https://itunes.apple.com/lookup?id=779157948&country=us`
  after the direct apps.apple.com fetch returned HTTP 429; the iTunes lookup
  API serves the same store-listing screenshot set)

## What was found

Threes! ships only **4 distinct marketing screenshot compositions** on its
Play (paid) listing, repeated across the phone/7"-tablet/10"-tablet screenshot
buckets Play generates. The freeplay Play listing (`vo.threes.free`) reuses
the **exact same 4 images** pixel-for-pixel (confirmed by downloading and
comparing) — logged here rather than kept as separate files, per the
"delete non-gameplay/duplicate captures and log it" instruction. The App
Store listing reuses the same compositions too, but its iOS build renders a
different top-right icon ("challenge" vs. Android's "stats"), which is a
real, checkable platform difference, so one App Store capture was kept.

Final set (6 files, meets the ≥6 minimum, draws from both Play listings by
inspection and from the App Store as documented above):

| File | Screen | Source | Notes |
|---|---|---|---|
| `01.png` | Home / mid-game board (Android) | Play paid | Tagline "A TINY PUZZLE THAT GROWS ON YOU" |
| `02.png` | Onboarding card | Play paid | Tagline "THREES IS A TINY GAME..." |
| `03.png` | Tutorial: matching numbers | Play paid | 3+3=6, 6+6=12 explainer |
| `04.png` | Tutorial: 1+2=3 | Play paid | "LEARN IT IN A MINUTE" |
| `05.png` | Board + tagline composite | Play paid (slot 4) | "PLAY IT FOR A LIFETIME"; distinct crop from 01 |
| `06.png` | Home / mid-game board (iOS) | App Store | Same board as 01 but iOS chrome ("challenge" icon) |

## Deleted / not kept

- Play freeplay listing screenshots (slots 0-2, byte-identical rendering to
  `01.png`-`03.png`): not kept as separate files — duplicate content, logged
  here instead of stored twice.
- App Store screenshots 2-5 (from the iTunes lookup): duplicate compositions
  of `02.png`-`05.png` with only the iOS "challenge" chrome differing (already
  captured once in `06.png`); not kept to avoid redundant near-duplicates.
- No promo banners with zero gameplay were present in either store's
  screenshot carousel (Threes!'s marketing images are all in-app captures).

## Why this matters for Merge Relay

Every kept image shows the target look: warm off-white/cream board, rounded
"physical card" tiles with soft drop shadows, a friendly rounded numeral
font, and character faces/expressions on higher-value tiles (see `96`, `192`
tiles in `01.png`/`06.png`). See
`../merge-relay-visual-reference/README.md` for the concrete do/don't list
built from these anchors.
