# 0025. Trips Search Results Page High Craft Coss UI & Fluid Motion Architecture

**Date**: 2026-10-18
**Status**: Accepted

## Summary

This specification upgrades the Ascent Transport Management (ATM Nigeria) trips search page (`apps/web/src/app/(public)/trips/page.tsx`) to match airline-grade executive transit booking experiences. Applying the `/improve-ui`, `/coss`, and `/improve-animations` guidelines alongside `docs/DESIGN_SYSTEM.md`, this upgrade refines layout rhythm, introduces tactile segmented controls, eliminates sluggish animation curves, and elevates trip cards with specular highlights and GPU-accelerated micro-interactions.

## Context

The `/trips` page serves as the core booking discovery portal for travelers moving across Nigerian highway corridors (such as Enugu to Abuja, Lagos to Enugu, and Lagos to Owerri). While underlying functional contracts (search repository, seat hold tokens, integer kobo arithmetic, and time window filters) are verified and robust, the page interface requires visual and motion polish:

1. **Card Layout & Spatial Rhythm**: The cards currently mix card borders with dense vertical blocks. Following `/improve-ui`, we purge nested card outlines, enforce optical typography hierarchy, and implement clean specular top sheen gradients (`bg-gradient-to-r from-transparent via-white/20 to-transparent`).
2. **Coss Segmented Controls & Dropdowns**: The filter toolbar currently uses disparate ad-hoc buttons and native `<select>` elements. Under `/coss` patterns, filters must use unified segmented control styles with `state="pressed"` or `state="checked"` styling, accessible ARIA semantics, and consistent focus rings.
3. **Fluid Micro-Animations**: In accordance with `/improve-animations`, all interactive components must feature crisp tactile press feedback (`active:scale-[0.98]` or `active:scale-[0.97]`), decelerating entrance easings (`cubic-bezier(0.16, 1, 0.3, 1)` Expo Out), and smooth disclosure transitions for the search modifier drawer without causing layout thrash or animating forbidden geometry properties (`height`, `width`).
4. **Design System Guardrails**: Strict compliance with `docs/DESIGN_SYSTEM.md`: zero `animate-pulse` or pulsing CSS animations, zero pill or card wrappers around primary corridor headings, strict integer kobo currency formatting, and full compliance with `prefers-reduced-motion`.

## Requirements

**User stories**:
- As an intercity passenger, I want to scan daily executive Sienna departures with clear departure/arrival timestamps, travel duration, and cabin amenities so that I can choose the optimal trip quickly.
- As a traveler with flexible travel dates, I want a tactile 7-day calendar navigation strip showing real-time fare hints so that I can easily toggle travel dates without jarring page refreshes.
- As a user modifying an existing query, I want a smooth, collapsible search drawer that expands effortlessly so that I can update routes or dates without leaving the results screen.
- As an accessible web user, I want instant keyboard navigation, high contrast text (WCAG AA), minimum 44px touch targets, and full respect for reduced-motion preferences.

**Acceptance criteria**:
- **AC-1**: Modern Spatial Transit Cards: Trip result cards feature high-craft horizontal geometry with specular top sheen, translucent borders (`border-slate-200/80`), left-aligned station timelines, and distinct right-aligned fare/CTA blocks.
- **AC-2**: Coss Segmented Filter Toolbar: Time window filters (All Day, Morning 6am to 12pm, Afternoon 12pm to 5pm) and sort options use Coss segmented control layout styling with high-contrast active states.
- **AC-3**: Tactile Date Strip Navigation: 7-day date strip features chevron pagers, responsive horizontal scrolling, lowest fare indicators in bold monospace, and active date highlight in brand magenta (`bg-brand-600`).
- **AC-4**: Smooth Motion Transitions & Micro-Feedback: Primary actions and date cards feature tactile press reactions (`active:scale-[0.97]`, `hover:scale-[1.01]`), smooth drawer entrances with `cubic-bezier(0.16, 1, 0.3, 1)` Expo Out easing, and zero layout-triggering property animations.
- **AC-5**: Strict Design System Guardrails: Zero `animate-pulse` anywhere on the page (static neutral `#f1f5f9` placeholders for skeletons), unboxed corridor title resting directly on background, integer kobo arithmetic, and minimum 44px x 44px touch targets.
- **AC-6**: Full Error & Empty State Resilience: Defensive handling of unserved city pairs, empty date results, and network failures with one-click corridor shortcuts.

## Options considered

### Option 1: Incremental In-Place CSS Refinement
Refine existing Tailwind classes in `page.tsx` without restructuring the component hierarchy or introducing dedicated Coss segmented controls.
- **Pros**: Minimal code diff, fast implementation.
- **Cons**: Leaves filter buttons and dropdowns fragmented; misses full Base UI and Coss visual alignment.

### Option 2: Full Coss & Motion Architecture Upgrade (Recommended)
Refactor `apps/web/src/app/(public)/trips/page.tsx` using Coss component patterns, Emil Kowalski's motion principles, and the Ascent Design System. Modularize the 7-day strip, segmented filter bar, and horizontal trip cards.
- **Pros**: Delivers high-craft airline-grade visual polish, snappier micro-interactions, complete design system compliance, and clean modular code.
- **Cons**: Requires targeted UI updates and visual verification.

## Decision

**Chosen option**: Option 2: Full Coss & Motion Architecture Upgrade.

**Implementation skills**:
- `coss` (`cosscom/ui`, `.agents/skills/coss/`)
- `improve-ui` (`ibelick/ui-skills`, `.agents/skills/improve-ui/`)
- `improve-animations` (`emilkowalski/skills`, `.agents/skills/improve-animations/`)

## Rationale

The trips page is the highest-value conversion funnel in Ascent Transport Management. Intercity passengers traveling between Lagos, Abuja, Enugu, and Owerri need fast, reassuring, and tactile visual cues regarding vehicle type, air conditioning, luggage allowance, departure time, and fixed fares.

By applying Coss semantic tokens (`--primary`, `--muted`, `--border`) and Base UI segmented styling, the page gains visual consistency with the rest of the application. Applying Emil Kowalski's deceleration curves and active press scales eliminates sluggish UI feel, making every interaction feel instantaneous.

## Feature design

### Component Structure & Layout Flow

```
PageShell (compact width, clean backdrop)
├── Corridor Header Block
│   ├── Unboxed Title: "[Origin] → [Destination]" (text-2xl sm:text-3xl font-extrabold)
│   ├── Metadata Row: Date • Passengers • Executive Sienna • Air Conditioned
│   └── "Edit Search" Toggle Button (with tactile active:scale-[0.97])
├── Collapsible Search Drawer (animate-in fade-in slide-in-from-top-2 duration-200 with Expo Out easing)
│   └── SearchForm (compact variant)
├── Elevated 7-Day Date Carousel Strip
│   ├── Prev Day Chevron Button (min-h-[44px] min-w-[44px])
│   ├── Horizontal Scroll Container (day label, formatted date, lowest fare hint)
│   └── Next Day Chevron Button (min-h-[44px] min-w-[44px])
├── Coss Segmented Filter & Sort Toolbar
│   ├── Time Window Segmented Control (All Day | Morning 6am-12pm | Afternoon 12pm-5pm)
│   ├── Station Filter Dropdown (Lagos Terminals: Jibowu | Ajah | Festac)
│   └── Sort Selector (Earliest Departure | Lowest Fare)
├── Guaranteed Cabin Comfort Reassurance Banner
└── Trip Results List
    ├── Loading: Static Specular Placeholder Surfaces (Zero animate-pulse)
    ├── Empty / Unserved States: One-click operational corridor shortcuts
    └── Trip Result Cards (Elevated horizontal cards)
        ├── Left: Vehicle Badge ("Best Value", "Toyota Sienna", Operator Guarantee)
        ├── Center: Highway Corridor Timeline (Departure WAT → Duration/Highway Line → Arrival WAT)
        ├── Amenities: Luggage Boot • Air Conditioned • Seats Left / Urgency
        └── Right: Integer Kobo Fare Display & "Select Seats →" CTA (min-h-[44px] touch target)
```

### Motion & Interaction Rules
1. **Entrance Animations**: Collapsible search drawer and results list fade in with deceleration easing `cubic-bezier(0.16, 1, 0.3, 1)` in under 240ms.
2. **Button & Card Press**: All interactive buttons, date cards, and save-trip hearts implement `transition-transform duration-150 ease-out active:scale-[0.97]`.
3. **GPU-Only Transforms**: Only `transform` and `opacity` are animated.
4. **Reduced Motion**: All animations collapse under `@media (prefers-reduced-motion: reduce)`.

## Build plan

1. **Step 1: Architecture Spec Review & Finalization** (Spec 0025 update).
2. **Step 2: Refactor `page.tsx` Corridor Header & Search Drawer**:
   - Clean unboxed heading resting directly on page background.
   - Tactile "Edit Search" toggle with smooth Expo Out slide disclosure.
3. **Step 3: Refactor 7-Day Date Strip**:
   - Modern elevated card with specular highlight line.
   - Lowest fare indicators in crisp monospace font.
   - Tactile active date selection in brand magenta (`bg-brand-600`).
4. **Step 4: Refactor Coss Segmented Filter & Sort Toolbar**:
   - Unified segmented pill group for departure time windows.
   - Optically aligned dropdown selectors for sorting and terminal filtering.
5. **Step 5: Refactor Executive Trip Result Cards**:
   - Airline-style horizontal schedule timeline.
   - Clean amenity tags (luggage boot, A/C, remaining seats).
   - Prominent fare block formatted via `formatNaira()`.
   - Accessible "Select Seats →" CTA button.
6. **Step 6: Quality Verification & Regression Testing**:
   - Verify unit tests via `npx tsx --test packages/shared/tests/pure-functions.test.ts`.
   - Run type check and production build: `pnpm --filter web build`.
   - Validate zero `animate-pulse` and strict integer kobo compliance.
