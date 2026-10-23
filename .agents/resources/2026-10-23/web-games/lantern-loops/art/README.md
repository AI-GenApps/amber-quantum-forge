# Lantern Loops art integration evidence (task 06)

Inbox (read-only): `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/lantern-loops/`. Designer review
loop result: `style_anchor_failed`. Accepted: `lantern-amber` (b1 round 3) and `icon` (b1 round 4).

| File | What |
|---|---|
| `art-bible.md` | Copy of the art bible the designer and the reviewer used |
| `accepted-manifest.json` | Copy of `accepted/manifest.json` (prompts, model, notes per accepted asset); the app tests compare the shipped files against it |
| `review/b1-round-1..4-review.md` | Copies of the strict review notes of batch b1, rounds 1 to 4 (round 3 accepted the lantern, round 4 accepted the icon and rejected key-art (missing) and backdrop-harbor) |
| `masters/<slot>.webp` | WebP q90 masters at the generation size (1024x1024), alpha kept for the lantern |
| `report.json` | Per slot: source PNG, master and shipped file size, dimensions, SHA-256, corner alpha, batch and round (centre edge density for backdrops, none accepted) |

Rebuild: `cd apps-games/lantern-loops && bun scripts/convert-art.ts` (add `--inbox <dir>` for another
accepted folder). It is deterministic: a second run produced identical bytes for the report, both
masters and the shipped file (checked with `shasum -a 256`).

Not integrated (code-drawn placeholder kept): `key-art` (not delivered), `backdrop-harbor`
(rejected, round 4), and 11 slots never requested because the style anchor failed. Reasons and
the follow-up question are in `.agents/games/lantern-loops/assets-index.md` and `open-questions.md` (Q11).

The accepted PNG sources stay in the inbox (not copied; their SHA-256 values are in `report.json`).
No image was generated, edited or restyled in this task, and no screenshot of the app was taken.
