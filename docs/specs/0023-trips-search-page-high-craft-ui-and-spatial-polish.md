# 0023. Trips Search Page High-Craft UI and Spatial Polish

**Date**: 2026-10-17
**Status**: Proposed

## Summary

This specification establishes a complete high-craft user interface enhancement for the primary passenger trip search results page (`/trips`). Adhering to the `/improve-ui` design directives and Ascent Transport Management spatial guidelines, this upgrade eliminates flat generic layouts and introduces modern spatial cards with specular highlights, an elevated 7-day calendar navigation strip with chevron date pagers and quick-jump shortcuts, interactive departure time window filter pills (Morning departures 6:00 AM to 11:59 AM, Afternoon departures 12:00 PM to 5:00 PM), instant seat availability toggles, optical typography hierarchies, and tactile booking action controls.

## Context

The `/trips` page is the critical discovery and decision gateway for travelers booking intercity Toyota Sienna seats across Nigerian highway corridors (such as Enugu to Abuja, Lagos to Benin/Enugu, and Abuja to Owerri). In Spec 0003 and Spec 0004, the initial trip query engine and basic result listing were built. While functionally complete, the visual presentation suffered from several common design traps:

1. Generic boxed card appearances lacking depth, tactile hover responses, or optical hierarchy.
2. The 7-day date strip used raw unstyled buttons without sticky week alignment, active brand glow, or direct jumps to the earliest departure date.
3. Filtering and sorting lacked quick departure time window segment filters (morning vs afternoon departures), forcing users to mentally scan every departure timestamp.
4. Terminal departure and arrival points lacked clear visual highway corridor connectors.
5. In line with project rules, zero `animate-pulse` or pulsing CSS animations are permitted; all loading states must use elegant static placeholder cards with crisp specular highlights.

By redesigning `/trips` with modern spatial depth, calibrated typography, tactile interaction states, and client-side instant filtering, ATM travelers enjoy a seamless and premium booking experience.

## Requirements

**User stories**:
- As an intercity traveler, I want to scan available daily departures on clean, modern cards featuring visual origin-to-destination corridor lines so that I can immediately understand boarding points and arrival destinations.
- As a traveler with flexible travel plans, I want an elevated 7-day date strip with chevron navigation and immediate day indicators so that I can easily toggle dates without page reloads.
- As a morning traveler, I want interactive time window filter pills (Morning vs Afternoon) so that I can quickly filter departures matching my personal schedule.
- As a traveler on mobile or desktop, I want clear seat availability status badges (e.g. "Only 2 seats left") and transparent kobo pricing so that I can select seats with confidence.

**Acceptance criteria**:
- **AC-1**: Modern Spatial Trip Cards: Each trip result is presented in an elevated card featuring a subtle top border specular highlight (`via-white/20`), translucent borders (`border-slate-200/80`), tactile hover lift, and clear optical hierarchy.
- **AC-2**: Visual Corridor Progression Line: Each card features a stylized origin-to-destination transit connector displaying boarding terminal, departure time in WAT, destination terminal, estimated travel duration, and vehicle cabin highlights (Toyota Sienna 5-seat air-conditioned cabin).
- **AC-3**: Elevated Calendar Date Strip: The 7-day date selector bar features day name, large numeric date, active brand accent highlight, smooth chevron date paging, and a "Jump to Earliest" departure shortcut button.
- **AC-4**: Departure Time Window Filters: Interactive filter pills allow instant client-side filtering by departure window: All Departures, Morning (06:00 to 11:59 WAT), and Afternoon (12:00 to 17:00 WAT).
- **AC-5**: Seat Availability & Urgency Indicator: Clear high-contrast status tags display "Available (X seats left)", "Only 1 or 2 seats left!" (amber contrast tag), or "Sold Out / Departed" (muted accessible badge).
- **AC-6**: Pricing and Action Column: Clean integer kobo pricing display with clear "per seat" and calculated total fare for multi-passenger bookings, paired with a prominent primary "Select Seats" action button meeting the minimum 44px touch target requirement.
- **AC-7**: Unserved Corridor & Empty States: High-craft empty state cards offering one-click shortcuts to active operational corridors (Enugu ↔ Abuja, Enugu ↔ Lagos, Lagos ↔ Owerri).
- **AC-8**: Design Integrity & Token Rules: Zero `animate-pulse` or pulsing CSS animations anywhere on the page (static shimmer-free skeleton blocks only), strict adherence to integer kobo money values, text-balance applied to headers, and all dates formatted in Africa/Lagos (WAT, UTC+1).

## Architectural design

### Component and UI layout structure

```
+--------------------------------------------------------------------------+
| PageShell (compact density, clean background)                            |
|                                                                          |
| [Header]: "Trip Results" + Origin to Destination Title + SearchForm      |
|                                                                          |
| [7-Day Calendar Strip]:                                                  |
| [< Prev] [Mon 17] [Tue 18 (Active)] [Wed 19] [Thu 20] [Fri 21] [Next >]   |
|                                                                          |
| [Interactive Filter Bar]:                                                |
| Time: [All] [Morning (6am-12pm)] [Afternoon (12pm-5pm)]                  |
| Sort: [Earliest Departure] [Lowest Fare]                                 |
| Station: [All Lagos Terminals | Jibowu | Ajah | Festac]                  |
|                                                                          |
| [Spatial Trip Result Cards]:                                             |
| +----------------------------------------------------------------------+ |
| | [Specular Top Highlight Line]                                        | |
| | 06:30 AM WAT   [Only 2 seats left!]   Toyota Sienna (5 seats, A/C)   | |
| |                                                                      | |
| | (Origin Pin)  Enugu (Ogui Road) ---> (Dest Pin) Abuja (Utako)        | |
| | 263 Ogui Road, Opp Fire Service      Atlantic Mall, Obafemi Awolowo  | |
| |                                                                      | |
| | [Fare]: ₦32,000 per seat               [Select Seats Button ->]      | |
| +----------------------------------------------------------------------+ |
|                                                                          |
| [Fixed Departure Guarantee Banner]                                       |
+--------------------------------------------------------------------------+
```

### Time window filtering logic

```typescript
export type TimeWindowFilter = 'all' | 'morning' | 'afternoon';

function matchesTimeWindow(utcIso: string, filter: TimeWindowFilter): boolean {
  if (filter === 'all') return true;
  const d = new Date(utcIso);
  // Get hour in WAT (UTC+1)
  const hourWat = (d.getUTCHours() + 1) % 24;
  if (filter === 'morning') {
    return hourWat >= 6 && hourWat < 12;
  }
  if (filter === 'afternoon') {
    return hourWat >= 12 && hourWat < 18;
  }
  return true;
}
```

### Value sourcing

| Element | Value produced / displayed | Source |
|---|---|---|
| Corridor Title | `fromParam` to `toParam` | URL search params validated against `searchParamsSchema` |
| Trip Departure Time | WAT time string | `TimeText` / `new Intl.DateTimeFormat` with `timeZone: 'Africa/Lagos'` |
| Seat Inventory | Remaining seats (1-5) | `trip.seatsLeft` from `tripRepository.searchTrips` |
| Fare per Seat | Formatted Naira | `formatNaira(trip.fareKobo)` |
| Terminal Addresses | Boarding and drop-off terminal information | `trip.originTerminal` and `trip.destinationTerminal` from `SEED_TERMINALS` |

### Key invariants

- Zero `animate-pulse` animations; static placeholders for loading skeletons.
- All fares stored and handled strictly as integer kobo.
- All timestamps presented to travelers format in Africa/Lagos WAT (UTC+1).
- Buttons and touch targets strictly meet `min-h-[44px]` for mobile accessibility.
- URL search parameters remain synchronized with date, sorting, and station filter selections.

## Build plan

- [ ] 1. Implement time window filtering helper `matchesTimeWindow` and state handler in `apps/web/src/app/(public)/trips/page.tsx` (AC-4).
- [ ] 2. Build the elevated 7-day calendar navigation strip with day label, numeric date, active brand highlight, smooth chevron paging, and "Jump to Today / Earliest" button (AC-3).
- [ ] 3. Build interactive filter bar with Time Window pills (All, Morning, Afternoon), Sort buttons (Earliest, Lowest Fare), and Station dropdown (AC-4, AC-6).
- [ ] 4. Redesign trip result cards with modern spatial surfaces, specular top highlight, transit corridor connector, seat availability badge, and clear pricing column (AC-1, AC-2, AC-5, AC-6).
- [ ] 5. Upgrade unserved corridor fallback banner and empty state cards with one-click route exploration shortcuts (AC-7).
- [ ] 6. Ensure strict compliance with design rules (no animate-pulse, text-balance on headings, min-44px touch targets) (AC-8).
- [ ] 7. Run automated test suites and verify production build compilation (AC-8).

## Consequences

**Positive**:
- Dramatically elevates the visual craft and usability of the trip booking search experience.
- Instant departure window filters reduce cognitive load for passengers seeking early morning or midday departures.
- Visual corridor connectors make pickup and drop-off terminal locations instantly understandable.
- Full compliance with `@atm/shared` tokens and zero pulsing animation rules.

**Negative / tradeoffs**:
- Slightly more DOM nodes per card to support visual connector lines and specular highlights.

**Neutral**:
- Reuses existing `tripRepository.searchTrips` and shared validation schemas without database modifications.
