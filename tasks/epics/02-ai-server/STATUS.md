# Epic 02 — AI Server

Status: pending

## Purpose

Add AI capabilities to the backend:

1. **`packages/ai`** — a new workspace package wrapping the Vercel AI SDK with OpenAI. Provides `streamChat()` and `createModel()` helpers usable in Hono routes.
2. **`POST /api/ai/chat`** — a streaming chat endpoint that uses Vercel AI SDK's `streamText()` and responds in the Vercel AI SDK data-stream format. This format is understood by `useChat` on the Expo side and by the custom Swift SSE parser (epic 07).
3. **`POST /api/chat/sync`** — a client-driven endpoint to periodically sync the client-side chat history (SwiftData / AsyncStorage) to the server. Server stores messages in a `chat_messages` table. This doubles as a usage tracking mechanism.

## AI architecture overview

```
Mobile (Expo / iOS)
  ↓ POST /api/ai/chat  (streaming SSE)
  ↓ Authorization: Bearer <apiJwt>
packages/api/src/routes/ai.ts
  ↓ uses packages/ai (Vercel AI SDK + OpenAI)
  ↓ streamText({ model, messages, system })
  ↓ toDataStreamResponse()   ← Vercel AI SDK method
  ← SSE stream in data-stream format
```

### Vercel AI SDK data-stream format (simplified)

Each line is: `<type>:<json>\n`
- `0:"token"` — text chunk
- `d:{"finishReason":"stop","usage":{...}}` — done
- Error: `3:"error message"`

The Expo `useChat` hook parses this natively. The iOS Swift parser (~80 LOC) will be built in epic 07.

## Tasks

- [ ] 00 — packages/ai scaffold
- [ ] 01 — OpenAI + Vercel AI SDK wrapper
- [ ] 02 — POST /api/ai/chat endpoint
- [ ] 03 — POST /api/chat/sync endpoint

## Notes

<!-- Running log of blockers, decisions, learnings -->
