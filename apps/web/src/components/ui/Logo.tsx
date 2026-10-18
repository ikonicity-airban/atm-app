import React from 'react';
import { BRAND } from '@atm/shared';

export interface LogoProps {
  variant?: 'full' | 'mark';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  themeMode?: 'light' | 'dark' | 'auto';
}

export function Logo({
  variant = 'full',
  className = '',
  size = 'md',
  themeMode = 'auto',
}: LogoProps) {
  const heightClass =
    size === 'sm'
      ? 'h-7'
      : size === 'lg'
      ? 'h-11'
      : size === 'xl'
      ? 'h-14'
      : 'h-9';

  if (variant === 'mark') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <img
          src="/favicon.svg"
          alt="Ascent Transport Management Mark"
          className={`${heightClass} w-auto object-contain rounded-xl`}
          width={40}
          height={40}
        />
      </div>
    );
  }

  // If explicitly light or dark
  if (themeMode === 'dark') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <img
          src="/logo-dark.svg"
          alt="Ascent Transport Management (ATM Nigeria)"
          className={`${heightClass} w-auto object-contain`}
          height={40}
        />
      </div>
    );
  }

  if (themeMode === 'light') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <img
          src="/logo.svg"
          alt="Ascent Transport Management (ATM Nigeria)"
          className={`${heightClass} w-auto object-contain`}
          height={40}
        />
      </div>
    );
  }

  // Automatic mode: show light logo on light theme, dark logo on dark theme
  return (
    <div className={`inline-flex items-center ${className}`}>
      <img
        src="/logo.svg"
        alt="Ascent Transport Management (ATM Nigeria)"
        className={`dark:hidden ${heightClass} w-auto object-contain`}
        height={40}
      />
      <img
        src="/logo-dark.svg"
        alt="Ascent Transport Management (ATM Nigeria)"
        className={`hidden dark:block ${heightClass} w-auto object-contain`}
        height={40}
      />
    </div>
  );
}
