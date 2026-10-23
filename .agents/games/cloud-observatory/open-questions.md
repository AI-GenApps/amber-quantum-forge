# Cloud Observatory — open questions

Nothing here blocks starting task 01. Each item names the task that closes it.

| # | Question | Default if unanswered | Closes in |
|---|---|---|---|
| 1 | Final constellation star coordinates (86 stars) | Hand-authored on the 1000×1400 map, validated by spacing/margin tests | 02 (closed: coordinates are in `src/content/constellations.ts`, see decisions-log) |
| 2 | Do the simulator's tuned numbers move the Eclipse divisor or growth rates? | Keep the economy.md values unless a pacing target fails; record any change in the same commit | 02 (closed: no number moved, every target met) |
| 3 | Long ambient music loop that is explicitly CC0 (Kenney has jingles, not long ambient tracks) | Search OpenGameArt/other pages that state CC0 in their licence field; if none is found, ship sfx and jingles only and record it | 05 (closed: found. "Cosmic Navigation" by Synth-thetic on OpenGameArt states CC0 and ships a 153.6 s loop file; it is `observatory-night`. The slot stays wired, so it can be swapped or removed with one table edit) |
| 4 | Audio container: MP3 vs AAC vs Ogg for iOS and Android WebViews | MP3 (`ffmpeg` and `lame` are installed on the build machine) | 05 (closed: MP3, 64 kbps mono cues and a 96 kbps stereo loop, 1.92 MB in all) |
| 5 | Designer thread art acceptance: which of the 33 slots pass review | Rejected slots keep code-drawn placeholders; record in assets-index.md | 06 (closed: 3 of 33 accepted: `key-art`, `observatory-building`, `emblem-lyre`; 30 placeholders, see rows 15 to 21) |
| 6 | Font weights actually used by the final screens | Cormorant Garamond 500/700 and italic 500, Manrope variable | 04 (closed: those four files are bundled; the italic is reserved for flavour text and not yet used on a screen) |
| 7 | App icon and splash source: `icon` and `key-art` as accepted | If `icon` is rejected, generate a code-drawn icon (gold star on navy) with `sharp` as a stopgap | 07 (`icon` was rejected in b1 round 4, so the stopgap applies; `key-art` is accepted and its master is the splash source) |
| 8 | Clock forward exploit (offline 8 h per resume by changing the system clock) | Accepted for a single-player offline game; revisit if monetization arrives | later |
| 9 | Privacy policy hosting and developer identity | Not needed until submission (human) | later |
| 10 | Should shards ever have a passive bonus in addition to buying boons | No; revisit after owner QA | later |
| 11 | Android `INTERNET` permission declared by the Capacitor template although the game is offline | Remove only if the bridge still works without it; otherwise keep and document | 07 |
| 12 | Does the MP3 loop have an audible gap at the seam on a real device? MP3 encoder padding can add a few milliseconds; the source is the provided loop file and the LAME header carries the delay | Accept; if the owner hears it, re-encode with `-write_xing 0` and trim, or ship the loop as AAC in an `.m4a` | owner QA (task 08) |
| 13 | Owner listening pass over the 13 cues and the loop (chosen without listening, by the no-device rule) | Swap any file in `src/audio/cues.ts` and `public/audio/LICENSES.md` together | owner QA (task 08) |
| 14 | The first gesture that unlocks audio plays no sound itself (the context is still suspended when the click handler runs) | Accept; every later tap sounds | later |
| 15 | `icon` placeholder: rejected in the final round of b1 (bloom has blocky pixel-stepped edges; vector eight-point star overlapped by the telescope tube; telescope pasted across the dome face instead of rising from the slit; base is a bare pillar, not the keeper's-house terrace) | Task 07 code-drawn icon; recommended follow-up: one more designer round with the accepted building as the reference and the bloom fix as the first line of the brief | 07 / owner |
| 16 | `sky-far`, `nebula-mid`, `horizon-hills` placeholders (not requested, style anchor failed) | Code-drawn sky, nebula and hills stay | owner: order designer batch b2 |
| 17 | 11 emblem placeholders: whale, archer, crown, serpent, lantern, ship, fox, key, harp, tower, owl (not requested). The atlas grid mixes one painted emblem (lyre) with eleven code-drawn ones | Accept; the lyre is the designer's anchor for the rest. Recommended: batch b2 with `emblem-lyre` as the reference, adding top-left light and bottom-right shade as the reviewer asked | owner: designer batch b2 |
| 18 | 8 instrument placeholders (telescope, lens, prism, orrery, star-map, beacon, archive, aurora-coil; not requested) | Code-drawn instruments stay | owner: designer batch b4 |
| 19 | 6 lore vignette placeholders (`lore-1` to `lore-6`; not requested) | Code-drawn chapter art stays | owner: designer batch b5 |
| 20 | `feature-graphic` (store feature graphic 1536x1024, not requested; not bundled) | None needed for the app; the store listing needs it before submission | owner: designer batch b5 |
| 21 | The accepted `key-art` and `observatory-building` are cel-inked and a little crisper than the soft code-drawn sky and placeholders around them (reviewer note); judged only by the owner in the browser | Accept; revisit when `sky-far` and `nebula-mid` are painted | owner QA (task 08) |

## Kit follow-ups (record only; the kit is read-only for this epic)

| Task | Symptom | Worked around by | Proposed kit fix |
|---|---|---|---|
| 04 | `@web-games/kit` does not export the `cx` class helper (it is private to `ui/`) | `src/ui/cx.ts` | Export `cx` from `ui/index.ts` |
| 04 | `Button` and `IconButton` accept no `aria-label`, `data-*` or pointer handlers, so a repeat-on-hold buy button and buttons with a longer spoken name need a raw `<button>` | Plain `<button class="wg-btn ...">` where needed | Spread remaining props onto the `<button>` |
| 04 | `Tabs` always renders the tab list before the panel, so a bottom tab bar needs CSS `order` | `order` rules in `styles-base.ts` | Add a `position="bottom"` option |
| 04 | `Toast` restarts its dismiss timer on every render when `onDismiss` is not memoised | Stable `useCallback` dismissers in `app/queues.ts` | Keep the latest `onDismiss` in a ref |
| 04 | `Sheet` has no focus trap and does not restore focus on close | Not worked around (the dialog itself receives focus on open only) | Trap Tab inside the dialog and restore the opener's focus |
| 04 | `Screen` padding shorthand and the safe-area longhands live in one rule, so a full-bleed screen must reset padding itself | `.co-title` and `.co-shell` reset it and add their own insets | Add a `bleed` prop |
| 05 | `AudioManager.installUnlock` removes its listeners itself but offers no hook after a successful unlock, so the game could not start the lazy file loads from it | `createGameAudio.installUnlock` in `src/audio/cues.ts` wraps `manager.unlock` | Accept an `onUnlock` callback in `installUnlock` |
| 05 | `Motion.tween` cancels the animation and leaves the last keyframe as an inline style (a pulse ends with `transform: scale(1)` on the element) | Harmless for the controls animated here; skipped entirely when reduced so no inline style is written | Option to drop the inline style for keyframes that return to the start |
| 05 | `Card` accepts no `data-*` or `aria-*` props | Put attributes on an inner element | Spread remaining props onto the root |
