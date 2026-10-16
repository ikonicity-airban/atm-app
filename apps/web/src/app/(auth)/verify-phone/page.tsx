'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthSplitLayout } from '../../../components/auth/AuthSplitLayout.tsx';
import { auth } from '../../../lib/auth.ts';

function VerifyPhoneContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const p = searchParams.get('phone') || '08031234567';
    const devOtp = searchParams.get('devOtp');
    setPhone(p);
    if (devOtp) {
      setCode(devOtp);
      setMessage(`Code dispatched: ${devOtp}`);
    }
  }, [searchParams]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Check if user session returned
      if (data.user) {
        await auth.setSession({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: 'customer',
        });
      } else {
        await auth.setDevCustomerSession();
      }

      router.push('/account');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setCooldown(60);
        setMessage(data.devOtpCode ? `New code sent: ${data.devOtpCode}` : 'A new code has been sent.');
        if (data.devOtpCode) setCode(data.devOtpCode);
      } else {
        setError(data.error || 'Could not send code');
      }
    } catch {
      setError('Failed to resend verification code');
    }
  };

  return (
    <AuthSplitLayout
      title="Verify Phone Number"
      subtitle={`Enter the 6-digit numeric verification code sent to ${phone || 'your mobile number'}.`}
      footerPrompt="Wrong phone number?"
      footerLinkText="Change number"
      footerLinkHref="/register"
      showcaseHeadline="Verified Travel Security."
      showcaseCopy="Ascent validates all traveler mobile numbers to ensure instant SMS boarding notices, emergency gate announcements, and secure store credit refunds."
    >
      <form onSubmit={handleVerify} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700 font-medium">
            {message}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            6-Digit Verification Code
          </label>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 123456"
            required
            className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 px-4 bg-slate-50 border border-slate-200/90 rounded-xl text-slate-900 placeholder:text-slate-300 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full py-3.5 px-4 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-sm rounded-xl shadow-xs transition-transform active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center min-h-[46px]"
        >
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </button>

        <div className="text-center pt-2">
          {cooldown > 0 ? (
            <p className="text-xs text-slate-400">
              Resend code in <span className="font-semibold text-slate-600">{cooldown}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              Resend 6-Digit Code
            </button>
          )}
        </div>
      </form>
    </AuthSplitLayout>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">Loading verification...</div>}>
      <VerifyPhoneContent />
    </Suspense>
  );
}
