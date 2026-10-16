# Verify: Spatial Layout and Page Styling Standards · spec 0012 · updated 2026-10-15
_Steps derived from spec 0012 criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] Visit `/trips?from=Enugu&to=Abuja` on mobile and desktop viewports → Heading and search form start below floating navigation pill with at least 80px safe clearance → AC-1
- [ ] Visit `/book/trip-enugu-abuja-01` → Checkout stepper and seat selector start below floating navigation bar without tucking behind header → AC-2
- [ ] Visit `/book/success/ATM-7K9W2P` → Boarding pass header card is clearly visible below navigation pill → AC-3
- [ ] Visit `/track` or any placeholder route → Placeholder box and typography render with comfortable top clearance (pt-24 sm:pt-28) → AC-4
- [ ] Click anchor links on `/terminals` or `#fleet` on the home page → Jump targets scroll with at least 112px clearance (scroll-mt-28) leaving clear space under floating header → AC-5
- [ ] Inspect interactive buttons and navigation links across all pages → All clickable targets meet 44px by 44px minimum bounding box → AC-6

## Commands
- [ ] `pnpm typecheck` → Exit code 0 with zero type errors across all packages → AC-7
- [ ] `pnpm test` → All 55 test assertions pass and all 11 WCAG AA contrast ratio checks pass → AC-8

## Acceptance criteria coverage
- AC-1 covered by step 1 · AC-2 covered by step 2 · AC-3 covered by step 3 · AC-4 covered by step 4 · AC-5 covered by step 5 · AC-6 covered by step 6 · AC-7 covered by step 7 · AC-8 covered by step 8
