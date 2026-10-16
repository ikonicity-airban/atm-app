# 0017. Admin Logistics, CRM, and Fleet Maintenance

**Date**: 2026-10-15
**Status**: Accepted

## Summary

This specification establishes comprehensive back office operations management for Ascent Transport Management. Operations controllers and terminal managers use dedicated administrative surfaces at `/admin/fleet`, `/admin/pricing`, `/admin/parcels`, and `/admin/inquiries` to monitor Toyota Sienna vehicle service intervals and statutory document roadworthiness, manage seasonal corridor fare overrides in integer kobo, process terminal freight hub intake and outbound parcel assignments, and resolve customer support inquiries.

## Context

Ascent Transport Management runs commercial intercity passenger transit and express courier logistics connecting four principal hubs (Enugu, Abuja, Lagos, and Owerri). While ticket booking, payment reconciliation, terminal check in, and highway vehicle dispatch are operational, back office managers require specialized tooling for four core operating functions:
1. Fleet roadworthiness: Intercity Toyota Sienna vehicles cover high highway mileage weekly. Automated tracking of oil changes, brake inspections, and statutory document expiration dates (FRSC roadworthiness, insurance, and driver licenses) prevents mechanical breakdowns and checkpoint delays.
2. Dynamic corridor pricing: Travel demand surges during public holidays and festive seasons (such as the December rush). Operations managers need the capability to apply temporary peak percentage multipliers or flat integer kobo overrides to specific travel corridors without changing core code.
3. Parcel hub logistics: Terminal staff at origin bays receive packages, generate waybill barcodes, assign parcels to outbound vehicles, log hub transit checkpoints, and verify final customer pickup with four digit secret codes.
4. Customer support and CRM: Travelers submitting booking inquiries, luggage complaints, or refund requests need tracked ticket resolution workflows with assigned staff and status lifecycles.

Consolidating these four administrative workflows into our established admin shell provides complete operational visibility across all four regional hubs.

## Requirements

**User stories**:
- As a fleet operations manager, I want to track Toyota Sienna mileage thresholds and statutory document expiration dates on `/admin/fleet` so that vehicles are serviced before road hazards occur.
- As a revenue manager, I want to apply corridor base fare overrides and seasonal peak multipliers on `/admin/pricing` so that pricing reflects holiday passenger demand.
- As a terminal freight supervisor, I want to inspect active parcel waybills, update transit checkpoints, and verify recipient collection codes on `/admin/parcels` so that package custody remains secure.
- As a customer care supervisor, I want to review traveler inquiries, filter by priority and corridor, and log ticket resolutions on `/admin/inquiries` so that customer complaints are resolved quickly.

**Acceptance criteria**:
- **AC-1**: Fleet console on `/admin/fleet` displays all registered Toyota Sienna vehicles, showing registration plate numbers, current mileage, maintenance status badges (`active`, `service_due`, `in_maintenance`, `grounded`), and days remaining until insurance or roadworthiness document renewal.
- **AC-2**: Fleet service action allows staff to log vehicle maintenance events (oil change, brake pads, tire replacement) with integer kobo cost, updating the vehicle mileage counter and resetting the next service threshold.
- **AC-3**: Pricing management console on `/admin/pricing` lists all 6 standard travel corridors with baseline fares in integer kobo, allowing authorized staff to set temporary flat kobo overrides or percentage multipliers with start and end validity dates.
- **AC-4**: Active pricing rules automatically take effect during trip fare lookups, applying the verified override fare or multiplier and recording the pricing adjustment reason.
- **AC-5**: Parcel logistics console on `/admin/parcels` provides terminal filtering, stage counters, waybill search by tracking code (`ATM-EXP-XXXXXX`), and status transition buttons (`received_at_origin`, `in_transit`, `arrived_at_destination`, `delivered`).
- **AC-6**: Delivering a parcel requires validating the four digit collection code against the waybill record, recording the receiving agent staff identifier and UTC timestamp.
- **AC-7**: Customer service inquiry console on `/admin/inquiries` lists traveler contact submissions with category filters, priority tags (`low`, `medium`, `high`, `urgent`), and ticket status controls (`open`, `in_progress`, `resolved`).
- **AC-8**: Staff can assign customer inquiries to team members, enter resolution notes, and mark inquiries as resolved with an immutable audit log.

## Options considered

### Option 1: Unified operations console with dedicated back office domain repositories (Chosen)

Build four cohesive interfaces under `apps/web/src/app/(admin)/admin/` (`fleet`, `pricing`, `parcels`, `inquiries`) backed by dedicated repository services in `apps/web/src/server/repositories/` (`fleet.ts`, `pricing.ts`, `inquiries.ts`, and extended `parcels.ts`).

**Pros**:
- Consistent design system and navigation reusing Base UI primitives and Tailwind v4 tokens.
- Instant, responsive state transitions with zero external dependency bloat.
- Full type safety through shared Zod validation schemas across both client forms and API route handlers.
- Seamless developer preview support with direct repository fallbacks.

**Cons**:
- Requires implementing four focused UI consoles in a single feature slice. (Mitigated by our Tracer Bullet delivery pattern and pre established administrative layouts).

### Option 2: Third party SaaS integrations for CRM and fleet telematics

Integrate third party external SaaS tools (such as Zendesk for inquiries and an external telematics dashboard for vehicles).

**Pros**:
- Pre built specialized external widgets.

**Cons**:
- Heavy monthly subscription fees across multiple platforms.
- Fragmented staff authentication and disconnected customer booking data.
- Poor offline resilience in Nigerian regional terminal offices with intermittent internet.

## Decision

**Chosen option**: Option 1: Unified operations console with dedicated back office domain repositories.

We build an integrated operations suite within our existing admin workspace, providing dedicated views for fleet maintenance, corridor pricing overrides, parcel freight logistics, and customer support inquiries.

**Implementation skills**: `coss` (`cosscom/ui`, `.agents/skills/coss/`) · `improve-ui` (`ibelick/ui-skills`, `.agents/skills/improve-ui/`) · `zod-schema-validation` (`mindrally/skills`, `.agents/skills/zod-schema-validation/`)

## Rationale

Ascent Transport Management operates time sensitive intercity schedules where terminal station masters, dispatch marshals, and customer care agents work inside the same physical facilities. Providing a unified back office experience ensures that vehicle maintenance alerts directly inform trip scheduling, holiday pricing rules automatically apply to passenger bookings, and parcel custody updates synchronize across regional transit hubs.

## Feature design

### Fleet Management (`/admin/fleet`)
- **KPI Summary Strip**: Total fleet vehicles, active on road, service due, and grounded count.
- **Vehicle Roster Table**: Plate number (e.g. `ENU-418-XY`), model (`Toyota Sienna Limited`), current mileage, mileage to next service, document expiry status, and assigned driver.
- **Log Service Modal**: Dialog allowing station mechanics to record service type, cost in integer kobo, service date in WAT, odometer reading, and mechanic notes.
- **Document Expiry Warnings**: High visibility status badges highlighting documents expiring within 30 days.

### Pricing Overrides (`/admin/pricing`)
- **Corridor Pricing Grid**: Card per corridor (Enugu to Abuja, Enugu to Lagos, Lagos to Owerri, etc.) showing standard baseline fare, active override fare, and effective multiplier.
- **Create Override Modal**: Form allowing staff to select corridor, choose rule type (percentage multiplier or flat override in integer kobo), set start and end dates, and enter rationale.
- **Active Schedule Tracker**: Badge indicating whether a rule is currently active or upcoming.

### Parcel Logistics Console (`/admin/parcels`)
- **Hub Stage Counters**: Real time tallies of packages booked, received at terminal, in corridor transit, arrived at destination, and collected.
- **Waybill Dispatch Table**: Tracking code, sender/recipient contact, route, package category, weight, and current status.
- **Handoff Action**: One click button to advance package stage with destination terminal confirmation.
- **Pickup Verification Dialog**: Secure PIN entry input requiring the recipient's four digit pickup code before marking package delivered.

### Customer Inquiries Helpdesk (`/admin/inquiries`)
- **Inquiry Queue**: Filterable list by status (`open`, `in_progress`, `resolved`), priority, and category (booking, luggage, refund, driver).
- **Inquiry Detail Drawer**: Full customer message, traveler phone, associated booking reference, and resolution thread.
- **Resolve Dialog**: Input for resolution notes and status transition to resolved.

## Build plan

Following our Tracer Bullet delivery approach, we build end to end slices through every layer:
- [x] 1. **Shared Schemas and Domain Types**: Define Zod validation schemas and TypeScript types in `@atm/shared` for fleet maintenance logs, corridor pricing overrides, and customer inquiries (satisfies AC-1, AC-3, AC-7).
- [x] 2. **Operations Repositories**: Implement `FleetRepository`, `PricingRepository`, and `InquiriesRepository` in `apps/web/src/server/repositories/` with dual state support and seeded fixtures (satisfies AC-1, AC-2, AC-3, AC-4, AC-8).
- [x] 3. **API Route Handlers**: Implement Next.js App Router route handlers for fleet service logging, pricing rule overrides, parcel delivery verification, and inquiry status updates (satisfies AC-2, AC-4, AC-6, AC-8).
- [x] 4. **Administrative User Interfaces**: Upgrade `/admin/fleet`, `/admin/pricing`, `/admin/parcels`, and `/admin/inquiries` from placeholder pages to high craft interactive consoles with Base UI styling (satisfies AC-1 through AC-8).
- [x] 5. **Comprehensive Test Suite**: Author unit and integration tests in `packages/shared/tests/phase10-admin-operations.test.ts` verifying maintenance threshold calculations, integer kobo pricing overrides, and inquiry workflows (satisfies AC-1 through AC-8).

## Security & compliance

- **Administrative Role Enforcement**: All four consoles and API route handlers require authenticated sessions with `role === 'staff'`.
- **Financial Integrity**: Pricing overrides store all amounts strictly in integer kobo without floating point numbers.
- **Custody Audit Trail**: Parcel handoffs and delivery code verifications log the staff member user identifier and UTC timestamp.
- **Customer Privacy**: Contact numbers and next of kin information are restricted to authorized operations staff.
