/** Normalize to digits only; PH numbers often start with 63 or 0. */
export function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('63') && digits.length >= 12) {
    digits = '0' + digits.slice(2);
  }
  if (digits.length === 10 && !digits.startsWith('0')) {
    digits = '0' + digits;
  }
  return digits;
}

export function isValidPhone(phone) {
  const digits = normalizePhone(phone);
  return /^0\d{10}$/.test(digits) || /^\d{10,11}$/.test(digits);
}

export function formatPhoneHint() {
  return 'Use your real mobile number (e.g. 09171234567). Needed if you forget your PIN.';
}
