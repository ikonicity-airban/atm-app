'use client';

import React from 'react';
import { PlaceholderPage } from '../../../../../components/ui/PlaceholderPage.tsx';
import { CheckCircle2 } from 'lucide-react';

export default function BookingSuccessPage({
  params,
  onNavigate,
}: {
  params?: { ref?: string } | Promise<{ ref?: string }>;
  onNavigate?: (path: string) => void;
}) {
  const refCode = 'ATM-7K9W2P';
  const navigate = (path: string) => {
    if (onNavigate) onNavigate(path);
    else if (typeof window !== 'undefined') window.location.href = path;
  };

  return (
    <PlaceholderPage
      title={`Booking Confirmed: ${refCode}`}
      subtitle="Ticket issued and seat held. Confirmation sent via Termii SMS/WhatsApp and Resend email."
      routePath={`/book/success/${refCode}`}
      category="Booking Complete"
      actionText="Manage Booking"
      onAction={() => navigate('/manage')}
    >
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-sm space-y-2">
        <div className="flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Ticket Issued &bull; Seat Reserved</span>
        </div>
        <p className="text-xs text-emerald-800">
          Booking Reference: <strong className="font-mono">{refCode}</strong>. Please arrive at the terminal 30 minutes before departure for check-in.
        </p>
      </div>
    </PlaceholderPage>
  );
}
