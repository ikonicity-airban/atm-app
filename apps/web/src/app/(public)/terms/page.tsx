'use client';

import React, { useState, useEffect } from 'react';
import { ContentPage } from '../../../components/layout/Templates.tsx';
import { BRAND } from '@atm/shared';
import { settingsRepository } from '../../../server/repositories/settings.ts';

export default function TermsPage() {
  const [cancellationPolicy, setCancellationPolicy] = useState<string | null>(null);
  const [luggagePolicy, setLuggagePolicy] = useState<string | null>(null);

  useEffect(() => {
    settingsRepository.getSetting('policy.cancellation', null).then(setCancellationPolicy);
    settingsRepository.getSetting('policy.luggage', null).then(setLuggagePolicy);
  }, []);

  return (
    <ContentPage
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Terms & Conditions' }]}
      title="Terms of Service &amp; Conditions of Carriage"
      subtitle="Standard contract of carriage between Ascent Transport Management and passengers or cargo senders."
      lastUpdated="October 2026 // TODO(client/legal): finalize with legal counsel"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">1. General Overview &amp; Acceptance</h2>
        <p>
          By booking a ticket, chartering a vehicle, or dropping off cargo at any terminal operated by {BRAND.name}, you enter into an agreement governed by the laws of the Federal Republic of Nigeria.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">2. Seat Reservations &amp; Seat Holds</h2>
        <p>
          When you initiate an online reservation, your chosen seat is held in pending status for 15 minutes. If payment is not completed within 15 minutes, the hold expires and the seat returns to availability.
        </p>
        <p>
          Tickets must match the passenger identity provided at the time of online or counter check-in.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">3. Check-In &amp; Departures</h2>
        <p>
          Passengers must arrive at their boarding terminal in good time before departure.
        </p>
        <p className="text-xs text-slate-500 italic">
          // TODO(client): Confirm policy with the terminal regarding exact reporting times.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">4. Cancellation &amp; Refund Policy</h2>
        {cancellationPolicy ? (
          <div>
            <p>Ticket cancellations are processed according to the terminal cancellation policy:</p>
            <p className="text-xs text-slate-500 italic mt-1">
              // TODO(client): Confirm policy with the terminal regarding cancellation deduction percentages.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-600">
            Cancellation rules and fee deductions apply based on departure timing. Confirm policy with the terminal prior to departure.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">5. Luggage Guidelines</h2>
        {luggagePolicy ? (
          <p>{String(luggagePolicy)}</p>
        ) : (
          <p className="text-xs text-slate-600">
            Luggage allowances are subject to vehicle capacity. Confirm policy with the terminal for bulky or excess luggage; excess luggage can be booked as courier freight.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">6. Courier Freight Liability</h2>
        <p>
          Senders must declare the category and nature of courier items upon terminal drop-off.
        </p>
        <p className="text-xs text-slate-500 italic">
          // TODO(client/legal): Confirm policy with the terminal regarding liability limits.
        </p>
      </section>
    </ContentPage>
  );
}
