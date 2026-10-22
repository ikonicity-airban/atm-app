'use client';

import React, { useEffect, useState, useRef } from 'react';

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

type MotionPhase = 'entering' | 'holding' | 'exiting' | 'completed';

export function CinematicLoadingScreen({
  isLoading = true,
  onAnimationComplete,
  dwellDurationMs = 500,
  forcedState,
  className = '',
}: CinematicLoadingScreenProps) {
  const [phase, setPhase] = useState<MotionPhase>(forcedState || 'entering');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const mountTimeRef = useRef<number>(Date.now());
  const entranceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dwellTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect accessibility motion preferences
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Sync forcedState if provided
  useEffect(() => {
    if (forcedState) {
      setPhase(forcedState);
    }
  }, [forcedState]);

  // Handle phase transitions
  useEffect(() => {
    if (forcedState) return;

    // Total entrance duration includes last stripe stagger (500ms animation + 180ms delay = 680ms)
    const totalEntranceDuration = prefersReducedMotion ? 250 : 680;
    const totalExitDuration = prefersReducedMotion ? 250 : 630;

    if (phase === 'entering') {
      entranceTimeoutRef.current = setTimeout(() => {
        setPhase('holding');
      }, totalEntranceDuration);

      return () => {
        if (entranceTimeoutRef.current) clearTimeout(entranceTimeoutRef.current);
      };
    }

    if (phase === 'holding') {
      // If still loading, wait in holding state; once isLoading is false, trigger dwell and exit
      if (!isLoading) {
        // Enforce anti-flicker minimum visibility threshold of 750ms total
        const elapsed = Date.now() - mountTimeRef.current;
        const remainingThreshold = Math.max(0, 750 - elapsed);
        const effectiveDwell = Math.max(dwellDurationMs, remainingThreshold);

        dwellTimeoutRef.current = setTimeout(() => {
          setPhase('exiting');
        }, effectiveDwell);

        return () => {
          if (dwellTimeoutRef.current) clearTimeout(dwellTimeoutRef.current);
        };
      }
    }

    if (phase === 'exiting') {
      exitTimeoutRef.current = setTimeout(() => {
        setPhase('completed');
        onAnimationComplete?.();
      }, totalExitDuration);

      return () => {
        if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
      };
    }
  }, [phase, isLoading, dwellDurationMs, forcedState, prefersReducedMotion, onAnimationComplete]);

  // When isLoading flips to false while in holding phase, trigger exit
  useEffect(() => {
    if (forcedState) return;
    if (!isLoading && phase === 'holding') {
      const elapsed = Date.now() - mountTimeRef.current;
      const remainingThreshold = Math.max(0, 750 - elapsed);
      const effectiveDwell = Math.max(dwellDurationMs, remainingThreshold);

      dwellTimeoutRef.current = setTimeout(() => {
        setPhase('exiting');
      }, effectiveDwell);

      return () => {
        if (dwellTimeoutRef.current) clearTimeout(dwellTimeoutRef.current);
      };
    }
  }, [isLoading, phase, dwellDurationMs, forcedState]);

  if (phase === 'completed') {
    return null;
  }

  // Stripe definition
  const stripes = [
    { id: 'accent', color: '#ed70bd', delay: '0ms' },
    { id: 'primary', color: '#ca2484', delay: '100ms' },
    { id: 'gold', color: '#f59e0b', delay: '200ms' },
    { id: 'white', color: '#ffffff', delay: '300ms' },
  ];

  // Helper for stripe animation styles
  const getStripeStyle = (delay: string) => {
    if (prefersReducedMotion) return {};

    if (phase === 'entering') {
      return {
        animation: `stripeSlideIn 500ms cubic-bezier(0.16, 1, 0.3, 1) ${delay} reverse`,
        transform: 'translate3d(0, -180vh, 0)',
      };
    }
    if (phase === 'holding') {
      return {
        transform: 'translate3d(0, 0, 0)',
      };
    }
    if (phase === 'exiting') {
      return {
        animation: `stripeSlideOut 450ms cubic-bezier(0.7, 0, 0.84, 0) ${delay} reverse`,
        transform: 'translate3d(0, 0, 0)',
      };
    }
    return {};
  };

  // Helper for logo animation styles
  const getLogoStyle = () => {
    if (prefersReducedMotion) return {};

    if (phase === 'entering') {
      return {
        animation: 'logoSlideIn 500ms cubic-bezier(0.16, 1, 0.3, 1) 60ms forwards',
        transform: 'translate3d(-60vw, -34.6vw, 0) scale(0.92)',
        opacity: 0,
      };
    }
    if (phase === 'holding') {
      return {
        transform: 'translate3d(0, 0, 0) scale(1)',
        opacity: 1,
      };
    }
    if (phase === 'exiting') {
      return {
        animation: 'logoSlideOut 450ms cubic-bezier(0.7, 0, 0.84, 0) 60ms forwards',
        transform: 'translate3d(0, 0, 0) scale(1)',
        opacity: 1,
      };
    }
    return {};
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={isLoading}
      aria-label="Loading Ascent Transport Management"
      // @ts-expect-error React 19 inert HTML attribute
      inert=""
      className={`fixed inset-0 z-2000 overflow-hidden flex items-center justify-center select-none bg-[#240416] transition-opacity duration-300 ${phase === 'exiting' && prefersReducedMotion ? 'opacity-0' : 'opacity-100'
        } ${className}`}
    >
      {/* Visual background gradient in dark shade of primary */}
      <div className="absolute inset-0 bg-linear-to-br from-[#47072a] via-[#240416] to-[#14020c] opacity-98" />

      {/* Angled container holding the 4 stripes at 30 degrees */}
      {!prefersReducedMotion && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          style={{ transform: 'rotate(30deg)' }}
        >
          <div className="flex flex-row items-center justify-center gap-4 min-h-[260vh]">
            {stripes.map((stripe) => (
              <div
                key={stripe.id}
                style={{
                  backgroundColor: stripe.color,
                  ...getStripeStyle(stripe.delay),
                }}
                className="w-15 h-[260vh] shrink-0 rounded-xs shadow-2xl"
              />
            ))}
          </div>
        </div>
      )}

      {/* Brand Logo floating above the stripes */}
      <div
        className="relative z-20 flex flex-col items-center justify-center pointer-events-none"
        style={getLogoStyle()}
      >
        <img
          src="/logo-dark.png"
          alt="Ascent Transport Management (ATM Nigeria)"
          className="w-[15vw] min-w-35 max-w-70 h-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
        />
      </div>
    </div>
  );
}
