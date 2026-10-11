'use client';

import React from 'react';
import { auth } from '../../../lib/auth.ts';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { FormField } from '../../../components/ui/FormField.tsx';

export default function CustomerLoginPage({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const handleLogin = async () => {
    await auth.setDevCustomerSession();
    if (onLoginSuccess) onLoginSuccess();
    else if (typeof window !== 'undefined') window.location.href = '/account';
  };

  return (
    <div className="py-12 px-4 max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Sign In</h1>
        <p className="text-xs text-slate-600 mt-1">
          Access your bookings, credit balance, and express checkout.
        </p>
      </div>

      <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-xs space-y-4">
        <FormField label="Phone Number" helpText="Enter your registered Nigerian mobile number">
          <Input
            type="tel"
            defaultValue="08031234567"
            placeholder="080... or +234..."
          />
        </FormField>
        <Button
          type="button"
          onClick={handleLogin}
          variant="primary"
          size="lg"
          className="w-full"
        >
          Sign In as Customer (Dev)
        </Button>
      </div>
    </div>
  );
}
