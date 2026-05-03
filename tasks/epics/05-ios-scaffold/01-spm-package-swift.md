---
epic: 05-ios-scaffold
task: 01-spm-package-swift
status: pending
depends_on:
  - 05-ios-scaffold/00
estimate: M
commit_scope: ios
---

# 01 — SPM Package.swift for iOS plugins

## Goal
Create `Package.swift` files for all three iOS plugin packages so they can be referenced by path from `project.yml`.

## Context
- Plugin locations: `plugins/ios/auth/`, `plugins/ios/ai/`, `plugins/ios/chat-module/`
- Each is a standalone Swift package (no CocoaPods)
- External SPM dependencies:
  - `auth`: Firebase iOS SDK (GoogleSignIn, FirebaseAuth) from `https://github.com/firebase/firebase-ios-sdk`
  - `ai`: none (pure Swift, URLSession only)
  - `chat-module`: none (depends on `auth` and `ai` via path)
- Swift tools version: 5.10
- Minimum iOS deployment: 17.0

## Implementation Checklist
- [ ] Create `plugins/ios/auth/Package.swift`:
  - Package name: `StarterAuth`
  - Products: library `StarterAuth`
  - Targets: `StarterAuth` (sources: `Sources/StarterAuth/`)
  - Dependencies: `FirebaseAuth`, `GoogleSignIn` from firebase-ios-sdk
- [ ] Create `plugins/ios/auth/Sources/StarterAuth/.gitkeep` (sources created in epic 06)
- [ ] Create `plugins/ios/ai/Package.swift`:
  - Package name: `StarterAI`
  - Products: library `StarterAI`
  - Targets: `StarterAI` (sources: `Sources/StarterAI/`)
  - No external dependencies
- [ ] Create `plugins/ios/ai/Sources/StarterAI/.gitkeep`
- [ ] Create `plugins/ios/chat-module/Package.swift`:
  - Package name: `StarterChat`
  - Products: library `StarterChat`
  - Targets: `StarterChat` (sources: `Sources/StarterChat/`)
  - Dependencies: local `StarterAuth`, local `StarterAI` via path
- [ ] Create `plugins/ios/chat-module/Sources/StarterChat/.gitkeep`
- [ ] Run `swift package dump-package` in each directory to validate syntax

## Files Touched
- `plugins/ios/auth/Package.swift` — create
- `plugins/ios/auth/Sources/StarterAuth/.gitkeep` — create
- `plugins/ios/ai/Package.swift` — create
- `plugins/ios/ai/Sources/StarterAI/.gitkeep` — create
- `plugins/ios/chat-module/Package.swift` — create
- `plugins/ios/chat-module/Sources/StarterChat/.gitkeep` — create

## Verification
- [ ] `swift package dump-package` succeeds in each plugin directory
- [ ] `xcodegen generate` still succeeds in `apps-native/ios-app/`
- [ ] `bun run check` exits 0

## Commit
```
feat(ios): add Package.swift for auth, ai, chat-module SPM plugins [05-ios-scaffold/01]
```
