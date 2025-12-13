# Plan to Remove react-native-web

## Overview
This plan outlines the steps to remove `react-native-web` from the monorepo, converting the shared UI components from React Native primitives to standard React/web components.

## Current State Analysis

### Dependencies
- **apps/web/package.json**: 
  - `react-native-web: ^0.19.10` (dependency)
  - `babel-plugin-react-native-web: ^0.19.10` (devDependency)
- **apps/native/package.json**: 
  - `react-native-web: ~0.19.13` (dependency - used for Expo web support)
- **packages/ui/package.json**: 
  - `react-native: 0.76.9` (dependency)

### Configuration
- **apps/web/next.config.js**: 
  - Webpack alias: `"react-native$": "react-native-web"`
  - Turbopack alias: `"react-native$": "react-native-web"`
  - Custom extensions: `.web.js`, `.web.jsx`, `.web.ts`, `.web.tsx`

### Components Using React Native
1. **packages/ui/src/button.tsx**: Uses `Pressable`, `Text`, `StyleSheet` from `react-native`
2. **apps/native/app/index.tsx**: Uses `View`, `Text`, `StyleSheet` from `react-native` (native-only, not affected)

## Migration Strategy

### Option A: Convert to Standard React Components (Recommended)
Convert `@repo/ui` components to use standard React/web primitives. This will:
- ✅ Remove need for react-native-web in web app
- ✅ Simplify the codebase
- ⚠️ Break native app compatibility (will need separate solution)

### Option B: Platform-Specific Implementations
Create separate implementations for web and native:
- Keep `@repo/ui` for native (React Native)
- Create `@repo/ui-web` for web (standard React)
- More complex but maintains both platforms

**This plan follows Option A** (convert to standard React).

## Step-by-Step Implementation Plan

### Phase 1: Convert UI Components

#### Step 1.1: Convert Button Component
**File**: `packages/ui/src/button.tsx`

**Current Implementation**:
- Uses `Pressable` from react-native
- Uses `Text` from react-native
- Uses `StyleSheet.create()` from react-native
- Uses `GestureResponderEvent` type

**New Implementation**:
- Replace `Pressable` with `<button>` or custom button component
- Replace `Text` with `<span>` or styled text
- Replace `StyleSheet.create()` with CSS modules, styled-components, or inline styles
- Replace `GestureResponderEvent` with `React.MouseEvent<HTMLButtonElement>`

**Changes Required**:
```typescript
// Before
import { Pressable, Text, StyleSheet } from "react-native";
export interface ButtonProps {
  onClick?: (event: GestureResponderEvent) => void;
}

// After
import * as React from "react";
export interface ButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}
```

#### Step 1.2: Update Button Styling
Convert StyleSheet to CSS or inline styles:
- Option 1: Use CSS modules (create `button.module.css`)
- Option 2: Use inline styles with React
- Option 3: Use a CSS-in-JS solution

**Recommended**: CSS modules for better performance and maintainability.

### Phase 2: Update Package Dependencies

#### Step 2.1: Update @repo/ui/package.json
- Remove `react-native` from dependencies (or make it optional/peer dependency)
- Update React version to match web app (19.2.3)
- Update `@types/react` to match

#### Step 2.2: Update apps/web/package.json
- Remove `react-native-web` from dependencies
- Remove `babel-plugin-react-native-web` from devDependencies

#### Step 2.3: Update apps/native/package.json (Optional)
- Consider if `react-native-web` is still needed for Expo web support
- If native app doesn't use web features, can remove it

### Phase 3: Remove Configuration

#### Step 3.1: Update apps/web/next.config.js
Remove all react-native-web related configuration:
- Remove webpack alias: `"react-native$": "react-native-web"`
- Remove turbopack alias: `"react-native$": "react-native-web"`
- Remove custom `.web.*` extensions (or keep if used for other purposes)

**Simplified config**:
```javascript
module.exports = {
  reactStrictMode: true,
  // Remove webpack config if not needed for other purposes
  // Remove turbopack config if not needed for other purposes
};
```

### Phase 4: Update Application Code

#### Step 4.1: Update apps/web/app/page.tsx
- Verify Button component API compatibility
- Update event handler types if changed from `GestureResponderEvent` to `React.MouseEvent`

#### Step 4.2: Handle apps/native (Breaking Change)
The native app will break if it uses `@repo/ui` components. Options:

**Option 1**: Create separate native-specific components
- Create `packages/ui-native` with React Native components
- Update native app to use `@repo/ui-native` instead

**Option 2**: Use platform-specific code in @repo/ui
- Use conditional exports or platform detection
- More complex but maintains single package

**Option 3**: Accept that native app needs separate UI library
- Document that @repo/ui is now web-only
- Native app should use React Native components directly

### Phase 5: Documentation and Cleanup

#### Step 5.1: Update README.md
- Remove references to react-native-web
- Update description of `@repo/ui` package
- Update description of `web` app

#### Step 5.2: Update package.json root name (Optional)
- Consider renaming from `with-react-native-web` to something more appropriate

### Phase 6: Testing and Verification

#### Step 6.1: Build and Test Web App
- Run `bun run build` in apps/web
- Verify no build errors
- Test Button component functionality
- Verify styling works correctly

#### Step 6.2: Test Native App (if still using shared UI)
- If native app uses @repo/ui, test and fix breaking changes
- Or document that native app needs separate UI components

## Detailed Implementation Steps

### 1. Convert Button Component

**File**: `packages/ui/src/button.tsx`

**Create CSS module**: `packages/ui/src/button.module.css`
```css
.button {
  max-width: 200px;
  text-align: center;
  border-radius: 10px;
  padding: 14px 30px;
  font-size: 15px;
  background-color: #2f80ed;
  border: none;
  cursor: pointer;
  color: white;
}

.button:hover {
  background-color: #2563eb;
}

.button:active {
  background-color: #1d4ed8;
}
```

**Updated TypeScript**:
```typescript
import * as React from "react";
import styles from "./button.module.css";

export interface ButtonProps {
  text: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function Button({ text, onClick }: ButtonProps) {
  return (
    <button className={styles.button} onClick={onClick}>
      {text}
    </button>
  );
}
```

### 2. Update Package Dependencies

**packages/ui/package.json**:
```json
{
  "dependencies": {
    "react": "^19.2.3"
  },
  "devDependencies": {
    "@types/react": "^19.2.7"
  }
}
```
Remove `react-native` dependency.

**apps/web/package.json**:
Remove:
- `"react-native-web": "^0.19.10"`
- `"babel-plugin-react-native-web": "^0.19.10"`

### 3. Simplify next.config.js

**apps/web/next.config.js**:
```javascript
module.exports = {
  reactStrictMode: true,
};
```

### 4. Update tsup.config.ts (if needed)

Check if `packages/ui/tsup.config.ts` needs updates for CSS module handling.

## Breaking Changes

1. **Native App Compatibility**: The native app will no longer be able to use `@repo/ui` components if they're converted to web-only. This is a breaking change.

2. **Button API**: Event handler type changes from `GestureResponderEvent` to `React.MouseEvent<HTMLButtonElement>`. This should be mostly compatible but TypeScript types will differ.

3. **Styling**: StyleSheet API is replaced with CSS modules or inline styles. Visual appearance should remain similar but implementation differs.

## Rollback Plan

If issues arise:
1. Keep a git branch with react-native-web implementation
2. Revert package.json changes
3. Restore next.config.js aliases
4. Revert Button component changes

## Estimated Effort

- **Button component conversion**: 30 minutes
- **Dependency updates**: 15 minutes
- **Config cleanup**: 10 minutes
- **Testing and fixes**: 30-60 minutes
- **Native app handling**: 1-2 hours (if needed)

**Total**: 2-4 hours depending on native app requirements

## Notes

- The native app (`apps/native`) currently uses `react-native-web` for Expo web support. This can remain if the native app needs web functionality, but it's separate from the Next.js web app.
- Consider whether the monorepo structure should maintain shared UI components or have platform-specific implementations.
- This migration aligns with Next.js 16 best practices and removes the React 19 compatibility warning with react-native-web.

