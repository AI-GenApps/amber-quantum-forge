---
epic: 10-polish-release
task: 03-release-checklist
status: pending
depends_on:
  - 10-polish-release/00
  - 10-polish-release/01
  - 10-polish-release/02
estimate: M
commit_scope: docs
---

# 03 — Release checklist doc

## Goal
Create `docs/release-checklist.md` covering App Store, Play Store, and Vercel deployment steps so any team member can ship a release independently.

## Context
- This is a documentation-only task — no code changes
- Covers: env var checklist, signing setup, EAS submit commands, Vercel deploy, DB migration steps, smoke test list
- References existing scripts and commands from the repo

## Implementation Checklist
- [ ] Create `docs/release-checklist.md` with sections:
  1. **Pre-release** — `bun run check`, `bun run build` (all apps), `bun run codegen:swift`, run migrations
  2. **Environment variables** — table of all required env vars per environment (local, staging, prod)
  3. **Database** — `bun run db:migrate`, `bun run db:seed` for fresh deployments
  4. **iOS App Store**:
     - Copy `GoogleService-Info.plist` from 1Password
     - Set version/build number in `project.yml`
     - `xcodegen generate`
     - Archive + upload via Xcode Organizer or `xcodebuild archive | xcodebuild -exportArchive`
     - Submit via `eas submit --platform ios`
  5. **Android Play Store**:
     - `eas build --platform android --profile production`
     - `eas submit --platform android`
  6. **Web (Vercel)**:
     - `git push origin main` triggers Vercel deploy
     - Verify `DATABASE_URL`, `API_JWT_SECRET`, `OPENAI_API_KEY`, `FIREBASE_*` vars set in Vercel dashboard
  7. **Smoke tests** — list of manual checks after deployment
  8. **Rollback** — how to revert a bad deploy on each platform

## Files Touched
- `docs/release-checklist.md` — create

## Verification
- [ ] File exists and is readable
- [ ] All referenced commands exist in `package.json` or are standard toolchain commands
- [ ] `bun run check` exits 0

## Commit
```
docs: add release checklist for App Store, Play Store, and Vercel [10-polish-release/03]
```
