# 0016. Terminal Check In and Vehicle Dispatch

**Date**: 2026-10-15
**Status**: Accepted

## Summary

This specification establishes physical gate boarding verification and highway vehicle departure dispatch for Ascent Transport Management. Terminal gate marshals and station masters use mobile tablets or desktop counters at `/admin/check-in` and `/admin/trips` to scan passenger boarding pass QR codes, search travelers by phone number, check passengers into their specific five passenger Toyota Sienna seats, reassign walk in standby travelers, and print official highway departure manifests complying with Nigerian transport regulations.

## Context

Ascent Transport Management runs high frequency premium intercity departures across major travel hubs in Enugu, Abuja, Lagos, and Owerri. While passengers book seats online and receive digital boarding passes, terminal marshals operating at departure bays need a fast tool to verify traveler identities and board vehicles before highway departures.

Without dedicated terminal check in and dispatch tools, operations face three core operational hazards:
1. Boarding gate delays when marshals manually search paper rosters while vehicles idle in departure bays.
2. Inability to accommodate walk in standby travelers when confirmed passengers fail to arrive before departure cutoff.
3. Lack of standardized physical passenger manifests required by Nigerian highway patrol and federal road safety marshals at intercity transit checkpoints.

Providing a responsive phone first check in portal with camera QR scanning, individual seat boarding states, and printable highway departure manifests resolves these operational needs.

## Requirements

**User stories**:
- As a terminal gate marshal, I want to scan boarding pass QR codes with my tablet camera or search by phone number so that I can board passengers in under five seconds per traveler.
- As a station dispatcher, I want to assign drivers and specific Toyota Sienna vehicles to scheduled trips so that highway transit begins on schedule.
- As a terminal supervisor, I want to inspect seat boarding progress and release unclaimed seats for walk in standby travelers 15 minutes before vehicle departure.
- As an intercity Sienna driver, I want to receive an official printed passenger manifest listing all verified travelers and emergency next of kin contacts for federal road safety compliance.

**Acceptance criteria**:
- **AC-1**: Gate agent portal on `/admin/check-in` supports both live camera QR pass scanning and instant passenger search by phone number or booking reference (`ATM-XXXXXX`).
- **AC-2**: Seat check in supports per seat boarding granularity, allowing partial parties on a group reservation to board independently with a live 5 seat Toyota Sienna cabin map.
- **AC-3**: Marking a passenger checked in records the verifying staff member identifier and UTC timestamp while updating the seat status to `checked_in`.
- **AC-4**: Trip dispatch console on `/admin/trips` lists all scheduled corridor departures for the selected terminal date, showing vehicle registration numbers, assigned drivers, and live boarding completion percentages.
- **AC-5**: Station dispatchers can assign or swap drivers and Toyota Sienna vehicles on any scheduled trip prior to vehicle highway departure.
- **AC-6**: A dedicated printable highway manifest view on `/admin/trips/[tripId]/manifest` provides an official A4 document with passenger names, seat numbers, phone numbers, emergency next of kin contacts, vehicle registration, and driver credentials for Nigerian highway law enforcement inspections.
- **AC-7**: Gate supervisors have access to a manual standby release action returning unclaimed seats to walk in booking inventory when passengers fail to report 15 minutes before scheduled departure.

## Options considered

### Option 1: Responsive web portal with camera QR scanner, phone lookup, and print styled highway manifest

Build dedicated responsive interfaces in `apps/web/src/app/(admin)/admin/check-in` and `apps/web/src/app/(admin)/admin/trips` leveraging our Base UI primitives, modern HTML5 camera barcode detection API, and clean CSS print stylesheets. Gate marshals use existing company Android tablets or counter computers with zero extra hardware costs.

**Pros**:
- Zero additional hardware expenses.
- Instant updates across dispatchers and gate marshals via our shared repository layer.
- Clean A4 print layout works seamlessly with standard office laser printers at every terminal counter.

**Cons**:
- Camera barcode scanning in low light outdoor departure bays may occasionally require falling back to instant phone search. (Our design includes instant phone search as a primary one tap fallback).

### Option 2: External hardware barcode scanners and dedicated thermal receipt printers

Purchase handheld industrial wireless barcode guns and 80mm thermal receipt belt printers for every bay marshal.

**Pros**:
- Ruggedized hardware for harsh weather outdoor drop offs.

**Cons**:
- Significant upfront capital expense across four Nigerian regional hubs.
- Thermal receipts fade quickly under sun heat and are frequently rejected by federal highway road safety checkpoints requiring full A4 documentation.

### Option 3: Manual paper clipboard rosters and hand written departure logs

Terminal station masters print tabular spreadsheets each morning and check off passenger names with pens.

**Pros**:
- No software build required.

**Cons**:
- Severe data discrepancies, impossible live inventory sync, and inability to release no show seats to walk in standby travelers in real time.

## Decision

**Chosen option**: Option 1: Responsive web portal with camera QR scanner, phone lookup, and print styled highway manifest.

We build an integrated gate check in portal at `/admin/check-in` and fleet trip dispatch console at `/admin/trips` supported by clean printable A4 highway manifests at `/admin/trips/[tripId]/manifest`.

**Implementation skills**: `coss` (`cosscom/ui`, `.agents/skills/coss/`) · `improve-ui` (`ibelick/ui-skills`, `.agents/skills/improve-ui/`) · `web-design-guidelines` (`vercel-labs/agent-skills`, `.agents/skills/web-design-guidelines/`)

## Rationale

Ascent Transport Management operates in an environment where terminal supervisors frequently walk departure bays while carrying low cost Android tablets or smartphones. An integrated, responsive web tool built directly into our administrative shell gives staff immediate access without requiring dedicated hardware scanner purchases.

Furthermore, Nigerian highway patrol guidelines explicitly require intercity commercial passenger transport vehicles to carry complete physical passenger manifests detailing emergency contacts, vehicle plate numbers, and driver licensing details. A dedicated print stylesheet producing crisp A4 documentation satisfies statutory compliance requirements seamlessly.

## Feature design

### Gate Check In Portal (`/admin/check-in`)
- **Top Bar**: Active terminal selector (Enugu Ogui, Abuja Utako, Lagos Jibowu, Lagos Ajah, Lagos Festac, Owerri Egbo).
- **Scanner Panel**: Video viewport using native camera barcode detector with a manual text input fallback for booking references (`ATM-XXXXXX`) or passenger phone numbers (`+234...`).
- **Boarding Card**: When a booking is resolved, displays passenger name, destination terminal, scheduled departure time in WAT, and an interactive 5 seat Toyota Sienna cabin layout.
- **Seat Actions**: One tap button to mark individual seats or the full reservation as `checked_in`.
- **Standby Trigger**: Prominent standby button enabling marshals to release unoccupied seats if the traveler has not arrived within 15 minutes of departure.

### Trip Dispatch Console (`/admin/trips`)
- **Corridor Schedule Feed**: Chronological list of today's vehicle departures filtered by origin terminal.
- **Departure Cards**: Each card displays corridor route, departure time in WAT, vehicle assignment, driver details, and real time passenger boarding status (e.g. 4 of 5 passengers boarded).
- **Vehicle & Driver Modal**: Allows station masters to assign or reassign Toyota Sienna fleet vehicles and registered drivers.
- **Manifest Action**: One click link opening the printable highway manifest view.

### Highway Departure Manifest (`/admin/trips/[tripId]/manifest`)
- **Document Header**: Official company letterhead, terminal origin and destination, scheduled departure date and time, and vehicle plate number.
- **Driver Details**: Driver full name, phone number, and national drivers license number.
- **Passenger Table**: Seat number (1 to 5), passenger full name, contact phone number, emergency next of kin name and phone, and boarding confirmation timestamp in WAT.
- **Safety Declaration**: Standard statutory passenger safety disclaimer and station master signature line.
- **Print Optimization**: Clean print media CSS removing headers, sidebars, and navigation controls so that invoking `window.print()` outputs a perfect single page A4 document.

## Build plan

Following our Tracer Bullet delivery approach, we build thin end to end slices across every layer:
- [x] 1. **Core Dispatch & Check In Service**: Implement dispatch repository methods in `apps/web/src/server/repositories/dispatch.ts` covering seat check in, driver assignment, vehicle dispatch, and manifest retrieval (satisfies AC-2, AC-3, AC-5).
- [x] 2. **Gate Check In Interface**: Build `/admin/check-in` with phone search, QR scanner preview, and visual Sienna cabin boarding seat map (satisfies AC-1, AC-2).
- [x] 3. **Trip Dispatch Console**: Build `/admin/trips` with corridor schedule list, driver assignment modal, and boarding completion trackers (satisfies AC-4, AC-5).
- [x] 4. **Printable Highway Manifest**: Build `/admin/trips/[tripId]/manifest` with official regulatory layout and print media styles (satisfies AC-6).
- [x] 5. **Automated Test Suite**: Write comprehensive tests in `packages/shared/tests/phase8-checkin-dispatch.test.ts` verifying seat status transitions, standby release logic, and manifest data integrity (satisfies AC-1 through AC-7).

## Security & compliance

- **Staff Authorization**: Access to check in and dispatch surfaces strictly requires authenticated sessions with `role === 'staff'`.
- **Audit Trails**: Every passenger boarding and driver reassignment records the operating staff member user id and UTC timestamp.
- **Emergency Data Privacy**: Passenger next of kin phone numbers are accessible only to authenticated operations staff and on printed physical driver manifests required by highway safety laws.
