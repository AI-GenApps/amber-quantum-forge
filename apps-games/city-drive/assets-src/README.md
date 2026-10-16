# assets-src

Source side of the CC0 asset pipeline (task 17-city-drive/04).

- `LICENSES/<pack>.txt`: one licence record per Kenney pack (source URL, download URL, download
  date, zip SHA-256 and the pack's own `License.txt` verbatim). Committed.
- `raw/`: extracted Kenney packs (`kenney_<pack>*/License.txt` and `Models/GLB format/`).
  **Gitignored.** The packs are untrusted downloads; nothing inside them is executed.

Rebuild after downloading and extracting the four packs from the URLs in `LICENSES/*.txt`:

```bash
bun run --filter @city-drive/app build-assets -- --raw <dir with the extracted packs> [--zips <dir with the zips>] [--validate]
```

Without `raw/` the script only verifies the committed manifest, budgets and licence records.

## Audio (task 14)

- `LICENSES/audio-*.txt`: one record per audio source (URL, author, CC0, date, SHA-256 of each
  download; Kenney packs embed their `License.txt`, OpenGameArt sources name the page that states CC0).
- Rebuild after downloading the sources listed in `scripts/audio/catalog.ts` into one folder per source
  id (`<raw>/audio-kenney-impact-sounds/Audio/...`) and the downloads into `<zips>`:

```bash
bun run --filter @city-drive/app build-audio -- --raw <raw dir> --zips <zips dir>
```

Needs `ffmpeg` (`FFMPEG` / `FFPROBE` env vars override `/home/linuxbrew/.linuxbrew/bin`). Without `--raw`
the script only verifies the committed manifest, the 3 MB budget and the licence records. The downloads
are untrusted data: they are only read and decoded by ffmpeg.
