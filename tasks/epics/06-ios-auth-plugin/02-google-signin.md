---
epic: 06-ios-auth-plugin
task: 02-google-signin
status: pending
depends_on:
  - 06-ios-auth-plugin/00
estimate: M
commit_scope: ios-auth
---

# 02 — Google Sign-In provider

## Goal
Implement `GoogleSignIn` SDK-based sign-in that returns a Firebase ID token.

## Context
- Flow: `GIDSignIn.sharedInstance.signIn(withPresenting:)` → `GIDGoogleUser` → `OAuthProvider` credential → `Auth.auth().signIn(with:)` → Firebase ID token
- GoogleSignIn SDK is a dependency of `firebase-ios-sdk` package — `import GoogleSignIn` is available
- `CLIENT_ID` must come from `GoogleService-Info.plist` — read via `FirebaseApp.app()?.options.clientID`
- `GoogleAuthProvider` implements the `AuthProvider` protocol

## Implementation Checklist
- [ ] Create `plugins/ios/auth/Sources/StarterAuth/Providers/GoogleAuthProvider.swift`:
  - `public final class GoogleAuthProvider: AuthProvider`
  - `public func signIn() async throws -> String`:
    - Get `clientID` from `FirebaseApp.app()?.options.clientID` — throw `AuthError.invalidResponse` if nil
    - Get root view controller from `UIApplication.shared.connectedScenes`
    - Call `try await GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController)`
    - Build Firebase credential: `GoogleAuthProvider.credential(withIDToken:accessToken:)`
    - Sign in to Firebase: `Auth.auth().signIn(with: credential)`
    - Return `try await user.getIDToken()`
- [ ] `swift package build` succeeds

## Files Touched
- `plugins/ios/auth/Sources/StarterAuth/Providers/GoogleAuthProvider.swift` — create

## Verification
- [ ] `swift package build` exits 0
- [ ] No force unwraps in production paths
- [ ] `bun run check` exits 0

## Commit
```
feat(ios-auth): implement Google Sign-In provider [06-ios-auth-plugin/02]
```
