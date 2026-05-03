---
epic: 03-expo-plugins
task: 02-plugin-expo-chat-module
status: pending
depends_on:
  - 03-expo-plugins/01-plugin-expo-ai
estimate: M
commit_scope: expo-chat
---

# 02 — @plugin/expo-chat-module

## Goal

Create the `plugins/expo/chat-module` package (`@plugin/expo-chat-module`). This plugin provides a complete streaming chat UI for the Expo app: a `ChatScreen` component, local message persistence via AsyncStorage, and periodic sync to the server.

## Context

### What this plugin provides

- `ChatScreen` — a full-screen React Native chat component with a message list, input bar, and send button
- `useChatStore` — Zustand store for local message persistence (AsyncStorage-backed)
- Periodic sync every 5 minutes (when app is in foreground) via `@plugin/expo-ai`'s `syncMessages()`

### Design requirements

- Messages display with user bubbles (right-aligned) and AI bubbles (left-aligned)
- Streaming: assistant messages grow token-by-token in real time
- Smooth scroll to bottom on new message
- Loading indicator while AI is responding
- Error state with retry button
- Works with expo-router by being a screen component

### Dependencies

- `@plugin/expo-ai` — for `useAIChat`
- `zustand` — for local state (will be added to `apps/native` in epic 04; here it's a peer dep)
- `@react-native-async-storage/async-storage` — for persistence (peer dep)
- React Native built-in `FlatList`, `TextInput`, `KeyboardAvoidingView`

### Plugin structure

```
plugins/expo/chat-module/
  package.json
  tsconfig.json
  src/
    index.ts
    ChatScreen.tsx        # full-screen chat component
    MessageBubble.tsx     # individual message component
    ChatInput.tsx         # input bar component
    useChatStore.ts       # Zustand store with AsyncStorage persistence
    syncScheduler.ts      # periodic sync logic
    types.ts
```

## Implementation Checklist

- [ ] Create `plugins/expo/chat-module/package.json`:
  ```json
  {
    "name": "@plugin/expo-chat-module",
    "version": "0.0.1",
    "private": true,
    "main": "src/index.ts",
    "peerDependencies": {
      "react": "*",
      "react-native": "*",
      "@plugin/expo-ai": "*",
      "zustand": "*",
      "@react-native-async-storage/async-storage": "*"
    }
  }
  ```
- [ ] Create `plugins/expo/chat-module/tsconfig.json`.
- [ ] Create `src/types.ts`:
  ```typescript
  export interface LocalChatMessage {
    id: string;            // UUID
    role: "user" | "assistant";
    content: string;
    createdAt: string;     // ISO 8601
    synced: boolean;       // whether this message has been synced to server
  }
  ```
- [ ] Create `src/useChatStore.ts`:
  - Zustand store with `persist` middleware using AsyncStorage
  - State: `messages: LocalChatMessage[]`
  - Actions: `addMessage`, `updateLastMessage` (for streaming tokens), `markSynced(ids: string[])`
  - Persistence key: `@chat/messages`
  - Max stored messages: 200 (prune oldest on overflow)
- [ ] Create `src/MessageBubble.tsx`:
  - Props: `message: LocalChatMessage`, `isStreaming?: boolean`
  - User messages: right-aligned, primary color background
  - Assistant messages: left-aligned, surface color background
  - Streaming indicator: blinking cursor at end when `isStreaming` is true
- [ ] Create `src/ChatInput.tsx`:
  - Props: `onSend: (text: string) => void`, `disabled: boolean`
  - Multi-line `TextInput` with a send `TouchableOpacity` button
  - Disabled and greyed out when `disabled` is true (AI is responding)
- [ ] Create `src/ChatScreen.tsx`:
  - Uses `useAIChat` from `@plugin/expo-ai`
  - Uses `useChatStore` for local persistence
  - Syncs messages from Vercel AI SDK into the store on each update
  - `FlatList` with `inverted` for bottom-first scrolling
  - `KeyboardAvoidingView` with `behavior="padding"` on iOS
  - Calls `syncMessages()` when app goes to foreground (use `AppState`)
- [ ] Create `src/syncScheduler.ts`:
  - `startSyncScheduler(syncFn: () => Promise<void>): () => void`
  - Returns a cleanup function
  - Uses `setInterval` for every 5 minutes
  - Only syncs when there are unsynced messages
- [ ] Export from `src/index.ts`: `ChatScreen`, `useChatStore`, `LocalChatMessage`

## Files Touched

- `plugins/expo/chat-module/package.json` — create
- `plugins/expo/chat-module/tsconfig.json` — create
- `plugins/expo/chat-module/src/types.ts` — create
- `plugins/expo/chat-module/src/useChatStore.ts` — create
- `plugins/expo/chat-module/src/MessageBubble.tsx` — create
- `plugins/expo/chat-module/src/ChatInput.tsx` — create
- `plugins/expo/chat-module/src/ChatScreen.tsx` — create
- `plugins/expo/chat-module/src/syncScheduler.ts` — create
- `plugins/expo/chat-module/src/index.ts` — create

## Verification

- [ ] `bun install` exits 0
- [ ] `bun run check` exits 0
- [ ] `bun run typecheck` exits 0
- [ ] TypeScript: `ChatScreen` is a valid React Native component type
- [ ] TypeScript: `useChatStore` returns correct Zustand store shape

## Commit

```
feat(expo-chat): add @plugin/expo-chat-module with chat UI and local persistence [03-expo-plugins/02]
```
