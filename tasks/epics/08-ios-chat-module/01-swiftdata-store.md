---
epic: 08-ios-chat-module
task: 01-swiftdata-store
status: pending
depends_on:
  - 08-ios-chat-module/00
estimate: M
commit_scope: ios-chat
---

# 01 — SwiftData models for chat persistence

## Goal
Define `@Model` classes for `ChatMessage` and `ChatSession` using SwiftData, and set up the `ModelContainer` for use across the app.

## Context
- SwiftData requires iOS 17+
- `ChatMessage` maps to `AIMessage` but adds persistence fields (`syncedAt`)
- `ChatSession` groups messages; has a UUID stable across launches
- `ModelContainer` created once in `StarterApp` and passed via `.modelContainer()` modifier
- `StarterChat` package targets iOS 17 — ensure `Package.swift` sets `platforms: [.iOS(.v17)]`

## Implementation Checklist
- [ ] Create `plugins/ios/chat-module/Sources/StarterChat/Models/ChatMessage.swift`:
  - `@Model public final class ChatMessage`
  - Fields: `id: UUID`, `sessionId: UUID`, `role: String` (raw `AIRole`), `content: String`, `createdAt: Date`, `syncedAt: Date?`
  - Convenience init from `AIMessage`
- [ ] Create `plugins/ios/chat-module/Sources/StarterChat/Models/ChatSession.swift`:
  - `@Model public final class ChatSession`
  - Fields: `id: UUID`, `title: String`, `createdAt: Date`, `updatedAt: Date`
  - Computed: `var messages: [ChatMessage]` via `@Relationship`
- [ ] Create `plugins/ios/chat-module/Sources/StarterChat/Store/ChatStore.swift`:
  - `public final class ChatStore` (not an actor — SwiftData context is `@MainActor`)
  - `@MainActor public static func makeContainer() throws -> ModelContainer` — returns container with `ChatMessage` and `ChatSession` schemas
  - `@MainActor public func sessions(context: ModelContext) throws -> [ChatSession]`
  - `@MainActor public func messages(for sessionId: UUID, context: ModelContext) throws -> [ChatMessage]`
  - `@MainActor public func insert(_ message: ChatMessage, context: ModelContext)`
- [ ] Update `plugins/ios/chat-module/Package.swift` to set `platforms: [.iOS(.v17)]`
- [ ] `swift package build` succeeds

## Files Touched
- `plugins/ios/chat-module/Sources/StarterChat/Models/ChatMessage.swift` — create
- `plugins/ios/chat-module/Sources/StarterChat/Models/ChatSession.swift` — create
- `plugins/ios/chat-module/Sources/StarterChat/Store/ChatStore.swift` — create
- `plugins/ios/chat-module/Package.swift` — update platforms

## Verification
- [ ] `swift package build` exits 0
- [ ] `bun run check` exits 0

## Commit
```
feat(ios-chat): add SwiftData models ChatMessage, ChatSession and ChatStore [08-ios-chat-module/01]
```
