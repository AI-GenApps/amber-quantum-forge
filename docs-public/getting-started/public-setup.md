---
title: Public Setup
---

# Public Setup

This section is for the web-facing experience and the public API surface.

## Web UI

- Start web locally with `cd apps/web && bun run dev`.
- If the UI loads but actions fail, verify `.env` values for `DATABASE_URL`,
  `FIREBASE_*`, and `OPENAI_API_KEY`.

## Public API

- Base URL: `https://<your-domain>/api`
- Health check: `GET /health`
- OpenAPI: available from the internal docs for mobile client integrations.

## Environment sanity checks

- Run database migrations: `cd packages/db && bun run db:generate && bun run db:push`
- Ensure no service account path points to an empty file.
- Confirm JWT secret is present for API auth flows.
