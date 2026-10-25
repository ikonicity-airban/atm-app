'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from './ThemeProvider.tsx';
import { Button } from '../ui/Button.tsx';
import { Icon } from '../ui/Icon.tsx';

export interface ThemeToggleProps {
  className?: string;
  variant?: 'dropdown' | 'segmented' | 'button';
  showLabel?: boolean;
}

export function ThemeToggle({
  className = '',
  variant = 'dropdown',
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-full border border-border bg-card/40 backdrop-blur-md flex items-center justify-center opacity-0 ${className}`}
        aria-hidden="true"
      />
    );
  }

  // 1. Mobile 3-option Segmented Control for sidebar drawer
  if (variant === 'segmented') {
    const options: Array<{ key: 'light' | 'dark' | 'system'; label: string; icon: typeof Sun }> = [
      { key: 'light', label: 'Light', icon: Sun },
      { key: 'dark', label: 'Dark', icon: Moon },
      { key: 'system', label: 'System', icon: Monitor },
    ];

    return (
      <div className={`inline-flex w-full p-1 rounded-xl bg-muted/60 border border-border/80 ${className}`}>
        {options.map((opt) => {
          const isActive = theme === opt.key;
          const OptIcon = opt.icon;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setTheme(opt.key)}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[38px] cursor-pointer ${
                isActive
                  ? 'bg-card text-foreground shadow-xs border border-border font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
              aria-pressed={isActive}
            >
              <OptIcon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // 2. Desktop Dropdown Menu
  const isDark = resolvedTheme === 'dark';
  const CurrentIcon = theme === 'system' ? Monitor : isDark ? Sun : Moon;

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <Button
        variant="ghost"
        size={showLabel ? 'sm' : 'icon'}
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full min-h-8 min-w-8 gap-2 border border-border/90 p-2 hover:bg-muted"
        aria-label="Select color theme"
        aria-expanded={isOpen}
      >
        <Icon
          icon={CurrentIcon}
          size="default"
          className={
            theme === 'system'
              ? 'text-primary'
              : isDark
              ? 'text-amber-400 fill-amber-400'
              : 'text-purple-900/60 fill-gray-200'
          }
        />
        {showLabel && (
          <span className="text-xs font-semibold text-foreground capitalize">
            {theme}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-36 p-1.5 rounded-2xl bg-card text-card-foreground border border-border shadow-xl z-50 overflow-hidden"
          >
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  theme === 'light'
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </div>
                {theme === 'light' && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Dark</span>
                </div>
                {theme === 'dark' && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme('system');
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  theme === 'system'
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-primary" />
                  <span>System</span>
                </div>
                {theme === 'system' && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
