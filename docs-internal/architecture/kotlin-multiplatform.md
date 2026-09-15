---
title: Kotlin Multiplatform architecture
description: Optional KMP sharing for native mobile features in Starter Expo Mobile
---

# Kotlin Multiplatform architecture

## Decision

Kotlin Multiplatform (KMP) is an optional shared-code layer for native mobile features that benefit from one implementation of networking, serialization, and domain models. It is not a requirement for the Expo app, the Flutter app, or the existing SwiftUI app. Each client keeps an independent build graph and its native UI and lifecycle conventions.

The first example is a small unauthenticated service-status feature. The shared module requests `GET /api/health`; Android Compose and SwiftUI render the same `status` and ISO `timestamp` fields with platform-native loading, error, and retry states.

The surrounding repository is a Turborepo managed with Bun. Root workspace globs include `apps/*`, `packages/*`, and `plugins/expo/*`; native Gradle, Flutter, and Swift package projects remain outside the Bun workspace. The web backend is an `apps/web` Next.js app that mounts the Hono API from `packages/api`, backed by Drizzle ORM in `packages/db`.

The existing SwiftUI target in `apps-native/ios-app` is separate from this sample. Its current scaffold still references a missing `ContentView`, and its Home and Profile views contain TODO content; this sample does not repair or claim to replace that pre-existing work.

## Repository layout

```text
apps-native/
  kmp/
    shared/
      src/commonMain/       # model, API client, repository
      src/androidMain/      # Ktor Android engine
      src/iosMain/          # Swift-facing callback facade
    androidApp/             # Compose sample
  ios-kmp-sample/           # independent XcodeGen SwiftUI consumer
  ios-app/                  # existing independent SwiftUI app
  flutter-app/              # independent Flutter app
apps/native/                # Expo app
plugins/
  expo/*                    # Expo feature packages in the Bun workspace
  flutter/*                 # Flutter feature packages
  ios/*                     # Swift packages, each linked through Package.swift
packages/
  api/                      # Hono routes
  db/                       # Drizzle schema and client
  analytics/                # generated analytics registry
  ui/                       # shared React UI
```

The generated `StarterShared` framework is consumed only by `ios-kmp-sample`. The generated Xcode project is ignored; `project.yml` is the source of truth. The optional route leaves the existing Expo, Flutter, Swift package, and iOS app build graphs unchanged.

The existing cross-client registry generation currently covers design tokens, app-config keys, and analytics events for the established clients. It does not generate KMP API contracts; `ServiceStatus` is intentionally owned by the KMP module until a separately reviewed cross-platform contract is needed.

## Change manifest

The optional example's source-controlled change set is:

```text
.gitignore
tasks/STATUS.md
tasks/epics/11-kmp-shared/STATUS.md
tasks/epics/11-kmp-shared/00-service-status-example.md
apps-native/kmp/build.gradle.kts
apps-native/kmp/gradle.properties
apps-native/kmp/gradle/libs.versions.toml
apps-native/kmp/gradle/wrapper/gradle-wrapper.jar
apps-native/kmp/gradle/wrapper/gradle-wrapper.properties
apps-native/kmp/gradlew
apps-native/kmp/gradlew.bat
apps-native/kmp/settings.gradle.kts
apps-native/kmp/androidApp/build.gradle.kts
apps-native/kmp/androidApp/src/main/AndroidManifest.xml
apps-native/kmp/androidApp/src/main/kotlin/app/w3dev/kmp/MainActivity.kt
apps-native/kmp/androidApp/src/main/kotlin/app/w3dev/kmp/ServiceStatusScreen.kt
apps-native/kmp/androidApp/src/main/kotlin/app/w3dev/kmp/ServiceStatusViewModel.kt
apps-native/kmp/androidApp/src/main/res/values/themes.xml
apps-native/kmp/androidApp/src/debug/AndroidManifest.xml
apps-native/kmp/shared/build.gradle.kts
apps-native/kmp/shared/src/commonMain/kotlin/app/w3dev/shared/health/ServiceStatus.kt
apps-native/kmp/shared/src/commonMain/kotlin/app/w3dev/shared/health/ServiceStatusRepository.kt
apps-native/kmp/shared/src/commonMain/kotlin/app/w3dev/shared/network/PlatformHttpClient.kt
apps-native/kmp/shared/src/commonMain/kotlin/app/w3dev/shared/network/SharedApiClient.kt
apps-native/kmp/shared/src/commonMain/kotlin/app/w3dev/shared/network/SharedApiException.kt
apps-native/kmp/shared/src/androidMain/kotlin/app/w3dev/shared/network/PlatformHttpClient.android.kt
apps-native/kmp/shared/src/iosMain/kotlin/app/w3dev/shared/health/ServiceStatusBridge.kt
apps-native/kmp/shared/src/iosMain/kotlin/app/w3dev/shared/network/PlatformHttpClient.ios.kt
apps-native/kmp/shared/src/jvmMain/kotlin/app/w3dev/shared/network/PlatformHttpClient.jvm.kt
apps-native/kmp/shared/src/commonTest/kotlin/app/w3dev/shared/health/ServiceStatusRepositoryTest.kt
apps-native/ios-kmp-sample/project.yml
apps-native/ios-kmp-sample/StarterKMP/Info.plist
apps-native/ios-kmp-sample/StarterKMP/AppConfig.swift
apps-native/ios-kmp-sample/StarterKMP/HealthRepositoryClient.swift
apps-native/ios-kmp-sample/StarterKMP/HealthViewModel.swift
apps-native/ios-kmp-sample/StarterKMP/ContentView.swift
apps-native/ios-kmp-sample/StarterKMP/StarterKMPApp.swift
docs-internal/architecture/kotlin-multiplatform.md
```

The repository-gate remediation also changes:

```text
biome.json
package.json
bun.lock
apps/web/package.json
apps/web/app/admin/users/actions.ts
packages/api/src/lib/__tests__/jwt.test.ts
packages/api/src/middleware/__tests__/auth.test.ts
packages/api/src/routes/__tests__/ai.test.ts
packages/api/src/routes/__tests__/auth.test.ts
packages/api/src/routes/__tests__/chat.test.ts
packages/api/src/routes/config.ts
packages/api/test/setup.ts
packages/api/vitest.config.ts
packages/db/package.json
packages/ui/package.json
plugins/expo/ai/src/useAIChat.ts
plugins/expo/auth/src/AuthProvider.tsx
plugins/expo/chat-module/src/syncMessages.ts
```

Generated Xcode projects, Gradle build directories, derived data, and the existing user-owned Expo/Vercel/iOS generated files are excluded from this manifest.

## Boundaries

| Responsibility | KMP shared module | Android Compose | iOS SwiftUI | Expo / Flutter |
|---|---|---|---|---|
| Health response model | `ServiceStatus` | reads shared model through ViewModel | maps to `HealthSnapshot` | unchanged native client choices |
| HTTP and JSON | Ktor client, serialization, repository | consumes repository | consumes `ServiceStatusBridge` | unchanged |
| Async cancellation | coroutine `Job` and `SharedCancellationHandle` | `viewModelScope` and job cancellation | handle cancellation on disappearance/background | platform-specific |
| Loading/error/retry UI | no UI | Compose screen | SwiftUI screen | unchanged |
| API base URL | injected string | `BuildConfig.API_BASE_URL` | `Info.plist` build setting | existing Expo/Flutter config |
| Secrets and auth | none in this example | none | none | existing auth architecture |

Shared code stops at the repository and a small iOS callback facade. Navigation, view state presentation, accessibility, design tokens, and lifecycle ownership stay native.

## Shared module design

`apps-native/kmp/shared/src/commonMain` contains:

- `ServiceStatus`, a serializable model with `status` and `timestamp`.
- `SharedApiClient`, which trims the configured base URL and appends relative paths such as `health`.
- `ServiceStatusRepository`, which decodes the response and keeps Ktor out of platform UI code.

The API base URL includes `/api`, so the request is assembled as:

```text
https://host.example/api + /health = https://host.example/api/health
```

The iOS source set exports `ServiceStatusBridge`. Its callback surface is deliberately small:

```text
ServiceStatusBridge(baseUrl: String)
fetch(onSuccess: (ServiceStatus) -> Unit,
      onFailure: (String) -> Unit): SharedCancellationHandle
SharedCancellationHandle.cancel()
ServiceStatusBridge.close()
```

The facade translates coroutine cancellation and expected failures into callbacks without exposing Ktor, `Job`, `Flow`, or `Throwable` to Swift.

## iOS consumer flow

`apps-native/ios-kmp-sample/StarterKMP/HealthRepositoryClient.swift` owns the framework object and cancellation handle. It maps the shared model immediately into the local `Sendable` `HealthSnapshot` value.

`HealthViewModel` is `@MainActor @Observable`. `ContentView` owns it with private `@State`, which preserves the model across SwiftUI redraws. The view model:

1. Cancels any previous handle before starting a request.
2. Increments a request generation so a late callback cannot replace a newer state.
3. Captures itself weakly in the callback and hops to the main actor before mutating observable state.
4. Maps success to `loaded(status, timestamp)` and failures to a user-visible message.
5. Cancels and returns to idle on view disappearance/background transitions, then reloads when the scene becomes active again.

The screen renders a loading card, a success card with both response fields, and an error card with a Retry button. The preview uses a local deterministic fake and never calls the network. Closing on disappearance releases the shared bridge; the next appearance creates a fresh bridge.

## XcodeGen and framework integration

`apps-native/ios-kmp-sample/project.yml` defines the only checked-in Xcode project input. Its target build phase runs:

```bash
cd "$SRCROOT/../kmp"
./gradlew :shared:embedAndSignAppleFrameworkForXcode
```

The target then links and embeds `StarterShared.framework` from the Gradle `xcode-frameworks` output. This is the standard direct Objective-C framework integration generated by the KMP Gradle plugin; no CocoaPods or Swift package wrapper is added.

The build setting `API_BASE_URL` is substituted into `Info.plist`. Debug defaults to `http://127.0.0.1:3000/api`; a physical-device build can override it with a reachable LAN URL ending in `/api`. Release defaults to an HTTPS placeholder and rejects a non-HTTPS URL at startup. No API key or other secret is packaged.

## Commands

Build and test the shared module first:

```bash
cd apps-native/kmp
./gradlew :shared:jvmTest
./gradlew :shared:assembleSharedDebugXCFramework
./gradlew :androidApp:assembleDebug -PapiBaseUrl=https://api.example.invalid/api
```

Generate and compile the iOS sample for a generic physical-device SDK without signing:

```bash
cd apps-native/ios-kmp-sample
xcodegen generate
xcodebuild -project StarterKMP.xcodeproj \
  -scheme StarterKMP \
  -configuration Debug \
  -sdk iphoneos \
  CODE_SIGNING_ALLOWED=NO build
```

For a LAN API during a Debug build, use `-PapiBaseUrl=http://192.168.1.20:3000/api` for Android or add `API_BASE_URL=http://192.168.1.20:3000/api` to the iOS `xcodebuild` command. Runtime verification requires an attached physical device and a reachable API. These examples do not use a simulator or emulator.

The repository-wide Bun checks now pass after the final-gate remediation:

```bash
bun run check
bun run check:ci
bun run typecheck
bun run test
```

The API tests receive test-only environment setup from `packages/api/test/setup.ts`; production secrets remain external to the repository. These checks do not validate Swift or KMP code. Use the focused Gradle and `xcodebuild` commands above for this sample. A successful generic-device build is not an install or runtime response check.

## Incremental adoption

Adopt KMP one vertical slice at a time:

1. Choose a feature whose domain rules and transport behavior are duplicated across Android and iOS.
2. Define a serializable shared model and a repository interface in `commonMain`.
3. Add platform HTTP engines in `androidMain` and `iosMain`.
4. Expose a narrow callback or async facade for each native platform.
5. Keep each platform's ViewModel, UI, navigation, accessibility, and lifecycle ownership native.
6. Add deterministic shared tests before adding another feature.
7. Remove shared code only when its platform-specific behavior outweighs the duplication cost.

Do not make the Expo or Flutter bridge depend on KMP just to reach parity with a native proof of concept. A later bridge can consume a separately packaged shared library if there is a concrete product need and a supported build pipeline.

## Risks and trade-offs

- Kotlin/Native framework generation adds a Gradle toolchain and a build-time cross-language boundary to the iOS target.
- Exported Kotlin types can be less idiomatic in Swift; the callback facade limits that surface but must be maintained.
- Ktor engine behavior, coroutine cancellation, and error mapping need tests on each platform.
- Shared transport code can overreach into UI concerns; keep platform state and presentation outside `commonMain`.
- Framework cache and Xcode build-setting mismatches can make clean builds slower or fail before Swift compilation.
- The sample has no authentication, persistence, analytics, or production API host; those concerns remain in the existing architecture until separately adopted.

## Validation status

The architecture is implemented as an isolated KMP shared module, Android Compose example, and SwiftUI XcodeGen consumer. The focused shared JVM test and Android compilation are the appropriate sibling-module gates, and the repository-wide Bun check, typecheck, and API test gates pass. The iOS source is wired to the exported `ServiceStatusBridge` contract; XcodeGen can generate the project and a generic iOS-device build can compile it with signing disabled. A full signed install and on-device API response require an attached physical iOS device and a reachable environment; those are not implied by source inspection alone.

## Official Kotlin references

- [Kotlin Multiplatform overview](https://kotlinlang.org/docs/multiplatform/kmp-overview.html) explains sharing business logic while retaining native UI and supporting gradual adoption.
- [Recommended KMP project structure](https://kotlinlang.org/docs/multiplatform/multiplatform-project-recommended-structure.html) describes separating shared logic from optional shared UI when targets use native interfaces.
- [Kotlin/Native as an Apple framework](https://kotlinlang.org/docs/apple-framework.html) documents producing a framework and consuming it from Swift/Objective-C applications.
- [Swift/Objective-C interoperability](https://kotlinlang.org/docs/native-objc-interop.html) documents the Objective-C-compatible export boundary used by `StarterShared`.
