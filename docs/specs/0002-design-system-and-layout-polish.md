# 0002. Design System and Layout Polish

**Date**: 2026-10-14  
**Status**: Accepted

## Summary

This specification establishes the design system primitive, accessible layout shells, and static marketing views for Ascent Transport Management. The implementation locks in brand tokens calibrated to magenta and slate, enforces strict WCAG AA contrast rules, and forbids pulsing loaders or pill wrapped section titles. It provides consistent navigation headers, footers, mobile drawers, and static directory templates across all viewports.

## Context

Ascent Transport Management represents a premium intercity transport brand in Nigeria, operating fixed schedule Toyota Sienna fleets across busy transit corridors. Travelers booking trips or checking parcel drop-offs often connect from mobile devices on variable network connections.

A disorganized interface creates confusion during high pressure transit bookings. The design system must solve three key requirements:
1. Brand coherence: Magenta accent (`--brand-600: #ca2484`) paired with slate neutrals creates an authoritative, modern feel without overwhelming the customer.
2. Accessibility and mobile ergonomics: Every clickable element, button, link, and drawer toggle must satisfy a minimum 44px by 44px touch target. Heading contrasts must comfortably exceed WCAG AA standards.
3. Performance and reduced motion: Pulsing skeleton animations cause cognitive fatigue and drain device battery. Loaders must remain static, while motion rules strictly honor user accessibility settings.

## Requirements

**User stories**:
- As a traveler visiting on mobile, I want large touch targets and readable layouts so that I can browse terminals and services comfortably.
- As a customer with visual sensitivity or motion preferences, I want static loading states and reduced animation so that page transitions remain calm and predictable.
- As a developer building features in later phases, I want reusable layout shells, buttons, dialogs, and navigation primitives so that new pages follow consistent patterns automatically.

**Acceptance criteria**:
- **AC-1**: All brand colors, neutrals, and semantic alerts defined in `docs/DESIGN_SYSTEM.md` resolve to CSS custom properties in `globals.css` with valid WCAG AA contrast ratios on light surfaces.
- **AC-2**: The public header (`PublicHeader`) renders the brand logo, primary service links (Book, Courier, Track, Charter, Terminals, Contact), and a mobile hamburger drawer that traps focus and toggles smoothly.
- **AC-3**: The public footer (`PublicFooter`) provides terminal addresses, customer support telephone numbers, WhatsApp contact, payment security badges, and legal links.
- **AC-4**: A reusable `PageShell` layout wrapper standardizes breadcrumbs, page headings resting directly on backgrounds, and responsive content padding.
- **AC-5**: Interactive UI primitives (`Button`, `Input`, `Select`, `Dialog`, `Sheet`, `Checkbox`, `Tabs`) enforce a minimum 44px touch target and visible focus rings.
- **AC-6**: Skeleton loaders use static neutral fills (`#f1f5f9`). Shimmer loops, blinking keyframes, and `animate-pulse` classes are strictly banned across the codebase.
- **AC-7**: Section and hero headings render as plain typography directly on section backgrounds, never enclosed in pill, badge, chip, or card containers.
- **AC-8**: All CSS transitions collapse to `0.01ms` when `prefers-reduced-motion: reduce` is active.
- **AC-9**: Static informational pages (`/about`, `/contact`, `/faq`, `/terms`, `/privacy`, `/terminals`) render cleanly using the polished layout shells.

## Options considered

### Option 1: Generic third-party component library (shadcn default theme)

Using uncustomized component defaults directly from a generic UI kit.

**Pros**:
- Fast initial drop-in.

**Cons**:
- Fails to reflect the distinct magenta and slate identity of ATM Nigeria.
- Generic skeleton loaders default to pulsing animations, violating brand guidelines.
- Requires extensive overrides to remove pill headers and enforce touch targets.

### Option 2: Tailored design system with Tailwind CSS v4 tokens and custom primitives (Chosen)

A purpose built token system in `globals.css` driving bespoke primitives and layout shells in `apps/web/src/components`.

**Pros**:
- Full ownership of brand tokens, accessibility constraints, and typography scales.
- Clean adherence to strict bans (zero pulse loops, zero pill wrapped titles).
- Mobile first navigation components tailored specifically for transport schedules and terminals.
- Lightweight bundle footprint without unused framework overhead.

**Cons**:
- Requires deliberate curation of primitive components and responsive testing across devices.

## Decision

**Chosen option**: Option 2: Tailored design system with Tailwind CSS v4 tokens and custom primitives.

The web application uses CSS custom properties defined in `apps/web/src/app/globals.css` for brand magenta (`#ca2484`), slate neutrals, semantic alert colors, and elevation scales. Layout shells (`PublicHeader`, `PublicFooter`, `PageShell`) and UI primitives (`Button`, `Dialog`, `Sheet`, `Skeleton`) implement these tokens directly while enforcing 44px touch targets and static loading states.

**Implementation skills**: `web-design-guidelines` (`vercel-labs/agent-skills`, `.agents/skills/web-design-guidelines/`) · `tailwindcss` (`mindrally/skills`, `.agents/skills/tailwindcss/`) · `vercel-composition-patterns` (`vercel-labs/agent-skills`, `.agents/skills/vercel-composition-patterns/`)

## Rationale

ATM Nigeria operates in competitive transit corridors where speed, clarity, and reliability matter. A tailored design system guarantees that pages render consistently across desktop and mobile browsers. Outlawing pulsing loaders and badge encased titles gives the product a crisp, professional aesthetic that builds customer trust.

## Feature design

### Component Hierarchy

```
apps/web/src/
├── app/
│   ├── globals.css            # Root CSS tokens, media queries, accessibility overrides
│   └── (public)/
│       ├── layout.tsx         # Wraps public routes with PublicHeader and PublicFooter
│       ├── terminals/page.tsx # City grouped terminal directory with TerminalCards
│       ├── about/page.tsx     # Company background, fleet specs, and safety record
│       ├── contact/page.tsx   # Verified dispatch phones, emails, and physical desks
│       ├── faq/page.tsx       # Booking, luggage, and cancellation answers
│       ├── terms/page.tsx     # Passenger carriage terms and conditions
│       └── privacy/page.tsx   # Data protection and customer privacy policy
└── components/
    ├── layout/
    │   ├── PublicHeader.tsx   # Sticky header with desktop links and mobile drawer
    │   ├── PublicFooter.tsx   # Multi column footer with verified contacts and links
    │   └── Templates.tsx      # PageShell container with breadcrumbs and headings
    ├── ui/
    │   ├── Button.tsx         # Primary, secondary, outline, ghost variants (44px target)
    │   ├── Skeleton.tsx       # Solid neutral placeholder block (no pulse animation)
    │   ├── Dialog.tsx         # Accessible modal dialog with focus management
    │   └── Sheet.tsx          # Slide over mobile navigation drawer
    └── atm/
        └── AtmBlocks.tsx      # TerminalCard, RouteSummaryCard, SectionBanner
```

### Key Token Contracts

- Brand Accent: `var(--brand-600)` (`#ca2484`), hover `var(--brand-700)` (`#aa1769`).
- Dark Backgrounds: `var(--neutral-900)` (`#0f172a`), deep container `var(--neutral-950)` (`#020617`).
- Card Background: `var(--background)` (`#ffffff`), border `var(--border)` (`#e2e8f0`).
- Text Primary: `var(--foreground)` (`#0f172a`), secondary `var(--neutral-500)` (`#64748b`).
- Static Skeleton: `var(--neutral-100)` (`#f1f5f9`), solid fill without animation loops.

## Build plan

- [x] Audit and refine `globals.css` tokens, font declarations, and reduced motion queries (AC-1, AC-8)
- [x] Polish `PublicHeader` desktop links, active state indicators, and mobile slide drawer (AC-2, AC-5)
- [x] Polish `PublicFooter` with terminal addresses, contact helplines, and verified links (AC-3)
- [x] Verify `PageShell` breadcrumbs, section background headings, and container padding (AC-4, AC-7)
- [x] Confirm UI primitive touch targets (min 44px) and replace any pulsing loaders with static placeholders (AC-5, AC-6)
- [x] Polish static marketing views (`/terminals`, `/about`, `/contact`, `/faq`, `/terms`, `/privacy`) using the unified shells (AC-9)

## Consequences

- All future feature pages must consume `PageShell` and `globals.css` tokens. Custom ad hoc color hex codes in markup are forbidden.
- Any attempt to introduce `animate-pulse` or wrap headings inside badges will fail code review and verification checks.
