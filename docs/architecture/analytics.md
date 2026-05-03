# Analytics Architecture

> Stub — detailed content added when `packages/analytics` is implemented.

## Overview

Analytics events are defined in a TypeScript registry and shared across Expo and the native iOS app via a codegen script.

## Event registry

Location: `packages/analytics/src/events.ts`

Events are defined as typed constants:

```typescript
export const Events = {
  SCREEN_VIEWED: "screen_viewed",
  BUTTON_TAPPED: "button_tapped",
  PURCHASE_COMPLETED: "purchase_completed",
} as const;
```

## Naming conventions

- snake_case for all event names
- `<noun>_<past_tense_verb>` pattern: `purchase_completed`, `session_started`
- Both Expo and iOS use the same event name strings for cross-platform consistency

## Swift codegen

The codegen script at `scripts/codegen-swift.ts` reads the TS event registry and generates:

```
apps-native/ios-app/Starter/Generated/AnalyticsEvents.swift
```

Run after changing `packages/analytics/src/events.ts`:

```bash
bun run scripts/codegen-swift.ts
```

## Usage

### Expo

```typescript
import { Events } from "@repo/analytics";
analytics.track(Events.SCREEN_VIEWED, { screen: "Home" });
```

### iOS

```swift
Analytics.track(AnalyticsEvents.screenViewed, properties: ["screen": "Home"])
```
