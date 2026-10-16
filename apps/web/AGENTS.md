# Web Application (apps/web)

## Overview

The primary customer and staff user interface for Ascent Transport Management. It handles ticket booking, parcel shipment booking, public tracking, and terminal operations built on Next.js App Router and React 19.

## Key files

| File | Owns |
|---|---|
| `package.json` | Next.js application dependencies and workspace scripts |
| `src/app/` | App Router pages, layouts, and route handlers |
| `src/components/` | Reusable user interface components and primitives |
| `src/lib/env.ts` | Server and client environment variable schema validation |
| `src/server/` | Server repositories, payment clients, and notifications |

## Commands

```bash
# Start local dev server for web
pnpm --filter @atm/web dev

# Build production bundle
pnpm --filter @atm/web build

# Run linting
pnpm --filter @atm/web lint

# Type check
pnpm --filter @atm/web typecheck
```

## Conventions

- Built with Next.js App Router, React 19, and Tailwind CSS v4.
- All pages and layouts live in `apps/web/src`. The root `src/` folder is strictly for dev preview harness and must not be imported.
- No animate-pulse or pulsing skeleton loaders anywhere. Use static neutral placeholders.
- Page and section titles sit directly on section backgrounds, never wrapped inside badge or pill containers.
- Form inputs validate client side for instant feedback and always validate server side with Zod before mutation.
- Design system: build all UI to docs/DESIGN_SYSTEM.md; token values live in CSS.

## Gotchas

- Display dates and times in Africa/Lagos (WAT, UTC+1). The database stores UTC.
- Seat selection holds are valid for 15 minutes only before automatic release.

## Agent skills

- [vercel-react-best-practices](../../.agents/skills/vercel-react-best-practices/): `vercel-labs/agent-skills`, Next.js and React performance optimization guidelines
- [vercel-composition-patterns](../../.agents/skills/vercel-composition-patterns/): `vercel-labs/agent-skills`, scalable component composition and React 19 patterns
- [web-design-guidelines](../../.agents/skills/web-design-guidelines/): `vercel-labs/agent-skills`, UI design and accessibility guidelines
- [tailwindcss](../../.agents/skills/tailwindcss/): `mindrally/skills`, Tailwind CSS utility-first styling patterns

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
