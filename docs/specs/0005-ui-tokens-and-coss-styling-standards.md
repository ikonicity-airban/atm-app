# 0005. UI tokens and coss styling standards

**Date**: 2026-10-14
**Status**: Accepted

## Summary

This specification standardizes the Ascent Transport Management design tokens in globals.css and docs/DESIGN_SYSTEM.md by adopting Coss UI styling conventions for Tailwind CSS v4. The update introduces Coss UI's semantic color architecture, font variable contracts, and modern theme functions while preserving the Ascent Transport Management magenta brand identity, slate neutrals, integer kobo currency rules, and hard architectural bans.

## Context

Ascent Transport Management uses Tailwind CSS v4 with custom CSS variables for brand magenta and slate neutrals. While functional, the existing token setup relies on disconnected variable chains that lack standard semantic tokens like primary, secondary, muted, accent, card, and popover.

Coss UI provides an industry tested design system contract built for Tailwind CSS v4 and Base UI primitives. It defines a clean semantic token architecture, a predictable typography contract with sans, heading, and mono variables, support for the Tailwind v4 alpha function, and data-slot aware styling patterns.

Adopting this standard prepares the codebase for Coss UI primitives and particles while guaranteeing that all existing Ascent Transport Management rules remain untouched:
- The core brand accent remains magenta `#ca2484` and hover `#aa1769`.
- Headings rest directly on section backgrounds, never wrapped inside pills, badges, or card containers.
- Pulsing animations remain strictly banned everywhere, with static placeholders and steady indicators used exclusively.
- All interactive controls maintain touch targets of at least forty four pixels.
- Motion collapses to zero when users request reduced motion.

## Requirements

**User stories**:
- As a frontend engineer, I want standard semantic tokens like primary, secondary, muted, and border so that I can build accessible components with consistent styling across the app.
- As a designer, I want clear font variable contracts and calibrated color tokens so that typography and contrast meet accessibility standards across every screen.

**Acceptance criteria**:
- **AC-1**: The `@theme inline` block in `apps/web/src/app/globals.css` exposes all Coss UI semantic tokens (background, foreground, primary, secondary, muted, accent, destructive, success, warning, info, border, input, ring, card, and popover).
- **AC-2**: The font variable contract defines `--font-sans`, `--font-heading`, and `--font-mono` mapped cleanly to Tailwind CSS v4 font families.
- **AC-3**: The Ascent Transport Management brand magenta scale (`--color-brand-50` through `--color-brand-950`) remains fully defined, with `--color-primary` mapped directly to brand magenta (`#ca2484`) and `--color-primary-foreground` to white.
- **AC-4**: Neutral slate tokens (`--color-neutral-50` through `--color-neutral-950`) remain fully defined and mapped to slate values for dark and light surfaces.
- **AC-5**: Transparent borders, inputs, and muted overlays utilize Tailwind v4 `--alpha()` theme function processing without replacing with ad-hoc color mix fallbacks.
- **AC-6**: Hard bans remain strictly enforced: zero animate-pulse or pulsing keyframes, zero pill wrapped section titles, and complete motion cancellation under `prefers-reduced-motion: reduce`.
- **AC-7**: All interactive buttons, inputs, links, and cards maintain touch targets of at least forty four pixels.
- **AC-8**: `docs/DESIGN_SYSTEM.md` is updated to document the Coss UI semantic token architecture, typography contracts, and component composition patterns.

## Options considered

### Option 1: Integrate Coss UI semantic tokens directly with ATM brand tokens in Tailwind v4 @theme inline (Chosen)

In this approach, `apps/web/src/app/globals.css` declares Coss UI's standard `@theme inline` block alongside the existing ATM brand and neutral color scales. Coss semantic tokens (primary, secondary, muted, border, card) map seamlessly to ATM magenta and slate neutrals.

**Pros**:
- Full compatibility with Coss UI primitives, particles, and future component imports.
- Zero breaking changes for existing components using `bg-[#ca2484]` or `text-slate-900`.
- Native Tailwind CSS v4 performance with compile time token resolution and `--alpha()` support.

**Cons**:
- Requires updating `docs/DESIGN_SYSTEM.md` to document both raw palette tokens and semantic roles.

### Option 2: Retain ad-hoc CSS variables without Coss semantic tokens

In this approach, the project keeps only `--color-brand-*` and `--color-neutral-*` custom variables.

**Pros**:
- No changes required to CSS files.

**Cons**:
- Incompatible with Coss UI primitives and particle catalog examples.
- Encourages hardcoded color classes and inconsistent button variants across features.

### Option 3: Replace ATM brand magenta with default Coss UI monochrome

In this approach, the primary color switches to monochrome black and white as seen in default Coss UI templates.

**Pros**:
- Closer to default Cal.com monochrome styling.

**Cons**:
- Directly destroys Ascent Transport Management brand identity established since project inception.
- Fails the core requirement to preserve ATM Nigeria brand guidelines.

## Decision

**Chosen option**: Option 1: Integrate Coss UI semantic tokens directly with ATM brand tokens in Tailwind v4 @theme inline.

We update `apps/web/src/app/globals.css` and `docs/DESIGN_SYSTEM.md` to implement Coss UI's semantic token contract and font variables, binding `--color-primary` to brand magenta (`#ca2484`) and neutrals to slate.

**Implementation skills**: `coss` (`cosscom/ui`, `.agents/skills/coss/`) · `coss-particles` (`cosscom/ui`, `.agents/skills/coss-particles/`) · `tailwindcss` (`mindrally/skills`, `.agents/skills/tailwindcss/`) · `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`)

## Rationale

Coss UI's token architecture brings structure to our styling layer without compromising our Nigerian transport domain identity. By mapping `--color-primary` to `--brand-600` (`#ca2484`), buttons and interactive highlights automatically align with the brand.

Using `--alpha(var(--color-black) / 8%)` for `--color-border` and `--color-input` creates clean, modern borders that adapt gracefully across light surfaces. Preserving the hard bans on pulsing animations and pill wrapped headings guarantees that accessibility and performance stay first class.

## Standard definition

**1. Typography contract**:
| Variable | Usage | Default fallback |
|---|---|---|
| `--font-sans` | Body copy, navigation, buttons, form controls | Inter, system-ui, sans-serif |
| `--font-heading` | Page titles, hero display headings | Inter, system-ui, sans-serif |
| `--font-mono` | Booking references, tracking codes, fares | JetBrains Mono, monospace |

**2. Semantic color contract**:
| Token | CSS Variable | Value in Light Mode | Role |
|---|---|---|---|
| `--color-background` | `--background` | `#ffffff` | Page viewport backdrop |
| `--color-foreground` | `--foreground` | `#0f172a` (Slate 900) | Primary high contrast body text |
| `--color-primary` | `--primary` | `#ca2484` (Brand 600) | Primary brand CTA buttons and active states |
| `--color-primary-foreground` | `--primary-foreground` | `#ffffff` | Text on primary brand buttons |
| `--color-secondary` | `--secondary` | `--alpha(var(--color-black) / 4%)` | Secondary subtle button surfaces |
| `--color-secondary-foreground` | `--secondary-foreground` | `#0f172a` | Text on secondary buttons |
| `--color-muted` | `--muted` | `--alpha(var(--color-black) / 4%)` | Muted containers and inactive tabs |
| `--color-muted-foreground` | `--muted-foreground` | `#64748b` (Slate 500) | Supporting descriptions and microcopy |
| `--color-accent` | `--accent` | `#fdf2f9` (Brand 50) | Tinted brand hover surfaces |
| `--color-accent-foreground` | `--accent-foreground` | `#ca2484` (Brand 600) | Brand highlighted text on hover |
| `--color-border` | `--border` | `--alpha(var(--color-black) / 8%)` | Standard container borders |
| `--color-input` | `--input` | `--alpha(var(--color-black) / 10%)` | Input control boundaries |
| `--color-ring` | `--ring` | `#ca2484` (Brand 600) | Focus indicator outline |
| `--color-card` | `--card` | `#ffffff` | Elevated card surfaces |
| `--color-card-foreground` | `--card-foreground` | `#0f172a` | Text inside cards |

**3. Architectural invariants**:
- **Zero pulsing animations**: Pulse and shimmer animations remain banned. Static placeholders or spinners are used exclusively.
- **Heading independence**: Titles rest directly on section backgrounds, never wrapped in cards, badges, or pills.
- **Motion reduction**: Transitions and animations collapse to zero under `prefers-reduced-motion: reduce`.
- **Touch target geometry**: Interactive controls meet or exceed forty four by forty four pixels.

## Build plan

- [x] 1. Update `apps/web/src/app/globals.css` with Coss UI's `@theme inline` semantic tokens, font variables, and `--alpha()` definitions, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**.
- [x] 2. Verify all existing brand and neutral tokens are preserved and cleanly accessible via standard Tailwind utility classes, satisfies **AC-3**, **AC-4**.
- [x] 3. Ensure the hard ban on pulsing animations and motion reduction rules remain active in `globals.css`, satisfies **AC-6**.
- [x] 4. Update `docs/DESIGN_SYSTEM.md` to document Coss UI semantic token contracts, font variable conventions, and accessibility rules, satisfies **AC-8**.
- [x] 5. Run contrast checks, unit tests, and monorepo type checks confirming zero regressions, satisfies **AC-6**, **AC-7**.

## Consequences

**Positive**:
- Direct interoperability with Coss UI primitives, particles, and Base UI components.
- Consistent semantic naming conventions across the entire frontend application.
- Modern Tailwind CSS v4 styling with compile time token optimization.

**Negative / tradeoffs**:
- Developers must use semantic tokens like `bg-primary` and `text-muted-foreground` in new components rather than hardcoding hex codes.

**Neutral**:
- All existing components continue to render identically without visual breakage.

## Follow-up

- [x] Register `coss` and `coss-particles` skills in root `AGENTS.md` so all agent workflows recognize Coss UI component conventions.
