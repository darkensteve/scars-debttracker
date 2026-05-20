function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Week starts Monday (local time). */
function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - daysFromMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function txDate(iso) {
  return new Date(iso);
}

export function getPaidTodayStats(transactions) {
  const todayStart = startOfToday();
  const paymentsToday = transactions.filter(
    (t) => t.type === 'payment' && txDate(t.date) >= todayStart
  );
  const people = new Set(paymentsToday.map((t) => t.contactId));
  const amount = paymentsToday.reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    peopleCount: people.size,
    amount,
  };
}

export function getCollectedThisWeek(transactions) {
  const weekStart = startOfWeek();
  return transactions
    .filter((t) => t.type === 'payment' && txDate(t.date) >= weekStart)
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

/** Open balance and no payment recorded since Monday. */
export function getStillDueThisWeekCount(contacts, transactions, contactBalance) {
  const weekStart = startOfWeek();
  const paidThisWeek = new Set(
    transactions
      .filter((t) => t.type === 'payment' && txDate(t.date) >= weekStart)
      .map((t) => t.contactId)
  );

  return contacts.filter(
    (c) => contactBalance(c.id) > 0 && !paidThisWeek.has(c.id)
  ).length;
}
