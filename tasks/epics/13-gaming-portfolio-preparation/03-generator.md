---
epic: 13-gaming-portfolio-preparation
task: 03-generator
status: completed
commit_scope: gaming
depends_on: [01-registry, 02-tooling]
estimate: M
---

# Generate an independent game shell

## Implementation Checklist

- [x] Generate a generic Flutter iOS/Android app with its own identity and config.
- [x] Generate no game rules, assets, optional SDKs, or imports from another game.
- [x] Support a temporary output directory for smoke tests.
- [x] Validate generated paths, native targets, and app metadata.
- [x] Run a sixth-app generation smoke test in CI.

## Verification

- `bun run games:generate -- --id generated_sixth --title "Generated Sixth" --output <temporary-dir>`
- `bun run games:validate-generated -- --output <temporary-dir>`
