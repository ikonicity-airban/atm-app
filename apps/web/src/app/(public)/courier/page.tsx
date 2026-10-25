'use client';

import React from 'react';
import { PageShell } from '@/components/layout/Templates';
import { CourierBookingForm } from '@/components/forms/courier/CourierBookingForm';
import { Icon } from '@/components/ui/Icon';
import { Truck, ShieldCheck, CreditCard, Package, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function CourierPage() {
  return (
    <PageShell
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Courier & Freight' },
      ]}
      width="compact"
      density="comfortable"
    >
      {/* Hero Intro Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight text-balance">
            Express Parcel &amp; Waybill Transit
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-2xl text-pretty leading-relaxed">
            Same-day terminal-to-terminal interstate freight across our active Nigerian corridors. Secure boot storage on executive Toyota Sienna departures.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="mt-4 flex flex-wrap gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs font-semibold text-foreground">
            <Icon icon={Truck} size="xs" className="text-primary" />
            <span>Same-Day Highway Transit</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs font-semibold text-foreground">
            <Icon icon={ShieldCheck} size="xs" className="text-emerald-600 dark:text-emerald-400" />
            <span>4-Digit SMS Collection OTP</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs font-semibold text-foreground">
            <Icon icon={CreditCard} size="xs" className="text-sky-600 dark:text-sky-400" />
            <span>Online or Counter Payment</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <CourierBookingForm />
        </div>

        {/* Quick Track Side Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Already sent a package?</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Track your parcel in real-time using your ATM-EXP code or recipient phone number.
              </p>
            </div>
            <Link
              href="/track"
              className="w-full min-h-11 py-2.5 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Go to Tracking Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-2 text-xs text-muted-foreground">
            <h4 className="font-bold text-foreground">Drop-off Instructions</h4>
            <p className="leading-relaxed">
              Consignments must be submitted to the origin luggage intake desk at least 45 minutes prior to scheduled Sienna departure.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
