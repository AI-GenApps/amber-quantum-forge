---
epic: 06-ios-auth-plugin
task: 05-refresh-interceptor
status: pending
depends_on:
  - 06-ios-auth-plugin/03
  - 06-ios-auth-plugin/04
estimate: L
commit_scope: ios-auth
---

# 05 — Token refresh interceptor

## Goal
Implement automatic token refresh in `AuthManager` so callers never handle 401s manually. Also add `POST /api/auth/revoke` support.

## Context
- `AuthManager.request(_:)` wraps URLSession with retry logic:
  1. Attach `Authorization: Bearer <accessToken>` header
  2. If response is 401: call `refresh()` → retry once
  3. If refresh fails: throw `AuthError.tokenExpired` (user must re-authenticate)
- `refresh()` calls `POST /api/auth/refresh` with current `refreshToken`
- Concurrent refresh protection: use an `AsyncStream` continuation or `Task` deduplication so multiple simultaneous 401s only trigger one refresh
- `revoke()` calls `POST /api/auth/revoke`, then clears Keychain

## Implementation Checklist
- [ ] Add to `AuthManager.swift`:
  - `private var refreshTask: Task<AuthToken, Error>?` — deduplication handle
  - `public func request(_ urlRequest: URLRequest) async throws -> (Data, URLResponse)`:
    - Inject Bearer token
    - Execute request
    - On 401: await `refreshIfNeeded()`, retry once
  - `private func refreshIfNeeded() async throws -> AuthToken`:
    - If `refreshTask` exists, await it
    - Else create new `Task { try await self.refresh() }`, assign to `refreshTask`, await, clear `refreshTask`
  - `private func refresh() async throws -> AuthToken`:
    - POST `/api/auth/refresh` with `{ refreshToken }`
    - Decode `ExchangeResponse`
    - Build new `AuthToken`, save to Keychain, update `currentToken`
  - `public func signOut() async throws`:
    - POST `/api/auth/revoke` (best-effort, don't throw if fails)
    - `KeychainHelper.delete()`
    - `currentToken = nil`
- [ ] Create `plugins/ios/auth/Sources/StarterAuth/Network/RefreshResponse.swift` (same shape as `ExchangeResponse` — can be a typealias)
- [ ] `swift package build` succeeds

## Files Touched
- `plugins/ios/auth/Sources/StarterAuth/AuthManager.swift` — update
- `plugins/ios/auth/Sources/StarterAuth/Network/RefreshResponse.swift` — create

## Verification
- [ ] `swift package build` exits 0
- [ ] Concurrent refresh calls deduplicated (only one network call for simultaneous 401s)
- [ ] `AuthManager` passes Swift strict concurrency checks
- [ ] `bun run check` exits 0

## Commit
```
feat(ios-auth): add token refresh interceptor and signOut [06-ios-auth-plugin/05]
```
