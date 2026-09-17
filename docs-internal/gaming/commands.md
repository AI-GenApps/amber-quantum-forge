# Actual gaming developer commands

Run commands from the repository root after Bun, Flutter 3.47.3, and Dart 3.13.3 are available. The scoped workspace is intentionally separate from `apps-native/flutter-app`.

| Command | What it does |
|---|---|
| `bun run games:bootstrap` | Installs the Bun lockfile, verifies all five apps and six packages, resolves the scoped Pub workspace, and resolves each app against the workspace lockfile. |
| `bun run games:doctor` | Reports Bun, Flutter, Dart, Xcode, and ADB availability. Add `-- --strict` to fail on toolchain mismatches. |
| `bun run games:list` | Lists stable IDs, public titles, production iOS IDs, rendering surface, and readiness. |
| `bun run games:format` | Formats pure packages and selected/all game clients. Add `-- --check` for CI. |
| `bun run games:analyze` | Runs Dart analysis for packages and Flutter analysis for clients. Add `-- --app <id>` to select one client. |
| `bun run games:test` | Runs package and client tests. Add `-- --app <id>` for one client. |
| `bun run games:validate:strict` | Validates registry, generated config, native IDs, optional SDKs, permissions, content, and all workspace members. |
| `bun run games:content:validate` | Checks JSON content for valid syntax, size limits, and blocked customer/photo/caption fields. |
| `bun run games:affected -- --base <sha> --format=json` | Computes affected clients; invalid or missing bases produce a full matrix. Renames/deletes are included. |
| `bun run games:run -- --app merge_relay --device-id <physical-id>` | Runs one app on a connected physical device. Emulator and simulator IDs return `NOT RUN` with exit code 2. |
| `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug` | Builds one debug APK with the debug application ID suffix. |
| `bun run games:build -- --app merge_relay --platform android --mode release --environment debug` | Builds one optimized Android APK using the local debug keystore and the debug environment ID; this is a release-mode debug-signed artifact, not a store distribution build. |
| `bun run games:build -- --app merge_relay --platform ios --mode unsigned --environment debug` | Builds one unsigned iOS app on macOS with Xcode. Signed/device/distribution modes remain explicit release gates. |
| `bun run games:generate -- --id generated_sixth --title "Generated Sixth" --output <new-directory>` | Creates a generic Flutter app with isolated debug IDs/config and no registered game rules or optional SDKs. |
| `bun run games:validate-generated -- --output <directory>` | Validates the generated config, Android package, iOS IDs, runtime config asset, and no cross-game imports. |
| `bun run games:codegen` | Regenerates app configs and the Dart registry from the TypeScript registry. Use `-- --environment production` only for an intentional production config build. |
| `bun run games:test:tooling` | Runs registry, content, affected-target, generator, metadata, parity, and CLI tests. |
| `bun run games:parity` | Runs the checked-in Merge Relay Dart VM and compiled-JS replay fixture and requires identical output. |
| `bun run games:native` | Applies generated Android environment and identity guards after native project generation. |
| `bun run games:xcodegen` | Regenerates each iOS project from its checked-in `ios/project.yml`; it does not sign or submit an app. |
| `bun run knip:ci` | Runs pinned Knip analysis with exact, documented exceptions. |

Build commands never submit to stores, distribute externally, spend money, run production migrations, or boot a simulator. `--mode release --environment debug` remains local debug-signed verification. Production builds stop with `NOT RUN` until registration and distribution signing are verified. CI uses a Linux Android debug job and a macOS unsigned iOS job through [`games-build.yml`](../../.github/workflows/games-build.yml).
