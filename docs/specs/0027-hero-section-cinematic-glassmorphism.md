# 0027. Hero Section Cinematic Glassmorphism Redesign

Date: 2026-10-18
Status: Proposed

## Summary

This specification redesigns the Ascent Transport Management hero section to replicate the exact visual structure, centered layout, and floating dark glassmorphism search island shown in the reference image. The section features a centered typographic title, a purple glass pill badge, a frosted translucent search container with trip mode tabs, dark recessed input capsules, a vivid glowing gradient search button, centered trust indicators, and a floating WhatsApp dispatch helper button.

## Context

The previous hero layout used a two column header with left aligned titles, which did not reflect the optical balance or floating glass look from the reference screenshot. The reference screenshot exhibits a centered composition:
1. Deep midnight purple background with atmospheric nebula and horizontal light streaks.
2. Centered glass pill badge: Voted Number 1 Travel App 2026 (adapted for Ascent Transport as Nigeria Number 1 Executive Interstate Fleet).
3. Large centered two line heading: Your Journey Begins in One Click, where One Click shines with a luminous purple to magenta gradient.
4. Centered descriptive paragraph highlighting 5 passenger Toyota Siennas across Nigerian corridors.
5. Floating translucent glass search card with rounded corners, backdrop blur, subtle border glow, and internal top controls.
6. Horizontal row of dark recessed input capsules covering departure city, destination city, travel date, passenger count, and a glowing purple search button.
7. Bottom row of centered trust metrics with gold stars, secure checkout shield, and verified trip counts.
8. Bottom right floating chat bubble with unread badge.

## Requirements

User stories:
- As an interstate commuter visiting Ascent Transport, I want a centered and visually immersive hero section where I can immediately choose my corridor, date, and seats within a single floating glass search card.
- As a traveler on mobile or desktop, I want quick access to departure cities, passenger counts, promo codes, and WhatsApp dispatch assistance.

Acceptance criteria:
- AC-1: Centered Optical Composition. The hero section must feature a centered top pill badge, a centered two line heading with gradient text, and a centered description paragraph.
- AC-2: Floating Glassmorphism Search Island. The search island must be housed in a large translucent container with rounded borders, backdrop blur, and subtle border highlights matching the reference screenshot.
- AC-3: Interior Mode Tabs and Utilities. The top row of the search card must include trip mode tabs (One Way, Round Trip, Private Charter) on the left and utility buttons (Add Promo Code, Terminal Directory) on the right.
- AC-4: Dark Recessed Input Capsules. The search row must render dark recessed capsules for origin terminal, destination terminal, Lagos departure date, passenger count, and the glowing search button.
- AC-5: Centered Trust Metrics. Directly below the search card, a centered row must display gold review stars (TrustScore 4.9), secure checkout shield, and verified trip volume.
- AC-6: Floating Dispatch Widget. A floating circular action button with a chat bubble icon and notification badge must appear in the lower right area.
- AC-7: Pure Integer Kobo and Lagos Time Integrity. All pricing and route lookups must preserve pure integer kobo math and Africa/Lagos WAT date defaults.
- AC-8: Plain Language Rule. Prose must contain zero hyphens or dashes used as punctuation marks.

## Options considered

### Option 1: Keep Two Column Text Layout with Updated Glass Colors
Keep the existing left aligned title and right aligned paragraph, only tweaking CSS colors.
Pros: Minimal edits to existing JSX.
Cons: Fails to match the reference image, which is completely centered.

### Option 2: Exact Centered Cinematic Glassmorphism Hero (Chosen)
Replace the hero layout with the exact centered composition, floating glass container, recessed capsules, top tabs, promo modal, and bottom trust indicators.
Pros: Matches the user reference image down to the pill badge, glowing button, and input capsules while preserving real Ascent operational data.
Cons: Requires rewriting the HeroShowcase component.

## Decision

Option 2 is chosen. The component at `apps/web/src/components/home/HeroShowcase.tsx` will be completely replaced to implement the exact centered layout, dark glass aesthetic, recessed capsules, glowing search button, and floating dispatch bubble.

## Build plan

1. Author build spec `docs/specs/0027-hero-section-cinematic-glassmorphism.md`.
2. Rewrite `apps/web/src/components/home/HeroShowcase.tsx` with centered typography, top glass pill, translucent floating search card, recessed input capsules with dropdown city pickers, date selector, passenger stepper, promo code modal, and centered trust row.
3. Verify with pure functions test and Next.js build.
4. Commit to branch `ui-modified` and push to GitHub.
