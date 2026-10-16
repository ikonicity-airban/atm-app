'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthSplitLayout } from '../../../components/auth/AuthSplitLayout.tsx';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('customer@example.com');
  const [sent, setSent] = useState(false);

  return (
    <AuthSplitLayout
      title="Verify Your Email"
      subtitle="Confirm your email address to receive official receipt passes and PDF waybills."
      footerPrompt="Need help?"
      footerLinkText="Contact support"
      footerLinkHref="/contact"
      showcaseHeadline="Travel Documents, Delivered."
      showcaseCopy="Ascent automatically issues HMAC-signed QR ticket passes and tax-compliant e-invoices directly to verified traveler emails."
    >
      <div className="space-y-4">
        {sent ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-emerald-900">Verification Link Sent</h3>
            <p className="text-xs text-emerald-700">
              We have dispatched a verification link to <strong>{email}</strong>. Please check your inbox and click the link to confirm.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Registered Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-900"
              />
            </div>

            <button
              type="button"
              onClick={() => setSent(true)}
              className="w-full py-3.5 px-4 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-sm rounded-xl shadow-xs transition-transform active:scale-[0.98] cursor-pointer"
            >
              Send Verification Email
            </button>
          </div>
        )}

        <div className="text-center pt-2">
          <Link
            href="/account"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Skip for now & continue to account
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
