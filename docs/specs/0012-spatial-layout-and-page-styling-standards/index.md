# 0012. Spatial Layout and Page Styling Standards

**Date**: 2026-10-15
**Status**: Accepted

## Summary

This specification establishes a component level spatial layout system and page styling standard across Ascent Transport Management. It introduces an adaptable PageShell container component featuring a three tier width scale (prose, compact, standard) and three distinct visual density modes (compact, comfortable, spacious). Applying these guidelines guarantees safe top clearance below the floating navigation header, balanced breathing room tailored to page intent, and strict adherence to web interface guidelines across all viewports.

## Decision

**Chosen option**: Option 1: Configurable component level PageShell with explicit density variants

We adopt a component level layout architecture centered on an upgraded PageShell wrapper. The component enforces floating header safe clearance, provides three container width tiers (prose, compact, standard), and supports three purpose built density modes (compact, comfortable, spacious) alongside strict web interface guidelines compliance.

**Implementation skills**: `coss` (`cosscom/ui`, `.agents/skills/coss/`) · `web-design-guidelines` (`vercel-labs/web-interface-guidelines`, `.agents/skills/web-design-guidelines/`)

## Standard definition

**Canonical pattern**:

```tsx
import React from 'react';
import { PageShell } from '@/components/layout/Templates';

export default function TripsSearchPage() {
  return (
    <PageShell
      title="Enugu to Abuja Scheduled Trips"
      description="Select your preferred departure time and Toyota Sienna executive seat."
      width="compact"       // 'prose' (max-w-3xl) | 'compact' (max-w-5xl) | 'standard' (max-w-7xl)
      density="compact"     // 'compact' | 'comfortable' | 'spacious'
    >
      <div className="space-y-6">
        <section className="scroll-mt-28 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight text-balance">
            Available Departures
          </h2>
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            {/* Trip Cards with 44px touch targets */}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
```

**Visual Density Modes**:

1. **Compact Density** (`density="compact"`):
   - Vertical padding: `pt-20 sm:pt-24 pb-8 sm:pb-12`
   - Content rhythm: `space-y-6 sm:space-y-8`
   - Card interior padding: `p-4 sm:p-5`
   - Used for: `/trips`, `/book/[tripId]`, `/book/success/[ref]`, `/manage`, `/account`

2. **Comfortable Density** (`density="comfortable"`, default):
   - Vertical padding: `pt-24 sm:pt-28 pb-12 sm:pb-16`
   - Content rhythm: `space-y-10 sm:space-y-14`
   - Card interior padding: `p-5 sm:p-6 lg:p-8`
   - Used for: `/terminals`, `/routes`, `/courier`, `/track`, `/charter`, `/corporate`, `/faq`, `/contact`

3. **Spacious Density** (`density="spacious"`):
   - Vertical padding: `pt-28 sm:pt-32 pb-16 sm:pb-24`
   - Content rhythm: `space-y-16 sm:space-y-20`
   - Card interior padding: `p-6 sm:p-8 lg:p-10`
   - Used for: `/about`, brand storytelling sections, design showcases

**Container Width Scale**:

- `prose` (`max-w-3xl`): Legal documents, privacy notice, terms of carriage, long form articles.
- `compact` (`max-w-5xl`): Search filters, seat reservation maps, checkout forms, parcel tracking tools.
- `standard` (`max-w-7xl`): Landing pages, corridor directories, terminal terminal grids, admin tables.

**Web Interface Guidelines Rules**:

1. **Scroll Margins**: Every section heading anchor must include `scroll-mt-28` so hash link navigation leaves eighty pixels of breathing room below the sticky header.
2. **Text Balance**: Titles and primary headings must include `text-balance` (or `text-pretty`) to prevent solitary orphan words on line breaks.
3. **Flex Child Protection**: Any flex child containing truncated or line clamped text must declare `min-w-0` to avoid layout container overflow.
4. **Touch Target Sizing**: All buttons, links, and form toggles must maintain forty four by forty four pixel minimum bounding boxes.
5. **Visible Focus**: Interactive elements must provide visible focus indicators using `focus-visible:ring-2 focus-visible:ring-[#ca2484]` without suppressing native outline accessibility.

**Replaces**:
- Arbitrary `py-8` at the top of pages causing header overlap.
- Viewport relative `mt-[10vh]` on hero sections.
- Ad hoc `max-w-4xl` or `max-w-6xl` containers without tier rationale.
- Headings wrapped inside badges, cards, or pills.
- Raw text containers missing overflow boundaries and min width resets.

**Enforcement**:
Enforced through the upgraded `PageShell` and `ContentPage` components in `apps/web/src/components/layout/Templates.tsx`, layout utility classes in `apps/web/src/app/globals.css`, and contrast verification in `scripts/check-contrast.ts`.

**Rollout**:
Single migration update applied across all public pages (`/trips`, `/book/[tripId]`, `/book/success/[ref]`, `/track`, `/manage`, `/courier`, `/charter`, `/corporate`, `/terminals`, `/routes`, and `PlaceholderPage`).

**Exceptions**:
Full bleed canvas tools and interactive three dimensional vehicle model inspectors may use custom full viewport frames, provided their top toolbars reserve ninety six pixels of clearance.

## Consequences

**Positive**:
- Eliminates header overlap completely across all screen sizes.
- Gives transactional and content pages tailored spacing density without ad hoc CSS hacks.
- Ensures consistent adherence to web interface guidelines for typography, scrolling, and touch target bounds.
- Preserves full WCAG AA accessibility compliance across all viewports.

**Negative / tradeoffs**:
- Requires updating existing page wrappers and container class test assertions.

**Neutral**:
- Developers must specify width and density props on `PageShell` when authoring new pages.

## Follow-up

- [x] Update `apps/web/src/components/layout/Templates.tsx` with `density` and `width` prop implementations.
- [x] Migrate `apps/web/src/app/(public)/trips/page.tsx` to `PageShell` with compact density.
- [x] Migrate `apps/web/src/app/(public)/book/[tripId]/page.tsx` to `PageShell` with compact density.
- [x] Migrate `apps/web/src/app/(public)/book/success/[ref]/page.tsx` to `PageShell` with compact density.
- [x] Migrate `apps/web/src/components/ui/PlaceholderPage.tsx` to use comfortable safe clearance.
- [x] Refine `apps/web/src/app/(public)/page.tsx` hero top spacing from `mt-[10vh]` to fixed header safe clearance.
