# 0020. SEO landing pages and launch preparation

**Date**: 2026-10-16
**Status**: Proposed

## Summary

This specification defines dedicated public travel corridor landing pages, automated search engine sitemaps, structured data schemas, social sharing preview cards, and production edge security headers for Ascent Transport Management. It gives travelers searching Google for intercity travel in Nigeria (such as "Enugu to Abuja bus" or "Lagos to Benin transport") direct landing hubs with instant booking forms, live timetable schedules, terminal directions, and customer FAQs. It also hardens the Next.js application with strict HTTP security headers, production health checks, and crawler access controls prior to live launch.

## Context

Ascent Transport Management operates Toyota Sienna fleets across twelve core intercity travel corridors in Nigeria. Travelers currently discover trips through the root search hero or direct word of mouth. However, organic search queries for Nigerian intercity travel follow specific route patterns such as "Abuja to Enugu transport fare" or "Benin to Lagos Sienna booking". Without dedicated, statically generated or revalidated corridor landing pages, search engines cannot index specific routes, causing potential passengers to bounce to legacy bus operators.

In addition, launch readiness demands verified crawl directives and production security hardening. Private administrative interfaces under `/admin`, customer profile dashboards under `/account`, and private API endpoints under `/api` must be strictly shielded from public search engine indexes. Furthermore, payment transactions through Paystack and ticket QR code presentations require Content Security Policy directives and HTTP transport headers to prevent cross site scripting, iframe hijacking, and clickjacking attacks.

Without this slice, organic search discovery remains limited to the home page, social shares on WhatsApp lack dynamic branded previews, uptime monitors lack a deep health check endpoint, and the production site lacks defensive edge security headers.

## Requirements

**User stories**:
- As a traveler searching Google for trips between Nigerian cities, I want a dedicated corridor page with departure schedules, starting fares, terminal addresses, and customer FAQs so that I can evaluate and book my trip directly.
- As a traveler sharing a corridor link on WhatsApp or Twitter, I want a rich Open Graph preview card with route details and starting fares so that companions see trip information immediately.
- As a search crawler, I want an accurate XML sitemap and robots directives so that I index public travel routes efficiently without crawling private account or administrative panels.
- As an operations engineer, I want a healthcheck endpoint and verified security headers so that uptime monitoring tools and browser security audits confirm platform readiness.

**Acceptance criteria**:
- **AC-1**: Dedicated corridor landing pages exist at `/routes/[corridor]` for all twelve supported travel routes (for example `/routes/enugu-abuja`, `/routes/lagos-benin`), rendering pre-filled trip search widgets, departure timetables, estimated journey durations, and starting fares in integer kobo formatted as Naira.
- **AC-2**: Each corridor landing page provides terminal pickup and drop off addresses, regional travel advisories, customer service contact numbers, and expandable FAQ accordions answering baggage allowances, check in cutoffs, and seat booking policies.
- **AC-3**: Each corridor page embeds valid JSON-LD structured data including BusTrip, BreadcrumbList, and FAQPage schemas, enabling rich search snippet presentation in Google Search.
- **AC-4**: Corridor routes feature dynamic Open Graph and Twitter preview cards generated on the edge via `opengraph-image.tsx`, displaying the corridor title, starting price in Naira, vehicle badge, and Ascent brand styling.
- **AC-5**: A dynamic `sitemap.ts` generates canonical XML sitemaps containing all twelve active corridor routes, primary marketing pages, terminal directories, parcel tracking, and legal terms with daily change frequency.
- **AC-6**: A dynamic `robots.ts` declares crawl rules allowing public routes while explicitly disallowing `/admin/`, `/account/`, and `/api/` paths, and referencing the canonical sitemap URL.
- **AC-7**: Production HTTP security headers configured in `next.config.ts` enforce HSTS (max age 63072000 seconds), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, and Paystack approved Content Security Policy directives.
- **AC-8**: Dedicated `/api/health` endpoint responds with HTTP 200, system uptime, UTC timestamp, version commit hash, and active database connectivity verification.

## Options considered

### Option 1: Dynamic corridor hubs with Next.js edge metadata and sitemaps (Recommended)

Build dedicated corridor pages under `/routes/[corridor]` backed by static generation and incremental revalidation, using Next.js Metadata API, `opengraph-image.tsx`, and dynamic `sitemap.ts`.

**Pros**:
- High organic search discovery tailored to exact Nigerian city pair search queries.
- Instant booking widget preselects origin and destination terminals, removing friction for high intent travelers.
- Fully automated sitemaps update dynamically as new routes or terminals activate without manual maintenance.
- Edge rendered Open Graph images guarantee sharp social preview cards on WhatsApp and Twitter.

**Cons**:
- Requires twelve distinct corridor content records with verified travel advisories and FAQs.

### Option 2: Generic search page with client side query parameters

Rely on `/trips?from=[origin]&to=[destination]` with client side meta tags and canonical tags.

**Pros**:
- Reuses existing search results page without creating a new route folder.

**Cons**:
- Poor organic search crawlability because search engine bots prioritize clean semantic URL paths over query strings.
- Social sharing cards on chat apps like WhatsApp cannot easily generate route specific preview graphics from client parameters.
- Less space for rich editorial content like terminal directions, travel guides, and FAQ schemas.

### Option 3: Static HTML pages generated outside the Next.js application

Host corridor landing pages on an external content management system or static documentation site.

**Pros**:
- Decouples marketing copy from the main Next.js web application code.

**Cons**:
- Breaks UI styling consistency, navigation menus, and design token integration.
- Cannot embed the live React booking search widget or query real time integer kobo fares directly from shared repositories.
- Adds deployment overhead and split domain management.

## Decision

**Chosen option**: Option 1: Dynamic corridor hubs with Next.js edge metadata and sitemaps.

We will create dedicated route pages under `/routes/[corridor]`, dynamic sitemaps, robots directives, structured JSON-LD data, edge generated Open Graph preview images, and production security headers.

**Implementation skills**: `coss` (`cosscom/ui`, `.agents/skills/coss/`) · `improve-ui` (`ibelick/ui-skills`, `.agents/skills/improve-ui/`) · `vercel-react-best-practices` (`vercel/engineering`, `.agents/skills/vercel-react-best-practices/`)

## Rationale

Nigerian intercity travel decisions begin with high intent searches on mobile phones. Travelers searching for "Enugu to Abuja transport" want immediate reassurance regarding safety, terminal location, price, and departure times. A dedicated corridor hub provides both the technical SEO structure Google demands (clean URLs, breadcrumbs, FAQ schema, BusTrip metadata) and the high conversion user experience passengers expect (prefilled booking form, clear starting fares, and terminal maps).

Using Next.js App Router built in primitives (`generateMetadata`, `sitemap.ts`, `robots.ts`, and `ImageResponse` inside `opengraph-image.tsx`) allows us to achieve rich SEO performance without adding external libraries, keeping bundle sizes minimal and maintenance straightforward.

## Feature design

### Data model sketch

Corridor metadata and content are defined as structured domain records in shared packages or server repositories:

```typescript
export interface CorridorSEOProfile {
  slug: string; // e.g. "enugu-abuja"
  originCity: string; // "Enugu"
  originTerminalId: string; // "enu-01"
  destinationCity: string; // "Abuja"
  destinationTerminalId: string; // "abj-01"
  distanceKm: number; // 430
  estimatedDurationHours: number; // 6.5
  startingFareKobo: number; // 3200000 (integer kobo)
  headline: string;
  travelAdvisory: string;
  popularPickupPoints: string[];
  departureSchedules: {
    time: string; // "06:30 AM WAT"
    serviceTier: "Standard Sienna" | "Executive Sienna";
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
}
```

### State transitions

Corridor landing pages and SEO endpoints are read only surfaces. No mutable state machine is required.

### API surface

| Endpoint / Route | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/routes/[corridor]` | GET | corridor: slug | HTML page, JSON-LD, prefilled search | Public | 404 for unknown route |
| `/routes/[corridor]/opengraph-image` | GET | corridor: slug | PNG image (1200x630) | Public | 404 fallback |
| `/sitemap.xml` | GET | none | XML sitemap index | Public | 500 generation error |
| `/robots.txt` | GET | none | Text robots directives | Public | none |
| `/api/health` | GET | none | JSON health and database connectivity | Public | 503 if database down |

### Value sourcing

| Action | Value produced / displayed | Source |
|---|---|---|
| Corridor page render | Origin and destination city names | Corridor profile registry matched by slug param |
| Corridor page render | Starting fare formatted in Naira | `startingFareKobo` integer kobo formatted via `formatNaira` |
| Corridor page render | Departure schedule options | Corridor profile schedule array |
| Corridor page render | Terminal physical addresses | `TERMINALS` constant in `@atm/shared` matched by terminal ID |
| Corridor page render | JSON-LD BusTrip schema | Computed from corridor profile and terminal coordinates |
| Corridor page render | JSON-LD FAQPage schema | Transformed from corridor `faqs` list |
| Open Graph image | Route name and starting fare badge | Corridor profile data rendered via `ImageResponse` |
| Sitemap generation | Last modified timestamp | Build time UTC ISO string or current day |
| Healthcheck check | Database status string | Active `SELECT 1` query via Neon PostgreSQL connection |

### Key invariants

- Starting fares are strictly stored as integer kobo and formatted at the edge via `formatNaira`.
- Slugs follow lowercase kebab case city pair format: `[origin]-[destination]`.
- Reverse corridor lookup (for example `abuja-enugu` vs `enugu-abuja`) returns its own distinct directional profile.
- Robots directives must strictly block crawler access to `/admin/`, `/account/`, and `/api/`.
- All canonical URLs must use the production domain `https://atm.ng` or configured base URL environment variable.

### Security model

Corridor pages, sitemaps, robots directives, and healthcheck routes are publicly accessible without authentication. Public endpoints enforce rate limiting to prevent scraper abuse. HTTP security headers configured in `next.config.ts` enforce strict browser protections:
- `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options`: `DENY`
- `X-Content-Type-Options`: `nosniff`
- `Referrer-Policy`: `strict-origin-when-cross-origin`
- `Permissions-Policy`: `camera=(self), geolocation=(), microphone=()`
- `Content-Security-Policy`: permits scripts from self and Paystack checkout (`https://js.paystack.co`), styles from self with unsafe inline for CSS in JS and Tailwind, connections to self and Paystack APIs, and frames to Paystack modal popups.

### Configuration required

- `NEXT_PUBLIC_APP_URL`: Base production URL for canonical link generation (default `https://atm.ng`).
- `VERCEL_GIT_COMMIT_SHA`: Optional commit hash exposed in the `/api/health` payload for release verification.

### Critical test scenarios

- Happy path: User visits `/routes/enugu-abuja`, page renders 200 OK with correct city titles, starting price in Naira, prefilled search card, and embedded JSON-LD schemas, verifies **AC-1**, **AC-2**, **AC-3**.
- Open Graph generation: Edge route `/routes/enugu-abuja/opengraph-image` returns valid PNG content type with dimensions 1200x630, verifies **AC-4**.
- Sitemap integrity: Requesting `/sitemap.xml` returns valid XML containing all twelve corridor URLs and primary public routes, verifies **AC-5**.
- Crawler security: Requesting `/robots.txt` returns disallow rules for `/admin/`, `/account/`, and `/api/`, verifies **AC-6**.
- Security headers verification: Response headers contain HSTS, X-Frame-Options DENY, and nosniff, verifies **AC-7**.
- Healthcheck verification: Calling `/api/health` returns status ok, database connected, and valid UTC timestamp, verifies **AC-8**.
- Invalid corridor fallback: Requesting `/routes/unknown-city-pair` triggers Next.js `notFound()` rendering a 404 page with navigation links back to active corridors, verifies **AC-1**.

## Build plan

1. Define corridor SEO profiles and schema metadata in shared packages and web server repositories, satisfies **AC-1**, **AC-2**.
2. Implement JSON-LD generator helper producing BusTrip, BreadcrumbList, and FAQPage schemas, satisfies **AC-3**.
3. Build dynamic corridor landing page template under `apps/web/src/app/(public)/routes/[corridor]/page.tsx` with prefilled booking search widget, timetable, and FAQ accordions, satisfies **AC-1**, **AC-2**, **AC-3**.
4. Implement dynamic edge Open Graph image generator in `apps/web/src/app/(public)/routes/[corridor]/opengraph-image.tsx`, satisfies **AC-4**.
5. Implement dynamic `sitemap.ts` in Next.js App Router listing all corridors, marketing pages, and terminal guides, satisfies **AC-5**.
6. Implement `robots.ts` in Next.js App Router with strict disallow directives for private routes, satisfies **AC-6**.
7. Configure production HTTP security headers and Content Security Policy in `apps/web/next.config.mjs`, satisfies **AC-7**.
8. Implement production healthcheck endpoint in `apps/web/src/app/api/health/route.ts` with database ping, satisfies **AC-8**.
9. Write unit and contract tests verifying sitemap generation, corridor metadata resolution, schema validation, and health endpoint responses, satisfies **AC-1**, **AC-5**, **AC-6**, **AC-8**.

## Consequences

**Positive**:
- Direct organic search acquisition for top intercity travel queries across Nigeria.
- Enhanced click through rates on social media and messaging apps via dynamic Open Graph previews.
- Clear separation between public indexable corridors and private staff or customer routes.
- Robust security hardening protecting customer payment flows and terminal manifests.

**Negative / tradeoffs**:
- Maintaining editorial travel advisories and terminal directions requires periodic updates if terminal addresses or highway conditions change.
- Strict Content Security Policy must be maintained whenever new third party analytics or payment scripts are introduced.

**Neutral**:
- Corridor pages reuse existing search form and trip repository methods, avoiding redundant backend query logic.

## Follow-up

- [ ] Connect Google Search Console and Bing Webmaster Tools after deployment to submit `/sitemap.xml`.
- [ ] Add corridor links to the public site footer directory for internal link equity distribution.
