# Shared Domain Package (packages/shared)

## Overview

Pure domain utilities, currency formatting, phone normalisation, Zod validation schemas, and TypeScript contracts shared between web and future mobile applications.

## Key files

| File | Owns |
|---|---|
| `package.json` | Shared package dependencies and test commands |
| `src/index.ts` | Package export entry point |
| `src/utils/money.ts` | Currency formatting and integer kobo arithmetic |
| `src/utils/phone.ts` | Phone normalisation to E.164 format |
| `src/schemas/` | Zod validation schemas and domain contracts |
| `tests/` | Unit and contract test suites |

## Commands

```bash
# Run unit and contract tests
pnpm --filter @atm/shared test

# Type check
pnpm --filter @atm/shared typecheck
```

## Conventions

- Pure domain logic with zero browser or server framework dependencies.
- Phone normalisation must convert inputs to E.164 (+234...).
- Money formatting produces Nigerian Naira (₦, en-NG) from integer kobo.

## Gotchas

- Do not import `@atm/web` or `@atm/db` into this package. It must remain pure and portable.

## Agent skills

- [zod-schema-validation](../../.agents/skills/zod-schema-validation/): `mindrally/skills`, Zod schema validation and type inference

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
