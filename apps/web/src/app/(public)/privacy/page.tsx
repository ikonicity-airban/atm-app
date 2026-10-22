import React from 'react';
import { ContentPage } from '../../../components/layout/Templates.tsx';
import { BRAND } from '@atm/shared';

export const metadata = {
  title: 'Privacy Policy | Ascent Transport Management (ATM Nigeria)',
  description: 'Compliance with the Nigeria Data Protection Act (NDPA 2023). How Ascent Transport Management collects, secures, and handles customer data.',
};

export default function PrivacyPage() {
  return (
    <ContentPage
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]}
      title="Privacy Policy &amp; Data Protection"
      subtitle="How Ascent Transport Management protects customer personal information under the Nigeria Data Protection Act (NDPA 2023)."
      lastUpdated="October 2026 // TODO(client/legal): NDPA registration and DPO review"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground tracking-tight">1. Scope &amp; Legal Framework</h2>
        <p>
          {BRAND.name} (&quot;ATM Nigeria&quot;, &quot;we&quot;, &quot;our&quot;) is committed to handling your personal data responsibly and in strict compliance with the Nigeria Data Protection Act (NDPA 2023) and regulations issued by the Nigeria Data Protection Commission (NDPC).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground tracking-tight">2. Information We Collect</h2>
        <p>
          To issue tickets, prepare statutory travel manifests, and deliver courier shipments, we collect:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs">
          <li><strong>Contact Details:</strong> Full name, telephone number (normalised to E.164 +234), and email address.</li>
          <li><strong>Travel Records:</strong> Origin and destination terminals, departure time, seat selection, and emergency contact details.</li>
          <li><strong>Courier Consignment Data:</strong> Sender name and phone, receiver name and delivery phone number, parcel description, and declared value.</li>
          <li><strong>Financial Transaction References:</strong> We store payment status and Paystack transaction references. We never store credit or debit card numbers on our servers.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground tracking-tight">3. How Your Data is Used</h2>
        <p>
          Your data is used solely for the following purposes:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs">
          <li>Fulfilling seat reservations, generating ticket QR codes, and processing check-in.</li>
          <li>Transmitting transactional SMS/WhatsApp booking and arrival alerts via authorized aggregators (Termii).</li>
          <li>Compliance with statutory road safety passenger manifest requirements mandated by the Federal Road Safety Corps (FRSC).</li>
          <li>Resolving customer inquiries, route cancellations, and refund claims.</li>
        </ul>
        <p>
          We do not sell, rent, or trade customer phone numbers or travel histories to commercial advertising brokers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground tracking-tight">4. Data Security &amp; Retention</h2>
        <p>
          All electronic transmission of passenger information and booking records is encrypted using Transport Layer Security (TLS). Data is housed in secure cloud databases with restricted role-based staff access controls.
        </p>
        <p className="text-xs text-muted-foreground italic">
          // TODO(client/legal): Confirm exact data retention schedules (e.g. 5-year manifest retention for regulatory compliance).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground tracking-tight">5. Your Rights as a Data Subject</h2>
        <p>
          Under the NDPA 2023, you have the right to request access to your travel records, rectify inaccurate phone numbers, or request the erasure of your profile. To exercise these rights, contact our Data Protection Officer at:
        </p>
        <p className="text-xs font-semibold text-slate-800">
          Email: <a href={`mailto:${BRAND.supportEmail}`} className="text-[#ca2484] hover:underline">{BRAND.supportEmail}</a>
          <br />
          Postal Address: 263 Ogui Road, Opp. Fire Service, Enugu State, Nigeria
        </p>
      </section>
    </ContentPage>
  );
}
