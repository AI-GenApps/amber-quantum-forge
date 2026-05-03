---
epic: 06-ios-auth-plugin
task: 04-keychain-storage
status: pending
depends_on:
  - 06-ios-auth-plugin/00
estimate: M
commit_scope: ios-auth
---

# 04 — KeychainHelper for token storage

## Goal
Create a `KeychainHelper` that stores and retrieves `AuthToken` using the iOS Security framework Keychain.

## Context
- Uses `SecItemAdd`, `SecItemCopyMatching`, `SecItemUpdate`, `SecItemDelete` from `Security` framework
- Service name: `app.w3dev.starter.auth`
- Account keys: `accessToken`, `refreshToken`, `tokenExpiresAt`
- Store tokens as separate Keychain items (not one JSON blob) for granular access
- `kSecAttrAccessible`: `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`

## Implementation Checklist
- [ ] Create `plugins/ios/auth/Sources/StarterAuth/Storage/KeychainHelper.swift`:
  - `enum KeychainHelper` (caseless enum as namespace)
  - `static func save(_ token: AuthToken) throws` — saves all three fields
  - `static func load() throws -> AuthToken?` — returns nil if not found
  - `static func delete() throws` — removes all three fields
  - Private `static func set(_ value: String, forKey key: String) throws`
  - Private `static func get(forKey key: String) throws -> String?`
  - Private `static func remove(forKey key: String) throws`
  - Error: `enum KeychainError: Error { case unexpectedStatus(OSStatus) }`
- [ ] `swift package build` succeeds

## Files Touched
- `plugins/ios/auth/Sources/StarterAuth/Storage/KeychainHelper.swift` — create

## Verification
- [ ] `swift package build` exits 0
- [ ] No `Security` import errors
- [ ] `bun run check` exits 0

## Commit
```
feat(ios-auth): add KeychainHelper for secure token storage [06-ios-auth-plugin/04]
```
