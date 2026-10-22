'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useTransition,
} from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { CinematicLoadingScreen } from './CinematicLoadingScreen.tsx';

export interface LoadingContextValue {
  isLoading: boolean;
  showLoading: (options?: { minDurationMs?: number }) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function useLoadingScreen(): LoadingContextValue {
  const context = useContext(LoadingContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    return {
      isLoading: false,
      showLoading: () => {},
      hideLoading: () => {},
    };
  }
  return context;
}

export function LoadingProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevRouteRef = useRef<string>('');
  const isFirstMountRef = useRef<boolean>(true);
  const [, startTransition] = useTransition();

  const showLoading = useCallback((options?: { minDurationMs?: number }) => {
    setIsVisible(true);
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setIsVisible(false);
    setIsLoading(false);
  }, []);

  // Track route transitions across public funnels
  useEffect(() => {
    const currentRoute = `${pathname}?${searchParams?.toString() || ''}`;

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      prevRouteRef.current = currentRoute;
      return;
    }

    if (prevRouteRef.current !== currentRoute) {
      prevRouteRef.current = currentRoute;
      // Start transition and trigger route loading overlay
      startTransition(() => {
        setIsVisible(true);
        setIsLoading(true);
      });

      // Allow page render to settle before initiating exit sequence
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
      {isVisible && (
        <CinematicLoadingScreen
          isLoading={isLoading}
          onAnimationComplete={handleAnimationComplete}
        />
      )}
    </LoadingContext.Provider>
  );
}
