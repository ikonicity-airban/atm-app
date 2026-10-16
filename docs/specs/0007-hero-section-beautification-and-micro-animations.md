# 0007. Hero section beautification and interactive search animations

**Date**: 2026-10-14
**Status**: Accepted

## Summary

This specification defines the visual elevation and micro interaction architecture for the Ascent Transport Management hero section. Inspired by modern logistics interfaces, the enhanced hero incorporates a framed dusk highway atmosphere that reacts with three dimensional perspective skew on scroll, an inverted chamfered bottom edge, and an inset executive fleet stat card on the bottom right. In addition, interactive city landmarks appear in animated hover cards over the destination links, while the SegmentedSearchForm selector cards scale dynamically in height with animated presence when browsing cities.

## Context

The initial segmented hero established a strong layout foundation with two column typography, discrete input cards, and an asphalt vehicle anchor. However, to match the visual sophistication and polish of leading international travel services, the hero section requires a richer cinematic canvas, tactile interactive feedback, and responsive motion hierarchy.

The reference design showcases a transport landscape framed by soft outer padding, an inset vehicle photograph against an intercity highway, and a bottom edge with a concave chamfered contour. On the lower right, a floating stat card highlights volume and reliability with a vehicle thumbnail. Furthermore, the user experience benefits immensely from contextual previews when hovering over the Nigerian corridors mentioned in the copy (Enugu, Abuja, Lagos, and Owerri), enabling users to click any city directly to configure their search.

Finally, standard native select dropdowns in the SegmentedSearchForm feel static and break visual immersion. Replacing them with custom motion cards that scale in height when opened, display rich terminal metadata, and smoothly return to their compact resting state provides a tactile feel.

All existing business rules remain strictly intact:
- All operations apply to Ascent Transport Management (ATM Nigeria) executive Toyota Sienna five passenger fleet.
- All fares remain stored as integer kobo and formatted only at the edge.
- Nigerian dates and departure times remain computed in Africa/Lagos WAT (UTC+1).
- Headings rest directly on section backgrounds without pill wrappers.
- No pulsing animations are permitted under any condition.
- Minimum touch targets of forty four pixels are enforced for all interactive controls.

## Requirements

**User stories**:
- As a traveler, I want a cinematic highway atmosphere that responds to my scrolling so that the hero section feels immersive, alive, and modern.
- As a traveler, I want to hover over highlighted Nigerian cities in the hero text to preview scenic landmarks and Ascent terminals so that I understand where the fleet travels.
- As a traveler, I want to click any city in the hero copy or hover preview so that my search origin or destination updates instantly without manual typing.
- As a traveler, I want smooth animated dropdown cards in the search form that scale in height when tapped so that selecting a departure or destination city feels responsive and tactile.
- As a traveler, I want to view verified fleet metrics in a floating card on the bottom right so that I feel confident in Ascent Transport Management reliability.

**Acceptance criteria**:
- **AC-1**: The hero container renders within an outer ambient wrapper with generous padding and curved corners, featuring a cinematic intercity highway background image that skews in subtle 3D perspective during scroll.
- **AC-2**: The bottom contour of the hero section features a scooped, chamfered silhouette divider matching the reference design aesthetic.
- **AC-3**: A floating stat card rests on the bottom right of the hero canvas, displaying executive fleet volume (15,000+ Safe Intercity Trips), punctuality metrics, and a photographic thumbnail of the Toyota Sienna fleet.
- **AC-4**: A social proof avatar group rests on the bottom left of the hero canvas, reinforcing customer trust alongside the Trustpilot indicator.
- **AC-5**: Each underlined city in the hero value proposition paragraph (Enugu, Abuja, Lagos, Owerri) displays an animated tooltip card on hover or focus using AnimatePresence, showing a high resolution landmark photograph, terminal address, and quick select button.
- **AC-6**: Clicking an underlined city or its preview card immediately synchronizes with the SegmentedSearchForm state, updating the active corridor and selecting valid destinations.
- **AC-7**: In the SegmentedSearchForm, city selection cards animate into expanded dropdown trays with AnimatePresence, scaling smoothly in height while displaying terminal names and active indicators.
- **AC-8**: Upon selecting an item or clicking outside, the dropdown card smoothly animates back to its resting height and position without layout thrashing.
- **AC-9**: All interactive elements satisfy accessibility guidelines with complete keyboard navigation, aria-expanded states, focus rings, and zero pulsing animations.
- **AC-10**: System respects prefers-reduced-motion, disabling perspective skewing and heavy motion transitions when reduced motion is requested.

## Options considered

### Option 1: Framed cinematic hero canvas with CSS 3D perspective scroll and custom motion dropdowns (Chosen)

In this approach, the hero container is framed with subtle outer margins and a chamfered bottom SVG mask. Background scroll responsiveness is achieved via motion transform hooks (scrollYProgress driving rotateX and scale), while city tooltips and dropdown trays leverage Motion AnimatePresence and layout sizing.

**Pros**:
- Delivers the exact cinematic composition, floating stat card, and chamfered silhouette from the reference image.
- Native React 19 and Motion integration avoids heavyweight external animation dependencies.
- Interactive hover tooltips create a direct functional bridge between marketing copy and the booking widget.
- Clean component encapsulation ensures SegmentedSearchForm remains reusable across both preview harness and Next.js App Router pages.

**Cons**:
- Requires careful handling of z-index stacking context so expanded dropdowns and hover tooltips never clip beneath vehicle silhouettes or adjacent cards.

### Option 2: Full screen raw image without framing or interactive tooltips

In this approach, a plain background image is placed behind the hero with standard native HTML select elements.

**Pros**:
- Simpler markup with standard browser controls.

**Cons**:
- Misses the distinctive framed elegance, chamfered contour, and interactive hover discovery requested by the user.
- Native select elements cannot animate height or scale smoothly.

## Decision

**Chosen option**: Option 1: Framed cinematic hero canvas with CSS 3D perspective scroll and custom motion dropdowns.

The hero section will be built using a framed showcase container with a chamfered bottom edge, 3D perspective scroll reaction, an inset floating stats card on the bottom right, rich photographic hover tooltips for Nigerian corridors, and expandable height motion dropdowns in the SegmentedSearchForm.

**Implementation skills**: `coss` (`cosscom/ui`, `.agents/skills/coss/`), `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`), `tailwindcss` (`mindrally/skills`, `.agents/skills/tailwindcss/`).

## Rationale

This approach elevates Ascent Transport Management to international visual parity with executive logistics and aviation platforms while maintaining strict fidelity to Nigerian geography, Toyota Sienna fleet specifications, and integer kobo pricing rules. By tying the underlined city text directly into search state, the interface becomes intuitive and enjoyable to use.

## Feature design

**Component hierarchy**:
1. `HeroFrame`: Framed container with rounded border, ambient outer background, and chamfered bottom edge mask.
2. `HeroPerspectiveBackground`: High resolution Nigerian highway image with scroll driven rotateX and scale transformation.
3. `HeroFloatingStatsCard`: Bottom right glassmorphic card showcasing fleet thumbnail, safe trip count, and on time departure percentage.
4. `CityHoverTooltip`: Floating preview component rendered conditionally via AnimatePresence with image, terminal address, and click to search trigger.
5. `SegmentedDropdownCard`: Custom accessible dropdown with Motion layout height animation, item list stagger, and automatic close on selection.

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Perspective tilt | rotateX degrees (0 to 6deg) | Derived from window scrollYProgress |
| Fleet stats | 15,000+ Safe Intercity Trips | Static domain metrics from @atm/shared |
| City previews | City landmark photos and terminal subtitles | CITY_METADATA dictionary in hero component |
| Search synchronization | Updated fromCity or toCity | Callback from CityHoverTooltip into SegmentedSearchForm |
| Dropdown height scale | Dynamic height (compact 68px to expanded 220px) | Motion layout animation on active card |

**Key invariants**:
- The hero section content and search form must remain fully visible and usable on mobile devices, with perspective skew gracefully neutralized.
- Minimum touch target of forty four pixels is strictly preserved across all interactive cards, dropdown options, and city triggers.
- Underlined city triggers must support keyboard focus and Enter key selection.

**Critical test scenarios**:
- Happy path: User hovers over Enugu in hero copy, sees preview tooltip, clicks it, and observes origin city update in SegmentedSearchForm; user clicks destination card, watches it scale in height, selects Abuja, and watches it smoothly close to resting height. Verifies **AC-5**, **AC-6**, **AC-7**, **AC-8**.
- Scroll perspective: User scrolls down the page; background highway image tilts gently in 3D perspective without jitter or horizontal overflow. Verifies **AC-1**, **AC-10**.
- Stat card visibility: Bottom right floating stat card renders fleet thumbnail and verified trip metrics without obscuring search button or highway anchor. Verifies **AC-3**.
- Chamfered edge: Bottom of hero displays clean chamfered cut-out divider over the subsequent routes section. Verifies **AC-2**.

## Build plan

1. Create hero city landmark metadata, image assets, and interactive hover tooltip component with AnimatePresence, satisfies **AC-5**, **AC-6**.
2. Enhance `SegmentedSearchForm` with custom animated expandable dropdown cards that scale in height and return to compact resting height upon selection, satisfies **AC-7**, **AC-8**, **AC-9**.
3. Implement `HeroPerspectiveBackground`, chamfered bottom cut-out shape, and floating bottom right fleet stat card in `apps/web/src/app/(public)/page.tsx`, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-10**.
4. Verify accessibility, responsive mobile breakpoints, prefers reduced motion, and end to end tests, satisfies **AC-9**, **AC-10**.

## Consequences

**Positive**:
- Premium first impression directly matching the high end reference design.
- Direct linkage between hero copy and booking form accelerates search completion.
- Custom dropdown cards offer superior aesthetics and clear terminal details compared to plain browser select elements.

**Negative / tradeoffs**:
- Slightly more DOM nodes for custom dropdowns and hover cards, mitigated by lightweight Motion hooks and component memoization.

**Neutral**:
- Image assets are stored locally in public folders for instant offline dev preview without third party CDN dependencies.

## References

**Project sources**:
- `apps/web/src/app/(public)/page.tsx`
- `apps/web/src/components/booking/SegmentedSearchForm.tsx`
- `apps/web/src/components/atm/VehicleHighwayAnchor.tsx`
- Spec `0004-segmented-hero-and-main-page-redesign.md`
