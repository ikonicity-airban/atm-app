# 0012. Spatial Layout and Page Styling Standards · Rationale

## Context

Ascent Transport Management serves customers across diverse interaction journeys: searching time critical trips, reviewing seat maps, completing card payments, tracking express parcels, and reading corporate terms. The interface uses a floating navigation pill fixed at the top of the browser window. In earlier development phases, individual pages declared arbitrary margins and padding classes. Several transactional views used eight units of vertical padding (thirty two pixels), causing primary headings and search bars to collide with or hide beneath the floating navigation bar. Other pages used viewport relative margins like ten percent of window height, leading to erratic jumps on short or ultrawide screens.

This lack of spatial discipline created several user interface flaws:
1. Content tucked beneath the sticky header on initial page load across multiple mobile and laptop devices.
2. High density pages like trip results felt either suffocated or excessively spread out with no principled spacing scale.
3. Heading anchors lacked top scroll margins, causing page section links to jump directly behind the navigation header.
4. Flex row items containing truncated passenger names or route descriptions lacked minimum width resets, resulting in occasional overflow clipping.
5. Interactive action links occasionally missed the forty four pixel minimum touch target requirement.

A structured component level layout standard resolves these issues by pairing reliable safe area clearance with intentional visual density options.

## Options considered

### Option 1: Configurable component level PageShell with explicit density variants

Provide a shared PageShell wrapper that encapsulates header safe area clearance, responsive container widths, and configurable visual density modes (compact, comfortable, spacious).

**Pros**:
- Transactional workflows like trip search and checkout can use compact density without unnecessary scrolling.
- Showcase and editorial views can use comfortable or spacious density for visual elegance.
- Header safe clearance, heading scroll margins, and touch target bounds are enforced automatically in one shared component.

**Cons**:
- Requires page authors to choose the appropriate density variant when creating new routes.

### Option 2: Rigid uniform density across all application pages

Enforce a single fixed padding and margin scale on every page regardless of whether the page is a dense booking checkout or a spacious about page.

**Pros**:
- Only one padding configuration to maintain.

**Cons**:
- Fails to balance the contrasting needs of information dense search tables and open marketing showcases.
- Forces either checkout flows to feel needlessly empty or marketing pages to feel cramped.

## Rationale

Different pages on the Ascent platform serve distinct psychological states. When a traveler searches for a morning departure from Enugu to Abuja, they want immediate visibility of fares, times, and remaining seats without scrolling through multiple viewport heights of dead space. In contrast, when an executive reviews corporate fleet standards on the about page, spacious breathing room conveys safety, prestige, and institutional trust.

The floating navigation bar occupies between sixty four and eighty pixels of vertical height depending on scroll state and screen width. Providing twenty units of top padding on compact views (eighty pixels) and twenty four to twenty eight units on comfortable views (ninety six to one hundred and twelve pixels) guarantees that page content always starts in clear view below the navigation pill.

## References

**Project sources**:
- `AGENTS.md`: Titles rest directly on section backgrounds, no pulsing animations, prefers reduced motion respected.
- `apps/web/AGENTS.md`: Component knowledge, Base UI APIs, and Tailwind v4 conventions.
- `docs/specs/0002-design-system-and-layout-polish.md`: Initial visual design foundations.
- `docs/specs/0011-scope-aligned-navigation-and-information-architecture.md`: Floating header navigation layout.

**Practices & standards**:
- Vercel Web Interface Guidelines: Safe area clearance, heading scroll margins, text wrap balance, minimum hit targets.
- Eight pixel spatial design grid rhythm.
- WCAG 2.1 AA touch target sizing (minimum forty four pixels).
