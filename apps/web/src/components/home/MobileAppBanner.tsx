'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Smartphone, CheckCircle2, MessageSquare } from 'lucide-react';
import { BRAND } from '@atm/shared';
import { Icon } from '@/components/ui/Icon';

const SamsungPhoneCanvas = dynamic(
  () => import('./SamsungPhoneCanvas').then((mod) => mod.SamsungPhoneCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[460px] sm:h-[540px] lg:h-[600px] flex justify-center items-center">
        <div className="w-10 h-10 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
      </div>
    ),
  }
);

export function MobileAppBanner({ onNavigate }: { onNavigate?: (path: string) => void }) {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 @container/section">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#120324] via-[#2a0e5b] to-[#ca2484] text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-purple-500/30">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 @lg/section:grid-cols-12 gap-10 items-center relative z-10">
          {/* Left Text & Features */}
          <div className="@lg/section:col-span-7 space-y-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-pink-300 block">
              Mobile First Progressive Web App
            </span>

            <h2 className="text-2xl sm:text-4xl font-heading font-bold text-white tracking-tight leading-tight text-balance">
              Take Ascent Travel Everywhere
            </h2>

            <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed max-w-xl text-pretty font-normal">
              Access your digital boarding pass, track waybill parcels, and receive departure gate announcements directly in your phone browser without installing heavy apps.
            </p>

            <div className="space-y-3 pt-2">
              {[
                'Paperless QR boarding pass available offline at the departure terminal',
                'Live SMS updates and terminal dispatch announcements',
                'Fast seat hold with instant bank transfer and Paystack checkout',
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 text-xs sm:text-sm text-purple-100 font-normal">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Icon icon={CheckCircle2} size="xs" className="text-emerald-400" />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTAs with Tactile Spring Micro-Interactions */}
            <div className="pt-4 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => onNavigate ? onNavigate('/trips') : (window.location.href = '/trips')}
                className="px-6 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-normal text-xs sm:text-sm shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center gap-2 cursor-pointer min-h-[44px] motion-reduce:transform-none"
              >
                <Icon icon={Smartphone} size="sm" className="text-[#ca2484]" />
                <span>Book on Mobile Web</span>
              </button>

              <a
                href={`https://wa.me/${BRAND.contactPhones[0].replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-normal text-xs sm:text-sm shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center gap-2 cursor-pointer min-h-[44px] motion-reduce:transform-none"
              >
                <Icon icon={MessageSquare} size="sm" className="text-white" />
                <span>WhatsApp Dispatch</span>
              </a>
            </div>
          </div>

          {/* Right 3D Smartphone Showcase Visual */}
          <div className="@lg/section:col-span-5 flex justify-center items-center relative min-h-[440px] sm:min-h-[520px]">
            {/* Ambient Radial Glow behind the 3D phone */}
            <div className="absolute inset-0 bg-radial from-pink-500/25 via-purple-600/10 to-transparent blur-2xl pointer-events-none -z-10" />

            <div className="relative w-full flex justify-center items-center">
              {/* 3D Samsung S26 Ultra Canvas with scroll docking animation */}
              <SamsungPhoneCanvas />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
