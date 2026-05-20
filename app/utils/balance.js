export function balanceDelta(type, amount) {
  const value = Number(amount) || 0;
  if (type === 'payment') {
    return -value;
  }
  return value;
}

export function contactBalance(transactions, contactId) {
  return transactions
    .filter((t) => t.contactId === contactId)
    .reduce((sum, t) => sum + balanceDelta(t.type, t.amount), 0);
}

export function totalOwed(transactions, contacts) {
  return contacts.reduce(
    (sum, contact) => sum + Math.max(0, contactBalance(transactions, contact.id)),
    0
  );
}
