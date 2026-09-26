---
title: Ludo Flutter Plan
---

# Ludo Flutter Plan

This document is a stub, created by task `15-ludo-launch/15` to record the
frozen HTTP contract surface as backend tasks land. Task 28
(`15-ludo-launch/28`) fills in the rest of this document (architecture,
handoff, release checklist).

## Contracts

Contract version: `ludo.v1` (`LUDO_CONTRACT_VERSION` in
`packages/api/src/games/ludo/contracts.ts`).

Frozen endpoint matrix so far:

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/games/ludo/:environment/session` | `Authorization: Bearer <API JWT>` | Exchanges an already-verified API access token (from `POST /api/auth/exchange`, Firebase UID as `sub`) for a short-lived `GAME_TOKEN_SECRET_LUDO_<ENV>`-signed game token with `role: "player"`. `:environment` must be one of `debug`, `staging`, `production`. Fails closed with `ludo_token_configuration_unavailable` (503) when the environment's game token secret, `GAME_TOKEN_ISSUER`, or `GAME_TOKEN_AUDIENCE` is not configured. |

Further routes (match create/join/command, matchmaking, rooms) are added by
tasks 17, 18, 20, and 21 to the same mounted Hono instance
(`createConfiguredLudoRoutes()` in `packages/api/src/games/ludo/routes.ts`).

See `packages/api/src/games/ludo/contracts.ts` for the full DTO and event
shapes (`LudoMatchSummary`, `LudoMatchState`, `LudoCommand`, `LudoEvent`),
`wire.ts` for the snake_case wire codecs, and `validation.ts` for inbound
validation.
