import React from 'react';
import {
  normalisePhone,
  isValidNigerianPhone,
  formatNaira,
  type TripStatus,
  type BookingStatus,
  type ParcelStatus,
} from '@atm/shared';
import {
  Phone,
  ExternalLink,
  MessageCircle,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils.ts';
import type { Terminal } from '../../server/repositories/terminals.ts';
import type { RouteDetail } from '../../server/repositories/routes.ts';
import { Badge, type BadgeProps } from '../ui/Badge.tsx';

/**
 * 1. PhoneInput: Nigeria (+234) formatted phone input
 */
export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  hasError?: boolean;
  errorMessage?: string;
  helpText?: string;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  label = 'Phone Number',
  placeholder = '09070000625 or 0803...',
  hasError = false,
  errorMessage,
  helpText,
  className,
}: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const isCompleteAndValid = isValidNigerianPhone(value);

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
      )}
      <div className="relative flex rounded-md">
        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-xs font-mono">
          +234
        </span>
        <input
          type="tel"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            'flex-1 min-w-0 block w-full px-3 py-2.5 text-sm rounded-none rounded-r-md border bg-card text-foreground min-h-[44px]',
            'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            hasError
              ? 'border-destructive focus-visible:ring-destructive'
              : 'border-input focus-visible:border-primary focus-visible:ring-primary'
          )}
        />
      </div>
      {isCompleteAndValid && (
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
          Normalised: {normalisePhone(value)}
        </p>
      )}
      {errorMessage && (
        <p className="text-xs text-destructive font-medium mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

/**
 * 2. MoneyText: Formats integer kobo to en-NG currency
 * When isPlaceholder is true and in production, renders "Fare confirmed at booking".
 */
export function MoneyText({
  kobo,
  isPlaceholder = false,
  className,
}: {
  kobo: number | null | undefined;
  isPlaceholder?: boolean;
  className?: string;
}) {
  const isProd = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';
  if (isPlaceholder && isProd) {
    return <span className={cn('text-xs text-muted-foreground font-medium', className)}>Fare confirmed at booking</span>;
  }
  if (kobo == null) return <span className={className}>—</span>;
  return <span className={cn('font-bold tracking-tight', className)}>{formatNaira(kobo)}</span>;
}

/**
 * 3. TimeText: Displays time in Africa/Lagos timezone
 */
export function TimeText({
  utcDateString,
  format = 'long',
  className,
}: {
  utcDateString: string;
  format?: 'short' | 'long';
  className?: string;
}) {
  try {
    const d = new Date(utcDateString);
    const options: Intl.DateTimeFormatOptions =
      format === 'long'
        ? {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Africa/Lagos',
          }
        : {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Africa/Lagos',
          };
    const formatted = new Intl.DateTimeFormat('en-GB', options).format(d);
    return <span className={className}>{formatted} WAT</span>;
  } catch {
    return <span className={className}>{utcDateString}</span>;
  }
}

/**
 * 4. Stepper: Linear stage indicator
 */
export function Stepper({
  steps,
  currentStep,
  className,
}: {
  steps: string[];
  currentStep: number;
  className?: string;
}) {
  return (
    <nav aria-label="Progress" className={cn('py-2', className)}>
      <ol className="flex items-center">
        {steps.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;
          return (
            <li key={step} className="flex-1 flex items-center">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/20'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isDone ? '✓' : idx + 1}
                </span>
                <span
                  className={cn(
                    'text-xs hidden sm:inline font-medium',
                    isCurrent ? 'text-foreground font-bold' : 'text-muted-foreground'
                  )}
                >
                  {step}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-3',
                    idx < currentStep ? 'bg-emerald-500' : 'bg-border'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * 5. StatusBadge: Semantic status pill (used inside tables/cards to label state, NEVER on titles)
 * Wraps Badge primitive with brand status mapping.
 */
export function StatusBadge({
  status,
  className,
}: {
  status: TripStatus | BookingStatus | ParcelStatus | string;
  className?: string;
}) {
  const statusToVariant: Record<string, NonNullable<BadgeProps['variant']>> = {
    scheduled: 'info',
    boarding: 'warning',
    in_transit: 'secondary',
    arrived_at_destination: 'info',
    delivered: 'success',
    completed: 'success',
    confirmed: 'success',
    held: 'warning',
    cancelled: 'destructive',
    failed: 'destructive',
  };

  const variant = statusToVariant[status] ?? 'outline';
  const label = status.replace(/_/g, ' ');

  return (
    <Badge variant={variant} className={cn('uppercase tracking-wider text-[11px]', className)}>
      {label}
    </Badge>
  );
}

/**
 * 6. PageHeader: HARD BAN ENFORCEMENT.
 * Titles are plain typography on background (no pill, badge, chip, or card wrapping the title!).
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('py-8 border-b border-border', className)}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3 pt-2 md:pt-0">{actions}</div>}
      </div>
    </div>
  );
}

/**
 * 7. SectionBanner: Brand purple/magenta text block for important travel guidelines
 */
export function SectionBanner({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-primary text-primary-foreground p-6 sm:p-8 rounded-xl shadow-xs',
        className
      )}
    >
      <h3 className="text-lg sm:text-xl font-bold tracking-tight text-primary-foreground mb-2">
        {title}
      </h3>
      <div className="text-xs sm:text-sm text-primary-foreground/90 leading-relaxed max-w-3xl">
        {children}
      </div>
    </div>
  );
}

/**
 * 8. TerminalCard: Official terminal address, direct tap-to-call, and plain Google Maps directions link
 */
export function TerminalCard({
  terminal,
  className,
}: {
  terminal: Terminal;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'p-5 border border-border rounded-xl bg-card text-card-foreground shadow-xs flex flex-col justify-between space-y-4',
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-foreground text-base">{terminal.name}</span>
          <span className="text-[11px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border">
            {terminal.code}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <span>{terminal.address}</span>
        </p>
      </div>

      <div className="pt-3 border-t border-border space-y-2">
        <div className="flex flex-wrap gap-2 text-xs">
          {terminal.phones.map((phone) => (
            <a
              key={phone}
              href={`tel:${phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 border border-border font-medium min-h-[44px]"
            >
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span>{phone}</span>
            </a>
          ))}
        </div>

        <div>
          <a
            href={terminal.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-semibold min-h-[36px]"
          >
            <span>Get Directions (Google Maps)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * 9. RouteCard: Overview card for route listing
 */
export function RouteCard({
  route,
  onSelect,
  className,
}: {
  route: RouteDetail;
  onSelect?: () => void;
  className?: string;
}) {
  const isProd = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';
  const showMetrics = !(route.isPlaceholder && isProd);

  return (
    <div
      className={cn(
        'p-5 border border-border rounded-xl bg-card text-card-foreground shadow-xs flex flex-col justify-between space-y-4 hover:border-border/80 transition-colors',
        className
      )}
    >
      <div>
        {showMetrics && (
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{route.durationHours} hrs estimated</span>
            <span>{route.distanceKm} km</span>
          </div>
        )}
        <h3 className="text-lg font-bold text-foreground tracking-tight">
          {route.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {route.description}
        </p>
      </div>

      <div className="pt-3 border-t border-border flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Fare</span>
          {route.baseFareKobo ? (
            <div className="text-base font-bold text-foreground">
              <MoneyText kobo={route.baseFareKobo} isPlaceholder={route.isPlaceholder} />
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">Call for current rate</span>
          )}
        </div>

        <button
          type="button"
          onClick={onSelect}
          className="px-3.5 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg min-h-[44px] flex items-center gap-1.5 cursor-pointer"
        >
          <span>View Route</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/**
 * 10. VehicleCard: Toyota Sienna, 5 seats, A/C, extra legroom, refreshments.
 */
export function VehicleCard({ className }: { className?: string }) {
  return (
    <div className={cn('p-5 border border-border rounded-xl bg-card text-card-foreground shadow-xs space-y-4', className)}>
      <div className="w-full h-36 bg-muted rounded-lg flex items-center justify-center overflow-hidden border border-border">
        <img
          src="/placeholder-vehicle.svg"
          alt="Toyota Sienna Fleet"
          className="w-full h-full object-contain"
        />
      </div>
      <div>
        <h4 className="font-bold text-foreground text-sm">
          Toyota Sienna
        </h4>
        <p className="text-xs text-muted-foreground mt-0.5">
          Toyota Sienna, 5 seats, A/C, extra legroom, refreshments.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-foreground">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>5 Seats</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Air Conditioning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Extra Legroom</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Refreshments</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 11. WhatsAppButton & CallButton
 */
export function WhatsAppButton({
  phone = '2349070000625',
  message = 'Hello Ascent Transport Management, I would like to inquire about booking a trip.',
  className,
}: {
  phone?: string;
  message?: string;
  className?: string;
}) {
  const url = `https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors min-h-[44px]',
        className
      )}
    >
      <MessageCircle className="w-4 h-4" />
      <span>Chat on WhatsApp</span>
    </a>
  );
}

export function CallButton({
  phone,
  label = 'Call Terminal',
  className,
}: {
  phone: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={`tel:${phone}`}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-foreground text-background font-semibold text-xs hover:bg-foreground/90 transition-colors min-h-[44px]',
        className
      )}
    >
      <Phone className="w-4 h-4" />
      <span>{label}</span>
    </a>
  );
}

/**
 * 12. EmptyState & ErrorState
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('py-12 px-4 text-center border border-border rounded-xl bg-muted/40 text-foreground', className)}>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Unable to complete your request. Please try again or call our terminal helpline.',
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('p-6 text-center border border-destructive/25 rounded-xl bg-destructive/10 text-destructive', className)}>
      <AlertCircle className="w-6 h-6 text-destructive mx-auto mb-2" />
      <h3 className="text-sm font-bold">{title}</h3>
      <p className="text-xs text-destructive/80 mt-1 max-w-sm mx-auto">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 px-4 py-2 text-xs font-bold text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-lg min-h-[44px]"
        >
          Retry
        </button>
      )}
    </div>
  );
}
