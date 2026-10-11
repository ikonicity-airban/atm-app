import React from 'react';
import { PageShell } from '../../../components/layout/Templates.tsx';
import { Accordion, type AccordionItem } from '../../../components/ui/Accordion.tsx';
import { SectionBanner } from '../../../components/atm/AtmBlocks.tsx';
import { BRAND, VEHICLE_DESCRIPTION } from '@atm/shared';

export const metadata = {
  title: 'Frequently Asked Questions | Ascent Transport Management',
  description: 'Answers to common questions about booking seats, Toyota Sienna 5-passenger layout, Paystack payments, cancellation rules, and parcel courier.',
};

export default function FaqPage() {
  const bookingFaqs: AccordionItem[] = [
    {
      id: 'book-1',
      title: 'How many passenger seats are inside the Toyota Sienna?',
      content:
        `Every Ascent Transport Sienna is configured strictly for 5 passenger seats: ${VEHICLE_DESCRIPTION}`,
    },
    {
      id: 'book-2',
      title: 'Can I pick my exact seat when booking online?',
      content:
        'Yes. Our seat map displays real-time availability. You can choose your exact window or middle position during checkout.',
    },
    {
      id: 'book-3',
      title: 'How long is a seat held while I pay?',
      content:
        'Selected seats are locked for 15 minutes while you complete payment on Paystack. If payment is not completed within 15 minutes, the seat returns to public availability.',
    },
    {
      id: 'book-4',
      title: 'Do vehicles pick up roadside passengers?',
      content:
        'No. Ascent Transport vehicles depart directly from the terminal without roadside pickups.',
    },
  ];

  const paymentFaqs: AccordionItem[] = [
    {
      id: 'pay-1',
      title: 'What payment methods do you accept?',
      content:
        'Through Paystack, we accept Nigerian debit/credit cards, direct bank transfer, USSD codes, and mobile money. Payment is also accepted at our physical terminal ticketing counters.',
    },
    {
      id: 'pay-2',
      title: 'Will I get an official receipt and ticket?',
      content:
        'Yes. A booking confirmation is sent upon successful payment. You can also download a ticket with a QR code.',
    },
  ];

  const cancellationFaqs: AccordionItem[] = [
    {
      id: 'cancel-1',
      title: 'What is your cancellation and refund policy?',
      content:
        'Cancellations are subject to administrative fee schedules depending on departure timing. Confirm policy with the terminal for exact rules. // TODO(client): confirm policy with the terminal',
    },
    {
      id: 'cancel-2',
      title: 'Can I receive my refund as wallet credits for future travel?',
      content:
        'Yes, credits can be assigned to your verified phone number account for future trips.',
    },
  ];

  const courierFaqs: AccordionItem[] = [
    {
      id: 'courier-1',
      title: 'How does the parcel courier service work?',
      content:
        'Bring your parcel to any of our six terminals during operational hours. Parcels are logged, weighed, and dispatched on scheduled departures. Senders and receivers get an ATM-EXP tracking code.',
    },
    {
      id: 'courier-2',
      title: 'How fast will my parcel arrive?',
      content:
        'Parcels are transported via scheduled departures directly to the destination terminal counter for receiver pickup.',
    },
  ];

  const charterFaqs: AccordionItem[] = [
    {
      id: 'charter-1',
      title: 'Can I charter an entire vehicle for private travel?',
      content:
        'Yes. You can charter a dedicated 5-passenger Toyota Sienna with driver for private travel. Submit a charter request online or call our dispatch desk.',
    },
  ];

  return (
    <PageShell
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'FAQ' }]}
      title="Frequently Asked Questions"
      description="Straightforward information regarding Ascent Transport travel schedules, vehicle features, payments, and luggage policies."
    >
      <div className="space-y-12">
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Booking &amp; Seat Selection
            </h2>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <Accordion items={bookingFaqs} defaultOpenId="book-1" />
          </div>
        </section>

        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Payments &amp; Ticketing
            </h2>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <Accordion items={paymentFaqs} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Cancellations &amp; Refunds
            </h2>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <Accordion items={cancellationFaqs} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Courier &amp; Parcels
            </h2>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <Accordion items={courierFaqs} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Vehicle Charter &amp; Corporate
            </h2>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <Accordion items={charterFaqs} />
          </div>
        </section>

        <SectionBanner title="Have a question not listed here?">
          <p>
            Call our terminal telephone lines at {BRAND.contactPhones[0]} or {BRAND.contactPhones[1]}, or chat with a terminal station representative.
          </p>
        </SectionBanner>
      </div>
    </PageShell>
  );
}
