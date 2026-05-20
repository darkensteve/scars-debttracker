export function formatMoney(amount, currency = '₱') {
  const value = Number(amount) || 0;
  return `${currency}${Math.abs(value).toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(isoDate) {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(isoDate) {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const TRANSACTION_LABELS = {
  loan: 'Money lent',
  purchase: 'Bought for them',
  payment: 'Payment received',
};
