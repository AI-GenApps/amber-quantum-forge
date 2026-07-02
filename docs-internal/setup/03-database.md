# 03 — Database

This project uses [Drizzle ORM](https://orm.drizzle.team/) with PostgreSQL.

## Recommended hosting

[Neon](https://neon.tech) — serverless Postgres with a free tier. Create a project and copy the connection string.

## Connection string format

Keep `DATABASE_URL` as the provider-supplied Postgres URI (for example from Neon, Supabase, or RDS).
Store the exact value only in deployment environment variables.

Set this as `DATABASE_URL` in `.env`.

## First-time setup

```bash
cd packages/db
bun run db:push
```

This applies the schema directly without generating migration files (suitable for a fresh database).

## After schema changes

```bash
cd packages/db
bun run db:generate   # generate SQL migration files
bun run db:push       # apply to database
```

## Viewing data

```bash
cd packages/db
bun run db:studio     # opens Drizzle Studio in browser
```

## Schema location

`packages/db/src/schema.ts` — defines all tables using Drizzle's TypeScript DSL.

Tables:
- `users` — application users
- `auth` — Firebase auth links
- `device_registrations` — push notification tokens
- `app_config` — freeform JSONB key-value config store
