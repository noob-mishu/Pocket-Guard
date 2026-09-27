import { netBalances, minTransfers, buildBalancesOverview } from "./groupsUtils";

describe("groupsUtils", () => {
  const members = ["alice@x.com", "bob@x.com", "carol@x.com"];

  it("computes net balances for shared expenses", () => {
    const expenses = [
      { paidBy: "alice@x.com", amount: 300, splitBetween: members }, // each owes 100
      { paidBy: "bob@x.com", amount: 60, splitBetween: ["bob@x.com", "carol@x.com"] }, // carol owes 30
    ];
    const net = netBalances(expenses, members);
    expect(net.get("alice@x.com")).toBeCloseTo(200); // paid 300, owes 100
    expect(net.get("bob@x.com")).toBeCloseTo(-70); // paid 60, owes 100 + 30
    expect(net.get("carol@x.com")).toBeCloseTo(-130); // owes 100 + 30
  });

  it("nettifies into minimal transfers", () => {
    const net = new Map([
      ["alice@x.com", 200],
      ["bob@x.com", -30],
      ["carol@x.com", -170],
    ]);
    const transfers = minTransfers(net);
    // carol -> alice 170, bob -> alice 30
    const total = transfers.reduce((sum, t) => sum + t.amount, 0);
    expect(total).toBeCloseTo(200);
    expect(transfers.every((t) => t.amount > 0)).toBe(true);
    expect(transfers.length).toBeLessThanOrEqual(2);
  });

  it("handles groups with no outstanding balance", () => {
    const net = new Map([
      ["alice@x.com", 0],
      ["bob@x.com", 0],
    ]);
    expect(minTransfers(net)).toEqual([]);
  });

  it("builds a sorted overview", () => {
    const expenses = [{ paidBy: "alice@x.com", amount: 300, splitBetween: members }];
    const rows = buildBalancesOverview(expenses, members);
    expect(rows[0].member).toBe("alice@x.com");
    expect(rows[0].balance).toBeCloseTo(200);
  });
});