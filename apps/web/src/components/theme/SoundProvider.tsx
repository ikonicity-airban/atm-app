'use client';

import React, { useEffect } from 'react';
import { isSoundEnabled, playClickSound } from '../../lib/sound.ts';

export function SoundProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (!isSoundEnabled()) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest(
        'button, a, [role="button"], [role="tab"], [role="switch"], input[type="submit"], input[type="radio"], input[type="checkbox"]'
      );
      if (interactive) {
        playClickSound();
      }
    };

    window.addEventListener('click', handleGlobalClick, { capture: true, passive: true });
    return () => window.removeEventListener('click', handleGlobalClick, { capture: true });
  }, []);

  return <>{children}</>;
}
