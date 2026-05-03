---
epic: 07-ios-ai-plugin
task: 00-aicore-module
status: pending
depends_on:
  - 05-ios-scaffold/01
estimate: M
commit_scope: ios-ai
---

# 00 — AICore module: protocol, models, session types

## Goal
Define the public API surface of `StarterAI`: the `AISession` protocol, `AIMessage` model, and supporting types that all AI feature code depends on.

## Context
- Package: `plugins/ios/ai/Sources/StarterAI/`
- No external dependencies — pure Swift
- `AISession` is a protocol so it can be stubbed in tests and replaced by on-device implementation later
- `AIMessage` mirrors the chat message format used by `POST /api/ai/chat`

## Implementation Checklist
- [ ] Remove `plugins/ios/ai/Sources/StarterAI/.gitkeep`
- [ ] Create `plugins/ios/ai/Sources/StarterAI/Core/AIMessage.swift`:
  - `public struct AIMessage: Codable, Identifiable`
  - Fields: `id: UUID`, `role: AIRole`, `content: String`, `createdAt: Date`
  - `public enum AIRole: String, Codable { case user, assistant }`
- [ ] Create `plugins/ios/ai/Sources/StarterAI/Core/AISession.swift`:
  - `public protocol AISession: AnyObject`
  - `var messages: [AIMessage] { get }`
  - `func send(_ text: String) async throws -> AsyncThrowingStream<String, Error>`
  - `func clear()`
- [ ] Create `plugins/ios/ai/Sources/StarterAI/Core/AIError.swift`:
  - `public enum AIError: Error { case networkError(Error), streamParseError, unauthorized, serverError(Int) }`
- [ ] Create `plugins/ios/ai/Sources/StarterAI/Core/RemoteAISession.swift`:
  - `public final class RemoteAISession: AISession`
  - `public init(baseURL: URL, getAccessToken: @escaping () async throws -> String)`
  - Stores `messages` array; `send()` appends user message, calls `AINetworkClient` (task 01), streams tokens, appends assistant message
- [ ] `swift package build` succeeds

## Files Touched
- `plugins/ios/ai/Sources/StarterAI/Core/AIMessage.swift` — create
- `plugins/ios/ai/Sources/StarterAI/Core/AISession.swift` — create
- `plugins/ios/ai/Sources/StarterAI/Core/AIError.swift` — create
- `plugins/ios/ai/Sources/StarterAI/Core/RemoteAISession.swift` — create
- `plugins/ios/ai/Sources/StarterAI/.gitkeep` — delete

## Verification
- [ ] `swift package build` exits 0
- [ ] `bun run check` exits 0

## Commit
```
feat(ios-ai): add AICore module with AIMessage, AISession, RemoteAISession [07-ios-ai-plugin/00]
```
