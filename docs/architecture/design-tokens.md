# Design Tokens Architecture

> Stub — detailed content added when `packages/ui` token system is implemented.

## Overview

Design tokens are defined in TypeScript and shared across the React/Expo app and the native iOS app via codegen.

## Token registry

Location: `packages/ui/src/tokens.ts`

Categories:
- **Colors** — brand, semantic (success, error, warning), surface, text
- **Spacing** — 4pt grid system (4, 8, 12, 16, 24, 32, 48, 64)
- **Typography** — font families, sizes, weights, line heights

## Swift codegen

`scripts/codegen-swift.ts` generates:

```
apps-native/ios-app/Starter/Generated/DesignTokens.swift
```

This exposes all tokens as Swift constants compatible with SwiftUI.

Run after changing tokens:

```bash
bun run scripts/codegen-swift.ts
```

## Usage

### Expo / React Native

```typescript
import { tokens } from "@repo/ui";
const styles = StyleSheet.create({
  container: { padding: tokens.spacing[16] },
});
```

### iOS SwiftUI

```swift
Text("Hello")
  .foregroundStyle(Color.brandPrimary)
  .padding(DesignTokens.spacing16)
```
