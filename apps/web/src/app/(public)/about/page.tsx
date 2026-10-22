import React from 'react';
import { ContentPage } from '../../../components/layout/Templates.tsx';
import { SectionBanner } from '../../../components/atm/AtmBlocks.tsx';
import { BRAND, VEHICLE_DESCRIPTION } from '@atm/shared';
import { CardHoverGroup } from '@/components/ui/card-hover-effect';

export const metadata = {
  title: 'About Us | Ascent Transport Management (ATM Nigeria)',
  description: 'Ascent Transport Management operates scheduled intercity passenger transport and express courier delivery across Nigeria.',
};

export default function AboutPage() {
  return (
    <ContentPage
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'About Us' }]}
      title="About Ascent Transport Management"
      subtitle="Scheduled intercity passenger transport and parcel courier delivery across Nigeria."
      lastUpdated="October 2026"
    >
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Overview</h2>
        <p>
          Ascent Transport Management ({BRAND.shortName}) provides scheduled passenger transport and express parcel delivery connecting Enugu, Abuja, Lagos, and Owerri.
        </p>
        <p>
          Our passenger service operates with dedicated vehicles configured for 5 passenger seats: {VEHICLE_DESCRIPTION}
        </p>
      </section>

      <section className="space-y-4 pt-4">
        <h2 className="text-xl font-bold text-foreground tracking-tight">Services</h2>
        <CardHoverGroup className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-5 bg-card text-card-foreground border border-border rounded-2xl h-full shadow-xs">
            <h3 className="font-bold text-foreground text-sm">1. Intercity Passenger Transport</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Scheduled passenger services linking Enugu, Abuja, Lagos (Jibowu, Ajah, Festac), and Owerri.
            </p>
          </div>
          <div className="p-5 bg-card text-card-foreground border border-border rounded-2xl h-full shadow-xs">
            <h3 className="font-bold text-foreground text-sm">2. Courier &amp; Parcel Logistics</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Terminal-to-terminal courier delivery for documents and parcels with tracking codes.
            </p>
          </div>
          <div className="p-5 bg-card text-card-foreground border border-border rounded-2xl h-full shadow-xs">
            <h3 className="font-bold text-foreground text-sm">3. Vehicle Charter &amp; Corporate Logistics</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Private vehicle charters and corporate staff transport. Contact terminal management for custom arrangements.
            </p>
          </div>
        </CardHoverGroup>
      </section>

      <div className="pt-6">
        <SectionBanner title={BRAND.tagline}>
          <p>
            Visit any of our physical terminals in Enugu, Abuja, Lagos, or Owerri, or book your seat online.
          </p>
        </SectionBanner>
      </div>
    </ContentPage>
  );
}
