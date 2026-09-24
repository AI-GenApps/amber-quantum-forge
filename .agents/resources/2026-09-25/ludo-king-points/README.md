# Ludo King points/score research (desk pass, 2026-09-25)

Source: ../../2026-09-19/ludo-reference/ (study.md, manifest.json, 89 PNGs). No phone use in this pass.

## Confirmed from evidence
- Classic vs Computer (2-player) board shows NO numeric score anywhere: only "You"/"Computer" name labels on yards, bottom bar "You | die | Com" with token icons, menu button, Undo badge. (44-blue-token-on-track.png, 32/41/42, study.md)
- Game-select card offers Classic and Rush Mode (03-mode-after-skip.png, 08-computer-mode.png, study.md). Rush was never played.
- Settings > Tutorial Play catalog includes "Quick Ludo help" and "Mask Ludo help" videos (80-quick-ludo-help-open.png, 75, 79); the Quick tutorial is a YouTube handoff (81-83) and was not watched, so scoring rules are NOT captured.
- Currencies exist: coins and diamonds (offers 05, 06, 68, 70); watching a video can grant diamonds (83). Amounts earned per match not observed.

## Not captured (gaps)
- Any end-of-match/results screen, winner ranking, XP/levels, win streaks, leaderboards, Quick/Rush gameplay, tie-breaks.
- No .agents notes mention scoring (grep of study.md, manifest.json, plan.md).

## Needs phone or external sources
Play Quick mode and a full Classic game to the results screen; watch Quick help video.


## Phone pass (2026-09-25, Samsung A52, com.ludo.king, Haiku subagent, ~105 tool calls)
Result: scoring rules were NOT found. Persistent offers/ads blocked reaching a Quick match, so no in-game score HUD, results screen, or rules text was captured.

### Confirmed (screens)
- Select Game list under Home>Computer in this run: CLASSIC, 1 KILL WIN, QUICK, POPULAR, MASK with "Players: N" counts (07-computer-mode-selection.png). NOTE: the 2026-09-19 run showed only Classic + Rush Mode for Computer (2026-09-19/.../08-computer-mode.png). The two differ (app version/state or menu differs); the subagent's claim "Rush Mode does not exist" is therefore wrong/unproven — it exists in the 09-19 capture. The 5-mode list with player counts may be the Online/other entry; unresolved.
- Wallet: 2,250 coins and 150 diamonds shown (07). Free-coin offers 1000 coins x5 ads (01, 04, 05). King Pass offers (27).
- Home has SEASON 27 CLAIM, TOURNAMENT, EVENT, INVENTORY, SOCIAL, level crown "K" (07/13 backgrounds).
### Inferred / not verified
- Quick / 1 Kill Win / Mask having their own rules; Quick scoring (points per step/capture/home) unknown.
- Selecting QUICK never visibly took effect in the UI (08, 14, 15), game never launched (16-18).
- Some subagent observations (e.g. "help icon opens theme screen") are single-frame and unverified.

## Web research (2026-09-25)

Scope: web-only pass (WebSearch/WebFetch), no phone/app access, following the phone pass above which found no in-app scoring evidence. Sources checked: ludoking.com (faq, features), blog.gametion.com (official Gametion dev blog), YouTube (Quick Mode tutorial — description/transcript were not retrievable via WebFetch, page returned only nav chrome), Play Store listing (description text was truncated/unavailable via WebFetch), and several third-party blogs/Q&A sites. No official Gametion source was found that publishes a numeric points formula for any mode; most numeric "points per step" claims below trace to generic/third-party Ludo scoring explainers whose relationship to Ludo King specifically is unconfirmed (they read as generic-Ludo or other-app content, e.g. Zupee).

| Rule | Value found | Confidence | Source(s) |
|---|---|---|---|
| Quick Mode: starting tokens | Two of the player's four tokens start already out of the yard, ready to move; remaining two can be brought out normally | CONFIRMED | Official Gametion blog, "Ludo King rolls out Quick Mode and 6 Player Online Multiplayer updates" (2021-01-28), https://blog.gametion.com/2021/01/ludo-king-rolls-out-quick-mode-and-6-player-online-multiplayer-updates/ |
| Quick Mode: win condition | Objective-based, not a points race: the first player to get ONE token home wins, but only on the condition that the player has also killed (captured) at least one opponent token during the match | CONFIRMED | Same Gametion blog post above; corroborated by https://games.lol/blog/ludo-king-quick-ludo-5-to-6-player-modes/ and https://www.theindianwire.com/gaming/ludo-king-introduces-quick-ludo-and-up-to-six-multiplayer-modes-check-details-302728/ |
| Quick Mode: match length | "About 5 to maximum 10 minutes" (vs. 15–40 min for Classic) | CONFIRMED | Official Gametion blog post above; corroborated by https://games.lol/blog/ludo-king-quick-ludo-5-to-6-player-modes/ |
| Quick Mode: undo-with-diamonds mechanic | Once dice is rolled, a player can spend diamonds to undo the move and re-roll, to try again for a kill | CONFIRMED (official) | Official Gametion blog post above |
| Quick Mode: numeric point score (e.g. "race to 100 points") | One third-party AI-summarized source claimed Quick Mode's "objective is to be the first to get a score of 100." This directly conflicts with the official Gametion description (objective-based win, no score shown) and could not be traced to any primary source or screenshot. | UNKNOWN / likely incorrect — flagged as unreliable, not adopted | https://www.techtodaypost.com/how-the-ludo-scoring-system-works-and-how-to-win/ (unverifiable, conflicts with official source) |
| Points per square/step moved | "1 point per box/block moved" appears in two independent third-party explainers, but both appear to describe generic Ludo scoring / other Ludo apps (one focuses on Zupee's Ludo variants) rather than being confirmed as Ludo King's own system. No official Ludo King source publishes this. | REPORTED (unconfirmed for Ludo King specifically) | https://kingstondiaries.com/ludo-scoring-system-rules-points-winning-tips/ ; https://www.techtodaypost.com/how-the-ludo-scoring-system-works-and-how-to-win/ |
| Points for capturing (killing) an opponent token | Described only qualitatively as "extra points + extra turn" for a capture, with no specific numeric value found anywhere for Ludo King | REPORTED (vague, no number) | https://kingstondiaries.com/ludo-scoring-system-rules-points-winning-tips/ |
| Points for a token reaching home | "+56 points" for a 2/4-player game, "+43 points" for a 3-player game, per one third-party source; a second source vaguely says "sometimes up to 56+" | REPORTED (single-ish source, not Ludo King-official, numbers not cross-confirmed elsewhere) | https://kingstondiaries.com/ludo-scoring-system-rules-points-winning-tips/ ; https://www.techtodaypost.com/how-the-ludo-scoring-system-works-and-how-to-win/ |
| Points lost by the captured player | No source (official or third-party) states a point penalty for being captured; not found | UNKNOWN | — |
| Whether tokens start out-of-yard in Quick mode | Yes — two tokens start pre-released outside the yard (see row above) | CONFIRMED | Official Gametion blog post above |
| 1 KILL WIN mode | Not documented by any official Gametion/ludoking.com source found. Third-party/AI-summarized description: "kill one opponent token before entering home; when you kill the enemy token and finally move one token to home, you win" — i.e., described identically to Quick Mode's kill+home win condition, suggesting it may be the same rule under a separate menu label (the app's mode-select screen showed QUICK and "1 KILL WIN" as distinct entries with separate player counts, per the phone-pass screenshot 07 above) | REPORTED (single/unverifiable summarized source; relationship to Quick Mode unresolved) | AI-summarized web search result, no directly citable page found |
| MASK mode: token movement | Tokens move from yard toward home as normal, but "wearing a mask" | CONFIRMED | Official Gametion blog, "Ludo King brings Mask Mode..." (2020-10), https://blog.gametion.com/2020/10/ludo-king-brings-mask-mode-to-educate-masses-on-health-safety-while-entertaining-them/ |
| MASK mode: infection mechanic | If a token lands on a board position where a "virus" is present and the token has no mask, it becomes infected and is sent to quarantine at the side of the board for 14 turns, then returns to the main square recovered and can come out again on the next six | CONFIRMED | Same official Gametion blog post above |
| MASK mode: online-only restriction | One third-party source states Mask Mode can only be played in online multiplayer (requires internet) | REPORTED (not stated in the official blog post itself) | https://www.republicworld.com/tech/gaming/how-to-play-ludo-king (via search summary) |
| MASK mode: win condition / scoring | Not specified in any source found — no numeric scoring or special win rule beyond standard "get tokens home" was documented | UNKNOWN | — |
| Rush mode: existence and nature | Exists as a Ludo King mode (seen in 2026-09-19 phone-pass screenshot `08-computer-mode.png`, alongside Classic); described by one source as "a faster version of the game... with fewer tokens" | REPORTED (thin sourcing; specifics not corroborated) | https://www.ludogames.org/rush-ludo/ (note: this may describe a similarly-named but different real-money "Rush Ludo" product, not confirmed to be Gametion's Ludo King Rush mode) |
| Rush mode: timer length / turn limit | No Ludo King–specific timer value found. A generic timed-Ludo description (source unclear on which app) states "match ends when all 4 pawns of any player reach home, or the timer expires, or 50 turns are over, whichever is earlier" — not confirmed as Ludo King's Rush mode rule | UNKNOWN | Unattributed generic description surfaced in search summary; not confirmed to be Ludo King |
| Classic mode: win condition | Standard: first player to get all 4 tokens to the center/home wins | CONFIRMED | Widely and consistently corroborated across multiple sources, e.g. https://www.ludoghar.co/pages/rules, general Ludo King rules descriptions |
| Classic mode: 3rd/4th place ranking | Play can optionally continue after the 1st-place winner finishes, to determine 2nd/3rd/4th place by the order remaining players finish all 4 tokens | REPORTED (described as an "optional" rule in generic Ludo rules content; not confirmed as Ludo King's automatic/default UI behavior, and no source confirms whether the Ludo King app itself surfaces a 2nd/3rd/4th place ranking screen) | Summarized generic-Ludo rules content from search; no single directly citable Ludo King page found |
| Classic mode: tie-break rules | Not found anywhere — no source describes a tie-break scenario for Classic mode | UNKNOWN | — |
| Post-match coin rewards (Classic/free play vs. Computer) | Not found — no source states a coin payout for a standard Classic match against the Computer or in free local play | UNKNOWN | — |
| Post-match coin rewards (paid coin-entry rooms/tournaments) | In coin-stake matches, the winner (or, in 3/4-player games, also runner-up in some formats) receives back a payout proportional to the entry stake; one worked example: entering a 2-player match with 500 coins and winning returns 950 coins (~52% return over stake, i.e. app takes a rake) | REPORTED (single-ish source, numeric example not cross-confirmed) | Search-summarized content citing coin-earning guide articles (e.g. gamingonphone.com "tips and tricks to earn coins", candid.technology "how to get coins in Ludo King") — exact article not individually re-verified |
| Tournament entry/reward structure | Solo and Multiplayer tournaments each have per-contest entry fees (paid in coins) and a fixed/tiered winning reward or prize-pool split, largest share to 1st place | REPORTED (general description, no Ludo King-specific numeric table found) | Search-summarized tournament/coin content; no single official Ludo King page with exact figures found |
| XP / player level system | One source states "the first level is earning 180 XP," implying levels are earned via experience points separate from coins; no further leveling curve, level benefits, or per-match XP award values were found | REPORTED (single unverifiable source, likely low reliability) | Search-summarized content, exact source page not individually re-verifiable |
| Diamonds as a reward currency | Diamonds are a separate premium currency from coins; can be earned by watching ads/videos; usable in Quick mode to pay for the undo/re-roll mechanic | CONFIRMED (undo mechanic per official blog) / REPORTED (ad-earning, consistent with phone-pass screenshot 83 showing a diamond video-reward offer) | Official Gametion blog post above (undo mechanic); phone-pass screenshots 07/83 (this README, 2026-09-25 phone pass) |

### Key takeaways
- The only officially documented, Ludo-King-specific mode mechanics found are **Quick Mode** (kill-one-opponent + first-token-home wins, ~5–10 min, two tokens start out of yard, diamond-funded undo) and **Mask Mode** (mask/virus/14-turn quarantine mechanic), both from Gametion's own blog.
- No official source — and no reliable third-party source — publishes a numeric "points per step / points per capture / points per home run" scoring formula specifically for Ludo King. The specific numbers found (1 point/step, +56/+43 for home, "extra points" for a kill) all trace to generic Ludo-scoring or other-product content and should be treated as unverified for Ludo King until confirmed in-app.
- "1 Kill Win" was not found as an officially documented, separately-named mode; available (unverifiable) descriptions make it sound identical to Quick Mode's win condition, so it may simply be Quick Mode's in-app label in the current build, or a genuinely distinct mode whose rules differ in a way not captured by any source found. This remains unresolved.
- Rush mode, Classic 3rd/4th-place ranking, tie-breaks, and most coin/XP reward figures remain UNKNOWN or only thinly REPORTED — none of these were confirmed by an official Gametion/ludoking.com source in this pass. A future phone pass reaching an actual Quick match, results screen, or in-app help/tutorial video transcript is still the most reliable way to close these gaps.

### Files (from manifest.json)
- `00-app-open.png` — Ludo King splash screen with game title and pieces (path/action: opened app)
- `01-home-screen.png` — Free Bonus dialog (1000 coins) appeared on home screen (path/action: waited for loading)
- `02-home-no-dialog.png` — Dialog still visible; bonus reward shown (path/action: attempted close dialog)
- `03-home-cleared.png` — Calendar notification appeared (sleep event) (path/action: pressed back)
- `04-home-main.png` — Free Coins ad dialog appeared (1000 coins, x5 ad views) (path/action: pressed back)
- `05-home-ready.png` — Free Coins offer still showing with ad banner (path/action: attempted close dialog)
- `06-home-clean.png` — Clean home screen showing all game modes: ONLINE, TEAM UP, FRIENDS, COMPUTER, PASS N PLAY, TOURNAMENT (path/action: pressed back)
- `07-computer-mode-selection.png` — Game mode selection screen: CLASSIC (30088 players), 1 KILL WIN (69863), QUICK (70598), POPULAR (21061), MASK (281) (path/action: tapped COMPUTER button)
- `08-quick-mode-selected.png` — Ad banner appeared; QUICK mode not visually marked as selected (path/action: tapped QUICK mode)
- `09-more-modes-scroll.png` — Paytm ad appeared; same mode list visible (path/action: scrolled down)
- `10-help-info.png` — Theme selection screen opened instead of help/rules (DEFAULT, NATURE, EGYPT, DISCO, MARBLE, CANDY, CHRISTMAS, PENGUIN, BATTLE, DIWALI, PIRATE, ALIEN themes available) (path/action: tapped help icon (question mark))
- `11-back-to-modes.png` — Returned to home screen (path/action: pressed back)
- `12-settings-menu.png` — No menu appeared; same screen shown (path/action: tapped settings/gear icon)
- `13-computer-modes-again.png` — Mode selection screen re-opened (path/action: tapped COMPUTER again)
- `14-quick-mode-selected-check.png` — Ad banner (Paytm) appeared; CLASSIC still showed checkmark (path/action: tapped QUICK mode)
- `15-quick-selected-verify.png` — Ad banner (Blinkit Grocery) appeared; selection still not changing in UI (path/action: tapped QUICK again)
- `16-after-next-button.png` — Ad banner appeared; mode selection still visible (path/action: tapped Next button)
- `17-game-starting.png` — Binance ad banner appeared; still on mode selection screen (path/action: waited for screen load)
- `18-after-wait.png` — No screen change; QUICK mode now selected (checkmark visible) (path/action: waited 1.5 seconds)
- `19-home-again.png` — Returned to home screen; Free Diamonds offer dialog appeared (path/action: pressed back)
- `20-home-clean-final.png` — Dialog still visible showing 15 diamonds offer for ₹90 (path/action: attempted close Free Diamonds dialog)
- `21-home-final-clean.png` — Clean home screen finally achieved; all game mode options visible (path/action: pressed back)
- `22-help-menu.png` — Opened ludoking.com browser page (marketing/download page) (path/action: tapped question mark icon)
- `23-back-to-app.png` — Still on ludoking.com page showing '#1 GAME' marketing (path/action: pressed back from browser)
- `24-app-reopened.png` — Fresh app launch with splash screen and Social Media Marketing ad (path/action: closed session and reopened with --relaunch)
- `25-after-splash.png` — King Pass subscription offer (₹99/month): Remove Ads, Unlock All Modes, Unlimited Talktime, Rematch Instantly, Access Game History, Unlimited Gameplay, Create Tournament, Unlimited ADDA Access (path/action: waited for splash finish)
- `26-home-screen-ready.png` — King Pass dialog still visible; X button not responsive (path/action: tapped X to close King Pass)
- `27-home-pass-closed.png` — 100K COINS offer appeared (₹90.00 in-app purchase) (path/action: pressed back)
- `28-offer-closed.png` — Coin offer still showing; X button not responsive (path/action: tapped X on coin offer)
- `29-home-clean-now.png` — Coin offer still visible; persistent dialog blocking navigation (path/action: tapped outside dialog area)

## Addendum: earlier secondary-source claims (SUPERSEDED)
A first quick web search returned generic-Ludo explainers claiming Quick = timed, +1/step, +20 capture, +50 per token home, and Rush = +1/step, 3 missed turns = disqualified. These conflict with the official Gametion blog (Quick = first token home plus at least one capture, no points; see "Web research (2026-09-25)" above) and are treated as UNRELIABLE / likely other apps. Rush mode rules remain unconfirmed.

## Phone pass 2 (Rush mode attempt, Haiku subagent, ~48 actions) — files 30-48
Screens 30-48.png (manifest.json entries 30-48) cover: app open, home, Computer mode list (34, 48), ad/offer dismissals (35, 41-44, 46), Exit dialog (36), relaunch (39-40). Result: NOT reached gameplay; no score HUD, rules text or results screen. Ads/offers blocked navigation.
- Rush Mode: the subagent saw only CLASSIC/1 KILL WIN/QUICK/POPULAR/MASK and concluded Rush is absent, but 2026-09-19/ludo-reference/08-computer-mode.png shows Classic + Rush Mode under Computer. UNRESOLVED (different app state/version or entry point). Rush rules remain unconfirmed.
- The "?" on Select Game opened theme selection, not rules (as in pass 1).
