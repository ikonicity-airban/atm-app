'use client';

import React from 'react';
import { PlaceholderPage } from '../../../../components/ui/PlaceholderPage.tsx';

export default function AdminTripsPage() {
  return (
    <PlaceholderPage
      title="Trips &amp; Dispatch Management"
      subtitle="Schedule trips, manage vehicle/driver assignments, and track live transit statuses (Phase 8 feature)."
      routePath="/admin/trips"
      category="Operations"
    />
  );
}
