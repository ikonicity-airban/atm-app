'use client';

import React from 'react';
import { PlaceholderPage } from '../../../components/ui/PlaceholderPage.tsx';

export default function ManageBookingPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const navigate = (path: string) => {
    if (onNavigate) onNavigate(path);
    else if (typeof window !== 'undefined') window.location.href = path;
  };

  return (
    <PlaceholderPage
      title="Manage Booking &amp; Tickets"
      subtitle="View your travel itinerary, download PDF ticket, or submit a cancellation request (Phase 5 feature)."
      routePath="/manage"
      category="Customer Self-Service"
      actionText="Request Cancellation"
      onAction={() => navigate('/cancel')}
    />
  );
}
