'use client';

import React from 'react';
import { ArrowRight, Phone, MessageSquare, ShieldCheck, Clock } from 'lucide-react';
import { BRAND } from '@atm/shared';
import { Icon } from '@/components/ui/Icon';

export function ClosingCta({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const phone = BRAND.contactPhones[0];
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 @container/section">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#2a0e5b] via-[#8b2ccb] to-[#ca2484] text-white p-8 sm:p-14 text-center shadow-2xl border border-white/10 space-y-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-pink-300 block">
          Daily Fixed Departures Across Nigeria
        </span>

        <h2 className="text-2xl sm:text-4xl font-heading font-bold text-white tracking-tight leading-tight max-w-3xl mx-auto text-balance">
          Ready to Experience Executive 5 Seat Travel?
        </h2>

        <p className="text-sm sm:text-base text-purple-100 max-w-xl mx-auto leading-relaxed text-pretty font-normal">
          Select your departure city, choose your seat on the vehicle layout, and reserve with zero roadside delays.
        </p>

        <div className="pt-2 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate ? onNavigate('/trips') : (window.location.href = '/trips')}
            className="px-7 py-3 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-normal text-xs sm:text-sm shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center gap-2 cursor-pointer min-h-[44px] motion-reduce:transform-none"
          >
            <span>Book a Seat Now</span>
            <Icon icon={ArrowRight} size="sm" className="text-[#ca2484]" />
          </button>

          <a
            href={`https://wa.me/${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-normal text-xs sm:text-sm shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center gap-2 cursor-pointer min-h-[44px] motion-reduce:transform-none"
          >
            <Icon icon={MessageSquare} size="sm" className="text-white" />
            <span>WhatsApp Dispatch</span>
          </a>

          <a
            href={`tel:${phone}`}
            className="px-6 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-normal text-xs sm:text-sm backdrop-blur-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center gap-2 cursor-pointer min-h-[44px] motion-reduce:transform-none"
          >
            <Icon icon={Phone} size="sm" className="text-white" />
            <span>Call {phone}</span>
          </a>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-purple-200">
          <span className="flex items-center gap-1.5">
            <Icon icon={ShieldCheck} size="sm" className="text-emerald-400" />
            <span>15-Minute Seat Hold</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Icon icon={ShieldCheck} size="sm" className="text-emerald-400" />
            <span>Instant Paystack Checkout</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Icon icon={ShieldCheck} size="sm" className="text-emerald-400" />
            <span>SMS &amp; Digital QR Pass</span>
          </span>
        </div>
      </div>
    </section>
  );
}
