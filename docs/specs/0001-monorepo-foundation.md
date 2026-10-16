# 0001. Monorepo Foundation and Data Architecture

**Date**: 2026-10-14  
**Status**: Accepted

## Summary

This specification records the core architecture and foundational setup for Ascent Transport Management (ATM Nigeria). The system runs as a TypeScript monorepo using pnpm and Turborepo. It couples a Next.js App Router web application with PostgreSQL on Neon serverless, managed through Drizzle ORM, and isolates pure domain logic in a shared package.

## Context

Ascent Transport Management provides intercity passenger transport and courier logistics across Nigerian corridors like Enugu to Abuja, Enugu to Lagos, and Lagos to Owerri. The service operates dedicated Toyota Sienna vehicles with five passenger seats each.

Engineering a transport and booking platform in Nigeria demands strict handling of domain invariants:
1. Currency calculations must never lose precision through floating point arithmetic errors.
2. Booking operations must prevent double booking of limited vehicle seats through concurrent transactions.
3. Communications and customer lookups depend on reliable Nigerian phone number formats.
4. Timezones must be recorded consistently in UTC while presenting local departures in West Africa Time (WAT).
5. The monorepo structure must allow sharing database schemas and business logic between the web application and future mobile applications.

## Requirements

**User stories**:
- As a customer, I want to view accurate trip schedules, fares, and seat availability so that I can reserve seats reliably.
- As a developer, I want shared domain schemas and database models so that client, server, and background jobs enforce the same rules.
- As a transport operations manager, I want seats locked during checkout so that two passengers cannot purchase the same seat on a Sienna vehicle.

**Acceptance criteria**:
- **AC-1**: Monorepo workspaces (`apps/web`, `packages/db`, `packages/shared`) build, lint, and type check cleanly from root commands.
- **AC-2**: Money is represented strictly as integer kobo across all database columns, API boundaries, and domain models. Floating point numbers for money are banned.
- **AC-3**: Dates and timestamps persist in UTC ISO-8601 in the database, with helpers converting to Africa/Lagos (WAT, UTC+1) for display.
- **AC-4**: Phone numbers normalize to E.164 (+234...) before database writes through pure shared utilities.
- **AC-5**: Database tables feature UUID primary keys, timestamps, and soft delete columns where applicable.
- **AC-6**: A partial unique index on `Ticket(trip_id, seat_no)` where status is in (`held`, `paid`, `checked_in`) guarantees zero double bookings at the database level.
- **AC-7**: Database migrations and initial seed scripts execute idempotently.
- **AC-8**: Web styling respects brand tokens, outlaws pulsing animations, and keeps section headings resting directly on backgrounds without badge or pill wrapping.

## Options considered

### Option 1: Polyrepo (separate repositories for web, mobile, and API)

Maintaining independent repositories for each application layer.

**Pros**:
- Independent deployment pipelines per repository.
- Smaller repository sizes.

**Cons**:
- Duplication of TypeScript types, database schemas, and validation logic.
- Cross repository changes require manual versioning and coordinated releases.

### Option 2: Integrated TypeScript Monorepo with Turborepo and pnpm (Chosen)

A unified repository containing `apps/web`, `packages/db`, and `packages/shared`, orchestrated by Turborepo.

**Pros**:
- Single source of truth for Drizzle schemas, Zod validation, and utility functions.
- Instant feedback across packages during refactoring.
- Fast cached builds and tests via Turborepo.
- Seamless code sharing with future React Native Expo applications.

**Cons**:
- Monorepo tooling setup requires disciplined package boundaries.

## Decision

**Chosen option**: Option 2: Integrated TypeScript Monorepo with Turborepo and pnpm.

The platform uses pnpm workspaces and Turborepo to manage `apps/web` (Next.js App Router), `packages/db` (Drizzle ORM with Neon PostgreSQL), and `packages/shared` (Zod schemas, currency, phone utilities, and tests).

**Implementation skills**: `drizzle-orm` (`mindrally/skills`, `.agents/skills/drizzle-orm/`) · `turborepo` (`mindrally/skills`, `.agents/skills/turborepo/`) · `zod-schema-validation` (`mindrally/skills`, `.agents/skills/zod-schema-validation/`)

## Rationale

A transport management platform involves shared constraints across booking engines, payment webhooks, driver check-in, parcel tracking, and customer user interfaces. Duplicating schema definitions and currency math across separate repositories invites data divergence. Housing the Drizzle ORM definitions in `packages/db` and domain utilities in `packages/shared` guarantees that all applications share identical validation and database contracts.

## Architecture and Foundation Design

### Monorepo Structure

```
.
├── apps/
│   └── web/                   # Next.js 15, React 19, Tailwind CSS v4, Lucide icons
├── packages/
│   ├── db/                    # Drizzle ORM schema, Neon connection pooler, seed scripts
│   └── shared/                # Zod schemas, pure domain math, E.164 phone normalizer, tests
├── docs/
│   ├── PROJECT_CONTEXT.md     # Platform specifications and roadmap
│   ├── DESIGN_SYSTEM.md       # Color tokens, typography, and accessibility constraints
│   ├── scope/                 # Living feature scope
│   └── specs/                 # Architectural specifications
├── turbo.json                 # Turborepo task pipeline
└── pnpm-workspace.yaml        # Workspace package definitions
```

### Core Schema Sketch

1. `terminals`: 6 physical hubs (Enugu, Abuja, Lagos Jibowu, Lagos Ajah, Lagos Festac, Owerri).
2. `routes`: Origin and destination pairs with duration and distance estimates.
3. `vehicles`: Fleet inventory with 5 seat Toyota Sienna layouts.
4. `drivers`: Vetted commercial drivers and license records.
5. `schedules` & `trips`: Recurring templates and dated trip instances with real time availability.
6. `bookings` & `tickets`: Unique reference codes (`ATM-XXXXXX`), partial unique seat locks, and 15 minute hold expiries.
7. `payments`: Paystack ledger records with unique transaction references.
8. `parcels` & `parcel_events`: Courier shipments tracked by `ATM-EXP-XXXXXX` and custody audit events.
9. `users` & `staff_users`: Better Auth authentication with role separation (customer, staff).

## Build plan

- [x] Configure pnpm workspace and Turborepo pipeline configuration (AC-1)
- [x] Establish `@atm/shared` with kobo formatting and E.164 phone normalizer (AC-2, AC-3, AC-4)
- [x] Write shared contract tests and verify pure utilities (AC-1, AC-4)
- [x] Implement Drizzle ORM schemas with partial unique ticket constraint (AC-5, AC-6)
- [x] Build idempotent database seed script for terminals, routes, vehicles, and schedules (AC-7)
- [x] Scaffold Next.js App Router application in `apps/web` with layout shells and brand tokens (AC-8)

## Consequences

- All workspace code must consume `@atm/shared` for money and phone manipulation. Direct arithmetic on currency or custom phone regexes in application components is disallowed.
- Root dev preview scripts (`src/`, `vite.config.ts`) remain strictly for dev harnesses and must never be imported into production workspaces.
