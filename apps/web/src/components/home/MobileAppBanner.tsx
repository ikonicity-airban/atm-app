'use client';

import React from 'react';
import { Smartphone, CheckCircle2, MessageSquare, Download, Sparkles } from 'lucide-react';
import { BRAND } from '@atm/shared';

export function MobileAppBanner({ onNavigate }: { onNavigate?: (path: string) => void }) {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#120324] via-[#2a0e5b] to-[#ca2484] text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-purple-500/30">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          {/* Left Text & Features */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-pink-200 text-xs font-normal border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-pink-300" />
              <span>Mobile First Progressive Web App</span>
            </div>

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
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="pt-4 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => onNavigate ? onNavigate('/trips') : (window.location.href = '/trips')}
                className="px-6 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-normal text-xs sm:text-sm shadow-xl transition-transform hover:scale-105 flex items-center gap-2 cursor-pointer min-h-[44px]"
              >
                <Smartphone className="w-4 h-4 text-[#ca2484]" />
                <span>Book on Mobile Web</span>
              </button>

              <a
                href={`https://wa.me/${BRAND.contactPhones[0].replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-normal text-xs sm:text-sm shadow-xl transition-transform hover:scale-105 flex items-center gap-2 cursor-pointer min-h-[44px]"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Dispatch</span>
              </a>
            </div>
          </div>

          {/* Right Smartphone Showcase Visual */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[280px] sm:max-w-[320px] bg-slate-950 rounded-[2.5rem] p-3 border-4 border-white/20 shadow-2xl">
              {/* Phone Camera Notch */}
              <div className="w-28 h-4 bg-slate-900 rounded-full mx-auto mb-3" />

              {/* Screen Mockup */}
              <div className="bg-white rounded-2xl p-4 text-slate-900 space-y-4 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-[#ca2484]">ASCENT MOBILE</span>
                  <span className="text-emerald-600">● LIVE</span>
                </div>

                <div className="p-3 bg-purple-50 rounded-xl space-y-1.5 border border-purple-100">
                  <div className="text-[10px] text-purple-700 font-bold uppercase">Next Departure</div>
                  <div className="text-sm font-extrabold text-slate-900">Enugu → Abuja Express</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                    <span>Seat 2A (Window)</span>
                    <span className="font-bold text-[#ca2484]">06:30 AM</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Digital Gate Pass</div>
                  <div className="w-20 h-20 mx-auto bg-white rounded-lg p-1.5 border border-slate-200 flex items-center justify-center">
                    <Smartphone className="w-12 h-12 text-[#ca2484]" />
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">Scan at terminal gate</div>
                </div>

                <button
                  type="button"
                  className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  View Trip Details
                </button>
              </div>

              {/* Phone Home Bar */}
              <div className="w-24 h-1 bg-white/40 rounded-full mx-auto mt-3" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
