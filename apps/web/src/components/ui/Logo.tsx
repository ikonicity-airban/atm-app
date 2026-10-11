import React from 'react';
import { BRAND } from '@atm/shared';

interface LogoProps {
  variant?: 'full' | 'mark';
  className?: string;
}

export function Logo({ variant = 'full', className = '' }: LogoProps) {
  if (variant === 'mark') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-9 h-9 rounded bg-[#ca2484] flex items-center justify-center text-white font-black text-xl tracking-tighter shadow-sm">
          A
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Mark with car silhouette icon */}
      <div className="w-10 h-10 rounded-lg bg-[#ca2484] flex items-center justify-center text-white font-black text-xl tracking-tighter shadow-sm relative overflow-hidden">
        <span>ATM</span>
      </div>
      <div>
        <span className="font-extrabold text-slate-900 tracking-tight text-lg leading-none block">
          Ascent Transport
        </span>
        <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase block mt-1">
          {BRAND.tagline}
        </span>
      </div>
    </div>
  );
}
