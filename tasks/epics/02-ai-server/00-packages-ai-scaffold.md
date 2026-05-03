---
epic: 02-ai-server
task: 00-packages-ai-scaffold
status: pending
depends_on:
  - 00-foundations/00-husky-lintstaged
estimate: S
commit_scope: ai
---

# 00 — packages/ai Scaffold

## Goal

Create the `packages/ai` workspace package with the correct `package.json`, `tsconfig.json`, and empty source structure. This package will be imported by `@repo/api` to access the AI wrapper.

## Context

### Package identity

- Name: `@repo/ai`
- Location: `packages/ai/`
- This is a Bun workspace — add `"packages/*"` is already in root `package.json` `workspaces`, so `packages/ai` is automatically included.

### Relationship to existing packages

Look at `packages/ui/package.json` and `packages/db/package.json` for the naming and tsconfig patterns to follow.

### What goes in this package

- `src/index.ts` — main export (re-exports from sub-modules)
- `src/model.ts` — `createModel()` helper that returns an OpenAI model instance
- `src/stream.ts` — `streamChat()` helper
- `src/types.ts` — shared types (`ChatMessage`, `ChatRole`, `StreamOptions`)

### Build

This package does NOT need a build step for server use (Bun imports TS directly). Set `"main": "src/index.ts"` in `package.json`. No tsup needed for v1.

## Implementation Checklist

- [ ] Create `packages/ai/package.json`:
  ```json
  {
    "name": "@repo/ai",
    "version": "0.0.1",
    "private": true,
    "main": "src/index.ts",
    "scripts": {
      "typecheck": "tsc --noEmit"
    }
  }
  ```
- [ ] Create `packages/ai/tsconfig.json`:
  ```json
  {
    "extends": "@repo/typescript-config/base.json",
    "compilerOptions": {
      "outDir": "dist"
    },
    "include": ["src"]
  }
  ```
  (Check `packages/db/tsconfig.json` for the exact base.json reference path)
- [ ] Create `packages/ai/src/types.ts` with:
  ```typescript
  export type ChatRole = "user" | "assistant" | "system";

  export interface ChatMessage {
    role: ChatRole;
    content: string;
  }

  export interface StreamOptions {
    model?: string;
    system?: string;
    temperature?: number;
    maxTokens?: number;
  }
  ```
- [ ] Create `packages/ai/src/index.ts` as a re-export barrel (empty for now):
  ```typescript
  export * from "./types";
  export * from "./model";
  export * from "./stream";
  ```
- [ ] Create empty stubs `packages/ai/src/model.ts` and `packages/ai/src/stream.ts` (will be filled in task 01).
- [ ] Run `bun install` from repo root to register the new workspace.
- [ ] Add `@repo/ai` to `packages/api/package.json` dependencies:
  ```json
  "@repo/ai": "*"
  ```
  Then `bun install` again.

## Files Touched

- `packages/ai/package.json` — create
- `packages/ai/tsconfig.json` — create
- `packages/ai/src/types.ts` — create
- `packages/ai/src/index.ts` — create
- `packages/ai/src/model.ts` — create (stub)
- `packages/ai/src/stream.ts` — create (stub)
- `packages/api/package.json` — add `@repo/ai` dependency

## Verification

- [ ] `bun install` exits 0
- [ ] `bun run check` exits 0
- [ ] `bun run typecheck` exits 0
- [ ] `import { ChatMessage } from "@repo/ai"` resolves correctly in `packages/api/src` (test by adding a temporary import)

## Commit

```
feat(ai): scaffold packages/ai workspace package [02-ai-server/00]
```
