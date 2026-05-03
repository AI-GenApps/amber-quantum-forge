---
epic: 06-ios-auth-plugin
task: 00-package-skeleton
status: pending
depends_on:
  - 05-ios-scaffold/01
estimate: S
commit_scope: ios-auth
---

# 00 — StarterAuth package skeleton

## Goal
Establish the full folder and file skeleton for `plugins/ios/auth/` so subsequent tasks have clear locations.

## Context
- Package name: `StarterAuth` (already in `Package.swift` from epic 05/01)
- Sources: `plugins/ios/auth/Sources/StarterAuth/`
- Public API surface:
  - `AuthManager` — main entry point (singleton `shared`)
  - `AuthToken` — value type holding `accessToken`, `refreshToken`, `expiresAt`
  - `AuthError` — error enum
  - `AuthProvider` (protocol) — implemented by `AppleAuthProvider` and `GoogleAuthProvider`

## Implementation Checklist
- [ ] Create `plugins/ios/auth/Sources/StarterAuth/AuthManager.swift` — empty `public actor AuthManager` with `static let shared = AuthManager()`
- [ ] Create `plugins/ios/auth/Sources/StarterAuth/AuthToken.swift` — `public struct AuthToken: Codable` with fields: `accessToken: String`, `refreshToken: String`, `expiresAt: Date`
- [ ] Create `plugins/ios/auth/Sources/StarterAuth/AuthError.swift` — `public enum AuthError: Error` with cases: `firebaseError(Error)`, `networkError(Error)`, `invalidResponse`, `tokenExpired`, `notSignedIn`
- [ ] Create `plugins/ios/auth/Sources/StarterAuth/AuthProvider.swift` — `public protocol AuthProvider` with `func signIn() async throws -> String` (returns Firebase ID token)
- [ ] Remove `plugins/ios/auth/Sources/StarterAuth/.gitkeep`
- [ ] `swift package build` succeeds

## Files Touched
- `plugins/ios/auth/Sources/StarterAuth/AuthManager.swift` — create
- `plugins/ios/auth/Sources/StarterAuth/AuthToken.swift` — create
- `plugins/ios/auth/Sources/StarterAuth/AuthError.swift` — create
- `plugins/ios/auth/Sources/StarterAuth/AuthProvider.swift` — create
- `plugins/ios/auth/Sources/StarterAuth/.gitkeep` — delete

## Verification
- [ ] `swift package build` in `plugins/ios/auth/` exits 0
- [ ] `bun run check` exits 0

## Commit
```
feat(ios-auth): add StarterAuth package skeleton [06-ios-auth-plugin/00]
```
