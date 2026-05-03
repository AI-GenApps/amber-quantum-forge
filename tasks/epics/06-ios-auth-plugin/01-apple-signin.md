---
epic: 06-ios-auth-plugin
task: 01-apple-signin
status: pending
depends_on:
  - 06-ios-auth-plugin/00
estimate: M
commit_scope: ios-auth
---

# 01 — Apple Sign-In provider

## Goal
Implement `ASAuthorizationAppleIDProvider`-based sign-in that returns a Firebase ID token.

## Context
- Flow: `ASAuthorizationAppleIDRequest` → get Apple credential → `OAuthProvider.credential(withProviderID: "apple.com", ...)` → `Auth.auth().signIn(with:)` → get Firebase ID token
- `nonce` generation: SHA256 of random string, sent raw to Apple and hashed to Firebase
- Requires `import AuthenticationServices`, `import FirebaseAuth`
- `AppleAuthProvider` implements the `AuthProvider` protocol from task 00
- Must be called from `@MainActor` context (UI presentation)

## Implementation Checklist
- [ ] Create `plugins/ios/auth/Sources/StarterAuth/Providers/AppleAuthProvider.swift`:
  - `public final class AppleAuthProvider: NSObject, AuthProvider, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding`
  - `private var continuation: CheckedContinuation<String, Error>?`
  - `public func signIn() async throws -> String` — creates nonce, presents `ASAuthorizationController`, awaits continuation
  - Delegate method `authorizationController(controller:didCompleteWithAuthorization:)` → sign in to Firebase → call `user.getIDToken()` → resume continuation
  - Delegate method `authorizationController(controller:didCompleteWithError:)` → resume with `AuthError.firebaseError(error)`
  - `presentationAnchor` returns `UIApplication.shared.connectedScenes` key window
- [ ] Create `plugins/ios/auth/Sources/StarterAuth/Utils/CryptoUtils.swift`:
  - `func randomNonceString(length: Int = 32) -> String`
  - `func sha256(_ input: String) -> String` using `CryptoKit`
- [ ] `swift package build` succeeds

## Files Touched
- `plugins/ios/auth/Sources/StarterAuth/Providers/AppleAuthProvider.swift` — create
- `plugins/ios/auth/Sources/StarterAuth/Utils/CryptoUtils.swift` — create

## Verification
- [ ] `swift package build` exits 0
- [ ] No force unwraps in production paths
- [ ] `bun run check` exits 0

## Commit
```
feat(ios-auth): implement Apple Sign-In provider [06-ios-auth-plugin/01]
```
