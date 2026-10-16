# 0004. Segmented hero and main page design system redesign

**Date**: 2026-10-14
**Status**: Accepted

## Summary

This specification defines the redesigned visual structure for the Ascent Transport Management public home page and hero layout. Inspired by modern travel booking interfaces, the new design introduces a framed lilac gradient atmosphere, a two column hero header with prominent bold typography, a floating segmented search island with discrete white input cards, and an anchored vehicle fleet visual at the bottom of the hero section. All Ascent Transport Management domain content, five passenger Toyota Sienna fleet specifications, Nigerian travel corridors, and integer kobo pricing rules remain strictly preserved.

## Context

The initial home page implementation provides a functional search form and trip discovery flow. However, user feedback and modern travel standards demand a more premium, structured first impression that communicates speed, reliability, and executive comfort.

The reference design establishes an elegant visual pattern seen in high end transport platforms. It frames the viewport with a soft ambient background tint, divides the hero into a two column typographic header, places an interactive floating segmented card widget at the center, and grounds the bottom edge with a vehicle on a marked road surface.

We must apply this exact visual structure while strictly honoring Ascent Transport Management domain rules:
- All domain content belongs to Ascent Transport Management (ATM Nigeria), covering Enugu, Abuja, Lagos, and Owerri corridors.
- Fares remain strictly integer kobo formatted at the user interface edge.
- Departure dates and times remain calculated in Africa/Lagos (WAT, UTC+1).
- Section headings must rest directly on section backgrounds, never wrapped inside pills, badges, or card wrappers.
- Pulsing animations remain strictly banned under all circumstances, using static placeholders or steady indicator lights.
- Interactive controls must maintain touch targets of at least forty four pixels.

## Requirements

**User stories**:
- As a traveler, I want a visually distinct, segmented search interface so that I can easily view and select my departure terminal, destination terminal, travel date, and passenger count.
- As a traveler, I want a clean, spacious hero header with clear social proof so that I immediately trust the service and understand its value proposition.
- As a traveler, I want a one click swap button between origin and destination so that I can quickly reverse my travel direction.

**Acceptance criteria**:
- **AC-1**: The hero section renders a two column header with a social proof badge on the top left, large bold H1 typography on the left, and an explanatory value proposition paragraph on the right.
- **AC-2**: The H1 heading rests directly on the soft tinted section background, strictly avoiding any card or pill container wrapper.
- **AC-3**: The search widget renders as a floating segmented island containing discrete white rounded cards for departure city, destination city, travel date, and passenger count, with subtle shadows and clean micro labels.
- **AC-4**: A circular brand accent swap button sits between the departure and destination cards, reversing the cities when clicked if the reverse corridor is active.
- **AC-5**: A prominent rounded brand square action button with a magnifying glass icon triggers the search mutation, navigating to the trips results page with validated query parameters.
- **AC-6**: The bottom of the hero section features an anchored vehicle graphic showcasing the five passenger Toyota Sienna fleet along a road strip with highway lane markings.
- **AC-7**: The top navigation header features the brand logo on the left, primary navigation links in the center, and an outlined pill button for booking management on the right.
- **AC-8**: All interactive elements, including input cards, swap buttons, and navigation links, maintain minimum touch targets of forty four pixels, with full keyboard navigation and zero pulsing animations.
- **AC-9**: The hero section layout is calibrated so the entire hero section plus header fits within a maximum of 105vh across viewports.
- **AC-10**: The hero heading renders `Intercity transport` on a single prominent line, followed by `in 5-passenger Toyota Siennas.` styled beneath it.
- **AC-11**: The navigation header remains transparent at the top of the page and morphs on scroll into a floating, narrower pill with rounded edges, zero borders, and a soft depth shadow.
- **AC-12**: The navigation bar features an animated pill tracking mouse hover over links (defaulting to the active route), with links consolidated into Home (standalone), Services (dropdown for corridors, courier, charter, corporate), Terminals (standalone), and About (dropdown for about, contact, faq, terms, privacy).

## Options considered

### Option 1: Segmented floating cards inside an ambient framed hero container (Chosen)

In this approach, the hero section adopts the exact structural composition of the reference image. The outer container features a soft lilac and lavender gradient frame, the hero header splits into a two column typographic presentation, the search widget floats as discrete rounded white card blocks, and a fleet graphic grounds the bottom edge.

**Pros**:
- Exactly delivers the structure, polish, and elegance of the user provided reference.
- Discrete card blocks make each search parameter (origin, destination, date, passengers) easily scannable and touch friendly.
- Maintains complete separation of concerns between visual layout primitives and underlying query logic.

**Cons**:
- Requires careful responsive styling to ensure discrete card blocks stack gracefully on mobile screens below 768 pixels.

### Option 2: Single continuous pill bar container

In this approach, all inputs are housed inside one continuous pill shaped border with thin vertical dividers between fields.

**Pros**:
- Compact vertical footprint.

**Cons**:
- Less visual hierarchy than discrete segmented cards.
- Does not match the floating card structure demonstrated in the reference design.

### Option 3: Full width dark theme hero

In this approach, the hero uses a deep dark slate or navy background with high contrast neon text.

**Pros**:
- High visual drama.

**Cons**:
- Clashes with the light, airy aesthetic of the reference image and ATM brand design system tokens.

## Decision

**Chosen option**: Option 1: Segmented floating cards inside an ambient framed hero container.

We adopt the segmented floating card structure and two column hero composition from the reference image, styled with ATM brand magenta accents (`#ca2484`, `#aa1769`) and calibrated slate neutrals on a soft lilac tinted backdrop.

**Implementation skills**: `tailwindcss` (`mindrally/skills`, `.agents/skills/tailwindcss/`) · `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`) · `vercel-composition-patterns` (`vercel-labs/agent-skills`, `.agents/skills/vercel-composition-patterns/`) · `web-design-guidelines` (`vercel-labs/agent-skills`, `.agents/skills/web-design-guidelines/`)

## Rationale

The segmented floating card pattern provides immediate clarity for travelers booking intercity transport. Each parameter (origin city, destination city, travel date, passenger count) receives its own dedicated card with an icon, micro label, bold value, and helper caption.

Placing the title on the left and the supporting paragraph on the right creates an open, luxurious feel that draws the traveler eye naturally downward to the search island and fleet visual. Retaining the core ATM color palette ensures complete consistency with the rest of the application.

## Feature design

**Layout structure and composition**:
1. **Header**:
   - Left: ATM brand logo with full typography and brand icon.
   - Center: Desktop navigation links (Book, Courier, Track, Charter, Terminals, Contact).
   - Right: Outlined pill button for Manage Booking (`rounded-full border border-slate-800 px-6 py-2.5 text-xs font-bold hover:bg-slate-900 hover:text-white transition-all`).
2. **Hero Section**:
   - Background: Framed container with rounded borders (`rounded-3xl` or `rounded-2xl`) and subtle gradient tint (`from-[#f7f2ff] via-white to-[#fcfaff]`).
   - Social Proof Pill: Left aligned pill (`bg-slate-900 text-white rounded-full px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-2`) with star icon and text "4.9/5 Rating | 5,000+ Completed Sienna Trips".
   - Hero Header Row: Two column grid on desktop (`grid grid-cols-1 lg:grid-cols-12 gap-8 items-start`):
     - Left (7 cols): Bold H1 typography resting directly on the section background: "Intercity transport in 5-passenger Toyota Siennas."
     - Right (5 cols): Elegant paragraph copy: "Travel between Enugu, Abuja, Lagos, and Owerri in air-conditioned comfort with extra legroom. Departures that leave on schedule without roadside delays."
   - Segmented Search Island:
     - Floating tray (`bg-white/80 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-slate-200/80`):
       - Card 1 (Origin): MapPin icon + "Travelling From" micro label + bold city name ("Enugu") + terminal name caption.
       - Swap Button: Center circular brand magenta button (`w-11 h-11 rounded-full bg-[#ca2484] hover:bg-[#aa1769] text-white flex items-center justify-center shadow-md`).
       - Card 2 (Destination): MapPin icon + "Travelling To" micro label + bold city name ("Abuja") + terminal name caption.
       - Card 3 (Date): Calendar icon + "Departure Date" micro label + formatted Lagos date ("15/10/2026") + day of week caption.
       - Card 4 (Passengers): Users icon + "Passengers" micro label + count ("1 Seat") + "Toyota Sienna (5-seat)" caption.
       - Action Button: Brand magenta squircle button (`w-14 h-14 rounded-2xl bg-[#ca2484] hover:bg-[#aa1769] text-white flex items-center justify-center shadow-lg`) with magnifying glass icon.
   - Vehicle Fleet Horizon:
     - An asphalt road strip with highway lane markings anchored at the bottom of the hero section.
     - A sleek silver Toyota Sienna silhouette and vehicle graphic positioned along the road line, grounding the hero section.

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Display Hero H1 | Primary heading | Domain value copy defined in `apps/web/src/app/(public)/page.tsx` |
| Display Social Proof | Rating and trip count | Verified domain milestone statistics |
| Select Origin | Departure city and terminal | `SERVED_CITIES` and `SEED_TERMINALS` from packages/shared |
| Select Destination | Arrival city and terminal | `getServedDestinations(fromCity)` from packages/shared |
| Select Date | Travel date in Lagos timezone | `getLagosDate()` from packages/shared |
| Select Passengers | Seat count (1 to 5) | Bounded passenger state (1 to 5) |
| Submit Search | Redirect URL with parameters | Validated query string to `/trips` |

**Key invariants**:
- The H1 title must never be wrapped in a card, pill, or badge container.
- All touch targets must equal or exceed forty four pixels.
- Zero pulsing animations anywhere in the component tree.
- Maximum passenger capacity is strictly five passengers per vehicle.

**Security model**:
- All hero and header components are public facing and client side interactive.
- Search submission uses standard GET parameters with server side validation via `searchParamsSchema`.

**Configuration required**:
- No external environment variables or third party API keys required.

**Critical test scenarios**:
- Two column header: Left column displays H1 directly on background, right column displays value proposition, verifies **AC-1**, **AC-2**.
- Segmented search card interaction: Selecting origin city updates destination choices, verifies **AC-3**.
- Swap button: Clicking swap reverses origin and destination cities, verifies **AC-4**.
- Search submission: Clicking search button navigates to `/trips` with correct parameters, verifies **AC-5**.
- Bottom vehicle anchor: Renders fleet visual and road lane strip cleanly without layout shifts, verifies **AC-6**.
- Responsive behavior: On mobile viewports under 768px, segmented cards stack vertically with minimum 44px touch targets, verifies **AC-8**.

## Build plan

- [x] 1. Create the `SegmentedSearchForm` component featuring discrete floating cards for origin, destination, date, passengers, circular swap button, and squircle search button, satisfies **AC-3**, **AC-4**, **AC-5**, **AC-8**.
- [x] 2. Update `PublicHeader` to incorporate the outlined pill action button for booking management, satisfies **AC-7**, **AC-8**.
- [x] 3. Create the `VehicleHighwayAnchor` component rendering the Toyota Sienna fleet visual along an asphalt road with lane dashes, satisfies **AC-6**, **AC-8**.
- [x] 4. Redesign the public home page hero section in `apps/web/src/app/(public)/page.tsx` with the framed lilac gradient background, social proof badge, two column typographic header, floating segmented search island, and vehicle highway anchor, satisfies **AC-1**, **AC-2**, **AC-6**, **AC-8**.
- [x] 5. Verify responsiveness across mobile, tablet, and desktop viewports, ensuring forty four pixel touch targets and zero pulsing animations, satisfies **AC-8**.
- [x] 6. Run unit tests and type checks confirming zero regressions across the monorepo, satisfies **AC-1**, **AC-3**, **AC-5**, **AC-8**.

## Consequences

**Positive**:
- Significantly elevated visual prestige and modern design appeal matching high end international travel booking platforms.
- Clearer, more engaging search interaction through discrete card segments.
- Complete adherence to project architectural rules: zero pulse animations, no pill wrapped titles, forty four pixel touch targets, integer kobo currency.

**Negative / tradeoffs**:
- Slightly higher component complexity in the search form to support both discrete desktop card blocks and stacked mobile inputs.

**Neutral**:
- The existing underlying query engine in `apps/web/src/server/repositories/trips.ts` remains completely untouched, consuming identical search parameters.

## Follow-up

- [ ] Connect vehicle highway anchor to fleet availability metrics when live fleet tracking is implemented in later phases.
