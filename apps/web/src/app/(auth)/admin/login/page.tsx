'use client';

import React, { useState } from 'react';
import { auth, DEMO_STAFF_ACCOUNTS, type DemoStaffAccount } from '../../../../lib/auth.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { FormField } from '../../../../components/ui/FormField.tsx';
import { Shield, Lock, ArrowRight, UserCheck, Truck, MapPin, Compass, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('staff-lead-01');
  const [emailInput, setEmailInput] = useState<string>('admin@atmnigeria.com');
  const [passwordInput, setPasswordInput] = useState<string>('password123');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleQuickDemoLogin = async (account: DemoStaffAccount) => {
    setIsSubmitting(true);
    await auth.setDemoStaffSession(account.id);
    if (typeof window !== 'undefined') {
      window.location.href = '/admin';
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Find matching demo account or create session with entered email
    const matchedAccount = DEMO_STAFF_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === emailInput.trim().toLowerCase()
    );

    if (matchedAccount) {
      await auth.setDemoStaffSession(matchedAccount.id);
    } else {
      await auth.setSession({
        id: `staff-custom-${Date.now()}`,
        email: emailInput.trim() || 'staff@atmnigeria.com',
        name: emailInput.split('@')[0] || 'Staff Officer',
        role: 'staff',
      });
    }

    if (typeof window !== 'undefined') {
      window.location.href = '/admin';
    }
  };

  const roleIcons: Record<string, React.ReactNode> = {
    'staff-lead-01': <Compass className="w-5 h-5 text-primary" />,
    'staff-terminal-enugu': <UserCheck className="w-5 h-5 text-primary" />,
    'staff-terminal-abuja': <MapPin className="w-5 h-5 text-primary" />,
    'staff-fleet-01': <Truck className="w-5 h-5 text-primary" />,
  };

  return (
    <div className="py-10 sm:py-16 px-4 max-w-4xl mx-auto space-y-10">
      {/* Return to passenger site link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Passenger Website</span>
        </Link>
      </div>

      {/* Header title resting directly on background per ATM rules */}
      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Lock className="w-4 h-4" />
          </div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-primary">
            Internal Staff Console
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Ascent Operations &amp; Terminal Dispatch
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Access terminal dispatch desks, passenger check-in scanners, highway manifest printing, and vehicle telematics. Demo staff profiles are enabled for evaluation.
        </p>
      </div>

      {/* 1-Click Fast Track Primary Action */}
      <section className="bg-card border-2 border-primary/30 p-6 sm:p-8 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-primary/15 text-primary px-2.5 py-0.5 rounded-full mb-1.5">
              1-Click Fast Track
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Sign In as Central Operations Lead
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Instant supervisor access with full administrative privileges across all terminals and corridors.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            onClick={() => {
              if (DEMO_STAFF_ACCOUNTS[0]) {
                handleQuickDemoLogin(DEMO_STAFF_ACCOUNTS[0]);
              }
            }}
            className="shrink-0 flex items-center gap-2 font-bold cursor-pointer min-h-[48px]"
          >
            <span>{isSubmitting ? 'Entering Portal...' : 'Enter Admin Console'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Interactive Demo Staff Accounts Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Select a Demo Staff Persona
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Choose any operational role to test specific terminal duties, check-in operations, or fleet tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_STAFF_ACCOUNTS.map((account) => {
            const isSelected = selectedAccountId === account.id;
            return (
              <div
                key={account.id}
                onClick={() => {
                  setSelectedAccountId(account.id);
                  setEmailInput(account.email);
                }}
                className={`p-5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-xs'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shrink-0 shadow-2xs">
                        {roleIcons[account.id] || <Shield className="w-5 h-5 text-primary" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          {account.name}
                        </h3>
                        <p className="text-xs font-medium text-primary">
                          {account.title}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{account.terminal}</span>
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {account.email}
                    </div>
                    <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
                      {account.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border/60">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickDemoLogin(account);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-card border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary text-foreground text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <span>Log in as {account.name.split(' ')[0]}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Manual Staff Credentials Form */}
      <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Manual Staff Credentials
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Test manual form entry with pre-filled test credentials or your assigned staff email.
          </p>
        </div>

        <form onSubmit={handleManualLogin} className="space-y-4 max-w-xl">
          <FormField label="Staff Email Address">
            <Input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="e.g. staff@atmnigeria.com"
              required
            />
          </FormField>

          <FormField label="Staff Security Passcode">
            <Input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </FormField>

          <div className="pt-2">
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              disabled={isSubmitting}
              className="w-full sm:w-auto font-bold min-h-[44px]"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In With Credentials'}
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground pt-2">
            Staff access policy: Staff accounts are provisioned exclusively by terminal administration and do not permit external self-registration.
          </p>
        </form>
      </section>
    </div>
  );
}
