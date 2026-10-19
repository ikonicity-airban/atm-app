'use client';

import React, { useState } from 'react';
import { QrCode, ShieldCheck, ArrowRight, Plus, Minus, Check, Sparkles } from 'lucide-react';
import { formatNaira } from '@atm/shared';

interface CheckoutRoute {
  label: string;
  from: string;
  to: string;
  fromCode: string;
  toCode: string;
  baseFareKobo: number;
}

const CHECKOUT_ROUTES: CheckoutRoute[] = [
  {
    label: 'Enugu (Ogui) → Abuja (Utako)',
    from: 'Enugu',
    to: 'Abuja',
    fromCode: 'ENU',
    toCode: 'ABV',
    baseFareKobo: 3200000,
  },
  {
    label: 'Lagos (Jibowu) → Enugu (Ogui)',
    from: 'Lagos',
    to: 'Enugu',
    fromCode: 'LOS',
    toCode: 'ENU',
    baseFareKobo: 3800000,
  },
  {
    label: 'Abuja (Utako) → Enugu (Ogui)',
    from: 'Abuja',
    to: 'Enugu',
    fromCode: 'ABV',
    toCode: 'ENU',
    baseFareKobo: 3200000,
  },
  {
    label: 'Lagos (Ajah) → Owerri (Control Post)',
    from: 'Lagos',
    to: 'Owerri',
    fromCode: 'LOS',
    toCode: 'QOW',
    baseFareKobo: 3600000,
  },
  {
    label: 'Owerri (Control Post) → Abuja (Utako)',
    from: 'Owerri',
    to: 'Abuja',
    fromCode: 'QOW',
    toCode: 'ABV',
    baseFareKobo: 3400000,
  },
];

const TERMINAL_SERVICE_FEE_KOBO = 50000; // ₦500 per passenger

export function SmartTicketingCheckout({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const currentRoute = CHECKOUT_ROUTES[selectedRouteIndex];

  // Pure integer kobo calculations
  const subtotalKobo = currentRoute.baseFareKobo * passengerCount;
  const feesKobo = TERMINAL_SERVICE_FEE_KOBO * passengerCount;
  const totalKobo = subtotalKobo + feesKobo;

  const handleProceed = () => {
    const url = `/trips?from=${encodeURIComponent(currentRoute.from)}&to=${encodeURIComponent(
      currentRoute.to
    )}&date=${encodeURIComponent(selectedDate)}&passengers=${passengerCount}`;

    if (onNavigate) {
      onNavigate(url);
    } else {
      window.location.href = url;
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-3">
        <span className="text-xs font-normal uppercase tracking-wider text-primary bg-primary/10 px-3.5 py-1 rounded-full inline-block">
          Digital Ticketing &amp; Direct Reservation
        </span>
        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight text-balance">
          Smart Ticketing &amp; Instant Fare Calculator
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty font-normal">
          Transparent integer pricing with zero hidden surcharges. Receive your verified digital pass immediately after booking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Authentic Digital Boarding Pass Graphic */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md bg-card/75 backdrop-blur-xl rounded-3xl shadow-xl border border-border overflow-hidden relative">
            {/* Top Pass Header */}
            <div className="bg-gradient-to-r from-[#2a0e5b] to-[#ca2484] p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold tracking-widest uppercase">
                  Ascent Boarding Pass
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-[10px] font-black uppercase text-white shadow-2xs">
                  Confirmed Seat
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-black">{currentRoute.fromCode}</span>
                  <div className="text-xs text-purple-200 font-semibold">{currentRoute.from} Terminal</div>
                </div>
                <div className="flex flex-col items-center px-4">
                  <span className="text-[10px] font-bold text-pink-300 uppercase">Non-stop</span>
                  <div className="w-20 sm:w-28 h-0.5 bg-white/40 my-1 relative">
                    <div className="w-2 h-2 rounded-full bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-[10px] text-purple-200 font-mono">5 Seat Sienna</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black">{currentRoute.toCode}</span>
                  <div className="text-xs text-purple-200 font-semibold">{currentRoute.to} Hub</div>
                </div>
              </div>
            </div>

            {/* Perforated Divider */}
            <div className="relative py-2 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <div className="w-4 h-8 bg-slate-100 dark:bg-slate-950 rounded-r-full -ml-2 border-r border-slate-200 dark:border-slate-800" />
              <div className="flex-1 border-b-2 border-dashed border-slate-300 dark:border-slate-700 mx-2" />
              <div className="w-4 h-8 bg-slate-100 dark:bg-slate-950 rounded-l-full -mr-2 border-l border-slate-200 dark:border-slate-800" />
            </div>

            {/* Pass Passenger Details */}
            <div className="p-6 space-y-5 bg-white dark:bg-slate-900">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Passenger
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    Dr. Chidi Okonkwo
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Seat Assignment
                  </span>
                  <span className="font-bold text-[#ca2484]">
                    Seat 2A (Window)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Departure Time
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    06:30 AM WAT
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Vehicle Standard
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    Executive Sienna
                  </span>
                </div>
              </div>

              {/* QR Code and Validation Footnote */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold">
                    PASS NO: ATM-{currentRoute.fromCode}-{currentRoute.toCode}-8492
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Scan at terminal gate for immediate vehicle boarding
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified ATM Digital Ticket</span>
                  </div>
                </div>

                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-xl p-2 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-16 h-16 text-slate-900 dark:text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Quick Checkout & Fare Calculator */}
        <div className="lg:col-span-6 bg-card/75 backdrop-blur-xl text-card-foreground rounded-3xl p-6 sm:p-8 border border-border shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-heading font-semibold text-foreground">
                Live Fare Calculator
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Calculate total kobo fare and reserve your seat instantly
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-normal">
              Instant Hold
            </span>
          </div>

          {/* Form Controls */}
          <div className="space-y-4">
            {/* Corridor Select */}
            <div>
              <label className="text-xs font-medium font-heading text-foreground block mb-1.5">
                Select Corridor
              </label>
              <select
                value={selectedRouteIndex}
                onChange={(e) => setSelectedRouteIndex(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border text-xs sm:text-sm font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[48px]"
              >
                {CHECKOUT_ROUTES.map((route, idx) => (
                  <option key={route.label} value={idx}>
                    {route.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Travel Date & Passengers Count Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium font-heading text-foreground block mb-1.5">
                  Departure Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border text-xs sm:text-sm font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[48px]"
                />
              </div>

              <div>
                <label className="text-xs font-medium font-heading text-foreground block mb-1.5">
                  Passengers (Max 5)
                </label>
                <div className="flex items-center justify-between px-3 py-1.5 rounded-2xl bg-muted/50 border border-border min-h-[48px]">
                  <button
                    type="button"
                    onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                    disabled={passengerCount <= 1}
                    className="w-8 h-8 rounded-lg bg-card text-foreground flex items-center justify-center disabled:opacity-30 cursor-pointer shadow-xs border border-border"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-medium text-foreground">
                    {passengerCount} {passengerCount === 1 ? 'Seat' : 'Seats'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPassengerCount(Math.min(5, passengerCount + 1))}
                    disabled={passengerCount >= 5}
                    className="w-8 h-8 rounded-lg bg-card text-foreground flex items-center justify-center disabled:opacity-30 cursor-pointer shadow-xs border border-border"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Fare Summary Breakdown Box */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Base Fare ({passengerCount} × {formatNaira(currentRoute.baseFareKobo)})</span>
              <span className="font-medium text-foreground">{formatNaira(subtotalKobo)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Terminal &amp; Luggage Fee ({passengerCount} × {formatNaira(TERMINAL_SERVICE_FEE_KOBO)})</span>
              <span className="font-medium text-foreground">{formatNaira(feesKobo)}</span>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <div>
                <span className="text-xs font-medium font-heading text-foreground block">
                  Total Fare
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                  Guaranteed integer kobo fare
                </span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-primary">
                {formatNaira(totalKobo)}
              </span>
            </div>
          </div>

          {/* Action CTA Button */}
          <button
            type="button"
            onClick={handleProceed}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#2a0e5b] to-[#ca2484] hover:opacity-95 text-white font-normal text-xs sm:text-sm shadow-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
          >
            <span>Hold Seat &amp; Proceed to Trips</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
