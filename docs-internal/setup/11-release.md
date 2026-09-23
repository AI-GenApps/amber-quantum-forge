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

The deploy workflows target Vercel project
`prj_MaMno1fEzSLQoMHGsrGF3fV28ocH` in team
`team_bhbVYR6BqVYMXKwAp7F1k5ib`. Configure the project's Root Directory in
Vercel; the GitHub action does not override it. `VERCEL_TOKEN` is read only
from GitHub Actions secrets.

## Expo OTA update (hotfix)

```bash
eas update --branch production --message "fix: <description>"
```

## Versioning

Follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.
