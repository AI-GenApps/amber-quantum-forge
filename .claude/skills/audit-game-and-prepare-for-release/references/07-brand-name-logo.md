# Phase 7 — Brand name and logo

## Name

The user rule: **the name must not already exist** as an app or game anywhere. A generic
genre word alone ("Ludo") is rejected. "Ludo X" names are saturated — in the Ludo run,
Legend(s), Rush, Clash, Rivals, Arena, Blitz, Royale, Crown, Nova, Duel, Vibe, Titans,
Sultan, Zone, Mania, Fever, Champs, Bash, Carnival, Fiesta, Tribe, Dice Dynasty, Bazaar all
existed. "Ludo Vortex" passed (backups: Ludo Odyssey, Ludo Meridian).

Strict existence check (Sonnet agent, web only; domains NOT required):
1. Google Play search page `https://play.google.com/store/search?q=<name>&c=apps` (+quoted)
   and `site:play.google.com "<name>"`.
2. App Store: `https://itunes.apple.com/search?term=<name>&entity=software&limit=50`
   (check `trackName`) and `site:apps.apple.com "<name>"`.
3. Web: `"<name>" game`, `"<name>" app`, APK mirrors, browser-game sites, itch.io, Steam,
   Kongregate, social pages.
4. Trademark glance (USPTO/India TMR/WIPO hints via search).
Fuzzy/near matches in the same category = conflict. Output EXISTS / NOT FOUND / UNSURE with
URLs. Only present NOT FOUND names to the user (AskUserQuestion). If the user says a name
exists, believe them and re-run. Recommend a formal trademark clearance before launch.

After the choice: update memory; change the display name (registry `publicTitle` /
`canonicalName` → `games:codegen` → Android label / iOS display name), keep internal id and
bundle ids unless the user decides otherwise.

## Logo (dry run → rounds → integrate)

1. **Dry run**: write 3 direction briefs (icon + wordmark each), optionally render cheap
   previews, assemble a contact sheet. Directions used for Ludo: vortex swirl · dice portal ·
   token orbit.
2. **Round 1 (final quality)**: `gpt_image_2_5 --quality high --resolution 2k`, icons 1:1 no
   text (works at 48px), wordmarks with exact text (spell-check; regenerate once if wrong).
   Contact sheet → user.
3. **Lookalike check before recommending**: four-color swirls read as Google Chrome →
   store rejection/trademark risk. Also avoid competitor motifs (crowns, "King").
4. **Refinement**: mix-and-match the user's picks (e.g. token-orbit icon + dice-portal
   wordmark) using `--image-references` to carry style; produce stacked (splash) and wide
   (header/feature graphic) variants + `--background transparent` versions (verify alpha
   with PIL); sheet with transparent versions composited on the app background.
5. **Integrate** (Sonnet agent): launcher icons (Android legacy + adaptive with safe zone,
   iOS AppIcon; this repo's `scripts/games/icons.ts` renders from
   `apps-native/games/<id>/assets/branding/icon.svg` — embedding the PNG there worked),
   optimized in-app copies (≤ ~1024 px, < 600 KB) under `assets/art/`, manifest slots
   (`logoStacked`, `logoWide`) with code-drawn fallback, `assets/art/LICENSES.md`
   provenance, goldens, device captures (welcome, lobby header, launcher/app drawer).
   Masters stay in `.agents/resources/<date>/<game>-art/logo/` with README + prompts.

Known follow-ups seen: wide logo too small in the lobby header; Samsung may show a second
launcher icon with a badge (dual-app/profile copy) — mention, offer cleanup.
