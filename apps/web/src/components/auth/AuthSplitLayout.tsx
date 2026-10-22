'use client';

import React from 'react';
import Link from 'next/link';

interface AuthSplitLayoutProps {
  title: string;
  subtitle?: string;
  brandTag?: string;
  footerPrompt?: string;
  footerLinkText?: string;
  footerLinkHref?: string;
  children: React.ReactNode;
  showcaseHeadline?: string;
  showcaseCopy?: string;
}

export function AuthSplitLayout({
  title,
  subtitle,
  brandTag = 'ATM Nigeria',
  footerPrompt,
  footerLinkText,
  footerLinkHref,
  children,
  showcaseHeadline = 'Intercity Transit, Elevated.',
  showcaseCopy = 'Experience seamless Toyota Sienna highway transit connecting Enugu, Abuja, Lagos, and Owerri with instant seat holds and guaranteed departures.',
}: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-3 sm:p-6 md:p-8 font-sans">
      {/* Outer Card Container mirroring CoLabs reference card */}
      <div className="w-full max-w-5xl bg-card text-card-foreground rounded-[2rem] shadow-2xl border border-border p-5 sm:p-8 md:p-10 flex flex-col md:flex-row gap-8 lg:gap-12 relative overflow-hidden">
        
        {/* Left Column: Form & Interaction Surface */}
        <div className="w-full md:w-[50%] flex flex-col justify-between py-2 sm:py-4">
          <div>
            {/* Top Brand Pill with Dual Glowing Circles */}
            <div className="mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors group cursor-pointer"
              >
                {/* Two overlapping glowing circles logo mark */}
                <div className="flex items-center -space-x-1.5">
                  <div className="w-4 h-4 rounded-full bg-primary shadow-xs" />
                  <div className="w-4 h-4 rounded-full bg-primary/60 opacity-80" />
                </div>
                <span className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {brandTag}
                </span>
              </Link>
            </div>

            {/* Title resting directly on canvas without wrapper badges */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Interactive Form Content */}
            <div className="space-y-4">
              {children}
            </div>
          </div>

          {/* Bottom Switch Link */}
          {footerPrompt && footerLinkText && footerLinkHref && (
            <div className="mt-8 pt-4 border-t border-border text-center text-xs sm:text-sm text-muted-foreground">
              {footerPrompt}{' '}
              <Link
                href={footerLinkHref}
                className="font-semibold text-primary hover:underline transition-colors cursor-pointer"
              >
                {footerLinkText}
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Atmospheric 3D Showcase Panel (Hidden on small mobile) */}
        <div className="hidden md:flex w-full md:w-[50%] flex-col justify-between rounded-[1.75rem] overflow-hidden bg-slate-950 text-white relative shadow-2xl p-8 lg:p-10 min-h-[540px]">
          {/* Specular hairline on top border */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          {/* Ambient Background Glow */}
          <div
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(99,102,241,0.6) 0%, rgba(14,165,233,0.3) 60%, transparent 100%)',
            }}
          />

          {/* Iridescent Metallic Ribbon Artwork (Replicating CoLabs Highway Speed Curve) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg
              className="w-full h-full opacity-90 object-cover"
              viewBox="0 0 500 600"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <linearGradient id="ribbon1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.9" />
                  <stop offset="35%" stopColor="#c084fc" stopOpacity="0.95" />
                  <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="ribbon2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="specularGleam" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                  <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Deep highway wave ribbon path 1 */}
              <path
                d="M500 50 C380 90, 240 180, 200 280 C160 380, 260 480, 480 500 L500 550 L500 50 Z"
                fill="url(#ribbon2)"
              />

              {/* Main swooping chrome ribbon path */}
              <path
                d="M500 80 C360 120, 180 180, 110 300 C50 400, 100 510, 420 540 C350 450, 260 360, 290 260 C320 180, 420 120, 500 80 Z"
                fill="url(#ribbon1)"
              />

              {/* Specular edge highlight on ribbon apex */}
              <path
                d="M500 82 C360 122, 180 182, 110 302"
                stroke="url(#specularGleam)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Subtle secondary reflective loop */}
              <path
                d="M320 250 C360 210, 460 180, 500 170"
                stroke="url(#specularGleam)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Card Top Navigation / Corner Badge */}
          <div className="relative z-10 flex justify-between items-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300/80 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
              Toyota Sienna Premium
            </span>
            <div className="text-xs text-white/50 font-mono">
              ATM-NG 2026
            </div>
          </div>

          {/* Bottom Editorial Content & Micro Pagination */}
          <div className="relative z-10 pt-20 mt-auto">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white mb-3 text-balance">
              {showcaseHeadline}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed max-w-sm mb-6 text-balance">
              {showcaseCopy}
            </p>

            {/* Pagination micro-dots pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <div className="h-1.5 w-6 rounded-full bg-cyan-400" />
              <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
              <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
