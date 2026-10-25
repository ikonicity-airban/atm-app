'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider.tsx';
import { Button } from '../ui/Button.tsx';
import { Icon } from '../ui/Icon.tsx';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`w-10 h-10 rounded-full border border-border bg-card/40 backdrop-blur-md flex items-center justify-center opacity-0 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size={showLabel ? 'sm' : 'icon'}
      onClick={toggleTheme}
      className={`rounded-full min-h-8 min-w-8 gap-2 border border-border/90 p-2 hover:bg-muted ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Icon
        icon={isDark ? Sun : Moon}
        size="default"
        className={isDark ? 'text-amber-400 fill-amber-400' : 'text-purple-900/60 fill-gray-200'}
      />
      {showLabel && (
        <span className="text-xs font-semibold text-foreground">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </Button>
  );
}
