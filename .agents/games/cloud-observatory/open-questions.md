# Cloud Observatory — open questions

Nothing here blocks starting task 01. Each item names the task that closes it.

| # | Question | Default if unanswered | Closes in |
|---|---|---|---|
| 1 | Final constellation star coordinates (86 stars) | Hand-authored on the 1000×1400 map, validated by spacing/margin tests | 02 |
| 2 | Do the simulator's tuned numbers move the Eclipse divisor or growth rates? | Keep the economy.md values unless a pacing target fails; record any change in the same commit | 02 |
| 3 | Long ambient music loop that is explicitly CC0 (Kenney has jingles, not long ambient tracks) | Search OpenGameArt/other pages that state CC0 in their licence field; if none is found, ship sfx and jingles only and record it | 05 |
| 4 | Audio container: MP3 vs AAC vs Ogg for iOS and Android WebViews | MP3 (`ffmpeg` and `lame` are installed on the build machine) | 05 |
| 5 | Designer thread art acceptance: which of the 33 slots pass review | Rejected slots keep code-drawn placeholders; record in assets-index.md | 06 |
| 6 | Font weights actually used by the final screens | Cormorant Garamond 500/700 and italic 500, Manrope variable | 04 |
| 7 | App icon and splash source: `icon` and `key-art` as accepted | If `icon` is rejected, generate a code-drawn icon (gold star on navy) with `sharp` as a stopgap | 07 |
| 8 | Clock forward exploit (offline 8 h per resume by changing the system clock) | Accepted for a single-player offline game; revisit if monetization arrives | later |
| 9 | Privacy policy hosting and developer identity | Not needed until submission (human) | later |
| 10 | Should shards ever have a passive bonus in addition to buying boons | No; revisit after owner QA | later |
| 11 | Android `INTERNET` permission declared by the Capacitor template although the game is offline | Remove only if the bridge still works without it; otherwise keep and document | 07 |

## Kit follow-ups (record only; the kit is read-only for this epic)

None known at planning time. If a kit bug blocks a task, work around it inside this game and add a
row here with the task number, the symptom and the proposed kit fix.
