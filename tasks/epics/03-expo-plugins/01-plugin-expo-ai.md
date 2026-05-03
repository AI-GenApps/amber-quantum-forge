---
epic: 03-expo-plugins
task: 01-plugin-expo-ai
status: pending
depends_on:
  - 02-ai-server/02-api-ai-chat-endpoint
  - 03-expo-plugins/00-plugin-expo-auth
estimate: M
commit_scope: expo-ai
---

# 01 — @plugin/expo-ai

## Goal

Create the `plugins/expo/ai` package (`@plugin/expo-ai`). This plugin wraps the Vercel AI SDK's `useChat` hook with authentication and API URL configuration, providing a single ready-to-use `useAIChat` hook for the Expo app.

## Context

### Vercel AI SDK on React Native

The Vercel AI SDK's `useChat` hook works in React Native via the `@ai-sdk/react` package. It handles streaming, message state, and loading/error states.

```typescript
import { useChat } from "@ai-sdk/react";

const { messages, input, handleSubmit, isLoading } = useChat({
  api: `${API_URL}/ai/chat`,
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

The hook automatically:
- Sends `POST` with `{ messages }` body
- Parses the data-stream SSE response
- Appends tokens to the last assistant message in real-time

### Plugin structure

```
plugins/expo/ai/
  package.json          # "@plugin/expo-ai"
  tsconfig.json
  src/
    index.ts
    useAIChat.ts        # wraps useChat with auth token injection
    types.ts            # re-exports Vercel AI types + adds plugin types
```

### What `useAIChat` adds over raw `useChat`

1. Automatically gets `accessToken` from `@plugin/expo-auth`'s `useAuth()` hook
2. Sets the `Authorization` header on every request
3. Sets `api` URL from `process.env.EXPO_PUBLIC_API_URL`
4. Exposes a `syncMessages()` function to trigger a background sync to `/api/chat/sync`
5. Typed `ChatMessage[]` return value

### Library dependencies

- `ai` — Vercel AI SDK core
- `@ai-sdk/react` — React hooks for Vercel AI SDK

Check if `ai` and `@ai-sdk/react` need to be added. They will be peer dependencies.

## Implementation Checklist

- [ ] Create `plugins/expo/ai/package.json`:
  ```json
  {
    "name": "@plugin/expo-ai",
    "version": "0.0.1",
    "private": true,
    "main": "src/index.ts",
    "peerDependencies": {
      "react": "*",
      "@plugin/expo-auth": "*",
      "ai": "*",
      "@ai-sdk/react": "*"
    }
  }
  ```
- [ ] Create `plugins/expo/ai/tsconfig.json` extending `@repo/typescript-config/base.json`.
- [ ] Create `plugins/expo/ai/src/types.ts`:
  ```typescript
  export type { Message as ChatMessage } from "ai";

  export interface UseAIChatOptions {
    initialMessages?: import("ai").Message[];
    system?: string;
    onError?: (error: Error) => void;
    onFinish?: (message: import("ai").Message) => void;
  }
  ```
- [ ] Create `plugins/expo/ai/src/useAIChat.ts`:
  - Import `useChat` from `@ai-sdk/react`
  - Import `useAuth` from `@plugin/expo-auth`
  - Read `API_BASE_URL` from `process.env.EXPO_PUBLIC_API_URL`
  - On each render, get the current access token via `useAuth().getAccessToken()` (handle the async with `useEffect` + state)
  - Pass headers to `useChat`: `{ Authorization: Bearer ${token} }`
  - Add `syncMessages(messages)` function that calls `POST /api/chat/sync` with all messages
  - Return everything from `useChat` plus `syncMessages`
  - **Token refresh note**: `getAccessToken()` from the auth plugin already handles refresh. Call it before each request using `onRequest` callback in `useChat` if available, or refresh before rendering.
- [ ] Create `plugins/expo/ai/src/index.ts`:
  ```typescript
  export { useAIChat } from "./useAIChat";
  export type { UseAIChatOptions, ChatMessage } from "./types";
  ```
- [ ] Run `bun install`.

## Files Touched

- `plugins/expo/ai/package.json` — create
- `plugins/expo/ai/tsconfig.json` — create
- `plugins/expo/ai/src/types.ts` — create
- `plugins/expo/ai/src/useAIChat.ts` — create
- `plugins/expo/ai/src/index.ts` — create

## Verification

- [ ] `bun install` exits 0
- [ ] `bun run check` exits 0
- [ ] `bun run typecheck` exits 0
- [ ] TypeScript: `useAIChat()` return type matches Vercel AI SDK `UseChat` return type

## Commit

```
feat(expo-ai): add @plugin/expo-ai with useAIChat hook [03-expo-plugins/01]
```
