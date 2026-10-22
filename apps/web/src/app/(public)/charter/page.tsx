'use client';

import React from 'react';
import { PageShell } from '../../../components/layout/Templates.tsx';
import { CharterRequestForm } from '@/components/forms/charter/CharterRequestForm';
import { Icon } from '@/components/ui/Icon';
import { Car, CheckCircle2, ShieldCheck, Clock, Users } from 'lucide-react';

export default function CharterPage() {
  return (
    <PageShell
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Private Charter' },
      ]}
      width="compact"
      density="comfortable"
    >
      {/* Hero Intro Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight text-balance">
            Executive Private Sienna Charter
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-2xl text-pretty leading-relaxed">
            Exclusive hire of our Toyota Sienna fleet. Direct intercity point-to-point transit, corporate delegation transport, or multi-day executive standby.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="mt-4 flex flex-wrap gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs font-semibold text-foreground">
            <Icon icon={Car} size="xs" className="text-primary" />
            <span>Dedicated Toyota Sienna</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs font-semibold text-foreground">
            <Icon icon={ShieldCheck} size="xs" className="text-emerald-600 dark:text-emerald-400" />
            <span>Certified Chauffeur &amp; Fuel Included</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs font-semibold text-foreground">
            <Icon icon={Clock} size="xs" className="text-sky-600 dark:text-sky-400" />
            <span>Door-to-Door Pickup</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Validated Charter Form */}
        <div className="lg:col-span-8">
          <CharterRequestForm />
        </div>

        {/* Right: Fleet Specs Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <Icon icon={Car} size="xs" className="text-primary" />
              <span>Toyota Sienna Fleet Standards</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <Icon icon={CheckCircle2} size="xs" className="text-emerald-600 dark:text-emerald-400" />
                <span>Max 5 passenger individual captain seats</span>
              </li>
              <li className="flex items-center gap-2">
                <Icon icon={CheckCircle2} size="xs" className="text-emerald-600 dark:text-emerald-400" />
                <span>Dual high-efficiency AC climate controls</span>
              </li>
              <li className="flex items-center gap-2">
                <Icon icon={CheckCircle2} size="xs" className="text-emerald-600 dark:text-emerald-400" />
                <span>USB rapid charging on every row</span>
              </li>
              <li className="flex items-center gap-2">
                <Icon icon={CheckCircle2} size="xs" className="text-emerald-600 dark:text-emerald-400" />
                <span>Comprehensive speed governor protection (100 km/h)</span>
              </li>
            </ul>
          </div>

          <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-xs space-y-2 text-xs text-muted-foreground">
            <h4 className="font-bold text-foreground">Corporate Invoicing</h4>
            <p className="leading-relaxed">
              Corporate accounts with valid Nigerian Tax ID numbers can request 14-day wire invoice settlements upon contract signing.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
