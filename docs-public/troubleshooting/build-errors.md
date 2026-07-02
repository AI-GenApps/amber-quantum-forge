---
title: Build Errors
---

# Build Errors

Use this when onboarding or deployment fails before the app starts.

## Common errors

- **Native build fails on iOS**: run `xcodegen generate` after changing
  `apps-native/ios-app/project.yml`.
- **Web build fails**: run `bun run check` and fix any lint/type failures before retrying.
- **Bun package mismatch**: ensure `bun` is installed and version in lockfile matches
  your environment.

## Quick triage flow

1. Run the repo check command first.
2. Re-run the specific build/dev command in the exact folder that failed.
3. If it still fails, capture logs from that folder only and search for the first
   stack frame.
