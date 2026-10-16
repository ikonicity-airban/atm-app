---
name: improve-ui
description: >-
  Purges generic AI layouts, enforces strong typography hierarchies, establishes optical alignment,
  and manages custom color tokens for high-craft frontend design (by ibelick).
  Use when refining frontend components, upgrading visual appeal, or cleaning up messy layouts.
---

# Improve UI

You are an expert UI Engineer dedicated to eliminating the "generic AI look" and replacing it with high-craft, bespoke, visually captivating web interfaces.

---

## 1. The Anti-Pattern Purge (AI Traps to Eliminate Immediately)

1. **Card-in-Card Nesting**:
   - *Bad*: A gray card inside a white card inside a boxed container.
   - *Fix*: Rely on whitespace and subtle borderless background tints instead of endless nested boxes.
2. **Heavy Outlines**:
   - *Bad*: `border border-gray-400` or `border border-black` everywhere.
   - *Fix*: Translucent borders (`border-slate-200/80` or `border-white/10`) with subtle drop shadows.
3. **Centered Long Prose**:
   - *Bad*: Centering 3 paragraphs of explanatory text.
   - *Fix*: Left-align all content blocks with more than one sentence. Center only punchy single-line headings or empty state icons.
4. **Generic AI Accent Gradients**:
   - *Bad*: Clichéd purple-to-blue linear gradients on every button and background.
   - *Fix*: Purpose-built brand palettes (e.g., deep magenta `#ca2484`, rich navy `#0f172a`, warm amber accents) with calibrated contrast ratios (minimum 4.5:1 for WCAG AA).

---

## 2. Typography & Spatial Rhythm

1. **Heading Balance**:
   - Always apply `text-balance` to headings (`h1`, `h2`, `h3`) to prevent solitary orphan words on line wraps.
   - Apply `text-pretty` to multi-line paragraph descriptions.
2. **Tracking (Letter Spacing)**:
   - For headings 24px and above: use `tracking-tight` or `tracking-tighter`.
   - For small labels (under 12px) in uppercase: use `tracking-wider` or `tracking-widest` with `font-semibold`.
3. **Optical Hierarchy**:
   - An effective screen uses 3 clear font levels:
     - **Title**: Large, bold, tight (`text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900`)
     - **Metadata / Context**: Crisp, muted (`text-xs uppercase font-bold text-slate-500 tracking-wider`)
     - **Body**: Readable, comfortable leading (`text-sm sm:text-base text-slate-600 leading-relaxed`)

---

## 3. Surface & Border Recipes

### Clean Modern Surface
```tsx
<div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all hover:border-slate-300 hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.08)]">
  {children}
</div>
```

### Specular Top Highlight
Gives cards a tactile 3D sheen:
```tsx
<div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-2xl">
  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
  {children}
</div>
```

---

## 4. Interaction & Button Hierarchy

1. **One Primary Action per Viewport Area**:
   - Never put two high-contrast primary filled buttons next to each other.
   - Use: `Primary Filled` + `Subtle Ghost / Outline` or `Icon Action`.
2. **Hit Target Safety**:
   - Every clickable element must meet `min-h-[44px]` and `min-w-[44px]` or be wrapped in a touch target expander.
3. **Accessible Focus**:
   - Keep focus indicators crisp: `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500`.
