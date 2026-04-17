# @repo/db

[Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL. Requires `DATABASE_URL` env var.

## Schema (`src/schema.ts`)

- `users` — id, name, email, profilePictureUrl, timestamps
- `auth` — Firebase UID + provider linked to users
- `deviceRegistrations` — FCM tokens linked to users

## Commands

```bash
bun run db:generate   # generate migrations from schema changes
bun run db:migrate    # apply migrations
bun run db:push       # push schema directly (dev only)
bun run db:studio     # open Drizzle Studio
```

## Usage

```typescript
import { db, users } from '@repo/db';
const allUsers = await db.select().from(users);
```
