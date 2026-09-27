import React from "react";
import { render, screen } from "@testing-library/react";
import TransactionsTable from "./index";

jest.mock("../../../firebase", () => ({
  db: {},
}));

describe("TransactionsTable", () => {
  it("renders heading and CSV buttons with an empty transaction list", () => {
    render(<TransactionsTable transactions={[]} />);
    expect(screen.getByText("My Transactions")).toBeInTheDocument();
    expect(screen.getByText("Export to CSV")).toBeInTheDocument();
    expect(screen.getByText("Import from CSV")).toBeInTheDocument();
  });

  it("renders malformed transaction data without crashing", () => {
    render(
      <TransactionsTable
        transactions={[{ type: "expense" }, { name: undefined, amount: 10 }]}
      />
    );
    expect(screen.getByText("My Transactions")).toBeInTheDocument();
  });
});