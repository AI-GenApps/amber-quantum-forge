---
epic: 13-gaming-portfolio-preparation
task: 12-api-isolation
status: completed
commit_scope: gaming
depends_on: [00-shared-contracts, 01-registry, 02-tooling]
estimate: L
---

# App-scoped API isolation foundation

## Implementation Checklist

- [x] Add signed issuer/audience/app/environment verification without changing legacy auth behavior.
- [x] Add app/environment storage namespaces, bounded versioned saves and explicit purchase/challenge/admin seams.
- [x] Add Hono negative tests for cross-app, cross-environment, forged, spoofed and legacy-admin access.
- [x] Record the API boundary and its unresolved service consumers in [the architecture record](../../../docs-internal/gaming/architecture).
- [x] Keep full per-game service MVP work assigned by the five handoff ledgers.

## Verification

- `bun run test`
- `bun run typecheck`
- `bun run check:ci`
- `bun run knip:ci`

## Acceptance

The API foundation rejects unauthorized cross-app access with real signed test tokens and does not treat a client `app_id` as authorization. It does not claim multiplayer, production storage, migrations, purchases or service settlement. Google Play/Android publication readiness still depends on each client and service owner’s app-specific gates.
