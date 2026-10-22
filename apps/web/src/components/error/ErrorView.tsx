'use client';

import React, { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  MessageSquare,
  Check,
  Copy,
  ChevronDown,
} from 'lucide-react';
import { BRAND } from '@atm/shared';
import { Button, buttonVariants } from '../ui/Button.tsx';
import { Icon } from '../ui/Icon.tsx';

export interface ErrorViewProps {
  error: Error & { digest?: string };
  reset: () => void;
  portalTitle?: string;
  homeHref?: string;
  density?: 'default' | 'compact';
  showDevDetails?: boolean;
  className?: string;
}

export function ErrorView({
  error,
  reset,
  portalTitle,
  homeHref = '/',
  density = 'default',
  showDevDetails,
  className = '',
}: ErrorViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Determine whether to display development mode diagnostics
  const isDevMode =
    typeof showDevDetails === 'boolean'
      ? showDevDetails
      : process.env.NODE_ENV === 'development';

  // Compute a stable incident reference code
  const incidentCode = useMemo(() => {
    if (error?.digest) return error.digest;
    return `ATM-${Date.now().toString(36).toUpperCase()}`;
  }, [error]);

  const supportPhone = (BRAND.contactPhones && BRAND.contactPhones[0]) || '2349070000625';
  const cleanPhone = supportPhone.replace(/[^0-9]/g, '');

  const waMessage = encodeURIComponent(
    `Hello Ascent Transport Management, I encountered an application error (Reference: ${incidentCode}) on route ${pathname || 'unknown'}. Error: ${error?.message || 'Unexpected fault'}`
  );
  const waUrl = `https://wa.me/${cleanPhone}?text=${waMessage}`;

  const handleCopyCode = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(
          `Incident: ${incidentCode}\nMessage: ${error?.message || 'Unknown'}\nPath: ${pathname}`
        );
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Next.js 15 App Router Server Component Cache Refresh + Error Boundary Reset
  const handleReset = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  if (density === 'compact') {
    return (
      <div
        role="alert"
        className={`p-6 max-w-xl mx-auto rounded-xl border border-destructive/30 bg-destructive/5 text-foreground ${className}`}
      >
        <div className="flex items-center gap-3 text-destructive mb-2">
          <Icon icon={AlertTriangle} className="w-5 h-5 shrink-0" />
          <h2 className="text-sm font-bold text-foreground">
            {portalTitle || 'Operational Console Error'}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {isDevMode
            ? error?.message || 'An unexpected operational failure occurred.'
            : 'The administrative action could not be processed. Please retry or contact dispatch systems support.'}
        </p>

        {isDevMode && (
          <div className="mb-4 p-2.5 rounded bg-muted/60 font-mono text-[11px] text-muted-foreground overflow-x-auto">
            <span>Ref: {incidentCode}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            isLoading={isPending}
            onClick={handleReset}
          >
            <Icon icon={RefreshCw} className="w-3.5 h-3.5" />
            <span>Retry Operation</span>
          </Button>
          <Link
            href={homeHref}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={`w-full max-w-2xl mx-auto px-4 py-16 text-center ${className}`}
    >
      {/* Visual Error Icon */}
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center mx-auto mb-6 shadow-sm">
        <Icon icon={AlertTriangle} className="w-8 h-8" />
      </div>

      {/* Unbadged Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
        {portalTitle || 'Something went wrong'}
      </h1>

      {/* Friendly Description */}
      <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
        {isDevMode
          ? error?.message || 'A runtime exception was intercepted by the error boundary.'
          : 'We encountered an unexpected disruption loading this transport page. Our engineering team has been notified.'}
      </p>

      {/* Incident Reference Code */}
      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card/60 text-xs text-muted-foreground font-mono">
        <span>Incident Reference:</span>
        <span className="font-semibold text-foreground">{incidentCode}</span>
        <button
          type="button"
          onClick={handleCopyCode}
          aria-label="Copy incident reference code"
          className="p-1 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
        >
          {copied ? (
            <Icon icon={Check} className="w-3.5 h-3.5 text-success" />
          ) : (
            <Icon icon={Copy} className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Primary Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          variant="default"
          size="default"
          isLoading={isPending}
          onClick={handleReset}
        >
          <Icon icon={RefreshCw} className="w-4 h-4" />
          <span>Try Again</span>
        </Button>
        <Link
          href={homeHref}
          className={buttonVariants({ variant: 'outline', size: 'default' })}
        >
          <Icon icon={Home} className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: 'secondary', size: 'default' })}
        >
          <Icon icon={MessageSquare} className="w-4 h-4 text-success" />
          <span>Report via WhatsApp</span>
        </a>
      </div>

      {/* Development Mode Diagnostics Panel */}
      {isDevMode && (
        <div className="mt-10 text-left">
          <button
            type="button"
            onClick={() => setIsDetailsOpen((prev) => !prev)}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2 cursor-pointer"
          >
            <Icon
              icon={ChevronDown}
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isDetailsOpen ? 'rotate-180' : ''
              }`}
            />
            <span>Technical Diagnostics (Development Only)</span>
          </button>

          {isDetailsOpen && (
            <div className="p-4 rounded-xl border border-border bg-card font-mono text-xs text-muted-foreground overflow-x-auto max-h-60 space-y-2">
              <div>
                <span className="text-destructive font-semibold">Error Name:</span>{' '}
                {error?.name || 'Error'}
              </div>
              <div>
                <span className="text-destructive font-semibold">Message:</span>{' '}
                {error?.message || 'No explicit message.'}
              </div>
              {error?.digest && (
                <div>
                  <span className="text-primary font-semibold">Digest:</span>{' '}
                  {error.digest}
                </div>
              )}
              {error?.stack && (
                <pre className="mt-2 text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
