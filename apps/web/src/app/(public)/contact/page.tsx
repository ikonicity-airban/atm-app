'use client';

import React from 'react';
import { PageShell } from '../../../components/layout/Templates.tsx';
import {
  WhatsAppButton,
  CallButton,
  SectionBanner,
} from '../../../components/atm/AtmBlocks.tsx';
import { ContactInquiryForm } from '@/components/forms/inquiry/ContactInquiryForm';
import { BRAND, SEED_TERMINALS } from '@atm/shared';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <PageShell density="comfortable" width="standard" className="py-8 sm:py-12 space-y-12">
      {/* Title resting on background per ATM rules */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Contact &amp; Terminal Support
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Need assistance with your booking, parcel pickup, or charter service? Contact our 24/7 central dispatch desk or call your departure terminal directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Contact Info & Terminal Telephone Directory */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-card border border-border rounded-2xl space-y-4 shadow-xs">
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              Headquarters &amp; Dispatch
            </h2>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground">263 Ogui Road, Opp. Fire Service, Enugu State, Nigeria</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href={`mailto:${BRAND.supportEmail}`} className="text-primary hover:underline font-medium">
                  {BRAND.supportEmail}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground font-mono">{BRAND.contactPhones[0]} &bull; {BRAND.contactPhones[1]}</span>
              </div>
            </div>

            {/* Embedded Live Google Map for Headquarters */}
            <div className="w-full h-36 rounded-xl overflow-hidden border border-border bg-muted/20">
              <iframe
                title="Ascent Central Headquarters Google Maps"
                src="https://maps.google.com/maps?q=263+Ogui+Road,+Enugu,+Nigeria&z=15&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>

            <div className="pt-4 border-t border-border flex flex-col gap-2">
              <WhatsAppButton phone={BRAND.contactPhones[0]} />
              <CallButton phone={BRAND.contactPhones[0]} label="Call Central Dispatch" />
            </div>
          </div>

          {/* Quick Terminal Phones List */}
          <div className="p-6 bg-card border border-border rounded-2xl space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-foreground tracking-tight">
              Direct Terminal Phone Lines
            </h3>
            <div className="space-y-2 text-xs">
              {SEED_TERMINALS.map((t) => (
                <div key={t.id} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-b-0">
                  <span className="font-semibold text-foreground">{t.name}:</span>
                  <a href={`tel:${t.phones[0]}`} className="text-primary hover:underline font-mono">
                    {t.phones[0]}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Validated Contact / Support Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 bg-card border border-border rounded-2xl shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              Send an Inquiry or Support Request
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Messages are validated with Zod and routed directly to the duty operations supervisor.
            </p>
          </div>

          <ContactInquiryForm />
        </div>
      </div>

      <SectionBanner title="Ascent Passenger Rights Charter">
        <p className="text-xs sm:text-sm text-primary-foreground/90 leading-relaxed">
          Ascent Transport operates under strict customer service commitments. If your scheduled trip is delayed beyond 60 minutes for avoidable mechanical reasons, our automatic refund or rescheduling guarantee takes immediate effect.
        </p>
      </SectionBanner>
    </PageShell>
  );
}
