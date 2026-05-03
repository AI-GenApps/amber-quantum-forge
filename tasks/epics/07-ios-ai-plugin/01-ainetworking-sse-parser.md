---
epic: 07-ios-ai-plugin
task: 01-ainetworking-sse-parser
status: pending
depends_on:
  - 07-ios-ai-plugin/00
estimate: M
commit_scope: ios-ai
---

# 01 — AINetworkClient: streaming HTTP client

## Goal
Implement `AINetworkClient` that opens an SSE connection to `POST /api/ai/chat` and yields raw lines via `AsyncThrowingStream`.

## Context
- Uses `URLSession.bytes(for:)` (iOS 15+) for streaming
- No third-party networking libraries
- Caller (task 02) handles line parsing; this class only handles transport
- Access token injected via closure to avoid coupling to `AuthManager`

## Implementation Checklist
- [ ] Create `plugins/ios/ai/Sources/StarterAI/Networking/AINetworkClient.swift`:
  - `final class AINetworkClient`
  - `init(baseURL: URL, getAccessToken: @escaping () async throws -> String)`
  - `func streamChat(messages: [AIMessage]) -> AsyncThrowingStream<String, Error>`:
    - Build `URLRequest` to `POST /api/ai/chat`
    - Set `Content-Type: application/json`, `Authorization: Bearer <token>`, `Accept: text/event-stream`
    - Body: `{ "messages": [...] }`
    - Use `URLSession.shared.bytes(for: request)` to get `AsyncBytes`
    - Iterate `response.lines` and yield each non-empty line to the stream
    - On HTTP non-2xx status: throw `AIError.serverError(statusCode)`
- [ ] `swift package build` succeeds

## Files Touched
- `plugins/ios/ai/Sources/StarterAI/Networking/AINetworkClient.swift` — create

## Verification
- [ ] `swift package build` exits 0
- [ ] No force unwraps
- [ ] `bun run check` exits 0

## Commit
```
feat(ios-ai): add AINetworkClient streaming URLSession client [07-ios-ai-plugin/01]
```
