import React from 'react';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Truck, Shield, PhoneCall } from 'lucide-react';
import { BRAND } from '@atm/shared';

export const metadata: Metadata = {
  title: 'Driver Highway Portal | Ascent Transport Management',
  description: 'Commercial driver portal for roadside manifest inspection, boarding, and trip milestones.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-[#ca2484] selection:text-white">
      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <Link href="/driver" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#ca2484] flex items-center justify-center font-black text-white text-base shadow-xs">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold tracking-tight text-white leading-tight">
              ATM Driver
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              Commercial Fleet Operations
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <a
            href="tel:+2349070000625"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/60 border border-red-850 hover:bg-red-900/60 text-red-200 rounded-lg text-xs font-bold min-h-[44px]"
            title="Emergency Safety Line"
          >
            <PhoneCall className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Dispatch Safety</span>
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-5 flex flex-col">
        {children}
      </main>

      {/* Bottom Emergency & FRSC Advisory Strip */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-3 px-4 text-center text-[11px] text-slate-400">
        <p className="flex items-center justify-center gap-1.5">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>FRSC Statutory Manifest Verification Enabled</span>
        </p>
      </footer>
    </div>
  );
}
