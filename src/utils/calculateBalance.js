/**
 * Calculate income, expenses, and current balance from a list of transactions.
 *
 * @param {Array<{type: string, amount: number}>} [transactions=[]] - Transaction list; type should be "income" or "expense".
 * @returns {{income: number, expenses: number, currentBalance: number}} Totals with balance = income - expenses.
 *          Unrecognized types are ignored with a warning.
 */
export default function calculateBalance(transactions = []) {
  let income = 0;
  let expenses = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === "income") {
      income += transaction.amount;
    } else if (transaction.type === "expense") {
      expenses += transaction.amount;
    } else {
      // Ignore unrecognized types so future transaction types are not
      // silently miscounted as expenses.
      console.warn("Unknown transaction type ignored:", transaction.type);
    }
  });

  return {
    income,
    expenses,
    currentBalance: income - expenses,
  };
}