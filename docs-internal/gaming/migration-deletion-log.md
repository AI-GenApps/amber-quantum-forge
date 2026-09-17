# Migration and deletion log

All changes below are recoverable from the branch base `523404d157b76268616ae707b5958d3adb733cd8`. No active app, migration, license, release provider, OTA path, or production data was deleted.

| Path/component | Evidence and checks | Replacement or result |
|---|---|---|
| `apps/native/package.json`: `@expo/vector-icons`, `@repo/analytics`, `@repo/ui`, `react-native-purchases-ui`, `whatwg-fetch`, `@types/react-test-renderer`, `react-test-renderer` | Knip reported them unused. Repository-wide `rg` found no imports or scripts. `bunx expo config --json` succeeded, `bunx expo-modules-autolinking resolve --json` returned 36 active native modules with none of the removed packages, and `EXPO_NO_DOCTOR=1 bunx expo export --platform web --output-dir <temporary-directory>` bundled 1,303 modules. RevenueCat/auth/OTA packages were retained. | Removed from the Expo manifest; no replacement was needed. |
| `apps/web/package.json`, `packages/api/package.json`: direct `drizzle-orm` | No direct imports or scripts; database access remains through `@repo/db`. `rg`, Knip, typecheck, API tests, and the existing build graph were checked. | Removed direct duplicates; `packages/db` remains the owner. |
| `packages/api/package.json`: `tsx` | No script or source consumer. Knip and manifest script inspection confirmed no runtime/deploy use. | Removed. |
| `packages/ui/package.json`: `minimatch` | No import or build consumer. Knip and repository search confirmed no dynamic use. | Removed. |

The following exact Knip exceptions remain because static import analysis cannot see their real consumers: Expo/Babel configuration uses `@babel/core`, Secretlint invokes its preset, Expo type resolution uses `@types/react-native`, the existing `native` workspace identity is selected by configuration, and `shadcn`, `eas`, and `flutter` are command/config consumers. These are exact entries in [`knip.json`](../../knip.json), not package-wide or workspace-wide ignores.

The three `packages/api/src/games/*` issue entries are deliberate public contract boundaries. The mounted `/games` routes and focused tests are the current real consumers of the implementation. The exported contracts and validators define the explicitly reserved app-scoped API surface; no downstream service consumer is claimed until one is implemented and tested. They remain in the API surface and are reviewed with the API isolation task rather than removed to make Knip quiet.

Before/after gates are `bun install --frozen-lockfile`, `bun run knip:ci`, `bun run check:ci`, `bun run typecheck`, `bun run test`, and `bun run build`. The preserved Expo app also passed `EXPO_NO_DOCTOR=1 bunx expo export --platform web --output-dir <temporary-directory>` after the removals; Metro bundled 1,303 modules and produced the web export. A future removal must add static, dynamic, build, and deployment evidence here before it is staged. Ambiguous components remain in place for review.
