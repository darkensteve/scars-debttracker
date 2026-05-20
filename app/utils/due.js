export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date, months) {
  const d = new Date(date);
  const dayOfMonth = d.getDate();
  d.setMonth(d.getMonth() + months);
  // If month rollover changed day (e.g. Jan 31 -> Mar 3), clamp by walking back.
  while (d.getDate() < dayOfMonth) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

export function computeDueDateISO({ type, createdAtISO }) {
  if (!createdAtISO) return null;
  const base = new Date(createdAtISO);
  if (Number.isNaN(base.getTime())) return null;

  if (type === 'loan') {
    return addMonths(base, 2).toISOString();
  }
  if (type === 'purchase') {
    return addDays(base, 7).toISOString();
  }
  return null;
}

