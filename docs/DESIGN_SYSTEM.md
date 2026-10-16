# Ascent Transport Management (ATM Nigeria) - Design System

**Single Source of Truth:** `apps/web/src/app/globals.css`  
**Brand Identity:** Ascent Transport Management (ATM Nigeria) &bull; "Travel Safe and Fast." &bull; Founded 2019

---

## 1. Color Palette Tokens

### Primary Brand (Magenta / Purple)
| Token | Hex Value | Role / Usage | WCAG AA Contrast |
|---|---|---|---|
| `--brand-50` | `#fdf2f9` | Tinted background / hover highlights | > 14:1 on dark text |
| `--brand-100` | `#fce7f4` | Subtle borders, light status backgrounds | > 12:1 on dark text |
| `--brand-200` | `#f9cfea` | Light secondary accents | — |
| `--brand-300` | `#f5a7d7` | Decorative borders | — |
| `--brand-400` | `#ed70bd` | Interactive hover states | — |
| `--brand-500` | `#df3ea1` | Vibrant accent | — |
| `--brand-600` | `#ca2484` | **Core Brand Accent** (buttons, active tabs, primary icons) | 4.6:1 on white text |
| `--brand-700` | `#aa1769` | Primary button hover / active states | 6.8:1 on white text |
| `--brand-800` | `#8c1656` | Deep text accent, dark borders | 9.5:1 on white text |
| `--brand-900` | `#741749` | Deep contrast headers | 12:1 on white text |
| `--brand-950` | `#47072a` | Deepest brand backdrop | > 15:1 on white text |

### Neutrals (Slate Calibrated)
| Token | Hex Value | Role |
|---|---|---|
| `--neutral-50` | `#f8fafc` | Card & alternate section backgrounds |
| `--neutral-100` | `#f1f5f9` | Muted badge and pill backgrounds |
| `--neutral-200` | `#e2e8f0` | Standard dividing borders (`--border`) |
| `--neutral-300` | `#cbd5e1` | Input borders, stronger boundaries |
| `--neutral-400` | `#94a3b8` | Disabled text, subtle icons |
| `--neutral-500` | `#64748b` | Secondary descriptions, helper text |
| `--neutral-600` | `#475569` | Supporting body copy |
| `--neutral-700` | `#334155` | High-contrast body copy |
| `--neutral-800` | `#1e293b` | Dark container backgrounds |
| `--neutral-900` | `#0f172a` | Primary headings, dark navigation headers |
| `--neutral-950` | `#020617` | High-contrast solid dark backdrops |

### Coss UI Semantic Color Tokens (Light Mode Contract)
| Token | CSS Variable | Light Mode Value / Formula | Role / Usage |
|---|---|---|---|
| `--color-background` | `--background` | `#ffffff` | Page viewport and main backdrop |
| `--color-foreground` | `--foreground` | `#0f172a` (Slate 900) | Primary high contrast body text |
| `--color-primary` | `--primary` | `#ca2484` (Brand 600) | Core brand accent, CTA buttons, active states |
| `--color-primary-foreground` | `--primary-foreground` | `#ffffff` | Text on primary brand buttons |
| `--color-secondary` | `--secondary` | `--alpha(var(--color-black) / 4%)` | Secondary subtle button surfaces |
| `--color-secondary-foreground` | `--secondary-foreground` | `#0f172a` | Text on secondary buttons |
| `--color-muted` | `--muted` | `--alpha(var(--color-black) / 4%)` | Muted containers and inactive tab backgrounds |
| `--color-muted-foreground` | `--muted-foreground` | `#64748b` (Slate 500) | Secondary helper text and descriptions |
| `--color-accent` | `--accent` | `#fdf2f9` (Brand 50) | Tinted brand hover surfaces and chips |
| `--color-accent-foreground` | `--accent-foreground` | `#ca2484` (Brand 600) | Brand highlighted text and icons on hover |
| `--color-destructive` | `--destructive` | `#ef4444` (Danger 500) | Destructive action triggers and error surfaces |
| `--color-destructive-foreground` | `--destructive-foreground` | `#b91c1c` (Danger 700) | High contrast text on destructive warnings |
| `--color-border` | `--border` | `--alpha(var(--color-black) / 8%)` | Standard container and divider borders |
| `--color-input` | `--input` | `--alpha(var(--color-black) / 10%)` | Form input boundaries and control outlines |
| `--color-ring` | `--ring` | `#ca2484` (Brand 600) | Accessible focus indicators |
| `--color-card` | `--card` | `#ffffff` | Elevated card surfaces |
| `--color-card-foreground` | `--card-foreground` | `#0f172a` | Text inside card bodies |
| `--color-popover` | `--popover` | `#ffffff` | Floating popovers and dropdown menus |
| `--color-popover-foreground` | `--popover-foreground` | `#0f172a` | Text inside popover menus |

### Semantic Status Tokens
- **Success:** `--success-50` (`#f0fdf4`), `--success-500` (`#22c55e`), `--success-700` (`#15803d`)
- **Warning:** `--warning-50` (`#fffbeb`), `--warning-500` (`#f59e0b`), `--warning-700` (`#b45309`)
- **Danger / Destructive:** `--danger-50` (`#fef2f2`), `--danger-500` (`#ef4444`), `--danger-700` (`#b91c1c`)
- **Info:** `--info-50` (`#f0f9ff`), `--info-500` (`#0ea5e9`), `--info-700` (`#0369a1`)

---

## 2. Radii, Shadows, Spacing & Z-Index

### Radii
- `--radius-sm`: `0.25rem` (4px)
- `--radius-md`: `0.375rem` (6px)
- `--radius-lg`: `0.5rem` (8px)
- `--radius-xl`: `0.75rem` (12px)
- `--radius-full`: `9999px`

### Shadows
- `--shadow-sm`: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- `--shadow-md`: `0 4px 6px -1px rgb(0 0 0 / 0.08)`
- `--shadow-lg`: `0 10px 15px -3px rgb(0 0 0 / 0.08)`

### Touch Targets
- Minimum touch target: **44px x 44px** on all clickable controls, buttons, links, and drawer items.

### Z-Index Scale
- `--z-dropdown`: `1000`
- `--z-sticky`: `1020`
- `--z-fixed`: `1030`
- `--z-modal-backdrop`: `1040`
- `--z-modal`: `1050`
- `--z-popover`: `1060`
- `--z-tooltip`: `1070`

---

## 3. Strict Architectural Bans

1. **HARD BAN on `animate-pulse`:**
   - Any pulsing or blinking animations anywhere in the application are strictly prohibited.
   - Skeletons use solid neutral backgrounds (`#f1f5f9`) without shimmer or pulse loops.
2. **HARD BAN on Pill/Card Wrapped Titles:**
   - Section titles, page titles, and hero headings must **never** be wrapped inside a pill, badge, chip, or card container.
   - Headings are plain typography rendered directly on their section background.
3. **Respect `prefers-reduced-motion`:**
   - All transitions collapse to `0.01ms` when user requests reduced motion.

---

## 4. Typography Scale & Font Variable Contract

### Coss UI Font Variable Contract
| Variable | Font Family Stack | Purpose / Usage |
|---|---|---|
| `--font-sans` | `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | Default body copy, form controls, navigation, and interactive buttons |
| `--font-heading` | `var(--font-sans)` | High impact section headings, hero titles, display metrics |
| `--font-mono` | `ui-monospace, "SF Mono", Menlo, Consolas, monospace` | Tracking numbers (`ATM-EXP-XXXXXX`), booking codes, integer kobo currency tables |

### Fluid Typography Scale
- **Display & Headings:** Bold, clean sans-serif typography.
- **Body:** Readable geometric sans-serif.
- **Fluid Sizing:** Mobile-first starting at 360px viewport:
  - Heading 1: `clamp(1.875rem, 1.65rem + 1vw, 2.75rem)` (30px–44px)
  - Heading 2: `clamp(1.5rem, 1.35rem + 0.75vw, 2rem)` (24px–32px)
  - Heading 3: `clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)` (20px–24px)
  - Body: `clamp(0.875rem, 0.85rem + 0.2vw, 1rem)` (14px–16px)
  - Small / Microcopy: `0.75rem` (12px)

---

## 5. Modern Theme Functions & Alpha Opacity
In Tailwind CSS v4, dynamic alpha opacity is processed using the native `--alpha()` function:
- **Borders:** `--color-border: --alpha(var(--color-black) / 8%)`
- **Inputs:** `--color-input: --alpha(var(--color-black) / 10%)`
- **Muted Surfaces:** `--color-muted: --alpha(var(--color-black) / 4%)`
- **Secondary Buttons:** `--color-secondary: --alpha(var(--color-black) / 4%)`

Avoid `color-mix()` or `rgba()` fallbacks where `--alpha()` is supported, maintaining pure CSS theme variable resolution.

