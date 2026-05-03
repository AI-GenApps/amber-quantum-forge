---
epic: 09-ci-cd
task: 00-ios-ci-self-hosted
status: pending
depends_on:
  - 05-ios-scaffold/00
estimate: M
commit_scope: ci
---

# 00 — iOS CI workflow (self-hosted macOS runner)

## Goal
Create `.github/workflows/ios-ci.yml` that builds and tests the iOS app on a self-hosted macOS runner with Xcode 26.2 on every push to `main` and on pull requests.

## Context
- Runner label: `[self-hosted, macOS, xcode-26.2]`
- Build command: `xcodebuild -project apps-native/ios-app/Starter.xcodeproj -scheme Starter -destination generic/platform=iOS build CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO`
- `xcodegen generate` must run first to produce the `.xcodeproj`
- Swift package resolution: `xcodebuild -resolvePackageDependencies`
- No secrets needed for the build-only CI (no signing, no upload)
- Run `bun run check` (lint/typecheck for the monorepo) as a separate step using Bun

## Implementation Checklist
- [ ] Create `.github/workflows/ios-ci.yml`:
  ```yaml
  name: iOS CI
  on:
    push:
      branches: [main]
      paths:
        - 'apps-native/**'
        - 'plugins/ios/**'
        - '.github/workflows/ios-ci.yml'
    pull_request:
      paths:
        - 'apps-native/**'
        - 'plugins/ios/**'
  jobs:
    build:
      runs-on: [self-hosted, macOS, xcode-26.2]
      steps:
        - uses: actions/checkout@v4
        - name: Install XcodeGen
          run: brew install xcodegen || true
        - name: Generate Xcode project
          run: xcodegen generate
          working-directory: apps-native/ios-app
        - name: Resolve SPM packages
          run: xcodebuild -project Starter.xcodeproj -resolvePackageDependencies
          working-directory: apps-native/ios-app
        - name: Build
          run: xcodebuild -project Starter.xcodeproj -scheme Starter -destination generic/platform=iOS build CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO
          working-directory: apps-native/ios-app
  ```
- [ ] Verify YAML is valid (`python3 -c "import yaml, sys; yaml.safe_load(sys.stdin)" < .github/workflows/ios-ci.yml`)

## Files Touched
- `.github/workflows/ios-ci.yml` — create

## Verification
- [ ] YAML parses without error
- [ ] Workflow only triggers on relevant path changes
- [ ] `bun run check` exits 0

## Commit
```
feat(ci): add iOS CI workflow for self-hosted macOS runner [09-ci-cd/00]
```
