---
epic: 04-expo-app-upgrade
task: 07-wire-ai-chat-plugin
status: pending
depends_on:
  - 04-expo-app-upgrade/04
  - 04-expo-app-upgrade/06
  - 03-expo-plugins/02
estimate: M
commit_scope: native
---

# 07 — Wire @plugin/expo-chat-module into Chat tab

## Goal
Replace the placeholder Chat tab with a real chat UI powered by `@plugin/expo-chat-module`.

## Context
- `@plugin/expo-chat-module` is built in epic 03/task 02
- Exports: `ChatScreen` (full-screen component), `useChatStore` (zustand store), `syncMessages()`
- `ChatScreen` requires `accessToken` prop — get from `useAuth().getAccessToken()`
- The placeholder `apps/native/app/(tabs)/chat.tsx` is replaced entirely
- Sync trigger: call `syncMessages(accessToken)` in `AppState` `change` event handler when state becomes `active`

## Implementation Checklist
- [ ] Add `@plugin/expo-chat-module` to `apps/native/package.json` as `"workspace:*"`
- [ ] Replace `apps/native/app/(tabs)/chat.tsx` with:
  - Import `ChatScreen` from `@plugin/expo-chat-module`
  - Get `accessToken` via `useAuth().getAccessToken()`
  - Render `<ChatScreen accessToken={accessToken} />`
- [ ] Add AppState listener in `apps/native/app/_layout.tsx` (or a dedicated hook):
  - On `active`: call `syncMessages(await getAccessToken())`
- [ ] Run `bun run check` from repo root — exits 0

## Files Touched
- `apps/native/package.json` — add `@plugin/expo-chat-module`
- `apps/native/app/(tabs)/chat.tsx` — replace with plugin-powered screen
- `apps/native/app/_layout.tsx` — add AppState sync trigger

## Verification
- [ ] `bun run check` exits 0
- [ ] Chat tab renders `ChatScreen` without errors
- [ ] Messages persist across app restarts (AsyncStorage)
- [ ] `POST /api/chat/sync` called when app returns to foreground

## Commit
```
feat(native): wire @plugin/expo-chat-module into Chat tab [04-expo-app-upgrade/07]
```
