import React, { useState } from "react";
import { Button, Input } from "antd";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { parseQuery, CATEGORY_LABELS } from "../../utils/queryParser";

const COLORS = ["#E2136E", "#0E6E5C", "#B4860F", "#1B1712", "#6B5B93", "#B3261E", "#3A7CA5"];

const RANGE_LABELS = {
  "this month": "this month",
  "last month": "last month",
  "this week": "this week",
  "last week": "last week",
  today: "today",
  yesterday: "yesterday",
};

function inRange(dateStr, range) {
  return dateStr >= range.from && dateStr <= range.to;
}

function rangeLabelFor(constraints) {
  return RANGE_LABELS[constraints.rangeLabel] || "that period";
}

function summarizeSpending(txns, range) {
  return txns
    .filter((t) => t.type === "expense" && inRange(t.date, range))
    .reduce((acc, t) => {
      acc.total += t.amount;
      const tag = t.tag || "other";
      acc.byTag[tag] = (acc.byTag[tag] || 0) + t.amount;
      return acc;
    }, { total: 0, byTag: {} });
}

function formatMoney(n) {
  return "৳" + Math.round(n).toLocaleString();
}

const HELP_TEXT =
  'Try questions like:\n• "spending this month"\n• "food vs transport"\n• "biggest expense last week"\n• "spending today"';

function MoneyAssistant({ transactions }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  function textAnswer(rangeLabel, total, hasSpend) {
    if (!hasSpend) {
      return `No spending found ${rangeLabel}.`;
    }
    return `You spent ${formatMoney(total)} spending ${rangeLabel}.`;
  }

  function chart(a) {
    if (a.intent === "compare") {
      return (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={a.compareData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#E2136E" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (a.pieData && a.pieData.length) {
      return (
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={a.pieData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={60}>
              {a.pieData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    return null;
  }

  function answer(question) {
    const parsed = parseQuery(question);

    if (parsed.intent === "unknown") {
      setMessages((prev) => [...prev, { role: "assistant", text: HELP_TEXT }]);
      return;
    }

    const range = parsed.range;
    const rangeLabel = rangeLabelFor(parsed);
    const summary = summarizeSpending(transactions, range);
    const hasSpend = Object.keys(summary.byTag).length > 0;

    if (parsed.intent === "spending") {
      const pieData = Object.entries(summary.byTag).map(([name, value]) => ({
        name: CATEGORY_LABELS[name] || name,
        value,
      }));
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: textAnswer(rangeLabel, summary.total, hasSpend),
          chart: chart({ intent: "spending", pieData }),
        },
      ]);
      return;
    }

    if (parsed.intent === "compare") {
      if (parsed.categories.length < 2) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "Tell me two categories to compare, e.g. \"food vs transport\"." },
        ]);
        return;
      }
      const [catA, catB] = parsed.categories;
      const valueA = summary.byTag[catA] || 0;
      const valueB = summary.byTag[catB] || 0;
      const compareData = [
        { name: CATEGORY_LABELS[catA] || catA, total: valueA },
        { name: CATEGORY_LABELS[catB] || catB, total: valueB },
      ];
      const text =
        valueA > valueB
          ? `You spent more on ${CATEGORY_LABELS[catA]} (${formatMoney(valueA)}) than ${CATEGORY_LABELS[catB]} (${formatMoney(valueB)}) ${rangeLabel}.`
          : valueB > valueA
          ? `You spent more on ${CATEGORY_LABELS[catB]} (${formatMoney(valueB)}) than ${CATEGORY_LABELS[catA]} (${formatMoney(valueA)}) ${rangeLabel}.`
          : `You spent the same (${formatMoney(valueA)}) on both ${CATEGORY_LABELS[catA]} and ${CATEGORY_LABELS[catB]} ${rangeLabel}.`;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text, chart: chart({ intent: "compare", compareData }) },
      ]);
      return;
    }

    if (parsed.intent === "biggest") {
      const expenses = transactions.filter(
        (t) => t.type === "expense" && inRange(t.date, range)
      );
      expenses.sort((a, b) => b.amount - a.amount);
      const top = expenses.slice(0, 3);
      if (top.length === 0) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: `No expenses found ${rangeLabel}.` },
        ]);
        return;
      }
      const pieData = top.map((t) => ({ name: t.name || "Untitled", value: t.amount }));
      const lines = top
        .map((t, i) => `${i + 1}. ${t.name || "Untitled"} — ${formatMoney(t.amount)}`)
        .join("\n");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Biggest expense${rangeLabel === "that period" ? "" : ` ${rangeLabel}`}:\n${lines}`, chart: chart({ intent: "biggest", pieData }) },
      ]);
      return;
    }

    if (parsed.intent === "average") {
      const days =
        Math.max(
          1,
          Math.round(
            (new Date(range.to) - new Date(range.from)) / (1000 * 60 * 60 * 24)
          ) + 1
        );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Average daily spending was ${formatMoney(summary.total / days)} ${rangeLabel}.`,
        },
      ]);
      return;
    }

    setMessages((prev) => [...prev, { role: "assistant", text: HELP_TEXT }]);
  }

  function send() {
    const question = input.trim();
    if (!question) return;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    answer(question);
  }

  return (
    <>
      {open && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 76,
            width: 340,
            maxWidth: "calc(100vw - 40px)",
            background: "var(--surface)",
            borderRadius: 14,
            boxShadow: "0 14px 34px -18px rgba(27,23,18,0.55)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            maxHeight: 480,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "0.75rem 1rem",
              fontWeight: 700,
              background: "var(--theme)",
              color: "#fff",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Ask Your Money</span>
            <span style={{ cursor: "pointer" }} onClick={() => setOpen(false)}>
              ✕
            </span>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {messages.length === 0 && (
              <p style={{ whiteSpace: "pre-line", color: "var(--muted)", fontSize: 13 }}>
                {HELP_TEXT}
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  background: m.role === "user" ? "var(--theme)" : "var(--paper-deep)",
                  color: m.role === "user" ? "#fff" : "var(--ink)",
                  borderRadius: 10,
                  padding: "0.5rem 0.75rem",
                  maxWidth: "90%",
                  whiteSpace: "pre-line",
                  fontSize: 13,
                }}
              >
                {m.text}
                {m.chart}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", padding: "0.75rem", borderTop: "1px solid var(--line)" }}>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={send}
              placeholder="Ask about your money…"
            />
            <Button className="btn btn-blue" onClick={send}>
              Ask
            </Button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          width: 52,
          height: 52,
          borderRadius: 26,
          border: "none",
          background: "var(--theme)",
          color: "#fff",
          fontFamily: "var(--font-display)",
          fontSize: 24,
          lineHeight: 1,
          cursor: "pointer",
          boxShadow: "0 8px 20px -8px rgba(226,19,110,0.55)",
          zIndex: 1000,
        }}
        aria-label="Ask Your Money"
      >
        {open ? "✕" : "৳"}
      </button>
    </>
  );
}

export default MoneyAssistant;