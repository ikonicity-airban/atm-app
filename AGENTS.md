# Ascent Transport Management (ATM Nigeria)

## Stack

- **Language / Runtime**: TypeScript, Node 22
- **Framework**: Next.js (App Router), React 19
- **Key dependencies**: Drizzle ORM, Neon PostgreSQL, Tailwind CSS v4, Zod, Better Auth
- **Package manager**: pnpm (monorepo with Turborepo)

## Build approach

Tracer Bullet (vertical end to end slices, thin but complete through every layer).

## Commands

```bash
# Install dependencies
pnpm install

# Start local dev server
pnpm dev

# Build all applications and packages
pnpm build

# Run tests across workspaces
pnpm test

# Type check
pnpm typecheck
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

## Rules

- Money is stored as integer kobo everywhere, never floating point numbers. Format at the user interface edge only.
- Timestamps and dates are saved in UTC ISO-8601, displayed in Africa/Lagos WAT (UTC+1).
- Customer phone numbers normalize to E.164 (+234...) on write.
- Server side Zod validation is required on all mutations.
- No animate-pulse or pulsing animations anywhere, use static placeholders instead.
- Titles rest directly on section backgrounds, never wrapped in badges, pills, or cards.
- Respect prefers-reduced-motion at all times.

## Agent skills

- [architect](.agents/skills/architect/): `jsmastery-pro/skills`, designs architecture specs and features in docs/specs/
- [audit](.agents/skills/audit/): `jsmastery-pro/skills`, writes tool agnostic AGENTS.md context files
- [check](.agents/skills/check/): `jsmastery-pro/skills`, verifies behavior against specs and code review
- [debug](.agents/skills/debug/): `jsmastery-pro/skills`, minimal fix and regression test
- [develop](.agents/skills/develop/): `jsmastery-pro/skills`, builds features from specs and AGENTS.md
- [document](.agents/skills/document/): `jsmastery-pro/skills`, human facing release notes and PR text
- [scope](.agents/skills/scope/): `jsmastery-pro/skills`, product planning in docs/scope/
- [sync](.agents/skills/sync/): `jsmastery-pro/skills`, keeps durable knowledge and AGENTS.md current
- [test](.agents/skills/test/): `jsmastery-pro/skills`, writes test suites
- [coss](.agents/skills/coss/): `cosscom/ui`, component knowledge, Base UI APIs, and Tailwind v4 token conventions
- [coss-particles](.agents/skills/coss-particles/): `cosscom/ui`, particle examples and real world composition patterns
- [turborepo](.agents/skills/turborepo/): `mindrally/skills`, Turborepo build pipeline and task runner
- [zod-schema-validation](.agents/skills/zod-schema-validation/): `mindrally/skills`, Zod schema validation and type inference
- [antigravity-design-expert](.agents/skills/antigravity-design-expert/): spatial depth, weightlessness, glassmorphism, 3D CSS transforms, and fluid GSAP transitions
- [ui-skills-root](.agents/skills/ui-skills-root/): `ibelick/ui-skills`, structural UI task router that activates targeted frontend design skills
- [improve-ui](.agents/skills/improve-ui/): `ibelick/ui-skills`, purges generic AI templates, enforces typography hierarchy, and manages design tokens
- [improve-animations](.agents/skills/improve-animations/): `emilkowalski/skills`, audits, refines, and implements spring physics and tactile micro-interactions
- [google-stitch](.agents/skills/google-stitch/): Google Stitch integration for design-to-code generation, Design DNA extraction, and MCP connectivity

## Context files

- [apps/web/AGENTS.md](apps/web/AGENTS.md) (Next.js web application and user interface)
- [packages/db/AGENTS.md](packages/db/AGENTS.md) (Database schema, migrations, and seeds with Drizzle ORM)
- [packages/shared/AGENTS.md](packages/shared/AGENTS.md) (Shared domain types, schemas, and utility functions)

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
