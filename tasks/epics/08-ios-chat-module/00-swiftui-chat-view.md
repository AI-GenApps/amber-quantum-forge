---
epic: 08-ios-chat-module
task: 00-swiftui-chat-view
status: pending
depends_on:
  - 05-ios-scaffold/01
  - 07-ios-ai-plugin/00
estimate: L
commit_scope: ios-chat
---

# 00 — SwiftUI chat view components

## Goal
Build `ChatView`, `MessageBubble`, and `ChatInput` — the complete SwiftUI chat interface for `StarterChat`.

## Context
- Package: `plugins/ios/chat-module/Sources/StarterChat/`
- `ChatView` is the top-level screen; exported as public API
- `MessageBubble` renders a single message (user = right-aligned, assistant = left-aligned)
- `ChatInput` is a bottom-anchored text input bar with send button
- Streaming: current assistant message is shown token-by-token as it arrives
- Uses `StarterAI` types (`AIMessage`, `AIRole`) — package dependency is already declared

## Implementation Checklist
- [ ] Remove `plugins/ios/chat-module/Sources/StarterChat/.gitkeep`
- [ ] Create `plugins/ios/chat-module/Sources/StarterChat/Views/ChatView.swift`:
  - `public struct ChatView: View`
  - `@ObservedObject var viewModel: ChatViewModel` (built in task 02)
  - `ScrollViewReader` + `ScrollView` listing messages with `MessageBubble`
  - Auto-scroll to bottom on new messages
  - `ChatInput` pinned to bottom
  - Pass `onSend: { text in await viewModel.send(text) }` to `ChatInput`
- [ ] Create `plugins/ios/chat-module/Sources/StarterChat/Views/MessageBubble.swift`:
  - `struct MessageBubble: View`
  - `let message: AIMessage`
  - User messages: right-aligned, accent background, white text
  - Assistant messages: left-aligned, secondary background, primary text
  - Show typing indicator (three dots) when `message.content.isEmpty && message.role == .assistant`
- [ ] Create `plugins/ios/chat-module/Sources/StarterChat/Views/ChatInput.swift`:
  - `struct ChatInput: View`
  - `@State private var text: String = ""`
  - `let onSend: (String) async -> Void`
  - `TextField` + send `Button` (disabled when `text.isEmpty` or `isSending`)
  - `@State private var isSending = false` — prevents double-send
- [ ] `swift package build` succeeds

## Files Touched
- `plugins/ios/chat-module/Sources/StarterChat/Views/ChatView.swift` — create
- `plugins/ios/chat-module/Sources/StarterChat/Views/MessageBubble.swift` — create
- `plugins/ios/chat-module/Sources/StarterChat/Views/ChatInput.swift` — create
- `plugins/ios/chat-module/Sources/StarterChat/.gitkeep` — delete

## Verification
- [ ] `swift package build` exits 0
- [ ] SwiftUI Previews compile for `MessageBubble` and `ChatInput`
- [ ] No file exceeds 300 lines
- [ ] `bun run check` exits 0

## Commit
```
feat(ios-chat): add ChatView, MessageBubble, ChatInput SwiftUI components [08-ios-chat-module/00]
```
