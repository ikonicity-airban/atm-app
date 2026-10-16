'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthSplitLayout } from '../../../components/auth/AuthSplitLayout.tsx';
import { auth } from '../../../lib/auth.ts';

function TwoFactorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token') || 'dev-challenge-token';
  const userId = searchParams.get('userId') || 'user-cust-dev-01';

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          challengeToken: token,
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Two-factor verification failed');
      }

      await auth.setSession({
        id: data.user?.id || userId,
        email: data.user?.email || 'customer@example.com',
        name: data.user?.name || 'Chioma Okeke',
        role: 'customer',
      });

      router.push('/account');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Two-Factor Authentication"
      subtitle="Enter the 6-digit authentication code from your authenticator app (Google Authenticator, Authy) or enter a backup code."
      footerPrompt="Having trouble with your authenticator?"
      footerLinkText="Contact passenger support"
      footerLinkHref="/contact"
      showcaseHeadline="Enterprise-Grade Account Security."
      showcaseCopy="Two-factor authentication protects your stored credit balance, passenger details, and upcoming ticket manifests from unauthorized access."
    >
      <form onSubmit={handleVerify} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {useBackupCode ? '8-Character Backup Recovery Code' : '6-Digit Authenticator Code'}
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={useBackupCode ? 'e.g. 7A8B9C0D' : 'e.g. 123456'}
            required
            className={`w-full text-center font-mono py-3 px-4 bg-slate-50 border border-slate-200/90 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all ${
              useBackupCode ? 'tracking-wider uppercase' : 'tracking-[0.4em] text-xl'
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={loading || code.trim().length < 6}
          className="w-full py-3.5 px-4 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-sm rounded-xl shadow-xs transition-transform active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center min-h-[46px]"
        >
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode('');
            }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            {useBackupCode
              ? 'Use 6-digit authenticator code instead'
              : 'Use an 8-character backup recovery code'}
          </button>
        </div>
      </form>
    </AuthSplitLayout>
  );
}

export default function TwoFactorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">Loading 2FA...</div>}>
      <TwoFactorContent />
    </Suspense>
  );
}
