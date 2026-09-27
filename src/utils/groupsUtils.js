const EPSILON = 0.001;

// expense: { paidBy, amount, splitBetween: [member, ...] }
// Returns a Map of member -> net balance (positive = is owed money).
export function netBalances(expenses, members) {
  const net = new Map();
  members.forEach((member) => net.set(member, 0));

  expenses.forEach((expense) => {
    if (!expense.splitBetween || expense.splitBetween.length === 0) return;
    const share = expense.amount / expense.splitBetween.length;
    expense.splitBetween.forEach((member) => {
      net.set(member, (net.get(member) || 0) - share);
    });
    if (expense.paidBy && net.has(expense.paidBy)) {
      net.set(expense.paidBy, net.get(expense.paidBy) + expense.amount);
    }
  });

  return net;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

// Greedy debt-simplification: pairs largest debtor with largest creditor,
// producing the minimal number of settle-up transfers.
export function minTransfers(net) {
  const debtors = [];
  const creditors = [];

  net.forEach((balance, member) => {
    if (balance < -EPSILON) {
      debtors.push({ member, amount: -balance });
    } else if (balance > EPSILON) {
      creditors.push({ member, amount: balance });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > EPSILON) {
      transfers.push({ from: debtors[i].member, to: creditors[j].member, amount: round2(amount) });
    }
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount <= EPSILON) i += 1;
    if (creditors[j].amount <= EPSILON) j += 1;
  }

  return transfers;
}

export function buildBalancesOverview(expenses, members) {
  const net = netBalances(expenses, members);
  const rows = [];
  net.forEach((balance, member) => {
    rows.push({ member, balance: round2(balance) });
  });
  return rows.sort((a, b) => b.balance - a.balance);
}

// Combines expense balances with recorded settlements to produce net balances.
// settlement shape: { from, to, amount } (from paid `amount` to `to`).
// Positive balance = member is owed money overall.
export function computeBalances(expenses, settlements, members) {
  const balances = netBalances(expenses, members);
  (settlements || []).forEach((s) => {
    if (!s || !s.from || !s.to || !(s.amount > 0)) return;
    if (balances.has(s.from)) {
      balances.set(s.from, balances.get(s.from) + s.amount);
    }
    if (balances.has(s.to)) {
      balances.set(s.to, balances.get(s.to) - s.amount);
    }
  });
  return balances;
}