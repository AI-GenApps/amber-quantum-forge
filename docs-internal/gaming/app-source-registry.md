# Gaming app and source registry

The executable registry is [`scripts/games/registry.ts`](../../scripts/games/registry.ts). `bun run games:list` reads the same records used by config generation, native identity validation, affected-target detection, and artifact metadata.

| Internal ID | Public title | Client path | Pure rules package | Production IDs | Local debug ID | Source record |
|---|---|---|---|---|---|---|
| `merge_relay` | Merge Relay | `apps-native/games/merge_relay` | `merge_rules` | `app.w3dev.mergerelay` | `app.w3dev.mergerelay.debug` | [`sources/merge-relay.json`](sources/merge-relay.json) |
| `pocket_biome` | Pocket Biome | `apps-native/games/pocket_biome` | `biome_rules` | `app.w3dev.pocketbiome` | `app.w3dev.pocketbiome.debug` | [`sources/pocket-biome.json`](sources/pocket-biome.json) |
| `sixty_second_heist` | Sixty-Second Heist | `apps-native/games/sixty_second_heist` | `heist_rules` | `app.w3dev.sixtysecondheist` | `app.w3dev.sixtysecondheist.debug` | [`sources/sixty-second-heist.json`](sources/sixty-second-heist.json) |
| `meme_court` | Meme Court | `apps-native/games/meme_court` | `court_rules` | `app.w3dev.memecourt` | `app.w3dev.memecourt.debug` | [`sources/meme-court.json`](sources/meme-court.json) |
| `snapquest` | Peeklings | `apps-native/games/snapquest` | `snapquest_rules` | `app.w3dev.snapquest` | `app.w3dev.snapquest.debug` | [`sources/snapquest.json`](sources/snapquest.json) |
| `city_drive` | City Drive (working title) | `apps-games/city-drive` | `apps-games/city-drive-core` (TypeScript) | `app.w3dev.citydrive` | `app.w3dev.citydrive.debug` | [`.agents/games/city-drive/`](../../.agents/games/city-drive/README.md) |

## Engine field

Every registry entry carries `engine: "flutter" | "web"`. The six existing games are `flutter`; `city_drive` is the first `web` game (Babylon.js + TypeScript, packaged with Capacitor in a later task). The `rendering` field also allows `babylon`, and `rendering: "babylon"` is valid only for `engine: "web"`.

| Engine | `paths.app` must contain | `paths.rulesPackage` must contain | Tooling that applies |
|---|---|---|---|
| `flutter` | `pubspec.yaml` | Dart package with `pubspec.yaml` | Everything under `games:*` |
| `web` | `package.json` (Bun workspace under `apps-games/*`) | `package.json` (pure TypeScript core, `apps-games/city-drive-core`) | `bun run city-drive:*` and `.github/workflows/city-drive-ci.yml` |

`validateGameRegistry()` checks the entry list against the declared `GAME_IDS` list in `registry-types.ts` instead of a hard-coded count, so adding a game means adding its ID there and its entry in `registry-games.ts`.

Flutter-only paths are gated by `engine === "flutter"`: app and package discovery (`existingApps`, `existingPackages`), `games:format`, `analyze`, `test`, `bootstrap`, `doctor`, `validate --strict`, generated `game.config.json` validation, content-manifest validation, `native`, `xcodegen`, `icons`, `metadata`, `run`, and the Dart registry codegen. The generated Dart registry therefore lists only Flutter games. With `--app city_drive`, `format`/`analyze`/`test`/`doctor`/`xcodegen`/`icons` print a `SKIP ... web engine` line and exit 0; `games:build -- --app city_drive` prints the web-engine message (use `bun run city-drive:build`) and exits 0; `run` and `metadata` fail with a clear web-engine error.

`games:list` prints an engine column. `games:affected` maps `apps-games/city-drive/**` and `apps-games/city-drive-core/**` to `city_drive` in a separate `web_apps` field; the `apps` field (the Flutter Android/iOS matrices) never contains a web game. `city_drive` is intentionally not in `packages/api/src/games/contracts.ts` `GAME_APP_IDS`: v1 has no backend.

SnapQuest and Peeklings are one product. `snapquest` remains the stable internal ID and `Apps/SnapQuest/` remains its canonical Drive folder. Public titles, subtitles, capabilities, and the complete source record set remain separate from technical bundle identifiers.

The registry records `debug`, `staging`, and `production` environments. Each generated app config carries an explicit environment, active native ID, save namespace, analytics namespace, version, and build number. Save namespaces use the stable app ID plus environment; schema migrations change the schema field and do not rename the save boundary. The checked-in native records set iOS deployment target 15.0 for all five apps; Android uses the Flutter project floor for the first four and API 24 for SnapQuest because of its camera plugin. These are current generated project settings, not store registration claims.

External store registration, publisher credentials, domains, product IDs, and distribution signing claims are unresolved in the registry. The finalized technical IDs above are not evidence of external registration. The registry reports capabilities in five states: specified, implemented, integrated, verified, and enabled. SnapQuest has a bounded camera capability seam, the SnapQuest-only `camera` SDK and camera permission are present in the native projects, and lifecycle/ephemeral-buffer tests pass; descriptor calibration and physical hardware verification remain unresolved.

The source provenance manifest is [`sources.json`](sources.json). It records the playbook, current v0.3 indexes, PRDs, detailed references, validation records, decisions, platform records, retrieval times, and SHA-256 values. Refreshing source documents must update that manifest and the affected handoff before changing code.
