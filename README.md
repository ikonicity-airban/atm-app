# Ascent Transport Management (ATM Nigeria)

**"Travel Safe and Fast."** &bull; [atmnigeria.com](https://atmnigeria.com) &bull; Founded 2019

Production platform scaffold for Ascent Transport Management: intercity passenger transport (Toyota Sienna 5-passenger fleet with A/C and extra legroom), express courier & parcel delivery, and corporate group bookings.

---

## Architecture Overview

This project is structured as a high-performance monorepo:

- **`apps/web`**: Next.js App Router application with Tailwind CSS, shadcn/ui primitives, TanStack Query, and TanStack Table.
- **`packages/db`**: PostgreSQL (Neon) schema via Drizzle ORM, initial SQL migration, and idempotent seed script.
- **`packages/shared`**: Shared Zod schemas, TypeScript domain types, integer kobo monetary utilities, E.164 phone normalisation, and pure cancellation fee calculator with unit tests.
- **`docs/PROJECT_CONTEXT.md`**: Complete architectural rules, data model specification, design bans, and phase roadmap.
- **`src/*`, `vite.config.ts`, `metadata.json`**: [DEV-PREVIEW ONLY] Dev harness for previewing App Router components in environments without active Next.js server runtimes. They must never be imported by `apps/web`.

---

## Getting Started

### 1. Prerequisites
- Node.js >= 20.x
- pnpm >= 9.x

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure you provide a valid Neon `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `PAYSTACK_SECRET_KEY`.

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Database Setup & Seed
Apply schema migrations and run the idempotent seed script:
```bash
# Verify migrations
pnpm db:migrate

# Seed real terminals, routes, vehicles, drivers, and 7 days of trips
pnpm db:seed
```

### 5. Running the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Workspace Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Starts dev server on port 3000 |
| `pnpm build` | Compiles application for production |
| `pnpm lint` | Runs TypeScript lint checks across workspace |
| `pnpm typecheck` | Validates strict TypeScript compilation (`noUncheckedIndexedAccess`) |
| `pnpm test` | Executes unit tests for shared utils and pure business logic |
| `pnpm db:migrate` | Runs database migrations |
| `pnpm db:seed` | Runs idempotent database seeding script |

---

## Core Domain Rules

1. **Integer Kobo Everywhere:** All fares, charges, and refunds are stored as integer kobo. Formatted only at the UI edge as `₦` via `formatNaira()`.
2. **Normalized Phone Numbers:** All customer and staff phone numbers are normalized to E.164 format (`+234...`) via `normalisePhone()`.
3. **No Pulse Animation:** `animate-pulse` is strictly banned across the entire codebase.
4. **Hero Typography:** Hero titles are plain typography on the background; never wrapped in badges or pills.
5. **Role-Based Access Control:** Staff accounts are provisioned exclusively by administrative management; public self-registration for staff is forbidden.


> AXtcJ2f4KsvTv0Lj