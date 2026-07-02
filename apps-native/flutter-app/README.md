# Flutter App — Starter

Flutter app, a peer to `apps-native/ios-app`. Not a Bun workspace — driven by the
`flutter`/`dart` toolchain directly.

## Run

```bash
cd apps-native/flutter-app
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:4001 --dart-define=REVENUECAT_API_KEY=appl_xxx
```

## Regenerate codegen

```bash
bun run codegen:dart
```

Run this after any change to `scripts/codegen/registry.ts`. Output is written to
`lib/generated/` and is committed.

## Firebase config

Place the real config files (gitignored) next to their `.template` counterparts:

- `android/app/google-services.json`
- `ios/Runner/GoogleService-Info.plist`
