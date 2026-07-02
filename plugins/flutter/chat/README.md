# starter_chat

Dart package providing chat UI, local persistence, and sync for the Flutter
app. Mirrors `plugins/ios/chat-module` (`StarterChat`). Depends on
`starter_auth` (authenticated requests) and `starter_ai` (streaming) via
path references.

## Overview

- `ChatView` / `ChatInput` / `MessageBubble` / `TypingIndicator` — chat UI
  widgets mirroring the SwiftUI views.
- `ChatViewModel` — drives a single chat turn against an `AISession`,
  mirroring streamed content into `messages` and persisting via `ChatStore`.
- `ChatStore` — local persistence backed by `drift` (SwiftData analog),
  storing `ChatSession`/`ChatMessage` rows.
- `SyncClient` — pushes not-yet-synced messages to `POST /api/chat/sync`.

## Codegen

`ChatStore` uses `drift`, which requires generated code. After editing
`lib/src/store/chat_store.dart`, run:

```bash
cd plugins/flutter/chat
dart run build_runner build --delete-conflicting-outputs
```

This produces `lib/src/store/chat_store.g.dart` (not committed by default —
add it to version control once generated, matching how iOS commits its
codegen output).
