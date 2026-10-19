# 0028. Unified UI token and Coss component system

**Date**: 2026-10-19
**Status**: In Progress

## Summary

This specification establishes a unified UI token and component system across Ascent Transport Management by standardizing on Base UI primitives styled with Coss UI conventions and Tailwind CSS v4. It replaces disconnected custom elements across the application with reusable, accessible, and tokenized components including button, input, select, card, dialog, badge, tabs, popover, table, date field, separator, and form controls. These shared building blocks provide reliable accessibility, consistent 44px touch targets, tokenized glassmorphism surfaces, and strict enforcement of the project design invariants.

Following the initial construction of core primitives, this specification defines the systematic rollout across all application surfaces, including navigation headers, footers, admin sidebars, layout templates, shared domain blocks, public booking funnels, customer authentication, and administrative back office consoles, ensuring complete light and dark theme responsiveness and readable contrast across every screen.

## Context

Ascent Transport Management runs on Next.js 15, React 19, and Tailwind CSS v4. While specification 0005 introduced Coss UI semantic color variables inside globals.css, the actual interactive components and page views across the screens have evolved with mixed implementations.

A codebase scan reveals over 790 occurrences of hardcoded color classes, specifically text slate 900, background white, and border slate 200. These hardcoded values create visual token drift and severe readability problems during theme switching:
1. In dark mode, hardcoded text slate 900 renders near black text against dark obsidian backgrounds, making text illegible.
2. In dark mode, hardcoded background white and border slate 200 create harsh glare instead of soothing dark card surfaces.
3. Core layout shells including PublicHeader, PublicFooter, AdminSidebar, PageShell in Templates.tsx, and shared blocks in AtmBlocks.tsx rely on hardcoded slate colors rather than semantic CSS variables.
4. Various public and administrative screens still rely on unstyled native HTML elements rather than shared accessible primitives.
5. In globals.css, glassmorphism utility classes referenced unexported CSS variable names rather than runtime root variables, and ThemeProvider experienced hydration desynchronization with system dark preferences.

Establishing a canonical component library powered by Base UI with Coss UI styling gives the team copy paste ownership of accessible primitives. Standardizing these tokens across every application screen guarantees that light and dark themes switch cleanly via CSS variables, typography remains crisp, touch targets satisfy accessibility requirements, and glassmorphism spatial depth remains consistent.

## Requirements

**User stories**:
- As a frontend engineer, I want consistent, copyable component primitives so that I can assemble new pages quickly without reinventing accessible dropdowns, modals, and form controls.
- As a passenger or corporate customer, I want reliable, accessible, and touch friendly controls so that booking trips, tracking waybills, and managing tickets feels polished on both mobile and desktop in either light or dark mode.
- As a designer, I want centralized design tokens and variant controls so that theme switches, radius scales, and glassmorphism styling propagate smoothly throughout the whole application.

**Acceptance criteria**:
- **AC-1**: Standardize core Coss UI component primitives in `apps/web/src/components/ui/` built on `@base-ui/react` and styled with Tailwind CSS v4 tokens, using canonical component files (`Button.tsx`, `Input.tsx`, `Select.tsx`, `Card.tsx`, `Dialog.tsx`, `Badge.tsx`, `Tabs.tsx`, `Popover.tsx`, `DateField.tsx`, `Table.tsx`, `Separator.tsx`, `Textarea.tsx`, `Checkbox.tsx`, `RadioGroup.tsx`).
- **AC-2**: Each component exposes class variance authority variants that consume semantic tokens (`primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`) and responsive size scales (`sm`, `default`, `lg`), supporting backward compatibility aliases (`variant="primary"` maps to `default`, `size="md"` maps to `default`, and preserving `isLoading`).
- **AC-3**: Interactive controls enforce a minimum touch target size of 44px by default, with smaller visual sizes (`size="sm"`) satisfying the 44px touch target invariant via pseudo element touch expansion (`relative after:absolute after:-inset-1 after:min-h-[44px]`). AdminSidebar navigation controls enforce min height 44px.
- **AC-4**: Standardized `@utility glass-surface` and `@utility glass-card-spatial` declarations in `globals.css` reference valid runtime CSS variables (`var(--card)`, `var(--border)`, and fallback black) to provide consistent translucent backdrop blur depth across both light and dark themes without CSS collapse.
- **AC-5**: Hard project architectural bans remain strictly preserved: zero pulsing keyframes or pulsing animations anywhere, zero pill or badge wrappers enclosing section titles, and complete motion cancellation under `prefers-reduced-motion: reduce`.
- **AC-6**: Existing ad hoc buttons, selects, and cards in the main public page, hero showcase, and public navigation are refactored to consume the standardized primitives without visual regression.
- **AC-7**: All components support light and dark theme toggling cleanly via CSS variables without layout shifts or text illegibility, and include `'use client'` on all interactive Base UI wrappers. ThemeProvider synchronizes initial state with the inline head script to eliminate dark mode flash.
- **AC-8**: Core application shells (`PublicHeader.tsx`, `PublicFooter.tsx`, `AdminSidebar.tsx`, `Templates.tsx`, `PageShell`, `ContentPage`) and shared domain blocks (`AtmBlocks.tsx` including `TerminalCard`, `VehicleCard`, `StatusBadge`, `SectionBanner`, `PhoneInput`, `Stepper`) are sanitized to eliminate hardcoded slate and white classes, replacing them with semantic tokens (`bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `bg-muted`, `text-muted-foreground`, `border-border`). `StatusBadge` wraps `Badge` using a status to variant adapter mapping.
- **AC-9**: Public booking and service funnels (`/trips`, `/book/*`, `SeatMap.tsx`, `/courier`, `/track/*`, `/manage`, `/terminals`, `/charter`) are refactored to consume the standardized UI primitives (`Button`, `Input`, `Select`, `Card`, `Badge`, `Tabs`, `Dialog`, `Popover`, `DateField`), achieving full theme responsiveness and uniform visual quality.
- **AC-10**: Customer account and authentication views (`/login`, `/register`, `/account`) and administrative back office portals (`/admin/*`, `/driver/*`) are upgraded with semantic tokens and Base UI primitives, ensuring high contrast data tables and legible text across light and dark themes.
- **AC-11**: Automated contrast verification script `scripts/check-contrast.ts` is updated to test both light background pairs and dark obsidian background pairs (`#07030f` and `#120a22`), guaranteeing WCAG AA compliance across both theme states.

## Options considered

### Option 1: Base UI primitives with Coss UI styling and Class Variance Authority (Chosen)

In this approach, components live directly in `apps/web/src/components/ui/`, powered by `@base-ui/react` headless logic and styled using Tailwind CSS v4 semantic tokens and class variance authority. We own the code completely, aligning with the installed `coss` and `coss-particles` skills.

**Pros**:
- Full ownership with no black box npm component bloat.
- Native React 19 and Tailwind CSS v4 support with zero CSS bundle overhead.
- Excellent keyboard navigation, focus management, and ARIA attributes provided out of the box by Base UI.
- Direct alignment with Coss UI documentation and particle patterns.

**Cons**:
- Requires installing `@base-ui/react` and `class-variance-authority` in `apps/web`.
- Initial refactoring effort across existing screens.

### Option 2: Radix UI primitives with traditional shadcn ui setup

In this approach, the project installs Radix UI packages (`@radix-ui/react-*`) and uses traditional shadcn ui generator templates.

**Pros**:
- Familiar ecosystem with extensive community recipes.

**Cons**:
- Radix UI relies on older styling conventions that require more CSS shims with Tailwind CSS v4.
- Larger dependency footprint across multiple individual Radix packages.
- Diverges from the project's installed Coss UI skills and Base UI roadmap.

### Option 3: Custom unstyled primitives with pure Tailwind utilities

In this approach, we build every primitive from plain HTML elements (`div`, `button`, `input`) with manual React state for open and close logic.

**Pros**:
- Zero new library dependencies.

**Cons**:
- High maintenance burden for focus traps, portal rendering, outside click detection, and ARIA attributes.
- High risk of accessibility bugs and inconsistent keyboard behavior across different pages.

### Option 4: Phased rollout by surface layer (Chosen Rollout Strategy)

Rather than performing a high risk single big bang rewrite of all 46 application pages at once, we migrate surfaces in focused layers:
1. Core primitives and glassmorphism utilities (Wave 1, completed)
2. Shells, layout templates, and shared domain blocks (`PublicHeader`, `PublicFooter`, `AdminSidebar`, `Templates.tsx`, `AtmBlocks.tsx`)
3. Public booking and service funnels (`/trips`, `/book/*`, `SeatMap.tsx`, `/courier`, `/track/*`, `/manage`, `/terminals`, `/charter`)
4. Public marketing and information pages (modular home sections, `/about`, `/contact`, `/faq`, `/routes/*`)
5. Authentication and customer account views (`/login`, `/register`, `/account`)
6. Administrative back office and driver manifest consoles (`/admin/*`, `/driver/*`)
7. Theme responsiveness and contrast regression verification

**Pros**:
- Verifiable incremental delivery with zero broken deployments.
- Tracer bullet slices prove theme responsiveness early on core shells before touching secondary admin pages.
- Simplifies pull request review and automated test verification.

## Decision

**Chosen option**: Option 1 (Base UI primitives with Coss UI styling and Class Variance Authority) paired with Option 4 (Phased rollout by surface layer).

We standardize on `@base-ui/react` primitives styled with Coss UI Tailwind CSS v4 semantic tokens and class variance authority inside `apps/web/src/components/ui/`, supporting backward compatibility aliases. We systematically eliminate hardcoded slate and white classes across all page routes and shells through structured rollout waves.

**Implementation skills**: `coss` (`cosscom/ui`, `.agents/skills/coss/`) · `coss-particles` (`cosscom/ui`, `.agents/skills/coss-particles/`) · `tailwindcss` (`mindrally/skills`, `.agents/skills/tailwindcss/`) · `improve-ui` (`ibelick/ui-skills`, `.agents/skills/improve-ui/`) · `antigravity-design-expert` (`cosscom/ui`, `.agents/skills/antigravity-design-expert/`)

## Rationale

Ascent Transport Management needs a rock solid, accessible UI foundation that preserves our brand identity (magenta `#ca2484`, slate neutrals, spatial depth) while avoiding the traps of brittle custom popup logic. Base UI is the next generation headless foundation from the creators of Material UI, built from the ground up for modern React and clean CSS composition.

Combining Base UI headless primitives with Coss UI Tailwind v4 tokens provides the ideal sweet spot: bulletproof accessibility and full local code ownership without third party lock in. Using class variance authority allows every component to support predictable variants like `default`, `outline`, `ghost`, and `glass` with strong TypeScript autocomplete and seamless compatibility for existing callers.

Phasing the cross page rollout guarantees that layout templates and shared domain blocks are theme responsive first, immediately cascading readable dark mode contrast to all child views, followed by targeted refactoring of high traffic public funnels.

## Standard definition

**1. Extended component signatures and taxonomy**:

| Component | File | Compound parts | Key variants and props |
|---|---|---|---|
| Button | `Button.tsx` | `Button` | `variant`: default (primary), secondary, outline, ghost, glass, destructive. `size`: sm, default (md), lg, icon. `isLoading`, `leftIcon`, `rightIcon`. |
| Input | `Input.tsx` | `Input` | `size`: sm, default, lg. `aria-invalid`, `hasError` (maps to aria-invalid). |
| Select | `Select.tsx` | `Select`, `SelectTrigger`, `SelectValue`, `SelectPopup`, `SelectItem`, `SelectGroup`, `SelectSeparator` | Compound Base UI or polymorphic native select for query form submission. |
| Card | `Card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardPanel`, `CardFooter` | `variant`: default, glass, spatial, outline, elevated. |
| Dialog | `Dialog.tsx` | `Dialog`, `DialogTrigger`, `DialogPopup`, `DialogPanel`, `DialogTitle`, `DialogDescription`, `DialogClose`, `DialogHeader`, `DialogFooter` | Backdrop blur overlay, focus trap, portal rendering, escape key handling. |
| Popover | `Popover.tsx` | `Popover`, `PopoverTrigger`, `PopoverPopup`, `PopoverTitle`, `PopoverDescription`, `PopoverClose` | Floating positioning, click outside dismiss, arrow support. |
| Tabs | `Tabs.tsx` | `Tabs`, `TabsList`, `TabsTab`, `TabsPanel` | `variant`: pill, segmented, underline. Full keyboard arrow navigation. |
| Badge | `Badge.tsx` | `Badge` | `variant`: default, secondary, outline, glass, destructive, success, warning, info. |
| DateField | `DateField.tsx` | `DateField` | Coss semantic tokens (`bg-card`, `border-border`, `text-foreground`). |
| Table | `Table.tsx` | `Table`, `TableHeader`, `TableRow`, `TableCell`, `TableHead` | High contrast responsive data grid with stacked mobile transform. |
| Separator | `Separator.tsx` | `Separator`, `Breadcrumb` | Semantic divider and accessible breadcrumb hierarchy. |
| Checkbox | `Checkbox.tsx` | `Checkbox` | Accessible binary input with focus ring and semantic checkmark. |
| Textarea | `Textarea.tsx` | `Textarea` | Multi line text input with semantic border and focus ring. |

**2. Glassmorphism token utility definition**:

```css
@utility glass-surface {
  background-color: color-mix(in srgb, var(--card) 75%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border);
}

@utility glass-card-spatial {
  background-color: color-mix(in srgb, var(--card) 80%, transparent);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid color-mix(in srgb, var(--border) 90%, transparent);
  box-shadow: 0 12px 36px color-mix(in srgb, black 8%, transparent);
}
```

**3. Theme Responsiveness and Token Migration Matrix**:

| Legacy or Hardcoded Pattern | Canonical Replacement Token | Semantic Purpose |
|---|---|---|
| `bg-white` | `bg-card` or `bg-background` | Adaptive background for cards and views |
| `text-slate-900` | `text-foreground` or `text-card-foreground` | High contrast primary text in light and dark |
| `text-slate-600` / `text-slate-500` | `text-muted-foreground` | Secondary supporting copy with compliant contrast |
| `border-slate-200` | `border-border` | Subtle dividing lines adapted to theme opacity |
| `bg-slate-50` / `bg-slate-100` | `bg-muted` | Neutral background fill for inactive panels and tags |
| `bg-[#ca2484]` | `bg-primary` | Main brand interactive actions |
| `text-[#ca2484]` | `text-primary` | Main brand accent text |
| Raw `<button>` | `<Button>` | Accessible keyboard focus, variants, 44px hit size |
| Raw `<input>` | `<Input>` | Standardized height, focus ring, error border |
| Raw `<select>` | `<Select>` | Popover dropdown with keyboard navigation |
| Ad hoc modal `<div>` | `<Dialog>` | Focus trap, backdrop blur, portal mounting |

**4. Form Select Strategy**:
- For navigation and search query forms using standard GET submissions (`SearchForm.tsx`), pass `name`, `value`, and `onChange` to `<Select>`, which renders the tokenized polymorphic native select with accessible styling.
- For rich client side flows requiring custom popover positioning, render Base UI compound components (`<Select><SelectTrigger><SelectValue /></SelectTrigger><SelectPopup><SelectItem ... /></SelectPopup></Select>`).

**5. StatusBadge Domain Adapter Mapping**:

```tsx
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const variantMap: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
    scheduled: 'info',
    boarding: 'warning',
    in_transit: 'secondary',
    delivered: 'success',
    confirmed: 'success',
    cancelled: 'destructive',
    expired: 'destructive',
    held: 'warning',
  };

  const variant = variantMap[status.toLowerCase()] || 'default';
  return <Badge variant={variant} className={className}>{status.replace('_', ' ')}</Badge>;
}
```

**Replaces**:
- Hardcoded background colors such as `bg-[#ca2484]`, `bg-white`, and `bg-slate-900` on custom elements.
- Inconsistent touch heights below 44px on primary user controls.
- Duplicated custom backdrop blur card markup across pages.
- Unstyled native HTML selects lacking keyboard accessibility and dark theme tokens.
- Hardcoded slate text classes in layout templates causing dark mode illegibility.
- Invalid token references in glassmorphism CSS utilities.
- Hydration flash in ThemeProvider.

**Enforcement**:
- Code review verification against this specification.
- Component exports exported cleanly from `apps/web/src/components/ui/`.
- TypeScript interface validation with strict variant autocomplete and backward compatibility aliases.
- Visual inspection under both light and dark mode toggles.
- Automated contrast checks in `scripts/check-contrast.ts` testing light and dark palettes.

**Rollout**:
- Wave 1 (Completed): Core UI primitives (`Button`, `Input`, `Card`, `Badge`, `Select`, `Popover`, `Tabs`, `Dialog`), `globals.css` glass utilities, `HeroShowcase.tsx` refactoring.
- Wave 2: Shells, layout templates, and shared domain blocks (`PublicHeader`, `PublicFooter`, `AdminSidebar`, `Templates.tsx`, `PageShell`, `ContentPage`, `AtmBlocks.tsx` including `TerminalCard`, `VehicleCard`, `StatusBadge`, `PhoneInput`, `Stepper`, `DateField.tsx`, `Separator.tsx`, `Table.tsx`).
- Wave 3: Public booking and service funnels (`/trips`, `/book/*`, `SeatMap.tsx`, `/courier`, `/track/*`, `/manage`, `/terminals`, `/charter`).
- Wave 4: Public marketing and information pages (modular home sections, `/about`, `/contact`, `/faq`, `/routes/*`, `/privacy`, `/terms`).
- Wave 5: Authentication and customer account portals (`/login`, `/register`, `/account`, `/verify-*`).
- Wave 6: Administrative back office and driver manifests (`/admin/*`, `/driver/*`).
- Wave 7: Contrast testing and theme switching regression pass.

**Exceptions**:
- Floating 3D canvas containers (Three.js and React Three Fiber viewports) remain unconstrained by standard UI card frames.

## Build plan

- [x] 1. Install `@base-ui/react` and `class-variance-authority` in `apps/web`, satisfies **AC-1**.
- [x] 2. Update `apps/web/src/app/globals.css` to add tokenized `@utility glass-surface` and `@utility glass-card-spatial` definitions, satisfies **AC-4**, **AC-5**.
- [x] 3. Create standardized Wave 1 component primitives in `apps/web/src/components/ui/` (`Button.tsx`, `Input.tsx`, `Select.tsx`, `Card.tsx`, `Badge.tsx`, `Tabs.tsx`, `Popover.tsx`, `Dialog.tsx`) with Coss UI Base UI compound patterns and backward compatibility aliases, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-7**.
- [x] 4. Refactor `HeroShowcase.tsx` to consume the standardized Button, Input, Popover, and Card primitives, satisfies **AC-6**, **AC-7**.
- [ ] 5. Fix `globals.css` glass utilities to use valid runtime variables and fix `ThemeProvider.tsx` hydration synchronization to eliminate dark mode flash, satisfies **AC-4**, **AC-7**.
- [ ] 6. Standardize remaining primitives in `apps/web/src/components/ui/` (`DateField.tsx`, `Table.tsx`, `Separator.tsx`, `Checkbox.tsx`, `Textarea.tsx`, `RadioGroup.tsx`) to consume semantic Coss tokens, satisfies **AC-1**, **AC-2**, **AC-8**.
- [ ] 7. Refactor core shells (`PublicHeader.tsx`, `PublicFooter.tsx`, `AdminSidebar.tsx`) and layout templates (`Templates.tsx`, `PageShell`, `ContentPage`) with semantic tokens and 44px hit targets, satisfies **AC-3**, **AC-8**.
- [ ] 8. Refactor shared domain blocks in `AtmBlocks.tsx` (`TerminalCard`, `VehicleCard`, `StatusBadge`, `PhoneInput`, `Stepper`) to consume semantic tokens and wrap `Badge`, satisfies **AC-8**.
- [ ] 9. Refactor public booking and service funnels (`/trips`, `/book/*`, `SeatMap.tsx`, `/courier`, `/track/*`, `/manage`, `/terminals`, `/charter`) to adopt standardized primitives and eliminate hardcoded slate/white classes, satisfies **AC-9**.
- [ ] 10. Refactor public marketing and information pages (modular home sections, `/about`, `/contact`, `/faq`, `/routes/*`, `/privacy`, `/terms`) to adopt semantic background and text tokens with `dark:prose-invert`, satisfies **AC-7**, **AC-8**.
- [ ] 11. Refactor authentication views (`/login`, `/register`, `/account`) and administrative back office portals (`/admin/*`, `/driver/*`) to consume standardized form controls, buttons, and tables with full theme responsiveness, satisfies **AC-10**.
- [ ] 12. Update `scripts/check-contrast.ts` with dark background pairs and run automated contrast and pure function tests confirming zero regressions, satisfies **AC-5**, **AC-7**, **AC-11**.

## Consequences

**Positive**:
- Consistent visual appearance, typography, and touch geometry across every screen in the entire application.
- First class accessibility with Base UI handling ARIA roles and keyboard interactions.
- Flawless light and dark mode switching through semantic CSS variables with zero text washouts or illegibility.
- Accelerated development speed for all future features using copy paste Coss UI primitives.

**Negative / tradeoffs**:
- Requires systematic touch on multiple page files to replace hardcoded Tailwind color utilities.

**Neutral**:
- The ATM brand palette (`#ca2484`, slate neutrals) and hard architectural rules remain untouched.

## Follow-up

- Register newly added component recipes in `docs/DESIGN_SYSTEM.md`.
- Provide particle patterns from `.agents/skills/coss-particles/` when implementing complex flows.
