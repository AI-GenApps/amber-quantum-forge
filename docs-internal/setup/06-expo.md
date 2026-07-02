# 06 — Expo App Setup

## Prerequisites

- EAS CLI installed: `bun add -g eas-cli`
- Logged in: `eas login`

## EAS project setup

```bash
cd apps/native
eas init
```

This creates an `extra.eas.projectId` in `app.json`.

## Local development

```bash
cd apps/native
bun run dev          # starts Expo web + Metro bundler
bun run android      # run on Android emulator/device
bun run ios          # run on iOS simulator/device
```

## OTA updates

```bash
eas update --branch preview --message "fix: update message"
```

## Build profiles

Profiles are defined in `apps/native/eas.json`:

- `development` — includes dev client, used with `expo start --dev-client`
- `preview` — internal distribution build for testing
- `production` — App Store / Play Store submission build

## Building

```bash
eas build --platform ios --profile development
eas build --platform android --profile production
```

## app.json key fields

| Field | Value |
|---|---|
| `expo.name` | Starter |
| `expo.slug` | starter |
| `expo.bundleIdentifier` (iOS) | `app.w3dev.starter` |
| `expo.package` (Android) | `app.w3dev.starter` |
