---
epic: 06-ios-auth-plugin
task: 03-exchange-flow
status: pending
depends_on:
  - 06-ios-auth-plugin/01
  - 06-ios-auth-plugin/02
  - 06-ios-auth-plugin/04
estimate: M
commit_scope: ios-auth
---

# 03 — Exchange flow: Firebase token → API JWT

## Goal
Implement `AuthManager.signIn(with:)` that calls `POST /api/auth/exchange`, decodes the response, and stores tokens via `KeychainHelper`.

## Context
- Endpoint: `POST /api/auth/exchange` with body `{ "idToken": "<firebase-id-token>" }`
- Response: `{ "accessToken": "...", "refreshToken": "...", "expiresIn": 21600 }`
- `AuthManager` is an `actor` — all state mutation is actor-isolated
- `KeychainHelper` is built in task 04 — this task depends on it
- Base URL configured via `AuthManager.configure(baseURL:)` — must be called at app startup before `signIn`

## Implementation Checklist
- [ ] Add to `AuthManager.swift`:
  - `private var baseURL: URL?`
  - `private var currentToken: AuthToken?`
  - `public func configure(baseURL: URL)`
  - `public func signIn(with provider: AuthProvider) async throws -> AuthToken`:
    1. Call `provider.signIn()` to get Firebase ID token
    2. Call internal `exchange(idToken:)` → returns `AuthToken`
    3. Store in Keychain via `KeychainHelper.save(_:)`
    4. Set `currentToken`
    5. Return `AuthToken`
  - `public func currentAccessToken() async throws -> String` — returns `currentToken?.accessToken`, throws `AuthError.notSignedIn` if nil
  - `private func exchange(idToken: String) async throws -> AuthToken` — URLSession POST to `/api/auth/exchange`
- [ ] Create `plugins/ios/auth/Sources/StarterAuth/Network/ExchangeResponse.swift`:
  - `struct ExchangeResponse: Decodable { let accessToken: String; let refreshToken: String; let expiresIn: Int }`
- [ ] `swift package build` succeeds

## Files Touched
- `plugins/ios/auth/Sources/StarterAuth/AuthManager.swift` — update
- `plugins/ios/auth/Sources/StarterAuth/Network/ExchangeResponse.swift` — create

## Verification
- [ ] `swift package build` exits 0
- [ ] `AuthManager` has no data races (Swift concurrency strict mode)
- [ ] `bun run check` exits 0

## Commit
```
feat(ios-auth): implement exchange flow in AuthManager [06-ios-auth-plugin/03]
```
