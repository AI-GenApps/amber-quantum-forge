---
epic: 17-city-drive
task: 20-apply-name-and-brand
status: completed
commit_scope: city-drive
depends_on: [17-city-drive/19-human-pick-name-and-icon]
estimate: M
owner: agent
---

# Apply the chosen name, final icon, splash

## Goal

Rename the game everywhere user-facing to the name picked at task 19. Produce
the final icon from the chosen draft and generate every platform icon and
splash asset.

## Context / Decisions

- Read `tasks/epics/17-city-drive/decisions.md` for the name, the icon draft,
  and the requested changes.
- **Name:** change the single working-title constant (task 13), the Capacitor
  `appName`, the Android `strings.xml` `app_name`, the iOS `CFBundleDisplayName`,
  the HTML `<title>` and the web manifest, the registry `publicTitle`, and the
  knowledge base.
  - **Keep internal ids unchanged:** `city_drive`, `city-drive`, the folder
    names, and `app.w3dev.citydrive`. Record this in the decisions log, the way
    Merge Relay kept `merge_relay`.
- **Final icon:**
  - If changes were requested, regenerate with the `generate-image` skill:
    smoke test first, log the prompts, and return blocked on failure.
  - Clean up the master at 1024×1024 RGB with no alpha (iOS requirement).
  - Make an Android adaptive foreground and background pair: a foreground with
    a transparent background inside the safe zone, and a solid background
    colour.
  - Masters go under `.agents/resources/2026-10-15/city-drive-art/icon/`.
- **Generate the platform assets** with `@capacitor/assets` (exact pin, dev
  dependency) from `apps-games/city-drive/resources/{icon.png,icon-foreground.png,icon-background.png,splash.png,splash-dark.png}`.
  - The splash is the logo on the brand colour, landscape-safe.
  - Also make the web favicon and PWA manifest icons (192 and 512).
- **Logo wordmark** for the home screen: the name set in Russo One plus a
  small icon mark. Use HTML/CSS, not an image, so it stays crisp.
- **Tests:**
  - The name constant is used by the home screen and the document title.
  - The icon files exist at the expected sizes; check them with sharp in a
    Vitest test.
  - The iOS icon has no alpha.

## Implementation Checklist

- [x] Apply the name across all user-facing surfaces and the registry
      `publicTitle`.
- [x] Final icon masters, then `@capacitor/assets` generation and `cap sync`.
- [x] Favicon and PWA icons; the home wordmark.
- [x] Tests for the name usage and the icon sizes and alpha.
- [x] Update the knowledge base: `README.md` quick facts, `assets-index.md`,
      `decisions-log.md`.

## Files Touched

- `apps-games/city-drive/{resources/**,android/**/res/**,ios/**/Assets.xcassets/**,public/**,index.html,src/ui/**,capacitor.config.ts,package.json,test/**}`, `bun.lock`
- `scripts/games/registry-games.ts` (`publicTitle`)
- `.agents/games/city-drive/**`, `.agents/resources/2026-10-15/city-drive-art/icon/**`

## Acceptance Criteria

- No user-facing "City Drive" string remains (unless it was chosen as the
  name). Check with `grep -rni "city drive"` over `src`, `index.html`, and
  the native resources.
- The icon tests pass, and `cap sync` succeeds.
- The debug APK still builds if the toolchain exists (from task 17).

## Out of Scope

- Store screenshots and the listing (task 21).

## Verification Commands

- `bun run city-drive:test`
- `bun run city-drive:cap:sync`
- `bun run games:test:tooling`

## Commit message

`feat(city-drive): apply chosen name, icon and splash [17-city-drive/20]`

## Dry-run amendments (2026-10-15)

These come from the read-only dry-run review of this epic. **Where they conflict with anything above, these amendments win.**

- **Adaptive foreground:** ask the `generate-image` skill for the mark on a flat key colour (or a transparent PNG), then key out or clean the background with sharp. Log the prompts.
- **`canonicalName`:** decide whether the registry `canonicalName` changes with the brand (Merge Relay's did), and record the decision in the decisions log.
- **Wider name grep:** the "no leftover working title" grep also covers `docs-public/` and the registry.
- **Tooling tests:** after `games:test:tooling`, run `git checkout -- apps-native/`; nothing may change under `apps-native/`.
- **Files Touched:** add `.agents/resources/2026-10-15/city-drive-qa/20/README.md`.

## Implementation notes (2026-10-16)

- Added beyond Files Touched: `knip.json` (`@capacitor/assets` is used only as a binary, so it joins the
  app workspace's `ignoreDependencies`), `apps-games/city-drive/scripts/{build-brand-art.ts,brand-assets.ts,brand-art/*}`
  (the reproducible art builder and the `brand:art` / `brand:assets` scripts), `docs-internal/gaming/{app-source-registry,city-drive-native-build}.md`
  (name only), `scripts/games/registry-web.test.ts` (asserts the new `publicTitle` and `canonicalName`),
  `apps-games/city-drive/README.md`, `.agents/resources/2026-10-15/city-drive-art/icon/**` and
  `.agents/resources/2026-10-15/city-drive-qa/20/**`.
- Console and error prefixes in `src/` now interpolate `GAME_TITLE` so `grep -rni "city drive" src` is empty.
- `canonicalName` was changed with the brand (decision recorded in `.agents/games/city-drive/decisions-log.md`).
- `@capacitor/assets` 3.0.5 reformats `AndroidManifest.xml`; `brand-assets.ts` restores it byte for byte.
- Verification: `city-drive:test` pass (603 passed, 1 pre-existing skip); `city-drive:cap:sync` pass;
  `games:test:tooling` 58 pass and 3 fail, all pre-existing (Bun pin, dart, flutter; reproduced on HEAD);
  `city-drive:typecheck` and `biome check` pass; debug APK builds and reports `Street Royale`.
  Evidence: `.agents/resources/2026-10-15/city-drive-qa/20/README.md`.
- NOT RUN: any visual check of the icon, splash or home wordmark on a device or in a browser (owner), iOS build.
