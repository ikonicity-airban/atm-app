/**
 * Formats an integer kobo amount into Nigerian Naira (en-NG, ₦).
 * Integer kobo is the sole currency representation across db, models, and services.
 * 
 * Examples:
 * - 3200000 kobo -> "₦32,000"
 * - 3200050 kobo -> "₦32,000.50"
 * - 0 kobo -> "₦0"
 */
export function formatNaira(kobo: number, includeKoboDecimals = false): string {
  if (!Number.isFinite(kobo)) {
    return '₦0';
  }

  const naira = kobo / 100;
  const hasKoboFraction = kobo % 100 !== 0;

  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: includeKoboDecimals || hasKoboFraction ? 2 : 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(naira);
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function koboToNaira(kobo: number): number {
  return kobo / 100;
}
