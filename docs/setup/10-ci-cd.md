# 10 — CI/CD

> Stub — detailed setup instructions are added in epic 09.

## Overview

| Pipeline | Config file | Trigger |
|---|---|---|
| iOS CI | `.github/workflows/ios-ci.yml` | Push to `main`, PRs |
| Expo CI | `.eas/workflows/expo-ci.yml` | Push to `main`, PRs |
| Web CI | `.github/workflows/web-ci.yml` | Push to `main`, PRs |

## iOS CI (self-hosted macOS runner)

- Runner labels: `[self-hosted, macOS, xcode-26.2]`
- Runs: SwiftLint, swift-format check, `xcodegen generate`, build, test
- See epic 09 for full runner setup instructions

## Expo CI (EAS)

- Managed by Expo Application Services
- Config in `.eas/workflows/expo-ci.yml`
- Runs type-check, lint, and optionally a preview build

## Web CI (GitHub Actions)

- Config in `.github/workflows/web-ci.yml`
- Runs: `bun run check`, `bun run typecheck`, `bun run build`
- Deploys to Vercel on merge to `main` (auto-configured by Vercel GitHub integration)
