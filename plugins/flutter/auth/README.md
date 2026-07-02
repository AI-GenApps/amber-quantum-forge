# starter_auth

Dart package providing two-stage Firebase + API JWT auth for the Flutter app.
Mirrors `plugins/ios/auth` (`StarterAuth`) — see `docs/architecture/auth.md`
for the wire contract.

## Overview

- `AuthManager.instance` — process-wide singleton driving sign-in, token
  storage, authenticated requests, and single-flight refresh-on-401.
- `GoogleAuthProvider` / `AppleAuthProvider` — platform sign-in flows that
  resolve to a Firebase ID token.
- `TokenStorage` — `flutter_secure_storage`-backed persistence (Keychain on
  iOS, EncryptedSharedPreferences on Android).

## Usage

```dart
AuthManager.instance.configure(baseUrl: Uri.parse('https://api.example.com'));
await AuthManager.instance.restoreSession();

final token = await AuthManager.instance.signIn(GoogleAuthProvider());

final response = await AuthManager.instance.authorizedFetch(
  Uri.parse('https://api.example.com/api/auth/me'),
);

await AuthManager.instance.signOut();
```

`authorizedFetch` retries once on a `401` via a single-flight
`POST /api/auth/refresh`, matching the Swift `refreshTask` actor guard.
