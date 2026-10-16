# 0014. Courier Booking and Parcel Tracking

**Date**: 2026-10-15
**Status**: Accepted

## Summary

This specification establishes intercity express parcel freight booking and public waybill tracking for Ascent Transport Management. Customers can book parcel delivery between any served terminals on `/courier`, calculate weight and category tiered freight charges in integer kobo, declare parcel contents with optional transit insurance, and generate an unambiguous tracking code (`ATM-EXP-XXXXXX`) with a secure four digit pickup verification code. Senders and recipients can track parcel movement on `/track` through an interactive visual chain of custody timeline showing terminal intake, vehicle corridor transit, destination arrival, and final pickup verification.

## Context

Ascent Transport Management operates daily Toyota Sienna intercity passenger departures between major commercial hubs including Enugu, Abuja, Lagos, and Owerri. In addition to passenger seats, these vehicles maintain secure cargo luggage space suitable for high priority letters, electronics, commercial cartons, and critical parcels.

Previously, parcel booking was handled informally by phone dispatchers or paper manifests at terminal counters. This caused three major challenges:
1. Senders lacked price transparency and had no guarantee of freight rates before arriving at physical terminals.
2. Recipients had no real time visibility into package transit, forcing repeated phone calls to busy terminal dispatchers.
3. Parcel handover lacked verification controls, creating risks of misdelivery, disputed handoffs, or lost packages.

Building an end to end courier workflow with transparent integer kobo pricing, automated waybill generation, SMS notifications, and public tracking addresses these problems directly.

## Requirements

**User stories**:
- As a parcel sender, I want to calculate shipping fees online and book a waybill before going to the terminal so that my package drop off is fast, predictable, and recorded.
- As a parcel sender, I want an unambiguous tracking code and digital waybill pass so that I can share proof of shipment with the recipient.
- As a parcel recipient, I want to track the real time location and status of my package on `/track` so that I know exactly when it arrives at my destination terminal.
- As a terminal operations agent, I want recipient pickup verification using a secret four digit pickup code sent via SMS to prevent unauthorized collection.

**Acceptance criteria**:
- **AC-1**: Senders book parcel freight on `/courier` by selecting origin and destination terminals from served corridors (Enugu, Abuja, Lagos Jibowu, Lagos Ajah, Lagos Festac, and Owerri).
- **AC-2**: The freight pricing engine computes total costs strictly in integer kobo using base corridor fees, weight brackets (up to 50kg maximum), fragile cargo handling surcharges, and optional declared value insurance (one point five percent of value above ₦50,000).
- **AC-3**: Input validation via shared Zod schema normalizes sender and receiver phone numbers to E.164 (+234...), mandates parcel contents descriptions, and prohibits hazardous materials with a confirmation check.
- **AC-4**: Waybill booking produces a unique tracking code following the `ATM-EXP-XXXXXX` format and generates a cryptographically random four digit pickup verification code.
- **AC-5**: Senders can choose between immediate online checkout (Paystack integration) and terminal counter payment on drop off (`pay_on_dropoff`).
- **AC-6**: Successful booking presents a printable digital waybill slip displaying the tracking code, origin and destination terminals, pickup code instructions, package weight, and integer kobo breakdown.
- **AC-7**: The public tracking portal on `/track` supports instant parcel query by tracking code (`ATM-EXP-XXXXXX`) or recipient phone number, protected by rate limiting.
- **AC-8**: The tracking interface displays a visual chain of custody timeline with stages: `booked`, `received_at_origin`, `in_transit`, `arrived_at_destination`, and `delivered`. All event timestamps render in Africa/Lagos WAT (UTC+1).
- **AC-9**: Automated SMS dispatch notifies the sender upon initial booking and alerts the recipient with the destination terminal address, collection hours, and pickup verification code once the parcel arrives.

## Options considered

### Option 1: Dedicated courier booking portal with terminal counter collection and pickup code verification

Senders book parcel shipping online with transparent pricing, receiving a digital waybill pass. Parcels travel in designated Sienna luggage compartments on scheduled passenger trips. Recipients pick up packages at the destination terminal warehouse by presenting their four digit pickup code and photo identification.

**Pros**:
- Leverages existing terminal infrastructure and scheduled Sienna departures with zero extra fleet capital.
- Pickup code verification guarantees safe collection and eliminates misdelivery.
- Digital booking shortens terminal counter queues.

**Cons**:
- Requires recipients to travel to destination terminals for collection rather than doorstep delivery. (This aligns with Nigerian intercity parcel logistics norms where terminal to terminal is standard and reliable).

### Option 2: Doorstep last mile delivery integration with third party motorbike couriers

Integrate local third party dispatch riders in each destination city to pick up parcels from terminals and deliver directly to residential addresses.

**Pros**:
- Full door to door convenience for recipients.

**Cons**:
- Multi party complexity with third party rider dispatch APIs.
- Extreme variability in last mile delivery costs across Lagos, Abuja, and Enugu.
- Out of scope for Phase 6; deferred to future logistics expansions.

### Option 3: Physical terminal paper manifests only with phone call notifications

Retain legacy paper waybill books at counters and rely on drivers calling recipients upon arrival.

**Pros**:
- No software development needed.

**Cons**:
- Unacceptable operational risk, lost waybills, zero public visibility, and high customer dispute rates.

## Decision

**Chosen option**: Option 1: Dedicated courier booking portal with terminal counter collection and pickup code verification.

We build `/courier` for online freight booking and `/track` for public chain of custody tracking, backed by a unified parcel repository, pure integer kobo calculation functions, Zod validation, and pickup code verification.

**Implementation skills**: `drizzle-orm` (`mindrally/skills`, `.agents/skills/drizzle-orm/`) · `zod-schema-validation` (`mindrally/skills`, `.agents/skills/zod-schema-validation/`) · `coss` (`cosscom/ui`, `.agents/skills/coss/`) · `antigravity-design-expert` (`.agents/skills/antigravity-design-expert/`)

## Rationale

Intercity parcel transit in Nigeria is predominantly terminal to terminal. Travelers and business owners trust physical terminals because parcels are stored securely in guarded parcel rooms until collection. 

Terminal to terminal transport matches Ascent Transport Management's operational model: Toyota Sienna vehicles travel between fixed terminals on predictable timetables, providing same day or next morning intercity delivery.

A four digit pickup code sent directly to the recipient phone ensures that only the rightful owner can collect the package, protecting valuable electronics and documents.

## Feature design

**Data model**:
Tables already declared in database schema (`DbParcel` and `DbParcelEvent`):
- `parcels`:
  - `id`: uuid primary key
  - `trackingCode`: text unique (`ATM-EXP-XXXXXX`)
  - `senderName`: text
  - `senderPhone`: text (normalized E.164)
  - `senderEmail`: text nullable
  - `receiverName`: text
  - `receiverPhone`: text (normalized E.164)
  - `receiverAddress`: text nullable
  - `originTerminalId`: text foreign key
  - `destinationTerminalId`: text foreign key
  - `category`: text ('documents' | 'electronics' | 'clothing' | 'perishables' | 'fragile' | 'general')
  - `description`: text
  - `weightKg`: real
  - `fragile`: boolean
  - `declaredValueKobo`: integer nullable
  - `feeKobo`: integer (freight fee in kobo)
  - `insuranceFeeKobo`: integer (insurance surcharge in kobo)
  - `totalFeeKobo`: integer
  - `pickupOtp`: text (four digit verification code, e.g. '8492')
  - `status`: 'booked' | 'received_at_origin' | 'in_transit' | 'arrived_at_destination' | 'delivered' | 'cancelled' | 'returned'
  - `paid`: boolean
  - `paymentMethod`: 'online' | 'pay_on_dropoff'
  - `createdAt`: string (ISO UTC)
  - `updatedAt`: string (ISO UTC)

- `parcel_events`:
  - `id`: uuid primary key
  - `parcelId`: uuid foreign key
  - `status`: text
  - `locationTerminalId`: text nullable
  - `description`: text
  - `recordedByStaffId`: text nullable
  - `createdAt`: string (ISO UTC)

**Pricing calculation logic (integer kobo)**:
- Base fee:
  - Documents (up to 1kg): ₦3,500 (350,000 kobo)
  - Standard parcels (1kg to 5kg): ₦5,000 (500,000 kobo)
  - Additional weight: ₦500 (50,000 kobo) per kilogram above 5kg
- Fragile handling surcharge: ₦1,500 (150,000 kobo)
- Transit insurance:
  - If declared value exceeds ₦50,000 (5,000,000 kobo), insurance fee is one point five percent (1.5%) of declared value in integer kobo.

**Public routes**:
1. `/courier`: Parcel booking intake form with step by step corridor selection, weight and category inputs, real time price calculation, and waybill slip generator.
2. `/track`: Waybill tracking portal with search bar, rate limited lookup, dynamic progress bar, interactive milestone cards, and terminal pickup guide.

## Security considerations

- **Rate limiting**: Tracking queries are rate limited to prevent automated brute force enumeration of recipient phone numbers or tracking codes.
- **Pickup code**: The four digit collection code is sent to the recipient phone and displayed only to the booking creator, preventing unauthorized collection.
- **Prohibited goods compliance**: Senders must explicitly confirm that packages contain no currency notes, flammable liquids, contraband, or illegal substances.
