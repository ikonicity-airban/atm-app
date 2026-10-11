'use client';

import React from 'react';
import { PlaceholderPage } from '../../../components/ui/PlaceholderPage.tsx';

export default function AccountPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const navigate = (path: string) => {
    if (onNavigate) onNavigate(path);
    else if (typeof window !== 'undefined') window.location.href = path;
  };

  return (
    <PlaceholderPage
      title="Customer Account Dashboard"
      subtitle="Manage your booking history, credits ledger, and personal travel profile (Phase 10 feature)."
      routePath="/account"
      category="Customer Portal"
      actionText="Search Available Trips"
      onAction={() => navigate('/trips')}
    />
  );
}
