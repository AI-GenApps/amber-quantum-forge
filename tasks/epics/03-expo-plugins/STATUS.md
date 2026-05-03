# Epic 03 — Expo Plugins

Status: pending

## Purpose

Create three TypeScript plugin packages under `plugins/expo/` that encapsulate auth, AI chat, and chat UI concerns for the Expo app. Each plugin is a bun workspace named `@plugin/expo-*`.

The Expo app (epic 04) will import from these plugins. Keeping them separate means they can be removed without touching the main app — just remove the workspace entry and the import.

## Plugin architecture

Each plugin follows this structure:
```
plugins/expo/<name>/
  package.json          # name: "@plugin/expo-<name>"
  tsconfig.json
  src/
    index.ts            # re-export barrel
    ...                 # feature-specific files
```

## Tasks

- [ ] 00 — @plugin/expo-auth
- [ ] 01 — @plugin/expo-ai
- [ ] 02 — @plugin/expo-chat-module

## Notes

<!-- Running log of blockers, decisions, learnings -->
