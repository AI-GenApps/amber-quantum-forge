# Task 26h device flow: daily reward calendar and rewarded test ads

Run by a device agent on a 1080x2400 Android phone (about 392x873 dp,
density 2.75) with the debug app `app.w3dev.ludo.debug`. Save every screenshot
into this folder (`.agents/resources/2026-09-25/ludo-vortex-economy/device-evidence/26h/`)
with the file name given in the step. Find controls by accessibility label
(content description) via `uiautomator dump`, not by fixed pixels. Pixel hints
below are only approximate (dp x 2.75).

## Hard rules

- NEVER complete a real-money purchase. This flow does not open any buy
  button. If a Google Play purchase sheet ever appears (title like "Complete
  purchase", a payment method), press Back to cancel, do not confirm, and write
  `REAL PURCHASE SHEET SEEN` in your report.
- Only Google TEST ads may ever appear (debug builds request Google's sample
  rewarded ad unit and nothing else). A test ad is a sample video/creative that
  carries a "Test Ad" or "Test mode" marker. If an ad does NOT look like a test
  ad (no marker, a real advertiser brand) screenshot it as `X-unexpected-live-ad.png`,
  press Back/close, report `LIVE AD SEEN` and stop the ad steps.
- Never tap INSIDE an ad's creative or on its call-to-action (that opens a
  browser or the Play Store). Only use the ad's own close button (an "X", top
  corner) after the countdown. If a browser/Play Store opens by accident, press
  Back until the game is visible again and note it.
- Do not tap Quit/Reset/Delete-data controls.
- The phone needs internet for the ad steps. If no ad ever loads
  ("No ad is available right now. Try again soon."), mark the ad steps
  `BLOCKED (no network or no fill)`, not FAIL, and still finish Part B.

## What is and is not covered

- The debug "online preview" mode (armed below) replaces the backend with an
  in-app fake. The calendar, the claim, the allowance counters and the wallet
  all run through the real client code, but the server-side-verification (SSV)
  callback that credits an ad on the real server is NOT exercised on the
  device; the preview fake credits the ad after you really watched a Google
  test ad. Say so in the report.
- Vortex Pass bonus rendering is covered by widget tests and goldens, not here
  (no pass can be bought on the device, and none must be).

## Launch state

1. Debug build installed (applicationId `app.w3dev.ludo.debug`), built WITHOUT
   `--dart-define=REVENUECAT_API_KEY`, without an API base URL and without any
   `LUDO_ADMOB_*` define (the default debug build). Force-stop the app
   (`adb shell am force-stop app.w3dev.ludo.debug`) and launch it fresh.
2. Every process start resets the preview wallet, the preview calendar and the
   preview ad counters. Do Part A first, then arm the preview for Part B.
   Do NOT force-stop the app between Part B steps (that resets the state).
3. If onboarding screens appear (welcome, name and avatar, tutorial), finish
   them with the defaults (Continue / Next / Skip) until the home lobby
   ("Ludo Vortex" logo and four mode tiles: Computer, Pass N Play, Play with
   Friends, Online) shows.

## Part A: no backend, no rewards button

A1. On the home lobby screenshot `A1-lobby-no-rewards.png`. Expected: the
    profile header shows only the gold `Store` button (storefront icon) on its
    right; there is NO gift icon / `Daily rewards` button, and no coin or
    diamond chips. No crash.

## Part B: preview mode, daily reward claim

B1. Long-press (hold about 1.5 s) the wide "Ludo Vortex" logo at the top
    (content description `Debug: arm online preview mode`). Expected: snackbar
    "Online preview mode armed"; after about 1 s the header shows a coin chip
    `2400`, a diamond chip `60`, a level badge `1`, AND a gold gift button
    (content description `Daily rewards, reward ready to claim`) left of the
    `Store` button with a small red dot on its top-right corner. Screenshot
    `B1-lobby-reward-badge.png`.
B2. Tap `Daily rewards, reward ready to claim`. Expected: a screen titled
    `Daily Rewards` with the HUD chips `2400` / `60` top right, a panel
    `Daily reward` that says `Day 3 is ready to claim.`, seven day tiles
    (`Day 1` and `Day 2` dimmed with a green check = claimed, the tile
    `Today` highlighted in gold = day 3 with `300`, then `Day 4` `350`,
    `Day 5` `400`, `Day 6` `500`, `Day 7` `750` plus `5` diamonds and the text
    `Day 7 bonus`), the line `Vortex Pass members get +50% on every daily
    reward.`, a big gold button `Claim day 3 reward`, and below it a panel
    `Free rewards` with two rows `+100 coins` / `5 of 5 left today` and
    `+5 diamonds` / `2 of 2 left today`, each with a gold `Watch` button.
    Screenshot `B2-rewards-screen-day3-ready.png` (top) and, after scrolling
    down if the Free rewards panel is cut off, `B2b-rewards-screen-free-rewards.png`.
B3. Tap `Claim daily reward` (the `Claim day 3 reward` button). Expected: a
    green banner `Day 3 reward claimed: +300 coins.`, the coin chip changes
    from `2400` to `2700` (diamonds stay `60`), the panel text becomes
    `Claimed for today. Come back tomorrow for day 4.`, the Day 3 tile is
    dimmed with a green check, and the button now reads `Claimed today` and is
    dark/disabled. Screenshot `B3-day3-claimed.png`.
B4. Tap the disabled `Claimed today` button once. Expected: nothing happens
    (no banner change, coin chip stays `2700`). Note it in the report.

## Part C: preview mode, rewarded test ads (stay on the Daily Rewards screen)

C1. Tap `Watch ad for 100 coins`. Expected: the Watch button shows a small
    spinner, then (within a few seconds) a FULL-SCREEN Google test ad opens.
    If a Google privacy / consent form appears first (only in some regions;
    titles like "Privacy and cookie settings" or "Manage your choices"), screenshot
    `C1a-consent-form.png` and choose the option that agrees / allows ads
    (button text such as "Consent" or "Agree"), then the ad continues. Once the
    ad is on screen screenshot `C1b-test-ad-playing.png` (it must show a test
    marker). Do not tap inside the ad.
C2. Wait for the ad's countdown to finish (typically 5 to 30 s; a "Reward in N"
    style counter or a progress bar, then an "X" close button appears). Tap the
    close "X". Expected: back on `Daily Rewards`; within a few seconds a green
    banner `Reward received! Your coins balance is updated.`; the coin chip
    goes from `2700` to `2800`; the coin row now says `4 of 5 left today`.
    Screenshot `C2-coin-ad-credited.png`.
C3. Tap `Watch ad for 5 diamonds` and watch a second test ad to the end exactly
    as in C1/C2. Expected: banner `Reward received! Your diamonds balance is
    updated.`, diamond chip `60` -> `65`, diamond row `1 of 2 left today`.
    Screenshot
    `C3-diamond-ad-credited.png`.
C4. Early close (optional, skip if C1 showed no ad): tap `Watch ad for 5
    diamonds` again, and close the ad with its "X" BEFORE the reward countdown
    ends (some test ads show the X immediately; if there is no way to close
    early, skip this step and say so). Expected: banner `Watch the whole ad to
    earn the reward.` (red), diamond chip unchanged (`65`), row still `1 of 2
    left today`. Screenshot `C4-early-close-no-reward.png`.
C5. Watch one more diamond test ad to the end. Expected: diamond chip `70`;
    the diamond row now reads `Daily limit reached. Come back tomorrow.` and
    its `Watch` button is dark/disabled; the coin row is still enabled
    (`4 of 5 left today`). Screenshot `C5-diamond-limit-reached.png`.
C6. Tap the disabled diamond `Watch` button. Expected: nothing happens, no ad
    opens. Note it in the report.

## Part D: surfaces and persistence

D1. Press Back to return to the lobby. Expected: the red dot on the gift
    button is GONE (today's reward is claimed); the chips read the latest
    balances (`2800` coins, `70` diamonds). Screenshot `D1-lobby-after-claim.png`.
D2. Tap `Store`. Expected: the `Store` screen with a gold `Free coins` button
    (content description `Free coins and daily rewards`) above the tab row.
    Screenshot `D2-store-free-coins-button.png`. Tap it. Expected: the same
    `Daily Rewards` screen with `Claimed today` and the diamond limit still
    shown. Screenshot `D2b-rewards-from-store.png`. Press Back twice to the lobby.
D3. Capture `adb logcat -d | grep -i -E "flutter|ads|admob"` into `logcat.txt`
    in this folder. In the report note whether the log shows any ad unit id and
    that it is Google's sample publisher `ca-app-pub-3940256099942544` (expected)
    and never another publisher id.

## Report

List every step as PASS / FAIL / BLOCKED with the observed text, attach the
screenshot file names, and note anything that differs from "Expected"
verbatim. State explicitly: (1) whether a consent form appeared, (2) whether
the ad was a Google test ad, (3) that the SSV callback was not exercised
(preview fake credit), (4) that no real purchase was attempted.
