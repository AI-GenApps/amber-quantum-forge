---
epic: 04-expo-app-upgrade
task: 00-deps-zustand-rq-axios
status: pending
depends_on: []
estimate: S
commit_scope: native
---

# 00 — Install zustand, react-query, axios in apps/native

## Goal
Add the three core client-side libraries needed before wiring up auth and AI plugins: state management (zustand), server-state / caching (tanstack react-query), and HTTP client (axios).

## Context
- Package manager: Bun
- Working directory for installs: `apps/native`
- Existing deps in `apps/native/package.json`: check before adding to avoid duplication
- React Query requires a `QueryClientProvider` wrapper at the app root (`apps/native/app/_layout.tsx`)
- Do NOT yet wire zustand stores or axios instances — that happens in tasks 06 and 07

## Implementation Checklist
- [ ] Run `bun add zustand @tanstack/react-query axios` inside `apps/native`
- [ ] Verify versions added to `apps/native/package.json`
- [ ] Add `QueryClientProvider` with a `new QueryClient()` to `apps/native/app/_layout.tsx` wrapping existing providers (outermost position is fine)
- [ ] Run `bun run check` from repo root — exits 0

## Files Touched
- `apps/native/package.json` — updated (new deps)
- `apps/native/app/_layout.tsx` — wrap with `QueryClientProvider`

## Verification
- [ ] `bun run check` exits 0
- [ ] `apps/native/package.json` contains `zustand`, `@tanstack/react-query`, `axios`
- [ ] App boots without error in Expo dev mode

## Commit
```
feat(native): add zustand, react-query, axios deps [04-expo-app-upgrade/00]
```
