# Lantern Loops art integration evidence (task 06)

Inbox (read-only): `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/lantern-loops/`. Designer review
loop result: `ok`. Accepted (14 of 15): `icon`, `key-art`, `lantern-amber`, `lantern-rose`,
`lantern-jade`, `lantern-azure`, `lantern-violet`, `lantern-unlit`, `backdrop-harbor`,
`backdrop-garden`, `backdrop-bridge`, `backdrop-sky`, `daily-medallion`, `feature-graphic`.
Rejected (code-drawn placeholder kept): `empty-archive`.

| File | What |
|---|---|
| `art-bible.md` | Copy of the art bible the designer and the reviewer used |
| `accepted-manifest.json` | Copy of `accepted/manifest.json` (prompts, model, notes, batch and round per accepted asset); the app tests compare the shipped files against it |
| `review/<batch>-round-<n>-review.md` | Copies of the strict review notes: batch b1 rounds 1 to 4 (anchor: lantern-amber round 3, icon round 4), batch b2 rounds 1 to 4 (lanterns, garden, bridge in round 1; sky and medallion in round 2), batch retry rounds 1 to 3 (key-art round 1, feature-graphic round 2, backdrop-harbor round 3) |
| `review/<batch>-round-<n>-brief.md` | Copies of the brief the designer received each round |
| `masters/<slot>.webp` | WebP q90 masters at the generation size, alpha kept for transparent slots (1536x1024 for `feature-graphic`, 1024x1536 for key-art and backdrops, 1024x1024 otherwise) |
| `report.json` | Per slot: source PNG, master and shipped file size, dimensions, SHA-256, corner alpha, batch and round, centre edge density for backdrops (Sobel mean over the central 60 percent, informational) |

Rebuild: `cd apps-games/lantern-loops && bun scripts/convert-art.ts` (add `--inbox <dir>` for another
accepted folder). It is deterministic: a second run produces identical bytes for the report, every
master and every shipped file (checked with `shasum -a 256`).

Not integrated (code-drawn placeholder kept): `empty-archive`, rejected in b2 rounds 2 to 4 and retry
rounds 1 to 3. Final reason (retry round 3): the ribbon reads as a bracket or handle at 160 px, the
cream ribbon and tray vanish on the paper background, the lantern and ribbon look unrelated and the
lantern looks like a squat grey pumpkin. The follow-up question is Q11 in
`.agents/games/lantern-loops/open-questions.md`; the status table is `assets-index.md`.

Not bundled in the web build: `icon` (Capacitor source, task 07) and `feature-graphic` (store
graphic, crop to 1024x500). The accepted PNG sources stay in the inbox (not copied; their SHA-256
values are in `report.json`). No image was generated, edited or restyled in this task, and no
screenshot of the app was taken.
