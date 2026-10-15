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
