---
epic: 07-ios-ai-plugin
task: 02-vercel-datastream-parser
status: pending
depends_on:
  - 07-ios-ai-plugin/01
estimate: M
commit_scope: ios-ai
---

# 02 — Vercel data-stream parser (~80 LOC)

## Goal
Implement `VercelDataStreamParser` that converts raw SSE lines from `AINetworkClient` into text tokens and finish events.

## Context
- Vercel AI SDK data-stream format:
  - `0:"<token>"` — JSON-encoded text delta
  - `d:{...}` — finish metadata with `finishReason` and `usage`
  - Other prefixes — ignore
- Parser is stateless: call `parse(line:)` per line
- Integrates into `RemoteAISession.send()` which bridges to `AsyncThrowingStream<String, Error>`
- Target: ~80 LOC (see `docs-internal/architecture/ai.md`)

## Implementation Checklist
- [ ] Create `plugins/ios/ai/Sources/StarterAI/Parsing/VercelDataStreamParser.swift`:
  - `final class VercelDataStreamParser`
  - `var onToken: ((String) -> Void)?`
  - `var onFinish: ((FinishMetadata) -> Void)?`
  - `var onError: ((Error) -> Void)?`
  - `struct FinishMetadata: Decodable { let finishReason: String; let usage: UsageMetadata? }`
  - `struct UsageMetadata: Decodable { let promptTokens: Int; let completionTokens: Int }`
  - `func parse(line: String)`:
    - If `line.hasPrefix("0:")`: strip prefix, JSON-decode `String`, call `onToken`
    - If `line.hasPrefix("d:")`: strip prefix, JSON-decode `FinishMetadata`, call `onFinish`
    - Otherwise: ignore
- [ ] Update `RemoteAISession.send()` in task 00 to pipe `AINetworkClient.streamChat()` lines through `VercelDataStreamParser`, yielding tokens to the `AsyncThrowingStream<String, Error>` returned to caller
- [ ] `swift package build` succeeds

## Files Touched
- `plugins/ios/ai/Sources/StarterAI/Parsing/VercelDataStreamParser.swift` — create
- `plugins/ios/ai/Sources/StarterAI/Core/RemoteAISession.swift` — update (wire parser)

## Verification
- [ ] `swift package build` exits 0
- [ ] `VercelDataStreamParser.swift` is ≤80 lines
- [ ] `bun run check` exits 0

## Commit
```
feat(ios-ai): add VercelDataStreamParser for Vercel AI SDK data-stream format [07-ios-ai-plugin/02]
```
