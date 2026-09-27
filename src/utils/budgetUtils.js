import dayjs from "./dayjs";

// transaction: { type, date: 'YYYY-MM-DD', amount, tag, ... }
// `now` is injectable (dayjs) for deterministic tests; defaults to the real clock.
// Returns { spent, limit, projected, pct, remainingDays, onTrackToOverspend, month }
export function budgetProjection(transactions, category, month, limit, now = dayjs()) {
  const monthLabel = dayjs(month, "YYYY-MM").format("YYYY-MM");

  const spent = (transactions || [])
    .filter(
      (t) =>
        t.type === "expense" &&
        t.tag === category &&
        t.date &&
        t.date.slice(0, 7) === monthLabel
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const daysInMonth = dayjs(monthLabel, "YYYY-MM").daysInMonth();
  const isCurrentMonth = monthLabel === now.format("YYYY-MM");
  const dayOfMonth = isCurrentMonth
    ? Math.min(now.date(), daysInMonth)
    : daysInMonth;

  const dailyRate = dayOfMonth > 0 ? spent / dayOfMonth : 0;
  const remainingDays = Math.max(daysInMonth - dayOfMonth, 0);
  const projected = spent + dailyRate * remainingDays;

  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

  return {
    spent,
    limit,
    projected,
    pct,
    remainingDays,
    onTrackToOverspend: limit > 0 && projected > limit,
    month: monthLabel,
  };
}