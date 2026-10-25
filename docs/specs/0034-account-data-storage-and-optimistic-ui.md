# 0034. Account Data Storage Layer and TanStack Query Optimistic UI

**Date**: 2026-10-25
**Status**: Proposed

## Summary

This specification defines the Account Data Storage Layer, personal privacy controls, and seamless client caching for Ascent Transport Management. It introduces an interactive data and customization hub inside the customer account area where travelers can view stored data, adjust notification and travel preferences, download personal data archives, and clear local caches. To ensure zero perceived latency, the application adopts TanStack Query v5 alongside React 19 optimistic UI updates, delivering instant local feedback for companion passenger management, preference toggles, and saved trips with automatic rollback if network requests fail.

## Context

Ascent Transport Management operates Toyota Sienna passenger travel across Nigerian intercity routes including Enugu, Abuja, Lagos, and Owerri. While basic authentication and ticket viewing exist, repeat travelers lack a centralized place to inspect all data stored about them, configure communication channels (SMS, WhatsApp, email), or set default travel comfort preferences such as preferred seating rows. Under the Nigeria Data Protection Act (NDPA), customers are also entitled to inspect and export their personal data and clear client stored session data.

From a performance standpoint, mutations such as saving companion passengers or updating profile preferences previously relied on round trip network requests. This creates noticeable UI freezing or spinner delays on mobile networks. With React 19 and TanStack Query v5, client interactions can reflect changes immediately on tap using optimistic state, ensuring a smooth, tactile experience across desktop and mobile devices.

## Requirements

**User stories**:
- As a logged in traveler on `/account`, I want to access a dedicated Data and Preferences tab so that I can view what information Ascent stores about me, choose how I receive journey alerts, and specify my default travel choices.
- As a privacy conscious customer, I want to download my complete personal travel archive in JSON format and clear local browser data with one tap.
- As a customer managing frequent travel companions, I want additions, edits, and deletions to reflect immediately in the interface without waiting for server network responses.
- As a traveler browsing scheduled trips, I want to bookmark or unbookmark routes with instant visual feedback and seamless background synchronization.

**Acceptance criteria**:
- **AC-1**: Customer account navigation features a dedicated Data and Storage tab displaying customer profile details, stored payment tokens count, booking totals, and credit ledger status.
- **AC-2**: Traveler preferences section allows customers to customize notification channels (SMS, WhatsApp, and Email alerts) and travel defaults (preferred seat position and emergency contact auto fill) with instant optimistic toggle updates.
- **AC-3**: Export Personal Data action generates and downloads an NDPA compliant structured JSON document containing customer profile info, companion passenger records, booking refs, and credit transactions.
- **AC-4**: Local Cache Management card displays estimated local storage usage and provides a Clear Local Cache action that resets cached queries and local preferences safely without invalidating the active authentication session.
- **AC-5**: Global `QueryProvider` wraps the application tree, initializing a singleton `QueryClient` configured with a 5 minute stale time, 15 minute garbage collection window, and retry backoff.
- **AC-6**: Companion passenger additions and removals employ TanStack Query optimistic mutations (`onMutate`, `onError` rollback, and `onSettled` revalidation) to ensure zero perceived delay and full recovery if the server rejects a payload.
- **AC-7**: All profile and preference mutations are protected by strict server side Zod schema validation and normalize Nigerian phone numbers to E.164 (+234...) format.
- **AC-8**: All monetary values in exported records and account displays strictly use integer kobo, formatted in Nigerian Naira only at the interface boundary.

## Options considered

### Option 1: Ad hoc local React state and manual fetch calls
Rely on standard `useState` and native `fetch` inside each account component, refetching full payloads after every save.

**Pros**:
- Zero additional client dependencies.

**Cons**:
- Brittle state synchronization across components.
- Visible UI lag while waiting for network responses on spotty mobile connections.
- Duplicated rollback and error handling boilerplate across forms.

### Option 2: TanStack Query v5 with React 19 Optimistic Mutations and Local Storage Sync (Chosen)
Deploy TanStack Query v5 as the unified data synchronization layer, pairing server mutations with React 19 optimistic updates and selective local storage caching for offline traveler preferences.

**Pros**:
- Instantaneous UI response on every toggle or companion mutation.
- Built in request deduplication, cache garbage collection, and automatic background refetching.
- Bulletproof rollback when network interruptions occur.
- Meets Nigeria Data Protection Act compliance requirements with clear data inspection and JSON export tools.

**Cons**:
- Requires adding `@tanstack/react-query` to the web package.

## Decision

**Chosen option**: Option 2: TanStack Query v5 with React 19 Optimistic Mutations and Local Storage Sync.

We establish TanStack Query v5 as the project data layer and build the Account Data Storage hub with optimistic UI updates.

**Implementation skills**: `coss` (`cosscom/ui`, `.agents/skills/coss/`) · `improve-ui` (`ibelick/ui-skills`, `.agents/skills/improve-ui/`) · `improve-animations` (`emilkowalski/skills`, `.agents/skills/improve-animations/`) · `zod-schema-validation` (`mindrally/skills`, `.agents/skills/zod-schema-validation/`) · `vercel-react-best-practices` (`vercel/skills`, `.agents/skills/vercel-react-best-practices/`)

## Rationale

Intercity road transit booking in Nigeria frequently happens on mobile devices with variable cell signal. Waiting 800 milliseconds for an SMS alert toggle or a companion deletion degrades user confidence. By coupling TanStack Query optimistic cache manipulation with React 19 state transitions, every action provides instantaneous tactile feedback while background workers handle network synchronization. Furthermore, providing a clear data storage section demonstrates organizational transparency and NDPA compliance.

## Feature design

### Data model sketch

**Customer Preferences Object** (stored as JSONB in `DbCustomer.preferences` or retrieved via `/api/customers/preferences`):
- `smsAlerts`: boolean (default true)
- `whatsappAlerts`: boolean (default true)
- `emailReceipts`: boolean (default true)
- `preferredSeatPosition`: 'front_window' | 'middle_row' | 'rear_row' | 'any' (default 'any')
- `autoFillEmergencyContact`: boolean (default true)
- `localDataConsent`: boolean (default true)

### API surface

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/customers/preferences` | GET | `userId` | `{ preferences: CustomerPreferences }` | Session required | 401 Unauthorized |
| `/api/customers/preferences` | PUT | `preferences` payload | `{ success: true, preferences }` | Session required | 400 Validation, 401 Unauthorized |
| `/api/customers/export-data` | GET | `userId` | JSON archive file download | Session required | 401 Unauthorized, 404 Customer Not Found |
| `/api/customers/companions` | POST | `fullName`, `gender`, `phone`, `isDefaultNextOfKin` | `{ companion: CompanionPassenger }` | Session required | 400 Invalid phone/name, 409 Limit reached |
| `/api/customers/companions/[id]` | DELETE | `id` route parameter | `{ success: true }` | Session required | 401 Unauthorized, 404 Not Found |

### Client Cache Architecture

1. **`QueryProvider`**:
   - Location: `apps/web/src/components/providers/QueryProvider.tsx`
   - Configures `QueryClient` with default query options: `staleTime: 1000 * 60 * 5` (5 minutes), `gcTime: 1000 * 60 * 15` (15 minutes), `refetchOnWindowFocus: false`, `retry: 1`.
   - Uses React `useState` to instantiate the browser client singleton, preventing cross request state pollution during Next.js SSR.

2. **Optimistic Mutation Pattern**:
   - Cancel outgoing queries for key: `await queryClient.cancelQueries({ queryKey })`.
   - Snapshot previous query data for rollback: `const previous = queryClient.getQueryData(queryKey)`.
   - Optimistically set new data: `queryClient.setQueryData(queryKey, updater)`.
   - On error: `queryClient.setQueryData(queryKey, previous)`.
   - On settle: `queryClient.invalidateQueries({ queryKey })`.

## Build plan

- **Slice 1 (Dependencies & Provider Foundation)**:
  - Install `@tanstack/react-query` and `@tanstack/react-query-devtools` in `apps/web`.
  - Create `apps/web/src/components/providers/QueryProvider.tsx` and integrate it into root layout.
  - Satisfies: **AC-5**.

- **Slice 2 (API Routes & Zod Validation)**:
  - Create `/api/customers/preferences` route with GET and PUT handlers with Zod schema validation.
  - Create `/api/customers/export-data` route generating comprehensive JSON export.
  - Create companion passenger endpoints for add and delete.
  - Satisfies: **AC-3**, **AC-7**, **AC-8**.

- **Slice 3 (Optimistic UI Hooks & Mutations)**:
  - Create React Query hooks for customer preferences and companion roster.
  - Implement optimistic companion creation and deletion with immediate list update and error rollback.
  - Satisfies: **AC-6**.

- **Slice 4 (Account UI Data & Privacy Tab)**:
  - Add Data and Privacy (`storage`) tab to `/account` navigation.
  - Build Data Overview card, Notification Channels card, Travel Comfort Defaults card, Data Export card, and Local Cache Purge button.
  - Satisfies: **AC-1**, **AC-2**, **AC-4**.

- **Slice 5 (Verification & Quality Assurance)**:
  - Verify complete type safety with `pnpm --filter @atm/web typecheck`.
  - Verify test suite with `pnpm test`.

## Consequences

- Repeat travelers have full visibility into and sovereignty over their personal data.
- User experience is noticeably faster and fluid with optimistic cache updates.
- TanStack Query becomes the standard client side data coordination tool for upcoming features.
