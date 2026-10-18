'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider.tsx';

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
        className={`w-11 h-11 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex items-center justify-center opacity-0 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 backdrop-blur-md text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:scale-105 ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 fill-amber-400 transition-transform" />
      ) : (
        <Moon className="w-4 h-4 text-purple-600 fill-purple-600 transition-transform" />
      )}
      {showLabel && (
        <span className="text-xs font-semibold">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}
