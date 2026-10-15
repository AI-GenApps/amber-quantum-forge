# Task 26g device flow: store, coin purchase, equip

Run by a device agent on a 1080x2400 Android phone (about 392x873 dp,
density 2.75) with the debug app `app.w3dev.ludo.debug`. Save every screenshot
into this folder (`.agents/resources/2026-09-25/ludo-vortex-economy/device-evidence/26g/`)
with the file name given in the step. Find controls by accessibility
label (content description) via `uiautomator dump`, not by fixed pixels. Pixel
hints below are only approximate.

## Hard rules

- NEVER complete a real-money purchase. This flow only presses real-money
  buy buttons inside the debug "online preview" mode, whose fake RevenueCat
  gateway always answers "cancelled". If a real Google Play purchase sheet
  ever appears (title like "Complete purchase", a payment method), press Back
  to cancel, do not confirm, and write `REAL PURCHASE SHEET SEEN` in your report.
- No rewarded ads exist in this task (they arrive in task 26h). If any ad
  appears, screenshot it and report it as unexpected. Debug builds may only
  ever show Google test ads.
- Do not tap Quit/Reset/Delete-data controls.

## Launch state

1. Debug build installed (debug `applicationId` `app.w3dev.ludo.debug`), built
   WITHOUT `--dart-define=REVENUECAT_API_KEY` and without a configured
   API base URL (default debug build). Force-stop the app and launch it fresh
   (`adb shell am force-stop app.w3dev.ludo.debug`, then launch the main activity).
2. Every process start resets the preview wallet and preview inventory, so
   run Part A (no preview) first, then Part B after arming preview mode.
3. If onboarding screens appear (welcome, name and avatar, tutorial), finish
   them with the defaults (Continue/Next/Skip) until the home lobby
   ("Ludo Vortex" logo, four mode tiles: Computer, Pass N Play, Play with
   Friends, Online) shows.

## Part A: store without a backend (fallback state)

A1. On the home lobby, screenshot `A1-lobby-with-store-button.png`. Expected:
    a profile header panel with the player name and a gold square button with a
    storefront icon on its right (content description `Store`). Online tiles show
    "Coming soon".
A2. Tap `Store`. Expected: a screen titled `Store` with a panel titled
    `Store unavailable` and text "The store needs an online connection, which
    is not available in this build." No crash. Screenshot
    `A2-store-offline-unavailable.png`.
A3. Press Back. Expected: back on the lobby.

## Part B: preview mode, coin purchase then equip

B1. On the lobby, long-press (hold about 1.5 s) the wide "Ludo Vortex" logo at
    the top (content description `Debug: arm online preview mode`). Expected:
    snackbar "Online preview mode armed"; after about 1 s the header shows
    a coin chip `2400`, a diamond chip `60` and a level badge `1`. Screenshot
    `B1-lobby-preview-armed.png`.
B2. Tap `Store`. Expected: `Store` screen, HUD chips `2400` and `60`, and five tabs:
    `Dice`, `Tokens`, `Boards`, `Currency Packs`, `Pass` (all five visible),
    `Dice` selected. Dice tab shows cards `Default` (state `Owned`, green
    `Equipped` badge), `Classic Wood`, `Neon Vortex`, `Marble`, `Galaxy`, `Gold`
    (each `Not owned`, two buttons: gold coin button `1,500`, blue diamond
    button `30`). Scroll down to see all six. Screenshot
    `B2-store-dice-tab.png` (top) and `B2b-store-dice-tab-scrolled.png`.
B3. Tap the Gold die art (content description `Preview Gold`). Expected: a
    bottom sheet titled `Gold` with a gold die that tumbles for under a second
    and settles on 6, a `Roll` button, and the two buy buttons. Screenshot
    `B3-preview-gold.png` right after opening, tap `Roll` once, screenshot
    `B3b-preview-gold-rolled.png`. Press Back to close the sheet.
B4. Tap `Buy Gold for 1,500 coins`. Expected: dialog `Confirm purchase` with
    "Buy Gold for 1,500 coins?" and buttons `Cancel`, `Confirm purchase`.
    Screenshot `B4-confirm-dialog.png`.
B5. Tap `Confirm purchase`. Expected: green banner "Purchased Gold! Tap Equip
    to use it.", HUD coin chip drops to `900` (diamonds stay `60`), and the Gold
    card now shows `Owned` with a green `Equip` button (content description
    `Equip Gold`) instead of price buttons. Screenshot
    `B5-gold-purchased.png`.
B6. Tap `Equip Gold`. Expected: banner "Gold equipped."; Gold card shows the
    green `Equipped` badge; the `Default` card now shows an `Equip` button.
    Screenshot `B6-gold-equipped.png`.
B7. Insufficient balance: tap `Buy Marble for 1,500 coins`, then
    `Confirm purchase`. Expected: red banner "Not enough coins for Marble.", coin chip
    still `900`, Marble still `Not owned`. Screenshot
    `B7-insufficient-coins.png`.
B8. Tokens tab: tap `Tokens`. Expected: `Default` (Equipped) and `Gem Tokens`,
    `Robot Tokens`, `Animal Tokens` (`2,500` coins / `50` diamonds each) with
    token art on a mini board. Screenshot `B8-store-tokens-tab.png`. Tap
    `Preview Gem Tokens`: sheet shows four gem tokens on the board; screenshot
    `B8b-preview-gem-tokens.png`; press Back.
B9. Diamond purchase: tap `Buy Animal Tokens for 50 diamonds`, `Confirm
    purchase`. Expected: banner "Purchased Animal Tokens! Tap Equip to use it.",
    diamond chip `10`, coin chip `900`. Screenshot `B9-diamond-purchase.png`.
B10. Boards tab: tap `Boards`. Expected: `Default` (Equipped), `Cosmic Board`,
    `Royal Board` each with only a blue diamond button `80`. Tap `Buy Cosmic
    Board for 80 diamonds`, `Confirm purchase`. Expected: banner "Not enough
    diamonds for Cosmic Board." (only 10 left), no change. Screenshot
    `B10-boards-insufficient-diamonds.png`. Also screenshot
    `B10b-store-boards-tab.png`. Tap `Preview Cosmic Board` to see the
    starfield board swap, screenshot `B10c-preview-cosmic-board.png`, Back.
B11. Currency Packs tab (preview gateway, fake prices): tap `Currency Packs`.
    Expected: offers `Starter Pack` (+3,000 coins, +30 diamonds, price
    `Rs 49.00`), `Coins - Small`, `Coins - Medium`, `Diamonds - Small`, `Diamonds
    - Medium`, and a `Restore purchases` button. Screenshot
    `B11-currency-packs-tab.png`. Tap the `Rs 99.00` button of Coins - Small:
    banner "Purchase cancelled. Nothing was charged.", wallet unchanged
    (900 / 10). Screenshot `B11b-pack-cancelled.png`. Scroll to and tap
    `Restore purchases`: banner "Restore complete. Your balance is up to date."
    Screenshot `B11c-restore.png`.
B12. Pass tab: tap `Pass`. Expected: card `Vortex Pass (monthly)` with perks
    "+50% daily reward coins", "1 free theme every month", "Exclusive Vortex
    dice theme", price `Rs 199.00`. Screenshot `B12-pass-tab.png`. Tap the
    price: banner "Purchase cancelled. Nothing was charged."
B13. Equip survives leaving the store: Back to the lobby (header chips show
    `900` and `10`), tap `Store` again, `Dice` tab. Expected: Gold still shows
    `Equipped` and Default shows `Equip` (a brand new store state read the
    saved choice). Screenshot `B13-equip-persisted-reopen.png`.

## Part C: real-money fallback on a build without RevenueCat keys

The default debug build has no RevenueCat key. To see the real fallback
(not the preview fake), this part needs an online client without preview, which
only exists when Firebase and an API URL are configured. If the device build is
config-less, mark Part C `NOT POSSIBLE (no backend configured)`; Part A
already shows the whole-store fallback. Do NOT supply a real RevenueCat key.

## Report

List each step as PASS/FAIL with the observed text, attach the screenshot
file names, and note anything that differs from "Expected" verbatim. Also
capture `adb logcat -d | grep -i flutter` into `logcat.txt` in this folder.
