# Spec 0030: 404 and Error Boundaries

## Summary

This specification defines the universal error handling and not found routing architecture for Ascent Transport Management (ATM Nigeria). The system establishes resilient root level and route group level error boundaries, providing a dignified recovery experience for lost travelers and operations personnel.

The implementation features an Executive Travel Concierge for not found states, dual environment error reporting that shows diagnostics during development while keeping production clean, and a spatial transport visual motif that aligns with the ATM Nigeria design tokens.

---

## Motivation and Scope

When a customer encounters a missing URL, expired booking token, or network disruption, default framework error pages break trust and leave users stranded.

This feature delivers complete coverage across key touchpoints:
1. Root level Not Found (`apps/web/src/app/not-found.tsx`) for unmapped domain routes, incorporating the public navigation shell.
2. Root level Global Error (`apps/web/src/app/global-error.tsx`) as a failsafe when the root layout itself encounters a runtime fault.
3. Public route group Not Found (`apps/web/src/app/(public)/not-found.tsx`) rendered inside the standard public funnel.
4. Public route group Error Boundary (`apps/web/src/app/(public)/error.tsx`) offering graceful recovery, server component cache refresh, and concierge assistance.
5. Administrative portal Error Boundary (`apps/web/src/app/(admin)/admin/error.tsx`) providing compact operational error recovery.

Reusable visual templates in `apps/web/src/components/error/` encapsulate the layout logic, guaranteeing visual consistency and theme responsiveness across dark and light modes.

---

## Design System and Aesthetic Principles

1. **Spatial Transport Motif**: The hero visual displays a transit waypoint graphic with an elegant detour trajectory, rendered with clean SVG geometry.
2. **Surface Hierarchy**: Visual cards utilize the established glassmorphic classes (`glass-card-spatial` and `glass-surface` with `bg-card/90 border border-border rounded-2xl shadow-xl`).
3. **Typography and Titles**: Titles rest directly on surface backgrounds, never wrapped inside badges, pills, or status labels.
4. **Motion Discipline**: All transitions respect user accessibility preferences via `prefers-reduced-motion`. Zero pulsating keyframe animations or `animate-pulse` utilities are permitted.
5. **Theme Responsiveness**: All elements utilize semantic CSS variables (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`) to switch effortlessly between daylight and dark obsidian modes.
6. **Semantic Navigation**: Interactive buttons for browser actions use Coss UI `Button`, whereas route navigation and corridor shortcuts strictly use Next.js `Link` components styled with `buttonVariants({ ... })` to preserve search crawler indexing, right clicks, and native tab behaviors.

---

## Dual Environment Error Reporting

The error boundary architecture adapts dynamically based on `process.env.NODE_ENV`:

### Development Mode (`NODE_ENV === 'development'`)
- Displays an incident reference code and Next.js error digest. When an error digest is omitted, an incident reference token is generated using the pattern `ATM-` followed by the base36 timestamp.
- Provides a one click copy button for the incident token and error message, with two second visual feedback and clipboard fallback.
- Offers an expandable diagnostic details panel rendering component stack traces and failure contexts.
- Includes a direct WhatsApp support action prefilled with the crash digest and route path for quick debugging.
- Renders an interactive Try Again button that triggers React 19 transition recovery.

### Production and Staging Environments
- Presents a calm, reassuring customer apology without technical jargon or stack traces.
- Displays a discrete support reference identifier if an error digest or incident token exists.
- Supplies clear recovery paths: Try Again, Return to Homepage, and Live Dispatch Support.
- Keeps sensitive application internals shielded from public view.

---

## Next.js 15 and React 19 Recovery Architecture

1. **Server Component Cache Invalidation**:
   In Next.js 15, executing `reset()` alone fails to recover server components because the client error boundary simply re mounts the failed server cache. All recovery triggers execute within `startTransition`:
   ```typescript
   startTransition(() => {
     router.refresh();
     reset();
   });
   ```
2. **Root 404 Shell Encapsulation**:
   Because Next.js 15 routes unmapped URLs directly to the root `apps/web/src/app/not-found.tsx` outside of the `(public)` group layout, the root 404 page directly wraps `NotFoundView` inside `PublicHeader` and `PublicFooter` shells, preventing bare or broken layouts.
3. **Global Error Isolation**:
   Because `apps/web/src/app/global-error.tsx` replaces `RootLayout`, it does not inherit root font variables or CSS imports. It explicitly imports `./globals.css`, declares its own `<html lang="en">` and `<body>` tags, executes the inline local storage theme hydration script, and renders a resilient recovery card.

---

## Executive Travel Concierge (404 States)

Lost travelers on missing routes receive actionable assistance rather than dead ends:
1. **Corridor Shortcuts**: One click links to premier transport routes:
   - Lagos to Abuja: `/trips?from=Lagos&to=Abuja`
   - Port Harcourt to Owerri: `/trips?from=Port+Harcourt&to=Owerri`
   - Lagos to Benin: `/trips?from=Lagos&to=Benin`
   - Enugu to Abuja: `/trips?from=Enugu&to=Abuja`
2. **Service Jump Points**: Direct links to primary operational services:
   - Trip Search: `/trips`
   - Parcel Tracking: `/track`
   - Courier Services: `/courier`
   - Charter Services: `/charter`
3. **Emergency Support Desk**: Instant WhatsApp concierge contact link using `BRAND.contactPhones[0]` from `@atm/shared`, with prefilled message context including the requested path and current timestamp.
4. **Primary Navigation**: Link styled with `buttonVariants({ variant: 'default' })` returning the traveler directly to the homepage.

---

## Component Architecture and Contracts

### 1. Reusable View Components (`apps/web/src/components/error/`)

#### `NotFoundView.tsx`
Client presentation component for 404 pages.

```typescript
export interface TravelCorridor {
  from: string;
  to: string;
  label: string;
  departureTime?: string;
}

export interface ServiceJumpPoint {
  label: string;
  href: string;
  iconName: string;
}

export interface NotFoundViewProps {
  title?: string;
  description?: string;
  showConcierge?: boolean;
  homeHref?: string;
  corridors?: TravelCorridor[];
  jumpPoints?: ServiceJumpPoint[];
  className?: string;
}
```

#### `ErrorView.tsx`
Client presentation component for error states.

```typescript
export interface ErrorViewProps {
  error: Error & { digest?: string };
  reset: () => void;
  portalTitle?: string;
  homeHref?: string;
  density?: 'default' | 'compact';
  showDevDetails?: boolean;
  className?: string;
}
```

State Contracts:
- `isCopied: boolean`: Manages copy confirmation state, resetting after 2000 milliseconds.
- `isDetailsOpen: boolean`: Toggles the technical diagnostics drawer in development mode.
- `incidentCode: string`: Memoized reference token derived from `error.digest` or generated timestamp.

### 2. Next.js App Router Integration Files

| File Path | Component Role | Layout Context | Recovery Strategy |
| :--- | :--- | :--- | :--- |
| `apps/web/src/app/not-found.tsx` | Global catch all 404 | Nested in RootLayout, embeds PublicHeader and Footer | Link to homepage and corridors |
| `apps/web/src/app/global-error.tsx` | Catastrophic root error boundary | Standalone `<html>` and `<body>` with theme script | `startTransition(() => { router.refresh(); reset(); })` |
| `apps/web/src/app/(public)/not-found.tsx` | Public 404 view | PublicHeader and PublicFooter | Link to homepage and corridors |
| `apps/web/src/app/(public)/error.tsx` | Public client error boundary | PublicHeader and PublicFooter | `startTransition(() => { router.refresh(); reset(); })` |
| `apps/web/src/app/(admin)/admin/error.tsx` | Admin operations error boundary | Admin navigation sidebar | Compact density with retry and dashboard return |

---

## Acceptance Criteria

- **AC-1 Root 404 Resolution**: Accessing any non existent route triggers `apps/web/src/app/not-found.tsx` wrapped in the public header and footer without server exceptions or layout collapse.
- **AC-2 Public 404 Concierge**: The public not found screen displays popular intercity corridors and direct links to trip search and parcel tracking using Next.js `Link` components styled via `buttonVariants`.
- **AC-3 Dev Mode Diagnostics**: When running in development mode, `ErrorView` displays the error digest, copyable reference token, and technical diagnostic drawer.
- **AC-4 Production Protection**: In production mode, technical stack traces and raw error messages are suppressed in favor of customer friendly guidance and a support reference identifier.
- **AC-5 Dual Phase Reset Recovery**: Clicking the Try Again button executes `startTransition` with both `router.refresh()` and `reset()` without requiring a manual browser refresh.
- **AC-6 Global Error Independence**: `apps/web/src/app/global-error.tsx` renders its own valid `<html>` and `<body>` tags, imports `globals.css`, executes the theme hydration script, and provides a recovery button.
- **AC-7 Coss UI Consistency**: All buttons, links, and icons use the standardized Coss UI Button variants and theme observant Icon components.
- **AC-8 Accessibility and Motion**: All focus states satisfy WCAG AA 4.5 to 1 contrast ratios, keyboard navigation operates smoothly, and animations respect `prefers-reduced-motion`.
- **AC-9 Compact Admin Presentation**: The admin error boundary renders in compact density mode, maintaining administrative context without overwhelming the dashboard.

---

## Implementation Plan

1. **Phase 1: Component Construction**
   - Create `apps/web/src/components/error/NotFoundView.tsx` with spatial transport motif and executive corridor shortcuts.
   - Create `apps/web/src/components/error/ErrorView.tsx` with dual mode telemetry, copyable incident token, and compact density support.
2. **Phase 2: App Router Boundary Deployment**
   - Implement root `apps/web/src/app/not-found.tsx` with embedded public navigation shell.
   - Implement root `apps/web/src/app/global-error.tsx` with self contained HTML shell, theme script, and `ErrorView`.
   - Update `apps/web/src/app/(public)/not-found.tsx` to leverage `NotFoundView`.
   - Update `apps/web/src/app/(public)/error.tsx` to leverage `ErrorView` with `startTransition` recovery.
   - Update `apps/web/src/app/(admin)/admin/error.tsx` to leverage `ErrorView` with `density="compact"`.
3. **Phase 3: Verification and Quality Assurance**
   - Execute type checks and test suites across the monorepo (`pnpm typecheck`, `pnpm test`).
   - Verify light and dark mode styling across all error viewports.
