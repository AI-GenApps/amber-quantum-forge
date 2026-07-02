# 11 — Release

> Stub — detailed release checklist is added in epic 10.

## iOS (App Store)

1. Bump version in `apps-native/ios-app/project.yml` (`MARKETING_VERSION`)
2. Run `xcodegen generate`
3. In Xcode: Product → Archive
4. Xcode Organizer → Distribute App → App Store Connect

## Android (via EAS)

```bash
eas build --platform android --profile production
eas submit --platform android
```

## Web

Vercel auto-deploys on every push to `main`. No manual step required.

## Expo OTA update (hotfix)

```bash
eas update --branch production --message "fix: <description>"
```

## Versioning

Follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.
