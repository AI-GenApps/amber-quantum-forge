# 09 — Expo Plugins

Expo plugins are Bun workspaces in `plugins/expo/<plugin-name>/`. Each plugin is an npm package named `@plugin/expo-<name>`.

## Plugin structure

```
plugins/expo/<plugin-name>/
  package.json           # name: "@plugin/expo-<name>"
  src/
    index.ts
  tsconfig.json
```

## Adding a plugin

1. Create the plugin directory and `package.json`.

2. Add to root `package.json` workspaces:

   ```json
   {
     "workspaces": [
       "apps/*",
       "packages/*",
       "plugins/expo/<plugin-name>"
     ]
   }
   ```

3. Run `bun install` to link the workspace.

4. Import in the Expo app:

   ```typescript
   import { someFunction } from "@plugin/expo-auth";
   ```

## Removing a plugin

1. Remove the workspace entry from root `package.json`.
2. Remove all imports in the Expo app.
3. Delete `plugins/expo/<plugin-name>/`.
4. Run `bun install`.

## Available plugins

| Plugin | Package | Purpose |
|---|---|---|
| auth | `@plugin/expo-auth` | Firebase Auth integration, token exchange, refresh |
| ai | `@plugin/expo-ai` | Chat hooks, streaming, AI client wrapper |
| chat-module | `@plugin/expo-chat-module` | Chat UI components, AsyncStorage persistence, sync |
