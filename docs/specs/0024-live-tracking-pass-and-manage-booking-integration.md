# 0024. Live Tracking Pass and Manage Booking Integration

**Date**: 2026-10-17
**Status**: Proposed

## Summary

This specification integrates real time highway telematics and vehicle tracking directly into traveler entry points across Ascent Transport Management (ATM Nigeria). Specifically, it equips the post checkout booking success pass (`/book/success/[ref]`) and the self service management portal (`/manage`) with live vehicle status indicators, dynamic estimated arrival time (ETA), active roadside incident badges, and direct frictionless one tap navigation into the `/track/journey/[ref]` journey tracker with customer credentials automatically passed.

## Context

Ascent Transport Management operates executive Toyota Sienna vehicles across high traffic Nigerian highway corridors (such as Enugu to Abuja, Lagos to Benin/Enugu, and Abuja to Owerri). 

In Phase 15 (`docs/specs/0022-fleet-telematics-and-live-journey-tracking.md`), ATM built the highway telematics engine and dedicated journey tracking interface at `/track/journey/[ref]`, featuring waypoint progression, speed meters, driver contact cards, and roadside assistance drawers.

However, prior to this integration:
1. When a traveler completed payment at `/book/success/[ref]`, the screen offered actions for printing tickets and managing bookings, but travelers had to manually discover `/track` and re type their booking reference or phone number.
2. In the self service booking portal (`/manage`), passengers could review ticket status, request cancellations, or view store credits, but lacked live visibility into whether their assigned Toyota Sienna vehicle was boarding, in transit, delayed by roadside incidents, or already approaching their destination terminal.
3. Family members sharing a booking link received standard ticket passes without direct highway tracking links.

By linking Phase 15 telematics into `/book/success/[ref]` and `/manage`, passengers and their loved ones enjoy immediate situational awareness from the moment of booking confirmation right through destination arrival.

## Requirements

**User stories**:
- As a confirmed passenger on the booking success screen, I want a clear Track Live Vehicle action and telematics preview card so that I can immediately monitor transit status without having to remember or re enter my reference.
- As a traveler managing my booking on `/manage`, I want to see the live status of my trip (Scheduled, Boarding, In Transit, Arrived, or Delayed) along with assigned vehicle plate and driver name directly on the reservation dashboard.
- As a traveler or family member sharing a booking pass, I want the share link or quick actions to provide direct access to live journey tracking so that emergency contacts can follow vehicle progress along Nigerian highways.
- As a passenger whose trip is subject to a highway delay or incident, I want to see an immediate warning badge on my manage booking card and success pass so that I know what is happening before arriving at the terminal or while waiting en route.

**Acceptance criteria**:
- **AC-1**: Booking success view (`/book/success/[ref]`) displays an integrated Live Highway Journey card highlighting assigned vehicle registration (e.g. Toyota Sienna `ENU-418-XY`), driver name, real time trip status badge (`In Transit`, `Boarding`, `Scheduled`, `Delayed`), and a prominent Track Live Vehicle button navigating directly to `/track/journey/[ref]?phone=...`.
- **AC-2**: Booking success header actions include a dedicated Track Vehicle button alongside Print Boarding Passes and Share, ensuring accessibility on mobile and desktop viewports.
- **AC-3**: Self service portal (`/manage`) incorporates a Live Journey & Vehicle Telematics card on the retrieved booking dashboard displaying vehicle plate number, driver name, route status, destination ETA, and a one tap button linking to `/track/journey/[ref]?phone=...`.
- **AC-4**: In both surfaces, passenger phone numbers normalize automatically to E.164 and pre fill the telematics tracking query parameter (`?phone=...`) so travelers experience zero re entry friction.
- **AC-5**: If the assigned trip has active roadside incidents reported by drivers (e.g. military checkpoint queue, heavy rainstorm, or mechanical check), confirmed cards render a clear amber advisory notice detailing the nature of the delay and expected arrival revision.
- **AC-6**: Quick share utility on `/book/success/[ref]` includes an option to copy the direct live tracking URL (`/track/journey/[ref]`) formatted for WhatsApp and SMS sharing with family and emergency contacts.
- **AC-7**: All components strictly comply with ATM UI principles: zero `animate-pulse` animations (using static progress bars and clear status badges), touch targets meeting or exceeding 44px, integer kobo currency calculations, and timestamps rendered in Africa/Lagos WAT (UTC+1).

## Build plan

1. **Shared & Telematics Helpers**:
   - Verify lookup functions in `@/server/repositories/telematics.ts` support seamless retrieval by booking reference and optional passenger phone number.
   - Ensure telematics status helpers and roadside incident formatters can be cleanly imported across client views.

2. **Booking Success View Enhancement (`apps/web/src/app/(public)/book/success/[ref]/page.tsx`)**:
   - Add Live Highway Journey telematics card with status badge, driver info, and one click tracking link.
   - Add primary Track Live Vehicle button in header actions bar.
   - Enhance Share modal/action to support copying live tracking link with friendly WhatsApp / SMS message formatting.

3. **Manage Booking Portal Upgrade (`apps/web/src/app/(public)/manage/page.tsx`)**:
   - Integrate Live Vehicle & Highway Telematics card into retrieved booking dashboard.
   - Show dynamic trip status (`In Transit`, `Boarding`, `Scheduled`), assigned Sienna registration, driver verified badge, and direct tracking button pre filling passenger phone number.
   - Show active roadside incident warnings if present.

4. **Testing and Verification**:
   - Verify unit test suite passes: `node --import tsx --test packages/shared/tests/*.test.ts`.
   - Verify Next.js production build succeeds: `pnpm --filter web build`.
   - Conduct complete `/check verify` and `/check review` audits.
