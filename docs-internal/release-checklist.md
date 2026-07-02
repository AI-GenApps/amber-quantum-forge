# Release Checklist

## 1. Pre-release

```bash
bun run check           # Biome format + lint — must pass
bun run typecheck       # TypeScript across all packages
bun run build           # Next.js build (in apps/web)
bun run codegen:swift   # Regenerate Swift types from TS
```

## 2. Environment variables

| Variable | Local | Staging | Production |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://localhost/starter_dev` | set in Vercel | set in Vercel |
| `API_JWT_SECRET` | any 32+ char string | secret | secret |
| `API_JWT_REFRESH_SECRET` | any 32+ char string | secret | secret |
| `OPENAI_API_KEY` | optional | required | required |
| `FIREBASE_PROJECT_ID` | from Firebase console | same | same |
| `FIREBASE_CLIENT_EMAIL` | from service account | same | same |
| `FIREBASE_PRIVATE_KEY` | from service account | same | same |
| `ADMIN_UIDS` | comma-separated Firebase UIDs | set if needed | set if needed |
| `NEXT_PUBLIC_FIREBASE_*` | from Firebase web config | same | same |

## 3. Database

```bash
cd packages/db
bun run db:migrate          # apply pending migrations
bun run db:seed             # seed app_config defaults (fresh deployments only)
```

## 4. iOS App Store

1. Copy `GoogleService-Info.plist` from 1Password into `apps-native/ios-app/Starter/`
2. Bump `version` and `buildNumber` in `apps-native/ios-app/project.yml`
3. Regenerate project: `cd apps-native/ios-app && xcodegen generate`
4. Open `Starter.xcodeproj` in Xcode, select **Product → Archive**
5. Upload via Xcode Organizer, or:
   ```bash
   xcodebuild archive -scheme Starter -archivePath Starter.xcarchive
   xcodebuild -exportArchive -archivePath Starter.xcarchive -exportPath export/ -exportOptionsPlist ExportOptions.plist
   ```
6. Submit: `eas submit --platform ios`

## 5. Android Play Store

```bash
eas build --platform android --profile production
eas submit --platform android
```

## 6. Web (Vercel)

- `git push origin main` triggers automatic Vercel deploy
- Verify all env vars are set in Vercel dashboard (see §2)
- Run `bun run db:migrate` against production DB before or immediately after deploy

## 7. Smoke tests

After deploying, verify manually:

- [ ] Web app loads at production URL
- [ ] Sign-up and sign-in flows work (Apple, Google, email)
- [ ] AI chat returns streamed responses
- [ ] iOS app launches and authenticates
- [ ] iOS widget shows last message
- [ ] RevenueCat paywall loads
- [ ] Admin panel accessible with admin UID

## 8. Rollback

| Platform | How to rollback |
|---|---|
| **Vercel** | Open Vercel dashboard → Deployments → re-deploy previous build |
| **iOS** | Submit previous archive via App Store Connect; users on bad version auto-update |
| **Android** | Use Play Console → Release → rollout percentage to 0%, or use staged rollback |
| **Database** | Run down-migration: `cd packages/db && bun run db:migrate` (check migration file for rollback SQL) |
