'use client';

import React from 'react';
import { PlaceholderPage } from '../../../components/ui/PlaceholderPage.tsx';

export default function TrackParcelPage() {
  return (
    <PlaceholderPage
      title="Track Courier Parcel"
      subtitle="Enter your ATM-EXP-XXXXXX tracking code to view real-time delivery status (Phase 6 feature)."
      routePath="/track"
      category="Parcel Tracking"
    />
  );
}
