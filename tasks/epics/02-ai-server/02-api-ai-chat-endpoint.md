---
epic: 02-ai-server
task: 02-api-ai-chat-endpoint
status: pending
depends_on:
  - 02-ai-server/01-openai-vercel-aisdk-wrapper
  - 01-auth-redesign/05-swap-auth-middleware
estimate: M
commit_scope: ai
---

# 02 — POST /api/ai/chat Endpoint

## Goal

Create the streaming AI chat endpoint. Protected by `authMiddleware` (API JWT). Streams the OpenAI response in Vercel AI SDK data-stream format — compatible with `useChat` on Expo and with the Swift SSE parser built in epic 07.

## Context

### Request

```json
POST /api/ai/chat
Authorization: Bearer <apiJwt>
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "Hello, what can you do?" }
  ],
  "system": "You are a helpful assistant.",  // optional
  "model": "gpt-4o-mini"                     // optional, default: gpt-4o-mini
}
```

`messages` follows the OpenAI / Vercel AI SDK `CoreMessage` format — array of `{ role: "user" | "assistant" | "system", content: string }`.

### Response

SSE stream in Vercel AI SDK data-stream format:
```
0:"Hello"
0:", I"
0:" can"
0:" help"
0:" you"
0:"!"
d:{"finishReason":"stop","usage":{"promptTokens":12,"completionTokens":8}}
```

The Hono route must return the `Response` from `result.toDataStreamResponse()` directly. In Hono, return it as:
```typescript
return result.toDataStreamResponse({ headers: { "Access-Control-Allow-Origin": "*" } });
```

### Route file

Create a new file `packages/api/src/routes/ai.ts`. Mount it in `packages/api/src/index.ts` at `/ai`.

### Input validation

- `messages` is required and must be a non-empty array.
- Each message must have `role` and `content` string fields.
- Max messages: 50 (prevent abuse).
- Max content length per message: 4000 chars.

### Error handling

- Invalid input → 400 with `{ error: "..." }` JSON (NOT a stream).
- OpenAI API error → the `streamText` call will throw; catch it and return 500.
- Rate limiting: for v1, no rate limiting. Mark as a future enhancement.

### Mount in index.ts

Check how other routes are mounted in `packages/api/src/index.ts`. Pattern is typically:
```typescript
app.route("/auth", authRoutes);
app.route("/ai", aiRoutes);
```

## Implementation Checklist

- [ ] Create `packages/api/src/routes/ai.ts`:
  - Import `authMiddleware` from `../middleware/auth`
  - Import `streamChat` and `CoreMessage` from `@repo/ai`
  - Create `new Hono()` named `aiRoutes`
  - Add `POST /chat` handler with `authMiddleware`
  - Parse and validate `messages`, `system`, `model` from body
  - Call `streamChat(messages, { system, model })`
  - Return `result.toDataStreamResponse()`
  - Handle errors (invalid input → 400, server error → 500)
- [ ] Mount in `packages/api/src/index.ts`:
  ```typescript
  import aiRoutes from "./routes/ai";
  app.route("/ai", aiRoutes);
  ```
- [ ] Add `packages/api/src/routes/__tests__/ai.test.ts` with:
  - Test that missing `messages` → 400
  - Test that empty `messages` array → 400
  - Test that valid messages with mocked `streamChat` → streams response (mock the stream)

## Files Touched

- `packages/api/src/routes/ai.ts` — create
- `packages/api/src/index.ts` — mount ai routes
- `packages/api/src/routes/__tests__/ai.test.ts` — create

## Verification

- [ ] `bun run check` exits 0
- [ ] `bun run typecheck` exits 0
- [ ] `bun run test` — ai route tests pass
- [ ] Manual test (requires `OPENAI_API_KEY` and valid API JWT):
  ```bash
  curl -X POST http://localhost:4001/api/ai/chat \
    -H "Authorization: Bearer <apiJwt>" \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"Say hello in 3 words"}]}' \
    --no-buffer
  ```
  Should stream lines starting with `0:"..."`.
- [ ] No auth header → 401
- [ ] Missing messages → 400

## Future Enhancements

- Per-user rate limiting (e.g. 100 requests/day)
- System prompt from `app_config` table
- Model selection restricted to allowlist

## Commit

```
feat(ai): add POST /api/ai/chat streaming endpoint [02-ai-server/02]
```
