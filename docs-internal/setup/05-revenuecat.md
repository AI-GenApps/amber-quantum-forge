# 05 — RevenueCat Setup

[RevenueCat](https://www.revenuecat.com/) manages in-app subscriptions and purchases across iOS and Android.

## Create a RevenueCat project

1. Sign up at [app.revenuecat.com](https://app.revenuecat.com).
2. Create a new project.

## Add apps

### iOS app

- Platform: App Store
- Bundle ID: `app.w3dev.starter`
- Copy the **iOS SDK Key** (starts with `appl_`)

### Android app

- Platform: Google Play
- Package name: `app.w3dev.starter`
- Copy the **Android SDK Key** (starts with `goog_`)

## Create entitlement

1. RevenueCat dashboard → Entitlements → + New
2. Identifier: `pro`

## Create offering

1. RevenueCat dashboard → Offerings → + New
2. Identifier: `default`
3. Add packages (monthly, annual, etc.) and attach to the `pro` entitlement.

## Configure in Expo app

Add the SDK keys to `apps/native/app.json` under `expo.extra`:

```json
{
  "expo": {
    "extra": {
      "revenueCatApiKeyIos": "appl_...",
      "revenueCatApiKeyAndroid": "goog_..."
    }
  }
}
```

## iOS native app

The same entitlement identifier (`pro`) and offering identifier (`default`) are used. The iOS SDK key is read from `apps-native/ios-app/Starter/Resources/RevenueCat.plist` (created in epic 06).

## Server-to-server webhooks (optional)

For `REVENUECAT_WEBHOOK_SECRET`: RevenueCat dashboard → Integrations → Webhooks → Add endpoint with your API URL.
