---
epic: 02-ai-server
task: 01-openai-vercel-aisdk-wrapper
status: pending
depends_on:
  - 02-ai-server/00-packages-ai-scaffold
estimate: S
commit_scope: ai
---

# 01 — OpenAI + Vercel AI SDK Wrapper

## Goal

Install the Vercel AI SDK and OpenAI provider in `packages/ai`. Implement `createModel()` and `streamChat()` helpers that will be used by the Hono route in task 02.

## Context

### Libraries

- `ai` — Vercel AI SDK core (provides `streamText`, `CoreMessage`, data-stream utilities)
- `@ai-sdk/openai` — OpenAI provider for Vercel AI SDK

Install in `packages/ai`:
```bash
bun add ai @ai-sdk/openai --filter @repo/ai
```

### Vercel AI SDK streaming overview

```typescript
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

const result = await streamText({
  model: openai("gpt-4o-mini"),
  system: "You are a helpful assistant.",
  messages: [{ role: "user", content: "Hello" }],
});

// In a Hono route, return the stream as a Response:
return result.toDataStreamResponse();
```

`toDataStreamResponse()` returns a standard `Response` object with:
- `Content-Type: text/event-stream`
- Body in Vercel AI SDK data-stream format (parsed by `useChat` on Expo and the Swift SSE parser on iOS)

### Environment

`OPENAI_API_KEY` must be set. The `@ai-sdk/openai` provider reads it from `process.env.OPENAI_API_KEY` automatically. Validate at module load in `model.ts`.

### Default model

Use `gpt-4o-mini` as the default. This is cheap and fast. Allow override via `StreamOptions.model`.

## Implementation Checklist

- [ ] Install packages:
  ```bash
  bun add ai @ai-sdk/openai --filter @repo/ai
  ```
- [ ] Implement `packages/ai/src/model.ts`:
  ```typescript
  import { createOpenAI } from "@ai-sdk/openai";

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY env var is required");
  }

  const openaiClient = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  export function createModel(modelId = "gpt-4o-mini") {
    return openaiClient(modelId);
  }
  ```
- [ ] Implement `packages/ai/src/stream.ts`:
  ```typescript
  import { streamText, type CoreMessage } from "ai";
  import { createModel } from "./model";
  import type { StreamOptions } from "./types";

  export async function streamChat(
    messages: CoreMessage[],
    options: StreamOptions = {}
  ) {
    const { model = "gpt-4o-mini", system, temperature = 0.7, maxTokens = 1000 } = options;
    return streamText({
      model: createModel(model),
      messages,
      system,
      temperature,
      maxTokens,
    });
  }
  ```
- [ ] Update `packages/ai/src/index.ts` to ensure `streamChat`, `createModel`, `ChatMessage`, `StreamOptions` are all exported.
- [ ] Re-export `CoreMessage` from Vercel AI SDK for convenience:
  ```typescript
  export type { CoreMessage } from "ai";
  ```

## Files Touched

- `packages/ai/src/model.ts` — implement
- `packages/ai/src/stream.ts` — implement
- `packages/ai/src/index.ts` — update exports
- `packages/ai/package.json` — updated by bun add

## Verification

- [ ] `bun run check` exits 0
- [ ] `bun run typecheck` exits 0 (run from `packages/ai`: `bun run typecheck`)
- [ ] `OPENAI_API_KEY` missing → `createModel()` throws on import (verify manually)
- [ ] TypeScript: `createModel()` returns correct Vercel AI SDK model type
- [ ] TypeScript: `streamChat([])` returns `StreamTextResult` type

## Commit

```
feat(ai): implement OpenAI + Vercel AI SDK wrappers in packages/ai [02-ai-server/01]
```
