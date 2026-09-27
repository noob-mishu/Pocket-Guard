import React, { useEffect } from "react";
import { Card, Progress, Tag } from "antd";
import { toast } from "react-toastify";
import { budgetProjection } from "../../utils/budgetUtils";
import { expenseTagLabel } from "../../utils/tags";

// Session-scoped: a category only warns once at >=80% per page load.
const warnedCategories = new Set();

function BudgetCard({ category, limit, month, transactions }) {
  const result = budgetProjection(transactions, category, month, limit);

  useEffect(() => {
    if (
      limit > 0 &&
      result.spent / limit >= 0.8 &&
      !warnedCategories.has(category)
    ) {
      warnedCategories.add(category);
      toast.warn(
        `You've used ${Math.round((result.spent / limit) * 100)}% of your ${expenseTagLabel(category)} budget for this month.`
      );
    }
  }, [result.spent, limit, category]);

  return (
    <Card className="my-card" style={{ minWidth: 220 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{expenseTagLabel(category)}</h3>
        {result.onTrackToOverspend && (
          <Tag color="orange" style={{ margin: 0 }}>
            On track to overspend by ~{Math.max(Math.round(result.projected - result.limit), 0)}
          </Tag>
        )}
      </div>
      <Progress
        percent={Math.round(result.pct)}
        status={result.pct >= 100 ? "exception" : "active"}
      />
      <p style={{ margin: 0 }}>
        {result.spent} / {result.limit} spent this month
      </p>
      <p style={{ margin: 0, color: "var(--muted)" }}>
        Projected at month end: {Math.round(result.projected)}
      </p>
    </Card>
  );
}

export default BudgetCard;