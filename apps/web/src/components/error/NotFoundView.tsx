'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Compass,
  ArrowRight,
  Truck,
  Car,
  Package,
  MessageSquare,
} from 'lucide-react';
import { BRAND } from '@atm/shared';
import { buttonVariants } from '../ui/Button.tsx';
import { Icon } from '../ui/Icon.tsx';

export interface TravelCorridor {
  from: string;
  to: string;
  label: string;
  departureTime?: string;
}

export interface ServiceJumpPoint {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NotFoundViewProps {
  title?: string;
  description?: string;
  showConcierge?: boolean;
  homeHref?: string;
  corridors?: TravelCorridor[];
  jumpPoints?: ServiceJumpPoint[];
  className?: string;
}

const DEFAULT_CORRIDORS: TravelCorridor[] = [
  { from: 'Lagos', to: 'Abuja', label: 'Lagos to Abuja' },
  { from: 'Port Harcourt', to: 'Owerri', label: 'Port Harcourt to Owerri' },
  { from: 'Lagos', to: 'Benin', label: 'Lagos to Benin' },
  { from: 'Enugu', to: 'Abuja', label: 'Enugu to Abuja' },
];

const DEFAULT_JUMP_POINTS: ServiceJumpPoint[] = [
  { label: 'Trip Search', href: '/trips', icon: Search },
  { label: 'Parcel Tracking', href: '/track', icon: Package },
  { label: 'Courier Logistics', href: '/courier', icon: Truck },
  { label: 'Vehicle Charter', href: '/charter', icon: Car },
];

export function NotFoundView({
  title = 'Route Not Found',
  description = 'The travel route, terminal page, or dispatch record you requested could not be located on the ATM network.',
  showConcierge = true,
  homeHref = '/',
  corridors = DEFAULT_CORRIDORS,
  jumpPoints = DEFAULT_JUMP_POINTS,
  className = '',
}: NotFoundViewProps) {
  const pathname = usePathname();
  const supportPhone = (BRAND.contactPhones && BRAND.contactPhones[0]) || '2349070000625';
  const cleanPhone = supportPhone.replace(/[^0-9]/g, '');

  const waMessage = encodeURIComponent(
    `Hello Ascent Transport Management, I encountered a 404 page at ${pathname || 'unknown route'}. Please assist me with my journey.`
  );
  const waUrl = `https://wa.me/${cleanPhone}?text=${waMessage}`;

  return (
    <div className={`w-full max-w-4xl mx-auto px-4 py-12 md:py-20 ${className}`}>
      {/* Detour Spatial Waypoint Illustration */}
      <div className="flex justify-center mb-8">
        <div className="relative w-36 h-28 flex items-center justify-center">
          <svg
            className="w-full h-full text-primary"
            viewBox="0 0 160 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Main transit highway path */}
            <path
              d="M10 90 C 50 90, 60 40, 110 40 C 130 40, 145 55, 150 70"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="6 6"
              className="opacity-40"
            />
            {/* Detour branch */}
            <path
              d="M60 65 C 75 95, 105 105, 140 100"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="opacity-70"
            />
            {/* Waypoint circle */}
            <circle cx="60" cy="65" r="7" className="fill-primary" />
            <circle cx="60" cy="65" r="14" className="stroke-primary opacity-30" strokeWidth="2" />
            {/* Destination marker with cross */}
            <circle cx="140" cy="100" r="6" className="fill-destructive" />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <span className="text-4xl font-extrabold tracking-tighter text-foreground font-mono">
              404
            </span>
          </div>
        </div>
      </div>

      {/* Unbadged Title & Direct Subtext */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          {title}
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {description}
        </p>

        {/* Primary Action Button */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={homeHref}
            className={buttonVariants({ variant: 'default', size: 'default' })}
          >
            <Icon icon={Home} className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
          <Link
            href="/trips"
            className={buttonVariants({ variant: 'outline', size: 'default' })}
          >
            <Icon icon={Search} className="w-4 h-4" />
            <span>Search Departures</span>
          </Link>
        </div>
      </div>

      {/* Executive Travel Concierge */}
      {showConcierge && (
        <div className="mt-12 pt-8 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Popular Corridors */}
          <div className="glass-card-spatial p-6 rounded-2xl bg-card/90">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Icon icon={Compass} className="w-4 h-4 text-primary" />
              <span>Popular Intercity Corridors</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {corridors.map((c) => (
                <Link
                  key={`${c.from}-${c.to}`}
                  href={`/trips?from=${encodeURIComponent(c.from)}&to=${encodeURIComponent(c.to)}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-colors text-xs font-medium group"
                >
                  <span className="truncate">{c.label}</span>
                  <Icon
                    icon={ArrowRight}
                    className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Service Jump Points & Emergency WhatsApp Assistance */}
          <div className="glass-card-spatial p-6 rounded-2xl bg-card/90 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <Icon icon={Truck} className="w-4 h-4 text-primary" />
                <span>ATM Express Services</span>
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {jumpPoints.map((j) => (
                  <Link
                    key={j.href}
                    href={j.href}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-colors text-xs font-medium"
                  >
                    <Icon icon={j.icon} className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{j.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* WhatsApp Support Helpdesk */}
            <div className="mt-6 pt-4 border-t border-border/80 flex items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Need immediate travel help?</p>
                <p>Speak directly with our 24/7 terminal dispatch desk.</p>
              </div>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'secondary', size: 'sm' })}
              >
                <Icon icon={MessageSquare} className="w-3.5 h-3.5 text-success" />
                <span>WhatsApp Desk</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
