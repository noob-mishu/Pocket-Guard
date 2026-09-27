import calculateBalance from "./calculateBalance";

describe("calculateBalance", () => {
  it("returns zero for no transactions", () => {
    expect(calculateBalance([])).toEqual({
      income: 0,
      expenses: 0,
      currentBalance: 0,
    });
  });

  it("handles income-only transactions", () => {
    const result = calculateBalance([
      { type: "income", amount: 1000 },
      { type: "income", amount: 500 },
    ]);
    expect(result.income).toBe(1500);
    expect(result.expenses).toBe(0);
    expect(result.currentBalance).toBe(1500);
  });

  it("handles expense-only transactions", () => {
    const result = calculateBalance([
      { type: "expense", amount: 200 },
      { type: "expense", amount: 300 },
    ]);
    expect(result.income).toBe(0);
    expect(result.expenses).toBe(500);
    expect(result.currentBalance).toBe(-500);
  });

  it("handles mixed income and expense transactions", () => {
    const result = calculateBalance([
      { type: "income", amount: 1000 },
      { type: "expense", amount: 400 },
      { type: "income", amount: 100 },
    ]);
    expect(result.income).toBe(1100);
    expect(result.expenses).toBe(400);
    expect(result.currentBalance).toBe(700);
  });

  it("ignores unknown transaction types instead of counting them as expenses", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const result = calculateBalance([
      { type: "transfer", amount: 9999 },
      { type: "income", amount: 100 },
      { type: "expense", amount: 40 },
    ]);
    expect(result.income).toBe(100);
    expect(result.expenses).toBe(40);
    expect(result.currentBalance).toBe(60);
    warnSpy.mockRestore();
  });
});