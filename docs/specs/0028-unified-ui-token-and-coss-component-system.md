# 0028. Unified UI token and Coss component system

**Date**: 2026-10-19
**Status**: Accepted

## Summary

This specification establishes a unified UI token and component system across Ascent Transport Management by standardizing on Base UI primitives styled with Coss UI conventions and Tailwind CSS v4. It replaces disconnected custom elements across the application with reusable, accessible, and tokenized components including button, input, select, card, dialog, badge, tabs, and popover. These shared building blocks provide reliable accessibility, consistent 44px touch targets, tokenized glassmorphism surfaces, and strict enforcement of the project design invariants.

## Context

Ascent Transport Management runs on Next.js 15, React 19, and Tailwind CSS v4. While specification 0005 introduced Coss UI semantic color variables inside globals.css, the actual interactive components across the screens have evolved with mixed implementations. Some screens use raw HTML buttons with hardcoded hex values, others use partially wrapped custom elements, and several surfaces replicate popovers, dropdowns, and cards independently.

This lack of component level cohesion causes several concrete problems:
First, visual token drift occurs across pages where borders, radius scales, and hover states subtly differ. Second, accessibility features such as keyboard navigation, ARIA focus traps, and screen reader announcements require manual implementation in every ad hoc modal or dropdown. Third, the dark mode feel varies between views because components use hardcoded slate classes rather than semantic card, background, and muted tokens.

Establishing a canonical component library powered by Base UI with Coss UI styling gives the team copy paste ownership of accessible primitives. It ensures that every screen shares identical tokens for colors, typography, glassmorphism, and interactive states while remaining fully customizable through clean variants.

## Requirements

**User stories**:
- As a frontend engineer, I want consistent, copyable component primitives so that I can assemble new pages quickly without reinventing accessible dropdowns, modals, and form controls.
- As a passenger or corporate customer, I want reliable, accessible, and touch friendly controls so that booking trips, tracking waybills, and managing tickets feels polished on both mobile and desktop.
- As a designer, I want centralized design tokens and variant controls so that theme switches, radius scales, and glassmorphism styling propagate smoothly throughout the whole application.

**Acceptance criteria**:
- **AC-1**: Standardize core Coss UI component primitives in `apps/web/src/components/ui/` built on `@base-ui/react` and styled with Tailwind CSS v4 tokens, using lowercase file names (`button.tsx`, `input.tsx`, `select.tsx`, `card.tsx`, `dialog.tsx`, `badge.tsx`, `tabs.tsx`, `popover.tsx`).
- **AC-2**: Each component exposes class variance authority variants that consume semantic tokens (`primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`) and responsive size scales (`sm`, `default`, `lg`), supporting backward compatibility aliases (`variant="primary"` maps to `default`, `size="md"` maps to `default`, and preserving `isLoading`).
- **AC-3**: Interactive controls enforce a minimum touch target size of 44px by default, with smaller visual sizes (`size="sm"`) satisfying the 44px touch target invariant via pseudo element touch expansion (`relative after:absolute after:-inset-1 after:min-h-[44px]`).
- **AC-4**: Standardized `@utility glass-surface` and `@utility glass-card-spatial` declarations are added to `globals.css` and the card component to provide consistent translucent backdrop blur depth across both light and dark themes.
- **AC-5**: Hard project architectural bans remain strictly preserved: zero pulsing keyframes or pulsing animations anywhere, zero pill or badge wrappers enclosing section titles, and complete motion cancellation under `prefers-reduced-motion: reduce`.
- **AC-6**: Existing ad hoc buttons, selects, and cards in the main public page, hero showcase, and public navigation are refactored to consume the standardized primitives without visual regression.
- **AC-7**: All components support light and dark theme toggling cleanly via CSS variables without layout shifts or text illegibility, and include `'use client'` on all interactive Base UI wrappers.

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

## Decision

**Chosen option**: Option 1: Base UI primitives with Coss UI styling and Class Variance Authority.

We standardize on `@base-ui/react` primitives styled with Coss UI Tailwind CSS v4 semantic tokens and class variance authority inside `apps/web/src/components/ui/`, using lowercase file names and supporting backward compatibility aliases.

**Implementation skills**: `coss` (`cosscom/ui`, `.agents/skills/coss/`) · `coss-particles` (`cosscom/ui`, `.agents/skills/coss-particles/`) · `tailwindcss` (`mindrally/skills`, `.agents/skills/tailwindcss/`) · `improve-ui` (`ibelick/ui-skills`, `.agents/skills/improve-ui/`) · `antigravity-design-expert` (`cosscom/ui`, `.agents/skills/antigravity-design-expert/`)

## Rationale

Ascent Transport Management needs a rock solid, accessible UI foundation that preserves our brand identity (magenta `#ca2484`, slate neutrals, spatial depth) while avoiding the traps of brittle custom popup logic. Base UI is the next generation headless foundation from the creators of Material UI, built from the ground up for modern React and clean CSS composition.

Combining Base UI headless primitives with Coss UI Tailwind v4 tokens provides the ideal sweet spot: bulletproof accessibility and full local code ownership without third party lock in. Using class variance authority allows every component to support predictable variants like `default`, `outline`, `ghost`, and `glass` with strong TypeScript autocomplete and seamless compatibility for existing callers.

## Standard definition

**1. Component signatures and taxonomy**:

| Component | File | Compound parts | Key variants and props |
|---|---|---|---|
| Button | `button.tsx` | `Button` | `variant`: default (primary), secondary, outline, ghost, glass, destructive. `size`: sm, default (md), lg, icon. `isLoading`, `leftIcon`, `rightIcon`. |
| Input | `input.tsx` | `Input` | `size`: sm, default, lg. `aria-invalid`, `hasError` (maps to aria-invalid). |
| Select | `select.tsx` | `Select`, `SelectTrigger`, `SelectValue`, `SelectPopup`, `SelectItem`, `SelectGroup`, `SelectSeparator` | Items first or children composition, keyboard selection, animated popover. |
| Card | `card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardPanel`, `CardFooter` | `variant`: default, glass, outline, elevated. |
| Dialog | `dialog.tsx` | `Dialog`, `DialogTrigger`, `DialogPopup`, `DialogPanel`, `DialogTitle`, `DialogDescription`, `DialogClose` | Backdrop blur overlay, focus trap, portal rendering, escape key handling. |
| Popover | `popover.tsx` | `Popover`, `PopoverTrigger`, `PopoverPopup`, `PopoverClose` | Floating positioning, click outside dismiss, arrow support. |
| Tabs | `tabs.tsx` | `Tabs`, `TabsList`, `TabsTab`, `TabsPanel` | `variant`: pill, segmented, underline. Full keyboard arrow navigation. |
| Badge | `badge.tsx` | `Badge` | `variant`: default, secondary, outline, glass, destructive, success, warning, info. |

**2. Glassmorphism token utility definition**:

```css
@utility glass-surface {
  background-color: color-mix(in srgb, var(--color-card) 75%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--color-border);
}

@utility glass-card-spatial {
  background-color: color-mix(in srgb, var(--color-card) 80%, transparent);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid color-mix(in srgb, var(--color-border) 90%, transparent);
  box-shadow: 0 12px 36px color-mix(in srgb, var(--color-black) 8%, transparent);
}
```

**3. Canonical Button component pattern**:

```tsx
'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-xs font-medium transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 min-h-[44px]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:opacity-95 shadow-xs',
        primary: 'bg-primary text-primary-foreground hover:opacity-95 shadow-xs',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-border bg-background hover:bg-muted text-foreground',
        ghost: 'text-foreground hover:bg-muted',
        glass: 'glass-surface text-foreground shadow-sm hover:opacity-95',
        destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
      },
      size: {
        sm: 'h-9 px-3 text-xs relative after:absolute after:-inset-1 after:min-h-[44px]',
        default: 'h-11 px-4 py-2 min-h-[44px]',
        md: 'h-11 px-4 py-2 min-h-[44px]',
        lg: 'h-12 px-6 text-sm min-h-[48px]',
        icon: 'w-11 h-11 min-w-[44px] min-h-[44px] p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  className,
  variant,
  size,
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
```

**Replaces**:
- Hardcoded background colors such as `bg-[#ca2484]` and `bg-slate-900` on custom buttons.
- Inconsistent touch heights below 44px on primary user controls.
- Duplicated custom backdrop blur card markup across pages.
- Unstyled native HTML selects lacking keyboard accessibility and dark theme tokens.
- Mixed PascalCase files with divergent prop interfaces.

**Enforcement**:
- Code review verification against this specification.
- Component exports exported cleanly from `apps/web/src/components/ui/`.
- TypeScript interface validation with strict variant autocomplete and backward compatibility aliases.

**Rollout**:
- Wave 1: Install `@base-ui/react` and `class-variance-authority`, define glass utilities in `globals.css`, and create standardized `button.tsx`, `input.tsx`, `select.tsx`, `card.tsx`, `badge.tsx`, `tabs.tsx`, and `popover.tsx`.
- Wave 2: Refactor `HeroShowcase.tsx` and public search forms to consume the standardized primitives.
- Wave 3: Upgrade `dialog.tsx` and remaining secondary screens across booking and administrative management.

**Exceptions**:
- Floating 3D canvas containers (Three.js and React Three Fiber viewports) remain unconstrained by standard UI card frames.

## Build plan

- [ ] 1. Install `@base-ui/react` and `class-variance-authority` in `apps/web`, satisfies **AC-1**.
- [ ] 2. Update `apps/web/src/app/globals.css` to add tokenized `@utility glass-surface` and `@utility glass-card-spatial` definitions, satisfies **AC-4**, **AC-5**.
- [ ] 3. Create or upgrade Wave 1 component primitives in `apps/web/src/components/ui/` (`button.tsx`, `input.tsx`, `select.tsx`, `card.tsx`, `badge.tsx`, `tabs.tsx`, `popover.tsx`) with Coss UI Base UI compound patterns and backward compatibility aliases, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-7**.
- [ ] 4. Refactor `HeroShowcase.tsx` to consume the standardized Button, Input, Select, Tabs, and Card primitives, satisfies **AC-6**, **AC-7**.
- [ ] 5. Upgrade `dialog.tsx` with Base UI popup primitives, satisfies **AC-1**, **AC-2**.
- [ ] 6. Run test suite and contrast validation confirming zero regressions, satisfies **AC-5**, **AC-7**.

## Consequences

**Positive**:
- Consistent visual appearance, typography, and touch geometry across every screen.
- First class accessibility with Base UI handling ARIA roles and keyboard interactions.
- Seamless light and dark mode switching through semantic CSS tokens.
- Accelerated development speed for all future features using copy paste Coss UI primitives.

**Negative / tradeoffs**:
- Adds `@base-ui/react` and `class-variance-authority` dependencies to `apps/web`.
- Requires surgical migration of existing ad hoc buttons and inputs.

**Neutral**:
- The ATM brand palette (`#ca2484`, slate neutrals) and hard architectural rules remain untouched.

## Follow-up

- Register newly added component recipes in `docs/DESIGN_SYSTEM.md`.
- Provide particle patterns from `.agents/skills/coss-particles/` when implementing complex flows.
