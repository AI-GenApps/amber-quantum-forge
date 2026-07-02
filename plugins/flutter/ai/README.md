# starter_ai

Dart package providing AI chat session management for the Flutter app.
Mirrors `plugins/ios/ai` (`StarterAI`).

## Overview

`starter_ai` exposes an `AISession` abstraction with two implementations:

- `RemoteAISession` — streams tokens from `POST /api/ai/chat` using the
  Vercel AI SDK data-stream format, parsed by `VercelDataStreamParser`
  (a direct port of `VercelDataStreamParser.swift`).
- `OnDeviceAISession` — stub that errors with a 501-equivalent; reserved for
  a future on-device model integration.

## Usage

```dart
final AISession session = RemoteAISession(
  baseUrl: Uri.parse('https://api.example.com'),
  getAccessToken: () => AuthManager.instance.currentAccessToken(),
);

await for (final token in session.send('Hello!')) {
  stdout.write(token);
}
```
