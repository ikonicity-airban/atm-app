import React from 'react';
import { BRAND } from '@atm/shared';

interface LogoProps {
  variant?: 'full' | 'mark';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ variant = 'full', className = '', size = 'md' }: LogoProps) {
  if (variant === 'mark') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <img
          src="/favicon.ico"
          alt="Ascent Transport Management Mark"
          className="w-9 h-9 object-contain"
          width={36}
          height={36}
          onError={(e) => {
            // Fallback to stylized monogram if asset is delayed
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src="/logo.svg"
        alt="Ascent Transport Management (ATM Nigeria)"
        className={`object-contain ${
          size === 'sm' ? 'h-7 w-auto' : size === 'lg' ? 'h-11 w-auto' : 'h-9 w-auto'
        }`}
        height={36}
        onError={(e) => {
          // If SVG fails to load, gracefully fallback to text branding
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
    </div>
  );
}

