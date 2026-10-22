# 0026. Main Page RouteMate UI Redesign and Theme System

**Date**: 2026-10-18
**Status**: Proposed

## Summary

This specification redesigns the Ascent Transport Management main landing page to mirror the exact section structure and spatial hierarchy of the RouteMate design template. The system adopts light mode as the default experience while equipping theme tokens that support the deep obsidian dark aesthetic seen in the reference visual. Every section uses real Ascent Transport operations data, covering five seat executive Toyota Sienna departures, live integer kobo fare calculation, and instant seat reservation. This structure forms the design blueprint for the rest of the web application.

## Context

The current landing page provides functional value but lacks the high craft visual cohesion, modern spatial depth, and streamlined information flow of contemporary transport booking platforms. The user provided an exact reference design template featuring an elevated hero with a floating search island, service pillars, a three step booking guide, an asymmetrical bento destination gallery, a smart ticketing and quick checkout split preview, a mobile experience showcase, verified customer reviews, and a comprehensive footer.

The redesign must preserve all core business rules of the platform:
1. Money is stored and computed in integer kobo only, never floating point numbers.
2. Departures run exclusively with five passenger executive Toyota Sienna vehicles across active Nigerian corridors connecting Enugu, Abuja, Lagos, and Owerri.
3. Light mode must be the default visual presentation, with clean theme tokens that allow full rendering of the dark obsidian neon palette.
4. No pulsing placeholders or generic artificial intelligence layouts are permitted.

## Requirements

**User stories**:
- As a traveler visiting Ascent Transport, I want an intuitive and visually captivating homepage where I can search scheduled departures, explore popular Nigerian corridors, calculate trip fares, and hold a seat in one click.
- As an executive commuter, I want to understand the punctuality, air conditioning, and legroom advantages of five passenger Toyota Siennas compared to crowded commercial buses.
- As a logistics client, I want quick access to parcel courier waybills and dedicated vehicle charter options directly from the primary navigation and service grid.

**Acceptance criteria**:
- **AC-1**: Exact Section Structure. The main page at `apps/web/src/app/(public)/page.tsx` must faithfully implement the nine sequential sections from the reference template: Top Navigation, Hero Search Showcase, Trust Partner Strip, Four Pillar Services Grid, How It Works Three Step Guide, Trending Destinations Bento Gallery, Smart Ticketing and Live Checkout Split, Mobile Experience Banner, Loved by Travelers Reviews Grid, and Multi Column Footer.
- **AC-2**: Theme System with Light Mode Default. The page styles must use semantic design tokens (`bg-background`, `text-foreground`, `border-border`, `surface-card`, `accent-brand`) configured so that light mode is the clean default presentation, while fully supporting the dark obsidian palette with neon purple and magenta glows.
- **AC-3**: Floating Hero Search Island. The hero search card must support trip mode selection (One Way, Round Trip, Private Charter), city selects with an inline swap control, date picker, passenger counter, and a primary search button wired directly to the trips query engine.
- **AC-4**: Real Operational Data. All corridor cards, airport and terminal codes (ENU, ABJ, LAG, IMO), departure frequencies, and starting prices must reflect real integer kobo amounts (e.g. 3,200,000 kobo for ₦32,000 Enugu to Abuja).
- **AC-5**: Interactive Smart Ticketing and Quick Checkout. The split section must feature an authentic digital boarding pass graphic on the left (showing passenger name, seat assignment, route, date, and verifiable QR code) and an interactive live fare calculator on the right that computes total kobo fares and launches seat hold checkout for the chosen corridor.
- **AC-6**: Asymmetrical Bento Route Grid. The trending destinations section must display seven real corridors in an asymmetrical bento layout (one large featured corridor card, two medium corridor cards, and four compact corridor cards), each with photography, route badges, distance or duration, and a direct booking link.
- **AC-7**: Accessibility and Interaction Standards. All interactive buttons and inputs must meet the minimum forty four pixel touch target size. All section headings must apply `text-balance` and body copy must apply `text-pretty`. Pulsing animations are strictly prohibited.
- **AC-8**: Monorepo and Git Discipline. All work must build cleanly with `pnpm --filter web build` with zero regressions on existing unit tests, pushed to origin under the `ui-modified` branch.

## Options considered

### Option 1: Hardcoded Dark Obsidian Landing Page

Clone the template image directly with fixed dark purple and black background colors (`#0b0716`), scoped exclusively to the homepage without theme configuration.

**Pros**:
- Fast to assemble since colors match the image hex values directly.

**Cons**:
- Violates the user requirement that light mode must be the default presentation.
- Makes the code rigid and difficult to propagate to the rest of the application.

### Option 2: Tokenized Multi Mode Architecture with Default Light Mode (Chosen)

Build the exact structure and component layout of the template using semantic theme tokens and tailored Tailwind classes that default to a crisp, high craft light mode (clean white surfaces, slate borders, and deep magenta accents), while seamlessly rendering the obsidian neon aesthetic in dark mode.

**Pros**:
- Satisfies the user requirement for default light mode while honoring the template design structure.
- Establishes a reusable set of layout primitives and tokens that propagate easily across `/trips`, `/routes`, and `/terminals`.
- Supports the live interactive checkout widget with real time integer kobo math.

**Cons**:
- Requires careful optical calibration of contrast and border translucency across both light and dark states.

## Decision

**Chosen option**: Option 2: Tokenized Multi Mode Architecture with Default Light Mode.

The homepage will follow the exact nine section flow from the template image, styled with modern semantic tokens that present light mode by default and provide instant dark mode fidelity.

**Implementation skills**: `improve-ui` (`ibelick/ui-skills`, `.agents/skills/improve-ui/`), `ui-skills-root` (`ibelick/ui-skills`, `.agents/skills/ui-skills-root/`), `coss` (`cosscom/ui`, `.agents/skills/coss/`), `antigravity-design-expert` (`.agents/skills/antigravity-design-expert/`).

## Rationale

The user explicitly requested that the structure of the RouteMate template be copied exactly, while using accurate Ascent Transport information and ensuring light mode is the default presentation. Option 2 meets every criteria: it preserves the exact optical layout, card hierarchy, bento distribution, and ticketing split from the template while building on a robust foundation that can be shared across all pages.

## Feature design

### Component and Section Architecture

1. **Top Navigation (`apps/web/src/components/layout/Navbar.tsx`)**:
   - Brand logo with executive transport badge
   - Navigation links: Corridors, Terminals, Courier Waybill, Fleet Charter, Manage Booking
   - Action controls: Theme toggle button, telephone dispatch link, and primary "Book a Seat" button

2. **Section 1: Hero Showcase & Floating Search Island**:
   - Status badge: `✦ Executive 5-Passenger Sienna Fleet`
   - Hero headline: `Your Journey Begins in One Click` with gradient highlight
   - Description copy explaining punctuality, comfort, and direct terminal departures
   - Hero search card:
     - Top trip mode tabs: `One Way`, `Round Trip`, `Private Charter`
     - Grid controls: Origin city, Destination city with floating swap button, Departure date, Passenger headcount
     - Submit button with search icon and live action
     - Bottom trust indicators: TrustScore 4.9 rating, Guaranteed 5-seat cabin, Fixed kobo fares

3. **Section 2: Trusted Operator & Station Strip**:
   - Banner highlighting verified daily departures connecting key Nigerian commercial hubs: Enugu Ogui, Abuja Utako, Lagos Jibowu, Lagos Ajah, and Owerri Control Post

4. **Section 3: Four Service Pillars (`Experience Seamless Travel`)**:
   - Card 1: 5-Passenger Cabin (Zero overcrowding, air conditioning, extra legroom)
   - Card 2: Express Courier (Same day terminal waybill registered and dispatched on next departure)
   - Card 3: Executive Charter (Private Sienna hire for corporate teams and family trips)
   - Card 4: GPS Safety & Telematics (Speed limiters, live tracking, and verified drivers)

5. **Section 4: How It Works Three Step Guide**:
   - Step 1: Search & Pick Corridor (View real time schedules, seat availability, and fixed kobo fares)
   - Step 2: Choose Exact Seat (Pick window or middle seat on the five seat vehicle layout)
   - Step 3: Instant Digital Pass (Pay securely via Paystack, receive SMS and digital QR ticket)

6. **Section 5: Trending Destinations Bento Gallery**:
   - Corridor filter pills: `All Corridors`, `Enugu ↔ Abuja`, `Lagos ↔ Enugu`, `Lagos ↔ Owerri`
   - Bento layout:
     - 1 Large Featured Card: Enugu to Abuja (7.5 hrs, from ₦32,000, 24 daily departures)
     - 2 Medium Cards: Lagos to Enugu and Abuja to Enugu
     - 4 Compact Cards: Lagos to Owerri, Owerri to Lagos, Enugu to Lagos, and Owerri to Abuja
     - Each card displays high resolution imagery, route badge, trip duration, starting fare in Naira, and booking link

7. **Section 6: Smart Ticketing & Live Checkout Split**:
   - Left side: Digital Boarding Pass Graphic
     - Origin code (ENU) to Destination code (ABJ), departure time in WAT, seat number (e.g. 2A Window), passenger name, and QR code graphic
   - Right side: Quick Checkout Calculator Widget
     - Corridor selector, travel date, seat count stepper, live kobo calculation breakdown (fare kobo, service fee, total kobo), and "Hold Seat & Proceed" button launching direct booking

8. **Section 7: Mobile Experience Banner (`Take Ascent Everywhere`)**:
   - Framed gradient card with dual smartphone mockups displaying the Ascent ticket screen and vehicle tracker
   - Bullet checkmarks: Paperless boarding pass, live GPS trip progress, and one click rescheduling
   - PWA badges: `Save to Home Screen` and `Fast Offline Access`

9. **Section 8: Loved by Travelers Reviews Grid**:
   - 3 High craft customer review cards with five star indicators, genuine commuter quotes, passenger photos, route traveled, and verified passenger tags

10. **Section 9: Multi Column Footer**:
    - Ascent brand identity and official transport licensing notice
    - Links for Corridors, Terminals, Services, Support, and Legal
    - Central dispatch telephone and WhatsApp support links

### Data Model and Value Sourcing

| Action | Value produced / displayed | Source |
|---|---|---|
| Hero Corridor Search | Origin and destination lists | `SERVED_CITIES` from `@atm/shared` |
| Hero Booking Action | Query parameter navigation | `onNavigate` or `/trips?from=...` |
| Bento Corridor Fares | Starting kobo prices | `STATIC_ROUTES` and `routeRepository` |
| Quick Checkout Calculation | Integer kobo fare sum | `fareKobo * passengers` in pure kobo math |
| Digital Boarding Pass | Sample verified ticket | Formatted sample using `formatNaira` and WAT time |
| Customer Reviews | Verified commuter feedback | Static verified customer dataset |

### Key Invariants

1. Money is always represented in integer kobo in state and calculations.
2. Minimum touch target of forty four pixels on every interactive button and link.
3. Light mode must be default, with theme support ready for propagation.
4. Titles rest directly on their backgrounds without badge wrapping.
5. No pulsing placeholder animations anywhere.

## Build plan

1. Create theme tokens and theme toggle state supporting light mode default and dark obsidian aesthetic, satisfies **AC-2**.
2. Build the Hero Section with trip mode tabs, floating search island, and trust badges, satisfies **AC-1**, **AC-3**.
3. Implement the Four Service Pillars grid and How It Works three step guide, satisfies **AC-1**, **AC-4**.
4. Construct the Asymmetrical Bento Destination Gallery with seven Nigerian corridors, satisfies **AC-1**, **AC-6**.
5. Build the Smart Ticketing digital pass graphic and interactive Quick Checkout calculator widget, satisfies **AC-1**, **AC-5**.
6. Implement the Mobile Experience PWA showcase banner and Customer Reviews grid, satisfies **AC-1**, **AC-7**.
7. Assemble the complete landing page in `apps/web/src/app/(public)/page.tsx` with full responsiveness and optical balance, satisfies **AC-1**, **AC-7**.
8. Verify test suite and production build, commit to branch `ui-modified`, and push to origin, satisfies **AC-8**.

## Consequences

**Positive**:
- Replaces the fragmented home page with a world class, high craft design matching the user's reference template.
- Default light mode ensures high readability while theme support brings dark obsidian elegance when toggled.
- The interactive quick checkout widget lets travelers calculate fares and start booking directly from the homepage.
- Establishes a reusable set of bento cards, ticket graphics, and theme tokens that can be propagated across the application.

**Negative / tradeoffs**:
- A richer visual layout with interactive widgets and bento cards increases the component footprint of the home page.
- Requires maintenance of dual theme token contrast across all new sections.

## References

**Project sources**:
- `AGENTS.md`: Stack rules, integer kobo math, Africa/Lagos WAT timestamps, and animation guidelines.
- Spec 0004: Segmented hero and main page layout history.
- Spec 0012: Spatial layout and PageShell design standards.
- Spec 0025: Trips search Coss UI token conventions.
