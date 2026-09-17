# Five-game Flutter workspace

This directory contains five independent Flutter applications and pure Dart game packages. It is a scoped Pub workspace and is separate from the existing `apps-native/flutter-app` starter.

## Layout

```text
apps-native/games/
  merge_relay/
  pocket_biome/
  sixty_second_heist/
  meme_court/
  snapquest/
  packages/
    platform_core/
    merge_rules/
    biome_rules/
    heist_rules/
    court_rules/
    snapquest_rules/
```

The registry at `scripts/games/registry.ts` is the source of identity, source references, build targets, capabilities, and release metadata. Clients must keep their own Flutter native projects and platform configuration.

## Toolchain

The pinned toolchain is in `toolchain.json`: Flutter 3.47.3, Dart 3.13.3, Flame 1.38.2, and the repository Bun version 1.3.3. Dart is bundled by Flutter; the standalone Dart value is a diagnostic check.

## Commands

Run these from the repository root:

```bash
bun run games:bootstrap
bun run games:doctor
bun run games:list
bun run games:format
bun run games:analyze
bun run games:test
bun run games:validate
bun run games:content:validate
bun run games:affected -- --base origin/main --format=json
bun run games:run -- --app merge_relay --device-id <physical-device-id>
bun run games:build -- --app merge_relay --platform android --mode debug --environment debug
bun run games:build -- --app merge_relay --platform ios --mode unsigned --environment debug
bun run games:generate -- --id generated_sixth --title "Generated Sixth" --output <new-directory>
```

`games:build` accepts `--platform ios --mode unsigned` for a generic unsigned iOS build on macOS. It never boots a simulator. Signed device and distribution verification are separate release gates.

The `debug` environment uses the `.debug` native ID and environment-scoped save/analytics namespaces. `staging` and `production` use the finalized production ID and their own namespaces; a build mode does not silently select an environment. Use `bun run games:config -- --environment <debug|staging|production>` to regenerate the checked-in runtime config intentionally.
