# 08 — iOS Plugins

iOS plugins are Swift packages in `plugins/ios/<plugin-name>/`. Each plugin is a self-contained SPM package.

## Plugin structure

```
plugins/ios/<plugin-name>/
  Package.swift          # SPM manifest
  Sources/
    <PluginName>/
      *.swift
  Tests/                 # optional
```

## Adding a plugin

1. Create `plugins/ios/<plugin-name>/Package.swift` with the package definition.

2. Add the package path to `apps-native/ios-app/Package.swift` dependencies:

   ```swift
   .package(path: "../../plugins/ios/<plugin-name>")
   ```

3. Add the target dependency in `apps-native/ios-app/project.yml`:

   ```yaml
   packages:
     <PluginName>:
       path: ../../plugins/ios/<plugin-name>
   targets:
     Starter:
       dependencies:
         - package: <PluginName>
           product: <PluginName>
   ```

4. Regenerate the Xcode project:

   ```bash
   cd apps-native/ios-app
   xcodegen generate
   ```

## Removing a plugin

1. Remove the `path:` entry from `Package.swift`.
2. Remove the `packages:` and `dependencies:` entries from `project.yml`.
3. Delete `plugins/ios/<plugin-name>/`.
4. Run `xcodegen generate`.

## Available plugins

| Plugin | Package | Purpose |
|---|---|---|
| auth | `plugins/ios/auth` | Apple/Google sign-in, Keychain, token refresh |
| ai | `plugins/ios/ai` | AICore, SSE parser, OnDeviceAI stub |
| chat-module | `plugins/ios/chat-module` | SwiftUI chat UI, SwiftData persistence, sync |
