---
epic: 08-ios-chat-module
task: 03-sync-client
status: pending
depends_on:
  - 08-ios-chat-module/01
  - 06-ios-auth-plugin/05
estimate: M
commit_scope: ios-chat
---

# 03 — Chat sync client

## Goal
Implement `SyncClient` that pushes unsynced `ChatMessage` records to `POST /api/chat/sync` when the app enters the foreground.

## Context
- Endpoint: `POST /api/chat/sync` with body `{ messages: [...] }`
- Unsynced = `ChatMessage` where `syncedAt == nil`
- After successful sync: update `syncedAt` on all sent messages
- Triggered from `StarterApp` on `scenePhase == .active`
- `SyncClient` uses `AuthManager.request(_:)` for automatic token refresh

## Implementation Checklist
- [ ] Create `plugins/ios/chat-module/Sources/StarterChat/Sync/SyncClient.swift`:
  - `public actor SyncClient`
  - `public init(baseURL: URL, authManager: AuthManager, modelContext: ModelContext)`
  - `public func syncPending() async throws`:
    1. Fetch all `ChatMessage` where `syncedAt == nil` via `ModelContext`
    2. If empty: return early
    3. Build `SyncRequest` with message array
    4. Call `authManager.request(urlRequest)` — auto-refreshes token
    5. Decode `SyncResponse { synced: Int; skipped: Int }`
    6. Update `syncedAt = Date()` on all sent messages
    7. Save context
- [ ] Create `plugins/ios/chat-module/Sources/StarterChat/Sync/SyncModels.swift`:
  - `struct SyncRequestMessage: Encodable` — maps `ChatMessage` fields to API shape
  - `struct SyncResponse: Decodable { let synced: Int; let skipped: Int }`
- [ ] Document in `StarterApp.swift` (task 05-03) where to call `SyncClient.shared.syncPending()` on foreground: add a TODO comment pointing to this task

## Files Touched
- `plugins/ios/chat-module/Sources/StarterChat/Sync/SyncClient.swift` — create
- `plugins/ios/chat-module/Sources/StarterChat/Sync/SyncModels.swift` — create

## Verification
- [ ] `swift package build` exits 0
- [ ] `SyncClient` passes Swift strict concurrency checks
- [ ] `bun run check` exits 0

## Commit
```
feat(ios-chat): add SyncClient for chat history sync on foreground [08-ios-chat-module/03]
```
