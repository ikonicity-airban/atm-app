'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthSplitLayout } from '../../../components/auth/AuthSplitLayout.tsx';
import { auth } from '../../../lib/auth.ts';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('08031234567');
  const [password, setPassword] = useState('Password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, rememberMe }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      if (data.requires2FA) {
        // Route to 2FA challenge
        router.push(`/2fa?token=${data.challengeToken}&userId=${data.userId}`);
        return;
      }

      // Establish session
      await auth.setSession({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: 'customer',
      });

      router.push('/account');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDevQuickFill = async () => {
    await auth.setDevCustomerSession();
    router.push('/account');
  };

  return (
    <AuthSplitLayout
      title="Welcome Back !"
      subtitle="Sign in to your Ascent passenger portal to view tickets and store credits."
      footerPrompt="Don't have an account?"
      footerLinkText="Sign up now"
      footerLinkHref="/register"
      showcaseHeadline="Harness Seamless Travel."
      showcaseCopy="Ascent connects Nigeria's major commercial hubs with guaranteed Toyota Sienna departures, instant seat holds, and transparent wallet credits."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Email or Phone Input */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Email or Nigerian mobile
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Email or phone number"
            required
            className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all"
          />
        </div>

        {/* Password Input with Eye Toggle */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 focus:outline-none cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot Password Row */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-muted peer-checked:bg-primary rounded-full transition-colors relative">
              <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-card rounded-full transition-transform ${rememberMe ? 'translate-x-3.5' : ''}`} />
            </div>
            <span className="text-xs text-muted-foreground font-medium">Remember me</span>
          </label>

          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-primary hover:underline transition-colors cursor-pointer"
          >
            Forgot password?
          </Link>
        </div>

        {/* Primary Sign In Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl shadow-xs transition-transform duration-150 ease-out active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center min-h-[46px]"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-3 text-muted-foreground">or continue with</span>
          </div>
        </div>

        {/* Social & Alternative Buttons */}
        <div className="space-y-2">
          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleDevQuickFill}
            className="w-full py-2.5 px-4 bg-card hover:bg-muted border border-border text-foreground font-medium text-xs sm:text-sm rounded-xl transition-transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2.5 shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          {/* Facebook & Phone OTP options */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDevQuickFill}
              className="py-2.5 px-3 bg-card hover:bg-muted border border-border text-foreground font-medium text-xs rounded-xl transition-transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </button>

            <Link
              href="/verify-phone"
              className="py-2.5 px-3 bg-card hover:bg-muted border border-border text-foreground font-medium text-xs rounded-xl transition-transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Phone OTP</span>
            </Link>
          </div>
        </div>

        {/* Quick Dev Auto-fill helper */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={handleDevQuickFill}
            className="text-[11px] text-slate-400 hover:text-indigo-600 underline cursor-pointer"
          >
            Quick 1-Click Demo Login (Chioma Okeke)
          </button>
        </div>
      </form>
    </AuthSplitLayout>
  );
}
