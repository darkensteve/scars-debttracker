function normalizePhone(phone) {
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

function isValidPhone(phone) {
  const digits = normalizePhone(phone);
  return /^0\d{10}$/.test(digits) || /^\d{10,11}$/.test(digits);
}

module.exports = { normalizePhone, isValidPhone };
