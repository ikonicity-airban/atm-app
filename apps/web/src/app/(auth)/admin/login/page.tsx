'use client';

import React from 'react';
import { auth } from '../../../../lib/auth.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { FormField } from '../../../../components/ui/FormField.tsx';
import { Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const handleLogin = async () => {
    await auth.setDevStaffSession();
    if (typeof window !== 'undefined') window.location.href = '/admin';
  };

  return (
    <div className="py-12 px-4 max-w-md mx-auto">
      <div className="mb-6 text-center">
        <div className="w-10 h-10 rounded bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 font-bold text-sm">
          <Lock className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Staff Portal Login</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Restricted to authorized terminal operations and management staff.
        </p>
      </div>

      <div className="p-6 bg-card border border-border rounded-xl shadow-xs space-y-4">
        <FormField label="Staff Email">
          <Input
            type="email"
            defaultValue="admin@atmnigeria.com"
          />
        </FormField>
        <FormField label="Password">
          <Input
            type="password"
            defaultValue="password123"
          />
        </FormField>
        <Button
          type="button"
          onClick={handleLogin}
          variant="secondary"
          size="lg"
          className="w-full"
        >
          Sign In as Staff (Dev)
        </Button>
        <p className="text-[10px] text-slate-500 text-center">
          Rule: Staff accounts are provisioned by admin only and never self-register.
        </p>
      </div>
    </div>
  );
}
