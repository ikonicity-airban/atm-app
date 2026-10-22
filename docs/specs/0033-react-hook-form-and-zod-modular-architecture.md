# 0033. Standardize form management with React Hook Form and Zod schemas

**Date**: 2026-10-22
**Status**: Proposed

## Summary

This specification establishes a clean, reusable architecture for all form handling across Ascent Transport Management web surfaces. We adopt React Hook Form paired with Zod schema validation to eliminate sprawling manual state in page components. Every form is extracted to its own dedicated file under a structured domain directory, cleanly separating presentation, validation logic, and server actions.

## Context

Forms across our application currently rely on manual React state variables, ad hoc validation handlers, and scattered error states embedded directly inside page files. For example, our trips search page, booking checkout, courier waybill submission, charter requests, and admin check in screens mix UI presentation with manual input binding.

This approach creates several problems:
1. Re-rendering overhead: Typing into an unmanaged input triggers full page component re-renders.
2. Inconsistent validation: Some forms check phone numbers or passenger limits while others lack instant user feedback before mutation.
3. Code bloat: Page components exceed seven hundred lines because form state and presentation are tightly tangled.
4. Maintenance friction: Testing or updating validation rules requires modifying entire page layouts.

By adopting React Hook Form with Zod resolvers, we establish a single high craft pattern for all user input while complying with our existing rules for integer kobo pricing, E.164 phone normalization, and WAT timezone handling.

## Requirements

**User stories**:
- As a traveler or customer, I want immediate visual validation on every form field so that I know exactly how to correct mistakes before submitting.
- As a frontend engineer, I want isolated, type safe form components so that I can modify form logic and validation schemas without touching page layout code.
- As an administrator, I want robust server and client validation on fleet, pricing, and dispatch operations to prevent corrupted records.

**Acceptance criteria**:
- **AC-1**: All input forms validate against strict Zod schemas on both client side blur or submit and on server mutations.
- **AC-2**: Extracted forms live in dedicated domain directories under `src/components/forms/` rather than inline within page files.
- **AC-3**: A reusable `FormField` component connects React Hook Form to Coss UI input, select, and calendar primitives with accessible aria attributes.
- **AC-4**: Form submission displays clear inline field error messages without pulsing animations or layout shifts.
- **AC-5**: Nigerian phone numbers normalize automatically to E.164 format (+234...) on form validation and submit.
- **AC-6**: Monetary amounts validate strictly as positive integer kobo, never floating point naira.
- **AC-7**: Travel dates enforce valid ISO-8601 calendar dates in Africa/Lagos WAT timezone, disallowing past dates.

## Options considered

### Option 1: React Hook Form with @hookform/resolvers and Zod (Chosen)

React Hook Form uses uncontrolled inputs with micro subscriptions, minimizing component re-renders. It pairs seamlessly with Zod via `@hookform/resolvers/zod`, matching our existing `@atm/shared` schemas.

**Pros**:
- High performance with minimal re-renders during typing.
- Type safe form values derived directly from existing Zod schemas.
- Clean integration with Base UI and Coss UI primitives via Controller.
- Low bundle footprint (~8.5kB gzipped).

**Cons**:
- Requires learning the Controller pattern for custom select and date picker primitives.

### Option 2: TanStack Form with Zod

TanStack Form provides framework agnostic form state management with type safe field arrays.

**Pros**:
- Modern design with first class TypeScript inference.
- Headless architecture.

**Cons**:
- Smaller ecosystem and community examples compared to React Hook Form.
- Adds an additional dependency ecosystem distinct from established Next.js and shadcn/coss UI standards.

### Option 3: Vanilla React State with Form Actions

Continue using native `useState` or Next.js `useActionState` without an external form library.

**Pros**:
- Zero additional external dependencies.

**Cons**:
- Verbose boilerplate for field errors, touched states, and dirty tracking.
- Heavy re-renders on complex forms like multi passenger checkout.
- High risk of inconsistent validation rules between surfaces.

## Decision

**Chosen option**: Option 1: React Hook Form with @hookform/resolvers and Zod

We standardize on React Hook Form (`react-hook-form`), `@hookform/resolvers`, and `zod` for all form handling across the web application.

**Implementation skills**: `zod-schema-validation` (`mindrally/skills`, `.agents/skills/zod-schema-validation/`), `coss` (`cosscom/ui`, `.agents/skills/coss/`), `improve-ui` (`ibelick/ui-skills`, `.agents/skills/improve-ui/`)

## Rationale

React Hook Form is the industry standard for Next.js applications, offering the best balance of render performance, developer ergonomics, and ecosystem integration. Because our codebase already relies on Zod in `@atm/shared` and server repositories, using `@hookform/resolvers/zod` allows direct schema reuse from database models straight to user interface forms.

Extracting forms into dedicated domain files under `src/components/forms/` keeps page components lean, focused solely on layout, data fetching, and page shells.

## Feature design

### Module Structure

Extracted forms and their typed schemas will be organized by business domain under `apps/web/src/components/forms/`:

```text
apps/web/src/components/forms/
├── common/
│   ├── Form.tsx                 (FormProvider, FormField, FormItem, FormLabel, FormControl, FormMessage)
│   └── useZodForm.ts            (Typed custom hook wrapping useForm with Zod resolver)
├── booking/
│   ├── SearchTripForm.tsx       (Compact and expanded corridor search with Coss calendar)
│   ├── PassengerCheckoutForm.tsx (Passenger seat assignment, name, phone, emergency contact)
│   └── booking.schema.ts        (Search and passenger checkout Zod validation schemas)
├── courier/
│   ├── CourierBookingForm.tsx   (Sender, recipient, package category, drop off terminal)
│   └── courier.schema.ts        (Waybill parcel Zod schema with weight and value validation)
├── charter/
│   ├── CharterRequestForm.tsx   (Origin, destination, dates, fleet quantity, corporate tax ID)
│   └── charter.schema.ts        (Charter quote request validation schema)
├── admin/
│   ├── VehicleRegistrationForm.tsx (Plate number, VIN, seat layout, terminal assignment)
│   ├── PricingRuleForm.tsx      (Base fare kobo, peak multiplier, effective date)
│   └── admin.schema.ts          (Administrative operations Zod schemas)
└── auth/
    ├── CustomerLoginForm.tsx    (Phone number, OTP verification)
    └── auth.schema.ts           (Authentication and account validation schemas)
```

### Form Primitive Contract (common/Form.tsx)

```tsx
import { Controller, type ControllerProps, type FieldPath, type FieldValues } from 'react-hook-form';

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return <Controller {...props} />;
}

export function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-1.5', className)} {...props} />;
}

export function FormLabel({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-xs font-bold text-foreground uppercase tracking-wider block', className)}
      {...props}
    />
  );
}

export function FormMessage({ children, error }: { children?: React.ReactNode; error?: string }) {
  const message = error || children;
  if (!message) return null;
  return <p className="text-xs font-semibold text-destructive mt-1">{message}</p>;
}
```

### Value Sourcing

| Action | Value produced / displayed | Source |
|---|---|---|
| Trip Search | Origin and Destination cities | Selected terminal city codes from `SERVED_CITIES` |
| Trip Search | Travel date | Calendar selection normalized to Lagos date string YYYY-MM-DD |
| Trip Search | Passenger headcount | Integer between 1 and 5 |
| Passenger Booking | Customer full name | Text input (minimum 3 characters, alphabetic) |
| Passenger Booking | Phone number | Input normalized to E.164 (+234...) |
| Passenger Booking | Fare payment total | Computed as seat count multiplied by trip base fare in integer kobo |
| Courier Booking | Parcel weight | Positive numeric value in kilograms (maximum 50kg) |
| Courier Booking | Declared value | Positive integer kobo for insurance coverage |

### Key Invariants
- Money is strictly integer kobo in state and schemas (e.g. 35,000 Naira is stored as `3500000`).
- Phone numbers must normalize to E.164 format (+234...) before submission.
- Dates must use Africa/Lagos (WAT, UTC+1) with past dates rejected.
- Form inputs validate client side for instant feedback and always validate server side with Zod before mutation.
- No animate-pulse or pulsing skeleton loaders anywhere.

### Security Model
- Client side validation provides user feedback only; server actions and API route handlers execute identical Zod schema checks independently.
- Sensitive passenger data (phone numbers, full names) are sanitized to prevent injection attacks.
- Admin forms enforce role check guards on submit before database write operations.

### Critical test scenarios
- Happy path: User fills passenger details with valid Lagos phone (+2348012345678) and submits successfully, verifies **AC-1**, **AC-5**.
- Failure case: Submitting empty names, invalid email, or non Nigerian phone displays inline field errors and halts submission, verifies **AC-1**, **AC-4**.
- Edge case: Past travel dates or unserved corridor pairs fail schema validation, verifies **AC-1**, **AC-7**.
- Formatting: Fare and fee totals round strictly to integer kobo with zero floating point drift, verifies **AC-6**.

## Build plan

The implementation follows our Tracer Bullet strategy across three structured phases:

1. **Install Dependencies and Build Foundation Core**, satisfies **AC-1**, **AC-3**
   - Install `react-hook-form` and `@hookform/resolvers` in `@atm/web`.
   - Build `src/components/forms/common/Form.tsx` connecting React Hook Form with Coss UI input, select, and date primitives.
   - Build custom `useZodForm` helper hook.

2. **Phase 1: Customer Booking and Search Slices (Tracer Bullet)**, satisfies **AC-2**, **AC-4**, **AC-5**, **AC-6**, **AC-7**
   - Extract and refactor `SearchTripForm.tsx` (used in Hero, Trips page sidebar, and mobile bottom sheet).
   - Extract and refactor `PassengerCheckoutForm.tsx` in `apps/web/src/app/(public)/book/[tripId]/page.tsx`.
   - Write unit tests validating Zod form resolution and phone normalization.

3. **Phase 2: Customer Self Service Forms**, satisfies **AC-2**, **AC-4**, **AC-5**
   - Extract and refactor `CourierBookingForm.tsx` in `apps/web/src/app/(public)/courier/page.tsx`.
   - Extract and refactor `CharterRequestForm.tsx` in `apps/web/src/app/(public)/charter/page.tsx`.
   - Extract and refactor `TicketManageForm.tsx` in `apps/web/src/app/(public)/manage/page.tsx`.
   - Extract and refactor `ContactInquiryForm.tsx` in `apps/web/src/app/(public)/contact/page.tsx`.

4. **Phase 3: Administrative and Staff Forms**, satisfies **AC-1**, **AC-2**, **AC-4**
   - Extract and refactor `VehicleRegistrationForm.tsx` in `apps/web/src/app/(admin)/admin/fleet/page.tsx`.
   - Extract and refactor `PricingRuleForm.tsx` in `apps/web/src/app/(admin)/admin/pricing/page.tsx`.
   - Extract and refactor `TerminalCheckInForm.tsx` in `apps/web/src/app/(admin)/admin/check-in/page.tsx`.

## Consequences

**Positive**:
- Eliminates hundreds of lines of duplicated state management from page files.
- Substantially reduces unnecessary re-renders while typing.
- Guarantees uniform validation error display and accessible aria announcements.
- Ensures all customer phone numbers and kobo monetary amounts follow Ascent standards.

**Negative / tradeoffs**:
- Introduces small bundle size addition for `react-hook-form` and `@hookform/resolvers` (~10kB gzipped total).
- Developers must wrap custom Coss primitives (such as Select and Calendar) with `Controller` or `FormField`.

## Migration plan

**Strategy**: Strangler Fig pattern with Tracer Bullet rollout.
**Phases**:
1. Foundation & Booking slice (Hero search, Trips sidebar/bottom sheet, Passenger checkout).
2. Public customer forms (Courier, Charter, Ticket Manage, Contact).
3. Operations & Admin forms (Fleet, Pricing, Terminal Check-in).
Each phase is verified independently with automated typecheck and tests before proceeding.

## References

**Project sources**:
- `AGENTS.md` (Ascent Transport Management conventions: kobo integer rules, E.164 phone normalization, WAT timezone).
- `packages/shared/src/schemas/` (Existing Zod schemas for booking, trips, and parcel tracking).
- `.agents/skills/zod-schema-validation/` (Zod schema validation best practices).
- `.agents/skills/coss/` (Coss UI component conventions and form integration).
