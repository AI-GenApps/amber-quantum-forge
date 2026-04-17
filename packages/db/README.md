# @repo/db

Database package with Drizzle ORM and Drizzle Kit for PostgreSQL schema management.

## Setup

1. Create a `.env` file in this directory (or at the project root) with your database connection string:

```env
DATABASE_URL=postgres://user:password@localhost:5432/dbname
```

2. Install dependencies (already done if you ran `bun install` at the root)

## Available Scripts

- `bun run db:generate` - Generate migration files from schema changes
- `bun run db:migrate` - Apply pending migrations to the database
- `bun run db:push` - Push schema changes directly to database (development only)
- `bun run db:studio` - Open Drizzle Studio for database exploration

## Usage

Import the database instance and schema in your application:

```typescript
import { db, users } from '@repo/db';

// Query example
const allUsers = await db.select().from(users);
```

## Schema

Define your database schema in `src/schema.ts`. The initial schema includes a `users` table as an example.

## Migrations

Migrations are stored in the `migrations/` directory. To create a new migration:

1. Modify `src/schema.ts`
2. Run `bun run db:generate` to generate migration files
3. Run `bun run db:migrate` to apply the migration




