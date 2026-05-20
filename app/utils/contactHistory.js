export function getContactHistorySummary(transactions, contact) {
  const chronological = [...transactions].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const firstLending = chronological.find(
    (t) => t.type === 'loan' || t.type === 'purchase'
  );
  const firstAny = chronological[0];

  const startedLendingOn =
    firstLending?.date || firstAny?.date || contact?.createdAt || null;

  const addedOn = contact?.createdAt || startedLendingOn;

  let totalLent = 0;
  let totalPaid = 0;

  for (const t of transactions) {
    const amount = Number(t.amount) || 0;
    if (t.type === 'payment') {
      totalPaid += amount;
    } else {
      totalLent += amount;
    }
  }

  return {
    chronological,
    startedLendingOn,
    addedOn,
    totalLent,
    totalPaid,
    transactionCount: transactions.length,
  };
}
