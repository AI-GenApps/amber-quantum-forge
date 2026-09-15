# Global Task Status

Last updated: manually — update when each epic is fully completed.

## Epics

- [x] 00 — Foundations (husky, lint-staged, commitlint, secretlint, docs skeleton)
- [x] 01 — Auth Redesign (JWT two-stage auth, exchange/refresh/revoke endpoints)
- [x] 02 — AI Server (packages/ai, Vercel AI SDK, /api/ai/chat, /api/chat/sync)
- [x] 03 — Expo Plugins (plugins/expo/auth, plugins/expo/ai, plugins/expo/chat-module)
- [x] 04 — Expo App Upgrade (Zustand, React Query, axios, themed components, onboarding)
- [x] 05 — iOS Scaffold (XcodeGen, SPM, SwiftUI, Widget, codegen script)
- [x] 06 — iOS Auth Plugin (plugins/ios/auth — Apple/Google sign-in, Keychain, refresh interceptor)
- [x] 07 — iOS AI Plugin (plugins/ios/ai — AICore, SSE parser, OnDeviceAI stub)
- [x] 08 — iOS Chat Module (plugins/ios/chat-module — SwiftUI chat, SwiftData, sync)
- [x] 09 — CI/CD (ios-ci self-hosted, EAS expo workflow, web-ci)
- [x] 10 — Polish & Release (codegen verification, seed data, doc cross-links, release checklist)
- [x] 11 — Optional KMP shared logic example (Service Status)

## How to read this file

Each epic maps to `tasks/epics/XX-<epic-name>/STATUS.md` which tracks individual tasks.
When all tasks in an epic are complete, tick the checkbox above and commit:
`docs(tasks): mark epic XX complete [tasks/status]`
