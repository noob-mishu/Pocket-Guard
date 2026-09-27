import React from "react";
import { Button } from "antd";
import "./styles.css";

function formatMoney(value) {
  const n = Number(value) || 0;
  return Math.round(n).toLocaleString();
}

function Cards({
    currentBalance,
    income,
    expenses,
    showExpenseModal,
    showIncomeModal,
    reset
  }) {
    return (
        <section className="till-wrap" aria-label="Your till">
          <div className="till-main">
            <p className="till-label">Current balance</p>
            <p className="till-figure">
              <span className="till-mark" aria-hidden="true">৳</span>
              {formatMoney(currentBalance)}
            </p>
            <button className="till-reset" onClick={reset} type="button">
              Delete all transactions
            </button>
          </div>

          <div className="till-stats">
            <div className="till-stat till-stat--in">
              <span>Money in</span>
              <strong className="money">+৳{formatMoney(income)}</strong>
            </div>
            <div className="till-stat till-stat--out">
              <span>Money out</span>
              <strong className="money">−৳{formatMoney(expenses)}</strong>
            </div>
          </div>

          <div className="till-actions">
            <Button className="btn till-btn" onClick={showExpenseModal}>
              Add expense
            </Button>
            <Button className="btn btn-blue till-btn" onClick={showIncomeModal}>
              Add income
            </Button>
          </div>
        </section>
    );
}

export default Cards;