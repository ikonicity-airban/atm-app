# 0029. Public pages layout container queries and micro animations

**Date**: 2026-10-20
**Status**: Proposed

## Summary

This specification defines the architectural standard for container queries, responsive width boundaries, and tactile micro animations across all public surfaces in Ascent Transport Management. Building on the Coss UI tokens and Base UI primitives established in specification 0028, this design replaces brittle viewport media queries with dual container query contexts, enforces strict maximum width tiers, and introduces high craft motion physics for interactive cards and floating navigation pills.

The rollout begins with the complete modular stack of the home page, then extends systematically down through the passenger booking search, freight courier intake, private vehicle charter, live waybill tracking, and terminal directory portals.

## Context

While specification 0028 unified core interactive primitives and eliminated theme contrast failures, the macro layout of public pages still relies on inconsistent outer wrapper widths and viewport width media queries. On wide monitors, cards can stretch excessively or suffer from uneven gutter gaps, while on split screens and tablet viewports, multi column grids do not adapt based on their available container space.

Furthermore, micro interactions across public cards, pill buttons, and segmented controls vary in easing curves and tactile responsiveness. Certain elements lack spring physics or active tap states, while others risk violating the project invariant requiring complete respect for user reduced motion settings.

Adopting container queries directly supported by Tailwind CSS v4 alongside Framer Motion layout springs establishes optical alignment and weightless glassmorphism depth across every viewport size without visual regressions.

## Requirements

**User stories**:
- As an interstate traveler or business commuter, I want search filters, booking cards, and trip options to resize fluidly according to their card container width so that the layout feels natural on phones, tablets, split screens, and widescreen desktop monitors.
- As a customer navigating routes, I want instant tactile feedback on buttons, pills, and interactive cards with smooth spring transitions so that the reservation experience feels responsive and executive.
- As a user with motion sensitivity, I want all spring transitions and motion transforms to be disabled automatically when reduced motion is preferred.

**Acceptance criteria**:
- **AC-1**: Implement a dual container query architecture across public layouts by assigning `@container/page` to `PageShell` in `Templates.tsx` and `@container/section` to all modular home and funnel sections.
- **AC-2**: Enforce a strict three tier max width hierarchy: standard (`max-w-7xl` with responsive padding `px-4 sm:px-6 lg:px-8`) for multi column galleries and catalog grids, compact (`max-w-5xl`) for focused transactional booking funnels, and prose (`max-w-3xl`) for legal terms and policy documents.
- **AC-3**: Container modular breakpoints (`@sm:`, `@md:`, `@lg:`, `@xl:`) govern responsive column wrapping inside cards, ensuring search forms, bento tiles, and step cards reflow based on their container size rather than window width alone.
- **AC-4**: Standardize spring physics for floating navigation pills, segmented mode toggles, and hover states using Framer Motion layout springs configured with stiffness 450 and damping 32.
- **AC-5**: Interactive cards feature spatial hover lifts (`hover:-translate-y-1`), active tactile press states (`active:scale-[0.98]`), and translucent border highlights (`hover:border-primary/40`).
- **AC-6**: Adhere strictly to the project architectural rule banning pulse animations anywhere, using static skeleton placeholders instead.
- **AC-7**: All section headings and subtitles rest directly on their respective section backgrounds, completely unbadged and without card or pill wrappers.
- **AC-8**: Respect `prefers-reduced-motion: reduce` across all CSS transitions and Framer Motion components via global motion cancellation utilities (`motion-reduce:transform-none motion-reduce:transition-none`).
- **AC-9**: Refactor all modular home sections in sequential top down order: `HeroShowcase`, `StationStrip`, `ServicePillars`, `HowItWorksVideoSteps`, `TrendingBentoGallery`, `SmartTicketingCheckout`, `MobileAppBanner`, `CustomerReviews`, `ClosingCta`, and the FAQ `Accordion`.
- **AC-10**: Cascade the container query and micro animation standard downward into public funnel pages: `/trips`, `/courier`, `/charter`, `/track`, `/terminals`, and `/about`.

## Options considered

### Option 1: Dual container queries with Framer Motion springs and Tailwind v4 tokens (Chosen)

In this approach, the layout shell provides `@container/page` while individual content sections provide `@container/section`. Component children use `@sm:`, `@md:`, and `@lg:` container variants to reflow their internal columns. Interactive pills use Framer Motion layoutId springs, while cards use tactile CSS hover transforms and glassmorphism depth.

**Pros**:
- Components adapt to their immediate container space, functioning identically inside dialogs, side drawers, and full pages.
- Native Tailwind v4 container query support with zero extra JavaScript footprint for layout calculations.
- Fluid, organic spring physics that eliminate jarring jump cuts during tab switches.
- Full respect for user reduced motion preferences.

**Cons**:
- Requires updating class names across all home page modular sections.

### Option 2: Viewport media queries only with pure CSS transitions

Rely solely on standard Tailwind viewport breakpoints (`sm:`, `md:`, `lg:`) and CSS transitions without container queries or Framer Motion layout animations.

**Pros**:
- Slightly fewer class modifications.

**Cons**:
- Components cannot respond to container width changes when placed in narrower parent columns or multi column split views.
- Segmented pill switches lack magnetic spring physics.

## Decision

Adopt Option 1. The public application architecture will standardize on dual container query contexts, strict max width tiers, and tactile spring interactions starting from the home page downward.

**Implementation skills**:
- `antigravity-design-expert`: spatial depth, glassmorphism card surfaces, and tactile micro interactions.
- `ui-skills-root`: structural layout routing and container boundaries.
- `improve-animations`: spring physics, motion audit, and reduced motion safety.
- `coss`: Base UI and Coss token component composition.

## Build plan

### Tracer Bullet slice: Core layout container queries and Home page hero

1. Update `apps/web/src/components/layout/Templates.tsx` (`PageShell`) to apply `@container/page` and verify max width constraints across standard, compact, and prose widths.
2. Refactor `apps/web/src/components/home/HeroShowcase.tsx` with container query classes (`@container/section`, `@sm:`, `@md:`, `@lg:`) for the search island, and polish spring transitions on trip mode pills.

### Slice 2: Home page upper modular sections

3. Refactor `apps/web/src/components/home/StationStrip.tsx` with container queries for terminal chips and tactile hover micro animations.
4. Refactor `apps/web/src/components/home/ServicePillars.tsx` with container queries for the four pillar cards, unbadged section titles, and hover lifts.
5. Refactor `apps/web/src/components/home/HowItWorksVideoSteps.tsx` with container queries and interactive preview transitions.

### Slice 3: Home page lower modular sections

6. Refactor `apps/web/src/components/home/TrendingBentoGallery.tsx` with container queries on bento items, spatial depth, and tactile click states.
7. Refactor `apps/web/src/components/home/SmartTicketingCheckout.tsx` with container queries on ticket preview cards and seat steppers.
8. Refactor `apps/web/src/components/home/MobileAppBanner.tsx`, `CustomerReviews.tsx`, `ClosingCta.tsx`, and FAQ `Accordion.tsx` with container queries and unbadged headers.

### Slice 4: Public booking and service funnels

9. Apply container queries and tactile micro animations to `/trips` and the search results grid.
10. Apply container queries and tactile micro animations to `/courier` waybill intake and summary sidebar.
11. Apply container queries and tactile micro animations to `/charter` reservation steps.
12. Apply container queries to `/track` parcel timeline and `/terminals` directory.

## Consequences

### Positive
- Public pages display optical balance on all screen form factors, from mobile phones to ultra wide desktop monitors.
- Cards reflow predictably when embedded in grids or split columns.
- Tactile spring micro animations elevate brand perception without impacting performance.
- Absolute compliance with accessibility rules regarding touch targets and reduced motion preferences.

### Negative / Tradeoffs
- Requires updating section wrappers across multiple page components.

## Follow-up

- Run `scripts/check-contrast.ts` and automated test suites following each slice implementation.
- Verify smooth responsive reflow on mobile viewports using device emulation.

## Rationale

Container queries represent modern web layout best practices, allowing individual components to own their responsive behavior based on their parent context rather than external screen dimensions. Combining container queries with Framer Motion layout springs delivers an executive, weightless user experience tailored to Nigerian corporate commuters.
