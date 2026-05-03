---
epic: 09-ci-cd
task: 01-eas-expo-workflow
status: pending
depends_on:
  - 04-expo-app-upgrade/07
estimate: M
commit_scope: ci
---

# 01 — EAS Expo workflow

## Goal
Create `.eas/workflows/expo-ci.yml` that runs Biome checks and a preview build on EAS for every push to `main` and on pull requests targeting `main`.

## Context
- EAS Workflows YAML format (see `expo-cicd-workflows` skill for exact schema)
- Jobs: `lint` (run `bun run check` on the monorepo) + `build` (EAS build for preview profile)
- EAS build profile: `preview` (internal distribution, no store submission)
- Requires `EXPO_TOKEN` secret in the repo settings
- `apps/native/eas.json` must have a `preview` profile — check if it exists

## Implementation Checklist
- [ ] Load `expo-cicd-workflows` skill for exact EAS workflow YAML syntax before writing
- [ ] Check `apps/native/eas.json` for existing `preview` build profile; add if missing:
  ```json
  {
    "build": {
      "preview": {
        "distribution": "internal",
        "ios": { "simulator": true },
        "android": { "buildType": "apk" }
      }
    }
  }
  ```
- [ ] Create `.eas/workflows/expo-ci.yml`:
  - Trigger: push to `main` (paths: `apps/native/**`, `packages/**`) + pull_request
  - Job `lint`: run `bun install && bun run check` in repo root
  - Job `build`: EAS build `--platform all --profile preview --non-interactive`
  - `build` depends on `lint` passing
- [ ] Verify YAML is valid

## Files Touched
- `.eas/workflows/expo-ci.yml` — create
- `apps/native/eas.json` — update (add preview profile if missing)

## Verification
- [ ] YAML parses without error
- [ ] `bun run check` exits 0

## Commit
```
feat(ci): add EAS Expo CI workflow with lint and preview build [09-ci-cd/01]
```
