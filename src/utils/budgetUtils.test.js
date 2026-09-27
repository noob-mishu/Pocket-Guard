import { budgetProjection } from "./budgetUtils";
import dayjs from "./dayjs";

const BASE_DATE = "2026-11-15";
// Tests simulate a fixed "today" so projection math is deterministic.
const MONTH = "2026-11";
const NOW = dayjs(BASE_DATE);

function makeTx(tag, date, amount) {
  return { type: "expense", tag, date, amount };
}

describe("budgetProjection", () => {
  it("computes spent and pct for the month", () => {
    const txs = [
      makeTx("food", "2026-11-02", 100),
      makeTx("food", "2026-11-10", 50),
      makeTx("transport", "2026-11-10", 999), // ignored category
      makeTx("income", "2026-11-10", 9999), // ignored type
    ];
    const result = budgetProjection(txs, "food", MONTH, 200, NOW);
    expect(result.spent).toBe(150);
    expect(result.limit).toBe(200);
    expect(result.pct).toBe(75);
  });

  it("flags projected overspend when daily rate is high", () => {
    // 20 days into the month, already spending 200/day against a 1000 limit
    // will clearly exhaust the limit before month end.
    const txs = Array.from({ length: 20 }, (_, i) =>
      makeTx("food", `2026-11-${String(i + 1).padStart(2, "0")}`, 200)
    );
    const result = budgetProjection(txs, "food", MONTH, 1000, NOW);
    expect(result.onTrackToOverspend).toBe(true);
    expect(result.remainingDays).toBeGreaterThan(0);
  });

  it("does not flag overspend for a low daily rate", () => {
    const txs = [makeTx("food", "2026-11-01", 50)];
    const result = budgetProjection(txs, "food", MONTH, 1000, NOW);
    expect(result.onTrackToOverspend).toBe(false);
  });

  it("handles zero spent and zero limit without dividing by zero", () => {
    const result = budgetProjection([], "food", MONTH, 0, NOW);
    expect(result.spent).toBe(0);
    expect(result.pct).toBe(0);
    expect(result.onTrackToOverspend).toBe(false);
  });

  it("ignores transactions outside the month", () => {
    const txs = [makeTx("food", "2026-10-30", 500)];
    const result = budgetProjection(txs, "food", MONTH, 300, NOW);
    expect(result.spent).toBe(0);
  });
});