---
epic: 00-foundations
task: 04-root-readme-agents-claude
status: pending
depends_on:
  - 00-foundations/03-docs-setup-skeleton
estimate: S
commit_scope: docs
---

# 04 — Root README + AGENTS.md + CLAUDE.md Updates

## Goal

Update the three root guidance files so that any agent or human developer who clones this repo immediately understands the structure, how to start, and the conventions to follow.

## Context

### Files to update

**`README.md`** — public-facing, should explain what the repo is, how to get started, link to `docs/setup/`.

**`AGENTS.md`** — instructions for AI coding agents (Copilot, Claude, etc.). Must be specific about rules, file locations, and commands.

**`CLAUDE.md`** — already exists with build commands. Needs the new commands, conventions, and links to task system.

### Key things to add

- Link to `tasks/START.md` for task-based implementation
- New packages: `packages/ai`, `packages/analytics`
- New workspace additions: `plugins/expo/*`
- New app: `apps-native/ios-app/` (not a bun workspace)
- Auth architecture change: two-stage JWT
- Bun run commands updated with new scripts
- Codegen script: `bun run scripts/codegen-swift.ts`

## Implementation Checklist

- [ ] Update `README.md`:
  - **Header**: "Starter Expo Mobile — Powerpack" with one-line description
  - **What you get**: bulleted list (Expo app, Next.js web app, Hono API, SwiftUI iOS app, JWT auth, OpenAI streaming chat, plugin architecture, CI/CD)
  - **Quick start** section:
    ```bash
    bun install
    cp .env.example .env   # fill in env vars
    cd packages/db && bun run db:push
    bun run dev
    ```
  - **Docs** section: table linking to each `docs/setup/XX-*.md`
  - **Task system** section: "This repo is built task-by-task. See `tasks/START.md` for the execution guide."
  - **Architecture** section: link to `docs/architecture/auth.md` and `docs/architecture/ai.md`

- [ ] Create or update `AGENTS.md` with:
  - **Overview**: what this repo is
  - **Task execution**: always start at `tasks/START.md`, follow the execution protocol
  - **Commit rules**: copy from `tasks/START.md` Step 6 verbatim
  - **Never do**: `--no-verify`, `npm install` (use bun), edit `*.xcodeproj` directly, commit `.env`
  - **Commands to know**:
    ```bash
    bun run check              # must pass before every commit
    bun run typecheck          # TypeScript check
    bun run test               # runs @repo/api tests
    cd packages/db && bun run db:generate && bun run db:push
    cd apps-native/ios-app && xcodegen generate
    bun run scripts/codegen-swift.ts
    ```
  - **Package manager**: Bun only. `bun add`, `bun remove`, `bun install`.
  - **Code style**: no comments, no `any`, 300-line limit per file, named imports
  - **File structure**: summarize the target layout from `tasks/START.md`
  - **Pre-commit hooks**: list all 5 hooks + secretlint + commitlint

- [ ] Update `CLAUDE.md`:
  - Add `packages/ai` and `packages/analytics` to the Packages section
  - Add `plugins/expo/*` and `plugins/ios/*` to the architecture description
  - Add `apps-native/ios-app/` to the Apps section with note "NOT a bun workspace"
  - Add new commands:
    ```bash
    bun run scripts/codegen-swift.ts   # generate Swift types from TS
    cd apps-native/ios-app && xcodegen generate  # regenerate Xcode project
    ```
  - Add **Auth architecture** section summarizing the two-stage JWT flow
  - Add link to `tasks/START.md`
  - Update the Key Integration Points section:
    - Add: "API JWT Auth: `POST /api/auth/exchange` verifies Firebase ID token, returns API JWT. All mobile requests use `Authorization: Bearer <apiJwt>`. Web admin keeps cookie session."
    - Add: "AI streaming: `POST /api/ai/chat` streams Vercel AI SDK data-stream format. iOS parses with native SSE parser in `plugins/ios/ai`."

## Files Touched

- `README.md` — rewrite
- `AGENTS.md` — create (or rewrite if exists)
- `CLAUDE.md` — update

## Verification

- [ ] `bun run check` exits 0
- [ ] `README.md` contains link to `tasks/START.md`
- [ ] `AGENTS.md` contains the commit message format
- [ ] `CLAUDE.md` mentions `API_JWT_SECRET` and `packages/ai`
- [ ] All three files have valid markdown (no broken headers)

## Commit

```
docs(docs): update README, AGENTS.md, CLAUDE.md with new architecture [00-foundations/04]
```
