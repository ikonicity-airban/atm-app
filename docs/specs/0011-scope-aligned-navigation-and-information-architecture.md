# 0011. Scope-Aligned Navigation and Information Architecture

**Date**: 2026-10-15
**Status**: Accepted

## Summary

This specification establishes a clear information architecture and navigation system for Ascent Transport Management. It reorganizes top-level application navigation to match the core business pillars defined in the product scope: Passenger Travel, Courier Express Logistics, Private Charter and Corporate Fleet, and Self-Service Booking Management. This structure removes user ambiguity, exposes primary trip search directly, and provides dedicated entry points for parcel tracking and ticket management.

## Context

Ascent Transport Management operates five passenger Toyota Sienna fleets across Nigerian transit corridors, paired with express courier waybill logistics and private corporate charters. In earlier design passes, the public navigation bar grouped unrelated features under a generic Services dropdown, while omitting direct links to the primary passenger booking engine (`/trips`) and parcel tracking (`/track`).

This caused several user experience discrepancies:
1. Travelers arriving on content or terminal pages had no direct header link to search for trips or book seats without returning to the home page hero form.
2. The generic Services dropdown bundled consumer passenger routes alongside B2B corporate contracts, vehicle hire, and parcel logistics without clear distinction.
3. Waybill customers holding tracking codes like `ATM-EXP-XXXXXX` could not find the parcel tracking tool (`/track`) in the header navigation.
4. Self-service tools like booking cancellation and ticket lookup were isolated to a single button, lacking clear hierarchy.

To make the application intuitive for travelers, senders, and corporate clients alike, the navigation structure must reflect the real operational scope of the platform.

## Requirements

**User stories**:
- As a traveler looking for available departures, I want a direct Find Trips link in the primary header so that I can browse schedules and seat availability from any screen.
- As a sender with an active waybill code, I want a clear Track Parcel link in the header so that I can monitor shipment transit without digging through menus.
- As a logistics client, I want courier, charter, and corporate transit clearly distinguished so that I can select the exact service my business requires.
- As a mobile traveler, I want the drawer menu to mirror the desktop hierarchy with touch friendly targets so that finding information is seamless on small screens.

**Acceptance criteria**:
- **AC-1**: Header navigation exposes a direct, prominent Find Trips link pointing to `/trips` with active state tracking when viewing search results.
- **AC-2**: A Travel dropdown organizes passenger transit resources: Corridors and Schedules (`/routes`) and Terminal Directory (`/terminals`).
- **AC-3**: A Courier dropdown organizes logistics tools: Send Parcel (`/courier`) and Track Shipment (`/track`).
- **AC-4**: A Charter and Fleet dropdown groups bespoke hire options: Private Sienna Charter (`/charter`) and Corporate Transit (`/corporate`).
- **AC-5**: Header action area pairs a Track Parcel utility link alongside the primary Manage Booking action, with Cancel Booking accessible within self-service paths.
- **AC-6**: A Support dropdown provides customer assistance resources: Frequently Asked Questions (`/faq`), Contact and Helplines (`/contact`), About Ascent (`/about`), Terms of Carriage (`/terms`), and Privacy Policy (`/privacy`).
- **AC-7**: The mobile navigation drawer implements the identical four category hierarchy with touch targets measuring at least 44px by 44px.
- **AC-8**: Active link highlighting tracks parent dropdowns and direct routes accurately across nested corridors (`/routes/[slug]`) and booking paths (`/book/[tripId]`, `/book/success/[ref]`).
- **AC-9**: All navigation links and buttons maintain WCAG AA contrast ratios against light backgrounds without using badge pills or pulsing loaders.
- **AC-10**: Keyboard navigation supports standard Tab progression, Escape key dismissal for open overlays, and proper ARIA expanded attributes.

## Options considered

### Option 1: Domain-Oriented Commercial Pillar Navigation (Chosen)

Organizes top-level navigation into four distinct commercial domains: direct Find Trips, Travel dropdown, Courier dropdown, Charter and Fleet dropdown, plus utility actions for Track Parcel and Manage Booking.

**Pros**:
- Direct alignment with the 13 feature phases outlined in the project scope.
- Immediate visibility for the primary revenue driver (passenger trip booking).
- Distinguishes consumer parcel tracking from business logistics and private vehicle charter.
- Clean mental model for travelers, senders, and corporate clients.

**Cons**:
- Slightly more header items than a minimal two-item menu, requiring careful responsive spacing on intermediate tablet viewports.

### Option 2: Streamlined 4-Tab Flat Navigation Bar

Uses four flat top-level links: Book a Seat (`/trips`), Express Courier (`/courier`), Private Charter (`/charter`), and Terminals (`/terminals`), pushing all secondary tools and policies into the footer.

**Pros**:
- Extremely compact header appearance.

**Cons**:
- Buries parcel tracking (`/track`), routes directory (`/routes`), and corporate logistics (`/corporate`).
- Forces users to scroll to the footer for common operational tools.

### Option 3: Role-Based Navigation (Travelers vs Senders vs Business)

Divides navigation by customer persona tabs: Passenger Travel, Freight and Courier, Corporate and Charter.

**Pros**:
- Strictly segments user intent by audience.

**Cons**:
- Creates redundant nesting for cross-intent customers (e.g. a traveler who also needs to send a parcel).
- Less conventional than task-oriented intercity transit navigation.

## Decision

**Chosen option**: Option 1: Domain-Oriented Commercial Pillar Navigation

We adopt the domain-oriented navigation structure. It gives travelers immediate access to trip booking while giving courier customers, charter clients, and terminal visitors dedicated, discoverable pathways.

**Implementation skills**: `coss` (`cosscom/ui`, `.agents/skills/coss/`) · `web-design-guidelines` (`vercel-labs/agent-skills`, `.agents/skills/web-design-guidelines/`)

## Rationale

Ascent Transport Management operates multiple distinct revenue streams in Nigerian intercity transit. Grouping all non-travel features into a vague Services bucket obscured high intent workflows like parcel tracking and private charters.

Placing Find Trips as a direct primary navigation item elevates the core booking flow (Phases 2 through 5) so that users on any page can search departures in one click. Distinguishing Travel, Courier, and Charter into structured dropdowns provides immediate clarity, while keeping Track Parcel and Manage Booking visible as fast self-service utilities.

## Feature design

**Navigation hierarchy**:

```
[Brand Logo: Ascent / ATM] ─── (points to /)
  │
  ├── 1. Find Trips (Direct link -> /trips)
  │
  ├── 2. Travel [Dropdown]
  │       ├── Corridors & Schedules (/routes)
  │       └── Terminal Directory (/terminals)
  │
  ├── 3. Courier [Dropdown]
  │       ├── Send Express Parcel (/courier)
  │       └── Track Waybill Parcel (/track)
  │
  ├── 4. Charter & Fleet [Dropdown]
  │       ├── Private Sienna Hire (/charter)
  │       └── Corporate Logistics (/corporate)
  │
  ├── 5. Support [Dropdown]
  │       ├── FAQs (/faq)
  │       ├── Contact & Terminals (/contact)
  │       ├── About Ascent (/about)
  │       ├── Terms of Carriage (/terms)
  │       └── Privacy Policy (/privacy)
  │
  └── [Right Action Area]
          ├── Track Parcel (/track) [Text link / utility]
          ├── Manage Booking (/manage) [Primary button]
          └── Staff / Account Portal (when authenticated)
```

**URL routing table**:
| Header label | Destination path | Scope feature linkage | Target audience |
|---|---|---|---|
| Find Trips | `/trips` | Feature 3 (Home & Trip Query Engine) | Passengers booking seats |
| Corridors & Schedules | `/routes` | Feature 3 / 13 (Corridor landing pages) | Travelers researching routes |
| Terminal Directory | `/terminals` | Feature 2 (Design System & Directory) | Passengers finding addresses |
| Send Express Parcel | `/courier` | Feature 7 (Courier Booking & Tracking) | Senders booking freight |
| Track Waybill Parcel | `/track` | Feature 7 (Courier Booking & Tracking) | Customers tracking shipments |
| Private Sienna Hire | `/charter` | Feature 12 (Charter & Corporate) | Travelers hiring private vans |
| Corporate Logistics | `/corporate` | Feature 12 (Charter & Corporate) | Businesses needing contracts |
| Manage Booking | `/manage` | Feature 6 (Manage Booking & Cancellation) | Ticket holders rescheduling |
| Cancel & Refund | `/cancel` | Feature 6 (Manage Booking & Cancellation) | Ticket holders requesting refund |
| Frequently Asked Questions | `/faq` | Feature 2 (Company Policies) | General inquiries |
| Contact & Helplines | `/contact` | Feature 2 (Company Policies) | Terminal phone support |
| About Ascent | `/about` | Feature 2 (Company Policies) | Brand story & fleet mission |

**Key invariants**:
- Touch targets must measure at least 44px by 44px on all viewports.
- No pulsing skeleton animations or badge pills enclosing section headers.
- Active path highlighting must accurately reflect child routes (e.g. `/routes/enugu-abuja` highlights Travel).
- Mobile menu drawer must replicate every single desktop link without omitting services.
- Keyboard accessibility: pressing Escape closes active dropdowns and mobile drawer.

## Build plan

1. Restructure navigation link definitions in `apps/web/src/components/layout/PublicHeader.tsx` into domain groups: `Find Trips`, `travelLinks`, `courierLinks`, `charterLinks`, and `supportLinks`.
2. Update desktop navbar rendering in `PublicHeader.tsx` with dedicated dropdowns for Travel, Courier, Charter, and Support, plus direct `Find Trips` button.
3. Add `Track Parcel` utility link alongside the `Manage Booking` action button on the header right side.
4. Update mobile navigation drawer in `PublicHeader.tsx` with grouped expandable sections matching the desktop hierarchy.
5. Update `PublicFooter.tsx` navigation groups to mirror the domain-oriented categories for footer consistency.
6. Verify and update test assertions in `packages/shared/tests/phase4-hero-and-routing.test.ts` ensuring all core navigation paths resolve valid metadata and active routes.
7. Run monorepo typecheck and test suite (`pnpm typecheck`, `pnpm test`) to guarantee clean execution.

## Consequences

**Positive**:
- Passengers have direct one-click access to trip booking from any page in the application.
- Courier customers can immediately access parcel tracking without hunting through menus.
- Clear separation between consumer passenger travel, freight logistics, and corporate charters.
- Eliminates the generic Services bucket and aligns navigation directly with the 13 scope phases.

**Negative / tradeoffs**:
- Slightly wider desktop navigation bar, requiring responsive collapse thresholds at standard tablet breakpoints (`< 1024px`).

**Neutral**:
- Dropdown menus use consistent CSS transitions with reduced motion fallbacks.
