'use client';

import React from 'react';
import { PlaceholderPage } from '../../../../components/ui/PlaceholderPage.tsx';

export default function AdminPricingPage() {
  return (
    <PlaceholderPage
      title="Pricing &amp; Route Fares"
      subtitle="Configure integer kobo base fares, surge multipliers, and seasonal rate overrides (Phase 9 feature)."
      routePath="/admin/pricing"
      category="Revenue Management"
    />
  );
}
