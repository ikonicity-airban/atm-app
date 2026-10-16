'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthSplitLayout } from '../../../components/auth/AuthSplitLayout.tsx';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit password reset request');
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting request';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Reset Your Password"
      subtitle="Enter your account email to receive a secure password reset link."
      footerPrompt="Remembered your credentials?"
      footerLinkText="Back to sign in"
      footerLinkHref="/login"
      showcaseHeadline="Account Security & Access."
      showcaseCopy="Rest easy knowing your credentials, stored credit balances, and upcoming Toyota Sienna tickets are protected with strict encryption standards."
    >
      {submitted ? (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Check Your Email</h3>
          <p className="text-xs text-slate-600">
            We sent instructions to <strong>{email}</strong>. Follow the link to choose a new password.
          </p>
          <div className="pt-2">
            <Link
              href="/reset-password?token=dev-sample-reset-token"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
            >
              Continue to Reset Password Form (Demo Link)
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Account Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-sm rounded-xl shadow-xs transition-transform active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center min-h-[46px]"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}
    </AuthSplitLayout>
  );
}
