# 0008. Client side browser routing and SEO head system

**Date**: 2026-10-14
**Status**: Accepted

## Summary

This specification defines the architecture for separate browser URL routing and dynamic search engine optimization metadata management. The application router will synchronize directly with browser location pathname and query strings using the HTML5 History API, enabling bookmarks, browser back and forward navigation, and direct access to individual URLs. In addition, an accessible document head manager will inject route specific titles, descriptions, canonical links, OpenGraph metadata, and structured data into the document head for every page.

## Context

Prior to this specification, the preview harness retained the route inside a local state variable that defaulted to the root slash path on every page load. When travelers clicked navigation links, the URL in the browser address bar remained stuck on the root address. If a user refreshed the browser while viewing corridors, terminals, or courier details, the application reinitialized to the home page, discarding their navigation state.

Furthermore, the document head contained only generic static tags from the initial HTML shell. Modern travel applications require distinct descriptive titles and meta descriptions for each destination, terminal, and service page. When sharing links on WhatsApp, Facebook, or Twitter, rich preview cards must display accurate information about Ascent Transport Management routes and schedules.

All established domain rules remain strictly preserved:
- Money values remain stored as integer kobo and formatted at the edge.
- Departure dates and timestamps remain computed in Africa/Lagos (WAT, UTC+1).
- Customer phone numbers normalize to E.164.
- Titles rest directly on section backgrounds without badge wrappers.
- No pulsing animations are permitted under any condition.
- Minimum touch targets of forty four pixels are enforced across all navigation links.

## Requirements

**User stories**:
- As a traveler, I want every page to have its own distinct URL so that I can bookmark corridors, share links with family, and use my browser back and forward buttons naturally.
- As a traveler, I want the browser tab title and description to change as I move between pages so that I clearly know which section or terminal I am viewing.
- As a search engine or social media platform, I want rich descriptive meta tags, OpenGraph cards, and structured JSON-LD schemas so that shared links render with accurate previews.

**Acceptance criteria**:
- **AC-1**: Navigating to any route updates the browser address bar immediately with `window.history.pushState`, preserving path and query parameters without full page reloads.
- **AC-2**: Direct page loads or browser refreshes on any valid path (e.g. `/routes`, `/terminals`, `/courier`, `/trips?from=Enugu&to=Abuja`) render that specific page immediately without resetting to the home page.
- **AC-3**: Browser back and forward button clicks trigger `popstate` event listeners, updating the rendered page to match the historic path.
- **AC-4**: A centralized SEO head component updates the document title, meta description, canonical link, and OpenGraph tags dynamically whenever the active route changes.
- **AC-5**: Each public corridor route (e.g. `/routes/enugu-abuja`) generates dynamic SEO metadata naming the origin terminal, destination terminal, and scheduled departure frequency.
- **AC-6**: Global click interception captures internal link clicks on standard anchor tags, routing them through client side navigation instead of causing hard browser reloads.
- **AC-7**: All metadata complies with web interface and search engine standards, maintaining accurate canonical URLs and valid JSON-LD schemas.

## Options considered

### Option 1: Native HTML5 History API routing with custom React 19 SEO head manager (Chosen)

In this approach, the router listens to the browser `popstate` event, initializes from `window.location.pathname + window.location.search`, and updates the URL using `window.history.pushState`. An SEO head manager component injects route specific metadata into the document head using React 19 native document metadata hoisting alongside an imperative document head updater for universal browser compatibility.

**Pros**:
- Zero additional external dependencies or React 19 peer dependency conflicts.
- Instant, smooth client side transitions with accurate browser address bar synchronization.
- Enables deep linking and direct page loads for all corridors, terminals, and admin screens.
- Completely unified with Next.js App Router metadata conventions.

**Cons**:
- Requires careful handling of query strings and dynamic route parameters.

### Option 2: Heavy external router and legacy React Helmet

In this approach, an external router library and legacy `react-helmet` package are installed.

**Pros**:
- Familiar third party abstraction.

**Cons**:
- Legacy `react-helmet` (v6) is incompatible with React 19 due to deprecated lifecycles and context APIs.
- Adds unnecessary bundle weight for routing capabilities already native to the browser and React 19.

## Decision

**Chosen option**: Option 1: Native HTML5 History API routing with custom React 19 SEO head manager.

We will equip `src/App.tsx` and a new `src/lib/router.ts` with HTML5 History API synchronization (`popstate`, `pushState`, global link interception) and build a dedicated `SEOHead` component in `apps/web/src/components/seo/SEOHead.tsx` with a rich route metadata dictionary.

**Implementation skills**: `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`), `web-design-guidelines` (`vercel-labs/agent-skills`, `.agents/skills/web-design-guidelines/`).

## Rationale

This approach provides immediate fidelity to standard web navigation without bundle bloat or React 19 incompatibilities. It ensures that refreshing any corridor, booking, or terminal screen keeps the user on their chosen page, while injecting rich social preview cards for every corridor and terminal in the Nigerian transport network.

## Feature design

**Routing architecture**:
- `RouterContext`: React context providing `currentPath`, `currentSearch`, and a typed `navigate(url, options)` function.
- `popstate` Listener: Listens for browser back/forward buttons and updates active path seamlessly.
- Global Click Interceptor: Intercepts clicks on internal anchor tags (`<a href="/...">`) to perform client side navigation without full page reloads.

**Route SEO dictionary**:
| Route | Page Title | Meta Description |
|---|---|---|
| `/` | Ascent Transport | 5-Passenger Toyota Sienna Travel Across Nigeria | Intercity passenger transport, courier parcels, and vehicle charter between Enugu, Abuja, Lagos, and Owerri. |
| `/trips` | Search Scheduled Departures | Ascent Transport | Real time Sienna seat availability, departure times, and fixed fares for Nigerian travel corridors. |
| `/routes` | Scheduled Corridors & Fares | Ascent Transport | View fixed daily Sienna departures and kobo fares connecting South-East terminals and Abuja. |
| `/terminals` | Terminal Locations & Desks | Ascent Transport | Addresses, helplines, and GPS coordinates for Ascent terminals in Enugu, Utako, Jibowu, Ajah, and Owerri. |
| `/courier` | Express Parcel Delivery & Waybills | Ascent Transport | Fast terminal to terminal courier services with real time waybill tracking across Nigerian cities. |
| `/track` | Live Parcel Tracking | Ascent Transport | Track your luggage or waybill status in real time across the Ascent transport network. |
| `/charter` | Executive Sienna Vehicle Hire | Ascent Transport | Private 5-passenger Toyota Sienna vehicle charter for family travel, events, and VIP airport pickup. |
| `/about` | About Ascent Transport Management | Our executive Toyota Sienna fleet, safety standards, speed limiters, and punctual schedule commitment. |
| `/contact` | Customer Helplines & Desks | Ascent Transport | Direct phone numbers, terminal addresses, and support channels for customer inquiries and bookings. |
| `/faq` | Frequently Asked Questions | Ascent Transport | Answers regarding 5-passenger seat capacity, 10-minute hold rules, luggage limits, and refunds. |

## Build plan

1. Create `apps/web/src/components/seo/SEOHead.tsx` with route SEO dictionary, OpenGraph tags, canonical links, and React 19 document head updates, satisfies **AC-4**, **AC-5**, **AC-7**.
2. Create `src/lib/router.ts` and update `src/App.tsx` to initialize from `window.location.pathname + window.location.search`, handle `pushState`, listen to `popstate`, and intercept internal links, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-6**.
3. Integrate `SEOHead` across all page routes and verify dynamic document titles on navigation, satisfies **AC-4**, **AC-5**.
4. Test direct URL loading on multiple paths (`/routes`, `/terminals`, `/courier`, `/trips`) and verify browser back and forward navigation, satisfies **AC-1**, **AC-2**, **AC-3**.

## Consequences

**Positive**:
- Every page now has a dedicated, shareable, bookmarkable URL.
- Browser back and forward buttons work naturally.
- Page reloads preserve the active view and query parameters.
- Search engines and social share crawlers receive rich, customized titles and metadata for every corridor and terminal.

**Negative / tradeoffs**:
- None. Fully backward compatible with existing component props.

**Neutral**:
- Vite dev server already supports single page application fallback, serving `index.html` for any URL path.

## References

**Project sources**:
- `src/App.tsx`
- `src/route-map.tsx`
- `apps/web/src/lib/seo.ts`
- `docs/specs/0004-segmented-hero-and-main-page-redesign.md`
