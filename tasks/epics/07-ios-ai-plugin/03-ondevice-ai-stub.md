---
epic: 07-ios-ai-plugin
task: 03-ondevice-ai-stub
status: pending
depends_on:
  - 07-ios-ai-plugin/00
estimate: S
commit_scope: ios-ai
---

# 03 — On-device AI stub

## Goal
Create an `OnDeviceAISession` stub that implements `AISession` and logs a warning, so future CoreML integration has a clear hook point.

## Context
- On-device AI is out of scope for v1 but the protocol slot should exist
- `OnDeviceAISession` should compile and be instantiable but always throws `AIError.serverError(501)`
- Add a README in `plugins/ios/ai/` describing the intended future CoreML integration path

## Implementation Checklist
- [ ] Create `plugins/ios/ai/Sources/StarterAI/OnDevice/OnDeviceAISession.swift`:
  - `public final class OnDeviceAISession: AISession`
  - `public var messages: [AIMessage] = []`
  - `public func send(_ text: String) async throws -> AsyncThrowingStream<String, Error>`:
    - Logs warning: `print("[StarterAI] OnDeviceAISession not implemented — falling back is recommended")`
    - Returns stream that immediately throws `AIError.serverError(501)`
  - `public func clear() { messages = [] }`
- [ ] Create `plugins/ios/ai/README.md`:
  - Brief description of the `StarterAI` package
  - How to swap `RemoteAISession` for `OnDeviceAISession` in `AISessionFactory`
  - Future: CoreML model download + `MLModel` inference path
- [ ] `swift package build` succeeds

## Files Touched
- `plugins/ios/ai/Sources/StarterAI/OnDevice/OnDeviceAISession.swift` — create
- `plugins/ios/ai/README.md` — create

## Verification
- [ ] `swift package build` exits 0
- [ ] `bun run check` exits 0

## Commit
```
feat(ios-ai): add OnDeviceAISession stub and README [07-ios-ai-plugin/03]
```
