---
epic: 11-kmp-shared
task: 00-service-status-example
status: completed
commit_scope: kmp
depends_on: []
---

# Service Status KMP Example

## Context

The repository already exposes an unauthenticated `GET /health` route from the Hono API. This task adds an optional Kotlin Multiplatform shared module and a native Android Compose sample that consume that route. The iOS SwiftUI sample consumes the generated `StarterShared` framework in a separate target.

The existing Expo, Flutter, and `apps-native/ios-app/Starter` targets remain independent.

## Shared API

The common module exposes `ServiceStatus(status: String, timestamp: String)`, `SharedApiClient(baseUrl: String)`, `SharedApiClient.get(path: String): String`, `ServiceStatusRepository(apiClient: SharedApiClient)`, and `ServiceStatusRepository.fetch(): ServiceStatus`.

The iOS framework additionally exposes `ServiceStatusBridge(baseUrl: String)`, `fetch(onSuccess:onFailure:) -> SharedCancellationHandle`, `SharedCancellationHandle.cancel()`, and `ServiceStatusBridge.close()`. The callback facade keeps Ktor, coroutine `Job`, `Flow`, and `Throwable` out of the Swift-facing contract. A blank base URL reports through `onFailure` instead of throwing from the bridge initializer.

## Implementation Checklist

- [x] Add the Gradle wrapper and pinned KMP build configuration.
- [x] Add a serializable `ServiceStatus` model, platform HTTP client, shared API client, and repository.
- [x] Add the iOS callback facade with a cancellable handle and no Ktor types in its public API.
- [x] Add the Android Compose screen, lifecycle-aware ViewModel, loading/error/retry states, and external API URL configuration.
- [x] Add deterministic MockEngine tests for success, route path, malformed JSON, HTTP errors, and cancellation.
- [x] Add KMP usage and iOS framework integration notes.
- [x] Run shared tests and Android compile/build checks without starting a simulator or emulator.
- [x] Validate the SwiftUI sample's generated Xcode target with an iPhoneOS device-SDK build.
- [x] Validate task documentation with the repository doc-path check.
- [x] Resolve the authorized repository-wide Biome, strict TypeScript, and dependency baseline fixes without changing native generated files.
- [x] Re-run repository-wide formatting/lint, typecheck, tests, and changed-scope React Doctor validation.

## Validation Evidence

- `./gradlew :shared:jvmTest --no-daemon --console=plain` — `BUILD SUCCESSFUL`; four repository tests passed.
- `./gradlew :androidApp:assembleDebug -PapiBaseUrl=https://example.invalid/api --no-daemon --console=plain` — `BUILD SUCCESSFUL`; debug APK generated.
- `./gradlew :shared:linkDebugFrameworkIosArm64 --no-daemon --console=plain` — `BUILD SUCCESSFUL`.
- `./gradlew :shared:assembleSharedDebugXCFramework --no-daemon --console=plain` — `BUILD SUCCESSFUL`; `StarterShared.xcframework` generated.
- `xcodebuild -project StarterKMP.xcodeproj -scheme StarterKMP -sdk iphoneos -configuration Debug CODE_SIGNING_ALLOWED=NO build` — `** BUILD SUCCEEDED **`.
- `bun run check:max-lines`, `bun run check:no-middleware`, `bun run check:banned-deps`, and `bun run check:doc-paths` — all exited 0.
- `bun run check` and `bun run check:ci` — Biome formatting and lint checks passed with generated `apps/native/ios` excluded and untouched.
- `bun run typecheck` — all 11 workspace tasks passed.
- `bun run test` — 6 API suites and 25 tests passed with test-only setup values.
- `bunx react-doctor@latest --verbose --scope changed` — 100/100; no issues found.
- `bun run docs:validate` — internal and public documentation validation passed.

## Final Gate

- [x] Pass the repository-wide mandatory checks; the task commit is ready after review.

## Verification

```bash
./gradlew :shared:jvmTest
./gradlew :androidApp:assembleDebug -PapiBaseUrl=https://example.invalid/api
./gradlew :shared:linkDebugFrameworkIosArm64
./gradlew :shared:assembleSharedDebugXCFramework
```

The XCFramework output is `shared/build/XCFrameworks/debug/StarterShared.xcframework`; the iOS sample's XcodeGen prebuild uses the per-configuration framework task for device builds.

For a physical Android device, pass a reachable LAN URL such as `-PapiBaseUrl=http://192.168.1.10:3000/api`; the debug manifest permits cleartext traffic for local development. Release builds leave cleartext traffic disabled and should use HTTPS.

Physical-device launch is a separate gate and requires an attached Android or iOS device.

## Repository Baseline Remediation

The final gate originally exposed pre-existing repository failures. The authorized remediation keeps generated Expo native files local and untouched, preserves Expo's static environment access requirement, removes the obsolete `@types/minimatch` stubs, and narrows existing API/admin values without weakening strict TypeScript or lint rules. All repository-wide gates now pass.
