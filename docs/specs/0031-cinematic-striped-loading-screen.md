# Spec 0031: Cinematic Striped Loading Screen

## Summary

This specification defines the architecture, visual choreography, state machines, and component contracts for the Ascent Transport Management (ATM Nigeria) cinematic loading screen.

The presentation features an immersive viewport overlay draped in a deep dark shade of the primary brand color, four staggered stripes of 60px width oriented at an angle of 30 degrees that spring from the top left into the center, hold for 200 milliseconds, and exit toward the bottom right. Concurrently, the brand logo with a responsive width of 15vw slides into the center, holds, and follows the stripes out.

---

## Motivation and Scope

Standard generic spinners and pulsing skeleton screens detract from the premium, executive travel identity of ATM Nigeria. A branded cinematic transition communicates high craft, reliability, and momentum during route navigation, initial application boot, and async operations.

The scope covers:
1. Reusable presentation component in `apps/web/src/components/ui/CinematicLoadingScreen.tsx`.
2. Animation keyframes, spring easing curves, and theme tokens in `apps/web/src/app/globals.css`.
3. Programmatic context provider and hook in `apps/web/src/components/ui/LoadingProvider.tsx`.
4. Monorepo route transition orchestration across root layout and public layouts.
5. Next.js 15 App Router streaming fallback coordination to prevent React 19 suspense tearing.
6. Accessibility compliance including `prefers-reduced-motion`, ARIA status roles, and inert focus isolation.

---

## Visual Design and Color Palette

### 1. Viewport Canvas Background
- The background overlay spans the entire viewport (`fixed inset-0 z-[2000]`).
- The background tone is a deep dark shade of the brand primary color: `--brand-950` (`#47072a`) blended with deep obsidian wine (`#220314`).
- It completely conceals underlying page layout shifts while assets stream.

### 2. The Four Diagonal Stripes
All four stripes share an exact width of 60px (`w-[60px]`), arranged in a shared angled cluster rotated at 30 degrees (`rotate(30deg)`), spanning beyond the viewport bounds (`min-h-[240vh]`). The stripes are separated by a consistent 16px gap (`gap-4`), yielding a balanced 288px central band.

The four stripe colors are:
1. **Stripe 1 (Accent)**: Electric Rose Accent (`#ed70bd` / `--brand-400`).
2. **Stripe 2 (Primary)**: Core ATM Nigeria Primary Magenta (`#ca2484` / `--brand-600`).
3. **Stripe 3 (Executive Gold)**: Royal Amber Gold (`#f59e0b`), symbolizing transit prestige.
4. **Stripe 4 (Diamond White)**: Crisp Diamond White (`#ffffff`), providing sharp luminance contrast.

### 3. Centerpiece Brand Logo
- Sized responsively at 15vw (`w-[15vw]`), with safety clamps (`min-w-[140px] max-w-[280px]`).
- Uses the official white inverted mark (`/logo-dark.png`) rendered with `h-auto object-contain`.
- Positioned on a dedicated z index layer (`z-20`) above the stripes (`z-10`), centered optically within the viewport overlay.

---

## Geometric Alignment and Coordinate Mathematics

To prevent off axis drift, the stripes and logo move strictly along a unified 30 degree vector relative to the screen plane:

1. **Angular Transformation**:
   The entire stripe container is rotated by 30 degrees (`transform: rotate(30deg)`). This aligns the local Y axis of the stripe container with the 30 degree diagonal path.
2. **Translation Coordinates**:
   - Entrance starting position: `translate3d(0, -180vh, 0)` along the rotated local axis.
   - Centered rest position: `translate3d(0, 0, 0)`.
   - Exit ending position: `translate3d(0, 180vh, 0)` along the identical local axis.
3. **Logo Vector**:
   The brand logo operates in unrotated screen space and translates along the matching trigonometric vector:
   - Entrance start: `translate3d(-60vw, -34.6vw, 0)` where $34.6 / 60 = \tan(30^\circ) \approx 0.577$.
   - Centered rest: `translate3d(0, 0, 0)`.
   - Exit end: `translate3d(60vw, 34.6vw, 0)`.

---

## Motion Choreography and State Machine

The presentation is orchestrated by an internal finite state machine:
`'idle' -> 'entering' -> 'holding' -> 'exiting' -> 'completed'`

### Timeline Specifications

| Motion Phase | Duration | Easing Curve | Stagger Offset |
| :--- | :--- | :--- | :--- |
| **Phase 1: Entrance** | 500 milliseconds | `cubic-bezier(0.16, 1, 0.3, 1)` (Expo Out) | 60 milliseconds per stripe |
| **Phase 2: Center Dwell** | 200 milliseconds minimum | Locked at center | None |
| **Phase 3: Exit** | 450 milliseconds | `cubic-bezier(0.7, 0, 0.84, 0)` (Expo In) | 60 milliseconds per stripe |

### Stagger Sequencing
- Stripe 1 (Accent): Enters at 0ms, exits at 0ms.
- Stripe 2 (Primary): Enters at 60ms, exits at 60ms.
- Stripe 3 (Executive Gold): Enters at 120ms, exits at 120ms.
- Stripe 4 (Diamond White): Enters at 180ms, exits at 180ms.
- Brand Logo: Enters alongside Stripe 2 at 60ms, settles at center, holds during the 200ms dwell, and accelerates out starting at 60ms.

### Network Latency Handling
1. **Fast Navigation (<100ms)**:
   The state machine enforces an anti flicker minimum duration of 750 milliseconds, ensuring the entrance and 200ms hold complete cleanly before the exit sequence begins.
2. **Slow Streaming (>2000ms)**:
   If data streaming exceeds the entrance duration, the state machine remains locked in the `'holding'` state with a gentle ambient luminosity pulse until the route resolves, after which the 200ms dwell completes and the exit initiates.

### Reduced Motion Mode
When the user system requests `prefers-reduced-motion: reduce`:
- Diagonal translation shifts and 30 degree rotations are completely bypassed.
- The overlay gently cross fades via opacity (`0` to `1` on mount, `1` to `0` on exit) over 250 milliseconds.
- The brand logo rests stationary in the center without movement.

---

## Next.js 15 and React 19 Architecture

### 1. The Suspense Tearing Challenge
In Next.js 15, route level `loading.tsx` files are mounted within a React 19 `<Suspense>` boundary. The exact millisecond server components finish streaming, React unmounts the fallback DOM tree immediately. Any exit animation running inside `loading.tsx` would be abruptly terminated.

### 2. The Decoupled Coordinator Architecture
To ensure seamless exit animations across route transitions:
- `LoadingProvider` is mounted at the root level inside `apps/web/src/app/layout.tsx`. It intercepts client route changes using Next.js `usePathname()` and `useSearchParams()`.
- When navigation begins, `LoadingProvider` triggers the full entrance, hold, and exit animation cycle.
- The fallback `loading.tsx` files inside `apps/web/src/app/loading.tsx` and `apps/web/src/app/(public)/loading.tsx` render the initial dark wine canvas and entering stripes immediately, ensuring instant visual continuity before the root provider coordinates the exit.

---

## Component Architecture and Contracts

### 1. Presentation Component: `CinematicLoadingScreen.tsx`

Located at `apps/web/src/components/ui/CinematicLoadingScreen.tsx`.

```typescript
export interface CinematicLoadingScreenProps {
  /**
   * Whether the loading overlay is currently active.
   * Defaults to true.
   */
  isLoading?: boolean;

  /**
   * Callback invoked when the exit animation finishes and DOM can unmount.
   */
  onAnimationComplete?: () => void;

  /**
   * Custom duration override in milliseconds for the middle dwell.
   * Defaults to 200ms.
   */
  dwellDurationMs?: number;

  /**
   * Optional manual state override for testing or storybooks.
   */
  forcedState?: 'entering' | 'holding' | 'exiting';

  /**
   * Additional CSS classes applied to root container.
   */
  className?: string;
}
```

Container Semantics:
- Root element renders with `role="status"`, `aria-live="polite"`, `aria-busy={isLoading}`.
- Sets the HTML `inert` attribute while active to block tab focus and click events on underlying content.

### 2. Context Provider and Hook: `LoadingProvider.tsx`

Located at `apps/web/src/components/ui/LoadingProvider.tsx`.

```typescript
export interface LoadingContextValue {
  isLoading: boolean;
  showLoading: (options?: { minDurationMs?: number }) => void;
  hideLoading: () => void;
}

export function useLoadingScreen(): LoadingContextValue;

export function LoadingProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element;
```

---

## Acceptance Criteria

- **AC-1 Color Accuracy**: The four stripes display the exact specified palette in order: Accent (`#ed70bd`), Primary (`#ca2484`), Executive Gold (`#f59e0b`), and Diamond White (`#ffffff`).
- **AC-2 Stripe Geometry**: Each stripe maintains a width of 60px, arranged with 16px gaps, inclined at an angle of 30 degrees across desktop and mobile screens.
- **AC-3 Diagonal Trajectory**: The stripes enter from the top left along the 30 degree axis, align in the middle, and exit toward the bottom right without clipping or gap artifacts.
- **AC-4 Middle Hold**: The animation pauses at the screen center for a minimum of 200 milliseconds before initiating the exit sequence.
- **AC-5 Logo Integration**: The brand logo scales to 15vw with safety clamps (`min-w-[140px] max-w-[280px]`), slides into the screen center along the matching 30 degree vector, holds alongside the stripes, and follows the stripes out along the bottom right diagonal.
- **AC-6 Screen Overlay**: The background completely covers the viewport in a dark shade of the brand primary (`#47072a`), preventing glimpse of unloaded DOM elements.
- **AC-7 Reduced Motion Accessibility**: When `prefers-reduced-motion` is active, all directional translations and spring oscillations are bypassed in favor of a smooth opacity fade.
- **AC-8 60 FPS Performance**: Animations strictly manipulate `transform` and `opacity`, avoiding layout reflow triggers on `width`, `height`, `top`, or `margin`.
- **AC-9 React 19 Suspense Safety**: Route transitions managed via `LoadingProvider` complete their exit animation cleanly without tearing or abrupt DOM removal.
- **AC-10 Focus Isolation**: While active, the overlay traps focus and applies `inert` to background elements, ensuring keyboard and screen reader accessibility.

---

## Implementation Plan

1. **Phase 1: CSS Animation Tokens**
   - Declare `@keyframes stripeSlideIn`, `@keyframes stripeSlideOut`, and `@keyframes logoCinematic` inside `apps/web/src/app/globals.css`.
   - Configure spring easing curves and 30 degree transform constants in Tailwind v4 `@theme`.
2. **Phase 2: Component Engineering**
   - Build `apps/web/src/components/ui/CinematicLoadingScreen.tsx` with responsive 15vw logo, 60px stripes, and internal state machine.
   - Build `apps/web/src/components/ui/LoadingProvider.tsx` with pathname detection and route transition coordination.
3. **Phase 3: Route Integration**
   - Embed `LoadingProvider` in `apps/web/src/app/layout.tsx`.
   - Update `apps/web/src/app/loading.tsx` and `apps/web/src/app/(public)/loading.tsx` to render the initial cinematic canvas.
4. **Phase 4: Verification and Quality Assurance**
   - Validate 60 FPS transform performance in DevTools.
   - Verify `prefers-reduced-motion` behavior.
   - Execute `pnpm typecheck` and `pnpm test` across all workspaces.
