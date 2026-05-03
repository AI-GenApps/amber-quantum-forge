# AI Architecture

## Overview

Server-side AI chat using Vercel AI SDK + OpenAI. The API streams responses in Vercel data-stream format. Mobile clients parse the stream natively. Chat history is client-owned with periodic server sync.

## Stack

| Layer | Choice |
|---|---|
| AI SDK | `ai` (Vercel AI SDK v4) |
| Model provider | `@ai-sdk/openai` |
| Default model | `gpt-4o-mini` |
| Streaming format | Vercel data-stream (`StreamData` protocol) |
| History storage | Client-side (SwiftData / AsyncStorage) |
| Sync | `POST /api/chat/sync` — client pushes on foreground |

## Chat Endpoint

### `POST /api/ai/chat`

Requires: `Authorization: Bearer <accessToken>`

Request body:
```json
{
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi there!" },
    { "role": "user", "content": "What is 2+2?" }
  ],
  "sessionId": "uuid-optional"
}
```

Response: `text/event-stream` in Vercel data-stream format.

Data-stream chunks:
```
0:"Hello"
0:" there"
0:"!"
d:{"finishReason":"stop","usage":{"promptTokens":10,"completionTokens":5}}
```

- Prefix `0:` = text delta
- Prefix `d:` = finish event with usage

## iOS SSE Parser (~80 LOC)

Located at `plugins/ios/ai/Sources/AINetworking/VercelDataStreamParser.swift`.

Parses line-by-line:
1. Lines starting with `0:` → strip prefix + JSON-decode string → append to buffer
2. Lines starting with `d:` → decode finish metadata → call completion handler
3. Empty lines → ignored

Usage:
```swift
let parser = VercelDataStreamParser()
parser.onToken = { token in /* update UI */ }
parser.onFinish = { usage in /* log usage */ }
parser.parse(line: line)
```

## Chat Sync Endpoint

### `POST /api/chat/sync`

Requires: `Authorization: Bearer <accessToken>`

Request body:
```json
{
  "messages": [
    {
      "id": "client-uuid",
      "sessionId": "session-uuid",
      "role": "user" | "assistant",
      "content": "text",
      "createdAt": "ISO8601"
    }
  ]
}
```

Response:
```json
{ "synced": 12, "skipped": 0 }
```

- Upsert by `id` (client-generated UUID)
- `skipped` = messages already present with same hash

## Database: `chat_messages` table

| column | type | notes |
|---|---|---|
| `id` | uuid PK | client-generated |
| `user_id` | uuid FK → users | |
| `session_id` | uuid | client-generated session grouping |
| `role` | text | `user` \| `assistant` |
| `content` | text | |
| `created_at` | timestamptz | from client |
| `synced_at` | timestamptz | server receive time |

## Client History (Expo / React Native)

Located in `@plugin/expo-chat-module`.

- AsyncStorage key: `chat_sessions` → array of session metadata
- AsyncStorage key: `chat_messages_<sessionId>` → array of messages
- On app foreground (`AppState` change): trigger sync if >0 unsynced messages
- Unsynced flag: messages have `synced: boolean` field in local store

## Client History (iOS / SwiftData)

Located in `plugins/ios/chat-module`.

- `@Model class ChatMessage` — persisted via SwiftData
- `@Model class ChatSession` — groups messages
- On `scenePhase == .active`: `SyncClient.shared.syncPending()`
- Pending = messages where `syncedAt == nil`

## `packages/ai` Package

Scaffold at `packages/ai/src/`:

```
packages/ai/
  src/
    index.ts          # exports: createChatStream, defaultModel
    chat.ts           # streamText wrapper, system prompt injection
    models.ts         # model registry (gpt-4o-mini default, gpt-4o premium)
  package.json        # name: @repo/ai, private: true
  tsconfig.json
```

`createChatStream` signature:
```ts
export async function createChatStream(
  messages: CoreMessage[],
  options?: { model?: string; systemPrompt?: string }
): Promise<ReadableStream>
```

## Environment Variables

| var | required | notes |
|---|---|---|
| `OPENAI_API_KEY` | yes | server-side only, never exposed to client |
| `AI_DEFAULT_MODEL` | no | defaults to `gpt-4o-mini` |
| `AI_SYSTEM_PROMPT` | no | injected as system message if set |
