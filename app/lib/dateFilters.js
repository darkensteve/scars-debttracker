export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** ISO string at local midnight — use for transaction / lending dates. */
export function toTransactionDateISO(date) {
  if (!date) return new Date().toISOString();
  return startOfDay(date).toISOString();
}

export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function formatFilterDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isInPresetRange(dateISO, key) {
  if (key === 'all' || key === 'custom') return true;
  const d = new Date(dateISO);
  const now = new Date();
  if (key === 'today') {
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }
  if (key === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return d >= start;
  }
  if (key === 'month') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  if (key === 'lastmonth') {
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth();
  }
  return true;
}

export function isInCustomRange(dateISO, fromDate, toDate) {
  if (!fromDate) return false;
  const d = new Date(dateISO);
  let from = startOfDay(fromDate);
  let to = endOfDay(toDate || fromDate);
  if (from > to) {
    const swap = from;
    from = startOfDay(toDate || fromDate);
    to = endOfDay(swap);
  }
  return d >= from && d <= to;
}

/** Parse YYYY-MM-DD for web text input */
export function parseDateInput(text) {
  const trimmed = text.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toDateInputValue(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
