---
epic: 08-ios-chat-module
task: 02-streaming-binding
status: pending
depends_on:
  - 08-ios-chat-module/01
  - 07-ios-ai-plugin/02
estimate: M
commit_scope: ios-chat
---

# 02 — ChatViewModel: streaming binding to SwiftUI

## Goal
Implement `ChatViewModel` as an `@Observable` class that drives `ChatView`, streaming assistant tokens into the UI in real time.

## Context
- `@Observable` macro (iOS 17) replaces `ObservableObject`
- Streaming: `RemoteAISession.send()` returns `AsyncThrowingStream<String, Error>`; tokens appended character-by-character to the current assistant `AIMessage`
- While streaming, a placeholder `AIMessage(role: .assistant, content: "")` is added to `messages` first; tokens append to its `content` in place
- `ChatStore` persists each message after the stream completes
- `getAccessToken` closure injected at init so `ChatViewModel` doesn't import `StarterAuth`

## Implementation Checklist
- [ ] Create `plugins/ios/chat-module/Sources/StarterChat/ViewModels/ChatViewModel.swift`:
  - `@Observable public final class ChatViewModel`
  - `public var messages: [AIMessage] = []`
  - `public var isStreaming: Bool = false`
  - `public var error: AIError? = nil`
  - `private let session: any AISession`
  - `private let store: ChatStore`
  - `private let modelContext: ModelContext`
  - `public init(session: any AISession, store: ChatStore, modelContext: ModelContext)`
  - `@MainActor public func send(_ text: String) async`:
    1. Append user `AIMessage` to `messages`
    2. Persist user message via `store.insert`
    3. Append empty assistant `AIMessage` placeholder
    4. Set `isStreaming = true`
    5. `for try await token in try await session.send(text)` → append token to last message `content`
    6. Set `isStreaming = false`
    7. Persist completed assistant message via `store.insert`
    8. On error: set `self.error`, remove placeholder, set `isStreaming = false`
- [ ] `swift package build` succeeds

## Files Touched
- `plugins/ios/chat-module/Sources/StarterChat/ViewModels/ChatViewModel.swift` — create

## Verification
- [ ] `swift package build` exits 0
- [ ] `@Observable` compiled without warnings
- [ ] `bun run check` exits 0

## Commit
```
feat(ios-chat): add ChatViewModel with streaming token binding [08-ios-chat-module/02]
```
