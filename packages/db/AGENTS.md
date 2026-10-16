# Database Package (packages/db)

## Overview

The database layer for Ascent Transport Management. It defines PostgreSQL schemas via Drizzle ORM, runs schema migrations against Neon serverless PostgreSQL, and provides idempotent database seeding.

## Key files

| File | Owns |
|---|---|
| `package.json` | Drizzle dependencies and migration scripts |
| `src/schema.ts` | Drizzle ORM table definitions and relations |
| `src/migrate.ts` | Migration execution script |
| `src/seed.ts` | Idempotent initial database seed script |

## Commands

```bash
# Generate schema migrations
pnpm --filter @atm/db db:generate

# Run migrations against database
pnpm --filter @atm/db db:migrate

# Seed database with initial data
pnpm --filter @atm/db db:seed

# Type check
pnpm --filter @atm/db typecheck
```

## Conventions

- Tables feature UUID primary keys, created_at, updated_at, and soft delete deleted_at flags where applicable.
- Money values are stored strictly as integer kobo. Never use floating point decimals in database columns.
- Partial unique index on Ticket table: `(trip_id, seat_no)` where status is in `held`, `paid`, or `checked_in`.

## Gotchas

- Driver and vehicle assignments must match the 5 passenger Toyota Sienna specification.
- Public registration for staff roles is disallowed. Staff users are provisioned exclusively by administrative management.

## Agent skills

- [drizzle-orm](../../.agents/skills/drizzle-orm/): `mindrally/skills`, Drizzle ORM schema design and query best practices

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
