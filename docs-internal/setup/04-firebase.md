# 04 — Firebase Setup

## Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com).
2. Click "Add project" and follow the wizard.
3. Enable Google Analytics (optional).

## Enable Authentication providers

In the Firebase Console → Authentication → Sign-in method, enable:

- **Google** — set the authorized domain for your web app
- **Apple** — requires an Apple Developer account; configure the service ID and key

## Download config files

### Android (Expo)

1. Firebase Console → Project Settings → Your apps → Add Android app
2. Package name: `app.w3dev.starter`
3. Download `google-services.json`
4. Place at: `apps/native/google-services.json`

### iOS (Expo + native app)

1. Firebase Console → Project Settings → Your apps → Add iOS app
2. Bundle ID: `app.w3dev.starter`
3. Download `GoogleService-Info.plist`
4. Place at: `apps/native/GoogleService-Info.plist`
5. For the native iOS app, also place at: `apps-native/ios-app/Starter/Resources/GoogleService-Info.plist`

## Server-side admin SDK

1. Firebase Console → Project Settings → Service Accounts → Generate new private key
2. Download the JSON file
3. Extract values into environment variables:
   - `FIREBASE_PROJECT_ID` — `project_id` field
   - `FIREBASE_CLIENT_EMAIL` — `client_email` field
   - `FIREBASE_PRIVATE_KEY` — `private_key` field (keep the `\n` characters)

## Grant admin custom claim

```bash
bun --cwd packages/api run grant-admin <uid>
```

Where `<uid>` is the Firebase UID of the user to grant admin access to.
