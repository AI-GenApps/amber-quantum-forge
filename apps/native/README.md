# Native (Expo)

Expo SDK 55 / React Native 0.83 mobile app with [expo-router](https://docs.expo.dev/router/introduction/) for navigation.

## Key Dependencies

- **Auth**: [Firebase Auth](https://rnfirebase.io/auth/usage) (Google Sign-In, Apple Auth)
- **Payments**: [RevenueCat](https://www.revenuecat.com/docs/getting-started/installation/reactnative)
- **Push Notifications**: [expo-notifications](https://docs.expo.dev/push-notifications/overview/) + Firebase Cloud Messaging

## Development

```bash
bun run dev          # Expo web
bun run ios          # iOS simulator
bun run android      # Android emulator
```

## EAS Build & Update

```bash
bun run eas:dev:ios           # Development build (iOS)
bun run eas:dev:android       # Development build (Android)
bun run eas:prod:ios          # Production build (iOS)
bun run eas:prod:android      # Production build (Android)
bun run update:production "msg"  # OTA update (production)
bun run update:preview "msg"     # OTA update (preview)
```

## Configuration

- `app.json` — Expo config (bundle IDs, plugins, EAS project)
- `google-services.json` — Firebase config for Android (not committed)
