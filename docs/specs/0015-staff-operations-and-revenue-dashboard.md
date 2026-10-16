# 0015. Staff Operations and Revenue Dashboard

**Date**: 2026-10-15
**Status**: Accepted

## Summary

This specification establishes the protected administrative back office console and executive revenue reporting dashboard for Ascent Transport Management. Authorized terminal managers and operations controllers sign in securely via `/admin/login`, monitor live terminal throughput across Nigerian travel corridors, inspect passenger booking logs and seat inventory utilization, monitor express parcel freight movements, and review monthly financial statements with gross revenue totals calculated in integer kobo.

## Context

Ascent Transport Management operates scheduled Toyota Sienna departures and express freight transit across four major Nigerian hub cities (Enugu, Abuja, Lagos, and Owerri). While customer booking, seat hold locking, Paystack payments, cancellation refunds, and waybill tracking function smoothly on public web surfaces, back office supervisors and executive directors lacked an integrated control room to oversee daily operations.

Without a central operations dashboard, terminal staff face three operational bottlenecks:
1. Terminal managers cannot easily monitor daily vehicle departure schedules, driver assignments, and passenger seat occupancy across corridors.
2. Finance controllers lack unified reporting that reconciles passenger ticket fares, parcel freight charges, and cancellation fee retentions in integer kobo.
3. Operations staff cannot filter throughput by individual terminal hubs to detect vehicle congestion or corridor bottlenecks in real time.

An operational console with role guarded authentication, terminal level filtering, live throughput metrics, and downloadable revenue statements resolves these operational needs.

## Requirements

**User stories**:
- As a terminal operations manager, I want to sign in securely to the admin console so that I can monitor daily departures, seat utilization, and driver assignments for my terminal.
- As a logistics controller, I want to inspect active courier consignments and passenger bookings so that I can ensure on time vehicle dispatch and baggage clearance.
- As a finance director, I want to review monthly revenue breakdowns across passenger fares, parcel freight, and cancellation fee retentions so that I can reconcile bank disbursements and audit cash receipts.
- As an executive officer, I want to export monthly financial telemetry as structured data or printable reports for board meetings and stakeholder updates.

**Acceptance criteria**:
- **AC-1**: Staff authentication on `/admin/login` enforces role authorization (`role === 'staff'`), preventing customer accounts and anonymous guests from accessing administrative surfaces.
- **AC-2**: The main operations dashboard on `/admin` provides high level Key Performance Indicator cards for today's scheduled departures, active Toyota Sienna vehicles on highway transit, fleet seat load factor percentage, active parcel consignments, and gross revenue in integer kobo.
- **AC-3**: The console provides a terminal selector filter allowing staff to switch between system wide aggregated metrics and individual terminal views (Enugu Ogui, Abuja Utako, Lagos Jibowu, Lagos Ajah, Lagos Festac, and Owerri Egbo).
- **AC-4**: A recent activity table presents live passenger booking records with booking reference, passenger phone, corridor route, Sienna seat numbers, payment status, and creation timestamp formatted in Africa/Lagos WAT (UTC+1).
- **AC-5**: A courier consignment telemetry widget tracks parcel intake, highway transit volume, and terminal collection readiness with quick links to waybill details.
- **AC-6**: The reporting view on `/admin/reports` displays corridor performance comparisons, payment method distributions (Paystack online, POS card, cash at terminal), and monthly revenue totals calculated strictly in integer kobo.
- **AC-7**: Financial statements support a one click export function generating clean printable accounting summaries or downloadable CSV datasets.

## Options considered

### Option 1: Dedicated integrated admin shell with role guarded authentication and static repository aggregation

Build a bespoke, responsive administrative console directly inside `apps/web/src/app/(admin)/admin` using our calibrated design tokens, Base UI primitives, and server repository aggregation. All financial metrics compute from live booking and parcel repository records with zero external dashboard SaaS subscriptions.

**Pros**:
- Zero recurring third party software costs.
- Tight integration with our domain types, integer kobo monetary rules, and Africa/Lagos WAT timezone formatting.
- Instant responsive access on terminal counter tablets and mobile phones.

**Cons**:
- Requires custom chart and table components rather than generic third party plug and play analytics. (Our bespoke design system already provides high craft card patterns and tables).

### Option 2: Third party analytics dashboard integration (Metabase or Retool)

Embed external embedded BI iframes connecting directly to the production Neon PostgreSQL database.

**Pros**:
- Drag and drop chart creation for non technical staff.

**Cons**:
- Recurring licensing costs and hosting overhead.
- Clunky iframe navigation on mobile devices at physical terminal gates.
- Risk of integer kobo formatting inconsistencies and floating point rounding errors in external BI tools.

### Option 3: Spreadsheets and manual terminal daily logs

Rely on terminal station masters emailing Excel workbooks at the end of each shift.

**Pros**:
- No code to write.

**Cons**:
- Severe data discrepancies, delayed revenue reporting, and inability to manage live seat inventory.

## Decision

**Chosen option**: Option 1: Dedicated integrated admin shell with role guarded authentication and static repository aggregation.

We build an integrated operations console in `apps/web/src/app/(admin)/admin` backed by `auth.ts` role verification, unified repository queries across trips, bookings, and parcels, terminal level filtering, and clean financial reporting.

**Implementation skills**: `coss` (`cosscom/ui`, `.agents/skills/coss/`) · `improve-ui` (`ibelick/ui-skills`, `.agents/skills/improve-ui/`) · `web-design-guidelines` (`vercel-labs/agent-skills`, `.agents/skills/web-design-guidelines/`)

## Rationale

Ascent Transport Management operates in an environment where terminal supervisors frequently use mobile phones and counter tablets while walking vehicle departure bays. An integrated, responsive back office shell built with our existing Tailwind tokens ensures fast loading, tactile touch targets (minimum 44px), and seamless navigation without heavy third party dashboard overhead.

Computing metrics directly from our typed domain repositories guarantees that monetary figures remain integer kobo without currency formatting discrepancies.

## Feature design

**Telemetry metrics**:
- **Gross Revenue**: Sum of confirmed passenger booking fares plus paid parcel freight fees minus refunded cancellation amounts.
- **Trip Throughput**: Count of daily departures grouped by corridor and status (`scheduled`, `boarding`, `in_transit`, `completed`).
- **Fleet Seat Occupancy**: Percentage of available five passenger Toyota Sienna seats occupied on scheduled trips.
- **Parcel Flow**: Count of active parcels in terminal intake, corridor highway transit, and pickup readiness.

**Administrative views**:
1. `/admin`: Central operations overview with KPI cards, terminal corridor filter, quick dispatcher action buttons, and recent booking log.
2. `/admin/reports`: Revenue analytics, corridor profitability breakdown, payment method distribution, and CSV export.
3. `/admin/bookings`: Full searchable booking manifest with phone, reference, and Paystack payment provider references.
4. `/admin/parcels`: Courier waybill manager with status transition controls and pickup OTP verification lookup.

## Security considerations

- **Authorization check**: The admin layout intercepts every request under `/admin/*`, redirecting non staff sessions to `/admin/login`.
- **Audit logging**: Critical actions like manually updating trip schedules or marking tickets checked in record the operating staff user id and UTC timestamp.
