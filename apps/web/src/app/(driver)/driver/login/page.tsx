'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, BadgeCheck, Mail, KeyRound, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { BRAND } from '@atm/shared';

type AuthTab = 'phone_otp' | 'badge_pin' | 'email_password';

export default function DriverLoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<AuthTab>('badge_pin');
  const [identifier, setIdentifier] = useState('DRV-ENU-01');
  const [credential, setCredential] = useState('1234');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/driver/auth/otp?action=send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: identifier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/driver/auth/otp?action=verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: identifier, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP code');

      router.push('/driver');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/driver/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          credential,
          authMethod: tab,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sign in failed');

      router.push('/driver');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-6">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#ca2484] block mb-1">
            Commercial Driver Portal
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Driver Authentication
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to access your assigned Toyota Sienna departure manifest and highway log.
          </p>
        </div>

        {/* Multi-Method Method Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setTab('badge_pin');
              setIdentifier('DRV-ENU-01');
              setCredential('1234');
              setError(null);
            }}
            className={`py-2 px-1 text-[11px] font-bold rounded-lg flex flex-col items-center gap-1 transition-all min-h-[48px] justify-center ${
              tab === 'badge_pin'
                ? 'bg-[#ca2484] text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BadgeCheck className="w-3.5 h-3.5" />
            <span>Driver ID</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('phone_otp');
              setIdentifier('09070000210');
              setOtpSent(false);
              setError(null);
            }}
            className={`py-2 px-1 text-[11px] font-bold rounded-lg flex flex-col items-center gap-1 transition-all min-h-[48px] justify-center ${
              tab === 'phone_otp'
                ? 'bg-[#ca2484] text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone OTP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('email_password');
              setIdentifier('emeka.nwosu@atmnigeria.com');
              setCredential('1234');
              setError(null);
            }}
            className={`py-2 px-1 text-[11px] font-bold rounded-lg flex flex-col items-center gap-1 transition-all min-h-[48px] justify-center ${
              tab === 'email_password'
                ? 'bg-[#ca2484] text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Driver Badge ID & PIN */}
        {tab === 'badge_pin' && (
          <form onSubmit={handleCredentialLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Driver Badge Identifier
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. DRV-ENU-01"
                required
                className="w-full px-3.5 py-3 text-sm font-semibold rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#ca2484] min-h-[48px]"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Found on your official ATM driver ID card badge.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                4-Digit Security PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder="••••"
                required
                className="w-full px-3.5 py-3 text-sm font-semibold rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#ca2484] min-h-[48px]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#ca2484] hover:bg-[#aa1769] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In with Badge ID'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Tab 2: Phone Number + SMS OTP */}
        {tab === 'phone_otp' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Registered Mobile Phone
                  </label>
                  <input
                    type="tel"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 09070000210"
                    required
                    className="w-full px-3.5 py-3 text-sm font-semibold rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#ca2484] min-h-[48px]"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    We will send a 6-digit OTP verification code via SMS.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-[#ca2484] hover:bg-[#aa1769] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
                >
                  <span>{loading ? 'Sending SMS...' : 'Send Verification OTP'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 bg-emerald-950/40 border border-emerald-850 rounded-xl text-xs text-emerald-300">
                  Code sent to <strong>{identifier}</strong>. Demo default is <strong>123456</strong>.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    6-Digit SMS Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    required
                    className="w-full text-center tracking-widest text-lg font-mono font-bold px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#ca2484] min-h-[48px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
                >
                  <span>{loading ? 'Verifying...' : 'Verify OTP & Enter Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-200 py-2 min-h-[44px]"
                >
                  Change phone number
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 3: Email & Password / PIN */}
        {tab === 'email_password' && (
          <form onSubmit={handleCredentialLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Staff Corporate Email
              </label>
              <input
                type="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="driver@atmnigeria.com"
                required
                className="w-full px-3.5 py-3 text-sm font-semibold rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#ca2484] min-h-[48px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Password or Security PIN
              </label>
              <input
                type="password"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-3 text-sm font-semibold rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#ca2484] min-h-[48px]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#ca2484] hover:bg-[#aa1769] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In with Email'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="pt-3 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
          Need account assistance or new PIN? Contact your terminal station master or call safety operations.
        </div>
      </div>
    </div>
  );
}
