/**
 * Normalises Nigerian phone numbers to E.164 international format (+234...).
 * Supports inputs such as:
 * - "09070000625" -> "+2349070000625"
 * - "+234 907 000 0625" -> "+2349070000625"
 * - "2349070000625" -> "+2349070000625"
 * - "9070000625" -> "+2349070000625"
 */
export function normalisePhone(rawPhone: string): string {
  if (!rawPhone) {
    throw new Error('Phone number is required');
  }

  // Strip all non-digit characters except leading plus
  const cleaned = rawPhone.trim().replace(/[^\d+]/g, '');

  let digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;

  if (digits.startsWith('234')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Valid Nigerian phone numbers have 10 digits after the 0 or +234
  // Valid prefixes start with 7, 8, or 9 (e.g., 070, 080, 081, 090, 091)
  if (!/^[789]\d{9}$/.test(digits)) {
    throw new Error(`Invalid Nigerian phone number format: "${rawPhone}"`);
  }

  return `+234${digits}`;
}

export function isValidNigerianPhone(phone: string): boolean {
  try {
    normalisePhone(phone);
    return true;
  } catch {
    return false;
  }
}
