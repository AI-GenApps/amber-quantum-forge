# Repository audit and dependency map

The gaming preparation branch starts from `523404d157b76268616ae707b5958d3adb733cd8`, which already contains the hosted-runner workflow update. The original checkout and its concurrent edits remain separate. Existing products stay in their current graphs:

The source checkout also had concurrent edits to the existing preview, CI, AI, iOS-auth, and Turbo configuration files while this worktree was created. They were intentionally not copied into this branch. The full-repository actionlint baseline therefore remains separate from the passing gaming workflow actionlint check; the original checkout contains the corresponding preview workflow fix for its baseline review.

| Surface | Existing boundary | Preparation decision |
|---|---|---|
| Expo client | `apps/native` | Preserve Expo, native modules, auth, RevenueCat, analytics, and OTA tooling. |
| SwiftUI client | `apps-native/ios-app` | Preserve XcodeGen source and unsigned build path. |
| Flutter starter | `apps-native/flutter-app` | Preserve its independent dependency graph and lockfile. |
| API and web | `packages/api`, `apps/web` | Preserve legacy routes; game API isolation is a separate owner scope. |
| Database | `packages/db` | No gaming production migration is included. |
| JS workspace | Bun + Turborepo | Extend the existing scripts and lockfile; do not replace Bun with Pub. |
| Game clients | `apps-native/games/*` | Add five independent Flutter projects in a scoped Pub workspace. |
| Game rules and shared contracts | `apps-native/games/packages/*` | Keep pure Dart packages free of Flutter, Flame, and device SDKs. |

The new workspace has 11 explicit members: five clients, six packages, and one root `apps-native/games/pubspec.lock`. The root Pub lockfile resolves the workspace; member lockfiles are not retained. The existing root `bun.lock` continues to resolve JavaScript/TypeScript packages.

Shared consumers are real: Merge Relay, Pocket Biome, and Sixty-Second Heist clients compose `platform_core` for save identity, deterministic context, and telemetry, while their rules packages also use the pure contracts. Meme Court and SnapQuest depend only on their own rule packages. Flame is present only where a game loop/rendering surface needs it; Meme Court has no Flame dependency. SnapQuest owns the only camera SDK and camera permission; its capability still falls back to the desk path when hardware or recognition is unavailable.

Baseline evidence captured before the new game work:

- `bun run check:ci`, `bun run typecheck`, and `bun run test` passed at the repository baseline. `bun run build` reached the existing web production build and stopped during page-data collection because `packages/ai/src/model.ts` requires `OPENAI_API_KEY`; this is a pre-existing environment gate, not a gaming regression.
- Existing Flutter starter analysis/tests passed. Existing Flutter plugin auth/AI/chat checks retained pre-existing failures.
- Existing iOS XcodeGen generation passed; the five new unsigned iOS game builds and five Linux Android debug APK builds passed after the native identity guard was generated. No simulator or emulator was booted.

The additive gaming checks are recorded in [`verification.md`](verification.md). Knip removals and retained findings are recorded in [`migration-deletion-log.md`](migration-deletion-log.md). A shared or ambiguous dependency change causes the gaming affected detector to select the full five-app matrix.
