# 0025. Trips Search Results Page High Craft UI & Coss Architecture

**Date**: 2026-10-17  
**Status**: Proposed

## Summary

This specification redesigns the Ascent Transport Management (ATM Nigeria) trips search results page (`apps/web/src/app/(public)/trips/page.tsx`) to match modern high craft airline and executive transit search experiences (referenced from Skyloop travel UI reference). It harmonizes layout rhythm, visual hierarchy, elevated segmented filters, tactile date pickers, and trip cards with `@atm/shared` domain logic and the official Ascent Design System (`docs/DESIGN_SYSTEM.md`), Coss UI tokens, and Base UI component standards.

## Context

The current `/trips` search page possesses solid underlying logic (time window filtering, date navigation, integer kobo pricing, and seat calculations). However, the visual aesthetics and structural composition have several issues:
1. **Header Spacing & Search Modification**: The current compact search form is heavy, clunky, and visually dominates the page instead of resting smoothly under the corridor header.
2. **Date Carousel Navigation**: The current 7-day strip uses basic button boxes with mixed padding and lacking the refined card elevation, active date pill contrast, and price indicators seen in reference travel booking products.
3. **Filter Toolbar**: Time of day buttons, sorting controls, and terminal selectors are scattered and lack optical alignment, coherent segmented grouping, and clear pill states.
4. **Trip Result Cards**: The existing cards present dense text blocks without clear airline-style corridor typography, flight/transit icons, distinct departure/arrival terminal blocks, baggage/amenity chips, and a high-contrast fare CTA container.

By modeling the layout hierarchy on the reference travel experience (clean corridor title with edit search trigger, elevated 7-day calendar navigation strip with lowest fare hints, cohesive filter bar with segmented dropdown pills, and balanced horizontal transit cards), ATM delivers a world-class booking experience tailored to Nigerian intercity travelers.

## Design Decisions & Visual Architecture

### 1. Header & Corridor Summary
- Clean, un-boxed corridor title: `[Origin City] → [Destination City]` in `text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900`.
- Micro metadata row below: formatted date range/departure date, passenger count, executive Sienna fleet assurance.
- Discrete **"Edit Search"** button on the right that smoothly expands/collapses the search modifier drawer/panel without cluttering the initial viewport.

### 2. Elevated 7-Day Date Navigation Strip
- Clean horizontal calendar card with specular top highlight and subtle border (`border-slate-200/80 bg-white`).
- Previous/Next day tactile chevron controls (`min-h-[44px] min-w-[44px]`).
- Individual day items structured with:
  - Day of week label (e.g. `Tue 14 Oct` or `Today`).
  - Fare hint (e.g. `₦32,000`).
  - Active state: Brand magenta accent (`bg-brand-600 text-white font-bold shadow-md shadow-brand-600/20`) with rounded-xl border radius.
  - Inactive state: Subtle hover background (`hover:bg-slate-50 text-slate-700`).

### 3. Integrated Filter & Sort Toolbar
- Cohesive toolbar with Coss-inspired segmented controls:
  - **Departure Time Window**: `All Day` | `Morning (6am - 12pm)` | `Afternoon (12pm - 5pm)`.
  - **Sorting**: `Earliest Departure` | `Lowest Fare`.
  - **Terminal / Station Filter**: Lagos boarding terminal dropdown (Jibowu, Ajah, Festac) when corridor touches Lagos.
- Greener choice / AC Comfort Banner: Subtle reassurance card highlighting executive climate-controlled 5-passenger comfort.

### 4. High-Craft Executive Trip Result Cards
- Horizontal card structure mirroring the reference transit cards:
  - **Left / Transit Identity**: Vehicle brand badge (e.g. `Best Value` or `Fastest Transit` pill), Toyota Sienna icon/badge, operator title.
  - **Center / Corridor Timeline**:
    - Departure time in bold mono/sans (`08:20`) + origin station code/city.
    - Duration & corridor line with travel distance (e.g. `6h 30m Direct • 460 km`).
    - Arrival time (`14:50`) + destination station code/city.
    - Amenity chips below: `1x Luggage Boot (15kg)`, `Air Conditioned`, `Extra Legroom`, `Verified Driver`.
  - **Right / Fare & Selection**:
    - "Total fare (incl. all fees)" microcopy.
    - Large integer kobo fare formatted with `formatNaira()` in `font-black font-mono text-2xl text-slate-900`.
    - High-contrast CTA button: **"Select Seats →"** in brand magenta (`bg-brand-600 hover:bg-brand-700 text-white min-h-[44px] px-6 rounded-xl font-bold`).
    - Heart / save trip icon or quick trip details toggle.

### 5. Strict Design System Invariants
- Zero `animate-pulse` or pulsing CSS animations (use solid neutral `#f1f5f9` skeletons).
- No pill or card wrappers on primary section titles.
- Strict integer kobo currency calculations everywhere.
- Minimum 44px x 44px touch targets.
- Timestamps strictly in Africa/Lagos WAT (UTC+1).

## Build Plan

1. **Architecture Spec Authoring**: Complete Spec 0025.
2. **Refactor & Upgrade `apps/web/src/app/(public)/trips/page.tsx`**:
   - Re-architect search header with collapsible "Edit Search" drawer.
   - Refactor 7-day date strip to display day, date, and lowest fare preview.
   - Upgrade filter bar with refined pill buttons and clean dropdown menus.
   - Rebuild trip cards with the horizontal transit schedule timeline, baggage/amenity icons, and dedicated price selection block.
3. **Verification & Quality Gate**:
   - Run tests: `node --import tsx --test packages/shared/tests/*.test.ts`.
   - Run production build: `pnpm --filter web build`.
   - Review visual appearance and mobile responsiveness.
