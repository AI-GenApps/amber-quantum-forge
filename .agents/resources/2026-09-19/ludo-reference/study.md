# Ludo King Android reference study

Captured on 2026-09-19 from the foreground app on Samsung SM-A525F (RZ8R32EAB7T). The archive contains 61 indexed PNG captures, each a 1080×2400 native device screenshot. The numbered sequence in `manifest.json` records each action and the visual state actually observed; several early filenames were chosen before the state was understood and are intentionally retained.

## Flow and interaction evidence

The first run opens with a dimmed Home lobby and a prominent Welcome card. Play enters a board objective tutorial with a diagram, a large Next button, and a top Skip Tutorial button. Skipping then exposes a profile gender choice with a separate Skip option. The skip path produces a King Pass subscription offer, then a 100K coins offer, then a Nature Theme offer before exposing the Home lobby. No purchase, profile choice, account operation, invite, or chat action was made.

The Home lobby presents a clear local Computer entry alongside Online, Team Up, Friends, and Pass N Play. Computer opens a Select Game card with Classic selected and Rush Mode available, then a setup card with a theme carousel, token styles, color swatches, 2 or 4 players, and Play. Entering Classic/2-player produces an ad-marked Keep one token out! instructional prompt. Its OKAY path opens a full-screen playable ad before returning to Ludo; this is captured as an interruption, with no ad CTA used.

The Computer board uses four large colored quadrants, a high-contrast central track, named You and Computer panels, a bottom die control, a lower-left menu, and an Undo badge above the die. Non-six rolls leave all tokens in their yards. A Computer six visibly places one green token on its lane. After a later You six, tapping the top-left blue token produces entry onto the blue lane. Native coordinates were verified against the 1080×2400 PNG: die center approximately `(540,2295)` and top-left blue token approximately `(178,1325)`.

The in-game menu contains Exit. Exit opens a Quit Game confirmation with YES/NO plus sound, vibration, and music controls. The confirmation is repeatedly shown with ads. In the captured attempts, tapping YES dismissed the dialog and the Computer board remained visible; later Android Back captures alternated between dimmed board transition frames and the quit confirmation. The cause of that observed sequence is undetermined. Home settings and the Help/tutorial replay have not yet been reached.

The follow-up navigation used an explicit `ludo-reference` agent-device session bound to `com.ludo.king`. The first capture through the old `ludo-basic` session reported `app.w3dev.ludo.debug`, although its pixels still showed a Ludo King quit card with a Block Blast ad; this is retained as a binding diagnostic in screenshot 52. The explicit session then showed a dim Tasty Travels playable-ad webview in screenshots 53-55, followed by the Quit Game card under a Bus Fever Party ad in screenshot 56. A later YES attempt exposed Samsung Game Booster Touch Lock over the app. Screenshots 57-61 document the lock overlay, its time/battery and brightness indicators, unsuccessful coordinate drag attempts, and the later wake-and-drag frame with a Facebook ad. The user manually dismissed Touch Lock, after which screenshot 62 restored the board and native input worked again.

After unlock, the board menu and quit confirmation were captured again (63-65). Relaunching the app without clearing data exposed a sequence of monetization gates: a large coin/diamond Special Offer, a Water Sort playable ad, an Exclusive Diamond Offer, and then the Home lobby (66-70). The Home lobby's Deals & Offers shelf (71) and Settings surface (73) are now captured. Settings uses a dense blue-and-gold panel with grouped controls for audio, vibration, tutorial replay, language, privacy, themes, store, support, rules, and social links.

The Tutorial Play control opens a catalog modal rather than an inline step-by-step lesson. The catalog has blue rows with yellow borders and red video icons; the captured top and lower scroll states cover Quick Ludo, Mask Ludo, Voice Chat, Facebook friends, Buddies, Create Room, Join Room, Block Chat & Emojis, and Team Up help (74, 78-80). Selecting the Settings tutorial control hands off to YouTube, where the Ludo King Quick Mode Tutorial is shown with an accessibility prompt and a frame explaining that watching a video can grant diamonds (81-83). Returning through Android recents restored the catalog (84-85). Pressing Android Back then exposed the Home lobby under a `No Ads for 30 minutes` rewarded-ad offer with Remove Ads and Free choices (87-89). Two close attempts left the offer visible, so it is an observed persistent blocking state in this session.

## Visual principles for the basic mobile plan

- Keep the board as the dominant surface and reserve a stable bottom action zone for the die, turn labels, and undo affordance.
- Make the active player explicit through color, label, die tint, and token animation; the reference uses blue for You and green for Computer.
- Use a short objective tutorial with a board diagram before the first turn, then reinforce special rules at the point of use with a dismissible card.
- Make the legal token affordance clear after a six; the captured frames prove the resulting blue token entry but do not establish a pulse or ring treatment.
- Keep menu and quit controls reachable without covering the board, and expose audio, vibration, and music choices together in the quit confirmation.
- Avoid allowing ad or commerce overlays to obscure the first playable turn. The reference stacks subscription, coins, theme, banner, and playable-ad interruptions before and during local play.

## Open evidence gaps

The reference study still needs the complete in-game Help/tutorial Next sequence and its action highlights, a multi-space movement after a token has entered, capture or blockade feedback, the Rules screen, and a confirmed successful exit from the Computer board. Individual help videos beyond the observed external YouTube handoff were not opened. The capture archive now contains 89 sequentially indexed PNGs; screenshot 84 is retained as a system recents transition because it was part of the return path, while the app state is restored in screenshot 85.
