# Global Task Status

Last updated: manually — update when each epic is fully completed.

## Epics

- [x] 00 — Foundations (husky, lint-staged, commitlint, secretlint, docs skeleton)
- [ ] 01 — Auth Redesign (JWT two-stage auth, exchange/refresh/revoke endpoints)
- [ ] 02 — AI Server (packages/ai, Vercel AI SDK, /api/ai/chat, /api/chat/sync)
- [ ] 03 — Expo Plugins (plugins/expo/auth, plugins/expo/ai, plugins/expo/chat-module)
- [ ] 04 — Expo App Upgrade (Zustand, React Query, axios, themed components, onboarding)
- [ ] 05 — iOS Scaffold (XcodeGen, SPM, SwiftUI, Widget, codegen script)
- [ ] 06 — iOS Auth Plugin (plugins/ios/auth — Apple/Google sign-in, Keychain, refresh interceptor)
- [ ] 07 — iOS AI Plugin (plugins/ios/ai — AICore, SSE parser, OnDeviceAI stub)
- [ ] 08 — iOS Chat Module (plugins/ios/chat-module — SwiftUI chat, SwiftData, sync)
- [ ] 09 — CI/CD (ios-ci self-hosted, EAS expo workflow, web-ci)
- [ ] 10 — Polish & Release (codegen verification, seed data, doc cross-links, release checklist)

## How to read this file

Each epic maps to `tasks/epics/XX-<epic-name>/STATUS.md` which tracks individual tasks.
When all tasks in an epic are complete, tick the checkbox above and commit:
`docs(tasks): mark epic XX complete [tasks/status]`
