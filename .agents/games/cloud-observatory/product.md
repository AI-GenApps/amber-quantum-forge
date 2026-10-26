# Cloud Observatory — product

Precise v1 design. Numbers live in [`economy.md`](economy.md), names in
[`content-plan.md`](content-plan.md). If a rule here changes, change them in the same commit.

## One-line fantasy

You inherit a rooftop observatory from your Aunt Verity. Each clear night you gather starlight,
build instruments, ink constellations into the atlas, and read her logbook to learn why the sky was
growing quiet.

## The loop

1. **Gather.** Tap the sky: +1 starlight per tap (multiplied by the Telescope upgrades and the
   global multiplier). This is the bootstrap; late in a cycle it is a small bonus.
2. **Build.** Instruments produce starlight per second. Buy them with starlight. Cost of the n-th
   unit is `baseCost * growth^owned`. Buy ×1, ×10 or ×Max.
3. **Upgrade.** Each instrument has three upgrades, unlocked at 10, 25 and 50 owned (multipliers
   ×2, ×2, ×3 for that instrument; the Telescope upgrades also multiply Gather).
4. **Chart.** Each constellation has a starlight cost and an instrument prerequisite. When both are
   met, open the Chart Table: the constellation's stars appear on the sky map; tap them in order.
   A wrong tap shakes the star and counts as a mistake (no failure, no timer, no penalty other
   than losing the flawless mark). Completing the chart inks the constellation into the atlas:
   +5% global starlight (permanent) and one lore entry.
5. **Read.** Lore entries unlock from instruments (first purchase), constellations (charting) and
   boons (first purchase). 30 entries in 6 chapters, read in the Journal.
6. **Eclipse.** With at least 5 pending Eclipse shards the player may trigger an Eclipse: the cycle
   resets and the shards are banked. Shards buy permanent boons (10 boons, 105 shards in total).
   The next cycle is faster. Repeat until the boons are complete, then Eclipse for achievements.
7. **Daily Comet.** Once per local date a seeded comet pattern can be traced for a starlight burst
   and a streak (see below).

The first session promise: first star charted within 3 minutes; first Eclipse after 2.5 to 4 hours
of active play, spread over many sessions with offline progress in between.

## Rules (precise)

- All values are IEEE doubles. No bignum. The number formatter is required to render any value up to
  1e300 (suffixes to Dc then scientific) and never prints `NaN` or `Infinity` (clamped to
  `1e300+`). Starlight is clamped at 1e300.
- Production per second: `sum(owned_i * baseSps_i * instrumentMult_i) * globalMult`.
  `globalMult = (1 + 0.05 * atlasInkFactor * constellationsCharted + 0.01 * achievementsUnlocked) *
  boonGlobal`, with `atlasInkFactor` 1 (1.5 with the Atlas Ink boon) and `boonGlobal` the product
  of Corona (×1.5) and Totality (×2).
- Gather value per tap: `1 * telescopeUpgradeMult * globalMult`.
- Charting never consumes instruments. Its starlight cost is paid on completion of the pattern,
  not on start, so abandoning a chart is free. The Chart button is disabled while starlight is
  below the cost or the instrument prerequisite is unmet.
- A chart session holds: constellation id, next star index, mistake count. Leaving the screen
  abandons the session (progress is not saved mid-chart). Completing sets `flawless = mistakes == 0`.
- The Eclipse resets: starlight, instruments owned, upgrades bought, the cycle starlight counter,
  and the cycle timer. It keeps: charted constellations, lore, achievements, shards, boons,
  lifetime statistics, the comet streak, settings.
- Pending shards: `floor(sqrt(cycleStarlight / 1e9))`; the Eclipse button enables at 5 or more.
- Offline: on resume, elapsed seconds since the last save (clamped to `[0, 28800]`; a negative
  value from a clock that went back counts as 0) times the production at the moment of the last
  save times the efficiency (50%, 75% with Night Watch, 100% with Long Vigil). No purchases happen
  offline; a Welcome Back sheet shows time away and starlight gained.
- Autosave: every 10 seconds of play, on every purchase, on chart completion, on Eclipse, on a Comet
  claim, after a resume and on the lifecycle pause event. Bursts of triggers are coalesced into one
  write (400 ms debounce). Every write also stamps `lastSeenMs`, so a killed app still resumes from
  its last save. If the stored save could not be read at all (`read-failed`), autosave stays off for
  that launch so a good save is never overwritten by defaults.
- Resume details: the elapsed time is `(now - lastSeenMs) / 1000`; `NaN`, infinite or negative
  elapsed counts as 0 and the seen time is reset to now. A collect is "full" (Long Sleep) when the
  counted time reaches the 8 hour cap with a positive gain (exactly 8 hours counts). The Welcome
  Back sheet is offered when the gain is positive and the player was away at least 60 seconds.
  One tick step in play is clamped to 30 seconds; longer gaps must come through `resume`.
- Lore: unlocked entries are stored in the profile (`loreUnlocked`), because the Eclipse clears the
  owned instruments; read state is `loreSeen`. A chapter toast precedes the first entry of a
  chapter.

## The Wandering Comet (daily mode)

- Unlocks after the first constellation is charted.
- The device-local date key seeds the pattern: `dailySeed("cloud-observatory", dateKey)` feeds the
  kit rng; the pattern is 6 stars on the sky map with minimum spacing 140 map units and a 100-unit
  margin, in a fixed tracing order. Same date gives the same comet on every device.
- Once per date. Reward: `max(1000, 900 * productionPerSecond) * (1 + 0.1 * min(streak - 1, 4))`
  starlight (900 seconds of production, boosted up to +40% at a 5-day streak). Every 7th streak day
  also awards +1 Eclipse shard.
- Claiming is refused with a reason: `locked` (no constellation yet), `already-claimed` (same date)
  or `clock-went-back` (the date key is earlier than the last claim; the streak is kept). The
  profile keeps `cometLastKey`, `cometStreak` and `cometDays` (number of dates ever claimed, for
  Comet Chaser).
- Streak: consecutive local dates (`streakStep`: next-day adds one, gap resets to 1, same-day
  cannot claim twice, clock-went-back is ignored without breaking the streak).
- Missing a day never takes anything away other than resetting the streak counter; the longest
  streak is kept in statistics.

## Screens

Navigation is a bottom tab bar on the Observatory shell (5 tabs) plus pushed screens from the
header menu. All screens are portrait, safe-area aware.

| Screen | Purpose |
|---|---|
| Title | Logo, Continue / New Journey, How to Play, Settings. Shown on cold start |
| Observe (tab 1) | The sky: tap to Gather, Comet button (after the first chart), next-goal hint. The starlight total and per-second readout sit in the header that every tab shares |
| Build (tab 2) | Instrument list with buy ×1/×10/×Max, upgrade chips per instrument |
| Atlas (tab 3) | 12 constellation cards (locked, ready, charted), opens the Chart Table |
| Chart Table | Full-screen sky map to tap a constellation's stars in order |
| Eclipse (tab 4) | Pending shards, Eclipse button with confirm, boon grid and bank |
| Journal (tab 5) | Six chapters, 30 entries, locked entries show their unlock hint |
| Welcome Back (sheet) | Offline summary on resume |
| Comet (screen) | The daily tracing screen, streak display |
| Achievements | 20 achievements with progress |
| Statistics | Lifetime and current-cycle numbers |
| Settings | Sound, music, haptics, reduced motion, high contrast, reset progress |
| How to Play | Four-page guide with a diagram per page (Gather and Build, Chart the Sky, The Eclipse, The Comet and the Journal), from Title, menu and Settings; the first-run hints are separate and replayable from here |
| Eclipse sequence | Short full-screen transition at the moment of the Eclipse (2.4 s: dim, ring of light, return; slow, no flashing; a still card the player dismisses when motion is reduced) |
| Chapter card | Interstitial sheet when a new chapter begins |

## Controls

- Everything is tap. No gestures required. Long-press on a buy button repeats at 4 per second.
- Chart Table: tap the highlighted next star; the hit radius is 24 CSS px minimum (48 px target).
  Stars are numbered; the next star pulses (and shows a ring and its number when motion is reduced).
- Dev builds only: `?devspeed=N` (1 to 600) multiplies the tick delta so the owner can reach the
  Eclipse quickly during QA; production builds ignore it.
- Android back: closes the open sheet, then pops the screen, then (Observe tab) asks to leave.
- Haptics: light impact on correct star and on any purchase, soft warning on a wrong star, success
  on chart complete, achievement and Comet, medium on Eclipse. All behind the haptics setting.
- Long-press on a buy button: after 450 ms it repeats at 4 per second; the click that ends a hold is
  ignored. The buy amount (x1, x10, Max) is one toggle at the top of the Build tab and applies to every
  row; an unaffordable amount disables the button, Max with nothing affordable quotes one unit.
- Chart Table taps: a tap is matched to the nearest star within 24 CSS px (never less) of the finger;
  stars are also focusable and take Enter or Space. A tap on empty sky does nothing and costs nothing.
  A wrong tap shakes that star, shows "Not that star. Find number N." and adds one mistake; tapping a
  finished star again is ignored.
- Android back also steps off a non-Observe tab: with nothing open, back from Build, Atlas, Eclipse or
  Journal returns to Observe first, and only then asks "Leave the observatory?". On the Title screen
  back exits the app.
- The game clock does not run on the Title screen. It ticks at most 10 times per second, pauses with
  the page or app, and offline progress is collected on return.

## Onboarding

First run only, skippable, replayable from How to Play. Four beats, each unlocked by what the player
just did, never a wall of text:

1. Observe: "Tap the sky to gather starlight." (appears until 3 taps)
2. Build: "Buy a Brass Telescope." arrow to Build tab (appears at 15 starlight)
3. Atlas: "Your first constellation is ready." (when the Lyre is available)
4. Chart: "Tap the numbered stars in order." (first Chart Table open only)

The Eclipse is explained by a one-time sheet the first time pending shards reach 5. A save that
already did a beat skips it. "Skip tips" hides the hints for good; "Show the tips again" on the How to
Play screen starts them over. The hints sit above the tab bar, never cover a control and never capture
a tap.

## Accessibility

- Contrast: all text at least 4.5:1 against its surface (the palette in the art bible gives 5.2:1
  to 15.4:1 for text colours); a unit test computes the ratios from the tokens.
- Hit areas: every button, tab, chip and star at least 44 by 44 CSS px.
- Never colour alone: the next star has a ring and a number; locked/ready/charted use an icon and a
  label, not only hue.
- Reduced motion (system or setting): no twinkle, no parallax, no Eclipse flash; transitions are
  instant; the next-star pulse is a static ring.
- High-contrast setting: raises text to parchment on solid navy, removes washes behind text,
  thickens constellation lines.
- Text uses `rem`; layouts hold at 130% system font size. No text below 14 px equivalent.
- Screen reader: buttons have names; starlight changes are announced politely at most every 5 s;
  large numbers carry an `aria-label` with words ("1.2 million").
- No flashing above 3 per second anywhere.
- English only.
