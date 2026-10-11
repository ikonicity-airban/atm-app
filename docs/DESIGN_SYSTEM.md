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

### Semantic Tokens
- **Success:** `--success-50` (`#f0fdf4`), `--success-500` (`#22c55e`), `--success-700` (`#15803d`)
- **Warning:** `--warning-50` (`#fffbeb`), `--warning-500` (`#f59e0b`), `--warning-700` (`#b45309`)
- **Danger:** `--danger-50` (`#fef2f2`), `--danger-500` (`#ef4444`), `--danger-700` (`#b91c1c`)
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

## 4. Typography Scale

- **Display & Headings:** Bold, clean sans-serif typography.
- **Body:** Readable geometric sans-serif.
- **Fluid Sizing:** Mobile-first starting at 360px viewport:
  - Heading 1: `clamp(1.875rem, 1.65rem + 1vw, 2.75rem)` (30px–44px)
  - Heading 2: `clamp(1.5rem, 1.35rem + 0.75vw, 2rem)` (24px–32px)
  - Heading 3: `clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)` (20px–24px)
  - Body: `clamp(0.875rem, 0.85rem + 0.2vw, 1rem)` (14px–16px)
  - Small / Microcopy: `0.75rem` (12px)
