'use client';

import React from 'react';
import { PlaceholderPage } from '../../../components/ui/PlaceholderPage.tsx';

export default function CourierPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const navigate = (path: string) => {
    if (onNavigate) onNavigate(path);
    else if (typeof window !== 'undefined') window.location.href = path;
  };

  return (
    <PlaceholderPage
      title="Courier &amp; Parcel Express"
      subtitle="Send packages safely between Enugu, Abuja, Lagos, and Owerri terminals (Phase 6 feature)."
      routePath="/courier"
      category="Courier Logistics"
      actionText="Track Existing Parcel"
      onAction={() => navigate('/track')}
    />
  );
}
