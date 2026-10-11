'use client';

import React from 'react';
import { PlaceholderPage } from '../../../../components/ui/PlaceholderPage.tsx';

export default function AdminSettingsPage() {
  return (
    <PlaceholderPage
      title="System Settings"
      subtitle="Cancellation rules, SMS/WhatsApp notification templates, and Paystack credentials (Phase 9 feature)."
      routePath="/admin/settings"
      category="Administration"
    />
  );
}
