# Epic 01 — Auth Redesign

Status: pending

## Purpose

Replace the current "verify Firebase ID token on every request" pattern with a two-stage JWT auth system:

1. **Exchange**: Mobile sends Firebase ID token → `POST /api/auth/exchange` verifies it and returns a short-lived API access token (6h JWT) + a long-lived refresh token (60-day opaque token stored in DB).
2. **All subsequent requests**: Mobile sends `Authorization: Bearer <apiAccessToken>`. The middleware verifies the JWT locally (no Firebase network call).
3. **Refresh**: Mobile calls `POST /api/auth/refresh` with the refresh token to get a new access token + rotated refresh token.
4. **Revoke**: `POST /api/auth/revoke` invalidates the refresh token (logout).

Web admin keeps the existing cookie/session flow completely unchanged.

## Why this matters

- Eliminates per-request Firebase Admin SDK calls → lower latency, lower cost
- Refresh token rotation provides a DAU signal (each daily use rotates the token, leaving a DB timestamp)
- Decouples API auth from Firebase — future auth providers are easy to add
- `requireAdmin` stays simple: trust the `admin: true` claim in the JWT (set from Firebase custom claim at exchange time)

## Tasks

- [ ] 00 — DB refresh tokens table
- [ ] 01 — JWT utils package
- [ ] 02 — Auth exchange endpoint
- [ ] 03 — Auth refresh endpoint
- [ ] 04 — Auth revoke endpoint
- [ ] 05 — Swap auth middleware
- [ ] 06 — Public endpoints audit

## Notes

<!-- Running log of blockers, decisions, learnings -->
