'use client';

import React, { useState } from 'react';
import { PageShell } from '@/components/layout/Templates.tsx';
import { formatNaira, calculateCancellationFee, DEFAULT_CANCELLATION_POLICY } from '@atm/shared';
import {
  Clock,
  ShieldCheck,
  Wallet,
  CreditCard,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export default function CancelBookingPage(props?: any) {
  const onNavigate = (props as { onNavigate?: (path: string) => void } | undefined)?.onNavigate;
  const [fareNaira, setFareNaira] = useState<number>(32000);
  const [selectedHours, setSelectedHours] = useState<number>(28);

  const navigate = (path: string) => {
    if (onNavigate) onNavigate(path);
    else if (typeof window !== 'undefined') window.location.href = path;
  };

  // Compute live estimation in integer kobo
  const fareKobo = Math.max(0, Math.round(fareNaira * 100));
  const dummyDeparture = new Date(Date.now() + selectedHours * 3600 * 1000);
  const calculation = calculateCancellationFee(
    DEFAULT_CANCELLATION_POLICY,
    dummyDeparture,
    new Date(),
    fareKobo
  );

  return (
    <PageShell
      width="compact"
      density="compact"
      title="Cancellation & Refund Calculator"
      description="Estimate your refund and understand transparent tiered cancellation deductions across Ascent Transport corridors."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Cancellation & Refunds' },
      ]}
    >
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Top Highlight Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl">
          {/* Specular top highlight */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/40 to-transparent" />

          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-xs font-bold uppercase tracking-wider text-rose-300">
              <Clock className="h-3.5 w-3.5" />
              Transparent Policy Rules
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white text-balance">
              Fair, Tiered Refunds Based on Departure Notice
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed text-pretty">
              Ascent operates dedicated 5 seat Toyota Sienna vehicles. Early notice allows released seats to return to available inventory for fellow travelers on your route.
            </p>
          </div>
        </div>

        {/* Interactive Estimator Surface */}
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 text-balance">
              Interactive Refund Estimator
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Adjust your ticket fare and departure window to preview fee deductions and net refund return.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Fare and Time Window Inputs */}
            <div className="space-y-5">
              <div>
                <label htmlFor="fare-input" className="block text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                  Ticket Fare (₦ per seat)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-sm font-bold text-slate-500">
                    ₦
                  </span>
                  <input
                    id="fare-input"
                    type="number"
                    min="1000"
                    step="500"
                    value={fareNaira}
                    onChange={(e) => setFareNaira(Number(e.target.value) || 0)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 pl-8 pr-4 text-sm font-semibold text-slate-900 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                  Hours Remaining Before Departure
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '> 24 Hours', hours: 30, desc: '10% fee' },
                    { label: '6 to 24 Hours', hours: 14, desc: '25% fee' },
                    { label: '2 to 6 Hours', hours: 4, desc: '50% fee' },
                    { label: '< 2 Hours', hours: 1, desc: 'Non refundable' },
                  ].map((tier) => (
                    <button
                      key={tier.label}
                      type="button"
                      onClick={() => setSelectedHours(tier.hours)}
                      className={`min-h-[44px] p-3 rounded-xl border text-left transition-all ${
                        selectedHours === tier.hours
                          ? 'border-accent-600 bg-accent-50/60 ring-2 ring-accent-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-900">{tier.label}</p>
                      <p className="text-[11px] text-slate-500">{tier.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Calculation Output Card */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-6 space-y-4">
              <div className="flex items-center justify-between text-xs uppercase font-bold text-slate-500 tracking-wider">
                <span>Calculated Estimate</span>
                <span className="font-bold text-rose-600">
                  {calculation.feePercentageApplied}% deduction
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Gross Ticket Fare</span>
                  <span className="font-semibold text-slate-900">{formatNaira(fareKobo)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Cancellation Deduction</span>
                  <span className="font-semibold text-rose-600">-{formatNaira(calculation.cancellationFeeKobo)}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center font-bold">
                  <span className="text-sm text-slate-900">Estimated Net Refund</span>
                  <span className="text-xl text-emerald-700">{formatNaira(calculation.refundAmountKobo)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 text-pretty pt-2">
                {calculation.reason}
              </p>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              Have your 6 character reference code and booked phone number ready.
            </p>
            <button
              type="button"
              onClick={() => navigate('/manage')}
              className="min-h-[44px] px-6 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-sm font-bold shadow transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              Manage &amp; Cancel Your Booking
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Disbursement Options Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Wallet className="h-5 w-5 text-accent-600" />
              Instant ATM Store Credit
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-pretty">
              Credited directly to your phone number wallet immediately. Use your credit on any corridor with zero bank wait times.
            </p>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              Recommended for rebooking
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <CreditCard className="h-5 w-5 text-slate-700" />
              Paystack Card Reversal
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-pretty">
              Automated reversal dispatched via Paystack gateway directly back to your original debit card or bank account within 3 to 5 business days.
            </p>
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              Original payment source
            </span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
